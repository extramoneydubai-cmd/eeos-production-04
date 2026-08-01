import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

// ============================
// GROUP (organizations table — single record)
// ============================

export const getGroup = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    return orgs[0] || null;
  },
});

export const updateGroup = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgs = await ctx.db.query("organizations").collect();
    const existing = orgs[0];
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        code: args.code,
        description: args.description,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("organizations", {
        name: args.name,
        code: args.code,
        description: args.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// ============================
// DESIGNATIONS
// ============================

export const listDesignations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("designations").collect();
  },
});

export const createDesignation = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    status: v.string(),
    description: v.optional(v.string()),
    reportsTo: v.optional(v.id("designations")),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("designations", {
      name: args.name,
      code: args.code,
      status: args.status,
      description: args.description,
      reportsTo: args.reportsTo,
      color: args.color,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDesignation = mutation({
  args: {
    id: v.id("designations"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    reportsTo: v.optional(v.id("designations")),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteDesignation = mutation({
  args: { id: v.id("designations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============================
// DEPARTMENTS
// ============================

export const listDepartments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
  },
});

export const listDepartmentsByParent = query({
  args: {
    parentType: v.union(v.literal("group"), v.literal("company")),
    parentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("departments")
      .withIndex("parentType_parentId", (q) =>
        q.eq("parentType", args.parentType).eq("parentId", args.parentId),
      )
      .collect();
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    parentType: v.string(),
    parentId: v.string(),
    branchId: v.optional(v.id("branches")),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("departments", {
      name: args.name,
      code: args.code,
      parentType: args.parentType as "group" | "company",
      parentId: args.parentId,
      branchId: args.branchId,
      description: args.description,
      color: args.color,
      icon: args.icon,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDepartment = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    // Check for dependent teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_department", (q) => q.eq("departmentId", args.id))
      .collect();
    if (teams.length > 0) {
      throw new Error(
        `Cannot delete department. ${teams.length} team(s) depend on it. Remove teams first.`,
      );
    }
    await ctx.db.delete(args.id);
  },
});

// ============================
// COMPANIES
// ============================

export const listCompanies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").collect();
  },
});

export const createCompany = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    companyType: v.optional(v.string()),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the single group
    const orgs = await ctx.db.query("organizations").collect();
    const groupId = orgs[0]?._id;
    const now = Date.now();
    return await ctx.db.insert("companies", {
      name: args.name,
      code: args.code,
      companyType: args.companyType || "",
      status: args.status || "active",
      parentType: "group",
      parentId: groupId || "",
      description: args.description,
      color: args.color,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCompany = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    companyType: v.optional(v.string()),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteCompany = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    // Check for dependent branches
    const branches = await ctx.db
      .query("branches")
      .withIndex("parentType_parentId", (q) =>
        q.eq("parentType", "company").eq("parentId", args.id),
      )
      .collect();
    if (branches.length > 0) {
      throw new Error(
        `Cannot delete company. ${branches.length} branch(es) depend on it. Remove branches first.`,
      );
    }
    // Check for dependent departments
    const depts = await ctx.db
      .query("departments")
      .withIndex("parentType_parentId", (q) =>
        q.eq("parentType", "company").eq("parentId", args.id),
      )
      .collect();
    if (depts.length > 0) {
      throw new Error(
        `Cannot delete company. ${depts.length} department(s) depend on it. Remove departments first.`,
      );
    }
    await ctx.db.delete(args.id);
  },
});

// ============================
// BRANCHES
// ============================

export const listBranches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("branches").collect();
  },
});

export const listBranchesByParent = query({
  args: {
    parentType: v.union(v.literal("group"), v.literal("company")),
    parentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("branches")
      .withIndex("parentType_parentId", (q) =>
        q.eq("parentType", args.parentType).eq("parentId", args.parentId),
      )
      .collect();
  },
});

export const createBranch = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    parentType: v.string(),
    parentId: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("branches", {
      name: args.name,
      code: args.code,
      parentType: args.parentType as "group" | "company",
      parentId: args.parentId,
      isActive: true,
      description: args.description,
      color: args.color,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBranch = mutation({
  args: {
    id: v.id("branches"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteBranch = mutation({
  args: { id: v.id("branches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============================
// TEAMS
// ============================

export const listTeams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teams").collect();
  },
});

export const listDepartmentsByBranch = query({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("departments")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect();
  },
});

export const listTeamsByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();
  },
});

export const createTeam = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("teams", {
      name: args.name,
      code: args.code,
      departmentId: args.departmentId,
      description: args.description,
      leadId: args.leadId,
      isActive: true,
      color: args.color,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTeam = mutation({
  args: {
    id: v.id("teams"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteTeam = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============================
// VERTICALS
// ============================

export const listVerticals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("verticals").collect();
  },
});

export const createVertical = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("verticals", {
      name: args.name,
      code: args.code,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateVertical = mutation({
  args: {
    id: v.id("verticals"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteVertical = mutation({
  args: { id: v.id("verticals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============================
// SUB VERTICALS
// ============================

export const listSubVerticals = query({
  args: { verticalId: v.optional(v.id("verticals")) },
  handler: async (ctx, args) => {
    if (args.verticalId) {
      return await ctx.db
        .query("subVerticals")
        .withIndex("verticalId", (q) => q.eq("verticalId", args.verticalId!))
        .collect();
    }
    return await ctx.db.query("subVerticals").collect();
  },
});

export const createSubVertical = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    verticalId: v.id("verticals"),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("subVerticals", {
      name: args.name,
      code: args.code,
      verticalId: args.verticalId,
      description: args.description,
      status: args.status || "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSubVertical = mutation({
  args: {
    id: v.id("subVerticals"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteSubVertical = mutation({
  args: { id: v.id("subVerticals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============================
// BOARDS
// ============================

export const listBoards = query({
  args: {
    subVerticalId: v.optional(v.id("subVerticals")),
    verticalId: v.optional(v.id("verticals")),
  },
  handler: async (ctx, args) => {
    if (args.subVerticalId) {
      return await ctx.db
        .query("boards")
        .withIndex("subVerticalId", (q) => q.eq("subVerticalId", args.subVerticalId!))
        .collect();
    }
    return (await ctx.db.query("boards").collect()).filter((b) => {
      if (args.verticalId) return b.verticalId === args.verticalId;
      return true;
    });
  },
});

export const createBoard = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    subVerticalId: v.optional(v.id("subVerticals")),
    verticalId: v.optional(v.id("verticals")),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("boards", {
      name: args.name,
      code: args.code,
      subVerticalId: args.subVerticalId,
      verticalId: args.verticalId,
      description: args.description,
      status: args.status || "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBoard = mutation({
  args: {
    id: v.id("boards"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteBoard = mutation({
  args: { id: v.id("boards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
