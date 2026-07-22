# DOC-22 — EEOS Core Platform Engines & Shared Services Bible

> **Version**: 1.0  
> **Status**: Architecture Blueprint  
> **Owner**: EEOS Architecture Team  
> **Last Updated**: 2026-07-14  
> **Suggested Path**: `04-Platform/DOC-22 — EEOS Core Platform Engines & Shared Services Bible.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Platform Architecture Overview](#2-platform-architecture-overview)
3. [Engine Inventory](#3-engine-inventory)
4. [Engine Dependency Matrix](#4-engine-dependency-matrix)
5. [Module Dependency Matrix](#5-module-dependency-matrix)
6. [Database Blueprint](#6-database-blueprint)
7. [Event Architecture](#7-event-architecture)
8. [API Architecture](#8-api-architecture)
9. [Security](#9-security)
10. [Performance](#10-performance)
11. [AI Readiness](#11-ai-readiness)
12. [Development Roadmap](#12-development-roadmap)
13. [Golden Rules](#13-golden-rules)

---

## 1. Purpose

### Why Engine-Driven?

EEOS is **engine-driven, not module-driven**. This is the single most important architectural decision in the platform.

A module-driven architecture creates silos. CRM has its own notification system. Finance has its own approval system. HR has its own document storage. The result is:

- Duplicate code
- Inconsistent user experience
- Fragmented data
- Expensive maintenance
- Impossible cross-module reporting

An **engine-driven architecture** solves all of this by extracting shared capabilities into reusable platform engines. Every module consumes the same engines. Every feature benefits from improvements to any engine.

### Benefits

**Reusability**: Build once, use everywhere. The Notification Engine powers CRM follow-ups, Finance reminders, HR alerts, and Academic announcements — from a single codebase.

**Scalability**: Engines can be optimized independently. Cache the Sequence Engine. Queue the Notification Engine. Index the Search Engine independently of any module.

**Maintainability**: Fix a bug in the Activity Engine once. Every module that uses activities gets the fix automatically. No hunting through 12 modules for the same pattern.

**Low Code Future**: Configuration-driven engines mean business users can define workflows, approvals, notifications, and reports without developer intervention. Every engine exposes a configuration surface.

**AI Readiness**: Every engine emits structured events and exposes clean APIs. The future AI Engine consumes these events to train models, predict outcomes, recommend actions, and automate decisions. Without engines, AI has no clean data to consume.

**Audit & Compliance**: A single Audit Engine tracks every change across every module. No module can bypass auditing. Compliance reporting is a simple query against one table.

### Design Philosophy

> Every shared capability is an engine. Every engine has one responsibility. Every module uses engines. No engine knows about modules.

---

## 2. Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          UI LAYER                            │
│    React 19 · Tailwind · shadcn/ui · Framer Motion          │
│    DashboardLayout · StudioLayout · CommandPalette           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       STUDIOS                                 │
│  Organization │ Master Data │ Access Control │ Workflow     │
│  Task Mgmt    │ Settings    │ Analytics                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    BUSINESS MODULES                           │
│  CRM │ Sales │ Admissions │ Student │ Academic │ Finance     │
│  HR  │ Marketing │ Admin │ Technology │ Communication        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     SHARED ENGINES                            │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Sequence │  │ Activity │  │Notificatn│  │Attachmnt │    │
│  │  Engine  │  │  Engine  │  │  Engine  │  │  Engine  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Comment  │  │ Timeline │  │  Audit   │  │ Approval │    │
│  │  Engine  │  │  Engine  │  │  Engine  │  │  Engine  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Workflow │  │  Search  │  │   Tag    │  │  Label   │    │
│  │  Engine  │  │  Engine  │  │  Engine  │  │  Engine  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Template │  │ Communic │  │ Calendar │  │ Reminder │    │
│  │  Engine  │  │  Engine  │  │  Engine  │  │  Engine  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Reporting │  │Dashboard │  │Import/Exp│  │  File    │    │
│  │  Engine  │  │  Engine  │  │  Engine  │  │ Storage  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────┐  ┌──────────┐                                   │
│  │Integratn │  │    AI    │                                   │
│  │  Engine  │  │  Engine  │  (Future)                         │
│  └──────────┘  └──────────┘                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    INFRASTRUCTURE                             │
│  Convex (DB/Backend) · Auth · File Storage · Email · SMS    │
│  Webhooks · Queues · Caching · Search Index                  │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Flow

```
UI Layer → Studios → Business Modules → Shared Engines → Infrastructure
```

Studios call business modules. Business modules call shared engines. Shared engines call infrastructure. Dependencies flow downward. No module depends on another module. No studio depends on another studio.

---

## 3. Engine Inventory

---

### 3.1 Sequence Engine

**Priority**: P0 — Foundation

**Purpose**: Automatic, configurable numbering for all business entities. Every document, record, and identifier that requires a human-readable number must use this engine. No module creates its own numbering.

**Responsibilities**:
- Generate sequential numbers with configurable prefixes
- Support per-entity, per-branch, and per-year sequences
- Reset sequences annually, monthly, or never (configurable)
- Format: `{PREFIX}-{YYYY}-{NNNNNN}` or custom
- Prevent gaps (no skipped numbers on rollback)
- Validate uniqueness within scope

**Consumers**:
- CRM (Lead numbers)
- Admissions (Registration numbers, Enrollment IDs)
- Student (Student IDs)
- Finance (Invoice numbers, Receipt numbers, Voucher numbers)
- HR (Employee codes)
- Tasks (Task IDs)
- Academic (Certificate numbers)
- All modules that need sequential identifiers

**Database Entities**:
```
sequences
├── id
├── entityType (string) — e.g. "lead", "invoice", "student"
├── prefix (string) — e.g. "LD", "INV", "STU"
├── branchId (optional id) — branch-scoped sequences
├── academicSessionId (optional id) — session-scoped sequences
├── year (number) — current year for reset
├── counter (number) — current counter value
├── format (string) — template like "{prefix}-{year}-{counter:06d}"
├── resetFrequency (enum: "annual" | "monthly" | "never")
└── isActive (boolean)

sequence_history
├── id
├── sequenceId (id)
├── generatedNumber (string)
├── entityId (id)
├── generatedAt (timestamp)
└── generatedBy (id)
```

**APIs**:
```
generateNumber(entityType, scope?) → string
previewNextNumber(entityType, scope?) → string
getLastNumber(entityType, scope?) → string
```

**Events**:
```
sequence.number_generated
  ├── entityType
  ├── generatedNumber
  └── entityId
```

**Dependencies**: None (foundation engine)

**Future Expansion**:
- Custom format templates per entity type
- User-defined prefix overrides
- Branch-aware auto-configuration

---

### 3.2 Activity Engine

**Priority**: P0 — Foundation

**Purpose**: Unified activity timeline for every entity in the system. No module creates its own activity system. Every CRM call, every admission status change, every payment, every task completion — all flow through this single engine.

**Responsibilities**:
- Record every significant action on any entity
- Support activity types (call, email, note, status_change, system, etc.)
- Store metadata (duration, outcome, attachments, etc.)
- Provide unified timeline API sorted by time
- Support filtering by entity, user, type, date range
- Support pagination for infinite scroll

**Consumers**: Every module. CRM, Sales, Admissions, Student, Academic, Finance, HR, Tasks, Workflow, Communication.

**Database Entities**:
```
activities
├── id
├── entityType (string) — polymorphic: "lead", "student", "invoice", etc.
├── entityId (id)
├── activityType (string) — "call", "email", "note", "status_change", "system", "task", "payment", "meeting", etc.
├── title (string)
├── description (text, optional)
├── userId (id) — who performed the activity
├── metadata (JSON, optional) — flexible payload
├── isSystem (boolean) — auto-generated vs user-created
├── parentId (optional id) — for threading
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_entity (entityType, entityId, createdAt)
├── by_user (userId, createdAt)
├── by_type (entityType, activityType, createdAt)
└── by_date (createdAt)
```

**APIs**:
```
logActivity(entityType, entityId, activityType, title, description?, metadata?) → id
getActivities(entityType, entityId, filters?, pagination?) → Activity[]
getRecentActivities(userId, limit?) → Activity[]
getActivityFeed(entityIds[], filters?, pagination?) → Activity[]
```

**Events**:
```
activity.created
  ├── entityType
  ├── entityId
  ├── activityType
  ├── userId
  └── metadata
