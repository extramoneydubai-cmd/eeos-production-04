# EEOS_PLATFORM_INVENTORY.md — Complete Platform Inventory

**Patch:** PATCH-FINAL-001 · Phase 1
**Method:** Code-derived only — every cell sourced from grep/ripgrep/glob over `src/`.
**Legend:** ✅ Implemented · ⚠️ Partial · ❌ Missing · N/A Not applicable · NOT VERIFIED (no code evidence)

---

## 0. Platform Baseline (code-derived)

| Metric | Value | Evidence |
|--------|-------|----------|
| Schema tables (`defineTable`) | **494** | `src/convex/schema/*.ts` (25 schema files) |
| Top-level Convex engine files | **267** | `src/convex/*.ts` |
| Convex sub-directories | 6 | `engines/`, `organization/`, `integrations/`, `demo/`, `schema/`, `auth/` |
| Core platform runtime files | 72 | `src/platform/**` |
| Page components (routes) | 108 | `src/pages/*.tsx` |
| Studio pages (master data) | 80 | `src/pages/studios/*.tsx` |
| Routes registered | 184 | `src/main.tsx` |
| Event types (EventRegistry) | 209 | `src/convex/eventRegistry.ts` |
| SDK modules | 3 (+2 platform SDK) | `calendarSdk.ts`, `productionSdk.ts`, `schedulingSdk.ts`; `src/platform/core/safeSdk.ts`, `src/platform/sdk/sdkHooks.ts` |
| Module registry entries | 79 | `src/lib/module-registry.ts` |
| Menu registry entries | ~50 | `src/lib/routes.ts` |
| AI entity types | 26 | `aiRuntimeEngine.ts` + `entityEngine.ts` |
| AI role profiles | 8 | `ROLE_AI_PROFILES` (ceo, cfo, hr, faculty, parent, student, counsellor, marketing) |
| Event-pipeline adoption | 10 files | `withEventPipeline` importers |
| Unified pipeline adoption | 16 files | `withScopeAndEvents` importers |
| Platform roles | 4 | `SUPER_ADMIN, ADMIN, MANAGER, STAFF` (`schema/shared.ts`) |

---

## 1. Governance Modules

| Module | Business Owner | Department | Page | Convex Engine | SDK | Schema Tables | Runtime | Dashboard | Notifications | Reports | Workflow | Approval | AI | Search | Timeline | Audit | Health | Menu | Permission | Status | Connected | Reachable | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | CEO | Governance | `Dashboard.tsx` | `dashboard.ts` | — | users, tasks, approvalRequests, notifications, departments, teams, branches, verticals, designations | `dashboard.getDashboardData` | ✅ | ⚠️ unread count only | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ comments feed | ⚠️ via pipeline | ⚠️ counters | ✅ | ✅ role-gated | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/dashboard.ts:4` |
| Command Center | COO | Operations | `OperationsCommandCenter.tsx` | `dashboardEngine`, `runtimeObservability` | — | dashboardWidgets, events | `dashboardEngine.getDashboardData`, `runtimeObservability.getOperationsDashboard` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ events | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/OperationsCommandCenter.tsx` |
| Organization Studio | CEO | Governance | `OrganizationStudio.tsx` | `organization.ts`, `organizationBranches/Companies/Departments/Teams` | — | organizations, orgCompanies, orgBranches, orgDepartments, orgTeams, designations | `api.organization.*` (63 page refs) | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (tree) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/organization*.ts` |
| User Management | CEO | Governance | `UsersPage.tsx` | `userManagement.ts`, `users.ts`, `authHelpers.ts` | — | users, userScopes, sessions, userRoles, actionPermissions | `userManagement.*` (12 refs) | ⚠️ | ✅ reset/disable | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ search users | ❌ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/userManagement.ts` |
| Access Control | CEO | Governance | `AccessControl.tsx` | `accessEngine.ts`, `scopeEngine.ts`, `engines/accessControlEngine.ts` | — | roles, permissions, rolePermissions, userRoles, scopeRules, designationRoles, menuPermissions | `accessEngine.getEffectivePermissions`, `scopeEngine.canAccess` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ⚠️ accessAuditLogs | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/accessEngine.ts:314-413` |
| Configuration Studio | CTO | Technology | `ConfigurationStudio.tsx` | `configurationStudioEngine.ts` | — | systemConfig, featureFlags | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/ConfigurationStudio.tsx` |
| Audit Center | CAO | Governance | `AuditCenter.tsx` | `engines/auditEngine.ts` | — | auditLogs, audit_logs, audit_sessions, audit_entities | `auditEngine.*` (10 queries) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/engines/auditEngine.ts` |
| Security Center | CTO | Technology | `SecurityCenter.tsx` | `securityPolicies.ts` | — | apiKeys, authConfig, securityPolicies | — | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/SecurityCenter.tsx` |
| Admin Console | CEO | Governance | `AdminConsole.tsx` | `adminEngine.ts` | — | systemConfig | `adminEngine.*` (13 refs) | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/AdminConsole.tsx` |
| Governance Dashboard | CEO | Governance | `GovernanceDashboard.tsx` | `governanceEngine.ts` | — | policies/oversight tables | — | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/GovernanceDashboard.tsx` |

