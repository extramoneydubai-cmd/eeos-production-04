/**
 * SchedulingEngine — Enterprise Scheduling Engine
 *
 * Central singleton for all scheduling operations.
 * Every business module MUST use this engine for scheduling.
 * No module may directly query the "schedules" table.
 *
 * Integrates with:
 * - SchedulingConflictEngine (conflict detection)
 * - AvailabilityEngine (availability checks)
 * - BookingEngine (booking management)
 * - Event Pipeline (audit/timeline)
 * - Calendar SDK (calendar visualization)
 */

import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export type ScheduleStatus =
  | "scheduled"
  | "confirmed"
  | "pending_approval"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export type SchedulePriority = "low" | "medium" | "high" | "urgent";

export type RecurrenceType = "none" | "daily" | "weekdays" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom";

export interface ScheduleCreateInput {
  title: string;
  description?: string;
  scheduleType: string;
  status?: ScheduleStatus;
  priority?: SchedulePriority;
  start: number;
  end: number;
  timezone?: string;
  allDay?: boolean;
  recurrence?: RecurrenceType;
  recurrenceEnd?: number;
  owner?: Id<"users">;
  participants?: Id<"users">[];
  entityType?: string;
  entityId?: string;
  resourceId?: Id<"schedulingResources">;
  capacity?: number;
  approvalRequired?: boolean;
  organizationId?: Id<"organizations">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
  tags?: string[];
  createdBy?: Id<"users">;
}

export interface ScheduleUpdateInput {
  title?: string;
  description?: string;
  scheduleType?: string;
  status?: ScheduleStatus;
  priority?: SchedulePriority;
  start?: number;
  end?: number;
  timezone?: string;
  allDay?: boolean;
  recurrence?: RecurrenceType;
  recurrenceEnd?: number;
  owner?: Id<"users">;
  participants?: Id<"users">[];
  resourceId?: Id<"schedulingResources">;
  capacity?: number;
  approvalRequired?: boolean;
  tags?: string[];
  updatedBy?: Id<"users">;
}

export interface ScheduleFilter {
  status?: ScheduleStatus;
  scheduleType?: string;
  owner?: Id<"users">;
  entityType?: string;
  entityId?: string;
  resourceId?: Id<"schedulingResources">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
  startAfter?: number;
  startBefore?: number;
  endAfter?: number;
  endBefore?: number;
  search?: string;
  tags?: string[];
  limit?: number;
  cursor?: string;
}

// ─── Engine Implementation ──────────────────────────────────────────────

class SchedulingEngineImpl {
  private ctx: any = null;

  /** Initialize engine with Convex context */
  init(ctx: any) {
    this.ctx = ctx;
  }

  // ── CRUD Operations ────────────────────────────────────────────

