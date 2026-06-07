import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("toll-free verification messaging", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.DEFAULT_SUPPORT_PHONE;
  });

  it("uses workspace phone in toll-free error copy", async () => {
    const { handleDeliveryStatusCallback } = await import(
      "@/lib/twilio/status-handler"
    );

    const prisma = (await import("@/lib/prisma")).prisma;
    vi.spyOn(prisma.messageRecipient, "findFirst").mockResolvedValue({
      id: "rec_1",
      errorMessage: null,
      message: {
        workspace: { twilioPhoneNumber: "+18005551234" },
      },
    } as never);
    vi.spyOn(prisma.messageRecipient, "update").mockResolvedValue({} as never);

    await handleDeliveryStatusCallback({
      MessageSid: "SM123",
      MessageStatus: "undelivered",
      ErrorCode: "30032",
    });

    expect(prisma.messageRecipient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorMessage: expect.stringContaining("+18005551234"),
        }),
      })
    );
  });

  it("falls back to DEFAULT_SUPPORT_PHONE when workspace phone is missing", async () => {
    process.env.DEFAULT_SUPPORT_PHONE = "+18885551234";

    vi.resetModules();
    const { handleDeliveryStatusCallback } = await import(
      "@/lib/twilio/status-handler"
    );
    const prisma = (await import("@/lib/prisma")).prisma;

    vi.spyOn(prisma.messageRecipient, "findFirst").mockResolvedValue({
      id: "rec_1",
      errorMessage: null,
      message: {
        workspace: { twilioPhoneNumber: null },
      },
    } as never);
    vi.spyOn(prisma.messageRecipient, "update").mockResolvedValue({} as never);

    await handleDeliveryStatusCallback({
      MessageSid: "SM123",
      MessageStatus: "undelivered",
      ErrorCode: "30032",
    });

    expect(prisma.messageRecipient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorMessage: expect.stringContaining("+18885551234"),
        }),
      })
    );
  });

  it("uses generic copy when no support number is available", async () => {
    const { handleDeliveryStatusCallback } = await import(
      "@/lib/twilio/status-handler"
    );
    const prisma = (await import("@/lib/prisma")).prisma;

    vi.spyOn(prisma.messageRecipient, "findFirst").mockResolvedValue({
      id: "rec_1",
      errorMessage: null,
      message: {
        workspace: { twilioPhoneNumber: null },
      },
    } as never);
    vi.spyOn(prisma.messageRecipient, "update").mockResolvedValue({} as never);

    await handleDeliveryStatusCallback({
      MessageSid: "SM123",
      MessageStatus: "undelivered",
      ErrorCode: "30032",
    });

    expect(prisma.messageRecipient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorMessage: "Toll-free number not verified. Verify your sender number in Twilio Console before sending to US numbers.",
        }),
      })
    );
  });
});
