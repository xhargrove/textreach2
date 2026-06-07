"use client";

import { useState, useTransition } from "react";
import type { WorkspacePlan } from "@prisma/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  createBillingPortalAction,
  createCheckoutSessionAction,
} from "@/lib/actions/billing";
import { PLAN_CONFIG } from "@/lib/billing/plans";

type BillingActionsProps = {
  currentPlan: WorkspacePlan;
  billingStatus: string;
  stripeConfigured: boolean;
  hasStripeCustomer: boolean;
};

export function BillingActions({
  currentPlan,
  billingStatus,
  stripeConfigured,
  hasStripeCustomer,
}: BillingActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCheckout(plan: WorkspacePlan) {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(plan);
      if (result.ok) {
        window.location.href = result.url;
      } else {
        setError(result.error);
      }
    });
  }

  function handlePortal() {
    setError(null);
    startTransition(async () => {
      const result = await createBillingPortalAction();
      if (result.ok) {
        window.location.href = result.url;
      } else {
        setError(result.error);
      }
    });
  }

  const isActive = billingStatus === "active";

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" title="Billing error">
          {error}
        </Alert>
      )}

      {!stripeConfigured && (
        <Alert variant="warning" title="Stripe not configured">
          Add your Stripe keys and price IDs to enable checkout and billing
          management.
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        {hasStripeCustomer && stripeConfigured && (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={handlePortal}
          >
            {pending ? "Opening…" : "Manage billing"}
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["starter", "growth", "pro"] as WorkspacePlan[]).map((plan) => {
          const config = PLAN_CONFIG[plan];
          const isCurrent = plan === currentPlan;

          return (
            <div
              key={plan}
              className={`rounded-lg border p-4 ${
                isCurrent ? "border-brand-500 bg-brand-50/50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{config.name}</h3>
                {isCurrent && (
                  <span className="text-xs font-medium text-brand-700">Current</span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                ${config.price}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-3 space-y-1 text-xs text-gray-600">
                {config.features.slice(0, 3).map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {stripeConfigured && (!isCurrent || !isActive) && (
                <Button
                  type="button"
                  size="md"
                  className="mt-4 w-full"
                  variant={plan === "growth" ? "primary" : "secondary"}
                  disabled={pending}
                  onClick={() => handleCheckout(plan)}
                >
                  {isCurrent && !isActive
                    ? `Subscribe to ${config.name}`
                    : `Choose ${config.name}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
