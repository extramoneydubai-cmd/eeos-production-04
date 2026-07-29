# EEOS Module Coverage Matrix

**Generated:** 2026-07-29  
**Total Modules:** 22  

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Working | Fully functional, backend + UI + workflows |
| ⚡ Partially Working | Some features implemented, gaps remain |
| 🖥️ UI Only | Frontend exists, backend/engine missing or stub |
| 🔧 Backend Only | Backend engine exists, no UI |
| 📋 Placeholder | Page exists but shows placeholder content |
| ❌ Broken | Not functional or crashing |
| ⏳ Pending | Not yet started |

---

## Module Matrix

| # | Module | Route Status | Pages | Backend | Workflow | Reports | Automation | Overall | Status |
|---|--------|-------------|-------|---------|----------|---------|------------|---------|--------|
| 1 | **Authentication / Login** | ✅ | 100% | 100% | 100% | N/A | N/A | 100% | ✅ |
| 2 | **Dashboard (Main)** | ✅ | 100% | 70% | N/A | N/A | N/A | 85% | ⚡ |
| 3 | **CRM** | ✅ | 95% | 95% | 80% | 70% | 70% | 85% | ⚡ |
| 4 | **Sales Center** | ✅ | 90% | 90% | 80% | 80% | 70% | 85% | ⚡ |
| 5 | **Finance** | ✅ | 80% | 85% | 70% | 70% | 60% | 75% | ⚡ |
| 6 | **Procurement** | ✅ | 85% | 85% | 80% | 50% | 60% | 75% | ⚡ |
| 7 | **LMS** | ✅ | 80% | 80% | 60% | 50% | 50% | 65% | ⚡ |
| 8 | **Examination** | ✅ | 85% | 85% | 75% | 60% | 60% | 75% | ⚡ |
| 9 | **Academic** | ✅ | 90% | 90% | 80% | 70% | 65% | 80% | ⚡ |
| 10 | **Students** | ✅ | 90% | 90% | 75% | 60% | 60% | 75% | ⚡ |
| 11 | **Employees / HR** | ✅ | 85% | 90% | 80% | 65% | 65% | 80% | ⚡ |
| 12 | **People Registry** | ✅ | 90% | 90% | N/A | 60% | N/A | 80% | ⚡ |
| 13 | **Scheduling** | ✅ | 90% | 85% | 85% | 80% | 80% | 85% | ✅ |
| 14 | **Workflow** | ✅ | 80% | 90% | 90% | 70% | 80% | 85% | ⚡ |
| 15 | **Support / Ticketing** | ✅ | 85% | 85% | 80% | 70% | 75% | 80% | ⚡ |
| 16 | **Security** | ✅ | 70% | 85% | 50% | 60% | 60% | 65% | ⚡ |
| 17 | **Operations / Observability** | ✅ | 70% | 90% | N/A | 60% | 60% | 70% | ⚡ |
| 18 | **Deployment / Release** | ✅ | 60% | 85% | N/A | 50% | 50% | 60% | ⚡ |
| 19 | **Calendar** | ✅ | 85% | 80% | 60% | 50% | 50% | 65% | ⚡ |
| 20 | **Communication / Marketing** | ✅ | 80% | 80% | 60% | 50% | 50% | 65% | ⚡ |
| 21 | **Administration** | ✅ | 80% | 70% | 60% | 50% | 50% | 60% | ⚡ |
| 22 | **Platform Studio** | ✅ | 95% | 90% | N/A | N/A | N/A | 90% | ✅ |

---

## Module Status Summary

| Status | Count | Modules |
|--------|-------|---------|
| ✅ Working | 3 | Auth, Scheduling, Platform Studio |
| ⚡ Partially Working | 19 | All other modules |
| 🖥️ UI Only | 0 | — |
| 🔧 Backend Only | 0 | — |
| 📋 Placeholder | 0 | — |
| ❌ Broken | 0 | — |
| ⏳ Pending | 0 | — |

---

## Coverage by Layer

| Layer | Coverage | Notes |
|-------|----------|-------|
| **Routes** | 100% | All 130+ routes lazy-loaded, all import paths valid |
| **Backend (Convex)** | ~85% | 238 files covering most business domains |
| **UI Pages** | ~85% | 90 pages covering all major modules |
| **Workflows** | ~70% | Workflow engine complete, module integration ongoing |
| **Reports** | ~60% | Finance reports operational, others need work |
| **Automation** | ~55% | Automation engine exists, module triggers being wired |
| **Observability** | ~70% | Operations Center live, SDK/convex metrics collected |
| **Security** | ~65% | Security Center + Audit Center live, real Convex integration pending |

---

## Navigation Coverage

All sidebar items verified to point to valid routes.

| Sidebar Section | Item | Route | Status |
|-----------------|------|-------|--------|
| Main Nav | Dashboard | /dashboard | ✅ |
| Main Nav | CRM Lite | /crm | ✅ |
| Main Nav | Sales Center | /crm/sales | ✅ |
| Main Nav | Course Studio | /courses | ✅ |
| Main Nav | Collections | /collections | ✅ (flagged) |
| Main Nav | Organization Studio | /org | ✅ |
| Main Nav | User Management | /users | ✅ |
| Main Nav | Access Control | /access | ✅ |
| Main Nav | Task Management | /tasks | ✅ |
| Main Nav | Approval Center | /approvals | ✅ |
| Studios | Master Data Studio | /studios/master-data | ✅ |
| Studios | Form Studio | /studios/forms | ✅ |
| Studios | Intake Dashboard | /studios/intake | ✅ |
| Studios | Workflow Studio | /studios/workflows | ✅ |
| Studios | Platform Studio | /platform-studio | ✅ |
| Tools | Notifications | /notifications | ✅ |
| Tools | Messenger | /messenger | ✅ |
| Bottom | Control Center | /control | ✅ (CEO only) |
| Bottom | Profile | /profile | ✅ |
| CRM Settings | Lead Stages | /crm/settings/stages | ✅ (super_admin only) |