```

**Dependencies**: None (foundation engine)

**Future Expansion**:
- Activity reactions (👍, ❤️, etc.)
- Activity pinning
- Activity templates for common actions
- Bulk activity import

---

### 3.3 Notification Engine

**Priority**: P0 — Foundation

**Purpose**: Universal notification delivery across all channels. Every module that needs to notify users — CRM follow-ups, payment reminders, approval requests, task assignments, system alerts — uses this single engine.

**Responsibilities**:
- Deliver notifications via In-App, Email, WhatsApp, SMS, and Push
- Support notification templates
- Support scheduling (send at a specific time)
- Support batching (digest mode)
- Track delivery status (sent, delivered, read, failed)
- Manage unsubscribe preferences per channel
- Rate-limit per channel per user
- Support broadcast and targeted delivery

**Consumers**: CRM, Sales, Admissions, Student, Academic, Finance, HR, Marketing, Administration, Tasks, Workflow, System.

**Database Entities**:
```
notification_templates
├── id
├── code (string) — unique identifier
├── name (string)
├── channels (array[enum]) — ["in_app", "email", "whatsapp", "sms", "push"]
├── subject (string, optional) — for email/push
├── body (text) — with variable placeholders
├── variables (JSON) — list of expected variables
├── isActive (boolean)
├── createdBy (id)
├── createdAt (timestamp)
└── updatedAt (timestamp)

notifications
├── id
├── templateId (optional id)
├── type (enum) — "direct", "broadcast", "scheduled", "trigger"
├── title (string)
├── body (text)
├── senderId (optional id) — who sent it
├── recipientId (id) — who receives it (null for broadcast)
├── channel (enum) — "in_app", "email", "whatsapp", "sms", "push"
├── entityType (optional string) — related entity
├── entityId (optional id)
├── actionUrl (optional string) — deep link
├── status (enum) — "pending", "sent", "delivered", "read", "failed"
├── scheduledAt (optional timestamp)
├── sentAt (optional timestamp)
├── readAt (optional timestamp)
├── failedAt (optional timestamp)
├── failureReason (optional string)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_recipient (recipientId, status, createdAt)
├── by_entity (entityType, entityId)
├── by_status (status, scheduledAt)
├── by_channel (channel, status)
└── by_date (createdAt)

notification_preferences
├── id
├── userId (id)
├── channel (enum)
├── isEnabled (boolean)
├── digestFrequency (enum: "none", "daily", "weekly")
└── quietHours (JSON, optional)
```

**APIs**:
```
sendNotification(recipientId, title, body, channel?, entityType?, entityId?) → id
sendNotificationFromTemplate(templateCode, recipientId, variables, entity?) → id
sendBroadcast(title, body, channel, filters?) → id[]
sendScheduledNotification(recipientId, title, body, scheduledAt) → id
getNotifications(userId, filters?, pagination?) → Notification[]
markAsRead(notificationId) → void
markAllAsRead(userId) → void
getUnreadCount(userId) → number
updatePreferences(userId, preferences) → void
```

**Events**:
```
notification.sent
  ├── notificationId
  ├── recipientId
  ├── channel
  └── status

notification.delivered
  ├── notificationId
  └── timestamp

notification.read
  ├── notificationId
  └── timestamp

notification.failed
  ├── notificationId
  ├── channel
  └── reason
```

**Dependencies**: Template Engine (for templates), Activity Engine (log notifications as activities)

**Future Expansion**:
- Voice calls via Twilio/Vonage
- Interactive notifications (buttons, actions)
- Notification analytics dashboard
- AI-optimized send time
- Multi-language notification templates

---

### 3.4 Attachment Engine

**Priority**: P0 — Foundation

**Purpose**: Reusable document management for every entity. No module implements its own file upload. Every document — lead documents, student certificates, invoice PDFs, employee contracts, task attachments — is stored and managed by this engine.

**Responsibilities**:
- Upload, store, and serve files
- Generate previews (thumbnails for images, first page for PDFs)
- Support versioning (multiple versions of the same document)
- Support categorization (document types)
- Enforce file size limits and allowed types
- Scan for viruses (future)
- OCR support (future)
- Storage abstraction (local, S3, GCS, Azure)

**Consumers**: Every module.

**Database Entities**:
```
attachments
├── id
├── entityType (string) — polymorphic
├── entityId (id)
├── category (optional string) — "photo", "id_proof", "certificate", "contract", etc.
├── fileName (string)
├── originalName (string)
├── mimeType (string)
├── size (number) — bytes
├── storageKey (string) — path in storage backend
├── storageProvider (enum) — "local", "s3", "gcs", "azure"
├── thumbnailKey (optional string)
├── isArchived (boolean)
├── uploadedBy (id)
├── version (number) — for versioning
├── parentId (optional id) — for version chain
├── metadata (JSON, optional)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_entity (entityType, entityId)
├── by_uploader (uploadedBy)
└── by_category (entityType, category)
```

**APIs**:
```
uploadAttachment(entityType, entityId, file, category?) → id
getAttachments(entityType, entityId, category?) → Attachment[]
getAttachment(id) → Attachment (with download URL)
deleteAttachment(id) → void
replaceAttachment(id, file) → id (creates version)
getVersions(attachmentId) → Attachment[]
generateUploadUrl(entityType, entityId) → URL (for direct upload)
generateDownloadUrl(id) → URL (signed/temporary)
```

**Events**:
```
attachment.uploaded
  ├── attachmentId
  ├── entityType
  ├── entityId
  └── uploadedBy

attachment.deleted
  ├── attachmentId
  └── entityId
```

**Dependencies**: Activity Engine (log uploads/deletions)

**Future Expansion**:
- OCR processing pipeline
- Virus scanning
- Image recognition tagging
- Document classification AI
- Watermarking
- Bulk download as ZIP

---

### 3.5 Comment Engine

**Priority**: P1 — Core

**Purpose**: Universal discussion system for any entity. No module creates its own comments. CRM notes, task discussions, student feedback, approval remarks, invoice disputes — all use the same engine.

**Responsibilities**:
- Add comments to any entity
- Support @mentions (with notification generation)
- Support file attachments
- Support emoji reactions
- Threaded replies (nested comments)
- Rich text editing (future)
- Comment moderation (future)

**Consumers**: CRM, Sales, Admissions, Student, Academic, Finance, HR, Tasks, Workflow.

**Database Entities**:
```
comments
├── id
├── entityType (string) — polymorphic
├── entityId (id)
├── parentId (optional id) — for threading
├── authorId (id)
├── body (text)
├── mentions (JSON, optional) — array of mentioned userIds
├── isEdited (boolean)
├── isPinned (boolean)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_entity (entityType, entityId, createdAt)
├── by_author (authorId, createdAt)
└── by_parent (parentId)

comment_reactions
├── id
├── commentId (id)
├── userId (id)
├── reaction (string) — emoji
└── createdAt (timestamp)

Unique: (commentId, userId, reaction)
```

**APIs**:
```
addComment(entityType, entityId, body, mentions?, parentId?) → id
getComments(entityType, entityId, pagination?) → Comment[]
updateComment(commentId, body) → void
deleteComment(commentId) → void
addReaction(commentId, reaction) → void
removeReaction(commentId, reaction) → void
pinComment(commentId) → void
getMentionSuggestions(query) → User[]
```

**Events**:
```
comment.created
  ├── commentId
  ├── entityType
  ├── entityId
  ├── authorId
  └── mentions

comment.updated
  ├── commentId
  └── body

comment.deleted
  ├── commentId
  └── entityId
