/**
 * ReactRenderWatcher — Detects React render loop anomalies.
 *
 * Watches for:
 *  - Maximum update depth exceeded (infinite loops)
 *  - Recursive effects
 *  - Suspense loops
 *  - Excessive re-renders
 *
 * When detected, it logs the incident and signals the RuntimeSupervisor.
 */

import { RuntimeSupervisor } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface RenderLoopIncident {
  timestamp: number;
  componentStack: string;
  renderCount: number;
  duration: number;
  source: "maximum-depth" | "recursive-effect" | "suspense-loop" | "excessive-render";
}

const RENDER_THRESHOLD = 50; // renders per second considered excessive
const MAX_DEPTH_PATTERNS = [
  "Maximum update depth exceeded",
  "Cannot update a component",
  "Rendered more hooks than",
  "Should have a queue",
  "Invalid hook call",
  "Cannot read properties of null (reading",
];

class ReactRenderWatcherImpl {
  private renderCounts = new Map<string, { count: number; startTime: number }>();
  private incidents: RenderLoopIncident[] = [];
  private enabled = false;
  private originalConsoleError: typeof console.error | null = null;

  /** Start watching for render loops */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    // Monkey-patch console.error to detect React error patterns
    this.originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = args.join(" ");
      if (MAX_DEPTH_PATTERNS.some((p) => msg.includes(p))) {
        this.handleRenderLoop({
          timestamp: Date.now(),
          componentStack: msg,
          renderCount: 999,
          duration: 0,
          source: "maximum-depth",
        });
      }
      this.originalConsoleError?.(...args);
    };

    RuntimeSupervisor.emit("info", "ReactRenderWatcher", "Started monitoring render loops");
  }

  /** Stop watching */
  stop(): void {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }

    this.renderCounts.clear();
    RuntimeSupervisor.emit("info", "ReactRenderWatcher", "Stopped");
  }

  /**
   * Track a component's render count.
   * Call this from component render paths to detect excessive re-renders.
   */
  trackRender(componentName: string): void {
    if (!this.enabled) return;

    const now = Date.now();
    const existing = this.renderCounts.get(componentName);

    if (!existing) {
      this.renderCounts.set(componentName, { count: 1, startTime: now });
      return;
    }

    existing.count++;

    // Check if renders exceed threshold within 1 second window
    const elapsed = now - existing.startTime;
    if (elapsed < 1000 && existing.count > RENDER_THRESHOLD) {
      this.handleRenderLoop({
        timestamp: now,
        componentStack: componentName,
        renderCount: existing.count,
        duration: elapsed,
        source: "excessive-render",
      });
      // Reset to avoid repeated reports
      existing.count = 0;
      existing.startTime = now;
    }

    // Reset counter every 10 seconds
    if (elapsed > 10000) {
      existing.count = 1;
      existing.startTime = now;
    }
  }

  /**
   * Handle a detected render loop.
   */
  private handleRenderLoop(incident: RenderLoopIncident): void {
    this.incidents.push(incident);

    errorLog.push({
      message: `[ReactRenderWatcher] ${incident.source}: ${incident.componentStack.slice(0, 120)}`,
      stack: new Error().stack || "",
      source: "react",
      componentStack: incident.componentStack,
    });

    RuntimeSupervisor.emit("failure", "React", `Render loop detected: ${incident.source}`, {
      incident,
      totalIncidents: this.incidents.length,
    });
  }

  /** Get all incidents logged */
  getIncidents(): RenderLoopIncident[] {
    return [...this.incidents];
  }

  /** Clear incident log */
  clear(): void {
    this.incidents = [];
    this.renderCounts.clear();
  }
}

export const reactRenderWatcher = new ReactRenderWatcherImpl();
