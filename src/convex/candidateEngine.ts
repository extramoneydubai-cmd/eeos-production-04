import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── CANDIDATE STATUS LIFECYCLE ────────────────────────────

export const CANDIDATE_STATUS_FLOW = [
  "applied",
  "screening",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "assessment",
  "offer_pending",
  "offer_accepted",
  "hired",
  "employee_created",
  "rejected",
  "archived",
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUS_FLOW)[number];

// Default valid transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  applied: ["screening", "rejected"],
  screening: ["shortlisted", "rejected"],
  shortlisted: ["interview_scheduled", "rejected"],
  interview_scheduled: ["interview_completed", "rejected", "shortlisted"],
  interview_completed: ["assessment", "shortlisted", "rejected"],
  assessment: ["offer_pending", "rejected"],
  offer_pending: ["offer_accepted", "rejected"],
  offer_accepted: ["hired", "rejected"],
  hired: ["employee_created"],
  employee_created: ["archived"],
  rejected: ["archived"],
  archived: [],
};

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

async function insertCandidateStatusHistory(
  ctx: any,
  candidateId: Id<"candidates">,
  fromStatus: string,
  toStatus: string,
  changedBy: Id<"users">,
  remarks?: string
) {
  await ctx.db.insert("candidateStatusHistory", {
    candidateId,
    fromStatus,
    toStatus,
    changedBy,
    remarks,
    createdAt: Date.now(),
  });
}

// ─── CRUD ──────────────────────────────────────────────────

export const createCandidate = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    jobPostingId: v.optional(v.id("jobPostings")),
    source: v.string(),
    appliedPosition: v.string(),
    expectedSalary: v.optional(v.number()),
    currentSalary: v.optional(v.number()),
    noticePeriod: v.optional(v.number()),
    experience: v.optional(v.number()),
    resumeUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "recruitment", entity: "candidateEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("candidates", {
      ...args,
      status: "applied",
      createdAt: now,
      updatedAt: now,
    });

    await createTimelineEvent(ctx, {
      candidateId: id,
      eventType: "created",
      title: "Candidate Created",
      description: `Applied for ${args.appliedPosition}`,
      performedBy: ctx.__performerUserId as any,
    });

    return id;
  }),
});

export const updateCandidate = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("candidates"),
    expectedSalary: v.optional(v.number()),
    currentSalary: v.optional(v.number()),
    noticePeriod: v.optional(v.number()),
    experience: v.optional(v.number()),
    resumeUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "candidateEngine" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

export const getCandidate = query({
  args: { id: v.id("candidates") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listCandidates = query({
  args: {
    status: v.optional(v.string()),
    jobPostingId: v.optional(v.id("jobPostings")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("candidates");
    if (args.status) {
      q = q.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.jobPostingId) {
      q = q.filter((q: any) => q.eq(q.field("jobPostingId"), args.jobPostingId));
    }
    const results = await q.collect();
    const limit = args.limit || 100;
    return results.slice(0, limit);
  },
});

export const searchCandidates = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const candidates = await ctx.db.query("candidates").collect();
    const q = args.searchQuery.toLowerCase();

    return candidates
      .filter((c) =>
        c.appliedPosition.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
      )
      .slice(0, args.limit || 20);
  },
});

// ─── STATUS LIFECYCLE ──────────────────────────────────────

export const transitionCandidateStatus = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    newStatus: v.string(),
    rejectionReason: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "candidateEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    const fromStatus = candidate.status;
    const toStatus = args.newStatus;

    // Validate transition
    const allowed = VALID_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new Error(
        `Invalid status transition: ${fromStatus} → ${toStatus}. Allowed: ${allowed.join(", ") || "none"}`
      );
    }

    const updates: Record<string, any> = {
      status: toStatus,
      updatedAt: Date.now(),
    };
    if (args.rejectionReason) {
      updates.rejectionReason = args.rejectionReason;
    }

    await ctx.db.patch(args.candidateId, updates);

    // Record status history
    await insertCandidateStatusHistory(
      ctx,
      args.candidateId,
      fromStatus,
      toStatus,
      ctx.__performerUserId as any,
      args.rejectionReason
    );

    // Create timeline event
    await createTimelineEvent(ctx, {
      candidateId: args.candidateId,
      eventType: "status_changed",
      title: `Status: ${fromStatus} → ${toStatus}`,
      description: args.rejectionReason ? `Reason: ${args.rejectionReason}` : undefined,
      performedBy: ctx.__performerUserId as any,
    });

    return args.candidateId;
  }),
});

export const rejectCandidate = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    reason: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "candidateEngine" }, async (ctx, args) => {
    return (transitionCandidateStatus as any)(ctx, {
      candidateId: args.candidateId,
      newStatus: "rejected",
      rejectionReason: args.reason,
    });
  }),
});

export const archiveCandidate = mutation({
  args: { token: v.optional(v.string()), candidateId: v.id("candidates") },
  handler: withScopeAndEvents({ operation: "update", module: "recruitment", entity: "candidateEngine" }, async (ctx, args) => {
    return (transitionCandidateStatus as any)(ctx, {
      candidateId: args.candidateId,
      newStatus: "archived",
    });
  }),
});

// ─── PIPELINE VIEW ─────────────────────────────────────────

export const getCandidatePipeline = query({
  args: {
    jobPostingId: v.optional(v.id("jobPostings")),
  },
  handler: async (ctx, args) => {
    const allCandidates = await ctx.db.query("candidates").collect();
    const candidates = args.jobPostingId
      ? allCandidates.filter((c) => c.jobPostingId === args.jobPostingId)
      : allCandidates;

    const pipeline: Record<string, any[]> = {};
    for (const status of CANDIDATE_STATUS_FLOW) {
      pipeline[status] = [];
    }

    for (const candidate of candidates) {
      const status = candidate.status;
      if (pipeline[status]) {
        // Fetch person info
        const person = await ctx.db.get(candidate.personId);
        pipeline[status].push({
          ...candidate,
          personName: person?.displayName || person?.firstName || "Unknown",
          personPhoto: person?.profilePhoto,
        });
      }
    }

    return pipeline;
  },
});

// ─── TIMELINE ──────────────────────────────────────────────

export const getCandidateTimeline = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, args) => {
    const timeline = await ctx.db
      .query("candidateTimeline")
      .filter((q: any) => q.eq(q.field("candidateId"), args.candidateId))
      .collect();
    return timeline.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});
