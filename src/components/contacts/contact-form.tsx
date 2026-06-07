"use client";

import { useFormState } from "react-dom";
import {
  createContactAction,
  updateContactAction,
} from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";
import { ComplianceNotice } from "@/components/contacts/compliance-notice";
import type { ContactStatus, ContactSource } from "@prisma/client";

type ListOption = { id: string; name: string };
type TagOption = { id: string; name: string; color: string };

type ContactFormProps = {
  mode: "create" | "edit";
  lists: ListOption[];
  tags: TagOption[];
  defaultValues?: {
    contactId?: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string;
    email?: string | null;
    status?: ContactStatus;
    source?: ContactSource;
    consentTimestamp?: Date | null;
    listIds?: string[];
    tagIds?: string[];
  };
};

export function ContactForm({
  mode,
  lists,
  tags,
  defaultValues,
}: ContactFormProps) {
  const action = mode === "create" ? createContactAction : updateContactAction;
  const [state, formAction] = useFormState(action, null);

  const selectedListIds = new Set(defaultValues?.listIds ?? []);
  const selectedTagIds = new Set(defaultValues?.tagIds ?? []);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && defaultValues?.contactId && (
        <input type="hidden" name="contactId" value={defaultValues.contactId} />
      )}

      <FormActionError error={getActionError(state)} />

      <ComplianceNotice />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            defaultValue={defaultValues?.firstName ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            defaultValue={defaultValues?.lastName ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={defaultValues?.phone ?? ""}
            placeholder="(555) 123-4567"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            placeholder="optional@email.com"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
          className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="active">Active</option>
          <option value="opted_out">Opted out</option>
          <option value="invalid">Invalid</option>
        </select>
      </div>

      {lists.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Lists</legend>
          <div className="mt-2 space-y-2">
            {lists.map((list) => (
              <label key={list.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="listIds"
                  value={list.id}
                  defaultChecked={selectedListIds.has(list.id)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                {list.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {tags.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Tags</legend>
          <div className="mt-2 space-y-2">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={selectedTagIds.has(tag.id)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                {tag.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            required
            defaultChecked={!!defaultValues?.consentTimestamp}
            className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">
            I confirm this contact gave permission to receive text messages from
            my business.
          </span>
        </label>
      </div>

      {mode === "edit" && defaultValues?.source && (
        <p className="text-sm text-gray-500">
          Source:{" "}
          <span className="capitalize">{defaultValues.source.replace("_", " ")}</span>
          {defaultValues.consentTimestamp && (
            <>
              {" "}
              · Consent recorded{" "}
              {new Date(defaultValues.consentTimestamp).toLocaleDateString()}
            </>
          )}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit">
          {mode === "create" ? "Add Contact" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          href={
            mode === "edit" && defaultValues?.contactId
              ? `/contacts/${defaultValues.contactId}`
              : "/contacts"
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
