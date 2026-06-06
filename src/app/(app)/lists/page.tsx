import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lists } from "@/lib/mock-data";
import { formatNumber, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Lists",
};

export default function ListsPage() {
  return (
    <>
      <PageHeader
        title="Lists"
        description="Organize contacts into groups for targeted messages"
        action={<Button>Create List</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <Card key={list.id} className="cursor-pointer hover:border-brand-300 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{list.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-brand-600">
                {formatNumber(list.contactCount)} contacts
              </span>
              <span className="text-gray-400">
                Created {formatDate(list.createdAt)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
