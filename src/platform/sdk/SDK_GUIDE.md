# EEOS Platform SDK Guide

## Overview

The EEOS Platform SDK is a shared abstraction layer that every business module **MUST** use for platform-level operations.

## Core Principle

> **No module may directly perform platform operations.**
> Every timeline event, audit log, notification, workflow invocation, visibility check, and permission check must go through the SDK.

## SDK Modules

| Module | File | Purpose |
|--------|------|---------|
| Timeline | `timelineSdk.ts` | Record timeline events |
| Audit | `auditSdk.ts` | Record audit log entries |
| Notification | `notificationSdk.ts` | Send and manage notifications |
| Workflow | `workflowSdk.ts` | Start and manage workflows |
| Visibility | `visibilitySdk.ts` | Check data visibility |
| Permission | `permissionSdk.ts` | Check action and field permissions |
| People | `peopleSdk.ts` | Access Global People Registry |
| Document | `documentSdk.ts` | Manage document repository |
| Communication | `communicationSdk.ts` | Messaging and channels |
| Task | `taskSdk.ts` | Task management |
| Calendar | `calendarSdk.ts` | Calendar events |
| Report | `reportSdk.ts` | Report generation |
| Dashboard | `dashboardSdk.ts` | Dashboard widget data |
| Event | `eventSdk.ts` | Event bus publishing |

## Usage Patterns

### 1. Recording a Timeline Event

```typescript
import { timelineSdk } from "@/platform/sdk/timelineSdk";

// In a mutation handler:
await timelineSdk.recordEvent(ctx, {
  module: "crm",
  eventType: "lead.status_changed",
  entityType: "lead",
  entityId: leadId,
  title: "Lead status changed to Converted",
  performedBy: userId,
});
```

### 2. Recording an Audit Log

```typescript
import { auditSdk } from "@/platform/sdk/auditSdk";

// Record a create action:
await auditSdk.recordCreate(ctx, {
  entity: "lead",
  entityId: newLeadId,
  userId: currentUser,
});

// Record an update with changes:
await auditSdk.recordUpdate(ctx, {
  entity: "lead",
  entityId: leadId,
  changes: JSON.stringify({ status: { from: "new", to: "contacted" } }),
  userId: currentUser,
});
```

### 3. Sending a Notification

```typescript
import { notificationSdk } from "@/platform/sdk/notificationSdk";

// Send to a single user:
await notificationSdk.send(ctx, {
  userId: assignedUserId,
  type: "task_assigned",
  title: "New Task Assigned",
  message: "You have been assigned a new task: Review lead",
  referenceId: taskId,
  referenceType: "task",
});

// Send to an entire department:
await notificationSdk.sendToDepartment(ctx, {
  departmentId: departmentId,
  type: "announcement",
  title: "Department Meeting",
  message: "All-hands meeting at 3 PM",
});
```

### 4. Starting a Workflow

```typescript
import { workflowSdk } from "@/platform/sdk/workflowSdk";

const { instanceId } = await workflowSdk.start(ctx, {
  workflowId: approvalWorkflowId,
  triggerSource: "admission_review",
  triggerEntityId: admissionId,
  triggerPayload: JSON.stringify({ amount: 50000 }),
  initiatedBy: userId,
});
```

### 5. Checking Visibility

```typescript
import { visibilitySdk } from "@/platform/sdk/visibilitySdk";

// Check if user can discover leads:
const canView = await visibilitySdk.canDiscover(ctx, {
  userId: currentUser,
  category: "lead",
});

// Get user's default scope:
const scope = await visibilitySdk.getDefaultScope(ctx, {
  userId: currentUser,
});
```

### 6. Checking Permissions

```typescript
import { permissionSdk } from "@/platform/sdk/permissionSdk";

// Check if user can delete:
const canDelete = await permissionSdk.canPerformAction(ctx, {
  userId: currentUser,
  module: "crm",
  action: "delete",
  recordId: leadId,
});

// Apply field masking:
const maskedData = permissionSdk.applyFieldMasking(leadData, fieldPerms);
```

### 7. Publishing an Event

```typescript
import { eventSdk } from "@/platform/sdk/eventSdk";

// Publish a lead conversion event (automatically records timeline + audit):
await eventSdk.publish(ctx, {
  module: "crm",
  eventType: eventSdk.EVENT_TYPES.LEAD_CONVERTED,
  entityType: "lead",
  entityId: leadId,
  performedBy: userId,
  data: JSON.stringify({ convertedToStudent: studentId }),
});
```

## Migration Path

Existing modules that currently call platform services directly (e.g., `ctx.db.insert("timelineEvents", ...)`) should be migrated to use the SDK.

### Step 1: Find direct calls

```bash
# Find all direct timeline inserts:
grep -rn 'ctx.db.insert("timelineEvents"' src/convex/

# Find all direct notification inserts:
grep -rn 'ctx.db.insert("notifications"' src/convex/

# Find all direct audit log inserts:
grep -rn 'ctx.db.insert("auditLogs"' src/convex/
```

### Step 2: Replace with SDK calls

Replace each direct insert with the corresponding SDK method.

### Step 3: Verify

After migration, run the typecheck:

```bash
bun tsc --noEmit
```

## Governance Rules

1. **No direct table access** — Every module must use the SDK for timeline, audit, notification, workflow, visibility, and permission operations.

2. **No bypassing** — Feature branches that add direct `ctx.db.insert` calls to platform tables will be rejected in code review.

3. **Version compatibility** — All SDK methods accept `ctx` as the first parameter. This ensures compatibility with Convex mutation/query context.

4. **Error handling** — SDK methods throw descriptive errors. Modules should catch and handle appropriately.

5. **Extending the SDK** — New SDK methods should be added to the appropriate module. Never add platform logic directly to a business module.
