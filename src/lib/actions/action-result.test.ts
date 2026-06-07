import { describe, expect, it } from "vitest";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { catchActionError, getActionError } from "@/lib/actions/action-result";

describe("catchActionError", () => {
  it("maps ForbiddenError to structured failure", () => {
    const result = catchActionError(new ForbiddenError());
    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to perform this action.",
    });
  });

  it("maps UnauthorizedError to structured failure", () => {
    const result = catchActionError(new UnauthorizedError());
    expect(result).toEqual({
      ok: false,
      error: "You must be signed in to perform this action.",
    });
  });

  it("hides unexpected errors from clients", () => {
    const result = catchActionError(new Error("database exploded"));
    expect(result).toEqual({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("getActionError", () => {
  it("reads ok:false failures", () => {
    expect(
      getActionError({ ok: false, error: "You do not have permission to perform this action." })
    ).toBe("You do not have permission to perform this action.");
  });

  it("reads legacy error-only results", () => {
    expect(getActionError({ error: "Invalid phone" })).toBe("Invalid phone");
  });
});
