import { useMemo, type ElementType } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  CalendarDays,
  Briefcase,
  Clock,
  Wallet,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`p-4 border-border/40 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </div>
    </Card>
  );
}

function formatMoney(value: number | undefined | null) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const empStats = useQuery(api.employeeEngine.getEmployeeStats);
  const users = useQuery(api.users.listUsers);
  const leaves = useQuery(api.leaveEngine.listLeaveApplications, {});
  const departments = useQuery(api.organizationDepartments.listDepartments);

  const now = new Date();
  const payslips = useQuery(api.payrollEngine.listPayslips, {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const pendingLeaves = (leaves || []).filter((l: any) => l.status === "pending").length;
  const todayStart = now.setHours(0, 0, 0, 0);
  const todayEnd = now.setHours(23, 59, 59, 999);
  const onLeaveToday = (leaves || []).filter(
    (l: any) => l.status === "approved" && l.startDate <= todayEnd && l.endDate >= todayStart
  ).length;
  const payslipTotal = (payslips || []).reduce((s: number, p: any) => s + (p.netPayable || 0), 0);
  const pendingPayslips = (payslips || []).filter((p: any) => p.status === "processing").length;

  const departmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (users || []).forEach((u: any) => {
      if (u.departmentId) counts.set(u.departmentId, (counts.get(u.departmentId) || 0) + 1);
    });
    return counts;
  }, [users]);

  const quickActions = [
    { label: "Employee Registry", href: "/employees", icon: Users, color: "bg-blue-500" },
    { label: "Leave Management", href: "/hr/leave", icon: CalendarDays, color: "bg-amber-500" },
    { label: "Payroll & Salary", href: "/hr/payroll", icon: Wallet, color: "bg-purple-500" },
    { label: "Attendance", href: "/attendance", icon: Clock, color: "bg-emerald-500" },
    { label: "Recruitment", href: "/recruiting", icon: UserPlus, color: "bg-rose-500" },
    { label: "People Registry", href: "/people", icon: Briefcase, color: "bg-teal-500" },
  ];

  return (
    <WorkspaceShell title="HR Dashboard" subtitle="Employee management and HR operations">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={empStats?.total ?? "—"}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="Active Now"
          value={empStats?.active ?? "—"}
          icon={CheckCircle2}
          color="bg-emerald-500"
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves}
          icon={CalendarDays}
          color="bg-amber-500"
          onClick={() => navigate("/hr/leave")}
        />
        <StatCard
          title="On Leave Today"
          value={onLeaveToday}
          icon={UserPlus}
          color="bg-orange-500"
          onClick={() => navigate("/hr/leave")}
        />
        <StatCard
          title="Payroll This Month"
          value={formatMoney(payslipTotal)}
          icon={Wallet}
          color="bg-purple-500"
          onClick={() => navigate("/hr/payroll")}
        />
        <StatCard
          title="Payslips Pending"
          value={pendingPayslips}
          icon={Briefcase}
          color="bg-rose-500"
          onClick={() => navigate("/hr/payroll")}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="border-border/40">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" /> Departments
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary"
              onClick={() => navigate("/employees")}
            >
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="p-4 space-y-2">
            {(departments || []).slice(0, 8).map((dept: any) => (
              <div key={dept._id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{dept.name}</span>
                <span className="text-gray-400 font-medium">
                  {departmentCounts.get(dept._id) || 0} members
                </span>
              </div>
            ))}
            {departments && departments.length === 0 && (
              <p className="text-sm text-gray-400 italic">No departments configured</p>
            )}
          </div>
        </Card>

        <Card className="border-border/40">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" /> Quick Actions
            </h3>
          </div>
          <div className="p-4 grid sm:grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="w-full text-left text-sm px-3 py-2.5 rounded-md hover:bg-accent text-gray-700 transition-colors flex items-center gap-2"
              >
                <span className={`p-1.5 rounded-md ${action.color}`}>
                  <action.icon className="h-3.5 w-3.5 text-white" />
                </span>
                {action.label}
                <ArrowRight className="h-3 w-3 ml-auto text-gray-300" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
