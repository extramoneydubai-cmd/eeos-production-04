import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "JavaScript", code: "JS", skillCategory: "Technical", description: "JavaScript programming", color: "#f7df1e", icon: "Code" },
  { name: "Python", code: "PY", skillCategory: "Technical", description: "Python programming", color: "#3776AB", icon: "Code" },
  { name: "Leadership", code: "LEAD", skillCategory: "Management", description: "Team leadership and management", color: "#a855f7", icon: "UserCog" },
  { name: "Communication", code: "COMM", skillCategory: "Soft Skill", description: "Verbal and written communication", color: "#4285f4", icon: "MessageSquare" },
  { name: "Data Analysis", code: "DA", skillCategory: "Technical", description: "Data analysis and interpretation", color: "#34a853", icon: "FileSpreadsheet" },
  { name: "Public Speaking", code: "PUB_SPK", skillCategory: "Soft Skill", description: "Public speaking and presentations", color: "#ea4335", icon: "Megaphone" },
  { name: "UI/UX Design", code: "UIUX", skillCategory: "Creative", description: "User interface and experience design", color: "#06b6d4", icon: "Palette" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    ...data,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/* ────────────
   MUTATIONS
   ──────────── */

export const seedDefault = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "hrSkills" }, async (ctx) => {
    const existing = await ctx.db
      .query("hrSkills")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("hrSkills", baseFields(data, count));
      count++;
    }
    return { seeded: count };
  }),
});

export const create = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    skillCategory: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "hrSkills" }, async (ctx, args) => {
    const all = await ctx.db
      .query("hrSkills")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrSkills", {
      ...args,
      description: args.description ?? "",


      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const update = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("hrSkills"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    skillCategory: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "hrSkills" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Skill not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const remove = mutation({
  args: { token: v.optional(v.string()), id: v.id("hrSkills") },
  handler: withScopeAndEvents({ operation: "delete", module: "hr", entity: "hrSkills" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Skill not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicate = mutation({
  args: { token: v.optional(v.string()), id: v.id("hrSkills") },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "hrSkills" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Skill not found");
    const all = await ctx.db
      .query("hrSkills")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrSkills", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      skillCategory: source.skillCategory,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const reorder = mutation({
  args: { token: v.optional(v.string()), orderedIds: v.array(v.id("hrSkills")) },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "hrSkills" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("hrSkills").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("hrSkills") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
