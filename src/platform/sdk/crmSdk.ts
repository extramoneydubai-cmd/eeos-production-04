/**
 * CRM SDK — Enterprise Customer Relationship Management Data Layer
 *
 * Every business module MUST use this SDK to access CRM data.
 * No module may directly query leadMaster, opportunityMaster, etc.
 *
 * Usage:
 *   import { crmSdk } from "@/platform/sdk/crmSdk";
 *   const leads = await crmSdk.list(ctx, { ...filters });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────
export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-cyan-500",
  qualified: "bg-violet-500",
  proposal: "bg-amber-500",
  negotiation: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-rose-500",
  junk: "bg-gray-500",
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  prospecting: "bg-blue-500",
  qualification: "bg-cyan-500",
  needs_analysis: "bg-violet-500",
  value_proposition: "bg-indigo-500",
  decision: "bg-amber-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-emerald-500",
  closed_lost: "bg-rose-500",
};

// ─── SDK Queries ─────────────────────────────────────────────────────────

/**
 * List leads with pagination and filters.
 */
export const listLeads = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    stage: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listLeads } = await import("../../convex/crmLeads");
    return listLeads.handler(ctx, args);
  },
});

/**
 * Get a single lead by ID.
 */
export const getLead = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const { getLeadById } = await import("../../convex/crmLeads");
    return getLeadById.handler(ctx, args);
  },
});

/**
 * Create a new lead.
 */
export const createLead = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    source: v.optional(v.string()),
    status: v.optional(v.string()),
    stage: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    assignedTo: v.optional(v.id("users")),
    courseId: v.optional(v.id("courses")),
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    qualification: v.optional(v.string()),
    occupation: v.optional(v.string()),
    reference: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createLead } = await import("../../convex/crmLeads");
    return createLead.handler(ctx, args as any);
  },
});

/**
 * Update a lead.
 */
export const updateLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      source: v.optional(v.string()),
      status: v.optional(v.string()),
      assignedTo: v.optional(v.id("users")),
      courseId: v.optional(v.id("courses")),
      notes: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      pincode: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { updateLead } = await import("../../convex/crmLeads");
    return updateLead.handler(ctx, args as any);
  },
});

/**
 * Update lead stage.
 */
export const updateLeadStage = mutation({
  args: {
    leadId: v.id("leadMaster"),
    stage: v.string(),
    performedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { updateLeadStage } = await import("../../convex/crmLeads");
    return updateLeadStage.handler(ctx, args);
  },
});

/**
 * Assign lead to a user.
 */
export const assignLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { assignLead } = await import("../../convex/crmLeads");
    return assignLead.handler(ctx, args);
  },
});

/**
 * Delete a lead.
 */
export const deleteLead = mutation({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const { deleteLead } = await import("../../convex/crmLeads");
    return deleteLead.handler(ctx, args);
  },
});

/**
 * Check for duplicate leads.
 */
export const checkDuplicates = query({
  args: { phone: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { checkDuplicateLeads } = await import("../../convex/crmLeads");
    return checkDuplicateLeads.handler(ctx, args);
  },
});

/**
 * Get lead activity timeline.
 */
export const getLeadActivity = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const { getLeadActivity } = await import("../../convex/crmActivity");
    return getLeadActivity.handler(ctx, args);
  },
});

/**
 * Get lead stage history.
 */
export const getLeadStageHistory = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const { getLeadStageHistory } = await import("../../convex/crmActivity");
    return getLeadStageHistory.handler(ctx, args);
  },
});

/**
 * Get sales performance dashboard data.
 */
export const getSalesDashboard = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getSalesPerformanceDashboard } = await import("../../convex/crmSales");
    return getSalesPerformanceDashboard.handler(ctx, args);
  },
});

/**
 * Get lead tasks.
 */
export const getLeadTasks = query({
  args: {
    leadId: v.id("leadMaster"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { getLeadTasks } = await import("../../convex/crmTasks");
    return getLeadTasks.handler(ctx, args);
  },
});

/**
 * Get conversion pipeline for a lead.
 */
export const getConversionPipeline = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const { getConversionPipeline } = await import("../../convex/leadConversionEngine");
    return getConversionPipeline.handler(ctx, args);
  },
});

/**
 * Get conversion analytics.
 */
export const getConversionAnalytics = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { getConversionAnalytics } = await import("../../convex/leadConversionEngine");
    return getConversionAnalytics.handler(ctx, args);
  },
});

/**
 * List sales opportunities.
 */
export const listOpportunities = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listOpportunities } = await import("../../convex/opportunities");
    return listOpportunities.handler(ctx, args);
  },
});

/**
 * Schedule a follow-up for a lead.
 */
export const scheduleFollowup = mutation({
  args: {
    leadId: v.id("leadMaster"),
    scheduledAt: v.number(),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { scheduleFollowup } = await import("../../convex/crmLeads");
    return scheduleFollowup.handler(ctx, args as any);
  },
});

/**
 * Get follow-ups for a lead.
 */
export const getFollowups = query({
  args: {
    leadId: v.id("leadMaster"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { getFollowups } = await import("../../convex/crmLeads");
    return getFollowups.handler(ctx, args);
  },
});
