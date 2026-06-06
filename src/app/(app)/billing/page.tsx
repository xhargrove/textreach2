import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Billing",
};

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Manage your plan and usage"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                Starter
              </p>
              <p className="mt-1 text-sm text-gray-500">$29/month</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Messages used this month</span>
              <span className="font-medium text-gray-900">842 / 1,000</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: "84.2%" }}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary">Change Plan</Button>
            <Button variant="ghost">View Invoices</Button>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">Usage Summary</p>
          <dl className="mt-4 space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Messages sent</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatNumber(842)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Contacts</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatNumber(1248)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Active lists</dt>
              <dd className="text-sm font-medium text-gray-900">6</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Keywords</dt>
              <dd className="text-sm font-medium text-gray-900">3</dd>
            </div>
          </dl>
        </Card>
      </div>

      <p className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        Stripe billing integration coming in Phase 3. Payment methods and
        invoice history will be available here.
      </p>
    </>
  );
}
