/**
 * Enterprise Notification Matrix (Phase 4)
 *
 * Configurable notification routing rules.
 * Every event defines WHO gets notified based on module, event type,
 * entity, role, and user attributes.
 *
 * Rules are stored in the `businessRules` table under the
 * `notification_matrix` domain.
 *
 * Default rules:
 *   Cheque Bounce → Parent + Counsellor + Collections + Finance + Branch Head + CEO (threshold)
 *   Refund Approved → Parent + Finance + Accounts + Branch
 *   Homework Assigned → Student + Parent + Faculty + Batch Coordinator
 *   Ticket Closed → Requester + Assignee + Manager
 *   Admission Created → Student + Parent + Counsellor + Branch Head
 *   Payment Received → Student + Parent + Finance + Accounts
 *   Exam Published → Student + Faculty + Branch Head
 *   Attendance Marked → Student + Parent (daily summary)
 *   Leave Approved → Employee + Manager + HR + Department Head
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Notification Rule Types ────────────────────────────────

export interface NotificationRule {
  id?: string;
  module: string;           // "finance", "student", "crm", etc.
  eventType: string;        // "cheque.bounced", "refund.approved", etc.
  recipients: Array<{
    role: string;           // "parent", "student", "faculty", "counsellor", "branch_head", "ceo", "finance", "manager"
    condition?: string;     // Optional condition expression (e.g., "amount > 100000" for CEO threshold)
    channel?: ("email" | "sms" | "whatsapp" | "push" | "in_app")[];
    delay?: number;         // Delay in minutes before sending
    templateRef?: string;   // Reference to notification template
    priority?: "low" | "normal" | "high" | "critical";
  }>;
  isActive: boolean;
  priority: "low" | "normal" | "high" | "critical";
}

// ─── Default Notification Matrix ────────────────────────────

const DEFAULT_RULES: NotificationRule[] = [
  {
    module: "finance", eventType: "cheque.bounced",
    recipients: [
      { role: "parent", channel: ["sms", "whatsapp", "in_app"], priority: "high" },
      { role: "counsellor", channel: ["in_app"], priority: "high" },
      { role: "collections", channel: ["in_app"], priority: "high" },
      { role: "finance", channel: ["email", "in_app"], priority: "high" },
      { role: "branch_head", channel: ["in_app"], priority: "normal" },
      { role: "ceo", condition: "bounceCount >= 2 || amount > 50000", channel: ["email", "in_app"], priority: "high" },
    ],
    isActive: true, priority: "high",
  },
  {
    module: "finance", eventType: "refund.approved",
    recipients: [
      { role: "parent", channel: ["sms", "whatsapp", "in_app"], priority: "high" },
      { role: "finance", channel: ["in_app"], priority: "high" },
      { role: "accounts", channel: ["in_app"], priority: "high" },
      { role: "branch_head", channel: ["in_app"], priority: "normal" },
    ],
    isActive: true, priority: "high",
  },
  {
    module: "academic", eventType: "homework.assigned",
    recipients: [
      { role: "student", channel: ["push", "in_app"], priority: "normal" },
      { role: "parent", channel: ["whatsapp", "in_app"], priority: "normal" },
      { role: "faculty", channel: ["in_app"], priority: "low" },
      { role: "batch_coordinator", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "support", eventType: "ticket.closed",
    recipients: [
      { role: "requester", channel: ["email", "in_app"], priority: "normal" },
      { role: "assignee", channel: ["in_app"], priority: "normal" },
      { role: "manager", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "admission", eventType: "admission.created",
    recipients: [
      { role: "student", channel: ["email", "in_app"], priority: "high" },
      { role: "parent", channel: ["sms", "whatsapp", "in_app"], priority: "high" },
      { role: "counsellor", channel: ["in_app"], priority: "normal" },
      { role: "branch_head", channel: ["in_app"], priority: "normal" },
    ],
    isActive: true, priority: "high",
  },
  {
    module: "finance", eventType: "payment.received",
    recipients: [
      { role: "student", channel: ["in_app"], priority: "normal" },
      { role: "parent", channel: ["sms", "whatsapp", "in_app"], priority: "normal" },
      { role: "finance", channel: ["in_app"], priority: "low" },
      { role: "accounts", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "academic", eventType: "exam.published",
    recipients: [
      { role: "student", channel: ["push", "in_app"], priority: "high" },
      { role: "faculty", channel: ["in_app"], priority: "normal" },
      { role: "branch_head", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "high",
  },
  {
    module: "hr", eventType: "leave.approved",
    recipients: [
      { role: "employee", channel: ["email", "in_app"], priority: "normal" },
      { role: "manager", channel: ["in_app"], priority: "low" },
      { role: "hr", channel: ["in_app"], priority: "low" },
      { role: "department_head", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "student", eventType: "attendance.marked",
    recipients: [
      { role: "student", channel: ["in_app"], priority: "low" },
      { role: "parent", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "low",
  },
  {
    module: "finance", eventType: "refund.initiated",
    recipients: [
      { role: "parent", channel: ["sms", "in_app"], priority: "normal" },
      { role: "finance", channel: ["in_app"], priority: "normal" },
      { role: "director", condition: "amount > 100000", channel: ["email", "in_app"], priority: "high" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "crm", eventType: "lead.converted",
    recipients: [
      { role: "counsellor", channel: ["in_app"], priority: "high" },
      { role: "branch_head", channel: ["in_app"], priority: "normal" },
      { role: "marketing", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "scheduling", eventType: "schedule.confirmed",
    recipients: [
      { role: "participant", channel: ["in_app"], priority: "normal" },
      { role: "organizer", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "normal",
  },
  {
    module: "inventory", eventType: "stock.low",
    recipients: [
      { role: "inventory_manager", channel: ["email", "in_app"], priority: "high" },
      { role: "branch_head", channel: ["in_app"], priority: "normal" },
      { role: "procurement", channel: ["in_app"], priority: "normal" },
    ],
    isActive: true, priority: "high",
  },
  {
    module: "hr", eventType: "employee.joined",
    recipients: [
      { role: "hr", channel: ["email", "in_app"], priority: "high" },
      { role: "manager", channel: ["in_app"], priority: "high" },
      { role: "it", channel: ["in_app"], priority: "normal" },
      { role: "department_head", channel: ["in_app"], priority: "normal" },
      { role: "branch_head", channel: ["in_app"], priority: "low" },
    ],
    isActive: true, priority: "high",
  },
  {
    module: "student", eventType: "student.cancelled",
    recipients: [
      { role: "parent", channel: ["sms", "whatsapp", "in_app"], priority: "critical" },
      { role: "counsellor", channel: ["in_app"], priority: "high" },
      { role: "finance", channel: ["in_app"], priority: "high" },
      { role: "branch_head", channel: ["email", "in_app"], priority: "high" },
      { role: "ceo", condition: "totalRefund > 100000", channel: ["email"], priority: "high" },
    ],
    isActive: true, priority: "critical",
  },
];

// ─── CRUD for Notification Rules ────────────────────────────

export const listNotificationRules = query({
  args: {
    module: v.optional(v.string()),
    eventType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let rules = await ctx.db.query("businessRules")
      .withIndex("domain", (q: any) => q.eq("domain", "notification_matrix"))
      .collect();

    let parsed = rules.map((r: any) => {
      try {
        return { ...JSON.parse(r.value), id: r._id };
      } catch {
        return null;
      }
    }).filter(Boolean) as NotificationRule[];

    if (args.module) parsed = parsed.filter((r) => r.module === args.module);
    if (args.eventType) parsed = parsed.filter((r) => r.eventType === args.eventType);
    if (args.isActive !== undefined) parsed = parsed.filter((r) => r.isActive === args.isActive);

    return parsed;
  },
});

export const setNotificationRule = mutation({
  args: { token: v.optional(v.string()),
    module: v.string(),
    eventType: v.string(),
    recipients: v.array(v.object({
      role: v.string(),
      condition: v.optional(v.string()),
      channel: v.optional(v.array(v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"), v.literal("push"), v.literal("in_app")))),
      delay: v.optional(v.number()),
      templateRef: v.optional(v.string()),
    })),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("critical"))),
  },
  handler: withScopeAndEvents({ operation: "update", module: "notifications", entity: "notificationMatrix" }, async (ctx, args) => {
    const key = `${args.module}.${args.eventType}`;
    const rule: NotificationRule = {
      module: args.module,
      eventType: args.eventType,
      recipients: args.recipients,
      isActive: args.isActive ?? true,
      priority: args.priority || "normal",
    };

    const existing = await ctx.db.query("businessRules")
      .withIndex("domain_key", (q: any) => q.eq("domain", "notification_matrix").eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: JSON.stringify(rule),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("businessRules", {
      domain: "notification_matrix",
      key,
      value: JSON.stringify(rule),
      label: `Notification: ${key}`,
      description: `Notification routing rule for ${key}`,
      valueType: "json",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const deleteNotificationRule = mutation({
  args: { token: v.optional(v.string()), ruleId: v.id("businessRules") },
  handler: withScopeAndEvents({ operation: "delete", module: "notifications", entity: "notificationMatrix" }, async (ctx, args) => {
    await ctx.db.delete(args.ruleId);
    return args.ruleId;
  }),
});

// ─── Resolve Recipients for an Event ────────────────────────

export interface RecipientResolution {
  userIds: Id<"users">[];
  channels: ("email" | "sms" | "whatsapp" | "push" | "in_app")[];
  templateRef?: string;
}

export async function resolveNotificationRecipients(
  ctx: any,
  module: string,
  eventType: string,
  context: {
    entityId?: string;
    companyId?: Id<"companies">;
    branchId?: Id<"branches">;
    departmentId?: Id<"departments">;
    amount?: number;
    bounceCount?: number;
    totalRefund?: number;
    studentId?: Id<"studentMaster">;
    employeeId?: Id<"employeeMaster">;
    parentId?: Id<"users">;
  },
): Promise<RecipientsResolution[]> {
  const resolution: RecipientsResolution[] = [];

  // Get rules
  const rules = await (listNotificationRules as any)(ctx, { module, eventType });
  if (rules.length === 0) return resolution;

  for (const rule of rules) {
    if (!rule.isActive) continue;

    for (const recipient of rule.recipients) {
      // Evaluate condition if present
      if (recipient.condition) {
        try {
          const conditionMet = evaluateCondition(recipient.condition, context);
          if (!conditionMet) continue;
        } catch {
          continue; // Skip if condition can't be evaluated
        }
      }

      // Resolve user IDs based on role
      const userIds = await resolveRoleUsers(ctx, recipient.role, context);
      if (userIds.length === 0) continue;

      resolution.push({
        userIds,
        channels: recipient.channel || ["in_app"],
        templateRef: recipient.templateRef,
        priority: rule.priority,
      });
    }
  }

  return resolution;
}

interface RecipientsResolution {
  userIds: Id<"users">[];
  channels: ("email" | "sms" | "whatsapp" | "push" | "in_app")[];
  templateRef?: string;
  priority?: string;
}

async function resolveRoleUsers(
  ctx: any,
  role: string,
  context: {
    companyId?: Id<"companies">;
    branchId?: Id<"branches">;
    departmentId?: Id<"departments">;
    studentId?: string;
    employeeId?: string;
    parentId?: Id<"users">;
  },
): Promise<Id<"users">[]> {
  switch (role) {
    case "parent": {
      if (context.parentId) return [context.parentId];
      // Look up from student
      if (context.studentId) {
        const parents = await ctx.db.query("users")
          .filter((q: any) => q.eq(q.field("studentId"), context.studentId))
          .collect();
        return parents.map((p: any) => p._id);
      }
      return [];
    }
    case "student": {
      if (context.studentId) {
        const student = await ctx.db.get(context.studentId);
        if (student) {
          const user = await ctx.db.query("users")
            .filter((q: any) => q.eq(q.field("studentId"), context.studentId))
            .first();
          return user ? [user._id] : [];
        }
      }
      return [];
    }
    case "finance": {
      const users = await ctx.db.query("users")
        .filter((q: any) => q.and(
          q.eq(q.field("role"), "finance"),
          context.branchId ? q.eq(q.field("branchId"), context.branchId) : q.eq(q.field("isActive"), true),
        ))
        .collect();
      return users.map((u: any) => u._id);
    }
    case "branch_head": {
      if (!context.branchId) return [];
      const heads = await ctx.db.query("users")
        .filter((q: any) => q.and(
          q.eq(q.field("role"), "branch_manager"),
          q.eq(q.field("branchId"), context.branchId),
        ))
        .collect();
      return heads.map((u: any) => u._id);
    }
    case "ceo": {
      if (!context.companyId) return [];
      const ceos = await ctx.db.query("users")
        .filter((q: any) => q.and(
          q.eq(q.field("role"), "ceo"),
          q.eq(q.field("companyId"), context.companyId),
        ))
        .collect();
      return ceos.map((u: any) => u._id);
    }
    case "collections":
    case "accounts":
    case "counsellor":
    case "hr":
    case "it":
    case "marketing":
    case "procurement":
    case "inventory_manager":
    case "manager":
    case "department_head": {
      const users = await ctx.db.query("users")
        .filter((q: any) => q.and(
          q.eq(q.field("designation"), role),
          context.branchId ? q.eq(q.field("branchId"), context.branchId) : q.eq(q.field("isActive"), true),
        ))
        .collect();
      return users.map((u: any) => u._id);
    }
    case "faculty": {
      if (context.departmentId) {
        const faculty = await ctx.db.query("users")
          .filter((q: any) => q.and(
            q.eq(q.field("departmentId"), context.departmentId),
            q.eq(q.field("role"), "faculty"),
          ))
          .collect();
        return faculty.map((u: any) => u._id);
      }
      return [];
    }
    case "batch_coordinator":
    case "assignee":
    case "participant":
    case "organizer": {
      // These roles are resolved dynamically from the event context
      // and should be passed directly
      return [];
    }
    case "employee": {
      if (context.employeeId) {
        const emp = await ctx.db.query("users")
          .filter((q: any) => q.eq(q.field("employeeId"), context.employeeId))
          .first();
        return emp ? [emp._id] : [];
      }
      return [];
    }
    default: {
      // Try generic role lookup
      const users = await ctx.db.query("users")
        .filter((q: any) => q.eq(q.field("role"), role))
        .collect();
      return users.map((u: any) => u._id);
    }
  }
}

function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  // Simple condition evaluator supporting: >, >=, <, <=, ==, !=, &&
  // Example: "amount > 100000 && bounceCount >= 2"
  try {
    const parts = condition.split("&&").map((p) => p.trim());
    return parts.every((part) => {
      const match = part.match(/^(\w+)\s*(>=|<=|!=|==|>|<)\s*(\w+)$/);
      if (!match) return false;

      const [, varName, op, valStr] = match;
      const actualValue = context[varName];
      const compareValue = isNaN(Number(valStr)) ? valStr : Number(valStr);

      switch (op) {
        case ">": return actualValue > compareValue;
        case ">=": return actualValue >= compareValue;
        case "<": return actualValue < compareValue;
        case "<=": return actualValue <= compareValue;
        case "==": return actualValue == compareValue;
        case "!=": return actualValue != compareValue;
        default: return false;
      }
    });
  } catch {
    return false;
  }
}

// ─── Initialize Default Notification Matrix ─────────────────

export const initializeNotificationMatrix = mutation({
  args: { token: v.optional(v.string()) },
  handler: withScopeAndEvents({ operation: "create", module: "notifications", entity: "notificationMatrix" }, async (ctx) => {
    const existing = await ctx.db.query("businessRules")
      .withIndex("domain", (q: any) => q.eq("domain", "notification_matrix"))
      .collect();
    if (existing.length > 0) return { skipped: true, count: existing.length };

    let count = 0;
    for (const rule of DEFAULT_RULES) {
      const key = `${rule.module}.${rule.eventType}`;
      await ctx.db.insert("businessRules", {
        domain: "notification_matrix",
        key,
        value: JSON.stringify(rule),
        label: `Notification: ${key}`,
        description: `Notification routing rule for ${key}`,
        valueType: "json",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      count++;
    }
    return { created: true, count };
  }),
});

// ─── Convex Query to get notification matrix by module ──────

export const getNotificationMatrix = query({
  args: {
    module: v.string(),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return (listNotificationRules as any)(ctx, {
      module: args.module,
      eventType: args.eventType,
      isActive: true,
    });
  },
});
