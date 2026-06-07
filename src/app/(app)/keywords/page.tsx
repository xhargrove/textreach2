import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KeywordsTable } from "@/components/keywords/keywords-table";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import { getKeywordsWithList } from "@/lib/queries/keywords";

export const metadata = {
  title: "Keywords",
};

export default async function KeywordsPage() {
  const ctx = await requirePagePermission("view_keywords");
  const perms = getPagePermissions(ctx);
  const keywords = await getKeywordsWithList(ctx.workspaceId);

  return (
    <>
      <PageHeader
        title="Keywords"
        description="Let people join your lists by texting a keyword — e.g. text VINYL to subscribe"
        action={
          perms.canManageKeywords ? (
            <Button href="/keywords/new">Add Keyword</Button>
          ) : undefined
        }
      />

      {keywords.length === 0 ? (
        <EmptyState
          title="No keywords yet"
          description="Create a keyword like FRIDAY so people can text to join a list and receive an auto-reply."
          actionLabel={perms.canManageKeywords ? "Add Keyword" : undefined}
          actionHref={perms.canManageKeywords ? "/keywords/new" : undefined}
        />
      ) : (
        <KeywordsTable
          keywords={keywords}
          canManageKeywords={perms.canManageKeywords}
        />
      )}
    </>
  );
}
