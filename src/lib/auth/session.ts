import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";
import {
  signSessionCookie,
  verifySessionCookie,
} from "@/lib/auth/session-cookie";
import { isLegacySessionAuthEnabled } from "@/lib/auth/session-secret";

export type Session = {
  userId: string;
  workspaceId: string;
};

export async function getSession(): Promise<Session | null> {
  if (!isLegacySessionAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  return verifySessionCookie(raw);
}

export async function setSession(session: Session) {
  if (!isLegacySessionAuthEnabled()) {
    throw new Error("Legacy session auth is not enabled.");
  }

  const cookieStore = await cookies();
  const value = await signSessionCookie(session);

  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
