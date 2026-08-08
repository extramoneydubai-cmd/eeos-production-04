/**
 * Cost Center Engine (Part 4)
 *
 * Configurable cost centers mapped to company, branch, department,
 * vertical, course, batch, campaign, project, center.
 * Every transaction can optionally map to multiple cost centers.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// COST CENTER CRUD
// ═══════════════════════════════════════════════════════════════════

export const listCostCenters = query({
  args: {
    scopeType: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("costCenters") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("isActive"), true));
    const all = await q.collect();
    if (args.scopeType) return all.filter((c: any) => c.scopeType === args.scopeType);
    return all;
  },
});

export const getCostCenter = query({
  args: { id: v.id("costCenters") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createCostCenter = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    scopeType: v.union(
      v.literal("company"), v.literal("branch"), v.literal("department"),
      v.literal("vertical"), v.literal("course"), v.literal("batch"),
      v.literal("campaign"), v.literal("project"), v.literal("center"),
      v.literal("custom"),
    ),
    scopeId: v.optional(v.string()),
    parentId: v.optional(v.id("costCenters")),
    description: v.optional(v.string()),
    budgetAmount: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "costCenterEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("costCenters", {
      ...args, isActive: true, createdAt: now, updatedAt: now,
    });
  }),
});

export const updateCostCenter = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("costCenters"),
    name: v.optional(v.string()), description: v.optional(v.string()),
    budgetAmount: v.optional(v.number()), isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "costCenterEngine" }, async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  }),
});

// ═══════════════════════════════════════════════════════════════════
// BANKING ENGINE (Part 5)
// ═══════════════════════════════════════════════════════════════════

export const listBankAccounts = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("financeBankAccounts") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("active"), true));
    return await q.collect();
  },
});

export const getBankAccount = query({
  args: { id: v.id("financeBankAccounts") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createBankAccount = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    accountNumber: v.string(), bankName: v.string(),
    branchName: v.optional(v.string()), ifscCode: v.optional(v.string()),
    swiftCode: v.optional(v.string()), accountType: v.string(),
    isDefault: v.boolean(), description: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "costCenterEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("financeBankAccounts", {
      ...args, color: "#3b82f6", icon: "Landmark", sequence: 0,
      active: true, createdAt: now, updatedAt: now,
    });
  }),
});

export const recordBankDeposit = mutation({
  args: { token: v.optional(v.string()),
    bankAccountId: v.id("financeBankAccounts"),
    amount: v.number(),
    description: v.string(),
    referenceNumber: v.optional(v.string()),
    depositDate: v.number(),
    branchId: v.optional(v.id("orgBranches")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "costCenterEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("bankTransactions", {
      bankAccountId: args.bankAccountId,
      transactionType: "deposit",
      amount: args.amount,
      description: args.description,
      referenceNumber: args.referenceNumber,
      transactionDate: args.depositDate,
      status: "completed",
      branchId: args.branchId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const recordBankWithdrawal = mutation({
  args: { token: v.optional(v.string()),
    bankAccountId: v.id("financeBankAccounts"),
    amount: v.number(),
    description: v.string(),
    referenceNumber: v.optional(v.string()),
    withdrawalDate: v.number(),
    branchId: v.optional(v.id("orgBranches")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "costCenterEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("bankTransactions", {
      bankAccountId: args.bankAccountId,
      transactionType: "withdrawal",
      amount: args.amount,
      description: args.description,
      referenceNumber: args.referenceNumber,
      transactionDate: args.withdrawalDate,
      status: "completed",
      branchId: args.branchId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const recordInternalTransfer = mutation({
  args: { token: v.optional(v.string()),
    fromBankAccountId: v.id("financeBankAccounts"),
    toBankAccountId: v.id("financeBankAccounts"),
    amount: v.number(),
    description: v.string(),
    transferDate: v.number(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "costCenterEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("bankTransactions", {
      bankAccountId: args.fromBankAccountId,
      toBankAccountId: args.toBankAccountId,
      transactionType: "transfer",
      amount: args.amount,
      description: `Transfer: ${args.description}`,
      transactionDate: args.transferDate,
      status: "completed",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const listBankTransactions = query({
  args: {
    bankAccountId: v.optional(v.id("financeBankAccounts")),
    transactionType: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("bankTransactions") as any;
    if (args.bankAccountId) q = q.filter((f: any) => f.eq(f.field("bankAccountId"), args.bankAccountId));
    if (args.transactionType) q = q.filter((f: any) => f.eq(f.field("transactionType"), args.transactionType));
    const results = await q.order("desc").take(args.limit || 50);
    let filtered = results;
    if (args.startDate) filtered = filtered.filter((r: any) => r.transactionDate >= args.startDate!);
    if (args.endDate) filtered = filtered.filter((r: any) => r.transactionDate <= args.endDate!);
    return { items: filtered, total: filtered.length };
  },
});
