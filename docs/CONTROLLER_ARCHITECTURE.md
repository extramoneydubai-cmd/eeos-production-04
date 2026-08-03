# CONTROLLER_ARCHITECTURE.md — Controller Architecture

**Patch:** PATCH-FINAL-001 · Phase 7
**Method:** Document the actual controller pipeline implemented in code. The canonical controller is the **Unified Enterprise Pipeline** (`withScopeAndEvents.ts`) layered on `src/platform/eventPipeline.ts`. All stages traced to real functions.
**Legend:** ✅ Wired · ⚠️ Optional (config flag) · ❌ Not present

---

## 0. The Canonical Controller Pipeline

```
Input
  ↓
Validation (args schema — convex/values)
  ↓
ScopeEngine authorization (withScopeAndEvents scope gate)
  ↓
Rule Runtime (⚠️ businessRulesEngine — NOT enforced in pipeline)
  ↓
Approval Runtime (⚠️ approvals.createApprovalRequest — not auto-triggered in pipeline)
  ↓
Workflow Runtime (⚠️ triggerWorkflow flag)
  ↓
Business logic handler (module mutation)
  ↓
Events (withEventPipeline → eventRegistry events)
  ↓
Notifications (notificationMatrix routing)
  ↓
Timeline (timelineEvents insert)
  ↓
Audit (auditLogs insert)
  ↓
Database (table insert/patch)
  ↓
Dashboard (dashboardRefreshSignals)
  ↓
AI (query-only metadata — no write path)
```

---

## 1. Controller Stage Detail (code-derived)

### Stage 1 — Input & Validation ✅
- Every mutation declares `args: { ... }` with `convex/values` validators (`v.id`, `v.string`, `v.number`, `v.optional`).
- Evidence: 267 convex files; e.g. `crmLeads.createLead`, `tasks.createTask`.

### Stage 2 — Scope Authorization ✅ (when wrapped)
- `withScopeAndEvents` → `ScopeEngine.forUser(ctx, userId)` → `scope.canWrite/canDelete/canApprove/canRead(entityScope)`.
- Denied → throws `Scope denied: User {id} cannot {operation} {module}.{entity} in scope (...)`.
- **Coverage:** only ~16 files wrap mutations → **~90% of mutations bypass scope enforcement** (NOT VERIFIED at runtime for unwrapped paths).

### Stage 3 — Rule Runtime ⚠️ (dormant)
- `businessRulesEngine.ts` + `ruleRuntimeEngine.ts` define rules (e.g. refund policy `RULE_DEFINITIONS`).
- **No enforcement call found inside `withScopeAndEvents` or any business mutation** → rules are descriptive only.

### Stage 4 — Approval Runtime ⚠️ (manual)
- `approvals.ts` (`createApprovalRequest`, `approveRequest`, `rejectRequest`) + `crmApprovals.ts` (lead/discount approvals).
- Pipeline does **not** auto-create approval requests on threshold; approvals are invoked manually by module code (e.g. `crmApprovals`).
- Modes supported: manual ✅, sequential ✅ (`approvalRequestApprovers` ordering), parallel ✅, hierarchy ⚠️ (reportsTo chain — `getReportingTree` exists in userManagement; enforcement in approval flow NOT VERIFIED).

### Stage 5 — Workflow Runtime ⚠️ (flag-only)
- `withScopeAndEvents` exposes `triggerWorkflow` flag; `workflowEngine` has definitions/versions/executions.
- **No business engine calls `workflowEngine.execute`** — only WorkflowStudio/WorkflowMonitor pages consume workflowEngine.

### Stage 6 — Business Logic ✅
- Module-specific handler (e.g. `crmLeads` insert `leadMaster`, `chequeEngine` insert `chequeEntries`).
- Wrapped by `withEventPipeline` (10 files) or `withScopeAndEvents` (16 files) or unwrapped (~241 files).

### Stage 7 — Events ✅
- `withEventPipeline` (config: module/entity/action) + `eventRegistry.Events` (209 event types across ADMISSION, FINANCE, CRM, MARKETING, HR, ATTENDANCE, EXAM, SUPPORT, etc.).
- `getModuleFromEventType`, `isValidEventType` helpers validate event routing.

### Stage 8 — Notifications ✅/⚠️ (fragmented)
- Pipeline: `ctx.db.insert("notifications", {...})` when `config.shouldNotify && config.notificationTitle`.
- CRM path: `crmHelpers.createNotification` (crmApprovals, crmCalls, crmLeads, crmPayments, opportunities, leadLifecycle, verification).
- `notificationMatrix.ts` defines role-based routing rules (cheque bounce → parent+counsellor+finance+CEO threshold; refund approved → parent+finance; etc.) — **matrix enforcement location NOT VERIFIED** (rules stored in `businessRules` table under `notification_matrix` domain).
- `engines/notificationEngine.ts` (send/broadcast/list/unread) — **no page consumer found** (pages use legacy `api.notifications.*`).

