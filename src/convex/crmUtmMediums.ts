import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_UTM_MEDIUMS = [
  { name: "CPC", code: "cpc", color: "#4285f4", icon: "DollarSign", description: "Cost-per-click paid advertising medium", sequence: 1 },
  { name: "Organic", code: "organic", color: "#34a853", icon: "Search", description: "Unpaid organic search medium", sequence: 2 },
  { name: "Social", code: "social", color: "#1877F2", icon: "Users", description: "Social media platform medium", sequence: 3 },
  { name: "Email", code: "email", color: "#ea4335", icon: "Mail", description: "Email marketing medium", sequence: 4 },
  { name: "Display", code: "display", color: "#fbbc04", icon: "MonitorPlay", description: "Display advertising network medium", sequence: 5 },
  { name: "Affiliate", code: "affiliate", color: "#a855f7", icon: "Handshake", description: "Affiliate marketing medium", sequence: 6 },
  { name: "Referral", code: "referral", color: "#d4a017", icon: "UserPlus", description: "Referral traffic medium", sequence: 7 },
  { name: "Video", code: "video", color: "#FF0000", icon: "Youtube", description: "Video platform medium", sequence: 8 },
  { name: "Banner", code: "banner", color: "#e8710a", icon: "Image", description: "Banner advertisement medium", sequence: 9 },
  { name: "Push", code: "push", color: "#4f46e5", icon: "Bell", description: "Push notification medium", sequence: 10 },
  { name: "SMS", code: "sms", color: "#34a853", icon: "MessageSquare", description: "SMS marketing medium", sequence: 11 },
  { name: "WhatsApp", code: "whatsapp", color: "#25D366", icon: "MessageCircle", description: "WhatsApp marketing medium", sequence: 12 },
];

export const listUtmMediums = query({
  args: {},
  handler: async (ctx) => {
    const mediums = await ctx.db.query("crmUtmMediums").collect();
    return mediums.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getUtmMedium = query({
  args: { utmMediumId: v.id("crmUtmMediums") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.utmMediumId);
  },
});

export const createUtmMedium = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("crmUtmMediums").collect();
    const maxSeq = all.reduce((max, m) => Math.max(max, m.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmUtmMediums", {
      name: args.name,
      code: args.code,
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

export const updateUtmMedium = mutation({
  args: {
    utmMediumId: v.id("crmUtmMediums"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { utmMediumId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(utmMediumId, updates);
  },
});

export const deleteUtmMedium = mutation({
  args: { utmMediumId: v.id("crmUtmMediums") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.utmMediumId);
  },
});

export const duplicateUtmMedium = mutation({
  args: { utmMediumId: v.id("crmUtmMediums") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.utmMediumId);
    if (!original) throw new Error("UTM medium not found");
    const all = await ctx.db.query("crmUtmMediums").collect();
    const maxSeq = all.reduce((max, m) => Math.max(max, m.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmUtmMediums", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_copy`,
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

export const reorderUtmMediums = mutation({
  args: {
    utmMediumIds: v.array(v.id("crmUtmMediums")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.utmMediumIds.length; i++) {
      await ctx.db.patch(args.utmMediumIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultUtmMediums = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmUtmMediums").collect();
    if (existing.length > 0) return { seeded: 0, message: "UTM mediums already exist" };

    const now = Date.now();
    for (const medium of DEFAULT_UTM_MEDIUMS) {
      await ctx.db.insert("crmUtmMediums", {
        ...medium,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_UTM_MEDIUMS.length, message: "Default UTM mediums created" };
  },
});
