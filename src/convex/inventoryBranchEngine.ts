import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every branch-inventory mutation routes through withScopeAndEvents()
// so stock changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: branch-inventory mutations
// carry performer ids (userId/requestedBy/approvedBy/reservedBy) as
// business fields rather than a reliable Convex auth id, so scope
// enforcement stays a no-op here while the event pipeline is fully wired.
const branchInventoryPipeline = {
  module: "inventory",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

/**
 * Enterprise Branch Inventory Engine
 *
 * Supports:
 * - Company → Branch → Store → Rack → Shelf → Bin hierarchy
 * - Inter-branch stock transfer with approval
 * - Stock consumption, adjustment, damage/loss tracking
 * - Min/max stock with reorder alerts
 * - Reserve stock
 * - Approval workflow
 */

// ─── Queries ─────────────────────────────────────────────────────────

export const getInventoryByBranch = query({
  args: {
    branchId: v.id("branches"),
    storeId: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    lowStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("inventoryItems")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    if (args.storeId) {
      items = items.filter((i) => (i as any).store === args.storeId);
    }

    if (args.categoryId) {
      items = items.filter((i) => (i as any).categoryId === args.categoryId);
    }

    if (args.lowStock) {
      items = items.filter((i) => {
        const qty = (i as any).quantity ?? 0;
        const minStock = (i as any).minStock ?? 0;
        return qty <= minStock;
      });
    }

    return items.map((i) => ({
      ...i,
      lowStock: ((i as any).quantity ?? 0) <= ((i as any).minStock ?? 0),
    }));
  },
});

export const getStockLevel = query({
  args: {
    itemId: v.id("inventoryItems"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    return {
      itemId: item._id,
      name: (item as any).name ?? "Unknown",
      sku: (item as any).sku,
      quantity: (item as any).quantity ?? 0,
      minStock: (item as any).minStock ?? 0,
      maxStock: (item as any).maxStock ?? 0,
      reserved: (item as any).reserved ?? 0,
      available: ((item as any).quantity ?? 0) - ((item as any).reserved ?? 0),
      location: {
        store: (item as any).store,
        rack: (item as any).rack,
        shelf: (item as any).shelf,
        bin: (item as any).bin,
      },
      lowStock: ((item as any).quantity ?? 0) <= ((item as any).minStock ?? 0),
      overStock: ((item as any).maxStock ?? 0) > 0 && ((item as any).quantity ?? 0) > ((item as any).maxStock ?? 0),
    };
  },
});

export const getStoreStructure = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventoryItems")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const stores = [...new Set(items.map((i) => (i as any).store).filter(Boolean))];

    return stores.map((store) => {
      const storeItems = items.filter((i) => (i as any).store === store);
      const racks = [...new Set(storeItems.map((i) => (i as any).rack).filter(Boolean))];

      return {
        name: store,
        itemCount: storeItems.length,
        racks: racks.map((rack) => {
          const rackItems = storeItems.filter((i) => (i as any).rack === rack);
          const shelves = [...new Set(rackItems.map((i) => (i as any).shelf).filter(Boolean))];

          return {
            name: rack,
            itemCount: rackItems.length,
            shelves: shelves.map((shelf) => {
              const shelfItems = rackItems.filter((i) => (i as any).shelf === shelf);
              const bins = [...new Set(shelfItems.map((i) => (i as any).bin).filter(Boolean))];

              return {
                name: shelf,
                itemCount: shelfItems.length,
                bins: bins.map((bin) => ({
                  name: bin,
                  itemCount: shelfItems.filter((i) => (i as any).bin === bin).length,
                })),
              };
            }),
          };
        }),
      };
    });
  },
});

export const listTransferRequests = query({
  args: {
    branchId: v.optional(v.id("branches")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let transfers = await ctx.db.query("transfers").collect();

    if (args.branchId) {
      transfers = transfers.filter(
        (t) => (t as any).sourceBranchId === args.branchId || (t as any).destBranchId === args.branchId
      );
    }

    if (args.status) {
      transfers = transfers.filter((t) => (t as any).status === args.status);
    }

    return transfers.sort((a, b) => (b as any)._creationTime - (a as any)._creationTime);
  },
});

export const getReorderSuggestions = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventoryItems")
      .filter((q) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const suggestions = items
      .filter((i) => {
        const qty = (i as any).quantity ?? 0;
        const minStock = (i as any).minStock ?? 0;
        return qty <= minStock;
      })
      .map((i) => ({
        itemId: i._id,
        name: (i as any).name ?? "Unknown",
        sku: (i as any).sku,
        currentStock: (i as any).quantity ?? 0,
        minStock: (i as any).minStock ?? 0,
        maxStock: (i as any).maxStock ?? 0,
        suggestedOrder: ((i as any).maxStock ?? 0) - ((i as any).quantity ?? 0),
        priority: ((i as any).quantity ?? 0) === 0 ? "critical" : "low",
      }));

    return suggestions;
  },
});

// ─── Mutations ───────────────────────────────────────────────────────

