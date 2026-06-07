"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setSession, clearSession } from "@/lib/auth/session";
import { DEMO_USER_EMAIL } from "@/lib/auth/constants";
import { isLegacyAuthAllowed } from "@/lib/production-guards";

function legacyAuthBlocked() {
  return {
    error:
      "Password login is disabled. Use Clerk sign-in or run locally without Clerk keys for development.",
  };
}

export async function loginAction(formData: FormData) {
  if (!isLegacyAuthAllowed()) {
    return legacyAuthBlocked();
  }
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  if (!password) {
    return { error: "Password is required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    if (email === DEMO_USER_EMAIL) {
      return {
        error: "Demo account not found. Run `npm run db:seed` first.",
      };
    }
    return { error: "No account found with that email. Sign up instead." };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return { error: "No workspace found for this account." };
  }

  await setSession({ userId: user.id, workspaceId: membership.workspaceId });
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  if (!isLegacyAuthAllowed()) {
    return legacyAuthBlocked();
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: { email, name },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: `${name.split(" ")[0]}'s Workspace`,
      ownerId: user.id,
      plan: "starter",
      members: {
        create: { userId: user.id, role: "owner", canCreateMessages: true },
      },
      billingAccount: {
        create: {
          plan: "starter",
          status: "trialing",
        },
      },
    },
  });

  await setSession({ userId: user.id, workspaceId: workspace.id });
  redirect("/dashboard");
}

export async function loginFormAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  return (await loginAction(formData)) ?? null;
}

export async function signupFormAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  return (await signupAction(formData)) ?? null;
}

export async function logoutAction() {
  await clearSession();
  redirect("/sign-in");
}
