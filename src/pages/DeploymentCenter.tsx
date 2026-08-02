/**
 * DeploymentCenter — Enterprise Deployment & Release Management Dashboard.
 *
 * Tabs:
 *  - Deployments — View deployment history and current status
 *  - Releases — Release management and channel tracking
 *  - Backups — Manual/scheduled backup management
 *  - Environments — Environment configuration overview
 *  - Health — Deployment health check results
 *  - Infrastructure — Live runtime observability (PATCH-ERP-003 Phase 2)
 *  - Rollback — Rollback management
 *  - Build History — Build verification history
 *  - Provisioning — Customer provisioning
 *  - CI/CD — CI/CD pipeline status
 */

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Server, Shield, Globe, Clock, HardDrive,
  RefreshCw, Download, Upload, CheckCircle, XCircle,
  AlertTriangle, Settings, Box, Layers, Zap, Terminal,
  FileText, UserPlus, GitBranch, ArrowLeft, ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { deploymentHealth, type DeploymentHealthStatus } from "@/platform/deployment/DeploymentHealth";
import { backupManager } from "@/platform/backup/BackupManager";
import { recoveryManager } from "@/platform/recovery/RecoveryManager";
import { releaseManager } from "@/platform/release/ReleaseManager";
import { buildVerifier } from "@/platform/release/BuildVerifier";
import { provisioningManager } from "@/platform/customer/ProvisioningManager";
import { buildVersionManager } from "@/platform/release/BuildVersionManager";
import { runtimeSelfTest } from "@/platform/runtime/RuntimeSelfTest";

type Tab = "deployments" | "releases" | "backups" | "environments" | "health" | "infrastructure" | "rollback" | "build-history" | "provisioning" | "cicd";

