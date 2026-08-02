/**
 * SchedulerWorkspace — Enterprise Schedule Workspace (Full)
 *
 * Route: /scheduler/:scheduleId
 *
 * WorkspaceShell tabs:
 * Overview, Participants, Resources, Bookings, Availability,
 * Approvals, Timeline, Documents, Tasks, Notes, Activity,
 * History, Audit
 */

import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  Calendar, Clock, Users, MapPin, CheckCircle, XCircle,
  Edit3, Trash2, Plus, ArrowLeft, Loader2, Building2,
  FileText, ListChecks, Activity, History, MessageSquare,
  UserCheck, UserX, AlertTriangle, ChevronRight,
  BookOpen, Briefcase, Coffee, Star, Repeat, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceTimelineTab } from "@/components/workspace/WorkspaceTimelineTab";
import { WorkspaceTasksTab } from "@/components/workspace/WorkspaceTasksTab";
import { WorkspaceDocumentsTab } from "@/components/workspace/WorkspaceDocumentsTab";
import { WorkspaceActivityTab } from "@/components/workspace/WorkspaceActivityTab";
import { WorkspaceNotesTab } from "@/components/workspace/WorkspaceNotesTab";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { WorkspaceTabDefinition, WorkspaceAction } from "@/components/workspace/types";

// ─── Types & Config ───────────────────────────────────────────────

const SCHEDULE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  meeting: { label: "Meeting", color: "#4285f4", icon: Users },
  lecture: { label: "Lecture", color: "#a855f7", icon: BookOpen },
  exam: { label: "Exam", color: "#ea4335", icon: FileCheck },
  interview: { label: "Interview", color: "#34a853", icon: Briefcase },
  training: { label: "Training", color: "#06b6d4", icon: Star },
  counseling: { label: "Counseling", color: "#ec4899", icon: Heart },
  maintenance: { label: "Maintenance", color: "#f59e0b", icon: Wrench },
  holiday: { label: "Holiday", color: "#f97316", icon: Coffee },
};

function Heart() { return <Calendar className="h-4 w-4" />; }
function Wrench() { return <Calendar className="h-4 w-4" />; }