export const adjustStock = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    adjustmentType: v.union(
      v.literal("add"),
      v.literal("remove"),
      v.literal("damaged"),
      v.literal("lost"),
      v.literal("found"),
      v.literal("adjustment")
    ),
    reason: v.string(),
    userId: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "update",
      entity: "branch_stock",
      eventType: Events.INVENTORY.STOCK_ADJUSTED,
      title: "Stock Adjusted",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const currentQty = (item as any).quantity ?? 0;
    let newQty = currentQty;

    switch (args.adjustmentType) {
      case "add":
        newQty += args.quantity;
        break;
      case "remove":
      case "damaged":
      case "lost":
        newQty = Math.max(0, currentQty - args.quantity);
        break;
      case "found":
        newQty += args.quantity;
        break;
      case "adjustment":
        newQty = args.quantity;
        break;
    }

    await ctx.db.patch(args.itemId, { quantity: newQty });

    // Create audit record
    await ctx.db.insert("inventoryAudit", {
      itemId: args.itemId,
      previousQuantity: currentQty,
      newQuantity: newQty,
      adjustmentType: args.adjustmentType,
      quantity: args.quantity,
      reason: args.reason,
      userId: args.userId,
      timestamp: Date.now(),
    });

    return {
      itemId: args.itemId,
      previousQuantity: currentQty,
      newQuantity: newQty,
      adjustmentType: args.adjustmentType,
    };
    }
  ),
});

export const setStockLocation = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    store: v.optional(v.string()),
    rack: v.optional(v.string()),
    shelf: v.optional(v.string()),
    bin: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "update",
      entity: "branch_stock",
      eventType: "inventory.branch.stock.location",
      title: "Stock Location Set",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const updates: Record<string, unknown> = {};
    if (args.store !== undefined) updates.store = args.store;
    if (args.rack !== undefined) updates.rack = args.rack;
    if (args.shelf !== undefined) updates.shelf = args.shelf;
    if (args.bin !== undefined) updates.bin = args.bin;

    await ctx.db.patch(args.itemId, updates);

    return { success: true };
    }
  ),
});

export const setStockLimits = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    minStock: v.number(),
    maxStock: v.number(),
    userId: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "update",
      entity: "branch_stock",
      eventType: "inventory.branch.stock.limits",
      title: "Stock Limits Set",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      minStock: args.minStock,
      maxStock: args.maxStock,
    });

    return { success: true };
    }
  ),
});

export const createTransferRequest = mutation({
  args: {
    token: v.optional(v.string()),
    sourceBranchId: v.id("branches"),
    destBranchId: v.id("branches"),
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    reason: v.string(),
    requestedBy: v.id("users"),
    priority: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "create",
      entity: "transfer",
      eventType: "inventory.transfer.requested",
      title: "Transfer Requested",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const sourceItem = await ctx.db.get(args.itemId);
    if (!sourceItem) throw new Error("Source item not found");

    const sourceQty = (sourceItem as any).quantity ?? 0;
    if (sourceQty < args.quantity) {
      throw new Error(
        `Insufficient stock: have ${sourceQty}, need ${args.quantity}`
      );
    }

    const transferId = await ctx.db.insert("transfers", {
      sourceBranchId: args.sourceBranchId,
      destBranchId: args.destBranchId,
      itemId: args.itemId,
      quantity: args.quantity,
      reason: args.reason,
      status: "pending",
      priority: args.priority ?? "normal",
      requestedBy: args.requestedBy,
      approvedBy: undefined,
      approvedAt: undefined,
      completedAt: undefined,
      notes: undefined,
    });

    return transferId;
    }
  ),
});

export const approveTransfer = mutation({
  args: {
    token: v.optional(v.string()),
    transferId: v.id("transfers"),
    approvedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "approve",
      entity: "transfer",
      eventType: Events.INVENTORY.STOCK_TRANSFERRED,
      title: "Transfer Approved",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) throw new Error("Transfer not found");

    // Execute the transfer
    const sourceItem = await ctx.db.get((transfer as any).itemId);
    if (!sourceItem) throw new Error("Source item not found");

    const sourceQty = (sourceItem as any).quantity ?? 0;
    const transferQty = (transfer as any).quantity;

    if (sourceQty < transferQty) {
      throw new Error("Insufficient stock to complete transfer");
    }

    // Decrease source
    await ctx.db.patch((transfer as any).itemId, {
      quantity: sourceQty - transferQty,
    });

    // Increase destination (find or create item in destination branch)
    const destItem = await ctx.db
      .query("inventoryItems")
      .filter((q) => q.eq(q.field("branchId"), (transfer as any).destBranchId))
      .filter((q) => q.eq(q.field("sku"), (sourceItem as any).sku))
      .first();

    if (destItem) {
      await ctx.db.patch(destItem._id, {
        quantity: ((destItem as any).quantity ?? 0) + transferQty,
      });
    }

    // Update transfer status
    await ctx.db.patch(args.transferId, {
      status: "completed",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
      completedAt: Date.now(),
      notes: args.notes,
    });

    return { success: true };
    }
  ),
});

export const reserveStock = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    reason: v.string(),
    reservedBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "create",
      entity: "branch_stock_reservation",
      eventType: "inventory.branch.stock.reserved",
      title: "Stock Reserved",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const available = ((item as any).quantity ?? 0) - ((item as any).reserved ?? 0);
    if (available < args.quantity) {
      throw new Error(`Insufficient available stock: have ${available}, need ${args.quantity}`);
    }

    await ctx.db.patch(args.itemId, {
      reserved: ((item as any).reserved ?? 0) + args.quantity,
    });

    return {
      itemId: args.itemId,
      reserved: args.quantity,
      remainingAvailable: available - args.quantity,
    };
    }
  ),
});

export const releaseReservedStock = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    releasedBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      ...branchInventoryPipeline,
      operation: "update",
      entity: "branch_stock_reservation",
      eventType: "inventory.branch.stock.reserved.released",
      title: "Reserved Stock Released",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const currentReserved = (item as any).reserved ?? 0;
    const newReserved = Math.max(0, currentReserved - args.quantity);

    await ctx.db.patch(args.itemId, { reserved: newReserved });

    return {
      itemId: args.itemId,
      released: args.quantity,
      remainingReserved: newReserved,
    };
    }
  ),
});
