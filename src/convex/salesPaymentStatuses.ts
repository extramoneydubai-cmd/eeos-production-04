import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Pending", code: "PENDING", statusCategory: "Pending", description: "Payment is pending", color: "#f59e0b", icon: "Clock" },
  { name: "Partially Paid", code: "PARTIAL", statusCategory: "Pending", description: "Partial payment received", color: "#4285f4", icon: "Clock" },
  { name: "Completed", code: "COMPLETED", statusCategory: "Completed", description: "Payment completed successfully", color: "#34a853", icon: "CheckCircle" },
  { name: "Failed", code: "FAILED", statusCategory: "Failed", description: "Payment processing failed", color: "#ea4335", icon: "XCircle" },
  { name: "Refunded", code: "REFUNDED", statusCategory: "Refunded", description: "Payment has been refunded", color: "#a855f7", icon: "RefreshCw" },
  { name: "Cancelled", code: "CANCELLED", statusCategory: "Cancelled", description: "Payment was cancelled", color: "#5f6368", icon: "Ban" },
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
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesPaymentStatuses" }, async (ctx) => {
    const existing = await ctx.db
      .query("salesPaymentStatuses")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("salesPaymentStatuses", baseFields(data, count));
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
    statusCategory: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesPaymentStatuses" }, async (ctx, args) => {
    const all = await ctx.db
      .query("salesPaymentStatuses")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesPaymentStatuses", {
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
    id: v.id("salesPaymentStatuses"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "salesPaymentStatuses" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("PaymentStatus not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const remove = mutation({
  args: { token: v.optional(v.string()), id: v.id("salesPaymentStatuses") },
  handler: withScopeAndEvents({ operation: "delete", module: "sales", entity: "salesPaymentStatuses" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("PaymentStatus not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicate = mutation({
  args: { token: v.optional(v.string()), id: v.id("salesPaymentStatuses") },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesPaymentStatuses" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("PaymentStatus not found");
    const all = await ctx.db
      .query("salesPaymentStatuses")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesPaymentStatuses", {
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
  }),
});

export const reorder = mutation({
  args: { token: v.optional(v.string()), orderedIds: v.array(v.id("salesPaymentStatuses")) },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "salesPaymentStatuses" }, async (ctx, args) => {
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
    return ctx.db.query("salesPaymentStatuses").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("salesPaymentStatuses") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
