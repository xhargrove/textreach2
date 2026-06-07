import Link from "next/link";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { messageStatusBadge } from "@/components/ui/badge";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { MessageRowActions } from "@/components/messages/message-row-actions";
import { formatNumber, formatDateTime } from "@/lib/utils";
import type { MessageWithRelations } from "@/lib/queries/messages";
import type { MessageTab } from "@/lib/queries/messages";

type MessagesTableProps = {
  messages: MessageWithRelations[];
  tab: MessageTab;
  canManageMessages?: boolean;
};

function getDisplayDate(
  message: MessageWithRelations,
  tab: MessageTab
): string {
  if (tab === "sent" && message.sentAt) {
    return formatDateTime(message.sentAt);
  }
  if (tab === "scheduled" && message.scheduledAt) {
    return formatDateTime(message.scheduledAt);
  }
  if (message.sentAt) return formatDateTime(message.sentAt);
  if (message.scheduledAt) return formatDateTime(message.scheduledAt);
  return "—";
}

export function MessagesTable({
  messages,
  tab,
  canManageMessages = false,
}: MessagesTableProps) {
  const dateLabel =
    tab === "scheduled" ? "Scheduled for" : "Sent / scheduled";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {messages.map((message) => (
          <MobileDataCard
            key={message.id}
            href={`/messages/${message.id}`}
            title={message.name}
            subtitle={message.list?.name ?? "No list"}
            badge={messageStatusBadge(message.status)}
            rows={[
              {
                label: "Recipients",
                value:
                  message.recipients.length > 0
                    ? formatNumber(message.recipients.length)
                    : "—",
              },
              {
                label: dateLabel,
                value: getDisplayDate(message, tab),
              },
            ]}
            actions={
              <MessageRowActions
                messageId={message.id}
                messageName={message.name}
                status={message.status}
                canManage={canManageMessages}
              />
            }
          />
        ))}
      </div>

      <Table>
        <TableHead>
          <TableHeaderCell>Message name</TableHeaderCell>
          <TableHeaderCell>List</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Recipients</TableHeaderCell>
          <TableHeaderCell>
            {tab === "scheduled" ? "Scheduled date" : "Sent / Scheduled date"}
          </TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell>
                <Link
                  href={`/messages/${message.id}`}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {message.name}
                </Link>
              </TableCell>
              <TableCell>{message.list?.name ?? "—"}</TableCell>
              <TableCell>{messageStatusBadge(message.status)}</TableCell>
              <TableCell>
                {message.recipients.length > 0
                  ? formatNumber(message.recipients.length)
                  : "—"}
              </TableCell>
              <TableCell>{getDisplayDate(message, tab)}</TableCell>
              <TableCell>
                <MessageRowActions
                  messageId={message.id}
                  messageName={message.name}
                  status={message.status}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
