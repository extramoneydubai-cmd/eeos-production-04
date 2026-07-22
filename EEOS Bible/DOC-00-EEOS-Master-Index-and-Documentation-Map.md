# DOC-00 — EEOS Master Index & Documentation Map

> **Document Type:** Master Index / Home Page  
> **Status:** Live (v1.0)  
> **Date:** July 2026  
> **Author:** EEOS Architecture Team  
> **Purpose:** Navigation, Planning, Progress Tracking, Development Priority

---

## EEOS — Enterprise Education Operating System

### Vision

To build a **modular, event-driven, AI-ready Education ERP** that serves every type of educational institution with a single unified platform.

### Purpose

EEOS is not a monolithic application. It is a **platform of platforms** — a collection of loosely coupled, domain-driven modules that communicate through events, share a common data layer, and present through multiple interfaces (web app, mobile app, parent portal, employee portal).

### Scope

| Target | Description |
|--------|-------------|
| **Schools** | K-12, CBSE, ICSE, State Boards |
| **Colleges** | Undergraduate, Postgraduate, Diploma |
| **Coaching Institutes** | JEE, NEET, UPSC, Banking, SSC |
| **Universities** | Multi-department, multi-campus |
| **Corporate Training** | L&D, certifications, upskilling |
| **Enterprise Learning** | LMS, compliance training |

### Architecture Philosophy

- **Entity First, Module Second** — Design entities before building features around them.
- **Single Source of Truth** — Every piece of data lives in exactly one place.
- **No Duplicate Data** — Reference, never copy.
- **Event-Driven Architecture** — Modules raise events; other modules react.
- **Reference Everything by ID** — Never hard-code relationships.
- **Never Break Existing Modules** — Extend, never modify.
- **Documentation Before Development** — Architecture before coding.

### Core Principles

1. **Finance owns money.** Admission, Student, Collections only read payment status.
2. **Communication owns delivery.** Business modules raise events.
3. **Family is shared.** Lead V2 Family entity is reused by Admission, Student, and Communication.
4. **One source of truth for every domain.** No module duplicates another module's data.
5. **Channels are pluggable.** Adding WhatsApp, SMS, Email requires zero business logic changes.
6. **Templates are reusable.** One "reminder" template serves Finance, Attendance, and Exams.
7. **Everything is logged.** Activity timeline for every entity.
8. **AI-ready from day one.** Every entity, event, and relationship is designed for ML consumption.

---

## Section 1 — Project Overview

EEOS is a **SaaS ERP platform** designed to manage the complete lifecycle of educational institutions: from marketing and lead generation to alumni relations.

The platform is built on:

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind v4 |
| UI Library | shadcn/ui (Radix primitives) |
| Backend & Database | Convex (reactive, real-time, ACID) |
| Auth | Convex Auth (email OTP, anonymous) |
| Animations | Framer Motion |
| State | React hooks + Convex reactive queries |
| Icons | Lucide React |

---

## Section 2 — Current Project Status

### Overall Progress

```
Architecture Documents    ████████████████░░░░  80%   (6/7 planned)
Business Workflows        ██████████░░░░░░░░░░  50%   (5/10 planned)
Master Data Studio        ████████████████████  90%   (18/20 built)
CRM (Lead Management)     ████████████████░░░░  75%   (Core functional)
Admissions                ████░░░░░░░░░░░░░░░░  20%   (Architecture done)
Student Management        ████░░░░░░░░░░░░░░░░  20%   (Architecture done)
Finance & Fee Engine      ████░░░░░░░░░░░░░░░░  20%   (Architecture done)
Communication Engine      ████░░░░░░░░░░░░░░░░  20%   (Architecture done)
HR & Payroll              ░░░░░░░░░░░░░░░░░░░░   0%
Marketing & Campaigns     ░░░░░░░░░░░░░░░░░░░░   0%
Parent Portal             ░░░░░░░░░░░░░░░░░░░░   0%
Student App               ░░░░░░░░░░░░░░░░░░░░   0%
Employee App              ░░░░░░░░░░░░░░░░░░░░   0%
SaaS Administration       ░░░░░░░░░░░░░░░░░░░░   0%
AI / ML Engine            ░░░░░░░░░░░░░░░░░░░░   0%
```

