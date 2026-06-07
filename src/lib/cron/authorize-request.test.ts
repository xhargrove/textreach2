import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-request";

describe("authorizeCronRequest", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
    delete process.env.CRON_DEV_BYPASS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function makeRequest(authHeader?: string) {
    return new NextRequest("http://localhost/api/cron/process-scheduled-messages", {
      headers: authHeader ? { authorization: authHeader } : undefined,
    });
  }

  it("returns 500 in production when CRON_SECRET is missing", () => {
    process.env.NODE_ENV = "production";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = authorizeCronRequest(makeRequest());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
    }
    expect(errorSpy).toHaveBeenCalled();
  });

  it("allows development without CRON_SECRET and logs dev bypass", () => {
    process.env.NODE_ENV = "development";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = authorizeCronRequest(makeRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.devBypass).toBe(true);
    }
    expect(warnSpy).toHaveBeenCalled();
  });

  it("requires bearer token when CRON_SECRET is set", () => {
    process.env.NODE_ENV = "development";
    process.env.CRON_SECRET = "test-secret";

    const unauthorized = authorizeCronRequest(makeRequest());
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) {
      expect(unauthorized.response.status).toBe(401);
    }

    const authorized = authorizeCronRequest(makeRequest("Bearer test-secret"));
    expect(authorized.ok).toBe(true);
  });

  it("returns 401 for invalid cron auth header", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "test-secret";

    const result = authorizeCronRequest(makeRequest("Bearer wrong-secret"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("allows production bypass only when CRON_DEV_BYPASS=true", () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_DEV_BYPASS = "true";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = authorizeCronRequest(makeRequest());

    expect(result.ok).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });
});
