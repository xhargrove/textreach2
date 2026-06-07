"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <Alert variant="error" title="Something went wrong">
        <p>
          We couldn&apos;t load this page. Try again, or go back to the dashboard.
        </p>
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button href="/dashboard" variant="secondary">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
