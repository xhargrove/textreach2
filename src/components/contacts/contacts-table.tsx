import Link from "next/link";
import {
  contactStatusBadge,
  contactSourceBadge,
  Badge,
} from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { ContactRowActions } from "@/components/contacts/contact-row-actions";
import type { ContactWithRelations } from "@/lib/queries/contacts";
import { formatContactName } from "@/lib/validation/phone";
import { formatPhone, formatDate } from "@/lib/utils";

type ContactsTableProps = {
  contacts: ContactWithRelations[];
  canManageContacts?: boolean;
};

export function ContactsTable({
  contacts,
  canManageContacts = false,
}: ContactsTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {contacts.map((contact) => {
          const name = formatContactName(contact.firstName, contact.lastName);
          const displayName = name === "—" ? "Unnamed contact" : name;
          return (
            <MobileDataCard
              key={contact.id}
              href={`/contacts/${contact.id}`}
              title={displayName}
              subtitle={formatPhone(contact.phone)}
              badge={contactStatusBadge(contact.status)}
              rows={[
                { label: "Email", value: contact.email ?? "—" },
                { label: "Source", value: contactSourceBadge(contact.source) },
                {
                  label: "Lists",
                  value:
                    contact.listContacts.length > 0
                      ? contact.listContacts.map((lc) => lc.list.name).join(", ")
                      : "—",
                },
              ]}
              actions={
                <ContactRowActions
                  contactId={contact.id}
                  contactName={displayName}
                  canManage={canManageContacts}
                />
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
          <TableHeaderCell>Source</TableHeaderCell>
          <TableHeaderCell>Lists</TableHeaderCell>
          <TableHeaderCell>Tags</TableHeaderCell>
          <TableHeaderCell>Created</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => {
            const name = formatContactName(contact.firstName, contact.lastName);
            return (
              <TableRow key={contact.id}>
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
                <TableCell>{contactSourceBadge(contact.source)}</TableCell>
                <TableCell>
                  <div className="flex max-w-[10rem] flex-wrap gap-1">
                    {contact.listContacts.length > 0
                      ? contact.listContacts.map((lc) => (
                          <Badge key={lc.listId}>{lc.list.name}</Badge>
                        ))
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-[10rem] flex-wrap gap-1">
                    {contact.contactTags.length > 0
                      ? contact.contactTags.map((ct) => (
                          <Badge key={ct.tagId} variant="info">
                            {ct.tag.name}
                          </Badge>
                        ))
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>{formatDate(contact.createdAt)}</TableCell>
                <TableCell>
                  <ContactRowActions
                    contactId={contact.id}
                    contactName={name === "—" ? "contact" : name}
                    canManage={canManageContacts}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
