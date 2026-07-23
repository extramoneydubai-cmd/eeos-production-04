import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { logActivity, createNotification } from "./crmHelpers";

/* ────────────
   CONSTANTS
   ──────────── */

const LEAD_STATUS_TRANSITIONS: Record<string, string[]> = {
  active: ["converted", "lost", "archived"],
  converted: [],
  lost: ["active", "archived"],
  archived: ["active"],
};

/* ────────────
   STEP 1 — CREATE FROM INTAKE SUBMISSION
   Every lead MUST originate from Intake Engine.
   No direct lead creation allowed.
   ──────────── */

export const createFromSubmission = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");
    if (submission.targetModule !== "crm") {
      throw new Error(`Submission routed to ${submission.targetModule}, not CRM`);
    }

    const payload = JSON.parse(submission.payload || "{}");
    const now = Date.now();

    // Extract lead fields from payload with defaults
    const firstName = payload.firstName || payload.first_name || payload.name || "Unknown";
    const lastName = payload.lastName || payload.last_name || "";
    const phone = payload.phone || payload.mobile || payload.whatsapp || "";
    const email = payload.email || payload.emailAddress || undefined;
    const stage = payload.stage || "new";
    const source = payload.source || submission.source || "intake";
    const priority = payload.priority || "medium";
    const location = payload.location || payload.city || undefined;
    const courseInterest = payload.courseInterest || payload.course || payload.program || undefined;

    // Create the lead
    const leadId = await ctx.db.insert("leadMaster", {
      firstName,
      lastName,
      phone,
      email,
      location,
      stage,
      source,
      priority: priority as "low" | "medium" | "high" | "critical",
      status: "active",
      createdBy: args.createdBy,
      verticalId: payload.verticalId || undefined,
      subVerticalId: payload.subVerticalId || undefined,
      boardId: payload.boardId || undefined,
      branchInterestId: payload.branchInterestId || undefined,
      courseInterest,
      whatsappUsername: payload.whatsappUsername || undefined,
      whatsappPin: payload.whatsappPin || undefined,
      tags: payload.tags || undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Record stage history
    await ctx.db.insert("leadStageHistory", {
      leadId,
      toStage: stage,
      changedBy: args.createdBy,
      createdAt: now,
    });

    // Log activity
    await logActivity(ctx, leadId, "lead_created", `Lead created from intake submission ${submission.submissionNumber}`, args.createdBy);
    await logActivity(ctx, leadId, "stage_changed", `Started at ${stage}`, args.createdBy);

    // Link submission to lead
    await ctx.db.patch(args.submissionId, {
      targetEntityId: leadId,
      systemNotes: submission.systemNotes
        ? `${submission.systemNotes}\nLead created: ${leadId}`
        : `Lead created: ${leadId}`,
    });

    // Calculate initial health score
    await calculateHealthScoreInternal(ctx, leadId);

    // Notify if owner assigned
    if (payload.ownerId) {
      const owner = await ctx.db.get(payload.ownerId);
      if (owner) {
        await createNotification(
          ctx, payload.ownerId, "lead", "New Lead Assigned",
          `${firstName} ${lastName} assigned to you`,
          leadId, "lead",
        );
      }
    }

    return {
      leadId,
      submissionNumber: submission.submissionNumber,
      autoAssigned: !!payload.ownerId,
    };
  },
});

/* ────────────
   STEP 2 — ASSIGN LEAD WITH RULES
   Supports auto-assignment rules: owner, team, round_robin
   ──────────── */