### Domain Completion

| Domain | Docs | Backend | Frontend | Status |
|--------|------|---------|----------|--------|
| **Architecture** | ✅ 100% | — | — | ✅ Complete |
| **Organization** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **CRM Masters** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **Academic Masters** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **Lead Management** | ✅ 100% | ✅ 85% | ✅ 75% | 🟢 High |
| **Admissions** | ✅ 100% | 🔶 0% | 🔶 0% | 🟡 Medium |
| **Students** | ✅ 100% | 🔶 0% | 🔶 0% | 🟡 Medium |
| **Finance** | ✅ 100% | ⚠️ 25% | 🔶 0% | 🟡 Medium |
| **Communication** | ✅ 100% | ⚠️ 20% | 🔶 0% | 🟡 Medium |
| **Tasks** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **Approvals** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **Messenger** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **Sales** | — | ✅ 80% | ✅ 80% | 🟢 High |
| **Collections** | — | ✅ 100% | ✅ 100% | ✅ Complete |
| **HR** | 🔶 0% | 🔶 0% | 🔶 0% | 🔴 None |
| **Marketing** | 🔶 0% | 🔶 0% | 🔶 0% | 🔴 None |

---

## Section 3 — EEOS Documentation Structure

```
EEOS Bible/
│
├── DOC-00-EEOS-Master-Index-and-Documentation-Map.md  ← YOU ARE HERE
│
├── 01-Vision/
│   (Future: Product vision, mission, market analysis)
│
├── 02-Architecture/
│   ├── ARCH-04-Master-Entity-Relationship-Blueprint.md     ✅ Completed
│   ├── ARCH-05-Event-Driven-Architecture.md                🔶 Planned
│   ├── ARCH-06-Security-Architecture.md                    🔶 Planned
│   └── ARCH-07-SaaS-Multi-Tenancy-Architecture.md          🔶 Planned
│
├── 03-Business-Workflows/
│   ├── CRM/
│   │   ├── DOC-05-Lead-V2-Architecture.md                  ✅ Completed
│   │   ├── DOC-06-Admission-and-Enrollment-Engine-Bible.md ✅ Completed
│   │   ├── DOC-07-Student-Lifecycle-and-Student-360-Bible.md ✅ Completed
│   │   ├── DOC-08-Finance-and-Fee-Engine-Bible.md          ✅ Completed
│   │   └── DOC-09-Communication-and-Notification-Engine-Bible.md ✅ Completed
│   ├── DOC-10-Workflow-and-Automation-Engine.md            🔶 Planned
│   ├── DOC-11-Collection-and-Recovery-Engine.md            🔶 Planned
│   ├── DOC-12-Sales-and-Performance-Engine.md              🔶 Planned
│   ├── DOC-13-Reporting-and-Analytics-Engine.md            🔶 Planned
│   ├── DOC-14-AI-and-ML-Engine.md                          🔶 Planned
│   └── DOC-15-Security-and-Compliance.md                   🔶 Planned
│
├── 04-Module-Specifications/
│   (Future: Detailed UI/UX specs for each module)
│
├── 05-UI-Standards/
│   (Future: Design system, component library, theming)
│
├── 06-Database/
│   (Future: Data dictionary, migration guides, performance)
│
├── 07-APIs/
│   (Future: Internal API contracts, webhook specs)
│
├── 08-Integrations/
│   (Future: Third-party integration guides)
│
├── 09-AI/
│   (Future: ML model specs, training data, prompts)
│
├── 10-Security/
│   (Future: RBAC, data privacy, compliance)
│
├── 11-Roadmap/
│   (Future: Release plans, milestone tracking)
│
├── 12-Decision-Logs/
│   (Future: Architecture decisions, trade-offs)
│
└── 13-Changelog/
    (Future: Version history, breaking changes)

Other Root Files:
├── MASTER_DATA_FRAMEWORK.md          — Master Data Studio Architecture
└── README.md                         — Project README
```

