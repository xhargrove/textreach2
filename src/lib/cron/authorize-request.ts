import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type CronAuthResult =
  | { ok: true; devBypass: boolean }
  | { ok: false; response: Response };

function isDevBypassEnabled(): boolean {
  return process.env.CRON_DEV_BYPASS?.trim().toLowerCase() === "true";
}

export function authorizeCronRequest(
  request: NextRequest
): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !cronSecret && !isDevBypassEnabled()) {
    console.error(
      JSON.stringify({
        level: "error",
        type: "textreach_cron_misconfigured",
        message: "CRON_SECRET is required in production",
        timestamp: new Date().toISOString(),
      })
    );
    return {
      ok: false,
      response: new Response("Server misconfigured", { status: 500 }),
    };
  }

  if (!cronSecret) {
    if (!isProduction || isDevBypassEnabled()) {
      console.warn(
        JSON.stringify({
          level: "warn",
          type: "textreach_cron_dev_bypass",
          message:
            "CRON route allowed without CRON_SECRET (development mode or CRON_DEV_BYPASS=true)",
          nodeEnv: process.env.NODE_ENV ?? "unknown",
          devBypass: isDevBypassEnabled(),
          timestamp: new Date().toISOString(),
        })
      );
      return { ok: true, devBypass: true };
    }
  }

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
      return { ok: true, devBypass: false };
    }

    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
