import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_SOURCES = [
  { name: "Website", code: "WEB", color: "#4285f4", icon: "Globe", description: "Organic website visits and form submissions", sequence: 1 },
  { name: "Walk-in", code: "WALK", color: "#34a853", icon: "UserRound", description: "Direct walk-in enquiries at the center", sequence: 2 },
  { name: "WhatsApp", code: "WA", color: "#25D366", icon: "MessageCircle", description: "Enquiries via WhatsApp messages", sequence: 3 },
  { name: "Facebook", code: "FB", color: "#1877F2", icon: "Facebook", description: "Facebook page and ad enquiries", sequence: 4 },
  { name: "Instagram", code: "IG", color: "#E4405F", icon: "Instagram", description: "Instagram profile and ad enquiries", sequence: 5 },
  { name: "Google Ads", code: "GADS", color: "#fbbc04", icon: "Search", description: "Google Ads campaign enquiries", sequence: 6 },
  { name: "Referral", code: "REF", color: "#a855f7", icon: "UserPlus", description: "Referred by existing students or partners", sequence: 7 },
  { name: "Seminar", code: "SEM", color: "#e8710a", icon: "Presentation", description: "Enquiries from seminars and workshops", sequence: 8 },
  { name: "Education Fair", code: "EDFAIR", color: "#1a73e8", icon: "BookOpen", description: "Enquiries from education fairs", sequence: 9 },
  { name: "YouTube", code: "YT", color: "#FF0000", icon: "Youtube", description: "YouTube channel and ad enquiries", sequence: 10 },
  { name: "LinkedIn", code: "LI", color: "#0A66C2", icon: "Linkedin", description: "LinkedIn profile and ad enquiries", sequence: 11 },
  { name: "Other", code: "OTH", color: "#5f6368", icon: "Ellipsis", description: "Other sources not listed above", sequence: 12 },
];

export const listSources = query({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query("crmSources").collect();
    return sources.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getSource = query({
  args: { sourceId: v.id("crmSources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

export const createSource = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allSources = await ctx.db.query("crmSources").collect();
    const maxSeq = allSources.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmSources", {
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

export const updateSource = mutation({
  args: {
    sourceId: v.id("crmSources"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sourceId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(sourceId, updates);
  },
});

export const deleteSource = mutation({
  args: { sourceId: v.id("crmSources") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sourceId);
  },
});

export const duplicateSource = mutation({
  args: { sourceId: v.id("crmSources") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.sourceId);
    if (!original) throw new Error("Source not found");
    const allSources = await ctx.db.query("crmSources").collect();
    const maxSeq = allSources.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmSources", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
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

export const reorderSources = mutation({
  args: {
    sourceIds: v.array(v.id("crmSources")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.sourceIds.length; i++) {
      await ctx.db.patch(args.sourceIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultSources = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmSources").collect();
    if (existing.length > 0) return { seeded: 0, message: "Sources already exist" };

    const now = Date.now();
    for (const source of DEFAULT_SOURCES) {
      await ctx.db.insert("crmSources", {
        ...source,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_SOURCES.length, message: "Default sources created" };
  },
});