---

## Section 4 — Architecture Documents

### Completed

| Ref | Title | Status | Purpose |
|-----|-------|--------|---------|
| **ARCH-04** | [Master Entity Relationship Blueprint](02-Architecture/ARCH-04-Master-Entity-Relationship-Blueprint.md) | ✅ **Completed** | Complete entity inventory (134 entities, 16 domains), relationship map, duplicate entity audit, missing entity audit, architecture health score |

### Planned

| Ref | Title | Priority | Purpose |
|-----|-------|----------|---------|
| **ARCH-01** | System Architecture Overview | P1 | High-level system architecture, module boundaries, tech stack |
| **ARCH-02** | Authentication & Authorization | P0 | RBAC, permission model, scope management |
| **ARCH-03** | Data Modelling Conventions | P1 | Naming, indexing, migration, validation |
| **ARCH-05** | Event-Driven Architecture | P2 | Event bus, pub/sub, event sourcing |
| **ARCH-06** | Security Architecture | P2 | Encryption, audit, GDPR, data retention |
| **ARCH-07** | SaaS Multi-Tenancy Architecture | P3 | Org isolation, scaling, deployment |
| **ARCH-08** | API & Webhook Architecture | P3 | Internal APIs, third-party webhooks |
| **ARCH-09** | AI/ML Architecture | P3 | Model serving, feature store, training pipeline |

---

## Section 5 — Business Workflow Documents

### Completed

| Ref | Title | Status | Content |
|-----|-------|--------|---------|
| **DOC-05** | [Lead V2 Architecture Bible](03-Business-Workflows/CRM/DOC-05-Lead-V2-Architecture.md) | ✅ **Completed** | Current lead audit, lead profile, family, family contacts, siblings, marketing attribution, dynamic forms, admission conversion, AI opportunities (17 sections) |
| **DOC-06** | [Admission & Enrollment Engine Bible](03-Business-Workflows/CRM/DOC-06-Admission-and-Enrollment-Engine-Bible.md) | ✅ **Completed** | Admission lifecycle (15 stages), admission entity, checklist engine, seat reservation, document verification, student creation, batch allocation, parent portal activation (16 sections) |
| **DOC-07** | [Student Lifecycle & Student 360° Bible](03-Business-Workflows/CRM/DOC-07-Student-Lifecycle-and-Student-360-Bible.md) | ✅ **Completed** | Student master entity, 360° dashboard, academic profile, attendance, assessments, fee relationship, medical, transport, hostel, library, certificates, placement, timeline (23 sections) |
| **DOC-08** | [Finance & Fee Engine Bible](03-Business-Workflows/CRM/DOC-08-Finance-and-Fee-Engine-Bible.md) | ✅ **Completed** | Fee structure, components, student fee plan, invoices, installments, receipts, payment modes, scholarships, discounts, waivers, refunds, collections integration, reports, dashboard, AI opportunities (23 sections) |
| **DOC-09** | [Communication & Notification Engine Bible](03-Business-Workflows/CRM/DOC-09-Communication-and-Notification-Engine-Bible.md) | ✅ **Completed** | Template engine, recipient resolver, event engine, automation rules, scheduling, delivery tracking, marketing, parent/student/employee communication, notification center, analytics, AI opportunities (23 sections) |

### Planned

