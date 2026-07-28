/**
 * ScheduleWidget — Reusable Schedule Display Widget
 *
 * Supports 6 view modes:
 * - compact   — minimal dot+text for sidebars
 * - card      — rich card with type icon, time, badge (default)
 * - timeline  — vertical timeline with hour markers
 * - agenda    — list grouped by date with time column
 * - calendarMini — mini month calendar grid
 * - sidebar   — hybrid badge+compact list for sidebar panels
 *
 * Used by: Student, Employee, Faculty, Academic, Administration, CRM, Finance, etc.
 * Every module must use this widget — no duplicate scheduling UIs.
 */

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Calendar, Clock, Users, MapPin, Play, Plus,
  BookOpen, FileCheck, Briefcase, Coffee, Star,
  AlertTriangle, Loader2, ChevronRight, Filter,
  CalendarDays, ArrowRight, List, LayoutDashboard,
  Columns3, GanttChartSquare, Grid3X3, ChevronLeft,
  CircleDot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Schedule Type Config ─────────────────────────────────────────

export const SCHEDULE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  meeting: { label: "Meeting", color: "#4285f4", icon: Users },
  lecture: { label: "Lecture", color: "#a855f7", icon: BookOpen },
  exam: { label: "Exam", color: "#ea4335", icon: FileCheck },
  interview: { label: "Interview", color: "#34a853", icon: Briefcase },
  training: { label: "Training", color: "#06b6d4", icon: Star },
  counseling: { label: "Counseling", color: "#ec4899", icon: Users },
  maintenance: { label: "Maintenance", color: "#f59e0b", icon: Clock },
  holiday: { label: "Holiday", color: "#f97316", icon: Coffee },
  custom: { label: "Custom", color: "#9aa0a6", icon: Calendar },
};

function getConfig(type: string) {
  return SCHEDULE_TYPE_CONFIG[type] || { label: type, color: "#9aa0a6", icon: Calendar };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDateFull(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getStartOfDay(d?: Date): number {
  const date = d || new Date();
  const s = new Date(date);
  s.setHours(0, 0, 0, 0);
  return s.getTime();
}

function getDayOfWeek(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short" });
}

function getDateNum(ts: number): number {
  return new Date(ts).getDate();
}

// ─── View Mode ────────────────────────────────────────────────────

export type ScheduleViewMode = "compact" | "card" | "timeline" | "agenda" | "calendarMini" | "sidebar";

const VIEW_OPTIONS: { value: ScheduleViewMode; label: string; icon: any }[] = [
  { value: "card", label: "Card", icon: LayoutDashboard },
  { value: "compact", label: "Compact", icon: List },
  { value: "timeline", label: "Timeline", icon: GanttChartSquare },
  { value: "agenda", label: "Agenda", icon: Columns3 },
  { value: "calendarMini", label: "Calendar", icon: Grid3X3 },
  { value: "sidebar", label: "Sidebar", icon: CircleDot },
];

// ─── Props ────────────────────────────────────────────────────────

export interface ScheduleWidgetProps {
  entityType?: string;
  entityId?: string;
  userId?: string;
  companyId?: string;
  branchId?: string;
  limit?: number;
  showToday?: boolean;
  title?: string;
  showViewAll?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  onScheduleClick?: (scheduleId: string) => void;
  filterTypes?: string[];
  /** View mode override */
  viewMode?: ScheduleViewMode;
  /** Enable view switcher toolbar */
  showViewSwitcher?: boolean;
  /** Show in sidebar panel (uses sidebar variant) */
  sidebar?: boolean;
}

// ─── Schedule Item ────────────────────────────────────────────────

function ScheduleItem({ schedule, compact, onClick, sidebar }: { schedule: any; compact?: boolean; onClick?: () => void; sidebar?: boolean }) {
  const config = getConfig(schedule.scheduleType);
  const Icon = config.icon;

  // Sidebar mode — mini badge + time
  if (sidebar) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f8f9fa] text-left transition-colors group">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <span className="text-[11px] text-[#1a1a2e] truncate flex-1 font-medium group-hover:text-[#1a73e8]">{schedule.title}</span>
        <span className="text-[9px] text-[#5f6368] shrink-0 font-mono bg-[#f1f3f4] px-1 py-0.5 rounded">{formatTime(schedule.start)}</span>
      </button>
    );
  }

  // Compact mode — dot + title + time
  if (compact) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f8f9fa] text-left transition-colors">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <span className="text-[11px] text-[#1a1a2e] truncate flex-1">{schedule.title}</span>
        <span className="text-[9px] text-[#5f6368] shrink-0">{formatTime(schedule.start)}</span>
      </button>
    );
  }

  // Card mode (default) — rich display
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-2.5 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="p-1.5 rounded-full shrink-0" style={{ backgroundColor: `${config.color}12` }}>
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{schedule.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] text-[#5f6368] flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {schedule.allDay ? "All day" : `${formatTime(schedule.start)} - ${formatTime(schedule.end)}`}
          </span>
          {schedule.entityType && (
            <span className="text-[9px] text-[#5f6368] capitalize">{schedule.entityType}</span>
          )}
          <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal"
            style={{ color: config.color, borderColor: `${config.color}30` }}>
            {config.label}
          </Badge>
          {schedule.status === "pending_approval" && (
            <Badge variant="outline" className="text-[9px] h-4 px-1 text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
          )}
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-[#9aa0a6] shrink-0 mt-1" />
    </motion.div>
  );
}

