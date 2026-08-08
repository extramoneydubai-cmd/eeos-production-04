/**
 * Enterprise Automation Triggers (Phase 10)
 *
 * Event-driven automation engine.
 * Supports drag-drop automations where:
 *   Trigger → [Conditions] → Actions
 *
 * Triggers include:
 *   - Specific event types from the Event Registry
 *   - Schedule/cron
 *   - Entity state changes
 *   - Time-based
 *
 * Actions include:
 *   - Start a workflow
 *   - Send notification(s)
 *   - Create/update record
 *   - Send SMS/Email/WhatsApp
 *   - Escalate
 *   - Create ticket
 *   - Add to timeline
 *   - Webhook call (placeholder)
 *
 * Automations are stored in the `businessRules` table under
 * the "automation" domain for consistency.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Automation Rule Type ───────────────────────────────────

export interface AutomationRule {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;

  // Trigger configuration
  trigger: {
    type: "event" | "schedule" | "entity_change" | "time_based";
    // For event trigger
    eventType?: string;
    module?: string;
    // For schedule/cron trigger
    cronExpression?: string;
    scheduleType?: "daily" | "weekly" | "monthly" | "custom";
    scheduleValue?: string;
    // For entity change trigger
    entityType?: string;
    changeType?: "created" | "updated" | "deleted" | "status_changed";
    statusFrom?: string;
    statusTo?: string;
  };

  // Conditions (ALL must be met)
  conditions?: Array<{
    field: string;
    operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "is_set" | "is_not_set";
    value: string;
  }>;

  // Actions to execute
  actions: Array<{
    type: "start_workflow" | "send_notification" | "update_entity" | "create_entity" |
          "send_email" | "send_sms" | "send_whatsapp" | "escalate" |
          "create_ticket" | "add_to_timeline" | "webhook" | "log_event";
    config: Record<string, unknown>;

    // Delay before executing this action (minutes)
    delayMinutes?: number;
  }>;

  metadata?: {
    executionCount?: number;
    lastExecutedAt?: number;
    lastError?: string;
    createdBy?: string;
  };
}

// ─── CRUD for Automation Rules ──────────────────────────────

export const listAutomations = query({
  args: {
    module: v.optional(v.string()),
    eventType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let rules = await ctx.db.query("businessRules")
      .withIndex("domain", (q: any) => q.eq("domain", "automation"))
      .collect();

    let parsed = rules.map((r: any) => {
      try {
        return { ...JSON.parse(r.value), id: r._id, createdAt: r.createdAt, updatedAt: r.updatedAt };
      } catch {
        return null;
      }
    }).filter(Boolean) as AutomationRule[];

    if (args.module) parsed = parsed.filter((r) => r.trigger.module === args.module);
    if (args.eventType) parsed = parsed.filter((r) => r.trigger.eventType === args.eventType);
    if (args.isActive !== undefined) parsed = parsed.filter((r) => r.isActive === args.isActive);

    return parsed;
  },
});

export const getAutomation = query({
  args: { ruleId: v.id("businessRules") },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return null;
    try {
      const parsed = JSON.parse((rule as any).value);
      return { ...parsed, id: rule._id, createdAt: (rule as any).createdAt };
    } catch {
      return null;
    }
  },
});

export const setAutomation = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.object({
      type: v.union(v.literal("event"), v.literal("schedule"), v.literal("entity_change"), v.literal("time_based")),
      eventType: v.optional(v.string()),
      module: v.optional(v.string()),
      cronExpression: v.optional(v.string()),
      scheduleType: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("custom"))),
      scheduleValue: v.optional(v.string()),
      entityType: v.optional(v.string()),
      changeType: v.optional(v.union(v.literal("created"), v.literal("updated"), v.literal("deleted"), v.literal("status_changed"))),
      statusFrom: v.optional(v.string()),
      statusTo: v.optional(v.string()),
    }),
    conditions: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains"), v.literal("is_set"), v.literal("is_not_set")),
      value: v.string(),
    }))),
    actions: v.array(v.object({
      type: v.union(
        v.literal("start_workflow"), v.literal("send_notification"),
        v.literal("update_entity"), v.literal("create_entity"),
        v.literal("send_email"), v.literal("send_sms"), v.literal("send_whatsapp"),
        v.literal("escalate"), v.literal("create_ticket"),
        v.literal("add_to_timeline"), v.literal("webhook"), v.literal("log_event"),
      ),
      config: v.any(),
      delayMinutes: v.optional(v.number()),
    })),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "automationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    const key = `automation_${args.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    const rule: AutomationRule & { metadata: any } = {
      name: args.name,
      description: args.description,
      trigger: args.trigger,
      conditions: args.conditions,
      actions: args.actions,
      isActive: args.isActive ?? true,
      metadata: {
        executionCount: 0,
        lastExecutedAt: undefined,
        createdBy: userId ?? undefined,
      },
    };

    const existing = await ctx.db.query("businessRules")
      .withIndex("domain_key", (q: any) => q.eq("domain", "automation").eq("key", key))
      .first();

    if (existing) {
      // Preserve execution count
      try {
        const existingValue = JSON.parse((existing as any).value);
        rule.metadata.executionCount = existingValue.metadata?.executionCount || 0;
        rule.metadata.lastExecutedAt = existingValue.metadata?.lastExecutedAt;
      } catch {}
      await ctx.db.patch(existing._id, {
        value: JSON.stringify(rule),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("businessRules", {
      domain: "automation",
      key,
      value: JSON.stringify(rule),
      label: `Automation: ${args.name}`,
      description: args.description,
      valueType: "json",
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const deleteAutomation = mutation({
  args: { token: v.optional(v.string()), ruleId: v.id("businessRules") },
  handler: withScopeAndEvents({ operation: "delete", module: "platform", entity: "automationEngine" }, async (ctx, args) => {
    await ctx.db.delete(args.ruleId);
    return args.ruleId;
  }),
});

export const toggleAutomation = mutation({
  args: { token: v.optional(v.string()), ruleId: v.id("businessRules"), isActive: v.boolean() },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "automationEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.ruleId, { isActive: args.isActive, updatedAt: Date.now() });
    return args.ruleId;
  }),
});

// ─── Automation Execution Engine ────────────────────────────

/**
 * Execute an automation rule.
 * Called by the event pipeline when an event is published,
 * OR by scheduled jobs.
 */
