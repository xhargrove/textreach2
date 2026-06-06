import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inboxMessages } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Inbox",
};

export default function InboxPage() {
  const unreadCount = inboxMessages.filter((m) => !m.read).length;

  return (
    <>
      <PageHeader
        title="Inbox"
        description={
          unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? "reply" : "replies"}`
            : "All replies from your contacts"
        }
      />

      <div className="space-y-3">
        {inboxMessages.map((msg) => (
          <Card
            key={msg.id}
            className={`p-4 ${!msg.read ? "border-brand-200 bg-brand-50/30" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{msg.contact}</p>
                  {!msg.read && <Badge variant="info">New</Badge>}
                </div>
                <p className="text-xs text-gray-500">{msg.phone}</p>
                <p className="mt-2 text-sm text-gray-700">{msg.body}</p>
              </div>
              <p className="shrink-0 text-xs text-gray-400">
                {formatDateTime(msg.receivedAt)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
