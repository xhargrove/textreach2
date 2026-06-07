import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  contactStatusBadge,
  contactSourceBadge,
  Badge,
  messageStatusBadge,
} from "@/components/ui/badge";
import { ComplianceNotice } from "@/components/contacts/compliance-notice";
import { ContactRowActions } from "@/components/contacts/contact-row-actions";
import { ContactTagsEditor } from "@/components/tags/contact-tags-editor";
import { requirePagePermission } from "@/lib/auth/authorization";
import {
  canManageTags,
  getPagePermissions,
} from "@/lib/auth/page-permissions";
import { getContactDetail } from "@/lib/queries/contacts";
import { getTags } from "@/lib/queries/tags";
import { formatContactName } from "@/lib/validation/phone";
import { formatPhone, formatDate, formatDateTime } from "@/lib/utils";

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: PageProps) {
  const ctx = await requirePagePermission("view_contacts");
  const contact = await getContactDetail(ctx.workspaceId, params.id);
  if (!contact) return { title: "Contact Not Found" };

  const name = formatContactName(contact.firstName, contact.lastName);
  return { title: name === "—" ? "Contact" : name };
}

export default async function ContactDetailPage({ params }: PageProps) {
  const ctx = await requirePagePermission("view_contacts");
  const perms = getPagePermissions(ctx);
  const canEditTags = canManageTags(ctx);
  const [contact, allTags] = await Promise.all([
    getContactDetail(ctx.workspaceId, params.id),
    getTags(ctx.workspaceId),
  ]);

  if (!contact) {
    notFound();
  }

  const name = formatContactName(contact.firstName, contact.lastName);
  const displayName = name === "—" ? "Unnamed contact" : name;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/contacts"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to Contacts
        </Link>
      </div>

      <PageHeader
        title={displayName}
        description={formatPhone(contact.phone)}
        action={
          perms.canManageContacts ? (
            <div className="flex gap-2">
              <Button href={`/contacts/${contact.id}/edit`} variant="secondary">
                Edit
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6">
        <ComplianceNotice />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">
            Contact Details
          </h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {formatPhone(contact.phone)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {contact.email ?? "—"}
              </dd>
            </div>
            <div className="flex gap-6">
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="mt-1">{contactStatusBadge(contact.status)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Source</dt>
                <dd className="mt-1">{contactSourceBadge(contact.source)}</dd>
              </div>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Consent timestamp</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {contact.consentTimestamp
                  ? formatDateTime(contact.consentTimestamp)
                  : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {formatDate(contact.createdAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Lists & Tags</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Lists</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {contact.listContacts.length > 0
                  ? contact.listContacts.map((lc) => (
                      <Badge key={lc.listId}>{lc.list.name}</Badge>
                    ))
                  : "Not on any lists"}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-gray-500">Tags</p>
              <ContactTagsEditor
                contactId={contact.id}
                assignedTags={contact.contactTags.map((ct) => ({
                  id: ct.tag.id,
                  name: ct.tag.name,
                  color: ct.tag.color,
                }))}
                availableTags={allTags.map((t) => ({
                  id: t.id,
                  name: t.name,
                  color: t.color,
                }))}
                readOnly={!canEditTags}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">
            Message History
          </h2>
          {contact.messageRecipients.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No messages sent to this contact yet. Message history will appear
              here once you send texts.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {contact.messageRecipients.map((recipient) => (
                <li key={recipient.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {recipient.message.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {recipient.message.body}
                      </p>
                    </div>
                    {messageStatusBadge(recipient.message.status)}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {recipient.message.sentAt
                      ? formatDateTime(recipient.message.sentAt)
                      : "Not sent yet"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">
            Inbox Conversation
          </h2>
          {contact.inboxMessages.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No replies from this contact yet. Conversations will show here
              when they text you back.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {contact.inboxMessages.map((msg) => (
                <li
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm ${
                    msg.direction === "inbound"
                      ? "bg-gray-50 text-gray-800"
                      : "bg-brand-50 text-brand-900"
                  }`}
                >
                  <p>{msg.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDateTime(msg.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link
              href={`/inbox/${contact.id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View conversation →
            </Link>
          </div>
        </Card>
      </div>

      {perms.canManageContacts && (
        <div className="mt-8 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Manage contact</p>
            <p className="text-xs text-gray-500">Edit details or remove contact</p>
          </div>
          <ContactRowActions
            contactId={contact.id}
            contactName={displayName}
            canManage={perms.canManageContacts}
          />
        </div>
      )}
    </>
  );
}
