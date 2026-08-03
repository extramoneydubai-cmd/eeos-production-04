# USER_JOURNEY_BOOK.md — UAT User Journey Book

**Patch:** PATCH-FINAL-001 · Phase 5
**Method:** Journeys are code-derived — each step maps to a route (`src/main.tsx`), page component, `api.*` call, and engine. Roles verified from `src/convex/seed.ts` (seeded users), `ROLE_AI_PROFILES` (`aiRuntimeEngine.ts`), and `demo/data.ts`.
**Notation:** `Route → Page → api.engine.fn → Table`
**Login baseline:** seeded users — `ceo/admin123`, `cto`, `cfo`, `hrhead`, `arun`, `priya`, `rajesh`, `sneha` (`src/convex/seed.ts:305-460`; passwords seeded via `seedUserPasswords`, `ceo: "admin123"`).

---

## J1. CEO (super_admin) — `ceo` / `admin123`

| Phase | Step | Code path |
|---|---|---|
| Login | Username/password → session | `Login.tsx` → `authHelpers.login` → sessions |
| Daily | Dashboard KPIs | `/dashboard` → `api.dashboard.getDashboardData` |
| Daily | Executive view | `/control` + `/executive/ceo` → `CEOExecutiveDashboard` → `EXECUTIVE_ROLES[super_admin]` widgets (Revenue, Collections, Students, Leads, Employees, Attendance %, Exams, LMS) |
| Daily | Approvals | `/approvals` → `api.approvals.listApprovalRequests` |
| Daily | Command center | `/command-center` → `api.dashboardEngine`, `api.runtimeObservability` |
| Daily | Broadcast | `/messenger` → `api.messenger.*` (announcement) |
| Approvals | Approve/Reject | `approvals.approveRequest/rejectRequest` |
| Reports | Executive reports | `executiveReports.generateDailySummary/getReport` |
| Notifications | Unread badge | `api.notifications.getUnreadCount` |
| Exit | Logout | `authHelpers.logout` |
| AI | "Which branches are underperforming?" | `aiRuntimeEngine.processQuery` (role=ceo, intent=analytics) |

**UAT focus:** role-gating of `/control` (super_admin only per registry), executive widget data freshness, broadcast delivery.

---

## J2. COO — `executive/coo`

| Phase | Step | Code path |
|---|---|---|
| Login | seed user (NOT VERIFIED dedicated coo user; RoleDashboard via /executive/coo) | `RoleDashboard roleId="coo"` → `EXECUTIVE_ROLES[coo]` |
| Daily | Operations KPIs (attendance %, pending tasks, branches) | `EXECUTIVE_ROLES[coo]` widgets |
| Daily | Operations center | `/operations` → `api.runtimeObservability.getOperationsDashboard` |
| Daily | Attendance | `/attendance` → `api.attendanceEngine`, `api.attendanceVerificationEngine` |
| Approvals | Schedule approvals | `/scheduling/approvals` → `api.schedulingSdk.*` |
| Reports | Operations reports | `api.runtimeObservability.*` |
| Exit | Logout | `authHelpers.logout` |

---

## J3. CFO — `cfo`

| Phase | Step | Code path |
|---|---|---|
| Login | seed user `cfo` | `seed.ts:344` |
| Daily | `/executive/cfo` | `EXECUTIVE_ROLES[cfo]` |
| Daily | Collections | `/collections`, `/crm/sales/collections` → `api.collectionEngine` |
| Daily | PDC | `/finance/pdc` → `api.chequeEngine` |
| Daily | Refunds | `/finance/refunds` → `api.refundEngine` |
| Approvals | Finance approvals | `approvals.*` + `crmApprovals.*` |
| Reports | Finance reports | `/finance/reports` → `api.financeReports` |
| AI | "Show collection efficiency by branch" | `processQuery` (role=cfo) |

---

## J4. CTO — `cto`

| Phase | Step | Code path |
|---|---|---|
| Login | seed user `cto` | `seed.ts:325` |
| Daily | `/executive/cto` | `EXECUTIVE_ROLES[cto]` (system health widget) |
| Daily | Technology workspace | `/studio/technology` (⚠️ menu placeholder) → `TechnologyWorkspace` → `api.technologyEngine`, `api.runtimeObservability` |
| Daily | Deployment | `/deployment` → `DeploymentCenter` → `api.runtimeObservability` |
| Reports | Release health | `/release-health` → `api.releaseHealthChecker` |
| Monitor | Workflow monitor | `/workflow-monitor` → `api.workflowEngine` |

---

## J5. CMO — `cmo` (marketing)

| Phase | Step | Code path |
|---|---|---|
| Daily | `/executive/cmo` | `EXECUTIVE_ROLES[cmo]` |
| Daily | Campaigns | `/marketing/campaigns` → `api.communicationCampaignEngine` |
| Daily | Leads | `/crm/leads` → `api.crm.*` |
| Reports | Marketing analytics | `/marketing/analytics` → `api.analyticsEngine` |
| AI | "Which campaign had best ROI?" | `processQuery` (role=marketing) |

