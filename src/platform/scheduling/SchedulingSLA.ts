/**
 * SchedulingSLA — Enterprise SLA Engine for Scheduling
 *
 * Supports:
 * - Response SLA (time to approve/reject after creation)
 * - Completion SLA (time to complete after start)
 * - Reminder SLA (time before start for reminders)
 * - Escalation SLA (auto-escalate if unapproved by deadline)
 * - Violation Detection
 * - Business Hours, Holiday Aware, Weekend Aware
 *
 * Every schedule type can have custom SLA policies.
 * Integrates with Event Pipeline for notifications on violations.
 */

// ─── Types ────────────────────────────────────────────────────────

export interface SLAPolicy {
  scheduleType: string;
  responseMinutes?: number;
  completionMinutes?: number;
  reminderBeforeMinutes?: number[];
  escalationMinutes?: number;
  escalationLevels?: { level: number; afterMinutes: number; notifyRoles: string[] }[];
  businessHoursOnly: boolean;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  maxViolationsPerDay: number;
  autoResolve: boolean;
}

export interface SLAViolation {
  scheduleId: string;
  scheduleTitle: string;
  type: "response" | "completion" | "reminder" | "escalation";
  severity: "critical" | "warning" | "info";
  triggeredAt: number;
  deadline: number;
  actual: number;
  delta: number; // How much over deadline in ms
  policyName: string;
  notified: boolean;
  resolved: boolean;
  resolvedAt?: number;
}

export interface SLAStatus {
  scheduleId: string;
  policyName: string;
  responseDeadline?: number;
  completionDeadline?: number;
  nextReminderAt?: number;
  escalationDeadline?: number;
  violations: SLAViolation[];
  isCompliant: boolean;
  status: "pending" | "within_sla" | "approaching_sla" | "breached" | "resolved";
}

// ─── Holiday Calendar (extensible) ────────────────────────────────

let HOLIDAY_CACHE: Set<string> = new Set();

export function setHolidays(dates: number[]) {
  HOLIDAY_CACHE = new Set(dates.map((d) => new Date(d).toDateString()));
}

function isHoliday(ts: number): boolean {
  return HOLIDAY_CACHE.has(new Date(ts).toDateString());
}

function isWeekend(ts: number): boolean {
  const day = new Date(ts).getDay();
  return day === 0 || day === 6;
}

function isBusinessHour(ts: number): boolean {
  const hour = new Date(ts).getHours();
  return hour >= 8 && hour < 18;
}

// ─── Default SLA Policies ─────────────────────────────────────────

const DEFAULT_SLA_POLICIES: SLAPolicy[] = [
  {
    scheduleType: "meeting",
    responseMinutes: 120,
    completionMinutes: 60,
    reminderBeforeMinutes: [15, 60, 1440],
    escalationMinutes: 240,
    escalationLevels: [
      { level: 1, afterMinutes: 120, notifyRoles: ["manager"] },
      { level: 2, afterMinutes: 240, notifyRoles: ["director"] },
      { level: 3, afterMinutes: 480, notifyRoles: ["ceo"] },
    ],
    businessHoursOnly: true,
    excludeWeekends: true,
    excludeHolidays: true,
    maxViolationsPerDay: 3,
    autoResolve: false,
  },
  {
    scheduleType: "exam",
    responseMinutes: 60,
    completionMinutes: 1440,
    reminderBeforeMinutes: [1440, 4320],
    escalationMinutes: 180,
    businessHoursOnly: true,
    excludeWeekends: false,
    excludeHolidays: false,
    maxViolationsPerDay: 5,
    autoResolve: false,
  },
  {
    scheduleType: "interview",
    responseMinutes: 60,
    completionMinutes: 1440,
    reminderBeforeMinutes: [30, 120, 1440],
    escalationMinutes: 120,
    escalationLevels: [
      { level: 1, afterMinutes: 60, notifyRoles: ["hr_manager"] },
      { level: 2, afterMinutes: 120, notifyRoles: ["hr_director"] },
    ],
    businessHoursOnly: true,
    excludeWeekends: true,
    excludeHolidays: true,
    maxViolationsPerDay: 3,
    autoResolve: false,
  },
  {
    scheduleType: "training",
    responseMinutes: 180,
    completionMinutes: 4320,
    reminderBeforeMinutes: [60, 1440],
    escalationMinutes: 360,
    businessHoursOnly: true,
    excludeWeekends: true,
    excludeHolidays: true,
    maxViolationsPerDay: 2,
    autoResolve: false,
  },
];

