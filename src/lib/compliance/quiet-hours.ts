/** Default quiet window: 9:00 PM – 8:00 AM in the workspace timezone (TCPA-inspired). */
export const QUIET_HOURS_START = 21;
export const QUIET_HOURS_END = 8;

export type QuietHoursSettings = {
  quietHoursEnabled: boolean;
  quietHoursTimezone: string;
};

export class QuietHoursBlockedError extends Error {
  readonly nextAllowedAt: Date;

  constructor(timeZone: string, nextAllowedAt: Date) {
    super(
      `Sending is blocked during quiet hours (9 PM – 8 AM ${timeZone}). Next allowed send: ${nextAllowedAt.toISOString()}.`
    );
    this.name = "QuietHoursBlockedError";
    this.nextAllowedAt = nextAllowedAt;
  }
}

function getLocalHourMinute(date: Date, timeZone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return { hour, minute };
}

function toMinutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function isWithinQuietHours(
  settings: QuietHoursSettings,
  at: Date = new Date()
): boolean {
  if (!settings.quietHoursEnabled) return false;

  const timeZone = settings.quietHoursTimezone.trim();
  if (!timeZone) return false;

  const { hour, minute } = getLocalHourMinute(at, timeZone);
  const current = toMinutesSinceMidnight(hour, minute);
  const quietStart = toMinutesSinceMidnight(QUIET_HOURS_START, 0);
  const quietEnd = toMinutesSinceMidnight(QUIET_HOURS_END, 0);

  return current >= quietStart || current < quietEnd;
}

export function getNextAllowedSendTime(
  settings: QuietHoursSettings,
  after: Date = new Date()
): Date {
  if (!settings.quietHoursEnabled || !isWithinQuietHours(settings, after)) {
    return after;
  }

  let candidate = new Date(after.getTime() + 60_000);
  candidate.setUTCSeconds(0, 0);

  for (let i = 0; i < 24 * 60; i++) {
    if (!isWithinQuietHours(settings, candidate)) {
      return candidate;
    }
    candidate = new Date(candidate.getTime() + 60_000);
  }

  return candidate;
}

export function assertCanSendDuringQuietHours(
  settings: QuietHoursSettings,
  at: Date = new Date()
): void {
  if (!isWithinQuietHours(settings, at)) return;
  const timeZone = settings.quietHoursTimezone.trim() || "local";
  throw new QuietHoursBlockedError(
    timeZone,
    getNextAllowedSendTime(settings, at)
  );
}

export function resolveScheduledSendTime(
  settings: QuietHoursSettings,
  scheduledAt: Date
): Date {
  if (!settings.quietHoursEnabled) return scheduledAt;
  return getNextAllowedSendTime(settings, scheduledAt);
}
