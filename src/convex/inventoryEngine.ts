import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every inventory mutation routes through withScopeAndEvents() so
// inventory changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: inventory mutations are
// called by the inventory SDK and portals that pass performer strings
// rather than a reliable Convex user id, so scope enforcement stays a
// no-op here while the event pipeline is fully wired.
const inventoryPipeline = {
  module: "inventory",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

// ─── INVENTORY CATEGORIES ─────────────────────────────

export const createCategory = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("inventoryCategories")),
  },
  handler: withScopeAndEvents(
    {
      ...inventoryPipeline,
      operation: "create",
      entity: "inventory_category",
      eventType: "inventory.category.created",
      title: "Inventory Category Created",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("inventoryCategories", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const listCategories = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("inventoryCategories");
    if (args.isActive !== undefined) query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    return query.collect();
  },
});

// ─── WAREHOUSES ───────────────────────────────────────

export const createWarehouse = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    branchId: v.optional(v.id("branches")),
    location: v.optional(v.string()),
    type: v.union(v.literal("warehouse"), v.literal("branch_store"), v.literal("department_store")),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...inventoryPipeline,
      operation: "create",
      entity: "warehouse",
      eventType: "inventory.warehouse.created",
      title: "Warehouse Created",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("warehouses", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const listWarehouses = query({
  args: {
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("warehouses");
    if (args.isActive !== undefined) query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    if (args.branchId) query = query.filter((q: any) => q.eq(q.field("branchId"), args.branchId));
    return query.collect();
  },
});

// ─── INVENTORY ITEMS ──────────────────────────────────

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
  handler: withScopeAndEvents(
    {
      ...inventoryPipeline,
      operation: "create",
      entity: "inventory_item",
      eventType: Events.INVENTORY.STOCK_ADDED,
      title: "Inventory Item Created",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
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

    // Record initial stock movement
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
    }
  ),
});

export const updateInventoryItem = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("inventoryItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("inventoryCategories")),
    unitPrice: v.optional(v.number()),
    minStock: v.optional(v.number()),
    maxStock: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    barcode: v.optional(v.string()),
    qrCode: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents(
    {
      ...inventoryPipeline,
      operation: "update",
      entity: "inventory_item",
      eventType: "inventory.item.updated",
      title: "Inventory Item Updated",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
    }
  ),
});

export const adjustStock = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    newStock: v.number(),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...inventoryPipeline,
      operation: "update",
      entity: "inventory_item",
      eventType: Events.INVENTORY.STOCK_ADJUSTED,
      title: "Stock Adjusted",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
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

    return args.itemId;
    }
  ),
});

export const listInventoryItems = query({
  args: {
    categoryId: v.optional(v.id("inventoryCategories")),
    warehouseId: v.optional(v.id("warehouses")),
    lowStockOnly: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("inventoryItems");

    if (args.warehouseId) {
      query = query.filter((q: any) => q.eq(q.field("warehouseId"), args.warehouseId));
    }
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }

    let items = await query.collect();

    if (args.categoryId) {
      items = items.filter((i: any) => i.categoryId === args.categoryId);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      items = items.filter((i: any) =>
        i.name.toLowerCase().includes(s) ||
        i.sku.toLowerCase().includes(s) ||
        (i.barcode && i.barcode.includes(s))
      );
    }
    if (args.lowStockOnly) {
      items = items.filter((i: any) => i.currentStock <= i.reorderLevel);
    }

    // Enrich with category names
    const enriched = await Promise.all(items.map(async (item: any) => {
      let categoryName: string | null = null;
      if (item.categoryId) {
        const cat = await ctx.db.get(item.categoryId);
        categoryName = cat ? (cat as any).name : null;
      }
      return { ...item, categoryName };
    }));

    return enriched;
  },
});

export const getInventoryItem = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    let categoryName: string | null = null;
    if (item.categoryId) {
      const cat = await ctx.db.get(item.categoryId);
      categoryName = cat ? (cat as any).name : null;
    }

    return { ...item, categoryName };
  },
});

export const getItemStockMovements = query({
  args: { itemId: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    return ctx.db.query("stockMovements")
      .withIndex("itemId", (q: any) => q.eq("itemId", args.itemId))
      .order("desc")
      .collect();
  },
});

// ─── STOCK MOVEMENTS ──────────────────────────────────

export const recordStockMovement = mutation({
  args: {
    token: v.optional(v.string()),
    itemId: v.id("inventoryItems"),
    warehouseId: v.id("warehouses"),
    movementType: v.union(
      v.literal("purchase_receipt"), v.literal("stock_adjustment"),
      v.literal("issue"), v.literal("return"), v.literal("transfer"),
      v.literal("damaged"), v.literal("expired"),
    ),
    quantity: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...inventoryPipeline,
      operation: "create",
      entity: "stock_movement",
      eventType: "inventory.stock.movement",
      title: "Stock Movement Recorded",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const balanceBefore = (item as any).currentStock;
    let newStock = balanceBefore;

    if (["return", "purchase_receipt"].includes(args.movementType)) {
      newStock += args.quantity;
    } else {
      newStock -= args.quantity;
    }

    const balanceAfter = Math.max(0, newStock);

    await ctx.db.patch(args.itemId, {
      currentStock: balanceAfter,
      updatedAt: Date.now(),
    });

    const id = await ctx.db.insert("stockMovements", {
      ...args,
      balanceBefore,
      balanceAfter,
      performedBy: userId,
      createdAt: Date.now(),
    });

    return { id, balanceBefore, balanceAfter };
    }
  ),
});

// ─── INVENTORY DASHBOARD ──────────────────────────────

export const getInventoryDashboard = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("inventoryItems").collect();
    const activeItems = items.filter((i: any) => i.isActive);

    const totalValue = activeItems.reduce((s: number, i: any) => s + (i.currentStock * i.unitPrice), 0);
    const lowStockItems = activeItems.filter((i: any) => i.currentStock <= i.reorderLevel);
    const outOfStockItems = activeItems.filter((i: any) => i.currentStock <= 0);

    const warehouses = await ctx.db.query("warehouses").collect();
    const categories = await ctx.db.query("inventoryCategories").collect();

    return {
      totalItems: activeItems.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      warehouseCount: warehouses.filter((w: any) => w.isActive).length,
      categoryCount: categories.filter((c: any) => c.isActive).length,
      totalStock: activeItems.reduce((s: number, i: any) => s + i.currentStock, 0),
    };
  },
});

export const getLowStockAlerts = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("inventoryItems").collect();
    const lowStock = items
      .filter((i: any) => i.isActive && i.currentStock <= i.reorderLevel)
      .map((i: any) => ({
        id: i._id,
        name: i.name,
        sku: i.sku,
        currentStock: i.currentStock,
        minStock: i.minStock,
        reorderLevel: i.reorderLevel,
        maxStock: i.maxStock,
        unit: i.unit,
      }))
      .sort((a: any, b: any) => a.currentStock - b.currentStock);

    return lowStock;
  },
});
