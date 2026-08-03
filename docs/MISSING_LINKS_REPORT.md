# MISSING_LINKS_REPORT.md — Missing Links Audit

**Patch:** PATCH-FINAL-001 · Phase 12
**Method:** All findings code-derived (grep/import graph/route matrix). No assumptions.

---

## 1. Broken / Dead Routes & Placeholder Menus

| # | Issue | Evidence | Impact |
|---|---|---|---|
| 1 | `/studio/admissions` menu is `isPlaceholder: true` | `src/lib/routes.ts` (line ~150) | Menu shows "Coming Soon" though page + admissionEngine exist |
| 2 | `/studio/technology` menu is `isPlaceholder: true` | `src/lib/routes.ts` (line ~235) | TechnologyWorkspace + technologyEngine exist but menu hides them |
| 3 | `/settings` menu is `isPlaceholder: true` | `src/lib/routes.ts` | No settings page route registered |
| 4 | Menu-only routes not in router | `routes.ts` has `/studios/ai`, `/studios/integration`, `/health`; not found in `main.tsx` route list | Clicking may 404 (NOT VERIFIED navigation) |
| 5 | Page files not imported in router | `AccessControlList.tsx`, `AnalyticsPage.tsx`, `Auth.tsx`, `DashboardCEO.tsx`, `DashboardCounselor.tsx`, `Landing.tsx`, `LeadWorkspaceDrawer.tsx`, `TechnologyWorkspace.tsx` | Orphan pages — unreachable (grep of `main.tsx` imports) |

## 2. Disconnected Pages vs Engines

| # | Page | Engine used | Gap |
|---|---|---|---|
| 1 | `GST` — no page | `gstComplianceEngine.ts`, `taxEngine.ts` | Engine exists with zero UI route |
| 2 | `TechnologyWorkspace.tsx` | `technologyEngine`, `adminEngine`, `runtimeObservability` | Page exists but no router entry; menu placeholder |
| 3 | `AdministrationDashboard.tsx` | `employeeEngine`, `offerEngine`, `recruitmentEngine` | HR engines wired instead of `adminOpsEngine` — admin ops UI ⚠️ partial |
| 4 | `DashboardCEO.tsx` / `DashboardCounselor.tsx` | — | Orphan role pages; router uses executive/RoleDashboard instead |

## 3. Direct `api.xxx` Usage (SDK bypass)

| # | Finding | Evidence |
|---|---|---|
| 1 | 80+ direct `api.*` calls in pages (30+ unique APIs) | grep `api\.` in `src/pages/*.tsx`: `api.crm` ×86, `api.organization` ×63, `api.schedulingSdk` ×28, `api.users` ×25, `api.workflowEngine` ×22, `api.collectionEngine` ×20, `api.analyticsEngine` ×18, `api.tasks` ×16, `api.messenger` ×15, `api.formEngine` ×15 … |
| 2 | Only 3 SDK modules exist | `productionSdk`, `schedulingSdk`, `calendarSdk` |
| 3 | SDK layer not standardized | No `PlatformSDK` facade wrapping `api.*` for all modules (PATCH-DELIVERY-001 acceptance item ❌) |

## 4. Disconnected / Dormant Runtimes

| # | Runtime | Consumers | Verdict |
|---|---|---|---|
| 1 | `gridEngine.ts` | 0 pages, 0 engines | Dead code |
| 2 | `ruleRuntimeEngine.ts` | only `aiRuntimeEngine` (describes rules) | Dormant — no enforcement |
| 3 | `businessRulesEngine.ts` | NOT VERIFIED | Dormant |
| 4 | `menuEngine.ts` (dynamic menus) | only `AccessControlList.tsx` | Dormant — sidebar uses static registry |
| 5 | `engines/notificationEngine.ts` | 0 pages (legacy `api.notifications` used) | Dormant vs legacy stack |
| 6 | `engines/commentEngine.ts`, `attachmentEngine.ts`, `activityEngine.ts` | NOT VERIFIED consumers | Dormant (workspaces use module tables) |
| 7 | `automationEngine.ts` | pipeline flag only, no UI | Partial |
| 8 | `src/platform/workflow/*`, `src/platform/support/*`, `src/platform/scheduling/*`, `src/platform/security/*`, `src/platform/release/*`, `src/platform/runtime/*` (34+ files) | no imports from `src/convex`/`src/pages` found | **Dead-weight layer** (NOT VERIFIED bundling — may be tree-shaken/unused) |
| 9 | `crons.disabled.ts` | renamed `.disabled` | Scheduled jobs offline |

