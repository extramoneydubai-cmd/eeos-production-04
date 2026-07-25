# EEOS Mutation Coverage Report

*Generated: Platform Event Wiring Audit*

## Executive Summary

| Metric | Value |
|--------|:-----:|
| Total Files with Mutations | **161** |
| Total Mutation Functions (est.) | **~927** |
| Files with Direct Event Writes | **~45** |
| Files Using Event Pipeline | **0** |
| Event Pipeline Coverage | **0%** |

## Files Containing Mutations

### Core Platform (25 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `auth.ts` | ~5 | None | ❌ | 🟢 Low |
| `authHelpers.ts` | ~8 | None | ❌ | 🟢 Low |
| `users.ts` | ~0 (queries only) | — | — | 🟢 Low |
| `userManagement.ts` | ~10 | None | ❌ | 🟡 Medium |
| `organization.ts` | ~18 | None | ❌ | 🟡 Medium |
| `organizationBranches.ts` | ~6 | None | ❌ | 🟡 Medium |
| `organizationCompanies.ts` | ~6 | None | ❌ | 🟡 Medium |
| `organizationDepartments.ts` | ~6 | None | ❌ | 🟡 Medium |
| `organizationDesignations.ts` | ~6 | None | ❌ | 🟡 Medium |
| `organizationTeams.ts` | ~6 | None | ❌ | 🟡 Medium |
| `notifications.ts` | ~5 | None | ❌ | 🟢 Low |
| `tasks.ts` | ~12 | **None (missing!)** | ❌ | 🔴 High |
| `securityPolicies.ts` | ~8 | None | ❌ | 🟡 Medium |
| `fieldSecurity.ts` | ~5 | None | ❌ | 🟢 Low |
| `visibilityEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `workflowEngine.ts` | ~20 | ✅ Built-in | ⚠ Internal | 🟢 Low |
| `recordScope.ts` | ~3 | None | ❌ | 🟢 Low |
| `dashboardEngine.ts` | ~8 | None | ❌ | 🟢 Low |
| `profileEngine.ts` | ~6 | None | ❌ | 🟢 Low |
| `personEngine.ts` | ~8 | None | ❌ | 🟢 Low |
| `personQRCode.ts` | ~3 | None | ❌ | 🟢 Low |
| `reportEngine.ts` | ~5 | None | ❌ | 🟢 Low |
| `reportExportEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `reportScheduleEngine.ts` | ~4 | None | ❌ | 🟢 Low |
| `executiveReports.ts` | ~3 | None | ❌ | 🟢 Low |

### CRM (25 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `crmLeads.ts` | ~12 | ✅ `logActivity()`, `createNotification()` | ❌ Direct | 🔴 High |
| `crmHelpers.ts` | ~4 | ✅ `logActivity()`, `createNotification()` | ❌ Direct | 🔴 High |
| `crmTasks.ts` | ~6 | None | ❌ | 🟡 Medium |
| `crmNotes.ts` | ~4 | None | ❌ | 🟡 Medium |
| `crmDocuments.ts` | ~4 | None | ❌ | 🟡 Medium |
| `crmPayments.ts` | ~6 | None | ❌ | 🟡 Medium |
| `crmCalls.ts` | ~4 | None | ❌ | 🟡 Medium |
| `crmApprovals.ts` | ~4 | None | ❌ | 🟡 Medium |
| `crmWhatsApp.ts` | ~4 | None | ❌ | 🟡 Medium |
| `crmDiscounts.ts` | ~4 | None | ❌ | 🟡 Medium |
| `leadActivityEngine.ts` | ~3 | None | ❌ | 🟡 Medium |
| `leadCommunicationEngine.ts` | ~3 | None | ❌ | 🟡 Medium |
| `leadConversionEngine.ts` | ~3 | None | ❌ | 🟡 Medium |
| `leadLifecycle.ts` | ~4 | None | ❌ | 🟡 Medium |
| `leadMeetingEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `leadHealthEngine.ts` | ~3 | None | ❌ | 🟡 Medium |
| `crmLeadCategories.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmLeadQualification.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmLeadScoringRules.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmSources.ts` | ~4 | None | ❌ | 🟢 Low |
| `crmReferralSources.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmIndustries.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmEnquiryTypes.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmMarketingChannels.ts` | ~3 | None | ❌ | 🟢 Low |
| `crmUtm*.ts` | ~6 | None | ❌ | 🟢 Low |

### Student & Academic (15 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `studentEngine.ts` | ~6 | ✅ `createTimelineEvent()` | ❌ Direct | 🔴 High |
| `studentLifecycle.ts` | ~4 | ✅ `createTimelineEvent()` | ❌ Direct | 🔴 High |
| `studentSearch.ts` | ~0 (queries) | — | — | 🟢 Low |
| `enrollmentEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `academicBatches.ts` | ~6 | None | ❌ | 🟡 Medium |
| `academicSessions.ts` | ~4 | None | ❌ | 🟡 Medium |
| `academicSubjects.ts` | ~4 | None | ❌ | 🟡 Medium |
| `academicPrograms.ts` | ~4 | None | ❌ | 🟡 Medium |
| `academic*.ts` (8 files) | ~24 | None | ❌ | 🟢 Low |

