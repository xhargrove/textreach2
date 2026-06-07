import { describe, expect, it } from "vitest";
import {
  getNextAllowedSendTime,
  isWithinQuietHours,
  QUIET_HOURS_END,
  QUIET_HOURS_START,
  resolveScheduledSendTime,
} from "@/lib/compliance/quiet-hours";

const TZ = "America/New_York";

describe("quiet hours", () => {
  it("does not restrict when quiet hours are disabled", () => {
    const at = new Date("2026-06-06T02:00:00.000Z");
    expect(
      isWithinQuietHours(
        { quietHoursEnabled: false, quietHoursTimezone: TZ },
        at
      )
    ).toBe(false);
  });

  it("detects late-night quiet hours in the configured timezone", () => {
    const at = new Date("2026-01-15T03:00:00.000Z"); // 10 PM ET
    expect(
      isWithinQuietHours(
        { quietHoursEnabled: true, quietHoursTimezone: TZ },
        at
      )
    ).toBe(true);
  });

  it("allows midday sends outside quiet hours", () => {
    const at = new Date("2026-06-06T16:00:00.000Z"); // noon ET
    expect(
      isWithinQuietHours(
        { quietHoursEnabled: true, quietHoursTimezone: TZ },
        at
      )
    ).toBe(false);
  });

  it("defers scheduled sends to the next allowed window", () => {
    const duringQuiet = new Date("2026-01-15T03:00:00.000Z");
    const settings = { quietHoursEnabled: true, quietHoursTimezone: TZ };
    const next = resolveScheduledSendTime(settings, duringQuiet);

    expect(next.getTime()).toBeGreaterThan(duringQuiet.getTime());
    expect(isWithinQuietHours(settings, next)).toBe(false);
  });

  it("uses the configured 9 PM to 8 AM window", () => {
    expect(QUIET_HOURS_START).toBe(21);
    expect(QUIET_HOURS_END).toBe(8);
  });

  it("returns the same time when already outside quiet hours", () => {
    const allowed = new Date("2026-06-06T16:00:00.000Z");
    const settings = { quietHoursEnabled: true, quietHoursTimezone: TZ };
    expect(getNextAllowedSendTime(settings, allowed).toISOString()).toBe(
      allowed.toISOString()
    );
  });
});
