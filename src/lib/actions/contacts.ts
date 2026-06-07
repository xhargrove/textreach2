"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ContactStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import {
  getContactById,
  isDuplicatePhone,
} from "@/lib/queries/contacts";
import {
  checkContactLimit,
} from "@/lib/billing/limits";
import {
  normalizePhone,
  isValidEmail,
} from "@/lib/validation/phone";
import {
  actionFailure,
  guardFormAction,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";
import { requireMutationCount } from "@/lib/db/workspace-mutations";

type ActionResult = ActionFailure | null;

async function requireWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_contacts");
  return ctx.workspaceId;
}

function parseContactForm(formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim() || null;
  const lastName = (formData.get("lastName") as string)?.trim() || null;
  const phoneRaw = formData.get("phone") as string;
  const emailRaw = (formData.get("email") as string)?.trim() || null;
  const status = formData.get("status") as ContactStatus;
  const consent = formData.get("consent") === "on";
  const listIds = formData.getAll("listIds") as string[];
  const tagIds = formData.getAll("tagIds") as string[];

  return {
    firstName,
    lastName,
    phoneRaw,
    emailRaw,
    status,
    consent,
    listIds,
    tagIds,
  };
}

async function validateContactInput(
  workspaceId: string,
  data: ReturnType<typeof parseContactForm>,
  excludeContactId?: string
): Promise<
  | {
      ok: true;
      phone: string;
      email: string | null;
      consentTimestamp: Date | null;
    }
  | { ok: false; error: string }
> {
  const phoneResult = normalizePhone(data.phoneRaw);
  if (!phoneResult.ok) {
    return { ok: false, error: phoneResult.error };
  }

  if (data.emailRaw && !isValidEmail(data.emailRaw)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  if (!data.consent) {
    return {
      ok: false,
      error: "You must confirm this contact gave permission to receive texts",
    };
  }

  const duplicate = await isDuplicatePhone(
    workspaceId,
    phoneResult.phone,
    excludeContactId
  );
  if (duplicate) {
    return {
      ok: false,
      error: "A contact with this phone number already exists in your workspace",
    };
  }

  const validStatuses: ContactStatus[] = ["active", "opted_out", "invalid"];
  if (!validStatuses.includes(data.status)) {
    return { ok: false, error: "Invalid status" };
  }

  return {
    ok: true,
    phone: phoneResult.phone,
    email: data.emailRaw,
    consentTimestamp: new Date(),
  };
}

async function validateListAndTagIds(
  workspaceId: string,
  listIds: string[],
  tagIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (listIds.length > 0) {
    const listCount = await prisma.list.count({
      where: { id: { in: listIds }, workspaceId },
    });
    if (listCount !== listIds.length) {
      return { ok: false, error: "One or more selected lists are invalid" };
    }
  }

  if (tagIds.length > 0) {
    const tagCount = await prisma.tag.count({
      where: { id: { in: tagIds }, workspaceId },
    });
    if (tagCount !== tagIds.length) {
      return { ok: false, error: "One or more selected tags are invalid" };
    }
  }

  return { ok: true };
}

async function syncContactLists(
  workspaceId: string,
  contactId: string,
  listIds: string[]
) {
  await prisma.listContact.deleteMany({
    where: {
      contactId,
      contact: { workspaceId },
    },
  });
  if (listIds.length > 0) {
    await prisma.listContact.createMany({
      data: listIds.map((listId) => ({ contactId, listId })),
      skipDuplicates: true,
    });
  }
}

async function syncContactTags(
  workspaceId: string,
  contactId: string,
  tagIds: string[]
) {
  await prisma.contactTag.deleteMany({
    where: {
      contactId,
      contact: { workspaceId },
    },
  });
  if (tagIds.length > 0) {
    await prisma.contactTag.createMany({
      data: tagIds.map((tagId) => ({ contactId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function createContactAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const data = parseContactForm(formData);
    const validated = await validateContactInput(workspaceId, data);

    if (!validated.ok) {
      return actionFailure(validated.error);
    }

    const relations = await validateListAndTagIds(
      workspaceId,
      data.listIds,
      data.tagIds
    );
    if (!relations.ok) {
      return actionFailure(relations.error);
    }

    const limitCheck = await checkContactLimit(workspaceId, 1);
    if (!limitCheck.ok) {
      return actionFailure(limitCheck.error);
    }

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: validated.phone,
        email: validated.email,
        status: data.status,
        source: "manual",
        consentStatus: "subscribed",
        consentSource: "manual",
        consentTimestamp: validated.consentTimestamp,
        listContacts: data.listIds.length
          ? { create: data.listIds.map((listId) => ({ listId })) }
          : undefined,
        contactTags: data.tagIds.length
          ? { create: data.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    });

    revalidatePath("/contacts");
    redirect(`/contacts/${contact.id}`);
  });
}

export async function updateContactAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const contactId = formData.get("contactId") as string;

    if (!contactId) {
      return actionFailure("Contact not found");
    }

    const existing = await getContactById(workspaceId, contactId);
    if (!existing) {
      return actionFailure("Contact not found");
    }

    const data = parseContactForm(formData);
    const validated = await validateContactInput(workspaceId, data, contactId);

    if (!validated.ok) {
      return actionFailure(validated.error);
    }

    const relations = await validateListAndTagIds(
      workspaceId,
      data.listIds,
      data.tagIds
    );
    if (!relations.ok) {
      return actionFailure(relations.error);
    }

    const consentTimestamp =
      existing.consentTimestamp && data.consent
        ? existing.consentTimestamp
        : validated.consentTimestamp;

    const consentUpdate =
      data.status === "opted_out"
        ? {
            consentStatus: "unsubscribed" as const,
            consentTimestamp: null,
            optedOutAt: existing.optedOutAt ?? new Date(),
          }
        : data.consent && consentTimestamp
          ? {
              consentStatus: "subscribed" as const,
              consentSource: existing.consentSource ?? "manual",
              consentTimestamp,
              optedOutAt: null,
            }
          : { consentTimestamp };

    const updated = await prisma.contact.updateMany({
      where: { id: contactId, workspaceId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: validated.phone,
        email: validated.email,
        status: data.status,
        ...consentUpdate,
      },
    });

    const check = requireMutationCount(updated, "Contact");
    if (!check.ok) return actionFailure(check.error);

    await syncContactLists(workspaceId, contactId, data.listIds);
    await syncContactTags(workspaceId, contactId, data.tagIds);

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contactId}`);
    redirect(`/contacts/${contactId}`);
  });
}

export async function deleteContactSimpleAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const contactId = formData.get("contactId") as string;
    if (!contactId) {
      redirect("/contacts?error=not_found");
    }

    const deleted = await prisma.contact.deleteMany({
      where: { id: contactId, workspaceId },
    });

    if (deleted.count === 0) {
      redirect("/contacts?error=not_found");
    }

    revalidatePath("/contacts");
    redirect("/contacts");
  });
}
