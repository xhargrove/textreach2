import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { messageStatusBadge, Badge } from "@/components/ui/badge";
import {
  dashboardStats,
  recentMessages,
  activeKeywords,
  recentReplies,
} from "@/lib/mock-data";
import { formatNumber, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your texting activity"
        action={<Button href="/messages">New Message</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Contacts"
          value={formatNumber(dashboardStats.totalContacts)}
        />
        <StatCard
          label="Active Lists"
          value={formatNumber(dashboardStats.activeLists)}
        />
        <StatCard
          label="Messages Sent"
          value={formatNumber(dashboardStats.messagesSent)}
        />
        <StatCard
          label="Replies"
          value={formatNumber(dashboardStats.replies)}
        />
        <StatCard
          label="Opt-outs"
          value={formatNumber(dashboardStats.optOuts)}
        />
        <StatCard
          label="Scheduled Messages"
          value={formatNumber(dashboardStats.scheduledMessages)}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
        <div className="mt-4">
          <Table>
            <TableHead>
              <TableHeaderCell>Message</TableHeaderCell>
              <TableHeaderCell>List</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Recipients</TableHeaderCell>
              <TableHeaderCell>Replies</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
            </TableHead>
            <TableBody>
              {recentMessages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell>{msg.list}</TableCell>
                  <TableCell>{messageStatusBadge(msg.status)}</TableCell>
                  <TableCell>{formatNumber(msg.recipients)}</TableCell>
                  <TableCell>{formatNumber(msg.replies)}</TableCell>
                  <TableCell>
                    {msg.sentAt ? formatDateTime(msg.sentAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Active Keywords
          </h2>
          <div className="mt-4">
            <Table>
              <TableHead>
                <TableHeaderCell>Keyword</TableHeaderCell>
                <TableHeaderCell>Auto Reply</TableHeaderCell>
                <TableHeaderCell>Sign-ups</TableHeaderCell>
              </TableHead>
              <TableBody>
                {activeKeywords.map((kw) => (
                  <TableRow key={kw.id}>
                    <TableCell>
                      <Badge variant="info">{kw.keyword}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {kw.autoReply}
                    </TableCell>
                    <TableCell>{formatNumber(kw.signups)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Replies
            </h2>
            <Button href="/inbox" variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {recentReplies.map((reply) => (
              <Card key={reply.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {reply.contact}
                    </p>
                    <p className="text-xs text-gray-500">{reply.phone}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(reply.receivedAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-gray-600">{reply.message}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
