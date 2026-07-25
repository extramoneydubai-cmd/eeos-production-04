# Global People Registry — Enterprise Guide

## Overview

The Global People Registry is the single source of truth for all persons in EEOS — employees, students, parents, faculty, leads, vendors, and any other individual. No module may maintain its own person data. All modules reference the People Registry via `personId`.

## Architecture

```
Global People Registry
│
├── Person Master
│   └── personMaster → Core identity (name, DOB, gender, nationality, etc.)
│
├── Profiles (multi-type)
│   ├── personProfiles → Student, Employee, Faculty, Parent, Lead, Vendor, etc.
│   └── profileEngine → CRUD, primary profile management, find by profile
│
├── Contact Methods
│   ├── contactMethods → Email, phone, mobile, WhatsApp, etc.
│   ├── contactEngine → CRUD, verification, preferred contact
│   └── Visibility: public, organization, department, private, emergency_only
│
├── Addresses
│   └── addresses → Home, office, billing, shipping, permanent, current, emergency
│
├── Relationships
│   ├── relationships → Family (spouse, child, parent), professional (reports_to)
│   └── relationshipEngine → Link, unlink, family tree, reporting hierarchy
│
├── Emergency Contacts
│   ├── emergencyContacts → Owner + contact person + relationship + priority
│   └── emergencyContactEngine → CRUD, priority ordering, emergency info
│
├── Social Links
│   └── socialLinks → LinkedIn, Twitter, GitHub, etc.
│
├── Documents
│   └── personDocuments → Identity docs, certificates, agreements
│
├── QR Code
│   └── personQRCode → Auto-generated QR token + deep link
│
└── Search
    ├── globalSearch → Score-based with profiles and contacts
    ├── quickSearch → Lightweight autocomplete
    └── findPersonByContact → Lookup by phone/email
```

## Database Tables (10+)

| Table | Purpose | Engine |
|-------|---------|--------|
| `personMaster` | Core person identity | `personEngine.ts` |
| `personProfiles` | Multi-type profiles (student, employee, etc.) | `profileEngine.ts` |
| `contactMethods` | Email, phone, mobile, etc. | `contactEngine.ts` |
| `addresses` | Physical addresses (home, office, etc.) | Built-in |
| `relationships` | Person-to-person links | `relationshipEngine.ts` |
| `emergencyContacts` | Emergency contact information | `emergencyContactEngine.ts` |
| `socialLinks` | Social media profiles | Built-in |
| `personDocuments` | Identity documents | Built-in |
| `personQRCode` | QR code tokens | `personQRCode.ts` |

## Features

### 1. Person Master
- Names: first, middle, last, display, preferred
- Demographics: gender, DOB, nationality, marital status, blood group
- Locale: preferred language, timezone
- Status: active, archived (with archive/restore)

### 2. Multi-Type Profiles
Each person can have multiple profiles (e.g., a person can be both Employee and Parent):
- Profile types: student, employee, faculty, parent, lead, vendor, etc.
- Primary profile flag per type
- Active/inactive status
- Start/end dates
- Metadata JSON for extensibility

### 3. Contact Methods
- Types: email, mobile, phone, WhatsApp, etc.
- Labels for custom naming
- Country code for phone numbers
- Preferred flag (one per type)
- Verification with timestamp
- Visibility levels: public, organization, department, private, emergency_only

### 4. Addresses
- Types: home, office, billing, shipping, permanent, current, emergency
- Full address with area, city, state, country, postal code
- Latitude/longitude for mapping
- Primary address flag
- Label for custom naming

### 5. Relationships
- Bidirectional linking between any two persons
- Relationship types: spouse, child, parent, sibling, reports_to, etc.
- Active/inactive with start/end dates
- Metadata JSON

### 6. Emergency Contacts
- Links owner person to contact person
- Relationship description
- Priority ordering (1 = highest)
- Enriched with contact person name, photo, phone, email
- Auto-sorted by priority

### 7. Family Tree
- Recursive tree traversal with configurable max depth
- Relationships enriched with direction
- Duplicate prevention via visited set

### 8. Reporting Hierarchy
- Manager (reports_to) relationships
- Direct reports listing
- Enriched with profiles

### 9. QR Code
- Auto-generated on person creation
- 32-char hex token (SHA-256)
- Deep link: `eeos://person/{personId}`
- Active/inactive toggle
- Regeneration support

### 10. Person Merge
Comprehensive merge that moves all related data from source to target:
- Profiles, contacts, addresses, emergency contacts
- Relationships (both directions)
- Social links, documents, QR code
- Deduplication of contacts by type+value

### 11. Global Search
Score-based search with five match levels:
- 100: Exact display name match
- 90: Full name match
- 80: First or last name exact match
- 50: Display name contains match
- 20: Partial word match
- Plus contact value lookups (95 score)

