import { ReadOnlyNotice } from "@/components/ui/read-only-notice";
import { InboxReplyForm } from "@/components/inbox/inbox-reply-form";

const INBOX_READ_ONLY_MESSAGE =
  "You can view this conversation, but you do not have permission to send replies.";

type InboxConversationFooterProps = {
  canReply: boolean;
  contactId: string;
  twilioReady: boolean;
  isOptedOut: boolean;
};

export function InboxConversationFooter({
  canReply,
  contactId,
  twilioReady,
  isOptedOut,
}: InboxConversationFooterProps) {
  if (!canReply) {
    return (
      <div className="border-t border-gray-200 bg-white p-4">
        <ReadOnlyNotice message={INBOX_READ_ONLY_MESSAGE} />
      </div>
    );
  }

  return (
    <InboxReplyForm
      contactId={contactId}
      disabled={!twilioReady || isOptedOut}
      disabledReason={
        !twilioReady
          ? "Configure Twilio in your .env file to send replies."
          : isOptedOut
            ? "This contact has opted out. They must reply START before you can message them."
            : undefined
      }
    />
  );
}
