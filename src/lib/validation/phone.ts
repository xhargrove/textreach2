export type PhoneValidationResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

/**
 * Normalizes a phone number to E.164 format.
 * US 10-digit numbers are stored as +1XXXXXXXXXX.
 */
export function normalizePhone(raw: string): PhoneValidationResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: "Phone is required" };
  }

  let digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    digits = `1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return { ok: true, phone: `+${digits}` };
  }

  if (trimmed.startsWith("+")) {
    const intlDigits = trimmed.slice(1).replace(/\D/g, "");
    if (intlDigits.length >= 10 && intlDigits.length <= 15) {
      return { ok: true, phone: `+${intlDigits}` };
    }
  }

  return {
    ok: false,
    error:
      "Enter a valid phone number (10-digit US or international with + country code)",
  };
}

export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function formatContactName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || "—";
}
