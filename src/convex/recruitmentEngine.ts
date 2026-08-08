import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";

// ─── Enterprise Handler Factory ───────────────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration.
// When a session token is supplied the withScopeAndEvents wrapper resolves
// the REAL performer from the sessions table; getAuthUserId (Convex auth
// headers) only applies to legacy flows. The declared actor (identity
// subject) remains the recorded actor, while authorization uses the
// verified performer.

function withRecruitment<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  handler: (ctx: any, args: P) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const raw = args as any;
    const hasToken = typeof raw?.token === "string" && raw.token.length > 0;
    let userId: Id<"users"> | undefined;
    if (!hasToken) {
      userId = (await getAuthUserId(ctx)) as Id<"users"> | undefined;
    }

    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module: "hr",
        entity,
        getEntityCompanyId: () => undefined,
        getEntityBranchId: () => undefined,
        getEntityDepartmentId: () => undefined,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        triggerWorkflow: true,
        triggerAutomation: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2),
    );
    return wrappedHandler(ctx, args);
  };
}

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

// ─── JOB REQUISITIONS ──────────────────────────────────────

export const createJobRequisition = mutation({
  args: {
    token: v.optional(v.string()),
    departmentId: v.id("organizationDepartments"),
    designationId: v.optional(v.id("organizationDesignations")),
    companyId: v.optional(v.id("organizationCompanies")),
    branchId: v.optional(v.id("organizationBranches")),
    vacancies: v.number(),
    employmentType: v.string(),
    salaryRange: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: withRecruitment("create", "job_requisition", async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("jobRequisitions", {
      ...args,
      requestedBy: identity.subject as any,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }),
});

export const updateJobRequisition = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("jobRequisitions"),
    departmentId: v.optional(v.id("organizationDepartments")),
    designationId: v.optional(v.id("organizationDesignations")),
    vacancies: v.optional(v.number()),
    employmentType: v.optional(v.string()),
    salaryRange: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: withRecruitment("update", "job_requisition", async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

export const submitForApproval = mutation({
  args: { token: v.optional(v.string()), id: v.id("jobRequisitions") },
  handler: withRecruitment("update", "job_requisition", async (ctx, args) => {
    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "draft") throw new Error("Only draft requisitions can be submitted");

    await ctx.db.patch(args.id, { status: "pending_approval", updatedAt: Date.now() });
    return args.id;
  }),
});

export const approveRequisition = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("jobRequisitions"),
    approved: v.boolean(),
  },
  handler: withRecruitment("approve", "job_requisition", async (ctx, args) => {
    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("Requisition not found");

    await ctx.db.patch(args.id, {
      status: args.approved ? "approved" : "rejected",
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

export const cancelRequisition = mutation({
  args: { token: v.optional(v.string()), id: v.id("jobRequisitions") },
  handler: withRecruitment("update", "job_requisition", async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "cancelled", updatedAt: Date.now() });
    return args.id;
  }),
});

export const listRequisitions = query({
  args: {
    status: v.optional(v.string()),
    departmentId: v.optional(v.id("organizationDepartments")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("jobRequisitions");
    if (args.status) {
      q = q.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.departmentId) {
      q = q.filter((q: any) => q.eq(q.field("departmentId"), args.departmentId));
    }
    return q.collect();
  },
});

export const getRequisition = query({
  args: { id: v.id("jobRequisitions") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── JOB POSTINGS ──────────────────────────────────────────

export const publishJob = mutation({
  args: {
    token: v.optional(v.string()),
    requisitionId: v.id("jobRequisitions"),
    title: v.string(),
    description: v.optional(v.string()),
    skills: v.array(v.string()),
    locations: v.array(v.string()),
    applicationDeadline: v.optional(v.number()),
  },
  handler: withRecruitment("create", "job_posting", async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const req = await ctx.db.get(args.requisitionId);
    if (!req) throw new Error("Requisition not found");
    if (req.status !== "approved") throw new Error("Requisition must be approved first");

    const now = Date.now();
    const id = await ctx.db.insert("jobPostings", {
      ...args,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }),
});

export const closeJobPosting = mutation({
  args: { token: v.optional(v.string()), id: v.id("jobPostings") },
  handler: withRecruitment("update", "job_posting", async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "closed", updatedAt: Date.now() });
    return args.id;
  }),
});

export const listJobPostings = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("closed"), v.literal("cancelled"))),
    requisitionId: v.optional(v.id("jobRequisitions")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("jobPostings");
    if (args.status) {
      q = q.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.requisitionId) {
      q = q.filter((q: any) => q.eq(q.field("requisitionId"), args.requisitionId));
    }
    return q.collect();
  },
});

