/**
 * EEOS Component Registry
 *
 * This file documents every reusable component in the platform.
 * Future modules MUST reuse these — never duplicate.
 * Every entry describes: where it lives, what it does, and how to use it.
 */

export interface ComponentEntry {
  name: string;
  path: string;
  description: string;
  /** Example props for quick reference */
  propsExample?: string;
  /** Modules that currently use this component */
  usedBy: string[];
  /** Core vs. Shared vs. UI classification */
  category: "layout" | "data" | "shared" | "ui" | "config";
}

/**
 * Complete registry of all platform components.
 * Add entries here when you create a new reusable component.
 */
export const componentRegistry: ComponentEntry[] = [
  // ── Layout ───────────────────────────────────────────────────
  {
    name: "DashboardLayout",
    path: "@/components/layout/DashboardLayout",
    description: "Main authenticated app shell with sidebar, header, and content area",
    usedBy: ["Dashboard", "All Studios"],
    category: "layout",
  },
  {
    name: "StudioLayout",
    path: "@/components/layout/StudioLayout",
    description: "Studio workspace with title, description, breadcrumbs, and content slot",
    propsExample: "<StudioLayout title=\"CRM\" description=\"...\" breadcrumbItems={[...]}>",
    usedBy: ["OrganizationStudio", "All Studios"],
    category: "layout",
  },
  {
    name: "AppSidebar",
    path: "@/components/layout/Sidebar",
    description: "Collapsible sidebar with route-registry-driven navigation and 'Soon' badges",
    usedBy: ["DashboardLayout"],
    category: "layout",
  },
  {
    name: "Header",
    path: "@/components/layout/Header",
    description: "Top bar with breadcrumbs, command palette trigger, notifications, user menu",
    propsExample: "<Header breadcrumb={...} actions={...} />",
    usedBy: ["DashboardLayout"],
    category: "layout",
  },

  // ── Data ─────────────────────────────────────────────────────
  {
    name: "DataTable",
    path: "@/components/data/DataTable",
    description: "Full-featured table with sorting, loading skeletons, empty states, row clicks",
    propsExample: "<DataTable columns={...} data={...} keyExtractor={...} />",
    usedBy: ["OrganizationStudio"],
    category: "data",
  },
  {
    name: "SearchBar",
    path: "@/components/data/SearchBar",
    description: "Debounced search input with clear button",
    propsExample: "<SearchBar value={search} onChange={setSearch} />",
    usedBy: ["OrganizationStudio"],
    category: "data",
  },
  {
    name: "FilterBar",
    path: "@/components/data/FilterBar",
    description: "Active filter chips with remove and clear-all",
    propsExample: "<FilterBar options={...} onRemove={...} onClearAll={...} />",
    usedBy: ["TBD"],
    category: "data",
  },

  // ── Shared ───────────────────────────────────────────────────
  {
    name: "CrudDialog",
    path: "@/components/shared/CrudDialog",
    description: "Reusable form dialog for create/edit operations with react-hook-form",
    propsExample: "<CrudDialog open={...} title=\"...\" fields={...} onSubmit={...} />",
    usedBy: ["OrganizationStudio"],
    category: "shared",
  },
  {
    name: "EmptyState",
    path: "@/components/shared/EmptyState",
    description: "Consistent empty state with icon, title, description, and optional action",
    usedBy: ["All Studios"],
    category: "shared",
  },
  {
    name: "LoadingState",
    path: "@/components/shared/LoadingState",
    description: "Loading variants: spinner, skeleton, page-level",
    usedBy: ["TBD"],
    category: "shared",
  },
  {
    name: "PermissionWrapper",
    path: "@/components/shared/PermissionWrapper",
    description: "Role-based content gating with optional fallback",
    propsExample: "<PermissionWrapper allowedRoles={['admin']} currentRole={role}>...",
    usedBy: ["TBD"],
    category: "shared",
  },
  {
    name: "CommandPalette",
    path: "@/components/shared/CommandPalette",
    description: "Ctrl+K command palette with route-driven commands and groups",
    usedBy: ["Header"],
    category: "shared",
  },
  {
    name: "NotificationCenter",
    path: "@/components/shared/NotificationCenter",
    description: "Notification bell with unread badge + slide-out drawer",
    usedBy: ["Header"],
    category: "shared",
  },
  {
    name: "GlobalSearch",
    path: "@/components/shared/GlobalSearch",
    description: "Search dialog with route-driven results (UI framework for future indexing)",
    usedBy: ["Header"],
    category: "shared",
  },
  {
    name: "StatisticsCard",
    path: "@/components/shared/StatisticsCard",
    description: "Statistics/metric display card with label, value, trend, and icon",
    usedBy: ["TBD"],
    category: "shared",
  },
  {
    name: "GlobalToolbar",
    path: "@/components/shared/GlobalToolbar",
    description: "Studio-level toolbar with search, refresh, export, import, settings, help",
    usedBy: ["TBD"],
    category: "shared",
  },
  {
    name: "DashboardWidget",
    path: "@/components/shared/DashboardWidget",
    description: "Configurable dashboard widget container with config-driven rendering",
    usedBy: ["Dashboard"],
    category: "shared",
  },
];

/** Look up a component by name */
export function getComponent(name: string): ComponentEntry | undefined {
  return componentRegistry.find((c) => c.name === name);
}

/** Get all components in a category */
export function getComponentsByCategory(category: ComponentEntry["category"]): ComponentEntry[] {
  return componentRegistry.filter((c) => c.category === category);
}