```

**Dependencies**: Notification Engine (for mention alerts), Attachment Engine (for file attachments), Activity Engine (log comments)

**Future Expansion**:
- Rich text editor (tiptap/prosemirror)
- Comment formatting (bold, italic, lists)
- Code blocks with syntax highlighting
- Comment export (PDF/print)
- AI comment summarization

---

### 3.6 Timeline Engine

**Priority**: P1 — Core

**Purpose**: Unified chronological history of state changes for every entity. Unlike the Activity Engine (which captures user actions), the Timeline Engine captures state transitions and system events.

**Responsibilities**:
- Record every state transition for an entity
- Show before/after values
- Support entity-agnostic queries
- Provide diff visualization
- Support time-travel view (what did this entity look like at date X?)

**Consumers**: Every module.

**Database Entities**:
```
timeline_events
├── id
├── entityType (string)
├── entityId (id)
├── eventType (string) — "created", "updated", "status_changed", "deleted", etc.
├── field (optional string) — which field changed
├── oldValue (JSON, optional)
├── newValue (JSON, optional)
├── userId (optional id)
├── metadata (JSON, optional)
├── createdAt (timestamp)
└── source (enum) — "user", "system", "api", "import", "automation"
```

**APIs**:
```
recordEvent(entityType, entityId, eventType, oldValue?, newValue?, metadata?) → id
getTimeline(entityType, entityId, pagination?) → TimelineEvent[]
getEntityStateAt(entityType, entityId, timestamp) → JSON
getEntityHistory(entityType, entityId, field?) → TimelineEvent[]
```

**Dependencies**: None (can run independently, but often feeds from other engines)

**Future Expansion**:
- Side-by-side diff view
- Revert-to-point-in-time
- Timeline export

---

### 3.7 Audit Engine

**Priority**: P1 — Core

**Purpose**: Immutable record of every data change across the entire platform. Required for compliance (DPDP, FERPA, SOC2, GDPR). No module can bypass auditing.

**Responsibilities**:
- Record every create, update, and delete operation
- Store before and after values for every field
- Record user, IP address, device, and timestamp
- Immutable storage (append-only, no deletes)
- Support approval trails (who approved what)
- Enable rollback planning
- Compliance reporting

**Consumers**: Every module. Mandatory.

**Database Entities**:
```
audit_logs
├── id
├── entityType (string)
├── entityId (id)
├── action (enum) — "create", "update", "delete", "restore", "approve", "reject"
├── userId (id)
├── userIp (string, optional)
├── userAgent (string, optional)
├── deviceId (string, optional)
├── sessionId (string, optional)
├── oldValues (JSON, optional) — full document before
├── newValues (JSON, optional) — full document after
├── changedFields (string[]) — list of changed field names
├── approvalId (optional id) — link to approval
├── metadata (JSON, optional)
├── createdAt (timestamp) — immutable
└── checksum (string) — for integrity verification

Indexes:
├── by_entity (entityType, entityId, createdAt)
├── by_user (userId, createdAt)
├── by_action (action, createdAt)
├── by_date (createdAt)
└── by_entity_type (entityType, createdAt)
```

**APIs**:
```
recordAudit(entityType, entityId, action, userId, oldValues?, newValues?, metadata?) → id
getAuditLog(entityType, entityId, pagination?) → AuditLog[]
getAuditLogByUser(userId, pagination?) → AuditLog[]
getAuditLogByDateRange(startDate, endDate, pagination?) → AuditLog[]
getChangesForField(entityType, entityId, fieldName) → AuditLog[]
getEntityVersionAt(entityType, entityId, timestamp) → JSON
verifyIntegrity(fromDate, toDate) → boolean
exportAuditLog(filters) → CSV/JSON
```

**Events**:
```
audit.recorded
  ├── auditId
  ├── entityType
  ├── entityId
  ├── action
  └── userId
```

**Dependencies**: None (lowest-level engine)

**Future Expansion**:
- Real-time audit streaming
- Anomaly detection (unusual access patterns)
- Automated compliance report generation
- Data retention policy enforcement

---

### 3.8 Approval Engine

**Priority**: P1 — Core

**Purpose**: Universal multi-level approval system. Supports discount approvals, leave requests, purchase orders, admission decisions, fee waivers, and any future approval workflow.

**Responsibilities**:
- Single-level and multi-level approvals
- Parallel and sequential approval chains
- Conditional routing (if amount > X, escalate to Y)
- Delegation (approver can delegate to substitute)
- SLA monitoring (auto-escalate if not approved within N hours)
- Reminder notifications for pending approvals
- Approval/rejection with comments
- Conditional workflows based on entity attributes

**Consumers**: CRM (discounts, waivers), Finance (invoices, refunds), HR (leaves, expenses), Admissions (enrollment decisions), Tasks (task sign-off).

**Database Entities**:
```
approval_chains
├── id
├── name (string)
├── entityType (string) — which entity uses this chain
├── conditions (JSON, optional) — conditional routing rules
├── isActive (boolean)
├── createdBy (id)
└── createdAt (timestamp)

approval_chain_steps
├── id
├── chainId (id)
├── stepOrder (number)
├── type (enum) — "single", "parallel", "conditional"
├── approverRole (enum, optional) — role that can approve
├── approverUserId (optional id) — specific user
├── condition (JSON, optional) — when this step applies
├── sla (number, optional) — hours to complete
└── escalationUserId (optional id) — who gets notified on SLA breach

approvals
├── id
├── chainId (optional id)
├── entityType (string)
├── entityId (id)
├── title (string)
├── description (text, optional)
├── requestedBy (id)
├── status (enum) — "pending", "approved", "rejected", "escalated", "cancelled"
├── currentStep (number)
├── totalSteps (number)
├── submittedAt (timestamp)
├── completedAt (optional timestamp)
└── metadata (JSON, optional)

approval_decisions
├── id
├── approvalId (id)
├── stepOrder (number)
├── userId (id)
├── decision (enum) — "approved", "rejected", "delegated"
├── comment (text, optional)
├── delegatedTo (optional id)
├── decidedAt (timestamp)
└── isActive (boolean) — for re-approval scenarios
```

**APIs**:
```
submitForApproval(entityType, entityId, title, description?, chainId?) → id
submitWithChain(entityType, entityId, chainId) → id
getPendingApprovals(userId, pagination?) → Approval[]
getApprovalHistory(entityType, entityId) → Approval[]
approve(approvalId, comment?) → void
reject(approvalId, comment?) → void
delegate(approvalId, delegateUserId) → void
escalate(approvalId) → void
cancelApproval(approvalId) → void
getApprovalChain(entityType, attributes?) → ApprovalChain
```

**Events**:
```
approval.submitted
  ├── approvalId
  ├── entityType
  ├── entityId
  └── requestedBy

approval.approved
  ├── approvalId
  ├── step
  └── approvedBy

approval.rejected
  ├── approvalId
  ├── step
  └── rejectedBy

approval.completed
  ├── approvalId
  ├── decision
  └── completedAt

approval.escalated
  ├── approvalId
  └── escalatedTo
```

**Dependencies**: Notification Engine (for approval requests and reminders), Activity Engine (log decisions), Audit Engine (record every decision)

**Future Expansion**:
- Mobile approval with biometric verification
- QR-code based approval
- Approval dashboard with SLA heatmap
- AI approval recommendation engine

---

### 3.9 Workflow Engine

**Priority**: P1 — Core

**Purpose**: Business process automation. Trigger → Condition → Action chains that automate repetitive processes. No hardcoded workflows — everything configurable.

**Responsibilities**:
- Define triggers (entity created, field updated, status changed, schedule, webhook)
- Define conditions (IF field = value, IF amount > X, etc.)
- Define actions (send notification, create task, update field, trigger approval, call webhook)
- Support delays (wait N hours before next action)
- Support escalation chains
- Provide visual workflow builder (future)
- Version workflows
- Enable/disable workflows at runtime

**Consumers**: Every module.

**Database Entities**:
```
workflows
├── id
├── name (string)
├── description (text, optional)
├── module (string) — which module this workflow belongs to
├── entityType (string) — triggers on this entity
├── isActive (boolean)
├── version (number)
├── createdBy (id)
├── createdAt (timestamp)
└── updatedAt (timestamp)

workflow_triggers
├── id
├── workflowId (id)
├── type (enum) — "entity_created", "entity_updated", "field_changed", "status_changed", "schedule", "webhook", "event"
├── config (JSON) — trigger-specific configuration
└── order (number)

