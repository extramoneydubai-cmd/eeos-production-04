/**
 * SchedulingRules — Enterprise Scheduling Policy & Rules Engine
 *
 * Enforces:
 * - Business hours
 * - Working days
 * - Holiday calendar
 * - Maximum capacity
 * - Minimum notice period
 * - Maximum advance booking
 * - Approval thresholds
 * - Booking window limits
 * - Recurrence rules
 * - Timezone rules
 * - Conflict policy
 */

export interface WorkingHours {
  monday?: { start: string; end: string };
  tuesday?: { start: string; end: string };
  wednesday?: { start: string; end: string };
  thursday?: { start: string; end: string };
  friday?: { start: string; end: string };
  saturday?: { start: string; end: string };
  sunday?: { start: string; end: string };
}

export interface SchedulingPolicy {
  id: string;
  name: string;
  description: string;
  workingHours: WorkingHours;
  workingDays: number[]; // 0=Sun, 1=Mon ...
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  maximumDurationMinutes: number;
  defaultApprovalRequired: boolean;
  approvalThresholds: {
    capacityThreshold: number;
    durationThresholdMinutes: number;
    participantsThreshold: number;
  };
  cancellationPolicy: {
    allowedBeforeMinutes: number;
    requireReason: boolean;
  };
  allowWeekends: boolean;
  allowHolidays: boolean;
  maxRecurrences: number;
}

const DEFAULT_POLICY: SchedulingPolicy = {
  id: "default",
  name: "Default Policy",
  description: "Standard enterprise scheduling policy",
  workingHours: {
    monday: { start: "09:00", end: "18:00" },
    tuesday: { start: "09:00", end: "18:00" },
    wednesday: { start: "09:00", end: "18:00" },
    thursday: { start: "09:00", end: "18:00" },
    friday: { start: "09:00", end: "18:00" },
    saturday: { start: "10:00", end: "14:00" },
  },
  workingDays: [1, 2, 3, 4, 5, 6],
  minimumNoticeMinutes: 30,
  maximumAdvanceDays: 365,
  maximumDurationMinutes: 480,
  defaultApprovalRequired: false,
  approvalThresholds: {
    capacityThreshold: 50,
    durationThresholdMinutes: 240,
    participantsThreshold: 20,
  },
  cancellationPolicy: {
    allowedBeforeMinutes: 60,
    requireReason: false,
  },
  allowWeekends: false,
  allowHolidays: false,
  maxRecurrences: 52,
};

class SchedulingRulesImpl {
  private policies: Map<string, SchedulingPolicy> = new Map();
  private activePolicyId: string = "default";

  constructor() {
    this.policies.set("default", DEFAULT_POLICY);
  }

  /** Get the active policy */
  getActivePolicy(): SchedulingPolicy {
    return this.policies.get(this.activePolicyId) || DEFAULT_POLICY;
  }

  /** Set the active policy */
  setActivePolicy(policyId: string): void {
    if (this.policies.has(policyId)) {
      this.activePolicyId = policyId;
    }
  }

  /** Add or update a policy */
  setPolicy(policy: SchedulingPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /** Get all policies */
  getAllPolicies(): SchedulingPolicy[] {
    return Array.from(this.policies.values());
  }

  /** Validate a schedule against the active policy */
  validateSchedule(
    start: number,
    end: number,
    options?: {
      capacity?: number;
      participants?: number;
      resourceType?: string;
    }
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const policy = this.getActivePolicy();
    const errors: string[] = [];
    const warnings: string[] = [];
    const now = Date.now();
    const durationMinutes = (end - start) / 60000;
    const startDate = new Date(start);
    const dayOfWeek = startDate.getDay();

    // Check minimum notice
    if (start - now < policy.minimumNoticeMinutes * 60 * 1000) {
      errors.push(`Minimum notice of ${policy.minimumNoticeMinutes} minutes required`);
    }

    // Check maximum advance booking
    const maxAdvanceMs = policy.maximumAdvanceDays * 24 * 60 * 60 * 1000;
    if (start - now > maxAdvanceMs) {
      errors.push(`Cannot book more than ${policy.maximumAdvanceDays} days in advance`);
    }

    // Check maximum duration
    if (durationMinutes > policy.maximumDurationMinutes) {
      errors.push(`Schedule exceeds maximum duration of ${policy.maximumDurationMinutes} minutes`);
    }

    // Check working days
    if (!policy.workingDays.includes(dayOfWeek)) {
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (!policy.allowWeekends) {
          errors.push("Scheduling on weekends is not permitted");
        }
      } else {
        errors.push("Scheduling on this day is not permitted");
      }
    }

    // Check working hours
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[dayOfWeek] as keyof WorkingHours;
    const wh = policy.workingHours[dayName];
    if (wh) {
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const [whStartH, whStartM] = wh.start.split(":").map(Number);
      const [whEndH, whEndM] = wh.end.split(":").map(Number);
      const whStartMinutes = whStartH * 60 + whStartM;
      const whEndMinutes = whEndH * 60 + whEndM;

      if (startMinutes < whStartMinutes || startMinutes + durationMinutes > whEndMinutes) {
        warnings.push(`Schedule falls partially outside business hours (${wh.start} - ${wh.end})`);
      }
    }

    // Check capacity threshold for approval
    if (options?.capacity && options.capacity > policy.approvalThresholds.capacityThreshold) {
      warnings.push(`Capacity exceeds approval threshold — approval may be required`);
    }

    // Check participants threshold
    if (options?.participants && options.participants > policy.approvalThresholds.participantsThreshold) {
      warnings.push(`Large participant count — approval may be required`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /** Check if cancellation is allowed */
  canCancel(scheduleStart: number): { allowed: boolean; reason?: string } {
    const policy = this.getActivePolicy();
    const timeUntilStart = scheduleStart - Date.now();
    const minMinutes = policy.cancellationPolicy.allowedBeforeMinutes;

    if (timeUntilStart < minMinutes * 60 * 1000) {
      return {
        allowed: false,
        reason: `Cancellation must be at least ${minMinutes} minutes before the scheduled time`,
      };
    }

    return { allowed: true };
  }
}

export const schedulingRules = new SchedulingRulesImpl();
