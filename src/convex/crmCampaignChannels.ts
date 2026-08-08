import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_CHANNELS = [
  { name: "Facebook", code: "FB", channelCategory: "Social Media", isDigital: true, color: "#1877F2", icon: "Facebook", description: "Facebook organic and paid campaigns", sequence: 1 },
  { name: "Instagram", code: "IG", channelCategory: "Social Media", isDigital: true, color: "#E4405F", icon: "Instagram", description: "Instagram organic and paid campaigns", sequence: 2 },
  { name: "Google Search", code: "GSEARCH", channelCategory: "Search", isDigital: true, color: "#4285f4", icon: "Search", description: "Google Search Ads campaigns", sequence: 3 },
  { name: "Google Display", code: "GDISPLAY", channelCategory: "Display", isDigital: true, color: "#fbbc04", icon: "MonitorPlay", description: "Google Display Network campaigns", sequence: 4 },
  { name: "LinkedIn", code: "LI", channelCategory: "Social Media", isDigital: true, color: "#0A66C2", icon: "Linkedin", description: "LinkedIn paid and organic campaigns", sequence: 5 },
  { name: "YouTube", code: "YT", channelCategory: "Video", isDigital: true, color: "#FF0000", icon: "Youtube", description: "YouTube video and ad campaigns", sequence: 6 },
  { name: "WhatsApp", code: "WA", channelCategory: "Messaging", isDigital: true, color: "#25D366", icon: "MessageCircle", description: "WhatsApp broadcast and campaign messaging", sequence: 7 },
  { name: "SMS", code: "SMS", channelCategory: "Messaging", isDigital: true, color: "#34a853", icon: "MessageSquare", description: "SMS bulk messaging campaigns", sequence: 8 },
  { name: "Email", code: "EMAIL", channelCategory: "Email", isDigital: true, color: "#ea4335", icon: "Mail", description: "Email marketing campaigns", sequence: 9 },
  { name: "Website", code: "WEB", channelCategory: "Website", isDigital: true, color: "#a855f7", icon: "Globe", description: "Website banner and popup campaigns", sequence: 10 },
  { name: "Newspaper", code: "NEWS", channelCategory: "Print", isDigital: false, color: "#5f6368", icon: "Newspaper", description: "Newspaper print ad campaigns", sequence: 11 },
  { name: "Radio", code: "RADIO", channelCategory: "Broadcast", isDigital: false, color: "#e8710a", icon: "Radio", description: "Radio ad campaigns", sequence: 12 },
  { name: "TV", code: "TV", channelCategory: "Broadcast", isDigital: false, color: "#d93025", icon: "Monitor", description: "Television ad campaigns", sequence: 13 },
  { name: "Outdoor", code: "OOH", channelCategory: "Outdoor", isDigital: false, color: "#0d9488", icon: "Trees", description: "Outdoor hoarding and billboard campaigns", sequence: 14 },
  { name: "Event", code: "EVENT", channelCategory: "Event", isDigital: false, color: "#4f46e5", icon: "CalendarCheck", description: "On-ground event and exhibition campaigns", sequence: 15 },
  { name: "Referral Partner", code: "PARTNER", channelCategory: "Referral", isDigital: false, color: "#d4a017", icon: "Handshake", description: "Partner and referral-driven campaigns", sequence: 16 },
];

export const listCampaignChannels = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("crmCampaignChannels").collect();
    return channels.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getCampaignChannel = query({
  args: { campaignChannelId: v.id("crmCampaignChannels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignChannelId);
  },
});

export const createCampaignChannel = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    channelCategory: v.string(),
    isDigital: v.boolean(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCampaignChannels" }, async (ctx, args) => {
    const all = await ctx.db.query("crmCampaignChannels").collect();
    const maxSeq = all.reduce((max: any, c: any) => Math.max(max, c.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmCampaignChannels", {
      name: args.name,
      code: args.code,
      channelCategory: args.channelCategory,
      isDigital: args.isDigital,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateCampaignChannel = mutation({
  args: { token: v.optional(v.string()),
    campaignChannelId: v.id("crmCampaignChannels"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    channelCategory: v.optional(v.string()),
    isDigital: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCampaignChannels" }, async (ctx, args) => {
    const { token: _token, campaignChannelId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(campaignChannelId, updates);
  }),
});

export const deleteCampaignChannel = mutation({
  args: { token: v.optional(v.string()), campaignChannelId: v.id("crmCampaignChannels") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmCampaignChannels" }, async (ctx, args) => {
    await ctx.db.delete(args.campaignChannelId);
  }),
});

export const duplicateCampaignChannel = mutation({
  args: { token: v.optional(v.string()), campaignChannelId: v.id("crmCampaignChannels") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCampaignChannels" }, async (ctx, args) => {
    const original = await ctx.db.get(args.campaignChannelId);
    if (!original) throw new Error("Campaign channel not found");
    const all = await ctx.db.query("crmCampaignChannels").collect();
    const maxSeq = all.reduce((max: any, c: any) => Math.max(max, c.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmCampaignChannels", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      channelCategory: original.channelCategory,
      isDigital: original.isDigital,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderCampaignChannels = mutation({
  args: { token: v.optional(v.string()),
    campaignChannelIds: v.array(v.id("crmCampaignChannels")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCampaignChannels" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.campaignChannelIds.length; i++) {
      await ctx.db.patch(args.campaignChannelIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultChannels = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCampaignChannels" }, async (ctx) => {
    const existing = await ctx.db.query("crmCampaignChannels").collect();
    if (existing.length > 0) return { seeded: 0, message: "Campaign channels already exist" };

    const now = Date.now();
    for (const channel of DEFAULT_CHANNELS) {
      await ctx.db.insert("crmCampaignChannels", {
        ...channel,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_CHANNELS.length, message: "Default campaign channels created" };
  }),
});
