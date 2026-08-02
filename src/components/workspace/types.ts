/**
 * EEOS Workspace Framework — Core Types
 *
 * Every entity workspace in EEOS follows this structure.
 * Modules register plugins to define their workspace tabs.
 */

import type { ReactNode, ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

// ─── Entity Types ───────────────────────────────────────────────

/** Supported entity types that can have a workspace */
export type WorkspaceEntityType =
  | "lead"
  | "student"
  | "employee"
  | "person"
  | "faculty"
  | "parent"
  | "vendor"
  | "applicant"
  | "course"
  | "batch"
  | "exam"
  | "task"
  | "opportunity"
  | "quotation"
  | "company"
  | "branch"
  | "department"
  | "team"
  | "asset"
  | "document"
  | "invoice"
  | "custom";

// ─── Tab Plugin System ──────────────────────────────────────────

/** A tab rendered inside a WorkspaceShell */
export interface WorkspaceTabDefinition {
  /** Unique ID for this tab (e.g. "overview", "timeline", "tasks") */
  id: string;
  /** Human-readable label shown in tab bar */
  label: string;
  /** Icon for the tab */
  icon: LucideIcon;
  /** The React component to render */
  component: ComponentType<WorkspaceTabProps>;
  /** Optional permission/visibility check */
  permissionCheck?: {
    /** Permission action required (e.g. "view_timeline") */
    action?: string;
    /** Visibility category required (e.g. "lead_timeline") */
    category?: string;
    /** Section name for section-level permission check */
    section?: string;
  };
  /** If true, this tab is shown even if entity data hasn't loaded */
  showOnLoading?: boolean;
}

/** Backwards-compatible alias for the workspace tab definition type. */
export type WorkspaceTabConfig = WorkspaceTabDefinition;

/** Props passed to every workspace tab component */
export interface WorkspaceTabProps {
  /** The entity type (e.g. "lead", "student") */
  entityType: WorkspaceEntityType;
  /** The entity's document ID */
  entityId: string;
  /** The full entity data object */
  entity: Record<string, unknown>;
  /** Organization scope IDs */
  orgId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  /** Current user info */
  userId?: string;
  userRole?: string;
  /** If true, show compact version */
  compact?: boolean;
  /** Nested className override */
  className?: string;
}

// ─── Action Bar ─────────────────────────────────────────────────

/** An action button in the SmartActionBar */
export interface WorkspaceAction {
  /** Unique action ID */
  id: string;
  /** Button label */
  label: string;
  /** Icon */
  icon: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: "default" | "outline" | "destructive" | "ghost";
  /** If true, disable the button */
  disabled?: boolean;
  /** Optional permission check */
  permissionCheck?: {
    action: string;
    module: string;
  };
  /** Tooltip text */
  tooltip?: string;
  /** Icon color class */
  iconColor?: string;
}

// ─── Header Fields ──────────────────────────────────────────────

/** A field displayed in the workspace header */
export interface WorkspaceHeaderField {
  label: string;
  value: string | number | null | undefined;
  icon?: LucideIcon;
  /** CSS color class for the icon background */
  color?: string;
}

// ─── Body Sections (for Overview tab) ───────────────────────────

/** A section/card in the overview tab */
export interface WorkspaceBodySection {
  id: string;
  title: string;
  icon?: LucideIcon;
  /** Array of field rows for this section */
  fields: WorkspaceBodyField[];
  /** Number of columns: 1 or 2 */
  columns?: 1 | 2;
}

/** A single field row in a body section */
export interface WorkspaceBodyField {
  label: string;
  value: string | number | ReactNode | null | undefined;
  type?: "text" | "badge" | "date" | "currency" | "link" | "select" | "boolean" | "avatar" | "phone" | "email";
  /** For select type: options */
  options?: { label: string; value: string }[];
  /** For link type: href */
  href?: string;
  /** Callback when value changes (if editable) */
  onChange?: (value: string | number | boolean) => void;
  /** If true, this field is editable */
  editable?: boolean;
  /** Badge color class */
  badgeColor?: string;
  /** CSS class overrides */
  className?: string;
}

// ─── Shell Props ────────────────────────────────────────────────

/** Complete props for the WorkspaceShell */
export interface WorkspaceShellProps {
  /** The entity type (entity/tab mode). Optional in container mode. */
  entityType?: WorkspaceEntityType;
  /** Entity ID (entity/tab mode). Optional in container mode. */
  entityId?: string;
  /** Raw entity data (can be null/undefined while loading) */
  entity?: Record<string, unknown> | null | undefined;
  /** Is the entity currently loading? */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Custom header node (legacy pages) — rendered instead of the default title block */
  header?: ReactNode;
  /** Title shown in the header (optional in container mode) */
  title?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Badge/label for the entity (e.g. stage, status) */
  badge?: { label: string; color: string };
  /** Secondary badge */
  badgeSecondary?: { label: string; color: string };
  /** Header fields (displayed below title) */
  headerFields?: WorkspaceHeaderField[];
  /** Avatar/icon for the entity */
  avatar?: ReactNode;
  /** Initials for the avatar fallback */
  avatarInitials?: string;
  /** Breadcrumb back link */
  backLink?: { label: string; onClick: () => void };
  /** Progress bar config (e.g. pipeline stages) */
  progressBar?: {
    stages: { id: string; label: string; color: string }[];
    currentStageIndex: number;
    maxStages?: number;
  };
  /** Tab definitions (entity mode). Omit in container mode. */
  tabs?: WorkspaceTabDefinition[];
  /** Currently active tab (controlled or default) */
  defaultTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Action bar items (entity mode) — rendered via SmartActionBar */
  actions?: WorkspaceAction[];
  /** Raw action bar node (container mode) — rendered in the header right slot */
  actionBar?: ReactNode;
  /** Container mode body — rendered when provided instead of the tab system */
  children?: ReactNode;
  /** KPI strip rendered below the header (container mode) */
  kpiStrip?: ReactNode;
  /** Filter bar rendered below the header (container mode) */
  filterBar?: ReactNode;
  /** Right context panel (container mode) — hidden below xl */
  contextPanel?: ReactNode;
  /** Bottom timeline panel (container mode) */
  bottomTimeline?: ReactNode;
  /** Module name for permission checks */
  module?: string;
  /** If true, the permission checks are skipped (CEO-override) */
  bypassPermissions?: boolean;
  /** Custom class */
  className?: string;
}
