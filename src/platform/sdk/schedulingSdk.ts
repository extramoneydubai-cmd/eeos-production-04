/**
 * Scheduling SDK — Enterprise Scheduling Data Access Layer
 *
 * Every business module MUST use this SDK for scheduling operations.
 * No module may directly query the "schedules" table.
 *
 * Integrates with:
 * - Scheduling Engine (CRUD)
 * - Teacher Scheduling Engine (AI timetable, load, conflicts, substitutes)
 * - Conflict Engine (conflict detection)
 * - Availability Engine (availability checks)
 * - Booking Engine (booking management)
 * - Calendar SDK (calendar visualization)
 * - Event SDK (audit/timeline)
 * - Dashboard SDK (KPIs)
 *
 * Usage:
 *   import { schedulingSdk } from "@/platform/sdk/schedulingSdk";
 *   const schedule = await schedulingSdk.get(ctx, { scheduleId });
 *   const list = await schedulingSdk.list(ctx, { ...filters });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Queries ──────────────────────────────────────────────────

/**
 * Get a schedule by ID.
 */
export const get = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.scheduleId);
  },
});

/**
 * List schedules with filters.
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    scheduleType: v.optional(v.string()),
    owner: v.optional(v.id("users")),
    resourceId: v.optional(v.id("schedulingResources")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    startAfter: v.optional(v.number()),
    startBefore: v.optional(v.number()),
    endAfter: v.optional(v.number()),
    endBefore: v.optional(v.number()),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("schedules");
    const all = await query.collect();
    const limit = args.limit || 50;

    let filtered = all.sort((a: any, b: any) => (a.start || 0) - (b.start || 0));

    if (args.status) filtered = filtered.filter((e: any) => e.status === args.status);
    if (args.scheduleType) filtered = filtered.filter((e: any) => e.scheduleType === args.scheduleType);
    if (args.owner) filtered = filtered.filter((e: any) => e.owner === args.owner);
    if (args.resourceId) filtered = filtered.filter((e: any) => e.resourceId === args.resourceId);
    if (args.entityType) filtered = filtered.filter((e: any) => e.entityType === args.entityType);
    if (args.entityId) filtered = filtered.filter((e: any) => e.entityId === args.entityId);
    if (args.companyId) filtered = filtered.filter((e: any) => e.companyId === args.companyId);
    if (args.branchId) filtered = filtered.filter((e: any) => e.branchId === args.branchId);
    if (args.departmentId) filtered = filtered.filter((e: any) => e.departmentId === args.departmentId);
    if (args.startAfter) filtered = filtered.filter((e: any) => e.start >= args.startAfter!);
    if (args.startBefore) filtered = filtered.filter((e: any) => e.start <= args.startBefore!);
    if (args.endAfter) filtered = filtered.filter((e: any) => e.end >= args.endAfter!);
    if (args.endBefore) filtered = filtered.filter((e: any) => e.end <= args.endBefore!);
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter((e: any) =>
        e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
      );
    }
    if (args.tags?.length) {
      filtered = filtered.filter((e: any) =>
        e.tags?.some((t: string) => args.tags!.includes(t))
      );
    }

    return { items: filtered.slice(0, limit) };
  },
});

/**
 * Search schedules by text.
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    scheduleType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("schedules").collect();
    const q = args.searchTerm.toLowerCase();
    let filtered = all.filter((s: any) =>
      s.title?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
    if (args.scheduleType) filtered = filtered.filter((s: any) => s.scheduleType === args.scheduleType);
    return filtered.slice(0, args.limit || 20);
  },
});

/**
 * Get schedules for a date range.
 */
export const getByDateRange = query({
  args: {
    start: v.number(),
    end: v.number(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    resourceId: v.optional(v.id("schedulingResources")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("schedules").collect();
    let filtered = all.filter((s: any) =>
      s.start >= args.start && s.start <= args.end &&
      s.status !== "cancelled" && s.status !== "archived"
    );
    if (args.companyId) filtered = filtered.filter((s: any) => s.companyId === args.companyId);
    if (args.branchId) filtered = filtered.filter((s: any) => s.branchId === args.branchId);
    if (args.resourceId) filtered = filtered.filter((s: any) => s.resourceId === args.resourceId);
    return filtered.sort((a: any, b: any) => a.start - b.start).slice(0, args.limit || 500);
  },
});

/**
 * Get today's schedules.
 */
export const getToday = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = startOfDay.getTime() + 24 * 60 * 60 * 1000;
    return getByDateRange.handler(ctx, { start: startOfDay.getTime(), end: endOfDay, ...args });
  },
});

/**
 * Get upcoming schedules (today + next N days).
 */
export const getUpcoming = query({
  args: {
    days: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const end = now + (args.days || 7) * 24 * 60 * 60 * 1000;
    return getByDateRange.handler(ctx, { start: now, end, ...args });
  },
});

/**
 * Get scheduling KPI counts.
 */
