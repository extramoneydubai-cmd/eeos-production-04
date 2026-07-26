# EEOS Operations Center — Enterprise Observability Platform

## Overview

The Operations Center is the internal monitoring platform for EEOS. It aggregates real-time metrics from all runtime monitors into a single dashboard.

**Route:** `/operations`

## Architecture

```
Runtime Monitors
  ├── RuntimeMetrics (FPS, Memory, Queries, Mutations)
  ├── SdkPerformanceMonitor (SDK calls, failures, durations)
  ├── ConvexSupervisor (connection state, latency)
  ├── SlowQueryDetector (slow ops by type)
  ├── NavigationSupervisor (route transitions)
  ├── MemoryLeakDetector (memory trends)
  ├── EventPipelineWatchdog (pipeline events)
  └── ErrorLogger (errors by severity)
         │
         ▼
  ObservabilityEngine (aggregates every 3s)
         │
         ▼
  OperationsSnapshot (unified data model)
         │
         ▼
  OperationsCenter (UI at /operations)
```

## Data Flow

1. Runtime monitors collect data continuously
2. ObservabilityEngine collects snapshots every 3 seconds
3. OperationsCenter React hook subscribes to snapshot updates
4. UI renders all dashboards from the latest snapshot

## Core Components

### ObservabilityEngine

Singleton that aggregates all metrics into a unified `OperationsSnapshot`.

**Data collected:**
- Platform: version, build, environment, release channel, readiness
- Runtime: FPS, memory, queries, mutations, route loads
- Convex: connection state, latency, reconnects, failures
- SDK: calls, failures, duplicates, per-SDK breakdown
- Queries: slow ops by type, critical count
- Pipeline: total/completed/failed/pending events
- Errors: counts by severity (fatal/critical/error/warning/info)
- Memory: used MB, growth trend
- Navigation: transitions, failures, avg duration

**Score calculation:** Weighted 0–100 based on FPS, memory, Convex state, SDK failures, errors, and navigation failures.

### OperationsExporter

Generates downloadable export files from snapshots.

**Export types:**
- JSON — Full operations snapshot
- Markdown — Performance report
- Markdown — Error report
- CSV — Flat metrics dump

## Dashboard Tabs

### Overview
- Platform Health bar (Runtime, Convex, SDK, Memory, Errors)
- System Summary (version, build, env, uptime)
- Operations Score
- Live Timeline feed

### Runtime
- Current FPS, Memory, Avg FPS
- Avg Route Load, Total Queries, Total Mutations

### Convex
- Connection State, Latency, Reconnects
- Query Failures, Mutation Failures

### SDK
- Total Calls, Failures, Avg Duration
- Per-SDK breakdown table

### Queries
- Slow Operations, Critical Count, Avg Duration
- By-type breakdown table

### Pipeline
- Total Events, Completed, Failed, Pending
- By-pipeline-type breakdown table

### Memory
- Used Memory, Growth Trend

### Errors
- Fatal, Critical, Error, Warning, Info counts

### Deployment
- Version, Build, Environment, Channel
- Readiness State, Readiness Score, Uptime

## Exports

- **JSON:** Full operations snapshot download
- **Report:** Performance report as Markdown

## Route Registration

- `/operations` — Operations Center dashboard

## Integration

The Observability Platform integrates with:
- **RuntimeSupervisor** — Monitors and events
- **HealthMonitor** — System health display
- **ProductionReadinessManager** — Build/readiness status
- **FeatureFlagManager** — Feature states
- **CacheManager** — Cache stats
- **ErrorLogger** — Error severity counts
- **SdkPerformanceMonitor** — SDK breakdowns
- **ConvexSupervisor** — Convex connection health
- **SlowQueryDetector** — Slow operation stats
- **NavigationSupervisor** — Route transition stats
- **MemoryLeakDetector** — Memory trends
- **EventPipelineWatchdog** — Pipeline stats
- **BuildVersionManager** — Version/build metadata

## API Reference

### ObservabilityEngine

```
start(intervalMs?): void
stop(): void
collect(): OperationsSnapshot
subscribe(listener): () => void
calculateScore(): { score: number; label: string }
lastSnapshot: OperationsSnapshot | null
```

### OperationsExporter

```
exportToJson(snapshot): string
exportPerformanceReport(snapshot): string
exportErrorReport(snapshot): string
exportRuntimeReport(snapshot): string
exportToCsv(snapshot): string
```

### OperationsSnapshot Interface

```
{
  timestamp: number
  uptime: number
  platform: { version, buildNumber, environment, releaseChannel, readinessState, readinessScore }
  runtime: { fps, memoryMB, totalMemoryMB, convexLatency, sdkLatency, totalQueries, totalMutations, avgRouteLoad, avgFps, avgMemoryMB }
  convex: { state, latency, reconnectAttempts, queryFailures, mutationFailures }
  sdk: { totalCalls, failures, duplicateCount, avgDuration, breakdown }
  queries: { totalSlow, criticalCount, avgDuration, byType }
  pipeline: { total, completed, failed, pending, byType }
  errors: { total, fatal, critical, warning, error, info }
  memory: { usedMB, totalMB, consecutiveGrowth, warnings }
  navigation: { totalTransitions, failed, avgDuration }
}
```

## Extension Guide

To add a new metric to the Operations Center:

1. Add the metric to the appropriate runtime monitor
2. Update `ObservabilityEngine.collect()` to include it in the snapshot
3. Update the `OperationsSnapshot` interface
4. Add a tab or card in `OperationsCenter.tsx`
