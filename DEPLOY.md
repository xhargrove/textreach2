# TextReach Deployment Guide

Production deployment checklist for Vercel + PostgreSQL.

## 1. Prerequisites

- Vercel account
- PostgreSQL database (Neon, Supabase, or RDS)
- Twilio account with a phone number or Messaging Service per workspace
- Stripe account with products/prices configured
- Clerk application (recommended for production auth)
- Custom domain (optional but recommended)

## 2. Database Setup

```bash
# Set DATABASE_URL to your production Postgres URL
export DATABASE_URL="postgresql://..."

# Apply migrations (production — never use db push)
npx prisma migrate deploy

# Do NOT run db:seed in production unless you want demo data
```

## 3. Vercel Deployment

1. Connect your GitHub repo to Vercel
2. Set the **Production** environment variables (see checklist below)
3. Deploy — build runs `prisma generate && next build`
4. Verify health: `GET https://your-domain.com/api/health`

## 4. Environment Variables (Production)

Copy from `.env.example`. Required for launch:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Production Postgres |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://yourdomain.com` |
| `SESSION_SECRET` | Yes | Min 32 chars — signs active workspace cookie + legacy sessions |
| `CLERK_SECRET_KEY` | Yes | Production Clerk keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes | For team invite activation webhook |
| `TWILIO_ACCOUNT_SID` | Yes | Platform Twilio credentials |
| `TWILIO_AUTH_TOKEN` | Yes | |
| `TWILIO_WEBHOOK_BASE_URL` | Yes | Same as public app URL |
| `STRIPE_SECRET_KEY` | Yes | Live key |
| `STRIPE_WEBHOOK_SECRET` | Yes | From Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Live key |
| `STRIPE_PRICE_STARTER/GROWTH/PRO` | Yes | Live price IDs |
| `CRON_SECRET` | Yes | Random secret for scheduled messages cron |
| `TEXTREACH_ADMIN_EMAILS` | Recommended | Comma-separated platform admin emails |

Optional:

| Variable | Notes |
|----------|-------|
| `TWILIO_PHONE_NUMBER` / `TWILIO_MESSAGING_SERVICE_SID` | Dev seed fallback only — **not** used for outbound when workspace sender is configured |
| `TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK=true` | Emergency fallback if workspace sender unset — avoid in multi-tenant prod |
| `DIRECT_URL` | Use with `prisma migrate deploy` when `DATABASE_URL` is a pooler URL |

**Never set in production:**
- `TWILIO_WEBHOOK_SKIP_VERIFY=true`
- `AUTH_PROVIDER=legacy` (use Clerk instead)
- `TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK=true` (unless you intentionally run a shared sender)

## 5. Twilio Setup

1. Register sending numbers or Messaging Services for each workspace
2. Configure webhooks in Twilio Console:

| Webhook | URL |
|---------|-----|
| Inbound SMS | `https://yourdomain.com/api/webhooks/twilio/inbound` |
| Status callback | `https://yourdomain.com/api/webhooks/twilio/status` |

Or run locally first: `npm run twilio:webhooks` (uses `TWILIO_WEBHOOK_BASE_URL`)

3. Register for **10DLC / A2P messaging** before high-volume US sends

4. Assign each workspace sender in **Settings → Phone Number** (phone and/or Messaging Service SID):

```sql
UPDATE "Workspace"
SET "twilioPhoneNumber" = '+14045551234',
    "twilioMessagingSid" = 'MGxxxxxxxx',
    "twilioAccountSid" = 'ACxxxxxxxx',
    "twilioStatus" = 'configured'
WHERE id = '<workspace-id>';
```

**Outbound and inbound** both use the workspace sender (`twilioMessagingSid` preferred, else `twilioPhoneNumber`). Inbound webhooks resolve workspace by the Twilio `To` number.

## 6. Stripe Setup

1. Create Starter, Growth, and Pro products with monthly prices
2. Add price IDs to env vars
3. Register webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
5. Or run: `npm run stripe:setup`

## 7. Clerk Setup

1. Create production Clerk application
2. Add allowed origins: your production domain + `www` variant
3. Set redirect URLs in env vars (see `.env.example`)
4. Auth routes are `/sign-in` and `/sign-up` (`/login` and `/signup` redirect there)
5. Register webhook: `https://yourdomain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`
   - Signing secret → `CLERK_WEBHOOK_SIGNING_SECRET`
6. Team invites send Clerk invitation emails; pending members activate on signup

## 8. Scheduled Messages (Cron)

Vercel Cron is configured in `vercel.json` (every minute) and hits:

`GET /api/cron/process-scheduled-messages`

### Production (required)

1. Generate a random secret: `openssl rand -hex 32`
2. Set `CRON_SECRET` in Vercel **Production** environment variables
3. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on each cron invocation
4. If `CRON_SECRET` is missing in production, the route returns **500 Server misconfigured**
5. Scheduled sends during quiet hours are **deferred** to the next allowed window (9 PM – 8 AM workspace local time)

### Troubleshooting

| Symptom | Cause |
|---------|--------|
| 500 `Server misconfigured` | `CRON_SECRET` not set in production |
| 401 Unauthorized | Wrong or missing `Authorization` bearer token |
| 200 but `sent: 0`, `deferred > 0` | Quiet hours active or no due messages |
| Send fails immediately | Workspace sender not configured in Settings |

## 9. Domain Setup

1. Add custom domain in Vercel project settings
2. Update `NEXT_PUBLIC_APP_URL` and `TWILIO_WEBHOOK_BASE_URL` to match
3. Re-run Twilio webhook setup if URLs changed
4. Update Stripe and Clerk webhook URLs if domain changed

## 10. Feature Status

| Feature | Status |
|---------|--------|
| Per-workspace outbound Twilio | **Live** |
| Per-workspace inbound routing | **Live** |
| Quiet hours enforcement | **Live** (9 PM – 8 AM, workspace timezone) |
| Team Clerk email invites | **Live** |
| Workspace switcher | **Live** (requires `SESSION_SECRET`) |
| Workspace deletion | **Future** — contact support |
| CSV export | **Future** |
| Onboarding wizard | **Future** |

## 11. Post-Deploy Verification

Run through [TESTING.md](./TESTING.md) checklist on production (or staging).

Quick smoke test:
```bash
curl https://yourdomain.com/api/health
```

## 12. Platform Admin

Set `TEXTREACH_ADMIN_EMAILS=you@company.com` to access `/admin` for platform-wide stats.
