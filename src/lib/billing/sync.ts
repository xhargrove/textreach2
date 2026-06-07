import type Stripe from "stripe";
import type { WorkspacePlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { planFromStripePriceId } from "@/lib/billing/plans";
import { mapSubscriptionStatus } from "@/lib/billing/stripe";

function resolvePlanFromSubscription(
  subscription: Stripe.Subscription
): WorkspacePlan | null {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;
  return planFromStripePriceId(priceId);
}

export async function syncSubscriptionToBillingAccount(
  workspaceId: string,
  subscription: Stripe.Subscription
) {
  const plan = resolvePlanFromSubscription(subscription);
  if (!plan) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await prisma.billingAccount.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan },
  });
}

export async function syncSubscriptionById(subscriptionId: string) {
  const billing = await prisma.billingAccount.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!billing) return null;

  const { getStripe } = await import("@/lib/billing/stripe");
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncSubscriptionToBillingAccount(billing.workspaceId, subscription);
  return billing.workspaceId;
}

export async function markSubscriptionCanceled(subscriptionId: string) {
  const billing = await prisma.billingAccount.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!billing) return;

  await prisma.billingAccount.update({
    where: { id: billing.id },
    data: {
      status: "canceled",
      stripeSubscriptionId: null,
    },
  });
}

export async function findWorkspaceIdFromStripeCustomer(
  customerId: string
): Promise<string | null> {
  const billing = await prisma.billingAccount.findFirst({
    where: { stripeCustomerId: customerId },
    select: { workspaceId: true },
  });
  return billing?.workspaceId ?? null;
}

export async function findWorkspaceIdFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  if (session.metadata?.workspaceId) {
    return session.metadata.workspaceId;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (customerId) {
    return findWorkspaceIdFromStripeCustomer(customerId);
  }

  return null;
}
