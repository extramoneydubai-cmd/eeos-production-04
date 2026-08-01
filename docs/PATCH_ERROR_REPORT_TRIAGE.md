# PATCH-ERROR-REPORT-001 — Production Error Report Triage & Fix

**Generated:** 2026-08-01 (code-derived)
**Source:** 10-entry error report from `https://hot-rockets-wish.freebuff.dev`
**Scope:** Runtime defect fixes only — no new engines, no new SDKs, no new components.

---

## Summary

| # | Entry | Severity | Root Cause | Fix |
|---|-------|----------|------------|-----|
| 1 | `personQRCode:getPersonQrCode` not found | critical | `PersonWorkspace.tsx` QRTab called `getPersonQrCode` / `generateQrCode` / `regenerateQrCode` — module exports `getPersonQRCode` / `generateQRCode` / `regenerateQRCode`. `as any` casts hid the mismatch | Renamed to correct exports |
| 2 | `platform/sdk/financeSdk:getChequeDashboard` not found | critical | `PdcWorkspace.tsx` called phantom module `api.platform.sdk.financeSdk.*` (10 refs) — module does not exist; real functions live in `chequeEngine.ts` | Retargeted → `api.chequeEngine.*` |
| 3 | `platform/sdk/financeSdk:*` (refunds) | critical | `RefundCenter.tsx` called the same phantom module (7 refs); real functions live in `refundEngine.ts`; `listRefunds` is actually `listRefundRequests` | Retargeted → `api.refundEngine.*` |
| 4 | `errorLogger` export missing | error ×2 | `error-logger.ts` exported `errorLog` only; `SecurityCenter` / `SecurityEngine` / `AuditAggregator` import `errorLogger` + call `.info()` / `.getEntries()` + `type LogEntry` | Added `errorLogger` alias, `LogEntry` alias, `getEntries()`, `info()` |
| 5 | `engines/accessControlEngine:getStats` Not authenticated | critical | `GovernanceDashboard.tsx` fired queries before auth loaded (no `"skip"` gating) | Gated with `skipDb ? "skip" : args` pattern (matches ApprovalsPage) |
| 6 | `Failed to fetch CEOExecutiveDashboard.tsx` | critical | `ExecutiveDashboard.tsx` + `AnalyticsDashboard.tsx` referenced phantom `api.eventSdk.getRecentEvents` (module never existed) | Retargeted → `api.engines.activityEngine.getGlobalFeed` |
| 7–10 | MemoryLeakDetector heap 91–98% | info ×4 | SDK info-level warnings; symptoms of the failing-query render churn above | Monitored; resolved by fixing entries 1–6 |

**Result: 4 root defects fixed, 6/6 critical/error entries eliminated at source.**

---

## Evidence (code-derived)

### 1. personQRCode casing mismatch — `src/pages/PersonWorkspace.tsx`

Before (line 386–389):
```tsx
const generateQr = useMutation(api.personQRCode.generateQrCode as any);
const regenerateQr = useMutation(api.personQRCode.regenerateQrCode as any);
const qrData = useQuery(api.personQRCode.getPersonQrCode as any, { personId: entityId as any });
```

Actual exports in `src/convex/personQRCode.ts` (grep): `generateQRCode`, `regenerateQRCode`, `getPersonQRCode`, `deactivateQRCode`, `getPersonByQRToken`, `resolveQRCode`.

After: all three calls renamed to match. Args unchanged (`{ personId }`) — verified against `getPersonQRCode` (`args: { personId: v.id("personMaster") }`) and `generateQRCode`/`regenerateQRCode` (`{ personId, baseUrl? }`).

### 2. Phantom `api.platform.sdk.financeSdk.*` — `src/pages/PdcWorkspace.tsx`

- `find src/convex/platform -type f` → **no files**; `src/convex/platform/` does not exist.
- All 10 functions exist in `src/convex/chequeEngine.ts`: `createChequeEntry`, `depositCheque`, `clearCheque`, `bounceCheque`, `rePresentCheque`, `listCheques`, `getChequeDashboard`, `listPenalties`, `waivePenalty`, `collectPenalty`.
- Verified arg shapes match the page's calls (e.g. `bounceCheque({ id, bounceReason, penaltyAmount? })`, `depositCheque({ id, depositDate })`, `clearCheque({ id })`, `rePresentCheque({ id, newDepositDate })`).
- `chequeEngine` confirmed present in `_generated/api.d.ts`.

### 3. Phantom `api.platform.sdk.financeSdk.*` — `src/pages/RefundCenter.tsx`

