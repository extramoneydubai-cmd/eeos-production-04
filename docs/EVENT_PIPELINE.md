# EEOS Event Pipeline Architecture

## Overview

The Event Pipeline is a middleware layer that **automatically** fires audit logs, timeline events, activity records, workflow events, and notifications every time a mutation executes — WITHOUT the business module writing any of this logic.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT / UI LAYER                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ mutation call
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     withEventPipeline(config)                    │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              1. BUSINESS LOGIC HANDLER                   │   │
│   │          (ctx.db.insert / patch / delete)                │   │
│   │                                                          │   │
│   │           ✅ Returns result to client                    │   │
│   └──────────────────────┬──────────────────────────────────┘   │
│                          │ (on success)                          │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              2. EVENT PIPELINE (auto-fire)               │   │
│   │                                                          │   │
│   │   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│   │   │  📝 Audit   │  │  📋 Timeline  │  │  🔄 Activity │   │   │
│   │   │   Log       │  │   Event      │  │   Record     │   │   │
│   │   └─────────────┘  └──────────────┘  └──────────────┘   │   │
│   │                                                          │   │
│   │   ┌─────────────┐  ┌──────────────┐                     │   │
│   │   │  📡 Event   │  │  🔔 Notif.   │                     │   │
│   │   │   Bus       │  │   (optional) │                     │   │
│   │   └─────────────┘  └──────────────┘                     │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE TABLES                              │
│                                                                  │
│   auditLogs    timelineEvents    activities                      │
│   events       notifications                                    │
└─────────────────────────────────────────────────────────────────┘
```

## The Five Channels

Every mutation automatically fires through these channels:

| # | Channel | Table | Purpose | Always? |
|:-:|---------|-------|---------|:-------:|
| 1 | **Audit** | `auditLogs` | Compliance trail — who did what, when | ✅ Yes |
| 2 | **Timeline** | `timelineEvents` | Entity history — chronological event stream | ✅ Yes |
| 3 | **Activity** | `activities` | User activity feed — what users are doing | ✅ Yes |
| 4 | **Event Bus** | `events` | Inter-module events — pub/sub for other modules | ✅ Yes |
| 5 | **Notification** | `notifications` | User notifications — badges, alerts, in-app | ⚠ Optional |

## Key Design Decisions

### 1. Fail-Safe (Never Break the Business Operation)

The event pipeline is **always secondary** to the business operation. If any event channel fails (e.g., database write error), the error is caught and logged, but the original mutation result is still returned to the client.

```typescript
try {
  // Business logic — primary
  const result = await handler(ctx, args);
  
  // Event pipeline — secondary (must never break business)
  try {
    await fireEvents(ctx, config, args, result);
  } catch (e) {
    console.error("[EventPipeline] Non-critical failure:", e);
  }
  
  return result;
} catch (e) {
  // Business logic failure — propagate to client
  throw e;
}
```

### 2. No Changes to Business Logic

The event pipeline is applied as a **wrapper** around the handler. The handler contains ONLY business logic. No audit/timeline/notification code is placed inside the handler.

### 3. Single Entry Point

There is exactly one pattern for wiring events — `withEventPipeline()`. All modules use the same pattern. No module has custom event logic.

## Usage

### Basic Usage

```typescript
import { withEventPipeline, entityIdFromResult, userIdFromArg, orgScopeFromArg } from "@/platform/eventPipeline";

export const createLead = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    createdBy: v.id("users"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    // ... other fields
  },
  handler: withEventPipeline(
    {
      module: "crm",
      entity: "lead",
      action: "create",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg("createdBy"),
      ...orgScopeFromArg(),
      title: "Lead created",
    },
    async (ctx, args) => {
      // Pure business logic — no event code
      return await ctx.db.insert("leads", {
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        createdBy: args.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});
```

### With Notifications

```typescript
export const assignLead = mutation({
  args: { leadId: v.id("leadMaster"), toUserId: v.id("users"), userId: v.id("users") },
  handler: withEventPipeline(
    {
      module: "crm",
      entity: "lead",
      action: "assign",
      getEntityId: entityIdFromArg("leadId"),
      getUserId: userIdFromArg("userId"),
      shouldNotify: (args) => args.toUserId !== args.userId,
      notificationTitle: "Lead Assigned",
      notificationMessage: (args) => `Lead assigned to you`,
    },
    async (ctx, args) => {
      // Pure business logic
      await ctx.db.patch(args.leadId, { ownerId: args.toUserId, updatedAt: Date.now() });
      return { success: true };
    },
  ),
});
```

### Batch Usage

```typescript
export const bulkAssignLeads = mutation({
  args: { leadIds: v.array(v.id("leadMaster")), toUserId: v.id("users"), userId: v.id("users") },
  handler: withBatchEventPipeline(
    "crm", "lead",
    (args) => args.userId,
    async (ctx, args) => {
      const results: Array<{ entityId: string; action: string }> = [];
      for (const leadId of args.leadIds) {
        await ctx.db.patch(leadId, { ownerId: args.toUserId, updatedAt: Date.now() });
        results.push({ entityId: leadId, action: "assigned" });
      }
      return results;
    },
  ),
});
```

## Existing Direct Event Calls (Pre-Migration)

The following modules currently write events directly instead of using the pipeline:

| Module | File | Direct Events | Migration Priority |
|--------|------|:-------------:|:------------------:|
| CRM | `crmLeads.ts` | `logActivity()`, `createNotification()` | 🔴 P0 |
| CRM | `crmHelpers.ts` | `logActivity()`, `createNotification()` | 🔴 P0 |
| Student | `studentEngine.ts` | `createTimelineEvent()` | 🔴 P0 |
| Student | `studentLifecycle.ts` | `createTimelineEvent()` | 🔴 P0 |
| Finance | `financeEngine.ts` | inline writes | 🟡 P1 |
| Tasks | `tasks.ts` | ✅ migrated to `withScopeAndEvents` (Wave 2) — all 11 mutations wired | ✅ Done |
| Employee | `employeeEngine.ts` | inline writes | 🟡 P1 |

## Event Type Naming Convention

All event types follow the pattern: `{module}.{entity}.{action}`

| Module | Entity | Action | Event Type |
|--------|--------|--------|:----------:|
| crm | lead | create | `crm.lead.create` |
| crm | lead | update | `crm.lead.update` |
| crm | lead | delete | `crm.lead.delete` |
| crm | lead | assign | `crm.lead.assign` |
| student | student | create | `student.student.create` |
| student | student | archive | `student.student.archive` |
| student | student | restore | `student.student.restore` |
| finance | invoice | create | `finance.invoice.create` |
| finance | payment | receive | `finance.payment.receive` |
| hr | employee | onboard | `hr.employee.onboard` |
| tasks | task | create | `tasks.task.create` |
| tasks | task | complete | `tasks.task.complete` |

## Governance Rules

1. **No direct event writes** — Every mutation MUST use `withEventPipeline()`. Code review will reject direct `ctx.db.insert("auditLogs", ...)` or similar calls.

2. **Pipeline failures must never break business** — The event pipeline catches its own errors. Adding `try/catch` around the pipeline is the default, not an exception.

3. **Notifications are opt-in** — Only mutations with `shouldNotify: true` fire notifications. This prevents notification spam.

4. **Pipeline adds <2ms overhead** — All five channels insert single records. No additional queries are performed.

5. **Migration path** — Existing direct event calls should be removed during the next refactoring pass, not mixed with pipeline-wrapped handlers.
