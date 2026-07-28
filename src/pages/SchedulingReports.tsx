/**
 * SchedulingReports — Enterprise Scheduling Reports Center
 *
 * Route: /scheduling/reports
 *
 * Reports:
 * - Faculty Schedule
 * - Student Timetable
 * - Room Utilization
 * - Vehicle Usage
 * - Meeting Report
 * - Exam Schedule
 * - Attendance Summary
 * - Cancelled Events
 * - Conflict Report
 *
 * Exports: PDF, Excel, CSV, Markdown
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import {
  FileText, Download, Filter, Calendar,
  Users, BookOpen, Truck, GraduationCap,
  Clock, XCircle, AlertTriangle, CheckCircle,
  BarChart3, ChevronRight, Search, FileJson,
  FileSpreadsheet,
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

// ─── Report Definitions ──────────────────────────────────────────

const REPORTS = [
  {
    id: "faculty-schedule",
    label: "Faculty Schedule",
    description: "Complete schedule with teaching hours, office hours, exam duties, and meetings per faculty member",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "student-timetable",
    label: "Student Timetable",
    description: "Weekly timetable showing classes, exams, and counseling sessions for individual students",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "room-utilization",
    label: "Room Utilization",
    description: "Usage statistics, occupancy rates, and booking patterns for all rooms and facilities",
    icon: Calendar,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "vehicle-usage",
    label: "Vehicle Usage",
    description: "Vehicle booking history, mileage tracking, fuel consumption, and maintenance schedules",
    icon: Truck,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "meeting-report",
    label: "Meeting Report",
    description: "Meeting history, attendance, duration, and frequency across all departments",
    icon: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    id: "exam-schedule",
    label: "Exam Schedule",
    description: "Complete exam timetable with room allocation, invigilator assignments, and student counts",
    icon: GraduationCap,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    id: "attendance-summary",
    label: "Attendance Summary",
    description: "Schedule attendance rates, no-show statistics, and punctuality trends",
    icon: CheckCircle,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    id: "cancelled-events",
    label: "Cancelled Events",
    description: "Analysis of cancelled schedules, reasons, patterns, and rescheduling impact",
    icon: XCircle,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    id: "conflict-report",
    label: "Conflict Report",
    description: "Schedule conflicts, double bookings, faculty clashes, and resource overlaps",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

// ─── Main Page ───────────────────────────────────────────────────

export default function SchedulingReports() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState("faculty-schedule");
  const [dateRange, setDateRange] = useState("this-week");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch report data
  const schedules = useQuery(api.schedulingSdk.listSchedules as any, {
    limit: 500,
  }) as any[] | undefined;

  const report = REPORTS.find((r) => r.id === selectedReport);
  const Icon = report?.icon || FileText;

  // Filter reports by search
  const filteredReports = useMemo(() => {
    if (!searchQuery) return REPORTS;
    const q = searchQuery.toLowerCase();
    return REPORTS.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Compute report data
  const reportData = useMemo(() => {
    if (!schedules) return null;

    switch (selectedReport) {
      case "faculty-schedule": {
        const facultySchedules: Record<string, any[]> = {};
        (schedules as any[]).forEach((s) => {
          if (s.facultyId) {
            if (!facultySchedules[s.facultyId]) facultySchedules[s.facultyId] = [];
            facultySchedules[s.facultyId].push(s);
          }
        });
        return Object.entries(facultySchedules).map(([id, scheds]) => ({
          name: id,
          total: scheds.length,
          hours: scheds.reduce((sum, s) => sum + (s.end - s.start), 0) / 3600000,
          types: [...new Set(scheds.map((s) => s.scheduleType))],
        }));
      }
      case "conflict-report": {
        const conflicts: any[] = [];
        (schedules as any[]).forEach((s, i) => {
          (schedules as any[]).forEach((o, j) => {
            if (i < j && s.start < o.end && s.end > o.start) {
              conflicts.push({
                scheduleA: s.title || s._id,
                scheduleB: o.title || o._id,
                type: "overlap",
              });
            }
          });
        });
        return conflicts;
      }
      case "room-utilization": {
        const rooms: Record<string, { bookings: number; totalHours: number }> = {};
        (schedules as any[]).forEach((s) => {
          if (s.resourceId) {
            if (!rooms[s.resourceId]) rooms[s.resourceId] = { bookings: 0, totalHours: 0 };
            rooms[s.resourceId].bookings++;
            rooms[s.resourceId].totalHours += (s.end - s.start) / 3600000;
          }
        });
        return Object.entries(rooms).map(([id, data]) => ({
          name: id,
          ...data,
          utilization: Math.round((data.totalHours / 40) * 100),
        }));
      }
      default:
        return schedules;
    }
  }, [schedules, selectedReport]);

  const exportFormat = async (format: string) => {
    // Placeholder for export functionality
    console.log(`Exporting ${selectedReport} as ${format}`);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            Scheduling Reports
          </h1>
          <p className="text-xs text-[#5f6368] mt-0.5">Generate and export scheduling reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="this-week" className="text-xs">This Week</SelectItem>
              <SelectItem value="this-month" className="text-xs">This Month</SelectItem>
              <SelectItem value="this-quarter" className="text-xs">This Quarter</SelectItem>
              <SelectItem value="this-year" className="text-xs">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Report List Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
            <Input
              placeholder="Search reports..."
              className="h-8 pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {filteredReports.map((r) => {
              const isSelected = r.id === selectedReport;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all",
                    isSelected ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-[#f8f9fa]",
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", r.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", r.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{r.label}</p>
                    <p className="text-[9px] text-[#5f6368] truncate">{r.description.slice(0, 40)}...</p>
                  </div>
                  <ChevronRight className={cn("h-3 w-3 shrink-0", isSelected ? "text-violet-500" : "text-[#9aa0a6]")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-[#e8eaed]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-[#1a1a2e]">{report?.label}</CardTitle>
                    <p className="text-[10px] text-[#5f6368]">{report?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => exportFormat("csv")}>
                    <FileSpreadsheet className="h-3 w-3 mr-1" /> CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => exportFormat("json")}>
                    <FileJson className="h-3 w-3 mr-1" /> JSON
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => exportFormat("pdf")}>
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {!reportData ? (
                <div className="text-center py-12 text-xs text-[#9aa0a6]">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Loading report data...
                </div>
              ) : Array.isArray(reportData) && reportData.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#9aa0a6]">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No data available for this report
                </div>
              ) : selectedReport === "faculty-schedule" && Array.isArray(reportData) ? (
                <div className="space-y-2">
                  {reportData.map((faculty: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-md bg-[#f8f9fa]">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs font-medium text-[#1a1a2e]">{faculty.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[#5f6368]">
                        <span>{faculty.total} schedules</span>
                        <span>{Math.round(faculty.hours)}h total</span>
                        <Badge variant="outline" className="text-[9px] px-1">{faculty.types.join(", ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedReport === "conflict-report" && Array.isArray(reportData) ? (
                <div className="space-y-2">
                  {reportData.map((conflict: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-md bg-red-50">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-xs text-[#1a1a2e]">
                        <strong>{conflict.scheduleA}</strong> overlaps with <strong>{conflict.scheduleB}</strong>
                      </span>
                      <Badge variant="outline" className="text-[9px] text-red-600 border-red-200 ml-auto">{conflict.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : selectedReport === "room-utilization" && Array.isArray(reportData) ? (
                <div className="space-y-3">
                  {reportData.map((room: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1a1a2e]">{room.name}</span>
                        <span className="text-[10px] text-[#5f6368]">{room.bookings} bookings · {Math.round(room.totalHours)}h</span>
                      </div>
                      <div className="h-1.5 bg-[#e8eaed] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${room.utilization}%`,
                            backgroundColor: room.utilization > 80 ? "#ef4444" : room.utilization > 50 ? "#f59e0b" : "#22c55e",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-[#9aa0a6]">
                        <span>Utilization: {room.utilization}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-[#9aa0a6]">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Report data available. Select export format to download.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
