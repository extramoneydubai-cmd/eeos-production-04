/**
 * Procurement SDK — Enterprise Procurement & Inventory
 *
 * Wraps procurementEngine.ts for vendor, PO, requisition, goods receipt,
 * quotation comparison, and inventory operations.
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Re-export from procurementEngine ────────────────────────
// These delegate to the existing procurementEngine Convex functions.

export const createVendor = mutation({
  args: {
    vendorName: v.string(),
    vendorCode: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    leadTime: v.optional(v.number()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createVendor: create } = await import("../convex/procurementEngine");
    return create.handler(ctx, args);
  },
});

export const listVendors = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { listVendors: list } = await import("../convex/procurementEngine");
    return list.handler(ctx, args as any);
  },
});

export const getVendor = query({
  args: { id: v.id("vendorMaster") },
  handler: async (ctx, args) => {
    const { getVendor: get } = await import("../convex/procurementEngine");
    return get.handler(ctx, args);
  },
});

export const createRequisition = mutation({
  args: {
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    notes: v.optional(v.string()),
    items: v.array(v.object({
      itemName: v.string(),
      categoryId: v.optional(v.id("inventoryCategories")),
      quantity: v.number(),
      estimatedUnitPrice: v.number(),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { createRequisition: create } = await import("../convex/procurementEngine");
    return create.handler(ctx, args as any);
  },
});

export const listRequisitions = query({
  args: { status: v.optional(v.string()), departmentId: v.optional(v.id("departments")) },
  handler: async (ctx, args) => {
    const { listRequisitions: list } = await import("../convex/procurementEngine");
    return list.handler(ctx, args as any);
  },
});

export const createPurchaseOrder = mutation({
  args: {
    requisitionId: v.optional(v.id("purchaseRequisitions")),
    vendorId: v.id("vendorMaster"),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    expectedDelivery: v.optional(v.number()),
    deliveryAddress: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    taxAmount: v.number(),
    notes: v.optional(v.string()),
    items: v.array(v.object({
      itemName: v.string(),
      itemId: v.optional(v.id("inventoryItems")),
      quantity: v.number(),
      unitPrice: v.number(),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { createPurchaseOrder: create } = await import("../convex/procurementEngine");
    return create.handler(ctx, args as any);
  },
});

export const listPurchaseOrders = query({
  args: { status: v.optional(v.string()), vendorId: v.optional(v.id("vendorMaster")) },
  handler: async (ctx, args) => {
    const { listPurchaseOrders: list } = await import("../convex/procurementEngine");
    return list.handler(ctx, args as any);
  },
});

export const createGoodsReceipt = mutation({
  args: {
    poId: v.id("purchaseOrders"),
    deliveryNote: v.optional(v.string()),
    items: v.array(v.object({
      poItemId: v.optional(v.id("purchaseOrderItems")),
      itemId: v.optional(v.id("inventoryItems")),
      itemName: v.string(),
      quantity: v.number(),
      acceptedQuantity: v.number(),
      rejectedQuantity: v.number(),
      rejectionReason: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { createGoodsReceipt: create } = await import("../convex/procurementEngine");
    return create.handler(ctx, args as any);
  },
});

export const submitPOForApproval = mutation({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    const { submitPOForApproval: submit } = await import("../convex/procurementEngine");
    return submit.handler(ctx, args);
  },
});

export const approvePurchaseOrder = mutation({
  args: { id: v.id("purchaseOrders"), approve: v.boolean() },
  handler: async (ctx, args) => {
    const { approvePurchaseOrder: approve } = await import("../convex/procurementEngine");
    return approve.handler(ctx, args);
  },
});

export const createQuotationComparison = mutation({
  args: {
    requisitionId: v.optional(v.id("purchaseRequisitions")),
    poId: v.optional(v.id("purchaseOrders")),
    comparisonData: v.string(),
    selectedVendorId: v.optional(v.id("vendorMaster")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createQuotationComparison: create } = await import("../convex/procurementEngine");
    return create.handler(ctx, args as any);
  },
});

// ─── Inventory ───────────────────────────────────────────────

export const listInventoryItems = query({
  args: { categoryId: v.optional(v.id("inventoryCategories")) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("inventoryItems");
    if (args.categoryId) q = q.filter((q2: any) => q2.eq(q2.field("categoryId"), args.categoryId));
    return q.collect();
  },
});

export const getInventoryItem = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── Procurement Dashboard ───────────────────────────────────

export const getProcurementDashboard = query({
  handler: async (ctx) => {
    const { getProcurementDashboard: dash } = await import("../convex/procurementEngine");
    return dash.handler(ctx, {} as any);
  },
});
