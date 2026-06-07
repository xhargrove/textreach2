/**
 * Vercel Neon sets POSTGRES_* vars; Prisma expects DATABASE_URL / DIRECT_URL.
 * Call before PrismaClient is constructed.
 */
export function ensureDatabaseEnv(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    const pooled =
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL ??
      process.env.NEON_DATABASE_URL;

    if (pooled?.trim()) {
      process.env.DATABASE_URL = pooled.trim();
    }
  }

  if (!process.env.DIRECT_URL?.trim()) {
    const direct =
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL_UNPOOLED;

    if (direct?.trim()) {
      process.env.DIRECT_URL = direct.trim();
    }
  }
}

export function isDatabaseConfigured(): boolean {
  ensureDatabaseEnv();
  return Boolean(process.env.DATABASE_URL?.trim());
}
