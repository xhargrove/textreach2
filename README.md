# TextReach

**Send text messages your customers actually see.**

TextReach is a simple SMS platform that helps businesses, event organizers, DJs, artists, churches, restaurants, creators, and local brands send text messages for events, promotions, reminders, announcements, and follow-ups.

## Core Flow

Create a list → add contacts → write a message → send or schedule → track results.

TextReach is not a complicated marketing automation tool. It is built around a simple, easy-to-understand workflow for non-technical users.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma**
- **PostgreSQL**

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Install

```bash
npm install
```

### Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |
| `CLERK_SECRET_KEY` | Clerk auth secret (Phase 2) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (Phase 2) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (Phase 2) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (Phase 2) |
| `TWILIO_PHONE_NUMBER` | Twilio sending number (Phase 2) |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio messaging service (Phase 2) |
| `STRIPE_SECRET_KEY` | Stripe secret key (Phase 3) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (Phase 3) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (Phase 3) |

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated app pages
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   ├── lists/
│   │   ├── messages/
│   │   ├── keywords/
│   │   ├── inbox/
│   │   ├── results/
│   │   ├── billing/
│   │   └── settings/
│   ├── login/
│   ├── signup/
│   ├── pricing/
│   ├── terms/
│   └── privacy/
├── components/
│   ├── ui/             # Reusable UI components
│   └── layout/         # Layout components
└── lib/
    ├── prisma.ts       # Prisma client
    ├── mock-data.ts    # Dashboard mock data
    └── utils.ts        # Utility functions
prisma/
└── schema.prisma       # Database schema
```

## Phase Roadmap

### Phase 1 — Foundation (Current)
- [x] Landing page and public pages
- [x] App shell with navigation
- [x] All major pages scaffolded with mock data
- [x] Prisma schema with all core models
- [x] Reusable UI component library
- [x] Environment variable placeholders

### Phase 2 — Auth & Messaging
- [ ] Clerk authentication integration
- [ ] Twilio SMS sending and receiving
- [ ] Real contact and list management
- [ ] Message compose, send, and schedule
- [ ] Keyword auto-replies
- [ ] Inbox with real replies

### Phase 3 — Billing & Analytics
- [ ] Stripe subscription billing
- [ ] Usage tracking and plan limits
- [ ] Link click tracking
- [ ] Delivery and reply analytics
- [ ] CSV contact import/export

### Phase 4 — Polish & Launch
- [ ] Onboarding flow
- [ ] SMS compliance tools (opt-in forms, STOP handling)
- [ ] Team members and workspace roles
- [ ] Email notifications
- [ ] Production deployment

## License

Private — All rights reserved.
