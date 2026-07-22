# EEOS Master Data Framework

## Overview

The Master Data Framework provides a reusable, configuration-driven architecture for building CRM master data modules (Lead Sources, Lead Priorities, Lead Tags, etc.).

Each master consists of three layers:

```
Layer 1: Backend (Convex)  →  src/convex/crm<Module>.ts
Layer 2: Component (Shared) →  src/components/studios/MasterDataTable.tsx
Layer 3: Page (Config)     →  src/pages/studios/MasterData<Module>.tsx
```

---

## Which Files Are Required

To create a new Master Data module (e.g. `Lost Reasons`), you need exactly **5 files**:

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/convex/crm<Module>.ts` | **Create** | Backend CRUD + seed data |
| 2 | `src/convex/schema.ts` | **Edit** | Add `crm<Module>` table definition |
| 3 | `src/pages/studios/MasterData<Module>.tsx` | **Create** | Page using MasterDataTable |
| 4 | `src/main.tsx` | **Edit** | Lazy import + route registration |
| 5 | `src/pages/studios/MasterDataCRM.tsx` | **Edit** | Update CRM Masters card to active |

---

## Which Files Should Never Be Edited

| File | Reason |
|------|--------|
| `src/components/studios/MasterDataTable.tsx` | Shared component - modify only for framework-wide changes |
| `src/convex/crmSources.ts` | Existing master - modify only for bug fixes |
| `src/convex/crmPriorities.ts` | Existing master - modify only for bug fixes |
| `src/convex/crmTags.ts` | Existing master - modify only for bug fixes |
| `src/convex/crmStages.ts` | Existing master (Lead Stages) - different architecture |
| `src/pages/LeadStageStudio.tsx` | Legacy standalone page - not part of shared framework |

---

## How MasterDataTable Works

`MasterDataTable` (`src/components/studios/MasterDataTable.tsx`) is a generic component that renders:

```
┌─ Header ─────────────────────────────────────────────────┐
│  [icon]  Title            [Search] [Seed] [Add] [↻] [Imp] [Exp] │
│  Subtitle                                                  │
├─ Statistics ──────────────────────────────────────────────┤
│  [Card] [Card] [Card] [Card] [Card] [Card]                │
├─ Toolbar ─────────────────────────────────────────────────┤
│  [Search______] [Status▼] [Sort by▼] [Reset]              │
├─ Table ───────────────────────────────────────────────────┤
│  ⠿  Seq  Name  Color  Icon  [Extra]  Status  Modified  Actions │
│  ⠿  1    ...   ...    ...   ...     Active  Today     ✎ 👁 ⎘ 🗑 │
│  ⠿  2    ...   ...    ...   ...     Active  Yesterday  ✎ 👁 ⎘ 🗑 │
├─ [Add / Edit Dialog] ─────────────────────────────────────┤
│  Name *  |  [Extra Fields]  |  Active?  |  Cancel / Save  │
├─ [Delete Confirmation] ───────────────────────────────────┤
│  Are you sure you want to delete "X"?  |  Cancel / Delete │
└───────────────────────────────────────────────────────────┘
```

### Key features built-in:
- **Drag-and-drop reordering** via @dnd-kit
- **Search** by name/description
- **Status filter** (All / Active / Inactive)
- **Sort** by Sequence / Name / Created
- **Empty states** (no data, filtered no results)
- **Error state** with retry button
- **Loading timeout** (15s) with user-friendly message
- **Access control** (optional role check)
- **CRUD** (Add, Edit, Duplicate, Toggle Active, Delete)
- **Import/Export** (disabled placeholders)

### What the config provides:

```typescript
interface MasterDataConfig {
  // Page identity
  title: string;
  subtitle: string;
  entityName: string;        // e.g. "Source"
  entityNamePlural: string;  // e.g. "Sources"
  backRoute: string;         // e.g. "/studios/master-data/crm"
  backLabel: string;         // e.g. "Back to CRM Masters"

  // API references (from Convex)
  apiModule: {
    list, get, create, update, delete, duplicate, reorder, seedDefault
  };

  // Stats — 6 cards computed from data
  getStats: (items) => Array<{label, value, valueColor?}>;

  // Extra table columns (between Icon and Status)
  extraColumns?: Array<{header, width?, cell}>;

  // Form fields (rendered below Name in dialog)
  renderFormFields: (props) => ReactNode;

  // Form extra data management
  getDefaultFormExtra, getFormExtraFromItem, validateExtra;

  // Icon system
  getIconComponent, iconOptions, colorPresets;

  // Seed data toggle
  hasSeed: boolean;

  // Access control
  requiredRole?: string;

