/**
 * Event SDK — Enterprise Event Bus Service
 *
 * Every business module MUST use this SDK to publish events.
 * No module may directly invoke platform services — always publish an event.
 *
 * Usage:
 *   import { eventSdk } from "@/platform/sdk/eventSdk";
 *   await eventSdk.publish(ctx, { module: "crm", eventType: "lead.converted", ... });
 */

import { v } from "convex/values";
import { mutation } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export interface EventPayload {
  module: string;
  eventType: string;
  entityType: string;
  entityId: string;
  data?: Record<string, unknown>;
  performedBy?: Id<"users">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
}

// ─── Event Registry ──────────────────────────────────────────────────────

/**
 * Standard event types across the platform.
 * Modules should extend this with their own event types.
 */
export const EVENT_TYPES = {
  // CRM
  LEAD_CREATED: "lead.created",
  LEAD_UPDATED: "lead.updated",
  LEAD_CONVERTED: "lead.converted",
  LEAD_LOST: "lead.lost",

  // Admissions
  APPLICATION_SUBMITTED: "admission.submitted",
  APPLICATION_APPROVED: "admission.approved",
  APPLICATION_REJECTED: "admission.rejected",

  // Student
  STUDENT_ENROLLED: "student.enrolled",
  STUDENT_GRADUATED: "student.graduated",
  STUDENT_WITHDREW: "student.withdrew",

  // Finance
  INVOICE_CREATED: "finance.invoice.created",
  PAYMENT_RECEIVED: "finance.payment.received",
  REFUND_PROCESSED: "finance.refund.processed",

  // HR
  EMPLOYEE_ONBOARDED: "hr.employee.onboarded",
  EMPLOYEE_EXITED: "hr.employee.exited",

  // Tasks
  TASK_CREATED: "task.created",
  TASK_COMPLETED: "task.completed",
  TASK_OVERDUE: "task.overdue",

  // Workflow
  WORKFLOW_STARTED: "workflow.started",
  WORKFLOW_APPROVED: "workflow.approved",
  WORKFLOW_REJECTED: "workflow.rejected",
  WORKFLOW_COMPLETED: "workflow.completed",

  // System
  USER_CREATED: "system.user.created",
  USER_DISABLED: "system.user.disabled",
  ANNOUNCEMENT_SENT: "system.announcement.sent",
} as const;

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Publish an event to the event bus.
 * This:
 * 1. Records a timeline event
 * 2. Records an audit log entry
 * 3. Returns the event record for further processing
 */
export const publish = mutation({
  args: {
    module: v.string(),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    data: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    channels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Record the event
    const eventId = await ctx.db.insert("events", {
      module: args.module,
      eventType: args.eventType,
      entityType: args.entityType,
      entityId: args.entityId,
      data: args.data ? JSON.parse(args.data) : undefined,
      performedBy: args.performedBy,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      channels: args.channels,
      status: "published",
      publishedAt: now,
      createdAt: now,
    });

    // 2. Record timeline event
    await ctx.db.insert("timelineEvents", {
      module: args.module,
      eventType: args.eventType,
      entityType: args.entityType,
      entityId: args.entityId,
      title: `${args.module}.${args.eventType}`,
      performedBy: args.performedBy,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      createdAt: now,
    });

    // 3. Record audit log
    await ctx.db.insert("auditLogs", {
      action: args.eventType,
      entity: args.entityType,
      entityId: args.entityId,
      userId: args.performedBy,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      metadata: args.data,
      createdAt: now,
    });

    return { eventId, publishedAt: now };
  },
});
