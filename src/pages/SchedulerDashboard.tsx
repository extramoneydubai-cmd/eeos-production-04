/**
 * SchedulerDashboard — Enterprise Scheduling Command Center
 *
 * Route: /scheduler
 *
 * Cross-module scheduling dashboard showing schedules across:
 * - Meetings, Classes, Exams, Interviews, Counselling,
 *   Vendor Meetings, Employee Meetings, Asset Booking,
 *   Room Booking, Vehicle Booking, Maintenance, Holidays
 *
 * Features: Today's Schedule, Pending Approvals, Conflicts,
 * Resource Utilization, Faculty Load, Room Occupancy,
 * Interview Schedule, Meeting Calendar, Holiday Summary
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle,
  Plus, Users, Building2, CalendarDays, ListChecks,
  ArrowRight, Loader2, Search, Filter, BarChart3,
  PieChart, TrendingUp, MapPin, BookOpen, Briefcase,
  Coffee, Star, FileCheck, Heart, Wrench, Sun,
  ChevronRight, MoreHorizontal, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ScheduleWidget from "@/components/scheduling/ScheduleWidget";

// ─── Schedule Type Config ─────────────────────────────────────────

const SCHEDULE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any; count?: number }> = {
  meeting: { label: "Meetings", color: "#4285f4", icon: Users },
  lecture: { label: "Classes", color: "#a855f7", icon: BookOpen },
  exam: { label: "Exams", color: "#ea4335", icon: FileCheck },
  interview: { label: "Interviews", color: "#34a853", icon: Briefcase },
  training: { label: "Training", color: "#06b6d4", icon: Star },
  counseling: { label: "Counselling", color: "#ec4899", icon: Heart },
  maintenance: { label: "Maintenance", color: "#f59e0b", icon: Wrench },
  holiday: { label: "Holidays", color: "#f97316", icon: Sun },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Quick Action Card ────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "New Schedule", icon: Plus, color: "bg-blue-500", path: "/scheduling/new", desc: "Create schedule" },
  { label: "Calendar View", icon: CalendarDays, color: "bg-purple-500", path: "/calendar", desc: "Open calendar" },
  { label: "Resource Booking", icon: Building2, color: "bg-teal-500", path: "/scheduling/resources", desc: "Book resource" },
  { label: "Faculty Schedule", icon: BookOpen, color: "bg-amber-500", path: "/scheduling/faculty", desc: "Faculty view" },
];

// ─── Type Summary Card ────────────────────────────────────────────

function TypeSummaryCard({ type, schedules }: { type: string; schedules: any[] }) {
  const config = SCHEDULE_TYPE_CONFIG[type] || { label: type, color: "#9aa0a6", icon: Calendar };
  const Icon = config.icon;
  const count = schedules.filter((s: any) => s.scheduleType === type).length;

  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] transition-colors">
      <div className="p-1.5 rounded-md" style={{ backgroundColor: `${config.color}15` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#1a1a2e]">{config.label}</p>
        <p className="text-[10px] text-[#5f6368]">{count} scheduled</p>
      </div>
      <span className="text-sm font-bold" style={{ color: config.color }}>{count}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────

export default function SchedulerDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch all scheduling data
  const counts = useQuery(api.schedulingSdk.getCounts as any) as any;
  const todayData = useQuery(api.schedulingSdk.getToday as any) as any[] | undefined;
  const upcomingData = useQuery(api.schedulingSdk.getUpcoming as any, { days: 14 }) as any[] | undefined;
  const resources = useQuery(api.schedulingSdk.listResources as any, {}) as any[] | undefined;

  const todaySchedules = todayData || [];
  const upcomingSchedules = upcomingData || [];
  const resourceList = resources || [];

  // Pending approvals
  const pendingApprovals = useMemo(() =>
    upcomingSchedules.filter((s: any) => s.status === "pending_approval"),
    [upcomingSchedules]
  );

  // Filtered upcoming by type and search
  const filteredUpcoming = useMemo(() => {
    let items = upcomingSchedules;
    if (filterType !== "all") items = items.filter((s: any) => s.scheduleType === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((s: any) => s.title?.toLowerCase().includes(q));
    }
    return items;
  }, [upcomingSchedules, filterType, search]);

  // Resource stats
  const activeResources = resourceList.filter((r: any) => r.status === "active").length;
  const utilization = resourceList.length > 0 ? Math.round((activeResources / resourceList.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e] flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduler
          </h1>
          <p className="text-[12px] text-[#5f6368] mt-0.5">
            Enterprise scheduling command center — manage all schedules across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/calendar")} className="h-8 text-[12px]">
            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Calendar
          </Button>
          <Button size="sm" className="h-8 text-[12px]" onClick={() => navigate("/scheduling/new")}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Schedule
          </Button>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 p-3 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all text-left"
          >
            <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#1a1a2e]">{action.label}</p>
              <p className="text-[9px] text-[#5f6368]">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Today", value: todaySchedules.length, icon: Clock, color: "text-blue-600" },
          { label: "This Week", value: counts?.upcoming ?? 0, icon: CalendarDays, color: "text-purple-600" },
          { label: "Pending", value: pendingApprovals.length, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Completed", value: counts?.completed ?? 0, icon: CheckCircle, color: "text-green-600" },
          { label: "Cancelled", value: counts?.cancelled ?? 0, icon: XCircle, color: "text-red-600" },
          { label: "Resources", value: resourceList.length, icon: Building2, color: "text-teal-600" },
          { label: "Utilization", value: `${utilization}%`, icon: BarChart3, color: "text-violet-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-3 border-[#e8eaed]">
            <div className="flex items-center justify-between">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[10px] text-[#5f6368]">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold text-[#1a1a2e] mt-1">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's Schedule */}
          <Card className="border-[#e8eaed] p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                Today's Schedule
                <Badge variant="secondary" className="text-[10px] h-5 ml-1">{todaySchedules.length}</Badge>
              </h2>
            </div>
            {todaySchedules.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                <p className="text-[12px] text-[#5f6368]">No schedules for today</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todaySchedules.slice(0, 8).map((s: any) => {
                  const cfg = SCHEDULE_TYPE_CONFIG[s.scheduleType] || { label: s.scheduleType, color: "#9aa0a6", icon: Calendar };
                  const Icon = cfg.icon;
                  return (
                    <div key={s._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      onClick={() => navigate(`/scheduling/${s._id}`)}
                    >
                      <div className="p-1.5 rounded-full shrink-0" style={{ backgroundColor: `${cfg.color}12` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1a1a2e]">{s.title}</p>
                        <p className="text-[10px] text-[#5f6368]">
                          {formatTime(s.start)} - {formatTime(s.end)}
                          {s.entityType && ` · ${s.entityType}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4" style={{ color: cfg.color, borderColor: `${cfg.color}30` }}>
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Upcoming Schedule */}
          <Card className="border-[#e8eaed] p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-purple-500" />
                Upcoming (14 days)
              </h2>
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-7 w-[120px] text-[11px]"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-7 w-[110px] text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[11px]">All Types</SelectItem>
                    {Object.keys(SCHEDULE_TYPE_CONFIG).map((k) => (
                      <SelectItem key={k} value={k} className="text-[11px]">{SCHEDULE_TYPE_CONFIG[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredUpcoming.length === 0 ? (
              <p className="text-[12px] text-[#5f6368] text-center py-6">No upcoming schedules found</p>
            ) : (
              <div className="space-y-1">
                {filteredUpcoming.slice(0, 15).map((s: any) => {
                  const cfg = SCHEDULE_TYPE_CONFIG[s.scheduleType] || { label: s.scheduleType, color: "#9aa0a6", icon: Calendar };
                  return (
                    <div key={s._id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      onClick={() => navigate(`/scheduling/${s._id}`)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span className="text-[11px] font-medium text-[#1a1a2e] flex-1 truncate">{s.title}</span>
                      <span className="text-[9px] text-[#5f6368]">
                        {s.allDay ? "All day" : formatTime(s.start)}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4" style={{ color: cfg.color, borderColor: `${cfg.color}30` }}>
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Pending Approvals */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Pending Approvals
            </h3>
            <p className="text-2xl font-bold text-[#1a1a2e]">{pendingApprovals.length}</p>
            <p className="text-[11px] text-[#5f6368] mt-1">Schedules awaiting approval</p>
            {pendingApprovals.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendingApprovals.slice(0, 5).map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between p-2 rounded-md bg-[#f8f9fa] cursor-pointer"
                    onClick={() => navigate(`/scheduling/${s._id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate">{s.title}</p>
                      <p className="text-[9px] text-[#5f6368]">{s.scheduleType}</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-[#9aa0a6] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Type Distribution */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-violet-500" />
              Schedule Distribution
            </h3>
            <div className="space-y-1">
              {Object.entries(SCHEDULE_TYPE_CONFIG).map(([type, cfg]) => (
                <TypeSummaryCard key={type} type={type} schedules={upcomingSchedules} />
              ))}
            </div>
          </Card>

          {/* Resource Summary */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-teal-500" />
              Resources
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#5f6368]">Active / Total</span>
                <span className="font-medium">{activeResources} / {resourceList.length}</span>
              </div>
              <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${utilization}%` }} />
              </div>
              <div className="mt-2 space-y-1">
                {resourceList.slice(0, 5).map((r: any) => (
                  <div key={r._id} className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-[#1a1a2e] truncate flex-1">{r.name}</span>
                    <Badge variant="outline" className={cn("text-[9px] h-4 ml-2",
                      r.status === "active" ? "text-green-600 border-green-200" : "text-[#9aa0a6]"
                    )}>{r.status}</Badge>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] mt-1"
                onClick={() => navigate("/scheduling/resources")}>
                View all resources <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Quick Stats</h3>
            <div className="space-y-2 text-[11px]">
              {[
                ["Total Scheduled", String(upcomingSchedules.length)],
                ["Completion Rate", counts?.total ? `${Math.round((counts.completed / counts.total) * 100)}%` : "0%"],
                ["Cancel Rate", counts?.total ? `${Math.round((counts.cancelled / counts.total) * 100)}%` : "0%"],
                ["Avg Duration", "—"],
                ["Faculty Load", "—"],
                ["Room Occupancy", `${utilization}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[#5f6368]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Cross-Module Schedule Widgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScheduleWidget title="Meeting Schedule" filterTypes={["meeting", "interview", "board_meeting", "vendor_meeting"]} showViewAll />
        <ScheduleWidget title="Academic Schedule" filterTypes={["lecture", "exam", "training", "counseling"]} showViewAll />
        <ScheduleWidget title="Operations Schedule" filterTypes={["maintenance", "holiday", "site_visit"]} showViewAll />
        <ScheduleWidget title="HR Schedule" filterTypes={["interview", "training", "counseling"]} showViewAll />
      </div>
    </div>
  );
}
