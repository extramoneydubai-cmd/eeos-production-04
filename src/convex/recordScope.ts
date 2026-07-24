import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Record Policy CRUD ───────────────────────────────────

export const setRecordPolicy = mutation({
  args: {
    module: v.string(),
    recordId: v.string(),
    policyId: v.optional(v.id("visibilityPolicies")),
    ownerUserId: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recordPolicies")
      .withIndex("module_recordId", (q) =>
        q.eq("module", args.module).eq("recordId", args.recordId)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        policyId: args.policyId,
        ownerUserId: args.ownerUserId,
        departmentId: args.departmentId,
        branchId: args.branchId,
        companyId: args.companyId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("recordPolicies", {
      module: args.module,
      recordId: args.recordId,
      policyId: args.policyId,
      ownerUserId: args.ownerUserId,
      departmentId: args.departmentId,
      branchId: args.branchId,
      companyId: args.companyId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeRecordPolicy = mutation({
  args: { policyId: v.id("recordPolicies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.policyId);
    return args.policyId;
  },
});

export const getRecordPolicy = query({
  args: {
    module: v.string(),
    recordId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recordPolicies")
      .withIndex("module_recordId", (q) =>
        q.eq("module", args.module).eq("recordId", args.recordId)
      )
      .first();
  },
});

export const listRecordPolicies = query({
  args: {
    module: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("recordPolicies");

    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }
    if (args.departmentId) {
      query = query.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }
    if (args.branchId) {
      query = query.filter((q) => q.eq(q.field("branchId"), args.branchId));
    }
    if (args.companyId) {
      query = query.filter((q) => q.eq(q.field("companyId"), args.companyId));
    }

    return await query.collect();
  },
});

// ─── Scope Evaluation ─────────────────────────────────────

export const evaluateRecordScope = query({
  args: {
    module: v.string(),
    recordId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { inScope: false, reason: "User not found" };

    // Super admin always in scope
    if (user.role === "super_admin") {
      return { inScope: true, reason: "Super admin" };
    }

    const recordPolicy = await ctx.db
      .query("recordPolicies")
      .withIndex("module_recordId", (q) =>
        q.eq("module", args.module).eq("recordId", args.recordId)
      )
      .first();

    // No policy = no scope restriction for admin/manager
    if (!recordPolicy) {
      if (user.role === "admin" || user.role === "manager") {
        return { inScope: true, reason: "No policy restriction" };
      }
      return { inScope: false, reason: "No record policy found for staff role" };
    }

    // Check ownership
    if (recordPolicy.ownerUserId === args.userId) {
      return { inScope: true, reason: "Record owner" };
    }

    // Check organization scope matching
    if (recordPolicy.departmentId && user.departmentId === recordPolicy.departmentId) {
      return { inScope: true, reason: "Same department" };
    }
    if (recordPolicy.branchId && user.branchId === recordPolicy.branchId) {
      return { inScope: true, reason: "Same branch" };
    }
    if (recordPolicy.companyId && user.companyId === recordPolicy.companyId) {
      return { inScope: true, reason: "Same company" };
    }

    // Check user's explicit department/branch/company scopes
    const userScope = await ctx.db
      .query("userScopes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (userScope) {
      if (recordPolicy.departmentId && userScope.departmentIds?.includes(recordPolicy.departmentId)) {
        return { inScope: true, reason: "In department scope" };
      }
      if (recordPolicy.branchId && userScope.branchIds?.includes(recordPolicy.branchId)) {
        return { inScope: true, reason: "In branch scope" };
      }
      if (recordPolicy.companyId && userScope.companyIds?.includes(recordPolicy.companyId)) {
        return { inScope: true, reason: "In company scope" };
      }
    }

    return { inScope: false, reason: "No scope match" };
  },
});

/**
 * Get all record policies for records owned by or accessible to a user.
 */
export const getUserAccessibleRecords = query({
  args: {
    userId: v.id("users"),
    module: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { items: [], total: 0 };

    // Super admin sees all
    if (user.role === "super_admin") {
      let query = ctx.db.query("recordPolicies");
      if (args.module) {
        query = query.filter((q) => q.eq(q.field("module"), args.module));
      }
      const all = await query.collect();
      return { items: all, total: all.length };
    }

    let query = ctx.db.query("recordPolicies");
    if (args.module) {
      query = query.filter((q) => q.eq(q.field("module"), args.module));
    }

    const allPolicies = await query.collect();

    // Filter by ownership and scopes
    const userScope = await ctx.db
      .query("userScopes")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const accessible = allPolicies.filter((rp) => {
      // Ownership
      if (rp.ownerUserId === args.userId) return true;

      // Department match
      if (rp.departmentId && user.departmentId === rp.departmentId) return true;
      if (rp.branchId && user.branchId === rp.branchId) return true;
      if (rp.companyId && user.companyId === rp.companyId) return true;

      // Scope match
      if (userScope) {
        if (rp.departmentId && userScope.departmentIds?.includes(rp.departmentId)) return true;
        if (rp.branchId && userScope.branchIds?.includes(rp.branchId)) return true;
        if (rp.companyId && userScope.companyIds?.includes(rp.companyId)) return true;
      }

      return false;
    });

    return { items: accessible, total: accessible.length };
  },
});

/**
 * Bulk assign record policies to a list of records.
 */
export const bulkAssignRecordPolicies = mutation({
  args: {
    module: v.string(),
    recordIds: v.array(v.string()),
    policyId: v.optional(v.id("visibilityPolicies")),
    ownerUserId: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: string[] = [];

    for (const recordId of args.recordIds) {
      const existing = await ctx.db
        .query("recordPolicies")
        .withIndex("module_recordId", (q) =>
          q.eq("module", args.module).eq("recordId", recordId)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          policyId: args.policyId,
          ownerUserId: args.ownerUserId,
          departmentId: args.departmentId,
          branchId: args.branchId,
          companyId: args.companyId,
          updatedAt: now,
        });
        results.push(existing._id);
      } else {
        const id = await ctx.db.insert("recordPolicies", {
          module: args.module,
          recordId,
          policyId: args.policyId,
          ownerUserId: args.ownerUserId,
          departmentId: args.departmentId,
          branchId: args.branchId,
          companyId: args.companyId,
          createdAt: now,
          updatedAt: now,
        });
        results.push(id);
      }
    }

    return results;
  },
});
