import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleBarChart } from "@/components/results/simple-bar-chart";
import { MessageResultsTable } from "@/components/results/message-results-table";
import { TopListsCard, TopKeywordsCard } from "@/components/results/top-cards";
import { requirePagePermission } from "@/lib/auth/authorization";
import {
  getResultsOverview,
  getAllMessageResults,
} from "@/lib/queries/results";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Results",
};

export default async function ResultsPage() {
  const ctx = await requirePagePermission("view_results");
  const [overview, messageResults] = await Promise.all([
    getResultsOverview(ctx.workspaceId),
    getAllMessageResults(ctx.workspaceId),
  ]);

  const hasResults = overview.messagesSent > 0;

  return (
    <>
      <PageHeader
        title="Results"
        description="See how your messages performed — delivery, replies, clicks, and growth."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Messages sent"
          value={formatNumber(overview.messagesSent)}
        />
        <StatCard
          label="Delivery rate"
          value={`${overview.deliveryRate}%`}
        />
        <StatCard
          label="Failed messages"
          value={formatNumber(overview.failedMessages)}
          description={`${formatNumber(overview.failedRecipients)} failed recipients`}
        />
        <StatCard label="Replies" value={formatNumber(overview.replies)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Opt-outs" value={formatNumber(overview.optOuts)} />
        <StatCard label="Clicks" value={formatNumber(overview.clicks)} />
        <StatCard
          label="New contacts"
          value={formatNumber(overview.newContacts)}
          description="Last 14 days"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SimpleBarChart
          title="New contacts over time"
          data={overview.charts.newContacts}
        />
        <SimpleBarChart
          title="Messages sent over time"
          data={overview.charts.messagesSent}
        />
        <SimpleBarChart
          title="Replies over time"
          data={overview.charts.replies}
        />
        <SimpleBarChart
          title="Keyword opt-ins over time"
          data={overview.charts.keywordOptIns}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TopListsCard lists={overview.topLists} />
        <TopKeywordsCard keywords={overview.topKeywords} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Message results
        </h2>
        {!hasResults ? (
          <div className="mt-4">
            <EmptyState
              title="No results yet"
              description="Send your first message to start tracking delivery and engagement."
              actionLabel="Go to Messages"
              actionHref="/messages"
            />
          </div>
        ) : (
          <div className="mt-4">
            <MessageResultsTable messages={messageResults} />
          </div>
        )}
      </div>
    </>
  );
}
