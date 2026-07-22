import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
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
              <p className="text-xs text-slate-700 truncate">{a.action} <span className="text-slate-400">— {a.entity}</span></p>
              <p className="text-[10px] text-slate-400">{a.userName} • {format(new Date(a.createdAt), "MMM d, h:mm a")}</p>
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
    Pending: "text-amber-600 bg-amber-50 border-amber-200",
    "In Progress": "text-blue-600 bg-blue-50 border-blue-200",
    Completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">All Tasks</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
        {tasks?.slice(0, 8).map((t, i) => (
          <div key={i} className="px-4 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{t.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{t.taskType} • {t.assignedToRole}</p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${
                statusColors[t.status] || "text-slate-600 bg-slate-50 border-slate-200"
              }`}>
                {t.status}
              </span>
            </div>
          </div>
        ))}
        {(!tasks || tasks.length === 0) && (
          <div className="px-4 py-6 text-center text-xs text-slate-400">No tasks</div>
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
                <p className="text-xs font-medium text-slate-800">{n.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {format(new Date(n.createdAt), "MMM d, h:mm a")}
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
  const leads = useQuery(api.demo.queries.getAllLeads);
  const students = useQuery(api.demo.queries.getAllStudents);
  const admissions = useQuery(api.demo.queries.getAdmissions);
  const tasks = useQuery(api.demo.queries.getAllTasks);
  const notifications = useQuery(api.demo.queries.getAllNotifications);
  const activities = useQuery(api.demo.queries.getActivities);
  const demoProfile = useQuery(api.demo.queries.getCurrentDemoProfile);

  const isLoading = !leads || !students || !admissions || !tasks || !notifications || !activities || !demoProfile;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const totalRevenue = admissions?.reduce((sum, a) => sum + a.feeQuoted, 0) || 0;
  const totalCollected = admissions?.reduce((sum, a) => sum + a.feePaid, 0) || 0;
  const hotLeads = leads?.filter((l) => l.priority === "Hot").length || 0;
  const activeStudents = students?.filter((s) => s.status === "Active").length || 0;
  const pendingTasks = tasks?.filter((t) => t.status !== "Completed").length || 0;
  const unreadNotifs = notifications?.filter((n) => !n.isRead).length || 0;

  const stats = [
    { icon: Users, label: "Total Students", value: students?.length || 0, sub: `${activeStudents} Active`, color: "bg-gradient-to-br from-blue-600 to-cyan-600" },
    { icon: Target, label: "Total Leads", value: leads?.length || 0, sub: `${hotLeads} Hot`, color: "bg-gradient-to-br from-violet-600 to-indigo-600" },
    { icon: TrendingUp, label: "Admissions", value: admissions?.length || 0, sub: `${admissions?.filter(a => a.status === "Enrolled").length || 0} Enrolled`, color: "bg-gradient-to-br from-emerald-600 to-teal-600" },
    { icon: DollarSign, label: "Revenue (AED)", value: totalRevenue.toLocaleString(), sub: `${totalCollected.toLocaleString()} Collected`, color: "bg-gradient-to-br from-amber-600 to-orange-600" },
    { icon: UserPlus, label: "Hot Leads", value: hotLeads, sub: "Needs immediate attention", color: "bg-gradient-to-br from-rose-600 to-pink-600" },
    { icon: CheckCircle2, label: "Pending Tasks", value: pendingTasks, sub: `${unreadNotifs} Unread notifications`, color: "bg-gradient-to-br from-sky-600 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {demoProfile?.fullName || user?.name || "User"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {demoProfile?.designation} • {demoProfile?.demoRole}
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
