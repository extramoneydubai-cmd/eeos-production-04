import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── HELPERS ───────────────────────────────────────────────

async function createTimelineEvent(
  ctx: any,
  args: { studentId: string; eventType: string; title: string; description?: string; metadata?: string; performedBy?: string }
) {
  const performedBy = args.performedBy || (await getAuthUserId(ctx));
  await ctx.db.insert("studentEnrollmentHistory", {
    studentId: args.studentId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    performedBy: performedBy,
    createdAt: Date.now(),
  });
}

function generateInvoiceNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ─── INVOICES ──────────────────────────────────────────────

export const generateInvoice = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    lineItems: v.string(),
    subtotal: v.number(),
    discountAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    totalAmount: v.number(),
    dueDate: v.number(),
    billingPeriod: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Count existing invoices to generate sequential number
    const allInvoices = await ctx.db.query("feeInvoices").collect();
    const invoiceNumber = generateInvoiceNumber("INV", allInvoices.length + 1);

    const id = await ctx.db.insert("feeInvoices", {
      invoiceNumber,
      studentId: args.studentId,
      feeAccountId: args.feeAccountId,
      invoiceDate: Date.now(),
      dueDate: args.dueDate,
      lineItems: args.lineItems,
      subtotal: args.subtotal,
      discountAmount: args.discountAmount || 0,
      taxAmount: args.taxAmount || 0,
      totalAmount: args.totalAmount,
      paidAmount: 0,
      balanceDue: args.totalAmount,
      status: "pending",
      billingPeriod: args.billingPeriod,
      notes: args.notes,
      createdBy: userId,
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "InvoiceGenerated",
      title: "Invoice Generated",
      description: `Invoice ${invoiceNumber}: ${args.totalAmount}`,
      metadata: JSON.stringify({ invoiceId: id, invoiceNumber, amount: args.totalAmount }),
      performedBy: userId,
    });

    return { id, invoiceNumber };
  },
});

export const cancelInvoice = mutation({
  args: {
    invoiceId: v.id("feeInvoices"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Cannot cancel a paid invoice");
    if (invoice.status === "cancelled") throw new Error("Invoice already cancelled");

    await ctx.db.patch(args.invoiceId, {
      status: "cancelled",
      notes: args.reason ? `${invoice.notes || ""} Cancelled: ${args.reason}`.trim() : invoice.notes,
    });

    await createTimelineEvent(ctx, {
      studentId: invoice.studentId,
      eventType: "InvoiceCancelled",
      title: "Invoice Cancelled",
      description: `Invoice ${invoice.invoiceNumber} cancelled: ${args.reason || "No reason"}`,
      performedBy: userId,
    });

    return args.invoiceId;
  },
});

export const regenerateInvoice = mutation({
  args: {
    invoiceId: v.id("feeInvoices"),
    lineItems: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const oldInvoice = await ctx.db.get(args.invoiceId);
    if (!oldInvoice) throw new Error("Invoice not found");

    // Cancel the old invoice
    await ctx.db.patch(args.invoiceId, { status: "cancelled" });

    // Generate new invoice
    const allInvoices = await ctx.db.query("feeInvoices").collect();
    const invoiceNumber = generateInvoiceNumber("INV", allInvoices.length + 1);

    const newId = await ctx.db.insert("feeInvoices", {
      invoiceNumber,
      studentId: oldInvoice.studentId,
      feeAccountId: oldInvoice.feeAccountId,
      invoiceDate: Date.now(),
      dueDate: args.dueDate || oldInvoice.dueDate,
      lineItems: args.lineItems || oldInvoice.lineItems,
      subtotal: args.subtotal || oldInvoice.subtotal,
      discountAmount: args.discountAmount !== undefined ? args.discountAmount : oldInvoice.discountAmount,
      taxAmount: args.taxAmount !== undefined ? args.taxAmount : oldInvoice.taxAmount,
      totalAmount: args.totalAmount || oldInvoice.totalAmount,
      paidAmount: 0,
      balanceDue: args.totalAmount || oldInvoice.totalAmount,
      status: "pending",
      billingPeriod: oldInvoice.billingPeriod,
      notes: args.notes || oldInvoice.notes,
      createdBy: userId,
    });

    await createTimelineEvent(ctx, {
      studentId: oldInvoice.studentId,
      eventType: "InvoiceRegenerated",
      title: "Invoice Regenerated",
      description: `Invoice ${oldInvoice.invoiceNumber} → ${invoiceNumber}`,
      metadata: JSON.stringify({ oldInvoiceId: args.invoiceId, newInvoiceId: newId, newInvoiceNumber: invoiceNumber }),
      performedBy: userId,
    });

    return { id: newId, invoiceNumber };
  },
});

export const listInvoices = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    status: v.optional(v.union(
      v.literal("draft"), v.literal("pending"), v.literal("paid"),
      v.literal("partial"), v.literal("overdue"), v.literal("cancelled"), v.literal("refunded")
    )),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeInvoices");
    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    return query.order("desc").collect();
  },
});

