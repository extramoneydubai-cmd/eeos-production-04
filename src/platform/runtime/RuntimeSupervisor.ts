/**
 * RuntimeSupervisor — Core singleton that coordinates all runtime health monitors.
 *
 * Responsibilities:
 *  - Starts during app boot
 *  - Registers all runtime monitors (React, Router, Convex, SDK, Memory, etc.)
 *  - Coordinates recovery actions
 *  - Emits health events
 *  - Tracks uptime
 *  - Exposes a health report at any time
 */

import { errorLog } from "@/lib/error-logger";

export type HealthStatus = "healthy" | "warning" | "critical" | "down";

export interface HealthComponent {
  name: string;
  status: HealthStatus;
  lastCheck: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SupervisorEvent {
  type: "health_change" | "recovery" | "failure" | "warning" | "info";
  component: string;
  message: string;
  timestamp: number;
  data?: unknown;
}

export type SupervisorListener = (event: SupervisorEvent) => void;

export interface RecoveryAction {
  id: string;
  name: string;
  component: string;
  execute: () => Promise<boolean>;
  priority: number; // higher = more important
  lastAttempt?: number;
  attemptCount: number;
  maxAttempts: number;
}

class RuntimeSupervisorImpl {
  private monitors: Map<string, () => Promise<HealthComponent>> = new Map();
  private recoveryActions: RecoveryAction[] = [];
  private listeners: Set<SupervisorListener> = new Set();
  private _startTime: number = Date.now();
  private _isRunning = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private _lastHealth: Map<string, HealthComponent> = new Map();

  /** Get the start timestamp */
  get startTime(): number {
    return this._startTime;
  }

  /** Get uptime in milliseconds */
  get uptime(): number {
    return Date.now() - this._startTime;
  }

  /** Whether the supervisor is actively monitoring */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Start the supervisor. Begins periodic health checks.
   * @param intervalMs How often to run health checks (default 30s)
   */
  start(intervalMs = 30000): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this._startTime = Date.now();

    this.emit("info", "RuntimeSupervisor", "Runtime supervisor started");

    // Run an initial check immediately
    this.runHealthCheck().catch((err) => {
      errorLog.push({
        message: `RuntimeSupervisor initial health check failed: ${err}`,
        stack: err instanceof Error ? err.stack || "" : "",
        source: "sdk",
      });
    });

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.runHealthCheck().catch(() => {});
    }, intervalMs);
  }

  /**
   * Stop the supervisor. Cleans up intervals.
   */
  stop(): void {
    this._isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.emit("info", "RuntimeSupervisor", "Runtime supervisor stopped");
  }

  /**
   * Register a health monitor function.
   */
  registerMonitor(name: string, check: () => Promise<HealthComponent>): void {
    this.monitors.set(name, check);
  }

  /**
   * Unregister a health monitor.
   */
  unregisterMonitor(name: string): void {
    this.monitors.delete(name);
  }

  /**
   * Register a recovery action that can be triggered automatically.
   */
  registerRecovery(action: RecoveryAction): void {
    this.recoveryActions.push(action);
  }

  /**
   * Subscribe to supervisor events.
   */
  subscribe(listener: SupervisorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners.
   */
  emit(type: SupervisorEvent["type"], component: string, message: string, data?: unknown): void {
    const event: SupervisorEvent = { type, component, message, timestamp: Date.now(), data };
    this.listeners.forEach((l) => l(event));
  }

  /**
   * Run all registered health checks and return the results.
   */
  async runHealthCheck(): Promise<HealthComponent[]> {
    const results: HealthComponent[] = [];

    for (const [name, check] of this.monitors) {
      try {
        const result = await check();
        const prev = this._lastHealth.get(name);
        results.push(result);
        this._lastHealth.set(name, result);

        // Detect status changes
        if (prev && prev.status !== result.status) {
          if (result.status !== "healthy") {
            this.emit("health_change", name, `Status changed: ${prev.status} → ${result.status}`, {
              previous: prev.status,
              current: result.status,
              message: result.message,
            });

            // Attempt recovery for degraded components
            if (result.status === "critical" || result.status === "down") {
              this.attemptRecovery(name);
            }
          } else {
            this.emit("recovery", name, `Recovered: ${prev.status} → ${result.status}`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          name,
          status: "down",
          lastCheck: Date.now(),
          message: `Monitor threw: ${msg}`,
        });
        this.emit("failure", name, `Monitor crashed: ${msg}`);
      }
    }

    return results;
  }

  /**
   * Get the latest known health state for all components.
   */
  getHealth(): Map<string, HealthComponent> {
    return new Map(this._lastHealth);
  }

  /**
   * Get overall platform health status.
   */
  getOverallStatus(): HealthStatus {
    const statuses = Array.from(this._lastHealth.values());
    if (statuses.some((h) => h.status === "down")) return "down";
    if (statuses.some((h) => h.status === "critical")) return "critical";
    if (statuses.some((h) => h.status === "warning")) return "warning";
    return "healthy";
  }

  /**
   * Get a summary report of all components.
   */
  getReport(): { overall: HealthStatus; components: HealthComponent[]; uptime: number; startTime: number } {
    return {
      overall: this.getOverallStatus(),
      components: Array.from(this._lastHealth.values()),
      uptime: this.uptime,
      startTime: this._startTime,
    };
  }

  /**
   * Attempt automatic recovery for a failed component.
   */
  private async attemptRecovery(componentName: string): Promise<boolean> {
    const actions = this.recoveryActions
      .filter((a) => a.component === componentName)
      .sort((a, b) => b.priority - a.priority);

    for (const action of actions) {
      if (action.attemptCount >= action.maxAttempts) {
        this.emit("warning", action.name, `Max retries (${action.maxAttempts}) reached`);
        continue;
      }

      this.emit("info", action.name, `Attempting recovery (${action.attemptCount + 1}/${action.maxAttempts})`);

      try {
        action.lastAttempt = Date.now();
        const success = await action.execute();
        action.attemptCount++;

        if (success) {
          this.emit("recovery", action.name, `Recovery successful`);
          return true;
        }
      } catch (err) {
        action.attemptCount++;
        this.emit("failure", action.name, `Recovery attempt failed: ${err}`);
      }
    }

    return false;
  }
}

/** Singleton instance */
export const RuntimeSupervisor = new RuntimeSupervisorImpl();

/** React hook to subscribe to supervisor events */
import { useState, useEffect } from "react";

export function useRuntimeHealth(): {
  overall: HealthStatus;
  components: HealthComponent[];
  uptime: number;
} {
  const [health, setHealth] = useState({
    overall: RuntimeSupervisor.getOverallStatus() as HealthStatus,
    components: Array.from(RuntimeSupervisor.getHealth().values()),
    uptime: RuntimeSupervisor.uptime,
  });

  useEffect(() => {
    const unsub = RuntimeSupervisor.subscribe(() => {
      setHealth({
        overall: RuntimeSupervisor.getOverallStatus(),
        components: Array.from(RuntimeSupervisor.getHealth().values()),
        uptime: RuntimeSupervisor.uptime,
      });
    });
    return unsub;
  }, []);

  return health;
}
