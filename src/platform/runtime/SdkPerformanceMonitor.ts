/**
 * SdkPerformanceMonitor — Tracks SDK call performance, duplicates, and failures.
 *
 * Collects:
 *  - SDK name
 *  - Function name
 *  - Execution time
 *  - Success/failure
 *  - Retry count
 *
 * Exposes:
 *  - Average duration per SDK
 *  - Slowest operations
 *  - Top failing SDKs
 *  - Duplicate call detection
 */

import { RuntimeSupervisor, type HealthStatus } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface SdkCallRecord {
  sdk: string;
  function: string;
  duration: number;
  success: boolean;
  timestamp: number;
  route: string;
  args?: unknown;
}

const DUPLICATE_WINDOW_MS = 2000; // Calls within 2s to same function considered duplicate

class SdkPerformanceMonitorImpl {
  private calls: SdkCallRecord[] = [];
  private recentCalls: Map<string, number> = new Map(); // key: "sdk:function" → timestamp
  private maxRecords = 1000;
  private enabled = false;
  private _duplicateCount = 0;
  private _totalCalls = 0;

  /** Start monitoring */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    RuntimeSupervisor.registerMonitor("SDK", () => this.healthCheck());
    RuntimeSupervisor.emit("info", "SdkPerformanceMonitor", "Started monitoring SDK calls");
  }

  /** Stop monitoring */
  stop(): void {
    this.enabled = false;
    RuntimeSupervisor.unregisterMonitor("SDK");
  }

  /**
   * Record an SDK call.
   * Returns true if this was detected as a duplicate.
   */
  recordCall(record: Omit<SdkCallRecord, "timestamp" | "route">): boolean {
    if (!this.enabled) return false;

    this._totalCalls++;

    const full: SdkCallRecord = {
      ...record,
      timestamp: Date.now(),
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    };

    this.calls.push(full);
    if (this.calls.length > this.maxRecords) {
      this.calls = this.calls.slice(-this.maxRecords);
    }

    // Detect duplicates
    const key = `${record.sdk}:${record.function}`;
    const lastCall = this.recentCalls.get(key);
    const isDuplicate = lastCall !== undefined && (Date.now() - lastCall) < DUPLICATE_WINDOW_MS;

    if (isDuplicate) {
      this._duplicateCount++;
    }

    this.recentCalls.set(key, Date.now());

    // Log slow calls
    if (record.duration > 2000) {
      errorLog.push({
        message: `[SdkPerf] Slow ${record.sdk}.${record.function}: ${record.duration}ms`,
        stack: "",
        source: "sdk",
        severity: "warning",
        metadata: { sdk: record.sdk },
      });
    }

    return isDuplicate;
  }

  /** Get statistics */
  getStats(): {
    totalCalls: number;
    duplicateCount: number;
    failures: number;
    avgDuration: number;
    sdkBreakdown: Record<string, { calls: number; avgDuration: number; failures: number }>;
    slowest: SdkCallRecord[];
  } {
    const failures = this.calls.filter((c) => !c.success).length;
    const avgDuration =
      this.calls.length > 0
        ? this.calls.reduce((s, c) => s + c.duration, 0) / this.calls.length
        : 0;

    const sdkBreakdown: Record<string, { calls: number; avgDuration: number; failures: number }> = {};
    for (const call of this.calls) {
      if (!sdkBreakdown[call.sdk]) {
        sdkBreakdown[call.sdk] = { calls: 0, avgDuration: 0, failures: 0 };
      }
      sdkBreakdown[call.sdk].calls++;
      sdkBreakdown[call.sdk].avgDuration += call.duration;
      if (!call.success) sdkBreakdown[call.sdk].failures++;
    }
    for (const key of Object.keys(sdkBreakdown)) {
      sdkBreakdown[key].avgDuration = Math.round(sdkBreakdown[key].avgDuration / sdkBreakdown[key].calls);
    }

    // Top 10 slowest
    const slowest = [...this.calls].sort((a, b) => b.duration - a.duration).slice(0, 10);

    return {
      totalCalls: this._totalCalls,
      duplicateCount: this._duplicateCount,
      failures,
      avgDuration: Math.round(avgDuration),
      sdkBreakdown,
      slowest,
    };
  }

  /** Health check for RuntimeSupervisor */
  private async healthCheck() {
    const stats = this.getStats();
    return {
      name: "SDK",
      status: (stats.failures > 10 ? "warning" : stats.failures > 50 ? "critical" : "healthy") as HealthStatus,
      lastCheck: Date.now(),
      message: `${stats.totalCalls} calls, ${stats.failures} failures, ${stats.duplicateCount} duplicates`,
      details: { ...stats },
    };
  }

  /** Clear records */
  clear(): void {
    this.calls = [];
    this.recentCalls.clear();
    this._duplicateCount = 0;
    this._totalCalls = 0;
  }
}

export const sdkPerformanceMonitor = new SdkPerformanceMonitorImpl();
