import { describe, expect, it } from "vitest";
import { parseSmsCommand } from "@/lib/twilio/sms-commands";

describe("parseSmsCommand", () => {
  it("recognizes STOP variants", () => {
    expect(parseSmsCommand("STOP")).toBe("stop");
    expect(parseSmsCommand("stop")).toBe("stop");
    expect(parseSmsCommand("UNSUBSCRIBE")).toBe("stop");
    expect(parseSmsCommand("  cancel  ")).toBe("stop");
  });

  it("recognizes START and UNSTOP", () => {
    expect(parseSmsCommand("START")).toBe("start");
    expect(parseSmsCommand("start")).toBe("start");
    expect(parseSmsCommand("UNSTOP")).toBe("start");
  });

  it("recognizes HELP", () => {
    expect(parseSmsCommand("HELP")).toBe("help");
  });

  it("returns null for regular messages", () => {
    expect(parseSmsCommand("Hello there")).toBe(null);
    expect(parseSmsCommand("STOP SALE")).toBe(null);
  });
});
