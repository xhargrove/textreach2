import { AppLayout } from "@/components/layout/app-layout";
import { AppWorkspaceBar } from "@/components/layout/app-workspace-bar";
import { getAuthContext } from "@/lib/auth/authorization";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { listActiveWorkspacesForUser } from "@/lib/auth/active-workspace";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();
  const workspaces = ctx
    ? (await listActiveWorkspacesForUser(ctx.userId)).map((membership) => ({
        id: membership.workspaceId,
        name: membership.workspace.name,
        role: membership.role,
      }))
    : [];

  return (
    <AppLayout role={ctx?.role ?? null}>
      {ctx?.workspace && (
        <AppWorkspaceBar
          workspaceName={ctx.workspace.name}
          userName={ctx.user.name ?? ctx.user.email}
          useClerk={isClerkConfigured()}
          workspaces={workspaces}
          activeWorkspaceId={ctx.workspaceId}
        />
      )}
      {children}
    </AppLayout>
  );
}
