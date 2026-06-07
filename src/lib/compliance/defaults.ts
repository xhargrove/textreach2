export const DEFAULT_COMPLIANCE_FOOTER =
  "Reply STOP to unsubscribe. Msg & data rates may apply.";

export const DEFAULT_HELP_RESPONSE =
  "TextReach alerts: Reply STOP to unsubscribe. Msg & data rates may apply. Contact support for help.";

export const COMPLIANCE_USER_COPY =
  "Only text people who gave you permission. TextReach automatically skips people who opted out.";

export type ComplianceSettingsData = {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  messageFrequencyDescription: string;
  defaultComplianceFooter: string;
  defaultHelpResponse: string;
  physicalAddress: string;
  marketingSmsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursTimezone: string;
};

export function mergeComplianceSettings(
  workspace: {
    businessName?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    privacyPolicyUrl?: string | null;
    termsUrl?: string | null;
    messageFrequencyDescription?: string | null;
    defaultComplianceFooter?: string | null;
    defaultHelpResponse?: string | null;
    physicalAddress?: string | null;
    marketingSmsEnabled?: boolean | null;
    quietHoursEnabled?: boolean | null;
    quietHoursTimezone?: string | null;
  } | null
): ComplianceSettingsData {
  return {
    businessName: workspace?.businessName?.trim() ?? "",
    supportEmail: workspace?.supportEmail?.trim() ?? "",
    supportPhone: workspace?.supportPhone?.trim() ?? "",
    privacyPolicyUrl: workspace?.privacyPolicyUrl?.trim() ?? "",
    termsUrl: workspace?.termsUrl?.trim() ?? "",
    messageFrequencyDescription:
      workspace?.messageFrequencyDescription?.trim() ?? "",
    defaultComplianceFooter:
      workspace?.defaultComplianceFooter?.trim() || DEFAULT_COMPLIANCE_FOOTER,
    defaultHelpResponse:
      workspace?.defaultHelpResponse?.trim() || DEFAULT_HELP_RESPONSE,
    physicalAddress: workspace?.physicalAddress?.trim() ?? "",
    marketingSmsEnabled: workspace?.marketingSmsEnabled ?? true,
    quietHoursEnabled: workspace?.quietHoursEnabled ?? false,
    quietHoursTimezone: workspace?.quietHoursTimezone?.trim() ?? "",
  };
}