| Ref | Title | Priority | Dependencies |
|-----|-------|----------|-------------|
| **DOC-10** | Workflow & Automation Engine | P1 | DOC-09 (Event Engine) |
| **DOC-11** | Collection & Recovery Engine | P1 | DOC-08 (Finance) |
| **DOC-12** | Sales & Performance Engine | P2 | DOC-05 (Lead V2) |
| **DOC-13** | Reporting & Analytics Engine | P2 | All docs |
| **DOC-14** | AI & ML Engine | P3 | ARCH-09 |
| **DOC-15** | Security & Compliance Architecture | P2 | ARCH-06 |

---

## Section 6 — Module Documentation Roadmap

| Module | Status | Priority | Docs | Backend | Frontend |
|--------|--------|----------|------|---------|----------|
| **CRM — Lead Management** | 🟢 High | P0 | ✅ DOC-05 | ✅ 85% | ✅ 75% |
| **CRM — Masters** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Organization Studio** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Master Data Studio** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Academic Studio** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Admissions** | 🟡 Medium | P0 | ✅ DOC-06 | 🔶 0% | 🔶 0% |
| **Students** | 🟡 Medium | P0 | ✅ DOC-07 | 🔶 0% | 🔶 0% |
| **Academics — Scheduling** | 🔴 Low | P1 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Academics — Attendance** | 🔴 Low | P1 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Academics — Exams** | 🔴 Low | P2 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Finance & Fee Engine** | 🟡 Medium | P0 | ✅ DOC-08 | ⚠️ 25% | 🔶 0% |
| **Collections** | ✅ Complete | P1 | 🔶 Planned | ✅ 100% | ✅ 100% |
| **Sales** | 🟢 High | P1 | 🔶 Planned | ✅ 80% | ✅ 80% |
| **Tasks** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Approvals** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Messenger** | ✅ Complete | P0 | — | ✅ 100% | ✅ 100% |
| **Communication Engine** | 🟡 Medium | P1 | ✅ DOC-09 | ⚠️ 20% | ⚠️ 20% |
| **HR & Payroll** | 🔴 None | P3 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Marketing & Campaigns** | 🔴 None | P2 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Parent Portal** | 🔴 None | P0 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Student App** | 🔴 None | P1 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **Employee App** | 🔴 None | P3 | 🔶 Planned | 🔶 0% | 🔶 0% |
| **AI/ML Engine** | 🔴 None | P3 | 🔶 DOC-14 | 🔶 0% | 🔶 0% |

---

## Section 7 — Master Data Studio Tracker

### CRM Masters (Master Data Studio)

| Master | Schema Table | Backend | Page | Route | Status |
|--------|-------------|---------|------|-------|--------|
| Lead Sources | `crmSources` | ✅ `crmSources.ts` | ✅ `MasterDataLeadSources.tsx` | `/studios/master-data/crm/lead-sources` | ✅ **Complete** |
| Lead Priorities | `crmPriorities` | ✅ `crmPriorities.ts` | ✅ `MasterDataLeadPriorities.tsx` | `/studios/master-data/crm/lead-priorities` | ✅ **Complete** |
| Lead Tags | `crmTags` | ✅ `crmTags.ts` | ✅ `MasterDataLeadTags.tsx` | `/studios/master-data/crm/lead-tags` | ✅ **Complete** |
| Lead Stages | `crmStages` | ✅ `crmStages.ts` | ✅ `LeadStageStudio.tsx` (standalone) | `/crm/settings/stages` | ✅ **Complete** |
| Lost Reasons | `crmLostReasons` | ✅ `crmLostReasons.ts` | ✅ `MasterDataLostReasons.tsx` | `/studios/master-data/crm/lost-reasons` | ✅ **Complete** |

### Organization Masters (Master Data Studio)

