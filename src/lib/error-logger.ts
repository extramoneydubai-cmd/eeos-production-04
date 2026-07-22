/**
 * Global Error Logger — a singleton ring buffer that captures runtime errors
 * from React error boundaries, window.onerror, and unhandled promise rejections.
 *
 * The last MAX_ERRORS entries are kept in memory for debugging. Errors are
 * also persisted to sessionStorage so they survive React re-renders.
 *
 * Usage (in any component):
 *   import { errorLog } from "@/lib/error-logger";
 *   errorLog.push({ message: "...", stack: "..." });
 */
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  message: string;
  stack: string;
  source: "react" | "boundary" | "global" | "promise";
  route: string;
  componentStack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

// ─── Ring Buffer ────────────────────────────────────────────────────

const MAX_ERRORS = 100;
const STORAGE_KEY = "__eeos_error_log";

class ErrorRingBuffer {
  private entries: ErrorLogEntry[] = [];
  private idCounter = 0;

  constructor() {
    this.load();
  }

  /** Add a new error to the log. Also persists to sessionStorage. */
  push(entry: Omit<ErrorLogEntry, "id" | "timestamp" | "route">): ErrorLogEntry {
    const full: ErrorLogEntry = {
      ...entry,
      id: `err_${++this.idCounter}_${Date.now()}`,
      timestamp: Date.now(),
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    };
    this.entries.unshift(full);
    // Trim to max
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

  /** Return only the last N entries. */
  getLast(n: number): ErrorLogEntry[] {
    return this.entries.slice(0, n);
  }

  /** Clear the log. */
  clear(): void {
    this.entries = [];
    this.save();
  }

  /** Number of entries. */
  get count(): number {
    return this.entries.length;
  }

  // ── Persistence ────────────────────────────────────────────────

  private save(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // sessionStorage might be full or blocked — silently ignore
    }
  }

  private load(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
        // Restore the counter to avoid ID collisions
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

// ─── Helper: show a toast for critical runtime errors ────────────────

export function notifyDevError(entry: ErrorLogEntry): void {
  // Only show in dev mode to avoid annoying users in production
  if (import.meta.env.DEV || import.meta.env.MODE === "development") {
    toast.error(`[${entry.source}] ${entry.message}`, {
      description: `${entry.route} — ${new Date(entry.timestamp).toLocaleTimeString()}`,
      duration: 6000,
      action: {
        label: "Debug",
        onClick: () => {
          // Dispatch a custom event that the DebugPanel listens for
          window.dispatchEvent(new CustomEvent("eeos:open-debug-panel", { detail: { entryId: entry.id } }));
        },
      },
    });
  }
}
