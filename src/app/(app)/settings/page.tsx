import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TagsManager } from "@/components/tags/tags-manager";
import { ComplianceSettingsForm } from "@/components/settings/compliance-settings-form";
import { TwilioSettingsForm } from "@/components/settings/twilio-settings-form";
import { requirePagePermission } from "@/lib/auth/authorization";
import { roleHasPermission } from "@/lib/auth/permissions";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { getTags } from "@/lib/queries/tags";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";
import { getTwilioSettings } from "@/lib/queries/twilio-settings";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const ctx = await requirePagePermission("manage_settings");
  const workspace = ctx.workspace;
  const user = ctx.user;
  const [tags, complianceSettings, twilioSettings] = await Promise.all([
    getTags(workspace.id),
    getComplianceSettings(workspace.id),
    getTwilioSettings(workspace.id),
  ]);
  const canManageTeam = roleHasPermission(ctx.role, "manage_team");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your workspace, compliance text, tags, and account settings."
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Workspace</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your workspace name and details
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="workspace-name"
                className="block text-sm font-medium text-gray-700"
              >
                Workspace name
              </label>
              <input
                id="workspace-name"
                type="text"
                defaultValue={workspace.name}
                readOnly
                className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plan
              </label>
              <p className="mt-1 text-sm capitalize text-gray-900">
                {workspace.plan}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Compliance</h2>
          <p className="mt-1 text-sm text-gray-500">
            Business details, legal links, and default message compliance text
          </p>
          <div className="mt-4">
            <ComplianceSettingsForm settings={complianceSettings} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Phone Number</h2>
          <p className="mt-1 text-sm text-gray-500">
            The Twilio number used for inbound SMS routing and outbound sending
            for this workspace
          </p>
          <div className="mt-4">
            <TwilioSettingsForm settings={twilioSettings} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="mt-1 text-sm text-gray-500">
            Workspace members, roles, and invitations
          </p>
          {canManageTeam ? (
            <Button href="/settings/team" variant="secondary" size="sm" className="mt-4">
              Manage team
            </Button>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Team management is available to workspace members from the team page.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your personal account settings
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="user-name"
                className="block text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <input
                id="user-name"
                type="text"
                defaultValue={user?.name ?? ""}
                readOnly
                className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <div>
              <label
                htmlFor="user-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="user-email"
                type="email"
                defaultValue={user?.email ?? ""}
                readOnly
                className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
              />
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            {isClerkConfigured()
              ? "Signed in with Clerk. Password reset is available from the sign-in page."
              : "Mock session auth is active. Add Clerk keys to .env for production auth."}
          </p>
        </Card>

        <Card>
          <TagsManager tags={tags} />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="mt-1 text-sm text-gray-500">
            Permanently delete your workspace and all data
          </p>
          <p className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Workspace deletion is not available in the app yet. Contact support
            to remove a workspace.
          </p>
        </Card>
      </div>
    </>
  );
}
