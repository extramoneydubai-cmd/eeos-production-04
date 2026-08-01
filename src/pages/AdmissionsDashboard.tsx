import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { UserPlus, Users, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdmissionsDashboard() {
  const stats = useQuery(api.admissionEngine.getAdmissionDashboard, {});

  const metrics = [
    { label: "Total Admissions", value: stats?.total ?? "—", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Enrolled", value: stats?.enrolled ?? "—", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Withdrawn", value: stats?.withdrawn ?? "—", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Completed", value: stats?.completed ?? "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Cancelled", value: stats?.cancelled ?? "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Active Pipeline", value: "—", icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <WorkspaceShell title="Admissions Dashboard" subtitle="Enrollment metrics and admission pipeline">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Admission Pipeline</h3>
        <div className="space-y-3">
          {[
            { label: "Enrolled", value: stats?.enrolled || 0, total: stats?.total || 1, color: "bg-green-400" },
            { label: "Withdrawn", value: stats?.withdrawn || 0, total: stats?.total || 1, color: "bg-red-400" },
            { label: "Completed", value: stats?.completed || 0, total: stats?.total || 1, color: "bg-purple-400" },
            { label: "Cancelled", value: stats?.cancelled || 0, total: stats?.total || 1, color: "bg-amber-400" },
          ].map((stage) => {
            const pct = stage.total > 0 ? (stage.value / stage.total) * 100 : 0;
            return (
              <div key={stage.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{stage.label}</span>
                  <span className="font-medium">{stage.value} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${stage.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </WorkspaceShell>
  );
}
