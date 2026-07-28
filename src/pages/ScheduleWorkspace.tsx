/**
 * ScheduleWorkspace — Enterprise Schedule Workspace
 *
 * Route: /scheduling/:scheduleId
 *
 * Uses WorkspaceShell pattern with tabs:
 * Overview, Participants, Resources, Availability, Bookings,
 * Timeline, Documents, Tasks, Notes, Activity, History, Audit
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Repeat,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
  Loader2,
  Building2,
  FileText,
  ListChecks,
  Activity,
  History,
  BookOpen,
  MessageSquare,
  ChevronRight,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────

type TabId = "overview" | "participants" | "resources" | "availability" | "bookings" | "timeline" | "documents" | "tasks" | "notes" | "activity" | "history" | "audit";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Calendar },
  { id: "participants", label: "Participants", icon: Users },
  { id: "resources", label: "Resources", icon: Building2 },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "bookings", label: "Bookings", icon: UserCheck },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "notes", label: "Notes", icon: MessageSquare },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "history", label: "History", icon: History },
  { id: "audit", label: "Audit", icon: FileText },
];

const SCHEDULE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  meeting: { label: "Meeting", color: "#4285f4" },
  lecture: { label: "Lecture", color: "#a855f7" },
  exam: { label: "Exam", color: "#ea4335" },
  interview: { label: "Interview", color: "#34a853" },
  training: { label: "Training", color: "#06b6d4" },
  counseling: { label: "Counseling", color: "#ec4899" },
  maintenance: { label: "Maintenance", color: "#f59e0b" },
  holiday: { label: "Holiday", color: "#f97316" },
  custom: { label: "Custom", color: "#9aa0a6" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatDuration(start: number, end: number): string {
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ─── Overview Tab ────────────────────────────────────────────────

function OverviewTab({ schedule }: { schedule: any }) {
  const config = SCHEDULE_TYPE_CONFIG[schedule.scheduleType] || { label: schedule.scheduleType, color: "#9aa0a6" };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <Card className="border-[#e8eaed] p-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${config.color}15` }}>
            <Calendar className="h-5 w-5" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#1a1a2e]">{schedule.title}</h2>
            {schedule.description && (
              <p className="text-[12px] text-[#5f6368] mt-1">{schedule.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]" style={{ color: config.color, borderColor: `${config.color}40` }}>
                {config.label}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]",
                schedule.status === "confirmed" && "text-green-600 border-green-200 bg-green-50",
                schedule.status === "completed" && "text-blue-600 border-blue-200 bg-blue-50",
                schedule.status === "cancelled" && "text-red-600 border-red-200 bg-red-50",
                schedule.status === "pending_approval" && "text-amber-600 border-amber-200 bg-amber-50",
                schedule.status === "scheduled" && "text-gray-600 border-gray-200 bg-gray-50",
              )}>
                {schedule.status?.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <Card className="border-[#e8eaed] p-4">
        <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">Schedule Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-[#5f6368] font-medium">Date</p>
              <p className="text-[12px] text-[#1a1a2e]">{formatDate(schedule.start)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5f6368] font-medium">Time</p>
              <p className="text-[12px] text-[#1a1a2e]">
                {schedule.allDay ? "All day" : `${formatTime(schedule.start)} - ${formatTime(schedule.end)}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#5f6368] font-medium">Duration</p>
              <p className="text-[12px] text-[#1a1a2e]">{formatDuration(schedule.start, schedule.end)}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-[#5f6368] font-medium">Priority</p>
              <Badge variant="outline" className={cn("text-[10px] mt-0.5",
                schedule.priority === "urgent" && "text-red-600 border-red-200",
                schedule.priority === "high" && "text-orange-600 border-orange-200",
                schedule.priority === "medium" && "text-blue-600 border-blue-200",
                schedule.priority === "low" && "text-gray-600 border-gray-200",
              )}>{schedule.priority || "medium"}</Badge>
            </div>
            <div>
              <p className="text-[10px] text-[#5f6368] font-medium">Recurrence</p>
              <p className="text-[12px] text-[#1a1a2e] capitalize">{schedule.recurrence || "None"}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5f6368] font-medium">Participants</p>
              <p className="text-[12px] text-[#1a1a2e]">{schedule.participants?.length || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Capacity & Bookings */}
      {schedule.capacity && (
        <Card className="border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">Capacity</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#5f6368]">Booked</span>
                <span className="font-medium">{schedule.currentBookings || 0} / {schedule.capacity}</span>
              </div>
              <div className="h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((schedule.currentBookings || 0) / schedule.capacity) * 100)}%` }} />
              </div>
            </div>
            {schedule.waitingList?.length > 0 && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {schedule.waitingList.length} waiting
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Tags */}
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

      {/* Related Entity */}
      {schedule.entityType && schedule.entityId && (
        <Card className="border-[#e8eaed] p-4">
          <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Related Entity</h3>
          <p className="text-[12px] text-[#5f6368]">Type: {schedule.entityType} | ID: {schedule.entityId}</p>
        </Card>
      )}
    </div>
  );
}

