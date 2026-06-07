import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListContactsSearch } from "@/components/lists/list-contacts-search";
import { ListContactsTable } from "@/components/lists/list-contacts-table";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import { getListContacts } from "@/lib/queries/lists";
import { formatNumber } from "@/lib/utils";

type PageProps = {
  params: { id: string };
  searchParams: { q?: string; success?: string; count?: string };
};

export async function generateMetadata({ params }: PageProps) {
  const ctx = await requirePagePermission("view_lists");
  const result = await getListContacts(ctx.workspaceId, params.id);
  return { title: result?.list.name ?? "List" };
}

export default async function ListDetailPage({
  params,
  searchParams,
}: PageProps) {
  const ctx = await requirePagePermission("view_lists");
  const perms = getPagePermissions(ctx);
  const result = await getListContacts(
    ctx.workspaceId,
    params.id,
    searchParams.q
  );

  if (!result) {
    notFound();
  }

  const { list, listContacts } = result;
  const addedCount = searchParams.count
    ? parseInt(searchParams.count, 10)
    : null;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/lists"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to Lists
        </Link>
      </div>

      {searchParams.success === "added" && addedCount !== null && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          Successfully added {formatNumber(addedCount)} contact
          {addedCount === 1 ? "" : "s"} to this list.
        </div>
      )}

      <PageHeader
        title={list.name}
        description={list.description ?? "No description"}
        action={
          <div className="flex gap-2">
            <Button href={`/results/lists/${list.id}`} variant="secondary">
              View results
            </Button>
            {perms.canManageLists && (
              <>
                <Button href={`/lists/${list.id}/add-contacts`} variant="secondary">
                  Add Contacts
                </Button>
                <Button href={`/lists/${list.id}/edit`} variant="secondary">
                  Edit
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card padding={true}>
          <p className="text-sm text-gray-500">Contacts on this list</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatNumber(list._count.listContacts)}
          </p>
        </Card>
        <Card padding={true}>
          <p className="text-sm text-gray-500">Created</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {new Intl.DateTimeFormat("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(list.createdAt)}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
        {perms.canManageLists && (
          <Button href={`/lists/${list.id}/add-contacts`} size="sm">
            Add Contacts
          </Button>
        )}
      </div>

      {list._count.listContacts > 0 && (
        <Suspense
          fallback={
            <div className="mb-4 h-10 animate-pulse rounded-lg bg-gray-100" />
          }
        >
          <ListContactsSearch listId={list.id} />
        </Suspense>
      )}

      {listContacts.length === 0 ? (
        list._count.listContacts === 0 ? (
          <EmptyState
            title="No contacts on this list"
            description="Add contacts to start building your list for messages."
            actionLabel={perms.canManageLists ? "Add Contacts" : undefined}
            actionHref={
              perms.canManageLists ? `/lists/${list.id}/add-contacts` : undefined
            }
          />
        ) : (
          <EmptyState
            title="No matching contacts"
            description="Try a different search term."
          />
        )
      ) : (
        <ListContactsTable
          listId={list.id}
          listContacts={listContacts}
          canManageLists={perms.canManageLists}
        />
      )}
    </>
  );
}
