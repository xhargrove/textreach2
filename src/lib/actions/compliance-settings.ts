"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { validateComplianceSettings } from "@/lib/compliance/validate-compliance-settings";
import {
  actionFailure,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";

type ActionResult = ActionFailure | { success?: string } | null;

async function requireWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_settings");
  return ctx.workspaceId;
}

function parseComplianceForm(formData: FormData) {
  return {
    businessName: (formData.get("businessName") as string)?.trim() ?? "",
    supportEmail: (formData.get("supportEmail") as string)?.trim() ?? "",
    supportPhone: (formData.get("supportPhone") as string)?.trim() ?? "",
    privacyPolicyUrl: (formData.get("privacyPolicyUrl") as string)?.trim() ?? "",
    termsUrl: (formData.get("termsUrl") as string)?.trim() ?? "",
    messageFrequencyDescription:
      (formData.get("messageFrequencyDescription") as string)?.trim() ?? "",
    defaultComplianceFooter:
      (formData.get("defaultComplianceFooter") as string)?.trim() ?? "",
    defaultHelpResponse:
      (formData.get("defaultHelpResponse") as string)?.trim() ?? "",
    physicalAddress: (formData.get("physicalAddress") as string)?.trim() ?? "",
    marketingSmsEnabled: formData.get("marketingSmsEnabled") === "on",
    quietHoursEnabled: formData.get("quietHoursEnabled") === "on",
    quietHoursTimezone:
      (formData.get("quietHoursTimezone") as string)?.trim() ?? "",
  };
}

function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export async function updateComplianceSettingsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const data = parseComplianceForm(formData);

    const validationError = validateComplianceSettings(data);
    if (validationError) {
      return actionFailure(validationError);
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        businessName: data.businessName,
        supportEmail: data.supportEmail,
        supportPhone: emptyToNull(data.supportPhone),
        privacyPolicyUrl: emptyToNull(data.privacyPolicyUrl),
        termsUrl: emptyToNull(data.termsUrl),
        messageFrequencyDescription: emptyToNull(data.messageFrequencyDescription),
        defaultComplianceFooter: data.defaultComplianceFooter,
        defaultHelpResponse: data.defaultHelpResponse,
        physicalAddress: emptyToNull(data.physicalAddress),
        marketingSmsEnabled: data.marketingSmsEnabled,
        quietHoursEnabled: data.quietHoursEnabled,
        quietHoursTimezone: data.quietHoursEnabled
          ? data.quietHoursTimezone
          : null,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/messages/new");
    return { success: "Compliance settings saved" };
  });
}
