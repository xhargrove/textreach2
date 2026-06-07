"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MessageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireCanCreateMessages,
  requirePermission,
} from "@/lib/auth/authorization";
import {
  getListAudienceStats,
  getMessageById,
} from "@/lib/queries/messages";
import {
  createMessageRecipients,
  deliverMessageViaTwilio,
} from "@/lib/messages/send-message";
import {
  processScheduledMessage,
  refreshMessageRecipientsBeforeSend,
} from "@/lib/messages/process-scheduled";
import { isTwilioConfigured, isWorkspaceTwilioReady } from "@/lib/twilio/service";
import { checkMessageLimit } from "@/lib/billing/limits";
import { checkBillingAllowsSend } from "@/lib/billing/subscription";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import {
  assertCanSendDuringQuietHours,
  resolveScheduledSendTime,
  QuietHoursBlockedError,
} from "@/lib/compliance/quiet-hours";
import {
  actionFailure,
  guardFormAction,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";
import { requireMutationCount } from "@/lib/db/workspace-mutations";

type ActionResult = ActionFailure | null;

async function requireManageMessagesWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_messages");
  return ctx.workspaceId;
}

async function requireViewMessagesWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("view_messages");
  return ctx.workspaceId;
}

export async function getAudienceStatsAction(listId: string) {
  return runAction(async () => {
    const workspaceId = await requireViewMessagesWorkspaceId();
    const stats = await getListAudienceStats(workspaceId, listId);
    if (!stats) return actionFailure("List not found");
    return { ok: true as const, data: stats };
  });
}

export async function getTwilioConfigAction() {
  return runAction(async () => {
    const ctx = await requireCanCreateMessages();
    return {
      ok: true as const,
      configured: await isWorkspaceTwilioReady(ctx.workspaceId),
    };
  });
}

type CreateMessageInput = {
  name: string;
  listId: string;
  body: string;
  action: "draft" | "send" | "schedule";
  scheduledAt?: string;
};

async function validateMessageInput(
  input: CreateMessageInput,
  workspaceId: string
) {
  if (!input.name.trim()) return "Message name is required";
  if (!input.listId) return "Please select a list";
  if (!input.body.trim()) return "Message body is required";
  if (input.action === "schedule") {
    if (!input.scheduledAt) return "Please choose a schedule date and time";
    const scheduled = new Date(input.scheduledAt);
    if (scheduled <= new Date()) return "Schedule time must be in the future";
  }
  if (input.action === "send" || input.action === "schedule") {
    if (!isTwilioConfigured()) {
      return "Twilio is not configured. Add your Twilio credentials to send messages.";
    }
    if (!(await isWorkspaceTwilioReady(workspaceId))) {
      return "Twilio sender is not configured for this workspace. Add a phone number in Settings → Phone Number.";
    }
  }
  return null;
}

export async function createMessageAction(
  input: CreateMessageInput
): Promise<ActionResult & { messageId?: string }> {
  return runAction(async () => {
    const ctx = await requireCanCreateMessages();
    const workspaceId = ctx.workspaceId;
    const validationError = await validateMessageInput(input, workspaceId);
    if (validationError) return actionFailure(validationError);

    const stats = await getListAudienceStats(workspaceId, input.listId);
    if (!stats) return actionFailure("List not found");

    if (
      (input.action === "send" || input.action === "schedule") &&
      stats.willSendCount === 0
    ) {
      return actionFailure(
        "No active recipients with valid phone numbers on this list. Fix contacts before sending."
      );
    }

    if (input.action === "send" || input.action === "schedule") {
      const billingCheck = await checkBillingAllowsSend(workspaceId);
      if (!billingCheck.ok) {
        return actionFailure(billingCheck.error);
      }

      const limitCheck = await checkMessageLimit(
        workspaceId,
        stats.willSendCount
      );
      if (!limitCheck.ok) {
        return actionFailure(limitCheck.error);
      }

      if (stats.missingConsentCount > 0) {
        return actionFailure(
          `${stats.missingConsentCount} contact${stats.missingConsentCount === 1 ? "" : "s"} on this list ${stats.missingConsentCount === 1 ? "is" : "are"} missing consent. Add consent timestamps before sending.`
        );
      }
    }

    let status: MessageStatus;
    let scheduledAt: Date | null = null;
    const compliance = await getComplianceSettings(workspaceId);

    switch (input.action) {
      case "draft":
        status = "draft";
        break;
      case "send":
        status = "sending";
        try {
          assertCanSendDuringQuietHours(compliance);
        } catch (error) {
          if (error instanceof QuietHoursBlockedError) {
            return actionFailure(error.message);
          }
          throw error;
        }
        break;
      case "schedule":
        status = "scheduled";
        scheduledAt = resolveScheduledSendTime(
          compliance,
          new Date(input.scheduledAt!)
        );
        break;
    }

    const message = await prisma.message.create({
      data: {
        workspaceId,
        listId: input.listId,
        name: input.name.trim(),
        body: input.body.trim(),
        status,
        scheduledAt,
      },
    });

    if (input.action === "send") {
      await createMessageRecipients(message.id, input.listId, workspaceId);
      await deliverMessageViaTwilio(message.id, message.body);
    } else if (input.action === "schedule") {
      await createMessageRecipients(message.id, input.listId, workspaceId);
    }

    revalidatePath("/messages");
    revalidatePath("/dashboard");
    revalidatePath("/results");
    revalidatePath(`/messages/${message.id}`);

    if (input.action === "draft") {
      redirect(`/messages/${message.id}`);
    }

    redirect(`/messages/${message.id}?success=1`);
  });
}

