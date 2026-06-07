import { headers } from "next/headers";
import type { ClerkMiddlewareOptions } from "@clerk/nextjs/server";
import { isRemoteAppHostname } from "@/lib/app-url";

export function shouldEnableClerkFrontendProxy(hostname: string): boolean {
  const override = process.env.CLERK_FRONTEND_API_PROXY?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  return isRemoteAppHostname(hostname);
}

function getRequestHostname(headerStore: Headers): string {
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "";
  return host.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

export async function getClerkProxyUrlForRequest(): Promise<string | undefined> {
  const explicit = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (explicit) return explicit;

  const headerStore = await headers();
  const hostname = getRequestHostname(headerStore);

  if (hostname && shouldEnableClerkFrontendProxy(hostname)) {
    return "/__clerk";
  }

  return undefined;
}

export function getClerkMiddlewareOptions(): ClerkMiddlewareOptions {
  // Clerk v6: configure proxy via NEXT_PUBLIC_CLERK_PROXY_URL when needed.
  return {};
}

export function getClerkRemoteSetupHint(): string | null {
  const baseUrl = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.TWILIO_WEBHOOK_BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]
    .find((value) => value?.trim())
    ?.replace(/\/$/, "");

  if (!baseUrl) return null;

  let hostname = "";
  try {
    hostname = new URL(baseUrl).hostname;
  } catch {
    return null;
  }

  return [
    `Add this URL in Clerk Dashboard → Configure → Paths / Domains:`,
    `  ${baseUrl}`,
    `Allowed redirect URLs (include):`,
    `  ${baseUrl}/sign-in`,
    `  ${baseUrl}/sign-up`,
    `  ${baseUrl}/dashboard`,
    shouldEnableClerkFrontendProxy(hostname)
      ? "Frontend API proxy is enabled via /__clerk for this remote host."
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
