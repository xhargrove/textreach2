import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { messageStatusBadge, Badge } from "@/components/ui/badge";
import { requireAuthContext } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import {
  getDashboardStats,
  getRecentMessages,
  getActiveKeywords,
  getRecentReplies,
} from "@/lib/queries/workspace-data";
import { getDashboardCharts } from "@/lib/queries/results";
import { SimpleBarChart } from "@/components/results/simple-bar-chart";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { formatNumber, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const ctx = await requireAuthContext();
  const workspaceId = ctx.workspaceId;
  const perms = getPagePermissions(ctx);

  const [stats, recentMessages, activeKeywords, recentReplies, charts] =
    await Promise.all([
      getDashboardStats(workspaceId),
      getRecentMessages(workspaceId),
      getActiveKeywords(workspaceId),
      getRecentReplies(workspaceId),
      getDashboardCharts(workspaceId),
    ]);

  const hasData =
    stats.totalContacts > 0 ||
    stats.messagesSent > 0 ||
    recentMessages.length > 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="See how your texts are doing at a glance — contacts, messages sent, replies, and more."
        action={
          <div className="flex gap-2">
            {perms.canCreateMessages && (
              <Button href="/messages/new">New Message</Button>
            )}
            <Button href="/results" variant="secondary">
              Results
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Contacts"
          value={formatNumber(stats.totalContacts)}
        />
        <StatCard
          label="Active Lists"
          value={formatNumber(stats.activeLists)}
        />
        <StatCard
          label="Messages Sent"
          value={formatNumber(stats.messagesSent)}
        />
        <StatCard label="Replies" value={formatNumber(stats.replies)} />
        <StatCard label="Opt-outs" value={formatNumber(stats.optOuts)} />
        <StatCard
          label="Scheduled Messages"
          value={formatNumber(stats.scheduledMessages)}
        />
      </div>

      {!hasData ? (
        <div className="mt-8">
          <EmptyState
            title="Welcome to TextReach"
            description="Add contacts and create your first list to start sending messages."
            actionLabel={perms.canManageContacts ? "Add Contacts" : undefined}
            actionHref={perms.canManageContacts ? "/contacts/new" : undefined}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <SimpleBarChart
              title="New contacts over time"
              data={charts.newContacts}
            />
            <SimpleBarChart
              title="Messages sent over time"
              data={charts.messagesSent}
            />
            <SimpleBarChart
              title="Replies over time"
              data={charts.replies}
            />
            <SimpleBarChart
              title="Keyword opt-ins over time"
              data={charts.keywordOptIns}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Messages
            </h2>
            <div className="mt-4">
              {recentMessages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="Write your first message and send it to a list."
                  actionLabel={perms.canCreateMessages ? "Create Message" : undefined}
                  actionHref={perms.canCreateMessages ? "/messages/new" : undefined}
                />
              ) : (
                <>
                  <div className="mt-4 space-y-3 md:hidden">
                    {recentMessages.map((msg) => (
                      <MobileDataCard
                        key={msg.id}
                        href={`/messages/${msg.id}`}
                        title={msg.name}
                        subtitle={msg.list}
                        badge={messageStatusBadge(msg.status)}
                        rows={[
                          {
                            label: "Recipients",
                            value: formatNumber(msg.recipients),
                          },
                          {
                            label: "Replies",
                            value: formatNumber(msg.replies),
                          },
                          {
                            label: "Date",
                            value: msg.sentAt ? formatDateTime(msg.sentAt) : "—",
                          },
                        ]}
                      />
                    ))}
                  </div>
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
                          <TableCell>
                            <Link
                              href={`/messages/${msg.id}`}
                              className="font-medium text-brand-600 hover:text-brand-700"
                            >
                              {msg.name}
                            </Link>
                          </TableCell>
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
                </>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Active Keywords
              </h2>
              <div className="mt-4">
                {activeKeywords.length === 0 ? (
                  <EmptyState
                    title="No keywords yet"
                    description="Set up a keyword so people can text to join your lists."
                    actionLabel={perms.canManageKeywords ? "Add Keyword" : undefined}
                    actionHref={perms.canManageKeywords ? "/keywords/new" : undefined}
                  />
                ) : (
                  <>
                    <div className="mt-4 space-y-3 md:hidden">
                      {activeKeywords.map((kw) => (
                        <MobileDataCard
                          key={kw.id}
                          href={`/keywords/${kw.id}`}
                          title={<Badge variant="info">{kw.keyword}</Badge>}
                          rows={[
                            {
                              label: "Opt-ins",
                              value: formatNumber(kw.optInCount),
                            },
                          ]}
                        />
                      ))}
                    </div>
                    <Table>
                      <TableHead>
                        <TableHeaderCell>Keyword</TableHeaderCell>
                        <TableHeaderCell>Auto Reply</TableHeaderCell>
                        <TableHeaderCell>Opt-ins</TableHeaderCell>
                      </TableHead>
                      <TableBody>
                        {activeKeywords.map((kw) => (
                          <TableRow key={kw.id}>
                            <TableCell>
                              <Link href={`/keywords/${kw.id}`}>
                                <Badge variant="info">{kw.keyword}</Badge>
                              </Link>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {kw.autoReply ?? "—"}
                            </TableCell>
                            <TableCell>{formatNumber(kw.optInCount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
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
                {recentReplies.length === 0 ? (
                  <EmptyState
                    title="No replies yet"
                    description="When contacts reply to your messages, they'll show up here."
                    actionLabel="View Inbox"
                    actionHref="/inbox"
                  />
                ) : (
                  recentReplies.map((reply) => (
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
                      <p className="mt-2 text-sm text-gray-600">
                        {reply.message}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