export const assignLeadWithRules = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignmentType: v.union(
      v.literal("manual"),
      v.literal("round_robin"),
      v.literal("team"),
      v.literal("manager"),
    ),
    assignedTo: v.optional(v.id("users")),
    assignedBy: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    let toUserId: Id<"users"> | null = null;

    if (args.assignmentType === "manual" && args.assignedTo) {
      toUserId = args.assignedTo;
    } else if (args.assignmentType === "round_robin") {
      // Simple round-robin: find user with least assigned leads
      const allLeads = await ctx.db.query("leadMaster").collect();
      const activeUsers = await ctx.db.query("users").filter((q) =>
        q.and(
          q.neq(q.field("role"), undefined),
          q.neq(q.field("isDisabled"), true),
        )
      ).collect();

      const leadCounts = activeUsers.map((u) => ({
        userId: u._id,
        count: allLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
      }));

      leadCounts.sort((a, b) => a.count - b.count);
      toUserId = leadCounts[0]?.userId || null;
    } else if (args.assignmentType === "manager" && lead.ownerId) {
      // Assign to reporting manager of current owner
      const currentOwner = await ctx.db.get(lead.ownerId);
      if (currentOwner?.reportingManagerId) {
        toUserId = currentOwner.reportingManagerId;
      }
    }

    if (!toUserId) {
      throw new Error("Could not determine assignee");
    }

    const fromUserId = lead.ownerId || undefined;
    const now = Date.now();

    await ctx.db.patch(args.leadId, {
      ownerId: toUserId,
      updatedAt: now,
    });

    await ctx.db.insert("leadAssignments", {
      leadId: args.leadId,
      fromUserId,
      toUserId,
      assignedBy: args.assignedBy,
      note: args.note,
      createdAt: now,
    });

    const toUser = await ctx.db.get(toUserId);
    await logActivity(
      ctx, args.leadId, "assigned",
      `Assigned to ${toUser?.name || toUserId} via ${args.assignmentType}`,
      args.assignedBy,
    );

    await createNotification(
      ctx, toUserId, "lead", "Lead Assigned",
      `${lead.firstName} ${lead.lastName} assigned to you`,
      args.leadId, "lead",
    );

    return { assignedTo: toUserId };
  },
});

/* ────────────
   STEP 3 — CALCULATE HEALTH SCORE
   ──────────── */

async function calculateHealthScoreInternal(ctx: any, leadId: Id<"leadMaster">) {
  const lead = await ctx.db.get(leadId);
  if (!lead) return;

  let score = 0;
  let maxScore = 100;
  const dimensions: Record<string, { score: number; max: number; label: string }> = {};

  // Dimension 1: Profile completeness (30 pts)
  let profileScore = 0;
  if (lead.firstName && lead.lastName) profileScore += 8;
  if (lead.phone) profileScore += 8;
  if (lead.email) profileScore += 7;
  if (lead.location) profileScore += 7;
  dimensions.profile = { score: profileScore, max: 30, label: "Profile Completeness" };
  score += profileScore;

  // Dimension 2: Engagement (25 pts)
  let engagementScore = 10; // base
  const activities = await ctx.db
    .query("leadActivity")
    .withIndex("leadId", (q) => q.eq("leadId", leadId))
    .collect();
  const recentActivity = activities.filter((a: any) => a.createdAt > Date.now() - 7 * 86400000);
  engagementScore += Math.min(recentActivity.length * 3, 15);
  if (lead.nextActionDate && lead.nextActionDate > Date.now()) engagementScore += 5;
  dimensions.engagement = { score: Math.min(engagementScore, 25), max: 25, label: "Engagement" };
  score += Math.min(engagementScore, 25);

  // Dimension 3: Pipeline position (25 pts)
  let pipelineScore = 0;
  const stageScores: Record<string, number> = {
    new: 5, contacted: 10, qualified: 15, demo: 18, negotiation: 22, converted: 25,
  };
  pipelineScore = stageScores[lead.stage] || 5;
  dimensions.pipeline = { score: pipelineScore, max: 25, label: "Pipeline Position" };
  score += pipelineScore;

  // Dimension 4: Financial readiness (20 pts)
  let financialScore = 0;
  if (lead.expectedRevenue && lead.expectedRevenue > 0) financialScore += 5;
  if (lead.probability && lead.probability > 50) financialScore += 5;
  if (lead.standardAmount && lead.standardAmount > 0) financialScore += 5;
  if (lead.finalPayable && lead.finalPayable > 0) financialScore += 5;
  dimensions.financial = { score: financialScore, max: 20, label: "Financial Readiness" };
  score += financialScore;

  // Determine tier
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let tier: string;
  if (pct >= 80) tier = "hot";
  else if (pct >= 60) tier = "warm";
  else if (pct >= 35) tier = "cool";
  else tier = "cold";

  await ctx.db.insert("leadHealthScores", {
    leadId,
    score,
    maxScore,
    dimensions: JSON.stringify(dimensions),
    tier,
    calculatedAt: Date.now(),
    createdAt: Date.now(),
  });

  return { score, maxScore, tier, dimensions };
}

