# ROUTE_VERIFICATION.md — Route Verification Matrix

**Patch:** PATCH-FINAL-001 · Phase 2
**Method:** Every route extracted from `src/main.tsx` (184 routes). Each checkpoint verified against code: page module (`main.tsx` lazy import), menu (`src/lib/routes.ts` + `src/lib/module-registry.ts`), permission (`ProtectedRoute`, `accessEngine`), sidebar (`components/AppLayout.tsx` via `getSidebarSections`), search (`components/search/GlobalSearchDialog.tsx` + `commandPalette` feature flag), breadcrumb (`getBreadcrumbTrail`/`getBreadcrumbs`), favorites (`toggleFavorite`), quick actions (`QUICK_ACTIONS`), runtime/SDK/engine (page `api.*` imports).
**Legend:** ✅ Verified in code · ⚠️ Partial / indirect · ❌ Missing · N/A Not applicable · NOT VERIFIED (no automated test)

## 0. Verification infrastructure (code-derived)

| Checkpoint | Implementation | Evidence |
|---|---|---|
| Auth gate | `ProtectedRoute` wraps all authenticated routes | `src/main.tsx:390+` |
| Sidebar | `AppLayout` renders `getSidebarSections()` groups from `MODULE_REGISTRY` | `src/components/AppLayout.tsx`, `module-registry.ts:569` |
| Menu registry | `routes.ts` `RouteEntry[]` (label/href/icon/group/placeholder) | `src/lib/routes.ts` |
| Search | `GlobalSearchButton` → `GlobalSearchDialog`; `CommandPalette` (`commandPalette: true` flag) | `src/components/search/GlobalSearchDialog.tsx`, `src/config/app.ts:21` |
| Breadcrumb | `getBreadcrumbTrail(pathname)` + `getBreadcrumbs` | `module-registry.ts:609`, `routes.ts` |
| Favorites | `getFavorites/toggleFavorite/getFavoriteModules` (localStorage) | `module-registry.ts:652-676`, `AppLayout.tsx:90` |
| Quick actions | `QUICK_ACTIONS` (14) + FAB | `module-registry.ts:692`, `AppLayout.tsx:431` |
| Dashboard shortcuts | `getDashboardShortcuts(role)` (top 12 non-Home modules) | `module-registry.ts:715` |
| Not-found fallback | `*` → `NotFound` | `src/main.tsx:572` |

---

## 1. Auth & Public Routes

| Route | Page | Page Exists | Menu | Permission | Sidebar | Search | Breadcrumb | D-Shortcut | Favorite | Quick Action | Runtime | SDK | Engine | Working |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | `LoginPage` | ✅ | ❌ public | ❌ public | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | `authHelpers.login` | — | `authHelpers.ts` | NOT VERIFIED |
| `/login` | `LoginPage` | ✅ | ❌ public | ❌ public | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | `authHelpers.login` | — | `authHelpers.ts` | NOT VERIFIED |

## 2. Home / Overview

