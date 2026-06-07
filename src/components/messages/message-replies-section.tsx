import Link from "next/link";
import { Card, StatCard } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { MessageReplyStats } from "@/lib/queries/message-replies";
import { formatDateTime, formatNumber } from "@/lib/utils";

type MessageRepliesSectionProps = {
  replyStats: MessageReplyStats;
  deliveredCount?: number;
  compact?: boolean;
};

export function MessageRepliesSection({
  replyStats,
  deliveredCount = 0,
  compact = false,
}: MessageRepliesSectionProps) {
  const hasReplies = replyStats.totalReplies > 0;
  const replyRate =
    deliveredCount > 0
      ? Math.round((replyStats.uniqueContacts / deliveredCount) * 100)
      : null;

  if (compact) {
    return (
      <StatCard
        label="Replies"
        value={formatNumber(replyStats.totalReplies)}
        description={
          hasReplies
            ? `${formatNumber(replyStats.uniqueContacts)} unique contact${replyStats.uniqueContacts === 1 ? "" : "s"}`
            : "No replies yet"
        }
      />
    );
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total replies"
          value={formatNumber(replyStats.totalReplies)}
        />
        <StatCard
          label="Unique contacts"
          value={formatNumber(replyStats.uniqueContacts)}
          description="Contacts who replied"
        />
        <StatCard
          label="Reply rate"
          value={replyRate !== null ? `${replyRate}%` : "—"}
          description={
            deliveredCount > 0
              ? "Unique contacts ÷ delivered"
              : "Available after send"
          }
        />
      </div>

      {replyStats.attributionNote && (
        <p className="mb-4 text-sm text-gray-500">{replyStats.attributionNote}</p>
      )}

      {hasReplies ? (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Recent replies</h2>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Reply</TableHeaderCell>
                <TableHeaderCell>When</TableHeaderCell>
                <TableHeaderCell className="text-right">Inbox</TableHeaderCell>
              </TableHead>
              <TableBody>
                {replyStats.recentReplies.map((reply) => (
                  <TableRow key={reply.id}>
                    <TableCell>
                      <p className="font-medium text-gray-900">
                        {reply.contactName}
                      </p>
                      <p className="text-xs text-gray-500">{reply.phone}</p>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-gray-700">
                      {reply.body}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(reply.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/inbox/${reply.contactId}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        View thread
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-gray-500">
            No replies from campaign recipients yet. Replies appear here when
            contacts who received this message respond within 30 days of send.
          </p>
        </Card>
      )}
    </>
  );
}
