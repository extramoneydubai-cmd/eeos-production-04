import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, createNotification } from "./crmHelpers";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Queries ───

export const list = query({
  args: {
    ownerId: v.optional(v.id("users")),
    stageId: v.optional(v.id("salesOpportunityStages")),
    leadId: v.optional(v.id("leadMaster")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("opportunities").collect();
    if (args.ownerId) items = items.filter((i) => i.ownerId === args.ownerId);
    if (args.stageId) items = items.filter((i) => i.stageId === args.stageId);
    if (args.leadId) items = items.filter((i) => i.leadId === args.leadId);
    if (args.isActive !== undefined) items = items.filter((i) => i.isActive === args.isActive);
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getByLeadId = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("opportunities").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getStageHistory = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const history = await ctx.db.query("opportunityStageHistory").withIndex("opportunityId", (q) => q.eq("opportunityId", args.opportunityId)).collect();
    return history.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: { token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    ownerId: v.id("users"),
    title: v.string(),
    stageId: v.id("salesOpportunityStages"),
    probability: v.number(),
    expectedRevenue: v.optional(v.number()),
    currency: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "opportunities" }, async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("opportunities", {
      leadId: args.leadId,
      ownerId: args.ownerId,
      title: args.title,
      stageId: args.stageId,
      probability: args.probability,
      expectedRevenue: args.expectedRevenue,
      currency: args.currency,
      expectedCloseDate: args.expectedCloseDate,
      notes: args.notes,
      tags: args.tags,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("opportunityStageHistory", {
      opportunityId: id,
      toStageId: args.stageId,
      changedBy: args.ownerId,
      createdAt: now,
    });
    await logActivity(ctx, args.leadId, "opportunity_created", `Opportunity created: ${args.title}`, args.ownerId);
    return id;
  }),
});

export const update = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    stageId: v.optional(v.id("salesOpportunityStages")),
    probability: v.optional(v.number()),
    expectedRevenue: v.optional(v.number()),
    actualRevenue: v.optional(v.number()),
    currency: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lostReasonId: v.optional(v.id("crmLostReasons")),
    competitiveInfo: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "opportunities" }, async (ctx, args) => {
    const { token: _token, id, userId, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Opportunity not found");
    const now = Date.now();
    const updates: Record<string, any> = { updatedAt: now };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);

    // Track stage changes
    if (fields.stageId && fields.stageId !== existing.stageId) {
      await ctx.db.insert("opportunityStageHistory", {
        opportunityId: id,
        fromStageId: existing.stageId,
        toStageId: fields.stageId,
        changedBy: userId,
        createdAt: now,
      });
      const lead = await ctx.db.get(existing.leadId);
      await logActivity(ctx, existing.leadId, "opportunity_stage_changed", 
        `Opportunity stage changed for ${lead?.firstName || ""} ${lead?.lastName || ""}`, userId);
    }
    return id;
  }),
});

export const remove = mutation({
  args: { token: v.optional(v.string()), id: v.id("opportunities") },
  handler: withScopeAndEvents({ operation: "delete", module: "sales", entity: "opportunities" }, async (ctx, args) => {
    const opp = await ctx.db.get(args.id);
    if (!opp) throw new Error("Opportunity not found");
    // Soft delete
    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
    await logActivity(ctx, opp.leadId, "opportunity_removed", `Opportunity removed`, opp.ownerId);
  }),
});
