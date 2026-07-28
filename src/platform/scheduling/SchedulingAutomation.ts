/**
 * SchedulingAutomation — Enterprise Scheduling Automation Rules Engine
 *
 * Defines and executes automation rules for scheduling events.
 * Every schedule type can have automation chains.
 *
 * Examples:
 *   When Interview Created → Book Room → Notify HR → Notify Candidate
 *   When Exam Published → Reserve Classrooms → Allocate Invigilators → Notify Students
 *
 * Rules are modular, extensible, and integrate with the Event Pipeline.
 */

// ─── Types ────────────────────────────────────────────────────────

export type AutomationTrigger =
  | "schedule.created"
  | "schedule.updated"
  | "schedule.confirmed"
  | "schedule.completed"
  | "schedule.cancelled"
  | "schedule.approved"
  | "schedule.rejected"
  | "schedule.reminder"
  | "schedule.escalated"
  | "schedule.sla_breach";

export type AutomationActionType =
  | "notify"
  | "reserve_resource"
  | "release_resource"
  | "create_timeline"
  | "create_audit"
  | "create_operations_event"
  | "send_email"
  | "send_sms"
  | "send_whatsapp"
  | "send_push"
  | "update_status"
  | "trigger_workflow"
  | "log_activity"
  | "generate_report";

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, any>;
  condition?: (schedule: any, context: any) => boolean;
  order: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  scheduleTypes: string[]; // Apply to which schedule types ("*" = all)
  actions: AutomationAction[];
  enabled: boolean;
  priority: number;
  maxExecutions?: number;
  cooldownMs?: number;
  createdBy?: string;
}

export interface AutomationExecution {
  ruleId: string;
  scheduleId: string;
  trigger: AutomationTrigger;
  startedAt: number;
  completedAt?: number;
  status: "running" | "completed" | "failed" | "skipped";
  actionsCompleted: number;
  actionsTotal: number;
  error?: string;
  result?: Record<string, any>;
}

export interface AutomationStats {
  totalRules: number;
  enabledRules: number;
  totalExecutions: number;
  successRate: number;
  failedToday: number;
  runningNow: number;
  mostActiveRules: { ruleId: string; name: string; count: number }[];
}

// ─── Built-in Automation Rules ────────────────────────────────────

