import { prisma } from "@/lib/prisma";

export type ConsentEventType =
  | "stop"
  | "start"
  | "keyword_opt_in"
  | "inbound_message";

export type RecordConsentEventInput = {
  workspaceId: string;
  contactId?: string | null;
  phone: string;
  eventType: ConsentEventType;
  source?: string | null;
  toNumber?: string | null;
  body?: string | null;
};

export async function recordConsentEvent(input: RecordConsentEventInput) {
  await prisma.consentEvent.create({
    data: {
      workspaceId: input.workspaceId,
      contactId: input.contactId ?? null,
      phone: input.phone,
      eventType: input.eventType,
      source: input.source ?? null,
      toNumber: input.toNumber ?? null,
      body: input.body ?? null,
    },
  });
}