---

## J6. CKO — `cko` (knowledge/academics)

| Phase | Step | Code path |
|---|---|---|
| Daily | `/executive/cko` | `EXECUTIVE_ROLES[cko]` |
| Daily | Academic structure | `/academic` → `api.academic*` |
| Daily | LMS | `/lms` → `api.lmsEngine` |
| Daily | Exams | `/examinations` → `api.examEngine` |
| Reports | Course/result reports | `api.reportEngine` |

---

## J7. CPO — `cpo` (production)

| Phase | Step | Code path |
|---|---|---|
| Daily | `/executive/cpo` | `EXECUTIVE_ROLES[cpo]` |
| Daily | Production | `/production` → `api.productionSdk` (✅ SDK) |
| Daily | Procurement | `/procurement` → `api.procurementEngine` |
| Reports | Production reports | `api.productionSdk` |

---

## J8. CHRO — `chro` (HR)

| Phase | Step | Code path |
|---|---|---|
| Login | `hrhead` (closest seeded) | `seed.ts:363` |
| Daily | `/executive/chro` | `EXECUTIVE_ROLES[chro]` |
| Daily | Employees | `/employees` → `api.employeeEngine` |
| Daily | Recruiting | `/recruiting` → `api.recruitmentEngine`, `api.candidateEngine`, `api.interviewEngine`, `api.offerEngine` |
| Daily | HR dashboard | `/hr` → `api.payrollEngine`, `api.leaveEngine` |
| AI | "Which employees have excess leave?" | `processQuery` (role=hr) |

---

## J9. Principal / Branch Head

| Phase | Step | Code path |
|---|---|---|
| Daily | Branch view | `branchMetrics` table; `EXECUTIVE_ROLES[coo]`-style branch widgets (NOT VERIFIED dedicated role) |
| Daily | Academic database | `/academic` |
| Daily | Students | `/students` → `api.studentEngine` |
| Approvals | `approvals.*` | branch-scoped (scopeEngine) |
| Reports | `api.analyticsEngine` | branch metrics |

---

## J10. Counsellor — `arun` (seeded staff, counsellor persona in demo data)

| Phase | Step | Code path |
|---|---|---|
| Login | seed user | `seed.ts:382` |
| Daily | Lead workspace | `/crm/leads` → `api.crm.*`; `/crm/leads/:leadId` → LeadWorkspace |
| Daily | Follow-up tasks | `api.leadActivityEngine`, `api.crmTasks` |
| Daily | Meetings | `api.leadMeetingEngine` |
| Approvals | Lead discount approval | `api.crmApprovals` |
| Reports | Conversion metrics | `counselorMetrics` table |
| AI | "Prioritize my follow-up calls today" | `processQuery` (role=counsellor) |

---

## J11. Reception / Operations Staff — `priya`/`rajesh`/`sneha` (seeded staff)

| Phase | Step | Code path |
|---|---|---|
| Daily | Intake | `/studios/intake` → `api.intakeEngine` (submissions, routing) |
| Daily | Visitors (admin ops) | `adminOpsEngine` → visitors, QR (`personQRCode`) |
| Daily | Attendance desk | `/attendance` → `api.attendanceVerificationEngine` (QR/GPS/face) |

---

## J12. Faculty — `DashboardFaculty`

| Phase | Step | Code path |
|---|---|---|
| Login | role=faculty | `/faculty` → `DashboardFaculty` → `api.facultyEngine` |
| Daily | My classes | `api.facultyEngine` + `api.schedulingSdk` (faculty schedule) |
| Daily | Mark attendance | `/attendance` → `api.attendanceEngine.markAttendance` |
| Daily | LMS | `/lms` → `api.lmsFacultyEngine` |
| Exams | Marks entry | `/examinations` → `api.marksEngine` |
| AI | "Find students below 75% attendance" | `processQuery` (role=faculty) |

---

## J13. Student — `DashboardStudent`

| Phase | Step | Code path |
|---|---|---|
| Login | role=student | `/student` → `DashboardStudent` → `api.studentEngine`, `api.studentLifecycle` |
| Daily | Timetable/classes | `api.schedulingSdk`, `api.lmsStudentEngine` |
| Daily | LMS progress | `/lms` → `api.lmsStudentEngine` |
| Exams | Results/hall tickets | `/examinations` → `api.examEngine`, `api.certificateEngine` |
| AI | "What is my timetable this week?" | `processQuery` (role=student) |

---

## J14. Parent — `DashboardParent`

| Phase | Step | Code path |
|---|---|---|
| Login | role=parent | `/parent` → `DashboardParent` → `api.parentEngine` (7 refs) |
| Daily | Child progress | `api.parentEngine` + `api.studentEngine` |
| Fees | Pending fees | `api.feeEngine` / `api.receiptEngine` |
| Communication | Contact faculty | `api.messenger` / `api.communicationHub` |
| AI | "How is my child performing this term?" | `processQuery` (role=parent) |

