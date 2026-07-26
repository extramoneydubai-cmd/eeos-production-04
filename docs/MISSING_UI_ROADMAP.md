# EEOS Missing UI Roadmap — Release 1.0

**Generated:** July 26, 2026
**Total Missing UI Items:** 43
**Estimated Total Effort:** 14-18 sprints (2-3 months with 3 devs)

---

## Priority Legend

| Priority | Definition | Target |
|:--------:|------------|--------|
| **CRITICAL** | Blocks client demo | Sprint 1-2 |
| **HIGH** | Required for Release 1.0 | Sprint 3-5 |
| **MEDIUM** | Important but not blocking | Sprint 6-8 |
| **LOW** | Nice to have | Post-Release |

---

## Sprint 1 — Foundation & People Registry (Critical)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 1 | **People Database Page** — List/search/filter all persons with pagination | People Registry | 3 days | None |
| 2 | **Person Profile Page** — Detail view with tabs: Profile, Contacts, Documents, Timeline | People Registry | 3 days | #1 |
| 3 | **Emergency Contacts UI** — Add/edit/view emergency contacts per person | People Registry | 1 day | #2 |
| 4 | **Social Links UI** — Add/edit social links per person | People Registry | 0.5 day | #2 |
| 5 | **Communication Preferences UI** — Opt-in/opt-out per channel per person | People Registry | 1 day | #2 |
| 6 | **Relationship Manager UI** — Link persons as family, guardian, emergency contact | People Registry | 2 days | #2 |
| 7 | **QR Code Viewer** — Generate and display QR for person profile | People Registry | 0.5 day | #2 |

**Sprint 1 Total:** 11 days | **Demo Impact:** People Registry becomes demonstrable

---

## Sprint 2 — Finance UIs (Critical)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 8 | **Fee Structure Builder** — Create fee plans, installments, discount rules | Finance | 3 days | Finance backend |
| 9 | **Invoice Management UI** — Create/view/invoice listing with filters | Finance | 3 days | #8 |
| 10 | **Expense Management UI** — Add/view expense entries with attachments | Finance | 2 days | None |
| 11 | **Receipt Viewer** — Print/email/download receipts | Finance | 1.5 days | #9 |
| 12 | **Ledger View** — Student/parent ledger with running balance | Finance | 2 days | #8 |

**Sprint 2 Total:** 11.5 days | **Demo Impact:** Finance becomes demonstrable end-to-end

---

## Sprint 3 — Examination UIs (Critical)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 13 | **Exam Template Manager** — Create/edit exam templates | Examination | 2 days | Exam backend |
| 14 | **Exam Session Manager** — Schedule sessions, assign subjects | Examination | 3 days | #13 |
| 15 | **Exam Timetable** — Calendar/timetable view | Examination | 2 days | #14 |
| 16 | **Marks Entry UI** — Manual entry per subject/student | Examination | 3 days | #14 |
| 17 | **Result Viewer** — Published results with search | Examination | 2 days | Marks engine |
| 18 | **Report Card Generator** — PDF report card view/download | Examination | 2 days | #17 |

**Sprint 3 Total:** 14 days | **Demo Impact:** Examination becomes demonstrable

---

## Sprint 4 — Student & Academic UIs (High)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 19 | **Student Listing Page** — Search/filter/paginate all students | Student | 2 days | Student backend |
| 20 | **Student Profile Page** — Detail with tabs: Info, Enrollment, Fees, Academics, Attendance, Documents | Student | 4 days | #19 |
| 21 | **Enrollment UI** — Enroll student in batch/course | Student | 2 days | #20 |
| 22 | **Academic Record Viewer** — Transcript, semester results | Academic | 2 days | #20 |
| 23 | **Attendance View** — Per-student attendance history | Student | 2 days | Attendance engine |

**Sprint 4 Total:** 12 days | **Demo Impact:** Student module becomes demonstrable

---

## Sprint 5 — LMS UIs (High)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 24 | **Course Library Page** — Browse/search courses | LMS | 2 days | LMS backend |
| 25 | **Course Detail Page** — Lessons, content, assignments | LMS | 3 days | #24 |
| 26 | **Lesson Viewer** — Video/PDF/slides content player | LMS | 3 days | #25 |
| 27 | **Assignment Submission UI** — Faculty assignment, student submission | LMS | 2 days | #25 |
| 28 | **Progress Tracking UI** — Student completion status per course | LMS | 1.5 days | #25 |

**Sprint 5 Total:** 11.5 days | **Demo Impact:** LMS becomes demonstrable

---

## Sprint 6 — Procurement & Inventory UIs (High)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 29 | **Vendor List & Detail Pages** — Manage vendors | Procurement | 2 days | Procurement backend |
| 30 | **Purchase Requisition UI** — Create/list/approve PRs | Procurement | 2 days | #29 |
| 31 | **Purchase Order UI** — Create PO from PR or directly | Procurement | 2 days | #30 |
| 32 | **Inventory Browsing UI** — Search/filter stock items | Inventory | 2 days | Inventory backend |
| 33 | **Goods Receipt Note UI** — Receive items into inventory | Procurement | 1.5 days | #31 |

