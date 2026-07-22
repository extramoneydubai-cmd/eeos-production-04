import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_CHANNELS = [
  { name: "Organic Search", code: "ORGANIC", marketingType: "SEO", isOnline: true, color: "#4285f4", icon: "Search", description: "Unpaid search engine traffic", sequence: 1 },
  { name: "Paid Search", code: "PAID_SEARCH", marketingType: "SEM", isOnline: true, color: "#fbbc04", icon: "DollarSign", description: "Pay-per-click search engine advertising", sequence: 2 },
  { name: "Organic Social", code: "ORG_SOCIAL", marketingType: "Social Media", isOnline: true, color: "#1877F2", icon: "Users", description: "Unpaid social media presence and engagement", sequence: 3 },
  { name: "Paid Social", code: "PAID_SOCIAL", marketingType: "Social Media", isOnline: true, color: "#E4405F", icon: "Megaphone", description: "Paid social media advertising campaigns", sequence: 4 },
  { name: "Email Marketing", code: "EMAIL", marketingType: "Email", isOnline: true, color: "#ea4335", icon: "Mail", description: "Email-based marketing and nurture campaigns", sequence: 5 },
  { name: "Affiliate Marketing", code: "AFFILIATE", marketingType: "Partnership", isOnline: true, color: "#a855f7", icon: "Handshake", description: "Partner-driven affiliate marketing programs", sequence: 6 },
  { name: "Referral Marketing", code: "REFERRAL", marketingType: "Partnership", isOnline: true, color: "#34a853", icon: "UserPlus", description: "Word-of-mouth and referral program marketing", sequence: 7 },
  { name: "Influencer Marketing", code: "INFLUENCER", marketingType: "Partnership", isOnline: true, color: "#e91e63", icon: "Star", description: "Social media influencer and creator partnerships", sequence: 8 },
  { name: "Content Marketing", code: "CONTENT", marketingType: "Content", isOnline: true, color: "#e8710a", icon: "FileText", description: "Blogs, videos, and other content-driven marketing", sequence: 9 },
  { name: "SMS Marketing", code: "SMS", marketingType: "Messaging", isOnline: true, color: "#34a853", icon: "MessageSquare", description: "SMS-based marketing and broadcast campaigns", sequence: 10 },
  { name: "WhatsApp Marketing", code: "WA", marketingType: "Messaging", isOnline: true, color: "#25D366", icon: "MessageCircle", description: "WhatsApp-based marketing and broadcast", sequence: 11 },
  { name: "Offline Marketing", code: "OFFLINE", marketingType: "Offline", isOnline: false, color: "#5f6368", icon: "Newspaper", description: "Traditional offline marketing activities", sequence: 12 },
  { name: "Event Marketing", code: "EVENT", marketingType: "Offline", isOnline: false, color: "#4f46e5", icon: "CalendarCheck", description: "On-ground event-based marketing", sequence: 13 },
  { name: "Telecalling", code: "TELECALL", marketingType: "Direct", isOnline: false, color: "#0d9488", icon: "Phone", description: "Outbound telecalling and telemarketing", sequence: 14 },
  { name: "Direct Sales", code: "DSALES", marketingType: "Direct", isOnline: false, color: "#d4a017", icon: "Briefcase", description: "Direct field sales and door-to-door marketing", sequence: 15 },
];

export const listMarketingChannels = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("crmMarketingChannels").collect();
    return channels.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getMarketingChannel = query({
  args: { marketingChannelId: v.id("crmMarketingChannels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.marketingChannelId);
  },
});

export const createMarketingChannel = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    marketingType: v.string(),
    isOnline: v.boolean(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("crmMarketingChannels").collect();
    const maxSeq = all.reduce((max, c) => Math.max(max, c.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmMarketingChannels", {
      name: args.name,
      code: args.code,
      marketingType: args.marketingType,
      isOnline: args.isOnline,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMarketingChannel = mutation({
  args: {
    marketingChannelId: v.id("crmMarketingChannels"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    marketingType: v.optional(v.string()),
    isOnline: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { marketingChannelId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(marketingChannelId, updates);
  },
});

export const deleteMarketingChannel = mutation({
  args: { marketingChannelId: v.id("crmMarketingChannels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.marketingChannelId);
  },
});

export const duplicateMarketingChannel = mutation({
  args: { marketingChannelId: v.id("crmMarketingChannels") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.marketingChannelId);
    if (!original) throw new Error("Marketing channel not found");
    const all = await ctx.db.query("crmMarketingChannels").collect();
    const maxSeq = all.reduce((max, c) => Math.max(max, c.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmMarketingChannels", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      marketingType: original.marketingType,
      isOnline: original.isOnline,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderMarketingChannels = mutation({
  args: {
    marketingChannelIds: v.array(v.id("crmMarketingChannels")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.marketingChannelIds.length; i++) {
      await ctx.db.patch(args.marketingChannelIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultMarketingChannels = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmMarketingChannels").collect();
    if (existing.length > 0) return { seeded: 0, message: "Marketing channels already exist" };

    const now = Date.now();
    for (const channel of DEFAULT_CHANNELS) {
      await ctx.db.insert("crmMarketingChannels", {
        ...channel,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_CHANNELS.length, message: "Default marketing channels created" };
  },
});
