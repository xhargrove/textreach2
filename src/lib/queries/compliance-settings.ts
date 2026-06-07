import { prisma } from "@/lib/prisma";
import {
  mergeComplianceSettings,
  type ComplianceSettingsData,
} from "@/lib/compliance/defaults";

export async function getComplianceSettings(
  workspaceId: string
): Promise<ComplianceSettingsData> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      businessName: true,
      supportEmail: true,
      supportPhone: true,
      privacyPolicyUrl: true,
      termsUrl: true,
      messageFrequencyDescription: true,
      defaultComplianceFooter: true,
      defaultHelpResponse: true,
      physicalAddress: true,
      marketingSmsEnabled: true,
      quietHoursEnabled: true,
      quietHoursTimezone: true,
    },
  });

  return mergeComplianceSettings(workspace);
}

export async function getComplianceArchive(
  workspaceId: string,
  messageId: string
) {
  return prisma.complianceArchive.findFirst({
    where: { workspaceId, messageId },
  });
}
