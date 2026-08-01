import React, { useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Database, Gauge, Server,
  HardDrive, Users, Zap, BarChart3, RefreshCw, Search, Workflow, Shield, Bell,
  ChevronDown, ChevronRight, AlertCircle, Info, HelpCircle,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

interface HealthMetric {
  id: string; label: string; value: number; unit: string;
  status: HealthStatus; trend: "up" | "down" | "stable";
  icon: React.ElementType; description: string;
}

const METRICS: HealthMetric[] = [
  { id: "db", label: "Database Health", value: 98.7, unit: "%", status: "healthy", trend: "stable", icon: Database, description: "Query success rate" },
  { id: "queue", label: "Queue Depth", value: 12, unit: "items", status: "healthy", trend: "down", icon: Activity, description: "Pending jobs" },
  { id: "events", label: "Event Throughput", value: 142, unit: "/min", status: "healthy", trend: "up", icon: Zap, description: "Events per minute" },
  { id: "workflow", label: "Workflow Failures", value: 3, unit: "errors", status: "warning", trend: "down", icon: Workflow, description: "Failed workflows (24h)" },
  { id: "notif", label: "Notification Failures", value: 8, unit: "errors", status: "warning", trend: "stable", icon: Bell, description: "Failed deliveries (24h)" },
  { id: "search", label: "Search Latency", value: 187, unit: "ms", status: "healthy", trend: "up", icon: Search, description: "Avg response time" },
  { id: "api", label: "API Latency", value: 42, unit: "ms", status: "healthy", trend: "stable", icon: Server, description: "Avg mutation latency" },
  { id: "scope", label: "Scope Violations", value: 0, unit: "events", status: "healthy", trend: "stable", icon: Shield, description: "Cross-scope attempts" },
  { id: "auth", label: "Auth Failures", value: 23, unit: "events", status: "warning", trend: "up", icon: Users, description: "Failed logins (24h)" },
  { id: "dash", label: "Dashboard Latency", value: 312, unit: "ms", status: "warning", trend: "down", icon: BarChart3, description: "Avg refresh time" },
  { id: "storage", label: "Storage Usage", value: 68.2, unit: "%", status: "healthy", trend: "up", icon: HardDrive, description: "Capacity utilization" },
  { id: "perms", label: "Permission Denials", value: 5, unit: "events", status: "healthy", trend: "down", icon: Shield, description: "Denied requests (24h)" },
];

const STATUS_COLORS: Record<string, string> = {
  healthy: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
  warning: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
  critical: "from-red-500/10 to-red-600/5 border-red-500/20",
  unknown: "from-gray-500/10 to-gray-600/5 border-gray-500/20",
};

const MODULES = [
  { name: "CRM", status: "published", health: 98 },
  { name: "Finance", status: "published", health: 95 },
  { name: "Students", status: "published", health: 97 },
  { name: "HR", status: "published", health: 93 },
  { name: "Academic", status: "published", health: 92 },
  { name: "Marketing", status: "published", health: 88 },
  { name: "Scheduling", status: "published", health: 90 },
  { name: "Support", status: "published", health: 91 },
  { name: "Procurement", status: "published", health: 85 },
  { name: "Inventory", status: "testing", health: 72 },
  { name: "Payroll", status: "testing", health: 68 },
  { name: "Production", status: "draft", health: 45 },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
    critical: "bg-red-500/20 text-red-400",
    unknown: "bg-gray-500/20 text-gray-400",
  };
  const icons: Record<string, React.ElementType> = { healthy: CheckCircle2, warning: AlertTriangle, critical: AlertCircle, unknown: HelpCircle };
  const Icon = icons[status] || HelpCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] || colors.unknown}`}>
      <Icon className="w-2.5 h-2.5" />{status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MetricCard({ m }: { m: HealthMetric }) {
  const trendColors = { up: "text-emerald-400", down: "text-amber-400", stable: "text-blue-400" };
  const trendIcons = { up: "↑", down: "↓", stable: "→" };
  const Icon = m.icon;
  return (
    <div className={`relative rounded-xl border p-4 bg-gradient-to-br ${STATUS_COLORS[m.status]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="p-1.5 rounded-lg bg-white/5"><Icon className="w-4 h-4 text-gray-300" /></div>
        <StatusBadge status={m.status} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-white">{m.value}</span>
        <span className="text-[11px] text-gray-400">{m.unit}</span>
        <span className={`text-[10px] ml-auto ${trendColors[m.trend]}`}>{trendIcons[m.trend]}</span>
      </div>
      <div className="text-xs font-medium text-gray-300 mt-0.5">{m.label}</div>
      <div className="text-[10px] text-gray-500">{m.description}</div>
    </div>
  );
}

export default function EnterpriseHealthCenter() {
  const healthyCount = METRICS.filter(m => m.status === "healthy").length;
  const warningCount = METRICS.filter(m => m.status === "warning").length;
  const systemHealth = Math.round((healthyCount / METRICS.length) * 100);

  return (
    <WorkspaceShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Health Center</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time runtime monitoring & system observability</p>
          </div>
        </div>

        {/* System Health Gauge */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - systemHealth / 100)}`}
                  strokeLinecap="round"
                  className={`${systemHealth >= 90 ? "text-emerald-400" : "text-amber-400"} transition-all duration-1000`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Gauge className={`w-6 h-6 ${systemHealth >= 90 ? "text-emerald-400" : "text-amber-400"}`} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{systemHealth}%</div>
              <div className="text-sm text-gray-400">System Health Score</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" />{healthyCount}</span>
                <span className="flex items-center gap-1 text-xs text-amber-400"><AlertTriangle className="w-3 h-3" />{warningCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {METRICS.map(m => <MetricCard key={m.id} m={m} />)}
        </div>

        {/* Module Compliance */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Module Compliance Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Module</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MODULES.map(mod => (
                  <tr key={mod.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-white font-medium">{mod.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        mod.status === "published" ? "bg-emerald-500/20 text-emerald-400" :
                        mod.status === "testing" ? "bg-amber-500/20 text-amber-400" : "bg-gray-500/20 text-gray-400"
                      }`}>{mod.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full ${mod.health >= 90 ? "bg-emerald-400" : mod.health >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${mod.health}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7 text-right">{mod.health}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
