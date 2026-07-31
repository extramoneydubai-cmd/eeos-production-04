/**
 * OperationsCenter — Enterprise Observability Platform for EEOS.
 *
 * Tabs: Overview, Runtime, Convex, SDK, Queries, Pipeline, Memory, Errors, Deployment
 *
 * All data sourced from ObservabilityEngine → Runtime monitors.
 * No duplicated monitoring logic.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { PlatformSDK } from "@/platform/sdk";
import { motion } from "framer-motion";
import {
  Activity, Server, Shield, Database, HardDrive, Wifi, Cpu,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Download,
  Globe, Settings, Clock, Layers, Box, Zap, BarChart3, Terminal,
  Route, Bug, Bell, FileText, Wifi as WifiIcon,
  DownloadCloud,
} from "lucide-react";
import { observabilityEngine, useObservabilitySnapshot, type OperationsSnapshot } from "@/platform/operations/ObservabilityEngine";
import { operationsExporter } from "@/platform/operations/OperationsExporter";
import { buildVersionManager } from "@/platform/release/BuildVersionManager";
import { healthScoreEngine } from "@/platform/runtime/HealthScoreEngine";
import { errorLog } from "@/lib/error-logger";

type Tab = "overview" | "runtime" | "convex" | "sdk" | "queries" | "pipeline" | "memory" | "errors" | "deployment" | "scheduling";

export default function OperationsCenter() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const snapshot = useObservabilitySnapshot();
  const buildInfo = buildVersionManager.getBuildInfo();
  const score = snapshot ? observabilityEngine.calculateScore() : { score: 0, label: "—" };
  const [liveFeed, setLiveFeed] = useState<string[]>([]);

  // Start engine on mount
  useEffect(() => {
    observabilityEngine.start(3000);
    return () => observabilityEngine.stop();
  }, []);

  // Live feed
  useEffect(() => {
    if (!snapshot) return;
    setLiveFeed((prev) => {
      const next = [
        `[${new Date(snapshot.timestamp).toLocaleTimeString()}] Snapshot: ${snapshot.runtime.fps}FPS, ${snapshot.runtime.memoryMB}MB`,
        ...prev.slice(0, 50),
      ];
      return next;
    });
  }, [snapshot?.timestamp]);

  const handleDownloadJson = () => {
    if (!snapshot) return;
    const json = operationsExporter.exportToJson(snapshot);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-operations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    if (!snapshot) return;
    const md = operationsExporter.exportPerformanceReport(snapshot);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-performance-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-[#1a73e8]" />
              <h1 className="text-lg font-semibold text-[#1a1a2e]">Operations Center</h1>
            </div>
            <p className="text-[12px] text-[#5f6368]">
              Build {buildInfo.buildNumber} · {buildInfo.environment} · Updates every 3s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full border text-[12px] font-medium ${
              score.score >= 90 ? "bg-green-50 border-green-200 text-green-600" :
              score.score >= 75 ? "bg-blue-50 border-blue-200 text-blue-600" :
              score.score >= 55 ? "bg-yellow-50 border-yellow-200 text-yellow-600" :
              score.score >= 35 ? "bg-orange-50 border-orange-200 text-orange-600" :
              "bg-red-50 border-red-200 text-red-600"
            }`}>
              {score.label} ({score.score})
            </div>
            <button onClick={handleDownloadJson} className="flex items-center gap-1 px-3 py-1.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors">
              <DownloadCloud className="h-3.5 w-3.5" /> JSON
            </button>
            <button onClick={handleDownloadReport} className="flex items-center gap-1 px-3 py-1.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors">
              <FileText className="h-3.5 w-3.5" /> Report
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        {snapshot && <KpiBar snapshot={snapshot} />}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#e8eaed] overflow-x-auto mt-4">
          {([{ id: "overview", label: "Overview", icon: Activity },
             { id: "runtime", label: "Runtime", icon: Cpu },
             { id: "convex", label: "Convex", icon: WifiIcon },
             { id: "sdk", label: "SDK", icon: Layers },
             { id: "queries", label: "Queries", icon: Terminal },
             { id: "pipeline", label: "Pipeline", icon: Bell },
             { id: "memory", label: "Memory", icon: HardDrive },
             { id: "errors", label: "Errors", icon: Bug },
             { id: "deployment", label: "Deployment", icon: Globe },
             { id: "scheduling", label: "Scheduling", icon: Calendar },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-[#5f6368] hover:text-[#1a1a2e]"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && snapshot && <OverviewTab snapshot={snapshot} score={score} liveFeed={liveFeed} />}
        {activeTab === "runtime" && snapshot && <RuntimeTab snapshot={snapshot} />}
        {activeTab === "convex" && snapshot && <ConvexTab snapshot={snapshot} />}
        {activeTab === "sdk" && snapshot && <SdkTab snapshot={snapshot} />}
        {activeTab === "queries" && snapshot && <QueriesTab snapshot={snapshot} />}
        {activeTab === "pipeline" && snapshot && <PipelineTab snapshot={snapshot} />}
        {activeTab === "memory" && snapshot && <MemoryTab snapshot={snapshot} />}
        {activeTab === "errors" && snapshot && <ErrorsTab snapshot={snapshot} />}
        {activeTab === "deployment" && snapshot && <DeploymentTab snapshot={snapshot} />}
        {activeTab === "scheduling" && snapshot && <SchedulingTab />}
        {!snapshot && (
          <div className="flex items-center justify-center py-20 text-[#9aa0a6]">
            <Activity className="h-6 w-6 animate-pulse mr-2" />
            Waiting for first data snapshot...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────

function KpiBar({ snapshot }: { snapshot: OperationsSnapshot }) {
  const items = [
    { label: "FPS", value: String(snapshot.runtime.fps), color: snapshot.runtime.fps >= 30 ? "text-green-600" : "text-red-600" },
    { label: "Memory", value: `${snapshot.runtime.memoryMB}MB`, color: snapshot.runtime.memoryMB < 200 ? "text-green-600" : "text-yellow-600" },
    { label: "Convex", value: snapshot.convex.state, color: snapshot.convex.state === "connected" ? "text-green-600" : "text-red-600" },
    { label: "SDK Calls", value: String(snapshot.sdk.totalCalls), color: "text-[#5f6368]" },
    { label: "Errors", value: String(snapshot.errors.total), color: snapshot.errors.fatal > 0 ? "text-red-600" : snapshot.errors.critical > 0 ? "text-yellow-600" : "text-green-600" },
    { label: "Uptime", value: `${Math.round(snapshot.uptime / 1000)}s`, color: "text-[#5f6368]" },
    { label: "Routes", value: `${snapshot.navigation.totalTransitions}`, color: "text-[#5f6368]" },
    { label: "Pipeline", value: `${snapshot.pipeline.failed}F`, color: snapshot.pipeline.failed > 0 ? "text-yellow-600" : "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-lg border border-[#e8eaed] p-2.5 text-center">
          <p className="text-[10px] text-[#9aa0a6] font-medium mb-0.5">{item.label}</p>
          <p className={`text-[14px] font-semibold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────

function OverviewTab({ snapshot, score, liveFeed }: { snapshot: OperationsSnapshot; score: { score: number; label: string }; liveFeed: string[] }) {
  const healthScore = healthScoreEngine.calculate();

  return (
    <div className="space-y-6">
      {/* Health + Runtime row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Platform Health</h3>
          <div className="space-y-2">
            <HealthBar label="Runtime" value={snapshot.runtime.fps >= 30 ? 100 : snapshot.runtime.fps >= 15 ? 60 : 30} color={snapshot.runtime.fps >= 30 ? "bg-green-500" : "bg-yellow-500"} />
            <HealthBar label="Convex" value={snapshot.convex.state === "connected" ? 100 : 30} color={snapshot.convex.state === "connected" ? "bg-green-500" : "bg-red-500"} />
            <HealthBar label="SDK" value={snapshot.sdk.failures === 0 ? 100 : snapshot.sdk.failures < 10 ? 80 : 40} color={snapshot.sdk.failures < 10 ? "bg-green-500" : "bg-yellow-500"} />
            <HealthBar label="Memory" value={snapshot.runtime.memoryMB < 200 ? 100 : snapshot.runtime.memoryMB < 400 ? 60 : 30} color={snapshot.runtime.memoryMB < 200 ? "bg-green-500" : "bg-yellow-500"} />
            <HealthBar label="Errors" value={snapshot.errors.fatal === 0 ? 100 : 20} color={snapshot.errors.fatal === 0 ? "bg-green-500" : "bg-red-500"} />
          </div>
          <div className="mt-3 pt-3 border-t border-[#e8eaed] flex items-center justify-between text-[11px]">
            <span className="text-[#9aa0a6]">Operations Score</span>
            <span className={`font-semibold ${
              score.score >= 90 ? "text-green-600" : score.score >= 75 ? "text-blue-600" : score.score >= 55 ? "text-yellow-600" : "text-red-600"
            }`}>{score.score}/100 — {score.label}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">System Summary</h3>
          <div className="space-y-2 text-[12px]">
            <SummaryRow label="Version" value={`${snapshot.platform.version}`} />
            <SummaryRow label="Build" value={snapshot.platform.buildNumber} />
            <SummaryRow label="Environment" value={snapshot.platform.environment} />
            <SummaryRow label="Uptime" value={`${Math.round(snapshot.uptime / 1000)}s`} />
            <SummaryRow label="Queries" value={String(snapshot.runtime.totalQueries)} />
            <SummaryRow label="Mutations" value={String(snapshot.runtime.totalMutations)} />
            <SummaryRow label="SDK Calls" value={String(snapshot.sdk.totalCalls)} />
            <SummaryRow label="Route Transitions" value={String(snapshot.navigation.totalTransitions)} />
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">Live Timeline</span>
        </div>
        <div className="p-3 max-h-48 overflow-y-auto">
          {liveFeed.map((entry, i) => (
            <p key={i} className="text-[10px] font-mono text-[#5f6368] leading-relaxed">{entry}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Components ───────────────────────────────────────────

function RuntimeTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard icon={Activity} label="Current FPS" value={String(snapshot.runtime.fps)} color={snapshot.runtime.fps >= 30 ? "text-green-600" : "text-red-600"} />
      <MetricCard icon={HardDrive} label="Memory" value={`${snapshot.runtime.memoryMB} MB`} color={snapshot.runtime.memoryMB < 200 ? "text-green-600" : "text-yellow-600"} />
      <MetricCard icon={BarChart3} label="Avg FPS" value={String(snapshot.runtime.avgFps)} color="text-[#5f6368]" />
      <MetricCard icon={Route} label="Avg Route Load" value={`${snapshot.runtime.avgRouteLoad}ms`} color="text-[#5f6368]" />
      <MetricCard icon={Terminal} label="Total Queries" value={String(snapshot.runtime.totalQueries)} color="text-[#5f6368]" />
      <MetricCard icon={Zap} label="Total Mutations" value={String(snapshot.runtime.totalMutations)} color="text-[#5f6368]" />
    </div>
  );
}

function ConvexTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard icon={WifiIcon} label="Connection State" value={snapshot.convex.state} color={snapshot.convex.state === "connected" ? "text-green-600" : "text-red-600"} />
      <MetricCard icon={Clock} label="Latency" value={`${snapshot.convex.latency}ms`} color={snapshot.convex.latency < 500 ? "text-green-600" : snapshot.convex.latency < 2000 ? "text-yellow-600" : "text-red-600"} />
      <MetricCard icon={RefreshCw} label="Reconnects" value={String(snapshot.convex.reconnectAttempts)} color={snapshot.convex.reconnectAttempts === 0 ? "text-green-600" : "text-yellow-600"} />
      <MetricCard icon={XCircle} label="Query Failures" value={String(snapshot.convex.queryFailures)} color={snapshot.convex.queryFailures === 0 ? "text-green-600" : "text-red-600"} />
      <MetricCard icon={XCircle} label="Mutation Failures" value={String(snapshot.convex.mutationFailures)} color={snapshot.convex.mutationFailures === 0 ? "text-green-600" : "text-red-600"} />
    </div>
  );
}

function SdkTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  const breakdown = snapshot.sdk.breakdown;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={Layers} label="SDK Calls" value={String(snapshot.sdk.totalCalls)} color="text-[#5f6368]" />
        <MetricCard icon={XCircle} label="Failures" value={String(snapshot.sdk.failures)} color={snapshot.sdk.failures === 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard icon={Clock} label="Avg Duration" value={`${snapshot.sdk.avgDuration}ms`} color="text-[#5f6368]" />
      </div>
      {Object.keys(breakdown).length > 0 && (
        <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
            <span className="text-[12px] font-semibold text-[#1a1a2e]">Per-SDK Breakdown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">SDK</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Calls</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Failures</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(breakdown).map(([name, stats]) => (
                  <tr key={name} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">{name}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.calls}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.failures}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.avgDuration}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function QueriesTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={Terminal} label="Slow Operations" value={String(snapshot.queries.totalSlow)} color={snapshot.queries.totalSlow === 0 ? "text-green-600" : "text-yellow-600"} />
        <MetricCard icon={AlertTriangle} label="Critical Slow" value={String(snapshot.queries.criticalCount)} color={snapshot.queries.criticalCount === 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard icon={Clock} label="Avg Duration" value={`${snapshot.queries.avgDuration}ms`} color="text-[#5f6368]" />
      </div>
      {Object.keys(snapshot.queries.byType).length > 0 && (
        <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
            <span className="text-[12px] font-semibold text-[#1a1a2e]">By Type</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Type</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Count</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(snapshot.queries.byType).map(([type, stats]) => (
                  <tr key={type} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">{type}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.count}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.avgDuration}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={Bell} label="Total Events" value={String(snapshot.pipeline.total)} color="text-[#5f6368]" />
        <MetricCard icon={CheckCircle} label="Completed" value={String(snapshot.pipeline.completed)} color="text-green-600" />
        <MetricCard icon={XCircle} label="Failed" value={String(snapshot.pipeline.failed)} color={snapshot.pipeline.failed === 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard icon={Clock} label="Pending" value={String(snapshot.pipeline.pending)} color="text-yellow-600" />
      </div>
      {Object.keys(snapshot.pipeline.byType).length > 0 && (
        <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
            <span className="text-[12px] font-semibold text-[#1a1a2e]">By Pipeline Type</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Type</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Total</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Failed</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(snapshot.pipeline.byType).map(([type, stats]) => (
                  <tr key={type} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">{type}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.total}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{stats.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard icon={HardDrive} label="Used Memory" value={`${snapshot.memory.usedMB} MB`} color={snapshot.memory.usedMB < 200 ? "text-green-600" : "text-yellow-600"} />
      <MetricCard icon={Activity} label="Growth Trend" value={snapshot.memory.consecutiveGrowth > 0 ? `${snapshot.memory.consecutiveGrowth}x` : "Stable"} color={snapshot.memory.consecutiveGrowth > 0 ? "text-yellow-600" : "text-green-600"} />
    </div>
  );
}

function ErrorsTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard icon={XCircle} label="Fatal" value={String(snapshot.errors.fatal)} color={snapshot.errors.fatal === 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard icon={AlertTriangle} label="Critical" value={String(snapshot.errors.critical)} color={snapshot.errors.critical === 0 ? "text-green-600" : "text-orange-600"} />
        <MetricCard icon={AlertTriangle} label="Error" value={String(snapshot.errors.error)} color="text-yellow-600" />
        <MetricCard icon={AlertTriangle} label="Warning" value={String(snapshot.errors.warning)} color="text-[#5f6368]" />
        <MetricCard icon={Bell} label="Info" value={String(snapshot.errors.info)} color="text-blue-600" />
      </div>
    </div>
  );
}

function DeploymentTab({ snapshot }: { snapshot: OperationsSnapshot }) {
  return (
    <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
        <span className="text-[12px] font-semibold text-[#1a1a2e]">Deployment Info</span>
      </div>
      <div className="p-4 space-y-3">
        <EnvRow label="Version" value={snapshot.platform.version} />
        <EnvRow label="Build Number" value={snapshot.platform.buildNumber} />
        <EnvRow label="Environment" value={snapshot.platform.environment} />
        <EnvRow label="Release Channel" value={snapshot.platform.releaseChannel} />
        <EnvRow label="Readiness State" value={snapshot.platform.readinessState} />
        <EnvRow label="Readiness Score" value={`${snapshot.platform.readinessScore}/100`} />
        <EnvRow label="Uptime" value={`${Math.round(snapshot.uptime / 1000)}s`} />
      </div>
    </div>
  );
}

// ─── Scheduling Tab ───────────────────────────────────────────

function SchedulingTab() {
  const schedules = useQuery(PlatformSDK.scheduling.getCounts, {});
  const todaySchedules = useQuery(PlatformSDK.scheduling.getToday, {}) as any[] | undefined;
  const resources = useQuery(PlatformSDK.scheduling.listResources, {}) as any[] | undefined;
  const opsHealth = useQuery(PlatformSDK.health.operationsDashboard, {});

  const todayCount = todaySchedules?.length || 0;
  const totalResources = resources?.length || 0;
  const activeResources = resources?.filter((r: any) => r.status === "active").length || 0;

  const scheduleKPIs = [
    { label: "Today", value: String(todayCount), color: todayCount > 0 ? "text-blue-600" : "text-[#5f6368]" },
    { label: "Upcoming", value: String(schedules?.upcoming || 0), color: (schedules?.upcoming || 0) > 0 ? "text-green-600" : "text-[#5f6368]" },
    { label: "Pending", value: String(schedules?.pending || 0), color: (schedules?.pending || 0) > 0 ? "text-yellow-600" : "text-[#5f6368]" },
    { label: "Completed", value: String(schedules?.completed || 0), color: (schedules?.completed || 0) > 0 ? "text-green-600" : "text-[#5f6368]" },
    { label: "Cancelled", value: String(schedules?.cancelled || 0), color: (schedules?.cancelled || 0) > 0 ? "text-red-600" : "text-[#5f6368]" },
    { label: "Resources", value: `${activeResources}/${totalResources}`, color: activeResources > 0 ? "text-[#1a73e8]" : "text-[#5f6368]" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {scheduleKPIs.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-[#e8eaed] p-3 text-center">
            <p className="text-[10px] text-[#9aa0a6] font-medium">{kpi.label}</p>
            <p className={`text-lg font-semibold ${kpi.color} mt-0.5`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {opsHealth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Queues", value: opsHealth?.queues?.total ?? 0, color: "text-[#1a73e8]" },
            { label: "Workflow Failures", value: opsHealth?.workflow?.failed ?? 0, color: "text-red-600" },
            { label: "Pending Refunds", value: opsHealth?.finance?.pendingRefunds ?? 0, color: "text-yellow-600" },
            { label: "Scheduling Conflicts", value: opsHealth?.scheduling?.conflicts ?? 0, color: "text-orange-600" },
            { label: "Bounced PDC", value: opsHealth?.finance?.bouncedCheques ?? 0, color: "text-red-600" },
            { label: "SLA Breaches", value: opsHealth?.slaBreaches ?? 0, color: "text-red-600" },
            { label: "Scope Violations", value: opsHealth?.scopeViolations ?? 0, color: "text-purple-600" },
            { label: "Health Score", value: `${opsHealth?.healthScore ?? 100}%`, color: "text-green-600" },
          ].map((h) => (
            <div key={h.label} className="bg-[#fafafa] rounded-lg border border-[#e8eaed] p-3">
              <p className="text-[10px] text-[#9aa0a6] font-medium">{h.label}</p>
              <p className={`text-lg font-semibold ${h.color} mt-0.5`}>{h.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Today's Schedule ({todayCount})</h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {todaySchedules?.length ? todaySchedules.slice(0, 8).map((s: any) => (
              <div key={s._id} className="flex items-center gap-2 py-1.5 border-b border-[#f1f3f4] last:border-0 hover:bg-[#fafafa] rounded px-1 transition-colors">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ({
                  meeting: "#4285f4", lecture: "#a855f7", exam: "#ea4335", interview: "#34a853",
                  training: "#06b6d4", counseling: "#ec4899", maintenance: "#f59e0b", holiday: "#f97316",
                })[s.scheduleType] || "#9aa0a6"}} />
                <span className="text-[10px] text-[#1a1a2e] truncate flex-1">{s.title}</span>
                <span className="text-[8px] text-[#5f6368] font-mono">{s.start ? new Date(s.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}</span>
              </div>
            )) : (
              <p className="text-[10px] text-[#9aa0a6] py-4 text-center">No schedules today</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Resource Status</h3>
          <div className="space-y-2">
            {resources?.length ? resources.slice(0, 8).map((r: any) => (
              <div key={r._id} className="flex items-center justify-between py-1 border-b border-[#f1f3f4] last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${r.status === "active" ? "bg-green-500" : r.status === "maintenance" ? "bg-yellow-500" : "bg-red-500"}`} />
                  <span className="text-[10px] text-[#1a1a2e]">{r.name}</span>
                </div>
                <span className="text-[9px] text-[#5f6368] capitalize">{r.resourceType} · {r.capacity || "—"} seats</span>
              </div>
            )) : (
              <p className="text-[10px] text-[#9aa0a6] py-4 text-center">No resources configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-[#9aa0a6]" />
        <span className="text-[11px] text-[#9aa0a6] font-medium">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="text-[#5f6368]">{label}</span>
        <span className="text-[#9aa0a6]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#5f6368]">{label}</span>
      <span className="font-mono font-medium text-[#1a1a2e]">{value}</span>
    </div>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#5f6368]">{label}</span>
      <span className="text-[12px] font-mono text-[#1a1a2e]">{value}</span>
    </div>
  );
}
