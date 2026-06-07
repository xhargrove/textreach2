"use server";

import { redirect } from "next/navigation";
import type { WorkspacePlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import {
  getStripePriceId,
  isStripeConfigured,
  PLAN_ORDER,
} from "@/lib/billing/plans";
import { getStripe, getAppBaseUrl } from "@/lib/billing/stripe";
import {
  actionFailure,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";

type ActionResult = ActionFailure | { ok: true; url: string };

async function requireBillingWorkspace() {
  const ctx = await requirePermission("manage_billing");
  return ctx.workspace;
}

async function getOrCreateStripeCustomer(
  workspaceId: string,
  email: string,
  workspaceName: string
) {
  const billing = await prisma.billingAccount.findUnique({
    where: { workspaceId },
  });

  if (billing?.stripeCustomerId) {
    return billing.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: workspaceName,
    metadata: { workspaceId },
  });

  await prisma.billingAccount.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      stripeCustomerId: customer.id,
      plan: "starter",
      status: "trialing",
    },
    update: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

export async function createCheckoutSessionAction(
  targetPlan: WorkspacePlan
): Promise<ActionResult> {
  return runAction(async () => {
    if (!isStripeConfigured()) {
      return actionFailure(
        "Stripe is not configured. Add STRIPE_SECRET_KEY and price IDs to your environment."
      );
    }

    const workspace = await requireBillingWorkspace();
    const priceId = getStripePriceId(targetPlan);

    if (!priceId) {
      return actionFailure(`No Stripe price configured for the ${targetPlan} plan.`);
    }

    const currentPlan = workspace.billingAccount?.plan ?? workspace.plan;
    const currentIndex = PLAN_ORDER.indexOf(currentPlan);
    const targetIndex = PLAN_ORDER.indexOf(targetPlan);
    const isActive = workspace.billingAccount?.status === "active";

    if (isActive && targetIndex <= currentIndex) {
      return actionFailure(
        `You're already on the ${targetPlan} plan or higher. Use Manage billing to change plans.`
      );
    }

    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);

    if (price.type !== "recurring") {
      return actionFailure(
        `The ${targetPlan} plan price is not a recurring subscription in Stripe. Run npm run stripe:setup to fix price IDs.`
      );
    }

    const customerId = await getOrCreateStripeCustomer(
      workspace.id,
      workspace.owner.email,
      workspace.name
    );

    const baseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing?success=1`,
      cancel_url: `${baseUrl}/billing?canceled=1`,
      metadata: {
        workspaceId: workspace.id,
        targetPlan,
      },
      subscription_data: {
        metadata: {
          workspaceId: workspace.id,
          targetPlan,
        },
      },
    });

    if (!session.url) {
      return actionFailure("Failed to create checkout session.");
    }

    return { ok: true as const, url: session.url };
  });
}

export async function createBillingPortalAction(): Promise<ActionResult> {
  return runAction(async () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return actionFailure(
        "Stripe is not configured. Add STRIPE_SECRET_KEY to your environment."
      );
    }

    const workspace = await requireBillingWorkspace();
    const billing = workspace.billingAccount;

    if (!billing?.stripeCustomerId) {
      return actionFailure("No billing account found. Subscribe to a plan first.");
    }

    const stripe = getStripe();
    const baseUrl = getAppBaseUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return { ok: true as const, url: session.url };
  });
}

export async function redirectToCheckoutAction(plan: WorkspacePlan) {
  const result = await createCheckoutSessionAction(plan);
  if (result.ok) redirect(result.url);
  redirect(`/billing?error=${encodeURIComponent(result.error)}`);
}

export async function redirectToBillingPortalAction() {
  const result = await createBillingPortalAction();
  if (result.ok) redirect(result.url);
  redirect(`/billing?error=${encodeURIComponent(result.error)}`);
}
