import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  UserPlus,
  Target,
  Loader2,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: any }) {
  const priority = ["high", "critical"].includes(lead.priority) ? "Hot" : lead.priority === "medium" ? "Warm" : "Cold";
  const name = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—";
  const score = lead.score ?? 0;
  const priorityColors: Record<string, string> = {
    Hot: "text-rose-600 bg-rose-50 border-rose-200",
    Warm: "text-amber-600 bg-amber-50 border-amber-200",
    Cold: "text-blue-600 bg-blue-50 border-blue-200",
  };
  return (
    <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        priority === "Hot" ? "bg-rose-500" :
        priority === "Warm" ? "bg-amber-500" : "bg-blue-500"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 truncate">{name}</p>
        <p className="text-[10px] text-slate-400 truncate">{lead.source} • Score: {score}</p>
      </div>
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${
        priorityColors[priority] || "text-slate-600 bg-slate-50 border-slate-200"
      }`}>
        {priority}
      </span>
    </div>
  );
}

function TaskRow({ task }: { task: any }) {
  const statusLabel = ["completed", "done"].includes(task.status) ? "Completed"
    : ["in_progress", "open"].includes(task.status) ? "In Progress"
    : ["pending", "new"].includes(task.status) ? "Pending"
    : task.status;
  const statusColors: Record<string, string> = {
    Pending: "text-amber-600 bg-amber-50 border-amber-200",
    "In Progress": "text-blue-600 bg-blue-50 border-blue-200",
    Completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  };
  return (
    <div className="px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-800 truncate">{task.title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{task.taskType || task.type}</p>
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${
          statusColors[statusLabel] || "text-slate-600 bg-slate-50 border-slate-200"
        }`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

function NotificationItem({ notif }: { notif: any }) {
  const title = notif.title || notif.body || notif.message || "Notification";
  const message = notif.message || notif.body || "";
  const typeIcons: Record<string, React.ElementType> = {
    lead: UserPlus, admission: CheckCircle2, task: Clock,
    payment: undefined as any, meeting: Calendar, success: CheckCircle2,
    warning: AlertCircle, reminder: Clock,
  };
  const NIcon = typeIcons[notif.type] || Activity;
  return (
    <div className={`px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50/50 transition-colors ${!notif.isRead ? "bg-indigo-50/30" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        notif.type === "warning" ? "bg-amber-50" : notif.type === "success" ? "bg-emerald-50" : "bg-slate-50"
      }`}>
        {NIcon && <NIcon className={`w-3.5 h-3.5 ${
          notif.type === "warning" ? "text-amber-600" : notif.type === "success" ? "text-emerald-600" : "text-slate-600"
        }`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800">{title}</p>
        {message && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{message}</p>}
        <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(notif.createdAt), "MMM d, h:mm a")}</p>
      </div>
      {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
    </div>
  );
}

export default function DashboardCounselor() {
  const { user } = useAuth();
  const leadsResult = useQuery(api.crmLeads.listLeads, { assignedToMe: true });
  const allLeadsResult = useQuery(api.crmLeads.listLeads, {});
  const tasks = useQuery(api.tasks.listTasks, user?._id ? { assignedTo: user._id } : {});
  const notifications = useQuery(api.notifications.listNotifications, user?._id ? { userId: user._id, limit: 30 } : "skip");
  const activities = useQuery(api.timelineEngine.getRecentTimeline, { limit: 10 });
  const admissionsResult = useQuery(api.admissionEngine.listAdmissions, {});

  const leads = (leadsResult as any)?.items ?? [];
  const allLeads = (allLeadsResult as any)?.items ?? [];
  const admissions = Array.isArray(admissionsResult) ? admissionsResult : ((admissionsResult as any)?.items ?? []);

  const isLoading = !leadsResult || !allLeadsResult || !tasks || !notifications || !activities || !admissionsResult;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const hotLeads = leads.filter((l) => ["high", "critical", "Hot"].includes(l.priority)).length;
  const pendingTasks = tasks.filter((t) => !["Completed", "completed", "done", "cancelled"].includes(t.status)).length;
  const todayFollowUps = leads.filter((l) => ["New", "new", "fresh"].includes(l.status)).length;
  const counselorAdmissions = admissions.filter((a) => a.assignedToRole === "Counselor" || a.counselorId === user?._id || a.ownerId === user?._id).length;

  const stats = [
    { icon: Target, label: "Assigned Leads", value: leads.length, sub: `${hotLeads} Hot`, color: "bg-gradient-to-br from-violet-600 to-indigo-600" },
    { icon: Phone, label: "Today's Follow-ups", value: todayFollowUps, sub: "Needs attention", color: "bg-gradient-to-br from-cyan-600 to-blue-600" },
    { icon: TrendingUp, label: "My Admissions", value: counselorAdmissions, sub: `${admissions.filter(a => ["Enrolled", "enrolled", "admitted"].includes(a.status) && (a.assignedToRole === "Counselor" || a.counselorId === user?._id || a.ownerId === user?._id)).length} Enrolled`, color: "bg-gradient-to-br from-emerald-600 to-teal-600" },
    { icon: Clock, label: "Pending Tasks", value: pendingTasks, sub: `${tasks.filter(t => ["In Progress", "in_progress", "open"].includes(t.status)).length} In Progress`, color: "bg-gradient-to-br from-amber-600 to-orange-600" },
    { icon: Users, label: "Total Pipeline", value: allLeads.length, sub: `${allLeads.filter(l => ["high", "critical", "Hot"].includes(l.priority)).length} Hot across all`, color: "bg-gradient-to-br from-rose-600 to-pink-600" },
    { icon: MessageSquare, label: "New Leads Today", value: leads.filter(l => Date.now() - l.createdAt < 86400000).length, sub: "Last 24 hours", color: "bg-gradient-to-br from-sky-600 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Counselor Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.name || "User"}{user?.designation ? ` • ${user.designation}` : ""}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Leads */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">My Leads</h3>
            <span className="text-[10px] text-slate-400">{leads.length} total</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {leads.slice(0, 10).map((lead, i) => (
              <LeadRow key={i} lead={lead} />
            ))}
            {leads.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No assigned leads</div>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">My Tasks</h3>
            <span className="text-[10px] text-slate-400">{pendingTasks} pending</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {tasks.filter(t => !["Completed", "completed", "done", "cancelled"].includes(t.status)).slice(0, 8).map((task, i) => (
              <TaskRow key={i} task={task} />
            ))}
            {tasks.filter(t => !["Completed", "completed", "done", "cancelled"].includes(t.status)).length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No pending tasks</div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <span className="text-[10px] text-slate-400">{notifications.filter(n => !n.isRead).length} unread</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {notifications.slice(0, 8).map((notif, i) => (
              <NotificationItem key={i} notif={notif} />
            ))}
            {notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
