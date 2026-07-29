/**
 * Admin Engine — Super Admin Console
 *
 * System configuration, company management, branding, health monitoring,
 * scheduled jobs, license management, API keys, webhooks, and backups.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── System Configuration ──────────────────────────────────

export const getSystemConfig = query({
  handler: async (ctx) => {
    const config = await ctx.db.query("systemConfig").first();
    return config || { maintenanceMode: false, platformName: "EEOS", version: "1.0.0" };
  },
});

export const updateSystemConfig = mutation({
  args: { maintenanceMode: v.optional(v.boolean()), platformName: v.optional(v.string()), maxCompanies: v.optional(v.number()), storageLimit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("systemConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return existing._id;
    }
    return ctx.db.insert("systemConfig", { ...args, createdAt: Date.now(), updatedAt: Date.now() });
  },
});

// ─── Company Management ────────────────────────────────────

export const listCompanies = query({
  handler: async (ctx) => ctx.db.query("companies").collect(),
});

export const createCompany = mutation({
  args: { name: v.string(), code: v.string(), domain: v.optional(v.string()), gstNumber: v.optional(v.string()), address: v.optional(v.string()), contactEmail: v.optional(v.string()), contactPhone: v.optional(v.string()), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.insert("companies", { ...args, isActive: args.isActive ?? true, createdAt: Date.now(), updatedAt: Date.now() });
  },
});

// ─── Health Monitoring ─────────────────────────────────────

export const getSystemHealth = query({
  handler: async (ctx) => {
    const convexStatus = "connected";
    const dbStats = await ctx.db.query("users").collect();
    return {
      status: "healthy",
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      totalUsers: dbStats.length,
      databaseStatus: convexStatus,
      lastChecked: Date.now(),
    };
  },
});

// ─── Scheduled Jobs ────────────────────────────────────────

export const listScheduledJobs = query({
  handler: async (ctx) => ctx.db.query("scheduledJobs").collect(),
});

export const createScheduledJob = mutation({
  args: { name: v.string(), jobType: v.string(), schedule: v.string(), config: v.optional(v.string()), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    return ctx.db.insert("scheduledJobs", { ...args, isActive: args.isActive ?? true, lastRun: null, nextRun: null, createdAt: Date.now(), updatedAt: Date.now() });
  },
});

export const toggleJob = mutation({
  args: { id: v.id("scheduledJobs"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive, updatedAt: Date.now() });
    return args.id;
  },
});

// ─── API Keys ──────────────────────────────────────────────

export const listApiKeys = query({
  handler: async (ctx) => ctx.db.query("apiKeys").collect(),
});

export const createApiKey = mutation({
  args: { name: v.string(), scope: v.string(), expiresAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const key = `eek_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    return ctx.db.insert("apiKeys", { name: args.name, key, scope: args.scope, expiresAt: args.expiresAt, isActive: true, createdBy: userId, createdAt: Date.now() });
  },
});

export const revokeApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
    return args.id;
  },
});

// ─── Webhooks ──────────────────────────────────────────────

export const listWebhooks = query({
  handler: async (ctx) => ctx.db.query("webhooks").collect(),
});

export const createWebhook = mutation({
  args: { name: v.string(), url: v.string(), events: v.array(v.string()), secret: v.optional(v.string()), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    return ctx.db.insert("webhooks", { ...args, isActive: args.isActive ?? true, createdAt: Date.now() });
  },
});

// ─── Audit Log Viewer ──────────────────────────────────────

export const listAuditLogs = query({
  args: { limit: v.optional(v.number()), module: v.optional(v.string()), severity: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("auditLogs").order("desc").collect();
    if (args.module) logs = logs.filter((l: any) => l.module === args.module);
    if (args.severity) logs = logs.filter((l: any) => l.severity === args.severity);
    return logs.slice(0, args.limit || 100);
  },
});

// ─── Backup Management ─────────────────────────────────────

export const listBackups = query({
  handler: async (ctx) => ctx.db.query("backupRecords").order("desc").collect(),
});

export const createBackup = mutation({
  args: { backupType: v.union(v.literal("full"), v.literal("schema"), v.literal("config")), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db.insert("backupRecords", {
      backupType: args.backupType, notes: args.notes, status: "in_progress",
      fileSize: 0, createdBy: userId, createdAt: Date.now(), completedAt: null,
    });
  },
});

export const completeBackup = mutation({
  args: { id: v.id("backupRecords"), fileSize: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "completed", fileSize: args.fileSize, completedAt: Date.now() });
    return args.id;
  },
});
