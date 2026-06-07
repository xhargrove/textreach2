import { ContactSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber, sendSms } from "@/lib/twilio/service";
import { getWorkspaceByTwilioToNumber } from "@/lib/twilio/workspace-lookup";
import {
  parseSmsCommand,
  SMS_COMMAND_REPLIES,
} from "@/lib/twilio/sms-commands";
import { processKeywordOptIn } from "@/lib/twilio/keyword-handler";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import {
  subscribedConsentUpdate,
  unsubscribedConsentUpdate,
  unknownInboundContactData,
} from "@/lib/consent/contact-consent";
import { recordConsentEvent } from "@/lib/consent/record-event";
import { findRelatedMessageIdForInbound } from "@/lib/queries/message-replies";

type InboundSmsParams = {
  From: string;
  To: string;
  Body: string;
  MessageSid?: string;
};

async function findContact(workspaceId: string, phone: string) {
  return prisma.contact.findUnique({
    where: { workspaceId_phone: { workspaceId, phone } },
  });
}

async function handleStop(
  workspaceId: string,
  phone: string,
  toNumber: string,
  body: string
) {
  let contact = await findContact(workspaceId, phone);

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        workspaceId,
        phone,
        source: ContactSource.inbound,
        ...unsubscribedConsentUpdate(),
      },
    });
  } else {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: unsubscribedConsentUpdate(),
    });
  }

  await prisma.optOut.upsert({
    where: {
      workspaceId_contactId: { workspaceId, contactId: contact.id },
    },
    create: {
      workspaceId,
      contactId: contact.id,
      phone,
      reason: "STOP reply",
    },
    update: {
      phone,
      reason: "STOP reply",
    },
  });

  await recordConsentEvent({
    workspaceId,
    contactId: contact.id,
    phone,
    eventType: "stop",
    source: "twilio:stop",
    toNumber,
    body,
  });

  await sendSms(phone, SMS_COMMAND_REPLIES.stop, { workspaceId });
}

async function handleStart(
  workspaceId: string,
  phone: string,
  toNumber: string,
  body: string
) {
  const consent = subscribedConsentUpdate({
    consentSource: "twilio:start",
    consentPhoneNumber: toNumber,
  });

  let contact = await findContact(workspaceId, phone);

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        workspaceId,
        phone,
        source: ContactSource.inbound,
        ...consent,
      },
    });
  } else {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: consent,
    });
  }

  await prisma.optOut.deleteMany({
    where: { workspaceId, contactId: contact.id },
  });

  await recordConsentEvent({
    workspaceId,
    contactId: contact.id,
    phone,
    eventType: "start",
    source: "twilio:start",
    toNumber,
    body,
  });

  await sendSms(phone, SMS_COMMAND_REPLIES.start, { workspaceId });
}

async function handleHelp(workspaceId: string, phone: string) {
  const settings = await getComplianceSettings(workspaceId);
  await sendSms(phone, settings.defaultHelpResponse, { workspaceId });
}

async function handlePlainInbound(
  workspaceId: string,
  phone: string,
  body: string,
  messageSid?: string
) {
  let contact = await findContact(workspaceId, phone);

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        workspaceId,
        phone,
        source: ContactSource.inbound,
        ...unknownInboundContactData(),
      },
    });
  }

  const relatedMessageId = await findRelatedMessageIdForInbound(
    workspaceId,
    contact.id
  );

  await prisma.inboxMessage.create({
    data: {
      workspaceId,
      contactId: contact.id,
      phone,
      body: body.trim(),
      direction: "inbound",
      read: false,
      twilioSid: messageSid ?? null,
      relatedMessageId,
    },
  });

  await recordConsentEvent({
    workspaceId,
    contactId: contact.id,
    phone,
    eventType: "inbound_message",
    source: "twilio:inbound",
    body,
  });
}

export async function handleInboundSms(
  params: InboundSmsParams
): Promise<{ ok: boolean; reason?: string }> {
  const fromRaw = params.From;
  const toRaw = params.To;
  const body = params.Body ?? "";

  if (!fromRaw || !toRaw) {
    return { ok: false, reason: "Missing From or To" };
  }

  const phone = normalizePhoneNumber(fromRaw);
  const toNumber = normalizePhoneNumber(toRaw) ?? toRaw;
  if (!phone) {
    return { ok: false, reason: "Invalid sender phone" };
  }

  const workspace = await getWorkspaceByTwilioToNumber(toRaw);
  if (!workspace) {
    console.warn(
      JSON.stringify({
        level: "warn",
        type: "textreach_twilio_unknown_destination",
        timestamp: new Date().toISOString(),
        to: toRaw,
        from: fromRaw,
        messageSid: params.MessageSid ?? null,
      })
    );
    return { ok: false, reason: "No workspace for Twilio number" };
  }

  const command = parseSmsCommand(body);

  if (command === "stop") {
    await handleStop(workspace.id, phone, toNumber, body);
    return { ok: true };
  }

  if (command === "start") {
    await handleStart(workspace.id, phone, toNumber, body);
    return { ok: true };
  }

  if (command === "help") {
    await handleHelp(workspace.id, phone);
    return { ok: true };
  }

  const keywordHandled = await processKeywordOptIn(
    workspace.id,
    phone,
    body,
    toNumber
  );
  if (keywordHandled) {
    return { ok: true };
  }

  await handlePlainInbound(
    workspace.id,
    phone,
    body,
    params.MessageSid
  );

  return { ok: true };
}
