/**
 * Configures Stripe for TextReach from .env + Stripe API.
 * - Resolves price IDs for TextReach Starter/Growth/Pro
 * - Optionally registers a remote webhook (TWILIO_WEBHOOK_BASE_URL)
 *
 * Usage: npx tsx scripts/setup-stripe.ts
 */
import { readFileSync, writeFileSync } from "fs";
import Stripe from "stripe";

function loadEnv() {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

function upsertEnv(key: string, value: string) {
  const path = ".env";
  const lines = readFileSync(path, "utf8").split("\n");
  let found = false;
  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) updated.push(`${key}=${value}`);
  writeFileSync(path, updated.join("\n"));
}

const PRODUCT_NAMES: Record<string, string> = {
  STRIPE_PRICE_STARTER: "TextReach Starter",
  STRIPE_PRICE_GROWTH: "TextReach Growth",
  STRIPE_PRICE_PRO: "TextReach Pro",
};

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
] as Stripe.WebhookEndpointCreateParams["enabled_events"];

async function main() {
  loadEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY in .env");
    console.error("Run: stripe login  (or paste sk_test_... from Dashboard → API keys)");
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  console.log("Fetching TextReach products from Stripe...\n");

  const products = await stripe.products.list({ active: true, limit: 100 });
  const priceUpdates: Record<string, string> = {};

  for (const [envKey, productName] of Object.entries(PRODUCT_NAMES)) {
    const product = products.data.find((p) => p.name === productName);
    if (!product) {
      console.warn(`⚠  Product not found: ${productName}`);
      continue;
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 20,
    });

    const recurringMonthly = prices.data.find(
      (p) => p.type === "recurring" && p.recurring?.interval === "month"
    );

    if (!recurringMonthly) {
      console.warn(`⚠  No monthly recurring price for ${productName}`);
      continue;
    }

    priceUpdates[envKey] = recurringMonthly.id;
    upsertEnv(envKey, recurringMonthly.id);

    if (product.default_price !== recurringMonthly.id) {
      await stripe.products.update(product.id, {
        default_price: recurringMonthly.id,
      });
      console.log(`✓ ${productName} → ${envKey}=${recurringMonthly.id} (set as default)`);
    } else {
      console.log(`✓ ${productName} → ${envKey}=${recurringMonthly.id}`);
    }
  }

  const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  const useRemoteWebhook = process.env.STRIPE_USE_REMOTE_WEBHOOK === "true";

  if (baseUrl && !baseUrl.includes("localhost") && useRemoteWebhook) {
    const webhookUrl = `${baseUrl}/api/webhooks/stripe`;
    console.log(`\nRegistering remote webhook: ${webhookUrl}`);

    const existing = await stripe.webhookEndpoints.list({ limit: 100 });
    const match = existing.data.find((e) => e.url === webhookUrl);

    if (match) {
      await stripe.webhookEndpoints.update(match.id, {
        enabled_events: WEBHOOK_EVENTS,
      });
      console.log(`✓ Updated existing webhook endpoint ${match.id}`);
      console.log(
        "  Note: signing secret is only shown once at creation. Use `stripe listen` locally or recreate the endpoint to get a new whsec_."
      );
    } else {
      const endpoint = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: WEBHOOK_EVENTS,
        description: "TextReach subscription sync",
      });
      if (endpoint.secret) {
        upsertEnv("STRIPE_WEBHOOK_SECRET", endpoint.secret);
        console.log(`✓ Created webhook endpoint`);
        console.log(`✓ STRIPE_WEBHOOK_SECRET saved to .env`);
      } else {
        console.log(`✓ Created webhook endpoint (no secret returned)`);
      }
    }
  } else {
    console.log(
      "\nSkipping remote Stripe webhook (use stripe listen for local dev)."
    );
    console.log(
      "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
    );
    console.log("Set STRIPE_USE_REMOTE_WEBHOOK=true to register a tunnel URL instead.");
  }

  const portalConfigs = await stripe.billingPortal.configurations.list({
    limit: 1,
  });
  if (portalConfigs.data.length === 0) {
    await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "TextReach — manage your subscription",
      },
      features: {
        subscription_cancel: { enabled: true, mode: "at_period_end" },
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
      },
    });
    console.log("\n✓ Customer Portal enabled");
  } else {
    console.log("\n✓ Customer Portal already configured");
  }

  console.log("\nStripe setup complete.");
  console.log("Restart npm run dev if it was already running.");
  console.log("\nTest: http://localhost:3000/billing → Subscribe to Starter");
  console.log("Card: 4242 4242 4242 4242");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