  // Custom section below table (optional)
  renderCustomSection?: (items, context) => ReactNode;
}
```

---

## How Backend CRUD Works

Every backend module follows this exact pattern (template from `crmSources.ts`):

### Queries
- `list<Module>` — Returns all items sorted by sequence
- `get<Module>` — Returns single item by id

### Mutations
- `create<Module>` — Creates with auto-incremented sequence
- `update<Module>` — Partial update (only provided fields)
- `delete<Module>` — Delete by id
- `duplicate<Module>` — Clone with "(Copy)" suffix, inactive
- `reorder<Module>` — Batch update sequence from ordered ids
- `seedDefault<Module>` — Insert defaults only if table is empty

### Schema fields (every module):
```
name:      v.string()
code:      v.string()
color:     v.string()
icon:      v.string()
sequence:  v.number()
description: v.optional(v.string())
active:    v.boolean()
createdAt: v.number()
updatedAt: v.number()
```

### Index (every module):
```
.index("sequence", ["sequence"])
```

---

## How Seed Data Works

1. Seed data is an array defined at the top of the backend module
2. Each entry has: `{ name, code, color, icon, description, sequence }`
3. `seedDefault<Module>` mutation checks `if (existing.length > 0) return`
4. Only creates defaults when the table is **completely empty**
5. Seed is **idempotent** — safe to call multiple times
6. UI shows "Seed Defaults" button only when no items exist

---

## How Routing Works

- Route pattern: `/studios/master-data/crm/<module-name>`
- Registered in `src/main.tsx` with lazy loading:
  ```tsx
  const MasterData<Module> = lazy(() => import("./pages/studios/MasterData<Module>.tsx"));
  ```
- Route element wraps in `ProtectedRoute`:
  ```tsx
  <Route path="/studios/master-data/crm/<module-name>" element={<ProtectedRoute><MasterData<Module> /></ProtectedRoute>} />
  ```
- "Back" button navigates to config's `backRoute`
- Navigation from CRM Masters uses `window.location.href` for reliability

---

## Page Template

The minimal page file looks like this (example: Lead Sources):

```tsx
import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { /* icons */ Palette, AlignLeft, Code } from "lucide-react";

/* ─── Icon Configuration ─── */
const ICON_OPTIONS = [ /* { value, label, icon } */ ];
const COLOR_PRESETS = [ /* hex colors */ ];
function getIconComponent(name: string) { /* lookup */ }

/* ─── Config ─── */
const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "...",
  subtitle: "...",
  entityName: "...",
  entityNamePlural: "...",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",
  apiModule: { /* map all api.crm<Module>.<method> */ },
  getStats: (items) => [ /* 6 stat cards */ ],
  getIconComponent, iconOptions, colorPresets, hasSeed: true,
  requiredRole: "super_admin",
  extraColumns: [{ header: "Code", width: "w-24", cell: (item) => (/* code badge */) }],
  getDefaultFormExtra: () => ({ code: "", description: "" }),
  getFormExtraFromItem: (item) => ({ code: item.code || "", description: item.description || "" }),
  validateExtra: (extra) => { /* required field checks */ },
  renderFormFields: ({ formExtra, setFormExtra, formColor, setFormColor, ... }) => ( /* code, description, color, icon fields */ ),
};

export default function MasterData<Module>() {
  return <MasterDataTable config={config} />;
}
```

---

## Consistency Rules

### Spacing
- Page outer: `space-y-6`
- Statistics grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3`
- Toolbar: `flex items-center gap-2 flex-wrap`
- Module grid (CRM Masters): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

### Typography
- Page title: `text-xl font-semibold text-[#1a1a2e]`
- Subtitle: `text-[13px] text-[#5f6368]`
- Table header: `text-[10px] font-semibold text-[#5f6368] uppercase`
- Table cells: `text-[12px] text-[#1a1a2e]` (name) / `text-[11px] text-[#5f6368]` (metadata)
- Badge status: `text-[9px] px-1.5 py-0 h-4`
- Stat label: `text-[10px] font-medium text-[#5f6368]`
- Stat value: `text-xl font-semibold`

### Colors
- Primary dark: `#1a1a2e`
- Primary blue: `#1a73e8`
- Text secondary: `#5f6368`
- Text muted: `#9aa0a6`
- Border: `#e8eaed`
- Border hover: `#dadce0`
- Row hover: `#f8f9fa`
- Active: `#34a853` (green)
- Inactive: `#f1f3f4` bg / `#9aa0a6` text
- Delete: `#ea4335` (red)

### Components
- Cards: `border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200`
- Buttons (primary): `bg-[#1a1a2e] hover:bg-[#2d2d4a] text-[11px]`
- Buttons (outline): `border-[#e8eaed] text-[11px]`
- Inputs: `h-8 text-[12px] border-[#e8eaed] rounded-md`
- Table wrapper: `border-[#e8eaed] shadow-sm bg-white`

---

## Current Architecture Status

### ✅ Using MasterDataTable (shared framework)
| Module | Backend | Page | Route |
|--------|---------|------|-------|
| Lead Sources | `crmSources.ts` | `MasterDataLeadSources.tsx` | `/studios/master-data/crm/lead-sources` |
| Lead Priorities | `crmPriorities.ts` | `MasterDataLeadPriorities.tsx` | `/studios/master-data/crm/lead-priorities` |
| Lead Tags | `crmTags.ts` | `MasterDataLeadTags.tsx` | `/studios/master-data/crm/lead-tags` |

### 🔶 Standalone (legacy, NOT using MasterDataTable)
| Module | Backend | Page | Route |
|--------|---------|------|-------|
| Lead Stages | `crmStages.ts` | `LeadStageStudio.tsx` | `/crm/settings/stages` |

The Lead Stages module has its own standalone implementation because it contains stage-specific features (probability field, pipeline overview card) that the shared framework doesn't support. Future framework iterations could absorb this.

---

## Performance Notes

- **Filters + sort** are computed with `useMemo` — safe
- **Drag-and-drop handler** uses `useCallback` — safe
- **Loading timeout** uses `useRef` for timer cleanup — safe
- **No unnecessary re-renders** — state changes are scoped correctly
- **Large object recreation**: Spreading `[...items]` for sort is the standard approach
- **Table rendering**: Uses virtualized rendering via native HTML table — adequate for typical master data sizes (< 500 items)
