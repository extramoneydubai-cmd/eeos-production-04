# DOC-19 — Security, Governance, Audit & Compliance Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Security, Governance, Audit & Compliance  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-09  
> **Predecessor:** ARCH-04 — Master Entity Relationship Blueprint, DOC-10 — Workflow Engine, DOC-15 — Technology Engine, DOC-17 — Reports & BI, DOC-18 — Enterprise AI, BACKLOG-001 — Task Security & RBAC  
> **Existing Infrastructure:** `authHelpers.ts` (login/logout/session with SHA-256), `auth.config.ts` (Convex Auth), `schema.ts` (users, sessions, userScopes tables), `userManagement.ts` (CRUD + scope management), `http.ts` (HTTP routing), `instrumentation.tsx` (error monitoring), `featureFlags.ts` (feature toggles), `AccessControl.tsx` (scope management UI), `ProtectedRoute` (route guard), `leadActivity` (entity activity timeline), `leadStageHistory` (stage change audit), `verification_requests` (verification engine), `approvalRequests` (approval engine)

---

## Table of Contents

1. [Security Vision](#1-security-vision)
2. [Security Architecture](#2-security-architecture)
3. [Identity Management](#3-identity-management)
4. [Authentication](#4-authentication)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Permission Model](#6-permission-model)
7. [Data Security](#7-data-security)
8. [Audit Engine](#8-audit-engine)
9. [Approval Governance](#9-approval-governance)
10. [Compliance](#10-compliance)
11. [Risk Management](#11-risk-management)
12. [Incident Management](#12-incident-management)
13. [Access Reviews](#13-access-reviews)
14. [Password & Credential Policy](#14-password--credential-policy)
15. [AI Governance](#15-ai-governance)
16. [Monitoring & Alerts](#16-monitoring--alerts)
17. [Business Continuity](#17-business-continuity)
18. [Cross Module Governance](#18-cross-module-governance)
19. [Reports](#19-reports)
20. [Implementation Roadmap](#20-implementation-roadmap)
21. [Golden Rules](#21-golden-rules)

---

## 1. Security Vision

### Purpose

The Security, Governance, Audit & Compliance Engine is the **trust layer** of EEOS. It governs every action across every module. Security is not a feature — it is a **platform-wide capability** that every interaction passes through.

### Core Philosophy

**Security by Design. Least Privilege. Zero Trust. Everything authenticated. Everything authorized. Everything audited. Everything traceable. Nothing assumed.**

### Guiding Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Security by Design** | Security is not added after implementation — it is designed into every entity, mutation, query, and UI component from inception |
| 2 | **Least Privilege** | Every user, role, and service has the minimum permissions required to perform their function — nothing more |
| 3 | **Defense in Depth** | Multiple layers of security: authentication → authorization → validation → audit → monitoring |
| 4 | **Zero Trust** | Never trust user input. Never trust the frontend. Always validate on the backend. Always re-authorize |
| 5 | **Never Trust the Frontend** | All permission checks are enforced on the backend (Convex mutations). Frontend UI is a convenience, not a security control |
| 6 | **Everything is Audited** | Every Create, Update, Delete, Login, Approval, Export, and AI action is logged with user, timestamp, before/after values, and source |
| 7 | **Backend Validation Always** | Convex validators (`v.*`) validate every input. Business rules are enforced in mutations, never assumed from the frontend |
| 8 | **Auditability Over Convenience** | When security and convenience conflict, security wins. Every exception is logged and requires approval |
| 9 | **Privacy by Default** | User data is private by default. Explicit sharing is required for cross-user visibility |
| 10 | **Separation of Duties** | No single person has end-to-end control over a sensitive process. Approvals, verifications, and payments require multiple actors |

### Existing Security Infrastructure (Codebase Audit)

| Component | Implementation | Status |
|-----------|---------------|--------|
| **Authentication** | Custom username/password with SHA-256 hashing + session tokens | ✅ Implemented |
| **Session Management** | `sessions` table with token, expiry (7 days), lastActiveAt | ✅ Implemented |
| **Role-Based Access** | 4 roles: super_admin, admin, manager, staff | ✅ Implemented |
| **User Scopes** | `userScopes` table — department/branch/team/vertical scoping | ✅ Implemented |
| **Route Protection** | `ProtectedRoute` component wrapping all app routes | ✅ Implemented |
| **Input Validation** | Convex `v.*` validators on all mutation arguments | ✅ Implemented |
| **Activity Audit** | `leadActivity` table for lead timeline, `leadStageHistory` for stage changes | ✅ Implemented |
| **Verification Engine** | `verification_requests`, `verification_rules`, `verification_decisions` | ✅ Implemented |
| **Approval Engine** | `approvalTemplates`, `approvalRequests`, `approvalRequestApprovers` | ✅ Implemented |
| **Feature Flags** | `featureFlags.ts` for feature toggles (collection, automation) | ✅ Implemented |
| **Error Monitoring** | `instrumentation.tsx` — global error boundary + Vly reporting | ✅ Implemented |
| **Password Reset** | `setPassword` mutation — admin can reset any user's password | ✅ Implemented |
| **User Disable** | `disableUser` / `enableUser` mutations | ✅ Implemented |
| **Scope Management UI** | `AccessControl.tsx` — edit department/team/branch/vertical scopes | ✅ Implemented |
| **Clone/Transfer Access** | `cloneUserAccess`, `transferUserAccess` mutations | ✅ Implemented |

### Security Gaps (From Codebase Audit)

| Gap | Severity | BACKLOG-001 Reference |
|-----|----------|----------------------|
| Tasks have no visibility field — all tasks visible to all users | 🔴 Critical | §1 |
| `listTasks` returns all tasks with no owner/department filter | 🔴 Critical | §1 |
| `updateTaskStatus` has no permission check | 🔴 Critical | §1 |
| Kanban drag-and-drop allows any user to move any task | 🔴 Critical | §1 |
| No centralized audit log table for all entities | 🟡 Medium | — |
| No rate limiting on API endpoints | 🟡 Medium | — |
| No MFA enforcement | 🟡 Medium | — |
| No session IP/location anomaly detection | 🟢 Low | — |
| No encryption at rest for sensitive fields | 🟡 Medium | — |
| No API key rotation policy enforced | 🟢 Low | — |

---

## 2. Security Architecture

### Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         USER                                       │
│  Web Browser │ Mobile App │ API Client │ External Service           │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Username/Pwd  │  │  Email OTP   │  │  SMS/WA OTP  │            │
│  │ (SHA-256 hash)│  │  (Convex)    │  │  (Future)    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                │                 │                      │
│         ▼                ▼                 ▼                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Session Management (sessions table)                        │   │
│  │  Token: UUID v4 │ Expiry: 7 days │ Refresh: sliding window │   │
│  └──────────────────────────┬─────────────────────────────────┘   │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AUTHORIZATION LAYER                           │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  RBAC Check → Role-based permission (super_admin → staff)   │   │
│  │  Scope Check → Department/Branch/Team/Entity-level scope    │   │
│  │  Field Check → Field-level access (PII masking, salary)     │   │
│  └──────────────────────────┬─────────────────────────────────┘   │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BUSINESS RULES LAYER                          │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Input Validation (Convex v.* validators)                    │   │
│  │  Business Rule Enforcement (stage transitions, amounts)      │   │
│  │  Duplicate Detection (leads, users)                          │   │
│  │  Rate Limiting (per-user, per-endpoint)                      │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AUDIT LAYER                                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Every Create → Log user, entity, values, timestamp          │   │
│  │  Every Update → Log user, entity, old values, new values    │   │
│  │  Every Delete → Log user, entity, deleted values            │   │
│  │  Every Login → Log user, IP, device, timestamp              │   │
│  │  Every Approval → Log user, decision, reason                │   │
│  │  Every AI Action → Log user, prompt, response, model, cost  │   │
│  │  Every Permission Change → Log admin, target, change type   │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      LOGGING & MONITORING LAYER                    │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Failed Login │  │ Permission   │  │ Unusual      │            │
│  │ Alert        │  │ Violation    │  │ Activity     │            │
│  │ (DOC-09)     │  │ Alert        │  │ Alert        │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### Security Flow: Request Lifecycle

```
User Request → [1] Authenticate → [2] Authorize → [3] Validate → [4] Execute → [5] Audit → [6] Log → [7] Respond

Step 1: AUTHENTICATE
  - Extract session token from request (Authorization header / cookie)
  - Lookup session in `sessions` table by token
  - Verify session not expired (check expiresAt)
  - Verify user not disabled (check isDisabled)
  - Update lastActiveAt
  → If any check fails → Return 401 Unauthorized

Step 2: AUTHORIZE
  - Check user.role against required role for the operation
  - Check userScopes for entity-level access (department, branch, team)
  - Check field-level permissions for sensitive data access
  → If any check fails → Return 403 Forbidden

Step 3: VALIDATE
  - Convex v.* validator checks all input fields
  - Business rule validation (custom validation logic)
  - Rate limit check (per-user, per-module)
  → If any check fails → Return 400 Bad Request

Step 4: EXECUTE
  - Perform the requested operation (create, update, delete)
  - Apply business rules during execution
  - Return success with result data

Step 5: AUDIT
  - Record audit entry with:
    - User ID, Username, Role
    - Action type, Entity type, Entity ID
    - Before state (for update/delete)
    - After state (for create/update)
    - Timestamp, Source IP, User Agent
  → Store in `auditLogs` table

Step 6: LOG (Monitoring)
  - If failed: increment failure counter, check threshold
  - If threshold exceeded: trigger alert via DOC-09
  - Log to monitoring service (Vly instrumentation)

Step 7: RESPOND
  - Return success response to client
  - Include rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset)
```

---

## 3. Identity Management

### Identity Types

| Identity Type | Description | Identifier | Auth Method |
|--------------|-------------|------------|-------------|
| **Employee** | Internal staff (counselors, managers, admins) | `users._id` | Username/Password + Session |
| **Student** | Enrolled student | Future `students._id` | Future Portal Auth |
| **Parent** | Parent/guardian of student | Future parent identity | Future Portal Auth |
| **Vendor** | External vendor/supplier | Future vendor identity | Future Vendor Portal |
| **Partner** | Channel partner (school, agency) | Future partner identity | Future Partner Portal |
| **API User** | Programmatic access via API key | API Key ID | API Key (Bearer token) |
| **Service Account** | Internal system-to-system communication | Service account ID | Service token |
| **Anonymous** | Unauthenticated visitor (public forms) | — | No auth |
| **Guest** | Temporary external collaborator | Guest ID | Time-limited token |

### Employee Identity Lifecycle

```
Request → Creation → Activation → Active → Suspension → Reactivation → Deactivation → Deletion (GDPR)
         (Admin)    (Set pwd)              (Disabled)   (Enabled)     (Disabled)    (Anonymized)
```

### Identity Store

The `users` table is the **single source of truth** for all employee identities:

| Field | Type | Security Relevance |
|-------|------|-------------------|
| `_id` | Auto-generated | Primary identity key — used across all references |
| `name` | Optional(string) | Display name |
| `email` | Optional(string) | Contact email, used for notifications |
| `username` | Optional(string) | Login identifier — must be unique |
| `passwordHash` | Optional(string) | SHA-256 password hash — NEVER exposed in queries |
| `role` | Optional(roleValidator) | Platform role — primary authorization key |
| `isDisabled` | Optional(boolean) | Account active/inactive status |
| `designationId` | Optional(id) | Organizational designation |
| `departmentId` | Optional(id) | Primary department |
| `companyId` | Optional(id) | Primary company |
| `branchId` | Optional(id) | Primary branch |
| `teamIds` | Optional(array) | Team memberships |
| `lastLoginAt` | Optional(number) | Last successful login timestamp |

### Session Management

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | UUID v4 session token |
| `userId` | id("users") | Authenticated user |
| `expiresAt` | number | Token expiry (7 days from creation) |
| `createdAt` | number | Session creation timestamp |
| `lastActiveAt` | number | Last activity timestamp (sliding window refresh) |
| `ipAddress` | optional(string) | Client IP at session creation |
| `userAgent` | optional(string) | Browser/device user agent |

**Session Rules:**
- Default expiry: 7 days from creation
- Sliding window: lastActiveAt is updated on every request
- Max concurrent sessions: unlimited (configurable per role)
- Session invalidation: on password change, role change, disable, or explicit logout
- Admin can terminate any user's sessions

---

## 4. Authentication

### Current Implementation

The existing auth system uses:
- **Username + Password** login with SHA-256 hashing (`crypto.subtle.digest`)
- **Session tokens** (UUID v4) stored in `sessions` table
- **7-day token expiry** with sliding window refresh
- **Disabled account check** on login
- **lastLoginAt** tracking

### Authentication Methods (Current + Future)

| Method | Status | Use Case | Security Level |
|--------|--------|----------|---------------|
| **Username + Password** | ✅ Implemented | Employee login | Medium |
| **Email OTP** | 🔶 Available (Convex Auth) | Passwordless login | Medium |
| **SMS OTP** | 🔄 Future | Mobile login | Medium |
| **WhatsApp OTP** | 🔄 Future | WhatsApp-based login | Medium |
| **Google Login** | 🔄 Future | SSO / Consumer login | High |
| **Microsoft Login** | 🔄 Future | Enterprise SSO | High |
| **SSO (SAML/OIDC)** | 🔄 Future | Enterprise identity provider | High |
| **Biometric** | 🔄 Future | Fingerprint/face (mobile) | High |

### Authentication Flow (Current)

```
Login Request: { username, password }

  1. Lookup user by username in `users` table
  2. If not found → Return "Invalid username or password"
  3. If isDisabled → Return "Account is disabled"
  4. If no passwordHash → Return "Password not set"
  5. Hash password with SHA-256
  6. Compare hash with stored passwordHash
  7. If mismatch → Return "Invalid username or password"
  8. Generate UUID v4 session token
  9. Insert session record (userId, token, expiresAt, createdAt, lastActiveAt)
  10. Update lastLoginAt on user
  11. Return { token, userId, expiresAt, user }
```

### Authentication Flow (Enhanced — Future)

```
Login Request: { username, password }

  1. RATE LIMIT CHECK: Has this IP tried > 5 times in 5 minutes?
     → Yes: Return "Too many attempts. Try again in {minutes} minutes"
     → No: Continue
  
  2. LOOKUP: Find user by username
     → Not found: Log failed attempt, return generic error
  
  3. DISABLE CHECK: is user disabled?
     → Yes: Log failed attempt, return "Account is disabled"
  
  4. PASSWORD CHECK: SHA-256 hash comparison
     → Failed: Log failed attempt with IP, increment counter
       → If 3 failed attempts from new IP: Trigger "unusual login" alert (DOC-09)
       → If 5 failed attempts total: Temporary lockout (15 min)
  
  5. MFA CHECK (if enabled):
     → Send OTP to registered email/phone
     → Wait for OTP verification before issuing session token
  
  6. SESSION CREATION:
     → Record geolocation from IP (future)
     → Record device fingerprint (future)
     → Create session with token, IP, userAgent
  
  7. SUCCESS: Return token + user data
```

### Password Storage

```typescript
// Current implementation (in authHelpers.ts)
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

**Current:** SHA-256 (adequate for educational ERP in non-public-facing contexts)  
**Future Enhancement:** bcrypt or argon2 for password hashing with salt

### Session Validation (Current)

```typescript
// In authHelpers.ts
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db.query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user || user.isDisabled) return null;
    return { /* user data */ };
  },
});
```

---

## 5. Role-Based Access Control (RBAC)

### Current RBAC Implementation

**4 Platform Roles** defined in `schema.ts`:

```typescript
export const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("manager"),
  v.literal("staff"),
);
```

### Role Hierarchy

```text
super_admin ─── System-wide access, all tenants, all data
    │
admin ───────── Organization-wide administration
    │
manager ─────── Department/Team-level management
    │
staff ───────── Operational / individual access
```

### Role Definitions

| Role | Scope | Typical Assignee | Description |
|------|-------|-----------------|-------------|
| **super_admin** | System-wide | CEO, CTO | Full system access. Can manage all modules, users, settings, and configurations. Access to all organizations (multi-tenant) |
| **admin** | Organization-wide | Department heads, Branch managers | Organization-wide admin access. Can manage users, create tasks, access most modules, manage master data |
| **manager** | Department/Team | Team leads, Senior counselors | Department-level management. Can manage team tasks, approve requests, view dashboards, manage assigned leads |
| **staff** | Individual | Counselors, Faculty, Support | Basic operational access. Can view assigned tasks, manage assigned leads, participate in discussions, update own profile |

### User Scopes (Granular Access Control)

In addition to platform roles, `userScopes` provides **entity-level** access control:

| Scope Field | Type | Description |
|-------------|------|-------------|
| `companyIds` | optional(id("companies")[]) | Allowed companies |
| `departmentIds` | optional(id("departments")[]) | Allowed departments |
| `branchIds` | optional(id("branches")[]) | Allowed branches |
| `teamIds` | optional(id("teams")[]) | Allowed teams |
| `verticalIds` | optional(id("verticals")[]) | Allowed verticals |
| `canAccessDashboard` | optional(boolean) | Dashboard access |
| `canAccessCrm` | optional(boolean) | CRM access |

**Scope Resolution Rule:**
- If a scope field is empty/undefined → Access to **all** entities of that type
- If a scope field has values → Access is **restricted** to only those entities
- The most restrictive scope wins (intersection of all scopes)

### Permission Enforcement Pattern

```typescript
// Template for backend permission checking
async function checkPermission(
  ctx: QueryCtx,
  userId: string,
  requiredRole: string,
  requiredScope?: { type: string; id: string }
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user || user.isDisabled) return false;

  // Role hierarchy check
  const roleHierarchy = ["staff", "manager", "admin", "super_admin"];
  const userLevel = roleHierarchy.indexOf(user.role || "staff");
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  if (userLevel < requiredLevel) return false;

  // Scope check (if entity-level restriction)
  if (requiredScope) {
    const scopes = await ctx.db.query("userScopes")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const scope = scopes[0];
    if (scope) {
      // Check if user's scopes include this entity
      // ... scope-specific validation
    }
  }

  return true;
}
```

### Cross-Reference: BACKLOG-001

BACKLOG-001 defines the **Task Security & RBAC Architecture** with:

| Component | BACKLOG-001 Reference |
|-----------|----------------------|
| Task Visibility Model (7 levels) | §3 |
| Permission Matrix (14 permissions × 6 roles) | §4 |
| Task Ownership (7 roles) | §5 |
| Kanban Permission Model | §6 |
| API Security Pattern | §7 |
| Audit Trail Schema | §8 |
| Cross-Department Rules | §10 |
| Implementation Strategy (6 phases) | §13 |

All task-level RBAC defined in BACKLOG-001 is adopted as the standard for task permission governance.

---

## 6. Permission Model

### Permission Hierarchy

```text
ORGANIZATION LEVEL
  Company A                     Company B
      │                             │
BRANCH LEVEL                        │
  Branch NP  Branch OP          Branch KL
      │         │                    │
DEPARTMENT LEVEL                    │
  Sales  HR  Tech  Finance      Sales
      │         │                    │
TEAM LEVEL                          │
  Team A  Team B  Team C         Team D
      │         │                    │
EMPLOYEE LEVEL                      │
  Employee X  Employee Y         Employee Z
```

### Permission Inheritance

```text
Organization-level permission → Inherited by all Companies
  Company-level permission → Inherited by all Branches
    Branch-level permission → Inherited by all Departments
      Department-level permission → Inherited by all Teams
        Team-level permission → Inherited by all Employees
```

### Granularity Levels

| Level | Description | Example |
|-------|-------------|---------|
| **Module** | Access to entire module | `canAccessCRM`, `canAccessFinance` |
| **Entity** | CRUD on a specific entity type | `lead:create`, `lead:read`, `lead:update`, `lead:delete` |
| **Record** | Access to specific records | `lead:read:123` (only lead ID 123) |
| **Field** | Access to specific fields | `lead:field:read:phone` (can read phone field) |
| **Action** | Execute specific action | `approve:discount`, `verify:payment` |

### Permission Naming Standards (Appendix B)

```
{module}:{entity}:{action}:{scope}
```

| Component | Values | Example |
|-----------|--------|---------|
| `module` | `crm`, `finance`, `hr`, `marketing`, `tech`, `admin`, `reports`, `ai` | `crm` |
| `entity` | `lead`, `task`, `payment`, `user`, `report` | `lead` |
| `action` | `create`, `read`, `update`, `delete`, `approve`, `verify`, `export` | `update` |
| `scope` | `own`, `team`, `department`, `branch`, `organization`, `system` | `department` |

**Examples:**
- `crm:lead:read:own` — Read own leads
- `crm:lead:update:team` — Update team's leads
- `finance:payment:verify:branch` — Verify payments in own branch
- `crm:lead:delete:organization` — Delete any lead in organization

### Backend Permission Enforcement (Current Pattern)

```typescript
// Example: Lead update mutation with permission check
export const updateLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    // ... other fields
  },
  handler: async (ctx, args) => {
    // 1. Get current user (implicit from session)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 2. Get user record
    const user = await ctx.db.query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user || user.isDisabled) throw new Error("Unauthorized");

    // 3. Get the lead
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    // 4. Permission check
    const isOwner = lead.ownerId === user._id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const isManager = user.role === "manager";

    if (!isOwner && !isAdmin && !isManager) {
      throw new Error("You don't have permission to update this lead");
    }

    // 5. Execute + Audit
    // ... update logic
    
    // 6. Log activity
    await ctx.db.insert("leadActivity", {
      leadId: args.leadId,
      action: "lead_updated",
      description: "Lead details updated",
      userId: user._id,
      createdAt: Date.now(),
    });
  },
});
```

### Permission Denied Response Standards

| Scenario | HTTP Code | Error Message | Frontend Behavior |
|----------|-----------|---------------|-------------------|
| Not authenticated | 401 | "Authentication required" | Redirect to login |
| No session / expired | 401 | "Session expired. Please login again" | Redirect to login |
| Insufficient role | 403 | "You don't have permission to perform this action" | Disable UI element |
| Insufficient scope | 403 | "You don't have access to this {entity}" | Show "Access denied" |
| Resource not found (hide) | 404 | "Resource not found" | Show "Not found" (don't reveal existence) |

---

## 7. Data Security

### Data Classification

| Classification | Definition | Examples | Security Requirements |
|---------------|------------|----------|----------------------|
| **Public** | Non-sensitive, intended for public consumption | Company name, program names, branch addresses | No restrictions |
| **Internal** | Internal organizational data | Lead stages, task status, department names | Authentication required |
| **Confidential** | Sensitive business data | Lead PII, student records, financial transactions | Auth + RBAC + Audit |
| **Restricted** | Highly sensitive, legally protected | Salary data, HR records, bank details, PAN/Aadhaar | Auth + RBAC + Encryption + Audit + Masking |
| **Regulated** | Subject to regulatory compliance | Student data (FERPA-style), health records | Auth + RBAC + Encryption + Audit + Consent + Retention |

### Sensitive Data Fields (Current Schema)

| Table | Sensitive Fields | Classification | Current Protection |
|-------|-----------------|---------------|-------------------|
| `users` | `passwordHash` | Restricted | SHA-256 hashed (1-way) |
| `users` | `phone` | Confidential | No encryption |
| `leadMaster` | `phone`, `email` | Confidential | No encryption |
| `leadMaster` | `whatsappUsername` | Restricted | No encryption — needs masking |
| `leadMaster` | `whatsappPin` | Restricted | No encryption — TBD |
| `leadPayments` | `reference`, `receiptUrl` | Confidential | No encryption |
| `payment_pdcs` | `chequeNumber` | Confidential | No encryption |

### Data Masking Rules

| Field Type | Masking Rule | Example |
|------------|-------------|---------|
| **Phone** | Show last 4 digits only | `+91 XXXXXXXX90` |
| **Email** | Show first 2 chars + domain | `ra****@gmail.com` |
| **PAN** | Show last 4 characters | `XXXXX1234` |
| **Aadhaar** | Show last 4 digits only | `XXXX XXXX 1234` |
| **Bank Account** | Show last 4 digits | `XXXXXXXXXX1234` |
| **Cheque Number** | Show last 4 digits | `XXXX5678` |
| **Password Hash** | Never expose to frontend | Only comparison, never returned |

### Data Masking Implementation (Future)

```typescript
function maskField(value: string, type: "phone" | "email" | "pan" | "aadhaar" | "bank"): string {
  switch (type) {
    case "phone":
      // +91 9876543210 → +91 XXXXXX3210
      return value.length > 6 
        ? value.slice(0, -4).replace(/\d/g, "X") + value.slice(-4)
        : value;
    case "email":
      // rajesh@gmail.com → ra***@gmail.com
      const [local, domain] = value.split("@");
      return local.slice(0, 2) + "***@" + domain;
    case "pan":
      // ABCDE1234F → XXXXX1234F
      return "X".repeat(5) + value.slice(-5);
    case "aadhaar":
      // 1234 5678 9012 → XXXX XXXX 9012
      return "XXXX XXXX " + value.slice(-4);
    case "bank":
      // 123456789012 → XXXXXXXX9012
      return "X".repeat(value.length - 4) + value.slice(-4);
  }
}
```

### Encryption Strategy

| Data State | Current | Future |
|------------|---------|--------|
| **At Rest** | No application-level encryption (Convex platform handles disk encryption) | Field-level encryption for restricted fields using Convex encryption |
| **In Transit** | TLS 1.3 (HTTPS) — handled by Convex/Vercel | TLS 1.3 — maintain |
| **In Use** | No masking for sensitive fields | PII masking for unauthorized roles |

---

## 8. Audit Engine

### Current Audit Infrastructure

| Audit Type | Table | Entity | Events Tracked |
|------------|-------|--------|---------------|
| **Activity Timeline** | `leadActivity` | Lead | Actions: `lead_created`, `lead_updated`, `converted`, `lost`, `reopened`, `assigned` |
| **Stage History** | `leadStageHistory` | Lead Stage | From stage → To stage, changed by, note |
| **Assignment History** | `leadAssignments` | Lead | Assignment transfers with reasons |
| **Approval Decisions** | `leadApprovalDecisions` | Approvals | Approved/rejected/returned with comments |
| **Verification Decisions** | `verification_decisions` | Verifications | Verified/rejected/returned with comments |
| **Payment Log** | `leadPayments` | Payments | Amount, mode, status, verifier |

### Proposed Centralized Audit Log

```typescript
auditLogs: defineTable({
  userId: v.id("users"),              // Who performed the action
  userRole: v.string(),               // Role at time of action
  actionType: v.string(),             // "create" | "update" | "delete" | "login" | "approve" | "reject" | "export" | "ai" | "permission_change"
  entityType: v.string(),             // "user" | "lead" | "task" | "payment" | "approval" | ...
  entityId: v.string(),               // ID of the affected entity
  before: v.optional(v.string()),     // JSON string of state before change (for update/delete)
  after: v.optional(v.string()),      // JSON string of state after change (for create/update)
  description: v.string(),            // Human-readable description
  source: v.string(),                 // "web_app" | "mobile" | "api" | "system" | "ai_agent"
  ipAddress: v.optional(v.string()),  // Client IP
  userAgent: v.optional(v.string()),  // Browser/device info
  sessionId: v.optional(v.string()),  // Session token hash
  correlationId: v.optional(v.string()), // For linking related events
  createdAt: v.number(),
})
  .index("userId", ["userId"])
  .index("entityType", ["entityType"])
  .index("entityType_entityId", ["entityType", "entityId"])
  .index("actionType", ["actionType"])
  .index("createdAt", ["createdAt"])
  .index("entityType_createdAt", ["entityType", "createdAt"]);
```

### Audit Event Catalog (Appendix C)

| Event | Entity | Captures | Retention |
|-------|--------|----------|-----------|
| **user.login** | User | Username, success/fail, IP, userAgent | 12 months |
| **user.logout** | User | Username | 12 months |
| **user.created** | User | Admin who created, new user data | Permanent |
| **user.updated** | User | Changed fields (old → new) | Permanent |
| **user.disabled** | User | Admin who disabled | Permanent |
| **user.enabled** | User | Admin who enabled | Permanent |
| **user.role_changed** | User | Old role → New role, changed by | Permanent |
| **user.permission_scope_updated** | User | Old scopes → New scopes | Permanent |
| **user.password_reset** | User | Admin who reset | 12 months |
| **lead.created** | Lead | Full lead data, source, created by | Permanent |
| **lead.updated** | Lead | Changed fields (stage, priority, owner) | Permanent |
| **lead.assigned** | Lead | From → To owner, assigned by | Permanent |
| **lead.converted** | Lead | Conversion details | Permanent |
| **lead.lost** | Lead | Lost reason, lost by | Permanent |
| **lead.merged** | Lead | Parent → Child IDs | Permanent |
| **task.created** | Task | Full task data | Permanent |
| **task.updated** | Task | Changed fields (status, assignee, priority) | Permanent |
| **task.completed** | Task | Completed by, completion note | Permanent |
| **payment.created** | Payment | Amount, mode, status, entered by | 7 years |
| **payment.verified** | Payment | Verifier, verification timestamp | 7 years |
| **payment.rejected** | Payment | Rejection reason, rejected by | 7 years |
| **discount.approved** | Discount | Approver, amount, type | Permanent |
| **discount.rejected** | Discount | Rejector, reason | Permanent |
| **approval.decision** | Approval | Approver, decision, comment | Permanent |
| **approval.escalated** | Approval | Escalated from → to | Permanent |
| **export.executed** | — | Exported data scope, format | 6 months |
| **ai.interaction** | AI | User, prompt type, model, cost | 12 months |
| **ai.recommendation** | AI | Recommendation, accepted/rejected | 12 months |
| **feature_flag_changed** | System | Flag name, old value → new value | Permanent |
| **system.config_changed** | System | Config key, old → new | Permanent |

### Audit Log Retention Policy

| Category | Retention | Deletion Method |
|----------|-----------|-----------------|
| **Entity CRUD** | Permanent | Never deleted |
| **Authentication** | 12 months | Auto-purge after 12 months |
| **Financial** | 7 years (statutory) | Auto-purge after 7 years |
| **AI Interactions** | 12 months | Auto-purge after 12 months |
| **Exports** | 6 months | Auto-purge after 6 months |
| **Session Logs** | 90 days after session expiry | Auto-purge after 90 days |

---

## 9. Approval Governance

### Current Approval Infrastructure

| Component | Table | Purpose | Mode |
|-----------|-------|---------|------|
| **Approval Templates** | `approvalTemplates` | Define approval flow structure | Single, Sequential, Parallel, Hierarchy |
| **Approval Requests** | `approvalRequests` | Request instance | Manual, Sequential, Parallel, Hierarchy |
| **Approval Approvers** | `approvalRequestApprovers` | Per-phase approver decisions | Per-phase config |
| **Lead Approvals** | `leadApprovals` | Lead-specific discount/waiver approvals | Any one, All, Sequential, Parallel |
| **Lead Approval Decisions** | `leadApprovalDecisions` | Per-approver decisions | N/A |

### Approval Modes

| Mode | Description | Use Case | Example |
|------|-------------|----------|---------|
| **Single** | One approver decides | Routine approvals | Discount < ₹5,000 |
| **Any One** | Any one of multiple approvers | Flexible delegation | Team lead approval |
| **All Required** | All listed approvers must approve | High-risk changes | Scholarship > ₹50,000 |
| **Sequential** | Phased approval chain | Escalating authority | Discount → Manager → Director |
| **Parallel** | Multiple approvers simultaneously | Collaborative decisions | Multi-department budget |
| **Hierarchy** | Auto-route via org hierarchy | Manager → Dept head → Director | Leave > 5 days |

### Approval Thresholds (Proposed)

| Approval Type | Amount | Required Approvers | Mode |
|---------------|--------|-------------------|------|
| **Discount** | < ₹5,000 | Staff's manager | Single |
| **Discount** | ₹5,000 – ₹25,000 | Department head | Single |
| **Discount** | ₹25,000 – ₹1,00,000 | Department head + Director | Sequential |
| **Discount** | > ₹1,00,000 | CEO | Single |
| **Waiver** | Any amount | Director + CEO | Sequential |
| **Scholarship** | < ₹10,000 | Manager | Single |
| **Scholarship** | > ₹10,000 | Scholarship committee | Parallel |
| **Payment Verification** | < ₹50,000 | Any verifier | Any One |
| **Payment Verification** | > ₹50,000 | All assigned verifiers | All Required |
| **User Creation** | Any | Admin | Single |
| **User Role Change** | Any | Super Admin | Single |

### Escalation Rules

| Scenario | Escalation Path | Timeout |
|----------|----------------|---------|
| Approver not responding | Escalate to approver's manager | 48 hours |
| Approver on leave | Route to fallback approver | Immediate (auto) |
| Urgent approval | Push notification + SMS to all approvers | 4 hours |
| System auto-approve | Only for pre-approved templates | N/A |

### Override Rules

| Override | Authority | Required Reason | Audit |
|----------|-----------|-----------------|-------|
| Force approve | Super Admin | Mandatory (text required) | Logged with high severity |
| Force reject | Super Admin | Mandatory (text required) | Logged with high severity |
| Bypass approval chain | Admin + Super Admin | Mandatory | Logged |
| Modify approved request | Admin + Super Admin | Mandatory + re-approval | Logged |

---

## 10. Compliance

### Compliance Framework

| Area | Regulation/Standard | Status | Target |
|------|-------------------|--------|--------|
| **Data Privacy** | GDPR-style (future) | 🔶 Not implemented | Phase 4 |
| **Education Data** | FERPA-style student data protection | 🔶 Not implemented | Phase 4 |
| **Financial Records** | Income Tax Act retention (7 years) | ✅ Partially met | Phase 3 |
| **Information Security** | ISO 27001 | 🔶 Not implemented | Phase 5 |
| **Security Controls** | SOC 2 | 🔶 Not implemented | Phase 5 |
| **Accessibility** | WCAG 2.1 AA | 🔶 Partial | Phase 4 |

### Data Retention Schedule

| Data Category | Retention Period | Action After Period | Legal Basis |
|---------------|-----------------|--------------------|-------------|
| **Active leads** | Until status change | N/A (active) | Business necessity |
| **Converted leads** | 7 years after last interaction | Anonymize | Tax/legal |
| **Lost leads** | 2 years | Anonymize | Business |
| **Payment records** | 7 years | Archive + delete PII | Tax law |
| **Student records** | 10 years after graduation | Archive | Education regulations |
| **Employee records** | 3 years after exit | Anonymize | Labor law |
| **Audit logs** | Per category (see §8) | Purge | Varies |
| **Session data** | 90 days after expiry | Delete | Security |
| **Communication logs** | 2 years | Anonymize | Business |

### Consent Management

| Consent Type | Collected | Stored | Withdrawable |
|-------------|-----------|--------|-------------|
| **Communication consent** | At lead creation | `leadMaster` — implicit | Future explicit consent |
| **WhatsApp opt-in** | At message send | `leadWhatsAppMessages` | Via STOP keyword |
| **Data processing consent** | Not yet implemented | Future `consentLogs` table | Future |
| **Parent consent (minor)** | Not yet implemented | Future | Future |

### Record Management

| Record Type | Verification Required | Storage | Access Control |
|-------------|---------------------|---------|---------------|
| **Payment Proof** | Yes (via `verification_requests`) | URL in `leadPayments.receiptUrl` | Confidiential |
| **ID Documents** | Yes (via admission verification) | `leadDocuments` URL | Restricted |
| **Approval Records** | Yes (via `approvalRequestApprovers`) | `approvalRequests` + decisions | Internal |
| **Communication History** | No | `leadWhatsAppMessages`, `messages` | Confidential |

---

## 11. Risk Management

### Risk Register

| # | Risk Category | Risk Description | Probability | Impact | Score | Mitigation |
|---|--------------|-----------------|-------------|--------|-------|------------|
| R1 | **Operational** | Unauthorized task modification | High | Medium | 16 | BACKLOG-001 RBAC implementation |
| R2 | **Security** | Brute force login attack | Medium | High | 15 | Rate limiting, lockout, MFA |
| R3 | **Security** | Session hijacking | Low | High | 10 | HTTPS-only, session IP binding |
| R4 | **Financial** | Unauthorized discount/waiver approval | Low | Critical | 12 | Multi-level approval, audit trail |
| R5 | **Technology** | API key exposure in source code | Medium | Critical | 18 | Secrets management, pre-commit hooks |
| R6 | **Operational** | Data corruption from bulk operations | Low | Critical | 10 | Confirmation dialogs, undo capability |
| R7 | **Compliance** | PII data retention beyond legal limits | Medium | High | 15 | Auto-purge, retention policies |
| R8 | **Academic** | Unauthorized grade/exam modification | Low | High | 8 | Multi-level approval, audit |
| R9 | **Vendor** | Third-party service data breach | Low | Critical | 10 | Vendor assessment, data minimization |
| R10 | **AI** | AI exposes sensitive data in response | Medium | Critical | 18 | Permission-aware AI, PII masking, audit |
| R11 | **Security** | Insider data export (bulk) | Medium | High | 15 | Export limits, anomaly detection |
| R12 | **Technology** | Session management DoS | Low | Medium | 6 | Rate limiting per IP |

### Risk Scoring Matrix

```text
Probability: 1 (Rare) → 5 (Almost Certain)
Impact:      1 (Negligible) → 5 (Critical)
Score: Probability × Impact (Max: 25)

Thresholds:
  ≤ 5:  🟢 Low — Accept
  6-10: 🟡 Medium — Monitor
  11-15: 🟠 High — Mitigate
  16-25: 🔴 Critical — Immediate action required
```

### Risk Mitigation Status

| Risk | Score | Status | Owner | Target Date |
|------|-------|--------|-------|-------------|
| R1 — Unauthorized task modification | 16 | 🔴 Backlog | Security | Phase 1 (via BACKLOG-001) |
| R5 — API key exposure | 18 | 🔴 Active | CTO | Phase 1 |
| R10 — AI data exposure | 18 | 🟠 Planned | AI Team | Phase 4 |
| R7 — PII retention | 15 | 🟠 Planned | Legal | Phase 3 |
| R2 — Brute force | 15 | 🟠 Planned | Security | Phase 2 |
| R11 — Insider export | 15 | 🟠 Planned | Security | Phase 2 |
| R3 — Session hijacking | 10 | 🟡 Monitor | Security | Phase 3 |

---

## 12. Incident Management

### Incident Types

| Type | Severity | Examples | SLA |
|------|----------|---------|-----|
| **Security Incident** | Critical | Data breach, unauthorized access, account compromise | 1 hour response |
| **Data Leak** | High | PII exposed, sensitive data visible to wrong user | 2 hours response |
| **Unauthorized Access** | High | User accessing data outside scope | 4 hours response |
| **Fraud** | Critical | Fake payments, identity theft, fake approvals | 1 hour response |
| **Suspicious Activity** | Medium | Unusual login patterns, bulk data access | 8 hours response |
| **Policy Violation** | Medium | Employee sharing credentials, bypassing approvals | 24 hours response |

### Incident Response Flow

```
Incident Detected (automated alert or manual report)
      │
      ├── Auto-classify severity (Critical/High/Medium/Low)
      ├── Create incident record
      ├── Assign to security team
      │
      ▼
Initial Assessment (within SLA)
      │
      ├── Confirm incident validity
      ├── Determine scope (who/what affected)
      ├── Immediate containment (disable account, revoke access)
      └── Escalate if needed
      │
      ▼
Investigation
      │
      ├── Gather evidence (audit logs, session logs, access logs)
      ├── Interview involved parties
      ├── Root cause analysis
      └── Document timeline
      │
      ▼
Resolution
      │
      ├── Fix vulnerability or close gap
      ├── Restore affected data (from backup)
      ├── Notify affected parties
      └── Update security controls
      │
      ▼
Post-Incident
      │
      ├── Incident report generated
      ├── Lessons learned document
      ├── Security controls updated
      └── Team debrief
```

### Incident Record (Proposed)

```typescript
securityIncidents: defineTable({
  incidentId: v.string(),          // "INC-2026-0001"
  type: v.string(),                // "security_breach" | "data_leak" | "unauthorized_access" | "fraud" | "suspicious_activity"
  severity: v.string(),            // "critical" | "high" | "medium" | "low"
  status: v.string(),              // "open" | "investigating" | "contained" | "resolved" | "closed"
  description: v.string(),
  discoveredBy: v.id("users"),
  discoveredAt: v.number(),
  affectedUsers: v.optional(v.array(v.id("users"))),
  affectedData: v.optional(v.string()),
  containmentActions: v.optional(v.string()),
  rootCause: v.optional(v.string()),
  resolution: v.optional(v.string()),
  lessonsLearned: v.optional(v.string()),
  closedBy: v.optional(v.id("users")),
  closedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("status", ["status"])
  .index("severity", ["severity"])
  .index("type", ["type"])
  .index("createdAt", ["createdAt"]);
```

---

## 13. Access Reviews

### Periodic Review Schedule

| Review Type | Frequency | Owner | Scope |
|-------------|-----------|-------|-------|
| **User Access Review** | Quarterly | HR + IT | All active users — verify role accuracy |
| **Scope Review** | Quarterly | Department heads | User scopes match current responsibilities |
| **Inactive User Review** | Monthly | IT | Users with no login in 90+ days |
| **Dormant Account Review** | Monthly | IT | Disabled accounts older than 6 months |
| **Privilege Escalation Review** | Quarterly | Security | Users with admin/super_admin roles |
| **API Key Review** | Monthly | IT | Active API keys, last used, rotation |
| **Session Review** | Weekly (auto) | System | Anomalous session patterns |

### Access Review Process

```
1. System generates access review report
      │
      ├── All users with roles and scopes
      ├── Last login date per user
      ├── Permission changes in review period
      │
2. Review assigned to department heads
      │
      ├── Verify each user's role is appropriate
      ├── Verify scopes match responsibilities
      ├── Mark users for disable (ex-employees, role changes)
      └── Sign off digitally
      │
3. IT executes changes
      │
      ├── Disable marked users
      ├── Update roles/scopes as approved
      └── Log all changes to audit
      │
4. Report generated
      │
      ├── Users reviewed
      ├── Changes made
      ├── Exceptions noted
      └── Next review scheduled
```

### Inactive User Handling

| Inactive Duration | Action | Notification |
|-------------------|--------|-------------|
| 30 days | Warning email to user | "You haven't logged in for 30 days" |
| 60 days | Warning to user + manager | "User hasn't logged in for 60 days" |
| 90 days | Account auto-disabled | "Account disabled due to inactivity" |
| 6 months (disabled) | Account flagged for deletion | "Account pending deletion" |
| 12 months (disabled) | Account anonymized (GDPR-style) | N/A |

---

## 14. Password & Credential Policy

### Password Policy

| Requirement | Current | Target |
|-------------|---------|--------|
| Minimum Length | None | 8 characters |
| Mixed Case | None | Required |
| Numbers | None | Required |
| Special Characters | None | Recommended |
| Max Age | None | 90 days |
| Password History | None | Last 5 passwords remembered |
| Account Lockout | None | After 5 failed attempts (15 min lockout) |

### MFA Policy

| Scenario | MFA Required | Method |
|----------|-------------|--------|
| Login from new device/IP | Future | Email OTP |
| Admin/super_admin login | Future | Email OTP |
| Sensitive action (discount > ₹25K) | Future | Email OTP |
| Bulk export | Future | Email OTP |
| Password change | Future | Email OTP |
| API key generation | Future | Email OTP |

### Secret Rotation Schedule

| Secret Type | Rotation Period | Method | Responsibility |
|-------------|----------------|--------|---------------|
| **Employee Password** | 90 days | Self-service via profile | User |
| **API Key** | 90-180 days | Regenerate via admin | IT Security |
| **Environment Variables** | On incident | Rotate in deployment platform | CTO |
| **JWT Private Key** | Annual | Regenerate in auth config | CTO |
| **SSL/TLS Certificate** | Per certificate (1 year typical) | Auto-renew via Let's Encrypt | IT |
| **Session Token** | Per session (7 days) | Auto-expire | System |
| **Database Credentials** | On rotation schedule | Via cloud provider | CTO |

### Credential Expiry Monitoring

| Credential Type | Monitoring | Alert (Days Before) | Action |
|-----------------|-----------|---------------------|--------|
| Password | user.lastLoginAt + 90 days | 7 days | Email reminder |
| API Key | apiKey.expiryDate | 30 days | Email to key owner |
| SSL Certificate | domain.sslExpiryDate | 30 days | Email to IT |
| Domain | domain.expiryDate | 30 days | Email to domain owner |
| Session | session.expiresAt | Auto (7 day expiry) | Auto-logout |

---

## 15. AI Governance

> **Cross-Reference:** DOC-18 §19 (Full AI Security section)

AI Governance ensures the AI platform (DOC-18) operates within strict security and compliance boundaries.

### Permission-Aware AI Architecture

```
User Query → RBAC Check → Data Filter → AI Processing → Permission Check → Response

1. User's role and scopes determine what data AI can access
2. AI never sees data the user cannot access
3. AI responses are audited with full traceability
4. Sensitive data is masked before AI processing
```

### AI Security Controls

| Control | Description | DOC-18 Reference |
|---------|-------------|-----------------|
| **RBAC Integration** | AI inherits existing user roles and permissions | §19 |
| **Audit Logging** | Every AI interaction logged (user, input, output, model, cost) | §19 |
| **Data Privacy** | PII masking, data minimization before LLM call | §19 |
| **Prompt Injection Protection** | Input validation + prompt sandboxing | §19 |
| **Sensitive Data Masking** | Post-processing regex/ML-based PII detection | §19 |
| **Approval Rules** | Critical AI actions require human approval | §19 |
| **Rate Limiting** | Per-user, per-org, per-model rate limits | §19 |

### AI Data Privacy Rules

| Data Category | Allowed in AI Context? | Masking Required? |
|---------------|----------------------|-------------------|
| Lead PII (phone, email, address) | ⚠️ Only with explicit consent and masking | ✅ Yes |
| Student PII (name, phone, address) | ⚠️ Only with explicit consent and masking | ✅ Yes |
| Employee PII (salary, performance) | ❌ Never | N/A |
| Financial PII (PAN, Aadhaar, bank) | ❌ Never | N/A |
| Non-PII business data (stages, amounts) | ✅ Yes | No |
| Aggregate/statistical data | ✅ Yes | No |

### AI Audit Log Requirements (from DOC-18)

```typescript
aiAuditLogs: defineTable({
  userId: v.id("users"),
  organizationId: v.id("companies"),
  module: v.string(),
  service: v.string(),
  action: v.string(),
  inputHash: v.string(),        // SHA-256 hash for privacy
  inputSummary: v.string(),     // Brief description (not full content)
  outputHash: v.string(),       // SHA-256 hash for privacy
  model: v.string(),
  tokensUsed: v.number(),
  costInCents: v.number(),
  latency: v.number(),
  status: v.string(),
  createdAt: v.number(),
});
```

### AI Golden Rules (from DOC-18 §24)

1. AI assists. Humans decide. — AI never replaces human approval authority.
2. Permissions always apply. — AI inherits RBAC.
3. Everything is auditable. — Every AI interaction is logged.
4. AI cannot bypass workflows. — Automation uses DOC-10.
5. AI cannot access unauthorized data. — Data boundaries enforced.
6. AI never hires, fires, or sets salaries. — Personnel decisions remain human-only.
7. AI never approves payments, waivers, or write-offs. — Financial decisions remain human-only.

---

## 16. Monitoring & Alerts

### Alert Categories

| Category | Trigger | Channel | Severity |
|----------|---------|---------|----------|
| **Failed Login Spike** | > 10 failed logins in 5 minutes | Email + Slack | 🔴 Critical |
| **Permission Violation** | 403 errors > 5 in 5 minutes | Slack | 🟠 High |
| **Unusual Activity** | Bulk data access > 100 records | Slack | 🟠 High |
| **Bulk Export** | Export > 500 records by single user | Email + Audit | 🟡 Medium |
| **Data Change Anomaly** | Unusual update pattern on sensitive tables | Slack | 🟠 High |
| **System Health** | Application error rate > 5% | Email + Slack | 🔴 Critical |
| **Fraud Indicator** | Matching predefined fraud patterns | Email + SMS | 🔴 Critical |
| **Session Anomaly** | Same user, different IP within 1 hour | Slack | 🟡 Medium |
| **API Key Usage Spike** | > 10x normal usage in 1 hour | Slack | 🟠 High |
| **Audit Log Failure** | Audit write fails | Slack | 🔴 Critical |

### Monitoring Dashboard (Proposed)

```text
┌─────────────────────────────────────────────────────────────┐
│  SECURITY MONITORING DASHBOARD                               │
├─────────────────────────────────────────────────────────────┤
│  Active Users   Failed Logins   Open Incidents   Alerts Today│
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐│
│  │   156    │   │   3     │   │    0     │   │    2     ││
│  │  today   │   │  today   │   │  critical │   │  active  ││
│  └──────────┘   └──────────┘   └───────────┘   └──────────┘│
├─────────────────────────────────────────────────────────────┤
│  Failed Logins (Last 24 hours)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 12:15 ─── Username: rajesh — IP: 203.0.113.42        │   │
│  │ 12:16 ─── Username: rajesh — IP: 203.0.113.42        │   │
│  │ 12:18 ─── Username: admin — IP: 198.51.100.7          │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Permission Violations (Last 24 hours)                       │
│  ┌──────┬──────────┬──────────────┬──────────┬──────────┐   │
│  │ Time │ User     │ Action       │ Resource │ Status   │   │
│  ├──────┼──────────┼──────────────┼──────────┼──────────┤   │
│  │ 14:22│ Staff A  │ Update task  │ Task 089 │ 403 — RBAC│   │
│  │ 09:45│ Staff B  │ Delete lead  │ Lead 452 │ 403 — Owner│   │
│  └──────┴──────────┴──────────────┴──────────┴──────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Active Sessions by Role                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Super Admin: 2    │ Admin: 8    │ Manager: 35        │   │
│  │ Staff: 110        │ Total: 156  │ Avg Session Age: 3d│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Alert Escalation Matrix

| Alert | Tier 1 (Immediate) | Tier 2 (15 min) | Tier 3 (1 hour) |
|-------|-------------------|-----------------|-----------------|
| Critical security incident | Security team | CTO | CEO |
| Failed login spike | IT support | Security team | CTO |
| Bulk data export | Manager | Security team | — |
| Permission violation | IT support | Manager | Security team |
| System health degradation | DevOps | CTO | — |

---

## 17. Business Continuity

### Disaster Recovery

> **Cross-Reference:** DOC-15 §12 (Full Backup & DR Plan)

### Recovery Objectives

| Tier | Scenario | RTO | RPO |
|------|----------|-----|-----|
| **Tier 1** | Service disruption (app crash, DB unavailable) | 15 minutes | < 5 minutes |
| **Tier 2** | Data loss (accidental deletion, corruption) | 2 hours | < 1 hour |
| **Tier 3** | Infrastructure failure (cloud provider outage) | 8 hours | < 4 hours |
| **Tier 4** | Catastrophic failure (complete platform loss) | 48 hours | < 24 hours |

### Backup Retention

| Data Type | Daily | Weekly | Monthly | Yearly |
|-----------|-------|--------|---------|--------|
| Database | 7 days | 4 weeks | 12 months | 3 years |
| Files | 3 days | 2 weeks | 3 months | 1 year |
| Configuration | Git history (forever) | — | — | — |

### Emergency Operations

| Situation | Action | Communication |
|-----------|--------|---------------|
| **Platform down** | Activate DR plan, restore from backup | Notify all users via WhatsApp broadcast |
| **Security breach** | Isolate affected system, revoke access, investigate | Notify security team + leadership |
| **Data corruption** | Restore from latest clean backup | Notify affected departments |
| **SaaS provider outage** | Failover to secondary provider (if available) | Notify IT team |

---

## 18. Cross Module Governance

### Governance Ownership Map

| Module | Governance Owner | Key Security Controls | DOC Reference |
|--------|-----------------|----------------------|---------------|
| **CRM** | Sales & Marketing | Lead access scoping, stage transition rules, source attribution integrity | DOC-05, DOC-14 |
| **Sales** | Sales Management | Pipeline access control, discount approval, conversion verification | DOC-11 |
| **Finance** | Finance | Payment verification, refund approval, fee structure integrity | DOC-08 |
| **HR** | HR Department | Employee data privacy, salary data restriction, recruitment integrity | DOC-13 |
| **Marketing** | Marketing | Campaign budget approval, source data integrity, attribution accuracy | DOC-14 |
| **Technology** | IT/CTO | Asset inventory integrity, SaaS subscription access, API key management | DOC-15 |
| **Administration** | Admin Department | Purchase approval, vendor verification, visitor data privacy | DOC-16 |
| **Communication** | All departments | Message content privacy, recipient scope, opt-in/opt-out compliance | DOC-09 |
| **AI** | Security + AI Team | Permission-aware AI, PII masking, audit trail, model governance | DOC-18 |
| **Analytics** | BI Team | Report access scoping, data export controls, KPI calculation integrity | DOC-17 |
| **Workflow** | All departments | Approval chain integrity, escalation rules, task assignment security | DOC-10 |
| **Collections** | Finance | PDC data security, commitment integrity, collection scope access | DOC-12 |

### Cross-Module Security Rules

| Rule | Description | Applies To |
|------|-------------|------------|
| **Data Boundary** | No module accesses another module's data without explicit permission | All modules |
| **Audit Trail** | Every module logs all changes to its entities through the central audit engine | All modules |
| **Scope Inheritance** | User scopes defined in RBAC apply uniformly across all modules | All modules |
| **Approval Governance** | All approval flows follow the centralized approval engine (DOC-10) | All modules |
| **PII Protection** | Sensitive fields are masked across all modules based on user role | All modules |
| **Export Control** | All bulk exports are logged and rate-limited | All modules |
| **API Security** | All module APIs go through the same auth/authorization gateway | All modules |
| **AI Boundary** | All AI features honor user permissions — AI never accesses unauthorized data | AI (DOC-18) |

---

## 19. Reports

### Security Report Catalog

| # | Report | Description | Frequency | Owner |
|---|--------|-------------|-----------|-------|
| 1 | **Audit Report** | All audit events within date range, filterable by entity type, action, user | On-demand | Security |
| 2 | **Login Report** | Successful and failed login attempts, by user, date, IP | Weekly | Security |
| 3 | **Permission Report** | Current user roles and scopes, pending access reviews | Monthly | HR + IT |
| 4 | **Approval Report** | Approval requests, decisions, timings, escalation events | Monthly | All depts |
| 5 | **Security Incident Report** | All security incidents, status, resolution, lessons learned | Monthly | Security |
| 6 | **Risk Report** | Risk register status, mitigation progress, new risks | Quarterly | Security |
| 7 | **Compliance Report** | Data retention status, consent records, policy compliance | Quarterly | Legal |
| 8 | **Access Review Report** | Access review completion, changes made, exceptions | Quarterly | HR + IT |
| 9 | **Session Report** | Active sessions, session age, geo-distribution | Weekly | IT |
| 10 | **AI Usage Report** | AI interactions, cost, model distribution, error rate | Monthly | AI Team |
| 11 | **API Key Report** | Active API keys, last used, rotation status | Monthly | IT |
| 12 | **Data Export Report** | Export activity by user, scope, date, format | Monthly | Security |

### Sample: Audit Report

```text
AUDIT REPORT
Generated: July 9, 2026
Period: July 1-8, 2026
Filters: All actions, All users, All entities

┌──────────────┬────────┬──────────┬──────────────────────────────┐
│ Date         │ User   │ Action   │ Entity/Description           │
├──────────────┼────────┼──────────┼──────────────────────────────┤
│ Jul 8 14:30  │ Admin  │ lead.update│ Lead L-0452 — Stage change │
│ Jul 8 14:31  │ Admin  │ payment.vfy│ Payment P-0891 — Verified │
│ Jul 8 12:15  │ Staff A│ login    │ Failed — Invalid password   │
│ Jul 8 12:16  │ Staff A│ login    │ Failed — Invalid password   │
│ Jul 8 10:00  │ CEO    │ user.create│ Created user: Priya Sharma │
│ Jul 7 16:45  │ System │ approval  │ Escalated: Dsc-0032 → Dir  │
│ Jul 7 09:22  │ CTO    │ ai.usage  │ Model: GPT-4o — ₹0.12     │
└──────────────┴────────┴──────────┴──────────────────────────────┘

Summary:
  Total Events: 12,450
  Creates: 3,210
  Updates: 7,890
  Deletes: 89
  Logins: 1,200 (Success: 1,182 | Failed: 18)
  Approvals: 52
  Exports: 8
```

### Sample: Login Report

```text
LOGIN REPORT — July 8, 2026

Successful Logins: 156
Failed Logins: 18

Failed Login Details:
┌──────────┬───────────┬─────────────┬──────────┐
│ Time     │ Username  │ IP Address  │ Attempts │
├──────────┼───────────┼─────────────┼──────────┤
│ 12:15    │ staff_a   │ 203.0.113.42│ 3        │
│ 14:22    │ unknown   │ 198.51.100.7│ 5        │
│ 14:23    │ unknown   │ 198.51.100.7│ 3        │ ← Brute force suspect
│ 16:00    │ rajesh    │ 192.0.2.8   │ 2        │
│ 17:45    │ admin     │ 203.0.113.99│ 1        │
└──────────┴───────────┴─────────────┴──────────┘

Alert: IP 198.51.100.7 blocked after 8 failed attempts in 1 minute.
```

---

## 20. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1-3)

**Effort:** 2-3 weeks  
**Risk:** Low  
**Dependencies:** Existing auth, user management

| Task | Description | Files / Components |
|------|-------------|-------------------|
| **1.1** Task visibility + RBAC | Implement BACKLOG-001 Phase 1-2 visibility system | `tasks.ts`, `schema.ts` (add visibility field) |
| **1.2** Task permission checks | Implement BACKLOG-001 permission matrix on task mutations | `tasks.ts`, `crmTasks.ts` |
| **1.3** Session enhancement | Add IP address, userAgent capture to sessions | `authHelpers.ts` login mutation |
| **1.4** Rate limiting | Implement per-user request rate limiting | New `rateLimiter.ts` Convex action |
| **1.5** Password policy | Enforce min 8 char, mixed case, numbers on create/reset | `authHelpers.ts` setPassword |

### Phase 2 — Authorization (Weeks 3-5)

**Effort:** 2-3 weeks  
**Risk:** Medium  
**Dependencies:** Phase 1

| Task | Description | Files / Components |
|------|-------------|-------------------|
| **2.1** Centralized audit log | Create `auditLogs` table + audit helper functions | `schema.ts`, new `auditEngine.ts` |
| **2.2** Audit middleware | Add audit logging to all major mutations | `crmLeads.ts`, `tasks.ts`, `userManagement.ts` |
| **2.3** Permission helper | Create reusable `checkPermission()` utility | New `permissionEngine.ts` |
| **2.4** Scope enforcement | Implement entity-level scope checks in queries | `crmLeads.ts` listLeads, `tasks.ts` listTasks |
| **2.5** Account lockout | Auto-disable after 5 failed login attempts (15 min) | `authHelpers.ts` login mutation |

### Phase 3 — Compliance (Weeks 5-7)

**Effort:** 2-3 weeks  
**Risk:** Medium  
**Dependencies:** Phase 2

| Task | Description |
|------|-------------|
| **3.1** Data masking service | Create `maskField()` utility + role-based PII masking |
| **3.2** PII masking in queries | Apply masking to lead/payment/HR queries |
| **3.3** Data retention cron | Scheduled task to purge/anonymize data per retention policy |
| **3.4** Consent tracking | Create `consentLogs` table for communication consent |
| **3.5** Export controls | Rate-limit bulk exports + auto-log all exports |

### Phase 4 — Risk & Incident Management (Weeks 7-9)

**Effort:** 2-3 weeks  
**Risk:** Medium  
**Dependencies:** Phase 2

| Task | Description |
|------|-------------|
| **4.1** Incident management | Create `securityIncidents` table + CRUD |
| **4.2** Access review automation | Auto-generate access review reports quarterly |
| **4.3** Security monitoring dashboard | Failed logins, permission violations, active sessions |
| **4.4** Alert integration | Connect security alerts to Communication Engine (DOC-09) |
| **4.5** Session anomaly detection | Flag same-user-different-IP patterns |

### Phase 5 — AI Governance (Weeks 9-11)

**Effort:** 2-3 weeks  
**Risk:** High  
**Dependencies:** DOC-18 (AI Engine)

| Task | Description |
|------|-------------|
| **5.1** AI permission gateway | Ensure AI queries inherit RBAC + scopes |
| **5.2** AI audit integration | Connect `aiAuditLogs` to central audit engine |
| **5.3** PII masking for AI | Pre-processing pipeline strips PII before LLM call |
| **5.4** Prompt injection protection | Input validation + output filtering |
| **5.5** AI cost monitoring | Track AI costs, detect unusual spending |

### Phase 6 — Advanced Security (Weeks 11-14)

**Effort:** 3-4 weeks  
**Risk:** High  
**Dependencies:** Phases 1-5

| Task | Description |
|------|-------------|
| **6.1** MFA implementation | Email OTP for sensitive operations |
| **6.2** SSO integration | SAML/OIDC for enterprise organizations |
| **6.3** Field-level encryption | Encrypt sensitive fields (PAN, Aadhaar, bank) at rest |
| **6.4** Security compliance reports | ISO 27001 / SOC 2 readiness documentation |
| **6.5** Penetration testing | Third-party security audit |

### Dependency Graph

```
Phase 1 ── Foundation (Auth + RBAC)
    │
    ├──► Phase 2 ── Authorization (Audit + Permissions)
    │         │
    │         ├──► Phase 3 ── Compliance (Data Privacy + Retention)
    │         │         │
    │         │         └──► Phase 6 ── Advanced (MFA, SSO, Encryption)
    │         │
    │         ├──► Phase 4 ── Risk & Incident (Dashboard + Alerts)
    │         │
    │         └──► Phase 5 ── AI Governance ← DOC-18
    │
    └── BACKLOG-001 (Task Security)
```

### Priority Matrix

| Feature | Effort | Impact | Priority | Phase |
|---------|--------|--------|----------|-------|
| Task RBAC (BACKLOG-001) | Medium | Critical | 🔴 P0 | P1 |
| Rate limiting | Low | High | 🔴 P0 | P1 |
| Centralized audit log | Medium | High | 🔴 P0 | P2 |
| Account lockout | Low | High | 🔴 P0 | P2 |
| PII masking | Medium | High | 🟡 P1 | P3 |
| Data retention enforcement | Medium | Medium | 🟡 P1 | P3 |
| Security dashboard | Medium | Medium | 🟡 P1 | P4 |
| Incident management | Medium | Medium | 🟡 P1 | P4 |
| AI Governance | High | Critical | 🟡 P1 | P5 |
| MFA | Medium | High | 🟢 P2 | P6 |
| SSO | High | Medium | 🟢 P2 | P6 |
| Field-level encryption | High | High | 🟢 P2 | P6 |

---

## 21. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          SECURITY, GOVERNANCE & COMPLIANCE GOLDEN RULES       ║
║                                                              ║
║   1.  Authenticate everything.                                ║
║       └── No unauthenticated access to any protected resource.║
║                                                              ║
║   2.  Authorize everything.                                   ║
║       └── Every action checks role + scope on the backend.    ║
║                                                              ║
║   3.  Audit everything.                                       ║
║       └── Every create, update, delete, login, approval,      ║
║       export, and AI action is logged with full traceability. ║
║                                                              ║
║   4.  Encrypt sensitive data.                                 ║
║       └── Passwords hashed (SHA-256). PII masked by role.     ║
║       Future: field-level encryption for restricted fields.   ║
║                                                              ║
║   5.  Least privilege always.                                 ║
║       └── Every user has minimum permissions needed.          ║
║       No exceptions.                                          ║
║                                                              ║
║   6.  No hidden permissions.                                  ║
║       └── All permissions are visible and auditable.          ║
║       No backdoors. No hard-coded overrides.                  ║
║                                                              ║
║   7.  No orphan users.                                        ║
║       └── Every user has a known status. Disabled accounts    ║
║       are reviewed and purged on schedule.                    ║
║                                                              ║
║   8.  No anonymous changes.                                   ║
║       └── Every data change is attributed to a user.          ║
║       System actions are attributed to a service account.     ║
║                                                              ║
║   9.  Security before convenience.                            ║
║       └── When security and convenience conflict,             ║
║       security wins. Every exception is logged and approved.  ║
║                                                              ║
║  10.  Governance before customization.                        ║
║       └── Permission model is defined first, then customized  ║
║       for specific needs. Never ad-hoc.                       ║
║                                                              ║
║  11.  Never trust the frontend.                               ║
║       └── All permission checks are enforced on the backend.  ║
║       Frontend UI is a convenience, not a security control.   ║
║                                                              ║
║  12.  Separation of duties.                                   ║
║       └── No single person controls an end-to-end sensitive   ║
║       process. Approvals, verifications, and payments require ║
║       multiple actors.                                        ║
║                                                              ║
║  13.  Everything traceable.                                   ║
║       └── Every action can be traced to: who, what, when,     ║
║       where (IP), which device (user agent), and why.         ║
║                                                              ║
║  14.  Data is private by default.                             ║
║       └── User data is visible only to the user and their     ║
║       manager by default. Explicit sharing required.          ║
║                                                              ║
║  15.  Review everything, regularly.                           ║
║       └── Access reviews quarterly. Incident reviews per      ║
║       event. Risk reviews monthly. Compliance reviews annual. ║
║       Security is never "done" — it is continuously improved. ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendices

### Appendix A: RBAC Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBAC DECISION TREE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Is user authenticated?                                           │
│  ├── No  → Return 401 Unauthenticated                            │
│  └── Yes → Continue                                              │
│                                                                   │
│  Is user disabled?                                                │
│  ├── Yes → Return 401 Account Disabled                           │
│  └── No → Continue                                               │
│                                                                   │
│  Does user have required role?                                    │
│  ├── No → Return 403 Insufficient Role                           │
│  └── Yes → Continue                                              │
│                                                                   │
│  Does user have required scope?                                    │
│  ├── No scopes defined → Full access (role-level)                │
│  ├── Scopes defined, entity in scope → Access granted             │
│  └── Scopes defined, entity NOT in scope → Return 403 Forbidden  │
│                                                                   │
│  Is this a sensitive field?                                       │
│  ├── Yes → Apply field-level mask                                │
│  └── No → Return full data                                       │
│                                                                   │
│  Log access → Return response                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Role Permission Summary

| Permission | super_admin | admin | manager | staff |
|------------|:-----------:|:-----:|:-------:|:-----:|
| **User Management** | | | | |
| Create users | ✅ | ✅ | ❌ | ❌ |
| Edit users | ✅ | ✅ | ❌ | ❌ |
| Disable/enable users | ✅ | ✅ | ❌ | ❌ |
| Reset passwords | ✅ | ✅ | ❌ | ❌ |
| Edit scopes | ✅ | ✅ | ❌ | ❌ |
| **Lead Management** | | | | |
| View own leads | ✅ | ✅ | ✅ | ✅ |
| View team leads | ✅ | ✅ | ✅ | ❌ |
| View all leads | ✅ | ✅ | ❌ | ❌ |
| Create leads | ✅ | ✅ | ✅ | ✅ |
| Edit own leads | ✅ | ✅ | ✅ | ✅ |
| Edit team leads | ✅ | ✅ | ✅ | ❌ |
| Edit all leads | ✅ | ✅ | ❌ | ❌ |
| Delete leads | ✅ | ⚠️ (scope) | ❌ | ❌ |
| **Task Management** | | | | |
| View own tasks | ✅ | ✅ | ✅ | ✅ |
| View team tasks | ✅ | ✅ | ✅ | ❌ |
| View all tasks | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ | ✅ |
| Edit team tasks | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ |
| **Approvals** | | | | |
| Approve discount < ₹5K | ✅ | ✅ | ✅ | ❌ |
| Approve discount < ₹25K | ✅ | ✅ | ✅ | ❌ |
| Approve discount > ₹25K | ✅ | ✅ | ❌ | ❌ |
| Approve waiver (any) | ✅ | ✅ | ❌ | ❌ |
| **Financial** | | | | |
| View payments | ✅ | ✅ | ✅ | ✅ (own) |
| Verify payments | ✅ | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ✅ (dept) | ❌ |
| Export data | ✅ | ✅ | ⚠️ (scope) | ❌ |
| **Settings** | | | | |
| Master data management | ✅ | ✅ | ❌ | ❌ |
| Feature flags | ✅ | ❌ | ❌ | ❌ |
| AI configuration | ✅ | ✅ | ❌ | ❌ |
| Security settings | ✅ | ❌ | ❌ | ❌ |

### Appendix B: Permission Naming Standards

**Format:** `{module}:{entity}:{action}:{scope}`

**Module Codes:**
| Code | Module |
|------|--------|
| `crm` | CRM & Lead Management (DOC-05) |
| `sales` | Sales Pipeline (DOC-11) |
| `finance` | Finance & Fee Engine (DOC-08) |
| `collections` | Collection Center (DOC-12) |
| `hr` | HR & Employee Lifecycle (DOC-13) |
| `mktg` | Marketing & Campaigns (DOC-14) |
| `tech` | Technology Operations (DOC-15) |
| `admin` | Administration & Facilities (DOC-16) |
| `reports` | Reports & BI (DOC-17) |
| `ai` | Enterprise AI (DOC-18) |
| `comm` | Communication Engine (DOC-09) |
| `workflow` | Workflow & Automation (DOC-10) |
| `users` | User Management |
| `system` | System Configuration |

**Action Codes:**
| Code | Action |
|------|--------|
| `create` | Create new entity |
| `read` | View / query entity |
| `update` | Modify existing entity |
| `delete` | Remove entity |
| `approve` | Approve a request |
| `verify` | Verify an entity (payments) |
| `export` | Export data |
| `manage` | Full management (create+read+update+delete) |

**Scope Codes:**
| Code | Scope |
|------|-------|
| `own` | Only own records |
| `team` | Team-level records |
| `dept` | Department-level records |
| `branch` | Branch-level records |
| `org` | Organization-wide |
| `system` | System-wide (across organizations) |

### Appendix C: Audit Event Catalog

**Entity Audit Events:**

| Event Code | Trigger | Captures |
|------------|---------|----------|
| `entity.created` | Any entity created | Full entity data |
| `entity.updated` | Any field changed | Before/after field diff |
| `entity.deleted` | Entity removed | Full entity data (snapshot) |
| `entity.restored` | Entity returned from deleted | Entity data |

**User Events:**

| Event Code | Trigger | Captures |
|------------|---------|----------|
| `user.login.success` | Successful login | Username, IP, userAgent, sessionId |
| `user.login.failed` | Failed login | Username, IP, attempt count |
| `user.logout` | Session destroyed | Username |
| `user.created` | New user created | Admin, new user data |
| `user.role_changed` | Role modified | Admin, old role, new role |
| `user.scope_changed` | Scopes modified | Admin, old scopes, new scopes |
| `user.disabled` | User disabled | Admin who disabled |
| `user.enabled` | User enabled | Admin who enabled |
| `user.password_reset` | Password reset | Admin who reset |

**Lead Events:**

| Event Code | Trigger | Captures |
|------------|---------|----------|
| `lead.created` | Lead created | Full lead data, source |
| `lead.stage_changed` | Stage transition | From stage, to stage, note |
| `lead.assigned` | Owner changed | From user, to user, assigned by |
| `lead.converted` | Lead converted to admission | Conversion details |
| `lead.lost` | Lead marked lost | Lost reason, lost by |
| `lead.merged` | Lead merged | Parent ID, child ID |
| `lead.contacted` | Lead contacted | Contact method, notes |

**Financial Events:**

| Event Code | Trigger | Captures |
|------------|---------|----------|
| `payment.created` | Payment entered | Amount, mode, entered by |
| `payment.verified` | Payment verified | Verifier, verification time |
| `payment.rejected` | Payment rejected | Rejection reason |
| `discount.approved` | Discount/waiver approved | Approver, amount, type |
| `discount.rejected` | Discount rejected | Rejector, reason |
| `pdc.bounced` | PDC bounced | Reason, bank, amount |

**Security Events:**

| Event Code | Trigger | Captures |
|------------|---------|----------|
| `security.incident.created` | Security incident reported | Incident details, severity |
| `security.incident.resolved` | Incident resolved | Resolution, closed by |
| `security.alert.triggered` | Automated security alert | Alert type, threshold, value |
| `security.rate_limit.hit` | Rate limit exceeded | User/IP, endpoint, count |

**System Events:**

| Event Code | Trigger | Captures |
|------------|---------|----------|
| `config.feature_flag_changed` | Feature flag toggled | Flag name, old value, new value |
| `config.system_setting_changed` | System setting modified | Setting key, old, new |
| `cron.executed` | Cron job run | Cron name, success/fail |
| `backup.completed` | Backup completed | Backup size, duration |
| `backup.failed` | Backup failed | Error details |

### Appendix D: Security Checklist

**Authentication Checklist:**
- [ ] All API endpoints require authentication
- [ ] Sessions have expiry (7 days max)
- [ ] Passwords hashed with SHA-256 minimum
- [ ] Account lockout after 5 failed attempts
- [ ] Rate limiting on login endpoint
- [ ] Disabled users cannot authenticate
- [ ] Session token stored securely (HttpOnly cookie or localStorage + token)

**Authorization Checklist:**
- [ ] All mutations check user role
- [ ] All queries filter by user scope
- [ ] Sensitive mutations require additional authorization
- [ ] Permission checks on backend (not frontend)
- [ ] Authorization result is never cached incorrectly
- [ ] 403 Forbidden does not reveal information about the denied resource

**Data Protection Checklist:**
- [ ] PII fields identified and classified
- [ ] PII masking applied based on user role
- [ ] Phone/email masked in list views by default
- [ ] Financial data masked in list views by default
- [ ] Password hash never returned in queries
- [ ] Session tokens never logged in plain text
- [ ] API keys never committed to source code

**Audit Checklist:**
- [ ] All create operations logged
- [ ] All update operations logged with before/after
- [ ] All delete operations logged with snapshot
- [ ] All login attempts logged (success + failure)
- [ ] All approval decisions logged
- [ ] All export operations logged
- [ ] AI interactions logged
- [ ] Permission changes logged

**Operations Checklist:**
- [ ] Regular access reviews (quarterly)
- [ ] Inactive user detection and disable
- [ ] Failed login monitoring
- [ ] Permission violation monitoring
- [ ] Bulk export detection
- [ ] Backup verification (test restore)
- [ ] Incident response plan documented
- [ ] Security contacts defined and current

### Appendix E: Future Compliance Roadmap

| Standard/Framework | Scope | Target | Effort | Dependencies |
|-------------------|-------|--------|--------|-------------|
| **ISO 27001** | Information Security Management | 2027 Q3 | High | All phases |
| **SOC 2 Type I** | Security controls design | 2027 Q4 | High | Phases 1-4 |
| **SOC 2 Type II** | Security controls over 6 months | 2028 Q1 | Very High | SOC 2 Type I |
| **FERPA-style** | Student record privacy | 2027 Q2 | Medium | Phase 3 compliance |
| **COPPA-style** | Children's online privacy | 2027 Q2 | Medium | Phase 3 consent |
| **GDPR Readiness** | Data subject rights, breach notification | 2027 Q4 | High | Phases 3-4 |
| **PCI DSS** | Payment card data (if storing cards) | Not applicable | N/A | No card storage |
| **IT Act / DPDP (India)** | Indian data protection law | 2027 Q3 | Medium | Phase 3-4 |
| **WCAG 2.1 AA** | Web accessibility | 2027 Q2 | Medium | Frontend |
| **BCP/DR Certification** | Business continuity | 2027 Q4 | Medium | Phase 4 |

### Existing Code Integration Points

| Existing File | What It Does | DOC-19 Integration |
|---------------|-------------|-------------------|
| `authHelpers.ts` | Login, logout, session validation, password hashing (SHA-256) | Phase 1 — Enhanced with rate limiting, lockout, MFA |
| `auth.config.ts` | Convex Auth config (JWT, site URL) | Phase 6 — SSO/OIDC integration |
| `schema.ts` | All entity definitions with validators | Phase 2 — Add `auditLogs` table, `securityIncidents` table |
| `userManagement.ts` | User CRUD, scope management, clone/transfer | Phase 1 — Enhanced with permission checks, audit logging |
| `http.ts` | HTTP router for auth routes | Phase 1 — Gateway for API auth |
| `instrumentation.tsx` | Global error boundary, Vly error reporting | Phase 4 — Security alert integration |
| `featureFlags.ts` | Feature toggle constants | Phase 3 — Feature flag audit logging |
| `ProtectedRoute` (main.tsx) | Route-level auth guard | Phase 1 — Enhanced with role-based route blocking |
| `AccessControl.tsx` | User scope management UI | Phase 2 — Enhanced with access review features |
| `UsersPage.tsx` | User management UI | Phase 1 — Enhanced with role-based permissions |
| `crmHelpers.ts` | `logActivity` helper for lead timeline | Phase 2 — Replaced by centralized audit engine |
| `crmLeads.ts` | Lead CRUD with implicit permission patterns | Phase 1 — Formalized permission checks |
| `tasks.ts` | Task CRUD (no permission checks) | Phase 1 — BACKLOG-001 RBAC implementation |
| `crmTasks.ts` | Lead task CRUD (no permission checks) | Phase 1 — BACKLOG-001 RBAC implementation |
| `verification_requests` | Verification engine | Phase 3 — Enhanced with audit + approval integration |
| `approvalRequests` | Approval engine | Phase 2 — Enhanced with escalation, SLA tracking |
| `users.ts` | User queries (currentUser, listUsers) | Phase 2 — Scope-filtered user queries |
| `seed.ts` | Seed data (users, passwords) | Phase 3 — Seed compliance defaults |
| **BACKLOG-001** | Task Security & RBAC Architecture | Phase 1 — Task RBAC implementation blueprint |

---

*End of DOC-19 — Security, Governance, Audit & Compliance Engine Bible*
