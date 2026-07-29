/**
 * Receipt Template Engine — Dynamic Document Generation with Branding & QR
 *
 * Supports fee receipts, GST invoices, credit/debit notes, refund receipts,
 * payment acknowledgements, and certificates with company branding.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Receipt Templates ──────────────────────────────────────

export const createReceiptTemplate = mutation({
  args: {
    name: v.string(),
    documentType: v.union(
      v.literal("fee_receipt"), v.literal("gst_invoice"), v.literal("credit_note"),
      v.literal("debit_note"), v.literal("refund_receipt"), v.literal("payment_acknowledgement"),
      v.literal("admission_confirmation"), v.literal("pdc_acknowledgement"),
      v.literal("penalty_receipt"), v.literal("no_dues_certificate"), v.literal("bonafide_certificate"),
    ),
    templateHtml: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    isDefault: v.optional(v.boolean()),
    variables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (args.isDefault) {
      const existing = await ctx.db.query("receiptTemplates")
        .filter((q: any) => q.eq(q.field("documentType"), args.documentType))
        .collect();
      for (const t of existing) {
        await ctx.db.patch(t._id, { isDefault: false });
      }
    }
    return ctx.db.insert("receiptTemplates", {
      name: args.name,
      documentType: args.documentType,
      templateHtml: args.templateHtml,
      companyId: args.companyId,
      branchId: args.branchId,
      isDefault: args.isDefault || false,
      variables: args.variables || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listReceiptTemplates = query({
  args: {
    documentType: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("receiptTemplates");
    if (args.documentType) q = q.filter((q2: any) => q2.eq(q2.field("documentType"), args.documentType));
    if (args.companyId) q = q.filter((q2: any) => q2.eq(q2.field("companyId"), args.companyId));
    return q.collect();
  },
});

// ─── Generate Document ──────────────────────────────────────

export const generateDocument = query({
  args: {
    templateId: v.id("receiptTemplates"),
    receiptId: v.optional(v.id("receiptHistory")),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    let receipt: any = null;
    let student: any = null;

    if (args.receiptId) {
      receipt = await ctx.db.get(args.receiptId);
    }
    if (args.studentId) {
      student = await ctx.db.get(args.studentId);
    }

    const company: any = null; // Placeholder for company info
    const branch: any = null; // Placeholder for branch info

    const variables: Record<string, string> = {
      "{{receiptNumber}}": receipt?.receiptNumber || "N/A",
      "{{receiptDate}}": receipt?.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : "N/A",
      "{{amount}}": receipt?.amount ? `₹${receipt.amount.toLocaleString("en-IN")}` : "N/A",
      "{{studentName}}": student ? `${(student as any).firstName} ${(student as any).lastName}` : "N/A",
      "{{admissionNumber}}": student ? (student as any).admissionNumber || "N/A" : "N/A",
      "{{fatherName}}": student ? (student as any).fatherName || "N/A" : "N/A",
      "{{courseName}}": "N/A",
      "{{companyName}}": "EEOS",
      "{{companyAddress}}": "",
      "{{companyGst}}": "",
      "{{branchName}}": "",
      "{{qrData}}": receipt?._id || "",
      "{{today}}": new Date().toLocaleDateString(),
    };

    let rendered = template.templateHtml || "";
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value);
    }

    return {
      documentType: template.documentType,
      renderedHtml: rendered,
      variables,
      qrData: receipt?._id || student?._id || "",
    };
  },
});

// ─── Certificate Issuance ───────────────────────────────────

export const issueCertificate = mutation({
  args: {
    studentId: v.id("studentMaster"),
    certificateType: v.union(v.literal("bonafide"), v.literal("no_dues"), v.literal("transfer"), v.literal("completion"), v.literal("experience")),
    certificateData: v.optional(v.string()),
    issuedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const allCerts = await ctx.db.query("certificates").collect();
    const certNumber = `CERT-${new Date().getFullYear()}-${String(allCerts.length + 1).padStart(4, "0")}`;

    return ctx.db.insert("certificates", {
      certificateNumber: certNumber,
      studentId: args.studentId,
      certificateType: args.certificateType,
      certificateData: args.certificateData,
      issuedBy: args.issuedBy,
      issueDate: now,
      status: "issued",
      verificationUrl: `verify/${certNumber}`,
      createdAt: now,
    });
  },
});

export const listCertificates = query({
  args: { studentId: v.optional(v.id("studentMaster")), certificateType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("certificates");
    if (args.studentId) q = q.filter((q2: any) => q2.eq(q2.field("studentId"), args.studentId));
    if (args.certificateType) q = q.filter((q2: any) => q2.eq(q2.field("certificateType"), args.certificateType));
    return q.order("desc").collect();
  },
});

export const verifyCertificate = query({
  args: { verificationUrl: v.string() },
  handler: async (ctx, args) => {
    const cert = await ctx.db.query("certificates")
      .withIndex("verificationUrl", (q: any) => q.eq("verificationUrl", args.verificationUrl))
      .first();
    if (!cert) return { valid: false };
    const student = await ctx.db.get(cert.studentId);
    return { valid: true, cert, student };
  },
});
