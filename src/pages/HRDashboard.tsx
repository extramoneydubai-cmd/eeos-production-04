import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Users, UserPlus, Calendar, Briefcase, TrendingUp, Activity } from "lucide-react";

export default function HRDashboard() {
  const departments = useQuery(api.organizationDepartments.listDepartments);

  const stats = [
    { label: "Total Employees", value: "—", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "New This Month", value: "—", icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
    { label: "On Leave Today", value: "—", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Active Openings", value: "—", icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pending Reviews", value: "—", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Exit Pipeline", value: "—", icon: Activity, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <WorkspaceShell title="HR Dashboard" subtitle="Employee management and HR operations">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500" /> Departments
          </h3>
          <div className="space-y-2">
            {(departments || []).slice(0, 8).map((dept: any) => (
              <div key={dept._id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{dept.name}</span>
                <span className="text-gray-400">—</span>
              </div>
            ))}
            {(!departments || departments.length === 0) && (
              <p className="text-sm text-gray-400 italic">No departments configured</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" /> Quick Actions
          </h3>
          <div className="space-y-2">
            {["Create Employee", "Process Payroll", "Schedule Review", "Add Department", "Post Opening", "Generate Report"].map((action) => (
              <button
                key={action}
                className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
