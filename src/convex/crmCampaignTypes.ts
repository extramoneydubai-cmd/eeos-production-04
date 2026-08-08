import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_TYPES = [
  { name: "Admission", code: "ADM", campaignCategory: "Enrollment", color: "#4285f4", icon: "GraduationCap", description: "Campaigns targeting new student admissions", sequence: 1 },
  { name: "Brand Awareness", code: "BRAND", campaignCategory: "Awareness", color: "#a855f7", icon: "Megaphone", description: "Campaigns to build brand recognition and visibility", sequence: 2 },
  { name: "Scholarship", code: "SCHOLAR", campaignCategory: "Enrollment", color: "#34a853", icon: "Award", description: "Campaigns promoting scholarship opportunities", sequence: 3 },
  { name: "Workshop", code: "WSHOP", campaignCategory: "Educational", color: "#e8710a", icon: "Wrench", description: "Campaigns promoting skill-building workshops", sequence: 4 },
  { name: "Seminar", code: "SEM", campaignCategory: "Educational", color: "#1a73e8", icon: "Presentation", description: "Campaigns promoting educational seminars", sequence: 5 },
  { name: "Webinar", code: "WEBINAR", campaignCategory: "Educational", color: "#4f46e5", icon: "Monitor", description: "Campaigns promoting online webinar sessions", sequence: 6 },
  { name: "Open House", code: "OPEN", campaignCategory: "Event", color: "#0d9488", icon: "DoorOpen", description: "Campaigns promoting campus open house events", sequence: 7 },
  { name: "Referral", code: "REF", campaignCategory: "Referral", color: "#d4a017", icon: "UserPlus", description: "Campaigns encouraging student and partner referrals", sequence: 8 },
  { name: "Festival Offer", code: "FEST", campaignCategory: "Promotional", color: "#ea4335", icon: "Sparkles", description: "Campaigns promoting festival-season discounts", sequence: 9 },
  { name: "Early Bird", code: "EARLY", campaignCategory: "Promotional", color: "#fbbc04", icon: "Bird", description: "Campaigns offering early enrollment discounts", sequence: 10 },
  { name: "Corporate Training", code: "CORP", campaignCategory: "Corporate", color: "#5f6368", icon: "Building", description: "Campaigns targeting corporate training programs", sequence: 11 },
  { name: "Seasonal", code: "SEASON", campaignCategory: "Promotional", color: "#e91e63", icon: "Calendar", description: "Campaigns aligned with seasonal academic cycles", sequence: 12 },
  { name: "Lead Generation", code: "LG", campaignCategory: "Awareness", color: "#00bcd4", icon: "Target", description: "Campaigns focused on generating new leads", sequence: 13 },
  { name: "Retention", code: "RET", campaignCategory: "Retention", color: "#34a853", icon: "HeartHandshake", description: "Campaigns focused on student retention and engagement", sequence: 14 },
  { name: "Remarketing", code: "RMKT", campaignCategory: "Retention", color: "#ff5722", icon: "RefreshCw", description: "Campaigns re-engaging past leads and inactive students", sequence: 15 },
];

export const listCampaignTypes = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("crmCampaignTypes").collect();
    return types.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getCampaignType = query({
  args: { campaignTypeId: v.id("crmCampaignTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignTypeId);
  },
});

export const createCampaignType = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    campaignCategory: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCampaignTypes" }, async (ctx, args) => {
    const all = await ctx.db.query("crmCampaignTypes").collect();
    const maxSeq = all.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmCampaignTypes", {
      name: args.name,
      code: args.code,
      campaignCategory: args.campaignCategory,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateCampaignType = mutation({
  args: { token: v.optional(v.string()),
    campaignTypeId: v.id("crmCampaignTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    campaignCategory: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCampaignTypes" }, async (ctx, args) => {
    const { token: _token, campaignTypeId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(campaignTypeId, updates);
  }),
});

export const deleteCampaignType = mutation({
  args: { token: v.optional(v.string()), campaignTypeId: v.id("crmCampaignTypes") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmCampaignTypes" }, async (ctx, args) => {
    await ctx.db.delete(args.campaignTypeId);
  }),
});

export const duplicateCampaignType = mutation({
  args: { token: v.optional(v.string()), campaignTypeId: v.id("crmCampaignTypes") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCampaignTypes" }, async (ctx, args) => {
    const original = await ctx.db.get(args.campaignTypeId);
    if (!original) throw new Error("Campaign type not found");
    const all = await ctx.db.query("crmCampaignTypes").collect();
    const maxSeq = all.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmCampaignTypes", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      campaignCategory: original.campaignCategory,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderCampaignTypes = mutation({
  args: { token: v.optional(v.string()),
    campaignTypeIds: v.array(v.id("crmCampaignTypes")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCampaignTypes" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.campaignTypeIds.length; i++) {
      await ctx.db.patch(args.campaignTypeIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultTypes = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCampaignTypes" }, async (ctx) => {
    const existing = await ctx.db.query("crmCampaignTypes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Campaign types already exist" };

    const now = Date.now();
    for (const type of DEFAULT_TYPES) {
      await ctx.db.insert("crmCampaignTypes", {
        ...type,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_TYPES.length, message: "Default campaign types created" };
  }),
});
