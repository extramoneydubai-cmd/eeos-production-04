import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  {
    name: "Admission Ready",
    code: "ADM_READY",
    outcomeCategory: "Positive",
    recommendedAction: "Proceed to Admission",
    description: "Prospect is ready to proceed with admission formalities",
    color: "#34a853",
    icon: "GraduationCap",
  },
  {
    name: "Interested",
    code: "INTERESTED",
    outcomeCategory: "Positive",
    recommendedAction: "Schedule Follow-up",
    description: "Prospect has shown interest and needs further nurturing",
    color: "#1a73e8",
    icon: "ThumbsUp",
  },
  {
    name: "Need Follow-up",
    code: "NEED_FUP",
    outcomeCategory: "Neutral",
    recommendedAction: "Schedule Follow-up Call",
    description: "Prospect needs additional follow-up before decision",
    color: "#fbbc04",
    icon: "CalendarClock",
  },
  {
    name: "Need Parent Discussion",
    code: "NEED_PARENT",
    outcomeCategory: "Neutral",
    recommendedAction: "Schedule Parent Counselling",
    description: "Prospect needs to discuss with parents before deciding",
    color: "#e8710a",
    icon: "Heart",
  },
  {
    name: "Need Scholarship",
    code: "NEED_SCHOLAR",
    outcomeCategory: "Neutral",
    recommendedAction: "Explain Scholarship Options",
    description: "Prospect needs scholarship or financial aid information",
    color: "#a855f7",
    icon: "Award",
  },
  {
    name: "Need Demo",
    code: "NEED_DEMO",
    outcomeCategory: "Neutral",
    recommendedAction: "Schedule Demo Session",
    description: "Prospect wants to attend a demo class before deciding",
    color: "#4f46e5",
    icon: "Monitor",
  },
  {
    name: "Documents Pending",
    code: "DOCS_PENDING",
    outcomeCategory: "Neutral",
    recommendedAction: "Share Document Checklist",
    description: "Prospect needs to submit required documents",
    color: "#0d9488",
    icon: "FileText",
  },
  {
    name: "Fee Pending",
    code: "FEE_PENDING",
    outcomeCategory: "Neutral",
    recommendedAction: "Share Fee Structure & Payment Plans",
    description: "Prospect needs to complete fee payment",
    color: "#d4a017",
    icon: "DollarSign",
  },
  {
    name: "Not Interested",
    code: "NOT_INT",
    outcomeCategory: "Negative",
    recommendedAction: "Mark as Lost",
    description: "Prospect has clearly expressed lack of interest",
    color: "#ea4335",
    icon: "ThumbsDown",
  },
  {
    name: "Lost",
    code: "LOST",
    outcomeCategory: "Negative",
    recommendedAction: "Move to Lost Pipeline",
    description: "Prospect has been lost to competition or personal reasons",
    color: "#5f6368",
    icon: "XCircle",
  },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    outcomeCategory: data.outcomeCategory,
    recommendedAction: data.recommendedAction,
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
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCounsellingOutcomes" }, async (ctx) => {
    const existing = await ctx.db
      .query("crmCounsellingOutcomes")
      .withIndex("sequence")
      .collect();

    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };

    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("crmCounsellingOutcomes", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  }),
});

export const createCounsellingOutcome = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    outcomeCategory: v.string(),
    recommendedAction: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCounsellingOutcomes" }, async (ctx, args) => {
    const all = await ctx.db
      .query("crmCounsellingOutcomes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmCounsellingOutcomes", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateCounsellingOutcome = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("crmCounsellingOutcomes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    outcomeCategory: v.optional(v.string()),
    recommendedAction: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCounsellingOutcomes" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Counselling outcome not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteCounsellingOutcome = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmCounsellingOutcomes") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmCounsellingOutcomes" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Counselling outcome not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicateCounsellingOutcome = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmCounsellingOutcomes") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCounsellingOutcomes" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Counselling outcome not found");
    const all = await ctx.db
      .query("crmCounsellingOutcomes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmCounsellingOutcomes", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      outcomeCategory: source.outcomeCategory,
      recommendedAction: source.recommendedAction,
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

export const reorderCounsellingOutcomes = mutation({
  args: { token: v.optional(v.string()),
    orderedIds: v.array(v.id("crmCounsellingOutcomes")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCounsellingOutcomes" }, async (ctx, args) => {
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

export const listCounsellingOutcomes = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("crmCounsellingOutcomes")
      .withIndex("sequence")
      .collect();
  },
});

export const getCounsellingOutcome = query({
  args: { id: v.id("crmCounsellingOutcomes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
