# DOC-05 — Lead V2 Architecture Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** CRM — Lead Management  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08

---

## Table of Contents

1. [Current Lead Architecture](#1-current-lead-architecture)
2. [Lead Profile](#2-lead-profile)
3. [Family](#3-family)
4. [Family Contacts](#4-family-contacts)
5. [Siblings](#5-siblings)
6. [Marketing Attribution](#6-marketing-attribution)
7. [Lead Documents](#7-lead-documents)
8. [Communication Architecture](#8-communication-architecture)
9. [Lead Timeline](#9-lead-timeline)
10. [Dynamic Forms](#10-dynamic-forms)
11. [Admission Conversion](#11-admission-conversion)
12. [Student Relationship](#12-student-relationship)
13. [Communication Examples](#13-communication-examples)
14. [AI Opportunities](#14-ai-opportunities)
15. [Benefits](#15-benefits)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [Golden Rules](#17-golden-rules)

---

## 1. Current Lead Architecture

### The Existing `leadMaster` Table

The current `leadMaster` table (schema: `src/convex/schema.ts`) is the operational CRM Lead table. It is **NOT to be modified**. It will remain the **Marketing Lead** — the lightweight entry point where leads first appear.

### Purpose

The `leadMaster` table captures the **minimum viable information** needed for the sales team to begin working a lead. It is the thin entry point into the system.

### What Stays in `leadMaster` Forever

| Field | Type | Purpose |
|-------|------|---------|
| `firstName` | `string` | Lead's given name |
| `lastName` | `string` | Lead's surname |
| `phone` | `string` | Primary contact number **— unique identity** |
| `email` | `optional(string)` | Email address |
| `stage` | `string` | Current pipeline stage |
| `ownerId` | `optional(id)` | Assigned counsellor |
| `priority` | `union` | Low / Medium / High / Critical |
| `source` | `optional(string)` | Marketing source |
| `campaign` | `optional(string)` | Campaign identifier |
| `utm` | `optional(string)` | UTM tag |
| `channel` | `optional(string)` | Channel type |
| `status` | `union` | Active / Converted / Lost / Archived |
| `tags` | `optional(array)` | Free-form tags |
| `createdBy` | `id` | Who created the lead |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Marketing Sources (current)

- Facebook Ads
- Google Ads
- Website Forms
- Landing Pages
- WhatsApp
- Walk-ins
- Phone Calls
- Manual Entry
- Import Excel
- API

### What `leadMaster` Currently Holds That Should Move to Lead V2

These fields exist in `leadMaster` today for convenience but should be **moved to dedicated V2 entities** for a normalized, scalable architecture:

| Current Field | Destination Entity | Reason |
|---------------|-------------------|--------|
| `dob` | Lead Profile | Extended info, not needed for marketing |
| `gender` | Lead Profile | Extended info |
| `location` | Lead Profile | Address details |
| `verticalId` | Lead Profile (via academic interest) | Belongs to profile |
| `subVerticalId` | Lead Profile | Belongs to profile |
| `boardId` | Lead Profile | Belongs to profile |
| `courseInterest` | Lead Profile | Belongs to profile |
| `branchInterestId` | Lead Profile | Belongs to profile |
| `academicDetails` | Lead Profile | Extended info |
| `whatsappUsername` | Family Contacts | Contact-specific |
| `whatsappPin` | Family Contacts | Contact-specific |
| `referralId` | Marketing Attribution | Attribution data |
| `expectedRevenue` | Lead Profile (Finance) | Deal-level detail |
| `expectedJoining` | Lead Profile | Deal-level detail |
| `probability` | Lead Profile | Deal-level detail |
| `nextAction` | Lead Tasks | Task engine |
| `nextActionDate` | Lead Tasks | Task engine |
| `discountAmount` | Lead Discounts (already moved) | Already handled |
| `waiverAmount` | Lead Discounts (already moved) | Already handled |
| `finalPayable` | Lead Discounts (already moved) | Already handled |
| `standardAmount` | Lead Courses (already moved) | Already handled |

> **⚠️ Migration Note:** These fields should be **phased out** of `leadMaster` only after their V2 counterparts are fully operational. During transition, both locations can co-exist with the V2 entity as the source of truth and `leadMaster` fields deprecation-tracked.

### Related Tables (already operational, NOT to be modified)

- `leadStageHistory` — Stage transitions
- `leadAssignments` — Counsellor reassignments
- `leadTasks` — Follow-up tasks
- `leadNotes` — Counselling notes
- `leadDocuments` — Uploaded documents
- `leadActivity` — Activity timeline
- `leadDiscounts` — Discounts & waivers
- `leadWhatsAppMessages` — WhatsApp outbound
- `leadApprovals` — Discount approvals
- `leadApprovalDecisions` — Approver decisions
- `leadPayments` — Payments received
- `leadCourses` — Course linkages
- `callLogs` — Call records

---

## 2. Lead Profile

### Purpose

Extended information collected **after** the lead is captured. This data is gathered progressively through counselling conversations, forms, and follow-ups. It should **never** block lead creation.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `leadId` | `id(leadMaster)` | One-to-one relationship |
| `dob` | `optional(number)` | Date of birth |
| `gender` | `optional(string)` | Male / Female / Other |
| `school` | `optional(string)` | Current school name |
| `college` | `optional(string)` | Current college name |
| `currentClass` | `optional(string)` | Current class/grade |
| `boardId` | `optional(id(academicBoards))` | Board reference |
| `address` | `optional(string)` | Street address |
| `city` | `optional(string)` | City |
| `state` | `optional(string)` | State |
| `country` | `optional(string)` | Country |
| `pinCode` | `optional(string)` | Postal code |
| `preferredLanguage` | `optional(string)` | Communication language |
| `careerGoal` | `optional(string)` | Career aspiration |
| `preferredBranchId` | `optional(id(orgBranches))` | Preferred study centre |
| `preferredTiming` | `optional(string)` | Morning / Afternoon / Evening |
| `transportRequired` | `optional(boolean)` | Needs transport |
| `hostelRequired` | `optional(boolean)` | Needs hostel |
| `previousCoaching` | `optional(string)` | Previous institute |
| `academicScore` | `optional(number)` | Last exam score/percentage |
| `customFields` | `optional(string)` | JSON for extensibility |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Relationship Diagram

```
leadMaster  ──1:1──►  leadProfile
```

### Indexes

- `by_leadId` — Primary lookup
- `by_city` — City-based grouping
- `by_boardId` — Board-based reporting

### Design Rules

- Created on-demand, not at lead creation
- Counsellors fill progressively through counselling sessions
- Never blocks lead creation or assignment
- Custom fields stored as JSON string for extensibility

---

## 3. Family

### Purpose

Represent the family as a single cohesive entity. The Family is the **central hub** that connects leads, contacts, siblings, admissions, and students. One family can have multiple students (siblings studying at the same institute).

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `leadId` | `id(leadMaster)` | One-to-one with lead at creation |
| `familyName` | `optional(string)` | Common family surname |
| `familyType` | `optional(string)` | Nuclear / Joint / Single Parent |
| `communicationPreference` | `optional(string)` | WhatsApp / SMS / Email / Phone |
| `address` | `optional(string)` | Family address (if different) |
| `city` | `optional(string)` | City |
| `state` | `optional(string)` | State |
| `country` | `optional(string)` | Country |
| `pinCode` | `optional(string)` | Postal code |
| `remarks` | `optional(string)` | Counsellor notes about family |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Relationship Diagram

```
leadMaster  ──1:1──►  family ──1:N──►  familyContacts
                        │
                        └──1:N──►  siblings
```

### Indexes

- `by_leadId` — Primary lookup
- `by_city` — Geographic grouping

### Design Rules

- Family is **created with the lead**, not after
- One Family record per Lead (initially)
- When admission happens, the Family record **moves** with the student
- Multiple students can reference the **same** Family record after sibling admissions

---

## 4. Family Contacts

### Purpose

This is the **most important entity** in the Lead V2 architecture. It is a **reusable contact table** that stores every person associated with the family. No contact number is ever stored outside this table.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `familyId` | `id(family)` | Parent family reference |
| `relationship` | `string` | Father / Mother / Guardian / Brother / Sister / Grandparent / Other |
| `name` | `string` | Full name |
| `phone` | `string` | Mobile number |
| `whatsapp` | `optional(string)` | WhatsApp number (if different) |
| `email` | `optional(string)` | Email address |
| `occupation` | `optional(string)` | Profession / occupation |
| `company` | `optional(string)` | Employer name |
| `preferredLanguage` | `optional(string)` | Preferred communication language |
| `preferredContactTime` | `optional(string)` | Morning / Afternoon / Evening / Any |
| `communicationPreference` | `optional(string)` | WhatsApp / SMS / Email / Phone |

### Role Flags

These boolean flags define **what this contact is responsible for**:

| Flag | Purpose |
|------|---------|
| `isPrimaryContact` | The first person to call |
| `isPrimaryDecisionMaker` | Who makes the final admission decision |
| `isPrimaryAcademicContact` | Who receives academic updates |
| `isPrimaryFeeContact` | Who receives fee/payment communications |
| `isEmergencyContact` | Emergency notification recipient |
| `isMarketingContact` | Can receive marketing/promotional messages |
| `hasPortalAccess` | Can log in to parent portal |
| `hasAppAccess` | Can log in to parent mobile app |

### Additional Fields

| Field | Type | Purpose |
|-------|------|---------|
| `remarks` | `optional(string)` | Counsellor notes |
| `isActive` | `boolean` | Whether contact is still relevant |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Relationship Diagram

```
family ──1:N──►  familyContacts
                   │
                   ├──► Communication (WhatsApp/SMS/Email)
                   ├──► Notifications
                   ├──► Portal Access
                   └──► App Access
```

### Indexes

- `by_familyId` — All contacts for a family
- `by_phone` — Unique phone lookup
- `by_roleFlags` — Find primary contacts by type

### Design Rules

- **Never store phone numbers directly** in communication tables
- Every communication references a `familyContactId`
- Unlimited contacts per family
- Role flags are **not mutually exclusive** — one person can be both Primary Decision Maker and Primary Fee Contact
- At least one contact must have `isPrimaryContact = true`

---

## 5. Siblings

### Purpose

Track siblings for **future admissions**. When a sibling is ready to enroll, their record can be converted into a new lead without re-entering family information.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `familyId` | `id(family)` | Parent family reference |
| `name` | `string` | Sibling's full name |
| `dob` | `optional(number)` | Date of birth |
| `gender` | `optional(string)` | Gender |
| `school` | `optional(string)` | Current school |
| `boardId` | `optional(id(academicBoards))` | Board reference |
| `currentClass` | `optional(string)` | Current class/grade |
| `interestedProgramId` | `optional(id(academicPrograms))` | Future program interest |
| `expectedAdmissionYear` | `optional(number)` | When they might enroll |
| `futureLeadId` | `optional(id(leadMaster))` | Link to converted lead (once created) |
| `isConverted` | `boolean` | Whether a lead was created |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Relationship Diagram

```
family ──1:N──►  siblings
                   │
                   └──► futureLeadId ──► leadMaster (when converted)
```

### Indexes

- `by_familyId` — All siblings for a family
- `by_expectedAdmissionYear` — Future admission pipeline
- `by_isConverted` — Pending conversions

### Design Rules

- Siblings are **not leads** until converted
- Converting a sibling creates a new `leadMaster` record with `parentLeadId` pointing to the original lead
- The new lead inherits the same `familyId`
- Never duplicate family contact data for siblings

---

## 6. Marketing Attribution

### Purpose

Track the complete digital footprint of how a lead was acquired. This is critical for ROI analysis, campaign optimization, and AI-driven marketing spend recommendations.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `leadId` | `id(leadMaster)` | Lead reference |
| `utmSource` | `optional(string)` | UTM source parameter |
| `utmMedium` | `optional(string)` | UTM medium parameter |
| `utmCampaign` | `optional(string)` | UTM campaign parameter |
| `utmContent` | `optional(string)` | UTM content parameter |
| `utmTerm` | `optional(string)` | UTM term parameter |
| `facebookCampaignId` | `optional(string)` | Facebook campaign ID |
| `facebookAdSetId` | `optional(string)` | Facebook ad set ID |
| `facebookAdId` | `optional(string)` | Facebook ad ID |
| `facebookCreativeId` | `optional(string)` | Facebook creative ID |
| `landingPage` | `optional(string)` | Landing page URL |
| `referrer` | `optional(string)` | HTTP referrer |
| `device` | `optional(string)` | Device type |
| `browser` | `optional(string)` | Browser name |
| `ip` | `optional(string)` | IP address |
| `capturedAt` | `number` | When captured |

### Relationship Diagram

```
leadMaster ──1:1──►  leadAttribution
```

### Indexes

- `by_leadId` — Primary lookup
- `by_utmCampaign` — Campaign grouping
- `by_facebookCampaignId` — Facebook ROI

### Design Rules

- Created at lead capture time, never modified
- One attribution record per lead (first touch)
- Multiple attribution models supported later (first touch, last touch, multi-touch)

---

## 7. Lead Documents

### Purpose

Store uploaded documents associated with the lead. These are collected progressively during counselling and admission.

### Current Implementation (already operational)

The `leadDocuments` table already exists and is functional. In V2, it will be extended with a `category` field for better organization.

### Fields (V2 Enhancement)

| Field | Type | Purpose |
|-------|------|---------|
| `leadId` | `id(leadMaster)` | Lead reference |
| `name` | `string` | Document name |
| `url` | `string` | File URL (storage backend) |
| `type` | `optional(string)` | MIME type |
| `size` | `optional(number)` | File size in bytes |
| `category` | `optional(string)` | Document category (NEW in V2) |
| `uploadedBy` | `id(users)` | Who uploaded |
| `createdAt` | `number` | Timestamp |

### Document Categories

- Aadhar Card
- Passport
- Marksheet / Report Card
- Transfer Certificate
- Passport-size Photo
- Income Certificate
- Caste Certificate
- Medical Certificate
- Migration Certificate
- Fee Receipt
- Other

### Relationship Diagram

```
leadMaster ──1:N──►  leadDocuments
```

---

## 8. Communication Architecture

### Core Principle

**Communication NEVER stores phone numbers or contact details directly.**

Every outbound communication references a `familyContactId` from the `familyContacts` table. This ensures a single source of truth for contact information.

### Architecture Diagram

```
                    ┌──────────────────┐
                    │  familyContacts   │
                    │                   │
                    │  Phone: +91xxxx   │
                    │  WhatsApp: +91xxx │
                    │  Email: a@b.com   │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
     ┌──────────┐     ┌──────────┐     ┌──────────┐
     │ WhatsApp  │     │   SMS    │     │  Email   │
     │ Messages  │     │ Messages │     │ Messages │
     └──────────┘     └──────────┘     └──────────┘
            │                │                │
            ▼                ▼                ▼
     familyContactId   familyContactId   familyContactId
```

### Communication Routing Rules

| Type of Communication | Which Contact Receives It |
|----------------------|--------------------------|
| **Fee Reminder** | `isPrimaryFeeContact` |
| **Attendance Alert** | `isPrimaryAcademicContact` |
| **Marketing Promotion** | `isMarketingContact` |
| **Emergency** | `isEmergencyContact` |
| **General Updates** | `isPrimaryContact` |
| **Admission Confirmation** | `isPrimaryDecisionMaker` |
| **Portal Login** | `hasPortalAccess` |
| **App Notification** | `hasAppAccess` |

### Communication Tables (existing, can be extended)

- `leadWhatsAppMessages` → Add `familyContactId` reference
- New: `leadSmsMessages` → Reference `familyContactId`
- New: `leadEmailMessages` → Reference `familyContactId`

### Communication Channel Examples

**WhatsApp Message Record:**

```json
{
  "leadId": "lead_123",
  "familyContactId": "contact_456",
  "template": "fee_reminder",
  "message": "Dear Rajesh, your fee installment of ₹5,000 is due on 15th...",
  "status": "sent",
  "sentAt": 1760000000000
}
```

**SMS Record:**

```json
{
  "leadId": "lead_123",
  "familyContactId": "contact_789",
  "message": "Attendance alert: Your ward was absent on 10-Oct-2026.",
  "status": "delivered",
  "sentAt": 1760000000000
}
```

---

## 9. Lead Timeline

### Purpose

Every activity related to a lead — across all modules — appears in a single, unified activity feed. No more switching between tabs to see the full picture.

### Activity Types (single `leadActivity` table — already operational)

| Action | Description |
|--------|-------------|
| `lead_created` | Lead was created |
| `stage_changed` | Lead moved to a new stage |
| `assigned` | Counsellor assigned/reassigned |
| `call_made` | Call logged |
| `whatsapp_sent` | WhatsApp message sent |
| `meeting_scheduled` | Meeting/counselling session booked |
| `demo_conducted` | Demo class attended |
| `task_created` | Follow-up task created |
| `task_completed` | Follow-up done |
| `note_added` | Counselling note recorded |
| `document_added` | Document uploaded |
| `fee_discussed` | Fee discussion logged |
| `discount_applied` | Discount/waiver approved |
| `payment_received` | Payment recorded |
| `admission_started` | Admission process initiated |
| `converted` | Lead converted to student |
| `lost` | Lead marked as lost |

### Timeline UI Concept

```
┌─────────────────────────────────────────────────┐
│  Activity Timeline                               │
├─────────────────────────────────────────────────┤
│  ●  Today                                      │
│  ├── 10:30 AM  Call connected (5m 23s)         │
│  │   └── Spoke about fee structure              │
│  ├── 09:15 AM  WhatsApp fee reminder sent       │
│  │             → to Sunita Patel (Mother)       │
│  │                                              │
│  ●  Yesterday                                   │
│  ├── 03:45 PM  Stage changed → Negotiation      │
│  │             ← from Interested                │
│  ├── 02:00 PM  Document added: Aadhar Card      │
│  │                                              │
│  ●  3 days ago                                  │
│  ├── 11:00 AM  Counselling session completed    │
│  │   └── Client interested in JEE Foundation    │
│  └── 10:30 AM  Lead created from Facebook Ads   │
└─────────────────────────────────────────────────┘
```

### Design Rules

- Every module writes to `leadActivity`
- No module-specific activity tables needed (except `callLogs` for call-specific details)
- Timeline is read-only for display purposes
- `metadata` field can store JSON for extensible activity details

---

## 10. Dynamic Forms

### Purpose

Enable parents to self-serve through secure, dynamic forms. This replaces manual data entry by counsellors and reduces errors.

### Workflow

```
1. Counsellor triggers "Send Parent Form" from CRM
         │
         ▼
2. System generates a secure, time-limited link
         │
         ▼
3. Parent receives link via WhatsApp/SMS/Email
         │
         ▼
4. Parent opens link (no login required)
         │
         ▼
5. Parent fills multi-step form:
   ┌──────────────────────────────────┐
   │ Step 1: Family Information       │
   │   Family name, type, address     │
   ├──────────────────────────────────┤
   │ Step 2: Contact Information      │
   │   Father details, Mother details │
   │   Guardian, emergency contacts   │
   ├──────────────────────────────────┤
   │ Step 3: Student Information      │
   │   School, board, class, scores   │
   ├──────────────────────────────────┤
   │ Step 4: Documents                │
   │   Upload Aadhar, marksheet, etc. │
   ├──────────────────────────────────┤
   │ Step 5: Additional Requirements  │
   │   Transport, hostel, medical     │
   ├──────────────────────────────────┤
   │ Step 6: Consent & Declaration    │
   │   Terms acceptance, signature    │
   └──────────────────────────────────┘
         │
         ▼
6. CRM updates automatically:
   ┌──────────────────────────────────┐
   │ ✓ Family record created/updated  │
   │ ✓ Contacts added with role flags │
   │ ✓ Lead profile filled            │
   │ ✓ Documents attached             │
   │ ✓ Timeline updated               │
   └──────────────────────────────────┘
         │
         ▼
7. Counsellor receives notification
         │
         ▼
8. Counsellor reviews and verifies
```

### Form Types

| Form Type | Purpose |
|-----------|---------|
| **Enquiry Form** | Initial interest capture |
| **Family Details Form** | Complete family information |
| **Registration Form** | Admission application |
| **Medical Form** | Health information |
| **Transport Form** | Transport requirements |
| **Hostel Form** | Hostel accommodation |

### Security

- Forms use **signed tokens** (no authentication required)
- Links expire after configurable duration (default: 72 hours)
- One-time use per link
- All submissions logged with IP and timestamp

---

## 11. Admission Conversion

### The Journey

```
        LEAD V2                               ADMISSION MODULE
  ┌──────────────────┐                   ┌──────────────────────┐
  │    leadMaster     │                   │     admissions       │
  │  ┌────────────┐   │                   │  ┌────────────────┐  │
  │  │ firstName  │   │                   │  │ leadId         │──┼──► leadMaster
  │  │ lastName   │   │                   │  │ studentId      │──┼──► student
  │  │ phone      │   │                   │  │ admissionDate  │  │
  │  │ status:    │───┼──► converted ─────┼─►│ enrolledClass  │  │
  │  │ converted  │   │                   │  │ academicYear   │  │
  │  └────────────┘   │                   │  │ status         │  │
  │                   │                   │  └────────────────┘  │
  │  family ──────────┼───────────────────┼─► (reused as-is)     │
  │  │                │                   │                      │
  │  ├── contacts ────┼───────────────────┼─► (reused as-is)     │
  │  └── siblings     │                   │                      │
  │                   │                   │  student             │
  │  leadProfile ─────┼───────────────────┼─►                    │
  │                   │                   │  ┌────────────────┐  │
  │  leadDocuments ───┼───────────────────┼─► │ name           │  │
  │                   │                   │  │ familyId       │──┼─► family
  │  leadActivity ────┼───────────────────┼─► │ admissionId    │──┼─► admissions
  │                   │                   │  │ profile data   │  │
  │  leadPayments ────┼───────────────────┼─► │ academic info  │  │
  │                   │                   │  └────────────────┘  │
  └──────────────────┘                   └──────────────────────┘
```

### What Happens During Conversion

1. **`leadMaster.status`** → `"converted"`
2. **`admissions`** record created with `leadId` and `studentId`
3. **`student`** record created — inherits from lead profile
4. **`family`** record is **reused** — nothing duplicated
5. **`familyContacts`** are **reused** — nothing duplicated
6. **`leadDocuments`** become student documents
7. **`leadActivity`** continues as student activity
8. **`leadPayments`** become student payments

### What Is Never Duplicated

- ❌ Family data
- ❌ Family contacts
- ❌ Contact numbers
- ❌ Communication history

### What Is Created Fresh

- ✅ Student record
- ✅ Admission record
- ✅ Academic history
- ✅ Fee structure (copied, then independently managed)

---

## 12. Student Relationship

### One Family, Many Students

```
                            ┌──────────────┐
                            │    family     │
                            │  Patel Family │
                            └──────┬───────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
     │   student 1   │      │   student 2   │      │   student 3   │
     │  Raj Patel    │      │  Priya Patel  │      │  (future)     │
     │  JEE Batch    │      │  NEET Batch   │      │               │
     └──────┬───────┘      └──────┬───────┘      └──────────────┘
            │                      │
            ▼                      ▼
     ┌──────────────┐      ┌──────────────┐
     │  attendance  │      │  attendance   │
     │  timetable   │      │  timetable    │
     │  exams       │      │  exams        │
     │  fees        │      │  fees         │
     │  results     │      │  results      │
     └──────────────┘      └──────────────┘

            ┌──────────────────────────────────────┐
            │          Shared by both:              │
            │  familyContacts (same parents!)       │
            │  Communication routed correctly:      │
            │    → Raj's attendance → Academic Cnt  │
            │    → Priya's fees    → Fee Contact    │
            └──────────────────────────────────────┘
```

### Key Principle

**Every student is linked to one family. Every family can have many students.**

- Parent contacts are shared across all siblings
- Communication routing uses role flags + student context
- Fee reminders go to `isPrimaryFeeContact` with correct student name
- Attendance alerts go to `isPrimaryAcademicContact` with correct student name

### Student Module (Future)

```
student
├── personalInfo (name, dob, gender, blood group, photo)
├── familyId ────► family (shared contacts)
├── admissionId ──► admission (enrollment details)
├── academicInfo (class, batch, program, subjects)
├── attendance (linked to timetable)
├── fees (inherits from admission fee structure)
├── exams (results, report cards)
├── timetable (class schedule)
├── documents (inherited from lead + new)
└── activity (continued timeline from lead)
```

---

## 13. Communication Examples

### Example 1: WhatsApp Fee Reminder

**Context:** Raj Patel (Student) — Fee Due

```
To: +91-9876543210
Contact: Sunita Patel (Mother)
Role: ⭐ Primary Fee Contact
Template: fee_reminder_student

"Dear Sunita Patel,

This is a reminder that Raj Patel's fee installment
of ₹5,000 is due on 20-Oct-2026.

Pay now: [payment link]

Thank you,
EEOS Institute"
```

### Example 2: Attendance Alert

**Context:** Priya Patel (Student) — Absent

```
To: +91-9876543211
Contact: Rajesh Patel (Father)
Role: ⭐ Primary Academic Contact

"Dear Rajesh Patel,

Your daughter Priya Patel was marked absent
for Mathematics class on 15-Oct-2026.

Please ensure regular attendance.

Regards,
EEOS Institute"
```

### Example 3: Marketing Promotion

**Context:** New batch announcement

```
To: +91-9876543212
Contact: Meera Patel (Mother)
Role: Marketing Contact

"Dear Meera Patel,

We are excited to announce our new Weekend
Crash Course for JEE 2027 starting next month!

Early bird discount available until 30-Oct.

Click to know more: [landing page]

Team EEOS"
```

### Example 4: Emergency Notification

**Context:** Institute closure

```
To: +91-9876543213
Contact: Vikram Patel (Guardian)
Role: Emergency Contact

"URGENT: Due to unforeseen circumstances,
EEOS Institute will remain closed on 18-Oct-2026.
All classes will be conducted online.

Zoom links will be shared shortly.

Stay safe,
EEOS Management"
```

### Example 5: Multi-Student Family — Fee Reminder

**Family:** Patel Family  
**Students:** Raj (JEE) + Priya (NEET)  
**Fee Contact:** Sunita Patel (Mother)

```
Message 1 (to Sunita):
"Dear Sunita Patel,

Fee summary for your children:

1. Raj Patel — JEE Foundation — ₹5,000 due 20-Oct
2. Priya Patel — NEET Foundation — ₹4,500 due 22-Oct

Total due: ₹9,500

Pay now: [payment link]

Thank you,
EEOS Institute"
```

### Communication Selection Logic

```
function getRecipients(studentId, communicationType):
    student = getStudent(studentId)
    family = getFamily(student.familyId)
    contacts = getFamilyContacts(family.id)

    switch communicationType:
        case "fee_reminder":
            return contacts.filter(c => c.isPrimaryFeeContact)
        case "attendance":
            return contacts.filter(c => c.isPrimaryAcademicContact)
        case "marketing":
            return contacts.filter(c => c.isMarketingContact)
        case "emergency":
            return contacts.filter(c => c.isEmergencyContact)
        case "general":
            return contacts.filter(c => c.isPrimaryContact)
        case "admission":
            return contacts.filter(c => c.isPrimaryDecisionMaker)
```

---

## 14. AI Opportunities

### 1. Smart Contact Recommendation

```
Context: Counsellor needs to call about fee discussion

AI Suggests:
  → Sunita Patel (Mother) — Primary Fee Contact
    ⭐ Preferred time: Evening (6-8 PM)
    ⭐ Language: Hindi
    ⭐ Previous call outcome: Positive
```

### 2. Admission Probability Prediction

```
Lead: Raj Patel, JEE Foundation, 3 months in pipeline

AI predicts: 78% conversion probability
Top factors:
  ✓ Both parents attended counselling
  ✓ Documents submitted (Aadhar, Marksheet)
  ✓ Attended demo class
  △ Fee discussion pending
  △ Competitor visited last week
```

### 3. Inactive Decision Maker Detection

```
Alert: Rajesh Patel (Father, Primary Decision Maker)
  has not been contacted in 14 days.

Action: Schedule follow-up with Primary Decision Maker
Suggested message: "Offer a family counselling session"
```

### 4. Follow-Up Sequence Optimization

```
Lead: Priya Patel, NEET Foundation, Stage: Interested

AI recommends:
  Day 1: Send WhatsApp with success story
  Day 3: Call (best time: 6 PM, Mother available)
  Day 5: Share demo class video
  Day 7: Offer family counselling
  Day 10: Send fee structure with early bird discount
```

### 5. Sibling Admission Prediction

```
Alert: Priya Patel (Student, Class 10)
  → Has younger sibling: Aarav (Class 8, interested in JEE)
  Predicted admission window: 14-18 months

Action: Create nurture sequence for sibling
```

### 6. Communication Sentiment Analysis

```
WhatsApp conversation analysis:
  Sentiment: Positive (72%)
  Key concerns: Fee structure, class timing
  Recommended next action: Schedule demo class
```

### 7. Marketing Attribution Scoring

```
Lead attribution breakdown:
  First touch: Facebook Ad → 30% attribution
  Last touch: WhatsApp campaign → 40% attribution
  Assists: Google Search (2 visits) → 30% attribution
```

### 8. Smart Document Verification

```
Document uploaded: Aadhar Card

AI checks:
  ✓ Name matches lead name
  ✓ DOB matches lead profile
  ✓ Document number valid format
  ✗ Photo quality low — request re-upload
```

---

## 15. Benefits

### Scalability

| Aspect | Capacity |
|--------|----------|
| Contacts per family | Unlimited |
| Siblings per family | Unlimited |
| Communication channels | Unlimited (WhatsApp, SMS, Email, In-app) |
| Student per family | Unlimited |
| Custom fields | Unlimited (JSON extensibility) |

### Normalization

| Principle | Implementation |
|-----------|---------------|
| No duplicate contacts | Single `familyContacts` table, reusable across siblings |
| No duplicate family data | Single `family` record per family unit |
| No hardcoded numbers | All comms reference `familyContactId` |
| One source of truth | Every data point has exactly one home |

### Business Verticals Supported

| Vertical | Suitability |
|----------|-------------|
| 🏫 Schools | ✅ Supports multiple parents, academic contacts |
| 🎓 Colleges | ✅ Supports guardian, fee contacts |
| 📚 Coaching Institutes | ✅ Supports sibling tracking, decision makers |
| 🏛️ Universities | ✅ Supports multi-contact, multi-student families |
| 🌐 International Education | ✅ Supports multiple languages, time zones |

### Cross-Cutting Concerns

| Concern | Support |
|---------|---------|
| ERP Integration | ✅ Normalized schema, clean references |
| AI/ML | ✅ Rich structured data for models |
| Mobile Apps | ✅ Role flags for app/portal access |
| Multi-channel Communication | ✅ Centralized contact management |
| Compliance (GDPR, etc.) | ✅ Single source for consent management |
| Reporting & Analytics | ✅ Clean joins, no data duplication |
| Future-Proofing | ✅ Extensible via custom fields and new entities |

---

## 16. Implementation Roadmap

### Phase 1 — Lead Profile (P0)

**Estimated effort:** 2-3 days  
**Dependencies:** None

**Tasks:**
- [ ] Create `leadProfile` table in schema
- [ ] Create `convex/leadProfile.ts` CRUD
- [ ] Create lead profile section in Lead Workspace
- [ ] Migrate existing profile fields from `leadMaster`
- [ ] Add progressive data collection UI

### Phase 2 — Family (P0)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `families` table in schema
- [ ] Create `convex/families.ts` CRUD
- [ ] Auto-create Family record on lead creation
- [ ] Family section in Lead Workspace
- [ ] Link existing leads to families

### Phase 3 — Family Contacts (P0)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 2

**Tasks:**
- [ ] Create `familyContacts` table in schema
- [ ] Create `convex/familyContacts.ts` CRUD
- [ ] Role flags system
- [ ] Contact management UI
- [ ] Migration: move `whatsappUsername`/`whatsappPin` from `leadMaster`
- [ ] Migration: create default contacts from existing lead data

### Phase 4 — Communication Integration (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 3

**Tasks:**
- [ ] Add `familyContactId` to `leadWhatsAppMessages`
- [ ] Create communication routing engine
- [ ] Update WhatsApp dialog to select contact
- [ ] Update notification system to use family contacts
- [ ] Create contact selector component

### Phase 5 — Sibling Tracking (P1)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 2

**Tasks:**
- [ ] Create `siblings` table in schema
- [ ] Create `convex/siblings.ts` CRUD
- [ ] Sibling section in Family view
- [ ] Convert sibling to lead workflow
- [ ] Sibling admission prediction UI

### Phase 6 — Marketing Attribution (P1)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `leadAttribution` table in schema
- [ ] Create `convex/leadAttribution.ts` CRUD
- [ ] Capture attribution on lead creation
- [ ] Marketing attribution dashboard widget
- [ ] UTM parameter parser

### Phase 7 — Dynamic Parent Forms (P2)

**Estimated effort:** 5-7 days  
**Dependencies:** Phase 1, 2, 3

**Tasks:**
- [ ] Form engine (dynamic form builder)
- [ ] Secure link generation with signed tokens
- [ ] Multi-step form UI (mobile-responsive)
- [ ] Document upload in forms
- [ ] Auto-update CRM on form submission
- [ ] Counsellor notification on submission
- [ ] Form templates (Enquiry, Registration, Medical, etc.)

### Phase 8 — Admission Engine (P2)

**Estimated effort:** 5-7 days  
**Dependencies:** Phase 1, 2, 3, 4

**Tasks:**
- [ ] `admissions` table in schema
- [ ] Admission conversion workflow
- [ ] Lead → Student transition logic
- [ ] Family reassignment for admission
- [ ] Document inheritance from lead
- [ ] Payment history inheritance

### Phase 9 — Student Engine (P2)

**Estimated effort:** 8-10 days  
**Dependencies:** Phase 8

**Tasks:**
- [ ] `students` table in schema
- [ ] Student profile management
- [ ] Multi-student family dashboard
- [ ] Academic tracking (attendance, exams, timetable)
- [ ] Fee management per student
- [ ] Communication routing per student
- [ ] Sibling dashboard

### Phase 10 — AI Features (P3)

**Estimated effort:** 10-15 days  
**Dependencies:** Phase 1-9

**Tasks:**
- [ ] Admission probability model
- [ ] Smart contact recommendation
- [ ] Follow-up sequence optimizer
- [ ] Inactive decision maker detection
- [ ] Sibling admission prediction
- [ ] Sentiment analysis
- [ ] Marketing attribution scoring

### Phase 11 — Legacy Cleanup (P3)

**Estimated effort:** 3-5 days  
**Dependencies:** Phase 1-9

**Tasks:**
- [ ] Deprecate moved fields from `leadMaster`
- [ ] Data migration scripts
- [ ] Remove deprecated UI sections
- [ ] Archive old data patterns

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Lead Profile | P0 | 3d | Low | High |
| 2. Family | P0 | 4d | Low | High |
| 3. Family Contacts | P0 | 5d | Low | Critical |
| 4. Communication Integration | P1 | 4d | Medium | High |
| 5. Sibling Tracking | P1 | 3d | Low | Medium |
| 6. Marketing Attribution | P1 | 3d | Low | Medium |
| 7. Dynamic Parent Forms | P2 | 7d | Medium | High |
| 8. Admission Engine | P2 | 7d | High | Critical |
| 9. Student Engine | P2 | 10d | High | Critical |
| 10. AI Features | P3 | 15d | High | High |
| 11. Legacy Cleanup | P3 | 5d | Medium | Medium |

---

## 17. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║                   LEAD V2 GOLDEN RULES                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  NEVER duplicate parent data.                             ║
║      └── Family is the single source of truth.                ║
║                                                              ║
║  2.  NEVER duplicate student data.                            ║
║      └── Student records reference, never copy.               ║
║                                                              ║
║  3.  Everything references LeadID.                            ║
║      └── All V2 entities are traceable back to the source.    ║
║                                                              ║
║  4.  Communication ALWAYS uses Family Contacts.               ║
║      └── No phone numbers stored outside familyContacts.      ║
║                                                              ║
║  5.  Admission NEVER copies Family.                           ║
║      └── Same family record serves lead AND student.          ║
║                                                              ║
║  6.  Student NEVER stores duplicate contacts.                 ║
║      └── Student uses familyId → shared contacts.             ║
║                                                              ║
║  7.  One source of truth.                                     ║
║      └── Every data point has exactly one home.               ║
║                                                              ║
║  8.  Entity first. Module second.                             ║
║      └── Design the data model before building UI.            ║
║                                                              ║
║  9.  Never break the existing Lead table.                     ║
║      └── `leadMaster` is production-critical, add don't       ║
║      modify.                                                  ║
║                                                              ║
║ 10.  Progressive data collection.                             ║
║      └── Never require V2 data to create a lead.              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase |
|--------|-----------|--------|-------|
| Lead (Marketing) | `leadMaster` | ✅ Existing | N/A |
| Lead Profile | `leadProfile` | 🔶 New | Phase 1 |
| Family | `families` | 🔶 New | Phase 2 |
| Family Contact | `familyContacts` | 🔶 New | Phase 3 |
| Sibling | `siblings` | 🔶 New | Phase 5 |
| Marketing Attribution | `leadAttribution` | 🔶 New | Phase 6 |
| Communication (WhatsApp) | `leadWhatsAppMessages` | ✅ Existing | Phase 4 |
| Communication (SMS) | `leadSmsMessages` | 🔶 New | Future |
| Communication (Email) | `leadEmailMessages` | 🔶 New | Future |
| Lead Documents | `leadDocuments` | ✅ Existing | N/A |
| Lead Activity | `leadActivity` | ✅ Existing | N/A |
| Lead Tasks | `leadTasks` | ✅ Existing | N/A |
| Lead Notes | `leadNotes` | ✅ Existing | N/A |
| Lead Payments | `leadPayments` | ✅ Existing | N/A |
| Lead Discounts | `leadDiscounts` | ✅ Existing | N/A |
| Lead Approvals | `leadApprovals` | ✅ Existing | N/A |
| Lead Courses | `leadCourses` | ✅ Existing | N/A |
| Call Logs | `callLogs` | ✅ Existing | N/A |
| Stage History | `leadStageHistory` | ✅ Existing | N/A |
| Lead Assignments | `leadAssignments` | ✅ Existing | N/A |
| Admission | `admissions` | 🔶 New | Phase 8 |
| Student | `students` | 🔶 New | Phase 9 |

## Appendix B: Entity Relationship Diagram (Text)

```
leadMaster
  │
  ├──1:1──► leadProfile
  ├──1:1──► leadAttribution
  ├──1:1──► families
  │           │
  │           ├──1:N──► familyContacts
  │           │            │
  │           │            └──► leadWhatsAppMessages
  │           │            └──► leadSmsMessages (future)
  │           │            └──► leadEmailMessages (future)
  │           │            └──► notifications
  │           │
  │           └──1:N──► siblings
  │                         │
  │                         └──► leadMaster (futureLeadId)
  │
  ├──1:N──► leadDocuments
  ├──1:N──► leadActivity
  ├──1:N──► leadStageHistory
  ├──1:N──► leadAssignments
  ├──1:N──► leadTasks
  ├──1:N──► leadNotes
  ├──1:N──► leadCourses
  ├──1:N──► leadDiscounts
  ├──1:N──► leadApprovals
  ├──1:N──► leadPayments
  ├──1:N──► callLogs
  │
  └──1:1──► admissions (Phase 8)
               │
               └──1:1──► students (Phase 9)
                            │
                            └──► families (reused)
                            └──► familyContacts (reused)
```

---

*End of DOC-05 — Lead V2 Architecture Bible*