export const getJobPosting = query({
  args: { id: v.id("jobPostings") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── CANDIDATE APPLICATION ─────────────────────────────────

export const applyCandidate = mutation({
  args: {
    token: v.optional(v.string()),
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
  handler: withRecruitment("create", "candidate", async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
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
      eventType: "application_submitted",
      title: "Application Submitted",
      description: `Applied for ${args.appliedPosition}`,
      performedBy: identity.subject as any,
    });

    return id;
  }),
});

// ─── HIRING (Candidate → Employee) ─────────────────────────

export const hireCandidate = mutation({
  args: {
    token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    personId: v.id("personMaster"),
    departmentId: v.id("organizationDepartments"),
    designationId: v.optional(v.id("organizationDesignations")),
    companyId: v.optional(v.id("organizationCompanies")),
    branchId: v.optional(v.id("organizationBranches")),
    employeeCode: v.optional(v.string()),
    reportingManagerId: v.optional(v.id("users")),
    joiningDate: v.number(),
    employmentType: v.string(),
  },
  handler: withRecruitment("create", "employee", async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.status !== "offer_accepted") throw new Error("Candidate must have accepted offer");

    // Verify person exists
    const person = await ctx.db.get(args.personId);
    if (!person) throw new Error("Person not found in People Registry");

    const now = Date.now();

    // Create employee record
    const employeeId = await ctx.db.insert("employeeMaster", {
      personId: args.personId,
      employeeCode: args.employeeCode || `EMP-${String(now).slice(-6)}`,
      departmentId: args.departmentId,
      designationId: args.designationId,
      companyId: args.companyId,
      branchId: args.branchId,
      reportingManagerId: args.reportingManagerId,
      employmentType: args.employmentType,
      joiningDate: args.joiningDate,
      status: "active",
      createdAt: now,
      updatedAt: now,
    } as any);

    // Update candidate status
    await ctx.db.patch(args.candidateId, {
      status: "employee_created",
      updatedAt: now,
    });

    // Update offer status
    const offer = await ctx.db.query("offers")
      .withIndex("candidateId", (q: any) => q.eq("candidateId", args.candidateId))
      .first();
    if (offer) {
      await ctx.db.patch(offer._id, { status: "accepted", updatedAt: now });
    }

    await createTimelineEvent(ctx, {
      candidateId: args.candidateId,
      eventType: "employee_created",
      title: "Employee Created",
      description: `Employee record created (${args.employeeCode || `EMP-${String(now).slice(-6)}`})`,
      performedBy: identity.subject as any,
    });

    return { employeeId, candidateId: args.candidateId };
  }),
});

// ─── REPORTING ─────────────────────────────────────────────

export const getRecruitmentAnalytics = query({
  handler: async (ctx) => {
    const [candidates, requisitions, postings, offers, interviews] = await Promise.all([
      ctx.db.query("candidates").collect(),
      ctx.db.query("jobRequisitions").collect(),
      ctx.db.query("jobPostings").collect(),
      ctx.db.query("offers").collect(),
      ctx.db.query("interviewRounds").collect(),
    ]);

    return {
      totalCandidates: candidates.length,
      totalRequisitions: requisitions.length,
      totalPostings: postings.length,
      approvedRequisitions: requisitions.filter((r) => r.status === "approved").length,
      activePostings: postings.filter((p) => p.status === "published").length,
      hired: candidates.filter((c) => c.status === "hired" || c.status === "employee_created").length,
      rejected: candidates.filter((c) => c.status === "rejected").length,
      inPipeline: candidates.filter((c) =>
        ["applied", "screening", "shortlisted", "interview_scheduled", "interview_completed", "assessment", "offer_pending"].includes(c.status)
      ).length,
      pendingOffers: offers.filter((o) => o.status === "pending").length,
      scheduledInterviews: interviews.filter((i) => i.schedule > Date.now()).length,
    };
  },
});
