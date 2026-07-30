/**
 * Enterprise Document Template Engine (Phase 8)
 *
 * Template-based document generation.
 * Every workflow type has a configurable template that produces
 * branded, PDF-ready document output.
 *
 * Templates support:
 *   - Dynamic fields: {{studentName}}, {{amount}}, {{date}}, etc.
 *   - Company branding (logo, colors, address)
 *   - Conditional sections {{#if condition}}...{{/if}}
 *   - QR verification codes
 *   - Multiple output formats (JSON for PDF generation, HTML, plain text)
 *
 * Document Types that use templates:
 *   Admission Form, Fee Plan, Consent, Undertaking, ID Card, Receipt
 *   Cheque Receipt, Bounce Notice, Penalty Letter, Settlement Letter
 *   Refund Calculation Sheet, Approval Sheet, GST Credit Note, Refund Voucher
 *   Offer Letter, Appointment Letter, Salary Slip, Relieving Letter, Experience Letter
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Template Types ─────────────────────────────────────────

const DOCUMENT_TYPES = [
  "admission_form", "fee_plan", "consent_form", "undertaking", "id_card",
  "fee_receipt", "gst_invoice", "credit_note", "debit_note",
  "cheque_receipt", "bounce_notice", "penalty_letter", "settlement_letter",
  "refund_calculation", "refund_approval", "refund_voucher",
  "offer_letter", "appointment_letter", "salary_slip",
  "relieving_letter", "experience_letter", "bonafide_certificate",
  "no_dues_certificate", "transfer_certificate",
  "admission_agreement", "pdc_agreement", "privacy_policy",
] as const;

// ─── Template CRUD ──────────────────────────────────────────

export const createTemplate = mutation({
  args: {
    documentType: v.union(...DOCUMENT_TYPES.map((t) => v.literal(t))),
    name: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.object({
      key: v.string(),
      label: v.string(),
      type: v.union(v.literal("string"), v.literal("number"), v.literal("date"), v.literal("boolean")),
      defaultValue: v.optional(v.string()),
    }))),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("documentTemplates", {
      documentType: args.documentType,
      name: args.name,
      content: args.content,
      description: args.description,
      variables: args.variables || [],
      companyId: args.companyId,
      branchId: args.branchId,
      isDefault: args.isDefault ?? false,
      version: 1,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("documentTemplates"),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.object({
      key: v.string(),
      label: v.string(),
      type: v.union(v.literal("string"), v.literal("number"), v.literal("date"), v.literal("boolean")),
      defaultValue: v.optional(v.string()),
    }))),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { templateId, ...fields } = args;
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      version: ((template as any).version || 1) + 1,
    };
    if (fields.name) updates.name = fields.name;
    if (fields.content) updates.content = fields.content;
    if (fields.description) updates.description = fields.description;
    if (fields.variables) updates.variables = fields.variables;
    if (fields.isDefault !== undefined) updates.isDefault = fields.isDefault;

    await ctx.db.patch(templateId, updates);
    return templateId;
  },
});

export const listTemplates = query({
  args: {
    documentType: v.optional(v.union(...DOCUMENT_TYPES.map((t) => v.literal(t)))),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("documentTemplates").collect();

    if (args.documentType) {
      templates = templates.filter((t: any) => t.documentType === args.documentType);
    }
    if (args.companyId) {
      templates = templates.filter((t: any) => !t.companyId || (t as any).companyId === args.companyId);
    }
    if (args.branchId) {
      templates = templates.filter((t: any) => !t.branchId || (t as any).branchId === args.branchId);
    }

    return templates;
  },
});

export const getTemplate = query({
  args: { templateId: v.id("documentTemplates") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.templateId);
  },
});

export const getDefaultTemplate = query({
  args: {
    documentType: v.union(...DOCUMENT_TYPES.map((t) => v.literal(t))),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    // Prefer branch-specific default, then company default, then global default
    let templates = await ctx.db.query("documentTemplates")
      .filter((q: any) => q.and(
        q.eq(q.field("documentType"), args.documentType),
        q.eq(q.field("isDefault"), true),
      ))
      .collect();

    // Order by specificity: branch > company > global
    const branchTemplates = templates.filter((t: any) => (t as any).branchId === args.branchId);
    const companyTemplates = templates.filter((t: any) => (t as any).companyId === args.companyId && !(t as any).branchId);
    const globalTemplates = templates.filter((t: any) => !(t as any).companyId && !(t as any).branchId);

    return branchTemplates[0] || companyTemplates[0] || globalTemplates[0] || null;
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("documentTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
    return args.templateId;
  },
});

// ─── Template Rendering Engine ──────────────────────────────

export interface RenderContext {
  // Common variables
  companyName?: string;
  companyAddress?: string;
  companyLogo?: string;
  companyGST?: string;
  branchName?: string;
  branchAddress?: string;

  // Student/Parent variables
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  parentName?: string;
  parentPhone?: string;
  admissionNumber?: string;
  courseName?: string;
  batchName?: string;
  academicYear?: string;
  rollNumber?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  email?: string;

  // Fee variables
  totalFee?: number;
  paidAmount?: number;
  outstandingAmount?: number;
  refundAmount?: number;
  penaltyAmount?: number;
  nonRefundableAmount?: number;
  gstAmount?: number;
  installmentNumber?: number;
  totalInstallments?: number;
  paymentDate?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  chequeNumber?: string;
  chequeDate?: string;
  bankName?: string;
  bounceReason?: string;
  bounceCount?: number;
  settlementAmount?: number;

  // Employee variables
  employeeName?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  dateOfJoining?: string;
  dateOfLeaving?: string;
  salary?: number;
  leavesRemaining?: number;
  probationPeriod?: string;
  confirmationDate?: string;

  // Document metadata
  documentDate?: string;
  validUntil?: string;
  qrCodeUrl?: string;
  verificationUrl?: string;
  referenceNumber?: string;

  // Ad-hoc variables
  [key: string]: unknown;
}

/** Render a template with the given context */
export const renderTemplate = mutation({
  args: {
    templateId: v.optional(v.id("documentTemplates")),
    documentType: v.optional(v.union(...DOCUMENT_TYPES.map((t) => v.literal(t)))),
    context: v.any(), // RenderContext as JSON
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    // Get template
    let template;
    if (args.templateId) {
      template = await ctx.db.get(args.templateId);
    } else if (args.documentType) {
      template = await getDefaultTemplate.handler(ctx, {
        documentType: args.documentType,
        companyId: args.companyId,
        branchId: args.branchId,
      });
    }

    if (!template) {
      // Return empty with error rather than crashing
      return { rendered: "", error: "No template found" };
    }

    const content = (template as any).content || "";
    const context = args.context || {};
    const now = new Date();

    // Auto-fill common variables
    const enrichedContext: RenderContext = {
      ...context,
      documentDate: context.documentDate || now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      currentYear: now.getFullYear().toString(),
      qrCodeUrl: context.qrCodeUrl || `https://verify.eeos.app/doc/${(template as any)._id}`,
      verificationUrl: context.verificationUrl || `https://verify.eeos.app/doc/verify`,
    };

    // Render: replace {{variable}} with values
    let rendered = content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      const value = enrichedContext[key];
      if (value === undefined || value === null) return `{{${key}}}`;
      return String(value);
    });

    // Render: {{#if variable}}...{{/if}} blocks
    rendered = rendered.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match: string, key: string, blockContent: string) => {
      const value = enrichedContext[key];
      if (value !== undefined && value !== null && value !== false && value !== "") {
        return blockContent;
      }
      return "";
    });

    // Render: {{#unless variable}}...{{/unless}} blocks
    rendered = rendered.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match: string, key: string, blockContent: string) => {
      const value = enrichedContext[key];
      if (value === undefined || value === null || value === false || value === "") {
        return blockContent;
      }
      return "";
    });

    return {
      rendered,
      templateName: (template as any).name,
      documentType: (template as any).documentType,
      variables: Object.keys(enrichedContext).filter((k) => content.includes(`{{${k}}}`)),
    };
  },
});

