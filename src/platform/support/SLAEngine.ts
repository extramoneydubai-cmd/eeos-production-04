/**
 * SLAEngine — Support Service Level Agreement Engine
 *
 * Supports:
 * - Response SLA (first response time)
 * - Resolution SLA (time to resolve)
 * - Priority-based SLA targets
 * - Escalation chain (auto-escalate when SLA breached)
 * - Working hours awareness
 * - Holiday/weekend exclusion
 * - Compliance rate tracking
 */

export interface SLAPolicy {
  id: string;
  name: string;
  priority: string;
  responseMinutes: number;      // Target time for first response
  resolutionMinutes: number;    // Target time for resolution
  escalationMinutes: number;    // Time before escalation triggers
  workingHoursOnly: boolean;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  autoEscalate: boolean;
  escalationLevels: { level: number; afterMinutes: number; notifyRoles: string[] }[];
}

export interface SLAStatus {
  ticketId: string;
  policyId: string;
  responseDueAt: number;
  resolutionDueAt: number;
  firstResponseAt?: number;
  resolvedAt?: number;
  responseSlaMet?: boolean;
  resolutionSlaMet?: boolean;
  breachCount: number;
  lastBreachAt?: number;
  escalationLevel: number;
  escalatedAt?: number;
  status: "within_sla" | "approaching" | "breached" | "escalated" | "met";
}

const DEFAULT_POLICIES: SLAPolicy[] = [
  { id: "critical", name: "Critical SLA", priority: "critical",
    responseMinutes: 15, resolutionMinutes: 120, escalationMinutes: 30,
    workingHoursOnly: false, excludeWeekends: false, excludeHolidays: false,
    autoEscalate: true, escalationLevels: [{ level: 1, afterMinutes: 15, notifyRoles: ["manager"] }, { level: 2, afterMinutes: 30, notifyRoles: ["director"] }] },
  { id: "high", name: "High SLA", priority: "high",
    responseMinutes: 30, resolutionMinutes: 240, escalationMinutes: 60,
    workingHoursOnly: true, excludeWeekends: false, excludeHolidays: false,
    autoEscalate: true, escalationLevels: [{ level: 1, afterMinutes: 30, notifyRoles: ["manager"] }, { level: 2, afterMinutes: 60, notifyRoles: ["director"] }] },
  { id: "medium", name: "Medium SLA", priority: "medium",
    responseMinutes: 60, resolutionMinutes: 480, escalationMinutes: 120,
    workingHoursOnly: true, excludeWeekends: true, excludeHolidays: true,
    autoEscalate: true, escalationLevels: [{ level: 1, afterMinutes: 60, notifyRoles: ["manager"] }] },
  { id: "low", name: "Low SLA", priority: "low",
    responseMinutes: 120, resolutionMinutes: 1440, escalationMinutes: 360,
    workingHoursOnly: true, excludeWeekends: true, excludeHolidays: true,
    autoEscalate: false, escalationLevels: [] },
];

let HOLIDAYS: Set<string> = new Set();

export function setSupportHolidays(dates: number[]) {
  HOLIDAYS = new Set(dates.map((d) => new Date(d).toDateString()));
}

class SLAEngineImpl {
  private policies: Map<string, SLAPolicy> = new Map();
  private slaStatuses: Map<string, SLAStatus> = new Map();

  constructor() {
    DEFAULT_POLICIES.forEach((p) => this.policies.set(p.id, p));
  }

  registerPolicy(policy: SLAPolicy): void {
    this.policies.set(policy.id, policy);
  }

  getPolicy(priority: string): SLAPolicy | undefined {
    return this.policies.get(priority) || this.policies.get("medium");
  }

  calculateDeadlines(priority: string, startTime: number): { responseDueAt: number; resolutionDueAt: number } {
    const policy = this.getPolicy(priority);
    if (!policy) return { responseDueAt: startTime + 3600000, resolutionDueAt: startTime + 28800000 };

    return {
      responseDueAt: this.calculateBusinessDeadline(startTime, policy.responseMinutes, policy),
      resolutionDueAt: this.calculateBusinessDeadline(startTime, policy.resolutionMinutes, policy),
    };
  }

