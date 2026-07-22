import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_CAMPAIGNS = [
  { name: "Admission 2026", code: "ADM2026", campaignTypeCode: "ADM", color: "#4285f4", icon: "GraduationCap", description: "Main admission campaign for academic year 2026" },
  { name: "Scholarship 2026", code: "SCHOLAR2026", campaignTypeCode: "SCHOLAR", color: "#34a853", icon: "Award", description: "Scholarship campaign for academic year 2026" },
  { name: "Summer Workshop", code: "SUMMER_WS", campaignTypeCode: "WSHOP", color: "#e8710a", icon: "Wrench", description: "Summer skills workshop campaign" },
  { name: "JEE 2026", code: "JEE2026", campaignTypeCode: "ADM", color: "#1a73e8", icon: "GraduationCap", description: "JEE-focused admission campaign for 2026" },
  { name: "NEET 2026", code: "NEET2026", campaignTypeCode: "ADM", color: "#0d9488", icon: "GraduationCap", description: "NEET-focused admission campaign for 2026" },
  { name: "Early Bird 2026", code: "EARLY_BIRD", campaignTypeCode: "EARLY", color: "#fbbc04", icon: "Bird", description: "Early bird enrollment discount campaign" },
  { name: "Diwali Offer 2026", code: "DIWALI2026", campaignTypeCode: "FEST", color: "#ea4335", icon: "Sparkles", description: "Festive season Diwali discount campaign" },
  { name: "New Branch Launch", code: "BRANCH_LAUNCH", campaignTypeCode: "BRAND", color: "#a855f7", icon: "Building", description: "Brand awareness for new branch opening" },
  { name: "Corporate Training", code: "CORP_TRAINING", campaignTypeCode: "CORP", color: "#5f6368", icon: "Briefcase", description: "Corporate training program campaign" },
  { name: "Referral Drive 2026", code: "REFERRAL2026", campaignTypeCode: "REF", color: "#d4a017", icon: "UserPlus", description: "Student and partner referral drive campaign" },
];

export const listUtmCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("crmUtmCampaigns").collect();
    return campaigns.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getUtmCampaign = query({
  args: { utmCampaignId: v.id("crmUtmCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.utmCampaignId);
  },
});

export const createUtmCampaign = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    campaignTypeId: v.id("crmCampaignTypes"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("crmUtmCampaigns").collect();
    const maxSeq = all.reduce((max, c) => Math.max(max, c.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmUtmCampaigns", {
      name: args.name,
      code: args.code,
      campaignTypeId: args.campaignTypeId,
      startDate: args.startDate,
      endDate: args.endDate,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUtmCampaign = mutation({
  args: {
    utmCampaignId: v.id("crmUtmCampaigns"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    campaignTypeId: v.optional(v.id("crmCampaignTypes")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { utmCampaignId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(utmCampaignId, updates);
  },
});

export const deleteUtmCampaign = mutation({
  args: { utmCampaignId: v.id("crmUtmCampaigns") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.utmCampaignId);
  },
});

export const duplicateUtmCampaign = mutation({
  args: { utmCampaignId: v.id("crmUtmCampaigns") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.utmCampaignId);
    if (!original) throw new Error("UTM campaign not found");
    const all = await ctx.db.query("crmUtmCampaigns").collect();
    const maxSeq = all.reduce((max, c) => Math.max(max, c.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmUtmCampaigns", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      campaignTypeId: original.campaignTypeId,
      startDate: original.startDate,
      endDate: original.endDate,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderUtmCampaigns = mutation({
  args: {
    utmCampaignIds: v.array(v.id("crmUtmCampaigns")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.utmCampaignIds.length; i++) {
      await ctx.db.patch(args.utmCampaignIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultUtmCampaigns = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmUtmCampaigns").collect();
    if (existing.length > 0) return { seeded: 0, message: "UTM campaigns already exist" };

    const campaignTypes = await ctx.db.query("crmCampaignTypes").collect();
    const typeByCode = new Map(campaignTypes.map((t) => [t.code, t._id]));

    const now = Date.now();
    let seeded = 0;
    for (const campaign of DEFAULT_CAMPAIGNS) {
      const typeId = typeByCode.get(campaign.campaignTypeCode);
      if (!typeId) continue;
      await ctx.db.insert("crmUtmCampaigns", {
        name: campaign.name,
        code: campaign.code,
        campaignTypeId: typeId,
        color: campaign.color,
        icon: campaign.icon,
        description: campaign.description,
        sequence: seeded + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      seeded++;
    }
    return { seeded, message: `Default UTM campaigns created (${seeded} of ${DEFAULT_CAMPAIGNS.length} linked)` };
  },
});
