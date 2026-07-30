import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { LEAD_PIPELINE_STAGES, logActivity, createNotification } from "./crmHelpers";
import { paginatedQuery, applyStandardFilters, type PaginatedResponse } from "./queryHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ============================
// LEAD CRUD
// ============================

export const listLeads = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
    stage: v.optional(v.string()), ownerId: v.optional(v.id("users")), priority: v.optional(v.string()),
    source: v.optional(v.string()), branchInterestId: v.optional(v.id("branches")), verticalId: v.optional(v.id("verticals")),
    status: v.optional(v.string()), search: v.optional(v.string()), assignedToMe: v.optional(v.boolean()),
    dateFrom: v.optional(v.number()), dateTo: v.optional(v.number()), myFollowups: v.optional(v.boolean()),
    overdue: v.optional(v.boolean()), followupToday: v.optional(v.boolean()), followupTomorrow: v.optional(v.boolean()),
    followupUpcoming: v.optional(v.boolean()), leadIds: v.optional(v.array(v.id("leadMaster"))),
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    if (args.leadIds && args.leadIds.length > 0) {
      const leads = await Promise.all(args.leadIds.map((id) => ctx.db.get(id)));
      const items = leads.filter(Boolean).sort((a, b) => b!.createdAt - a!.createdAt);
      return { items, nextCursor: null, hasMore: false };
    }

    const now = Date.now(), day = 86400000;

    // Default paginationOpts when not provided (load all for client-side filtering)
    const paginationOpts = args.paginationOpts || { cursor: null as string | null, numItems: 10000 };
    const queryArgs = { ...args, paginationOpts };

    // Build index query based on the most selective filter
    const result = await paginatedQuery<any>(
      ctx,
      "leadMaster",
      queryArgs,
      (q) => {
        // Use most selective index based on primary filter
        if (args.stage) {
          return q.withIndex("by_stage", (iq) => iq.eq("stage", args.stage!));
        }
        if (args.ownerId) {
          return q.withIndex("by_owner", (iq) => iq.eq("ownerId", args.ownerId!));
        }
        if (args.status && args.status !== "archived") {
          return q.withIndex("by_status", (iq) => iq.eq("status", args.status!));
        }
        // Default: order by createdAt descending
        return q.withIndex("createdAt").order("desc");
      },
    );

    // Apply remaining in-memory filters on the already-paginated page
    let filtered = applyStandardFilters(result.items, args, ["firstName", "lastName", "phone", "email", "location", "whatsappUsername"]);

    // Lead-specific in-memory filters
    filtered = filtered.filter((l: any) => l.status !== "archived");
    if (args.priority) filtered = filtered.filter((l: any) => l.priority === args.priority);
    if (args.source) filtered = filtered.filter((l: any) => l.source === args.source);
    if (args.branchInterestId) filtered = filtered.filter((l: any) => l.branchInterestId === args.branchInterestId);
    if (args.verticalId) filtered = filtered.filter((l: any) => l.verticalId === args.verticalId);
    if (args.assignedToMe && args.ownerId) filtered = filtered.filter((l: any) => l.ownerId === args.ownerId);
    if (args.followupToday) filtered = filtered.filter((l: any) => l.nextActionDate && l.nextActionDate >= now && l.nextActionDate <= now + day && l.status === "active");
    if (args.followupTomorrow) filtered = filtered.filter((l: any) => l.nextActionDate && l.nextActionDate >= now + day && l.nextActionDate <= now + 2 * day && l.status === "active");
    if (args.followupUpcoming) filtered = filtered.filter((l: any) => l.nextActionDate && l.nextActionDate > now + 2 * day && l.status === "active");
    if (args.myFollowups && args.ownerId) filtered = filtered.filter((l: any) => l.ownerId === args.ownerId && l.nextActionDate && l.nextActionDate <= now + 3 * day && l.status === "active");
    if (args.overdue && args.ownerId) filtered = filtered.filter((l: any) => l.ownerId === args.ownerId && l.nextActionDate && l.nextActionDate < now && l.status === "active");

    return {
      items: filtered.sort((a: any, b: any) => b.createdAt - a.createdAt),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

export const getLeadById = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.get(args.leadId),
});

