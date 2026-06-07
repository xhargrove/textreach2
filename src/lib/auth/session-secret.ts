import { isLegacyAuthAllowed } from "@/lib/production-guards";

const MIN_SECRET_LENGTH = 32;

export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function requireSessionSecret(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters for legacy session auth. See .env.example."
    );
  }
  return secret;
}

export function isLegacySessionAuthEnabled(): boolean {
  return isLegacyAuthAllowed();
}
