/**
 * Dynamic Grid Runtime — Universal entity list/table rendering
 *
 * Phase 4 — Replaces ALL module-specific tables with a single
 * metadata-driven grid runtime. Every entity type registered in
 * ENTITY_REGISTRY can be rendered as a grid with sorting, filtering,
 * grouping, pivot, export, and inline editing.
 *
 * No module-specific table components needed.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ENTITY_REGISTRY } from "./entityEngine";

// ─── Grid Configuration ───────────────────────────────────────

export interface GridConfig {
  entityType: string;
  columns: GridColumn[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  groupBy?: string;
  pageSize?: number;
  quickFilters?: string[];
  advancedFilters?: GridFilter[];
  frozenColumns?: string[];
  enableInlineEdit?: boolean;
  enableBulkEdit?: boolean;
  enableExport?: boolean;
  enablePrint?: boolean;
  enableRowSelection?: boolean;
  enableGrouping?: boolean;
  enablePivot?: boolean;
}

export interface GridColumn {
  field: string;
  label: string;
  type: "string" | "number" | "date" | "currency" | "boolean" | "select" | "email" | "phone";
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  visible: boolean;
  frozen?: boolean;
  align?: "left" | "center" | "right";
  format?: string;
  options?: string[];
  template?: string;
}

export interface GridFilter {
  field: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange" | "number" | "boolean";
  operator: "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "between" | "in";
  options?: string[];
  defaultValue?: any;
}

// ─── Build Grid Config from Entity Definition ────────────────

export function buildGridFromEntity(entityType: string): GridConfig {
  const def = ENTITY_REGISTRY[entityType];
  if (!def) throw new Error(`Unknown entity type: ${entityType}`);

  const columns: GridColumn[] = def.fields.map(f => ({
    field: f.key,
    label: f.label,
    type: f.type,
    width: f.width || (f.type === "string" ? 200 : f.type === "currency" ? 120 : f.type === "number" ? 100 : 150),
    sortable: f.sortable !== false,
    filterable: f.filterable !== false,
    editable: f.type !== "date" && f.type !== "boolean",
    visible: f.visible !== false,
    frozen: false,
    align: f.type === "number" || f.type === "currency" ? "right" : "left",
    options: f.options,
  }));

  return {
    entityType,
    columns,
    sortBy: def.fields[0]?.key || "_id",
    sortDir: "asc",
    pageSize: 25,
    quickFilters: def.quickFilters,
    advancedFilters: def.quickFilters.map(f => ({
      field: f,
      label: f.charAt(0).toUpperCase() + f.slice(1),
      type: "text" as const,
      operator: "contains" as const,
    })),
    enableInlineEdit: true,
    enableExport: true,
    enableRowSelection: true,
    enableGrouping: false,
  };
}

// ─── Query: Get Grid Config ──────────────────────────────────

export const getGridConfig = query({
  args: { entityType: v.string() },
  handler: async (ctx, args) => {
    return buildGridFromEntity(args.entityType);
  },
});

// ─── Query: Get Grid Data ────────────────────────────────────

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
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);

    // Fetch all records from the entity's table
    const items = await ctx.db.query(def.tableName as any).collect();

    // Apply search
    let filtered = [...items];
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter(item => {
        for (const field of def.searchFields) {
          const val = (item as any)[field];
          if (val && String(val).toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }

    // Apply filters
    if (args.filters) {
      for (const [key, value] of Object.entries(args.filters)) {
        if (value === null || value === undefined || value === "") continue;
        filtered = filtered.filter(item => {
          const val = (item as any)[key];
          if (typeof val === "string") return String(val).toLowerCase().includes(String(value).toLowerCase());
          return val === value;
        });
      }
    }

    // Apply sorting
    const sortField = args.sortBy || def.fields[0]?.key || "_id";
    const sortDir = args.sortDir || "asc";
    filtered.sort((a: any, b: any) => {
      const va = a[sortField] || "";
      const vb = b[sortField] || "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });

    // Pagination
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      columns: def.fields.map(f => ({
        field: f.key, label: f.label, type: f.type, sortable: f.sortable !== false,
        filterable: f.filterable !== false, options: f.options, width: f.width,
      })),
    };
  },
});

// ─── Export Grid Data ─────────────────────────────────────────

export const exportGrid = mutation({
  args: {
    entityType: v.string(),
    format: v.union(v.literal("csv"), v.literal("json")),
    filters: v.optional(v.any()),
    search: v.optional(v.string()),
    selectedFields: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const data = await getGridData.handler(ctx, {
      entityType: args.entityType,
      filters: args.filters,
      search: args.search,
      page: 1,
      pageSize: 10000,
    });

    const fields = args.selectedFields || data.columns.map((c: any) => c.field);
    const labels = args.selectedFields
      ? data.columns.filter((c: any) => args.selectedFields!.includes(c.field)).map((c: any) => c.label)
      : data.columns.map((c: any) => c.label);

    if (args.format === "csv") {
      const header = labels.join(",");
      const rows = data.data.map((item: any) =>
        fields.map((f: string) => {
          const val = (item as any)[f];
          if (val === null || val === undefined) return "";
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      );
      return { format: "csv", content: [header, ...rows].join("\n"), rowCount: data.data.length };
    }

    return { format: "json", content: JSON.stringify(data.data, null, 2), rowCount: data.data.length };
  },
});

// ─── List All Available Grid Entities ────────────────────────

export const listGridEntities = query({
  handler: async () => {
    return Object.entries(ENTITY_REGISTRY).map(([key, def]) => ({
      entityType: key,
      displayName: def.pluralName,
      icon: def.icon,
      color: def.color,
      category: def.category,
      fieldCount: def.fields.length,
      searchableFields: def.searchFields,
      quickFilters: def.quickFilters,
      tableName: def.tableName,
    })).sort((a, b) => a.category.localeCompare(b.category));
  },
});
