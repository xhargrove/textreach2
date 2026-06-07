import type { BillingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WorkspaceSubscription = {
  status: BillingStatus;
};

export const BILLING_SEND_BLOCKED_MESSAGE =
  "Your workspace needs an active plan before sending messages.";

const SEND_ALLOWED_STATUSES: BillingStatus[] = [
  "active",
  "trialing",
  "comped",
];

export function canWorkspaceSendMessages(
  subscription: WorkspaceSubscription | null
): boolean {
  if (!subscription) return false;

  return SEND_ALLOWED_STATUSES.includes(subscription.status);
}

export type BillingGateResult =
  | { ok: true }
  | { ok: false; error: string };

function billingBlockedMessage(status: BillingStatus | null): string {
  if (!status) {
    return BILLING_SEND_BLOCKED_MESSAGE;
  }

  if (status === "past_due") {
    return "Your subscription payment is past due. Update billing before sending messages.";
  }

  if (status === "canceled") {
    return "Your subscription is canceled. Reactivate billing before sending messages.";
  }

  return BILLING_SEND_BLOCKED_MESSAGE;
}

export async function getWorkspaceSubscription(
  workspaceId: string
): Promise<WorkspaceSubscription | null> {
  const billing = await prisma.billingAccount.findUnique({
    where: { workspaceId },
    select: { status: true },
  });

  if (!billing) return null;

  return { status: billing.status };
}

export async function checkBillingAllowsSend(
  workspaceId: string
): Promise<BillingGateResult> {
  const subscription = await getWorkspaceSubscription(workspaceId);

  if (canWorkspaceSendMessages(subscription)) {
    return { ok: true };
  }

  return {
    ok: false,
    error: billingBlockedMessage(subscription?.status ?? null),
  };
}
