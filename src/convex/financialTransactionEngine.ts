/**
 * Financial Transaction Engine (Part 2)
 *
 * Every financial event ultimately becomes a Financial Transaction.
 *
 * Admissions → Student → HR → Procurement → Inventory → Marketing →
 * Administration → ALL create Financial Transactions.
 *
 * Reporting, Ledger, Audit, Cash Flow and Analytics derive from this
 * common financial foundation.
 *
 * Double-Entry Validation: Every transaction must have equal debits and credits.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withEventPipeline, entityIdFromResult, entityIdFromArg, userIdFromArg } from "../platform/eventPipeline";
import { getAuthUserId } from "@convex-dev/auth/server";

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function generateVoucherNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

function validateDoubleEntry(debits: number, credits: number): void {
  if (Math.abs(debits - credits) > 0.01) {
    throw new Error(`Double-entry violation: debits (${debits}) != credits (${credits})`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL TRANSACTION MUTATIONS
// ═══════════════════════════════════════════════════════════════════

export interface TransactionLine {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: string;
}

/**
 * Create a financial transaction with full double-entry validation.
 * This is the SINGLE entry point for ALL financial transactions.
 */
export const createTransaction = mutation({
  args: {
    transactionDate: v.number(),
    description: v.string(),
    voucherType: v.union(
      v.literal("journal"), v.literal("payment"), v.literal("receipt"),
      v.literal("invoice"), v.literal("expense"), v.literal("refund"),
      v.literal("transfer"), v.literal("adjustment"), v.literal("closing"),
      v.literal("opening"), v.literal("custom"),
    ),
    referenceModule: v.optional(v.string()),
    referenceEntity: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    lines: v.array(v.object({
      accountCode: v.string(),
      debit: v.number(),
      credit: v.number(),
      description: v.optional(v.string()),
      costCenterId: v.optional(v.id("costCenters")),
    })),
    companyId: v.optional(v.id("orgCompanies")),
    branchId: v.optional(v.id("orgBranches")),
    departmentId: v.optional(v.id("departments")),
    costCenterId: v.optional(v.id("costCenters")),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "transaction",
      action: "create",
      eventType: "finance.transaction.created",
      title: "Financial Transaction Created",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Transaction: ${args.voucherType} - ${args.description}`,
    },
    async (ctx: any, args: any) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated");
      const now = Date.now();

      // Double-entry validation
      const totalDebit = args.lines.reduce((s: number, l: any) => s + l.debit, 0);
      const totalCredit = args.lines.reduce((s: number, l: any) => s + l.credit, 0);
      validateDoubleEntry(totalDebit, totalCredit);

      // Generate voucher number
      const allTxns = await ctx.db.query("financialTransactions").collect();
      const voucherNumber = generateVoucherNumber(
        args.voucherType.toUpperCase().substring(0, 3),
        allTxns.length + 1,
      );

      // Post to chart of accounts
      for (const line of args.lines) {
        const account = await ctx.db
          .query("chartOfAccounts")
          .filter((q: any) => q.eq(q.field("code"), line.accountCode))
          .first();

        if (account) {
          const balanceChange = line.debit - line.credit;
          await ctx.db.patch(account._id, {
            currentBalance: (account.currentBalance || 0) + balanceChange,
            updatedAt: now,
          });
        }
      }

      // Create the transaction record
      const txnId = await ctx.db.insert("financialTransactions", {
        voucherNumber,
        transactionDate: args.transactionDate,
        description: args.description,
        voucherType: args.voucherType,
        referenceModule: args.referenceModule,
        referenceEntity: args.referenceEntity,
        referenceId: args.referenceId,
        lines: JSON.stringify(args.lines),
        totalDebit,
        totalCredit,
        companyId: args.companyId,
        branchId: args.branchId,
        departmentId: args.departmentId,
        costCenterId: args.costCenterId,
        currency: args.currency || "INR",
        status: "posted",
        createdBy: identity.subject as any,
        postedAt: now,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });

      // Create journal entry
      const allJournals = await ctx.db.query("journalEntries").collect();
      const entryNumber = generateVoucherNumber("JRN", allJournals.length + 1);

      await ctx.db.insert("journalEntries", {
        entryNumber,
        entryDate: args.transactionDate,
        description: `[Auto] ${args.description}`,
        debitAccount: args.lines[0]?.accountCode || "unknown",
        creditAccount: args.lines.length > 1 ? args.lines[1]?.accountCode || args.lines[0]?.accountCode || "unknown" : "unknown",
        amount: totalDebit,
        referenceType: args.voucherType as any,
        referenceId: txnId,
        status: "posted",
        createdBy: identity.subject as any,
        postedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return txnId;
    },
  ),
});

/**
 * Reverse a financial transaction.
 * Creates a compensating transaction that nullifies the original.
 */
export const reverseTransaction = mutation({
  args: {
    transactionId: v.id("financialTransactions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const txn = await ctx.db.get(args.transactionId);
    if (!txn) throw new Error("Transaction not found");
    if (txn.status === "reversed") throw new Error("Transaction already reversed");

    const now = Date.now();
    const lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }> =
      JSON.parse(txn.lines || "[]");

    // Reverse each line (swap debits and credits)
    const reversedLines = lines.map((l) => ({
      accountCode: l.accountCode,
      debit: l.credit,
      credit: l.debit,
      description: `[REVERSAL] ${l.description || txn.description}`,
    }));

    // Reverse account balances
    for (const line of reversedLines) {
      const account = await ctx.db
        .query("chartOfAccounts")
        .filter((q: any) => q.eq(q.field("code"), line.accountCode))
        .first();
      if (account) {
        const balanceChange = line.debit - line.credit;
        await ctx.db.patch(account._id, {
          currentBalance: (account.currentBalance || 0) + balanceChange,
          updatedAt: now,
        });
      }
    }

    // Mark original as reversed
    await ctx.db.patch(args.transactionId, {
      status: "reversed",
      updatedAt: now,
    });

    // Create reversal transaction
    const allTxns = await ctx.db.query("financialTransactions").collect();
    const voucherNumber = generateVoucherNumber("REV", allTxns.length + 1);

    return await ctx.db.insert("financialTransactions", {
      voucherNumber,
      transactionDate: now,
      description: `Reversal of ${txn.voucherNumber}: ${args.reason}`,
      voucherType: "adjustment",
      referenceModule: "finance",
      referenceEntity: "transaction",
      referenceId: args.transactionId,
      lines: JSON.stringify(reversedLines),
      totalDebit: reversedLines.reduce((s, l) => s + l.debit, 0),
      totalCredit: reversedLines.reduce((s, l) => s + l.credit, 0),
      currency: txn.currency,
      status: "posted",
      createdBy: identity.subject as any,
      postedAt: now,
      notes: args.reason,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL TRANSACTION QUERIES
// ═══════════════════════════════════════════════════════════════════

export const listFinancialTransactions = query({
  args: {
    voucherType: v.optional(v.string()),
    referenceModule: v.optional(v.string()),
    referenceEntity: v.optional(v.string()),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("financialTransactions") as any;
    if (args.voucherType) q = q.filter((f: any) => f.eq(f.field("voucherType"), args.voucherType));
    if (args.referenceModule) q = q.filter((f: any) => f.eq(f.field("referenceModule"), args.referenceModule));
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    const results = await q.order("desc").take(args.limit || 50);
    let filtered = results;
    if (args.startDate) filtered = filtered.filter((r: any) => r.transactionDate >= args.startDate!);
    if (args.endDate) filtered = filtered.filter((r: any) => r.transactionDate <= args.endDate!);
    return { items: filtered, total: filtered.length };
  },
});

export const getTransaction = query({
  args: { id: v.id("financialTransactions") },
  handler: async (ctx, args) => {
    const txn = await ctx.db.get(args.id);
    if (!txn) return null;
    return { ...txn, lines: JSON.parse(txn.lines || "[]") };
  },
});

export const getTransactionsByReference = query({
  args: {
    referenceModule: v.string(),
    referenceEntity: v.string(),
    referenceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financialTransactions")
      .filter((q: any) => q.and(
        q.eq(q.field("referenceModule"), args.referenceModule),
        q.eq(q.field("referenceEntity"), args.referenceEntity),
        q.eq(q.field("referenceId"), args.referenceId),
      ))
      .order("desc")
      .collect();
  },
});

// ═══════════════════════════════════════════════════════════════════
// GENERAL LEDGER & DAY BOOK (Part 3)
// ═══════════════════════════════════════════════════════════════════

export const getGeneralLedger = query({
  args: {
    accountCode: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let txns = await ctx.db.query("financialTransactions")
      .filter((q: any) => q.eq(q.field("status"), "posted"))
      .order("desc")
      .take(args.limit || 100);

    if (args.startDate) txns = txns.filter((t: any) => t.transactionDate >= args.startDate!);
    if (args.endDate) txns = txns.filter((t: any) => t.transactionDate <= args.endDate!);

    if (args.accountCode) {
      txns = txns.filter((t: any) => {
        const lines = JSON.parse(t.lines || "[]");
        return lines.some((l: any) => l.accountCode === args.accountCode);
      });
    }

    const entries = await Promise.all(txns.map(async (t: any) => {
      const lines = JSON.parse(t.lines || "[]");
      const user = await ctx.db.get(t.createdBy);
      return {
        ...t,
        lines,
        createdByName: user ? (user as any).name : "Unknown",
      };
    }));

    return { items: entries, total: entries.length };
  },
});

export const getDayBook = query({
  args: {
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dayStart = args.date
      ? new Date(args.date).setHours(0, 0, 0, 0)
      : new Date(Date.now()).setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const txns = await ctx.db.query("financialTransactions")
      .filter((q: any) => q.eq(q.field("status"), "posted"))
      .collect();

    const dayTxns = txns.filter(
      (t: any) => t.transactionDate >= dayStart && t.transactionDate < dayEnd
    );

    const totalDebit = dayTxns.reduce((s: number, t: any) => s + t.totalDebit, 0);
    const totalCredit = dayTxns.reduce((s: number, t: any) => s + t.totalCredit, 0);

    return {
      date: dayStart,
      transactions: dayTxns.sort((a: any, b: any) => b.createdAt - a.createdAt),
      totalTransactions: dayTxns.length,
      totalDebit,
      totalCredit,
    };
  },
});

export const getCashBook = query({
  args: {
    branchId: v.optional(v.id("orgBranches")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get cash account
    const cashAccount = await ctx.db
      .query("chartOfAccounts")
      .filter((q: any) => q.eq(q.field("code"), "CASH"))
      .first();

    if (!cashAccount) return { entries: [], totalDebit: 0, totalCredit: 0, balance: 0 };

    let txns = await ctx.db.query("financialTransactions")
      .filter((q: any) => q.eq(q.field("status"), "posted"))
      .collect();

    // Filter for cash-related transactions
    txns = txns.filter((t: any) => {
      const lines = JSON.parse(t.lines || "[]");
      return lines.some((l: any) => l.accountCode === "CASH");
    });

    if (args.startDate) txns = txns.filter((t: any) => t.transactionDate >= args.startDate!);
    if (args.endDate) txns = txns.filter((t: any) => t.transactionDate <= args.endDate!);
    if (args.branchId) txns = txns.filter((t: any) => t.branchId === args.branchId);

    const entries = txns.map((t: any) => {
      const lines = JSON.parse(t.lines || "[]");
      const cashLine = lines.find((l: any) => l.accountCode === "CASH");
      return {
        ...t,
        cashDebit: cashLine?.debit || 0,
        cashCredit: cashLine?.credit || 0,
      };
    });

    return {
      entries,
      totalDebit: entries.reduce((s: number, e: any) => s + e.cashDebit, 0),
      totalCredit: entries.reduce((s: number, e: any) => s + e.cashCredit, 0),
      balance: cashAccount.currentBalance || 0,
    };
  },
});