export const calculateHealthScore = mutation({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    return calculateHealthScoreInternal(ctx, args.leadId);
  },
});

export const getHealthScore = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("leadHealthScores")
      .withIndex("leadId_calculatedAt", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(1);
    return scores[0] || null;
  },
});

/* ────────────
   STEP 4 — SCHEDULE FOLLOW-UP
   ──────────── */

export const scheduleFollowUp = mutation({
  args: {
    leadId: v.id("leadMaster"),
    action: v.string(),
    followupDate: v.number(),
    followupType: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    reminder: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.leadId, {
      nextAction: args.action,
      nextActionDate: args.followupDate,
      updatedAt: now,
    });

    await logActivity(
      ctx, args.leadId, "followup_scheduled",
      `Follow-up: ${args.action} on ${new Date(args.followupDate).toLocaleDateString()}`,
      args.userId,
    );

    await ctx.db.insert("leadTasks", {
      leadId: args.leadId,
      title: args.action,
      ownerId: args.userId,
      assignedTo: args.userId,
      dueDate: args.followupDate,
      status: "pending",
      priority: args.priority || "medium",
      createdAt: now,
      updatedAt: now,
    });

    return { scheduled: true };
  },
});

/* ────────────
   STEP 5 — START TRIAL
   ──────────── */

export const startTrial = mutation({
  args: {
    leadId: v.id("leadMaster"),
    trialEndDate: v.number(),
    startedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const now = Date.now();

    // Upsert: check if pipeline exists
    const existing = await ctx.db
      .query("leadConversionPipeline")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        trialStartDate: now,
        trialEndDate: args.trialEndDate,
        trialPhase: "in_progress",
        conversionNotes: args.notes,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("leadConversionPipeline", {
        leadId: args.leadId,
        pipelineType: "trial",
        trialStartDate: now,
        trialEndDate: args.trialEndDate,
        trialPhase: "in_progress",
        createdAt: now,
        updatedAt: now,
      });
    }

    await logActivity(
      ctx, args.leadId, "trial_started",
      `Trial started until ${new Date(args.trialEndDate).toLocaleDateString()}`,
      args.startedBy,
    );

    return { trialStarted: true, trialEndDate: args.trialEndDate };
  },
});

