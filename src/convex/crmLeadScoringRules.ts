import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Phone Verified", code: "PHONE_VERIFIED", scoreValue: 20, ruleCategory: "Verification", description: "Lead's phone number has been verified", color: "#34a853", icon: "Phone" },
  { name: "WhatsApp Verified", code: "WA_VERIFIED", scoreValue: 15, ruleCategory: "Verification", description: "Lead's WhatsApp number has been verified", color: "#25D366", icon: "MessageCircle" },
  { name: "Email Verified", code: "EMAIL_VERIFIED", scoreValue: 15, ruleCategory: "Verification", description: "Lead's email address has been verified", color: "#ea4335", icon: "Mail" },
  { name: "Attended Demo", code: "DEMO_ATTENDED", scoreValue: 30, ruleCategory: "Engagement", description: "Lead attended a product or service demo", color: "#a855f7", icon: "Monitor" },
  { name: "Visited Office", code: "VISITED_OFFICE", scoreValue: 25, ruleCategory: "Engagement", description: "Lead visited the campus or office in person", color: "#0d9488", icon: "Building" },
  { name: "Parent Attended", code: "PARENT_ATTENDED", scoreValue: 20, ruleCategory: "Engagement", description: "Lead's parent attended a counselling session", color: "#4f46e5", icon: "Heart" },
  { name: "Downloaded Brochure", code: "DOWNLOADED_BROCHURE", scoreValue: 10, ruleCategory: "Interest", description: "Lead downloaded the course brochure or prospectus", color: "#f59e0b", icon: "Download" },
  { name: "Repeated Visit", code: "REPEATED_VISIT", scoreValue: 15, ruleCategory: "Engagement", description: "Lead visited multiple times or re-engaged", color: "#1a73e8", icon: "RefreshCw" },
  { name: "Referral Lead", code: "REFERRAL_LEAD", scoreValue: 20, ruleCategory: "Source", description: "Lead came through a referral source", color: "#d4a017", icon: "UserPlus" },
  { name: "Scholarship Requested", code: "SCHOLARSHIP_REQUESTED", scoreValue: 5, ruleCategory: "Interest", description: "Lead requested scholarship or financial aid information", color: "#e91e63", icon: "Award" },
  { name: "No Response", code: "NO_RESPONSE", scoreValue: -10, ruleCategory: "Negative", description: "Lead did not respond to multiple contact attempts", color: "#5f6368", icon: "PhoneOff" },
  { name: "Invalid Number", code: "INVALID_NUMBER", scoreValue: -30, ruleCategory: "Negative", description: "Lead's contact number is invalid or incorrect", color: "#d93025", icon: "Ban" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    scoreValue: data.scoreValue,
    ruleCategory: data.ruleCategory,
    description: data.description,
    color: data.color,
    icon: data.icon,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/* ────────────
   MUTATIONS
   ──────────── */

export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("crmLeadScoringRules")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("crmLeadScoringRules", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  },
});

export const createLeadScoringRule = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    scoreValue: v.number(),
    ruleCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("crmLeadScoringRules")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmLeadScoringRules", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateLeadScoringRule = mutation({
  args: {
    id: v.id("crmLeadScoringRules"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    scoreValue: v.optional(v.number()),
    ruleCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead scoring rule not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteLeadScoringRule = mutation({
  args: { id: v.id("crmLeadScoringRules") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead scoring rule not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicateLeadScoringRule = mutation({
  args: { id: v.id("crmLeadScoringRules") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Lead scoring rule not found");
    const all = await ctx.db
      .query("crmLeadScoringRules")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmLeadScoringRules", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      scoreValue: source.scoreValue,
      ruleCategory: source.ruleCategory,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorderLeadScoringRules = mutation({
  args: { orderedIds: v.array(v.id("crmLeadScoringRules")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const listLeadScoringRules = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("crmLeadScoringRules").withIndex("sequence").collect();
  },
});

export const getLeadScoringRule = query({
  args: { id: v.id("crmLeadScoringRules") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
