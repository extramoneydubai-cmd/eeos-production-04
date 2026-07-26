# EEOS People Registry Workspace

**PATCH-UI-002** — Complete Global People Registry UI built on the WorkspaceShell framework.

---

## Overview

The People Registry is the centralized identity system for EEOS. Every person in the organization — students, employees, parents, faculty, vendors, applicants — has a single person record in the `personMaster` table.

This workspace provides:

- **People Database** (`/people`) — List, search, filter, and create person records
- **Person Workspace** (`/people/:personId`) — Full person profile with tabs for Overview, Contacts, Relationships, QR Code, Documents, Timeline, Tasks, Notes, and Activity

---

## Architecture

```
PeopleDatabase.tsx         →  api.personEngine.listPersons
                              api.personEngine.createPerson
                              api.personEngine.archivePerson

PersonWorkspace.tsx        →  WorkspaceShell (config-driven)
  ├── Overview Tab         →  Person info, contacts, addresses, social links, quick stats
  ├── Contacts Tab         →  api.contactEngine (add/remove contact methods)
  ├── Relationships Tab    →  api.relationshipEngine (link/unlink persons)
  ├── QR Code Tab          →  api.personQRCode (generate/regenerate/view QR)
  ├── Documents Tab        →  WorkspaceDocumentsTab (AttachmentPanel)
  ├── Timeline Tab         →  WorkspaceTimelineTab (TimelineView)
  ├── Tasks Tab            →  WorkspaceTasksTab
  ├── Notes Tab            →  WorkspaceNotesTab (CommentPanel)
  └── Activity Tab         →  WorkspaceActivityTab (ActivityTimeline)
```

---

## Backend Dependencies

| Engine | File | Role |
|--------|------|------|
| Person Engine | `src/convex/personEngine.ts` | CRUD, merge, archive, search, QR generation |
| Profile Engine | `src/convex/profileEngine.ts` | Person profiles (student, employee, etc.) |
| Contact Engine | `src/convex/contactEngine.ts` | Email, phone, WhatsApp contact methods |
| Relationship Engine | `src/convex/relationshipEngine.ts` | Family, guardian, emergency, colleague links |
| Emergency Contact Engine | `src/convex/emergencyContactEngine.ts` | Emergency contacts with priorities |
| Person Search | `src/convex/personSearch.ts` | Global search, quick search, person discovery |
| QR Code | `src/convex/personQRCode.ts` | Generate, regenerate, deactivate, resolve QR tokens |

## Schema Tables

| Table | Purpose |
|-------|---------|
| `personMaster` | Core person record (name, DOB, gender, nationality, blood group, status) |
| `personProfiles` | Person type profiles (student, employee, faculty, parent) |
| `contactMethods` | Email, phone, WhatsApp, website per person |
| `addresses` | Physical addresses per person |
| `relationships` | Person-to-person links with types (family, guardian, etc.) |
| `emergencyContacts` | Emergency contacts with priority ordering |
| `socialLinks` | Social media / web links per person |
| `personQRCode` | QR code tokens and deep links |
| `personDocuments` | Documents attached to a person |

---

## API Reference

### Person Engine (`personEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `createPerson(args)` | Create person with auto-generated QR code |
| `updatePerson(args)` | Update person fields (auto-computes displayName) |
| `archivePerson({ personId })` | Soft delete (sets status to "archived") |
| `restorePerson({ personId })` | Restore from archive |
| `mergePersons({ sourcePersonId, targetPersonId })` | Merge all data from source to target |

| Query | Description |
|-------|-------------|
| `getPerson({ personId })` | Full person with profiles, contacts, addresses, social, QR |
| `getPersonBasic({ personId })` | Person record only |
| `listPersons(filter)` | Paginated person list with status filter |
| `searchPersons({ searchTerm })` | Basic search (name + contact) |

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

---

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

---

## WorkspaceShell Integration

The Person Workspace uses the `WorkspaceShell` framework from PATCH-UI-001.

### Tab Definitions

```tsx
const tabs: WorkspaceTabDefinition[] = [
  { id: "overview",     label: "Overview",     icon: User,        component: OverviewTab },
  { id: "contacts",     label: "Contacts",     icon: Phone,       component: ContactsTab },
  { id: "relationships",label: "Relationships",icon: Network,     component: RelationshipsTab },
  { id: "qr",           label: "QR Code",      icon: QrCode,      component: QRTab },
  { id: "documents",    label: "Documents",    icon: FileText,    component: WorkspaceDocumentsTab },
  { id: "timeline",     label: "Timeline",     icon: Activity,    component: WorkspaceTimelineTab },
  { id: "tasks",        label: "Tasks",        icon: Award,       component: WorkspaceTasksTab },
  { id: "notes",        label: "Notes",        icon: MessageSquare, component: WorkspaceNotesTab },
  { id: "activity",     label: "Activity",     icon: Activity,    component: WorkspaceActivityTab },
];
```

### Smart Actions

| Action | Icon | Behavior |
|--------|------|----------|
| Edit | `Edit3` | Edit person fields (coming soon) |
| QR Code | `QrCode` | View QR code in QR tab |
| Archive | `Archive` | Soft-delete the person record |

---

## Platform SDK Integration

The People Registry consumes:

- ✅ **peopleSdk** — Person CRUD
- ✅ **timelineSdk** — Timeline events
- ✅ **documentSdk** — Document storage
- ✅ **taskSdk** — Task management
- ✅ **communicationSdk** — Notes & comments
- ✅ **eventSdk** — Activity events
- ✅ **visibilitySdk** — Field-level visibility
- ✅ **permissionSdk** — Action-level permissions

---

## File Inventory

| File | Type | Purpose |
|------|------|---------|
| `src/pages/PeopleDatabase.tsx` | Page | Person list with search, filter, create, pagination |
| `src/pages/PersonWorkspace.tsx` | Page | Person detail using WorkspaceShell |
| `src/lib/routes.ts` | Config | Route registration (`/people`, `CircleUser` icon) |
| `src/main.tsx` | Config | Lazy import + route wiring |
| `docs/PEOPLE_WORKSPACE.md` | Doc | This document |

---

## Usage

```tsx
// Navigate to People Database
navigate("/people");

// Open a person workspace
navigate(`/people/${personId}`);

// Create a person from any page
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
const createPerson = useMutation(api.personEngine.createPerson);

await createPerson({
  firstName: "John",
  lastName: "Doe",
  gender: "male",
  nationality: "Indian",
});
```
