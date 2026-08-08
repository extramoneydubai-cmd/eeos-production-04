/**
 * Bank Reconciliation Engine
 *
 * Matches bank statement entries with internal transactions
 * to identify discrepancies and produce reconciliation reports.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Import Bank Statement ───────────────────────────────────

export const importBankStatement = mutation({
  args: { token: v.optional(v.string()),
    bankName: v.string(),
    accountNumber: v.string(),
    statementPeriod: v.string(),
    entries: v.array(v.object({
      transactionDate: v.number(),
      description: v.string(),
      debit: v.optional(v.number()),
      credit: v.optional(v.number()),
      reference: v.optional(v.string()),
    })),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "bankReconciliationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const statementId = await ctx.db.insert("bankStatements", {
      bankName: args.bankName,
      accountNumber: args.accountNumber,
      statementPeriod: args.statementPeriod,
      importedBy: userId,
      status: "imported",
      matchingStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (const entry of args.entries) {
      await ctx.db.insert("bankStatementEntries", {
        statementId,
        transactionDate: entry.transactionDate,
        description: entry.description,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        reference: entry.reference,
        matched: false,
        createdAt: Date.now(),
      });
    }

    return statementId;
  }),
});

// ─── Match Entry ─────────────────────────────────────────────

export const matchBankEntry = mutation({
  args: { token: v.optional(v.string()),
    bankEntryId: v.id("bankStatementEntries"),
    transactionId: v.id("paymentTransactions"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "bankReconciliationEngine" }, async (ctx, args) => {
    const bankEntry = await ctx.db.get(args.bankEntryId);
    if (!bankEntry) throw new Error("Bank entry not found");

    await ctx.db.patch(args.bankEntryId, {
      matched: true,
      matchedTransactionId: args.transactionId,
      matchedAt: Date.now(),
    });

    return args.bankEntryId;
  }),
});

// ─── Reconcile Statement ─────────────────────────────────────

export const reconcileStatement = mutation({
  args: { token: v.optional(v.string()), statementId: v.id("bankStatements") },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "bankReconciliationEngine" }, async (ctx, args) => {
    const entries = await ctx.db.query("bankStatementEntries")
      .withIndex("statementId", (q: any) => q.eq("statementId", args.statementId))
      .collect();

    const matched = entries.filter((e: any) => e.matched).length;
    const unmatched = entries.filter((e: any) => !e.matched).length;
    const totalMatchedValue = entries.filter((e: any) => e.matched)
      .reduce((s: number, e: any) => s + (e.debit || 0) + (e.credit || 0), 0);
    const totalUnmatchedValue = entries.filter((e: any) => !e.matched)
      .reduce((s: number, e: any) => s + (e.debit || 0) + (e.credit || 0), 0);

    await ctx.db.patch(args.statementId, {
      matchingStatus: unmatched === 0 ? "fully_matched" : "partial",
      matchedCount: matched,
      unmatchedCount: unmatched,
      totalMatchedValue,
      totalUnmatchedValue,
      reconciledAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      matched,
      unmatched,
      totalMatchedValue,
      totalUnmatchedValue,
      status: unmatched === 0 ? "fully_matched" : "partial",
    };
  }),
});

// ─── List Statements ─────────────────────────────────────────

export const listBankStatements = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("bankStatements");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("matchingStatus"), args.status));
    return q.order("desc").collect();
  },
});

export const getBankStatement = query({
  args: { id: v.id("bankStatements") },
  handler: async (ctx, args) => {
    const statement = await ctx.db.get(args.id);
    if (!statement) return null;
    const entries = await ctx.db.query("bankStatementEntries")
      .withIndex("statementId", (q: any) => q.eq("statementId", args.id))
      .collect();
    return { ...statement, entries };
  },
});

export const getReconciliationSummary = query({
  handler: async (ctx) => {
    const statements = await ctx.db.query("bankStatements").collect();
    const totalStatements = statements.length;
    const reconciledStatements = statements.filter((s: any) => s.matchingStatus === "fully_matched").length;
    const totalEntries = statements.reduce((s: number, st: any) => s + (st.matchedCount || 0) + (st.unmatchedCount || 0), 0);
    const matchedEntries = statements.reduce((s: number, st: any) => s + (st.matchedCount || 0), 0);

    return {
      totalStatements,
      reconciledStatements,
      pendingStatements: totalStatements - reconciledStatements,
      totalEntries,
      matchedEntries,
      unmatchedEntries: totalEntries - matchedEntries,
      matchRate: totalEntries > 0 ? Math.round((matchedEntries / totalEntries) * 100) : 0,
    };
  },
});
