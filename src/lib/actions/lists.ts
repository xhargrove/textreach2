"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { getListById, isListNameTaken } from "@/lib/queries/lists";
import {
  actionFailure,
  guardFormAction,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";
import { requireMutationCount } from "@/lib/db/workspace-mutations";

type ActionResult = ActionFailure | { success?: string } | null;

async function requireWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_lists");
  return ctx.workspaceId;
}

function parseListForm(formData: FormData) {
  return {
    name: (formData.get("name") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || null,
  };
}

export async function createListAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const { name, description } = parseListForm(formData);

    if (!name) return actionFailure("List name is required");

    if (await isListNameTaken(workspaceId, name)) {
      return actionFailure("A list with this name already exists");
    }

    const list = await prisma.list.create({
      data: { workspaceId, name, description },
    });

    revalidatePath("/lists");
    redirect(`/lists/${list.id}`);
  });
}

export async function updateListAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const listId = formData.get("listId") as string;
    const { name, description } = parseListForm(formData);

    if (!listId) return actionFailure("List not found");
    if (!name) return actionFailure("List name is required");

    if (await isListNameTaken(workspaceId, name, listId)) {
      return actionFailure("A list with this name already exists");
    }

    const updated = await prisma.list.updateMany({
      where: { id: listId, workspaceId },
      data: { name, description },
    });

    const check = requireMutationCount(updated, "List");
    if (!check.ok) return actionFailure(check.error);

    revalidatePath("/lists");
    revalidatePath(`/lists/${listId}`);
    redirect(`/lists/${listId}`);
  });
}

export async function deleteListSimpleAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const listId = formData.get("listId") as string;
    if (!listId) {
      redirect("/lists?error=not_found");
    }

    const deleted = await prisma.list.deleteMany({
      where: { id: listId, workspaceId },
    });

    if (deleted.count === 0) {
      redirect("/lists?error=not_found");
    }

    revalidatePath("/lists");
    redirect("/lists");
  });
}

export async function addContactsToListAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const listId = formData.get("listId") as string;
    const contactIds = formData.getAll("contactIds") as string[];

    if (!listId) return actionFailure("List not found");

    const list = await getListById(workspaceId, listId);
    if (!list) return actionFailure("List not found");

    if (contactIds.length === 0) {
      return actionFailure("Select at least one contact to add");
    }

    const validContacts = await prisma.contact.findMany({
      where: { workspaceId, id: { in: contactIds } },
      select: { id: true },
    });

    const ids = validContacts.map((c) => c.id);

    await prisma.listContact.createMany({
      data: ids.map((contactId) => ({ listId, contactId })),
      skipDuplicates: true,
    });

    revalidatePath(`/lists/${listId}`);
    revalidatePath("/contacts");
    redirect(`/lists/${listId}?success=added&count=${ids.length}`);
  });
}

export async function removeContactFromListAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const listId = formData.get("listId") as string;
    const contactId = formData.get("contactId") as string;

    if (!listId || !contactId) return;

    const removed = await prisma.listContact.deleteMany({
      where: {
        listId,
        contactId,
        list: { workspaceId },
        contact: { workspaceId },
      },
    });

    if (removed.count === 0) return;

    revalidatePath(`/lists/${listId}`);
    revalidatePath("/contacts");
  });
}
