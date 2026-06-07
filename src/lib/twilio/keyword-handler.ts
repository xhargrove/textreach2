import { ContactSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildKeywordAutoReply } from "@/lib/keywords/auto-reply";
import { normalizeInboundKeywordBody } from "@/lib/validation/keyword";
import { findActiveKeywordMatch } from "@/lib/queries/keywords";
import { sendSms } from "@/lib/twilio/service";
import { subscribedConsentUpdate } from "@/lib/consent/contact-consent";
import { recordConsentEvent } from "@/lib/consent/record-event";

export async function processKeywordOptIn(
  workspaceId: string,
  phone: string,
  body: string,
  toNumber?: string | null
): Promise<boolean> {
  const normalizedBody = normalizeInboundKeywordBody(body);
  const keyword = await findActiveKeywordMatch(workspaceId, normalizedBody);
  if (!keyword) return false;

  const consent = subscribedConsentUpdate({
    consentSource: `keyword:${keyword.keyword}`,
    consentPhoneNumber: toNumber ?? null,
  });

  let contact = await prisma.contact.findUnique({
    where: { workspaceId_phone: { workspaceId, phone } },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        workspaceId,
        phone,
        source: ContactSource.keyword,
        ...consent,
      },
    });
  } else {
    await prisma.optOut.deleteMany({
      where: { workspaceId, contactId: contact.id },
    });

    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        source: ContactSource.keyword,
        ...consent,
      },
    });
  }

  if (keyword.listId) {
    await prisma.listContact.upsert({
      where: {
        listId_contactId: {
          listId: keyword.listId,
          contactId: contact.id,
        },
      },
      create: {
        listId: keyword.listId,
        contactId: contact.id,
      },
      update: {},
    });
  }

  const existingOptIn = await prisma.keywordOptIn.findUnique({
    where: {
      keywordId_contactId: {
        keywordId: keyword.id,
        contactId: contact.id,
      },
    },
  });

  if (!existingOptIn) {
    await prisma.keywordOptIn.create({
      data: {
        workspaceId,
        keywordId: keyword.id,
        contactId: contact.id,
      },
    });

    await prisma.keyword.updateMany({
      where: { id: keyword.id, workspaceId },
      data: { optInCount: { increment: 1 } },
    });
  }

  await recordConsentEvent({
    workspaceId,
    contactId: contact.id,
    phone,
    eventType: "keyword_opt_in",
    source: consent.consentSource,
    toNumber: toNumber ?? null,
    body,
  });

  if (keyword.autoReply?.trim()) {
    const reply = buildKeywordAutoReply(keyword.autoReply);
    await sendSms(phone, reply, { workspaceId });
  }

  return true;
}
