import type { Workspace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/twilio/service";

export async function getWorkspaceByTwilioToNumber(
  to: string
): Promise<Workspace | null> {
  const normalizedTo = normalizePhoneNumber(to);

  if (!normalizedTo) {
    return null;
  }

  return prisma.workspace.findFirst({
    where: {
      twilioPhoneNumber: normalizedTo,
    },
  });
}
