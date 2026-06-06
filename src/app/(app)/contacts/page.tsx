import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { contacts } from "@/lib/mock-data";

export const metadata = {
  title: "Contacts",
};

export default function ContactsPage() {
  return (
    <>
      <PageHeader
        title="Contacts"
        description="Manage the people you send messages to"
        action={<Button>Add Contact</Button>}
      />

      <Table>
        <TableHead>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Phone</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Lists</TableHeaderCell>
          <TableHeaderCell>Tags</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">
                {contact.firstName} {contact.lastName}
              </TableCell>
              <TableCell>{contact.phone}</TableCell>
              <TableCell>{contact.email ?? "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.lists.map((list) => (
                    <Badge key={list}>{list}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.length > 0
                    ? contact.tags.map((tag) => (
                        <Badge key={tag} variant="info">
                          {tag}
                        </Badge>
                      ))
                    : "—"}
                </div>
              </TableCell>
              <TableCell>
                {contact.optedOut ? (
                  <Badge variant="error">Opted out</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
