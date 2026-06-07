import Link from "next/link";
import { contactStatusBadge, Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { removeContactFromListAction } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { formatContactName } from "@/lib/validation/phone";
import { formatPhone } from "@/lib/utils";
import type { getListContacts } from "@/lib/queries/lists";

type ListContactsTableProps = {
  listId: string;
  listContacts: NonNullable<
    Awaited<ReturnType<typeof getListContacts>>
  >["listContacts"];
  canManageLists?: boolean;
};

export function ListContactsTable({
  listId,
  listContacts,
  canManageLists = false,
}: ListContactsTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {listContacts.map((lc) => {
          const contact = lc.contact;
          const name = formatContactName(contact.firstName, contact.lastName);
          const displayName = name === "—" ? "Unnamed contact" : name;

          return (
            <MobileDataCard
              key={lc.id}
              href={`/contacts/${contact.id}`}
              title={displayName}
              subtitle={formatPhone(contact.phone)}
              badge={contactStatusBadge(contact.status)}
              actions={
                canManageLists ? (
                  <form action={removeContactFromListAction}>
                    <input type="hidden" name="listId" value={listId} />
                    <input type="hidden" name="contactId" value={contact.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove from list
                    </Button>
                  </form>
                ) : undefined
              }
            />
          );
        })}
      </div>

      <Table>
        <TableHead>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Phone</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Tags</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {listContacts.map((lc) => {
            const contact = lc.contact;
            const name = formatContactName(contact.firstName, contact.lastName);

            return (
              <TableRow key={lc.id}>
                <TableCell>
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {name === "—" ? "Unnamed contact" : name}
                  </Link>
                </TableCell>
                <TableCell>{formatPhone(contact.phone)}</TableCell>
                <TableCell>{contact.email ?? "—"}</TableCell>
                <TableCell>{contactStatusBadge(contact.status)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.contactTags.length > 0
                      ? contact.contactTags.map((ct) => (
                          <Badge key={ct.tagId} variant="info">
                            {ct.tag.name}
                          </Badge>
                        ))
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  {canManageLists ? (
                    <form action={removeContactFromListAction}>
                      <input type="hidden" name="listId" value={listId} />
                      <input type="hidden" name="contactId" value={contact.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
