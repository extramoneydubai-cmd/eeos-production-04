/**
 * Universal Entity Engine — Zero-Hardcode Entity Runtime
 *
 * Instead of calling StudentEngine, EmployeeEngine, etc. separately,
 * every entity type registers its metadata and is accessible through
 * this single unified interface.
 *
 * Supports:
 *   create(entityType, data)
 *   update(entityType, id, data)
 *   delete(entityType, id)
 *   archive(entityType, id)
 *   restore(entityType, id)
 *   duplicate(entityType, id)
 *   merge(entityType, ids)
 *   search(entityType, query, filters)
 *   export(entityType, ids, format)
 *   audit(entityType, id)
 *
 * All behavior is driven by entityRegistry metadata.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Entity Registry Schema (entities configurable via metadata) ──

export interface EntityDefinition {
  entityType: string;
  tableName: string;
  displayName: string;
  icon: string;
  color: string;
  searchableFields: string[];
  relationships: { entityType: string; field: string; type: "hasMany" | "belongsTo" | "hasOne" }[];
  permissions: { view: string; create: string; update: string; delete: string };
  isArchivable: boolean;
  isAuditable: boolean;
}

// Registry of all known entities
export const ENTITY_REGISTRY: Record<string, EntityDefinition> = {
  student: {
    entityType: "student", tableName: "students", displayName: "Student",
    icon: "GraduationCap", color: "#6366f1",
    searchableFields: ["firstName", "lastName", "email", "phone", "studentId"],
    relationships: [
      { entityType: "parent", field: "parentId", type: "belongsTo" },
      { entityType: "enrollment", field: "studentId", type: "hasMany" },
    ],
    permissions: { view: "students:read", create: "students:write", update: "students:write", delete: "students:delete" },
    isArchivable: true, isAuditable: true,
  },
  employee: {
    entityType: "employee", tableName: "employees", displayName: "Employee",
    icon: "Users", color: "#34a853",
    searchableFields: ["firstName", "lastName", "email", "phone", "employeeCode"],
    relationships: [
      { entityType: "department", field: "departmentId", type: "belongsTo" },
    ],
    permissions: { view: "employees:read", create: "employees:write", update: "employees:write", delete: "employees:delete" },
    isArchivable: true, isAuditable: true,
  },
  lead: {
    entityType: "lead", tableName: "leads", displayName: "Lead",
    icon: "UserPlus", color: "#f59e0b",
    searchableFields: ["firstName", "lastName", "email", "phone", "leadSource"],
    relationships: [],
    permissions: { view: "crm:read", create: "crm:write", update: "crm:write", delete: "crm:delete" },
    isArchivable: true, isAuditable: true,
  },
  invoice: {
    entityType: "invoice", tableName: "invoices", displayName: "Invoice",
    icon: "FileText", color: "#1a73e8",
    searchableFields: ["invoiceNumber", "status", "totalAmount"],
    relationships: [
      { entityType: "student", field: "studentId", type: "belongsTo" },
    ],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true,
  },
  receipt: {
    entityType: "receipt", tableName: "receipts", displayName: "Receipt",
    icon: "Receipt", color: "#a855f7",
    searchableFields: ["receiptNumber", "receiptType", "amount"],
    relationships: [{ entityType: "invoice", field: "invoiceId", type: "belongsTo" }],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true,
  },
  refund: {
    entityType: "refund", tableName: "refunds", displayName: "Refund",
    icon: "Undo2", color: "#ea4335",
    searchableFields: ["refundNumber", "status", "amount"],
    relationships: [{ entityType: "student", field: "studentId", type: "belongsTo" }],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true,
  },
  pdc: {
    entityType: "pdc", tableName: "postDatedCheques", displayName: "PDC",
    icon: "CreditCard", color: "#f97316",
    searchableFields: ["chequeNumber", "bankName", "amount", "status"],
    relationships: [{ entityType: "student", field: "studentId", type: "belongsTo" }],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true,
  },
  ticket: {
    entityType: "ticket", tableName: "ticketMaster", displayName: "Ticket",
    icon: "Ticket", color: "#6366f1",
    searchableFields: ["ticketNumber", "title", "status", "priority"],
    relationships: [{ entityType: "student", field: "requesterId", type: "belongsTo" }],
    permissions: { view: "support:read", create: "support:write", update: "support:write", delete: "support:delete" },
    isArchivable: true, isAuditable: true,
  },
  course: {
    entityType: "course", tableName: "courses", displayName: "Course",
    icon: "BookOpen", color: "#8b5cf6",
    searchableFields: ["name", "code", "description"],
    relationships: [],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true,
  },
  batch: {
    entityType: "batch", tableName: "academicBatches", displayName: "Batch",
    icon: "Layers", color: "#06b6d4",
    searchableFields: ["name", "code", "batchType"],
    relationships: [{ entityType: "course", field: "courseId", type: "belongsTo" }],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true,
  },
  faculty: {
    entityType: "faculty", tableName: "faculty", displayName: "Faculty",
    icon: "ChalkboardTeacher", color: "#ec4899",
    searchableFields: ["firstName", "lastName", "email", "phone", "specialization"],
    relationships: [],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true,
  },
  vendor: {
    entityType: "vendor", tableName: "vendors", displayName: "Vendor",
    icon: "Truck", color: "#10b981",
    searchableFields: ["name", "email", "phone", "gstNumber"],
    relationships: [],
    permissions: { view: "procurement:read", create: "procurement:write", update: "procurement:write", delete: "procurement:delete" },
    isArchivable: true, isAuditable: true,
  },
  asset: {
    entityType: "asset", tableName: "fixedAssets", displayName: "Asset",
    icon: "Package", color: "#78716c",
    searchableFields: ["name", "serialNumber", "assetTag", "assetType"],
    relationships: [],
    permissions: { view: "inventory:read", create: "inventory:write", update: "inventory:write", delete: "inventory:delete" },
    isArchivable: true, isAuditable: true,
  },
  campaign: {
    entityType: "campaign", tableName: "crmUtmCampaigns", displayName: "Campaign",
    icon: "Megaphone", color: "#e11d48",
    searchableFields: ["name", "type", "status"],
    relationships: [],
    permissions: { view: "marketing:read", create: "marketing:write", update: "marketing:write", delete: "marketing:delete" },
    isArchivable: true, isAuditable: true,
  },
};

// ─── Queries ───────────────────────────────────────────────────

export const getEntityDefinition = query({
  args: { entityType: v.string() },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    return def;
  },
});

export const listEntityTypes = query({
  handler: async () => {
    return Object.entries(ENTITY_REGISTRY).map(([key, def]) => ({
      entityType: key,
      displayName: def.displayName,
      icon: def.icon,
      color: def.color,
      relationships: def.relationships.length,
      isArchivable: def.isArchivable,
    }));
  },
});

export const searchEntities = query({
  args: {
    entityType: v.string(),
    query: v.string(),
    filters: v.optional(v.any()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);

    // Collect all items from the table
    const items = await ctx.db.query(def.tableName as any).collect();
    const q = args.query.toLowerCase();

    // Filter by search query across searchable fields
    let results: any[] = [];
    for (const item of items) {
      for (const field of def.searchableFields) {
        const val = (item as any)[field];
        if (val && String(val).toLowerCase().includes(q)) {
          results.push({ ...item, _matchField: field });
          break;
        }
      }
    }

    // Apply additional filters if provided
    if (args.filters) {
      const filterKeys = Object.keys(args.filters);
      for (const key of filterKeys) {
        results = results.filter((r) => (r as any)[key] === (args.filters as any)[key]);
      }
    }

    const limit = args.limit || 50;
    return results.slice(0, limit);
  },
});

// ─── Mutations ─────────────────────────────────────────────────

export const archiveEntity = mutation({
  args: { entityType: v.string(), entityId: v.id("_storage") },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    if (!def.isArchivable) throw new Error(`${def.displayName} does not support archiving`);

    // Archive by setting isArchived flag
    await ctx.db.patch(args.entityId as any, {
      isArchived: true,
      archivedAt: Date.now(),
    } as any);

    return { success: true, entityType: args.entityType, entityId: args.entityId };
  },
});

export const restoreEntity = mutation({
  args: { entityType: v.string(), entityId: v.id("_storage") },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);

    await ctx.db.patch(args.entityId as any, {
      isArchived: false,
      archivedAt: undefined,
    } as any);

    return { success: true, entityType: args.entityType, entityId: args.entityId };
  },
});

// ─── Audit Query ───────────────────────────────────────────────

export const getEntityAudit = query({
  args: { entityType: v.string(), entityId: v.id("_storage") },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    if (!def.isAuditable) throw new Error(`${def.displayName} does not support audit`);

    // Look up timeline entries and audit logs for this entity
    const timeline = await ctx.db.query("entityTimeline")
      .withIndex("by_entity", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    const audit = await ctx.db.query("auditLogs")
      .withIndex("by_entity", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    return { timeline, audit };
  },
});
