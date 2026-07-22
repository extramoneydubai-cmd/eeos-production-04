# DOC-06 — Admission & Enrollment Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** CRM → Admissions → Student  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2 Architecture Bible

---

## Table of Contents

1. [Admission Philosophy](#1-admission-philosophy)
2. [Admission Lifecycle](#2-admission-lifecycle)
3. [Admission Entity](#3-admission-entity)
4. [Admission Checklist](#4-admission-checklist)
5. [Seat Reservation](#5-seat-reservation)
6. [Fee Confirmation](#6-fee-confirmation)
7. [Document Verification](#7-document-verification)
8. [Student Creation](#8-student-creation)
9. [Enrollment](#9-enrollment)
10. [Batch Allocation](#10-batch-allocation)
11. [Parent Portal Activation](#11-parent-portal-activation)
12. [Communication](#12-communication)
13. [AI Opportunities](#13-ai-opportunities)
14. [Edge Cases](#14-edge-cases)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Golden Rules](#16-golden-rules)

---

## 1. Admission Philosophy

### Purpose

The Admission Engine is the bridge between **CRM (Lead Management)** and **Student Management**. It is the orchestration layer that transforms a qualified lead into an enrolled student through a structured, trackable, and auditable process.

### Core Distinctions

| Term | Definition | Responsible Module |
|------|-----------|-------------------|
| **Lead** | A potential customer who has shown interest | CRM (Lead Master) |
| **Admission** | The **process** of converting a lead into a student | Admission Engine |
| **Student** | An enrolled individual with academic records | Student Management |
| **Enrollment** | The act of **assigning** a student to a specific batch, program, and timetable | Academics (Scheduling) |

### Business Rules

1. **Every admission starts from a lead.** No admission exists without a source lead.
2. **One lead produces one admission.** A single lead cannot create multiple admissions.
3. **One admission produces one student.** Bulk admissions create multiple lead → admission → student chains.
4. **Admission does NOT own payments.** Finance owns all payment records. Admission only checks payment status.
5. **Admission does NOT own academic data.** Academics owns batches, timetables, attendance. Admission creates the _link_.
6. **Family data is NEVER duplicated.** The Family entity from Lead V2 is reused as-is.
7. **Contact data is NEVER duplicated.** FamilyContacts from Lead V2 is reused as-is.
8. **Admission can be cancelled.** Cancellation ≠ Student deletion. The student record remains for historical purposes with an `inactive` status.
9. **Admission is audit-logged.** Every status change, document verification, and payment check is recorded in the unified timeline.

### The Golden Flow

```
Lead (Qualified)
  │
  ▼
Admission Form Started
  │
  ├── Document Upload
  ├── Document Verification
  ├── Fee Discussion / Discount Approval
  │
  ▼
Seat Reserved (if applicable)
  │
  ▼
Payment Confirmed
  │
  ▼
Admission Approved
  │
  ▼
Student Created
  │
  ├── Batch Allocated
  ├── Parent Portal Activated
  ├── Welcome Communication Sent
  │
  ▼
Enrollment Complete → Classes Begin
```

---

## 2. Admission Lifecycle

The admission lifecycle is a series of stages a lead passes through from qualification to full enrollment. Each stage has clear entry criteria, owner, and exit criteria.

### Stage Map

```
                    ┌──────────────────┐
                    │    Inquiry       │
                    │  (Lead Created)  │
                    └────────┬─────────┘
                             │ Qualified
                             ▼
                    ┌──────────────────┐
                    │  Qualified Lead  │
                    │ (Stage = Hot)    │
                    └────────┬─────────┘
                             │ Counselling Started
                             ▼
                    ┌──────────────────┐
                    │   Counselling    │
                    │ (Profile Filled) │
                    └────────┬─────────┘
                             │ Demo Attended
                             ▼
                    ┌──────────────────┐
                    │  Demo Complete   │
                    │ (Interested)     │
                    └────────┬─────────┘
                             │ Fee Discussion
                             ▼
                    ┌──────────────────┐
                    │  Fee Discussion  │
                    │ (Budget OK)      │
                    └────────┬─────────┘
                             │ Documents Collected
                             ▼
                    ┌──────────────────┐
                    │ Admission Form   │
                    │ (Form Submitted) │
                    └────────┬─────────┘
                             │ Verification
                             ▼
                    ┌──────────────────┐
                    │    Document      │
                    │   Verification   │
                    └────────┬─────────┘
                             │ Approved
                             ▼
                    ┌──────────────────┐
                    │  Seat Reserved   │
                    │ (If applicable)  │
                    └────────┬─────────┘
                             │ Payment
                             ▼
                    ┌──────────────────┐
                    │   Payment Done   │
                    │ (Invoice Paid)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Admission       │
                    │  Approved        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Student        │
                    │   Created        │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │   Batch    │ │  Parent    │ │  Welcome   │
      │ Allocation │ │  Portal    │ │  Kit       │
      └────────────┘ └────────────┘ └────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │   Orientation    │
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │  Classes Begin   │
                    └──────────────────┘
```

### Stage Detail

#### 1. Inquiry
- **Entry:** Lead is created from any marketing source
- **Owner:** Marketing / Auto
- **Data:** Minimal (name, phone, source, program interest)
- **Exit criteria:** Counsellor assigned or lead manually qualified
- **Timeline event:** `lead_created`

#### 2. Qualified Lead
- **Entry:** Counsellor reviews inquiry and marks as qualified
- **Owner:** Counsellor / Sales
- **Data:** Lead profile partially filled, stage moved to hot/warm
- **Exit criteria:** Counselling session scheduled or in progress
- **Timeline event:** `stage_changed` → Qualified

#### 3. Counselling
- **Entry:** Counsellor begins active conversation
- **Owner:** Counsellor
- **Data:** Lead profile progressively filled, family info collected, course interest confirmed
- **Exit criteria:** Demo class attended or program decision made
- **Timeline events:** `call_made`, `note_added`, `whatsapp_sent`, `meeting_scheduled`

#### 4. Demo Complete
- **Entry:** Student/parent attends demo class or trial session
- **Owner:** Counsellor + Faculty
- **Data:** Demo feedback, attendance record
- **Exit criteria:** Positive interest confirmed
- **Timeline event:** `demo_conducted`

#### 5. Fee Discussion
- **Entry:** Demo complete, lead is interested
- **Owner:** Counsellor
- **Data:** Fee structure shared, discount discussed, payment plan offered
- **Exit criteria:** Budget agreed, discounts approved (if applicable)
- **Timeline events:** `fee_discussed`, `discount_applied`

#### 6. Admission Form
- **Entry:** Fee discussion complete, lead ready to proceed
- **Owner:** Counsellor → Parent (via Dynamic Form) or Admin
- **Data:** Full admission form submitted (personal, academic, family, documents)
- **Exit criteria:** Form submitted, all required fields filled
- **Timeline event:** `admission_started`

#### 7. Document Verification
- **Entry:** Documents uploaded by parent or collected by counsellor
- **Owner:** Verifier / Admin
- **Data:** Document status, verification notes
- **Exit criteria:** All required documents verified (or exceptions approved)
- **Timeline event:** `document_verified` / `document_rejected`

#### 8. Seat Reservation (optional)
- **Entry:** Documents verified, payment not yet complete
- **Owner:** Admin / Accounts
- **Data:** Seat number, expiry date, reservation fee
- **Exit criteria:** Full payment received or reservation expired
- **Timeline event:** `seat_reserved` / `seat_expired`

#### 9. Payment Done
- **Entry:** Invoice generated
- **Owner:** Accounts / Finance
- **Data:** Invoice, receipt, payment status
- **Exit criteria:** Payment verified
- **Timeline event:** `payment_received`

#### 10. Admission Approved
- **Entry:** All checks passed (docs ✅, payment ✅, seat ✅)
- **Owner:** System (auto-approval) / Admin (manual review)
- **Data:** Admission status → `approved`
- **Exit criteria:** Student record exists
- **Timeline event:** `converted`

#### 11. Student Created
- **Entry:** Admission approved
- **Owner:** System
- **Data:** Student record auto-generated from lead profile + admission form
- **Exit criteria:** Student record active
- **Timeline event:** `student_created`

#### 12. Batch Allocation
- **Entry:** Student created, program selected
- **Owner:** Academic Coordinator
- **Data:** Batch assignment, faculty assignment, timetable link
- **Exit criteria:** Student assigned to active batch
- **Timeline event:** `batch_allocated`

#### 13. Parent Portal Activation
- **Entry:** Student created, family contacts with role flags exist
- **Owner:** System
- **Data:** Portal credentials sent to primary contacts
- **Exit criteria:** Portal access confirmed
- **Timeline event:** `portal_activated`

#### 14. Welcome Kit & Orientation
- **Entry:** Batch allocated
- **Owner:** Admin / Marketing
- **Data:** Kit dispatched, orientation scheduled
- **Exit criteria:** Orientation attended
- **Timeline event:** `orientation_scheduled`

#### 15. Classes Begin
- **Entry:** Everything ready
- **Owner:** Academic
- **Data:** Attendance tracking starts, timetable activated
- **Exit criteria:** First class attended
- **Timeline event:** `classes_began`

---

## 3. Admission Entity

### Purpose

The `admissions` table is the **central orchestration record** for the entire admission process. It does NOT store student data, family data, or payment data — it only tracks the _process_ and _links_ to all related entities.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `admissionNumber` | `string` | Auto-generated unique number (e.g., EEOS-ADM-2026-0001) |
| `leadId` | `id(leadMaster)` | Source lead (required, one-to-one) |
| `familyId` | `id(families)` | Family record (reused from Lead V2) |
| `studentId` | `optional(id(students))` | Created student (populated after approval) |
| `academicSessionId` | `id(academicSessions)` | Current academic session |
| `programId` | `id(academicPrograms)` | Program being enrolled into |
| `branchId` | `id(orgBranches)` | Branch/centre of study |
| `batchTypeId` | `optional(id(academicBatchTypes))` | Batch type preference |
| `admissionType` | `string` | New / Transfer / Upgrade / Readmission |
| `status` | `string` | Draft / InProgress / UnderReview / Approved / Rejected / Cancelled / Completed |
| `submittedAt` | `optional(number)` | When admission form was submitted |
| `approvedAt` | `optional(number)` | When admission was approved |
| `approvedBy` | `optional(id(users))` | Who approved |
| `seatReserved` | `boolean` | Whether seat is reserved |
| `seatExpiresAt` | `optional(number)` | Seat reservation expiry |
| `seatNumber` | `optional(string)` | Reserved seat identifier |
| `scholarshipId` | `optional(id(scholarships))` | Scholarship reference |
| `remarks` | `optional(string)` | Counsellor/admin notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Admission Status Lifecycle

```
Draft ──► InProgress ──► UnderReview ──► Approved ──► Completed
                              │               │
                              ▼               ▼
                          Rejected        Cancelled
```

- **Draft:** Admission form started, not yet submitted
- **InProgress:** Form submitted, documents being collected
- **UnderReview:** Documents being verified, payment pending
- **Approved:** All checks passed, student will be created
- **Rejected:** Admission denied (with reason)
- **Cancelled:** Admission cancelled after approval (student records remain)
- **Completed:** Student enrolled, batch allocated, fully done

### Admission Number Format

```
EEOS-{Year}-{Sequence}

Example: EEOS-2026-0042
```

- Auto-generated sequential number per academic year
- Resets or continues based on business preference

### Relationship Diagram

```
leadMaster ──1:1──► admissions ──1:1──► students
                        │
                        ├──► academicSessions
                        ├──► academicPrograms
                        ├──► orgBranches
                        ├──► families (reused)
                        ├──► scholarships (optional)
                        └──► invoice (via Finance module)
```

### Indexes

- `by_admissionNumber` — Unique lookup
- `by_leadId` — Lead-to-admission lookup
- `by_studentId` — Student-to-admission reverse lookup
- `by_status` — Admission pipeline view
- `by_academicSessionId` — Session-based reporting
- `by_programId` — Program popularity

### Design Rules

- Created when counsellor clicks **"Start Admission"** on a lead
- One admission per lead (enforced by unique `leadId`)
- `studentId` is populated **only after** admission is approved
- `admissionType` allows re-use for returning students (readmission)
- The admission record **never** stores fee or payment data — only status checks

---

## 4. Admission Checklist

### Purpose

A configurable checklist engine that tracks every requirement for admission completion. The checklist is **template-driven** — different programs, branches, or admission types can have different checklists.

### Checklist Template

Checklist templates are defined at the **program** or **branch** level and specify what items are required for admission.

#### Template Fields

| Field | Type | Purpose |
|-------|------|---------|
| `name` | `string` | Template name (e.g., "Standard JEE Checklist") |
| `entityType` | `string` | Applicable to: program / branch / admissionType |
| `entityId` | `string` | ID of the program or branch |
| `items` | `array` | Array of checklist items |
| `isActive` | `boolean` | Template active or disabled |
| `createdAt` | `number` | Timestamp |

#### Checklist Item Fields (within template)

| Field | Type | Purpose |
|-------|------|---------|
| `itemName` | `string` | Description (e.g., "Aadhar Card") |
| `category` | `string` | Document / Action / Payment / Consent |
| `isRequired` | `boolean` | Must be completed for admission |
| `sequence` | `number` | Display order |
| `dependsOn` | `optional(string)` | Must complete this item first |

### Checklist Instances (per Admission)

When an admission is created, a **checklist instance** is generated from the matching template. Each item tracks its own status.

#### Instance Fields

| Field | Type | Purpose |
|-------|------|---------|
| `admissionId` | `id(admissions)` | Parent admission |
| `itemName` | `string` | Checklist item copy |
| `category` | `string` | Document / Action / Payment / Consent |
| `isRequired` | `boolean` | Whether this blocks admission |
| `status` | `string` | Pending / Completed / Waived / NotApplicable |
| `completedAt` | `optional(number)` | When completed |
| `completedBy` | `optional(id(users))` | Who completed / verified |
| `remarks` | `optional(string)` | Verification notes |
| `sequence` | `number` | Display order |

### Default Checklist Items

#### Documents (Required for All)

| # | Item | Category | Required |
|---|------|----------|----------|
| 1 | Passport-size Photos (4 copies) | Document | Yes |
| 2 | Aadhar Card (Student) | Document | Yes |
| 3 | Aadhar Card (Parent) | Document | Yes |
| 4 | Previous Marksheet / Report Card | Document | Yes |
| 5 | School Leaving / Transfer Certificate | Document | Yes |
| 6 | Address Proof | Document | Yes |

#### Documents (Conditional)

| # | Item | Category | Required For |
|---|------|----------|-------------|
| 7 | Income Certificate | Document | Scholarship applicants |
| 8 | Caste Certificate | Document | Reserved category |
| 9 | Medical Certificate | Document | Hostel / Sports |
| 10 | Migration Certificate | Document | Board changes |
| 11 | Passport | Document | International programs |

#### Actions

| # | Item | Category | Required |
|---|------|----------|----------|
| 12 | Fee Payment (at least partial) | Payment | Yes |
| 13 | Admission Form Signed | Consent | Yes |
| 14 | Parent Consent Form Signed | Consent | Yes |
| 15 | ID Card Application | Action | Yes |

#### Program-Specific (Example: JEE)

| # | Item | Category | Required |
|---|------|----------|----------|
| 16 | JEE Score Card | Document | Yes |
| 17 | Class 12 Marksheet | Document | Yes |
| 18 | Counselling Registration Proof | Document | Yes |

### Checklist Progress

```
Admission Checklist for Raj Patel (EEOS-2026-0042)
  
  ┌──────────────────────────────────────────────┐
  │  Overall Progress: 12/15 items completed      │
  │  ████████████████████████████░░░  80%         │
  ├──────────────────────────────────────────────┤
  │  📄 Documents (7/9)                          │
  │  ✅ Photos — Verified by Admin               │
  │  ✅ Aadhar Card — Verified by Admin          │
  │  ✅ Marksheet — Verified by Admin            │
  │  ✅ Transfer Certificate — Pending Verify     │
  │  ⬜ Income Certificate — Not Uploaded          │
  │  ⬜ Medical Certificate — Not Required         │
  ├──────────────────────────────────────────────┤
  │  💰 Payments (1/1)                           │
  │  ✅ Fee Payment — ₹5,000 received             │
  ├──────────────────────────────────────────────┤
  │  ✍️ Actions & Consent (3/3)                  │
  │  ✅ Admission Form — Signed                   │
  │  ✅ Parent Consent — Signed by Rajesh Patel   │
  │  ✅ ID Card — Applied                         │
  ├──────────────────────────────────────────────┤
  │  📋 Program-Specific (1/2)                   │
  │  ✅ JEE Score Card — Verified                 │
  │  ⬜ Class 12 Marksheet — Not Uploaded          │
  └──────────────────────────────────────────────┘
```

### Design Rules

- Checklist templates are **pre-seeded** but **configurable** later
- Items marked `isRequired` block admission approval until completed
- Items marked `NotApplicable` are auto-skipped based on program/branch rules
- Counsellors can mark items as `Waived` with a reason (rare exceptions)
- Completed checklist items are **never deleted** — audit trail preserved

---

## 5. Seat Reservation

### Purpose

Seat reservation allows a lead to **secure a spot** in a program before full payment is completed. This is common in competitive programs with limited seats.

### Seat Status Lifecycle

```
Available ──► Reserved ──► Confirmed ──► (Enrolled)
                 │
                 ├──► Expired ──► Available
                 │
                 └──► Cancelled
```

### Seat States

| Status | Description | Next Possible States |
|--------|-------------|---------------------|
| **Available** | Seat is open (not tracked per student — system-level only) | Reserved |
| **Reserved** | Held for a specific admission, with expiry | Confirmed, Expired, Cancelled |
| **Confirmed** | Payment received, seat permanently allocated | Enrolled |
| **Expired** | Reservation period ended without payment | Available (released) |
| **Cancelled** | Reservation manually released | Available |
| **Waiting** | On waitlist, no seat currently available | Reserved (when seat opens) |

### Reservation Entity Fields

| Field | Type | Purpose |
|-------|------|---------|
| `admissionId` | `id(admissions)` | Associated admission |
| `programId` | `id(academicPrograms)` | Program for which seat is reserved |
| `branchId` | `id(orgBranches)` | Branch location |
| `seatNumber` | `optional(string)` | Physical seat identifier |
| `status` | `string` | Reserved / Confirmed / Expired / Cancelled / Waiting |
| `reservedAt` | `number` | When reserved |
| `expiresAt` | `number` | Reservation deadline |
| `confirmedAt` | `optional(number)` | When payment confirmed |
| `reservationFee` | `optional(number)` | Fee paid for reservation (if any) |
| `notes` | `optional(string)` | Admin notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Business Rules

1. **Not all programs require seat reservations.** Configurable per program.
2. **Reservation duration** is configurable (default: 7 days).
3. **Reservation fee** (if any) is applied toward total fees.
4. **Auto-expiry:** System checks daily and expires overdue reservations.
5. **Waiting list:** When all seats are reserved, new applicants go to a waiting list.
6. **Release notification:** When a seat expires, the next person on the waiting list is notified.
7. **One reservation per admission.** Cannot reserve multiple seats.

### Waiting List Logic

```
Seat Capacity: 60
Seats Reserved: 60 → Full

Waiting List:
  #1: Priya Sharma — NEET — Reserved 2 days ago
  #2: Amit Singh — NEET — Reserved 5 days ago
  
When a seat expires:
  → Priya Sharma gets first offer (48-hour window)
  → If she declines, Amit Singh gets the offer
  → If both decline, seat goes back to Available
```

---

## 6. Fee Confirmation

### Core Principle

**Admission NEVER directly collects or processes fees.**

The Admission Engine only **checks payment status** through the Finance module. All financial transactions — invoices, receipts, installments, refunds — are owned by Finance.

### Integration Pattern

```
Admission Engine                Finance Module
─────────────────               ──────────────
                                
  Admission Approved            
       │                        
       ▼                        
  Check: Is payment done? ──►   Invoice exists?
       │                        Payment received?
       ▼                        Payment verified?
  Yes → Proceed                 
  No  → Hold admission          
       │                        
       ▼                        
  Admission Status:             
  "Awaiting Payment"            
```

### Payment Status Checks (owned by Admission)

| Status | Meaning | Admission Action |
|--------|---------|-----------------|
| **Paid** | Full fee amount received and verified | Proceed to student creation |
| **Partial** | Partial payment received (admission confirmation fee) | Proceed if partial payment is accepted per policy |
| **Pending** | Invoice generated but no payment received | Hold admission |
| **Waived** | Full fee waived (scholarship/sponsorship) | Proceed (with approval proof) |

### What Admission Stores

Admission does NOT store amounts. It only stores:

| Field | Type | Purpose |
|-------|------|---------|
| `paymentStatus` | `string` | Paid / Partial / Pending / Waived |
| `paymentCheckedAt` | `number` | Last payment status check timestamp |
| `paymentCheckedBy` | `optional(id(users))` | Who verified the payment status |
| `invoiceId` | `optional(string)` | Reference to Finance invoice |

### Fee Confirmation Flow

```
1. Counsellor generates invoice in Finance module
         │
         ▼
2. Finance sends payment link to Primary Fee Contact
         │
         ▼
3. Parent/Student pays (online/offline)
         │
         ▼
4. Finance verifies payment → updates payment status
         │
         ▼
5. Admission Engine checks: paymentStatus == "Paid"?
         │
         ▼
6. If yes → Admission status → "Approved"
   If no  → Admission status → "Awaiting Payment"
```

### Design Rules

- Admission only _reads_ payment status; it never _writes_ financial data
- Partial payment policies are configurable per program
- Fee waivers require approved scholarship/discount records
- Payment verification is handled through the existing verification engine

---

## 7. Document Verification

### Purpose

Document verification ensures all required documents are authentic, complete, and correctly uploaded before admission is approved. This replaces manual paper-based verification.

### Document Lifecycle

```
Uploaded ──► Pending ──► Verified
                │
                ├──► Rejected ──► Resubmitted ──► Pending
                │
                └──► Request Proof ──► Proof Provided ──► Pending
```

### Verification Stages

| Status | Description | Owner |
|--------|-------------|-------|
| **Uploaded** | Document uploaded by parent/counsellor (initial state) | System |
| **Pending** | Queued for manual verification | System |
| **Verified** | Document authenticated and accepted | Verifier |
| **Rejected** | Document invalid or unreadable | Verifier |
| **Resubmitted** | New version uploaded after rejection | Parent/Counsellor |
| **Request Proof** | Additional proof requested by verifier | Verifier |

### Verification Table

| Field | Type | Purpose |
|-------|------|---------|
| `admissionId` | `id(admissions)` | Parent admission |
| `documentId` | `id(leadDocuments)` | Reference to actual document |
| `category` | `string` | Document category (Aadhar, Marksheet, etc.) |
| `status` | `string` | Uploaded / Pending / Verified / Rejected / Resubmitted / RequestProof |
| `verifierId` | `optional(id(users))` | Who verified the document |
| `verifiedAt` | `optional(number)` | When verified |
| `rejectionReason` | `optional(string)` | Why rejected (if applicable) |
| `remarks` | `optional(string)` | Verification notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Verification Workflow

```
Parent uploads Aadhar Card
         │
         ▼
Status → "Uploaded"
         │
         ▼ (System auto-queues)
Status → "Pending"
         │
         ▼ (Verifier reviews)
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Verified   Rejected
    │         │
    │         ▼
    │    Reason: "Document blurry"
    │    Status → "Rejected"
    │         │
    │         ▼
    │    Parent re-uploads
    │    Status → "Resubmitted"
    │         │
    │         ▼
    │    Status → "Pending" (re-verify)
    │
    ▼
Student created → Documents transferred to student record
```

### Integration with Lead Documents

Documents uploaded during the lead stage (Phase 7 of Lead V2 — Dynamic Forms) are **reused** in admission verification. No re-upload needed.

```
LeadDocuments (from Lead V2)
  │
  ├── Aadhar Card [uploaded at lead stage]
  ├── Marksheet [uploaded at lead stage]
  │
  ▼
Admission Verification
  ├── Aadhar Card → Verify (no re-upload)
  ├── Marksheet → Verify (no re-upload)
  └── TC → Upload (new requirement at admission)
```

### Design Rules

- Documents verified during admission are **copied** to the student record upon student creation
- Verification audit trail is preserved indefinitely
- Sensitive documents (Aadhar, Passport) have restricted access — only verified users can view
- Automated verification possible for certain document types (AI-powered in future)

---

## 8. Student Creation

### Core Principle

**Students are NEVER manually created.** A student record is **automatically generated** only when all admission conditions are met:

1. ✅ Admission Approved
2. ✅ Documents Verified (all required items)
3. ✅ Payment Valid (Paid, Partial accepted, or Waived)

### What Happens During Student Creation

```
leadMaster (status: "converted")
  │
  ├──► firstName, lastName, phone, email → student.name, student.phone, student.email
  │
  ├──► leadProfile (if exists) → student.profile
  │      ├── dob, gender → student.dob, student.gender
  │      ├── school, college → student.academicHistory
  │      └── address, city, state → student.address
  │
  ├──► admissions → student.admissionId
  │      ├── programId → student.program
  │      └── branchId → student.branch
  │
  ├──► families → student.familyId (REUSED — nothing duplicated)
  │
  ├──► familyContacts → (REUSED — nothing duplicated)
  │
  ├──► leadDocuments → student.documents (COPIED with audit trail)
  │
  └──► leadActivity → student.timeline (CONTINUED — seamless history)
```

### Student Entity (Future)

| Field | Source | Notes |
|-------|--------|-------|
| `name` | `leadMaster.firstName + leadMaster.lastName` | Combined or separate fields |
| `phone` | `leadMaster.phone` | Primary contact |
| `email` | `leadMaster.email` | Optional |
| `dob` | `leadProfile.dob` | From profile |
| `gender` | `leadProfile.gender` | From profile |
| `familyId` | `admissions.familyId` | **Reused** from Lead V2 |
| `admissionId` | `admissions._id` | Link back to admission |
| `programId` | `admissions.programId` | Current program |
| `branchId` | `admissions.branchId` | Current branch |
| `academicSessionId` | `admissions.academicSessionId` | Current session |
| `profileData` | `leadProfile + admissionForm` | JSON for extensibility |
| `academicHistory` | `leadProfile` | School, college, scores |
| `documents` | `leadDocuments + new` | Inherited + admission-specific |
| `status` | System | Active / Inactive / Transferred / Graduated / Alumni |
| `enrolledAt` | System | Timestamp |

### What Is Never Duplicated

| Entity | Source of Truth | Action |
|--------|----------------|--------|
| Family | `families` table | **Reused** — same record |
| Family Contacts | `familyContacts` table | **Reused** — same records |
| Phone Numbers | `familyContacts.phone` | **Reused** — never stored on student |
| Communication History | `leadWhatsAppMessages`, etc. | **Continued** — not copied |
| Activity Timeline | `leadActivity` | **Continued** — seamless |
| Payments | `leadPayments` | **Moved** to student context |

### What Is Created Fresh

| Entity | Action |
|--------|--------|
| Student record | ✅ Created fresh from lead + admission data |
| Student documents (verified copies) | ✅ Created with audit trail from lead docs |
| Student academic history | ✅ Normalized from lead profile |
| Fee structure | ✅ Set up based on program + discounts |
| Batch assignment | ✅ Created during enrollment |

### Student Status Lifecycle

```
Active ──► Inactive (temporary pause)
  │
  ├──► Transferred (program/branch change)
  ├──► Graduated (course completed)
  └──► Alumni (graduated + out of system)
```

---

## 9. Enrollment

### Purpose

Enrollment is the **operational act** of assigning a student to a batch, timetable, and academic structure. Admission is the _administrative_ process; enrollment is the _academic_ activation.

### Admission vs. Enrollment vs. Batch Allocation

| Concept | Description | Owner |
|---------|-------------|-------|
| **Admission** | Administrative process: documents, fees, approval | Admin / CRM |
| **Enrollment** | Academic activation: student is now an active learner | Academics |
| **Batch Allocation** | Timetable assignment: which batch, which faculty, which room | Academics |

### Enrollment Flow

```
Admission Approved
         │
         ▼
Student Created
         │
         ▼
┌─────────────────────────────────────────────┐
│           Enrollment Process                 │
│                                             │
│  1. Verify program has available batches     │
│  2. Select batch (or auto-assign)            │
│  3. Assign faculty / class teacher           │
│  4. Add to timetable                         │
│  5. Generate student ID                      │
│  6. Activate attendance tracking             │
│  7. Notify faculty and parent                │
└─────────────────────────────────────────────┘
         │
         ▼
Student Active → Classes Begin
```

### Enrollment Table (Future)

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `admissionId` | `id(admissions)` | Admission reference |
| `programId` | `id(academicPrograms)` | Program enrolled |
| `batchId` | `id(batches)` | Assigned batch |
| `academicSessionId` | `id(academicSessions)` | Current session |
| `enrolledAt` | `number` | When enrollment was completed |
| `status` | `string` | Active / Completed / Withdrawn |
| `createdAt` | `number` | Timestamp |

### Design Rules

- Enrollment can happen **immediately** after student creation or **later** (e.g., batch starts next month)
- A student can have multiple enrollments across different academic sessions (e.g., Year 1 → Year 2)
- Enrollment is **not required** for admission completion — but is required for classes to begin
- Re-enrollment: existing student re-enrolling for a new session creates a new enrollment record

---

## 10. Batch Allocation

### Purpose

Batch allocation assigns the student to a specific batch (class group) within their program. This links the student to a timetable, faculty, and peer group.

### Batch Entity (Future)

| Field | Type | Purpose |
|-------|------|---------|
| `name` | `string` | Batch name (e.g., "JEE 2027 Morning A") |
| `code` | `string` | Batch code |
| `programId` | `id(academicPrograms)` | Parent program |
| `branchId` | `id(orgBranches)` | Branch location |
| `batchTypeId` | `id(academicBatchTypes)` | Morning / Evening / Weekend, etc. |
| `facultyIds` | `array(id(faculty))` | Assigned faculty |
| `maxCapacity` | `number` | Maximum students |
| `currentCount` | `number` | Currently enrolled |
| `startDate` | `number` | Batch start date |
| `endDate` | `number` | Batch end date |
| `status` | `string` | Upcoming / Active / Completed / Cancelled |
| `classroomId` | `optional(string)` | Room/venue |
| `createdAt` | `number` | Timestamp |

### Allocation Flow

```
Student Created
  │
  ▼
Find matching batches:
  Program = JEE Foundation
  Branch = Andheri
  Batch Type = Morning
  Session = 2026-27
  Status = Active or Upcoming
  │
  ├── Multiple batches available?
  │   ├── Yes → Show options to Academic Coordinator
  │   └── No  → Auto-assign to available batch
  │
  ▼
Check capacity:
  ├── Batch has free seats?
  │   ├── Yes → Allocate student
  │   └── No  → Show waitlist option or suggest alternative batch
  │
  ▼
Allocation Confirmed:
  ├── Student linked to batch
  ├── Faculty notified
  ├── Timetable accessible
  └── Attendance tracking activated
```

### Allocation Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Manual** | Coordinator selects batch manually | Most common |
| **Auto-balance** | System assigns to batch with lowest count | Even distribution |
| **Preference-based** | Student's timing preference considered | Student choice |
| **First-come** | Earliest enrollment gets first pick | Competitive programs |

### Design Rules

- Batch allocation requires an **active** or **upcoming** batch
- Any batch can be reconfigured later (student moved to different batch)
- Batch change history is logged

---

## 11. Parent Portal Activation

### Purpose

The parent portal provides self-service access for parents to view student progress, fees, attendance, and communicate with the institute.

### Who Gets Access?

Based on `familyContacts` role flags (from Lead V2):

| Role Flag | Portal Access Level |
|-----------|-------------------|
| `hasPortalAccess` | Full portal access |
| `hasAppAccess` | Mobile app access |
| `isPrimaryContact` | Dashboard + Communication |
| `isPrimaryDecisionMaker` | All sections + Fee approval |
| `isPrimaryAcademicContact` | Attendance + Results + Timetable |
| `isPrimaryFeeContact` | Fee details + Payment history |
| `isEmergencyContact` | Emergency notifications only |

### Activation Flow

```
Student Created + Batch Allocated
         │
         ▼
System identifies eligible contacts:
  → familyContacts where hasPortalAccess = true
  → familyContacts where hasAppAccess = true
         │
         ▼
For each eligible contact:
  1. Check if portal account exists
     ├── Yes → Link existing account to this student
     └── No  → Create portal account
         │
         ▼
  2. Generate secure activation link
         │
         ▼
  3. Send welcome message via preferred channel
     (WhatsApp/SMS/Email based on communicationPreference)
         │
         ▼
  4. Parent clicks link → Sets password → Portal active
         │
         ▼
  5. Log activity: portal_activated
```

### Portal Capabilities

| Feature | Description |
|---------|-------------|
| **Dashboard** | Student overview, upcoming events, recent activity |
| **Attendance** | Daily attendance records, monthly summary |
| **Timetable** | Class schedule, faculty details |
| **Fees** | Fee structure, payment history, upcoming dues |
| **Results** | Exam scores, report cards, progress reports |
| **Documents** | Uploaded documents, verification status |
| **Communication** | Send messages to counsellor/faculty |
| **Notifications** | Receive alerts (fee due, attendance, events) |
| **Profile** | Update contact details, preferences |

### Multi-Student Parent Dashboard

```
Welcome, Rajesh Patel
  ┌──────────────────────────────────────────────┐
  │           My Children                        │
  ├──────────────────────────────────────────────┤
  │  Raj Patel  │  JEE Foundation  │  Class 12   │
  │  Attendance: 92%  │  Next Fee: ₹5,000 (15 Oct)│
  ├──────────────────────────────────────────────┤
  │  Priya Patel │  NEET Foundation │  Class 11  │
  │  Attendance: 88%  │  Next Fee: ₹4,500 (20 Oct)│
  └──────────────────────────────────────────────┘
```

---

## 12. Communication

### Communication Templates (Admission-Specific)

| Event | Template | Channel | Recipient Role |
|-------|----------|---------|----------------|
| Admission Started | `admission_form_received` | WhatsApp | Primary Decision Maker |
| Document Pending | `document_pending_reminder` | WhatsApp | Primary Contact |
| Document Verified | `document_verified` | WhatsApp | Primary Contact |
| Document Rejected | `document_rejected` | WhatsApp | Primary Contact |
| Seat Reserved | `seat_reserved` | WhatsApp | Primary Decision Maker |
| Seat Expiring | `seat_expiry_reminder` | WhatsApp | Primary Fee Contact |
| Payment Received | `payment_received` | WhatsApp | Primary Fee Contact |
| Payment Reminder | `payment_reminder` | WhatsApp/SMS | Primary Fee Contact |
| Admission Approved | `admission_confirmed` | WhatsApp | All role-flagged contacts |
| Student Created | `welcome_message` | WhatsApp | All contacts |
| Batch Allocated | `batch_allocation` | WhatsApp | Primary Contact |
| Portal Activated | `portal_welcome` | Email | hasPortalAccess contacts |
| Orientation Invite | `orientation_invite` | WhatsApp | Student + Primary Contact |
| ID Card Ready | `id_card_ready` | WhatsApp | Student |
| Classes Begin | `classes_begin` | WhatsApp | All contacts |

### Example: Admission Confirmation Message

```
To: +91-9876543210
Contact: Rajesh Patel (Father)
Role: ⭐ Primary Decision Maker
Template: admission_confirmed

"Dear Rajesh Patel,

We are pleased to confirm the admission of
Raj Patel to the JEE Foundation Program.

Admission Number: EEOS-2026-0042
Batch: JEE 2027 Morning A (Andheri Centre)
First Day of Class: 01-Aug-2026

Please download the parent portal app to
track attendance, fees, and progress:
[Portal Link]

Welcome to the EEOS family!

Regards,
EEOS Institute"
```

### Example: Document Pending Reminder

```
To: +91-9876543210
Contact: Sunita Patel (Mother)
Role: Primary Contact
Template: document_pending_reminder

"Dear Sunita Patel,

The following documents are still pending for
Raj Patel's admission:

  ⬜ Income Certificate
  ⬜ Transfer Certificate

Please upload at: [Document Upload Link]

These are required to complete the admission process.

Regards,
EEOS Institute"
```

### Communication Rules

1. All communication references `familyContactId` — never stores numbers directly
2. Templates are defined in a template engine (future scope)
3. Communication is logged in the unified activity timeline
4. Opt-out per contact per channel is respected

---

## 13. AI Opportunities

### 1. Admission Risk Score

```
Student: Raj Patel — JEE Foundation

AI Admission Risk Score: 12% (Low Risk)

Factors:
  ✅ All documents uploaded
  ✅ Payment completed
  ✅ Attendance at demo: 100%
  ⚠️ Income certificate still pending (non-blocking)
  ✅ Primary decision maker engaged

Prediction: 96% chance of successful enrollment
```

### 2. Dropout Prediction (Pre-Enrollment)

```
Admission: Priya Sharma — NEET Foundation (Stage: UnderReview)

AI Dropout Risk: 45% (Medium Risk)

Risk Factors:
  ❌ Only one parent contact registered
  ❌ No demo class attended
  ⚠️ Fee discussion not completed
  ⚠️ Decision maker not contacted in 7 days
    
Recommendation:
  → Schedule demo class immediately
  → Engage primary decision maker
  → Offer fee payment plan
```

### 3. Missing Document Detection

```
Checklist Scan for Amit Singh — JEE Target

AI Detects:
  ⚠️ Transfer Certificate mentioned in counselling notes
       but not uploaded
  ⚠️ Medical Certificate required for hostel option
       (hostel checkbox = true in profile)
  ⚠️ Income Certificate missing (scholarship applied)

Auto-suggested actions:
  → Send targeted WhatsApp for TC upload
  → Add Medical Certificate to checklist
  → Flag Income Certificate for scholarship processing
```

### 4. Payment Delay Prediction

```
Invoice: EEOS-INV-2026-0892 — ₹25,000
Due Date: 20-Aug-2026

AI Payment Prediction:
  Probability of on-time payment: 68%
  Probability of 7-day delay: 22%
  Probability of 30-day delay: 10%

Early intervention suggested:
  → Send payment reminder 5 days before due
  → Offer UPI/card payment option
  → Flag for counsellor call if not paid by due date
```

### 5. Batch Recommendation

```
Student: Raj Patel
Program: JEE Foundation
Preferred Timing: Not specified
Distance from branch: 12 km

AI Batch Recommendation:
  🥇 JEE 2027 Morning A (8:00-11:00 AM)
      → Most seats available
      → Top faculty assigned
      → Compatible with school schedule
  
  🥈 JEE 2027 Evening B (4:00-7:00 PM)
      → Alternative if morning not possible
```

### 6. Scholarship Recommendation

```
Student: Priya Sharma
Family Income: ₹4,20,000/year
Academic Score: 92%

AI Suggests:
  🏆 Merit Scholarship — 25% fee waiver
      → Eligibility: 85%+ in Class 10
      → Recommended: Yes (score qualifies)
  
  🏆 Need-based Scholarship — 15% fee waiver
      → Eligibility: Family income < ₹5L/year
      → Recommended: Yes (income qualifies)
  
  Combined savings: Up to 40% on total fees
```

### 7. Sibling Admission Prediction

```
Existing Student: Raj Patel (JEE, Class 12)

AI detects in family record:
  Sibling: Aarav Patel — Class 8
  Board: CBSE
  Interest: Not stated in system

Prediction: 68% chance of admission within 18 months
  → Window: Apr 2027 - Sep 2027 (Class 9 admission)
  → Recommended action: Start nurture sequence at Class 8 completion
  
Auto-generated task:
  → Create lead for Aarav Patel with parentLeadId = Raj's lead
  → Schedule counselling 3 months before predicted window
```

### 8. Auto-Verification (Document OCR)

```
Document Uploaded: Aadhar Card
AI Auto-Verification Result:

  📄 Document Type: Aadhar Card ✅
  👤 Name Match: "Raj Patel" = Lead Name ✅
  🎂 DOB Match: 15-Mar-2009 = Lead Profile DOB ✅
  🔢 Format: Valid Aadhar format (12 digits) ✅
  📸 Photo Quality: 85% — Acceptable ✅
  
  Status: Auto-Verified ✓
  Confidence: 94%
```

---

## 14. Edge Cases

### 1. Transfer Student

**Scenario:** A student is transferring from another institute/program.

| Aspect | Handling |
|--------|----------|
| Lead creation | New lead created with source = "Transfer" |
| Admission type | `admissionType = "Transfer"` |
| Documents | Previous marksheet, TC, migration certificate required |
| Fee adjustment | Previous fee paid considered; pro-rated fee calculated |
| Batch allocation | Placed in appropriate batch based on academic level |
| Student record | New student record; previous academic history noted |

**Differences from New Admission:**

- Checklist is abbreviated (fewer documents)
- Fee calculation is adjusted (credit for previous payment)
- Academic history carries over
- No demo class needed

### 2. Sibling Admission

**Scenario:** An existing student's sibling is now enrolling.

| Aspect | Handling |
|--------|----------|
| Lead creation | Sibling record converted to lead (via family exists) |
| Family data | **Reused** — no duplicate data entry |
| Family contacts | **Reused** — same parents |
| Discount | Sibling discount applied automatically to fee |
| Portal | Same parent portal now shows both students |
| Communication | Routed correctly per student context |

**Family View After Admission:**

```
Patel Family (Family ID: FAM-0042)
  ├── Student 1: Raj Patel — JEE Foundation (Existing)
  ├── Student 2: Priya Patel — NEET Foundation (New Admission)
  │
  └── Contacts (Shared):
      ├── Rajesh Patel (Father) — Primary Decision Maker
      └── Sunita Patel (Mother) — Primary Fee Contact, Academic Contact
```

### 3. Readmission

**Scenario:** A former student returns after a break.

| Aspect | Handling |
|--------|----------|
| Lead creation | New lead with source = "Readmission" |
| Admission type | `admissionType = "Readmission"` |
| Student record | Existing student record reactivated |
| Family data | Reused from original admission |
| Batch allocation | Placed in appropriate batch based on current academic level |
| Documents | Only new documents needed; old ones preserved |

### 4. Scholarship Admission

**Scenario:** Student admitted under a scholarship program.

| Aspect | Handling |
|--------|----------|
| Discount | Scholarship discount linked to admission |
| Verification | Income/caste documents verified before approval |
| Fee check | Payment status = "Waived" (or partial) |
| Approval | May require additional approval level |
| Reporting | Scholarship utilization tracked separately |

### 5. Corporate Admission (Bulk)

**Scenario:** A company sponsors multiple employees for a corporate program.

| Aspect | Handling |
|--------|----------|
| Lead creation | Bulk leads imported (CSV/API) |
| Admission type | `admissionType = "Corporate"` |
| Family data | Optional — corporate contacts replace family contacts if needed |
| Fee payment | Corporate invoice (single invoice for batch) |
| Communication | Sent to corporate coordinator, not family |
| Batch allocation | All corporates in same batch (if same program) |

### 6. Bulk Admission

**Scenario:** Batch admission from school partnerships (e.g., entire class enrollment).

| Aspect | Handling |
|--------|----------|
| Lead creation | Bulk import with school as source |
| Admission form | Simplified form with minimum fields |
| Documents | Batch upload by school coordinator |
| Checklist | Abbreviated — some items waived for bulk |
| Fee | Special bulk pricing applied |

### 7. Migration (Program Change)

**Scenario:** Student changes program after admission (e.g., JEE to NEET).

| Aspect | Handling |
|--------|----------|
| Admission | Existing admission updated with new program |
| Fee adjustment | Difference in fee calculated (refund/additional payment) |
| Batch allocation | Student moved to new batch |
| Documents | Additional documents if needed |
| Timeline | `program_changed` event logged |

### 8. Cancellation & Refund

**Scenario:** Admission cancelled after payment.

| Aspect | Handling |
|--------|----------|
| Admission status | `status = "Cancelled"` |
| Student status | `status = "Inactive"` (not deleted — historical) |
| Refund | Refund processed through Finance module |
| Seat | Released back to pool |
| Communication | Cancellation confirmation + refund timeline sent |
| Audit | Full audit trail preserved |

---

## 15. Implementation Roadmap

### Phase 1 — Admission Entity (P0)

**Estimated effort:** 4-5 days  
**Dependencies:** Lead V2 — Phase 1, 2, 3 (Lead Profile, Family, Family Contacts)

**Tasks:**
- [ ] Create `admissions` table in schema (fields per Section 3)
- [ ] Create `convex/admissions.ts` CRUD
- [ ] Admission number auto-generation (EEOS-2026-XXXX)
- [ ] Status lifecycle management
- [ ] "Start Admission" button in Lead Workspace
- [ ] Admission detail view
- [ ] Link admission to lead (one-to-one enforcement)

### Phase 2 — Admission Checklist (P0)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `admissionChecklistTemplates` table
- [ ] Create `admissionChecklistItems` table
- [ ] Seed default checklist templates per program
- [ ] Auto-generate checklist instance on admission creation
- [ ] Checklist progress UI
- [ ] Counsellor checklist management (mark complete, waive)
- [ ] Checklist completion validation

### Phase 3 — Document Verification (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, Lead V2 — Phase 7 (Dynamic Forms / Documents)

**Tasks:**
- [ ] Create `admissionDocumentVerification` table
- [ ] Verification workflow (Upload → Pending → Verify/Reject → Resubmit)
- [ ] Integrate with existing `leadDocuments` table
- [ ] Verifier dashboard (pending verifications)
- [ ] Upload status tracking per document category
- [ ] Notification triggers on verification events

### Phase 4 — Fee Confirmation Integration (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, existing Finance module

**Tasks:**
- [ ] Payment status check integration with Finance module
- [ ] Invoice generation trigger from admission
- [ ] Payment status display in admission view
- [ ] Partial payment handling rules
- [ ] Fee waiver/scholarship linking

### Phase 5 — Seat Reservation (P1)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 1, Phase 4

**Tasks:**
- [ ] Create `seatReservations` table
- [ ] Reservation management (reserve, confirm, expire, cancel)
- [ ] Seat capacity tracking per program/batch
- [ ] Waiting list logic
- [ ] Auto-expiry cron job
- [ ] Seat availability display

### Phase 6 — Student Creation Engine (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, 2, 3, 4

**Tasks:**
- [ ] Create `students` table in schema
- [ ] Auto-generation from lead + admission data
- [ ] Family data reuse (no duplication)
- [ ] Document inheritance from lead
- [ ] Activity timeline continuation
- [ ] Student status lifecycle

### Phase 7 — Batch Allocation (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 6

**Tasks:**
- [ ] Create `batches` table in schema
- [ ] Batch CRUD (Academic Studio)
- [ ] Batch allocation workflow (manual + auto)
- [ ] Capacity management
- [ ] Faculty-student linking
- [ ] Batch change history

### Phase 8 — Enrollment (P2)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 6, Phase 7

**Tasks:**
- [ ] Create `enrollments` table
- [ ] Enrollment → Batch → Timetable linking
- [ ] Academic session association
- [ ] Enrollment history per student (across sessions)

### Phase 9 — Parent Portal Activation (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 6, Lead V2 — Phase 3 (Family Contacts)

**Tasks:**
- [ ] Portal account creation from family contacts
- [ ] Role-based access control (per role flags)
- [ ] Secure activation link generation
- [ ] Multi-student parent dashboard
- [ ] Communication integration

### Phase 10 — Communication Templates (P2)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 1-9, Lead V2 — Phase 4 (Communication Integration)

**Tasks:**
- [ ] Define admission-specific message templates
- [ ] Template auto-trigger on status changes
- [ ] Communication history view in admission timeline
- [ ] Template personalization (student name, amount, dates)

### Phase 11 — AI Features (P3)

**Estimated effort:** 10-15 days  
**Dependencies:** Phase 1-10

**Tasks:**
- [ ] Admission risk score model
- [ ] Dropout prediction
- [ ] Missing document detection
- [ ] Payment delay prediction
- [ ] Batch recommendation
- [ ] Scholarship recommendation
- [ ] Document auto-verification (OCR)

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Admission Entity | P0 | 5d | Medium | Critical |
| 2. Admission Checklist | P0 | 4d | Low | High |
| 3. Document Verification | P1 | 5d | Medium | High |
| 4. Fee Confirmation | P1 | 4d | Medium | High |
| 5. Seat Reservation | P1 | 3d | Low | Medium |
| 6. Student Creation Engine | P2 | 5d | High | Critical |
| 7. Batch Allocation | P2 | 4d | Medium | High |
| 8. Enrollment | P2 | 3d | Low | High |
| 9. Parent Portal Activation | P2 | 5d | Medium | High |
| 10. Communication Templates | P2 | 3d | Low | Medium |
| 11. AI Features | P3 | 15d | High | High |

### Domain Ownership Matrix

| Module | Owns | Does NOT Own |
|--------|------|-------------|
| **CRM (Lead V2)** | Lead, Profile, Family, Contacts, Documents | Admissions, Students |
| **Admission Engine** | Admission, Checklist, Verification, Seat | Payments, Batches, Students |
| **Finance** | Invoices, Receipts, Refunds, Payment Verification | Admission decisions, Document verification |
| **Academics** | Batches, Timetable, Faculty, Subjects, Attendance | Admission process, Fee status |
| **Student Management** | Student record, Academic History, Results | Admission process, Batch allocation |
| **Communication** | Message templates, Delivery, Tracking | Contact data (uses familyContacts) |
| **Parent Portal** | Portal UI, Role-based access, Notifications | Student data (displays from other modules) |

---

## 16. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║              ADMISSION ENGINE GOLDEN RULES                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Admission NEVER duplicates Lead data.                   ║
║      └── Student inherits from Lead, never copies.           ║
║                                                              ║
║  2.  Student NEVER duplicates Family data.                   ║
║      └── Family and FamilyContacts are reused as-is.         ║
║                                                              ║
║  3.  Finance owns ALL payments.                              ║
║      └── Admission only checks Paid / Partial / Pending.     ║
║                                                              ║
║  4.  Academics owns ALL batches.                              ║
║      └── Admission creates the link, not the batch.          ║
║                                                              ║
║  5.  Admission only orchestrates.                             ║
║      └── It coordinates, validates, and routes — it does     ║
║      not own data in other domains.                           ║
║                                                              ║
║  6.  One Admission → One Student.                             ║
║      └── A single admission produces exactly one student.    ║
║                                                              ║
║  7.  One Family → Many Students.                              ║
║      └── Siblings share the same family record.              ║
║                                                              ║
║  8.  Everything linked through IDs.                           ║
║      └── No data duplication across entities.                ║
║                                                              ║
║  9.  Never delete — always preserve history.                  ║
║      └── Cancelled admissions, rejected documents, and       ║
║      inactive students remain in the system for audit.       ║
║                                                              ║
║ 10.  Progressive verification.                                ║
║      └── Documents, payments, and approvals can be done      ║
║      in any order, but admission only approves when ALL      ║
║      are complete.                                           ║
║                                                              ║
║ 11.  Admission is the bridge, not the destination.            ║
║      └── It exists to connect Lead → Student cleanly.        ║
║                                                              ║
║ 12.  AI is additive, not required.                            ║
║      └── All admission flows work without AI. AI only        ║
║      enhances decisions and predictions.                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Belongs To |
|--------|-----------|--------|-------|-----------|
| Admission | `admissions` | 🔶 New | Phase 1 | Admission Engine |
| Admission Checklist Template | `admissionChecklistTemplates` | 🔶 New | Phase 2 | Admission Engine |
| Admission Checklist Item | `admissionChecklistItems` | 🔶 New | Phase 2 | Admission Engine |
| Seat Reservation | `seatReservations` | 🔶 New | Phase 5 | Admission Engine |
| Document Verification | `admissionDocumentVerification` | 🔶 New | Phase 3 | Admission Engine |
| Student | `students` | 🔶 New | Phase 6 | Student Management |
| Enrollment | `enrollments` | 🔶 New | Phase 8 | Academics |
| Batch | `batches` | 🔶 New | Phase 7 | Academics |
| Parent Portal Account | `parentPortalAccounts` | 🔶 New | Phase 9 | Parent Portal |
| Communication Template | `communicationTemplates` | 🔶 New | Phase 10 | Communication |

## Appendix B: Full Entity Relationship Diagram

```
leadMaster (CRM - Existing)
  │
  ├──1:1──► leadProfile (Lead V2 - Phase 1)
  ├──1:1──► families (Lead V2 - Phase 2)
  │           │
  │           ├──1:N──► familyContacts (Lead V2 - Phase 3)
  │           └──1:N──► siblings (Lead V2 - Phase 5)
  │
  └──1:1──► admissions (Phase 1)
               │
               ├──1:N──► admissionChecklistItems (Phase 2)
               ├──1:N──► admissionDocumentVerification (Phase 3)
               ├──1:0..1──► seatReservations (Phase 5)
               │
               └──1:1──► students (Phase 6)
                            │
                            ├──► families (REUSED)
                            ├──► familyContacts (REUSED)
                            │
                            ├──1:N──► enrollments (Phase 8)
                            │            │
                            │            └──► batches (Phase 7)
                            │                 │
                            │                 ├──► faculty (Future)
                            │                 ├──► timetable (Future)
                            │                 └──► attendance (Future)
                            │
                            ├──► leadDocuments (INHERITED)
                            ├──► leadActivity (CONTINUED)
                            └──► leadPayments (CONTINUED)

Finance Module (Existing)
  └──► invoices
       └──► receipts
            └──► admission (paymentStatus CHECK)

Academic Studio (Existing - Master Data)
  ├──► academicVerticals
  ├──► academicSubVerticals
  ├──► academicPrograms
  ├──► academicSubjects
  ├──► academicBatchTypes
  └──► academicSessions
       └──► admissions (academicSessionId FK)
```

## Appendix C: Key Data Flow — Lead to Class

```
Step 1: Marketing Source → leadMaster (phone, name, source)
Step 2: Counselling → leadProfile (dob, school, address, goals)
Step 3: Family Setup → families + familyContacts (parents with role flags)
Step 4: Counsellor clicks "Start Admission"
Step 5: admissions record created
Step 6: Checklist auto-generated from program template
Step 7: Documents uploaded → leadDocuments
Step 8: Documents verified → admissionDocumentVerification
Step 9: Fee discussed → discount applied (if needed) → leadDiscounts
Step 10: Payment made → leadPayments (via Finance)
Step 11: Payment confirmed → admission.paymentStatus = "Paid"
Step 12: All checks passed → admission.status = "Approved"
Step 13: Student auto-created → students record
Step 14: Batch allocated → enrollments + batches
Step 15: Portal activated → parentPortalAccounts
Step 16: Welcome communication sent → leadWhatsAppMessages
Step 17: Orientation → classes begin
```

---

*End of DOC-06 — Admission & Enrollment Engine Bible*
