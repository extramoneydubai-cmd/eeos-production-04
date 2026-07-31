/**
 * Module Activation Engine — Per-company and per-branch module enable/disable.
 *
 * Super Admin can enable/disable entire modules per company.
 * Branches can override company settings.
 * The sidebar and routes should respect these settings.
 *
 * Inheritance chain: Platform → Company → Branch
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export type ModuleName = string;
export interface ModuleActivationResult {
  module: string;
  enabled: boolean;
  source: "platform_default" | "company" | "branch";
  config?: Record<string, any>;
}

// All available modules in the platform
export const ALL_MODULES: string[] = [
  "dashboard", "organization", "masterdata", "accesscontrol",
  "workflow", "tasks", "calendar", "crm", "sales",
  "students", "academic", "finance", "people", "employees",
  "marketing", "administration", "procurement", "lms",
  "communication", "analytics", "documents", "recruiting",
  "examinations", "executive", "configuration", "governance",
  "settings", "support", "inventory", "production",
  "knowledge", "hr", "payroll", "attendance",
];

/** Check if a module is enabled for a given company/branch */
export const isModuleEnabled = query({
  args: {
    module: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args): Promise<ModuleActivationResult> => {
    // 1. Check branch-level activation (highest priority)
    if (args.branchId) {
      const branchActivation = await ctx.db.query("moduleActivations")
        .withIndex("by_module_company", (q: any) =>
          q.eq("module", args.module).eq("companyId", args.companyId!)
        )
        .filter((q: any) => q.eq(q.field("branchId"), args.branchId))
        .first();
      if (branchActivation) {
        return {
          module: args.module,
          enabled: branchActivation.enabled,
          source: "branch",
          config: branchActivation.config,
        };
      }
    }

    // 2. Check company-level activation
    if (args.companyId) {
      const companyActivation = await ctx.db.query("moduleActivations")
        .withIndex("by_module_company", (q: any) =>
          q.eq("module", args.module).eq("companyId", args.companyId!)
        )
        .filter((q: any) => q.eq(q.field("branchId"), undefined))
        .first();
      if (companyActivation) {
        return {
          module: args.module,
          enabled: companyActivation.enabled,
          source: "company",
          config: companyActivation.config,
        };
      }
    }

    // 3. Default: all modules enabled
    return { module: args.module, enabled: true, source: "platform_default" };
  },
});

/** Get all module activation states for a company */
export const getCompanyModuleActivations = query({
  args: {
    companyId: v.id("companies"),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const results: ModuleActivationResult[] = [];

    for (const module of ALL_MODULES) {
      const result = await (isModuleEnabled as any)(ctx, {
        module,
        companyId: args.companyId,
        branchId: args.branchId,
      });
      results.push(result);
    }

    return results;
  },
});

/** Get all custom activations (not platform defaults) */
export const getCustomActivations = query({
  args: { companyId: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    let activations = await ctx.db.query("moduleActivations").collect();
    if (args.companyId) {
      activations = activations.filter((a: any) => (a as any).companyId === args.companyId);
    }
    return activations;
  },
});

// ─── CRUD Mutations ──────────────────────────────────────────

export const setModuleActivation = mutation({
  args: {
    module: v.string(),
    companyId: v.id("companies"),
    branchId: v.optional(v.id("branches")),
    enabled: v.boolean(),
    config: v.optional(v.any()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if an activation record already exists
    let existingQuery = ctx.db.query("moduleActivations")
      .withIndex("by_module_company", (q: any) =>
        q.eq("module", args.module).eq("companyId", args.companyId)
      );

    if (args.branchId) {
      existingQuery = existingQuery.filter((q: any) => q.eq(q.field("branchId"), args.branchId));
    } else {
      existingQuery = existingQuery.filter((q: any) => q.eq(q.field("branchId"), undefined));
    }

    const existing = await existingQuery.first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        config: args.config,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("moduleActivations", {
      module: args.module,
      companyId: args.companyId,
      branchId: args.branchId,
      enabled: args.enabled,
      config: args.config,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteModuleActivation = mutation({
  args: { activationId: v.id("moduleActivations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.activationId);
  },
});
