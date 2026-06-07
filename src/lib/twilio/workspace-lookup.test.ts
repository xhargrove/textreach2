import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getWorkspaceByTwilioToNumber } from "@/lib/twilio/workspace-lookup";

describe("getWorkspaceByTwilioToNumber", () => {
  beforeEach(() => {
    vi.mocked(prisma.workspace.findFirst).mockReset();
  });

  it("returns null for invalid To numbers", async () => {
    const result = await getWorkspaceByTwilioToNumber("not-a-phone");
    expect(result).toBeNull();
    expect(prisma.workspace.findFirst).not.toHaveBeenCalled();
  });

  it("looks up workspace by normalized E.164 number", async () => {
    const workspace = { id: "ws_1", twilioPhoneNumber: "+14045551234" };
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(workspace as never);

    const result = await getWorkspaceByTwilioToNumber("(404) 555-1234");

    expect(result).toEqual(workspace);
    expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
      where: { twilioPhoneNumber: "+14045551234" },
    });
  });

  it("returns null when no workspace owns the number", async () => {
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null);

    const result = await getWorkspaceByTwilioToNumber("+19998887777");

    expect(result).toBeNull();
  });
});
