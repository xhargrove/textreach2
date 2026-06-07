import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth/session";
import { DEMO_USER_EMAIL } from "@/lib/auth/constants";

export async function createDemoSession() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: {
      memberships: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });

  if (!user || user.memberships.length === 0) {
    return false;
  }

  await setSession({
    userId: user.id,
    workspaceId: user.memberships[0].workspaceId,
  });

  return true;
}

export async function demoLoginAction() {
  const ok = await createDemoSession();
  if (!ok) {
    redirect("/sign-in?error=seed-required");
  }
  redirect("/dashboard");
}
