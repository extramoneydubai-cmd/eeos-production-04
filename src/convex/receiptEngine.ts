import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${ts}-${rand}`;
}

// ─── GENERATE RECEIPT ────────────────────────────────────

export const generateReceipt = mutation({
  args: { token: v.optional(v.string()),
    invoiceId: v.optional(v.id("feeInvoices")),
    studentId: v.id("studentMaster"),
    transactionId: v.optional(v.id("paymentTransactions")),
    amount: v.number(),
    receiptType: v.union(v.literal("payment"), v.literal("refund"), v.literal("adjustment")),
    receiptData: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "receiptEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const receiptNumber = generateReceiptNumber();

    const id = await ctx.db.insert("receiptHistory", {
      receiptNumber,
      invoiceId: args.invoiceId,
      studentId: args.studentId,
      transactionId: args.transactionId,
      amount: args.amount,
      receiptDate: Date.now(),
      receiptType: args.receiptType,
      receiptData: args.receiptData,
      createdBy: userId,
    });

    return { id, receiptNumber };
  }),
});

// ─── GET RECEIPT DATA ────────────────────────────────────

export const getReceipt = query({
  args: { id: v.id("receiptHistory") },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.id);
    if (!receipt) throw new Error("Receipt not found");

    const student = await ctx.db.get(receipt.studentId);
    const transaction = receipt.transactionId ? await ctx.db.get(receipt.transactionId) : null;

    return {
      ...receipt,
      studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
      admissionNumber: student ? (student as any).admissionNumber : null,
      transactionNumber: transaction ? (transaction as any).transactionNumber : null,
      paymentMethod: transaction ? (transaction as any).paymentMethod : null,
    };
  },
});

// ─── LIST RECEIPTS ───────────────────────────────────────

export const listReceipts = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    receiptType: v.optional(v.union(v.literal("payment"), v.literal("refund"), v.literal("adjustment"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("receiptHistory");

    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.receiptType) {
      query = query.filter((q: any) => q.eq(q.field("receiptType"), args.receiptType));
    }

    let results = await query.order("desc").collect();

    if (args.startDate) {
      results = results.filter((r: any) => r.receiptDate >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((r: any) => r.receiptDate <= args.endDate!);
    }

    // Enrich with student names
    const enriched = await Promise.all(
      results.map(async (r: any) => {
        const student = await ctx.db.get(r.studentId);
        return {
          ...r,
          studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
        };
      })
    );

    return enriched;
  },
});

// ─── MARK RECEIPT AS EMAILED / WHATSAPP ──────────────────

export const markReceiptEmailed = mutation({
  args: { token: v.optional(v.string()), id: v.id("receiptHistory") },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "receiptEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.id, { emailedAt: Date.now() });
    return args.id;
  }),
});

export const markReceiptWhatsApped = mutation({
  args: { token: v.optional(v.string()), id: v.id("receiptHistory") },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "receiptEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.id, { whatsappSentAt: Date.now() });
    return args.id;
  }),
});
