import type { Session } from "@/lib/auth/session";
import { getSessionSecret } from "@/lib/auth/session-secret";

const COOKIE_VERSION = "v1";

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    const base64 = padded + "=".repeat(padLength);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return encodeBase64Url(new Uint8Array(signature));
}

function isValidSessionPayload(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Session;
  return (
    typeof session.userId === "string" &&
    session.userId.length > 0 &&
    typeof session.workspaceId === "string" &&
    session.workspaceId.length > 0
  );
}

export async function signSessionCookie(session: Session): Promise<string> {
  const payload = `${COOKIE_VERSION}.${JSON.stringify(session)}`;
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters before creating a session."
    );
  }
  const signature = await signPayload(payload, secret);
  return `${encodeBase64Url(new TextEncoder().encode(payload))}.${signature}`;
}

export async function verifySessionCookie(raw: string): Promise<Session | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  const encodedPayload = raw.slice(0, dotIndex);
  const signature = raw.slice(dotIndex + 1);
  if (!encodedPayload || !signature) return null;

  const payloadBytes = decodeBase64Url(encodedPayload);
  if (!payloadBytes) return null;

  const payload = new TextDecoder().decode(payloadBytes);
  if (!payload.startsWith(`${COOKIE_VERSION}.`)) return null;

  const key = await importHmacKey(secret);
  const signatureBytes = decodeBase64Url(signature);
  if (!signatureBytes) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(signatureBytes),
    new TextEncoder().encode(payload)
  );
  if (!valid) return null;

  try {
    const json = payload.slice(COOKIE_VERSION.length + 1);
    const session = JSON.parse(json) as unknown;
    return isValidSessionPayload(session) ? session : null;
  } catch {
    return null;
  }
}