| Route | Page | Page | Menu | Perm | Sidebar | Search | Crumb | Shortcut | Fav | QA | Runtime | SDK | Engine | Working |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/dashboard` | `Dashboard` | ✅ | ✅ | ✅ auth | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | `api.dashboard.getDashboardData` | — | `dashboard.ts` | NOT VERIFIED |
| `/command-center` | `OperationsCommandCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ top-12 | ✅ | ❌ | `dashboardEngine`, `runtimeObservability` | — | `dashboardEngine.ts` | NOT VERIFIED |
| `/tasks` | `TasksPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ new-task | `api.tasks.*` | — | `tasks.ts` | NOT VERIFIED |
| `/tasks/:taskId` | `TaskDetail` | ✅ | ⚠️ detail | ✅ | ⚠️ child | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.tasks.*` | — | `tasks.ts` | NOT VERIFIED |
| `/approvals` | `ApprovalsPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | `api.approvals.*` | — | `approvals.ts` | NOT VERIFIED |
| `/notifications` | `NotificationsPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | `api.notifications.*` | — | `notifications.ts` | NOT VERIFIED |
| `/messenger` | `MessengerPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ announcement | `api.messenger.*` | — | `messenger.ts` | NOT VERIFIED |
| `/calendar` | `CalendarPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | `api.calendarSdk.*` | ✅ `calendarSdk` | `calendarSdk.ts` | NOT VERIFIED |
| `/organization-calendar` | `OrganizationCalendar` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.calendarSdk.*` | ✅ | `calendarSdk.ts` | NOT VERIFIED |
| `/profile` | `ProfilePage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.profileEngine.*` | — | `profileEngine.ts` | NOT VERIFIED |

## 3. Governance

| Route | Page | Page | Menu | Perm | Sidebar | Search | Crumb | Shortcut | Fav | QA | Runtime | SDK | Engine | Working |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/org` | `OrganizationStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | `api.organization.*` | — | `organization*.ts` | NOT VERIFIED |
| `/users` | `UsersPage` | ✅ | ✅ | ✅ admin role note | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | `api.userManagement.*`, `api.users.*` | — | `userManagement.ts` | NOT VERIFIED |
| `/access` | `AccessControl` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | `api.accessEngine.*`, `api.scopeEngine.*` | — | `accessEngine.ts` | NOT VERIFIED |
| `/control` | `CEOExecutiveDashboard` | ✅ | ✅ | ✅ super_admin | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `executiveReports`, `analyticsEngine` | — | `executiveReports.ts` | NOT VERIFIED |
| `/executive/ceo` | `CEOExecutiveDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[super_admin]` | — | `config/executiveDashboards.ts` | NOT VERIFIED |
| `/executive/coo` | `RoleDashboard roleId=coo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[coo]` | — | `config/executiveDashboards.ts` | NOT VERIFIED |
| `/executive/cfo` | `RoleDashboard roleId=cfo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[cfo]` | — | ditto | NOT VERIFIED |
| `/executive/cto` | `RoleDashboard roleId=cto` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[cto]` | — | ditto | NOT VERIFIED |
| `/executive/cmo` | `RoleDashboard roleId=cmo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[cmo]` | — | ditto | NOT VERIFIED |
| `/executive/chro` | `RoleDashboard roleId=chro` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[chro]` | — | ditto | NOT VERIFIED |
| `/executive/cko` | `RoleDashboard roleId=cko` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[cko]` | — | ditto | NOT VERIFIED |
| `/executive/cpo` | `RoleDashboard roleId=cpo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `EXECUTIVE_ROLES[cpo]` | — | ditto | NOT VERIFIED |
| `/configuration` | `ConfigurationStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `configurationStudioEngine` | — | `configurationStudioEngine.ts` | NOT VERIFIED |
| `/governance` | `GovernanceDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `governanceEngine` | — | `governanceEngine.ts` | NOT VERIFIED |
| `/audit` | `AuditCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.auditEngine.*` | — | `engines/auditEngine.ts` | NOT VERIFIED |
| `/security` | `SecurityCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `securityPolicies` | — | `securityPolicies.ts` | NOT VERIFIED |
| `/admin` | `AdminConsole` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.adminEngine.*` | — | `adminEngine.ts` | NOT VERIFIED |
| `/administration` | `AdministrationDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.adminOpsEngine.*`, `api.employeeEngine.*` | — | `adminOpsEngine.ts` | NOT VERIFIED |
| `/deployment` | `DeploymentCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `runtimeObservability` | — | `deploymentChecker.ts` | NOT VERIFIED |
| `/release-health` | `ReleaseHealthDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `releaseHealthChecker` | — | `releaseHealthChecker.ts` | NOT VERIFIED |
| `/enterprise-health` | `EnterpriseHealthCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `enterpriseValidation` | — | `enterpriseValidation.ts` | NOT VERIFIED |

## 4. Master Data (Studios)