// ── DEPRECATED ──
// Direct lead creation bypasses Intake Engine lifecycle.
// New leads should be created via Intake Engine → routeAndCreateLead → leadLifecycle:createFromSubmission
// This mutation is kept for backward compatibility with existing UI.
// It will calculate initial health score after creation.

export const createLead = mutation({
  args: { firstName: v.string(), lastName: v.string(), phone: v.string(), email: v.optional(v.string()), dob: v.optional(v.number()), gender: v.optional(v.string()), location: v.optional(v.string()), verticalId: v.optional(v.id("verticals")), subVerticalId: v.optional(v.id("subVerticals")), boardId: v.optional(v.id("boards")), courseInterest: v.optional(v.string()), branchInterestId: v.optional(v.id("branches")), academicDetails: v.optional(v.string()), stage: v.optional(v.string()), ownerId: v.optional(v.id("users")), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), probability: v.optional(v.number()), expectedRevenue: v.optional(v.number()), expectedJoining: v.optional(v.number()), nextAction: v.optional(v.string()), nextActionDate: v.optional(v.number()), source: v.optional(v.string()), campaign: v.optional(v.string()), utm: v.optional(v.string()), channel: v.optional(v.string()), referralId: v.optional(v.id("users")), tags: v.optional(v.array(v.string())), whatsappUsername: v.optional(v.string()), whatsappPin: v.optional(v.string()), createdBy: v.id("users") },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "lead",
      eventType: Events.CRM.LEAD_CREATED,
      title: "Lead created",
      getUserId: (args) => args.createdBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args) => args.branchInterestId,
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
      const now = Date.now();
      const leadId = await ctx.db.insert("leadMaster", {
        firstName: args.firstName, lastName: args.lastName, phone: args.phone, email: args.email,
        dob: args.dob, gender: args.gender, location: args.location, verticalId: args.verticalId,
        subVerticalId: args.subVerticalId, boardId: args.boardId, courseInterest: args.courseInterest,
        branchInterestId: args.branchInterestId, academicDetails: args.academicDetails, stage: args.stage || "new",
        ownerId: args.ownerId, priority: args.priority || "medium", probability: args.probability,
        expectedRevenue: args.expectedRevenue, expectedJoining: args.expectedJoining,
        nextAction: args.nextAction, nextActionDate: args.nextActionDate, source: args.source,
        campaign: args.campaign, utm: args.utm, channel: args.channel, referralId: args.referralId,
        tags: args.tags, whatsappUsername: args.whatsappUsername, whatsappPin: args.whatsappPin, status: "active", createdBy: args.createdBy, createdAt: now, updatedAt: now,
      });
      await ctx.db.insert("leadStageHistory", { leadId, toStage: args.stage || "new", changedBy: args.createdBy, createdAt: now });
      return leadId;
    },
  ),
});

export const updateLead = mutation({
  args: { leadId: v.id("leadMaster"), firstName: v.optional(v.string()), lastName: v.optional(v.string()), phone: v.optional(v.string()), email: v.optional(v.string()), whatsappUsername: v.optional(v.string()), whatsappPin: v.optional(v.string()), dob: v.optional(v.number()), gender: v.optional(v.string()), location: v.optional(v.string()), verticalId: v.optional(v.id("verticals")), subVerticalId: v.optional(v.id("subVerticals")), boardId: v.optional(v.id("boards")), courseInterest: v.optional(v.string()), branchInterestId: v.optional(v.id("branches")), academicDetails: v.optional(v.string()), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), probability: v.optional(v.number()), expectedRevenue: v.optional(v.number()), expectedJoining: v.optional(v.number()), nextAction: v.optional(v.string()), nextActionDate: v.optional(v.number()), standardAmount: v.optional(v.number()), discountAmount: v.optional(v.number()), waiverAmount: v.optional(v.number()), finalPayable: v.optional(v.number()), status: v.optional(v.union(v.literal("active"), v.literal("converted"), v.literal("lost"), v.literal("archived"))), tags: v.optional(v.array(v.string())), userId: v.id("users") },
  handler: withEventPipeline(
    {
      module: "crm",
      entity: "lead",
      action: "update",
      getEntityId: entityIdFromArg("leadId"),
      getUserId: userIdFromArg("userId"),
      title: "Lead updated",
    },
    async (ctx, args) => {
      const { leadId, userId, ...fields } = args;
      const updates: Record<string, any> = { updatedAt: Date.now() };
      for (const [key, value] of Object.entries(fields)) { if (value !== undefined) updates[key] = value; }
      await ctx.db.patch(leadId, updates);
    },
  ),
});

