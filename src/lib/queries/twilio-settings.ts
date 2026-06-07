import { prisma } from "@/lib/prisma";

export type TwilioSettingsData = {
  twilioPhoneNumber: string;
  twilioMessagingSid: string;
  twilioAccountSid: string;
  twilioStatus: string;
};

const EMPTY_TWILIO_SETTINGS: TwilioSettingsData = {
  twilioPhoneNumber: "",
  twilioMessagingSid: "",
  twilioAccountSid: "",
  twilioStatus: "not_configured",
};

export async function getTwilioSettings(
  workspaceId: string
): Promise<TwilioSettingsData> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      twilioPhoneNumber: true,
      twilioMessagingSid: true,
      twilioAccountSid: true,
      twilioStatus: true,
    },
  });

  if (!workspace) {
    return EMPTY_TWILIO_SETTINGS;
  }

  return {
    twilioPhoneNumber: workspace.twilioPhoneNumber ?? "",
    twilioMessagingSid: workspace.twilioMessagingSid ?? "",
    twilioAccountSid: workspace.twilioAccountSid ?? "",
    twilioStatus: workspace.twilioStatus ?? "not_configured",
  };
}
