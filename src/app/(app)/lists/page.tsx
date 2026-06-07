import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListsTable } from "@/components/lists/lists-table";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import { getListsWithCounts } from "@/lib/queries/lists";

export const metadata = {
  title: "Lists",
};

export default async function ListsPage() {
  const ctx = await requirePagePermission("view_lists");
  const perms = getPagePermissions(ctx);
  const lists = await getListsWithCounts(ctx.workspaceId);

  const listItems = lists.map((list) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    contactCount: list._count.listContacts,
    createdAt: list.createdAt,
  }));

  return (
    <>
      <PageHeader
        title="Lists"
        description="Lists help you group contacts so you can send the right message to the right people."
        action={
          perms.canManageLists ? (
            <Button href="/lists/new">Create List</Button>
          ) : undefined
        }
      />

      {listItems.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create a list to organize contacts before sending messages."
          actionLabel={perms.canManageLists ? "Create List" : undefined}
          actionHref={perms.canManageLists ? "/lists/new" : undefined}
        />
      ) : (
        <ListsTable lists={listItems} canManageLists={perms.canManageLists} />
      )}
    </>
  );
}
