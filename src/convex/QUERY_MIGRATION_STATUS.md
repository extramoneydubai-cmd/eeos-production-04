# EEOS Query Migration Status

## Overview

Progressive migration of collection-returning queries to the Enterprise Query Platform.
Only Priority 1 queries are being migrated in this patch. Remaining queries are tracked for future sprints.

---

## Migration Summary

| Metric | Count |
|--------|:-----:|
| **Total collection queries in codebase** | **~530** |
| **Migrated to paginated pattern (PATCH-CORE-002)** | **~50** |
| **Migrated to secure wrapper (this patch)** | **~15** |
| **Remaining to migrate** | **~465** |
| **High-risk (full scan, no pagination)** | **~85** |
| **Low-risk (small tables, acceptable)** | **~380** |
| **Coverage %** | **~12%** |
| **Risk Score** | **Medium** |

---

## Priority 1 Migrations (Completed)

### Data Platform Files
| File | Status | Notes |
|------|--------|-------|
| `queryPlatform.ts` | ✅ Created | Secure query wrapper with Visibility Engine delegation |
| `searchPlatform.ts` | ✅ Created | Reusable generic `searchEntity()` function |
| `dashboardProviders.ts` | ✅ Created | Provider architecture: CRM, Students, Finance, HR, Exams, LMS, Inventory |
| `queryHelpers.ts` | ✅ Expanded | Dashboard platform + 20 batch functions + enrichment helpers |

### Query Standards
| File | Status | Notes |
|------|--------|-------|
| `QUERY_STANDARDS.md` | ✅ Created | 12 mandatory rules including Permission Engine |
| `QUERY_MIGRATION_STATUS.md` | ✅ Created | This file |
| `QUERY_COVERAGE_REPORT.md` | ✅ Created | Coverage by module |
| `QUERY_SECURITY_REPORT.md` | ✅ Created | Security gaps identified |
| `QUERY_PERFORMANCE_REPORT.md` | ✅ Updated | Before/after benchmarks |

---

## Priority 1 Queries: Migration Status by Module

### CRM (10 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| `listLeads` | `crmLeads.ts` | ✅ Paginated | Low |
| `getFollowups` | `crmLeads.ts` | 🔴 Full scan | High |
| `checkDuplicateLeads` | `crmLeads.ts` | 🔴 Full scan | Medium |
| `getSalesPendingTasks` | `crmTasks.ts` | 🔴 Full scan | High |
| `getLeadTasks` | `crmTasks.ts` | ✅ Paginated | Low |
| `listUsers` | `users.ts` | ✅ Paginated | Low |
| `listActiveUsers` | `users.ts` | ✅ Paginated | Low |
| `getUsersByDepartment` | `users.ts` | ✅ Paginated | Low |
| `getUsersByTeam` | `users.ts` | ✅ Paginated | Low |
| Remaining CRM queries | Various | 🔴 Not migrated | Various |

### People Registry (5 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| Person search | `personSearch.ts` | ✅ Indexed | Low |
| Person listing | `personEngine.ts` | 🔴 Full scan | High |
| Employee listing | `employeeEngine.ts` | ✅ Paginated | Low |
| Employee search | `employeeSearch.ts` | ✅ Indexed | Low |
| Contact listing | `personEngine.ts` | 🔴 Full scan | Medium |

### Students (8 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| Student listing | `studentEngine.ts` | 🔴 Full scan | High |
| Student search | `studentEngine.ts` | 🔴 Full scan | High |
| Enrollment listing | `enrollmentEngine.ts` | 🔴 Full scan | High |
| Batch listing | `academicBatches.ts` | 🔴 Full scan | Medium |
| Course listing | `crmCourses.ts` | 🔴 Full scan | Medium |
| Subject listing | `academicSubjects.ts` | 🔴 Full scan | Medium |
| Student dashboard | `studentEngine.ts` | 🔴 Full scan | High |
| Parent listing | `studentEngine.ts` | 🔴 Full scan | Medium |

### Finance (8 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| Invoice listing | `invoiceEngine.ts` | 🔴 Full scan | High |
| Payment listing | `paymentEngine.ts` | 🔴 Full scan | High |
| Fee listing | `feeEngine.ts` | 🔴 Full scan | High |
| Expense listing | `expenseEngine.ts` | 🔴 Full scan | High |
| Receipt listing | `receiptEngine.ts` | 🔴 Full scan | High |
| Refund listing | `refundEngine.ts` | 🔴 Full scan | High |
| Collection listing | `paymentEngine.ts` | 🔴 Full scan | High |
| Journal listing | `financeEngine.ts` | 🔴 Full scan | Medium |

### Documents (5 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| `listDocuments` | `documentEngine.ts` | ✅ Paginated | Low |
| `getDocumentDashboard` | `documentEngine.ts` | 🔴 Full scan | Medium |
| `listFolders` | `documentEngine.ts` | ⚠️ Small table | Low |
| Document timeline | `documentEngine.ts` | ⚠️ Indexed | Low |

### HR (5 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| Employee listing | `employeeEngine.ts` | ✅ Paginated | Low |
| Attendance listing | `attendanceEngine.ts` | 🔴 Full scan | High |
| Leave listing | `employeeLifecycle.ts` | 🔴 Full scan | High |
| Skill listing | `hrSkills.ts` | ⚠️ Small table | Low |
| Category listing | `hrEmployeeCategories.ts` | ⚠️ Small table | Low |

### Dashboards (5 queries)
| Query | File | Status | Risk |
|-------|------|--------|:----:|
| CRM dashboard | `crmDashboard.ts` | 🔴 Direct query | High |
| Student dashboard | `dashboard.ts` | 🔴 Direct query | High |
| Finance dashboard | `financeDashboard.ts` | 🔴 Direct query | High |
| Executive dashboard | `executiveReports.ts` | 🔴 Direct query | High |
| Admin dashboard | `dashboard.ts` | 🔴 Direct query | High |

---

## Remaining High-Risk Queries (Top 20)

1. `getFollowups` (crmLeads.ts) — Full scan on leadMaster
2. `getSalesPendingTasks` (crmTasks.ts) — Full scan on leadTasks
3. Student listing (studentEngine.ts) — Full scan
4. Student search (studentEngine.ts) — Full scan
5. Enrollment listing (enrollmentEngine.ts) — Full scan
6. Invoice listing (invoiceEngine.ts) — Full scan
7. Payment listing (paymentEngine.ts) — Full scan
8. Expense listing (expenseEngine.ts) — Full scan
9. Receipt listing (receiptEngine.ts) — Full scan
10. Refund listing (refundEngine.ts) — Full scan
11. Attendance listing (attendanceEngine.ts) — Full scan
12. Leave listing (employeeLifecycle.ts) — Full scan
13. CRM dashboard (crmDashboard.ts) — Direct table query
14. Finance dashboard (financeDashboard.ts) — Direct table query
15. Executive dashboard (executiveReports.ts) — Direct table query
16. Collection listing (paymentEngine.ts) — Full scan
17. Vendor listing (procurementEngine.ts) — Full scan
18. Purchase order listing (procurementEngine.ts) — Full scan
19. Inventory listing (inventoryEngine.ts) — Full scan
20. Asset listing (assetEngine.ts) — Full scan
