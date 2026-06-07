import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CsvImportWizard } from "@/components/contacts/import/csv-import-wizard";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getListsWithCounts } from "@/lib/queries/lists";

export const metadata = {
  title: "Import Contacts",
};

export default async function ImportContactsPage() {
  const ctx = await requirePagePermission("manage_contacts");
  const lists = await getListsWithCounts(ctx.workspaceId);

  const listOptions = lists.map((l) => ({ id: l.id, name: l.name }));

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
        title="Import Contacts"
        description="Upload a CSV file to add contacts to a list quickly"
      />

      <Card className="max-w-4xl">
        <CsvImportWizard lists={listOptions} />
      </Card>
    </>
  );
}
