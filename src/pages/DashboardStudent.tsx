import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  BarChart3,
  Clock,
  TrendingUp,
  GraduationCap,
  Loader2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Award,
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

function SubjectCard({ name, grade, score }: { name: string; grade: string; score: number }) {
  const getGradeColor = (s: number) => {
    if (s >= 90) return "text-emerald-600";
    if (s >= 75) return "text-blue-600";
    if (s >= 60) return "text-amber-600";
    return "text-rose-600";
  };
  const getBarColor = (s: number) => {
    if (s >= 90) return "bg-emerald-500";
    if (s >= 75) return "bg-blue-500";
    if (s >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-slate-800">{name}</p>
        <span className={`text-xs font-bold ${getGradeColor(score)}`}>{grade}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${getBarColor(score)} transition-all`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-[10px] text-slate-500 font-medium">{score}%</span>
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
          <p className="text-[10px] text-slate-400 mt-0.5">{task.taskType}</p>
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

export default function DashboardStudent() {
  const { user } = useAuth();
  const demoProfile = useQuery(api.demo.queries.getCurrentDemoProfile);
  const students = useQuery(api.demo.queries.getAllStudents);
  const tasks = useQuery(api.demo.queries.getAllTasks);
  const notifications = useQuery(api.demo.queries.getAllNotifications);

  const isLoading = !demoProfile || !students || !tasks || !notifications;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Find "Aisha Khan" as the demo student
  const myProfile = students.find((s) => s.name === "Aisha Khan");
  const myAttendance = myProfile?.attendance || 0;
  const myPerformance = myProfile?.performance || 0;
  const pendingHomework = tasks.filter((t) =>
    (t.taskType === "Academic" || t.taskType === "Assignment" || t.taskType === "Homework") &&
    t.status !== "Completed"
  ).length;
  const completedHomework = tasks.filter((t) =>
    (t.taskType === "Academic" || t.taskType === "Assignment" || t.taskType === "Homework") &&
    t.status === "Completed"
  ).length;
  const upcomingExams = tasks.filter((t) =>
    t.taskType === "Academic" && t.status === "Pending" && t.dueDate
  ).length;
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const subjects = [
    { name: "Mathematics", grade: "A", score: 92 },
    { name: "Physics", grade: "B+", score: 85 },
    { name: "Chemistry", grade: "A-", score: 88 },
    { name: "English", grade: "B", score: 78 },
    { name: "Computer Science", grade: "A+", score: 96 },
    { name: "Biology", grade: "B+", score: 82 },
  ];

  const stats = [
    { icon: BookOpen, label: "Attendance", value: `${myAttendance}%`, sub: myAttendance >= 90 ? "Excellent" : myAttendance >= 75 ? "Good" : "Needs Improvement", color: "bg-gradient-to-br from-emerald-600 to-teal-600" },
    { icon: Award, label: "Performance", value: `${myPerformance}%`, sub: myPerformance >= 85 ? "Above Average" : "Average", color: "bg-gradient-to-br from-blue-600 to-cyan-600" },
    { icon: CheckSquare, label: "Homework", value: `${completedHomework} Done`, sub: `${pendingHomework} Pending`, color: "bg-gradient-to-br from-violet-600 to-indigo-600" },
    { icon: Calendar, label: "Upcoming Exams", value: upcomingExams, sub: "Next 2 weeks", color: "bg-gradient-to-br from-amber-600 to-orange-600" },
    { icon: GraduationCap, label: "Subjects", value: subjects.length, sub: "Grade 12 - A", color: "bg-gradient-to-br from-rose-600 to-pink-600" },
    { icon: TrendingUp, label: "Unread Notifs", value: unreadNotifs, sub: notifications.length > 0 ? `${Math.round((unreadNotifs / notifications.length) * 100)}% unread` : "No notifications", color: "bg-gradient-to-br from-sky-600 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Student Portal
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {myProfile?.name || "Student"} • Grade {myProfile?.grade || "12"} • Section {myProfile?.section || "A"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subjects */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">My Subjects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {subjects.map((subject, i) => (
              <SubjectCard key={i} {...subject} />
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Homework</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {tasks.filter(t => t.taskType === "Academic" || t.taskType === "Assignment").slice(0, 8).map((task, i) => (
              <TaskRow key={i} task={task} />
            ))}
            {tasks.filter(t => t.taskType === "Academic" || t.taskType === "Assignment").length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No homework assigned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
