import type { ConsentStatus, ContactStatus } from "@prisma/client";

export type ContactConsentFields = {
  consentStatus: ConsentStatus;
  consentTimestamp: Date | null;
  status: ContactStatus;
};

export function canReceiveMarketing(contact: ContactConsentFields): boolean {
  return (
    contact.consentStatus === "subscribed" &&
    contact.consentTimestamp != null &&
    contact.status !== "opted_out"
  );
}

export function subscribedConsentUpdate(opts: {
  consentSource: string;
  consentPhoneNumber?: string | null;
  timestamp?: Date;
}) {
  const now = opts.timestamp ?? new Date();
  return {
    consentStatus: "subscribed" as const,
    consentTimestamp: now,
    consentSource: opts.consentSource,
    consentPhoneNumber: opts.consentPhoneNumber ?? null,
    status: "active" as const,
    optedOutAt: null,
  };
}

export function unsubscribedConsentUpdate(opts?: { timestamp?: Date }) {
  const now = opts?.timestamp ?? new Date();
  return {
    consentStatus: "unsubscribed" as const,
    consentTimestamp: null,
    status: "opted_out" as const,
    optedOutAt: now,
  };
}

export function unknownInboundContactData() {
  return {
    consentStatus: "unknown" as const,
    consentTimestamp: null,
    consentSource: null,
    consentPhoneNumber: null,
    status: "active" as const,
    optedOutAt: null,
  };
}