workflow_conditions
├── id
├── workflowId (id)
├── group (number) — condition group (AND within group, OR between groups)
├── field (string)
├── operator (enum) — "equals", "not_equals", "greater_than", "less_than", "contains", "in", "not_in", "is_empty", "is_not_empty"
├── value (JSON)
└── order (number)

workflow_actions
├── id
├── workflowId (id)
├── type (enum) — "send_notification", "create_task", "update_field", "trigger_approval", "call_webhook", "send_email", "add_activity", "change_status", "delay"
├── config (JSON)
├── delay (optional, duration)
├── order (number)
└── isEnabled (boolean)

workflow_execution_logs
├── id
├── workflowId (id)
├── entityType (string)
├── entityId (id)
├── triggerId (optional id)
├── status (enum) — "running", "completed", "failed", "skipped"
├── result (JSON, optional)
├── error (text, optional)
├── startedAt (timestamp)
├── completedAt (optional timestamp)
└── createdBy (id)
```

**APIs**:
```
createWorkflow(name, entityType, triggers, conditions, actions) → id
updateWorkflow(id, changes) → void
activateWorkflow(id) → void
deactivateWorkflow(id) → void
executeWorkflow(workflowId, entityType, entityId) → ExecutionLog
getWorkflows(entityType?, pagination?) → Workflow[]
getExecutionHistory(workflowId?, entityType?, entityId?) → ExecutionLog[]
testWorkflow(workflowId, testData) → ActionResult[]
```

**Events**:
```
workflow.executed
  ├── workflowId
  ├── entityType
  ├── entityId
  └── result

workflow.failed
  ├── workflowId
  ├── entityType
  ├── entityId
  └── error
```

**Dependencies**: Notification Engine, Task Engine, Activity Engine, Approval Engine

**Future Expansion**:
- Visual drag-and-drop workflow builder
- Workflow templates marketplace
- AI-suggested workflows
- Parallel branch workflows
- Sub-workflow support

---

### 3.10 Search Engine

**Priority**: P1 — Core

**Purpose**: Global enterprise search across all modules. Permission-aware, cross-entity, real-time. One search bar, every result.

**Responsibilities**:
- Index entities from all modules
- Full-text search across multiple fields
- Permission-aware result filtering
- Cross-entity search (leads + students + invoices + tasks in one query)
- Typo-tolerant search
- Filter by entity type, date, status
- Real-time index updates
- Search suggestions/autocomplete
- Relevance scoring

**Consumers**: Every module. Global Search UI.

**Database Entities**:
```
search_index
├── id
├── entityType (string)
├── entityId (id)
├── title (string) — primary search label
├── description (text, optional) — secondary search content
├── keywords (string[]) — searchable keywords
├── tags (string[], optional)
├── status (string, optional) — for filtering
├── searchableText (text) — concatenated searchable content
├── referenceUrl (string) — deep link
├── permissionScope (JSON) — who can see this result
├── isActive (boolean)
├── indexedAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── searchableText (full-text index)
├── by_entity (entityType, entityId)
└── by_status (isActive)

search_suggestions
├── id
├── query (string) — partial query
├── suggestion (string) — completed suggestion
├── frequency (number) — how often this is used
├── entityType (optional string)
└── lastUsedAt (timestamp)
```

**APIs**:
```
search(query, filters?, pagination?) → SearchResult[]
searchByEntity(query, entityType, filters?, pagination?) → SearchResult[]
getSuggestions(query) → string[]
indexEntity(entityType, entityId) → void
reindexEntity(entityType, entityId) → void
removeFromIndex(entityType, entityId) → void
rebuildIndex(entityType?) → void
```

**Events**:
```
search.indexed
  ├── entityType
  └── entityId

search.reindexed
  └── entityType
```

**Dependencies**: All modules (for indexing)

**Future Expansion**:
- Elasticsearch/Meilisearch integration
- AI-powered semantic search
- Voice search
- Saved searches
- Search alerts ("search this term every day, email me new results")

---

### 3.11 Tag Engine

**Priority**: P2 — Enhancement

**Purpose**: Reusable tagging system. No module creates its own tag system. Tags are cross-entity and configurable through Master Data.

**Responsibilities**:
- Create and manage tags
- Assign tags to any entity
- Support tag groups/categories
- Auto-suggest existing tags
- Prevent duplicate tag systems across modules

**Consumers**: CRM, Sales, Student, Tasks, Marketing, All modules.

**Database Entities**:
```
tags
├── id
├── name (string)
├── slug (string) — unique
├── color (string, optional) — hex color
├── group (string, optional) — "lead", "student", "task", "general"
├── isActive (boolean)
├── createdBy (id)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Index: by_group, by_slug (unique)

entity_tags
├── id
├── tagId (id)
├── entityType (string)
├── entityId (id)
├── createdBy (id)
├── createdAt (timestamp)
└── Unique: (tagId, entityType, entityId)
```

**APIs**:
```
createTag(name, group?, color?) → id
getTags(group?, pagination?) → Tag[]
assignTag(tagId, entityType, entityId) → void
removeTag(tagId, entityType, entityId) → void
getEntityTags(entityType, entityId) → Tag[]
getEntitiesByTag(tagId, entityType?, pagination?) → Entity[]
mergeTags(sourceTagId, targetTagId) → void
deleteTag(id) → void
```

**Events**:
```
tag.assigned
  ├── tagId
  ├── entityType
  └── entityId

tag.removed
  ├── tagId
  ├── entityType
  └── entityId
```

**Dependencies**: None

---

### 3.12 Label Engine

**Priority**: P2 — Enhancement

**Purpose**: Reusable status, priority, and category labels. Every module uses the same label system for consistent UX across the platform.

**Responsibilities**:
- Define label types (status, priority, category, color)
- Define label values per type
- Support custom colors per label
- Support ordering
- Support per-module label sets
- Master Data driven

**Database Entities**:
```
label_types
├── id
├── code (string) — "status", "priority", "category", "color"
├── name (string)
├── module (string, optional) — which module owns this
├── entityType (string, optional) — scoped to entity
├── isActive (boolean)
└── createdAt (timestamp)

label_values
├── id
├── labelTypeId (id)
├── code (string)
├── name (string)
├── color (string, optional)
├── icon (string, optional)
├── order (number)
├── isDefault (boolean)
├── isActive (boolean)
└── createdAt (timestamp)
```

**APIs**: Standard CRUD via Master Data Studio.

**Dependencies**: None

---

### 3.13 Template Engine

**Priority**: P2 — Enhancement

**Purpose**: Reusable templates for emails, SMS, WhatsApp, certificates, receipts, and documents. No module hardcodes message content.

**Responsibilities**:
- Create and manage templates with variable placeholders
- Support {{variable}} syntax
- Preview with sample data
- Version history
- Per-channel templates (different content for email vs SMS)
- Conditional sections in templates

**Consumers**: Notification Engine, Communication Engine, Reporting Engine.

**Database Entities**:
```
templates
├── id
├── code (string) — unique
├── name (string)
├── type (enum) — "email", "sms", "whatsapp", "certificate", "receipt", "document", "push"
├── subject (string, optional) — for email
├── body (text)
├── variables (JSON) — expected variable definitions
├── design (JSON, optional) — for rich templates
├── version (number)
├── isActive (boolean)
├── createdBy (id)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

**APIs**:
```
renderTemplate(templateCode, variables) → string
previewTemplate(templateCode, sampleData) → string
getTemplates(type?, pagination?) → Template[]
getTemplateByCode(code) → Template
```

**Dependencies**: None

---

### 3.14 Communication Engine

**Priority**: P2 — Enhancement

**Purpose**: Omnichannel conversation management. Internal inbox, external messages, broadcasts, and announcements — all unified.

**Responsibilities**:
- One-on-one conversations
- Group conversations
- Broadcast/announcement to segments
- Internal messaging between staff
- External messaging across channels
- Message threading
- Read receipts
- Archive/delete
- Spam/mute

