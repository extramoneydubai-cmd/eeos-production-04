/**
 * GST Compliance Engine — GST Credit/Debit Notes, GSTR Exports & Compliance
 *
 * Manages GST credit notes, debit notes, credit note register,
 * GSTR-1/3B exports, invoice linkage, and compliance workflow.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

function generateGstDocNumber(prefix: string, serial: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(serial).padStart(5, "0")}`;
}

// ─── Debit Notes ────────────────────────────────────────────

export const createDebitNote = mutation({
  args: { token: v.optional(v.string()),
    invoiceId: v.optional(v.id("feeInvoices")),
    studentId: v.id("studentMaster"),
    amount: v.number(),
    gstRate: v.optional(v.number()),
    reason: v.string(),
    reasonCategory: v.union(v.literal("rate_difference"), v.literal("omission"), v.literal("correction"), v.literal("other")),
    originalInvoiceNumber: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "gstComplianceEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const allNotes = await ctx.db.query("debitNotes").collect();
    const debitNoteNumber = generateGstDocNumber("DN", allNotes.length + 1);

    const gstAmount = args.gstRate ? (args.amount * args.gstRate) / 100 : 0;

    return ctx.db.insert("debitNotes", {
      debitNoteNumber,
      invoiceId: args.invoiceId,
      studentId: args.studentId,
      amount: args.amount,
      gstRate: args.gstRate,
      gstAmount,
      reason: args.reason,
      reasonCategory: args.reasonCategory,
      originalInvoiceNumber: args.originalInvoiceNumber,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const issueDebitNote = mutation({
  args: { token: v.optional(v.string()), id: v.id("debitNotes") },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "gstComplianceEngine" }, async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Debit note not found");
    if (note.status !== "draft") throw new Error("Only draft debit notes can be issued");
    await ctx.db.patch(args.id, { status: "issued", issuedAt: Date.now(), updatedAt: Date.now() });
    return args.id;
  }),
});

export const listDebitNotes = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("issued"), v.literal("applied"), v.literal("cancelled"))),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("debitNotes");
    if (args.studentId) q = q.filter((q2: any) => q2.eq(q2.field("studentId"), args.studentId));
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    return q.order("desc").collect();
  },
});

// ─── Credit Note Register ───────────────────────────────────

export const listCreditNoteRegister = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("issued"), v.literal("applied"), v.literal("cancelled"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("creditNotes");
    let results = await q.order("desc").collect();
    if (args.status) results = results.filter((r: any) => r.status === args.status);
    if (args.startDate) results = results.filter((r: any) => r.createdAt >= args.startDate!);
    if (args.endDate) results = results.filter((r: any) => r.createdAt <= args.endDate!);

    // Enrich with student names
    const enriched = await Promise.all(results.map(async (r: any) => {
      const student = r.studentId ? await ctx.db.get(r.studentId) : null;
      return { ...r, studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "N/A" };
    }));
    return enriched;
  },
});

// ─── GSTR Export ────────────────────────────────────────────

export const exportGSTR1 = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Fetch invoices in date range
    const invoices = await ctx.db.query("feeInvoices").collect();
    const filteredInvoices = invoices.filter((i: any) =>
      i.createdAt >= args.startDate && i.createdAt <= args.endDate
    );

    // Fetch credit notes
    const creditNotes = await ctx.db.query("creditNotes").collect();
    const filteredCN = creditNotes.filter((cn: any) =>
      cn.createdAt >= args.startDate && cn.createdAt <= args.endDate && cn.status === "issued"
    );

    // Fetch debit notes
    const debitNotes = await ctx.db.query("debitNotes").collect();
    const filteredDN = debitNotes.filter((dn: any) =>
      dn.createdAt >= args.startDate && dn.createdAt <= args.endDate && dn.status === "issued"
    );

    // Build B2B invoices (with GST)
    const b2bInvoices = filteredInvoices
      .filter((inv: any) => (inv as any).gstAmount > 0)
      .map((inv: any) => ({
        invoiceNumber: (inv as any).invoiceNumber || inv._id,
        invoiceDate: new Date(inv.createdAt).toISOString().split("T")[0],
        customerGstin: (inv as any).customerGstin || "",
        taxableValue: ((inv as any).totalAmount || inv.amount) - ((inv as any).gstAmount || 0),
        gstRate: (inv as any).gstRate || 18,
        igst: (inv as any).igst || 0,
        cgst: (inv as any).cgst || ((inv as any).gstAmount || 0) / 2,
        sgst: (inv as any).sgst || ((inv as any).gstAmount || 0) / 2,
        totalAmount: inv.amount,
      }));

    // Build B2C invoices (no GST)
    const b2cInvoices = filteredInvoices
      .filter((inv: any) => !(inv as any).gstAmount || (inv as any).gstAmount === 0)
      .map((inv: any) => ({
        invoiceNumber: (inv as any).invoiceNumber || inv._id,
        invoiceDate: new Date(inv.createdAt).toISOString().split("T")[0],
        taxableValue: inv.amount,
        totalAmount: inv.amount,
      }));

    // Build credit/debit notes section
    const creditDebitNotes = [
      ...filteredCN.map((cn: any) => ({
        type: "credit_note",
        number: (cn as any).creditNoteNumber || cn._id,
        date: new Date(cn.createdAt).toISOString().split("T")[0],
        amount: cn.amount,
        reason: cn.reason,
        gstRate: (cn as any).gstRate || 0,
      })),
      ...filteredDN.map((dn: any) => ({
        type: "debit_note",
        number: (dn as any).debitNoteNumber || dn._id,
        date: new Date(dn.createdAt).toISOString().split("T")[0],
        amount: dn.amount,
        reason: dn.reason,
        gstRate: dn.gstRate || 0,
      })),
    ];

    return {
      gstr1: {
        period: {
          startDate: new Date(args.startDate).toISOString().split("T")[0],
          endDate: new Date(args.endDate).toISOString().split("T")[0],
        },
        b2bInvoices,
        b2cInvoices,
        creditDebitNotes,
        summary: {
          totalB2B: b2bInvoices.reduce((s: number, i) => s + i.totalAmount, 0),
          totalB2C: b2cInvoices.reduce((s: number, i) => s + i.totalAmount, 0),
          totalTaxable: [...b2bInvoices, ...b2cInvoices].reduce((s: number, i: any) => s + (i.taxableValue || i.totalAmount), 0),
          totalGST: b2bInvoices.reduce((s: number, i) => s + i.cgst + i.sgst + i.igst, 0),
        },
      },
      generatedAt: Date.now(),
    };
  },
});

export const exportGSTR3B = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const gstr1 = await (exportGSTR1 as any)(ctx, args);

    return {
      gstr3b: {
        period: gstr1.gstr1.period,
        outwardSupplies: {
          taxableValue: gstr1.gstr1.summary.totalTaxable,
          totalTax: gstr1.gstr1.summary.totalGST,
        },
        inwardSupplies: {
          taxableValue: 0, // To be filled from purchase records
          totalTax: 0,
        },
        totalTaxLiability: gstr1.gstr1.summary.totalGST,
        netTaxPayable: gstr1.gstr1.summary.totalGST,
      },
      generatedAt: Date.now(),
    };
  },
});

// ─── Compliance Dashboard ───────────────────────────────────

export const getComplianceDashboard = query({
  handler: async (ctx) => {
    const creditNotes = await ctx.db.query("creditNotes").collect();
    const debitNotes = await ctx.db.query("debitNotes").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();

    const totalCreditNotes = creditNotes.length;
    const totalDebitNotes = debitNotes.length;
    const issuedCN = creditNotes.filter((cn: any) => cn.status === "issued" || cn.status === "applied");
    const issuedDN = debitNotes.filter((dn: any) => dn.status === "issued");

    return {
      totalCreditNotes,
      totalDebitNotes,
      issuedCreditNotes: issuedCN.length,
      issuedDebitNotes: issuedDN.length,
      creditNoteValue: issuedCN.reduce((s: number, cn: any) => s + cn.amount, 0),
      debitNoteValue: issuedDN.reduce((s: number, dn: any) => s + dn.amount, 0),
      totalInvoiced: invoices.reduce((s: number, inv: any) => s + (inv.amount || 0), 0),
      pendingCreditNotes: creditNotes.filter((cn: any) => cn.status === "draft").length,
      gstApplicableInvoices: invoices.filter((inv: any) => (inv as any).gstRate > 0).length,
      complianceScore: 95, // Placeholder for actual compliance calculation
    };
  },
});