export const updateTrialPhase = mutation({
  args: {
    leadId: v.id("leadMaster"),
    phase: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("extended"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    updatedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db
      .query("leadConversionPipeline")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .first();

    if (!pipeline) throw new Error("No trial pipeline found for this lead");

    await ctx.db.patch(pipeline._id, {
      trialPhase: args.phase,
      conversionNotes: args.notes,
      updatedAt: Date.now(),
    });

    await logActivity(
      ctx, args.leadId, `trial_${args.phase}`,
      `Trial phase changed to ${args.phase}`,
      args.updatedBy,
    );

    return { phase: args.phase };
  },
});

/* ────────────
   STEP 6 — CONVERT LEAD
   ──────────── */

export const convertLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    conversionType: v.union(
      v.literal("trial"),
      v.literal("direct_conversion"),
      v.literal("installment"),
    ),
    convertedBy: v.id("users"),
    revenueAmount: v.optional(v.number()),
    revenueCollected: v.optional(v.number()),
    paymentPlan: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "converted") throw new Error("Lead is already converted");

    // Require at least one verified payment
    const payments = await ctx.db
      .query("leadPayments")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
    const verifiedPayments = payments.filter((p) => p.status === "verified");
    if (verifiedPayments.length === 0) {
      throw new Error("Cannot convert lead without at least one verified payment");
    }

    const now = Date.now();
    const fromStage = lead.stage;

    // Update lead status
    await ctx.db.patch(args.leadId, {
      status: "converted",
      stage: "converted",
      updatedAt: now,
    });

    // Record stage history
    await ctx.db.insert("leadStageHistory", {
      leadId: args.leadId,
      fromStage,
      toStage: "converted",
      changedBy: args.convertedBy,
      note: args.notes,
      createdAt: now,
    });

    // Upsert conversion pipeline record
    const existing = await ctx.db
      .query("leadConversionPipeline")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        pipelineType: args.conversionType,
        conversionDate: now,
        convertedBy: args.convertedBy,
        revenueAmount: args.revenueAmount,
        revenueCollected: args.revenueCollected,
        paymentPlan: args.paymentPlan,
        installmentCount: args.installmentCount,
        conversionNotes: args.notes,
        trialPhase: args.conversionType === "trial" ? "completed" : existing.trialPhase,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("leadConversionPipeline", {
        leadId: args.leadId,
        pipelineType: args.conversionType,
        conversionDate: now,
        convertedBy: args.convertedBy,
        revenueAmount: args.revenueAmount,
        revenueCollected: args.revenueCollected,
        paymentPlan: args.paymentPlan,
        installmentCount: args.installmentCount,
        conversionNotes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logActivity(
      ctx, args.leadId, "converted",
      `Lead converted via ${args.conversionType}` +
        (args.revenueAmount ? ` | Revenue: ${args.revenueAmount}` : ""),
      args.convertedBy,
    );

    // Notify owner
    if (lead.ownerId && args.convertedBy !== lead.ownerId) {
      await createNotification(
        ctx, lead.ownerId, "conversion", "Lead Converted",
        `${lead.firstName} ${lead.lastName} converted to customer`,
        args.leadId, "lead",
      );
    }

    return { converted: true, conversionDate: now };
  },
});

/* ────────────
   STEP 7 — UPDATE LEAD STATUS
   Validates transitions via leadStatusEngine rules
   ──────────── */

export const updateLeadStatus = mutation({
  args: {
    leadId: v.id("leadMaster"),
    newStatus: v.union(v.literal("active"), v.literal("converted"), v.literal("lost"), v.literal("archived")),
    changedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === args.newStatus) return { status: lead.status, changed: false };

    // Check if status transition is allowed
    const allowedNext = LEAD_STATUS_TRANSITIONS[lead.status];
    if (!allowedNext || !allowedNext.includes(args.newStatus)) {
      throw new Error(`Cannot transition from '${lead.status}' to '${args.newStatus}'`);
    }

    // Check custom status engine rules
    const rules = await ctx.db
      .query("leadStatusEngine")
      .withIndex("fromStatus_toStatus", (q) =>
        q.eq("fromStatus", lead.status).eq("toStatus", args.newStatus)
      )
      .collect();

    if (rules.length > 0) {
      const rule = rules[0];
      if (!rule.allowed) {
        throw new Error(`Status transition from '${lead.status}' to '${args.newStatus}' is not allowed by rules`);
      }
      if (rule.requiresPayment && args.newStatus === "converted") {
        const payments = await ctx.db
          .query("leadPayments")
          .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
          .collect();
        if (!payments.some((p) => p.status === "verified")) {
          throw new Error("Verified payment required for this status change");
        }
      }
    }

    // Irreversible: converted cannot be changed
    if (lead.status === "converted") {
      throw new Error("Cannot change status of a converted lead");
    }

    const now = Date.now();
    await ctx.db.patch(args.leadId, {
      status: args.newStatus,
      updatedAt: now,
    });

    await logActivity(
      ctx, args.leadId, "status_changed",
      `Status changed from ${lead.status} to ${args.newStatus}${args.reason ? `: ${args.reason}` : ""}`,
      args.changedBy,
    );

    return { status: args.newStatus, changed: true };
  },
});

