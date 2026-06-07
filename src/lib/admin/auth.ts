import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/authorization";

export function getPlatformAdminEmails(): Set<string> {
  const raw = process.env.TEXTREACH_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requirePlatformAdmin() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const admins = getPlatformAdminEmails();
  if (
    admins.size === 0 ||
    !admins.has(ctx.user.email.trim().toLowerCase())
  ) {
    redirect("/dashboard?error=forbidden");
  }

  return ctx;
}
