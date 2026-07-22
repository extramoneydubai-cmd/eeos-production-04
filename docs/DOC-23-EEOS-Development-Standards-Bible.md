# DOC-23 — EEOS Database Naming, Schema & Development Standards Bible

> **Version**: 1.0  
> **Status**: LOCKED — Change requires architecture review  
> **Owner**: EEOS Architecture Team  
> **Last Updated**: 2026-07-14  
> **Suggested Path**: `04-Platform/DOC-23 — EEOS Database Naming, Schema & Development Standards Bible.md`

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Folder Structure Standards](#2-folder-structure-standards)
3. [File Naming Standards](#3-file-naming-standards)
4. [Database Naming Standards](#4-database-naming-standards)
5. [Column Naming Standards](#5-column-naming-standards)
6. [ID Strategy](#6-id-strategy)
7. [Audit Field Standards](#7-audit-field-standards)
8. [Indexing Standards](#8-indexing-standards)
9. [Relationship Standards](#9-relationship-standards)
10. [Convex Standards](#10-convex-standards)
11. [API Standards](#11-api-standards)
12. [UI Standards](#12-ui-standards)
13. [Engine Standards](#13-engine-standards)
14. [Permission Standards](#14-permission-standards)
15. [Event Naming Standards](#15-event-naming-standards)
16. [Validation Standards](#16-validation-standards)
17. [Error Handling Standards](#17-error-handling-standards)
18. [Logging Standards](#18-logging-standards)
19. [Performance Standards](#19-performance-standards)
20. [Security Standards](#20-security-standards)
21. [Testing Standards](#21-testing-standards)
22. [Documentation Standards](#22-documentation-standards)
23. [Golden Rules](#23-golden-rules)

---

## 1. Purpose

### Why Standards Are Required

EEOS is an enterprise platform designed to scale across hundreds of educational institutions, thousands of users, and dozens of business modules. Without strict development standards, the codebase becomes:

- **Inconsistent**: Different developers use different patterns for the same problem
- **Unmaintainable**: No one can predict where to find anything
- **Unscalable**: Performance issues hide behind non-standard patterns
- **AI-unfriendly**: Inconsistent naming confuses AI code generation tools
- **Undebuggable**: Non-standard logging and errors make production issues impossible to diagnose

### Goals

| Goal | Description |
|------|-------------|
| **Consistency** | Every file, table, column, API, and event follows the same naming rules |
| **Maintainability** | Any developer can navigate the entire codebase in 5 minutes |
| **Scalability** | Patterns enforce performance from day one |
| **AI-friendly** | Predictable structure enables AI code generation with high accuracy |
| **Low-code ready** | Standards enable configuration-driven development |
| **Enterprise quality** | Audit, security, and compliance are baked into every decision |

### Enforcement

These standards are **LOCKED**. They can only be changed via architecture review documented in `11-Decisions/DECISION_LOG.md`.

Every PR must pass a standards review before merging.

Automated linting and type checking enforce naming conventions where possible.

---

## 2. Folder Structure Standards

### 2.1 Top-Level Project Structure

```
eeos/
├── PLATFORM.md              # Platform architecture documentation
├── README.md                # Repository overview
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.app.json        # Frontend TypeScript config
├── tsconfig.node.json       # Node TypeScript config
├── vite.config.ts           # Vite bundler configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── convex.json              # Convex deployment configuration
├── index.html               # HTML entry point
│
├── public/                  # Static assets (unprocessed)
│   ├── favicon.svg
│   ├── logo.svg
│   └── manifest.webmanifest
│
└── src/                     # Application source code
    ├── main.tsx             # Application entry point
    ├── index.css            # Global styles + CSS variables
    ├── vite-env.d.ts        # Vite type declarations
    │
    ├── config/              # Application configuration
    │   ├── app.ts           # App name, version, feature flags
    │   └── studios.ts       # Studio registry
    │
    ├── lib/                 # Utilities and registries
    │   ├── utils.ts         # shadcn cn() utility
    │   ├── routes.ts        # Route registry
    │   ├── features.ts      # Feature flag system
    │   ├── component-registry.ts  # Reusable component docs
    │   └── design-tokens.ts       # Design token documentation
    │
    ├── hooks/               # React hooks
    │   ├── use-auth.ts      # Authentication hook
    │   └── use-mobile.ts    # Mobile detection
    │
    ├── components/          # React components
    │   ├── ui/              # shadcn/ui primitives (auto-generated)
    │   ├── layout/          # App shell components
    │   │   ├── DashboardLayout.tsx
    │   │   ├── StudioLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Header.tsx
    │   ├── data/            # Data display components
    │   │   ├── DataTable.tsx
    │   │   ├── SearchBar.tsx
    │   │   └── FilterBar.tsx
    │   └── shared/          # Reusable shared components
    │       ├── CrudDialog.tsx
    │       ├── EmptyState.tsx
    │       ├── LoadingState.tsx
    │       ├── PermissionWrapper.tsx
    │       ├── CommandPalette.tsx
    │       ├── NotificationCenter.tsx
    │       ├── GlobalSearch.tsx
    │       ├── StatisticsCard.tsx
    │       ├── GlobalToolbar.tsx
    │       └── DashboardWidget.tsx
    │
    ├── pages/               # Route-level page components
    │   ├── Landing.tsx      # / (public)
    │   ├── Auth.tsx         # /auth (public)
    │   ├── Dashboard.tsx    # /dashboard (protected)
    │   ├── NotFound.tsx     # * (404)
    │   └── studio/          # Studio pages
    │       ├── OrganizationStudio.tsx
    │       ├── MasterDataStudio.tsx
    │       ├── AccessControlStudio.tsx
    │       ├── WorkflowStudio.tsx
    │       ├── TaskStudio.tsx
    │       ├── CRMStudio.tsx
    │       └── SalesStudio.tsx
    │
    ├── convex/              # Convex backend
    │   ├── schema.ts        # Database schema (single source of truth)
    │   ├── auth.config.ts   # Auth configuration
    │   ├── auth.ts          # Auth handlers
    │   ├── http.ts          # HTTP action handlers
    │   ├── users.ts         # User queries/mutations
    │   ├── _generated/      # Auto-generated Convex types
    │   │   ├── api.d.ts
    │   │   ├── api.js
    │   │   ├── dataModel.d.ts
    │   │   ├── server.d.ts
    │   │   └── server.js
    │   ├── organization/    # Organization module backend
    │   │   ├── organizations.ts
    │   │   ├── branches.ts
    │   │   ├── departments.ts
    │   │   └── teams.ts
    │   └── engines/         # Platform engines (future)
    │       ├── sequenceEngine.ts
    │       ├── activityEngine.ts
    │       └── notificationEngine.ts
    │
    └── assets/              # Processed assets
        └── logo.svg
```

### 2.2 Purpose of Each Folder

| Folder | Purpose | Who Creates |
|--------|---------|-------------|
| `src/config/` | Static configuration objects (app name, studios, features) | Architecture team |
| `src/lib/` | Pure utility functions, registries, helpers — no JSX | Any module |
| `src/hooks/` | Custom React hooks | Any module |
| `src/components/ui/` | shadcn/ui primitives — do not hand-edit | Auto-generated (CLI) |
| `src/components/layout/` | App shell components (sidebar, header, layouts) | Architecture team |
| `src/components/data/` | Data display components (tables, search, filters) | Architecture team |
| `src/components/shared/` | Reusable cross-module components | Architecture team |
| `src/pages/` | Route-level page components | Module team |
| `src/pages/studio/` | Studio page components | Module team |
| `src/convex/` | All Convex backend code | Module team |
| `src/convex/engines/` | Platform engine implementations | Architecture team |
| `src/convex/_generated/` | Auto-generated Convex types | CLI (`npx convex dev`) |
| `src/assets/` | Processed assets (images, icons) | Design team |

### 2.3 Module Folder Convention (Future)

When a business module is implemented, it gets its own subfolder:

```
src/convex/{module}/       # Backend queries/mutations
src/pages/{module}/        # Frontend page components
```

Example:
```
src/convex/crm/
├── leads.ts
├── leadProfiles.ts
├── families.ts
├── familyContacts.ts
└── counsellings.ts

src/pages/crm/
├── LeadsPage.tsx
├── LeadDetailPage.tsx
└── LeadPipelineView.tsx
```

---

## 3. File Naming Standards

### 3.1 Naming Rules

| Entity Type | Case | Example |
|-------------|------|---------|
| React components | PascalCase | `OrganizationStudio.tsx`, `DataTable.tsx` |
| Page components | PascalCase | `Dashboard.tsx`, `NotFound.tsx` |
| Convex query/mutation files | camelCase or kebab-case | `branches.ts`, `leadProfiles.ts` |
| Convex engines | camelCase | `sequenceEngine.ts`, `activityEngine.ts` |
| Utility files | camelCase | `utils.ts`, `design-tokens.ts` |
| Configuration files | kebab-case | `app.ts`, `auth.config.ts` |
| Hooks | kebab-case with `use-` prefix | `use-auth.ts`, `use-mobile.ts` |
| Styles | kebab-case | `index.css`, `landing.css` |
| TypeScript types | PascalCase | `UserType.ts`, `OrganizationType.ts` |
| Markdown docs | PascalCase with DOC prefix | `DOC-22-EEOS-Core-Platform-Engines-Bible.md` |

### 3.2 File Extension Rules

| Extension | When to Use |
|-----------|-------------|
| `.tsx` | React components (contain JSX) |
| `.ts` | Pure TypeScript (no JSX) |
| `.css` | Stylesheets |
| `.md` | Documentation |

### 3.3 Index Files

Each component group directory should have an `index.ts` barrel file for clean imports:

```ts
// src/components/shared/index.ts
export { CrudDialog } from "./CrudDialog";
export { EmptyState } from "./EmptyState";
export { LoadingState } from "./LoadingState";
export { PermissionWrapper } from "./PermissionWrapper";
```

### 3.4 Test Files

```
{filename}.test.ts       → Unit tests
{filename}.spec.ts       → Integration tests
{filename}.perf.ts       → Performance tests
__tests__/{filename}.ts  → Alternative location
```

---

## 4. Database Naming Standards

### 4.1 Table Naming Rules

| Rule | Example |
|------|---------|
| **Plural nouns** — tables hold collections | `organizations`, `branches`, `departments` |
| **snake_case** — lowercase with underscores | `lead_stage_history`, `notification_templates` |
| **No abbreviations** — always full words | `organizations` not `orgs`, `departments` not `depts` |
| **Entity-first** — the core entity name | `lead_masters`, `student_profiles` |
| **No prefixes** — no `tbl_`, `mst_`, `trn_` | `users` not `tbl_users` |
| **Join tables** — combine entity names with `_` | `program_subjects`, `batch_faculty` |
| **History tables** — append `_history` or `_log` | `sequence_history`, `lead_status_history` |
| **Preference tables** — append `_preferences` | `notification_preferences` |
| **Template tables** — append `_templates` | `notification_templates`, `report_templates` |

### 4.2 Table Naming Examples

| Correct | Incorrect | Why |
|---------|-----------|-----|
| `organizations` | `org`, `organization_master` | Plural, full word |
| `lead_masters` | `leads`, `LeadMaster`, `tbl_lead` | Descriptive, no prefixes |
| `notification_templates` | `notif_temp`, `noti_templates` | No abbreviations |
| `program_subjects` | `programsubject`, `ProgramSubject` | Join table with `_` |
| `audit_logs` | `audit`, `tbl_audit_log` | Descriptive name |
| `academic_sessions` | `sessions`, `academic_session_master` | Full context |

### 4.3 Schema Validation Naming

| Rule | Example |
|------|---------|
| Schema validation uses snake_case | `v.id("organizations")` |
| Schema field names match table columns | `organizationId`, `isActive` |
| Index names start with `by_` | `by_code`, `by_organization` |

---

## 5. Column Naming Standards

### 5.1 Core Rules

| Rule | Example |
|------|---------|
| **camelCase** — JavaScript convention | `createdAt`, `isActive`, `organizationId` |
| **No snake_case in schema** | `organizationId` not `organization_id` |
| **No abbreviations** | `organizationId` not `orgId` |
| **Descriptive** | `preferredContactTime` not `contactTime` |
| **Boolean prefix with `is`, `has`, `can`** | `isActive`, `isArchived`, `hasPortalAccess` |
| **Array plural** | `tags`, `mentions`, `participants` |
| **Optional fields marked in schema** | `v.optional(v.string())` |

### 5.2 Foreign Key Columns

```
{referenced_table_singular}Id
```

Examples:
- `organizationId` → references `organizations` table
- `branchId` → references `branches` table
- `departmentId` → references `departments` table
- `createdBy` → references `users` table
- `updatedBy` → references `users` table
- `assignedTo` → references `users` table
- `parentId` → self-referencing (hierarchical)

### 5.3 Boolean Columns

| Pattern | Examples |
|---------|----------|
| `is{Adjective}` | `isActive`, `isArchived`, `isDeleted`, `isDefault`, `isSystem` |
| `has{Noun}` | `hasPortalAccess`, `hasAppAccess`, `hasDiscount` |
| `{verb}Enabled` | `notificationsEnabled`, `emailEnabled` |

### 5.4 Timestamp Columns

| Column | Type | Purpose |
|--------|------|---------|
| `createdAt` | `number` (timestamp) | Record creation time |
| `updatedAt` | `number` (timestamp) | Last update time |
| `deletedAt` | `number?` (timestamp) | Soft delete time |
| `archivedAt` | `number?` (timestamp) | Archive time |
| `completedAt` | `number?` (timestamp) | Completion time |
| `lastUsedAt` | `number?` (timestamp) | Last access time |
| `scheduledAt` | `number?` (timestamp) | Future scheduled time |
| `processedAt` | `number?` (timestamp) | Processing time |

### 5.5 Status/Enum Columns

Use descriptive names:

```
status: v.union(v.literal("active"), v.literal("inactive"), v.literal("archived"))
```

Not:
```
flag: v.number()
```

### 5.6 JSON Columns

Named descriptively with clear content:

```
metadata: v.optional(v.any())
config: v.optional(v.any())
preferences: v.optional(v.any())
settings: v.optional(v.any())
```

---

## 6. ID Strategy

### 6.1 Primary Keys

EEOS uses Convex's auto-generated IDs for all primary keys.

```ts
// Convex generates _id automatically
_id: Id<"organizations">
```

- IDs are **strings** at runtime
- IDs are **typed** at compile time (`Id<"organizations">`)
- IDs are **unique** across the table
- IDs are **immutable** — never change after creation

### 6.2 Foreign Keys

Foreign keys follow the pattern `{tableName}Id`:

```ts
organizationId: v.id("organizations")
branchId: v.id("branches")
departmentId: v.id("departments")
createdBy: v.id("users")
```

### 6.3 Business Identifiers

Business identifiers (human-readable numbers) are generated by the Sequence Engine:

```
LD-2026-000001  → Lead
INV-2026-000001 → Invoice
STU-2026-000001 → Student
EMP-2026-000001 → Employee
TSK-2026-000001 → Task
```

Business identifiers are stored as regular `string` columns, never as primary keys.

### 6.4 Composite Keys

Convex does not support composite primary keys. Use compound unique indexes instead:

```ts
.index("by_entity", ["entityType", "entityId"])
```

### 6.5 UUID Strategy

EEOS uses Convex's built-in ID generation. No UUID library is needed.

### 6.6 Reference Naming

| Pattern | Example |
|---------|---------|
| Foreign key to single entity | `organizationId` |
| Self-referencing | `parentId` |
| Array of IDs | `participants: v.array(v.id("users"))` |

---

## 7. Audit Field Standards

### 7.1 Standard Audit Fields

Every data table MUST include these fields:

```ts
defineTable({
  // ... business fields ...

  // Audit fields
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedBy: v.optional(v.id("users")),
  updatedAt: v.optional(v.number()),
})
```

### 7.2 Soft Delete Fields

Tables that support soft delete should add:

```ts
isArchived: v.boolean(),
archivedAt: v.optional(v.number()),
archivedBy: v.optional(v.id("users")),
```

### 7.3 Version Tracking

For tables requiring optimistic concurrency control:

```ts
version: v.number(),
```

### 7.4 Audit Engine Integration

For compliance-critical operations, the Audit Engine records:

```ts
// Stored in audit_logs table (not in the entity table)
{
  entityType: "lead",
  entityId: "jd8sj3kd8",
  action: "update",
  userId: "user_123",
  oldValues: { status: "new" },
  newValues: { status: "contacted" },
  changedFields: ["status"],
  createdAt: 1713000000000,
  checksum: "abc123def456"
}
```

### 7.5 Optimistic Locking Strategy

For concurrent update prevention:

1. Read the current `version` and `updatedAt` values
2. Include them in the update mutation
3. Convex atomically checks: `IF version == expectedVersion THEN update ELSE throw`
4. On conflict, reload and retry or notify the user

---

## 8. Indexing Standards

### 8.1 Primary Indexes

Every table gets a primary index on `_id` (Convex default).

### 8.2 Lookup Indexes

Every foreign key gets a lookup index:

```ts
.index("by_organization", ["organizationId"])
.index("by_branch", ["branchId"])
.index("by_code", ["code"])
```

Naming: `by_{field}`

### 8.3 Composite Indexes

For common query patterns, create compound indexes:

```ts
// Lookup by entity type + entity ID (polymorphic pattern)
.index("by_entity", ["entityType", "entityId"])

// Lookup by user + status (notification pattern)
.index("by_recipient", ["recipientId", "status"])

// Lookup by date range
.index("by_date", ["createdAt"])
```

### 8.4 Search Indexes

Convex does not support full-text indexes natively. For search functionality:

- Use the Search Engine abstraction layer
- Index data in a dedicated `search_index` table
- Future: Meilisearch/Elasticsearch integration

### 8.5 Sequence Indexes

For sequence numbers:

```ts
.index("by_code", ["code"]) // unique lookup
```

### 8.6 Index Naming Convention

```
by_{field}              → Single field:       .index("by_code", ["code"])
by_{field1}_{field2}    → Compound:           .index("by_entity_type", ["entityType", "entityId"])
by_{field1}_{field2}_fn → Filtered (future):  .index("by_recipient_status", ["recipientId", "status"])
```

### 8.7 Performance Rules

| Rule | Reason |
|------|--------|
| Every query must use an index | Avoid full table scans |
| Index selectivity should be high | Narrow results faster |
| Avoid over-indexing | Each index adds write overhead |
| Test indexes with realistic data volumes | Production patterns differ from dev |
| Monitor slow queries in production | Convex dashboard |

---

## 9. Relationship Standards

### 9.1 One-to-One

```ts
// leadMaster (parent)
leadMaster: defineTable({ ... })

// leadProfile (child, one-to-one)
leadProfile: defineTable({
  leadId: v.id("leadMaster"),  // foreign key
  ...
}).index("by_lead", ["leadId"])
```

### 9.2 One-to-Many

```ts
// organizations (parent)
organizations: defineTable({ ... })

// branches (child, one-to-many)
branches: defineTable({
  organizationId: v.id("organizations"),  // foreign key
  ...
}).index("by_organization", ["organizationId"])
```

### 9.3 Many-to-Many

```ts
// programs (first entity)
programs: defineTable({ ... })

// subjects (second entity)
subjects: defineTable({ ... })

// program_subjects (join table)
program_subjects: defineTable({
  programId: v.id("programs"),
  subjectId: v.id("subjects"),
  ...
}).index("by_program", ["programId"])
  .index("by_subject", ["subjectId"])
  .index("by_program_subject", ["programId", "subjectId"])
```

### 9.4 Reference Tables (Lookup Tables)

Reference tables store static or semi-static data driven by Master Data:

```ts
lead_stages: defineTable({
  code: v.string(),
  name: v.string(),
  color: v.optional(v.string()),
  order: v.number(),
  isDefault: v.boolean(),
  isActive: v.boolean(),
}).index("by_code", ["code"])
  .index("by_order", ["order"])
```

### 9.5 History Tables

Store immutable state transitions:

```ts
lead_stage_history: defineTable({
  leadId: v.id("leadMaster"),
  fromStage: v.string(),
  toStage: v.string(),
  changedBy: v.id("users"),
  changedAt: v.number(),
  reason: v.optional(v.string()),
}).index("by_lead", ["leadId", "changedAt"])
```

### 9.6 Soft References

For entities that reference external systems or future entities:

```ts
entityType: v.string(),  // polymorphic
entityId: v.id(),        // generic ID reference (untyped)
```

---

## 10. Convex Standards

### 10.1 Folder Structure

```
src/convex/
├── schema.ts              # Single source of truth for all tables
├── auth.config.ts         # Auth provider configuration
├── auth.ts                # Auth action handlers
├── http.ts                # HTTP action handlers (webhooks)
├── users.ts               # User queries/mutations
├── {module}/              # Module-specific files
│   ├── {entity}.ts        # Queries and mutations for that entity
│   └── ...
└── engines/               # Platform engine implementations
    └── {engine}.ts
```

### 10.2 Query Naming

```
export const list = query({ ... })          // List all (with optional filters)
export const listBy{Parent} = query({ ... }) // List scoped to parent
export const getById = query({ ... })       // Get single record
export const search = query({ ... })        // Search with text filter
export const count = query({ ... })         // Count records
```

Examples:
```
organizations.list
branches.listByOrganization
branches.getById
leads.search
notifications.count
```

### 10.3 Mutation Naming

```
export const create = mutation({ ... })          // Create a record
export const update = mutation({ ... })          // Update a record
export const remove = mutation({ ... })          // Permanently delete
export const archive = mutation({ ... })         // Soft delete
export const {action} = mutation({ ... })        // Business action
```

Examples:
```
organizations.create
leads.update
tasks.remove
leads.archive
leads.convertToStudent
approvals.approve
```

### 10.4 Action Naming

```
export const sendEmail = action({ ... })
export const generateReport = action({ ... })
export const syncExternalData = action({ ... })
```

### 10.5 Validation

Every mutation must validate inputs:

```ts
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Business validation
    if (args.code.length < 2) {
      throw new Error("Code must be at least 2 characters");
    }

    // Uniqueness check
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) {
      throw new Error(`Organization code "${args.code}" already exists`);
    }

    // Authorization check
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create
    return await ctx.db.insert("organizations", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});
```

### 10.6 Error Handling

```ts
// Always throw meaningful errors
if (!userId) throw new Error("Not authenticated");
if (!record) throw new Error("Organization not found");
if (duplicate) throw new Error(`Code "${code}" already exists`);

// Never expose internal errors to the client
try {
  // risky operation
} catch (error) {
  console.error("Failed to send notification:", error);
  throw new Error("Notification delivery failed. Please try again.");
}
```

### 10.7 Transactions

Convex mutations are automatically atomic. Use this guarantee:

```ts
// This is atomic — if any part fails, the entire operation rolls back
export const createOrganizationWithBranch = mutation({
  args: {
    org: v.object({ name: v.string(), code: v.string() }),
    branch: v.object({ name: v.string(), code: v.string() }),
  },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", { ...args.org, isActive: true });
    const branchId = await ctx.db.insert("branches", {
      ...args.branch,
      organizationId: orgId,
      isActive: true,
    });
    return { orgId, branchId };
  },
});
```

### 10.8 Code Organization

Each file should follow this order:

```ts
// 1. Imports
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

// 2. Constants / Validators (if needed)

// 3. Queries
export const list = query({ ... });
export const getById = query({ ... });

// 4. Mutations
export const create = mutation({ ... });
export const update = mutation({ ... });
export const remove = mutation({ ... });

// 5. Actions (if needed)
export const processAsync = action({ ... });

// 6. Helper functions (private, not exported)
async function checkPermissions(ctx, userId) { ... }
```

---

## 11. API Standards

### 11.1 Naming Convention

```
{module}.{action}
{engine}.{action}
```

Examples:
```
organizations.list
organizations.create
branches.listByOrganization
sequences.generateNumber
activities.logActivity
notifications.send
```

### 11.2 Request Pattern

All mutations accept a typed args object:

```ts
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => { ... },
});
```

### 11.3 Response Pattern

Queries return data directly:

```ts
// Returns: Organization[]
return organizations.sort((a, b) => a.name.localeCompare(b.name));
```

Mutations return the created/updated ID:

```ts
return await ctx.db.insert("organizations", { ... });
// or
return id;
```

### 11.4 Error Format

```ts
// Always throw Error objects with user-friendly messages
throw new Error("Organization code \"ACME\" already exists");
throw new Error("Not authenticated");
throw new Error("Organization not found");
```

### 11.5 Pagination

For future implementation — all list queries should support:

```ts
args: {
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
}
```

### 11.6 Filtering

Standard filter pattern:

```ts
args: {
  search: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  createdAt: v.optional(v.object({
    from: v.number(),
    to: v.number(),
  })),
}
```

### 11.7 Sorting

Standard sort pattern:

```ts
args: {
  sortBy: v.optional(v.string()),
  sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
}
```

---

## 12. UI Standards

### 12.1 Page Layout

Every page MUST follow the standard page structure:

```
Layout (DashboardLayout or StudioLayout)
├── Header (via layout)
│   ├── Breadcrumb
│   ├── Command Palette Trigger
│   ├── Notification Bell
│   └── User Menu
│
├── Page Title + Description
├── Separator
│
├── Statistics Cards (optional, 2-4 cards)
│
├── Toolbar (via GlobalToolbar)
│   ├── Search
│   ├── Refresh
│   ├── Export
│   ├── Import
│   ├── Actions (Add, etc.)
│   └── Filters (via FilterBar)
│
├── Data Table (via DataTable)
│   ├── Columns
│   ├── Sort Indicators
│   ├── Row Actions (Edit, Delete, Drill-down)
│   ├── Empty State (via EmptyState)
│   └── Loading State (via LoadingState)
│
├── Bulk Actions (future)
│
├── Pagination (future)
│
├── Dialogs (via CrudDialog for create/edit)
│
└── Activity Timeline (via Activity Engine)
```

### 12.2 CRUD Page Pattern

Every CRUD page must follow this exact order:

1. **Header**: StudioLayout provides title, description, breadcrumbs
2. **Stats**: 2-4 StatisticsCards for key metrics
3. **Toolbar**: GlobalToolbar with search + actions
4. **Filters**: FilterBar for active filter chips
5. **Data Table**: DataTable for the main data
6. **Bulk Actions**: Select all, batch operations (future)
7. **Pagination**: Page controls (future)
8. **Dialogs**: CrudDialog for create/edit
9. **Activity**: Activity timeline for the selected entity

### 12.3 Studio Page Pattern

Every studio page must use `StudioLayout`:

```tsx
export default function MyStudio() {
  return (
    <StudioLayout
      title="Studio Name"
      description="Studio description"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Studio Name" },
      ]}
    >
      {/* Content */}
    </StudioLayout>
  );
}
```

### 12.4 Dashboard Widget Pattern

Widgets use `DashboardWidget` with config-driven sizing:

```tsx
<DashboardWidget title="Widget Title" icon={Activity} size="third">
  {/* Widget content */}
</DashboardWidget>
```

### 12.5 Form Pattern

Forms use `CrudDialog` for create/edit:

```tsx
<CrudDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  title="Create Entity"
  fields={entityFields}
  defaultValues={editingItem}
  onSubmit={handleSubmit}
  isPending={isPending}
  submitLabel="Create"
/>
```

### 12.6 Loading Pattern

```tsx
// Component-level loading
if (isLoading) return <LoadingState type="page" />;

// Inline loading (DataTable handles this)
<DataTable isLoading={data === undefined} ... />
```

### 12.7 Empty State Pattern

```tsx
<EmptyState
  title="No items found"
  description="Create your first item to get started."
  icon={<Icon className="h-5 w-5" />}
  action={<Button onClick={handleCreate}>Create</Button>}
/>
```

---

## 13. Engine Standards

### 13.1 Engine Definition

Every platform engine must document:

| Section | Description |
|---------|-------------|
| **Purpose** | What the engine does in one sentence |
| **Responsibilities** | What the engine is responsible for |
| **Public API** | Every query, mutation, and action the engine exposes |
| **Entities** | Database tables the engine owns |
| **Events** | Events the engine emits |
| **Consumers** | Which modules/engines consume this engine |
| **Dependencies** | Which engines this engine depends on |
| **Future Expansion** | Planned capabilities |

### 13.2 Engine File Structure

Every engine file follows this pattern:

```ts
// src/convex/engines/sequenceEngine.ts

// ─── Imports ───

// ─── Constants ───

// ─── Queries ───
export const generateNumber = mutation({ ... });
export const previewNextNumber = query({ ... });

// ─── Mutations ───

// ─── Actions ───

// ─── Internal Helpers ───
```

### 13.3 Engine Rules

1. **Engines own their data** — No module writes to engine tables directly
2. **Engines don't import modules** — No engine references a module
3. **Engines communicate via events** — No engine calls another engine's code directly
4. **Engines are permission-aware** — Every engine API checks scopes
5. **Engines are configurable** — Behavior driven by Master Data where possible

---

## 14. Permission Standards

### 14.1 Permission Naming

```
{module}:{entity}:{action}
```

Examples:
```
org:organization:create
org:organization:update
org:organization:delete
org:organization:view

crm:lead:create
crm:lead:update
crm:lead:delete
crm:lead:view
crm:lead:assign
crm:lead:convert
```

### 14.2 Permission Scopes

| Scope | Description |
|-------|-------------|
| `own` | Only the user's own records |
| `team` | The user's team records |
| `department` | The user's department records |
| `branch` | The user's branch records |
| `company` | All records in the company |
| `organization` | All records in the organization |
| `system` | System-wide access (super admin) |

### 14.3 Permission Inheritance

```
System (super_admin) → Organization (admin) → Company → Branch → Department → Team → Own
```

Higher scopes inherit permissions from lower scopes.

### 14.4 Role-Based Permissions

| EEOS Role | Scope |
|-----------|-------|
| `super_admin` | System-wide access |
| `admin` | Company/Branch scope |
| `manager` | Department scope |
| `staff` | Own/Team scope |

### 14.5 Frontend Permission Wrapper

```tsx
<PermissionWrapper
  allowedRoles={["admin", "manager"]}
  currentRole={user.role}
  fallback={<p className="text-xs text-muted-foreground">Access denied</p>}
>
  <Button onClick={handleDelete}>Delete</Button>
</PermissionWrapper>
```

### 14.6 Backend Enforcement

```ts
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");

const user = await ctx.db.get(userId);
if (user.role !== "admin") {
  throw new Error("Insufficient permissions");
}
```

---

## 15. Event Naming Standards

### 15.1 Event Naming Convention

```
{Entity}.{Action}
```

| Entity | PascalCase singular |
| Action | past tense verb |

Examples:
```
Lead.Created
Lead.Updated
Lead.Converted
Lead.Lost
Admission.Approved
Admission.Rejected
Student.Enrolled
Student.Promoted
Student.Graduated
Task.Assigned
Task.Completed
Task.Overdue
Invoice.Generated
Invoice.Paid
Invoice.Overdue
Payment.Received
Payment.Refunded
Employee.Joined
Employee.Resigned
Notification.Sent
Notification.Delivered
Workflow.Completed
Workflow.Failed
Approval.Approved
Approval.Rejected
Sequence.NumberGenerated
Activity.Logged
Comment.Added
Comment.Mentioned
```

### 15.2 Event Payload Standard

```json
{
  "event": "Lead.Created",
  "timestamp": "2026-07-14T12:00:00Z",
  "source": "crm",
  "entityType": "lead",
  "entityId": "jd8sj3kd8",
  "actor": {
    "userId": "user_123",
    "role": "admin"
  },
  "payload": {
    "leadName": "John Doe",
    "source": "facebook_ad"
  },
  "metadata": {
    "requestId": "req_abc",
    "sessionId": "sess_xyz"
  }
}
```

### 15.3 Event File Location

Events are documented in the platform event catalogue (`DOC-22` section 7).

---

## 16. Validation Standards

### 16.1 Validation Layers

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **1. Client-side** | Form field validation, UX feedback | react-hook-form |
| **2. Schema-level** | Type validation, required fields | Convex `v.*()` validators |
| **3. Business logic** | Domain rules, uniqueness, state machine | Convex mutation handlers |
| **4. Permission** | User authorization | Backend permission check |
| **5. Workflow** | Process state validation | Workflow Engine |

### 16.2 Client Validation

```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: { name: "", code: "" },
});

<Input
  {...register("name", {
    required: "Name is required",
    minLength: { value: 2, message: "Minimum 2 characters" },
  })}
/>
{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
```

### 16.3 Schema Validation

```ts
args: {
  name: v.string(),
  code: v.string(),
  email: v.optional(v.string()),
  isActive: v.boolean(),
}
```

### 16.4 Business Validation

```ts
// Uniqueness
const existing = await ctx.db
  .query("organizations")
  .withIndex("by_code", (q) => q.eq("code", args.code))
  .first();
if (existing) throw new Error(`Code "${args.code}" already exists`);

// State machine
if (lead.status !== "admitted") {
  throw new Error("Cannot create student profile for non-admitted lead");
}

// Authorization
if (user.role !== "admin") {
  throw new Error("Only admins can delete organizations");
}
```

### 16.5 Duplicate Detection

| Scenario | Check |
|----------|-------|
| Unique code | Query by code index |
| Unique email | Query by email index |
| Unique phone | Query by phone index |
| Duplicate lead | Phone number match + name similarity |
| Duplicate invoice | Invoice number uniqueness (Sequence Engine) |

---

## 17. Error Handling Standards

### 17.1 Error Codes

| Code | HTTP Equivalent | When | Message Pattern |
|------|----------------|------|-----------------|
| `NOT_AUTHENTICATED` | 401 | User not logged in | "Not authenticated" |
| `NOT_AUTHORIZED` | 403 | Insufficient permissions | "Insufficient permissions" |
| `NOT_FOUND` | 404 | Entity doesn't exist | `"{Entity} not found"` |
| `ALREADY_EXISTS` | 409 | Duplicate entity | `"{Field} \"{value}\" already exists"` |
| `VALIDATION_ERROR` | 422 | Invalid input | `"Invalid {field}: {reason}"` |
| `INVALID_STATE` | 409 | Wrong entity state | `"Cannot {action} {entity} in {state} state"` |
| `DEPENDENCY_ERROR` | 409 | Cannot delete with children | `"Cannot delete {entity} with existing {children}"` |
| `RATE_LIMITED` | 429 | Too many requests | "Too many requests. Please try again later." |
| `INTERNAL_ERROR` | 500 | Unexpected error | "An unexpected error occurred. Please try again." |

### 17.2 Error Throwing

```ts
// Always throw Error with descriptive message
throw new Error(`Lead "${name}" already exists`);

// Include context where helpful
throw new Error(`Cannot delete organization "${name}" with ${branchCount} active branches`);
```

### 17.3 Error Catching

```ts
try {
  await someMutation();
} catch (error) {
  // Display user-friendly message
  toast.error(error instanceof Error ? error.message : "Operation failed");
  console.error("Operation failed:", error);
}
```

### 17.4 Retry Strategy

| Operation | Retry Strategy |
|-----------|----------------|
| Convex mutation (automatic) | Built-in retry by Convex |
| External API call | 3 retries with exponential backoff |
| Webhook delivery | 5 retries over 24 hours |
| Email/SMS delivery | 3 retries over 1 hour |
| File upload | Client-side retry |

---

## 18. Logging Standards

### 18.1 Log Types

| Type | Purpose | Storage | Retention |
|------|---------|---------|-----------|
| **Application logs** | Debugging, monitoring | `console.log` / Convex logs | 30 days |
| **Audit logs** | Compliance, security | `audit_logs` table | 7 years |
| **Security logs** | Auth attempts, permission failures | `audit_logs` (action = auth_*) | 7 years |
| **Workflow logs** | Workflow execution history | `workflow_execution_logs` table | 90 days |
| **Notification logs** | Delivery tracking | `notifications` table | 90 days |
| **Integration logs** | External API calls | `integration_logs` table | 30 days |

### 18.2 Application Logging

```ts
// Development debugging
console.log("[ModuleName] Creating entity:", { name, code });

// Warnings
console.warn("[EngineName] Rate limit approaching:", { current, limit });

// Errors
console.error("[ModuleName] Operation failed:", error);
```

### 18.3 Audit Logging

The Audit Engine handles all compliance logging:

```ts
await auditEngine.recordAudit({
  entityType: "lead",
  entityId: leadId,
  action: "update",
  userId: currentUser,
  oldValues: previousLead,
  newValues: updatedLead,
});
```

---

## 19. Performance Standards

### 19.1 Caching Rules

| Data Type | Strategy | Duration |
|-----------|----------|----------|
| Reference data (stages, sources) | In-memory, cache forever | Until deployment |
| User preferences | Cache, bust on change | Session |
| Activity feeds | Time-based | 30 seconds |
| Dashboard widgets | Time-based | 60 seconds |
| Notification templates | Cache forever | Until updated |
| Sequence counters | In-memory with DB fallback | Atomic |
| Search index | Dedicated index | Real-time sync |

### 19.2 Query Performance

| Rule | Reason |
|------|--------|
| Always use `.withIndex()` | Avoids full table scans |
| Never use `.collect()` without a filter | Returns all rows |
| Use `.first()` when expecting one result | More efficient than `.collect()` |
| Use `.take(n)` for pagination | Limits result set |
| Filter before collecting | Reduces data transfer |
| Avoid N+1 queries | Use batch loading patterns |

### 19.3 Lazy Loading

```tsx
// Lazy load studio pages
const OrganizationStudio = lazy(() => import("./pages/studio/OrganizationStudio.tsx"));

// Suspense boundary
<Suspense fallback={<RouteLoading />}>
  <OrganizationStudio />
</Suspense>
```

### 19.4 Batch Operations

For bulk operations, use background actions:

```ts
export const bulkImport = action({
  args: {
    entities: v.array(v.object({ ... })),
  },
  handler: async (ctx, args) => {
    // Process in batches of 50
    for (let i = 0; i < args.entities.length; i += 50) {
      const batch = args.entities.slice(i, i + 50);
      await Promise.all(batch.map((entity) => ctx.runMutation("module:create", entity)));
    }
  },
});
```

---

## 20. Security Standards

### 20.1 Authentication

| Rule | Implementation |
|------|----------------|
| All routes behind auth | `ProtectedRoute` wrapper |
| Public routes only for `/` and `/auth` | `PublicOnlyRoute` wrapper |
| Email OTP verification | Convex Auth with email-otp |
| Anonymous guest access | Convex Auth anonymous provider |
| Session management | Convex Auth handles sessions |

### 20.2 Authorization

| Rule | Implementation |
|------|----------------|
| Every mutation checks auth | `getAuthUserId(ctx)` check |
| Every write checks permissions | Role-based check |
| Data scoped by organization | `organizationId` filter |
| Frontend is never trusted | Backend enforces all rules |
| Permission Wrapper for UI | `<PermissionWrapper>` component |

### 20.3 Encryption

| Rule | Implementation |
|------|----------------|
| Data at rest | Convex-managed encryption |
| Data in transit | TLS (HTTPS) |
| Secrets (API keys) | Environment variables / Integration Engine |
| Passwords | Not stored (OTP-based auth) |

### 20.4 Multi-Tenant Isolation

Every entity must belong to an organization:

```ts
// Schema
organizationId: v.id("organizations")

// Query
const data = await ctx.db
  .query("my_table")
  .withIndex("by_organization", (q) => q.eq("organizationId", userOrgId))
  .collect();
```

### 20.5 Compliance

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| DPDP Act | PII access tracking | Audit Engine |
| FERPA | Student data privacy | Permission scopes |
| GDPR | Data export/deletion | Import/Export Engine |

---

## 21. Testing Standards

### 21.1 Test Types

| Type | Scope | Frequency |
|------|-------|-----------|
| **Unit tests** | Individual functions/queries | Every PR |
| **Integration tests** | Module interactions | Every release |
| **Regression tests** | Previously working features | Every release |
| **Performance tests** | Query speed, load handling | Weekly |
| **Security tests** | Auth, permissions, isolation | Every release |
| **UAT** | User acceptance | Before beta |
| **Beta testing** | Real-world usage | Before production |

### 21.2 What to Test

- All mutations (create, update, delete, archive)
- All queries (list, getById, search)
- Permission checks (authorized and unauthorized)
- Validation (valid and invalid inputs)
- Edge cases (empty states, duplicates, missing data)
- Error states (network failures, auth failures)

### 21.3 Test Naming

```
{function}_{scenario}_{expected}
```

Examples:
```
createOrganization_validInput_returnsId
createOrganization_duplicateCode_throwsError
listOrganizations_adminUser_returnsAll
listOrganizations_staffUser_returnsOwn
updateOrganization_notFound_throwsError
deleteOrganization_withBranches_throwsError
```

---

## 22. Documentation Standards

### 22.1 Required Documentation per Module

Every module must include:

| Document | Content | Location |
|----------|---------|----------|
| **Architecture** | Module purpose, entities, relationships | EEOS Bible `{section}` |
| **Entities** | Every table with fields, types, indexes | `src/convex/{module}/schema.md` (or inline) |
| **API** | Every query, mutation, action | `src/convex/{module}/README.md` |
| **Permissions** | Permission requirements per operation | `docs/permissions.md` |
| **Workflow** | State machine, status transitions | `docs/workflow.md` |
| **Testing** | Test scenarios | `docs/testing.md` |
| **Migration** | Data migration scripts | `docs/migration.md` |

### 22.2 Code Comments

```ts
// Every exported function needs a brief comment
/** List all organizations, optionally filtered by search and active status */
export const list = query({ ... });

/** Create a new organization with unique code validation */
export const create = mutation({ ... });

// Complex logic needs inline comments
// Step 1: Validate uniqueness
// Step 2: Check permissions
// Step 3: Create record
// Step 4: Log activity
```

### 22.3 Inline Documentation in Schema

```ts
organizations: defineTable({
  name: v.string(),        // Organization legal name
  code: v.string(),        // Unique organization code (e.g., "ACME")
  isActive: v.boolean(),   // Whether the organization is active
  taxId: v.optional(v.string()),  // Tax/VAT registration number
  email: v.optional(v.string()),  // Primary contact email
  phone: v.optional(v.string()),  // Primary contact phone
  address: v.optional(v.string()), // Registered address
  logo: v.optional(v.string()),    // Logo URL
  metadata: v.optional(v.any()),   // Extensible configuration
})
```

### 22.4 Patch Register Entry

Every development patch must update `PATCH_REGISTER.md`:

```md
| Patch | Sprint | Module | Status |
|-------|--------|--------|--------|
| MDS-12 | Sprint 2 | Master Data - Lead Sources | ✅ |
```

---

## 23. Golden Rules

### The 25 Immutable EEOS Development Rules

**Rule 1 — No Duplicate Engines**
Every shared capability has exactly one engine. No module creates its own notification system, activity log, comment system, file storage, or approval workflow.

**Rule 2 — No Duplicate Notification Systems**
The Notification Engine is the only way to send notifications. No module implements its own email, SMS, or in-app notification system.

**Rule 3 — No Duplicate Comments**
The Comment Engine is the only discussion system. No module implements its own notes, feedback, or comments.

**Rule 4 — No Duplicate Activity Logs**
The Activity Engine is the only activity timeline. No module creates its own activity or history log.

**Rule 5 — No Duplicate Approvals**
The Approval Engine is the only approval system. No module implements its own approval workflow.

**Rule 6 — No Module-Specific Search**
The Search Engine is the only search. No module implements its own search bar.

**Rule 7 — No Duplicate Tags**
The Tag Engine is the only tagging system. No module creates its own tags or labels.

**Rule 8 — No Duplicate Templates**
The Template Engine is the only template system. No module hardcodes message content.

**Rule 9 — Reuse Shared Components**
Every page uses `DashboardLayout` or `StudioLayout`. Every table uses `DataTable`. Every form uses `CrudDialog`. Every empty state uses `EmptyState`. Every loading state uses `LoadingState`.

**Rule 10 — Never Hardcode Routes**
All routes come from `src/lib/routes.ts`. The sidebar, command palette, and navigation all consume the route registry.

**Rule 11 — Never Hardcode Studios**
All studios come from `src/config/studios.ts`. Feature flags, permissions, and sidebar navigation consume the studio registry.

**Rule 12 — Everything Permission-Aware**
Every engine API checks permissions. Every UI element respects role-based visibility. No data is accessible without authorization.

**Rule 13 — Everything Audit-Ready**
Every data change passes through the Audit Engine. No module can bypass auditing. Every create, update, and delete is recorded.

**Rule 14 — Everything Multi-Tenant Ready**
Every entity belongs to an organization. Every query is scoped by organization. No engine assumes single-tenant deployment.

**Rule 15 — Everything API-First**
Every engine exposes a clean API. No module accesses another module's database directly. All communication is through typed Convex functions.

**Rule 16 — Everything Engine-Driven**
Business logic lives in engines. Modules orchestrate. No module implements shared logic. Engines never import modules.

**Rule 17 — Everything Configurable**
All business rules should be configurable through Master Data before customization is considered. No hardcoded business rules.

**Rule 18 — Backend Enforces Everything**
The frontend is never trusted for security. Every permission check, every validation, every audit is enforced on the backend.

**Rule 19 — Events Before Actions**
Engines emit events for everything. Modules and other engines subscribe to events. No direct code-level coupling between modules.

**Rule 20 — Consistent Naming**
Every file, table, column, function, API, event, and permission follows the naming rules in this document. No exceptions.

**Rule 21 — One Schema File**
The entire database schema lives in `src/convex/schema.ts`. No module creates its own schema. Schema changes require architecture review.

**Rule 22 — Documentation Before Implementation**
Every module must be documented in the EEOS Bible before implementation begins. Architecture before coding.

**Rule 23 — One Source of Truth**
Every entity has one owner. Every relationship has one source. No duplicate tables. No duplicate fields. No duplicate business logic.

**Rule 24 — Upward Compatibility**
Never break existing modules. New features must be backward compatible. Schema migrations must not break existing queries.

**Rule 25 — Review Every Decision**
Every architecture decision is recorded in `11-Decisions/DECISION_LOG.md`. Decisions are LOCKED after review. Changes require re-review.

---

## Architecture Notes

### Key Design Decisions

1. **camelCase for schema fields**: Convex uses JavaScript, so camelCase is the natural choice. This is consistent with the entire codebase.

2. **snake_case for documentation tables**: When describing tables in documentation, snake_case is used for readability and SQL convention alignment.

3. **Single schema file**: All tables are defined in `src/convex/schema.ts`. This ensures the complete data model is visible in one place and prevents schema fragmentation.

4. **No ORM**: Convex's `defineTable` is the schema definition language. No additional ORM layer is needed.

5. **No migrations**: Convex handles schema changes through its deployment system. Schema changes are pushed as code.

### Recommendations

1. **Adopt these standards immediately**: The current codebase should be audited against these standards and any violations fixed in the next cleanup sprint.

2. **Automate enforcement**: Add ESLint rules and Convex schema validation where possible to automate standards enforcement.

3. **Include in PR review checklist**: Every PR must verify compliance with DOC-23 before merging.

---

## Future Improvements

1. **Automated schema documentation generator** — Generate markdown docs from `schema.ts` automatically
2. **ESLint plugin for naming conventions** — Auto-detect violations of naming rules
3. **Schema migration scripts** — For data migration between versions
4. **Convex type generator** — Generate typed API clients automatically
5. **Standards violation dashboard** — Monitor compliance across the codebase