export const getCounts = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let all = await ctx.db.query("schedules").collect();
    if (args.companyId) all = all.filter((s: any) => s.companyId === args.companyId);
    if (args.branchId) all = all.filter((s: any) => s.branchId === args.branchId);
    const now = Date.now();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = startOfDay.getTime() + 24 * 60 * 60 * 1000;
    return {
      total: all.length,
      today: all.filter((s: any) => s.start >= startOfDay.getTime() && s.start < endOfDay).length,
      upcoming: all.filter((s: any) => s.start >= now && s.start < now + 7 * 86400000).length,
      pending: all.filter((s: any) => s.status === "pending_approval").length,
      completed: all.filter((s: any) => s.status === "completed").length,
      cancelled: all.filter((s: any) => s.status === "cancelled").length,
    };
  },
});

/**
 * Get resources list.
 */
export const listResources = query({
  args: {
    resourceType: v.optional(v.string()),
    status: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let all = await ctx.db.query("schedulingResources").collect();
    if (args.resourceType) all = all.filter((r: any) => r.resourceType === args.resourceType);
    if (args.status) all = all.filter((r: any) => r.status === args.status);
    if (args.companyId) all = all.filter((r: any) => r.companyId === args.companyId);
    if (args.branchId) all = all.filter((r: any) => r.branchId === args.branchId);
    return all;
  },
});

/**
 * Get bookings for a schedule.
 */
export const getBookings = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    return ctx.db.query("schedulingBookings")
      .filter((q: any) => q.eq(q.field("scheduleId"), args.scheduleId))
      .collect();
  },
});

/**
 * Get booking stats.
 */
export const getBookingStats = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db.query("schedulingBookings")
      .filter((q: any) => q.eq(q.field("scheduleId"), args.scheduleId))
      .collect();
    return {
      total: bookings.length,
      confirmed: bookings.filter((b: any) => b.status === "confirmed").length,
      cancelled: bookings.filter((b: any) => b.status === "cancelled").length,
      completed: bookings.filter((b: any) => b.status === "completed").length,
      noShow: bookings.filter((b: any) => b.status === "no_show").length,
    };
  },
});

// ─── SDK Mutations ────────────────────────────────────────────────

/**
 * Create a schedule.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    scheduleType: v.string(),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    start: v.number(),
    end: v.number(),
    timezone: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
    recurrenceEnd: v.optional(v.number()),
    owner: v.optional(v.id("users")),
    participants: v.optional(v.array(v.id("users"))),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    resourceId: v.optional(v.id("schedulingResources")),
    capacity: v.optional(v.number()),
    approvalRequired: v.optional(v.boolean()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    tags: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("schedules", {
      title: args.title,
      description: args.description,
      scheduleType: args.scheduleType,
      status: args.status || "scheduled",
      priority: args.priority || "medium",
      start: args.start,
      end: args.end,
      timezone: args.timezone,
      allDay: args.allDay || false,
      recurrence: args.recurrence || "none",
      recurrenceEnd: args.recurrenceEnd,
      owner: args.owner,
      participants: args.participants || [],
      entityType: args.entityType,
      entityId: args.entityId,
      resourceId: args.resourceId,
      capacity: args.capacity,
      currentBookings: 0,
      approvalRequired: args.approvalRequired || false,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      tags: args.tags || [],
      createdBy: args.createdBy,
      updatedBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a schedule.
 */
export const update = mutation({
  args: {
    scheduleId: v.id("schedules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduleType: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    timezone: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
    recurrenceEnd: v.optional(v.number()),
    owner: v.optional(v.id("users")),
    participants: v.optional(v.array(v.id("users"))),
    resourceId: v.optional(v.id("schedulingResources")),
    capacity: v.optional(v.number()),
    approvalRequired: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { scheduleId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(scheduleId, updates);
    return { success: true };
  },
});

/**
 * Delete a schedule.
 */
export const remove = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scheduleId);
    return { success: true };
  },
});

/**
 * Confirm (approve) a schedule.
 */
export const confirm = mutation({
  args: {
    scheduleId: v.id("schedules"),
    approvedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.scheduleId, {
      status: "confirmed",
      approvedBy: args.approvedBy,
      approvedAt: now,
      updatedAt: now,
    });
    return { success: true };
  },
});

/**
 * Complete a schedule.
 */
export const complete = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Cancel a schedule.
 */