/** Generate a fee receipt from template */
export const generateReceipt = mutation({
  args: {
    studentId: v.id("studentMaster"),
    receiptNumber: v.string(),
    amount: v.number(),
    paymentMode: v.string(),
    paymentDate: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const s = student as any;
    const context: RenderContext = {
      studentName: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      fatherName: s.fatherName,
      motherName: s.motherName,
      admissionNumber: s.admissionNumber,
      courseName: s.courseName,
      batchName: s.batchName,
      rollNumber: s.rollNumber,
      address: s.address,
      phone: s.phone,
      email: s.email,
      receiptNumber: args.receiptNumber,
      amount: args.amount,
      paymentDate: new Date(args.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      paymentMode: args.paymentMode,
    };

    const result = await renderTemplate.handler(ctx, {
      documentType: "fee_receipt",
      context,
      companyId: args.companyId,
      branchId: args.branchId,
    });

    return result;
  },
});

/** Generate a bounce notice from template */
export const generateBounceNotice = mutation({
  args: {
    studentId: v.id("studentMaster"),
    parentName: v.string(),
    chequeNumber: v.string(),
    chequeAmount: v.number(),
    chequeDate: v.number(),
    bounceReason: v.string(),
    bounceCount: v.number(),
    penaltyAmount: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    const context: RenderContext = {
      studentName: student ? `${(student as any).firstName || ""} ${(student as any).lastName || ""}`.trim() : "",
      parentName: args.parentName,
      chequeNumber: args.chequeNumber,
      chequeAmount: args.chequeAmount,
      chequeDate: new Date(args.chequeDate).toLocaleDateString("en-IN"),
      bounceReason: args.bounceReason,
      bounceCount: args.bounceCount,
      penaltyAmount: args.penaltyAmount,
    };

    return renderTemplate.handler(ctx, {
      documentType: "bounce_notice",
      context,
      companyId: args.companyId,
      branchId: args.branchId,
    });
  },
});

/** Generate an offer letter from template */
export const generateOfferLetter = mutation({
  args: {
    employeeName: v.string(),
    designation: v.string(),
    department: v.string(),
    dateOfJoining: v.number(),
    salary: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const context: RenderContext = {
      employeeName: args.employeeName,
      designation: args.designation,
      department: args.department,
      dateOfJoining: new Date(args.dateOfJoining).toLocaleDateString("en-IN"),
      salary: args.salary,
    };

    return renderTemplate.handler(ctx, {
      documentType: "offer_letter",
      context,
      companyId: args.companyId,
      branchId: args.branchId,
    });
  },
});

/** Generate a consent form from template */
export const generateConsentForm = mutation({
  args: {
    documentType: v.union(v.literal("consent_form"), v.literal("admission_agreement"), v.literal("pdc_agreement"), v.literal("privacy_policy")),
    studentName: v.string(),
    parentName: v.string(),
    context: v.optional(v.any()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const context: RenderContext = {
      studentName: args.studentName,
      parentName: args.parentName,
      ...(args.context || {}),
    };

    return renderTemplate.handler(ctx, {
      documentType: args.documentType,
      context,
      companyId: args.companyId,
      branchId: args.branchId,
    });
  },
});
