import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// BOARD RULE PROFILES (Part 3)
// ═══════════════════════════════════════════════════════════════════

export const listBoardRules = query({
  args: {
    boardType: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("boardRules");
    if (args.activeOnly) q = q.filter((eq) => eq.eq(eq.field("isActive"), true));
    const all = await q.collect();
    if (args.boardType) return all.filter((b) => b.boardType === args.boardType);
    return all;
  },
});

export const getBoardRule = query({
  args: { id: v.id("boardRules") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getBoardRuleByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boardRules")
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();
  },
});

export const createBoardRule = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(), description: v.optional(v.string()),
    boardType: v.union(
      v.literal("cbse"), v.literal("icse"), v.literal("state_board"),
      v.literal("ib"), v.literal("cambridge"), v.literal("university"),
      v.literal("coaching"), v.literal("corporate"), v.literal("custom"),
    ),
    passingPercentage: v.number(),
    graceRules: v.optional(v.string()),
    moderationRules: v.optional(v.string()),
    internalWeightage: v.optional(v.number()),
    externalWeightage: v.optional(v.number()),
    attendanceEligibility: v.optional(v.number()),
    promotionRules: v.optional(v.string()),
    rankingRules: v.optional(v.string()),
    supplementaryRules: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "boardRulesEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("boardRules", {
      ...args, isActive: true, createdBy: ctx.__performerUserId as any, createdAt: now, updatedAt: now,
    });
  }),
});

export const updateBoardRule = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("boardRules"),
    name: v.optional(v.string()), description: v.optional(v.string()),
    passingPercentage: v.optional(v.number()),
    graceRules: v.optional(v.string()), moderationRules: v.optional(v.string()),
    internalWeightage: v.optional(v.number()), externalWeightage: v.optional(v.number()),
    attendanceEligibility: v.optional(v.number()),
    promotionRules: v.optional(v.string()), rankingRules: v.optional(v.string()),
    supplementaryRules: v.optional(v.string()), isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "boardRulesEngine" }, async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  }),
});

export const deleteBoardRule = mutation({
  args: { token: v.optional(v.string()), id: v.id("boardRules") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "boardRulesEngine" }, async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  }),
});

// ═══════════════════════════════════════════════════════════════════
// RULE EVALUATION HELPERS
// ═══════════════════════════════════════════════════════════════════

export interface BoardRuleEvaluation {
  passingPercentage: number;
  graceRules?: { maxGraceMarks: number; perSubjectLimit: number } | null;
  moderationRules?: { maxIncrease: number; maxDecrease: number } | null;
  internalWeightage?: number;
  externalWeightage?: number;
  attendanceEligibility?: number;
  promotionRules?: {
    minPassSubjects: number;
    supplementaryAllowed: boolean;
    maxSupplementarySubjects: number;
  } | null;
  supplementaryRules?: {
    maxAttempts: number;
    maxMarksAwarded: number;
    feePerSubject: number;
  } | null;
}

/**
 * Evaluate a student's result against board rules to determine promotion decision.
 */
export function evaluateAgainstBoardRules(
  percentage: number,
  subjectsPassed: number,
  totalSubjects: number,
  attendance: number,
  rules: BoardRuleEvaluation,
): {
  eligible: boolean;
  decision: "promote" | "supplementary" | "detain";
  reasons: string[];
} {
  const reasons: string[] = [];

  // Attendance eligibility
  if (rules.attendanceEligibility && attendance < rules.attendanceEligibility) {
    reasons.push(`Attendance ${attendance}% below required ${rules.attendanceEligibility}%`);
    return { eligible: false, decision: "detain", reasons };
  }

  // Overall percentage
  if (percentage >= rules.passingPercentage) {
    if (rules.promotionRules) {
      const minPass = rules.promotionRules.minPassSubjects;
      if (subjectsPassed < minPass) {
        reasons.push(`Only ${subjectsPassed}/${totalSubjects} subjects passed, minimum ${minPass} required`);
        if (rules.promotionRules.supplementaryAllowed) {
          return { eligible: true, decision: "supplementary", reasons };
        }
        return { eligible: false, decision: "detain", reasons };
      }
    }
    reasons.push("All criteria met");
    return { eligible: true, decision: "promote", reasons };
  }

  // Failed overall — check supplementary eligibility
  if (rules.promotionRules?.supplementaryAllowed) {
    const maxSupp = rules.promotionRules.maxSupplementarySubjects ?? 2;
    const failedSubjects = totalSubjects - subjectsPassed;
    if (failedSubjects <= maxSupp) {
      reasons.push(`Eligible for supplementary in ${failedSubjects} subject(s)`);
      return { eligible: true, decision: "supplementary", reasons };
    }
  }

  reasons.push(`Below passing percentage (${percentage}% < ${rules.passingPercentage}%)`);
  return { eligible: false, decision: "detain", reasons };
}
