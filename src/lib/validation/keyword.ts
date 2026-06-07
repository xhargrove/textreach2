export const RESERVED_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
  "START",
  "HELP",
]);

export function normalizeKeyword(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateKeyword(raw: string): { ok: true; keyword: string } | { ok: false; error: string } {
  const keyword = normalizeKeyword(raw);

  if (!keyword) {
    return { ok: false, error: "Keyword is required" };
  }

  if (/\s/.test(raw)) {
    return { ok: false, error: "Keyword cannot contain spaces" };
  }

  if (!/^[A-Z0-9]+$/.test(keyword)) {
    return { ok: false, error: "Keyword can only contain letters and numbers" };
  }

  if (RESERVED_KEYWORDS.has(keyword)) {
    return {
      ok: false,
      error: `"${keyword}" is reserved and cannot be used as a keyword`,
    };
  }

  return { ok: true, keyword };
}

export function normalizeInboundKeywordBody(body: string): string {
  return body.trim().toUpperCase();
}
