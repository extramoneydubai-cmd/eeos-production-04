import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// QUESTION PAPER QUERIES (Part 9)
// ═══════════════════════════════════════════════════════════════════

export const listQuestionPapers = query({
  args: {
    examSessionId: v.optional(v.id("examSessions")),
    examSubjectId: v.optional(v.id("examSubjects")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examQuestionPapers");
    if (args.examSessionId) q = q.filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.status) q = q.filter((eq) => eq.eq(eq.field("status"), args.status));
    const all = await q.order("desc").collect();
    if (args.examSubjectId) return all.filter((p) => p.examSubjectId === args.examSubjectId);
    return all;
  },
});

export const getQuestionPaper = query({
  args: { id: v.id("examQuestionPapers") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getQuestionPaperHistory = query({
  args: { examSubjectId: v.id("examSubjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examQuestionPapers")
      .filter((q) => q.eq(q.field("examSubjectId"), args.examSubjectId))
      .order("desc")
      .collect();
  },
});

// ═══════════════════════════════════════════════════════════════════
// QUESTION PAPER MUTATIONS
// ═══════════════════════════════════════════════════════════════════

export const createQuestionPaper = mutation({
  args: { token: v.optional(v.string()),
    examSessionId: v.id("examSessions"),
    examSubjectId: v.id("examSubjects"),
    title: v.string(),
    totalMarks: v.number(),
    duration: v.optional(v.number()),
    instructions: v.optional(v.string()),
    blueprint: v.optional(v.string()),
    sections: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examQuestionPapers", {
      ...args,
      version: 1,
      status: "draft",
      createdBy: ctx.__performerUserId as any,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "question_paper_created",
      description: `Question paper "${args.title}" created (v1)`,
      userId: ctx.__performerUserId as any,
      createdAt: now,
    });

    return id;
  }),
});

export const updateQuestionPaper = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("examQuestionPapers"),
    title: v.optional(v.string()),
    totalMarks: v.optional(v.number()),
    duration: v.optional(v.number()),
    instructions: v.optional(v.string()),
    blueprint: v.optional(v.string()),
    sections: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Question paper not found");
    if (existing.status === "locked" || existing.status === "released") {
      throw new Error("Cannot edit locked or released paper");
    }

    await ctx.db.patch(id, {
      ...updates,
      version: existing.version + 1,
      updatedAt: Date.now(),
    });
    return id;
  }),
});

export const submitQuestionPaperForReview = mutation({
  args: { token: v.optional(v.string()), id: v.id("examQuestionPapers") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "review", updatedAt: Date.now() });
    const paper = await ctx.db.get(args.id);
    if (paper) {
      await ctx.db.insert("examTimeline", {
        examSessionId: paper.examSessionId,
        eventType: "question_paper_submitted",
        description: "Question paper submitted for review",
        createdAt: Date.now(),
      });
    }
    return args.id;
  }),
});

export const approveQuestionPaper = mutation({
  args: { token: v.optional(v.string()), id: v.id("examQuestionPapers") },
  handler: withScopeAndEvents({ operation: "approve", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "approved",
      approvedBy: ctx.__performerUserId as any,
      approvedAt: now,
      updatedAt: now,
    });
    return args.id;
  }),
});

export const releaseQuestionPaper = mutation({
  args: { token: v.optional(v.string()), id: v.id("examQuestionPapers") },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "released",
      releasedBy: ctx.__performerUserId as any,
      releasedAt: now,
      updatedAt: now,
    });
    return args.id;
  }),
});

export const lockQuestionPaper = mutation({
  args: { token: v.optional(v.string()), id: v.id("examQuestionPapers") },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "locked", updatedAt: Date.now() });
    return args.id;
  }),
});

export const recordQuestionPaperPrint = mutation({
  args: { token: v.optional(v.string()), id: v.id("examQuestionPapers") },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    const paper = await ctx.db.get(args.id);
    if (!paper) throw new Error("Paper not found");
    await ctx.db.patch(args.id, {
      printCount: (paper.printCount ?? 0) + 1,
      lastPrintedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

export const approveQuestionPaperWithReview = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("examQuestionPapers"),
    reviewedBy: v.id("users"),
    reviewedAt: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "approve", module: "academic", entity: "questionPaperEngine" }, async (ctx, args) => {
    const now = Date.now();
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      reviewedAt: now,
      status: "approved",
      updatedAt: now,
    });
    return id;
  }),
});
