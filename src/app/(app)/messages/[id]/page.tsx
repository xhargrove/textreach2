import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { messageStatusBadge } from "@/components/ui/badge";
import { MessagePreviewBubble } from "@/components/messages/message-preview-bubble";
import { ComplianceReminder } from "@/components/messages/compliance-reminder";
import { ScheduledMessageActions } from "@/components/messages/scheduled-message-actions";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getPagePermissions } from "@/lib/auth/page-permissions";
import {
  getMessageById,
  getRecipientStats,
} from "@/lib/queries/messages";
import { getMessageLinkStats } from "@/lib/queries/link-clicks";
import { getMessageReplyStats } from "@/lib/queries/message-replies";
import { MessageRepliesSection } from "@/components/messages/message-replies-section";
import { getComplianceArchive } from "@/lib/queries/compliance-settings";
import { sendScheduledMessageNowAction } from "@/lib/actions/messages";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { getSmsStats } from "@/lib/messages/sms-utils";
import { isWorkspaceTwilioReady } from "@/lib/twilio/service";

export const metadata = {
  title: "Message",
};

type MessageDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string; msg?: string }>;
};

export default async function MessageDetailPage({
  params,
  searchParams,
}: MessageDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const ctx = await requirePagePermission("view_messages");
  const perms = getPagePermissions(ctx);
  const message = await getMessageById(ctx.workspaceId, id);

  if (!message) notFound();

  const stats = getRecipientStats(message.recipients);
  const twilioReady = await isWorkspaceTwilioReady(ctx.workspaceId);
  const deliveredCount = stats.delivered + stats.sent;
  const linkStats =
    message.status === "sent"
      ? await getMessageLinkStats(ctx.workspaceId, message.id, deliveredCount)
      : null;
  const replyStats =
    message.status === "sent"
      ? await getMessageReplyStats(
          ctx.workspaceId,
          message.id,
          message.sentAt,
          [...new Set(message.recipients.map((r) => r.contactId))]
        )
      : null;
  const complianceArchive =
    message.status === "sent" || message.status === "failed"
      ? await getComplianceArchive(ctx.workspaceId, message.id)
      : null;
  const previewBody = message.sentBody ?? message.body;
  const previewSmsStats = getSmsStats(previewBody);

  return (
    <>
      <PageHeader
        title={message.name}
        description={
          message.list
            ? `List: ${message.list.name}`
            : "Message details"
        }
        action={
          <div className="flex gap-2">
            <Button variant="secondary" href={`/results/messages/${id}`}>
              View results
            </Button>
            <Button variant="secondary" href="/messages">
              All messages
            </Button>
            {message.status === "scheduled" && (
              <Button variant="secondary" href="/messages/scheduled">
                Scheduled
              </Button>
            )}
          </div>
        }
      />

      {query.success === "1" && stats.failed === 0 && stats.undelivered === 0 && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message.status === "sent" && (
            <>
              Message submitted to Twilio for {formatNumber(stats.sent)} contact
              {stats.sent === 1 ? "" : "s"}.
              {(stats.skipped > 0 || stats.optedOut > 0) &&
                ` ${formatNumber(stats.skipped + stats.optedOut)} skipped.`}
            </>
          )}
          {message.status === "scheduled" && (
            <>Message scheduled successfully.</>
          )}
        </div>
      )}

      {(stats.failed > 0 || stats.undelivered > 0) && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Delivery failed.</strong> Twilio accepted the message but the
          carrier did not deliver it to{" "}
          {formatNumber(Math.max(stats.failed, stats.undelivered))} recipient
          {Math.max(stats.failed, stats.undelivered) === 1 ? "" : "s"}. See
          details below.
        </div>
      )}

      {query.error === "twilio" && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Twilio is not configured. Add your credentials to send messages.
        </div>
      )}

      {query.error === "limit" && query.msg && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Message limit reached.</strong>{" "}
          {decodeURIComponent(query.msg)}{" "}
          <a href="/billing" className="font-medium text-brand-700 underline">
            Go to Billing
          </a>
        </div>
      )}

      {query.error === "send_failed" && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Scheduled send failed. Check Twilio configuration, plan limits, billing
          status, and that your list still has deliverable contacts.
        </div>
      )}

      {query.error === "billing" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Send blocked.</strong>{" "}
          {query.msg
            ? decodeURIComponent(query.msg)
            : "Your workspace needs an active plan before sending messages."}{" "}
          <a href="/billing" className="font-medium text-brand-700 underline">
            Go to Billing
          </a>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total recipients" value={formatNumber(stats.total)} />
        <StatCard label="Sent" value={formatNumber(stats.sent)} />
        <StatCard label="Failed" value={formatNumber(stats.failed)} />
        <StatCard label="Skipped" value={formatNumber(stats.skipped)} />
        <StatCard label="Opted out" value={formatNumber(stats.optedOut)} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {replyStats ? (
          <MessageRepliesSection replyStats={replyStats} compact />
        ) : (
          <StatCard
            label="Replies"
            value="—"
            description="Available after send"
          />
        )}
        <StatCard
          label="Link clicks"
          value={
            linkStats ? formatNumber(linkStats.totalClicks) : "—"
          }
          description={
            linkStats
              ? `${linkStats.uniqueClicks} unique · ${linkStats.clickThroughRate}% CTR`
              : "Available after send"
          }
        />
      </div>

      {replyStats && replyStats.totalReplies > 0 && (
        <div className="mb-6">
          <MessageRepliesSection
            replyStats={replyStats}
            deliveredCount={deliveredCount}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Status</dt>
              <dd>{messageStatusBadge(message.status)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">List</dt>
              <dd className="font-medium text-gray-900">
                {message.list ? (
                  <Link
                    href={`/lists/${message.list.id}`}
                    className="text-brand-600 hover:text-brand-700"
                  >
                    {message.list.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">SMS segments</dt>
              <dd className="font-medium text-gray-900">
                {previewSmsStats.segments || "—"}
              </dd>
            </div>
            {message.sentAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Sent date</dt>
                <dd className="font-medium text-gray-900">
                  {formatDateTime(message.sentAt)}
                </dd>
              </div>
            )}
            {message.scheduledAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Scheduled for</dt>
                <dd className="font-medium text-gray-900">
                  {formatDateTime(message.scheduledAt)}
                </dd>
              </div>
            )}
            {stats.queued > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Queued</dt>
                <dd className="font-medium text-gray-900">
                  {formatNumber(stats.queued)}
                </dd>
              </div>
            )}
          </dl>

          {message.status === "scheduled" && perms.canManageMessages && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <ScheduledMessageActions
                messageId={message.id}
                messageName={message.name}
                canManage={perms.canManageMessages}
              />
              <form action={sendScheduledMessageNowAction}>
                <input type="hidden" name="messageId" value={message.id} />
                <Button type="submit" size="sm" disabled={!twilioReady}>
                  Send now
                </Button>
                {!twilioReady && (
                  <p className="mt-2 text-xs text-amber-700">
                    Configure Twilio in your .env file to send.
                  </p>
                )}
              </form>
            </div>
          )}

          <ComplianceReminder />
        </Card>

        <MessagePreviewBubble body={previewBody} />
      </div>

      {complianceArchive && (
        <Card className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Compliance archive
          </h2>
          <p className="text-sm text-gray-500">
            Record preserved at send time for compliance and audit purposes.
          </p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-gray-500">List</dt>
              <dd className="font-medium text-gray-900">
                {complianceArchive.listName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Sender number</dt>
              <dd className="font-medium text-gray-900">
                {complianceArchive.senderNumber ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Sent at</dt>
              <dd className="font-medium text-gray-900">
                {formatDateTime(complianceArchive.sentAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Total recipients</dt>
              <dd className="font-medium text-gray-900">
                {formatNumber(complianceArchive.totalRecipients)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Sent</dt>
              <dd className="font-medium text-green-700">
                {formatNumber(complianceArchive.sentCount)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Failed</dt>
              <dd className="font-medium text-red-700">
                {formatNumber(complianceArchive.failedCount)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Skipped opt-outs</dt>
              <dd className="font-medium text-amber-700">
                {formatNumber(complianceArchive.skippedOptOuts)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Skipped invalid</dt>
              <dd className="font-medium text-amber-700">
                {formatNumber(complianceArchive.skippedInvalid)}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Message body as sent
            </h3>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
              {complianceArchive.messageBody}
            </pre>
          </div>
        </Card>
      )}

      {stats.failed > 0 && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Failed deliveries
          </h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {message.recipients
              .filter((r) => r.status === "failed" || r.status === "undelivered")
              .map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <span className="font-medium text-gray-900">
                    {recipient.phone}
                  </span>
                  <span className="max-w-md text-right text-red-600">
                    {recipient.errorMessage ?? "Delivery failed"}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </>
  );
}
