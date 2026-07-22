// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Sequence Engine (P0)
 *
 * Automatic number generation for every module in the platform.
 *
 * DOC-22 reference: Sequence Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Features:
 * - Atomic, concurrent-safe number generation
 * - Configurable prefix, suffix, padding, increment
 * - Yearly / monthly / manual reset strategies
 * - Organization / branch / global scoping
 * - Full audit history
 * - Preview without consuming
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ─── Helpers ───────────────────────────────────────────────────

function formatSequenceNumber(prefix: string, currentNumber: number, padding: number, suffix: string): string {
  const padded = String(currentNumber).padStart(padding, "0");
  return `${prefix}${padded}${suffix}`;
}

function isResetNeeded(strategy: "none" | "yearly" | "monthly" | "manual", lastResetAt: number | undefined): boolean {
  if (strategy === "none" || strategy === "manual") return false;
  if (!lastResetAt) return true;
  const now = Date.now();
  const last = new Date(lastResetAt);
  const current = new Date(now);
  if (strategy === "yearly") return current.getFullYear() !== last.getFullYear();
  if (strategy === "monthly") return current.getFullYear() !== last.getFullYear() || current.getMonth() !== last.getMonth();
  return false;
}

// ─── Queries ───────────────────────────────────────────────────

export const list = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    scope: v.optional(v.union(v.literal("global"), v.literal("organization"), v.literal("branch"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    let configs = await ctx.db.query("sequence_configs").collect();
    if (args.isActive !== undefined) configs = configs.filter((c) => c.isActive === args.isActive);
    if (args.scope) configs = configs.filter((c) => c.scope === args.scope);
    if (args.search) {
      const q = args.search.toLowerCase();
      configs = configs.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));
    }
    configs.sort((a, b) => a.code.localeCompare(b.code));
    return configs;
  },
});

export const getById = query({
  args: { configId: v.id("sequence_configs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.get(args.configId);
  },
});

export const preview = query({
  args: { configId: v.id("sequence_configs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Sequence config not found");
    if (!config.isActive) throw new Error("Sequence is disabled");
    const needsReset = isResetNeeded(config.resetStrategy, config.lastResetAt);
    const effectiveNumber = needsReset ? config.startNumber : config.currentNumber;
    return {
      nextNumber: formatSequenceNumber(config.prefix, effectiveNumber, config.padding, config.suffix || ""),
      effectiveNumber,
      wouldReset: needsReset,
    };
  },
});

export const getHistory = query({
  args: { configId: v.id("sequence_configs"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const limit = args.limit || 50;
    const history = await ctx.db.query("sequence_history").withIndex("by_config_date", (q) => q.eq("configId", args.configId)).order("desc").take(limit);
    return history;
  },
});

export const getStatus = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const configs = await ctx.db.query("sequence_configs").collect();
    const total = configs.length;
    const active = configs.filter((c) => c.isActive).length;
    const disabled = total - active;
    const yearlyReset = configs.filter((c) => c.resetStrategy === "yearly").length;
    const monthlyReset = configs.filter((c) => c.resetStrategy === "monthly").length;
    return { total, active, disabled, yearlyReset, monthlyReset };
  },
});

