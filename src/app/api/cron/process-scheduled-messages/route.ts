import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-request";
import { processAllDueScheduledMessages } from "@/lib/messages/process-scheduled";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const result = await processAllDueScheduledMessages();

  return NextResponse.json({
    ok: true,
    devBypass: auth.devBypass,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
