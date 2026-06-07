import type { BillingAccount, WorkspacePlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/billing/plans";

export type BillingPeriod = {
  start: Date;
  end: Date;
};

export type WorkspaceUsage = {
  plan: WorkspacePlan;
  contacts: number;
  keywords: number;
  messagesSent: number;
  limits: {
    contacts: number;
    keywords: number | null;
    messages: number;
  };
  billingPeriod: BillingPeriod;
  billingStatus: BillingAccount["status"] | null;
  stripeConfigured: boolean;
  hasStripeCustomer: boolean;
};

export function getBillingPeriod(
  billing: Pick<
    BillingAccount,
    "currentPeriodStart" | "currentPeriodEnd"
  > | null
): BillingPeriod {
  if (billing?.currentPeriodStart && billing?.currentPeriodEnd) {
    return {
      start: billing.currentPeriodStart,
      end: billing.currentPeriodEnd,
    };
  }

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  return { start, end };
}

export async function resolveWorkspacePlan(
  workspaceId: string
): Promise<WorkspacePlan> {
  const billing = await prisma.billingAccount.findUnique({
    where: { workspaceId },
    select: { plan: true },
  });

  if (billing?.plan) return billing.plan;

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true },
  });

  return workspace.plan;
}

export async function getWorkspaceUsage(
  workspaceId: string
): Promise<WorkspaceUsage> {
  const [billing, contactCount, keywordCount, plan] = await Promise.all([
    prisma.billingAccount.findUnique({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.keyword.count({ where: { workspaceId } }),
    resolveWorkspacePlan(workspaceId),
  ]);

  const billingPeriod = getBillingPeriod(billing);
  const messagesSent = await prisma.messageRecipient.count({
    where: {
      message: {
        workspaceId,
        sentAt: {
          gte: billingPeriod.start,
          lt: billingPeriod.end,
        },
      },
      status: { in: ["sent", "delivered"] },
    },
  });

  const limits = PLAN_CONFIG[plan];

  return {
    plan,
    contacts: contactCount,
    keywords: keywordCount,
    messagesSent,
    limits: {
      contacts: limits.contacts,
      keywords: limits.keywords,
      messages: limits.messages,
    },
    billingPeriod,
    billingStatus: billing?.status ?? null,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    hasStripeCustomer: !!billing?.stripeCustomerId,
  };
}

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function isAtLimit(used: number, limit: number | null): boolean {
  if (limit === null) return false;
  return used >= limit;
}
