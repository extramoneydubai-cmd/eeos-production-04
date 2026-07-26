/**
 * ObservabilityEngine — Core singleton that aggregates all runtime metrics
 * from RuntimeSupervisor monitors into a single unified operations data model.
 *
 * Consumes:
 *  - RuntimeMetrics (FPS, memory, latency, query/mutation counts)
 *  - SdkPerformanceMonitor (SDK calls, failures, durations)
 *  - ConvexSupervisor (connection state, latency, failures)
 *  - SlowQueryDetector (slow queries/mutations/dashboards)
 *  - NavigationSupervisor (route transitions, failures)
 *  - MemoryLeakDetector (memory trends)
 *  - EventPipelineWatchdog (pipeline events)
 *  - ErrorLogger (error counts by severity)
 *  - ProductionReadinessManager (readiness state)
 *  - FeatureFlagManager (flag states)
 *  - BuildVersionManager (build info)
 */

import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";
import { runtimeMetrics } from "@/platform/runtime/RuntimeMetrics";
import { sdkPerformanceMonitor } from "@/platform/runtime/SdkPerformanceMonitor";
import { convexSupervisor } from "@/platform/runtime/ConvexSupervisor";
import { slowQueryDetector } from "@/platform/runtime/SlowQueryDetector";
import { navigationSupervisor } from "@/platform/runtime/NavigationSupervisor";
import { memoryLeakDetector } from "@/platform/runtime/MemoryLeakDetector";
import { eventPipelineWatchdog } from "@/platform/runtime/EventPipelineWatchdog";
import { errorLog } from "@/lib/error-logger";
import { productionReadinessManager } from "@/platform/release/ProductionReadinessManager";
import { buildVersionManager } from "@/platform/release/BuildVersionManager";
import { cacheManager } from "@/platform/release/CacheManager";

export interface OperationsSnapshot {
  timestamp: number;
  uptime: number;
  platform: PlatformMetrics;
  runtime: RuntimeMetricsData;
  convex: ConvexMetrics;
  sdk: SdkMetrics;
  queries: QueryMetrics;
  pipeline: PipelineMetrics;
  errors: ErrorMetrics;
  memory: MemoryMetrics;
  navigation: NavigationMetrics;
}

export interface PlatformMetrics {
  version: string;
  buildNumber: string;
  environment: string;
  releaseChannel: string;
  readinessState: string;
  readinessScore: number;
}

export interface RuntimeMetricsData {
  fps: number;
  memoryMB: number;
  totalMemoryMB: number;
  convexLatency: number;
  sdkLatency: number;
  totalQueries: number;
  totalMutations: number;
  avgRouteLoad: number;
  avgFps: number;
  avgMemoryMB: number;
}

export interface ConvexMetrics {
  state: string;
  latency: number;
  reconnectAttempts: number;
  queryFailures: number;
  mutationFailures: number;
}

export interface SdkMetrics {
  totalCalls: number;
  failures: number;
  duplicateCount: number;
  avgDuration: number;
  breakdown: Record<string, { calls: number; avgDuration: number; failures: number }>;
}

export interface QueryMetrics {
  totalSlow: number;
  criticalCount: number;
  avgDuration: number;
  byType: Record<string, { count: number; avgDuration: number }>;
}

export interface PipelineMetrics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  byType: Record<string, { total: number; failed: number }>;
}

export interface ErrorMetrics {
  total: number;
  fatal: number;
  critical: number;
  warning: number;
  error: number;
  info: number;
}

export interface MemoryMetrics {
  usedMB: number;
  totalMB: number;
  consecutiveGrowth: number;
  warnings: string[];
}

export interface NavigationMetrics {
  totalTransitions: number;
  failed: number;
  avgDuration: number;
}

class ObservabilityEngineImpl {
  private _lastSnapshot: OperationsSnapshot | null = null;
  private listeners: Set<(snapshot: OperationsSnapshot) => void> = new Set();
  private enabled = false;
  private collectTimer: ReturnType<typeof setInterval> | null = null;

  /** Get the last captured snapshot */
  get lastSnapshot(): OperationsSnapshot | null {
    return this._lastSnapshot;
  }

  /** Start collecting observability data */
  start(intervalMs = 5000): void {
    if (this.enabled) return;
    this.enabled = true;

    this.collect();
    this.collectTimer = setInterval(() => this.collect(), intervalMs);

    RuntimeSupervisor.emit("info", "ObservabilityEngine", "Started collecting observability data");
  }

