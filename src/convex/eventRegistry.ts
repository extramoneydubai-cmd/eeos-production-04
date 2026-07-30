/**
 * Enterprise Event Registry (Phase 3)
 *
 * Standard event definitions for EVERY module in EEOS.
 *
 * Instead of ad-hoc event type strings everywhere, this registry
 * provides a single source of truth for all event types.
 *
 * Every event follows the convention:
 *   {module}.{entity}.{action}
 *
 * Examples:
 *   "finance.cheque.bounced"
 *   "admission.student.created"
 *   "hr.employee.joined"
 *
 * Integration:
 *   The `withEventPipeline()` middleware automatically uses these
 *   event types when publishing events. Each module simply calls:
 *     Events.ADMISSION.STUDENT_CREATED
 *   instead of a raw string.
 */

import { Id } from "./_generated/dataModel";

// ─── Event Namespaces ───────────────────────────────────────

export const Events = {
  // ── Admission & Student Lifecycle ───────────────────────
  ADMISSION: {
    LEAD_CREATED: "admission.lead.created",
    LEAD_CONVERTED: "admission.lead.converted",
    STUDENT_CREATED: "admission.student.created",
    STUDENT_UPDATED: "admission.student.updated",
    STUDENT_CANCELLED: "admission.student.cancelled",
    STUDENT_REINSTATED: "admission.student.reinstated",
    BATCH_ASSIGNED: "admission.batch.assigned",
    CERTIFICATE_ISSUED: "admission.certificate.issued",
    ALUMNI_CONVERTED: "admission.alumni.converted",
  },

  // ── Finance ─────────────────────────────────────────────
  FINANCE: {
    FEE_STRUCTURE_CREATED: "finance.fee.created",
    FEE_STRUCTURE_UPDATED: "finance.fee.updated",
    INVOICE_GENERATED: "finance.invoice.generated",
    PAYMENT_RECEIVED: "finance.payment.received",
    PAYMENT_VERIFIED: "finance.payment.verified",
    PAYMENT_FAILED: "finance.payment.failed",
    RECEIPT_ISSUED: "finance.receipt.issued",
    REFUND_INITIATED: "finance.refund.initiated",
    REFUND_APPROVED: "finance.refund.approved",
    REFUND_COMPLETED: "finance.refund.completed",
    REFUND_REJECTED: "finance.refund.rejected",
    CHEQUE_RECEIVED: "finance.cheque.received",
    CHEQUE_DEPOSITED: "finance.cheque.deposited",
    CHEQUE_CLEARED: "finance.cheque.cleared",
    CHEQUE_BOUNCED: "finance.cheque.bounced",
    CHEQUE_PENALTY_APPLIED: "finance.cheque.penalty",
    PDC_AGREEMENT_SIGNED: "finance.pdc.signed",
    PDC_SETTLEMENT_COMPLETED: "finance.pdc.settled",
    CREDIT_NOTE_ISSUED: "finance.gst.credit_note",
    DEBIT_NOTE_ISSUED: "finance.gst.debit_note",
    GST_FILED: "finance.gst.filed",
    BANK_RECONCILIATION_COMPLETED: "finance.bank.reconciled",
    COLLECTION_FORECAST_UPDATED: "finance.collection.forecast",
    OUTSTANDING_AGING_REPORT: "finance.outstanding.aging",
    SALARY_PROCESSED: "finance.payroll.processed",
    SALARY_DISBURSED: "finance.payroll.disbursed",
  },

  // ── CRM & Marketing ─────────────────────────────────────
  CRM: {
    LEAD_CREATED: "crm.lead.created",
    LEAD_UPDATED: "crm.lead.updated",
    LEAD_QUALIFIED: "crm.lead.qualified",
    LEAD_CONVERTED: "crm.lead.converted",
    LEAD_LOST: "crm.lead.lost",
    OPPORTUNITY_CREATED: "crm.opportunity.created",
    OPPORTUNITY_WON: "crm.opportunity.won",
    OPPORTUNITY_LOST: "crm.opportunity.lost",
    DEMO_SCHEDULED: "crm.demo.scheduled",
    DEMO_COMPLETED: "crm.demo.completed",
    COUNSELLING_SESSION: "crm.counselling.session",
    PARENT_MEETING: "crm.parent.meeting",
  },
  MARKETING: {
    CAMPAIGN_CREATED: "marketing.campaign.created",
    CAMPAIGN_LAUNCHED: "marketing.campaign.launched",
    CAMPAIGN_COMPLETED: "marketing.campaign.completed",
    CAMPAIGN_PAUSED: "marketing.campaign.paused",
    LEAD_NURTURED: "marketing.lead.nurtured",
    EMAIL_SENT: "marketing.email.sent",
    EMAIL_OPENED: "marketing.email.opened",
    EMAIL_CLICKED: "marketing.email.clicked",
    SMS_SENT: "marketing.sms.sent",
    WHATSAPP_SENT: "marketing.whatsapp.sent",
    WHATSAPP_DELIVERED: "marketing.whatsapp.delivered",
    LANDING_PAGE_PUBLISHED: "marketing.landing.published",
    QR_CAMPAIGN_SCANNED: "marketing.qr.scanned",
  },

  // ── HR & Employee ───────────────────────────────────────
  HR: {
    APPLICATION_RECEIVED: "hr.application.received",
    INTERVIEW_SCHEDULED: "hr.interview.scheduled",
    INTERVIEW_COMPLETED: "hr.interview.completed",
    OFFER_EXTENDED: "hr.offer.extended",
    OFFER_ACCEPTED: "hr.offer.accepted",
    EMPLOYEE_JOINED: "hr.employee.joined",
    EMPLOYEE_ONBOARDED: "hr.employee.onboarded",
    PROBATION_COMPLETED: "hr.probation.completed",
    PROBATION_EXTENDED: "hr.probation.extended",
    CONFIRMATION_APPROVED: "hr.confirmation.approved",
    LEAVE_APPLIED: "hr.leave.applied",
    LEAVE_APPROVED: "hr.leave.approved",
    LEAVE_REJECTED: "hr.leave.rejected",
    LEAVE_CANCELLED: "hr.leave.cancelled",
    ATTENDANCE_MARKED: "hr.attendance.marked",
    ATTENDANCE_CORRECTED: "hr.attendance.corrected",
    PAYSLIP_GENERATED: "hr.payslip.generated",
    PERFORMANCE_REVIEW: "hr.performance.review",
    PROMOTION_APPROVED: "hr.promotion.approved",
    TRANSFER_APPROVED: "hr.transfer.approved",
    TRAINING_COMPLETED: "hr.training.completed",
    RESIGNATION_RECEIVED: "hr.resignation.received",
    EXIT_INTERVIEW: "hr.exit.interview",
    EMPLOYEE_EXITED: "hr.employee.exited",
    EXPERIENCE_LETTER_ISSUED: "hr.experience.issued",
    FNF_SETTLED: "hr.fnf.settled",
  },

  // ── Academic & Exam ─────────────────────────────────────
  ACADEMIC: {
    COURSE_CREATED: "academic.course.created",
    COURSE_UPDATED: "academic.course.updated",
    BATCH_CREATED: "academic.batch.created",
    BATCH_UPDATED: "academic.batch.updated",
    CLASS_SCHEDULED: "academic.class.scheduled",
    CLASS_COMPLETED: "academic.class.completed",
    CLASS_CANCELLED: "academic.class.cancelled",
    HOMEWORK_ASSIGNED: "academic.homework.assigned",
    HOMEWORK_SUBMITTED: "academic.homework.submitted",
    HOMEWORK_GRADED: "academic.homework.graded",
    ATTENDANCE_MARKED: "academic.attendance.marked",
    LESSON_CREATED: "academic.lesson.created",
    LESSON_PUBLISHED: "academic.lesson.published",
  },
  EXAM: {
    CREATED: "exam.created",
    PUBLISHED: "exam.published",
    SCHEDULED: "exam.scheduled",
    STARTED: "exam.started",
    COMPLETED: "exam.completed",
    RESULT_PUBLISHED: "exam.result.published",
    RESULT_VERIFIED: "exam.result.verified",
    HALL_ALLOCATED: "exam.hall.allocated",
    INVIGILATOR_ASSIGNED: "exam.invigilator.assigned",
    REVALUATION_REQUESTED: "exam.revaluation.requested",
    REVALUATION_COMPLETED: "exam.revaluation.completed",
  },

  // ── Support & Ticketing ─────────────────────────────────
  SUPPORT: {
    TICKET_CREATED: "support.ticket.created",
    TICKET_ASSIGNED: "support.ticket.assigned",
    TICKET_IN_PROGRESS: "support.ticket.in_progress",
    TICKET_RESOLVED: "support.ticket.resolved",
    TICKET_CLOSED: "support.ticket.closed",
    TICKET_REOPENED: "support.ticket.reopened",
    TICKET_ESCALATED: "support.ticket.escalated",
    TICKET_SLA_BREACHED: "support.ticket.sla.breached",
    KNOWLEDGE_ARTICLE_CREATED: "support.knowledge.created",
    KNOWLEDGE_ARTICLE_UPDATED: "support.knowledge.updated",
  },

  // ── Scheduling ──────────────────────────────────────────
  SCHEDULING: {
    CREATED: "scheduling.created",
    UPDATED: "scheduling.updated",
    CONFIRMED: "scheduling.confirmed",
    CANCELLED: "scheduling.cancelled",
    COMPLETED: "scheduling.completed",
    RESCHEDULED: "scheduling.rescheduled",
    REMINDER_SENT: "scheduling.reminder.sent",
    CONFLICT_DETECTED: "scheduling.conflict.detected",
    APPROVAL_REQUESTED: "scheduling.approval.requested",
    APPROVAL_COMPLETED: "scheduling.approval.completed",
  },

  // ── Inventory & Procurement ─────────────────────────────
  INVENTORY: {
    STOCK_ADDED: "inventory.stock.added",
    STOCK_REMOVED: "inventory.stock.removed",
    STOCK_ADJUSTED: "inventory.stock.adjusted",
    STOCK_TRANSFERRED: "inventory.stock.transferred",
    STOCK_LOW_ALERT: "inventory.stock.low",
    STOCK_EXPIRY_ALERT: "inventory.stock.expiry",
    STOCK_DAMAGED: "inventory.stock.damaged",
    STOCK_LOST: "inventory.stock.lost",
    ASSET_ASSIGNED: "inventory.asset.assigned",
    ASSET_RETURNED: "inventory.asset.returned",
    ASSET_MAINTENANCE: "inventory.asset.maintenance",
  },
  PROCUREMENT: {
    REQUEST_CREATED: "procurement.request.created",
    REQUEST_APPROVED: "procurement.request.approved",
    PURCHASE_ORDER_CREATED: "procurement.po.created",
    PURCHASE_ORDER_APPROVED: "procurement.po.approved",
    GOODS_RECEIVED: "procurement.goods.received",
    INVOICE_MATCHED: "procurement.invoice.matched",
    VENDOR_PAID: "procurement.vendor.paid",
  },

  // ── Production ──────────────────────────────────────────
  PRODUCTION: {
    TASK_CREATED: "production.task.created",
    TASK_ASSIGNED: "production.task.assigned",
    TASK_IN_PROGRESS: "production.task.in_progress",
    TASK_COMPLETED: "production.task.completed",
    TASK_REVIEWED: "production.task.reviewed",
    TASK_APPROVED: "production.task.approved",
    CONTENT_PUBLISHED: "production.content.published",
    VERSION_CREATED: "production.version.created",
  },

  // ── Workflow ────────────────────────────────────────────
  WORKFLOW: {
    STARTED: "workflow.started",
    COMPLETED: "workflow.completed",
    CANCELLED: "workflow.cancelled",
    NODE_REACHED: "workflow.node.reached",
    NODE_COMPLETED: "workflow.node.completed",
    APPROVAL_PENDING: "workflow.approval.pending",
    APPROVAL_COMPLETED: "workflow.approval.completed",
    APPROVAL_REJECTED: "workflow.approval.rejected",
    AUTOMATION_TRIGGERED: "workflow.automation.triggered",
    SLA_BREACHED: "workflow.sla.breached",
  },

  // ── Security ────────────────────────────────────────────
  SECURITY: {
    USER_LOGIN: "security.user.login",
    USER_LOGIN_FAILED: "security.user.login.failed",
    USER_LOGOUT: "security.user.logout",
    USER_LOCKED: "security.user.locked",
    PASSWORD_CHANGED: "security.password.changed",
    PERMISSION_DENIED: "security.permission.denied",
    ROLE_CHANGED: "security.role.changed",
    API_KEY_CREATED: "security.api_key.created",
    API_KEY_REVOKED: "security.api_key.revoked",
    SESSION_EXPIRED: "security.session.expired",
  },
} as const;

// ─── Event Type Utility ─────────────────────────────────────

export type EventType = (typeof Events)[keyof typeof Events][keyof (typeof Events)[keyof typeof Events]];

/** Get all event types for a given module */
export function getEventsForModule(module: keyof typeof Events): string[] {
  return Object.values(Events[module]) as string[];
}

/** Get module name from an event type string */
export function getModuleFromEventType(eventType: string): string | null {
  const parts = eventType.split(".");
  return parts[0] || null;
}

/** Get entity type from an event type string */
export function getEntityFromEventType(eventType: string): string | null {
  const parts = eventType.split(".");
  return parts[1] || null;
}

/** Get action from an event type string */
export function getActionFromEventType(eventType: string): string | null {
  const parts = eventType.split(".");
  return parts.slice(2).join(".") || null;
}

/** Check if an event type is valid */
export function isValidEventType(eventType: string): boolean {
  return Object.values(Events).some((module) =>
    Object.values(module).includes(eventType as any),
  );
}

// ─── Event Payload ──────────────────────────────────────────

export interface EventPayload {
  eventType: string;
  entityType?: string;
  entityId?: string;
  module?: string;
  performedBy?: Id<"users">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
  metadata?: Record<string, unknown>;
  description?: string;
}
