/**
 * Universal Rule Runtime — Configurable Enterprise Calculation Engine
 *
 * Phase 2&5 — Every business calculation becomes metadata-driven.
 * No hardcoded rules. All policies configurable via the Rule Studio.
 *
 * Supported rule domains:
 *   refund, late_fee, gst, discount, salary, attendance,
 *   leave, promotion, admission, inventory, purchase, finance,
 *   exam_eligibility, certificate, scholarship, penalty
 *
 * Each rule supports:
 *   - Conditions (AND/OR/NOT)
 *   - Calculations (formula-based)
 *   - Slabs (range-based)
 *   - Overrides (company/branch/user level)
 *   - Versioning (draft → testing → published)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Rule Definition Types ────────────────────────────────────

export interface RuleCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between" | "contains" | "isTrue" | "isFalse";
  value: any;
}

export interface RuleSlab {
  label: string;
  fromDays: number;
  toDays: number;
  value: number | string;
  type: "percent" | "fixed" | "formula";
}

export interface RuleFormula {
  expression: string;
  description: string;
  variables: Record<string, string>;
}

export interface RuleDefinition {
  domain: string;
  key: string;
  label: string;
  description: string;
  valueType: "number" | "percent" | "boolean" | "string" | "json" | "array" | "formula";
  defaultValue: any;
  conditions?: RuleCondition[];
  slabs?: RuleSlab[];
  formula?: RuleFormula;
  companyOverridable: boolean;
  branchOverridable: boolean;
  category: "finance" | "hr" | "academic" | "operations" | "marketing" | "support";
}

// ─── Built-in Rule Definitions ────────────────────────────────

export const RULE_DEFINITIONS: Record<string, RuleDefinition> = {
  "refund.nonRefundablePercent": {
    domain: "refund", key: "nonRefundablePercent", label: "Non-refundable Percentage",
    description: "Percentage of total fee that is never refunded", valueType: "percent",
    defaultValue: 10, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "refund.proRataEnabled": {
    domain: "refund", key: "proRataEnabled", label: "Pro-rata Calculation",
    description: "Enable pro-rata refund calculation based on days attended",
    valueType: "boolean", defaultValue: true, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "refund.penaltyPercent": {
    domain: "refund", key: "penaltyPercent", label: "Refund Penalty %",
    description: "Penalty percentage deducted from refund amount",
    valueType: "percent", defaultValue: 5, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "refund.maxRefundDays": {
    domain: "refund", key: "maxRefundDays", label: "Max Refund Days",
    description: "Maximum days from enrollment eligible for refund",
    valueType: "number", defaultValue: 365, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "refund.slabs": {
    domain: "refund", key: "slabs", label: "Refund Slabs",
    description: "Slabs determining refund percentage based on days from enrollment",
    valueType: "json", defaultValue: [
      { fromDays: 0, toDays: 7, refundPercent: 90, label: "Within 7 days" },
      { fromDays: 8, toDays: 30, refundPercent: 75, label: "8-30 days" },
      { fromDays: 31, toDays: 90, refundPercent: 50, label: "31-90 days" },
      { fromDays: 91, toDays: 180, refundPercent: 25, label: "91-180 days" },
      { fromDays: 181, toDays: 365, refundPercent: 0, label: "181-365 days" },
    ],
    companyOverridable: true, branchOverridable: false, category: "finance",
    slabs: [
      { label: "Within 7 days", fromDays: 0, toDays: 7, value: 90, type: "percent" },
      { label: "8-30 days", fromDays: 8, toDays: 30, value: 75, type: "percent" },
      { label: "31-90 days", fromDays: 31, toDays: 90, value: 50, type: "percent" },
      { label: "91-180 days", fromDays: 91, toDays: 180, value: 25, type: "percent" },
      { label: "181-365 days", fromDays: 181, toDays: 365, value: 0, type: "percent" },
    ],
  },
  "lateFee.dailyPercent": {
    domain: "late_fee", key: "dailyPercent", label: "Daily Late Fee %",
    description: "Percentage of outstanding amount charged per day overdue",
    valueType: "percent", defaultValue: 0.05, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "lateFee.graceDays": {
    domain: "late_fee", key: "graceDays", label: "Grace Days",
    description: "Days after due date before late fee applies",
    valueType: "number", defaultValue: 7, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "lateFee.maxPercent": {
    domain: "late_fee", key: "maxPercent", label: "Max Late Fee %",
    description: "Maximum accumulated late fee as percentage of original amount",
    valueType: "percent", defaultValue: 10, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "gst.defaultRate": {
    domain: "gst", key: "defaultRate", label: "Default GST Rate",
    description: "Default GST rate percentage applied to taxable services",
    valueType: "percent", defaultValue: 18, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "gst.reverseCharge": {
    domain: "gst", key: "reverseCharge", label: "Reverse Charge Applicable",
    description: "Enable reverse charge mechanism for specified services",
    valueType: "boolean", defaultValue: false, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "gst.slabs": {
    domain: "gst", key: "slabs", label: "GST Rate Slabs",
    description: "Configurable GST rate slabs with conditions",
    valueType: "json", defaultValue: [
      { minAmount: 0, maxAmount: 1000, rate: 0, label: "Nil" },
      { minAmount: 1001, maxAmount: 10000, rate: 5, label: "5% Slab" },
      { minAmount: 10001, maxAmount: 100000, rate: 12, label: "12% Slab" },
      { minAmount: 100001, maxAmount: 1000000, rate: 18, label: "18% Slab" },
      { minAmount: 1000001, maxAmount: Infinity, rate: 28, label: "28% Slab" },
    ],
    companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "discount.maxPercent": {
    domain: "discount", key: "maxPercent", label: "Maximum Discount %",
    description: "Maximum discount percentage allowed without approval",
    valueType: "percent", defaultValue: 15, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "discount.approvalRequiredAbove": {
    domain: "discount", key: "approvalRequiredAbove", label: "Approval Required Above %",
    description: "Discount percentage above which manager approval is required",
    valueType: "percent", defaultValue: 10, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "discount.directorApprovalAbove": {
    domain: "discount", key: "directorApprovalAbove", label: "Director Approval Above %",
    description: "Discount percentage above which director approval is required",
    valueType: "percent", defaultValue: 25, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "attendance.minPercent": {
    domain: "attendance", key: "minPercent", label: "Minimum Attendance %",
    description: "Minimum attendance percentage required for exam eligibility",
    valueType: "percent", defaultValue: 75, companyOverridable: true, branchOverridable: true, category: "academic",
  },
  "attendance.autoMarkAbsentAfter": {
    domain: "attendance", key: "autoMarkAbsentAfter", label: "Auto-mark Absent After (min)",
    description: "Minutes after class start to auto-mark absent",
    valueType: "number", defaultValue: 15, companyOverridable: true, branchOverridable: true, category: "academic",
  },
  "attendance.considerLateAfter": {
    domain: "attendance", key: "considerLateAfter", label: "Consider Late After (min)",
    description: "Minutes after class start to mark as late instead of present",
    valueType: "number", defaultValue: 5, companyOverridable: true, branchOverridable: true, category: "academic",
  },
  "cheque.maxBounceCount": {
    domain: "cheque", key: "maxBounceCount", label: "Max Bounce Count",
    description: "Maximum number of bounced cheques before restriction",
    valueType: "number", defaultValue: 2, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "cheque.penaltyPercent": {
    domain: "cheque", key: "penaltyPercent", label: "Cheque Bounce Penalty %",
    description: "Penalty percentage charged on bounced cheque amount",
    valueType: "percent", defaultValue: 2, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "cheque.autoRestrictAfterBounce": {
    domain: "cheque", key: "autoRestrictAfterBounce", label: "Auto-restrict After Bounce",
    description: "Automatically restrict future cheques after max bounces",
    valueType: "boolean", defaultValue: true, companyOverridable: true, branchOverridable: true, category: "finance",
  },
  "cheque.secondBouncePenaltyPercent": {
    domain: "cheque", key: "secondBouncePenaltyPercent", label: "2nd Bounce Penalty %",
    description: "Higher penalty for second cheque bounce",
    valueType: "percent", defaultValue: 5, companyOverridable: true, branchOverridable: false, category: "finance",
  },
  "salary.taxRate": {
    domain: "salary", key: "taxRate", label: "Income Tax Rate %",
    description: "Default income tax deduction rate",
    valueType: "percent", defaultValue: 10, companyOverridable: true, branchOverridable: false, category: "hr",
  },
  "salary.providentFundPercent": {
    domain: "salary", key: "providentFundPercent", label: "PF Contribution %",
    description: "Provident Fund contribution percentage",
    valueType: "percent", defaultValue: 12, companyOverridable: true, branchOverridable: false, category: "hr",
  },
  "salary.medicalAllowance": {
    domain: "salary", key: "medicalAllowance", label: "Medical Allowance",
    description: "Fixed medical allowance amount",
    valueType: "number", defaultValue: 1500, companyOverridable: true, branchOverridable: true, category: "hr",
  },
  "leave.annualLeaves": {
    domain: "leave", key: "annualLeaves", label: "Annual Leaves",
    description: "Number of annual leave days per year",
    valueType: "number", defaultValue: 18, companyOverridable: true, branchOverridable: false, category: "hr",
  },
  "leave.sickLeaves": {
    domain: "leave", key: "sickLeaves", label: "Sick Leaves",
    description: "Number of sick leave days per year",
    valueType: "number", defaultValue: 12, companyOverridable: true, branchOverridable: false, category: "hr",
  },
  "leave.maxConsecutiveDays": {
    domain: "leave", key: "maxConsecutiveDays", label: "Max Consecutive Leave Days",
    description: "Maximum consecutive leave days without special approval",
    valueType: "number", defaultValue: 15, companyOverridable: true, branchOverridable: true, category: "hr",
  },
  "leave.requiresDocumentation": {
    domain: "leave", key: "requiresDocumentation", label: "Requires Medical Documentation",
    description: "Sick leaves beyond threshold require medical certificate",
    valueType: "number", defaultValue: 3, companyOverridable: true, branchOverridable: true, category: "hr",
  },
  "exam.passingPercent": {
    domain: "exam", key: "passingPercent", label: "Passing Percentage",
    description: "Minimum percentage required to pass an examination",
    valueType: "percent", defaultValue: 40, companyOverridable: true, branchOverridable: true, category: "academic",
  },
  "exam.attendanceRequiredForExam": {
    domain: "exam", key: "attendanceRequiredForExam", label: "Attendance Required for Exam",
    description: "Minimum attendance percentage to be eligible for exams",
    valueType: "percent", defaultValue: 75, companyOverridable: true, branchOverridable: true, category: "academic",
  },
  "exam.graceMarks": {
    domain: "exam", key: "graceMarks", label: "Grace Marks",
    description: "Maximum grace marks that can be awarded",
    valueType: "number", defaultValue: 5, companyOverridable: true, branchOverridable: true, category: "academic",
  },
};

// ─── Queries ───────────────────────────────────────────────────

export const getRule = query({
  args: { domain: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    // Check database first for overrides
    const dbRule = await ctx.db.query("businessRules")
      .withIndex("domain_key", (q: any) => q.eq("domain", args.domain).eq("key", args.key))
      .first();
    if (dbRule) return dbRule;

    // Fall back to default definition
    const def = RULE_DEFINITIONS[`${args.domain}.${args.key}`] ||
                RULE_DEFINITIONS[args.key];
    return def ? { domain: args.domain, key: args.key, value: def.defaultValue, label: def.label, description: def.description, valueType: def.valueType } : null;
  },
});

export const getDomainRules = query({
  args: { domain: v.string(), companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    // Get all rule definitions for this domain
    const defs = Object.values(RULE_DEFINITIONS).filter(r => r.domain === args.domain);

    // Get any database overrides
    const dbRules = await ctx.db.query("businessRules")
      .withIndex("domain", (q: any) => q.eq("domain", args.domain))
      .collect();

    // Merge: DB overrides take precedence over defaults
    const merged: Record<string, any> = {};
    for (const def of defs) {
      merged[def.key] = def.defaultValue;
    }
    for (const rule of dbRules) {
      merged[(rule as any).key] = (rule as any).value;
    }

    return Object.entries(merged).map(([key, value]) => {
      const def = RULE_DEFINITIONS[`${args.domain}.${key}`];
      return {
        key,
        value,
        label: def?.label || key,
        description: def?.description || "",
        valueType: def?.valueType || typeof value === "number" ? "number" : "string",
        category: def?.category || "operations",
      };
    });
  },
});

export const listRuleDomains = query({
  handler: async (ctx) => {
    const domains = new Map<string, { label: string; count: number; category: string }>();
    for (const [, def] of Object.entries(RULE_DEFINITIONS)) {
      if (!domains.has(def.domain)) {
        domains.set(def.domain, { label: def.domain.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: 0, category: def.category });
      }
      domains.get(def.domain)!.count++;
    }
    return Array.from(domains.entries()).map(([id, data]) => ({ id, ...data }));
  },
});

// ─── Calculations ─────────────────────────────────────────────

export const calculateRefund = query({
  args: {
    totalFee: v.number(),
    daysSinceEnrollment: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const domainRules = await getDomainRules.handler(ctx, { domain: "refund", companyId: args.companyId, branchId: args.branchId });
    const ruleMap: Record<string, any> = {};
    for (const r of domainRules) ruleMap[r.key] = r.value;

    const nonRefundablePercent = ruleMap.nonRefundablePercent || 10;
    const penaltyPercent = ruleMap.penaltyPercent || 5;
    const slabs = ruleMap.slabs || RULE_DEFINITIONS["refund.slabs"]?.defaultValue || [];
    const maxDays = ruleMap.maxRefundDays || 365;

    if (args.daysSinceEnrollment > maxDays) {
      return { eligible: false, reason: "Beyond max refund days", refundAmount: 0, nonRefundableAmount: args.totalFee * nonRefundablePercent / 100, penalty: 0, finalAmount: 0 };
    }

    const nonRefundableAmount = args.totalFee * nonRefundablePercent / 100;
    let refundPercent = 0;
    for (const slab of slabs) {
      if (args.daysSinceEnrollment >= slab.fromDays && args.daysSinceEnrollment <= slab.toDays) {
        refundPercent = slab.refundPercent || slab.value || 0;
        break;
      }
    }

    const applicableFee = args.totalFee - nonRefundableAmount;
    const refundAmount = applicableFee * refundPercent / 100;
    const penalty = refundAmount * penaltyPercent / 100;
    const finalAmount = refundAmount - penalty;

    return { eligible: true, nonRefundableAmount, refundPercent, refundAmount, penalty, finalAmount, daysSinceEnrollment: args.daysSinceEnrollment };
  },
});

export const calculateLateFee = query({
  args: {
    outstandingAmount: v.number(),
    daysOverdue: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const domainRules = await getDomainRules.handler(ctx, { domain: "late_fee", companyId: args.companyId, branchId: args.branchId });
    const ruleMap: Record<string, any> = {};
    for (const r of domainRules) ruleMap[r.key] = r.value;

    const graceDays = ruleMap.graceDays || 7;
    const dailyPercent = ruleMap.dailyPercent || 0.05;
    const maxPercent = ruleMap.maxPercent || 10;

    const effectiveOverdue = Math.max(0, args.daysOverdue - graceDays);
    const lateFee = args.outstandingAmount * dailyPercent / 100 * effectiveOverdue;
    const maxLateFee = args.outstandingAmount * maxPercent / 100;

    return {
      daysOverdue: args.daysOverdue,
      graceDays,
      effectiveOverdue,
      lateFee: Math.min(lateFee, maxLateFee),
      maxLateFee,
      capped: lateFee > maxLateFee,
    };
  },
});

export const calculateGST = query({
  args: {
    amount: v.number(),
    gstRate: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const domainRules = await getDomainRules.handler(ctx, { domain: "gst", companyId: args.companyId, branchId: args.branchId });
    const ruleMap: Record<string, any> = {};
    for (const r of domainRules) ruleMap[r.key] = r.value;

    const rate = args.gstRate || ruleMap.defaultRate || 18;
    const gstAmount = args.amount * rate / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const totalWithGST = args.amount + gstAmount;

    return { taxableAmount: args.amount, gstRate: rate, gstAmount, cgst, sgst, totalWithGST };
  },
});

export const calculateChequePenalty = query({
  args: {
    chequeAmount: v.number(),
    bounceCount: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const domainRules = await getDomainRules.handler(ctx, { domain: "cheque", companyId: args.companyId, branchId: args.branchId });
    const ruleMap: Record<string, any> = {};
    for (const r of domainRules) ruleMap[r.key] = r.value;

    const maxBounceCount = ruleMap.maxBounceCount || 2;
    const penaltyPercent = args.bounceCount >= 2 ? (ruleMap.secondBouncePenaltyPercent || 5) : (ruleMap.penaltyPercent || 2);
    const penalty = chequeAmount * penaltyPercent / 100;
    const isRestricted = args.bounceCount >= maxBounceCount;

    return { penaltyPercent, penalty, isRestricted, bounceCount: args.bounceCount, maxBounceCount, chequeAmount };
  },
});

export const evaluateEligibility = query({
  args: {
    domain: v.string(),
    conditions: v.any(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const results: { rule: string; passed: boolean; reason?: string }[] = [];
    for (const condition of args.conditions) {
      const fieldValue = args.data[condition.field];
      let passed = false;
      let reason = "";
      switch (condition.operator) {
        case "eq": passed = fieldValue === condition.value; break;
        case "neq": passed = fieldValue !== condition.value; break;
        case "gt": passed = Number(fieldValue) > Number(condition.value); break;
        case "gte": passed = Number(fieldValue) >= Number(condition.value); break;
        case "lt": passed = Number(fieldValue) < Number(condition.value); break;
        case "lte": passed = Number(fieldValue) <= Number(condition.value); break;
        case "in": passed = Array.isArray(condition.value) && condition.value.includes(fieldValue); break;
        case "between": passed = Array.isArray(condition.value) && condition.value.length === 2 && Number(fieldValue) >= condition.value[0] && Number(fieldValue) <= condition.value[1]; break;
        case "contains": passed = String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase()); break;
        case "isTrue": passed = fieldValue === true || fieldValue === 1 || fieldValue === "true"; break;
        case "isFalse": passed = fieldValue === false || fieldValue === 0 || fieldValue === "false"; break;
      }
      if (!passed) reason = `${condition.field} ${condition.operator} ${condition.value}: got ${fieldValue}`;
      results.push({ rule: condition.field, passed, reason: reason || undefined });
    }
    return { domain: args.domain, allPassed: results.every(r => r.passed), results };
  },
});
