import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { KeywordForm } from "@/components/keywords/keyword-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getKeywordById } from "@/lib/queries/keywords";
import { getListsWithCounts } from "@/lib/queries/lists";

export const metadata = {
  title: "Edit Keyword",
};

type EditKeywordPageProps = {
  params: { id: string };
};

export default async function EditKeywordPage({ params }: EditKeywordPageProps) {
  const ctx = await requirePagePermission("manage_keywords");
  const [keyword, lists] = await Promise.all([
    getKeywordById(ctx.workspaceId, params.id),
    getListsWithCounts(ctx.workspaceId),
  ]);

  if (!keyword) notFound();

  const listOptions = lists.map((list) => ({
    id: list.id,
    name: list.name,
  }));

  return (
    <>
      <PageHeader
        title={`Edit ${keyword.keyword}`}
        description="Update keyword settings and auto-reply"
      />
      <Card>
        <KeywordForm
          mode="edit"
          lists={listOptions}
          defaultValues={{
            keywordId: keyword.id,
            keyword: keyword.keyword,
            listId: keyword.listId,
            autoReply: keyword.autoReply,
            status: keyword.status,
          }}
        />
      </Card>
    </>
  );
}
