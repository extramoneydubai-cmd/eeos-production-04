import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { logActivity, createNotification } from "./crmHelpers";

/* ────────────
   INTERNAL HELPERS
   ──────────── */

async function createTimelineEvent(
  ctx: any,
  args: {
    leadId: Id<"leadMaster">;
    eventType: string;
    title: string;
    description?: string;
    metadata?: string;
    performedBy?: Id<"users">;
  },
) {
  const now = Date.now();
  return // @ts-expect-error
      ctx.db.insert("leadTimeline", {
    leadId: args.leadId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    performedBy: args.performedBy,
    performedAt: now,
    createdAt: now,
  });
}

async function recordAssignment(
  ctx: any,
  leadId: Id<"leadMaster">,
  fromUserId: Id<"users"> | undefined,
  toUserId: Id<"users">,
  assignedBy: Id<"users">,
  assignmentType: string,
  note?: string,
) {
  const now = Date.now();
  const lead = await ctx.db.get(leadId);

  // Update lead owner
  await ctx.db.patch(leadId, { ownerId: toUserId, updatedAt: now });

  // Create assignment history record
  const assignmentId = await ctx.db.insert("leadAssignments", {
    leadId,
    fromUserId: fromUserId,
    toUserId,
    assignedBy,
    note: note || `Assigned via ${assignmentType}`,
    createdAt: now,
  });

  // Timeline event
  const toUser = await ctx.db.get(toUserId);
  await createTimelineEvent(ctx, {
    leadId,
    eventType: "LeadAssigned",
    title: `Lead assigned to ${toUser?.name || toUserId}`,
    description: `Assignment type: ${assignmentType}`,
    metadata: JSON.stringify({ assignmentId, fromUserId, toUserId, type: assignmentType }),
    performedBy: assignedBy,
  });

  // Legacy activity
  await logActivity(ctx, leadId, "assigned", `assigned to ${toUser?.name || toUserId} via ${assignmentType}`, assignedBy);

  // Notify assignee
  await createNotification(
    ctx, toUserId, "lead", "Lead Assigned",
    `${lead?.firstName || ""} ${lead?.lastName || ""} assigned to you`,
    leadId, "lead",
  );

  return assignmentId;
}

/* ────────────
   ASSIGN LEAD (Manual)
   ──────────── */

export const assignLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    toUserId: v.id("users"),
    assignedBy: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const fromUserId = lead.ownerId || undefined;
    return recordAssignment(ctx, args.leadId, fromUserId, args.toUserId, args.assignedBy, "manual", args.note);
  },
});

/* ────────────
   REASSIGN LEAD
   ──────────── */

export const reassignLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    toUserId: v.id("users"),
    assignedBy: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.ownerId === args.toUserId) throw new Error("Lead is already assigned to this user");

    return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, args.toUserId, args.assignedBy, "reassign", args.reason);
  },
});

/* ────────────
   ROUND ROBIN ASSIGN
   ──────────── */

export const roundRobinAssign = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedBy: v.id("users"),
    teamId: v.optional(v.id("teams")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    // Find users in scope (team or branch or all active counselors)
    let candidateUsers = await ctx.db.query("users").filter((q) =>
      q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
    ).collect();

    // Filter by team
    if (args.teamId) {
      candidateUsers = candidateUsers.filter((u) => u.teamIds?.includes(args.teamId!));
    }

    // Filter by branch
    if (args.branchId) {
      candidateUsers = candidateUsers.filter((u) => u.branchId === args.branchId);
    }

    if (candidateUsers.length === 0) throw new Error("No eligible users found for assignment");

    // Calculate workload (active lead count per user)
    const allLeads = await ctx.db.query("leadMaster").collect();
    const workload = candidateUsers.map((u) => ({
      userId: u._id,
      count: allLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
    }));

    // Sort by workload ascending (least loaded first)
    workload.sort((a, b) => a.count - b.count);
    const toUserId = workload[0].userId;

    return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, toUserId, args.assignedBy, "round_robin");
  },
});

/* ────────────
   SKILL-BASED ASSIGN
   ──────────── */