---

## 2. Executive Dashboards

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CEO Executive | CEO | Governance | `executive/CEOExecutiveDashboard.tsx` | `executiveReports.ts`, `analyticsEngine` | — | dashboardWidgets, kpiSnapshots, events | `EXECUTIVE_ROLES[super_admin]` widget config | ✅ | ✅ | ✅ daily/weekly/monthly/quarterly/annual | ❌ | ❌ | ⚠️ insights widget | ❌ | ✅ timeline widget | ✅ | ✅ system health | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts:125` |
| COO Executive | COO | Operations | `executive/RoleDashboard.tsx` (roleId=coo) | `executiveReports` | — | dashboardWidgets | `EXECUTIVE_ROLES[coo]` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts:170` |
| CFO Executive | CFO | Finance | `executive/RoleDashboard.tsx` (cfo) | `executiveReports`, `financeReports` | — | dashboardWidgets | `EXECUTIVE_ROLES[cfo]` | ✅ | ⚠️ | ✅ finance reports | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts` |
| CTO Executive | CTO | Technology | `executive/RoleDashboard.tsx` (cto) | `executiveReports`, `technologyEngine`, `runtimeObservability` | — | dashboardWidgets | `EXECUTIVE_ROLES[cto]` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ✅ system health | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts` |
| CMO Executive | CMO | Marketing | `executive/RoleDashboard.tsx` (cmo) | `executiveReports`, `communicationCampaignEngine` | — | dashboardWidgets | `EXECUTIVE_ROLES[cmo]` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts` |
| CKO Executive | CKO | Knowledge | `executive/RoleDashboard.tsx` (cko) | `executiveReports`, `knowledgeEngine` | — | dashboardWidgets | `EXECUTIVE_ROLES[cko]` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts` |
| CPO Executive | CPO | Production | `executive/RoleDashboard.tsx` (cpo) | `executiveReports`, `productionSdk` | `productionSdk` | dashboardWidgets | `EXECUTIVE_ROLES[cpo]` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts` |
| CHRO Executive | CHRO | HR | `executive/RoleDashboard.tsx` (chro) | `executiveReports`, `employeeEngine` | — | dashboardWidgets | `EXECUTIVE_ROLES[chro]` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/config/executiveDashboards.ts` |
| CEO Control Center | CEO | Governance | `ControlCenter.tsx` | `userManagement`, `messenger`, `tasks` | — | users, channels, tasks | — | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ super_admin only | ✅ | ✅ | NOT VERIFIED | `src/pages/ControlCenter.tsx` |

---

