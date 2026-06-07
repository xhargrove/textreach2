const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);

export type SmsCommand = "stop" | "start" | "help" | null;

export function parseSmsCommand(body: string): SmsCommand {
  const normalized = body.trim().toUpperCase();
  if (STOP_KEYWORDS.has(normalized)) return "stop";
  if (normalized === "START" || normalized === "UNSTOP") return "start";
  if (normalized === "HELP") return "help";
  return null;
}

export const SMS_COMMAND_REPLIES = {
  stop: "You have been unsubscribed and will no longer receive messages. Reply START to resubscribe.",
  start: "You have been resubscribed. Reply STOP to unsubscribe.",
  help: "TextReach alerts: Reply STOP to unsubscribe. Msg & data rates may apply.",
} as const;
