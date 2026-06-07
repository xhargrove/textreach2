import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  isPlatformSenderFallbackEnabled,
  resolveSendFromOptionsForWorkspace,
  resolveWorkspaceSendFromOptions,
} from "@/lib/twilio/workspace-sender";

describe("workspace Twilio sender resolution", () => {
  afterEach(() => {
    delete process.env.TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  });

  it("uses workspace messaging service SID when configured", () => {
    const options = resolveWorkspaceSendFromOptions({
      twilioPhoneNumber: "+15551111111",
      twilioMessagingSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    expect(options).toEqual({
      messagingServiceSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
  });

  it("uses workspace phone number when messaging SID is absent", () => {
    const options = resolveWorkspaceSendFromOptions({
      twilioPhoneNumber: "+15551111111",
      twilioMessagingSid: null,
    });
    expect(options).toEqual({ from: "+15551111111" });
  });

  it("resolves different senders for workspace A and workspace B", () => {
    const workspaceA = resolveWorkspaceSendFromOptions({
      twilioPhoneNumber: "+15551111111",
      twilioMessagingSid: null,
    });
    const workspaceB = resolveWorkspaceSendFromOptions({
      twilioPhoneNumber: "+15552222222",
      twilioMessagingSid: null,
    });

    expect(workspaceA).toEqual({ from: "+15551111111" });
    expect(workspaceB).toEqual({ from: "+15552222222" });
    expect(workspaceA).not.toEqual(workspaceB);
  });

  it("throws when workspace sender is missing and platform fallback is disabled", () => {
    expect(() =>
      resolveSendFromOptionsForWorkspace({
        twilioPhoneNumber: null,
        twilioMessagingSid: null,
      })
    ).toThrow(/Workspace Twilio sender is not configured/);
  });

  it("falls back to platform sender only when explicitly enabled", () => {
    process.env.TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK = "true";
    process.env.TWILIO_PHONE_NUMBER = "+15559999999";

    expect(isPlatformSenderFallbackEnabled()).toBe(true);
    expect(
      resolveSendFromOptionsForWorkspace({
        twilioPhoneNumber: null,
        twilioMessagingSid: null,
      })
    ).toEqual({ from: "+15559999999" });
  });
});

describe("sendSms workspace routing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK;
  });

  it("sends workspace A and workspace B messages with different from numbers", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "secret";

    const create = vi
      .fn()
      .mockResolvedValueOnce({ sid: "SM_A" })
      .mockResolvedValueOnce({ sid: "SM_B" });

    vi.doMock("twilio", () => ({
      default: () => ({ messages: { create } }),
    }));

    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        workspace: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce({
              twilioPhoneNumber: "+15551111111",
              twilioMessagingSid: null,
            })
            .mockResolvedValueOnce({
              twilioPhoneNumber: "+15552222222",
              twilioMessagingSid: null,
            }),
        },
      },
    }));

    const { sendSms } = await import("@/lib/twilio/service");

    const resultA = await sendSms("+15553334444", "Hello A", {
      workspaceId: "ws_a",
    });
    const resultB = await sendSms("+15553335555", "Hello B", {
      workspaceId: "ws_b",
    });

    expect(resultA).toEqual({ ok: true, sid: "SM_A" });
    expect(resultB).toEqual({ ok: true, sid: "SM_B" });
    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ from: "+15551111111", to: "+15553334444" })
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ from: "+15552222222", to: "+15553335555" })
    );
  });
});
