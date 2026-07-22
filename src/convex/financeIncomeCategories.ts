import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Tuition Fee", code: "TUITION", incomeType: "Tuition Fee", isTaxable: true, description: "Student tuition fee income", color: "#4285f4", icon: "GraduationCap" },
  { name: "Admission Fee", code: "ADM_FEE", incomeType: "Admission Fee", isTaxable: true, description: "One-time admission fee income", color: "#34a853", icon: "FileText" },
  { name: "Hostel Fee", code: "HOSTEL", incomeType: "Hostel Fee", isTaxable: true, description: "Student hostel accommodation fee", color: "#a855f7", icon: "Home" },
  { name: "Transport Fee", code: "TRANSPORT", incomeType: "Transport Fee", isTaxable: true, description: "Student transport fee income", color: "#f59e0b", icon: "Bus" },
  { name: "Grant", code: "GRANT", incomeType: "Grant", isTaxable: false, description: "Government and research grants", color: "#06b6d4", icon: "Award" },
  { name: "Donation", code: "DONATION", incomeType: "Donation", isTaxable: false, description: "Charitable donations and endowments", color: "#ea4335", icon: "Heart" },
  { name: "Miscellaneous", code: "MISC", incomeType: "Miscellaneous", isTaxable: true, description: "Other income sources", color: "#9aa0a6", icon: "Coins" },
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
      .query("financeIncomeCategories")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeIncomeCategories", baseFields(data, count));
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
    incomeType: v.string(),
    isTaxable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeIncomeCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeIncomeCategories", {
      ...args,
      description: args.description ?? "",
      incomeType: source.incomeType,
      isTaxable: source.isTaxable,

      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("financeIncomeCategories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    incomeType: v.optional(v.string()),
    isTaxable: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("IncomeCategory not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeIncomeCategories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("IncomeCategory not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeIncomeCategories") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("IncomeCategory not found");
    const all = await ctx.db
      .query("financeIncomeCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeIncomeCategories", {
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
  args: { orderedIds: v.array(v.id("financeIncomeCategories")) },
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
    return ctx.db.query("financeIncomeCategories").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeIncomeCategories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
