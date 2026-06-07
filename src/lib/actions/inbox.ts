"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { sendSms, isWorkspaceTwilioReady } from "@/lib/twilio/service";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import { appendComplianceFooter } from "@/lib/compliance/footer";
import { assertCanSendDuringQuietHours } from "@/lib/compliance/quiet-hours";
import { checkBillingAllowsSend } from "@/lib/billing/subscription";
import { checkMessageLimit } from "@/lib/billing/limits";
import { logSendFailure } from "@/lib/logging/send-failures";
import {
  actionFailure,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";

async function requireInboxWorkspaceId(permission: "view_inbox" | "manage_inbox") {
  const ctx = await requirePermission(permission);
  return ctx.workspaceId;
}

export async function markConversationReadAction(contactId: string) {
  return runAction(async () => {
    const workspaceId = await requireInboxWorkspaceId("view_inbox");

    await prisma.inboxMessage.updateMany({
      where: {
        workspaceId,
        contactId,
        direction: "inbound",
        read: false,
      },
      data: { read: true },
    });

    revalidatePath("/inbox");
    revalidatePath(`/inbox/${contactId}`);
    return { ok: true as const };
  });
}

export async function sendInboxReplyAction(
  contactId: string,
  body: string
): Promise<ActionFailure | { ok: true }> {
  return runAction(async () => {
    const workspaceId = await requireInboxWorkspaceId("manage_inbox");

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      return actionFailure("Message body is required");
    }

    if (trimmedBody.length > 1600) {
      return actionFailure("Message is too long. Keep replies under 1,600 characters.");
    }

    if (!(await isWorkspaceTwilioReady(workspaceId))) {
      return actionFailure(
        "Twilio sender is not configured for this workspace. Add a phone number in Settings → Phone Number."
      );
    }

    const billingCheck = await checkBillingAllowsSend(workspaceId);
    if (!billingCheck.ok) {
      return actionFailure(billingCheck.error);
    }

    const limitCheck = await checkMessageLimit(workspaceId, 1);
    if (!limitCheck.ok) {
      return actionFailure(limitCheck.error);
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });

    if (!contact) {
      return actionFailure("Contact not found");
    }

    if (contact.status === "opted_out") {
      return actionFailure(
        "This contact has opted out. They must reply START before you can message them."
      );
    }

    const compliance = await getComplianceSettings(workspaceId);
    assertCanSendDuringQuietHours(compliance);

    const composedBody = appendComplianceFooter(
      trimmedBody,
      compliance.defaultComplianceFooter
    );

    const result = await sendSms(contact.phone, composedBody, { workspaceId });

    if (!result.ok) {
      logSendFailure({
        source: "inbox_reply",
        workspaceId,
        contactId,
        phone: contact.phone,
        errorMessage: result.error,
      });
      return actionFailure(result.error ?? "Failed to send message");
    }

    await prisma.inboxMessage.create({
      data: {
        workspaceId,
        contactId,
        phone: contact.phone,
        direction: "outbound",
        body: composedBody,
        read: true,
        twilioSid: result.sid ?? null,
      },
    });

    revalidatePath("/inbox");
    revalidatePath(`/inbox/${contactId}`);

    return { ok: true as const };
  });
}
