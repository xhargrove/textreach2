import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamMembersTable } from "@/components/settings/team-members-table";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { getWorkspaceMembers } from "@/lib/queries/team";

export const metadata = {
  title: "Team",
};

export default async function TeamSettingsPage() {
  const ctx = await requirePagePermission("manage_team");
  const members = await getWorkspaceMembers(ctx.workspaceId);

  return (
    <>
      <PageHeader
        title="Team"
        description="Manage workspace members and roles"
        action={
          <Button href="/settings" variant="secondary" size="sm">
            Back to settings
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Members</h2>
              <p className="mt-1 text-sm text-gray-500">
                People with access to {ctx.workspace.name}
              </p>
            </div>

            <InviteMemberForm />

            <TeamMembersTable
              members={members}
              currentUserId={ctx.userId}
              canManage
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Role permissions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">Owner</p>
              <p className="mt-1 text-sm text-gray-600">
                Full access, billing, settings, and invites.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">Admin</p>
              <p className="mt-1 text-sm text-gray-600">
                Manage contacts, lists, messages, keywords, inbox, results, and
                team members.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">Member</p>
              <p className="mt-1 text-sm text-gray-600">
                View data. Create messages when enabled by an owner.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-sm text-gray-500">
          Need to change your plan?{" "}
          <Link href="/billing" className="font-medium text-brand-600">
            Go to billing
          </Link>
        </p>
      </div>
    </>
  );
}
