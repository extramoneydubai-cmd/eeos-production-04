/**
 * SessionRecovery — Detects expired/invalid tokens and attempts automatic session recovery.
 *
 * Handles:
 *  - Expired token
 *  - Invalid token
 *  - Missing organization
 *  - Missing company/branch context
 *
 * Recovery:
 *  1. Try to refresh the token
 *  2. Reload organization context
 *  3. If all fails, redirect to login
 */

import { RuntimeSupervisor, type HealthStatus } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

export type SessionState = "valid" | "expired" | "invalid" | "missing-org" | "missing-company" | "recovering";

class SessionRecoveryImpl {
  private _state: SessionState = "valid";
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 2;
  private onRecoveryCallbacks: Array<() => Promise<void>> = [];
  private onRedirectToLogin: (() => void) | null = null;
  private enabled = false;

  /** Current session state */
  get state(): SessionState {
    return this._state;
  }

  /** Start monitoring */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    RuntimeSupervisor.registerMonitor("Session", () => this.healthCheck());

    RuntimeSupervisor.registerRecovery({
      id: "session-recovery",
      name: "Session Recovery",
      component: "Session",
      priority: 100,
      attemptCount: 0,
      maxAttempts: this.maxRecoveryAttempts,
      execute: async () => {
        await this.attemptRecovery();
        return this._state === "valid";
      },
    });

    RuntimeSupervisor.emit("info", "SessionRecovery", "Started monitoring session state");
  }

  /** Stop monitoring */
  stop(): void {
    this.enabled = false;
    RuntimeSupervisor.unregisterMonitor("Session");
  }

  /**
   * Register a callback that can recover session data.
   */
  onRecovery(callback: () => Promise<void>): void {
    this.onRecoveryCallbacks.push(callback);
  }

  /**
   * Set a function to call when recovery fails and we need to redirect to login.
   */
  onRedirect(fn: () => void): void {
    this.onRedirectToLogin = fn;
  }

  /**
   * Update the session state (call from auth hooks).
   */
  setState(state: SessionState): void {
    const prev = this._state;
    this._state = state;

    if (prev !== state && state !== "valid") {
      errorLog.push({
        message: `[SessionRecovery] Session state: ${prev} → ${state}`,
        stack: "",
        source: "sdk",
        severity: state === "expired" || state === "invalid" ? "critical" : "warning",
      });

      RuntimeSupervisor.emit("failure", "Session", `Session state changed: ${prev} → ${state}`);

      // Auto-recover if possible
      if (this.recoveryAttempts < this.maxRecoveryAttempts) {
        this.attemptRecovery();
      } else if (this.onRedirectToLogin) {
        this.onRedirectToLogin();
      }
    }

    if (state === "valid" && prev !== "valid") {
      RuntimeSupervisor.emit("recovery", "Session", "Session recovered");
      this.recoveryAttempts = 0;
    }
  }

  /**
   * Attempt to recover session.
   */
  private async attemptRecovery(): Promise<boolean> {
    this.recoveryAttempts++;
    this._state = "recovering";

    RuntimeSupervisor.emit("info", "SessionRecovery", `Attempting session recovery (#${this.recoveryAttempts})`);

    try {
      for (const callback of this.onRecoveryCallbacks) {
        await callback();
      }
      this._state = "valid";
      RuntimeSupervisor.emit("recovery", "Session", "Session recovered successfully");
      return true;
    } catch (err) {
      this._state = "invalid";
      errorLog.push({
        message: `[SessionRecovery] Recovery failed: ${err}`,
        stack: err instanceof Error ? err.stack || "" : "",
        source: "sdk",
      });
      return false;
    }
  }

  /** Health check */
  private async healthCheck() {
    return {
      name: "Session",
      status: (this._state === "valid" ? "healthy" : this._state === "recovering" ? "warning" : "critical") as HealthStatus,
      lastCheck: Date.now(),
      message: `State: ${this._state}`,
      details: { state: this._state, recoveryAttempts: this.recoveryAttempts },
    };
  }

  /** Reset */
  clear(): void {
    this.recoveryAttempts = 0;
    this._state = "valid";
  }
}

export const sessionRecovery = new SessionRecoveryImpl();