export const cancel = mutation({
  args: {
    scheduleId: v.id("schedules"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelReason: args.reason,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Archive a schedule.
 */
export const archive = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      status: "archived",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Book a schedule (create a booking).
 */
export const book = mutation({
  args: {
    scheduleId: v.id("schedules"),
    resourceId: v.optional(v.id("schedulingResources")),
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    const currentBookings = schedule.currentBookings || 0;
    const capacity = schedule.capacity || 0;

    if (capacity > 0 && currentBookings >= capacity) {
      const waitingList = schedule.waitingList || [];
      waitingList.push(args.userId);
      await ctx.db.patch(args.scheduleId, { waitingList, updatedAt: Date.now() });
      return { success: false, waitlistPosition: waitingList.length, message: "Added to waitlist" };
    }

    const now = Date.now();
    const bookingId = await ctx.db.insert("schedulingBookings", {
      scheduleId: args.scheduleId,
      resourceId: args.resourceId,
      userId: args.userId,
      status: "confirmed",
      approvalStatus: schedule.approvalRequired ? "pending_approval" : "approved",
      companyId: args.companyId,
      branchId: args.branchId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.scheduleId, {
      currentBookings: currentBookings + 1,
      updatedAt: now,
    });

    return { success: true, bookingId, message: "Booking confirmed" };
  },
});

/**
 * Cancel a booking.
 */
export const cancelBooking = mutation({
  args: { bookingId: v.id("schedulingBookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    await ctx.db.patch(args.bookingId, { status: "cancelled", updatedAt: Date.now() });

    const schedule = await ctx.db.get(booking.scheduleId);
    if (schedule && schedule.currentBookings > 0) {
      await ctx.db.patch(booking.scheduleId, {
        currentBookings: schedule.currentBookings - 1,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Create a resource.
 */
export const createResource = mutation({
  args: {
    name: v.string(),
    resourceType: v.string(),
    description: v.optional(v.string()),
    capacity: v.number(),
    location: v.optional(v.string()),
    status: v.optional(v.string()),
    workingHours: v.optional(v.any()),
    approvalRequired: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    tags: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("schedulingResources", {
      name: args.name,
      resourceType: args.resourceType,
      description: args.description,
      capacity: args.capacity,
      location: args.location,
      status: args.status || "active",
      workingHours: args.workingHours,
      approvalRequired: args.approvalRequired || false,
      imageUrl: args.imageUrl,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      tags: args.tags || [],
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── Teacher Scheduling SDK — wires teacherSchedulingEngine (AI Timetable) ─

/**
 * Get a teacher's schedule for a date range (multi-branch aware).
 */
export const getTeacherSchedule = query({
  args: {
    teacherId: v.id("employees"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { getTeacherSchedule } = await import("../../convex/teacherSchedulingEngine");
    return getTeacherSchedule.handler(ctx, args);
  },
});

/**
 * Get teacher load (daily/weekly hours vs max, travel buffer, branches).
 */
export const getTeacherLoad = query({
  args: {
    teacherId: v.id("employees"),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const { getTeacherLoad } = await import("../../convex/teacherSchedulingEngine");
    return getTeacherLoad.handler(ctx, args);
  },
});

/**
 * Check teacher availability for a proposed time slot (conflict + load check).
 */
export const getTeacherAvailability = query({
  args: {
    teacherId: v.id("employees"),
    date: v.number(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const { getTeacherAvailability } = await import("../../convex/teacherSchedulingEngine");
    return getTeacherAvailability.handler(ctx, args);
  },
});

/**
 * Find substitute faculty for an absent teacher (match-score ranked).
 */
export const findSubstitute = query({
  args: {
    absentTeacherId: v.id("employees"),
    date: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    branchId: v.optional(v.id("branches")),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { findSubstitute } = await import("../../convex/teacherSchedulingEngine");
    return findSubstitute.handler(ctx, args);
  },
});

/**
 * Detect scheduling conflicts across teachers (time/branch/room overlaps).
 */
export const detectConflicts = query({
  args: {
    teacherIds: v.array(v.id("employees")),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const { detectConflicts } = await import("../../convex/teacherSchedulingEngine");
    return detectConflicts.handler(ctx, args);
  },
});

/**
 * Assign a schedule entry to a teacher (enforces max hours + travel buffer).
 */
export const assignTeacherSchedule = mutation({
  args: {
    teacherId: v.id("employees"),
    dayOfWeek: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    branchId: v.id("branches"),
    verticalId: v.optional(v.id("verticals")),
    batchId: v.optional(v.id("batches")),
    courseId: v.optional(v.id("courses")),
    subject: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    scheduleType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { assignTeacherSchedule } = await import("../../convex/teacherSchedulingEngine");
    return assignTeacherSchedule.handler(ctx, args);
  },
});

/**
 * Auto-assign the best substitute for an absent teacher.
 */
export const autoScheduleSubstitute = mutation({
  args: {
    absentTeacherId: v.id("employees"),
    date: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    branchId: v.optional(v.id("branches")),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { autoScheduleSubstitute } = await import("../../convex/teacherSchedulingEngine");
    return autoScheduleSubstitute.handler(ctx, args);
  },
});

/**
 * Update per-teacher scheduling settings (max hours, travel buffer, branches).
 */
export const updateTeacherSettings = mutation({
  args: {
    teacherId: v.id("employees"),
    maxDailyHours: v.optional(v.number()),
    maxWeeklyHours: v.optional(v.number()),
    travelBufferMinutes: v.optional(v.number()),
    branches: v.optional(v.array(v.id("branches"))),
  },
  handler: async (ctx, args) => {
    const { updateTeacherSettings } = await import("../../convex/teacherSchedulingEngine");
    return updateTeacherSettings.handler(ctx, args);
  },
});
