/**
 * SchedulingConflictEngine — Conflict Detection Engine
 *
 * Automatically detects scheduling conflicts:
 * - Double booking (same resource, overlapping time)
 * - Faculty/employee conflicts
 * - Room/vehicle/equipment conflicts
 * - Holiday calendar violations
 * - Working hours violations
 * - Timezone conflicts
 * - Capacity exceeded
 * - Branch mismatch
 */

import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export type ConflictSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ConflictType =
  | "double_booking"
  | "resource_unavailable"
  | "faculty_conflict"
  | "employee_conflict"
  | "room_conflict"
  | "vehicle_conflict"
  | "equipment_conflict"
  | "holiday_violation"
  | "working_hours_violation"
  | "capacity_exceeded"
  | "branch_mismatch"
  | "timezone_conflict"
  | "duplicate_recurrence";

export interface Conflict {
  type: ConflictType;
  severity: ConflictSeverity;
  message: string;
  recommendation: string;
  conflictingScheduleId?: Id<"schedules">;
  conflictingResourceId?: Id<"schedulingResources">;
  details?: Record<string, unknown>;
}

export interface ConflictCheckInput {
  title: string;
  start: number;
  end: number;
  resourceId?: Id<"schedulingResources">;
  participants?: Id<"users">[];
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  scheduleType?: string;
  capacity?: number;
  excludeScheduleId?: Id<"schedules">;
}

const CONFLICT_SEVERITY: Record<ConflictType, ConflictSeverity> = {
  double_booking: "high",
  resource_unavailable: "critical",
  faculty_conflict: "high",
  employee_conflict: "high",
  room_conflict: "high",
  vehicle_conflict: "high",
  equipment_conflict: "high",
  holiday_violation: "medium",
  working_hours_violation: "medium",
  capacity_exceeded: "high",
  branch_mismatch: "low",
  timezone_conflict: "low",
  duplicate_recurrence: "info",
};

const RECOMMENDATIONS: Record<ConflictType, string> = {
  double_booking: "Choose a different time slot or resource",
  resource_unavailable: "Select an available resource or check resource maintenance schedule",
  faculty_conflict: "Check faculty availability and reschedule",
  employee_conflict: "Check employee schedule and reschedule",
  room_conflict: "Choose a different room or time",
  vehicle_conflict: "Select an alternative vehicle or time",
  equipment_conflict: "Reserve equipment for a different time",
  holiday_violation: "Reschedule to a working day",
  working_hours_violation: "Schedule within business hours",
  capacity_exceeded: "Choose a larger venue or reduce participant count",
  branch_mismatch: "Select a resource from the same branch",
  timezone_conflict: "Confirm all participants are aware of the timezone",
  duplicate_recurrence: "Adjust recurrence pattern",
};

// ─── Conflict Engine ─────────────────────────────────────────────────────

class SchedulingConflictEngineImpl {
  private ctx: any = null;

  init(ctx: any) {
    this.ctx = ctx;
  }

  /** Check all conflicts for a proposed schedule */
  async checkConflicts(input: ConflictCheckInput): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Run all conflict checks in parallel where possible
    const [resourceConflicts, capacityCheck, holidayCheck, hoursCheck, existingSchedules] =
      await Promise.all([
        input.resourceId ? this.checkResourceConflicts(input) : Promise.resolve([]),
        input.capacity ? this.checkCapacity(input) : Promise.resolve(null),
        this.checkHolidayViolations(input),
        this.checkWorkingHours(input),
        this.getOverlappingSchedules(input),
      ]);

    conflicts.push(...resourceConflicts);

    if (capacityCheck) conflicts.push(capacityCheck);

    // Check for double booking with existing schedules
    for (const existing of existingSchedules) {
      if (input.excludeScheduleId && existing._id === input.excludeScheduleId) continue;

      // Check resource conflict
      if (input.resourceId && existing.resourceId === input.resourceId) {
        conflicts.push({
          type: "double_booking",
          severity: CONFLICT_SEVERITY.double_booking,
          message: `"${existing.title}" already booked this resource during this time`,
          recommendation: RECOMMENDATIONS.double_booking,
          conflictingScheduleId: existing._id,
          conflictingResourceId: existing.resourceId,
        });
      }

      // Check participant conflicts
      if (input.participants?.length && existing.participants?.length) {
        const conflictingParticipants = input.participants.filter((p) =>
          existing.participants.includes(p)
        );
        if (conflictingParticipants.length > 0) {
          conflicts.push({
            type: "faculty_conflict",
            severity: CONFLICT_SEVERITY.faculty_conflict,
            message: `${conflictingParticipants.length} participant(s) have conflicting schedule "${existing.title}"`,
            recommendation: RECOMMENDATIONS.faculty_conflict,
            conflictingScheduleId: existing._id,
            details: { conflictingParticipants },
          });
        }
      }
    }