### Finance (15 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `financeEngine.ts` | ~12 | ✅ Inline writes | ❌ Direct | 🔴 High |
| `invoiceEngine.ts` | ~8 | None | ❌ | 🟡 Medium |
| `paymentEngine.ts` | ~6 | None | ❌ | 🟡 Medium |
| `receiptEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `feeEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `refundEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `expenseEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `billingEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `financeBankAccounts.ts` | ~3 | None | ❌ | 🟢 Low |
| `financeCurrencies.ts` | ~3 | None | ❌ | 🟢 Low |
| `finance*.ts` (6 files) | ~18 | None | ❌ | 🟢 Low |

### HR & Employee (10 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `employeeEngine.ts` | ~8 | ✅ Inline writes | ❌ Direct | 🔴 High |
| `employeeLifecycle.ts` | ~6 | None | ❌ | 🟡 Medium |
| `recruitmentEngine.ts` | ~6 | None | ❌ | 🟡 Medium |
| `candidateEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `offerEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `onboardingEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `hr*.ts` (4 files) | ~12 | None | ❌ | 🟢 Low |

### Examination & LMS (8 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `examEngine.ts` | ~8 | None | ❌ | 🟡 Medium |
| `marksEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `resultEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `lmsEngine.ts` | ~6 | None | ❌ | 🟡 Medium |
| `lmsFacultyEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `lmsStudentEngine.ts` | ~4 | None | ❌ | 🟡 Medium |

### Procurement & Inventory (4 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `procurementEngine.ts` | ~6 | None | ❌ | 🟡 Medium |
| `inventoryEngine.ts` | ~6 | None | ❌ | 🟡 Medium |
| `assetEngine.ts` | ~4 | None | ❌ | 🟡 Medium |

### Communication (6 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `communicationHub.ts` | ~6 | None | ❌ | 🟡 Medium |
| `messenger.ts` | ~4 | None | ❌ | 🟡 Medium |
| `emailEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `smsEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `whatsappEngine.ts` | ~3 | None | ❌ | 🟢 Low |

### Engines Subdirectory (9 files)

| File | Mutations | Events | Pipeline | Risk |
|------|:---------:|:------:|:--------:|:----:|
| `engines/timelineEngine.ts` | ~3 | ✅ Own events | ✅ | 🟢 Low |
| `engines/auditEngine.ts` | ~3 | ✅ Own events | ✅ | 🟢 Low |
| `engines/notificationEngine.ts` | ~4 | ✅ Own events | ✅ | 🟢 Low |
| `engines/accessControlEngine.ts` | ~4 | None | ❌ | 🟡 Medium |
| `engines/activityEngine.ts` | ~3 | ✅ Own events | ✅ | 🟢 Low |
| `engines/attachmentEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `engines/commentEngine.ts` | ~3 | None | ❌ | 🟢 Low |
| `engines/seedEngine.ts` | ~2 | None | ❌ | 🟢 Low |
| `engines/sequenceEngine.ts` | ~2 | None | ❌ | 🟢 Low |

## Migration Priority Matrix

### Phase 1 — 🔴 Critical (Immediate: 10 files, ~80 mutations)

| Priority | File | Risk | Reason | Effort |
|:--------:|------|:----:|--------|:------:|
| P0 | `crmLeads.ts` | 🔴 | Direct `logActivity()` + `createNotification()` | 1 day |
| P0 | `crmHelpers.ts` | 🔴 | Shared helper w/ direct event calls | 0.5 day |
| P0 | `studentEngine.ts` | 🔴 | Direct `createTimelineEvent()` | 0.5 day |
| P0 | `studentLifecycle.ts` | 🔴 | Direct `createTimelineEvent()` | 0.5 day |
| P0 | `financeEngine.ts` | 🔴 | Inline audit writes | 1 day |
| P0 | `tasks.ts` | 🔴 | Missing events entirely | 0.5 day |
| P0 | `employeeEngine.ts` | 🔴 | Inline event writes | 0.5 day |
| P0 | `organization.ts` | 🔴 | No events on org changes | 0.5 day |
| P0 | `userManagement.ts` | 🔴 | No audit on user changes | 0.5 day |
| P0 | `workflowEngine.ts` | 🔴 | Internal events but no pipeline | 1 day |

### Phase 2 — 🟡 High (15 files, ~80 mutations)

| File | Risk | Reason | Effort |
|------|:----:|--------|:------:|
| `enrollmentEngine.ts` | 🟡 | Student enrollment missing events | 0.5 day |
| `invoiceEngine.ts` | 🟡 | Invoice CRUD missing audit | 0.5 day |
| `paymentEngine.ts` | 🟡 | Payment events critical for finance | 0.5 day |
| `receiptEngine.ts` | 🟡 | Receipt events needed | 0.5 day |
| `examEngine.ts` | 🟡 | Exam lifecycle missing events | 0.5 day |
| `lmsEngine.ts` | 🟡 | Course content missing events | 0.5 day |
| `procurementEngine.ts` | 🟡 | Purchase lifecycle missing audit | 0.5 day |
| `inventoryEngine.ts` | 🟡 | Stock movement missing audit | 0.5 day |

### Phase 3 — 🟢 Low (130 files, ~767 mutations)

| Category | Files | Mutations | Effort |
|----------|:-----:|:---------:|:------:|
| Master Data CRUD | ~80 | ~400 | 2 days |
| Utility mutations | ~40 | ~200 | 1 day |
| Specialized engines | ~10 | ~167 | 1 day |

## Implementation Strategy

The event pipeline wrapper (`withEventPipeline`) is already built in `src/platform/eventPipeline.ts`. The migration plan:

1. **Apply to highest-risk files first** (Phase 1 — 10 files)
2. **Remove direct event calls** from migrated handlers
3. **Apply to Phase 2** (15 files)
4. **Apply to all remaining mutations** (Phase 3) via automated script

Each migration is a mechanical transformation — no business logic changes.
