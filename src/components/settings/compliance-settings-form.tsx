"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateComplianceSettingsAction } from "@/lib/actions/compliance-settings";
import {
  DEFAULT_COMPLIANCE_FOOTER,
  DEFAULT_HELP_RESPONSE,
  COMPLIANCE_USER_COPY,
  type ComplianceSettingsData,
} from "@/lib/compliance/defaults";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type ComplianceSettingsFormProps = {
  settings: ComplianceSettingsData;
};

export function ComplianceSettingsForm({
  settings,
}: ComplianceSettingsFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateComplianceSettingsAction, null);

  useEffect(() => {
    if (state && "success" in state && state.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {COMPLIANCE_USER_COPY}
      </p>

      <FormActionError error={getActionError(state)} />
      {state && "success" in state && state.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {state.success}
        </div>
      )}

      <div>
        <label
          htmlFor="businessName"
          className="block text-sm font-medium text-gray-700"
        >
          Business / organization name
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          minLength={2}
          defaultValue={settings.businessName}
          placeholder="Your business name"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="physicalAddress"
          className="block text-sm font-medium text-gray-700"
        >
          Physical mailing address
        </label>
        <textarea
          id="physicalAddress"
          name="physicalAddress"
          rows={2}
          defaultValue={settings.physicalAddress}
          placeholder="123 Main St, City, ST 12345"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Required for marketing SMS compliance (TCPA).
        </p>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="marketingSmsEnabled"
          name="marketingSmsEnabled"
          type="checkbox"
          defaultChecked={settings.marketingSmsEnabled}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="marketingSmsEnabled" className="text-sm text-gray-700">
          Marketing SMS enabled — requires business name, support email,
          physical address, and legal URLs.
        </label>
      </div>

      <div>
        <label
          htmlFor="supportEmail"
          className="block text-sm font-medium text-gray-700"
        >
          Support email
        </label>
        <input
          id="supportEmail"
          name="supportEmail"
          type="email"
          required
          defaultValue={settings.supportEmail}
          placeholder="support@yourbusiness.com"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="supportPhone"
          className="block text-sm font-medium text-gray-700"
        >
          Support phone <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="supportPhone"
          name="supportPhone"
          type="tel"
          defaultValue={settings.supportPhone}
          placeholder="+1 555 123 4567"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="privacyPolicyUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Privacy policy URL
        </label>
        <input
          id="privacyPolicyUrl"
          name="privacyPolicyUrl"
          type="url"
          defaultValue={settings.privacyPolicyUrl}
          placeholder="https://yourbusiness.com/privacy"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="termsUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Terms URL
        </label>
        <input
          id="termsUrl"
          name="termsUrl"
          type="url"
          defaultValue={settings.termsUrl}
          placeholder="https://yourbusiness.com/terms"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="messageFrequencyDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Message frequency description
        </label>
        <textarea
          id="messageFrequencyDescription"
          name="messageFrequencyDescription"
          rows={2}
          defaultValue={settings.messageFrequencyDescription}
          placeholder="e.g. Up to 4 messages per month about events and promotions"
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label
          htmlFor="defaultComplianceFooter"
          className="block text-sm font-medium text-gray-700"
        >
          Default compliance footer
        </label>
        <textarea
          id="defaultComplianceFooter"
          name="defaultComplianceFooter"
          rows={2}
          required
          defaultValue={settings.defaultComplianceFooter}
          placeholder={DEFAULT_COMPLIANCE_FOOTER}
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Appended to every outbound message before send.
        </p>
      </div>

      <div>
        <label
          htmlFor="defaultHelpResponse"
          className="block text-sm font-medium text-gray-700"
        >
          Default HELP response
        </label>
        <textarea
          id="defaultHelpResponse"
          name="defaultHelpResponse"
          rows={3}
          required
          defaultValue={settings.defaultHelpResponse}
          placeholder={DEFAULT_HELP_RESPONSE}
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Sent when someone texts HELP to your number.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-2">
          <input
            id="quietHoursEnabled"
            name="quietHoursEnabled"
            type="checkbox"
            defaultChecked={settings.quietHoursEnabled}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <label
              htmlFor="quietHoursEnabled"
              className="block text-sm font-medium text-gray-700"
            >
              Quiet hours
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Optional send-time restrictions (timezone required when enabled).
            </p>
          </div>
        </div>
        <div className="mt-3">
          <label
            htmlFor="quietHoursTimezone"
            className="block text-sm font-medium text-gray-700"
          >
            Quiet hours timezone
          </label>
          <input
            id="quietHoursTimezone"
            name="quietHoursTimezone"
            type="text"
            defaultValue={settings.quietHoursTimezone}
            placeholder="America/New_York"
            className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <Button type="submit" size="sm">
        Save compliance settings
      </Button>
    </form>
  );
}