## 3. Academic Modules

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Academic Structure | CKO | Academics | `AcademicDatabase.tsx`, `AcademicWorkspace.tsx` | `academicPrograms/Subjects/Batches/...` (15 files) | — | 16 academic tables | `api.academic*` | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/academic*.ts` |
| Course Library | CKO | Academics | `CourseStudio.tsx`, `CourseLibrary.tsx`, `CourseWorkspace.tsx` | `lmsEngine`, `lmsPlatform` | — | lmsCourses, lmsLessons, lmsTopics | `api.lmsEngine.*` | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/CourseStudio.tsx` |
| Timetable & Scheduling | COO | Academics | `SchedulingDashboard.tsx`, `SchedulerWorkspace.tsx`, `ScheduleWorkspace.tsx` | `teacherSchedulingEngine.ts`, `schedulingSdk.ts` | `schedulingSdk` ✅ | scheduling tables (4) | `api.schedulingSdk.getToday` (4 refs) | ✅ | ✅ | ✅ scheduling reports | ⚠️ approvals | ✅ schedule approvals | ⚠️ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/schedulingSdk.ts` |
| Attendance | COO | Academics | `AttendancePage.tsx` | `attendanceEngine.ts`, `attendanceVerificationEngine.ts` | — | attendance | QR/GPS/Face (issueQrToken, markWithGps, registerFace, markWithFace) | ✅ | ✅ | ✅ | ⚠️ rules | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/attendanceVerificationEngine.ts` |
| LMS | CKO | Academics | `LMSDashboard.tsx`, `LessonWorkspace.tsx` | `lmsEngine`, `lmsStudentEngine`, `lmsFacultyEngine` | — | 15 lms tables | `api.lmsEngine.*` | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/lms*.ts` |
| Examinations | CKO | Academics | `ExamDashboard.tsx`, `ExamSessionWorkspace.tsx` | `examEngine.ts`, `marksEngine.ts`, `resultEngine.ts`, `questionPaperEngine.ts`, `revaluationEngine.ts` | — | 21 examination tables | `api.examEngine.*`, `api.marksEngine.*` | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/examEngine.ts` |
| Faculty Portal | CKO | Academics | `DashboardFaculty.tsx` | `facultyEngine.ts` | — | faculty tables | `api.facultyEngine.*` | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ faculty | ✅ | ✅ | NOT VERIFIED | `src/pages/DashboardFaculty.tsx` |

---

## 4. CRM Modules

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lead Center | CMO | Sales/Marketing | `CrmDashboard.tsx`, `LeadDatabase.tsx`, `LeadWorkspace.tsx` | `crmLeads.ts`, `crmStages.ts`, `leadLifecycle.ts`, `leadActivityEngine.ts`, `leadHealthEngine.ts`, `leadConversionEngine.ts`, `leadMeetingEngine.ts`, `leadCommunicationEngine.ts` | — | 61 crm tables (leadMaster, leadTimeline, leadApprovals, leadPayments, opportunities, quotations...) | `api.crm.*` (86 refs) | ✅ | ✅ | ✅ | ✅ pipeline | ✅ lead approvals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ health score | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/crmLeads.ts` |
| Admissions | CMO | Admissions | `AdmissionsDashboard.tsx` | `admissionEngine.ts`, `intakeEngine.ts` | — | admissions, intakeSubmissions, intakeTimeline, studentAdmissions | `api.intakeEngine.*` (8 refs) | ✅ | ✅ | ⚠️ | ✅ intake routing | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/intakeEngine.ts` |
| Customer 360 | CMO | CRM | `Customer360.tsx` | `personEngine.ts`, `relationshipEngine.ts` | — | personProfiles, relationships | `api.personEngine.*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/Customer360.tsx` |
| Sales Center | CMO | Sales | `SalesWorkspace.tsx`, `SalesOpportunitiesPage.tsx`, `QuotationDetail.tsx` | `crmSales.ts`, `opportunities.ts`, `quotations.ts` | — | opportunities, quotations, quotationLineItems, salesTerritories | `api.crmSales.*` | ✅ | ✅ | ✅ | ✅ opportunity pipeline | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/crmSales.ts` |
| Collection Center | CFO | Finance | `CollectionCenter.tsx`, `CollectionDashboard.tsx` | `collectionEngine.ts` | — | payment_plans, payment_installments, payment_commitments | `api.collectionEngine.*` (20 refs) | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/collectionEngine.ts` |

---

