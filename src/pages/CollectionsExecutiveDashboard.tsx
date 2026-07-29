import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Banknote } from "lucide-react";

export default function CollectionsExecutiveDashboard() {
  const dashboard = useQuery(api.collectionEngine.getCollectionDashboard);
  const data = dashboard || {};

  const metrics = [
    { label: "Total Collected", value: data.totalCollected ? `₹${(data.totalCollected / 100000).toFixed(1)}L` : "—", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending", value: data.totalPending ? `₹${(data.totalPending / 100000).toFixed(1)}L` : "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "PDC Exposure", value: data.pdcScheduledTotal ? `₹${(data.pdcScheduledTotal / 100000).toFixed(1)}L` : "—", icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Overdue Inst.", value: data.installmentOverdueTotal ? `₹${(data.installmentOverdueTotal / 100000).toFixed(1)}L` : "—", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Bounce Rate", value: `${data.pdcBounceRate || 0}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "PDC Cleared", value: data.pdcClearedTotal ? `₹${(data.pdcClearedTotal / 100000).toFixed(1)}L` : "—", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <WorkspaceShell title="Collections Executive Dashboard" subtitle="Collection performance, PDC pipeline, and forecasting">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${m.bg}`}><m.icon className={`h-5 w-5 ${m.color}`} /></div>
              <div><p className="text-xl font-bold">{m.value}</p><p className="text-xs text-gray-500">{m.label}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">PDC Pipeline</h3>
          <div className="space-y-2">
            {[
              { label: "Scheduled", count: data.pdcScheduled || 0, total: (data.pdcScheduled || 0) + (data.pdcDeposited || 0) + (data.pdcCleared || 0) + (data.pdcBounced || 0), color: "bg-blue-400" },
              { label: "Deposited", count: data.pdcDeposited || 0, total: 1, color: "bg-amber-400" },
              { label: "Cleared", count: data.pdcCleared || 0, total: 1, color: "bg-green-400" },
              { label: "Bounced", count: data.pdcBounced || 0, total: 1, color: "bg-red-400" },
              { label: "Due Today", count: data.pdcDueToday || 0, total: 1, color: "bg-purple-400" },
              { label: "Overdue", count: data.pdcOverdue || 0, total: 1, color: "bg-orange-400" },
            ].map((s) => {
              const pct = s.total > 0 ? (s.count / Math.max(s.total, data.pdcScheduled || 1)) * 100 : 0;
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Installment Health</h3>
          <div className="space-y-3">
            {[
              { label: "Planned", value: data.installmentPlannedTotal || 0, color: "text-gray-500" },
              { label: "Due", value: data.installmentDueTotal || 0, color: "text-amber-600" },
              { label: "Overdue", value: data.installmentOverdueTotal || 0, color: "text-red-600" },
              { label: "Paid", value: data.installmentPaidTotal || 0, color: "text-green-600" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm py-1 border-b last:border-0">
                <span className="text-gray-600">{item.label}</span>
                <span className={`font-medium ${item.color}`}>₹{(item.value / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
