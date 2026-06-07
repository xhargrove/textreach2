import Stripe from "stripe";
import type { BillingStatus } from "@prisma/client";
import { isStripeConfigured } from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs in your environment."
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): BillingStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "inactive";
    default:
      return "inactive";
  }
}

export { getAppBaseUrl } from "@/lib/app-url";

export { isStripeConfigured };
