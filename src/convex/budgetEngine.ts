/**
 * Budget Engine (Part 9)
 *
 * Support department, branch, project, campaign budgets.
 * Budget approval workflow, revision, consumption tracking, variance, forecast.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ═══════════════════════════════════════════════════════════════════
// BUDGET CRUD
// ═══════════════════════════════════════════════════════════════════

export const listBudgets = query({
  args: {
    fiscalYear: v.optional(v.string()),
    scopeType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("budgets") as any;
    if (args.fiscalYear) q = q.filter((f: any) => f.eq(f.field("fiscalYear"), args.fiscalYear));
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    const all = await q.collect();
    if (args.scopeType) return all.filter((b: any) => b.scopeType === args.scopeType);
    return all;
  },
});

export const getBudget = query({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createBudget = mutation({
  args: {
    name: v.string(), code: v.string(),
    fiscalYear: v.string(),
    scopeType: v.union(
      v.literal("department"), v.literal("branch"),
      v.literal("project"), v.literal("campaign"),
      v.literal("company"), v.literal("custom"),
    ),
    scopeId: v.optional(v.string()),
    totalAmount: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("budgets", {
      ...args, consumedAmount: 0, remainingAmount: args.totalAmount,
      status: "draft", createdBy: userId, createdAt: now, updatedAt: now,
    });
  },
});

export const updateBudget = mutation({
  args: {
    id: v.id("budgets"),
    name: v.optional(v.string()), description: v.optional(v.string()),
    totalAmount: v.optional(v.number()), status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const budget = await ctx.db.get(id);
    if (!budget) throw new Error("Budget not found");
    const patch: any = { ...updates, updatedAt: Date.now() };
    if (updates.totalAmount !== undefined) {
      patch.remainingAmount = updates.totalAmount - (budget as any).consumedAmount;
    }
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const submitBudgetForApproval = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  },
});

export const approveBudget = mutation({
  args: { id: v.id("budgets"), approved: v.boolean(), remarks: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.approved ? "approved" : "rejected",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const reviseBudget = mutation({
  args: {
    id: v.id("budgets"),
    newTotalAmount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.id);
    if (!budget) throw new Error("Budget not found");
    const now = Date.now();
    const consumed = (budget as any).consumedAmount || 0;

    await ctx.db.insert("budgetRevisions", {
      budgetId: args.id,
      previousAmount: (budget as any).totalAmount,
      newAmount: args.newTotalAmount,
      reason: args.reason,
      revisedAt: now,
    });

    await ctx.db.patch(args.id, {
      totalAmount: args.newTotalAmount,
      remainingAmount: args.newTotalAmount - consumed,
      status: "revised",
      updatedAt: now,
    });

    return args.id;
  },
});

export const getBudgetConsumption = query({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.id);
    if (!budget) return null;

    const budgetData = budget as any;
    const consumed = budgetData.consumedAmount || 0;
    const total = budgetData.totalAmount || 1;
    const variance = total - consumed;
    const utilizationPct = Math.round((consumed / total) * 10000) / 100;

    return {
      budget: budgetData,
      consumed,
      remaining: budgetData.remainingAmount || 0,
      variance,
      utilizationPercentage: utilizationPct,
      status: utilizationPct >= 100 ? "exhausted" : utilizationPct >= 80 ? "nearing_limit" : "within_limit",
    };
  },
});

export const recordBudgetConsumption = mutation({
  args: {
    budgetId: v.id("budgets"),
    amount: v.number(),
    description: v.string(),
    referenceType: v.string(),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget) throw new Error("Budget not found");
    const now = Date.now();

    const budgetData = budget as any;
    const newConsumed = (budgetData.consumedAmount || 0) + args.amount;
    const newRemaining = budgetData.totalAmount - newConsumed;

    await ctx.db.patch(args.budgetId, {
      consumedAmount: newConsumed,
      remainingAmount: Math.max(0, newRemaining),
      updatedAt: now,
    });

    await ctx.db.insert("budgetConsumptions", {
      budgetId: args.budgetId,
      amount: args.amount,
      description: args.description,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      consumedAt: now,
    });

    return { budgetId: args.budgetId, consumed: newConsumed, remaining: newRemaining };
  },
});

export const getBudgetVarianceReport = query({
  args: { fiscalYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let budgets = await ctx.db.query("budgets").collect();
    if (args.fiscalYear) budgets = budgets.filter((b: any) => b.fiscalYear === args.fiscalYear);

    return budgets.map((b: any) => {
      const total = b.totalAmount || 1;
      const consumed = b.consumedAmount || 0;
      return {
        id: b._id,
        name: b.name,
        code: b.code,
        scopeType: b.scopeType,
        fiscalYear: b.fiscalYear,
        totalAmount: total,
        consumedAmount: consumed,
        remainingAmount: b.remainingAmount || 0,
        variance: total - consumed,
        utilizationPercentage: Math.round((consumed / total) * 10000) / 100,
        status: b.status,
      };
    });
  },
});
