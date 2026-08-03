# WORKFLOW_BOOK.md — End-to-End Workflow Book

**Patch:** PATCH-FINAL-001 · Phase 4
**Method:** Every step traced to actual code (page → `api.*` → convex engine → table → event/notification). No invented steps. Where a step has no code path, it is marked ❌ NOT WIRED.
**Format:** `Page/Route → Mutation/Query → Table → Event/Notification → Next stage`

---

## W1. LEAD → ADMISSION → STUDENT → ALUMNI (Admission Lifecycle)

**Flow: Website → CRM → Counsellor → Demo → Admission → Fee → Student → Attendance → Certificate → Alumni**

| # | Stage | Code path | Event | Notification |
|---|---|---|---|---|
| 1 | Lead enters CRM | `crmLeads.createLead` (page: LeadDatabase/CrmDashboard) → insert `leadMaster` | `crm.lead.created` | owner via `crmHelpers.createNotification` |
| 2 | Qualify & score | `crmLeadScoringRules` + `leadHealthEngine` → `leadHealthScores` | `crm.lead.qualified` | ❌ |
| 3 | Assign counsellor | `crmLeads.assignLead` → `leadAssignments` | `crm.lead.assigned` | `createNotification(toUserId, "lead", "Lead Assigned")` |
| 4 | Follow-ups | `crmTasks.createLeadTask` / `leadActivityEngine.addTimelineEvent` / `leadMeetingEngine` → `leadTasks`, `leadMeetings`, `leadActivity` | `crm.demo.scheduled` | callback notification (`crmCalls`) |
| 5 | Counselling | `crmCounsellingTypes/Outcomes` → `counselling session` record | `crm.counselling.session` | ❌ |
| 6 | Stage moves | `crmStages` + `leadStageHistory` (Enquiry→Follow-up→Meeting→Negotiation→Won) | `crm.lead.converted` | conversion notification |
| 7 | Demo → Admission | `admissionEngine` (via `withScopeAndEvents`) → `admissions`, `studentAdmissions` | `admission.lead.converted` | admission created → parent/counsellor (notificationMatrix) |
| 8 | Fee structure | `feeEngine.createFeeStructure` → `feeStructures`, `feeInvoices` | `finance.fee.created` | payment due |
| 9 | Student master | `studentEngine` (via `withScopeAndEvents`) → `studentMaster`, `studentAcademicProfile` | `admission.student.created` | parent + branch |
| 10 | Enrollment | `enrollmentEngine` → `lmsEnrollments` | `admission.batch.assigned` | ❌ |
| 11 | Attendance | `attendanceEngine.markAttendance` → `attendance` | `hr.attendance.marked` | daily summary (notificationMatrix) |
| 12 | Certificate | `certificateEngine` → `certificates` | `admission.certificate.issued` | ❌ |
| 13 | Alumni | `alumniEngine` → `alumniRecords` | `admission.alumni.converted` | ❌ |

**Chain completeness:** ✅ 13/13 stages wired. **Blocker:** None. Approval exists at lead level (`crmApprovals`), fee discount level.

---

## W2. ATTENDANCE → RULES → APPROVAL → PAYROLL (Attendance & Payroll)

**Flow: QR → GPS → Face → Rules → Approval → Payroll → Dashboard → AI**

| # | Stage | Code path | Notes |
|---|---|---|---|
| 1 | QR | `attendanceVerificationEngine.issueQrToken` + `verifyQrMark` (AttendancePage) | QR token per entity |
| 2 | GPS | `attendanceVerificationEngine.markWithGps` + `saveGeofence` | geofence check |
| 3 | Face | `attendanceVerificationEngine.registerFace` + `markWithFace` | face registration + mark |
| 4 | Bulk | `attendanceEngine.bulkMarkAttendance` | offline/bulk entry |
| 5 | Rules | `boardRulesEngine` / `businessRulesEngine` — enforcement ❌ NOT WIRED (ruleRuntime dormant) | ⚠️ |
| 6 | Approval | `approvals.createApprovalRequest` (attendance correction) → `approvalRequests` | manual/sequential/parallel |
| 7 | Payroll | `payrollEngine` → `payrollEntries`, `salaryStructures`, `payslips` | attendance-linked? NOT VERIFIED |
| 8 | Dashboard | `runtimeObservability.getOperationsDashboard`, `dashboard.getDashboardData` | attendance % widget |
| 9 | AI | `aiRuntimeEngine.processQuery("Find students below 75% attendance")` → entity=attendance, returns query hint | metadata only |

