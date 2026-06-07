import { describe, expect, it } from "vitest";
import {
  requireMutationCount,
  workspaceNotFound,
} from "@/lib/db/workspace-mutations";

describe("workspace mutations", () => {
  it("returns not found when count is zero", () => {
    expect(requireMutationCount({ count: 0 }, "Tag")).toEqual({
      ok: false,
      error: workspaceNotFound("Tag"),
    });
  });

  it("returns ok when count is positive", () => {
    expect(requireMutationCount({ count: 1 }, "Tag")).toEqual({ ok: true });
  });
});
