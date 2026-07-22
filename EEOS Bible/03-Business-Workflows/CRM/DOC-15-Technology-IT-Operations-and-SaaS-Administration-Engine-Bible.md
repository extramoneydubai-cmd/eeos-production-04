# DOC-15 — Technology, IT Operations & SaaS Administration Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Technology & IT Operations  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-00 — EEOS Master Index, DOC-09 — Communication, DOC-10 — Workflow, DOC-13 — HR  
> **Existing Infrastructure:** `github.ts` (GitHub API), `featureFlags.ts` (feature toggles), `instrumentation.tsx` (error monitoring), `http.ts` (routing), `crons.disabled.ts` (scheduler), `vly-integrations.ts` (Vly client), `auth.config.ts` (auth config)

---

## Table of Contents

1. [Technology Philosophy](#1-technology-philosophy)
2. [Technology Architecture](#2-technology-architecture)
3. [Hardware Inventory](#3-hardware-inventory)
4. [Software Inventory](#4-software-inventory)
5. [SaaS Subscription Management](#5-saas-subscription-management)
6. [Domain & DNS Management](#6-domain--dns-management)
7. [API Key Management](#7-api-key-management)
8. [Network Management](#8-network-management)
9. [Device Assignment](#9-device-assignment)
10. [Maintenance](#10-maintenance)
11. [Helpdesk](#11-helpdesk)
12. [Backup & Disaster Recovery](#12-backup--disaster-recovery)
13. [Platform Administration](#13-platform-administration)
14. [Security](#14-security)
15. [Monitoring](#15-monitoring)
16. [Technology Dashboard](#16-technology-dashboard)
17. [Cross Module Integration](#17-cross-module-integration)
18. [AI Opportunities](#18-ai-opportunities)
19. [Reports](#19-reports)
20. [Implementation Roadmap](#20-implementation-roadmap)
21. [Golden Rules](#21-golden-rules)

---

## 1. Technology Philosophy

### Purpose

The Technology, IT Operations & SaaS Administration Engine manages every technology asset used by the EEOS platform and its client organizations. This is the operational control center for infrastructure, devices, subscriptions, licenses, and SaaS administration.

### Core Principle

**HR owns people. Technology owns devices. Finance owns purchases. Workflow owns requests. Communication owns alerts.**

### Business Rules

1. **Technology owns all assets.** Every device, software license, and subscription is tracked in the Technology Engine.
2. **No hardware belongs to employees.** Employees are assigned assets — devices are owned by the organization.
3. **Everything is assigned.** Every asset has a current assignee or a known location.
4. **Everything is auditable.** Every change to an asset (assignment, transfer, repair, retirement) has a timestamp and actor.
5. **Finance owns purchases.** Technology specifies requirements; Finance processes payments.
6. **Workflow owns requests.** Asset requests, repairs, and replacements flow through DOC-10.
7. **Communication owns alerts.** License expiry, warranty expiry, and incident alerts go through DOC-09.
8. **One identity per device.** Every asset has a unique Asset ID with a known serial number.
9. **No orphan devices.** Assets cannot exist without an assignee or storage location.
10. **Licenses are finite.** Software and SaaS seats are tracked, and overallocation is prevented.

### Ownership Map

| Module | Owns |
|--------|------|
| **Technology (DOC-15)** | Hardware inventory, software, SaaS subscriptions, API keys, domains, network, monitoring, platform administration |
| **HR (DOC-13)** | Employee records, onboarding/offboarding triggers |
| **Finance (DOC-08)** | Purchase processing, budget approvals |
| **Workflow (DOC-10)** | Asset request/approval workflows, helpdesk tickets |
| **Communication (DOC-09)** | Alerts for expirations, incidents, renewals |

### The Technology Golden Flow

```
Employee Joins (HR)
      │
      ├── Technology receives onbaording trigger
      ├── Asset request created via DOC-10
      ├── Assigned laptop, monitor, accessories
      ├── Accounts created (email, ERP, tools)
      └── Employee active
      
Employee Transfers (HR)
      │
      ├── Asset reassignment if branch changes
      ├── New equipment if role requires
      └── Old equipment returned and reassigned

Employee Exits (HR)
      │
      ├── Technology receives offboarding trigger
      ├── All assets returned and inspected
      ├── All accounts deactivated
      ├── Licenses freed
      └── Employee alumni
```

---

## 2. Technology Architecture

### Architecture Overview

```
Organization Hierarchy (DOC-00 Masters)
      │
      ├── Companies
      ├── Branches
      ├── Departments
      └── Teams
            │
            ▼
Technology Asset Database
      │
      ├── Hardware (Laptops, Desktops, Monitors, Peripherals, Network, Biometric, CCTV)
      ├── Software (OS, Office, Design, Development, Security)
      ├── SaaS Subscriptions (AI, Communication, Infrastructure, Productivity)
      ├── API Keys & Secrets (Environment variables, tokens, certificates)
      ├── Domains & DNS (Registered domains, subdomains, SSL, CDN)
      └── Network Infrastructure (ISP, routers, switches, WiFi, VPN)
            │
            ├──→ Assignment Engine (Who has what?)
            ├──→ Maintenance Tracker (Warranty, AMC, Repairs)
            ├──→ Helpdesk (Incidents, Service Requests)
            ├──→ Monitoring (Health, Usage, Expiry)
            └──→ Reports (Asset Register, License Summary, Costs)
```

### Entity Relationships

```
┌────────────────────────────────────────────────────┐
│                   ASSET                             │
│  Asset ID │ Serial │ Type │ Status │ Location      │
│  Vendor │ Purchase Date │ Warranty │ Cost           │
│  Assigned To │ Condition │ Notes                    │
└──────────┬─────────────────────────────────────────┘
           │
           ├── Hardware Inventory
           │     └── Has Purchase Info → Finance
           │     └── Has Assignee → HR
           │     └── Has Maintenance History
           │
           ├── Software Inventory
           │     └── Has License Key / Subscription
           │     └── Has Seat Count & Usage
           │     └── Has Expiry Date
           │
           ├── SaaS Subscriptions
           │     └── Has Plan & Cost → Finance
           │     └── Has API Key
           │     └── Has Owner & Usage
           │
           └── Domains & Certificates
                 └── Has Registrar
                 └── Has Expiry Date
                 └── Has DNS Config
```

---

## 3. Hardware Inventory

### Hardware Asset Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `assetId` | string | Human-readable asset ID (e.g. `EEOS-HW-LT-0001`) |
| `type` | string | Asset type category |
| `subType` | string | Sub-category |
| `brand` | string | Manufacturer brand |
| `model` | string | Model name/number |
| `serialNumber` | string | Manufacturer serial number |
| `color` | optional string | Device color |
| `purchaseDate` | number | Date of purchase |
| `purchaseCost` | number | Purchase price |
| `vendor` | string | Vendor/supplier name |
| `vendorContact` | optional string | Vendor contact info |
| `warrantyStart` | optional number | Warranty start date |
| `warrantyEnd` | optional number | Warranty expiry date |
| `warrantyType` | optional string | `standard`, `extended`, `accidental` |
| `amcProvider` | optional string | AMC service provider |
| `amcEnd` | optional number | AMC expiry date |
| `status` | string | `available`, `assigned`, `repair`, `lost`, `retired`, `disposed` |
| `condition` | string | `new`, `excellent`, `good`, `fair`, `poor`, `damaged` |
| `assignedTo` | optional Id("users") | Current assignee |
| `assignedDate` | optional number | Date of last assignment |
| `location` | optional string | Physical location/storage |
| `branchId` | optional Id("branches") | Branch location |
| `departmentId` | optional Id("departments") | Department |
| `osVersion` | optional string | Operating system version |
| `specifications` | optional object | RAM, storage, processor specs |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Hardware Categories

| Category | Sub-Types | Typical Use |
|----------|-----------|-------------|
| **Laptop** | Standard, High-Performance, Ultrabook, Tablet Hybrid | Employee primary device |
| **Desktop** | Standard, Workstation, All-in-One, Thin Client | Office workstation |
| **Monitor** | 22", 24", 27", 32", Ultrawide, 4K | Productivity display |
| **Peripheral** | Keyboard, Mouse, Headset, Webcam, Speaker | Accessories |
| **Printer** | Laser, Inkjet, Multifunction, Label | Office printing |
| **Scanner** | Flatbed, Document, Portable | Document digitization |
| **Projector** | Standard, Short-throw, Interactive | Classroom, meeting room |
| **Tablet** | iPad, Android, Windows | Mobile teaching, demos |
| **Mobile** | Smartphone (iOS/Android) | Field staff, management |
| **Network** | Router, Switch, Firewall, Access Point, Modem | Infrastructure |
| **Server** | Tower, Rack, NAS, Microserver | Local hosting |
| **Power** | UPS, Power Backup, Stabilizer | Power protection |
| **Security** | Biometric Device, Face Attendance, CCTV, Door Lock | Physical security |
| **AV** | Smart TV, Digital Board, Interactive Panel, Sound System | Classroom tech |
| **IoT** | Smart Light, Sensor, Environmental Monitor | Smart campus |
| **Furniture** | Standing Desk, Office Chair, Monitor Arm | Ergonomic setup |

### Asset ID Format

```
EEOS-HW-{TYPE}-{SEQUENCE:5}

Examples:
EEOS-HW-LT-00001   → Laptop #1
EEOS-HW-DT-00042   → Desktop #42
EEOS-HW-MN-00100   → Monitor #100
EEOS-HW-NT-00005   → Network Router #5
```

### Hardware Lifecycle

```
Procurement → Receiving → Tagging → Assigning → Active Use
                                                      │
                                          ┌───────────┼───────────┐
                                          ▼           ▼           ▼
                                       Transfer    Repair      Return
                                          │           │           │
                                          ▼           ▼           ▼
                                       Reassign    Fixed      Inspection
                                                      │           │
                                                      ▼           ▼
                                                   Active     Retired
                                                                │
                                                                ▼
                                                            Disposed
```

---

## 4. Software Inventory

### Software License Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Software/product name |
| `publisher` | string | Publisher/vendor |
| `type` | string | `operating_system`, `office`, `design`, `development`, `security`, `productivity`, `communication`, `erp` |
| `licenseType` | string | `perpetual`, `subscription`, `volume`, `oem`, `free`, `open_source` |
| `licenseKey` | optional string | License key (encrypted) |
| `seatsTotal` | number | Total purchased/available seats |
| `seatsUsed` | number | Seats currently assigned |
| `version` | optional string | Software version |
| `purchaseCost` | optional number | Purchase or annual cost |
| `renewalDate` | optional number | Subscription renewal date |
| `renewalFrequency` | optional string | `monthly`, `annual`, `biannual` |
| `autoRenew` | boolean | Auto-renewal enabled |
| `status` | string | `active`, `expiring`, `expired`, `cancelled` |
| `assignedTo` | optional array of Id("users") | Users assigned this license |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Software Categories

| Category | Examples | License Model |
|----------|----------|---------------|
| **Operating System** | Windows 11, macOS, Ubuntu, ChromeOS | OEM / Volume |
| **Office Suite** | Microsoft 365, Google Workspace, LibreOffice | Subscription / Free |
| **Design Tools** | Adobe Creative Cloud, Figma, Canva Pro | Subscription |
| **Development** | VS Code, JetBrains IDEs, GitHub Copilot | Free / Subscription |
| **Security** | Antivirus, EDR, VPN Client, Password Manager | Subscription |
| **Communication** | Slack, Teams, Zoom, Google Meet | Subscription / Free |
| **ERP** | EEOS Platform, Convex, Custom CRM | SaaS |
| **AI Tools** | ChatGPT Plus, Claude Pro, Gemini Advanced | Subscription |

### Software License Lifecycle

```
Request → Approval (DOC-10) → Procurement → Assignment → Active
                                                              │
                                                              ├──→ Renewal (auto/manual)
                                                              └──→ Seat Reassignment
                                                                    │
                                                                    ▼
                                                              Free/Expired
```

---

## 5. SaaS Subscription Management

### SaaS Subscription Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `serviceName` | string | Service name (e.g. "OpenAI", "Convex") |
| `serviceUrl` | string | Official service URL |
| `category` | string | `ai`, `cloud`, `communication`, `monitoring`, `analytics`, `infrastructure`, `productivity`, `design`, `marketing` |
| `plan` | string | Plan name (e.g. "Pro", "Team", "Enterprise") |
| `costPerMonth` | optional number | Monthly cost in local currency |
| `costPerYear` | optional number | Annual cost |
| `billingCycle` | string | `monthly`, `annual`, `custom` |
| `billingOwner` | optional Id("users") | Person responsible for billing |
| `techOwner` | optional Id("users") | Technical owner/administrator |
| `startDate` | number | Subscription start date |
| `renewalDate` | optional number | Next renewal date |
| `autoRenew` | boolean | Auto-renewal enabled |
| `seatsTotal` | optional number | Total available seats |
| `seatsUsed` | optional number | Seats currently used |
| `usageLimit` | optional object | API calls, storage, bandwidth limits |
| `integrationType` | string | `api`, `sso`, `webhook`, `manual` |
| `envVarNames` | optional array of string | Required env variable names |
| `status` | string | `active`, `expiring_soon`, `expired`, `cancelled`, `trial` |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### SaaS Services Catalog

#### AI Services
| Service | Category | Env Vars | Typical Plan |
|---------|----------|----------|-------------|
| OpenAI / ChatGPT | AI | `OPENAI_API_KEY` | Pro / Team |
| Anthropic Claude | AI | `CLAUDE_API_KEY` | Pro / Team |
| Google Gemini | AI | `GEMINI_API_KEY` | Pro |
| GitHub Copilot | AI | — | Individual / Business |

#### Cloud & Infrastructure
| Service | Category | Env Vars | Typical Plan |
|---------|----------|----------|-------------|
| Convex | Cloud | `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL` | Pro / Enterprise |
| Vercel | Cloud | `VERCEL_TOKEN` | Pro / Team |
| Netlify | Cloud | — | Pro |
| AWS | Cloud | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Pay-as-you-go |
| Azure | Cloud | Azure connection string | Pay-as-you-go |
| DigitalOcean | Cloud | `DO_TOKEN` | Standard |
| Firebase | Cloud | Firebase config | Blaze |

#### Communication
| Service | Category | Env Vars | Typical Plan |
|---------|----------|----------|-------------|
| Twilio | Communication | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Pay-as-you-go |
| MSG91 | Communication | `MSG91_KEY` | Pay-as-you-go |
| SendGrid | Communication | `SENDGRID_API_KEY` | Free / Pro |
| AWS SES | Communication | SES credentials | Pay-as-you-go |
| WhatsApp Business API | Communication | `WHATSAPP_API_KEY` | Pay-as-you-go |
| OneSignal | Communication | `ONESIGNAL_APP_ID` | Free / Pro |

#### Monitoring
| Service | Category | Env Vars | Typical Plan |
|---------|----------|----------|-------------|
| Vly Monitoring | Monitoring | `VITE_VLY_APP_ID`, `VITE_VLY_MONITORING_URL` | Bundled |
| Sentry | Monitoring | `SENTRY_DSN` | Team |
| Datadog | Monitoring | `DD_API_KEY` | Pro |
| Cloudflare | Monitoring | `CLOUDFLARE_API_TOKEN` | Pro / Business |

#### Productivity & Collaboration
| Service | Category | Env Vars | Typical Plan |
|---------|----------|----------|-------------|
| Google Workspace | Productivity | — | Business |
| Microsoft 365 | Productivity | — | Business |
| Slack | Productivity | `SLACK_TOKEN` | Pro |
| Notion | Productivity | — | Team |
| GitBook | Productivity | — | Team |
| GitHub | Productivity | `GITHUB_TOKEN` | Team / Enterprise |
| Linear | Productivity | — | Team |

### SaaS Lifecycle

```
Discovery → Trial → Evaluation → Procurement → Onboarding → Active
                                                                │
                                                                ├──→ Usage Monitoring
                                                                ├──→ Renewal (auto/manual)
                                                                ├──→ Plan Upgrade/Downgrade
                                                                └──→ Cancellation
                                                                      │
                                                                      ▼
                                                                Offboarding
                                                                      │
                                                                      ├──→ Revoke API keys
                                                                      ├──→ Export data
                                                                      ├──→ Cancel billing
                                                                      └──→ Archive records
```

### Current EEOS SaaS Stack (from codebase)

| Service | Purpose | Status | Env Variables |
|---------|---------|--------|---------------|
| **Convex** | Backend & Database | ✅ Active | `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL` |
| **Convex Auth** | Authentication | ✅ Active | `JWKS`, `JWT_PRIVATE_KEY`, `SITE_URL` |
| **Vly Monitoring** | Error tracking | ✅ Active | `VITE_VLY_APP_ID`, `VITE_VLY_MONITORING_URL` |
| **Vly Integrations** | Third-party integrations | ✅ Active | `VLY_INTEGRATION_KEY` |
| **GitHub** | Source control, API | ✅ Active | `GITHUB_TOKEN` |
| **Vite** | Build tool | ✅ Active | — |

---

## 6. Domain & DNS Management

### Domain Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `domainName` | string | Domain name (e.g. "vedaedtech.com") |
| `registrar` | string | Domain registrar (e.g. "GoDaddy", "Namecheap", "Cloudflare") |
| `registrationDate` | number | Original registration date |
| `expiryDate` | number | Domain expiry date |
| `autoRenew` | boolean | Auto-renewal configured |
| `dnsProvider` | string | DNS hosting provider |
| `sslProvider` | string | SSL certificate provider |
| `sslExpiryDate` | optional number | SSL certificate expiry |
| `cdnProvider` | optional string | CDN provider (e.g. "Cloudflare") |
| `hostingProvider` | optional string | Web hosting provider |
| `subdomains` | optional array of objects | Subdomain records |
| `owner` | Id("users") | Domain owner/contact |
| `costPerYear` | optional number | Annual domain cost |
| `status` | string | `active`, `expiring_soon`, `expired`, `transferred` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Subdomain Record

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Subdomain name (e.g. "app", "api", "www") |
| `type` | string | DNS record type: `A`, `CNAME`, `MX`, `TXT`, `NS`, `AAAA` |
| `value` | string | Record value |
| `ttl` | number | Time to live (seconds) |
| `purpose` | string | Purpose description |

### Domain Lifecycle

```
Register → Configure DNS → Add SSL → Connect CDN → Active
                                                       │
                                                       ├──→ Renewal Reminder (30 days before)
                                                       ├──→ SSL Renewal (14 days before)
                                                       └──→ Transfer (if needed)
```

---

## 7. API Key Management

### API Key Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `keyName` | string | Key identifier (e.g. "OpenAI Production Key") |
| `service` | string | Service name (e.g. "OpenAI") |
| `envVarName` | string | Environment variable name (e.g. "OPENAI_API_KEY") |
| `purpose` | string | Purpose description |
| `createdDate` | number | Key creation date |
| `expiryDate` | optional number | Key expiry date |
| `lastRotated` | optional number | Last rotation date |
| `rotationFrequency` | optional string | `90_days`, `180_days`, `annual`, `manual` |
| `scope` | optional string | Key permissions/scope |
| `owner` | Id("users") | Key owner |
| `environment` | string | `production`, `staging`, `development`, `all` |
| `status` | string | `active`, `expiring`, `expired`, `revoked` |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Current API Keys (from codebase)

| Env Variable | Service | Purpose | File Location |
|-------------|---------|---------|---------------|
| `GITHUB_TOKEN` | GitHub | API access for issues, repos, PRs | `src/convex/github.ts` |
| `VITE_VLY_APP_ID` | Vly | App identification for monitoring | `src/instrumentation.tsx` |
| `VITE_VLY_MONITORING_URL` | Vly | Error reporting endpoint | `src/instrumentation.tsx` |
| `VLY_INTEGRATION_KEY` | Vly | Third-party integrations | `src/lib/vly-integrations.ts` |
| `CONVEX_SITE_URL` | Convex | Auth provider URL | `src/convex/auth.config.ts` |
| `JWKS` | Convex Auth | JWT key set | Auth config |
| `JWT_PRIVATE_KEY` | Convex Auth | JWT signing | Auth config |
| `SITE_URL` | Convex Auth | Site URL | Auth config |

### API Key Management Rules

1. **Secrets never committed.** API keys and secrets must never be hard-coded in source code.
2. **Environment variables only.** Keys are stored as environment variables, accessible via `process.env`.
3. **Rotation schedule.** Production keys should be rotated every 90-180 days.
4. **Least privilege.** Keys should have the minimum required permissions.
5. **Audit trail.** Every key creation, rotation, and revocation is logged.
6. **Emergency revocation.** Process to immediately revoke compromised keys.

---

## 8. Network Management

### Network Infrastructure Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `type` | string | `isp`, `router`, `switch`, `firewall`, `access_point`, `modem`, `vpn` |
| `name` | string | Device/connection name |
| `brand` | optional string | Manufacturer |
| `model` | optional string | Model number |
| `serialNumber` | optional string | Serial number |
| `ipAddress` | optional string | IP address |
| `branchId` | optional Id("branches") | Branch location |
| `ispName` | optional string | ISP name (for connections) |
| `bandwidth` | optional string | Bandwidth (e.g. "100 Mbps") |
| `staticIp` | optional string | Static IP address |
| `status` | string | `active`, `down`, `maintenance`, `decommissioned` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Network Monitoring Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Uptime | Service availability | < 99.5% |
| Bandwidth Usage | Current bandwidth utilization | > 80% |
| Latency | Network response time | > 50ms |
| Packet Loss | Percentage of lost packets | > 1% |
| Connected Devices | Number of connected devices | > 90% of capacity |
| WiFi Signal Strength | Access point signal quality | < -70 dBm |

---

## 9. Device Assignment

### Assignment Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `assetId` | Id("hardwareAssets") | Assigned hardware asset |
| `assignedTo` | Id("users") | Employee user |
| `assignedBy` | Id("users") | IT admin who assigned |
| `assignedDate` | number | Date of assignment |
| `expectedReturnDate` | optional number | Expected return date |
| `returnDate` | optional number | Actual return date |
| `receivedBy` | optional Id("users") | IT admin who received return |
| `conditionAtAssignment` | string | Asset condition when assigned |
| `conditionAtReturn` | optional string | Asset condition when returned |
| `accessories` | optional array of string | Accessories included |
| `purpose` | optional string | Purpose of assignment |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Assignment Lifecycle

```
HR Onboarding Trigger
      │
      ├── Check asset availability
      ├── Prepare device (OS install, software, accounts)
      ├── Assign to employee
      ├── Record accessories
      └── Update asset status → "assigned"

Transfer Request (DOC-10)
      │
      ├── Check new requirements
      ├── Transfer device OR assign new
      ├── Return old device
      └── Update records

HR Offboarding Trigger
      │
      ├── Notify IT for asset return
      ├── Collect all assigned assets
      ├── Inspect condition
      ├── Wipe data
      └── Update asset status → "available"
```

### Assignment Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  DEVICE ASSIGNMENTS                                         │
├─────────────────────────────────────────────────────────────┤
│  Total Assets: 245    │  Assigned: 198    │  Available: 47  │
├─────────────────────────────────────────────────────────────┤
│  Current Assignments                                        │
│  ┌──────┬──────────┬──────────────┬─────────┬───────────┐  │
│  │Asset │Employee  │Type          │Since    │Expected   │  │
│  ├──────┼──────────┼──────────────┼─────────┼───────────┤  │
│  │LT-01 │Arun K.   │Laptop - Dell │15 Jan 26│—          │  │
│  │MN-10 │Priya S.  │Monitor 27"   │15 Jan 26│—          │  │
│  │LT-02 │Rajesh P. │Laptop - HP   │01 Mar 26│—          │  │
│  │NT-03 │—         │Router - NP   │—        │—          │  │
│  └──────┴──────────┴──────────────┴─────────┴───────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Pending Returns (From HR Offboarding)                      │
│  │ Employee     │ Assets        │ Due Date       │ Status │
│  │ Sneha G.     │ LT-05, MN-12  │ 30 Jun 2026    │ ⚠ Pending│
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Maintenance

### Maintenance Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `assetId` | Id("hardwareAssets") | Asset being maintained |
| `type` | string | `preventive`, `corrective`, `amc`, `warranty_claim` |
| `description` | string | Issue description |
| `priority` | string | `low`, `medium`, `high`, `critical` |
| `reportedBy` | Id("users") | Person who reported issue |
| `reportedDate` | number | Date reported |
| `assignedTo` | optional Id("users") | IT staff assigned |
| `vendorAssigned` | optional string | Third-party vendor |
| `status` | string | `reported`, `diagnosing`, `in_progress`, `parts_ordered`, `completed`, `cancelled` |
| `resolution` | optional string | Resolution notes |
| `cost` | optional number | Repair cost |
| `billableTo` | optional string | `warranty`, `amc`, `organization`, `employee` |
| `completedDate` | optional number | Date completed |
| `downtime` | optional number | Downtime in hours |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Maintenance Types

| Type | Description | Schedule |
|------|-------------|----------|
| **Preventive** | Regular cleaning, updates, health checks | Quarterly / Bi-annual |
| **Corrective** | Fix reported issues | On-demand |
| **AMC** | Annual Maintenance Contract | Per contract |
| **Warranty Claim** | Manufacturer warranty service | Within warranty period |

---

## 11. Helpdesk

### Helpdesk Ticket Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `ticketId` | string | Ticket number (e.g. `HD-2026-0001`) |
| `type` | string | `incident`, `service_request`, `problem`, `change_request` |
| `category` | string | `hardware`, `software`, `network`, `account`, `access`, `other` |
| `subject` | string | Ticket subject |
| `description` | string | Detailed description |
| `priority` | string | `low`, `medium`, `high`, `critical` |
| `status` | string | `open`, `assigned`, `in_progress`, `pending`, `resolved`, `closed` |
| `reportedBy` | Id("users") | Person reporting |
| `assignedTo` | optional Id("users") | IT staff assigned |
| `slaDeadline` | optional number | SLA resolution deadline |
| `resolution` | optional string | Resolution notes |
| `resolutionDate` | optional number | Date resolved |
| `satisfactionRating` | optional number | 1-5 customer satisfaction |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Ticket Type Definitions

| Type | Definition | SLA Target |
|------|------------|------------|
| **Incident** | Service disruption (device broken, can't login) | Critical: 4h, High: 8h, Medium: 24h, Low: 48h |
| **Service Request** | New request (new software, access grant) | Standard: 24h |
| **Problem** | Root cause investigation for recurring incidents | Dependent on severity |
| **Change Request** | Planned change (upgrade, migration) | Planned per schedule |

### Helpdesk Flow

```
User submits ticket
      │
      ├── Auto-assigned based on category
      ├── SLA timer starts
      │
      ▼
IT staff receives notification (DOC-09)
      │
      ├── Acknowledge ticket
      ├── Diagnose issue
      │
      ▼
Resolution
      │
      ├── Fix remotely or on-site
      ├── Update ticket with resolution
      │
      ▼
User verification
      │
      ├── Mark as resolved
      ├── Rate satisfaction
      │
      ▼
Ticket closed
```

---

## 12. Backup & Disaster Recovery

### Backup Configuration

| Aspect | Primary | Secondary | Frequency |
|--------|---------|-----------|-----------|
| **Database** | Convex (automatic) | Daily export | Continuous |
| **Files** | Cloud storage (S3/GCS) | Local NAS | Hourly |
| **Media** | Cloud storage | Local archive | Daily |
| **Configuration** | Git repository | — | Per commit |
| **Environment Variables** | Vault / Secrets Manager | Encrypted export | Per change |

### Disaster Recovery Plan

#### Tier 1: Service Disruption (< 1 hour)
- **Scenario:** Application crash, database unavailable
- **Action:** Restart service, failover to replica
- **RTO:** 15 minutes
- **RPO:** < 5 minutes

#### Tier 2: Data Loss (< 4 hours)
- **Scenario:** Accidental data deletion, corruption
- **Action:** Restore from backup
- **RTO:** 2 hours
- **RPO:** < 1 hour

#### Tier 3: Infrastructure Failure (< 24 hours)
- **Scenario:** Cloud provider outage, data center down
- **Action:** Activate DR region, restore from latest backup
- **RTO:** 8 hours
- **RPO:** < 4 hours

#### Tier 4: Catastrophic Failure (< 72 hours)
- **Scenario:** Complete platform loss, security breach
- **Action:** Full rebuild from code + encrypted backup
- **RTO:** 48 hours
- **RPO:** < 24 hours

### Backup Retention Policy

| Data Type | Daily | Weekly | Monthly | Yearly |
|-----------|-------|--------|---------|--------|
| Database | 7 days | 4 weeks | 12 months | 3 years |
| Files | 3 days | 2 weeks | 3 months | 1 year |
| Media | — | — | 3 months | 1 year |
| Config | Git history (forever) | — | — | — |

---

## 13. Platform Administration

### Tenant Management

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `companyName` | string | Client organization name |
| `domain` | string | Client subdomain (e.g. "client.eeos.com") |
| `plan` | string | Subscription plan |
| `status` | string | `active`, `suspended`, `trial`, `cancelled` |
| `storageUsed` | number | Storage used in MB |
| `storageLimit` | number | Storage limit in MB |
| `userCount` | number | Number of active users |
| `userLimit` | number | Maximum allowed users |
| `branding` | object | White-label config |
| `featureFlags` | object | Enabled/disabled features |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### White-Label Configuration

| Field | Type | Description |
|-------|------|-------------|
| `logo` | string | Client logo URL |
| `primaryColor` | string | Brand primary color |
| `secondaryColor` | string | Brand secondary color |
| `favicon` | string | Custom favicon URL |
| `companyName` | string | Display company name |
| `emailDomain` | string | Custom email domain |
| `customDomain` | string | Custom domain (CNAME) |
| `theme` | string | `light`, `dark`, `system` |

### Feature Flags (Already in codebase)

| Flag | Name | Purpose | Default |
|------|------|---------|---------|
| `ENABLE_COLLECTION_DASHBOARD` | Collection Dashboard | CEO Collection cards on CRM Dashboard | `false` |
| `ENABLE_COLLECTIONS_PAGE` | Collections Page | Dedicated /collections dashboard | `false` |
| `ENABLE_AUTOMATION` | Daily Automation | Overdue installments + PDC reminders | `false` |

### Subscription Plans

| Plan | Users | Storage | Features | Typical Client |
|------|-------|---------|----------|---------------|
| **Starter** | 10 | 1 GB | CRM, basic reporting | Small coaching center |
| **Growth** | 50 | 10 GB | CRM, Finance, Communication | Medium institute |
| **Professional** | 200 | 50 GB | All modules, automation | Large college |
| **Enterprise** | Unlimited | Custom | All modules, white-label, SLA | University / chain |

---

## 14. Security

### Role-Based Access Control (RBAC)

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | System | Full system access, all tenants |
| `admin` | Organization | Organization-wide admin access |
| `manager` | Department | Department-level management |
| `staff` | Individual | Basic user access |

### Security Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| **Authentication** | Convex Auth (email OTP, anonymous) | ✅ Implemented |
| **Password Hashing** | SHA-256 (via Crypto API) | ✅ Implemented |
| **RBAC** | Role-based access (super_admin, admin, manager, staff) | ✅ Implemented |
| **User Scopes** | Per-user access controls (canAccessDashboard, etc.) | ✅ Implemented |
| **Environment Isolation** | Production vs development environments | ✅ Implemented |
| **API Key Management** | Server-side env vars via `process.env` | ✅ Implemented |
| **HTTP Validation** | Convex validator-based input validation | ✅ Implemented |
| **Session Management** | Convex Auth sessions | ✅ Implemented |

### Security Policies

| Policy | Requirement |
|--------|-------------|
| **Password Policy** | Minimum 8 characters, mixed case, numbers |
| **MFA** | Email OTP for sensitive operations |
| **Session Timeout** | 24 hours inactivity timeout |
| **API Rate Limiting** | 100 requests/minute per user |
| **Data Encryption at Rest** | Enabled (Convex platform) |
| **Data Encryption in Transit** | TLS 1.3 (HTTPS only) |
| **Audit Logging** | All entity changes logged to activity timelines |
| **Access Reviews** | Quarterly access review for admin accounts |

### Audit Logging

Every security-relevant event must be logged:

| Event | Logged Data | Retention |
|-------|------------|-----------|
| Login success | User, IP, timestamp, device | 12 months |
| Login failure | User/IP, timestamp, reason | 12 months |
| Password change | User, timestamp | 12 months |
| Role change | Changed by, target user, old/new role | 12 months |
| API key creation | Created by, service, timestamp | 12 months |
| API key revocation | Revoked by, service, timestamp | 12 months |
| Permission change | Changed by, target, old/new permissions | Permanent |
| Data export | User, scope, timestamp | 6 months |

---

## 15. Monitoring

### Monitoring Categories

| Category | Metrics | Tool |
|----------|---------|------|
| **Application Health** | Uptime, error rate, response time | Vly Monitoring, Sentry |
| **Server Health** | CPU, memory, disk, network | Cloud provider dashboard |
| **Database** | Query performance, connections, storage | Convex dashboard |
| **API Status** | Endpoint availability, response codes | Health checks |
| **Backup Status** | Last successful backup, backup size | Convex dashboard |
| **Certificate Expiry** | SSL/TLS certificate expiry dates | Automated alerts |
| **Domain Expiry** | Domain registration expiry | Automated alerts |
| **License Expiry** | SaaS subscription renewal dates | Automated alerts |
| **Device Status** | Online/offline, health score | Network monitoring |
| **Warranty Expiry** | Hardware warranty end dates | Automated alerts |

### Alert Thresholds

| Alert | Threshold | Channel | Escalation |
|-------|-----------|---------|------------|
| Application Down | 5xx > 5% in 5 minutes | Slack + Email | IT Manager after 30 min |
| Error Rate Spike | Error rate > 2x baseline | Slack | Tech Lead after 15 min |
| Certificate Expiry | 30 days before expiry | Email | Tech Owner |
| Domain Expiry | 30 days before expiry | Email | Domain Owner |
| Backup Failure | No backup in 24 hours | Slack + Email | IT Manager |
| Storage > 80% | Usage > 80% of limit | Slack | Tenant Admin |
| API Key Expiry | 30 days before rotation | Email | Key Owner |
| Device Offline | Critical device offline > 1 hour | Slack | IT Staff |

### Current Monitoring Implementation (from codebase)

| Feature | Implementation | How It Works |
|---------|---------------|-------------|
| **Error Tracking** | `src/instrumentation.tsx` | Catches runtime errors + unhandled promise rejections, reports to Vly monitoring URL |
| **Global Error Boundary** | `ErrorBoundary` component | Catches React render errors, displays fallback UI |
| **Vly Reporting** | `reportErrorToVly()` function | POSTs error data to `VITE_VLY_MONITORING_URL` with `VITE_VLY_APP_ID` |

---

## 16. Technology Dashboard

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  TECHNOLOGY DASHBOARD                                        │
│  [Branch: ▼] [Date Range: ▼] [Refresh]                     │
├─────────────────────────────────────────────────────────────┤
│  Total Assets   Assigned    Available    In Repair           │
│  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐      │
│  │   245    │  │  198   │  │   37    │  │    10    │      │
│  │  devices  │  │  in use │  │  free   │  │  service │      │
│  └──────────┘  └────────┘  └─────────┘  └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Active Subs   Expiring <30d  Domains Expiring  Licenses    │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────┐  │
│  │   24    │  │     3    │  │     1      │  │   8     │  │
│  │ services│  │  soon    │  │  expiring   │  │  active  │  │
│  └──────────┘  └──────────┘  └────────────┘  └─────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Asset Distribution by Type           Expiry Calendar        │
│  ┌──────────────────────────┐        ┌───────────────────┐  │
│  │ Laptops    ████████ 45% │        │ 15 Jul  - SSL Cert│  │
│  │ Monitors   ██████  30%  │        │ 22 Jul  - Domain  │  │
│  │ Peripherals███     15%  │        │ 05 Aug  - Convex  │  │
│  │ Network    ██      10%  │        │ 12 Aug  - Google  │  │
│  └──────────────────────────┘        └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Open Helpdesk Tickets                      Monthly Cost     │
│  ┌──────┬──────────┬─────────┬────────┐ ┌────────────────┐  │
│  │ # │ Category │ Priority│ Status │ │ SaaS:   ₹45,000│  │
│  ├──────┼──────────┼─────────┼────────┤ │ Domains: ₹2,500│  │
│  │ 1 │ Hardware │ High    │ In Prog│ │ Licenses:₹8,000│  │
│  │ 2 │ Software │ Medium  │ Open   │ │ Total: ₹55,500 │  │
│  └──────┴──────────┴─────────┴────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard KPIs

| KPI | Description | Calculation |
|-----|-------------|-------------|
| **Total Assets** | All tracked hardware | Count of hardware assets |
| **Assignment Rate** | Percentage of assets assigned | Assigned / Total × 100 |
| **Availability Rate** | Percentage of assets available | Available / Total × 100 |
| **Repair Rate** | Percentage of assets in repair | In Repair / Total × 100 |
| **Active Subscriptions** | Active SaaS subscriptions | Count where status = "active" |
| **Expiry Watch** | Items expiring within 30 days | Count where expiryDate < 30 days |
| **License Utilization** | Seats used vs total | Seats Used / Seats Total × 100 |
| **Open Tickets** | Currently open helpdesk tickets | Count where status != "closed" |
| **SLA Compliance Rate** | Tickets resolved within SLA | Resolved within SLA / Total resolved × 100 |
| **Monthly Tech Cost** | Total monthly technology spend | Sum of all SaaS + domain + license costs |

---

## 17. Cross Module Integration

### Integration Map

```
Technology (DOC-15)
      │
      ├──→ HR (DOC-13)
      │     └── Employee onboarding → asset assignment
      │     └── Employee transfer → asset reassignment
      │     └── Employee offboarding → asset return
      │
      ├──→ Finance (DOC-08)
      │     └── Asset procurement → purchase processing
      │     └── SaaS subscriptions → recurring billing
      │     └── License costs → expense tracking
      │
      ├──→ Workflow (DOC-10)
      │     └── Asset request → approval workflow
      │     └── Repair request → approval and assignment
      │     └── Helpdesk ticket → assignment and escalation
      │
      ├──→ Communication (DOC-09)
      │     └── Expiry alerts (licenses, domains, SSL, warranty)
      │     └── Helpdesk notifications
      │     └── Maintenance reminders
      │
      └──→ Platform
            └── Feature flags → application behavior
            └── API keys → service connectivity
            └── Monitoring → system health
```

### Integration Points with Existing Codebase

| Existing File | What It Does | DOC-15 Integration |
|---------------|-------------|-------------------|
| `github.ts` | GitHub API client with env var auth | Phase 3 — Track GitHub subscription, API key |
| `featureFlags.ts` | Collection Engine feature toggles | Phase 4 — Tenant-level feature flag management |
| `instrumentation.tsx` | Error monitoring and reporting | Phase 5 — Add uptime, API health checks |
| `http.ts` | HTTP router (auth routes) | Phase 3 — API gateway monitoring |
| `crons.disabled.ts` | Cron scheduler (disabled) | Phase 5 — Move to auto-enabled scheduler |
| `vly-integrations.ts` | Vly client configuration | Phase 3 — Track Vly subscription |
| `auth.config.ts` | Auth provider config | Phase 6 — SSO integration for tenant tenants |
| `users.ts` | User management | Phase 2 — Device assignment uses user records |
| `seed.ts` | Seed data | Phase 1 — Asset seed data for testing |
| `organization.ts` | Organization hierarchy (branches, depts) | Phase 1 — Asset location uses org hierarchy |

---

## 18. AI Opportunities

### 1. Predict Hardware Failure

ML model predicts hardware failure based on usage patterns, age, and maintenance history.

```
Input:  Asset type, age, usage hours, maintenance history, error logs
Output: Failure probability (0-100%), recommended replacement date
```

### 2. License Optimization

AI recommends license reallocation based on actual usage.

```
Input:  License seats, user activity, last login dates
Output: Unused seats to reclaim, recommended seat count
```

### 3. Cost Optimization

AI analyzes SaaS spending and recommends plan changes.

```
Input:  All SaaS subscriptions, usage metrics, per-seat cost
Output: Cost-saving recommendations (downgrade, consolidate, cancel)
```

### 4. Incident Classification

AI automatically categorizes and prioritizes helpdesk tickets.

```
Input:  Ticket subject + description
Output: Category, priority, recommended assignee
```

### 5. Auto Ticket Routing

AI routes tickets to the right team/person based on content.

```
Input:  Ticket type, category, description, assignee availability
Output: Recommended assignee with confidence score
```

### 6. Capacity Forecasting

AI predicts hardware and infrastructure needs based on headcount growth.

```
Input:  Headcount trends, current assets, department growth
Output: Recommended hardware procurement (type, quantity, timeline)
```

### 7. Security Anomaly Detection

AI detects unusual access patterns that may indicate security threats.

```
Input:  Login attempts, API usage, access patterns, location data
Output: Anomaly score, alert if above threshold
```

### 8. Infrastructure Health Score

AI computes an overall health score for the technology infrastructure.

```
Input:  All monitoring metrics, ticket volume, uptime, cost efficiency
Output: Health score (0-100), top 3 issues to address
```

---

## 19. Reports

### Report Catalog

| # | Report Name | Description | Frequency |
|---|-------------|-------------|-----------|
| 1 | **Asset Register** | Complete hardware inventory with status | Monthly |
| 2 | **Assignment Report** | Current assignments by employee | On-demand |
| 3 | **License Report** | Software licenses with usage and expiry | Monthly |
| 4 | **Subscription Report** | All SaaS subscriptions with cost and renewal | Monthly |
| 5 | **Warranty Report** | Hardware warranty status and upcoming expiry | Weekly |
| 6 | **Incident Report** | Helpdesk tickets by type, priority, status | Weekly |
| 7 | **Renewal Report** | All upcoming renewals (domains, SSL, licenses, subscriptions) | Weekly |
| 8 | **Infrastructure Report** | Network health, server status, monitoring metrics | Daily |
| 9 | **Platform Usage Report** | Tenant usage: users, storage, feature adoption | Monthly |
| 10 | **Cost Report** | Total technology spend by category | Monthly |
| 11 | **SLA Report** | Helpdesk SLA compliance stats | Weekly |
| 12 | **Security Audit Report** | Access reviews, API key rotations, audit logs | Quarterly |

### Sample Report: Asset Register

```
ASSET REGISTER
Generated: 2026-07-08
Branch: All | Department: All

┌──────┬──────────┬────────────┬──────────┬─────────┬────────┬──────────┐
│Asset │ Type     │ Brand/Model│ Serial   │Assignee │Status  │Condition │
├──────┼──────────┼────────────┼──────────┼─────────┼────────┼──────────┤
│LT-001│ Laptop   │ Dell XPS 15│ XPS12345 │ Arun K. │Assigned│ Excellent│
│LT-002│ Laptop   │ HP Elite   │ HP67890  │ Priya S.│Assigned│ Good     │
│DT-001│ Desktop  │ Lenovo M70q│ LN54321  │ Rajesh  │Assigned│ Good     │
│MN-010│ Monitor  │ Dell 27"   │ DL98765  │ Priya S.│Assigned│ Excellent│
│NT-003│ Router   │ MikroTik   │ MT45678  │ NP Office│Active  │ Good     │
│SR-001│ Server   │ Dell PowerE│ SR11111  │ Server Rm│Active  │ Good     │
└──────┴──────────┴────────────┴──────────┴─────────┴────────┴──────────┘

Summary:
  Total Assets:   245
  Assigned:        198  (80.8%)
  Available:       37   (15.1%)
  In Repair:       10   (4.1%)
```

### Sample Report: License & Subscription Renewal

```
UPCOMING RENEWALS (Next 60 Days)
Generated: 2026-07-08

┌──────────────────┬──────────┬────────────┬──────────┬────────┬──────────┐
│ Service          │ Type     │ Expiry     │ Cost     │ Owner  │ Status   │
├──────────────────┼──────────┼────────────┼──────────┼────────┼──────────┤
│ SSL - vedaedtech │ SSL      │ 15 Jul 26  │ ₹0 (Free)│ Tech   │ ⚠ Due Soon│
│ Domain - vedaed  │ Domain   │ 22 Jul 26  │ ₹1,200   │ Admin  │ ⚠ Due Soon│
│ Convex Pro       │ SaaS     │ 05 Aug 26  │ ₹15,000  │ CTO    │ Normal   │
│ Google Workspace │ SaaS     │ 12 Aug 26  │ ₹8,000   │ Admin  │ Normal   │
│ GitHub Team      │ SaaS     │ 18 Aug 26  │ ₹4,500   │ CTO    │ Normal   │
│ Microsoft 365    │ SaaS     │ 01 Sep 26  │ ₹12,000  │ Admin  │ Normal   │
└──────────────────┴──────────┴────────────┴──────────┴────────┴──────────┘

Total Renewal Cost (Next 60 Days): ₹40,700
```

---

## 20. Implementation Roadmap

### Phase Plan

| Phase | Focus | Key Features | Effort | Dependencies |
|-------|-------|-------------|--------|-------------|
| **P1** | Asset Inventory | Hardware asset entity, CRUD, asset ID format | 2 weeks | Organization hierarchy |
| **P1** | Software Inventory | Software license entity, CRUD, seat tracking | 1 week | Asset Inventory |
| **P2** | Device Assignment | Assignment entity, assign/return workflows | 2 weeks | Asset Inventory, HR |
| **P2** | SaaS Subscriptions | Subscription entity, CRUD, cost tracking | 1 week | Finance, Organization |
| **P3** | API Key Management | Key entity, rotation tracking, env var mapping | 1 week | SaaS Subscriptions |
| **P3** | Domain & DNS | Domain entity, SSL tracking, expiry alerts | 1 week | Communication (DOC-09) |
| **P3** | Helpdesk | Ticket entity, assignment, SLA tracking | 3 weeks | Workflow (DOC-10) |
| **P4** | Maintenance | Maintenance entity, AMC tracking, repair log | 1 week | Asset Inventory, Helpdesk |
| **P4** | Platform Admin | Tenant management, white-label, feature flags | 3 weeks | All preceding |
| **P5** | Monitoring | Health checks, alerting, status dashboard | 2 weeks | All preceding |
| **P5** | Security | Audit logs, access reviews, RBAC enhancements | 2 weeks | Platform Admin |
| **P5** | Backup & DR | Backup config, DR plan documentation | 1 week | All modules |
| **P6** | Technology Dashboard | KPI dashboard, charts, expiring items | 2 weeks | All preceding |
| **P6** | AI Operations | Failure prediction, cost optimization | 4 weeks | Monitoring, Reports |

### Dependency Graph

```
Asset Inventory ──→ Device Assignment ──→ Platform Admin ──→ Dashboard
      │                  │                                        │
      ├──→ Software ───→ License Tracking                        │
      │                                                           │
SaaS Subscriptions ──→ API Key Management ──→ Monitoring          │
      │                                       │                   │
      ├──→ Domain & DNS ──→ SSL Tracking      │                   │
      │                                                           │
Helpdesk ──→ SLA Tracking ──→ Reports                            │
      │                                       │                   │
Maintenance ──→ AMC / Warranty ──→ Alerts     │                   │
                                                ▼
                                           Technology Dashboard
```

### Priority Matrix

```
Priority: P1 (Critical)           Priority: P2 (High)
  ├── Asset Inventory               ├── Device Assignment
  └── Software Inventory            └── SaaS Subscriptions

Priority: P3 (Medium)             Priority: P4 (Standard)
  ├── API Key Management            ├── Maintenance
  ├── Domain & DNS                  └── Platform Admin
  └── Helpdesk

Priority: P5 (Low)                Priority: P6 (Future)
  ├── Monitoring                    ├── Technology Dashboard
  ├── Security                      └── AI Operations
  └── Backup & DR
```

---

## 21. Golden Rules

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          TECHNOLOGY GOLDEN RULES                              ║
║                                                              ║
║   1.  Technology owns all assets.                             ║
║                                                              ║
║   2.  HR owns employees.                                      ║
║                                                              ║
║   3.  Finance owns purchases.                                 ║
║                                                              ║
║   4.  Workflow owns approvals.                                ║
║                                                              ║
║   5.  Communication owns alerts.                              ║
║                                                              ║
║   6.  One Asset. One Identity. One Serial Number.             ║
║                                                              ║
║   7.  Everything is assigned to someone or stored somewhere.  ║
║                                                              ║
║   8.  Everything is auditable. No orphan devices.             ║
║                                                              ║
║   9.  Every device has a known status at all times.           ║
║                                                              ║
║  10.  Licenses and seats are finite — no overallocation.      ║
║                                                              ║
║  11.  API keys are never committed to source code.            ║
║                                                              ║
║  12.  Secrets are rotated on schedule.                        ║
║                                                              ║
║  13.  Monitoring watches everything. Everything.               ║
║                                                              ║
║  14.  Expiry dates are never missed — alerts prevent this.    ║
║                                                              ║
║  15.  Backup, Backup, Backup. Test the restore, not the       ║
║        backup.                                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendices

### Appendix A: Technology Asset Categories

| Category Code | Category | Sub-Types |
|-------------|----------|-----------|
| HW-LT | Laptop | Standard, High-Performance, Ultrabook, Hybrid |
| HW-DT | Desktop | Standard, Workstation, All-in-One, Thin Client |
| HW-MN | Monitor | 22", 24", 27", 32", Ultrawide |
| HW-PR | Peripheral | Keyboard, Mouse, Headset, Webcam |
| HW-AC | Accessory | Docking Station, Cable, Adapter |
| HW-PT | Printer | Laser, Inkjet, Multifunction, Label |
| HW-SC | Scanner | Flatbed, Document, Portable |
| HW-PJ | Projector | Standard, Short-throw, Interactive |
| HW-TB | Tablet | iPad, Android, Windows |
| HW-MB | Mobile | Smartphone |
| HW-NT | Network | Router, Switch, Firewall, Access Point, Modem |
| HW-SR | Server | Tower, Rack, NAS, Microserver |
| HW-PW | Power | UPS, Power Backup, Stabilizer |
| HW-SE | Security | Biometric, Face Attendance, CCTV, Door Lock |
| HW-AV | AV | Smart TV, Digital Board, Interactive Panel |
| HW-IOT | IoT | Smart Light, Sensor |
| HW-FR | Furniture | Standing Desk, Chair, Monitor Arm |

### Appendix B: Supported SaaS Services

| Category | Services |
|----------|----------|
| **AI** | OpenAI, Anthropic Claude, Google Gemini, GitHub Copilot |
| **Cloud** | Convex, Vercel, Netlify, AWS, Azure, DigitalOcean, Firebase |
| **Communication** | Twilio, MSG91, SendGrid, AWS SES, WhatsApp API, OneSignal |
| **Monitoring** | Vly, Sentry, Datadog, Cloudflare |
| **Productivity** | Google Workspace, Microsoft 365, Slack, Notion, GitBook, Linear |
| **Source Control** | GitHub, GitLab |
| **Design** | Figma, Adobe Creative Cloud, Canva Pro |
| **Marketing** | Mailchimp, HubSpot, Google Ads, Facebook Ads |

### Appendix C: Recommended Monitoring Metrics

| Category | Metrics | Alert Trigger |
|----------|---------|---------------|
| **Application** | Uptime %, Error Rate, Response Time (p50/p95/p99) | 5xx > 1% in 5 min |
| **Database** | Query latency, Connection count, Storage usage | Latency > 500ms |
| **API** | Request count, Response codes, Rate limit usage | 4xx > 10% of requests |
| **Server** | CPU %, Memory %, Disk %, Network I/O | CPU > 85% for 5 min |
| **Security** | Failed logins, Suspicious IPs, API key usage spikes | 10 failed logins/min |
| **Business** | Active users, Feature adoption, Tenant growth | — (Trend tracking) |

### Appendix D: Future Roadmap

| Area | Description | Timeline |
|------|-------------|----------|
| **Cloud Infrastructure** | Multi-region deployment, auto-scaling | 2027 Q1 |
| **Container Management** | Docker orchestration, Kubernetes support | 2027 Q2 |
| **Edge Devices** | On-premise edge servers for low-latency | 2027 Q2 |
| **IoT Integration** | Smart campus sensors, attendance devices | 2027 Q3 |
| **MDM** | Mobile Device Management for field staff | 2027 Q3 |
| **Remote Desktop** | VDI / Remote desktop infrastructure | 2027 Q3 |
| **Zero Trust** | Zero Trust Network Access (ZTNA) | 2027 Q4 |
| **SIEM** | Security Information and Event Management | 2027 Q4 |
| **SOC** | Security Operations Center, 24/7 monitoring | 2028 Q1 |

### Appendix E: Existing Code Integration Points

| Existing File | What It Does | DOC-15 Integration |
|---------------|-------------|-------------------|
| `github.ts` | GitHub API client (uses GITHUB_TOKEN env var) | Phase 3 — Track GitHub as SaaS subscription, manage API key |
| `featureFlags.ts` | Collection Engine feature toggles (3 flags) | Phase 4 — Tenant-level feature flag management dashboard |
| `instrumentation.tsx` | Error monitoring + Vly reporting | Phase 5 — Extend with uptime, API health, custom metrics |
| `http.ts` | HTTP router with auth routes | Phase 3 — API gateway endpoint monitoring |
| `crons.disabled.ts` | Cron scheduler for automation (disabled) | Phase 5 — Automated backup checks, expiry alerts |
| `vly-integrations.ts` | Vly integrations client | Phase 3 — Track Vly as SaaS subscription |
| `auth.config.ts` | Auth provider configuration (Convex) | Phase 6 — Multi-tenant SSO, OIDC support |
| `convex.json` | Convex functions configuration | Phase 3 — Infrastructure config tracking |
| `users.ts` | User CRUD with roles | Phase 2 — Device assignment uses user records |
| `seed.ts` | Database seed data (departments, users, branches) | Phase 1 — Asset seed templates |
| `organization.ts` | Org hierarchy (branches, departments, teams) | Phase 1 — Asset location/scoping |
| `schema.ts` | Database schema definition | Phase 1 — Asset entity table definitions |

---

*End of DOC-15 — Technology, IT Operations & SaaS Administration Engine Bible*
