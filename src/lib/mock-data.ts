export const dashboardStats = {
  totalContacts: 1248,
  activeLists: 6,
  messagesSent: 3842,
  replies: 187,
  optOuts: 23,
  scheduledMessages: 3,
};

export const recentMessages = [
  {
    id: "1",
    name: "Friday Night Event Reminder",
    list: "VIP Guest List",
    status: "sent" as const,
    recipients: 342,
    replies: 28,
    sentAt: "2026-06-05T18:00:00",
  },
  {
    id: "2",
    name: "Weekend Brunch Special",
    list: "Regular Diners",
    status: "sent" as const,
    recipients: 891,
    replies: 45,
    sentAt: "2026-06-04T10:30:00",
  },
  {
    id: "3",
    name: "Sunday Service Reminder",
    list: "Church Members",
    status: "scheduled" as const,
    recipients: 156,
    replies: 0,
    sentAt: "2026-06-08T08:00:00",
  },
  {
    id: "4",
    name: "New Menu Launch",
    list: "Local Foodies",
    status: "draft" as const,
    recipients: 0,
    replies: 0,
    sentAt: null,
  },
];

export const activeKeywords = [
  {
    id: "1",
    keyword: "JOIN",
    autoReply: "Thanks for joining! You're now on our list.",
    signups: 89,
    active: true,
  },
  {
    id: "2",
    keyword: "EVENT",
    autoReply: "Here's the link to this week's event: textreach.io/event",
    signups: 34,
    active: true,
  },
  {
    id: "3",
    keyword: "MENU",
    autoReply: "View our latest menu at textreach.io/menu",
    signups: 12,
    active: true,
  },
];

export const recentReplies = [
  {
    id: "1",
    contact: "Sarah M.",
    phone: "+1 (555) 234-5678",
    message: "What time does the event start?",
    receivedAt: "2026-06-05T19:42:00",
  },
  {
    id: "2",
    contact: "James T.",
    phone: "+1 (555) 876-5432",
    message: "Can I bring a guest?",
    receivedAt: "2026-06-05T19:15:00",
  },
  {
    id: "3",
    contact: "Maria L.",
    phone: "+1 (555) 345-6789",
    message: "Thanks! See you there 🎉",
    receivedAt: "2026-06-05T18:55:00",
  },
];

export const contacts = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Mitchell",
    phone: "+1 (555) 234-5678",
    email: "sarah@email.com",
    lists: ["VIP Guest List"],
    tags: ["VIP"],
    optedOut: false,
  },
  {
    id: "2",
    firstName: "James",
    lastName: "Thompson",
    phone: "+1 (555) 876-5432",
    email: "james@email.com",
    lists: ["VIP Guest List", "Newsletter"],
    tags: ["Regular"],
    optedOut: false,
  },
  {
    id: "3",
    firstName: "Maria",
    lastName: "Lopez",
    phone: "+1 (555) 345-6789",
    email: null,
    lists: ["Event Attendees"],
    tags: [],
    optedOut: false,
  },
];

export const lists = [
  {
    id: "1",
    name: "VIP Guest List",
    description: "Top customers and frequent attendees",
    contactCount: 342,
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Regular Diners",
    description: "Weekly newsletter subscribers",
    contactCount: 891,
    createdAt: "2026-02-01",
  },
  {
    id: "3",
    name: "Church Members",
    description: "Sunday service reminders",
    contactCount: 156,
    createdAt: "2026-03-10",
  },
  {
    id: "4",
    name: "Event Attendees",
    description: "Past event sign-ups",
    contactCount: 215,
    createdAt: "2026-04-22",
  },
];

export const messages = [
  {
    id: "1",
    name: "Friday Night Event Reminder",
    body: "Hey! Just a reminder — our event starts tonight at 8 PM. See you there!",
    list: "VIP Guest List",
    status: "sent" as const,
    recipients: 342,
    delivered: 338,
    replies: 28,
    scheduledAt: null,
    sentAt: "2026-06-05T18:00:00",
  },
  {
    id: "2",
    name: "Weekend Brunch Special",
    body: "This weekend only: 20% off brunch! Show this text at checkout.",
    list: "Regular Diners",
    status: "sent" as const,
    recipients: 891,
    delivered: 885,
    replies: 45,
    scheduledAt: null,
    sentAt: "2026-06-04T10:30:00",
  },
  {
    id: "3",
    name: "Sunday Service Reminder",
    body: "Good morning! Join us this Sunday at 10 AM. Reply YES to confirm.",
    list: "Church Members",
    status: "scheduled" as const,
    recipients: 156,
    delivered: 0,
    replies: 0,
    scheduledAt: "2026-06-08T08:00:00",
    sentAt: null,
  },
];

export const keywords = [
  {
    id: "1",
    keyword: "JOIN",
    autoReply: "Thanks for joining! You're now on our list.",
    list: "Newsletter",
    signups: 89,
    active: true,
  },
  {
    id: "2",
    keyword: "EVENT",
    autoReply: "Here's the link to this week's event.",
    list: "Event Attendees",
    signups: 34,
    active: true,
  },
  {
    id: "3",
    keyword: "STOP",
    autoReply: null,
    list: null,
    signups: 0,
    active: true,
  },
];

export const inboxMessages = [
  {
    id: "1",
    contact: "Sarah M.",
    phone: "+1 (555) 234-5678",
    body: "What time does the event start?",
    read: false,
    receivedAt: "2026-06-05T19:42:00",
  },
  {
    id: "2",
    contact: "James T.",
    phone: "+1 (555) 876-5432",
    body: "Can I bring a guest?",
    read: false,
    receivedAt: "2026-06-05T19:15:00",
  },
  {
    id: "3",
    contact: "Maria L.",
    phone: "+1 (555) 345-6789",
    body: "Thanks! See you there 🎉",
    read: true,
    receivedAt: "2026-06-05T18:55:00",
  },
];

export const pricingPlans = [
  {
    name: "Free",
    price: 0,
    description: "Try TextReach with a small list",
    features: [
      "100 messages per month",
      "1 list",
      "Basic keywords",
      "Reply inbox",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: 29,
    description: "For growing local businesses",
    features: [
      "1,000 messages per month",
      "5 lists",
      "Keyword auto-replies",
      "Schedule messages",
      "Basic analytics",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Pro",
    price: 79,
    description: "For events, venues, and creators",
    features: [
      "5,000 messages per month",
      "Unlimited lists",
      "Advanced keywords",
      "Link tracking",
      "Priority support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
];
