export function workspaceNotFound(entity: string): string {
  return `${entity} not found or already deleted.`;
}

export function requireMutationCount(
  result: { count: number },
  entity: string
): { ok: true } | { ok: false; error: string } {
  if (result.count === 0) {
    return { ok: false, error: workspaceNotFound(entity) };
  }
  return { ok: true };
}
