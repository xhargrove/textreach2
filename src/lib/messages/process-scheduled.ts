import { prisma } from "@/lib/prisma";
import { checkMessageLimit } from "@/lib/billing/limits";
import { checkBillingAllowsSend } from "@/lib/billing/subscription";
import { logSendFailure } from "@/lib/logging/send-failures";
import {
  createMessageRecipients,
  deliverMessageViaTwilio,
} from "@/lib/messages/send-message";
import { isWorkspaceTwilioReady } from "@/lib/twilio/service";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import {
  getNextAllowedSendTime,
  isWithinQuietHours,
} from "@/lib/compliance/quiet-hours";

const BATCH_SIZE = 25;
/** Messages stuck in `sending` longer than this are recovered on the next cron run. */
const STUCK_SENDING_MINUTES = 15;

export type ProcessScheduledResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  deferred: number;
  recovered: number;
  errors: string[];
};

export async function claimScheduledMessage(
  messageId: string,
  options?: { ignoreSchedule?: boolean }
): Promise<{ id: string; workspaceId: string; listId: string | null; body: string } | null> {
  const now = new Date();

  const result = await prisma.message.updateMany({
    where: {
      id: messageId,
      status: "scheduled",
      ...(options?.ignoreSchedule
        ? {}
        : { scheduledAt: { lte: now } }),
    },
    data: { status: "sending" },
  });

  if (result.count === 0) return null;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, workspaceId: true, listId: true, body: true },
  });

  return message;
}

export async function refreshMessageRecipientsBeforeSend(
  messageId: string,
  listId: string,
  workspaceId: string
): Promise<number> {
  await prisma.messageRecipient.deleteMany({
    where: { messageId, message: { workspaceId } },
  });
  const recipients = await createMessageRecipients(messageId, listId, workspaceId);
  return recipients.filter((recipient) => recipient.status === "queued").length;
}

async function markScheduledMessageFailed(messageId: string, workspaceId: string) {
  await prisma.message.updateMany({
    where: { id: messageId, workspaceId },
    data: { status: "failed" },
  });
}

/**
 * Recover scheduled messages stuck in `sending` after a crash mid-delivery.
 * Only sends to remaining `queued` recipients — never re-sends to contacts
 * already marked sent/failed/skipped.
 */
export async function recoverStuckScheduledSends(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_SENDING_MINUTES * 60 * 1000);

  const stuckMessages = await prisma.message.findMany({
    where: {
      status: "sending",
      scheduledAt: { not: null },
      updatedAt: { lt: cutoff },
    },
    select: { id: true, body: true, workspaceId: true },
    take: BATCH_SIZE,
  });

  let recovered = 0;

  for (const message of stuckMessages) {
    const sentCount = await prisma.messageRecipient.count({
      where: { messageId: message.id, status: "sent" },
    });
    const queuedCount = await prisma.messageRecipient.count({
      where: { messageId: message.id, status: "queued" },
    });

    if (queuedCount === 0) {
      await prisma.message.updateMany({
        where: { id: message.id, workspaceId: message.workspaceId },
        data: { status: sentCount > 0 ? "sent" : "failed", sentAt: sentCount > 0 ? new Date() : undefined },
      });
      recovered++;
      continue;
    }

    if (!(await isWorkspaceTwilioReady(message.workspaceId))) {
      await markScheduledMessageFailed(message.id, message.workspaceId);
      recovered++;
      continue;
    }

    const billingCheck = await checkBillingAllowsSend(message.workspaceId);
    if (!billingCheck.ok) {
      await markScheduledMessageFailed(message.id, message.workspaceId);
      logSendFailure({
        source: "scheduled_send",
        workspaceId: message.workspaceId,
        messageId: message.id,
        errorMessage: billingCheck.error,
      });
      recovered++;
      continue;
    }

    try {
      await deliverMessageViaTwilio(message.id, message.body);
      recovered++;
    } catch {
      await markScheduledMessageFailed(message.id, message.workspaceId);
      recovered++;
    }
  }

  return recovered;
}

export async function processScheduledMessage(
  messageId: string,
  options?: { ignoreSchedule?: boolean }
): Promise<"sent" | "failed" | "skipped" | "deferred"> {
  const preview = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, workspaceId: true, status: true, scheduledAt: true },
  });

  if (!preview || preview.status !== "scheduled") return "skipped";

  const compliance = await getComplianceSettings(preview.workspaceId);
  if (isWithinQuietHours(compliance)) {
    const nextAllowed = getNextAllowedSendTime(compliance);
    await prisma.message.updateMany({
      where: { id: messageId, workspaceId: preview.workspaceId, status: "scheduled" },
      data: { scheduledAt: nextAllowed },
    });
    return "deferred";
  }

  const message = await claimScheduledMessage(messageId, options);
  if (!message) return "skipped";

  if (!message.listId) {
    await markScheduledMessageFailed(message.id, message.workspaceId);
    return "failed";
  }

  if (!(await isWorkspaceTwilioReady(message.workspaceId))) {
    await markScheduledMessageFailed(message.id, message.workspaceId);
    return "failed";
  }

  const queuedCount = await refreshMessageRecipientsBeforeSend(
    message.id,
    message.listId,
    message.workspaceId
  );

  if (queuedCount === 0) {
    await prisma.message.updateMany({
      where: { id: message.id, workspaceId: message.workspaceId },
      data: { status: "failed", sentAt: new Date() },
    });
    return "failed";
  }

  const limitCheck = await checkMessageLimit(message.workspaceId, queuedCount);
  if (!limitCheck.ok) {
    await markScheduledMessageFailed(message.id, message.workspaceId);
    return "failed";
  }

  const billingCheck = await checkBillingAllowsSend(message.workspaceId);
  if (!billingCheck.ok) {
    logSendFailure({
      source: "scheduled_send",
      workspaceId: message.workspaceId,
      messageId: message.id,
      errorMessage: billingCheck.error,
    });
    await markScheduledMessageFailed(message.id, message.workspaceId);
    return "failed";
  }

  try {
    await deliverMessageViaTwilio(message.id, message.body);
    return "sent";
  } catch {
    await markScheduledMessageFailed(message.id, message.workspaceId);
    return "failed";
  }
}

export async function findDueScheduledMessageIds(limit = BATCH_SIZE): Promise<string[]> {
  const now = new Date();
  const messages = await prisma.message.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    select: { id: true },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  return messages.map((message) => message.id);
}

export async function processAllDueScheduledMessages(): Promise<ProcessScheduledResult> {
  const recovered = await recoverStuckScheduledSends();
  const messageIds = await findDueScheduledMessageIds();
  const result: ProcessScheduledResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    deferred: 0,
    recovered,
    errors: [],
  };

  for (const messageId of messageIds) {
    const outcome = await processScheduledMessage(messageId);
    result.processed++;

    if (outcome === "sent") result.sent++;
    else if (outcome === "failed") result.failed++;
    else if (outcome === "deferred") result.deferred++;
    else result.skipped++;
  }

  return result;
}