Results include profiles, contacts (excluding private visibility), and matched field.

## API Reference

### Person Engine (`personEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `createPerson(args)` | Create person with auto-generated ID + QR code |
| `updatePerson(args)` | Update person fields (auto-computes displayName) |
| `archivePerson({ personId })` | Soft delete |
| `restorePerson({ personId })` | Restore from archive |
| `mergePersons({ sourcePersonId, targetPersonId })` | Merge all data from source to target |

| Query | Description |
|-------|-------------|
| `getPerson({ personId })` | Full person with profiles, contacts, addresses, social, QR |
| `getPersonBasic({ personId })` | Person record only |
| `listPersons(filter)` | Paginated person list |
| `searchPersons({ searchTerm })` | Basic search (name + contact) |

### Profile Engine (`profileEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `addProfile(args)` | Add a profile (auto-manages primary flag) |
| `updateProfile(args)` | Update profile fields |
| `removeProfile({ profileId })` | Delete a profile |
| `setPrimaryProfile(args)` | Set primary profile for a type |

| Query | Description |
|-------|-------------|
| `listProfiles(filter)` | List profiles by person/type/active |
| `getPrimaryProfile(filter)` | Get primary profile for a type |
| `findPersonsByProfile(filter)` | Find persons by profile type |

### Contact Engine (`contactEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `addContactMethod(args)` | Add contact (auto-unset previous preferred) |
| `updateContactMethod(args)` | Update contact fields |
| `removeContactMethod({ contactId })` | Delete a contact |
| `verifyContactMethod({ contactId, verified })` | Verify/unverify with timestamp |
| `setPreferredContact(args)` | Set preferred contact for a type |

| Query | Description |
|-------|-------------|
| `listContactMethods(filter)` | List contacts by person/type/active |
| `getPreferredContact(filter)` | Get preferred contact for a type |
| `findPersonByContact({ type, value })` | Find person by phone/email |

### Relationship Engine (`relationshipEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `linkPersons(args)` | Create relationship (duplicate check) |
| `unlinkPersons({ relationshipId })` | Soft delete relationship |
| `changeRelationship(args)` | Update relationship fields |

| Query | Description |
|-------|-------------|
| `getPersonRelationships(filter)` | Get relationships (both directions) |
| `getFamilyTree({ personId, maxDepth? })` | Recursive family tree |
| `getReportingHierarchy({ personId })` | Managers + direct reports |

### Emergency Contact Engine (`emergencyContactEngine.ts`) — New

| Mutation | Description |
|----------|-------------|
| `addEmergencyContact(args)` | Add emergency contact (duplicate check) |
| `updateEmergencyContact(args)` | Update emergency contact |
| `removeEmergencyContact({ emergencyContactId })` | Soft delete (set inactive) |
| `deleteEmergencyContact({ emergencyContactId })` | Hard delete |
| `setEmergencyContactPriority({ emergencyContactId, priority })` | Reorder priority |

| Query | Description |
|-------|-------------|
| `listEmergencyContacts({ ownerPersonId })` | List with enriched contact person details |
| `getEmergencyContact({ emergencyContactId })` | Single with enrichment |
| `getPersonEmergencyInfo({ personId })` | Emergency info with blood group + contacts |

### Person Search (`personSearch.ts`)

| Query | Description |
|-------|-------------|
| `globalSearch(args)` | Score-based search with profiles/contacts |
| `quickSearch(args)` | Lightweight autocomplete (min 2 chars) |
| `findByPersonId({ personIdStr })` | Search by name/ID |
| `getPersonDataSummary({ personId })` | Complete person data summary |

### QR Code (`personQRCode.ts`)

| Mutation | Description |
|----------|-------------|
| `generateQrCode({ personId })` | Generate QR token |
| `regenerateQrCode({ personId })` | Regenerate token |
| `deactivateQrCode({ personId })` | Deactivate QR |

| Query | Description |
|-------|-------------|
| `lookupByQrToken({ qrToken })` | Find person by QR |
| `getPersonQrCode({ personId })` | Get person's QR code |

## Person Merge Flow

```
Source Person → Target Person

1. Move profiles    (personProfiles)         personId → target
2. Move contacts    (contactMethods)         deduplicate by type:value
3. Move addresses   (addresses)              personId → target
4. Move emergency   (emergencyContacts)      ownerPersonId → target
5. Move relations   (relationships)          both personA/personB → target
6. Move social      (socialLinks)            personId → target
7. Move documents   (personDocuments)        personId → target
8. Move QR code     (personQRCode)           personId → target
9. Delete source    (personMaster)           remove source
```

## Contact Visibility Levels

| Level | Description |
|-------|-------------|
| `public` | Visible to everyone |
| `organization` | Visible within same organization |
| `department` | Visible within same department |
| `private` | Visible only to the person |
| `emergency_only` | Visible only for emergency purposes |
