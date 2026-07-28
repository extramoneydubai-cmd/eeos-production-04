/**
 * StudentWorkspace — Enterprise Student Detail Workspace (Release 1.1)
 *
 * 13 tabs: Overview, Enrollment, Academic, Attendance, Finance,
 * Examination, LMS, Calendar, Documents, Timeline, Tasks, Notes, Activity
 *
 * Consumes:
 * - WorkspaceShell (PATCH-UI-001)
 * - studentSdk (shared SDK)
 * - calendarSdk (calendar integration)
 * - Shared tab plugins (Documents, Timeline, Tasks, Notes, Activity)
 * - People Registry (person data)
 *
 * Actions (permission-aware):
 * Promote, Transfer, Suspend, Archive, QR Code, Certificate
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  User, BookOpen, GraduationCap, CalendarCheck, PiggyBank,
  FileCheck, Layers, FileText, History, ListChecks,
  MessageSquare, Activity, Target, ArrowUpRight,
  Ban, Archive, QrCode, Award, ExternalLink, Calendar,
  Percent, BarChart3, Clock, CreditCard, Zap, Star,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceTimelineTab } from "@/components/workspace/WorkspaceTimelineTab";
import { WorkspaceTasksTab } from "@/components/workspace/WorkspaceTasksTab";
import { WorkspaceDocumentsTab } from "@/components/workspace/WorkspaceDocumentsTab";
import { WorkspaceActivityTab } from "@/components/workspace/WorkspaceActivityTab";
import { WorkspaceNotesTab } from "@/components/workspace/WorkspaceNotesTab";
import { WorkspaceOverviewTab } from "@/components/workspace/WorkspaceOverviewTab";
import { ScheduleWidget } from "@/components/scheduling/ScheduleWidget";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type {
  WorkspaceTabProps, WorkspaceBodySection,
  WorkspaceAction, WorkspaceTabDefinition,
} from "@/components/workspace/types";

// ─── Status Colors ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", admitted: "bg-blue-500",
  lead: "bg-amber-500", qualified: "bg-violet-500",
  trial: "bg-cyan-500", enquiry: "bg-slate-400",
  completed: "bg-green-700", alumni: "bg-indigo-500",
  cancelled: "bg-rose-500", suspended: "bg-orange-500",
};

// ─── Action Confirmation Dialog ───────────────────────────────────
function ConfirmActionDialog({
  open, onClose, onConfirm, title, description, confirmLabel, variant,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; confirmLabel?: string; variant?: "destructive" | "default";
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant={variant || "destructive"} size="sm" onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Overview (KPI + Personal + Academic + Quick Widgets)
// ══════════════════════════════════════════════════════════════════
function StudentOverviewTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const data = entity as any;
  const student = data?.student;
  const person = data?.person;
  const academicProfile = data?.academicProfile;
  const latestAdmission = data?.latestAdmission;

  if (!student) {
    return <WorkspaceOverviewTab entityType={entityType} entityId={entityId} entity={entity} sections={[]} />;
  }

  // KPI Widgets
  const kpiCards = [
    { label: "Total Fee", value: latestAdmission?.totalFee ? `₹${latestAdmission.totalFee.toLocaleString()}` : "—", icon: PiggyBank, color: "bg-blue-500" },
    { label: "Paid", value: latestAdmission?.finalFee ? `₹${latestAdmission.finalFee.toLocaleString()}` : "—", icon: CreditCard, color: "bg-emerald-500" },
    { label: "Attendance", value: "—", icon: Percent, color: "bg-violet-500" },
    { label: "Assignments", value: "—", icon: Clock, color: "bg-amber-500" },
  ];

  // Upcoming items
  const upcomingItems = useMemo(() => [
    { label: "Next Exam", value: "—", icon: FileCheck },
    { label: "Next Fee Due", value: latestAdmission?.finalFee ? `₹${latestAdmission.finalFee.toLocaleString()}` : "—", icon: CreditCard },
    { label: "Lessons Pending", value: "—", icon: Layers },
    { label: "Events This Month", value: "—", icon: Calendar },
  ], [latestAdmission]);

  // Personal Info
  const personalSection: WorkspaceBodySection = {
    id: "personal", title: "Personal Information", icon: User, columns: 2,
    fields: [
      { label: "Full Name", value: person?.displayName || `${person?.firstName || ""} ${person?.lastName || ""}` },
      { label: "Gender", value: person?.gender || "—", type: "badge", badgeColor: "bg-slate-200 text-slate-700" },
      { label: "Date of Birth", value: person?.dateOfBirth, type: "date" },
      { label: "Nationality", value: person?.nationality || "—" },
      { label: "Blood Group", value: person?.bloodGroup || "—", type: "badge", badgeColor: "bg-rose-100 text-rose-700" },
      { label: "Status", value: student.currentStatus, type: "badge", badgeColor: STATUS_COLORS[student.currentStatus] },
    ],
  };

  // Contact Info
  const contactSection: WorkspaceBodySection = {
    id: "contacts", title: "Contact Information", icon: User, columns: 2,
    fields: (data?.contacts || []).length > 0
      ? (data.contacts as any[]).map((c: any) => ({
          label: c.type === "email" ? "Email" : c.type === "mobile" ? "Phone" : c.type,
          value: c.value,
          type: c.type === "email" ? "email" : c.type === "mobile" ? "phone" : "text",
        } as any))
      : [{ label: "Phone", value: "—" }, { label: "Email", value: "—" }],
  };

  // Academic Info
  const academicSection: WorkspaceBodySection = {
    id: "academic", title: "Academic Profile", icon: BookOpen, columns: 2,
    fields: academicProfile
      ? [
          { label: "Course", value: academicProfile.courseId || "—" },
          { label: "Batch", value: academicProfile.batchId || "—" },
          { label: "Section", value: academicProfile.sectionId || "—" },
          { label: "Current Year", value: academicProfile.currentYear || 1 },
          { label: "Current Term", value: academicProfile.currentTerm || "—" },
          { label: "Vertical", value: academicProfile.verticalId || "—" },
        ]
      : [{ label: "Academic Profile", value: "Not set" }],
  };

  // Enrollment Details
  const enrollmentSection: WorkspaceBodySection = {
    id: "enrollment", title: "Enrollment Details", icon: GraduationCap, columns: 2,
    fields: [
      { label: "Student Code", value: student.studentCode },
      { label: "Admission Number", value: student.admissionNumber },
      { label: "Roll Number", value: student.rollNumber || "—" },
      { label: "Enrollment Date", value: student.enrollmentDate, type: "date" },
      { label: "Admission Status", value: latestAdmission?.status || "—", type: "badge", badgeColor: latestAdmission?.status === "approved" ? "bg-emerald-500" : "bg-amber-500" },
      { label: "Final Fee", value: latestAdmission?.finalFee, type: "currency" },
    ],
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="p-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-md ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-sm font-bold">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming Items */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            Quick Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {upcomingItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WorkspaceOverviewTab
          entityType={entityType} entityId={entityId} entity={entity}
          sections={[personalSection, contactSection]}
        />
        <WorkspaceOverviewTab
          entityType={entityType} entityId={entityId} entity={entity}
          sections={[academicSection, enrollmentSection]}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Enrollment (Admission timeline, status history)
// ══════════════════════════════════════════════════════════════════
function StudentEnrollmentTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const timeline = useQuery(api.studentLifecycle.getStudentTimeline, { studentId: entityId as Id<"studentMaster"> });
  const statusHistory = useQuery(api.studentLifecycle.getStudentStatusHistory, { studentId: entityId as Id<"studentMaster"> });

  const allEvents = [
    ...(statusHistory || []).map((s: any) => ({
      _id: s._id, eventType: "status_change", title: `Status: ${s.fromStatus || "—"} → ${s.toStatus}`,
      description: s.remarks || "", createdAt: s.changedAt,
    })),
    ...(timeline || []),
  ].sort((a: any, b: any) => b.createdAt - a.createdAt);

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          Enrollment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allEvents.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No enrollment history available.</div>
        ) : (
          <div className="space-y-1">
            {allEvents.slice(0, 50).map((event: any) => (
              <div key={event._id} className="flex items-start gap-2 py-1.5">
                <div className={cn(
                  "h-2 w-2 rounded-full mt-1.5 shrink-0",
                  event.eventType === "status_change" ? "bg-amber-500" : "bg-blue-500",
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{event.title}</p>
                  {event.description && <p className="text-[10px] text-muted-foreground">{event.description}</p>}
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                    {new Date(event.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Academic
// ══════════════════════════════════════════════════════════════════
function StudentAcademicTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const academicHistory = useQuery(api.studentLifecycle.getStudentAcademicHistory, { studentId: entityId as Id<"studentMaster"> });

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          Academic History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!academicHistory || academicHistory.length === 0) ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No academic history available.</div>
        ) : (
          <div className="space-y-2">
            {(academicHistory as any[]).map((profile: any) => (
              <div key={profile._id} className="flex items-center justify-between py-2 px-3 border border-border/30 rounded-sm">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Year {profile.currentYear} — {profile.isCurrent ? "Current" : "Completed"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Course: {profile.courseId || "—"} | Batch: {profile.batchId || "—"}
                  </p>
                </div>
                <Badge className={cn("text-[10px] px-1.5 py-0 h-4", profile.isCurrent ? "bg-emerald-500" : "bg-slate-300")}>
                  {profile.isCurrent ? "Active" : "Archived"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Attendance
// ══════════════════════════════════════════════════════════════════
function StudentAttendanceTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Present", value: "—", color: "text-emerald-600" },
          { label: "Absent", value: "—", color: "text-red-600" },
          { label: "Leave", value: "—", color: "text-amber-600" },
          { label: "Overall %", value: "—", color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-xs text-muted-foreground">
            Attendance tracking will be available in a future release. Records will show daily, monthly, and subject-wise attendance here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Finance
// ══════════════════════════════════════════════════════════════════
function StudentFinanceTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const data = entity as any;
  const latestAdmission = data?.latestAdmission;

  const stats = [
    { label: "Total Fee", value: latestAdmission?.totalFee || 0, format: "currency", color: "text-blue-600" },
    { label: "Discount", value: latestAdmission?.discountAmount || 0, format: "currency", color: "text-amber-600" },
    { label: "Final Fee", value: latestAdmission?.finalFee || 0, format: "currency", color: "text-violet-600" },
    { label: "Installments", value: latestAdmission?.installmentCount || 1, format: "number", color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>
              {s.format === "currency"
                ? `₹${Number(s.value).toLocaleString()}`
                : String(s.value)}
            </p>
          </Card>
        ))}
      </div>
      {/* Fee Summary */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />
            Fee Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-xs text-muted-foreground">
            Detailed fee ledger, invoices, receipts, and payment history will appear here.
            Uses the Enterprise Finance Platform for all financial data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Examination
// ══════════════════════════════════════════════════════════════════
function StudentExaminationTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      {/* Exam Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Upcoming Exams", value: "—", color: "text-blue-600", icon: Clock },
          { label: "Results Published", value: "—", color: "text-emerald-600", icon: Award },
          { label: "Pass Percentage", value: "—", color: "text-violet-600", icon: Percent },
          { label: "Pending Results", value: "—", color: "text-amber-600", icon: BarChart3 },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center gap-2">
              <s.icon className={cn("h-4 w-4", s.color)} />
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
            Examination History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-xs text-muted-foreground">
            Exam schedules, hall tickets, marks, results, ranks, certificates, and revaluation
            status from the Examination Engine will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: LMS
// ══════════════════════════════════════════════════════════════════
function StudentLMSTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      {/* Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Courses Enrolled", value: "—", color: "text-blue-600" },
          { label: "Lessons Completed", value: "—", color: "text-emerald-600" },
          { label: "Assignments Done", value: "—", color: "text-violet-600" },
          { label: "Completion %", value: "—", color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            Learning Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-xs text-muted-foreground">
            Courses, lessons, assignments, quizzes, progress tracking, and certificates
            from the LMS Platform will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Schedule
// ══════════════════════════════════════════════════════════════════
function StudentScheduleTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
          Schedule & Timetable
        </h3>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => nav("/scheduler")}>
          <CalendarRange className="h-3 w-3" /> View Planner
        </Button>
      </div>
      <ScheduleWidget
        entityType="student"
        entityId={entityId || ""}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Calendar
// ══════════════════════════════════════════════════════════════════
function StudentCalendarTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const calendarEvents = useQuery(
    api.calendarSdk.getEntityEvents,
    entityId ? { entityType: "student", entityId } : "skip",
  );

  return (
    <div className="space-y-4">
      {/* Upcoming Events */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!calendarEvents || (calendarEvents as any[]).length === 0) ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No upcoming events. Calendar events such as classes, exams, and meetings will appear here.
            </div>
          ) : (
            <div className="space-y-1">
              {(calendarEvents as any[]).slice(0, 10).map((event: any) => (
                <div key={event._id} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", event.color || "bg-blue-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(event.startTime).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {event.eventType && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                      {event.eventType}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN: StudentWorkspace
// ══════════════════════════════════════════════════════════════════
export default function StudentWorkspace() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  // Student data
  const studentData = useQuery(
    api.studentEngine.getStudent,
    studentId ? { studentId: studentId as Id<"studentMaster"> } : "skip",
  );
  const archiveStudent = useMutation(api.studentEngine.archiveStudent);
  const suspendStudent = useMutation(api.studentLifecycle.suspendStudent);
  const transferStudent = useMutation(api.studentLifecycle.transferStudent);
  const promoteStudent = useMutation(api.studentLifecycle.promoteStudent);

  const student = studentData?.student as any;
  const person = studentData?.person as any;

  // Action dialogs state
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Action handlers
  const handlePromote = useCallback(async () => {
    if (!studentId || !user?._id) return;
    try {
      await promoteStudent({ studentId: studentId as Id<"studentMaster">, performedBy: user._id as Id<"users">, nextYear: (studentData?.student?.currentYear || 1) + 1 });
      toast({ title: "Student promoted", description: "Successfully promoted to next academic year" });
    } catch (err: any) {
      toast({ title: "Promotion failed", description: err.message || "Could not promote student", variant: "destructive" });
    }
  }, [studentId, user, studentData, promoteStudent, toast]);

  const handleTransfer = useCallback(async (toBranchId?: string) => {
    if (!studentId || !user?._id) return;
    try {
      await transferStudent({ studentId: studentId as Id<"studentMaster">, performedBy: user._id as Id<"users">, toBranchId: toBranchId as any });
      toast({ title: "Student transferred", description: "Successfully transferred to new branch" });
    } catch (err: any) {
      toast({ title: "Transfer failed", description: err.message || "Could not transfer student", variant: "destructive" });
    }
  }, [studentId, user, transferStudent, toast]);

  const handleSuspend = useCallback(async () => {
    if (!studentId || !user?._id) return;
    try {
      await suspendStudent({ studentId: studentId as Id<"studentMaster">, performedBy: user._id as Id<"users">, reason: "Administrative suspension" });
      toast({ title: "Student suspended", description: "Student has been suspended" });
    } catch (err: any) {
      toast({ title: "Suspension failed", description: err.message || "Could not suspend student", variant: "destructive" });
    }
  }, [studentId, user, suspendStudent, toast]);

  const handleArchive = useCallback(async () => {
    if (!studentId || !user?._id) return;
    try {
      await archiveStudent({ studentId: studentId as Id<"studentMaster">, performedBy: user._id as Id<"users"> });
      toast({ title: "Student archived", description: "Student record has been archived" });
    } catch (err: any) {
      toast({ title: "Archive failed", description: err.message || "Could not archive student", variant: "destructive" });
    }
  }, [studentId, user, archiveStudent, toast]);

  // Actions
  const actions: WorkspaceAction[] = useMemo(() => [
    { id: "promote", label: "Promote", icon: ArrowUpRight, onClick: () => setShowPromoteDialog(true), variant: "outline", tooltip: "Promote to next academic year" },
    { id: "transfer", label: "Transfer", icon: ExternalLink, onClick: () => setShowTransferDialog(true), variant: "outline", tooltip: "Transfer to another branch/company" },
    { id: "suspend", label: "Suspend", icon: Ban, onClick: () => setShowSuspendDialog(true), variant: "outline", tooltip: "Suspend student enrollment" },
    { id: "archive", label: "Archive", icon: Archive, onClick: () => setShowArchiveDialog(true), variant: "destructive", tooltip: "Archive this student record" },
    { id: "qr", label: "QR Code", icon: QrCode, onClick: () => {}, variant: "ghost", tooltip: "Generate student QR code" },
    { id: "award", label: "Certificate", icon: Award, onClick: () => {}, variant: "ghost", tooltip: "Generate certificate" },
  ], []);

  // Avatar initials
  const initials = person
    ? `${(person.firstName || "")[0] || ""}${(person.lastName || "")[0] || ""}`.toUpperCase()
    : student ? (student.studentCode || "??").slice(0, 2).toUpperCase() : "ST";

  // Header fields
  const headerFields = student ? [
    { label: "Code", value: student.studentCode },
    { label: "Admission", value: student.admissionNumber },
    { label: "Roll", value: student.rollNumber || "—" },
  ] : [];

  // Tab definitions (13 tabs)
  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: User, component: StudentOverviewTab },
    { id: "enrollment", label: "Enrollment", icon: Target, component: StudentEnrollmentTab },
    { id: "academic", label: "Academic", icon: BookOpen, component: StudentAcademicTab },
    { id: "attendance", label: "Attendance", icon: CalendarCheck, component: StudentAttendanceTab },
    { id: "finance", label: "Finance", icon: PiggyBank, component: StudentFinanceTab },
    { id: "exams", label: "Exams", icon: FileCheck, component: StudentExaminationTab },
    { id: "lms", label: "LMS", icon: Layers, component: StudentLMSTab },
    { id: "calendar", label: "Calendar", icon: Calendar, component: StudentCalendarTab },
    { id: "schedule", label: "Schedule", icon: CalendarRange, component: StudentScheduleTab },
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "timeline", label: "Timeline", icon: History, component: WorkspaceTimelineTab },
    { id: "tasks", label: "Tasks", icon: ListChecks, component: WorkspaceTasksTab },
    { id: "notes", label: "Notes", icon: MessageSquare, component: WorkspaceNotesTab },
    { id: "activity", label: "Activity", icon: Activity, component: WorkspaceActivityTab },
  ];

  const title = person
    ? person.displayName || `${person.firstName || ""} ${person.lastName || ""}`
    : student ? `${student.studentCode}` : "Loading...";

  const subtitle = student
    ? `Student • ${(student.currentStatus || "").charAt(0).toUpperCase() + (student.currentStatus || "").slice(1)}`
    : "";

  const badge = student
    ? { label: (student.currentStatus || "unknown").charAt(0).toUpperCase() + (student.currentStatus || "unknown").slice(1),
        color: STATUS_COLORS[student.currentStatus] || "bg-slate-400" }
    : undefined;

  return (
    <>
      <WorkspaceShell
        entityType="student"
        entityId={studentId || ""}
        entity={(studentData || {}) as unknown as Record<string, unknown>}
        isLoading={!studentData && !!studentId}
        title={title}
        subtitle={subtitle}
        badge={badge}
        headerFields={headerFields}
        avatar={
          <Avatar className="h-10 w-10 shrink-0">
            {person?.profilePhoto ? <AvatarImage src={person.profilePhoto} /> : null}
            <AvatarFallback className="text-xs bg-[#1a1a2e] text-white">{initials}</AvatarFallback>
          </Avatar>
        }
        backLink={{ label: "Back to Students", onClick: () => navigate("/students") }}
        tabs={tabs}
        actions={actions}
        module="student"
      />

      {/* Action Dialogs */}
      <ConfirmActionDialog
        open={showPromoteDialog} onClose={() => setShowPromoteDialog(false)}
        onConfirm={handlePromote}
        title="Promote Student"
        description={`Promote ${person?.displayName || title} to the next academic year? This will create a new academic profile for the next year.`}
        confirmLabel="Promote"
        variant="default"
      />
      <ConfirmActionDialog
        open={showTransferDialog} onClose={() => setShowTransferDialog(false)}
        onConfirm={() => handleTransfer()}
        title="Transfer Student"
        description={`Transfer ${person?.displayName || title} to another branch? This will update the student's branch assignment and create a transfer record.`}
        confirmLabel="Transfer"
        variant="default"
      />
      <ConfirmActionDialog
        open={showSuspendDialog} onClose={() => setShowSuspendDialog(false)}
        onConfirm={handleSuspend}
        title="Suspend Student"
        description="Are you sure you want to suspend this student? They can be reinstated later."
        confirmLabel="Suspend"
        variant="destructive"
      />
      <ConfirmActionDialog
        open={showArchiveDialog} onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchive}
        title="Archive Student"
        description={`Archive ${person?.displayName || title}? The student record will be preserved but marked as cancelled.`}
        confirmLabel="Archive"
        variant="destructive"
      />
    </>
  );
}