## 5. Finance Modules

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Finance | CFO | Finance | `FinanceDashboard.tsx` | `financeEngine.ts`, `financePlatform.ts`, `feeEngine.ts`, `billingEngine.ts`, `invoiceEngine.ts`, `paymentEngine.ts`, `receiptEngine.ts` | — | 49 finance tables (feeInvoices, paymentTransactions, journalEntries, chartOfAccounts...) | `api.financePlatform.*` (11 refs) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/financePlatform.ts` |
| Collections | CFO | Finance | `CollectionsExecutiveDashboard.tsx` | `collectionEngine.ts` | — | paymentTransactions, receipts | `api.collectionEngine.*` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/CollectionsExecutiveDashboard.tsx` |
| Refunds | CFO | Finance | `RefundCenter.tsx` | `refundEngine.ts`, `refundCalcEngine.ts`, `bankReconciliationEngine.ts` | — | refundRequests, refundTransactions, feeRefunds | `api.refundEngine.*` (9 refs) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/refundEngine.ts` |
| PDC & Cheques | CFO | Finance | `PdcWorkspace.tsx` | `chequeEngine.ts`, `pdcLegalEngine.ts` | — | chequeEntries, penaltyEntries, payment_pdcs | `api.chequeEngine.*` (12 refs) | ✅ | ✅ | ✅ | ✅ bounce→penalty→legal | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/chequeEngine.ts` |
| Finance Reports | CFO | Finance | `FinanceReports.tsx` | `financeReports.ts`, `reportEngine.ts` | — | reportDefinitions, savedReports | `api.financeReports.*` (6 refs) | ✅ | ❌ | ✅ | ❌ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/financeReports.ts` |
| GST | CFO | Finance | — | `gstComplianceEngine.ts`, `taxEngine.ts` | — | gstRecords, gstRates, taxRules, taxGroups | — | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ NOT VERIFIED page | ⚠️ | NOT VERIFIED | `src/convex/gstComplianceEngine.ts` |

---

## 6. HR Modules

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Employee Registry | CHRO | HR | `EmployeeDatabase.tsx`, `EmployeeWorkspace.tsx` | `employeeEngine.ts`, `employeeLifecycle.ts`, `employeeSearch.ts` | — | employeeMaster, employeeEmployment, 17 hr tables | `api.employeeEngine.*` (6 refs) | ✅ | ✅ | ✅ | ✅ lifecycle | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/employeeEngine.ts` |
| Recruitment | CHRO | HR | `RecruitingPage.tsx` | `recruitmentEngine.ts`, `candidateEngine.ts`, `interviewEngine.ts`, `offerEngine.ts` | — | candidates, jobPostings, jobRequisitions, interviewRounds, offers | `api.offerEngine.*`, `api.recruitmentEngine.*` | ✅ | ✅ | ✅ | ✅ candidate pipeline | ⚠️ offer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/recruitmentEngine.ts` |
| HR Analytics | CHRO | HR | `HRDashboard.tsx` | `payrollEngine.ts`, `leaveEngine.ts`, `performanceEngine.ts` | — | payrollRecords, leaves, performanceReviews | `api.payrollEngine.*` | ✅ | ✅ | ✅ | ⚠️ leave workflow | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/HRDashboard.tsx` |
| People Registry | CHRO | HR | `PeopleDatabase.tsx`, `PersonWorkspace.tsx` | `personEngine.ts`, `personSearch.ts`, `personQRCode.ts` | — | personProfiles, personQRCode | `api.personEngine.*` (6 refs) | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/personEngine.ts` |

---

## 7. Operations Modules

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Procurement | CPO | Operations | `ProcurementDashboard.tsx`, `VendorDatabase.tsx`, `VendorWorkspace.tsx` | `procurementEngine.ts`, `procurementPlatform.ts` | — | 17 procurement tables (purchaseOrders, purchaseRequisitions, vendorMaster, goodsReceipts...) | `api.procurementEngine.*` | ✅ | ✅ | ✅ | ✅ PR→PO→GRN | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/procurementEngine.ts` |
| Inventory | CPO | Operations | `InventoryDatabase.tsx`, `InventoryWorkspace.tsx` | `inventoryEngine.ts`, `inventoryBranchEngine.ts` | — | inventoryItems, inventoryStock, stockMovements, warehouses, issueRegister | `api.inventoryEngine.*` (6 refs) | ✅ | ✅ | ✅ | ⚠️ stock movement | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/inventoryEngine.ts` |
| Production | CPO | Production | `ProductionDashboard.tsx` | `productionSdk.ts` | `productionSdk` ✅ | production tables | `api.productionSdk.*` | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/productionSdk.ts` |
| Support / Tickets | COO | Support | `SupportDashboard.tsx`, `TicketDatabase.tsx`, `TicketWorkspace.tsx`, `AgentDashboard.tsx` | `supportEngine.ts`, `slaEngine.ts` | — | 16 support tables (ticketMaster, ticketSLA, ticketAutomation, ticketRatings...) | `api.supportEngine.*` (8 refs) | ✅ | ✅ | ✅ | ✅ ticket→SLA→assign→escalate→resolve | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/supportEngine.ts` |
| Knowledge Base | CKO | Knowledge | `KnowledgeBase.tsx` | `knowledgeEngine.ts` | — | knowledgeArticles, knowledgeCategories | `api.knowledgeEngine.*` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/KnowledgeBase.tsx` |
| Operations Center | COO | Operations | `OperationsCenter.tsx` | `runtimeObservability.ts` | — | events, workflowExecutions | `api.runtimeObservability.*` (6 refs) | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/OperationsCenter.tsx` |
| Administration | CAO | Administration | `AdministrationDashboard.tsx` | `adminOpsEngine.ts` | — | visitors, meetingRooms, officeAssets, stationery, housekeepingTasks, securityChecks, utilityBills, amcContracts, vendorVisits, incidentRegister | `api.adminOpsEngine.*` | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ visitor approval | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/schema/adminOps.ts` |
| Technology | CTO | Technology | `TechnologyWorkspace.tsx` | `technologyEngine.ts`, `runtimeObservability` | — | techMetrics, deploymentHistory | `api.technologyEngine.*`, `api.runtimeObservability.*` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ menu placeholder | ✅ | ⚠️ | NOT VERIFIED | `src/pages/TechnologyWorkspace.tsx` |

