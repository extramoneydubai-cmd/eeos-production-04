/**
 * Operations Command Center — EEOS Runtime Convergence (PATCH-ENTERPRISE-022, Phase 1)
 *
 * ONE screen. No new engines. Every widget consumes an existing runtime:
 *   - api.runtimeObservability.getOperationsDashboard  (queue/workflow/finance/scheduling health)
 *   - api.dashboardEngine.getOperationsWidget          (tasks/workflows/approvals/sla/escalations)
 *   - api.dashboardEngine.getEnterpriseOverview        (revenue/collections/outstanding)
 *   - api.timelineEngine.getRecentTimeline             (global timeline — TimelineRuntime)
 *   - api.approvals.listApprovalRequests               (ApprovalRuntime)
 *   - api.chequeEngine.getChequeDashboard              (PDC runtime)
 *   - api.refundEngine.getRefundSummary                (Refund runtime)
 *   - api.attendanceVerificationEngine.getTodayStats   (Attendance runtime)
 *   - api.dashboardEngine.getInventoryWidget           (Inventory runtime)
 *   - api.dashboardEngine.getHrWidget                  (HR runtime)
 *
 * Sections: Today / Pending / Blocked / Critical / Late / Escalated
 *           + module queues (Approvals, Attendance, Classes, Refunds,
 *             Collections, PDC, Tickets, Production, Inventory, Transport, HR)
 */

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity, CheckSquare, Clock, AlertTriangle, ShieldAlert, TrendingUp,
  CircleDot, CalendarDays, Banknote, FileClock, BadgeIndianRupee, FileWarning,
  Package, Factory, Truck, Users, RefreshCw, Layers, Zap, BarChart3,
} from "lucide-react";

type AnyRow = Record<string, any>;

