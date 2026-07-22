import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("designations", {
      name: args.name,
      code: args.code,
      status: args.status,
      description: args.description,
      reportsTo: args.reportsTo,
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

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    branchId: v.id("branches"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("departments", {
      name: args.name,
      code: args.code,
      branchId: args.branchId,
      description: args.description,
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
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    // Also delete associated teams
    const teams = await ctx.db.query("teams").withIndex("by_department", (q) => q.eq("departmentId", args.id)).collect();
    for (const team of teams) {
      await ctx.db.delete(team._id);
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

export const listCompaniesByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db.query("companies").withIndex("departmentId", (q) => q.eq("departmentId", args.departmentId)).collect();
  },
});

export const createCompany = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("companies", {
      name: args.name,
      code: args.code,
      departmentId: args.departmentId,
      description: args.description,
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
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteCompany = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
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

export const createBranch = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("branches", {
      name: args.name,
      code: args.code,
      description: args.description,
      isActive: true,
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

export const listTeamsByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db.query("teams").withIndex("by_department", (q) => q.eq("departmentId", args.departmentId)).collect();
  },
});

export const createTeam = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
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
      return await ctx.db.query("subVerticals").withIndex("verticalId", (q) => q.eq("verticalId", args.verticalId!)).collect();
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
  args: { subVerticalId: v.optional(v.id("subVerticals")), verticalId: v.optional(v.id("verticals")) },
  handler: async (ctx, args) => {
    if (args.subVerticalId) {
      return await ctx.db.query("boards").withIndex("subVerticalId", (q) => q.eq("subVerticalId", args.subVerticalId!)).collect();
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
