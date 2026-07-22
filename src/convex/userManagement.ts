import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================
// USER MANAGEMENT
// ============================

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    username: v.string(),
    role: v.string(),
    designationId: v.optional(v.id("designations")),
    departmentId: v.optional(v.id("departments")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
    teamIds: v.optional(v.array(v.id("teams"))),
    phone: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userRole = args.role as "super_admin" | "admin" | "manager" | "staff";
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      username: args.username,
      role: userRole,
      isDisabled: false,
      designationId: args.designationId,
      departmentId: args.departmentId,
      companyId: args.companyId,
      branchId: args.branchId,
      verticalId: args.verticalId,
      teamIds: args.teamIds,
      phone: args.phone,
      employeeCode: args.employeeCode,
    });
    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    designationId: v.optional(v.id("designations")),
    departmentId: v.optional(v.id("departments")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
    teamIds: v.optional(v.array(v.id("teams"))),
    phone: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
    isDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const updates: Record<string, any> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.email !== undefined) updates.email = fields.email;
    if (fields.role !== undefined) updates.role = fields.role;
    if (fields.designationId !== undefined) updates.designationId = fields.designationId;
    if (fields.departmentId !== undefined) updates.departmentId = fields.departmentId;
    if (fields.companyId !== undefined) updates.companyId = fields.companyId;
    if (fields.branchId !== undefined) updates.branchId = fields.branchId;
    if (fields.verticalId !== undefined) updates.verticalId = fields.verticalId;
    if (fields.teamIds !== undefined) updates.teamIds = fields.teamIds;
    if (fields.phone !== undefined) updates.phone = fields.phone;
    if (fields.employeeCode !== undefined) updates.employeeCode = fields.employeeCode;
    if (fields.isDisabled !== undefined) updates.isDisabled = fields.isDisabled;
    await ctx.db.patch(userId, updates);
  },
});

export const disableUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { isDisabled: true });
  },
});

export const enableUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { isDisabled: false });
  },
});

export const resetPassword = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Reset the user's auth accounts - this will force them to use the reset flow
    // In a real app, you'd send a password reset email
  },
});

export const updateUserTeams = mutation({
  args: {
    userId: v.id("users"),
    teamIds: v.array(v.id("teams")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { teamIds: args.teamIds });
  },
});

export const cloneUserAccess = mutation({
  args: {
    sourceUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceUserId);
    if (!source) throw new Error("Source user not found");
    await ctx.db.patch(args.targetUserId, {
      departmentId: source.departmentId,
      companyId: source.companyId,
      branchId: source.branchId,
      verticalId: source.verticalId,
      teamIds: source.teamIds,
    });
  },
});

export const transferUserAccess = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    transferTeams: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const fromUser = await ctx.db.get(args.fromUserId);
    if (!fromUser) throw new Error("Source user not found");

    if (args.transferTeams && fromUser.teamIds) {
      // Add the fromUser teams to the toUser
      const toUser = await ctx.db.get(args.toUserId);
      if (toUser) {
        const mergedTeams = [...new Set([...(toUser.teamIds || []), ...fromUser.teamIds])];
        await ctx.db.patch(args.toUserId, { teamIds: mergedTeams });
      }
    }
  },
});

// ============================
// USER SCOPES
// ============================

export const getUserScope = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const scopes = await ctx.db.query("userScopes").withIndex("userId", (q) => q.eq("userId", args.userId)).collect();
    return scopes[0] || null;
  },
});

export const updateUserScope = mutation({
  args: {
    userId: v.id("users"),
    companyIds: v.optional(v.array(v.id("companies"))),
    departmentIds: v.optional(v.array(v.id("departments"))),
    branchIds: v.optional(v.array(v.id("branches"))),
    teamIds: v.optional(v.array(v.id("teams"))),
    verticalIds: v.optional(v.array(v.id("verticals"))),
    canAccessDashboard: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...scopeData } = args;
    const existing = await ctx.db.query("userScopes").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const now = Date.now();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, { ...scopeData, updatedAt: now });
    } else {
      await ctx.db.insert("userScopes", { userId, ...scopeData, createdAt: now, updatedAt: now });
    }
  },
});
