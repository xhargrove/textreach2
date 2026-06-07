#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running migrations against Vercel production env..."
if [ -f .env ]; then
  mv .env .env.local.bak.$$
fi

npx vercel env run --environment=production -- npx prisma migrate deploy
status=$?

if [ -f .env.local.bak.$$ ]; then
  mv .env.local.bak.$$ .env
fi

if [ "$status" -ne 0 ]; then
  echo "ERROR: migrate deploy failed. Ensure Neon is linked on Vercel production."
  exit "$status"
fi

echo "Done. Redeploy: npx vercel deploy --prod --yes"
