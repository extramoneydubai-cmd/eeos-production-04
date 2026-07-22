# DOC-10 — Workflow, Tasks & Automation Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Workflow & Automation  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2, DOC-06 — Admission, DOC-07 — Student 360°, DOC-08 — Finance, DOC-09 — Communication  
> **Existing Tables:** `tasks`, `taskParticipants`, `taskChecklistItems`, `taskComments`, `approvalTemplates`, `approvalRequests`, `approvalRequestApprovers`, `leadTasks`, `leadApprovals`, `leadApprovalDecisions`, `notifications`, `leadActivity`

---

## Table of Contents

1. [Workflow Philosophy](#1-workflow-philosophy)
2. [Workflow Architecture](#2-workflow-architecture)
3. [Trigger Engine](#3-trigger-engine)
4. [Condition Engine](#4-condition-engine)
5. [Action Engine](#5-action-engine)
6. [Task Engine](#6-task-engine)
7. [Approval Engine](#7-approval-engine)
8. [Automation Builder](#8-automation-builder)
9. [Recurring Workflows](#9-recurring-workflows)
10. [SLA Management](#10-sla-management)
11. [Escalation Engine](#11-escalation-engine)
12. [Audit Trail](#12-audit-trail)
13. [Workflow Templates](#13-workflow-templates)
14. [Cross-Module Examples](#14-cross-module-examples)
15. [AI Opportunities](#15-ai-opportunities)
16. [Workflow Dashboard](#16-workflow-dashboard)
17. [Implementation Roadmap](#17-implementation-roadmap)
18. [Golden Rules](#18-golden-rules)

---

## 1. Workflow Philosophy

### Purpose

The Workflow, Tasks & Automation Engine is the **operating system** of EEOS. It connects every module through a unified trigger → condition → action → task → approval → notification pipeline. Nothing should happen manually if it can be automated.

### Core Principle

**Every business action becomes a workflow.** No module implements its own automation logic. All automation flows through this engine.

### Business Rules

1. **Everything starts with a Trigger.** No workflow exists without a defined trigger.
2. **Every Trigger creates a Workflow.** A trigger without a workflow is an untracked event.
3. **Every Workflow creates Tasks, Approvals, or Communications.** Workflows produce action items.
4. **Approvals are reusable across modules.** One approval engine serves CRM, Finance, HR, and Admin.
5. **Communication is event-driven.** Workflows raise events that DOC-09 delivers.
6. **Automation never owns business data.** It only references entities by ID.
7. **One engine for the entire EEOS.** No module builds its own automation.
8. **Every workflow step is audited.** Who, when, before, after, duration, result.
9. **Workflows can be templated.** Common patterns saved as reusable templates.
10. **Automation can be overridden manually.** Human intervention always possible.

### The Golden Flow

```
Trigger
  │
  ├── Condition Check
  │     └── IF conditions met → Continue
  │     └── ELSE → Stop or alternative path
  │
  ├── Action(s)
  │     ├── Create Task
  │     ├── Send Communication (via DOC-09)
  │     ├── Raise Approval
  │     ├── Update Entity
  │     ├── Call API / Webhook
  │     └── AI Action
  │
  ├── Task Engine (if task created)
  │     ├── Assigned → Accepted → In Progress → Review → Done
  │     ├── SLA Timer Running
  │     └── Escalation if overdue
  │
  ├── Approval Engine (if approval created)
  │     ├── Pending → Approved/Rejected
  │     ├── Multi-Phase (if configured)
  │     └── Escalation if SLA breached
  │
  ├── Notification (via DOC-09)
  │     ├── Task assigned → Notify assignee
  │     ├── Approval needed → Notify approver
  │     └── Workflow complete → Notify initiator
  │
  ├── Audit Trail
  │     └── Every step logged with timestamp
  │
  └── Analytics
        └── Duration, SLA %, bottleneck detection
```

### Relationship with Other Modules

| Module | Role in Workflow Engine |
|--------|------------------------|
| **DOC-09 (Communication)** | Delivers notifications from workflow events |
| **DOC-05 (Lead V2)** | Provides triggers (lead.created, lead.assigned) |
| **DOC-06 (Admission)** | Provides triggers (admission.approved, documents.uploaded) |
| **DOC-07 (Student)** | Provides triggers (student.created, batch.allocated) |
| **DOC-08 (Finance)** | Provides triggers (payment.received, invoice.overdue) |
| **Existing Approvals** | Core approval engine (reused and extended) |
| **Existing Tasks** | Core task engine (reused and extended) |

---

## 2. Workflow Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW ENGINE                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      TRIGGER LISTENER                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │CRM Events│ │Finance   │ │Academic  │ │Manual/Sched. │   │ │
│  │  │          │ │Events    │ │Events    │ │Triggers      │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    CONDITION EVALUATOR                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │IF/ELSE   │ │Amount   │ │Status   │ │Custom       │   │ │
│  │  │Logic     │ │Compare   │ │Check    │ │Conditions   │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      ACTION EXECUTOR                          │ │
│  │                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │Create    │ │ Send     │ │Update   │ │ Raise        │   │ │
│  │  │Task      │ │ Comm.    │ │Entity   │ │ Approval     │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  │                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │ │
│  │  │Call API  │ │Webhook  │ │AI Action │                     │ │
│  │  └──────────┘ └──────────┘ └──────────┘                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                    ┌──────────┴──────────┐                        │
│                    ▼                     ▼                         │
│  ┌────────────────────────┐  ┌────────────────────────┐           │
│  │     TASK ENGINE         │  │    APPROVAL ENGINE      │           │
│  │  ┌──────────────────┐  │  │  ┌──────────────────┐  │           │
│  │  │ Assignment & SLA │  │  │  │ Multi-Phase      │  │           │
│  │  │ Escalation       │  │  │  │ Parallel/Sequen. │  │           │
│  │  │ Completion       │  │  │  │ Escalation       │  │           │
│  │  └──────────────────┘  │  │  └──────────────────┘  │           │
│  └────────────────────────┘  └────────────────────────┘           │
│                    │                    │                          │
│                    └──────────┬─────────┘                          │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    NOTIFICATION ROUTER                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │In-App    │ │ WhatsApp │ │ Email    │ │ SMS           │   │ │
│  │  │(DOC-09)  │ │(DOC-09)  │ │(DOC-09)  │ │(DOC-09)      │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                               ▼                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │     AUDIT LOG        │  │  ANALYTICS PIPELINE   │              │
│  │  (Per-workflow)      │  │  (Aggregate)          │              │
│  └──────────────────────┘  └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Existing Implementation (What's Already Built)

The current system already implements:

| Component | Existing Files | Status |
|-----------|---------------|--------|
| **Task Engine (General)** | `tasks.ts` — Full CRUD, participants, checklist, comments, Kanban status | ✅ Existing |
| **Task Engine (CRM)** | `crmTasks.ts` — Lead tasks, sales pending tasks, priority sorting | ✅ Existing |
| **Approval Engine (General)** | `approvals.ts` — Templates, multi-phase requests, approve/reject, decisions | ✅ Existing |
| **Approval Engine (CRM)** | `crmApprovals.ts` — Discount/waiver approvals, role-based routing, recalculatePayable | ✅ Existing |
| **Notification Engine** | `notifications.ts` — In-app notifications for tasks and approvals | ✅ Existing |
| **Activity Timeline** | `crmHelpers.ts` — `logActivity` for lead timeline | ✅ Existing |

### DOC-10 Extensions

| Extension | Purpose |
|-----------|---------|
| **Unified Workflow Model** | Single workflow definition linking triggers → conditions → actions |
| **Trigger Engine** | Standard event format + trigger definitions across all modules |
| **Condition Engine** | IF/ELSE logic with entity field comparison, multi-condition support |
| **Action Executor** | Unified action dispatcher (task, comm, approval, API, webhook, AI) |
| **Automation Builder** | Visual drag-and-drop workflow configuration |
| **SLA Management** | Per-task SLA timers with automatic escalation |
| **Escalation Engine** | Multi-level escalation chain (Manager → Department Head → Director) |
| **Recurring Workflows** | Scheduled triggers (daily, weekly, monthly, calendar-based) |
| **Workflow Dashboard** | Real-time workflow performance and bottleneck monitoring |
| **Workflow Templates** | Pre-built workflow templates for common business processes |

---

## 3. Trigger Engine

### Purpose

The Trigger Engine is the **entry point** of every workflow. It listens for events across all modules and starts workflows when events match defined triggers.

### Trigger Types

| Type | Description | Latency | Use Case |
|------|-------------|---------|----------|
| **Event Trigger** | Fires when a business event occurs | Real-time | Lead created, payment received |
| **Scheduled Trigger** | Fires at a specific time or interval | Cron-based | Daily attendance report, monthly fee statement |
| **Manual Trigger** | Fired by a user action | On-demand | "Generate certificate", "Send bulk message" |
| **API Trigger** | Fired by an external API call | Real-time | Webhook from payment gateway, SMS callback |
| **Webhook Trigger** | Fired by an incoming webhook | Real-time | Third-party integration, Zapier |
| **Condition Trigger** | Fires when a condition becomes true | Polling | Lead inactive for 7 days, fee overdue 30 days |
| **Dependency Trigger** | Fires when another workflow completes | Chained | After "Document Verification" → Start "Admission Confirmation" |

### Event Registry (Across All Modules)

#### CRM Events (from DOC-05)

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `lead.created` | New lead captured | leadId, source, createdBy |
| `lead.assigned` | Lead assigned to counsellor | leadId, fromUserId, toUserId |
| `lead.stage.changed` | Lead moved to new stage | leadId, fromStage, toStage |
| `lead.profile.updated` | Lead profile extended | leadId, updatedFields |
| `lead.family.created` | Family record created | leadId, familyId |
| `lead.contact.added` | New family contact | leadId, contactId, role |
| `lead.converted` | Lead converted | leadId, admissionId |
| `lead.lost` | Lead marked as lost | leadId, lostReasonId |
| `lead.note.added` | Note added to lead | leadId, createdBy |
| `lead.document.uploaded` | Document uploaded | leadId, documentType |
| `lead.discount.requested` | Discount requested | leadId, amount, category |
| `lead.discount.approved` | Discount approved | leadId, amount |
| `lead.whatsapp.replied` | Lead replied to WhatsApp | leadId, message |
| `lead.call.completed` | Call logged | leadId, outcome, duration |

#### Admission Events (from DOC-06)

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `admission.started` | Admission form initiated | leadId, admissionId |
| `admission.document.uploaded` | Document uploaded | admissionId, documentType |
| `admission.document.verified` | Document verified | admissionId, documentType, status |
| `admission.document.rejected` | Document rejected | admissionId, documentType, reason |
| `admission.approved` | Admission approved | leadId, admissionId |
| `admission.rejected` | Admission rejected | admissionId, reason |
| `admission.seat.reserved` | Seat reserved | admissionId, seatNumber |
| `admission.fee.confirmed` | Fee payment confirmed | admissionId, amount |
| `admission.completed` | Full admission done | leadId, admissionId, studentId |

#### Student Events (from DOC-07)

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `student.created` | New student record | studentId, leadId, admissionId |
| `student.batch.allocated` | Batch assigned | studentId, batchId |
| `student.portal.activated` | Portal activated | studentId, contactId |
| `student.idcard.ready` | ID card generated | studentId |
| `student.certificate.ready` | Certificate ready | studentId, certificateType |
| `student.placement.offer` | Placement offer | studentId, company, package |
| `student.course.completed` | Course done | studentId |
| `student.status.changed` | Status changed | studentId, fromStatus, toStatus |
| `student.medical.alert` | Medical alert triggered | studentId, alertType |

#### Finance Events (from DOC-08)

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `invoice.issued` | Invoice generated | invoiceId, studentId, amount, dueDate |
| `payment.received` | Payment processed | paymentId, invoiceId, amount, mode |
| `payment.verified` | Payment verified | paymentId, verifiedBy |
| `payment.overdue` | Installment overdue | installmentId, studentId, daysOverdue |
| `payment.reminder.sent` | Auto-reminder sent | installmentId, reminderType |
| `receipt.generated` | Receipt ready | receiptId, downloadUrl |
| `invoice.cancelled` | Invoice cancelled | invoiceId, reason |
| `cheque.bounced` | PDC bounced | pdcId, studentId, amount |
| `scholarship.approved` | Scholarship granted | scholarshipId, studentId, amount |
| `refund.requested` | Refund initiated | refundId, studentId, amount |
| `refund.completed` | Refund processed | refundId, processedAt |
| `fee.structure.assigned` | Fee plan assigned | studentId, feePlanId |

#### Academic Events

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `attendance.marked` | Attendance recorded | studentId, date, status, subject |
| `attendance.below.threshold` | Attendance below 75% | studentId, percentage, subject |
| `attendance.weekly.summary` | Weekly report ready | studentId, weekStart, percentage |
| `exam.scheduled` | New exam scheduled | examId, subject, date |
| `exam.reminder` | Exam tomorrow | examId, subject, time |
| `result.published` | Results announced | resultId, studentId, subject, marks |
| `homework.assigned` | New homework | homeworkId, studentId, subject, dueDate |
| `homework.submitted` | Homework submitted | homeworkId, studentId |
| `homework.graded` | Homework graded | homeworkId, studentId, grade |

#### Task Events (from Task Engine)

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `task.created` | Task created | taskId, assignedTo, priority, dueDate |
| `task.assigned` | Task assigned | taskId, assignedTo, assignedBy |
| `task.started` | Task moved to in_progress | taskId, userId |
| `task.completed` | Task done | taskId, completedBy |
| `task.overdue` | Past due date | taskId, assignedTo, daysOverdue |
| `task.comment.added` | Comment added | taskId, userId |

#### Approval Events (from Approval Engine)

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `approval.requested` | Approval needed | approvalId, requesterId, amount |
| `approval.approved` | Request approved | approvalId, approvedBy |
| `approval.rejected` | Request rejected | approvalId, rejectedBy, reason |
| `approval.returned` | Request returned for changes | approvalId, returnedBy, reason |
| `approval.escalated` | SLA breached | approvalId, daysPending |

#### General Events

| Trigger Code | Description | Payload |
|-------------|-------------|---------|
| `birthday` | Student/staff birthday | entityId, entityType, name |
| `holiday.notice` | Upcoming holiday | holidayName, date |
| `emergency` | Emergency alert | message, affectedEntityIds, severity |
| `system.daily` | Daily system tick | date |
| `system.weekly` | Weekly system tick | weekStart, weekEnd |
| `system.monthly` | Monthly system tick | monthStart, monthEnd |

### Trigger Configuration

```json
{
  "triggerCode": "payment.overdue",
  "triggerType": "event",
  "module": "finance",
  "description": "Fires when an installment becomes overdue",
  "conditions": {
    "daysOverdue": { "gte": 1 }
  },
  "isActive": true,
  "workflowId": "wf_fee_collection"
}
```

---

## 4. Condition Engine

### Purpose

The Condition Engine evaluates **IF/ELSE logic** on trigger data and entity state before executing actions. Conditions can be simple comparisons or complex multi-condition expressions.

### Condition Types

| Type | Operator | Example |
|------|----------|---------|
| **Equal** | `eq` | `lead.stage == "qualified"` |
| **Not Equal** | `neq` | `lead.source != "walk_in"` |
| **Greater Than** | `gt` | `amount > 5000` |
| **Greater Than or Equal** | `gte` | `attendance.percentage >= 75` |
| **Less Than** | `lt` | `daysOverdue < 30` |
| **Less Than or Equal** | `lte` | `fee.balance <= 0` |
| **In** | `in` | `lead.stage in ["qualified", "demo_done"]` |
| **Not In** | `not_in` | `lead.source not_in ["organic", "referral"]` |
| **Contains** | `contains` | `student.name contains "Patel"` |
| **Between** | `between` | `amount between 5000, 20000` |
| **Is Null** | `is_null` | `lead.assignedTo is null` |
| **Is Not Null** | `is_not_null` | `lead.email is not null` |

### Condition Examples

#### Simple Condition

```json
{
  "workflowId": "wf_low_attendance_alert",
  "trigger": "attendance.below.threshold",
  "conditions": [
    {
      "field": "percentage",
      "operator": "lt",
      "value": 75
    }
  ],
  "actions": [...]
}
```

#### Multi-Condition (AND)

```json
{
  "workflowId": "wf_high_value_discount_approval",
  "trigger": "lead.discount.requested",
  "conditions": [
    {
      "field": "amount",
      "operator": "gte",
      "value": 25000
    },
    {
      "field": "category",
      "operator": "eq",
      "value": "discount"
    }
  ],
  "actions": [
    {
      "type": "raise_approval",
      "approvalMode": "sequential",
      "approvalLevels": ["admin", "super_admin"]
    }
  ]
}
```

#### Multi-Condition (OR)

```json
{
  "conditions": [
    {
      "group": "OR",
      "rules": [
        { "field": "amount", "operator": "gte", "value": 50000 },
        { "field": "category", "operator": "eq", "value": "waiver" }
      ]
    }
  ]
}
```

#### IF/ELSE Path

```json
{
  "workflowId": "wf_fee_reminder_routing",
  "trigger": "payment.overdue",
  "conditions": [
    {
      "field": "daysOverdue",
      "operator": "lt",
      "value": 7,
      "path": "send_reminder"
    },
    {
      "field": "daysOverdue",
      "operator": "between",
      "value": [7, 30],
      "path": "send_escalation"
    },
    {
      "field": "daysOverdue",
      "operator": "gte",
      "value": 30,
      "path": "send_final_notice"
    }
  ]
}
```

### Condition Evaluation Rules

- Multiple conditions within a group are AND by default
- Groups can be nested with AND/OR logic
- Conditions are evaluated left-to-right
- First matching path is executed (for routing)
- If no conditions match, the ELSE path (if defined) is executed
- If no ELSE path and no match, the workflow does nothing

---

## 5. Action Engine

### Purpose

The Action Engine executes the **output** of a workflow. Actions are the "what happens next" — tasks created, communications sent, entities updated.

### Action Types

| Action Type | Description | Module |
|-------------|-------------|--------|
| **Create Task** | Create a new task in the Task Engine | Task Engine |
| **Send Communication** | Send message via DOC-09 | Communication |
| **Update Entity** | Update a record in any module | All modules |
| **Raise Approval** | Start an approval request | Approval Engine |
| **Generate Document** | Generate ID card, certificate, invoice | Document Engine |
| **Update Status** | Change status of any entity | All modules |
| **Create Entity** | Create new entity (student, admission) | Various |
| **Call API** | Call internal or external API | Integration |
| **Send Webhook** | POST to external URL | Integration |
| **AI Action** | Run AI model inference | AI Engine |
| **Delay** | Wait for specified duration | Scheduling |
| **Sub-Workflow** | Start another workflow | Workflow Engine |
| **Log** | Add entry to audit trail | Audit |

### Action Configuration

#### Create Task Action

```json
{
  "actionType": "create_task",
  "config": {
    "title": "Follow up with {{lead.name}}",
    "description": "Call {{lead.name}} regarding program inquiry",
    "priority": "high",
    "assignTo": "owner",
    "dueInDays": 2,
    "entityType": "lead",
    "entityId": "{{lead.id}}",
    "sla": {
      "duration": 48,
      "unit": "hours",
      "escalationPath": "escalation_manager"
    },
    "notification": {
      "templateCode": "task_assigned",
      "channel": "in_app"
    }
  }
}
```

#### Send Communication Action

```json
{
  "actionType": "send_communication",
  "config": {
    "templateCode": "lead_welcome",
    "channel": "whatsapp",
    "recipientRole": "primary_contact",
    "variables": {
      "lead.name": "{{lead.firstName}} {{lead.lastName}}",
      "program.name": "{{lead.program}}"
    },
    "fallbackChannel": "sms"
  }
}
```

#### Update Entity Action

```json
{
  "actionType": "update_entity",
  "config": {
    "entityType": "lead",
    "entityId": "{{lead.id}}",
    "updates": {
      "nextAction": "Follow up after payment",
      "nextActionDate": "{{date.now + 3 days}}"
    }
  }
}
```

#### Raise Approval Action

```json
{
  "actionType": "raise_approval",
  "config": {
    "title": "Discount Approval — {{lead.name}}",
    "amount": "{{discount.amount}}",
    "reason": "{{discount.reason}}",
    "mode": "sequential",
    "approvalLevels": ["manager", "admin"],
    "deadline": "{{date.now + 48 hours}}",
    "fallbackApprover": "branch_head"
  }
}
```

#### Sub-Workflow Action

```json
{
  "actionType": "start_workflow",
  "config": {
    "workflowCode": "wf_start_admission",
    "input": {
      "leadId": "{{lead.id}}",
      "triggeredByWorkflow": true
    }
  }
}
```

### Action Execution Order

```
All actions within a workflow are executed in sequence by default.
Parallel execution is supported with the "parallel" flag.

Sequential:
  Action 1 → Action 2 → Action 3 → Completed

Parallel:
  Action 1 ──→ Action 2
       │
       └──→ Action 3
       
  (Both 2 and 3 start after 1 completes)

Conditional:
  Action 1
    ├── Success → Action 2
    └── Failure → Action 3 (compensation/rollback)
```

---

## 6. Task Engine

### Existing Implementation

The current system (`tasks.ts`, `crmTasks.ts`) already implements robust task management:

| Feature | General Tasks (`tasks.ts`) | CRM Tasks (`crmTasks.ts`) |
|---------|---------------------------|--------------------------|
| **CRUD** | ✅ Full (create, update, delete) | ✅ Full (create, update, delete) |
| **Status** | ✅ Backlog / Todo / In Progress / Review / Done | ✅ Pending / In Progress / Completed / Cancelled |
| **Priority** | ✅ Low / Medium / High / Critical | ✅ Low / Medium / High / Critical |
| **Assignment** | ✅ Owner + Assignee | ✅ Owner + Assignee |
| **Checklist** | ✅ Full CRUD with toggle | ❌ |
| **Comments** | ✅ Full CRUD with internal flag | ❌ |
| **Participants** | ✅ Multi-user with roles | ❌ |
| **Kanban Ordering** | ✅ Order field + drag-and-drop | ❌ |
| **Approval Integration** | ✅ Linked to approvalRequests | ✅ Linked to leadApprovals |
| **Due Dates** | ✅ | ✅ |
| **Departments/Teams** | ✅ Department + Team scoping | ❌ |
| **Lead Tasks View** | ❌ | ✅ Sales pending tasks grouped by lead |

### DOC-10 Extensions

| Extension | Description |
|-----------|-------------|
| **SLA Timer** | Auto-track time from creation to completion |
| **Escalation** | Auto-escalate overdue tasks to manager |
| **Dependencies** | Task A must complete before Task B starts |
| **Recurring Tasks** | Daily/weekly/monthly recurring task generation |
| **Task Templates** | Pre-configured task templates with default values |
| **Smart Assignment** | Auto-assign based on workload, skills, or round-robin |
| **Time Tracking** | Log time spent on each task |
| **Watchers** | Users who get notified of task updates |
| **Tags** | Free-form tagging for categorization |
| **Bulk Operations** | Bulk assign, status change, delete |

### Task Fields (Unified)

| Field | Type | Purpose |
|-------|------|---------|
| `title` | `string` | Task title |
| `description` | `optional(string)` | Task details |
| `taskType` | `string` | Call / Meeting / FollowUp / Approval / Verification / Custom |
| `status` | `string` | Backlog / Todo / InProgress / Review / Done / Cancelled |
| `priority` | `string` | Low / Medium / High / Critical |
| `ownerId` | `id(users)` | Who owns the task |
| `assignedTo` | `optional(id(users))` | Who is assigned |
| `departmentId` | `optional(id(departments))` | Department scope |
| `teamId` | `optional(id(teams))` | Team scope |
| `entityType` | `optional(string)` | Linked entity type (lead, student, admission, etc.) |
| `entityId` | `optional(string)` | Linked entity ID |
| `workflowId` | `optional(string)` | Source workflow ID |
| `dueDate` | `optional(number)` | Due date timestamp |
| `slaDuration` | `optional(number)` | SLA duration in hours |
| `slaUnit` | `optional(string)` | hours / days / weeks |
| `slaBreachedAt` | `optional(number)` | When SLA was breached |
| `completedAt` | `optional(number)` | When completed |
| `timeSpent` | `optional(number)` | Total time spent in minutes |
| `tags` | `optional(array(string))` | Free-form tags |
| `isApprovalRequired` | `optional(boolean)` | Whether approval is needed |
| `approvalRequestId` | `optional(id(approvalRequests))` | Linked approval |
| `parentTaskId` | `optional(id(tasks))` | Parent task (sub-tasks) |
| `dependsOn` | `optional(array(id(tasks)))` | Dependencies |
| `order` | `number` | Display order (Kanban) |
| `isArchived` | `optional(boolean)` | Soft delete |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Task Status Lifecycle

```
                    ┌──────────┐
                    │ BACKLOG   │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │   TODO    │
                    └────┬─────┘
                         │
                         ▼
                    ┌────────────┐
                    │ IN PROGRESS │
                    └────┬───────┘
                         │
                    ┌────┴─────┐
                    │          │
                    ▼          ▼
              ┌──────────┐ ┌──────────┐
              │  REVIEW   │ │   DONE   │
              └────┬─────┘ └──────────┘
                   │
              ┌────┴─────┐
              │          │
              ▼          ▼
         ┌──────────┐ ┌──────────┐
         │   DONE    │ │ BACKLOG   │
         │ (Approved)│ │ (Rejected)│
         └──────────┘ └──────────┘
              
Cancelled can happen from any status.
```

### SLA Timer Logic

```
Task Created (SLA: 48 hours)
       │
       ▼
SLA Timer Started: 48:00:00
       │
       ├── Completed before 48h → SLA: ✅ Met
       │
       ├── Not completed at 47:00 → SLA Warning (1h left)
       │     └── Notify assignee
       │
       ├── Not completed at 48:00 → SLA: ❌ Breached
       │     ├── Mark task as overdue
       │     ├── Notify assignee
       │     ├── Create escalation task
       │     └── Notify manager
       │
       └── Not completed at 72:00 → Second escalation
             └── Notify department head
```

### Task Assignment Rules

```
Assignment Logic:
  ├── Manual: User picks assignee
  ├── Round-Robin: Auto-assigns to next available team member
  ├── Workload-Based: Assigns to person with fewest active tasks
  ├── Skill-Based: Assigns based on task type match to user skills
  ├── Department-Based: Routes to department queue
  └── Role-Based: Assigns to users with specific role
```

---

## 7. Approval Engine

### Existing Implementation

The current system (`approvals.ts`, `crmApprovals.ts`) already implements:

| Feature | General Approvals | CRM Approvals |
|---------|------------------|---------------|
| **Templates** | ✅ Multi-phase templates | ❌ No templates |
| **Multi-Phase** | ✅ Phases with order | ❌ Single phase |
| **Mode: Sequential** | ✅ | ✅ |
| **Mode: Parallel** | ✅ | ✅ |
| **Mode: Any One** | ✅ | ✅ |
| **Decisions** | ✅ Approve / Reject | ✅ Approve / Reject / Return |
| **Notifications** | ✅ Via in-app | ✅ Via in-app |
| **Discount Impact** | ❌ | ✅ Recalculates payable |
| **Role Routing** | ❌ Manual approver selection | ✅ Auto-routes by amount + role |
| **Deadline** | ❌ | ✅ Optional deadline |
| **Fallback Approver** | ❌ | ✅ Optional |

### DOC-10 Extensions

| Extension | Description |
|-----------|-------------|
| **Unified Approval Model** | Merge general + CRM approvals into one engine |
| **Approval Levels** | Configurable levels with amount thresholds |
| **Deadline Enforcement** | Auto-reject or escalate when deadline passes |
| **Delegation** | Approver can delegate to another user |
| **Chain Approval** | Sequential by org hierarchy (Manager → Director → CEO) |
| **Conditional Routing** | Route based on amount, department, entity type |
| **Batch Approval** | Approve/reject multiple requests at once |
| **Read-Only Approvers** | Users who can view but not decide |
| **Re-approval** | Changes after approval require re-approval |
| **Approval History** | Complete timeline of every approval |

### Unified Approval Configuration

```json
{
  "approvalConfig": {
    "title": "Discount Approval Workflow",
    "applicableTo": ["leadDiscounts", "feeDiscounts", "scholarships"],
    "levels": [
      {
        "name": "Manager Approval",
        "threshold": { "min": 0, "max": 5000 },
        "approverRole": "manager",
        "mode": "any_one",
        "sla": 24
      },
      {
        "name": "Admin Approval",
        "threshold": { "min": 5001, "max": 25000 },
        "approverRole": "admin",
        "mode": "any_one",
        "sla": 48
      },
      {
        "name": "Director Approval",
        "threshold": { "min": 25001, "max": 100000 },
        "approverRole": "super_admin",
        "mode": "sequential",
        "sla": 72,
        "phases": [
          { "name": "Finance Head", "approverRole": "admin" },
          { "name": "Director", "approverRole": "super_admin" }
        ]
      },
      {
        "name": "Board Approval",
        "threshold": { "min": 100001, "max": null },
        "approverRole": "super_admin",
        "mode": "parallel",
        "requiredApprovers": 3,
        "sla": 120
      }
    ],
    "escalation": {
      "enabled": true,
      "afterHours": 1.5,
      "escalateTo": "manager",
      "maxEscalations": 3
    },
    "fallback": {
      "enabled": true,
      "fallbackApproverRole": "super_admin",
      "afterHours": 2
    }
  }
}
```

### Approval Flow Examples

#### Single-Level Approval

```
Request: ₹4,000 discount for Raj Patel
       │
       ▼
Route: Manager (any_one)
       │
       ├── Approved ✅ → Discount applied. Notify requester.
       └── Rejected ❌ → Lead notified. Reason shared.
```

#### Multi-Level Sequential Approval

```
Request: ₹30,000 fee waiver for Amit Singh
       │
       ▼
Level 1: Finance Head (approve)
       │
       ├── Approved ✅ → Move to Level 2
       └── Rejected ❌ → Returned to requester
       │
       ▼
Level 2: Director (approve)
       │
       ├── Approved ✅ → Waiver applied
       └── Rejected ❌ → Returned with reason
```

#### Parallel Approval

```
Request: ₹1,50,000 scholarship for Merit Student
       │
       ▼
Level 1: 3 Board Members (parallel, need 2 approvals)
       │
       ├── ✅ Approved (Member 1)
       ├── ✅ Approved (Member 2) → Approved! Notify all.
       ├── ❌ Rejected (Member 3) → Noted but not blocking.
       │
       └── Decision: Approved (2/3)
```

#### Escalation Flow

```
Approval Request: ₹15,000 discount
       │
       ▼
Assigned to Admin (SLA: 24 hours)
       │
       ├── Decided within 24h → Normal flow
       │
       └── No decision after 24h → Escalation
             │
             ├── Escalation 1: Notify Admin + Manager
             │     └── SLA: 12 hours
             │
             ├── Escalation 2: Notify Department Head
             │     └── SLA: 6 hours
             │
             └── Escalation 3: Auto-assign to Fallback Approver
                   └── SLA: 6 hours → Auto-reject if no decision
```

---

## 8. Automation Builder

### Purpose

The Automation Builder is a **visual, drag-and-drop interface** for configuring workflows without writing code.

### Builder UI Mockup

```
┌───────────────────────────────────────────────────────────────┐
│  🤖 AUTOMATION BUILDER                              [Save] [Test] │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  Workflow Name: Fee Collection Reminder                │   │
│  │  Module: Finance                                       │   │
│  │  Description: Auto-remind and escalate overdue fees    │   │
│  │  Active: ✅                                             │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  TRIGGER                                                │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 🔔 Event: payment.overdue                        │   │   │
│  │  │ Module: Finance                                  │   │   │
│  │  │ Description: When installment becomes overdue    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                           │                                    │
│                           ▼                                    │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  CONDITION                                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ IF daysOverdue >= 1 AND daysOverdue < 7         │   │   │
│  │  │ → Path: Gentle Reminder                         │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ ELSE IF daysOverdue >= 7 AND daysOverdue < 30  │   │   │
│  │  │ → Path: Escalation                              │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ ELSE daysOverdue >= 30                          │   │   │
│  │  │ → Path: Final Notice                            │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                           │                                    │
│                           ▼                                    │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  ACTIONS (Gentle Reminder Path)                        │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 1️⃣ Send WhatsApp → template: payment_reminder  │   │   │
│  │  │   Recipient: Primary Fee Contact                │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 2️⃣ Create Task → "Follow up with parent"       │   │   │
│  │  │   Assign: Counsellor | Due: 2 days              │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 3️⃣ Log to Timeline → Fee overdue reminder sent │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  AVAILABLE BLOCKS                                       │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐   │   │
│  │  │Trigger │ │Condition │ │Action  │ │Sub-Workflow│   │   │
│  │  └────────┘ └──────────┘ └────────┘ └────────────┘   │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐   │   │
│  │  │Delay   │ │Notify    │ │Create  │ │Update      │   │   │
│  │  │        │ │          │ │Task    │ │Entity      │   │   │
│  │  └────────┘ └──────────┘ └────────┘ └────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  WORKFLOW PREVIEW                                       │   │
│  │                                                       │   │
│  │  [payment.overdue]                                     │   │
│  │       │                                                │   │
│  │       ▼                                                │   │
│  │  ┌──────────┐                                          │   │
│  │  │ CONDITION│── d<7 ──► [Send WhatsApp] → [Create Task]│   │
│  │  └──────────┘── d<30──► [Send SMS] → [Escalate]       │   │
│  │                └── d>=30► [Send Final] → [Alert Head]  │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Builder Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop Blocks** | Drag triggers, conditions, actions onto canvas |
| **Visual Flow** | Connected nodes showing workflow path |
| **Real-time Validation** | Validate workflow before saving |
| **Test Mode** | Run workflow with sample data without side effects |
| **Version History** | Track changes to workflow configurations |
| **Import/Export** | Share workflows as JSON between environments |
| **Templates** | Start from pre-built workflow templates |
| **Reusable Blocks** | Save common condition/action sets as reusable blocks |

---

## 9. Recurring Workflows

### Purpose

Recurring Workflows are **time-based automations** that run on a schedule rather than in response to an event.

### Recurrence Types

| Type | Frequency | Example |
|------|-----------|---------|
| **Daily** | Every day at specified time | Daily attendance report |
| **Weekly** | Every week on specified day | Weekly fee collection report |
| **Monthly** | Every month on specified date | Monthly fee statement |
| **Custom Interval** | Every X hours/days | Reminder every 7 days |
| **Academic Calendar** | Tied to academic events | Exam schedule, holidays |
| **Financial Calendar** | Tied to financial periods | Invoice generation, fee cycles |
| **Birthday** | Annual recurrence | Birthday wishes |

### Recurring Workflow Examples

#### Daily: Attendance Alert

```
Schedule: Every weekday at 18:00
Trigger: system.daily

Actions:
  1. Query all students with attendance < 75%
  2. For each:
     a. Send WhatsApp to Primary Academic Contact
     b. Create task for Counsellor
     c. Log to student timeline
```

#### Weekly: Fee Collection Report

```
Schedule: Every Monday at 09:00
Trigger: system.weekly

Actions:
  1. Generate fee collection report for last week
  2. Send Email to Finance Head
  3. Create slack notification in #finance channel
```

#### Monthly: Invoice Generation

```
Schedule: 1st of every month at 08:00
Trigger: system.monthly

Actions:
  1. Get all active students with installment plans
  2. Generate invoices for upcoming installments
  3. Send WhatsApp notification to Primary Fee Contact
  4. Log to student fee timeline
```

#### Birthday: Automated Wishes

```
Schedule: Every day at 07:00
Trigger: system.daily

Actions:
  1. Query all students/faculty with birthday today
  2. For each:
     a. Send WhatsApp birthday greeting
     b. Post in #birthdays channel (if Slack integrated)
```

---

## 10. SLA Management

### Purpose

SLA (Service Level Agreement) Management ensures that tasks and approvals are completed within defined timeframes, with automatic escalation when deadlines are missed.

### SLA Configuration

```json
{
  "slaConfig": {
    "taskType": "payment_followup",
    "duration": 24,
    "unit": "hours",
    "businessHoursOnly": true,
    "workingDaysOnly": true,
    "timezone": "Asia/Kolkata",
    "reminders": [
      { "at": 0.75, "action": "notify_assignee" },        // 75% time elapsed
      { "at": 1.0, "action": "mark_overdue" },             // 100% time elapsed
      { "at": 1.5, "action": "escalate_to_manager" },      // 150% time elapsed
      { "at": 2.0, "action": "escalate_to_department_head" }, // 200% time elapsed
      { "at": 3.0, "action": "escalate_to_director" }      // 300% time elapsed
    ],
    "autoReassign": {
      "enabled": true,
      "afterEscalations": 3,
      "reassignToRole": "manager"
    }
  }
}
```

### SLA Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  ⏱ SLA PERFORMANCE — Last 30 Days                             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Overall SLA Met: 87%                                         │
│  Total Tasks Tracked: 1,247                                   │
│  Breached: 162 (13%)                                          │
│                                                               │
│  ┌────────────┬──────────┬────────┬────────┬──────────────┐  │
│  │ Task Type  │ Total    │ Met    │Breached│ Avg Time     │  │
│  ├────────────┼──────────┼────────┼────────┼──────────────┤  │
│  │ CallBack   │ 423      │ 398    │ 25     │ 4.2h / 24h   │  │
│  │ FollowUp   │ 356      │ 298    │ 58     │ 18.5h / 24h  │  │
│  │ DocVerify  │ 234      │ 201    │ 33     │ 32.1h / 48h  │  │
│  │ Approval   │ 134      │ 112    │ 22     │ 38.2h / 48h  │  │
│  │ Payment    │ 100      │ 78     │ 22     │ 6.5h / 8h    │  │
│  └────────────┴──────────┴────────┴────────┴──────────────┘  │
│                                                               │
│  TOP BREACH REASONS                                           │
│  ├── Understaffed (42%)                                        │
│  ├── Wrong assignment (28%)                                    │
│  ├── Holiday/weekend (18%)                                     │
│  └── System issue (12%)                                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 11. Escalation Engine

### Purpose

The Escalation Engine ensures that **no task or approval is ever forgotten**. It automatically escalates overdue items through a configurable chain of authority.

### Escalation Chain

```
Level 0: Assignee
  └── Not working? → Level 1

Level 1: Team Lead / Manager
  └── Not resolved? → Level 2

Level 2: Department Head
  └── Not resolved? → Level 3

Level 3: Branch Head / Director
  └── Not resolved? → Level 4

Level 4: CEO / Board
  └── Not resolved? → Auto-reassign or auto-approve
```

### Escalation Rules

| Item Type | Escalation Trigger | Escalation Path | Final Action |
|-----------|-------------------|-----------------|-------------|
| **Task (Low Priority)** | Overdue by 24h | Assignee → Team Lead → Dept Head | Auto-reassign |
| **Task (Medium Priority)** | Overdue by 12h | Assignee → Team Lead → Dept Head | Notify Director |
| **Task (High Priority)** | Overdue by 4h | Assignee → Team Lead → Dept Head → Director | Auto-assign to Director |
| **Task (Critical)** | Overdue by 1h | Assignee → Team Lead → Director → CEO | Auto-escalate to CEO |
| **Approval** | SLA breached | Approver → Manager → Dept Head | Fallback approver |
| **Follow-up** | Missed by 24h | Counsellor → Team Lead → Branch Head | Notify Branch Head |
| **Payment Overdue** | 30+ days | Counsellor → Manager → Collection Head | Legal notice |

### Escalation Notification

```
Escalation Level 1: Timelines
┌─────────────────────────────────────────────┐
│  📅 ESCALATION NOTICE — Task Overdue          │
│                                              │
│  Task: Follow up with Rajesh Patel           │
│  Original Assignee: Priya Sharma             │
│  Due: 12-Oct-2026  (Overdue by 2 days)      │
│                                              │
│  Escalated To: Amit Mehta (Team Lead)        │
│  Reason: Task not completed within SLA       │
│                                              │
│  Action Needed:                              │
│  ├── Reassign to another team member         │
│  ├── Extend deadline (with reason)            │
│  └── Mark as won't do (with reason)           │
│                                              │
│  Auto-Escalation in: 24 hours → Dept Head    │
└─────────────────────────────────────────────┘
```

---

## 12. Audit Trail

### Purpose

Every workflow step, task action, approval decision, and escalation is logged in the Audit Trail. This provides a **complete, immutable history** of every automated and manual action.

### Audit Log Fields

| Field | Type | Purpose |
|-------|------|---------|
| `workflowId` | `string` | Source workflow |
| `workflowName` | `string` | Workflow name |
| `triggerCode` | `string` | Trigger that started this |
| `entityType` | `string` | Entity type affected |
| `entityId` | `string` | Entity ID affected |
| `stepType` | `string` | trigger / condition / action / task / approval / escalation |
| `stepName` | `string` | Name of the step |
| `actionType` | `optional(string)` | What action was taken |
| `before` | `optional(string)` | State before (JSON) |
| `after` | `optional(string)` | State after (JSON) |
| `performedBy` | `optional(string)` | system / user ID |
| `duration` | `optional(number)` | Duration in ms |
| `result` | `string` | success / failure / skipped |
| `error` | `optional(string)` | Error message if failed |
| `metadata` | `optional(object)` | Additional context |
| `createdAt` | `number` | Timestamp |

### Audit Trail View (Per Entity)

```
Student: Raj Patel
═══════════════════════════════════════════════════════════════
WORKFLOW AUDIT TRAIL

Date       │ Workflow                    │ Action             │ Result
───────────┼─────────────────────────────┼────────────────────┼──────────
01-Aug-26  │ Lead Welcome                │ Send WhatsApp      │ ✅ Success
           │                             │ Template: welcome  │
───────────┼─────────────────────────────┼────────────────────┼──────────
01-Aug-26  │ Lead Welcome                │ Create Task        │ ✅ Success
           │                             │ "Follow up in 3d"  │
───────────┼─────────────────────────────┼────────────────────┼──────────
15-Aug-26  │ Admission Approved          │ Create Student     │ ✅ Success
           │                             │ Student ID: STU001 │
───────────┼─────────────────────────────┼────────────────────┼──────────
15-Aug-26  │ Admission Approved          │ Send WhatsApp      │ ✅ Success
           │                             │ Template: confirm  │
───────────┼─────────────────────────────┼────────────────────┼──────────
01-Sep-26  │ Fee Reminder (T-7)          │ Send WhatsApp      │ ✅ Success
           │                             │ Template: remind   │
───────────┼─────────────────────────────┼────────────────────┼──────────
05-Sep-26  │ Fee Follow-up               │ Create Task        │ ✅ Success
           │ (Counsellor auto-assigned)  │ Priority: High     │
───────────┼─────────────────────────────┼────────────────────┼──────────
05-Sep-26  │ Fee Follow-up               │ SLA Timer Started  │ ⏳ Running
           │                             │ SLA: 48 hours      │
───────────┼─────────────────────────────┼────────────────────┼──────────
07-Sep-26  │ Fee Follow-up (SLA Warning) │ Notify Assignee    │ ✅ Sent
           │                             │ 1 hour remaining   │
───────────┼─────────────────────────────┼────────────────────┼──────────
07-Sep-26  │ Fee Follow-up               │ Task Completed     │ ✅ Success
           │                             │ Time: 47h 23m      │
───────────┼─────────────────────────────┼────────────────────┼──────────
```

---

## 13. Workflow Templates

### Purpose

Pre-built workflow templates for common business processes. Users can activate a template with a single click and customize as needed.

### Template Catalog

#### CRM Templates

| Template | Trigger | Actions | Use Case |
|----------|---------|---------|----------|
| **Lead Welcome** | `lead.created` | Send WhatsApp welcome, Create follow-up task, Notify counsellor | New lead capture |
| **Lead Follow-up** | `lead.stage.changed` → "qualified" | Create call task (2 days), Send program info WhatsApp | Qualified lead |
| **Lead Assignment** | `lead.assigned` | Notify new owner, Create introduction task, Add to timeline | Lead reassignment |
| **Lead Lost** | `lead.lost` | Send feedback request, Create win-back task (30 days), Log reason | Lead lost |
| **Converted Lead** | `lead.converted` | Start admission workflow, Send congratulations, Notify accounts | Lead → Admission |

#### Admission Templates

| Template | Trigger | Actions | Use Case |
|----------|---------|---------|----------|
| **Admission Started** | `admission.started` | Generate checklist, Send document list, Notify counsellor | New admission |
| **Document Uploaded** | `admission.document.uploaded` | Assign verifier, Send acknowledgement | Document collection |
| **Document Verified** | `admission.document.verified` | Update checklist, Send notification, Start next step | Verification done |
| **Admission Approved** | `admission.approved` | Generate student ID, Send welcome kit, Create orientation task | Full admission |
| **Seat Reserved** | `admission.seat.reserved` | Generate invoice, Send invoice, Create payment task | Seat booking |

#### Finance Templates

| Template | Trigger | Actions | Use Case |
|----------|---------|---------|----------|
| **Payment Received** | `payment.received` | Generate receipt, Send confirmation, Update invoice balance | Payment collection |
| **Payment Overdue (Gentle)** | `payment.overdue` (d<7) | Send reminder WhatsApp, Create follow-up task (3 days) | Early overdue |
| **Payment Overdue (Escalate)** | `payment.overdue` (d>=7) | Send escalation SMS, Create collection task, Notify manager | Overdue escalation |
| **Payment Overdue (Final)** | `payment.overdue` (d>=30) | Send final notice, Create legal task, Notify director | Final notice |
| **Refund Initiated** | `refund.requested` | Create approval request, Notify finance team | Refund processing |

#### Academic Templates

| Template | Trigger | Actions | Use Case |
|----------|---------|---------|----------|
| **Low Attendance Alert** | `attendance.below.threshold` | Send parent WhatsApp, Create counsellor task, Log alert | Attendance |
| **Exam Scheduled** | `exam.scheduled` | Send reminder (T-7), Send reminder (T-1), Create study plan task | Exam prep |
| **Result Published** | `result.published` | Send result WhatsApp, Create parent meeting if failed | Result notification |
| **Homework Assigned** | `homework.assigned` | Send student push, Send parent WhatsApp, Set reminder | Homework |

#### HR Templates (Future)

| Template | Trigger | Actions | Use Case |
|----------|---------|---------|----------|
| **Employee Onboarding** | `employee.created` | Create onboarding checklist, Assign mentor, Set up accounts | New hire |
| **Leave Requested** | `employee.leave.requested` | Create approval request, Notify manager, Update calendar | Leave |
| **Payroll Processed** | `payroll.processed` | Send payslip, Notify employee | Payroll |

#### General Templates

| Template | Trigger | Actions | Use Case |
|----------|---------|---------|----------|
| **Birthday Wish** | `birthday` | Send WhatsApp greeting, Post in channel | Engagement |
| **Holiday Notice** | `holiday.notice` | Send announcement, Update schedule | Holiday |
| **Daily Digest** | `system.daily` | Send daily task summary, Send new leads count | Morning briefing |

---

## 14. Cross-Module Examples

### Example 1: Lead Capture → Admission

```
Trigger: lead.created
  ├── Condition: lead.source = "facebook_ad"
  │     └── Action: Send WhatsApp (template: facebook_welcome)
  │
  ├── Condition: lead.source != "walk_in"
  │     └── Action: Create Task (type: followup, due: 24h, assign: owner)
  │
  ├── Action: Notify Counsellor (in-app)
  │
  └── Action: Log to lead timeline
        │
        ▼ (Counsellor works the lead through stages)
        │
Trigger: lead.stage.changed → "converted"
  ├── Condition: lead has all required fields
  │     └── Action: Start Workflow (workflow: wf_start_admission)
  │
  ├── Action: Send WhatsApp (template: congratulations)
  │
  └── Action: Create Task (type: admission_docs, assign: counsellor)
        │
        ▼
Trigger: admission.completed
  ├── Action: Create Student record
  ├── Action: Send WhatsApp (template: welcome_aboard)
  ├── Action: Create Task (type: batch_allocation, due: 7d)
  ├── Action: Notify Accounts (for fee setup)
  └── Action: Log to lead + admission + student timelines
```

### Example 2: Fee Collection & Escalation

```
Trigger: payment.overdue
  │
  ├── Condition: daysOverdue < 7
  │     ├── Action: Send WhatsApp (template: payment_reminder_3d)
  │     │           Recipient: Primary Fee Contact
  │     ├── Action: Create Task (type: follow_up, priority: medium, due: 3d)
  │     │           Assign: Counsellor
  │     └── Action: Log to timeline
  │
  ├── Condition: daysOverdue >= 7 AND < 30
  │     ├── Action: Send WhatsApp + SMS (template: overdue)
  │     │           Recipient: Primary Fee Contact + Decision Maker
  │     ├── Action: Create Task (type: collection_call, priority: high, due: 1d)
  │     │           Assign: Collection Officer
  │     ├── Action: Raise Approval (auto-escalate to manager if no payment in 7d)
  │     └── Action: Notify Branch Manager
  │
  └── Condition: daysOverdue >= 30
        ├── Action: Send SMS (template: final_notice)
        │           Recipient: All Contacts
        ├── Action: Create Task (type: legal_follow_up, priority: critical)
        │           Assign: Legal Team
        ├── Action: Notify Director
        └── Action: Flag student account for restriction
```

### Example 3: Attendance → Parent → Counsellor

```
Trigger: attendance.below.threshold (percentage < 75)
  │
  ├── Action: Send WhatsApp (template: attendance_low)
  │           Recipient: Primary Academic Contact
  │           Variables: {{student.name}}, {{attendance.percentage}}
  │
  ├── Action: Create Task (type: parent_meeting, priority: high, due: 3d)
  │           Title: Schedule parent meeting for {{student.name}}
  │           Assign: Counsellor
  │           SLA: 48 hours
  │
  ├── Action: Update Student (flag: low_attendance_alert = true)
  │
  ├── Action: Log to student timeline
  │
  └── Sub-Workflow: wf_attendance_monitoring
        │
        ├── Recurring: Daily check for next 7 days
        ├── Condition: attendance.improved = false after 7 days
        │     └── Action: Escalate to Department Head
        │
        └── Condition: attendance.improved = false after 30 days
              └── Action: Recommend withdrawal from program
```

### Example 4: Discount Approval Chain

```
Trigger: lead.discount.requested
  │
  ├── Condition: amount <= 5000
  │     └── Approval: Manager any_one (SLA: 24h)
  │           ├── Approved → Apply discount, Notify requester + lead
  │           └── Rejected → Notify requester with reason
  │
  ├── Condition: amount > 5000 AND <= 25000
  │     └── Approval: Admin any_one (SLA: 48h)
  │           ├── Approved → Apply discount, Notify all parties
  │           ├── Rejected → Notify requester + offer alternative
  │           └── Escalated (72h) → Auto-forward to Director
  │
  ├── Condition: amount > 25000 AND <= 100000
  │     └── Approval: Sequential (Finance Head → Director, SLA: 72h)
  │           ├── Both approved → Apply discount, Notify all
  │           ├── Any rejected → Return with reason
  │           └── Escalated → CEO notification
  │
  └── Condition: amount > 100000
        └── Approval: Parallel Board (3/5 required, SLA: 120h)
              ├── 3+ approved → Apply discount, Formal letter
              ├── Rejected → Formal rejection with CEO note
              └── Escalated → Board chair intervention
```

---

## 15. AI Opportunities

### 1. Suggest Workflow

```
AI analyzes historical data to suggest workflows:

  Input: Lead activities over last 30 days
  Output:
    ┌────────────────────────────────────────────────────────┐
    │ 🤖 AI Workflow Suggestion                               │
    │                                                        │
    │ Based on 847 leads processed last month, we suggest:    │
    │                                                        │
    │ Workflow: "Quick Response for Website Leads"            │
    │ Confidence: 92%                                         │
    │                                                        │
    │ Trigger: lead.created (source = "website")              │
    │ ├── Send WhatsApp within 5 minutes (template: website)  │
    │ ├── Create Call Task within 2 hours                    │
    │ └── Notify Counsellor if not contacted in 4 hours      │
    │                                                        │
    │ Expected Impact: +35% conversion rate                   │
    │ Expected Time Savings: 12 hours/week                   │
    └────────────────────────────────────────────────────────┘
```

### 2. Predict Delays

```
AI predicts task completion delays:

  Task: Follow up with Vikram Joshi (Fee Payment)
  Assigned To: Priya Sharma
  Due: 15-Oct-2026  (4 days from now)
  
  AI Risk Assessment:
    ⚠️ HIGH RISK OF DELAY (72% probability)
    
    Risk Factors:
      - Priya has 7 overdue tasks (highest in team)
      - Similar tasks took avg 5.2 days (SLA: 3 days)
      - No progress update in last 3 days
      - Student has history of late payments
    
    Recommendation:
      ➤ Reassign to another team member
      ➤ Or extend SLA to 7 days with manager approval
```

### 3. Task Prioritization

```
AI reorders task priority based on multiple factors:

  Before AI:
    All tasks shown by due date (flat)
  
  After AI:
    ┌────────────────────────────────────────────────────────┐
    │ Priority │ Task                           │ Reason       │
    ├──────────┼────────────────────────────────┼──────────────┤
    │ 🥇 P0    │ Vikram Joshi — Fee payment     │ High value   │
    │ 🥈 P1    │ Amit Singh — Documents pending │ Long overdue │
    │ 🥉 P2    │ Priya Sharma — Follow-up call  │ Easy win     │
    │    P2    │ New lead — Introduction call   │ Time-sensit. │
    │    P3    │ Weekly report                  │ Can wait     │
    └────────────────────────────────────────────────────────┘
    
    AI Priority Score Formula:
      Urgency (30%) + Value (25%) + Effort (20%) +
      Dependency (15%) + SLA Risk (10%)
```

### 4. Smart Assignment

```
AI auto-assigns tasks based on skills and workload:

  Task: Counselling call for NEET Student
  Required Skills: NEET domain knowledge, Hindi, Evening availability
  
  Available Counsellors:
    ┌────────────┬──────────┬────────┬────────┬──────────┐
    │ Counsellor │ Workload │ Skills │ Lang   │ Score    │
    ├────────────┼──────────┼────────┼────────┼──────────┤
    │ Ananya ✅  │ 65%      │ NEET   │ Hindi  │ 94/100   │
    │ Rajesh     │ 92% ❌   │ JEE    │ Eng    │ 45/100   │
    │ Priya      │ 30%      │ NEET   │ Eng    │ 72/100   │
    │ Amit       │ 50%      │ NEET   │ Hindi  │ 88/100   │
    └────────────┴──────────┴────────┴────────┴──────────┘
    
    Best Assignment: Ananya (Available in 2h, speaks Hindi, NEET expert)
```

### 5. Auto Escalation Detection

```
AI detects when escalation is needed proactively:

  Escalation Risk: HIGH
  Confidence: 88%
  
  Detected:
    - Counsellor has 15+ active tasks (over capacity)
    - 8 of 15 tasks are overdue
    - Average response time increased from 2h to 8h
    - Sentiment of last 5 parent interactions: Negative
    
  Proactive Action:
    ➤ Auto-reassign 3 overdue tasks to team lead
    ➤ Reduce new lead assignment to this counsellor
    ➤ Notify HR for wellness check
```

### 6. Workflow Optimization

```
AI suggests improvements to existing workflows:

  Workflow: "Fee Collection"
  Current Performance:
    ├── SLA Met: 72% (Target: 90%)
    ├── Avg Time to Payment: 8.5 days
    └── Escalation Rate: 28%
  
  AI Optimization Suggestions:
    ┌────────────────────────────────────────────────────────┐
    │ 💡 Optimization #1: Add WhatsApp reminder at T-3       │
    │    Expected Improvement: +12% SLA                       │
    │    Effort: Low (template already exists)                │
    │                                                        │
    │ 💡 Optimization #2: Auto-assign to collector at D+7    │
    │    Expected Improvement: +8% SLA                        │
    │    Effort: Medium (new condition needed)                │
    │                                                        │
    │ 💡 Optimization #3: Add AI scoring for high-risk cases │
    │    Expected Improvement: +15% SLA                       │
    │    Effort: High (ML model)                              │
    └────────────────────────────────────────────────────────┘
```

### 7. Bottleneck Detection

```
AI identifies bottlenecks in workflows:

  Workflow: "Admission Process"
  ┌────────────────────────────────────────────────────────┐
  │  🚦 BOTTLENECK ANALYSIS                                 │
  │                                                         │
  │  Step                  │ Avg Time   │ Queue │ Status    │
  ├────────────────────────┼────────────┼───────┼───────────┤
  │ ✅ Form Submission     │ 15 min     │ 0     │ 🟢 Good   │
  │ ✅ Document Upload     │ 2 hours    │ 2     │ 🟢 Good   │
  │ 🔴 Document Verify    │ 3.5 days   │ 47    │ 🔴 BOTTLEN │
  │ ✅ Fee Payment         │ 1 day      │ 5     │ 🟡 Fair    │
  │ ⏳ Student Creation    │ 30 min     │ 0     │ 🟢 Good   │
  │ ✅ Batch Allocation    │ 2 days     │ 12    │ 🟡 Fair    │
  └────────────────────────────────────────────────────────┘
  
  Root Cause: Only 2 verifiers for 47 pending documents
  Recommendation: Add 2 more verifiers or auto-verify low-risk docs
```

---

## 16. Workflow Dashboard

### Purpose

Real-time dashboard showing workflow health, task performance, and automation success rates.

### Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  ⚡ WORKFLOW DASHBOARD — Today                                 │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ 📋 Total   │ │ ✅ Auto    │ │ ⏳ Pending  │ │ ⚠️ Overdue │ │
│  │ Workflows  │ │ Completed  │ │            │ │            │ │
│  │   1,247    │ │   892      │ │   284      │ │   71       │ │
│  │   📈 +15%  │ │   71.5%    │ │   📊 -3%  │ │   📈 +8%   │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ 🔄 SLA Met │ │ 📈 Escala- │ │ 🤖 Auto-   │ │ 🏆 Top     │ │
│  │    Rate    │ │ tion Rate  │ │ mation %   │ │ Workflow   │ │
│  │   87.3%    │ │   8.2%     │ │   72%      │ │ Lead Welc. │ │
│  │   📈 +2%   │ │   📊 -1%   │ │   📈 +5%   │ │ 98.2% SLA  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  WORKFLOW PERFORMANCE (Last 7 Days)                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Workflow              │ Ran   │ Success │ SLA    │ Trend│  │
│  ├───────────────────────┼───────┼─────────┼────────┼────┤  │
│  │ Lead Welcome          │ 342   │ 100%    │ 98.2%  │ 📈  │  │
│  │ Fee Reminder          │ 1,847 │ 94.2%   │ 91.5%  │ 📈  │  │
│  │ Low Attendance        │ 234   │ 96.6%   │ 94.0%  │ 📊  │  │
│  │ Discount Approval     │ 89    │ 88.8%   │ 82.0%  │ 📉  │  │
│  │ Admission Complete    │ 45    │ 97.8%   │ 95.6%  │ 📈  │  │
│  │ Refund Process        │ 12    │ 91.7%   │ 83.3%  │ 📉  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  DEPARTMENT PERFORMANCE                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Department      │ Tasks  │ Met%  │ Overdue │ Avg Time │  │
│  ├─────────────────┼────────┼───────┼─────────┼──────────┤  │
│  │ Counselling     │ 534    │ 91%   │ 12      │ 4.2h     │  │
│  │ Collections     │ 289    │ 78%   │ 28      │ 18.5h    │  │
│  │ Admissions      │ 198    │ 95%   │ 5       │ 2.1h     │  │
│  │ Verification    │ 156    │ 82%   │ 18      │ 32.1h    │  │
│  │ Finance         │ 70     │ 96%   │ 2       │ 1.5h     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  AUTOMATION SUCCESS RATE (24h)                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ WhatsApp ████████████████████████████  96% success      │  │
│  │ In-App   ████████████████████████████  99% success      │  │
│  │ Task Cr. ████████████████████████████  98% success      │  │
│  │ Approval ██████████████████████░░░░░░  82% success      │  │
│  │ Webhook  ████████████████████████████  95% success      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 17. Implementation Roadmap

### Phase 1 — Unified Workflow Model (P0)

**Estimated effort:** 5-6 days  
**Dependencies:** Existing tasks + approvals

**Tasks:**
- [ ] Create `workflows` table in schema
- [ ] Create `workflowTriggers` table
- [ ] Create `workflowActions` table
- [ ] Workflow CRUD (list, get, create, update, delete, duplicate)
- [ ] Trigger → Condition → Action model
- [ ] Basic workflow execution engine

### Phase 2 — Trigger Engine (P0)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, DOC-09 Event Engine

**Tasks:**
- [ ] Standardize event format across all modules
- [ ] Event listener for CRM events
- [ ] Event listener for Finance events
- [ ] Event listener for Admission/Student events
- [ ] Trigger matching engine (event → workflow)
- [ ] Scheduled trigger (cron-based)

### Phase 3 — Condition Engine (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Condition evaluator (eq, neq, gt, gte, lt, lte, in, not_in, between)
- [ ] Multi-condition support (AND/OR groups)
- [ ] IF/ELSE path routing
- [ ] Entity field extraction for condition comparison
- [ ] Condition testing UI

### Phase 4 — Action Executor (P1)

**Estimated effort:** 5-6 days  
**Dependencies:** Phase 1, Phase 2, Existing task + approval engines, DOC-09

**Tasks:**
- [ ] Create Task action
- [ ] Send Communication action (via DOC-09)
- [ ] Update Entity action
- [ ] Raise Approval action
- [ ] Sub-Workflow action
- [ ] Delay action
- [ ] Action sequence execution (sequential + parallel)
- [ ] Action error handling + retry

### Phase 5 — Unified Task Engine Enhancement (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Existing `tasks.ts`

**Tasks:**
- [ ] Merge general tasks + lead tasks into unified model
- [ ] Add entity linking (entityType, entityId) to tasks
- [ ] Add SLA timer to tasks
- [ ] Add task dependencies
- [ ] Add task templates
- [ ] Add time tracking
- [ ] Enhanced task UI (Kanban, list, calendar views)

### Phase 6 — Unified Approval Engine (P1)

**Estimated effort:** 5-6 days  
**Dependencies:** Existing `approvals.ts`, `crmApprovals.ts`

**Tasks:**
- [ ] Merge general approvals + CRM approvals into unified model
- [ ] Add approval level configuration (threshold-based routing)
- [ ] Add deadline enforcement (auto-reject/escalate)
- [ ] Add delegation support
- [ ] Add batch approval UI
- [ ] Approval dashboard

### Phase 7 — Automation Builder UI (P2)

**Estimated effort:** 8-10 days  
**Dependencies:** All Phases 1-6

**Tasks:**
- [ ] Visual drag-and-drop workflow builder
- [ ] Trigger block component
- [ ] Condition block component
- [ ] Action block component
- [ ] Workflow canvas with connection lines
- [ ] Real-time validation
- [ ] Test mode (run with sample data)
- [ ] Version history
- [ ] Workflow template library

### Phase 8 — SLA & Escalation (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 5, Phase 6

**Tasks:**
- [ ] SLA configuration per task type
- [ ] SLA timer service
- [ ] Escalation chain configuration
- [ ] Escalation execution engine
- [ ] SLA breach notification templates
- [ ] Escalation audit logging

### Phase 9 — Recurring Workflows (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 2

**Tasks:**
- [ ] Scheduled trigger types (daily, weekly, monthly, custom)
- [ ] Academic calendar integration
- [ ] Birthday detection
- [ ] Recurring workflow UI
- [ ] Recurring workflow audit

### Phase 10 — Audit Trail (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Unified audit log table
- [ ] Workflow step logging
- [ ] Entity-specific audit view
- [ ] Audit export
- [ ] Audit retention policy

### Phase 11 — Workflow Dashboard (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Workflow performance metrics
- [ ] SLA compliance dashboard
- [ ] Department performance view
- [ ] Bottleneck detection (basic)
- [ ] Automation success rate tracking

### Phase 12 — AI Workflow (P3)

**Estimated effort:** 10-12 days  
**Dependencies:** All Phases, AI Infrastructure

**Tasks:**
- [ ] Workflow suggestion engine
- [ ] Delay prediction model
- [ ] Task prioritization algorithm
- [ ] Smart assignment engine
- [ ] Auto escalation detection
- [ ] Workflow optimization suggestions
- [ ] Bottleneck detection

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Unified Workflow Model | P0 | 6d | Medium | Critical |
| 2. Trigger Engine | P0 | 5d | Low | Critical |
| 3. Condition Engine | P1 | 4d | Low | High |
| 4. Action Executor | P1 | 6d | Medium | Critical |
| 5. Task Engine Enhancement | P1 | 5d | Low | High |
| 6. Approval Engine Unified | P1 | 6d | Medium | High |
| 7. Automation Builder UI | P2 | 10d | High | High |
| 8. SLA & Escalation | P2 | 5d | Medium | High |
| 9. Recurring Workflows | P2 | 4d | Low | Medium |
| 10. Audit Trail | P2 | 4d | Low | Medium |
| 11. Workflow Dashboard | P2 | 5d | Medium | High |
| 12. AI Workflow | P3 | 12d | High | Medium |

---

## 18. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║          WORKFLOW, TASKS & AUTOMATION GOLDEN RULES            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Everything starts with a Trigger.                       ║
║      └── No workflow exists without a defined trigger.        ║
║                                                              ║
║  2.  Every Trigger creates a Workflow.                       ║
║      └── A trigger without a workflow is an untracked event.  ║
║                                                              ║
║  3.  Every Workflow creates Tasks, Approvals, or Comm.       ║
║      └── Workflows produce action items, never side effects.  ║
║                                                              ║
║  4.  Approvals are reusable across modules.                  ║
║      └── One approval engine serves CRM, Finance, HR, Admin.  ║
║                                                              ║
║  5.  Communication is event-driven.                          ║
║      └── Workflows raise events. DOC-09 delivers messages.    ║
║                                                              ║
║  6.  Automation never owns business data.                    ║
║      └── Workflows reference entities by ID only.             ║
║                                                              ║
║  7.  One engine for the entire EEOS.                         ║
║      └── No module builds its own automation. Never.          ║
║                                                              ║
║  8.  Every workflow step is audited.                         ║
║      └── Who, when, before, after, duration, result.          ║
║                                                              ║
║  9.  Workflows can be templated.                             ║
║      └── Common patterns saved as reusable templates.         ║
║                                                              ║
║ 10.  Automation can be overridden manually.                  ║
║      └── Human intervention always possible.                  ║
║                                                              ║
║ 11.  SLAs are tracked automatically.                         ║
║      └── Every task has a timer. Every SLA breach escalates.  ║
║                                                              ║
║ 12.  Escalation has no dead end.                             ║
║      └── Every escalation ends with a human decision.         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Module |
|--------|-----------|--------|-------|--------|
| Workflow | `workflows` | 🔶 New | Phase 1 | Automation |
| Workflow Trigger | `workflowTriggers` | 🔶 New | Phase 1 | Automation |
| Workflow Condition | `workflowConditions` | 🔶 New | Phase 3 | Automation |
| Workflow Action | `workflowActions` | 🔶 New | Phase 4 | Automation |
| Workflow Audit Log | `workflowAuditLog` | 🔶 New | Phase 10 | Automation |
| Workflow Template | `workflowTemplates` | 🔶 New | Phase 7 | Automation |
| SLA Config | `slaConfigs` | 🔶 New | Phase 8 | Automation |
| Escalation Rule | `escalationRules` | 🔶 New | Phase 8 | Automation |
| Task (General) | `tasks` | ✅ Existing | Phase 5 | Tasks |
| Task Participants | `taskParticipants` | ✅ Existing | Phase 5 | Tasks |
| Task Checklist | `taskChecklistItems` | ✅ Existing | Phase 5 | Tasks |
| Task Comments | `taskComments` | ✅ Existing | Phase 5 | Tasks |
| Lead Task | `leadTasks` | ✅ Existing | Phase 5 (Merge) | CRM |
| Approval Template | `approvalTemplates` | ✅ Existing | Phase 6 | Approvals |
| Approval Request | `approvalRequests` | ✅ Existing | Phase 6 | Approvals |
| Approval Approver | `approvalRequestApprovers` | ✅ Existing | Phase 6 | Approvals |
| Lead Approval | `leadApprovals` | ✅ Existing | Phase 6 (Merge) | CRM |
| Lead Approval Decision| `leadApprovalDecisions` | ✅ Existing | Phase 6 (Merge) | CRM |

## Appendix B: Existing Code Integration Points

| Existing File | What It Does | DOC-10 Integration |
|---------------|-------------|-------------------|
| `tasks.ts` | General task CRUD, participants, checklist, comments, Kanban | Phase 5 — Enhance with SLA, deps, templates |
| `crmTasks.ts` | Lead-specific tasks, sales pending tasks view | Phase 5 — Merge into unified task model |
| `approvals.ts` | Multi-phase approval templates, sequential/parallel modes | Phase 6 — Add configurable levels, thresholds |
| `crmApprovals.ts` | CRM discount/waiver approvals, role-based routing | Phase 6 — Merge into unified approval engine |
| `notifications.ts` | In-app notifications for tasks, approvals | Phase 4 — Action executor uses DOC-09 |
| `crmHelpers.ts` | `logActivity` timeline logging | Phase 10 — Audit trail feeds into timelines |
| `crmActivity.ts` | Lead activity timeline | Phase 10 — Workflow steps logged to entity timeline |

---

*End of DOC-10 — Workflow, Tasks & Automation Engine Bible*
