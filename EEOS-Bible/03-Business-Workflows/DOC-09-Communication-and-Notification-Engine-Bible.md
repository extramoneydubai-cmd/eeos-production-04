# DOC-09 — Communication & Notification Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Unified Communication Platform  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2 Architecture, DOC-06 — Admission Engine, DOC-07 — Student 360°, DOC-08 — Finance Engine  
> **Existing Tables:** `leadWhatsAppMessages`, `notifications`, `channels`, `channelMembers`, `messages`, `directMessages`

---

## Table of Contents

1. [Communication Philosophy](#1-communication-philosophy)
2. [Communication Architecture](#2-communication-architecture)
3. [Communication Channels](#3-communication-channels)
4. [Recipient Resolution Engine](#4-recipient-resolution-engine)
5. [Communication Templates](#5-communication-templates)
6. [Variable Engine](#6-variable-engine)
7. [Event Engine](#7-event-engine)
8. [Automation Rules](#8-automation-rules)
9. [Scheduling Engine](#9-scheduling-engine)
10. [Communication Timeline](#10-communication-timeline)
11. [Delivery Status](#11-delivery-status)
12. [Marketing Communication](#12-marketing-communication)
13. [Parent Communication](#13-parent-communication)
14. [Student Communication](#14-student-communication)
15. [Employee Communication](#15-employee-communication)
16. [Approval Communication](#16-approval-communication)
17. [Notification Center](#17-notification-center)
18. [Communication Analytics](#18-communication-analytics)
19. [AI Opportunities](#19-ai-opportunities)
20. [External Integrations](#20-external-integrations)
21. [Security & Compliance](#21-security--compliance)
22. [Implementation Roadmap](#22-implementation-roadmap)
23. [Golden Rules](#23-golden-rules)

---

## 1. Communication Philosophy

### Purpose

The Communication & Notification Engine is the **central nervous system** of EEOS. Every business module raises events, and the Communication Engine decides who to notify, what to say, which channel to use, and when to send it.

This engine serves every module:

- CRM (Lead Management)
- Admissions
- Student Management
- Finance & Fee Engine
- Attendance
- Examinations
- HR & Payroll
- Tasks & Approvals
- Marketing & Campaigns
- Parent Portal
- Student App
- Employee App
- AI Agents

### Core Principle

**Business modules never send messages directly. They raise events. Communication owns delivery.**

### Business Rules

1. **Business modules generate events — never messages.** Modules define what happened. Communication decides how to inform.
2. **Communication never stores business data.** Phone numbers, emails, and contact preferences live in Family Contacts (for non-employees) or Users (for employees).
3. **Templates are reusable across modules.** A "reminder" template can be used by Finance, Attendance, or Exams.
4. **Recipient resolution is centralized.** Every message goes through Family Contacts or User Directory — no module hard-codes a phone number.
5. **Every communication is logged.** The Timeline stores every outbound and inbound message for audit and analytics.
6. **Delivery is trackable at every stage.** Queued → Sent → Delivered → Read → (Optional) Replied.
7. **Channels are pluggable.** Adding a new channel (Telegram, Slack, IVR) should require zero changes to business modules.
8. **Opt-out is respected globally.** A single opt-out applies across all channels and modules.
9. **Multi-language is built into templates.** Templates support language variants from day one.
10. **Consent is mandatory for marketing.** Transactional messages are exempt.

### Ownership Map

```
┌─────────────────────────────────────────────────────────────┐
│                 COMMUNICATION ENGINE                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Template  │  │Recipient │  │ Channel  │  │ Automation │  │
│  │Engine    │  │Resolver  │  │Router    │  │ Engine     │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Scheduling│  │ Identity │  │Consent   │  │ Analytics  │  │
│  │Engine    │  │Provider  │  │Manager   │  │ Dashboard  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐
│CRM/Leads │   │Finance   │   │Academic  │   │Student/    │
│(Events)  │   │(Events)  │   │(Events)  │   │Parent (UI) │
└──────────┘   └──────────┘   └──────────┘   └────────────┘
```

---

## 2. Communication Architecture

### High-Level Flow

```
Business Module
       │
       │   [1] Something happened (e.g., "Payment Received")
       │
       ▼
Event Raised ──────────────────────────────────────────────────
       │
       │   [2] Communication Engine listens for the event
       │
       ▼
Template Engine
       │
       │   [3] Selects the right template based on:
       │       └── Event type
       │       └── Channel (WhatsApp vs Email vs SMS)
       │       └── Language preference
       │       └── Recipient role
       │
       ▼
Variable Engine
       │
       │   [4] Replaces placeholders with actual data:
       │       └── {{student.name}}, {{invoice.amount}}, etc.
       │
       ▼
Recipient Resolver
       │
       │   [5] Determines WHO should receive this message:
       │       └── For parent: FamilyContact with role "Primary Fee Contact"
       │       └── For employee: User with role "Finance Manager"
       │       └── For marketing: Lead owner + Primary Decision Maker
       │
       ▼
Channel Router
       │
       │   [6] Determines WHICH channel to use:
       │       └── Transactional: WhatsApp preferred, SMS fallback
       │       └── Urgent: SMS + WhatsApp + Push
       │       └── Marketing: WhatsApp + Email
       │       └── Internal: Push + In-App
       │
       ▼
Scheduling Engine
       │
       │   [7] Decides WHEN to send:
       │       └── Immediate (default)
       │       └── Scheduled (future date/time)
       │       └── Batched (digest mode)
       │       └── Recurring (daily/weekly)
       │
       ▼
Delivery
       │
       │   [8] Sends via selected channel provider:
       │       └── WhatsApp Business API
       │       └── Twilio (SMS)
       │       └── SendGrid (Email)
       │       └── Firebase (Push)
       │       └── In-App Notification
       │
       ▼
Status Tracking
       │
       │   [9] Logs delivery status:
       │       └── Queued → Sent → Delivered → Read
       │       └── Or: Failed → Retry → Failed (final)
       │
       ▼
Timeline & Analytics
       │
       │   [10] Logged in:
       │        └── Communication Timeline (per entity)
       │        └── Communication Analytics (aggregate)
       │        └── Entity Timeline (lead/student/fee timeline)
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        EEOS COMMUNICATION ENGINE                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      EVENT BUS                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │CRM Events│ │Finance   │ │Academic  │ │Approvals     │   │ │
│  │  │          │ │Events    │ │Events    │ │Events        │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SUBSCRIPTION MATCHER                       │ │
│  │  Matches event → automation rules → templates               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                    ┌──────────┴──────────┐                        │
│                    ▼                     ▼                         │
│  ┌────────────────────────┐  ┌────────────────────────┐           │
│  │    TEMPLATE ENGINE      │  │   RECIPIENT RESOLVER   │           │
│  │  ┌────────────────────┐ │  │  ┌──────────────────┐ │           │
│  │  │ Template Library   │ │  │  │ Family Contacts  │ │           │
│  │  │ (Multi-language)   │ │  │  │ User Directory   │ │           │
│  │  │ (Per-channel)      │ │  │  │ Role Mapping     │ │           │
│  │  └────────────────────┘ │  │  └──────────────────┘ │           │
│  └────────────────────────┘  └────────────────────────┘           │
│                    │                    │                          │
│                    └──────────┬─────────┘                          │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │WhatsApp  │ │   SMS    │ │  Email   │ │  Push/In-App  │   │ │
│  │  │Provider  │ │ Provider │ │ Provider │ │   Provider    │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DELIVERY STATUS TRACKER                    │ │
│  │  Queued → Sent → Delivered → Read → Replied                │ │
│  │  Failed → Retry (3x) → Final Failure                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                               │                                    │
│                               ▼                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │  COMMUNICATION LOG   │  │  ANALYTICS PIPELINE   │              │
│  │  (Per-entity)        │  │  (Aggregate)          │              │
│  └──────────────────────┘  └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Existing Implementation (What's Already Built)

The current system already implements:

| Component | Existing Files | Status |
|-----------|---------------|--------|
| **WhatsApp Sending** | `crmWhatsApp.ts` — `sendWhatsAppMessage`, `getLeadWhatsAppMessages` | ✅ Existing |
| **Notification System** | `notifications.ts` — CRUD, mark read, unread count, list | ✅ Existing |
| **Messenger (Channels)** | `messenger.ts` — channels, messages, direct messages, announcements, pins | ✅ Existing |
| **Schema Tables** | `leadWhatsAppMessages`, `notifications`, `channels`, `channelMembers`, `messages`, `directMessages` | ✅ Existing |

### DOC-09 Extensions

| Extension | Purpose |
|-----------|---------|
| **Template Engine** | Centralized multi-language template library with variable substitution |
| **Recipient Resolver** | Unified resolution from Family Contacts and User Directory |
| **Event Engine** | Standardized event format and subscription system |
| **Automation Rules** | Event → Template → Channel → Recipient mapping |
| **Scheduling Engine** | Immediate, scheduled, recurring, batched delivery |
| **Multi-Channel Support** | Pluggable channel architecture (SMS, Email, Push, IVR) |
| **Delivery Tracking** | End-to-end status tracking with retry logic |
| **Consent Manager** | Opt-in/opt-out across channels and categories |
| **Communication Dashboard** | Analytics, delivery rates, channel performance |

---

## 3. Communication Channels

### Supported Channels (Current + Planned)

| Channel | Status | Use Case | Priority | Cost |
|---------|--------|----------|----------|------|
| **In-App Notification** | ✅ Existing | Internal alerts, mentions, approvals | Highest | Free |
| **In-App Messenger** | ✅ Existing | Team chat, DM, channels | High | Free |
| **WhatsApp** | ⚠️ Partial | Transactional, reminders, receipts | High | Per-message |
| **SMS** | 🔶 New | Urgent alerts, OTPs, fallback | High | Per-message |
| **Email** | 🔶 New | Reports, invoices, statements | Medium | Free/tiered |
| **Push Notification** | 🔶 New | Mobile app alerts | Medium | Free (FCM) |
| **Voice Call** | 🔶 New | Emergency, IVR, OTP | Low | Per-minute |
| **IVR** | 🔶 New | Automated phone menu | Low | Per-minute |
| **Telegram** | 🔶 New | Internal alerts, DevOps | Low | Free |
| **Slack** | 🔶 New | Enterprise team notifications | Low | Free |
| **Microsoft Teams** | 🔶 New | Enterprise team notifications | Low | Free |
| **Webhook** | 🔶 New | External system integration | Medium | Free |

### Channel Selection Priority

```
                    ┌──────────────────────────┐
                    │  MESSAGE CATEGORY         │
                    │                           │
                    │  Transactional ──► WhatsApp + Email
                    │  Urgent         ──► WhatsApp + SMS + Push
                    │  Promotional    ──► WhatsApp + Email
                    │  Internal       ──► Push + In-App
                    │  Emergency      ──► SMS + Voice Call
                    │  Digest         ──► Email
                    │  OTP            ──► SMS + WhatsApp
                    └──────────────────────────┘
```

### Channel Capabilities

| Feature | WhatsApp | SMS | Email | Push | In-App | Voice |
|---------|----------|-----|-------|------|--------|-------|
| Rich Text | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Images | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Documents | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Buttons/Actions | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Read Receipts | ✅ | ❌ | ✅ (link) | ❌ | ✅ | ❌ |
| Reply Tracking | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Templates | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Cost | Medium | Low | Free | Free | Free | High |

### Channel Fallback Logic

```
Attempt Primary Channel (WhatsApp)
       │
       ├── Success → Log & Complete
       │
       └── Failed → Check Fallback Chain
                      │
                      ├── Fallback 1: SMS (for urgent)
                      │     │
                      │     ├── Success → Log & Complete
                      │     │
                      │     └── Failed → Fallback 2
                      │
                      └── Fallback 2: Email
                            │
                            ├── Success → Log & Complete
                            │
                            └── Failed → Mark as Failed. Notify Admin.
```

---

## 4. Recipient Resolution Engine

### Purpose

The Recipient Resolver is the **most important component** of the Communication Engine. It determines WHO should receive each message based on the business event, entity type, and recipient role.

### Design Principle

**No phone numbers or emails are stored in the Communication Engine. All contact data lives in Family Contacts (DOC-05) or User Directory.**

### Recipient Sources

| Source | Coverage | Contains |
|--------|----------|----------|
| **Family Contacts** (Lead V2, DOC-05) | Parents, guardians, siblings | Name, Phone, WhatsApp, Email, Roles, Preferences |
| **User Directory** (users table) | Employees, faculty, admins | Name, Phone, Email, Department, Designation |
| **Lead Master** (leadMaster) | Initial lead contact | Phone (primary), Email (primary) |
| **Student Record** (future) | Student (if old enough) | Phone, Email |

### Recipient Role Resolution

#### For Student/Parent Communication

```
Event: "Payment Received" (Student: Raj Patel)
       │
       ▼
Family Contact Resolution:
  Find Family for Student Raj Patel
       │
       ▼
  Check Family Contacts for role "Primary Fee Contact"
       │
       ├── ✅ Sunita Patel (Mother) → Phone: +91-98765-43210
       │                               WhatsApp: ✅
       │                               Email: sunita@email.com
       │                               Preferred Channel: WhatsApp
       │                               Communication Time: 10:00-20:00
       │
       └── ❌ Rajesh Patel (Father) → Role: Decision Maker (CC only)
```

#### For Employee Communication

```
Event: "Approval Pending" (Task: #42)
       │
       ▼
User Directory Resolution:
  Find Approver for Task #42 by approvalRequestApprovers
       │
       ▼
  Check User record:
       ├── Name: Amit Sharma
       ├── Phone: +91-99887-76655
       ├── Email: amit@eeos.com
       ├── Department: Finance
       ├── Preferred Channel: In-App + WhatsApp
       └── Work Hours: 09:00-18:00
```

### Role Resolution Matrix

| Business Event | Primary Recipient | CC Recipients | Source |
|----------------|-------------------|---------------|--------|
| Payment Received | Primary Fee Contact | Decision Maker | Family Contacts |
| Invoice Generated | Primary Fee Contact | — | Family Contacts |
| Overdue Reminder | Primary Fee Contact | Decision Maker, Guardian | Family Contacts |
| Attendance Below 75% | Primary Academic Contact | Student | Family Contacts |
| Exam Scheduled | Primary Academic Contact | Student | Family Contacts |
| Result Published | Primary Academic Contact | Student, Decision Maker | Family Contacts |
| Admission Approved | Primary Decision Maker | All Contacts | Family Contacts |
| Document Pending | Student | Primary Academic Contact | Lead/Student |
| Task Assigned | Assigned User | Task Owner | User Directory |
| Approval Pending | Approver(s) | Requester | User Directory |
| Lead Assigned | Assigned Counsellor | Lead Owner | User Directory |
| Certificate Ready | Student | Primary Contact | Student Record |
| Emergency Alert | All Contacts | — | Family Contacts |
| Marketing Campaign | Marketing Contact | — | Family Contacts |

### Resolver Logic

```
function resolveRecipients(event, entityId, entityType):
    if entityType == "student":
        family = getFamilyByStudent(entityId)
        contacts = getFamilyContacts(family.id)
        return filterByRole(contacts, event.recipientRole)
    
    else if entityType == "lead":
        family = getFamilyByLead(entityId)
        contacts = getFamilyContacts(family.id)
        return filterByRole(contacts, event.recipientRole)
    
    else if entityType == "user":
        user = getUser(entityId)
        return [user]
    
    else if entityType == "approval":
        approvers = getApprovers(entityId)
        return approvers.map(getUser)
```

### Design Rules

- Primary recipient always gets full message content
- CC recipients get summary or notification only
- Hard bounces on a contact auto-disable that channel for the contact
- Recipients can be added/removed from individual communications by operators

---

## 5. Communication Templates

### Purpose

Templates are **reusable, multi-channel, multi-language message blueprints** that are approved for use. Every outbound message is generated from a template — no manual message creation for automated events.

### Template Fields

| Field | Type | Purpose |
|-------|------|---------|
| `templateName` | `string` | Human-readable name |
| `templateCode` | `string` | Machine-readable code (e.g., `payment_reminder_3d`) |
| `module` | `string` | Owner module (Finance, Attendance, Exams, etc.) |
| `channel` | `string` | Target channel (WhatsApp, SMS, Email, Push, In-App) |
| `language` | `string` | Language code (en, hi, mr, gu, fr, ar) |
| `category` | `string` | Transactional / Promotional / Alert / System |
| `subject` | `optional(string)` | Subject line (for Email, Push) |
| `body` | `string` | Message body with {{variables}} |
| `footer` | `optional(string)` | Footer text (unsubscribe, brand name) |
| `headerMedia` | `optional(string)` | Media URL (for WhatsApp template header) |
| `buttonText` | `optional(string)` | CTA button text |
| `buttonUrl` | `optional(string)` | CTA button URL template |
| `variables` | `array(string)` | Expected variable names for validation |
| `version` | `number` | Version number for approval tracking |
| `isApproved` | `boolean` | Must be approved before use |
| `approvedBy` | `optional(id(users))` | Who approved |
| `approvedAt` | `optional(number)` | Approval date |
| `isActive` | `boolean` | Active templates can be used in automation |
| `createdBy` | `id(users)` | Creator |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Template Examples

#### WhatsApp — Payment Reminder (English)

```json
{
  "templateCode": "payment_reminder_3d",
  "channel": "whatsapp",
  "language": "en",
  "category": "transactional",
  "body": "Dear {{contact.name}},\n\nThis is a reminder that {{student.name}}'s\n{{installment.description}} of {{installment.amount}} is due in 3 days\n(Due Date: {{installment.dueDate}}).\n\nPay now: {{payment.link}}\n\nOutstanding Balance: {{invoice.balance}}\n\nThank you,\n{{organization.name}}",
  "variables": [
    "contact.name", "student.name", "installment.description",
    "installment.amount", "installment.dueDate", "payment.link",
    "invoice.balance", "organization.name"
  ]
}
```

#### WhatsApp — Payment Reminder (Hindi)

```json
{
  "templateCode": "payment_reminder_3d",
  "channel": "whatsapp",
  "language": "hi",
  "category": "transactional",
  "body": "प्रिय {{contact.name}},\n\nयह एक स्मरण पत्र है कि {{student.name}} का\n{{installment.description}} {{installment.amount}} 3 दिनों में देय है\n(देय तिथि: {{installment.dueDate}})।\n\nअभी भुगतान करें: {{payment.link}}\n\nबकाया राशि: {{invoice.balance}}\n\nधन्यवाद,\n{{organization.name}}",
  "variables": [
    "contact.name", "student.name", "installment.description",
    "installment.amount", "installment.dueDate", "payment.link",
    "invoice.balance", "organization.name"
  ]
}
```

#### SMS — Urgent Alert

```json
{
  "templateCode": "emergency_alert",
  "channel": "sms",
  "language": "en",
  "category": "alert",
  "body": "URGENT: {{organization.name}} alert. {{alert.message}}. Contact: {{organization.phone}}",
  "variables": ["organization.name", "alert.message", "organization.phone"]
}
```

#### Email — Invoice Statement

```json
{
  "templateCode": "invoice_statement",
  "channel": "email",
  "language": "en",
  "category": "transactional",
  "subject": "Fee Statement for {{student.name}} — {{session.name}}",
  "body": "<h2>Fee Statement</h2><p>Dear {{contact.name}},</p><p>Please find attached the fee statement for <strong>{{student.name}}</strong> for the session {{session.name}}.</p><table><tr><th>Invoice</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th></tr>{{#each invoices}}<tr><td>{{number}}</td><td>{{amount}}</td><td>{{paid}}</td><td>{{balance}}</td><td>{{dueDate}}</td></tr>{{/each}}</table><p>Total Outstanding: <strong>{{total.outstanding}}</strong></p><p>Pay now: <a href='{{payment.link}}'>{{payment.link}}</a></p><p>Thank you,<br/>{{organization.name}}</p>",
  "variables": ["student.name", "session.name", "contact.name", "invoices", "total.outstanding", "payment.link", "organization.name"]
}
```

#### In-App Notification — Task Assigned

```json
{
  "templateCode": "task_assigned",
  "channel": "in_app",
  "language": "en",
  "category": "system",
  "body": "📋 New task assigned: **{{task.title}}**\nPriority: {{task.priority}} | Due: {{task.dueDate}}\n\nAssigned by: {{assigner.name}}",
  "variables": ["task.title", "task.priority", "task.dueDate", "assigner.name"]
}
```

### Default Template Catalog

| Module | Template Code | Channel | Category |
|--------|---------------|---------|----------|
| **CRM** | `lead_welcome` | WhatsApp | Transactional |
| **CRM** | `lead_followup` | WhatsApp | Promotional |
| **CRM** | `lead_assigned` | In-App | System |
| **Admission** | `admission_confirmed` | WhatsApp | Transactional |
| **Admission** | `document_pending` | WhatsApp | Transactional |
| **Admission** | `seat_reserved` | WhatsApp | Transactional |
| **Finance** | `invoice_issued` | WhatsApp | Transactional |
| **Finance** | `payment_reminder_7d` | WhatsApp | Transactional |
| **Finance** | `payment_reminder_3d` | WhatsApp | Transactional |
| **Finance** | `payment_reminder_1d` | WhatsApp/SMS | Transactional |
| **Finance** | `payment_overdue` | WhatsApp/SMS | Alert |
| **Finance** | `payment_receipt` | WhatsApp | Transactional |
| **Finance** | `receipt_ready` | WhatsApp/Email | Transactional |
| **Finance** | `cheque_bounced` | WhatsApp | Alert |
| **Finance** | `refund_initiated` | WhatsApp | Transactional |
| **Finance** | `refund_completed` | WhatsApp | Transactional |
| **Finance** | `scholarship_approved` | WhatsApp | Transactional |
| **Finance** | `discount_approved` | WhatsApp | Transactional |
| **Attendance** | `attendance_low` | WhatsApp | Alert |
| **Attendance** | `attendance_weekly` | WhatsApp/Email | Digest |
| **Attendance** | `attendance_monthly` | WhatsApp/Email | Digest |
| **Exams** | `exam_scheduled` | WhatsApp | Transactional |
| **Exams** | `exam_reminder_tomorrow` | WhatsApp/SMS | Transactional |
| **Exams** | `result_published` | WhatsApp | Transactional |
| **Academic** | `homework_assigned` | WhatsApp | Transactional |
| **Academic** | `homework_reminder` | WhatsApp | Transactional |
| **Academic** | `certificate_ready` | WhatsApp | Transactional |
| **Tasks** | `task_assigned` | In-App | System |
| **Tasks** | `task_completed` | In-App | System |
| **Tasks** | `task_overdue` | In-App/Slack | Alert |
| **Approvals** | `approval_pending` | In-App/WhatsApp | System |
| **Approvals** | `approval_approved` | In-App | System |
| **Approvals** | `approval_rejected` | In-App | System |
| **Approvals** | `approval_escalated` | In-App/Slack | Alert |
| **Student** | `id_card_ready` | WhatsApp | Transactional |
| **Student** | `placement_offer` | WhatsApp | Transactional |
| **Student** | `course_completed` | WhatsApp | Transactional |
| **General** | `birthday_wish` | WhatsApp | Promotional |
| **General** | `holiday_notice` | WhatsApp | Transactional |
| **General** | `emergency_alert` | SMS | Alert |

### Template Approval Workflow

```
Draft Template Created
       │
       ▼
Variables Validated (all {{variables}} exist in entity context)
       │
       ▼
Content Review (Marketing/Comms team)
       │
       ├── Approved → Status: Ready for Use
       │
       └── Rejected → Returned with feedback
       
Version increments on every change.
Previous versions preserved for audit.
```

---

## 6. Variable Engine

### Purpose

The Variable Engine replaces placeholders (`{{variable.name}}`) in templates with actual data from the business entities.

### Variable Resolution

```
Template Body:
"Dear {{contact.name}}, {{student.name}}'s installment of {{installment.amount}} is due."

       │
       ▼
Variable Engine:
       │
       ├── {{contact.name}}       → Resolver: FamilyContact.getName(contactId)         → "Sunita Patel"
       ├── {{student.name}}       → Resolver: Student.getName(studentId)                → "Raj Patel"
       └── {{installment.amount}} → Resolver: Installment.getAmount(installmentId)     → "₹10,660"
       
       │
       ▼
Final Output:
"Dear Sunita Patel, Raj Patel's installment of ₹10,660 is due."
```

### Variable Categories

| Category | Source | Examples |
|----------|--------|----------|
| **Contact** | Family Contact | `{{contact.name}}`, `{{contact.relationship}}` |
| **Student** | Student Record | `{{student.name}}`, `{{student.rollNumber}}`, `{{student.program}}`, `{{student.batch}}` |
| **Lead** | Lead Master | `{{lead.name}}`, `{{lead.phone}}`, `{{lead.source}}`, `{{lead.stage}}` |
| **Family** | Family Entity | `{{family.name}}`, `{{family.type}}` |
| **Invoice** | Invoices | `{{invoice.number}}`, `{{invoice.amount}}`, `{{invoice.balance}}`, `{{invoice.dueDate}}` |
| **Installment** | Payment Installments | `{{installment.number}}`, `{{installment.amount}}`, `{{installment.dueDate}}`, `{{installment.description}}` |
| **Payment** | Lead Payments | `{{payment.amount}}`, `{{payment.mode}}`, `{{payment.date}}`, `{{payment.receiptNumber}}` |
| **Receipt** | Receipts | `{{receipt.number}}`, `{{receipt.amount}}`, `{{receipt.date}}`, `{{receipt.downloadUrl}}` |
| **Attendance** | Attendance Records | `{{attendance.percentage}}`, `{{attendance.present}}`, `{{attendance.total}}` |
| **Exam** | Examinations | `{{exam.name}}`, `{{exam.date}}`, `{{exam.subject}}`, `{{exam.time}}` |
| **Result** | Results | `{{result.subject}}`, `{{result.marks}}`, `{{result.grade}}`, `{{result.percentage}}` |
| **Task** | Tasks | `{{task.title}}`, `{{task.priority}}`, `{{task.dueDate}}`, `{{task.status}}` |
| **Approval** | Approvals | `{{approval.title}}`, `{{approval.status}}`, `{{approval.requester}}` |
| **Organization** | Org Settings | `{{organization.name}}`, `{{organization.phone}}`, `{{organization.email}}`, `{{organization.address}}` |
| **Date/Time** | System | `{{date.today}}`, `{{date.now}}`, `{{time.now}}` |
| **Link** | Generated | `{{payment.link}}`, `{{receipt.link}}`, `{{form.link}}`, `{{portal.link}}` |

### Variable Validation Rules

- Every variable used in a template must have a registered resolver
- Missing variables produce `[MISSING: variable.name]` in output (never crash)
- Variables are validated at template creation time
- Nested variables supported: `{{student.program.name}}` → Student → Program → Name
- Conditionals supported: `{{#if invoice.balance > 0}}You owe {{invoice.balance}}{{/if}}`

---

## 7. Event Engine

### Purpose

The Event Engine is the **input layer** of the Communication Engine. Every business module raises events when something happens. The Event Engine receives these events, matches them against automation rules, and triggers the appropriate communication workflow.

### Event Format

```
{
  "eventId": "evt_20260708_abcd1234",
  "eventType": "payment.received",
  "eventVersion": "1.0",
  "module": "finance",
  "entityType": "student",
  "entityId": "student_abc123",
  "leadId": "lead_xyz789",
  "timestamp": 1762560000000,
  "triggeredBy": "system",
  "data": {
    "invoiceId": "inv_001",
    "amount": 10660,
    "mode": "upi",
    "paymentId": "pay_042"
  },
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "EEOS System"
  }
}
```

### Event Registry

#### CRM Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `lead.created` | New lead created | leadId, source, createdBy |
| `lead.assigned` | Lead assigned to counsellor | leadId, fromUserId, toUserId |
| `lead.stage.changed` | Lead moved to new stage | leadId, fromStage, toStage |
| `lead.converted` | Lead converted to admission | leadId, admissionId |
| `lead.lost` | Lead marked as lost | leadId, lostReasonId |
| `lead.note.added` | New note on lead | leadId, noteId, createdBy |

#### Admission Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `admission.started` | Admission form initiated | leadId, admissionId |
| `admission.documents.uploaded` | Documents submitted | admissionId, documentIds |
| `admission.documents.verified` | Documents verified/rejected | admissionId, status |
| `admission.approved` | Admission approved | leadId, admissionId |
| `admission.rejected` | Admission rejected | admissionId, reason |
| `admission.seat.reserved` | Seat reserved | admissionId, seatNumber |
| `admission.completed` | Full admission done | leadId, admissionId, studentId |

#### Finance Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `invoice.issued` | New invoice generated | invoiceId, studentId, amount, dueDate |
| `payment.received` | Payment processed | paymentId, invoiceId, amount, mode |
| `payment.verified` | Payment verified | paymentId, verifiedBy |
| `payment.overdue` | Installment becomes overdue | installmentId, studentId, daysOverdue |
| `payment.reminder.sent` | Auto-reminder sent | installmentId, reminderType |
| `receipt.generated` | Receipt PDF ready | receiptId, downloadUrl |
| `invoice.cancelled` | Invoice cancelled | invoiceId, reason |
| `cheque.bounced` | PDC bounced | pdcId, studentId, amount, bounceReason |
| `scholarship.approved` | Scholarship granted | scholarshipId, studentId, amount |
| `discount.approved` | Discount approved | discountId, studentId, amount |
| `refund.requested` | Refund initiated | refundId, studentId, amount |
| `refund.completed` | Refund processed | refundId, processedAt |

#### Academic Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `attendance.below.threshold` | Attendance < 75% | studentId, percentage, subject |
| `attendance.weekly.summary` | Weekly attendance report | studentId, weekStart, percentage |
| `exam.scheduled` | New exam scheduled | examId, studentIds, subject, date |
| `exam.reminder` | Exam tomorrow | examId, studentIds, subject, time |
| `result.published` | Results announced | resultId, studentId, subject, marks |
| `homework.assigned` | New homework | homeworkId, studentIds, subject, dueDate |
| `homework.reminder` | Homework due tomorrow | homeworkId, studentIds, dueDate |
| `certificate.ready` | Certificate generated | certificateId, studentId, type |

#### Task & Approval Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `task.created` | New task | taskId, assignedTo, priority, dueDate |
| `task.completed` | Task done | taskId, completedBy |
| `task.overdue` | Past due date | taskId, assignedTo, daysOverdue |
| `approval.pending` | Approval needed | approvalId, requesterId, type, amount |
| `approval.approved` | Request approved | approvalId, approvedBy |
| `approval.rejected` | Request rejected | approvalId, rejectedBy, reason |
| `approval.escalated` | SLA breached | approvalId, daysPending |

#### Student Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `student.created` | New student record | studentId, leadId, admissionId |
| `student.batch.allocated` | Batch assigned | studentId, batchId, program |
| `student.portal.activated` | Parent portal live | studentId, contactId |
| `student.idcard.ready` | ID card generated | studentId, idCardUrl |
| `student.placement.offer` | Placement offer | studentId, company, package |
| `student.course.completed` | Course done | studentId, certificateId |

#### General Events

| Event Type | Trigger | Data Payload |
|------------|---------|-------------|
| `birthday` | Student/staff birthday | entityId, entityType, name |
| `holiday.notice` | Upcoming holiday | holidayName, date |
| `emergency` | Emergency alert | message, affectedEntityIds, severity |

### Event Subscription

```
┌──────────────────────────────────────┐
│  AUTOMATION RULES (Event → Template) │
├──────────────────────────────────────┤
│                                      │
│  Event: payment.received             │
│    ├── Template: payment_receipt     │
│    │   Channel: WhatsApp             │
│    │   Recipient: Primary Fee Contact│
│    │   Schedule: Immediate           │
│    │                                 │
│    ├── Template: receipt_ready       │
│    │   Channel: Email                │
│    │   Recipient: Primary Fee Contact│
│    │   Schedule: Immediate           │
│    │                                 │
│    └── Action: Update Timeline       │
│        Entity: Student               │
│                                      │
│  Event: attendance.below.threshold   │
│    ├── Template: attendance_low      │
│    │   Channel: WhatsApp             │
│    │   Recipient: Primary Academic   │
│    │   Schedule: Immediate           │
│    │                                 │
│    └── Action: Create Task           │
│        Task: Schedule parent meeting │
│        Assign: Counsellor            │
│                                      │
└──────────────────────────────────────┘
```

---

## 8. Automation Rules

### Purpose

Automation Rules define the **Event → Template → Channel → Recipient** mapping. They are the configuration layer that connects business events to communication actions.

### Rule Fields

| Field | Type | Purpose |
|-------|------|---------|
| `ruleName` | `string` | Human-readable name |
| `ruleCode` | `string` | Machine-readable code |
| `module` | `string` | Owner module |
| `eventType` | `string` | Triggering event |
| `conditions` | `optional(object)` | Conditional filters (e.g., amount > 5000) |
| `actions` | `array(object)` | Actions to execute |
| `priority` | `number` | Rule evaluation priority |
| `isActive` | `boolean` | Whether rule is active |
| `createdBy` | `id(users)` | Creator |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Action Object

```
{
  "actionType": "send_message",
  "templateCode": "payment_receipt",
  "channel": "whatsapp",
  "recipientRole": "primary_fee_contact",
  "ccRoles": ["decision_maker"],
  "schedule": "immediate"
}
```

### Rule Examples

#### Rule 1: Send Receipt on Payment

```json
{
  "ruleName": "Send payment receipt via WhatsApp",
  "module": "finance",
  "eventType": "payment.received",
  "conditions": { "amount": { "gte": 1 } },
  "actions": [
    {
      "actionType": "send_message",
      "templateCode": "payment_receipt",
      "channel": "whatsapp",
      "recipientRole": "primary_fee_contact",
      "schedule": "immediate"
    },
    {
      "actionType": "send_notification",
      "templateCode": "payment_success_alert",
      "recipientRole": "accountant",
      "schedule": "immediate"
    }
  ],
  "isActive": true
}
```

#### Rule 2: Alert on Low Attendance

```json
{
  "ruleName": "Notify parent when attendance below 75%",
  "module": "attendance",
  "eventType": "attendance.below.threshold",
  "conditions": { "percentage": { "lt": 75 } },
  "actions": [
    {
      "actionType": "send_message",
      "templateCode": "attendance_low",
      "channel": "whatsapp",
      "recipientRole": "primary_academic_contact",
      "schedule": "immediate"
    },
    {
      "actionType": "create_task",
      "taskTitle": "Parent meeting for low attendance",
      "assignToRole": "counsellor",
      "dueInDays": 3
    }
  ],
  "isActive": true
}
```

#### Rule 3: Overdue Escalation

```json
{
  "ruleName": "Escalate overdue installments",
  "module": "finance",
  "eventType": "payment.overdue",
  "conditions": {},
  "actions": [
    {
      "actionType": "send_message",
      "templateCode": "payment_overdue",
      "channel": "whatsapp",
      "recipientRole": "primary_fee_contact",
      "schedule": "immediate"
    },
    {
      "actionType": "send_message",
      "templateCode": "payment_overdue_sms",
      "channel": "sms",
      "recipientRole": "primary_fee_contact",
      "schedule": "immediate"
    }
  ],
  "isActive": true
}
```

### Rule Evaluation Order

```
1. All active rules for the event type are collected
2. Rules are sorted by priority (higher = evaluated first)
3. Conditions are evaluated in order
4. First matching rule(s) execute
5. Multiple rules can match (all actions execute)
6. Actions are executed in order specified in the rule
```

### Design Rules

- Rules can have **multiple actions** (send WhatsApp + create task)
- Conditions support: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`
- Rules can be **temporarily disabled** without deleting
- Rule execution is **logged** for debugging and audit
- Rules can have **time-based conditions** (e.g., only send during business hours)

---

## 9. Scheduling Engine

### Purpose

The Scheduling Engine determines **WHEN** a communication should be delivered.

### Schedule Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Immediate** | Send right now | Payment receipt, task assigned |
| **Scheduled** | Send at specific future time | Exam reminder tomorrow, birthday |
| **Recurring** | Send on a repeating schedule | Weekly attendance report, monthly fee statement |
| **Batched** | Collect and send in digest | Daily summary, weekly newsletter |
| **Delayed** | Send after a delay | Follow-up 24h after no response |

### Examples

```
Immediate:
  Payment Received → Send Receipt → 0s delay

Scheduled:
  Exam Scheduled → Send Reminder → T-1 day at 08:00
  Birthday → Send Wish → 07:00 on birthday

Recurring:
  Weekly Attendance → Every Monday at 09:00
  Monthly Statement → 1st of every month at 10:00
  Fee Reminder → T-7, T-3, T-1 before due date

Delayed:
  No response to follow-up → Send 2nd message → After 24h
  No payment after reminder → Escalate → After 7 days

Batched:
  Daily Digest → 18:00 daily
  Weekly Newsletter → 10:00 every Monday
```

### Scheduling Configuration

```
┌────────────────────────────────────────────────────────────┐
│  SCHEDULE CONFIGURATION                                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Rule: payment_reminder_sequence                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Reminder 1: T-7 days  at 10:00 local time         │     │
│  │  Reminder 2: T-3 days  at 10:00 local time         │     │
│  │  Reminder 3: T-1 day   at 10:00 local time         │     │
│  │  Reminder 4: T+0 days  at 12:00 (due date)        │     │
│  │  Overdue 1:   T+7 days  at 10:00 local time         │     │
│  │  Overdue 2:   T+14 days at 10:00 + SMS              │     │
│  │  Overdue 3:   T+30 days at 10:00 + SMS + Push      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  Quiet Hours: 21:00 to 08:00 (queue for next morning)       │
│  Weekend Policy: Urgent only on weekends                    │
│  Timezone: Entity's branch timezone                         │
│  Holiday Exceptions: Skip on public holidays                │
└────────────────────────────────────────────────────────────┘
```

### Scheduling Queue

```
┌───────────────────────────────────────────┐
│           SCHEDULING QUEUE                 │
├───────────────────────────────────────────┤
│                                           │
│  ID │ Event          │ Scheduled At │ Status│
│ ────┼────────────────┼──────────────┼───────│
│  1  │ Payment Receipt│ Immediate    │ Sent  │
│  2  │ Exam Reminder  │ 10-Aug 08:00│ Queued│
│  3  │ Birthday Wish  │ 15-Aug 07:00│ Queued│
│  4  │ Fee Due T-7   │ 25-Aug 10:00│ Queued│
│  5  │ Weekly Digest  │ Every Mon    │ Active│
│  6  │ Late Follow-up │ After 24h   │ Paused│
│                                           │
└───────────────────────────────────────────┘
```

---

## 10. Communication Timeline

### Purpose

Every communication sent through the engine is logged in the Communication Timeline. This provides a complete, auditable history of all outbound and (where applicable) inbound messages.

### Communication Log Fields

| Field | Type | Purpose |
|-------|------|---------|
| `logId` | `id` | Unique log entry |
| `eventId` | `string` | Source event ID |
| `entityType` | `string` | lead / student / user / approval |
| `entityId` | `string` | ID of the entity |
| `channel` | `string` | WhatsApp / SMS / Email / Push / In-App |
| `recipientId` | `string` | FamilyContact ID or User ID |
| `recipientName` | `string` | Human-readable recipient name |
| `recipientAddress` | `string` | Phone number / Email / Device token |
| `templateCode` | `string` | Template used |
| `language` | `string` | Language of the message |
| `messageContent` | `string` | Final rendered message |
| `status` | `string` | Queued / Sent / Delivered / Read / Failed / Bounced |
| `statusHistory` | `array(object)` | Timeline of status changes |
| `deliveryAttempts` | `number` | Number of delivery attempts |
| `providerResponse` | `optional(string)` | Raw response from provider |
| `cost` | `optional(number)` | Cost of this communication |
| `metadata` | `optional(object)` | Additional data |
| `createdAt` | `number` | When the communication was initiated |
| `sentAt` | `optional(number)` | When it was sent |
| `deliveredAt` | `optional(number)` | When confirmed delivered |
| `readAt` | `optional(number)` | When confirmed read |

### Timeline View (Per Entity)

```
Student: Raj Patel
═══════════════════════════════════════════════════════════════
COMMUNICATION TIMELINE

Date       │ Channel   │ Message                          │ Status
───────────┼───────────┼──────────────────────────────────┼──────────
15-Aug-26  │ WhatsApp  │ Welcome to EEOS Institute!        │ ✅ Read
           │           │ Hi Rajesh Patel, welcome aboard!  │
───────────┼───────────┼──────────────────────────────────┼──────────
01-Sep-26  │ WhatsApp  │ Receipt: ₹10,660 via UPI          │ ✅ Read
           │           │ Dear Sunita Patel, payment of     │
           │           │ ₹10,660 received successfully.    │
───────────┼───────────┼──────────────────────────────────┼──────────
24-Sep-26  │ WhatsApp  │ Fee Reminder: Installment #3      │ ✅ Delivered
           │           │ Due in 7 days (01-Oct)            │
───────────┼───────────┼──────────────────────────────────┼──────────
28-Sep-26  │ SMS       │ URGENT: Fee overdue by 3 days    │ ✅ Delivered
           │           │ Pay ₹10,660 immediately to        │
           │           │ avoid late fee.                   │
───────────┼───────────┼──────────────────────────────────┼──────────
01-Oct-26  │ WhatsApp  │ Payment Link Sent                 │ ✅ Delivered
           │           │ Click to pay ₹10,660              │
───────────┼───────────┼──────────────────────────────────┼──────────
15-Oct-26  │ In-App    │ New task: Parent meeting          │ ✅ Read
           │           │ Counsellor assigned                │
───────────┼───────────┼──────────────────────────────────┼──────────
```

### Timeline API

```
// Get all communications for a student
GET /api/communication/log?entityType=student&entityId=stu_123

// Get communications by channel
GET /api/communication/log?entityType=student&entityId=stu_123&channel=whatsapp

// Get communications in date range
GET /api/communication/log?entityType=student&entityId=stu_123&from=01-Sep-2026&to=30-Sep-2026
```

---

## 11. Delivery Status

### Status Lifecycle

```
                    ┌──────────┐
                    │  QUEUED   │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │  SENT     │
                    └────┬─────┘
                         │
                    ┌────┴─────┐
                    │          │
                    ▼          ▼
              ┌──────────┐ ┌──────────┐
              │ DELIVERED│ │  FAILED   │
              └────┬─────┘ └────┬─────┘
                   │            │
                   ▼            ▼
              ┌──────────┐ ┌──────────┐
              │   READ    │ │  RETRY   │
              └────┬─────┘ └────┬─────┘
                   │            │
                   ▼            ▼
              ┌──────────┐ ┌──────────┐
              │  REPLIED  │ │ FINAL    │
              │ (WhatsApp)│ │ FAILURE  │
              └──────────┘ └──────────┘
```

### Status Definitions

| Status | Definition | Next Action |
|--------|------------|-------------|
| **Queued** | Message added to send queue | Worker picks up and sends |
| **Sent** | Submitted to provider | Wait for delivery receipt |
| **Delivered** | Confirmed received by device | Track read status |
| **Read** | Recipient opened/read message | Complete (success) |
| **Replied** | Recipient replied (WhatsApp only) | Route to CRM timeline |
| **Failed** | Sending failed | Retry if attempts < max |
| **Retry** | Attempting re-send (up to 3x) | Exponential backoff |
| **Final Failure** | All retries exhausted | Notify module owner |
| **Bounced** | Invalid number/email | Disable contact channel |
| **Expired** | Message TTL exceeded | Remove from queue |
| **Blocked** | Recipient blocked sender | Do not send again |

### Retry Logic

```
Attempt 1: Immediate
  ├── Success → Complete
  └── Failure → Wait 5 minutes

Attempt 2: After 5 minutes
  ├── Success → Complete
  └── Failure → Wait 30 minutes

Attempt 3: After 30 minutes
  ├── Success → Complete
  └── Failure → Final Failure → Notify Admin

For SMS: Max 3 attempts, 5 min gap
For WhatsApp: Max 3 attempts, 10 min gap
For Email: Max 2 attempts, 30 min gap
For Push: Max 1 attempt (no retry)
```

### Bounce Handling

```
Bounce Detected (Hard Bounce)
       │
       ├── Mark Contact's Channel as Invalid
       ├── Log in Communication Timeline
       ├── Notify Module Owner (Admin)
       │
       └── Auto-Switch to Fallback Channel:
           └── WhatsApp fails → Try SMS
           └── SMS fails → Try Email
           └── Email fails → Mark as Final Failure
```

---

## 12. Marketing Communication

### Purpose

Marketing Communication handles bulk, promotional, and campaign-based messaging. Unlike transactional messages, marketing requires explicit consent and supports opt-out.

### Key Differences from Transactional

| Aspect | Transactional | Marketing |
|--------|--------------|-----------|
| **Consent** | Implied (by relationship) | Explicit (opt-in required) |
| **Opt-Out** | Not applicable | Mandatory |
| **Frequency** | Event-driven | Campaign-driven |
| **Segmentation** | Per-entity | Bulk by audience |
| **Analytics** | Per-message | Per-campaign |
| **Time Restriction** | 24x7 | Business hours only |

### Campaign Structure

```
Campaign: "Summer Batch 2027 — Early Bird Offer"
═══════════════════════════════════════════════════════════════
Status: Draft / Scheduled / Running / Completed / Paused

Audience:
  ├── Segment: All leads (stage IN "qualified", "demo_done")
  ├── Segment: Active parents with sibling not enrolled
  ├── Exclude: Already enrolled for Summer 2027
  └── Exclude: Opted out of marketing

Channels:
  ├── Primary: WhatsApp
  └── Fallback: SMS

Schedule:
  ├── Send Date: 01-Dec-2026
  ├── Send Time: 10:00 (branch timezone)
  └── Follow-up: 7 days later (if no response)

Template:
  ├── Code: summer_early_bird_2027
  ├── Language: English (default), Hindi (alternate)
  └── Variables: {{contact.name}}, {{student.name}}

Tracking:
  ├── UTM Source: whatsapp_campaign
  ├── UTM Campaign: summer_early_bird_2027
  ├── UTM Medium: whatsapp
  └── Track: clicked, converted
```

### Segment Definitions

| Segment | Criteria | Typical Size |
|---------|----------|-------------|
| **Hot Leads** | Stage = "interested" or "demo_done", contacted in 7 days | Small |
| **Warm Leads** | Stage = "qualified", last contact 7-30 days ago | Medium |
| **Cold Leads** | Stage = "new" or "qualified", last contact > 30 days | Large |
| **Active Students** | Status = "active", attendance > 75% | Medium |
| **At-Risk Students** | Status = "active", attendance < 75% | Small |
| **Sibling Eligible** | Has sibling not enrolled in any program | Medium |
| **Past Due Parents** | Outstanding > 30 days | Small |
| **Expired Leads** | Status = "archived", created > 6 months ago | Large |

### Marketing Consent Flow

```
User/Lead Created
       │
       ▼
Marketing Consent Asked
       │
       ├── Opt-In → Marketing flag = true
       │             Can receive promotional messages
       │
       └── Opt-Out → Marketing flag = false
                       Never receive promotional messages
                       (Transactional messages still allowed)

Opt-Out is immediate and global:
  └── Opt-out of ALL marketing (all channels)
  └── Opt-out by channel (e.g., no WhatsApp marketing, but SMS is OK)

Legal Requirements:
  └── Every marketing message includes "Reply STOP to unsubscribe"
  └── Consent log stored for compliance
  └── GDPR right to erasure supported
```

---

## 13. Parent Communication

### Purpose

Parents (Family Contacts) are the primary recipients of student-related communications. All parent messages use the Family Contact architecture from DOC-05.

### Parent Communication Matrix

| Category | Event | Template | Channel | Recipient |
|----------|-------|----------|---------|-----------|
| **Admission** | Admission Confirmed | `admission_confirmed` | WhatsApp | Decision Maker |
| **Admission** | Document Pending | `document_pending` | WhatsApp | Academic Contact |
| **Admission** | Orientation Invite | `orientation_invite` | WhatsApp | All Contacts |
| **Fees** | Invoice Issued | `invoice_issued` | WhatsApp | Fee Contact |
| **Fees** | Payment Due | `payment_reminder` | WhatsApp | Fee Contact |
| **Fees** | Overdue | `payment_overdue` | WhatsApp+SMS | Fee Contact + DM |
| **Fees** | Receipt Ready | `receipt_ready` | WhatsApp+Email | Fee Contact |
| **Fees** | Refund Processed | `refund_completed` | WhatsApp | Fee Contact |
| **Academics** | Attendance Low | `attendance_low` | WhatsApp | Academic Contact |
| **Academics** | Weekly Attendance | `attendance_weekly` | WhatsApp | Academic Contact |
| **Academics** | Homework Assigned | `homework_assigned` | WhatsApp | Student + Academic |
| **Academics** | Exam Scheduled | `exam_scheduled` | WhatsApp | Academic Contact |
| **Academics** | Exam Reminder | `exam_reminder` | WhatsApp+SMS | Academic Contact |
| **Academics** | Result Published | `result_published` | WhatsApp | Academic + DM |
| **Academics** | Certificate Ready | `certificate_ready` | WhatsApp | Student + Contact |
| **General** | Holiday Notice | `holiday_notice` | WhatsApp | All Contacts |
| **General** | Emergency Alert | `emergency_alert` | SMS | All Contacts |
| **General** | Birthday Wish | `birthday_wish` | WhatsApp | Student + Parents |
| **General** | Event Invitation | `event_invitation` | WhatsApp | All Contacts |
| **General** | Feedback Request | `feedback_request` | WhatsApp | Decision Maker |

### Parent Notification Preferences (from DOC-05 Family Contacts)

```
Family Contact: Sunita Patel (Mother)
───────────────────────────────────────────────────────
Role Flags:
  ✅ Primary Contact
  ✅ Primary Fee Contact
  ❌ Primary Academic Contact → Set to Father instead
  ✅ Primary Decision Maker
  ❌ Emergency Contact

Channel Preferences:
  ✅ WhatsApp — Preferred
  ❌ SMS — Use only for emergencies
  ✅ Email — OK for monthly statements
  ✅ Push — App notifications

Time Preferences:
  ⏰ Preferred Time: 10:00 to 20:00
  🌙 Quiet Hours: 21:00 to 08:00 (no messages)

Language:
  🌐 Hindi (preferred), English (fallback)

Communication Categories:
  ✅ Financial — Allowed
  ✅ Academic — Allowed
  ✅ Emergency — Always allowed (bypasses quiet hours)
  ❌ Marketing — Opted out
```

---

## 14. Student Communication

### Purpose

Student communication targets the student directly (if they are old enough to have their own contact) or is routed through their Primary Academic Contact.

### Student Communication Matrix

| Category | Event | Template | Channel | Recipient |
|----------|-------|----------|---------|-----------|
| **Academics** | Class Timetable | `timetable_updated` | Push/In-App | Student |
| **Academics** | Homework Assigned | `homework_assigned` | Push/In-App | Student |
| **Academics** | Homework Due Tomorrow | `homework_reminder` | Push | Student |
| **Academics** | Exam Schedule | `exam_scheduled` | Push/In-App | Student |
| **Academics** | Exam Tomorrow | `exam_reminder` | Push | Student |
| **Academics** | Results Published | `result_published` | In-App | Student |
| **Academics** | Assignment Graded | `assignment_graded` | In-App | Student |
| **Attendance** | Attendance Low | `attendance_self_alert` | In-App/Push | Student |
| **General** | Achievement | `achievement_unlocked` | In-App | Student |
| **General** | Certificate Ready | `certificate_ready` | In-App | Student |
| **General** | Event Announcement | `event_announcement` | In-App | Student |
| **General** | Holiday Notice | `holiday_notice` | In-App | Student |
| **Placement** | Interview Scheduled | `interview_scheduled` | In-App | Student |
| **Placement** | Offer Received | `placement_offer` | In-App+P | Student+Parent |

---

## 15. Employee Communication

### Purpose

Employee communication targets internal users (staff, faculty, management) through workplace channels.

### Employee Communication Matrix

| Category | Event | Template | Channel | Recipient |
|----------|-------|----------|---------|-----------|
| **HR** | Payroll Processed | `payroll_processed` | In-App/Email | Employee |
| **HR** | Leave Approved | `leave_approved` | In-App | Employee |
| **HR** | Attendance Reminder | `attendance_reminder` | In-App | Employee |
| **HR** | Policy Update | `policy_update` | Email/In-App | All Employees |
| **Tasks** | Task Assigned | `task_assigned` | In-App/Push | Assignee |
| **Tasks** | Task Completed | `task_completed` | In-App | Owner |
| **Tasks** | Task Overdue | `task_overdue` | In-App/Slack | Assignee + Manager |
| **Approvals** | Approval Pending | `approval_pending` | In-App | Approver |
| **Approvals** | Approval Approved | `approval_approved` | In-App | Requester |
| **Approvals** | Approval Rejected | `approval_rejected` | In-App | Requester |
| **Approvals** | Approval Escalated | `approval_escalated` | In-App/Slack | Manager |
| **General** | Meeting Reminder | `meeting_reminder` | In-App/Push | Attendees |
| **General** | Announcement | `announcement` | In-App/Email | All |
| **General** | Emergency | `emergency_alert` | SMS/In-App | All |

---

## 16. Approval Communication

### Purpose

Approval notifications ensure that approvers are notified promptly and that requesters get status updates.

### Approval Notification Flow

```
                         APPROVAL FLOW
                         
Request Submitted
       │
       ▼
┌──────────────────────────────────────────────┐
│  Notification to Approver(s)                  │
│  ─────────────────────────────────           │
│  Channel: In-App (primary)                   │
│  Channel: WhatsApp (if enabled)              │
│  Template: approval_pending                  │
│  Content: "Amit Sharma requests ₹25,000      │
│            discount for Raj Patel"            │
└──────────────────────────────────────────────┘
       │
       ├── Approved ──► Notify Requester + CC
       │                 Template: approval_approved
       │
       ├── Rejected ──► Notify Requester + Reason
       │                 Template: approval_rejected
       │
       └── No Response (SLA Breach)
                         ──► Escalate to Fallback Approver
                             Template: approval_escalated
                      
SLA Config:
  ├── Priority: Critical → 2 hours
  ├── Priority: High → 4 hours
  ├── Priority: Medium → 24 hours
  └── Priority: Low → 48 hours
```

---

## 17. Notification Center

### Purpose

The Notification Center is a **unified inbox** for all in-app notifications. It is the central place where users see all their system notifications.

### Existing Implementation

The current system (`notifications.ts`) already implements:

- `listNotifications` — Query with unread filter and limit
- `getUnreadCount` — Total unread count
- `createNotification` — Create with userId, type, title, message
- `markAsRead` — Mark single notification as read
- `markAllAsRead` — Mark all as read for a user
- `deleteNotification` — Delete a notification

Current notification types (from schema):

| Type | Description |
|------|-------------|
| `task` | Task-related |
| `approval` | Approval-related |
| `message` | Direct message received |
| `mention` | User mentioned in channel |
| `announcement` | Organizational announcement |
| `payment` | Payment received/failed |
| `conversion` | Lead converted |
| `lead` | Lead assigned/updated |

### DOC-09 Extensions

| Feature | Description |
|---------|-------------|
| **Priority Levels** | Urgent / High / Normal / Low |
| **Notification Categories** | Filter by type (All, Tasks, Approvals, Payments, etc.) |
| **Pinned Notifications** | Important notices stay at top |
| **Archived Notifications** | Soft-delete with restore option |
| **Notification Groups** | Group related notifications (e.g., 5 approval requests) |
| **Rich Notifications** | Include action buttons (Approve, Reject, View) |
| **Snooze** | Temporarily hide notifications |
| **Search** | Full-text search in notification history |
| **Export** | Download notification history as CSV |

### Notification Center UI Mockup

```
┌───────────────────────────────────────────────────────────┐
│  🔔 NOTIFICATIONS                                  12 unread │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [All] [Tasks] [Approvals] [Payments] [System] ... │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 🔴 PENDING APPROVAL                                │   │
│  │ Amit Sharma requests ₹25,000 discount for Raj Patel │   │
│  │ 5 minutes ago · Finance                             │   │
│  │ [Approve] [Reject] [View Details]                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 📅 TASK OVERDUE                                    │   │
│  │ Parent meeting for Priya Sharma is overdue by 2d    │   │
│  │ 2 hours ago · Tasks                                 │   │
│  │ [Mark Complete] [View Task]                        │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 💰 PAYMENT RECEIVED                                │   │
│  │ ₹10,660 received from Sunita Patel (UPI)           │   │
│  │ 1 day ago · Finance                                │   │
│  │ [View Receipt]                                    │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 📋 TASK ASSIGNED                                   │   │
│  │ Follow up with Vikram Joshi regarding fee payment  │   │
│  │ 2 days ago · Tasks                                 │   │
│  │ [Mark Complete] [View Task] [Reassign]             │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ 🎉 LEAD CONVERTED                                  │   │
│  │ Raj Patel has been converted to admission          │   │
│  │ 3 days ago · CRM                                   │   │
│  │ [View Admission]                                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ── 3 older notifications ──                              │
└───────────────────────────────────────────────────────────┘
```

---

## 18. Communication Analytics

### Key Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Messages Sent** | Total outbound messages | Count |
| **Delivery Rate** | Successfully delivered | Delivered ÷ Sent × 100 |
| **Read Rate** | Messages opened/read | Read ÷ Delivered × 100 |
| **Reply Rate** | Messages that got a reply | Replied ÷ Delivered × 100 |
| **Failure Rate** | Messages that failed | Failed ÷ Sent × 100 |
| **Avg Response Time** | Time from sent to reply | Average(readAt − sentAt) |
| **Channel Distribution** | Usage by channel | Per-channel count ÷ Total |
| **Cost Per Message** | Average cost | Total cost ÷ Total sent |
| **Opt-Out Rate** | Users opting out | Opt-outs ÷ Total recipients |

### Analytics Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  📊 COMMUNICATION ANALYTICS — Last 30 Days                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ ✉️ Messages  │  │ ✅ Delivery  │  │ 👁️ Read Rate │   │
│  │   12,847     │  │   94.2%      │  │   78.5%       │   │
│  │   📈 +15%    │  │   📈 +2%     │  │   📊 -1%      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 💬 Reply Rate│  │ 💰 Total Cost│  │ 📉 Fail Rate │   │
│  │   12.3%      │  │   ₹2,847    │  │   5.8%        │   │
│  │   📈 +3%     │  │   📈 +12%   │  │   📉 -1%      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  CHANNEL DISTRIBUTION                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ WhatsApp ████████████████████████████  72%          │  │
│  │ In-App   ██████████                     18%         │  │
│  │ SMS      ███                             5%         │  │
│  │ Email    ██                              4%         │  │
│  │ Push     ▏                              1%         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  DELIVERY TREND (Last 7 Days)                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Sent    ████████████████████████████████████  428  │  │
│  │  Deliv. ██████████████████████████████████    403  │  │
│  │  Read   ████████████████████████████          316  │  │
│  │  Repl.  ███████                              53   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  TOP TEMPLATES BY USAGE                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1. payment_reminder_3d        1,847 sends  94.2%    │  │
│  │ 2. payment_receipt            1,234 sends  96.8%    │  │
│  │ 3. attendance_low             892 sends    91.5%    │  │
│  │ 4. task_assigned              756 sends    98.2%    │  │
│  │ 5. approval_pending           534 sends    99.1%    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 19. AI Opportunities

### 1. Best Time to Send

```
AI predicts the optimal send time for each recipient based on:

  Historical Data:
    ├── When has this recipient opened messages in the past?
    ├── What time of day has highest read rate?
    ├── What day of week has highest engagement?
    └── Are there seasonal patterns?

  Example:
    Contact: Sunita Patel
    Best Time: 10:30 AM — Weekdays (92% open rate)
    Worst Time: After 8 PM — Weekdays (12% open rate)
    Recommendation: Schedule reminders for 10:00-11:00 AM
```

### 2. Best Channel Prediction

```
AI selects the optimal channel for each message:

  Factors:
    ├── Past channel engagement per contact
    ├── Message urgency
    ├── Message content length
    └── Current channel health (delivery rates)

  Example:
    Message Type: Payment Reminder
    Contact: Sunita Patel
    
    Channel Scores:
      WhatsApp: 92 (high engagement, preferred)
      SMS:      45 (low engagement, expensive)
      Email:    68 (moderate engagement)
      Push:     32 (not installed)
    
    Recommendation: Send via WhatsApp
```

### 3. Auto Language Detection

```
AI detects recipient's preferred language:

  Signals:
    ├── Contact's preferred language setting
    ├── Past reply language
    ├── Location/branch language
    └── Name-based language inference

  Example:
    Contact: Sunita Patel
    Detected: Hindi (from preference setting)
    Fallback: English
    
    Output: Use Hindi template (hi)
    If Hindi template not available → Fallback to English
```

### 4. Smart Follow-up

```
AI decides follow-up timing and content:

  If no response after:
    ├── 24h → Send gentle reminder (different template)
    ├── 72h → Change channel (WhatsApp → SMS)
    ├── 7d  → Escalate to different contact
    └── 14d → Alert module owner

  Example:
    Message: Payment Reminder (Sent via WhatsApp)
    Status: Delivered but not read after 24h
    
    AI Action:
      1. Wait 24h
      2. Resend via WhatsApp with different template
      3. If still unread after 48h → Forward to Decision Maker
      4. If no response after 7d → Create task for counsellor
```

### 5. Auto Reply Suggestion

```
AI suggests replies for incoming messages:

  Incoming: "I will pay tomorrow"
  AI Suggestions:
    ├── "Thank you! Please use this link to pay: [Link]"
    ├── "Would you like to set up auto-pay?"
    └── "Your next installment is due on 01-Nov. Shall I send a reminder?"

  Incoming: "My son is sick, won't come today"
  AI Suggestions:
    ├── "I hope he feels better soon. I'll mark his absence."
    ├── "Would you like to request leave for tomorrow too?"
    └── "Shall I send the homework assignments?"
```

### 6. Conversation Summary

```
AI summarizes long communication threads:

  Original: 47 messages between parent, counsellor, and finance team
  AI Summary:
    ┌────────────────────────────────────────────────┐
    │ 📋 Conversation Summary — Raj Patel Fee Issue   │
    │                                                 │
    │ Subject: Fee payment delay                      │
    │ Duration: 12-Oct to 15-Oct (5 days)            │
    │ Participants: Sunita Patel, Rajesh Mehta,       │
    │               Finance Team                      │
    │                                                 │
    │ Key Points:                                     │
    │ 1. Parent requested 15-day extension            │
    │ 2. Counsellor approved extension                │
    │ 3. Finance team agreed with late fee waiver     │
    │ 4. New due date: 30-Oct-2026                    │
    │                                                 │
    │ Action Items:                                   │
    │ ☐ Send revised invoice (Finance)                │
    │ ☐ Add note to student timeline (Counsellor)     │
    └────────────────────────────────────────────────┘
```

### 7. Sentiment Analysis

```
AI analyzes sentiment of incoming messages:

  Message: "I am very unhappy with the service. No one called me back!"
  Sentiment: Negative (Score: 0.12)
  Urgency: High
  Action: Flag for supervisor, do not auto-reply

  Message: "Thank you for the quick response. Payment done!"
  Sentiment: Positive (Score: 0.89)
  Urgency: Low
  Action: Auto-reply with thank you + next steps
```

### 8. Escalation Detection

```
AI detects when a conversation should be escalated:

  Triggers:
    ├── Negative sentiment in 3+ consecutive messages
    ├── Mentions "manager", "complaint", "legal"
    ├── Same issue raised 3+ times
    ├── Payment dispute unresolved for 7+ days
    └── Contact requests escalation explicitly

  Example:
    Detected: Parent has sent 5 messages about fee error
    Sentiment: Decreasing (0.7 → 0.4 → 0.3 → 0.2 → 0.1)
    Contains: "I want to speak to the manager"
    
    Action: Auto-escalate to Senior Counsellor
    Priority: High
    Suggested Response: "I understand your frustration.
    I've escalated this to our senior team member,
    Ananya Sharma, who will call you within 2 hours."
```

### 9. Communication Health Score

```
AI calculates a communication health score per student/lead:

  Student: Raj Patel
  ───────────────────────────────────────────────────────
  Communication Health Score: 85/100 🟢
  
  Factors:
    ├── Response Rate: 92% (Excellent)
    ├── Avg Response Time: 15 min (Excellent)
    ├── Sentiment Trend: Positive ↔ Stable
    ├── Channel Engagement: WhatsApp (High), Email (Medium)
    ├── Opt-Out Status: Not opted out
    └── Unresolved Issues: 0
  
  Recommendation: Low-touch communication. Auto-reminders sufficient.
```

---

## 20. External Integrations

### Integration Architecture

```
┌───────────────────────────────────────────────┐
│           COMMUNICATION ENGINE                  │
│                                                  │
│   ┌─────────────────────────────────────────┐   │
│   │         CHANNEL PROVIDER LAYER            │   │
│   │                                           │   │
│   │  ┌────────┐ ┌────────┐ ┌────────┐        │   │
│   │  │Twilio  │ │MSG91   │ │WhatsApp│        │   │
│   │  │(SMS)   │ │(SMS)   │ │Biz API │        │   │
│   │  └────────┘ └────────┘ └────────┘        │   │
│   │                                           │   │
│   │  ┌────────┐ ┌────────┐ ┌────────┐        │   │
│   │  │SendGrid│ │AWS SES │ │Firebase│        │   │
│   │  │(Email) │ │(Email) │ │(Push)  │        │   │
│   │  └────────┘ └────────┘ └────────┘        │   │
│   │                                           │   │
│   │  ┌────────┐ ┌────────┐ ┌────────┐        │   │
│   │  │OneSi-  │ │Slack   │ │MS Teams│        │   │
│   │  │gnal    │ │(Chat)  │ │(Chat)  │        │   │
│   │  └────────┘ └────────┘ └────────┘        │   │
│   └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

### Provider Details

| Provider | Service | Channel | Features | Setup |
|----------|---------|---------|----------|-------|
| **WhatsApp Business API** | Meta | WhatsApp | Templates, buttons, media, read receipts, replies | WABA account, template approval |
| **Twilio** | Twilio | SMS, Voice, WhatsApp | Global SMS, number pooling, delivery receipts | API key, sender ID |
| **MSG91** | MSG91 | SMS, WhatsApp | India-focused, transactional routes, DLT registration | DLT approved templates, API key |
| **SendGrid** | Twilio | Email | Templates, analytics, suppression management | API key, sender verification |
| **AWS SES** | Amazon | Email | High volume, cheap, DKIM/SPF | Domain verification |
| **Firebase Cloud Messaging** | Google | Push, In-App | Free, Android/iOS/Web, topic messaging | Firebase project, server key |
| **OneSignal** | OneSignal | Push, In-App, Email | Segmentation, A/B testing, analytics | App ID, API key |
| **Slack Webhooks** | Slack | Chat | Incoming webhooks, channel targeting | Webhook URL |
| **Microsoft Teams** | Microsoft | Chat | Incoming webhooks, adaptive cards | Webhook URL |
| **Zapier** | Zapier | Webhook | Low-code integrations, 5000+ apps | Zapier account |
| **Custom Webhooks** | — | Webhook | POST to any URL, JSON payload | Target URL, secret |

### Provider Abstraction

```
// All providers implement this interface:
interface ChannelProvider {
  name: string;
  channel: ChannelType;
  
  send(message: OutboundMessage): Promise<SendResult>;
  getStatus(messageId: string): Promise<DeliveryStatus>;
  getWebhookHandler(): (req: Request) => Promise<void>;
  validateCredentials(): Promise<boolean>;
}

// Adding a new provider:
class TwilioSMSProvider implements ChannelProvider { ... }
class SendGridEmailProvider implements ChannelProvider { ... }

// Communication Engine uses providers via factory:
const provider = ProviderFactory.getProvider("sms", "twilio");
const result = await provider.send(message);
```

### Design Rules

- All provider credentials are stored in Convex environment variables
- Provider switching requires zero code changes (configuration only)
- Each channel has a primary and fallback provider
- Provider health is monitored (downtime triggers fallback)
- All provider interactions are logged for debugging

---

## 21. Security & Compliance

### Consent Management

```
CONSENT RECORD
═══════════════════════════════════════════════════════
Contact: Sunita Patel
Contact ID: fc_abc123
Entity: Family Contact

Consent Status:
  ┌──────────────────────┬──────────┬──────────┐
  │ Category             │ Status   │ Date     │
  ├──────────────────────┼──────────┼──────────┤
  │ Transactional Msgs   │ ✅ Opted │ 01-Aug-26│
  │ Promotional Msgs     │ ❌ Opted │ 01-Aug-26│
  │ WhatsApp             │ ✅ Opted │ 01-Aug-26│
  │ SMS                  │ ❌ Opted │ 01-Aug-26│
  │ Email                │ ✅ Opted │ 01-Aug-26│
  │ Calls                │ ✅ Opted │ 01-Aug-26│
  └──────────────────────┴──────────┴──────────┘

Consent History:
  01-Aug-26: Opted in (Transactional, WhatsApp, Email) — Via Portal
  01-Aug-26: Opted out (Promotional, SMS) — Via Portal
  15-Sep-26: Changed WhatsApp preference — Via WhatsApp "STOP"
  
Consent Method:
  Source: Parent Portal Self-Service
  IP: 192.168.1.100
  User Agent: Chrome 120 on Android
```

### Opt-Out Handling

```
Global Opt-Out:
  └── Contact replies "STOP" to WhatsApp
  └── Contact clicks "Unsubscribe" in email
  └── Contact toggles off in Portal
  └── All channels blocked for promotional messages

Channel-Specific Opt-Out:
  └── "STOP SMS" → Only SMS blocked
  └── "STOP CALL" → Only calls blocked
  
Re-Opt-In:
  └── Contact can opt back in via portal or by contacting support
  └── Opt-out is respected for 1 year minimum
  
Transactional Exemption:
  └── Opt-out does NOT apply to transactional messages
  └── Examples: Payment receipts, attendance alerts, emergency
```

### Data Privacy

| Requirement | Implementation |
|-------------|----------------|
| **GDPR Compliance** | Consent records stored with timestamp and source |
| **Right to Erasure** | Full communication history can be anonymized |
| **Data Retention** | Communication logs retained for 3 years, then anonymized |
| **Encryption at Rest** | All communication logs encrypted at database level |
| **Encryption in Transit** | All API calls use TLS 1.2+ |
| **Access Control** | Communication logs visible only to authorized roles |
| **Audit Trail** | All accesses to communication logs are recorded |
| **PII Masking** | Phone numbers and emails masked in analytics views |

### Audit Logging

```
AUDIT LOG ENTRY
═══════════════════════════════════════════════════════
Action: Communication Sent
Timestamp: 2026-10-01 10:32:15 UTC
User: system (automation)
Module: finance
Event: payment.overdue

Message Details:
  └── Recipient: Sunita Patel (fc_abc123)
  └── Channel: WhatsApp
  └── Template: payment_overdue
  └── Status: Sent
  └── Provider: WhatsApp Business API
  └── Provider ID: wamid.abc123xyz
```

---

## 22. Implementation Roadmap

### Phase 1 — Template Engine (P0)

**Estimated effort:** 4-5 days  
**Dependencies:** None

**Tasks:**
- [ ] Create `communicationTemplates` table in schema
- [ ] Template CRUD (list, get, create, update, delete, duplicate)
- [ ] Multi-language support per template
- [ ] Template variable validation
- [ ] Template approval workflow
- [ ] Template management UI

### Phase 2 — Recipient Resolver (P0)

**Estimated effort:** 3-4 days  
**Dependencies:** Lead V2 Phase 3 (Family Contacts)

**Tasks:**
- [ ] Create recipient resolution service
- [ ] Family Contact role-based lookups
- [ ] User Directory role-based lookups
- [ ] Multi-recipient support (TO, CC, BCC)
- [ ] Contact preference resolution (channel, language, time)

### Phase 3 — Notification Center Enhancement (P0)

**Estimated effort:** 3-4 days  
**Dependencies:** Existing `notifications` table

**Tasks:**
- [ ] Add priority levels to notifications
- [ ] Add notification categories/groups
- [ ] Add action buttons to notifications
- [ ] Add notification search
- [ ] Add notification export
- [ ] Enhanced notification UI with filters and groups

### Phase 4 — WhatsApp Enhancement (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, Phase 2

**Tasks:**
- [ ] Upgrade existing WhatsApp sender to template-first architecture
- [ ] Template variable substitution
- [ ] Delivery status tracking (sent, delivered, read, replied)
- [ ] WhatsApp webhook handling (inbound messages, status callbacks)
- [ ] Send cooldown and rate limiting
- [ ] Media and document sending

### Phase 5 — Email Integration (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, Phase 2

**Tasks:**
- [ ] Integrate SendGrid or AWS SES
- [ ] Email template engine (HTML templates)
- [ ] Attachment support (PDF invoices, receipts)
- [ ] Delivery tracking (opens, clicks, bounces)
- [ ] Email branding (header, footer, logo)

### Phase 6 — SMS Integration (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Phase 2

**Tasks:**
- [ ] Integrate Twilio or MSG91
- [ ] SMS-specific template handling (plain text, 160 chars)
- [ ] Delivery status tracking
- [ ] DLT compliance (for India)
- [ ] SMS fallback in automation rules

### Phase 7 — Push Notification Integration (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Phase 2

**Tasks:**
- [ ] Integrate Firebase Cloud Messaging
- [ ] Push notification templates
- [ ] Device token management
- [ ] Topic-based subscriptions
- [ ] Silent notifications for data sync

### Phase 8 — Event Engine & Automation Rules (P2)

**Estimated effort:** 5-6 days  
**Dependencies:** All Phases 1-7

**Tasks:**
- [ ] Standardized event format
- [ ] Event bus / pub-sub mechanism
- [ ] Automation rules table and CRUD
- [ ] Rule matching engine (event → template → channel → recipient)
- [ ] Conditional logic in rules
- [ ] Rule management UI

### Phase 9 — Scheduling Engine (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 8

**Tasks:**
- [ ] Scheduling queue
- [ ] Immediate, scheduled, recurring delivery
- [ ] Quiet hours and timezone handling
- [ ] Holiday calendar integration
- [ ] Digest/batched delivery
- [ ] Scheduling management UI

### Phase 10 — Communication Timeline & Analytics (P2)

**Estimated effort:** 5-6 days  
**Dependencies:** All Phases 1-9

**Tasks:**
- [ ] Unified communication log table
- [ ] Status history tracking
- [ ] Entity-specific timeline view
- [ ] Communication analytics dashboard
- [ ] Channel performance metrics
- [ ] Export and reporting

### Phase 11 — Marketing Engine (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 8, Phase 9

**Tasks:**
- [ ] Campaign CRUD
- [ ] Segment definitions and queries
- [ ] Bulk send with rate limiting
- [ ] Campaign analytics (sent, delivered, clicked, converted)
- [ ] A/B testing (template, channel, time)
- [ ] Consent management UI

### Phase 12 — Consent & Compliance (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Consent records table
- [ ] Opt-in/opt-out workflow across all channels
- [ ] Global opt-out handling
- [ ] Consent history and audit trail
- [ ] GDPR compliance tools (data export, erasure)

### Phase 13 — AI Communication (P3)

**Estimated effort:** 10-12 days  
**Dependencies:** All Phases, AI Infrastructure

**Tasks:**
- [ ] Best time to send ML model
- [ ] Best channel prediction
- [ ] Auto language detection
- [ ] Smart follow-up engine
- [ ] Auto reply suggestion
- [ ] Sentiment analysis
- [ ] Escalation detection

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Template Engine | P0 | 5d | Low | Critical |
| 2. Recipient Resolver | P0 | 4d | Low | Critical |
| 3. Notification Enhancement | P0 | 4d | Low | High |
| 4. WhatsApp Enhancement | P1 | 5d | Medium | High |
| 5. Email Integration | P1 | 5d | Medium | High |
| 6. SMS Integration | P1 | 4d | Medium | High |
| 7. Push Integration | P2 | 4d | Medium | Medium |
| 8. Event Engine & Rules | P2 | 6d | High | Critical |
| 9. Scheduling Engine | P2 | 5d | Medium | High |
| 10. Timeline & Analytics | P2 | 6d | Medium | High |
| 11. Marketing Engine | P2 | 5d | Medium | High |
| 12. Consent & Compliance | P2 | 4d | Low | High |
| 13. AI Communication | P3 | 12d | High | Medium |

---

## 23. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║         COMMUNICATION & NOTIFICATION ENGINE GOLDEN RULES      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Business modules NEVER send messages.                   ║
║      └── Modules raise events. Communication delivers.        ║
║                                                              ║
║  2.  Communication NEVER stores business data.                ║
║      └── Phone numbers, emails live in Family Contacts        ║
║      or User Directory.                                      ║
║                                                              ║
║  3.  Every message is logged.                                ║
║      └── No untracked communications. Ever.                   ║
║                                                              ║
║  4.  Every delivery is trackable.                             ║
║      └── Queued → Sent → Delivered → Read for every msg.     ║
║                                                              ║
║  5.  Templates are reusable across modules.                  ║
║      └── One "reminder" template serves Finance,             ║
║      Attendance, and Exams.                                  ║
║                                                              ║
║  6.  Channels are pluggable and interchangeable.             ║
║      └── Adding a channel requires zero business logic       ║
║      changes.                                                ║
║                                                              ║
║  7.  Recipients come from Family Contacts or User Directory.  ║
║      └── No hard-coded phone numbers anywhere in code.        ║
║                                                              ║
║  8.  Consent is mandatory for marketing.                     ║
║      └── Transactional messages are exempt.                   ║
║      Opt-out is immediate and global.                        ║
║                                                              ║
║  9.  Every message belongs to a business event.              ║
║      └── No orphan messages. Every send has a reason.         ║
║                                                              ║
║ 10.  One Communication Engine.                               ║
║      └── CRM, Finance, Academics, HR all use the same        ║
║      engine. No exceptions.                                  ║
║                                                              ║
║ 11.  Templates are approved before use.                      ║
║      └── No unapproved templates in production.               ║
║                                                              ║
║ 12.  Communication uses roles, not names.                    ║
║      └── "Primary Fee Contact" not "Sunita Patel".           ║
║      Resolver maps roles to actual people.                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Module |
|--------|-----------|--------|-------|--------|
| Communication Template | `communicationTemplates` | 🔶 New | Phase 1 | Communication |
| Automation Rule | `automationRules` | 🔶 New | Phase 8 | Communication |
| Communication Log | `communicationLog` | 🔶 New | Phase 10 | Communication |
| Campaign | `campaigns` | 🔶 New | Phase 11 | Communication |
| Campaign Segment | `campaignSegments` | 🔶 New | Phase 11 | Communication |
| Consent Record | `consentRecords` | 🔶 New | Phase 12 | Communication |
| Family Contact (Lead V2) | `familyContacts` | 🔶 Future | Phase 2 | CRM |
| WhatsApp Message | `leadWhatsAppMessages` | ✅ Existing | Phase 4 | CRM/Communication |
| Notification | `notifications` | ✅ Existing | Phase 3 | Communication |
| Channel | `channels` | ✅ Existing | N/A | Messenger |
| Channel Member | `channelMembers` | ✅ Existing | N/A | Messenger |
| Message | `messages` | ✅ Existing | N/A | Messenger |
| Direct Message | `directMessages` | ✅ Existing | N/A | Messenger |

## Appendix B: Event → Action Flow

```
Event Raised
  │
  ├── Recipient Resolver Activated
  │     └── Find contacts by entity + role
  │
  ├── Template Engine Activated  
  │     └── Select template by event + channel + language
  │     └── Substitute variables
  │
  ├── Channel Router Activated
  │     └── Select primary channel by recipient preference
  │     └── Prepare fallback chain
  │
  ├── Scheduling Engine Activated
  │     └── Determine send time (immediate/scheduled/delayed)
  │
  ├── Consent Check
  │     └── Verify recipient has not opted out of this category
  │
  ├── Rate Limiter Check
  │     └── Verify within channel rate limits
  │
  ├── Send via Provider
  │     └── Attempt primary channel
  │     └── Fallback to next channel on failure
  │
  ├── Status Update
  │     └── Log in Communication Timeline
  │     └── Update delivery status (queued → sent → delivered → read)
  │
  └── Analytics Pipeline
        └── Update aggregate metrics
```

## Appendix C: Existing Code Integration Points

| Existing File | What It Does | DOC-09 Integration |
|---------------|-------------|-------------------|
| `crmWhatsApp.ts` | Send WhatsApp, get messages | Phase 4 — Upgrade to template+event architecture |
| `notifications.ts` | In-app notification CRUD | Phase 3 — Add priorities, groups, actions |
| `messenger.ts` | Channels, DMs, announcements | N/A — Internal chat (separate concern) |
| `crmHelpers.ts` | `logActivity` timeline helper | Phase 10 — Communication logs feed entity timelines |

---

*End of DOC-09 — Communication & Notification Engine Bible*