export async function deleteMessageSimpleAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireManageMessagesWorkspaceId();
    const messageId = formData.get("messageId") as string;
    if (!messageId) {
      redirect("/messages?error=not_found");
    }

    const deleted = await prisma.message.deleteMany({
      where: { id: messageId, workspaceId },
    });

    if (deleted.count === 0) {
      redirect("/messages?error=not_found");
    }

    revalidatePath("/messages");
    redirect("/messages");
  });
}

export async function sendScheduledMessageNowAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireManageMessagesWorkspaceId();
    const messageId = formData.get("messageId") as string;
    if (!messageId) {
      redirect("/messages/scheduled?error=not_found");
    }

    const message = await getMessageById(workspaceId, messageId);
    if (!message || message.status !== "scheduled") {
      redirect(`/messages/${messageId}?error=not_found`);
    }

    const billingCheck = await checkBillingAllowsSend(workspaceId);
    if (!billingCheck.ok) {
      redirect(
        `/messages/${messageId}?error=billing&msg=${encodeURIComponent(billingCheck.error)}`
      );
    }

    const outcome = await processScheduledMessage(messageId, {
      ignoreSchedule: true,
    });

    revalidatePath(`/messages/${messageId}`);
    revalidatePath("/messages");
    revalidatePath("/messages/scheduled");

    if (outcome === "skipped") {
      redirect(`/messages/${messageId}?error=not_found`);
    }

    if (outcome === "failed") {
      redirect(`/messages/${messageId}?error=send_failed`);
    }

    if (outcome === "deferred") {
      redirect(
        `/messages/${messageId}?error=quiet_hours&msg=${encodeURIComponent("Send deferred until quiet hours end.")}`
      );
    }

    redirect(`/messages/${messageId}?success=1`);
  });
}

type UpdateScheduledMessageInput = {
  messageId: string;
  name: string;
  listId: string;
  body: string;
  scheduledAt: string;
};

export async function updateScheduledMessageAction(
  input: UpdateScheduledMessageInput
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireManageMessagesWorkspaceId();

    if (!input.name.trim()) return actionFailure("Message name is required");
    if (!input.listId) return actionFailure("Please select a list");
    if (!input.body.trim()) return actionFailure("Message body is required");
    if (!input.scheduledAt) {
      return actionFailure("Please choose a schedule date and time");
    }

    const scheduled = new Date(input.scheduledAt);
    if (scheduled <= new Date()) {
      return actionFailure("Schedule time must be in the future");
    }

    if (!isTwilioConfigured()) {
      return actionFailure(
        "Twilio is not configured. Add your Twilio credentials before scheduling messages."
      );
    }
    if (!(await isWorkspaceTwilioReady(workspaceId))) {
      return actionFailure(
        "Twilio sender is not configured for this workspace. Add a phone number in Settings → Phone Number."
      );
    }

    const stats = await getListAudienceStats(workspaceId, input.listId);
    if (!stats) return actionFailure("List not found");

    if (stats.willSendCount === 0) {
      return actionFailure(
        "No active recipients with valid phone numbers on this list. Fix contacts before scheduling."
      );
    }

    const limitCheck = await checkMessageLimit(workspaceId, stats.willSendCount);
    if (!limitCheck.ok) {
      return actionFailure(limitCheck.error);
    }

    const billingCheck = await checkBillingAllowsSend(workspaceId);
    if (!billingCheck.ok) {
      return actionFailure(billingCheck.error);
    }

    if (stats.missingConsentCount > 0) {
      return actionFailure(
        `${stats.missingConsentCount} contact${stats.missingConsentCount === 1 ? "" : "s"} on this list ${stats.missingConsentCount === 1 ? "is" : "are"} missing consent.`
      );
    }

    const compliance = await getComplianceSettings(workspaceId);
    const resolvedSchedule = resolveScheduledSendTime(compliance, scheduled);

    const updated = await prisma.message.updateMany({
      where: { id: input.messageId, workspaceId, status: "scheduled" },
      data: {
        name: input.name.trim(),
        listId: input.listId,
        body: input.body.trim(),
        scheduledAt: resolvedSchedule,
      },
    });

    const check = requireMutationCount(updated, "Message");
    if (!check.ok) return actionFailure("Only scheduled messages can be edited");

    await refreshMessageRecipientsBeforeSend(
      input.messageId,
      input.listId,
      workspaceId
    );

    revalidatePath("/messages");
    revalidatePath("/messages/scheduled");
    revalidatePath(`/messages/${input.messageId}`);
    revalidatePath(`/messages/${input.messageId}/edit`);

    redirect(`/messages/${input.messageId}?success=1`);
  });
}

export async function cancelScheduledMessageAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireManageMessagesWorkspaceId();
    const messageId = formData.get("messageId") as string;
    if (!messageId) {
      redirect("/messages/scheduled?error=not_found");
    }

    await prisma.messageRecipient.deleteMany({
      where: { messageId, message: { workspaceId } },
    });

    const canceled = await prisma.message.updateMany({
      where: { id: messageId, workspaceId, status: "scheduled" },
      data: {
        status: "draft",
        scheduledAt: null,
      },
    });

    if (canceled.count === 0) {
      redirect(`/messages/${messageId}?error=not_found`);
    }

    revalidatePath("/messages");
    revalidatePath("/messages/scheduled");
    redirect("/messages/scheduled?canceled=1");
  });
}
