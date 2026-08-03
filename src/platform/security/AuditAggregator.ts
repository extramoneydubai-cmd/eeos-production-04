/**
 * AuditAggregator — Enterprise Audit Log Aggregation
 *
 * Aggregates audit events from multiple sources:
 * - SecurityEngine security events
 * - Event Pipeline audit events
 * - Runtime Supervisor errors
 * - Platform SDK calls
 *
 * Provides filtering, searching, and export capabilities.
 */

import { securityEngine, type SecurityEvent } from "./SecurityEngine";
import { errorLogger } from "../../lib/error-logger";

export interface AuditEntry {
  id: string;
  timestamp: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  actorId?: string;
  actorName?: string;
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  module: string;
  entity?: string;
  entityId?: string;
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  browser?: string;
  sessionId?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  source: "security" | "pipeline" | "user_action" | "system" | "sdk";
}

export interface AuditFilter {
  types?: string[];
  severities?: string[];
  modules?: string[];
  actors?: string[];
  entities?: string[];
  startDate?: number;
  endDate?: number;
  query?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

class AuditAggregatorClass {
  private entries: AuditEntry[] = [];
  private maxEntries = 10000;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Subscribe to security events
    securityEngine.onEvent((event) => {
      this.ingestSecurityEvent(event);
    });

    errorLogger.info("AuditAggregator initialized", { module: "AuditAggregator" });
  }

  private ingestSecurityEvent(event: SecurityEvent): void {
    const entry: AuditEntry = {
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      severity: event.severity,
      actorId: event.actorId,
      actorName: event.actorName,
      organizationId: event.organizationId,
      companyId: event.companyId,
      branchId: event.branchId,
      departmentId: event.departmentId,
      module: event.module || "Security",
      entity: event.entity,
      entityId: event.entityId,
      action: event.type,
      before: event.before,
      after: event.after,
      ip: event.ip,
      browser: event.browser,
      sessionId: event.sessionId,
      correlationId: event.correlationId,
      details: event.details,
      source: "security",
    };
    this.addEntry(entry);
  }

  ingestEntry(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
    const fullEntry: AuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.addEntry(fullEntry);
    return fullEntry;
  }

  private addEntry(entry: AuditEntry): void {
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) this.entries.pop();
  }

  getEntries(filters?: AuditFilter): AuditEntry[] {
    let filtered = [...this.entries];

    if (filters?.types?.length) filtered = filtered.filter((e) => filters.types!.includes(e.type));
    if (filters?.severities?.length) filtered = filtered.filter((e) => filters.severities!.includes(e.severity));
    if (filters?.modules?.length) filtered = filtered.filter((e) => e.module && filters.modules!.includes(e.module));
    if (filters?.actors?.length) filtered = filtered.filter((e) => e.actorId && filters.actors!.includes(e.actorId));
    if (filters?.entities?.length) filtered = filtered.filter((e) => e.entity && filters.entities!.includes(e.entity));
    if (filters?.source) filtered = filtered.filter((e) => e.source === filters.source);
    if (filters?.startDate) filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
    if (filters?.endDate) filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.type.toLowerCase().includes(q) ||
          e.module.toLowerCase().includes(q) ||
          e.entity?.toLowerCase().includes(q) ||
          e.actorName?.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
      );
    }

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    return filtered.slice(offset, offset + limit);
  }

  getEntry(id: string): AuditEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  getModules(): string[] {
    const modules = new Set(this.entries.map((e) => e.module).filter((m): m is string => Boolean(m)));
    return Array.from(modules).sort();
  }

  getEntityTypes(): string[] {
    const types = new Set(this.entries.map((e) => e.entity).filter((t): t is string => Boolean(t)));
    return Array.from(types).sort();
  }

  getEventTypes(): string[] {
    const types = new Set(this.entries.map((e) => e.type));
    return Array.from(types).sort();
  }

  search(query: string, limit = 50): AuditEntry[] {
    return this.getEntries({ query, limit });
  }

  getByEntity(entity: string, entityId?: string, limit = 50): AuditEntry[] {
    return this.entries
      .filter((e) => e.entity === entity && (!entityId || e.entityId === entityId))
      .slice(0, limit);
  }

  getByUser(userId: string, limit = 50): AuditEntry[] {
    return this.entries.filter((e) => e.actorId === userId).slice(0, limit);
  }

  clear(): void {
    this.entries = [];
  }

  getTotalCount(): number {
    return this.entries.length;
  }

  getHealth(): { status: string; entryCount: number } {
    return {
      status: this.initialized ? "healthy" : "uninitialized",
      entryCount: this.entries.length,
    };
  }
}

export const auditAggregator = new AuditAggregatorClass();
