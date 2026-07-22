# DOC-16 — Administration, Facilities & Operations Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Administration, Facilities & Operations  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-10 — Workflow Engine, DOC-13 — HR Engine, DOC-15 — Technology Engine  
> **Existing Infrastructure:** `organization.ts`, `organizationBranches.ts`, `organizationDepartments.ts`, `organizationTeams.ts`, `organizationCompanies.ts`, `organizationDesignations.ts` (org hierarchy masters)

---

## Table of Contents

1. [Administration Philosophy](#1-administration-philosophy)
2. [Daily Operations Lifecycle](#2-daily-operations-lifecycle)
3. [Campus Management](#3-campus-management)
4. [Facility Management](#4-facility-management)
5. [Inventory Management](#5-inventory-management)
6. [Vendor Management](#6-vendor-management)
7. [Purchase Requests](#7-purchase-requests)
8. [Visitor Management](#8-visitor-management)
9. [Security Management](#9-security-management)
10. [Transport Management](#10-transport-management)
11. [Event Management](#11-event-management)
12. [Housekeeping](#12-housekeeping)
13. [Utilities](#13-utilities)
14. [Administration Dashboard](#14-administration-dashboard)
15. [Cross Module Integration](#15-cross-module-integration)
16. [AI Opportunities](#16-ai-opportunities)
17. [Reports](#17-reports)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Golden Rules](#19-golden-rules)

---

## 1. Administration Philosophy

### Purpose

The Administration, Facilities & Operations Engine manages the daily physical operations of an educational organization. From campus infrastructure to visitor gate passes, this engine ensures every physical activity is planned, every resource is tracked, and every operation is auditable.

### Core Principle

**Administration owns facilities. Technology owns devices. HR owns people. Finance owns purchases. Workflow owns approvals. Operations owns execution.**

### Business Rules

1. **Every physical activity must be planned.** No facility use, event, or maintenance occurs without prior scheduling.
2. **Every resource must be tracked.** All inventory items, from stationery to lab equipment, have a known quantity and location.
3. **Every visitor must be recorded.** Entry and exit of every non-employee is logged with purpose and host.
4. **Every facility must have ownership.** Each room, building, and amenity has a responsible person.
5. **Every operation must be auditable.** All maintenance, purchases, and incidents have timestamps and actors.
6. **Workflow owns approvals.** Purchase requests, facility bookings, and event approvals flow through DOC-10.
7. **Finance owns purchasing.** Administration specifies requirements; Finance processes payments and records costs.
8. **Technology owns devices.** IT equipment, biometric devices, and CCTV are tracked in DOC-15.
9. **HR owns people.** Staff assignments and attendance are managed in DOC-13.
10. **Stock is finite.** Inventory is consumed and replenished — never overallocated.

### Ownership Map

| Module | Owns |
|--------|------|
| **Administration (DOC-16)** | Campus, facilities, inventory, vendors, POs, visitors, security, transport, housekeeping, utilities, physical events |
| **Technology (DOC-15)** | IT devices, biometric devices, CCTV, network infrastructure |
| **HR (DOC-13)** | Employee records, staff attendance, onboarding/offboarding |
| **Finance (DOC-08)** | Purchase processing, vendor payments, budget approvals |
| **Workflow (DOC-10)** | Purchase approvals, facility booking approvals, event approvals |
| **Communication (DOC-09)** | Visitor notifications, maintenance alerts, security alerts |

---

## 2. Daily Operations Lifecycle

### Center Operations Flow

```
CENTER OPENING (8:00 AM)
      │
      ├── Security unlocks gates and doors
      ├── Housekeeping inspection (cleanliness check)
      ├── Facility inspection (AC, lights, water, internet)
      ├── Biometric systems activated
      └── Security checkpoint active
      │
      ▼
STAFF ARRIVAL (8:00 - 9:00 AM)
      │
      ├── Staff biometric/facial attendance
      └── Daily briefing for admin/security/housekeeping teams
      │
      ▼
ACADEMIC HOURS (9:00 AM - 5:00 PM)
      │
      ├── Classroom readiness checks
      ├── Lab equipment verification
      ├── Visitor management (entry/exit logging)
      ├── Facility issue tracking
      ├── Inventory issue/return
      ├── Transport (pickup/drop coordination)
      └── Scheduled maintenance (if any)
      │
      ▼
EVENING OPERATIONS (5:00 - 7:00 PM)
      │
      ├── Evening classes/activities monitoring
      ├── Event management (if scheduled)
      └── Housekeeping (post-day cleaning)
      │
      ▼
CENTER CLOSING (7:00 - 8:00 PM)
      │
      ├── Final housekeeping inspection
      ├── Facility shutdown checklist
      ├── Security lockdown (gates, doors, alarms)
      ├── Verify no unauthorized persons on premises
      └── Complete daily operations report
      │
      ▼
DAILY REPORT GENERATED
      ├── Staff attendance summary
      ├── Visitor log summary
      ├── Facility issues reported
      ├── Maintenance completed
      ├── Inventory movements
      └── Incidents (if any)
```

### Daily Operations Checklist

| Time | Task | Owner | Status |
|------|------|-------|--------|
| 8:00 AM | Unlock main gates and all facility doors | Security | ☐ |
| 8:15 AM | Inspect all classrooms for cleanliness | Housekeeping | ☐ |
| 8:30 AM | Check AC, lights, water, internet connectivity | Facilities | ☐ |
| 8:45 AM | Activate biometric attendance systems | Tech/Admin | ☐ |
| 9:00 AM | Staff attendance report generated | HR/Admin | ☐ |
| 10:00 AM | Visitor desk operational | Security | ☐ |
| 1:00 PM | Mid-day facility check | Facilities | ☐ |
| 5:00 PM | Evening cleaning begins | Housekeeping | ☐ |
| 7:00 PM | Final facility inspection | Facilities | ☐ |
| 7:30 PM | Lockdown checklist | Security | ☐ |
| 8:00 PM | Daily report submitted | Admin | ☐ |

---

## 3. Campus Management

### Campus Hierarchy

```
Organization (Company)
      │
      ├── Campus (Physical location)
      │     ├── Building
      │     │     ├── Floor
      │     │     │     ├── Wing
      │     │     │     │     ├── Room
      │     │     │     │     ├── Classroom
      │     │     │     │     ├── Lab
      │     │     │     │     ├── Library
      │     │     │     │     ├── Office
      │     │     │     │     ├── Auditorium
      │     │     │     │     └── Storage
      │     │     │     └── Common Area
      │     │     └── Facility count per building
      │     ├── Parking Area
      │     ├── Hostel (if residential)
      │     ├── Cafeteria
      │     ├── Sports Area
      │     └── Grounds
      │
      └── Branch Code (maps to existing branches)
```

### Campus Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `name` | string | Campus name (e.g. "Veda EdTech — North Province Campus") |
| `code` | string | Campus code (e.g. "NP-CAMPUS") |
| `branchId` | Id("branches") | Associated branch (from org hierarchy) |
| `address` | string | Full physical address |
| `city` | string | City |
| `state` | string | State |
| `pincode` | string | Postal code |
| `contactNumber` | string | Campus main contact number |
| `campusIncharge` | optional Id("users") | Campus administrator |
| `totalArea` | optional number | Total area in sq ft |
| `builtUpArea` | optional number | Built-up area in sq ft |
| `status` | string | `active`, `under_maintenance`, `closed` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Building Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `campusId` | Id("campuses") | Parent campus |
| `name` | string | Building name (e.g. "Academic Block A") |
| `code` | string | Building code (e.g. "BLK-A") |
| `floors` | number | Number of floors |
| `totalRooms` | number | Total rooms in building |
| `facilities` | array of string | Available facilities: `lift`, `ramp`, `washroom`, `parking` |
| `status` | string | `active`, `under_maintenance`, `closed` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Room/Facility Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `buildingId` | Id("buildings") | Parent building |
| `floor` | number | Floor number |
| `wing` | optional string | Wing name (e.g. "East", "West") |
| `roomNumber` | string | Room number/identifier |
| `roomName` | optional string | Room name (e.g. "Physics Lab 1") |
| `type` | string | `classroom`, `lab`, `library`, `office`, `auditorium`, `conference`, `storage`, `washroom`, `common_area`, `cafeteria`, `sports_hall` |
| `capacity` | number | Maximum occupancy |
| `currentOccupancy` | optional number | Current occupants (if in use) |
| `area` | optional number | Room area in sq ft |
| `equipment` | optional array of string | Fixed equipment list (e.g. "projector", "whiteboard", "AC") |
| `status` | string | `available`, `occupied`, `under_maintenance`, `closed` |
| `incharge` | optional Id("users") | Room/Facility in-charge |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Room Types

| Type | Description | Examples |
|------|-------------|----------|
| **Classroom** | Teaching room with desks/chairs | Standard, Smart, Seminar |
| **Lab** | Practical training room | Computer, Physics, Chemistry, Biology, Language |
| **Library** | Reading/study area | General, Reference, Digital |
| **Office** | Staff workspace | Admin, Faculty, HR, Accounts |
| **Auditorium** | Large gathering space | Event, Assembly, Exam Hall |
| **Conference** | Meeting room | Small, Medium, Boardroom |
| **Storage** | Inventory/equipment storage | Stationery, Lab Consumables, Sports |
| **Common Area** | Student/staff lounge | Waiting area, Break room |
| **Cafeteria** | Food service area | Kitchen, Dining, Counter |
| **Sports Hall** | Indoor sports | Badminton, Table Tennis, Gym |

### Facility Booking

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `roomId` | Id("rooms") | Room being booked |
| `purpose` | string | Booking purpose |
| `bookedBy` | Id("users") | Person making booking |
| `bookedFor` | optional Id("users") | Person/event using room |
| `date` | number | Date of booking |
| `startTime` | number | Start timestamp |
| `endTime` | number | End timestamp |
| `expectedAttendees` | optional number | Expected number of people |
| `requirements` | optional array of string | Required equipment (projector, mic, etc.) |
| `status` | string | `pending`, `approved`, `in_progress`, `completed`, `cancelled` |
| `approvedBy` | optional Id("users") | Approver |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Facility Booking Lifecycle

```
Booking Request → Approval (DOC-10) → Confirmed → In Progress → Completed → Released
```

---

## 4. Facility Management

### Facility Asset Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `facilityType` | string | `furniture`, `electrical`, `ac`, `generator`, `lift`, `water_system`, `plumbing`, `internet`, `fire_safety` |
| `name` | string | Asset name (e.g. "Central AC Unit 1") |
| `location` | Id("rooms") | Room/building location |
| `brand` | optional string | Brand |
| `model` | optional string | Model |
| `serialNumber` | optional string | Serial number |
| `installationDate` | optional number | Date installed |
| `warrantyEnd` | optional number | Warranty expiry |
| `amcProvider` | optional string | AMC vendor |
| `amcStart` | optional number | AMC contract start |
| `amcEnd` | optional number | AMC contract end |
| `amcCost` | optional number | Annual AMC cost |
| `status` | string | `operational`, `under_maintenance`, `repair`, `decommissioned` |
| `lastServiceDate` | optional number | Last maintenance date |
| `nextServiceDate` | optional number | Scheduled next service |
| `serviceFrequency` | optional string | `weekly`, `monthly`, `quarterly`, `biannual`, `annual` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Facility Maintenance Schedule

| Facility | Maintenance Type | Frequency |
|----------|-----------------|-----------|
| **AC Units** | Filter cleaning, gas top-up, deep service | Monthly / Quarterly |
| **Generator** | Battery check, oil change, load test | Weekly / Quarterly |
| **Water System** | Tank cleaning, pump inspection, RO service | Monthly / Quarterly |
| **Lift** | Safety inspection, lubrication, cable check | Monthly / Annual |
| **Electrical** | Panel inspection, wiring check, MCB test | Quarterly |
| **Fire Safety** | Extinguisher check, alarm test, drill | Monthly / Annual |
| **Internet/Network** | Router check, speed test, cable inspection | Weekly |
| **Plumbing** | Leak check, drain cleaning, fixture check | Weekly / Monthly |

### Maintenance Request

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `facilityAssetId` | optional Id("facilityAssets") | Associated facility asset |
| `roomId` | optional Id("rooms") | Location of issue |
| `issueType` | string | `ac`, `electrical`, `plumbing`, `furniture`, `internet`, `cleaning`, `structural`, `other` |
| `description` | string | Issue description |
| `priority` | string | `low`, `medium`, `high`, `critical` |
| `reportedBy` | Id("users") | Person reporting |
| `reportedDate` | number | Date reported |
| `assignedTo` | optional Id("users") | Assigned staff/vendor |
| `status` | string | `reported`, `assigned`, `in_progress`, `resolved`, `closed` |
| `resolution` | optional string | Resolution notes |
| `cost` | optional number | Cost of repair |
| `resolvedDate` | optional number | Date resolved |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

---

## 5. Inventory Management

### Inventory Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `itemName` | string | Item name (e.g. "A4 Bond Paper") |
| `itemCode` | string | Unique item code (e.g. "STN-001") |
| `category` | string | Inventory category |
| `subCategory` | optional string | Sub-category |
| `description` | optional string | Item description |
| `unitOfMeasure` | string | `piece`, `ream`, `box`, `liter`, `kg`, `meter`, `set` |
| `quantityOnHand` | number | Current stock quantity |
| `minimumStock` | number | Minimum stock before reorder alert |
| `maximumStock` | number | Maximum stock capacity |
| `reorderPoint` | number | Quantity at which to reorder |
| `unitCost` | optional number | Cost per unit |
| `location` | optional string | Storage location (e.g. "Store Room A, Shelf 3") |
| `storageRoomId` | optional Id("rooms") | Storage room |
| `vendorId` | optional Id("vendors") | Preferred vendor |
| `status` | string | `in_stock`, `low_stock`, `out_of_stock`, `discontinued` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Inventory Categories (Appendix B)

| Category Code | Category | Examples |
|-------------|----------|----------|
| STN | Stationery | Pens, paper, staplers, folders, markers |
| BOOK | Books & Publications | Textbooks, reference books, magazines |
| UNI | Uniform | Student uniform sets, ties, badges |
| IDC | ID Cards & Lanyards | PVC cards, lanyards, ID holders |
| FUR | Furniture | Chairs, tables, desks, shelves |
| CON | Consumables | Toilet paper, soap, tissues, trash bags |
| CLN | Cleaning Supplies | Detergent, disinfectant, mops, buckets |
| EXAM | Exam Material | Answer sheets, question papers, seal tapes |
| LAB | Lab Equipment | Beakers, test tubes, chemicals, specimen |
| SPO | Sports Equipment | Balls, nets, racquets, mats |
| ELEC | Electrical | Bulbs, tubes, switches, wires |
| KIT | Kitchen | Utensils, plates, glasses, cutlery |
| PRT | Printing | Toner, ink cartridges, binding supplies |
| MISC | Miscellaneous | First aid, signage, decorative items |

### Inventory Transaction

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `itemId` | Id("inventoryItems") | Inventory item |
| `transactionType` | string | `issue`, `return`, `stock_in`, `adjustment`, `damage`, `expiry` |
| `quantity` | number | Quantity (positive for stock in, negative for issue) |
| `balanceBefore` | number | Stock balance before transaction |
| `balanceAfter` | number | Stock balance after transaction |
| `issuedTo` | optional Id("users") | Person receiving (for issues) |
| `issuedBy` | optional Id("users") | Admin staff issuing |
| `departmentId` | optional Id("departments") | Department requesting |
| `purpose` | optional string | Reason for transaction |
| `referenceNumber` | optional string | Reference (PO number, request ID) |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |

### Inventory Lifecycle

```
Stock In (Purchase / Vendor delivery)
      │
      ├── Verify quantity and quality
      ├── Update stock in system
      │
      ▼
Stock Available
      │
      ├── Issue to employee/department
      ├── Return from employee/department
      ├── Damage / Write-off
      └── Periodic count adjustment
      │
      ▼
Low Stock Alert → Reorder → Purchase Request → Stock In
```

---

## 6. Vendor Management

### Vendor Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `vendorName` | string | Vendor/Supplier name |
| `vendorCode` | string | Unique vendor code (e.g. "VEN-001") |
| `category` | string | Vendor category |
| `contactPerson` | string | Primary contact name |
| `phone` | string | Contact phone |
| `email` | string | Contact email |
| `address` | string | Vendor address |
| `gstNumber` | optional string | GST/VAT registration |
| `panNumber` | optional string | PAN/Tax ID |
| `bankDetails` | optional object | Bank account, IFSC, branch |
| `paymentTerms` | string | `immediate`, `7_days`, `15_days`, `30_days`, `45_days`, `60_days` |
| `contractStart` | optional number | Contract start date |
| `contractEnd` | optional number | Contract end date |
| `rating` | optional number | 1-5 vendor rating |
| `status` | string | `active`, `inactive`, `blacklisted` |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Vendor Categories (Appendix C)

| Category Code | Category | Services |
|-------------|----------|----------|
| AMC | AMC Provider | AC, generator, lift, fire safety maintenance |
| SUP | General Supplier | Stationery, consumables, office supplies |
| MNT | Maintenance | Plumbing, electrical, carpentry, painting |
| PRT | Printing | Brochures, banners, forms, flex |
| TRN | Transport | Bus services, vehicle maintenance |
| CAT | Catering | Food, beverages, event catering |
| SEC | Security | Security personnel, guard services |
| HKK | Housekeeping | Cleaning services, janitorial |
| IT | IT Services | Computer repair, network services |
| LAB | Lab Supplies | Chemicals, glassware, specimen |
| SPO | Sports | Sports equipment, uniforms |
| ELE | Electrical | Electrical supplies, fittings |
| CON | Construction | Renovation, furniture, painting |

### Vendor Performance Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| On-Time Delivery % | Deliveries completed on time | On-time / Total × 100 |
| Quality Score | Quality of delivered goods | Passed inspection / Total × 100 |
| Price Competitiveness | Pricing vs market average | Vendor price / Market avg × 100 |
| Response Time | Average response to queries | Average hours to respond |
| Contract Compliance | Adherence to contract terms | Manual rating |

---

## 7. Purchase Requests

### Purchase Request Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `prNumber` | string | Purchase Request number (e.g. "PR-2026-0001") |
| `requestedBy` | Id("users") | Person requesting |
| `departmentId` | Id("departments") | Requesting department |
| `requestDate` | number | Date of request |
| `category` | string | Purchase category |
| `priority` | string | `low`, `medium`, `high`, `urgent` |
| `items` | array of objects | Requested items with quantity |
| `estimatedCost` | number | Total estimated cost |
| `approvedCost` | optional number | Approved budget |
| `justification` | string | Business justification |
| `status` | string | `draft`, `pending_approval`, `approved`, `quotation_received`, `po_raised`, `delivered`, `closed`, `rejected` |
| `approvedBy` | optional Id("users") | Approver |
| `approvedDate` | optional number | Approval date |
| `rejectedReason` | optional string | Rejection reason |
| `poNumber` | optional string | Purchase Order number |
| `deliveryDate` | optional number | Actual delivery date |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Purchase Flow

```
Requirement Identified
      │
      ├── Create Purchase Request (PR)
      ├── Route for approval (DOC-10)
      │     ├── Department Head
      │     ├── Finance
      │     └── Director (if > ₹50,000)
      │
      ▼
PR Approved
      │
      ├── Request Quotations (minimum 3)
      ├── Vendor comparison
      ├── Vendor selection
      │
      ▼
Purchase Order (PO) Generated
      │
      ├── PO issued to selected vendor
      ├── Delivery expected by date
      │
      ▼
Delivery & Verification
      │
      ├── Receive goods/materials
      ├── Verify quantity and quality
      ├── Update inventory (stock in)
      │
      ▼
Invoice → Finance Payment
      │
      └── Purchase record closed
```

### Item Line in Purchase Request

| Field | Type | Description |
|-------|------|-------------|
| `itemId` | optional Id("inventoryItems") | Existing inventory item |
| `itemName` | string | Item description |
| `quantity` | number | Quantity requested |
| `unit` | string | Unit of measure |
| `estimatedUnitCost` | number | Estimated cost per unit |
| `estimatedTotalCost` | number | Quantity × Unit Cost |
| `deliveredQuantity` | optional number | Quantity actually delivered |
| `verifiedQuantity` | optional number | Quantity after verification |

---

## 8. Visitor Management

### Visitor Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `visitorName` | string | Full name |
| `phone` | string | Contact number |
| `email` | optional string | Email address |
| `idProofType` | optional string | `aadhar`, `driving_license`, `passport`, `voter_id`, `company_id` |
| `idProofNumber` | optional number | ID proof number |
| `photoUrl` | optional string | Visitor photo URL |
| `organization` | optional string | Company/organization name |
| `purpose` | string | Visit purpose |
| `hostId` | Id("users") | Person they are visiting |
| `hostDepartment` | optional Id("departments") | Host's department |
| `meetingWith` | optional string | Person/team meeting |
| `appointmentTime` | number | Scheduled appointment |
| `entryTime` | optional number | Actual entry time |
| `exitTime` | optional number | Actual exit time |
| `gatePassIssued` | boolean | Gate pass issued |
| `gatePassNumber` | optional string | Gate pass number |
| `vehicleNumber` | optional string | Vehicle registration (if applicable) |
| `itemsCarried` | optional array of string | Items carried (laptop, bag, etc.) |
| `status` | string | `expected`, `checked_in`, `in_meeting`, `checked_out` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Visitor Flow

```
Pre-registration (via portal/app)
      │
      ├── Visitor fills details
      ├── Host receives notification (DOC-09)
      ├── Host confirms appointment
      │
      ▼
Visitor Arrives
      │
      ├── Check ID proof
      ├── Verify against pre-registration
      │     ├── Matches → Quick check-in
      │     └── No pre-registration → Manual registration
      │
      ├── Take photo
      ├── Issue gate pass / visitor badge
      ├── Log vehicle number (if applicable)
      └── Notify host (DOC-09): "Your visitor has arrived"
      │
      ▼
Visitor at Meeting
      │
      ├── Host escorts (if required)
      ├── Visitor logs exit when leaving
      │
      ▼
Visitor Departs
      │
      ├── Return gate pass
      ├── Log exit time
      ├── Collect ID proof
      └── Update status to "checked_out"
```

### Visitor Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  VISITOR MANAGEMENT                                         │
├─────────────────────────────────────────────────────────────┤
│  Today's Visitors: 24    │  Currently In: 12   │  Done: 12  │
├─────────────────────────────────────────────────────────────┤
│  Visits Today                                               │
│  ┌────────┬──────────┬──────────┬─────────┬─────────┬─────┐ │
│  │ Name   │ Host     │ Purpose  │ In Time │ Status  │     │ │
│  ├────────┼──────────┼──────────┼─────────┼─────────┼─────┤ │
│  │ Raj M. │ Arun K.  │ Interview│ 10:15   │ Meeting │ ☐   │ │
│  │.Priya S│ Sneha G. │ Parent   │ 11:00   │ Checked │ ⌛  │ │
│  │ Vendor │ Rajesh P.│ AMC      │ 09:30   │ Done    │ ✅   │ │
│  └────────┴──────────┴──────────┴─────────┴─────────┴─────┘ │
├─────────────────────────────────────────────────────────────┤
│  Pending Pre-registrations: 3                                │
│  │ Visitor           │ Host     │ Expected │ Status        │ │
│  │ Deepak Sharma     │ Priya S. │ 2:00 PM  │ Awaiting Host │ │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Security Management

### Security Incident Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `incidentType` | string | `unauthorized_entry`, `theft`, `damage`, `fire`, `medical`, `accident`, `conflict`, `other` |
| `location` | Id("rooms") | Incident location |
| `dateTime` | number | Date and time of incident |
| `reportedBy` | Id("users") | Person reporting |
| `description` | string | Incident description |
| `personsInvolved` | optional array of string | Names of involved persons |
| `actionsTaken` | optional string | Immediate actions |
| `status` | string | `open`, `investigating`, `resolved`, `closed` |
| `closedBy` | optional Id("users") | Closing authority |
| `notes` | optional string | Additional notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Security Staff Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `staffName` | string | Security staff name |
| `staffId` | optional Id("users") | If internal employee |
| `vendorId` | optional Id("vendors") | If from security agency |
| `shift` | string | `morning`, `evening`, `night` |
| `post` | string | `main_gate`, `campus_patrol`, `cctv_room`, `visitor_desk` |
| `contactNumber` | string | Contact number |
| `status` | string | `on_duty`, `off_duty`, `leave`, `resigned` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Emergency Protocols

| Situation | Action | Contact |
|-----------|--------|---------|
| **Fire** | Evacuate, fire extinguisher, call fire dept | 101 (Fire) + Campus Admin |
| **Medical Emergency** | First aid, call ambulance, inform family | 102 (Ambulance) + HR |
| **Security Breach** | Lockdown, inform security head, CCTV review | Campus Security + Admin |
| **Natural Disaster** | Evacuate to safe zone, headcount, updates | Campus Admin + CEO |
| **Power Outage** | Switch to generator, inform maintenance | Facilities + Admin |
| **Bomb Threat** | Immediate evacuation, inform police | 100 (Police) + Admin |

### Access Control

| Access Level | Areas | Who |
|-------------|-------|-----|
| **Public** | Reception, waiting area, cafeteria | All visitors |
| **Restricted** | Classrooms, library, labs | Students, staff |
| **Staff Only** | Offices, staff room, server room | Employees |
| **Confidential** | Accounts, HR, exam cell | Authorized personnel only |
| **Critical** | Server room, data center, cash room | IT + Admin only |

---

## 10. Transport Management

### Vehicle Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `vehicleNumber` | string | Registration number |
| `vehicleType` | string | `bus`, `van`, `car`, `auto`, `bicycle` |
| `brand` | string | Manufacturer |
| `model` | string | Model |
| `year` | number | Year of manufacture |
| `capacity` | number | Passenger capacity |
| `fuelType` | string | `diesel`, `petrol`, `electric`, `cng` |
| `insuranceExpiry` | optional number | Insurance expiry date |
| `fitnessExpiry` | optional number | Fitness certificate expiry |
| `pollutionExpiry` | optional number | Pollution check expiry |
| `permitExpiry` | optional number | Route permit expiry |
| `status` | string | `active`, `under_maintenance`, `retired` |
| `branchId` | Id("branches") | Operating branch |
| `driverId` | optional Id("drivers") | Assigned driver |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Driver Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `driverName` | string | Full name |
| `phone` | string | Contact number |
| `licenseNumber` | string | Driving license number |
| `licenseExpiry` | number | License expiry date |
| `vehicleType` | string | Authorized vehicle type |
| `emergencyContact` | optional string | Emergency contact |
| `status` | string | `active`, `on_leave`, `resigned` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Route Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `routeName` | string | Route name (e.g. "NP Campus — City Center") |
| `vehicleId` | Id("vehicles") | Assigned vehicle |
| `driverId` | Id("drivers") | Assigned driver |
| `stops` | array of objects | Pickup/drop points with times |
| `startPoint` | string | Route starting point |
| `endPoint` | string | Route ending point |
| `totalDistance` | optional number | Distance in km |
| `estimatedDuration` | optional number | Duration in minutes |
| `type` | string | `pickup`, `drop`, `both` |
| `studentCount` | optional number | Number of students |
| `employeeCount` | optional number | Number of employees |
| `status` | string | `active`, `inactive` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Transport Lifecycle

```
Route Planning
      │
      ├── Define stops and timings
      ├── Assign vehicle
      ├── Assign driver
      │
      ▼
Daily Operations
      │
      ├── Pre-trip vehicle inspection
      ├── Pickup/Drop as per schedule
      ├── GPS tracking (optional)
      ├── Fuel log maintained
      │
      ▼
Post-Trip
      │
      ├── Post-trip vehicle inspection
      ├── Record fuel consumption
      ├── Report any issues
      │
      ▼
Maintenance
      │
      ├── Scheduled service
      ├── Insurance renewal
      ├── Fitness/pollution checks
      └── Fuel replenishment
```

---

## 11. Event Management

### Event Entity (Administration)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `eventName` | string | Event name |
| `eventType` | string | `seminar`, `ptm`, `annual_day`, `examination`, `workshop`, `orientation`, `sports`, `cultural`, `conference`, `celebration` |
| `description` | string | Event description |
| `startDate` | number | Event start datetime |
| `endDate` | number | Event end datetime |
| `location` | Id("rooms") | Primary venue |
| `additionalVenues` | optional array of Id("rooms") | Additional rooms |
| `expectedAttendees` | number | Expected participants |
| `actualAttendees` | optional number | Actual count |
| `organizerId` | Id("users") | Event organizer |
| `budget` | optional number | Event budget |
| `actualCost` | optional number | Actual cost incurred |
| `requirements` | optional array of string | Equipment, catering, signage |
| `status` | string | `planned`, `approved`, `setup`, `ongoing`, `completed`, `cancelled` |
| `notes` | optional string | Notes |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Event Lifecycle

```
Event Proposal
      │
      ├── Define purpose, date, venue, budget
      ├── Route for approval (DOC-10)
      │
      ▼
Approved
      │
      ├── Room/venue booking confirmed
      ├── Equipment requisition
      ├── Catering order (if applicable)
      ├── Security deployment
      ├── Housekeeping schedule
      ├── Invitations/communication (DOC-09)
      │
      ▼
Setup Day
      │
      ├── Venue setup (chairs, stage, sound, projection)
      ├── Registration desk setup
      ├── Signage and directions
      └── Final rehearsal
      │
      ▼
Event Day
      │
      ├── Registration/check-in
      ├── Event execution
      ├── Photography/videography
      ├── Feedback collection
      └── Cleanup and venue restoration
      │
      ▼
Post-Event
      │
      ├── Expense reconciliation
      ├── Attendee follow-up (DOC-09)
      ├── Event report
      └── Cost analysis
```

### Event Budget vs Actual

| Category | Budgeted | Actual | Variance |
|----------|----------|--------|----------|
| Venue Setup | ₹10,000 | ₹8,500 | ₹1,500 ✓ |
| Catering | ₹25,000 | ₹28,000 | -₹3,000 ✗ |
| Sound & AV | ₹8,000 | ₹7,500 | ₹500 ✓ |
| Decoration | ₹5,000 | ₹4,200 | ₹800 ✓ |
| Printing/Signage | ₹3,000 | ₹3,500 | -₹500 ✗ |
| Photography | ₹4,000 | ₹4,000 | ₹0 ✓ |
| **Total** | **₹55,000** | **₹55,700** | **-₹700** |

---

## 12. Housekeeping

### Housekeeping Schedule

| Area | Frequency | Tasks |
|------|-----------|-------|
| **Classrooms** | Daily + Weekly Deep Clean | Dust desks, mop floor, clean boards |
| **Labs** | Daily + Weekly Deep Clean | Wipe equipment, mop floor, organize |
| **Offices** | Daily | Dust, mop, trash removal |
| **Washrooms** | 3x Daily + Deep Clean Weekly | Scrub, sanitize, refill consumables |
| **Corridors** | Daily | Sweep, mop, trash removal |
| **Cafeteria** | After each meal + Deep Clean Daily | Wipe tables, mop, sanitize |
| **Library** | Daily | Dust shelves, organize, mop |
| **Auditorium** | Per event + Weekly | Dust, mop, seat cleaning |
| **Stairs** | Daily | Sweep, mop, railing clean |
| **Parking** | Daily | Sweep, trash removal |
| **Outdoor Areas** | Daily + Weekly | Sweep, garden maintenance |

### Housekeeping Checklist

| Task | Frequency | Mon | Tue | Wed | Thu | Fri | Sat |
|------|-----------|-----|-----|-----|-----|-----|-----|
| Classroom sweep & mop | Daily | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Washroom cleaning (AM) | 3x Daily | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Washroom cleaning (Noon) | 3x Daily | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Washroom cleaning (PM) | 3x Daily | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Trash collection | Daily | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Floor mopping (corridors) | Daily | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Cafeteria cleaning | Per meal | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Glass/window cleaning | Weekly | ☐ | — | — | — | — | ☐ |
| Deep clean classrooms | Weekly | — | — | ☐ | — | — | — |
| Deep clean washrooms | Weekly | — | — | — | ☐ | — | — |

### Housekeeping Quality Score

| Score | Description | Action Required |
|-------|-------------|----------------|
| 5 — Excellent | All areas pristine | Continue |
| 4 — Good | Minor issues found | Note and monitor |
| 3 — Average | Multiple issues | Corrective action required |
| 2 — Below Average | Significant cleaning needed | Supervisor intervention |
| 1 — Poor | Unacceptable condition | Immediate deep clean + review |

---

## 13. Utilities

### Utility Entity

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Auto-generated |
| `utilityType` | string | `electricity`, `water`, `internet`, `telephone`, `gas`, `waste_management` |
| `provider` | string | Service provider name |
| `accountNumber` | string | Account/connection number |
| `meterNumber` | optional string | Meter number |
| `branchId` | Id("branches") | Associated branch |
| `monthlyConsumption` | optional number | Current month usage |
| `unit` | string | `kwh`, `kl`, `gb`, `minutes`, `kg` |
| `costPerUnit` | optional number | Rate per unit |
| `monthlyCost` | optional number | Current month cost |
| `billingCycle` | string | `monthly`, `bimonthly`, `quarterly` |
| `lastPaymentDate` | optional number | Last payment date |
| `nextDueDate` | optional number | Next bill due date |
| `status` | string | `active`, `disconnected`, `pending_connection` |
| `createdAt` | number | Auto-generated |
| `updatedAt` | number | Auto-generated |

### Utility Consumption Tracking

| Utility | Unit | Jan | Feb | Mar | Apr | Trend |
|---------|------|-----|-----|-----|-----|-------|
| Electricity | kWh | 12,500 | 11,800 | 13,200 | 14,100 | ↑ |
| Water | kL | 450 | 420 | 480 | 510 | ↑ |
| Internet | GB | 2,100 | 2,300 | 2,450 | 2,600 | ↑ |
| Telephone | Min | 850 | 780 | 820 | 790 | → |

### Cost Analysis

| Utility | Monthly Avg (Q1) | Monthly Avg (Q2) | Change |
|---------|-----------------|-----------------|--------|
| Electricity | ₹1,25,000 | ₹1,41,000 | +12.8% |
| Water | ₹18,000 | ₹20,400 | +13.3% |
| Internet | ₹45,000 | ₹45,000 | 0% |
| Telephone | ₹8,500 | ₹7,900 | -7.1% |
| **Total** | **₹1,96,500** | **₹2,14,300** | **+9.1%** |

---

## 14. Administration Dashboard

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ADMINISTRATION DASHBOARD                                    │
│  [Branch: ▼] [Date: ▼] [Refresh]                            │
├─────────────────────────────────────────────────────────────┤
│  Visitors Today  Maint Open   Low Stock   Open PRs          │
│  ┌──────────┐   ┌─────────┐  ┌─────────┐ ┌──────────┐     │
│  │    24   │   │    7    │  │   12   │ │     5    │     │
│  │  checked  │   │  pending │  │  items   │ │  requests │     │
│  └──────────┘   └─────────┘  └─────────┘ └──────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Campus Utilization Today              Upcoming Events       │
│  ┌──────────────────────────┐        ┌───────────────────┐  │
│  │Classrooms  ████████ 60%  │        │ 15 Jul - PTM      │  │
│  │Labs        ██████  55%   │        │ 20 Jul - Workshop │  │
│  │Auditorium  ██      20%   │        │ 25 Jul - Exam     │  │
│  │Offices     ████████ 75%  │        │ 01 Aug - Seminar  │  │
│  └──────────────────────────┘        └───────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Pending Maintenance                    Inventory Alerts      │
│  ┌──────┬──────────┬─────────┬────────┐ ┌────────────────┐  │
│  │ #  │ Issue    │ Room    │ Prio   │ │ Item        │ Qty││
│  ├──────┼──────────┼─────────┼────────┤ ├────────────────┤  │
│  │ 1  │ AC not   │ Room 12 │ High   │ │ A4 Paper    │ 2  ││
│  │ 2  │ Leak     │ W-03    │ Medium │ │ Whiteboard  │ 0  ││
│  │ 3  │ Bulb     │ Lab 2   │ Low    │ │ Trash Bags  │ 5  ││
│  └──────┴──────────┴─────────┴────────┘ └────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Utility Consumption (Monthly)    Vendor Performance         │
│  ┌──────┬──────────┬──────────┐  ┌──────┬──────┬──────┐    │
│  │ Util  │ This Mth│ Last Mth │  │Vendor│ OT%  │ Qual │    │
│  ├──────┼──────────┼──────────┤  ├──────┼──────┼──────┤    │
│  │ Power │ ₹1.41L  │ ₹1.32L  │  │ ABC  │ 95%  │ 4.5  │    │
│  │ Water │ ₹20.4K  │ ₹19.2K  │  │ XYZ  │ 88%  │ 4.0  │    │
│  │ Net   │ ₹45K    │ ₹45K    │  │ PQR  │ 100% │ 5.0  │    │
│  └──────┴──────────┴──────────┘  └──────┴──────┴──────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard KPIs

| KPI | Description | Calculation |
|-----|-------------|-------------|
| **Visitors Today** | Checked-in visitors count | Count where entryTime = today |
| **Open Maintenance** | Active maintenance requests | Count where status != closed |
| **Low Stock Items** | Items below reorder point | Count where quantityOnHand < reorderPoint |
| **Open PRs** | Purchase requests pending approval | Count where status = "pending_approval" |
| **Room Utilization** | Currently used / total capacity rooms | Occupied / Available × 100 |
| **Maintenance SLA %** | Resolved within SLA | Resolved on time / Total resolved × 100 |
| **Utility Cost** | Total monthly utility expenses | Sum of all utility monthlyCost |
| **Vendor Rating** | Average vendor performance score | Avg of all active vendor ratings |

---

## 15. Cross Module Integration

### Integration Map

```
Administration (DOC-16)
      │
      ├──→ Technology (DOC-15)
      │     └── IT devices, biometric/CCTV devices, network — tracked in Tech
      │     └── Facility maintenance for IT equipment routes to Tech helpdesk
      │
      ├──→ HR (DOC-13)
      │     └── Staff attendance (biometric)
      │     └── Employee onboarding → ID card, workstation assignment
      │     └── Employee offboarding → asset return, access revocation
      │
      ├──→ Finance (DOC-08)
      │     └── Purchase requests → budget check, PO → payment
      │     └── Vendor payments
      │     └── Utility bill payments
      │     └── Event budget vs actual
      │
      ├──→ Workflow (DOC-10)
      │     └── Purchase request approvals
      │     └── Facility booking approvals
      │     └── Event approvals
      │     └── Maintenance request assignments
      │
      ├──→ Communication (DOC-09)
      │     └── Visitor notifications (host alert)
      │     └── Maintenance completion alerts
      │     └── Low stock alerts
      │     └── Utility payment reminders
      │
      ├──→ Sales (DOC-11)
      │     └── Event — lead generation from campus events
      │
      ├──→ Marketing (DOC-14)
      │     └── Event — campus events feed into campaigns
      │     └── Facility booking for marketing events
      │
      └──→ Student (DOC-07)
            └── Transport — student route assignment
            └── Hostel — room assignment (future)
```

### Integration with Existing Codebase

| Existing File | What It Does | DOC-16 Integration |
|---------------|-------------|-------------------|
| `organization.ts` | Org hierarchy (verticals, sub-verticals, boards) | Phase 1 — Campus hierarchy extends org tree |
| `organizationBranches.ts` | Branch CRUD (NP, OP, KL, PL) | Phase 1 — Campus maps to branch |
| `organizationDepartments.ts` | Department CRUD (Finance, Tech, Marketing, etc.) | Phase 1 — Department-Admin integration |
| `organizationTeams.ts` | Team CRUD | Phase 1 — Facility teams/assignees |
| `organizationDesignations.ts` | Designation hierarchy | Phase 1 — Admin staff designations |
| `seed.ts` | Seed data (4 branches, 7 departments, 8 users) | Phase 1 — Campus, rooms, inventory seed data |
| `crmCRM.ts` | CRM function exports | Phase 3 — Visitor CRM data linking |
| `notifications.ts` | In-app notification CRUD | Phase 2 — Visitor alerts, maintenance alerts |
| `tasks.ts` | Task management with participants | Phase 2 — Maintenance task creation |
| `approvals.ts` | Approval templates and requests | Phase 2 — Purchase request approvals |
| `users.ts` | User management | Phase 1 — Admin staff, facility in-charge |

---

## 16. AI Opportunities

### 1. Predictive Maintenance

ML model predicts when facility equipment needs service based on usage and historical failure data.

```
Input:  AC run hours, age, past repairs, ambient temperature
Output: Probability of failure in next 30 days, recommended service date
```

### 2. Utility Consumption Forecast

Predicts monthly utility consumption for budget planning.

```
Input:  Historical consumption, season, number of students/staff, weather
Output: Forecast electricity (kWh) and water (kL) for next 3 months
```

### 3. Inventory Optimization

Recommends optimal stock levels and reorder schedules.

```
Input:  Consumption rate, lead time, seasonal demand, budget
Output: Optimal min/max stock, reorder quantity, recommended reorder date
```

### 4. Vendor Recommendation

Suggests best vendor based on price, quality, and delivery performance.

```
Input:  Item category, quantity, budget, delivery deadline
Output: Ranked vendor list with score
```

### 5. Space Utilization Analysis

Analyzes room usage patterns to optimize space allocation.

```
Input:  Booking history, room capacity, time slots, department usage
Output: Utilization % by room/type, optimization recommendations
```

### 6. Security Alert Detection

AI analyzes CCTV feeds and access logs for unusual activity.

```
Input:  Entry/exit logs, visitor patterns, time of day, access attempts
Output: Anomaly score, alert if above threshold
```

### 7. Event Planning Assistant

Recommends optimal event parameters based on past events.

```
Input:  Event type, expected attendees, date, budget
Output: Recommended venue, catering quantity, equipment, staffing
```

### 8. Cleaning Schedule Optimization

Recommends optimal cleaning frequency based on usage patterns.

```
Input:  Room usage, foot traffic, events, complaints
Output: Dynamic cleaning schedule prioritizing high-traffic areas
```

---

## 17. Reports

### Report Catalog

| # | Report Name | Description | Frequency |
|---|-------------|-------------|-----------|
| 1 | **Visitor Report** | Visitor log with purpose, host, duration | Daily / Monthly |
| 2 | **Facility Report** | Facility usage, maintenance status, issues | Weekly |
| 3 | **Maintenance Report** | Open/completed maintenance, SLA, cost | Monthly |
| 4 | **Inventory Report** | Stock levels, reorder alerts, consumption | Weekly |
| 5 | **Vendor Report** | Vendor performance, contracts, payments | Monthly |
| 6 | **Purchase Report** | PR status, PO issued, delivery status | Monthly |
| 7 | **Transport Report** | Vehicle usage, fuel, maintenance, routes | Monthly |
| 8 | **Utility Report** | Consumption trends, cost analysis | Monthly |
| 9 | **Event Report** | Events held, budget vs actual, attendance | Per event |
| 10 | **Campus Utilization Report** | Room usage %, occupancy trends | Quarterly |
| 11 | **Security Report** | Incidents, access logs, patrol logs | Monthly |
| 12 | **Housekeeping Report** | Quality scores, complaints, deep cleaning | Weekly |

### Sample Report: Campus Utilization

```
CAMPUS UTILIZATION REPORT
Period: July 2026 | Branch: NP Campus

┌─────────────────┬────────┬────────┬──────────┬────────────┐
│ Room Type       │ Total  │ Used   │ Available│ Utilization │
├─────────────────┼────────┼────────┼──────────┼────────────┤
│ Classrooms      │ 24     │ 18     │ 6        │ 75%        │
│ Labs            │ 8      │ 5      │ 3        │ 62%        │
│ Library         │ 2      │ 2      │ 0        │ 100%       │
│ Offices         │ 12     │ 10     │ 2        │ 83%        │
│ Conference      │ 3      │ 1      │ 2        │ 33%        │
│ Auditorium      │ 2      │ 0      │ 2        │ 0%         │
├─────────────────┼────────┼────────┼──────────┼────────────┤
│ TOTAL           │ 51     │ 36     │ 15       │ 71%        │
└─────────────────┴────────┴────────┴──────────┴────────────┘

Top 5 Most Used Rooms:
┌──────────┬────────────────────┬────────────┬────────────┐
│ Room     │ Name              │ Hours/Week │ Department │
├──────────┼────────────────────┼────────────┼────────────┤
│ R-101    │ Physics Lab 1     │ 35 hrs     │ Science    │
│ R-201    │ Smart Classroom   │ 30 hrs     │ Mathematics│
│ R-105    │ Computer Lab 1    │ 28 hrs     │ Technology │
│ R-001    │ Admin Office      │ 45 hrs     │ Admin      │
│ R-LIB    │ Reference Library │ 50 hrs     │ All        │
└──────────┴────────────────────┴────────────┴────────────┘
```

### Sample Report: Monthly Maintenance Summary

```
MAINTENANCE REPORT — July 2026

┌──────────────┬────────┬────────┬──────────┬────────┬────────┐
│ Issue Type   │ Opened │ Closed │ Open     │ Avg    │ Cost   │
│              │        │        │          │ Hours  │        │
├──────────────┼────────┼────────┼──────────┼────────┼────────┤
│ AC           │ 12     │ 10     │ 2        │ 6.2    │ ₹8,500 │
│ Electrical   │ 8      │ 7      │ 1        │ 3.1    │ ₹3,200 │
│ Plumbing     │ 5      │ 4      │ 1        │ 4.5    │ ₹2,800 │
│ Furniture    │ 3      │ 3      │ 0        │ 2.0    │ ₹1,500 │
│ Internet     │ 4      │ 4      │ 0        │ 1.5    │ ₹0     │
│ Cleaning     │ 6      │ 6      │ 0        │ 1.0    │ ₹0     │
│ Other        │ 7      │ 5      │ 2        │ 8.0    │ ₹4,200 │
├──────────────┼────────┼────────┼──────────┼────────┼────────┤
│ TOTAL        │ 45     │ 39     │ 6        │ 3.8    │ ₹20,200│
└──────────────┴────────┴────────┴──────────┴────────┴────────┘

SLA Compliance: 86.7% (39/45 resolved, 6 within SLA window)
Average Resolution Time: 3.8 hours
Total Maintenance Cost: ₹20,200
```

---

## 18. Implementation Roadmap

### Phase Plan

| Phase | Focus | Key Features | Effort | Dependencies |
|-------|-------|-------------|--------|-------------|
| **P1** | Campus Hierarchy | Campus, Building, Room entities, CRUD | 2 weeks | Organization branches |
| **P1** | Facility Booking | Room booking, scheduling, conflict check | 2 weeks | Campus Hierarchy |
| **P2** | Inventory Management | Inventory items, stock in/out, low stock alerts | 2 weeks | — |
| **P2** | Vendor Management | Vendor master, categories, contracts, ratings | 1 week | — |
| **P3** | Purchase Requests | PR entity, approval flow, PO generation | 3 weeks | Vendor, Inventory, Workflow (DOC-10) |
| **P3** | Facility Maintenance | Facility assets, maintenance requests, AMC tracking | 2 weeks | Campus Hierarchy |
| **P4** | Visitor Management | Visitor registration, check-in/out, host notification | 2 weeks | Communication (DOC-09) |
| **P4** | Security Management | Incident logging, staff management, emergency protocols | 1 week | Visitor Management |
| **P4** | Housekeeping | Cleaning schedules, checklists, quality scoring | 1 week | Campus Hierarchy |
| **P5** | Transport Management | Vehicles, drivers, routes, fuel tracking | 2 weeks | HR (DOC-13) |
| **P5** | Utilities | Utility accounts, consumption, cost tracking | 1 week | Finance (DOC-08) |
| **P5** | Event Management | Event entity, budget tracking, resource planning | 2 weeks | Facility Booking, Vendor, Communication |
| **P6** | Admin Dashboard | KPI dashboard, charts, alerts, reports | 2 weeks | All preceding |
| **P6** | AI Operations | Predictive maintenance, utilization analysis | 4 weeks | Monitoring, Historical data |

### Dependency Graph

```
Campus Hierarchy ──→ Facility Booking ──→ Admin Dashboard
      │                                         │
      ├──→ Facility Maintenance                  │
      │                                          │
      ├──→ Housekeeping                          │
      │                                          │
Inventory ──→ Purchase Requests ──→ Reports      │
      │                       │                  │
Vendors ───────────────────────│                  │
                               │                  │
Visitors ──→ Security                            │
                               │                  │
Transport                                       │
                               │                  │
Utilities ──→ Cost Analysis                      │
                               │                  │
Events ──→ Budget → Reports                      │
                                                 ▼
                                           Admin Dashboard
```

### Priority Matrix

```
Priority: P1 (Critical)           Priority: P2 (High)
  ├── Campus Hierarchy              ├── Inventory Management
  └── Facility Booking              └── Vendor Management

Priority: P3 (Medium)             Priority: P4 (Standard)
  ├── Purchase Requests             ├── Visitor Management
  └── Facility Maintenance          ├── Security Management
                                    └── Housekeeping

Priority: P5 (Low)                Priority: P6 (Future)
  ├── Transport Management          ├── Admin Dashboard
  ├── Utilities                     └── AI Operations
  └── Event Management
```

---

## 19. Golden Rules

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          ADMINISTRATION GOLDEN RULES                         ║
║                                                              ║
║   1.  Administration owns facilities.                         ║
║                                                              ║
║   2.  Technology owns devices.                                ║
║                                                              ║
║   3.  HR owns people.                                        ║
║                                                              ║
║   4.  Finance owns purchasing.                                ║
║                                                              ║
║   5.  Workflow owns approvals.                                ║
║                                                              ║
║   6.  Everything has an owner.                                ║
║                                                              ║
║   7.  Everything has a location.                              ║
║                                                              ║
║   8.  Everything has a lifecycle.                             ║
║                                                              ║
║   9.  Everything is auditable.                                ║
║                                                              ║
║  10.  Every visitor is recorded.                              ║
║                                                              ║
║  11.  Every facility is assigned to someone.                  ║
║                                                              ║
║  12.  Every purchase requires approval.                       ║
║                                                              ║
║  13.  Stock is finite — inventory is tracked in real time.    ║
║                                                              ║
║  14.  Maintenance is scheduled, never reactive.               ║
║                                                              ║
║  15.  Daily operations end with a report. Every single day.   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendices

### Appendix A: Campus Hierarchy

```
Organization
  └── Company
        └── Campus (Physical Location)
              ├── Building
              │     ├── Floor
              │     │     ├── Wing
              │     │     │     ├── Room
              │     │     │     │     ├── Classroom (capacity, projector, whiteboard)
              │     │     │     │     ├── Lab (equipment list, safety gear)
              │     │     │     │     ├── Library (shelves, reading area)
              │     │     │     │     ├── Office (desks, cabinets)
              │     │     │     │     ├── Auditorium (stage, sound, lighting)
              │     │     │     │     ├── Conference Room (AV equipment)
              │     │     │     │     ├── Storage Room (racking, lockable)
              │     │     │     │     └── Common Area (seating, notice board)
              │     │     │     └── Corridor / Stairway
              │     │     └── Washroom (per floor)
              │     └── Building Facilities (lift, ramp, fire exit)
              ├── Parking Area
              ├── Hostel (if residential)
              │     ├── Block
              │     │     ├── Floor
              │     │     │     └── Room (single, double, dormitory)
              │     │     └── Common Room
              │     └── Warden Office
              ├── Cafeteria (kitchen, dining, counter)
              ├── Sports Area (indoor/outdoor courts)
              └── Grounds (garden, open area, playground)
```

### Appendix B: Inventory Categories

| Code | Category | Sub-Categories |
|------|----------|---------------|
| STN | Stationery | Pens, pencils, paper, notebooks, folders, staplers, markers, tape, glue, envelopes |
| BOOK | Books & Publications | Textbooks, reference, magazines, newspapers, journals |
| UNI | Uniform | Shirts, pants, ties, blazers, belts, badges, shoes, socks |
| IDC | ID Cards | PVC cards, lanyards, card holders, badge reels |
| FUR | Furniture | Chairs, desks, tables, shelves, cabinets, sofas, whiteboards, notice boards |
| CON | Consumables | Toilet paper, paper towels, soap, sanitizer, tissues, trash bags, air freshener |
| CLN | Cleaning Supplies | Detergent, disinfectant, mops, buckets, brooms, dusters, gloves, wipes |
| EXAM | Exam Material | Answer sheets, question papers, seal tapes, admit cards, OMR sheets |
| LAB | Lab Equipment | Beakers, test tubes, chemicals, specimen, slides, gloves, goggles, aprons |
| SPO | Sports Equipment | Balls, nets, racquets, bats, mats, cones, jerseys, whistles, stopwatches |
| ELEC | Electrical | Bulbs, tubes, switches, wires, sockets, batteries, fans, regulators |
| KIT | Kitchen Utensils | Plates, glasses, bowls, spoons, cups, trays, serving dishes |
| PRT | Printing & Binding | Toner, ink cartridges, binding combs, laminating sheets, paper reams |
| MISC | Miscellaneous | First aid kits, signage, badges, certificates, trophies, gifts |

### Appendix C: Vendor Categories

| Code | Category | Description |
|------|----------|-------------|
| AMC | AMC Provider | Annual Maintenance Contracts for AC, generator, lift, fire safety |
| SUP | General Supplier | Office supplies, stationery, consumables |
| MNT | Maintenance Services | Plumbing, electrical, carpentry, painting, civil work |
| PRT | Printing Services | Brochures, banners, forms, letterheads, flex, visiting cards |
| TRN | Transport Services | Bus operators, vehicle maintenance, fuel supply |
| CAT | Catering Services | Food suppliers, event catering, mess services |
| SEC | Security Services | Guard deployment, security equipment, monitoring |
| HKK | Housekeeping Services | Cleaning staff, janitorial supplies, deep cleaning |
| ITV | IT Vendors | Computer repair, networking, software licensing |
| LAB | Lab Supplies | Scientific equipment, chemicals, glassware, specimens |
| SPO | Sports Suppliers | Sports equipment, uniforms, trophies |
| ELE | Electrical Suppliers | Electrical fittings, wires, panels, lighting |
| CON | Construction | Furniture, renovation, interior work |
| CLO | Cloud Services | Cloud subscriptions, hosting, domains (IT) |
| CON | Consultants | Legal, compliance, audit, training |

### Appendix D: Daily Operations Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  DAILY OPERATIONS CHECKLIST                                  │
│  Date: ___________  Branch: ___________  Admin: ___________ │
├─────────────────────────────────────────────────────────────┤
│  OPENING (8:00 AM)                                           │
│  ☐ Main gates unlocked                                       │
│  ☐ All building doors unlocked                               │
│  ☐ Biometric systems activated                               │
│  ☐ CCTV system verified                                      │
│  ☐ Security guard posts filled                               │
│                                                              │
│  FACILITY INSPECTION (8:00 - 9:00 AM)                        │
│  ☐ All classrooms inspected for cleanliness                  │
│  ☐ AC systems operational (target temp check)                │
│  ☐ Lighting functional in all areas                          │
│  ☐ Water supply available (all washrooms)                    │
│  ☐ Internet connectivity verified                            │
│  ☐ Washrooms clean and stocked                               │
│                                                              │
│  STAFF & STUDENT OPERATIONS (9:00 AM - 5:00 PM)              │
│  ☐ Staff attendance recorded                                 │
│  ☐ Visitor desk operational                                  │
│  ☐ Maintenance issues logged as they occur                   │
│  ☐ Inventory issues/returns recorded                         │
│  ☐ Transport schedule followed                               │
│  ☐ Mid-day facility check completed (1:00 PM)                │
│                                                              │
│  CLOSING (5:00 - 8:00 PM)                                    │
│  ☐ Evening cleaning completed                                │
│  ☐ All rooms locked                                          │
│  ☐ AC units switched off / timers set                        │
│  ☐ Lights switched off (except emergency)                    │
│  ☐ All visitors checked out                                  │
│  ☐ Main gates locked                                         │
│  ☐ Alarm system activated                                    │
│  ☐ Daily report submitted                                    │
├─────────────────────────────────────────────────────────────┤
│  INCIDENTS / ISSUES TODAY:                                   │
│  _________________________________________________________  │
│  _________________________________________________________  │
├─────────────────────────────────────────────────────────────┤
│  ADMIN SIGNATURE: ___________________________                │
└─────────────────────────────────────────────────────────────┘
```

### Appendix E: Existing Code Integration Points

| Existing File | What It Does | DOC-16 Integration |
|---------------|-------------|-------------------|
| `organization.ts` | Org hierarchy (verticals, sub-verticals, boards) | Phase 1 — Campus and building entities extend org model |
| `organizationBranches.ts` | Branch CRUD (NP, OP, KL, PL) | Phase 1 — Each branch has one+ campuses mapped |
| `organizationDepartments.ts` | Department CRUD | Phase 1 — Department-Admin integration for room ownership |
| `organizationTeams.ts` | Team management | Phase 1 — Admin/Facility teams |
| `organizationDesignations.ts` | Designation hierarchy | Phase 1 — Admin role designations |
| `seed.ts` | DB seed data | Phase 1 — Seed campuses, rooms, inventory, sample vendors |
| `notifications.ts` | In-app notifications | Phase 2 — Visitor arrival alert, maintenance resolved |
| `tasks.ts` | Task management | Phase 2 — Maintenance tasks created automatically |
| `approvals.ts` | Approval templates | Phase 2 — Purchase request approval routing |
| `users.ts` | User management | Phase 1 — Facility in-charge, admin staff |
| `crmCRM.ts` | CRM function re-exports | Phase 3 — Visitor CRM lookup integration |

---

*End of DOC-16 — Administration, Facilities & Operations Engine Bible*
