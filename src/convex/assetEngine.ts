import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every asset/issue mutation routes through withScopeAndEvents() so
// asset changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: asset mutations are called
// by the asset SDK and portals that pass performer strings rather than
// a reliable Convex user id, so scope enforcement stays a no-op here
// while the event pipeline is fully wired.
const assetPipeline = {
  module: "asset",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

// ─── ISSUE REGISTER ──────────────────────────────────

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
  handler: withScopeAndEvents(
    {
      ...assetPipeline,
      operation: "create",
      entity: "issue",
      eventType: "asset.issue.created",
      title: "Item Issued",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if ((item as any).currentStock < args.quantity) throw new Error("Insufficient stock");

    const balanceBefore = (item as any).currentStock;
    const balanceAfter = balanceBefore - args.quantity;

    // Update stock
    await ctx.db.patch(args.itemId, { currentStock: balanceAfter, updatedAt: Date.now() });

    // Create issue record
    const issueId = await ctx.db.insert("issueRegister", {
      itemId: args.itemId,
      issuedTo: args.issuedTo,
      issuedBy: userId,
      quantity: args.quantity,
      purpose: args.purpose,
      departmentId: args.departmentId,
      expectedReturn: args.expectedReturn,
      status: "issued",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Record stock movement
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
    }
  ),
});

export const returnIssuedItem = mutation({
  args: {
    issueId: v.id("issueRegister"),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...assetPipeline,
      operation: "update",
      entity: "issue",
      eventType: "asset.issue.returned",
      title: "Item Returned",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue record not found");
    if ((issue as any).status !== "issued") throw new Error("Item is not currently issued");

    const item = await ctx.db.get((issue as any).itemId);
    if (item) {
      const balanceBefore = (item as any).currentStock;
      const balanceAfter = balanceBefore + (issue as any).quantity;

      await ctx.db.patch((issue as any).itemId, {
        currentStock: balanceAfter,
        updatedAt: Date.now(),
      });

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
    }
  ),
});

export const listIssuedItems = query({
  args: {
    status: v.optional(v.union(v.literal("issued"), v.literal("returned"), v.literal("lost"), v.literal("damaged"))),
    issuedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("issueRegister");
    if (args.status) query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    if (args.issuedTo) query = query.filter((q: any) => q.eq(q.field("issuedTo"), args.issuedTo));
    return query.order("desc").collect();
  },
});

// ─── ASSET ALLOCATIONS ───────────────────────────────

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
  handler: withScopeAndEvents(
    {
      ...assetPipeline,
      operation: "create",
      entity: "asset_allocation",
      eventType: Events.INVENTORY.ASSET_ASSIGNED,
      title: "Asset Allocated",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
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

    return id;
    }
  ),
});

export const returnAsset = mutation({
  args: {
    assetId: v.id("assetAllocations"),
    condition: v.optional(v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("damaged"))),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...assetPipeline,
      operation: "update",
      entity: "asset_allocation",
      eventType: Events.INVENTORY.ASSET_RETURNED,
      title: "Asset Returned",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
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
    }
  ),
});

export const listAssetAllocations = query({
  args: {
    status: v.optional(v.union(v.literal("allocated"), v.literal("returned"), v.literal("lost"), v.literal("written_off"))),
    allocatedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("assetAllocations");
    if (args.status) query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    if (args.allocatedTo) query = query.filter((q: any) => q.eq(q.field("allocatedTo"), args.allocatedTo));
    return query.order("desc").collect();
  },
});

export const getAssetAllocation = query({
  args: { id: v.id("assetAllocations") },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.id);
    if (!allocation) return null;

    const item = await ctx.db.get((allocation as any).itemId);
    const allocatedToUser = await ctx.db.get((allocation as any).allocatedTo);
    const allocatedByUser = await ctx.db.get((allocation as any).allocatedBy);

    return {
      ...allocation,
      itemName: item ? (item as any).name : "Unknown",
      itemSku: item ? (item as any).sku : null,
      allocatedToName: allocatedToUser ? (allocatedToUser as any).name : "Unknown",
      allocatedByName: allocatedByUser ? (allocatedByUser as any).name : "Unknown",
    };
  },
});

// ─── RETURNS REGISTER ────────────────────────────────

