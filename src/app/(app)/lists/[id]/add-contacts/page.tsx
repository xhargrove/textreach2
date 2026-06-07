import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { AddContactsForm } from "@/components/lists/add-contacts-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import {
  getListById,
  getAvailableContactsForList,
} from "@/lib/queries/lists";

type PageProps = {
  params: { id: string };
  searchParams: { q?: string };
};

export const metadata = {
  title: "Add Contacts to List",
};

export default async function AddContactsPage({
  params,
  searchParams,
}: PageProps) {
  const ctx = await requirePagePermission("manage_lists");
  const list = await getListById(ctx.workspaceId, params.id);

  if (!list) {
    notFound();
  }

  const contacts = await getAvailableContactsForList(
    ctx.workspaceId,
    params.id,
    searchParams.q
  );

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/lists/${list.id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to {list.name}
        </Link>
      </div>

      <PageHeader
        title="Add Contacts"
        description={`Select contacts to add to ${list.name}`}
      />

      <Card className="max-w-2xl">
        <AddContactsForm
          listId={list.id}
          contacts={contacts}
          initialQuery={searchParams.q}
        />
      </Card>
    </>
  );
}