  checkSLA(ticketId: string, priority: string, createdAt: number, firstResponseAt?: number, resolvedAt?: number): SLAStatus {
    const policy = this.getPolicy(priority);
    if (!policy) return { ticketId, policyId: "unknown", responseDueAt: 0, resolutionDueAt: 0, breachCount: 0, escalationLevel: 0, status: "within_sla" };

    const { responseDueAt, resolutionDueAt } = this.calculateDeadlines(priority, createdAt);
    const now = Date.now();
    let breachCount = 0;
    let status: SLAStatus["status"] = "within_sla";

    // Check response SLA
    let responseSlaMet = true;
    if (firstResponseAt) {
      responseSlaMet = firstResponseAt <= responseDueAt;
      if (!responseSlaMet) breachCount++;
    } else if (now > responseDueAt) {
      responseSlaMet = false;
      breachCount++;
      status = now > policy.escalationMinutes * 60 * 1000 + responseDueAt ? "escalated" : "breached";
    } else if (responseDueAt - now < responseDueAt - createdAt * 0.2) {
      status = "approaching";
    }

    // Check resolution SLA
    let resolutionSlaMet = true;
    if (resolvedAt) {
      resolutionSlaMet = resolvedAt <= resolutionDueAt;
      if (!resolutionSlaMet) breachCount++;
      status = "met";
    } else if (now > resolutionDueAt) {
      resolutionSlaMet = false;
      breachCount++;
      status = "breached";
    }

    const slaStatus: SLAStatus = {
      ticketId,
      policyId: policy.id,
      responseDueAt,
      resolutionDueAt,
      firstResponseAt,
      resolvedAt,
      responseSlaMet,
      resolutionSlaMet,
      breachCount,
      lastBreachAt: breachCount > 0 ? now : undefined,
      escalationLevel: policy.autoEscalate && status === "escalated" ? 1 : 0,
      escalatedAt: status === "escalated" ? now : undefined,
      status,
    };

    this.slaStatuses.set(ticketId, slaStatus);
    return slaStatus;
  }

  recordFirstResponse(ticketId: string, timestamp: number): void {
    const status = this.slaStatuses.get(ticketId);
    if (status) {
      status.firstResponseAt = timestamp;
      status.responseSlaMet = timestamp <= status.responseDueAt;
    }
  }

  recordResolution(ticketId: string, timestamp: number): void {
    const status = this.slaStatuses.get(ticketId);
    if (status) {
      status.resolvedAt = timestamp;
      status.resolutionSlaMet = timestamp <= status.resolutionDueAt;
      status.status = "met";
    }
  }

  getSLAStatus(ticketId: string): SLAStatus | undefined {
    return this.slaStatuses.get(ticketId);
  }

  getComplianceStats(): { total: number; met: number; breached: number; complianceRate: number } {
    const all = Array.from(this.slaStatuses.values());
    const met = all.filter((s) => s.responseSlaMet !== false).length;
    return {
      total: all.length,
      met,
      breached: all.length - met,
      complianceRate: all.length > 0 ? Math.round((met / all.length) * 100) : 100,
    };
  }

  private calculateBusinessDeadline(from: number, minutes: number, policy: SLAPolicy): number {
    let current = from;
    let remaining = minutes;

    while (remaining > 0) {
      current += 60000;
      remaining--;

      if (policy.workingHoursOnly) {
        const hour = new Date(current).getHours();
        if (hour < 8 || hour >= 18) remaining++;
      }
      if (policy.excludeWeekends) {
        const day = new Date(current).getDay();
        if (day === 0 || day === 6) remaining++;
      }
      if (policy.excludeHolidays && HOLIDAYS.has(new Date(current).toDateString())) {
        remaining++;
      }
    }

    return current;
  }

  reset(): void {
    this.slaStatuses.clear();
  }
}

export const slaEngine = new SLAEngineImpl();
