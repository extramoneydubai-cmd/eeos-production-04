/**
 * Grid SDK — Universal Metadata-Driven List Runtime
 *
 * Wires the existing gridEngine. Every entity registered in the
 * ENTITY_REGISTRY (entityEngine) can be rendered as a sortable,
 * filterable, paginated, exportable grid — no module-specific tables.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const grid = await PlatformSDK.grid.getGridData(ctx, { entityType: "students", ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";

/**
 * Get the metadata-driven grid config for an entity type (columns, filters, sorting).
 */
export const getGridConfig = query({
  args: { entityType: v.string() },
  handler: async (ctx, args) => {
    const { getGridConfig } = await import("../../convex/gridEngine");
    return getGridConfig.handler(ctx, args);
  },
});

/**
 * Get paginated, sorted, filtered grid data for an entity type.
 */
export const getGridData = query({
  args: {
    entityType: v.string(),
    sortBy: v.optional(v.string()),
    sortDir: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    filters: v.optional(v.any()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { getGridData } = await import("../../convex/gridEngine");
    return getGridData.handler(ctx, args);
  },
});

/**
 * Export grid data as CSV or JSON.
 */
export const exportGrid = mutation({
  args: {
    entityType: v.string(),
    format: v.union(v.literal("csv"), v.literal("json")),
    filters: v.optional(v.any()),
    search: v.optional(v.string()),
    selectedFields: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { exportGrid } = await import("../../convex/gridEngine");
    return exportGrid.handler(ctx, args);
  },
});

/**
 * List all entity types available in the grid runtime.
 */
export const listGridEntities = query({
  handler: async (ctx) => {
    const { listGridEntities } = await import("../../convex/gridEngine");
    return listGridEntities.handler(ctx, {});
  },
});
