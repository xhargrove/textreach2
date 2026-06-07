import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { KeywordForm } from "@/components/keywords/keyword-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getListsWithCounts } from "@/lib/queries/lists";

export const metadata = {
  title: "Add Keyword",
};

export default async function NewKeywordPage() {
  const ctx = await requirePagePermission("manage_keywords");
  const lists = await getListsWithCounts(ctx.workspaceId);

  const listOptions = lists.map((list) => ({
    id: list.id,
    name: list.name,
  }));

  return (
    <>
      <PageHeader
        title="Add Keyword"
        description="Create a text-to-join keyword with an auto-reply"
      />
      <Card>
        <KeywordForm mode="create" lists={listOptions} />
      </Card>
    </>
  );
}
