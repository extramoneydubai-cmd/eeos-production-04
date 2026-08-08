import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// REVALUATION QUERIES
// ═══════════════════════════════════════════════════════════════════

export const listRevaluations = query({
  args: {
    examSessionId: v.optional(v.id("examSessions")),
    studentId: v.optional(v.id("personMaster")),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examRevaluation");
    if (args.examSessionId) q = q.filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.status) q = q.filter((eq) => eq.eq(eq.field("status"), args.status));
    const all = await q.collect();
    let filtered = all;
    if (args.studentId) filtered = filtered.filter((r) => r.studentId === args.studentId);
    if (args.type) filtered = filtered.filter((r) => r.revaluationType === args.type);
    return filtered;
  },
});

export const getRevaluation = query({
  args: { id: v.id("examRevaluation") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getStudentRevaluations = query({
  args: { studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examRevaluation")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .collect();
  },
});

export const getRevaluationStats = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("examRevaluation")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const pending = all.filter((r) => r.status === "requested" || r.status === "under_review").length;
    const approved = all.filter((r) => r.status === "approved").length;
    const rejected = all.filter((r) => r.status === "rejected").length;
    const completed = all.filter((r) => r.status === "completed").length;

    const byType: Record<string, number> = {};
    for (const r of all) {
      byType[r.revaluationType] = (byType[r.revaluationType] ?? 0) + 1;
    }

    const marksBefore = all.filter((r) => r.revisedMarks != null && r.originalMarks != null);
    const avgChange = marksBefore.length > 0
      ? marksBefore.reduce((sum, r) => sum + ((r.revisedMarks ?? 0) - r.originalMarks), 0) / marksBefore.length
      : 0;

    return { total: all.length, pending, approved, rejected, completed, byType, avgChange: Math.round(avgChange * 100) / 100 };
  },
});

// ═══════════════════════════════════════════════════════════════════
// REVALUATION MUTATIONS
// ═══════════════════════════════════════════════════════════════════

export const requestRevaluation = mutation({
  args: { token: v.optional(v.string()),
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
    examSubjectId: v.id("examSubjects"),
    revaluationType: v.union(
      v.literal("rechecking"), v.literal("revaluation"),
      v.literal("grace_marks"), v.literal("improvement"),
      v.literal("supplementary"), v.literal("backlog"),
      v.literal("carry_forward"),
    ),
    requestedMarks: v.optional(v.number()),
    fee: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "revaluationEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    // Get original marks
    const marksEntry = await ctx.db
      .query("examMarks")
      .filter((q: any) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
        q.eq(q.field("examSubjectId"), args.examSubjectId),
      ))
      .first();

    const originalMarks = marksEntry
      ? (marksEntry.marksObtained ?? 0) + (marksEntry.graceMarks ?? 0)
      : 0;

    const id = await ctx.db.insert("examRevaluation", {
      examSessionId: args.examSessionId,
      studentId: args.studentId,
      examSubjectId: args.examSubjectId,
      revaluationType: args.revaluationType,
      originalMarks,
      requestedMarks: args.requestedMarks,
      fee: args.fee,
      status: "requested",
      remarks: args.remarks,
      createdAt: now,
      updatedAt: now,
    });

    // Timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "revaluation_requested",
      description: `${args.revaluationType} requested for student`,
      userId: ctx.__performerUserId as any,
      createdAt: now,
    });

    return id;
  }),
});

export const reviewRevaluation = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("examRevaluation"),
    status: v.union(v.literal("under_review"), v.literal("approved"), v.literal("rejected"), v.literal("completed")),
    revisedMarks: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "revaluationEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      reviewedBy: ctx.__performerUserId as any,
      reviewedAt: now,
      updatedAt: now,
    });

    const reval = await ctx.db.get(id);
    if (reval) {
      await ctx.db.insert("examTimeline", {
        examSessionId: reval.examSessionId,
        eventType: `revaluation_${args.status}`,
        description: `Revaluation ${args.status}`,
        userId: ctx.__performerUserId as any,
        createdAt: now,
      });

      // If approved/completed, update the marks record
      if ((args.status === "approved" || args.status === "completed") && args.revisedMarks != null) {
        const marksEntry = await ctx.db
          .query("examMarks")
          .filter((q: any) => q.and(
            q.eq(q.field("examSessionId"), reval.examSessionId),
            q.eq(q.field("studentId"), reval.studentId),
            q.eq(q.field("examSubjectId"), reval.examSubjectId),
          ))
          .first();

        if (marksEntry) {
          await ctx.db.patch(marksEntry._id, {
            moderatedMarks: args.revisedMarks,
            moderatedBy: ctx.__performerUserId as any,
            moderatedAt: now,
            moderationNotes: "Revised via revaluation",
            updatedAt: now,
          });
        }
      }
    }

    return id;
  }),
});

export const bulkApproveRevaluation = mutation({
  args: { token: v.optional(v.string()),
    ids: v.array(v.id("examRevaluation")),
    revisedMarks: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "revaluationEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    let count = 0;
    for (const id of args.ids) {
      await ctx.db.patch(id, {
        status: "approved", revisedMarks: args.revisedMarks,
        remarks: args.remarks, reviewedBy: ctx.__performerUserId as any, reviewedAt: now, updatedAt: now,
      });
      count++;
    }
    return { count };
  }),
});

// ═══════════════════════════════════════════════════════════════════
// SUPPLEMENTARY EXAM HELPERS
// ═══════════════════════════════════════════════════════════════════

export const getSupplementaryEligibleStudents = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("passFail"), "supplementary"),
      ))
      .collect();

    const enriched = await Promise.all(
      results.map(async (r) => {
        const person = await ctx.db.get(r.studentId);
        const reval = await ctx.db
          .query("examRevaluation")
          .filter((q) => q.and(
            q.eq(q.field("examSessionId"), args.examSessionId),
            q.eq(q.field("studentId"), r.studentId),
            q.eq(q.field("revaluationType"), "supplementary"),
          ))
          .first();
        return {
          ...r,
          studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
          hasAppliedSupplementary: !!reval,
          revaluationId: reval?._id,
        };
      }),
    );

    return enriched;
  },
});
