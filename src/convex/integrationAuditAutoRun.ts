/**
 * Integration Audit Auto-Run
 *
 * Automatically runs the integration audit at key lifecycle events:
 *   1. After deployment — validates all modules are correctly integrated
 *   2. Daily — scheduled health check
 *   3. Before release — generates the compliance report
 *   4. On demand — via mutation call
 *
 * The audit queries real Convex tables (not documentation) to determine
 * which modules have adopted the enterprise platform capabilities.
 *
 * Generates:
 *   - Per-module compliance scores (0-100%)
 *   - Overall platform score
 *   - List of modules needing attention
 *   - Remediation recommendations
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { generateCoverageMatrix } from "./coverageMatrix";

// ─── Audit Record Type ──────────────────────────────────────

interface AuditRecord {
  runId: string;
  triggeredBy: "deployment" | "scheduled" | "manual" | "pre_release";
  overallScore: number;
  totalModules: number;
  completeCount: number;
  criticalCount: number;
  moduleResults: Array<{
    module: string;
    displayName: string;
    percentage: number;
    status: string;
  }>;
  generatedAt: number;
  duration: number;
}

// ─── Run Integration Audit ──────────────────────────────────

export const runIntegrationAudit = mutation({
  args: {
    triggeredBy: v.optional(v.union(
      v.literal("deployment"),
      v.literal("scheduled"),
      v.literal("manual"),
      v.literal("pre_release"),
    )),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Run the coverage matrix
    const coverage = await generateCoverageMatrix.handler(ctx, {
      companyId: args.companyId,
      branchId: args.branchId,
    });

    const auditRecord: AuditRecord = {
      runId: `audit_${startTime}`,
      triggeredBy: args.triggeredBy || "manual",
      overallScore: coverage.overall,
      totalModules: coverage.totalModules,
      completeCount: coverage.completeModules,
      criticalCount: coverage.criticalModules,
      moduleResults: coverage.modules.map((m) => ({
        module: m.module,
        displayName: m.displayName,
        percentage: m.percentage,
        status: m.status,
      })),
      generatedAt: startTime,
      duration: Date.now() - startTime,
    };

    // Store the audit result
    await ctx.db.insert("integrationAuditRecords", {
      ...auditRecord,
      triggeredBy: args.triggeredBy || "manual",
      createdAt: startTime,
    });

    return auditRecord;
  },
});

// ─── Get Latest Audit ───────────────────────────────────────

export const getLatestAudit = query({
  handler: async (ctx) => {
    const audits = await ctx.db.query("integrationAuditRecords")
      .order("desc")
      .collect();

    return (audits as any[])[0] || null;
  },
});

// ─── Get Audit History ──────────────────────────────────────

export const getAuditHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const audits = await ctx.db.query("integrationAuditRecords")
      .order("desc")
      .collect();

    return (audits as any[]).slice(0, args.limit || 20).map((a: any) => ({
      runId: a.runId,
      triggeredBy: a.triggeredBy,
      overallScore: a.overallScore,
      completeCount: a.completeCount,
      criticalCount: a.criticalCount,
      generatedAt: a.generatedAt,
      duration: a.duration,
    }));
  },
});

// ─── Pre-Release Audit ──────────────────────────────────────

export const runPreReleaseAudit = mutation({
  handler: async (ctx) => {
    const audit = await runIntegrationAudit.handler(ctx, { triggeredBy: "pre_release" });

    const blockers = audit.moduleResults.filter((m) => m.status === "Critical");

    return {
      ...audit,
      releaseReadiness: audit.overallScore >= 80 ? "READY" : "BLOCKED",
      blockers: blockers.map((b) => `${b.displayName}: ${b.percentage}% compliance`),
      minimumScore: 80,
      passed: audit.overallScore >= 80 && blockers.length === 0,
    };
  },
});

// ─── Scheduled Daily Audit ──────────────────────────────────

export const runScheduledAudit = internalMutation({
  handler: async (ctx) => {
    return runIntegrationAudit.handler(ctx, { triggeredBy: "scheduled" });
  },
});

// ─── Post-Deployment Audit ──────────────────────────────────

export const runPostDeploymentAudit = mutation({
  handler: async (ctx) => {
    const audit = await runIntegrationAudit.handler(ctx, { triggeredBy: "deployment" });

    // If score dropped significantly, log a warning
    const previous = await getLatestAudit.handler(ctx);
    let scoreChange = 0;
    if (previous && previous.overallScore) {
      scoreChange = audit.overallScore - previous.overallScore;
    }

    return {
      ...audit,
      previousScore: previous?.overallScore || null,
      scoreChange,
      regression: scoreChange < -10 ? true : false,
      message: scoreChange < -10
        ? `WARNING: Overall score dropped by ${Math.abs(scoreChange)}% compared to previous audit`
        : `Deployment verified: ${audit.overallScore}% overall compliance`,
    };
  },
});

// ─── Generate Coverage Report ──────────────────────────────

export const getCoverageReport = query({
  args: {
    runId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.runId) {
      const audits = await ctx.db.query("integrationAuditRecords")
        .filter((q: any) => q.eq(q.field("runId"), args.runId))
        .collect();
      return (audits as any[])[0] || null;
    }

    return getLatestAudit.handler(ctx);
  },
});

// ─── Coverage Over Time ────────────────────────────────────

export const getCoverageOverTime = query({
  handler: async (ctx) => {
    const audits = await ctx.db.query("integrationAuditRecords")
      .order("asc")
      .collect();

    return (audits as any[]).map((a: any) => ({
      date: new Date(a.generatedAt).toISOString().substring(0, 10),
      score: a.overallScore,
      triggeredBy: a.triggeredBy,
      completeCount: a.completeCount,
    }));
  },
});

// ─── Module Compliance Detail ──────────────────────────────

export const getModuleComplianceDetail = query({
  args: { module: v.string() },
  handler: async (ctx, args) => {
    const coverage = await generateCoverageMatrix.handler(ctx, {});
    return coverage.modules.find((m) => m.module === args.module) || null;
  },
});