export const skillBasedAssign = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    // Find assignment rules matching lead properties
    const rules = await ctx.db
      .query("assignmentRules")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect();

    let matchedUser: Id<"users"> | null = null;

    for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
      const conditions = JSON.parse(rule.conditions || "{}");

      // Check each condition against lead
      let allMatch = true;
      for (const [field, value] of Object.entries(conditions)) {
        const leadValue = (lead as any)[field];
        if (Array.isArray(value)) {
          if (!value.includes(leadValue)) { allMatch = false; break; }
        } else if (leadValue !== value) {
          allMatch = false;
          break;
        }
      }

      if (!allMatch) continue;

      // Determine assignee based on rule
      if (rule.assignmentType === "manual" && rule.assignToEntityId) {
        matchedUser = rule.assignToEntityId as any;
        break;
      } else if (rule.assignmentType === "branch_based" && lead.branchInterestId) {
        // Find user in same branch
        const branchUsers = await ctx.db.query("users").filter((q) =>
          q.and(
            q.eq(q.field("branchId"), lead.branchInterestId!),
            q.neq(q.field("isDisabled"), true),
          )
        ).collect();
        if (branchUsers.length > 0) {
          matchedUser = branchUsers[0]._id;
          break;
        }
      } else if (rule.assignmentType === "vertical_based" && lead.verticalId) {
        // Find user with matching vertical (via userScopes)
        const scopeUsers = await ctx.db.query("users").filter((q) =>
          q.and(
            q.neq(q.field("role"), undefined),
            q.neq(q.field("isDisabled"), true),
          )
        ).collect();
        if (scopeUsers.length > 0) {
          matchedUser = scopeUsers[0]._id;
          break;
        }
      }
    }

    if (!matchedUser) {
      // Fallback to round robin
      const allUsers = await ctx.db.query("users").filter((q) =>
        q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
      ).collect();
      if (allUsers.length === 0) throw new Error("No eligible users found");

      const allLeads = await ctx.db.query("leadMaster").collect();
      const workload = allUsers.map((u) => ({
        userId: u._id,
        count: allLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
      }));
      workload.sort((a, b) => a.count - b.count);
      matchedUser = workload[0].userId;
    }

    return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, matchedUser, args.assignedBy, "skill_based");
  },
});

/* ────────────
   BRANCH-BASED ASSIGN
   ──────────── */

export const branchBasedAssign = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedBy: v.id("users"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const targetBranch = args.branchId || lead.branchInterestId;
    if (!targetBranch) throw new Error("No branch specified and lead has no branch interest");

    const branchUsers = await ctx.db.query("users").filter((q) =>
      q.and(
        q.eq(q.field("branchId"), targetBranch),
        q.neq(q.field("isDisabled"), true),
      )
    ).collect();

    if (branchUsers.length === 0) throw new Error(`No active users found in branch ${targetBranch}`);

    const allLeads = await ctx.db.query("leadMaster").collect();
    const workload = branchUsers.map((u) => ({
      userId: u._id,
      count: allLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
    }));
    workload.sort((a, b) => a.count - b.count);

    return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, workload[0].userId, args.assignedBy, "branch_based");
  },
});

/* ────────────
   VERTICAL-BASED ASSIGN
   ──────────── */

export const verticalBasedAssign = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedBy: v.id("users"),
    verticalId: v.optional(v.id("verticals")),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const targetVertical = args.verticalId || lead.verticalId;
    if (!targetVertical) throw new Error("No vertical specified and lead has no vertical");

    // Find users whose scopes include this vertical
    const allUsers = await ctx.db.query("users").filter((q) =>
      q.and(
        q.neq(q.field("role"), undefined),
        q.neq(q.field("isDisabled"), true),
        q.eq(q.field("verticalId"), targetVertical),
      )
    ).collect();

    if (allUsers.length === 0) throw new Error(`No users found for vertical ${targetVertical}`);

    const allLeads = await ctx.db.query("leadMaster").collect();
    const workload = allUsers.map((u) => ({
      userId: u._id,
      count: allLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
    }));
    workload.sort((a, b) => a.count - b.count);

    return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, workload[0].userId, args.assignedBy, "vertical_based");
  },
});

/* ────────────
   MANAGER ASSIGN
   ──────────── */

export const managerAssign = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    if (!lead.ownerId) throw new Error("Lead has no current owner to find manager for");

    const currentOwner = await ctx.db.get(lead.ownerId);
    if (!currentOwner?.reportingManagerId) throw new Error("Current owner has no reporting manager");

    return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, currentOwner.reportingManagerId, args.assignedBy, "manager");
  },
});

/* ────────────
   AUTO-ASSIGN LEAD (Rule Engine)
   Evaluates all active assignment rules and assigns the best match
   ──────────── */

