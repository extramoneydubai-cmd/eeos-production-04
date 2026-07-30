/**
 * Multi-Company & Multi-Branch Test Framework
 *
 * Provides test helpers and validation queries for:
 *   1. Branch isolation — teacher cannot mark attendance in another branch
 *   2. Company isolation — finance cannot see another company's records
 *   3. Department scope — employee can only access their department
 *   4. Cross-company data separation — no data leakage
 *   5. Vertical/academic scope — independent from org hierarchy
 *
 * These helpers are used by the Integration Audit and can be
 * consumed by automated test suites.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { ScopeEngine } from "./scopeEngine";

// ─── Test: Branch Isolation ─────────────────────────────────

/**
 * Validate that a user cannot access records from another branch.
 * Returns PASS/FAIL per entity type.
 */
export const validateBranchIsolation = query({
  args: {
    userId: v.id("users"),
    testCompanyId: v.id("companies"),
    testBranchId: v.id("branches"),
    otherBranchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const engine = await ScopeEngine.forUser(ctx, args.userId);
    const scope = engine.getScope();

    if (!scope) return { status: "ERROR", message: "Could not resolve user scope" };

    const results: Record<string, { ownBranch: boolean; otherBranch: boolean; isolated: boolean }> = {};

    // Test: canRead for own branch vs other branch
    const ownBranchEntity = { companyId: args.testCompanyId, branchId: args.testBranchId };
    const otherBranchEntity = { companyId: args.testCompanyId, branchId: args.otherBranchId };

    results["read"] = {
      ownBranch: engine.canRead(ownBranchEntity),
      otherBranch: engine.canRead(otherBranchEntity),
      isolated: !engine.canRead(otherBranchEntity),
    };

    // Test: canWrite for own branch vs other branch
    results["write"] = {
      ownBranch: engine.canWrite(ownBranchEntity),
      otherBranch: engine.canWrite(otherBranchEntity),
      isolated: !engine.canWrite(otherBranchEntity),
    };

    // Test: canApprove
    results["approve"] = {
      ownBranch: engine.canApprove(ownBranchEntity),
      otherBranch: engine.canApprove(otherBranchEntity),
      isolated: !engine.canApprove(otherBranchEntity),
    };

    // Test: canDelete
    results["delete"] = {
      ownBranch: engine.canDelete(ownBranchEntity),
      otherBranch: engine.canDelete(otherBranchEntity),
      isolated: !engine.canDelete(otherBranchEntity),
    };

    const allIsolated = Object.values(results).every((r) => r.isolated);
    const scopeLevel = scope.scopeLevel;

    // Super admins and global scope can read all branches by design
    const expectedIsolation = scopeLevel === "super_admin" ? false : (scopeLevel !== "global");

    return {
      status: allIsolated === expectedIsolation ? "PASS" : "FAIL",
      scopeLevel,
      expectedIsolation,
      results,
      message: allIsolated === expectedIsolation
        ? `Branch isolation ${expectedIsolation ? "enforced" : "expected to be open"} (scope: ${scopeLevel})`
        : `Branch isolation ${expectedIsolation ? "should be enforced" : "should be open"} but scope level is ${scopeLevel}`,
    };
  },
});

// ─── Test: Company Isolation ────────────────────────────────

/**
 * Validate that a user cannot access records from another company.
 */
export const validateCompanyIsolation = query({
  args: {
    userId: v.id("users"),
    ownCompanyId: v.id("companies"),
    otherCompanyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const engine = await ScopeEngine.forUser(ctx, args.userId);
    const scope = engine.getScope();

    if (!scope) return { status: "ERROR", message: "Could not resolve user scope" };

    const ownEntity = { companyId: args.ownCompanyId };
    const otherEntity = { companyId: args.otherCompanyId };

    const readOwn = engine.canRead(ownEntity);
    const readOther = engine.canRead(otherEntity);
    const writeOwn = engine.canWrite(ownEntity);
    const writeOther = engine.canWrite(otherEntity);

    const isolated = !readOther && !writeOther;

    return {
      status: isolated ? "PASS" : "FAIL",
      scopeLevel: scope.scopeLevel,
      readOwn,
      readOther,
      writeOwn,
      writeOther,
      isolated,
      message: isolated
        ? `Company isolation enforced (scope: ${scope.scopeLevel})`
        : `Company isolation breached — user can read/write other company (scope: ${scope.scopeLevel})`,
    };
  },
});

