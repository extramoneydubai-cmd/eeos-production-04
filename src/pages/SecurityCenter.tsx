/**
 * SecurityCenter — Enterprise Security & Compliance Dashboard
 *
 * Route: /security
 * Tabs: Overview | Sessions | Permissions | Login Analytics | Compliance | API Keys | Policies | Reports
 *
 * Integrates with:
 * - SecurityEngine
 * - AuditAggregator
 * - RiskEngine
 * - SessionMonitor
 * - PermissionInspector
 * - SecurityExporter
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/use-auth";
import { securityEngine } from "../platform/security/SecurityEngine";
import { auditAggregator } from "../platform/security/AuditAggregator";
import { riskEngine } from "../platform/security/RiskEngine";
import { sessionMonitor } from "../platform/security/SessionMonitor";
import { permissionInspector } from "../platform/security/PermissionInspector";
import { securityExporter } from "../platform/security/SecurityExporter";
import { errorLogger } from "../lib/error-logger";
import {
  Shield,
  Activity,
  Users,
  KeyRound,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Lock,
  Eye,
  RefreshCw,
  XCircle,
  Terminal,
  UserCheck,
  Ban,
  LogIn,
  BarChart3,
  Globe,
  Server,
  Smartphone,
  Monitor,
  PieChart,
  ShieldAlert,
  FileCheck,
  FileWarning,
  DownloadCloud,
  Copy,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-react";

// ─── Tab Types ──────────────────────────────────────────────────

type SecurityTab = "overview" | "sessions" | "permissions" | "analytics" | "compliance" | "api-keys" | "policies" | "reports";

// ─── Sub-components ─────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color = "blue", trend }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "cyan";
  trend?: { direction: "up" | "down"; value: string };
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    yellow: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-400",
    green: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-amber-400",
    purple: "text-purple-400",
    cyan: "text-cyan-400",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-slate-900/40 ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-1 ${
            trend.direction === "up" ? "text-green-400" : "text-red-400"
          }`}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    info: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-green-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
    uninitialized: "bg-slate-500",
    active: "bg-green-500",
    idle: "bg-amber-500",
    expired: "bg-red-500",
    revoked: "bg-red-500",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-slate-500"}`} />
  );
}

// ─── Tab Content Components ─────────────────────────────────────

function OverviewTab() {
  const [risk, setRisk] = useState(riskEngine.getGlobalAssessment());
  const [health, setHealth] = useState({ security: securityEngine.getHealth(), audit: auditAggregator.getHealth(), risk: riskEngine.getHealth(), sessions: sessionMonitor.getHealth(), permissions: permissionInspector.getHealth() });
  const [compliance, setCompliance] = useState(securityEngine.getComplianceStatus());
  const [loginAnalytics, setLoginAnalytics] = useState(securityEngine.getLoginAnalytics());
  const [anomalies, setAnomalies] = useState(sessionMonitor.getAnomalyCount());
  const [events, setEvents] = useState(errorLogger?.getEntries?.() ?? []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRisk(riskEngine.getGlobalAssessment());
      setHealth({ security: securityEngine.getHealth(), audit: auditAggregator.getHealth(), risk: riskEngine.getHealth(), sessions: sessionMonitor.getHealth(), permissions: permissionInspector.getHealth() });
      setCompliance(securityEngine.getComplianceStatus());
      setLoginAnalytics(securityEngine.getLoginAnalytics());
      setAnomalies(sessionMonitor.getAnomalyCount());
      setEvents(errorLogger?.getEntries?.() ?? []);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fatalErrors = events.filter((e: any) => e.severity === "fatal" || e.severity === "critical").length;

  return (
    <div className="space-y-6">
      {/* Risk Score Banner */}
      <div className={`rounded-xl border p-6 ${
        risk.label === "critical" ? "bg-red-900/10 border-red-500/30" :
        risk.label === "high" ? "bg-orange-900/10 border-orange-500/30" :
        risk.label === "medium" ? "bg-amber-900/10 border-amber-500/30" :
        "bg-emerald-900/10 border-emerald-500/30"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className={`w-6 h-6 ${
                risk.label === "critical" ? "text-red-400" :
                risk.label === "high" ? "text-orange-400" :
                risk.label === "medium" ? "text-amber-400" :
                "text-emerald-400"
              }`} />
              <span className="text-lg font-semibold text-white">Platform Risk Score</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold ${
                risk.label === "critical" ? "text-red-400" :
                risk.label === "high" ? "text-orange-400" :
                risk.label === "medium" ? "text-amber-400" :
                "text-emerald-400"
              }`}>{risk.score}</span>
              <span className="text-sm uppercase tracking-wider text-slate-400">/ 100</span>
              <SeverityBadge severity={risk.label} />
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3">
            {risk.factors.slice(0, 4).map((f, i) => (
              <div key={i} className="bg-slate-900/40 rounded-lg px-3 py-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{f.name}</span>
                  <span className={`font-medium ${
                    f.score >= 70 ? "text-red-400" :
                    f.score >= 45 ? "text-orange-400" :
                    f.score >= 20 ? "text-amber-400" :
                    "text-green-400"
                  }`}>{f.score}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    f.score >= 70 ? "bg-red-500" :
                    f.score >= 45 ? "bg-orange-500" :
                    f.score >= 20 ? "bg-amber-500" :
                    "bg-green-500"
                  }`} style={{ width: `${f.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard icon={Shield} label="Security Health" value={health.security.status} color="blue" />
        <KpiCard icon={Activity} label="Audit Events" value={health.audit.entryCount} color="cyan" />
        <KpiCard icon={AlertTriangle} label="Risk Score" value={risk.score} sub={risk.label} color={risk.label === "critical" ? "red" : risk.label === "high" ? "yellow" : "green"} />
        <KpiCard icon={Users} label="Active Sessions" value={health.sessions.activeSessions} color="purple" />
        <KpiCard icon={LogIn} label="Failed Logins" value={loginAnalytics.failedLogins} color="red" />
        <KpiCard icon={Lock} label="Permissions" value={health.permissions.permissions} sub={`${health.permissions.roles} roles`} color="green" />
      </div>

      {/* Compliance Summary */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          Compliance Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {compliance.map((c, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">{c.standard}</div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  c.compliancePercent >= 90 ? "text-emerald-400" :
                  c.compliancePercent >= 70 ? "text-amber-400" :
                  "text-red-400"
                }`}>{c.compliancePercent}%</span>
                {c.compliancePercent >= 90 ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                 c.compliancePercent >= 70 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                 <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Critical Events */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Recent Critical Events
        </h3>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {riskEngine.getRecentHighRiskEvents(10).map((event, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity="critical" />
                  <span className="text-sm text-slate-300">{event.type.replace(/_/g, " ")}</span>
                </div>
                <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
            ))}
            {riskEngine.getRecentHighRiskEvents(10).length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                <p className="text-sm">No critical events. Platform is healthy.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsTab() {
  const [sessions, setSessions] = useState(sessionMonitor.getActiveSessions());
  const [anomalies, setAnomalies] = useState(sessionMonitor.getRecentAnomalies(20));
  const [stats, setStats] = useState(sessionMonitor.getSessionStats());
  const [anomalyCount, setAnomalyCount] = useState(sessionMonitor.getAnomalyCount());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(sessionMonitor.getActiveSessions());
      setAnomalies(sessionMonitor.getRecentAnomalies(20));
      setStats(sessionMonitor.getSessionStats());
      setAnomalyCount(sessionMonitor.getAnomalyCount());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Session Stats */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Active" value={stats.active} color="green" />
        <KpiCard icon={Clock} label="Idle" value={stats.idle} color="yellow" />
        <KpiCard icon={XCircle} label="Expired" value={stats.expired} color="red" />
        <KpiCard icon={AlertTriangle} label="Anomalies" value={anomalyCount.unresolved} sub={`${anomalyCount.total} total`} color={anomalyCount.unresolved > 0 ? "red" : "green"} />
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Active Sessions ({sessions.length})</h3>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Started</th>
                <th className="text-left px-4 py-3 font-medium">Last Activity</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Browser</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-200">{session.userName || session.userId}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(session.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(session.lastActivityAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(session.expiresAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{session.browser || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs ${
                      session.isActive ? "text-emerald-400" : "text-slate-500"
                    }`}>
                      <StatusDot status={session.isActive ? "active" : "expired"} />
                      {session.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No active sessions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Session Anomalies
          </h3>
          <div className="space-y-2">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className={`rounded-lg border p-3 flex items-start justify-between ${
                anomaly.severity === "critical" ? "bg-red-900/10 border-red-500/30" :
                anomaly.severity === "high" ? "bg-orange-900/10 border-orange-500/30" :
                "bg-amber-900/10 border-amber-500/30"
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    anomaly.severity === "critical" ? "text-red-400" :
                    anomaly.severity === "high" ? "text-orange-400" :
                    "text-amber-400"
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{anomaly.type.replace(/_/g, " ")}</span>
                      <SeverityBadge severity={anomaly.severity} />
                    </div>
                    <p className="text-xs text-slate-400">{anomaly.details}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(anomaly.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {anomaly.resolved ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <button
                    onClick={() => sessionMonitor.resolveAnomaly(anomaly.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionsTab() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>(["staff"]);
  const [profile, setProfile] = useState(permissionInspector.resolvePermissions(user?._id || "anonymous", roles));
  const [checkResource, setCheckResource] = useState("student");
  const [checkAction, setCheckAction] = useState("read");

  const handleCheck = useCallback(() => {
    const result = permissionInspector.checkPermission(user?._id || "anonymous", roles, checkResource, checkAction);
    setProfile(permissionInspector.resolvePermissions(user?._id || "anonymous", roles));
    alert(result.explanation);
  }, [user, roles, checkResource, checkAction]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission Explorer */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            Permission Explorer
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Roles (comma-separated)</label>
              <input
                type="text"
                value={roles.join(", ")}
                onChange={(e) => setRoles(e.target.value.split(",").map((r) => r.trim()).filter(Boolean))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Resource</label>
                <select
                  value={checkResource}
                  onChange={(e) => setCheckResource(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  {["people", "student", "employee", "finance", "academic", "attendance", "examination", "lms", "calendar", "tasks", "reports", "admin"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Action</label>
                <select
                  value={checkAction}
                  onChange={(e) => setCheckAction(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  {["read", "write", "delete", "admin"].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleCheck}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
            >
              Check Permission
            </button>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            Permission Profile
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Roles</span>
              <span className="text-slate-200">{profile.roles.join(", ") || "None"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Inherited</span>
              <span className="text-slate-200">{profile.inheritedRoles.join(", ") || "None"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Effective Permissions</span>
              <span className="text-slate-200">{profile.effectivePermissions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Permission Sources</span>
              <span className="text-slate-200">{profile.permissionSources.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Scope</span>
              <span className="text-slate-200">{permissionInspector.getScopeExplanation(profile)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Effective Permissions Table */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Effective Permissions ({profile.effectivePermissions.length})</h3>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Resource</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Allowed</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {profile.effectivePermissions.map((perm, i) => (
                <tr key={i} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-200">{perm.resource}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">{perm.action}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {perm.allowed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{perm.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(securityEngine.getLoginAnalytics());

  useEffect(() => {
    const interval = setInterval(() => setAnalytics(securityEngine.getLoginAnalytics()), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={LogIn} label="Successful Logins" value={analytics.successfulLogins} color="green" />
        <KpiCard icon={Ban} label="Failed Logins" value={analytics.failedLogins} color="red" />
        <KpiCard icon={Lock} label="Locked Accounts" value={analytics.lockedAccounts} color="yellow" />
        <KpiCard icon={Clock} label="Expired Sessions" value={analytics.expiredSessions} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Breakdown */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Hourly Login Activity</h3>
          <div className="h-40">
            <div className="flex items-end gap-1 h-32">
              {analytics.hourlyBreakdown.map((count, hour) => {
                const max = Math.max(...analytics.hourlyBreakdown, 1);
                const height = (count / max) * 100;
                const isPeak = hour === analytics.peakHour;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500">{count || ""}</span>
                    <div
                      className={`w-full rounded-t ${isPeak ? "bg-blue-500" : "bg-blue-500/40"} transition-all duration-300`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`text-[10px] ${isPeak ? "text-blue-400 font-medium" : "text-slate-600"}`}>
                      {hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">Peak hour: {analytics.peakHour}:00</div>
        </div>

        {/* Browsers & Devices */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Browsers</h3>
          <div className="space-y-2">
            {Object.entries(analytics.browsers).map(([browser, count]) => (
              <div key={browser} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{browser}</span>
                </div>
                <span className="text-sm text-slate-400">{count}</span>
              </div>
            ))}
            {Object.keys(analytics.browsers).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No browser data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceTab() {
  const [compliance, setCompliance] = useState(securityEngine.getComplianceStatus());
  const [policies, setPolicies] = useState(securityEngine.getPolicies());

  useEffect(() => {
    const interval = setInterval(() => {
      setCompliance(securityEngine.getComplianceStatus());
      setPolicies(securityEngine.getPolicies());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {compliance.map((c, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-200">{c.standard}</h3>
              {c.compliancePercent >= 90 ? (
                <FileCheck className="w-5 h-5 text-emerald-400" />
              ) : c.compliancePercent >= 70 ? (
                <FileWarning className="w-5 h-5 text-amber-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="text-3xl font-bold mb-2 text-white">{c.compliancePercent}%</div>
            <div className="h-2 bg-slate-800 rounded-full mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  c.compliancePercent >= 90 ? "bg-emerald-500" :
                  c.compliancePercent >= 70 ? "bg-amber-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${c.compliancePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mb-3">
              <span>Passed: {c.passed}</span>
              <span>Failed: {c.failed}</span>
            </div>
            {c.violations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-xs text-red-400 font-medium mb-1">Violations</p>
                {c.violations.map((v, vi) => (
                  <p key={vi} className="text-xs text-slate-400 mb-1">• {v}</p>
                ))}
              </div>
            )}
            {c.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-xs text-amber-400 font-medium mb-1">Recommendations</p>
                {c.recommendations.map((r, ri) => (
                  <p key={ri} className="text-xs text-slate-400 mb-1">• {r}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Policies */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Security Policies ({policies.length})</h3>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Policy</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{policy.name}</div>
                    <div className="text-xs text-slate-500">{policy.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">{policy.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    {policy.enabled ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><SeverityBadge severity={policy.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState(securityEngine.getApiKeys());
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", scopes: "" });

  const handleAddKey = () => {
    if (!newKey.name.trim()) return;
    securityEngine.addApiKey({
      name: newKey.name.trim(),
      keyPrefix: `eek_${Math.random().toString(36).slice(2, 8)}`,
      scopes: newKey.scopes.split(",").map((s) => s.trim()).filter(Boolean),
      permissions: [],
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      usedCount: 0,
      status: "active",
    });
    setKeys(securityEngine.getApiKeys());
    setNewKey({ name: "", scopes: "" });
    setShowAdd(false);
  };

  const handleRevoke = (keyId: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    securityEngine.revokeApiKey(keyId);
    setKeys(securityEngine.getApiKeys());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">API Keys ({keys.length})</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors"
        >
          + New Key
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Key Name</label>
              <input
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                placeholder="e.g., Production API Key"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Scopes (comma-separated)</label>
              <input
                type="text"
                value={newKey.scopes}
                onChange={(e) => setNewKey({ ...newKey, scopes: e.target.value })}
                placeholder="e.g., students.read, finance.write"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddKey} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg px-4 py-2 transition-colors">
                Create Key
              </button>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-xs px-3 py-2 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Key</th>
              <th className="text-left px-4 py-3 font-medium">Scopes</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-4 py-3 font-medium">Expires</th>
              <th className="text-left px-4 py-3 font-medium">Used</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                <td className="px-4 py-3 text-slate-200">{key.name}</td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{key.keyPrefix}...</code>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {key.scopes.map((scope, si) => (
                      <span key={si} className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">{scope}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(key.created).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}</td>
                <td className="px-4 py-3 text-slate-400">{key.usedCount}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs ${
                    key.status === "active" ? "text-emerald-400" :
                    key.status === "expired" ? "text-amber-400" :
                    "text-red-400"
                  }`}>
                    <StatusDot status={key.status} />
                    {key.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {key.status === "active" && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      className="text-red-400 hover:text-red-300 text-xs transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No API keys configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PoliciesTab() {
  const [policies, setPolicies] = useState(securityEngine.getPolicies());

  const togglePolicy = (policyId: string, enabled: boolean) => {
    securityEngine.updatePolicy(policyId, { enabled });
    setPolicies(securityEngine.getPolicies());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-slate-200">{policy.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{policy.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(e) => togglePolicy(policy.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">{policy.category}</span>
              <SeverityBadge severity={policy.severity} />
              <span className="text-xs text-slate-500 ml-auto">
                Updated {new Date(policy.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTab() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (type: string, format: "json" | "markdown" | "csv") => {
    setGenerating(type);
    setTimeout(() => {
      try {
        securityExporter.download(type as any, format);
      } catch (e) {
        console.error("Export failed:", e);
      }
      setGenerating(null);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { type: "risk_assessment", label: "Risk Assessment", icon: ShieldAlert, color: "red" },
          { type: "security_events", label: "Security Events", icon: Activity, color: "blue" },
          { type: "session_report", label: "Session Report", icon: Users, color: "purple" },
          { type: "permission_profile", label: "Permission Profile", icon: Lock, color: "green" },
          { type: "compliance_report", label: "Compliance Report", icon: FileCheck, color: "cyan" },
          { type: "audit_log", label: "Audit Log", icon: FileText, color: "yellow" },
        ].map((report) => (
          <div key={report.type} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <report.icon className={`w-5 h-5 ${
                report.color === "red" ? "text-red-400" :
                report.color === "blue" ? "text-blue-400" :
                report.color === "purple" ? "text-purple-400" :
                report.color === "green" ? "text-emerald-400" :
                report.color === "cyan" ? "text-cyan-400" :
                "text-amber-400"
              }`} />
              <span className="text-sm font-medium text-slate-200">{report.label}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate(report.type, "json")}
                disabled={generating === report.type}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
              >
                <DownloadCloud className="w-3.5 h-3.5 inline mr-1" />
                JSON
              </button>
              <button
                onClick={() => handleGenerate(report.type, "markdown")}
                disabled={generating === report.type}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                MD
              </button>
              <button
                onClick={() => handleGenerate(report.type, "csv")}
                disabled={generating === report.type}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 inline mr-1" />
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Export */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <DownloadCloud className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-medium text-slate-200">Full Platform Export</h3>
            <p className="text-xs text-slate-500">Complete security, audit, risk, sessions, compliance data</p>
          </div>
        </div>
        <button
          onClick={() => handleGenerate("full_export", "json")}
          disabled={generating === "full_export"}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50"
        >
          {generating === "full_export" ? "Generating..." : "Download Full Export (JSON)"}
        </button>
      </div>
    </div>
  );
}

// ─── Main SecurityCenter Component ──────────────────────────────

export default function SecurityCenter() {
  const [activeTab, setActiveTab] = useState<SecurityTab>("overview");

  useEffect(() => {
    // Initialize security subsystems
    securityEngine.init();
    auditAggregator.init();
    riskEngine.init();
    sessionMonitor.init();
    permissionInspector.init();
  }, []);

  const tabs: Array<{ id: SecurityTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "sessions", label: "Sessions", icon: Users },
    { id: "permissions", label: "Permissions", icon: Eye },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "compliance", label: "Compliance", icon: FileCheck },
    { id: "api-keys", label: "API Keys", icon: KeyRound },
    { id: "policies", label: "Policies", icon: Lock },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "sessions": return <SessionsTab />;
      case "permissions": return <PermissionsTab />;
      case "analytics": return <AnalyticsTab />;
      case "compliance": return <ComplianceTab />;
      case "api-keys": return <ApiKeysTab />;
      case "policies": return <PoliciesTab />;
      case "reports": return <ReportsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Security Center</h1>
                <p className="text-xs text-slate-400">Enterprise Security & Compliance Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => securityExporter.download("full_export", "json", `eeos_security_export.json`)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={() => {
                  securityEngine.init();
                  auditAggregator.init();
                  riskEngine.init();
                  sessionMonitor.init();
                  permissionInspector.init();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 flex-wrap">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {renderTab()}
      </div>
    </div>
  );
}