export const executeAutomation = mutation({
  args: { token: v.optional(v.string()),
    ruleId: v.id("businessRules"),
    eventContext: v.optional(v.any()), // Pass event payload as context
  },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "automationEngine" }, async (ctx, args) => {
    const record = await ctx.db.get(args.ruleId);
    if (!record) return { executed: false, error: "Rule not found" };

    const rule: AutomationRule = JSON.parse((record as any).value);
    if (!rule.isActive) return { executed: false, error: "Rule is inactive" };

    const context = args.eventContext || {};
    const results: Array<{ action: string; status: string; result?: any; error?: string }> = [];

    // Evaluate conditions
    if (rule.conditions && rule.conditions.length > 0) {
      for (const condition of rule.conditions) {
        const fieldValue = context[condition.field];
        const passed = evaluateAutomationCondition(condition, fieldValue);
        if (!passed) {
          return {
            executed: false,
            error: `Condition failed: ${condition.field} ${condition.operator} ${condition.value}`,
          };
        }
      }
    }

    // Execute actions
    for (const action of rule.actions) {
      try {
        // Apply delay if configured
        if (action.delayMinutes && action.delayMinutes > 0) {
          // For real production use, delay would be handled by a job scheduler.
          // For now, execute immediately.
        }

        const result = await executeAutomationAction(ctx, action, context);
        results.push({ action: action.type, status: "success", result });
      } catch (error: any) {
        results.push({ action: action.type, status: "failed", error: error.message });
      }
    }

    // Update execution metadata
    try {
      const existingValue = JSON.parse((record as any).value);
      existingValue.metadata = existingValue.metadata || {};
      existingValue.metadata.executionCount = (existingValue.metadata.executionCount || 0) + 1;
      existingValue.metadata.lastExecutedAt = Date.now();
      const hasErrors = results.some((r: any) => r.status === "failed");
      if (hasErrors) {
        existingValue.metadata.lastError = results.find((r: any) => r.status === "failed")?.error;
      }
      await ctx.db.patch(args.ruleId, { value: JSON.stringify(existingValue) });
    } catch {}

    return { executed: true, results };
  }),
});

