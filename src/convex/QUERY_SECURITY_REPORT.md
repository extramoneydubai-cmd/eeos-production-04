# EEOS Query Security Report

## Queries Bypassing Visibility Engine

The following queries use `.collect()` without visibility filtering, exposing potentially unrestricted data:

### Critical (full table scan, no auth check)
| File | Query | Risk |
|------|-------|:----:|
| `crmLeads.ts` | `checkDuplicateLeads` | Exposes all leads by phone number |
| `crmLeads.ts` | `getFollowups` | Exposes all followup schedules |
| `crmLeads.ts` | `importLeads` | Reads all existing leads |
| `crmTasks.ts` | `getSalesPendingTasks` | Exposes all tasks with lead enrichment |
| `studentEngine.ts` | Student listing | Exposes all student records |
| `studentEngine.ts` | Student search | Exposes all student records |
| `invoiceEngine.ts` | Invoice listing | Exposes all financial records |
| `paymentEngine.ts` | Payment listing | Exposes all payment records |
| `expenseEngine.ts` | Expense listing | Exposes all expense records |
| `crmDashboard.ts` | Dashboard queries | Exposes all CRM data |
| `financeDashboard.ts` | Dashboard queries | Exposes all financial data |
| `executiveReports.ts` | Report queries | Exposes all enterprise data |

## Queries Bypassing Permission Engine

None of the existing collection queries check action-level permissions via `canPerformAction()`.
The following actions are never checked:

| Action | Checked? | Risk |
|--------|:-------:|:----:|
| Can user view this record? | ❌ | Records visible to unauthorized users |
| Can user edit? | ❌ | Unauthorized edits possible |
| Can user delete? | ❌ | Unauthorized deletions possible |
| Can user export? | ❌ | Data exfiltration risk |
| Can user print? | ❌ | Authorization bypass |

## Queries Exposing Unrestricted Collections

These queries return ALL records from a table with no scope filtering at all:

| Table | Exposed By | Records Exposed |
|-------|-----------|:--------------:|
| `leadMaster` | `checkDuplicateLeads`, `getFollowups`, `importLeads` | All leads |
| `leadTasks` | `getSalesPendingTasks` | All tasks |
| `studentMaster` | Student listing/search | All students |
| `employeeMaster` | Various un-paginated queries | All employees |
| `personMaster` | Person search/listing | All persons |
| `invoices` | Invoice listing | All invoices |
| `payments` | Payment listing | All payments |
| `expenses` | Expense listing | All expenses |
| `documents` | Document dashboard | All documents |

## Security Recommendations

1. **Immediate (Critical)**: Add `requireDiscover: true` to all CRM, Student, and Finance list queries via the query platform's `visibility.module` config
2. **Immediate (Critical)**: Replace `checkDuplicateLeads` with an indexed phone lookup instead of full scan
3. **High Priority**: Wire `visibilityEngine.canOpen()` to all detail-view queries
4. **High Priority**: Add `visibilityEngine.canPerformAction()` before mutation operations (edit, delete, export)
5. **Medium Priority**: Add `visibilityEngine.filterFields()` and `applyFieldMasking()` to sensitive field display
6. **Medium Priority**: Add `visibilityEngine.filterSections()` to UI rendering for all detail views

## Field-Level Sensitivity

The following fields should be masked for non-admin roles:

| Field | Sensitivity | Masking Rule |
|-------|:----------:|--------------|
| `phone` | Medium | Show last 4 digits only |
| `email` | Medium | Mask domain for external viewers |
| `dob` | High | Show birth year only |
| `whatsappPin` | Critical | Always**** |
| `salary` | Critical | Manager+ only |
| `medicalInfo` | Critical | HR + Employee only |
| `bankDetails` | Critical | Finance + Employee only |
| `passwordHash` | Critical | Never expose |
| `notes` | Medium | Owner + Manager only |
