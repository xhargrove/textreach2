import type { WorkspacePlan } from "@prisma/client";

export type PlanConfig = {
  name: string;
  price: number;
  contacts: number;
  messages: number;
  keywords: number | null;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const PLAN_ORDER: WorkspacePlan[] = ["starter", "growth", "pro"];

export const PLAN_CONFIG: Record<WorkspacePlan, PlanConfig> = {
  starter: {
    name: "Starter",
    price: 29,
    contacts: 500,
    messages: 1000,
    keywords: 3,
    description: "For small lists and occasional messages",
    features: [
      "500 contacts",
      "1,000 messages/month",
      "3 keywords",
      "Delivery & click tracking",
      "Compliance tools",
    ],
  },
  growth: {
    name: "Growth",
    price: 79,
    contacts: 2500,
    messages: 5000,
    keywords: 10,
    description: "For growing businesses sending regularly",
    features: [
      "2,500 contacts",
      "5,000 messages/month",
      "10 keywords",
      "Delivery & click tracking",
      "Compliance tools",
      "Priority support",
    ],
    highlighted: true,
  },
  pro: {
    name: "Pro",
    price: 199,
    contacts: 10000,
    messages: 20000,
    keywords: null,
    description: "For high-volume senders and teams",
    features: [
      "10,000 contacts",
      "20,000 messages/month",
      "Unlimited keywords",
      "Delivery & click tracking",
      "Compliance tools",
      "Priority support",
    ],
  },
};

export function planLabel(plan: WorkspacePlan): string {
  return PLAN_CONFIG[plan]?.name ?? plan;
}

export function getNextPlan(plan: WorkspacePlan): WorkspacePlan | null {
  const index = PLAN_ORDER.indexOf(plan);
  if (index < 0 || index >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[index + 1];
}

export function formatLimit(value: number | null): string {
  if (value === null) return "Unlimited";
  return value.toLocaleString();
}

export function getStripePriceId(plan: WorkspacePlan): string | null {
  const envMap: Record<WorkspacePlan, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    pro: process.env.STRIPE_PRICE_PRO,
  };
  return envMap[plan] ?? null;
}

export function planFromStripePriceId(priceId: string): WorkspacePlan | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_STARTER &&
    process.env.STRIPE_PRICE_GROWTH &&
    process.env.STRIPE_PRICE_PRO
  );
}
