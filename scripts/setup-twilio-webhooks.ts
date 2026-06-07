/**
 * Configures Twilio phone number webhooks from .env.
 * Run after starting the tunnel and updating TWILIO_WEBHOOK_BASE_URL.
 *
 * Usage: npx tsx scripts/setup-twilio-webhooks.ts
 */
import { readFileSync } from "fs";
import twilio from "twilio";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");

if (!accountSid || !authToken || !phoneNumber || !baseUrl) {
  console.error(
    "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, or TWILIO_WEBHOOK_BASE_URL in .env"
  );
  process.exit(1);
}

if (baseUrl.includes("your-ngrok-url") || baseUrl.includes("localhost")) {
  console.error(
    "TWILIO_WEBHOOK_BASE_URL must be your public tunnel URL, not localhost."
  );
  process.exit(1);
}

const inboundUrl = `${baseUrl}/api/webhooks/twilio/inbound`;
const statusUrl = `${baseUrl}/api/webhooks/twilio/status`;

async function main() {
  const client = twilio(accountSid, authToken);

  const numbers = await client.incomingPhoneNumbers.list({
    phoneNumber,
    limit: 1,
  });

  if (numbers.length === 0) {
    console.error(`Phone number ${phoneNumber} not found on this Twilio account.`);
    process.exit(1);
  }

  const number = numbers[0];

  await client.incomingPhoneNumbers(number.sid).update({
    smsUrl: inboundUrl,
    smsMethod: "POST",
    statusCallback: statusUrl,
    statusCallbackMethod: "POST",
  });

  console.log("Twilio webhooks configured successfully.");
  console.log("");
  console.log(`Phone:   ${phoneNumber}`);
  console.log(`Inbound: ${inboundUrl}`);
  console.log(`Status:  ${statusUrl}`);
  console.log("");
  console.log("Restart npm run dev if it was already running when .env changed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
