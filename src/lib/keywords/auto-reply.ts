export const KEYWORD_COMPLIANCE_FOOTER =
  "Reply STOP to unsubscribe. Msg & data rates may apply.";

export function shouldAppendComplianceFooter(message: string): boolean {
  if (process.env.KEYWORD_APPEND_COMPLIANCE_FOOTER === "false") {
    return false;
  }
  return !message.toUpperCase().includes("STOP");
}

export function buildKeywordAutoReply(autoReply: string): string {
  const trimmed = autoReply.trim();
  if (!trimmed) return KEYWORD_COMPLIANCE_FOOTER;
  if (!shouldAppendComplianceFooter(trimmed)) return trimmed;
  return `${trimmed}\n\n${KEYWORD_COMPLIANCE_FOOTER}`;
}
