"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { addContactsToListAction } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { FormActionError } from "@/components/ui/form-action-error";
import { getActionError } from "@/lib/actions/action-result";
import { contactStatusBadge } from "@/components/ui/badge";
import { formatContactName } from "@/lib/validation/phone";
import { formatPhone } from "@/lib/utils";
import type { Contact } from "@prisma/client";

type AddContactsFormProps = {
  listId: string;
  contacts: Contact[];
  initialQuery?: string;
};

export function AddContactsForm({
  listId,
  contacts,
  initialQuery = "",
}: AddContactsFormProps) {
  const [state, formAction] = useFormState(addContactsToListAction, null);
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = contacts.filter((contact) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const phone = contact.phone.replace(/\D/g, "");
    const name = formatContactName(contact.firstName, contact.lastName).toLowerCase();
    return (
      name.includes(q) ||
      contact.phone.includes(q) ||
      phone.includes(q.replace(/\D/g, "")) ||
      (contact.email?.toLowerCase().includes(q) ?? false)
    );
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="listId" value={listId} />

      <FormActionError error={getActionError(state)} />

      <input
        type="search"
        placeholder="Search contacts by name, phone, or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-500">
          All contacts are already on this list, or you have no contacts yet.{" "}
          <a href="/contacts/new" className="text-brand-600 hover:text-brand-700">
            Add a contact
          </a>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No contacts match your search.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={
                  filtered.length > 0 && selected.size === filtered.length
                }
                onChange={toggleAll}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Select all ({filtered.length})
            </label>
            <span className="text-sm text-gray-500">
              {selected.size} selected
            </span>
          </div>

          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {filtered.map((contact) => {
              const name = formatContactName(
                contact.firstName,
                contact.lastName
              );
              return (
                <li key={contact.id} className="flex items-center gap-3 p-4">
                  <input
                    type="checkbox"
                    name="contactIds"
                    value={contact.id}
                    checked={selected.has(contact.id)}
                    onChange={() => toggle(contact.id)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {name === "—" ? "Unnamed contact" : name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPhone(contact.phone)}
                      {contact.email ? ` · ${contact.email}` : ""}
                    </p>
                  </div>
                  {contactStatusBadge(contact.status)}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={selected.size === 0}>
          Add {selected.size > 0 ? selected.size : ""} to List
        </Button>
        <Button type="button" variant="secondary" href={`/lists/${listId}`}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
