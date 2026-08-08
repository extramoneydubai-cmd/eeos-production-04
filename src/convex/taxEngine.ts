/**
 * Tax Engine (Part 10)
 *
 * Configurable taxation supporting GST, VAT, Service Tax, Custom Tax.
 * Tax groups, categories, reports.
 * No country-specific hardcoding. Future-ready localization.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// TAX GROUP CRUD
// ═══════════════════════════════════════════════════════════════════

export const listTaxGroups = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("taxGroups") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("isActive"), true));
    return await q.collect();
  },
});

export const getTaxGroup = query({
  args: { id: v.id("taxGroups") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createTaxGroup = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    taxType: v.union(v.literal("gst"), v.literal("vat"), v.literal("service_tax"), v.literal("sales_tax"), v.literal("withholding"), v.literal("custom")),
    rate: v.number(),
    isCompound: v.boolean(),
    description: v.optional(v.string()),
    applicableToVerticals: v.optional(v.array(v.string())),
    applicableToCourses: v.optional(v.array(v.id("courses"))),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "taxEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("taxGroups", {
      ...args, isActive: true, createdAt: now, updatedAt: now,
    });
  }),
});

export const updateTaxGroup = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("taxGroups"),
    rate: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    effectiveTo: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "taxEngine" }, async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  }),
});

// ═══════════════════════════════════════════════════════════════════
// TAX CALCULATION
// ═══════════════════════════════════════════════════════════════════

export interface TaxCalculationResult {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  breakdown: Array<{ name: string; rate: number; amount: number; type: string }>;
}

export const calculateTax = query({
  args: {
    amount: v.number(),
    taxGroupIds: v.array(v.id("taxGroups")),
    isTaxInclusive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const taxGroups = await Promise.all(
      args.taxGroupIds.map((id) => ctx.db.get(id)),
    );

    const activeTaxes = taxGroups.filter((t: any) => t && t.isActive);
    const breakdown = activeTaxes.map((t: any) => ({
      name: t.name,
      rate: t.rate,
      amount: args.isTaxInclusive
        ? Math.round((args.amount * t.rate / (100 + t.rate)) * 100) / 100
        : Math.round((args.amount * t.rate / 100) * 100) / 100,
      type: t.taxType,
    }));

    const totalTax = breakdown.reduce((s: number, t: any) => s + t.amount, 0);

    return {
      taxableAmount: args.amount,
      taxAmount: totalTax,
      totalAmount: args.amount + totalTax,
      breakdown,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
// GST-SPECIFIC SUPPORT (configurable, not hardcoded)
// ═══════════════════════════════════════════════════════════════════

export const createGstRate = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    cgstRate: v.number(), sgstRate: v.number(),
    igstRate: v.optional(v.number()),
    description: v.optional(v.string()),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "taxEngine" }, async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("financeGstRates", {
      ...args,
      totalRate: (args.cgstRate + args.sgstRate + (args.igstRate || 0)),
      gstType: args.igstRate ? "igst" : "cgst_sgst",
      active: true, sequence: 0,
      color: "#10b981", icon: "Receipt",
      createdAt: now, updatedAt: now,
    });
  }),
});

export const listGstRates = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("financeGstRates") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("active"), true));
    return await q.collect();
  },
});

// ═══════════════════════════════════════════════════════════════════
// TAX REPORT
// ═══════════════════════════════════════════════════════════════════

export const getTaxReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    taxType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db.query("feeInvoices").collect();
    const filtered = invoices.filter((i: any) => {
      if (args.startDate && i.invoiceDate < args.startDate) return false;
      if (args.endDate && i.invoiceDate > args.endDate) return false;
      return true;
    });

    const totalTaxable = filtered.reduce((s: number, i: any) => s + i.subtotal, 0);
    const totalTax = filtered.reduce((s: number, i: any) => s + (i.taxAmount || 0), 0);

    return {
      period: { start: args.startDate || 0, end: args.endDate || Date.now() },
      totalInvoices: filtered.length,
      totalTaxableAmount: totalTaxable,
      totalTaxAmount: totalTax,
      invoiceCount: filtered.length,
    };
  },
});
