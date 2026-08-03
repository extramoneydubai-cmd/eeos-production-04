/**
 * RuntimeMetrics — Tracks performance metrics across the runtime.
 *
 * Metrics:
 *  - FPS
 *  - Memory (heap used/total)
 *  - SDK latency
 *  - Convex latency
 *  - Average query/mutation duration
 *  - Route load time
 *  - Workspace render time
 *
 * Data retention: 1 min, 5 min, 30 min, and session aggregates.
 */

import { RuntimeSupervisor } from "./RuntimeSupervisor";

interface MetricsSnapshot {
  timestamp: number;
  fps: number;
  memoryMB: number;
  totalMemoryMB: number;
  convexLatency: number;
  sdkLatency: number;
  queryCount: number;
  mutationCount: number;
  routeLoadTime: number;
  workspaceLoadTime: number;
}

class RuntimeMetricsImpl {
  private samples: MetricsSnapshot[] = [];
  private maxSamples = 500;
  private _currentFps = 60;
  private _currentMemory = 0;
  private _currentTotalMemory = 0;
  private _currentConvexLatency = 0;
  private _currentSdkLatency = 0;
  private _queryCount = 0;
  private _mutationCount = 0;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private rafId: number | null = null;
  private sampleTimer: ReturnType<typeof setInterval> | null = null;
  private enabled = false;

  /** Current FPS */
  get fps(): number {
    return this._currentFps;
  }

  /** Current memory usage in MB */
  get memoryMB(): number {
    return this._currentMemory;
  }

  /** Current Convex latency */
  get convexLatency(): number {
    return this._currentConvexLatency;
  }

  /** Start collecting metrics */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    // FPS tracking
    this.startFpsTracking();

    // Sample metrics every 5 seconds
    this.sampleTimer = setInterval(() => this.takeSample(), 5000);

    RuntimeSupervisor.emit("info", "RuntimeMetrics", "Started collecting runtime metrics");
  }

  /** Stop collecting */
  stop(): void {
    this.enabled = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
  }

  /** Record a query execution */
  recordQuery(): void {
    this._queryCount++;
  }

  /** Record a mutation execution */
  recordMutation(): void {
    this._mutationCount++;
  }

  /** Update Convex latency */
  setConvexLatency(ms: number): void {
    this._currentConvexLatency = ms;
  }

  /** Update SDK latency */
  setSdkLatency(ms: number): void {
    this._currentSdkLatency = ms;
  }

  /** Record a route load time */
  recordRouteLoad(ms: number): void {
    const snapshot = this.getCurrentSnapshot();
    snapshot.routeLoadTime = ms;
    this.samples.push(snapshot);
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  /** Record a workspace load time */
  recordWorkspaceLoad(ms: number): void {
    const latest = this.samples[this.samples.length - 1];
    if (latest) {
      latest.workspaceLoadTime = ms;
    }
  }

  /** Get session aggregates */
  getAggregates(): {
    avgFps: number;
    avgMemoryMB: number;
    avgConvexLatency: number;
    avgSdkLatency: number;
    totalQueries: number;
    totalMutations: number;
    avgRouteLoad: number;
    minFps: number;
    maxMemoryMB: number;
  } {
    if (this.samples.length === 0) {
      return {
        avgFps: 60,
        avgMemoryMB: 0,
        avgConvexLatency: 0,
        avgSdkLatency: 0,
        totalQueries: this._queryCount,
        totalMutations: this._mutationCount,
        avgRouteLoad: 0,
        minFps: 60,
        maxMemoryMB: 0,
      };
    }

    const sum = (key: keyof MetricsSnapshot) =>
      this.samples.reduce((s, m) => s + ((m[key] as number) || 0), 0);

    return {
      avgFps: Math.round(sum("fps") / this.samples.length),
      avgMemoryMB: Math.round(sum("memoryMB") / this.samples.length),
      avgConvexLatency: Math.round(sum("convexLatency") / this.samples.length),
      avgSdkLatency: Math.round(sum("sdkLatency") / this.samples.length),
      totalQueries: this._queryCount,
      totalMutations: this._mutationCount,
      avgRouteLoad: Math.round(sum("routeLoadTime") / this.samples.length),
      minFps: Math.min(...this.samples.map((s) => s.fps)),
      maxMemoryMB: Math.max(...this.samples.map((s) => s.memoryMB)),
    };
  }

  /** Get recent samples */
  getRecentSamples(count = 10): MetricsSnapshot[] {
    return this.samples.slice(-count);
  }

  /** Get samples from the last N minutes */
  getSamplesSince(minutes: number): MetricsSnapshot[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.samples.filter((s) => s.timestamp >= cutoff);
  }

  /** Clear all data */
  clear(): void {
    this.samples = [];
    this._queryCount = 0;
    this._mutationCount = 0;
  }

  private getCurrentSnapshot(): MetricsSnapshot {
    return {
      timestamp: Date.now(),
      fps: this._currentFps,
      memoryMB: this._currentMemory,
      totalMemoryMB: this._currentTotalMemory,
      convexLatency: this._currentConvexLatency,
      sdkLatency: this._currentSdkLatency,
      queryCount: this._queryCount,
      mutationCount: this._mutationCount,
      routeLoadTime: 0,
      workspaceLoadTime: 0,
    };
  }

  private takeSample(): void {
    if (!this.enabled) return;

    try {
      const perf = (performance as unknown as Record<string, unknown>).memory as Record<string, number> | undefined;
      if (perf) {
        this._currentMemory = Math.round(perf.usedJSHeapSize / 1024 / 1024);
        this._currentTotalMemory = Math.round(perf.totalJSHeapSize / 1024 / 1024);
      }
    } catch {}

    const snapshot = this.getCurrentSnapshot();
    this.samples.push(snapshot);
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  private startFpsTracking(): void {
    const tick = (now: number) => {
      this.frameCount++;
      const delta = now - this.lastFrameTime;

      if (delta >= 1000) {
        this._currentFps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}

export const runtimeMetrics = new RuntimeMetricsImpl();