### Stage 9 — Timeline ✅
- Pipeline inserts `timelineEvents` (via `withEventPipeline`).
- Dedicated tables: `entityTimeline`, `studentTimeline`, `leadTimeline`, `examTimeline`, `intakeTimeline`, `documentTimeline`, `ticketTimeline`.
- Query: `timelineEngine.getEntityTimeline` (used by OperationsCommandCenter).

### Stage 10 — Audit ✅
- Pipeline inserts `auditLogs` (with before/after diff payload).
- `engines/auditEngine.ts`: `record`, `getEntityAudit`, `verifyChain`, `getDiff`, `getFieldHistory`, `search`, `getStats` → Audit Center page.
- Tables: `auditLogs`, `audit_logs`, `audit_sessions`, `audit_entities`, `accessAuditLogs`, `permissionAuditLogs`, `integrationAuditRecords`.

### Stage 11 — Database ✅
- Final `ctx.db.insert/patch/delete` inside handler; result `extractIdFromResult` feeds entityId downstream.

### Stage 12 — Dashboard ✅ (signal)
- `withScopeAndEvents` `signalDashboard` → `dashboardRefreshSignals` table; `dashboardLiveRefresh.ts` consumes.
- `dashboardProviders.moduleProviders` (26+ providers) → `getDashboardData`.

### Stage 13 — AI ❌ (read-only)
- `aiRuntimeEngine.processQuery` is a **`query`** — cannot write. No AI mutation exists. AI describes dashboards/SQL hints but does not execute them.

---

## 2. Controller Variants in the Codebase

| Controller | File | Scope gate | Events | Notify | Timeline | Audit | Workflow | Automation | Search index | Dashboard signal | Auto-docs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Unified (recommended) | `withScopeAndEvents.ts` | ✅ | ✅ | ✅ via matrix | ✅ | ✅ | ✅ flag | ✅ flag | ✅ | ✅ | ✅ |
| Event pipeline | `src/platform/eventPipeline.ts` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Batch pipeline | `withBatchEventPipeline` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Legacy CRM | `crmHelpers` | ❌ | ⚠️ manual | ✅ | ⚠️ manual | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Unwrapped | 241 files | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Per-Module Controller Trace (verified examples)

| Module | Controller used | Mutation example | Pipeline stages active |
|---|---|---|---|
| CRM Lead | Unified | `crmLeads` (wraps `withScopeAndEvents`) | 2,6,7,8,9,10,11,12 |
| Admission | Unified | `admissionEngine` | 2,6,7,8,9,10,11,12 |
| Student | Unified | `studentEngine` | 2,6,7,8,9,10,11,12 |
| Fee/Finance | Unified | `feeEngine`, `financeEngine` | 2,6,7,8,9,10,11,12 |
| Refund | Unified | `refundEngine` | 2,6,7,8,9,10,11,12 |
| Collections | Unified | `collectionEngine` | 2,6,7,8,9,10,11,12 |
| Employee | Unified | `employeeEngine` | 2,6,7,8,9,10,11,12 |
| Procurement | Unified | `procurementEngine` | 2,6,7,8,9,10,11,12 |
| Document | Unified | `documentEngine` | 2,6,7,8,9,10,11,12 |
| Exam | Unified | `examEngine` | 2,6,7,8,9,10,11,12 |
| Cheque | Event pipeline | `chequeEngine` | 6,7,8,9,10,11 |
| Task | Event pipeline | `tasks.ts` | 6,7,8,9,10,11 |
| Approval | Event pipeline | `approvals.ts` | 6,7,8,9,10,11 |
| Attendance | Event pipeline | `attendanceEngine` | 6,7,8,9,10,11 |
| Marks | Event pipeline | `marksEngine` | 6,7,8,9,10,11 |
| Support | Legacy/unwrapped | `supportEngine` | 6 (manual notify) |
| Marketing | Legacy/unwrapped | `communicationCampaignEngine` | 6 (manual notify) |
| Messenger | Unwrapped | `messenger.ts` | 6 |
| Admin Ops | Unwrapped | `adminOpsEngine` | 6 |

---

## 4. Controller Gap Analysis

| Gap | Severity | Evidence |
|---|---|---|
| ~90% of mutations bypass unified controller | **Critical** | 26/267 files adopt pipeline |
| Rule Runtime not enforced in pipeline | High | no `ruleRuntimeEngine` call in wrapper |
| Approval not auto-triggered by thresholds | Medium | approvals invoked manually |
| Notification fragmentation (4 stacks) | High | `notifications.ts` vs `engines/notificationEngine` vs `crmHelpers` vs pipeline inserts |
| No AI write path | Medium | `processQuery` is query-only |
| Hierarchy approval enforcement NOT VERIFIED | Medium | `getReportingTree` exists; flow not traced |
| Unwrapped engines lack scope gate | **Critical** | e.g. supportEngine, messenger, adminOpsEngine, communicationCampaignEngine |

*Controller architecture generated by PATCH-FINAL-001 — pipeline code tracing.*
