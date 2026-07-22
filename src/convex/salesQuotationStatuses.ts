import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Draft", code: "QST_DRAFT", statusCategory: "Pending", description: "Quotation is being drafted and not yet sent", color: "#9aa0a6", icon: "FileEdit" },
  { name: "Sent", code: "QST_SENT", statusCategory: "Pending", description: "Quotation has been sent to the lead", color: "#4285f4", icon: "Send" },
  { name: "Viewed", code: "QST_VIEWED", statusCategory: "Pending", description: "Lead has viewed the quotation", color: "#4f46e5", icon: "Eye" },
  { name: "Accepted", code: "QST_ACCEPTED", statusCategory: "Finalized", description: "Quotation has been accepted by the lead", color: "#34a853", icon: "CheckCircle" },
  { name: "Rejected", code: "QST_REJECTED", statusCategory: "Finalized", description: "Quotation has been rejected by the lead", color: "#ea4335", icon: "XCircle" },
  { name: "Expired", code: "QST_EXPIRED", statusCategory: "Finalized", description: "Quotation validity period has expired", color: "#5f6368", icon: "Clock" },
  { name: "Cancelled", code: "QST_CANCELLED", statusCategory: "Finalized", description: "Quotation was cancelled internally", color: "#f97316", icon: "Ban" },
  { name: "Revised", code: "QST_REVISED", statusCategory: "Pending", description: "Quotation has been revised and re-sent", color: "#a855f7", icon: "RefreshCw" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    statusCategory: data.statusCategory,
    description: data.description,
    color: data.color,
    icon: data.icon,
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
      .query("salesQuotationStatuses")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("salesQuotationStatuses", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  },
});

export const createQuotationStatus = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    statusCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("salesQuotationStatuses")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesQuotationStatuses", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateQuotationStatus = mutation({
  args: {
    id: v.id("salesQuotationStatuses"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    statusCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Quotation status not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteQuotationStatus = mutation({
  args: { id: v.id("salesQuotationStatuses") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Quotation status not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicateQuotationStatus = mutation({
  args: { id: v.id("salesQuotationStatuses") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Quotation status not found");
    const all = await ctx.db
      .query("salesQuotationStatuses")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesQuotationStatuses", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      statusCategory: source.statusCategory,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorderQuotationStatuses = mutation({
  args: { orderedIds: v.array(v.id("salesQuotationStatuses")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const listQuotationStatuses = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("salesQuotationStatuses").withIndex("sequence").collect();
  },
});

export const getQuotationStatus = query({
  args: { id: v.id("salesQuotationStatuses") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
