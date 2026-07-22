import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, TrendingUp, Target, DollarSign, AlertCircle, CheckCircle2,
  Phone, Calendar, ArrowRight, Bell, Plus, Percent, ThumbsUp, Clock, Activity,
  Landmark, Receipt, RefreshCw, Database,
} from "lucide-react";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState } from "react";
import { ENABLE_COLLECTION_DASHBOARD } from "@/featureFlags";

const PIPELINE_HEALTH_STAGES = [
  { id: "new", label: "New", color: "bg-[#9aa0a6]" },
  { id: "contacted", label: "Contacted", color: "bg-[#4285f4]", mapsTo: ["attempted", "connected"] },
  { id: "qualified", label: "Qualified", color: "bg-[#fbbc04]", mapsTo: ["qualified", "counselling", "interested"] },
  { id: "proposal", label: "Proposal", color: "bg-[#a855f7]", mapsTo: ["follow_up"] },
  { id: "negotiation", label: "Negotiation", color: "bg-[#e8710a]", mapsTo: ["negotiation"] },
  { id: "won", label: "Won", color: "bg-[#0d652d]", mapsTo: ["converted"] },
  { id: "lost", label: "Lost", color: "bg-[#5f6368]", mapsTo: ["lost"] },
];

function StatCard({ title, value, icon: Icon, description, color, onClick }: {
  title: string; value: number | string; icon: React.ElementType;
  description?: string; color?: string; onClick?: () => void;
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all" onClick={onClick}>
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {description && <p className="text-[10px] text-[#9aa0a6]">{description}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color || "bg-[#f1f3f4]"}`}>
            <Icon className={`h-4 w-4 ${color ? "text-white" : "text-[#5f6368]"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const DATE_FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
] as const;

type DateFilter = "all" | "today" | "weekly" | "monthly" | "yearly";

type FilterMode = "createdDate" | "activityDate";

export default function CrmDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [filterMode, setFilterMode] = useState<FilterMode>("activityDate");
  const dashboard = useQuery(api.crm.getCrmDashboardData,
    user ? { userId: user._id, dateFilter, filterMode } : "skip");
  const pendingApprovals = useQuery(api.crm.getAllPendingApprovals, user ? { userId: user._id } : "skip");
  const users = useQuery(api.users.listUsers);
  const collectionDashboard = ENABLE_COLLECTION_DASHBOARD
    ? useQuery(
        api.collectionEngine.getCollectionDashboard,
        user?.role === "super_admin" ? {} : "skip"
      )
    : undefined;

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" /><Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const totalInPipeline = dashboard.activeLeads;
  function getPipelineHealthCount(stageId: string) {
    const def = PIPELINE_HEALTH_STAGES.find((s) => s.id === stageId);
    if (!def) return 0;
    const stages = (def as any).mapsTo || [def.id];
    const pipe = (dashboard!).pipeline;
    return stages.reduce((sum: number, sid: string) => sum + (pipe[sid] || 0), 0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">CRM Dashboard</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            {dashboard.isCEO ? "Organization-wide CRM metrics" : "Your sales performance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/leads")}>
            <Target className="h-3.5 w-3.5 mr-1" /> Database
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
            <Users className="h-3.5 w-3.5 mr-1" /> Sales Center
          </Button>
        </div>
      </div>

      {/* Filter Mode + Date Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterMode("activityDate")}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
              filterMode === "activityDate" ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
            }`}
          >Activity Date</button>
          <button onClick={() => setFilterMode("createdDate")}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
              filterMode === "createdDate" ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
            }`}
          >Created Date</button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#9aa0a6] font-medium uppercase mr-1">Period:</span>
          {DATE_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setDateFilter(f.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                dateFilter === f.id ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
              }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={dashboard.isCEO ? "Total Leads" : "My Leads"}
          value={dashboard.isCEO ? dashboard.totalLeads : dashboard.myLeads}
          icon={Users} color="bg-[#1a73e8]"
          description={dashboard.isCEO ? `${dashboard.activeLeads} active` : undefined}
          onClick={() => navigate("/crm/leads")} />
        <StatCard title="Today's Followups" value={dashboard.todayFollowupsCount}
          icon={Phone} color="bg-[#fbbc04]"
          onClick={() => navigate("/crm/sales")} />
        {dashboard.isCEO ? (
          <StatCard title="Conversion Rate" value={`${dashboard.conversionRate}%`}
            icon={TrendingUp} color="bg-[#34a853]"
            description={`${dashboard.convertedLeads} converted`} />
        ) : (
          <StatCard title="Pending Tasks" value={dashboard.myPendingTasks}
            icon={CheckCircle2} color="bg-[#34a853]"
            onClick={() => navigate("/crm/sales")} />
        )}
        <StatCard title={dashboard.isCEO ? "Pipeline Value" : "Overdue"}
          value={dashboard.isCEO ? `₹${(dashboard.totalExpectedRevenue / 100000).toFixed(1)}L` : dashboard.myOverdue}
          icon={dashboard.isCEO ? DollarSign : AlertCircle}
          color={dashboard.isCEO ? "bg-[#34a853]" : "bg-[#ea4335]"}
          onClick={() => navigate("/crm/sales")} />
      </div>

      {/* Executive Cards */}
      {dashboard.isCEO && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <StatCard title="New Leads"
            value={dashboard.newLeadsCount}
            icon={Users} color="bg-[#1a73e8]"
            description="Created in period"
            onClick={() => navigate("/crm/leads")} />
          <StatCard title="Working Leads"
            value={dashboard.workingLeadsCount}
            icon={Activity} color="bg-[#34a853]"
            description="Active with activity"
            onClick={() => navigate("/crm/leads")} />
          <StatCard title="Converted"
            value={dashboard.convertedLeads}
            icon={CheckCircle2} color="bg-[#0d652d]"
            description="Total converted" />
          <StatCard title="Collections"
            value={`₹${(dashboard.collectionsTotal || 0).toLocaleString()}`}
            icon={DollarSign} color="bg-[#fbbc04]"
            description="Verified in period" />
          <StatCard title="Pending Approval"
            value={pendingApprovals?.length || 0}
            icon={ThumbsUp} color="bg-[#a855f7]"
            description="Awaiting decision"
            onClick={() => navigate("/approvals?tab=crm")} />
        </div>
      )}

      {/* Approval Widgets */}
      {dashboard.isCEO && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard title="Pending Approvals" value={pendingApprovals?.length || 0}
            icon={ThumbsUp} color="bg-[#a855f7]"
            description="Awaiting your decision"
            onClick={() => navigate("/crm/sales")} />
          <StatCard title="Approved Discounts" value={`₹${(dashboard.totalApprovedDiscount || 0).toLocaleString()}`}
            icon={Percent} color="bg-[#34a853]"
            description="Total discount approved"
            onClick={() => navigate("/crm/leads")} />
          <StatCard title="Upcoming Followups" value={dashboard.upcomingFollowupsCount}
            icon={Calendar} color="bg-[#4285f4]"
            description="Next 7 days"
            onClick={() => navigate("/crm/sales")} />
        </div>
      )}

      {/* CEO Control Dashboard */}
      {dashboard.isCEO && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Waiver Exposure" value={`₹${(dashboard.totalWaiverExposure || 0).toLocaleString()}`}
            icon={Percent} color="bg-[#e8710a]"
            description="Total approved waivers" />
          <StatCard title="Discount Impact" value={`₹${(dashboard.totalDiscountExposure || 0).toLocaleString()}`}
            icon={DollarSign} color="bg-[#ea4335]"
            description="Total discount given" />
          <StatCard title="Lead Velocity (30d)" value={dashboard.leadVelocity}
            icon={TrendingUp} color="bg-[#1a73e8]"
            description="New leads in last 30 days" />
          <StatCard title="Avg Approval SLA" value={`${dashboard.avgApprovalTimeHours}h`}
            icon={Clock} color="bg-[#a855f7]"
            description="Average approval time" />
        </div>
      )}

      {/* Payment Verification Queue */}
      {dashboard.isCEO && dashboard.pendingPaymentsCount > 0 && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Payment Verification Queue</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">{dashboard.pendingPaymentsCount} pending verifications</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fef7e0] flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#e8710a]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#1a1a2e]">{dashboard.pendingPaymentsCount}</p>
                  <p className="text-[10px] text-[#5f6368]">Pending</p>
                </div>
              </div>
              <div className="w-px h-10 bg-[#e8eaed]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-[#34a853]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#1a1a2e]">{dashboard.verifiedPaymentsCount}</p>
                  <p className="text-[10px] text-[#5f6368]">Verified</p>
                </div>
              </div>
              <div className="w-px h-10 bg-[#e8eaed]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f1f3f4] flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-[#5f6368]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#1a1a2e]">₹{(dashboard.totalPaid || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-[#5f6368]">Total Collected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Overview */}
      {dashboard.isCEO && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
                <p className="text-[10px] text-[#5f6368]">Pipeline Value</p>
                <p className="text-lg font-semibold text-[#1a1a2e] mt-1">₹{(dashboard.totalExpectedRevenue / 100000).toFixed(1)}L</p>
              </div>
              <div className="p-3 rounded-lg bg-[#fce8e6] text-center">
                <p className="text-[10px] text-[#ea4335]">Discount Given</p>
                <p className="text-lg font-semibold text-[#ea4335] mt-1">₹{(dashboard.totalDiscountAmount / 100000).toFixed(1)}L</p>
              </div>
              <div className="p-3 rounded-lg bg-[#fef7e0] text-center">
                <p className="text-[10px] text-[#e8710a]">Waiver Given</p>
                <p className="text-lg font-semibold text-[#e8710a] mt-1">₹{(dashboard.totalWaiverAmount / 100000).toFixed(1)}L</p>
              </div>
              <div className="p-3 rounded-lg bg-[#e6f4ea] text-center">
                <p className="text-[10px] text-[#34a853]">Collected</p>
                <p className="text-lg font-semibold text-[#34a853] mt-1">₹{((dashboard.totalPaid || 0) / 100000).toFixed(1)}L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CEO-only: Collection Intelligence Cards */}
      {dashboard.isCEO && ENABLE_COLLECTION_DASHBOARD && collectionDashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard
            title="PDC Exposure"
            value={`₹${((collectionDashboard.pdcScheduledTotal + collectionDashboard.pdcDepositedTotal) / 100000).toFixed(1)}L`}
            description={`${collectionDashboard.pdcScheduled + collectionDashboard.pdcDeposited} active PDCs`}
            icon={Landmark}
            color="bg-[#4285f4]"
            onClick={() => navigate("/collections?tab=pdc")}
          />
          <StatCard
            title="Overdue Installments"
            value={collectionDashboard.installmentOverdue}
            description={`₹${collectionDashboard.installmentOverdueTotal.toLocaleString()}`}
            icon={Receipt}
            color="bg-[#ea4335]"
            onClick={() => navigate("/collections?tab=installments")}
          />
          <StatCard
            title="Collection Efficiency"
            value={collectionDashboard.totalCollected + collectionDashboard.totalPending > 0
              ? `${Math.round((collectionDashboard.totalCollected / (collectionDashboard.totalCollected + collectionDashboard.totalPending)) * 100)}%`
              : "—"}
            description={`₹${collectionDashboard.totalCollected.toLocaleString()} verified`}
            icon={TrendingUp}
            color="bg-[#34a853]"
          />
          <StatCard
            title="PDC Bounce Rate"
            value={`${collectionDashboard.pdcBounceRate}%`}
            description={`${collectionDashboard.pdcBounced} bounced / ${collectionDashboard.pdcCleared + collectionDashboard.pdcBounced} decided`}
            icon={RefreshCw}
            color="bg-[#e8710a]"
            onClick={() => navigate("/collections?tab=pdc")}
          />
        </div>
      ) : dashboard.isCEO ? (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#f1f3f4]">
                  <Database className="h-4 w-4 text-[#5f6368]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a2e]">Collection Intelligence</p>
                  <p className="text-[11px] text-[#9aa0a6]">Temporarily unavailable. Pending deployment.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-[#e8eaed]"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* CEO-only: Pipeline Health */}
      {dashboard.isCEO && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Pipeline Health</CardTitle>
            <CardDescription className="text-[10px] text-[#9aa0a6]">Simplified stage view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {PIPELINE_HEALTH_STAGES.filter((s) => s.id !== "won" && s.id !== "lost").map((stage) => {
                const count = getPipelineHealthCount(stage.id);
                const pct = totalInPipeline > 0 ? (count / totalInPipeline) * 100 : 0;
                return (
                  <div key={stage.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-[90px] shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${stage.color}`} />
                      <span className="text-[10px] text-[#5f6368]">{stage.label}</span>
                    </div>
                    <div className="flex-1 h-3 bg-[#f1f3f4] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${stage.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-[#1a1a2e] w-5 text-right">{count}</span>
                  </div>
                );
              })}
              {/* Won / Lost row */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#f1f3f4]">
                <div className="flex items-center gap-1 w-[90px] shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full bg-[#0d652d]`} />
                  <span className="text-[10px] text-[#5f6368]">Won</span>
                </div>
                <div className="flex-1 h-3 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-[#0d652d]`} style={{ width: `${totalInPipeline > 0 ? (getPipelineHealthCount("won") / totalInPipeline) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] font-medium text-[#0d652d] w-5 text-right">{getPipelineHealthCount("won")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-[90px] shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full bg-[#5f6368]`} />
                  <span className="text-[10px] text-[#5f6368]">Lost</span>
                </div>
                <div className="flex-1 h-3 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-[#5f6368]`} style={{ width: `${totalInPipeline > 0 ? (getPipelineHealthCount("lost") / totalInPipeline) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] font-medium text-[#5f6368] w-5 text-right">{getPipelineHealthCount("lost")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CEO-only: Funnel */}
      {dashboard.isCEO && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Funnel</CardTitle>
            <CardDescription className="text-[10px] text-[#9aa0a6]">Lead → Enrolled → Paid → Converted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Lead", count: dashboard.newLeadsCount, color: "bg-[#4285f4]", pct: 100 },
                { label: "Enrolled", count: dashboard.enrolledLeadsCount, color: "bg-[#34a853]", pct: dashboard.newLeadsCount > 0 ? Math.round((dashboard.enrolledLeadsCount / dashboard.newLeadsCount) * 100) : 0 },
                { label: "Paid", count: dashboard.paidLeadsCount, color: "bg-[#fbbc04]", pct: dashboard.newLeadsCount > 0 ? Math.round((dashboard.paidLeadsCount / dashboard.newLeadsCount) * 100) : 0 },
                { label: "Converted", count: dashboard.convertedLeads, color: "bg-[#0d652d]", pct: dashboard.newLeadsCount > 0 ? Math.round((dashboard.convertedLeads / dashboard.newLeadsCount) * 100) : 0 },
              ].map((step, i) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${step.color}`} />
                      <span className="text-[11px] font-medium text-[#1a1a2e]">{step.label}</span>
                    </div>
                    <span className="text-[11px] text-[#5f6368]">{step.count} ({step.pct}%)</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-4 bg-[#f1f3f4] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${step.color}`}
                        style={{ width: i === 0 ? "100%" : `${Math.max(8, step.pct * 0.7)}%` }} />
                    </div>
                    {i < 3 && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                        <ArrowRight className="h-3 w-3 text-[#9aa0a6]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Followups + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Upcoming Followups</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">Next 7 days</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingFollowupsCount === 0 ? (
              <p className="text-[11px] text-[#9aa0a6] text-center py-4">No upcoming followups</p>
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 text-[#1a73e8] mx-auto mb-2" />
                <p className="text-lg font-semibold text-[#1a1a2e]">{dashboard.upcomingFollowupsCount}</p>
                <p className="text-[11px] text-[#5f6368]">followups in next 7 days</p>
                <Button size="sm" className="mt-3 h-7 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => navigate("/crm/sales")}>
                  Go to Sales Center <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Recent Activity</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">Latest actions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {!dashboard.recentActivity?.length ? (
              <p className="text-[11px] text-[#9aa0a6] text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {dashboard.recentActivity?.slice(0, 6).map((a: any) => {
                  const actionUser = users?.find((u) => u._id === a.userId);
                  return (
                    <div key={a._id} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9aa0a6] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#5f6368] line-clamp-1">{a.description}</p>
                        <p className="text-[9px] text-[#9aa0a6]">
                          {actionUser?.name || "System"} · {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments — Outstanding Receivables */}
      {(() => {
        const total = dashboard.pendingPaymentsTotal || 0;
        let bgColor = "bg-[#34a853]";
        if (total > 2000000) bgColor = "bg-[#ea4335]";
        else if (total > 500000) bgColor = "bg-[#e8710a]";
        else if (total > 100000) bgColor = "bg-[#fbbc04]";
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all" onClick={() => navigate("/crm/leads")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-[#5f6368]">Pending Payments</p>
                    <p className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">₹{total.toLocaleString()}</p>
                    <p className="text-[10px] text-[#9aa0a6]">Outstanding verified receivables</p>
                  </div>
                  <div className={`p-2 rounded-lg ${bgColor}`}>
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/leads")}>
          <Target className="h-4 w-4 text-[#1a73e8]" />
          <span className="text-[11px] font-medium text-[#1a1a2e]">Lead Database</span>
          <span className="text-[9px] text-[#9aa0a6]">View all leads</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/sales")}>
          <Users className="h-4 w-4 text-[#34a853]" />
          <span className="text-[11px] font-medium text-[#1a1a2e]">Sales Center</span>
          <span className="text-[9px] text-[#9aa0a6]">Pipeline & followups</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/sales")}>
          <Bell className="h-4 w-4 text-[#fbbc04]" />
          <span className="text-[11px] font-medium text-[#1a1a2e]">Schedule Followup</span>
          <span className="text-[9px] text-[#9aa0a6]">Set reminders</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/leads")}>
          <Plus className="h-4 w-4 text-[#a855f7]" />
          <span className="text-[11px] font-medium text-[#1a1a2e]">Add Lead</span>
          <span className="text-[9px] text-[#9aa0a6]">New lead entry</span>
        </Button>
      </div>
    </div>
  );
}
