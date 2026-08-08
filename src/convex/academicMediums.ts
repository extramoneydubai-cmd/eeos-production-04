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
  { name: "English", code: "EN", color: "#4285f4", icon: "Globe", description: "English medium of instruction for all subjects." },
  { name: "Hindi", code: "HI", color: "#e8710a", icon: "Languages", description: "Hindi medium of instruction for all subjects." },
  { name: "Arabic", code: "AR", color: "#0d9488", icon: "BookText", description: "Arabic medium of instruction for all subjects." },
  { name: "Urdu", code: "UR", color: "#4f46e5", icon: "BookMarked", description: "Urdu medium of instruction for all subjects." },
  { name: "French", code: "FR", color: "#1a73e8", icon: "Flag", description: "French medium of instruction for all subjects." },
  { name: "German", code: "DE", color: "#fbbc04", icon: "Flag", description: "German medium of instruction for all subjects." },
  { name: "Spanish", code: "ES", color: "#ea4335", icon: "Flag", description: "Spanish medium of instruction for all subjects." },
  { name: "Tamil", code: "TA", color: "#a855f7", icon: "BookOpen", description: "Tamil medium of instruction for all subjects." },
  { name: "Malayalam", code: "ML", color: "#34a853", icon: "BookOpen", description: "Malayalam medium of instruction for all subjects." },
  { name: "Kannada", code: "KN", color: "#06b6d4", icon: "BookOpen", description: "Kannada medium of instruction for all subjects." },
  { name: "Marathi", code: "MR", color: "#f43f5e", icon: "BookOpen", description: "Marathi medium of instruction for all subjects." },
  { name: "Gujarati", code: "GU", color: "#10b981", icon: "BookOpen", description: "Gujarati medium of instruction for all subjects." },
  { name: "Bilingual English/Hindi", code: "EN_HI", color: "#1a1a2e", icon: "BookType", description: "Bilingual instruction in English and Hindi." },
  { name: "English/Arabic", code: "EN_AR", color: "#d4a017", icon: "BookType", description: "Bilingual instruction in English and Arabic." },
];

export const listAcademicMediums = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicMediums").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicMedium = query({
  args: { mediumId: v.id("academicMediums") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mediumId);
  },
});

export const createAcademicMedium = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicMediums" }, async (ctx, args) => {
    const allItems = await ctx.db.query("academicMediums").collect();
    const maxSeq = allItems.reduce((max: any, s: any) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicMediums", {
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

export const updateAcademicMedium = mutation({
  args: { token: v.optional(v.string()),
    mediumId: v.id("academicMediums"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicMediums" }, async (ctx, args) => {
    const { token: _token, mediumId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(mediumId, updates);
  }),
});

export const deleteAcademicMedium = mutation({
  args: { token: v.optional(v.string()), mediumId: v.id("academicMediums") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "academicMediums" }, async (ctx, args) => {
    await ctx.db.delete(args.mediumId);
  }),
});

export const duplicateAcademicMedium = mutation({
  args: { token: v.optional(v.string()), mediumId: v.id("academicMediums") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicMediums" }, async (ctx, args) => {
    const original = await ctx.db.get(args.mediumId);
    if (!original) throw new Error("Academic medium not found");
    const allItems = await ctx.db.query("academicMediums").collect();
    const maxSeq = allItems.reduce((max: any, s: any) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicMediums", {
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

export const reorderAcademicMediums = mutation({
  args: { token: v.optional(v.string()),
    mediumIds: v.array(v.id("academicMediums")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicMediums" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.mediumIds.length; i++) {
      await ctx.db.patch(args.mediumIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultAcademicMediums = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicMediums" }, async (ctx) => {
    const existing = await ctx.db.query("academicMediums").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic mediums already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("academicMediums", {
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
    return { seeded: SEED_DATA.length, message: "Default academic mediums created" };
  }),
});