| Master | Schema Table | Backend | Page | Route | Status |
|--------|-------------|---------|------|-------|--------|
| Organization | — | ✅ `organization.ts` | ✅ `OrganizationStudio.tsx` | `/studios/master-data/organization` | ✅ **Complete** |
| Companies | `orgCompanies` | ✅ `organizationCompanies.ts` | ✅ `MasterDataCompanies.tsx` | `/studios/master-data/organization/companies` | ✅ **Complete** |
| Branches | `orgBranches` | ✅ `organizationBranches.ts` | ✅ `MasterDataBranches.tsx` | `/studios/master-data/organization/branches` | ✅ **Complete** |
| Departments | `orgDepartments` | ✅ `organizationDepartments.ts` | ✅ `MasterDataDepartments.tsx` | `/studios/master-data/organization/departments` | ✅ **Complete** |
| Designations | `orgDesignations` | ✅ `organizationDesignations.ts` | ✅ `MasterDataDesignations.tsx` | `/studios/master-data/organization/designations` | ✅ **Complete** |
| Teams | `orgTeams` | ✅ `organizationTeams.ts` | ✅ `MasterDataTeams.tsx` | `/studios/master-data/organization/teams` | ✅ **Complete** |

### Academic Masters (Master Data Studio)

| Master | Schema Table | Backend | Page | Route | Status |
|--------|-------------|---------|------|-------|--------|
| Academic Sessions | `academicSessions` | ✅ `academicSessions.ts` | ✅ `MasterDataAcademicSessions.tsx` | `/studios/master-data/academic/sessions` | ✅ **Complete** |
| Academic Boards | `academicBoards` | ✅ `academicBoards.ts` | ✅ `MasterDataBoards.tsx` | `/studios/master-data/academic/boards` | ✅ **Complete** |
| Academic Verticals | `academicVerticals` | ✅ `academicVerticals.ts` | ✅ `MasterDataVerticals.tsx` | `/studios/master-data/academic/verticals` | ✅ **Complete** |
| Academic Sub Verticals | `academicSubVerticals` | ✅ `academicSubVerticals.ts` | ✅ `MasterDataSubVerticals.tsx` | `/studios/master-data/academic/sub-verticals` | ✅ **Complete** |
| Academic Programs | `academicPrograms` | ✅ `academicPrograms.ts` | ✅ `MasterDataPrograms.tsx` | `/studios/master-data/academic/programs` | ✅ **Complete** |
| Academic Subjects | `academicSubjects` | ✅ `academicSubjects.ts` | ✅ `MasterDataSubjects.tsx` | `/studios/master-data/academic/subjects` | ✅ **Complete** |
| Academic Batch Types | `academicBatchTypes` | ✅ `academicBatchTypes.ts` | ✅ `MasterDataBatchTypes.tsx` | `/studios/master-data/academic/batch-types` | ✅ **Complete** |

### Future Masters

| Domain | Masters Needed | Priority |
|--------|---------------|----------|
| **Finance** | Fee Components, Fee Structures, Tax Rates | P0 |
| **Communication** | Communication Templates, Automation Rules | P1 |
| **HR** | Employment Types, Leave Types, Pay Structures | P3 |
| **Attendance** | Attendance Types, Leave Policies, Holiday Calendars | P1 |
| **Exams** | Exam Types, Grade Scales, Assessment Templates | P2 |
| **Marketing** | Campaign Types, Segments, Consent Templates | P2 |
| **Admin** | Document Types, Configuration Settings | P2 |

---

## Section 8 — Implementation Roadmap

### Phase 1 — Foundation ✅ (Current)

**Status:** Mostly complete  
**Focus:** Core infrastructure

- ✅ Authentication & User Management
- ✅ Organization Studio (Company, Branch, Department, Team, Designation)
- ✅ Master Data Framework & MasterDataTable component
- ✅ CRM Masters (Sources, Priorities, Tags, Lost Reasons)
- ✅ Lead Management (Full CRUD, stage pipeline, followups, bulk ops)
- ✅ Task Management (Full CRUD, checklists, comments)
- ✅ Approval System (Templates, requests, multi-phase)
- ✅ Messenger (Channels, DMs, announcements, mentions)
- ✅ Collection Engine (Payment plans, installments, PDCs, commitments)
- ✅ Academic Foundation (Sessions, Boards, Verticals, SubVerticals, Programs, Subjects, Batch Types)
- ✅ Notification System (In-app notifications, mark read, list)
- ✅ WhatsApp Messaging (Send messages, templates)

