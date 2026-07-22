# DOC-12 — Collection Center & Recovery Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Collections & Recovery  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-08 — Finance & Fee Engine, DOC-09 — Communication Engine, DOC-10 — Workflow Engine, DOC-11 — Sales Pipeline Engine  
> **Existing Tables:** `payment_plans`, `payment_installments`, `payment_pdcs`, `payment_commitments`, `leadPayments`, `leadActivity`, `leadTasks`, `notifications`, `leadMaster`

---

## Table of Contents

1. [Collection Philosophy](#1-collection-philosophy)
2. [Collection Lifecycle](#2-collection-lifecycle)
3. [Collection Case](#3-collection-case)
4. [Ageing Buckets](#4-ageing-buckets)
5. [Collection Activities](#5-collection-activities)
6. [Promise To Pay (PTP)](#6-promise-to-pay-ptp)
7. [Recovery Strategies](#7-recovery-strategies)
8. [Collector Assignment](#8-collector-assignment)
9. [Communication Integration](#9-communication-integration)
10. [Collection Dashboard](#10-collection-dashboard)
11. [Collector Workspace](#11-collector-workspace)
12. [Escalation Matrix](#12-escalation-matrix)
13. [Collection Analytics](#13-collection-analytics)
14. [Cross-Module Integration](#14-cross-module-integration)
15. [AI Opportunities](#15-ai-opportunities)
16. [Reports](#16-reports)
17. [Parent Portal](#17-parent-portal)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Golden Rules](#19-golden-rules)

---

## 1. Collection Philosophy

### Purpose

The Collection Center is the **recovery engine** of EEOS. It is responsible for managing and recovering outstanding payments after invoices are generated and due dates pass. It does NOT handle payment processing — that belongs to Finance.

### Core Principle

**Every module has one responsibility.**

| Module | Responsibility |
|--------|---------------|
| **Finance** | Owns all invoices, receipts, and payment records |
| **Collections** | Owns recovery of outstanding amounts |
| **Communication** | Owns delivery of reminders and notifications |
| **Workflow** | Owns automation of collection processes |
| **Sales** | Owns conversion (sold, not collected) |

### Business Rules

1. **Collections NEVER edits invoices.** Finance owns the invoice — Collections only reads it.
2. **Collections NEVER edits receipts.** Finance owns receipts — Collections only records that payment was made.
3. **Collections ONLY manages recovery.** Every action a collector takes is about following up on outstanding amounts.
4. **Every outstanding amount becomes a Collection Case.** No overdue invoice goes untracked.
5. **Every activity is measurable.** Calls, messages, promises — all tracked.
6. **Every activity is auditable.** Complete history per case.
7. **One Collection Case per outstanding invoice.** No duplicate tracking.
8. **Escalation is automatic.** SLA-based escalation ensures no case is forgotten.
9. **PTP is a commitment, not a payment.** Promise To Pay is tracked separately from actual payment.
10. **Recovery is measured by result.** Effectiveness is based on amount recovered, not activity volume.

### The Golden Recovery Flow

```
Invoice Issued (Finance)
       │
       ▼
Due Date Approaches
       │
       ├── Paid on time → Case closed ✅
       │
       └── Not paid → Outstanding
              │
              ▼
       Collection Case Created
              │
              ├── Friendly Reminder (Automated)
              ├── Soft Collection (Collector)
              ├── Standard Collection (Collector)
              ├── PTP Recorded → Follow-up on PTP Date
              │     ├── PTP Kept → Payment Received → Case Closed
              │     └── PTP Broken → Escalation
              ├── Priority Collection (Senior Collector)
              ├── Management Intervention (Branch Manager)
              └── Legal Escalation (Finance/Legal)
                    │
                    └── Case Resolved (Paid / Written Off / Legal)
```

---

## 2. Collection Lifecycle

### Complete Collection Journey

```
Invoice Generated (Finance)
       │
       ▼
Due Date (T+0)
       │
       ├── Payment Received → Case never created ✅
       │
       └── Not paid → Outstanding (T+1)
              │
              ▼
       Collection Case Created
              │
              ▼
       T+1: Automated Reminder (WhatsApp/SMS)
              │
              ▼
       T+3: Soft Collection Call from Collector
              │
              ├── Payment Made → Case Closed
              │
              └── PTP Given
                     │
                     ├── PTP Date → Payment Made → Case Closed ✅
                     │
                     └── PTP Broken → Follow-up
                            │
                            ▼
                     T+7: Standard Collection
                            │
                            ├── Payment Made → Case Closed
                            │
                            └── Escalation
                                   │
                                   ▼
                            T+15: Priority Collection (Senior Collector)
                                   │
                                   ├── Payment Made → Case Closed
                                   │
                                   └── Management Escalation
                                          │
                                          ▼
                                   T+30: Management Intervention
                                   T+60: Legal Notice
                                   T+90: Legal / Write-off
```

### Case Status Lifecycle

```
Open ──► In Progress ──► Resolved (Paid)
                  │            ├── Resolved (PTP Kept)
                  │            ├── Resolved (Written Off)
                  │            └── Resolved (Legal)
                  │
                  ├── Stalled (Waiting for PTP)
                  ├── Escalated (Sent to Manager)
                  └── Closed (Unreachable / No Recovery Possible)
```

### Existing Implementation

The current system already implements several stages of this lifecycle:

| Stage | Existing Implementation | Status |
|-------|------------------------|--------|
| Invoice Generation | `leadPayments` table via `crmPayments.ts` | ✅ Existing |
| Payment Plans & Installments | `payment_plans`, `payment_installments` via `collectionEngine.ts` | ✅ Existing |
| PDC Cheques | `payment_pdcs` via `collectionEngine.ts` | ✅ Existing |
| Payment Commitments (PTP) | `payment_commitments` via `collectionEngine.ts` | ✅ Existing |
| Overdue Detection | `processOverdueInstallments` mutation | ✅ Existing |
| Automated Reminders | `sendInstallmentReminder`, `sendPDCReminders` mutations | ✅ Existing |
| Collection Summary (per lead) | `getCollectionSummary` query | ✅ Existing |
| Collection Dashboard (org-wide) | `getCollectionDashboard` query | ✅ Existing |
| Collection Center (full data) | `getCollectionCenter` query | ✅ Existing |
| PDC Dashboard | `getPDCDashboard`, `getUpcomingPDCReminders` queries | ✅ Existing |
| Activity Logging | `logActivity` in all mutations | ✅ Existing |
| Notification Creation | `createNotification` in all mutations | ✅ Existing |

### DOC-12 Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Collection Case Entity** | Formal case tracking per outstanding invoice |
| **Ageing Buckets** | Automated aging classification (Current, 1-7d, 8-15d, etc.) |
| **Collector Assignment** | Formal assignment logic (round-robin, workload-based, auto) |
| **Escalation Matrix** | SLA-based auto-escalation with defined tiers |
| **Recovery Strategies** | Stage-based strategy templates per ageing bucket |
| **Collector Workspace** | Dedicated collector UI with daily tasks |
| **Collection Analytics** | Recovery %, collector efficiency, trend analysis |
| **AI Features** | Recovery score, best time/channel prediction |

---

## 3. Collection Case

### Purpose

A Collection Case is a **formal record** of an outstanding payment that requires recovery action. It tracks the complete history of collection efforts for a specific invoice.

### Case Entity

| Field | Type | Purpose |
|-------|------|---------|
| `caseNumber` | `string` | Auto-generated unique number (e.g., EEOS-CL-2026-0001) |
| `leadId` | `id(leadMaster)` | Lead/Student reference |
| `invoiceId` | `optional(string)` | Source invoice reference (from Finance) |
| `installmentId` | `optional(id(payment_installments))` | Linked installment (if applicable) |
| `pdcId` | `optional(id(payment_pdcs))` | Linked PDC (if applicable) |
| `outstandingAmount` | `number` | Current outstanding balance |
| `originalAmount` | `number` | Original invoice amount |
| `ageingBucket` | `string` | Current / 1-7d / 8-15d / 16-30d / 31-60d / 61-90d / 90+ |
| `priority` | `string` | Low / Medium / High / Critical |
| `riskLevel` | `string` | Low / Medium / High / Critical |
| `status` | `string` | Open / InProgress / PTP / Escalated / Resolved / Closed |
| `assignedCollectorId` | `optional(id(users))` | Assigned collector |
| `seniorCollectorId` | `optional(id(users))` | Senior collector (for escalation) |
| `nextAction` | `optional(string)` | Next action to take |
| `nextActionDate` | `optional(number)` | When next action is due |
| `ptpAmount` | `optional(number)` | Promised payment amount |
| `ptpDate` | `optional(number)` | Promised payment date |
| `ptpConfidence` | `optional(string)` | Low / Medium / High |
| `ptpBrokenCount` | `optional(number)` | Number of broken promises |
| `lastContactDate` | `optional(number)` | Last collection activity date |
| `lastContactOutcome` | `optional(string)` | Outcome of last contact |
| `escalationLevel` | `optional(number)` | Current escalation level (0-5) |
| `escalationDate` | `optional(number)` | When escalation happened |
| `remarks` | `optional(string)` | Collector notes |
| `resolutionType` | `optional(string)` | Paid / WrittenOff / Legal / PTPKept / Unreachable |
| `resolvedAt` | `optional(number)` | When case was resolved |
| `resolvedBy` | `optional(id(users))` | Who resolved |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Case Number Format

```
EEOS-CL-{Year}-{Sequence}

Example: EEOS-CL-2026-0042
```

### Case Creation Rules

- A Case is created automatically when an installment becomes overdue
- A Case can be created manually for one-off outstanding amounts
- One Case per outstanding invoice (or installment)
- Multiple Cases can exist for the same lead (different invoices)
- Cases are NEVER deleted — only closed or resolved

### Collection Health Score (Existing)

The existing system already computes a collection health per lead:

| Health | Criteria | Action |
|--------|----------|--------|
| **Healthy** | Balance due = ₹0 | No action needed |
| **Good** | Balance ≤ 30% of net payable | Standard follow-up |
| **Attention** | Balance > 30% of net payable | Priority follow-up |
| **Critical** | Overdue installments OR overdue PDC | Immediate escalation |

---

## 4. Ageing Buckets

### Purpose

Ageing buckets classify outstanding amounts by **how long they have been overdue**. This drives recovery strategy, collector assignment, escalation, and reporting.

### Bucket Definitions

| Bucket | Days Overdue | Strategy | Automation | Owner |
|--------|-------------|----------|------------|-------|
| **Current** | 0 days (due today or before due) | Gentle reminder | Auto-WhatsApp | System |
| **1–7 Days** | 1 to 7 days | Soft collection | WhatsApp + Email | Collector |
| **8–15 Days** | 8 to 15 days | Standard collection | Call + WhatsApp + SMS | Collector |
| **16–30 Days** | 16 to 30 days | Priority collection | Daily follow-up + escalation prep | Collector |
| **31–60 Days** | 31 to 60 days | Management intervention | Escalation to senior collector | Senior Collector |
| **61–90 Days** | 61 to 90 days | Final notice | Legal prep + management review | Branch Manager |
| **90+ Days** | 90+ days | Legal / Write-off | Legal escalation or write-off | Finance / Legal |

### Ageing Distribution Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  📊 AGEING DISTRIBUTION — Outstanding by Bucket               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Current     ████████████            ₹1,20,000   15 leads     │
│  1-7 Days    ████████████████        ₹2,50,000   22 leads     │
│  8-15 Days   ██████████████          ₹1,80,000   18 leads     │
│  16-30 Days  ████████████            ₹1,50,000   12 leads     │
│  31-60 Days  ████████                ₹1,00,000    8 leads     │
│  61-90 Days  █████                   ₹  60,000    5 leads     │
│  90+ Days    ███                     ₹  35,000    3 leads     │
│                                                               │
│  Total Outstanding: ₹8,95,000        Total Cases: 83          │
│  ⚠️ 16 cases > 30 days — needs management review             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Automation per Bucket (Existing + DOC-12)

The existing system already has automation for overdue detection:

```yaml
Current:
  └── Action: Send polite reminder on due date
      └── Channel: WhatsApp (via DOC-09)
      └── Template: payment_reminder_today

1-7 Days:
  └── Action: Send reminder, create collector task
      └── Channel: WhatsApp + SMS
      └── Template: payment_reminder_soft

8-15 Days:
  └── Action: Collector calls + sends reminder
      └── Channel: Call + WhatsApp + Email
      └── Template: payment_reminder_standard

16-30 Days:
  └── Action: Daily follow-up sequence
      └── Channel: Call + WhatsApp + SMS (alternating)
      └── Template: payment_reminder_priority

31-60 Days:
  └── Action: Escalate to Senior Collector
      └── Notification: Senior Collector + Branch Manager
      └── Template: payment_reminder_escalation

61-90 Days:
  └── Action: Management review + Legal prep
      └── Channel: Formal letter + Phone call
      └── Template: payment_final_notice

90+ Days:
  └── Action: Legal escalation or write-off proposal
      └── Approval: Finance Manager + CEO (for write-off)
```

---

## 5. Collection Activities

### Purpose

Every collection action is logged as an **activity** against the Collection Case. This provides a complete audit trail and enables analytics on what works.

### Activity Types

| Activity Type | Logged In | Key Data Points |
|--------------|-----------|----------------|
| **Call** | `leadActivity` (via `logActivity`) | Duration, outcome, follow-up |
| **WhatsApp** | `leadWhatsAppMessages` | Template, delivery status |
| **SMS** | Future `leadSmsMessages` | Delivery status |
| **Email** | Future `leadEmailMessages` | Open/click rate |
| **Meeting** | `leadActivity` | In-person/online, attendees |
| **Parent Visit** | `leadActivity` | Parent met, concerns discussed |
| **Branch Visit** | `leadActivity` | Visit purpose, outcome |
| **PTP Recorded** | `payment_commitments` | Amount, date, confidence |
| **PTP Follow-up** | `leadActivity` | PTP confirmation result |
| **Payment Received** | `leadPayments` | Amount, mode, reference |
| **Escalation** | `leadActivity` | Escalation level, reason |
| **Legal Notice** | `leadActivity` | Notice type, sent date |
| **Management Discussion** | `leadActivity` | Decision, action items |
| **Note** | `leadNotes` | Collector's notes |

### Activity Timeline (Per Case)

```
┌───────────────────────────────────────────────────────────────┐
│  📋 COLLECTION TIMELINE — Case #EEOS-CL-2026-0042            │
│  Lead: Raj Patel | Outstanding: ₹25,000 | Ageing: 12 Days    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ● Today                                                      │
│  ├── 10:30 AM  Call connected (4m 12s)                       │
│  │   └── Raj promised to pay ₹10,000 by Friday (PTP)          │
│  ├── 09:00 AM  WhatsApp payment reminder sent                 │
│  │             → Template: standard_reminder                  │
│  │                                                           │
│  ● Yesterday                                                  │
│  ├── 04:00 PM  Payment received — ₹5,000 (UPI)               │
│  │             → Outstanding reduced from ₹30,000 to ₹25,000  │
│  ├── 11:00 AM  Call attempted — No answer                     │
│  │                                                           │
│  ● 3 days ago                                                 │
│  ├── 02:30 PM  WhatsApp reminder sent                         │
│  │             → Template: soft_reminder                      │
│  └── 10:00 AM  Collection case created                        │
│                 → Original amount: ₹30,000 / Due: 12-Oct      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Activity Volume Metrics

| Metric | Description | Existing |
|--------|-------------|----------|
| **Calls per collector** | Total calls made | ✅ Yes |
| **WhatsApp per collector** | Total messages sent | ✅ Yes |
| **PTPs recorded** | Total promises taken | ✅ Yes |
| **PTP success rate** | % of PTPs that resulted in payment | ✅ Yes (via status) |
| **Avg activities per case** | Average collection touches per case | 🔶 New |
| **First response time** | Time from case creation to first action | 🔶 New |

---

## 6. Promise To Pay (PTP)

### Purpose

PTP is a **commitment from the debtor** to pay by a specific date. It is NOT a payment — but tracking PTPs and their fulfillment is critical for recovery forecasting and collector performance.

### Existing Implementation

The current system (`payment_commitments` table via `collectionEngine.ts`) already implements PTP tracking:

| Feature | Implementation |
|---------|---------------|
| **Create PTP** | `createCommitment` mutation |
| **PTP confidence** | Low / Medium / High |
| **Update PTP status** | `updateCommitmentStatus` (completed/expired/cancelled) |
| **Link to payment** | Optional `paymentId` field |
| **Auto-task creation** | Follow-up task auto-created on PTP date |
| **Activity logging** | `logActivity` on create and update |

### DOC-12 Extensions

| Extension | Description |
|-----------|-------------|
| **Broken PTP tracking** | Auto-track when PTP date passes without payment |
| **PTP confidence scoring** | AI-based confidence prediction |
| **Auto-follow-up sequence** | If PTP broken → auto-create escalation task |
| **PTP success analytics** | % of PTPs fulfilled per collector |

### PTP Workflow

```
Collector records PTP
  └── Amount: ₹10,000
  └── Date: 20-Oct-2026
  └── Confidence: High
       │
       ▼
System creates follow-up task for PTP date
  └── Title: "PTP Follow-up — ₹10,000 by 20-Oct"
  └── Status: Pending
       │
       ▼
PTP Date arrives:
  ├── Payment received → Link to PTP → PTP marked "Completed"
  │     └── Case: Updated
  │
  └── No payment by EOD → PTP auto-marked "Broken"
        └── PTP broken count: +1
        └── Create escalation task
        └── Notify senior collector
        └── If broken >= 3 times → Escalate to manager
```

### PTP Analytics

```
┌───────────────────────────────────────────────────────────────┐
│  📊 PTP PERFORMANCE — Last 30 Days                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Total PTPs: 48            Total Amount: ₹4,20,000            │
│  Fulfilled: 32 (67%)       Amount Recovered: ₹2,85,000        │
│  Broken: 16 (33%)          Amount Outstanding: ₹1,35,000      │
│                                                               │
│  By Confidence Level:                                         │
│  ┌────────────┬──────┬──────────┬────────┬──────────┐        │
│  │ Confidence │ PTPs │ Fulfilled│ Broken │ Rate     │        │
│  ├────────────┼──────┼──────────┼────────┼──────────┤        │
│  │ High       │ 22   │ 19       │ 3      │ 86%      │        │
│  │ Medium     │ 18   │ 11       │ 7      │ 61%      │        │
│  │ Low        │ 8    │ 2        │ 6      │ 25%      │        │
│  └────────────┴──────┴──────────┴────────┴──────────┘        │
│                                                               │
│  PTP Success Rate by Collector:                               │
│  ┌────────────┬──────┬──────────┐                             │
│  │ Collector  │ PTPs │ Rate     │                             │
│  ├────────────┼──────┼──────────┤                             │
│  │ Ananya     │ 15   │ 80%      │ ████████████                │
│  │ Rajesh     │ 12   │ 67%      │ ██████████                  │
│  │ Priya      │ 10   │ 60%      │ █████████                   │
│  │ Amit       │ 11   │ 55%      │ ████████                    │
│  └────────────┴──────┴──────────┘                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 7. Recovery Strategies

### Purpose

Recovery Strategies are **pre-defined action plans** that are applied based on the ageing bucket, case priority, and lead profile.

### Strategy Templates

#### Friendly Reminder (T+0 to T+1)

```
Objective: Gentle nudge, maintain relationship
Channel: WhatsApp (primary), Email (secondary)
Frequency: Once at due date, once at T+1

Actions:
  └── Send WhatsApp: "Your fee installment of ₹X is due today"
  └── If T+1: Send WhatsApp: "Gentle reminder about your fee"
  └── Log to timeline
```

#### Soft Collection (T+1 to T+7)

```
Objective: Friendly follow-up, resolve queries
Channel: WhatsApp + Call
Frequency: Every 2 days

Actions:
  └── Send WhatsApp reminder (template: soft_reminder)
  └── Call lead/parent (outcome recorded)
  └── If PTP given → Record PTP, set follow-up
  └── If payment made → Close case
  └── If no response after 3 attempts → Escalate to standard
```

#### Standard Collection (T+8 to T+15)

```
Objective: Firm but polite follow-up
Channel: WhatsApp + SMS + Call
Frequency: Daily, alternating channels

Actions:
  └── Send WhatsApp (template: standard_reminder)
  └── Send SMS (template: payment_reminder_sms)
  └── Call lead (daily attempt)
  └── Record all activities
  └── If no response 5 days → Escalate to priority
```

#### Priority Collection (T+16 to T+30)

```
Objective: Intensive follow-up, management involvement
Channel: All channels, daily
Frequency: Daily multi-channel

Actions:
  └── Call (morning) + WhatsApp (afternoon) + SMS (evening)
  └── Escalate to senior collector
  └── Send escalation notice via WhatsApp
  └── Offer installment restructuring if needed
  └── Schedule branch visit if local
  └── If no progress 7 days → Escalate to management
```

#### Management Intervention (T+31 to T+60)

```
Objective: Branch manager / senior management involvement
Channel: Phone call + Formal notice + Meeting

Actions:
  └── Branch manager calls lead/parent
  └── Send formal notice via WhatsApp/Email
  └── Schedule in-person meeting at branch
  └── Offer final settlement options
  └── If no progress 14 days → Legal prep
```

#### Legal Escalation (T+61+)

```
Objective: Legal recovery or write-off
Channel: Legal notice + Final communication

Actions:
  └── Finance prepares legal case summary
  └── Legal notice sent via registered post
  └── Final communication attempt
  └── If unrecoverable → Write-off proposal to CEO
  └── Case status → Closed (Legal) or Resolved (Write-off)
```

### Strategy Assignment Rules

```
IF ageing = Current       → Friendly Reminder (auto)
IF ageing = 1-7d          → Soft Collection
IF ageing = 8-15d         → Standard Collection
IF ageing = 16-30d        → Priority Collection
IF ageing = 31-60d        → Management Intervention
IF ageing = 61-90d        → Final Notice
IF ageing = 90+           → Legal Escalation

IF case.priority = High   → Jump 1 strategy level
IF case.priority = Critical → Immediate priority collection
IF ptpBroken >= 3         → Jump to Management Intervention immediately
```

---

## 8. Collector Assignment

### Purpose

Collector Assignment ensures that collection cases are **efficiently distributed** among available collectors based on workload, skills, and business rules.

### Assignment Methods

| Method | Description | Best For |
|--------|-------------|----------|
| **Manual** | Supervisor assigns cases manually | Small teams, special cases |
| **Round-Robin** | Cases distributed evenly in sequence | Even workload distribution |
| **Workload-Based** | Assigns to collector with fewest active cases | Balanced teams |
| **Branch-Wise** | Collector handles their own branch's cases | Multi-branch orgs |
| **Counsellor-Wise** | Original counsellor handles collection for their leads | Small teams, relationship-based |
| **Ageing-Based** | Senior collectors handle older buckets | Tiered collection teams |
| **AI-Based** | AI recommends best collector based on past performance | Future (Phase 9) |

### Assignment Configuration

```json
{
  "assignmentConfig": {
    "method": "workload_based",
    "maxCasesPerCollector": 50,
    "priorityRules": {
      "critical": { "assignTo": "senior_collector", "maxPerCollector": 10 },
      "high": { "assignTo": "any", "maxPerCollector": 20 },
      "medium": { "assignTo": "any", "maxPerCollector": 30 },
      "low": { "assignTo": "any", "maxPerCollector": 50 }
    },
    "bucketRules": {
      "16-30d": { "assignTo": "senior_collector" },
      "31-60d": { "assignTo": "branch_manager" },
      "61-90d": { "assignTo": "finance_manager" },
      "90+": { "assignTo": "legal_team" }
    },
    "autoAssignOnCreate": true,
    "rebalanceFrequency": "daily"
  }
}
```

### Assignment Workflow

```
New Collection Case Created
       │
       ▼
Check assignment method (config)
       │
       ├── Manual: Add to unassigned pool → Supervisor assigns
       ├── Round-Robin: Next collector in sequence
       ├── Workload-Based: Collector with least active cases
       ├── Branch-Wise: Collector assigned to same branch
       ├── Counsellor-Wise: Original lead counsellor
       └── Ageing-Based: Senior collector for older buckets
       │
       ▼
Collector notified of new case
       │
       ▼
Collector accepts case (auto-accept if auto-assigned)
       │
       ▼
Case status → "InProgress"
```

### Collector Workload View

```
┌───────────────────────────────────────────────────────────────┐
│  👥 COLLECTOR WORKLOAD — Today                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┬──────┬────────┬────────┬────────┬──────────┐ │
│  │ Collector  │Active│ Critical│ High   │ Due    │ Capacity │ │
│  ├────────────┼──────┼────────┼────────┼────────┼──────────┤ │
│  │ Ananya     │ 32   │ 5      │ 12     │ 8      │ 50 ██████│ │
│  │ Rajesh     │ 45   │ 8      │ 15     │ 12     │ 50 ██████│ │
│  │ Priya      │ 28   │ 3      │ 10     │ 5      │ 50 ██████│ │
│  │ Amit       │ 50   │ 12     │ 20     │ 18     │ 50 ██████│ │
│  │ Sunita     │ 15   │ 2      │ 5      │ 3      │ 50 ██████│ │
│  └────────────┴──────┴────────┴────────┴────────┴──────────┘ │
│                                                               │
│  ⚠️ Amit is at full capacity — do not assign new cases        │
│  ✅ Sunita has capacity — route new cases to her              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 9. Communication Integration

### Core Principle

**Communication owns delivery. Collections owns the content and timing.**

All collection communications go through DOC-09 (Communication Engine), which handles channel selection, template rendering, delivery tracking, and recipient resolution.

### Collection Communication Templates

| Event | Template Code | Channel | Recipient Role |
|-------|---------------|---------|----------------|
| Due Today | `payment_due_today` | WhatsApp | Primary Fee Contact |
| Due Tomorrow | `payment_due_tomorrow` | WhatsApp | Primary Fee Contact |
| Overdue (1-7d) | `payment_overdue_soft` | WhatsApp | Primary Fee Contact |
| Overdue (8-15d) | `payment_overdue_standard` | WhatsApp | Primary Fee Contact |
| Overdue (16-30d) | `payment_overdue_priority` | WhatsApp + SMS | Primary Fee Contact + Decision Maker |
| Overdue (31-60d) | `payment_escalation_notice` | WhatsApp + SMS | All contacts |
| Final Notice (61-90d) | `payment_final_notice` | SMS + Email | All contacts |
| PTP Reminder | `payment_ptp_reminder` | WhatsApp | Primary Fee Contact |
| PTP Broken | `payment_ptp_broken` | WhatsApp | Primary Fee Contact + Decision Maker |
| PTP Fulfilled | `payment_ptp_thanks` | WhatsApp | Primary Fee Contact |
| Receipt Confirmation | `payment_receipt` | WhatsApp | Primary Fee Contact |
| Thank You | `payment_thank_you` | WhatsApp | Primary Fee Contact |

### Recipient Resolution

As defined in DOC-05 (Lead V2) — Family Contacts with role flags:

| Communication Type | Recipient Selection |
|-------------------|-------------------|
| Fee Reminder | `familyContacts` where `isPrimaryFeeContact = true` |
| Overdue Notice | `familyContacts` where `isPrimaryFeeContact = true` |
| Escalation | `familyContacts` where `isPrimaryDecisionMaker = true` |
| Final Notice | ALL contacts with `isPrimaryFeeContact` OR `isPrimaryDecisionMaker` |
| PTP Follow-up | `familyContacts` where `isPrimaryFeeContact = true` |
| Legal Notice | ALL contacts |
| Receipt | `familyContacts` where `isPrimaryFeeContact = true` |

### Communication Schedule (Ageing-Based)

```
Current (Due Date):
  └── 08:00 AM — WhatsApp (template: payment_due_today)

1-3 Days Overdue:
  └── 09:00 AM — WhatsApp (template: payment_overdue_soft)
  └── 11:00 AM — Call attempt #1

4-7 Days Overdue:
  └── 09:00 AM — WhatsApp (template: payment_overdue_soft)
  └── 03:00 PM — SMS (template: payment_reminder_sms)
  └── 11:00 AM — Call attempt #2

8-15 Days Overdue:
  └── 09:00 AM — WhatsApp (template: payment_overdue_standard)
  └── 05:00 PM — SMS (template: payment_reminder_sms)
  └── 11:00 AM — Call attempt #3

16-30 Days Overdue:
  └── 09:00 AM — WhatsApp (template: payment_overdue_priority)
  └── 01:00 PM — SMS (template: payment_reminder_sms)
  └── 05:00 PM — Call attempt #4
  └── Escalation notification to senior collector
```

---

## 10. Collection Dashboard

### Existing Implementation

The existing system (`CollectionDashboard.tsx`) already implements a comprehensive dashboard with 4 tabs:

| Tab | Content |
|-----|---------|
| **Overview** | Total Collected, Pending Verification, Overdue Installments, PDC Exposure, PDC Pipeline, Installment Health, Urgency cards |
| **PDC Management** | PDC Status cards (Scheduled/Deposited/Cleared/Bounced), PDC Urgency (Due Today/This Week/Overdue), PDC Performance |
| **Installments** | Planned/Due/Overdue/Paid with amounts and visual bars |
| **Payments** | Collected vs Pending with efficiency |

### DOC-12 Dashboard Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Outstanding Trend** | Day-over-day / week-over-week outstanding trend line |
| **Recovery % Trend** | Collection efficiency trend over time |
| **High Risk Cases** | Cases requiring immediate attention |
| **PTP Fulfillment Rate** | Running PTP performance tracker |
| **Broken PTP Alert** | Alerts for repeated broken promises |
| **Branch Performance** | Per-branch recovery comparison |
| **Collector Leaderboard** | Ranked by recovery amount and PTP success |

### Dashboard Layout (Enhanced)

```
┌───────────────────────────────────────────────────────────────┐
│  📊 COLLECTION DASHBOARD — 15-Oct-2026                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ Outstanding │ │ Collected  │ │ Recovery   │ │Overdue     │ │
│  │ ₹8.95L     │ │ ₹42.5L    │ │ Rate 83%   │ │₹3.20L     │ │
│  │  83 cases  │ │  Today +₹12K│ │  📈 +2%   │ │  16 cases  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ PTP Pending│ │Broken PTP  │ │ PTP Success │ │ High Risk  │ │
│  │ ₹1.35L     │ │ 16 (33%)  │ │ 67%         │ │  8 cases   │ │
│  │  16 PTPs   │ │  📈 +5%   │ │  Target 75% │ │  Immediate │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  OUTSTANDING TREND (Last 30 Days)                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ₹10L ┤                                              ╱   │  │
│  │ ₹9L  ┤                                          ╱──     │  │
│  │ ₹8L  ┤                              ╱──────              │  │
│  │ ₹7L  ┤          ╱──────────────                         │  │
│  │ ₹6L  ┤   ╱──────                                       │  │
│  │      └──────────────────────────────────────────        │  │
│  │       20 Sep    25 Sep    30 Sep    05 Oct   10 Oct     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  AGEING DISTRIBUTION                                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Current    ████████████████           ₹1.2L   15 cases  │  │
│  │ 1-7d       ██████████████████████     ₹2.5L   22 cases  │  │
│  │ 8-15d      ████████████████████       ₹1.8L   18 cases  │  │
│  │ 16-30d     ████████████████           ₹1.5L   12 cases  │  │
│  │ 31-60d     ██████████                 ₹1.0L    8 cases  │  │
│  │ 61-90d     ██████                     ₹0.6L    5 cases  │  │
│  │ 90+        ████                       ₹0.35L   3 cases  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  COLLECTOR LEADERBOARD (This Month)                           │
│  ┌────────────┬────────┬──────────┬────────┬──────────┐     │
│  │ Collector  │Recovered│ PTP Rate │ Cases  │ Score    │     │
│  ├────────────┼────────┼──────────┼────────┼──────────┤     │
│  │ 🥇 Ananya  │ ₹4.2L  │ 80%      │ 32     │ 92       │     │
│  │ 🥈 Priya   │ ₹3.8L  │ 75%      │ 28     │ 85       │     │
│  │ 🥉 Rajesh  │ ₹3.1L  │ 67%      │ 45     │ 72       │     │
│  │ 4. Amit    │ ₹2.5L  │ 55%      │ 50     │ 58       │     │
│  └────────────┴────────┴──────────┴────────┴──────────┘     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 11. Collector Workspace

### Purpose

The Collector Workspace is the **daily operations hub** for collection agents. It shows today's tasks, pending cases, and provides quick actions for all collection activities.

### Workspace Layout

```
┌───────────────────────────────────────────────────────────────┐
│  💼 COLLECTOR WORKSPACE — Ananya Sharma                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ My Cases   │ │ Due Today  │ │ Overdue    │ │ PTP Due    │ │
│  │    32      │ │     8      │ │     12     │ │     5      │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  TODAY'S PRIORITY                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔴 Critical — Raj Patel — ₹25,000 — 12 days overdue     │  │
│  │   Last Contact: 3 days ago (PTP: ₹10,000 by Fri)        │  │
│  │   [Call] [WhatsApp] [Record PTP] [View Timeline]        │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 🟠 High — Priya Sharma — ₹15,000 — 8 days overdue       │  │
│  │   Last Contact: 5 days ago (No answer)                  │  │
│  │   [Call] [WhatsApp] [Visit] [View Timeline]             │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 🟡 Medium — Amit Singh — ₹8,000 — 5 days overdue        │  │
│  │   Last Contact: 2 days ago (PTP given)                  │  │
│  │   [Call] [WhatsApp] [View Timeline]                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  PTP DUE TODAY                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ✅ Sunita Verma — PTP ₹10,000 — Confidence: High       │  │
│  │   [Confirm Payment] [Mark Broken] [Call]                │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ ⏳ Vikram Joshi — PTP ₹5,000 — Confidence: Medium      │  │
│  │   [Confirm Payment] [Mark Broken] [WhatsApp Reminder]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  QUICK ACTIONS                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ [Call]     │ │ [WhatsApp] │ │ [SMS]      │ │ [Record    │ │
│  │            │ │            │ │            │ │  Payment]  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ [Record    │ │ [Schedule  │ │ [Visit]    │ │ [Escalate] │ │
│  │  PTP]      │ │  Followup] │ │            │ │            │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Workspace Features

| Feature | Description | Existing |
|---------|-------------|----------|
| **My Cases** | All assigned collection cases | ✅ Yes (`CollectionCenter.tsx`) |
| **Today's Priority** | High-priority cases sorted by urgency | ✅ Yes (health-based sorting) |
| **PTP Due Today** | Promises that need follow-up today | ✅ Yes (`payment_commitments`) |
| **Quick Actions** | One-click call, WhatsApp, payment, PTP | ✅ Yes (button bar) |
| **Case Timeline** | Complete activity history | ✅ Yes (expandable rows) |
| **Payment History** | All payments for the lead | ✅ Yes (payments tab) |
| **Installment View** | Installment plan status | ✅ Yes (installments tab) |
| **PDC View** | PDC cheque status | ✅ Yes (pdc tab) |
| **Lead Profile Link** | Navigate to full lead workspace | ✅ Yes ("Open Lead" button) |

### DOC-12 Enhancements

| Enhancement | Description |
|-------------|-------------|
| **SLA Timer** | Time remaining before escalation threshold |
| **Auto-Dial** | Click-to-call with automatic outcome logging |
| **Smart Suggestions** | AI-recommended next action for each case |
| **Batch Actions** | Send WhatsApp/SMS to multiple leads at once |
| **Case Notes** | Quick note-taking with auto-timeline logging |

---

## 12. Escalation Matrix

### Purpose

The Escalation Matrix defines **who handles what** when a collector cannot resolve a case within defined SLAs. It ensures no case is ever abandoned.

### Escalation Levels

```
Level 0: Collector
  └── Scope: All cases up to 15 days overdue
  └── Authority: Follow standard collection process
  └── SLA: Respond within 24h of case creation

Level 1: Senior Collector
  └── Scope: Cases 16-30 days overdue OR escalated by collector
  └── Authority: Intensive follow-up, visit scheduling
  └── SLA: Respond within 48h of escalation

Level 2: Branch Manager
  └── Scope: Cases 31-60 days overdue OR PTP broken 3+ times
  └── Authority: Final settlement approval, discount authorization
  └── SLA: Respond within 72h of escalation

Level 3: Finance Manager
  └── Scope: Cases 61-90 days overdue OR high-value cases (>₹1L)
  └── Authority: Legal notice authorization, restructuring approval
  └── SLA: Respond within 1 week of escalation

Level 4: CEO / Director
  └── Scope: Cases 90+ days overdue OR write-off approval
  └── Authority: Write-off approval, legal escalation
  └── SLA: Respond within 2 weeks of escalation
```

### Escalation Triggers

| Trigger | Escalate From | Escalate To | After |
|---------|---------------|-------------|-------|
| **SLA Breach** | Collector | Senior Collector | No action in 24h |
| **Ageing Threshold** | Collector | Senior Collector | 16 days overdue |
| **PTP Broken (3x)** | Collector | Branch Manager | 3rd broken promise |
| **No Response (7 days)** | Collector | Senior Collector | 7 days without contact |
| **High Value (>₹50K)** | Collector | Branch Manager | Immediate |
| **High Value (>₹1L)** | Branch Manager | Finance Manager | Immediate |
| **Ageing Threshold** | Senior Collector | Branch Manager | 31 days overdue |
| **Ageing Threshold** | Branch Manager | Finance Manager | 61 days overdue |
| **Write-off Needed** | Finance Manager | CEO | 90+ days overdue |
| **Legal Needed** | Finance Manager | Legal Team | 90+ days overdue |

### Escalation Notification

```
Level 1 Escalation:
┌─────────────────────────────────────────────────────────────────┐
│  📅 ESCALATION NOTICE — Collection Case #EEOS-CL-2026-0042      │
│                                                                 │
│  Lead: Raj Patel | Outstanding: ₹25,000 | Ageing: 18 Days       │
│  Assigned Collector: Ananya Sharma                              │
│                                                                 │
│  Escalated To: Amit Mehta (Senior Collector)                    │
│  Reason: Case ageing exceeded 15-day threshold                  │
│                                                                 │
│  Last Actions Taken:                                            │
│  ├── WhatsApp sent (2 days ago) — No response                   │
│  ├── Call attempted (3 days ago) — No answer                    │
│  └── PTP recorded (5 days ago) — Broken                         │
│                                                                 │
│  Action Needed:                                                 │
│  ├── Attempt branch visit                                       │
│  ├── Contact decision maker directly                            │
│  └── Offer installment restructuring if needed                  │
│                                                                 │
│  Auto-Escalation in: 72 hours → Branch Manager                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Collection Analytics

### Purpose

Collection Analytics provides **data-driven insights** into collection performance, efficiency, and effectiveness across collectors, branches, and time periods.

### Key Metrics

| Metric | Formula | Existing |
|--------|---------|----------|
| **Recovery %** | `(Collected / Net Payable) × 100` | ✅ Yes |
| **Collector Efficiency** | `(Recovered Amount / (Cases × Days))` | 🔶 New |
| **Branch Efficiency** | `Branch Recovery / Branch Outstanding` | 🔶 New |
| **Avg Days to Recover** | `Σ(days from due to payment) / Payments` | 🔶 New |
| **Ageing Trend** | `MoM change in each ageing bucket` | 🔶 New |
| **PTP Success %** | `(PTPs Fulfilled / Total PTPs) × 100` | ✅ Yes (via status) |
| **Communication Success %** | `(Actions that led to payment / Total actions)` | 🔶 New |
| **Collection Velocity** | `Amount recovered per day per collector` | 🔶 New |
| **First Contact Resolution** | `Cases resolved within first 7 days / Total cases` | 🔶 New |
| **Escalation Rate** | `Cases escalated / Total cases` | 🔶 New |

### Analytics Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  📈 COLLECTION ANALYTICS — Q4 2026                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ Recovery   │ │ Avg Days   │ │ PTP Success│ │Escalation  │ │
│  │ Rate       │ │ to Recover │ │ Rate       │ │ Rate       │ │
│  │ 82.5%      │ │ 12.3 days  │ │ 67%        │ │ 8.2%       │ │
│  │ 📈 +3.2%   │ │ 📉 -1.5d   │ │ 📈 +5%     │ │ 📊 -1%     │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                               │
│  TREND: Recovery % Over Time                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 85% ┤                                                  │  │
│  │ 80% ┤                        ╱──╲                      │  │
│  │ 75% ┤             ╱──╲  ╱──      ╲                     │  │
│  │ 70% ┤    ╱──╲  ╱──    ╲          ╲──╲                 │  │
│  │ 65% ┤ ╱──    ╲                                        │  │
│  │      └──────────────────────────────────────────       │  │
│  │       Jul  │  Aug  │  Sep  │  Oct  │  Nov  │  Dec     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  COLLECTOR EFFICIENCY                                          │
│  ┌────────────┬──────────┬────────┬────────┬──────────┐     │
│  │ Collector  │ Recovered│ Cases  │ Eff.   │ Avg Days │     │
│  ├────────────┼──────────┼────────┼────────┼──────────┤     │
│  │ Ananya     │ ₹4.2L    │ 32     │ 92     │ 8.2      │     │
│  │ Priya      │ ₹3.8L    │ 28     │ 85     │ 10.5     │     │
│  │ Rajesh     │ ₹3.1L    │ 45     │ 72     │ 14.2     │     │
│  │ Amit       │ ₹2.5L    │ 50     │ 58     │ 18.7     │     │
│  └────────────┴──────────┴────────┴────────┴──────────┘     │
│                                                               │
│  BRANCH EFFICIENCY                                            │
│  ┌──────────┬──────────┬────────────┬────────┬──────────┐   │
│  │ Branch   │Outstanding│ Recovered  │ Eff.%  │ Cases    │   │
│  ├──────────┼──────────┼────────────┼────────┼──────────┤   │
│  │ Andheri  │ ₹3.2L    │ ₹2.8L      │ 87.5%  │ 28       │   │
│  │ Borivali │ ₹2.8L    │ ₹2.1L      │ 75.0%  │ 22       │   │
│  │ Thane    │ ₹1.5L    │ ₹1.2L      │ 80.0%  │ 15       │   │
│  │ Dadar    │ ₹1.4L    │ ₹0.8L      │ 57.1%  │ 18       │   │
│  └──────────┴──────────┴────────────┴────────┴──────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 14. Cross-Module Integration

### Purpose

The Collection Center integrates with every other module in EEOS to provide a seamless recovery process.

### Integration Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COLLECTION ENGINE INTEGRATIONS                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Finance (DOC-08)             Communication (DOC-09)                │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │  leadPayments      │      │  WhatsApp templates │                 │
│  │  payment_plans ────┤─────►│  SMS templates     │                 │
│  │  payment_instal.   │      │  Email templates   │                 │
│  │  Invoice data      │      │  Recipient resolu. │                 │
│  └────────┬───────────┘      └────────────────────┘                 │
│           │                                                         │
│           │                                                         │
│  Workflow (DOC-10)               CRM (DOC-05)                      │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │  Triggers:         │      │  leadMaster        │                 │
│  │  installment.      │─────►│  leadActivity      │                 │
│  │    overdue          │      │  leadTasks         │                 │
│  │  pdc.bounced       │      │  leadNotes         │                 │
│  │  ptp.broken        │      │  callLogs          │                 │
│  │  escalation.trigger│      └────────────────────┘                 │
│  └────────────────────┘                                             │
│                                                                      │
│  Sales (DOC-11)                 Student (DOC-07)                    │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │  Lead pipeline      │      │  Student record    │                 │
│  │  Counsellor info    │─────►│  Family contacts   │                 │
│  │  Expected revenue   │      │  Academic info     │                 │
│  │  Conversion data    │      └────────────────────┘                 │
│  └────────────────────┘                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Ownership Boundaries

| Module | Owns | Shares With Collections | Read-Only From Collections |
|--------|------|------------------------|---------------------------|
| **Finance** | Invoices, Receipts, Payments | Payment status, amounts | Never modifies |
| **Collections** | Collection Cases, PTPs, Activities, Escalations | Case status, collector notes | Payment history |
| **Communication** | Message templates, delivery | Sent messages, delivery status | Recipient selection |
| **Workflow** | Automation rules, triggers | Overdue detection, reminders | Case status changes |
| **CRM** | Lead data, Stage history | Lead info, activity timeline | Call logs, notes |

### Key Integration Points

#### Finance → Collections

```
Finance: Invoice becomes overdue
  └── Collections: Case created (read outstanding amount)
Collections: Payment recorded
  └── Finance: Payment verified (amount reduced)
Collections: Case closed when outstanding = 0
```

#### Collections → Communication (DOC-09)

```
Collections: Case ageing changes bucket
  └── Communication: Send appropriate reminder template
Collections: PTP created
  └── Communication: Send PTP confirmation
Collections: PTP broken
  └── Communication: Send escalation notice
```

#### Collections → Workflow (DOC-10)

```
Trigger: installment.overdue
  └── Action: Create Collection Case
  └── Action: Assign Collector
  └── Action: Send Reminder

Trigger: ptp.broken
  └── Action: Escalate to Senior Collector
  └── Action: Create Escalation Task

Trigger: ageing.30days
  └── Action: Escalate to Branch Manager
  └── Action: Send Management Alert
```

#### Collections → CRM (Existing)

```
Collection Center reads from CRM:
  └── leadMaster (name, phone, stage, amounts)
  └── leadActivity (activity timeline)
  └── leadTasks (collection tasks)
  └── leadNotes (collector notes)
  └── callLogs (collection calls)

Collection Center writes to CRM:
  └── leadActivity (collection activities)
  └── leadTasks (collection follow-up tasks)
  └── leadNotes (case notes)
```

---

## 15. AI Opportunities

### 1. Recovery Score

```
AI predicts the probability of full recovery for each case.

Input:
  - Ageing bucket, outstanding amount, payment history
  - Past communication response rate
  - Lead profile (program, branch, location)
  - Collector profile (past success with similar cases)

Output:
  Case: Raj Patel — ₹25,000 — Ageing: 12 Days
  
  🤖 Recovery Score: 72/100 (Medium-High)
  
  Factors:
    ✅ Has paid installments on time before (+20)
    ✅ Contactable (answers calls) (+15)
    ⚠️ PTP broken once (-10)
    ⚠️ Decision maker not engaged (-15)
    ⚠️ Previous late payment pattern (-8)
  
  Recommendation: Moderate recovery effort, focus on decision maker
```

### 2. Best Time to Call

```
AI predicts the optimal time to contact each lead for maximum pick-up rate.

Input:
  - Historical call logs (time of day, day of week, outcome)
  - Lead timezone and location
  - Past communication preferences

Output:
  Lead: Raj Patel — +91-9876543210
  
  🤖 Best Time to Call: Tuesday/Thursday, 6:00-7:00 PM
    Confidence: 85%
    
    Why:
    ✅ 4 out of 5 successful calls were in this window
    ✅ Lead preferred "evening" in profile
    ✅ Decision maker (Mother) available at this time
  
  Worst Time: Monday morning (0% pick-up rate)
```

### 3. Best Channel Prediction

```
AI recommends the communication channel with highest conversion probability.

Input:
  - Historical channel performance for this lead
  - Channel open/response rates
  - Lead demographic preferences

Output:
  Lead: Priya Sharma — Outstanding: ₹15,000 — Ageing: 8 Days
  
  🤖 Best Channel: WhatsApp (68% response rate)
    Next Best: Phone Call (45% pick-up rate)
    
  Avoid: SMS (12% response rate for this lead)
  
  Recommended Message Time: 10:00 AM (highest open rate)
```

### 4. Payment Probability

```
AI predicts the likelihood of payment within the next 7 days.

Input:
  - Current case status, ageing, PTP history
  - Collector activity level
  - Seasonality (month-end, exam periods)
  - Lead financial profile

Output:
  Case: Amit Singh — ₹8,000 — Ageing: 5 Days — PTP Active
  
  🤖 Payment Probability (Next 7 Days): 82%
  
  Factors:
    ✅ PTP given with high confidence (+25)
    ✅ First time overdue (no history) (+20)
    ✅ Collector contact established (+15)
    ✅ Month-end (+10) — salary cycle
    ⚠️ Decision maker not directly contacted (-8)
  
  If no action in 3 days: Probability drops to 45%
```

### 5. Broken Promise Prediction

```
AI predicts which PTPs are likely to be broken.

Input:
  - Past PTP history (number broken, patterns)
  - Confidence level given by collector
  - Lead/student profile and behaviour
  - Time since last contact

Output:
  PTP: ₹10,000 by 20-Oct — Confidence: High (Collector)
  
  🤖 Broken Promise Risk: 35% (Medium Risk)
  
  Risk Factors:
    ⚠️ 1 PTP already broken previously
    ⚠️ Last contact was 5 days ago
    ⚠️ Decision maker not part of the promise
    ⚠️ Lead has made partial payments (possible cash flow issue)
    
  Recommendation:
    → Confirm PTP 1 day before date
    → Engage decision maker in follow-up
    → Offer partial payment option if full amount is difficult
```

### 6. Collector Recommendation

```
AI recommends the best collector for a specific case.

Input:
  - Case characteristics (ageing, amount, lead profile)
  - Collector profiles (skills, workload, history)
  - Past success rates for similar cases

Output:
  Case: High-value (₹75K), 45 days overdue, NEET program, Parent communication in Hindi
  
  🤖 Best Collector: Ananya Sharma
    Match: 94/100
    
    Why Ananya?
    ✅ 78% recovery rate on similar high-value cases
    ✅ Fluent in Hindi
    ✅ Currently under capacity (32 of 50 cases)
    ✅ Has recovered ₹4.2L this month (top performer)
    
  Alternative:
    🥈 Priya Verma (82/100 — recovering well, can take 1 more)
    ❌ Amit Mehta (45/100 — over capacity, 50 cases)
```

### 7. Priority Ranking

```
AI reorders the collector's task list based on multiple factors.

Input:
  - Outstanding amount, ageing, risk level
  - PTP due dates
  - Collector's past success patterns
  - Time sensitivity (legal threshold approaching)

Output:
  Priority Queue for Ananya Sharma:
  
  🥇 Raj Patel — ₹25,000 — 12d overdue → PTP due tomorrow
  🥈 Amit Singh — ₹8,000 — 5d overdue → Easy win (high probability)
  🥉 Priya Sharma — ₹15,000 — 8d overdue → High value
  4.  Sunita Verma — ₹10,000 — PTP due today → Time-sensitive
  5.  Vikram Joshi — ₹5,000 — 3d overdue → Quick follow-up
```

### 8. Risk Detection

```
AI identifies cases that are at risk of becoming unrecoverable.

Input:
  - Ageing, communication response rate, PTP history
  - Lead behaviour (phone switched off, not responding)
  - External signals (competitor institute, address change)

Output:
  🚨 Risk Alert: Case #EEOS-CL-2026-0089 — Amit Verma
  
  Risk Level: HIGH — 78% chance of becoming uncollectible
  
  Detected Signals:
    🔴 Phone switched off for 3 consecutive days (new behaviour)
    🔴 No response to 5 WhatsApp messages
    🔴 PTP broken twice
    ⚠️ Address verification pending
    ⚠️ Last successful contact was 12 days ago
    
  Recommended Action:
    → Immediate branch visit
    → Contact emergency contact number
    → Escalate to senior collector TODAY
```

---

## 16. Reports

### Report Catalog

| Report | Frequency | Owner | Purpose |
|--------|-----------|-------|---------|
| **Outstanding Report** | Daily | Collection Manager | Current outstanding by ageing bucket |
| **Recovery Report** | Daily | Finance Manager | Amount recovered today/this week/this month |
| **Collector Report** | Weekly | Collection Manager | Per-collector performance |
| **Ageing Report** | Weekly | Collection Manager | Ageing distribution by branch |
| **PTP Report** | Weekly | Collection Manager | PTP success rate, broken PTPs |
| **Branch Report** | Weekly | Regional Manager | Per-branch collection performance |
| **Program Report** | Monthly | CEO | Recovery rate by program |
| **Counsellor Report** | Monthly | Branch Manager | Collection contribution per counsellor |
| **Communication Report** | Monthly | Marketing | Channel effectiveness (WhatsApp vs SMS vs Email) |
| **Escalation Report** | Monthly | Finance Manager | Escalation frequency, resolution rate |
| **Write-off Report** | Quarterly | CEO | Write-off amounts and reasons |
| **Legal Report** | Quarterly | Legal | Cases under legal action and status |

### Outstanding Report

```
┌───────────────────────────────────────────────────────────────┐
│  📋 OUTSTANDING REPORT — 15-Oct-2026                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Outstanding: ₹8,95,000     Total Cases: 83             │
│                                                               │
│  By Ageing Bucket:                                            │
│  ┌──────────────┬────────┬──────────┬──────────┬──────────┐  │
│  │ Bucket       │ Cases  │ Amount   │ % of Total│ Collectors│ │
│  ├──────────────┼────────┼──────────┼──────────┼──────────┤  │
│  │ Current      │ 15     │ ₹1,20,000│ 13.4%    │ Auto      │  │
│  │ 1-7 Days     │ 22     │ ₹2,50,000│ 27.9%    │ 3 coll.   │  │
│  │ 8-15 Days    │ 18     │ ₹1,80,000│ 20.1%    │ 3 coll.   │  │
│  │ 16-30 Days   │ 12     │ ₹1,50,000│ 16.8%    │ 2 coll.   │  │
│  │ 31-60 Days   │ 8      │ ₹1,00,000│ 11.2%    │ Sr. coll. │  │
│  │ 61-90 Days   │ 5      │ ₹60,000  │ 6.7%     │ Manager   │  │
│  │ 90+ Days     │ 3      │ ₹35,000  │ 3.9%     │ Legal     │  │
│  └──────────────┴────────┴──────────┴──────────┴──────────┘  │
│                                                               │
│  ⚠️ 16 cases > 30 days (₹1.95L) — Requires management review │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Collector Performance Report

```
┌───────────────────────────────────────────────────────────────┐
│  👤 COLLECTOR PERFORMANCE — October 2026 (Week 2)            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┬────────┬────────┬────────┬────────┬────────┐ │
│  │ Collector  │ Cases  │ Recov. │ PTPs   │ Broken │ Score  │ │
│  ├────────────┼────────┼────────┼────────┼────────┼────────┤ │
│  │ Ananya     │ 32     │ ₹4.2L  │ 15/19  │ 4      │ 92     │ │
│  │ Priya      │ 28     │ ₹3.8L  │ 12/18  │ 6      │ 85     │ │
│  │ Rajesh     │ 45     │ ₹3.1L  │ 8/12   │ 4      │ 72     │ │
│  │ Amit       │ 50     │ ₹2.5L  │ 6/11   │ 5      │ 58     │ │
│  └────────────┴────────┴────────┴────────┴────────┴────────┘ │
│                                                               │
│  Top Performer: Ananya (92) — Highest recovery + PTP rate     │
│  Needs Attention: Amit (58) — Over capacity, low recovery     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 17. Parent Portal

### Purpose

The Parent Portal provides self-service access for parents to view outstanding amounts, payment history, download receipts, and make payments.

### Portal Sections

| Section | Content | Actions |
|---------|---------|---------|
| **Outstanding** | Total outstanding, upcoming installments | View breakdown |
| **Invoices** | All invoices with status | View, Download |
| **Receipts** | All payment receipts | View, Download |
| **Installments** | Installment schedule with due dates | View upcoming |
| **Payment History** | Complete payment timeline | View |
| **Payment Links** | Quick-pay links for outstanding | Pay Now |
| **PTP Requests** | Request to pay by a specific date | Submit request |
| **Support Requests** | Raise concerns about fees/billing | Submit ticket |

### Parent Portal Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│  Welcome, Rajesh Patel                                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  Fee Summary for Raj Patel — JEE Foundation            │   │
│  │                                                       │   │
│  │  Total Fees: ₹85,000                                  │   │
│  │  Paid: ₹60,000                                        │   │
│  │  Outstanding: ₹25,000                                  │   │
│  │  Next Due: 20-Oct-2026 (Installment #4 — ₹10,000)    │   │
│  │                                                       │   │
│  │  [Pay Now — ₹10,000]  [Pay Full — ₹25,000]           │   │
│  │  [View All Invoices]  [Download Receipts]             │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  Upcoming Installments:                                       │
│  ┌──────────┬──────────┬────────────┬──────────┐             │
│  │ #        │ Amount   │ Due Date   │ Status   │             │
│  ├──────────┼──────────┼────────────┼──────────┤             │
│  │ 4        │ ₹10,000  │ 20-Oct-2026│ Due Soon │             │
│  │ 5        │ ₹10,000  │ 20-Nov-2026│ Planned  │             │
│  │ 6        │ ₹5,000   │ 20-Dec-2026│ Planned  │             │
│  └──────────┴──────────┴────────────┴──────────┘             │
│                                                               │
│  Recent Payments:                                             │
│  ├── 15-Sep-2026 — ₹10,000 — UPI — ✅ Verified               │
│  ├── 20-Aug-2026 — ₹10,000 — UPI — ✅ Verified               │
│  └── 20-Jul-2026 — ₹10,000 — UPI — ✅ Verified               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### PTP Request from Portal

```
Parent sees outstanding amount
       │
       ▼
Parent clicks "Request Payment Plan"
       │
       ▼
Parent selects:
  ┌──────────────────────────────────────────────┐
  │  Request: I will pay by                        │
  │  Date: [25-Oct-2026]                          │
  │  Amount: [₹10,000] (full or partial)          │
  │  Reason: (optional) "Salary expected on 24th" │
  └──────────────────────────────────────────────┘
       │
       ▼
System creates PTP request (status: pending)
       │
       ▼
Collector reviews and approves/declines
       │
       ├── Approved → PTP recorded → Follow-up scheduled
       └── Declined → Alternative payment plan offered
       │
       ▼
Parent notified via WhatsApp
```

---

## 18. Implementation Roadmap

### Phase 1 — Collection Cases (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Existing `collectionEngine.ts`

**Tasks:**
- [ ] Create `collectionCases` table in schema
- [ ] Case CRUD (create from overdue installments/invoices)
- [ ] Auto-case creation on installment overdue
- [ ] Case status lifecycle management
- [ ] Case number auto-generation (EEOS-CL-YYYY-XXXX)
- [ ] Link case to installment, PDC, payment records

### Phase 2 — Ageing & Buckets (P1)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Ageing bucket calculation engine
- [ ] Auto-classify cases into buckets
- [ ] Bucket-based dashboard widgets
- [ ] Ageing trend tracking

### Phase 3 — Collector Workspace (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, Existing `CollectionCenter.tsx`

**Tasks:**
- [ ] Collector assignment engine (round-robin, workload-based)
- [ ] Collector workspace UI (today's tasks, priority queue)
- [ ] PTP due today view
- [ ] Quick actions (Call, WhatsApp, Record Payment, PTP)
- [ ] SLA timer display

### Phase 4 — PTP Enhancement (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Existing `payment_commitments`

**Tasks:**
- [ ] Broken PTP auto-detection
- [ ] PTP broken count tracking
- [ ] Auto-escalation on repeated broken promises
- [ ] PTP analytics dashboard
- [ ] PTP success rate tracking

### Phase 5 — Communication Integration (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, DOC-09

**Tasks:**
- [ ] Ageing-based communication schedule
- [ ] Collection-specific WhatsApp templates
- [ ] Auto-reminder scheduling per bucket
- [ ] Recipient resolution (Family Contacts → Fee Contact)
- [ ] Communication delivery tracking

### Phase 6 — Escalation Engine (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Escalation matrix configuration
- [ ] Auto-escalation on SLA breach
- [ ] Escalation notification templates
- [ ] Escalation audit trail
- [ ] Escalation dashboard

### Phase 7 — Collection Analytics (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phases 1-6

**Tasks:**
- [ ] Collection analytics engine
- [ ] Collector efficiency scoring
- [ ] Branch performance comparison
- [ ] Ageing trend analysis
- [ ] Recovery forecasting
- [ ] Analytics dashboard

### Phase 8 — Reports (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phases 1-7

**Tasks:**
- [ ] Outstanding report (PDF/Excel)
- [ ] Collector performance report
- [ ] Ageing report
- [ ] PTP report
- [ ] Branch report
- [ ] Report scheduling/auto-delivery

### Phase 9 — AI Features (P3)

**Estimated effort:** 10-15 days  
**Dependencies:** Phases 1-8, AI Infrastructure

**Tasks:**
- [ ] Recovery score model
- [ ] Best time to call prediction
- [ ] Best channel prediction
- [ ] Payment probability model
- [ ] Broken promise prediction
- [ ] Collector recommendation
- [ ] Priority ranking
- [ ] Risk detection

### Phase 10 — Parent Portal Integration (P3)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 5, Parent Portal

**Tasks:**
- [ ] Outstanding fee display in parent portal
- [ ] PTP request from portal
- [ ] Payment link integration
- [ ] Receipt download
- [ ] Installment schedule view

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Collection Cases | P1 | 5d | Medium | Critical |
| 2. Ageing & Buckets | P1 | 3d | Low | High |
| 3. Collector Workspace | P1 | 5d | Medium | Critical |
| 4. PTP Enhancement | P2 | 4d | Low | High |
| 5. Communication Integration | P2 | 4d | Medium | High |
| 6. Escalation Engine | P2 | 4d | Medium | High |
| 7. Collection Analytics | P2 | 5d | Medium | High |
| 8. Reports | P2 | 4d | Low | Medium |
| 9. AI Features | P3 | 15d | High | High |
| 10. Parent Portal | P3 | 5d | Medium | Medium |

---

## 19. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║           COLLECTION CENTER GOLDEN RULES                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Finance owns money.                                     ║
║      └── Collections never edits invoices or receipts.        ║
║                                                              ║
║  2.  Collections owns recovery.                              ║
║      └── Collections is responsible for follow-up and        ║
║      recovery of outstanding amounts.                        ║
║                                                              ║
║  3.  Communication owns delivery.                            ║
║      └── All outbound messages go through DOC-09.             ║
║                                                              ║
║  4.  Workflow owns automation.                               ║
║      └── Collection automation runs through DOC-10.           ║
║                                                              ║
║  5.  No duplicate financial data.                            ║
║      └── Collections references Finance data, never copies.   ║
║                                                              ║
║  6.  One Collection Case per outstanding invoice.            ║
║      └── No duplicate tracking of the same amount.            ║
║                                                              ║
║  7.  Every activity is logged.                               ║
║      └── Calls, messages, PTPs — all recorded in timeline.   ║
║                                                              ║
║  8.  Every reminder is measurable.                           ║
║      └── Delivery, open, and response tracked per template.   ║
║                                                              ║
║  9.  Every escalation is auditable.                          ║
║      └── Who escalated, when, why, and resolution logged.    ║
║                                                              ║
║ 10.  Collections never modifies Finance.                     ║
║      └── Read-only access to invoices, receipts, payments.    ║
║                                                              ║
║ 11.  PTP is a commitment, not a payment.                     ║
║      └── PTP tracking is separate from payment processing.    ║
║                                                              ║
║ 12.  Ageing drives everything.                               ║
║      └── Strategy, assignment, escalation — all based on     ║
║      how long the amount has been overdue.                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Belongs To |
|--------|-----------|--------|-------|-----------|
| Collection Case | `collectionCases` | 🔶 New | Phase 1 | Collections |
| Payment Plan | `payment_plans` | ✅ Existing | N/A | Finance |
| Payment Installment | `payment_installments` | ✅ Existing | N/A | Finance |
| PDC Cheque | `payment_pdcs` | ✅ Existing | N/A | Finance |
| Payment Commitment (PTP) | `payment_commitments` | ✅ Existing | Phase 4 | Collections |
| Collection Activity | `leadActivity` (reused) | ✅ Existing | N/A | CRM |
| Collection Task | `leadTasks` (reused) | ✅ Existing | N/A | CRM |
| Collection Call | `callLogs` (reused) | ✅ Existing | N/A | CRM |
| Collection Note | `leadNotes` (reused) | ✅ Existing | N/A | CRM |
| Lead Payment | `leadPayments` | ✅ Existing | N/A | Finance |
| Escalation Log | `escalationLogs` | 🔶 New | Phase 6 | Collections |
| Collection Template | `commTemplates` (via DOC-09) | 🔶 New | Phase 5 | Communication |

## Appendix B: Existing Code Integration Points

| Existing File | What It Does | DOC-12 Integration |
|---------------|-------------|-------------------|
| `collectionEngine.ts` | Full collection engine (plans, installments, PDCs, commitments, automation, dashboard) | Phase 1-6 — Base foundation, extend with Cases, Escalation |
| `crmPayments.ts` | Payment CRUD with verification flow | Phase 1 — Case creation from overdue payments |
| `crmLeads.ts` | Lead CRUD, stage management | Phase 3 — Lead data for collector workspace |
| `crmTasks.ts` | Lead task management | Phase 3 — Collection follow-up tasks |
| `crmCalls.ts` | Call logging | Phase 3 — Collection call activities |
| `crmWhatsApp.ts` | WhatsApp sending | Phase 5 — Collection WhatsApp integration |
| `crmActivity.ts` | Activity timeline | Phase 1 — Case timeline from lead activity |
| `CollectionCenter.tsx` | Full collection workspace UI | Phase 3 — Extension point for collector workspace |
| `CollectionDashboard.tsx` | Org-wide collection dashboard | Phase 7 — Extension point for analytics |

## Appendix C: Key Data Flow — Overdue to Recovery

```
1. Installment becomes overdue (past due date)
       │
       ▼
2. processOverdueInstallments runs (cron)
       │
       ▼
3. Installment status → "overdue"
       │
       ▼
4. Notification created for collector
       │
       ▼
5. Collection Case created (DOC-12 Phase 1)
       │
       ▼
6. Case assigned to collector (auto/manual)
       │
       ▼
7. Collector workspace shows case in priority queue
       │
       ▼
8. Ageing-based strategy applied:
   ├── 1-7d: Soft collection (WhatsApp + Call)
   ├── 8-15d: Standard collection (WhatsApp + SMS + Call)
   ├── 16-30d: Priority collection (Daily follow-up)
   └── 31d+: Escalation
       │
       ▼
9. Collector activities logged (calls, WhatsApp, notes)
       │
       ▼
10. Payment received → Case updated → Outstanding reduced
       │
       ▼
11. If outstanding = 0 → Case resolved
    If PTP broken → Escalation
    If unreachable → Escalation
```

---

*End of DOC-12 — Collection Center & Recovery Engine Bible*
