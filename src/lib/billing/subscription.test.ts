import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  BILLING_SEND_BLOCKED_MESSAGE,
  canWorkspaceSendMessages,
  checkBillingAllowsSend,
} from "@/lib/billing/subscription";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    billingAccount: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("canWorkspaceSendMessages", () => {
  it("blocks missing subscription", () => {
    expect(canWorkspaceSendMessages(null)).toBe(false);
  });

  it("allows active, trialing, and comped", () => {
    expect(canWorkspaceSendMessages({ status: "active" })).toBe(true);
    expect(canWorkspaceSendMessages({ status: "trialing" })).toBe(true);
    expect(canWorkspaceSendMessages({ status: "comped" })).toBe(true);
  });

  it("blocks canceled, past_due, inactive, and unpaid-like statuses", () => {
    expect(canWorkspaceSendMessages({ status: "canceled" })).toBe(false);
    expect(canWorkspaceSendMessages({ status: "past_due" })).toBe(false);
    expect(canWorkspaceSendMessages({ status: "inactive" })).toBe(false);
  });
});

describe("checkBillingAllowsSend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks sending when billing account is missing", async () => {
    vi.mocked(prisma.billingAccount.findUnique).mockResolvedValue(null);

    const result = await checkBillingAllowsSend("ws_1");

    expect(result).toEqual({
      ok: false,
      error: BILLING_SEND_BLOCKED_MESSAGE,
    });
  });

  it("allows sending when billing is active", async () => {
    vi.mocked(prisma.billingAccount.findUnique).mockResolvedValue({
      status: "active",
    } as never);

    const result = await checkBillingAllowsSend("ws_1");

    expect(result).toEqual({ ok: true });
  });

  it("allows sending when billing is trialing", async () => {
    vi.mocked(prisma.billingAccount.findUnique).mockResolvedValue({
      status: "trialing",
    } as never);

    expect(await checkBillingAllowsSend("ws_1")).toEqual({ ok: true });
  });

  it("blocks canceled subscriptions", async () => {
    vi.mocked(prisma.billingAccount.findUnique).mockResolvedValue({
      status: "canceled",
    } as never);

    const result = await checkBillingAllowsSend("ws_1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/canceled/i);
    }
  });

  it("blocks past_due subscriptions", async () => {
    vi.mocked(prisma.billingAccount.findUnique).mockResolvedValue({
      status: "past_due",
    } as never);

    const result = await checkBillingAllowsSend("ws_1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/past due/i);
    }
  });

  it("blocks inactive subscriptions", async () => {
    vi.mocked(prisma.billingAccount.findUnique).mockResolvedValue({
      status: "inactive",
    } as never);

    const result = await checkBillingAllowsSend("ws_1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(BILLING_SEND_BLOCKED_MESSAGE);
    }
  });
});

describe("BILLING_SEND_BLOCKED_MESSAGE", () => {
  it("uses the required user-facing copy", () => {
    expect(BILLING_SEND_BLOCKED_MESSAGE).toBe(
      "Your workspace needs an active plan before sending messages."
    );
  });
});
