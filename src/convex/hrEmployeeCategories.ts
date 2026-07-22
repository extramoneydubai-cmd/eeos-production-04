import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Faculty", code: "FAC", categoryType: "Academic", description: "Teaching and research faculty members", color: "#4285f4", icon: "GraduationCap" },
  { name: "Staff", code: "STAFF", categoryType: "Non-Academic", description: "Administrative and support staff", color: "#34a853", icon: "Users" },
  { name: "Management", code: "MGMT", categoryType: "Leadership", description: "Management and leadership roles", color: "#a855f7", icon: "UserCog" },
  { name: "Contractual", code: "CONT", categoryType: "Temporary", description: "Contractual and outsourced employees", color: "#f59e0b", icon: "FileText" },
  { name: "Intern", code: "INTERN", categoryType: "Trainee", description: "Interns and trainees", color: "#0d9488", icon: "BookOpen" },
  { name: "Consultant", code: "CONS", categoryType: "Advisor", description: "External consultants and advisors", color: "#4f46e5", icon: "Briefcase" },
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
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("hrEmployeeCategories")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("hrEmployeeCategories", baseFields(data, count));
      count++;
    }
    return { seeded: count };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("hrEmployeeCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrEmployeeCategories", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("hrEmployeeCategories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("EmployeeCategory not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("hrEmployeeCategories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("EmployeeCategory not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("hrEmployeeCategories") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("EmployeeCategory not found");
    const all = await ctx.db
      .query("hrEmployeeCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrEmployeeCategories", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      color: source.color,
      icon: source.icon,
      description: source.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("hrEmployeeCategories")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("hrEmployeeCategories").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("hrEmployeeCategories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
