import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isProduction } from "@/lib/production-guards";

export const dynamic = "force-dynamic";

export async function GET() {
  let databaseOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  if (isProduction()) {
    return NextResponse.json(
      {
        ok: databaseOk,
        timestamp: new Date().toISOString(),
      },
      { status: databaseOk ? 200 : 503 }
    );
  }

  return NextResponse.json(
    {
      ok: databaseOk,
      checks: {
        database: databaseOk,
        twilio: Boolean(
          process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        ),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY),
        clerk: Boolean(
          process.env.CLERK_SECRET_KEY &&
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        ),
        cronSecret: Boolean(process.env.CRON_SECRET),
      },
      timestamp: new Date().toISOString(),
    },
    { status: databaseOk ? 200 : 503 }
  );
}
