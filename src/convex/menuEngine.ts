/**
 * Dynamic Menu Engine — Entire sidebar and navigation controlled from DB.
 *
 * No hardcoded menus. Super Admin manages everything through the
 * Access Control Center (AccessControlList.tsx).
 *
 * Hierarchy: Platform → Groups → Items (nested via parentId)
 * Visibility: Role-based, permission-based, feature-flag, subscription-plan
 * Ordering: Controlled by `order` field within each group
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Queries ──────────────────────────────────────────────────

/** Get all menus for a specific group, filtered by user role */
export const getMenusByGroup = query({
  args: {
    group: v.string(),
    userId: v.optional(v.id("users")),
    userRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allMenus = await ctx.db.query("dynamicMenus")
      .withIndex("by_group", (q: any) => q.eq("group", args.group))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    // Sort by order
    allMenus.sort((a: any, b: any) => a.order - b.order);

    // Filter by visibility
    let visible = allMenus.filter((m: any) => m.visibility === "visible");

    // Filter by role if userRole provided
    if (args.userRole && args.userRole !== "super_admin") {
      visible = visible.filter((m: any) => {
        if (!m.roles || m.roles.length === 0) return true;
        return m.roles.includes(args.userRole!);
      });
    }

    // Build hierarchy (parent-child)
    const topLevel = visible.filter((m: any) => !m.parentId);
    const children = visible.filter((m: any) => m.parentId);

    return topLevel.map((item: any) => ({
      ...item,
      children: children
        .filter((c: any) => (c as any).parentId === item._id)
        .sort((a: any, b: any) => a.order - b.order),
    }));
  },
});

/** Get all menus (for admin) — no filtering */
export const getAllMenus = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("dynamicMenus")
      .withIndex("by_order")
      .collect();
    
    // Build tree
    const topLevel = items.filter((m: any) => !m.parentId).sort((a: any, b: any) => a.order - b.order);
    const children = items.filter((m: any) => m.parentId);

    return topLevel.map((item: any) => ({
      ...item,
      children: children
        .filter((c: any) => (c as any).parentId === item._id)
        .sort((a: any, b: any) => a.order - b.order),
    }));
  },
});

/** Get unique menu groups */
export const getMenuGroups = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("dynamicMenus").collect();
    const groups = [...new Set(items.map((m: any) => m.group))].sort();
    return groups;
  },
});

// ─── CRUD Mutations ──────────────────────────────────────────

