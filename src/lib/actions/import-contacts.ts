"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorization";
import { getListById, isListNameTaken } from "@/lib/queries/lists";
import {
  analyzeCsvRows,
  summarizePreview,
  type AnalyzedCsvRow,
  type ParsedCsvRow,
} from "@/lib/csv/parse-contacts";
import { checkContactLimit } from "@/lib/billing/limits";
import { runAction } from "@/lib/actions/action-result";

const MAX_IMPORT_ROWS = 5000;

async function requireWorkspaceId(): Promise<string> {
  const ctx = await requirePermission("manage_contacts");
  return ctx.workspaceId;
}

async function getExistingPhoneMap(workspaceId: string) {
  const contacts = await prisma.contact.findMany({
    where: { workspaceId },
    select: { id: true, phone: true },
  });
  return new Map(contacts.map((c) => [c.phone, c.id]));
}

export type PreviewImportInput = {
  rows: ParsedCsvRow[];
  listId?: string;
};

export type PreviewImportResult = {
  analyzed: AnalyzedCsvRow[];
  summary: ReturnType<typeof summarizePreview>;
  listName?: string;
};

export async function previewImportAction(
  input: PreviewImportInput
): Promise<{ ok: true; data: PreviewImportResult } | { ok: false; error: string }> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();

    if (input.rows.length === 0) {
      return { ok: false, error: "No rows to import." };
    }

    if (input.rows.length > MAX_IMPORT_ROWS) {
      return {
        ok: false,
        error: `Import limited to ${MAX_IMPORT_ROWS} rows. Split your file and try again.`,
      };
    }

    const existingPhones = await getExistingPhoneMap(workspaceId);
    const analyzed = analyzeCsvRows(input.rows, existingPhones);
    const summary = summarizePreview(analyzed);

    let listName: string | undefined;
    if (input.listId) {
      const list = await getListById(workspaceId, input.listId);
      listName = list?.name;
    }

    return {
      ok: true,
      data: { analyzed, summary, listName },
    };
  }) as Promise<{ ok: true; data: PreviewImportResult } | { ok: false; error: string }>;
}

export type ImportContactsInput = {
  rows: AnalyzedCsvRow[];
  listId?: string;
  newListName?: string;
  consent: boolean;
};

export type ImportContactsResult = {
  listId: string;
  listName: string;
  newContactsCreated: number;
  existingContactsFound: number;
  contactsAddedToList: number;
  duplicatesSkipped: number;
  invalidRowsSkipped: number;
  alreadyOnListSkipped: number;
};

export async function executeImportAction(
  input: ImportContactsInput
): Promise<{ ok: true; data: ImportContactsResult } | { ok: false; error: string }> {
  return runAction(async () => {
    const workspaceId = await requireWorkspaceId();

    if (!input.consent) {
      return {
        ok: false,
        error:
          "You must confirm these contacts gave permission to receive text messages.",
      };
    }

    if (input.rows.length > MAX_IMPORT_ROWS) {
      return {
        ok: false,
        error: `Import limited to ${MAX_IMPORT_ROWS} rows.`,
      };
    }

    let listId = input.listId;
    let listName = "";

    if (input.newListName?.trim()) {
      const name = input.newListName.trim();
      if (await isListNameTaken(workspaceId, name)) {
        return { ok: false, error: "A list with this name already exists." };
      }
      const list = await prisma.list.create({
        data: { workspaceId, name, description: "Imported from CSV" },
      });
      listId = list.id;
      listName = list.name;
    } else if (listId) {
      const list = await getListById(workspaceId, listId);
      if (!list) return { ok: false, error: "List not found." };
      listName = list.name;
    } else {
      return { ok: false, error: "Choose a list or create a new one." };
    }

    const importable = input.rows.filter(
      (r) =>
        (r.status === "valid_new" || r.status === "valid_existing") &&
        r.normalizedPhone
    );

    const newContactsNeeded = importable.filter((r) => !r.existingContactId).length;
    const limitCheck = await checkContactLimit(workspaceId, newContactsNeeded);
    if (!limitCheck.ok) {
      return { ok: false, error: limitCheck.error };
    }

    const existingOnList = listId
      ? new Set(
          (
            await prisma.listContact.findMany({
              where: { listId },
              select: { contactId: true },
            })
          ).map((lc) => lc.contactId)
        )
      : new Set<string>();

    const existingTags = await prisma.tag.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });
    const tagByName = new Map(
      existingTags.map((t) => [t.name.toLowerCase(), t.id])
    );

    let newContactsCreated = 0;
    let existingContactsFound = 0;
    let contactsAddedToList = 0;
    const invalidRowsSkipped = input.rows.filter(
      (r) => r.status === "invalid"
    ).length;
    let alreadyOnListSkipped = 0;

    const duplicatesSkipped = input.rows.filter(
      (r) => r.status === "duplicate_file"
    ).length;

    const now = new Date();

    for (const row of importable) {
      if (!row.normalizedPhone) continue;

      let contactId = row.existingContactId;

      if (contactId) {
        existingContactsFound++;
      } else {
        const created = await prisma.contact.create({
          data: {
            workspaceId,
            phone: row.normalizedPhone,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            status: "active",
            source: "csv",
            consentStatus: "subscribed",
            consentSource: "csv",
            consentTimestamp: now,
          },
        });
        contactId = created.id;
        newContactsCreated++;
      }

      if (row.tags.length > 0) {
        for (const tagName of row.tags) {
          const key = tagName.toLowerCase();
          let tagId = tagByName.get(key);
          if (!tagId) {
            const tag = await prisma.tag.create({
              data: { workspaceId, name: tagName },
            });
            tagId = tag.id;
            tagByName.set(key, tagId);
          }
          await prisma.contactTag.createMany({
            data: [{ contactId, tagId }],
            skipDuplicates: true,
          });
        }
      }

      if (existingOnList.has(contactId)) {
        alreadyOnListSkipped++;
        continue;
      }

      await prisma.listContact.createMany({
        data: [{ listId: listId!, contactId }],
        skipDuplicates: true,
      });
      existingOnList.add(contactId);
      contactsAddedToList++;
    }

    revalidatePath("/contacts");
    revalidatePath("/lists");
    revalidatePath(`/lists/${listId}`);

    return {
      ok: true,
      data: {
        listId: listId!,
        listName,
        newContactsCreated,
        existingContactsFound,
        contactsAddedToList,
        duplicatesSkipped,
        invalidRowsSkipped,
        alreadyOnListSkipped,
      },
    };
  }) as Promise<{ ok: true; data: ImportContactsResult } | { ok: false; error: string }>;
}
