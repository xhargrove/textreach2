import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getListResults } from "@/lib/queries/results";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "List Results",
};

type ListResultsPageProps = {
  params: { id: string };
};

export default async function ListResultsPage({
  params,
}: ListResultsPageProps) {
  const ctx = await requirePagePermission("view_results");
  const results = await getListResults(ctx.workspaceId, params.id);

  if (!results) notFound();

  return (
    <>
      <PageHeader
        title={results.name}
        description="List performance results"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" href={`/lists/${results.listId}`}>
              View list
            </Button>
            <Button variant="secondary" href="/results">
              All results
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total contacts"
          value={formatNumber(results.totalContacts)}
        />
        <StatCard
          label="Active contacts"
          value={formatNumber(results.activeContacts)}
        />
        <StatCard
          label="Opted-out contacts"
          value={formatNumber(results.optedOutContacts)}
        />
        <StatCard
          label="Messages sent"
          value={formatNumber(results.messagesSent)}
        />
        <StatCard label="Replies" value={formatNumber(results.replies)} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
        <p className="mt-2 text-sm text-gray-600">
          {formatNumber(results.messagesSent)} message
          {results.messagesSent === 1 ? "" : "s"} sent to this list with{" "}
          {formatNumber(results.replies)} inbound repl
          {results.replies === 1 ? "y" : "ies"} from list members.
        </p>
        {results.totalContacts > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {formatNumber(results.activeContacts)} of{" "}
            {formatNumber(results.totalContacts)} contacts are active (
            {Math.round(
              (results.activeContacts / results.totalContacts) * 100
            )}
            %).
          </p>
        )}
      </Card>
    </>
  );
}