### Phase 2 — Core ERP 🟡 (In Progress)

**Focus:** Student lifecycle, finance, communication

| Item | Priority | Status |
|------|----------|--------|
| **Lead V2 Implementation** (Profile, Family, Contacts) | P0 | 🔶 Architecture done |
| **Admission Engine** (Admission entity, checklist, verification) | P0 | 🔶 Architecture done |
| **Student Master** (Student record, dashboard) | P0 | 🔶 Architecture done |
| **Fee Structure & Invoice Engine** | P0 | 🔶 Architecture done |
| **Receipt Engine** | P0 | 🔶 Architecture done |
| **Communication Template Engine** | P0 | 🔶 Architecture done |
| **Recipient Resolver** | P0 | 🔶 Architecture done |

### Phase 3 — Automation 🔶 (Planned)

**Focus:** Event-driven workflows, scheduling, collections

| Item | Priority | Status |
|------|----------|--------|
| **Event Engine & Automation Rules** | P1 | 🔶 Planned |
| **Scheduling Engine** | P1 | 🔶 Planned |
| **WhatsApp Enhancement** (Template-first architecture) | P1 | 🔶 Planned |
| **Email Integration** (SendGrid/AWS SES) | P1 | 🔶 Planned |
| **SMS Integration** (Twilio/MSG91) | P1 | 🔶 Planned |
| **Communication Timeline & Analytics** | P2 | 🔶 Planned |
| **Marketing Engine** (Campaigns, segments) | P2 | 🔶 Planned |
| **Scholarship & Discount Engine** | P1 | 🔶 Planned |
| **Refund Engine** | P2 | 🔶 Planned |

### Phase 4 — AI 🤖 (Future)

**Focus:** Predictive analytics, personalization, automation

| Item | Priority | Status |
|------|----------|--------|
| Fee Default Prediction | P3 | 🔶 Planned |
| Dropout & Attendance Risk | P3 | 🔶 Planned |
| Best Time to Send (Communication) | P3 | 🔶 Planned |
| Scholarship Recommendation | P3 | 🔶 Planned |
| Revenue Forecasting | P3 | 🔶 Planned |
| Career Recommendation | P3 | 🔶 Planned |

### Phase 5 — Marketplace 🌐 (Future)

**Focus:** Plugin ecosystem, integrations

| Item | Priority | Status |
|------|----------|--------|
| Payment Gateway Integration | P2 | 🔶 Planned |
| Accounting Software Integration | P3 | 🔶 Planned |
| HRMS Integration | P3 | 🔶 Planned |
| Third-party App Marketplace | P3 | 🔶 Planned |

### Phase 6 — Enterprise 🏢 (Future)

**Focus:** Multi-tenant, white-label, advanced features

| Item | Priority | Status |
|------|----------|--------|
| Multi-Tenant Architecture | P3 | 🔶 Planned |
| White-Label Branding | P3 | 🔶 Planned |
| Advanced Reporting | P2 | 🔶 Planned |
| Custom Field Engine | P2 | 🔶 Planned |
| Workflow Builder (Drag & Drop) | P3 | 🔶 Planned |

---

## Section 9 — Current Development Priorities (Top 20)