export const updateLeadStage = mutation({
  args: { leadId: v.id("leadMaster"), stage: v.string(), note: v.optional(v.string()), userId: v.id("users") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    
    // ── Irreversible: Cannot change from converted ──
    if (lead.status === "converted") {
      throw new Error("Cannot change stage of a converted lead. Conversion is irreversible.");
    }
    
    // ── Payment validation: Require at least one verified payment to convert ──
    if (args.stage === "converted") {
      const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
      const verifiedPayments = payments.filter((p) => p.status === "verified");
      if (verifiedPayments.length === 0) {
        throw new Error("Cannot convert lead without at least one verified payment.");
      }
    }
    
    const fromStage = lead.stage;
    const now = Date.now();
    await ctx.db.patch(args.leadId, { stage: args.stage, updatedAt: now });
    if (args.stage === "converted") {
      await ctx.db.patch(args.leadId, { status: "converted" });
      await logActivity(ctx, args.leadId, "stage_changed", `converted by ${(await ctx.db.get(args.userId))?.name}`, args.userId);
      if (lead.ownerId && args.userId !== lead.ownerId) {
        await createNotification(ctx, lead.ownerId, "conversion", "Lead Converted", `${lead.firstName} ${lead.lastName} converted to customer`, args.leadId, "lead");
      }
    } else if (args.stage === "lost") {
      await ctx.db.patch(args.leadId, { status: "lost" });
      await logActivity(ctx, args.leadId, "stage_changed", `marked as lost`, args.userId);
    } else {
      await logActivity(ctx, args.leadId, "stage_changed", `moved to ${LEAD_PIPELINE_STAGES.find((s) => s === args.stage) || args.stage}`, args.userId);
    }
    await ctx.db.insert("leadStageHistory", { leadId: args.leadId, fromStage, toStage: args.stage, changedBy: args.userId, note: args.note, createdAt: now });
  },
});

export const assignLead = mutation({
  args: { leadId: v.id("leadMaster"), toUserId: v.id("users"), note: v.optional(v.string()), userId: v.id("users") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    const toUser = await ctx.db.get(args.toUserId);
    const assigner = await ctx.db.get(args.userId);
    await ctx.db.patch(args.leadId, { ownerId: args.toUserId, updatedAt: Date.now() });
    await ctx.db.insert("leadAssignments", { leadId: args.leadId, fromUserId: lead.ownerId || undefined, toUserId: args.toUserId, assignedBy: args.userId, note: args.note, createdAt: Date.now() });
    await logActivity(ctx, args.leadId, "assigned", `assigned to ${toUser?.name || args.toUserId}`, args.userId);
    await createNotification(ctx, args.toUserId, "lead", "Lead Assigned", `${lead.firstName} ${lead.lastName} assigned to you`, args.leadId, "lead");
  },
});

export const deleteLead = mutation({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const leadId = args.leadId;
    const tables = ["leadStageHistory", "leadAssignments", "leadTasks", "leadNotes", "leadDocuments", "leadActivity", "leadDiscounts", "leadWhatsAppMessages", "leadApprovals", "leadPayments"] as const;
    for (const table of tables) {
      try { const items = await ctx.db.query(table).withIndex("leadId", (q) => q.eq("leadId", leadId)).collect(); for (const item of items) await ctx.db.delete(item._id); } catch (e) {}
    }
    await ctx.db.delete(leadId);
  },
});

// ============================
// BULK OPERATIONS
// ============================

