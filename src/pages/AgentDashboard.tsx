/**
 * AgentDashboard — Support Agent Performance Dashboard
 *
 * Route: /support/agent
 *
 * Widgets:
 * - My Tickets queue (assigned to current agent)
 * - Performance KPIs (resolved today, avg response, avg resolution, CSAT)
 * - SLA status for my tickets
 * - Activity timeline
 * - Quick actions (new ticket, search KB, my stats)
 * - Type breakdown of my tickets
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Activity, Clock, CheckCircle, XCircle, AlertTriangle,
  BarChart3, User, Headphones, Gauge, TrendingUp,
  Loader2, Plus, MessageSquare, BookOpen, ArrowRight,
  Search, Filter, Star, Zap, Inbox, CheckCheck,
  Calendar, ListChecks,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TICKET_TYPES, TICKET_STATUSES, TICKET_PRIORITIES } from "@/platform/support/SupportEngine";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

const PIE_COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a855f7", "#06b6d4"];
const PRIORITY_BG: Record<string, string> = {
  critical: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewFilter, setViewFilter] = useState<string>("all");

  // ─── Data (Convex SupportRuntime) ─────────────────────────
  const currentAgentId = user?._id || "";
  const listResult = useQuery(api.supportEngine.listTickets, currentAgentId ? { assignedTo: currentAgentId } : "skip") as any;
  const dashResult = useQuery(api.supportEngine.getSupportDashboard, {}) as any;
  const tickets = listResult?.tickets ?? [];
  const allMetrics = dashResult?.metrics ?? {
    overview: { avgFirstReponseMinutes: 0, avgResolutionHours: 0, avgCsat: null, reopenedRate: 0 },
    agentWorkloads: [],
  };

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const resolvedToday = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= todayStart.getTime());
  const openTickets = tickets.filter((t) => ["new", "open", "in_progress", "pending"].includes(t.status));

  const filteredTickets = useMemo(() => {
    if (viewFilter === "open") return openTickets;
    if (viewFilter === "today") return tickets.filter((t) => t.createdAt >= todayStart.getTime());
    if (viewFilter === "sla") return openTickets.filter((t) =>
      t.slaBreached || (t.responseDueAt && t.responseDueAt < Date.now() + 60 * 60 * 1000) ||
      (t.resolutionDueAt && t.resolutionDueAt < Date.now() + 60 * 60 * 1000)
    );
    return tickets;
  }, [tickets, viewFilter, openTickets]);

  // My type distribution
  const myTypeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => { counts[t.type] = (counts[t.type] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({
      name: TICKET_TYPES.find((tt) => tt.id === name)?.label || name,
      value,
    }));
  }, [tickets]);

  // My SLA stats
  const mySlaStats = useMemo(() => {
    const withSla = tickets.filter((t) => t.slaBreached !== undefined || t.responseDueAt || t.resolutionDueAt);
    const breached = withSla.filter((t) => t.slaBreached).length;
    return { total: withSla.length, breached, rate: withSla.length > 0 ? Math.round(((withSla.length - breached) / withSla.length) * 100) : 100 };
  }, [tickets]);

  // Real 7-day resolution trend from ticket data (was Math.random mock)
  const weekResolved = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
      const start = d.getTime(); const end = start + 86400000;
      return { day: days[i], resolved: tickets.filter((t) => t.resolvedAt && t.resolvedAt >= start && t.resolvedAt < end).length };
    });
  }, [tickets]);

  // Real recent activity (was Math.random mock)
  const recentActivity = useMemo(() =>
    tickets.filter((t) => t.resolvedAt).sort((a, b) => b.resolvedAt - a.resolvedAt).slice(0, 3),
  [tickets]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f3e8ff] flex items-center justify-center">
              <User className="h-4.5 w-4.5 text-[#a855f7]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1a1a2e]">My Dashboard</h1>
              <p className="text-[11px] text-[#5f6368]">
                {tickets.length} assigned · {openTickets.length} active · {resolvedToday.length} resolved today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => navigate("/support")}>
              <Activity className="h-3 w-3 mr-1" /> Support Dashboard
            </Button>
            <Button size="sm" className="h-8 text-[11px] bg-[#1a73e8]" onClick={() => navigate("/tickets")}>
              <Plus className="h-3 w-3 mr-1" /> New Ticket
            </Button>
          </div>
        </div>

        {/* ═══ KPI Cards ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
          {[
            { label: "My Tickets", value: tickets.length, color: "text-[#4285f4]", icon: Inbox },
            { label: "Open", value: openTickets.length, color: "text-[#f59e0b]", icon: Activity },
            { label: "Resolved Today", value: resolvedToday.length, color: "text-[#34a853]", icon: CheckCheck },
            { label: "SLA Rate", value: `${mySlaStats.rate}%`, color: mySlaStats.rate >= 90 ? "text-[#34a853]" : "text-[#f59e0b]", icon: Gauge },
            { label: "CSAT", value: allMetrics.overview.avgCsat || "—", color: "text-[#a855f7]", icon: Star },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border border-[#e8eaed] p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <kpi.icon className="h-3 w-3 text-[#9aa0a6]" />
                <span className="text-[9px] text-[#9aa0a6] font-medium">{kpi.label}</span>
              </div>
              <p className={`text-[16px] font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ═══ Main Grid ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left: My Tickets Queue ── */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-[#e8eaed] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#e8eaed] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="h-3.5 w-3.5 text-[#4285f4]" />
                  <span className="text-[12px] font-semibold text-[#1a1a2e]">My Tickets</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "open", label: "Open" },
                    { id: "today", label: "Today" },
                    { id: "sla", label: "SLA Risk" },
                  ].map((f) => (
                    <button key={f.id} onClick={() => setViewFilter(f.id)}
                      className={cn("px-2 py-1 text-[9px] font-medium rounded transition-colors",
                        viewFilter === f.id ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-[#f1f3f4]"
                      )}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[#f1f3f4] max-h-[450px] overflow-y-auto">
                {filteredTickets.slice(0, 15).map((t) => {
                  const sla = t.slaBreached ? { status: "breached" } : (t.responseDueAt && t.responseDueAt < Date.now() + 60 * 60 * 1000) || (t.resolutionDueAt && t.resolutionDueAt < Date.now() + 60 * 60 * 1000) ? { status: "approaching" } : undefined;
                  return (
                    <div key={t._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] cursor-pointer transition-colors"
                      onClick={() => navigate(`/tickets/${t._id}`)}>
                      <div className={cn("w-2 h-2 rounded-full shrink-0", {
                        "bg-red-500": t.priority === "critical", "bg-orange-400": t.priority === "high",
                        "bg-yellow-400": t.priority === "medium", "bg-green-400": t.priority === "low",
                      })} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#9aa0a6]">{t.ticketNumber}</span>
                          <span className="text-[12px] font-medium text-[#1a1a2e] truncate">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#5f6368] mt-0.5 flex-wrap">
                          <span>{t.requesterName || "—"}</span>
                          <span>·</span>
                          <span>{TICKET_TYPES.find((tt) => tt.id === t.type)?.label || t.type}</span>
                          <span>·</span>
                          <span className={cn("text-[8px] px-1 rounded", PRIORITY_BG[t.priority])}>{t.priority}</span>
                          <span>· {timeAgo(t.createdAt)}</span>
                          {sla?.status === "breached" && <Badge variant="outline" className="text-[7px] h-3.5 px-1 bg-red-50 text-red-600 border-red-200">SLA!</Badge>}
                          {sla?.status === "approaching" && <Badge variant="outline" className="text-[7px] h-3.5 px-1 bg-amber-50 text-amber-600 border-amber-200">SLA</Badge>}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[8px] h-4 capitalize shrink-0", {
                        "bg-[#e8f0fe] text-[#1a73e8]": t.status === "new" || t.status === "open",
                        "bg-[#fef7e0] text-[#f59e0b]": t.status === "in_progress",
                        "bg-[#e6f4ea] text-[#34a853]": t.status === "resolved",
                      })}>{t.status.replace("_", " ")}</Badge>
                    </div>
                  );
                })}
                {filteredTickets.length === 0 && (
                  <div className="text-center py-10">
                    <CheckCircle className="h-8 w-8 text-[#34a853] mx-auto mb-2" />
                    <p className="text-[13px] font-medium text-[#1a1a2e]">All caught up!</p>
                    <p className="text-[11px] text-[#5f6368] mt-1">No tickets match this filter</p>
                  </div>
                )}
              </div>
            </Card>

            {/* My Performance Chart + Type Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-[#e8eaed] p-3.5">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-[#34a853]" /> My Resolution Trend
                </h3>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={weekResolved}>
                    <defs><linearGradient id="agentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                    <Area type="monotone" dataKey="resolved" stroke="#a855f7" fill="url(#agentGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="border-[#e8eaed] p-3.5">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">My Ticket Types</h3>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={myTypeDist} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={2} dataKey="value">
                      {myTypeDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>

          {/* ── Right: Stats & Actions ── */}
          <div className="space-y-3">
            {/* Quick Actions */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => navigate("/tickets")}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#f8f9fa] transition-colors text-left">
                  <Plus className="h-3 w-3 text-[#1a73e8]" />
                  <span className="text-[10px] text-[#1a1a2e]">New Ticket</span>
                </button>
                <button onClick={() => navigate("/tickets")}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#f8f9fa] transition-colors text-left">
                  <Search className="h-3 w-3 text-[#34a853]" />
                  <span className="text-[10px] text-[#1a1a2e]">Search Tickets</span>
                </button>
                <button
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#f8f9fa] transition-colors text-left">
                  <BookOpen className="h-3 w-3 text-[#a855f7]" />
                  <span className="text-[10px] text-[#1a1a2e]">Knowledge Base</span>
                </button>
                <button onClick={() => navigate("/support")}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#f8f9fa] transition-colors text-left">
                  <Activity className="h-3 w-3 text-[#f59e0b]" />
                  <span className="text-[10px] text-[#1a1a2e]">Team Stats</span>
                </button>
              </div>
            </Card>

            {/* My SLA Status */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">My SLA Status</h3>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg viewBox="0 0 36 36" className="w-14 h-14">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f3f4" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" strokeWidth="3"
                      strokeDasharray={`${mySlaStats.rate}, 100`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#a855f7]">{mySlaStats.rate}%</span>
                </div>
                <div className="text-[10px] text-[#5f6368] space-y-0.5">
                  <p>Compliant: <strong className="text-[#34a853]">{mySlaStats.total - mySlaStats.breached}</strong></p>
                  <p>Breached: <strong className="text-red-600">{mySlaStats.breached}</strong></p>
                  <p>Rate: <strong>{mySlaStats.rate}%</strong></p>
                </div>
              </div>
            </Card>

            {/* My Performance Stats */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Performance</h3>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                  <span className="text-[#5f6368]">Resolved Today</span>
                  <strong className="text-[#34a853]">{resolvedToday.length}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                  <span className="text-[#5f6368]">Avg Response</span>
                  <strong>{allMetrics.overview.avgFirstReponseMinutes}m</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                  <span className="text-[#5f6368]">Avg Resolution</span>
                  <strong>{allMetrics.overview.avgResolutionHours}h</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                  <span className="text-[#5f6368]">Reopen Rate</span>
                  <strong>{allMetrics.overview.reopenedRate}%</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5f6368]">CSAT Average</span>
                  <strong className="text-[#a855f7]">{allMetrics.overview.avgCsat || "—"}</strong>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Recent Activity</h3>
              <div className="space-y-1.5 text-[9px] text-[#5f6368]">
                {recentActivity.map((r) => (
                  <p key={r._id}>Resolved <strong>#{r.ticketNumber.replace("SVC-", "")}</strong> — {timeAgo(r.resolvedAt)} ago</p>
                ))}
                {recentActivity.length === 0 && <p>No recent activity</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
