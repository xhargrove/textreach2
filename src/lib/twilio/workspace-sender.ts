export type WorkspaceTwilioSender = {
  twilioPhoneNumber: string | null;
  twilioMessagingSid: string | null;
};

export type TwilioSendFromOptions =
  | { messagingServiceSid: string }
  | { from: string };

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function isPlatformSenderFallbackEnabled(): boolean {
  if (process.env.TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK === "true") {
    return true;
  }

  // Local development: use platform TWILIO_PHONE_NUMBER when workspace sender unset.
  return isDevEnvironment() && resolvePlatformSendFromOptions() !== null;
}

export function resolveWorkspaceSendFromOptions(
  sender: WorkspaceTwilioSender
): TwilioSendFromOptions | null {
  const messagingSid = sender.twilioMessagingSid?.trim();
  if (messagingSid) {
    return { messagingServiceSid: messagingSid };
  }

  const phone = sender.twilioPhoneNumber?.trim();
  if (phone) {
    return { from: phone };
  }

  return null;
}

export function resolvePlatformSendFromOptions(): TwilioSendFromOptions | null {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (messagingServiceSid) {
    return { messagingServiceSid };
  }

  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (from) {
    return { from };
  }

  return null;
}

export function resolveSendFromOptionsForWorkspace(
  sender: WorkspaceTwilioSender
): TwilioSendFromOptions {
  const workspaceOptions = resolveWorkspaceSendFromOptions(sender);
  if (workspaceOptions) {
    return workspaceOptions;
  }

  if (isPlatformSenderFallbackEnabled()) {
    const platformOptions = resolvePlatformSendFromOptions();
    if (platformOptions) {
      return platformOptions;
    }
  }

  throw new Error(
    "Workspace Twilio sender is not configured. Add a phone number or Messaging Service SID in Settings → Phone Number."
  );
}

export function isWorkspaceTwilioSenderConfigured(
  sender: WorkspaceTwilioSender
): boolean {
  return resolveWorkspaceSendFromOptions(sender) !== null;
}

export function getResolvedSenderLabel(options: TwilioSendFromOptions): string {
  return "from" in options ? options.from : options.messagingServiceSid;
}