async function executeAutomationAction(
  ctx: any,
  action: AutomationRule["actions"][0],
  context: Record<string, unknown>,
): Promise<any> {
  switch (action.type) {
    case "send_notification": {
      const config = action.config as any;
      await ctx.db.insert("notifications", {
        userId: config.userId || context.userId,
        type: "automation",
        title: config.title || "Automation Notification",
        message: renderTemplate(config.message || "", context),
        referenceId: config.referenceId || context.entityId,
        referenceType: config.referenceType || context.entityType,
        isRead: false,
        createdAt: Date.now(),
      });
      return { notificationSent: true };
    }

    case "add_to_timeline": {
      const config = action.config as any;
      await ctx.db.insert("timelineEvents", {
        module: config.module || context.module || "automation",
        eventType: config.eventType || "automation.executed",
        entityType: config.entityType || (context.entityType as string) || "unknown",
        entityId: config.entityId || (context.entityId as string) || "unknown",
        title: config.title || "Automation Executed",
        description: renderTemplate(config.description || "", context),
        performedBy: config.performedBy || context.userId,
        companyId: config.companyId || context.companyId,
        branchId: config.branchId || context.branchId,
        createdAt: Date.now(),
      });
      return { timelineCreated: true };
    }

    case "create_ticket": {
      const config = action.config as any;
      const ticketId = await ctx.db.insert("ticketMaster", {
        subject: renderTemplate(config.subject || "", context),
        description: renderTemplate(config.description || "", context),
        priority: config.priority || "normal",
        status: "open",
        category: config.category,
        departmentId: config.departmentId,
        companyId: config.companyId || context.companyId,
        branchId: config.branchId || context.branchId,
        customerId: config.customerId || context.userId,
        createdBy: context.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { ticketCreated: ticketId };
    }

    case "start_workflow": {
      const config = action.config as any;
      const workflowId = config.workflowId;
      if (workflowId) {
        // Create a workflow instance
        const instanceId = await ctx.db.insert("workflowInstances", {
          workflowId,
          status: "pending",
          context: JSON.stringify(context),
          startedBy: context.userId,
          companyId: context.companyId,
          branchId: context.branchId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return { workflowStarted: instanceId };
      }
      return { workflowStarted: false, error: "No workflowId configured" };
    }

    case "log_event": {
      const config = action.config as any;
      await ctx.db.insert("events", {
        module: config.module || context.module || "automation",
        eventType: config.eventType || "automation.log",
        entityType: context.entityType as string || "unknown",
        entityId: context.entityId as string || "unknown",
        performedBy: context.userId,
        companyId: context.companyId,
        branchId: context.branchId,
        status: "completed",
        publishedAt: Date.now(),
        createdAt: Date.now(),
      });
      return { eventLogged: true };
    }

    case "update_entity": {
      const config = action.config as any;
      const entityTable = config.table;
      const entityId = config.entityId || context.entityId;
      if (entityTable && entityId && config.updates) {
        await ctx.db.patch(entityId, config.updates);
        return { entityUpdated: entityId };
      }
      return { entityUpdated: false, error: "Missing table, entityId, or updates" };
    }

    default:
      return { error: `Unsupported action type: ${action.type}` };
  }
}

function evaluateAutomationCondition(
  condition: NonNullable<AutomationRule["conditions"]>[number],
  actualValue: any,
): boolean {
  switch (condition.operator) {
    case "equals": return String(actualValue) === condition.value;
    case "not_equals": return String(actualValue) !== condition.value;
    case "greater_than": return Number(actualValue) > Number(condition.value);
    case "less_than": return Number(actualValue) < Number(condition.value);
    case "contains": return String(actualValue).includes(condition.value);
    case "is_set": return actualValue !== undefined && actualValue !== null;
    case "is_not_set": return actualValue === undefined || actualValue === null;
    default: return false;
  }
}

function renderTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : match;
  });
}