export default function DeploymentCenter() {
  const [activeTab, setActiveTab] = useState<Tab>("deployments");
  const [healthStatus, setHealthStatus] = useState<DeploymentHealthStatus | null>(null);
  const [runningChecks, setRunningChecks] = useState(false);

  const buildInfo = buildVersionManager.getBuildInfo();

  const runHealthCheck = useCallback(async () => {
    setRunningChecks(true);
    const status = await deploymentHealth.runAll();
    setHealthStatus(status);
    setRunningChecks(false);
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const tabs = [
    { id: "deployments" as Tab, label: "Deployments", icon: Globe },
    { id: "releases" as Tab, label: "Releases", icon: GitBranch },
    { id: "backups" as Tab, label: "Backups", icon: HardDrive },
    { id: "environments" as Tab, label: "Environments", icon: Settings },
    { id: "health" as Tab, label: "Health", icon: Activity },
    { id: "infrastructure" as Tab, label: "Infrastructure", icon: Server },
    { id: "rollback" as Tab, label: "Rollback", icon: RotateCcw },
    { id: "build-history" as Tab, label: "Build History", icon: Clock },
    { id: "provisioning" as Tab, label: "Provisioning", icon: UserPlus },
    { id: "cicd" as Tab, label: "CI/CD", icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-5 w-5 text-[#1a73e8]" />
              <h1 className="text-lg font-semibold text-[#1a1a2e]">Deployment Center</h1>
            </div>
            <p className="text-[12px] text-[#5f6368]">
              v{buildInfo.version} build {buildInfo.buildNumber} · {buildInfo.environment}
            </p>
          </div>
          {healthStatus && (
            <div className={`px-3 py-1.5 rounded-full border text-[12px] font-medium ${
              healthStatus.overall === "healthy" ? "bg-green-50 border-green-200 text-green-600" :
              healthStatus.overall === "degraded" ? "bg-yellow-50 border-yellow-200 text-yellow-600" :
              "bg-red-50 border-red-200 text-red-600"
            }`}>
              {healthStatus.overall.toUpperCase()}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-[#e8eaed] p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Version</p>
            <p className="text-[14px] font-semibold text-[#1a1a2e]">v{buildInfo.version}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#e8eaed] p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Build</p>
            <p className="text-[14px] font-semibold text-[#1a1a2e]">#{buildInfo.buildNumber}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#e8eaed] p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Environment</p>
            <p className="text-[14px] font-semibold text-[#1a1a2e] capitalize">{buildInfo.environment}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#e8eaed] p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Channel</p>
            <p className="text-[14px] font-semibold text-[#1a1a2e] capitalize">{buildInfo.releaseChannel}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#e8eaed] overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === "deployments" && <DeploymentsTab />}
        {activeTab === "releases" && <ReleasesTab />}
        {activeTab === "backups" && <BackupsTab />}
        {activeTab === "environments" && <EnvironmentsTab />}
        {activeTab === "health" && (
          <HealthTab status={healthStatus} running={runningChecks} onRecheck={runHealthCheck} />
        )}
        {activeTab === "infrastructure" && <InfrastructureTab />}
        {activeTab === "rollback" && <RollbackTab />}
        {activeTab === "build-history" && <BuildHistoryTab />}
        {activeTab === "provisioning" && <ProvisioningTab />}
        {activeTab === "cicd" && <CicdTab />}
      </div>
    </div>
  );
}

// ─── Deployments Tab ─────────────────────────────────────────

function DeploymentsTab() {
  const buildInfo = buildVersionManager.getBuildInfo();
  const releases = releaseManager.getHistory().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Current Deployment */}
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Current Deployment</h3>
        <div className="space-y-2 text-[12px]">
          <DeployRow label="Version" value={`v${buildInfo.version}`} />
          <DeployRow label="Build Number" value={buildInfo.buildNumber} />
          <DeployRow label="Environment" value={buildInfo.environment} />
          <DeployRow label="Release Channel" value={buildInfo.releaseChannel} />
          <DeployRow label="Git Commit" value={buildInfo.gitCommit.slice(0, 12)} />
          <DeployRow label="Build Time" value={buildInfo.buildTimestamp} />
          <DeployRow label="Convex URL" value={buildInfo.convexUrl.slice(0, 40) + "..."} />
        </div>
      </div>

      {/* Deployment History */}
      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">Deployment History</span>
        </div>
        {releases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Version</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Channel</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((r) => (
                  <tr key={r.id} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">v{r.version}</td>
                    <td className="px-4 py-2 text-[#5f6368] capitalize">{r.channel}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        r.type === "release" ? "bg-blue-50 text-blue-600" :
                        r.type === "hotfix" ? "bg-red-50 text-red-600" :
                        "bg-yellow-50 text-yellow-600"
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 ${
                        r.status === "active" ? "text-green-600" :
                        r.status === "rolled_back" ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[#9aa0a6]">
                      {new Date(r.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-[12px] text-[#9aa0a6]">No deployment history yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Releases Tab ────────────────────────────────────────────

function ReleasesTab() {
  const releases = releaseManager.getHistory();
  const latestRelease = releaseManager.getLatestRelease();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Release History</h3>
          <button
            onClick={() => releaseManager.registerRelease({ notes: "Manual release", author: "Admin" })}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Register Release
          </button>
        </div>

        {releases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Version</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Build</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Channel</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((r) => (
                  <tr key={r.id} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">v{r.version}</td>
                    <td className="px-4 py-2 text-[#5f6368]">#{r.buildNumber}</td>
                    <td className="px-4 py-2 text-[#5f6368] capitalize">{r.channel}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        r.type === "release" ? "bg-blue-50 text-blue-600" :
                        r.type === "hotfix" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"
                      }`}>{r.type}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-medium ${
                        r.status === "active" ? "text-green-600" :
                        r.status === "rolled_back" ? "text-yellow-600" : "text-red-600"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2 text-[#9aa0a6]">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-[12px] text-[#9aa0a6]">No releases registered. Click "Register Release" to create one.</div>
        )}
      </div>
    </div>
  );
}

// ─── Backups Tab ─────────────────────────────────────────────

function BackupsTab() {
  const [backups, setBackups] = useState(backupManager.getBackups());
  const [running, setRunning] = useState(false);

  const handleBackupAll = async () => {
    setRunning(true);
    await backupManager.backupAll();
    setBackups(backupManager.getBackups());
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Backup Manager</h3>
          <button
            onClick={handleBackupAll}
            disabled={running}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {running ? "Backing up..." : "Backup Now"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#fafafa] rounded-lg p-3 text-center">
            <p className="text-[20px] font-bold text-[#1a1a2e]">{backups.length}</p>
            <p className="text-[10px] text-[#9aa0a6]">Total Backups</p>
          </div>
          <div className="bg-[#fafafa] rounded-lg p-3 text-center">
            <p className="text-[20px] font-bold text-green-600">
              {backups.filter((b) => b.validated).length}
            </p>
            <p className="text-[10px] text-[#9aa0a6]">Validated</p>
          </div>
          <div className="bg-[#fafafa] rounded-lg p-3 text-center">
            <p className="text-[20px] font-bold text-[#1a1a2e]">
              {Math.round(backups.reduce((sum, b) => sum + b.size, 0) / 1024)}KB
            </p>
            <p className="text-[10px] text-[#9aa0a6]">Total Size</p>
          </div>
        </div>

        {backups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Label</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Size</th>
                  <th className="text-center px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Validated</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 capitalize">{b.type}</span>
                    </td>
                    <td className="px-4 py-2 text-[#1a1a2e]">{b.label}</td>
                    <td className="px-4 py-2 text-right text-[#5f6368]">{b.size} B</td>
                    <td className="px-4 py-2 text-center">
                      {b.validated ? <CheckCircle className="h-3.5 w-3.5 text-green-500 inline" /> : <XCircle className="h-3.5 w-3.5 text-yellow-500 inline" />}
                    </td>
                    <td className="px-4 py-2 text-right text-[#9aa0a6]">{new Date(b.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-[12px] text-[#9aa0a6]">No backups yet. Click "Backup Now" to create one.</div>
        )}
      </div>
    </div>
  );
}

// ─── Environments Tab ────────────────────────────────────────

function EnvironmentsTab() {
  const buildInfo = buildVersionManager.getBuildInfo();
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string || "Not set";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Environment Variables</h3>
        <div className="space-y-2 text-[12px]">
          <EnvVarRow label="VITE_CONVEX_URL" value={convexUrl} present={!!convexUrl && convexUrl !== "Not set"} />
          <EnvVarRow label="MODE" value={import.meta.env.MODE as string || "unknown"} present={true} />
          <EnvVarRow label="CONVEX_DEPLOY_KEY" value="••••••••" present={false} isSecret />
          <EnvVarRow label="SENTRY_DSN" value="Not configured" present={false} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Runtime</h3>
        <div className="space-y-2 text-[12px]">
          <EnvVarRow label="React" value="19.2" present={true} />
          <EnvVarRow label="Vite" value="7.2" present={true} />
          <EnvVarRow label="Convex" value="1.42" present={true} />
          <EnvVarRow label="Node (target)" value="esnext" present={true} />
        </div>
      </div>
    </div>
  );
}

// ─── Health Tab ──────────────────────────────────────────────

function HealthTab({ status, running, onRecheck }: {
  status: DeploymentHealthStatus | null;
  running: boolean;
  onRecheck: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Deployment Health Checks</h3>
          <button
            onClick={onRecheck}
            disabled={running}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Running..." : "Re-check"}
          </button>
        </div>

        {status ? (
          <div className="space-y-2">
            {status.checks.map((check) => (
              <div key={check.name} className="flex items-center justify-between py-2 px-3 bg-[#fafafa] rounded-lg">
                <div className="flex items-center gap-2">
                  {check.status === "pass" ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                   check.status === "warn" ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
                   <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-[12px] text-[#1a1a2e] font-medium">{check.name}</span>
                </div>
                <span className="text-[11px] text-[#5f6368]">{check.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-[12px] text-[#9aa0a6]">
            {running ? "Running health checks..." : "No health data available"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Infrastructure Tab (live runtime observability, PATCH-ERP-003) ──

function InfrastructureTab() {
  const sysHealth = useQuery(api.adminEngine.getSystemHealth, {}) as any;
  const runtimeHealth = useQuery(api.runtimeObservability.getSystemHealth, {}) as any;
  const queues = useQuery(api.runtimeObservability.getQueueLengths, {}) as any;
  const workflow = useQuery(api.runtimeObservability.getWorkflowHealth, {}) as any;
  const integrations = useQuery(api.integrationEngine.getIntegrationDashboard, {}) as any;
  const apiKeys = useQuery(api.adminEngine.listApiKeys, {}) as any[];
  const webhooks = useQuery(api.adminEngine.listWebhooks, {}) as any[];
  const jobs = useQuery(api.adminEngine.listScheduledJobs, {}) as any[];
  const audit = useQuery(api.adminEngine.listAuditLogs, { limit: 8 }) as any[];

  const createJob = useMutation(api.adminEngine.createScheduledJob);
  const toggleJob = useMutation(api.adminEngine.toggleJob);
  const createApiKey = useMutation(api.adminEngine.createApiKey);
  const revokeApiKey = useMutation(api.adminEngine.revokeApiKey);
  const createWebhook = useMutation(api.adminEngine.createWebhook);

  const [showNewJob, setShowNewJob] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobType, setJobType] = useState("report");
  const [jobSchedule, setJobSchedule] = useState("0 6 * * *");
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");

  const checks = runtimeHealth?.checks
    ? Object.entries(runtimeHealth.checks as Record<string, { status: string; message: string }>)
    : [];

  const queueEntries = queues ? Object.entries(queues) : [];

  return (
    <div className="space-y-4">
      {/* Runtime KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall", value: runtimeHealth?.overall ?? "—", tone: runtimeHealth?.overall === "CRITICAL" ? "text-red-600" : runtimeHealth?.overall === "WARNING" ? "text-amber-600" : "text-green-600" },
          { label: "Checks Healthy", value: `${runtimeHealth?.healthyCount ?? 0}/${runtimeHealth?.totalChecks ?? 0}`, tone: "text-[#1a1a2e]" },
          { label: "Total Users", value: String(sysHealth?.totalUsers ?? 0), tone: "text-[#1a73e8]" },
          { label: "Uptime", value: sysHealth?.uptime ? `${Math.max(1, Math.floor((sysHealth.uptime ?? 0) / 60))}m` : "—", tone: "text-[#1a1a2e]" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-lg border border-[#e8eaed] p-3.5">
            <p className="text-[10px] text-[#9aa0a6] font-medium">{m.label}</p>
            <p className={`text-[18px] font-semibold mt-0.5 ${m.tone}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Runtime checks + queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#1a73e8]" /> Runtime Health Checks
          </h3>
          <div className="space-y-1.5">
            {checks.map(([key, check]) => (
              <div key={key} className="flex items-center gap-2 text-[11px]">
                {check.status === "HEALTHY" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> :
                 check.status === "WARNING" ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> :
                 <XCircle className="h-3.5 w-3.5 text-red-500" />}
                <span className="text-[#5f6368] capitalize w-24">{key}</span>
                <span className="text-[#9aa0a6] truncate">{check.message}</span>
              </div>
            ))}
            {checks.length === 0 && <p className="text-[11px] text-[#9aa0a6]">Loading runtime health…</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#1a73e8]" /> Queue Health
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {queueEntries.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 bg-[#fafafa] rounded-lg">
                  <span className="text-[10px] text-[#5f6368] capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="text-[12px] font-semibold text-[#1a1a2e]">{String(val)}</span>
                </div>
              ))}
              {queueEntries.length === 0 && <p className="text-[11px] text-[#9aa0a6]">Loading queues…</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#f59e0b]" /> Workflow Health
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Running", value: workflow?.running ?? 0, tone: "text-[#1a73e8]" },
                { label: "Failed", value: workflow?.failed ?? 0, tone: (workflow?.failed ?? 0) > 0 ? "text-red-600" : "text-green-600" },
                { label: "Success", value: `${workflow?.successRate ?? 100}%`, tone: "text-green-600" },
              ].map((m) => (
                <div key={m.label} className="bg-[#fafafa] rounded-lg py-2">
                  <p className={`text-[14px] font-semibold ${m.tone}`}>{m.value}</p>
                  <p className="text-[9px] text-[#9aa0a6]">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#1a73e8]" /> Integration Logs & Connectors
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-[#e8f0fe] text-[#1a73e8] text-[11px] font-medium rounded-lg">{integrations?.totalConnectors ?? 0} connectors</span>
          <span className="px-2.5 py-1 bg-[#e6f4ea] text-[#34a853] text-[11px] font-medium rounded-lg">{integrations?.activeConnectors ?? 0} active</span>
          <span className="px-2.5 py-1 bg-[#f1f3f4] text-[#5f6368] text-[11px] font-medium rounded-lg">{integrations?.availableTypes ?? 0} available types</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(integrations?.byType ?? []).slice(0, 8).map((t: any) => (
            <div key={t.type} className="flex items-center justify-between px-3 py-2 bg-[#fafafa] rounded-lg">
              <span className="text-[11px] text-[#5f6368]">{t.name}</span>
              <span className="text-[11px] font-semibold text-[#1a1a2e]">{t.active}/{t.total}</span>
            </div>
          ))}
          {(integrations?.byType ?? []).length === 0 && <p className="text-[11px] text-[#9aa0a6]">No connectors configured yet</p>}
        </div>
      </div>

      {/* Scheduled jobs */}
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#1a73e8]" /> Scheduled Jobs
          </h3>
          <button onClick={() => setShowNewJob(!showNewJob)}
            className="px-3 py-1.5 bg-[#1a73e8] text-white text-[11px] font-medium rounded-lg hover:bg-[#1765cc] transition-colors">
            {showNewJob ? "Cancel" : "+ New Job"}
          </button>
        </div>
        {showNewJob && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-[#fafafa] rounded-lg">
            <input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="Job name"
              className="h-8 flex-1 text-[11px] px-2.5 border border-[#e8eaed] rounded-md" />
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}
              className="h-8 text-[11px] px-2 border border-[#e8eaed] rounded-md bg-white">
              {["report", "backup", "sync", "cleanup", "notify"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={jobSchedule} onChange={(e) => setJobSchedule(e.target.value)} placeholder="cron"
              className="h-8 w-28 text-[11px] px-2.5 border border-[#e8eaed] rounded-md font-mono" />
            <button disabled={!jobName.trim()}
              onClick={() => { createJob({ name: jobName, jobType, schedule: jobSchedule }); setJobName(""); setShowNewJob(false); }}
              className="h-8 px-3 bg-[#34a853] text-white text-[11px] font-medium rounded-lg hover:bg-[#2d9249] transition-colors disabled:opacity-50">
              Create
            </button>
          </div>
        )}
        <div className="space-y-1.5">
          {(jobs ?? []).map((j) => (
            <div key={j._id} className="flex items-center justify-between px-3 py-2 bg-[#fafafa] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#1a1a2e]">{j.name}</span>
                <span className="text-[10px] text-[#9aa0a6] font-mono">{j.jobType} · {j.schedule}</span>
                {j.isActive ? <span className="text-[9px] px-1.5 py-0.5 bg-[#e6f4ea] text-[#34a853] rounded-full">active</span>
                  : <span className="text-[9px] px-1.5 py-0.5 bg-[#f1f3f4] text-[#9aa0a6] rounded-full">paused</span>}
              </div>
              <button onClick={() => toggleJob({ id: j._id, isActive: !j.isActive })}
                className="text-[10px] px-2 py-1 rounded-lg border border-[#e8eaed] hover:bg-[#f1f3f4] transition-colors">
                {j.isActive ? "Pause" : "Resume"}
              </button>
            </div>
          ))}
          {(jobs ?? []).length === 0 && <p className="text-[11px] text-[#9aa0a6]">No scheduled jobs</p>}
        </div>
      </div>

      {/* API Keys + Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">API Keys</h3>
          <div className="space-y-1.5 mb-3">
            {(apiKeys ?? []).slice(0, 5).map((k) => (
              <div key={k._id} className="flex items-center justify-between px-3 py-2 bg-[#fafafa] rounded-lg">
                <div>
                  <p className="text-[11px] font-medium text-[#1a1a2e]">{k.name}</p>
                  <p className="text-[9px] text-[#9aa0a6] font-mono">{k.key?.slice(0, 14)}… · {k.scope}</p>
                </div>
                <button onClick={() => revokeApiKey({ id: k._id })}
                  className="text-[9px] px-2 py-1 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors">
                  Revoke
                </button>
              </div>
            ))}
            {(apiKeys ?? []).length === 0 && <p className="text-[11px] text-[#9aa0a6]">No API keys</p>}
          </div>
          <div className="flex gap-2">
            <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name"
              className="h-8 flex-1 text-[11px] px-2.5 border border-[#e8eaed] rounded-md" />
            <button disabled={!newKeyName.trim()}
              onClick={() => { createApiKey({ name: newKeyName, scope: "api" }); setNewKeyName(""); }}
              className="h-8 px-3 bg-[#1a73e8] text-white text-[11px] font-medium rounded-lg hover:bg-[#1765cc] transition-colors disabled:opacity-50">
              Generate
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
          <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Webhooks</h3>
          <div className="space-y-1.5 mb-3">
            {(webhooks ?? []).slice(0, 5).map((w) => (
              <div key={w._id} className="flex items-center justify-between px-3 py-2 bg-[#fafafa] rounded-lg">
                <div>
                  <p className="text-[11px] font-medium text-[#1a1a2e]">{w.name}</p>
                  <p className="text-[9px] text-[#9aa0a6] truncate max-w-[240px]">{w.url}</p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${w.isActive ? "bg-[#e6f4ea] text-[#34a853]" : "bg-[#f1f3f4] text-[#9aa0a6]"}`}>
                  {w.isActive ? "active" : "inactive"}
                </span>
              </div>
            ))}
            {(webhooks ?? []).length === 0 && <p className="text-[11px] text-[#9aa0a6]">No webhooks</p>}
          </div>
          <div className="flex gap-2">
            <input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://…"
              className="h-8 flex-1 text-[11px] px-2.5 border border-[#e8eaed] rounded-md font-mono" />
            <button disabled={!newWebhookUrl.trim()}
              onClick={() => { createWebhook({ name: newWebhookUrl.slice(0, 24), url: newWebhookUrl, events: ["ticket.created"] }); setNewWebhookUrl(""); }}
              className="h-8 px-3 bg-[#34a853] text-white text-[11px] font-medium rounded-lg hover:bg-[#2d9249] transition-colors disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#1a73e8]" /> Recent Audit Logs
        </h3>
        <div className="space-y-1">
          {(audit ?? []).map((a) => (
            <div key={a._id} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-[#f1f3f4] last:border-0">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                a.severity === "error" || a.severity === "critical" ? "bg-red-50 text-red-600" :
                a.severity === "warn" ? "bg-amber-50 text-amber-600" : "bg-[#e8f0fe] text-[#1a73e8]"
              }`}>{a.severity || "info"}</span>
              <span className="text-[#5f6368]">{a.action || a.message || a.module || "—"}</span>
              <span className="ml-auto text-[9px] text-[#9aa0a6]">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span>
            </div>
          ))}
          {(audit ?? []).length === 0 && <p className="text-[11px] text-[#9aa0a6]">No audit log entries</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Rollback Tab ────────────────────────────────────────────

function RollbackTab() {
  const releases = releaseManager.getHistory().filter((r) => r.status === "rolled_back" || r.type === "release");
  const [message, setMessage] = useState("");

  const handleRollback = (id: string) => {
    releaseManager.rollback(id);
    setMessage("Rollback registered successfully");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-[12px] px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#e8eaed]">
          <span className="text-[12px] font-semibold text-[#1a1a2e]">Rollback Targets</span>
        </div>
        {releases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Version</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Channel</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[#9aa0a6] font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {releases.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                    <td className="px-4 py-2 font-medium text-[#1a1a2e]">v{r.version}</td>
                    <td className="px-4 py-2 text-[#5f6368] capitalize">{r.channel}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRollback(r.id)}
                        className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[11px] font-medium rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-[12px] text-[#9aa0a6]">No rollback targets available</div>
        )}
      </div>
    </div>
  );
}

// ─── Build History Tab ───────────────────────────────────────

function BuildHistoryTab() {
  const [verification, setVerification] = useState<{ passed: number; failed: number; warnings: number } | null>(null);

  useEffect(() => {
    buildVerifier.verify().then((r) => setVerification({ passed: r.passed, failed: r.failed, warnings: r.warnings }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4 text-center">
          <p className="text-[24px] font-bold text-green-600">{verification?.passed || 0}</p>
          <p className="text-[11px] text-[#9aa0a6]">Passed</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4 text-center">
          <p className="text-[24px] font-bold text-yellow-600">{verification?.warnings || 0}</p>
          <p className="text-[11px] text-[#9aa0a6]">Warnings</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4 text-center">
          <p className="text-[24px] font-bold text-red-600">{verification?.failed || 0}</p>
          <p className="text-[11px] text-[#9aa0a6]">Failed</p>
        </div>
      </div>
    </div>
  );
}

// ─── Provisioning Tab ────────────────────────────────────────

function ProvisioningTab() {
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);

  const handleProvision = async () => {
    setRunning(true);
    const template = provisioningManager.getDefaultTemplate();
    const res = await provisioningManager.provision(template);
    setResult(res.success
      ? `✅ Provisioned "${template.organizationName}" in ${res.duration}ms (${res.steps.length} steps)`
      : `❌ Provisioning failed: ${res.error}`);
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Customer Provisioning</h3>
        <p className="text-[12px] text-[#5f6368] mb-4">
          One-click organization setup. Creates organization, CEO user, branch, academic year, roles, permissions, and feature flags.
        </p>
        <button
          onClick={handleProvision}
          disabled={running}
          className="flex items-center gap-1 px-4 py-2 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> {running ? "Provisioning..." : "Provision Demo Organization"}
        </button>
        {result && (
          <div className="mt-3 p-3 bg-[#fafafa] rounded-lg text-[12px] text-[#5f6368]">{result}</div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Provisioning Template</h3>
        <div className="space-y-2 text-[12px]">
          <DeployRow label="Organization" value="New Academy" />
          <DeployRow label="Code" value="ACADEMY" />
          <DeployRow label="CEO" value="John Doe (ceo@academy.edu)" />
          <DeployRow label="Branch" value="Main Campus" />
          <DeployRow label="Academic Year" value="2026-2027" />
        </div>
      </div>
    </div>
  );
}

// ─── CI/CD Tab ───────────────────────────────────────────────

function CicdTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e8eaed] p-4">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">CI/CD Pipelines</h3>
        <p className="text-[12px] text-[#5f6368] mb-4">
          CI/CD is configured via GitHub Actions. The following workflows are available:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-[#fafafa] rounded-lg border border-[#e8eaed]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#1a1a2e]">CI — Continuous Integration</p>
                <p className="text-[11px] text-[#5f6368]">Runs on PR and push to develop/staging</p>
              </div>
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-medium rounded">ci.yml</span>
            </div>
            <div className="mt-2 text-[11px] text-[#5f6368]">
              Steps: Install → TypeScript Check → ESLint → Build Validation → Bundle Size Report
            </div>
          </div>

          <div className="p-3 bg-[#fafafa] rounded-lg border border-[#e8eaed]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#1a1a2e]">Preview Deploy</p>
                <p className="text-[11px] text-[#5f6368]">Runs on PR to main/develop</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">deploy-preview.yml</span>
            </div>
            <div className="mt-2 text-[11px] text-[#5f6368]">
              Steps: Deploy Convex (Preview) → Vite Build → Verify Artifacts
            </div>
          </div>

          <div className="p-3 bg-[#fafafa] rounded-lg border border-[#e8eaed]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#1a1a2e]">Production Deploy</p>
                <p className="text-[11px] text-[#5f6368]">Runs on push to main or manual trigger</p>
              </div>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-medium rounded">deploy-production.yml</span>
            </div>
            <div className="mt-2 text-[11px] text-[#5f6368]">
              Steps: Validate → Deploy Convex → Build Frontend → Generate Release Notes → Deploy to Vercel → Notify
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────

function DeployRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[#5f6368]">{label}</span>
      <span className="font-mono font-medium text-[#1a1a2e]">{value}</span>
    </div>
  );
}

function EnvVarRow({ label, value, present, isSecret }: { label: string; value: string; present: boolean; isSecret?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {present ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-yellow-500" />}
        <span className="text-[#5f6368]">{label}</span>
      </div>
      <span className={`font-mono text-[11px] ${present ? "text-[#1a1a2e]" : "text-yellow-600"}`}>{value}</span>
    </div>
  );
}
