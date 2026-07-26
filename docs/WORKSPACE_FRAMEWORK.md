# EEOS Enterprise Workspace Framework

**Last updated:** July 26, 2026
**Version:** 1.0

---

## Overview

The Enterprise Workspace Framework provides a **universal, reusable workspace shell** that every EEOS entity module consumes. Instead of each module building its own workspace page (LeadWorkspace: 4,000+ lines, TaskDetail: 1,500+ lines, ProfilePage: 800+ lines), all entities share a single `WorkspaceShell` with **plugin-based tab components**.

This eliminates:
- Duplicated tab UI across modules
- Inconsistent layout/behavior
- Repeated permission and visibility checks
- Massive monolithic page files

---

## Architecture

```
Entity Module (lead, student, employee, ...)
  │
  ├── Configures: Tab Definitions & Actions
  │
  └── <WorkspaceShell>              ← Single source of truth
        ├── Back Link
        ├── Sticky Header
        │     ├── Avatar
        │     ├── Title + Subtitle
        │     ├── Badges
        │     ├── Header Fields
        │     └── SmartActionBar    ← Permission-aware buttons
        ├── Progress Bar            ← Pipeline/funnel indicator
        └── Tabs                    ← Plugin-driven
              ├── Overview          ← Sections & widgets
              ├── Timeline          ← TimelineView
              ├── Tasks             ← Task CRUD
              ├── Documents         ← AttachmentPanel
              ├── Activity          ← ActivityTimeline
              ├── Notes             ← CommentPanel
              └── Related           ← Linked records
```

---

## File Structure

```
src/components/workspace/
├── index.ts                       # Barrel export
├── types.ts                       # Core types & interfaces
├── WorkspaceShell.tsx             # Universal workspace container
├── SmartActionBar.tsx             # Permission-aware action buttons
├── WorkspaceQR.tsx                # QR code viewer
├── WorkspaceOverviewTab.tsx       # Entity facts/summary
├── WorkspaceTimelineTab.tsx       # Timeline events
├── WorkspaceTasksTab.tsx          # Task management
├── WorkspaceDocumentsTab.tsx      # Document attachments
├── WorkspaceActivityTab.tsx       # Activity log
├── WorkspaceNotesTab.tsx          # Notes & comments
└── WorkspaceRelatedTab.tsx        # Related records
```

---

## Quick Start

### 1. Define your workspace tabs

```tsx
import {
  WorkspaceShell,
  WorkspaceOverviewTab,
  WorkspaceTimelineTab,
  WorkspaceTasksTab,
  type WorkspaceTabDefinition,
  type WorkspaceAction,
} from "@/components/workspace";

// Define tabs for your entity
const STUDENT_TABS: WorkspaceTabDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    component: (props) => (
      <StudentOverviewTab {...props} sections={STUDENT_SECTIONS} />
    ),
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: History,
    component: WorkspaceTimelineTab,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: ListChecks,
    component: WorkspaceTasksTab,
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    component: WorkspaceDocumentsTab,
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
    component: WorkspaceActivityTab,
  },
  {
    id: "notes",
    label: "Notes",
    icon: MessageSquare,
    component: WorkspaceNotesTab,
  },
  {
    id: "related",
    label: "Related",
    icon: Link2,
    component: (props) => (
      <WorkspaceRelatedTab {...props} groups={STUDENT_RELATED_GROUPS} />
    ),
  },
];
```

### 2. Define actions for the SmartActionBar

```tsx
const STUDENT_ACTIONS: WorkspaceAction[] = [
  {
    id: "enroll",
    label: "Enroll",
    icon: UserPlus,
    onClick: () => openEnrollmentDialog(),
    variant: "default",
    permissionCheck: { action: "create", module: "student" },
  },
  {
    id: "edit",
    label: "Edit",
    icon: Edit3,
    onClick: () => openEditDialog(),
    variant: "outline",
  },
  {
    id: "call",
    label: "Call",
    icon: Phone,
    onClick: () => initiateCall(),
    variant: "outline",
    disabled: !student.phone,
    tooltip: student.phone ? `Call ${student.phone}` : "No phone number",
    iconColor: "text-emerald-500",
  },
];
```

