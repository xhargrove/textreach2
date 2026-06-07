"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { getContactById } from "@/lib/queries/contacts";
import { getTagById, isTagNameTaken, TAG_COLORS } from "@/lib/queries/tags";
import {
  actionFailure,
  guardFormAction,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";
import { requireMutationCount } from "@/lib/db/workspace-mutations";

type ActionResult = ActionFailure | { success?: string } | null;

async function requireWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_settings");
  return ctx.workspaceId;
}

function parseTagForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string)?.trim() || TAG_COLORS[0];
  return { name, color };
}

export async function createTagAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const { name, color } = parseTagForm(formData);

    if (!name) return actionFailure("Tag name is required");

    if (await isTagNameTaken(workspaceId, name)) {
      return actionFailure("A tag with this name already exists");
    }

    await prisma.tag.create({
      data: { workspaceId, name, color },
    });

    revalidatePath("/contacts");
    revalidatePath("/settings");
    return { success: `Tag "${name}" created` };
  });
}

export async function updateTagAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const tagId = formData.get("tagId") as string;
    const { name, color } = parseTagForm(formData);

    if (!tagId) return actionFailure("Tag not found");
    if (!name) return actionFailure("Tag name is required");

    if (await isTagNameTaken(workspaceId, name, tagId)) {
      return actionFailure("A tag with this name already exists");
    }

    const updated = await prisma.tag.updateMany({
      where: { id: tagId, workspaceId },
      data: { name, color },
    });

    const check = requireMutationCount(updated, "Tag");
    if (!check.ok) return actionFailure(check.error);

    revalidatePath("/contacts");
    revalidatePath("/settings");
    revalidatePath(`/contacts`);
    return { success: `Tag "${name}" updated` };
  });
}

export async function deleteTagSimpleAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const tagId = formData.get("tagId") as string;
    if (!tagId) return;

    const deleted = await prisma.tag.deleteMany({
      where: { id: tagId, workspaceId },
    });

    if (deleted.count === 0) return;

    revalidatePath("/contacts");
    revalidatePath("/settings");
  });
}

export async function assignTagToContactAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const contactId = formData.get("contactId") as string;
    const tagId = formData.get("tagId") as string;

    if (!contactId || !tagId) return;

    const [contact, tag] = await Promise.all([
      getContactById(workspaceId, contactId),
      getTagById(workspaceId, tagId),
    ]);

    if (!contact || !tag) return;

    await prisma.contactTag.createMany({
      data: [{ contactId, tagId }],
      skipDuplicates: true,
    });

    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/contacts");
  });
}

export async function removeTagFromContactAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const contactId = formData.get("contactId") as string;
    const tagId = formData.get("tagId") as string;

    if (!contactId || !tagId) return;

    const removed = await prisma.contactTag.deleteMany({
      where: {
        contactId,
        tagId,
        contact: { workspaceId },
        tag: { workspaceId },
      },
    });

    if (removed.count === 0) return;

    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/contacts");
  });
}

export async function createTagAndAssignAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const contactId = formData.get("contactId") as string;
    const { name, color } = parseTagForm(formData);

    if (!contactId) return actionFailure("Contact not found");
    if (!name) return actionFailure("Tag name is required");

    const contact = await getContactById(workspaceId, contactId);
    if (!contact) return actionFailure("Contact not found");

    let tag = await prisma.tag.findFirst({
      where: { workspaceId, name: { equals: name, mode: "insensitive" } },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { workspaceId, name, color },
      });
    }

    await prisma.contactTag.createMany({
      data: [{ contactId, tagId: tag.id }],
      skipDuplicates: true,
    });

    revalidatePath(`/contacts/${contactId}`);
    revalidatePath("/contacts");
    revalidatePath("/settings");
    return { success: `Tag "${tag.name}" assigned` };
  });
}
