/**
 * ReleaseHealthDashboard — The internal Operations Center for EEOS.
 *
 * Sections:
 *  - Overview (Build, Readiness Score, State)
 *  - Environment
 *  - Schema
 *  - Runtime
 *  - SDK
 *  - Cache
 *  - Storage
 *  - Assets
 *  - Providers
 *  - Authentication
 *  - Convex
 *  - Routes
 *  - Workspace
 *  - Build
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, Server, Shield, Database, HardDrive, Wifi, Cpu,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Download,
  FileText, Globe, Settings, Clock, Layers, Box, Zap
} from "lucide-react";
import { productionReadinessManager, type ReadinessReport, type ReadinessCheck } from "@/platform/release/ProductionReadinessManager";
import { buildVersionManager } from "@/platform/release/BuildVersionManager";
import { cacheManager } from "@/platform/release/CacheManager";
import { featureFlagManager } from "@/platform/release/FeatureFlagManager";
import { RuntimeSupervisor, useRuntimeHealth } from "@/platform/runtime/RuntimeSupervisor";
import { readinessScoreEngine } from "@/platform/release/ReadinessScoreEngine";
import { releaseNotesGenerator } from "@/platform/release/ReleaseNotesGenerator";
import { productionChecklistEngine } from "@/platform/release/ProductionChecklistEngine";

type Tab = "overview" | "environment" | "runtime" | "sdk" | "cache" | "build" | "flags";

export default function ReleaseHealthDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [validating, setValidating] = useState(false);
  const runtimeHealth = useRuntimeHealth();

  const runValidation = useCallback(async () => {
    setValidating(true);
    const result = await productionReadinessManager.validate();
    setReport(result);
    setValidating(false);
  }, []);

  useEffect(() => {
    runValidation();
  }, [runValidation]);

  const buildInfo = buildVersionManager.getBuildInfo();
  const cacheStats = cacheManager.getStats();
  const flags = featureFlagManager.listFlags();
  const score = report?.score ?? 0;

  const tabContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab report={report} buildInfo={buildInfo} runtimeHealth={runtimeHealth} />;
      case "environment": return <EnvironmentTab buildInfo={buildInfo} />;
      case "runtime": return <RuntimeTab runtimeHealth={runtimeHealth} />;
      case "sdk": return <SdkTab />;
      case "cache": return <CacheTab cacheStats={cacheStats} />;
      case "build": return <BuildTab buildInfo={buildInfo} />;
      case "flags": return <FlagsTab flags={flags} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-[#1a73e8]" />
              <h1 className="text-lg font-semibold text-[#1a1a2e]">Release Health Dashboard</h1>
            </div>
            <p className="text-[12px] text-[#5f6368]">
              Build {buildInfo.buildNumber} — {buildInfo.environment} — {buildInfo.releaseChannel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full border text-[12px] font-medium ${readinessScoreEngine.getBgColorClass(score)} ${readinessScoreEngine.getColorClass(score)}`}>
              {readinessScoreEngine.getLabel(score)} ({score}/100)
            </div>
            <button
              onClick={runValidation}
              disabled={validating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${validating ? "animate-spin" : ""}`} />
              {validating ? "Validating..." : "Re-validate"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#e8eaed] overflow-x-auto">
          {([{ id: "overview", label: "Overview", icon: Activity },
             { id: "environment", label: "Environment", icon: Globe },
             { id: "runtime", label: "Runtime", icon: Cpu },
             { id: "sdk", label: "SDK", icon: Layers },
             { id: "cache", label: "Cache", icon: Database },
             { id: "build", label: "Build", icon: Box },
             { id: "flags", label: "Feature Flags", icon: Shield },
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

        {/* Tab content */}
        <div className="min-h-[60vh]">
          {tabContent()}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Components ──────────────────────────────────────────

