/**
 * Attendance SDK — Employee & Student Attendance Data Layer
 *
 * Wires existing attendanceEngine.ts, attendanceRecords schema.
 * Supports: manual, QR, face recognition, biometric, GPS modes.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const records = await PlatformSDK.attendance.mark(ctx, { ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Attendance Status & Types ───────────────────────────────

export const ATTENDANCE_MODES = [
  "manual", "qr", "face_recognition", "biometric", "gps", "nfc", "rfid",
] as const;

export const ATTENDANCE_STATUSES = [
  "present", "absent", "late", "half_day", "holiday", "on_leave",
] as const;

// ─── SDK Queries ─────────────────────────────────────────────

/**
 * Get attendance records for a date range.
 */
export const getRecords = query({
  args: {
    entityType: v.union(v.literal("student"), v.literal("employee"), v.literal("faculty")),
    entityId: v.optional(v.string()),
    batchId: v.optional(v.id("academicBatches")),
    startDate: v.number(),
    endDate: v.number(),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db.query("attendanceRecords");
      // Apply filters
      const all = await query.collect();
      let filtered = all.filter((r: any) => {
        if (args.entityType && (r as any).entityType !== args.entityType) return false;
        if (args.entityId && (r as any).entityId !== args.entityId) return false;
        if (args.batchId && (r as any).batchId !== args.batchId) return false;
        if (args.startDate && (r as any).date < args.startDate) return false;
        if (args.endDate && (r as any).date > args.endDate) return false;
        if (args.branchId && (r as any).branchId !== args.branchId) return false;
        return true;
      });
      return { records: filtered.sort((a: any, b: any) => b.date - a.date), total: filtered.length };
    } catch {
      return { records: [], total: 0 };
    }
  },
});

/**
 * Get attendance summary (percentage, present/absent counts).
 */
export const getSummary = query({
  args: {
    entityType: v.union(v.literal("student"), v.literal("employee"), v.literal("faculty")),
    entityId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const since = Date.now() - ((args.days || 30) * 24 * 60 * 60 * 1000);
      const all = await ctx.db.query("attendanceRecords").collect();
      const records = all.filter((r: any) =>
        (r as any).entityId === args.entityId &&
        (r as any).entityType === args.entityType &&
        (r as any).date >= since
      );
      const total = records.length;
      const present = records.filter((r: any) => (r as any).status === "present").length;
      const absent = records.filter((r: any) => (r as any).status === "absent").length;
      const late = records.filter((r: any) => (r as any).status === "late").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { total, present, absent, late, percentage, halfDay: records.filter((r: any) => (r as any).status === "half_day").length };
    } catch {
      return { total: 0, present: 0, absent: 0, late: 0, percentage: 0, halfDay: 0 };
    }
  },
});

/**
 * Get today's attendance stats for a branch.
 */
export const getTodayStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    const endOfDay = startOfDay + 86400000;

    try {
      const all = await ctx.db.query("attendanceRecords").collect();
      const todayRecords = all.filter((r: any) =>
        (r as any).date >= startOfDay && (r as any).date < endOfDay &&
        (!args.branchId || (r as any).branchId === args.branchId)
      );
      return {
        total: todayRecords.length,
        present: todayRecords.filter((r: any) => (r as any).status === "present").length,
        absent: todayRecords.filter((r: any) => (r as any).status === "absent").length,
        late: todayRecords.filter((r: any) => (r as any).status === "late").length,
      };
    } catch {
      return { total: 0, present: 0, absent: 0, late: 0 };
    }
  },
});

// ─── SDK Mutations ───────────────────────────────────────────

/**
 * Mark attendance for one or more individuals.
 */
export const mark = mutation({
  args: {
    records: v.array(v.object({
      entityType: v.union(v.literal("student"), v.literal("employee"), v.literal("faculty")),
      entityId: v.string(),
      entityName: v.optional(v.string()),
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late"), v.literal("half_day"), v.literal("holiday")),
      date: v.number(),
      batchId: v.optional(v.id("academicBatches")),
      branchId: v.optional(v.id("branches")),
      companyId: v.optional(v.id("companies")),
      mode: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      remarks: v.optional(v.string()),
    })),
    markedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const record of args.records) {
      // Check for duplicate
      const existing = await ctx.db.query("attendanceRecords")
        .filter((q: any) => q.and(
          q.eq(q.field("entityId"), record.entityId),
          q.eq(q.field("date"), record.date),
          q.eq(q.field("entityType"), record.entityType),
        ))
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, { status: record.status, remarks: record.remarks, markedBy: args.markedBy, updatedAt: Date.now() });
        results.push({ id: existing._id, action: "updated" });
      } else {
        const id = await ctx.db.insert("attendanceRecords", {
          entityType: record.entityType,
          entityId: record.entityId,
          entityName: record.entityName || "",
          status: record.status,
          date: record.date,
          batchId: record.batchId,
          branchId: record.branchId,
          companyId: record.companyId,
          mode: record.mode || "manual",
          latitude: record.latitude,
          longitude: record.longitude,
          remarks: record.remarks,
          markedBy: args.markedBy,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push({ id, action: "created" });
      }
    }
    return { count: results.length, results };
  },
});

/**
 * Bulk correct attendance (approval workflow).
 */
export const correct = mutation({
  args: {
    recordIds: v.array(v.id("attendanceRecords")),
    newStatus: v.union(v.literal("present"), v.literal("absent"), v.literal("late"), v.literal("half_day")),
    reason: v.string(),
    correctedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.recordIds) {
      await ctx.db.patch(id, { status: args.newStatus, remarks: args.reason, updatedAt: now });
    }
    return { count: args.recordIds.length, status: args.newStatus };
  },
});

// ─── Attendance Policy SDK — wires ruleRuntimeEngine ─────────────────────

/**
 * Get configured attendance policy rules (grace, late, half-day, absent thresholds).
 */
export const getAttendancePolicy = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { getDomainRules } = await import("../../convex/ruleRuntimeEngine");
    return getDomainRules.handler(ctx, { domain: "attendance", companyId: args.companyId, branchId: args.branchId });
  },
});

/**
 * Classify a check-in against configured policies (present/late/half_day/absent).
 */
export const classifyAttendance = query({
  args: {
    minutesLate: v.number(),
    isHoliday: v.optional(v.boolean()),
    isWeekend: v.optional(v.boolean()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { classifyAttendance } = await import("../../convex/ruleRuntimeEngine");
    return classifyAttendance.handler(ctx, args);
  },
});

/**
 * Calculate overtime against configured policy.
 */
export const calculateOvertime = query({
  args: {
    workedHours: v.number(),
    requiredHours: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { calculateOvertime } = await import("../../convex/ruleRuntimeEngine");
    return calculateOvertime.handler(ctx, args);
  },
});
