import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getKeywordResults } from "@/lib/queries/results";
import { formatDateTime, formatNumber, formatPhone } from "@/lib/utils";

export const metadata = {
  title: "Keyword Results",
};

type KeywordResultsPageProps = {
  params: { id: string };
};

export default async function KeywordResultsPage({
  params,
}: KeywordResultsPageProps) {
  const ctx = await requirePagePermission("view_results");
  const results = await getKeywordResults(ctx.workspaceId, params.id);

  if (!results) notFound();

  return (
    <>
      <PageHeader
        title={results.keyword}
        description="Keyword opt-in results"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" href={`/keywords/${results.keywordId}`}>
              View keyword
            </Button>
            <Button variant="secondary" href="/results">
              All results
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total opt-ins"
          value={formatNumber(results.totalOptIns)}
        />
        <StatCard
          label="Opt-ins this week"
          value={formatNumber(results.optInsThisWeek)}
        />
        <StatCard
          label="Assigned list"
          value={results.listName ?? "—"}
        />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900">Recent opt-ins</h2>
        {results.recentOptIns.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No one has texted {results.keyword} yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {results.recentOptIns.map((optIn) => (
              <li
                key={optIn.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {optIn.contactName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPhone(optIn.phone)}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDateTime(optIn.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
