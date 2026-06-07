import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ListForm } from "@/components/lists/list-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getListById } from "@/lib/queries/lists";

type PageProps = {
  params: { id: string };
};

export const metadata = {
  title: "Edit List",
};

export default async function EditListPage({ params }: PageProps) {
  const ctx = await requirePagePermission("manage_lists");
  const list = await getListById(ctx.workspaceId, params.id);

  if (!list) {
    notFound();
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/lists/${list.id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to List
        </Link>
      </div>

      <PageHeader title="Edit List" description={list.name} />

      <Card className="max-w-xl">
        <ListForm
          mode="edit"
          defaultValues={{
            listId: list.id,
            name: list.name,
            description: list.description,
          }}
        />
      </Card>
    </>
  );
}
