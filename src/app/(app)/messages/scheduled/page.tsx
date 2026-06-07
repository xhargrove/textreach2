import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScheduledMessagesTable } from "@/components/messages/scheduled-messages-table";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import { getAllScheduledMessages } from "@/lib/queries/messages";

export const metadata = {
  title: "Scheduled Messages",
};

type ScheduledMessagesPageProps = {
  searchParams: Promise<{ canceled?: string }>;
};

export default async function ScheduledMessagesPage({
  searchParams,
}: ScheduledMessagesPageProps) {
  const ctx = await requirePagePermission("view_messages");
  const perms = getPagePermissions(ctx);
  const { canceled } = await searchParams;
  const messages = await getAllScheduledMessages(ctx.workspaceId);
  const now = new Date();
  const upcoming = messages.filter(
    (message) => message.scheduledAt && message.scheduledAt >= now
  );
  const overdue = messages.filter(
    (message) => message.scheduledAt && message.scheduledAt < now
  );

  return (
    <>
      <PageHeader
        title="Scheduled Messages"
        description="Upcoming messages queued to send automatically"
        action={
          <div className="flex gap-2">
            {perms.canCreateMessages && (
              <Button href="/messages/new" size="sm">
                New message
              </Button>
            )}
            <Button href="/messages?tab=scheduled" variant="secondary" size="sm">
              All messages
            </Button>
          </div>
        }
      />

      {canceled === "1" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Scheduled send canceled. The message was moved back to drafts.
        </div>
      )}

      {messages.length === 0 ? (
        <EmptyState
          title="No scheduled messages"
          description="Schedule event reminders and promotions to send at a specific date and time."
          actionLabel={perms.canCreateMessages ? "Schedule a message" : undefined}
          actionHref={perms.canCreateMessages ? "/messages/new" : undefined}
        />
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-700">
                Processing soon
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                These messages are due now and will send automatically within a
                few minutes.
              </p>
              <ScheduledMessagesTable
                messages={overdue}
                canManageMessages={perms.canManageMessages}
              />
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Upcoming
              </h2>
              <ScheduledMessagesTable
                messages={upcoming}
                canManageMessages={perms.canManageMessages}
              />
            </section>
          )}
        </div>
      )}
    </>
  );
}
