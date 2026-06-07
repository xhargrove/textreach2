import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ListForm } from "@/components/lists/list-form";
import { requirePagePermission } from "@/lib/auth/authorization";

export const metadata = {
  title: "Create List",
};

export default async function NewListPage() {
  await requirePagePermission("manage_lists");
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

      <PageHeader
        title="Create List"
        description="Group contacts so you can send the right message to the right people."
      />

      <Card className="max-w-xl">
        <ListForm mode="create" />
      </Card>
    </>
  );
}
