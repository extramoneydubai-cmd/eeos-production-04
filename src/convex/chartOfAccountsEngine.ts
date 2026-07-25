/**
 * Chart of Accounts Engine (Part 1)
 *
 * Configurable account hierarchy:
 *   Group Category (Assets, Liabilities, Income, Expenses, Equity)
 *       └── Account Group (Current Assets, Fixed Assets, etc.)
 *           └── Account (Cash, Bank, Receivables, etc.)
 *
 * No hardcoded account types. Fully configurable.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT GROUP QUERIES
// ═══════════════════════════════════════════════════════════════════

export const listAccountGroups = query({
  args: {
    category: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("accountGroups") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("isActive"), true));
    const results = await q.collect();
    if (args.category) return results.filter((r: any) => r.category === args.category);
    return results;
  },
});

export const getAccountGroup = query({
  args: { id: v.id("accountGroups") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createAccountGroup = mutation({
  args: {
    name: v.string(), code: v.string(),
    category: v.union(
      v.literal("assets"), v.literal("liabilities"),
      v.literal("income"), v.literal("expenses"),
      v.literal("equity"),
    ),
    parentId: v.optional(v.id("accountGroups")),
    description: v.optional(v.string()),
    normalBalance: v.union(v.literal("debit"), v.literal("credit")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("accountGroups", {
      ...args, isActive: true, createdAt: now, updatedAt: now,
    });
  },
});

export const updateAccountGroup = mutation({
  args: {
    id: v.id("accountGroups"),
    name: v.optional(v.string()), description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT QUERIES
// ═══════════════════════════════════════════════════════════════════

export const listAccounts = query({
  args: {
    groupId: v.optional(v.id("accountGroups")),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("chartOfAccounts") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("isActive"), true));
    if (args.groupId) q = q.filter((f: any) => f.eq(f.field("groupId"), args.groupId));
    return await q.collect();
  },
});

export const getAccount = query({
  args: { id: v.id("chartOfAccounts") },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) return null;
    const group = account.groupId ? await ctx.db.get(account.groupId as any) : null;
    return { ...account, groupName: group ? (group as any).name : null };
  },
});

export const getAccountByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chartOfAccounts")
      .filter((q: any) => q.eq(q.field("code"), args.code))
      .first();
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(), code: v.string(),
    groupId: v.id("accountGroups"),
    description: v.optional(v.string()),
    openingBalance: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("chartOfAccounts", {
      ...args, isActive: true, currentBalance: args.openingBalance || 0,
      createdAt: now, updatedAt: now,
    });
  },
});

export const updateAccount = mutation({
  args: {
    id: v.id("chartOfAccounts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    openingBalance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT HIERARCHY & BALANCE
// ═══════════════════════════════════════════════════════════════════

export const getAccountHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("accountGroups")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();
    const accounts = await ctx.db.query("chartOfAccounts")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const hierarchy: any[] = [];
    for (const group of groups) {
      const groupAccounts = accounts.filter((a: any) => a.groupId === group._id);
      hierarchy.push({
        group: { _id: group._id, name: group.name, code: group.code, category: (group as any).category },
        accounts: groupAccounts,
        totalBalance: groupAccounts.reduce((s: number, a: any) => s + (a.currentBalance || 0), 0),
      });
    }

    return hierarchy;
  },
});

export const getTrialBalance = query({
  args: { asOfDate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("chartOfAccounts")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();
    const groups = await ctx.db.query("accountGroups").collect();

    const entries = accounts.map((a: any) => {
      const group = groups.find((g: any) => g._id === a.groupId);
      const balance = a.currentBalance || 0;
      const normalBalance = group ? (group as any).normalBalance : "debit";
      return {
        account: { code: a.code, name: a.name },
        group: group ? (group as any).name : "Unknown",
        category: group ? (group as any).category : "unknown",
        debit: normalBalance === "debit" && balance >= 0 ? balance : 0,
        credit: normalBalance === "credit" && balance >= 0 ? balance : 0,
        balance,
      };
    });

    const totalDebit = entries.reduce((s: number, e: any) => s + e.debit, 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + e.credit, 0);

    return { entries, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
  },
});
