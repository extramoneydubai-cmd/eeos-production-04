import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const SEED_DATA: Array<{
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
}> = [
  { name: "Section A", code: "A", color: "#4285f4", icon: "LetterText", description: "Primary section A for standard classroom division." },
  { name: "Section B", code: "B", color: "#34a853", icon: "LetterText", description: "Primary section B for standard classroom division." },
  { name: "Section C", code: "C", color: "#ea4335", icon: "LetterText", description: "Primary section C for standard classroom division." },
  { name: "Section D", code: "D", color: "#fbbc04", icon: "LetterText", description: "Primary section D for standard classroom division." },
  { name: "Section E", code: "E", color: "#a855f7", icon: "LetterText", description: "Primary section E for standard classroom division." },
  { name: "Section F", code: "F", color: "#06b6d4", icon: "LetterText", description: "Primary section F for standard classroom division." },
  { name: "Section G", code: "G", color: "#0d9488", icon: "LetterText", description: "Primary section G for standard classroom division." },
  { name: "Section H", code: "H", color: "#f43f5e", icon: "LetterText", description: "Primary section H for standard classroom division." },
  { name: "Morning Section", code: "MORNING", color: "#e8710a", icon: "Sun", description: "Morning batch section for early-day classes." },
  { name: "Evening Section", code: "EVENING", color: "#1a1a2e", icon: "Moon", description: "Evening batch section for after-school hours." },
  { name: "Weekend Section", code: "WEEKEND", color: "#4f46e5", icon: "Calendar", description: "Weekend batch section for Saturday and Sunday." },
  { name: "Alpha Section", code: "ALPHA", color: "#f59e0b", icon: "Award", description: "Alpha section for advanced or honors track." },
  { name: "Beta Section", code: "BETA", color: "#10b981", icon: "Sigma", description: "Beta section for standard track." },
  { name: "Gold Section", code: "GOLD", color: "#d4a017", icon: "Trophy", description: "Gold section for premium or merit-based track." },
  { name: "Silver Section", code: "SILVER", color: "#9aa0a6", icon: "Medal", description: "Silver section for supplementary or support track." },
];

export const listAcademicSections = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicSections").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicSection = query({
  args: { sectionId: v.id("academicSections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sectionId);
  },
});

export const createAcademicSection = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicSections" }, async (ctx, args) => {
    const allItems = await ctx.db.query("academicSections").collect();
    const maxSeq = allItems.reduce((max: any, s: any) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicSections", {
      name: args.name,
      code: args.code,
      description: args.description,
      color: args.color,
      icon: args.icon,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateAcademicSection = mutation({
  args: { token: v.optional(v.string()),
    sectionId: v.id("academicSections"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicSections" }, async (ctx, args) => {
    const { token: _token, sectionId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(sectionId, updates);
  }),
});

export const deleteAcademicSection = mutation({
  args: { token: v.optional(v.string()), sectionId: v.id("academicSections") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "academicSections" }, async (ctx, args) => {
    await ctx.db.delete(args.sectionId);
  }),
});

export const duplicateAcademicSection = mutation({
  args: { token: v.optional(v.string()), sectionId: v.id("academicSections") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicSections" }, async (ctx, args) => {
    const original = await ctx.db.get(args.sectionId);
    if (!original) throw new Error("Academic section not found");
    const allItems = await ctx.db.query("academicSections").collect();
    const maxSeq = allItems.reduce((max: any, s: any) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicSections", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      description: original.description,
      color: original.color,
      icon: original.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderAcademicSections = mutation({
  args: { token: v.optional(v.string()),
    sectionIds: v.array(v.id("academicSections")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicSections" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.sectionIds.length; i++) {
      await ctx.db.patch(args.sectionIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultAcademicSections = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicSections" }, async (ctx) => {
    const existing = await ctx.db.query("academicSections").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic sections already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("academicSections", {
        name: seed.name,
        code: seed.code,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default academic sections created" };
  }),
});