  /** Stop */
  stop(): void {
    this.enabled = false;
    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = null;
    }
  }

  /** Subscribe to snapshot updates */
  subscribe(listener: (snapshot: OperationsSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Collect a snapshot of all metrics */
  collect(): OperationsSnapshot {
    const metrics = runtimeMetrics.getAggregates();
    const sdkStats = sdkPerformanceMonitor.getStats();
    const queryStats = slowQueryDetector.getStats();
    const pipelineStats = eventPipelineWatchdog.getStats();
    const navStats = navigationSupervisor.getStats();
    const memTrend = memoryLeakDetector.getTrend();
    const errors = errorLog.getAll();
    const buildInfo = buildVersionManager.getBuildInfo();
    const readiness = productionReadinessManager.report;

    const snapshot: OperationsSnapshot = {
      timestamp: Date.now(),
      uptime: RuntimeSupervisor.uptime,
      platform: {
        version: buildInfo.version,
        buildNumber: buildInfo.buildNumber,
        environment: buildInfo.environment,
        releaseChannel: buildInfo.releaseChannel,
        readinessState: readiness?.state || "unknown",
        readinessScore: readiness?.score || 0,
      },
      runtime: {
        fps: runtimeMetrics.fps,
        memoryMB: runtimeMetrics.memoryMB,
        totalMemoryMB: 0,
        convexLatency: runtimeMetrics.convexLatency,
        sdkLatency: 0,
        totalQueries: metrics.totalQueries,
        totalMutations: metrics.totalMutations,
        avgRouteLoad: metrics.avgRouteLoad,
        avgFps: metrics.avgFps,
        avgMemoryMB: metrics.avgMemoryMB,
      },
      convex: {
        state: convexSupervisor.state,
        latency: convexSupervisor.latency,
        reconnectAttempts: convexSupervisor.reconnectAttempts,
        queryFailures: convexSupervisor.queryFailures,
        mutationFailures: convexSupervisor.mutationFailures,
      },
      sdk: {
        totalCalls: sdkStats.totalCalls,
        failures: sdkStats.failures,
        duplicateCount: sdkStats.duplicateCount,
        avgDuration: sdkStats.avgDuration,
        breakdown: sdkStats.sdkBreakdown,
      },
      queries: {
        totalSlow: queryStats.total,
        criticalCount: queryStats.criticalCount,
        avgDuration: queryStats.avgDuration,
        byType: queryStats.byType,
      },
      pipeline: {
        total: pipelineStats.total,
        completed: pipelineStats.completed,
        failed: pipelineStats.failed,
        pending: pipelineStats.pending,
        byType: pipelineStats.byType,
      },
      errors: {
        total: errors.length,
        fatal: errors.filter((e) => e.severity === "fatal").length,
        critical: errors.filter((e) => e.severity === "critical").length,
        warning: errors.filter((e) => e.severity === "warning").length,
        error: errors.filter((e) => e.severity === "error").length,
        info: errors.filter((e) => e.severity === "info").length,
      },
      memory: {
        usedMB: runtimeMetrics.memoryMB,
        totalMB: 0,
        consecutiveGrowth: memTrend.growth,
        warnings: [],
      },
      navigation: {
        totalTransitions: navStats.total,
        failed: navStats.failed,
        avgDuration: Math.round(navStats.avgDuration),
      },
    };

    this._lastSnapshot = snapshot;
    this.listeners.forEach((l) => l(snapshot));
    return snapshot;
  }

  /** Calculate the operations score 0-100 */
  calculateScore(): { score: number; label: string } {
    const snapshot = this.collect();
    let score = 100;

    // Runtime deductions
    if (snapshot.runtime.fps < 30) score -= 10;
    if (snapshot.runtime.fps < 15) score -= 10;
    if (snapshot.runtime.memoryMB > 200) score -= 5;
    if (snapshot.runtime.memoryMB > 500) score -= 10;

    // Convex deductions
    if (snapshot.convex.state !== "connected") score -= 15;
    if (snapshot.convex.latency > 1000) score -= 5;
    if (snapshot.convex.latency > 3000) score -= 10;
    if (snapshot.convex.reconnectAttempts > 3) score -= 10;

    // SDK deductions
    if (snapshot.sdk.failures > 10) score -= 10;
    if (snapshot.sdk.failures > 50) score -= 10;
    if (snapshot.sdk.avgDuration > 1000) score -= 5;

    // Query deductions
    if (snapshot.queries.criticalCount > 5) score -= 10;
    if (snapshot.queries.criticalCount > 20) score -= 10;

    // Pipeline deductions
    if (snapshot.pipeline.failed > 10) score -= 5;
    if (snapshot.pipeline.failed > 50) score -= 10;

    // Error deductions
    if (snapshot.errors.fatal > 0) score -= 20;
    if (snapshot.errors.critical > 5) score -= 10;
    if (snapshot.errors.critical > 20) score -= 10;

    // Navigation deductions
    if (snapshot.navigation.failed > 5) score -= 5;
    if (snapshot.navigation.failed > 20) score -= 10;

    score = Math.max(0, Math.min(100, score));

    const label =
      score >= 90 ? "Excellent"
        : score >= 75 ? "Good"
          : score >= 55 ? "Fair"
            : score >= 35 ? "Poor"
              : "Critical";

    return { score, label };
  }
}

export const observabilityEngine = new ObservabilityEngineImpl();

import { useState, useEffect } from "react";

export function useObservabilitySnapshot(): OperationsSnapshot | null {
  const [snapshot, setSnapshot] = useState<OperationsSnapshot | null>(null);

  useEffect(() => {
    const unsub = observabilityEngine.subscribe(setSnapshot);
    return unsub;
  }, []);

  return snapshot;
}