export default function OperationsCommandCenter() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Runtime queries (registered API surface only) ─────────────
  const ops = useQuery(api.runtimeObservability.getOperationsDashboard, {}) as AnyRow | undefined;
  const widget = useQuery(api.dashboardEngine.getOperationsWidget, {}) as AnyRow | undefined;
  const overview = useQuery(api.dashboardEngine.getEnterpriseOverview, {}) as AnyRow | undefined;
  const timeline = useQuery(api.timelineEngine.getRecentTimeline, { limit: 24 }) as AnyRow[] | undefined;
  const approvals = useQuery(api.approvals.listApprovalRequests, {}) as AnyRow[] | undefined;
  const cheques = useQuery(api.chequeEngine.getChequeDashboard, {}) as AnyRow | undefined;
  const refunds = useQuery(api.refundEngine.getRefundSummary, {}) as AnyRow | undefined;
  const attendance = useQuery(api.attendanceVerificationEngine.getTodayStats, {}) as AnyRow | undefined;
  const inventory = useQuery(api.dashboardEngine.getInventoryWidget, {}) as AnyRow | undefined;
  const hr = useQuery(api.dashboardEngine.getHrWidget, {}) as AnyRow | undefined;

  // ── Derived KPI band (Today / Pending / Blocked / Critical / Late / Escalated) ──
  const pendingApprovals = approvals?.filter((a: AnyRow) => a.status === "pending").length ?? widget?.approvals?.pending ?? 0;
  const pendingRefunds = refunds?.pendingCount ?? ops?.financeMetrics?.pendingRefunds ?? 0;
  const pendingTasks = widget?.tasks?.pending ?? 0;
  const runningWorkflows = widget?.workflows?.running ?? ops?.queueLengths?.workflowRunning ?? 0;
  const failedWorkflows = widget?.workflows?.failed ?? ops?.queueLengths?.workflowFailed ?? 0;
  const openSla = widget?.sla?.openViolations ?? ops?.slaBreaches?.totalBreaches ?? 0;
  const openEscalations = widget?.escalations?.open ?? 0;
  const bouncedCheques = cheques?.bounced ?? ops?.financeMetrics?.bouncedCheques ?? 0;
  const overdueTasks = widget?.tasks?.overdue ?? 0;
  const agingRefunds = ops?.financeMetrics?.agingRefunds ?? 0;
  const scopeViolations = ops?.scopeViolations?.totalViolations ?? 0;
  const lowStock = inventory?.lowStockCount ?? 0;
  const attendanceToday = attendance?.total ?? 0;

  const kpis = [
    { label: "Today", value: String(attendanceToday + (overview?.admissions ?? 0)), sub: `${overview?.activeUsers ?? 0} active users`, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", live: true },
    { label: "Pending", value: String(pendingApprovals + pendingRefunds + pendingTasks + runningWorkflows), sub: `${pendingApprovals} approvals · ${pendingRefunds} refunds · ${pendingTasks} tasks`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { label: "Blocked", value: String(failedWorkflows + openSla), sub: `${failedWorkflows} workflows · ${openSla} SLA violations`, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 border-red-100" },
    { label: "Critical", value: String(bouncedCheques + scopeViolations + lowStock), sub: `${bouncedCheques} bounced PDC · ${scopeViolations} scope hits · ${lowStock} low stock`, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    { label: "Late", value: String(overdueTasks + agingRefunds), sub: `${overdueTasks} overdue tasks · ${agingRefunds} aging refunds`, icon: FileWarning, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
    { label: "Escalated", value: String(openEscalations), sub: `${widget?.escalations?.level3 ?? 0} at level 3`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  ];

  // ── Module queues ──────────────────────────────────────────────
  const queues = [
    { module: "Approvals", href: "/approvals", icon: CheckSquare, value: String(pendingApprovals), sub: `${widget?.approvals?.approved ?? 0} approved · ${widget?.approvals?.rejected ?? 0} rejected`, tone: pendingApprovals > 0 ? "amber" : "green" },
    { module: "Attendance", href: "/attendance", icon: Activity, value: String(attendanceToday), sub: `${attendance?.present ?? 0} present · ${attendance?.absent ?? 0} absent · ${attendance?.late ?? 0} late`, tone: "blue" },
    { module: "Classes", href: "/scheduling", icon: CalendarDays, value: String(ops?.schedulingMetrics?.totalSchedules ?? 0), sub: `${ops?.schedulingMetrics?.conflicting ?? 0} conflicts · ${ops?.schedulingMetrics?.completed ?? 0} done`, tone: "blue" },
    { module: "Refunds", href: "/refunds", icon: BadgeIndianRupee, value: String(pendingRefunds), sub: `${refunds?.approvedCount ?? 0} approved · ${refunds?.totalCount ?? 0} total`, tone: pendingRefunds > 0 ? "amber" : "green" },
    { module: "Collections", href: "/collections", icon: Banknote, value: `${overview?.collectionRate ?? 0}%`, sub: `₹${(overview?.outstandingFees ?? 0).toLocaleString("en-IN")} outstanding`, tone: "blue" },
    { module: "PDC", href: "/pdc", icon: FileClock, value: String((cheques?.received ?? 0) + (cheques?.deposited ?? 0)), sub: `${bouncedCheques} bounced · ${cheques?.cleared ?? 0} cleared`, tone: bouncedCheques > 0 ? "red" : "green" },
    { module: "Tickets", href: "/tickets", icon: CircleDot, value: String(openSla), sub: `${ops?.slaBreaches?.byPriority?.critical ?? 0} critical breaches`, tone: openSla > 0 ? "red" : "green" },
    { module: "Production", href: "/production", icon: Factory, value: String(runningWorkflows), sub: `${failedWorkflows} failed · ${widget?.workflows?.completed ?? 0} completed`, tone: failedWorkflows > 0 ? "red" : "blue" },
    { module: "Inventory", href: "/inventory", icon: Package, value: String(inventory?.totalItems ?? 0), sub: `${lowStock} low · ${inventory?.outOfStockCount ?? 0} out of stock`, tone: lowStock > 0 ? "amber" : "green" },
    { module: "Transport", href: "/scheduling", icon: Truck, value: String(ops?.schedulingMetrics?.totalSchedules ?? 0), sub: `${ops?.schedulingMetrics?.conflictRate ?? 0}% conflict rate`, tone: "blue" },
    { module: "HR", href: "/employees", icon: Users, value: String(hr?.activeUsers ?? overview?.activeUsers ?? 0), sub: `${hr?.onLeaveToday ?? 0} on leave · ${hr?.pendingReviews ?? 0} reviews`, tone: "blue" },
  ];

  const healthChecks = ops?.systemHealth?.checks as Record<string, { status: string; message: string }> | undefined;
  const healthEntries = healthChecks ? Object.entries(healthChecks) : [];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-[#1a73e8]" />
              <h1 className="text-lg font-semibold text-[#1a1a2e]">Operations Command Center</h1>
            </div>
            <p className="text-[12px] text-[#5f6368]">
              Runtime convergence · One screen · {new Date(now).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full border text-[12px] font-medium ${
              ops?.systemHealth?.overall === "CRITICAL" ? "bg-red-50 border-red-200 text-red-600" :
              ops?.systemHealth?.overall === "WARNING" ? "bg-amber-50 border-amber-200 text-amber-600" :
              "bg-green-50 border-green-200 text-green-600"
            }`}>
              {ops?.systemHealth?.overall ?? "LOADING"} · {ops?.systemHealth?.healthyCount ?? 0}/{ops?.systemHealth?.totalChecks ?? 0} checks
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* KPI band */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`rounded-lg border p-3.5 ${kpi.bg}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#5f6368]">{kpi.label}</span>
                {kpi.live && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              </div>
              <p className={`text-[22px] font-bold leading-none ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-[#5f6368] mt-1.5 truncate">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module queues */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-[#1a73e8]" />
                <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Module Queues</h2>
                <span className="text-[10px] text-[#9aa0a6]">consuming DashboardRuntime + module runtimes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {queues.map((q) => (
                  <a
                    key={q.module}
                    href={q.href}
                    className="bg-white rounded-lg border border-[#e8eaed] p-3.5 hover:border-[#1a73e8]/40 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        q.tone === "red" ? "bg-red-50 text-red-600" :
                        q.tone === "amber" ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-[#1a73e8]"
                      }`}>
                        <q.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[12px] font-semibold text-[#1a1a2e] group-hover:text-[#1a73e8] transition-colors">{q.module}</span>
                      {q.tone === "red" && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <p className="text-[18px] font-bold text-[#1a1a2e] leading-none">{q.value}</p>
                    <p className="text-[10px] text-[#5f6368] mt-1 truncate">{q.sub}</p>
                  </a>
                ))}
              </div>
            </section>

            {/* Runtime health */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-[#1a73e8]" />
                <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Runtime Health</h2>
                <span className="text-[10px] text-[#9aa0a6]">from RuntimeObservability</span>
              </div>
              <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#f1f3f4]">
                  {[
                    { label: "Doc Queue", value: ops?.queueLengths?.documentGeneration ?? 0 },
                    { label: "Workflow Running", value: ops?.queueLengths?.workflowRunning ?? 0 },
                    { label: "Events (24h)", value: ops?.eventPipeline?.totalEvents ?? 0 },
                    { label: "PDC Failure Rate", value: `${ops?.financeMetrics?.pdcFailureRate ?? 0}%` },
                  ].map((m) => (
                    <div key={m.label} className="p-3.5">
                      <p className="text-[10px] text-[#9aa0a6] font-medium">{m.label}</p>
                      <p className="text-[16px] font-semibold text-[#1a1a2e] mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#f1f3f4] px-4 py-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                  {healthEntries.map(([key, check]) => (
                    <div key={key} className="flex items-center gap-1.5 text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        check.status === "HEALTHY" ? "bg-green-500" :
                        check.status === "WARNING" ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      <span className="text-[#5f6368] capitalize">{key}</span>
                      <span className="text-[#9aa0a6] truncate">{check.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Global timeline */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[#1a73e8]" />
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Global Timeline</h2>
              <span className="text-[10px] text-[#9aa0a6]">TimelineRuntime</span>
            </div>
            <div className="bg-white rounded-lg border border-[#e8eaed] p-3 max-h-[560px] overflow-y-auto">
              {timeline && timeline.length > 0 ? (
                <div className="space-y-1">
                  {timeline.map((e: AnyRow, i: number) => (
                    <div key={e._id ?? i} className="flex items-start gap-2 py-1.5 border-b border-[#f1f3f4] last:border-0">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#1a73e8] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#1a1a2e] font-medium truncate">{e.title ?? e.eventType ?? e.module}</p>
                        <p className="text-[9px] text-[#9aa0a6]">
                          {e.module} · {e.eventType} · {e.createdAt ? new Date(e.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[#9aa0a6]">
                  <Activity className="h-6 w-6 animate-pulse mb-2" />
                  <p className="text-[11px]">Waiting for timeline events…</p>
                  <p className="text-[10px] mt-1">Mutations publish via EventRuntime → TimelineRuntime</p>
                </div>
              )}
            </div>

            <div className="mt-4 bg-white rounded-lg border border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-[#1a73e8]" /> Escalations
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: "Level 1", value: widget?.escalations?.level1 ?? 0 },
                  { label: "Level 2", value: widget?.escalations?.level2 ?? 0 },
                  { label: "Level 3", value: widget?.escalations?.level3 ?? 0 },
                ].map((l) => (
                  <div key={l.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5f6368]">{l.label}</span>
                    <span className={`font-semibold ${l.value > 0 ? "text-red-600" : "text-green-600"}`}>{l.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
