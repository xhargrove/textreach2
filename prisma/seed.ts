import {
  PrismaClient,
  ContactStatus,
  ContactSource,
  MessageStatus,
  RecipientStatus,
  KeywordStatus,
  InboxDirection,
  WorkspacePlan,
} from "@prisma/client";
import { DEMO_USER_EMAIL, DEMO_WORKSPACE_NAME } from "../src/lib/auth/constants";
import {
  DEFAULT_COMPLIANCE_FOOTER,
  DEFAULT_HELP_RESPONSE,
} from "../src/lib/compliance/defaults";
import { appendComplianceFooter } from "../src/lib/compliance/footer";
import { getDevTwilioSeedConfig } from "../src/lib/twilio/dev-seed-config";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { name: "Jane Demo" },
    create: { email: DEMO_USER_EMAIL, name: "Jane Demo" },
  });

  let workspace = await prisma.workspace.findFirst({
    where: { name: DEMO_WORKSPACE_NAME },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: DEMO_WORKSPACE_NAME,
        ownerId: user.id,
        plan: WorkspacePlan.starter,
        members: {
          create: { userId: user.id, role: "owner", canCreateMessages: true },
        },
        billingAccount: {
          create: {
            plan: WorkspacePlan.starter,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });
  }

  const workspaceId = workspace.id;

  const devTwilioConfig = getDevTwilioSeedConfig();

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      businessName: "Demo Events Co.",
      supportEmail: "support@demo-events.com",
      supportPhone: "+14045551234",
      privacyPolicyUrl: "https://textreach.io/privacy",
      termsUrl: "https://textreach.io/terms",
      messageFrequencyDescription:
        "Up to 4 messages per month about events and promotions",
      defaultComplianceFooter: DEFAULT_COMPLIANCE_FOOTER,
      defaultHelpResponse: DEFAULT_HELP_RESPONSE,
      ...(devTwilioConfig ?? {}),
    },
  });

  if (devTwilioConfig) {
    console.log(
      `Dev Twilio config applied to demo workspace: ${devTwilioConfig.twilioPhoneNumber}`
    );
  } else if (process.env.NODE_ENV === "production") {
    console.log(
      "Production seed: Twilio phone not auto-assigned. Configure per workspace in Settings."
    );
  }

  await prisma.contact.deleteMany({ where: { workspaceId } });
  await prisma.list.deleteMany({ where: { workspaceId } });
  await prisma.message.deleteMany({ where: { workspaceId } });
  await prisma.keyword.deleteMany({ where: { workspaceId } });
  await prisma.inboxMessage.deleteMany({ where: { workspaceId } });
  await prisma.optOut.deleteMany({ where: { workspaceId } });
  await prisma.linkClick.deleteMany({ where: { workspaceId } });
  await prisma.trackedLink.deleteMany({ where: { workspaceId } });
  await prisma.complianceArchive.deleteMany({ where: { workspaceId } });
  await prisma.tag.deleteMany({ where: { workspaceId } });

  const vipTag = await prisma.tag.create({
    data: { workspaceId, name: "VIP", color: "#6366f1" },
  });
  const regularTag = await prisma.tag.create({
    data: { workspaceId, name: "Regular", color: "#10b981" },
  });

  const contactData: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    source: ContactSource;
    status?: ContactStatus;
    tagId?: string;
  }> = [
    { firstName: "Sarah", lastName: "Mitchell", phone: "+15552345678", email: "sarah@email.com", source: ContactSource.keyword, tagId: vipTag.id },
    { firstName: "James", lastName: "Thompson", phone: "+15558765432", email: "james@email.com", source: ContactSource.manual, tagId: regularTag.id },
    { firstName: "Maria", lastName: "Lopez", phone: "+15553456789", email: null, source: ContactSource.inbound },
    { firstName: "David", lastName: "Chen", phone: "+15554567890", email: "david@email.com", source: ContactSource.csv, tagId: vipTag.id },
    { firstName: "Emily", lastName: "Rodriguez", phone: "+15555678901", email: "emily@email.com", source: ContactSource.keyword },
    { firstName: "Michael", lastName: "Brown", phone: "+15556789012", email: "michael@email.com", source: ContactSource.manual },
    { firstName: "Ashley", lastName: "Wilson", phone: "+15557890123", email: "ashley@email.com", source: ContactSource.csv },
    { firstName: "Chris", lastName: "Taylor", phone: "+15558901234", email: "chris@email.com", source: ContactSource.inbound, tagId: regularTag.id },
    { firstName: "Jessica", lastName: "Martinez", phone: "+15559012345", email: "jessica@email.com", source: ContactSource.keyword },
    { firstName: "Robert", lastName: "Anderson", phone: "+15550123456", email: "robert@email.com", source: ContactSource.manual, status: ContactStatus.opted_out },
  ];

  const contacts = await Promise.all(
    contactData.map((c) =>
      prisma.contact.create({
        data: {
          workspaceId,
          phone: c.phone,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          status: c.status ?? ContactStatus.active,
          source: c.source,
          consentStatus:
            c.status === ContactStatus.opted_out
              ? "unsubscribed"
              : c.phone === "+15553456789"
                ? "unknown"
                : "subscribed",
          consentSource:
            c.status === ContactStatus.opted_out || c.phone === "+15553456789"
              ? null
              : c.source === ContactSource.keyword
                ? "keyword:seed"
                : "manual",
          consentTimestamp:
            c.status === ContactStatus.opted_out || c.phone === "+15553456789"
              ? undefined
              : new Date(),
          optedOutAt:
            c.status === ContactStatus.opted_out ? new Date() : undefined,
          contactTags: c.tagId
            ? { create: { tagId: c.tagId } }
            : undefined,
        },
      })
    )
  );

  const vipList = await prisma.list.create({
    data: {
      workspaceId,
      name: "VIP Guest List",
      description: "Top customers and frequent attendees",
    },
  });
  const dinersList = await prisma.list.create({
    data: {
      workspaceId,
      name: "Regular Diners",
      description: "Weekly newsletter subscribers",
    },
  });
  const eventList = await prisma.list.create({
    data: {
      workspaceId,
      name: "Event Attendees",
      description: "Past event sign-ups",
    },
  });

  const listAssignments = [
    { listId: vipList.id, contactIndexes: [0, 1, 3] },
    { listId: dinersList.id, contactIndexes: [1, 4, 5, 6] },
    { listId: eventList.id, contactIndexes: [2, 7, 8] },
  ];

  for (const assignment of listAssignments) {
    for (const index of assignment.contactIndexes) {
      await prisma.listContact.create({
        data: {
          listId: assignment.listId,
          contactId: contacts[index].id,
        },
      });
    }
  }

  const eventUrl = "https://textreach.io/event";
  const sentMessageBody = `Hey! Just a reminder — our event starts tonight at 8 PM. RSVP: ${eventUrl}`;
  const sentMessageComposed = appendComplianceFooter(
    sentMessageBody,
    DEFAULT_COMPLIANCE_FOOTER
  );
  const sentAt = new Date("2026-06-05T18:00:00");

  const sentMessage = await prisma.message.create({
    data: {
      workspaceId,
      listId: vipList.id,
      name: "Friday Night Event Reminder",
      body: sentMessageBody,
      sentBody: sentMessageComposed,
      status: MessageStatus.sent,
      sentAt,
      recipients: {
        create: contacts.slice(0, 4).map((c, i) => ({
          contactId: c.id,
          phone: c.phone,
          status:
            i < 3 ? RecipientStatus.delivered : RecipientStatus.sent,
        })),
      },
    },
  });

  await prisma.complianceArchive.create({
    data: {
      workspaceId,
      messageId: sentMessage.id,
      messageBody: sentMessageComposed,
      listId: vipList.id,
      listName: vipList.name,
      senderNumber: process.env.TWILIO_PHONE_NUMBER ?? null,
      totalRecipients: 4,
      sentCount: 4,
      failedCount: 0,
      skippedOptOuts: 0,
      skippedInvalid: 0,
      sentAt,
    },
  });

  await prisma.message.create({
    data: {
      workspaceId,
      listId: dinersList.id,
      name: "Weekend Brunch Special",
      body: "This weekend only: 20% off brunch! Show this text at checkout.",
      status: MessageStatus.sent,
      sentAt: new Date("2026-06-04T10:30:00"),
      recipients: {
        create: contacts.slice(4, 8).map((c) => ({
          contactId: c.id,
          phone: c.phone,
          status: RecipientStatus.delivered,
        })),
      },
    },
  });

  await prisma.message.create({
    data: {
      workspaceId,
      listId: eventList.id,
      name: "Sunday Service Reminder",
      body: "Good morning! Join us this Sunday at 10 AM. Reply YES to confirm.",
      status: MessageStatus.scheduled,
      scheduledAt: new Date("2026-06-08T08:00:00"),
      recipients: {
        create: contacts.slice(2, 5).map((c) => ({
          contactId: c.id,
          phone: c.phone,
          status: RecipientStatus.queued,
        })),
      },
    },
  });

  await prisma.keyword.create({
    data: {
      workspaceId,
      keyword: "JOIN",
      listId: vipList.id,
      autoReply: "Thanks for joining! You're now on our list.",
      status: KeywordStatus.active,
      optInCount: 89,
    },
  });

  await prisma.keyword.create({
    data: {
      workspaceId,
      keyword: "EVENT",
      listId: eventList.id,
      autoReply: "Here's the link to this week's event: textreach.io/event",
      status: KeywordStatus.active,
      optInCount: 34,
    },
  });

  const inboxData = [
    { contact: contacts[0], body: "What time does the event start?", read: false, hoursAgo: 1 },
    { contact: contacts[1], body: "Can I bring a guest?", read: false, hoursAgo: 2 },
    { contact: contacts[2], body: "Thanks! See you there 🎉", read: true, hoursAgo: 3 },
    { contact: contacts[3], body: "Is parking available?", read: true, hoursAgo: 5 },
    { contact: contacts[4], body: "Can I get a table for 4?", read: false, hoursAgo: 6 },
  ];

  for (const item of inboxData) {
    await prisma.inboxMessage.create({
      data: {
        workspaceId,
        contactId: item.contact.id,
        phone: item.contact.phone,
        body: item.body,
        direction: InboxDirection.inbound,
        read: item.read,
        createdAt: new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000),
      },
    });
  }

  await prisma.optOut.create({
    data: {
      workspaceId,
      contactId: contacts[9].id,
      phone: contacts[9].phone,
      reason: "STOP reply",
    },
  });

  const trackingBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const trackedLink = await prisma.trackedLink.create({
    data: {
      workspaceId,
      messageId: sentMessage.id,
      contactId: contacts[0].id,
      originalUrl: eventUrl,
      trackingUrl: "",
    },
  });

  const trackingUrl = `${trackingBase}/r/${trackedLink.id}`;

  await prisma.trackedLink.update({
    where: { id: trackedLink.id },
    data: { trackingUrl },
  });

  await prisma.linkClick.create({
    data: {
      trackedLinkId: trackedLink.id,
      workspaceId,
      messageId: sentMessage.id,
      contactId: contacts[0].id,
      originalUrl: eventUrl,
      trackingUrl,
    },
  });

  await prisma.linkClick.create({
    data: {
      trackedLinkId: trackedLink.id,
      workspaceId,
      messageId: sentMessage.id,
      contactId: contacts[0].id,
      originalUrl: eventUrl,
      trackingUrl,
      clickedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete.");
  console.log(`  Demo user: ${DEMO_USER_EMAIL}`);
  console.log(`  Workspace: ${DEMO_WORKSPACE_NAME}`);
  console.log(`  Contacts: ${contacts.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
