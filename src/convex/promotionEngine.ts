import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// PROMOTION QUERIES (Part 10)
// ═══════════════════════════════════════════════════════════════════

export const listPromotions = query({
  args: {
    studentId: v.optional(v.id("personMaster")),
    promotionType: v.optional(v.string()),
    examSessionId: v.optional(v.id("examSessions")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examPromotions");
    if (args.examSessionId) q = q.filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.promotionType) q = q.filter((eq) => eq.eq(eq.field("promotionType"), args.promotionType));
    const all = await q.order("desc").collect();
    if (args.studentId) return all.filter((p) => p.studentId === args.studentId);
    return all;
  },
});

export const getStudentPromotionHistory = query({
  args: { studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examPromotions")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .collect();
  },
});

export const getPromotion = query({
  args: { id: v.id("examPromotions") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

// ═══════════════════════════════════════════════════════════════════
// PROMOTION MUTATIONS
// ═══════════════════════════════════════════════════════════════════

export const createPromotion = mutation({
  args: {
    studentId: v.id("personMaster"),
    fromCourseId: v.optional(v.id("courses")),
    fromBatchId: v.optional(v.id("academicBatches")),
    fromSemesterId: v.optional(v.id("academicSemesters")),
    fromAcademicSessionId: v.optional(v.id("academicSessions")),
    toCourseId: v.optional(v.id("courses")),
    toBatchId: v.optional(v.id("academicBatches")),
    toSemesterId: v.optional(v.id("academicSemesters")),
    toAcademicSessionId: v.optional(v.id("academicSessions")),
    promotionType: v.union(
      v.literal("promote"), v.literal("detain"),
      v.literal("conditional"), v.literal("supplementary_required"),
      v.literal("improvement_required"), v.literal("repeat_semester"),
      v.literal("repeat_course"), v.literal("transfer"),
      v.literal("withdraw"),
    ),
    examSessionId: v.optional(v.id("examSessions")),
    percentage: v.optional(v.number()),
    grade: v.optional(v.string()),
    decision: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examPromotions", {
      ...args,
      approvedBy: identity.subject as any,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update student record if promoted
    if (args.promotionType === "promote" && args.toBatchId) {
      try {
        const studentRecord = await ctx.db
          .query("studentMaster")
          .filter((q) => q.eq(q.field("personId"), args.studentId))
          .first();
        if (studentRecord) {
          const updates: Record<string, any> = { updatedAt: now };
          if (args.toBatchId) updates.currentBatchId = args.toBatchId;
          if (args.toSemesterId) updates.currentSemesterId = args.toSemesterId;
          await ctx.db.patch(studentRecord._id, updates);
        }
      } catch { /* student record may not exist in all deployments */ }
    }

    return id;
  },
});

export const bulkPromote = mutation({
  args: {
    studentIds: v.array(v.id("personMaster")),
    fromCourseId: v.optional(v.id("courses")),
    fromBatchId: v.optional(v.id("academicBatches")),
    fromSemesterId: v.optional(v.id("academicSemesters")),
    toCourseId: v.optional(v.id("courses")),
    toBatchId: v.id("academicBatches"),
    toSemesterId: v.optional(v.id("academicSemesters")),
    examSessionId: v.optional(v.id("examSessions")),
    decision: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    let count = 0;

    for (const studentId of args.studentIds) {
      await ctx.db.insert("examPromotions", {
        studentId,
        fromCourseId: args.fromCourseId,
        fromBatchId: args.fromBatchId,
        fromSemesterId: args.fromSemesterId,
        toCourseId: args.toCourseId,
        toBatchId: args.toBatchId,
        toSemesterId: args.toSemesterId,
        examSessionId: args.examSessionId,
        promotionType: "promote",
        decision: args.decision,
        approvedBy: identity.subject as any,
        approvedAt: now,
        remarks: args.remarks,
        createdAt: now,
        updatedAt: now,
      });

      // Update student batch
      try {
        const studentRecord = await ctx.db
          .query("studentMaster")
          .filter((q) => q.eq(q.field("personId"), studentId))
          .first();
        if (studentRecord) {
          const updates: Record<string, any> = { updatedAt: now };
          updates.currentBatchId = args.toBatchId;
          if (args.toSemesterId) updates.currentSemesterId = args.toSemesterId;
          await ctx.db.patch(studentRecord._id, updates);
        }
      } catch { /* ignore */ }

      count++;
    }

    return { promoted: count };
  },
});

export const bulkDetain = mutation({
  args: {
    studentIds: v.array(v.id("personMaster")),
    fromCourseId: v.optional(v.id("courses")),
    fromBatchId: v.optional(v.id("academicBatches")),
    fromSemesterId: v.optional(v.id("academicSemesters")),
    examSessionId: v.optional(v.id("examSessions")),
    decision: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    let count = 0;

    for (const studentId of args.studentIds) {
      await ctx.db.insert("examPromotions", {
        studentId,
        fromCourseId: args.fromCourseId,
        fromBatchId: args.fromBatchId,
        fromSemesterId: args.fromSemesterId,
        examSessionId: args.examSessionId,
        promotionType: "detain",
        decision: args.decision,
        approvedBy: identity.subject as any,
        approvedAt: now,
        remarks: args.remarks,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return { detained: count };
  },
});

export const getPromotionEligibleStudents = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const enriched = await Promise.all(
      results.map(async (r) => {
        const person = await ctx.db.get(r.studentId);
        return {
          ...r,
          studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
          eligibleForPromotion: r.passFail === "pass",
          eligibleForSupplementary: r.passFail === "supplementary",
        };
      }),
    );

    return enriched;
  },
});
