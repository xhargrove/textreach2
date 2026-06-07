import { isValidEmail } from "@/lib/validation/phone";

export type ComplianceFormInput = {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  messageFrequencyDescription: string;
  defaultComplianceFooter: string;
  defaultHelpResponse: string;
  physicalAddress: string;
  marketingSmsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursTimezone: string;
};

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function hasOptOutLanguage(footer: string): boolean {
  const normalized = footer.toLowerCase();
  return (
    normalized.includes("stop") ||
    normalized.includes("unsubscribe") ||
    normalized.includes("opt out") ||
    normalized.includes("opt-out")
  );
}

export function validateComplianceSettings(
  data: ComplianceFormInput
): string | null {
  if (data.businessName.trim().length < 2) {
    return "Business name is required (at least 2 characters)";
  }

  if (!data.supportEmail.trim()) {
    return "Support email is required";
  }
  if (!isValidEmail(data.supportEmail)) {
    return "Support email must be a valid email address";
  }

  if (data.marketingSmsEnabled && data.physicalAddress.trim().length < 8) {
    return "Physical mailing address is required for marketing SMS (at least 8 characters)";
  }

  if (!data.defaultComplianceFooter.trim()) {
    return "Default compliance footer is required";
  }
  if (!hasOptOutLanguage(data.defaultComplianceFooter)) {
    return "Compliance footer must include opt-out language (e.g. STOP or unsubscribe)";
  }

  if (!data.defaultHelpResponse.trim()) {
    return "Default HELP response is required";
  }

  if (data.marketingSmsEnabled) {
    if (!data.privacyPolicyUrl.trim()) {
      return "Privacy policy URL is required for marketing SMS";
    }
    if (!data.termsUrl.trim()) {
      return "Terms URL is required for marketing SMS";
    }
  }

  if (data.privacyPolicyUrl.trim() && !isValidHttpUrl(data.privacyPolicyUrl)) {
    return "Privacy policy URL must be a valid http or https URL";
  }
  if (data.termsUrl.trim() && !isValidHttpUrl(data.termsUrl)) {
    return "Terms URL must be a valid http or https URL";
  }

  if (data.quietHoursEnabled) {
    if (!data.quietHoursTimezone.trim()) {
      return "Quiet hours timezone is required when quiet hours are enabled";
    }
    if (!isValidTimezone(data.quietHoursTimezone.trim())) {
      return "Quiet hours timezone must be a valid IANA timezone (e.g. America/New_York)";
    }
  }

  return null;
}
