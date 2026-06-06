import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your workspace and account"
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
                defaultValue="My Business"
                className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button size="sm">Save changes</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">
            Phone Number
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            The number your messages are sent from
          </p>
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Twilio phone number provisioning coming in Phase 2
            </p>
          </div>
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
                defaultValue="Jane Smith"
                className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                defaultValue="jane@company.com"
                className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button size="sm">Save changes</Button>
          </div>
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Authentication via Clerk coming in Phase 2
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="mt-1 text-sm text-gray-500">
            Permanently delete your workspace and all data
          </p>
          <Button variant="danger" size="sm" className="mt-4">
            Delete workspace
          </Button>
        </Card>
      </div>
    </>
  );
}
