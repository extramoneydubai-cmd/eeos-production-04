# EEOS Enterprise Security & Compliance Platform

## Architecture

```
Security Center (/security)
Audit Center (/audit)
        │
        ├── SecurityEngine ─── Core security event store, policies, API keys
        ├── AuditAggregator ── Cross-source audit log aggregation
        ├── RiskEngine ──────── Real-time risk scoring engine
        ├── SessionMonitor ─── Session tracking & anomaly detection
        ├── PermissionInspector ── Permission resolution & inspection
        └── SecurityExporter ── Report generation & export
                │
                ├── RuntimeSupervisor — Runtime health monitoring
                ├── Event Pipeline — Event recording & audit
                └── Error Logger — Error classification & metadata
```

## Components

### 1. SecurityEngine (`src/platform/security/SecurityEngine.ts`)

**Singleton** — Coordinates all security subsystems.

- **Security Events**: Records all security events with type, severity, actor, module, entity, IP, browser, session, correlation ID, before/after state
- **Security Policies**: Manages 7 default policies (password min-length, MFA, session timeout, login attempts, concurrent sessions, audit retention, device trust) with enable/disable toggle
- **API Keys**: Full CRUD — create with scopes, revoke, track expiration, usage count, last-used timestamp
- **Session Tracking**: Active/idle/expired session lifecycle management with concurrent count per user
- **Login Analytics**: Hourly/daily breakdown, browser/device/OS tracking, peak hour, average session duration
- **Risk Engine**: Weighted scoring from failed logins (25%), permission violations (20%), concurrent sessions (15%), API key health (10%), error rate (10%), unauthorized access (10%)
- **Compliance Status**: ISO 27001, SOC2, GDPR, FERPA, Internal Policy — each with percent, violations, recommendations
- **Data Access Tracking**: View/create/update/delete/download/export/print/share action logging per entity
- **Reports**: Daily/weekly/monthly security reports with summary, risk score, top modules

### 2. AuditAggregator (`src/platform/security/AuditAggregator.ts`)

**Singleton** — Aggregates audit events from SecurityEngine, Event Pipeline, User Actions, System, and SDK sources.

- **Ingestion**: Automatic subscription to SecurityEngine events via `onEvent()` callback
- **Manual Ingestion**: `ingestEntry()` for external audit sources
- **Filtering**: type, severity, module, actor, entity, date range, text search (query)
- **Search**: Full text search across type, module, entity, actor
- **Entity/User Scoping**: `getByEntity(entity, entityId)`, `getByUser(userId)`
- **Module Discovery**: `getModules()`, `getEntityTypes()`, `getEventTypes()`

### 3. RiskEngine (`src/platform/security/RiskEngine.ts`)

**Singleton** — Real-time risk scoring engine (updates every 30 seconds).

- **Global Risk Assessment**: Calculates overall platform risk from 7 weighted factors
- **User Risk Profile**: Per-user scoring from failed logins, violations, active sessions
- **Factor Scoring**: configurable warning/critical thresholds per factor
- **Factor Breakdown**: name, weight, value, score, threshold, details
- **Labels**: low (<20), medium (20-44), high (45-69), critical (70+)

### 4. SessionMonitor (`src/platform/security/SessionMonitor.ts`)

**Singleton** — Real-time session tracking and anomaly detection (checks every 15 seconds).

- **Anomaly Detection**: multiple concurrent sessions (>3 → high, >5 → critical), expired tokens, deduplication within 5 minutes
- **Page View Tracking**: per-session last route, page view count, IP history
- **Session Stats**: active, idle, expired, total counts
- **Anomaly Management**: list, resolve, automatic security event recording

### 5. PermissionInspector (`src/platform/security/PermissionInspector.ts`)

**Singleton** — Enterprise permission resolution and inspection.

- **Role Hierarchy**: admin → manager → staff/faculty → student/parent with full inheritance
- **Permission Matrix**: 6 roles × ~40 permissions across people, student, employee, finance, academic, attendance, examination, lms, calendar, tasks, reports
- **Permission Resolution**: Resolves effective permissions from direct + inherited roles with source tracking
- **Permission Checking**: `checkPermission(userId, roles, resource, action, context)` — returns allowed boolean, sources, explanation
- **Wildcard Support**: admin role grants `*` (all)
- **Scope Explanation**: Organization/company/branch/department scopes
- **Permission Tree**: Full matrix and hierarchy exposure

### 6. SecurityExporter (`src/platform/security/SecurityExporter.ts`)

