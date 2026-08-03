/**
 * OrganizationCalendar — Enterprise Organization-Wide Calendar
 *
 * Route: /organization-calendar
 *
 * Merges schedules from:
 * - Academic (classes, exams)
 * - HR (interviews, leave, reviews)
 * - Finance (payments, invoices, deadlines)
 * - Operations (maintenance, procurement)
 * - Marketing (campaigns, events)
 * - Sales (meetings, demos)
 * - Training (courses, certifications)
 * - Facility (bookings, maintenance)
 *
 * Color-coded by module with cross-filtering capabilities.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Calendar, Filter, Download, ChevronLeft, ChevronRight,
  Briefcase, BookOpen, PiggyBank, Users, Megaphone,
  Building2, GraduationCap, Wrench, BarChart3,
  CheckCircle, Clock, XCircle, AlertTriangle,
  Search, CalendarRange,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Module Config ───────────────────────────────────────────────

const MODULES = [
  { id: "academic", label: "Academic", icon: BookOpen, color: "#a855f7" },
  { id: "hr", label: "HR", icon: Users, color: "#4285f4" },
  { id: "finance", label: "Finance", icon: PiggyBank, color: "#22c55e" },
  { id: "marketing", label: "Marketing", icon: Megaphone, color: "#f59e0b" },
  { id: "sales", label: "Sales", icon: Briefcase, color: "#ec4899" },
  { id: "operations", label: "Operations", icon: Wrench, color: "#f97316" },
  { id: "exams", label: "Exams", icon: GraduationCap, color: "#ef4444" },
  { id: "training", label: "Training", icon: BarChart3, color: "#06b6d4" },
  { id: "facility", label: "Facility", icon: Building2, color: "#6366f1" },
];

const MODULE_COLORS: Record<string, string> = {};
MODULES.forEach((m) => { MODULE_COLORS[m.id] = m.color; });

// ─── Helpers ─────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Main Page ───────────────────────────────────────────────────

export default function OrganizationCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [filterModule, setFilterModule] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch schedules
  const schedules = useQuery(api.schedulingSdk.listSchedules as any, {
    limit: 500,
  }) as any[] | undefined;

  const allEvents = useMemo(() => {
    if (!schedules) return [];
    return (schedules as any[]).map((s: any) => ({
      id: s._id,
      title: s.title,
      start: new Date(s.start),
      end: new Date(s.end),
      module: s.scheduleType || "other",
      status: s.status,
      type: s.scheduleType,
      location: s.location,
      entityType: s.entityType,
    }));
  }, [schedules]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    if (filterModule !== "all") {
      events = events.filter((e) => e.module === filterModule);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      events = events.filter(
        (e) => e.title?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q),
      );
    }

    // Filter by current month view
    if (view === "month") {
      events = events.filter((e) =>
        e.start.getMonth() === month && e.start.getFullYear() === year,
      );
    }

    return events;
  }, [allEvents, filterModule, searchQuery, view, month, year]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof allEvents> = {};
    filteredEvents.forEach((event) => {
      const key = event.start.toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [filteredEvents]);

  // KPIs
  const kpis = useMemo(() => [
    { label: "Events This Month", value: filteredEvents.length, icon: Calendar, color: "text-blue-600" },
    { label: "Modules Active", value: new Set(filteredEvents.map((e) => e.module)).size, icon: Filter, color: "text-purple-600" },
    { label: "Today", value: eventsByDate[new Date().toISOString().split("T")[0]]?.length || 0, icon: Clock, color: "text-emerald-600" },
    { label: "Upcoming", value: filteredEvents.filter((e) => e.start > new Date()).length, icon: CalendarRange, color: "text-amber-600" },
  ], [filteredEvents, eventsByDate]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (delta: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-500" />
            Organization Calendar
          </h1>
          <p className="text-xs text-[#5f6368] mt-0.5">Enterprise-wide schedule view across all modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v: any) => setView(v)}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month" className="text-xs">Month</SelectItem>
              <SelectItem value="week" className="text-xs">Week</SelectItem>
              <SelectItem value="day" className="text-xs">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-3">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <div>
                <p className="text-[10px] text-[#5f6368]">{kpi.label}</p>
                <p className="text-sm font-bold text-[#1a1a2e]">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
          <Input
            placeholder="Search events..."
            className="h-8 pl-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Modules</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Module Legend */}
      <div className="flex flex-wrap gap-3">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setFilterModule(filterModule === mod.id ? "all" : mod.id)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all",
              filterModule === mod.id ? "ring-1 ring-offset-1" : "opacity-60 hover:opacity-100",
            )}
            style={{ backgroundColor: `${mod.color}15` }}
          >
            <mod.icon className="h-3 w-3" style={{ color: mod.color }} />
            <span style={{ color: mod.color }}>{mod.label}</span>
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card className="border-[#e8eaed]">
        {/* Month Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#e8eaed]">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold text-[#1a1a2e]">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-px bg-[#e8eaed]">
          {dayNames.map((name) => (
            <div key={name} className="bg-white px-2 py-1.5 text-[10px] font-medium text-[#5f6368] text-center">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-[#e8eaed]">
          {/* Empty cells for days before month start */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white min-h-[80px] p-1" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, day) => {
            const date = new Date(year, month, day + 1);
            const dateKey = date.toISOString().split("T")[0];
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = new Date().toISOString().split("T")[0] === dateKey;

            return (
              <div
                key={day}
                className={cn(
                  "bg-white min-h-[80px] p-1 hover:bg-[#f8f9fa] transition-colors",
                  isToday && "bg-[#f0f4ff]",
                )}
              >
                <div className={cn(
                  "text-[10px] font-medium mb-0.5 w-5 h-5 flex items-center justify-center rounded-full",
                  isToday ? "bg-violet-500 text-white" : "text-[#5f6368]",
                )}>
                  {day + 1}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity truncate"
                      style={{ backgroundColor: `${MODULE_COLORS[event.module] || "#9aa0a6"}20` }}
                      onClick={() => navigate(`/scheduler/${event.id}`)}
                      title={`${event.title} (${event.type})`}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: MODULE_COLORS[event.module] || "#9aa0a6" }}
                      />
                      <span className="text-[8px] truncate text-[#1a1a2e]">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-violet-500 font-medium pl-1">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Today's Events Panel */}
      <Card className="border-[#e8eaed]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Today's Events ({eventsByDate[new Date().toISOString().split("T")[0]]?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filteredEvents
              .filter((e) => e.start.toISOString().split("T")[0] === new Date().toISOString().split("T")[0])
              .slice(0, 10)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                  onClick={() => navigate(`/scheduler/${event.id}`)}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MODULE_COLORS[event.module] || "#9aa0a6" }} />
                  <span className="text-[11px] text-[#1a1a2e] flex-1 truncate">{event.title}</span>
                  <span className="text-[9px] text-[#5f6368]">
                    {event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1 h-3.5 font-normal" 
                    style={{ borderColor: MODULE_COLORS[event.module] || "#9aa0a6", color: MODULE_COLORS[event.module] || "#9aa0a6" }}>
                    {event.module}
                  </Badge>
                </div>
              ))}
            {filteredEvents.filter(
              (e) => e.start.toISOString().split("T")[0] === new Date().toISOString().split("T")[0],
            ).length === 0 && (
              <p className="text-xs text-[#9aa0a6] text-center py-4">No events scheduled for today</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