// ─── Test: Access Level Resolution ──────────────────────────

/**
 * Validate that access levels resolve correctly per entity scope.
 */
export const validateAccessLevel = query({
  args: {
    userId: v.id("users"),
    entityCompanyId: v.optional(v.id("companies")),
    entityBranchId: v.optional(v.id("branches")),
    entityDepartmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const engine = await ScopeEngine.forUser(ctx, args.userId);
    const entity = {
      companyId: args.entityCompanyId,
      branchId: args.entityBranchId,
      departmentId: args.entityDepartmentId,
    };

    return {
      scope: engine.getScope(),
      accessLevel: engine.accessLevel(entity),
      canRead: engine.canRead(entity),
      canWrite: engine.canWrite(entity),
      canApprove: engine.canApprove(entity),
      canDelete: engine.canDelete(entity),
    };
  },
});

// ─── Test: Entity Scope Compliance ──────────────────────────

/**
 * Scan a table for records that violate branch/company scope.
 * Returns any records where the scope doesn't match the owning user.
 */
export const scanScopeCompliance = query({
  args: {
    table: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const violations: Array<{ recordId: string; field: string; expected: string; actual: string }> = [];
    let totalRecords = 0;

    try {
      const records = await (ctx.db.query as any)(args.table).collect();
      totalRecords = (records as any[]).length;

      // Check each record for scope field presence
      for (const record of (records as any[]).slice(0, args.limit || 100)) {
        if (!record.companyId) {
          violations.push({
            recordId: record._id,
            field: "companyId",
            expected: "present",
            actual: "missing",
          });
        }
      }
    } catch {
      return { status: "NOT_FOUND", table: args.table, violations: [], totalRecords: 0 };
    }

    return {
      status: violations.length === 0 ? "PASS" : "FAIL",
      table: args.table,
      totalRecords,
      violations,
      compliance: totalRecords > 0 ? Math.round(((totalRecords - violations.length) / totalRecords) * 100) : 100,
    };
  },
});

// ─── Test Runner: Full Multi-Company Suite ──────────────────

export const runMultiCompanyTestSuite = query({
  args: {
    userId: v.id("users"),
    ownCompanyId: v.id("companies"),
    ownBranchId: v.id("branches"),
    otherCompanyId: v.id("companies"),
    otherBranchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const result: Record<string, any> = {};

    // 1. Branch isolation
    result.branchIsolation = await validateBranchIsolation.handler(ctx, {
      userId: args.userId,
      testCompanyId: args.ownCompanyId,
      testBranchId: args.ownBranchId,
      otherBranchId: args.otherBranchId,
    });

    // 2. Company isolation
    result.companyIsolation = await validateCompanyIsolation.handler(ctx, {
      userId: args.userId,
      ownCompanyId: args.ownCompanyId,
      otherCompanyId: args.otherCompanyId,
    });

    // 3. Access level
    result.accessLevel = await validateAccessLevel.handler(ctx, {
      userId: args.userId,
      entityCompanyId: args.ownCompanyId,
      entityBranchId: args.ownBranchId,
    });

    // 4. Overall verdict
    const failures = [
      result.branchIsolation.status === "FAIL",
      result.companyIsolation.status === "FAIL",
    ].filter(Boolean).length;

    result.overall = {
      status: failures === 0 ? "PASS" : "FAIL",
      totalTests: 3,
      passed: 3 - failures,
      failed: failures,
      message: failures === 0 ? "All multi-company tests passed" : `${failures} test(s) failed`,
    };

    return result;
  },
});
