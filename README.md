# TextReach

**Send text messages your customers actually see.**

TextReach is a simple SMS platform for businesses, event organizers, creators, and local brands to send text messages for events, promotions, reminders, and follow-ups.

## Core Flow

Create a list → add contacts → write a message → send or schedule → track results.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**
- **Clerk** (production auth), **Twilio** (SMS), **Stripe** (billing)

## Getting Started

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed   # optional demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [DEPLOY.md](./DEPLOY.md) for production deployment and [TESTING.md](./TESTING.md) for the launch checklist.

### Auth routes

- Sign in: `/sign-in`
- Sign up: `/sign-up`
- Legacy aliases `/login` and `/signup` redirect to the canonical routes

### Demo login (local dev without Clerk)

After seeding:

- **Email:** `demo@textreach.io`
- **Password:** any value

Set `SESSION_SECRET` (32+ chars) in `.env` for legacy auth and workspace switching.

### Tests

```bash
npm test
```

## Feature Status

| Area | Status |
|------|--------|
| Contacts, lists, tags, CSV import | **Live** |
| Message compose, send, schedule | **Live** |
| Per-workspace Twilio inbound + outbound | **Live** |
| Inbox replies, keywords, STOP/START/HELP | **Live** |
| Stripe billing + plan limits | **Live** |
| Results, link clicks, reply stats | **Live** |
| Compliance settings + quiet hours (9 PM–8 AM) | **Live** |
| Team invites (Clerk email) + roles | **Live** |
| Multi-workspace switcher | **Live** |
| Platform admin (`/admin`) | **Live** |
| Workspace self-delete | **Future** |
| CSV export, onboarding wizard | **Future** |

## Twilio Webhooks

| Webhook | URL |
|---------|-----|
| Inbound SMS | `{YOUR_PUBLIC_URL}/api/webhooks/twilio/inbound` |
| Status callback | `{YOUR_PUBLIC_URL}/api/webhooks/twilio/status` |

Each workspace must configure its sender in **Settings → Phone Number**. Outbound sends use the workspace Messaging Service SID or phone number.

## Clerk Webhook (team invites)

Register `POST {YOUR_PUBLIC_URL}/api/webhooks/clerk` with events `user.created` and `user.updated`. Set `CLERK_WEBHOOK_SIGNING_SECRET` in env.

## License

Private — All rights reserved.