/* ────────────
   STEP 8 — GET LEAD LIFECYCLE DATA
   ──────────── */

export const getLeadLifecycle = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) return null;

    const healthScore = await ctx.db
      .query("leadHealthScores")
      .withIndex("leadId_calculatedAt", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(1);

    const pipeline = await ctx.db
      .query("leadConversionPipeline")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .first();

    const activities = await ctx.db
      .query("leadActivity")
      .withIndex("leadId_createdAt", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(20);

    const assignments = await ctx.db
      .query("leadAssignments")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(10);

    return {
      healthScore: healthScore[0] || null,
      pipeline,
      activities,
      assignments,
    };
  },
});

/* ────────────
   BULK OPERATIONS
   ──────────── */

export const bulkAssignWithRules = mutation({
  args: {
    leadIds: v.array(v.id("leadMaster")),
    assignmentType: v.union(
      v.literal("manual"),
      v.literal("round_robin"),
      v.literal("team"),
      v.literal("manager"),
    ),
    assignedTo: v.optional(v.id("users")),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results: { leadId: Id<"leadMaster">; assignedTo: Id<"users"> | null }[] = [];

    for (const leadId of args.leadIds) {
      try {
        const lead = await ctx.db.get(leadId);
        if (!lead) { results.push({ leadId, assignedTo: null }); continue; }

        let toUserId: Id<"users"> | null = null;

        if (args.assignmentType === "manual" && args.assignedTo) {
          toUserId = args.assignedTo;
        } else if (args.assignmentType === "round_robin") {
          const allLeads = await ctx.db.query("leadMaster").collect();
          const activeUsers = await ctx.db.query("users").filter((q) =>
            q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
          ).collect();
          const leadCounts = activeUsers.map((u) => ({
            userId: u._id,
            count: allLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
          }));
          leadCounts.sort((a, b) => a.count - b.count);
          toUserId = leadCounts[0]?.userId || null;
        } else if (args.assignmentType === "manager" && lead.ownerId) {
          const currentOwner = await ctx.db.get(lead.ownerId);
          if (currentOwner?.reportingManagerId) {
            toUserId = currentOwner.reportingManagerId;
          }
        }

        if (!toUserId) { results.push({ leadId, assignedTo: null }); continue; }

        const fromUserId = lead.ownerId || undefined;
        const now = Date.now();

        await ctx.db.patch(leadId, { ownerId: toUserId, updatedAt: now });
        await ctx.db.insert("leadAssignments", {
          leadId, fromUserId, toUserId,
          assignedBy: args.assignedBy,
          createdAt: now,
        });

        const toUser = await ctx.db.get(toUserId);
        await logActivity(ctx, leadId, "assigned",
          `Assigned to ${toUser?.name || toUserId} (bulk)`,
          args.assignedBy,
        );

        results.push({ leadId, assignedTo: toUserId });
      } catch {
        results.push({ leadId, assignedTo: null });
      }
    }

    return results;
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    leadIds: v.array(v.id("leadMaster")),
    newStatus: v.union(v.literal("active"), v.literal("converted"), v.literal("lost"), v.literal("archived")),
    changedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let success = 0;
    let failed = 0;

    for (const leadId of args.leadIds) {
      try {
        // Inline status update for bulk (no per-lead validation)
        const lead = await ctx.db.get(leadId);
        if (!lead || lead.status === "converted") { failed++; continue; }

        const now = Date.now();
        await ctx.db.patch(leadId, { status: args.newStatus, updatedAt: now });

        if (args.newStatus === "lost") {
          await ctx.db.patch(leadId, { stage: "lost" });
        }

        await logActivity(
          ctx, leadId, "bulk_status_changed",
          `Bulk status changed from ${lead.status} to ${args.newStatus}`,
          args.changedBy,
        );
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed, total: args.leadIds.length };
  },
});
