# EEOS Query Coverage Report

## Coverage by Capability

| Capability | Coverage | Status |
|-----------|:--------:|:------:|
| **Pagination Coverage** | ~12% | 🔴 Needs migration |
| **Search Coverage** | ~15% | 🔴 Needs migration |
| **Visibility Engine Integration** | ~5% | 🔴 Needs integration |
| **Permission Engine Integration** | ~5% | 🔴 Needs integration |
| **Batch Query Coverage** | ~15% | 🟡 Available in platform |
| **Dashboard Provider Coverage** | ~30% | 🟡 7 of 15+ modules covered |

---

## Pagination Coverage

| Module | Total Queries | Paginated | Coverage |
|--------|:------------:|:---------:|:--------:|
| CRM | ~60 | ~15 | 25% |
| Students | ~40 | ~5 | 12% |
| Finance | ~50 | ~3 | 6% |
| People Registry | ~30 | ~10 | 33% |
| Documents | ~20 | ~8 | 40% |
| HR | ~35 | ~5 | 14% |
| Exams | ~25 | ~0 | 0% |
| LMS | ~20 | ~3 | 15% |
| Inventory | ~20 | ~0 | 0% |
| Procurement | ~20 | ~0 | 0% |
| Communications | ~15 | ~2 | 13% |
| Workflow/Approvals | ~25 | ~3 | 12% |
| Dashboards | ~15 | ~0 | 0% |
| Master Data | ~30 | ~30 | 100%* |
| Admin/System | ~25 | ~10 | 40% |
| **Total** | **~530** | **~94** | **~18%** |

*Master data queries are typically on small tables (<100 records) where pagination is unnecessary.

## Search Coverage

| Module | Tables | Searchable | Coverage |
|--------|:-----:|:---------:|:--------:|
| Leads | 10+ | 1 (via searchEntity) | 10% |
| People | 3 | 1 (via searchEntity) | 33% |
| Students | 5+ | 1 (via searchEntity) | 20% |
| All others | 250+ | 0 | <1% |

## Visibility Engine Coverage

| Capability | Coverage | Notes |
|-----------|:--------:|-------|
| Category discover | Via queryPlatform `requireDiscover` | Available for new queries |
| Record-level scoping | Via queryPlatform `filterByVisibility` | Available for new queries |
| Field-level masking | `filterFields()` + `applyFieldMasking()` | Available but not wired |
| Section-level filtering | `filterSections()` | Available but not wired |
| Action permissions | `canPerformAction()` | Available but not wired |

## Dashboard Provider Coverage

| Module | Provider | KPIs | Charts | Timeline | Activity |
|--------|:-------:|:----:|:------:|:--------:|:--------:|
| CRM | ✅ | 4 | 2 | ✅ | ✅ |
| Students | ✅ | 4 | 2 | ❌ | ✅ |
| Finance | ✅ | 4 | 2 | ✅ | ❌ |
| HR | ✅ | 4 | 2 | ❌ | ✅ |
| Exams | ✅ | 3 | 0 | ❌ | ❌ |
| LMS | ✅ | 3 | 0 | ❌ | ✅ |
| Inventory | ✅ | 3 | 0 | ❌ | ❌ |
| Recruitment | ❌ | — | — | — | — |
| Admissions | ❌ | — | — | — | — |
| Attendance | ❌ | — | — | — | — |
| Procurement | ❌ | — | — | — | — |
| Documents | ❌ | — | — | — | — |
| Workflow | ❌ | — | — | — | — |
| Communications | ❌ | — | — | — | — |
| Support | ❌ | — | — | — | — |
