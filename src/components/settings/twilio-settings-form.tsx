"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTwilioSettingsAction } from "@/lib/actions/twilio-settings";
import type { TwilioSettingsData } from "@/lib/queries/twilio-settings";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";

type TwilioSettingsFormProps = {
  settings: TwilioSettingsData;
};

export function TwilioSettingsForm({ settings }: TwilioSettingsFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateTwilioSettingsAction, null);

  useEffect(() => {
    if (state && "success" in state && state.success) router.refresh();
  }, [state, router]);

  const isConfigured = settings.twilioStatus === "configured";

  return (
    <form action={formAction} className="space-y-4">
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        Enter the Twilio number that receives inbound SMS for this workspace.
        Inbound webhooks route by this number — each workspace needs its own
        unique E.164 number in production.
      </p>

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-gray-700">Status:</span>
        <span
          className={
            isConfigured
              ? "rounded-full bg-green-100 px-2 py-0.5 text-green-800"
              : "rounded-full bg-amber-100 px-2 py-0.5 text-amber-800"
          }
        >
          {isConfigured ? "Configured" : "Not configured"}
        </span>
      </div>

      <FormActionError error={getActionError(state)} />
      {state && "success" in state && state.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {state.success}
        </div>
      )}

      <div>
        <label
          htmlFor="twilioPhoneNumber"
          className="block text-sm font-medium text-gray-700"
        >
          Twilio phone number
        </label>
        <input
          id="twilioPhoneNumber"
          name="twilioPhoneNumber"
          type="tel"
          required
          defaultValue={settings.twilioPhoneNumber}
          placeholder="+14045551234"
          className="form-input mt-1 max-w-md"
        />
        <p className="mt-1 text-xs text-gray-500">
          E.164 format required (e.g. +14045551234).
        </p>
      </div>

      <div>
        <label
          htmlFor="twilioMessagingSid"
          className="block text-sm font-medium text-gray-700"
        >
          Messaging Service SID{" "}
          <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="twilioMessagingSid"
          name="twilioMessagingSid"
          type="text"
          defaultValue={settings.twilioMessagingSid}
          placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="form-input mt-1 max-w-md font-mono text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="twilioAccountSid"
          className="block text-sm font-medium text-gray-700"
        >
          Twilio Account SID{" "}
          <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="twilioAccountSid"
          name="twilioAccountSid"
          type="text"
          defaultValue={settings.twilioAccountSid}
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="form-input mt-1 max-w-md font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional metadata for future per-workspace Twilio provisioning.
        </p>
      </div>

      <Button type="submit" size="sm">
        Save Twilio settings
      </Button>
    </form>
  );
}
