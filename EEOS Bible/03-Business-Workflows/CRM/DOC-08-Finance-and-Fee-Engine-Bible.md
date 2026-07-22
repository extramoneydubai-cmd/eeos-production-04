# DOC-08 — Finance & Fee Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Finance & Fee Management  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2 Architecture, DOC-06 — Admission Engine, DOC-07 — Student 360°

---

## Table of Contents

1. [Finance Philosophy](#1-finance-philosophy)
2. [Finance Lifecycle](#2-finance-lifecycle)
3. [Fee Structure Architecture](#3-fee-structure-architecture)
4. [Fee Components](#4-fee-components)
5. [Student Fee Plan](#5-student-fee-plan)
6. [Invoice Architecture](#6-invoice-architecture)
7. [Installment Engine](#7-installment-engine)
8. [Receipt Engine](#8-receipt-engine)
9. [Payment Modes](#9-payment-modes)
10. [Scholarships](#10-scholarships)
11. [Discount Engine](#11-discount-engine)
12. [Waiver Engine](#12-waiver-engine)
13. [Refund Engine](#13-refund-engine)
14. [Collections Center Integration](#14-collections-center-integration)
15. [Communication Integration](#15-communication-integration)
16. [Revenue Tracking](#16-revenue-tracking)
17. [Financial Reports](#17-financial-reports)
18. [Finance Dashboard](#18-finance-dashboard)
19. [AI Opportunities](#19-ai-opportunities)
20. [Parent Portal View](#20-parent-portal-view)
21. [Student App View](#21-student-app-view)
22. [Implementation Roadmap](#22-implementation-roadmap)
23. [Golden Rules](#23-golden-rules)

---

## 1. Finance Philosophy

### Purpose

The Finance & Fee Engine is the **single source of truth for all monetary transactions** in EEOS. It owns, tracks, and reports every rupee that flows through the system — from fee setup to receipt generation to refund processing.

### Core Principle

**Finance owns money. No other module touches financial data.**

| Module | Relationship with Finance |
|--------|--------------------------|
| **Admission Engine** | Checks payment status (Paid/Partial/Pending) — never stores amounts |
| **Student Management** | Displays fee information via queries — never stores financial records |
| **Collections Center** | Creates collection actions, sends follow-ups — never stores money |
| **Communication** | Delivers fee reminders using Family Contacts — never stores payment data |
| **CRM (Lead V2)** | Tracks expected revenue, discounts approved — actual payments in Finance |

### Business Rules

1. **Finance owns all payment records.** No other module creates, modifies, or stores financial data.
2. **Invoices generate receipts.** Receipts never modify invoices — they are additive records.
3. **One invoice can have multiple receipts.** Partial payments are tracked against a single invoice.
4. **Discounts and waivers require approval.** No financial adjustment happens without an audit trail.
5. **Refunds are separate from payments.** A refund is a distinct financial transaction, not a negative payment.
6. **Scholarships are applied at the Finance level.** Not as discounts on individual invoices.
7. **Payment plans are templates, not contracts.** They generate installments which flexibility to adjust.
8. **All financial records are immutable once verified.** Edits create audit trails, not overwrites.
9. **Fee structure is program + session + branch specific.** Each combination has its own fee definition.
10. **Financial reporting is real-time.** All dashboards query live data — no batch processing.

### Financial Ownership Map

```
┌─────────────────────────────────────────────────────────────┐
│                    FINANCE MODULE                             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Fee       │  │ Invoices │  │ Receipts │  │ Installments│  │
│  │Structure │  │          │  │          │  │             │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Scholarsh.│  │ Discount │  │ Waivers  │  │  Refunds   │  │
│  │          │  │          │  │          │  │             │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │PDC       │  │Payment   │  │Collect.  │  │ Financial  │  │
│  │Cheques   │  │Plans     │  │Metrics   │  │ Reports    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐
│Admission │   │ Student  │   │Collect.  │   │ Communic.  │
│(Read     │   │(Read     │   │(Actions) │   │(Delivery)  │
│ Only)    │   │ Only)    │   │          │   │            │
└──────────┘   └──────────┘   └──────────┘   └────────────┘
```

---

## 2. Finance Lifecycle

The complete financial journey of a student from lead to alumni.

### Lifecycle Map

```
Lead Stage (CRM)
  │
  ├── Expected Revenue (estimate)
  ├── Fee Discussion (counselling)
  ├── Discount Requested (approval)
  │
  ▼
Admission Stage (Engine)
  │
  ├── Fee Plan Assigned (program-based)
  ├── Invoice Generated (admission)
  ├── Payment Collected (partial/full)
  ├── Receipt Generated
  │
  ▼
Student Stage (Active)
  │
  ├── Fee Plan Finalized (per session)
  ├── Installments Generated
  ├── Invoices Issued (periodic)
  ├── Payments Collected
  ├── Receipts Generated
  ├── Reminders Sent (auto)
  │
  ├── [Optional] Discount Applied
  ├── [Optional] Scholarship Applied
  ├── [Optional] Waiver Approved
  │
  ├── [Optional] PDC Cheque Deposited/Cleared/Bounced
  ├── [Optional] Payment Plan Modified
  │
  ├── Overdue Tracking
  ├── Collection Follow-up
  │
  ▼
Course Completion
  │
  ├── Final Settlement
  ├── [Optional] Refund Processed
  │
  ▼
Closure / Alumni
  │
  └── Financial Record Archived
```

### Stage Detail

#### 1. Lead Stage (CRM)
- **What happens:** Counsellor discusses fees, expected revenue noted, discount requested via approval
- **Financial data:** `leadMaster.expectedRevenue`, `leadDiscounts` (pending/approved)
- **Key rule:** No actual payments at this stage — only estimates and approvals

#### 2. Admission Stage
- **What happens:** Fee structure assigned, invoice generated, admission fee collected
- **Financial data:** Invoice created, payment received, receipt generated
- **Key rule:** Admission Engine only checks payment status — does not process payment

#### 3. Student Stage (Active)
- **What happens:** Installment plan active, periodic invoices issued, payments tracked, overdue managed
- **Financial data:** Fee plan, installments, PDCs, commitments, collections
- **Key rule:** All financial activity is owned by Finance — Student module displays only

#### 4. Course Completion
- **What happens:** Final settlement calculated, any refund processed
- **Financial data:** Final invoice, refund record, closure status

#### 5. Closure / Alumni
- **What happens:** Financial record archived, no further activity expected
- **Financial data:** All records preserved for audit

---

## 3. Fee Structure Architecture

### Purpose

The Fee Structure is a **master template** that defines the total fee for a specific program, session, and branch combination. It is the source of truth for what a student should pay.

### Fee Structure Master Fields

| Field | Type | Purpose |
|-------|------|---------|
| `feePlanName` | `string` | Name (e.g., "JEE Foundation 2026-27 Standard") |
| `programId` | `id(academicPrograms)` | Target program |
| `sessionId` | `id(academicSessions)` | Target session |
| `branchId` | `id(orgBranches)` | Target branch |
| `currency` | `string` | INR / USD / etc. |
| `validFrom` | `number` | Start of validity |
| `validTo` | `number` | End of validity |
| `description` | `optional(string)` | Notes about the plan |
| `status` | `string` | Active / Draft / Archived |
| `totalFee` | `number` | Computed sum of all components |
| `createdBy` | `id(users)` | Creator |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Fee Structure Example

```
Fee Plan: JEE Foundation 2026-27 (Andheri Centre)
═══════════════════════════════════════════════════════
Program: JEE Foundation
Session: 2026-27
Branch: Andheri (Mumbai)
Status: ✅ Active
═══════════════════════════════════════════════════════
Component                     │ Amount    │ Type     │ Taxable
───────────────────────────────────────────────────────
Admission Fee (One-time)      │ ₹5,000    │ Fixed    │ No
Tuition Fee (Annual)          │ ₹35,000   │ Fixed    │ Yes (18%)
Material Fee                  │ ₹3,000    │ Fixed    │ No
Exam Fee                      │ ₹2,000    │ Fixed    │ No
Library Fee                   │ ₹1,000    │ Fixed    │ No
Activity Fee                  │ ₹1,000    │ Fixed    │ No
───────────────────────────────────────────────────────
Base Total                    │ ₹47,000   │          │
GST @ 18% on Tuition          │ ₹6,300    │          │
───────────────────────────────────────────────────────
TOTAL FEE                     │ ₹53,300   │          │
═══════════════════════════════════════════════════════
```

### Fee Structure by Program

```
┌─────────────────────────────────────────────────────────────┐
│  Fee Structure Matrix                                        │
├──────────────┬────────────┬──────────┬──────────┬───────────┤
│ Program      │ Session    │ Branch   │ Total    │ Status    │
├──────────────┼────────────┼──────────┼──────────┼───────────┤
│ JEE Found.   │ 2026-27    │ Andheri  │ ₹53,300  │ ✅ Active │
│ JEE Found.   │ 2026-27    │ Borivali │ ₹51,000  │ ✅ Active │
│ JEE Found.   │ 2026-27    │ Online   │ ₹35,000  │ ✅ Active │
│ NEET Found.  │ 2026-27    │ Andheri  │ ₹55,000  │ ✅ Active │
│ NEET Found.  │ 2026-27    │ Borivali │ ₹52,000  │ ✅ Active │
│ CBSE 9       │ 2026-27    │ Andheri  │ ₹28,000  │ ✅ Active │
│ CBSE 10      │ 2026-27    │ Andheri  │ ₹30,000  │ ✅ Active │
└──────────────┴────────────┴──────────┴──────────┴───────────┘
```

### Indexes

- `by_programId_sessionId` — Primary lookup
- `by_branchId` — Branch-specific plans
- `by_status` — Active/draft/archived filtering

### Design Rules

- Fee structure is **program + session + branch specific** — each combination gets its own plan
- Total fee is **auto-computed** from components — never entered manually
- A fee structure can be **cloned** to create variants with minor adjustments
- Changes to fee structure do NOT affect already-assigned student fee plans

---

## 4. Fee Components

### Purpose

Reusable building blocks that make up a fee structure. Components can be mixed, matched, and re-used across different fee plans.

### Fee Component Fields

| Field | Type | Purpose |
|-------|------|---------|
| `name` | `string` | Component name (e.g., "Tuition Fee") |
| `code` | `string` | Short code (e.g., "TUITION") |
| `componentType` | `string` | Admission / Tuition / Material / Exam / Transport / Hostel / Library / Activity / Other |
| `isMandatory` | `boolean` | Must be included in every fee plan |
| `isOptional` | `boolean` | Can be opted in/out |
| `isTaxable` | `boolean` | Subject to GST/tax |
| `taxRate` | `optional(number)` | Tax percentage (e.g., 18) |
| `isRefundable` | `boolean` | Refundable if student withdraws |
| `amountType` | `string` | Fixed / Variable / Percentage |
| `defaultAmount` | `number` | Default value (if fixed) |
| `frequency` | `string` | OneTime / Annual / Monthly / PerExam |
| `description` | `optional(string)` | Notes |
| `isActive` | `boolean` | Available for use |
| `createdAt` | `number` | Timestamp |

### Default Fee Components

| Code | Name | Type | Mandatory | Taxable | Refundable |
|------|------|------|-----------|---------|------------|
| `ADMISSION` | Admission Fee | Admission | Yes | No | No |
| `TUITION` | Tuition Fee | Tuition | Yes | Yes | No |
| `MATERIAL` | Material Fee | Material | Yes | No | Yes |
| `EXAM` | Exam Fee | Exam | Yes | No | No |
| `TRANSPORT` | Transport Fee | Transport | No | No | Yes |
| `HOSTEL` | Hostel Fee | Hostel | No | No | Yes |
| `LIBRARY` | Library Fee | Library | No | No | No |
| `ACTIVITY` | Activity Fee | Activity | No | No | No |
| `LAB` | Lab Fee | Other | No | No | No |
| `UNIFORM` | Uniform Fee | Other | No | No | Yes |
| `CAUTION` | Caution Deposit | Other | No | No | Yes |

### Fee Component Assignment to Fee Structure

```
Fee Structure: JEE Foundation 2026-27 (Andheri)

Components:
  ├── Admission Fee      ₹5,000   [Fixed] [One-time] [Mandatory]
  ├── Tuition Fee        ₹35,000  [Fixed] [Annual]   [Mandatory] [18% GST]
  ├── Material Fee       ₹3,000   [Fixed] [Annual]   [Mandatory]
  ├── Exam Fee           ₹2,000   [Fixed] [Annual]   [Mandatory]
  ├── Library Fee        ₹1,000   [Fixed] [Annual]   [Optional]
  ├── Activity Fee       ₹1,000   [Fixed] [Annual]   [Optional]
  └── Transport Fee      ₹8,000   [Fixed] [Annual]   [Optional]
```

### Design Rules

- Components are **reusable** — same component can appear in multiple fee structures
- Amount is set per fee structure (component base value can differ per plan)
- Optional components can be toggled on/off per student fee plan

---

## 5. Student Fee Plan

### Purpose

When a student is admitted, a fee plan is **assigned** based on the fee structure template. This creates a frozen copy of the fee structure for that specific student, which can then be customized with installments, discounts, etc.

### Assignment Flow

```
Lead Admitted
         │
         ▼
System identifies fee structure:
  Program = JEE Foundation
  Session = 2026-27
  Branch  = Andheri
         │
         ▼
Student Fee Plan created (copy of structure):
  ┌─────────────────────────────────────────────┐
  │  Student: Raj Patel                         │
  │  Plan: JEE Foundation 2026-27 Standard       │
  │  Total: ₹53,300                              │
  │                                              │
  │  Components (frozen from template):          │
  │   ├── Admission Fee    ₹5,000  [Included]   │
  │   ├── Tuition Fee      ₹35,000 [Included]   │
  │   ├── Material Fee     ₹3,000  [Included]   │
  │   ├── Exam Fee         ₹2,000  [Included]   │
  │   ├── Library Fee      ₹1,000  [Opted Out]  │
  │   └── Transport Fee    ₹8,000  [Included]   │
  │                                              │
  │  Optional toggles adjusted by counsellor     │
  └─────────────────────────────────────────────┘
         │
         ▼
Installments generated (See Section 7)
         │
         ▼
Invoices issued per installment
```

### Student Fee Plan Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `feeStructureId` | `id(feeStructures)` | Source fee structure |
| `admissionId` | `id(admissions)` | Admission reference |
| `totalFee` | `number` | Total after component adjustments |
| `discountAmount` | `number` | Total discount applied |
| `scholarshipAmount` | `number` | Total scholarship applied |
| `waiverAmount` | `number` | Total waiver applied |
| `netPayable` | `number` | Total − Discount − Scholarship − Waiver |
| `installmentCount` | `number` | Number of installments |
| `status` | `string` | Active / Completed / Cancelled |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Student Fee Plan Components (per student)

| Field | Type | Purpose |
|-------|------|---------|
| `feePlanId` | `id(studentFeePlans)` | Parent fee plan |
| `componentId` | `id(feeComponents)` | Component reference |
| `name` | `string` | Component name (frozen) |
| `amount` | `number` | Component amount (frozen) |
| `isIncluded` | `boolean` | Whether student opted in |
| `isTaxable` | `boolean` | Whether taxed |
| `taxAmount` | `number` | Computed tax |

### Design Rules

- Fee plan is a **snapshot** — changes to fee structure don't retroactively change student plans
- Optional components can be toggled within a grace period (default: 7 days after admission)
- Multiple fee plans per student across different sessions

---

## 6. Invoice Architecture

### Purpose

Invoices are the **official demand for payment**. They are generated from the student fee plan and can be issued for the full amount or per installment.

### Invoice Fields

| Field | Type | Purpose |
|-------|------|---------|
| `invoiceNumber` | `string` | Auto-generated unique number (EEOS-INV-2026-XXXX) |
| `studentId` | `id(students)` | Student reference |
| `admissionId` | `id(admissions)` | Admission reference |
| `feePlanId` | `id(studentFeePlans)` | Fee plan reference |
| `installmentId` | `optional(id(paymentInstallments))` | Linked installment (if per-installment) |
| `sessionId` | `id(academicSessions)` | Session reference |
| `branchId` | `id(orgBranches)` | Branch reference |
| `issueDate` | `number` | Date issued |
| `dueDate` | `number` | Payment due date |
| `totalAmount` | `number` | Total invoice amount |
| `amountPaid` | `number` | Sum of verified receipts against this invoice |
| `balanceDue` | `number` | Total − Paid |
| `status` | `string` | Draft / Issued / PartiallyPaid / Paid / Overdue / Cancelled |
| `lineItems` | `string` | JSON array of fee components |
| `notes` | `optional(string)` | Invoice notes |
| `generatedBy` | `id(users)` | Who generated |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Invoice Number Format

```
EEOS-INV-YYYY-XXXX

Example: EEOS-INV-2026-0042
```

### Invoice Status Lifecycle

```
Draft ──► Issued ──► PartiallyPaid ──► Paid
                    │                    │
                    └──► Overdue         │
                                        │
                              Cancelled (before payment)
```

### Invoice Example

```
╔═══════════════════════════════════════════════════════╗
║                 TAX INVOICE                            ║
║                                                        ║
║  EEOS Institute                                   ║
║  Andheri (West), Mumbai - 400053                       ║
║  GSTIN: 27ABCDE1234F1Z5                               ║
║                                                        ║
║  Invoice No: EEOS-INV-2026-0042                        ║
║  Date: 01-Aug-2026                                     ║
║  Due Date: 15-Aug-2026                                 ║
║                                                        ║
║  Student: Raj Patel                                    ║
║  Program: JEE Foundation (2026-27)                     ║
║  Batch: Morning A                                      ║
║                                                        ║
║  ┌──────────────────────────────────────────────┐      ║
║  │ # │ Description         │ Amount   │ Tax     │      ║
║  ├──────────────────────────────────────────────┤      ║
║  │ 1 │ Admission Fee       │ ₹5,000   │ —       │      ║
║  │ 2 │ Tuition Fee         │ ₹35,000  │ ₹6,300  │      ║
║  │ 3 │ Material Fee        │ ₹3,000   │ —       │      ║
║  │ 4 │ Exam Fee            │ ₹2,000   │ —       │      ║
║  │ 5 │ Transport Fee       │ ₹8,000   │ —       │      ║
║  ├──────────────────────────────────────────────┤      ║
║  │    Total                │ ₹53,000  │ ₹6,300  │      ║
║  │    Grand Total          │ ₹59,300           │      ║
║  └──────────────────────────────────────────────┘      ║
║                                                        ║
║  Status: Issued                                         ║
║  Payment: Pay via UPI / Bank Transfer / Cash            ║
║                                                        ║
╚═══════════════════════════════════════════════════════╝
```

### Invoice Generation Triggers

| Trigger | When | Invoice Type |
|---------|------|-------------|
| **Admission Approved** | Student created | Admission invoice |
| **Installment Due** | Per installment schedule | Installment invoice |
| **Manual** | Finance team action | Custom invoice |
| **Reissue** | Correction needed | Replacement invoice |

### Indexes

- `by_invoiceNumber` — Unique lookup
- `by_studentId` — Student invoices
- `by_status` — Payment status filtering
- `by_dueDate` — Overdue tracking

### Design Rules

- Invoice number is **never reused** — even cancelled invoices retain their number
- Multiple receipts can be linked to one invoice (partial payments)
- Invoice line items are **frozen at generation** — changes to fee structure don't retroactively change issued invoices

---

## 7. Installment Engine

### Purpose

Automatically split a fee plan into manageable installments with configurable frequency, due dates, and grace periods.

### Existing Implementation (Collection Engine)

The current system (`collectionEngine.ts`, `payment_plans`, `payment_installments` tables) already implements basic installment functionality. The DOC-08 architecture extends it with full invoicing integration.

### Installment Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentFeePlanId` | `id(studentFeePlans)` | Parent fee plan |
| `installmentNumber` | `number` | Sequence (1-based) |
| `amount` | `number` | Installment amount |
| `dueDate` | `number` | Payment due date |
| `graceDays` | `number` | Days after due before overdue |
| `status` | `string` | Planned / Due / Paid / PartiallyPaid / Overdue / Waived / Cancelled |
| `paymentId` | `optional(id(payments))` | Linked payment (when paid) |
| `paidAt` | `optional(number)` | When paid |
| `invoiceId` | `optional(id(invoices))` | Linked invoice |
| `reminderSentAt` | `optional(number)` | Last reminder sent |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Installment Generation Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Equal Split** | Total ÷ Count | Standard plans |
| **Front-loaded** | 50% first, rest equal | High initial cost programs |
| **Custom** | Manual per-installment amounts | Negotiated plans |
| **Event-based** | Tied to exam/milestone dates | Test series fees |

### Installment Schedule Example

```
Student: Raj Patel — JEE Foundation
Total Fee: ₹53,300
Plan: 5 Monthly Installments

#  │ Due Date    │ Amount  │ Status
───┼─────────────┼─────────┼──────────
 1  │ 01-Aug-2026 │ ₹10,660 │ ✅ Paid
 2  │ 01-Sep-2026 │ ₹10,660 │ ✅ Paid
 3  │ 01-Oct-2026 │ ₹10,660 │ ⏳ Due
 4  │ 01-Nov-2026 │ ₹10,660 │ 🔮 Planned
 5  │ 01-Dec-2026 │ ₹10,660 │ 🔮 Planned
───┼─────────────┼─────────┼──────────
    │ Total       │ ₹53,300 │
```

### Auto-Reminder Schedule

| Days Before Due | Action |
|----------------|--------|
| T-7 | Send reminder: "Installment due in 7 days" |
| T-3 | Send reminder: "Installment due in 3 days" |
| T-1 | Send reminder: "Installment due tomorrow" |
| T+0 | Mark status as "Due" |
| T+1 to T+grace | Status remains "Due" |
| T+grace+1 | Mark as "Overdue", trigger collection |

### Indexes

- `by_studentFeePlanId` — Plan installments
- `by_dueDate` — Upcoming/overdue filtering
- `by_status` — Payment status grouping
- `by_studentId` — Student installment view

---

## 8. Receipt Engine

### Purpose

Receipts are **proof of payment**. Every payment received generates a receipt. One invoice can have multiple receipts (partial payments).

### Receipt Fields

| Field | Type | Purpose |
|-------|------|---------|
| `receiptNumber` | `string` | Auto-generated unique number (EEOS-RCP-2026-XXXX) |
| `invoiceId` | `id(invoices)` | Invoice this payment is for |
| `studentId` | `id(students)` | Student reference |
| `paymentId` | `id(leadPayments)` | Source payment record |
| `amount` | `number` | Amount received |
| `mode` | `string` | Cash / UPI / Bank Transfer / Card / Cheque / Online |
| `referenceNumber` | `optional(string)` | Transaction ID / UTR / Cheque number |
| `receivedDate` | `number` | Date payment received |
| `collectedBy` | `id(users)` | Who collected the payment |
| `verifiedBy` | `optional(id(users))` | Who verified |
| `verifiedAt` | `optional(number)` | Verification timestamp |
| `notes` | `optional(string)` | Receipt notes |
| `downloadUrl` | `optional(string)` | PDF receipt URL |
| `createdAt` | `number` | Timestamp |

### Receipt Number Format

```
EEOS-RCP-YYYY-XXXX

Example: EEOS-RCP-2026-0042
```

### Receipt Example

```
╔═══════════════════════════════════════════════════════╗
║              PAYMENT RECEIPT                           ║
║                                                        ║
║  EEOS Institute                                   ║
║                                                        ║
║  Receipt No: EEOS-RCP-2026-0042                        ║
║  Date: 05-Aug-2026                                     ║
║                                                        ║
║  Received from: Raj Patel                              ║
║  Program: JEE Foundation (2026-27)                     ║
║                                                        ║
║  ┌──────────────────────────────────────────────┐      ║
║  │ Invoice No             │ Amount   │ Balance   │      ║
║  ├──────────────────────────────────────────────┤      ║
║  │ EEOS-INV-2026-0042     │ ₹10,660  │ ₹42,640   │      ║
║  └──────────────────────────────────────────────┘      ║
║                                                        ║
║  Payment Mode: UPI                                     ║
║  Reference: UPI-1234567890                             ║
║  Amount: ₹10,660                                       ║
║                                                        ║
║  Status: ✅ Verified                                    ║
║  Verified By: Accounts Dept                            ║
║                                                        ║
║  This is a computer-generated receipt.                 ║
╚═══════════════════════════════════════════════════════╝
```

### Receipt-Invoice Relationship

```
Invoice (EEOS-INV-2026-0042)
  Total: ₹59,300
  Status: PartiallyPaid
     │
     ├── Receipt #1: ₹10,660 (05-Aug-2026) → UPI
     ├── Receipt #2: ₹10,660 (01-Sep-2026) → Cash
     ├── Receipt #3: ₹10,660 (03-Oct-2026) → Bank Transfer
     ├── Receipt #4: ₹10,660 (01-Nov-2026) → Card
     └── Receipt #5: ₹16,660 (01-Dec-2026) → Online → Status: Paid
```

### Design Rules

- Receipts are **immutable** once generated — corrections require a reversal + new receipt
- Each receipt decrements the invoice's `balanceDue`
- When `balanceDue` reaches 0, invoice status becomes "Paid"
- Receipts are available for download from student and parent portals

---

## 9. Payment Modes

### Supported Payment Modes

| Mode | Type | Settlement Time | Fee | Verification |
|------|------|----------------|-----|-------------|
| **Cash** | Offline | Instant | None | Manual |
| **UPI** | Online | Instant | 0-2% | Auto (UPI ID) |
| **Bank Transfer** | Online | 0-2 days | None | Manual (UTR) |
| **Card (POS)** | Offline | Instant | 1-3% | Manual |
| **Card (Online)** | Online | Instant | 1-3% | Auto |
| **Cheque** | Offline | 2-3 days | None | Manual + Clearance |
| **Online Gateway** | Online | Instant | 2-5% | Auto |
| **Wallet** | Online | Instant | 1-2% | Auto |
| **Corporate Sponsorship** | Offline | Varies | None | Manual + Approval |
| **Scholarship Direct** | Offline | Varies | None | Manual + Approval |

### Payment Reconciliation Flow

```
Payment Received
       │
       ▼
┌───────────────────────────────────────┐
│  Payment Mode Determines Workflow     │
│                                       │
│  ┌───────────┐      ┌─────────────┐  │
│  │ Cash/Cheque│      │ UPI/Card/   │  │
│  │ (Manual)  │      │ Online (Auto)│  │
│  └─────┬─────┘      └──────┬──────┘  │
│        │                   │         │
│        ▼                   ▼         │
│  Status: Pending       Status: Pending│
│        │                   │         │
│        ▼                   ▼         │
│  Finance Team          Auto-Verify  │
│  Reviews Payment       with Gateway │
│        │                   │         │
│        ▼                   ▼         │
│  ┌─────────────────────────────┐     │
│  │  Verification Decision       │     │
│  │  ├── Verified → Receipt Gen │     │
│  │  ├── Rejected → Refund      │     │
│  │  └── Pending → Follow-up    │     │
│  └─────────────────────────────┘     │
└───────────────────────────────────────┘
```

### Cheque/PDC Lifecycle

```
Cheque Received (PDC Created)
       │
       ▼
Status: Scheduled
       │
       ▼ (On Due Date or Before)
Deposited in Bank
       │
       ▼
Status: Deposited
       │
       ├── Clear → Status: Cleared → Payment Verified
       │
       └── Bounce → Status: Bounced → Collection Follow-up
                    │
                    ├── Re-deposit (new date)
                    ├── Alternative payment requested
                    └── Legal follow-up (if repeated)
```

### Design Rules

- Manual modes (cash, cheque) require verification by finance team
- Auto modes (UPI, online card) are verified via payment gateway callback
- Cheque bounce triggers automatic notification to Primary Fee Contact
- Corporate sponsorship requires additional approval from management

---

## 10. Scholarships

### Purpose

Scholarships are **official reductions** in fee liability based on merit, need, or other criteria. They are applied at the Finance level and require formal approval.

### Scholarship Fields

| Field | Type | Purpose |
|-------|------|---------|
| `scholarshipName` | `string` | Name (e.g., "Merit Scholarship 2026") |
| `scholarshipType` | `string` | Merit / NeedBased / Sports / Corporate / Staff |
| `studentId` | `id(students)` | Student reference |
| `amount` | `number` | Amount or percentage value |
| `amountType` | `string` | Fixed / Percentage |
| `maxAmount` | `optional(number)` | Cap if percentage-based |
| `approvedBy` | `id(users)` | Approver |
| `approvedAt` | `number` | Approval date |
| `validFrom` | `number` | Start of validity |
| `validTo` | `number` | End of validity (can be session-linked) |
| `status` | `string` | Draft / Pending / Approved / Rejected / Expired |
| `remarks` | `optional(string)` | Approval notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Scholarship Types

| Type | Description | Criteria | Max |
|------|-------------|----------|-----|
| **Merit Scholarship** | Academic performance | 85%+ in previous exam | 50% of tuition |
| **Need-based Scholarship** | Financial need | Family income < ₹5L/year | 75% of total |
| **Sports Scholarship** | Sports achievement | National/State level | 100% of tuition |
| **Corporate Scholarship** | Employee child | Company sponsorship | 100% of total |
| **Staff Scholarship** | Staff child | Employee verification | 50% of total |

### Approval Workflow

```
Counsellor Recommends Scholarship
         │
         ▼
Documents Submitted (Income proof, marksheet, etc.)
         │
         ▼
Verification Team Validates
         │
         ├── Valid → Forward to Scholarship Committee
         │
         └── Invalid → Rejected (with reason)
                    │
                    └── Resubmit
         │
         ▼
Scholarship Committee Approves/Rejects
         │
         ├── Approved → Applied to Fee Plan
         │
         └── Rejected → Counsellor notified
```

### Design Rules

- Scholarships stack with discounts (both can apply)
- Total discount + scholarship cannot exceed 100% of fees
- Scholarship is **per session** — must be renewed annually
- Approval required from authorized committee members

---

## 11. Discount Engine

### Purpose

Discounts are **short-term reductions** in fee liability for specific promotions or circumstances. Unlike scholarships, discounts are typically one-time and don't require committee approval.

### Existing Implementation

The current system (`crmDiscounts.ts`, `leadDiscounts` table) already handles discount creation, approval workflow, and recalculation of payable amounts. DOC-08 extends this with scholarship integration and reporting.

### Discount Types

| Type | Description | Approval Level |
|------|-------------|----------------|
| **Early Bird** | Paid before deadline | Manager |
| **Sibling** | Sibling already enrolled | Manager |
| **Referral** | Referred by existing student | Manager |
| **Promotional** | Campaign-specific | Admin |
| **Management** | Management discretion | Director |
| **Custom** | Negotiated by counsellor | Admin |
| **Group** | Bulk enrollment discount | Director |

### Discount Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `category` | `string` | scholarship / discount / waiver / adjustment |
| `reason` | `string` | Why the discount was given |
| `amount` | `number` | Discount amount |
| `percentage` | `optional(number)` | If percentage-based |
| `standardAmount` | `optional(number)` | Fee before discount |
| `status` | `string` | Draft / Pending / Approved / Rejected / Cancelled |
| `approvalRequestId` | `optional(id(approvalRequests))` | Approval workflow reference |
| `requestedBy` | `id(users)` | Who requested |
| `approvedBy` | `optional(id(users))` | Who approved |
| `approvedAt` | `optional(number)` | Approval timestamp |
| `remarks` | `optional(string)` | Approval notes |
| `createdAt` | `number` | Timestamp |

### Approval Levels

```
Amount <= ₹5,000  → Manager Approval
Amount <= ₹25,000 → Admin Approval
Amount <= ₹50,000 → Director Approval
Amount > ₹50,000  → Board Approval
```

### Discount Rules Matrix

| Discount Type | Stackable | Percentage Cap | Requires Proof |
|--------------|-----------|----------------|----------------|
| Early Bird | No | 10% | No (auto) |
| Sibling | Yes | 15% | Yes (sibling ID) |
| Referral | Yes | 5% | Yes (referral code) |
| Promotional | No | 25% | No (campaign) |
| Management | Yes | 50% | Yes (approval) |
| Custom | Yes | 100% | Yes (reason) |

### Design Rules

- Discounts require **two-level approval** (requested by ≠ approved by)
- Discount amount is **subtracted from net payable** before installments
- Approved discounts are **visible in the student fee timeline**
- Discounts can be **revoked** before payment — requires cancelling the approval

---

## 12. Waiver Engine

### Purpose

Waivers are **full or partial cancellation** of fee liability, typically for special circumstances. Waivers are more significant than discounts and require higher approval.

### Waiver Types

| Type | Description | Max Amount | Approval |
|------|-------------|------------|----------|
| **Full Waiver** | 100% fee waived | Total fee | Director |
| **Partial Waiver** | Percentage waived | 50% of total | Admin |
| **Emergency Waiver** | Medical/family emergency | 75% of total | Director |
| **Management Waiver** | Management decision | 100% of total | Board |
| **Adjustment** | Correction of billing error | As needed | Admin |

### Waiver Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `waiverType` | `string` | Full / Partial / Emergency / Management / Adjustment |
| `amount` | `number` | Amount waived |
| `percentage` | `optional(number)` | If percentage-based |
| `reason` | `string` | Detailed reason |
| `supportingDocument` | `optional(string)` | URL to supporting document |
| `status` | `string` | Draft / Pending / Approved / Rejected / Cancelled |
| `requestedBy` | `id(users)` | Who requested |
| `approvedBy` | `optional(id(users))` | Who approved |
| `approvedAt` | `optional(number)` | Approval timestamp |
| `remarks` | `optional(string)` | Approval notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Waiver Approval Flow

```
Waiver Request Submitted
         │
         ▼
Supporting Documents Uploaded
         │
         ▼
┌─────────────────────────────────────┐
│  Amount Check                        │
│                                      │
│  Amount <= ₹10,000 → Admin          │
│  Amount <= ₹50,000 → Director       │
│  Amount > ₹50,000  → Board          │
└─────────────────────────────────────┘
         │
         ▼
Approval Decision
         │
         ├── Approved → Applied to student fee plan
         │
         ├── Rejected → Counsellor + Student notified
         │
         └── Returned → More info requested
```

### Design Rules

- Waivers are **mutually exclusive with refunds** — waived amounts are not refundable
- Emergency waivers require **documentary proof** (medical certificate, etc.)
- Waivers are logged in the student financial timeline for audit
- Approved waivers trigger invoice recalculation

---

## 13. Refund Engine

### Purpose

Manage refund requests, approvals, and processing. Refunds are separate from payments — they represent money flowing back to the payer.

### Refund Triggers

| Trigger | Description | Refundable Amount |
|---------|-------------|-------------------|
| **Admission Cancellation** | Student never started | Full minus processing fee |
| **Course Withdrawal** | Student left mid-course | Pro-rata basis |
| **Duplicate Payment** | Paid twice | Full duplicate amount |
| **Excess Payment** | Paid more than due | Excess amount |
| **Scholarship Adjustment** | Scholarship applied after payment | Adjusted amount |

### Refund Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `invoiceId` | `id(invoices)` | Original invoice |
| `receiptId` | `id(receipts)` | Original receipt |
| `refundReason` | `string` | Reason for refund |
| `refundType` | `string` | Cancellation / Withdrawal / Duplicate / Excess / Adjustment |
| `originalAmount` | `number` | Amount originally paid |
| `refundAmount` | `number` | Amount to refund |
| `deductionAmount` | `number` | Processing fee/deduction |
| `refundMode` | `string` | Bank Transfer / UPI / Cash / Cheque |
| `refundReference` | `optional(string)` | Transaction reference |
| `status` | `string` | Requested / Approved / Processing / Completed / Rejected |
| `requestedBy` | `id(users)` | Who requested |
| `approvedBy` | `optional(id(users))` | Who approved |
| `processedBy` | `optional(id(users))` | Who processed |
| `processedAt` | `optional(number)` | Processing date |
| `completedAt` | `optional(number)` | Completion date |
| `remarks` | `optional(string)` | Notes |
| `createdAt` | `number` | Timestamp |

### Refund Lifecycle

```
Refund Requested
       │
       ▼
Documents Verified (original receipt, reason proof)
       │
       ▼
Approval (based on amount)
       │
       ├── Amount ≤ ₹10,000 → Manager
       ├── Amount ≤ ₹50,000 → Admin
       └── Amount > ₹50,000 → Director
       │
       ▼
Processed (finance team initiates transfer)
       │
       ▼
Completed (refund confirmed)
```

### Refund Processing Timeline

| Refund Amount | Processing Time | Approval Level |
|--------------|----------------|----------------|
| ≤ ₹5,000 | 3 business days | Auto-approved |
| ≤ ₹25,000 | 5 business days | Manager |
| ≤ ₹1,00,000 | 7 business days | Admin |
| > ₹1,00,000 | 10 business days | Director |

### Design Rules

- Refunds are **separate financial transactions** — not negative payments
- Processing fee/deduction is configurable per program
- Refund is sent to the **original payer** (based on payment mode)
- Completed refunds generate a **refund receipt**

---

## 14. Collections Center Integration

### Purpose

The Collections Center is the **action arm** of Finance. While Finance owns the money data, Collections owns the follow-up actions, reminders, and recovery process.

### Relationship Model

```
Finance (Owns Data)
  │
  ├── Invoice: ₹59,300 (Issued)
  ├── Payment: ₹10,660 (Partial)
  ├── Balance: ₹48,640 (Due)
  │
  ▼
Collections (Owns Actions)
  │
  ├── Day 1: Send reminder (Communication)
  ├── Day 7: Create follow-up task (Tasks)
  ├── Day 15: Counsellor call (Call Log)
  ├── Day 30: Escalation notice
  ├── Day 45: Legal notice
  └── Day 60: Handover to recovery agency
```

### Collections Center Dashboard (Existing)

The current system (`collectionEngine.ts`) already implements:

- **Payment Plans** — Full CRUD with auto-installment generation
- **Installments** — Status tracking (planned/due/paid/overdue/cancelled)
- **PDC Cheques** — Full lifecycle (scheduled/deposited/cleared/bounced)
- **Payment Commitments** — Counsellor-tracked promises with confidence levels
- **Overdue Automation** — Auto-marks overdue installments, sends notifications
- **Collection Summary** — Per-lead collection health snapshot
- **Organization Dashboard** — Org-wide collection metrics

### DOC-08 Extensions

| Feature | Status | Enhancement |
|---------|--------|-------------|
| Payment Plans | ✅ Existing | Add invoice linking |
| Installments | ✅ Existing | Add auto-invoice generation per installment |
| PDCs | ✅ Existing | Add invoice reconciliation |
| Commitments | ✅ Existing | Add auto-task on commitment expiry |
| Overdue Processing | ✅ Existing | Add escalation logic |
| Collection Dashboard | ✅ Existing | Add per-branch filtering |
| Invoice Linking | 🔶 New | Link installments → invoices |
| Refund Processing | 🔶 New | Full refund lifecycle |

### Collections Health Score

```
Student: Raj Patel
═══════════════════════════════════════════════════════
Collection Health: 🟢 Good (Score: 85/100)
───────────────────────────────────────────────────────
Factor                  │ Weight │ Score
───────────────────────────────────────────────────────
Payment History         │ 30%    │ 28/30 (2 on-time, 0 late)
Installment Compliance  │ 25%    │ 20/25 (1/3 paid)
PDC Reliability         │ 15%    │ 15/15 (no bounced)
Communication Response  │ 15%    │ 12/15 (responds to reminders)
Commitment Fulfillment  │ 15%    │ 10/15 (1 commitment kept)
───────────────────────────────────────────────────────
Flags: None
───────────────────────────────────────────────────────
``` 

### Design Rules

- Collections creates **tasks, calls, and communications** — never financial records
- Collection actions are **logged in the student timeline**
- Escalation is **automatic** based on days overdue
- Finance data is **read-only** from Collections perspective

---

## 15. Communication Integration

### Purpose

All fee-related communication uses the **Family Contacts architecture** from DOC-05. No phone numbers or email addresses are stored in Finance records.

### Fee Communication Templates

| Event | Template | Channel | Recipient Role |
|-------|----------|---------|----------------|
| Invoice Issued | `invoice_issued` | WhatsApp | Primary Fee Contact |
| Payment Due (T-7) | `payment_reminder_7d` | WhatsApp | Primary Fee Contact |
| Payment Due (T-3) | `payment_reminder_3d` | WhatsApp | Primary Fee Contact |
| Payment Due (T-1) | `payment_reminder_1d` | WhatsApp/SMS | Primary Fee Contact |
| Payment Overdue | `payment_overdue` | WhatsApp | Fee Contact + Decision Maker |
| Payment Overdue (30d) | `payment_escalation` | WhatsApp/SMS | All Contacts |
| Payment Received | `payment_receipt` | WhatsApp | Primary Fee Contact |
| Installment Paid | `installment_confirmed` | WhatsApp | Primary Fee Contact |
| Receipt Available | `receipt_ready` | WhatsApp/Email | Primary Fee Contact |
| Refund Initiated | `refund_initiated` | WhatsApp | Primary Fee Contact |
| Refund Completed | `refund_completed` | WhatsApp | Primary Fee Contact |
| Cheque Bounced | `cheque_bounced` | WhatsApp/SMS | Primary Fee Contact |
| Scholarship Approved | `scholarship_approved` | WhatsApp | Primary Decision Maker |
| Discount Approved | `discount_approved` | WhatsApp | Primary Decision Maker |
| Fee Plan Changed | `fee_plan_changed` | WhatsApp | Primary Fee Contact |
| Payment Link Sent | `payment_link` | WhatsApp | Primary Fee Contact |

### Example: Payment Due Reminder

```
To: +91-9876543210
Contact: Sunita Patel (Mother)
Role: ⭐ Primary Fee Contact
Template: payment_reminder_3d

"Dear Sunita Patel,

This is a reminder that Raj Patel's
Installment #3 of ₹10,660 is due in 3 days
(Due Date: 01-Oct-2026).

Pay now: [Payment Link]

Outstanding Balance: ₹31,980

Thank you,
EEOS Institute"
```

### Example: Payment Receipt

```
To: +91-9876543210
Contact: Sunita Patel (Mother)
Role: ⭐ Primary Fee Contact
Template: payment_receipt

"Dear Sunita Patel,

Payment received successfully!

Student: Raj Patel
Amount: ₹10,660
Mode: UPI
Date: 05-Aug-2026
Receipt No: EEOS-RCP-2026-0042

Download receipt: [Receipt PDF]

Thank you,
EEOS Institute"
```

### Communication Rules

1. All fee communication references `familyContactId` — never stores numbers
2. Payment links are **secure, time-limited tokens** generated per invoice
3. Communication history is logged in the **student timeline**
4. Opt-out is respected per contact per channel
5. Overdue/escalation messages override opt-out preferences

---

## 16. Revenue Tracking

### Purpose

Track and attribute revenue across multiple dimensions for business intelligence and reporting.

### Revenue Dimensions

| Dimension | Granularity | Purpose |
|-----------|-------------|---------|
| **Branch** | Per branch | Branch-level P&L |
| **Program** | Per program | Program profitability |
| **Session** | Per session | Year-over-year comparison |
| **Counsellor** | Per counsellor | Individual performance |
| **Campaign** | Per campaign | Marketing ROI |
| **Lead Source** | Per source | Channel effectiveness |
| **Batch** | Per batch | Batch-level revenue |
| **Faculty** | Per faculty | Faculty value attribution |
| **Payment Mode** | Per mode | Payment preference trends |

### Revenue Attribution Model

```
Revenue Attribution
═══════════════════════════════════════════════════════

Lead Source (First Touch): Facebook Ads → 30%
Campaign (Last Touch): Summer Campaign → 40%
Counsellor (Touch): Rajesh Mehta → 30%

Total Attributable Revenue: ₹59,300
───────────────────────────────────────────────────────
Branch: Andheri              ₹59,300  (100%)
Program: JEE Foundation      ₹59,300  (100%)
Session: 2026-27             ₹59,300  (100%)
Batch: Morning A             ₹59,300  (100%)
Payment Mode: UPI            ₹10,660  (18%)
───────────────────────────────────────────────────────
```

### Revenue Tracking Tables

#### Revenue by Branch

```
┌──────────────┬──────────┬──────────┬──────────┬──────────┐
│ Branch       │ Revenue  │ Collected│ Pending  │ Growth   │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Andheri      │ ₹12.5L   │ ₹8.2L    │ ₹4.3L    │ 📈 +15%  │
│ Borivali     │ ₹8.3L    │ ₹5.1L    │ ₹3.2L    │ 📈 +22%  │
│ Vashi        │ ₹4.1L    │ ₹2.8L    │ ₹1.3L    │ 📊 Same  │
│ Online       │ ₹6.7L    │ ₹5.9L    │ ₹0.8L    │ 📈 +45%  │
└──────────────┴──────────┴──────────┴──────────┴──────────┘
```

#### Revenue by Program

```
┌──────────────────┬──────────┬──────────┬──────────┬──────┐
│ Program          │ Students │ Revenue  │ Avg/Stdnt│ Trend│
├──────────────────┼──────────┼──────────┼──────────┼──────┤
│ JEE Foundation   │ 42       │ ₹22.4L   │ ₹53,300  │ 📈   │
│ NEET Foundation  │ 38       │ ₹20.5L   │ ₹54,000  │ 📈   │
│ CBSE 9           │ 25       │ ₹7.0L    │ ₹28,000  │ 📊   │
│ CBSE 10          │ 22       │ ₹6.6L    │ ₹30,000  │ 📊   │
│ Digital Mktg     │ 15       │ ₹4.5L    │ ₹30,000  │ 📈   │
└──────────────────┴──────────┴──────────┴──────────┴──────┘
```

### Design Rules

- Revenue attribution uses **weighted multi-touch model**
- Lead source attribution is captured at lead creation (DOC-05)
- Branch and program attribution from admission record
- Counsellor attribution from lead owner
- Revenue data is **real-time** — no batch processing

---

## 17. Financial Reports

### Report Types

| Report | Purpose | Frequency | Audience |
|--------|---------|-----------|----------|
| **Outstanding Report** | All unpaid invoices | Daily | Collections |
| **Collection Report** | Payments collected | Daily | Finance |
| **Revenue Report** | Revenue by dimension | Weekly | Management |
| **Scholarship Report** | Scholarships awarded | Monthly | Admin |
| **Discount Report** | Discounts approved | Monthly | Admin |
| **Refund Report** | Refunds processed | Monthly | Finance |
| **Waiver Report** | Waivers approved | Monthly | Admin |
| **Cash Flow Report** | Money in/out | Weekly | Management |
| **Branch P&L** | Branch profitability | Monthly | Directors |
| **Aged Receivables** | Overdue by age | Weekly | Collections |

### Outstanding Report

```
OUTSTANDING REPORT — EEOS Institute
Date: 15-Oct-2026
═══════════════════════════════════════════════════════
Total Outstanding: ₹4,85,000
Total Students: 127
───────────────────────────────────────────────────────

AGE ANALYSIS:
  0-30 days:     ₹2,10,000  (43%) — 52 students
  31-60 days:    ₹1,55,000  (32%) — 28 students
  61-90 days:    ₹85,000    (18%) — 12 students
  90+ days:      ₹35,000    (7%)  — 5 students

TOP DEFAULTEURS:
Student          │ Amount   │ Days │ Last Payment
───────────────────────────────────────────────────────
Vikram Joshi     │ ₹45,000  │ 65d  │ 12-Aug-2026
Amit Singh       │ ₹38,000  │ 42d  │ 05-Sep-2026
Priya Sharma     │ ₹25,000  │ 28d  │ 18-Sep-2026

COLLECTION EFFICIENCY: 72%
───────────────────────────────────────────────────────
```

### Cash Flow Report

```
CASH FLOW REPORT — October 2026
═══════════════════════════════════════════════════════
INFLOWS
  Collections     │ ₹3,85,000
  Online Payments │ ₹2,10,000
  Cash            │ ₹1,20,000
  Bank Transfer   │ ₹55,000
  ────────────────┼─────────
  Total Inflow    │ ₹7,70,000

OUTFLOWS
  Refunds         │ ₹25,000
  Scholarship Adj.│ ₹12,000
  Bank Charges    │ ₹3,500
  ────────────────┼─────────
  Total Outflow   │ ₹40,500

NET CASH FLOW     │ ₹7,29,500
───────────────────────────────────────────────────────
```

### Design Rules

- All reports are **real-time** — data is queried live, not from snapshots
- Reports support **CSV and PDF export**
- Date range filters available for all reports
- Reports can be **scheduled** for automated email delivery

---

## 18. Finance Dashboard

### Purpose

A real-time dashboard for finance teams and management to monitor financial health.

### Dashboard KPIs

```
┌──────────────────────────────────────────────────────────┐
│  FINANCE DASHBOARD                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 💰 Collected  │  │ 📋 Outstanding│  │ ⚠️ Overdue   │   │
│  │   Today       │  │              │  │               │   │
│  │   ₹1,25,000   │  │   ₹4,85,000  │  │   ₹2,75,000   │   │
│  │   📈 +12%     │  │   📊 -5%     │  │   📈 +8%      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 📊 Monthly   │  │ 📈 Projected │  │ 🔄 Collection│   │
│  │   Revenue    │  │   Revenue    │  │   Efficiency  │   │
│  │   ₹18.5L     │  │   ₹22.3L    │  │   72%         │   │
│  │   📈 +22%    │  │   On Track  │  │   📊 -3%      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 🏆 Scholarship│  │ 💸 Refunds   │  │ 📉 Bounce  │   │
│  │   Granted    │  │   Processed  │  │   Rate       │   │
│  │   ₹45,000    │  │   ₹25,000   │  │   3.2%       │   │
│  │   📊 Same    │  │   📈 +50%   │  │   📉 -1%     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  REVENUE TREND (Last 30 days)                     │    │
│  │                                                   │    │
│  │  Collected  ████████████████░░░░░░  72%           │    │
│  │  Outstanding ██████░░░░░░░░░░░░░░░░  28%          │    │
│  │                                                   │    │
│  │  ┌──┐                                             │    │
│  │  │  │ ┌──┐     ┌──┐      ┌──┐                     │    │
│  │  │  │ │  │ ┌──┐│  │  ┌──┐│  │ ┌──┐               │    │
│  │  └──┴─┴──┴─┴──┴┴──┴──┴──┴┴──┴─┴──┘               │    │
│  │  Sep 28  Oct 5  Oct 12  Oct 19  Oct 26             │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  TOP COLLECTION OFFICERS                          │    │
│  │                                                   │    │
│  │  🥇 Rajesh Mehta      ₹85,000    98% efficiency   │    │
│  │  🥈 Sunita Sharma     ₹72,000    92% efficiency   │    │
│  │  🥉 Amit Joshi        ₹58,000    88% efficiency   │    │
│  │   4. Priya Verma      ₹45,000    85% efficiency   │    │
│  │   5. Vikram Singh     ₹38,000    82% efficiency   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Dashboard Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| **Collection Drop** | Daily collection < 70% of daily target | Notify finance head |
| **Overdue Spike** | Overdue increases by 20% in a week | Escalation meeting |
| **Bounce Warning** | Bounce rate > 5% in a month | Review PDC policy |
| **Refund Surge** | Refunds > 10% of collections | Investigate cancellations |
| **Scholarship Overrun** | Scholarships exceed budget | Committee review |

---

## 19. AI Opportunities

### 1. Fee Default Prediction

```
Student: Vikram Joshi — NEET Foundation

AI Default Risk Score: 68% (High)

Risk Factors:
  ❌ Payment history: 2 late payments in last 6 months
  ❌ Family income bracket: ₹3-4L/year (from admission)
  ❌ No scholarship applied
  ❌ Primary fee contact not responsive to reminders
  ⚠️ Outstanding balance: ₹45,000 (65 days overdue)

Prediction: 72% probability of 30+ day default on next installment

Recommendation:
  ➤ Offer restructuring of payment plan
  ➤ Assign dedicated collection officer
  ➤ Consider partial waiver for immediate payment
```

### 2. Collection Priority Score

```
Leads Ranked by Collection Priority:

  🥇 Vikram Joshi    Score: 92  — Overdue ₹45,000 / 65 days
  🥈 Amit Singh      Score: 78  — Overdue ₹38,000 / 42 days
  🥉 Priya Sharma    Score: 65  — Overdue ₹25,000 / 28 days

Priority Score Formula:
  Overdue Amount (40%) + Days Overdue (30%) +
  Past Payment Behavior (20%) + Response Rate (10%)
```

### 3. Scholarship Recommendation

```
Student: Priya Sharma — NEET Foundation
Academic: 92% in Class 10
Family Income: ₹3.5L/year

AI Suggests:
  🏆 Merit Scholarship — 25% fee waiver
      → Score qualifies (85%+ threshold)
      → Recommended: Yes

  🏆 Need-based Scholarship — 30% fee waiver
      → Income qualifies (< ₹5L threshold)
      → Recommended: Yes

  Combined: Up to 55% fee reduction
  Total Savings: ₹32,500/year
```

### 4. Payment Pattern Analysis

```
Student: Raj Patel — JEE Foundation

AI Payment Pattern Analysis:
  Preferred mode: UPI (80% of payments)
  Preferred time: 1st-5th of month (early payer)
  Response to reminders: Immediate (within 2 hours)

Assessment: Low-touch collection — auto-reminders sufficient

Student: Amit Singh — NEET Foundation

AI Payment Pattern:
  Preferred mode: Cash (60%), Cheque (40%)
  Preferred time: 15th-20th (late payer)
  Response to reminders: 3-5 days delay

Assessment: High-touch collection — personal follow-up needed
```

### 5. Revenue Forecasting

```
AI Revenue Forecast — Next 90 Days
═══════════════════════════════════════════════════════

Expected Collections:
  ┌─────────────────────┬──────────┬──────────┐
  │ Period              │ Forecast  │ Confidence│
  ├─────────────────────┼──────────┼──────────┤
  │ This Month          │ ₹18.5L   │ High (92%)│
  │ Next Month          │ ₹16.2L   │ Med (78%) │
  │ Next Quarter        │ ₹45L     │ Low (55%) │
  └─────────────────────┴──────────┴──────────┘

Expected Delinquency:
  5-8% of outstanding may become unrecoverable
  → Recommended: Increase collection activity for 90+ day accounts
```

### 6. Cash Flow Forecasting

```
AI Cash Flow Forecast — November 2026

Expected Inflow: ₹16.2L
  ─ Installments due: ₹12.5L (78% probability)
  ─ New admissions: ₹3.7L (85% probability)

Expected Outflow: ₹1.2L
  ─ Refunds: ₹35,000
  ─ Scholarship adjustments: ₹18,000
  ─ Bank charges: ₹4,000
  ─ Operational expenses: ₹63,000

Net Forecast: ₹15.0L
Recommendation: Sufficient liquidity — no action needed
```

### 7. Refund Risk Detection

```
Refund Request: Raj Patel — JEE Foundation
Reason: Course withdrawal (15 days into program)

AI Analysis:
  ⚠️ Previous behaviour: Excellent payment history
  ⚠️ Academic engagement: High attendance (92%)
  ⚠️ Communication: No prior complaints

Assessment: 🟢 Low fraud risk
  → Auto-approve within policy limits
  → Recommend counselling session before processing
```

---

## 20. Parent Portal View

### Fee Section in Parent Portal

```
💰 Fees — Raj Patel
═══════════════════════════════════════════════════════
Total Fee: ₹59,300
Paid: ₹21,320 (36%)
Balance: ₹37,980
Status: ⏳ Partial

Next Due:
  Installment #3 — ₹10,660
  Due Date: 01-Nov-2026
  Pay Now: [Payment Link]

───────────────────────────────────────────────────────
INVOICES
Invoice No       │ Amount │ Paid  │ Status
───────────────────────────────────────────────────────
INV-2026-0042    │ ₹59,300│₹21,320│ ⏳ Partially Paid
───────────────────────────────────────────────────────

RECEIPTS
Receipt No       │ Amount │ Mode  │ Date
───────────────────────────────────────────────────────
RCP-2026-0042    │ ₹10,660│ UPI   │ 05-Aug-2026  [PDF]
RCP-2026-0043    │ ₹10,660│ Cash  │ 01-Sep-2026  [PDF]
───────────────────────────────────────────────────────

PAYMENT HISTORY
Date       │ Amount │ Mode   │ Status
───────────────────────────────────────────────────────
05-Aug-26  │ ₹10,660│ UPI    │ ✅ Verified
01-Sep-26  │ ₹10,660│ Cash   │ ✅ Verified
───────────────────────────────────────────────────────

UPCOMING
Date       │ Amount │ Description
───────────────────────────────────────────────────────
01-Nov-26  │ ₹10,660│ Installment #3
01-Dec-26  │ ₹10,660│ Installment #4
01-Jan-27  │ ₹16,660│ Installment #5 (Final)
───────────────────────────────────────────────────────

DOWNLOADS
  📄 Fee Structure
  📄 All Invoices
  📄 All Receipts
  📄 Payment History (CSV)
───────────────────────────────────────────────────────
```

### Parent Portal Actions

| Action | Description |
|--------|-------------|
| **Pay Now** | Pay via integrated payment gateway |
| **Download Invoice** | Download individual invoice PDF |
| **Download Receipt** | Download individual receipt PDF |
| **View Statement** | Full account statement (date range filtered) |
| **Set Auto-Pay** | Enable auto-payment for recurring installments |
| **Update Contact** | Update fee contact preferences |
| **Apply for Scholarship** | Submit scholarship application |
| **Request Refund** | Initiate refund request (if eligible) |

---

## 21. Student App View

### Fee Section in Student App

```
💰 My Fees

  Total Fee:     ₹59,300
  Paid:          ₹21,320
  Outstanding:   ₹37,980

  [Pay Now]  [View Details]

───────────────────────────────────────
Installments

  #1  Aug  ₹10,660  ✅ Paid
  #2  Sep  ₹10,660  ✅ Paid
  #3  Nov  ₹10,660  ⏳ Due (01-Nov)
  #4  Dec  ₹10,660  🔮 Planned
  #5  Jan  ₹16,660  🔮 Planned

───────────────────────────────────────
Recent Receipts

  ₹10,660 via UPI — 05-Aug-2026 [PDF]
  ₹10,660 via Cash — 01-Sep-2026 [PDF]

───────────────────────────────────────
Notifications

  ⏰ Installment #3 due in 15 days
  ✅ Fee receipt generated for Sep payment
```

### Student App Actions

| Action | Description |
|--------|-------------|
| **Pay Now** | Quick payment via UPI/Card |
| **View Receipt** | Download receipt PDF |
| **Payment History** | Filtered by date |
| **Upcoming Dues** | Calendar view of due dates |
| **Payment Link** | Share payment link with parents |
| **Notifications** | Fee reminders and alerts |

---

## 22. Implementation Roadmap

### Phase 1 — Fee Structure Master (P0)

**Estimated effort:** 3-4 days  
**Dependencies:** Academic Programs, Academic Sessions, Org Branches

**Tasks:**
- [ ] Create `feeStructures` table in schema
- [ ] Create `feeComponents` table in schema
- [ ] Create `feeStructureComponents` junction table
- [ ] Fee structure CRUD (convex/feeStructures.ts)
- [ ] Seed default fee components
- [ ] Fee structure management UI (Master Data — Finance)
- [ ] Clone fee structure functionality

### Phase 2 — Invoice Engine (P0)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, Student Master (DOC-07 Phase 1)

**Tasks:**
- [ ] Create `invoices` table in schema
- [ ] Invoice number auto-generation (EEOS-INV-YYYY-XXXX)
- [ ] Invoice CRUD (convex/invoices.ts)
- [ ] Invoice generation from fee plan
- [ ] Invoice status lifecycle
- [ ] Invoice PDF generation
- [ ] Invoice listing page with filters

### Phase 3 — Receipt Engine (P0)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 2

**Tasks:**
- [ ] Create `receipts` table in schema
- [ ] Receipt number auto-generation (EEOS-RCP-YYYY-XXXX)
- [ ] Receipt CRUD (convex/receipts.ts)
- [ ] Receipt generation on payment verification
- [ ] Receipt PDF generation
- [ ] Partial payment handling (multiple receipts per invoice)

### Phase 4 — Student Fee Plan (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Student Master

**Tasks:**
- [ ] Create `studentFeePlans` table in schema
- [ ] Fee plan assignment from structure
- [ ] Optional component toggling
- [ ] Discount/scholarship/waiver integration

### Phase 5 — Installment Engine (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 4

**Tasks:**
- [ ] Extend `payment_installments` with invoice linking
- [ ] Auto-invoice generation per installment
- [ ] Installment status automation (planned → due → overdue)
- [ ] Grace period configuration
- [ ] Reminder scheduling

### Phase 6 — Scholarship Engine (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `scholarships` table in schema
- [ ] Scholarship CRUD (convex/scholarships.ts)
- [ ] Approval workflow integration
- [ ] Document submission for verification
- [ ] Scholarship application in parent portal

### Phase 7 — Discount & Waiver Engine (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 4

**Tasks:**
- [ ] Extend existing `leadDiscounts` for student fee plans
- [ ] Waiver table and workflow
- [ ] Approval level matrix
- [ ] Reapply discount/waiver to fee plan

### Phase 8 — Refund Engine (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 2, Phase 3

**Tasks:**
- [ ] Create `refunds` table in schema
- [ ] Refund request workflow
- [ ] Approval process
- [ ] Refund processing (integration with payment gateway)
- [ ] Refund receipt generation

### Phase 9 — PDC Enhancement (P2)

**Estimated effort:** 2-3 days  
**Dependencies:** Existing collectionEngine

**Tasks:**
- [ ] Link PDCs to invoices
- [ ] Auto-create payment on PDC clearance
- [ ] Enhanced PDC dashboard

### Phase 10 — Collections Integration (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 2, Phase 5

**Tasks:**
- [ ] Link collections dashboard with invoice data
- [ ] Escalation workflow (auto-tasks per overdue bracket)
- [ ] Collection health scoring
- [ ] Collection officer assignment

### Phase 11 — Communication Integration (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 2, Phase 5, Lead V2 Phase 4

**Tasks:**
- [ ] Fee communication templates
- [ ] Auto-trigger on invoice/installment events
- [ ] Payment link generation
- [ ] Receipt delivery

### Phase 12 — Financial Reports (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Outstanding report
- [ ] Collection report
- [ ] Revenue report
- [ ] Cash flow report
- [ ] Aged receivables
- [ ] CSV/PDF export
- [ ] Scheduled email delivery

### Phase 13 — Finance Dashboard (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] KPI cards (collected, outstanding, overdue)
- [ ] Revenue trend graph
- [ ] Collection officer leaderboard
- [ ] Dashboard alerts
- [ ] Role-based views (Finance vs Management)

### Phase 14 — AI Features (P3)

**Estimated effort:** 10-12 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Fee default prediction
- [ ] Collection priority scoring
- [ ] Scholarship recommendation
- [ ] Payment pattern analysis
- [ ] Revenue forecasting
- [ ] Refund risk detection

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Fee Structure Master | P0 | 4d | Low | Critical |
| 2. Invoice Engine | P0 | 5d | Medium | Critical |
| 3. Receipt Engine | P0 | 4d | Medium | Critical |
| 4. Student Fee Plan | P1 | 4d | Low | High |
| 5. Installment Engine | P1 | 4d | Medium | High |
| 6. Scholarship Engine | P1 | 4d | Medium | High |
| 7. Discount & Waiver | P1 | 4d | Low | High |
| 8. Refund Engine | P2 | 5d | Medium | Medium |
| 9. PDC Enhancement | P2 | 3d | Low | Medium |
| 10. Collections Integration | P2 | 4d | Medium | High |
| 11. Communication Integration | P2 | 4d | Low | High |
| 12. Financial Reports | P2 | 5d | Medium | High |
| 13. Finance Dashboard | P2 | 5d | Medium | High |
| 14. AI Features | P3 | 12d | High | High |

---

## 23. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║              FINANCE & FEE ENGINE GOLDEN RULES                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Finance owns ALL money data.                             ║
║      └── No other module creates, modifies, or stores        ║
║      financial records.                                      ║
║                                                              ║
║  2.  Admission NEVER stores payments.                         ║
║      └── Admission Engine only checks payment status.         ║
║                                                              ║
║  3.  Student NEVER stores fee data.                           ║
║      └── Student only displays fee status via queries.        ║
║                                                              ║
║  4.  Collections owns follow-up, not money.                   ║
║      └── Collections creates actions, tasks, calls —          ║
║      never financial records.                                 ║
║                                                              ║
║  5.  Communication owns delivery, not data.                   ║
║      └── All fee communication uses Family Contacts.          ║
║                                                              ║
║  6.  Invoices generate receipts.                              ║
║      └── Receipts never modify invoices — they are            ║
║      additive records.                                       ║
║                                                              ║
║  7.  Receipts are immutable.                                  ║
║      └── Corrections require reversal + new receipt.          ║
║                                                              ║
║  8.  Discounts and waivers require approval.                  ║
║      └── No financial adjustment without audit trail.         ║
║                                                              ║
║  9.  Scholarships stack with discounts.                       ║
║      └── Both can apply, but total cannot exceed 100%.        ║
║                                                              ║
║ 10.  Refunds are separate from payments.                      ║
║      └── A refund is a distinct transaction, not negative     ║
║      payment.                                                ║
║                                                              ║
║ 11.  Everything linked through IDs.                           ║
║      └── studentId, invoiceId, receiptId — no data            ║
║      duplication.                                            ║
║                                                              ║
║ 12.  Only one source of truth for financial reporting.        ║
║      └── All reports query Finance tables — no cached         ║
║      or duplicated data.                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Module |
|--------|-----------|--------|-------|--------|
| Fee Structure | `feeStructures` | 🔶 New | Phase 1 | Finance |
| Fee Component | `feeComponents` | 🔶 New | Phase 1 | Finance |
| Fee Structure Component | `feeStructureComponents` | 🔶 New | Phase 1 | Finance |
| Student Fee Plan | `studentFeePlans` | 🔶 New | Phase 4 | Finance |
| Student Fee Plan Component | `studentFeePlanComponents` | 🔶 New | Phase 4 | Finance |
| Invoice | `invoices` | 🔶 New | Phase 2 | Finance |
| Receipt | `receipts` | 🔶 New | Phase 3 | Finance |
| Payment (Lead) | `leadPayments` | ✅ Existing | N/A | CRM/Finance |
| Payment Plan | `payment_plans` | ✅ Existing | N/A | Collection |
| Installment | `payment_installments` | ✅ Existing | Phase 5 | Collection/Finance |
| PDC Cheque | `payment_pdcs` | ✅ Existing | Phase 9 | Collection |
| Payment Commitment | `payment_commitments` | ✅ Existing | N/A | Collection |
| Discount | `leadDiscounts` | ✅ Existing | Phase 7 | CRM/Finance |
| Scholarship | `scholarships` | 🔶 New | Phase 6 | Finance |
| Waiver | `waivers` | 🔶 New | Phase 7 | Finance |
| Refund | `refunds` | 🔶 New | Phase 8 | Finance |

## Appendix B: Financial Data Flow

```
Fee Structure (Template)
       │
       ▼
Student Fee Plan (Snapshot)
       │
       ├── Discount Applied (with approval)
       ├── Scholarship Applied (with approval)
       ├── Waiver Applied (with approval)
       │
       ▼
Net Payable Calculated
       │
       ▼
Installments Generated (with due dates)
       │
       ▼
Invoice Issued (per installment or lump sum)
       │
       ▼
Payment Received
       │
       ├── Auto-Verified (UPI/Card/Online)
       └── Manual-Verified (Cash/Cheque/Bank Transfer)
       │
       ▼
Receipt Generated
       │
       ├── Invoice Balance Updated
       ├── Student Fee Plan Updated
       └── Timeline Updated
       │
       ▼
       [If overdue → Collection Action → Communication]
       │
       ▼
       [If refund → Refund Request → Approval → Processing]
```

## Appendix C: Integration Points

| Integration | Direction | Data |
|-------------|-----------|------|
| **Admission → Finance** | Write: invoice requested, Read: payment status | Lead ID, Program, Branch |
| **Student → Finance** | Read: fee display only | Student ID |
| **Collections → Finance** | Read: invoice/payment data, Write: collection actions | Lead ID |
| **Communication → Finance** | Read: invoice/payment data for templates | Invoice details |
| **Parent Portal → Finance** | Read: fee data, Write: payment initiation | Student ID |
| **Student App → Finance** | Read: fee summary, Write: payment initiation | Student ID |

---

*End of DOC-08 — Finance & Fee Engine Bible*
