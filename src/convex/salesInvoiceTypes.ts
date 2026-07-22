import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Standard Invoice", code: "STD", invoiceCategory: "Standard", description: "Standard sales invoice", color: "#4285f4", icon: "FileText" },
  { name: "Proforma Invoice", code: "PRO", invoiceCategory: "Proforma", description: "Proforma invoice for quotation", color: "#a855f7", icon: "FileText" },
  { name: "Credit Note", code: "CN", invoiceCategory: "Credit Note", description: "Credit note for returns/adjustments", color: "#34a853", icon: "FileText" },
  { name: "Debit Note", code: "DN", invoiceCategory: "Debit Note", description: "Debit note for additional charges", color: "#ea4335", icon: "FileText" },
  { name: "Recurring Invoice", code: "RECUR", invoiceCategory: "Recurring", description: "Recurring subscription invoice", color: "#f59e0b", icon: "RefreshCw" },
  { name: "Final Invoice", code: "FINAL", invoiceCategory: "Final", description: "Final settlement invoice", color: "#06b6d4", icon: "CheckCircle" },
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
      .query("salesInvoiceTypes")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("salesInvoiceTypes", baseFields(data, count));
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
    invoiceCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("salesInvoiceTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesInvoiceTypes", {
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
    id: v.id("salesInvoiceTypes"),
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
    if (!existing) throw new Error("InvoiceType not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("salesInvoiceTypes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("InvoiceType not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("salesInvoiceTypes") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("InvoiceType not found");
    const all = await ctx.db
      .query("salesInvoiceTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesInvoiceTypes", {
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
  args: { orderedIds: v.array(v.id("salesInvoiceTypes")) },
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
    return ctx.db.query("salesInvoiceTypes").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("salesInvoiceTypes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