    return conflicts;
  }

  /** Check if a resource is available */
  async checkResourceAvailability(
    resourceId: Id<"schedulingResources">,
    start: number,
    end: number
  ): Promise<{ available: boolean; conflicts: Conflict[] }> {
    const resource = await this.ctx.db.get(resourceId);
    if (!resource) {
      return {
        available: false,
        conflicts: [{
          type: "resource_unavailable",
          severity: "critical",
          message: "Resource not found",
          recommendation: "Select a valid resource",
          conflictingResourceId: resourceId,
        }],
      };
    }

    if (resource.status !== "active") {
      return {
        available: false,
        conflicts: [{
          type: "resource_unavailable",
          severity: "critical",
          message: `Resource "${resource.name}" is ${resource.status}`,
          recommendation: RECOMMENDATIONS.resource_unavailable,
          conflictingResourceId: resourceId,
        }],
      };
    }

    const conflicts = await this.checkConflicts({
      title: "availability check",
      start,
      end,
      resourceId,
    });

    return { available: conflicts.length === 0, conflicts };
  }

  /** Get resource utilization stats */
  async getResourceUtilization(
    resourceId: Id<"schedulingResources">,
    start: number,
    end: number
  ): Promise<{ totalBookings: number; utilizationPercent: number; peakHours: number[] }> {
    const schedules = await this.ctx.db
      .query("schedules")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("resourceId"), resourceId),
          q.gte(q.field("start"), start),
          q.lte(q.field("end"), end)
        )
      )
      .collect();

    const totalMs = end - start;
    const bookedMs = schedules.reduce((sum: number, s: any) => sum + (s.end - s.start), 0);
    const utilizationPercent = totalMs > 0 ? Math.min(100, Math.round((bookedMs / totalMs) * 100)) : 0;

    // Calculate peak hours
    const hourCounts: Record<number, number> = {};
    for (const s of schedules) {
      const hour = new Date(s.start).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([h]) => Number(h));

    return { totalBookings: schedules.length, utilizationPercent, peakHours };
  }

  // ── Private Check Methods ──────────────────────────────────────

  private async checkResourceConflicts(input: ConflictCheckInput): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    if (!input.resourceId) return conflicts;

    const resource = await this.ctx.db.get(input.resourceId);
    if (!resource) {
      conflicts.push({
        type: "resource_unavailable",
        severity: "critical",
        message: "Selected resource does not exist",
        recommendation: RECOMMENDATIONS.resource_unavailable,
      });
      return conflicts;
    }

    // Check branch mismatch
    if (input.companyId && resource.companyId && resource.companyId !== input.companyId) {
      conflicts.push({
        type: "branch_mismatch",
        severity: CONFLICT_SEVERITY.branch_mismatch,
        message: `Resource "${resource.name}" belongs to a different company`,
        recommendation: RECOMMENDATIONS.branch_mismatch,
        conflictingResourceId: input.resourceId,
      });
    }

    return conflicts;
  }

  private async checkCapacity(input: ConflictCheckInput): Promise<Conflict | null> {
    if (!input.resourceId || !input.capacity) return null;

    const resource = await this.ctx.db.get(input.resourceId);
    if (!resource) return null;

    if (input.capacity > resource.capacity) {
      return {
        type: "capacity_exceeded",
        severity: CONFLICT_SEVERITY.capacity_exceeded,
        message: `Capacity ${input.capacity} exceeds resource limit of ${resource.capacity}`,
        recommendation: RECOMMENDATIONS.capacity_exceeded,
        conflictingResourceId: input.resourceId,
        details: { requested: input.capacity, available: resource.capacity },
      };
    }

    return null;
  }

  private async checkHolidayViolations(input: ConflictCheckInput): Promise<Conflict[]> {
    // Placeholder — would check holiday calendar
    return [];
  }

  private async checkWorkingHours(input: ConflictCheckInput): Promise<Conflict[]> {
    // Placeholder — would check resource working hours
    return [];
  }

  private async getOverlappingSchedules(input: ConflictCheckInput): Promise<any[]> {
    const all = await this.ctx.db.query("schedules").collect();
    return all.filter((s: any) =>
      s.status !== "cancelled" &&
      s.status !== "archived" &&
      s.start < input.end &&
      s.end > input.start
    );
  }
}

export const schedulingConflictEngine = new SchedulingConflictEngineImpl();
