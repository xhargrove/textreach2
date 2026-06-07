import { redirect } from "next/navigation";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/auth/errors";
import { QuietHoursBlockedError } from "@/lib/compliance/quiet-hours";

export type ActionFailure = { ok: false; error: string };

export function actionFailure(error: string): ActionFailure {
  return { ok: false, error };
}

export function isNextNavigationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: string }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

export function catchActionError(error: unknown): ActionFailure {
  if (error instanceof ForbiddenError) {
    return actionFailure(error.message);
  }
  if (error instanceof UnauthorizedError) {
    return actionFailure(error.message);
  }
  if (error instanceof QuietHoursBlockedError) {
    return actionFailure(error.message);
  }
  console.error("Unexpected action error:", error);
  return actionFailure("Something went wrong. Please try again.");
}

export async function runAction<T>(
  fn: () => Promise<T>
): Promise<T | ActionFailure> {
  try {
    return await fn();
  } catch (error) {
    if (isNextNavigationError(error)) throw error;
    return catchActionError(error);
  }
}

export async function guardFormAction(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    if (isNextNavigationError(error)) throw error;
    if (error instanceof ForbiddenError) redirect("/forbidden");
    if (error instanceof UnauthorizedError) {
      redirect("/sign-in");
    }
    throw error;
  }
}

export function getActionError(
  result: { ok?: boolean; error?: string; success?: string } | null | undefined
): string | null {
  if (!result) return null;
  if (result.ok === false && result.error) return result.error;
  if ("error" in result && result.error) return result.error;
  return null;
}