---

## J15. Accountant — `cfo` team (finance staff persona)

| Phase | Step | Code path |
|---|---|---|
| Daily | Receipts | `/collections` → `api.collectionEngine`, `api.receiptEngine` |
| Daily | Payments | `api.paymentEngine` → `paymentTransactions` |
| Daily | PDC deposit | `/finance/pdc` → `api.chequeEngine` |
| Daily | Refunds | `/finance/refunds` → `api.refundEngine` |
| Reports | Cash book | `api.financeReports` → cashBookEntries |

---

## J16. Operations Lead — `OperationsCenter`

| Phase | Step | Code path |
|---|---|---|
| Daily | Runtime health | `/operations` → `api.runtimeObservability` (queues, workflow health, SLA breaches) |
| Daily | Command center | `/command-center` → `api.dashboardEngine`, `api.runtimeObservability` |
| Escalations | SLA breach review | `getSLABreaches` |

---

## J17. HR Executive — `hrhead`

| Phase | Step | Code path |
|---|---|---|
| Daily | Employee records | `/employees` → `api.employeeEngine` |
| Daily | Leave | `api.leaveEngine` → `leaveApplications`, `leaveBalances` |
| Daily | Payroll | `api.payrollEngine` → `payrollEntries`, `payslips` |
| Exit | Offboarding | `api.exitEngine` → `exitRecords`, `exitClearanceItems` |

---

## J18. Finance Analyst — `FinanceDashboard`

| Phase | Step | Code path |
|---|---|---|
| Daily | Finance dashboard | `/finance` → `api.financePlatform` |
| Daily | Invoices | `/finance/invoices/:id` → `api.invoiceEngine` |
| Daily | Expenses | `/finance/expenses/:id` → `api.expenseEngine` |
| Reports | Finance reports | `/finance/reports` → `api.financeReports` |
| AI | "Anomalies in GST filings" | `processQuery` (role=cfo intent=anomaly) |

---

## J19. Marketing Executive — `MarketingCampaigns`

| Phase | Step | Code path |
|---|---|---|
| Daily | Campaigns | `/marketing/campaigns` → `api.communicationCampaignEngine` |
| Daily | Lead sources | `api.crmSources`, `api.crmUtm*` |
| Reports | Analytics | `/marketing/analytics` → `api.analyticsEngine` |
| AI | "Segment leads by source" | `processQuery` (role=marketing) |

---

## J20. Support Agent — `AgentDashboard`

| Phase | Step | Code path |
|---|---|---|
| Daily | Ticket queue | `/support/agent` → `AgentDashboard` → `api.supportEngine` |
| Daily | SLA tracking | `api.slaEngine` → `ticketSLA` |
| Resolve | Close ticket | `api.supportEngine` → resolved → `ticketRatings` CSAT |
| AI | Reply suggestions | `processQuery` (entity=ticket) |

---

## J21. Vendor — `VendorDatabase`/`VendorWorkspace`

| Phase | Step | Code path |
|---|---|---|
| Daily | Vendor master | `/procurement/vendors` → `api.vendorMaster` |
| Docs | Quotations/PO | `api.quotations`, `api.procurementEngine` → `purchaseOrders` |

---

## J22. Visitor — `adminOpsEngine`

| Phase | Step | Code path |
|---|---|---|
| Entry | Register visitor | `adminOpsEngine` → `visitors` (QR via `personQRCode`) |
| Approve | Visitor approval | `adminOpsEngine` (visitor approval workflow ⚠️ partial) |
| Track | Vendor visits | `vendorVisits` |

---

## UAT Acceptance Criteria (cross-role)

| Criterion | Check | Evidence |
|---|---|---|
| Every role has a login path | ✅ | `authHelpers.login` + seeded users |
| Every role reaches its dashboard | ✅ | 9 executive routes + 3 portal routes |
| Approvals accessible | ✅ | `/approvals` shared; role-scoped via scopeEngine |
| Reports accessible | ⚠️ | Reports at `/analytics`, `/finance/reports`, `/scheduling/reports`; no per-role report pages |
| Notifications accessible | ✅ | `/notifications` + header unread badge |
| Exit (logout) | ✅ | `authHelpers.logout` |
| AI per role | ✅ 8 profiles | `ROLE_AI_PROFILES` (ceo, cfo, hr, faculty, parent, student, counsellor, marketing) |
| Dedicated UAT user per role | ⚠️ | Only ceo/cto/cfo/hrhead + 4 staff seeded; CMO/CKO/CPO/CHRO/Principal/Student/Parent/Vendor roles have no seeded login (demo/data.ts has personas but no auth credentials for all) |

**Headline:** 22 role journeys mapped; 8 AI role profiles; **UAT credential gap** for C-suite roles beyond CEO/CTO/CFO/HR and all portal/vendor/visitor personas.

*User journey book generated by PATCH-FINAL-001 — route + engine code-derived tracing.*
