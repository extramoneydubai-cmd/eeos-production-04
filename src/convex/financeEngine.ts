import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateEntryNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ─── JOURNAL ENTRIES ─────────────────────────────────────

export const createJournalEntry = mutation({
  args: {
    entryDate: v.number(),
    description: v.string(),
    debitAccount: v.string(),
    creditAccount: v.string(),
    amount: v.number(),
    referenceType: v.optional(v.union(v.literal("invoice"), v.literal("payment"), v.literal("expense"), v.literal("receipt"), v.literal("adjustment"), v.literal("refund"))),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allEntries = await ctx.db.query("journalEntries").collect();
    const entryNumber = generateEntryNumber("JRN", allEntries.length + 1);

    const id = await ctx.db.insert("journalEntries", {
      entryNumber,
      ...args,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { id, entryNumber };
  },
});

export const postJournalEntry = mutation({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Journal entry not found");
    if (entry.status !== "draft") throw new Error("Only draft entries can be posted");

    await ctx.db.patch(args.id, {
      status: "posted",
      approvedBy: userId,
      postedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const reverseJournalEntry = mutation({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Journal entry not found");
    if (entry.status !== "posted") throw new Error("Only posted entries can be reversed");

    await ctx.db.patch(args.id, {
      status: "reversed",
      updatedAt: Date.now(),
    });

    // Create reversal entry
    const reversalEntryNumber = generateEntryNumber("JRN-R", args.id.length + 1);
    await ctx.db.insert("journalEntries", {
      entryNumber: reversalEntryNumber,
      entryDate: Date.now(),
      description: `Reversal of ${entry.entryNumber}: ${entry.description}`,
      debitAccount: entry.creditAccount,
      creditAccount: entry.debitAccount,
      amount: entry.amount,
      referenceType: "adjustment",
      referenceId: entry.entryNumber,
      status: "posted",
      approvedBy: userId,
      postedAt: Date.now(),
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const listJournalEntries = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("posted"), v.literal("reversed"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("journalEntries");

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    let results = await query.order("desc").collect();

    if (args.startDate) {
      results = results.filter((r: any) => r.entryDate >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((r: any) => r.entryDate <= args.endDate!);
    }

    return results;
  },
});

export const getJournalEntry = query({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ─── CASH BOOK ───────────────────────────────────────────

export const createCashBookEntry = mutation({
  args: {
    entryType: v.union(v.literal("debit"), v.literal("credit")),
    amount: v.number(),
    description: v.string(),
    category: v.union(v.literal("fee_collection"), v.literal("expense"), v.literal("refund"), v.literal("transfer"), v.literal("miscellaneous")),
    paymentMode: v.string(),
    branchId: v.optional(v.id("branches")),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Calculate running balance
    const allEntries = await ctx.db.query("cashBookEntries").order("desc").collect();
    const lastBalance = allEntries.length > 0 ? allEntries[0].balanceAfter : 0;
    const balanceAfter = args.entryType === "debit"
      ? lastBalance + args.amount
      : lastBalance - args.amount;

    const entryNumber = generateEntryNumber("CB", allEntries.length + 1);

    const id = await ctx.db.insert("cashBookEntries", {
      entryNumber,
      entryDate: Date.now(),
      ...args,
      balanceAfter: Math.max(0, balanceAfter),
      createdBy: userId,
      createdAt: Date.now(),
    });

    return { id, entryNumber, balanceAfter };
  },
});

export const listCashBookEntries = query({
  args: {
    entryType: v.optional(v.union(v.literal("debit"), v.literal("credit"))),
    category: v.optional(v.union(v.literal("fee_collection"), v.literal("expense"), v.literal("refund"), v.literal("transfer"), v.literal("miscellaneous"))),
    branchId: v.optional(v.id("branches")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("cashBookEntries");

    if (args.branchId) {
      query = query.filter((q: any) => q.eq(q.field("branchId"), args.branchId));
    }
    if (args.category) {
      query = query.filter((q: any) => q.eq(q.field("category"), args.category));
    }
    if (args.entryType) {
      query = query.filter((q: any) => q.eq(q.field("entryType"), args.entryType));
    }

    let results = await query.order("desc").collect();

    if (args.startDate) {
      results = results.filter((r: any) => r.entryDate >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((r: any) => r.entryDate <= args.endDate!);
    }

    return results;
  },
});

export const getCashBookBalance = query({
  args: {
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("cashBookEntries").order("desc");
    const entries = await query.collect();

    let filtered = entries;
    if (args.branchId) {
      filtered = filtered.filter((e: any) => e.branchId === args.branchId);
    }

    const totalDebits = filtered
      .filter((e: any) => e.entryType === "debit")
      .reduce((s: number, e: any) => s + e.amount, 0);

    const totalCredits = filtered
      .filter((e: any) => e.entryType === "credit")
      .reduce((s: number, e: any) => s + e.amount, 0);

    return {
      currentBalance: totalDebits - totalCredits,
      totalDebits,
      totalCredits,
      totalEntries: filtered.length,
      lastEntryDate: filtered.length > 0 ? filtered[0].entryDate : null,
    };
  },
});

// ─── VENDOR BILLS ────────────────────────────────────────

export const createVendorBill = mutation({
  args: {
    vendorName: v.string(),
    vendorContact: v.optional(v.string()),
    billNumber: v.string(),
    billDate: v.number(),
    dueDate: v.number(),
    amount: v.number(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("financeExpenseCategories")),
    attachmentUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("vendorBills", {
      ...args,
      paidAmount: 0,
      balanceDue: args.amount,
      status: "pending",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const payVendorBill = mutation({
  args: {
    id: v.id("vendorBills"),
    amount: v.number(),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const bill = await ctx.db.get(args.id);
    if (!bill) throw new Error("Vendor bill not found");

    const newPaidAmount = (bill.paidAmount || 0) + args.amount;
    const newBalance = bill.amount - newPaidAmount;
    const newStatus = newBalance <= 0 ? "paid" : "partial";

    await ctx.db.patch(args.id, {
      paidAmount: newPaidAmount,
      balanceDue: Math.max(0, newBalance),
      status: newStatus,
      paidAt: newBalance <= 0 ? Date.now() : undefined,
      paymentReference: args.paymentReference || bill.paymentReference,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const listVendorBills = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("partial"), v.literal("paid"), v.literal("cancelled"), v.literal("overdue"))),
    vendorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("vendorBills");

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.vendorName) {
      query = query.filter((q: any) => q.eq(q.field("vendorName"), args.vendorName));
    }

    return query.order("desc").collect();
  },
});

export const getVendorBill = query({
  args: { id: v.id("vendorBills") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ─── CREDIT NOTES ────────────────────────────────────────

export const createCreditNote = mutation({
  args: {
    invoiceId: v.optional(v.id("feeInvoices")),
    studentId: v.id("studentMaster"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allNotes = await ctx.db.query("creditNotes").collect();
    const creditNoteNumber = generateEntryNumber("CN", allNotes.length + 1);

    const id = await ctx.db.insert("creditNotes", {
      creditNoteNumber,
      ...args,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { id, creditNoteNumber };
  },
});

export const issueCreditNote = mutation({
  args: { id: v.id("creditNotes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Credit note not found");
    if (note.status !== "draft") throw new Error("Only draft credit notes can be issued");

    await ctx.db.patch(args.id, {
      status: "issued",
      approvedBy: userId,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const applyCreditNoteToInvoice = mutation({
  args: { id: v.id("creditNotes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Credit note not found");
    if (note.status !== "issued") throw new Error("Only issued credit notes can be applied");
    if (!note.invoiceId) throw new Error("Credit note is not linked to an invoice");

    const invoice = await ctx.db.get(note.invoiceId);
    if (invoice) {
      const newBalance = (invoice.balanceDue || 0) - note.amount;
      await ctx.db.patch(note.invoiceId, {
        balanceDue: Math.max(0, newBalance),
        paidAmount: (invoice.paidAmount || 0) + note.amount,
        status: newBalance <= 0 ? "paid" : "partial",
      });
    }

    await ctx.db.patch(args.id, {
      status: "applied",
      appliedToInvoice: true,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const listCreditNotes = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("issued"), v.literal("applied"), v.literal("cancelled"))),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("creditNotes");

    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    return query.order("desc").collect();
  },
});
