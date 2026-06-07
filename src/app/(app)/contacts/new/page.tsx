import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contacts/contact-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getContactFormOptions } from "@/lib/queries/contacts";

export const metadata = {
  title: "Add Contact",
};

export default async function NewContactPage() {
  const ctx = await requirePagePermission("manage_contacts");
  const { lists, tags } = await getContactFormOptions(ctx.workspaceId);

  return (
    <>
      <div className="mb-4">
        <Link
          href="/contacts"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to Contacts
        </Link>
      </div>

      <PageHeader
        title="Add Contact"
        description="Add someone who gave you permission to text them"
      />

      <Card className="max-w-2xl">
        <ContactForm mode="create" lists={lists} tags={tags} />
      </Card>
    </>
  );
}
