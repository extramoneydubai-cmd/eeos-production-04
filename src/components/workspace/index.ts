/**
 * EEOS Workspace Framework — Barrel Export
 *
 * Import everything from here:
 *   import { WorkspaceShell, WorkspaceOverviewTab, ... } from "@/components/workspace";
 */

// ─── Types ─────────────────────────────────────────────────────
export type {
  WorkspaceEntityType,
  WorkspaceTabDefinition,
  WorkspaceTabProps,
  WorkspaceAction,
  WorkspaceHeaderField,
  WorkspaceBodySection,
  WorkspaceBodyField,
  WorkspaceShellProps,
} from "./types";

// ─── Shell ─────────────────────────────────────────────────────
export { WorkspaceShell } from "./WorkspaceShell";
export { SmartActionBar } from "./SmartActionBar";
export { WorkspaceQR } from "./WorkspaceQR";

// ─── Tab Plugins ───────────────────────────────────────────────
export { WorkspaceOverviewTab } from "./WorkspaceOverviewTab";
export { WorkspaceTimelineTab } from "./WorkspaceTimelineTab";
export { WorkspaceTasksTab } from "./WorkspaceTasksTab";
export { WorkspaceDocumentsTab } from "./WorkspaceDocumentsTab";
export { WorkspaceActivityTab } from "./WorkspaceActivityTab";
export { WorkspaceNotesTab } from "./WorkspaceNotesTab";
export { WorkspaceRelatedTab } from "./WorkspaceRelatedTab";