### 3. Define the Overview tab sections

```tsx
const STUDENT_SECTIONS: WorkspaceBodySection[] = [
  {
    id: "contact",
    title: "Contact Info",
    icon: Phone,
    columns: 1,
    fields: [
      { label: "Phone", value: student.phone, type: "phone" },
      { label: "Email", value: student.email, type: "email" },
      { label: "Address", value: student.address, type: "text" },
    ],
  },
  {
    id: "academic",
    title: "Academic Info",
    icon: BookOpen,
    columns: 2,
    fields: [
      { label: "Grade", value: "12", type: "badge", badgeColor: "bg-blue-500 text-white" },
      { label: "Section", value: "A", type: "text" },
      { label: "Attendance", value: "92%", type: "badge", badgeColor: "bg-emerald-500 text-white" },
    ],
  },
];
```

### 4. Render the WorkspaceShell

```tsx
export default function StudentWorkspace() {
  const { studentId } = useParams();
  const student = useQuery(api.student.getById, { studentId: studentId as any });

  return (
    <WorkspaceShell
      entityType="student"
      entityId={studentId}
      entity={student}
      isLoading={student === undefined}
      error={student === null ? "Student not found" : null}
      title={`${student?.firstName} ${student?.lastName}`}
      subtitle={`Student • Grade ${student?.grade}`}
      badge={{ label: student?.status || "Active", color: "bg-emerald-500" }}
      avatarInitials={`${student?.firstName?.[0] || ""}${student?.lastName?.[0] || ""}`}
      backLink={{ label: "Back to Students", onClick: () => navigate("/students") }}
      tabs={STUDENT_TABS}
      actions={STUDENT_ACTIONS}
      module="student"
    />
  );
}
```

---

## Tab Plugins

### Built-in Plugins

| Plugin | Component | SDK Integration | Description |
|--------|-----------|-----------------|-------------|
| Overview | `WorkspaceOverviewTab` | — | Section cards with field types (text, badge, date, currency, link, select, boolean, phone, email) |
| Timeline | `WorkspaceTimelineTab` | `timelineSdk` | TimelineView showing chronological events |
| Tasks | `WorkspaceTasksTab` | `taskSdk` | Task CRUD with completion toggling |
| Documents | `WorkspaceDocumentsTab` | `documentSdk` | AttachmentPanel with upload/search/delete/restore |
| Activity | `WorkspaceActivityTab` | `eventSdk` | ActivityTimeline showing audit trail |
| Notes | `WorkspaceNotesTab` | `communicationSdk` | CommentPanel with replies/pin/resolve/reactions |
| Related | `WorkspaceRelatedTab` | — | Grid of linked entity groups with drill-down |

### Custom Plugins

Module-specific tabs implement the `WorkspaceTabDefinition` interface:

```tsx
const MY_CUSTOM_TAB: WorkspaceTabDefinition = {
  id: "analytics",
  label: "Analytics",
  icon: BarChart3,
  component: MyAnalyticsTab,
  permissionCheck: {
    action: "view_analytics",
    category: "lead_analytics",
    section: "analytics",
  },
};
```

Each tab receives `WorkspaceTabProps`:
```tsx
interface WorkspaceTabProps {
  entityType: WorkspaceEntityType;
  entityId: string;
  entity: Record<string, unknown>;
  userId?: string;
  userRole?: string;
  compact?: boolean;
  className?: string;
}
```

---

## SDK Integration

| SDK | Methods Used | Tab |
|-----|-------------|-----|
| `timelineSdk` | `getEntityTimeline` | Timeline |
| `taskSdk` | `create`, `update`, `delete`, `listByEntity` | Tasks |
| `documentSdk` | `upload`, `delete`, `restore`, `listEntityAttachments` | Documents |
| `eventSdk` | `getEntityActivity` | Activity |
| `communicationSdk` | `create`, `delete`, `resolve`, `pin`, `react` | Notes |
| `visibilitySdk` | `canDiscover`, `canOpen`, `filterRecords` | All (via Shell) |
| `permissionSdk` | `canPerformAction`, `filterSections` | All (via Shell) |

