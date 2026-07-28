/**
 * SchedulingDashboard — Enterprise Scheduling Dashboard
 *
 * Route: /scheduling
 *
 * Displays:
 * - KPIs (today, week, month, conflicts, approvals)
 * - Today's Schedule
 * - Upcoming Schedules
 * - Pending Approvals
 * - Resource Utilization
 * - Quick Actions
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Users,
  CalendarDays,
  ListChecks,
  ArrowRight,
  Loader2,
  Search,
  Filter,
  Building2,
  LayoutGrid,
  Table2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

// ─── Schedule Type Config ─────────────────────────────────────────

const SCHEDULE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  meeting: { label: "Meeting", color: "#4285f4", icon: Users },
  lecture: { label: "Lecture", color: "#a855f7", icon: CalendarDays },
  exam: { label: "Exam", color: "#ea4335", icon: CheckCircle },
  interview: { label: "Interview", color: "#34a853", icon: Users },
  training: { label: "Training", color: "#06b6d4", icon: CalendarDays },
  maintenance: { label: "Maintenance", color: "#f59e0b", icon: Clock },
  holiday: { label: "Holiday", color: "#f97316", icon: Calendar },
};

function getConfig(type: string) {
  return SCHEDULE_TYPE_CONFIG[type] || { label: type, color: "#9aa0a6", icon: Calendar };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function startOfDay(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}

// ─── Schedule Card ────────────────────────────────────────────────

function ScheduleCard({ schedule, onClick }: { schedule: any; onClick?: () => void }) {
  const config = getConfig(schedule.scheduleType);
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-2.5 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="p-1.5 rounded-full shrink-0" style={{ backgroundColor: `${config.color}15` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{schedule.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#5f6368]">{formatTime(schedule.start)}</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal"
            style={{ color: config.color, borderColor: `${config.color}40` }}>
            {config.label}
          </Badge>
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1 font-normal",
            schedule.status === "confirmed" && "text-green-600 border-green-200",
            schedule.status === "pending_approval" && "text-amber-600 border-amber-200",
            schedule.status === "cancelled" && "text-red-600 border-red-200",
          )}>
            {schedule.status?.replace("_", " ")}
          </Badge>
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-[#9aa0a6] shrink-0 mt-1" />
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────

export default function SchedulingDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<"card" | "table">("card");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  // Fetch counts + schedules
  const counts = useQuery(api.schedulingSdk.getCounts as any);
  const todaySchedules = useQuery(api.schedulingSdk.getToday as any);
  const upcomingSchedules = useQuery(api.schedulingSdk.getUpcoming as any, { days: 7 });
  const resources = useQuery(api.schedulingSdk.listResources as any, {});

  // Derived data
  const filteredUpcoming = useMemo(() => {
    if (!upcomingSchedules) return [];
    let items = upcomingSchedules;
    if (filterType !== "all") items = items.filter((s: any) => s.scheduleType === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((s: any) => s.title?.toLowerCase().includes(q));
    }
    return items;
  }, [upcomingSchedules, filterType, search]);

  const todayItems = todaySchedules || [];
  const resourceList = resources || [];

  // Resource utilization
  const resourceUtilization = useMemo(() => {
    if (!resourceList.length) return 0;
    const active = resourceList.filter((r: any) => r.status === "active").length;
    return Math.round((active / resourceList.length) * 100);
  }, [resourceList]);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e] flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduling
          </h1>
          <p className="text-[12px] text-[#5f6368] mt-0.5">
            Enterprise scheduling engine — manage schedules, resources, and bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/calendar")} className="h-8 text-[12px]">
            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Calendar View
          </Button>
          <Button size="sm" className="h-8 text-[12px]" onClick={() => navigate("/scheduling/new")}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Schedule
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Today", value: counts?.today ?? 0, icon: Calendar, color: "text-blue-600" },
          { label: "Upcoming", value: counts?.upcoming ?? 0, icon: CalendarDays, color: "text-purple-600" },
          { label: "Scheduled", value: counts?.total ?? 0, icon: LayoutGrid, color: "text-indigo-600" },
          { label: "Completed", value: counts?.completed ?? 0, icon: CheckCircle, color: "text-green-600" },
          { label: "Pending", value: counts?.pending ?? 0, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Cancelled", value: counts?.cancelled ?? 0, icon: XCircle, color: "text-red-600" },
          { label: "Resources", value: resourceList.length, icon: Building2, color: "text-teal-600" },
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
        {/* Left Column — Today & Upcoming */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's Schedule */}
          <Card className="border-[#e8eaed] p-3">
            <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              Today's Schedule
              <Badge variant="secondary" className="ml-auto text-[10px] h-5">{todayItems.length}</Badge>
            </h2>
            {todayItems.length === 0 ? (
              <div className="text-center py-8 text-[#9aa0a6]">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p className="text-[12px]">No schedules for today</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {todayItems.slice(0, 5).map((s: any) => (
                  <ScheduleCard key={s._id} schedule={s} onClick={() => navigate(`/scheduling/${s._id}`)} />
                ))}
                {todayItems.length > 5 && (
                  <p className="text-[11px] text-[#5f6368] text-center pt-1">+{todayItems.length - 5} more</p>
                )}
              </div>
            )}
          </Card>

          {/* Upcoming Schedule */}
          <Card className="border-[#e8eaed] p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-purple-500" />
                Upcoming (7 days)
              </h2>
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-7 w-[140px] text-[11px]"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-7 w-[120px] text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[12px]">All Types</SelectItem>
                    {Object.keys(SCHEDULE_TYPE_CONFIG).map((key) => (
                      <SelectItem key={key} value={key} className="text-[12px]">{SCHEDULE_TYPE_CONFIG[key].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredUpcoming.length === 0 ? (
              <div className="text-center py-6 text-[#9aa0a6] text-[12px]">No upcoming schedules</div>
            ) : (
              <div className="space-y-1.5">
                {filteredUpcoming.slice(0, 10).map((s: any) => (
                  <ScheduleCard key={s._id} schedule={s} onClick={() => navigate(`/scheduling/${s._id}`)} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column — Status & Resources */}
        <div className="space-y-4">
          {/* Pending Approvals */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Pending Approvals
            </h3>
            {!upcomingSchedules ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-[#9aa0a6]" /></div>
            ) : (
              <>
                <p className="text-2xl font-bold text-[#1a1a2e]">{counts?.pending || 0}</p>
                <p className="text-[11px] text-[#5f6368] mt-1">Schedules awaiting approval</p>
                {counts && counts.pending > 0 && (
                  <Button size="sm" variant="outline" className="mt-3 w-full h-7 text-[11px]" onClick={() => navigate("/scheduling?filter=pending")}>
                    Review <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </>
            )}
          </Card>

          {/* Resource Overview */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-teal-500" />
              Resource Overview
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#5f6368]">Utilization</span>
                  <span className="font-medium">{resourceUtilization}%</span>
                </div>
                <div className="h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${resourceUtilization}%` }} />
                </div>
              </div>
              <div className="space-y-1 mt-2">
                {resourceList.slice(0, 5).map((r: any) => (
                  <div key={r._id} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#1a1a2e] truncate">{r.name}</span>
                    <Badge variant="outline" className={cn("text-[9px] h-4",
                      r.status === "active" ? "text-green-600 border-green-200" : "text-[#9aa0a6]"
                    )}>{r.status}</Badge>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] mt-1" onClick={() => navigate("/scheduling/resources")}>
                View All Resources <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Quick Stats</h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span className="text-[#5f6368]">Total Schedules</span><span className="font-medium">{counts?.total || 0}</span></div>
              <div className="flex justify-between"><span className="text-[#5f6368]">Completion Rate</span><span className="font-medium text-green-600">{counts?.total ? Math.round((counts.completed / counts.total) * 100) : 0}%</span></div>
              <div className="flex justify-between"><span className="text-[#5f6368]">Cancel Rate</span><span className="font-medium text-red-600">{counts?.total ? Math.round((counts.cancelled / counts.total) * 100) : 0}%</span></div>
              <div className="flex justify-between"><span className="text-[#5f6368]">Active Resources</span><span className="font-medium">{resourceList.filter((r: any) => r.status === "active").length}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
