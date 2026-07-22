# DOC-11 — Sales Pipeline & Revenue Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Sales Pipeline & Revenue Management  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2 Architecture, DOC-06 — Admission Engine, DOC-08 — Finance Engine, DOC-09 — Communication Engine, DOC-10 — Workflow & Automation Engine  
> **Existing Tables:** `leadMaster`, `leadStageHistory`, `leadAssignments`, `leadTasks`, `leadNotes`, `leadActivity`, `leadDiscounts`, `leadApprovals`, `leadPayments`, `leadCourses`, `callLogs`, `leadWhatsAppMessages`, `salesPerformance` (helper module)

---

## Table of Contents

1. [Sales Philosophy](#1-sales-philosophy)
2. [Sales Lifecycle](#2-sales-lifecycle)
3. [Sales Pipeline](#3-sales-pipeline)
4. [Lead Qualification](#4-lead-qualification)
5. [Counselling Workflow](#5-counselling-workflow)
6. [Demo Management](#6-demo-management)
7. [Sales Activities](#7-sales-activities)
8. [Revenue Forecasting](#8-revenue-forecasting)
9. [Sales Team](#9-sales-team)
10. [Sales Targets](#10-sales-targets)
11. [Opportunity Management](#11-opportunity-management)
12. [Objection Management](#12-objection-management)
13. [Lost Lead Analysis](#13-lost-lead-analysis)
14. [Sales Dashboard](#14-sales-dashboard)
15. [Cross-Module Integration](#15-cross-module-integration)
16. [AI Opportunities](#16-ai-opportunities)
17. [Reports](#17-reports)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Golden Rules](#19-golden-rules)

---

## 1. Sales Philosophy

### Purpose

The Sales Engine is the **conversion engine** of EEOS. It takes leads from the CRM, qualifies them through structured processes, and delivers **admission-ready** prospects to the Admission Engine.

### Core Principle

**Every module has one responsibility.**

| Module | Responsibility |
|--------|---------------|
| **CRM** | Stores Lead data (single source of truth) |
| **Sales** | Converts Leads into Admission-ready prospects |
| **Admission** | Enrolls approved prospects as Students |
| **Finance** | Collects Money (invoices, payments, receipts) |
| **Collections** | Recovers Outstanding payments |
| **Student** | Manages Academic lifecycle |

### Business Rules

1. **CRM owns Leads.** The `leadMaster` table is the single source of truth for all lead data. Sales reads from it, never duplicates it.
2. **Sales owns Conversion.** Sales defines the pipeline stages, qualification criteria, and conversion processes.
3. **Admission owns Enrollment.** Once a lead is "Admission Ready," it is handed off to the Admission Engine — Sales does not manage the admission process.
4. **Finance owns Money.** Sales can discuss fees and discounts, but all financial transactions go through Finance.
5. **Revenue is forecasted by Sales.** Revenue forecasts are based on pipeline value, conversion probability, and historical trends.
6. **Pipeline stages are configurable.** Each institution or branch can define their own pipeline.
7. **Every activity is logged.** All calls, meetings, WhatsApp messages, and follow-ups are recorded in the activity timeline.
8. **Conversion is measurable.** Every stage change, assignment, and activity contributes to conversion analytics.

### The Golden Sales Flow

```
Marketing Source (Lead Created)
       │
       ▼
Lead Qualification ──► Discard (Unqualified)
       │
       ▼
Counsellor Assignment
       │
       ▼
Need Analysis & Counselling
       │
       ▼
Program Suggestion
       │
       ▼
Demo / Trial / Workshop
       │
       ▼
Parent Counselling
       │
       ▼
Fee Discussion & Negotiation
       │
       ├── Won → Admission Ready → Admission Engine
       │
       └── Lost → Lost Lead Analysis → Recovery Attempt
```

### Relationship with Existing Modules

| Module | Sales Relationship |
|--------|-------------------|
| **DOC-05 (Lead V2)** | Sales reads and updates lead data through counsellor actions |
| **DOC-06 (Admission)** | Sales hands off "Admission Ready" leads |
| **DOC-08 (Finance)** | Sales checks payment status, discusses discounts |
| **DOC-09 (Communication)** | Sales sends comms via WhatsApp, SMS, Email templates |
| **DOC-10 (Workflow)** | Sales triggers automated workflows (lead assigned, stage changed, etc.) |
| **Existing CRM Dashboard** | Displays sales KPIs, pipeline health, conversion rates |
| **Existing Sales Performance** | Computes counsellor scores, funnel analytics, revenue tracking |

---

## 2. Sales Lifecycle

### Complete Sales Journey

```
Marketing Lead
    (Lead created from any marketing source: Facebook, Google, Walk-in, Referral, Website, etc.)
       │
       ▼
Lead Qualification
    (Counsellor reviews the lead and determines if they fit the target profile)
       │
       ├── Qualified → Continue
       │
       └── Discarded → Mark as Lost (reason: wrong profile)
       │
       ▼
Counsellor Assignment
    (Lead is assigned to a counsellor — manually or auto-assigned by round-robin)
       │
       ▼
Need Analysis
    (Counsellor contacts lead, understands goals, preferences, constraints)
       │
       ▼
Program Suggestion
    (Counsellor suggests suitable programs/ courses based on need analysis)
       │
       ▼
Demo / Trial
    (Lead attends demo class, trial session, workshop, or open house)
       │
       ▼
Parent Counselling
    (Counsellor meets parents, addresses concerns, discusses value proposition)
       │
       ▼
Fee Discussion
    (Fee structure shared, discounts discussed, payment plans offered)
       │
       ▼
Negotiation
    (Price negotiation, discount approval, waiver requests, value-added services)
       │
       ├── Won → Stage: "converted" → Admission Ready
       │
       └── Lost → Lost Lead Analysis
```

### Lifecycle Stage Details

| # | Stage | Entry Criteria | Owner | Key Actions | Exit Criteria |
|---|-------|---------------|-------|-------------|---------------|
| 1 | **New Lead** | Lead created via any source | System / Auto | Auto-Welcome message, Initial data check | Counsellor reviews |
| 2 | **Attempted** | Counsellor makes first contact attempt | Counsellor | Call/WhatsApp, Initial conversation | Contact established |
| 3 | **Connected** | Lead responds to contact attempt | Counsellor | Qualification questions, basic profiling | Lead meets basic criteria |
| 4 | **Qualified** | Lead meets target profile | Counsellor | Lead profile creation, program mapping | Need analysis complete |
| 5 | **Counselling** | Need analysis done | Counsellor | Deep counselling, career guidance, program fit | Program selected |
| 6 | **Interested** | Program selected | Counsellor | Demo scheduled, materials shared | Demo attended |
| 7 | **Follow Up** | Demo attended / pending decision | Counsellor | Follow-up sequence, objection handling | Parent meeting done |
| 8 | **Negotiation** | Fee discussion active | Counsellor + Manager | Discount approval, installment plans, closing | Decision made |
| 9 | **Converted** | Lead ready for admission | Counsellor → Admission | Handoff to Admission Engine | Admission started |
| 10 | **Lost** | Lead not converting | Counsellor | Lost reason recorded, win-back scheduled | Archived |

---

## 3. Sales Pipeline

### Existing Implementation

The current system already implements a 10-stage pipeline (`LEAD_PIPELINE_STAGES` in `crmHelpers.ts`):

| Stage ID | Label | Color | Description |
|----------|-------|-------|-------------|
| `new` | New | `#9aa0a6` | Fresh lead, not yet contacted |
| `attempted` | Attempted | `#4285f4` | Contact attempt made, no response yet |
| `connected` | Connected | `#34a853` | Lead reached and engaged |
| `qualified` | Qualified | `#fbbc04` | Lead meets target criteria |
| `counselling` | Counselling | `#a855f7` | Active counselling in progress |
| `interested` | Interested | `#1a73e8` | Lead shows clear interest |
| `follow_up` | Follow Up | `#ea4335` | Follow-up sequence active |
| `negotiation` | Negotiation | `#e8710a` | Fee and terms under negotiation |
| `converted` | Converted | `#0d652d` | Admission ready |
| `lost` | Lost | `#5f6368` | Lead lost |

### DOC-11 Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Configurable Stages** | Institutions can add/remove/rename stages |
| **Stage Probability %** | Each stage has a default conversion probability |
| **Stage SLA** | Maximum time a lead should stay in a stage |
| **Stage Automation** | Auto-triggers on stage entry/exit (via DOC-10) |
| **Stage Kanban** | Drag-and-drop lead movement across stages |
| **Stage Analytics** | Conversion rate, avg time, drop-off per stage |

### Pipeline Stage Configuration

```json
{
  "pipelineConfig": {
    "name": "Standard EEOS Pipeline",
    "stages": [
      {
        "id": "new",
        "label": "New",
        "color": "#9aa0a6",
        "probability": 10,
        "slaDays": 2,
        "automation": {
          "onEntry": ["wf_lead_welcome"],
          "onExit": ["wf_lead_first_contact"]
        }
      },
      {
        "id": "attempted",
        "label": "Attempted",
        "color": "#4285f4",
        "probability": 20,
        "slaDays": 3,
        "automation": {
          "onEntry": [],
          "onExit": ["wf_lead_escalate_unresponsive"]
        }
      },
      {
        "id": "connected",
        "label": "Connected",
        "color": "#34a853",
        "probability": 35,
        "slaDays": 2,
        "automation": {
          "onEntry": ["wf_send_program_info"]
        }
      },
      {
        "id": "qualified",
        "label": "Qualified",
        "color": "#fbbc04",
        "probability": 50,
        "slaDays": 3,
        "automation": {
          "onEntry": ["wf_schedule_counselling"]
        }
      },
      {
        "id": "counselling",
        "label": "Counselling",
        "color": "#a855f7",
        "probability": 65,
        "slaDays": 5,
        "automation": {
          "onEntry": ["wf_create_counselling_task"]
        }
      },
      {
        "id": "interested",
        "label": "Interested",
        "color": "#1a73e8",
        "probability": 75,
        "slaDays": 4,
        "automation": {
          "onEntry": ["wf_schedule_demo"]
        }
      },
      {
        "id": "follow_up",
        "label": "Follow Up",
        "color": "#ea4335",
        "probability": 60,
        "slaDays": 7,
        "automation": {
          "onEntry": ["wf_followup_sequence"]
        }
      },
      {
        "id": "negotiation",
        "label": "Negotiation",
        "color": "#e8710a",
        "probability": 80,
        "slaDays": 7,
        "automation": {
          "onEntry": ["wf_discount_approval_check"]
        }
      },
      {
        "id": "converted",
        "label": "Converted",
        "color": "#0d652d",
        "probability": 100,
        "slaDays": null,
        "automation": {
          "onEntry": ["wf_start_admission"]
        }
      },
      {
        "id": "lost",
        "label": "Lost",
        "color": "#5f6368",
        "probability": 0,
        "slaDays": null,
        "automation": {
          "onEntry": ["wf_lost_lead_analysis"]
        }
      }
    ],
    "isActive": true
  }
}
```

### Pipeline Kanban (Existing Implementation)

The current `SalesWorkspace.tsx` already implements a fully functional Kanban pipeline:

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│   NEW      │ │ CONNECTED  │ │ QUALIFIED  │ │COUNSELLING │ │INTERESTED  │
│    12      │ │    18      │ │    25      │ │    20      │ │    15      │
├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤
│ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │
│ │Raj     │ │ │ │Priya   │ │ │ │Amit    │ │ │ │Sunita  │ │ │ │Vikram  │ │
│ │Patel   │ │ │ │Sharma  │ │ │ │Singh   │ │ │ │Verma   │ │ │ │Joshi   │ │
│ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │
│ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │
│ │Ananya  │ │ │ │Rohit   │ │ │ │Neha    │ │ │ │Karan   │ │ │ │Divya   │ │
│ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └────────┘ │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### Pipeline Analytics (Existing)

The existing `salesPerformance.ts` already computes:

- **Funnel distribution** — Count per stage with percentage
- **Funnel drop-off** — Conversion loss between consecutive stages
- **Total in funnel** — Active leads count
- **Conversion rate** — Overall lead-to-admission rate

---

## 4. Lead Qualification

### Purpose

Lead Qualification is the process of determining whether a lead is worth investing sales effort in. It prevents wasting time on leads that are unlikely to convert.

### Qualification Criteria

| Criteria | Question | Scoring |
|----------|----------|---------|
| **Budget** | Does the lead have the financial capacity? | 0-20 points |
| **Authority** | Is the decision maker involved? | 0-20 points |
| **Need** | Does the lead genuinely need the program? | 0-20 points |
| **Timeline** | How soon does the lead plan to enroll? | 0-20 points |
| **Fit** | Does the lead match the target student profile? | 0-20 points |

### BANT Framework

```
B — Budget
  └── Has the family discussed fees? Can they afford the program?
  └── Score: 0 (not discussed) → 20 (budget agreed)

A — Authority
  └── Is the primary decision maker involved in conversations?
  └── Score: 0 (lead only) → 20 (both parents engaged)

N — Need
  └── Does the lead clearly need this program?
  └── Score: 0 (browsing) → 20 (urgent need)

T — Timeline
  └── When does the lead plan to start?
  └── Score: 0 (no timeline) → 20 (immediate enrollment)
```

### Qualification Scorecard

```json
{
  "qualificationScore": 78,
  "maxScore": 100,
  "criteria": {
    "budget": 15,
    "authority": 18,
    "need": 20,
    "timeline": 12,
    "fit": 13
  },
  "overall": "Qualified (78/100)",
  "recommendation": "Proceed — strong fit with budget and need confirmed"
}
```

### Qualification Rules

| Score | Classification | Action |
|-------|---------------|--------|
| 80-100 | **Hot Lead** | Prioritize, fast-track to demo |
| 60-79 | **Warm Lead** | Nurture, schedule counselling |
| 40-59 | **Cold Lead** | Long-term nurture, automated follow-up |
| 0-39 | **Unqualified** | Mark as lost with reason |

### Automation Integration (DOC-10)

```yaml
Trigger: lead.connected
Condition: qualificationScore >= 60
  └── Action: Move to "qualified" stage automatically
Condition: qualificationScore < 40
  └── Action: Move to "lost" stage, create win-back task (30 days)
```

---

## 5. Counselling Workflow

### Purpose

Counselling is the **core value delivery vehicle** of the sales process. It is where the counsellor understands the student's needs, provides career guidance, maps programs, and builds trust.

### Counselling Stages

```
1. Rapport Building
    └── Greet, introduce, establish connection
    └── Key: Listen more than talk

2. Need Analysis
    └── Current academic situation
    └── Career aspirations
    └── Challenges and pain points
    └── Past coaching experience (if any)
    └── Preferred learning style (online/offline/hybrid)

3. Career Guidance
    └── Discuss career options
    └── Explain program relevance
    └── Share success stories
    └── Address career doubts

4. Program Mapping
    └── Match student profile to programs
    └── Explain curriculum, duration, outcomes
    └── Share demo class experience
    └── Discuss batch options (morning/evening/weekend)

5. Parent Discussion
    └── Involve decision maker(s)
    └── Address parent concerns
    └── Share institute credentials
    └── Discuss safety, transport, hostel (if applicable)

6. Objection Handling
    └── Address specific concerns
    └── Provide evidence (results, placements)
    └── Offer trial period if possible

7. Next Step Commitment
    └── Schedule demo / trial
    └── Share fee structure
    └── Set follow-up date
```

### Counselling Note Template

```json
{
  "leadId": "lead_123",
  "counsellingDate": 1760000000000,
  "type": "phone_call",
  "duration": 28,
  "summary": "Spoke with Raj and his mother Sunita. Raj is in Class 12 CBSE, scoring 82% in PCM. Interested in JEE preparation. Concerned about balancing school and coaching.",
  "needsAnalysis": {
    "currentScore": "82%",
    "board": "CBSE",
    "target": "JEE Advanced (IIT)",
    "preparationStatus": "Self-study so far",
    "painPoints": "Time management, weak in Physics"
  },
  "programSuggested": "JEE Foundation + Advanced (2-year)",
  "parentFeedback": "Mother is supportive, father needs to be convinced",
  "nextAction": "Schedule demo class for Physics",
  "nextActionDate": 1760086400000,
  "followUpPriority": "high"
}
```

### Counselling Status

| Status | Description |
|--------|-------------|
| **Scheduled** | Counselling session booked |
| **In Progress** | Session ongoing |
| **Completed** | Counselling done, outcome recorded |
| **Rescheduled** | Lead/parent requested new time |
| **No Show** | Lead did not attend |
| **Cancelled** | Session cancelled by either party |

### Counselling Outcome Codes

| Code | Meaning | Next Recommended Action |
|------|---------|------------------------|
| `interested_program` | Lead interested in suggested program | Schedule demo |
| `need_parent_approval` | Lead needs parent decision | Schedule parent meeting |
| `need_more_info` | Lead wants more details | Share brochure, videos, testimonials |
| `comparison_shopping` | Lead comparing with competitors | Share USPs, offer trial |
| `budget_constraint` | Lead concerned about fees | Discuss payment plans, discounts |
| `timing_conflict` | Lead has schedule conflicts | Suggest alternative batch timings |
| `not_interested` | Lead not interested in any program | Mark as lost |

---

## 6. Demo Management

### Purpose

Demo classes give the prospective student a **taste of the actual learning experience**. A well-executed demo is the single highest-conversion activity in the sales process.

### Demo Types

| Type | Description | Best For |
|------|-------------|----------|
| **Online Demo** | Live virtual class via Zoom/Meet | Remote leads, convenience |
| **Offline Demo** | In-person class at the branch | Local leads, facility showcase |
| **Classroom Visit** | Observe an actual class | Serious leads, final decision stage |
| **Trial Period** | 3-7 days free access to classes | High-hesitation leads |
| **Workshop** | Themed workshop (e.g., "Crack JEE Physics") | Warm leads, group setting |
| **Open House** | Institute tour + faculty meet | Multiple leads, batch events |

### Demo Management Fields

| Field | Type | Purpose |
|-------|------|---------|
| `leadId` | `id(leadMaster)` | Lead reference |
| `demoType` | `string` | Online / Offline / Classroom / Trial / Workshop / Open House |
| `scheduledAt` | `number` | Scheduled date/time |
| `durationMinutes` | `number` | Expected duration |
| `facultyId` | `optional(id(users))` | Faculty conducting the demo |
| `venue` | `optional(string)` | Room/link for the demo |
| `capacity` | `optional(number)` | Max attendees (for group demos) |
| `status` | `string` | Scheduled / Attended / Missed / Cancelled |
| `attendedAt` | `optional(number)` | When lead attended |
| `feedbackScore` | `optional(number)` | Lead's feedback (1-5) |
| `feedbackNotes` | `optional(string)` | Lead's feedback comments |
| `followUpAction` | `optional(string)` | Counsellor's next step after demo |
| `converted` | `boolean` | Whether demo led to conversion |
| `createdAt` | `number` | Timestamp |

### Demo Workflow

```
Counsellor schedules demo
       │
       ▼
System sends confirmation to lead (WhatsApp template: demo_confirmed)
       │
       ▼
Day before: Auto-reminder (WhatsApp template: demo_reminder)
       │
       ▼
Day of demo:
  ├── Lead attends → Status: "Attended"
  │     ├── Record feedback
  │     ├── Counsellor follows up within 24h
  │     └── Move to "interested" or "follow_up"
  │
  └── Lead misses → Status: "Missed"
        ├── Send missed demo message
        ├── Reschedule within 48h
        ├── If missed twice → Flag for manager review
        └── If missed 3 times → Move to "lost"
```

### Demo Conversion Metrics (Existing)

The existing `salesPerformance.ts` already tracks:

| Metric | Description |
|--------|-------------|
| **Scheduled** | Total demos scheduled |
| **Attended** | Demos where lead showed up |
| **Missed** | Demos where lead didn't show |
| **Converted** | Leads who enrolled after demo |
| **Conversion Rate** | Attended → Converted percentage |
| **Miss Rate** | Scheduled → Missed percentage |

### Demo Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  🎯 DEMO PIPELINE — Last 30 Days                             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │Scheduled │  │ Attended │  │  Missed  │  │  Converted   │  │
│  │    47    │  │    35    │  │    12    │  │     22       │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                                                               │
│  Attendance Rate: 74%   │   Conversion Rate: 63%              │
│                                                               │
│  By Demo Type:                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Online     ████████████████████████████  28 attended    │  │
│  │ Offline    ████████████████████          5 attended     │  │
│  │ Workshop   ████████████                    2 attended   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 7. Sales Activities

### Purpose

Every interaction with a lead is a **sales activity**. All activities are logged in the activity timeline for complete audit trail, performance measurement, and AI-driven insights.

### Activity Types

| Activity Type | Logged In | Key Data Points |
|--------------|-----------|----------------|
| **Call** | `callLogs` | Duration, outcome, notes |
| **WhatsApp** | `leadWhatsAppMessages` | Template used, response status |
| **SMS** | Future `leadSmsMessages` | Delivery status |
| **Email** | Future `leadEmailMessages` | Open rate, click rate |
| **Meeting** | `leadActivity` | Type (online/offline), attendees, outcome |
| **Visit** | `leadActivity` | Venue (institute/home), purpose |
| **Parent Meeting** | `leadActivity` | Parent names, concerns raised |
| **Webinar** | `leadActivity` | Webinar topic, attendance |
| **Seminar** | `leadActivity` | Event name, attendance |
| **Open House** | `leadActivity` | Event date, materials shared |

### Activity Logging (Existing)

The existing system (`crmHelpers.ts` → `logActivity`) already logs to the unified `leadActivity` table:

| Action | Description | Logged By |
|--------|-------------|-----------|
| `lead_created` | Lead created | System |
| `stage_changed` | Stage transition | Counsellor / Auto |
| `assigned` | Counsellor assignment | System |
| `call_made` | Call completed | Counsellor |
| `whatsapp_sent` | WhatsApp sent | Counsellor / Auto |
| `meeting_scheduled` | Meeting booked | Counsellor |
| `demo_conducted` | Demo completed | Counsellor |
| `task_created` | Task created | Counsellor / Auto |
| `task_completed` | Task done | Counsellor |
| `note_added` | Counselling note | Counsellor |
| `document_added` | Document uploaded | Counsellor / Parent |
| `fee_discussed` | Fee conversation | Counsellor |
| `discount_applied` | Discount approved | System |
| `payment_received` | Payment made | System |
| `admission_started` | Admission initiated | Counsellor |
| `converted` | Lead converted | System |
| `lost` | Lead lost | Counsellor |

### Activity Timeline (Existing)

The existing system renders a unified timeline in the Sales Performance Dashboard:

```
┌────────────────────────────────────────────────┐
│  DAILY ACTIVITY — Recent Actions (48h)         │
├────────────────────────────────────────────────┤
│                                                │
│  ● Ananya Sharma — Call made                   │
│    Spoke with Raj Patel about demo schedule     │
│    10:30 AM                                    │
│                                                │
│  ● Priya Verma — WhatsApp sent                 │
│    Template: fee_reminder to Sunita Patel       │
│    09:15 AM                                    │
│                                                │
│  ● System — Stage changed                      │
│    Raj Patel moved to "Negotiation"            │
│    Yesterday 03:45 PM                          │
│                                                │
│  ● Amit Mehta — Payment Recorded               │
│    ₹25,000 via UPI                             │
│    Yesterday 02:00 PM                          │
└────────────────────────────────────────────────┘
```

### Activity Volume Metrics (Existing)

The existing system tracks:

| Metric | Description |
|--------|-------------|
| **Calls Today** | Total calls logged today |
| **Call Connection Rate** | Percentage of calls that connected |
| **Avg Call Duration** | Average talk time |
| **WhatsApp Messages** | Total WhatsApp sent today |
| **Follow-ups Completed** | Tasks marked done today |
| **Meetings Scheduled** | Future meetings booked |

---

## 8. Revenue Forecasting

### Purpose

Revenue forecasting predicts **future admission revenue** based on the current pipeline, conversion probabilities, historical trends, and counsellor performance.

### Forecast Dimensions

| Dimension | Description |
|-----------|-------------|
| **Pipeline Value** | Sum of expected revenue from all active leads |
| **Weighted Pipeline** | Pipeline value × stage probability |
| **Expected Revenue** | Realistic revenue estimate based on conversion history |
| **Forecast Accuracy** | How close past forecasts were to actual results |
| **Branch Forecast** | Revenue prediction per branch |
| **Counsellor Forecast** | Revenue prediction per counsellor |
| **Campaign Forecast** | Revenue attribution per marketing campaign |
| **Monthly / Quarterly / Annual** | Time-based revenue projections |

### Pipeline Value Calculation

```
Pipeline Value = Σ(lead.expectedRevenue) for all active leads

Example:
  Lead A: ₹50,000 (Stage: Negotiation)
  Lead B: ₹25,000 (Stage: Counselling)
  Lead C: ₹75,000 (Stage: Interested)
  Lead D: ₹30,000 (Stage: Qualified)

Pipeline Value = ₹50,000 + ₹25,000 + ₹75,000 + ₹30,000 = ₹1,80,000
```

### Weighted Pipeline Calculation

```
Weighted Pipeline = Σ(lead.expectedRevenue × stageProbability)

Example:
  Lead A: ₹50,000 × 80% (Negotiation) = ₹40,000
  Lead B: ₹25,000 × 65% (Counselling) = ₹16,250
  Lead C: ₹75,000 × 75% (Interested)  = ₹56,250
  Lead D: ₹30,000 × 50% (Qualified)   = ₹15,000

Weighted Pipeline = ₹1,27,500
```

### Revenue Forecasting Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  📈 REVENUE FORECAST — Q4 2026                                │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Pipeline     │  │ Weighted     │  │ Expected     │        │
│  │ Value        │  │ Pipeline     │  │ Revenue      │        │
│  │ ₹5,80,000    │  │ ₹3,27,500   │  │₹3,50,000-4L │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
│  Monthly Breakdown:                                           │
│  ┌────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Month  │ Pipeline │ Weighted │ Actual   │ Accuracy │      │
│  ├────────┼──────────┼──────────┼──────────┼──────────┤      │
│  │ Jul    │ ₹1.2L    │ ₹72K     │ ₹85K     │ 85%      │      │
│  │ Aug    │ ₹2.1L    │ ₹1.4L    │ ₹1.1L    │ 79%      │      │
│  │ Sep    │ ₹2.8L    │ ₹1.9L    │ ₹1.5L    │ 92%      │      │
│  │ Oct*   │ ₹3.5L    │ ₹2.3L    │ —        │ —        │      │
│  └────────┴──────────┴──────────┴──────────┴──────────┘      │
│                                                               │
│  By Counsellor:                                               │
│  ┌────────────┬──────────┬──────────┬──────────┐             │
│  │ Counsellor │ Pipeline │ Weighted │ Target   │             │
│  ├────────────┼──────────┼──────────┼──────────┤             │
│  │ Ananya     │ ₹1.8L    │ ₹1.2L    │ ₹2.0L    │ ██████░░ 60%│
│  │ Priya      │ ₹1.5L    │ ₹95K     │ ₹1.5L    │ ████████ 63%│
│  │ Amit       │ ₹2.2L    │ ₹1.1L    │ ₹1.8L    │ ██████░░ 61%│
│  └────────────┴──────────┴──────────┴──────────┘             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Forecast Accuracy Tracking

```json
{
  "forecastAccuracy": {
    "overall": 85.3,
    "monthly": [
      { "month": "Jul-2026", "forecast": 72000, "actual": 85000, "accuracy": 84.7 },
      { "month": "Aug-2026", "forecast": 140000, "actual": 110000, "accuracy": 78.6 },
      { "month": "Sep-2026", "forecast": 190000, "actual": 150000, "accuracy": 78.9 },
      { "month": "Oct-2026", "forecast": 230000, "actual": null, "accuracy": null }
    ],
    "trend": "Improving (+5.2% over last quarter)"
  }
}
```

---

## 9. Sales Team

### Purpose

The Sales Team structure defines roles, responsibilities, KPIs, targets, and performance measurement for all sales personnel.

### Team Hierarchy

```
Sales Director
    │
    ├── Regional Manager (North)
    │     │
    │     ├── Branch Manager (Delhi)
    │     │     ├── Senior Counsellor (Team Lead)
    │     │     │     ├── Counsellor 1
    │     │     │     ├── Counsellor 2
    │     │     │     └── Counsellor 3
    │     │     └── Counsellor 4 (Trainee)
    │     │
    │     └── Branch Manager (Chandigarh)
    │           └── ...
    │
    └── Regional Manager (West)
          └── ...
```

### Sales Roles

| Role | Reports To | Key Responsibilities |
|------|-----------|---------------------|
| **Counsellor** | Senior Counsellor / Branch Manager | Lead handling, counselling, follow-ups, demos |
| **Senior Counsellor** | Branch Manager | Team supervision, escalations, training |
| **Sales Manager** | Regional Manager | Team KPIs, pipeline management, coaching |
| **Branch Manager** | Regional Manager | Branch P&L, team hiring, local marketing |
| **Regional Manager** | Sales Director | Regional revenue, multiple branches |
| **Sales Director** | CEO | Company-wide sales strategy, targets |

### Counsellor KPIs (Existing)

The existing `salesPerformance.ts` already computes comprehensive counsellor metrics:

| KPI | Unit | Description |
|-----|------|-------------|
| **Assigned** | Count | Total leads assigned |
| **Calls** | Count | Total calls made |
| **Follow-ups** | Count | Follow-up tasks created |
| **Demo** | Count | Demos scheduled |
| **Admissions** | Count | Leads converted |
| **Revenue** | Amount | Revenue from converted leads |
| **Collection %** | Percentage | Revenue collected vs expected |
| **Conversion %** | Percentage | Admissions / Assigned |
| **Score** | Composite | Weighted performance score |

### Performance Score Formula (Existing)

```
Score = Conversion% × 0.30
      + Collection% × 0.20
      + min(Calls, 100) × 0.20
      + min(Followups, 50) × 0.15
      + min(Admissions, 20) × 0.15
```

### Counsellor Leaderboard (Existing)

The existing system renders a leaderboard with daily, weekly, and monthly views:

```
┌────────────────────────────────────────────────────────────┐
│  🏆 LEADERBOARD — Monthly (Revenue)                        │
├────────────────────────────────────────────────────────────┤
│  🥇 Ananya Sharma     │ ₹4,20,000 │ 12 admissions          │
│  🥈 Amit Mehta        │ ₹3,80,000 │ 10 admissions          │
│  🥉 Priya Verma       │ ₹2,90,000 │ 8 admissions           │
│  4.  Rajesh Kumar     │ ₹2,10,000 │ 6 admissions           │
│  5.  Sunita Patel     │ ₹1,80,000 │ 5 admissions           │
└────────────────────────────────────────────────────────────┘
```

### Target Assignment

| Role | Daily Target | Weekly Target | Monthly Target |
|------|-------------|---------------|----------------|
| **Counsellor** | 20 calls, 5 follow-ups | 2 admissions | 8 admissions, ₹5L revenue |
| **Senior Counsellor** | 10 calls, team oversight | 5 team admissions | 20 team admissions |
| **Branch Manager** | Pipeline review | 15 branch admissions | 60 admissions, ₹30L revenue |

---

## 10. Sales Targets

### Purpose

Sales Targets define **measurable goals** for counsellors, teams, and branches. They provide a clear benchmark for performance evaluation and incentive calculation.

### Target Types

| Type | Frequency | Example |
|------|-----------|---------|
| **Activity Targets** | Daily | 20 calls, 10 follow-ups |
| **Conversion Targets** | Weekly | 2 admissions per counsellor |
| **Revenue Targets** | Monthly | ₹5,00,000 per counsellor |
| **Pipeline Targets** | Ongoing | 50 active leads in pipeline |
| **Collection Targets** | Monthly | 80% recovery rate |

### Existing Implementation

The existing `SalesPerformanceDashboard.tsx` displays hardcoded daily targets:

```
┌───────────────────────────────────────────────────────────────┐
│  🎯 DAILY TARGETS                              [Configurable]  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Admissions                         Revenue                   │
│  ┌──────────────────────────┐      ┌──────────────────────┐  │
│  │ ████████████████████░░░░ │      │ ████████░░░░░░░░░░░░ │  │
│  │ 4 / 10  (40%)            │      │ ₹1.2L / ₹5L (24%)   │  │
│  │ 6 remaining today        │      │ ₹3.8L remaining      │  │
│  └──────────────────────────┘      └──────────────────────┘  │
│                                                               │
│  Calls                                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ ████████████████████████████████████████████████████  │    │
│  │ 45 / 120  (38%)                                       │    │
│  │ 75 remaining today                                    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### DOC-11 Target Configuration

```json
{
  "targetConfig": {
    "counsellor": {
      "daily": { "calls": 20, "followups": 10, "whatsapp": 15 },
      "weekly": { "admissions": 2, "demos": 5, "meetings": 3 },
      "monthly": { "admissions": 10, "revenue": 500000, "collectionPct": 80 }
    },
    "seniorCounsellor": {
      "daily": { "calls": 10, "teamReviews": 2 },
      "weekly": { "teamAdmissions": 8, "demoReviews": 10 },
      "monthly": { "teamAdmissions": 30, "teamRevenue": 1500000 }
    },
    "branchManager": {
      "monthly": { "branchAdmissions": 60, "branchRevenue": 3000000, "recoveryPct": 85 }
    }
  }
}
```

### Target Tracking Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  🎯 TARGET TRACKING — October 2026      Ananya Sharma         │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Activity Targets (Daily Average):                            │
│  ┌──────────┬────────┬────────┬────────┬──────────┐          │
│  │ Metric   │ Target │ Actual │ Ach %  │ Status   │          │
│  ├──────────┼────────┼────────┼────────┼──────────┤          │
│  │ Calls    │ 20     │ 24     │ 120%   │ 🟢       │          │
│  │ Followups│ 10     │ 8      │ 80%    │ 🟡       │          │
│  │ WhatsApp │ 15     │ 18     │ 120%   │ 🟢       │          │
│  └──────────┴────────┴────────┴────────┴──────────┘          │
│                                                               │
│  Monthly Targets:                                             │
│  ┌────────────┬──────────┬──────────┬────────┬──────────┐    │
│  │ Metric     │ Target   │ Actual   │ Ach %  │ Projected│    │
│  ├────────────┼──────────┼──────────┼────────┼──────────┤    │
│  │ Admissions │ 10       │ 7        │ 70%    │ 11 (on   │    │
│  │            │          │          │        │  track)  │    │
│  │ Revenue    │ ₹5L      │ ₹3.2L    │ 64%    │ ₹5.4L    │    │
│  │ Coll. %    │ 80%      │ 72%      │ 90%    │ 78%      │    │
│  └────────────┴──────────┴──────────┴────────┴──────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 11. Opportunity Management

### Purpose

An **Opportunity** represents a qualified deal with a specific probability of closing. It provides a more structured view than a simple lead stage, enabling better forecasting and management attention.

### Opportunity vs Lead

| Aspect | Lead | Opportunity |
|--------|------|-------------|
| **Stage** | Any pipeline stage | Qualified → Negotiation |
| **Probability** | Not assigned | Assigned (10-100%) |
| **Expected Revenue** | Optional | Required |
| **Expected Close Date** | Not required | Required |
| **Focus** | Qualification | Conversion |

### Opportunity Entity

| Field | Type | Purpose |
|-------|------|---------|
| `leadId` | `id(leadMaster)` | Source lead |
| `ownerId` | `id(users)` | Assigned counsellor |
| `programId` | `id(academicPrograms)` | Target program |
| `expectedRevenue` | `number` | Expected fee revenue |
| `probability` | `number` | Win probability (0-100) |
| `expectedCloseDate` | `number` | Expected admission date |
| `riskLevel` | `string` | Low / Medium / High / Critical |
| `competitor` | `optional(string)` | Competing institute (if known) |
| `reason` | `optional(string)` | Why the lead chose / may choose us |
| `notes` | `optional(string)` | Counsellor's notes |
| `status` | `string` | Open / Won / Lost / Stalled |
| `wonAt` | `optional(number)` | When converted |
| `lostAt` | `optional(number)` | When lost |
| `lostReasonId` | `optional(id(lostReasons))` | Why lost |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Opportunity Lifecycle

```
Lead Qualified
       │
       ▼
Opportunity Created
  ├── Probability: 50%
  ├── Expected Revenue: ₹50,000
  └── Expected Close: 15-Nov-2026
       │
       ▼ (Counselling, Demo, Follow-ups)
       │
  ├── Probability increases → 75%
  │     └── Expected Revenue: ₹50,000
  │
  ├── Probability decreases → 30%
  │     └── Risk Level: High (competitor engaged)
  │
       ▼
Decision:
  ├── Won → Convert to Admission
  └── Lost → Lost Lead Analysis
```

### Opportunity Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  💼 OPPORTUNITY PIPELINE                                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Opportunities: 28                Pipeline Value: ₹8.2L │
│  Weighted Pipeline: ₹5.1L              Avg Deal Size: ₹42K   │
│                                                               │
│  By Risk Level:                                                │
│  ┌──────────┬──────┬──────────┬────────────────────────┐     │
│  │ Risk     │ Count│ Pipeline │ Examples                │     │
│  ├──────────┼──────┼──────────┼────────────────────────┤     │
│  │ 🟢 Low   │ 12   │ ₹3.8L    │ Raj Patel (₹50K, 90%)  │     │
│  │ 🟡 Medium│ 10   │ ₹2.9L    │ Priya Sharma (₹35K,60%)│     │
│  │ 🔴 High  │ 4    │ ₹1.1L    │ Amit Singh (₹75K, 30%) │     │
│  │ ⚫ Crit. │ 2    │ ₹0.4L    │ Neha Verma (₹25K, 15%) │     │
│  └──────────┴──────┴──────────┴────────────────────────┘     │
│                                                               │
│  Closing this Week (4 opportunities):                         │
│  ┌────────────────────────┬────────┬────────┬──────────┐     │
│  │ Lead                   │ Amount │ Prob   │ Expected │     │
│  ├────────────────────────┼────────┼────────┼──────────┤     │
│  │ Raj Patel — JEE        │ ₹50K   │ 90%    │ 15-Oct   │     │
│  │ Priya Sharma — NEET    │ ₹35K   │ 80%    │ 17-Oct   │     │
│  │ Amit Verma — Commerce  │ ₹25K   │ 70%    │ 18-Oct   │     │
│  │ Sunita Rao — Foundation│ ₹40K   │ 60%    │ 19-Oct   │     │
│  └────────────────────────┴────────┴────────┴──────────┘     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 12. Objection Management

### Purpose

Objection Management provides counsellors with **structured responses** to common objections, ensuring consistent and effective handling across the sales team.

### Common Objections & Recommended Responses

#### 1. Fee / Budget

| Objection | Recommended Response |
|-----------|---------------------|
| "The fees are too high" | Break down the cost-per-class vs value. Compare with competitors. Highlight ROI (placement, results). Offer installment plan. |
| "We need to think about it" | Offer a limited-time early bird discount. Set a clear deadline. Offer a free trial class. |
| "Can you give a discount?" | Offer value-add services instead of discount. If discount needed, follow approval process. |
| "Other institute is cheaper" | Explain quality difference — faculty, curriculum, results, infrastructure, batch size. |

#### 2. Distance / Location

| Objection | Recommended Response |
|-----------|---------------------|
| "It's too far from home" | Highlight transport facility. Share nearby branch option. Offer online/hybrid option. |
| "No bus facility" | Share route map. Connect with other parents from same area. Offer carpool coordination. |

#### 3. Parents

| Objection | Recommended Response |
|-----------|---------------------|
| "Parents need to discuss" | Schedule a parent meeting. Provide a parent info kit. Share parent testimonials. |
| "Father is not convinced" | Invite father for a campus visit. Share success stories of similar profiles. Offer a direct call with faculty/management. |

#### 4. Timing

| Objection | Recommended Response |
|-----------|---------------------|
| "Timing clashes with school" | Offer alternative batch (morning/evening/weekend). Share recorded class access option. |
| "Too early / too late" | Show batch flexibility. Offer trial period. |

#### 5. Competition

| Objection | Recommended Response |
|-----------|---------------------|
| "Already enrolled elsewhere" | Wait for trial period to end. Stay in touch (nurture sequence). Offer transfer option. |
| "Comparing with [competitor]" | Share factual comparisons — results, faculty, infrastructure, batch size, placement records. |

#### 6. Online Preference

| Objection | Recommended Response |
|-----------|---------------------|
| "Prefer online learning" | Offer hybrid model. Highlight offline benefits (peer learning, faculty access, discipline). Share online class quality demo. |

#### 7. Decision Delay

| Objection | Recommended Response |
|-----------|---------------------|
| "Will decide next month" | Explain batch filling up. Offer limited-time discount. Offer seat reservation (refundable). |
| "Child is not interested" | Offer career counselling session. Share inspirational stories. Arrange chat with current students. |

#### 8. Financial

| Objection | Recommended Response |
|-----------|---------------------|
| "Financial constraints" | Offer installment plan. Check scholarship eligibility. Offer need-based waiver (with approval). |
| "Waiting for exam results" | Start with foundation program. Offer provisional admission. |

### Objection Tracking

```json
{
  "objectionTracking": {
    "leadId": "lead_123",
    "objectionType": "fee",
    "specificConcern": "Fees are too high compared to local coaching centre",
    "counsellorResponse": "Explained that our fee includes comprehensive study material, mock tests, faculty from IITs, and 24/7 doubt clearing. Also offered 3-month installment plan.",
    "leadReaction": "Positive — willing to proceed with installment plan",
    "whetherResolved": true,
    "followUpNeeded": false
  }
}
```

### Objection Analytics

```
┌───────────────────────────────────────────────────────────────┐
│  📊 OBJECTION ANALYSIS — Last 30 Days                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Top Objections:                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🥇 Fee / Budget                    ████████████  35%  │    │
│  │ 🥈 Decision Delay                  ████████     23%  │    │
│  │ 🥉 Comparing Competitors           ██████       18%  │    │
│  │ 4.  Parents Not Convinced          ████         12%  │    │
│  │ 5.  Distance / Location            ███           8%  │    │
│  │ 6.  Timing Conflict                ██            4%  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Resolution Rate by Type:                                     │
│  ┌──────────────────────────┬──────────┬──────────┐          │
│  │ Objection                │ Raised   │ Resolved │          │
│  ├──────────────────────────┼──────────┼──────────┤          │
│  │ Fee / Budget             │ 42       │ 28 (67%) │          │
│  │ Decision Delay           │ 28       │ 18 (64%) │          │
│  │ Comparing Competitors    │ 22       │ 15 (68%) │          │
│  │ Parents Not Convinced    │ 14       │ 10 (71%) │          │
│  │ Distance / Location      │ 10       │ 8 (80%)  │          │
│  │ Timing Conflict          │ 5        │ 4 (80%)  │          │
│  └──────────────────────────┴──────────┴──────────┘          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### AI-Powered Objection Handling (DOC-11)

```
Counsellor: Lead says "fees are too high"

AI Suggestion:
  ┌──────────────────────────────────────────────────────────┐
  │ 💡 Try this response:                                     │
  │                                                          │
  │ "I understand your concern. Let me break down what's      │
  │ included: 200 hours of expert faculty time, 50 mock       │
  │ tests, personalized doubt sessions, and study material.   │
  │ That's under ₹250 per session. Also, we offer interest-   │
  │ free installment plans. Would you like me to share the    │
  │ EMI options?"                                             │
  │                                                          │
  │ Success Rate: 72% on similar objections                   │
  │ Similar lead: Amit Singh (also had fee objection,         │
  │              resolved with installment plan → converted)  │
  └──────────────────────────────────────────────────────────┘
```

---

## 13. Lost Lead Analysis

### Purpose

Lost Lead Analysis is a structured process for understanding **why leads don't convert**. This data drives continuous improvement in sales processes, pricing, programs, and marketing.

### Lost Reason Categories

| Category | Specific Reasons |
|----------|-----------------|
| **Competitor** | Enrolled with competitor, Chose different institute, Got better offer elsewhere |
| **Fees** | Too expensive, Budget constraint, No discount offered, Payment plan not suitable |
| **No Response** | Phone switched off, Not answering, Wrong number, Changed number |
| **Not Interested** | Not interested in any program, Changed career path, Decided to self-study |
| **Timing** | Batch timing not suitable, Cannot commit to schedule, Distance too far |
| **Location** | Too far from home, No transport facility, Moving to another city |
| **Decision Delay** | Delaying decision beyond pipeline, Will decide next year, Taking a break |
| **Parents** | Parents not convinced, Family decision against, Financial dependent on others |
| **Other** | Medical reasons, Personal issues, Moved abroad, Unknown |

### Existing Implementation

The existing system (`crmLostReasons.ts`) already implements lost reason management with configurable reasons.

### Lost Lead Flow

```
Lead moves to "lost" stage
       │
       ▼
Counsellor selects lost reason
       │
       ├── From predefined list
       │     └── (optional) Add specific notes
       │
       ▼
System logs the lost event
       │
       ├── Update leadActivity: "lost"
       ├── Update leadStageHistory: from → "lost"
       └── Update leadMaster: status = "lost"
       │
       ▼
Win-back task created (optional)
       │
       ├── If reason = "No Response" → Win-back in 30 days
       ├── If reason = "Competitor" → Win-back in 90 days
       ├── If reason = "Fees" → Win-back when new offer available
       └── If reason = "Decision Delay" → Win-back in 60 days
```

### Lost Lead Analytics (Existing)

The existing system does NOT yet have a dedicated lost lead analytics dashboard. DOC-11 would add:

```
┌───────────────────────────────────────────────────────────────┐
│  📉 LOST LEAD ANALYSIS — Q4 2026                             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Lost: 128 leads                          Loss Rate: 28%│
│                                                               │
│  By Reason:                                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Competitor              ████████████████       42     │    │
│  │ No Response             ██████████████        38     │    │
│  │ Fees / Budget           ██████████             25     │    │
│  │ Decision Delay          ███████                18     │    │
│  │ Not Interested          ████                   10     │    │
│  │ Location / Distance     ███                     8     │    │
│  │ Parents                 ██                      5     │    │
│  │ Other                   █                       3     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  By Stage at Loss:                                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Connected       ████████████████████████     38     │    │
│  │ Follow Up       ████████████████             28     │    │
│  │ Counselling     ████████████                 20     │    │
│  │ Negotiation     ██████████                   18     │    │
│  │ New             █████████                    16     │    │
│  │ Interested      ██████                       12     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Win-back Recovery:                                           │
│  ┌──────────────────────────┬──────────┬─────────┐           │
│  │ Win-back Attempted       │ Recovered│ Rate    │           │
│  ├──────────────────────────┼──────────┼─────────┤           │
│  │ 72                       │ 12       │ 16.7%   │           │
│  └──────────────────────────┴──────────┴─────────┘           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Recovery Opportunities

| Lost Reason | Recovery Strategy | Timeline | Success Rate |
|-------------|------------------|----------|-------------|
| **No Response** | Change contact method, try WhatsApp/Email | 30 days | 25% |
| **Competitor** | Stay connected, share success stories | 90 days | 15% |
| **Fees** | Notify when new offers/discounts available | 60 days | 20% |
| **Decision Delay** | Regular check-ins, share limited-seat alerts | 60 days | 30% |
| **Parents** | Schedule parent-only counselling session | 30 days | 40% |

---

## 14. Sales Dashboard

### Existing Implementation

The existing system (`SalesPerformanceDashboard.tsx`) implements a comprehensive sales performance dashboard with:

| Section | Content |
|---------|---------|
| **Executive KPI Cards** | 8 KPI cards (Leads Assigned, Contacted, Admissions, Revenue, Collections, Calls, Follow-ups, Demo Pipeline) |
| **Sales Funnel** | 10-stage funnel with count, percentage, and drop-off |
| **Daily Activity Timeline** | Recent actions (48h) with type indicators |
| **Counselor Performance Table** | Ranked with all KPIs and performance score |
| **Leaderboard** | Daily/Weekly/Monthly views |
| **Collection Snapshot** | Recovery rate, outstanding, top defaulters |
| **Follow-up Health** | Due today/tomorrow/overdue/completed |
| **Daily Targets** | Admissions, Revenue, Calls with progress bars |
| **Needs Attention Panel** | Priority leads requiring action |
| **Branch Performance** | Per-branch comparison (multi-branch) |
| **Management Alerts** | Overdue follow-ups, pending payments, missed demos |

### DOC-11 Dashboard Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Revenue Forecast** | Pipeline value, weighted pipeline, expected revenue |
| **Opportunity Pipeline** | Deals with probability, expected close date, risk level |
| **Lost Lead Analysis** | Lost reasons, stage-at-loss, recovery tracking |
| **Objection Analytics** | Top objections, resolution rates |
| **Campaign ROI** | Revenue per marketing source/campaign |
| **Lead Aging** | Time-in-stage distribution |
| **Sales Velocity** | Speed from lead creation to conversion |
| **Conversion Funnel by Source** | Source-specific conversion rates |

### Sales Velocity Calculation

```
Sales Velocity = (Number of Opportunities × Average Deal Value × Win Rate) / Sales Cycle Length

Example:
  Opportunities: 28
  Avg Deal Value: ₹42,000
  Win Rate: 32%
  Avg Sales Cycle: 45 days

  Sales Velocity = (28 × ₹42,000 × 0.32) / 45
                 = ₹375,200 / 45
                 = ₹8,338 per day
```

### Lead Aging (Time in Stage)

```
┌───────────────────────────────────────────────────────────────┐
│  ⏳ LEAD AGING — Time in Current Stage                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Br 0-3 Days │ 3-7 Days │ 7-14 Days │ 14-30 Days │ 30+ Days  │
│  ───────────────────────────────────────────────────────────  │
│  New     ████████████████   12   4    2     1      0          │
│  Att.    ████████████████   8    6    3     2      1          │
│  Conn.   █████████████████  10   5    4     1      0          │
│  Qual.   ████████████████   8    7    5     3      2          │
│  Couns.  ████████████████   6    5    4     3      2          │
│  Int.    ████████████████   5    4    2     2      2          │
│  FolUp   ████████████████   4    3    3     5      5          │
│  Neg.    ████████████████   3    2    2     2      1          │
│  ───────────────────────────────────────────────────────────  │
│  ⚠️ Leads Stalled (>7 days): 42 leads                       │
│  ⚠️ Leads Stalled (>14 days): 22 leads                      │
│  ⚠️ Leads Stalled (>30 days): 13 leads — needs review       │
└───────────────────────────────────────────────────────────────┘
```

### Conversion Funnel by Source

```
┌───────────────────────────────────────────────────────────────┐
│  📊 CONVERSION FUNNEL BY SOURCE — Last 30 Days               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┬────────┬──────────┬─────────┬──────────┐ │
│  │ Source         │ Leads  │Admissions│ Conv.%  │ Revenue  │ │
│  ├────────────────┼────────┼──────────┼─────────┼──────────┤ │
│  │ Website Form   │ 85     │ 22       │ 25.9%   │ ₹8.5L    │ │
│  │ Facebook Ads   │ 120    │ 28       │ 23.3%   │ ₹10.2L   │ │
│  │ Google Ads     │ 95     │ 20       │ 21.1%   │ ₹7.8L    │ │
│  │ Referral       │ 35     │ 14       │ 40.0%   │ ₹5.2L    │ │
│  │ Walk-in        │ 25     │ 12       │ 48.0%   │ ₹4.8L    │ │
│  │ WhatsApp       │ 45     │ 8        │ 17.8%   │ ₹3.1L    │ │
│  │ Phone Call     │ 30     │ 6        │ 20.0%   │ ₹2.2L    │ │
│  │ Import/Manual  │ 20     │ 4        │ 20.0%   │ ₹1.5L    │ │
│  └────────────────┴────────┴──────────┴─────────┴──────────┘ │
│                                                               │
│  Best Converting: Walk-in (48%) | Referral (40%)              │
│  Best Revenue: Facebook Ads (₹10.2L) | Website (₹8.5L)       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 15. Cross-Module Integration

### Purpose

The Sales Engine does not operate in isolation. It integrates with every other module in EEOS to provide a seamless lead-to-student journey.

### Integration Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SALES ENGINE INTEGRATIONS                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CRM (DOC-05)                Admission (DOC-06)                     │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │  leadMaster        │      │  admissions        │                 │
│  │  leadStageHistory  │◄─────│  Handoff:          │                 │
│  │  leadActivity      │─────►│  sales.ready →     │                 │
│  │  leadDiscounts     │      │  admission.start   │                 │
│  │  leadApprovals     │      └────────────────────┘                 │
│  └────────┬───────────┘                                             │
│           │                                                         │
│           │                                                         │
│  ┌────────▼───────────┐      ┌────────────────────┐                 │
│  │  Finance (DOC-08)  │      │  Communication     │                 │
│  │                    │      │  (DOC-09)          │                 │
│  │  leadPayments ─────┤─────►│                    │                 │
│  │  leadDiscounts     │      │  WhatsApp templates │                 │
│  │  paymentVerification│     │  SMS templates     │                 │
│  │  invoiceGeneration │      │  Email templates   │                 │
│  └────────────────────┘      └────────────────────┘                 │
│                                                                      │
│  Workflow (DOC-10)              Analytics (Existing)                │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │  Triggers:         │      │  CRM Dashboard     │                 │
│  │  lead.created ─────┤─────►│  Sales Performance │                 │
│  │  lead.assigned     │      │  Funnel Analysis   │                 │
│  │  stage.changed     │      │  Counselor Scores  │                 │
│  │  discount.request  │      │  Revenue Tracking  │                 │
│  └────────────────────┘      └────────────────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Ownership Transfer Chain

```
Lead Ownership → Sales Ownership → Admission Ownership → Student Ownership

    CRM               Sales              Admission            Student
    owns:            owns:               owns:                owns:
  • Lead data      • Pipeline          • Documents          • Academics
  • Stage hist.    • Counselling       • Verification       • Attendance
  • Activity       • Demos             • Seat               • Exams
  • Documents      • Follow-ups        • Check status       • Results
  • Family         • Discounts         • Student creation   • Certificates
  
  Financial Ownership:
    Finance owns: Money (invoices, payments, receipts, refunds)
    Sales reads: Expected revenue, payment status, discounts
```

### Lead → Sales → Admission Handoff Protocol

```
Step 1: Counsellor moves lead to "converted" stage
Step 2: leadMaster.status = "converted"
Step 3: System checks eligibility:
        ├── Lead profile complete?
        ├── Documents uploaded?
        ├── Discounts approved (if applicable)?
        └── Payment received / expected?
Step 4: If eligible → Enable "Start Admission" button in Lead Workspace
Step 5: Counsellor (or Admin) clicks "Start Admission"
Step 6: Admission Engine takes over:
        ├── Creates admission record
        ├── Generates admission number
        ├── Links to lead, family, contacts
        └── Begins admission checklist flow
Step 7: Sales counsellor is notified of admission progress
Step 8: Counsellor can view admission status (read-only) from Sales Workspace
```

---

## 16. AI Opportunities

### 1. Lead Scoring

```
AI analyzes lead attributes and behaviour to predict conversion probability.

Input:
  - Demographics (age, location, board, class)
  - Behaviour (response time, WhatsApp opens, call pick-up rate)
  - Engagement (demo attendance, document uploads, parent involvement)
  - Historical data (similar profiles' conversion rate)

Output:
  Lead Score: 82/100 (High Probability)
  
  Top Factors:
    ✅ Lead from referral source (+15 points)
    ✅ Both parents engaged (+20 points)
    ✅ Demo attended (+25 points)
    ✅ Budget discussed and agreed (+20 points)
    ⚠️ No competitor comparison yet (+2 points)
    
  Recommendation: Prioritize — high conversion probability
```

### 2. Conversion Prediction

```
AI predicts when a lead will convert and the probability.

Input:
  - Current stage and time in stage
  - Counsellor activity level (calls, follow-ups, WhatsApp)
  - Lead engagement (response rate, content views)
  - Historical conversion patterns

Output:
  Raj Patel — JEE Foundation
  Current Stage: Negotiation (Day 5 of 7 SLA)
  
  Prediction:
    Will Convert: 78% probability
    Expected by: 18-Oct-2026 (±3 days)
    
  If no action taken in 3 days:
    Probability drops to: 45%
    
  Recommended Next Action:
    → Offer limited-time discount (increases prob. by 15%)
    → Schedule parent meeting (increases prob. by 10%)
```

### 3. Next Best Action

```
AI suggests the single highest-impact action for each lead.

Input:
  - Lead's current state (stage, time in stage, activities)
  - Counsellor's available actions (call, WhatsApp, schedule demo, etc.)
  - Historical success rates of each action for similar leads

Output:
  Lead: Priya Sharma (Stage: Counselling, Day 3)
  
  🤖 Next Best Action: Schedule Demo Class
    Confidence: 87%
    Expected Impact: +22% conversion probability
    
  Alternative Actions:
    🥈 Send Success Story Video (+15%)
    🥉 Offer Parent Meeting (+12%)
    
  Recommended Message:
    "Hi Priya! We have a Physics demo this Saturday at 10 AM.
    Would you like to attend? It's a great way to experience
    our teaching style firsthand."
```

### 4. Objection Suggestion

```
AI suggests optimal responses to common objections.

Input:
  - Objection raised by lead (e.g., "fees too high")
  - Lead profile and history
  - Successful resolution strategies for similar profiles

Output:
  Objection: "The fees are too high"
  
  🤖 Suggested Response:
  
  "I completely understand. Let me show you the value:
  • 250+ hours of expert faculty teaching
  • 50+ mock tests with detailed analysis
  • Personal doubt sessions (unlimited)
  • Study material worth ₹5,000 included
  • ₹250 per session — less than a movie ticket!
  
  Also, we offer:
  • 3-month interest-free installment plan
  • Early bird discount (10% if you enroll this week)
  
  Would you like me to share the installment options?"
  
  Success Rate on Similar Leads: 72%
  Counsellor Priya closed 5 leads last month using this approach.
```

### 5. Program Recommendation

```
AI recommends the best program/course for a lead.

Input:
  - Academic profile (board, class, scores, subjects)
  - Career goals (stated aspiration)
  - Behavioural data (demo attendance, program pages viewed)
  - Historical matching data

Output:
  Lead: Raj Patel (Class 12, CBSE, PCM 85%)
    Goal: IIT-JEE
    
  🤖 Recommended Program:
    🥇 JEE Advanced Foundation + Target (2-year)
      Match: 94%
      Why: Strong PCM scores, 2 years until exam
      
    🥈 JEE Main Crash Course
      Match: 62%
      Why: If budget constrained
      
    🥉 Class 12 Board + JEE Combo
      Match: 78%
      Why: If school-coaching balance is concern
```

### 6. Counsellor Recommendation

```
AI assigns leads to the best-suited counsellor.

Input:
  - Lead profile (program interest, language, location)
  - Counsellor profiles (skills, workload, strengths, language)
  - Historical performance (conversion rate per counsellor per program)

Output:
  Lead: NEET aspirant, Hindi-speaking, from Bihar
  
  🤖 Best Counsellor: Ananya Sharma
    Match: 92/100
    
    Why Ananya?
    ✅ NEET domain specialist (converts @ 38%)
    ✅ Fluent in Hindi
    ✅ Currently has 15 active leads (under capacity)
    ✅ Has converted 3 similar profiles this quarter
    
  Alternative:
    🥈 Amit Mehta (Match: 74%, JEE specialist)
    ❌ Priya Verma (Match: 45%, heavy workload)
```

### 7. Revenue Forecast

```
AI predicts future revenue with confidence intervals.

Input:
  - Current pipeline (weighted by stage probability)
  - Historical conversion rates per counsellor/branch/program
  - Seasonal patterns (admission cycles)
  - External factors (exams, holidays)

Output:
  🤖 Revenue Forecast: Q4 2026
  
  Best Case: ₹12.5L (85% confidence)
    → All high-probability deals close on time
    
  Expected: ₹8.2L (75% confidence)
    → Normal conversion rate across pipeline
    
  Worst Case: ₹5.8L (60% confidence)
    → 20% pipeline loss, delayed decisions
    
  Key Drivers:
    📈 NEET program conversions (up 15% vs last year)
    📉 JEE program conversions (down 8% due to competition)
    ⚠️ 3 high-value deals at risk (competitor engaged)
```

### 8. Lost Lead Recovery

```
AI identifies lost leads with highest recovery potential.

Input:
  - Lost reason, stage at loss, time since lost
  - Lead profile value (expected revenue)
  - Current market conditions (new offers, batch availability)
  - Historical win-back success patterns

Output:
  🤖 Recovery Candidates — This Week
  
  ┌──────────────────────┬─────────┬────────┬──────────┬──────┐
  │ Lead                 │ Value   │ Lost   │ Reason   │Recov │
  ├──────────────────────┼─────────┼────────┼──────────┼──────┤
  │ 🥇 Amit Singh        │ ₹75K    │ 45d ago│ Compet.  │ 68%  │
  │ 🥈 Priya Verma       │ ₹50K    │ 30d ago│ Fees     │ 72%  │
  │ 🥉 Rajesh Kumar      │ ₹35K    │ 60d ago│ Decision │ 55%  │
  └──────────────────────┴─────────┴────────┴──────────┴──────┘
  
  Recommended Actions:
  Amit Singh → New batch starting next month — great re-engagement opportunity
  Priya Verma → New early bird discount launched — budget concern may be addressed
  Rajesh Kumar → 60 days is ideal win-back window — share new success stories
```

---

## 17. Reports

### Report Catalog

| Report | Frequency | Owner | Purpose |
|--------|-----------|-------|---------|
| **Pipeline Report** | Daily | Sales Manager | Current pipeline health |
| **Revenue Forecast** | Weekly | Sales Director | Revenue projections |
| **Counsellor Performance** | Weekly | Branch Manager | Individual performance |
| **Campaign ROI** | Monthly | Marketing | Marketing effectiveness |
| **Lead Aging** | Weekly | Sales Manager | Stalled leads identification |
| **Conversion Funnel** | Weekly | Sales Director | Bottleneck analysis |
| **Lost Lead Analysis** | Weekly | Sales Manager | Lost reasons, recovery |
| **Sales Velocity** | Monthly | Sales Director | Speed to conversion |
| **Branch Comparison** | Monthly | Regional Manager | Branch-wise performance |
| **Source Performance** | Monthly | Marketing | Source-wise conversion |
| **Discount Impact** | Monthly | Finance | Revenue impact of discounts |
| **Collection Forecast** | Monthly | Collections | Expected collections |

### Pipeline Report

```
┌───────────────────────────────────────────────────────────────┐
│  📋 PIPELINE REPORT — 15-Oct-2026                             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Active Leads: 128                    Pipeline: ₹8.2L   │
│  New Leads (24h): 12                        Weighted: ₹5.1L   │
│                                                               │
│  Stage Distribution:                                          │
│  ┌────────────┬───────┬──────────┬────────┬──────────────┐   │
│  │ Stage      │ Count │ % of Pipe│ Value  │ SLA Health   │   │
│  ├────────────┼───────┼──────────┼────────┼──────────────┤   │
│  │ New        │ 18    │ 14%      │ ₹0     │ 🟢 <24h      │   │
│  │ Attempted  │ 15    │ 12%      │ ₹0     │ 🟡 35% > SLA │   │
│  │ Connected  │ 22    │ 17%      │ ₹0     │ 🟢 90% in SLA│   │
│  │ Qualified  │ 20    │ 16%      │ ₹2.1L  │ 🟡 25% > SLA │   │
│  │ Couns.     │ 18    │ 14%      │ ₹1.8L  │ 🟢 OK         │   │
│  │ Interested │ 12    │ 9%       │ ₹1.5L  │ 🟢 OK         │   │
│  │ Follow Up  │ 10    │ 8%       │ ₹1.0L  │ 🔴 50% > SLA │   │
│  │ Negotiation│ 8     │ 6%       │ ₹1.2L  │ 🟡 30% > SLA │   │
│  │ Converted  │ 5     │ 4%       │ ₹0.6L  │ 🟢 Handoff    │   │
│  └────────────┴───────┴──────────┴────────┴──────────────┘   │
│                                                               │
│  SLA Health: 🟢 68% in SLA · 🟡 22% near breach · 🔴 10% breached │
│  Stalled Leads (>7 days in stage): 42                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Counsellor Performance Report

```
┌───────────────────────────────────────────────────────────────┐
│  👤 COUNSELLOR PERFORMANCE — October 2026 (Week 2)           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Branch: Andheri                           Report Date: 15-Oct│
│                                                               │
│  ┌────────────┬──────┬──────┬──────┬──────┬──────┬──────┐    │
│  │ Counsellor │Leads │Calls │Demo  │Adm.  │Revenue│Score │    │
│  ├────────────┼──────┼──────┼──────┼──────┼──────┼──────┤    │
│  │ Ananya     │ 25   │ 85   │ 12   │ 7    │ ₹3.2L │ 92   │    │
│  │ Amit       │ 22   │ 78   │ 10   │ 5    │ ₹2.5L │ 84   │    │
│  │ Priya      │ 20   │ 92   │ 8    │ 4    │ ₹1.8L │ 78   │    │
│  │ Rajesh     │ 18   │ 65   │ 5    │ 2    │ ₹1.0L │ 58   │    │
│  │ Sunita     │ 15   │ 45   │ 3    │ 1    │ ₹0.5L │ 42   │    │
│  └────────────┴──────┴──────┴──────┴──────┴──────┴──────┘    │
│                                                               │
│  Top Performer: Ananya (92) — Strong across all metrics       │
│  Needs Improvement: Sunita (42) — Low calls, low conversion   │
│  Branch Target: 30 admissions / ₹15L — At 63% / 60%          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Campaign ROI Report

```
┌───────────────────────────────────────────────────────────────┐
│  📊 CAMPAIGN ROI — Q4 2026                                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┬────────┬─────────┬────────┬────────┬──────┐ │
│  │ Campaign     │ Spend  │ Leads   │ Adm.   │ Rev.   │ROI   │ │
│  ├──────────────┼────────┼─────────┼────────┼────────┼──────┤ │
│  │ Facebook Q4  │ ₹2.5L  │ 350     │ 45     │ ₹18L   │ 7.2x │ │
│  │ Google Q4    │ ₹1.8L  │ 280     │ 32     │ ₹12.8L │ 7.1x │ │
│  │ Referral     │ ₹0.3L  │ 85      │ 22     │ ₹8.8L  │ 29.3x│ │
│  │ WhatsApp     │ ₹0.5L  │ 120     │ 15     │ ₹6L    │ 12.0x│ │
│  │ Open House   │ ₹0.8L  │ 65      │ 18     │ ₹7.2L  │ 9.0x │ │
│  └──────────────┴────────┴─────────┴────────┴────────┴──────┘ │
│                                                               │
│  Total Spend: ₹5.9L      Total Revenue: ₹52.8L               │
│  Overall ROI: 8.95x      Avg CPA: ₹1,311/admission            │
│                                                               │
│  Best ROI: Referral (29.3x) — invest more in referral program │
│  Best Volume: Facebook (45 admissions) — maintain spend       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 18. Implementation Roadmap

### Phase 1 — Pipeline Enhancement (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Existing `leadMaster` stages, `SalesWorkspace.tsx`

**Tasks:**
- [ ] Configurable pipeline stages (add/rename/reorder stages)
- [ ] Stage probability configuration
- [ ] Stage SLA tracking
- [ ] Pipeline health view (time-in-stage, SLA breach)
- [ ] Stage automation triggers (via DOC-10)

### Phase 2 — Sales Activities Enhancement (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Existing `callLogs`, `leadActivity`, `leadWhatsAppMessages`

**Tasks:**
- [ ] Unified activity type registry
- [ ] Meeting scheduler with calendar view
- [ ] Visit logging (institute/home visit)
- [ ] Bulk activity logging (calls, WhatsApp)
- [ ] Activity metrics dashboard

### Phase 3 — Opportunity Management (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, Existing lead data

**Tasks:**
- [ ] Create `opportunities` table in schema
- [ ] Opportunity CRUD (create from qualified leads)
- [ ] Probability tracking and updates
- [ ] Risk level assignment
- [ ] Competitor tracking
- [ ] Opportunity dashboard

### Phase 4 — Revenue Forecasting (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 3, Existing `crmDashboard.ts`

**Tasks:**
- [ ] Pipeline value calculation (weighted and unweighted)
- [ ] Revenue forecast engine
- [ ] Forecast accuracy tracking
- [ ] Branch/counsellor-level forecasting
- [ ] Monthly/quarterly forecast reports

### Phase 5 — Sales Targets (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Target configuration per role/individual
- [ ] Target assignment UI
- [ ] Target vs actual tracking
- [ ] Target achievement reports
- [ ] Target progress widgets in dashboard

### Phase 6 — Lost Lead Analysis (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Existing `crmLostReasons.ts`

**Tasks:**
- [ ] Lost reason tracking enhancement
- [ ] Lost lead analytics dashboard
- [ ] Win-back task auto-creation
- [ ] Recovery tracking
- [ ] Lost lead reporting

### Phase 7 — Objection Management (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 2

**Tasks:**
- [ ] Objection tracking in activity timeline
- [ ] Objection catalog with recommended responses
- [ ] Objection analytics dashboard
- [ ] AI-powered objection suggestion (Phase 9)

### Phase 8 — Demo Management (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 2

**Tasks:**
- [ ] Create `demos` table in schema
- [ ] Demo scheduling UI
- [ ] Demo reminder automation (via DOC-09)
- [ ] Demo feedback recording
- [ ] Demo conversion tracking

### Phase 9 — AI Sales Features (P3)

**Estimated effort:** 10-15 days  
**Dependencies:** All phases, AI Infrastructure

**Tasks:**
- [ ] Lead scoring model
- [ ] Conversion prediction
- [ ] Next best action engine
- [ ] Objection suggestion
- [ ] Program recommendation
- [ ] Counsellor recommendation
- [ ] Revenue forecasting model
- [ ] Lost lead recovery

### Phase 10 — Advanced Reports (P3)

**Estimated effort:** 5-7 days  
**Dependencies:** All phases

**Tasks:**
- [ ] Pipeline report (PDF/Excel export)
- [ ] Counsellor performance report
- [ ] Campaign ROI report
- [ ] Lead aging report
- [ ] Conversion funnel by source
- [ ] Sales velocity report
- [ ] Report scheduling

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Pipeline Enhancement | P1 | 5d | Low | High |
| 2. Sales Activities Enhancement | P1 | 4d | Low | High |
| 3. Opportunity Management | P1 | 5d | Medium | High |
| 4. Revenue Forecasting | P2 | 5d | Medium | High |
| 5. Sales Targets | P2 | 4d | Low | Medium |
| 6. Lost Lead Analysis | P2 | 4d | Low | Medium |
| 7. Objection Management | P2 | 4d | Low | Medium |
| 8. Demo Management | P2 | 4d | Low | Medium |
| 9. AI Sales Features | P3 | 15d | High | High |
| 10. Advanced Reports | P3 | 7d | Medium | Medium |

---

## 19. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║              SALES ENGINE GOLDEN RULES                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  CRM owns Leads.                                         ║
║      └── leadMaster is the single source of truth.           ║
║                                                              ║
║  2.  Sales owns Conversion.                                  ║
║      └── Sales is responsible for lead-to-admission pipe.    ║
║                                                              ║
║  3.  Admission owns Enrollment.                              ║
║      └── Once "admission ready," handoff is clean.           ║
║                                                              ║
║  4.  Finance owns Money.                                     ║
║      └── Sales discusses fees but never processes payments.  ║
║                                                              ║
║  5.  Collections owns Recovery.                              ║
║      └── Sales focuses on conversion, not recovery.          ║
║                                                              ║
║  6.  One Pipeline. Unlimited Stages.                         ║
║      └── Pipeline is configurable per institution/branch.    ║
║                                                              ║
║  7.  Everything measurable.                                  ║
║      └── Every activity, call, follow-up is tracked.         ║
║                                                              ║
║  8.  Everything auditable.                                   ║
║      └── Full activity timeline for every lead.              ║
║                                                              ║
║  9.  Everything automated (when possible).                   ║
║      └── Routine tasks handled by DOC-10 workflows.          ║
║                                                              ║
║ 10.  AI is additive, not required.                           ║
║      └── All sales flows work without AI.                    ║
║                                                              ║
║ 11.  Stage transitions are logged.                           ║
║      └── Every stage change is recorded in leadStageHistory. ║
║                                                              ║
║ 12.  Lost leads get a reason.                                ║
║      └── Every lost lead is analyzed and categorized.        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Belongs To |
|--------|-----------|--------|-------|-----------|
| Lead | `leadMaster` | ✅ Existing | N/A | CRM |
| Lead Stage History | `leadStageHistory` | ✅ Existing | N/A | CRM |
| Lead Assignment | `leadAssignments` | ✅ Existing | N/A | CRM |
| Lead Activity | `leadActivity` | ✅ Existing | N/A | CRM |
| Lead Task | `leadTasks` | ✅ Existing | N/A | CRM |
| Lead Note | `leadNotes` | ✅ Existing | N/A | CRM |
| Lead Document | `leadDocuments` | ✅ Existing | N/A | CRM |
| Lead WhatsApp | `leadWhatsAppMessages` | ✅ Existing | N/A | CRM |
| Lead Payment | `leadPayments` | ✅ Existing | N/A | Finance |
| Lead Discount | `leadDiscounts` | ✅ Existing | N/A | CRM |
| Lead Approval | `leadApprovals` | ✅ Existing | N/A | CRM |
| Lead Course | `leadCourses` | ✅ Existing | N/A | CRM |
| Call Log | `callLogs` | ✅ Existing | N/A | CRM |
| Lost Reason | `crmLostReasons` | ✅ Existing | N/A | CRM |
| Pipeline Config | `pipelineConfigs` | 🔶 New | Phase 1 | Sales |
| Opportunity | `opportunities` | 🔶 New | Phase 3 | Sales |
| Demo | `demos` | 🔶 New | Phase 8 | Sales |
| Sales Target | `salesTargets` | 🔶 New | Phase 5 | Sales |
| Objection Log | `objectionLogs` | 🔶 New | Phase 7 | Sales |
| Prospect | `prospects` (= converted leads) | 🔶 New | Future | Sales |

## Appendix B: Existing Code Integration Points

| Existing File | What It Does | DOC-11 Integration |
|---------------|-------------|-------------------|
| `crmSales.ts` | Sales performance dashboard query | Phase 1 — Enhance with pipeline config |
| `salesPerformance.ts` | All helper functions (KPI, funnel, counselor perf) | Phase 1-4 — Base foundation, extend |
| `crmLeads.ts` | Lead CRUD, stage management, follow-ups | Phase 1 — Stage transitions hook into pipeline |
| `crmDashboard.ts` | CRM dashboard data | Phase 4 — Revenue forecast widgets |
| `crmTasks.ts` | Lead tasks | Phase 2 — Activity metrics |
| `crmCalls.ts` | Call logging | Phase 2 — Call analytics |
| `crmWhatsApp.ts` | WhatsApp sending | Phase 2 — WhatsApp metrics |
| `crmLostReasons.ts` | Lost reasons CRUD | Phase 6 — Lost lead analytics |
| `crmDiscounts.ts` | Discounts and waivers | Phase 4 — Discount impact on revenue |
| `crmApprovals.ts` | Approval routing | Phase 4 — Discount/waiver approval tracking |
| `SalesWorkspace.tsx` | Main sales pipeline UI | Phase 1, 3 — Kanban + Opportunity view |
| `SalesPerformanceDashboard.tsx` | Performance dashboard | Phase 1-8 — Extension point for all enhancements |
| `SalesPaymentsDashboard.tsx` | Payment tracking | Phase 4 — Revenue display |
| `SalesTasksPage.tsx` | Task management | Phase 2 — Activity view integration |
| `CrmDashboard.tsx` | CRM overview | Phase 4 — Sales KPI widgets |

---

## Appendix C: Key Data Flow — Lead to Admission

```
1. Marketing Source → leadMaster (name, phone, source)
2. Lead Stage: "new" → Auto-welcome message → Counsellor assignment
3. Counsellor contacts lead → Stage: "attempted" → "connected"
4. Counsellor qualifies lead → Stage: "qualified"
5. Need analysis → program suggestion → Stage: "counselling"
6. Demo scheduled → Demo attended → Stage: "interested"
7. Parent counselling → Fee discussion → Stage: "follow_up"
8. Negotiation → Discount approval (if needed) → Stage: "negotiation"
9. Decision → Won → Stage: "converted" → Status: "converted"
10. Admission Engine takes over → Admission created → Student created
```

---

*End of DOC-11 — Sales Pipeline & Revenue Engine Bible*
