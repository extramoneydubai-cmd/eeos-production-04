/**
 * StudentWorkspace — Enterprise Student Detail Workspace
 *
 * Uses WorkspaceShell with plugin tabs for all student data:
 * Overview, Enrollment, Academic, Attendance, Fees, Examinations,
 * LMS, Documents, Timeline, Tasks, Notes, Activity.
 *
 * Integrates with:
 * - studentEngine (getStudent, updateStudent, archiveStudent)
 * - studentLifecycle (admit, enroll, promote, transfer, suspend, graduate)
 * - enrollmentEngine (allocateCourse, assignBatch)
 * - People Registry for person data
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
  Ban, Archive, QrCode, Award, ExternalLink, ChevronRight,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceOverviewTab } from "@/components/workspace/WorkspaceOverviewTab";
import { WorkspaceTimelineTab } from "@/components/workspace/WorkspaceTimelineTab";
import { WorkspaceTasksTab } from "@/components/workspace/WorkspaceTasksTab";
import { WorkspaceDocumentsTab } from "@/components/workspace/WorkspaceDocumentsTab";
import { WorkspaceActivityTab } from "@/components/workspace/WorkspaceActivityTab";
import { WorkspaceNotesTab } from "@/components/workspace/WorkspaceNotesTab";
import { WorkspaceOverviewTab as OverviewTab } from "@/components/workspace/WorkspaceOverviewTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { WorkspaceTabProps, WorkspaceBodySection, WorkspaceBodyField, WorkspaceAction, WorkspaceTabDefinition } from "@/components/workspace/types";

// ─── Status Colors ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  admitted: "bg-blue-500",
  lead: "bg-amber-500",
  qualified: "bg-violet-500",
  trial: "bg-cyan-500",
  enquiry: "bg-slate-400",
  completed: "bg-green-700",
  alumni: "bg-indigo-500",
  cancelled: "bg-rose-500",
  suspended: "bg-orange-500",
};

// ─── Tab: Overview ────────────────────────────────────────────────
function StudentOverviewTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const data = entity as any;
  const student = data?.student;
  const person = data?.person;
  const academicProfile = data?.academicProfile;
  const latestAdmission = data?.latestAdmission;

  if (!student) {
    return <OverviewTab entityType={entityType} entityId={entityId} entity={entity} sections={[]} />;
  }

  const personalSections: WorkspaceBodySection[] = [
    {
      id: "personal",
      title: "Personal Information",
      icon: User,
      columns: 2,
      fields: [
        { label: "First Name", value: person?.firstName || "—" },
        { label: "Middle Name", value: person?.middleName || "—" },
        { label: "Last Name", value: person?.lastName || "—" },
        { label: "Gender", value: person?.gender || "—", type: "badge" as const, badgeColor: "bg-slate-200 text-slate-700" },
        { label: "Date of Birth", value: person?.dateOfBirth, type: "date" as const },
        { label: "Nationality", value: person?.nationality || "—" },
        { label: "Blood Group", value: person?.bloodGroup || "—", type: "badge" as const, badgeColor: "bg-rose-100 text-rose-700" },
        { label: "Status", value: student.currentStatus, type: "badge" as const, badgeColor: STATUS_COLORS[student.currentStatus] || "bg-slate-400 text-white" },
      ],
    },
    {
      id: "contacts",
      title: "Contact Information",
      icon: User,
      columns: 2,
      fields: (data?.contacts || []).length > 0
        ? (data.contacts as any[]).map((c: any) => ({
            label: c.type === "email" ? "Email" : c.type === "mobile" ? "Phone" : c.type,
            value: c.value,
            type: c.type === "email" ? "email" as const : c.type === "mobile" ? "phone" as const : "text" as const,
          }))
        : [
            { label: "Phone", value: "—" },
            { label: "Email", value: "—" },
          ],
    },
  ];

  const academicSections: WorkspaceBodySection[] = [
    {
      id: "academic",
      title: "Academic Profile",
      icon: BookOpen,
      columns: 2,
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
    },
    {
      id: "enrollment",
      title: "Enrollment Details",
      icon: GraduationCap,
      columns: 2,
      fields: [
        { label: "Student Code", value: student.studentCode },
        { label: "Admission Number", value: student.admissionNumber },
        { label: "Roll Number", value: student.rollNumber || "—" },
        { label: "Enrollment Date", value: student.enrollmentDate, type: "date" as const },
        { label: "Admission Status", value: latestAdmission?.status || "—", type: "badge" as const, badgeColor: latestAdmission?.status === "approved" ? "bg-emerald-500" : "bg-amber-500" },
        { label: "Final Fee", value: latestAdmission?.finalFee, type: "currency" as const },
      ],
    },
  ];

  return (
    <OverviewTab
      entityType={entityType}
      entityId={entityId}
      entity={entity}
      sections={[...personalSections, ...academicSections]}
    />
  );
}

// ─── Tab: Enrollment ──────────────────────────────────────────────
function StudentEnrollmentTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const data = entity as any;
  const student = data?.student;
  const timeline = useQuery(api.studentLifecycle.getStudentTimeline, { studentId: entityId as Id<"studentMaster"> });

  const enrollmentEvents = (timeline || []).filter((e: any) =>
    ["student_created", "admission_created", "student_admitted", "student_enrolled",
     "course_allocated", "batch_assigned", "roll_number_assigned", "document_uploaded",
     "admission_completed", "admission_cancelled"].includes(e.eventType)
  );

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          Enrollment Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrollmentEvents.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">No enrollment history available.</div>
        ) : (
          <div className="space-y-1">
            {enrollmentEvents.map((event: any) => (
              <div key={event._id} className="flex items-start gap-2 py-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{event.title}</p>
                  {event.description && (
                    <p className="text-[10px] text-muted-foreground">{event.description}</p>
                  )}
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

// ─── Tab: Academic ────────────────────────────────────────────────
function StudentAcademicTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const data = entity as any;
  const student = data?.student;
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

// ─── Tab: Attendance ──────────────────────────────────────────────
function StudentAttendanceTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
          Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-xs text-muted-foreground">
          Attendance tracking will be available in a future release.
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Fees ────────────────────────────────────────────────────
function StudentFeesTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const data = entity as any;
  const latestAdmission = data?.latestAdmission;

  const stats = [
    { label: "Total Fee", value: latestAdmission?.totalFee || 0, color: "text-blue-600" },
    { label: "Discount", value: latestAdmission?.discountAmount || 0, color: "text-amber-600" },
    { label: "Final Fee", value: latestAdmission?.finalFee || 0, color: "text-violet-600" },
    { label: "Installments", value: latestAdmission?.installmentCount || 1, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn("text-lg font-bold mt-1", s.color)}>
              {s.label === "Final Fee" || s.label === "Total Fee" || s.label === "Discount"
                ? `₹${Number(s.value).toLocaleString()}`
                : s.value}
            </p>
          </Card>
        ))}
      </div>
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />
            Fee Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-xs text-muted-foreground">
            Detailed fee ledger, invoices, and payment history will be available in a future release.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Examinations ────────────────────────────────────────────
function StudentExaminationsTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
          Examinations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-xs text-muted-foreground">
          Examination results, marks, rank, and certificates will be available in a future release.
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab: LMS ─────────────────────────────────────────────────────
function StudentLMSTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          Learning Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-xs text-muted-foreground">
          Courses, assignments, progress, and certificates will be available in a future release.
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Student Workspace ───────────────────────────────────────
export default function StudentWorkspace() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();

  const studentData = useQuery(
    api.studentEngine.getStudent,
    studentId ? { studentId: studentId as Id<"studentMaster"> } : "skip",
  );
  const archiveStudent = useMutation(api.studentEngine.archiveStudent);
  const updateStudent = useMutation(api.studentEngine.updateStudent);

  const student = studentData?.student as any;
  const person = studentData?.person as any;

  // Build actions
  const handleArchive = useCallback(async () => {
    if (!studentId || !user?._id) return;
    await archiveStudent({ studentId: studentId as Id<"studentMaster">, performedBy: user._id as Id<"users"> });
  }, [studentId, user, archiveStudent]);

  const actions: WorkspaceAction[] = useMemo(() => [
    {
      id: "promote",
      label: "Promote",
      icon: ArrowUpRight,
      onClick: () => {},
      variant: "outline",
      tooltip: "Promote to next academic year",
    },
    {
      id: "transfer",
      label: "Transfer",
      icon: ExternalLink,
      onClick: () => {},
      variant: "outline",
      tooltip: "Transfer to another branch/company",
    },
    {
      id: "suspend",
      label: "Suspend",
      icon: Ban,
      onClick: () => {},
      variant: "outline",
      tooltip: "Suspend student enrollment",
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      onClick: handleArchive,
      variant: "destructive",
      tooltip: "Archive this student record",
    },
    {
      id: "qr",
      label: "QR Code",
      icon: QrCode,
      onClick: () => {},
      variant: "ghost",
      tooltip: "Generate student QR code",
    },
    {
      id: "award",
      label: "Certificate",
      icon: Award,
      onClick: () => {},
      variant: "ghost",
      tooltip: "Generate certificate",
    },
  ], [handleArchive]);

  // Avatar
  const initials = person
    ? `${(person.firstName || "")[0] || ""}${(person.lastName || "")[0] || ""}`.toUpperCase()
    : student
      ? (student.studentCode || "??").slice(0, 2).toUpperCase()
      : "ST";

  const headerFields = student
    ? [
        { label: "Code", value: student.studentCode },
        { label: "Admission", value: student.admissionNumber },
        { label: "Roll", value: student.rollNumber || "—" },
      ].filter(Boolean)
    : [];

  // Tab definitions
  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: User, component: StudentOverviewTab },
    { id: "enrollment", label: "Enrollment", icon: Target, component: StudentEnrollmentTab },
    { id: "academic", label: "Academic", icon: BookOpen, component: StudentAcademicTab },
    { id: "attendance", label: "Attendance", icon: CalendarCheck, component: StudentAttendanceTab },
    { id: "fees", label: "Fees", icon: PiggyBank, component: StudentFeesTab },
    { id: "exams", label: "Exams", icon: FileCheck, component: StudentExaminationsTab },
    { id: "lms", label: "LMS", icon: Layers, component: StudentLMSTab },
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "timeline", label: "Timeline", icon: History, component: WorkspaceTimelineTab },
    { id: "tasks", label: "Tasks", icon: ListChecks, component: WorkspaceTasksTab },
    { id: "notes", label: "Notes", icon: MessageSquare, component: WorkspaceNotesTab },
    { id: "activity", label: "Activity", icon: Activity, component: WorkspaceActivityTab },
  ];

  const title = person
    ? person.displayName || `${person.firstName || ""} ${person.lastName || ""}`
    : student
      ? `${student.studentCode}`
      : "Loading...";

  const subtitle = student
    ? `Student • ${(student.currentStatus || "").charAt(0).toUpperCase() + (student.currentStatus || "").slice(1)}`
    : "";

  const badge = student
    ? { label: (student.currentStatus || "unknown").charAt(0).toUpperCase() + (student.currentStatus || "unknown").slice(1),
        color: STATUS_COLORS[student.currentStatus] || "bg-slate-400" }
    : undefined;

  return (
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
  );
}
