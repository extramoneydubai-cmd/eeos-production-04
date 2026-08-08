/**
 * Attendance Engine — Employee & Student Attendance Tracking
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every attendance mutation routes through withScopeAndEvents() so
// records emit audit, timeline, event-bus, workflow, automation and
// dashboard-refresh signals. getUserId returns undefined
// intentionally (consistent with the adopted engines): attendance
// args carry no reliable performer id for scope enforcement today,
// so scope checks stay no-ops while the pipeline is fully wired.
const attendancePipeline = {
  module: "hr",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: false,
  triggerAutomation: true,
  registerSearch: false,
  signalDashboard: true,
} as const;

export const markAttendance = mutation({
  args: {
    token: v.optional(v.string()),
    entityType: v.union(v.literal("student"), v.literal("employee")),
    entityId: v.id("users"),
    date: v.number(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late"), v.literal("half_day"), v.literal("holiday")),
    checkIn: v.optional(v.number()),
    checkOut: v.optional(v.number()),
    notes: v.optional(v.string()),
    markedBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...attendancePipeline,
      operation: "create",
      entity: "attendance",
      eventType: Events.HR.ATTENDANCE_MARKED,
      title: "Attendance marked",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      // Check if already marked for this date
      const existing = await ctx.db.query("attendanceRecords")
        .withIndex("entityType_entityId_date", (q: any) =>
          q.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("date", args.date))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: args.status,
          checkIn: args.checkIn || existing.checkIn,
          checkOut: args.checkOut || existing.checkOut,
          notes: args.notes,
          updatedAt: Date.now(),
        });
        return existing._id;
      }

      return ctx.db.insert("attendanceRecords", {
        entityType: args.entityType,
        entityId: args.entityId,
        date: args.date,
        status: args.status,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        notes: args.notes,
        markedBy: args.markedBy || userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});

export const bulkMarkAttendance = mutation({
  args: {
    token: v.optional(v.string()),
    entityType: v.union(v.literal("student"), v.literal("employee")),
    date: v.number(),
    records: v.array(v.object({
      entityId: v.id("users"),
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late"), v.literal("half_day")),
      checkIn: v.optional(v.number()),
      checkOut: v.optional(v.number()),
    })),
  },
  handler: withScopeAndEvents(
    {
      ...attendancePipeline,
      operation: "create",
      entity: "attendance",
      eventType: "hr.attendance.bulk_marked",
      title: "Bulk attendance marked",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const ids: any[] = [];
      for (const record of args.records) {
        const existing = await ctx.db.query("attendanceRecords")
          .withIndex("entityType_entityId_date", (q: any) =>
            q.eq("entityType", args.entityType).eq("entityId", record.entityId).eq("date", args.date))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, { status: record.status, updatedAt: Date.now() });
          ids.push(existing._id);
        } else {
          const id = await ctx.db.insert("attendanceRecords", {
            entityType: args.entityType,
            entityId: record.entityId,
            date: args.date,
            status: record.status,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            markedBy: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          ids.push(id);
        }
      }
      return ids;
    },
  ),
});

export const getAttendance = query({
  args: {
    entityType: v.union(v.literal("student"), v.literal("employee")),
    entityId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("attendanceRecords")
      .withIndex("entityType_entityId", (q2: any) =>
        q2.eq("entityType", args.entityType).eq("entityId", args.entityId));
    let results = await q.order("desc").collect();
    if (args.startDate) results = results.filter((r: any) => r.date >= args.startDate!);
    if (args.endDate) results = results.filter((r: any) => r.date <= args.endDate!);
    if (args.limit) results = results.slice(0, args.limit);
    return results;
  },
});

export const getAttendanceSummary = query({
  args: {
    entityType: v.union(v.literal("student"), v.literal("employee")),
    entityId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db.query("attendanceRecords")
      .withIndex("entityType_entityId", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .collect();

    const filtered = records.filter((r: any) => r.date >= args.startDate && r.date <= args.endDate);
    const present = filtered.filter((r: any) => r.status === "present").length;
    const absent = filtered.filter((r: any) => r.status === "absent").length;
    const late = filtered.filter((r: any) => r.status === "late").length;
    const halfDay = filtered.filter((r: any) => r.status === "half_day").length;

    return {
      total: filtered.length,
      present,
      absent,
      late,
      halfDay,
      attendancePercent: filtered.length > 0
        ? Math.round(((present + late + halfDay) / filtered.length) * 100)
        : 0,
    };
  },
});