**Database Entities**:
```
conversations
├── id
├── type (enum) — "direct", "group", "broadcast", "announcement"
├── title (string, optional)
├── participants (array[id])
├── lastMessageAt (timestamp)
├── isArchived (boolean)
├── createdBy (id)
├── createdAt (timestamp)
└── updatedAt (timestamp)

messages
├── id
├── conversationId (id)
├── senderId (id)
├── body (text)
├── channel (enum) — "in_app", "whatsapp", "email", "sms"
├── attachments (array[id], optional)
├── mentions (array[id], optional)
├── isRead (boolean)
├── readAt (timestamp, optional)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_conversation (conversationId, createdAt)
├── by_sender (senderId, createdAt)
└── by_recipient (via conversation participants)
```

**APIs**:
```
createConversation(type, participants, title?) → id
sendMessage(conversationId, body, attachments?, mentions?) → id
getConversations(userId, pagination?) → Conversation[]
getMessages(conversationId, pagination?) → Message[]
markAsRead(conversationId, userId) → void
archiveConversation(conversationId) → void
getUnreadCount(userId) → number
broadcastMessage(title, body, channel, segments?) → id
```

**Events**:
```
message.sent
  ├── messageId
  ├── conversationId
  ├── senderId
  └── channel

conversation.created
  ├── conversationId
  └── participants
```

**Dependencies**: Attachment Engine, Notification Engine, Template Engine

---

### 3.15 Calendar Engine

**Priority**: P2 — Enhancement

**Purpose**: Unified calendar for all events. Meetings, leaves, tasks, admissions dates, exams, birthdays, reminders — all in one place.

**Responsibilities**:
- Create and manage events
- Support recurring events
- Calendar views (day, week, month, agenda)
- Event categories (meeting, leave, task, exam, holiday, birthday)
- Integration with external calendars (iCal, Google Calendar)
- Conflict detection
- Event sharing

**Database Entities**:
```
calendar_events
├── id
├── title (string)
├── description (text, optional)
├── eventType (enum) — "meeting", "leave", "task", "exam", "holiday", "birthday", "reminder", "custom"
├── entityType (optional string)
├── entityId (optional id)
├── startDate (timestamp)
├── endDate (timestamp)
├── isAllDay (boolean)
├── recurrence (JSON, optional) — rule for recurring events
├── location (string, optional)
├── color (string, optional)
├── visibility (enum) — "private", "public", "department", "branch"
├── organizerId (id)
├── participants (array[id], optional)
├── status (enum) — "confirmed", "tentative", "cancelled"
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_date (startDate, endDate)
├── by_organizer (organizerId, startDate)
├── by_participant (via participants array)
└── by_entity (entityType, entityId)
```

**APIs**:
```
createEvent(event) → id
getEvents(startDate, endDate, userId?, filters?) → Event[]
getEvent(id) → Event
updateEvent(id, changes) → void
deleteEvent(id) → void
addParticipant(eventId, userId) → void
removeParticipant(eventId, userId) → void
getCalendarFeed(userId, startDate, endDate) → Event[]
checkConflicts(startDate, endDate, userId, excludeEventId?) → Event[]
```

**Events**:
```
event.created
  ├── eventId
  └── organizerId

event.updated
  ├── eventId
  └── changes

event.deleted
  └── eventId
```

**Dependencies**: Notification Engine (for reminders)

---

### 3.16 Reminder Engine

**Priority**: P2 — Enhancement

**Purpose**: Configurable reminder system. Follow-ups, payment reminders, renewal alerts, approval reminders, birthday wishes, deadline warnings — all managed centrally.

**Responsibilities**:
- Set reminders on any entity
- Support multiple reminders per entity
- Configurable timing (N hours/days before)
- Recurring reminders
- Escalation if ignored
- Channel preference (in-app, email, WhatsApp, SMS)
- Snooze functionality
- Completed/cancelled reminders

**Database Entities**:
```
reminders
├── id
├── title (string)
├── description (text, optional)
├── entityType (string, optional)
├── entityId (id, optional)
├── assignedTo (id) — who gets reminded
├── assignedBy (id) — who set the reminder
├── remindAt (timestamp)
├── channel (enum) — "in_app", "email", "whatsapp", "sms"
├── recurrence (JSON, optional)
├── status (enum) — "pending", "sent", "snoozed", "completed", "cancelled"
├── escalationMinutes (optional number)
├── escalatedTo (optional id)
├── snoozedUntil (optional timestamp)
├── completedAt (optional timestamp)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Indexes:
├── by_assigned (assignedTo, status, remindAt)
├── by_due (status, remindAt)
└── by_entity (entityType, entityId)
```

**APIs**:
```
createReminder(title, remindAt, assignedTo, entity?, channel?) → id
getReminders(userId, status?, pagination?) → Reminder[]
snoozeReminder(id, until) → void
completeReminder(id) → void
cancelReminder(id) → void
getOverdueReminders() → Reminder[]
```

**Events**:
```
reminder.sent
  ├── reminderId
  ├── assignedTo
  └── channel

reminder.completed
  ├── reminderId
  └── completedAt
```

**Dependencies**: Notification Engine

---

### 3.17 Reporting Engine

**Priority**: P2 — Enhancement

**Purpose**: Configurable report generation. Charts, tables, exports. No module implements its own reporting.

**Responsibilities**:
- Define report templates
- Support multiple chart types (bar, line, pie, area, table)
- Filterable data sources
- Scheduled report generation
- Export to PDF, Excel, CSV, JSON
- Saved reports
- Report sharing

**Database Entities**:
```
report_templates
├── id
├── name (string)
├── description (text, optional)
├── module (string)
├── dataSource (string) — which query/engine to use
├── chartType (enum) — "table", "bar", "line", "pie", "area", "metric"
├── config (JSON) — chart configuration
├── filters (JSON) — default filters
├── createdBy (id)
├── isShared (boolean)
├── createdAt (timestamp)
└── updatedAt (timestamp)

saved_reports
├── id
├── templateId (id)
├── name (string)
├── filters (JSON) — applied filters
├── schedule (JSON, optional) — cron expression
├── recipients (array[id], optional)
├── lastRunAt (timestamp, optional)
├── createdBy (id)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

**APIs**:
```
generateReport(templateId, filters?) → ReportData
scheduleReport(savedReportId, cron, recipients) → void
exportReport(reportData, format) → File
getSavedReports(userId) → SavedReport[]
```

**Dependencies**: All engines (as data sources)

---

### 3.18 Dashboard Engine

**Priority**: P2 — Enhancement

**Purpose**: Configurable, role-based dashboards with widgets. Users and roles have personalized dashboards.

**Responsibilities**:
- Define dashboard layouts per role
- Configurable widgets (metrics, charts, lists, activity feeds)
- Personal dashboards (user-customizable)
- CEO/COO/CFO role dashboards
- Widget library
- Real-time data refresh

**Database Entities**:
```
dashboards
├── id
├── name (string)
├── role (string, optional) — role-specific dashboard
├── userId (optional id) — personal dashboard
├── layout (JSON) — grid layout configuration
├── isDefault (boolean)
├── createdAt (timestamp)
└── updatedAt (timestamp)

dashboard_widgets
├── id
├── dashboardId (id)
├── widgetType (string) — "metrics", "chart", "list", "activity", "tasks", "notifications"
├── title (string)
├── config (JSON) — widget-specific settings
├── position (JSON) — grid position
├── size (enum) — "small", "medium", "large", "full"
└── isVisible (boolean)
```

**APIs**:
```
getDashboard(role, userId?) → Dashboard
saveDashboard(dashboard) → void
addWidget(dashboardId, widget) → id
updateWidgetPosition(widgetId, position) → void
removeWidget(widgetId) → void
getWidgetData(widgetId, filters?) → WidgetData
```

**Dependencies**: Reporting Engine

---

### 3.19 Import/Export Engine

**Priority**: P3 — Advanced

**Purpose**: Configurable bulk data operations for all entities. No module implements its own import/export.

**Responsibilities**:
- Import from CSV, Excel, JSON
- Export to CSV, Excel, PDF, JSON
- Field mapping configuration
- Validation before import (preview errors)
- Duplicate detection during import
- Bulk update via import
- Scheduled exports
- Large file handling (chunked)

**Consumers**: Every module.

**Database Entities**:
```
import_jobs
├── id
├── entityType (string)
├── fileName (string)
├── filePath (string)
├── fieldMapping (JSON) — source → target mapping
├── totalRows (number)
├── processedRows (number)
├── failedRows (number)
├── errors (JSON, optional) — row-level errors
├── status (enum) — "pending", "processing", "completed", "failed"
├── createdBy (id)
├── createdAt (timestamp)
└── completedAt (optional timestamp)