---

## SmartActionBar

The `SmartActionBar` renders action buttons with:
- **Permission gating** — actions can require `canPerformAction` checks
- **Overflow menu** — actions beyond the visible limit collapse into a dropdown
- **Tooltips** — contextual hints on hover
- **Disabled states** — conditional disabling with reason in tooltip

```tsx
<SmartActionBar
  actions={ENTITY_ACTIONS}
  module="student"
  maxVisible={4}
/>
```

---

## Migration Guide

### From LeadWorkspace (4,000+ lines) to WorkspaceShell

1. Extract tab definitions from the monolithic file into a `LEAD_TABS` array
2. Extract sections into `LEAD_SECTIONS` array
3. Extract actions into `LEAD_ACTIONS` array
4. Replace `<div>...massive JSX...</div>` with `<WorkspaceShell ... />`
5. Create custom tab components for any lead-specific tabs (e.g. Payments, PDC, Approvals)

### From TaskDetail (1,500+ lines) to WorkspaceShell

1. Define `TASK_TABS` with overview (task fields), timeline, notes
2. Extract task-specific fields into `TASK_SECTIONS`
3. Render `<WorkspaceShell ... />`

---

## Permission & Visibility

The WorkspaceShell supports:

- **Action-level permissions** via `permissionSdk.canPerformAction()`
- **Tab visibility** via `permissionCheck` on tab definitions
- **Section visibility** via `permissionSdk.filterSections()`
- **Entity visibility** via `visibilitySdk.canOpen()`
- **CEO override** via `bypassPermissions` prop

---

## API Reference

### `WorkspaceShell`

| Prop | Type | Required | Description |
|------|------|:--------:|-------------|
| `entityType` | `WorkspaceEntityType` | ✅ | Entity type identifier |
| `entityId` | `string` | ✅ | Document ID |
| `entity` | `Record<string, unknown> \| null` | ✅ | Raw entity data |
| `isLoading` | `boolean` | | Show loading state |
| `error` | `string \| null` | | Show error state |
| `title` | `string` | ✅ | Header title |
| `subtitle` | `string` | | Subtitle text |
| `badge` | `{ label, color }` | | Primary status badge |
| `badgeSecondary` | `{ label, color }` | | Secondary badge |
| `headerFields` | `WorkspaceHeaderField[]` | | Info row below title |
| `avatar` | `ReactNode` | | Custom avatar |
| `avatarInitials` | `string` | | Avatar fallback text |
| `backLink` | `{ label, onClick }` | | Breadcrumb back link |
| `progressBar` | `ProgressBarConfig` | | Pipeline stages |
| `tabs` | `WorkspaceTabDefinition[]` | ✅ | Tab plugin definitions |
| `defaultTab` | `string` | | Initial active tab |
| `onTabChange` | `(tabId) => void` | | Tab change callback |
| `actions` | `WorkspaceAction[]` | | Action bar buttons |
| `module` | `string` | | Module for permission checks |
| `bypassPermissions` | `boolean` | | CEO override flag |

### `WorkspaceOverviewTab`

| Prop | Type | Required | Description |
|------|------|:--------:|-------------|
| `sections` | `WorkspaceBodySection[]` | | Section cards |
| `widgets` | `Widget[]` | | Side widgets (health score, pipeline, etc.) |

### `WorkspaceAction`

| Prop | Type | Required | Description |
|------|------|:--------:|-------------|
| `id` | `string` | ✅ | Unique action ID |
| `label` | `string` | ✅ | Button text |
| `icon` | `LucideIcon` | ✅ | Icon component |
| `onClick` | `() => void` | ✅ | Click handler |
| `variant` | `"default" \| "outline" \| "destructive"` | | Button variant |
| `disabled` | `boolean` | | Disabled state |
| `permissionCheck` | `{ action, module }` | | Permission requirement |
| `tooltip` | `string` | | Tooltip text |
