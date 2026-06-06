import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { messageStatusBadge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { messages } from "@/lib/mock-data";
import { formatNumber, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Messages",
};

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        title="Messages"
        description="Write, send, and schedule text messages"
        action={<Button>New Message</Button>}
      />

      <Table>
        <TableHead>
          <TableHeaderCell>Message</TableHeaderCell>
          <TableHeaderCell>List</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Recipients</TableHeaderCell>
          <TableHeaderCell>Delivered</TableHeaderCell>
          <TableHeaderCell>Replies</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
        </TableHead>
        <TableBody>
          {messages.map((msg) => (
            <TableRow key={msg.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900">{msg.name}</p>
                  <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                    {msg.body}
                  </p>
                </div>
              </TableCell>
              <TableCell>{msg.list}</TableCell>
              <TableCell>{messageStatusBadge(msg.status)}</TableCell>
              <TableCell>{formatNumber(msg.recipients)}</TableCell>
              <TableCell>{formatNumber(msg.delivered)}</TableCell>
              <TableCell>{formatNumber(msg.replies)}</TableCell>
              <TableCell>
                {msg.sentAt
                  ? formatDateTime(msg.sentAt)
                  : msg.scheduledAt
                    ? `Scheduled ${formatDateTime(msg.scheduledAt)}`
                    : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
