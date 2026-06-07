import type { RecipientStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  validatePhoneNumber,
  sendSms,
  isWorkspaceTwilioReady,
} from "@/lib/twilio/service";
import { createTrackedLinksForRecipient } from "@/lib/links/tracking";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import { appendComplianceFooter } from "@/lib/compliance/footer";
import { assertCanSendDuringQuietHours } from "@/lib/compliance/quiet-hours";
import {
  countRecipientOutcomes,
  createComplianceArchive,
} from "@/lib/compliance/archive";
import { logSendFailure } from "@/lib/logging/send-failures";

type RecipientSeed = {
  messageId: string;
  contactId: string;
  phone: string;
  status: RecipientStatus;
  errorMessage?: string;
};

import { canReceiveMarketing } from "@/lib/consent/contact-consent";

export function classifyContactForSend(contact: {
  status: string;
  phone: string;
  consentStatus?: string;
  consentTimestamp?: Date | null;
}): Pick<RecipientSeed, "status" | "errorMessage" | "phone"> {
  if (contact.status === "opted_out" || contact.consentStatus === "unsubscribed") {
    return {
      phone: contact.phone,
      status: "opted_out",
      errorMessage: "Contact opted out",
    };
  }

  if (contact.status === "invalid") {
    return {
      phone: contact.phone,
      status: "skipped",
      errorMessage: "Invalid contact",
    };
  }

  if (
    !canReceiveMarketing({
      consentStatus: (contact.consentStatus ?? "unknown") as
        | "unknown"
        | "subscribed"
        | "unsubscribed",
      consentTimestamp: contact.consentTimestamp ?? null,
      status: contact.status as "active" | "opted_out" | "invalid",
    })
  ) {
    return {
      phone: contact.phone,
      status: "skipped",
      errorMessage: "Missing marketing consent",
    };
  }

  if (!contact.phone?.trim()) {
    return {
      phone: contact.phone ?? "",
      status: "skipped",
      errorMessage: "Missing phone number",
    };
  }

  if (!validatePhoneNumber(contact.phone)) {
    return {
      phone: contact.phone,
      status: "skipped",
      errorMessage: "Invalid phone number",
    };
  }

  return {
    phone: contact.phone,
    status: "queued",
  };
}

export async function createMessageRecipients(
  messageId: string,
  listId: string,
  workspaceId: string
): Promise<RecipientSeed[]> {
  const list = await prisma.list.findFirst({
    where: { id: listId, workspaceId },
    select: { id: true },
  });

  if (!list) {
    return [];
  }

  const listContacts = await prisma.listContact.findMany({
    where: { listId: list.id },
    include: { contact: true },
  });

  const recipientData: RecipientSeed[] = listContacts.map((lc) => {
    const classified = classifyContactForSend(lc.contact);
    return {
      messageId,
      contactId: lc.contact.id,
      ...classified,
    };
  });

  if (recipientData.length > 0) {
    await prisma.messageRecipient.createMany({
      data: recipientData,
      skipDuplicates: true,
    });
  }

  return recipientData;
}

export type SendMessageResult = {
  sentCount: number;
  failedCount: number;
  skippedCount: number;
};

export async function deliverMessageViaTwilio(
  messageId: string,
  body: string
): Promise<SendMessageResult> {
  const message = await prisma.message.findUniqueOrThrow({
    where: { id: messageId },
    include: { list: true },
  });

  if (!(await isWorkspaceTwilioReady(message.workspaceId))) {
    throw new Error(
      "Twilio sender is not configured for this workspace. Add a phone number in Settings → Phone Number."
    );
  }

  const compliance = await getComplianceSettings(message.workspaceId);
  assertCanSendDuringQuietHours(compliance);

  const sentAt = new Date();

  const composedBody = appendComplianceFooter(
    body,
    compliance.defaultComplianceFooter
  );

  await prisma.message.updateMany({
    where: { id: messageId, workspaceId: message.workspaceId },
    data: { status: "sending", sentBody: composedBody },
  });

  const queuedRecipients = await prisma.messageRecipient.findMany({
    where: { messageId, status: "queued" },
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of queuedRecipients) {
    const claim = await prisma.messageRecipient.updateMany({
      where: { id: recipient.id, status: "queued" },
      data: { updatedAt: new Date() },
    });

    if (claim.count === 0) {
      continue;
    }

    const { bodyWithTracking } = await createTrackedLinksForRecipient(
      message.workspaceId,
      messageId,
      recipient.contactId,
      composedBody
    );

    const result = await sendSms(recipient.phone, bodyWithTracking, {
      workspaceId: message.workspaceId,
    });

    if (result.ok) {
      await prisma.messageRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "sent",
          twilioSid: result.sid,
          errorMessage: null,
          sentBody: bodyWithTracking,
        },
      });
      sentCount++;
    } else {
      logSendFailure({
        source: "outbound_send",
        workspaceId: message.workspaceId,
        messageId,
        recipientId: recipient.id,
        contactId: recipient.contactId,
        phone: recipient.phone,
        errorMessage: result.error,
      });

      await prisma.messageRecipient.update({
        where: { id: recipient.id },
        data: { status: "failed", errorMessage: result.error },
      });
      failedCount++;
    }
  }

  const messageStatus =
    sentCount > 0 ? "sent" : failedCount > 0 ? "failed" : "sent";

  await prisma.message.updateMany({
    where: { id: messageId, workspaceId: message.workspaceId },
    data: {
      status: messageStatus,
      sentAt,
    },
  });

  const allRecipients = await prisma.messageRecipient.findMany({
    where: { messageId },
    select: { status: true },
  });

  const counts = countRecipientOutcomes(allRecipients);

  await createComplianceArchive({
    workspaceId: message.workspaceId,
    message: { id: message.id, listId: message.listId, sentAt },
    messageBody: composedBody,
    listName: message.list?.name ?? null,
    sentAt,
    counts,
  });

  const skippedCount = counts.skippedOptOuts + counts.skippedInvalid;

  return { sentCount, failedCount, skippedCount };
}
