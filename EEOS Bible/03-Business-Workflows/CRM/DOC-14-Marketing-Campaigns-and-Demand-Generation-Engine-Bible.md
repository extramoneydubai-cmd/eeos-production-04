# DOC-14 — Marketing, Campaigns & Demand Generation Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Marketing & Demand Generation  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2 Architecture, DOC-09 — Communication Engine, DOC-10 — Workflow Engine, DOC-11 — Sales Engine  
> **Existing Tables:** `crmSources` (12 lead sources), `leadMaster` (with source, campaign, utm, channel, referralId fields)

---

## Table of Contents

1. [Marketing Philosophy](#1-marketing-philosophy)
2. [Marketing Lifecycle](#2-marketing-lifecycle)
3. [Marketing Channels](#3-marketing-channels)
4. [Campaign Management](#4-campaign-management)
5. [Lead Sources](#5-lead-sources)
6. [Landing Page Engine](#6-landing-page-engine)
7. [Marketing Attribution](#7-marketing-attribution)
8. [Audience Management](#8-audience-management)
9. [Event Management](#9-event-management)
10. [Referral Engine](#10-referral-engine)
11. [Marketing Automation](#11-marketing-automation)
12. [Content Management](#12-content-management)
13. [Marketing Dashboard](#13-marketing-dashboard)
14. [Marketing Analytics](#14-marketing-analytics)
15. [Cross Module Integration](#15-cross-module-integration)
16. [AI Opportunities](#16-ai-opportunities)
17. [Reports](#17-reports)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Golden Rules](#19-golden-rules)

---

## 1. Marketing Philosophy

### Purpose

The Marketing, Campaigns & Demand Generation Engine is the **entry point** of the EEOS customer journey. It owns every activity that generates enquiries before they enter CRM. Once a lead is captured and qualified, ownership transfers to CRM (DOC-05) and Sales (DOC-11).

### Core Principle

**Marketing creates demand. CRM manages leads. Sales converts leads. Admission enrolls students. Finance collects revenue. Marketing never owns Leads after qualification.**

### Business Rules

1. **Marketing owns the top of the funnel only.** Once a lead enters CRM, Marketing becomes a read-only consumer of attribution data.
2. **Every enquiry must have a source.** No lead enters the system without source attribution.
3. **Every campaign must have measurable ROI.** Marketing spend is tracked against conversions, admissions, and revenue.
4. **Every lead must have attribution.** First touch, last touch, and multi-touch attribution are tracked.
5. **No anonymous marketing spend.** Every rupee spent is associated with a campaign, channel, and expected ROI.
6. **Marketing does not own Leads.** After a lead is qualified and enters CRM, Sales owns the relationship.
7. **Templates are shared.** Marketing uses the same Communication Engine (DOC-09) as every other module.
8. **Workflows are shared.** Marketing automations use the same Workflow Engine (DOC-10) as every other module.
9. **Sources are master data.** Lead sources are managed through the Master Data Studio framework, shared across CRM, Marketing, and Sales.
10. **Audiences are segments.** Marketing defines audiences as filtered views of CRM and Student data — never duplicating data.

### Module Ownership Map

| Module | Owns |
|--------|------|
| **Marketing (DOC-14)** | Campaigns, sources, landing pages, referrals, events, attribution, segmentation |
| **CRM (DOC-05)** | Lead management, qualification, activity tracking |
| **Sales (DOC-11)** | Pipeline, counselling, conversion |
| **Communication (DOC-09)** | Message delivery, templates, channels |
| **Workflow (DOC-10)** | Automation rules, task creation, approvals |
| **Finance (DOC-08)** | Revenue tracking, payment data |
| **Admission (DOC-06)** | Enrollment, student creation |

### The Marketing Golden Flow

```
Campaign Planning
      │
      ├── Audience Definition
      │     └── Segments
      │
      ├── Channel Selection
      │     └── Multi-channel mix
      │
      ├── Content & Creative
      │     └── Landing pages, ads, emails, brochures
      │
      ├── Campaign Execution
      │     └── Launch on selected channels
      │
      ├── Enquiry Generation
      │     └── Lead capture via forms, calls, walk-ins, referrals
      │
      ├── Lead Capture
      │     └── Enter CRM (DOC-05) with source + attribution
      │
      ├── Lead Qualification
      │     └── Sales qualifies the lead (DOC-11)
      │
      ├── Conversion
      │     └── Lead becomes customer (DOC-06)
      │
      ├── Revenue
      │     └── Payment collected (DOC-08)
      │
      └── ROI Measurement
            └── Cost vs. Revenue per campaign
```

---

## 2. Marketing Lifecycle

### Complete Lifecycle

```
Campaign Planning
  │
  ├── Define Objective (Brand / Lead Gen / Event / Referral)
  ├── Set Budget
  ├── Define Target Audience
  ├── Select Channels
  └── Create Content & Landing Pages
      │
      ▼
Campaign Launch
  │
  ├── Multi-channel Distribution
  ├── Tracking Parameters (UTM)
  ├── Landing Pages Live
  └── Lead Capture Active
      │
      ▼
Lead Generation
  │
  ├── Organic Enquiries (Website, SEO, Referral, Walk-in)
  ├── Paid Enquiries (Google Ads, Facebook, Instagram, YouTube, LinkedIn)
  ├── Event Enquiries (Seminar, Workshop, Education Fair, Open House)
  ├── Outbound Enquiries (Telecalling, Email, WhatsApp Broadcast)
  └── Partner Enquiries (School, College, Corporate, Agency)
      │
      ▼
Lead Capture → CRM
  │
  ├── Source Attribution (First Touch)
  ├── Campaign Attribution (UTM Data)
  ├── Channel Attribution
  └── Referral Attribution (if applicable)
      │
      ▼
Lead Qualification (Sales)
  │
  ├── Budget Fit
  ├── Decision Maker
  ├── Timeline
  └── Program Match
      │
      ▼
Sales Pipeline (DOC-11)
  │
  ├── Counselling
  ├── Demo
  ├── Fee Discussion
  └── Admission Ready
      │
      ▼
Enrollment (DOC-06)
  │
  └── Revenue (DOC-08)
      │
      ▼
ROI Analysis
  │
  ├── Cost Per Lead
  ├── Cost Per Admission
  ├── Revenue Per Campaign
  └── Return on Ad Spend (ROAS)
```

### Stage Detail

| Stage | Marketing Role | CRM Role | Sales Role | Output |
|-------|---------------|----------|------------|--------|
| **Campaign Planning** | Define goal, budget, audience, channels | — | Provide feedback on qualified lead profiles | Campaign brief |
| **Campaign Launch** | Execute on channels, track UTM, manage landing pages | — | — | Impressions, clicks, visits |
| **Lead Generation** | Lead capture from all channels | Accept lead data | — | Raw enquiries |
| **Lead Capture → CRM** | Pass source, campaign, UTM data | Store lead with attribution | — | Lead records in CRM |
| **Lead Qualification** | — | Qualification scoring | Assign counsellor | Qualified leads |
| **Sales Pipeline** | Retargeting campaigns | Stage tracking | Conversion activities | Converted leads |
| **Enrollment** | — | Update status | Handoff to admission | Students |
| **Revenue** | Campaign ROI calculation | — | Revenue attribution | ROAS |
| **Retention Marketing** | Alumni/student campaigns | — | — | Repeat revenue, referrals |

---

## 3. Marketing Channels

### Channel Classification

| Channel Type | Channels | Purpose | Lead Source Code |
|-------------|----------|---------|-----------------|
| **Paid Digital** | Google Ads, Facebook Ads, Instagram Ads, YouTube Ads, LinkedIn Ads | Paid lead generation | `GADS`, `FB`, `IG`, `YT`, `LI` |
| **Organic Digital** | Website, SEO, YouTube Organic, LinkedIn Organic | Inbound enquiries | `WEB`, `YT`, `LI` |
| **Social Media** | Facebook, Instagram, YouTube, LinkedIn, Twitter/X, Telegram | Brand awareness + engagement | `FB`, `IG`, `YT`, `LI`, `TW` |
| **Messaging** | WhatsApp, SMS, Email | Direct communication | `WA`, `SMS`, `EMAIL` |
| **Offline** | Walk-in, Phone Call, Referral | Traditional enquiries | `WALK`, `PHONE`, `REF` |
| **Events** | Seminar, Workshop, Education Fair, Open House, Campus Drive | High-touch engagement | `SEM`, `WS`, `EDFAIR`, `OH`, `CAMPUS` |
| **Partners** | Schools, Colleges, Corporate, Agencies, Affiliates | Channel partner leads | `SCH`, `COL`, `CORP`, `AGENCY`, `AFF` |
| **Outbound** | Telecalling, Email Broadcast, WhatsApp Broadcast | Proactive outreach | `TC`, `EBLAST`, `WABLAST` |

### Existing Lead Sources (from crmSources.ts)

The following 12 lead sources are already implemented in the Master Data Studio:

| # | Source | Code | Color | Icon | Description |
|---|--------|------|-------|------|-------------|
| 1 | Website | WEB | #4285f4 | Globe | Organic website visits and form submissions |
| 2 | Walk-in | WALK | #34a853 | UserRound | Direct walk-in enquiries at the center |
| 3 | WhatsApp | WA | #25D366 | MessageCircle | Enquiries via WhatsApp messages |
| 4 | Facebook | FB | #1877F2 | Facebook | Facebook page and ad enquiries |
| 5 | Instagram | IG | #E4405F | Instagram | Instagram profile and ad enquiries |
| 6 | Google Ads | GADS | #fbbc04 | Search | Google Ads campaign enquiries |
| 7 | Referral | REF | #a855f7 | UserPlus | Referred by existing students or partners |
| 8 | Seminar | SEM | #e8710a | Presentation | Enquiries from seminars and workshops |
| 9 | Education Fair | EDFAIR | #1a73e8 | BookOpen | Enquiries from education fairs |
| 10 | YouTube | YT | #FF0000 | Youtube | YouTube channel and ad enquiries |
| 11 | LinkedIn | LI | #0A66C2 | Linkedin | LinkedIn profile and ad enquiries |
| 12 | Other | OTH | #5f6368 | Ellipsis | Other sources not listed above |

### Channel-Level Tracking Fields (Already in leadMaster)

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `source` | string | Lead Source name | "Facebook", "Google Ads" |
| `campaign` | optional string | Campaign name | "summer_2026_offer" |
| `utm` | optional string | Full UTM string | "utm_source=facebook&utm_medium=cpc&utm_campaign=summer_2026" |
| `channel` | optional string | Specific sub-channel | "instagram_story", "google_search" |
| `referralId` | optional Id("users") | Referrer user | User who referred this lead |

---

## 4. Campaign Management

### Campaign Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Campaign name (e.g. "Summer 2026 Batch") |
| `code` | string | Unique campaign code (e.g. "S26-BATCH") |
| `objective` | string | Campaign objective: `brand`, `lead_generation`, `event`, `referral`, `retention` |
| `type` | string | Campaign type: `digital`, `print`, `event`, `outbound`, `partner`, `referral` |
| `budget` | number | Total campaign budget |
| `spent` | number | Amount spent so far |
| `startDate` | number | Campaign start timestamp |
| `endDate` | number | Campaign end timestamp |
| `status` | string | `planning`, `active`, `paused`, `completed`, `cancelled` |
| `ownerId` | Id("users") | Campaign manager |
| `branchId` | optional Id("branches") | Target branch |
| `verticalId` | optional Id("verticals") | Target vertical |
| `programIds` | optional array of Id("academicPrograms") | Target programs |
| `targetLeads` | number | Expected lead count |
| `targetRevenue` | number | Expected revenue |
| `actualLeads` | number | Actual lead count |
| `actualRevenue` | number | Actual revenue from converted leads |
| `utmSource` | string | UTM source parameter |
| `utmMedium` | string | UTM medium parameter |
| `utmCampaign` | string | UTM campaign parameter |
| `utmTerm` | optional string | UTM term parameter |
| `utmContent` | optional string | UTM content parameter |
| `channels` | array of strings | Channels used in this campaign |
| `landingPageIds` | optional array of Id("landingPages") | Associated landing pages |
| `contentIds` | optional array of Id("marketingContent") | Associated content assets |
| `notes` | optional string | Internal notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Campaign Lifecycle

```
Planning → Pending Approval → Active → Paused (optional) → Completed → Archived
```

### Campaign Objective Types

| Objective | Description | Success Metrics |
|-----------|-------------|-----------------|
| **Brand Awareness** | Increase brand visibility | Impressions, reach, engagement |
| **Lead Generation** | Generate new enquiries | Leads, CPL, conversion rate |
| **Event Registration** | Drive event attendance | Registrations, attendance, post-event leads |
| **Referral** | Encourage existing community referrals | Referral leads, conversion rate |
| **Retention** | Engage existing students/parents | Engagement, repeat enrollment, NPS |
| **Admission Drive** | Convert existing leads to admissions | Admission rate, revenue |

---

## 5. Lead Sources

### Source Entity (Already Implemented)

The `crmSources` table is fully implemented through the Master Data Studio framework. Each source has:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Source display name |
| `code` | string | Unique source code |
| `color` | string | Hex color for UI badges |
| `icon` | string | Lucide icon name |
| `description` | optional string | Source description |
| `sequence` | number | Display order |
| `active` | boolean | Whether source is active |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Source Classification

Sources can be classified by category:

| Category | Sources |
|----------|---------|
| **Paid Digital** | Google Ads, Facebook, Instagram, YouTube, LinkedIn |
| **Organic Digital** | Website, SEO, YouTube, LinkedIn |
| **Social** | Facebook, Instagram, YouTube, LinkedIn, Twitter/X |
| **Messaging** | WhatsApp, SMS, Email |
| **Offline** | Walk-in, Phone Call |
| **Events** | Seminar, Education Fair, Workshop, Open House |
| **Referral** | Referral, Partner |
| **Traditional** | Newspaper, Hoarding, Radio, TV |
| **Outbound** | Telecalling, Email Blast |
| **API** | API, Webhook, Zapier |

### Lead Source Attribution Flow

```
Enquiry Arrives
      │
      ├── Has known source → Lookup in CRM Sources
      │     └── Create lead with source ID
      │
      ├── Has UTM parameters → Parse and store
      │     └── Extract utm_source, utm_medium, utm_campaign, utm_term, utm_content
      │
      ├── Has campaign reference → Link to campaign
      │
      └── No source → Mark as "Unknown" for manual classification
```

---

## 6. Landing Page Engine

### Purpose

Landing pages are dedicated web pages designed to capture leads from specific campaigns. Each landing page has a form that feeds directly into CRM with full attribution data.

### Landing Page Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Page name (e.g. "Summer 2026 - Mumbai") |
| `slug` | string | URL-friendly slug (e.g. "summer-2026-mumbai") |
| `campaignId` | optional Id("campaigns") | Associated campaign |
| `branchId` | optional Id("branches") | Target branch |
| `verticalId` | optional Id("verticals") | Target vertical |
| `programId` | optional Id("academicPrograms") | Target program |
| `headline` | string | Page headline |
| `subheadline` | optional string | Page subheadline |
| `ctaText` | string | Call-to-action button text |
| `fields` | array of form field configs | Form field configuration |
| `thankYouMessage` | string | Message shown after form submission |
| `redirectUrl` | optional string | Redirect URL after submission |
| `style` | string | Template style: `modern`, `classic`, `minimal`, `branded` |
| `status` | string | `draft`, `published`, `archived` |
| `publishedUrl` | optional string | Live URL |
| `views` | number | Total views |
| `submissions` | number | Total form submissions |
| `conversionRate` | number | Submissions / Views |
| `utmSource` | optional string | Pre-configured UTM source |
| `utmMedium` | optional string | Pre-configured UTM medium |
| `utmCampaign` | optional string | Pre-configured UTM campaign |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Landing Page Flow

```
User clicks ad/link
      │
      ▼
Loads landing page with UTM parameters
      │
      ▼
User fills form
      │
      ▼
Form submission
      │
      ├── Validate fields
      ├── Check for duplicate lead (by phone)
      ├── Create lead in CRM with:
      │     ├── source → Derived from UTM source
      │     ├── campaign → Campaign name
      │     ├── utm → Full UTM string
      │     ├── channel → UTM medium
      │     └── branchInterestId → From page config
      │
      ├── Show thank you message or redirect
      │
      └── Trigger marketing automation (DOC-10)
            └── Send welcome WhatsApp/Email
```

### Form Field Types

| Field Type | Options |
|-----------|---------|
| Text | Name, Email, Location, City |
| Phone | Phone number (with country code) |
| Select | Program, Branch, Vertical, Course |
| Checkbox | Interests, Agreements |
| Radio | Preferred Mode, Gender |
| Textarea | Message, Query |
| Hidden | UTM fields, Source, Campaign, Referral ID |

### Hidden Fields (Auto-populated)

Every landing page form must include these hidden fields:

| Field | Source |
|-------|--------|
| `utm_source` | From URL parameter |
| `utm_medium` | From URL parameter |
| `utm_campaign` | From URL parameter |
| `utm_term` | From URL parameter |
| `utm_content` | From URL parameter |
| `gclid` | Google Click ID (Google Ads) |
| `fbclid` | Facebook Click ID (Facebook Ads) |
| `page_url` | Landing page URL |
| `referrer_url` | Referring URL |
| `device` | Device type (mobile/desktop/tablet) |
| `ip` | IP address |

---

## 7. Marketing Attribution

### Purpose

Attribution determines which marketing channel, campaign, or touchpoint deserves credit for a lead conversion. Every lead in EEOS carries its attribution data from first touch to conversion.

### Existing Attribution Fields (Already in leadMaster)

| Field | Type | Purpose |
|-------|------|---------|
| `source` | string | Lead Source — First touch attribution |
| `campaign` | optional string | Campaign name referencing the originating campaign |
| `utm` | optional string | Full UTM parameter string |
| `channel` | optional string | Specific channel/sub-channel |
| `referralId` | optional Id("users") | Referrer user ID |

### Attribution Models

| Model | Description | Best For |
|-------|-------------|----------|
| **First Touch** | Credit goes to the first channel that brought the lead | Understanding top-of-funnel effectiveness |
| **Last Touch** | Credit goes to the channel that converted the lead | Understanding conversion drivers |
| **Multi-Touch** | Credit distributed across all touchpoints | Full-funnel understanding |
| **Linear** | Equal credit to all touchpoints | Balanced view |
| **Time Decay** | More credit to recent touchpoints | Short sales cycles |
| **U-Shaped** | 40% first touch, 40% lead creation, 20% middle | B2B / complex sales |

### Touchpoint Tracking

When a lead interacts with multiple channels before converting, each touchpoint is recorded:

| Field | Type | Description |
|-------|------|-------------|
| `leadId` | Id("leadMaster") | Associated lead |
| `touchpointType` | string | `ad_click`, `form_submission`, `email_open`, `email_click`, `whatsapp_click`, `landing_page`, `website_visit` |
| `channel` | string | Channel name |
| `source` | string | Source name |
| `campaign` | optional string | Campaign name |
| `utmSource` | optional string | UTM source |
| `utmMedium` | optional string | UTM medium |
| `utmCampaign` | optional string | UTM campaign |
| `url` | optional string | Touchpoint URL |
| `device` | optional string | Device type |
| `ip` | optional string | IP address |
| `timestamp` | number | Touchpoint time |

### Attribution Reporting

| Report | Description |
|--------|-------------|
| **First Touch Report** | Lead volume by first touch source |
| **Last Touch Report** | Conversion credit by last touch source |
| **Multi-Touch Report** | Full attribution distribution |
| **Campaign Attribution** | Revenue by campaign |
| **Channel Performance** | Leads, conversions, revenue by channel |
| **UTM Report** | Performance by UTM parameters |
| **Source-to-Revenue** | Full funnel from source to payment |

---

## 8. Audience Management

### Purpose

Audience management allows marketing to define target segments based on CRM data, student data, and demographic attributes. Segments are defined as filter criteria — never as duplicated data.

### Audience Segment Definition

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Segment name (e.g. "Engineering Aspirants - Delhi NCR") |
| `description` | optional string | Segment description |
| `type` | string | `lead`, `student`, `alumni`, `parent`, `mixed` |
| `criteria` | object | Filter criteria (see below) |
| `estimatedCount` | number | Estimated audience size |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Segment Criteria Examples

#### Lead Segments
```
{
  "source": ["Facebook", "Instagram", "Google Ads"],
  "vertical": "Competitive",
  "branch": "NP",
  "stage": ["new", "attempted", "connected"],
  "priority": ["high", "critical"],
  "createdDate": { "from": "2026-01-01", "to": "2026-06-30" },
  "location": ["Delhi", "Noida", "Gurgaon"]
}
```

#### Student Segments
```
{
  "program": "NEET 2026",
  "attendance": { "below": 75 },
  "feeStatus": "pending",
  "branch": "KL"
}
```

#### Parent Segments
```
{
  "childrenProgram": ["CBSE-10", "CBSE-12"],
  "feeOverdue": { "days": 30 },
  "communicationPreference": "whatsapp"
}
```

### Pre-built Audiences

| Audience | Criteria | Use Case |
|----------|----------|----------|
| **Hot Leads** | Priority = critical, Stage = negotiation | Urgent follow-up |
| **New Enquiries** | Created in last 7 days, Stage = new | Welcome sequence |
| **Inactive Leads** | No activity in 30 days, Stage != lost | Re-engagement |
| **High-Value Prospects** | Expected revenue > 1,00,000 | Premium counselling |
| **At-Risk Students** | Attendance < 75% | Intervention campaign |
| **Fee Defaulters** | Invoice overdue > 30 days | Collection campaign |
| **Alumni Network** | Status = alumni | Referral campaigns |
| **Birthday Month** | Birth month = current month | Birthday offers |

### Audience → Campaign Flow

```
Campaign Created
      │
      ├── Select existing audience
      │     └── OR define new segment criteria
      │
      ├── System calculates estimated count
      │
      ├── Campaign launched to audience
      │     └── Communication via DOC-09
      │
      └── Campaign results tracked against segment
```

---

## 9. Event Management

### Purpose

Events (seminars, workshops, open houses, education fairs) are high-touch marketing activities that generate qualified leads. Every event must track registration, attendance, leads captured, and ROI.

### Event Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Event name |
| `type` | string | `seminar`, `workshop`, `demo_day`, `education_fair`, `career_guidance`, `open_house`, `parent_meeting`, `corporate_event` |
| `description` | optional string | Event description |
| `mode` | string | `online`, `offline`, `hybrid` |
| `location` | optional string | Physical venue |
| `onlineLink` | optional string | Online meeting link |
| `startDate` | number | Event start timestamp |
| `endDate` | number | Event end timestamp |
| `capacity` | number | Maximum attendees |
| `registrationCount` | number | Registered attendees |
| `attendanceCount` | number | Actual attendees |
| `leadCount` | number | Leads generated from event |
| `conversionCount` | number | Leads that converted to admissions |
| `budget` | number | Event budget |
| `actualCost` | number | Actual event cost |
| `status` | string | `planned`, `upcoming`, `ongoing`, `completed`, `cancelled` |
| `ownerId` | Id("users") | Event organizer |
| `branchId` | optional Id("branches") | Hosting branch |
| `facultyIds` | optional array of Id("users") | Participating faculty |
| `campaignId` | optional Id("campaigns") | Associated campaign |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Event Lifecycle

```
Planned → Open for Registration → Upcoming → Ongoing → Completed → Archived
```

### Event Lead Capture

```
User registers for event
      │
      ├── Create lead (if new) with source = event type
      ├── Track event registration
      │
      ▼
User attends event
      │
      ├── Mark attendance
      │
      ▼
Post-event follow-up
      │
      ├── Send thank you via DOC-09
      ├── Schedule counselling call
      └── Add to campaign attribution
```

### Event ROI Calculation

```
Event ROI = (Revenue from Event Leads) - (Event Cost) / (Event Cost) × 100
```

### Event Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Registration Rate | Registration / Capacity |
| Attendance Rate | Attendance / Registration |
| Lead Capture Rate | Leads / Attendance |
| Conversion Rate | Admissions / Leads × 100 |
| Cost Per Lead | Total Cost / Leads |
| Cost Per Admission | Total Cost / Admissions |
| Revenue Generated | Total revenue from event leads |
| Event ROI | (Revenue - Cost) / Cost × 100 |

---

## 10. Referral Engine

### Purpose

The Referral Engine tracks and rewards referrals from existing students, parents, alumni, employees, and partners. Referrals consistently convert at higher rates than cold leads.

### Referral Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `referrerType` | string | `student`, `parent`, `alumni`, `employee`, `partner` |
| `referrerId` | Id("users") | Referrer user |
| `referrerName` | string | Referrer display name |
| `referrerPhone` | string | Referrer phone number |
| `refereeName` | string | Referred person's name |
| `refereePhone` | string | Referred person's phone |
| `refereeLeadId` | optional Id("leadMaster") | Generated lead ID |
| `status` | string | `pending`, `contacted`, `converted`, `rewarded`, `expired` |
| `rewardType` | optional string | `cash`, `discount`, `voucher`, `gift` |
| `rewardAmount` | optional number | Reward value |
| `rewardStatus` | optional string | `pending`, `approved`, `paid` |
| `sourceId` | Id("crmSources") | Source = Referral |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Referral Types

| Type | Referrer | Typical Reward | Best For |
|------|----------|---------------|----------|
| **Student Referral** | Current student | Fee discount, cash reward | Scalable growth |
| **Parent Referral** | Parent of student | Fee discount | Trusted source |
| **Alumni Referral** | Alumni | Cash reward, gift | Credibility |
| **Employee Referral** | Employee | Cash bonus | Internal motivation |
| **Partner Referral** | School/college/agency | Commission, revenue share | B2B channel |

### Referral Lifecycle

```
Referrer shares referral link/code
      │
      ├── Referee fills form with referral code
      │
      ├── Lead created with source = "Referral", referralId = referrer
      │
      ├── Lead enters CRM/Sales pipeline
      │
      ├── Lead converts to admission
      │
      ├── System validates referral
      │
      ├── Reward approved
      │
      └── Reward disbursed
```

### Referral Tracking

| Metric | Description |
|--------|-------------|
| Referral Sent | Links/codes shared |
| Referral Opened | Referee visited page |
| Referral Converted | Referee became lead |
| Lead Qualified | Referee entered sales pipeline |
| Admission | Referee enrolled |
| Reward Paid | Referrer rewarded |
| Conversion Rate | Admissions / Referrals × 100 |
| Average Reward | Total rewards / rewarded referrals |

---

## 11. Marketing Automation

### Purpose

Marketing automation handles lead nurturing, retargeting, and follow-up sequences through the Workflow Engine (DOC-10) and Communication Engine (DOC-09).

### Automation Triggers (via DOC-10)

| Event | Workflow |
|-------|----------|
| **Lead Created** | Send welcome WhatsApp/Email, assign to counsellor |
| **Lead Not Contacted in 24h** | Send reminder to counsellor |
| **Lead Not Contacted in 72h** | Escalate to manager |
| **Counselling Scheduled** | Send confirmation, calendar invite |
| **Counselling Completed** | Send summary, next steps |
| **Demo Scheduled** | Send demo details, reminders |
| **Demo Completed** | Send feedback form, follow-up |
| **Admission Ready** | Send fee structure, payment link |
| **Payment Received** | Send receipt, welcome pack |
| **Birthday** | Send birthday greeting with offer |
| **Lead Inactive 30 Days** | Send re-engagement email |
| **Lead Inactive 60 Days** | Send final offer |
| **Attendance < 75%** | Send alert to parent |
| **Fee Overdue 7 Days** | Send reminder |
| **Fee Overdue 30 Days** | Escalate to collections |

### Nurture Sequences

A nurture sequence is a series of timed communications triggered by lead actions.

#### Welcome Sequence (New Lead)

```
Day 0: Welcome WhatsApp/Email with program overview
Day 1: Success story/testimonial
Day 3: Branch/campus tour invite
Day 5: Scholarship/fee discount offer
Day 7: Counselling scheduling invite
Day 14: Follow-up if no response
Day 30: Re-engagement with new offer
```

#### Exam Prep Sequence (Competitive Exam Lead)

```
Day 0: Subject-wise syllabus overview
Day 1: Sample questions by topic
Day 3: Mock test invite
Day 5: Performance analysis offer
Day 7: Faculty introduction video
Day 10: Topper success story
Day 14: Counselling call invite
```

#### Re-engagement Sequence (Inactive Lead)

```
Day 0: "We miss you" message
Day 3: New program announcement
Day 5: Limited-time discount offer
Day 7: Event/campus visit invite
Day 10: Final call offer
```

### Automation Configuration

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Sequence name |
| `trigger` | string | Trigger event (e.g. "lead_created") |
| `conditions` | object | Optional filter conditions |
| `steps` | array | Ordered list of actions |
| `status` | string | `active`, `paused`, `draft` |
| `campaignId` | optional Id("campaigns") | Associated campaign |

### Step Configuration

| Field | Type | Description |
|-------|------|-------------|
| `order` | number | Step sequence |
| `delay` | string | Delay before execution (e.g. "0d", "1d", "3d", "7d", "14d", "30d") |
| `action` | string | `send_whatsapp`, `send_email`, `send_sms`, `create_task`, `update_lead`, `add_tag`, `call_api`, `webhook` |
| `templateId` | optional Id("commTemplates") | Communication template (DOC-09) |
| `assigneeId` | optional Id("users") | Task assignee |
| `tagValue` | optional string | Tag to add |

---

## 12. Content Management

### Purpose

Content management tracks marketing assets (brochures, videos, blog posts, testimonials, case studies, images, creatives) and associates them with campaigns.

### Content Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Asset name |
| `type` | string | `brochure`, `video`, `blog`, `testimonial`, `success_story`, `image`, `creative`, `case_study`, `whitepaper`, `infographic` |
| `description` | optional string | Asset description |
| `url` | string | Asset URL/path |
| `thumbnailUrl` | optional string | Thumbnail URL |
| `campaignIds` | optional array of Id("campaigns") | Associated campaigns |
| `tags` | optional array of string | Content tags |
| `language` | optional string | Content language |
| `size` | optional number | File size (bytes) |
| `format` | optional string | File format |
| `createdBy` | Id("users") | Content creator |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Content Types

| Type | Examples | Use Case |
|------|----------|----------|
| **Brochure** | Course brochure, campus brochure | Distributable offline/online |
| **Video** | Faculty intro, campus tour, success story | Social media, YouTube, website |
| **Blog** | Career guidance, exam tips, industry trends | SEO, inbound marketing |
| **Testimonial** | Student/parent reviews | Social proof, landing pages |
| **Success Story** | Detailed case study | High-trust content, email series |
| **Creative** | Ad banners, social media posts | Paid campaigns, social media |
| **Whitepaper** | Industry reports, research | Credibility, B2B |
| **Infographic** | Visual data representation | Shareable content |

---

## 13. Marketing Dashboard

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  MARKETING DASHBOARD                                         │
│  [Date Range: ▼] [Branch: ▼] [Campaign: ▼] [Refresh]        │
├─────────────────────────────────────────────────────────────┤
│  Active Campaigns   Leads Today   Cost/Lead   ROAS          │
│  ┌──────────┐      ┌──────────┐  ┌─────────┐ ┌──────────┐ │
│  │    8     │      │    47    │  │   ₹320  │ │   4.2x  │ │
│  │  running  │      │  today   │  │  avg    │ │ return  │ │
│  └──────────┘      └──────────┘  └─────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Leads Over Time (Chart)              Budget Utilization    │
│  ┌──────────────────────────┐        ┌────────────────────┐ │
│  │  ████████████            │        │  ████████████████   │ │
│  │  ████████████████████    │        │  ₹4.2L / ₹10L      │ │
│  │  ████████████████████████│        │   42% used          │ │
│  └──────────────────────────┘        └────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Top Channels                 Top Campaigns                  │
│  ┌──────────┬──────┬────────┐ ┌──────────┬──────┬────────┐ │
│  │ Channel  │Leads │ CPL   │ │ Campaign │Leads │ Conv%  │ │
│  ├──────────┼──────┼────────┤ ├──────────┼──────┼────────┤ │
│  │ Facebook │ 234  │ ₹280  │ │ Summer26 │ 145  │ 34%    │ │
│  │ G Ads    │ 189  │ ₹350  │ │ NEET 26  │ 112  │ 28%    │ │
│  │ Referral │ 78   │ ₹45   │ │ Career   │ 89   │ 42%    │ │
│  │ Instagram│ 156  │ ₹310  │ │ Open Day │ 67   │ 38%    │ │
│  └──────────┴──────┴────────┘ └──────────┴──────┴────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Source-to-Revenue Funnel                                    │
│  ┌──────┬──────────┬───────┬─────────┬────────┬──────────┐ │
│  │Source│  Leads   │Qual.  │Couns.   │Adm.    │ Revenue  │ │
│  ├──────┼──────────┼───────┼─────────┼────────┼──────────┤ │
│  │Web   │ 1,234    │ 678   │ 345     │ 123    │ ₹61.5L   │ │
│  │FB    │ 890      │ 456   │ 234     │ 78     │ ₹39.0L   │ │
│  │Ref   │ 234      │ 189   │ 145     │ 89     │ ₹44.5L   │ │
│  └──────┴──────────┴───────┴─────────┴────────┴──────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Campaign Performance Table                                  │
│  ┌─────┬────────┬──────┬──────┬──────┬──────┬──────┬──────┐│
│  │ #   │Campaign│Budget│Spent │Leads │Adm.  │Rev.  │ROAS  ││
│  ├─────┼────────┼──────┼──────┼──────┼──────┼──────┼──────┤│
│  │ 1   │Summer  │ 2.0L │ 1.2L │ 145  │ 49   │24.5L │ 20.4x││
│  │ 2   │NEET 26 │ 1.5L │ 0.8L │ 112  │ 31   │21.7L │ 27.1x││
│  │ 3   │Career  │ 0.8L │ 0.5L │ 89   │ 37   │18.5L │ 37.0x││
│  └─────┴────────┴──────┴──────┴──────┴──────┴──────┴──────┘│
└─────────────────────────────────────────────────────────────┘
```

### Dashboard KPIs

| KPI | Description | Calculation |
|-----|-------------|-------------|
| **Active Campaigns** | Currently running campaigns | Count where status = "active" |
| **Leads Today** | Leads captured today | Count where createdAt = today |
| **Cost Per Lead** | Average cost per lead | Total spent / Total leads |
| **ROAS** | Return on ad spend | Revenue from campaign / Campaign spend |
| **Conversion Rate** | Lead to admission rate | Admissions / Leads × 100 |
| **Budget Utilization** | Budget consumed | Total spent / Total budget × 100 |
| **Referral Rate** | Referral leads / total leads | Referral leads / All leads × 100 |
| **Channel Mix** | Lead distribution by channel | Percentage per channel |
| **Attribution Share** | Revenue credit by source | Revenue per source / Total revenue × 100 |

---

## 14. Marketing Analytics

### Key Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Impressions** | Number of ad views | — |
| **Clicks** | Number of ad clicks | — |
| **CTR** | Click-through rate (Clicks/Impressions × 100) | > 2% |
| **CPC** | Cost per click (Spend/Clicks) | < ₹20 |
| **CPM** | Cost per 1,000 impressions (Spend/Impressions × 1,000) | < ₹200 |
| **CPA** | Cost per admission (Spend/Admissions) | Depends on program |
| **CPL** | Cost per lead (Spend/Leads) | < ₹500 |
| **ROAS** | Return on ad spend (Revenue/Spend × 100) | > 10x |
| **ROI** | Return on investment ((Revenue - Cost)/Cost × 100) | > 5x |
| **Lead Quality Score** | Qualified leads / Total leads × 100 | > 40% |
| **Admission Rate** | Admissions / Leads × 100 | > 5% |
| **Revenue Attribution** | Revenue assigned to marketing | 100% of lead-sourced revenue |

### Analytics Dimensions

| Dimension | Description | Drill-downs |
|-----------|-------------|-------------|
| **Source** | Lead source | Per source: leads, CPL, conversion rate |
| **Campaign** | Marketing campaign | Per campaign: budget, spend, ROAS |
| **Channel** | Channel type | Per channel: impressions, CTR, CPC |
| **Branch** | Target branch | Per branch: lead volume, CPL |
| **Vertical** | Academic vertical | Per vertical: conversion rate, revenue |
| **Program** | Academic program | Per program: lead quality, admission rate |
| **Time** | Daily/weekly/monthly | Trends, seasonality, YoY comparison |
| **Location** | Geographic source | Per city/region: lead volume, CPL |
| **Device** | Device type | Mobile vs desktop: conversion rate |
| **UTM Parameters** | Full UTM data | Per UTM combination: performance |

### Analytics Reports

| Report | Description | Frequency |
|--------|-------------|-----------|
| **Daily Lead Report** | Yesterday's lead volume by source | Daily |
| **Weekly Campaign Report** | Campaign performance, spend, ROAS | Weekly |
| **Monthly Marketing Review** | Full funnel analysis, budget vs actual | Monthly |
| **Quarterly ROI Analysis** | Long-term attribution, program-level ROI | Quarterly |
| **Channel Performance** | Channel comparison, CPC trends | Weekly |
| **Conversion Funnel** | Source-to-revenue funnel by campaign | Monthly |
| **Attribution Report** | First/last/multi-touch attribution | Monthly |

---

## 15. Cross Module Integration

### Integration Map

```
Marketing (DOC-14)
      │
      ├──→ CRM (DOC-05)
      │     └── Lead creation with source, campaign, UTM, attribution
      │     └── Lead activity timeline (campaign events)
      │
      ├──→ Sales (DOC-11)
      │     └── Source-to-revenue tracking
      │     └── Campaign ROI via pipeline revenue
      │
      ├──→ Communication (DOC-09)
      │     └── Campaign messages, nurture sequences
      │     └── Template usage tracking
      │
      ├──→ Workflow (DOC-10)
      │     └── Marketing automations, nurture sequences
      │     └── Lead assignment rules
      │
      ├──→ Finance (DOC-08)
      │     └── Revenue attribution for marketing ROI
      │     └── Campaign budget tracking (read-only)
      │
      ├──→ Admission (DOC-06)
      │     └── Enrollment source tracking
      │     └── Campaign-to-admission attribution
      │
      ├──→ Student (DOC-07)
      │     └── Retention campaigns
      │     └── Referral: student → referral → lead
      │
      └──→ HR (DOC-13)
            └── Employee referral tracking
            └── Marketing team KPIs
```

### Ownership Handoff Protocol

```
Stage 1: Campaign Planning
  └── Owner: Marketing
      ├── Audience defined from CRM/Student data (read-only query)
      ├── Budget approved by Finance
      └── Content created

Stage 2: Campaign Execution
  └── Owner: Marketing
      ├── Launch on channels
      ├── Landing pages live
      └── Tracking active

Stage 3: Lead Capture
  └── Owner: Marketing → CRM
      ├── Lead created in CRM with full attribution
      ├── Duplicate check by phone
      └── Welcome automation triggered

Stage 4: Lead Qualification
  └── Owner: CRM → Sales
      ├── Lead scored and prioritized
      ├── Assigned to counsellor
      └── Marketing reads status (no write)

Stage 5: Conversion
  └── Owner: Sales → Admission
      ├── Enrolled as student
      ├── Revenue recorded in Finance
      └── Marketing ROI computed

Stage 6: Post-Conversion
  └── Owner: Marketing (retention campaigns)
      ├── Referral program
      ├── Alumni engagement
      └── Cross-sell/upsell
```

### Integration with Existing Codebase

| Existing File | What It Does | DOC-14 Integration |
|---------------|-------------|-------------------|
| `crmSources.ts` | 12 default lead sources with CRUD | Phase 1 — Extend with source classification, cost tracking |
| `crmLeads.ts` | Lead creation with source, campaign, utm fields | Phase 1 — Marketing attribution already built in |
| `crmActivity.ts` | Lead activity timeline | Phase 5 — Campaign events feed activity |
| `crmHelpers.ts` | `logActivity` for timeline | Phase 5 — Marketing events use same helper |
| `notifications.ts` | In-app notifications | Phase 3 — Campaign updates, lead notifications |
| `crmCRM.ts` | CRM functions re-export | Phase 1 — Marketing stats queries |

---

## 16. AI Opportunities

### 1. Campaign Recommendation

AI suggests campaign parameters based on historical performance.

```
Input:  Branch, Vertical, Budget
Output: Recommended channels, audience, budget allocation, expected ROI
```

### 2. Audience Prediction

AI predicts which audience segments will convert best for a given program.

```
Input:  Program, Branch, Season
Output: Top 5 audience segments with predicted conversion rate
```

### 3. Creative Suggestions

AI generates ad copy, headline variations, and CTA suggestions based on campaign parameters.

```
Input:  Campaign objective, target audience, program details
Output: 3-5 headline/CTA variations with engagement prediction
```

### 4. Budget Allocation

AI recommends optimal budget distribution across channels.

```
Input:  Total budget, channels, historical performance
Output: Budget allocation by channel with expected CPL and ROAS
```

### 5. Lead Quality Prediction

AI predicts which incoming leads will convert before qualification.

```
Input:  Lead source, campaign, time, day, device
Output: Conversion probability score (0-100)
```

### 6. Best Channel Prediction

AI recommends the best channel for each campaign based on program and audience.

```
Input:  Program, target audience, budget, season
Output: Channel ranking with expected CPL
```

### 7. Best Time to Send

AI predicts the optimal time to send campaign communications for maximum engagement.

```
Input:  Target audience, channel, program
Output: Best day and time with engagement probability
```

### 8. ROI Forecast

AI forecasts campaign ROI before launch.

```
Input:  Campaign parameters, budget, historical data
Output: Forecast: leads, CPL, admissions, revenue, ROAS
```

### 9. Content Generation

AI generates marketing content (brochure text, email copy, social posts, landing page copy).

```
Input:  Program details, target audience, content type
Output: Draft content for review
```

### 10. Anomaly Detection

AI detects unusual patterns in campaign performance.

```
Input:  Campaign performance data stream
Output: Alert: "Facebook CPL increased 40% in last 24 hours"
```

---

## 17. Reports

### Report Catalog

| # | Report Name | Description | Frequency |
|---|-------------|-------------|-----------|
| 1 | **Campaign Performance Report** | Budget, spend, leads, CPL, conversions, ROAS per campaign | Weekly |
| 2 | **Channel Performance Report** | Impressions, clicks, CTR, CPC, CPL, ROAS per channel | Weekly |
| 3 | **Lead Source Report** | Lead volume, conversion rate, revenue by source | Monthly |
| 4 | **ROI Report** | Revenue vs cost by campaign, channel, source | Monthly |
| 5 | **UTM Report** | Performance breakdown by UTM parameters | Weekly |
| 6 | **Landing Page Report** | Views, submissions, conversion rate per landing page | Weekly |
| 7 | **Referral Report** | Referral send, conversion, reward status | Monthly |
| 8 | **Event Report** | Registration, attendance, leads, cost per event | Per event |
| 9 | **Marketing Funnel** | Source → Lead → Qualified → Counselling → Admission → Revenue | Monthly |
| 10 | **Budget Utilization** | Budget vs actual by campaign and department | Monthly |
| 11 | **Attribution Report** | First/last/multi-touch credit distribution | Monthly |
| 12 | **Cost Analysis** | Total marketing cost breakdown by category | Monthly |

### Sample Report: Campaign Performance

```
CAMPAIGN PERFORMANCE REPORT
Generated: 2026-07-08
Period: Q2 2026 (Apr-Jun)
Branch: All | Vertical: All

┌─────────────┬────────┬──────┬──────┬──────┬──────┬────────┬──────┐
│ Campaign    │Budget  │Spent │Leads │CPL   │Adm.  │Revenue │ROAS  │
├─────────────┼────────┼──────┼──────┼──────┼──────┼────────┼──────┤
│ Summer 26   │ 2,00,000│1,20,000│ 145 │ ₹828 │ 49   │24,50,000│ 20.4x│
│ NEET 26     │ 1,50,000│ 80,000│ 112 │ ₹714 │ 31   │21,70,000│ 27.1x│
│ Career Day  │  80,000│ 50,000│  89 │ ₹562 │ 37   │18,50,000│ 37.0x│
│ Open House  │  50,000│ 35,000│  67 │ ₹522 │ 26   │13,00,000│ 37.1x│
│ Referral    │  20,000│  5,000│  78 │  ₹64 │ 42   │21,00,000│ 420x │
├─────────────┼────────┼──────┼──────┼──────┼──────┼────────┼──────┤
│ TOTAL       │ 5,00,000│2,90,000│ 491 │ ₹591 │ 185  │98,70,000│ 34.0x│
└─────────────┴────────┴──────┴──────┴──────┴──────┴────────┴──────┘
```

### Sample Report: Source-to-Revenue Funnel

```
SOURCE-TO-REVENUE FUNNEL REPORT
Period: Q2 2026 | Branch: All

┌──────────┬────────┬────────┬────────┬────────┬────────┬──────────┐
│ Source   │ Leads  │ Qual.  │Couns.  │ Adm.   │ Conv%  │ Revenue  │
├──────────┼────────┼────────┼────────┼────────┼────────┼──────────┤
│ Website  │ 1,234  │ 678    │ 345    │ 123    │ 10.0%  │ ₹61,50,000│
│ Facebook │ 890    │ 456    │ 234    │ 78     │ 8.8%   │ ₹39,00,000│
│ Referral │ 234    │ 189    │ 145    │ 89     │ 38.0%  │ ₹44,50,000│
│ Google   │ 567    │ 312    │ 167    │ 56     │ 9.9%   │ ₹28,00,000│
│ Walk-in  │ 345    │ 278    │ 189    │ 78     │ 22.6%  │ ₹39,00,000│
│ Instagram│ 456    │ 234    │ 123    │ 45     │ 9.9%   │ ₹22,50,000│
│ Event    │ 189    │ 145    │ 89     │ 34     │ 18.0%  │ ₹17,00,000│
│ YouTube  │ 123    │ 67     │ 45     │ 12     │ 9.8%   │ ₹6,00,000 │
│ LinkedIn │ 89     │ 56     │ 34     │ 8      │ 9.0%   │ ₹4,00,000 │
│ WhatsApp │ 234    │ 145    │ 89     │ 34     │ 14.5%  │ ₹17,00,000│
│ Other    │ 178    │ 89     │ 56     │ 23     │ 12.9%  │ ₹11,50,000│
├──────────┼────────┼────────┼────────┼────────┼────────┼──────────┤
│ TOTAL    │ 4,539  │ 2,649  │ 1,516  │ 580    │ 12.8%  │₹2,90,00K │
└──────────┴────────┴────────┴────────┴────────┴────────┴──────────┘
```

---

## 18. Implementation Roadmap

### Phase Plan

| Phase | Focus | Key Features | Effort | Dependencies |
|-------|-------|-------------|--------|-------------|
| **P1** | Campaign Management | Campaign entity, CRUD, status lifecycle | 2 weeks | Master Data Studio framework |
| **P1** | Source Enhancement | Source classification, category, cost tracking | 1 week | Existing `crmSources.ts` |
| **P2** | Lead Sources | Enhanced source management, UTM field support | 1 week | Existing `leadMaster` fields |
| **P2** | Landing Pages | Landing page builder, form configurations, lead capture | 3 weeks | Campaign Management, CRM |
| **P3** | Referral Engine | Referral entity, tracking, rewards | 2 weeks | CRM, Student Management |
| **P3** | Event Management | Event entity, registration, attendance tracking | 2 weeks | Campaign Management |
| **P3** | Audience Segments | Segment builder, filter criteria, estimated count | 1 week | CRM, Student queries |
| **P4** | Marketing Automation | Nurture sequences, automation rules via DOC-10 | 3 weeks | Workflow Engine (DOC-10) |
| **P4** | Communication Integration | Campaign messages via DOC-09 | 2 weeks | Communication Engine (DOC-09) |
| **P5** | Attribution Engine | Touchpoint tracking, multi-touch models | 3 weeks | All preceding phases |
| **P5** | Marketing Dashboard | KPIs, charts, campaign overview | 2 weeks | All preceding phases |
| **P6** | Analytics & Reports | Full analytics pipeline, ROAS, funnel reports | 3 weeks | Attribution Engine |
| **P6** | AI Marketing | Campaign recommendations, lead quality prediction | 4 weeks | Analytics pipeline |

### Priority Matrix

```
Priority: P1 (Critical)           Priority: P2 (High)
  ├── Campaign Management          ├── Landing Pages
  └── Source Enhancement           └── Lead Sources

Priority: P3 (Medium)             Priority: P4 (Standard)
  ├── Referral Engine              ├── Marketing Automation
  ├── Event Management             └── Communication Integration
  └── Audience Segments

Priority: P5 (Low)                Priority: P6 (Future)
  ├── Attribution Engine           ├── Analytics & Reports
  └── Marketing Dashboard          └── AI Marketing
```

### Dependency Graph

```
Source Enhancement ──→ Lead Sources ──→ Attribution Engine
      │                                    │
      ▼                                    ▼
Campaign Management ──→ Landing Pages ──→ Marketing Dashboard
      │                                    │
      ├──→ Event Management                │
      ├──→ Referral Engine                 │
      └──→ Audience Segments               │
             │                             │
             ▼                             ▼
      Marketing Automation ──→ Analytics & Reports
             │                             │
             ▼                             ▼
      Communication Integration ──→ AI Marketing
```

---

## 19. Golden Rules

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          MARKETING GOLDEN RULES                               ║
║                                                              ║
║  1.  Marketing creates demand.                                ║
║                                                              ║
║  2.  CRM owns leads.                                          ║
║                                                              ║
║  3.  Sales owns conversion.                                   ║
║                                                              ║
║  4.  Finance owns revenue.                                    ║
║                                                              ║
║  5.  Every lead has a source.                                 ║
║                                                              ║
║  6.  Every campaign has attribution.                          ║
║                                                              ║
║  7.  Every rupee must have ROI.                               ║
║                                                              ║
║  8.  No marketing activity without measurement.               ║
║                                                              ║
║  9.  Marketing never duplicates CRM or Student data.          ║
║                                                              ║
║  10. Templates come from DOC-09, not from Marketing.          ║
║                                                              ║
║  11. Automation rules come from DOC-10, not from Marketing.   ║
║                                                              ║
║  12. Everything traceable. Everything auditable.              ║
║                                                              ║
║  13. Sources are master data, shared across all modules.      ║
║                                                              ║
║  14. Referral is a source type, not a separate system.        ║
║                                                              ║
║  15. Attribution data travels with the lead, always.          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendices

### Appendix A: Entity Summary

| Entity | Table (Proposed) | Key Fields | Linked To |
|--------|-----------------|------------|-----------|
| Campaign | `campaigns` | name, objective, budget, spent, status | Users, Branches, Verticals, Programs |
| Lead Source | `crmSources` | name, code, color, icon, sequence, active | LeadMaster |
| Landing Page | `landingPages` | name, slug, headline, fields, status | Campaigns, Branches, Verticals |
| Touchpoint | `leadTouchpoints` | type, channel, source, campaign, timestamp | LeadMaster |
| Audience Segment | `audienceSegments` | name, type, criteria, estimatedCount | — |
| Event | `marketingEvents` | name, type, mode, date, capacity, status | Campaigns, Branches, Users |
| Referral | `referrals` | referrerType, referrerId, refereePhone, status, reward | Users, LeadMaster |
| Content Asset | `marketingContent` | name, type, url, tags, language | Campaigns, Users |
| Referral | `referrals` | referrerType, referrerId, refereePhone, status | Users, LeadMaster, CRM Sources |

### Appendix B: Existing Code Integration Points

| Existing File | What It Does | DOC-14 Integration |
|---------------|-------------|-------------------|
| `crmSources.ts` | Lead source master data (CRUD + seed — 12 sources) | Phase 1 — Extend with classification, cost per source |
| `crmLeads.ts` | Lead CRUD with source, campaign, utm, channel, referralId fields | Phase 1 — Marketing attribution already built in |
| `crmActivity.ts` | Lead activity timeline queries | Phase 5 — Campaign events logged to timeline |
| `crmHelpers.ts` | `logActivity` for timeline logging | Phase 5 — Marketing events use same helper |
| `crmCRM.ts` | CRM function re-exports | Phase 5 — Marketing queries integrated |
| `notifications.ts` | In-app notification CRUD | Phase 3 — Campaign notifications for team |
| `crmDashboard.ts` | CRM dashboard queries | Phase 5 — Marketing dashboard uses parallel pattern |
| `users.ts` | User queries for referrer/owner lookup | Phase 3 — Referral engine uses user queries |
| `seed.ts` | Seed data with marketing department, sources, campaigns in lead data | Phase 1 — Extended seed for campaigns |

### Appendix C: Data Flow

```
Campaign Created
      │
      ▼
Landing Page Published (with UTM parameters)
      │
      ▼
Lead Captured via form
      │
      ├── leadMaster.source = source derived from UTM
      ├── leadMaster.campaign = campaign name
      ├── leadMaster.utm = full UTM string
      ├── leadMaster.channel = UTM medium
      └── leadMaster.referralId = referrer (if referral)
      │
      ▼
Lead enters CRM pipeline
      │
      ▼
Marketing reads lead status (read-only queries)
      │
      ├── Campaign: leads count, converted count, revenue
      ├── Source: lead volume by source
      └── Attribution: first/last touch reports
      │
      ▼
Campaign closed → ROI Report Generated
```

---

*End of DOC-14 — Marketing, Campaigns & Demand Generation Engine Bible*