export const getInvoice = query({
  args: { id: v.id("feeInvoices") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ─── RECEIPTS ──────────────────────────────────────────────

export const generateReceipt = mutation({
  args: {
    studentId: v.id("studentMaster"),
    invoiceId: v.optional(v.id("feeInvoices")),
    transactionId: v.id("paymentTransactions"),
    amount: v.number(),
    paymentMethod: v.string(),
    receiptData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allReceipts = await ctx.db.query("receiptHistory").collect();
    const receiptNumber = generateInvoiceNumber("RCPT", allReceipts.length + 1);

    const id = await ctx.db.insert("receiptHistory", {
      receiptNumber,
      studentId: args.studentId,
      invoiceId: args.invoiceId,
      transactionId: args.transactionId,
      receiptDate: Date.now(),
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      receiptData: args.receiptData,
      receiptType: "payment",
      generatedBy: userId,
      createdBy: userId,
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "ReceiptGenerated",
      title: "Receipt Generated",
      description: `Receipt ${receiptNumber}: ${args.amount} via ${args.paymentMethod}`,
      metadata: JSON.stringify({ receiptId: id, receiptNumber, amount: args.amount }),
      performedBy: userId,
    });

    return { id, receiptNumber };
  },
});

export const listReceipts = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    invoiceId: v.optional(v.id("feeInvoices")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("receiptHistory");
    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.invoiceId) {
      query = query.filter((q: any) => q.eq(q.field("invoiceId"), args.invoiceId));
    }
    return query.order("desc").collect();
  },
});

// ─── CREDIT NOTES ──────────────────────────────────────────

export const generateCreditNote = mutation({
  args: {
    studentId: v.id("studentMaster"),
    invoiceId: v.id("feeInvoices"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const allReceipts = await ctx.db.query("receiptHistory").collect();
    const creditNoteNumber = generateInvoiceNumber("CN", allReceipts.length + 1);

    // Create credit note as a receipt with negative amount
    const id = await ctx.db.insert("receiptHistory", {
      receiptNumber: creditNoteNumber,
      studentId: args.studentId,
      invoiceId: args.invoiceId,
      transactionId: "" as any, // Will be patched
      receiptDate: Date.now(),
      amount: -args.amount,
      paymentMethod: "credit_note",
      receiptData: JSON.stringify({ creditNote: true, reason: args.reason, originalInvoiceId: args.invoiceId }),
      receiptType: "adjustment",
      generatedBy: userId,
      createdBy: userId,
    });

    // Update invoice balance
    const newPaidAmount = invoice.paidAmount - args.amount;
    await ctx.db.patch(args.invoiceId, {
      paidAmount: Math.max(0, newPaidAmount),
      balanceDue: invoice.totalAmount - Math.max(0, newPaidAmount),
      status: newPaidAmount <= 0 ? "pending" : "partial",
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "CreditNoteGenerated",
      title: "Credit Note Generated",
      description: `Credit note ${creditNoteNumber}: ${args.amount} for ${args.reason}`,
      metadata: JSON.stringify({ creditNoteId: id, creditNoteNumber, amount: args.amount, invoiceId: args.invoiceId }),
      performedBy: userId,
    });

    return { id, creditNoteNumber };
  },
});

// ─── REFUNDS ───────────────────────────────────────────────

export const issueRefund = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    invoiceId: v.optional(v.id("feeInvoices")),
    transactionId: v.optional(v.id("paymentTransactions")),
    refundAmount: v.number(),
    refundReason: v.string(),
    refundMethod: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("feeRefunds", {
      studentId: args.studentId,
      feeAccountId: args.feeAccountId,
      invoiceId: args.invoiceId,
      transactionId: args.transactionId,
      refundAmount: args.refundAmount,
      refundReason: args.refundReason,
      refundMethod: args.refundMethod,
      refundDate: Date.now(),
      status: "pending",
      processedBy: userId,
      notes: args.notes,
    });

    // Update the invoice status
    if (args.invoiceId) {
      const invoice = await ctx.db.get(args.invoiceId);
      if (invoice) {
        await ctx.db.patch(args.invoiceId, {
          paidAmount: Math.max(0, invoice.paidAmount - args.refundAmount),
          balanceDue: invoice.totalAmount - Math.max(0, invoice.paidAmount - args.refundAmount),
          status: "refunded",
        });
      }
    }

    // Update fee account balance
    const account = await ctx.db.get(args.feeAccountId);
    if (account) {
      await ctx.db.patch(args.feeAccountId, {
        totalPaid: Math.max(0, account.totalPaid - args.refundAmount),
        outstandingBalance: account.outstandingBalance + args.refundAmount,
      });
    }

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "RefundProcessed",
      title: "Refund Processed",
      description: `Refund of ${args.refundAmount} for ${args.refundReason}`,
      metadata: JSON.stringify({ refundId: id, amount: args.refundAmount, reason: args.refundReason }),
      performedBy: userId,
    });

    return id;
  },
});

export const approveRefund = mutation({
  args: {
    refundId: v.id("feeRefunds"),
    approve: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const refund = await ctx.db.get(args.refundId);
    if (!refund) throw new Error("Refund not found");

    await ctx.db.patch(args.refundId, {
      status: args.approve ? "processing" : "failed",
      approvedBy: userId,
      approvedAt: Date.now(),
      notes: args.notes || refund.notes,
    });

    if (args.approve) {
      // Mark as completed after approval
      await ctx.db.patch(args.refundId, { status: "completed" });
    }

    return args.refundId;
  },
});

export const listRefunds = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    status: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeRefunds");
    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    return query.order("desc").collect();
  },
});
