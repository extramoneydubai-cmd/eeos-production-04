import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Main Account", code: "MAIN", bankName: "Emirates NBD", accountNumber: "AE123456789", branchName: "Dubai Main", ifscCode: "EBILAEAD", swiftCode: "EBILAEAD", accountType: "Current", isDefault: true, description: "Primary operating account", color: "#4285f4", icon: "Building2" },
  { name: "Payroll Account", code: "PAYROLL", bankName: "Dubai Islamic Bank", accountNumber: "AE987654321", branchName: "DIFC", ifscCode: "DIBLAEAD", swiftCode: "DIBLAEAD", accountType: "Current", isDefault: false, description: "Employee salary account", color: "#34a853", icon: "Building2" },
  { name: "Savings Account", code: "SAVINGS", bankName: "ADCB", accountNumber: "AE555555555", branchName: "Abu Dhabi Main", ifscCode: "ADCBAEAA", swiftCode: "ADCBAEAA", accountType: "Savings", isDefault: false, description: "Corporate savings account", color: "#f59e0b", icon: "Building2" },
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
      .query("financeBankAccounts")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeBankAccounts", baseFields(data, count));
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
    bankName: v.string(),
    accountNumber: v.string(),
    branchName: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    swiftCode: v.optional(v.string()),
    accountType: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeBankAccounts")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeBankAccounts", {
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
    id: v.id("financeBankAccounts"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    branchName: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    swiftCode: v.optional(v.string()),
    accountType: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("BankAccount not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeBankAccounts") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("BankAccount not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeBankAccounts") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("BankAccount not found");
    const all = await ctx.db
      .query("financeBankAccounts")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeBankAccounts", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      bankName: source.bankName,
      accountNumber: source.accountNumber,
      branchName: source.branchName,
      ifscCode: source.ifscCode,
      swiftCode: source.swiftCode,
      accountType: source.accountType,
      isDefault: source.isDefault,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("financeBankAccounts")) },
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
    return ctx.db.query("financeBankAccounts").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeBankAccounts") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
