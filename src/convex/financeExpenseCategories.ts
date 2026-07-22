import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Rent", code: "RENT", expenseType: "Operational", budgetable: true, description: "Office and facility rent", color: "#4285f4", icon: "Home" },
  { name: "Utilities", code: "UTIL", expenseType: "Operational", budgetable: true, description: "Electricity, water, internet bills", color: "#34a853", icon: "Wifi" },
  { name: "Salary", code: "SALARY", expenseType: "Operational", budgetable: true, description: "Employee salaries and wages", color: "#a855f7", icon: "Users" },
  { name: "Travel", code: "TRAVEL", expenseType: "Travel", budgetable: true, description: "Business travel and accommodation", color: "#f59e0b", icon: "MapPin" },
  { name: "Marketing", code: "MKTG", expenseType: "Marketing", budgetable: true, description: "Marketing and advertising expenses", color: "#ea4335", icon: "Megaphone" },
  { name: "Equipment", code: "EQUIP", expenseType: "Capital", budgetable: true, description: "Capital equipment purchases", color: "#4f46e5", icon: "Monitor" },
  { name: "Maintenance", code: "MAINT", expenseType: "Maintenance", budgetable: true, description: "Repairs and maintenance", color: "#06b6d4", icon: "Wrench" },
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
      .query("financeExpenseCategories")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeExpenseCategories", baseFields(data, count));
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
    expenseType: v.string(),
    budgetable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeExpenseCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeExpenseCategories", {
      ...args,
      description: args.description ?? "",
      expenseType: source.expenseType,
      budgetable: source.budgetable,

      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("financeExpenseCategories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    expenseType: v.optional(v.string()),
    budgetable: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("ExpenseCategory not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeExpenseCategories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ExpenseCategory not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeExpenseCategories") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("ExpenseCategory not found");
    const all = await ctx.db
      .query("financeExpenseCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeExpenseCategories", {
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
  args: { orderedIds: v.array(v.id("financeExpenseCategories")) },
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
    return ctx.db.query("financeExpenseCategories").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeExpenseCategories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
