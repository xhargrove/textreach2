import { PageHeader } from "@/components/ui/page-header";
import { CreateMessageWizard } from "@/components/messages/create-message-wizard";
import { requirePageCanCreateMessages } from "@/lib/auth/authorization";
import { getListsWithCounts } from "@/lib/queries/lists";
import { getComplianceSettings } from "@/lib/queries/compliance-settings";

export const metadata = {
  title: "New Message",
};

export default async function NewMessagePage() {
  const ctx = await requirePageCanCreateMessages();
  const workspace = ctx.workspace;
  const [lists, complianceSettings] = await Promise.all([
    getListsWithCounts(workspace.id),
    getComplianceSettings(workspace.id),
  ]);

  const listOptions = lists.map((list) => ({
    id: list.id,
    name: list.name,
    contactCount: list._count.listContacts,
  }));

  return (
    <>
      <PageHeader
        title="New Message"
        description="Choose a list, write your message, review, and send or schedule"
      />
      <CreateMessageWizard
        lists={listOptions}
        complianceFooter={complianceSettings.defaultComplianceFooter}
      />
    </>
  );
}
