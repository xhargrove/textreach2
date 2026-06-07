"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessagePreviewBubble } from "@/components/messages/message-preview-bubble";
import { ComplianceReminder } from "@/components/messages/compliance-reminder";
import { SendConfirmationModal } from "@/components/messages/send-confirmation-modal";
import { getSmsStats } from "@/lib/messages/sms-utils";
import { appendComplianceFooter } from "@/lib/compliance/footer";
import {
  createMessageAction,
  getAudienceStatsAction,
  getTwilioConfigAction,
} from "@/lib/actions/messages";
import type { ListAudienceStats } from "@/lib/queries/messages";
import { formatNumber } from "@/lib/utils";
import { getActionError } from "@/lib/actions/action-result";

type Step = "details" | "write" | "review" | "send";

type ListOption = { id: string; name: string; contactCount: number };

type CreateMessageWizardProps = {
  lists: ListOption[];
  complianceFooter: string;
};

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Message details" },
  { key: "write", label: "Write message" },
  { key: "review", label: "Review" },
  { key: "send", label: "Send options" },
];

export function CreateMessageWizard({
  lists,
  complianceFooter,
}: CreateMessageWizardProps) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [listId, setListId] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audienceStats, setAudienceStats] = useState<ListAudienceStats | null>(
    null
  );
  const [loadingStats, setLoadingStats] = useState(false);
  const [twilioConfigured, setTwilioConfigured] = useState(true);
  const [platformTwilioConfigured, setPlatformTwilioConfigured] = useState(true);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const smsStats = getSmsStats(body);
  const composedBody = appendComplianceFooter(body, complianceFooter);
  const composedSmsStats = getSmsStats(composedBody);
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const selectedList = lists.find((l) => l.id === listId);
  const estimatedUsage =
    audienceStats && composedSmsStats.segments > 0
      ? audienceStats.willSendCount * composedSmsStats.segments
      : 0;

  useEffect(() => {
    getTwilioConfigAction().then((result) => {
      if (result.ok) {
        setTwilioConfigured(result.configured);
        setPlatformTwilioConfigured(result.platformConfigured);
      }
    });
  }, []);

  useEffect(() => {
    if (step !== "review" && step !== "send") return;
    if (!listId) return;

    let cancelled = false;
    setLoadingStats(true);

    getAudienceStatsAction(listId).then((result) => {
      if (cancelled) return;
      setLoadingStats(false);
      if (result.ok) {
        setAudienceStats(result.data);
      } else {
        setError(result.error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [step, listId]);

  function goNext() {
    setError(null);

    if (step === "details") {
      if (!name.trim()) {
        setError("Message name is required");
        return;
      }
      if (!listId) {
        setError("Please select a list");
        return;
      }
      setStep("write");
      return;
    }

    if (step === "write") {
      if (!body.trim()) {
        setError("Message body is required");
        return;
      }
      setStep("review");
      return;
    }

    if (step === "review") {
      setStep("send");
    }
  }

  function goBack() {
    setError(null);
    if (step === "write") setStep("details");
    else if (step === "review") setStep("write");
    else if (step === "send") setStep("review");
  }

  function handleInsertLink() {
    setBody((prev) => (prev ? `${prev} https://` : "https://"));
  }

  function submit(action: "draft" | "send" | "schedule") {
    setError(null);
    setShowSendConfirm(false);

    if (action === "schedule" && !scheduledAt) {
      setError("Please choose a schedule date and time");
      return;
    }

    startTransition(async () => {
      const result = await createMessageAction({
        name,
        listId,
        body,
        action,
        scheduledAt:
          action === "schedule" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : undefined,
      });
      const message = getActionError(result);
      if (message) {
        setError(message);
      }
    });
  }

  function requestSchedule() {
    setError(null);
    if (!scheduledAt) {
      setError("Please choose a schedule date and time");
      return;
    }
    if (!twilioConfigured) {
      setError(
        !platformTwilioConfigured
          ? "Twilio is not configured for this app."
          : "Add your Twilio phone number in Settings → Phone Number before sending or scheduling."
      );
      return;
    }
    if (!audienceStats || audienceStats.willSendCount === 0) {
      setError(
        "No active recipients with valid phone numbers on this list."
      );
      return;
    }
    submit("schedule");
  }

  function requestSend() {
    setError(null);
    if (!twilioConfigured) {
      setError(
        !platformTwilioConfigured
          ? "Twilio is not configured for this app."
          : "Add your Twilio phone number in Settings → Phone Number before sending or scheduling."
      );
      return;
    }
    if (!audienceStats || audienceStats.willSendCount === 0) {
      setError(
        "No active recipients with valid phone numbers on this list."
      );
      return;
    }
    setShowSendConfirm(true);
  }

  if (lists.length === 0) {
    return (
      <Card>
        <p className="text-gray-700">
          You need at least one list before sending a message.
        </p>
        <Button href="/lists/new" className="mt-4">
          Create a list
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <nav aria-label="Message creation progress" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="flex min-w-max gap-2 pb-1">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i <= stepIndex
                  ? "bg-brand-100 text-brand-800"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>
      </nav>

      {!twilioConfigured && (step === "review" || step === "send") && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {!platformTwilioConfigured ? (
            <>
              Twilio platform credentials are missing. Contact your workspace
              admin — sending and scheduling are unavailable until Twilio is
              configured on the server.
            </>
          ) : (
            <>
              This workspace needs a sending number before you can schedule or
              send. Add your Twilio phone number in{" "}
              <Link href="/settings" className="font-medium underline">
                Settings → Phone Number
              </Link>
              .
            </>
          )}
        </div>
      )}

      {error && (
        <Alert variant="error">
          {error}
          {error.includes("Billing") && (
            <>
              {" "}
              <Link href="/billing" className="font-medium underline">
                Go to Billing
              </Link>
            </>
          )}
        </Alert>
      )}

      {step === "details" && (
        <Card className="max-w-xl space-y-6">
          <div>
            <label
              htmlFor="message-name"
              className="block text-sm font-medium text-gray-700"
            >
              Message name <span className="text-red-500">*</span>
            </label>
            <input
              id="message-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring sale announcement"
              className="form-input"
            />
            <p className="mt-1 text-xs text-gray-500">
              Internal name — recipients won&apos;t see this.
            </p>
          </div>

          <div>
            <label
              htmlFor="message-list"
              className="block text-sm font-medium text-gray-700"
            >
              Select list <span className="text-red-500">*</span>
            </label>
            <select
              id="message-list"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="form-input"
            >
              <option value="">Choose a list…</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({formatNumber(list.contactCount)} contacts)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
            <Button type="button" variant="secondary" href="/messages">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {step === "write" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <div>
              <label
                htmlFor="message-body"
                className="block text-sm font-medium text-gray-700"
              >
                SMS message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message-body"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your text message here…"
                className="form-textarea"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                {smsStats.length} character{smsStats.length === 1 ? "" : "s"}
              </span>
              <span>
                {smsStats.segments} SMS segment{smsStats.segments === 1 ? "" : "s"}
              </span>
              <span className="text-xs text-gray-500">
                {smsStats.encoding === "unicode" ? "Unicode" : "GSM-7"} encoding
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleInsertLink}
            >
              Insert link
            </Button>
            <p className="text-xs text-gray-500">
              URLs in your message are automatically replaced with tracking
              links when sent.
            </p>
          </Card>

          <MessagePreviewBubble body={body} />
        </div>
      )}

      {step === "write" && (
        <div className="flex gap-3">
          <Button type="button" onClick={goNext}>
            Continue to review
          </Button>
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
        </div>
      )}

      {step === "review" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Review your message
            </h2>

            {loadingStats ? (
              <p className="text-sm text-gray-500">Loading list details…</p>
            ) : audienceStats ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">List</dt>
                  <dd className="font-medium text-gray-900">
                    {audienceStats.listName}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Active recipients</dt>
                  <dd className="font-medium text-green-700">
                    {formatNumber(audienceStats.willSendCount)} will receive
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Opted-out skipped</dt>
                  <dd className="font-medium text-amber-700">
                    {formatNumber(audienceStats.optedOutCount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Invalid skipped</dt>
                  <dd className="font-medium text-amber-700">
                    {formatNumber(audienceStats.invalidCount)}
                  </dd>
                </div>
                {audienceStats.missingConsentCount > 0 && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                    <p className="text-sm font-medium text-amber-900">
                      {formatNumber(audienceStats.missingConsentCount)} recipient
                      {audienceStats.missingConsentCount === 1 ? "" : "s"} missing
                      consent timestamp
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      These contacts will still receive the message. Confirm you
                      have permission before sending.
                    </p>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-3">
                  <dt className="text-gray-600">Estimated SMS segments</dt>
                  <dd className="font-medium text-gray-900">
                    {formatNumber(composedSmsStats.segments)} per recipient
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Estimated message usage</dt>
                  <dd className="font-medium text-gray-900">
                    {formatNumber(estimatedUsage)} total segments
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">Unable to load list details.</p>
            )}

            <ComplianceReminder />
          </Card>

          <div className="space-y-4">
            <MessagePreviewBubble body={composedBody} />
            <p className="text-xs text-gray-500">
              Preview includes your compliance footer, which is added
              automatically before send.
            </p>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex gap-3">
          <Button type="button" onClick={goNext}>
            Continue to send options
          </Button>
          <Button type="button" variant="secondary" onClick={goBack}>
            Back
          </Button>
        </div>
      )}

      {step === "send" && (
        <Card className="max-w-xl space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Send options</h2>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-900">{name}</p>
            <p className="mt-1 text-gray-600">
              To: {selectedList?.name ?? "Selected list"}
              {audienceStats &&
                ` · ${formatNumber(audienceStats.willSendCount)} recipients`}
            </p>
            {audienceStats && composedSmsStats.segments > 0 && (
              <p className="mt-1 text-gray-600">
                Estimated usage: {formatNumber(estimatedUsage)} SMS segments
                (includes compliance footer)
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="scheduled-at"
              className="block text-sm font-medium text-gray-700"
            >
              Schedule for later (optional)
            </label>
            <input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="form-input"
            />
          </div>

          <ComplianceReminder />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => submit("draft")}
            >
              Save as draft
            </Button>
            {scheduledAt ? (
              <Button
                type="button"
                disabled={isPending || !twilioConfigured}
                onClick={requestSchedule}
              >
                {isPending ? "Scheduling…" : "Schedule message"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending || !twilioConfigured}
                onClick={requestSend}
              >
                Send now
              </Button>
            )}
          </div>

          <Button type="button" variant="ghost" onClick={goBack}>
            Back
          </Button>
        </Card>
      )}

      <SendConfirmationModal
        open={showSendConfirm}
        recipientCount={audienceStats?.willSendCount ?? 0}
        segments={composedSmsStats.segments}
        isPending={isPending}
        onConfirm={() => submit("send")}
        onCancel={() => setShowSendConfirm(false)}
      />

      <p className="text-center text-sm text-gray-500">
        <Link
          href="/messages"
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to Messages
        </Link>
      </p>
    </div>
  );
}