function OverviewTab({ report, buildInfo, runtimeHealth }: {
  report: ReadinessReport | null;
  buildInfo: ReturnType<typeof buildVersionManager.getBuildInfo>;
  runtimeHealth: ReturnType<typeof useRuntimeHealth>;
}) {
  const checkItems = productionChecklistEngine.run();
  const passCount = checkItems.filter((c) => c.status === "pass").length;
  const failCount = checkItems.filter((c) => c.status === "fail").length;

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={Activity} label="Readiness Score" value={`${report?.score ?? 0}/100`} color={report ? (report.score >= 85 ? "text-green-600" : report.score >= 70 ? "text-yellow-600" : "text-red-600") : "text-[#5f6368]"} />
        <SummaryCard icon={CheckCircle} label="Checks Passed" value={`${report?.checks.filter((c) => c.status === "pass").length ?? 0}/${report?.checks.length ?? 0}`} color="text-green-600" />
        <SummaryCard icon={XCircle} label="Checks Failed" value={`${report?.checks.filter((c) => c.status === "fail").length ?? 0}`} color="text-red-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={Server} label="State" value={report?.state ?? "checking"} color="text-[#5f6368]" />
        <SummaryCard icon={Clock} label="Uptime" value={`${Math.round(runtimeHealth.uptime / 1000)}s`} color="text-[#5f6368]" />
        <SummaryCard icon={Zap} label="Validation Time" value={report ? `${report.duration}ms` : "—"} color="text-[#5f6368]" />
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">
            Production Checklist ({passCount} passed, {failCount} failed)
          </span>
        </div>
        <div className="p-3 space-y-1.5">
          {checkItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {item.status === "pass" ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : item.status === "fail" ? (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                )}
                <span className="text-[12px] text-[#5f6368]">{item.name}</span>
              </div>
              <span className="text-[11px] text-[#9aa0a6]">{item.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checks table */}
      {report && (
        <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
            <span className="text-[12px] font-semibold text-[#1a1a2e]">Validation Details</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Check</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Category</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Message</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {report.checks.map((check, i) => (
                  <tr key={i} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">{check.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        check.category === "critical" ? "bg-red-50 text-red-600" :
                        check.category === "important" ? "bg-yellow-50 text-yellow-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>{check.category}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`flex items-center gap-1 ${
                        check.status === "pass" ? "text-green-600" :
                        check.status === "fail" ? "text-red-600" :
                        "text-yellow-600"
                      }`}>
                        {check.status === "pass" ? <CheckCircle className="h-3 w-3" /> :
                         check.status === "fail" ? <XCircle className="h-3 w-3" /> :
                         <AlertTriangle className="h-3 w-3" />}
                        {check.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[#5f6368] max-w-xs truncate">{check.message}</td>
                    <td className="px-4 py-2 text-right text-[#9aa0a6]">{check.duration}ms</td>
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

function EnvironmentTab({ buildInfo }: { buildInfo: ReturnType<typeof buildVersionManager.getBuildInfo> }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">Environment & Build Info</span>
        </div>
        <div className="p-4 space-y-3">
          <EnvRow label="Application Version" value={buildInfo.version} />
          <EnvRow label="Build Number" value={buildInfo.buildNumber} />
          <EnvRow label="Git Commit" value={buildInfo.gitCommit} />
          <EnvRow label="Build Timestamp" value={buildInfo.buildTimestamp} />
          <EnvRow label="Environment" value={buildInfo.environment} />
          <EnvRow label="Release Channel" value={buildInfo.releaseChannel} />
          <EnvRow label="Build ID" value={buildInfo.buildId} />
          <EnvRow label="Node.js Version" value={buildInfo.nodeVersion} />
          <EnvRow label="React Version" value={buildInfo.reactVersion} />
          <EnvRow label="Convex URL" value={buildInfo.convexUrl} />
          <EnvRow label="Browser" value={(buildInfo as any).browser?.slice(0, 80) || "unknown"} />
          <EnvRow label="Platform" value={(buildInfo as any).platform || "unknown"} />
          <EnvRow label="Memory" value={(buildInfo as any).memory || "N/A"} />
        </div>
      </div>
    </div>
  );
}

function RuntimeTab({ runtimeHealth }: { runtimeHealth: ReturnType<typeof useRuntimeHealth> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {runtimeHealth.components.map((comp, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#e8eaed] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-[#1a1a2e]">{comp.name}</span>
              <div className={`w-2 h-2 rounded-full ${
                comp.status === "healthy" ? "bg-green-500" :
                comp.status === "warning" ? "bg-yellow-500" :
                "bg-red-500"
              }`} />
            </div>
            <p className="text-[11px] text-[#5f6368]">{comp.message || "No message"}</p>
            <p className="text-[10px] text-[#9aa0a6] mt-0.5">
              Last check: {new Date(comp.lastCheck).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SdkTab() {
  return (
    <div className="bg-white rounded-lg border border-[#e8eaed] p-6 text-center">
      <Layers className="h-8 w-8 text-[#e8eaed] mx-auto mb-2" />
      <p className="text-[13px] text-[#5f6368]">SDK performance data available in Runtime Supervisor</p>
      <p className="text-[11px] text-[#9aa0a6] mt-1">Use the Debug Panel (Ctrl+Shift+E) for detailed SDK metrics</p>
    </div>
  );
}

function CacheTab({ cacheStats }: { cacheStats: ReturnType<typeof cacheManager.getStats> }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">Cache Status</span>
        </div>
        <div className="p-4 space-y-3">
          <EnvRow label="Cache Version" value={cacheStats.version} />
          <EnvRow label="Total Entries" value={String(cacheStats.totalEntries)} />
          <EnvRow label="Namespaces" value={Object.keys(cacheStats.namespaces).join(", ") || "None"} />
          {Object.entries(cacheStats.namespaces).map(([ns, count]) => (
            <EnvRow key={ns} label={`  ${ns}`} value={`${count} entries`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BuildTab({ buildInfo }: { buildInfo: ReturnType<typeof buildVersionManager.getBuildInfo> }) {
  const notes = releaseNotesGenerator.generate();

  const handleDownloadNotes = () => {
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-release-notes-${buildInfo.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">Release Notes</span>
          <button
            onClick={handleDownloadNotes}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-colors"
          >
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
        <pre className="p-4 text-[11px] text-[#5f6368] whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
          {notes}
        </pre>
      </div>
    </div>
  );
}

function FlagsTab({ flags }: { flags: ReturnType<typeof featureFlagManager.listFlags> }) {
  return (
    <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
        <span className="text-[12px] font-semibold text-[#1a1a2e]">Feature Flags ({flags.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
              <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Flag</th>
              <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Type</th>
              <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Scope</th>
              <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag, i) => (
              <tr key={i} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                <td className="px-4 py-2">
                  <span className="font-medium text-[#1a1a2e]">{flag.name}</span>
                  <p className="text-[10px] text-[#9aa0a6]">{flag.description}</p>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    flag.type === "production" ? "bg-green-50 text-green-600" :
                    flag.type === "beta" ? "bg-blue-50 text-blue-600" :
                    flag.type === "experimental" ? "bg-yellow-50 text-yellow-600" :
                    flag.type === "internal" ? "bg-purple-50 text-purple-600" :
                    "bg-gray-50 text-gray-600"
                  }`}>{flag.type}</span>
                </td>
                <td className="px-4 py-2 text-[#5f6368]">{flag.scope}</td>
                <td className="px-4 py-2 text-right">
                  <span className={flag.enabled ? "text-green-600" : "text-red-500"}>
                    {flag.enabled ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
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

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#5f6368]">{label}</span>
      <span className="text-[12px] font-mono text-[#1a1a2e] truncate max-w-[300px] ml-4" title={value}>{value}</span>
    </div>
  );
}