export const autoAssignLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const rules = await ctx.db
      .query("assignmentRules")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();

    if (rules.length === 0) {
      // No rules configured — assign to createdBy or first available user
      const users = await ctx.db.query("users").filter((q) =>
        q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
      ).collect();
      if (users.length > 0) {
        const fallbackUser = args.assignedBy || lead.createdBy;
        if (fallbackUser && lead.ownerId !== fallbackUser) {
          return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, fallbackUser, args.assignedBy || lead.createdBy, "auto_assign", "Fallback: assign to creator");
        }
      }
      return { assignedTo: null };
    }

    // Evaluate rules in priority order
    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions || "{}");
      let allMatch = true;

      for (const [field, value] of Object.entries(conditions)) {
        const leadValue = (lead as any)[field];
        if (Array.isArray(value)) {
          if (!value.includes(leadValue)) { allMatch = false; break; }
        } else if (leadValue !== value) {
          allMatch = false;
          break;
        }
      }

      if (!allMatch) continue;

      // Execute the matching rule
      switch (rule.assignmentType) {
        case "manual":
          if (rule.assignToEntityId) {
            return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, rule.assignToEntityId as any, args.assignedBy || lead.createdBy, "auto_assign_rule", rule.name);
          }
          break;
        case "round_robin":
          // Inline round robin
          {
            const rrUsers = await ctx.db.query("users").filter((q) =>
              q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
            ).collect();
            if (rrUsers.length > 0 && lead.ownerId !== rrUsers[0]._id) {
              const rrLeads = await ctx.db.query("leadMaster").collect();
              const rrWorkload = rrUsers.map((u) => ({
                id: u._id,
                count: rrLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
              }));
              rrWorkload.sort((a, b) => a.count - b.count);
              return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, rrWorkload[0].id, args.assignedBy || lead.createdBy, "auto_assign_rule", rule.name);
            }
          }
          continue;
        case "branch_based":
          // Inline branch based
          if (lead.branchInterestId) {
            const bbUsers = await ctx.db.query("users").filter((q) =>
              q.and(q.eq(q.field("branchId"), lead.branchInterestId!), q.neq(q.field("isDisabled"), true))
            ).collect();
            if (bbUsers.length > 0) {
              const bbLeads = await ctx.db.query("leadMaster").collect();
              const bbWorkload = bbUsers.map((u) => ({
                id: u._id,
                count: bbLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
              }));
              bbWorkload.sort((a, b) => a.count - b.count);
              return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, bbWorkload[0].id, args.assignedBy || lead.createdBy, "auto_assign_rule", rule.name);
            }
          }
          continue;
        case "vertical_based":
          // Inline vertical based
          if (lead.verticalId) {
            const vUsers = await ctx.db.query("users").filter((q) =>
              q.and(q.eq(q.field("verticalId"), lead.verticalId!), q.neq(q.field("isDisabled"), true))
            ).collect();
            if (vUsers.length > 0) {
              const vLeads = await ctx.db.query("leadMaster").collect();
              const vWorkload = vUsers.map((u) => ({
                id: u._id,
                count: vLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
              }));
              vWorkload.sort((a, b) => a.count - b.count);
              return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, vWorkload[0].id, args.assignedBy || lead.createdBy, "auto_assign_rule", rule.name);
            }
          }
          continue;
        case "manager":
          // Inline manager assign
          if (lead.ownerId) {
            const mgrOwner = await ctx.db.get(lead.ownerId);
            if (mgrOwner?.reportingManagerId) {
              return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, mgrOwner.reportingManagerId, args.assignedBy || lead.createdBy, "auto_assign_rule", rule.name);
            }
          }
          continue;
        default:
          continue;
      }
    }

    // No rule matched — inlined round robin fallback
    const fallbackUsers = await ctx.db.query("users").filter((q) =>
      q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
    ).collect();
    if (fallbackUsers.length > 0) {
      const fbAllLeads = await ctx.db.query("leadMaster").collect();
      const fbWorkload = fallbackUsers.map((u) => ({
        userId: u._id as Id<"users">,
        count: fbAllLeads.filter((l) => l.ownerId === u._id && l.status === "active").length,
      }));
      fbWorkload.sort((a, b) => a.count - b.count);
      return recordAssignment(ctx, args.leadId, lead.ownerId || undefined, fbWorkload[0].userId, args.assignedBy || lead.createdBy, "auto_assign_round_robin");
    }
    return { assignedTo: null };
  },
});

/* ────────────
   WORKLOAD CALCULATION
   ──────────── */