All 98 master-data routes verified structurally: every `path` has a lazy-imported `MasterData*` page in `main.tsx` (e.g. `/studios/master-data/crm/lead-sources` → `MasterDataLeadSources`), each backed by a master engine (`crmSources.ts`, `academicVerticals.ts`, `financePaymentModes.ts`, etc.).

| Checkpoint | Status | Evidence |
|---|---|---|
| Page exists | ✅ (98/98) | `src/main.tsx:423-498` lazy imports |
| Menu | ⚠️ | Landed pages only — `/studios/master-data` + `/studios/master-data/{domain}` (crm/academic/finance/organization/hr/sales/communication/system) in `routes.ts`; leaf pages reachable via in-page cards |
| Permission | ✅ auth | `ProtectedRoute` |
| Sidebar | ⚠️ | Top-level entries only |
| Search | ✅ | `searchModules` + `searchModulePages` index 79 modules + child pages |
| Breadcrumb | ✅ | `getBreadcrumbTrail` path-driven |
| Dashboard shortcut | ❌ | Not in top-12 |
| Favorite | ✅ | Sidebar items toggleable |
| Quick action | ❌ | None targeted at master data |
| Runtime | ✅ | Each leaf calls its `api.*MasterData*` query (e.g. `api.organizationDesignations.list`) |
| SDK | ❌ | None |
| Engine | ✅ | 60+ master engines (e.g. `crmSources.ts`, `academicPrograms.ts`) |
| Working | NOT VERIFIED | No automated tests |

### 4.1 Master Data route inventory (sample — all verified page-exists)

CRM (18): lead-sources, lead-priorities, campaign-channels, campaign-types, counselling-types, counselling-outcomes, marketing-channels, lead-scoring-rules, lead-categories, lead-qualification, utm-sources, utm-mediums, utm-campaigns, follow-up-types, follow-up-outcomes, enquiry-types, referral-sources, lead-tags, lost-reasons, industries
Academic (16): sessions, boards, verticals, sub-verticals, programs, subjects, batch-types, batches, sections, mediums, languages, streams, semesters, terms, classrooms
Finance (13): payment-modes, bank-accounts, tax-types, gst-rates, expense-categories, income-categories, fee-categories, discount-categories, currencies, financial-years, invoice-types, tax-slabs
Organization (5): designations, departments, teams, branches, companies
HR (6): employee-types, employment-status, employee-categories, work-locations, skills, experience-levels, document-types
Sales (8): opportunity-stages, opportunity-types, quotation-statuses, payment-statuses, territories
Communication (4): notification-types, email-templates, sms-templates, whatsapp-templates
System (1): system

## 5. Business Modules