export const bulkAssign = mutation({
  args: { leadIds: v.array(v.id("leadMaster")), toUserId: v.id("users"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const toUser = await ctx.db.get(args.toUserId);
    for (const leadId of args.leadIds) {
      await ctx.db.patch(leadId, { ownerId: args.toUserId, updatedAt: Date.now() });
      await ctx.db.insert("leadAssignments", { leadId, toUserId: args.toUserId, assignedBy: args.userId, createdAt: Date.now() });
      await logActivity(ctx, leadId, "assigned", `assigned to ${toUser?.name || args.toUserId} (bulk)`, args.userId);
    }
  },
});

export const bulkMoveStage = mutation({
  args: { leadIds: v.array(v.id("leadMaster")), stage: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId);
      if (!lead) continue;
      
      // ── Irreversible: Cannot change from converted ──
      if (lead.status === "converted") continue;
      
      // ── Payment validation: Require at least one verified payment to convert ──
      if (args.stage === "converted") {
        const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q) => q.eq("leadId", leadId)).collect();
        const verifiedPayments = payments.filter((p) => p.status === "verified");
        if (verifiedPayments.length === 0) continue;
      }
      
      await ctx.db.patch(leadId, { stage: args.stage, updatedAt: now });
      if (args.stage === "converted") await ctx.db.patch(leadId, { status: "converted" });
      else if (args.stage === "lost") await ctx.db.patch(leadId, { status: "lost" });
      await ctx.db.insert("leadStageHistory", { leadId, fromStage: lead.stage, toStage: args.stage, changedBy: args.userId, createdAt: now });
      await logActivity(ctx, leadId, "stage_changed", `bulk moved to ${args.stage}`, args.userId);
    }
  },
});

export const bulkTag = mutation({
  args: { leadIds: v.array(v.id("leadMaster")), tags: v.array(v.string()), userId: v.id("users") },
  handler: async (ctx, args) => {
    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId);
      if (!lead) continue;
      const merged = [...new Set([...(lead.tags || []), ...args.tags])];
      await ctx.db.patch(leadId, { tags: merged, updatedAt: Date.now() });
    }
  },
});

export const bulkDelete = mutation({
  args: { leadIds: v.array(v.id("leadMaster")), userId: v.id("users") },
  handler: async (ctx, args) => {
    const tables = ["leadStageHistory", "leadAssignments", "leadTasks", "leadNotes", "leadDocuments", "leadActivity", "leadDiscounts", "leadWhatsAppMessages", "leadApprovals", "leadPayments"] as const;
    for (const leadId of args.leadIds) {
      for (const table of tables) {
        try { const items = await ctx.db.query(table).withIndex("leadId", (q) => q.eq("leadId", leadId)).collect(); for (const item of items) await ctx.db.delete(item._id); } catch (e) {}
      }
      await ctx.db.delete(leadId);
    }
  },
});

export const bulkCreateTasks = mutation({
  args: { leadIds: v.array(v.id("leadMaster")), title: v.string(), userId: v.id("users"), dueDate: v.optional(v.number()), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const leadId of args.leadIds) {
      await ctx.db.insert("leadTasks", { leadId, title: args.title, ownerId: args.userId, status: "pending", priority: args.priority || "medium", dueDate: args.dueDate, createdAt: now, updatedAt: now });
      await logActivity(ctx, leadId, "task_created", `task created: ${args.title}`, args.userId);
    }
  },
});

// ============================
// IMPORT
// ============================

export const checkDuplicateLeads = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("leadMaster").collect();
    return all.filter((l) => l.phone === args.phone);
  },
});

