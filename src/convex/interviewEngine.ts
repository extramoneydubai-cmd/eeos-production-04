import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── HELPERS ───────────────────────────────────────────────

async function createTimelineEvent(
  ctx: any,
  args: {
    candidateId: Id<"candidates">;
    eventType: string;
    title: string;
    description?: string;
    performedBy: Id<"users">;
  }
) {
  await ctx.db.insert("candidateTimeline", {
    candidateId: args.candidateId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    performedBy: args.performedBy,
    createdAt: Date.now(),
  });
}

// ─── INTERVIEW CRUD ────────────────────────────────────────

export const scheduleInterview = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    roundName: v.string(),
    interviewerIds: v.array(v.id("users")),
    schedule: v.number(),
    mode: v.union(v.literal("online"), v.literal("offline"), v.literal("phone")),
    duration: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "recruitment", entity: "interviewEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("interviewRounds", {
      candidateId: args.candidateId,
      roundName: args.roundName,
      interviewerIds: args.interviewerIds,
      schedule: args.schedule,
      mode: args.mode,
      duration: args.duration,
      result: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await createTimelineEvent(ctx, {
      candidateId: args.candidateId,
      eventType: "interview_scheduled",
      title: `Interview Scheduled: ${args.roundName}`,
      description: `Mode: ${args.mode}, ${args.interviewerIds.length} interviewer(s)`,
      performedBy: ctx.__performerUserId as any,
    });

    return id;
  }),
});

export const rescheduleInterview = mutation({
  args: { token: v.optional(v.string()),
    interviewId: v.id("interviewRounds"),
    schedule: v.number(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "interviewEngine" }, async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    await ctx.db.patch(args.interviewId, {
      schedule: args.schedule,
      result: "rescheduled",
      updatedAt: Date.now(),
    });

    return args.interviewId;
  }),
});

export const recordInterview = mutation({
  args: { token: v.optional(v.string()),
    interviewId: v.id("interviewRounds"),
    result: v.union(v.literal("passed"), v.literal("failed"), v.literal("pending"), v.literal("rescheduled")),
    score: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "interviewEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    await ctx.db.patch(args.interviewId, {
      result: args.result,
      score: args.score,
      remarks: args.remarks,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(ctx, {
      candidateId: interview.candidateId,
      eventType: "interview_completed",
      title: `Interview ${args.result === "passed" ? "Passed" : "Failed"}: ${interview.roundName}`,
      description: args.remarks || `Score: ${args.score || "N/A"}`,
      performedBy: ctx.__performerUserId as any,
    });

    return args.interviewId;
  }),
});

export const getInterview = query({
  args: { id: v.id("interviewRounds") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listInterviews = query({
  args: {
    candidateId: v.optional(v.id("candidates")),
    interviewerId: v.optional(v.id("users")),
    upcoming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let interviews = await ctx.db.query("interviewRounds").collect();

    if (args.candidateId) {
      interviews = interviews.filter((i) => i.candidateId === args.candidateId);
    }

    if (args.interviewerId) {
      const interviewerId = args.interviewerId;
      interviews = interviews.filter((i) => i.interviewerIds.includes(interviewerId));
    }

    if (args.upcoming) {
      interviews = interviews.filter((i) => i.schedule > Date.now() && i.result === "pending");
    }

    return interviews.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── ASSESSMENTS ───────────────────────────────────────────

export const createAssessment = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    assessmentType: v.string(),
    score: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    evaluator: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "recruitment", entity: "interviewEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const id = await ctx.db.insert("assessments", {
      candidateId: args.candidateId,
      assessmentType: args.assessmentType,
      score: args.score,
      maxScore: args.maxScore,
      evaluator: args.evaluator,
      result: "pending",
      remarks: args.remarks,
      createdAt: Date.now(),
    });

    await createTimelineEvent(ctx, {
      candidateId: args.candidateId,
      eventType: "assessment_created",
      title: `Assessment: ${args.assessmentType}`,
      description: `Max score: ${args.maxScore || "N/A"}`,
      performedBy: ctx.__performerUserId as any,
    });

    return id;
  }),
});

export const recordAssessmentResult = mutation({
  args: { token: v.optional(v.string()),
    assessmentId: v.id("assessments"),
    score: v.optional(v.number()),
    result: v.union(v.literal("pass"), v.literal("fail"), v.literal("pending")),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "interviewEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    const updates: Record<string, any> = {
      result: args.result,
      updatedAt: Date.now(),
    };
    if (args.score !== undefined) updates.score = args.score;
    if (args.remarks !== undefined) updates.remarks = args.remarks;

    await ctx.db.patch(args.assessmentId, updates);

    await createTimelineEvent(ctx, {
      candidateId: assessment.candidateId,
      eventType: "assessment_completed",
      title: `Assessment ${args.result === "pass" ? "Passed" : "Failed"}: ${assessment.assessmentType}`,
      description: `Score: ${args.score || "N/A"} - ${args.remarks || ""}`,
      performedBy: ctx.__performerUserId as any,
    });

    return args.assessmentId;
  }),
});

export const listAssessments = query({
  args: {
    candidateId: v.optional(v.id("candidates")),
    evaluator: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("assessments");
    if (args.candidateId) {
      q = q.filter((q: any) => q.eq(q.field("candidateId"), args.candidateId));
    }
    if (args.evaluator) {
      q = q.filter((q: any) => q.eq(q.field("evaluator"), args.evaluator));
    }
    const results = await q.collect();
    return results.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

// ─── UPCOMING INTERVIEWS DASHBOARD ─────────────────────────

export const getUpcomingInterviews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const interviews = await ctx.db.query("interviewRounds").collect();
    const upcoming = interviews
      .filter((i) => i.schedule > now && i.result === "pending")
      .sort((a, b) => a.schedule - b.schedule)
      .slice(0, args.limit || 20);

    // Enrich with candidate names
    const enriched: any[] = [];
    for (const interview of upcoming) {
      const candidate = await ctx.db.get(interview.candidateId);
      const person = candidate ? await ctx.db.get(candidate.personId) : null;
      enriched.push({
        ...interview,
        candidateName: person?.displayName || person?.firstName || "Unknown",
        appliedPosition: candidate?.appliedPosition || "",
      });
    }
    return enriched;
  },
});
