# BACKLOG-001 — Enterprise Task Security & RBAC Architecture

> **Status:** Architecture & Planning (Pre-Implementation)  
> **Priority:** 🔴 P0 — Security  
> **Module:** Task Management  
> **Domain:** Security, RBAC, Access Control  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Audited Codebase:** `tasks` (schema), `crmTasks.ts` (backend), `tasks.ts` (backend), `TasksPage.tsx` (kanban UI), `TaskDetail.tsx` (detail UI), `userScopes` (RBAC), `users` (roles), `organization` (hierarchy), `AccessControl.tsx` (scope management)  
> **Beta Blocker:** Yes — Client beta feedback identified privacy and security issues

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Design Principles](#2-design-principles)
3. [Task Visibility Model](#3-task-visibility-model)
4. [Permission Matrix](#4-permission-matrix)
5. [Task Ownership](#5-task-ownership)
6. [Kanban Behaviour](#6-kanban-behaviour)
7. [API Security Principles](#7-api-security-principles)
8. [Audit Trail](#8-audit-trail)
9. [Notifications](#9-notifications)
10. [Cross Department Rules](#10-cross-department-rules)
11. [Future Portal Support](#11-future-portal-support)
12. [AI Considerations](#12-ai-considerations)
13. [Implementation Strategy](#13-implementation-strategy)
14. [Dependencies](#14-dependencies)
15. [Risks](#15-risks)
16. [Acceptance Criteria](#16-acceptance-criteria)
17. [Priority & Classification](#17-priority--classification)
18. [Related Documents](#18-related-documents)

---

## 1. Problem Statement

### Current Behaviour (Audited)

The following security vulnerabilities exist in the current codebase (verified via source code audit):

| # | Issue | Source File | Severity |
|---|-------|-------------|----------|
| 1 | Tasks have **no visibility field** — all tasks visible to all users | `schema.ts` → `tasks` table | 🔴 Critical |
| 2 | `listTasks` query returns **all tasks** with no owner/department filter | `tasks.ts` → `listTasks` | 🔴 Critical |
| 3 | `getSalesPendingTasks` returns **all pending tasks** regardless of user department or team | `crmTasks.ts:13` — `ctx.db.query("leadTasks").collect()` | 🔴 Critical |
| 4 | `updateTaskStatus` has **no permission check** — any authenticated user can change any task | `tasks.ts` → `updateTaskStatus` | 🔴 Critical |
| 5 | `updateLeadTaskStatus` has **no permission check** — any user can complete any lead task | `crmTasks.ts:73` | 🔴 Critical |
| 6 | `updateLeadTask` has **no permission check** — any user can edit task title, priority, assignee | `crmTasks.ts:83` | 🔴 Critical |
| 7 | Kanban drag-and-drop **allows any user to move any task** between columns | `TasksPage.tsx:165` — `updateStatusMutation` | 🔴 Critical |
| 8 | Task detail page **allows any user to change priority/status** via Select dropdown | `TaskDetail.tsx:157` | 🟠 High |
| 9 | Users can add comments to **any task**, not just their own | `TaskDetail.tsx:173` — `addComment` | 🟠 High |
| 10 | No **backend authorization check** exists in any task mutation | All task mutations | 🔴 Critical |
| 11 | No **audit logging** for task visibility access or unauthorized attempts | All task operations | 🟠 High |
| 12 | `userScopes` table exists but is **not integrated** with task queries | `schema.ts` → `userScopes` | 🟠 High |

### Expected Behaviour

- Employees see **only tasks they own, are assigned to, or are participants of** by default
- Managers see tasks within their **department or team**
- Branch heads see tasks within their **branch**
- Super admins see **all tasks**
- Users **cannot modify tasks they do not have permission to edit**
- Every task action is **audited**
- Backend **enforces all permissions** — frontend is never trusted

### Business Impact

| Impact | Description |
|--------|-------------|
| **Privacy** | Sensitive task information (HR matters, disciplinary actions, salary discussions, student performance) can be viewed by unauthorized employees |
| **Accountability** | Tasks can be marked complete by anyone, breaking accountability chains |
| **Confidentiality** | Cross-department visibility leaks confidential business strategy |
| **Compliance** | Educational institutions require strict data access controls for student-related tasks |
| **Trust** | Employees lose trust when they can see other employees' private work items |

### Security Impact

| Vector | Risk |
|--------|------|
| **Data Leakage** | Any authenticated user can enumerate all tasks in the system |
| **Privilege Escalation** | Any user can modify tasks assigned to managers or executives |
| **Integrity Violation** | Task status, priority, and assignment can be altered without authorization |
| **Audit Evasion** | No audit trail exists to detect or investigate unauthorized modifications |

### Beta Blocker Justification

This is classified as **P0 — Beta Blocker** because:

1. Client beta feedback explicitly identified cross-employee task visibility as unacceptable
2. Educational institutions have strict data privacy requirements (DPDP Act, FERPA-like compliance)
3. Task management is the **core operational engine** — integrity and confidentiality are non-negotiable
4. Without RBAC, the Task Management module cannot be considered production-ready for enterprise deployment

---

## 2. Design Principles

### Principle 1: Privacy by Default

> Every task is private unless explicitly shared. Users see only what they need.

- A task created by an employee is visible **only to them** by default
- Tasks must be explicitly scoped to be visible to others
- No "public" task visibility mode — teams must opt-in to sharing

### Principle 2: Least Privilege Access

> Users have the minimum permissions necessary to perform their role.

- View permissions are granted based on task ownership, assignment, or explicit sharing
- Edit permissions are stricter than view permissions
- Delete permissions require elevated roles
- Permissions cascade: department head inherits team lead permissions

### Principle 3: Role-Based Security

> Permissions are derived from the EEOS role hierarchy, not duplicated.

| EEOS Role | Inherits From |
|-----------|---------------|
| `super_admin` | All roles + system-wide access |
| `admin` | All roles within scope |
| `manager` | Team lead + department scope |
| `staff` | Basic user permissions only |

### Principle 4: Backend Enforcement

> All permission checks happen on the backend. Frontend is never trusted.

- Backend queries filter tasks by the requesting user's scopes
- Backend mutations validate permission before executing
- Frontend UI hides controls based on permissions (UI-only, never security-critical)
- API responses return 403 for unauthorized operations

### Principle 5: Auditability

> Every task access attempt is logged — successful or not.

- Task creation, modification, deletion, and view are audited
- Unauthorized access attempts are logged with user, timestamp, and attempted action
- Audit logs are immutable and accessible only to super_admins

### Principle 6: Scalability

> The permission model must work for 10 employees or 10,000 employees.

- Queries use database indexes, not in-memory filtering
- Permissions leverage existing `userScopes` table and organization hierarchy
- No N+1 permission lookups per task
- Visibility rules are encoded as query filters, not post-query processing

---

## 3. Task Visibility Model

### Visibility Levels

The following visibility levels control who can see a task:

| Level | Icon | Code | Who Can See | Default For |
|-------|------|------|-------------|-------------|
| **Private** | 🔒 | `private` | Owner only | Tasks created by staff |
| **Shared Users** | 👥 | `shared` | Owner + explicitly shared users | Collaborative tasks |
| **Team** | 👨‍👩‍👧‍👦 | `team` | Owner's team members | Department tasks |
| **Department** | 🏢 | `department` | All users in the task's department | Cross-team projects |
| **Branch** | 🏪 | `branch` | All users in the task's branch | Branch-wide initiatives |
| **Company** | 🏛️ | `company` | All users in the task's company | Company-wide announcements |
| **Organization** | 🌐 | `organization` | All authenticated users | System-level tasks |

### When Each Level is Used

| Scenario | Recommended Visibility | Rationale |
|----------|----------------------|-----------|
| Personal to-do item | `private` | Only the owner needs to see it |
| Task assigned to a specific user | `shared` or `team` | Assignee needs access |
| Task for a specific team project | `team` | All team members collaborate |
| Cross-team initiative | `department` | Multiple teams within a department |
| Branch-level operational task | `branch` | All branch staff need awareness |
| Company-wide policy implementation | `company` | All employees need visibility |
| System maintenance announcement | `organization` | Everyone must be informed |

### Default Visibility Rules

| Task Creator Role | Default Visibility |
|-------------------|-------------------|
| Staff (no team) | `private` |
| Staff (in team) | `team` |
| Team Lead | `team` |
| Department Head | `department` |
| Branch Manager | `branch` |
| Admin | `company` |
| Super Admin | `organization` |

### Visibility Field (Schema Addition)

```typescript
// New field on tasks table
visibility: v.union(
  v.literal("private"),
  v.literal("shared"),
  v.literal("team"),
  v.literal("department"),
  v.literal("branch"),
  v.literal("company"),
  v.literal("organization"),
),

// New field for shared user IDs
sharedWithUserIds: v.optional(v.array(v.id("users"))),

// Index for visibility filtering
.index("visibility_owner", ["visibility", "ownerId"])
```

### Visibility Resolution Algorithm

When a user requests a list of tasks, the backend builds a permission filter:

```
User can see task IF:
  task.ownerId == user._id
  OR task.assignedTo == user._id
  OR task.sharedWithUserIds contains user._id
  OR (task.visibility == "team" AND user is in task's team)
  OR (task.visibility == "department" AND user is in task's department)
  OR (task.visibility == "branch" AND user is in task's branch)
  OR (task.visibility == "company" AND user is in task's company)
  OR (task.visibility == "organization")
  OR user has super_admin role
```

---

## 4. Permission Matrix

### Roles

| Role | Code | Scope |
|------|------|-------|
| **Employee** | `staff` | Own tasks, assigned tasks, shared tasks |
| **Team Lead** | `manager` (team scope) | Team tasks, own tasks |
| **Department Head** | `manager` (department scope) | Department tasks, team tasks |
| **Branch Manager** | `admin` (branch scope) | Branch tasks, department tasks |
| **Company Admin** | `admin` (company scope) | Company tasks, branch tasks |
| **Super Admin** | `super_admin` | All tasks |

### Complete Permission Matrix

| Permission | Staff | Team Lead | Dept Head | Branch Mgr | Company Admin | Super Admin |
|------------|-------|-----------|-----------|------------|---------------|-------------|
| **View own/assigned tasks** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View team tasks** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View department tasks** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **View branch tasks** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **View company tasks** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View all tasks** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Create tasks** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit own tasks** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit team tasks** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit department tasks** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Edit branch tasks** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Edit all tasks** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Delete own tasks** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Delete team tasks** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Delete department tasks** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Delete branch tasks** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Delete any task** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Assign tasks** | ✅ (own) | ✅ (team) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Reassign tasks** | ❌ | ✅ (team) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Move Kanban (own)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Move Kanban (team)** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Move Kanban (dept)** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Move Kanban (any)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Change Status (own)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Change Status (team)** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Change Status (any)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Close Task** | ✅ (own) | ✅ (team) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Reopen Task** | ✅ (own) | ✅ (team) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Comment** | ✅ (visible) | ✅ (visible) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Upload Attachment** | ✅ (visible) | ✅ (visible) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Approve Tasks** | ❌ | ✅ (team) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |
| **Export Tasks** | ✅ (own) | ✅ (visible) | ✅ (dept) | ✅ (branch) | ✅ (company) | ✅ |

### Permission Enforcement Function

```typescript
// Backend permission check — called by every task mutation/query
async function canAccessTask(
  ctx: QueryCtx | MutationCtx,
  taskId: Id<"tasks">,
  userId: Id<"users">,
  requiredPermission: "view" | "edit" | "delete" | "assign" | "approve"
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await ctx.db.get(userId);
  if (!user) return { allowed: false, reason: "User not found" };

  // Super admin can do everything
  if (user.role === "super_admin") return { allowed: true };

  const task = await ctx.db.get(taskId);
  if (!task) return { allowed: false, reason: "Task not found" };

  // Owner can do everything on their own task
  if (task.ownerId === userId) return { allowed: true };

  // Assigned user can view and edit (but not delete)
  if (task.assignedTo === userId && ["view", "edit"].includes(requiredPermission)) {
    return { allowed: true };
  }

  // Check visibility-based access
  const userScopes = await ctx.db
    .query("userScopes")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .first();

  if (!userScopes) return { allowed: false, reason: "No access scopes defined" };

  // Build scope check based on task visibility
  switch (task.visibility) {
    case "shared":
      if (task.sharedWithUserIds?.includes(userId)) 
        return { allowed: true };
      break;
    case "team":
      if (userScopes.teamIds?.includes(task.teamId as any))
        return checkLevel(requiredPermission, "team", user.role);
      break;
    case "department":
      if (userScopes.departmentIds?.includes(task.departmentId as any))
        return checkLevel(requiredPermission, "department", user.role);
      break;
    // ... additional visibility levels
  }

  return { allowed: false, reason: "Insufficient permissions" };
}
```

---

## 5. Task Ownership

### Ownership Roles

| Role | Description | Can Do |
|------|-------------|--------|
| **Owner** | User who created the task | Full control: edit, delete, assign, close |
| **Assignee** | User the task is assigned to | View, edit details, change status, comment |
| **Manager** | Reporting manager of the owner or assignee | View, edit, reassign within team |
| **Follower** | User watching the task (opted in) | View only, receive notifications |
| **Watcher** | User automatically following (participant) | View, comment, receive notifications |
| **Collaborator** | Explicitly shared user | View, comment, checklist management |
| **Read-Only User** | Users with visibility access | View only — no edits, no comments |

### Responsibility Matrix

| Aspect | Owner | Assignee | Manager | Follower | Collaborator | Read-Only |
|--------|-------|----------|---------|----------|--------------|-----------|
| **Accountable** | ✅ Final responsibility | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Responsible** | ✅ | ✅ Execution | ❌ | ❌ | ❌ | ❌ |
| **Consulted** | ❌ | ❌ | ✅ | ❌ | ✅ Input | ❌ |
| **Informed** | ✅ | ✅ | ✅ | ✅ Status | ✅ | ❌ |

### Ownership Transfer

| Scenario | New Owner | Permission Required |
|----------|-----------|-------------------|
| Employee leaves | Manager auto-assigned | Manager role |
| Project handoff | Designated successor | Team lead or above |
| Escalation | Manager takes over | Automatic |
| Reassignment | Selected user | Assign permission |
| Task completed | No change | N/A |

---

## 6. Kanban Behaviour

### Drag-and-Drop Permissions

| User Role | Can Drag Own Task | Can Drag Team Task | Can Drag Dept Task | Cannot Drag |
|-----------|-------------------|-------------------|-------------------|-------------|
| Staff | ✅ | ❌ | ❌ | All other tasks |
| Team Lead | ✅ | ✅ | ❌ | Dept+ tasks |
| Dept Head | ✅ | ✅ | ✅ | Branch+ tasks |
| Branch Manager | ✅ | ✅ | ✅ | Company+ tasks |
| Admin | ✅ | ✅ | ✅ | Super admin tasks |
| Super Admin | ✅ | ✅ | ✅ | None |

### Disabled Interactions

When a user does not have permission to drag a task:

1. **Curson change**: `cursor: not-allowed` instead of `cursor: grab`
2. **No drag handler**: `draggable={false}` on the `TaskCard` component
3. **Visual indicator**: Task card shows muted opacity or lock icon
4. **Drop zone**: Column shows as read-only for non-permitted tasks

### Read-Only Mode

A task card in read-only mode:

```tsx
// Modified TaskCard component
<TaskCard
  task={task}
  draggable={canDragTask(user, task)}
  readOnly={!canEditTask(user, task)}
  onClick={() => openTaskDetail(task._id, { readOnly: !canEditTask(user, task) })}
/>
```

### Permission Denied Behaviour

| Action | Frontend Response | Backend Response |
|--------|-------------------|------------------|
| Drag task without permission | No drag event fires; visual cue (cursor: not-allowed) | N/A (drag is frontend-only) |
| Drop task on unauthorized column | Toast: "You don't have permission to move this task" | 403: `{ error: "forbidden", message: "Insufficient permissions to update task status" }` |
| Click edit on read-only task | Edit controls hidden; "View only" badge shown | N/A |
| API call without permission | Show error toast | 403 with audit log entry |

---

## 7. API Security Principles

### Never Trust the Frontend

All security must be enforced at the backend level. Frontend checks are UI convenience only.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Convex API   │────▶│   Backend    │
│  (React UI)  │     │  (Mutations)  │     │  Validation  │
└─────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │ Hide buttons       │ Pass user token    │ Check permissions
       │ based on role      │ + action params    │ against DB
       │ (UI only)          │                    │
       │                    │                    │
       ▼                    ▼                    ▼
  User sees limited     Token identifies       Query filters
  controls              requesting user        by user scopes
```

### Backend Validation Pattern

Every task mutation must follow this pattern:

```typescript
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: taskStatusValidator,
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await getUserFromIdentity(ctx, identity);
    if (!user) throw new Error("User not found");

    // Permission check
    const permission = await canAccessTask(ctx, args.taskId, user._id, "edit");
    if (!permission.allowed) {
      // Audit the unauthorized attempt
      await auditLog(ctx, {
        action: "unauthorized_task_update",
        userId: user._id,
        taskId: args.taskId,
        details: { attemptedStatus: args.status, reason: permission.reason },
      });
      throw new Error(permission.reason || "Forbidden");
    }

    // Audit the successful change
    const task = await ctx.db.get(args.taskId);
    await auditLog(ctx, {
      action: "task_status_updated",
      userId: user._id,
      taskId: args.taskId,
      details: { fromStatus: task?.status, toStatus: args.status },
    });

    // Perform the actual update
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
    return { success: true };
  },
});
```

### Unauthorized Response Handling

| HTTP Status | Convex Error | When |
|-------------|--------------|------|
| 401 | `Unauthenticated` | No valid auth token |
| 403 | `Unauthorized: ${reason}` | Token valid but insufficient permissions |
| 404 | `Not found` | Task doesn't exist (no info leakage) |

### Rate Limiting (Future)

- 100 task mutations per minute per user
- 1000 task queries per minute per user
- Rate limit exceeded → 429 response with retry-after header

---

## 8. Audit Trail

### Audit Event Schema

```typescript
taskAuditEvents: defineTable({
  taskId: v.id("tasks"),
  userId: v.id("users"),
  action: v.union(
    v.literal("task_created"),
    v.literal("task_updated"),
    v.literal("task_deleted"),
    v.literal("task_status_changed"),
    v.literal("task_assigned"),
    v.literal("task_reassigned"),
    v.literal("task_visibility_changed"),
    v.literal("task_commented"),
    v.literal("task_checklist_updated"),
    v.literal("task_attachment_added"),
    v.literal("task_attachment_removed"),
    v.literal("task_approved"),
    v.literal("task_reopened"),
    v.literal("unauthorized_view_attempt"),
    v.literal("unauthorized_edit_attempt"),
  ),
  oldValues: v.optional(v.string()),   // JSON string of before state
  newValues: v.optional(v.string()),   // JSON string of after state
  reason: v.optional(v.string()),
  source: v.string(),                   // "web", "mobile", "api", "system"
  userAgent: v.optional(v.string()),
  ipAddress: v.optional(v.string()),    // Future
  createdAt: v.number(),
})
  .index("taskId", ["taskId"])
  .index("userId", ["userId"])
  .index("action", ["action"])
  .index("taskId_createdAt", ["taskId", "createdAt"]);
```

### What Gets Recorded

| Event | Old Values | New Values | Reason |
|-------|-----------|------------|--------|
| Task created | N/A | Full task object | Auto-generated |
| Status changed | `{ status: "todo" }` | `{ status: "in_progress" }` | Optional user note |
| Task assigned | `{ assignedTo: null }` | `{ assignedTo: "user_123" }` | Required |
| Visibility changed | `{ visibility: "private" }` | `{ visibility: "team" }` | Required |
| Unauthorized attempt | N/A | `{ attemptedAction, taskId }` | Auto-generated |
| Task deleted | Full task object | N/A | Required |
| Comment added | N/A | Comment content | Auto-generated |

### Audit Retrieval

- **Task owners/managers**: View audit log for their own tasks
- **Super admins**: View all audit logs
- **Audit logs**: Immutable — cannot be edited or deleted
- **Retention**: 2 years minimum (configurable)

---

## 9. Notifications

### Notification Triggers & Recipients

| Event | Recipients | Channel |
|-------|-----------|---------|
| **Task Created** | Assignee (if assigned) | In-app, Email (future) |
| **Task Assigned** | New assignee | In-app |
| **Task Reassigned** | Old assignee, new assignee, owner | In-app |
| **Status Changed** | Owner, assignee, manager | In-app |
| **Task Completed** | Owner, manager, followers | In-app |
| **Task Reopened** | Owner, assignee, manager | In-app |
| **Comment Added** | Owner, assignee, participants | In-app |
| **User Mentioned** | Mentioned user(s) | In-app (highlighted) |
| **Due Reminder** | Owner, assignee | In-app |
| **Overdue** | Owner, assignee, manager | In-app |
| **Task Deleted** | Owner, assignee, manager | In-app |
| **Visibility Changed** | Everyone who lost access (removed from scope) | In-app |
| **Approval Needed** | Approver(s) | In-app |

### Notification Permission Rules

| Role | Receives Notifications For |
|------|---------------------------|
| Task Owner | All changes to their tasks |
| Task Assignee | All changes to assigned tasks |
| Manager | Tasks under their team members (summary) |
| Department Head | Department tasks (daily digest) |
| Branch Manager | Branch tasks (critical only) |
| Super Admin | System-level tasks only |

### Notification Preferences (Future)

Users can configure per-event notification preferences:

```typescript
notificationPreferences: defineTable({
  userId: v.id("users"),
  taskCreated: v.boolean(),         // default: true
  taskAssigned: v.boolean(),        // default: true
  taskStatusChanged: v.boolean(),   // default: true
  taskCompleted: v.boolean(),        // default: true
  commentAdded: v.boolean(),        // default: true
  mentionReceived: v.boolean(),     // default: true (always)
  dueReminder: v.boolean(),         // default: true
  overdueAlert: v.boolean(),        // default: true
  digestFrequency: v.union(         // default: "realtime"
    v.literal("realtime"),
    v.literal("hourly"),
    v.literal("daily"),
    v.literal("never"),
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("userId", ["userId"]);
```

---

## 10. Cross Department Rules

### Department Visibility Matrix

| Department | Can See Tasks From | Notes |
|-----------|-------------------|-------|
| **Sales** | Sales, Marketing | Sales needs marketing campaign visibility |
| **Marketing** | Marketing, Sales | Campaign task coordination |
| **Finance** | Finance, Sales (fee-related), HR (payroll) | Fee follow-up, salary processing |
| **HR** | HR, All departments (people-related only) | Only non-sensitive people tasks |
| **Technology** | Technology, All (IT support tickets) | Cross-department support |
| **Administration** | Administration, All (facility-related) | Facility requests |
| **Communication** | Communication, All (announcements) | Cross-department announcements |
| **Collections** | Collections, Finance, Sales (outstanding) | PTP and recovery tasks |
| **Academic** | Academic, Sales (admission-related) | Enrollment coordination |

### Cross-Department Task Rules

| Rule | Description |
|------|-------------|
| **Default Restriction** | Departments cannot see each other's tasks by default |
| **Opt-In Sharing** | Tasks can be shared to specific departments via visibility setting |
| **Escalation Visibility** | Escalated tasks become visible to the receiving department |
| **Cross-Department Tasks** | Tasks with `visibility: "company"` are visible to all departments |
| **External Approvals** | Approval tasks are visible to approvers regardless of department |
| **Mention-Based Access** | Users mentioned in comments get temporary access to that task |

### Sensitive Department Markers

Some departments handle sensitive tasks that should never be visible cross-department:

| Department | Sensitive Categories | Default Visibility |
|-----------|---------------------|-------------------|
| **HR** | Disciplinary, Payroll, Performance, Termination | `private` or `department` |
| **Finance** | Audit, Budget Planning, Salary | `department` |
| **Legal** | Compliance, Disputes, Contracts | `private` |
| **Executive** | Strategy, M&A, Restructuring | `private` |

---

## 11. Future Portal Support

### External Portal Access

| Portal | Users | Access Scope | Permissions |
|--------|-------|-------------|-------------|
| **Employee Portal** | All employees | Tasks within their visibility scope | Full RBAC model |
| **Parent Portal** | Parents/guardians | Fee-related tasks, communication tasks | View only (assigned) |
| **Student Portal** | Enrolled students | Academic tasks, assignment tasks | View + Submit |
| **Vendor Portal** | External vendors | Procurement tasks, service tasks | View + Update assigned fields |
| **Customer Portal** | Clients/partners | Project tasks, support tickets | View + Comment |
| **External Collaborators** | Consultants, auditors | Invitation-based access | Configurable per-invitation |

### Portal Permission Mapping

For portals that are not part of the internal organization hierarchy, permissions are granted through:

1. **Direct invitation**: User is explicitly invited to a specific task
2. **Role-based entity linking**: Portal user is linked to a student/lead/vendor entity
3. **API key access**: External systems access tasks via scoped API keys
4. **Time-limited access**: Tasks can be shared with an expiry date

---

## 12. AI Considerations

### Permission-Aware AI

All AI features that interact with tasks must respect the security model:

| AI Feature | Data Access | Constraint |
|------------|-------------|------------|
| Task recommendation | User's visible tasks only | Never recommend restricted tasks |
| Smart sorting | User's visible tasks only | Privacy-preserving ranking |
| Due date prediction | User's visible tasks only | Aggregate trends, not individual data |
| Workload analysis | Team/department scope | Manager sees trends, not individual details |
| Privacy-aware search | User's visible tasks only | Search results filtered by permissions |
| Manager summaries | Team's visible tasks | Never expose cross-department data |
| Auto-assignment | Role appropriate scope | Respect department/team boundaries |
| Sentiment analysis | Task comments user can see | Anonymized for cross-department trends |

### AI Data Boundary

```
┌─────────────────────────────────────────┐
│            AI Data Boundary              │
│                                         │
│  User → AI sees only tasks where:       │
│    user.role == "super_admin" → ALL     │
│    user.role == "manager" → team tasks  │
│    user.role == "staff" → own tasks     │
│                                         │
│  AI training never uses:                │
│    - Private task content               │
│    - HR disciplinary tasks              │
│    - Salary/bonus information           │
│    - Personally identifiable student    │
│      information from tasks             │
└─────────────────────────────────────────┘
```

---

## 13. Implementation Strategy

### Phase 1: Visibility Field + Backend Filtering (Week 1)

**Effort:** 3–4 days  
**Risk:** Medium  
**Dependencies:** Schema migration

| Task | Files Affected | Description |
|------|---------------|-------------|
| Add `visibility` field to schema | `schema.ts` | Migration with default value |
| Add `sharedWithUserIds` field | `schema.ts` | For explicit sharing |
| Add indexes | `schema.ts` | Composite indexes for visibility queries |
| Update `listTasks` query | `tasks.ts` | Filter by user's visibility scope |
| Update `getTaskById` query | `tasks.ts` | Check visibility before returning |
| Update `getSalesPendingTasks` | `crmTasks.ts` | Filter lead tasks by visibility |
| Create visibility helper | `taskSecurity.ts` (new) | Reusable `canAccessTask` function |

### Phase 2: Mutation Permission Checks (Week 2)

**Effort:** 3–4 days  
**Risk:** High (can break task operations)  
**Dependencies:** Phase 1

| Task | Files Affected | Description |
|------|---------------|-------------|
| Add permission check to `createTask` | `tasks.ts` | Set default visibility based on role |
| Add permission check to `updateTask` | `tasks.ts` | Validate edit permission |
| Add permission check to `updateTaskStatus` | `tasks.ts` | Validate edit permission for status change |
| Add permission check to `deleteTask` | `tasks.ts` | Validate delete permission |
| Add permission check to `createLeadTask` | `crmTasks.ts` | Check lead ownership + task visibility |
| Add permission check to `updateLeadTaskStatus` | `crmTasks.ts` | Validate edit permission |
| Add permission check to `updateLeadTask` | `crmTasks.ts` | Validate edit permission |
| Add permission check to `deleteLeadTask` | `crmTasks.ts` | Validate delete permission |

### Phase 3: Audit Trail (Week 2–3)

**Effort:** 2–3 days  
**Risk:** Low  
**Dependencies:** Phase 1

| Task | Files Affected | Description |
|------|---------------|-------------|
| Create `taskAuditEvents` table | `schema.ts` | Audit schema |
| Create `createAuditEvent` helper | `crmAudit.ts` (new) | Reusable audit function |
| Add audit logging to task mutations | `tasks.ts` | Log every mutation |
| Add audit logging to unauthorized attempts | `tasks.ts` | Log 403 responses |
| Create audit retrieval view | New page or panel | Super admin audit viewer |

### Phase 4: Frontend Permission UI (Week 3)

**Effort:** 3–4 days  
**Risk:** Low  
**Dependencies:** Phase 1, Phase 2

| Task | Files Affected | Description |
|------|---------------|-------------|
| Add permission context hook | `useTaskPermissions.ts` (new) | Hook for permission checks |
| Update TaskCard draggable state | `TasksPage.tsx` | Disable drag for non-permitted tasks |
| Update TaskDetail edit controls | `TaskDetail.tsx` | Hide edit controls for read-only users |
| Add visibility selector to task creation | `TasksPage.tsx` | Visibility dropdown in create dialog |
| Add visibility badge to task cards | `TasksPage.tsx` | Show lock/users icon |
| Add shared users picker | `TaskDetail.tsx` | Multi-select for sharing |
| Add "View only" indicator | `TaskDetail.tsx` | Read-only mode badge |
| Update sort/filter for visibility | `TasksPage.tsx` | Filter by user's visible scope |

### Phase 5: Notification Integration (Week 3–4)

**Effort:** 2–3 days  
**Risk:** Low  
**Dependencies:** Phase 1, Phase 2

| Task | Files Affected | Description |
|------|---------------|-------------|
| Add task event triggers to notifications | `crmTasks.ts` / `tasks.ts` | Call notification creation on events |
| Create notification preferences table | `schema.ts` | Per-event notification toggles |
| Add due date reminder cron | `crons.ts` | Daily cron for due task reminders |
| Add overdue notification cron | `crons.ts` | Daily cron for overdue tasks |

### Phase 6: Advanced Permissions (Week 4)

**Effort:** 3–5 days  
**Risk:** Medium  
**Dependencies:** Phase 1, Phase 2

| Task | Files Affected | Description |
|------|---------------|-------------|
| Cross-department sharing rules | `taskSecurity.ts` | Department access matrix |
| Role-based default visibility | `taskSecurity.ts` | Auto-set visibility by creator role |
| Sensitive department markers | `schema.ts` | Department-level sensitivity flags |
| Escalation visibility | `taskSecurity.ts` | Escalated task auto-sharing |
| Temporary access tokens | `taskSecurity.ts` | Time-limited task access |

---

## 14. Dependencies

### Internal Dependencies

| Dependency | Module | Why Needed | Status |
|-----------|--------|-----------|--------|
| Organization Masters | `organization.ts` | Department/team/branch hierarchy for visibility rules | ✅ Existing |
| User Roles | `schema.ts` → `users.role` | Role-based permission levels (`super_admin`, `admin`, `manager`, `staff`) | ✅ Existing |
| User Scopes | `schema.ts` → `userScopes` | Per-user scope assignments (companies, departments, branches, teams) | ✅ Existing |
| Authentication | `auth.ts` | Identity verification for all API calls | ✅ Existing |
| Notification Engine | `crmHelpers.ts`, `notifications.ts` | Send task notifications to users | ✅ Existing |
| Communication Engine (DOC-09) | Future | Email/SMS task notifications | 🔄 Future |

### External Dependencies

| Dependency | Why Needed | Status |
|-----------|-----------|--------|
| Audit logging infrastructure | Immutable audit trail for task operations | 🆕 New (BACKLOG-001 Phase 3) |
| Permission cache (Redis/Memcache) | Performance for large organizations | 🔄 Future |
| Rate limiting middleware | Prevent abuse of task API | 🔄 Future |

---

## 15. Risks

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Privacy breach** due to misconfigured visibility | Medium | 🔴 Critical | Default to `private/team`; require explicit opt-in for broader visibility |
| **Data leakage** via query injection or index bypass | Low | 🔴 Critical | Backend validates visibility on every query; all filtering uses DB indexes |
| **Incorrect reporting** — reports show tasks user shouldn't see | Medium | 🟠 High | Reports use same `listTasks` visibility filter; separate permission layer |
| **Unauthorized updates** due to missing mutation check | Medium | 🔴 Critical | Every mutation has explicit permission check; no mutation bypasses validation |
| **Compliance issues** with educational data privacy (DPDP, FERPA) | Medium | 🔴 Critical | Sensitive task types are auto-restricted; audit trail for all access |
| **Performance degradation** from permission lookups | Medium | 🟡 Medium | Index-based filtering; cached permission context; avoid N+1 queries |
| **Backwards compatibility** — existing tasks need visibility migration | High | 🟡 Medium | Default existing tasks to `department` visibility; manual review prompt |
| **User confusion** when tasks disappear from view | High | 🟡 Medium | Clear UI indicators for scope; "Show less accessible" filter |
| **Manager resistance** when losing visibility into other teams | Medium | 🟡 Low | Training + documentation; opt-in cross-department sharing |
| **Race conditions** in permission checks during concurrent edits | Low | 🟡 Medium | Use Convex atomic operations; optimistic concurrency control |

### Risk Monitoring

| Check | Frequency | Owner |
|-------|-----------|-------|
| Audit log review for unauthorized access attempts | Daily | Security team |
| Permission matrix validation tests | Weekly | QA |
| Penetration testing of task API | Monthly | Security team |
| User feedback on visibility configuration | Bi-weekly | Product team |

---

## 16. Acceptance Criteria

### P0 — Must Have (Beta Blocker)

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-01 | Employees see **only their own tasks** by default | Log in as staff → task list shows only owned + assigned tasks |
| AC-02 | Employees **cannot see** tasks assigned to other employees | Attempt to view another user's task → 403 error or task not found |
| AC-03 | Employees **cannot edit** tasks they do not own | Attempt to update status on another's task → 403 error |
| AC-04 | Managers see only **tasks within their team/department** | Log in as manager → task list shows team tasks only |
| AC-05 | Backend **validates every action** — no frontend trust | Direct API call without permission → 403 error |
| AC-06 | Every task action is **audited** | Audit log exists for all task mutations |
| AC-07 | Super admins see **all tasks** | Log in as super_admin → all tasks visible |

### P1 — Should Have

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-08 | Task creation respects default visibility | Staff creates task → visible only to them; Manager creates → visible to team |
| AC-09 | Kanban drag-and-drop respects permissions | Staff cannot drag another's task; Manager can drag team tasks |
| AC-10 | Task visibility can be changed by owner | Owner changes `private` → `team` → team members can now see it |
| AC-11 | Users can be explicitly shared to a task | Share user → they can now see and comment |
| AC-12 | Unauthorized access attempts are logged | Attempt 403 action → audit log entry created |

### P2 — Nice to Have

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-13 | Task notifications respect visibility | Non-visible task changes don't trigger notifications |
| AC-14 | Cross-department sharing works | Share task with another department → department users can see it |
| AC-15 | Audit log viewer exists for super admins | Super admin can view all audit events by task/user |
| AC-16 | Export respects permissions | Exported task list contains only visible tasks |

---

## 17. Priority & Classification

### Priority

```
Priority:    🔴 P0 — Beta Blocker
Category:    Security
Module:      Task Management
Status:      Planned
Implementation: Pending (see Section 13)
```

### Classification

| Dimension | Value |
|-----------|-------|
| **Effort Estimate** | 15–22 person-days (6 phases) |
| **Risk Level** | High (security-critical) |
| **Dependencies** | Organization Masters, RBAC, Auth, Notifications |
| **Affected Users** | All authenticated users |
| **Affected Modules** | Task Management, CRM Tasks, Notifications, Reports |
| **Breaking Changes** | Yes — existing tasks need visibility migration |
| **Rollback Plan** | Revert schema migration + feature flag to disable visibility enforcement |
| **Feature Flag** | `taskRbacEnabled` — default `off` during rollout, `on` after validation |

### Migration Plan

1. Deploy schema changes with `visibility` field (default: `department`)
2. Run data migration to set `visibility` on all existing tasks
3. Enable backend permission checks (`taskRbacEnabled: true`)
4. Verify no unexpected access issues
5. Roll out frontend permission UI changes
6. Enable audit logging

---

## 18. Related Documents

### Reference Documents

| Document | Relation |
|----------|----------|
| **DOC-10 — Workflow, Tasks & Automation Engine Bible** | Core task management architecture |
| **DOC-13 — HR & Employee Lifecycle Engine Bible** | HR task privacy and employee data |
| **DOC-15 — Technology, IT Operations & SaaS Administration Engine Bible** | Security infrastructure, audit logging |
| **ARCH-04 — Master Entity Relationship Blueprint** | Entity relationships for user → department → task |
| **DOC-00 — EEOS Master Index & Documentation Map** | Overall EEOS architecture context |

### Future Documents

| Document | Purpose |
|----------|---------|
| **Security & Governance Bible** | Enterprise-wide security architecture (planned) |
| **Data Privacy & Compliance Bible** | DPDP Act, FERPA, GDPR compliance (planned) |
| **API Security Standards** | EEOS-wide API security guidelines (planned) |

### Codebase Files Referenced

| File | Purpose |
|------|---------|
| `src/convex/schema.ts` | Task table definition (no visibility field) |
| `src/convex/crmTasks.ts` | Lead task mutations (no permission checks) |
| `src/convex/tasks.ts` | General task mutations (no permission checks) |
| `src/pages/TasksPage.tsx` | Kanban board (no permission checks) |
| `src/pages/TaskDetail.tsx` | Task detail view (no permission checks) |
| `src/pages/AccessControl.tsx` | User scope management UI |
| `src/convex/auth.ts` | Authentication |
| `src/convex/authHelpers.ts` | Auth utilities |
| `src/convex/userManagement.ts` | User management |
| `src/convex/organization.ts` | Organization hierarchy |
| `src/hooks/use-auth.ts` | Auth hook |

---

*End of BACKLOG-001 — Enterprise Task Security & RBAC Architecture*