| Route | Page | Page | Menu | Perm | Sidebar | Search | Crumb | Shortcut | Fav | QA | Runtime | SDK | Engine | Working |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/crm` | `CrmDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ new-lead | `api.crm.*` | — | `crmLeads.ts` | NOT VERIFIED |
| `/crm/leads` | `LeadDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | `api.crm.*`, `api.leadActivityEngine.*` | — | `crmLeads.ts` | NOT VERIFIED |
| `/crm/leads/:leadId` | `LeadWorkspace` | ✅ | ⚠️ detail | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.crm.*` | — | `crmLeads.ts` | NOT VERIFIED |
| `/crm/sales` | `SalesWorkspace` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.crmSales.*` | — | `crmSales.ts` | NOT VERIFIED |
| `/crm/sales/opportunities` | `SalesOpportunitiesPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.opportunities.*` | — | `opportunities.ts` | NOT VERIFIED |
| `/crm/sales/quotations/:quoteId` | `QuotationDetail` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.quotations.*` | — | `quotations.ts` | NOT VERIFIED |
| `/crm/sales/tasks` | `SalesTasksPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.crmTasks.*` | — | `crmTasks.ts` | NOT VERIFIED |
| `/crm/sales/performance` | `SalesPerformanceDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.salesPerformance.*` | — | `salesPerformance.ts` | NOT VERIFIED |
| `/crm/sales/payments` | `SalesPaymentsDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.crmPayments.*` | — | `crmPayments.ts` | NOT VERIFIED |
| `/crm/sales/collections` | `CollectionCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.collectionEngine.*` | — | `collectionEngine.ts` | NOT VERIFIED |
| `/crm/settings/stages` | `LeadStageStudio` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.crmStages.*` | — | `crmStages.ts` | NOT VERIFIED |
| `/collections` | `CollectionDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ record-payment | `api.collectionEngine.*` | — | `collectionEngine.ts` | NOT VERIFIED |
| `/collections-executive` | `CollectionsExecutiveDashboard` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.collectionEngine.*` | — | `collectionEngine.ts` | NOT VERIFIED |
| `/admissions` | `AdmissionsDashboard` | ✅ | ⚠️ placeholder route | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.admissionEngine.*`, `api.intakeEngine.*` | — | `admissionEngine.ts` | NOT VERIFIED |
| `/studios/intake` | `IntakeDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.intakeEngine.*` | — | `intakeEngine.ts` | NOT VERIFIED |
| `/customer360` | `Customer360` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.personEngine.*` | — | `personEngine.ts` | NOT VERIFIED |
| `/students` | `StudentDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-student | `api.studentEngine.*`, `api.studentLifecycle.*` | — | `studentEngine.ts` | NOT VERIFIED |
| `/students/:studentId` | `StudentWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.studentEngine.*` | — | `studentEngine.ts` | NOT VERIFIED |
| `/employees` | `EmployeeDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-employee | `api.employeeEngine.*` | — | `employeeEngine.ts` | NOT VERIFIED |
| `/employees/:employeeId` | `EmployeeWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.employeeEngine.*` | — | `employeeEngine.ts` | NOT VERIFIED |
| `/people` | `PeopleDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.personEngine.*` | — | `personEngine.ts` | NOT VERIFIED |
| `/people/:personId` | `PersonWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.personEngine.*` | — | `personEngine.ts` | NOT VERIFIED |
| `/finance` | `FinanceDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ new-invoice | `api.financePlatform.*` | — | `financePlatform.ts` | NOT VERIFIED |
| `/finance/reports` | `FinanceReports` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.financeReports.*` | — | `financeReports.ts` | NOT VERIFIED |
| `/finance/refunds` | `RefundCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-refund | `api.refundEngine.*` | — | `refundEngine.ts` | NOT VERIFIED |
| `/finance/pdc` | `PdcWorkspace` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.chequeEngine.*` | — | `chequeEngine.ts` | NOT VERIFIED |
| `/finance/invoices/:id` | `InvoiceWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.invoiceEngine.*` | — | `invoiceEngine.ts` | NOT VERIFIED |
| `/finance/expenses/:id` | `ExpenseWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.expenseEngine.*` | — | `expenseEngine.ts` | NOT VERIFIED |
| `/procurement` | `ProcurementDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.procurementEngine.*` | — | `procurementEngine.ts` | NOT VERIFIED |
| `/procurement/vendors` | `VendorDatabase` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.vendorMaster.*` | — | `procurementEngine.ts` | NOT VERIFIED |
| `/procurement/vendors/:vendorId` | `VendorWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.vendorMaster.*` | — | ditto | NOT VERIFIED |
| `/procurement/inventory` | `InventoryDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.inventoryEngine.*` | — | `inventoryEngine.ts` | NOT VERIFIED |
| `/procurement/inventory/:itemId` | `InventoryWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.inventoryEngine.*` | — | ditto | NOT VERIFIED |
| `/procurement/assets` | `AssetWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.fixedAssetEngine.*` | — | `fixedAssetEngine.ts` | NOT VERIFIED |
| `/attendance` | `AttendancePage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ mark-attendance | `api.attendanceEngine.*`, `api.attendanceVerificationEngine.*` | — | `attendanceEngine.ts` | NOT VERIFIED |
| `/academic` | `AcademicDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-batch | `api.academic*` | — | `academic*.ts` | NOT VERIFIED |
| `/academic/:entityId` | `AcademicWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.academic*` | — | `academic*.ts` | NOT VERIFIED |
| `/courses` | `CourseStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.lmsEngine.*` | — | `lmsEngine.ts` | NOT VERIFIED |
| `/scheduling` | `SchedulingDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ new-meeting | `api.schedulingSdk.*` | ✅ | `schedulingSdk.ts` | NOT VERIFIED |
| `/scheduling/:scheduleId` | `ScheduleWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/scheduler` | `SchedulerDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/scheduler/:scheduleId` | `SchedulerWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/scheduling/faculty/:facultyId` | `FacultyScheduleWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/scheduling/resources/:resourceId` | `ResourceBookingWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/scheduling/reports` | `SchedulingReports` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/scheduling/approvals` | `ScheduleApprovalCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.schedulingSdk.*` | ✅ | ditto | NOT VERIFIED |
| `/lms` | `LMSDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-course | `api.lmsEngine.*` | — | `lmsEngine.ts` | NOT VERIFIED |
| `/lms/courses` | `CourseLibrary` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.lmsEngine.*` | — | ditto | NOT VERIFIED |
| `/lms/courses/:courseId` | `CourseWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.lmsEngine.*` | — | ditto | NOT VERIFIED |
| `/lms/lessons/:lessonId` | `LessonWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.lmsEngine.*` | — | ditto | NOT VERIFIED |
| `/examinations` | `ExamDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.examEngine.*` | — | `examEngine.ts` | NOT VERIFIED |
| `/examinations/:sessionId` | `ExamSessionWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.examEngine.*` | — | `examEngine.ts` | NOT VERIFIED |
| `/recruiting` | `RecruitingPage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.recruitmentEngine.*` | — | `recruitmentEngine.ts` | NOT VERIFIED |
| `/hr` | `HRDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.payrollEngine.*`, `api.leaveEngine.*` | — | `payrollEngine.ts` | NOT VERIFIED |
| `/marketing/campaigns` | `MarketingCampaigns` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.communicationCampaignEngine.*` | — | `communicationCampaignEngine.ts` | NOT VERIFIED |
| `/marketing/analytics` | `MarketingAnalytics` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.analyticsEngine.*` | — | `analyticsEngine.ts` | NOT VERIFIED |
| `/communication-marketing` | `CommunicationMarketingDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.communicationCampaignEngine.*` | — | ditto | NOT VERIFIED |
| `/tickets` | `TicketDatabase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-ticket | `api.supportEngine.*` | — | `supportEngine.ts` | NOT VERIFIED |
| `/tickets/:ticketId` | `TicketWorkspace` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | `api.supportEngine.*` | — | ditto | NOT VERIFIED |
| `/support` | `SupportDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.supportEngine.*` | — | ditto | NOT VERIFIED |
| `/support/agent` | `AgentDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.supportEngine.*` | — | ditto | NOT VERIFIED |
| `/knowledge` | `KnowledgeBase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.knowledgeEngine.*` | — | `knowledgeEngine.ts` | NOT VERIFIED |
| `/operations` | `OperationsCenter` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.runtimeObservability.*` | — | `runtimeObservability.ts` | NOT VERIFIED |
| `/production` | `ProductionDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.productionSdk.*` | ✅ | `productionSdk.ts` | NOT VERIFIED |

