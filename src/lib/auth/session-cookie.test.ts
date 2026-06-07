import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  signSessionCookie,
  verifySessionCookie,
} from "@/lib/auth/session-cookie";

const TEST_SECRET = "test-session-secret-at-least-32-chars-long";

describe("session cookie signing", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("round-trips a signed session", async () => {
    const session = {
      userId: "user_123",
      workspaceId: "ws_456",
    };

    const cookie = await signSessionCookie(session);
    expect(cookie).not.toContain("user_123");

    const verified = await verifySessionCookie(cookie);
    expect(verified).toEqual(session);
  });

  it("rejects unsigned JSON cookies", async () => {
    const unsigned = JSON.stringify({
      userId: "user_attacker",
      workspaceId: "ws_attacker",
    });

    expect(await verifySessionCookie(unsigned)).toBeNull();
  });

  it("rejects tampered signatures", async () => {
    const cookie = await signSessionCookie({
      userId: "user_123",
      workspaceId: "ws_456",
    });

    const tampered = `${cookie.slice(0, -1)}X`;
    expect(await verifySessionCookie(tampered)).toBeNull();
  });

  it("rejects cookies when SESSION_SECRET is missing", async () => {
    const cookie = await signSessionCookie({
      userId: "user_123",
      workspaceId: "ws_456",
    });

    delete process.env.SESSION_SECRET;
    expect(await verifySessionCookie(cookie)).toBeNull();
  });
});

describe("isLegacyAuthAllowed", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AUTH_PROVIDER;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
  });

  it("blocks legacy auth in production unless AUTH_PROVIDER=legacy", async () => {
    process.env.NODE_ENV = "production";
    const { isLegacyAuthAllowed } = await import("@/lib/production-guards");

    expect(isLegacyAuthAllowed()).toBe(false);

    process.env.AUTH_PROVIDER = "legacy";
    expect(isLegacyAuthAllowed()).toBe(true);
  });
});
