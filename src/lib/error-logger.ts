/**
 * Global Error Logger — a singleton ring buffer that captures runtime errors
 * from React error boundaries, window.onerror, and unhandled promise rejections.
 *
 * The last MAX_ERRORS entries are kept in memory for debugging. Errors are
 * also persisted to sessionStorage so they survive React re-renders.
 *
 * v2 — Adds severity classification, metadata enrichment, and query safe-call patterns.
 */
import { toast } from "sonner";

// ─── Severity Classification ───────────────────────────────────────

export type ErrorSeverity = "info" | "warning" | "error" | "critical" | "fatal";

export const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
  fatal: "bg-red-900 text-white",
};

export const SEVERITY_ORDER: Record<ErrorSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
  fatal: 4,
};

// ─── Types ──────────────────────────────────────────────────────────

export type ErrorSource = "react" | "boundary" | "global" | "promise" | "chunk" | "convex" | "sdk" | "build";

export interface ErrorMetadata {
  /** Current module name, if detectable */
  module?: string;
  /** Workspace (e.g. "CRM", "Finance") */
  workspace?: string;
  /** Current page */
  page?: string;
  /** Logged-in user ID */
  userId?: string;
  /** User role */
  userRole?: string;
  /** Organization context */
  organization?: string;
  /** Company context */
  company?: string;
  /** Branch context */
  branch?: string;
  /** SDK that produced the error */
  sdk?: string;
  /** Convex query name */
  queryName?: string;
  /** Convex mutation name */
  mutationName?: string;
  /** Entity type involved */
  entity?: string;
  /** Entity ID involved */
  entityId?: string;
  /** Browser info */
  browser?: string;
  /** Memory info (approximate) */
  memory?: string;
  /** CPU timing (performance timestamp) */
  cpuTiming?: number;
  /** React version */
  reactVersion?: string;
  /** Build version / git SHA */
  buildVersion?: string;
  /** Convex deployment */
  convexDeployment?: string;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  message: string;
  stack: string;
  source: ErrorSource;
  severity: ErrorSeverity;
  route: string;
  componentStack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  /** Running count of retries for this error */
  retryCount?: number;
  /** Arbitrary metadata for debugging context */
  metadata?: ErrorMetadata;
  /** Whether this error has been resolved / acknowledged */
  acknowledged?: boolean;
}

// ─── Classification ────────────────────────────────────────────────

const FATAL_PATTERNS = [
  "Maximum update depth exceeded",
  "Cannot read properties of null",
  "removeChild",
  "insertBefore",
  "Failed to execute",
  "Invalid hook call",
  "Should have a queue",
  "Rendered more hooks",
  "Cannot destructure property",
];

const CRITICAL_PATTERNS = [
  "ChunkLoadError",
  "Loading chunk",
  "Failed to fetch dynamically",
  "convex",
  "CONVEX",
  "Server Error",
  "ValidationError",
  "NetworkError",
  "Timeout",
  "Not Found",
  "Permission denied",
  "unauthenticated",
];

const WARNING_PATTERNS = [
  "deprecated",
  "Warning",
  "slow",
  "timeout",
  "retry",
  "offline",
];

export function classifySeverity(message: string, source: ErrorSource, stack?: string): ErrorSeverity {
  const text = `${message} ${stack || ""}`;
  if (FATAL_PATTERNS.some((p) => text.includes(p))) return "fatal";
  if (CRITICAL_PATTERNS.some((p) => text.includes(p)) || source === "convex") return "critical";
  if (WARNING_PATTERNS.some((p) => text.includes(p))) return "warning";
  if (source === "chunk") return "critical";
  if (source === "build") return "critical";
  return "error";
}

// ─── Metadata Collection ──────────────────────────────────────────

function collectMetadata(): ErrorMetadata {
  const meta: ErrorMetadata = {};
  try {
    meta.browser = navigator.userAgent?.slice(0, 120);
    meta.cpuTiming = performance.now();
    meta.reactVersion = React?.version;

    // Try to read build version from meta tag
    const buildEl = document.querySelector('meta[name="build-version"]');
    if (buildEl) meta.buildVersion = buildEl.getAttribute("content") || undefined;

    // Try to read Convex deployment URL
    if (typeof import.meta !== "undefined") {
      meta.convexDeployment = (import.meta as any).env?.VITE_CONVEX_URL as string | undefined;
    }

    // Memory info (Chrome-only)
    const perf = (performance as any).memory as Record<string, number> | undefined;
    if (perf) {
      meta.memory = `${Math.round(perf.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(perf.totalJSHeapSize / 1024 / 1024)}MB`;
    }
  } catch {
    // Best effort
  }
  return meta;
}

// ─── Ring Buffer ────────────────────────────────────────────────────

const MAX_ERRORS = 200;
const STORAGE_KEY = "__eeos_error_log_v2";

class ErrorRingBuffer {
  private entries: ErrorLogEntry[] = [];
  private idCounter = 0;

  constructor() {
    this.load();
  }

  /** Add a new error to the log with auto-classification. */
  push(
    entry: Omit<ErrorLogEntry, "id" | "timestamp" | "route" | "severity"> & { severity?: ErrorSeverity }
  ): ErrorLogEntry {
    const severity = entry.severity || classifySeverity(entry.message, entry.source, entry.stack);
    const full: ErrorLogEntry = {
      ...entry,
      severity,
      id: `err_${++this.idCounter}_${Date.now()}`,
      timestamp: Date.now(),
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      metadata: { ...collectMetadata(), ...entry.metadata },
    };
    this.entries.unshift(full);
    if (this.entries.length > MAX_ERRORS) {
      this.entries = this.entries.slice(0, MAX_ERRORS);
    }
    this.save();
    return full;
  }

