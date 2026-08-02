/**
 * SupportDashboard — Enterprise Support Dashboard
 *
 * Route: /support
 *
 * Widgets:
 * - Live Queue (open tickets by priority, oldest first)
 * - SLA Compliance Meter + Heatmap (24h activity)
 * - Agent Workload Distribution
 * - CSAT Score Trend
 * - Ticket Type Distribution (donut)
 * - Priority Distribution (bar)
 * - First Response / Resolution Time
 * - Escalation Stats
 * - Knowledge Base Stats
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Activity, Clock, CheckCircle, XCircle, AlertTriangle,
  BarChart3, Users, Headphones, Gauge, TrendingUp,
  Loader2, RefreshCw, ChevronRight, Plus, MessageSquare,
  BookOpen, ArrowUpRight, Search, Filter, Star,
  Layers, Zap, Shield, UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TICKET_TYPES, TICKET_STATUSES, TICKET_PRIORITIES } from "@/platform/support/SupportEngine";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";

const PIE_COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a855f7", "#06b6d4", "#e8710a", "#5f6368"];
const PRIORITY_BG: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function SupportDashboard() {
  const navigate = useNavigate();

  // ─── Data (Convex SupportRuntime) ─────────────────────────
  const dashboard = useQuery(api.supportEngine.getSupportDashboard, {}) as any;
  const tickets = dashboard?.tickets ?? [];
  const metrics = dashboard?.metrics ?? {
    overview: { avgFirstReponseMinutes: 0, avgResolutionHours: 0, avgCsat: null, reopenedRate: 0 },
    agentWorkloads: [],
  };
  const slaStats = dashboard?.slaStats ?? { complianceRate: 100, withinSLA: 0, breached: 0 };
  const escalationStats = dashboard?.escalationStats ?? { escalated: 0, escalationRate: "0%" };
  const kbStats = dashboard?.kbStats ?? { totalArticles: 0, published: 0, totalViews: 0 };

  const openTickets = useMemo(() =>
    tickets.filter((t) => ["new", "open", "in_progress", "pending"].includes(t.status)),
  [tickets]);

  const criticalTickets = useMemo(() =>
    openTickets.filter((t) => t.priority === "critical").sort((a, b) => a.createdAt - b.createdAt),
  [openTickets]);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const createdToday = tickets.filter((t) => t.createdAt >= todayStart.getTime());
  const resolvedToday = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= todayStart.getTime());

  // Type distribution
  const typeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => { counts[t.type] = (counts[t.type] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({
      name: TICKET_TYPES.find((tt) => tt.id === name)?.label || name,
      value,
      color: TICKET_TYPES.find((tt) => tt.id === name)?.color || "#9aa0a6",
    }));
  }, [tickets]);

  // Priority distribution
  const priorityDist = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [tickets]);

  // 24h heatmap
  const heatmapData = Array.from({ length: 24 }, (_, i) => {
    const count = tickets.filter((t) => {
      const h = new Date(t.createdAt).getHours();
      return h === i;
    }).length;
    return { hour: `${i}:00`, count };
  });

  // Agent workload summary
  const agentWorkload = metrics.agentWorkloads;

  // Recent tickets for live queue
  const liveQueue = openTickets.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e8f0fe] flex items-center justify-center">
              <Headphones className="h-4.5 w-4.5 text-[#1a73e8]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1a1a2e]">Support Dashboard</h1>
              <p className="text-[11px] text-[#5f6368]">{tickets.length} total tickets · {openTickets.length} open · {createdToday.length} created today</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => navigate("/support/agent")}>
              <UserCheck className="h-3 w-3 mr-1" /> Agent View
            </Button>
            <Button size="sm" className="h-8 text-[11px] bg-[#1a73e8]" onClick={() => navigate("/tickets")}>
              <Plus className="h-3 w-3 mr-1" /> New Ticket
            </Button>
          </div>
        </div>

        {/* ═══ KPI Cards ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
          {[
            { label: "Open", value: openTickets.length, color: "text-[#4285f4]", icon: Activity },
            { label: "Critical", value: criticalTickets.length, color: criticalTickets.length > 0 ? "text-red-600" : "text-[#34a853]", icon: AlertTriangle },
            { label: "SLA Met", value: `${slaStats.complianceRate}%`, color: slaStats.complianceRate >= 90 ? "text-[#34a853]" : "text-[#fbbc04]", icon: Gauge },
            { label: "Avg FRT", value: `${metrics.overview.avgFirstReponseMinutes}m`, color: "text-[#5f6368]", icon: Clock },
            { label: "Avg Res", value: `${metrics.overview.avgResolutionHours}h`, color: "text-[#5f6368]", icon: TrendingUp },
            { label: "CSAT", value: metrics.overview.avgCsat || "—", color: "text-[#a855f7]", icon: Star },
            { label: "Escalated", value: escalationStats.escalated, color: escalationStats.escalated > 0 ? "text-orange-600" : "text-[#34a853]", icon: ArrowUpRight },
            { label: "KB Views", value: kbStats.totalViews, color: "text-[#1a73e8]", icon: BookOpen },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border border-[#e8eaed] p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <kpi.icon className="h-3 w-3 text-[#9aa0a6]" />
                <span className="text-[9px] text-[#9aa0a6] font-medium">{kpi.label}</span>
              </div>
              <p className={`text-[15px] font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ═══ Main Grid ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live Queue */}
            <Card className="border-[#e8eaed] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#e8eaed] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-[#4285f4]" />
                  <span className="text-[12px] font-semibold text-[#1a1a2e]">Live Queue</span>
                  <Badge variant="secondary" className="text-[9px] h-4">{openTickets.length} open</Badge>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#1a73e8]" onClick={() => navigate("/tickets")}>
                  View All <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
              <div className="divide-y divide-[#f1f3f4] max-h-[400px] overflow-y-auto">
                {liveQueue.length > 0 ? liveQueue.map((t) => (
                  <div key={t._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${t._id}`)}>
                    <div className={cn("w-2 h-2 rounded-full shrink-0", {
                      "bg-red-500": t.priority === "critical",
                      "bg-orange-400": t.priority === "high",
                      "bg-yellow-400": t.priority === "medium",
                      "bg-green-400": t.priority === "low",
                    })} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#9aa0a6]">{t.ticketNumber}</span>
                        <span className="text-[12px] font-medium text-[#1a1a2e] truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-[#5f6368] mt-0.5">
                        <span>{t.requesterName || "—"}</span>
                        <span>·</span>
                        <span>{TICKET_TYPES.find((tt) => tt.id === t.type)?.label || t.type}</span>
                        <span>·</span>
                        <span className={cn("text-[8px] px-1 rounded", PRIORITY_BG[t.priority])}>{t.priority}</span>
                        <span>· {timeAgo(t.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[8px] h-4 capitalize shrink-0", {
                      "bg-[#e8f0fe] text-[#1a73e8] border-[#d1e4ff]": t.status === "new" || t.status === "open",
                      "bg-[#fef7e0] text-[#f59e0b] border-[#fde68a]": t.status === "in_progress",
                      "bg-[#f1f3f4] text-[#5f6368] border-[#e8eaed]": t.status === "pending",
                    })}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-[12px] text-[#9aa0a6]">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-[#34a853]" />
                    All tickets resolved!
                  </div>
                )}
              </div>
            </Card>

            {/* SLA Heatmap + Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-[#e8eaed] p-3.5">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-[#1a73e8]" /> 24h Activity
                </h3>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={heatmapData}>
                    <defs><linearGradient id="hmG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4285f4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4285f4" stopOpacity={0.02} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#9aa0a6' }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 7, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                    <Area type="monotone" dataKey="count" stroke="#4285f4" fill="url(#hmG)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="border-[#e8eaed] p-3.5">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                  <Gauge className="h-3 w-3 text-[#34a853]" /> SLA Compliance
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-16 h-16">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f3f4" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#34a853" strokeWidth="3"
                        strokeDasharray={`${slaStats.complianceRate}, 100`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#34a853]">{slaStats.complianceRate}%</span>
                  </div>
                  <div className="text-[10px] text-[#5f6368] space-y-0.5">
                    <p>Within SLA: <strong>{slaStats.withinSLA}</strong></p>
                    <p>Breached: <strong className="text-red-600">{slaStats.breached}</strong></p>
                    <p>Compliance: <strong className="text-[#34a853]">{slaStats.complianceRate}%</strong></p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Chart Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-[#e8eaed] p-3.5">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Priority Distribution</h3>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={priorityDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
                      {priorityDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="border-[#e8eaed] p-3.5">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Ticket Types</h3>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={typeDist} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                      {typeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-3">
            {/* Today Summary */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Today</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#e8f0fe] rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-[#1a73e8]">{createdToday.length}</p>
                  <p className="text-[8px] text-[#5f6368]">Created</p>
                </div>
                <div className="bg-[#e6f4ea] rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-[#34a853]">{resolvedToday.length}</p>
                  <p className="text-[8px] text-[#5f6368]">Resolved</p>
                </div>
                <div className="bg-[#fef7e0] rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-[#f59e0b]">{metrics.overview.avgFirstReponseMinutes}m</p>
                  <p className="text-[8px] text-[#5f6368]">Avg FRT</p>
                </div>
                <div className="bg-[#f3e8ff] rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-[#a855f7]">{metrics.overview.avgCsat || "—"}</p>
                  <p className="text-[8px] text-[#5f6368]">CSAT</p>
                </div>
              </div>
            </Card>

            {/* Agent Workload */}
            <Card className="border-[#e8eaed] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e]">Agent Workload</h3>
                <span className="text-[9px] text-[#9aa0a6]">{agentWorkload.length} agents</span>
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {agentWorkload.slice(0, 6).map((a) => (
                  <div key={a.agentId} className="flex items-center justify-between py-1 border-b border-[#f1f3f4] last:border-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                        <span className="text-[7px] font-bold text-[#1a73e8]">{a.agentId.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] text-[#1a1a2e]">{a.agentId.slice(0, 10)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="text-[#5f6368]">{a.assignedCount}</span>
                      <span className={a.openCount > 3 ? "text-red-600 font-medium" : "text-[#5f6368]"}>{a.openCount} open</span>
                      <span className={a.inProgressCount > 0 ? "text-[#f59e0b]" : "text-[#5f6368]"}>{a.inProgressCount} ip</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Escalation */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Escalations</h3>
              <div className="text-center py-2">
                <p className="text-[22px] font-bold text-orange-500">{escalationStats.escalated}</p>
                <p className="text-[9px] text-[#5f6368]">Escalated · {escalationStats.escalationRate}</p>
              </div>
            </Card>

            {/* Knowledge Base */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Knowledge Base</h3>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between"><span className="text-[#5f6368]">Articles</span><strong>{kbStats.totalArticles}</strong></div>
                <div className="flex justify-between"><span className="text-[#5f6368]">Published</span><strong>{kbStats.published}</strong></div>
                <div className="flex justify-between"><span className="text-[#5f6368]">Total Views</span><strong>{kbStats.totalViews}</strong></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
