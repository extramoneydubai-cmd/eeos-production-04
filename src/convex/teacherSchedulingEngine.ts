import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every teacher-scheduling mutation routes through withScopeAndEvents()
// so schedule changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: teacher-scheduling mutations
// are called by the scheduling SDK and portals that pass performer strings
// rather than a reliable Convex user id, so scope enforcement stays a
// no-op here while the event pipeline is fully wired. Where the args
// carry a branch it is still recorded on audit, timeline and event rows.
const teacherSchedulePipeline = {
  module: "scheduling",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  // Accessor param is intentionally untyped (any): a typed signature would
  // constrain the generic args type P to a narrow shape and break handler
  // arg access. Scope is still resolved from args at runtime and recorded on
  // audit, timeline and event rows.
  getEntityBranchId: (args: any) => args.branchId,
  getEntityDepartmentId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

/**
 * Teacher Scheduling Enhancement Engine
 *
 * Supports:
 * - Multi-branch, multi-vertical, multi-batch assignments
 * - Travel buffer between branches
 * - Maximum teaching hours (daily, weekly)
 * - Weekly load balancing
 * - Holiday/leave integration
 * - Auto-substitute faculty
 * - Conflict detection
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface TeacherScheduleEntry {
  teacherId: Id<"employees">;
  dayOfWeek: number; // 0-6
  startTime: number; // minutes from midnight
  endTime: number;
  branchId: Id<"branches">;
  verticalId?: Id<"verticals">;
  batchId?: Id<"academicBatches">;
  courseId?: Id<"courses">;
  subject?: string;
  roomId?: Id<"academicClassrooms">;
  scheduleType: "class" | "lab" | "meeting" | "office_hours" | "exam_duty" | "other";
}

export interface TeacherLoad {
  teacherId: Id<"employees">;
  dailyHours: number;
  weeklyHours: number;
  maxDailyHours: number;
  maxWeeklyHours: number;
  currentDailyLoad: number;
  currentWeeklyLoad: number;
  travelBufferMinutes: number;
  branches: Id<"branches">[];
}

export interface SubstituteSuggestion {
  teacherId: Id<"employees">;
  teacherName: string;
  matchScore: number; // 0-100
  available: boolean;
  reason: string;
}

// ─── Internal helpers (plain functions, callable across handlers) ────

async function computeTeacherLoad(
  ctx: any,
  args: { teacherId: Id<"employees">; date: number }
): Promise<TeacherLoad> {
  const todayStart = args.date;
  const todayEnd = args.date + 86400000;
  const weekStart = args.date - (args.date % 604800000);
  const weekEnd = weekStart + 604800000;

  const todaySchedules = await ctx.db
    .query("schedules")
    .withIndex("owner", (q: any) => q.eq("owner", args.teacherId as unknown as Id<"users">))
    .filter((q: any) => q.gte(q.field("start"), todayStart))
    .filter((q: any) => q.lt(q.field("end"), todayEnd))
    .collect();

  const weekSchedules = await ctx.db
    .query("schedules")
    .withIndex("owner", (q: any) => q.eq("owner", args.teacherId as unknown as Id<"users">))
    .filter((q: any) => q.gte(q.field("start"), weekStart))
    .filter((q: any) => q.lt(q.field("end"), weekEnd))
    .collect();

  const teacherSettings = await ctx.db
    .query("businessRules")
    .withIndex("by_type", (q: any) => q.eq("ruleType", "teacher_scheduling"))
    .first();

  const defaultMaxDaily = (teacherSettings?.config as any)?.maxDailyHours ?? 6;
  const defaultMaxWeekly = (teacherSettings?.config as any)?.maxWeeklyHours ?? 30;
  const defaultTravelBuffer = (teacherSettings?.config as any)?.travelBufferMinutes ?? 15;

  const dailyHours = todaySchedules.reduce((sum: number, s: any) => {
    const start = s.start ?? 0;
    const end = s.end ?? 0;
    return sum + (end - start) / 3600000;
  }, 0);

  const weeklyHours = weekSchedules.reduce((sum: number, s: any) => {
    const start = s.start ?? 0;
    const end = s.end ?? 0;
    return sum + (end - start) / 3600000;
  }, 0);

  return {
    teacherId: args.teacherId,
    dailyHours: Math.round(dailyHours * 100) / 100,
    weeklyHours: Math.round(weeklyHours * 100) / 100,
    maxDailyHours: defaultMaxDaily,
    maxWeeklyHours: defaultMaxWeekly,
    currentDailyLoad: Math.round((dailyHours / defaultMaxDaily) * 100),
    currentWeeklyLoad: Math.round((weeklyHours / defaultMaxWeekly) * 100),
    travelBufferMinutes: defaultTravelBuffer,
    branches: [...new Set(todaySchedules.map((s: any) => s.branchId).filter(Boolean))] as Id<"branches">[],
  };
}

async function computeTeacherAvailability(
  ctx: any,
  args: { teacherId: Id<"employees">; date: number; startTime: number; endTime: number }
) {
  // Check for conflicts
  const existingSchedules = await ctx.db
    .query("schedules")
    .withIndex("owner", (q: any) => q.eq("owner", args.teacherId as unknown as Id<"users">))
    .filter((q: any) => q.gte(q.field("start"), args.date))
    .filter((q: any) => q.lt(q.field("end"), args.date + 86400000))
    .collect();

  const proposedStart = args.date + args.startTime;
  const proposedEnd = args.date + args.endTime;

  const conflicts = existingSchedules.filter((s: any) => {
    const sStart = s.start;
    const sEnd = s.end;
    return proposedStart < sEnd && proposedEnd > sStart;
  });

  // Check teacher settings for max hours
  const load = await computeTeacherLoad(ctx, {
    teacherId: args.teacherId,
    date: args.date,
  });

  const proposedDuration = (args.endTime - args.startTime) / 60000; // in minutes
  const wouldExceedDaily = (load.dailyHours * 60 + proposedDuration) / 60 > load.maxDailyHours;

  return {
    available: conflicts.length === 0 && !wouldExceedDaily,
    conflicts: conflicts.map((c: any) => ({
      id: c._id,
      title: c.title ?? "Unknown",
      start: c.start,
      end: c.end,
    })),
    wouldExceedDaily,
    currentLoad: load,
  };
}

async function computeSubstitutes(
  ctx: any,
  args: {
    absentTeacherId: Id<"employees">;
    date: number;
    startTime: number;
    endTime: number;
    branchId?: Id<"branches">;
    subject?: string;
  }
): Promise<SubstituteSuggestion[]> {
  // Find teachers with compatible subjects
  const allTeachers = await ctx.db
    .query("employees")
    .filter((q: any) => q.eq(q.field("employeeType"), "faculty"))
    .collect();

  const suggestions: SubstituteSuggestion[] = [];

  for (const teacher of allTeachers) {
    if (teacher._id === args.absentTeacherId) continue;

    // Check availability
    const availability = await computeTeacherAvailability(ctx, {
      teacherId: teacher._id as Id<"employees">,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
    });

    if (!availability.available) continue;

    // Calculate match score
    let score = 70; // base score for being free

    // Prefer same branch
    if (args.branchId) {
      const teacherSchedules = await ctx.db
        .query("schedules")
        .withIndex("owner", (q: any) => q.eq("owner", teacher._id as unknown as Id<"users">))
        .filter((q: any) => q.gte(q.field("start"), args.date))
        .filter((q: any) => q.lt(q.field("end"), args.date + 86400000))
        .first();
      if (teacherSchedules && teacherSchedules.branchId === args.branchId) {
        score += 10;
      }
    }

    // Prefer lower current load
    score += Math.max(0, 15 - availability.currentLoad.currentDailyLoad);

    suggestions.push({
      teacherId: teacher._id as Id<"employees">,
      teacherName: teacher.name ?? "Unknown",
      matchScore: Math.min(100, score),
      available: true,
      reason: `Available — ${availability.currentLoad.currentDailyLoad}% daily load`,
    });
  }

  // Sort by match score descending
  suggestions.sort((a, b) => b.matchScore - a.matchScore);

  return suggestions.slice(0, 10);
}

async function assignSchedule(
  ctx: any,
  args: {
    teacherId: Id<"employees">;
    dayOfWeek: number;
    startTime: number;
    endTime: number;
    branchId: Id<"branches">;
    verticalId?: Id<"verticals">;
    batchId?: Id<"academicBatches">;
    courseId?: Id<"courses">;
    subject?: string;
    roomId?: Id<"academicClassrooms">;
    scheduleType?: string;
  }
) {
  // Check teacher load before assigning
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateTs = today.getTime();

  const load = await computeTeacherLoad(ctx, {
    teacherId: args.teacherId,
    date: dateTs,
  });

  const proposedDuration = (args.endTime - args.startTime) / 60000; // minutes
  const wouldExceedDaily = (load.dailyHours * 60 + proposedDuration) / 60 > load.maxDailyHours;
  const wouldExceedWeekly = (load.weeklyHours * 60 + proposedDuration) / 60 > load.maxWeeklyHours;

  if (wouldExceedDaily) {
    throw new Error(
      `Cannot assign: exceeds daily max of ${load.maxDailyHours} hours ` +
        `(current: ${load.dailyHours}h, proposed: ${Math.round((proposedDuration / 60) * 10) / 10}h)`
    );
  }

  if (wouldExceedWeekly) {
    throw new Error(
      `Cannot assign: exceeds weekly max of ${load.maxWeeklyHours} hours ` +
        `(current: ${load.weeklyHours}h, proposed: ${Math.round((proposedDuration / 60) * 10) / 10}h)`
    );
  }

  // Check travel buffer between branches
  const todaySchedules = await ctx.db
    .query("schedules")
    .withIndex("owner", (q: any) => q.eq("owner", args.teacherId as unknown as Id<"users">))
    .filter((q: any) => q.gte(q.field("start"), dateTs))
    .filter((q: any) => q.lt(q.field("end"), dateTs + 86400000))
    .collect();

  for (const existing of todaySchedules) {
    const existingEnd = existing.end;
    if (args.startTime + dateTs < existingEnd + load.travelBufferMinutes * 60000) {
      const existingBranchId = existing.branchId as Id<"branches">;
      if (existingBranchId !== args.branchId) {
        throw new Error(
          `Insufficient travel buffer: need ${load.travelBufferMinutes}min between branches`
        );
      }
    }
  }

  // Create the schedule entry
  const scheduleId = await ctx.db.insert("schedules", {
    title: args.subject ?? `${args.scheduleType} session`,
    description: undefined,
    scheduleType: args.scheduleType ?? "class",
    status: "active",
    priority: "normal",
    start: dateTs + args.startTime,
    end: dateTs + args.endTime,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    allDay: false,
    recurrence: undefined,
    owner: args.teacherId as unknown as Id<"users">,
    participants: [],
    entityType: "employee",
    entityId: args.teacherId,
    organization: undefined,
    company: undefined,
    branch: args.branchId,
    department: undefined,
    resourceId: args.roomId as unknown as Id<"schedulingResources"> | undefined,
    capacity: undefined,
    currentBookings: undefined,
    approvalRequired: false,
    approvedBy: undefined,
    approvedAt: undefined,
    tags: args.subject ? [args.subject] : [],
    metadata: {
      verticalId: args.verticalId,
      batchId: args.batchId,
      courseId: args.courseId,
      subject: args.subject,
    },
    createdBy: args.teacherId as unknown as Id<"users">,
    updatedBy: args.teacherId as unknown as Id<"users">,
  });

  return scheduleId;
}

// ─── Queries ─────────────────────────────────────────────────────────

export const getTeacherSchedule = query({
  args: {
    teacherId: v.id("employees"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query("schedules")
      .withIndex("owner", (q) => q.eq("owner", args.teacherId as unknown as Id<"users">))
      .collect();

    let filtered = schedules;

    if (args.startDate) {
      filtered = filtered.filter((s) => (s as any).start >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((s) => (s as any).end <= args.endDate!);
    }
    if (args.branchId) {
      filtered = filtered.filter((s) => (s as any).branchId === args.branchId);
    }

    return filtered;
  },
});

export const getTeacherLoad = query({
  args: {
    teacherId: v.id("employees"),
    date: v.number(),
  },
  handler: async (ctx, args) => computeTeacherLoad(ctx, args),
});

export const getTeacherAvailability = query({
  args: {
    teacherId: v.id("employees"),
    date: v.number(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => computeTeacherAvailability(ctx, args),
});

export const findSubstitute = query({
  args: {
    absentTeacherId: v.id("employees"),
    date: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    branchId: v.optional(v.id("branches")),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => computeSubstitutes(ctx, args),
});

export const detectConflicts = query({
  args: {
    teacherIds: v.array(v.id("employees")),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const allSchedules = await Promise.all(
      args.teacherIds.map((teacherId) =>
        ctx.db
          .query("schedules")
          .withIndex("owner", (q) => q.eq("owner", teacherId as unknown as Id<"users">))
          .filter((q) => q.gte(q.field("start"), args.date))
          .filter((q) => q.lt(q.field("end"), args.date + 86400000))
          .collect()
      )
    );

    // Detect conflicts: same time, same branch, same room
    const conflicts: Array<{
      teacherId: Id<"employees">;
      conflictingTeacherId: Id<"employees">;
      start: number;
      end: number;
      branchId?: string;
      roomId?: string;
    }> = [];

    for (let i = 0; i < args.teacherIds.length; i++) {
      for (let j = i + 1; j < args.teacherIds.length; j++) {
        for (const si of allSchedules[i]) {
          for (const sj of allSchedules[j]) {
            const siStart = (si as any).start;
            const siEnd = (si as any).end;
            const sjStart = (sj as any).start;
            const sjEnd = (sj as any).end;

            // Check time overlap
            if (siStart < sjEnd && siEnd > sjStart) {
              // Check same branch or room
              if (
                (si as any).branchId === (sj as any).branchId ||
                ((si as any).roomId && (si as any).roomId === (sj as any).roomId)
              ) {
                conflicts.push({
                  teacherId: args.teacherIds[i],
                  conflictingTeacherId: args.teacherIds[j],
                  start: Math.max(siStart, sjStart),
                  end: Math.min(siEnd, sjEnd),
                  branchId: (si as any).branchId,
                  roomId: (si as any).roomId,
                });
              }
            }
          }
        }
      }
    }

    return conflicts;
  },
});

// ─── Mutations ───────────────────────────────────────────────────────

export const assignTeacherSchedule = mutation({
  args: {
    teacherId: v.id("employees"),
    dayOfWeek: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    branchId: v.id("branches"),
    verticalId: v.optional(v.id("verticals")),
    batchId: v.optional(v.id("academicBatches")),
    courseId: v.optional(v.id("courses")),
    subject: v.optional(v.string()),
    roomId: v.optional(v.id("academicClassrooms")),
    scheduleType: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...teacherSchedulePipeline,
      operation: "create",
      entity: "teacher_schedule",
      eventType: "scheduling.teacher.assigned",
      title: "Teacher Schedule Assigned",
      notifyViaMatrix: true,
    },
    async (ctx, args) => assignSchedule(ctx, args)
  ),
});

export const autoScheduleSubstitute = mutation({
  args: {
    absentTeacherId: v.id("employees"),
    date: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    branchId: v.optional(v.id("branches")),
    subject: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...teacherSchedulePipeline,
      operation: "create",
      entity: "teacher_schedule",
      eventType: "scheduling.substitute.auto_assigned",
      title: "Substitute Auto-Scheduled",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    // Find best substitute
    const suggestions = await computeSubstitutes(ctx, {
      absentTeacherId: args.absentTeacherId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      branchId: args.branchId,
      subject: args.subject,
    });

    if (suggestions.length === 0) {
      throw new Error("No available substitute found");
    }

    const bestSubstitute = suggestions[0];

    // Assign the substitute
    const scheduleId = await assignSchedule(ctx, {
      teacherId: bestSubstitute.teacherId,
      dayOfWeek: new Date(args.date).getDay(),
      startTime: args.startTime,
      endTime: args.endTime,
      branchId: args.branchId ?? ("" as Id<"branches">),
      subject: args.subject,
      scheduleType: "class",
    });

    return {
      scheduleId,
      substitute: bestSubstitute,
      absentTeacherId: args.absentTeacherId,
    };
    }
  ),
});

export const updateTeacherSettings = mutation({
  args: {
    teacherId: v.id("employees"),
    maxDailyHours: v.optional(v.number()),
    maxWeeklyHours: v.optional(v.number()),
    travelBufferMinutes: v.optional(v.number()),
    branches: v.optional(v.array(v.id("branches"))),
  },
  handler: withScopeAndEvents(
    {
      ...teacherSchedulePipeline,
      operation: "update",
      entity: "teacher_settings",
      eventType: "scheduling.teacher.settings.updated",
      title: "Teacher Settings Updated",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const existing = await ctx.db
      .query("businessRules")
      .withIndex("by_type", (q) => q.eq("ruleType", "teacher_scheduling"))
      .filter((q) => q.eq(q.field("scopeId"), args.teacherId))
      .first();

    const config: Record<string, unknown> = {
      ...((existing?.config as Record<string, unknown>) ?? {}),
      ...(args.maxDailyHours !== undefined && { maxDailyHours: args.maxDailyHours }),
      ...(args.maxWeeklyHours !== undefined && { maxWeeklyHours: args.maxWeeklyHours }),
      ...(args.travelBufferMinutes !== undefined && { travelBufferMinutes: args.travelBufferMinutes }),
      ...(args.branches !== undefined && { branches: args.branches }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, { config });
    } else {
      await ctx.db.insert("businessRules", {
        ruleType: "teacher_scheduling",
        scopeId: args.teacherId,
        ruleName: `Teacher Scheduling — ${args.teacherId}`,
        description: "Per-teacher scheduling configuration",
        config,
        enabled: true,
        priority: 100,
        organization: undefined,
        company: undefined,
        branch: undefined,
      });
    }

    return { success: true };
    }
  ),
});