**Chain completeness:** ✅ Stages 1–4, 8–9 wired. ⚠️ Stage 5 (rule enforcement) dormant. ⚠️ Stage 7 payroll↔attendance link NOT VERIFIED.

---

## W3. REFUND → APPROVAL → FINANCE → BANK → LEDGER (Refund)

**Flow: Application → Approval → Finance → Bank → Ledger → Notification → Timeline → AI Summary**

| # | Stage | Code path | Event | Notification |
|---|---|---|---|---|
| 1 | Apply | `refundEngine` (via `withScopeAndEvents`) → `refundRequests` | `finance.refund.initiated` | requester |
| 2 | Calculate | `refundCalcEngine` → refundable amount | — | — |
| 3 | Approve | `approvals.approveRequest` / pipeline → `approvalRequests` + `approvalRequestApprovers` | `finance.refund.approved` | parent + finance (notificationMatrix) |
| 4 | Finance | `financeEngine`/`financialTransactionEngine` → `paymentTransactions` | `finance.payment.verified` | — |
| 5 | Bank | `bankReconciliationEngine` → `bankTransactions`, `bankStatements` | `finance.bank.reconciled` | — |
| 6 | Ledger | `chartOfAccountsEngine` → `journalEntries` | — | — |
| 7 | Reject | `approvals.rejectRequest` | `finance.refund.rejected` | requester |
| 8 | Timeline | pipeline inserts `timelineEvents`; entity timeline via `timelineEngine.getEntityTimeline` | — | — |
| 9 | AI | `processQuery("refund")` → entity=refund; returns description/quickFilters | — | — |

**Chain completeness:** ✅ 9/9 wired. **Blocker:** none.

---

## W4. PDC & CHEQUE → BOUNCE → PENALTY → LEGAL → RECOVERY (PDC)

**Flow: Receive → Deposit → Bounce → Penalty → Legal → Settlement → Recovery → Write-off → Reports**

| # | Stage | Code path | Event |
|---|---|---|---|
| 1 | Receive | `chequeEngine` (via `withEventPipeline`) → `chequeEntries` | `finance.cheque.received` |
| 2 | Deposit | `chequeEngine` → status deposited | `finance.cheque.deposited` |
| 3 | Clear | `chequeEngine` → cleared | `finance.cheque.cleared` |
| 4 | Bounce | `chequeEngine` → bounced + `penaltyEntries` | `finance.cheque.bounced` |
| 5 | Penalty | `penaltyEntries` + notification | `finance.cheque.penalty` → parent+counsellor+finance+branch+CEO (threshold) |
| 6 | Legal | `pdcLegalEngine` → legal case tracking | `finance.pdc.signed` / settlement |
| 7 | Settlement | `pdcLegalEngine` → settled | `finance.pdc.settled` |
| 8 | Recovery / Write-off | ❌ NOT WIRED (no recovery/write-off mutation found) | ❌ |
| 9 | Reports | `financeReports` → PDC aging, bounce report | — |

**Chain completeness:** ✅ Stages 1–7, 9. ❌ Stage 8 (recovery/write-off) NOT WIRED.

---

## W5. PROCUREMENT → INVENTORY (Procure-to-Pay)

**Flow: Requisition → Quotation → PO → GRN → Stock → Issue → Payment**