export const calculateWorkload = mutation({
  args: {
    userId: v.optional(v.id("users")),
    calculatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.userId) {
      // Calculate workload for specific user
      const allLeads = await ctx.db.query("leadMaster").collect();
      const userLeads = allLeads.filter((l) => l.ownerId === args.userId);
      const activeLeads = userLeads.filter((l) => l.status === "active");

      const userTasks = await ctx.db.query("leadTasks").filter((q) =>
        q.and(
          q.eq(q.field("ownerId"), args.userId!),
          q.neq(q.field("status"), "completed"),
        )
      ).collect();

      const overdueCount = userTasks.filter((t) => t.dueDate && t.dueDate < now).length;

      await ctx.db.insert("counselorWorkloads", {
        userId: args.userId,
        leadCount: userLeads.length,
        activeLeadCount: activeLeads.length,
        pendingTaskCount: userTasks.length,
        overdueCount,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        calculatedAt: now,
        createdAt: now,
      });

      return { userId: args.userId, leadCount: userLeads.length, activeLeadCount: activeLeads.length, pendingTaskCount: userTasks.length, overdueCount };
    }

    // Calculate for all counselors
    const allLeads = await ctx.db.query("leadMaster").collect();
    const activeUsers = await ctx.db.query("users").filter((q) =>
      q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
    ).collect();

    const period = new Date().toISOString().slice(0, 7);
    const results = [];

    for (const user of activeUsers) {
      const userLeads = allLeads.filter((l) => l.ownerId === user._id);
      const activeLeads = userLeads.filter((l) => l.status === "active");

      const userTasks = await ctx.db.query("leadTasks").filter((q) =>
        q.and(
          q.eq(q.field("ownerId"), user._id),
          q.neq(q.field("status"), "completed"),
        )
      ).collect();

      const overdueCount = userTasks.filter((t) => t.dueDate && t.dueDate < now).length;

      await ctx.db.insert("counselorWorkloads", {
        userId: user._id,
        leadCount: userLeads.length,
        activeLeadCount: activeLeads.length,
        pendingTaskCount: userTasks.length,
        overdueCount,
        period,
        calculatedAt: now,
        createdAt: now,
      });

      results.push({ userId: user._id, leadCount: userLeads.length, activeLeadCount: activeLeads.length, pendingTaskCount: userTasks.length, overdueCount });
    }

    return results;
  },
});

/* ────────────
   ASSIGNMENT RULES CRUD
   ──────────── */

export const listAssignmentRules = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("assignmentRules");
    if (args.isActive !== undefined) {
      q = q.filter((r: any) => r.eq(r.field("isActive"), args.isActive!));
    }
    return q.order("asc").collect();
  },
});

export const createAssignmentRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    conditions: v.string(),
    assignmentType: v.union(
      v.literal("manual"), v.literal("round_robin"),
      v.literal("skill_based"), v.literal("branch_based"),
      v.literal("vertical_based"), v.literal("manager"),
      v.literal("team"), v.literal("load_balanced"),
    ),
    assignToEntityId: v.optional(v.string()),
    assignToRole: v.optional(v.string()),
    scopeType: v.optional(v.string()),
    scopeId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("assignmentRules").collect();
    const maxPriority = existing.reduce((m, r) => Math.max(m, r.priority), 0);

    return ctx.db.insert("assignmentRules", {
      ...args,
      isActive: true,
      priority: maxPriority + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateAssignmentRule = mutation({
  args: {
    ruleId: v.id("assignmentRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(v.string()),
    assignmentType: v.optional(v.union(
      v.literal("manual"), v.literal("round_robin"),
      v.literal("skill_based"), v.literal("branch_based"),
      v.literal("vertical_based"), v.literal("manager"),
      v.literal("team"), v.literal("load_balanced"),
    )),
    assignToEntityId: v.optional(v.string()),
    assignToRole: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { ruleId, ...fields } = args;
    const existing = await ctx.db.get(ruleId);
    if (!existing) throw new Error("Assignment rule not found");
    return ctx.db.patch(ruleId, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteAssignmentRule = mutation({
  args: { ruleId: v.id("assignmentRules") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new Error("Assignment rule not found");
    await ctx.db.delete(args.ruleId);
  },
});

/* ────────────
   WORKLOAD QUERIES
   ──────────── */

export const getCounselorWorkloads = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const period = args.period || new Date().toISOString().slice(0, 7);
    return ctx.db
      .query("counselorWorkloads")
      .withIndex("period", (q) => q.eq("period", period))
      .order("desc")
      .take(50);
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leadMaster").collect();
    const now = Date.now();

    const assignedLeads = allLeads.filter((l) => l.ownerId && l.status === "active").length;
    const unassignedLeads = allLeads.filter((l) => !l.ownerId && l.status === "active").length;

    // SLA violations today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const violationsToday = await ctx.db
      .query("slaViolations")
      .withIndex("violatedAt", (q) => q.gte("violatedAt", todayStart.getTime()))
      .collect();

    // SLA due today (active SLAs with deadline today)
    const allSlaViolations = await ctx.db.query("slaViolations").collect();
    const openViolations = allSlaViolations.filter((v) => v.status === "open").length;
    const resolvedViolations = allSlaViolations.filter((v) => v.status === "resolved").length;

    return {
      assignedLeads,
      unassignedLeads,
      slaViolationsToday: violationsToday.length,
      openSlaViolations: openViolations,
      resolvedSlaViolations: resolvedViolations,
      totalLeads: allLeads.length,
      activeLeads: allLeads.filter((l) => l.status === "active").length,
    };
  },
});
