export function appendComplianceFooter(body: string, footer: string): string {
  const trimmed = body.trim();
  const footerText = footer.trim();

  if (!footerText) return trimmed;
  if (trimmed.toUpperCase().includes("STOP")) return trimmed;
  if (trimmed.includes(footerText)) return trimmed;

  return `${trimmed}\n\n${footerText}`;
}
