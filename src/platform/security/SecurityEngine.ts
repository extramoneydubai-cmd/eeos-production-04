/**
 * SecurityEngine — Enterprise Security & Compliance Core
 *
 * Singleton that coordinates all security subsystems:
 * - Audit Aggregation
 * - Risk Scoring
 * - Session Monitoring
 * - Permission Inspection
 * - Security Policies
 * - API Key Management
 *
 * Integrates with RuntimeSupervisor, Event Pipeline, and Operations Center.
 */

import { errorLogger, type LogEntry } from "../../lib/error-logger";

export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";
export type SecurityEventType =
  | "login"
  | "logout"
  | "session_expired"
  | "session_terminated"
  | "permission_denied"
  | "permission_granted"
  | "role_changed"
  | "password_changed"
  | "api_key_created"
  | "api_key_revoked"
  | "api_key_expired"
  | "policy_updated"
  | "feature_enabled"
  | "feature_disabled"
  | "organization_switched"
  | "audit_export"
  | "data_access"
  | "unauthorized_access"
  | "account_locked"
  | "failed_login"
  | "mfa_challenge"
  | "device_trusted"
  | "device_revoked";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: number;
  actorId?: string;
  actorName?: string;
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  module?: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  browser?: string;
  sessionId?: string;
  deviceId?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  success?: boolean;
  riskScore?: number;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  category: "password" | "mfa" | "session" | "login" | "device" | "network" | "audit" | "compliance";
  description: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
  severity: SecuritySeverity;
  lastUpdated: number;
  updatedBy?: string;
}

export interface ApiKeyEntry {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  permissions: string[];
  created: number;
  expiresAt?: number;
  lastUsed?: number;
  usedCount: number;
  status: "active" | "expired" | "revoked";
  createdBy?: string;
  organizationId?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userName: string;
  startedAt: number;
  lastActivityAt: number;
  expiresAt: number;
  ip?: string;
  browser?: string;
  device?: string;
  os?: string;
  isActive: boolean;
  isIdle: boolean;
  concurrentCount: number;
}

export interface LoginAnalytics {
  totalLogins: number;
  failedLogins: number;
  successfulLogins: number;
  lockedAccounts: number;
  expiredSessions: number;
  uniqueUsers: number;
  peakHour: number;
  averageSessionDuration: number;
  deviceTypes: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  hourlyBreakdown: number[];
  dailyBreakdown: number[];
}

export interface ComplianceStatus {
  standard: string;
  compliancePercent: number;
  passed: number;
  failed: number;
  warnings: number;
  violations: string[];
  recommendations: string[];
  lastChecked: number;
}

export interface RiskScore {
  overall: number;
  user: number;
  session: number;
  device: number;
  organization: number;
  module: number;
  label: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  details: string;
}

