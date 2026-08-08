import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  {
    name: "Existing Student",
    code: "EXISTING_STUDENT",
    referralCategory: "Student",
    rewardEligible: true,
    description: "Currently enrolled student referring a new prospect",
    color: "#1a73e8",
    icon: "GraduationCap",
  },
  {
    name: "Existing Parent",
    code: "EXISTING_PARENT",
    referralCategory: "Parent",
    rewardEligible: true,
    description: "Parent of a current student referring another prospect",
    color: "#34a853",
    icon: "Heart",
  },
  {
    name: "Alumni",
    code: "ALUMNI",
    referralCategory: "Alumni",
    rewardEligible: true,
    description: "Former student referring new prospects",
    color: "#a855f7",
    icon: "Award",
  },
  {
    name: "Teacher",
    code: "TEACHER",
    referralCategory: "Educator",
    rewardEligible: true,
    description: "Teacher or faculty member referring a prospect",
    color: "#f59e0b",
    icon: "ChalkboardTeacher",
  },
  {
    name: "Employee",
    code: "EMPLOYEE",
    referralCategory: "Employee",
    rewardEligible: false,
    description: "Staff or employee referring a prospect",
    color: "#ea4335",
    icon: "UserRound",
  },
  {
    name: "Friend",
    code: "FRIEND",
    referralCategory: "Social",
    rewardEligible: false,
    description: "Friend or acquaintance referring a prospect",
    color: "#e91e63",
    icon: "UserPlus",
  },
  {
    name: "Relative",
    code: "RELATIVE",
    referralCategory: "Family",
    rewardEligible: false,
    description: "Family member referring a prospect",
    color: "#4f46e5",
    icon: "Users",
  },
  {
    name: "Corporate Partner",
    code: "CORPORATE",
    referralCategory: "Corporate",
    rewardEligible: true,
    description: "Corporate partner organization referring prospects",
    color: "#0d9488",
    icon: "Building",
  },
  {
    name: "School",
    code: "SCHOOL",
    referralCategory: "Institution",
    rewardEligible: true,
    description: "School referring students for programs",
    color: "#e8710a",
    icon: "School",
  },
  {
    name: "College",
    code: "COLLEGE",
    referralCategory: "Institution",
    rewardEligible: true,
    description: "College referring students for further programs",
    color: "#4285f4",
    icon: "BookOpen",
  },
  {
    name: "Consultant",
    code: "CONSULTANT",
    referralCategory: "Professional",
    rewardEligible: true,
    description: "Education consultant referring prospects",
    color: "#06b6d4",
    icon: "Briefcase",
  },
  {
    name: "Agency",
    code: "AGENCY",
    referralCategory: "Corporate",
    rewardEligible: true,
    description: "Recruitment or marketing agency referring prospects",
    color: "#5f6368",
    icon: "Building2",
  },
  {
    name: "Website Referral",
    code: "WEB_REFERRAL",
    referralCategory: "Online",
    rewardEligible: false,
    description: "Self-referral through the institution website",
    color: "#a855f7",
    icon: "Globe",
  },
  {
    name: "Social Media Referral",
    code: "SOCIAL_REFERRAL",
    referralCategory: "Online",
    rewardEligible: false,
    description: "Self-referral through social media platforms",
    color: "#1877F2",
    icon: "Share2",
  },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    referralCategory: data.referralCategory,
    rewardEligible: data.rewardEligible,
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
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmReferralSources" }, async (ctx) => {
    const existing = await ctx.db
      .query("crmReferralSources")
      .withIndex("sequence")
      .collect();

    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };

    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("crmReferralSources", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  }),
});

export const createReferralSource = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    referralCategory: v.string(),
    rewardEligible: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmReferralSources" }, async (ctx, args) => {
    const all = await ctx.db
      .query("crmReferralSources")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmReferralSources", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateReferralSource = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("crmReferralSources"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    referralCategory: v.optional(v.string()),
    rewardEligible: v.optional(v.boolean()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmReferralSources" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Referral source not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteReferralSource = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmReferralSources") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmReferralSources" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Referral source not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicateReferralSource = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmReferralSources") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmReferralSources" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Referral source not found");
    const all = await ctx.db
      .query("crmReferralSources")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmReferralSources", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      referralCategory: source.referralCategory,
      rewardEligible: source.rewardEligible,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const reorderReferralSources = mutation({
  args: { token: v.optional(v.string()),
    orderedIds: v.array(v.id("crmReferralSources")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmReferralSources" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        sequence: i,
        updatedAt: Date.now(),
      });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const listReferralSources = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("crmReferralSources")
      .withIndex("sequence")
      .collect();
  },
});

export const getReferralSource = query({
  args: { id: v.id("crmReferralSources") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
