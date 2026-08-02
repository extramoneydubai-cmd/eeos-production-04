/**
 * Procurement Platform — Event Pipeline Integration
 *
 * This file provides event-pipeline-wrapped wrappers for critical
 * procurement, inventory, and asset mutations.
 *
 * These mutations automatically fire:
 *   - Audit Log (auditLogs table)
 *   - Timeline Event (timelineEvents table)
 *   - Activity Record (activities table)
 *   - Event Bus Event (events table)
 *   - Notification (notifications table — optional)
 *
 * Every business module MUST use these platform mutations.
 * Do NOT bypass the event pipeline.
 *
 * IMPORTANT: These wrappers maintain backward compatibility.
 * The original mutations in procurementEngine.ts, inventoryEngine.ts,
 * and assetEngine.ts remain unchanged.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Internal Helper: Record Events ───────────────────────────────────

function eventConfig(module: string, entity: string, action: string) {
  return { module, entity, action };
}

async function recordEvents(
  ctx: any,
  config: ReturnType<typeof eventConfig>,
  entityId: string | undefined,
  performedBy: any,
  description?: string,
) {
  if (!entityId || !performedBy) return;
  const now = Date.now();
  const eventType = `${config.module}.${config.entity}.${config.action}`;

  try {
    // 1. Audit Log
    await ctx.db.insert("auditLogs", {
      action: config.action,
      entity: config.entity,
      entityId,
      userId: performedBy,
      createdAt: now,
    });

    // 2. Timeline Event
    await ctx.db.insert("timelineEvents", {
      module: config.module,
      eventType,
      entityType: config.entity,
      entityId,
      title: `${config.module} ${config.entity} ${config.action}`,
      description,
      performedBy,
      createdAt: now,
    });

    // 3. Activity Record
    await ctx.db.insert("activities", {
      module: config.module,
      action: config.action,
      entityType: config.entity,
      entityId,
      description: description || `${config.module} ${config.entity} ${config.action}`,
      userId: performedBy,
      createdAt: now,
    });

    // 4. Event Bus Event
    await ctx.db.insert("events", {
      module: config.module,
      eventType,
      entityType: config.entity,
      entityId,
      performedBy,
      status: "published",
      publishedAt: now,
      createdAt: now,
    });
  } catch (error) {
    // Event pipeline failure must never break the business operation
    console.error(`[ProcurementPlatform] Failed to record events for ${eventType}:`, error);
  }
}

// ═════════════════════════════════════════════════════════════════════
//  VENDOR MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("vendorMaster", {
      ...args,
      status: "active",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await recordEvents(ctx, eventConfig("procurement", "vendor", "create"), id, userId, `Vendor ${args.vendorName} created`);
    return id;
  },
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });

    await recordEvents(ctx, eventConfig("procurement", "vendor", "update"), id, userId, `Vendor ${args.vendorName || id} updated`);
    return id;
  },
});

// ═════════════════════════════════════════════════════════════════════
//  PURCHASE REQUISITIONS
// ═════════════════════════════════════════════════════════════════════

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allReqs = await ctx.db.query("purchaseRequisitions").collect();
    const reqNumber = `PR-${String(allReqs.length + 1).padStart(6, "0")}`;
    const totalEstimated = args.items.reduce((s, i) => s + i.quantity * i.estimatedUnitPrice, 0);

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

    await recordEvents(ctx, eventConfig("procurement", "requisition", "create"), reqId, userId, `Requisition ${reqNumber} created with ${args.items.length} items`);
    return { id: reqId, requisitionNumber: reqNumber };
  },
});

export const submitRequisitionForApproval = mutation({
  args: { id: v.id("purchaseRequisitions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "draft") throw new Error("Only draft requisitions can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    await recordEvents(ctx, eventConfig("procurement", "requisition", "submit"), args.id, userId, `Requisition submitted for approval`);
    return args.id;
  },
});

export const approveRequisition = mutation({
  args: { id: v.id("purchaseRequisitions"), approve: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("procurement", "requisition", args.approve ? "approve" : "reject"), args.id, userId, `Requisition ${newStatus}`);
    return args.id;
  },
});

// ═════════════════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ═════════════════════════════════════════════════════════════════════

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allPOs = await ctx.db.query("purchaseOrders").collect();
    const poNumber = `PO-${String(allPOs.length + 1).padStart(6, "0")}`;
    const subtotal = args.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
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

    await recordEvents(ctx, eventConfig("procurement", "purchase_order", "create"), poId, userId, `PO ${poNumber} created for $${totalAmount.toFixed(2)}`);
    return { id: poId, poNumber };
  },
});

export const submitPOForApproval = mutation({
  args: { id: v.id("purchaseOrders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const po = await ctx.db.get(args.id);
    if (!po) throw new Error("PO not found");
    if (po.status !== "draft") throw new Error("Only draft POs can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    await recordEvents(ctx, eventConfig("procurement", "purchase_order", "submit"), args.id, userId, `PO submitted for approval`);
    return args.id;
  },
});

export const approvePurchaseOrder = mutation({
  args: { id: v.id("purchaseOrders"), approve: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("procurement", "purchase_order", args.approve ? "approve" : "reject"), args.id, userId, `PO ${newStatus}`);
    return args.id;
  },
});

// ═════════════════════════════════════════════════════════════════════
//  GOODS RECEIPT
// ═════════════════════════════════════════════════════════════════════

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
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("procurement", "goods_receipt", "create"), receiptId, userId, `GRN ${receiptNumber} — ${grnStatus}`);
    return { id: receiptId, receiptNumber };
  },
});

// ═════════════════════════════════════════════════════════════════════
//  INVENTORY
// ═════════════════════════════════════════════════════════════════════

export const createInventoryItem = mutation({
  args: {
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("inventory", "item", "create"), id, userId, `Item ${args.name} (${args.sku}) created with ${initialStock} units`);
    return id;
  },
});

export const adjustStock = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    newStock: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("inventory", "item", "adjust_stock"), args.itemId, userId, `Stock adjusted: ${balanceBefore} → ${args.newStock} (${adjustment >= 0 ? "+" : ""}${adjustment})`);
    return args.itemId;
  },
});

// ═════════════════════════════════════════════════════════════════════
//  ISSUE & ASSET MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

export const issueItem = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    issuedTo: v.id("users"),
    quantity: v.number(),
    purpose: v.string(),
    departmentId: v.optional(v.id("departments")),
    expectedReturn: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("inventory", "issue", "create"), issueId, userId, `Item issued: ${args.quantity} units for ${args.purpose}`);
    return { id: issueId, balanceAfter };
  },
});

export const returnIssuedItem = mutation({
  args: {
    issueId: v.id("issueRegister"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("inventory", "issue", "return"), args.issueId, userId, `Item returned`);
    return args.issueId;
  },
});

export const allocateAsset = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    assetName: v.string(),
    assetTag: v.string(),
    allocatedTo: v.id("users"),
    departmentId: v.optional(v.id("departments")),
    expectedReturn: v.optional(v.number()),
    condition: v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("damaged")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("assets", "asset", "allocate"), id, userId, `Asset ${args.assetName} (${args.assetTag}) allocated`);
    return id;
  },
});

export const returnAsset = mutation({
  args: {
    assetId: v.id("assetAllocations"),
    condition: v.optional(v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("damaged"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("assets", "asset", "return"), args.assetId, userId, `Asset returned`);
    return args.assetId;
  },
});

// ═════════════════════════════════════════════════════════════════════
//  PAYMENT REQUESTS
// ═════════════════════════════════════════════════════════════════════

export const createPaymentRequest = mutation({
  args: {
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("procurement", "payment_request", "create"), id, userId, `Payment request ${requestNumber} for $${args.amount.toFixed(2)}`);
    return { id, requestNumber };
  },
});

export const submitPaymentRequest = mutation({
  args: { id: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pr = await ctx.db.get(args.id);
    if (!pr) throw new Error("Payment request not found");
    if (pr.status !== "draft") throw new Error("Only draft payment requests can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    await recordEvents(ctx, eventConfig("procurement", "payment_request", "submit"), args.id, userId, `Payment request submitted for approval`);
    return args.id;
  },
});

export const approvePaymentRequest = mutation({
  args: {
    id: v.id("paymentRequests"),
    approve: v.boolean(),
    paymentMode: v.optional(v.union(
      v.literal("cash"), v.literal("bank_transfer"),
      v.literal("cheque"), v.literal("upi"),
      v.literal("card"), v.literal("online"),
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("procurement", "payment_request", args.approve ? "approve" : "reject"), args.id, userId, `Payment request ${newStatus}`);
    return args.id;
  },
});

export const markPaymentPaid = mutation({
  args: { id: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pr = await ctx.db.get(args.id);
    if (!pr) throw new Error("Payment request not found");
    if (pr.status !== "approved") throw new Error("Only approved payment requests can be marked paid");

    await ctx.db.patch(args.id, { status: "paid", paidAt: Date.now(), updatedAt: Date.now() });
    await recordEvents(ctx, eventConfig("procurement", "payment_request", "pay"), args.id, userId, `Payment completed`);
    return args.id;
  },
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
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

    await recordEvents(ctx, eventConfig("procurement", "vendor_bill", "create"), id, userId, `Vendor bill ${args.billNumber} for $${args.totalAmount.toFixed(2)}`);
    return id;
  },
});