class SecurityEngineClass {
  private initialized = false;
  private events: SecurityEvent[] = [];
  private policies: SecurityPolicy[] = [];
  private apiKeys: ApiKeyEntry[] = [];
  private sessions: Map<string, SessionInfo> = new Map();
  private listeners: Array<(event: SecurityEvent) => void> = [];
  private maxEvents = 5000;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.loadDefaultPolicies();
    this.loadApiKeys();
    errorLogger.info("SecurityEngine initialized", { source: "SecurityEngine" });
  }

  private loadDefaultPolicies(): void {
    this.policies = [
      {
        id: "password-min-length",
        name: "Minimum Password Length",
        category: "password",
        description: "Enforce minimum password length of 8 characters",
        parameters: { minLength: 8, requireSpecialChar: true, requireNumber: true, requireUppercase: true },
        enabled: true,
        severity: "high",
        lastUpdated: Date.now(),
      },
      {
        id: "mfa-required",
        name: "MFA Required",
        category: "mfa",
        description: "Require multi-factor authentication for all users",
        parameters: { required: true, methods: ["totp", "sms"], gracePeriodDays: 7 },
        enabled: false,
        severity: "critical",
        lastUpdated: Date.now(),
      },
      {
        id: "session-timeout",
        name: "Session Timeout",
        category: "session",
        description: "Automatically expire idle sessions",
        parameters: { idleTimeoutMinutes: 30, maxSessionHours: 24 },
        enabled: true,
        severity: "high",
        lastUpdated: Date.now(),
      },
      {
        id: "login-attempts",
        name: "Login Attempt Limit",
        category: "login",
        description: "Lock account after failed login attempts",
        parameters: { maxAttempts: 5, lockoutDurationMinutes: 30 },
        enabled: true,
        severity: "high",
        lastUpdated: Date.now(),
      },
      {
        id: "concurrent-sessions",
        name: "Concurrent Session Limit",
        category: "session",
        description: "Limit concurrent sessions per user",
        parameters: { maxConcurrent: 5 },
        enabled: true,
        severity: "medium",
        lastUpdated: Date.now(),
      },
      {
        id: "audit-retention",
        name: "Audit Log Retention",
        category: "audit",
        description: "Retention period for audit logs",
        parameters: { retentionDays: 365 },
        enabled: true,
        severity: "medium",
        lastUpdated: Date.now(),
      },
      {
        id: "device-trust",
        name: "Device Trust",
        category: "device",
        description: "Require device trust for sensitive operations",
        parameters: { required: false, maxUntrustedDevices: 2 },
        enabled: false,
        severity: "medium",
        lastUpdated: Date.now(),
      },
    ];
  }

  private loadApiKeys(): void {
    const stored = localStorage.getItem("eeos_api_keys");
    if (stored) {
      try {
        this.apiKeys = JSON.parse(stored);
      } catch {
        this.apiKeys = [];
      }
    }
  }

  private saveApiKeys(): void {
    localStorage.setItem("eeos_api_keys", JSON.stringify(this.apiKeys));
  }

  // ─── Event Recording ────────────────────────────────────────

  recordEvent(event: Omit<SecurityEvent, "id" | "timestamp">): SecurityEvent {
    const fullEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) this.events.pop();
    this.notifyListeners(fullEvent);
    return fullEvent;
  }

  onEvent(callback: (event: SecurityEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(event: SecurityEvent): void {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch {
        // Silently handle listener errors
      }
    });
  }

  // ─── Getters ────────────────────────────────────────────────

  getEvents(filters?: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    module?: string;
    actorId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }): SecurityEvent[] {
    let filtered = [...this.events];
    if (filters?.type) filtered = filtered.filter((e) => e.type === filters.type);
    if (filters?.severity) filtered = filtered.filter((e) => e.severity === filters.severity);
    if (filters?.module) filtered = filtered.filter((e) => e.module === filters.module);
    if (filters?.actorId) filtered = filtered.filter((e) => e.actorId === filters.actorId);
    if (filters?.startDate) filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
    if (filters?.endDate) filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 100;
    return filtered.slice(offset, offset + limit);
  }

  getPolicies(): SecurityPolicy[] {
    return [...this.policies];
  }

  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): SecurityPolicy | undefined {
    const idx = this.policies.findIndex((p) => p.id === policyId);
    if (idx === -1) return undefined;
    this.policies[idx] = { ...this.policies[idx], ...updates, lastUpdated: Date.now() };
    this.recordEvent({
      type: "policy_updated",
      severity: "high",
      module: "Security",
      entity: "policy",
      entityId: policyId,
      details: { policyName: this.policies[idx].name, updates: Object.keys(updates) },
    });
    return this.policies[idx];
  }

  getApiKeys(): ApiKeyEntry[] {
    return [...this.apiKeys];
  }

  addApiKey(key: Omit<ApiKeyEntry, "id" | "created">): ApiKeyEntry {
    const newKey: ApiKeyEntry = {
      ...key,
      id: `apik_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created: Date.now(),
    };
    this.apiKeys.unshift(newKey);
    this.saveApiKeys();
    this.recordEvent({
      type: "api_key_created",
      severity: "high",
      module: "Security",
      entity: "api_key",
      entityId: newKey.id,
      details: { name: newKey.name, scopes: newKey.scopes },
    });
    return newKey;
  }

  revokeApiKey(keyId: string): boolean {
    const key = this.apiKeys.find((k) => k.id === keyId);
    if (!key) return false;
    key.status = "revoked";
    this.saveApiKeys();
    this.recordEvent({
      type: "api_key_revoked",
      severity: "high",
      module: "Security",
      entity: "api_key",
      entityId: keyId,
      details: { name: key.name },
    });
    return true;
  }

  // ─── Session Tracking ──────────────────────────────────────

  trackSession(session: SessionInfo): void {
    this.sessions.set(session.id, session);
  }

  updateSession(sessionId: string, updates: Partial<SessionInfo>): void {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      this.sessions.set(sessionId, { ...existing, ...updates });
    }
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getActiveSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }

  getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.isActive = false;
    this.recordEvent({
      type: "session_terminated",
      severity: "high",
      module: "Security",
      entity: "session",
      entityId: sessionId,
      actorId: session.userId,
      actorName: session.userName,
      sessionId,
      details: { reason: "manual_termination" },
    });
    return true;
  }

  // ─── Login Analytics ────────────────────────────────────────

  getLoginAnalytics(): LoginAnalytics {
    const loginEvents = this.events.filter((e) => e.type === "login" || e.type === "failed_login");
    const successful = loginEvents.filter((e) => e.success !== false);
    const failed = loginEvents.filter((e) => e.success === false);

    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const hourly: number[] = new Array(24).fill(0);

    loginEvents.forEach((e) => {
      if (e.browser) browsers[e.browser] = (browsers[e.browser] || 0) + 1;
      const hour = new Date(e.timestamp).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });

    const uniqueUsers = new Set(loginEvents.map((e) => e.actorId).filter(Boolean)).size;
    const peakHour = hourly.indexOf(Math.max(...hourly));
    const totalDuration = loginEvents
      .filter((e) => e.details?.sessionDuration)
      .reduce((sum, e) => sum + (e.details?.sessionDuration as number), 0);
    const durationCount = loginEvents.filter((e) => e.details?.sessionDuration).length;

    return {
      totalLogins: loginEvents.length,
      failedLogins: failed.length,
      successfulLogins: successful.length,
      lockedAccounts: this.events.filter((e) => e.type === "account_locked").length,
      expiredSessions: this.events.filter((e) => e.type === "session_expired").length,
      uniqueUsers,
      peakHour,
      averageSessionDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      deviceTypes: devices,
      browsers,
      operatingSystems: os,
      hourlyBreakdown: hourly,
      dailyBreakdown: [],
    };
  }

  // ─── Risk Engine ────────────────────────────────────────────

  calculateRisk(target?: { userId?: string; sessionId?: string; organizationId?: string }): RiskScore {
    const factors: RiskFactor[] = [];
    const recentEvents = this.events.slice(0, 200);

    // Failed logins
    const failedLogins = recentEvents.filter(
      (e) => e.type === "failed_login" && (!target?.userId || e.actorId === target.userId)
    );
    const failedLoginScore = Math.min(failedLogins.length * 10, 100);
    factors.push({
      name: "Failed Login Attempts",
      weight: 25,
      score: failedLoginScore,
      details: `${failedLogins.length} failed attempts in recent events`,
    });

    // Permission violations
    const violations = recentEvents.filter(
      (e) => e.type === "permission_denied" && (!target?.userId || e.actorId === target.userId)
    );
    const violationScore = Math.min(violations.length * 15, 100);
    factors.push({
      name: "Permission Violations",
      weight: 20,
      score: violationScore,
      details: `${violations.length} permission violations`,
    });

    // Expired sessions
    const expiredSessions = recentEvents.filter((e) => e.type === "session_expired");
    const expiredScore = Math.min(expiredSessions.length * 5, 50);
    factors.push({
      name: "Expired Sessions",
      weight: 10,
      score: expiredScore,
      details: `${expiredSessions.length} expired sessions`,
    });

    // Session concurrency
    const activeSessions = this.getActiveSessions();
    const concurrentScore = activeSessions.length > 3 ? Math.min((activeSessions.length - 3) * 15, 100) : 0;
    factors.push({
      name: "Concurrent Sessions",
      weight: 15,
      score: concurrentScore,
      details: `${activeSessions.length} active concurrent sessions`,
    });

    // Error rate
    const errors = errorLogger?.getEntries?.()?.filter((e) => e.severity === "fatal" || e.severity === "critical") ?? [];
    const errorScore = Math.min(errors.length * 2, 50);
    factors.push({
      name: "Error Rate",
      weight: 10,
      score: errorScore,
      details: `${errors.length} critical errors in log`,
    });

    // API keys
    const activeKeys = this.apiKeys.filter((k) => k.status === "active");
    const expiredKeys = this.apiKeys.filter((k) => k.status === "expired");
    const keyScore = expiredKeys.length > 0 ? Math.min(expiredKeys.length * 10, 40) : 0;
    factors.push({
      name: "API Key Health",
      weight: 10,
      score: keyScore,
      details: `${activeKeys.length} active, ${expiredKeys.length} expired keys`,
    });

    // Unauthorized access
    const unauthorized = recentEvents.filter((e) => e.type === "unauthorized_access");
    const unauthorizedScore = Math.min(unauthorized.length * 20, 100);
    factors.push({
      name: "Unauthorized Access Attempts",
      weight: 10,
      score: unauthorizedScore,
      details: `${unauthorized.length} unauthorized access attempts`,
    });

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const overall = Math.round(
      factors.reduce((sum, f) => sum + (f.score * f.weight) / totalWeight, 0)
    );

    const userScore = overall;
    const sessionScore = Math.round(concurrentScore);
    const deviceScore = Math.round(keyScore);
    const organizationScore = Math.round(
      factors
        .filter((f) => ["Failed Login Attempts", "Permission Violations", "Error Rate"].includes(f.name))
        .reduce((s, f) => s + (f.score * f.weight) / totalWeight, 0)
    );
    const moduleScore = Math.round(violationScore);

    let label: RiskScore["label"] = "low";
    if (overall >= 70) label = "critical";
    else if (overall >= 50) label = "high";
    else if (overall >= 25) label = "medium";

    return {
      overall,
      user: userScore,
      session: sessionScore,
      device: deviceScore,
      organization: organizationScore,
      module: moduleScore,
      label,
      factors,
    };
  }

  // ─── Compliance ─────────────────────────────────────────────

  getComplianceStatus(): ComplianceStatus[] {
    const standards: ComplianceStatus[] = [
      {
        standard: "ISO 27001",
        compliancePercent: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        violations: [],
        recommendations: [],
        lastChecked: Date.now(),
      },
      {
        standard: "SOC2",
        compliancePercent: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        violations: [],
        recommendations: [],
        lastChecked: Date.now(),
      },
      {
        standard: "GDPR",
        compliancePercent: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        violations: [],
        recommendations: [],
        lastChecked: Date.now(),
      },
      {
        standard: "FERPA",
        compliancePercent: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        violations: [],
        recommendations: [],
        lastChecked: Date.now(),
      },
      {
        standard: "Internal Policy",
        compliancePercent: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        violations: [],
        recommendations: [],
        lastChecked: Date.now(),
      },
    ];

    return standards.map((s) => {
      const checkedPolicies = this.policies.filter((p) => p.enabled).length;
      const totalPolicies = this.policies.length;
      const passed = checkedPolicies;
      const failed = totalPolicies - checkedPolicies;
      const compliancePercent = totalPolicies > 0 ? Math.round((passed / totalPolicies) * 100) : 0;
      const violations: string[] = [];
      const recommendations: string[] = [];

      if (!this.policies.find((p) => p.id === "mfa-required")?.enabled) {
        recommendations.push("Enable multi-factor authentication for enhanced security");
      }
      if (this.events.filter((e) => e.type === "unauthorized_access").length > 0) {
        violations.push(`${this.events.filter((e) => e.type === "unauthorized_access").length} unauthorized access attempts detected`);
      }
      if (this.events.filter((e) => e.type === "account_locked").length > 5) {
        violations.push(`High number of locked accounts (${this.events.filter((e) => e.type === "account_locked").length})`);
      }

      return {
        ...s,
        compliancePercent,
        passed,
        failed,
        violations,
        recommendations,
        lastChecked: Date.now(),
      };
    });
  }

  // ─── Data Access Tracking ───────────────────────────────────

  trackDataAccess(event: {
    action: "viewed" | "created" | "updated" | "deleted" | "downloaded" | "exported" | "printed" | "shared";
    module: string;
    entity: string;
    entityId: string;
    userId: string;
    userName: string;
  }): void {
    this.recordEvent({
      type: "data_access",
      severity: "info",
      module: event.module,
      entity: event.entity,
      entityId: event.entityId,
      actorId: event.userId,
      actorName: event.userName,
      details: { action: event.action },
    });
  }

  getDataAccessLogs(filters?: {
    module?: string;
    action?: string;
    userId?: string;
    limit?: number;
  }): SecurityEvent[] {
    return this.getEvents({
      type: "data_access",
      module: filters?.module,
      actorId: filters?.userId,
      limit: filters?.limit ?? 100,
    });
  }

  // ─── Reports ────────────────────────────────────────────────

  generateSecurityReport(type: "daily" | "weekly" | "monthly"): Record<string, unknown> {
    const now = Date.now();
    const ranges: Record<string, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };
    const range = ranges[type] || ranges.daily;
    const startDate = now - range;

    const relevantEvents = this.events.filter((e) => e.timestamp >= startDate);
    const loginEvents = relevantEvents.filter((e) => e.type === "login" || e.type === "failed_login");
    const violations = relevantEvents.filter(
      (e) => e.type === "permission_denied" || e.type === "unauthorized_access"
    );

    return {
      reportType: type,
      generatedAt: now,
      period: { start: startDate, end: now },
      summary: {
        totalEvents: relevantEvents.length,
        successfulLogins: loginEvents.filter((e) => e.success !== false).length,
        failedLogins: loginEvents.filter((e) => e.success === false).length,
        violations: violations.length,
        apiKeysCreated: relevantEvents.filter((e) => e.type === "api_key_created").length,
        apiKeysRevoked: relevantEvents.filter((e) => e.type === "api_key_revoked").length,
        sessionsTerminated: relevantEvents.filter((e) => e.type === "session_terminated").length,
      },
      riskScore: this.calculateRisk(),
      activeSessions: this.getActiveSessions().length,
      compliance: this.getComplianceStatus(),
      topModules: this.getTopModules(relevantEvents),
    };
  }

  private getTopModules(events: SecurityEvent[]): Array<{ module: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      if (e.module) counts[e.module] = (counts[e.module] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getHealth(): { status: string; eventCount: number; policyCount: number; activeSessions: number } {
    return {
      status: this.initialized ? "healthy" : "uninitialized",
      eventCount: this.events.length,
      policyCount: this.policies.length,
      activeSessions: this.getActiveSessions().length,
    };
  }
}

export const securityEngine = new SecurityEngineClass();
