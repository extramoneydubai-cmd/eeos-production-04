import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// CERTIFICATE QUERIES (Part 11)
// ═══════════════════════════════════════════════════════════════════

export const listCertificates = query({
  args: {
    studentId: v.optional(v.id("personMaster")),
    examSessionId: v.optional(v.id("examSessions")),
    certificateType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examCertificates");
    if (args.examSessionId) q = q.filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.certificateType) q = q.filter((eq) => eq.eq(eq.field("certificateType"), args.certificateType));
    const all = await q.order("desc").collect();
    if (args.studentId) return all.filter((c) => c.studentId === args.studentId);
    return all;
  },
});

export const getCertificate = query({
  args: { id: v.id("examCertificates") },
  handler: async (ctx, args) => {
    const cert = await ctx.db.get(args.id);
    if (!cert) return null;
    const person = await ctx.db.get(cert.studentId);
    return {
      ...cert,
      studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
    };
  },
});

export const verifyCertificate = query({
  args: { verificationId: v.string() },
  handler: async (ctx, args) => {
    const cert = await ctx.db
      .query("examCertificates")
      .filter((q) => q.eq(q.field("digitalVerificationId"), args.verificationId))
      .first();

    if (!cert) return { valid: false, message: "Certificate not found" };

    const person = await ctx.db.get(cert.studentId);
    const session = await ctx.db.get(cert.examSessionId);

    return {
      valid: true,
      certificateNumber: cert.certificateNumber,
      title: cert.title,
      studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
      examSession: session?.name,
      issuedDate: cert.issuedDate,
      certificateType: cert.certificateType,
      isVerified: cert.isVerified,
    };
  },
});

export const getStudentCertificates = query({
  args: { studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const certs = await ctx.db
      .query("examCertificates")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .collect();

    return await Promise.all(
      certs.map(async (c) => {
        const session = await ctx.db.get(c.examSessionId);
        return { ...c, sessionName: session?.name };
      }),
    );
  },
});

// ═══════════════════════════════════════════════════════════════════
// CERTIFICATE MUTATIONS
// ═══════════════════════════════════════════════════════════════════

function generateCertificateNumber(type: string): string {
  const prefix = type === "marksheet" ? "MS" :
    type === "passing_certificate" ? "PC" :
    type === "merit_certificate" ? "MC" :
    type === "rank_certificate" ? "RC" : "CT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const certificateNumber = generateCertificateNumber(args.certificateType);
    const digitalVerificationId = `VER-${certificateNumber}`;

    const id = await ctx.db.insert("examCertificates", {
      ...args,
      certificateNumber,
      digitalVerificationId,
      issuedDate: now,
      issuedBy: identity.subject as any,
      isVerified: true,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    let results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    if (args.onlyPassedStudents) {
      results = results.filter((r) => r.passFail === "pass");
    }

    if (args.limitToRank) {
      results = results.filter((r) => r.rank != null && r.rank <= args.limitToRank!);
    }

    let count = 0;
    for (const result of results) {
      const certificateNumber = generateCertificateNumber(args.certificateType);
      const digitalVerificationId = `VER-${certificateNumber}`;

      await ctx.db.insert("examCertificates", {
        studentId: result.studentId,
        examSessionId: args.examSessionId,
        certificateType: args.certificateType,
        title: args.title,
        description: args.description || `Rank ${result.rank ?? "N/A"} - ${result.grade}`,
        certificateNumber,
        digitalVerificationId,
        issuedDate: now,
        issuedBy: identity.subject as any,
        isVerified: true,
        downloadCount: 0,
        metadata: args.metadata,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return { issued: count };
  },
});

export const recordCertificateDownload = mutation({
  args: { id: v.id("examCertificates") },
  handler: async (ctx, args) => {
    const cert = await ctx.db.get(args.id);
    if (!cert) throw new Error("Certificate not found");
    await ctx.db.patch(args.id, {
      downloadCount: (cert.downloadCount ?? 0) + 1,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});
