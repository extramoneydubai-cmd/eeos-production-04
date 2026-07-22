# EEOS Platform Architecture

> **Last Updated**: 2026-07-14
> **Version**: 1.0.0-beta
> **Stack**: React 19 + TypeScript + Vite + Convex + Tailwind CSS + shadcn/ui + Framer Motion

---

## 1. Folder Structure

```
src/
├── config/            # Application configuration
│   ├── app.ts         # App name, version, environment, feature flags
│   └── studios.ts     # Studio registry — all studio definitions
│
├── lib/               # Utilities, registries, helpers
│   ├── utils.ts       # cn() utility (shadcn)
│   ├── routes.ts      # Route registry — all paths, icons, groups
│   ├── features.ts    # Feature flag system
│   ├── component-registry.ts  # Component registry — docs for reuse
│   └── design-tokens.ts       # Design token documentation
│
├── hooks/             # React hooks
│   ├── use-auth.ts    # Authentication hook
│   └── use-mobile.ts  # Mobile detection
│
├── components/
│   ├── layout/        # App shell components
│   │   ├── DashboardLayout.tsx  # Main authenticated layout
│   │   ├── StudioLayout.tsx     # Studio workspace layout
│   │   ├── Sidebar.tsx          # Collapsible sidebar nav
│   │   └── Header.tsx           # Top bar with actions
│   │
│   ├── data/          # Data display components
│   │   ├── DataTable.tsx   # Sortable table with empty/loading states
│   │   ├── SearchBar.tsx   # Debounced search input
│   │   └── FilterBar.tsx   # Active filter chips
│   │
│   ├── shared/        # Reusable shared components
│   │   ├── CrudDialog.tsx         # Create/edit form dialog
│   │   ├── EmptyState.tsx         # Empty state display
│   │   ├── LoadingState.tsx       # Loading indicators
│   │   ├── PermissionWrapper.tsx  # Role-based gating
│   │   ├── CommandPalette.tsx     # Ctrl+K command palette
│   │   ├── NotificationCenter.tsx # Notification bell + drawer
│   │   ├── GlobalSearch.tsx       # Search dialog
│   │   ├── StatisticsCard.tsx     # Metric display card
│   │   ├── GlobalToolbar.tsx      # Studio toolbar
│   │   └── DashboardWidget.tsx    # Configurable dashboard widget
│   │
│   └── ui/            # shadcn/ui primitives
│       ├── button.tsx, card.tsx, dialog.tsx, input.tsx, ...
│       └── sidebar.tsx, breadcrumb.tsx, command.tsx, ...
│
├── pages/             # Route-level page components
│   ├── Landing.tsx    # Public landing page (/)
│   ├── Auth.tsx       # Authentication page (/auth)
│   ├── Dashboard.tsx  # Control Center (/dashboard)
│   ├── NotFound.tsx   # 404 page
│   └── studio/        # Studio pages
│       ├── OrganizationStudio.tsx
│       ├── MasterDataStudio.tsx
│       ├── AccessControlStudio.tsx
│       ├── WorkflowStudio.tsx
│       ├── TaskStudio.tsx
│       ├── CRMStudio.tsx
│       └── SalesStudio.tsx
│
├── convex/            # Convex backend (schema, queries, mutations)
│   ├── schema.ts      # Database schema
│   ├── auth.ts        # Authentication
│   ├── users.ts       # User queries
│   └── organization/  # Organization module backend
│
├── main.tsx           # App entry point + routing
└── index.css          # Global styles + CSS variables
```

---

## 2. Component Hierarchy

```
<RootErrorBoundary>
  <ConvexAuthProvider>
    <BrowserRouter>
      <Suspense>
        <Routes>
          ├── /        → <PublicOnlyRoute> <Landing />
          ├── /auth    → <PublicOnlyRoute> <AuthPage />
          │
          ├── /dashboard → <ProtectedRoute>
          │     <DashboardLayout>
          │       ├── <AppSidebar />
          │       ├── <Header>
          │       │     ├── <Breadcrumb />
          │       │     ├── <CommandPaletteTrigger />
          │       │     ├── <NotificationCenter />
          │       │     └── <UserMenu />
          │       └── <main> {page content} </main>
          │
          ├── /studio/* → <ProtectedRoute>
          │     <StudioLayout>
          │       ├── <Breadcrumb />
          │       ├── <GlobalToolbar />
          │       ├── <StatisticsCard /> (optional)
          │       ├── <SearchBar /> (via toolbar)
          │       ├── <DataTable /> (or content)
          │       ├── <CrudDialog /> (create/edit)
          │       └── <EmptyState /> / <LoadingState />
          │
          └── * → <NotFound />
```

---

## 3. Component Reuse Rules

### Layout Components (NEVER duplicate)

| Component | Purpose | When to use |
|-----------|---------|-------------|
| `DashboardLayout` | Authenticated app shell | Every protected page |
| `StudioLayout` | Studio workspace | Every studio/module page |
| `AppSidebar` | Navigation | Auto-included via DashboardLayout |
| `Header` | Top bar | Auto-included via DashboardLayout |

### Data Components (NEVER duplicate)

| Component | Purpose | When to use |
|-----------|---------|-------------|
| `DataTable` | Sortable data table | Any list/collection view |
| `SearchBar` | Debounced search | Any searchable list |
| `FilterBar` | Active filter chips | Any filterable list |

### Shared Components (REUSE, never reimplement)

