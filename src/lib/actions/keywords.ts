"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { KeywordStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import {
  isKeywordTaken,
} from "@/lib/queries/keywords";
import { validateKeyword } from "@/lib/validation/keyword";
import { getListById } from "@/lib/queries/lists";
import { checkKeywordLimit } from "@/lib/billing/limits";
import {
  actionFailure,
  guardFormAction,
  runAction,
  type ActionFailure,
} from "@/lib/actions/action-result";
import { requireMutationCount } from "@/lib/db/workspace-mutations";

type ActionResult = ActionFailure | null;

async function requireWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_keywords");
  return ctx.workspaceId;
}

function parseKeywordForm(formData: FormData) {
  return {
    keyword: (formData.get("keyword") as string) ?? "",
    listId: (formData.get("listId") as string)?.trim() || null,
    autoReply: (formData.get("autoReply") as string)?.trim() || null,
    status: (formData.get("status") as KeywordStatus) || "active",
  };
}

async function validateKeywordForm(
  workspaceId: string,
  data: ReturnType<typeof parseKeywordForm>,
  excludeId?: string
): Promise<string | null> {
  const keywordResult = validateKeyword(data.keyword);
  if (!keywordResult.ok) return keywordResult.error;

  if (await isKeywordTaken(workspaceId, keywordResult.keyword, excludeId)) {
    return "This keyword is already in use";
  }

  if (data.listId) {
    const list = await getListById(workspaceId, data.listId);
    if (!list) return "Selected list not found";
  }

  if (!data.autoReply?.trim()) {
    return "Auto-reply message is required";
  }

  return null;
}

export async function createKeywordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const data = parseKeywordForm(formData);
    const keywordResult = validateKeyword(data.keyword);
    if (!keywordResult.ok) return actionFailure(keywordResult.error);

    const validationError = await validateKeywordForm(workspaceId, data);
    if (validationError) return actionFailure(validationError);

    const limitCheck = await checkKeywordLimit(workspaceId);
    if (!limitCheck.ok) {
      return actionFailure(limitCheck.error);
    }

    const keyword = await prisma.keyword.create({
      data: {
        workspaceId,
        keyword: keywordResult.keyword,
        listId: data.listId,
        autoReply: data.autoReply,
        status: data.status === "inactive" ? "inactive" : "active",
      },
    });

    revalidatePath("/keywords");
    revalidatePath("/dashboard");
    redirect(`/keywords/${keyword.id}`);
  });
}

export async function updateKeywordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const keywordId = formData.get("keywordId") as string;
    const data = parseKeywordForm(formData);

    if (!keywordId) return actionFailure("Keyword not found");

    const keywordResult = validateKeyword(data.keyword);
    if (!keywordResult.ok) return actionFailure(keywordResult.error);

    const validationError = await validateKeywordForm(
      workspaceId,
      data,
      keywordId
    );
    if (validationError) return actionFailure(validationError);

    const updated = await prisma.keyword.updateMany({
      where: { id: keywordId, workspaceId },
      data: {
        keyword: keywordResult.keyword,
        listId: data.listId,
        autoReply: data.autoReply,
        status: data.status === "inactive" ? "inactive" : "active",
      },
    });

    const check = requireMutationCount(updated, "Keyword");
    if (!check.ok) return actionFailure(check.error);

    revalidatePath("/keywords");
    revalidatePath(`/keywords/${keywordId}`);
    revalidatePath("/dashboard");
    redirect(`/keywords/${keywordId}`);
  });
}

export async function deleteKeywordSimpleAction(formData: FormData) {
  await guardFormAction(async () => {
    const workspaceId = await requireWorkspaceId();
    const keywordId = formData.get("keywordId") as string;
    if (!keywordId) {
      redirect("/keywords?error=not_found");
    }

    const deleted = await prisma.keyword.deleteMany({
      where: { id: keywordId, workspaceId },
    });

    if (deleted.count === 0) {
      redirect("/keywords?error=not_found");
    }

    revalidatePath("/keywords");
    revalidatePath("/dashboard");
    redirect("/keywords");
  });
}
