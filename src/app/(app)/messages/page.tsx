import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MessagesTabs } from "@/components/messages/messages-tabs";
import { MessagesTable } from "@/components/messages/messages-table";
import { ComplianceReminder } from "@/components/messages/compliance-reminder";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import {
  getMessagesByTab,
  getMessageCounts,
  type MessageTab,
} from "@/lib/queries/messages";

export const metadata = {
  title: "Messages",
};

const TAB_LABELS: Record<MessageTab, string> = {
  drafts: "draft",
  scheduled: "scheduled",
  sent: "sent",
  failed: "failed",
};

function parseTab(tab: string | undefined): MessageTab {
  if (tab === "drafts" || tab === "scheduled" || tab === "sent" || tab === "failed") {
    return tab;
  }
  return "sent";
}

type MessagesPageProps = {
  searchParams: { tab?: string };
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const ctx = await requirePagePermission("view_messages");
  const perms = getPagePermissions(ctx);
  const tab = parseTab(searchParams.tab);
  const [messages, counts] = await Promise.all([
    getMessagesByTab(ctx.workspaceId, tab),
    getMessageCounts(ctx.workspaceId),
  ]);

  const totalMessages =
    counts.drafts + counts.scheduled + counts.sent + counts.failed;

  return (
    <>
      <PageHeader
        title="Messages"
        description="Write, send, and schedule texts to your lists."
        action={
          <div className="flex gap-2">
            <Button href="/messages/scheduled" variant="secondary">
              Scheduled
            </Button>
            {perms.canCreateMessages && (
              <Button href="/messages/new">New Message</Button>
            )}
          </div>
        }
      />

      <div className="mb-6">
        <ComplianceReminder />
      </div>

      {totalMessages === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Write a message, pick a list, and send or schedule it."
          actionLabel={perms.canCreateMessages ? "New Message" : undefined}
          actionHref={perms.canCreateMessages ? "/messages/new" : undefined}
        />
      ) : (
        <div className="space-y-6">
          <MessagesTabs activeTab={tab} counts={counts} />

          {messages.length === 0 ? (
            <EmptyState
              title={`No ${TAB_LABELS[tab]} messages`}
              description={
                tab === "drafts"
                  ? "Save a message as a draft to finish it later."
                  : tab === "scheduled"
                    ? "Schedule a message to send at a specific time."
                    : tab === "failed"
                      ? "Failed messages will appear here when delivery issues occur."
                      : "Sent messages will appear here after you send."
              }
              actionLabel={
                tab === "drafts" && perms.canCreateMessages
                  ? "New Message"
                  : undefined
              }
              actionHref={
                tab === "drafts" && perms.canCreateMessages
                  ? "/messages/new"
                  : undefined
              }
            />
          ) : (
            <MessagesTable
              messages={messages}
              tab={tab}
              canManageMessages={perms.canManageMessages}
            />
          )}
        </div>
      )}
    </>
  );
}
