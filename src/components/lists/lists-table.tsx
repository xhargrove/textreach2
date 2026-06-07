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
import { ListRowActions } from "@/components/lists/list-row-actions";
import { formatNumber, formatDate } from "@/lib/utils";

type ListItem = {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: Date;
};

type ListsTableProps = {
  lists: ListItem[];
  canManageLists?: boolean;
};

export function ListsTable({
  lists,
  canManageLists = false,
}: ListsTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {lists.map((list) => (
          <MobileDataCard
            key={list.id}
            href={`/lists/${list.id}`}
            title={list.name}
            subtitle={list.description ?? "No description"}
            rows={[
              { label: "Contacts", value: formatNumber(list.contactCount) },
              { label: "Created", value: formatDate(list.createdAt) },
            ]}
            actions={
              <ListRowActions
                listId={list.id}
                listName={list.name}
                canManage={canManageLists}
              />
            }
          />
        ))}
      </div>

      <Table>
        <TableHead>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Description</TableHeaderCell>
          <TableHeaderCell>Contacts</TableHeaderCell>
          <TableHeaderCell>Created</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {lists.map((list) => (
            <TableRow key={list.id}>
              <TableCell>
                <Link
                  href={`/lists/${list.id}`}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {list.name}
                </Link>
              </TableCell>
              <TableCell className="max-w-xs truncate text-gray-600">
                {list.description ?? "—"}
              </TableCell>
              <TableCell>{formatNumber(list.contactCount)}</TableCell>
              <TableCell>{formatDate(list.createdAt)}</TableCell>
              <TableCell>
                <ListRowActions
                listId={list.id}
                listName={list.name}
                canManage={canManageLists}
              />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
