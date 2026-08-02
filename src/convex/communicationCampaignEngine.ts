/**
 * Communication Campaign Engine — Targeted Email/SMS/WhatsApp Campaigns
 *
 * Manages campaign targeting, scheduling, delivery tracking, and analytics.
 * Integrates with existing communicationSdk and communicationQueue.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Campaign Templates ─────────────────────────────────────

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
    return ctx.db.insert("commTemplates", {
      name: args.name,
      channel: args.channel,
      subject: args.subject,
      body: args.body,
      variables: args.variables || [],
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ─── Campaign Execution ─────────────────────────────────────

export const createCampaign = mutation({
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
    const campaignId = await ctx.db.insert("commCampaigns", {
      name: args.name,
      description: args.description,
      templateId: args.templateId,
      targetAudience: args.targetAudience,
      filters: args.filters,
      scheduleDate: args.scheduleDate,
      batchSize: args.batchSize || 100,
      status: args.scheduleDate ? "scheduled" : "draft",
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      openedCount: 0,
      clickedCount: 0,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (args.scheduleDate) {
      // Legacy campaignSchedules.campaignId references messageCampaigns; keep cast for compatibility.
      await ctx.db.insert("campaignSchedules", {
        campaignId: campaignId as any,
        scheduledAt: args.scheduleDate,
        status: "pending",
        createdAt: Date.now(),
      });
    }

    return campaignId;
  },
});

export const launchCampaign = mutation({
  args: { campaignId: v.id("commCampaigns"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const template = await ctx.db.get(campaign.templateId);
    if (!template) throw new Error("Template not found");

    // Resolve recipients based on audience
    let recipients: Array<{ targetId: string; address: string; name: string }> = [];

    switch (campaign.targetAudience) {
      case "students": {
        const students = await ctx.db.query("studentMaster").collect();
        recipients = students.map((s: any) => ({
          targetId: s._id,
          address: s.email || s.phone || "",
          name: `${s.firstName} ${s.lastName}`,
        }));
        break;
      }
      case "employees": {
        const users = await ctx.db.query("users").collect();
        recipients = users.map((u: any) => ({
          targetId: u._id,
          address: u.email || "",
          name: u.name || u.email || "",
        }));
        break;
      }
      case "leads": {
        const leads = await ctx.db.query("leadMaster").collect();
        recipients = leads.map((l: any) => ({
          targetId: l._id,
          address: l.email || l.phone || "",
          name: `${l.firstName || ""} ${l.lastName || ""}`.trim() || "Lead",
        }));
        break;
      }
      case "alumni": {
        const alumni = await ctx.db.query("alumniRecords").collect();
        recipients = alumni.map((a: any) => ({
          targetId: a._id,
          address: a.email || a.phone || "",
          name: "Alumni",
        }));
        break;
      }
      default: {
        const users = await ctx.db.query("users").collect();
        recipients = users.map((u: any) => ({
          targetId: u._id,
          address: u.email || "",
          name: u.name || "",
        }));
      }
    }

    // Queue communications
    const channel = (template as any).channel;
    const batchSize = campaign.batchSize || 100;
    const batches: Array<Array<{ targetId: string; address: string; name: string }>> = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    let queued = 0;
    for (const batch of batches) {
      for (const recipient of batch) {
        if (!recipient.address) continue;
        await ctx.db.insert("communicationQueue", {
          channel,
          recipientAddress: recipient.address,
          recipientName: recipient.name,
          campaignId: args.campaignId as any,
          templateId: campaign.templateId,
          subject: (template as any).subject || "",
          body: (template as any).body || "",
          status: "queued",
          priority: "normal",
          scheduledAt: Date.now(),
          retryCount: 0,
          maxRetries: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        queued++;
      }
    }

    await ctx.db.patch(args.campaignId, {
      status: "active",
      totalRecipients: recipients.length,
      sentCount: queued,
      launchedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { campaignId: args.campaignId, totalRecipients: recipients.length, queued };
  },
});

export const trackDelivery = mutation({
  args: {
    messageId: v.id("communicationQueue"),
    status: v.union(v.literal("sent"), v.literal("delivered"), v.literal("read"), v.literal("failed"), v.literal("clicked")),
    campaignId: v.optional(v.id("commCampaigns")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { status: args.status as any, updatedAt: Date.now() });

    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (campaign) {
        const updates: Record<string, any> = { updatedAt: Date.now() };
        if (args.status === "delivered") updates.deliveredCount = (campaign.deliveredCount || 0) + 1;
        if (args.status === "read") updates.openedCount = (campaign.openedCount || 0) + 1;
        if (args.status === "clicked") updates.clickedCount = (campaign.clickedCount || 0) + 1;
        if (args.status === "failed") updates.failedCount = (campaign.failedCount || 0) + 1;
        await ctx.db.patch(args.campaignId, updates);
      }
    }
    return args.messageId;
  },
});

export const listCampaigns = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("commCampaigns");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    return q.order("desc").collect();
  },
});

export const getCampaignAnalytics = query({
  args: { campaignId: v.id("commCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const total = campaign.totalRecipients || 0;
    return {
      name: campaign.name,
      status: campaign.status,
      totalRecipients: total,
      sent: campaign.sentCount || 0,
      delivered: campaign.deliveredCount || 0,
      failed: campaign.failedCount || 0,
      opened: campaign.openedCount || 0,
      clicked: campaign.clickedCount || 0,
      deliveryRate: total > 0 ? Math.round(((campaign.deliveredCount || 0) / total) * 100) : 0,
      openRate: campaign.deliveredCount > 0 ? Math.round(((campaign.openedCount || 0) / campaign.deliveredCount) * 100) : 0,
      clickRate: campaign.openedCount > 0 ? Math.round(((campaign.clickedCount || 0) / campaign.openedCount) * 100) : 0,
    };
  },
});

/** Change a campaign's lifecycle status (draft → active → paused …). */
export const updateCampaignStatus = mutation({
  args: {
    id: v.id("commCampaigns"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.id);
    if (!campaign) throw new Error("Campaign not found");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    return args.id;
  },
});

/** KPI dashboard for marketing analytics. */
export const getMarketingDashboard = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("commCampaigns").collect();
    const leads = await ctx.db.query("leadMaster").collect();
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l: any) => l.status === "converted").length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalBudget = campaigns.reduce((sum: number, c: any) => sum + (Number(c.budget) || 0), 0);
    const activeJourneys = campaigns.filter((c: any) => c.status === "active" && c.journeyId).length;
    return {
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      convertedLeads,
      conversionRate,
      totalBudget,
      activeJourneys,
    };
  },
});
