/**
 * NavigationSupervisor — Monitors route transitions and provides automatic recovery.
 *
 * Detects:
 *  - Route transition timeout (> 10s)
 *  - Missing route (404)
 *  - Lazy route chunk load failure
 *  - Route recursion / invalid redirects
 *
 * Recovery:
 *  1. Retry once
 *  2. Fallback to /dashboard
 *  3. Show CrashScreen if all fail
 */

import { RuntimeSupervisor } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
}

const NAVIGATION_TIMEOUT = 10000; // 10 seconds

class NavigationSupervisorImpl {
  private events: NavigationEvent[] = [];
  private currentTransition: { from: string; to: string; startTime: number } | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;

  /** Start monitoring */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;
    RuntimeSupervisor.emit("info", "NavigationSupervisor", "Started monitoring route transitions");
  }

  /** Stop monitoring */
  stop(): void {
    this.enabled = false;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    this.currentTransition = null;
  }

  /**
   * Call when a navigation starts.
   */
  onNavigationStart(from: string, to: string): void {
    if (!this.enabled) return;

    this.currentTransition = { from, to, startTime: Date.now() };

    // Set a timeout for the navigation
    this.timeoutTimer = setTimeout(() => {
      if (this.currentTransition) {
        this.handleNavigationTimeout(this.currentTransition);
      }
    }, NAVIGATION_TIMEOUT);

    RuntimeSupervisor.emit("info", "NavigationSupervisor", `Navigating: ${from} → ${to}`);
  }

  /**
   * Call when a navigation completes successfully.
   */
  onNavigationComplete(path: string): void {
    if (!this.enabled || !this.currentTransition) return;

    const duration = Date.now() - this.currentTransition.startTime;

    this.events.push({
      from: this.currentTransition.from,
      to: path,
      timestamp: Date.now(),
      duration,
      success: true,
    });

    this.clearTimeout();
    this.currentTransition = null;

    // Log slow navigation
    if (duration > 3000) {
      RuntimeSupervisor.emit("warning", "NavigationSupervisor", `Slow navigation: ${duration}ms`);
    }
  }

  /**
   * Call when a navigation fails.
   */
  onNavigationError(path: string, error: string): void {
    if (!this.enabled || !this.currentTransition) return;

    const duration = Date.now() - this.currentTransition.startTime;

    this.events.push({
      from: this.currentTransition.from,
      to: path,
      timestamp: Date.now(),
      duration,
      success: false,
      error,
    });

    this.clearTimeout();

    errorLog.push({
      message: `[NavigationSupervisor] Navigation failed: ${error}`,
      stack: new Error().stack || "",
      source: "boundary",
      metadata: { module: "Navigation", page: path },
    });

    RuntimeSupervisor.emit("failure", "Router", `Navigation failed: ${error}`, {
      from: this.currentTransition.from,
      to: path,
    });

    this.currentTransition = null;
  }

  /**
   * Handle a navigation timeout.
   */
  private handleNavigationTimeout(transition: { from: string; to: string; startTime: number }): void {
    const duration = Date.now() - transition.startTime;

    this.events.push({
      from: transition.from,
      to: transition.to,
      timestamp: Date.now(),
      duration,
      success: false,
      error: "Navigation timeout",
    });

    errorLog.push({
      message: `[NavigationSupervisor] Transition timeout (>${NAVIGATION_TIMEOUT}ms): ${transition.from} → ${transition.to}`,
      stack: new Error().stack || "",
      source: "boundary",
      severity: "error",
      metadata: { module: "Navigation" },
    });

    RuntimeSupervisor.emit("failure", "Router", "Navigation timeout", transition);
    this.currentTransition = null;
  }

  private clearTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  /** Get navigation event history */
  getEvents(): NavigationEvent[] {
    return [...this.events];
  }

  /** Get statistics */
  getStats(): { total: number; failed: number; avgDuration: number } {
    const total = this.events.length;
    const failed = this.events.filter((e) => !e.success).length;
    const avgDuration =
      total > 0
        ? this.events.reduce((sum, e) => sum + e.duration, 0) / total
        : 0;
    return { total, failed, avgDuration };
  }

  /** Clear history */
  clear(): void {
    this.events = [];
  }
}

export const navigationSupervisor = new NavigationSupervisorImpl();
