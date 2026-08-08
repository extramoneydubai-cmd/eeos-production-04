/**
 * BuildHealth — runtime diagnostics for the current build.
 * Shows git SHA, build time, environment, Convex deployment, etc.
 */

export interface BuildInfo {
  /** Build version (from meta tag or import.meta.env) */
  version: string;
  /** Git SHA (from meta tag or VITE_GIT_SHA) */
  gitSha: string;
  /** Build timestamp */
  buildTime: string;
  /** Current environment (development, production) */
  environment: string;
  /** Convex URL */
  convexUrl: string;
  /** Convex deployment name */
  convexDeployment: string;
  /** React version */
  reactVersion: string;
  /** Node.js version (if available) */
  nodeVersion: string;
  /** Browser user agent */
  browser: string;
  /** Platform (OS) */
  platform: string;
  /** Current memory usage */
  memory: string;
}

function getMetaContent(name: string): string {
  try {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute("content") || "";
  } catch {
    return "";
  }
}

/**
 * Collect current build information.
 */
export function getBuildInfo(): BuildInfo {
  const env = import.meta.env as Record<string, unknown>;
  return {
    version: getMetaContent("build-version") || (env.VITE_BUILD_VERSION as string) || "unknown",
    gitSha: getMetaContent("git-sha") || (env.VITE_GIT_SHA as string) || "unknown",
    buildTime: getMetaContent("build-time") || (env.VITE_BUILD_TIME as string) || new Date().toISOString(),
    environment: (env.MODE as string) || "unknown",
    convexUrl: (env.VITE_CONVEX_URL as string) || "unknown",
    convexDeployment: (env.CONVEX_DEPLOYMENT as string) || (env.VITE_CONVEX_URL as string)?.split(".convex.cloud")[0]?.split("//")[1] || "unknown",
    reactVersion: "19",
    nodeVersion: (env.VITE_NODE_VERSION as string) || "unknown",
    browser: typeof navigator !== "undefined" ? navigator.userAgent?.slice(0, 150) : "unknown",
    platform: typeof navigator !== "undefined" ? navigator.platform || "unknown" : "unknown",
    memory: (() => {
      try {
        const perf = (performance as unknown as Record<string, unknown>).memory as Record<string, number>;
        if (perf) return `${Math.round(perf.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(perf.totalJSHeapSize / 1024 / 1024)}MB`;
      } catch {}
      return "N/A";
    })(),
  };
}

/**
 * Validate that the current build is consistent.
 * Returns an array of any issues found.
 */
export function validateBuild(): string[] {
  const issues: string[] = [];
  const info = getBuildInfo();

  if (!info.version || info.version === "unknown") {
    issues.push("Build version is not set (add <meta name='build-version'> or VITE_BUILD_VERSION)");
  }

  if (!import.meta.env.VITE_CONVEX_URL) {
    issues.push("VITE_CONVEX_URL is not set — Convex queries will fail");
  }

  if (typeof React === "undefined") {
    issues.push("React is not loaded");
  }

  try {
    const root = document.getElementById("root");
    if (!root) issues.push("Root element (#root) not found in DOM");
  } catch {}

  if (!import.meta.env.MODE) {
    issues.push("Environment mode is not detected");
  }

  return issues;
}

/**
 * Health check result for the diagnostics panel.
 */
export interface HealthCheckResult {
  component: string;
  status: "healthy" | "degraded" | "down";
  message: string;
  details?: string;
}

/**
 * Run all health checks.
 */
export function runHealthChecks(): HealthCheckResult[] {
  const results: HealthCheckResult[] = [];

  // React health
  try {
    if (typeof React !== "undefined") {
      results.push({ component: "React", status: "healthy", message: `v19 loaded` });
    } else {
      results.push({ component: "React", status: "down", message: "Not loaded" });
    }
  } catch {
    results.push({ component: "React", status: "down", message: "Error checking" });
  }

  // Convex health
  if (import.meta.env.VITE_CONVEX_URL) {
    results.push({
      component: "Convex",
      status: "healthy",
      message: "URL configured",
      details: import.meta.env.VITE_CONVEX_URL as string,
    });
  } else {
    results.push({ component: "Convex", status: "down", message: "URL not configured" });
  }

  // DOM health
  try {
    const root = document.getElementById("root");
    results.push({
      component: "DOM",
      status: root ? "healthy" : "down",
      message: root ? "Root element present" : "Root element missing",
    });
  } catch {
    results.push({ component: "DOM", status: "down", message: "Error checking DOM" });
  }

  // Router health
  try {
    const nav = typeof navigator !== "undefined";
    results.push({
      component: "Router",
      status: nav ? "healthy" : "degraded",
      message: nav ? "Browser API available" : "No browser API",
    });
  } catch {
    results.push({ component: "Router", status: "degraded", message: "Error checking" });
  }

  return results;
}

import React from "react";