export const createMenu = mutation({
  args: {
    label: v.string(),
    href: v.string(),
    icon: v.string(),
    group: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("dynamicMenus")),
    roles: v.optional(v.array(v.string())),
    permissionKey: v.optional(v.string()),
    featureFlag: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    badge: v.optional(v.string()),
    badgeColor: v.optional(v.string()),
    customColor: v.optional(v.string()),
    visibility: v.union(
      v.literal("visible"), v.literal("hidden"),
      v.literal("disabled"), v.literal("readonly"),
    ),
    isPlaceholder: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("dynamicMenus", {
      ...args,
      isActive: true,
      isPlaceholder: args.isPlaceholder ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMenu = mutation({
  args: {
    menuId: v.id("dynamicMenus"),
    label: v.optional(v.string()),
    href: v.optional(v.string()),
    icon: v.optional(v.string()),
    group: v.optional(v.string()),
    order: v.optional(v.number()),
    parentId: v.optional(v.id("dynamicMenus")),
    roles: v.optional(v.array(v.string())),
    permissionKey: v.optional(v.string()),
    featureFlag: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    badge: v.optional(v.string()),
    badgeColor: v.optional(v.string()),
    customColor: v.optional(v.string()),
    visibility: v.optional(v.union(
      v.literal("visible"), v.literal("hidden"),
      v.literal("disabled"), v.literal("readonly"),
    )),
    isPlaceholder: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { menuId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(menuId, updates);
  },
});

export const deleteMenu = mutation({
  args: { menuId: v.id("dynamicMenus") },
  handler: async (ctx, args) => {
    // Delete children first
    const children = await ctx.db.query("dynamicMenus")
      .withIndex("by_parent", (q: any) => q.eq("parentId", args.menuId))
      .collect();
    for (const child of children) {
      await ctx.db.delete(child._id);
    }
    await ctx.db.delete(args.menuId);
  },
});

export const reorderMenus = mutation({
  args: {
    menuIds: v.array(v.id("dynamicMenus")),
    group: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.menuIds.length; i++) {
      await ctx.db.patch(args.menuIds[i], { order: i + 1, group: args.group, updatedAt: now });
    }
  },
});

// ─── Seed Default Menus from Routes ─────────────────────────

export const seedDefaultMenus = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("dynamicMenus").collect();
    if (existing.length > 0) return { seeded: 0, message: "Menus already exist" };

    const defaults = [
      // ── Overview ──
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", group: "Overview", order: 1, roles: [], visibility: "visible" as const },
      
      // ── Studios ──
      { label: "Organization", href: "/org", icon: "Building2", group: "Studios", order: 1, visibility: "visible" as const },
      { label: "Master Data", href: "/studios/master-data", icon: "Database", group: "Studios", order: 2, visibility: "visible" as const },
      { label: "Access Control", href: "/access", icon: "Shield", group: "Studios", order: 3, roles: ["super_admin", "admin"], visibility: "visible" as const },
      { label: "Dashboards", href: "/studio/dashboards", icon: "LayoutDashboard", group: "Studios", order: 4, visibility: "visible" as const },
      { label: "Workflow", href: "/studios/workflows", icon: "Workflow", group: "Studios", order: 5, visibility: "visible" as const },
      { label: "Tasks", href: "/tasks", icon: "ListChecks", group: "Studios", order: 6, visibility: "visible" as const },
      
      // ── Business Modules ──
      { label: "Calendar", href: "/calendar", icon: "Calendar", group: "Business Modules", order: 1, visibility: "visible" as const },
      { label: "CRM", href: "/crm", icon: "Users", group: "Business Modules", order: 2, visibility: "visible" as const },
      { label: "Sales", href: "/crm/sales", icon: "LineChart", group: "Business Modules", order: 3, visibility: "visible" as const },
      { label: "Students", href: "/students", icon: "GraduationCap", group: "Business Modules", order: 4, visibility: "visible" as const },
      { label: "Academic", href: "/academic", icon: "BookOpen", group: "Business Modules", order: 5, visibility: "visible" as const },
      { label: "Finance", href: "/finance", icon: "PiggyBank", group: "Business Modules", order: 6, visibility: "visible" as const },
      { label: "People", href: "/people", icon: "CircleUser", group: "Business Modules", order: 7, visibility: "visible" as const },
      { label: "Employees", href: "/employees", icon: "UsersRound", group: "Business Modules", order: 8, visibility: "visible" as const },
      { label: "Marketing", href: "/communication-marketing", icon: "Megaphone", group: "Business Modules", order: 9, visibility: "visible" as const },
      { label: "Administration", href: "/administration", icon: "Building", group: "Business Modules", order: 10, visibility: "visible" as const },
      { label: "Procurement", href: "/procurement", icon: "ShoppingCart", group: "Business Modules", order: 11, visibility: "visible" as const },
      { label: "LMS", href: "/lms", icon: "BookOpen", group: "Business Modules", order: 12, visibility: "visible" as const },
      { label: "Communication", href: "/communication-marketing", icon: "MessageSquare", group: "Business Modules", order: 13, visibility: "visible" as const },
      { label: "Analytics", href: "/analytics", icon: "BarChart3", group: "Business Modules", order: 14, visibility: "visible" as const },
      { label: "Documents", href: "/documents", icon: "FileText", group: "Business Modules", order: 15, visibility: "visible" as const },
      { label: "Recruiting", href: "/recruiting", icon: "ContactRound", group: "Business Modules", order: 16, visibility: "visible" as const },
      { label: "Examinations", href: "/examinations", icon: "FileCheck", group: "Business Modules", order: 17, visibility: "visible" as const },
      { label: "Executive", href: "/control", icon: "Crown", group: "Business Modules", order: 18, roles: ["super_admin", "ceo"], visibility: "visible" as const },
      { label: "Configuration", href: "/configuration", icon: "Settings", group: "Business Modules", order: 19, roles: ["super_admin"], visibility: "visible" as const },
      
      // ── System ──
      { label: "Governance", href: "/governance", icon: "Shield", group: "System", order: 1, roles: ["super_admin"], visibility: "visible" as const },
      { label: "Settings", href: "/settings", icon: "Settings", group: "System", order: 2, visibility: "visible" as const, isPlaceholder: true },
    ];

    const now = Date.now();
    let count = 0;
    for (const item of defaults) {
      await ctx.db.insert("dynamicMenus", {
        ...item,
        isPlaceholder: (item as any).isPlaceholder ?? false,
        isActive: true,
        parentId: undefined,
        featureFlag: undefined,
        subscriptionPlan: undefined,
        badge: undefined,
        badgeColor: undefined,
        customColor: undefined,
        permissionKey: undefined,
        createdBy: undefined,
        createdAt: now,
        updatedAt: now,
      } as any);
      count++;
    }
    return { seeded: count, message: `Seeded ${count} default menus` };
  },
});
