/**
 * Document SDK — Enterprise Document Service
 *
 * Every business module MUST use this SDK to manage documents.
 * No module may directly query the "documents" table.
 *
 * Usage:
 *   import { documentSdk } from "@/platform/sdk/documentSdk";
 *   const docId = await documentSdk.upload(ctx, { name: "resume.pdf", ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export interface DocumentMetadata {
  name: string;
  type: string;
  size?: number;
  url?: string;
  entityType?: string;
  entityId?: string;
  folder?: string;
  tags?: string[];
  version?: number;
}

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Upload/create a document record.
 */
export const upload = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
    url: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    folder: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("documents", {
      name: args.name,
      type: args.type,
      size: args.size,
      url: args.url,
      entityType: args.entityType,
      entityId: args.entityId,
      folder: args.folder,
      tags: args.tags,
      version: 1,
      companyId: args.companyId,
      branchId: args.branchId,
      uploadedBy: args.uploadedBy,
      status: "active",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get a document by ID.
 */
export const get = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.documentId);
  },
});

/**
 * List documents for an entity.
 */
export const listForEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("entityType_entityId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    return docs.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 50);
  },
});

/**
 * List documents in a folder.
 */
export const listByFolder = query({
  args: {
    folder: v.string(),
    companyId: v.optional(v.id("companies")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let docs = await ctx.db
      .query("documents")
      .withIndex("folder", (q) => q.eq("folder", args.folder))
      .collect();

    if (args.companyId) docs = docs.filter((d) => d.companyId === args.companyId);
    return docs.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 50);
  },
});

/**
 * Search documents by name or tags.
 */
export const search = query({
  args: {
    searchText: v.string(),
    companyId: v.optional(v.id("companies")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const text = args.searchText.toLowerCase();
    const all = await ctx.db.query("documents").collect();

    return all
      .filter((d) => {
        if (args.companyId && d.companyId !== args.companyId) return false;
        return (
          d.name.toLowerCase().includes(text) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(text)))
        );
      })
      .slice(0, args.limit || 20);
  },
});

/**
 * Update document metadata.
 */
export const update = mutation({
  args: {
    documentId: v.id("documents"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    size: v.optional(v.number()),
    url: v.optional(v.string()),
    folder: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { documentId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now(), version: undefined };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    delete updates.version;
    await ctx.db.patch(documentId, updates);
    return { success: true };
  },
});

/**
 * Delete a document.
 */
export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
    return { success: true };
  },
});

/**
 * Get documents by IDs (batch).
 */
export const getBatch = query({
  args: { documentIds: v.array(v.id("documents")) },
  handler: async (ctx, args) => {
    const result: Record<string, unknown> = {};
    for (const id of args.documentIds) {
      const doc = await ctx.db.get(id);
      if (doc) result[id] = doc;
    }
    return result;
  },
});

// ─── Certificate SDK — wires certificateEngine ───────────────────────────

/**
 * List certificates with optional filters.
 */
export const listCertificates = query({
  args: {
    studentId: v.optional(v.id("personMaster")),
    examSessionId: v.optional(v.id("examSessions")),
    certificateType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listCertificates } = await import("../convex/certificateEngine");
    return listCertificates.handler(ctx, args);
  },
});

/**
 * Get a certificate by ID (enriched with student name).
 */
export const getCertificate = query({
  args: { id: v.id("examCertificates") },
  handler: async (ctx, args) => {
    const { getCertificate } = await import("../convex/certificateEngine");
    return getCertificate.handler(ctx, args);
  },
});

/**
 * Verify a certificate via its digital verification ID.
 */
export const verifyCertificate = query({
  args: { verificationId: v.string() },
  handler: async (ctx, args) => {
    const { verifyCertificate } = await import("../convex/certificateEngine");
    return verifyCertificate.handler(ctx, args);
  },
});

/**
 * Get all certificates for a student (with session names).
 */
export const getStudentCertificates = query({
  args: { studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const { getStudentCertificates } = await import("../convex/certificateEngine");
    return getStudentCertificates.handler(ctx, args);
  },
});

/**
 * Issue a single certificate with digital verification ID.
 */
export const issueCertificate = mutation({
  args: {
    studentId: v.id("personMaster"),
    examSessionId: v.id("examSessions"),
    certificateType: v.union(
      v.literal("marksheet"), v.literal("passing_certificate"),
      v.literal("merit_certificate"), v.literal("rank_certificate"),
      v.literal("participation"), v.literal("custom"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    qrCodeUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { issueCertificate } = await import("../convex/certificateEngine");
    return issueCertificate.handler(ctx, args);
  },
});

/**
 * Bulk-issue certificates to an exam session (optionally only passed/ranked).
 */
export const bulkIssueCertificates = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    certificateType: v.union(
      v.literal("marksheet"), v.literal("passing_certificate"),
      v.literal("merit_certificate"), v.literal("rank_certificate"),
      v.literal("participation"), v.literal("custom"),
    ),
    title: v.string(),
    onlyPassedStudents: v.optional(v.boolean()),
    limitToRank: v.optional(v.number()),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { bulkIssueCertificates } = await import("../convex/certificateEngine");
    return bulkIssueCertificates.handler(ctx, args);
  },
});

/**
 * Record a certificate download (increments download count).
 */
export const recordCertificateDownload = mutation({
  args: { id: v.id("examCertificates") },
  handler: async (ctx, args) => {
    const { recordCertificateDownload } = await import("../convex/certificateEngine");
    return recordCertificateDownload.handler(ctx, args);
  },
});