**Singleton** — Export engine for all security/audit/risk/session/compliance data.

- **Export Types**: security_events, audit_log, risk_assessment, session_report, permission_profile, compliance_report, security_report, full_export
- **Formats**: JSON, Markdown, CSV — with proper formatting for each
- **Download**: One-click `download(type, format, filename?)` with Blob URL

## Tab Reference (Security Center)

| Tab | Route | Contents |
|-----|-------|----------|
| Overview | `/security` | Risk score banner, 6 KPI cards, compliance status, recent critical events |
| Sessions | `/security` | Session stats, active sessions table, session anomalies with dismiss |
| Permissions | `/security` | Permission explorer (role selection, resource/action check), permission profile, effective permissions table |
| Analytics | `/security` | Login analytics KPIs, hourly breakdown chart, browser/device distribution |
| Compliance | `/security` | 5-standard compliance cards with percent/progress, violations, recommendations; security policies table |
| API Keys | `/security` | Key CRUD, scopes, expiration, usage tracking, revoke |
| Policies | `/security` | Toggle cards for all 7 security policies |
| Reports | `/security` | One-click exports in JSON/MD/CSV + full platform export |

## Tab Reference (Audit Center)

| Section | Description |
|---------|-------------|
| Summary Stats | 8-count cards (Total, Critical, High, Security, System, User, Pipeline, SDK) |
| Search | Full-text search with multi-select severity/module/type filters + date range |
| Audit Table | Paginated table with severity, timestamp, type, source, module, entity, actor |
| Detail Modal | Click any entry for full details — ID, metadata, before/after state, raw JSON |
| Export | JSON, CSV, Markdown — one-click download |

## Route Registration

```
/security  → SecurityCenter.tsx  (Enterprise Security & Compliance Dashboard)
/audit     → AuditCenter.tsx     (Enterprise Audit Explorer & Log Viewer)
```

## Integration Guide

### Initialization (already done in SecurityCenter.tsx)

```typescript
import { securityEngine } from "./platform/security/SecurityEngine";
import { auditAggregator } from "./platform/security/AuditAggregator";
import { riskEngine } from "./platform/security/RiskEngine";
import { sessionMonitor } from "./platform/security/SessionMonitor";
import { permissionInspector } from "./platform/security/PermissionInspector";

securityEngine.init();
auditAggregator.init();
riskEngine.init();
sessionMonitor.init();
permissionInspector.init();
```

### Recording a security event

```typescript
securityEngine.recordEvent({
  type: "login",
  severity: "info",
  module: "Auth",
  actorId: user.id,
  actorName: user.name,
  sessionId: session.id,
  details: { method: "password" },
  success: true,
});
```

### Checking permissions

```typescript
const result = permissionInspector.checkPermission(
  userId,
  ["staff", "faculty"],
  "student",
  "write"
);
// result.allowed, result.explanation
```

### Tracking data access

```typescript
securityEngine.trackDataAccess({
  action: "viewed",
  module: "Student",
  entity: "student",
  entityId: "123",
  userId: user.id,
  userName: user.name,
});
```

### Exporting reports

```typescript
securityExporter.download("risk_assessment", "json");
securityExporter.download("audit_log", "csv");
securityExporter.download("full_export", "json", "security_export.json");
```

## Extension Guide

### Adding a new audit source

```typescript
auditAggregator.ingestEntry({
  type: "custom_event",
  severity: "info",
  module: "CustomModule",
  entity: "CustomEntity",
  action: "custom_action",
  actorId: userId,
  source: "sdk",
  details: { custom: "data" },
});
```

### Adding a new security policy

```typescript
securityEngine.updatePolicy("policy-id", {
  enabled: true,
  parameters: { /* custom params */ },
});
```

### Adding a new role

Add to `PermissionInspector.ts`:

```typescript
private readonly PERMISSION_MATRIX: Record<string, string[]> = {
  "new_role": ["resource:action", "resource:action"],
};
```

## Export Formats

All exports are available as JSON (structured data), Markdown (readable reports), and CSV (tabular data).

| Export | JSON | Markdown | CSV |
|--------|------|----------|-----|
| security_events | ✅ | ✅ | ✅ |
| audit_log | ✅ | ✅ | ✅ |
| risk_assessment | ✅ | ✅ | ✅ |
| session_report | ✅ | ✅ | ✅ |
| permission_profile | ✅ | ✅ | ✅ |
| compliance_report | ✅ | ✅ | ✅ |
| full_export | ✅ | ❌ | ❌ |
