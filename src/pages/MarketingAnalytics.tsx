import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Megaphone, Users, TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";

export default function MarketingAnalytics() {
  const dashboard = useQuery(api.marketingSdk.getMarketingDashboard);

  const stats = dashboard || {
    totalCampaigns: 0, activeCampaigns: 0, totalLeads: 0,
    convertedLeads: 0, conversionRate: 0, totalBudget: 0, activeJourneys: 0,
  };

  const kpis = [
    { label: "Total Campaigns", value: stats.totalCampaigns, icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Campaigns", value: stats.activeCampaigns, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Budget", value: `₹${(stats.totalBudget / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Active Journeys", value: stats.activeJourneys, icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <WorkspaceShell title="Marketing Analytics" subtitle="Campaign performance and ROI">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: "Total Leads", value: stats.totalLeads, pct: 100 },
            { label: "Converted Leads", value: stats.convertedLeads, pct: stats.totalLeads > 0 ? (stats.convertedLeads / stats.totalLeads) * 100 : 0 },
            { label: "Active Campaigns", value: stats.activeCampaigns, pct: stats.totalCampaigns > 0 ? (stats.activeCampaigns / stats.totalCampaigns) * 100 : 0 },
          ].map((step) => (
            <div key={step.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{step.label}</span>
                <span className="font-medium">{step.value} ({step.pct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(step.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </WorkspaceShell>
  );
}