| Rank | Task | Owner | Status | Priority | Dependencies |
|------|------|-------|--------|----------|-------------|
| 1 | **Lead V2 — Lead Profile Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-05 |
| 2 | **Lead V2 — Family Entity + CRUD** | Backend | 🔶 Pending | P0 | #1 |
| 3 | **Lead V2 — Family Contacts + CRUD** | Backend | 🔶 Pending | P0 | #2 |
| 4 | **Admission Engine — Admissions Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-06, #3 |
| 5 | **Student Master — Students Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-07, #4 |
| 6 | **Fee Structure — FeeStructures Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-08 |
| 7 | **Fee Components — FeeComponents Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-08 |
| 8 | **Invoice Engine — Invoices Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-08, #6 |
| 9 | **Receipt Engine — Receipts Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-08, #8 |
| 10 | **Communication Templates — Table + CRUD** | Backend | 🔶 Pending | P0 | DOC-09 |
| 11 | **Lead V2 — Lead Profile UI** | Frontend | 🔶 Pending | P0 | #1 |
| 12 | **Family UI** | Frontend | 🔶 Pending | P0 | #2, #3 |
| 13 | **Admission UI** | Frontend | 🔶 Pending | P0 | #4 |
| 14 | **Student 360° Dashboard** | Frontend | 🔶 Pending | P0 | #5 |
| 15 | **Fee Structure UI** | Frontend | 🔶 Pending | P0 | #6 |
| 16 | **Notification Center Enhancement** | Frontend | 🔶 Pending | P1 | DOC-09 |
| 17 | **WhatsApp Enhancement (Template-first)** | Backend | 🔶 Pending | P1 | #10 |
| 18 | **Event Engine & Automation Rules** | Backend | 🔶 Pending | P2 | DOC-09 |
| 19 | **Email Integration** | Backend | 🔶 Pending | P1 | #10 |
| 20 | **SMS Integration** | Backend | 🔶 Pending | P1 | #10 |

---

## Section 10 — Documentation Standards

### Naming Convention

```
DOC-NN — Title.md
ARCH-NN — Title.md
MDS-NN — Title.md

Where:
  DOC      = Business Workflow Document
  ARCH     = Architecture Document
  MDS      = Master Data Studio Patch (code)
  NN       = Sequential number (00, 01, 02...)
  Title    = Short, descriptive, hyphenated
```

### Folder Convention

```
EEOS Bible/
├── NN-Category/
│   ├── Subcategory/
│   │   ├── DOC-NN-Title.md
│   │   └── ARCH-NN-Title.md
│   └── subcategory/
│       └── ...
└── DOC-00-Master-Index.md

Category Prefixes:
  01  = Vision & Strategy
  02  = Architecture
  03  = Business Workflows
  04  = Module Specifications
  05  = UI Standards
  06  = Database
  07  = APIs
  08  = Integrations
  09  = AI
  10  = Security
  11  = Roadmap
  12  = Decision Logs
  13  = Changelog
```

### Patch Naming

```
MDS-NN — Module Short Description

Examples:
  MDS-17 — Academic Sub Verticals Master
  MDS-18 — Academic Programs Master
  MDS-19 — Academic Subjects Master
  MDS-20 — Academic Batch Types Master

Patch types:
  MDS  = Master Data Studio (backend + frontend)
  IMPL = Implementation patch (feature development)
  FIX  = Bug fix
  REF  = Refactor
```

### Markdown Standards

