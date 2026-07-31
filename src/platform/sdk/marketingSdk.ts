/**
 * Marketing SDK — Enterprise Marketing Automation
 *
 * Every marketing module MUST use this SDK.
 * No module may directly query marketing/campaign tables.
 *
 * Usage:
 *   import { marketingSdk } from "@/platform/sdk/marketingSdk";
 *   const campaigns = await marketingSdk.listCampaigns(ctx, {});
 */

import { v } from "convex/values";
import { mutation, query } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

// ─── Campaigns ───────────────────────────────────────────────

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    campaignType: v.string(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"), v.literal("landing_page"), v.literal("multi_channel")),
    audienceQuery: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      campaignType: args.campaignType,
      channel: args.channel,
      audienceQuery: args.audienceQuery,
      startDate: args.startDate,
      endDate: args.endDate,
      budget: args.budget,
      companyId: args.companyId,
      branchId: args.branchId,
      status: "draft",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCampaignStatus = mutation({
  args: {
    id: v.id("campaigns"),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    return args.id;
  },
});

export const listCampaigns = query({
  args: {
    status: v.optional(v.string()),
    channel: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("campaigns");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.channel) q = q.filter((q2: any) => q2.eq(q2.field("channel"), args.channel));
    if (args.branchId) q = q.filter((q2: any) => q2.eq(q2.field("branchId"), args.branchId));
    return q.order("desc").collect();
  },
});

export const getCampaign = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── Lead Nurturing / Journeys ───────────────────────────────

export const createJourney = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.string(),
    steps: v.array(v.object({
      stepOrder: v.number(),
      actionType: v.string(),
      actionConfig: v.optional(v.string()),
      delayHours: v.optional(v.number()),
      condition: v.optional(v.string()),
    })),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const journeyId = await ctx.db.insert("leadJourneys", {
      name: args.name,
      description: args.description,
      triggerType: args.triggerType,
      status: "active",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    for (const step of args.steps) {
      await ctx.db.insert("journeySteps", {
        journeyId,
        stepOrder: step.stepOrder,
        actionType: step.actionType,
        actionConfig: step.actionConfig,
        delayHours: step.delayHours,
        condition: step.condition,
        createdAt: now,
      });
    }
    return journeyId;
  },
});

export const listJourneys = query({
  handler: async (ctx) => {
    return ctx.db.query("leadJourneys").order("desc").collect();
  },
});

export const getJourney = query({
  args: { id: v.id("leadJourneys") },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.id);
    if (!journey) return null;
    const steps = await ctx.db.query("journeySteps")
      .withIndex("journeyId", (q: any) => q.eq("journeyId", args.id))
      .collect();
    return { ...journey, steps };
  },
});

// ─── Campaign Content / Templates ────────────────────────────

export const createContentTemplate = mutation({
  args: {
    name: v.string(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"), v.literal("landing_page")),
    subject: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("campaignContentTemplates", {
      name: args.name,
      channel: args.channel,
      subject: args.subject,
      body: args.body,
      variables: args.variables,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listContentTemplates = query({
  args: { channel: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("campaignContentTemplates");
    if (args.channel) q = q.filter((q2: any) => q2.eq(q2.field("channel"), args.channel));
    return q.collect();
  },
});

// ─── ROI Dashboard Data ──────────────────────────────────────

export const getCampaignROI = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const leads = await ctx.db.query("leadMaster").collect();
    const campaignLeads = leads.filter((l: any) =>
      l.source === args.campaignId || (l.metadata && l.metadata.campaignId === args.campaignId)
    );

    const totalConversions = campaignLeads.filter((l: any) =>
      l.status === "converted" || l.status === "admitted"
    ).length;

    const totalSpent = campaign.budget || 0;
    const revenueEstimate = totalConversions * 10000; // placeholder estimate

    return {
      campaignName: campaign.name,
      totalLeads: campaignLeads.length,
      totalConversions,
      conversionRate: campaignLeads.length > 0 ? (totalConversions / campaignLeads.length) * 100 : 0,
      totalSpent,
      revenueEstimate,
      roi: totalSpent > 0 ? ((revenueEstimate - totalSpent) / totalSpent) * 100 : 0,
    };
  },
});

// ─── Marketing Dashboard ─────────────────────────────────────

export const getMarketingDashboard = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("campaigns").collect();
    const leads = await ctx.db.query("leadMaster").collect();
    const journeys = await ctx.db.query("leadJourneys").collect();

    const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l: any) => l.status === "converted" || l.status === "admitted").length;
    const totalBudget = campaigns.reduce((s: number, c: any) => s + (c.budget || 0), 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      totalBudget,
      activeJourneys: journeys.filter((j: any) => j.status === "active").length,
    };
  },
});

// ─── Communication Campaigns SDK — wires communicationCampaignEngine ────
// WhatsApp / Email / SMS / Push — launch, delivery tracking, analytics.

/**
 * Create a communication template (email/sms/whatsapp/push).
 */
export const createCommTemplate = mutation({
  args: {
    name: v.string(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"), v.literal("push")),
    subject: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { createCommTemplate } = await import("../../convex/communicationCampaignEngine");
    return createCommTemplate.handler(ctx, args);
  },
});

/**
 * Create a communication campaign against a template + target audience.
 */
export const createCommCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    templateId: v.id("commTemplates"),
    targetAudience: v.union(v.literal("students"), v.literal("parents"), v.literal("employees"), v.literal("faculty"), v.literal("leads"), v.literal("vendors"), v.literal("alumni"), v.literal("all")),
    filters: v.optional(v.string()),
    scheduleDate: v.optional(v.number()),
    batchSize: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { createCampaign } = await import("../../convex/communicationCampaignEngine");
    return createCampaign.handler(ctx, args);
  },
});

/**
 * Launch a communication campaign (resolves recipients from audience).
 */
export const launchCommCampaign = mutation({
  args: { campaignId: v.id("commCampaigns"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const { launchCampaign } = await import("../../convex/communicationCampaignEngine");
    return launchCampaign.handler(ctx, args);
  },
});

/**
 * Track delivery status (sent/delivered/read/failed/clicked) for a queued message.
 */
export const trackDelivery = mutation({
  args: {
    messageId: v.id("communicationQueue"),
    status: v.union(v.literal("sent"), v.literal("delivered"), v.literal("read"), v.literal("failed"), v.literal("clicked")),
    campaignId: v.optional(v.id("commCampaigns")),
  },
  handler: async (ctx, args) => {
    const { trackDelivery } = await import("../../convex/communicationCampaignEngine");
    return trackDelivery.handler(ctx, args);
  },
});

/**
 * List communication campaigns.
 */
export const listCommCampaigns = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { listCampaigns } = await import("../../convex/communicationCampaignEngine");
    return listCampaigns.handler(ctx, args);
  },
});

/**
 * Get communication campaign analytics (delivery funnel).
 */
export const getCommCampaignAnalytics = query({
  args: { campaignId: v.id("commCampaigns") },
  handler: async (ctx, args) => {
    const { getCampaignAnalytics } = await import("../../convex/communicationCampaignEngine");
    return getCampaignAnalytics.handler(ctx, args);
  },
});
