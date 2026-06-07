"use client";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

type SendConfirmationModalProps = {
  open: boolean;
  recipientCount: number;
  segments: number;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SendConfirmationModal({
  open,
  recipientCount,
  segments,
  isPending,
  onConfirm,
  onCancel,
}: SendConfirmationModalProps) {
  if (!open) return null;

  const estimatedUsage = recipientCount * segments;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-confirm-title"
    >
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2
          id="send-confirm-title"
          className="text-lg font-semibold text-gray-900"
        >
          Confirm send
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          You are about to send this text to{" "}
          <strong className="font-semibold text-gray-900">
            {formatNumber(recipientCount)} contact
            {recipientCount === 1 ? "" : "s"}
          </strong>
          .
        </p>
        {segments > 1 && (
          <p className="mt-2 text-sm text-gray-600">
            Estimated usage:{" "}
            <strong className="font-semibold text-gray-900">
              {formatNumber(estimatedUsage)} SMS segments
            </strong>{" "}
            ({formatNumber(segments)} segments × {formatNumber(recipientCount)}{" "}
            recipients).
          </p>
        )}
        <p className="mt-3 text-xs text-amber-800">
          This will send real SMS messages through Twilio and may incur charges.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Sending…" : "Send now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
