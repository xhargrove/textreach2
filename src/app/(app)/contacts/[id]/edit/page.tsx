import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contacts/contact-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import {
  getContactById,
  getContactFormOptions,
} from "@/lib/queries/contacts";
import { formatContactName } from "@/lib/validation/phone";
import { formatPhone } from "@/lib/utils";

type PageProps = {
  params: { id: string };
};

export const metadata = {
  title: "Edit Contact",
};

export default async function EditContactPage({ params }: PageProps) {
  const ctx = await requirePagePermission("manage_contacts");
  const [contact, { lists, tags }] = await Promise.all([
    getContactById(ctx.workspaceId, params.id),
    getContactFormOptions(ctx.workspaceId),
  ]);

  if (!contact) {
    notFound();
  }

  const name = formatContactName(contact.firstName, contact.lastName);

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/contacts/${contact.id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to Contact
        </Link>
      </div>

      <PageHeader
        title="Edit Contact"
        description={
          name !== "—" ? `${name} · ${formatPhone(contact.phone)}` : formatPhone(contact.phone)
        }
      />

      <Card className="max-w-2xl">
        <ContactForm
          mode="edit"
          lists={lists}
          tags={tags}
          defaultValues={{
            contactId: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            email: contact.email,
            status: contact.status,
            source: contact.source,
            consentTimestamp: contact.consentTimestamp,
            listIds: contact.listContacts.map((lc) => lc.listId),
            tagIds: contact.contactTags.map((ct) => ct.tagId),
          }}
        />
      </Card>
    </>
  );
}