export_jobs
├── id
├── entityType (string)
├── format (enum) — "csv", "xlsx", "pdf", "json"
├── filters (JSON)
├── totalRows (number)
├── filePath (string, optional)
├── status (enum) — "pending", "processing", "completed", "failed"
├── createdBy (id)
├── createdAt (timestamp)
└── completedAt (optional timestamp)
```

**APIs**:
```
importFile(entityType, file, fieldMapping?) → JobId
getImportPreview(file) → PreviewData
getImportStatus(jobId) → JobStatus
exportEntity(entityType, format, filters?) → JobId
getExportStatus(jobId) → JobStatus
downloadExport(jobId) → File
```

**Dependencies**: File Storage Engine

---

### 3.20 File Storage Engine

**Priority**: P3 — Advanced

**Purpose**: Storage abstraction layer. Cloud-ready. Supports multiple storage providers.

**Responsibilities**:
- Abstract storage provider (local, S3, GCS, Azure)
- Upload/download with signed URLs
- File type validation
- Size limits
- Chunked upload for large files
- File lifecycle management (temp → permanent → archive)

**Consumers**: Attachment Engine, Import/Export Engine, All modules.

**Database Entities**: Managed by Attachment Engine.

**APIs**:
```
upload(file, path?) → StorageKey
download(storageKey) → Stream
generateUploadUrl(path, contentType) → SignedUrl
generateDownloadUrl(storageKey, expiresIn) → SignedUrl
deleteFile(storageKey) → void
copyFile(sourceKey, destinationPath) → StorageKey
getFileMetadata(storageKey) → Metadata
```

**Dependencies**: None

---

### 3.21 Integration Engine

**Priority**: P3 — Advanced

**Purpose**: External system integration framework. REST APIs, webhooks, third-party connectors, payment gateways, ERP integrations.

**Responsibilities**:
- REST API gateway
- Webhook receiver and sender
- Third-party connector management
- API key management
- Rate limiting
- Request/response logging
- Error handling and retry
- Zapier/Make.com compatible (future)

**Database Entities**:
```
integrations
├── id
├── name (string)
├── provider (string) — "stripe", "twilio", "zapier", "custom"
├── type (enum) — "inbound", "outbound", "webhook", "api"
├── config (JSON) — provider-specific configuration
├── credentials (encrypted JSON)
├── isActive (boolean)
├── lastUsedAt (timestamp)
├── createdAt (timestamp)
└── updatedAt (timestamp)

webhook_endpoints
├── id
├── name (string)
├── url (string)
├── events (array[string]) — subscribed events
├── secret (string)
├── isActive (boolean)
├── lastTriggeredAt (timestamp)
├── createdAt (timestamp)
└── updatedAt (timestamp)

integration_logs
├── id
├── integrationId (id)
├── direction (enum) — "inbound", "outbound"
├── request (JSON)
├── response (JSON, optional)
├── status (enum) — "success", "failed", "retrying"
├── error (text, optional)
├── duration (number) — ms
├── createdAt (timestamp)
└── processedAt (timestamp)
```

**APIs**:
```
registerWebhook(name, url, events) → id
triggerWebhook(event, payload) → void
getIntegrationLogs(integrationId, pagination?) → Log[]
retryFailedIntegration(logId) → void
testConnection(integrationId) → boolean
```

**Events**:
```
integration.webhook_received
  ├── event
  └── payload

integration.webhook_sent
  ├── event
  └── status

integration.failed
  ├── integrationId
  └── error
```

**Dependencies**: Audit Engine (log all API calls)

---

### 3.22 AI Engine

**Priority**: P4 — Future

**Purpose**: Enterprise AI capabilities. Assistant, predictions, automation, analytics. Exclusively consumes data from other engines — never creates its own data sources.

**Responsibilities** (Future):
- AI Assistant (conversational interface)
- AI Search (semantic search)
- AI Predictions (lead conversion, revenue, attrition)
- AI Recommendations (courses, actions, next best step)
- AI Automation (intelligent workflow triggers)
- AI Analytics (natural language query to reports)
- AI Follow-ups (auto-generate next actions)

**Consumers**: All modules via AI Studio.

**Dependencies**: All engines (as data sources)

---

## 4. Engine Dependency Matrix

```
Engine                    Depends On                                    Depended By
──────────────────────    ──────────────────────────────────────────    ───────────────────────────────────────
Sequence Engine           —                                            All modules
Activity Engine          —                                             All modules, Notification Engine
Notification Engine      Template Engine, Activity Engine              Approval Engine, Workflow Engine, Reminder Engine, Communication Engine
Attachment Engine        Activity Engine, File Storage Engine          Comment Engine, Communication Engine
Comment Engine           Notification Engine, Attachment Engine,       CRM, Sales, Tasks, Student, HR
                         Activity Engine
Timeline Engine          —                                             All modules (state tracking)
Audit Engine             —                                             All modules (mandatory)
Approval Engine          Notification Engine, Activity Engine,         CRM, Finance, HR, Admissions, Tasks
                         Audit Engine
Workflow Engine          Notification Engine, Activity Engine,         All modules (automation)
                         Approval Engine
Search Engine            All modules                                   Global Search UI
Tag Engine               —                                             CRM, Tasks, Marketing, Student
Label Engine             —                                             All modules (status/priority)
Template Engine          —                                             Notification Engine, Communication Engine, Reporting Engine
Communication Engine     Attachment Engine, Notification Engine,       CRM, Sales, Support
                         Template Engine
Calendar Engine          Notification Engine                           Dashboard, HR, Academic
Reminder Engine          Notification Engine                           CRM, Finance, HR, Tasks
Reporting Engine         All engines                                   Dashboard Engine, Analytics Studio
Dashboard Engine         Reporting Engine                              CEO/COO/CFO Dashboards
Import/Export Engine     File Storage Engine                           All modules
File Storage Engine      —                                             Attachment Engine, Import/Export Engine
Integration Engine       Audit Engine                                  All modules (external APIs)
AI Engine                All engines                                   AI Studio (Future)
```

---

## 5. Module Dependency Matrix

```
Module                   Engines Consumed
──────                   ────────────────
CRM                      Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Approval,
                         Workflow, Search, Tag, Label, Template, Communication, Calendar, Reminder, Import/Export

Sales                    Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Approval,
                         Workflow, Search, Tag, Label, Template, Communication, Calendar, Reminder, Import/Export

Admissions               Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Approval,
                         Workflow, Search, Tag, Label, Template, Communication, Calendar, Reminder, Import/Export

Student                  Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Workflow,
                         Search, Tag, Label, Template, Communication, Calendar, Import/Export

Academic                 Sequence, Activity, Notification, Attachment, Timeline, Audit, Search, Label,
                         Template, Calendar, Reminder, Reporting, Import/Export

Finance                  Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Approval,
                         Workflow, Search, Label, Template, Calendar, Reminder, Reporting, Import/Export

HR                       Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Approval,
                         Workflow, Search, Tag, Label, Template, Calendar, Reminder, Reporting, Import/Export

Marketing                Sequence, Activity, Notification, Attachment, Timeline, Audit, Workflow, Search,
                         Tag, Label, Template, Communication, Calendar, Reporting, Import/Export

Administration           Sequence, Activity, Notification, Attachment, Timeline, Audit, Workflow, Search,
                         Label, Template, Calendar, Reminder, Import/Export

Technology               Sequence, Activity, Notification, Attachment, Timeline, Audit, Search, Label,
                         Template, Calendar, Reminder, Import/Export

Communication            Activity, Notification, Attachment, Template, Search, Audit

Analytics                Activity, Timeline, Audit, Reporting, Dashboard, Search, Calendar (Read-only)

Tasks                    Sequence, Activity, Notification, Attachment, Comment, Timeline, Audit, Approval,
                         Workflow, Search, Tag, Label, Calendar, Reminder, Import/Export
