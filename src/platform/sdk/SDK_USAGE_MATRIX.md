# EEOS SDK Usage Matrix

## Platform Compliance Status

| Module | Timeline | Audit | Notification | Workflow | Visibility | Permission | People | Document | Communication | Task | Calendar | Report | Dashboard | Event | Compliance % |
|--------|:--------:|:-----:|:------------:|:--------:|:----------:|:----------:|:------:|:---------:|:-------------:|:----:|:--------:|:------:|:---------:|:-----:|:------------:|
| Organization | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **7%** |
| Access Control | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **14%** |
| CRM | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | **21%** |
| Admissions | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Student | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Finance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| HR | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Employee | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Examination | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| LMS | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Procurement | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Inventory | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |
| Communication | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **7%** |
| Tasks | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | **7%** |
| Documents | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **7%** |
| Reports | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | **7%** |
| Dashboards | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | **7%** |
| Workflow | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **7%** |

## Migration Priority

| Priority | Module | Direct Timeline Inserts | Direct Notification Inserts | Direct Audit Inserts | Estimated Effort |
|:--------:|--------|:-----------------------:|:---------------------------:|:--------------------:|:----------------:|
| 🔴 P0 | CRM | ~15 | ~8 | ~5 | 2 days |
| 🔴 P0 | Finance | ~10 | ~6 | ~4 | 1 day |
| 🔴 P0 | Student | ~8 | ~5 | ~3 | 1 day |
| 🟡 P1 | Admissions | ~5 | ~3 | ~2 | 0.5 day |
| 🟡 P1 | Employee | ~5 | ~3 | ~2 | 0.5 day |
| 🟡 P1 | Examination | ~5 | ~3 | ~2 | 0.5 day |
| 🟢 P2 | HR | ~3 | ~2 | ~1 | 0.5 day |
| 🟢 P2 | LMS | ~3 | ~2 | ~1 | 0.5 day |
| 🟢 P2 | Procurement | ~2 | ~1 | ~1 | 0.5 day |
| 🟢 P2 | Inventory | ~2 | ~1 | ~1 | 0.5 day |

## How to Verify SDK Usage

```bash
# Find modules NOT using the SDK (direct inserts to platform tables)
echo "=== Direct Timeline Inserts ==="
grep -rn 'ctx.db.insert("timelineEvents"' src/convex/ --include="*.ts" | grep -v 'sdk\|_generated'

echo "=== Direct Notification Inserts ==="
grep -rn 'ctx.db.insert("notifications"' src/convex/ --include="*.ts" | grep -v 'sdk\|_generated'

echo "=== Direct Audit Inserts ==="
grep -rn 'ctx.db.insert("auditLogs"' src/convex/ --include="*.ts" | grep -v 'sdk\|_generated'

echo "=== Direct Workflow Inserts ==="
grep -rn 'ctx.db.insert("workflowInstances"' src/convex/ --include="*.ts" | grep -v 'sdk\|_generated'
```
