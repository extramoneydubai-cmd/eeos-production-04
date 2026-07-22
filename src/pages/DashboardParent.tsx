import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  Bell,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Loader2,
  UserCheck,
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

function StudentCard({ student }: { student: any }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{student.name}</h3>
          <p className="text-[10px] text-slate-500">Grade {student.grade} • Section {student.section}</p>
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
          student.status === "Active"
            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
            : "text-amber-600 bg-amber-50 border-amber-200"
        }`}>
          {student.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500">Attendance</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  student.attendance >= 90 ? "bg-emerald-500" :
                  student.attendance >= 75 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${student.attendance}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700">{student.attendance}%</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-[10px] text-slate-500">Performance</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  student.performance >= 85 ? "bg-emerald-500" :
                  student.performance >= 70 ? "bg-blue-500" : "bg-amber-500"
                }`}
                style={{ width: `${student.performance}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700">{student.performance}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notif }: { notif: any }) {
  const typeIcons: Record<string, React.ElementType> = {
    enrollment: Users, payment: DollarSign, meeting: Calendar,
    success: CheckCircle2, warning: AlertCircle, reminder: Clock,
  };
  const NIcon = typeIcons[notif.type] || Bell;
  return (
    <div className={`px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50/50 transition-colors ${!notif.isRead ? "bg-indigo-50/30" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        notif.type === "warning" ? "bg-amber-50" : notif.type === "payment" ? "bg-emerald-50" : "bg-slate-50"
      }`}>
        <NIcon className={`w-3.5 h-3.5 ${
          notif.type === "warning" ? "text-amber-600" : notif.type === "payment" ? "text-emerald-600" : "text-slate-600"
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800">{notif.title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(notif.createdAt), "MMM d, h:mm a")}</p>
      </div>
      {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
    </div>
  );
}

export default function DashboardParent() {
  const { user } = useAuth();
  const demoProfile = useQuery(api.demo.queries.getCurrentDemoProfile);
  const students = useQuery(api.demo.queries.getAllStudents);
  const admissions = useQuery(api.demo.queries.getAdmissions);
  const notifications = useQuery(api.demo.queries.getAllNotifications);
  const activities = useQuery(api.demo.queries.getActivities);

  const isLoading = !demoProfile || !students || !admissions || !notifications || !activities;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Aisha Khan is the demo parent's child (first student in seed data)
  const myChildren = students.filter((s) => s.parentEmail === "parent@vedaedtech.ae");
  const activeChildren = myChildren.filter((s) => s.status === "Active").length;
  const avgChildAttendance = myChildren.length > 0
    ? Math.round(myChildren.reduce((sum, s) => sum + s.attendance, 0) / myChildren.length)
    : 0;
  const totalFeePaid = admissions.reduce((sum, a) => sum + a.feePaid, 0);
  const childAdmissions = admissions.filter((a) =>
    myChildren.some((c) => c.name.toLowerCase().includes(a.studentName.toLowerCase().split(" ")[0].toLowerCase()))
  );
  const upcomingFee = childAdmissions.reduce((sum, a) => sum + (a.feeQuoted - a.feePaid), 0);

  const stats = [
    { icon: Users, label: "My Children", value: myChildren.length, sub: `${activeChildren} Active`, color: "bg-gradient-to-br from-indigo-600 to-purple-600" },
    { icon: UserCheck, label: "Avg Attendance", value: `${avgChildAttendance}%`, sub: "All children", color: "bg-gradient-to-br from-emerald-600 to-teal-600" },
    { icon: DollarSign, label: "Fee Paid (AED)", value: totalFeePaid.toLocaleString(), sub: "Total this year", color: "bg-gradient-to-br from-amber-600 to-orange-600" },
    { icon: BookOpen, label: "Upcoming Fee (AED)", value: upcomingFee.toLocaleString(), sub: "Pending payments", color: "bg-gradient-to-br from-rose-600 to-pink-600" },
    { icon: GraduationCap, label: "Avg Performance", value: myChildren.length > 0
        ? `${Math.round(myChildren.reduce((sum, s) => sum + s.performance, 0) / myChildren.length)}%`
        : "N/A", sub: "All subjects", color: "bg-gradient-to-br from-sky-600 to-blue-600" },
    { icon: Bell, label: "Announcements", value: notifications.filter(n => n.type === "enrollment" || n.type === "meeting").length, sub: "Recent updates", color: "bg-gradient-to-br from-violet-600 to-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Parent Portal
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {demoProfile?.fullName || user?.name || "User"} • {demoProfile?.designation}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Children + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Children */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">My Children</h3>
          {myChildren.length > 0 ? (
            myChildren.map((student, i) => (
              <StudentCard key={i} student={student} />
            ))
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400 shadow-sm">
              No children found in the demo data
            </div>
          )}
        </div>

        {/* Notifications & Announcements */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Announcements</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {notifications.slice(0, 10).map((notif, i) => (
              <NotificationItem key={i} notif={notif} />
            ))}
            {notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No announcements</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