- Use `#` for document title only (H1)
- Use `##` for major sections (H2)
- Use `###` for subsections (H3)
- Use `####` for detailed breakdowns (H4)
- Use `---` for section separators
- Use \`code\` for inline code
- Use \`\`\` for code blocks with language tag
- Use `|` for tables, aligned with dashes
- Use `>` for blockquotes (status, notes)
- Use `-` for unordered lists
- Use `1.` for ordered lists
- Use `**bold**` for emphasis
- Use `*italic*` for secondary emphasis
- Every document must have a header block with status, domain, version, date

### Architecture Standards

- Every architecture decision must be documented before implementation
- Every entity must have: purpose, fields, indexes, relationships, lifecycle
- Every module must have: event registry, data flow, integration points
- Every document must reference its predecessors and successors
- No document should assume knowledge of undocumented modules
- Cross-references use relative paths

---

## Section 11 — Golden Principles

```text
╔══════════════════════════════════════════════════════════════╗
║                    EEOS GOLDEN PRINCIPLES                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Entity First. Module Second.                            ║
║      └── Design entities before building features.            ║
║                                                              ║
║  2.  Single Source of Truth.                                 ║
║      └── Every piece of data lives in exactly one place.      ║
║                                                              ║
║  3.  No Duplicate Data.                                      ║
║      └── Reference by ID. Never copy data across tables.      ║
║                                                              ║
║  4.  Event-Driven Architecture.                              ║
║      └── Modules raise events. Other modules react.           ║
║                                                              ║
║  5.  Reference Everything by ID.                             ║
║      └── No hard-coded relationships. Ever.                   ║
║                                                              ║
║  6.  Never Break Existing Modules.                           ║
║      └── Extend by adding, never by modifying.                ║
║                                                              ║
║  7.  Documentation Before Development.                       ║
║      └── Architecture before coding.                          ║
║                                                              ║
║  8.  Finance Owns Money.                                     ║
║      └── Admission and Student only read.                     ║
║                                                              ║
║  9.  Communication Owns Delivery.                            ║
║      └── Business modules raise events.                       ║
║                                                              ║
║ 10.  Family is Shared.                                       ║
║      └── Lead V2 Family entity reused everywhere.             ║
║                                                              ║
║ 11.  Templates Are Reusable.                                 ║
║      └── One template serves Finance, Attendance, Exams.      ║
║                                                              ║
║ 12.  Everything Is Logged.                                   ║
║      └── Activity timeline for every entity.                  ║
║                                                              ║
║ 13.  AI-Ready from Day One.                                  ║
║      └── Every relationship designed for ML consumption.      ║
║                                                              ║
║ 14.  Channels Are Pluggable.                                 ║
║      └── Adding a channel requires zero business logic        ║
║      changes.                                                ║
║                                                              ║
║ 15.  Recipients Come From Roles, Not Names.                  ║
║      └── "Primary Fee Contact" not "Sunita Patel".            ║
║      Resolver maps roles to actual people.                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Section 12 — EEOS Vision Roadmap

```
2026 Q3 ─── Foundation Phase
  ├── ✅ Master Data Studio (Organization, CRM, Academic)
  ├── ✅ Lead Management (CRM)
  ├── ✅ Tasks, Approvals, Messenger
  ├── ✅ Collection Engine
  ├── 🔶 Lead V2 (Profile, Family, Contacts)
  ├── 🔶 Admission Engine
  └── 🔶 Student Master

2026 Q4 ─── Core ERP Phase
  ├── 🔶 Fee Structure & Invoices
  ├── 🔶 Receipt Engine
  ├── 🔶 Communication Template Engine
  ├── 🔶 WhatsApp Enhancement
  ├── 🔶 Parent Portal MVP
  └── 🔶 Student Dashboard

2027 Q1 ─── Automation Phase
  ├── 🔶 Event Engine & Automation Rules
  ├── 🔶 Email Integration
  ├── 🔶 SMS Integration
  ├── 🔶 Push Notifications
  ├── 🔶 Marketing Engine
  └── 🔶 Financial Reports

2027 Q2 ─── AI Phase
  ├── 🔶 Fee Default Prediction
  ├── 🔶 Attendance Risk Detection
  ├── 🔶 Smart Communication Timing
  ├── 🔶 Scholarship Recommendation
  └── 🔶 Revenue Forecasting

2027 Q3+ ─── Enterprise Phase
  ├── 🔶 Student Mobile App
  ├── 🔶 Advanced Reporting
  ├── 🔶 Custom Field Engine
  ├── 🔶 Workflow Builder
  ├── 🔶 Third-Party Marketplace
  └── 🔶 Multi-Tenant Architecture
```

---

*End of DOC-00 — EEOS Master Index & Documentation Map*
