/** Hostnames that need the /__clerk proxy (dev tunnels only — not production Vercel URLs). */
const CLERK_PROXY_HOST_SUFFIXES = [
  ".trycloudflare.com",
  ".ngrok.io",
  ".ngrok-free.app",
  ".ngrok.app",
];

function parseHostname(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = value.includes("://") ? value : `https://${value}`;
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isRemoteAppHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized === "127.0.0.1") {
    return false;
  }

  return CLERK_PROXY_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export function getConfiguredAppHostname(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.TWILIO_WEBHOOK_BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ];

  for (const candidate of candidates) {
    const hostname = parseHostname(candidate);
    if (hostname) return hostname;
  }

  return null;
}

export function getAppBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.TWILIO_WEBHOOK_BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const base = candidate.trim().replace(/\/$/, "");
    if (base.startsWith("http://") || base.startsWith("https://")) {
      return base;
    }
    return `https://${base}`;
  }

  throw new Error(
    "Set NEXT_PUBLIC_APP_URL (or TWILIO_WEBHOOK_BASE_URL / VERCEL_URL) for redirect URLs."
  );
}