const BUILT_IN_RULES: AutomationRule[] = [
  {
    id: "interview-created",
    name: "Interview Created — Auto Setup",
    description: "When an interview is created, reserve room, notify panel, and create timeline",
    trigger: "schedule.created",
    scheduleTypes: ["interview"],
    enabled: true,
    priority: 100,
    actions: [
      {
        type: "reserve_resource",
        config: { resourceType: "meeting_room", autoSelect: true },
        order: 1,
      },
      {
        type: "notify",
        config: { channels: ["in_app", "email"], roles: ["hr_manager", "interviewer"] },
        order: 2,
      },
      {
        type: "create_timeline",
        config: { eventType: "interview_scheduled" },
        order: 3,
      },
      {
        type: "create_audit",
        config: { action: "interview_auto_setup" },
        order: 4,
      },
      {
        type: "create_operations_event",
        config: { eventType: "automation.interview_setup" },
        order: 5,
      },
    ],
  },
  {
    id: "exam-published",
    name: "Exam Published — Auto Allocation",
    description: "When an exam is published, reserve classrooms, allocate invigilators, notify students",
    trigger: "schedule.confirmed",
    scheduleTypes: ["exam"],
    enabled: true,
    priority: 90,
    actions: [
      {
        type: "reserve_resource",
        config: { resourceType: "classroom", autoSelect: true },
        order: 1,
      },
      {
        type: "reserve_resource",
        config: { resourceType: "exam_hall", autoSelect: true },
        order: 2,
      },
      {
        type: "notify",
        config: { channels: ["in_app", "email", "sms"], roles: ["student"] },
        order: 3,
      },
      {
        type: "create_timeline",
        config: { eventType: "exam_published" },
        order: 4,
      },
      {
        type: "create_audit",
        config: { action: "exam_auto_allocated" },
        order: 5,
      },
    ],
  },
  {
    id: "meeting-created",
    name: "Meeting Created — Room & Notification",
    description: "When a meeting is created, book room and notify participants",
    trigger: "schedule.created",
    scheduleTypes: ["meeting"],
    enabled: true,
    priority: 80,
    actions: [
      {
        type: "reserve_resource",
        config: { resourceType: "meeting_room", autoSelect: true },
        order: 1,
      },
      {
        type: "notify",
        config: { channels: ["in_app", "email"], roles: ["participant"] },
        order: 2,
      },
      {
        type: "create_timeline",
        config: { eventType: "meeting_scheduled" },
        order: 3,
      },
    ],
  },
  {
    id: "training-scheduled",
    name: "Training Scheduled — Resource Setup",
    description: "When training is scheduled, reserve lab/classroom and notify trainees",
    trigger: "schedule.created",
    scheduleTypes: ["training"],
    enabled: true,
    priority: 70,
    actions: [
      {
        type: "reserve_resource",
        config: { resourceType: "classroom", autoSelect: true },
        order: 1,
      },
      {
        type: "reserve_resource",
        config: { resourceType: "lab", autoSelect: true },
        order: 2,
      },
      {
        type: "notify",
        config: { channels: ["in_app", "email"], roles: ["participant", "trainer"] },
        order: 3,
      },
    ],
  },
  {
    id: "schedule-completed",
    name: "Schedule Completed — Cleanup & Release",
    description: "Release reserved resources and create completion record",
    trigger: "schedule.completed",
    scheduleTypes: ["*"],
    enabled: true,
    priority: 50,
    actions: [
      {
        type: "release_resource",
        config: {},
        order: 1,
      },
      {
        type: "log_activity",
        config: { action: "schedule_completed" },
        order: 2,
      },
      {
        type: "create_audit",
        config: { action: "schedule_auto_completed" },
        order: 3,
      },
    ],
  },
  {
    id: "schedule-cancelled",
    name: "Schedule Cancelled — Release & Notify",
    description: "Release resources and notify participants when cancelled",
    trigger: "schedule.cancelled",
    scheduleTypes: ["*"],
    enabled: true,
    priority: 60,
    actions: [
      {
        type: "release_resource",
        config: {},
        order: 1,
      },
      {
        type: "notify",
        config: { channels: ["in_app", "email"], roles: ["participant", "owner"] },
        order: 2,
      },
      {
        type: "create_audit",
        config: { action: "schedule_auto_cancelled" },
        order: 3,
      },
    ],
  },
  {
    id: "sla-breach-created",
    name: "SLA Breach — Escalate Notify",
    description: "When SLA is breached, notify escalation chain",
    trigger: "schedule.sla_breach",
    scheduleTypes: ["*"],
    enabled: true,
    priority: 100,
    actions: [
      {
        type: "notify",
        config: { channels: ["in_app", "email"], roles: ["manager", "director"] },
        order: 1,
      },
      {
        type: "create_operations_event",
        config: { eventType: "automation.sla_breach" },
        order: 2,
      },
    ],
  },
  {
    id: "schedule-reminder",
    name: "Schedule Reminder — Notify Participants",
    description: "Send reminder notifications before schedule starts",
    trigger: "schedule.reminder",
    scheduleTypes: ["*"],
    enabled: true,
    priority: 90,
    actions: [
      {
        type: "notify",
        config: { channels: ["in_app", "push"], roles: ["participant", "owner"] },
        order: 1,
      },
      {
        type: "create_operations_event",
        config: { eventType: "automation.reminder_sent" },
        order: 2,
      },
    ],
  },
];

// ─── Automation Engine ────────────────────────────────────────────

class SchedulingAutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private executions: AutomationExecution[] = [];
  private executionHistory: AutomationExecution[] = [];
  private cooldowns: Map<string, number> = new Map(); // ruleId → last execution

  constructor() {
    // Register built-in rules
    BUILT_IN_RULES.forEach((rule) => this.registerRule(rule));
  }

  /** Register a new automation rule */
  registerRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
  }

  /** Remove a rule */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /** Enable/disable a rule */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = enabled;
    return true;
  }

  /** Get a rule by ID */
  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId);
  }

  /** Get all rules */
  getAllRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  /** Get enabled rules for a trigger and schedule type */
  getMatchingRules(trigger: AutomationTrigger, scheduleType: string): AutomationRule[] {
    return Array.from(this.rules.values())
      .filter(
        (rule) =>
          rule.enabled &&
          rule.trigger === trigger &&
          (rule.scheduleTypes.includes("*") || rule.scheduleTypes.includes(scheduleType)),
      )
      .sort((a, b) => b.priority - a.priority);
  }

  /** Execute automation for a schedule event */
  async executeAutomation(
    trigger: AutomationTrigger,
    schedule: any,
    context: any = {},
  ): Promise<AutomationExecution[]> {
    const matchingRules = this.getMatchingRules(trigger, schedule?.scheduleType);
    if (matchingRules.length === 0) return [];

    const results: AutomationExecution[] = [];

    for (const rule of matchingRules) {
      // Check cooldown
      if (rule.cooldownMs) {
        const lastRun = this.cooldowns.get(rule.id) || 0;
        if (Date.now() - lastRun < rule.cooldownMs) continue;
      }

      // Check max executions
      if (rule.maxExecutions) {
        const executionCount = this.executionHistory.filter(
          (e) => e.ruleId === rule.id && e.status === "completed",
        ).length;
        if (executionCount >= rule.maxExecutions) continue;
      }

      const execution: AutomationExecution = {
        ruleId: rule.id,
        scheduleId: schedule?._id,
        trigger,
        startedAt: Date.now(),
        status: "running",
        actionsCompleted: 0,
        actionsTotal: rule.actions.length,
      };

      try {
        // Execute each action
        for (const action of rule.actions) {
          // Check condition
          if (action.condition && !action.condition(schedule, context)) {
            execution.actionsCompleted++;
            continue;
          }

          await this.executeAction(action, schedule, context);
          execution.actionsCompleted++;
        }

        execution.status = "completed";
        execution.completedAt = Date.now();
      } catch (err: any) {
        execution.status = "failed";
        execution.error = err.message || "Unknown error";
        execution.completedAt = Date.now();
      }

      this.cooldowns.set(rule.id, Date.now());
      this.executions.push(execution);
      this.executionHistory.push(execution);
      results.push(execution);
    }

    return results;
  }

  /** Execute a single automation action */
  private async executeAction(
    action: AutomationAction,
    schedule: any,
    context: any,
  ): Promise<void> {
    switch (action.type) {
      case "notify": {
        const { channels, roles } = action.config;
        // In production, this would call the Notification Engine
        // For now we log the intent
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Notify: ${channels?.join(",")} for ${roles?.join(",")}`);
        }
        break;
      }

      case "reserve_resource": {
        const { resourceType } = action.config;
        // Auto-select first available resource of this type
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Reserve resource: ${resourceType}`);
        }
        break;
      }

      case "release_resource": {
        // Release all resources associated with this schedule
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Release resources for schedule: ${schedule?._id}`);
        }
        break;
      }

      case "create_timeline": {
        // Would call eventSdk
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Create timeline: ${action.config.eventType}`);
        }
        break;
      }

      case "create_audit": {
        // Would call audit engine
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Create audit: ${action.config.action}`);
        }
        break;
      }

      case "create_operations_event": {
        // Would fire operations event
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Operations event: ${action.config.eventType}`);
        }
        break;
      }

      case "log_activity": {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[SchedulingAutomation] Log activity: ${action.config.action}`);
        }
        break;
      }

      default:
        // Silently skip unknown actions
        break;
    }
  }

  /** Get automation execution history */
  getExecutionHistory(limit = 50): AutomationExecution[] {
    return this.executionHistory.slice(-limit).reverse();
  }

  /** Get recent executions for a specific schedule */
  getScheduleExecutions(scheduleId: string): AutomationExecution[] {
    return this.executionHistory.filter((e) => e.scheduleId === scheduleId);
  }

  /** Get automation stats */
  getStats(): AutomationStats {
    const totalRules = this.rules.size;
    const enabledRules = Array.from(this.rules.values()).filter((r) => r.enabled).length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayExecutions = this.executionHistory.filter(
      (e) => e.startedAt >= todayStart.getTime(),
    );
    const succeeded = todayExecutions.filter((e) => e.status === "completed").length;
    const failed = todayExecutions.filter((e) => e.status === "failed").length;
    const running = this.executions.filter((e) => e.status === "running").length;

    // Most active rules
    const ruleCounts: Record<string, number> = {};
    this.executionHistory.forEach((e) => {
      ruleCounts[e.ruleId] = (ruleCounts[e.ruleId] || 0) + 1;
    });
    const mostActiveRules = Object.entries(ruleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ruleId, count]) => {
        const rule = this.rules.get(ruleId);
        return { ruleId, name: rule?.name || ruleId, count };
      });

    return {
      totalRules,
      enabledRules,
      totalExecutions: this.executionHistory.length,
      successRate: totalRules > 0 ? Math.round((succeeded / (succeeded + failed || 1)) * 100) : 100,
      failedToday: failed,
      runningNow: running,
      mostActiveRules,
    };
  }

  /** Reset all execution history */
  resetHistory(): void {
    this.executionHistory = [];
    this.executions = [];
    this.cooldowns.clear();
  }
}

export const schedulingAutomation = new SchedulingAutomationEngine();
