import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { messageStatusBadge } from "@/components/ui/badge";
import { MessageRepliesSection } from "@/components/messages/message-replies-section";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getMessageResults } from "@/lib/queries/results";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Message Results",
};

type MessageResultsPageProps = {
  params: { id: string };
};

export default async function MessageResultsPage({
  params,
}: MessageResultsPageProps) {
  const ctx = await requirePagePermission("view_results");
  const results = await getMessageResults(ctx.workspaceId, params.id);

  if (!results) notFound();

  const { linkStats } = results;

  return (
    <>
      <PageHeader
        title={results.name}
        description="Message delivery and engagement results"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" href={`/messages/${results.messageId}`}>
              View message
            </Button>
            <Button variant="secondary" href="/results">
              All results
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        {messageStatusBadge(results.status)}
        {results.listName && (
          <span>
            List:{" "}
            <span className="font-medium text-gray-900">{results.listName}</span>
          </span>
        )}
        {results.sentAt && (
          <span>Sent {formatDateTime(results.sentAt)}</span>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Delivery rate" value={`${results.deliveryRate}%`} />
        <StatCard label="Failure rate" value={`${results.failureRate}%`} />
        <StatCard
          label="Replies"
          value={formatNumber(results.replies)}
          description={
            results.replies > 0
              ? `${formatNumber(results.replyStats.uniqueContacts)} unique contacts`
              : undefined
          }
        />
        <StatCard
          label="Total clicks"
          value={formatNumber(linkStats.totalClicks)}
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Unique clicks"
          value={formatNumber(linkStats.uniqueClicks)}
          description="Distinct contacts or links"
        />
        <StatCard
          label="Click-through rate"
          value={`${linkStats.clickThroughRate}%`}
          description="Unique clicks ÷ delivered"
        />
        <StatCard
          label="Links tracked"
          value={formatNumber(linkStats.topLinks.length)}
          description="Unique URLs in message"
        />
      </div>

      {linkStats.topLinks.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Top clicked links
          </h2>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeaderCell>URL</TableHeaderCell>
                <TableHeaderCell>Total clicks</TableHeaderCell>
                <TableHeaderCell>Unique clicks</TableHeaderCell>
              </TableHead>
              <TableBody>
                {linkStats.topLinks.map((link) => (
                  <TableRow key={link.originalUrl}>
                    <TableCell className="max-w-md truncate font-mono text-sm text-gray-700">
                      {link.originalUrl}
                    </TableCell>
                    <TableCell>{formatNumber(link.totalClicks)}</TableCell>
                    <TableCell>{formatNumber(link.uniqueClicks)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Replies</h2>
        <MessageRepliesSection
          replyStats={results.replyStats}
          deliveredCount={results.delivered}
        />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900">
          Recipient breakdown
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm text-gray-500">Total recipients</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {formatNumber(results.total)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Sent</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {formatNumber(results.sent)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Delivered</dt>
            <dd className="text-2xl font-semibold text-green-700">
              {formatNumber(results.delivered)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Failed</dt>
            <dd className="text-2xl font-semibold text-red-700">
              {formatNumber(results.failed)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Undelivered</dt>
            <dd className="text-2xl font-semibold text-red-600">
              {formatNumber(results.undelivered)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Skipped</dt>
            <dd className="text-2xl font-semibold text-amber-700">
              {formatNumber(results.skipped)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Opted out</dt>
            <dd className="text-2xl font-semibold text-amber-700">
              {formatNumber(results.optedOut)}
            </dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