// ─── SLA Engine ───────────────────────────────────────────────────

class SchedulingSLAEngine {
  private policies: Map<string, SLAPolicy> = new Map();
  private violations: Map<string, SLAViolation[]> = new Map();
  private statusCache: Map<string, SLAStatus> = new Map();

  constructor() {
    // Register default policies
    DEFAULT_SLA_POLICIES.forEach((p) => this.registerPolicy(p));
  }

  /** Register or update an SLA policy for a schedule type */
  registerPolicy(policy: SLAPolicy): void {
    this.policies.set(policy.scheduleType, policy);
  }

  /** Get the SLA policy for a schedule type (falls back to generic) */
  getPolicy(scheduleType: string): SLAPolicy | undefined {
    return this.policies.get(scheduleType) ||
      this.policies.get("meeting");
  }

  /** Register multiple policies at once */
  registerPolicies(policies: SLAPolicy[]): void {
    policies.forEach((p) => this.registerPolicy(p));
  }

  /** Check SLA status for a schedule */
  checkSLA(schedule: any): SLAStatus {
    if (!schedule) {
      return {
        scheduleId: "unknown",
        policyName: "none",
        isCompliant: true,
        status: "pending",
        violations: [],
      };
    }

    const policy = this.getPolicy(schedule.scheduleType);
    if (!policy) {
      return {
        scheduleId: schedule._id,
        policyName: "default",
        isCompliant: true,
        status: "pending",
        violations: [],
      };
    }

    const now = Date.now();
    const createdAt = schedule.createdAt || schedule.start || now;
    const startTime = schedule.start || now;
    const endTime = schedule.end || startTime + 3600000;
    const violations: SLAViolation[] = [];
    let isCompliant = true;
    let status: SLAStatus["status"] = "within_sla";

    // Response SLA — check if schedule needs approval
    if (
      schedule.approvalRequired &&
      policy.responseMinutes &&
      schedule.status === "pending_approval"
    ) {
      const responseDeadline = this.calculateBusinessDeadline(
        createdAt,
        policy.responseMinutes,
        policy,
      );
      if (now > responseDeadline) {
        const violation: SLAViolation = {
          scheduleId: schedule._id,
          scheduleTitle: schedule.title,
          type: "response",
          severity: "critical",
          triggeredAt: now,
          deadline: responseDeadline,
          actual: now,
          delta: now - responseDeadline,
          policyName: policy.scheduleType,
          notified: false,
          resolved: false,
        };
        violations.push(violation);
        isCompliant = false;
        status = "breached";
      } else if (responseDeadline - now < 3600000) {
        // Within 1 hour of deadline
        status = "approaching_sla";
      }
    }

    // Completion SLA — check if schedule is past due
    if (
      schedule.status !== "completed" &&
      schedule.status !== "cancelled" &&
      policy.completionMinutes
    ) {
      const completionDeadline = this.calculateBusinessDeadline(
        startTime,
        policy.completionMinutes,
        policy,
      );
      if (now > endTime && now > completionDeadline) {
        const violation: SLAViolation = {
          scheduleId: schedule._id,
          scheduleTitle: schedule.title,
          type: "completion",
          severity: "warning",
          triggeredAt: now,
          deadline: completionDeadline,
          actual: now,
          delta: now - completionDeadline,
          policyName: policy.scheduleType,
          notified: false,
          resolved: false,
        };
        violations.push(violation);
        isCompliant = false;
        status = "breached";
      }
    }

    // Reminder SLA — check if reminders need to fire
    if (policy.reminderBeforeMinutes && startTime > now) {
      for (const minutes of policy.reminderBeforeMinutes) {
        const reminderTime = startTime - minutes * 60 * 1000;
        if (now >= reminderTime && now < startTime) {
          // Reminder is due or past due
          const delta = now - reminderTime;
          if (delta > 60000) {
            // More than 1 minute late
            violations.push({
              scheduleId: schedule._id,
              scheduleTitle: schedule.title,
              type: "reminder",
              severity: "info",
              triggeredAt: now,
              deadline: reminderTime,
              actual: now,
              delta,
              policyName: policy.scheduleType,
              notified: false,
              resolved: false,
            });
          }
        }
      }
    }

    // Escalation SLA — check if approval is overdue
    if (
      schedule.approvalRequired &&
      schedule.status === "pending_approval" &&
      policy.escalationMinutes &&
      policy.escalationLevels
    ) {
      const escalationDeadline = this.calculateBusinessDeadline(
        createdAt,
        policy.escalationMinutes,
        policy,
      );
      if (now > escalationDeadline) {
        violations.push({
          scheduleId: schedule._id,
          scheduleTitle: schedule.title,
          type: "escalation",
          severity: "critical",
          triggeredAt: now,
          deadline: escalationDeadline,
          actual: now,
          delta: now - escalationDeadline,
          policyName: policy.scheduleType,
          notified: false,
          resolved: false,
        });
        isCompliant = false;
        status = "breached";
      }
    }

    const slaStatus: SLAStatus = {
      scheduleId: schedule._id,
      policyName: policy.scheduleType,
      isCompliant,
      status,
      violations,
    };

    // Cache violations
    if (violations.length > 0) {
      const existing = this.violations.get(schedule._id) || [];
      this.violations.set(schedule._id, [...existing, ...violations]);
    }

    this.statusCache.set(schedule._id, slaStatus);
    return slaStatus;
  }

