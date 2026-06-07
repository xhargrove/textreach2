import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {
  EditScheduledMessageForm,
  toDatetimeLocalValue,
} from "@/components/messages/edit-scheduled-message-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getMessageById } from "@/lib/queries/messages";
import { getListsWithCounts } from "@/lib/queries/lists";

export const metadata = {
  title: "Edit Scheduled Message",
};

type EditScheduledMessagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditScheduledMessagePage({
  params,
}: EditScheduledMessagePageProps) {
  const { id } = await params;
  const ctx = await requirePagePermission("manage_messages");
  const message = await getMessageById(ctx.workspaceId, id);

  if (!message) notFound();

  if (message.status !== "scheduled") {
    redirect(`/messages/${id}`);
  }

  if (!message.scheduledAt || !message.listId) {
    redirect(`/messages/${id}`);
  }

  const lists = await getListsWithCounts(ctx.workspaceId);
  const listOptions = lists.map((list) => ({
    id: list.id,
    name: list.name,
    contactCount: list._count.listContacts,
  }));

  return (
    <>
      <PageHeader
        title="Edit scheduled message"
        description={`Update "${message.name}" before it sends`}
      />

      <Card className="max-w-2xl">
        <EditScheduledMessageForm
          messageId={message.id}
          initialName={message.name}
          initialBody={message.body}
          initialListId={message.listId}
          initialScheduledAt={toDatetimeLocalValue(message.scheduledAt)}
          lists={listOptions}
        />
      </Card>
    </>
  );
}
