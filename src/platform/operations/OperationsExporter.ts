/**
 * OperationsExporter — Generates downloadable exports from operations snapshots.
 *
 * Supports: JSON, Markdown, CSV
 *
 * Export types:
 *  - Operations Snapshot (full)
 *  - Performance Report
 *  - Error Report
 *  - Runtime Report
 */

import type { OperationsSnapshot } from "./ObservabilityEngine";

class OperationsExporterImpl {
  /** Export full operations snapshot as JSON */
  exportToJson(snapshot: OperationsSnapshot): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      snapshot,
    }, null, 2);
  }

  /** Export performance report as Markdown */
  exportPerformanceReport(snapshot: OperationsSnapshot): string {
    const score = scoreLabel(snapshot);
    return [
      `# EEOS Performance Report`,
      ``,
      `**Generated:** ${new Date().toISOString()}`,
      `**Uptime:** ${Math.round(snapshot.uptime / 1000)}s`,
      `**Operations Score:** ${score.score}/100 — ${score.label}`,
      ``,
      `## Runtime`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| FPS | ${snapshot.runtime.fps} |`,
      `| Memory | ${snapshot.runtime.memoryMB} MB |`,
      `| Avg Route Load | ${snapshot.runtime.avgRouteLoad}ms |`,
      `| Total Queries | ${snapshot.runtime.totalQueries} |`,
      `| Total Mutations | ${snapshot.runtime.totalMutations} |`,
      ``,
      `## Convex`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| State | ${snapshot.convex.state} |`,
      `| Latency | ${snapshot.convex.latency}ms |`,
      `| Reconnects | ${snapshot.convex.reconnectAttempts} |`,
      `| Query Failures | ${snapshot.convex.queryFailures} |`,
      `| Mutation Failures | ${snapshot.convex.mutationFailures} |`,
      ``,
      `## SDK`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Calls | ${snapshot.sdk.totalCalls} |`,
      `| Failures | ${snapshot.sdk.failures} |`,
      `| Avg Duration | ${snapshot.sdk.avgDuration}ms |`,
      `| Duplicates | ${snapshot.sdk.duplicateCount} |`,
      ``,
      `## Errors`,
      ``,
      `| Severity | Count |`,
      `|----------|-------|`,
      `| Fatal | ${snapshot.errors.fatal} |`,
      `| Critical | ${snapshot.errors.critical} |`,
      `| Error | ${snapshot.errors.error} |`,
      `| Warning | ${snapshot.errors.warning} |`,
      `| Info | ${snapshot.errors.info} |`,
      ``,
      `## Navigation`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Transitions | ${snapshot.navigation.totalTransitions} |`,
      `| Failed | ${snapshot.navigation.failed} |`,
      `| Avg Duration | ${snapshot.navigation.avgDuration}ms |`,
      ``,
    ].join("\n");
  }

  /** Export error report as Markdown */
  exportErrorReport(snapshot: OperationsSnapshot): string {
    return [
      `# EEOS Error Report`,
      ``,
      `**Generated:** ${new Date().toISOString()}`,
      `**Total Errors:** ${snapshot.errors.total}`,
      ``,
      `| Severity | Count |`,
      `|----------|-------|`,
      `| 🔴 Fatal | ${snapshot.errors.fatal} |`,
      `| 🟠 Critical | ${snapshot.errors.critical} |`,
      `| 🟡 Error | ${snapshot.errors.error} |`,
      `| 🟢 Warning | ${snapshot.errors.warning} |`,
      `| 🔵 Info | ${snapshot.errors.info} |`,
      ``,
    ].join("\n");
  }

  /** Export runtime report as Markdown */
  exportRuntimeReport(snapshot: OperationsSnapshot): string {
    return this.exportPerformanceReport(snapshot);
  }

  /** Export as CSV (flat) */
  exportToCsv(snapshot: OperationsSnapshot): string {
    const rows: string[] = [];
    const header = "metric,value,timestamp";
    rows.push(header);

    for (const [key, val] of Object.entries(snapshot.runtime)) {
      rows.push(`runtime.${key},${val},${snapshot.timestamp}`);
    }
    for (const [key, val] of Object.entries(snapshot.convex)) {
      rows.push(`convex.${key},${val},${snapshot.timestamp}`);
    }
    for (const [key, val] of Object.entries(snapshot.errors)) {
      rows.push(`errors.${key},${val},${snapshot.timestamp}`);
    }

    return rows.join("\n");
  }
}

function scoreLabel(snapshot: OperationsSnapshot): { score: number; label: string } {
  // Simplified score calculation for export context
  let score = 100;
  if (snapshot.runtime.fps < 30) score -= 15;
  if (snapshot.convex.state !== "connected") score -= 20;
  if (snapshot.sdk.failures > 10) score -= 10;
  if (snapshot.errors.fatal > 0) score -= 20;
  if (snapshot.errors.critical > 5) score -= 10;
  if (snapshot.navigation.failed > 5) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const label = score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 55 ? "Fair" : score >= 35 ? "Poor" : "Critical";
  return { score, label };
}

export const operationsExporter = new OperationsExporterImpl();
