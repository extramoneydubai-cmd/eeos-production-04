/**
 * FacultyScheduleWorkspace — Faculty Schedule & Timetable View
 *
 * Route: /scheduling/faculty/:facultyId
 *
 * Displays:
 * - Teaching hours / Lecture schedule
 * - Exam duties & invigilation
 * - Office hours
 * - Student meetings
 * - Weekly load
 * - Conflict detection
 * - Room assignments
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Calendar, Clock, BookOpen, FileCheck, Users,
  MapPin, AlertTriangle, CheckCircle, Loader2,
  ArrowLeft, BarChart3, Sun, Star, Coffee,
  Briefcase, GraduationCap, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import SchedulingPlanner from "@/components/scheduling/SchedulingPlanner";

// ─── Config ───────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  lecture: { label: "Lecture", color: "#a855f7", icon: BookOpen },
  exam: { label: "Exam Duty", color: "#ea4335", icon: FileCheck },
  meeting: { label: "Meeting", color: "#4285f4", icon: Users },
  counseling: { label: "Student Meeting", color: "#ec4899", icon: Users },
  office_hours: { label: "Office Hours", color: "#06b6d4", icon: Clock },
  invigilation: { label: "Invigilation", color: "#f59e0b", icon: FileCheck },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || { label: type, color: "#9aa0a6", icon: Calendar };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDuration(start: number, end: number): string {
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── Weekly Statistics Card ───────────────────────────────────────

function WeeklyStats({ schedules }: { schedules: any[] }) {
  const totalHours = schedules.reduce((sum: number, s: any) => sum + (s.end - s.start), 0);
  const lectureHours = schedules.filter((s: any) => s.scheduleType === "lecture")
    .reduce((sum: number, s: any) => sum + (s.end - s.start), 0);
  const examHours = schedules.filter((s: any) => s.scheduleType === "exam" || s.scheduleType === "invigilation")
    .reduce((sum: number, s: any) => sum + (s.end - s.start), 0);
  const meetingHours = schedules.filter((s: any) => s.scheduleType === "meeting" || s.scheduleType === "counseling")
    .reduce((sum: number, s: any) => sum + (s.end - s.start), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Total Hours", value: `${Math.round(totalHours / 3600000)}h`, icon: Clock, color: "text-blue-600" },
        { label: "Teaching", value: `${Math.round(lectureHours / 3600000)}h`, icon: BookOpen, color: "text-purple-600" },
        { label: "Exams", value: `${Math.round(examHours / 3600000)}h`, icon: FileCheck, color: "text-red-600" },
        { label: "Meetings", value: `${Math.round(meetingHours / 3600000)}h`, icon: Users, color: "text-emerald-600" },
      ].map((s) => (
        <Card key={s.label} className="p-3 border-[#e8eaed]">
          <div className="flex items-center gap-2">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <p className="text-[10px] text-[#5f6368]">{s.label}</p>
              <p className="text-sm font-bold text-[#1a1a2e]">{s.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Schedule by Type ─────────────────────────────────────────────

function ScheduleByType({ schedules, type, onItemClick }: { schedules: any[]; type: string; onItemClick: (id: string) => void }) {
  const config = getConfig(type);
  const items = schedules.filter((s: any) => s.scheduleType === type);
  const Icon = config.icon;

  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-[12px] font-semibold text-[#1a1a2e] flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
        {config.label} ({items.length})
      </h4>
      <div className="space-y-1">
        {items.slice(0, 10).map((s: any) => (
          <div key={s._id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[#f8f9fa] cursor-pointer transition-colors"
            onClick={() => onItemClick(s._id)}
          >
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
            <span className="text-[11px] text-[#1a1a2e] flex-1 truncate">{s.title}</span>
            <span className="text-[9px] text-[#5f6368]">{formatTime(s.start)}</span>
            <span className="text-[9px] text-[#5f6368]">{formatDuration(s.start, s.end)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function FacultyScheduleWorkspace() {
  const { facultyId } = useParams<{ facultyId: string }>();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState("all");

  // Fetch faculty's schedules (using entityType=faculty or by userId)
  const schedules = useQuery(api.schedulingSdk.getByDateRange as any, {
    start: Date.now(),
    end: Date.now() + 7 * 24 * 60 * 60 * 1000,
    limit: 200,
  }) as any[] | undefined;

  const allSchedules = schedules || [];

  // Filter by type
  const filteredSchedules = useMemo(() => {
    if (viewType === "all") return allSchedules;
    return allSchedules.filter((s: any) => s.scheduleType === viewType);
  }, [allSchedules, viewType]);

  // Schedule type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allSchedules.forEach((s: any) => {
      counts[s.scheduleType] = (counts[s.scheduleType] || 0) + 1;
    });
    return counts;
  }, [allSchedules]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/scheduler")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-[#1a1a2e] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-500" />
              Faculty Schedule
            </h1>
            <p className="text-[11px] text-[#5f6368] mt-0.5">Faculty ID: {facultyId || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="h-7 w-[130px] text-[11px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[11px]">All Types</SelectItem>
              {Object.keys(TYPE_CONFIG).map((k) => (
                <SelectItem key={k} value={k} className="text-[11px]">{TYPE_CONFIG[k].label} ({typeBreakdown[k] || 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Weekly Stats */}
      <WeeklyStats schedules={allSchedules} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Planner */}
        <div className="lg:col-span-2">
          <SchedulingPlanner
            defaultView="week"
            height="500px"
            scheduleTypes={viewType !== "all" ? [viewType] : undefined}
            onEventClick={(id) => navigate(`/scheduling/${id}`)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Schedule by Type */}
          <Card className="border-[#e8eaed] p-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
              Schedule Breakdown
            </h3>
            <div className="space-y-3">
              {Object.keys(TYPE_CONFIG).map((type) => {
                if (!typeBreakdown[type]) return null;
                return <ScheduleByType key={type} schedules={allSchedules} type={type} onItemClick={(id) => navigate(`/scheduling/${id}`)} />;
              })}
              {allSchedules.length === 0 && (
                <p className="text-[12px] text-[#5f6368] text-center py-4">No schedules this week</p>
              )}
            </div>
          </Card>

          {/* Conflict Warning */}
          {allSchedules.filter((s: any) => s.status === "pending_approval").length > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-medium text-amber-800">Pending Actions</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {allSchedules.filter((s: any) => s.status === "pending_approval").length} schedule(s) need attention
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
