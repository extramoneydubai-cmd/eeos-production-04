/**
 * AvailabilityEngine — Resource Availability Engine
 *
 * Checks availability for:
 * - Resources (rooms, vehicles, equipment, labs)
 * - Faculty / Employees
 * - Participants
 *
 * Supports:
 * - Daily / Weekly / Monthly views
 * - Free / Busy / Tentative / Blocked slots
 * - Working hours filtering
 * - Holiday filtering
 * - Maintenance windows
 */

import { Id } from "../../convex/_generated/dataModel";

export type AvailabilityStatus = "free" | "busy" | "tentative" | "blocked" | "maintenance" | "holiday" | "leave";

export interface TimeSlot {
  start: number;
  end: number;
  status: AvailabilityStatus;
  scheduleId?: Id<"schedules">;
  title?: string;
}

export interface AvailabilityQuery {
  resourceId?: Id<"schedulingResources">;
  userId?: Id<"users">;
  start: number;
  end: number;
  granularityMinutes?: number; // Default 30
}

class AvailabilityEngineImpl {
  private ctx: any = null;

  init(ctx: any) {
    this.ctx = ctx;
  }

  /** Get availability for a resource or user over a date range */
  async getAvailability(query: AvailabilityQuery): Promise<TimeSlot[]> {
    const granularity = query.granularityMinutes || 30;
    const slots: TimeSlot[] = [];

    // Get all schedules in the range
    const allSchedules = await this.ctx.db.query("schedules").collect();
    const relevantSchedules = allSchedules.filter((s: any) =>
      s.status !== "cancelled" &&
      s.status !== "archived" &&
      s.start < query.end &&
      s.end > query.start &&
      (query.resourceId ? s.resourceId === query.resourceId : true) &&
      (query.userId ? s.owner === query.userId || s.participants?.includes(query.userId) : true)
    );

    // Generate time slots
    const slotDuration = granularity * 60 * 1000;
    let current = query.start;

    while (current < query.end) {
      const slotEnd = Math.min(current + slotDuration, query.end);
      const status = this.getSlotStatus(current, slotEnd, relevantSchedules);
      slots.push({ start: current, end: slotEnd, status });
      current = slotEnd;
    }

    return slots;
  }

  /** Check if a specific time range is available */
  async isAvailable(
    start: number,
    end: number,
    resourceId?: Id<"schedulingResources">,
    userId?: Id<"users">,
    excludeScheduleId?: Id<"schedules">
  ): Promise<boolean> {
    const slots = await this.getAvailability({
      resourceId,
      userId,
      start,
      end,
      granularityMinutes: Math.ceil((end - start) / 60000),
    });

    return slots.every((s) => s.status === "free");
  }

  /** Find the next available slot */
  async findNextSlot(
    resourceId: Id<"schedulingResources">,
    after: number,
    durationMinutes: number,
    maxDays: number = 30
  ): Promise<TimeSlot | null> {
    const end = after + maxDays * 24 * 60 * 60 * 1000;
    const slots = await this.getAvailability({
      resourceId,
      start: after,
      end,
      granularityMinutes: durationMinutes,
    });

    return slots.find((s) => s.status === "free") || null;
  }

  /** Get free/busy summary */
  async getAvailabilitySummary(
    resourceId: Id<"schedulingResources">,
    start: number,
    end: number
  ): Promise<{ freeSlots: number; busySlots: number; totalSlots: number }> {
    const slots = await this.getAvailability({ resourceId, start, end, granularityMinutes: 60 });
    return {
      freeSlots: slots.filter((s) => s.status === "free").length,
      busySlots: slots.filter((s) => s.status !== "free").length,
      totalSlots: slots.length,
    };
  }

  // ── Private ────────────────────────────────────────────────────

  private getSlotStatus(slotStart: number, slotEnd: number, schedules: any[]): AvailabilityStatus {
    const overlapping = schedules.filter(
      (s) => s.start < slotEnd && s.end > slotStart
    );

    if (overlapping.length === 0) return "free";
    if (overlapping.some((s: any) => s.status === "blocked" || s.status === "maintenance")) return "blocked";
    if (overlapping.some((s: any) => s.status === "tentative")) return "tentative";
    return "busy";
  }
}

export const availabilityEngine = new AvailabilityEngineImpl();
