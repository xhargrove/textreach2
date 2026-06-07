import { Suspense } from "react";
import type { ContactSource, ContactStatus } from "@prisma/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ComplianceNotice } from "@/components/contacts/compliance-notice";
import { ContactsToolbar } from "@/components/contacts/contacts-toolbar";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { TagsManager } from "@/components/tags/tags-manager";
import { requirePagePermission } from "@/lib/auth/authorization";
import {
  canManageTags,
  getPagePermissions,
} from "@/lib/auth/page-permissions";
import { searchContacts } from "@/lib/queries/contacts";
import { getTags } from "@/lib/queries/tags";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Contacts",
};

type PageProps = {
  searchParams: {
    q?: string;
    status?: string;
    source?: string;
  };
};

export default async function ContactsPage({ searchParams }: PageProps) {
  const ctx = await requirePagePermission("view_contacts");
  const perms = getPagePermissions(ctx);
  const canEditTags = canManageTags(ctx);

  const filters = {
    q: searchParams.q,
    status: searchParams.status as ContactStatus | undefined,
    source: searchParams.source as ContactSource | undefined,
  };

  const [contacts, totalCount, tags] = await Promise.all([
    searchContacts(ctx.workspaceId, filters),
    prisma.contact.count({ where: { workspaceId: ctx.workspaceId } }),
    getTags(ctx.workspaceId),
  ]);

  return (
    <>
      <PageHeader
        title="Contacts"
        description="People you text — add them one at a time or import a CSV file."
        action={
          perms.canManageContacts ? (
            <div className="flex gap-2">
              <Button href="/contacts/import" variant="secondary">
                Import CSV
              </Button>
              <Button href="/contacts/new">Add Contact</Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6">
        <ComplianceNotice />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2">
          {totalCount > 0 && (
            <Suspense
              fallback={
                <div className="mb-6 h-10 animate-pulse rounded-lg bg-gray-100" />
              }
            >
              <ContactsToolbar />
            </Suspense>
          )}

          {totalCount === 0 ? (
            <EmptyState
              title="No contacts yet"
              description="Add your first contact or import a CSV to start building your list."
              actionLabel={perms.canManageContacts ? "Add Contact" : undefined}
              actionHref={perms.canManageContacts ? "/contacts/new" : undefined}
            />
          ) : contacts.length === 0 ? (
            <EmptyState
              title="No matching contacts"
              description="Try adjusting your search or filters to find what you're looking for."
            />
          ) : (
            <ContactsTable
              contacts={contacts}
              canManageContacts={perms.canManageContacts}
            />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <Card>
            <TagsManager tags={tags} compact readOnly={!canEditTags} />
          </Card>
        </div>
      </div>
    </>
  );
}
