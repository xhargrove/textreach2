import type { RecipientStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TWILIO_STATUS_MAP: Record<string, RecipientStatus> = {
  queued: "queued",
  sending: "sent",
  sent: "sent",
  delivered: "delivered",
  undelivered: "undelivered",
  failed: "failed",
};

const STATIC_TWILIO_ERROR_MESSAGES: Record<string, string> = {
  "30007": "Message filtered as spam. Review message content and sender verification.",
  "21608": "This number is not verified on your Twilio trial account.",
  "21610": "Recipient has opted out via Twilio's global opt-out list.",
};

export function mapTwilioDeliveryStatus(
  twilioStatus: string
): RecipientStatus | null {
  return TWILIO_STATUS_MAP[twilioStatus.toLowerCase()] ?? null;
}

function tollFreeVerificationMessage(workspacePhone?: string | null): string {
  const supportNumber =
    workspacePhone?.trim() || process.env.DEFAULT_SUPPORT_PHONE?.trim() || null;

  if (supportNumber) {
    return `Toll-free number not verified. Verify ${supportNumber} in Twilio Console before sending to US numbers.`;
  }

  return "Toll-free number not verified. Verify your sender number in Twilio Console before sending to US numbers.";
}

function resolveTwilioErrorMessage(
  errorCode: string,
  workspacePhone?: string | null
): string | undefined {
  if (errorCode === "30032") {
    return tollFreeVerificationMessage(workspacePhone);
  }
  return STATIC_TWILIO_ERROR_MESSAGES[errorCode];
}

type StatusCallbackParams = {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string;
  ErrorMessage?: string;
};

export async function handleDeliveryStatusCallback(
  params: StatusCallbackParams
): Promise<boolean> {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = params;
  if (!MessageSid || !MessageStatus) return false;

  const recipient = await prisma.messageRecipient.findFirst({
    where: { twilioSid: MessageSid },
    include: {
      message: {
        select: {
          workspace: {
            select: { twilioPhoneNumber: true },
          },
        },
      },
    },
  });

  if (!recipient) return false;

  const status = mapTwilioDeliveryStatus(MessageStatus);
  if (!status) return false;

  const errorParts = [ErrorCode, ErrorMessage].filter(Boolean);
  let errorInfo =
    errorParts.length > 0
      ? errorParts.join(": ")
      : status === "failed" || status === "undelivered"
        ? MessageStatus
        : undefined;

  if (ErrorCode) {
    const mapped = resolveTwilioErrorMessage(
      ErrorCode,
      recipient.message.workspace.twilioPhoneNumber
    );
    if (mapped) errorInfo = mapped;
  }

  await prisma.messageRecipient.update({
    where: { id: recipient.id },
    data: {
      status,
      errorMessage: errorInfo ?? recipient.errorMessage,
      updatedAt: new Date(),
    },
  });

  return true;
}