| Component | Purpose |
|-----------|---------|
| `CrudDialog` | Create/edit form dialog |
| `EmptyState` | Empty state display |
| `LoadingState` | Loading indicators (spinner/skeleton/page) |
| `PermissionWrapper` | Role-based content gating |
| `CommandPalette` | Ctrl+K navigation |
| `NotificationCenter` | Notification bell + drawer |
| `GlobalSearch` | Search dialog |
| `StatisticsCard` | Metric display |
| `GlobalToolbar` | Studio toolbar (search, refresh, export, import) |
| `DashboardWidget` | Configurable dashboard widget |

---

## 4. Every Studio Must Follow This Structure

```
StudioLayout
├── title="Studio Name"
├── description="Studio description"
├── breadcrumbItems=[{label: "Dashboard", href: "/dashboard"}, {label: "Studio Name"}]
│
├── <StatisticsCard />      # Optional — show key metrics
│
├── <GlobalToolbar />       # Search + Refresh + Export + Import + Actions
│
├── <DataTable />           # Main data display
│   ├── columns             # Column definitions
│   ├── data                # Query results
│   ├── isLoading            # Loading state
│   ├── sortKey/direction   # Sort state
│   └── onRowClick          # Drill-down or edit
│
├── <CrudDialog />          # Create/Edit dialog
│
└── <EmptyState /> / <LoadingState />  # Edge cases
```

**Every CRUD page MUST follow this order**:
1. Header (via StudioLayout)
2. Stats (optional, via StatisticsCard)
3. Toolbar (via GlobalToolbar — search, refresh, export, import)
4. Filters (via FilterBar)
5. Data Table (via DataTable)
6. Bulk Actions (TBD)
7. Pagination (TBD)
8. Dialogs (via CrudDialog)
9. Activity Timeline (TBD)

---

## 5. Routing & Navigation

### Route Registry
All routes are defined in `src/lib/routes.ts` and consumed by:
- The sidebar (`Sidebar.tsx`)
- The command palette (`CommandPalette.tsx`)
- The global search (`GlobalSearch.tsx`)
- The breadcrumb framework (`getBreadcrumbs()`)

### Studio Registry
All studios and modules are defined in `src/config/studios.ts` and consumed by:
- The route registry
- The dashboard studios grid
- Feature flag system
- Permission checks

### Route Protection
- `ProtectedRoute` — Requires authentication, redirects to `/auth`
- `PublicOnlyRoute` — Redirects authenticated users to `/dashboard`

### Path Convention
```
/dashboard              → Control Center
/studio/{module-id}     → Studio pages (org, master-data, access, workflow, tasks, crm, etc.)
/settings               → Application settings
/auth                   → Authentication
*                       → 404
```

---

## 6. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | PascalCase for components, camelCase for utils | `OrganizationStudio.tsx`, `use-auth.ts` |
| Components | PascalCase | `DataTable`, `EmptyState` |
| Functions | camelCase | `getRoutesByGroup()` |
| Variables | camelCase | `breadcrumbItems` |
| CSS classes | Tailwind utility classes | Never custom CSS |
| Routes | kebab-case | `/studio/master-data` |
| Convex modules | dot-separated | `organization.organizations.list` |
| Convex tables | snake_case | `organizations`, `leadMaster` |

---

## 7. Development Rules

1. **NEVER duplicate layouts** — Every page uses `DashboardLayout` or `StudioLayout`
2. **NEVER duplicate tables** — Every list uses `DataTable`
3. **NEVER duplicate forms** — Every create/edit uses `CrudDialog`
4. **NEVER hardcode routes** — Consume `src/lib/routes.ts` or `src/config/studios.ts`
5. **NEVER hardcode UI values** — Use Tailwind utility classes & CSS variables
6. **ALWAYS use the Studio Registry** — Add new modules to `src/config/studios.ts`
7. **ALWAYS check the Component Registry** — Before creating a new component, check `src/lib/component-registry.ts`
8. **ALWAYS integrate with Tasks, Notifications, and Access Control** — New modules must connect to these shared services
9. **Backend enforces permissions** — Frontend is never trusted for security
10. **Configuration before customization** — Everything should be configurable through master data

---

## 8. Feature Flags

Feature flags are managed in two places:

### App-level features (`src/config/app.ts`)
```ts
features: {
  commandPalette: true,
  globalSearch: true,
  notificationCenter: true,
  darkMode: false,
  aiAssistant: false,
  analytics: false,
}
```

### Module-level status (`src/config/studios.ts`)
```ts
status: "enabled" | "disabled" | "beta" | "coming-soon" | "hidden"
```

Usage:
```ts
import { isFeatureEnabled, isModuleEnabled } from "@/lib/features";
if (isFeatureEnabled("commandPalette")) { ... }
if (isModuleEnabled("crm")) { ... }
```

---

## 9. Design System

All design tokens are documented in `src/lib/design-tokens.ts`.
Values are implemented as CSS custom properties in `src/index.css`.

### Key Tokens
- **Border radius**: `rounded-sm` (4px) — cards, inputs, buttons
- **Shadows**: `shadow-none` — all cards; shadows only for overlays
- **Colors**: Monochrome oklch palette — near-zero chroma
- **Typography**: system-ui font family, light-to-medium weights
- **Animation**: 200ms ease-out for micro-interactions
- **Spacing**: 4px base unit (Tailwind scale)

---

## 10. Adding a New Studio/Module

1. Add to `src/config/studios.ts` with icon, description, status, group
2. The route registry (`src/lib/routes.ts`) is auto-updated if the studio is visible
3. Create the page component in `src/pages/studio/` using `StudioLayout`
4. Add the route in `src/main.tsx` with `ProtectedRoute`
5. Follow the standard page structure (Header → Toolbar → Table → Dialogs)
6. Add Convex backend (schema + queries + mutations) in `src/convex/`
7. Add any new shared components to `src/lib/component-registry.ts`
8. Verify with `npx tsc -b --noEmit`
