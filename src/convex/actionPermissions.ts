import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Default Action Definitions ──────────────────────────

export const MODULE_ACTIONS: Record<string, string[]> = {
  lead: ["call", "whatsapp", "email", "download", "export", "print", "merge", "delete", "archive", "restore", "assign", "share_qr", "generate_qr", "approve", "reject"],
  student: ["call", "whatsapp", "email", "download", "export", "print", "delete", "archive", "restore", "assign", "share_qr", "generate_qr", "approve", "reject"],
  employee: ["call", "whatsapp", "email", "download", "export", "print", "delete", "archive", "restore", "assign", "promote", "suspend", "terminate"],
  finance: ["download", "export", "print", "approve", "reject", "refund", "create_invoice", "void_invoice", "apply_discount"],
  document: ["download", "export", "print", "upload", "delete", "share"],
};

// ─── Action Permission CRUD ───────────────────────────────

export const setActionPermission = mutation({
  args: {
    designationId: v.id("designations"),
    module: v.string(),
    action: v.string(),
    allowed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("actionPermissions")
      .withIndex("designationId_module_action", (q) =>
        q.eq("designationId", args.designationId)
          .eq("module", args.module)
          .eq("action", args.action)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { allowed: args.allowed, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("actionPermissions", {
      designationId: args.designationId,
      module: args.module,
      action: args.action,
      allowed: args.allowed,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeActionPermission = mutation({
  args: { permissionId: v.id("actionPermissions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.permissionId);
    return args.permissionId;
  },
});

export const listActionPermissions = query({
  args: {
    designationId: v.optional(v.id("designations")),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("actionPermissions");

    if (args.designationId) {
      query = query.filter((q) => q.eq(q.field("designationId"), args.designationId));
    }
    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }

    return await query.collect();
  },
});

export const getDesignationActionPermissions = query({
  args: {
    designationId: v.id("designations"),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("actionPermissions")
      .filter((q) => q.eq(q.field("designationId"), args.designationId));

    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }

    return await query.collect();
  },
});

// ─── Section Permission CRUD ──────────────────────────────

export const setSectionPermission = mutation({
  args: {
    designationId: v.id("designations"),
    module: v.string(),
    sectionName: v.string(),
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sectionPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", args.designationId).eq("module", args.module)
      )
      .filter((q) => q.eq(q.field("sectionName"), args.sectionName))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { visible: args.visible, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("sectionPermissions", {
      designationId: args.designationId,
      module: args.module,
      sectionName: args.sectionName,
      visible: args.visible,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listSectionPermissions = query({
  args: {
    designationId: v.optional(v.id("designations")),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("sectionPermissions");

    if (args.designationId) {
      query = query.filter((q) => q.eq(q.field("designationId"), args.designationId));
    }
    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }

    return await query.collect();
  },
});

// ─── Category Permission CRUD ─────────────────────────────

export const setCategoryPermission = mutation({
  args: {
    designationId: v.id("designations"),
    category: v.string(),
    canDiscover: v.optional(v.boolean()),
    canOpen: v.optional(v.boolean()),
    canCreate: v.optional(v.boolean()),
    canEdit: v.optional(v.boolean()),
    canDelete: v.optional(v.boolean()),
    canExport: v.optional(v.boolean()),
    canPrint: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categoryPermissions")
      .withIndex("designationId_category", (q) =>
        q.eq("designationId", args.designationId).eq("category", args.category)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        canDiscover: args.canDiscover !== undefined ? args.canDiscover : existing.canDiscover,
        canOpen: args.canOpen !== undefined ? args.canOpen : existing.canOpen,
        canCreate: args.canCreate !== undefined ? args.canCreate : existing.canCreate,
        canEdit: args.canEdit !== undefined ? args.canEdit : existing.canEdit,
        canDelete: args.canDelete !== undefined ? args.canDelete : existing.canDelete,
        canExport: args.canExport !== undefined ? args.canExport : existing.canExport,
        canPrint: args.canPrint !== undefined ? args.canPrint : existing.canPrint,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("categoryPermissions", {
      designationId: args.designationId,
      category: args.category,
      canDiscover: args.canDiscover !== undefined ? args.canDiscover : false,
      canOpen: args.canOpen !== undefined ? args.canOpen : false,
      canCreate: args.canCreate !== undefined ? args.canCreate : false,
      canEdit: args.canEdit !== undefined ? args.canEdit : false,
      canDelete: args.canDelete !== undefined ? args.canDelete : false,
      canExport: args.canExport !== undefined ? args.canExport : false,
      canPrint: args.canPrint !== undefined ? args.canPrint : false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listCategoryPermissions = query({
  args: {
    designationId: v.optional(v.id("designations")),
  },
  handler: async (ctx, args) => {
    if (args.designationId) {
      return await ctx.db
        .query("categoryPermissions")
        .withIndex("designationId", (q) => q.eq("designationId", args.designationId))
        .collect();
    }
    return await ctx.db.query("categoryPermissions").collect();
  },
});

// ─── Permission Simulator ─────────────────────────────────

/**
 * Simulate what a user can see and do on a specific record.
 * Used by the Permission Simulator UI.
 */
export const simulateUserPermissions = query({
  args: {
    targetUserId: v.id("users"),
    module: v.string(),
    recordId: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.targetUserId);
    if (!user) return null;

    const category = args.category || args.module;

    // Check discover
    const canDiscArr = await ctx.db
      .query("categoryPermissions")
      .withIndex("designationId_category", (q) =>
        q.eq("designationId", user.designationId).eq("category", category)
      )
      .collect();
    const canDisc = canDiscArr.length > 0 ? canDiscArr[0].canDiscover : user.role === "super_admin" || user.role === "admin";

    if (!canDisc) {
      return {
        user: { name: user.name, role: user.role, designationId: user.designationId },
        canDiscover: false,
        message: "User cannot discover records in this category",
        visibleSections: [],
        visibleFields: {},
        allowedActions: [],
        deniedActions: [],
      };
    }

    // Check record-level scope
    let recordScope = null;
    if (args.recordId) {
      recordScope = await ctx.db
        .query("recordPolicies")
        .withIndex("module_recordId", (q) =>
          q.eq("module", args.module).eq("recordId", args.recordId)
        )
        .first();
    }

    // Get section visibility
    const allSections: string[] = [
      "overview", "timeline", "documents", "communication",
      "emergency_contacts", "social_media", "relationships",
      "medical", "salary", "finance", "notes",
    ];

    const sectionPerms = await ctx.db
      .query("sectionPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", user.designationId).eq("module", args.module)
      )
      .collect();

    const hiddenSections = new Set(sectionPerms.filter((s) => !s.visible).map((s) => s.sectionName));
    const visibleSections = allSections.filter((s) => !hiddenSections.has(s));

    // Get field visibility
    const fieldPerms = await ctx.db
      .query("fieldPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", user.designationId).eq("module", args.module)
      )
      .collect();

    const visibleFields: Record<string, { visible: boolean; editable: boolean; masked: boolean }> = {};
    for (const fp of fieldPerms) {
      visibleFields[fp.fieldName] = { visible: fp.visible, editable: fp.editable, masked: fp.masked };
    }

    // Get action permissions
    const actionPerms = await ctx.db
      .query("actionPermissions")
      .withIndex("designationId_module_action", (q) =>
        q.eq("designationId", user.designationId).eq("module", args.module)
      )
      .collect();

    const allowedActions: string[] = [];
    const deniedActions: { action: string; reason: string }[] = [];

    for (const ap of actionPerms) {
      if (ap.allowed) {
        allowedActions.push(ap.action);
      } else {
        deniedActions.push({ action: ap.action, reason: "Explicitly denied" });
      }
    }

    // Determine overall access
    let canOpen = false;
    if (user.role === "super_admin") canOpen = true;
    else if (user.role === "admin" || user.role === "manager") canOpen = true;
    else {
      const catPerm = canDiscArr[0];
      if (catPerm && catPerm.canOpen) canOpen = true;
    }

    // Record-level check
    if (recordScope && args.recordId) {
      const ownerMatch = recordScope.ownerUserId === args.targetUserId;
      const deptMatch = recordScope.departmentId && user.departmentId === recordScope.departmentId;
      const branchMatch = recordScope.branchId && user.branchId === recordScope.branchId;
      const companyMatch = recordScope.companyId && user.companyId === recordScope.companyId;

      if (!ownerMatch && !deptMatch && !branchMatch && !companyMatch) {
        canOpen = false;
      }
    }

    return {
      user: {
        name: user.name,
        role: user.role,
        designationId: user.designationId,
        departmentId: user.departmentId,
        branchId: user.branchId,
        companyId: user.companyId,
      },
      canDiscover: true,
      canOpen,
      visibleSections,
      visibleFields,
      allowedActions,
      deniedActions,
      recordScope: recordScope ? {
        hasPolicy: true,
        ownerUserId: recordScope.ownerUserId,
        departmentId: recordScope.departmentId,
        branchId: recordScope.branchId,
        companyId: recordScope.companyId,
      } : { hasPolicy: false },
    };
  },
});

// ─── Access Audit Log ─────────────────────────────────────

export const getAccessAuditLogs = query({
  args: {
    userId: v.optional(v.id("users")),
    module: v.optional(v.string()),
    result: v.optional(v.union(v.literal("granted"), v.literal("denied"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let query = ctx.db.query("accessAuditLogs");

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }
    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }
    if (args.result) {
      query = query.filter((q) => q.eq(q.field("result"), args.result));
    }

    return await query.order("desc").take(limit);
  },
});
