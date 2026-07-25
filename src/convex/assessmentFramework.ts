import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// ASSESSMENT TYPES (Part 1) — Fully configurable
// ═══════════════════════════════════════════════════════════════════

export const listAssessmentTypes = query({
  args: {
    category: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("assessmentTypes");
    if (args.activeOnly) q = q.filter((eq) => eq.eq(eq.field("isActive"), true));
    const all = await q.collect();
    if (args.category) return all.filter((a) => a.category === args.category);
    return all;
  },
});

export const getAssessmentType = query({
  args: { id: v.id("assessmentTypes") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createAssessmentType = mutation({
  args: {
    name: v.string(), code: v.string(),
    category: v.union(
      v.literal("unit_test"), v.literal("weekly_test"), v.literal("monthly_test"),
      v.literal("quarterly"), v.literal("half_yearly"), v.literal("annual"),
      v.literal("mock_test"), v.literal("assignment"), v.literal("practical"),
      v.literal("lab"), v.literal("project"), v.literal("viva"),
      v.literal("internal_assessment"), v.literal("external_assessment"),
      v.literal("skill_assessment"), v.literal("olympiad"),
      v.literal("entrance_test"), v.literal("custom"),
    ),
    description: v.optional(v.string()),
    maxMarks: v.number(), passingMarks: v.optional(v.number()),
    weightage: v.optional(v.number()), gradingScheme: v.optional(v.string()),
    evaluationModel: v.union(
      v.literal("marks"), v.literal("grades"), v.literal("percentage"),
      v.literal("gpa"), v.literal("cgpa"), v.literal("pass_fail"),
      v.literal("rubric"), v.literal("competency"),
      v.literal("narrative"), v.literal("custom_formula"),
    ),
    attendanceRequired: v.optional(v.boolean()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("assessmentTypes", {
      ...args, isActive: true, createdBy: identity.subject as any, createdAt: now, updatedAt: now,
    });
  },
});

export const updateAssessmentType = mutation({
  args: {
    id: v.id("assessmentTypes"),
    name: v.optional(v.string()), description: v.optional(v.string()),
    maxMarks: v.optional(v.number()), passingMarks: v.optional(v.number()),
    weightage: v.optional(v.number()), gradingScheme: v.optional(v.string()),
    evaluationModel: v.optional(v.union(
      v.literal("marks"), v.literal("grades"), v.literal("percentage"),
      v.literal("gpa"), v.literal("cgpa"), v.literal("pass_fail"),
      v.literal("rubric"), v.literal("competency"),
      v.literal("narrative"), v.literal("custom_formula"),
    )),
    attendanceRequired: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()), metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

export const deleteAssessmentType = mutation({
  args: { id: v.id("assessmentTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// EVALUATION MODELS (Part 2)
// ═══════════════════════════════════════════════════════════════════

export interface EvaluationInput {
  marksObtained: number;
  totalMarks: number;
  model: "marks" | "grades" | "percentage" | "gpa" | "cgpa" | "pass_fail" | "rubric" | "competency" | "narrative" | "custom_formula";
  passPercentage?: number;
  gradeRules?: Array<{ minPct: number; maxPct: number; grade: string; gradePoint: number; division: string }>;
  rubricScore?: number;
  rubricMax?: number;
  competencyLevel?: string;
  narrative?: string;
  customFormula?: string;
}

export interface EvaluationResult {
  score: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  division: "distinction" | "first" | "second" | "third" | "fail" | "supplementary";
  passFail: "pass" | "fail" | "supplementary";
  narrative?: string;
}

/**
 * Evaluate a student's performance using the chosen evaluation model.
 */
export function evaluatePerformance(input: EvaluationInput): EvaluationResult {
  const { model, marksObtained, totalMarks, passPercentage } = input;
  const passPct = passPercentage ?? 33;

  switch (model) {
    case "marks": {
      const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
      const g = calculateGradeFromRules(pct, input.gradeRules, passPct);
      return {
        score: marksObtained, percentage: pct, passFail: (pct >= passPct ? "pass" : "fail") as any,
        ...g,
      };
    }
    case "percentage": {
      const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
      const g = calculateGradeFromRules(pct, input.gradeRules, passPct);
      return {
        score: pct, percentage: pct, passFail: (pct >= passPct ? "pass" : "fail") as any,
        ...g,
      };
    }
    case "gpa":
    case "cgpa": {
      const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
      const g = calculateGradeFromRules(pct, input.gradeRules, passPct);
      const gpa = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 1000) / 100 : 0;
      return {
        score: gpa, percentage: pct, passFail: (pct >= passPct ? "pass" : "fail") as any,
        ...g,
      };
    }
    case "pass_fail": {
      const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
      return {
        score: marksObtained, percentage: pct,
        grade: pct >= passPct ? "P" : "F",
        gradePoint: pct >= passPct ? 1 : 0,
        division: pct >= passPct ? "first" : "fail",
        passFail: (pct >= passPct ? "pass" : "fail") as any,
      };
    }
    case "rubric": {
      const rubricPct = input.rubricMax && input.rubricMax > 0
        ? Math.round(((input.rubricScore ?? 0) / input.rubricMax) * 10000) / 100
        : 0;
      const pct = rubricPct;
      const g = calculateGradeFromRules(pct, input.gradeRules, passPct);
      return {
        score: input.rubricScore ?? 0, percentage: pct,
        passFail: (pct >= passPct ? "pass" : "fail") as any,
        ...g,
      };
    }
    case "competency": {
      const levels: Record<string, number> = {
        "beginner": 25, "developing": 45, "proficient": 65,
        "advanced": 80, "expert": 95,
      };
      const pct = levels[input.competencyLevel ?? "beginner"] ?? 50;
      return {
        score: pct, percentage: pct,
        grade: input.competencyLevel ?? "beginner",
        gradePoint: pct >= passPct ? Math.round(pct / 10) : 0,
        division: pct >= passPct ? "first" : "fail",
        passFail: (pct >= passPct ? "pass" : "fail") as any,
      };
    }
    case "narrative": {
      return {
        score: marksObtained, percentage: 0,
        grade: "N", gradePoint: 0,
        division: "first",
        passFail: "pass",
        narrative: input.narrative || "Narrative evaluation",
      };
    }
    case "custom_formula": {
      const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
      const g = calculateGradeFromRules(pct, input.gradeRules, passPct);
      return {
        score: marksObtained, percentage: pct,
        passFail: (pct >= passPct ? "pass" : "fail") as any,
        ...g,
      };
    }
    default: {
      const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
      const g = calculateGradeFromRules(pct, input.gradeRules, passPct);
      return {
        score: marksObtained, percentage: pct,
        passFail: (pct >= passPct ? "pass" : "fail") as any,
        ...g,
      };
    }
  }
}

function calculateGradeFromRules(
  percentage: number,
  rules?: Array<{ minPct: number; maxPct: number; grade: string; gradePoint: number; division: string }>,
  passPct?: number,
): { grade: string; gradePoint: number; division: "distinction" | "first" | "second" | "third" | "fail" | "supplementary" } {
  if (!rules || rules.length === 0) {
    return getDefaultGrade(percentage, passPct ?? 33);
  }
  for (const rule of rules) {
    if (percentage >= rule.minPct && percentage <= rule.maxPct) {
      return {
        grade: rule.grade,
        gradePoint: rule.gradePoint,
        division: rule.division as any,
      };
    }
  }
  return { grade: "F", gradePoint: 0, division: "fail" };
}

function getDefaultGrade(percentage: number, passPct: number) {
  if (percentage >= 90) return { grade: "A+", gradePoint: 10, division: "distinction" as const };
  if (percentage >= 80) return { grade: "A", gradePoint: 9, division: "distinction" as const };
  if (percentage >= 70) return { grade: "B+", gradePoint: 8, division: "first" as const };
  if (percentage >= 60) return { grade: "B", gradePoint: 7, division: "first" as const };
  if (percentage >= 50) return { grade: "C+", gradePoint: 6, division: "second" as const };
  if (percentage >= 40) return { grade: "C", gradePoint: 5, division: "third" as const };
  if (percentage >= passPct) return { grade: "D", gradePoint: 4, division: "third" as const };
  return { grade: "F", gradePoint: 0, division: "fail" as const };
}

export function calculateCgpaSdk(gradePoints: number[]): number {
  if (gradePoints.length === 0) return 0;
  return Math.round((gradePoints.reduce((a, b) => a + b, 0) / gradePoints.length) * 100) / 100;
}
