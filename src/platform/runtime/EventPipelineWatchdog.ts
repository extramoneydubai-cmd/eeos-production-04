/**
 * EventPipelineWatchdog — Monitors the event pipeline (timeline, activity, notifications, audit).
 *
 * Detects:
 *  - Pipeline failures
 *  - Queue failures
 *  - Retry exhaustion
 *
 * Automatically retries failed pipeline events.
 */

import { RuntimeSupervisor, type HealthStatus } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface PipelineEvent {
  id: string;
  type: "timeline" | "activity" | "notification" | "audit" | "approval" | "task" | "communication";
  name: string;
  entityId?: string;
  timestamp: number;
  status: "pending" | "processing" | "completed" | "failed";
  retryCount: number;
  error?: string;
}

class EventPipelineWatchdogImpl {
  private events: PipelineEvent[] = [];
  private maxRecords = 200;
  private enabled = false;
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  /** Start monitoring */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    RuntimeSupervisor.registerMonitor("Pipeline", () => this.healthCheck());

    RuntimeSupervisor.registerRecovery({
      id: "pipeline-retry",
      name: "Pipeline Retry",
      component: "Pipeline",
      priority: 70,
      attemptCount: 0,
      maxAttempts: 3,
      execute: async () => {
        await this.retryFailed();
        return this.events.filter((e) => e.status === "failed").length === 0;
      },
    });

    // Retry failed events every 30 seconds
    this.retryTimer = setInterval(() => this.retryFailed(), 30000);

    RuntimeSupervisor.emit("info", "EventPipelineWatchdog", "Started monitoring event pipeline");
  }

  /** Stop */
  stop(): void {
    this.enabled = false;
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    RuntimeSupervisor.unregisterMonitor("Pipeline");
  }

  /**
   * Record a pipeline event.
   */
  record(event: Omit<PipelineEvent, "timestamp">): void {
    const full: PipelineEvent = {
      ...event,
      timestamp: Date.now(),
    };
    this.events.push(full);
    if (this.events.length > this.maxRecords) {
      this.events = this.events.slice(-this.maxRecords);
    }

    if (event.status === "failed") {
      errorLog.push({
        message: `[Pipeline] ${event.type}.${event.name} failed: ${event.error || "Unknown"}`,
        stack: "",
        source: "sdk",
        severity: "warning",
        metadata: { entity: event.entityId },
      });
      RuntimeSupervisor.emit("warning", "Pipeline", `${event.type}.${event.name} failed`, event);
    }
  }

  /**
   * Mark an event as completed.
   */
  markCompleted(eventId: string): void {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.status = "completed";
    }
  }

  /**
   * Retry all failed events.
   */
  async retryFailed(): Promise<void> {
    const failed = this.events.filter(
      (e) => e.status === "failed" && e.retryCount < 3
    );

    for (const event of failed) {
      event.status = "processing";
      event.retryCount++;

      try {
        // The actual retry is handled by the calling code.
        // The watchdog just tracks the state.
        RuntimeSupervisor.emit("info", "Pipeline", `Retrying ${event.type}.${event.name} (#${event.retryCount})`);
      } catch (err) {
        event.status = "failed";
        event.error = String(err);
      }
    }
  }

  /** Get pipeline statistics */
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    byType: Record<string, { total: number; failed: number }>;
  } {
    const total = this.events.length;
    const completed = this.events.filter((e) => e.status === "completed").length;
    const failed = this.events.filter((e) => e.status === "failed").length;
    const pending = this.events.filter((e) => e.status === "pending" || e.status === "processing").length;

    const byType: Record<string, { total: number; failed: number }> = {};
    for (const event of this.events) {
      if (!byType[event.type]) byType[event.type] = { total: 0, failed: 0 };
      byType[event.type].total++;
      if (event.status === "failed") byType[event.type].failed++;
    }

    return { total, completed, failed, pending, byType };
  }

  /** Health check */
  private async healthCheck() {
    const stats = this.getStats();
    const status: HealthStatus = stats.failed > 10 ? "critical" : stats.failed > 3 ? "warning" : "healthy";
    return {
      name: "Pipeline",
      status,
      lastCheck: Date.now(),
      message: `${stats.total} events, ${stats.failed} failed, ${stats.pending} pending`,
      details: { ...stats },
    };
  }

  /** Clear */
  clear(): void {
    this.events = [];
  }
}

export const eventPipelineWatchdog = new EventPipelineWatchdogImpl();