| # | Stage | Code path |
|---|---|---|
| 1 | Requisition | `procurementEngine.createPurchaseRequisition` → `purchaseRequisitions`, `requisitionItems` |
| 2 | Quotation compare | `quotations` / `quotationComparisons` |
| 3 | Purchase order | `procurementEngine` → `purchaseOrders`, `purchaseOrderItems` |
| 4 | Goods receipt | `procurementEngine` → `goodsReceipts`, `goodsReceiptItems` |
| 5 | Stock | `inventoryEngine` → `inventoryItems`, `inventoryStock`, `stockMovements`, `warehouses` |
| 6 | Issue | `issueRegister` |
| 7 | Returns | `returnsRegister` |
| 8 | Payment | `paymentRequests` → `paymentTransactions` |

**Chain completeness:** ✅ 8/8 wired. Approval via `approvals` (amount threshold) ⚠️ NOT VERIFIED.

---

## W6. SUPPORT TICKET → SLA → RESOLUTION (Support)

**Flow: Create → Assign → SLA → Escalate → Resolve → CSAT**

| # | Stage | Code path | Event/Notif |
|---|---|---|---|
| 1 | Create | `supportEngine` → `ticketMaster` | ticket created |
| 2 | Assign | `ticketAssignments` / `supportEngine` | assignee notified |
| 3 | SLA | `slaEngine` → `ticketSLA`; `runtimeObservability.getSLABreaches` | breach alert |
| 4 | Escalate | `ticketAutomation` / `escalation` (src/platform/support/EscalationEngine — unverified) | supervisor |
| 5 | Resolve | `supportEngine` → resolved | CSAT (`ticketRatings`) |
| 6 | AI reply | `aiRuntimeEngine` "ticket" entity → suggestions (metadata) | — |

**Chain completeness:** ✅ 5/5 core stages wired. Escalation engine adoption ⚠️ NOT VERIFIED.

---

## W7. RECRUITMENT → ONBOARDING → EXIT (Employee Lifecycle)

**Flow: Requisition → Candidate → Interview → Offer → Join → Onboard → Probation → Confirm → Exit**

| # | Stage | Code path | Event |
|---|---|---|---|
| 1 | Requisition | `jobRequisitions` / `jobPostings` | `hr.application.received` |
| 2 | Candidate | `candidateEngine` → `candidates`, `candidateTimeline` | — |
| 3 | Interview | `interviewEngine` → `interviewRounds` | `hr.interview.scheduled` |
| 4 | Offer | `offerEngine` → `offers` | `hr.offer.extended` / `hr.offer.accepted` |
| 5 | Join | `employeeEngine` (withScopeAndEvents) → `employeeMaster`, `employeeEmployment` | `hr.employee.joined` |
| 6 | Onboard | `onboardingEngine` → `onboardingTasks` | `hr.employee.onboarded` |
| 7 | Probation/Confirm | `employeeLifecycle` | `hr.confirmation.approved` |
| 8 | Exit | `exitEngine` → `exitRecords`, `exitClearanceItems`, `fullFinalSettlements`, `experienceLetters` | exit events |

**Chain completeness:** ✅ 8/8 wired.

---

## W8. EXAMS → RESULTS → CERTIFICATES (Examination)

**Flow: Plan → Timetable → Question Paper → Exam → Marks → Result → Revaluation → Certificate**

| # | Stage | Code path |
|---|---|---|
| 1 | Plan | `examEngine` → `examMaster`, `exams`, `examTimetable` |
| 2 | Question paper | `questionPaperEngine` → `questionBank` |
| 3 | Conduct | `examEngine` → session (`ExamSessionWorkspace`) |
| 4 | Marks | `marksEngine` (withEventPipeline) → `examMarks` |
| 5 | Result | `resultEngine` → `examResults`, `examReportCards` |
| 6 | Revaluation | `revaluationEngine` |
| 7 | Certificate | `certificateEngine` → `certificates` |

**Chain completeness:** ✅ 7/7 wired. Incident handling: `examIncidentEngine`.

---

## W9. MARKETING CAMPAIGN → LEAD (Marketing)

