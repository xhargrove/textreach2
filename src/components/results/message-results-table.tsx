import Link from "next/link";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { formatNumber, formatDateTime } from "@/lib/utils";

type MessageResultRow = {
  id: string;
  name: string;
  listName: string | null;
  sentAt: Date | null;
  total: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  replies: number;
};

type MessageResultsTableProps = {
  messages: MessageResultRow[];
};

export function MessageResultsTable({ messages }: MessageResultsTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {messages.map((msg) => (
          <MobileDataCard
            key={msg.id}
            href={`/results/messages/${msg.id}`}
            title={msg.name}
            subtitle={msg.listName ?? "No list"}
            rows={[
              { label: "Recipients", value: formatNumber(msg.total) },
              { label: "Delivered", value: formatNumber(msg.delivered) },
              {
                label: "Delivery rate",
                value: msg.total > 0 ? `${msg.deliveryRate}%` : "—",
              },
              {
                label: "Replies",
                value: formatNumber(msg.replies),
              },
            ]}
          />
        ))}
      </div>

      <Table>
        <TableHead>
          <TableHeaderCell>Message</TableHeaderCell>
          <TableHeaderCell>List</TableHeaderCell>
          <TableHeaderCell>Recipients</TableHeaderCell>
          <TableHeaderCell>Delivered</TableHeaderCell>
          <TableHeaderCell>Failed</TableHeaderCell>
          <TableHeaderCell>Delivery rate</TableHeaderCell>
          <TableHeaderCell>Replies</TableHeaderCell>
          <TableHeaderCell>Sent</TableHeaderCell>
        </TableHead>
        <TableBody>
          {messages.map((msg) => (
            <TableRow key={msg.id}>
              <TableCell>
                <Link
                  href={`/results/messages/${msg.id}`}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {msg.name}
                </Link>
              </TableCell>
              <TableCell className="text-gray-600">{msg.listName ?? "—"}</TableCell>
              <TableCell>{formatNumber(msg.total)}</TableCell>
              <TableCell>{formatNumber(msg.delivered)}</TableCell>
              <TableCell>{formatNumber(msg.failed)}</TableCell>
              <TableCell>
                {msg.total > 0 ? `${msg.deliveryRate}%` : "—"}
              </TableCell>
              <TableCell>{formatNumber(msg.replies)}</TableCell>
              <TableCell>
                {msg.sentAt ? formatDateTime(msg.sentAt) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
