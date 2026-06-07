import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsageMeter } from "@/components/billing/usage-meter";
import { BillingActions } from "@/components/billing/billing-actions";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getWorkspaceUsage } from "@/lib/billing/usage";
import { PLAN_CONFIG, planLabel, isStripeConfigured } from "@/lib/billing/plans";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Billing",
};

type BillingPageProps = {
  searchParams: { success?: string; canceled?: string; error?: string };
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const ctx = await requirePagePermission("manage_billing");
  const workspace = ctx.workspace;
  const usage = await getWorkspaceUsage(workspace.id);
  const planConfig = PLAN_CONFIG[usage.plan];
  const status = usage.billingStatus ?? workspace.billingAccount?.status ?? "trialing";

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan, usage, and subscription — upgrade anytime as you grow."
      />

      {searchParams.success === "1" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Subscription updated successfully. Your plan limits are now active.
        </div>
      )}

      {searchParams.canceled === "1" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout was canceled. No changes were made to your subscription.
        </div>
      )}

      {searchParams.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current plan</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {planLabel(usage.plan)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                ${planConfig.price}/month
              </p>
            </div>
            <Badge
              variant={
                status === "active"
                  ? "success"
                  : status === "past_due"
                    ? "warning"
                    : "info"
              }
            >
              {status.replace("_", " ")}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <UsageMeter
              label="Contacts"
              used={usage.contacts}
              limit={usage.limits.contacts}
            />
            <UsageMeter
              label="Messages this period"
              used={usage.messagesSent}
              limit={usage.limits.messages}
            />
            <UsageMeter
              label="Keywords"
              used={usage.keywords}
              limit={usage.limits.keywords}
            />
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Billing period: {formatDateTime(usage.billingPeriod.start)} –{" "}
            {formatDateTime(usage.billingPeriod.end)}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">Plan limits</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Contacts</dt>
              <dd className="font-medium text-gray-900">
                {planConfig.contacts.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Messages / month</dt>
              <dd className="font-medium text-gray-900">
                {planConfig.messages.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Keywords</dt>
              <dd className="font-medium text-gray-900">
                {planConfig.keywords === null
                  ? "Unlimited"
                  : planConfig.keywords.toLocaleString()}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-gray-500">
            When you reach a limit, TextReach shows an upgrade prompt — we never
            silently block your work without explanation.
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Plans & billing</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upgrade your plan or manage payment methods and invoices in Stripe.
        </p>
        <div className="mt-6">
          <BillingActions
            currentPlan={usage.plan}
            billingStatus={status}
            stripeConfigured={isStripeConfigured()}
            hasStripeCustomer={usage.hasStripeCustomer}
          />
        </div>
      </Card>
    </>
  );
}
