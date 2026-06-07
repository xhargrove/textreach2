"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { validateTwilioSettingsInput } from "@/lib/validation/twilio-config";
import {
  actionFailure,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";

type ActionResult = ActionFailure | { success?: string } | null;

async function requireSettingsWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_settings");
  return ctx.workspaceId;
}

function parseTwilioSettingsForm(formData: FormData) {
  return {
    twilioPhoneNumber:
      (formData.get("twilioPhoneNumber") as string)?.trim() ?? "",
    twilioMessagingSid:
      (formData.get("twilioMessagingSid") as string)?.trim() ?? "",
    twilioAccountSid:
      (formData.get("twilioAccountSid") as string)?.trim() ?? "",
  };
}

export async function updateTwilioSettingsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireSettingsWorkspaceId();
    const input = parseTwilioSettingsForm(formData);
    const validated = validateTwilioSettingsInput(input);

    if (!validated.ok) {
      return actionFailure(validated.error);
    }

    const { twilioPhoneNumber, twilioMessagingSid, twilioAccountSid } =
      validated.data;

    const existingOwner = await prisma.workspace.findFirst({
      where: {
        twilioPhoneNumber,
        NOT: { id: workspaceId },
      },
      select: { id: true, name: true },
    });

    if (existingOwner) {
      return actionFailure(
        "This Twilio phone number is already assigned to another workspace"
      );
    }

    try {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          twilioPhoneNumber,
          twilioMessagingSid,
          twilioAccountSid,
          twilioStatus: "configured",
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        return actionFailure(
          "This Twilio phone number is already assigned to another workspace"
        );
      }
      throw error;
    }

    revalidatePath("/settings");
    return { success: "Twilio settings saved" };
  });
}