  /** Check SLA for multiple schedules */
  checkBulkSLA(schedules: any[]): SLAStatus[] {
    return schedules.map((s) => this.checkSLA(s));
  }

  /** Get all active violations */
  getActiveViolations(filter?: {
    severity?: string;
    type?: string;
    resolved?: boolean;
  }): SLAViolation[] {
    const all: SLAViolation[] = [];
    this.violations.forEach((list) => {
      list.forEach((v) => {
        if (filter?.severity && v.severity !== filter.severity) return;
        if (filter?.type && v.type !== filter.type) return;
        if (filter?.resolved !== undefined && v.resolved !== filter.resolved) return;
        all.push(v);
      });
    });
    return all.sort((a, b) => b.triggeredAt - a.triggeredAt);
  }

  /** Resolve a violation */
  resolveViolation(scheduleId: string, violationIndex: number): boolean {
    const violations = this.violations.get(scheduleId);
    if (!violations || !violations[violationIndex]) return false;
    violations[violationIndex].resolved = true;
    violations[violationIndex].resolvedAt = Date.now();
    return true;
  }

  /** Get SLA compliance score (0-100) for a set of schedules */
  getComplianceScore(schedules: any[]): {
    score: number;
    total: number;
    compliant: number;
    breached: number;
    approaching: number;
  } {
    if (!schedules?.length) {
      return { score: 100, total: 0, compliant: 0, breached: 0, approaching: 0 };
    }
    const statuses = this.checkBulkSLA(schedules);
    const compliant = statuses.filter((s) => s.isCompliant).length;
    const breached = statuses.filter((s) => s.status === "breached").length;
    const approaching = statuses.filter((s) => s.status === "approaching_sla").length;
    const score = Math.round((compliant / statuses.length) * 100);
    return { score, total: statuses.length, compliant, breached, approaching };
  }

  /** Calculate a business-hours-aware deadline */
  private calculateBusinessDeadline(
    from: number,
    minutes: number,
    policy: SLAPolicy,
  ): number {
    let current = from;
    let remainingMinutes = minutes;

    while (remainingMinutes > 0) {
      current += 60 * 1000; // Add 1 minute
      remainingMinutes--;

      // Skip if business hours only and outside hours
      if (policy.businessHoursOnly && !isBusinessHour(current)) {
        remainingMinutes++; // Don't count this minute
      }

      // Skip weekends
      if (policy.excludeWeekends && isWeekend(current)) {
        remainingMinutes++; // Don't count this minute
      }

      // Skip holidays
      if (policy.excludeHolidays && isHoliday(current)) {
        remainingMinutes++; // Don't count this minute
      }
    }

    return current;
  }

  /** Get total violation count for dashboard KPIs */
  getViolationStats(): { total: number; critical: number; warning: number; info: number } {
    let total = 0, critical = 0, warning = 0, info = 0;
    this.violations.forEach((list) => {
      list.forEach((v) => {
        total++;
        if (v.severity === "critical") critical++;
        else if (v.severity === "warning") warning++;
        else info++;
      });
    });
    return { total, critical, warning, info };
  }

  /** Clear violations for a schedule (when schedule is resolved/deleted) */
  clearViolations(scheduleId: string): void {
    this.violations.delete(scheduleId);
    this.statusCache.delete(scheduleId);
  }

  /** Reset all violations */
  resetAll(): void {
    this.violations.clear();
    this.statusCache.clear();
  }
}

export const schedulingSLA = new SchedulingSLAEngine();
