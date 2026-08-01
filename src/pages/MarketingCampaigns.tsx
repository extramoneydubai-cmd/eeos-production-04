import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { KpiCard } from "@/components/analytics/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Calendar, BarChart3, Users, Megaphone, Wallet, Rocket, FileText } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MarketingCampaigns() {
  const [search, setSearch] = useState("");
  const campaigns = useQuery(api.marketingSdk.listCampaigns, {});
  const updateStatus = useMutation(api.marketingSdk.updateCampaignStatus);

  const filtered = (campaigns || []).filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCampaigns = (campaigns || []).length;
  const activeCount = (campaigns || []).filter((c: any) => c.status === "active").length;
  const scheduledCount = (campaigns || []).filter((c: any) => c.status === "scheduled").length;
  const draftCount = (campaigns || []).filter((c: any) => c.status === "draft").length;
  const totalBudget = (campaigns || []).reduce((sum: number, c: any) => sum + (c.budget || 0), 0);

  // Channel distribution from live data (context panel)
  const channelCounts = (campaigns || []).reduce<Record<string, number>>((acc, c: any) => {
    const ch = c.channel || "unknown";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});
  const upcoming = (campaigns || [])
    .filter((c: any) => c.status === "scheduled" || c.status === "active")
    .slice(0, 5);

  return (
    <WorkspaceShell
      title="Campaign Manager"
      subtitle="Create and manage marketing campaigns"
      actionBar={
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      }
      kpiStrip={
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="Total Campaigns" value={totalCampaigns} icon={<Megaphone className="h-4 w-4" />} color="blue" />
          <KpiCard label="Active" value={activeCount} icon={<Rocket className="h-4 w-4" />} color="green" />
          <KpiCard label="Scheduled" value={scheduledCount} icon={<Calendar className="h-4 w-4" />} color="purple" />
          <KpiCard label="Drafts" value={draftCount} icon={<FileText className="h-4 w-4" />} color="yellow" />
          <KpiCard label="Total Budget" value={`₹${(totalBudget / 100000).toFixed(1)}L`} icon={<Wallet className="h-4 w-4" />} color="teal" />
        </div>
      }
      contextPanel={
        <>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-gray-400" /> Channels
            </h3>
            <div className="space-y-2">
              {Object.entries(channelCounts).map(([ch, count]) => (
                <div key={ch} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-gray-600">{ch}</span>
                  <Badge variant="outline" className="text-[10px]">{count}</Badge>
                </div>
              ))}
              {Object.keys(channelCounts).length === 0 && (
                <p className="text-xs text-gray-400">No campaigns yet</p>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-400" /> Upcoming
            </h3>
            <div className="space-y-2">
              {upcoming.map((c: any) => (
                <div key={c._id} className="text-xs">
                  <p className="font-medium text-gray-700 truncate">{c.name}</p>
                  <p className="text-gray-400 text-[10px] capitalize">{c.status}</p>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="text-xs text-gray-400">Nothing scheduled</p>
              )}
            </div>
          </Card>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(filtered || []).map((campaign: any) => (
          <Card key={campaign._id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{campaign.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{campaign.channel}</p>
              </div>
              <Badge className={statusColors[campaign.status] || ""}>
                {campaign.status}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {new Date(campaign.startDate).toLocaleDateString()}
                {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
              </div>
              {campaign.budget && (
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  Budget: ₹{campaign.budget.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="text-xs flex-1">View</Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs flex-1"
                onClick={() => {
                  if (campaign.status === "draft") updateStatus({ id: campaign._id, status: "active" });
                  else if (campaign.status === "active") updateStatus({ id: campaign._id, status: "paused" });
                  else if (campaign.status === "paused") updateStatus({ id: campaign._id, status: "active" });
                }}
              >
                {campaign.status === "active" ? "Pause" : campaign.status === "paused" ? "Resume" : "Activate"}
              </Button>
            </div>
          </Card>
        ))}
        {(!filtered || filtered.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <Megaphone className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">No campaigns yet</p>
            <p className="text-xs mt-1">Create your first campaign to get started</p>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