  /** Create a new schedule entry */
  async create(input: ScheduleCreateInput): Promise<string> {
    const now = Date.now();
    const scheduleId = await this.ctx.db.insert("schedules", {
      title: input.title,
      description: input.description,
      scheduleType: input.scheduleType,
      status: input.status || "scheduled",
      priority: input.priority || "medium",
      start: input.start,
      end: input.end,
      timezone: input.timezone,
      allDay: input.allDay || false,
      recurrence: input.recurrence || "none",
      recurrenceEnd: input.recurrenceEnd,
      owner: input.owner,
      participants: input.participants || [],
      entityType: input.entityType,
      entityId: input.entityId,
      resourceId: input.resourceId,
      capacity: input.capacity,
      currentBookings: 0,
      approvalRequired: input.approvalRequired || false,
      organizationId: input.organizationId,
      companyId: input.companyId,
      branchId: input.branchId,
      departmentId: input.departmentId,
      tags: input.tags || [],
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return scheduleId;
  }

  /** Update an existing schedule */
  async update(scheduleId: Id<"schedules">, input: ScheduleUpdateInput): Promise<void> {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    const fields: (keyof ScheduleUpdateInput)[] = [
      "title", "description", "scheduleType", "status", "priority",
      "start", "end", "timezone", "allDay", "recurrence", "recurrenceEnd",
      "owner", "participants", "resourceId", "capacity", "approvalRequired",
      "tags", "updatedBy",
    ];
    for (const field of fields) {
      if ((input as any)[field] !== undefined) {
        updates[field] = (input as any)[field];
      }
    }
    await this.ctx.db.patch(scheduleId, updates);
  }

  /** Get a schedule by ID */
  async get(scheduleId: Id<"schedules">): Promise<any> {
    return this.ctx.db.get(scheduleId);
  }

  /** List schedules with filters */
  async list(filter: ScheduleFilter): Promise<{ items: any[]; cursor?: string }> {
    let query = this.ctx.db.query("schedules");

    // Apply indexed filters
    if (filter.status) query = query.filter((q: any) => q.eq(q.field("status"), filter.status));
    if (filter.scheduleType) query = query.filter((q: any) => q.eq(q.field("scheduleType"), filter.scheduleType));
    if (filter.owner) query = query.filter((q: any) => q.eq(q.field("owner"), filter.owner));
    if (filter.companyId) query = query.filter((q: any) => q.eq(q.field("companyId"), filter.companyId));
    if (filter.branchId) query = query.filter((q: any) => q.eq(q.field("branchId"), filter.branchId));
    if (filter.resourceId) query = query.filter((q: any) => q.eq(q.field("resourceId"), filter.resourceId));

    const all = await query.collect();
    const limit = filter.limit || 50;

    // Apply post-query filters
    let filtered = all.sort((a: any, b: any) => a.start - b.start);
    if (filter.startAfter) filtered = filtered.filter((e: any) => e.start >= filter.startAfter!);
    if (filter.startBefore) filtered = filtered.filter((e: any) => e.start <= filter.startBefore!);
    if (filter.endAfter) filtered = filtered.filter((e: any) => e.end >= filter.endAfter!);
    if (filter.endBefore) filtered = filtered.filter((e: any) => e.end <= filter.endBefore!);
    if (filter.entityType) filtered = filtered.filter((e: any) => e.entityType === filter.entityType);
    if (filter.entityId) filtered = filtered.filter((e: any) => e.entityId === filter.entityId);
    if (filter.departmentId) filtered = filtered.filter((e: any) => e.departmentId === filter.departmentId);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter((e: any) =>
        e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
      );
    }
    if (filter.tags?.length) {
      filtered = filtered.filter((e: any) =>
        e.tags?.some((t: string) => filter.tags!.includes(t))
      );
    }

    const items = filtered.slice(0, limit);
    return { items };
  }

  /** Delete a schedule */
  async remove(scheduleId: Id<"schedules">): Promise<void> {
    await this.ctx.db.delete(scheduleId);
  }

  /** Clone a schedule */
  async clone(scheduleId: Id<"schedules">, overrides?: Partial<ScheduleCreateInput>): Promise<string> {
    const original = await this.ctx.db.get(scheduleId);
    if (!original) throw new Error("Schedule not found");

    const now = Date.now();
    const newId = await this.ctx.db.insert("schedules", {
      ...original,
      title: `${original.title} (Copy)`,
      status: "scheduled",
      start: overrides?.start || original.start,
      end: overrides?.end || original.end,
      owner: overrides?.owner || original.owner,
      currentBookings: 0,
      waitingList: [],
      completedAt: undefined,
      cancelledAt: undefined,
      cancelReason: undefined,
      createdBy: overrides?.createdBy || original.createdBy,
      updatedBy: overrides?.createdBy || original.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return newId;
  }

  // ── Status Management ──────────────────────────────────────────

  /** Confirm a schedule (move from pending_approval to confirmed) */
  async confirm(scheduleId: Id<"schedules">, userId: Id<"users">): Promise<void> {
    const now = Date.now();
    await this.ctx.db.patch(scheduleId, {
      status: "confirmed",
      approvedBy: userId,
      approvedAt: now,
      updatedAt: now,
    });
  }

  /** Complete a schedule */
  async complete(scheduleId: Id<"schedules">): Promise<void> {
    await this.ctx.db.patch(scheduleId, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /** Cancel a schedule */
  async cancel(scheduleId: Id<"schedules">, reason?: string): Promise<void> {
    await this.ctx.db.patch(scheduleId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelReason: reason,
      updatedAt: Date.now(),
    });
  }

  /** Archive a schedule */
  async archive(scheduleId: Id<"schedules">): Promise<void> {
    await this.ctx.db.patch(scheduleId, {
      status: "archived",
      updatedAt: Date.now(),
    });
  }

  // ── Utility Methods ────────────────────────────────────────────

  /** Get the next n occurrences of a recurring schedule */
  getRecurrenceDates(start: number, end: number, recurrence: RecurrenceType, recurrenceEnd: number, count: number = 10): { start: number; end: number }[] {
    const duration = end - start;
    const dates: { start: number; end: number }[] = [];
    const maxDate = recurrenceEnd || start + 365 * 24 * 60 * 60 * 1000;
    let current = new Date(start);

    const addNext = () => {
      const nextStart = current.getTime();
      if (nextStart > maxDate || dates.length >= count) return;
      dates.push({ start: nextStart, end: nextStart + duration });
    };

    addNext();

    while (dates.length < count) {
      switch (recurrence) {
        case "daily":
          current.setDate(current.getDate() + 1);
          break;
        case "weekdays":
          current.setDate(current.getDate() + 1);
          while (current.getDay() === 0 || current.getDay() === 6) {
            current.setDate(current.getDate() + 1);
          }
          break;
        case "weekly":
          current.setDate(current.getDate() + 7);
          break;
        case "biweekly":
          current.setDate(current.getDate() + 14);
          break;
        case "monthly":
          current.setMonth(current.getMonth() + 1);
          break;
        case "yearly":
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          return dates;
      }
      addNext();
    }

    return dates;
  }

  /** Get schedules for a given date range */
  async getByDateRange(start: number, end: number, filter?: Omit<ScheduleFilter, "startAfter" | "startBefore">): Promise<any[]> {
    return this.list({ ...filter, startAfter: start, startBefore: end, limit: 500 }).then(r => r.items);
  }

  /** Get today's schedules */
  async getToday(filter?: ScheduleFilter): Promise<any[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = startOfDay.getTime() + 24 * 60 * 60 * 1000;
    return this.getByDateRange(startOfDay.getTime(), endOfDay, filter);
  }

  /** Get upcoming schedules (today + next N days) */
  async getUpcoming(days: number = 7, filter?: ScheduleFilter): Promise<any[]> {
    const now = Date.now();
    const end = now + days * 24 * 60 * 60 * 1000;
    return this.getByDateRange(now, end, filter);
  }

  /** Search schedules by text */
  async search(query: string, filter?: Omit<ScheduleFilter, "search">): Promise<any[]> {
    return this.list({ ...filter, search: query, limit: 100 }).then(r => r.items);
  }

  /** Get participants for a schedule */
  async getParticipants(scheduleId: Id<"schedules">): Promise<Id<"users">[]> {
    const schedule = await this.ctx.db.get(scheduleId);
    return schedule?.participants || [];
  }

  /** Add participants to a schedule */
  async addParticipants(scheduleId: Id<"schedules">, userIds: Id<"users">[]): Promise<void> {
    const schedule = await this.ctx.db.get(scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    const existing = new Set(schedule.participants || []);
    userIds.forEach((id) => existing.add(id));
    await this.ctx.db.patch(scheduleId, {
      participants: Array.from(existing),
      updatedAt: Date.now(),
    });
  }

  /** Remove participants from a schedule */
  async removeParticipants(scheduleId: Id<"schedules">, userIds: Id<"users">[]): Promise<void> {
    const schedule = await this.ctx.db.get(scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    const removeSet = new Set(userIds);
    const remaining = (schedule.participants || []).filter((id: Id<"users">) => !removeSet.has(id));
    await this.ctx.db.patch(scheduleId, {
      participants: remaining,
      updatedAt: Date.now(),
    });
  }

  /** Get schedule count by status */
  async getCounts(filter?: { companyId?: Id<"companies">; branchId?: Id<"branches"> }): Promise<Record<string, number>> {
    let all = await this.ctx.db.query("schedules").collect();
    if (filter?.companyId) all = all.filter((s: any) => s.companyId === filter.companyId);
    if (filter?.branchId) all = all.filter((s: any) => s.branchId === filter.branchId);

    const counts: Record<string, number> = {};
    for (const s of all) {
      const status = s.status || "unknown";
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }
}

export const schedulingEngine = new SchedulingEngineImpl();
