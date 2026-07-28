/**
 * ScheduleWidget — Reusable Schedule Display Widget
 *
 * Used by: Student Workspace, Employee Workspace, Faculty Workspace,
 * Academic Workspace, Administration Dashboard, CRM Dashboard, etc.
 *
 * Features:
 * - Upcoming schedule list
 * - Today's schedule
 * - Schedule type filtering
 * - Quick actions (Join, Book, Reschedule)
 * - Empty state
 * - Loading state
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
  CalendarDays, ArrowRight,
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

// ─── Props ────────────────────────────────────────────────────────

export interface ScheduleWidgetProps {
  /** Entity to scope schedules (e.g., student, employee, course) */
  entityType?: string;
  entityId?: string;
  /** User ID for personal schedules */
  userId?: string;
  /** Company/branch scoping */
  companyId?: string;
  branchId?: string;
  /** Max items to show (default 5) */
  limit?: number;
  /** Show today's schedule only */
  showToday?: boolean;
  /** Title override */
  title?: string;
  /** Show view-all link */
  showViewAll?: boolean;
  /** Compact mode for sidebars */
  compact?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Callback when a schedule is clicked */
  onScheduleClick?: (scheduleId: string) => void;
  /** Filter by schedule types */
  filterTypes?: string[];
}

// ─── Schedule Card ────────────────────────────────────────────────

function ScheduleItem({ schedule, compact, onClick }: { schedule: any; compact?: boolean; onClick?: () => void }) {
  const config = getConfig(schedule.scheduleType);
  const Icon = config.icon;

  if (compact) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f8f9fa] text-left transition-colors">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
        <span className="text-[11px] text-[#1a1a2e] truncate flex-1">{schedule.title}</span>
        <span className="text-[9px] text-[#5f6368] shrink-0">{formatTime(schedule.start)}</span>
      </button>
    );
  }

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
            <span className="text-[9px] text-[#5f6368]">{schedule.entityType}</span>
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

// ─── Main Widget ──────────────────────────────────────────────────

export default function ScheduleWidget({
  entityType, entityId, userId, companyId, branchId,
  limit = 5, showToday, title = "Schedule",
  showViewAll = true, compact = false, emptyMessage,
  onScheduleClick, filterTypes,
}: ScheduleWidgetProps) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch schedules based on props
  const todayResult = useQuery(
    showToday ? (api.schedulingSdk.getToday as any) : "skip",
    { companyId: companyId as any, branchId: branchId as any },
  ) as any[] | undefined;

  const upcomingResult = useQuery(
    !showToday ? (api.schedulingSdk.getUpcoming as any) : "skip",
    { days: 7, companyId: companyId as any, branchId: branchId as any },
  ) as any[] | undefined;

  // Entity-specific schedules
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
    return items.slice(0, limit);
  }, [schedules, filterTypes, typeFilter, limit]);

  const handleClick = (scheduleId: string) => {
    if (onScheduleClick) onScheduleClick(scheduleId);
    else navigate(`/scheduling/${scheduleId}`);
  };

  if (!schedules) {
    return (
      <Card className={cn("border-[#e8eaed]", compact ? "p-2" : "p-3")}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[#9aa0a6]" />
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-0.5">
        {filtered.map((s: any) => (
          <ScheduleItem key={s._id} schedule={s} compact onClick={() => handleClick(s._id)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-[11px] text-[#9aa0a6] px-2 py-2">{emptyMessage || "No schedules"}</p>
        )}
      </div>
    );
  }

  return (
    <Card className="border-[#e8eaed] p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-blue-500" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {showToday && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {filtered.length} today
            </Badge>
          )}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-6 w-[100px] text-[10px]">
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

      {filtered.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
          <p className="text-[12px] text-[#5f6368]">{emptyMessage || "No schedules found"}</p>
          <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px]" onClick={() => navigate("/scheduling/new")}>
            <Plus className="h-3 w-3 mr-1" /> New Schedule
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((s: any) => (
            <ScheduleItem key={s._id} schedule={s} onClick={() => handleClick(s._id)} />
          ))}
        </div>
      )}

      {showViewAll && filtered.length > 0 && (
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