  /** Return the full log, newest first. */
  getAll(): ErrorLogEntry[] {
    return this.entries;
  }

  /** Alias for getAll() — used by SecurityCenter / SecurityEngine consumers. */
  getEntries(): ErrorLogEntry[] {
    return this.entries;
  }

  /** Convenience: log an informational entry. */
  info(message: string, metadata?: ErrorMetadata): ErrorLogEntry {
    return this.push({ message, stack: "", source: "sdk", severity: "info", metadata });
  }

  /** Return only entries matching a source. */
  getBySource(source: ErrorSource): ErrorLogEntry[] {
    return this.entries.filter((e) => e.source === source);
  }

  /** Return only entries matching a severity level or higher. */
  getBySeverity(minSeverity: ErrorSeverity): ErrorLogEntry[] {
    const min = SEVERITY_ORDER[minSeverity];
    return this.entries.filter((e) => SEVERITY_ORDER[e.severity] >= min);
  }

  /** Return only the last N entries. */
  getLast(n: number): ErrorLogEntry[] {
    return this.entries.slice(0, n);
  }

  /** Clear the log. */
  clear(): void {
    this.entries = [];
    this.save();
  }

  /** Acknowledge a specific error (marks it as seen). */
  acknowledge(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) {
      entry.acknowledged = true;
      this.save();
    }
  }

  /** Retry count for the most recent error matching a message pattern. */
  incrementRetry(message: string): number {
    const recent = this.entries.find((e) => e.message === message);
    if (recent) {
      recent.retryCount = (recent.retryCount || 0) + 1;
      this.save();
      return recent.retryCount;
    }
    return 1;
  }

  /** Number of entries. */
  get count(): number {
    return this.entries.length;
  }

  /** Number of unacknowledged entries. */
  get unacknowledgedCount(): number {
    return this.entries.filter((e) => !e.acknowledged).length;
  }

  /** Export all entries as a downloadable JSON blob. */
  exportToJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        total: this.entries.length,
        entries: this.entries,
      },
      null,
      2
    );
  }

  /** Export as a markdown report (for GitHub issues). */
  exportToMarkdown(): string {
    const lines: string[] = [
      "# EEOS Error Report",
      "",
      `**Generated:** ${new Date().toISOString()}`,
      `**URL:** ${typeof window !== "undefined" ? window.location.href : "unknown"}`,
      `**Total Errors:** ${this.entries.length}`,
      "",
      "---",
      "",
    ];
    for (const entry of this.entries) {
      lines.push(`## [${entry.severity.toUpperCase()}] ${entry.message}`);
      lines.push("");
      lines.push(`- **ID:** ${entry.id}`);
      lines.push(`- **Time:** ${new Date(entry.timestamp).toISOString()}`);
      lines.push(`- **Source:** ${entry.source}`);
      lines.push(`- **Route:** ${entry.route}`);
      if (entry.metadata?.module) lines.push(`- **Module:** ${entry.metadata.module}`);
      if (entry.metadata?.sdk) lines.push(`- **SDK:** ${entry.metadata.sdk}`);
      if (entry.metadata?.queryName) lines.push(`- **Query:** ${entry.metadata.queryName}`);
      if (entry.metadata?.userRole) lines.push(`- **Role:** ${entry.metadata.userRole}`);
      if (entry.retryCount) lines.push(`- **Retries:** ${entry.retryCount}`);
      lines.push("");
      lines.push("```");
      lines.push(entry.stack || "No stack trace");
      lines.push("```");
      lines.push("");
      if (entry.componentStack) {
        lines.push("**Component Stack:**");
        lines.push("```");
        lines.push(entry.componentStack);
        lines.push("```");
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    }
    return lines.join("\n");
  }

  // ── Persistence ────────────────────────────────────────────────

  private save(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // silent
    }
  }

  private load(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
        const maxId = this.entries.reduce((max, e) => {
          const match = e.id.match(/^err_(\d+)_/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        this.idCounter = maxId;
      }
    } catch {
      this.entries = [];
    }
  }
}

/** Singleton instance, shared across the whole app. */
export const errorLog = new ErrorRingBuffer();

/**
 * Backwards-compatible alias used by SecurityEngine / AuditAggregator / SecurityCenter.
 * Same singleton instance as `errorLog`.
 */
export const errorLogger = errorLog;

/** Backwards-compatible alias for the log entry type. */
export type LogEntry = ErrorLogEntry;

// ─── Helper: extract readable stack from various error shapes ────────

export function extractStack(err: unknown): string {
  if (err instanceof Error) return err.stack || err.message || String(err);
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    return (e.stack as string) || (e.message as string) || JSON.stringify(err);
  }
  return String(err);
}

export function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    return (e.message as string) || (e.reason as string) || JSON.stringify(err);
  }
  return String(err);
}

// ─── Toast Notification ─────────────────────────────────────────────

export function notifyDevError(entry: ErrorLogEntry): void {
  if (import.meta.env.DEV || import.meta.env.MODE === "development") {
    const sevColors: Record<string, string> = {
      info: "bg-blue-50",
      warning: "bg-yellow-50",
      error: "bg-orange-50",
      critical: "bg-red-50",
      fatal: "bg-red-100",
    };
    toast.error(`[${entry.severity.toUpperCase()}] ${entry.message}`, {
      description: `${entry.route} — ${new Date(entry.timestamp).toLocaleTimeString()}`,
      duration: entry.severity === "fatal" ? 12000 : entry.severity === "critical" ? 8000 : 6000,
      action: {
        label: "Debug",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("eeos:open-debug-panel", { detail: { entryId: entry.id } }));
        },
      },
    });
  }
}

// Need React for metadata collection
import React from "react";
