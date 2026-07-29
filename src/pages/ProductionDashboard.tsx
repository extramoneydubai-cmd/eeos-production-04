import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Video, FileText, Image, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function ProductionDashboard() {
  const dashboard = useQuery(api.productionSdk.getProductionDashboard);
  const data = dashboard || { total: 0, draft: 0, inProgress: 0, review: 0, approved: 0, published: 0, rejected: 0 };

  const metrics = [
    { label: "Total Tasks", value: data.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "In Progress", value: data.inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Under Review", value: data.review, icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Approved", value: data.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Published", value: data.published, icon: Video, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", value: data.rejected, icon: Image, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <WorkspaceShell title="Production Dashboard" subtitle="Content production and asset management">
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
        <h3 className="font-semibold mb-4">Production Pipeline</h3>
        <div className="space-y-3">
          {[
            { label: "Draft", value: data.draft, color: "bg-gray-400" },
            { label: "In Progress", value: data.inProgress, color: "bg-amber-400" },
            { label: "Review", value: data.review, color: "bg-purple-400" },
            { label: "Approved", value: data.approved, color: "bg-blue-400" },
            { label: "Published", value: data.published, color: "bg-green-400" },
            { label: "Rejected", value: data.rejected, color: "bg-red-400" },
          ].map((stage) => {
            const pct = data.total > 0 ? (stage.value / data.total) * 100 : 0;
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