## 5. Missing Approvals / Notifications / Reports / Dashboards / AI / Timeline / Permissions

| Module | Approvals | Notifications | Reports | Dashboard | AI | Timeline | Permission gate |
|---|---|---|---|---|---|---|---|
| Technology | ❌ | ⚠️ | ⚠️ | ✅ | ❌ | ⚠️ | ✅ |
| Administration | ⚠️ visitor | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ✅ |
| Messenger | ❌ broadcast approval | ✅ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| GST | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ NOT VERIFIED page |
| Calendar | ❌ event approval | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Profile | N/A | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Organization Studio | N/A | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ |
| Master Data | N/A | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| AI Studio | N/A | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Platform Studio | N/A | ❌ | ❌ | ✅ (self) | ❌ | ❌ | ✅ |

## 6. Missing SDK wiring

| # | Finding | Evidence |
|---|---|---|
| 1 | 3 SDKs only | `productionSdk`, `schedulingSdk`, `calendarSdk` |
| 2 | No SDK for CRM/Finance/HR/Support/Inventory/Attendance | direct `api.*` in those pages |
| 3 | No `PlatformSDK` unified export | missing `src/lib/platform-sdk.ts` facade |

## 7. Missing runtime adoption

| # | Finding |
|---|---|
| 1 | 241/267 convex files (90%) bypass `withScopeAndEvents` (scope/events/timeline/audit/notify) |
| 2 | Grid runtime (0 consumers) — all tables hand-rolled |
| 3 | Rule runtime not enforced |
| 4 | Dynamic menus not used by sidebar |
| 5 | Health platform layer disconnected from convex queries |

## 8. Broken navigation paths (verified reachability)

| # | From → To | Status |
|---|---|---|
| 1 | Menu "Admissions" → `/studio/admissions` | ⚠️ placeholder; real page at `/admissions` |
| 2 | Menu "Technology" → `/studio/technology` | ⚠️ placeholder; real page exists but unrouted |
| 3 | Menu "Settings" → `/settings` | ❌ no route |
| 4 | `/studios/ai` (menu) | ❌ not in router (AI page exists at `studios/AIStudio.tsx`) |
| 5 | `/studios/integration` (menu) | ❌ not in router |
| 6 | `/health` (menu) | ❌ not in router |

## 9. Missing documentation/training

| # | Item | Status |
|---|---|---|
| 1 | Inline tooltips / help system | ❌ none found |
| 2 | Guided tour / first-run wizard | ❌ (`GUIDED_ONBOARDING.md` proposed) |
| 3 | Help center page | ❌ none |
| 4 | Contextual help inventory | ✅ AI quick examples + module registry descriptions exist |

## 10. Priority fix order (recommended)

| Priority | Fix | Effort | Files |
|---|---|---|---|
| P0 | Register orphan pages & fix placeholder menus (`/studio/admissions`, `/studio/technology`, `/settings`, `/studios/ai`, `/studios/integration`, `/health`) | S | `main.tsx`, `routes.ts` |
| P0 | Re-enable crons (`crons.disabled.ts` → `crons.ts`) | S | convex |
| P1 | Adopt unified pipeline on high-traffic engines (support, messenger, marketing, adminOps) | M | 4 engines |
| P1 | Route notifications through `engines/notificationEngine` + matrix (dedupe 4 stacks) | M | notifications layer |
| P2 | Enforce rule runtime in pipeline (thresholds → approval auto-trigger) | M | `withScopeAndEvents`, `ruleRuntimeEngine` |
| P2 | Build `PlatformSDK` facade; migrate top-10 direct `api.*` pages | L | lib + pages |
| P3 | Wire `gridEngine` as generic list runtime | M | grid + pages |
| P3 | Remove/repurpose dead platform layer (34 files) or wire into observability | L | platform/ |
| P3 | Implement onboarding wizard (Phase 11) | M | dashboard + onboardingEngine |

*Missing links report generated by PATCH-FINAL-001 — code-derived.*
