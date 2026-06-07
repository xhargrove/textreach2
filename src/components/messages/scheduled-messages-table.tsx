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
import { ScheduledMessageActions } from "@/components/messages/scheduled-message-actions";
import { formatNumber, formatDateTime } from "@/lib/utils";
import type { MessageWithRelations } from "@/lib/queries/messages";

type ScheduledMessagesTableProps = {
  messages: MessageWithRelations[];
  canManageMessages?: boolean;
};

export function ScheduledMessagesTable({
  messages,
  canManageMessages = false,
}: ScheduledMessagesTableProps) {
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
                label: "Scheduled for",
                value: message.scheduledAt
                  ? formatDateTime(message.scheduledAt)
                  : "—",
              },
              {
                label: "Recipients",
                value:
                  message.recipients.length > 0
                    ? formatNumber(message.recipients.length)
                    : "—",
              },
            ]}
            actions={
              <ScheduledMessageActions
                messageId={message.id}
                messageName={message.name}
                canManage={canManageMessages}
              />
            }
          />
        ))}
      </div>

      <Table>
        <TableHead>
          <TableHeaderCell>Message</TableHeaderCell>
          <TableHeaderCell>List</TableHeaderCell>
          <TableHeaderCell>Scheduled for</TableHeaderCell>
          <TableHeaderCell>Recipients</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
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
              <TableCell>
                {message.scheduledAt
                  ? formatDateTime(message.scheduledAt)
                  : "—"}
              </TableCell>
              <TableCell>
                {message.recipients.length > 0
                  ? formatNumber(message.recipients.length)
                  : "—"}
              </TableCell>
              <TableCell>{messageStatusBadge(message.status)}</TableCell>
              <TableCell>
                <ScheduledMessageActions
                  messageId={message.id}
                  messageName={message.name}
                  canManage={canManageMessages}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
