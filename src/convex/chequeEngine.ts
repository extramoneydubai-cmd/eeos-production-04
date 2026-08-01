/**
 * Cheque/PDC Engine — Enterprise Cheque Management
 *
 * Manages post-dated cheques (PDCs), cheque deposits,
 * cheque bounce workflows, penalty application, and reconciliation.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withEventPipeline, entityIdFromResult, entityIdFromArg } from "../platform/eventPipeline";
import { Events } from "./eventRegistry";

function generateChequeRef(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ─── Create PDC Entry ────────────────────────────────────────

export const createChequeEntry = mutation({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    invoiceId: v.optional(v.id("feeInvoices")),
    chequeNumber: v.string(),
    bankName: v.string(),
    bankBranch: v.optional(v.string()),
    chequeDate: v.number(),
    amount: v.number(),
    depositDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "cheque",
      action: "create",
      eventType: Events.FINANCE.CHEQUE_RECEIVED,
      title: "Cheque received",
      getEntityId: entityIdFromResult(),
      getUserId: () => undefined,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allCheques = await ctx.db.query("chequeEntries").collect();
    const chequeRef = generateChequeRef("CHQ", allCheques.length + 1);

    return ctx.db.insert("chequeEntries", {
      chequeRef,
      studentId: args.studentId,
      invoiceId: args.invoiceId,
      chequeNumber: args.chequeNumber,
      bankName: args.bankName,
      bankBranch: args.bankBranch,
      chequeDate: args.chequeDate,
      amount: args.amount,
      depositDate: args.depositDate,
      status: "received",
      notes: args.notes,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    },
  ),
});

// ─── Deposit Cheque ──────────────────────────────────────────

export const depositCheque = mutation({
  args: { id: v.id("chequeEntries"), depositDate: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cheque = await ctx.db.get(args.id);
    if (!cheque) throw new Error("Cheque not found");
    if (cheque.status !== "received") throw new Error("Cheque is not in received status");

    await ctx.db.patch(args.id, {
      status: "deposited",
      depositDate: args.depositDate,
      depositedBy: userId,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ─── Mark Cheque as Cleared ──────────────────────────────────

export const clearCheque = mutation({
  args: { id: v.id("chequeEntries"), clearanceDate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cheque = await ctx.db.get(args.id);
    if (!cheque) throw new Error("Cheque not found");
    if (cheque.status !== "deposited") throw new Error("Cheque must be deposited first");

    await ctx.db.patch(args.id, {
      status: "cleared",
      clearanceDate: args.clearanceDate || Date.now(),
      updatedAt: Date.now(),
    });

    // If linked to invoice, mark as paid
    if (cheque.invoiceId) {
      const invoice = await ctx.db.get(cheque.invoiceId);
      if (invoice) {
        const newPaid = (invoice as any).paidAmount + cheque.amount;
        const balance = (invoice as any).totalAmount - newPaid;
        await ctx.db.patch(cheque.invoiceId, {
          paidAmount: newPaid,
          balanceDue: Math.max(0, balance),
          status: balance <= 0 ? "paid" : "partial",
        });
      }
    }

    return args.id;
  },
});

// ─── Cheque Bounce ───────────────────────────────────────────

export const bounceCheque = mutation({
  args: {
    id: v.id("chequeEntries"),
    bounceReason: v.string(),
    bounceDate: v.optional(v.number()),
    penaltyAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "cheque",
      action: "bounce",
      eventType: Events.FINANCE.CHEQUE_BOUNCED,
      title: "Cheque bounced",
      getEntityId: entityIdFromArg("id"),
      getUserId: () => undefined,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cheque = await ctx.db.get(args.id);
    if (!cheque) throw new Error("Cheque not found");
    if (cheque.status === "cleared" || cheque.status === "bounced") throw new Error("Cheque already finalized");

    await ctx.db.patch(args.id, {
      status: "bounced",
      bounceReason: args.bounceReason,
      bounceDate: args.bounceDate || Date.now(),
      bounceRecordedBy: userId,
      notes: args.notes || cheque.notes,
      updatedAt: Date.now(),
    });

    // Apply penalty if specified
    if (args.penaltyAmount && args.penaltyAmount > 0) {
      await ctx.db.insert("penaltyEntries", {
        chequeId: args.id,
        studentId: cheque.studentId,
        invoiceId: cheque.invoiceId,
        amount: args.penaltyAmount,
        reason: `Cheque bounce penalty - ${args.bounceReason}`,
        status: "pending",
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return args.id;
    },
  ),
});

// ─── Re-present Cheque ───────────────────────────────────────

export const rePresentCheque = mutation({
  args: { id: v.id("chequeEntries"), newDepositDate: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cheque = await ctx.db.get(args.id);
    if (!cheque) throw new Error("Cheque not found");
    if (cheque.status !== "bounced") throw new Error("Only bounced cheques can be re-presented");

    await ctx.db.patch(args.id, {
      status: "deposited",
      depositDate: args.newDepositDate,
      bounceCount: ((cheque as any).bounceCount || 0) + 1,
      depositedBy: userId,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ─── List Cheques ────────────────────────────────────────────

export const listCheques = query({
  args: {
    status: v.optional(v.union(v.literal("received"), v.literal("deposited"), v.literal("cleared"), v.literal("bounced"))),
    studentId: v.optional(v.id("studentMaster")),
    bankName: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("chequeEntries");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.studentId) q = q.withIndex("studentId", (q2: any) => q2.eq("studentId", args.studentId));
    if (args.bankName) q = q.filter((q2: any) => q2.eq(q2.field("bankName"), args.bankName));

    let results = await q.order("desc").collect();
    if (args.startDate) results = results.filter((r: any) => r.createdAt >= args.startDate!);
    if (args.endDate) results = results.filter((r: any) => r.createdAt <= args.endDate!);
    return results;
  },
});

export const getCheque = query({
  args: { id: v.id("chequeEntries") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── Cheque Dashboard Stats ──────────────────────────────────

export const getChequeDashboard = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("chequeEntries").collect();
    return {
      total: all.length,
      received: all.filter((c: any) => c.status === "received").length,
      deposited: all.filter((c: any) => c.status === "deposited").length,
      cleared: all.filter((c: any) => c.status === "cleared").length,
      bounced: all.filter((c: any) => c.status === "bounced").length,
      totalValue: all.reduce((s: number, c: any) => s + c.amount, 0),
      bouncedValue: all.filter((c: any) => c.status === "bounced").reduce((s: number, c: any) => s + c.amount, 0),
    };
  },
});

// ─── Penalty Management ──────────────────────────────────────

export const listPenalties = query({
  args: { studentId: v.optional(v.id("studentMaster")), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("penaltyEntries");
    if (args.studentId) q = q.filter((q2: any) => q2.eq(q2.field("studentId"), args.studentId));
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    return q.collect();
  },
});

export const waivePenalty = mutation({
  args: { id: v.id("penaltyEntries"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "waived", notes: args.notes, updatedAt: Date.now() });
    return args.id;
  },
});

export const collectPenalty = mutation({
  args: { id: v.id("penaltyEntries") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "collected", updatedAt: Date.now() });
    return args.id;
  },
});
