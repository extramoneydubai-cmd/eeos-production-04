/**
 * Business Rules Engine — Configurable Enterprise Policies
 *
 * Replaces ALL hardcoded policies with database-driven rules.
 * Every business rule (refund, cheque bounce, approval chain, SLA,
 * receipt numbering, GST, notification templates, etc.) is configurable.
 *
 * Usage:
 *   const rules = await businessRulesEngine.getRules(ctx, { domain: "refund" });
 *   const refundPct = rules.find(r => r.key === "refundPercentage")?.value || 0;
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Rule Categories / Domains ──────────────────────────────
// Each domain groups related configuration keys.

const DOMAINS = {
  REFUND: "refund",
  CHEQUE_BOUNCE: "cheque_bounce",
  APPROVAL_CHAIN: "approval_chain",
  SLA: "sla",
  RECEIPT_NUMBERING: "receipt_numbering",
  GST: "gst",
  NOTIFICATION_TEMPLATES: "notification_templates",
  ATTENDANCE: "attendance",
  LEAVE: "leave",
  PAYROLL: "payroll",
  ADMISSION: "admission",
  SCHEDULING: "scheduling",
  INVENTORY: "inventory",
  PRODUCTION: "production",
  MARKETING: "marketing",
  SECURITY: "security",
} as const;

// ─── Create/Update Business Rule ────────────────────────────

export const setRule = mutation({
  args: {
    domain: v.string(),
    key: v.string(),
    value: v.any(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    valueType: v.optional(v.union(v.literal("string"), v.literal("number"), v.literal("boolean"), v.literal("json"), v.literal("array"))),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("businessRules")
      .withIndex("domain_key", (q: any) => q.eq("domain", args.domain).eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        label: args.label,
        description: args.description,
        valueType: args.valueType,
        companyId: args.companyId,
        branchId: args.branchId,
        isActive: args.isActive ?? true,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("businessRules", {
      domain: args.domain,
      key: args.key,
      value: args.value,
      label: args.label || args.key,
      description: args.description,
      valueType: args.valueType || typeof args.value === "number" ? "number" : "string",
      companyId: args.companyId,
      branchId: args.branchId,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ─── Query Rules ─────────────────────────────────────────────

export const getRules = query({
  args: {
    domain: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    keys: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let rules = await ctx.db.query("businessRules")
      .withIndex("domain", (q: any) => q.eq("domain", args.domain))
      .collect();

    // Filter by company/branch - branch-specific rules override company-level
    if (args.branchId) {
      const branchRules = rules.filter((r: any) => r.branchId === args.branchId);
      const companyRules = rules.filter((r: any) => r.companyId === args.companyId && !r.branchId);
      const globalRules = rules.filter((r: any) => !r.companyId && !r.branchId);
      rules = [...branchRules, ...companyRules, ...globalRules];
    } else if (args.companyId) {
      const companyRules = rules.filter((r: any) => r.companyId === args.companyId);
      const globalRules = rules.filter((r: any) => !r.companyId && !r.branchId);
      rules = [...companyRules, ...globalRules];
    }

    // Remove duplicates (branch overrides company overrides global)
    const seen = new Set<string>();
    rules = rules.filter((r: any) => {
      if (seen.has(r.key)) return false;
      seen.add(r.key);
      return true;
    });

    // Filter by specific keys if requested
    if (args.keys) {
      rules = rules.filter((r: any) => args.keys!.includes(r.key));
    }

    return rules.filter((r: any) => r.isActive !== false);
  },
});

export const getRule = query({
  args: { domain: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query("businessRules")
      .withIndex("domain_key", (q: any) => q.eq("domain", args.domain).eq("key", args.key))
      .first();
  },
});

// ─── Domain-specific Helpers ─────────────────────────────────

export const getRefundRules = query({
  args: { companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const rules = await getRules.handler(ctx, { domain: DOMAINS.REFUND, companyId: args.companyId, branchId: args.branchId });
    const ruleMap: Record<string, any> = {};
    for (const r of rules) ruleMap[(r as any).key] = (r as any).value;
    return {
      nonRefundablePercent: ruleMap.nonRefundablePercent || 10,
      proRataEnabled: ruleMap.proRataEnabled !== false,
      penaltyPercent: ruleMap.penaltyPercent || 5,
      requiresDirectorApproval: ruleMap.requiresDirectorApproval || false,
      maxRefundDays: ruleMap.maxRefundDays || 365,
      slabs: ruleMap.slabs || [
        { daysFrom: 0, refundPercent: 90 },
        { daysFrom: 8, refundPercent: 75 },
        { daysFrom: 31, refundPercent: 50 },
        { daysFrom: 91, refundPercent: 25 },
        { daysFrom: 181, refundPercent: 0 },
      ],
    };
  },
});

export const getApprovalChain = query({
  args: { module: v.string(), companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const rules = await getRules.handler(ctx, {
      domain: DOMAINS.APPROVAL_CHAIN,
      companyId: args.companyId,
      branchId: args.branchId,
      keys: [args.module],
    });
    const rule = rules[0];
    return rule ? (rule as any).value : { levels: ["branch_manager", "regional_manager", "head_office"] };
  },
});

export const getReceiptNumberFormat = query({
  args: { companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const rules = await getRules.handler(ctx, { domain: DOMAINS.RECEIPT_NUMBERING, companyId: args.companyId, branchId: args.branchId });
    const rule = rules[0];
    return rule ? (rule as any).value : "RCP-{YYYY}-{BRANCH}-{SEQ:6}";
  },
});

// ─── List All Domains (for admin UI) ────────────────────────

export const listDomains = query({
  handler: async (ctx) => {
    const rules = await ctx.db.query("businessRules").collect();
    const domains = [...new Set(rules.map((r: any) => r.domain))].sort();
    return domains.map((d) => ({
      domain: d,
      ruleCount: rules.filter((r: any) => (r as any).domain === d).length,
    }));
  },
});

export const listRulesByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query("businessRules")
      .withIndex("domain", (q: any) => q.eq("domain", args.domain))
      .collect();
  },
});

// ─── Initialize Default Rules ───────────────────────────────

export const initializeDefaultRules = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("businessRules").collect();
    if (existing.length > 0) return { skipped: true, count: existing.length };

    const defaults = [
      // Refund rules
      { domain: DOMAINS.REFUND, key: "nonRefundablePercent", value: 10, label: "Non-refundable %", description: "Percentage of total fee that is non-refundable", valueType: "number" },
      { domain: DOMAINS.REFUND, key: "proRataEnabled", value: true, label: "Pro-rata Calculation", description: "Enable pro-rata refund calculation", valueType: "boolean" },
      { domain: DOMAINS.REFUND, key: "penaltyPercent", value: 5, label: "Penalty %", description: "Penalty percentage on refund amount", valueType: "number" },
      { domain: DOMAINS.REFUND, key: "maxRefundDays", value: 365, label: "Max Refund Days", description: "Maximum days from enrollment eligible for refund", valueType: "number" },

      // Cheque bounce rules
      { domain: DOMAINS.CHEQUE_BOUNCE, key: "maxBounceCount", value: 2, label: "Max Bounce Count", description: "Maximum cheque bounces before restriction", valueType: "number" },
      { domain: DOMAINS.CHEQUE_BOUNCE, key: "penaltyPercent", value: 2, label: "Bounce Penalty %", description: "Penalty percentage on bounced cheque amount", valueType: "number" },
      { domain: DOMAINS.CHEQUE_BOUNCE, key: "autoRestrictAfterBounce", value: true, label: "Auto-restrict Cheques", description: "Automatically restrict future cheques after max bounces", valueType: "boolean" },

      // SLA rules
      { domain: DOMAINS.SLA, key: "ticketResponseHours", value: 4, label: "Ticket Response SLA", description: "Hours within which ticket must get first response", valueType: "number" },
      { domain: DOMAINS.SLA, key: "ticketResolutionHours", value: 48, label: "Ticket Resolution SLA", description: "Hours within which ticket must be resolved", valueType: "number" },

      // Receipt numbering
      { domain: DOMAINS.RECEIPT_NUMBERING, key: "format", value: "RCP-{YYYY}-{SEQ:6}", label: "Receipt Number Format", description: "Format string for auto-generated receipt numbers", valueType: "string" },

      // Attendance rules
      { domain: DOMAINS.ATTENDANCE, key: "minAttendancePercent", value: 75, label: "Min Attendance %", description: "Minimum attendance percentage required", valueType: "number" },
      { domain: DOMAINS.ATTENDANCE, key: "autoMarkAbsentAfterMinutes", value: 15, label: "Auto Mark Absent", description: "Minutes after class start to auto-mark absent", valueType: "number" },
    ];

    let count = 0;
    for (const rule of defaults) {
      await ctx.db.insert("businessRules", { ...rule, isActive: true, createdAt: Date.now(), updatedAt: Date.now() });
      count++;
    }
    return { created: true, count };
  },
});
