/**
 * SlowQueryDetector — Detects slow Convex queries and mutations.
 *
 * Thresholds:
 *  - Query: >500ms warning, >2s critical
 *  - Mutation: >1s warning, >5s critical
 *  - Dashboard: >3s warning
 *
 * Logs all slow operations with route/sdk/entity context.
 */

import { RuntimeSupervisor } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface SlowOperation {
  type: "query" | "mutation" | "dashboard";
  name: string;
  duration: number;
  route: string;
  entity?: string;
  timestamp: number;
  severity: "warning" | "critical";
}

const THRESHOLDS = {
  query: { warning: 500, critical: 2000 },
  mutation: { warning: 1000, critical: 5000 },
  dashboard: { warning: 3000, critical: 10000 },
};

class SlowQueryDetectorImpl {
  private operations: SlowOperation[] = [];
  private maxRecords = 100;
  private enabled = false;

  /** Start monitoring */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    RuntimeSupervisor.registerMonitor("SlowQuery", () => this.healthCheck());
    RuntimeSupervisor.emit("info", "SlowQueryDetector", "Started monitoring slow queries");
  }

  /** Stop monitoring */
  stop(): void {
    this.enabled = false;
    RuntimeSupervisor.unregisterMonitor("SlowQuery");
  }

  /**
   * Record a slow operation.
   */
  record(operation: {
    type: "query" | "mutation" | "dashboard";
    name: string;
    duration: number;
    entity?: string;
  }): void {
    if (!this.enabled) return;

    const thresholds = THRESHOLDS[operation.type];
    if (operation.duration < thresholds.warning) return;

    const severity: "warning" | "critical" =
      operation.duration >= thresholds.critical ? "critical" : "warning";

    const record: SlowOperation = {
      ...operation,
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      timestamp: Date.now(),
      severity,
    };

    this.operations.push(record);
    if (this.operations.length > this.maxRecords) {
      this.operations = this.operations.slice(-this.maxRecords);
    }

    // Log to error system
    errorLog.push({
      message: `[Slow${operation.type === "dashboard" ? "Dashboard" : operation.type === "query" ? "Query" : "Mutation"}] ${operation.name} took ${operation.duration}ms`,
      stack: "",
      source: "convex",
      severity,
      metadata: {
        entity: operation.entity,
        module: operation.type === "dashboard" ? "Dashboard" : operation.type === "query" ? "Query" : "Mutation",
      },
    });

    if (severity === "critical") {
      RuntimeSupervisor.emit("failure", "SlowQueryDetector", `Critical slow ${operation.type}: ${operation.name} (${operation.duration}ms)`);
    } else {
      RuntimeSupervisor.emit("warning", "SlowQueryDetector", `Slow ${operation.type}: ${operation.name} (${operation.duration}ms)`);
    }
  }

  /** Get recent slow operations */
  getRecent(): SlowOperation[] {
    return [...this.operations];
  }

  /** Get statistics */
  getStats(): { total: number; avgDuration: number; criticalCount: number; byType: Record<string, { count: number; avgDuration: number }> } {
    const total = this.operations.length;
    const avgDuration = total > 0 ? this.operations.reduce((s, o) => s + o.duration, 0) / total : 0;
    const criticalCount = this.operations.filter((o) => o.severity === "critical").length;

    const byType: Record<string, { count: number; avgDuration: number }> = {};
    for (const op of this.operations) {
      if (!byType[op.type]) byType[op.type] = { count: 0, avgDuration: 0 };
      byType[op.type].count++;
      byType[op.type].avgDuration += op.duration;
    }
    for (const key of Object.keys(byType)) {
      byType[key].avgDuration = Math.round(byType[key].avgDuration / byType[key].count);
    }

    return { total, avgDuration: Math.round(avgDuration), criticalCount, byType };
  }

  /** Health check */
  private async healthCheck() {
    const stats = this.getStats();
    return {
      name: "SlowQuery",
      status: stats.criticalCount > 5 ? "warning" : stats.total > 0 ? "healthy" : "healthy",
      lastCheck: Date.now(),
      message: `${stats.total} slow ops, ${stats.criticalCount} critical`,
      details: { ...stats },
    };
  }

  /** Clear */
  clear(): void {
    this.operations = [];
  }
}

export const slowQueryDetector = new SlowQueryDetectorImpl();