```

---

## 6. Database Blueprint

This section lists expected tables for every engine. Architecture only — no implementation details.

| Engine | Tables |
|--------|--------|
| Sequence Engine | `sequences`, `sequence_history` |
| Activity Engine | `activities` |
| Notification Engine | `notification_templates`, `notifications`, `notification_preferences` |
| Attachment Engine | `attachments` |
| Comment Engine | `comments`, `comment_reactions` |
| Timeline Engine | `timeline_events` |
| Audit Engine | `audit_logs` |
| Approval Engine | `approval_chains`, `approval_chain_steps`, `approvals`, `approval_decisions` |
| Workflow Engine | `workflows`, `workflow_triggers`, `workflow_conditions`, `workflow_actions`, `workflow_execution_logs` |
| Search Engine | `search_index`, `search_suggestions` |
| Tag Engine | `tags`, `entity_tags` |
| Label Engine | `label_types`, `label_values` |
| Template Engine | `templates` |
| Communication Engine | `conversations`, `messages` |
| Calendar Engine | `calendar_events` |
| Reminder Engine | `reminders` |
| Reporting Engine | `report_templates`, `saved_reports` |
| Dashboard Engine | `dashboards`, `dashboard_widgets` |
| Import/Export Engine | `import_jobs`, `export_jobs` |
| Integration Engine | `integrations`, `webhook_endpoints`, `integration_logs` |

**Total estimated tables**: 45+

---

## 7. Event Architecture

### Event Bus Model

EEOS uses a publish-subscribe event model. Engines and modules publish events. Other engines and modules subscribe to events they care about. No direct coupling between publishers and subscribers.

### Core Platform Events

```
┌────────────────────────────────────────────────────────────┐
│                     EVENT BUS                                │
│                                                             │
│  Publishers                              Subscribers         │
│                                                             │
│  Sequence Engine ──► number_generated  ──► Activity Engine  │
│                                                             │
│  Activity Engine ──► activity_created   ──► Search Engine   │
│                                                             │
│  Any Module      ──► entity_created     ──► Search Engine   │
│                    ► entity_updated     ──► Timeline Engine │
│                    ► entity_deleted     ──► Audit Engine     │
│                                         ──► Workflow Engine │
│                                                             │
│  Approval Engine ──► approval_approved  ──► Notification    │
│                    ► approval_rejected  ──► Activity Engine   │
│                    ► approval_completed ──► Workflow Engine   │
│                                                             │
│  Workflow Eng.   ──► workflow_executed ──► Activity Engine  │
│                                                             │
│  Notification    ──► notification_sent ──► Activity Engine  │
│                                                             │
│  Comment Engine  ──► comment_created   ──► Notification     │
│                    ► comment_mentioned ──► (mention alerts)   │
│                                                             │
│  Reminder Engine ──► reminder_due      ──► Notification     │
│                                                             │
│  Calendar Eng.   ──► event_created     ──► Notification     │
│                                                             │
│  Integration     ──► webhook_received  ──► Workflow Engine  │
└────────────────────────────────────────────────────────────┘
```

### Event Payload Standard

Every event follows this structure:

```json
{
  "event": "entity.action",
  "timestamp": "2026-07-14T12:00:00Z",
  "source": "module_name",
  "entityType": "lead",
  "entityId": "jd8sj3kd8",
  "actor": {
    "userId": "user_123",
    "role": "admin"
  },
  "payload": {
    // event-specific data
  },
  "metadata": {
    "requestId": "req_abc",
    "sessionId": "sess_xyz"
  }
}
```

### Key Event Catalogue

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `entity.created` | All modules | Search, Timeline, Audit, Workflow |
| `entity.updated` | All modules | Search, Timeline, Audit, Workflow |
| `entity.deleted` | All modules | Search, Timeline, Audit, Workflow |
| `entity.status_changed` | All modules | Activity, Notification, Workflow |
| `sequence.number_generated` | Sequence Engine | Activity |
| `activity.created` | Activity Engine | Search, Notification |
| `notification.sent` | Notification Engine | Activity |
| `notification.delivered` | Notification Engine | Activity |
| `notification.read` | Notification Engine | Activity |
| `attachment.uploaded` | Attachment Engine | Activity, Search |
| `attachment.deleted` | Attachment Engine | Activity |
| `comment.created` | Comment Engine | Activity, Notification |
| `comment.mentioned` | Comment Engine | Notification |
| `approval.submitted` | Approval Engine | Notification, Activity |
| `approval.approved` | Approval Engine | Notification, Activity, Workflow |
| `approval.rejected` | Approval Engine | Notification, Activity, Workflow |
| `approval.completed` | Approval Engine | Notification, Activity, Workflow |
| `approval.escalated` | Approval Engine | Notification |
| `workflow.executed` | Workflow Engine | Activity |
| `workflow.failed` | Workflow Engine | Notification, Activity |
| `reminder.sent` | Reminder Engine | Activity |
| `message.sent` | Communication Engine | Activity, Notification |
| `event.created` | Calendar Engine | Notification |
| `integration.webhook_received` | Integration Engine | Workflow, Activity |
| `audit.recorded` | Audit Engine | (Internal only) |

---

## 8. API Architecture

### Design Principles

1. **RESTful by default**: Every engine exposes a RESTful API using Convex mutations/queries
2. **Internal-first**: APIs are primarily consumed by other engines and modules within the platform
3. **Future GraphQL readiness**: Data models are designed to map cleanly to GraphQL schemas
4. **Versioned**: Breaking changes require API version bumps
5. **Paginated**: All list endpoints support cursor-based pagination
6. **Filterable**: All list endpoints support field-based filtering
7. **Permission-aware**: Every API call is scoped to the requesting user's permissions

### API Naming Convention

```
{engine}.{action}           → Convex function name
{engine}.{entity}.{action}  → Multi-entity engine function
```

Examples:
```
sequences.generateNumber
activities.logActivity
activities.getActivities
notifications.send
notifications.getNotifications
attachments.upload
comments.addComment
approvals.submit
approvals.approve
workflows.execute
tags.assignTag
search.search
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "cursor": "abc123",
    "hasMore": true
  },
  "error": null
}
```

### Error Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Entity not found",
    "details": {}
  }
}
```

---

## 9. Security

### Permission Model

Every engine API call must pass through the platform's permission system:

1. **Authentication**: User must be authenticated (handled by Convex Auth)
2. **Authorization**: User must have permission to perform the action on the target entity
3. **Scope**: User's access is scoped to their organization/branch/department/role
4. **Audit**: Every access attempt is logged by the Audit Engine

### Data Isolation

- **Multi-tenancy via organization_id**: Every entity belongs to an organization. Queries are automatically scoped.
- **Branch isolation**: Users see data only within their assigned branches (or higher if permitted)
- **Role-based visibility**: Super admin sees all. Admin sees branch. Manager sees department. Staff sees own.

### Encryption

- **At rest**: Database encryption (Convex-managed)
- **In transit**: TLS for all API calls
- **Secrets**: API keys, tokens, and credentials stored encrypted in the Integration Engine

### Compliance

- **DPDP Act ready**: Audit Engine tracks all PII access
- **FERPA compatible**: Student data access is strictly permission-controlled
- **GDPR ready**: Data export and deletion workflows through Import/Export Engine

---

## 10. Performance

### Caching Strategy

| Layer | Strategy | Engine |
|-------|----------|--------|
| Sequence counters | In-memory with DB fallback | Sequence Engine |
| Activity feeds | Time-based cache (30s) | Activity Engine |
| Notification templates | Cache forever, bust on change | Template Engine |
| Search index | Dedicated search index (Meilisearch/Elasticsearch future) | Search Engine |
| Lookup data (tags, labels) | Cache forever, bust on change | Tag/Label Engine |
| Dashboard widget data | Time-based cache (60s) | Dashboard Engine |

### Queue Architecture

| Use Case | Queue |
|----------|-------|
| Email/SMS/WhatsApp delivery | Async queue (retry with backoff) |
| Search index updates | Async queue |
| Activity logging | Async queue (fire-and-forget) |
| Webhook delivery | Async queue (retry with backoff) |
| Bulk import processing | Background job |
| Report generation | Background job |

