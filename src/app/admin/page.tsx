import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { getPlatformStats } from "@/lib/admin/platform-stats";
import { formatNumber, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Platform Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePlatformAdmin();
  const stats = await getPlatformStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-app py-8">
        <PageHeader
          title="Platform Admin"
          description="Internal overview for TextReach operators. Access is limited to allowlisted admin emails."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total users" value={formatNumber(stats.totalUsers)} />
          <StatCard
            label="Total workspaces"
            value={formatNumber(stats.totalWorkspaces)}
          />
          <StatCard
            label="Total contacts"
            value={formatNumber(stats.totalContacts)}
          />
          <StatCard
            label="Messages sent"
            value={formatNumber(stats.totalMessagesSent)}
          />
          <StatCard
            label="Failed sends"
            value={formatNumber(stats.failedRecipients)}
            description="Recipient-level delivery failures"
          />
          <StatCard
            label="Active subscriptions"
            value={formatNumber(stats.activeSubscriptions)}
          />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent signups (30 days)
          </h2>
          {stats.recentSignups.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No recent signups.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {stats.recentSignups.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.name ?? user.email}
                    </p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(user.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