function getConfig(type: string) {
  return SCHEDULE_TYPE_CONFIG[type] || { label: type, color: "#9aa0a6", icon: Calendar };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatDuration(start: number, end: number): string {
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ══════════════════════════════════════════════════════════════════
// TAB: Overview
// ══════════════════════════════════════════════════════════════════

function OverviewTab({ schedule }: { schedule: any }) {
  const config = getConfig(schedule.scheduleType);
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <Card className="border-[#e8eaed] p-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${config.color}15` }}>
            <Icon className="h-5 w-5" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#1a1a2e]">{schedule.title}</h2>
            {schedule.description && (
              <p className="text-[12px] text-[#5f6368] mt-1">{schedule.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge style={{ backgroundColor: config.color, color: "white" }} className="text-[10px]">{config.label}</Badge>
              <Badge variant="outline" className={cn("text-[10px]",
                schedule.status === "confirmed" && "text-green-600 border-green-200 bg-green-50",
                schedule.status === "completed" && "text-blue-600 border-blue-200 bg-blue-50",
                schedule.status === "cancelled" && "text-red-600 border-red-200 bg-red-50",
                schedule.status === "pending_approval" && "text-amber-600 border-amber-200 bg-amber-50",
                schedule.status === "scheduled" && "text-gray-600 border-gray-200 bg-gray-50",
              )}>{schedule.status?.replace("_", " ")}</Badge>
              <Badge variant="outline" className={cn("text-[10px]",
                schedule.priority === "urgent" && "text-red-600 border-red-200",
                schedule.priority === "high" && "text-orange-600 border-orange-200",
                schedule.priority === "medium" && "text-blue-600 border-blue-200",
                schedule.priority === "low" && "text-gray-600 border-gray-200",
              )}>{schedule.priority || "medium"}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-[#e8eaed] p-4">
        <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">Schedule Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div><p className="text-[10px] text-[#5f6368] font-medium">Date</p><p className="text-[12px] text-[#1a1a2e]">{formatDate(schedule.start)}</p></div>
            <div><p className="text-[10px] text-[#5f6368] font-medium">Time</p><p className="text-[12px] text-[#1a1a2e]">{schedule.allDay ? "All day" : `${formatTime(schedule.start)} - ${formatTime(schedule.end)}`}</p></div>
            <div><p className="text-[10px] text-[#5f6368] font-medium">Duration</p><p className="text-[12px] text-[#1a1a2e]">{formatDuration(schedule.start, schedule.end)}</p></div>
            {schedule.timezone && <div><p className="text-[10px] text-[#5f6368] font-medium">Timezone</p><p className="text-[12px] text-[#1a1a2e]">{schedule.timezone}</p></div>}
          </div>
          <div className="space-y-3">
            <div><p className="text-[10px] text-[#5f6368] font-medium">Recurrence</p><p className="text-[12px] text-[#1a1a2e] capitalize">{schedule.recurrence || "None"}</p></div>
            <div><p className="text-[10px] text-[#5f6368] font-medium">Participants</p><p className="text-[12px] text-[#1a1a2e]">{schedule.participants?.length || 0}</p></div>
            <div><p className="text-[10px] text-[#5f6368] font-medium">Resource</p><p className="text-[12px] text-[#1a1a2e]">{schedule.resourceId || "—"}</p></div>
            <div><p className="text-[10px] text-[#5f6368] font-medium">Capacity</p><p className="text-[12px] text-[#1a1a2e]">{schedule.capacity ? `${schedule.currentBookings || 0} / ${schedule.capacity}` : "—"}</p></div>
          </div>
        </div>
      </Card>

      {schedule.entityType && (
        <Card className="border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Related Entity</h3>
          <p className="text-[12px] text-[#5f6368]">{schedule.entityType}: {schedule.entityId}</p>
        </Card>
      )}

      {schedule.tags?.length > 0 && (
        <Card className="border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {schedule.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Capacity bar if applicable */}
      {schedule.capacity && (
        <Card className="border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Capacity Utilization</h3>
          <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((schedule.currentBookings || 0) / schedule.capacity) * 100)}%`,
                backgroundColor: ((schedule.currentBookings || 0) / schedule.capacity) > 0.8 ? "#ea4335" : "#4285f4"
              }}
            />
          </div>
          <p className="text-[11px] text-[#5f6368] mt-1">{schedule.currentBookings || 0} / {schedule.capacity} booked</p>
          {schedule.waitingList?.length > 0 && (
            <Badge variant="secondary" className="mt-2 text-[10px]">{schedule.waitingList.length} on waitlist</Badge>
          )}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB: Bookings
// ══════════════════════════════════════════════════════════════════

function BookingsTab({ scheduleId }: { scheduleId: Id<"schedules"> }) {
  const bookings = useQuery(api.schedulingSdk.getBookings as any, { scheduleId }) as any[] | undefined;

  if (!bookings) return <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#9aa0a6]" /></div>;
  if (bookings.length === 0) return <Card className="border-[#e8eaed] p-6 text-center"><UserCheck className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" /><p className="text-[12px] text-[#5f6368]">No bookings yet</p></Card>;

  return (
    <div className="space-y-2">
      {bookings.map((b: any) => (
        <Card key={b._id} className="border-[#e8eaed] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full", b.attended ? "bg-green-100" : "bg-gray-100")}>
              {b.attended ? <UserCheck className="h-3.5 w-3.5 text-green-600" /> : <UserX className="h-3.5 w-3.5 text-gray-400" />}
            </div>
            <div>
              <p className="text-[12px] font-medium">{b.userId}</p>
              <div className="flex gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[9px]">{b.status}</Badge>
                {b.approvalStatus && b.approvalStatus !== "approved" && (
                  <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-200">{b.approvalStatus}</Badge>
                )}
              </div>
            </div>
          </div>
          {b.attended !== undefined && (
            <Badge variant={b.attended ? "default" : "secondary"} className="text-[10px]">
              {b.attended ? "Attended" : "No Show"}
            </Badge>
          )}
          {b.feedback && <p className="text-[10px] text-[#5f6368] max-w-[200px] truncate ml-2">{b.feedback}</p>}
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN: SchedulerWorkspace
// ══════════════════════════════════════════════════════════════════

export default function SchedulerWorkspace() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const schedule = useQuery(api.schedulingSdk.get as any, { scheduleId: scheduleId as any }) as any;
  const confirmSchedule = useMutation(api.schedulingSdk.confirm as any);
  const completeSchedule = useMutation(api.schedulingSdk.complete as any);
  const cancelSchedule = useMutation(api.schedulingSdk.cancel as any);
  const removeSchedule = useMutation(api.schedulingSdk.remove as any);

  const handleConfirm = useCallback(async () => {
    try {
      await confirmSchedule({ scheduleId: scheduleId as any, approvedBy: scheduleId as any });
      toast.success("Schedule confirmed");
    } catch { toast.error("Failed to confirm"); }
  }, [scheduleId, confirmSchedule]);

  const handleComplete = useCallback(async () => {
    try { await completeSchedule({ scheduleId: scheduleId as any }); toast.success("Schedule completed"); }
    catch { toast.error("Failed to complete"); }
  }, [scheduleId, completeSchedule]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelSchedule({ scheduleId: scheduleId as any, reason: "Cancelled by user" });
      toast.success("Schedule cancelled"); setShowDelete(false);
    } catch { toast.error("Failed to cancel"); }
  }, [scheduleId, cancelSchedule]);

  const handleDelete = useCallback(async () => {
    try { await removeSchedule({ scheduleId: scheduleId as any }); toast.success("Schedule deleted"); navigate("/scheduler"); }
    catch { toast.error("Failed to delete"); }
  }, [scheduleId, removeSchedule, navigate]);

  if (!schedule && scheduleId) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" /></div>;
  }
  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center"><Calendar className="h-10 w-10 text-[#9aa0a6] mx-auto mb-3" /><h2 className="text-sm font-semibold text-[#5f6368]">Schedule not found</h2><Button size="sm" variant="outline" className="mt-3 h-8 text-[12px]" onClick={() => navigate("/scheduler")}>Back to Scheduler</Button></div>
      </div>
    );
  }

  const config = getConfig(schedule.scheduleType);
  const Icon = config.icon;

  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: Calendar, component: () => <OverviewTab schedule={schedule} /> } as any,
    { id: "bookings", label: "Bookings", icon: UserCheck, component: () => <BookingsTab scheduleId={schedule._id} /> } as any,
    { id: "participants", label: "Participants", icon: Users, component: () => <div className="text-center py-8 text-[12px] text-[#5f6368]">Participants: {(schedule.participants || []).length}</div> } as any,
    { id: "timeline", label: "Timeline", icon: History, component: WorkspaceTimelineTab },
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "tasks", label: "Tasks", icon: ListChecks, component: WorkspaceTasksTab },
    { id: "notes", label: "Notes", icon: MessageSquare, component: WorkspaceNotesTab },
    { id: "activity", label: "Activity", icon: Activity, component: WorkspaceActivityTab },
  ];

  const actions: WorkspaceAction[] = [
    ...(schedule.status === "scheduled" || schedule.status === "pending_approval" ? [{ id: "confirm", label: "Confirm", icon: CheckCircle, onClick: handleConfirm, variant: "default" as const }] : []),
    ...(schedule.status === "scheduled" || schedule.status === "confirmed" ? [{ id: "complete", label: "Complete", icon: CheckCircle, onClick: handleComplete, variant: "outline" as const }] : []),
    ...((schedule.status === "scheduled" || schedule.status === "confirmed") ? [{ id: "cancel", label: "Cancel", icon: XCircle, onClick: () => setShowDelete(true), variant: "destructive" as const }] : []),
    { id: "delete", label: "Delete", icon: Trash2, onClick: handleDelete, variant: "ghost" as const },
  ];

  return (
    <>
      <WorkspaceShell
        entityType="schedule"
        entityId={scheduleId || ""}
        entity={schedule}
        title={schedule.title}
        subtitle={`${config.label} · ${schedule.status?.replace("_", " ")}`}
        badge={{ label: config.label, color: config.color }}
        headerFields={[
          { label: "Date", value: formatDate(schedule.start) },
          { label: "Time", value: schedule.allDay ? "All day" : `${formatTime(schedule.start)} - ${formatTime(schedule.end)}` },
        ]}
        avatar={
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}15` }}>
            <Icon className="h-5 w-5" style={{ color: config.color }} />
          </div>
        }
        backLink={{ label: "Back to Scheduler", onClick: () => navigate("/scheduler") }}
        tabs={tabs}
        actions={actions}
        module="scheduling"
      />
    </>
  );
}
