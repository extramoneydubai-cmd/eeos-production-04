import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Cash", code: "CASH", modeCategory: "Cash", isDigital: false, description: "Physical cash payment", color: "#34a853", icon: "Wallet" },
  { name: "Credit Card", code: "CC", modeCategory: "Card", isDigital: true, description: "Credit card payment", color: "#4285f4", icon: "CreditCard" },
  { name: "Debit Card", code: "DC", modeCategory: "Card", isDigital: true, description: "Debit card payment", color: "#1a73e8", icon: "CreditCard" },
  { name: "Bank Transfer", code: "BT", modeCategory: "Bank Transfer", isDigital: true, description: "Direct bank transfer", color: "#a855f7", icon: "Building2" },
  { name: "UPI", code: "UPI", modeCategory: "Digital", isDigital: true, description: "UPI payment", color: "#0d9488", icon: "Smartphone" },
  { name: "Cheque", code: "CHEQUE", modeCategory: "Cheque", isDigital: false, description: "Cheque payment", color: "#f59e0b", icon: "FileText" },
  { name: "Online Wallet", code: "WALLET", modeCategory: "Digital", isDigital: true, description: "Online wallet payment", color: "#ea4335", icon: "Wallet" },
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
      .query("financePaymentModes")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financePaymentModes", baseFields(data, count));
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
    modeCategory: v.string(),
    isDigital: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financePaymentModes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financePaymentModes", {
      ...args,
      description: args.description ?? "",
      modeCategory: source.modeCategory,
      isDigital: source.isDigital,

      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("financePaymentModes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    modeCategory: v.optional(v.string()),
    isDigital: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("PaymentMode not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financePaymentModes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("PaymentMode not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financePaymentModes") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("PaymentMode not found");
    const all = await ctx.db
      .query("financePaymentModes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financePaymentModes", {
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
  args: { orderedIds: v.array(v.id("financePaymentModes")) },
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
    return ctx.db.query("financePaymentModes").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financePaymentModes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