export const importLeads = mutation({
  args: { leads: v.array(v.object({ firstName: v.string(), lastName: v.string(), phone: v.string(), email: v.optional(v.string()), location: v.optional(v.string()), source: v.optional(v.string()), stage: v.optional(v.string()), priority: v.optional(v.string()), expectedRevenue: v.optional(v.number()), verticalId: v.optional(v.id("verticals")), branchInterestId: v.optional(v.id("branches")), ownerId: v.optional(v.id("users")), tags: v.optional(v.array(v.string())), nextAction: v.optional(v.string()), nextActionDate: v.optional(v.number()), whatsappUsername: v.optional(v.string()), whatsappPin: v.optional(v.string()) })), createdBy: v.id("users"), duplicateAction: v.union(v.literal("skip"), v.literal("overwrite"), v.literal("create_new")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0, skipped = 0, overwritten = 0;
    const allExisting = await ctx.db.query("leadMaster").collect();
    for (const lead of args.leads) {
      const existing = allExisting.find((l) => l.phone === lead.phone);
      if (existing) {
        if (args.duplicateAction === "skip") { skipped++; continue; }
        if (args.duplicateAction === "overwrite") {
          const updates: Record<string, any> = { updatedAt: now };
          if (lead.email) updates.email = lead.email; if (lead.location) updates.location = lead.location;
          if (lead.source) updates.source = lead.source; if (lead.stage) updates.stage = lead.stage;
          if (lead.priority) updates.priority = lead.priority; if (lead.expectedRevenue !== undefined) updates.expectedRevenue = lead.expectedRevenue;
          if (lead.verticalId) updates.verticalId = lead.verticalId; if (lead.branchInterestId) updates.branchInterestId = lead.branchInterestId;
          if (lead.ownerId) updates.ownerId = lead.ownerId; if (lead.tags) updates.tags = [...new Set([...(existing.tags || []), ...lead.tags])];
          if (lead.nextAction) updates.nextAction = lead.nextAction; if (lead.nextActionDate) updates.nextActionDate = lead.nextActionDate;
          if (lead.whatsappUsername) updates.whatsappUsername = lead.whatsappUsername; if (lead.whatsappPin) updates.whatsappPin = lead.whatsappPin;
          await ctx.db.patch(existing._id, updates);
          await logActivity(ctx, existing._id, "lead_updated", "Updated via import", args.createdBy);
          overwritten++; continue;
        }
      }
      const leadId = await ctx.db.insert("leadMaster", { firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, email: lead.email, location: lead.location, source: lead.source, stage: lead.stage || "new", priority: (lead.priority as any) || "medium", expectedRevenue: lead.expectedRevenue, verticalId: lead.verticalId, branchInterestId: lead.branchInterestId, ownerId: lead.ownerId, tags: lead.tags, nextAction: lead.nextAction, nextActionDate: lead.nextActionDate, whatsappUsername: lead.whatsappUsername, whatsappPin: lead.whatsappPin, status: "active", createdBy: args.createdBy, createdAt: now, updatedAt: now });
      await ctx.db.insert("leadStageHistory", { leadId, toStage: lead.stage || "new", changedBy: args.createdBy, createdAt: now });
      created++;
    }
    return { created, skipped, overwritten, total: args.leads.length };
  },
});

// ============================
// FOLLOWUP ENGINE
// ============================

export const scheduleFollowup = mutation({
  args: { leadId: v.id("leadMaster"), action: v.string(), followupDate: v.number(), followupType: v.optional(v.string()), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), reminder: v.optional(v.boolean()), userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, { nextAction: args.action, nextActionDate: args.followupDate, updatedAt: Date.now() });
    await logActivity(ctx, args.leadId, "followup_scheduled", `followup scheduled: ${args.action} on ${new Date(args.followupDate).toLocaleDateString()}`, args.userId);
    await ctx.db.insert("leadTasks", { leadId: args.leadId, title: args.action, ownerId: args.userId, assignedTo: args.userId, dueDate: args.followupDate, status: "pending", priority: args.priority || "medium", createdAt: Date.now(), updatedAt: Date.now() });
  },
});

export const getFollowups = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const leads = await ctx.db.query("leadMaster").collect();
    const now = Date.now(), day = 86400000;
    const myLeads = leads.filter((l) => l.ownerId === args.userId && l.status === "active" && l.nextActionDate);
    return { today: myLeads.filter((l) => l.nextActionDate! >= now && l.nextActionDate! <= now + day), tomorrow: myLeads.filter((l) => l.nextActionDate! >= now + day && l.nextActionDate! <= now + 2 * day), overdue: myLeads.filter((l) => l.nextActionDate! < now), upcoming: myLeads.filter((l) => l.nextActionDate! > now + 2 * day) };
  },
});
