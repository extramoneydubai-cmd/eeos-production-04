/**
 * Fixed Asset Accounting Engine (Part 12)
 *
 * Asset purchase → capitalization → depreciation → transfer → write-off → disposal.
 * Asset categories, ledger, maintenance tracking.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every fixed-asset mutation routes through withScopeAndEvents() so
// asset lifecycle changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: fixed-asset mutations are called
// by the asset SDK and portals that pass performer strings rather than a
// reliable Convex user id, so scope enforcement stays a no-op here while the
// event pipeline is fully wired. Where the args carry branch/department scope
// it is still recorded on audit, timeline and event rows.
const fixedAssetPipeline = {
  module: "asset",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  // Accessor params are intentionally untyped (any): typed signatures would
  // constrain the generic args type P to a narrow shape and break handler
  // arg access. Scope is still resolved from args at runtime and recorded on
  // audit, timeline and event rows.
  getEntityBranchId: (args: any) => args.branchId ?? args.newBranchId,
  getEntityDepartmentId: (args: any) => args.departmentId ?? args.newDepartmentId,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

// ═══════════════════════════════════════════════════════════════════
// ASSET CATEGORIES
// ═══════════════════════════════════════════════════════════════════

export const listAssetCategories = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("assetCategories") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("isActive"), true));
    return await q.collect();
  },
});

export const createAssetCategory = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    depreciationMethod: v.union(v.literal("straight_line"), v.literal("declining"), v.literal("sum_of_years"), v.literal("units_of_production"), v.literal("none")),
    usefulLifeYears: v.number(),
    depreciationRate: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "create",
      entity: "asset_category",
      eventType: "asset.fixed.category.created",
      title: "Asset Category Created",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("assetCategories", {
      ...args, isActive: true, createdAt: now, updatedAt: now,
    });
    }
  ),
});

// ═══════════════════════════════════════════════════════════════════
// FIXED ASSET CRUD
// ═══════════════════════════════════════════════════════════════════

export const listFixedAssets = query({
  args: {
    categoryId: v.optional(v.id("assetCategories")),
    status: v.optional(v.string()),
    branchId: v.optional(v.id("orgBranches")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("fixedAssets") as any;
    if (args.categoryId) q = q.filter((f: any) => f.eq(f.field("categoryId"), args.categoryId));
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.branchId) q = q.filter((f: any) => f.eq(f.field("branchId"), args.branchId));
    return await q.order("desc").collect();
  },
});

export const getFixedAsset = query({
  args: { id: v.id("fixedAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) return null;
    const category = asset.categoryId ? await ctx.db.get(asset.categoryId as any) : null;
    return { ...asset, categoryName: category ? (category as any).name : "Unknown" };
  },
});

export const createFixedAsset = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(), assetCode: v.string(),
    categoryId: v.id("assetCategories"),
    purchaseDate: v.number(),
    purchaseCost: v.number(),
    branchId: v.optional(v.id("orgBranches")),
    departmentId: v.optional(v.id("departments")),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    vendorName: v.optional(v.string()),
    usefulLifeYears: v.optional(v.number()),
  },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "create",
      entity: "fixed_asset",
      eventType: "asset.fixed.created",
      title: "Fixed Asset Created",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();

    const category = await ctx.db.get(args.categoryId);
    const lifeYears = args.usefulLifeYears || (category ? (category as any).usefulLifeYears : 5);

    return await ctx.db.insert("fixedAssets", {
      ...args,
      usefulLifeYears: lifeYears,
      currentValue: args.purchaseCost,
      salvageValue: 0,
      accumulatedDepreciation: 0,
      status: "active",
      assignedTo: undefined,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const updateFixedAsset = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("fixedAssets"),
    location: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    assignedTo: v.optional(v.id("users")),
    description: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "update",
      entity: "fixed_asset",
      eventType: "asset.fixed.updated",
      title: "Fixed Asset Updated",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
    }
  ),
});

// ═══════════════════════════════════════════════════════════════════
// DEPRECIATION
// ═══════════════════════════════════════════════════════════════════

export const calculateDepreciation = mutation({
  args: { token: v.optional(v.string()), assetId: v.id("fixedAssets") },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "update",
      entity: "fixed_asset",
      eventType: "asset.fixed.depreciation.calculated",
      title: "Depreciation Calculated",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const assetData = asset as any;
    if (assetData.status !== "active") throw new Error("Asset is not active");

    const category = await ctx.db.get(assetData.categoryId);
    const method = category ? (category as any).depreciationMethod : "straight_line";
    const lifeYears = assetData.usefulLifeYears || 5;
    const purchaseCost = assetData.purchaseCost;
    const salvageValue = assetData.salvageValue || 0;
    const currentValue = assetData.currentValue || purchaseCost;
    const now = Date.now();

    let depreciationAmount = 0;
    let newValue = currentValue;

    switch (method) {
      case "straight_line": {
        const annualDep = (purchaseCost - salvageValue) / lifeYears;
        depreciationAmount = Math.round((annualDep / 12) * 100) / 100;
        newValue = Math.max(salvageValue, currentValue - depreciationAmount);
        break;
      }
      case "declining": {
        const rate = (category as any).depreciationRate || (2 / lifeYears);
        depreciationAmount = Math.round(currentValue * rate / 12 * 100) / 100;
        newValue = Math.max(salvageValue, currentValue - depreciationAmount);
        break;
      }
      default: {
        depreciationAmount = Math.round(((purchaseCost - salvageValue) / lifeYears / 12) * 100) / 100;
        newValue = Math.max(salvageValue, currentValue - depreciationAmount);
      }
    }

    const newAccumulated = (assetData.accumulatedDepreciation || 0) + depreciationAmount;

    await ctx.db.patch(args.assetId, {
      currentValue: Math.round(newValue * 100) / 100,
      accumulatedDepreciation: Math.round(newAccumulated * 100) / 100,
      updatedAt: now,
    });

    // Record depreciation entry
    await ctx.db.insert("assetDepreciationEntries", {
      assetId: args.assetId,
      depreciationDate: now,
      amount: Math.round(depreciationAmount * 100) / 100,
      bookValueBefore: currentValue,
      bookValueAfter: Math.round(newValue * 100) / 100,
      method,
      createdAt: now,
    });

    return {
      assetId: args.assetId,
      depreciationAmount: Math.round(depreciationAmount * 100) / 100,
      bookValueBefore: currentValue,
      bookValueAfter: Math.round(newValue * 100) / 100,
      accumulatedDepreciation: Math.round(newAccumulated * 100) / 100,
    };
    }
  ),
});

export const getAssetDepreciationSchedule = query({
  args: { assetId: v.id("fixedAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return null;

    const entries = await ctx.db
      .query("assetDepreciationEntries")
      .filter((q: any) => q.eq(q.field("assetId"), args.assetId))
      .order("desc")
      .collect();

    return { asset, depreciationEntries: entries };
  },
});

// ═══════════════════════════════════════════════════════════════════
// ASSET TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════

export const transferAsset = mutation({
  args: {
    token: v.optional(v.string()),
    assetId: v.id("fixedAssets"),
    newBranchId: v.optional(v.id("orgBranches")),
    newDepartmentId: v.optional(v.id("departments")),
    newLocation: v.optional(v.string()),
    transferredTo: v.optional(v.id("users")),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "update",
      entity: "fixed_asset",
      eventType: "asset.fixed.transferred",
      title: "Asset Transferred",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const { assetId, ...updates } = args;
    await ctx.db.patch(assetId, { ...updates, updatedAt: Date.now() });
    return assetId;
    }
  ),
});

export const writeOffAsset = mutation({
  args: {
    token: v.optional(v.string()),
    assetId: v.id("fixedAssets"),
    writeOffDate: v.number(),
    reason: v.string(),
    approvedBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "update",
      entity: "fixed_asset",
      eventType: "asset.fixed.written_off",
      title: "Asset Written Off",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const { assetId, ...updates } = args;
    await ctx.db.patch(assetId, {
      status: "written_off",
      currentValue: 0,
      accumulatedDepreciation: 0,
      ...updates,
      updatedAt: Date.now(),
    });
    return assetId;
    }
  ),
});

export const disposeAsset = mutation({
  args: {
    token: v.optional(v.string()),
    assetId: v.id("fixedAssets"),
    disposalDate: v.number(),
    disposalType: v.union(v.literal("sold"), v.literal("scrapped"), v.literal("donated"), v.literal("lost")),
    saleAmount: v.optional(v.number()),
    reason: v.string(),
  },
  handler: withScopeAndEvents(
    {
      ...fixedAssetPipeline,
      operation: "update",
      entity: "fixed_asset",
      eventType: "asset.fixed.disposed",
      title: "Asset Disposed",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const { assetId, ...updates } = args;
    await ctx.db.patch(assetId, {
      status: "disposed",
      ...updates,
      updatedAt: Date.now(),
    });
    return assetId;
    }
  ),
});
