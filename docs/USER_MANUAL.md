# EEOS — End-User Manual

**Product:** EEOS (Enterprise Executive Operating System)
**Audience:** Everyone who uses the product — CEOs, managers, HR, staff, and operators.
**Purpose:** This manual explains what every module is for and how to complete each workflow, step by step.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Roles, Scopes and Terms You Should Know](#2-roles-scopes-and-terms-you-should-know)
3. [Your Home Screen (Top Bar, Sidebar, Quick Actions)](#3-your-home-screen)
4. [Home Modules — Tasks, Approvals, Notifications, Messenger, Calendar, Profile](#4-home-modules)
5. [Governance — Organization, Users, Access, Administration, CEO tools](#5-governance-modules)
6. [Academics — Structure, Timetable, Attendance, LMS, Exams](#6-academics-modules)
7. [CRM — Leads, Sales, Opportunities, Admissions, Customer 360](#7-crm-modules)
8. [Students — Registry, Portals, Documents](#8-students-modules)
9. [Finance — Fee Center, Collections, Refunds, PDC & Cheques](#9-finance-modules)
10. [HR — Employees, Recruitment, Onboarding, Leave, Payroll, People](#10-hr-modules)
11. [Operations — Procurement, Inventory, Assets, Production, Support, Tickets](#11-operations-modules)
12. [Communication & Marketing](#12-communication-marketing)
13. [Reports & Analytics and Platform Tools](#13-reports-analytics-and-platform)
14. [End-to-End Journeys](#14-end-to-end-journeys)
15. [Troubleshooting and FAQ](#15-troubleshooting-and-faq)

---

## 1. Getting Started

### 1.1 Logging in

1. Open the EEOS web address in your browser.
2. Enter your **username** and **password**.
3. Click **Login**.

Default seeded administrator account (change the password after first login):

| Username | Password | What you can do |
|----------|----------|-----------------|
| `ceo` | `admin123` | Full access — CEO/System Admin |

The system starts with a seeded organization (Veda EdTech) containing departments, branches, verticals, designations, and an admin user, so you can work immediately without setup.

### 1.2 If you forget your password

- Ask a **User Management** administrator (or the CEO) to reset it from **User Management → the user → Reset Password**.
- The administrator sets a temporary password; sign in with it and change it from **Profile**.

### 1.3 What to expect on every screen

- **Sidebar (left):** all modules, grouped by department area (Home, Governance, Academics, CRM, Students, Finance, HR, Operations, Communication, Reports, Platform). The items you see depend on your role.
- **Top bar:** current-page breadcrumb, **Global Search**, the **Approvals** counter, and the **Notifications** bell (both show live red/yellow counters when something needs your attention).
- **+ button (bottom-right):** Quick Actions menu — fast shortcuts such as *New Task*, *New Lead*, *Mark Attendance*, *Record Payment*. What you see depends on your role.
- **Star icon next to any sidebar item:** pins the module to a **Favorites** section at the top of the sidebar.
- **Logout:** at the bottom of the sidebar.
- **Realtime behavior:** screens update live. When someone approves your request or a task is assigned to you, it appears without refreshing the page.

### 1.4 Searching

Use **Global Search** (magnifier icon in the top bar) to jump to any module or record by name — for example "leave", "lead", "finance", "Recruitment". Breadcrumbs in the top bar always show where you are and let you go back up a level.

---

## 2. Roles, Scopes and Terms You Should Know

### 2.1 Platform roles (control what you can *do* in the software)

| Role | Typical holder | Meaning |
|------|----------------|---------|
| **Super Admin** | CEO | Everything — including creating users, teams, and broadcasting announcements. Shows a "CEO" badge. |
| **Admin** | COO, department heads, HR admin | Full operational access within assigned scopes; can manage users/access where allowed. |
| **Manager** | Team leads, vertical heads | Runs day-to-day work: creates tasks, reviews approvals, manages their team's records. |
| **Staff** | Executors | Works on assigned tasks, records their own attendance, applies for leave, chats, and gets notified. |

> **Role ≠ Designation.** Role is your software permission level. Designation (CEO, CFO, CKO, CTO, Head of Department, etc.) is your *job title* inside the organization chart. Designations are configurable in **Organization / Designations**.

### 2.2 Scopes (what data you can *see and touch*)

Access is controlled by **scope**: the company, branch, department, team, or vertical your access covers. If a screen shows only some rows, it is because your scope limits you — ask an administrator if you believe you should see more. Your effective access can always be reviewed in **Access Control (Effective Access)** by admins.

### 2.3 The organization model

- **Group** → the parent organization (e.g., Veda EdTech)
- **Departments** (Finance, Knowledge, Technology, Marketing, Production, Administration, HR & Culture) — independent units
- **Companies / Branches** (e.g., NP, OP, KL, PL) — operating units
- **Teams** — live *inside* departments
- **Verticals / Sub-verticals / Boards** — the academic/governance dimension (School, College, Competitive, Professional)

Users may belong to **multiple teams**.

---

## 3. Your Home Screen

### 3.1 Dashboard

The Dashboard is your daily landing screen. Widgets summarize:

- **Users & people counts**
- **Tasks** assigned to you / your team, with due dates
- **Notifications** and unread activity
- **Approvals** waiting for your decision
- **Announcements**
- **Activity stream** — who changed what across the system
- **Quick actions** to jump into work

Click any widget or counter to drill into the full module. Counters update in real time.

### 3.2 Executive Dashboards

Under **Governance → Executive Dashboards** each C-suite role (CEO, CFO, COO, CKO, CTO, CMO, CPO, CHRO) has a tailored view of their own KPIs drawn from live data. The **CEO Executive Dashboard** is the top-level command screen.

---

## 4. Home Modules

### 4.1 Tasks (My Work)

Tasks are the core of execution. A task can be assigned to a user, owned, and shared with participants.

**Create a task**
1. Go to **Tasks** and press **New Task** (or use the **+** Quick Action → New Task).
2. Fill in the title, **priority**, **owner**, and **assignee**.
3. Optionally add **participants**, a **due date**, and mark it **requires approval**.
4. Save. The assignee is notified instantly and the task appears on their dashboard.

**Work with the board**
- Tasks are shown as a **Kanban board**; drag a card between columns to change its status (e.g., To Do → In Progress → Done).
- Task cards show: title, priority, owner, assignee, participants, checklist progress, unread comments, due date, and approval state.

**Open a task workspace**
Click a card to open the full task with tabs:
- **Overview** — description, dates, status, links
- **Discussion** — comments and replies (mentions notify people)
- **Files** — upload and view attachments
- **Checklist** — tick off sub-items; the card progress bar updates
- **Activity** — full history of every change

**Search & filter** tasks by assignee, status, due date, or text.

### 4.2 Approvals (Approval Center)

Anything that needs sign-off (leave, requisitions, offers, expenses, payroll, refunds, and more) flows through approvals.

**As a requester**
1. Submit the record (leave, requisition, etc.) using **Submit for Approval** inside that module.
2. Watch it in **Approvals** — status changes from *Pending* through the approval chain.
3. You are notified at each decision.

**As an approver**
1. The **Approvals** badge on the sidebar and top bar counts everything waiting for you.
2. Open **Approvals**, review the request details, then **Approve** or **Reject** (add a comment when rejecting so the requester knows why).
3. If a workflow has **sequential/parallel/hierarchy** phases, your approval advances it to the next phase automatically.

### 4.3 Notifications

- The bell in the top bar and the **Notifications** module collect everything addressed to you: task assignments, approval requests and decisions, direct messages, mentions, announcements.
- **Unread** items show a counter and bold text; open an item to mark it read, or use **Mark all as read**.
- Notifications appear **in real time** — no page refresh needed.

### 4.4 Messenger

Internal communication, separate from teams and departments.

- **Direct messages (DMs):** find a person and start a chat. Unread DMs show a badge.
- **Channels:** open topic-based channels for teams/projects (channels are created by administrators — CEO/Control Center or admins).
- **Announcements:** broadcast messages — open the Announcements view to read official communications; managers can post new announcements.
- **Search:** find past messages and people.
- **Pin:** pin important messages in a channel so they stay visible.

### 4.5 Calendar

Your personal calendar for events and meetings: create an event with date/time, add a title and notes, and edit or remove it later. The **Organization Calendar** shows organization-wide events and holidays. **Timetable** (Academics) handles class/session scheduling.

### 4.6 Profile

Your account home:
- View your name, username, role, designation, department, and teams.
- **Change your password** here.
- Review your contact details and preferences.

---

## 5. Governance Modules

### 5.1 Organization Studio

Where the whole structure of the organization is managed. Open **Organization** to see the **tree view** (Group → Departments → Companies → Branches → Teams → Verticals).

**Create a department**
1. **Organization → Departments → New Department.**
2. Name, code, description, and optional manager.
3. Save. Departments are independent — teams are created *inside* a department.

**Create a team**
1. **Organization → Teams → New Team.**
2. Choose its **department**, give it a name/code, and pick a lead.
3. Save, then add members from **Users** (a user can be in several teams).

**Manage companies, branches, verticals**
Use the corresponding tabs/tree nodes in Organization Studio for the same pattern: create → name/code → save. These feed every picker across the app (scope, filters, reports), so keep names and codes clean.

**Designations**
**Organization → Designations** manages job titles with Name, Code, **Reports To** (who this designation reports to in the chart), Status, and Description — e.g., CEO, COO, CFO, CKO, CTO, CAO. This is configurable data, not hardcoded.

### 5.2 User Management

Admins manage every login account here.

**Create a user**
1. **User Management → New User.**
2. Enter name, **username**, temporary password, and choose the **role**.
3. Choose the user's **scope** (company / department / branch / team / vertical, and dashboard visibility).
4. Save — the user can log in immediately.

**After creation you can:**
- **Edit** details
- **Reset Password** (temporary password the user must change)
- **Disable / Enable** the user (a disabled user cannot log in)
- **Clone Access** — copy one user's scopes/teams onto another (useful when someone joins with the same responsibilities)
- **Transfer Access** — move a user's records/scopes to another user (e.g., when someone leaves)
- Manage which **teams** the user belongs to

**Sessions:** an admin can view active sessions and end them if needed (e.g., after a password reset or suspected misuse).

### 5.3 Access Control (Access Studio)

How admins answer "who can do what, where".

- **Role visibility:** which modules each platform role can open.
- **Effective Access:** pick a user and see exactly what they can read/write/approve across every scope — the definitive check before granting anything.
- **Access Control List:** record-level view of who can access which companies/branches/departments/teams/verticals.

If a user reports "I can't see X", run their **Effective Access** first; 9 times out of 10 it is a scope, not a bug.

### 5.4 CEO Control Center (Super Admin only)

The CEO's command module:
- **Create User** (quick path into User Management)
- **Create Team**
- **Broadcast** an announcement to everyone
- **Reset Password** for any user
- **Create Channel** in Messenger
- Plus the CEO Executive Dashboard view of enterprise KPIs

### 5.5 Administration (module hub)

The Administration dashboard is the home for facility/support-of-business modules:
- **Attendance** → marking and verification
- **Leave Management** → apply & approve leave
- **Payroll & Salary** → pay runs and payslips
- **Recruitment** → hiring pipeline
- **Onboarding** → new-hire checklists
- **HR Dashboard** → live HR KPIs
- **Employee Assets, Calendar, Organization Notices (Notifications), Employee/People registries**

Each card on this page opens the real workflow — see [HR Modules](#10-hr-modules) for how each one works.

### 5.6 Governance, Audit, Security, Admin Console, Configuration

These are oversight modules for senior/technical administrators:

- **Governance Dashboard** — policy and compliance overview.
- **Audit Center** — read-only trail of who did what, when. Every important action is recorded automatically; use Audit to investigate changes.
- **Security Center** — security posture, policies, and hardening status.
- **Admin Console** — system-level administration (system config, scheduled jobs, API keys, webhooks).
- **Configuration Studio** — platform configuration and feature controls.

---

## 6. Academics Modules

### 6.1 Academic Structure

Manages the academic catalog: **programs, subjects, batches, sections, streams, mediums, languages, terms, sessions**, and **faculty allocation**. Content here powers everything academic (timetables, exams, LMS).

**Typical flow:** Define the academic session → programs (with board/vertical/sub-vertical) → batches → sections. Classroom resources are registered here too.

### 6.2 Timetable / Scheduler

- **Timetable** — class schedules and resource bookings; add or edit sessions and check conflicts.
- **Scheduler** — build timetables and allocate resources (rooms, faculty) visually.
- **Schedule Approvals** — proposed schedule changes that need sign-off appear here for approval or rejection.
- **Scheduling Reports** — utilization and coverage reports.

### 6.3 Attendance

Attendance supports both **manual marking** and **self-service verification**.

**For administrators / teachers — mark attendance**
1. Go to **Attendance**.
2. Use the **Mark Attendance** form: choose the **date**, the **person**, status (**Present / Absent / Late / Half Day**), check-in time, and notes, then press **Mark Attendance**.
3. For groups, use the **quick-mark table** — select a date/branch and click **Present/Absent** per person; each click saves instantly and shows its result.
4. Filter by branch, date, and status to review and correct records.

**For employees/students — self-service check-in**
- **QR:** open the attendance screen and tap **My QR**; the supervisor scans it (one-time token) and your entry is recorded. A valid, unexpired token is required — refresh for a new one each time.
- **GPS:** mark in/out from your location when you are at the verified location.
- **Face:** register your face once, then use **Mark with Face** for quick check-in.
- Use **Verify** to check any record, or correct a mistake from the record list.

### 6.4 LMS (Learning Management System)

- **Course Library / Course Studio** — create and publish courses, lessons, and content.
- **LMS dashboard** — learner progress, enrollments, and content analytics.
- Faculty create assignments/quizzes and evaluate submissions; students track lessons, submit assignments, and take quizzes from their portal.

### 6.5 Examinations

- **Exam Dashboard** — plan exam sessions; open a session to manage it end-to-end.
- **Question papers** — create a paper → **submit for review → approve → release → lock** before the exam.
- **Results & marks** — enter marks (single or bulk import) → verify → moderate as needed; results are calculated and published from the session.
- **Revaluation & incidents** — support revaluation requests and incident reporting/escalation per exam session.

---

## 7. CRM Modules

### 7.1 Lead Center (CRM)

Manage the pipeline from enquiry to customer.

**Create a lead**
1. **Lead Center → Leads → New Lead** (or Quick Action → New Lead).
2. Enter contact details, source, and priority; save.
3. The lead appears in the pipeline at its stage.

**Move a lead forward**
1. Open the **Leads** board/list.
2. Drag the lead to the next stage (e.g., New → Contacted → Qualified → Counselling → Converted / Lost), or use **Move Stage**.
3. Log calls with outcomes (**Call Outcome**), add follow-ups (auto-creates tasks), notes, documents, and scheduled follow-ups as you work it.
4. Lost? Pick a **Lost Reason** so analytics stay meaningful.

**Assign and convert**
- Reassign leads between counselors/executives (manually or via assignment rules/round-robin if enabled).
- When a lead converts to a student/payment case, the connected admission/collection flows take over (see Journeys).

### 7.2 Sales Center

- **Opportunities** — a Kanban of deals with probability, expected revenue, and expected close. Drag cards between stages; stage history is tracked automatically. Pipeline value and weighted value update live.
- **Sales Tasks** — follow-up tasks generated from call outcomes and manual assignments.
- **Quotations** — create and track quotations through their statuses; open one for the full detail/approval trail.
- **Sales Payments** — payments received against deals (cash/UPI/bank/card/cheque/online) with verification states.
- **Sales Performance** — each salesperson's numbers.
- **Collection Center** — collections workbench tied to the sales pipeline.

### 7.3 Admissions & Intake

- **Intake Studio** — capture enquiry submissions (including public forms), validate, deduplicate, and route them into the CRM as leads.
- **Admissions Dashboard** — move an admitted lead through enrollment: **create admission → update status → allocate course → assign batch → collect/verify documents → complete admission**. At the end a student record exists and fee structures apply.

### 7.4 Customer 360

One screen per customer that merges everything: personal data, leads, opportunities, quotations, payments, dues, documents, activity, and communications. Open any customer from the CRM lists to get the full picture before calling them.

---

## 8. Students Modules

### 8.1 Student Registry

The database of enrolled students:
- **Search and filter** by batch, branch, academic session, status.
- Open a **student workspace**: profile, parent/guardian links, enrollment, fees & installments, attendance, marks, documents, and activity.

### 8.2 Student and Parent Portals

Role-gated self-service dashboards:
- **Student Portal** — own dashboard: classes, homework/assignments, lessons, marks, fees due.
- **Parent Portal** — their child's attendance, fee status, and updates.

### 8.3 Documents

Central document management used across modules: folders, tags, versions, and permissions. Certificates and ID cards generated by other modules land here. Upload, version, archive, and control who can see a document from its record.

---

## 9. Finance Modules

### 9.1 Fee Center

The core finance module: fee structures, invoices, receipts, payments, and accounting.

**Set up fee collection**
1. **Finance → Fee structures** — create a structure for a program/batch with **installments** (auto-generate installment schedules for the academic year).
2. Add applicable **discounts, scholarships, waivers**, and **late-fee rules** (approvals apply where configured).
3. Students' balances are generated; follow **Collections** to collect.

**Run the collection cycle**
1. **Collections** shows each student's plan: installments (planned → due → overdue → paid) and PDC pipeline.
2. **Record a payment** — cash/UPI/bank/card/cheque/online with reference; unverified payments wait in a **pending** state until verified (mark **verified** when the money is confirmed).
3. Receipts and invoices are generated automatically and can be emailed/whatsapped; expenses and vendor bills enter the books through their own flows (create → submit for approval → approve → pay).

**Accounting & reports**
- Chart of accounts, journals, cash book, bank accounts, GST rates, tax types, financial years — configured under **Finance Master Data**.
- **Finance Reports** — collections, receivables, revenue, GST and more. Executive roll-ups appear on the CFO dashboard.

### 9.2 Collections

Specialized collections view (also inside CRM Sales → Collection Center):
- See dues, installment health, and payment plans per student/lead.
- Record payments, generate receipts, mark PDC cheques through their lifecycle.

### 9.3 Refunds

1. Open **Refunds** → **Create Refund Request** for the person/account.
2. **Submit for approval** → the request enters the approval center.
3. Once **approved**, **process** the refund and finally **complete** it; the status journey is visible throughout, and refund rules/calculations apply automatically.

### 9.4 PDC & Cheques (Post-Dated Cheques)

Track every post-dated cheque from handover to bank:
- Statuses: **Scheduled → Deposited → Cleared** — or **Bounced / Cancelled** with reasons.
- On a **bounce**: penalty is applied, notices are generated, and the case can be escalated (restrict future cheques, NACH, lawyer assignment, court status, blacklist) if you use the legal module.
- **Reconcile** deposits against the bank statement so cleared amounts match.
- Dashboards summarize due-today/this-week cheques, overdue items, and bounce rates so nobody misses a deposit date.

---

## 10. HR Modules

### 10.1 Employee Registry

The database of employees (an employee is a person record with an employment file).

- **Create/search** employees; open an **employee workspace** with all lifecycle tabs.
- Manage employment lifecycle events from the record: **onboard → confirm → transfer → promote → change department → assign manager → suspend → reinstate → resign → relieve → terminate → retire**.
- HR master data (employee types, categories, employment statuses, work locations, skills, experience levels, document types) lives under **Master Data → HR**.

### 10.2 Recruitment (Hiring)

The complete hiring pipeline, all on one page.

**Create a requisition & publish**
1. **Recruiting → New Requisition** — role, department, headcount, requirements.
2. **Submit for approval** → the requisition moves to Approvals.
3. Approver opens it in the Approval Center and approves/rejects.
4. **Publish job** once approved (or **Close** the posting when filled).

**Manage candidates**
1. **Add Candidate** — creates the person and candidate record in one go.
2. Move the candidate through the pipeline: **New → Shortlisted → Interview Scheduled → Interview Completed → Offered → Hired** — buttons per card (or back where a stage legitimately allows it). **Reject** with a reason when needed.
3. **Schedule interview** → choose slot/panel → when done, **record the interview** with a pass/fail result and score (assessments can be attached).
4. **Create offer** for the chosen candidate → **approve** internally → track **accept / decline**.
5. **Hire** — moves the candidate into onboarding (see next).

### 10.3 Onboarding (New Hires)

1. From **HR → Onboarding**, pick a **hired candidate**.
2. Click **Generate default checklist** — the standard task list appears in one click.
3. Add custom tasks with assignee and due date as needed.
4. Track the **progress bar**; the new hire or HR completes each task (**complete / reopen**) and removes tasks that don't apply.
5. Once onboarding is done the employee record is active for payroll/leave/attendance.

### 10.4 Leave Management

**Apply for leave (employee)**
1. **HR → Leave** → **Apply Leave** tab.
2. Choose the employee (pre-filled for you), leave **type**, **from/to dates**, and reason.
3. Submit → the request enters **Pending** and notifies the approver.

**Approve or reject (manager/HR)**
1. Open the **Applications** queue (filter by status).
2. Review, then **Approve** or **Reject** with a comment. The employee is notified.

**Manage types and balances**
- **Leave Types** tab — define types (Casual, Sick, Earned, etc.) with entitlement; HR adds new types here.
- **Balances** tab — per-employee leave balance per type; opening balance adjustments happen here.

### 10.5 Payroll & Salary

**Set up salary**
1. **HR → Payroll → Salary Structures** tab → **Create Structure**.
2. Choose the employee (must have a structure before payroll can include them) and define pay components.
3. Save — the employee becomes eligible for pay runs.

**Run payroll**
1. **Run Payroll** tab — choose month/year and select employees (only those with structures appear).
2. Execute the run → payslips are generated per employee.
3. **Approve** payslips individually or **Approve All**; approved payslips leave the pending queue and feed the payroll dashboard totals.

### 10.6 HR Dashboard (HR Analytics)

Live hub for HR: active employee counts, pending leaves, who is on leave today, payroll this month, payslips awaiting approval, department sizes — plus quick links into Recruitment, Onboarding, Leave, Payroll, Attendance, and the Employee Registry.

### 10.7 People (Unified Registry)

A master registry of every *person* the organization deals with (employees, leads, students, parents, vendors, contacts). People are linked to records rather than duplicated. **Person workspaces** collect addresses, contacts, emergency contacts, relationships, documents, and QR identity.

### 10.8 Performance

Reviews: create a review for an employee → submit → acknowledge. The review trail stays on the employee record.

---

## 11. Operations Modules

### 11.1 Procurement

- **Vendors** — create and manage vendor master data.
- **Purchase workflow:** create a **requisition** → **submit for approval** → approver approves → **create a purchase order (PO)** → **submit PO for approval** → approved → receive goods (**goods receipt**).
- Track each document's state and approvals; open any vendor to see their purchase history.

### 11.2 Inventory

- **Items / stock**: add inventory items, adjust stock, set stock limits and locations.
- **Transfers:** raise a transfer request between locations → approve → stock moves. Reserved stock is tracked so promises are honored.
- Low-stock and movement views keep operators ahead of shortages.

### 11.3 Employee Assets (under Procurement / Administration)

Allocate company assets to employees and track them:
- **Allocate** an asset to a person with a return date → transfer between people → mark **returned** → **dispose/write-off** when end of life. Depreciation can be calculated on fixed assets.

### 11.4 Production

Production task management (content/print/digital production for the group): create production tasks, move them through the pipeline, assign work, and track completion on the Production dashboard.

### 11.5 Support & Tickets

- **Tickets** — raise an issue/request ticket; every ticket tracks status, priority, SLA, and history.
- **Support Dashboard / Agent Queue** — agents pick up tickets, work them, and resolve; SLA policies can auto-flag/escalate.
- **Knowledge Base** — write and read help articles; link articles to tickets to answer faster.

### 11.6 Operations Center / Command Center

Technical/operational monitoring screens for administrators (runtime health, queues, escalations, and observability). Most users never need these; they exist so the platform team can watch live health.

---

## 12. Communication & Marketing

- **Campaigns** — plan and run marketing campaigns.
- **Marketing Analytics** — campaign performance and channel results.
- **Communication master data** — notification types and Email / SMS / WhatsApp templates reused by the whole system (so announcements and receipts look consistent).

**Send a broadcast/announcement:** from Messenger (Announcements) or CEO Control Center → **Broadcast**. Choose the audience; recipients get a notification with a link.

---

## 13. Reports, Analytics and Platform

### 13.1 Reports & Analytics

- **Analytics dashboards** — pre-built BI views (finance, collections, marketing, HR, exams, and more) with charts and KPIs.
- **Reports** — run reports, save favorites, schedule them.
- **Dashboard Builder** — design your own dashboard: pick widgets/layout and save for yourself or your role.

### 13.2 Platform Studio / Master Data / Workflow Studio (configuration)

These are **configuration** areas — change carefully, since every module reads this data:

- **Master Data Studio** — the reference data hub. One entry point per area: **Academic, CRM, Sales, Finance, HR, Communication, Organization, System**. Inside each area you maintain its lists (lead sources, priorities, stages, fee categories, bank accounts, GST rates, leave-related HR masters, departments/companies/branches/teams/designations, email/SMS/WhatsApp templates, and so on). Adding a value here immediately makes it available in that module's pickers.
- **Workflow Studio** — design/version approval and automation flows (definitions, nodes, edges) and **publish** them. **Workflow Monitor** shows live executions.
- **Form Studio** — build dynamic forms (e.g., enquiry/intake forms) with fields, validation, and publish states; submissions flow into intake/CRM.
- **Platform Studio / AI / Integrations** — registry and integration explorers for the platform team.

---

## 14. End-to-End Journeys

### Journey A — CEO: set up a new employee who can work (the MVP acceptance path)

1. **Login** as `ceo` / `admin123`.
2. **Organization → Teams** → create the team (pick its department).
3. **User Management → New User** → create the user with a role and assign their **scope** (team/department/branch).
4. Hand the credentials to the user; they log in and land on their dashboard.
5. **Tasks → New Task** → assign them a task with due date and priority. They see it immediately and start working (checklist + comments).
6. Work that needs sign-off: submit for approval → you approve in **Approvals** → they are notified.
7. Everything they touch appears in your **Dashboard** activity and in the notifications they receive.

### Journey B — Hire someone (Recruitment → Onboarding → Employee)

1. **Recruiting** → create requisition → submit → approve → publish job.
2. Add a candidate → move through pipeline (shortlist → interview → record result → offer → accept).
3. **Hire** the candidate.
4. **HR → Onboarding** → open the hire → **Generate default checklist** → add tasks → track to 100%.
5. The employee now appears in the **Employee Registry**, gets a salary structure in **Payroll**, can **apply for leave**, and **marks attendance**.

### Journey C — A lead becomes a paying student (CRM → Admissions → Finance)

1. **Lead Center** → create a lead → work it with calls/follow-ups → **convert**.
2. **Admissions** → create the admission → complete documents → student record created.
3. **Finance** → fee structure applies installments to the student's account.
4. **Collections** → record payments (cash/UPI/cheque). Cheques go into the **PDC** pipeline as scheduled; deposit → clear or bounce with penalty.
5. The student checks their own view in the **Student Portal**.

### Journey D — A staff month (Attendance → Leave → Payroll)

1. Mark attendance daily (manual or QR/GPS/face).
2. Apply for leave → manager approves.
3. Payroll month-end: **Run Payroll** → approve payslips → done. The HR Dashboard reflects it all.

---

## 15. Troubleshooting and FAQ

**I forgot my password / my session expired.**
Ask an admin to reset it in **User Management** (or the CEO via Control Center). Log in again with the temporary password and change it in **Profile**. If you see "Session expired or invalid", log out and back in.

**I logged in but I cannot see a module.**
Modules are filtered by your **role and scope**. Ask an admin to check your **Effective Access** in **Access Control**. If you should have it, they adjust your role/scope in **User Management**.

**My action did nothing / I got a red error.**
Take a screenshot of the message (it includes a request ID) and send it to your administrator along with the page you were on. Common causes: missing scope on the record, or a session that needs a fresh login.

**The page looks old / a module says it failed to load after an update.**
Press **Ctrl+Shift+R** (hard refresh) once. If it still fails, close the tab and reopen the app.

**I was blocked with "You are offline".**
Your connection to the server dropped. Reconnect — the app reconnects automatically and your data is safe.

**A select box seems to be missing an option I know exists.**
Options with blank names are hidden by design (the app can't render a choice with no label). Fix the source record's name in **Master Data** and it will appear.

**What does "scope denied" mean?**
Your user is allowed to perform that action, but not *on that record's* company/branch/department. Ask the record owner to include you in the scope, or have an admin widen it.

**Who can reset a user's password / disable a user?**
Admins and the CEO. Staff cannot manage accounts.

**Where do receipts, offers, and letters come from?**
Automatically from the modules that own them (payments → receipts; recruitment → offer letters; HR → relieving/experience letters; exams → hall tickets/marksheets) using the templates configured under **Master Data → Communication**. Ask an admin to adjust the template if the output needs your branding.

**Where is my data visible to others?**
Every important action is **audited** (Audit Center) and appears on the relevant record's **Activity** tab. Treat the system as transparent: comments, approvals, and changes carry your name.

---

*This manual describes the current EEOS release. Screens evolve with the product; if a button's location has moved, use **Global Search** or the module map above to find the workflow.*
