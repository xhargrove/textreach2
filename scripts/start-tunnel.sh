#!/usr/bin/env bash
# Starts a Cloudflare quick tunnel to localhost:3000 and prints Twilio webhook URLs.
# The URL changes each run — re-run scripts/setup-twilio-webhooks.ts after restarting.

set -e

PORT="${PORT:-3000}"

if ! command -v cloudflared &>/dev/null; then
  echo "Installing cloudflared..."
  brew install cloudflared
fi

echo "Starting tunnel to http://localhost:${PORT} ..."
echo "Keep this terminal open while testing Twilio webhooks."
echo ""

cloudflared tunnel --url "http://localhost:${PORT}" 2>&1 | while IFS= read -r line; do
  echo "$line"
  if echo "$line" | grep -q 'trycloudflare.com'; then
    URL=$(echo "$line" | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
    if [ -n "$URL" ]; then
      echo ""
      echo "=========================================="
      echo "Public URL: $URL"
      echo ""
      echo "Add to .env:"
      echo "  TWILIO_WEBHOOK_BASE_URL=$URL"
      echo "  NEXT_PUBLIC_APP_URL=$URL"
      echo ""
      echo "Clerk (remote tunnel auth):"
      echo "  1. Add Clerk keys to .env if not set"
      echo "  2. In Clerk Dashboard → Configure, add allowed origin:"
      echo "       $URL"
      echo "  3. Add redirect URLs:"
      echo "       $URL/sign-in"
      echo "       $URL/sign-up"
      echo "       $URL/dashboard"
      echo "  Frontend API proxy auto-enables at /__clerk for trycloudflare.com"
      echo ""
      echo "Twilio webhook URLs:"
      echo "  Inbound:  $URL/api/webhooks/twilio/inbound"
      echo "  Status:   $URL/api/webhooks/twilio/status"
      echo "  Stripe:   $URL/api/webhooks/stripe  (set STRIPE_USE_REMOTE_WEBHOOK=true && npm run stripe:setup)"
      echo ""
      echo "For Stripe local dev, prefer:"
      echo "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
      echo ""
      echo "Then run: npx tsx scripts/setup-twilio-webhooks.ts"
      echo "=========================================="
      echo ""
    fi
  fi
done
