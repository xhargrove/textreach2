# TextReach Beta Launch Testing Checklist

Use this checklist before opening beta to real users. Unit tests cover core logic; manual checks verify integrations.

## Automated Tests

```bash
npm test
```

**105 unit tests** covering critical logic:

| Area | Test file | Covers |
|------|-----------|--------|
| Twilio routing | `inbound-handler.test.ts`, `workspace-lookup.test.ts`, `service.test.ts` | Workspace A/B inbound routing by `To`; **workspace A/B outbound send from different numbers**; platform fallback only when `TWILIO_ALLOW_PLATFORM_SENDER_FALLBACK=true` |
| Keyword opt-in | `keyword-handler.test.ts`, `contact-consent.test.ts` | Subscribed contact with consent timestamp/source; no auto-consent on plain inbound |
| Billing gates | `subscription.test.ts` | Null/missing billing blocks send; active/trialing/comped allow; canceled/past_due/inactive block |
| RBAC | `rbac.test.ts`, `action-result.test.ts` | Member cannot create campaigns or reply without `manage_inbox`; `ForbiddenError` returns friendly message |
| Workspace scoping | `workspace-scoping.test.ts`, `workspace-mutations.test.ts` | Cross-workspace list/tag/keyword/contact/message mutations blocked |
| Scheduler / cron | `process-scheduled.test.ts`, `authorize-request.test.ts` | Missing `CRON_SECRET` → 500 in production; invalid auth → 401; batch processing counts sent/failed; **quiet-hours deferral**; one failure does not stop remaining jobs |
| Quiet hours | `quiet-hours.test.ts` | Timezone-aware 9 PM–8 AM detection; scheduled send deferral to next allowed window |
| SMS commands | `sms-commands.test.ts` | STOP/START/HELP parsing |
| Compliance | `validate-compliance-settings.test.ts`, `send-message.test.ts` | Settings validation; consent required to queue sends |
| Session | `session-cookie.test.ts` | Signed legacy cookies |

## Manual Integration Checklist

### Auth & Access
- [ ] Unauthenticated users redirect to sign-in (not error page)
- [ ] Users cannot access another workspace's data via URL manipulation
- [ ] Demo login only works in local development

### Contacts
- [ ] Create contact manually with phone and consent timestamp
- [ ] Edit contact, change status
- [ ] Delete contact
- [ ] Import CSV with consent checkbox confirmed
- [ ] Import rejected without consent confirmation

### Lists
- [ ] Create list
- [ ] Add contacts to list
- [ ] Remove contact from list

### Messages
- [ ] Create and save draft
- [ ] Send message to list with valid recipients
- [ ] Send blocked when contacts missing consent
- [ ] Send blocked when over plan limit
- [ ] **Send blocked during quiet hours (9 PM–8 AM workspace timezone)**
- [ ] Schedule message for future time
- [ ] **Schedule time in quiet hours auto-adjusts to next allowed window**
- [ ] Edit scheduled message before send time
- [ ] Cancel scheduled message
- [ ] Scheduled message sends automatically (cron or `npm run cron:scheduled-messages`)
- [ ] **Scheduled message deferred (not sent) during quiet hours; sends after window opens**
- [ ] Scheduled message does not send twice

### SMS Compliance
- [ ] Outbound message includes compliance footer
- [ ] Contact replies STOP → status becomes opted out, consentStatus unsubscribed
- [ ] Opted-out contact skipped on next send
- [ ] Contact replies START → resubscribed with consentSource twilio:start
- [ ] Contact replies HELP → help auto-reply
- [ ] Plain inbound from unknown number does not grant marketing consent
- [ ] Keyword opt-in sets consentSource keyword:<keyword> and consentPhoneNumber

### Keywords
- [ ] Create keyword assigned to list
- [ ] Text keyword to Twilio number → auto-reply + opt-in recorded
- [ ] STOP/HELP/START reserved and cannot be used as keywords

### Inbox
- [ ] Inbound reply appears in inbox
- [ ] Reply from inbox sends successfully
- [ ] Cannot reply to opted-out contact

### Billing
- [ ] Stripe checkout completes and plan updates
- [ ] Plan limit blocks send when exceeded
- [ ] Past-due subscription blocks send
- [ ] Workspace without billing account cannot send messages
- [ ] Canceled or inactive subscription blocks send
- [ ] Active, trialing, or comped subscription allows send

### Twilio settings
- [ ] Owner/admin can save workspace Twilio phone in Settings
- [ ] Invalid E.164 phone rejected
- [ ] Invalid MG/AC SIDs rejected
- [ ] Duplicate phone number across workspaces rejected
- [ ] **Outbound campaign/inbox sends use workspace phone or Messaging Service SID (not platform env)**

### Team & workspaces
- [ ] **Team invite sends Clerk email; member shows as Pending until signup**
- [ ] **Invited user signs up with same email and gains workspace access**
- [ ] **Workspace switcher appears when user belongs to 2+ workspaces**
- [ ] **Switching workspace changes dashboard data without re-login**

### Webhooks & Health
- [ ] `GET /api/health` returns `{ ok: true }`
- [ ] Twilio inbound webhook rejects invalid signature
- [ ] Workspace Twilio number saved in Settings (production)
- [ ] Inbound SMS routes to the workspace that owns the `To` number (not the first workspace)
- [ ] Inbound to an unassigned number is ignored (no contact/keyword/STOP processing)
- [ ] Stripe webhook rejects invalid signature
- [ ] **Clerk webhook rejects invalid signature (`/api/webhooks/clerk`)**
- [ ] Cron route returns 500 when `CRON_SECRET` missing in production
- [ ] Cron route processes scheduled messages with valid bearer token

### Admin
- [ ] `/admin` accessible only to `TEXTREACH_ADMIN_EMAILS`
- [ ] Stats display correctly

### Page permissions (RBAC)
- [ ] Member role redirected to `/forbidden` when visiting `/messages/new` (create campaign)
- [ ] Member role redirected to `/forbidden` when visiting manage pages (e.g. `/contacts/new`, `/settings`, `/billing`)
- [ ] Member can view read-only pages (contacts, lists, messages, inbox, results)
- [ ] Create/edit/delete buttons hidden for members without matching permission
- [ ] Inbox conversation shows read-only notice (no reply textarea) when member lacks `manage_inbox`
- [ ] Sidebar hides Billing, Settings, and Team for roles without those permissions

### Session security (legacy dev auth)
- [ ] Production without Clerk returns 503 (not legacy cookie auth)
- [ ] Legacy login requires `SESSION_SECRET` (32+ chars) in `.env`
- [ ] Tampered session cookie does not grant workspace access
- [ ] After login, cookie value is not plain JSON (signed payload)

### Cross-workspace safety
- [ ] Updates/deletes on contacts, lists, tags, keywords, messages scope by `workspaceId`
- [ ] Deleting a missing entity redirects or returns not-found (no silent success)
- [ ] Cancel scheduled message fails clearly when message is not scheduled in workspace

## Staging Environment

Test all Twilio/Stripe flows on staging with test keys before switching to live keys.
