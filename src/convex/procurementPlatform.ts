/**
 * Procurement Platform — Enterprise Pipeline Integration
 *
 * All mutations use withScopeAndEvents for complete enterprise adoption:
 *   ✓ ScopeEngine authorization    ✓ Event Pipeline
 *   ✓ Timeline auto-recording     ✓ Auto-document generation
 *   ✓ Notification Matrix routing  ✓ Search indexing
 *   ✓ Dashboard refresh signals    ✓ Workflow + Automation triggers
 *
 * Every business module MUST use these platform mutations.
 * Do NOT bypass the enterprise pipeline.
 *
 * IMPORTANT: These wrappers maintain backward compatibility.
 * The original mutations in procurementEngine.ts, inventoryEngine.ts,
 * and assetEngine.ts remain unchanged.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";
import { Id } from "./_generated/dataModel";

// ─── Enterprise Handler Factory ──────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration.
// When a session token is supplied the withScopeAndEvents wrapper resolves
// the REAL performer from the sessions table; getAuthUserId (Convex auth
// headers) only applies to legacy flows.

function withPlatform<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  module: string,
  entity: string,
  getScope: (args: P) => { companyId?: string; branchId?: string; departmentId?: string },
  handler: (ctx: any, args: P, userId: Id<"users">) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const raw = args as any;
    const hasToken = typeof raw?.token === "string" && raw.token.length > 0;
    let userId: Id<"users"> | undefined;
    if (!hasToken) {
      userId = (await getAuthUserId(ctx)) as Id<"users"> | undefined;
    }

    const scope = getScope(args);
    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module,
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

// ═════════════════════════════════════════════════════════════════════
//  VENDOR MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

export const createVendor = mutation({
  args: {
    token: v.optional(v.string()),
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
  handler: withPlatform("create", "procurement", "vendor", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("vendorMaster", {
      ...args,
      status: "active",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  }),
});

export const updateVendor = mutation({
  args: {
    token: v.optional(v.string()),
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
  },
  handler: withPlatform("update", "procurement", "vendor", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  PURCHASE REQUISITIONS
// ═════════════════════════════════════════════════════════════════════

export const createRequisition = mutation({
  args: {
    token: v.optional(v.string()),
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
  handler: withPlatform("create", "procurement", "purchase_requisition", (a) => ({
    branchId: a.branchId,
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const allReqs = await ctx.db.query("purchaseRequisitions").collect();
    const reqNumber = `PR-${String(allReqs.length + 1).padStart(6, "0")}`;
    const totalEstimated = args.items.reduce((s: number, i: any) => s + i.quantity * i.estimatedUnitPrice, 0);

    const reqId = await ctx.db.insert("purchaseRequisitions", {
      requisitionNumber: reqNumber,
      departmentId: args.departmentId,
      branchId: args.branchId,
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
  args: { token: v.optional(v.string()), id: v.id("purchaseRequisitions") },
  handler: withPlatform("update", "procurement", "purchase_requisition", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "draft") throw new Error("Only draft requisitions can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  }),
});

export const approveRequisition = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("purchaseRequisitions"),
    approve: v.boolean(),
  },
  handler: withPlatform("approve", "procurement", "purchase_requisition", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "pending_approval") throw new Error("Requisition is not pending approval");

    const newStatus = args.approve ? "approved" : "rejected";
    await ctx.db.patch(args.id, {
      status: newStatus,
      approvedBy: userId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ═════════════════════════════════════════════════════════════════════

export const createPurchaseOrder = mutation({
  args: {
    token: v.optional(v.string()),
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
  handler: withPlatform("create", "procurement", "purchase_order", (a) => ({
    branchId: a.branchId,
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const allPOs = await ctx.db.query("purchaseOrders").collect();
    const poNumber = `PO-${String(allPOs.length + 1).padStart(6, "0")}`;
    const subtotal = args.items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
    const totalAmount = subtotal + args.taxAmount;

    const poId = await ctx.db.insert("purchaseOrders", {
      poNumber,
      requisitionId: args.requisitionId,
      vendorId: args.vendorId,
      departmentId: args.departmentId,
      branchId: args.branchId,
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
  args: { token: v.optional(v.string()), id: v.id("purchaseOrders") },
  handler: withPlatform("update", "procurement", "purchase_order", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const po = await ctx.db.get(args.id);
    if (!po) throw new Error("PO not found");
    if (po.status !== "draft") throw new Error("Only draft POs can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  }),
});

export const approvePurchaseOrder = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("purchaseOrders"),
    approve: v.boolean(),
  },
  handler: withPlatform("approve", "procurement", "purchase_order", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const po = await ctx.db.get(args.id);
    if (!po) throw new Error("PO not found");
    if (po.status !== "pending_approval") throw new Error("PO is not pending approval");

    const newStatus = args.approve ? "approved" : "rejected";
    await ctx.db.patch(args.id, {
      status: newStatus,
      approvedBy: userId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  GOODS RECEIPT
// ═════════════════════════════════════════════════════════════════════

export const createGoodsReceipt = mutation({
  args: {
    token: v.optional(v.string()),
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
  handler: withPlatform("create", "procurement", "goods_receipt", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const po = await ctx.db.get(args.poId);
    if (!po) throw new Error("Purchase order not found");

    const allReceipts = await ctx.db.query("goodsReceipts").collect();
    const receiptNumber = `GRN-${String(allReceipts.length + 1).padStart(6, "0")}`;

    const receiptId = await ctx.db.insert("goodsReceipts", {
      receiptNumber,
      poId: args.poId,
      vendorId: po.vendorId,
      receivedBy: userId,
      receiptDate: Date.now(),
      deliveryNote: args.deliveryNote,
      status: "pending",
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
    await ctx.db.patch(receiptId, { status: grnStatus, updatedAt: Date.now() });

    return { id: receiptId, receiptNumber };
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  INVENTORY
// ═════════════════════════════════════════════════════════════════════

export const createInventoryItem = mutation({
  args: {
    token: v.optional(v.string()),
    sku: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("inventoryCategories")),
    unit: v.string(),
    unitPrice: v.number(),
    minStock: v.number(),
    maxStock: v.number(),
    reorderLevel: v.number(),
    initialStock: v.number(),
    warehouseId: v.id("warehouses"),
    barcode: v.optional(v.string()),
    qrCode: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
  },
  handler: withPlatform("create", "inventory", "inventory_item", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const { initialStock, ...fields } = args;

    const id = await ctx.db.insert("inventoryItems", {
      ...fields,
      currentStock: initialStock,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (initialStock > 0) {
      await ctx.db.insert("stockMovements", {
        itemId: id,
        warehouseId: args.warehouseId,
        movementType: "purchase_receipt",
        quantity: initialStock,
        balanceBefore: 0,
        balanceAfter: initialStock,
        referenceType: "initial_stock",
        notes: "Initial stock entry",
        performedBy: userId,
        createdAt: Date.now(),
      });
    }

    return id;
  }),
});

export const adjustStock = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    newStock: v.number(),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("update", "inventory", "inventory_item", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const balanceBefore = (item as any).currentStock;
    const adjustment = args.newStock - balanceBefore;

    await ctx.db.patch(args.itemId, {
      currentStock: args.newStock,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("stockMovements", {
      itemId: args.itemId,
      warehouseId: (item as any).warehouseId,
      movementType: "stock_adjustment",
      quantity: adjustment,
      balanceBefore,
      balanceAfter: args.newStock,
      referenceType: "manual_adjustment",
      notes: args.notes || "Manual stock adjustment",
      performedBy: userId,
      createdAt: Date.now(),
    });

    return args.itemId;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  ISSUE & ASSET MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

export const issueItem = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    issuedTo: v.id("users"),
    quantity: v.number(),
    purpose: v.string(),
    departmentId: v.optional(v.id("departments")),
    expectedReturn: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("create", "inventory", "issue", (a) => ({
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if ((item as any).currentStock < args.quantity) throw new Error("Insufficient stock");

    const balanceBefore = (item as any).currentStock;
    const balanceAfter = balanceBefore - args.quantity;

    await ctx.db.patch(args.itemId, { currentStock: balanceAfter, updatedAt: Date.now() });

    const issueId = await ctx.db.insert("issueRegister", {
      itemId: args.itemId,
      issuedTo: args.issuedTo,
      issuedBy: userId,
      quantity: args.quantity,
      purpose: args.purpose,
      departmentId: args.departmentId,
      expectedReturn: args.expectedReturn,
      status: "issued",
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("stockMovements", {
      itemId: args.itemId,
      warehouseId: (item as any).warehouseId,
      movementType: "issue",
      quantity: args.quantity,
      balanceBefore,
      balanceAfter,
      referenceType: "issue_register",
      referenceId: issueId,
      notes: `Issued to ${args.issuedTo} for ${args.purpose}`,
      performedBy: userId,
      createdAt: Date.now(),
    });

    return { id: issueId, balanceAfter };
  }),
});

export const returnIssuedItem = mutation({
  args: {
    token: v.optional(v.string()),
    issueId: v.id("issueRegister"),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("update", "inventory", "issue", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue record not found");
    if ((issue as any).status !== "issued") throw new Error("Item is not currently issued");

    const item = await ctx.db.get((issue as any).itemId);
    if (item) {
      const balanceBefore = (item as any).currentStock;
      const balanceAfter = balanceBefore + (issue as any).quantity;

      await ctx.db.patch((issue as any).itemId, { currentStock: balanceAfter, updatedAt: Date.now() });

      await ctx.db.insert("stockMovements", {
        itemId: (issue as any).itemId,
        warehouseId: (item as any).warehouseId,
        movementType: "return",
        quantity: (issue as any).quantity,
        balanceBefore,
        balanceAfter,
        referenceType: "issue_register",
        referenceId: args.issueId,
        notes: args.notes || "Item returned",
        performedBy: userId,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.issueId, {
      status: "returned",
      returnedAt: Date.now(),
      notes: args.notes || (issue as any).notes,
      updatedAt: Date.now(),
    });

    return args.issueId;
  }),
});

export const allocateAsset = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    assetName: v.string(),
    assetTag: v.string(),
    allocatedTo: v.id("users"),
    departmentId: v.optional(v.id("departments")),
    expectedReturn: v.optional(v.number()),
    condition: v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("damaged")),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("create", "assets", "asset", (a) => ({
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("assetAllocations", {
      itemId: args.itemId,
      assetName: args.assetName,
      assetTag: args.assetTag,
      allocatedTo: args.allocatedTo,
      allocatedBy: userId,
      departmentId: args.departmentId,
      allocatedDate: Date.now(),
      expectedReturn: args.expectedReturn,
      condition: args.condition,
      status: "allocated",
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  }),
});

export const returnAsset = mutation({
  args: {
    token: v.optional(v.string()),
    assetId: v.id("assetAllocations"),
    condition: v.optional(v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("damaged"))),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("update", "assets", "asset", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset allocation not found");
    if ((asset as any).status !== "allocated") throw new Error("Asset is not currently allocated");

    await ctx.db.patch(args.assetId, {
      status: "returned",
      returnedAt: Date.now(),
      condition: args.condition || (asset as any).condition,
      notes: args.notes || (asset as any).notes,
      updatedAt: Date.now(),
    });

    return args.assetId;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  PAYMENT REQUESTS
// ═════════════════════════════════════════════════════════════════════

export const createPaymentRequest = mutation({
  args: {
    token: v.optional(v.string()),
    poId: v.optional(v.id("purchaseOrders")),
    vendorBillId: v.optional(v.id("vendorBills")),
    vendorId: v.id("vendorMaster"),
    amount: v.number(),
    description: v.string(),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    paymentMode: v.optional(v.union(
      v.literal("cash"), v.literal("bank_transfer"),
      v.literal("cheque"), v.literal("upi"),
      v.literal("card"), v.literal("online"),
    )),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("create", "procurement", "payment_request", (a) => ({
    branchId: a.branchId,
    departmentId: a.departmentId,
  }), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const allRequests = await ctx.db.query("paymentRequests").collect();
    const requestNumber = `PAY-${String(allRequests.length + 1).padStart(6, "0")}`;

    const id = await ctx.db.insert("paymentRequests", {
      requestNumber,
      poId: args.poId,
      vendorBillId: args.vendorBillId,
      vendorId: args.vendorId,
      amount: args.amount,
      description: args.description,
      departmentId: args.departmentId,
      branchId: args.branchId,
      requestedBy: userId,
      status: "draft",
      paymentMode: args.paymentMode,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { id, requestNumber };
  }),
});

export const submitPaymentRequest = mutation({
  args: { token: v.optional(v.string()), id: v.id("paymentRequests") },
  handler: withPlatform("update", "procurement", "payment_request", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const pr = await ctx.db.get(args.id);
    if (!pr) throw new Error("Payment request not found");
    if (pr.status !== "draft") throw new Error("Only draft payment requests can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  }),
});

export const approvePaymentRequest = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("paymentRequests"),
    approve: v.boolean(),
    paymentMode: v.optional(v.union(
      v.literal("cash"), v.literal("bank_transfer"),
      v.literal("cheque"), v.literal("upi"),
      v.literal("card"), v.literal("online"),
    )),
  },
  handler: withPlatform("approve", "procurement", "payment_request", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const pr = await ctx.db.get(args.id);
    if (!pr) throw new Error("Payment request not found");
    if (pr.status !== "pending_approval") throw new Error("Payment request is not pending approval");

    const newStatus = args.approve ? "approved" : "rejected";
    await ctx.db.patch(args.id, {
      status: newStatus,
      approvedBy: userId,
      approvedAt: Date.now(),
      paymentMode: args.paymentMode || (pr as any).paymentMode,
      updatedAt: Date.now(),
    });

    return args.id;
  }),
});

export const markPaymentPaid = mutation({
  args: { token: v.optional(v.string()), id: v.id("paymentRequests") },
  handler: withPlatform("update", "procurement", "payment_request", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const pr = await ctx.db.get(args.id);
    if (!pr) throw new Error("Payment request not found");
    if (pr.status !== "approved") throw new Error("Only approved payment requests can be marked paid");

    await ctx.db.patch(args.id, { status: "paid", paidAt: Date.now(), updatedAt: Date.now() });
    return args.id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  PROCUREMENT DASHBOARD
// ═════════════════════════════════════════════════════════════════════

export const getProcurementDashboard = query({
  handler: async (ctx) => {
    const pos = await ctx.db.query("purchaseOrders").collect();
    const reqs = await ctx.db.query("purchaseRequisitions").collect();
    const vendors = await ctx.db.query("vendorMaster").collect();
    const items = await ctx.db.query("inventoryItems").collect();
    const grns = await ctx.db.query("goodsReceipts").collect();
    const payReqs = await ctx.db.query("paymentRequests").collect();

    const totalPOValue = pos.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const pendingPOs = pos.filter((p: any) => p.status === "draft" || p.status === "pending_approval" || p.status === "approved").length;
    const receivedPOs = pos.filter((p: any) => p.status === "received" || p.status === "partially_received").length;

    return {
      totalPOValue,
      pendingPOs,
      receivedPOs,
      totalPOs: pos.length,
      pendingApprovalReqs: reqs.filter((r: any) => r.status === "pending_approval").length,
      approvedReqs: reqs.filter((r: any) => r.status === "approved").length,
      totalReqs: reqs.length,
      activeVendors: vendors.filter((v: any) => v.status === "active").length,
      totalVendors: vendors.length,
      totalItems: items.filter((i: any) => i.isActive).length,
      inventoryValue: items.reduce((s: number, i: any) => s + (i.currentStock * i.unitPrice), 0),
      lowStockCount: items.filter((i: any) => i.isActive && i.currentStock <= i.reorderLevel).length,
      pendingGrns: grns.filter((g: any) => g.status === "pending").length,
      pendingPayments: payReqs.filter((p: any) => p.status === "pending_approval" || p.status === "approved").length,
      totalPaymentRequests: payReqs.length,
    };
  },
});

// ═════════════════════════════════════════════════════════════════════
//  VENDOR BILLS (placeholder for finance integration)
// ═════════════════════════════════════════════════════════════════════

export const createVendorBill = mutation({
  args: {
    token: v.optional(v.string()),
    poId: v.optional(v.id("purchaseOrders")),
    vendorId: v.id("vendorMaster"),
    billNumber: v.string(),
    billDate: v.number(),
    amount: v.number(),
    taxAmount: v.number(),
    totalAmount: v.number(),
    dueDate: v.optional(v.number()),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: withPlatform("create", "procurement", "vendor_bill", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const vendor = await ctx.db.get(args.vendorId);
    const vendorName = vendor ? (vendor as any).vendorName || (vendor as any).name : "";

    const id = await ctx.db.insert("vendorBills", {
      ...args,
      vendorName,
      paidAmount: 0,
      balanceDue: args.totalAmount,
      dueDate: args.dueDate ?? Date.now() + 30 * 86400000,
      status: "pending",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  }),
});
