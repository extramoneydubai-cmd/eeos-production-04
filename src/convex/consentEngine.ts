/**
 * Consent & Legal Documents Engine — Dynamic Consent Forms, Signatures & Audit
 *
 * Supports admission agreements, refund policy, cheque terms, PDC agreement,
 * penalty agreement, privacy policy, and medical declarations with
 * digital signature capture and full audit trail.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Consent Templates ──────────────────────────────────────

export const createConsentTemplate = mutation({
  args: {
    name: v.string(),
    documentType: v.union(
      v.literal("admission_agreement"), v.literal("refund_policy"), v.literal("cheque_terms"),
      v.literal("pdc_agreement"), v.literal("penalty_agreement"), v.literal("privacy_policy"),
      v.literal("consent_letter"), v.literal("medical_declaration"),
    ),
    contentHtml: v.string(),
    isMandatory: v.optional(v.boolean()),
    version: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("consentTemplates", {
      name: args.name,
      documentType: args.documentType,
      contentHtml: args.contentHtml,
      isMandatory: args.isMandatory || false,
      version: args.version || "1.0",
      isActive: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listActiveConsentTemplates = query({
  args: { documentType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("consentTemplates").filter((q2: any) => q2.eq(q2.field("isActive"), true));
    if (args.documentType) q = q.filter((q2: any) => q2.eq(q2.field("documentType"), args.documentType));
    return q.collect();
  },
});

// ─── Consent Records ────────────────────────────────────────

export const recordConsent = mutation({
  args: {
    studentId: v.id("studentMaster"),
    consentTemplateId: v.id("consentTemplates"),
    parentSignature: v.optional(v.string()),
    studentSignature: v.optional(v.string()),
    consentGiven: v.boolean(),
    deviceInfo: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.consentTemplateId);
    if (!template) throw new Error("Consent template not found");

    const consentId = await ctx.db.insert("consentRecords", {
      studentId: args.studentId,
      consentTemplateId: args.consentTemplateId,
      documentType: (template as any).documentType,
      consentGiven: args.consentGiven,
      parentSignature: args.parentSignature,
      studentSignature: args.studentSignature,
      deviceInfo: args.deviceInfo,
      ipAddress: args.ipAddress,
      consentDate: Date.now(),
      createdAt: Date.now(),
    });

    // Generate PDF record
    await ctx.db.insert("generatedDocuments", {
      studentId: args.studentId,
      documentType: (template as any).documentType,
      consentId,
      status: "generated",
      createdAt: Date.now(),
    });

    return consentId;
  },
});

export const getStudentConsents = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const consents = await ctx.db.query("consentRecords")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const enriched = await Promise.all(consents.map(async (c: any) => {
      const template = await ctx.db.get(c.consentTemplateId);
      return {
        ...c,
        templateName: template ? (template as any).name : "Unknown",
        documentTypeLabel: template ? (template as any).documentType : "Unknown",
      };
    }));

    return enriched;
  },
});

export const hasConsented = query({
  args: { studentId: v.id("studentMaster"), documentType: v.string() },
  handler: async (ctx, args) => {
    const consent = await ctx.db.query("consentRecords")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("documentType"), args.documentType))
      .filter((q: any) => q.eq(q.field("consentGiven"), true))
      .first();
    return { consented: !!consent, consentDate: consent?.consentDate || null };
  },
});

// ─── Consent Dashboard ──────────────────────────────────────

export const getConsentDashboard = query({
  args: { documentType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const templates = await ctx.db.query("consentTemplates")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const filtered = args.documentType
      ? templates.filter((t: any) => t.documentType === args.documentType)
      : templates;

    const result = await Promise.all(filtered.map(async (t: any) => {
      const records = await ctx.db.query("consentRecords")
        .withIndex("consentTemplateId", (q: any) => q.eq("consentTemplateId", t._id))
        .collect();
      return {
        templateId: t._id,
        name: t.name,
        documentType: t.documentType,
        totalRecords: records.length,
        consented: records.filter((r: any) => r.consentGiven).length,
        declined: records.filter((r: any) => !r.consentGiven).length,
        version: t.version,
      };
    }));

    return result;
  },
});

// ─── Generated Documents ────────────────────────────────────

export const listGeneratedDocuments = query({
  args: { studentId: v.optional(v.id("studentMaster")), documentType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("generatedDocuments");
    if (args.studentId) q = q.filter((q2: any) => q2.eq(q2.field("studentId"), args.studentId));
    if (args.documentType) q = q.filter((q2: any) => q2.eq(q2.field("documentType"), args.documentType));
    return q.order("desc").collect();
  },
});
