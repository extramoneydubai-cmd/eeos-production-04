/**
 * Automation SDK — Enterprise Automation Runtime
 *
 * Wires the existing automationEngine. Event/schedule/entity-change
 * triggers evaluate conditions and execute actions (workflow start,
 * notifications, emails, SMS, WhatsApp, escalation, tickets, timeline).
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const rules = await PlatformSDK.automation.list(ctx, { module: "finance" });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";

/**
 * List automation rules with optional filters.
 */
export const list = query({
  args: {
    module: v.optional(v.string()),
    eventType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listAutomations } = await import("../../convex/automationEngine");
    return listAutomations.handler(ctx, args);
  },
});

/**
 * Get a single automation rule.
 */
export const get = query({
  args: { ruleId: v.id("businessRules") },
  handler: async (ctx, args) => {
    const { getAutomation } = await import("../../convex/automationEngine");
    return getAutomation.handler(ctx, args);
  },
});

/**
 * Create or update an automation rule (trigger + conditions + actions).
 */
export const set = mutation({
  args: {
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
  handler: async (ctx, args) => {
    const { setAutomation } = await import("../../convex/automationEngine");
    return setAutomation.handler(ctx, args);
  },
});

/**
 * Delete an automation rule.
 */
export const remove = mutation({
  args: { ruleId: v.id("businessRules") },
  handler: async (ctx, args) => {
    const { deleteAutomation } = await import("../../convex/automationEngine");
    return deleteAutomation.handler(ctx, args);
  },
});

/**
 * Enable/disable an automation rule.
 */
export const toggle = mutation({
  args: { ruleId: v.id("businessRules"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const { toggleAutomation } = await import("../../convex/automationEngine");
    return toggleAutomation.handler(ctx, args);
  },
});

/**
 * Execute an automation rule with an event context payload.
 */
export const execute = mutation({
  args: {
    ruleId: v.id("businessRules"),
    eventContext: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { executeAutomation } = await import("../../convex/automationEngine");
    return executeAutomation.handler(ctx, args);
  },
});