---

## 8. Communication & Marketing

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Communication & Marketing | CMO | Marketing | `CommunicationMarketingDashboard.tsx` | `communicationCampaignEngine.ts`, `communicationHub.ts`, `whatsappEngine.ts`, `emailEngine.ts`, `smsEngine.ts` | — | campaigns, commCampaigns, communicationQueue, 10 communication tables | `api.communicationCampaignEngine.*` | ✅ | ✅ | ✅ | ✅ campaign workflow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/communicationCampaignEngine.ts` |
| Marketing Campaigns | CMO | Marketing | `MarketingCampaigns.tsx` | `communicationCampaignEngine.ts` | — | campaigns, campaignSchedules | `api.communicationCampaignEngine.*` | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/MarketingCampaigns.tsx` |
| Marketing Analytics | CMO | Marketing | `MarketingAnalytics.tsx` | `analyticsEngine.ts` | — | analyticsSnapshots | `api.analyticsEngine.getModuleDashboardData` | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/MarketingAnalytics.tsx` |
| Messenger | CEO | Communication | `MessengerPage.tsx` | `messenger.ts` | — | channels, messages, directMessages, channelMembers | `api.messenger.*` (15 refs) | ⚠️ | ✅ unread | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/messenger.ts` |

---

## 9. Reports & Analytics

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Reports & Analytics | CEO | Analytics | `AnalyticsDashboard.tsx` | `analyticsEngine.ts`, `reportEngine.ts`, `reportExportEngine.ts`, `reportScheduleEngine.ts`, `reportDesignerEngine.ts` | — | reportDefinitions, savedReports, reportExecutions, reportExports, reportSchedules, kpiSnapshots | `api.analyticsEngine.getModuleDashboardData` (16 refs) | ✅ | ❌ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/analyticsEngine.ts` |
| Dashboard Builder | CEO | Analytics | `DashboardStudio.tsx` | `dashboardEngine.ts`, `dashboardProviders.ts` | — | dashboardLayouts, dashboardWidgets, userDashboardLayouts | `api.dashboardEngine.*` (11 refs) | ✅ | ❌ | ✅ | ❌ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/DashboardStudio.tsx` |
| Executive Reports | CEO | Analytics | `executive/*` | `executiveReports.ts` | — | reportDefinitions | daily/weekly/monthly/quarterly/annual | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/executiveReports.ts:74-544` |

---

## 10. Platform / Studios

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Platform Studio | CEO | Platform | `PlatformStudio.tsx` | `platform-studio-data.ts` (static metadata) | — | metadata tables | platformPages/Tables/Apis/Engines/Automations (static) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/lib/platform-studio-data.ts` |
| Master Data Studio | CEO | Platform | `MasterDataStudio.tsx` + 79 studio pages | 60+ master data engines | — | 60+ master tables | `api.*Master*` | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/studios/*` |
| Workflow Studio | CEO | Platform | `WorkflowStudio.tsx`, `WorkflowMonitor.tsx` | `workflowEngine.ts`, `engines/sequenceEngine.ts` | — | workflowDefinitions, workflowVersions, workflowExecutions, workflowTasks, workflowNodes, workflowEdges | `api.workflowEngine.*` (22 refs) | ✅ | ❌ | ❌ | ✅ define/execute | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/workflowEngine.ts` |
| Form Studio | CEO | Platform | `FormStudio.tsx` | `formEngine.ts` | — | forms, form fields tables | `api.formEngine.*` (15 refs) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/formEngine.ts` |
| Deployment Center | CTO | Technology | `DeploymentCenter.tsx` | `deploymentChecker.ts`, `releaseHealthChecker.ts`, `runtimeObservability` | — | deploymentHistory | `api.runtimeObservability.*` | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | NOT VERIFIED | `src/pages/DeploymentCenter.tsx` |
| Release Health | CTO | Technology | `ReleaseHealthDashboard.tsx` | `releaseHealthChecker.ts`, `releaseVerdict.ts` | — | — | release checks | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/ReleaseHealthDashboard.tsx` |
| Enterprise Health | CTO | Technology | `EnterpriseHealthCenter.tsx` | `enterpriseValidation.ts`, `enterpriseReleaseValidation.ts` | — | — | health checks | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/EnterpriseHealthCenter.tsx` |
| AI Studio | CEO | Platform | `studios/AIStudio.tsx` | `aiRuntimeEngine.ts` | — | — | `processQuery`, `getAICapabilities`, `getRoleAICapabilities`, `getQuickExamples` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/studios/AIStudio.tsx` |
| Integration Studio | CTO | Technology | `studios/IntegrationStudio.tsx` | `integrationEngine.ts`, `integrationAuditEngine.ts` | — | webhooks, apiKeys, integrationAuditRecords | `api.integrationEngine.*` | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | NOT VERIFIED | `src/convex/integrationEngine.ts` |

---

## 11. Portals

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Student Portal | Principal | Academics | `DashboardStudent.tsx` | `studentEngine.ts`, `studentLifecycle.ts`, `studentSearch.ts`, `lmsStudentEngine.ts` | — | studentMaster, studentAcademicProfile, studentTimeline | `api.studentEngine.*`, `api.studentLifecycle.*` | ✅ | ✅ | ⚠️ | ⚠️ enrollment | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ student | ✅ | ✅ | NOT VERIFIED | `src/pages/DashboardStudent.tsx` |
| Parent Portal | Principal | Academics | `DashboardParent.tsx` | `parentEngine.ts` | — | guardianDetails | `api.parentEngine.*` (7 refs) | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ parent | ✅ | ✅ | NOT VERIFIED | `src/pages/DashboardParent.tsx` |
| Faculty Portal | Principal | Academics | `DashboardFaculty.tsx` | `facultyEngine.ts` | — | faculty tables | `api.facultyEngine.*` | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ faculty | ✅ | ✅ | NOT VERIFIED | `src/pages/DashboardFaculty.tsx` |

---

## 12. Home / Personal

| Module | Owner | Dept | Page | Engine | SDK | Tables | Runtime | D | N | R | W | A | AI | S | T | Au | H | Menu | Perm | Status | Con | Reach | Tested | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tasks | CEO | All | `TasksPage.tsx`, `TaskDetail.tsx` | `tasks.ts`, `assignmentEngine.ts` | — | tasks, taskChecklistItems, taskComments, taskParticipants | `api.tasks.*` (16 refs) | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/tasks.ts` |
| Approvals | CEO | All | `ApprovalsPage.tsx` | `approvals.ts`, `crmApprovals.ts` | — | approvalRequests, approvalTemplates, approvalRequestApprovers, leadApprovals | `api.approvals.*` (8 refs) | ✅ | ✅ | ✅ | ✅ sequential/parallel/hierarchy | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/approvals.ts` |
| Notifications | CEO | All | `NotificationsPage.tsx` | `notifications.ts`, `engines/notificationEngine.ts`, `notificationMatrix.ts` | — | notifications, notificationCenter | `api.notifications.*` (9 refs) | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/notifications.ts` |
| Messenger | CEO | All | `MessengerPage.tsx` | `messenger.ts` | — | channels, messages, directMessages | `api.messenger.*` | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/messenger.ts` |
| Calendar | CEO | All | `CalendarPage.tsx` | `calendarSdk.ts` | `calendarSdk` ✅ | calendar tables (2) | `api.calendarSdk.*` (6 refs) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/calendarSdk.ts` |
| Organization Calendar | CEO | All | `OrganizationCalendar.tsx` | `calendarSdk.ts` | `calendarSdk` | calendar tables | `api.calendarSdk.*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/OrganizationCalendar.tsx` |
| Profile | CEO | All | `ProfilePage.tsx` | `profileEngine.ts`, `authHelpers.ts` | — | users, userPreferences | `api.profileEngine.*` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/pages/ProfilePage.tsx` |
| Documents | CAO | All | `DocumentManagement.tsx` | `documentEngine.ts`, `documentTemplateEngine.ts`, `documentAutoGeneration.ts` | — | documents, documentVersions, documentFolders, documentPermissions, documentTimeline | `api.documentEngine.*` | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | NOT VERIFIED | `src/convex/documentEngine.ts` |

---

## 13. Audit Summary

| Dimension | Score | Notes |
|---|---|---|
| Modules fully wired (Route→UI→Engine→Runtime) | ~40 | All 184 routes resolve to a page; ~40 modules have live runtime queries |
| Modules with notifications | ~18 | Via `crmHelpers.createNotification`, `engines/notificationEngine`, event pipeline |
| Modules with timeline | ~14 | Via `withScopeAndEvents`/`withEventPipeline`/`timelineEngine` |
| Modules with audit | ~12 | Via pipeline + `engines/auditEngine` (Audit Center consumers NOT VERIFIED) |
| Modules with workflow | ~10 | workflowEngine (2 pages), pipeline `triggerWorkflow`, domain engines |
| Modules with approvals | ~10 | `approvals.ts` + `crmApprovals.ts` + pipeline |
| Modules with AI | 8 role profiles + generic | `aiRuntimeEngine.processQuery` — metadata only, read-only |
| Modules with search | ~20 | `searchEngine.globalSearch` (GlobalSearchDialog) + autoSearchIndexer |
| Modules with reports | ~12 | `analyticsEngine`, `financeReports`, `executiveReports`, `reportEngine` |
| Modules with health | ~10 | `runtimeObservability`, `dashboardProviders` system health widget |
| Direct `api.engine.*` usage in pages | 80+ | Pages bypass SDK layer — SDK adoption partial |
| SDK modules | 3 | `productionSdk`, `schedulingSdk`, `calendarSdk` only |

### Unverified / Gaps (flagged NOT VERIFIED)
1. **Tested column** — no test files exist (`find src -name '*.test.*'` returned empty). Every module's `Tested` = NOT VERIFIED.
2. **Business owner** — no owner metadata exists in code; owners above are inferred from `ROLE_AI_PROFILES`/demo data.
3. **GST UI** — `gstComplianceEngine.ts` exists but no page routes to it (NOT VERIFIED page).
4. **ruleRuntimeEngine** — only consumed by `aiRuntimeEngine` (rule descriptions), no mutation enforcement loop found.
5. **engines/notificationEngine / timelineEngine / auditEngine** — full CRUD APIs exist; page-level adoption found only via pipeline/`notifications.ts`, not the engines directly.
6. **Technology menu** — `/studio/technology` is `isPlaceholder` in `routes.ts` even though `TechnologyWorkspace.tsx` + `technologyEngine.ts` exist.
7. **Dynamic menu engine** (`menuEngine.ts`) — only consumed by `AccessControlList.tsx`; static menus drive the sidebar.

*Inventory generated by PATCH-FINAL-001 — grep/ripgrep/glob code-derived evidence only.*
