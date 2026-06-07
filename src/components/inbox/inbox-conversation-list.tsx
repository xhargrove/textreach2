import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPhone } from "@/lib/utils";
import type { InboxConversation } from "@/lib/queries/inbox";

type InboxConversationListProps = {
  conversations: InboxConversation[];
  activeContactId?: string;
};

function displayName(conversation: InboxConversation): string {
  if (conversation.contactName && conversation.contactName !== "—") {
    return conversation.contactName;
  }
  return formatPhone(conversation.phone);
}

export function InboxConversationList({
  conversations,
  activeContactId,
}: InboxConversationListProps) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {conversations.map((conversation) => {
        const isActive = conversation.contactId === activeContactId;
        const name = displayName(conversation);
        const previewPrefix =
          conversation.lastMessageDirection === "outbound" ? "You: " : "";

        return (
          <Link
            key={conversation.contactId}
            href={`/inbox/${conversation.contactId}`}
            className={`block px-4 py-4 transition-colors hover:bg-gray-50 ${
              isActive ? "bg-brand-50/50" : ""
            } ${conversation.unreadCount > 0 ? "border-l-4 border-l-brand-500" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-gray-900">{name}</p>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="info">{conversation.unreadCount} new</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-gray-500">
                  {formatPhone(conversation.phone)}
                </p>
                <p className="mt-1 truncate text-sm text-gray-600">
                  {previewPrefix}
                  {conversation.lastMessageBody}
                </p>
              </div>
              <p className="shrink-0 text-xs text-gray-400">
                {formatDateTime(conversation.lastMessageAt)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
