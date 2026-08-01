/**
 * EmployeeWorkspace — Enterprise Employee Detail Workspace (Release 1.1)
 *
 * 16 tabs: Overview, Employment, Organization, Attendance, Leave,
 * Payroll, Performance, Training, Assets, Calendar, Documents,
 * Timeline, Tasks, Notes, Activity
 *
 * Consumes:
 * - WorkspaceShell
 * - employeeEngine (getEmployee, updateEmployee, archiveEmployee)
 * - People Registry (person data via personMaster)
 * - Shared tab plugins (Documents, Timeline, Tasks, Notes, Activity)
 * - calendarSdk (calendar events)
 *
 * Employee is a specialization of the People Registry.
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  User, Briefcase, Building2, CalendarCheck, CalendarX,
  PiggyBank, BarChart3, BookOpen, Monitor, Calendar,
  FileText, History, ListChecks, MessageSquare, Activity,
  Target, ArrowUpRight, ExternalLink, Ban, Archive, QrCode,
  Award, Zap, CreditCard, Percent, Clock, Star, Trophy,
  Users, MapPin, Hash, GraduationCap, Mail, Phone,
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
import { SchedulingPlanner } from "@/components/scheduling/SchedulingPlanner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type {
  WorkspaceTabProps, WorkspaceBodySection,
  WorkspaceAction, WorkspaceTabDefinition,
} from "@/components/workspace/types";

// ─── Status Colors ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", onboarding: "bg-blue-500",
  probation: "bg-amber-500", suspended: "bg-orange-500",
  resigned: "bg-rose-500", terminated: "bg-red-600",
  retired: "bg-indigo-500", archived: "bg-slate-400",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  permanent: "Permanent", contract: "Contract", part_time: "Part Time",
  intern: "Intern", freelancer: "Freelancer", consultant: "Consultant",
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
// TAB: Overview
// ══════════════════════════════════════════════════════════════════
function EmployeeOverviewTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const emp = entity as any;
  const employee = emp?.employee || emp;
  const person = emp?.person;
  const department = emp?.department;
  const designation = emp?.designation;
  const branch = emp?.branch;
  const company = emp?.company;

  if (!employee) return <WorkspaceOverviewTab entityType={entityType} entityId={entityId} entity={entity} sections={[]} />;

  const kpiCards = [
    { label: "Experience", value: employee.joiningDate ? `${Math.floor((Date.now() - employee.joiningDate) / 31536000000)} yrs` : "—", icon: Clock, color: "bg-blue-500" },
    { label: "Department", value: department?.name || "—", icon: Building2, color: "bg-emerald-500" },
    { label: "Designation", value: designation?.name || "—", icon: Briefcase, color: "bg-violet-500" },
    { label: "Location", value: employee.workLocation || branch?.name || "—", icon: MapPin, color: "bg-amber-500" },
  ];

  const personalSection: WorkspaceBodySection = {
    id: "personal", title: "Personal Information", icon: User, columns: 2,
    fields: [
      { label: "Full Name", value: person?.displayName || `${person?.firstName || ""} ${person?.lastName || ""}` },
      { label: "Gender", value: person?.gender || "—", type: "badge", badgeColor: "bg-slate-200 text-slate-700" },
      { label: "Date of Birth", value: person?.dateOfBirth, type: "date" },
      { label: "Nationality", value: person?.nationality || "—" },
      { label: "Blood Group", value: person?.bloodGroup || "—", type: "badge", badgeColor: "bg-rose-100 text-rose-700" },
      { label: "Status", value: employee.status, type: "badge", badgeColor: STATUS_COLORS[employee.status] },
    ],
  };

  const employmentSection: WorkspaceBodySection = {
    id: "employment", title: "Employment Details", icon: Briefcase, columns: 2,
    fields: [
      { label: "Employee Code", value: employee.employeeCode },
      { label: "Employment Type", value: EMPLOYMENT_TYPE_LABELS[employee.employmentType] || employee.employmentType, type: "badge", badgeColor: "bg-blue-100 text-blue-700" },
      { label: "Primary Role", value: employee.primaryRole?.replace(/_/g, " ") || "—", type: "badge", badgeColor: "bg-purple-100 text-purple-700" },
      { label: "Joining Date", value: employee.joiningDate, type: "date" },
      { label: "Probation End", value: employee.probationEndDate, type: "date" },
      { label: "Work Location", value: employee.workLocation || "—" },
    ],
  };

  const orgSection: WorkspaceBodySection = {
    id: "organization", title: "Organization", icon: Building2, columns: 2,
    fields: [
      { label: "Department", value: department?.name || "—" },
      { label: "Designation", value: designation?.name || "—" },
      { label: "Branch", value: branch?.name || "—" },
      { label: "Company", value: company?.name || "—" },
      { label: "Reports To", value: emp?.reportingManager?.displayName || "—" },
      { label: "Category", value: employee.employeeCategoryId || "—" },
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
                <p className="text-sm font-bold truncate">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WorkspaceOverviewTab entityType={entityType} entityId={entityId} entity={entity} sections={[personalSection, employmentSection]} />
        <WorkspaceOverviewTab entityType={entityType} entityId={entityId} entity={entity} sections={[orgSection]} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Employment
// ══════════════════════════════════════════════════════════════════
function EmployeeEmploymentTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const emp = entity as any;
  const employee = emp?.employee || emp;

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          Employment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!employee ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No employment details available.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Employee Code", value: employee.employeeCode },
              { label: "Employment Type", value: EMPLOYMENT_TYPE_LABELS[employee.employmentType] || employee.employmentType },
              { label: "Primary Role", value: employee.primaryRole?.replace(/_/g, " ") || "—" },
              { label: "Joining Date", value: employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—" },
              { label: "Probation End", value: employee.probationEndDate ? new Date(employee.probationEndDate).toLocaleDateString() : "—" },
              { label: "Confirmation Date", value: employee.confirmationDate ? new Date(employee.confirmationDate).toLocaleDateString() : "—" },
              { label: "Resignation Date", value: employee.resignationDate ? new Date(employee.resignationDate).toLocaleDateString() : "—" },
              { label: "Relieving Date", value: employee.relievingDate ? new Date(employee.relievingDate).toLocaleDateString() : "—" },
              { label: "Work Location", value: employee.workLocation || "—" },
              { label: "Experience Level", value: employee.experienceLevel || "—" },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-1.5 border-b border-border/20">
                <span className="text-[11px] text-muted-foreground">{f.label}</span>
                <span className="text-xs font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Organization
// ══════════════════════════════════════════════════════════════════
function EmployeeOrganizationTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const emp = entity as any;
  const employee = emp?.employee || emp;
  const department = emp?.department;
  const designation = emp?.designation;
  const branch = emp?.branch;
  const company = emp?.company;

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          Organization Structure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { label: "Company", value: company?.name || "—", icon: Building2 },
            { label: "Branch", value: branch?.name || "—", icon: MapPin },
            { label: "Department", value: department?.name || "—", icon: Building2 },
            { label: "Designation", value: designation?.name || "—", icon: Briefcase },
            { label: "Reporting Manager", value: emp?.reportingManager?.displayName || "—", icon: User },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 py-2 px-3 border border-border/30 rounded-sm">
              <div className="w-7 h-7 rounded-md bg-accent/50 flex items-center justify-center">
                <f.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{f.label}</p>
                <p className="text-xs font-medium">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Attendance
// ══════════════════════════════════════════════════════════════════
function EmployeeAttendanceTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Present", value: "—", color: "text-emerald-600" },
          { label: "Absent", value: "—", color: "text-red-600" },
          { label: "Late", value: "—", color: "text-amber-600" },
          { label: "Overtime (hrs)", value: "—", color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />Attendance Records</CardTitle></CardHeader><CardContent><div className="text-center py-8 text-xs text-muted-foreground">Daily attendance tracking will appear here.</div></CardContent></Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Leave
// ══════════════════════════════════════════════════════════════════
function EmployeeLeaveTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Annual Leave", value: "—", color: "text-blue-600" },
          { label: "Sick Leave", value: "—", color: "text-emerald-600" },
          { label: "Personal Leave", value: "—", color: "text-amber-600" },
          { label: "Pending", value: "—", color: "text-violet-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><CalendarX className="h-3.5 w-3.5 text-muted-foreground" />Leave History</CardTitle></CardHeader><CardContent><div className="text-center py-8 text-xs text-muted-foreground">Leave requests, balance, and calendar will appear here.</div></CardContent></Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Payroll
// ══════════════════════════════════════════════════════════════════
function EmployeePayrollTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly CTC", value: "—", color: "text-blue-600" },
          { label: "Net Pay", value: "—", color: "text-emerald-600" },
          { label: "Deductions", value: "—", color: "text-amber-600" },
          { label: "YTD Earnings", value: "—", color: "text-violet-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />Payroll History</CardTitle></CardHeader><CardContent><div className="text-center py-8 text-xs text-muted-foreground">Salary slips, advances, loans, and reimbursements from Finance Platform.</div></CardContent></Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Performance
// ══════════════════════════════════════════════════════════════════
function EmployeePerformanceTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "KPI Score", value: "—", color: "text-blue-600", icon: BarChart3 },
          { label: "Reviews", value: "—", color: "text-emerald-600", icon: Star },
          { label: "Appraisals", value: "—", color: "text-violet-600", icon: Trophy },
          { label: "Awards", value: "—", color: "text-amber-600", icon: Award },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center gap-2"><s.icon className={cn("h-4 w-4", s.color)} /><div><p className="text-[10px] text-muted-foreground">{s.label}</p><p className={cn("text-sm font-bold", s.color)}>{s.value}</p></div></div>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />Performance History</CardTitle></CardHeader><CardContent><div className="text-center py-8 text-xs text-muted-foreground">Goals, reviews, appraisals, and promotions will appear here.</div></CardContent></Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Training
// ══════════════════════════════════════════════════════════════════
function EmployeeTrainingTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Courses", value: "—", color: "text-blue-600" },
          { label: "Completed", value: "—", color: "text-emerald-600" },
          { label: "Certifications", value: "—", color: "text-violet-600" },
          { label: "Hours", value: "—", color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3"><p className="text-[10px] text-muted-foreground">{s.label}</p><p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p></Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-muted-foreground" />Training & Development</CardTitle></CardHeader><CardContent><div className="text-center py-8 text-xs text-muted-foreground">Assigned courses, LMS progress, and certifications from LMS Platform.</div></CardContent></Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Assets
// ══════════════════════════════════════════════════════════════════
function EmployeeAssetsTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const assets = useQuery(api.assetEngine.listEmployeeAssets, entityId ? { employeeId: entityId as Id<"employeeMaster"> } : "skip");

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          Assigned Assets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!assets || (assets as any[]).length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No assets assigned.</div>
        ) : (
          <div className="space-y-1">
            {(assets as any[]).map((a: any) => (
              <div key={a._id} className="flex items-center justify-between py-2 px-3 border border-border/30 rounded-sm">
                <div>
                  <p className="text-xs font-medium">{a.assetName}</p>
                  <p className="text-[10px] text-muted-foreground">{a.assetType}{a.assetTag ? ` • ${a.assetTag}` : ""}</p>
                </div>
                <Badge className={cn("text-[10px]", a.status === "assigned" ? "bg-emerald-500" : a.status === "returned" ? "bg-slate-400" : "bg-rose-500")}>{a.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Schedule
// ══════════════════════════════════════════════════════════════════
function EmployeeScheduleTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
          Schedule & Meetings
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => nav("/scheduler")}>
            <CalendarRange className="h-3 w-3" /> Planner
          </Button>
        </div>
      </div>
      <ScheduleWidget
        entityType="employee"
        entityId={entityId || ""}
        compact={false}
      />
      <div className="mt-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5" />
          Weekly Overview
        </h4>
        <SchedulingPlanner
          entityType="employee"
          entityId={entityId || ""}
          defaultView="week"
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Calendar
// ══════════════════════════════════════════════════════════════════
function EmployeeCalendarTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const calendarEvents = useQuery(api.calendarSdk.getEntityEvents, entityId ? { entityType: "employee", entityId } : "skip");

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!calendarEvents || (calendarEvents as any[]).length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No upcoming events.</div>
        ) : (
          <div className="space-y-1">
            {(calendarEvents as any[]).slice(0, 10).map((ev: any) => (
              <div key={ev._id} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                <div className={cn("h-2 w-2 rounded-full shrink-0", ev.color || "bg-blue-500")} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{ev.title}</p>
                  <p className="text-[10px] text-muted-foreground">{ev.startTime ? new Date(ev.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                </div>
                {ev.eventType && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">{ev.eventType}</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN: EmployeeWorkspace
// ══════════════════════════════════════════════════════════════════
export default function EmployeeWorkspace() {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const employeeData = useQuery(api.employeeEngine.getEmployee, employeeId ? { employeeId: employeeId as Id<"employeeMaster"> } : "skip");
  const archiveEmployee = useMutation(api.employeeEngine.archiveEmployee);

  const employee = employeeData as any;
  const person = employee?.person;

  // Action dialogs
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleArchive = useCallback(async () => {
    if (!employeeId || !user?._id) return;
    try {
      await archiveEmployee({ employeeId: employeeId as Id<"employeeMaster">, changedBy: employeeId as Id<"employeeMaster"> });
      toast({ title: "Employee archived", description: "Record has been archived" });
    } catch (err: any) {
      toast({ title: "Archive failed", description: err.message || "Could not archive", variant: "destructive" });
    }
  }, [employeeId, user, employeeData, archiveEmployee, toast]);

  const actions: WorkspaceAction[] = useMemo(() => [
    { id: "promote", label: "Promote", icon: ArrowUpRight, onClick: () => setShowPromoteDialog(true), variant: "outline", tooltip: "Change designation/role" },
    { id: "transfer", label: "Transfer", icon: ExternalLink, onClick: () => setShowTransferDialog(true), variant: "outline", tooltip: "Transfer to another department/branch" },
    { id: "suspend", label: "Suspend", icon: Ban, onClick: () => setShowSuspendDialog(true), variant: "outline", tooltip: "Suspend employee" },
    { id: "archive", label: "Archive", icon: Archive, onClick: () => setShowArchiveDialog(true), variant: "destructive", tooltip: "Archive this employee" },
    { id: "qr", label: "ID Card", icon: QrCode, onClick: () => {}, variant: "ghost", tooltip: "Generate employee ID card" },
    { id: "award", label: "Certificate", icon: Award, onClick: () => {}, variant: "ghost", tooltip: "Generate certificate" },
  ], []);

  const initials = person
    ? `${(person.firstName || "")[0] || ""}${(person.lastName || "")[0] || ""}`.toUpperCase()
    : employee ? (employee.employeeCode || "??").slice(0, 2).toUpperCase() : "EM";

  const headerFields = employee ? [
    { label: "Code", value: employee.employeeCode },
    { label: "Dept", value: employee.department?.name || "—" },
    { label: "Role", value: employee.primaryRole?.replace(/_/g, " ") || "—" },
  ] : [];

  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: User, component: EmployeeOverviewTab },
    { id: "employment", label: "Employment", icon: Briefcase, component: EmployeeEmploymentTab },
    { id: "organization", label: "Organization", icon: Building2, component: EmployeeOrganizationTab },
    { id: "attendance", label: "Attendance", icon: CalendarCheck, component: EmployeeAttendanceTab },
    { id: "leave", label: "Leave", icon: CalendarX, component: EmployeeLeaveTab },
    { id: "payroll", label: "Payroll", icon: PiggyBank, component: EmployeePayrollTab },
    { id: "performance", label: "Performance", icon: BarChart3, component: EmployeePerformanceTab },
    { id: "training", label: "Training", icon: BookOpen, component: EmployeeTrainingTab },
    { id: "assets", label: "Assets", icon: Monitor, component: EmployeeAssetsTab },
    { id: "calendar", label: "Calendar", icon: Calendar, component: EmployeeCalendarTab },
    { id: "schedule", label: "Schedule", icon: CalendarRange, component: EmployeeScheduleTab },
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "timeline", label: "Timeline", icon: History, component: WorkspaceTimelineTab },
    { id: "tasks", label: "Tasks", icon: ListChecks, component: WorkspaceTasksTab },
    { id: "notes", label: "Notes", icon: MessageSquare, component: WorkspaceNotesTab },
    { id: "activity", label: "Activity", icon: Activity, component: WorkspaceActivityTab },
  ];

  const title = person
    ? person.displayName || `${person.firstName || ""} ${person.lastName || ""}`
    : employee ? `${employee.employeeCode}` : "Loading...";

  const subtitle = employee
    ? `Employee • ${(employee.status || "").charAt(0).toUpperCase() + (employee.status || "").slice(1)}`
    : "";

  const badge = employee
    ? { label: (employee.status || "unknown").charAt(0).toUpperCase() + (employee.status || "unknown").slice(1), color: STATUS_COLORS[employee.status] || "bg-slate-400" }
    : undefined;

  return (
    <>
      <WorkspaceShell
        entityType="employee"
        entityId={employeeId || ""}
        entity={(employeeData || {}) as unknown as Record<string, unknown>}
        isLoading={!employeeData && !!employeeId}
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
        backLink={{ label: "Back to Employees", onClick: () => navigate("/employees") }}
        tabs={tabs}
        actions={actions}
        module="employee"
      />

      <ConfirmActionDialog open={showPromoteDialog} onClose={() => setShowPromoteDialog(false)} onConfirm={() => {}} title="Promote Employee" description={`Update designation or role for ${person?.displayName || title}?`} confirmLabel="Promote" variant="default" />
      <ConfirmActionDialog open={showTransferDialog} onClose={() => setShowTransferDialog(false)} onConfirm={() => {}} title="Transfer Employee" description={`Transfer ${person?.displayName || title} to another department or branch?`} confirmLabel="Transfer" variant="default" />
      <ConfirmActionDialog open={showSuspendDialog} onClose={() => setShowSuspendDialog(false)} onConfirm={() => {}} title="Suspend Employee" description="Are you sure you want to suspend this employee?" confirmLabel="Suspend" variant="destructive" />
      <ConfirmActionDialog open={showArchiveDialog} onClose={() => setShowArchiveDialog(false)} onConfirm={handleArchive} title="Archive Employee" description={`Archive ${person?.displayName || title}?`} confirmLabel="Archive" variant="destructive" />
    </>
  );
}
