import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  BookOpen,
  Users,
  CheckSquare,
  Clock,
  Calendar,
  GraduationCap,
  BarChart3,
  TrendingUp,
  Loader2,
  Activity,
  AlertCircle,
  CheckCircle2,
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

function StudentRow({ student }: { student: any }) {
  const dotColor =
    student.attendance >= 90 ? "bg-emerald-500" :
    student.attendance >= 75 ? "bg-amber-500" : "bg-rose-500";

  const perfColor =
    student.performance >= 85 ? "text-emerald-600" :
    student.performance >= 70 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 truncate">{student.name}</p>
        <p className="text-[10px] text-slate-400">Grade {student.grade} &bull; Section {student.section}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-xs font-medium ${perfColor}`}>
          {student.performance}%
        </p>
        <p className="text-[10px] text-slate-400">Perf.</p>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: any }) {
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
          <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{task.taskType}</p>
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${
          statusColors[task.status] || "text-slate-600 bg-slate-50 border-slate-200"
        }`}>
          {task.status}
        </span>
      </div>
    </div>
  );
}

export default function DashboardFaculty() {
  const { user } = useAuth();
  const demoProfile = useQuery(api.demo.queries.getCurrentDemoProfile);
  const students = useQuery(api.demo.queries.getAllStudents);
  const tasks = useQuery(api.demo.queries.getTasksForRole, { role: "Faculty" });
  const notifications = useQuery(api.demo.queries.getNotificationsForRole, { role: "Faculty" });
  const activities = useQuery(api.demo.queries.getActivities);

  const isLoading = !demoProfile || !students || !tasks || !notifications || !activities;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const activeStudents = students.filter((s) => s.status === "Active").length;
  const atRiskStudents = students.filter((s) => s.status === "At Risk").length;
  const avgAttendance = Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length);
  const avgPerformance = Math.round(students.reduce((sum, s) => sum + s.performance, 0) / students.length);
  const pendingTasks = tasks.filter((t) => t.status !== "Completed").length;

  const stats = [
    { icon: BookOpen, label: "Total Students", value: students.length, sub: activeStudents + " Active", color: "bg-gradient-to-br from-emerald-600 to-teal-600" },
    { icon: Users, label: "At Risk", value: atRiskStudents, sub: "Needs intervention", color: "bg-gradient-to-br from-rose-600 to-pink-600" },
    { icon: TrendingUp, label: "Avg Attendance", value: avgAttendance + "%", sub: "All classes", color: "bg-gradient-to-br from-blue-600 to-cyan-600" },
    { icon: BarChart3, label: "Avg Performance", value: avgPerformance + "%", sub: "All subjects", color: "bg-gradient-to-br from-violet-600 to-indigo-600" },
    { icon: CheckSquare, label: "Assignments", value: pendingTasks, sub: "Pending grading", color: "bg-gradient-to-br from-amber-600 to-orange-600" },
    { icon: GraduationCap, label: "Classes Today", value: "3", sub: "Grade 12, 11, 10", color: "bg-gradient-to-br from-sky-600 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Faculty Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {demoProfile?.fullName || user?.name || "User"} &bull; {demoProfile?.designation}
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
        {/* My Students */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">My Students</h3>
            <span className="text-[10px] text-slate-400">{students.length} total</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {students.slice(0, 10).map((student, i) => (
              <StudentRow key={i} student={student} />
            ))}
            {students.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No students assigned</div>
            )}
          </div>
        </div>

        {/* Tasks & Assignments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Tasks &amp; Assignments</h3>
            <span className="text-[10px] text-slate-400">{pendingTasks} pending</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {tasks.filter(t => t.status !== "Completed").slice(0, 8).map((task, i) => (
              <TaskRow key={i} task={task} />
            ))}
            {tasks.filter(t => t.status !== "Completed").length === 0 && (
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
            {notifications.slice(0, 8).map((notif, i) => {
              const typeIcons: Record<string, React.ElementType> = {
                academic: BookOpen, warning: AlertCircle, success: CheckCircle2,
                enrollment: Users, meeting: Calendar, reminder: Clock,
              };
              const NIcon = typeIcons[notif.type] || Activity;
              return (
                <div key={i} className={"px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50/50 transition-colors " + (!notif.isRead ? "bg-indigo-50/30" : "")}>
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center shrink-0 " + (notif.type === "warning" ? "bg-amber-50" : "bg-emerald-50")}>
                    <NIcon className={"w-3.5 h-3.5 " + (notif.type === "warning" ? "text-amber-600" : "text-emerald-600")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800">{notif.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(notif.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                  {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                </div>
              );
            })}
            {notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
