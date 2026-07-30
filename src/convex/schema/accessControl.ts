import { defineTable } from "convex/server";
import { v } from "convex/values";

/** Scaffolded tables for the Enterprise Access Control Center */
export const accessControlTables = {
  // ─── Roles ────────────────────────────────────────────────────
  roles: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    isSystem: v.boolean(),
    isActive: v.boolean(),
    priority: v.number(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("code", ["code"])
    .index("by_organization", ["organizationId"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"]),

  // ─── Permission Groups ────────────────────────────────────────
  permissionGroups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_active", ["isActive"]),

  // ─── Permissions ──────────────────────────────────────────────
  permissions: defineTable({
    module: v.string(),
    entity: v.string(),
    action: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    groupId: v.optional(v.id("permissionGroups")),
    isSystem: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_module", ["module"])
    .index("by_action", ["action"])
    .index("by_module_entity", ["module", "entity"]),

  // ─── Role-Permission Assignments ──────────────────────────────
  rolePermissions: defineTable({
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
    scope: v.union(
      v.literal("own"), v.literal("team"), v.literal("department"),
      v.literal("branch"), v.literal("company"), v.literal("organization"),
      v.literal("global"),
    ),
    granted: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_role", ["roleId"])
    .index("by_permission", ["permissionId"])
    .index("by_role_permission", ["roleId", "permissionId"]),

  // ─── User-Role Assignments ────────────────────────────────────
  userRoles: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    assignedBy: v.optional(v.id("users")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["roleId"])
    .index("by_user_role", ["userId", "roleId"])
    .index("by_organization", ["organizationId"])
    .index("by_branch", ["branchId"])
    .index("by_active", ["isActive"]),

  // ─── Feature Flags ────────────────────────────────────────────
  featureFlags: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("enabled"), v.literal("disabled"), v.literal("beta"),
      v.literal("hidden"), v.literal("coming_soon"),
    ),
    roleId: v.optional(v.id("roles")),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_key", ["key"])
    .index("by_role", ["roleId"])
    .index("by_organization", ["organizationId"])
    .index("by_active", ["isActive"]),

  // ─── Studio Permissions ──────────────────────────────────────
  studioPermissions: defineTable({
    studioId: v.string(),
    roleId: v.id("roles"),
    canAccess: v.boolean(),
    canConfigure: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_studio", ["studioId"])
    .index("by_role", ["roleId"])
    .index("by_studio_role", ["studioId", "roleId"]),

  // ─── Menu Permissions ────────────────────────────────────────
  menuPermissions: defineTable({
    menuKey: v.string(),
    roleId: v.id("roles"),
    visibility: v.union(
      v.literal("visible"), v.literal("hidden"),
      v.literal("disabled"), v.literal("readonly"),
    ),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_menu", ["menuKey"])
    .index("by_role", ["roleId"])
    .index("by_menu_role", ["menuKey", "roleId"]),

  // ─── Scope Rules ─────────────────────────────────────────────
  scopeRules: defineTable({
    roleId: v.id("roles"),
    entityType: v.string(),
    defaultScope: v.union(
      v.literal("own"), v.literal("team"), v.literal("department"),
      v.literal("branch"), v.literal("company"), v.literal("organization"),
      v.literal("global"),
    ),
    maxScope: v.union(
      v.literal("own"), v.literal("team"), v.literal("department"),
      v.literal("branch"), v.literal("company"), v.literal("organization"),
      v.literal("global"),
    ),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_role", ["roleId"])
    .index("by_role_entity", ["roleId", "entityType"]),

  // ─── Designation-Role Mapping ────────────────────────────────
  designationRoles: defineTable({
    designation: v.string(),
    roleId: v.id("roles"),
    organizationId: v.optional(v.id("organizations")),
    isDefault: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_designation", ["designation"])
    .index("by_designation_org", ["designation", "organizationId"]),

  // ─── Subscription Plans ───────────────────────────────────────
  subscriptionPlans: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("one_time")),
    maxUsers: v.number(),
    maxBranches: v.number(),
    maxCompanies: v.number(),
    maxStorage: v.optional(v.number()),
    modules: v.array(v.string()),
    features: v.array(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_order", ["sortOrder"]),

  // ─── Permission Templates ─────────────────────────────────────
  permissionTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    permissions: v.array(v.string()),
    scope: v.union(
      v.literal("own"), v.literal("team"), v.literal("department"),
      v.literal("branch"), v.literal("company"), v.literal("organization"),
      v.literal("global"),
    ),
    isSystem: v.boolean(),
    isActive: v.boolean(),
    version: v.number(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role", ["roleId"])
    .index("by_active", ["isActive"]),

  // ─── Permission Audit Logs ────────────────────────────────────
  permissionAuditLogs: defineTable({
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    userId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    oldValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    metadata: v.optional(v.any()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"]),
};