export const recordReturn = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    warehouseId: v.id("warehouses"),
    returnedBy: v.id("users"),
    quantity: v.number(),
    returnType: v.union(v.literal("damaged"), v.literal("defective"), v.literal("excess"), v.literal("expired"), v.literal("other")),
    condition: v.optional(v.string()),
    disposition: v.union(v.literal("restock"), v.literal("write_off"), v.literal("return_to_vendor"), v.literal("scrap")),
    vendorId: v.optional(v.id("vendorMaster")),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...assetPipeline,
      operation: "create",
      entity: "return",
      eventType: "asset.return.recorded",
      title: "Return Recorded",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("returnsRegister", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Only restock if disposition is restock
    if (args.disposition === "restock") {
      const item = await ctx.db.get(args.itemId);
      if (item) {
        const balanceBefore = (item as any).currentStock;
        const balanceAfter = balanceBefore + args.quantity;
        await ctx.db.patch(args.itemId, { currentStock: balanceAfter, updatedAt: Date.now() });

        await ctx.db.insert("stockMovements", {
          itemId: args.itemId,
          warehouseId: args.warehouseId,
          movementType: "return",
          quantity: args.quantity,
          balanceBefore,
          balanceAfter,
          referenceType: "returns_register",
          referenceId: id,
          notes: args.notes || `Return: ${args.returnType} (${args.disposition})`,
          performedBy: userId,
          createdAt: Date.now(),
        });
      }
    }

    return id;
    }
  ),
});

export const listReturns = query({
  args: {
    returnType: v.optional(v.union(v.literal("damaged"), v.literal("defective"), v.literal("excess"), v.literal("expired"), v.literal("other"))),
    disposition: v.optional(v.union(v.literal("restock"), v.literal("write_off"), v.literal("return_to_vendor"), v.literal("scrap"))),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("returnsRegister");
    if (args.returnType) query = query.filter((q: any) => q.eq(q.field("returnType"), args.returnType));
    if (args.disposition) query = query.filter((q: any) => q.eq(q.field("disposition"), args.disposition));
    return query.order("desc").collect();
  },
});

// ─── ASSET DASHBOARD ─────────────────────────────────

export const getAssetDashboard = query({
  handler: async (ctx) => {
    const allocations = await ctx.db.query("assetAllocations").collect();
    const issues = await ctx.db.query("issueRegister").collect();

    return {
      totalAllocated: allocations.filter((a: any) => a.status === "allocated").length,
      totalReturned: allocations.filter((a: any) => a.status === "returned").length,
      totalLost: allocations.filter((a: any) => a.status === "lost").length + issues.filter((i: any) => i.status === "lost").length,
      totalIssued: issues.filter((i: any) => i.status === "issued").length,
      totalIssueReturned: issues.filter((i: any) => i.status === "returned").length,
      totalAllocations: allocations.length,
      totalIssues: issues.length,
    };
  },
});

/** Assets allocated/assigned to a specific employee. */
export const listEmployeeAssets = query({
  args: { employeeId: v.id("employeeMaster") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) return [];
    const person = employee.personId ? await ctx.db.get(employee.personId) : null;
    const allUsers = await ctx.db.query("users").collect();
    const linkedUser = allUsers.find(
      (u: any) => u.personId === (person?._id as any) || u.employeeId === (args.employeeId as any),
    );
    const userId = (linkedUser as any)?._id;
    const allocations = await ctx.db.query("assetAllocations").collect();
    const assets = allocations
      .filter(
        (a: any) => a.allocatedTo === userId || a.allocatedTo === (args.employeeId as any),
      )
      .map((a: any) => ({
        _id: a._id,
        assetName: a.assetName,
        assetType: "allocated",
        assetTag: a.assetTag,
        status: a.status === "allocated" ? "assigned" : a.status,
      }));
    const fixed = await ctx.db.query("fixedAssets").collect();
    const fixedAssets = fixed
      .filter(
        (f: any) => f.assignedTo === userId || f.assignedTo === (args.employeeId as any),
      )
      .map((f: any) => ({
        _id: f._id,
        assetName: f.name,
        assetType: "fixed",
        assetTag: f.assetCode,
        status: "assigned",
      }));
    return [...assets, ...fixedAssets];
  },
});
