import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_TAGS = [
  { name: "Scholarship", code: "SCHOLAR", color: "#34a853", icon: "GraduationCap", description: "Students eligible for scholarship programs", sequence: 1 },
  { name: "JEE", code: "JEE", color: "#4285f4", icon: "Brain", description: "JEE aspirants and related enquiries", sequence: 2 },
  { name: "NEET", code: "NEET", color: "#ea4335", icon: "HeartPulse", description: "NEET aspirants and medical stream enquiries", sequence: 3 },
  { name: "Foundation", code: "FOUND", color: "#a855f7", icon: "Rocket", description: "Foundation course students", sequence: 4 },
  { name: "Repeater", code: "REPEAT", color: "#e8710a", icon: "RefreshCw", description: "Repeater students", sequence: 5 },
  { name: "Hostel", code: "HOSTEL", color: "#06b6d4", icon: "Building2", description: "Students requiring hostel accommodation", sequence: 6 },
  { name: "Outstation", code: "OUT", color: "#4f46e5", icon: "MapPin", description: "Students from outstation locations", sequence: 7 },
  { name: "Working Professional", code: "WORK", color: "#5f6368", icon: "Briefcase", description: "Working professionals seeking upskilling", sequence: 8 },
  { name: "Corporate", code: "CORP", color: "#5f6368", icon: "Building", description: "Corporate leads and institutional enquiries", sequence: 9 },
  { name: "Parent Follow-up", code: "PARENT", color: "#fbbc04", icon: "Users", description: "Leads requiring parent follow-up", sequence: 10 },
  { name: "Hot Prospect", code: "HOT", color: "#ea4335", icon: "Flame", description: "Highly likely to convert soon", sequence: 11 },
  { name: "Cold Prospect", code: "COLD", color: "#9aa0a6", icon: "Snowflake", description: "Long-term prospects with low urgency", sequence: 12 },
  { name: "VIP", code: "VIP", color: "#fbbc04", icon: "Crown", description: "VIP leads requiring special attention", sequence: 13 },
  { name: "Management Quota", code: "MGMT", color: "#a855f7", icon: "Star", description: "Management quota admissions", sequence: 14 },
  { name: "Other", code: "OTHER", color: "#5f6368", icon: "Ellipsis", description: "Other uncategorized tags", sequence: 15 },
];

export const listTags = query({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db.query("crmTags").collect();
    return tags.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getTag = query({
  args: { tagId: v.id("crmTags") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tagId);
  },
});

export const createTag = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allTags = await ctx.db.query("crmTags").collect();
    const maxSeq = allTags.reduce((max, t) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmTags", {
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

export const updateTag = mutation({
  args: {
    tagId: v.id("crmTags"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tagId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(tagId, updates);
  },
});

export const deleteTag = mutation({
  args: { tagId: v.id("crmTags") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tagId);
  },
});

export const duplicateTag = mutation({
  args: { tagId: v.id("crmTags") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.tagId);
    if (!original) throw new Error("Tag not found");
    const allTags = await ctx.db.query("crmTags").collect();
    const maxSeq = allTags.reduce((max, t) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmTags", {
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

export const reorderTags = mutation({
  args: {
    tagIds: v.array(v.id("crmTags")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.tagIds.length; i++) {
      await ctx.db.patch(args.tagIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultTags = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmTags").collect();
    if (existing.length > 0) return { seeded: 0, message: "Tags already exist" };

    const now = Date.now();
    for (const tag of DEFAULT_TAGS) {
      await ctx.db.insert("crmTags", {
        ...tag,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_TAGS.length, message: "Default tags created" };
  },
});
