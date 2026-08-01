import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  Users,
  Target,
  TrendingUp,
  DollarSign,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Activity,
  BarChart3,
  Briefcase,
  Loader2,
  Code2,
  Settings,
  Building2,
  Database,
  ArrowRight,
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

function RecentActivity({ activities }: { activities: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
        {activities?.slice(0, 10).map((a, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 truncate">
                {a.action || a.eventType || a.type || "Event"}
                <span className="text-slate-400"> — {a.entity || a.module || "system"}</span>
              </p>
              <p className="text-[10px] text-slate-400">
                {a.userName || a.actor || a.userId || "System"} •{" "}
                {format(new Date(a.createdAt || a.recordedAt || Date.now()), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        ))}
        {(!activities || activities.length === 0) && (
          <div className="px-4 py-6 text-center text-xs text-slate-400">No recent activity</div>
        )}
      </div>
    </div>
  );
}

function TasksList({ tasks }: { tasks: any[] }) {
  const statusColors: Record<string, string> = {
    open: "text-amber-600 bg-amber-50 border-amber-200",
    pending: "text-amber-600 bg-amber-50 border-amber-200",
    in_progress: "text-blue-600 bg-blue-50 border-blue-200",
    completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  };

  const label = (s?: string) =>
    s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">My Tasks</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
        {tasks?.slice(0, 8).map((t, i) => (
          <div key={i} className="px-4 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{t.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                  {t.priority || "normal"} • {t.dueDate ? format(new Date(t.dueDate), "MMM d") : "no due date"}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${
                statusColors[t.status] || "text-slate-600 bg-slate-50 border-slate-200"
              }`}>
                {label(t.status)}
              </span>
            </div>
          </div>
        ))}
        {(!tasks || tasks.length === 0) && (
          <div className="px-4 py-6 text-center text-xs text-slate-400">No tasks assigned</div>
        )}
      </div>
    </div>
  );
}

function NotificationsList({ notifications }: { notifications: any[] }) {
  const typeIcons: Record<string, React.ElementType> = {
    lead: UserPlus, admission: CheckCircle2, task: Clock,
    payment: DollarSign, meeting: Calendar, system: Activity,
    enrollment: Users, payroll: Briefcase, report: BarChart3,
    hr: Users, success: CheckCircle2, academic: TrendingUp,
    warning: AlertCircle, reminder: Clock,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
        {notifications?.slice(0, 6).map((n, i) => {
          const NIcon = typeIcons[n.type] || Activity;
          return (
            <div key={i} className={`px-4 py-2.5 flex items-start gap-2.5 ${!n.isRead ? "bg-indigo-50/30" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                n.type === "warning" ? "bg-amber-50" : n.type === "success" ? "bg-emerald-50" : "bg-slate-50"
              }`}>
                <NIcon className={`w-3.5 h-3.5 ${
                  n.type === "warning" ? "text-amber-600" : n.type === "success" ? "text-emerald-600" : "text-slate-600"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800">{n.title || n.message || "Notification"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {format(new Date(n.createdAt || Date.now()), "MMM d, h:mm a")}
                </p>
              </div>
              {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
            </div>
          );
        })}
        {(!notifications || notifications.length === 0) && (
          <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardCEO() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const userId = user?._id as string | undefined;

  const leads = useQuery(api.crmLeads.listLeads, {})?.items;
  const students = useQuery(api.studentEngine.listStudents, userId ? { userId: userId as any } : "skip")?.items;
  const financeKpis = useQuery(api.financePlatform.getFinanceDashboardKPIs);
  const tasks = useQuery(api.tasks.listTasks, userId ? { assignedTo: userId as any } : "skip");
  const notifications = useQuery(api.notifications.listNotifications, userId ? { userId: userId as any, limit: 20 } : "skip");
  const activities = useQuery(api.timelineEngine.getModuleTimeline, { module: "dashboard", limit: 10 });

  const isLoading = !leads || !students || !financeKpis;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const totalRevenue = financeKpis?.totalRevenue || 0;
  const totalCollected = financeKpis?.totalPaid || 0;
  const hotLeads = leads?.filter((l) => l.priority === "high" || l.priority === "critical").length || 0;
  const activeStudents = students?.filter((s) => s.status === "active" || s.status === "Active").length || 0;
  const pendingTasks = tasks?.filter((t) => t.status !== "completed").length || 0;
  const unreadNotifs = notifications?.filter((n) => !n.isRead).length || 0;
  const collectionRate = financeKpis?.collectionRate || 0;

  const stats = [
    { icon: Users, label: "Total Students", value: students?.length || 0, sub: `${activeStudents} Active`, color: "bg-gradient-to-br from-blue-600 to-cyan-600" },
    { icon: Target, label: "Total Leads", value: leads?.length || 0, sub: `${hotLeads} Hot`, color: "bg-gradient-to-br from-violet-600 to-indigo-600" },
    { icon: TrendingUp, label: "Collection Rate", value: `${collectionRate}%`, sub: `${financeKpis?.invoiceCount || 0} invoices`, color: "bg-gradient-to-br from-emerald-600 to-teal-600" },
    { icon: DollarSign, label: "Revenue (AED)", value: totalRevenue.toLocaleString(), sub: `${totalCollected.toLocaleString()} Collected`, color: "bg-gradient-to-br from-amber-600 to-orange-600" },
    { icon: AlertCircle, label: "Outstanding", value: (financeKpis?.totalOutstanding || 0).toLocaleString(), sub: `${financeKpis?.overdueAmount || 0} overdue`, color: "bg-gradient-to-br from-rose-600 to-pink-600" },
    { icon: CheckCircle2, label: "Pending Tasks", value: pendingTasks, sub: `${unreadNotifs} Unread notifications`, color: "bg-gradient-to-br from-sky-600 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {user?.name || "CEO"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.role === "super_admin" ? "Super Admin" : user?.role || "Leadership"} • Enterprise Control Center
          </p>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Quick Access</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/platform-studio")}
            className="flex items-center gap-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 transition-all group text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-900">Platform Studio</p>
              <p className="text-[11px] text-indigo-600/70 truncate">Developer Intelligence System</p>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            onClick={() => navigate("/control")}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all group text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Control Center</p>
              <p className="text-[11px] text-slate-500 truncate">Create users, teams, broadcast</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            onClick={() => navigate("/org")}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all group text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Organization Studio</p>
              <p className="text-[11px] text-slate-500 truncate">Departments, teams, hierarchy</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            onClick={() => navigate("/studios/master-data")}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all group text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Master Data Studio</p>
              <p className="text-[11px] text-slate-500 truncate">CRUD for all master entities</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
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
        <div className="lg:col-span-1">
          <RecentActivity activities={activities} />
        </div>
        <div className="lg:col-span-1">
          <TasksList tasks={tasks} />
        </div>
        <div className="lg:col-span-1">
          <NotificationsList notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
