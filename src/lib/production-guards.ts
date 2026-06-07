import { isClerkConfigured } from "@/lib/auth/clerk-config";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Legacy password login + signed session cookie. Never enabled in production unless AUTH_PROVIDER=legacy. */
export function isLegacyAuthAllowed(): boolean {
  if (isProduction()) {
    return process.env.AUTH_PROVIDER === "legacy";
  }
  return !isClerkConfigured();
}

export function isDemoAuthAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}
