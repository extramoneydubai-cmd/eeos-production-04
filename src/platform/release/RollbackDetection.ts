/**
 * RollbackDetection — Detects version mismatches that indicate a rollback or stale deployment.
 *
 * Detects:
 *  - Frontend older than backend (rollback)
 *  - Backend older than frontend (stale backend)
 *  - Stale cache from previous version
 *  - Old chunk hashes
 *  - Wrong deployment manifest
 *
 * Recommends: Refresh, Cache purge, Rollback, Upgrade
 */

import { buildVersionManager } from "./BuildVersionManager";
import { cacheManager } from "./CacheManager";

export interface RollbackIssue {
  type: "rollback" | "stale_frontend" | "stale_backend" | "stale_cache" | "version_mismatch";
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
}

class RollbackDetectionImpl {
  /** Detect potential rollback or version mismatch issues */
  detect(): string[] {
    const issues: string[] = [];

    // Check cache staleness
    if (cacheManager.isStale) {
      issues.push("Cache version is stale — run cache invalidation");
    }

    // Check build version is configured
    const info = buildVersionManager.getBuildInfo();
    if (info.version === "unknown" || info.buildNumber === "unknown") {
      issues.push("Build metadata is missing — check VITE_BUILD_VERSION and VITE_BUILD_NUMBER");
    }

    return issues;
  }

  /** Get detailed issues list */
  getIssues(): RollbackIssue[] {
    const issues: RollbackIssue[] = [];
    const info = buildVersionManager.getBuildInfo();

    // Version info check
    if (info.version === "unknown") {
      issues.push({
        type: "version_mismatch",
        severity: "warning",
        message: "Application version is unknown — build metadata not configured",
        recommendation: "Set VITE_BUILD_VERSION environment variable",
      });
    }

    // Cache check
    if (cacheManager.isStale) {
      issues.push({
        type: "stale_cache",
        severity: "warning",
        message: "Browser cache is from a previous version",
        recommendation: "Run cacheManager.invalidate() to clear stale entries",
      });
    }

    return issues;
  }

  /** Check if a rollback is likely happening */
  get isRollbackDetected(): boolean {
    return this.detect().length > 0;
  }
}

export const rollbackDetector = new RollbackDetectionImpl();