**Sprint 6 Total:** 9.5 days | **Demo Impact:** Procurement becomes demonstrable

---

## Sprint 7 — HR/Employee UIs (High)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 34 | **Employee List Page** — Search/filter/paginate employees | HR | 2 days | Employee backend |
| 35 | **Employee Profile Page** — Detail with tabs: Info, Employment, Documents, Leaves | HR | 3 days | #34 |
| 36 | **Leave Management UI** — Apply/approve/view leaves | HR | 2 days | #35 |
| 37 | **Onboarding Checklist UI** — Track onboarding tasks | HR | 1.5 days | #35 |

**Sprint 7 Total:** 8.5 days | **Demo Impact:** HR becomes demonstrable

---

## Sprint 8 — Reporting & Analytics (High)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 38 | **Report Builder UI** — Drag-drop report configuration | Reports | 4 days | Report engine |
| 39 | **Saved Reports UI** — View/manage saved reports | Reports | 1.5 days | #38 |
| 40 | **Scheduled Reports UI** — Schedule daily/weekly/monthly reports | Reports | 2 days | #38 |
| 41 | **Drill-down Analytics** — Click-through on chart data | Analytics | 3 days | Analytics engine |
| 42 | **Data Export UI** — Export reports as PDF/Excel/CSV | Reports | 1.5 days | #38 |

**Sprint 8 Total:** 12 days | **Demo Impact:** Reporting becomes demonstrable

---

## Sprint 9 — Calendar & Scheduling (Medium)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 43 | **Calendar Page** — Daily/weekly/monthly views | Calendar | 5 days | Calendar engine |
| 44 | **Meeting Scheduler** — Create meetings, invite participants | Calendar | 2 days | #43 |
| 45 | **Class/Exam Schedule View** — Academic schedule on calendar | Calendar | 2 days | #43 |
| 46 | **Counselor/Interview Schedule** — Schedule view for counselors | Calendar | 2 days | #43 |

**Sprint 9 Total:** 11 days

---

## Sprint 10 — Workflow & Form Builders (Medium)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 47 | **Visual Workflow Node Editor** — Drag-drop condition/action nodes | Workflow | 4 days | Workflow engine |
| 48 | **Approval Builder UI** — Create approval templates with phases | Workflow | 2 days | #47 |
| 49 | **Workflow Execution History** — View completed/in-progress workflows | Workflow | 1.5 days | #47 |
| 50 | **Form Builder Enhancements** — Conditionals, calculations, preview | Forms | 3 days | Form engine |

**Sprint 10 Total:** 10.5 days

---

## Sprint 11 — Final Integration & Polish (Medium)

| # | Task | Module | Effort | Dependencies |
|---|------|--------|:------:|-------------|
| 51 | **Empty States** — Add consistent EmptyState component to all pages | All | 2 days | None |
| 52 | **Loading States** — Add LoadingState skeleton to all pages | All | 2 days | None |
| 53 | **Error Boundaries** — Add error boundaries per module | All | 1 day | None |
| 54 | **Confirmation Dialogs** — Add confirmations for destructive actions | All | 1.5 days | None |
| 55 | **Keyboard Shortcuts** — Global shortcuts for navigation | All | 1 day | None |
| 56 | **Responsive Audit** — Fix mobile layouts | All | 3 days | None |
| 57 | **Search Integration** — Wire global search to all modules | All | 3 days | Search engine |

**Sprint 11 Total:** 13.5 days

---

## Consolidated Summary

| Sprint | Focus | Tasks | Days | Demo Milestone |
|:------:|-------|:----:|:----:|----------------|
| 1 | People Registry | 7 | 11 | ✅ People demo ready |
| 2 | Finance UIs | 5 | 11.5 | ✅ Finance demo ready |
| 3 | Examination UIs | 6 | 14 | ✅ Exam demo ready |
| 4 | Student & Academic | 5 | 12 | ✅ Student demo ready |
| 5 | LMS UIs | 5 | 11.5 | ✅ LMS demo ready |
| 6 | Procurement & Inventory | 5 | 9.5 | ✅ Procurement demo ready |
| 7 | HR/Employee | 4 | 8.5 | ✅ HR demo ready |
| 8 | Reports & Analytics | 5 | 12 | ✅ Reports demo ready |
| 9 | Calendar & Scheduling | 4 | 11 | ⬜ Calendar available |
| 10 | Workflow & Forms | 4 | 10.5 | ⬜ Workflow enhanced |
| 11 | Final Polish | 7 | 13.5 | ✅ Production polish |

**Total:** 57 tasks | **Total Effort:** ~125 person-days | **Timeline:** ~11 weeks (3 devs)
