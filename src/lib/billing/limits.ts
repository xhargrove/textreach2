import type { WorkspacePlan } from "@prisma/client";
import {
  formatLimit,
  getNextPlan,
  planLabel,
  PLAN_CONFIG,
} from "@/lib/billing/plans";
import { getWorkspaceUsage, isAtLimit } from "@/lib/billing/usage";

export type LimitResource = "contacts" | "keywords" | "messages";

export type LimitCheckResult =
  | { ok: true }
  | { ok: false; error: string; resource: LimitResource };

function buildLimitError(
  resource: LimitResource,
  plan: WorkspacePlan,
  limit: number | null
): string {
  const limitText = formatLimit(limit);
  const resourceLabels: Record<LimitResource, string> = {
    contacts: "contacts",
    keywords: "keywords",
    messages: "messages this billing period",
  };

  let message = `You've reached your ${planLabel(plan)} plan limit of ${limitText} ${resourceLabels[resource]}.`;

  const nextPlan = getNextPlan(plan);
  if (nextPlan) {
    const nextLimits = PLAN_CONFIG[nextPlan];
    const nextLimit =
      resource === "contacts"
        ? nextLimits.contacts
        : resource === "keywords"
          ? nextLimits.keywords
          : nextLimits.messages;
    message += ` Upgrade to ${planLabel(nextPlan)} for ${formatLimit(nextLimit)} ${resourceLabels[resource]}.`;
  }

  message += " Go to Billing to upgrade your plan.";
  return message;
}

export async function checkContactLimit(
  workspaceId: string,
  additional = 1
): Promise<LimitCheckResult> {
  const usage = await getWorkspaceUsage(workspaceId);
  const limit = usage.limits.contacts;

  if (usage.contacts + additional > limit) {
    return {
      ok: false,
      resource: "contacts",
      error: buildLimitError("contacts", usage.plan, limit),
    };
  }

  return { ok: true };
}

export async function checkKeywordLimit(
  workspaceId: string
): Promise<LimitCheckResult> {
  const usage = await getWorkspaceUsage(workspaceId);
  const limit = usage.limits.keywords;

  if (limit === null) return { ok: true };

  if (usage.keywords + 1 > limit) {
    return {
      ok: false,
      resource: "keywords",
      error: buildLimitError("keywords", usage.plan, limit),
    };
  }

  return { ok: true };
}

export async function checkMessageLimit(
  workspaceId: string,
  recipientsToSend: number
): Promise<LimitCheckResult> {
  const usage = await getWorkspaceUsage(workspaceId);
  const limit = usage.limits.messages;

  if (usage.messagesSent + recipientsToSend > limit) {
    const remaining = Math.max(limit - usage.messagesSent, 0);
    let message = buildLimitError("messages", usage.plan, limit);
    if (remaining > 0 && recipientsToSend > remaining) {
      message = `This send would exceed your ${planLabel(usage.plan)} plan limit of ${formatLimit(limit)} messages this billing period. You have ${remaining.toLocaleString()} message${remaining === 1 ? "" : "s"} remaining. Upgrade on the Billing page to send more.`;
    }
    return {
      ok: false,
      resource: "messages",
      error: message,
    };
  }

  return { ok: true };
}

export async function isUsageAtLimit(
  workspaceId: string,
  resource: LimitResource
): Promise<boolean> {
  const usage = await getWorkspaceUsage(workspaceId);

  switch (resource) {
    case "contacts":
      return isAtLimit(usage.contacts, usage.limits.contacts);
    case "keywords":
      return isAtLimit(usage.keywords, usage.limits.keywords);
    case "messages":
      return isAtLimit(usage.messagesSent, usage.limits.messages);
  }
}