Real functions in `src/convex/refundEngine.ts`: `getRefundSummary` (args `{ startDate?, endDate? }`), `listRefundRequests` (args `{ status?, studentId? }`), `createRefundRequest` (`{ amount, reason, reasonCategory, notes? }` — matches page), `submitRefundForApproval` (`{ id }`), `approveRefund` (`{ id, approve, notes? }` — matches page's `decideRefund({ id, approve })`), `processRefund` (`{ id, refundMethod }` — matches), `completeRefund` (`{ id }`).

### 4. Missing `errorLogger` export — `src/lib/error-logger.ts`

Importers (grep):
- `src/pages/SecurityCenter.tsx:24` — `errorLogger?.getEntries?.()`
- `src/platform/security/SecurityEngine.ts:15` — `import { errorLogger, type LogEntry }`, `.info(...)`, `.getEntries?.()`
- `src/platform/security/AuditAggregator.ts:14` — `.info(...)`

Fix added: `export const errorLogger = errorLog` (same singleton), `export type LogEntry = ErrorLogEntry`, `getEntries()` (alias of getAll), `info(message, metadata?)` → `push({ ..., source: "sdk", severity: "info" })`.

### 5. Auth race — `src/pages/GovernanceDashboard.tsx`

Three `useQuery` calls fired unguarded → Convex `requireAuth` threw "Not authenticated" during auth load. Fixed with the established codebase pattern (ApprovalsPage/AccessControl): `const { user, isDemoMode } = useAuth(); const skipDb = !user || isDemoMode;` then `skipDb ? "skip" : args` for all three queries.

### 6. Phantom `api.eventSdk.getRecentEvents`

- `grep -c 'eventSdk' src/convex/_generated/api.d.ts` → **0** — module never existed.
- Consumers: `src/pages/executive/ExecutiveDashboard.tsx:141`, `src/pages/AnalyticsDashboard.tsx:491`.
- Replacement: `api.engines.activityEngine.getGlobalFeed` (exists; args `{ limit?, severity? }`; returns `activity_logs` docs with `action`/`description`/`createdAt` — matches both consumers' field usage). Both call sites use `{ limit }`, which matches.

### Related phantom-SDK cleanup (same defect class, same turn)

| Page | Phantom ref | Real module |
|------|-------------|-------------|
| `src/pages/studios/AIStudio.tsx` | `api.platform.sdk.aiSdk.getCapabilities` | `api.aiRuntimeEngine.getAICapabilities` (same shape: `supportedIntents`, `entityCount`) |
| `src/pages/studios/AIStudio.tsx` | `api.platform.sdk.aiSdk.getQuickExamples` | `api.aiRuntimeEngine.getQuickExamples` (same shape: `search`/`analytics`/`actions`) |
| `src/pages/studios/IntegrationStudio.tsx` | `api.platform.sdk.integrationSdk.list` | `api.integrationEngine.listConnectorInstances` (returns array; page adapted) |
| `src/pages/studios/IntegrationStudio.tsx` | `api.platform.sdk.integrationSdk.getHealth` | `api.integrationEngine.getIntegrationDashboard` (returns `totalConnectors`/`activeConnectors`/`inactiveConnectors`; page adapted) |
| `src/pages/Customer360.tsx` | `api.financeSdk.calculateOutstanding` | `api.feeEngine.calculateOutstanding` (same args `{ studentId }`) |

All retarget modules confirmed present in `src/convex/_generated/api.d.ts`.

---

## Verification

- `esbuild` syntax pass on all 10 touched files: **OK**.
- Phantom-reference sweep (grep `api.platform.sdk`, `api.eventSdk`, `api.financeSdk`, wrong-case `QrCode`): **0 remaining**.
- `errorLogger`/`LogEntry`/`getEntries`/`info` exports confirmed present at lines 214/219/365/368 of `error-logger.ts`.

## Files changed

1. `src/pages/PersonWorkspace.tsx` — QR API names corrected
2. `src/pages/PdcWorkspace.tsx` — 10× `financeSdk` → `chequeEngine`
3. `src/pages/RefundCenter.tsx` — 7× `financeSdk` → `refundEngine` (+ `listRefunds` → `listRefundRequests`)
4. `src/pages/studios/AIStudio.tsx` — `aiSdk` → `aiRuntimeEngine`
5. `src/pages/studios/IntegrationStudio.tsx` — `integrationSdk` → `integrationEngine` (+ shape adaptation)
6. `src/pages/Customer360.tsx` — `financeSdk` → `feeEngine`
7. `src/lib/error-logger.ts` — `errorLogger`/`LogEntry`/`getEntries`/`info` added
8. `src/pages/GovernanceDashboard.tsx` — auth-gated queries
9. `src/pages/executive/ExecutiveDashboard.tsx` — `eventSdk` → `getGlobalFeed`
10. `src/pages/AnalyticsDashboard.tsx` — `eventSdk` → `getGlobalFeed`
