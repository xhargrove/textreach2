#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Pulling production env from Vercel..."
npx vercel env pull .env.production.local --environment=production --yes

# shellcheck disable=SC1091
set -a
source .env.production.local
set +a

if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_URL"
fi

if [ -z "${DIRECT_URL:-}" ] && [ -n "${POSTGRES_URL_NON_POOLING:-}" ]; then
  export DIRECT_URL="$POSTGRES_URL_NON_POOLING"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL (or POSTGRES_URL) is not set on Vercel production."
  echo "Create Neon Postgres: Vercel → textreach2 → Storage → Create Database"
  exit 1
fi

echo "Running migrations..."
npx prisma migrate deploy

echo "Done. Redeploy: npx vercel deploy --prod --yes"