**Flow: Create → Channel → Audience → Launch → Track → Attribution**

| # | Stage | Code path |
|---|---|---|
| 1 | Create | `communicationCampaignEngine` → `campaigns` |
| 2 | Channel | `crmCampaignChannels`, `commTemplates` (email/sms/whatsapp) |
| 3 | Launch | `communicationHub` → `communicationQueue`; `emailEngine`/`smsEngine`/`whatsappEngine` process queues |
| 4 | Track | `marketing.email.opened` / `email.clicked` / `whatsapp.delivered` events |
| 5 | Attribution | `crmUtmSources/Mediums/Campaigns` on lead intake |

**Chain completeness:** ✅ 5/5 wired. Campaign scheduling: `campaignSchedules`.

---

## W10. TASK → APPROVAL (Task Management)

**Flow: Create → Assign → Execute → Review → Done**

| # | Stage | Code path | Event/Notif |
|---|---|---|---|
| 1 | Create | `tasks.createTask` (withEventPipeline) → `tasks`, `taskChecklistItems`, `taskParticipants` | assignee notified |
| 2 | Kanban move | `TasksPage` drag-drop → status update | activity logged |
| 3 | Discussion | `taskComments` (`engines/commentEngine` exists; tasks uses own table) | — |
| 4 | Approval gate | `approvals.createApprovalRequest` linked to task | approval notification |
| 5 | Done | status=done | — |

**Chain completeness:** ✅ 5/5 wired.

---

## W11. INTAKE FORM → LEAD (Inbound Intake)

**Flow: Web form → intakeSubmissions → Transform → Lead**

| # | Stage | Code path |
|---|---|---|
| 1 | Submit | `intakeEngine` → `intakeSubmissions` (+ `intakeTimeline`, `intakeEvents`) |
| 2 | Routing | `intakeRoutingRules` → assign |
| 3 | Duplicate check | `intakeDuplicateRules` |
| 4 | Transform | `intakeTransformMappings` → `crmLeads` |

**Chain completeness:** ✅ 4/4 wired.

---

## W12. DOCUMENT GENERATION (Auto-Docs)

**Flow: Event → Template → Generate → Version → Permission**

| # | Stage | Code path |
|---|---|---|
| 1 | Trigger | `withScopeAndEvents.autoGenerateDocs` (32 document types) |
| 2 | Template | `documentTemplateEngine`, `receiptTemplateEngine` |
| 3 | Generate | `documentAutoGeneration` → `generatedDocuments`, `documentGenerationQueue` |
| 4 | Store | `documentEngine.uploadDocument` → `documents`, `documentVersions` |
| 5 | Permission | `documentEngine.setDocumentPermission` → `documentPermissions` |

**Chain completeness:** ✅ 5/5 wired.

---

## Workflow Coverage Matrix

| Workflow | Stages wired | Missing stages | Approval | Notifications | Timeline | Audit | AI touchpoint |
|---|---|---|---|---|---|---|---|
| W1 Lead→Alumni | 13/13 | — | ✅ lead/discount | ✅ | ✅ | ✅ | ✅ |
| W2 Attendance→Payroll | 7/9 | rule enforcement, payroll link | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| W3 Refund | 9/9 | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| W4 PDC | 8/9 | recovery/write-off | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| W5 Procure-to-Pay | 8/8 | — | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |
| W6 Support | 5/5 | — | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| W7 Employee lifecycle | 8/8 | — | ⚠️ offer | ✅ | ✅ | ✅ | ✅ |
| W8 Exams | 7/7 | — | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |
| W9 Marketing | 5/5 | — | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| W10 Task | 5/5 | — | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| W11 Intake | 4/4 | — | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |
| W12 Auto-docs | 5/5 | — | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |

**Headline:** 12 real workflows mapped; **all major stages wired**; 3 gaps flagged (rule enforcement, PDC recovery/write-off, payroll↔attendance link).

*Workflow book generated by PATCH-FINAL-001 — code-derived stage tracing.*