// ─── Participants Tab ────────────────────────────────────────────

function ParticipantsTab({ schedule }: { schedule: any }) {
  const participants = schedule.participants || [];
  return (
    <Card className="border-[#e8eaed] p-4">
      <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">
        Participants ({participants.length})
      </h3>
      {participants.length === 0 ? (
        <p className="text-[12px] text-[#5f6368]">No participants added</p>
      ) : (
        <div className="space-y-2">
          {participants.map((pid: string) => (
            <div key={pid} className="flex items-center gap-2 p-2 rounded-md bg-[#f8f9fa]">
              <Users className="h-3.5 w-3.5 text-[#5f6368]" />
              <span className="text-[12px] text-[#1a1a2e]">{pid}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Main Workspace ──────────────────────────────────────────────

export default function ScheduleWorkspace() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Fetch schedule
  const schedule = useQuery(api.schedulingSdk.get as any, { scheduleId: scheduleId as any });
  const bookings = useQuery(api.schedulingSdk.getBookings as any, { scheduleId: scheduleId as any });
  const cancelSchedule = useMutation(api.schedulingSdk.cancel as any);
  const completeSchedule = useMutation(api.schedulingSdk.complete as any);

  const isLoading = schedule === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Calendar className="h-10 w-10 text-[#9aa0a6] mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-[#5f6368]">Schedule not found</h2>
          <Button size="sm" variant="outline" className="mt-3 h-8 text-[12px]" onClick={() => navigate("/scheduling")}>
            Back to Scheduling
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab schedule={schedule} />;
      case "participants": return <ParticipantsTab schedule={schedule} />;
      case "resources": return <Card className="border-[#e8eaed] p-4"><p className="text-[12px] text-[#5f6368]">Resource details</p></Card>;
      case "availability": return <Card className="border-[#e8eaed] p-4"><p className="text-[12px] text-[#5f6368]">Availability view</p></Card>;
      case "bookings":
        return (
          <div className="space-y-3">
            {(!bookings || bookings.length === 0) ? (
              <Card className="border-[#e8eaed] p-4">
                <p className="text-[12px] text-[#5f6368]">No bookings yet</p>
              </Card>
            ) : (
              bookings.map((b: any) => (
                <Card key={b._id} className="border-[#e8eaed] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-green-500" />
                    <div>
                      <p className="text-[12px] font-medium">{b.userId}</p>
                      <Badge variant="outline" className="text-[9px]">{b.status}</Badge>
                    </div>
                  </div>
                  {b.attended !== undefined && (
                    <Badge variant={b.attended ? "default" : "secondary"} className="text-[9px]">
                      {b.attended ? "Attended" : "No Show"}
                    </Badge>
                  )}
                </Card>
              ))
            )}
          </div>
        );
      default: return <Card className="border-[#e8eaed] p-4"><p className="text-[12px] text-[#5f6368]">Tab content coming soon</p></Card>;
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/scheduling")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-[#1a1a2e]">{schedule.title}</h1>
            <p className="text-[11px] text-[#5f6368] mt-0.5">
              {formatDate(schedule.start)} · {schedule.allDay ? "All day" : `${formatTime(schedule.start)} - ${formatTime(schedule.end)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {schedule.status === "scheduled" && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] text-green-600" onClick={() => {
              completeSchedule({ scheduleId: schedule._id }).then(() => toast.success("Schedule completed"));
            }}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
            </Button>
          )}
          {(schedule.status === "scheduled" || schedule.status === "confirmed") && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] text-red-600" onClick={() => setShowDelete(true)}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setShowEdit(true)}>
            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex overflow-x-auto gap-1 pb-1 border-b border-[#e8eaed]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-all -mb-[1px]",
                activeTab === tab.id
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-[#5f6368] hover:text-[#1a1a2e]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {renderTabContent()}
      </motion.div>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Cancel Schedule</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this schedule?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDelete(false)} className="text-[12px] h-8">No, keep it</Button>
            <Button size="sm" onClick={() => {
              cancelSchedule({ scheduleId: schedule._id, reason: "Cancelled by user" }).then(() => {
                toast.success("Schedule cancelled");
                setShowDelete(false);
              });
            }} className="text-[12px] h-8 bg-red-500 hover:bg-red-600">Cancel Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
