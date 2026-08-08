import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Field Permission CRUD ───────────────────────────────

export const setFieldPermission = mutation({
  args: { token: v.optional(v.string()),
    designationId: v.id("designations"),
    module: v.string(),
    fieldName: v.string(),
    visible: v.optional(v.boolean()),
    editable: v.optional(v.boolean()),
    masked: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "security", entity: "fieldSecurity" }, async (ctx, args) => {
    const existing = await ctx.db
      .query("fieldPermissions")
      .withIndex("designationId_module", (q: any) =>
        q.eq("designationId", args.designationId).eq("module", args.module)
      )
      .filter((q: any) => q.eq(q.field("fieldName"), args.fieldName))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        visible: args.visible !== undefined ? args.visible : existing.visible,
        editable: args.editable !== undefined ? args.editable : existing.editable,
        masked: args.masked !== undefined ? args.masked : existing.masked,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("fieldPermissions", {
      designationId: args.designationId,
      module: args.module,
      fieldName: args.fieldName,
      visible: args.visible !== undefined ? args.visible : true,
      editable: args.editable !== undefined ? args.editable : true,
      masked: args.masked !== undefined ? args.masked : false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const removeFieldPermission = mutation({
  args: { token: v.optional(v.string()), permissionId: v.id("fieldPermissions") },
  handler: withScopeAndEvents({ operation: "delete", module: "security", entity: "fieldSecurity" }, async (ctx, args) => {
    await ctx.db.delete(args.permissionId);
    return args.permissionId;
  }),
});

export const listFieldPermissions = query({
  args: {
    designationId: v.optional(v.id("designations")),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("fieldPermissions");

    if (args.designationId) {
      query = query.filter((q) => q.eq(q.field("designationId"), args.designationId));
    }
    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }

    const results = await query.collect();
    return results;
  },
});

export const getFieldPermissions = query({
  args: {
    designationId: v.id("designations"),
    module: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fieldPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", args.designationId).eq("module", args.module)
      )
      .collect();
  },
});

// ─── Field Masking Rules ──────────────────────────────────

/**
 * Apply masking to a value based on field type and masking mode.
 * Centralized masking logic shared by all modules.
 */
export function maskFieldValue(
  value: string | undefined | null,
  maskMode: "full" | "partial" | "email" | "last_four" | "first_only" = "partial",
): string {
  if (!value) return "—";

  const str = String(value);

  switch (maskMode) {
    case "full":
      return "********";

    case "partial":
      if (str.length <= 4) return "****";
      return str.substring(0, 2) + "*".repeat(Math.min(str.length - 6, 6)) + str.substring(str.length - 4);

    case "email": {
      const atIdx = str.indexOf("@");
      if (atIdx <= 1) return "***" + str.substring(atIdx);
      return str[0] + "***" + str.substring(atIdx);
    }

    case "last_four":
      return "****" + str.substring(Math.max(0, str.length - 4));

    case "first_only":
      return str[0] + "****";

    default:
      return str;
  }
}

/**
 * Standard sensitive field definitions for each module.
 * Used as seed data for default field security rules.
 */
export const SENSITIVE_FIELDS: Record<string, Array<{ fieldName: string; maskMode: string; staffVisible: boolean; staffEditable: boolean; managerVisible: boolean; managerEditable: boolean }>> = {
  person: [
    { fieldName: "phone", maskMode: "partial", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "email", maskMode: "email", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "aadhaarNumber", maskMode: "partial", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
    { fieldName: "passportNumber", maskMode: "partial", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
    { fieldName: "dateOfBirth", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
    { fieldName: "nationality", maskMode: "full", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "maritalStatus", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
    { fieldName: "bloodGroup", maskMode: "full", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "profilePhoto", maskMode: "full", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: false },
  ],
  employee: [
    { fieldName: "salary", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: false, managerEditable: false },
    { fieldName: "bankDetails", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: false, managerEditable: false },
    { fieldName: "medicalInfo", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
    { fieldName: "emergencyContact", maskMode: "partial", staffVisible: true, staffEditable: true, managerVisible: true, managerEditable: true },
    { fieldName: "documents", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
  ],
  student: [
    { fieldName: "phone", maskMode: "partial", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "email", maskMode: "email", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "address", maskMode: "full", staffVisible: true, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "parentPhone", maskMode: "partial", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: true },
    { fieldName: "medicalInfo", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
    { fieldName: "documents", maskMode: "full", staffVisible: false, staffEditable: false, managerVisible: true, managerEditable: false },
  ],
};

// ─── Seed Field Permissions ───────────────────────────────

export const seedFieldPermissions = mutation({
  args: { token: v.optional(v.string()),
    designationId: v.id("designations"),
  },
  handler: withScopeAndEvents({ operation: "create", module: "security", entity: "fieldSecurity" }, async (ctx, args) => {
    const now = Date.now();
    const results: string[] = [];

    for (const [module, fields] of Object.entries(SENSITIVE_FIELDS)) {
      for (const field of fields) {
        const permId = await ctx.db.insert("fieldPermissions", {
          designationId: args.designationId,
          module,
          fieldName: field.fieldName,
          visible: field.staffVisible,
          editable: field.staffEditable,
          masked: field.maskMode !== "full",
          createdAt: now,
          updatedAt: now,
        });
        results.push(permId);
      }
    }

    return results;
  }),
});
