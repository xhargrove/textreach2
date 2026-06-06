import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { messageStatusBadge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { messages, dashboardStats } from "@/lib/mock-data";
import { formatNumber, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Results",
};

export default function ResultsPage() {
  const sentMessages = messages.filter((m) => m.status === "sent");
  const totalDelivered = sentMessages.reduce((sum, m) => sum + m.delivered, 0);
  const totalReplies = sentMessages.reduce((sum, m) => sum + m.replies, 0);
  const deliveryRate =
    totalDelivered > 0
      ? Math.round((totalDelivered / sentMessages.reduce((s, m) => s + m.recipients, 0)) * 100)
      : 0;
  const replyRate =
    totalDelivered > 0
      ? Math.round((totalReplies / totalDelivered) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="Results"
        description="Track delivery, replies, and engagement"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Messages Sent"
          value={formatNumber(dashboardStats.messagesSent)}
        />
        <StatCard label="Delivery Rate" value={`${deliveryRate}%`} />
        <StatCard label="Total Replies" value={formatNumber(totalReplies)} />
        <StatCard label="Reply Rate" value={`${replyRate}%`} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Message Performance
        </h2>
        <div className="mt-4">
          <Table>
            <TableHead>
              <TableHeaderCell>Message</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Sent</TableHeaderCell>
              <TableHeaderCell>Delivered</TableHeaderCell>
              <TableHeaderCell>Replies</TableHeaderCell>
              <TableHeaderCell>Reply Rate</TableHeaderCell>
            </TableHead>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell>{messageStatusBadge(msg.status)}</TableCell>
                  <TableCell>
                    {msg.sentAt ? formatDateTime(msg.sentAt) : "—"}
                  </TableCell>
                  <TableCell>{formatNumber(msg.delivered)}</TableCell>
                  <TableCell>{formatNumber(msg.replies)}</TableCell>
                  <TableCell>
                    {msg.delivered > 0
                      ? `${Math.round((msg.replies / msg.delivered) * 100)}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Opt-outs</h2>
        <Card className="mt-4">
          <p className="text-3xl font-semibold text-gray-900">
            {formatNumber(dashboardStats.optOuts)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Total contacts who have opted out of messages
          </p>
        </Card>
      </div>
    </>
  );
}
