import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Dynamic Menu Items — sidebar & navigation controlled from DB.
 * No hardcoded menus. Everything configurable by Super Admin.
 */
export const dynamicMenusTables = {
  dynamicMenus: defineTable({
    // Identity
    label: v.string(),
    href: v.string(),
    icon: v.string(),
    
    // Hierarchy
    parentId: v.optional(v.id("dynamicMenus")),
    group: v.string(),
    order: v.number(),
    
    // Visibility Rules
    roles: v.optional(v.array(v.string())),
    permissionKey: v.optional(v.string()),
    featureFlag: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    
    // UI Customization
    badge: v.optional(v.string()),
    badgeColor: v.optional(v.string()),
    customColor: v.optional(v.string()),
    
    // State
    visibility: v.union(
      v.literal("visible"), v.literal("hidden"),
      v.literal("disabled"), v.literal("readonly"),
    ),
    isActive: v.boolean(),
    isPlaceholder: v.boolean(),
    
    // Audit
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_group", ["group"])
    .index("by_parent", ["parentId"])
    .index("by_order", ["order"])
    .index("by_active", ["isActive"])
    .index("by_visibility", ["visibility"])
    .index("by_href", ["href"])
    .index("by_feature_flag", ["featureFlag"]),

  // ─── Dashboard Widget Permissions ─────────────────────────
  dashboardWidgetPermissions: defineTable({
    widgetKey: v.string(),
    roleId: v.id("roles"),
    visibility: v.union(
      v.literal("visible"), v.literal("hidden"),
      v.literal("readonly"), v.literal("interactive"),
    ),
    allowExport: v.boolean(),
    allowDrilldown: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_widget", ["widgetKey"])
    .index("by_role", ["roleId"])
    .index("by_widget_role", ["widgetKey", "roleId"]),

  // ─── Module Activations (per-company) ─────────────────────
  moduleActivations: defineTable({
    module: v.string(),
    companyId: v.id("companies"),
    branchId: v.optional(v.id("branches")),
    enabled: v.boolean(),
    config: v.optional(v.any()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["module"])
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"])
    .index("by_module_company", ["module", "companyId"])
    .index("by_enabled", ["enabled"]),

  // ─── Branch/Company Config Overrides ──────────────────────
  configOverrides: defineTable({
    scopeType: v.union(
      v.literal("platform"), v.literal("company"),
      v.literal("branch"), v.literal("department"),
      v.literal("team"), v.literal("user"),
    ),
    scopeId: v.string(),
    module: v.string(),
    key: v.string(),
    value: v.any(),
    valueType: v.union(
      v.literal("string"), v.literal("number"),
      v.literal("boolean"), v.literal("json"),
      v.literal("array"),
    ),
    inherited: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_scope", ["scopeType", "scopeId"])
    .index("by_module", ["module"])
    .index("by_key", ["key"])
    .index("by_module_key", ["module", "key"]),

  // ─── Designation Builders ──────────────────────────────────
  designationBuilders: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    permissionSet: v.optional(v.array(v.string())),
    dashboardIds: v.optional(v.array(v.string())),
    menuIds: v.optional(v.array(v.id("dynamicMenus"))),
    approvalLevel: v.optional(v.number()),
    maxApprovalAmount: v.optional(v.number()),
    salaryGrade: v.optional(v.string()),
    leavePolicyId: v.optional(v.string()),
    scopeLevel: v.optional(v.string()),
    reportsTo: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    isActive: v.boolean(),
    isSystem: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_role", ["roleId"])
    .index("by_sequence", ["sequence"])
    .index("by_active", ["isActive"]),
};
