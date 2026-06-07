import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    list: { findFirst: vi.fn(), updateMany: vi.fn() },
    listContact: { findMany: vi.fn() },
    messageRecipient: { createMany: vi.fn() },
    tag: { updateMany: vi.fn() },
    keyword: { updateMany: vi.fn() },
    contact: { deleteMany: vi.fn() },
    message: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth/authorization", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/queries/tags", () => ({
  isTagNameTaken: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/queries/keywords", () => ({
  isKeywordTaken: vi.fn().mockResolvedValue(false),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/queries/lists", () => ({
  isListNameTaken: vi.fn().mockResolvedValue(false),
}));

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { createMessageRecipients } from "@/lib/messages/send-message";
import { updateTagAction } from "@/lib/actions/tags";
import { updateKeywordAction } from "@/lib/actions/keywords";
import { updateListAction } from "@/lib/actions/lists";
import { deleteContactSimpleAction } from "@/lib/actions/contacts";
import { deleteMessageSimpleAction } from "@/lib/actions/messages";

describe("workspace scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue({
      workspaceId: "ws_a",
      userId: "user_a",
      role: "owner",
    } as never);
  });

  it("does not attach recipients from another workspace list", async () => {
    vi.mocked(prisma.list.findFirst).mockResolvedValue(null);

    const recipients = await createMessageRecipients(
      "msg_1",
      "list_b",
      "ws_a"
    );

    expect(recipients).toEqual([]);
    expect(prisma.list.findFirst).toHaveBeenCalledWith({
      where: { id: "list_b", workspaceId: "ws_a" },
      select: { id: true },
    });
    expect(prisma.messageRecipient.createMany).not.toHaveBeenCalled();
  });

  it("scopes tag updates to the current workspace", async () => {
    vi.mocked(prisma.tag.updateMany).mockResolvedValue({ count: 0 });

    const result = await updateTagAction(null, formData({
      tagId: "tag_b",
      name: "VIP",
      color: "#000000",
    }));

    expect(prisma.tag.updateMany).toHaveBeenCalledWith({
      where: { id: "tag_b", workspaceId: "ws_a" },
      data: { name: "VIP", color: "#000000" },
    });
    expect(result).toEqual({
      ok: false,
      error: "Tag not found or already deleted.",
    });
  });

  it("scopes keyword updates to the current workspace", async () => {
    vi.mocked(prisma.keyword.updateMany).mockResolvedValue({ count: 0 });

    const result = await updateKeywordAction(null, formData({
      keywordId: "kw_b",
      keyword: "SALE",
      status: "active",
      autoReply: "Thanks for joining!",
    }));

    expect(prisma.keyword.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "kw_b", workspaceId: "ws_a" },
      })
    );
    expect(result).toEqual({
      ok: false,
      error: "Keyword not found or already deleted.",
    });
  });

  it("scopes list updates to the current workspace", async () => {
    vi.mocked(prisma.list.updateMany).mockResolvedValue({ count: 0 });

    const result = await updateListAction(null, formData({
      listId: "list_b",
      name: "VIP List",
    }));

    expect(prisma.list.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "list_b", workspaceId: "ws_a" },
      })
    );
    expect(result).toEqual({
      ok: false,
      error: "List not found or already deleted.",
    });
  });

  it("scopes contact deletes to the current workspace", async () => {
    vi.mocked(prisma.contact.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      deleteContactSimpleAction(formData({ contactId: "contact_b" }))
    ).rejects.toThrow("REDIRECT:/contacts?error=not_found");

    expect(prisma.contact.deleteMany).toHaveBeenCalledWith({
      where: { id: "contact_b", workspaceId: "ws_a" },
    });
  });

  it("scopes message deletes to the current workspace", async () => {
    vi.mocked(prisma.message.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      deleteMessageSimpleAction(formData({ messageId: "msg_b" }))
    ).rejects.toThrow("REDIRECT:/messages?error=not_found");

    expect(prisma.message.deleteMany).toHaveBeenCalledWith({
      where: { id: "msg_b", workspaceId: "ws_a" },
    });
  });
});

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}