// ─── Mutations ─────────────────────────────────────────────────

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    prefix: v.string(),
    suffix: v.optional(v.string()),
    padding: v.number(),
    startNumber: v.number(),
    increment: v.optional(v.number()),
    resetStrategy: v.union(v.literal("none"), v.literal("yearly"), v.literal("monthly"), v.literal("manual")),
    scope: v.union(v.literal("global"), v.literal("organization"), v.literal("branch")),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.query("sequence_configs").withIndex("by_code", (q) => q.eq("code", args.code)).first();
    if (existing) throw new Error(`Sequence code "${args.code}" already exists`);
    if (args.padding < 1) throw new Error("Padding must be at least 1");
    if (args.padding > 20) throw new Error("Padding must not exceed 20");
    if (args.startNumber < 0) throw new Error("Start number must be non-negative");
    if ((args.increment || 1) < 1) throw new Error("Increment must be at least 1");
    return await ctx.db.insert("sequence_configs", {
      code: args.code, name: args.name, prefix: args.prefix, suffix: args.suffix,
      padding: args.padding, currentNumber: args.startNumber, startNumber: args.startNumber,
      increment: args.increment || 1, resetStrategy: args.resetStrategy, lastResetAt: Date.now(),
      scope: args.scope, organizationId: args.organizationId, branchId: args.branchId,
      isActive: true, description: args.description, createdBy: userId, createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    configId: v.id("sequence_configs"),
    name: v.optional(v.string()), prefix: v.optional(v.string()), suffix: v.optional(v.string()),
    padding: v.optional(v.number()), startNumber: v.optional(v.number()), increment: v.optional(v.number()),
    resetStrategy: v.optional(v.union(v.literal("none"), v.literal("yearly"), v.literal("monthly"), v.literal("manual"))),
    scope: v.optional(v.union(v.literal("global"), v.literal("organization"), v.literal("branch"))),
    isActive: v.optional(v.boolean()), description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { configId, ...fields } = args;
    const existing = await ctx.db.get(configId);
    if (!existing) throw new Error("Sequence config not found");
    const updateFields: Record<string, unknown> = { updatedBy: userId, updatedAt: Date.now() };
    if (fields.name !== undefined) updateFields.name = fields.name;
    if (fields.prefix !== undefined) updateFields.prefix = fields.prefix;
    if (fields.suffix !== undefined) updateFields.suffix = fields.suffix;
    if (fields.padding !== undefined) { if (fields.padding < 1 || fields.padding > 20) throw new Error("Padding must be 1-20"); updateFields.padding = fields.padding; }
    if (fields.startNumber !== undefined) { if (fields.startNumber < 0) throw new Error("Start must be non-negative"); updateFields.startNumber = fields.startNumber; if (existing.currentNumber < fields.startNumber) updateFields.currentNumber = fields.startNumber; }
    if (fields.increment !== undefined) { if (fields.increment < 1) throw new Error("Increment must be at least 1"); updateFields.increment = fields.increment; }
    if (fields.resetStrategy !== undefined) updateFields.resetStrategy = fields.resetStrategy;
    if (fields.scope !== undefined) updateFields.scope = fields.scope;
    if (fields.isActive !== undefined) updateFields.isActive = fields.isActive;
    if (fields.description !== undefined) updateFields.description = fields.description;
    await ctx.db.patch(configId, updateFields);
    return configId;
  },
});

export const remove = mutation({
  args: { configId: v.id("sequence_configs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Sequence config not found");
    const history = await ctx.db.query("sequence_history").withIndex("by_config", (q) => q.eq("configId", args.configId)).first();
    if (history) throw new Error(`Cannot delete sequence "${config.code}" — has generation history. Archive it instead.`);
    await ctx.db.delete(args.configId);
    return args.configId;
  },
});

export const generateNext = mutation({
  args: { configId: v.id("sequence_configs"), entityType: v.optional(v.string()), entityId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Sequence config not found");
    if (!config.isActive) throw new Error(`Sequence "${config.code}" is disabled`);
    const needsReset = isResetNeeded(config.resetStrategy, config.lastResetAt);
    let nextNumber: number;
    let wasReset = false;
    if (needsReset) {
      nextNumber = config.startNumber;
      await ctx.db.patch(args.configId, { currentNumber: config.startNumber + config.increment, lastResetAt: Date.now(), updatedAt: Date.now(), updatedBy: userId });
      wasReset = true;
    } else {
      nextNumber = config.currentNumber;
      await ctx.db.patch(args.configId, { currentNumber: config.currentNumber + config.increment, updatedAt: Date.now(), updatedBy: userId });
    }
    const formatted = formatSequenceNumber(config.prefix, nextNumber, config.padding, config.suffix || "");
    await ctx.db.insert("sequence_history", { configId: args.configId, number: formatted, entityType: args.entityType, entityId: args.entityId, generatedBy: userId, generatedAt: Date.now() });
    return { number: formatted, sequence: config.code, wasReset, currentNumber: needsReset ? config.startNumber + config.increment : config.currentNumber + config.increment };
  },
});

export const reset = mutation({
  args: { configId: v.id("sequence_configs"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Sequence config not found");
    await ctx.db.patch(args.configId, { currentNumber: config.startNumber, lastResetAt: Date.now(), updatedAt: Date.now(), updatedBy: userId });
    await ctx.db.insert("sequence_history", {
      configId: args.configId, number: `RESET→${formatSequenceNumber(config.prefix, config.startNumber, config.padding, config.suffix || "")}`,
      entityType: "system", entityId: "reset", generatedBy: userId, generatedAt: Date.now(),
      metadata: { reason: args.reason || "Manual reset", previousNumber: config.currentNumber },
    });
    return { configId: args.configId, code: config.code, resetTo: config.startNumber };
  },
});