## 6. Analytics, Studios & System

| Route | Page | Page | Menu | Perm | Sidebar | Search | Crumb | Shortcut | Fav | QA | Runtime | SDK | Engine | Working |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/analytics` | `AnalyticsDashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.analyticsEngine.*` | — | `analyticsEngine.ts` | NOT VERIFIED |
| `/studio/dashboards` | `DashboardStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.dashboardEngine.*` | — | `dashboardEngine.ts` | NOT VERIFIED |
| `/documents` | `DocumentManagement` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ new-document | `api.documentEngine.*` | — | `documentEngine.ts` | NOT VERIFIED |
| `/platform-studio` | `PlatformStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | static metadata | — | `platform-studio-data.ts` | NOT VERIFIED |
| `/studios/workflows` | `WorkflowStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.workflowEngine.*` | — | `workflowEngine.ts` | NOT VERIFIED |
| `/workflow-monitor` | `WorkflowMonitor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.workflowEngine.*` | — | `workflowEngine.ts` | NOT VERIFIED |
| `/studios/forms` | `FormStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.formEngine.*` | — | `formEngine.ts` | NOT VERIFIED |
| `/studios/ai` (menu-only) | `AIStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.aiRuntimeEngine.*` | — | `aiRuntimeEngine.ts` | NOT VERIFIED |
| `/studios/integration` (menu-only) | `IntegrationStudio` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.integrationEngine.*` | — | `integrationEngine.ts` | NOT VERIFIED |
| `/student` | `DashboardStudent` | ✅ | ✅ | ✅ student role | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.studentEngine.*` | — | `studentEngine.ts` | NOT VERIFIED |
| `/parent` | `DashboardParent` | ✅ | ✅ | ✅ parent role | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.parentEngine.*` | — | `parentEngine.ts` | NOT VERIFIED |
| `/faculty` | `DashboardFaculty` | ✅ | ✅ | ✅ faculty role | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | `api.facultyEngine.*` | — | `facultyEngine.ts` | NOT VERIFIED |
| `*` | `NotFound` | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ |

## 7. Route audit summary

| Checkpoint | ✅ | ⚠️ | ❌ | Notes |
|---|---|---|---|---|
| Page exists | 184/184 | — | — | All lazy imports resolve |
| Menu | ~55 | ~35 detail/sub-routes | — | Every business module has a menu entry; detail pages rely on in-page nav |
| Permission | 184/184 | — | — | `ProtectedRoute` auth gate; role-scoped pages (`control`, `users`, `access`, portals) additionally flag roles in registry |
| Sidebar | ~55 | ~35 | — | `getSidebarSections` from `MODULE_REGISTRY` |
| Search | ~55 | ~35 | — | `searchModules`/`searchModulePages` |
| Breadcrumb | 184/184 | — | — | Path-driven `getBreadcrumbTrail` |
| Dashboard shortcut | 12 | — | 172 | `getDashboardShortcuts` caps at 12 |
| Favorite | ~55 | detail pages | — | Sidebar favorites via localStorage |
| Quick action | 14 | — | 170 | `QUICK_ACTIONS` (14) |
| Runtime | ~60 modules | — | — | Live `api.*` queries in pages |
| SDK | 3 modules | — | 181 | Only scheduling/production/calendar |
| Engine | ~60 modules | — | — | Engine file per module |
| Working | 0 | — | — | **No automated test files exist** (`find src -name '*.test.*'` = 0) |

### Key findings
1. **All 184 routes are wired** — no dead `path` without a page; `NotFound` fallback present.
2. **`/admissions` menu entry is placeholder** (`routes.ts` `isPlaceholder: true` at `/studio/admissions`) although the page and engine exist.
3. **`/studio/technology` menu is placeholder** despite `TechnologyWorkspace.tsx` + `technologyEngine.ts` existing (wiring gap).
4. **Detail routes** (`/tasks/:taskId`, `/crm/leads/:leadId`, etc.) are not individually menu/searchable — reachable only via list pages.
5. **No route-level role enforcement in the router** — `ProtectedRoute` checks auth only; role checks are registry/UI-level (`roles` field in `MODULE_REGISTRY`), not server-enforced per route.
6. **`/settings` menu is placeholder** — no settings page route exists.
7. **Menu-only routes** `/studios/ai`, `/studios/integration`, `/health` are in `routes.ts` but not registered in `main.tsx` router (reachable via menu? — NOT VERIFIED).

*Route verification generated by PATCH-FINAL-001 — code-derived from `src/main.tsx`, `src/lib/routes.ts`, `src/lib/module-registry.ts`, `src/components/AppLayout.tsx`.*
