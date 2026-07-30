/**
 * Procurement Engine — Enterprise-Integrated
 *
 * All mutations use withScopeAndEvents for complete enterprise adoption:
 *   ✓ ScopeEngine authorization    ✓ Event Pipeline
 *   ✓ Timeline auto-recording     ✓ Auto-document generation
 *   ✓ Notification Matrix routing  ✓ Search indexing
 *   ✓ Dashboard refresh signals    ✓ Workflow + Automation triggers
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, withScopeCheck, scopeFromArgs, type ScopeAndEventsConfig } from "./withScopeAndEvents";
import { Id } from "./_generated/dataModel";

function generateNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ─── Enterprise Handler Factory ──────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration

function withProcurement<P extends Record<string, unknown>, R>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  getScope: (args: P) => { companyId?: string; branchId?: string; departmentId?: string },
  handler: (ctx: any, args: P, userId: Id<"users">) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scope = getScope(args);
    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module: "procurement",
        entity,
        getEntityCompanyId: () => scope.companyId,
        getEntityBranchId: () => scope.branchId,
        getEntityDepartmentId: () => scope.departmentId,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        triggerWorkflow: true,
        triggerAutomation: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2, userId as Id<"users">),
    );
    return wrappedHandler(ctx, args);
  };
}

// ─── VENDOR MASTER ─────────────────────────────────────

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
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withProcurement("create", "vendor", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    return ctx.db.insert("vendorMaster", {
      vendorName: args.vendorName,
      vendorCode: args.vendorCode,
      contactPerson: args.contactPerson,
      email: args.email,
      phone: args.phone,
      address: args.address,
      gstNumber: args.gstNumber,
      paymentTerms: args.paymentTerms,
      leadTime: args.leadTime,
      rating: args.rating,
      notes: args.notes,
      companyId: args.companyId,
      branchId: args.branchId,
      status: "active",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateVendor = mutation({
  args: {
    id: v.id("vendorMaster"),
    vendorName: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    leadTime: v.optional(v.number()),
    rating: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("blacklisted"))),
    notes: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withProcurement("update", "vendor", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const { id, companyId, branchId, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

export const listVendors = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("blacklisted"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let q: any = ctx.db.query("vendorMaster");
    if (args.status) {
      q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    }
    const results = await q.collect();
    // Scope-aware filtering
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      return scope.filterByScope(results);
    }
    return results;
  },
});

export const getVendor = query({
  args: { id: v.id("vendorMaster") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const vendor = await ctx.db.get(args.id);
    if (!vendor || !userId) return vendor;
    const { ScopeEngine } = await import("./scopeEngine");
    const scope = await ScopeEngine.forUser(ctx, userId);
    return scope.canRead(vendor as any) ? vendor : null;
  },
});

// ─── PURCHASE REQUISITIONS ─────────────────────────────

export const createRequisition = mutation({
  args: {
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
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
  handler: withProcurement("create", "purchase_requisition", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    const allReqs = await ctx.db.query("purchaseRequisitions").collect();
    const reqNumber = generateNumber("PR", allReqs.length + 1);
    const totalEstimated = args.items.reduce((s, i) => s + i.quantity * i.estimatedUnitPrice, 0);

    const reqId = await ctx.db.insert("purchaseRequisitions", {
      requisitionNumber: reqNumber,
      departmentId: args.departmentId,
      branchId: args.branchId,
      companyId: args.companyId,
      requestedBy: userId,
      priority: args.priority,
      notes: args.notes,
      status: "draft",
      totalEstimated,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (const item of args.items) {
      await ctx.db.insert("requisitionItems", {
        requisitionId: reqId,
        itemName: item.itemName,
        categoryId: item.categoryId,
        quantity: item.quantity,
        estimatedUnitPrice: item.estimatedUnitPrice,
        totalEstimated: item.quantity * item.estimatedUnitPrice,
        notes: item.notes,
        createdAt: Date.now(),
      });
    }

    return { id: reqId, requisitionNumber: reqNumber };
  }),
});

export const submitRequisitionForApproval = mutation({
  args: { id: v.id("purchaseRequisitions") },
  handler: withProcurement("update", "purchase_requisition", () => ({}), async (ctx, args) => {
    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "draft") throw new Error("Only draft requisitions can be submitted");
    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  }),
});

export const approveRequisition = mutation({
  args: {
    id: v.id("purchaseRequisitions"),
    approve: v.boolean(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withProcurement("approve", "purchase_requisition", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "pending_approval") throw new Error("Requisition is not pending approval");
    await ctx.db.patch(args.id, {
      status: args.approve ? "approved" : "rejected",
      approvedBy: userId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

export const listRequisitions = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"), v.literal("pending_approval"), v.literal("approved"),
      v.literal("rejected"), v.literal("ordered"), v.literal("completed"), v.literal("cancelled"),
    )),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let q: any = ctx.db.query("purchaseRequisitions");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.departmentId) q = q.filter((q2: any) => q2.eq(q2.field("departmentId"), args.departmentId));

    const reqs = await q.order("desc").collect();
    const enriched = await Promise.all(reqs.map(async (r: any) => {
      const items = await ctx.db.query("requisitionItems")
        .withIndex("requisitionId", (q2: any) => q2.eq("requisitionId", r._id))
        .collect();
      return { ...r, items };
    }));

    // Scope filtering
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      return scope.filterByScope(enriched);
    }
    return enriched;
  },
});

export const getRequisition = query({
  args: { id: v.id("purchaseRequisitions") },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.id);
    if (!req) return null;
    const items = await ctx.db.query("requisitionItems")
      .withIndex("requisitionId", (q: any) => q.eq("requisitionId", args.id))
      .collect();
    return { ...req, items };
  },
});

// ─── PURCHASE ORDERS ───────────────────────────────────

export const createPurchaseOrder = mutation({
  args: {
    requisitionId: v.optional(v.id("purchaseRequisitions")),
    vendorId: v.id("vendorMaster"),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
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
  handler: withProcurement("create", "purchase_order", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    const allPOs = await ctx.db.query("purchaseOrders").collect();
    const poNumber = generateNumber("PO", allPOs.length + 1);
    const subtotal = args.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const totalAmount = subtotal + args.taxAmount;

    const poId = await ctx.db.insert("purchaseOrders", {
      poNumber,
      requisitionId: args.requisitionId,
      vendorId: args.vendorId,
      departmentId: args.departmentId,
      branchId: args.branchId,
      companyId: args.companyId,
      orderDate: Date.now(),
      expectedDelivery: args.expectedDelivery,
      deliveryAddress: args.deliveryAddress,
      paymentTerms: args.paymentTerms,
      subtotal,
      taxAmount: args.taxAmount,
      totalAmount,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (const item of args.items) {
      await ctx.db.insert("purchaseOrderItems", {
        poId,
        itemName: item.itemName,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        receivedQuantity: 0,
        notes: item.notes,
        createdAt: Date.now(),
      });
    }

    if (args.requisitionId) {
      await ctx.db.patch(args.requisitionId, { status: "ordered", updatedAt: Date.now() });
    }

    return { id: poId, poNumber };
  }),
});

export const submitPOForApproval = mutation({
  args: { id: v.id("purchaseOrders") },
  handler: withProcurement("update", "purchase_order", () => ({}), async (ctx, args) => {
    const po = await ctx.db.get(args.id);
    if (!po) throw new Error("PO not found");
    if (po.status !== "draft") throw new Error("Only draft POs can be submitted");
    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  }),
});

export const approvePurchaseOrder = mutation({
  args: {
    id: v.id("purchaseOrders"),
    approve: v.boolean(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withProcurement("approve", "purchase_order", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const po = await ctx.db.get(args.id);
    if (!po) throw new Error("PO not found");
    if (po.status !== "pending_approval") throw new Error("PO is not pending approval");
    await ctx.db.patch(args.id, {
      status: args.approve ? "approved" : "rejected",
      approvedBy: userId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

export const listPurchaseOrders = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"), v.literal("pending_approval"), v.literal("approved"),
      v.literal("rejected"), v.literal("partially_received"), v.literal("received"), v.literal("cancelled"),
    )),
    vendorId: v.optional(v.id("vendorMaster")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let q: any = ctx.db.query("purchaseOrders");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.vendorId) q = q.filter((q2: any) => q2.eq(q2.field("vendorId"), args.vendorId));

    const pos = await q.order("desc").collect();
    const enriched = await Promise.all(pos.map(async (po: any) => {
      const items = await ctx.db.query("purchaseOrderItems")
        .withIndex("poId", (q2: any) => q2.eq("poId", po._id))
        .collect();
      const vendor = await ctx.db.get(po.vendorId);
      return { ...po, items, vendorName: vendor ? (vendor as any).vendorName : "Unknown" };
    }));

    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      return scope.filterByScope(enriched);
    }
    return enriched;
  },
});

export const getPurchaseOrder = query({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    const po = await ctx.db.get(args.id);
    if (!po) return null;
    const items = await ctx.db.query("purchaseOrderItems")
      .withIndex("poId", (q: any) => q.eq("poId", args.id))
      .collect();
    const vendor = await ctx.db.get(po.vendorId);
    return { ...po, items, vendorName: vendor ? (vendor as any).vendorName : "Unknown" };
  },
});

// ─── GOODS RECEIPTS ────────────────────────────────────

export const createGoodsReceipt = mutation({
  args: {
    poId: v.id("purchaseOrders"),
    deliveryNote: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
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
  handler: withProcurement("create", "goods_receipt", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const po = await ctx.db.get(args.poId);
    if (!po) throw new Error("Purchase order not found");

    const allReceipts = await ctx.db.query("goodsReceipts").collect();
    const receiptNumber = generateNumber("GRN", allReceipts.length + 1);

    const receiptId = await ctx.db.insert("goodsReceipts", {
      receiptNumber,
      poId: args.poId,
      vendorId: po.vendorId,
      receivedBy: userId,
      receiptDate: Date.now(),
      deliveryNote: args.deliveryNote,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let allAccepted = true;
    let anyReceived = false;

    for (const item of args.items) {
      await ctx.db.insert("goodsReceiptItems", {
        receiptId,
        poItemId: item.poItemId,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        acceptedQuantity: item.acceptedQuantity,
        rejectedQuantity: item.rejectedQuantity,
        rejectionReason: item.rejectionReason,
        createdAt: Date.now(),
      });

      if (item.acceptedQuantity > 0) anyReceived = true;
      if (item.rejectedQuantity > 0) allAccepted = false;

      if (item.poItemId) {
        const poi = await ctx.db.get(item.poItemId);
        if (poi) {
          const newReceived = (poi as any).receivedQuantity + item.acceptedQuantity;
          await ctx.db.patch(item.poItemId, { receivedQuantity: newReceived });
        }
      }

      if (item.itemId && item.acceptedQuantity > 0) {
        const invItem = await ctx.db.get(item.itemId);
        if (invItem) {
          const balanceBefore = (invItem as any).currentStock;
          const balanceAfter = balanceBefore + item.acceptedQuantity;
          await ctx.db.patch(item.itemId, { currentStock: balanceAfter, updatedAt: Date.now() });
          await ctx.db.insert("stockMovements", {
            itemId: item.itemId,
            warehouseId: (invItem as any).warehouseId,
            movementType: "purchase_receipt",
            quantity: item.acceptedQuantity,
            balanceBefore,
            balanceAfter,
            referenceType: "goods_receipt",
            referenceId: receiptId,
            performedBy: userId,
            createdAt: Date.now(),
          });
        }
      }
    }

    const poStatus = !anyReceived ? "approved" : allAccepted ? "received" : "partially_received";
    await ctx.db.patch(args.poId, { status: poStatus, updatedAt: Date.now() });
    const grnStatus = !anyReceived ? "pending" : allAccepted ? "complete" : "partial";
    await ctx.db.patch(receiptId, { status: grnStatus });

    return { id: receiptId, receiptNumber };
  }),
});

export const listGoodsReceipts = query({
  args: { poId: v.optional(v.id("purchaseOrders")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let q: any = ctx.db.query("goodsReceipts");
    if (args.poId) q = q.filter((q2: any) => q2.eq(q2.field("poId"), args.poId));
    const results = await q.order("desc").collect();
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      return scope.filterByScope(results);
    }
    return results;
  },
});

// ─── QUOTATION COMPARISON ──────────────────────────────

export const createQuotationComparison = mutation({
  args: {
    requisitionId: v.optional(v.id("purchaseRequisitions")),
    poId: v.optional(v.id("purchaseOrders")),
    comparisonData: v.string(),
    selectedVendorId: v.optional(v.id("vendorMaster")),
    notes: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withProcurement("create", "quotation_comparison", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const { companyId, branchId, ...rest } = args;
    return ctx.db.insert("quotationComparisons", {
      ...rest,
      preparedBy: userId,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const finalizeQuotationComparison = mutation({
  args: {
    id: v.id("quotationComparisons"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withProcurement("update", "quotation_comparison", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args) => {
    const comp = await ctx.db.get(args.id);
    if (!comp) throw new Error("Comparison not found");
    await ctx.db.patch(args.id, { status: "finalized", updatedAt: Date.now() });
    return args.id;
  }),
});

export const listQuotationComparisons = query({
  args: { requisitionId: v.optional(v.id("purchaseRequisitions")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let q: any = ctx.db.query("quotationComparisons");
    if (args.requisitionId) q = q.filter((q2: any) => q2.eq(q2.field("requisitionId"), args.requisitionId));
    const results = await q.order("desc").collect();
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      return scope.filterByScope(results);
    }
    return results;
  },
});

// ─── PROCUREMENT DASHBOARD ─────────────────────────────

export const getProcurementDashboard = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const pos = await ctx.db.query("purchaseOrders").collect();
    const reqs = await ctx.db.query("purchaseRequisitions").collect();
    const vendors = await ctx.db.query("vendorMaster").collect();

    let filteredPOs = pos;
    let filteredReqs = reqs;
    let filteredVendors = vendors;

    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      filteredPOs = scope.filterByScope(pos);
      filteredReqs = scope.filterByScope(reqs);
      filteredVendors = scope.filterByScope(vendors);
    }

    const totalPOValue = filteredPOs.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const pendingPOs = filteredPOs.filter((p: any) =>
      p.status === "draft" || p.status === "pending_approval" || p.status === "approved"
    ).length;
    const receivedPOs = filteredPOs.filter((p: any) =>
      p.status === "received" || p.status === "partially_received"
    ).length;
    const pendingApprovalReqs = filteredReqs.filter((r: any) => r.status === "pending_approval").length;
    const approvedReqs = filteredReqs.filter((r: any) => r.status === "approved").length;
    const activeVendors = filteredVendors.filter((v: any) => v.status === "active").length;

    return {
      totalPOValue,
      pendingPOs,
      receivedPOs,
      totalPOs: filteredPOs.length,
      pendingApprovalReqs,
      approvedReqs,
      totalReqs: filteredReqs.length,
      activeVendors,
      totalVendors: filteredVendors.length,
    };
  },
});
