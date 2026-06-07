import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { contactStatusBadge } from "@/components/ui/badge";
import { InboxConversationList } from "@/components/inbox/inbox-conversation-list";
import { InboxConversationFooter } from "@/components/inbox/inbox-conversation-footer";
import { InboxThread } from "@/components/inbox/inbox-thread";
import { requirePagePermission } from "@/lib/auth/authorization";
import { canReplyToInbox } from "@/lib/auth/page-permissions";
import {
  getInboxConversations,
  getConversationMessages,
} from "@/lib/queries/inbox";
import { markConversationReadAction } from "@/lib/actions/inbox";
import { formatContactName } from "@/lib/validation/phone";
import { formatPhone } from "@/lib/utils";
import { isWorkspaceTwilioReady } from "@/lib/twilio/service";

export const metadata = {
  title: "Conversation",
};

type InboxConversationPageProps = {
  params: { contactId: string };
};

export default async function InboxConversationPage({
  params,
}: InboxConversationPageProps) {
  const ctx = await requirePagePermission("view_inbox");
  const canReply = canReplyToInbox(ctx);
  const [conversations, conversation] = await Promise.all([
    getInboxConversations(ctx.workspaceId),
    getConversationMessages(ctx.workspaceId, params.contactId),
  ]);

  if (!conversation) notFound();

  await markConversationReadAction(params.contactId);

  const { contact, messages } = conversation;
  const displayName =
    formatContactName(contact.firstName, contact.lastName) !== "—"
      ? formatContactName(contact.firstName, contact.lastName)
      : formatPhone(contact.phone);

  const twilioReady = await isWorkspaceTwilioReady(ctx.workspaceId);
  const isOptedOut = contact.status === "opted_out";

  return (
    <>
      <PageHeader
        title={displayName}
        description={formatPhone(contact.phone)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {contactStatusBadge(contact.status)}
            <Button variant="secondary" href="/inbox" className="lg:hidden">
              ← Back
            </Button>
            <Button variant="secondary" href="/inbox" className="hidden lg:inline-flex">
              All conversations
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="hidden lg:block">
          <p className="mb-3 text-sm font-medium text-gray-700">Conversations</p>
          <InboxConversationList
            conversations={conversations}
            activeContactId={params.contactId}
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 lg:col-span-2">
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            <Link
              href={`/contacts/${contact.id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View contact profile →
            </Link>
          </div>

          <div className="min-h-[320px] flex-1 overflow-y-auto">
            <InboxThread messages={messages} />
          </div>

          <InboxConversationFooter
            canReply={canReply}
            contactId={contact.id}
            twilioReady={twilioReady}
            isOptedOut={isOptedOut}
          />
        </div>
      </div>
    </>
  );
}
