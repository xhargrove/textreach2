import type { Message, MessageRecipient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTwilioSenderNumber } from "@/lib/twilio/service";

export type RecipientSendCounts = {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedOptOuts: number;
  skippedInvalid: number;
};

export function countRecipientOutcomes(
  recipients: Pick<MessageRecipient, "status">[]
): RecipientSendCounts {
  let sentCount = 0;
  let failedCount = 0;
  let skippedOptOuts = 0;
  let skippedInvalid = 0;

  for (const recipient of recipients) {
    switch (recipient.status) {
      case "sent":
      case "delivered":
        sentCount++;
        break;
      case "failed":
      case "undelivered":
        failedCount++;
        break;
      case "opted_out":
        skippedOptOuts++;
        break;
      case "skipped":
        skippedInvalid++;
        break;
      default:
        break;
    }
  }

  return {
    totalRecipients: recipients.length,
    sentCount,
    failedCount,
    skippedOptOuts,
    skippedInvalid,
  };
}

export async function createComplianceArchive(params: {
  workspaceId: string;
  message: Pick<Message, "id" | "listId" | "sentAt">;
  messageBody: string;
  listName: string | null;
  sentAt: Date;
  counts: RecipientSendCounts;
}) {
  const { workspaceId, message, messageBody, listName, sentAt, counts } = params;

  await prisma.complianceArchive.upsert({
    where: { messageId: message.id },
    create: {
      workspaceId,
      messageId: message.id,
      messageBody,
      listId: message.listId,
      listName,
      senderNumber: getTwilioSenderNumber(),
      sentAt,
      ...counts,
    },
    update: {
      messageBody,
      listId: message.listId,
      listName,
      senderNumber: getTwilioSenderNumber(),
      sentAt,
      ...counts,
    },
  });
}
