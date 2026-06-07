/**
 * Process due scheduled messages locally (same logic as the Vercel Cron route).
 *
 * Usage:
 *   npm run cron:scheduled-messages
 *   CRON_SECRET=your-secret npm run cron:scheduled-messages -- --http
 */
import { processAllDueScheduledMessages } from "../src/lib/messages/process-scheduled";

async function runViaHttp() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const secret = process.env.CRON_SECRET;

  const headers: Record<string, string> = {};
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const response = await fetch(
    `${baseUrl}/api/cron/process-scheduled-messages`,
    { headers }
  );

  const body = await response.text();
  console.log(response.status, body);
  if (!response.ok) process.exit(1);
}

async function main() {
  if (process.argv.includes("--http")) {
    await runViaHttp();
    return;
  }

  const result = await processAllDueScheduledMessages();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
