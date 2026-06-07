import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InboxConversationList } from "@/components/inbox/inbox-conversation-list";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import {
  getInboxConversations,
  getInboxUnreadCount,
} from "@/lib/queries/inbox";

export const metadata = {
  title: "Inbox",
};

export default async function InboxPage() {
  const ctx = await requirePagePermission("view_inbox");
  const perms = getPagePermissions(ctx);
  const [conversations, unreadCount] = await Promise.all([
    getInboxConversations(ctx.workspaceId),
    getInboxUnreadCount(ctx.workspaceId),
  ]);

  return (
    <>
      <PageHeader
        title="Inbox"
        description={
          unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? "reply" : "replies"} — tap a conversation to respond.`
            : "Replies from your contacts show up here. Tap a conversation to respond."
        }
        action={
          conversations.length > 0 && perms.canCreateMessages ? (
            <Button href="/messages/new" variant="secondary">
              New message
            </Button>
          ) : undefined
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="Inbox is empty"
          description="When contacts reply to your messages, their responses will appear here."
          actionLabel={perms.canCreateMessages ? "Send a message" : undefined}
          actionHref={perms.canCreateMessages ? "/messages/new" : undefined}
        />
      ) : (
        <InboxConversationList conversations={conversations} />
      )}
    </>
  );
}
