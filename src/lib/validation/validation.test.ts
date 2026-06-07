import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/validation/phone";
import { validateKeyword } from "@/lib/validation/keyword";

describe("normalizePhone", () => {
  it("normalizes US numbers", () => {
    const result = normalizePhone("(555) 123-4567");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.phone).toMatch(/^\+1/);
    }
  });

  it("rejects invalid numbers", () => {
    expect(normalizePhone("abc").ok).toBe(false);
    expect(normalizePhone("").ok).toBe(false);
  });
});

describe("validateKeyword", () => {
  it("accepts valid keywords", () => {
    expect(validateKeyword("FRIDAY").ok).toBe(true);
    expect(validateKeyword("VINYL").ok).toBe(true);
  });

  it("rejects reserved SMS commands", () => {
    expect(validateKeyword("STOP").ok).toBe(false);
    expect(validateKeyword("HELP").ok).toBe(false);
    expect(validateKeyword("START").ok).toBe(false);
  });
});