### Index Strategy

- Every `by_entity` index includes `(entityType, entityId, createdAt)`
- Every `by_user` index includes `(userId, createdAt)`
- Compound indexes for common query patterns
- Full-text index on Search Engine tables
- Partial indexes for filtered queries (WHERE status = 'pending')

---

## 11. AI Readiness

### How Engines Expose Data for AI

Every engine is designed to make its data consumable by future AI systems without modification:

1. **Structured Events**: Every engine emits standardized JSON events. AI models can consume event streams for training and real-time inference.

2. **Clean APIs**: Every engine exposes typed, documented APIs. AI tools (like LangChain, Vercel AI SDK) can call these APIs as tools.

3. **Activity as Training Data**: The Activity Engine contains the complete history of every user action. This is the ideal dataset for training recommendation models, predicting user intent, and automating routine actions.

4. **Timeline as Context**: The Timeline Engine provides the full state history of any entity. AI can use this for time-series predictions (lead conversion probability, revenue forecasting, student attrition risk).

5. **Audit as Feedback Loop**: The Audit Engine provides the ground truth for every action. AI models can be evaluated against this data for accuracy and fairness.

6. **Search as Retrieval**: The Search Engine provides the retrieval layer for RAG (Retrieval-Augmented Generation). AI can answer natural language questions by searching indexed entities.

7. **Workflow as Automation Target**: Workflow Engine actions are structured and predictable. AI can suggest new workflows, optimize existing ones, and auto-trigger based on predicted outcomes.

8. **Notifications as Communication Layer**: AI can generate personalized notification content, optimize send times, and predict the best channel per user.

### Future AI Integration Points

```
AI Assistant         →  Search Engine (RAG), Activity Engine (context), Notification Engine (response)
AI Predictions       →  Timeline Engine (historical data), Activity Engine (signals)
AI Recommendations   →  Tag Engine (preferences), Activity Engine (behavior), Calendar Engine (timing)
AI Automation        →  Workflow Engine (execution), Approval Engine (governance)
AI Analytics         →  Reporting Engine (visualization), Audit Engine (data quality)
```

---

## 12. Development Roadmap

### Implementation Order

```
Phase 1 — Foundation (Current Sprint)
├── 1.1 Sequence Engine          — Needed by every module for identifiers
├── 1.2 Activity Engine          — Needed by every module for timeline
└── 1.3 Notification Engine      — Needed by every module for alerts

Phase 2 — Core (Next Sprint)
├── 2.1 Attachment Engine        — Needed by every module for files
├── 2.2 Comment Engine           — Needed by CRM, Tasks, Student, HR
├── 2.3 Timeline Engine          — Needed by every module for state tracking
└── 2.4 Audit Engine             — Needed by every module for compliance

Phase 3 — Governance
├── 3.1 Approval Engine          — Needed by CRM, Finance, HR, Admissions
├── 3.2 Workflow Engine          — Needed by all modules for automation
└── 3.3 Search Engine            — Needed for global search

Phase 4 — Enhancement
├── 4.1 Tag Engine               — Needed by CRM, Tasks, Marketing
├── 4.2 Label Engine             — Needed by all modules for status/priority
├── 4.3 Template Engine          — Needed by Notification, Communication, Reporting
├── 4.4 Communication Engine     — Needed by CRM, Support, Marketing
├── 4.5 Calendar Engine          — Needed by HR, Academic, Dashboard
└── 4.6 Reminder Engine          — Needed by CRM, Finance, HR, Tasks

Phase 5 — Advanced
├── 5.1 Reporting Engine         — Needed for analytics
├── 5.2 Dashboard Engine         — Needed for control centers
├── 5.3 Import/Export Engine     — Needed for data operations
└── 5.4 File Storage Engine      — Needed for scalability

Phase 6 — Enterprise
├── 6.1 Integration Engine       — Needed for third-party connections
└── 6.2 AI Engine                — Future
```

### Why This Order?

1. **Sequence Engine first** because no entity can exist without identifiers
2. **Activity and Notification next** because they are consumed by every module
3. **Attachment and Comment** because they enable rich data and collaboration
4. **Audit Engine** because compliance is non-negotiable
5. **Approval and Workflow** because they enable business process automation
6. **Search** because it ties everything together
7. **Remaining engines** fill in the gaps for specific domain needs

---

## 13. Golden Rules

### Immutable Platform Rules

These rules can never be broken. Every developer, every PR, every module must follow them.

**Rule 1 — No Duplicate Engines**
Every shared capability has one engine. No module creates its own notification system, activity log, comment system, file storage, or approval workflow.

**Rule 2 — No Duplicate Notification Systems**
The Notification Engine is the only way to send notifications. No module implements its own email, SMS, or in-app notification.

**Rule 3 — No Duplicate Comments**
The Comment Engine is the only discussion system. No module implements its own notes or comments.

**Rule 4 — No Duplicate Activity Logs**
The Activity Engine is the only timeline. No module creates its own activity log.

**Rule 5 — No Duplicate Approvals**
The Approval Engine is the only approval system. No module implements its own approval workflow.

**Rule 6 — No Module-Specific Search**
The Search Engine is the only search. No module implements its own search bar.

**Rule 7 — Everything Permission-Aware**
Every engine API checks permissions. No data is accessible without authorization.

**Rule 8 — Everything Audit-Ready**
Every data change passes through the Audit Engine. No module can bypass auditing.

**Rule 9 — Everything API-First**
Every engine exposes a clean API. No module accesses another module's database directly.

**Rule 10 — Everything Multi-Tenant Ready**
Every engine scopes data by organization. No engine assumes single-tenant deployment.

**Rule 11 — Engines Own Their Data**
Each engine is the single source of truth for its domain. No module duplicates engine data.

**Rule 12 — Engines Don't Know About Modules**
Engines serve all modules equally. An engine never imports or references a module.

**Rule 13 — Events Before Actions**
Engines emit events for everything. Other engines and modules subscribe to events they need. No direct calls between modules.

**Rule 14 — Configuration Before Customization**
Every engine behavior should be configurable through Master Data before customization is considered.

**Rule 15 — Backend Enforces Everything**
Frontend is never trusted for security. Every permission check, every validation, every audit — all enforced on the backend.

---

## Architecture Notes

### Key Design Decisions

1. **Convex as Runtime**: All engines run on Convex as mutations, queries, and actions. Convex provides real-time reactivity, serverless scaling, and ACID transactions — eliminating the need for a separate backend service.

2. **Polymorphic Entity References**: Engines use `(entityType, entityId)` pairs for polymorphic references. This allows a single engine (like Activity or Comment) to serve every module without schema changes.

3. **Eventual Consistency for Non-Critical Paths**: Activity logging, search indexing, and notification delivery use async patterns. Critical paths (approvals, sequence numbers) remain synchronous.

4. **No Engine-to-Engine Imports**: Engines communicate through their public APIs and events. An engine never imports another engine's code directly.

### Recommendation for Next Development Phase

After PATCH-002 (Platform Standardization), the recommendation is to implement the **Sequence Engine** and **Activity Engine** first — these are consumed by every module and have zero external dependencies. Once these are operational, every future module automatically gets identifiers and activity timelines.

---

## Future Improvements

1. **Engine Health Dashboard**: Real-time monitoring of every engine's performance, error rates, and throughput
2. **Visual Workflow Builder**: Drag-and-drop workflow editor for business users
3. **AI-Assisted Engine Configuration**: AI recommends optimal engine settings based on usage patterns
4. **Engine Versioning**: Each engine has a version number, allowing controlled upgrades
5. **Engine Marketplace**: Third-party engines can be installed as plugins
6. **Event Sourcing**: Full event sourcing for critical engines (Audit, Approval) to enable perfect replay
7. **Webhook Event Delivery**: External systems can subscribe to any platform event via webhooks
8. **Rate Limiting per Engine**: Prevent any single module from overwhelming an engine
9. **Engine Documentation Generator**: Auto-generate API docs from engine code
10. **Load Testing Framework**: Per-engine load testing to ensure scalability