// ─── Timeline Item ────────────────────────────────────────────────

function TimelineItem({ schedule, onClick }: { schedule: any; onClick?: () => void }) {
  const config = getConfig(schedule.scheduleType);
  const Icon = config.icon;
  const hour = new Date(schedule.start).getHours();
  const hourLabel = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;

  return (
    <div className="flex gap-3 group" onClick={onClick}>
      <div className="flex flex-col items-center w-10 shrink-0 pt-1">
        <span className="text-[9px] text-[#9aa0a6] font-mono">{hourLabel}</span>
        <div className="w-px flex-1 bg-[#e8eaed] mt-1" />
      </div>
      <div className="flex-1 pb-3 cursor-pointer">
        <div className="flex items-start gap-2 p-2 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all">
          <div className="w-1 h-full min-h-[2rem] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: config.color }} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#1a1a2e]">{schedule.title}</p>
            <p className="text-[9px] text-[#5f6368]">{formatTime(schedule.start)} - {formatTime(schedule.end)}</p>
            {schedule.description && (
              <p className="text-[9px] text-[#9aa0a6] mt-0.5 truncate">{schedule.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-[8px] h-3.5 px-1" style={{ color: config.color, borderColor: `${config.color}30` }}>
            {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ─── Agenda Item ──────────────────────────────────────────────────

function AgendaItem({ date, schedules, onClick }: { date: string; schedules: any[]; onClick?: (id: string) => void }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-2 h-2 rounded-full bg-[#4285f4]" />
        <span className="text-[11px] font-semibold text-[#1a1a2e]">{date}</span>
        <span className="text-[9px] text-[#9aa0a6]">{schedules.length} events</span>
      </div>
      <div className="space-y-1 ml-4">
        {schedules.map((s: any) => {
          const cfg = getConfig(s.scheduleType);
          return (
            <div key={s._id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#f8f9fa] cursor-pointer transition-colors" onClick={() => onClick?.(s._id)}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
              <span className="text-[10px] font-medium text-[#1a1a2e] w-[60px] shrink-0 font-mono">{formatTime(s.start)}</span>
              <span className="text-[10px] text-[#1a1a2e] truncate flex-1">{s.title}</span>
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0" style={{ color: cfg.color, borderColor: `${cfg.color}30` }}>
                {cfg.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────

function MiniCalendar({ schedules, onClick }: { schedules: any[]; onClick?: (id: string) => void }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = getStartOfDay();

  // Map schedules by date (start of day)
  const scheduleMap = useMemo(() => {
    const map = new Map<string, any[]>();
    schedules?.forEach((s: any) => {
      const key = getStartOfDay(new Date(s.start));
      const existing = map.get(String(key)) || [];
      existing.push(s);
      map.set(String(key), existing);
    });
    return map;
  }, [schedules]);

  const days = useMemo(() => {
    const cells: { day: number; ts: number; hasEvents: boolean; isToday: boolean; scheduleCount: number }[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: 0, ts: 0, hasEvents: false, isToday: false, scheduleCount: 0 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ts = new Date(year, month, d).getTime();
      const scheds = scheduleMap.get(String(getStartOfDay(new Date(ts)))) || [];
      cells.push({
        day: d,
        ts,
        hasEvents: scheds.length > 0,
        isToday: Math.abs(ts - today) < 86400000,
        scheduleCount: scheds.length,
      });
    }
    return cells;
  }, [daysInMonth, firstDay, scheduleMap, monthOffset]);

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMonthOffset((p) => p - 1)} className="p-1 hover:bg-[#f1f3f4] rounded transition-colors">
          <ChevronLeft className="h-3 w-3 text-[#5f6368]" />
        </button>
        <span className="text-[11px] font-semibold text-[#1a1a2e]">{monthLabel}</span>
        <button onClick={() => setMonthOffset((p) => p + 1)} className="p-1 hover:bg-[#f1f3f4] rounded transition-colors">
          <ChevronRight className="h-3 w-3 text-[#5f6368]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[8px] text-[#9aa0a6] text-center font-medium py-1">{d}</div>
        ))}
        {days.map((cell, i) => (
          <div
            key={i}
            className={cn(
              "text-[10px] text-center py-1 rounded relative",
              cell.day === 0 ? "invisible" : "",
              cell.isToday ? "bg-[#1a73e8] text-white font-semibold" : "text-[#1a1a2e] hover:bg-[#f1f3f4]"
            )}
          >
            {cell.day > 0 ? cell.day : ""}
            {cell.hasEvents && cell.day > 0 && (
              <div className={cn("w-1 h-1 rounded-full mx-auto mt-0.5", cell.isToday ? "bg-white" : "bg-[#4285f4]")} />
            )}
          </div>
        ))}
      </div>
      {/* Today's events below mini calendar */}
      {schedules && schedules.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#e8eaed] space-y-1">
          {schedules.slice(0, 3).map((s: any) => (
            <div key={s._id} className="flex items-center gap-1.5 cursor-pointer hover:bg-[#f8f9fa] p-1 rounded text-[9px]" onClick={() => onClick?.(s._id)}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getConfig(s.scheduleType).color }} />
              <span className="text-[9px] text-[#1a1a2e] truncate">{s.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────

export default function ScheduleWidget({
  entityType, entityId, userId, companyId, branchId,
  limit = 5, showToday, title = "Schedule",
  showViewAll = true, compact: compactProp = false, emptyMessage,
  onScheduleClick, filterTypes,
  viewMode: viewModeProp,
  showViewSwitcher = false,
  sidebar,
}: ScheduleWidgetProps) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>(
    viewModeProp || (sidebar ? "sidebar" : compactProp ? "compact" : "card")
  );

  // Fetch schedules
  const todayResult = useQuery(
    showToday ? (api.schedulingSdk.getToday as any) : "skip",
    { companyId: companyId as any, branchId: branchId as any },
  ) as any[] | undefined;

  const upcomingResult = useQuery(
    !showToday ? (api.schedulingSdk.getUpcoming as any) : "skip",
    { days: 7, companyId: companyId as any, branchId: branchId as any },
  ) as any[] | undefined;

  const entitySchedules = useQuery(
    entityType && entityId ? (api.schedulingSdk.getByDateRange as any) : "skip",
    {
      start: Date.now(),
      end: Date.now() + 30 * 24 * 60 * 60 * 1000,
      limit: limit || 20,
    },
  ) as any[] | undefined;

  const schedules = showToday ? todayResult : (entitySchedules || upcomingResult);

  const filtered = useMemo(() => {
    if (!schedules) return [];
    let items = schedules;
    if (filterTypes?.length) items = items.filter((s: any) => filterTypes.includes(s.scheduleType));
    if (typeFilter !== "all") items = items.filter((s: any) => s.scheduleType === typeFilter);
    return items.slice(0, limit || 50);
  }, [schedules, filterTypes, typeFilter, limit]);

  // Group by date for agenda view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach((s: any) => {
      const key = formatDateFull(s.start || s.start);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [filtered]);

  const handleClick = (scheduleId: string) => {
    if (onScheduleClick) onScheduleClick(scheduleId);
    else navigate(`/scheduling/${scheduleId}`);
  };

  if (!schedules) {
    return (
      <Card className={cn("border-[#e8eaed]", compactProp || sidebar ? "p-2" : "p-3")}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[#9aa0a6]" />
        </div>
      </Card>
    );
  }

  // ─── Render by view mode ──────────────────────────────────

  const renderContent = () => {
    if (filtered.length === 0) {
      return (
        <div className="text-center py-6">
          <Calendar className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
          <p className="text-[12px] text-[#5f6368]">{emptyMessage || "No schedules found"}</p>
          <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px]" onClick={() => navigate("/scheduling/new")}>
            <Plus className="h-3 w-3 mr-1" /> New Schedule
          </Button>
        </div>
      );
    }

    switch (viewMode) {
      case "sidebar":
        return (
          <div className="space-y-0.5">
            {filtered.map((s: any) => (
              <ScheduleItem key={s._id} schedule={s} sidebar onClick={() => handleClick(s._id)} />
            ))}
          </div>
        );

      case "compact":
        return (
          <div className="space-y-0.5">
            {filtered.map((s: any) => (
              <ScheduleItem key={s._id} schedule={s} compact onClick={() => handleClick(s._id)} />
            ))}
          </div>
        );

      case "timeline":
        return (
          <div className="max-h-[400px] overflow-y-auto">
            {filtered.map((s: any) => (
              <TimelineItem key={s._id} schedule={s} onClick={() => handleClick(s._id)} />
            ))}
          </div>
        );

      case "agenda":
        return (
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(groupedByDate).map(([date, scheds]) => (
              <AgendaItem key={date} date={date} schedules={scheds} onClick={handleClick} />
            ))}
          </div>
        );

      case "calendarMini":
        return (
          <MiniCalendar schedules={filtered} onClick={handleClick} />
        );

      case "card":
      default:
        return (
          <div className="space-y-1.5">
            {filtered.map((s: any) => (
              <ScheduleItem key={s._id} schedule={s} onClick={() => handleClick(s._id)} />
            ))}
          </div>
        );
    }
  };

  // ─── Sidebar mode: no card wrapper ──────────────────────────────
  if (sidebar || compactProp) {
    return (
      <div>
        {showViewSwitcher && (
          <div className="flex items-center gap-1 mb-2 px-1">
            {VIEW_OPTIONS.filter((v) => ["compact", "card", "timeline", "agenda"].includes(v.value)).map((v) => (
              <button
                key={v.value}
                onClick={() => setViewMode(v.value)}
                className={cn("p-1 rounded transition-colors", viewMode === v.value ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#9aa0a6] hover:text-[#5f6368]")}
                title={v.label}
              >
                <v.icon className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
        {renderContent()}
      </div>
    );
  }

  // ─── Standard card wrapper ──────────────────────────────────────
  return (
    <Card className="border-[#e8eaed] p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-blue-500" />
          {title}
          {filtered.length > 0 && (
            <span className="text-[10px] text-[#9aa0a6] font-normal">({filtered.length})</span>
          )}
        </h3>
        <div className="flex items-center gap-1.5">
          {showViewSwitcher && (
            <div className="flex items-center gap-0.5 mr-1 border-r border-[#e8eaed] pr-1.5">
              {VIEW_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setViewMode(v.value)}
                  className={cn("p-1 rounded transition-colors", viewMode === v.value ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#9aa0a6] hover:text-[#5f6368]")}
                  title={v.label}
                >
                  <v.icon className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
          {showToday && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {filtered.length} today
            </Badge>
          )}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-6 w-[95px] text-[10px]">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[11px]">All</SelectItem>
              {Object.entries(SCHEDULE_TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-[11px]">{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderContent()}

      {showViewAll && filtered.length > 0 && viewMode !== "calendarMini" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 h-7 text-[11px] text-[#1a73e8]"
          onClick={() => navigate("/scheduling")}
        >
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </Card>
  );
}
