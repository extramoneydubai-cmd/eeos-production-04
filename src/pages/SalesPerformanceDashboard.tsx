import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState } from "react";
import {
  Users, Phone, DollarSign, Target, Calendar, Clock,
  CheckCircle2, BarChart3, ArrowRight,
  UserPlus, PhoneCall,
  Banknote, CalendarClock, Trophy, Medal,
  Landmark, Filter, AlertTriangle, AlertCircle, Bell,
  TrendingUp, Activity, ExternalLink, Plus, ListChecks,
} from "lucide-react";

const stageColors: Record<string, string> = {
  new: "bg-[#9aa0a6]", attempted: "bg-[#4285f4]", connected: "bg-[#34a853]",
  qualified: "bg-[#fbbc04]", counselling: "bg-[#a855f7]", interested: "bg-[#1a73e8]",
  follow_up: "bg-[#ea4335]", negotiation: "bg-[#e8710a]", converted: "bg-[#0d652d]", lost: "bg-[#5f6368]",
};

const stageLabels: Record<string, string> = {
  new: "New", attempted: "Attempted", connected: "Connected",
  qualified: "Qualified", counselling: "Counselling", interested: "Interested",
  follow_up: "Follow Up", negotiation: "Negotiation", converted: "Converted", lost: "Lost",
};

function fmtINR(n: number) {
  return n ? `₹${n.toLocaleString()}` : "₹0";
}

function KpiCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-[#e8eaed] shadow-sm bg-white hover:shadow-md transition-all ${className || ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
            <Icon className="h-4 w-4 text-[#5f6368]" />
          </div>
          <p className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">{title}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function StatValue({ value, color }: { value: string; color?: string }) {
  return <p className="text-xl font-bold" style={{ color: color || "#1a1a2e" }}>{value}</p>;
}

function StatLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#9aa0a6] mt-0.5">{children}</p>;
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#5f6368]">{label}</p>
    <p className="text-sm font-semibold" style={{ color: color || "#1a1a2e" }}>{value}</p>
  </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 mb-1" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="p-3 rounded-full bg-[#f1f3f4] mb-3">
        <Icon className="h-6 w-6 text-[#9aa0a6]" />
      </div>
      <p className="text-[13px] font-medium text-[#1a1a2e]">{title}</p>
      <p className="text-[11px] text-[#9aa0a6] mt-1 max-w-[300px]">{description}</p>
    </div>
  );
}

function getInitials(name?: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function SalesPerformanceDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [counselorFilter, setCounselorFilter] = useState("");
  const [leaderboardTab, setLeaderboardTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const queryArgs = user ? {
    userId: user._id,
    dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
    dateTo: dateTo ? new Date(dateTo + "T23:59:59").getTime() : undefined,
    branchId: (branchFilter || undefined) as any,
    courseId: (courseFilter || undefined) as any,
    counselorId: (counselorFilter || undefined) as any,
  } : "skip";

  const data = useQuery(api.crm.getSalesPerformanceDashboard, queryArgs);

  if (!data) return <LoadingSkeleton />;

  const k = data.kpi;
  const hasData = data.funnel.total > 0 || data.kpi.leadsAssigned.today > 0;

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Sales Performance Dashboard</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Real-time sales operations intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Sales Center
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm")}>
            <Target className="h-3.5 w-3.5 mr-1" /> CRM Dashboard
          </Button>
        </div>
      </div>

      {/* ─── Global Filters ─── */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-[#5f6368]" />
            <span className="text-[10px] font-semibold text-[#5f6368] uppercase mr-1">Filters:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-[11px] px-2 border border-[#e8eaed] rounded-md bg-white"
              placeholder="From"
            />
            <span className="text-[10px] text-[#9aa0a6]">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-[11px] px-2 border border-[#e8eaed] rounded-md bg-white"
              placeholder="To"
            />
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-8 text-[11px] w-[130px] border-[#e8eaed]">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Branches</SelectItem>
                {data.filters.branches.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-8 text-[11px] w-[130px] border-[#e8eaed]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Courses</SelectItem>
                {data.filters.courses.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>{c.courseName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={counselorFilter} onValueChange={setCounselorFilter}>
              <SelectTrigger className="h-8 text-[11px] w-[130px] border-[#e8eaed]">
                <SelectValue placeholder="All Counselors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Counselors</SelectItem>
                {data.filters.users.map((u: any) => (
                  <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── ENHANCEMENT 4: Quick Action Bar ─── */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mr-1">Quick Actions:</span>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/sales/collections")}>
          <Landmark className="h-3 w-3 mr-1" /> Collection Center
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/sales/payments")}>
          <DollarSign className="h-3 w-3 mr-1" /> Payments
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/sales/tasks")}>
          <ListChecks className="h-3 w-3 mr-1" /> Pending Tasks
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/leads")}>
          <Users className="h-3 w-3 mr-1" /> Lead Database
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/leads?action=create")}>
          <Plus className="h-3 w-3 mr-1" /> Create Lead
        </Button>
      </div>

      {!hasData ? (
        <EmptyState icon={BarChart3} title="No sales data yet" description="Leads and sales activities will appear here once the CRM has data to display." />
      ) : (
        <>
          {/* ════════════════════════════════════════
              SECTION 1 — EXECUTIVE KPI CARDS
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1 — Leads Assigned */}
            <KpiCard title="Leads Assigned" icon={UserPlus}>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Today" value={k.leadsAssigned.today} color="#1a73e8" />
                <MiniStat label="Week" value={k.leadsAssigned.week} color="#e8710a" />
                <MiniStat label="Month" value={k.leadsAssigned.month} color="#34a853" />
              </div>
              {k.leadsAssigned.trend && (
                <div className="mt-2 flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${k.leadsAssigned.trend.direction === 'up' ? 'text-[#34a853]' : k.leadsAssigned.trend.direction === 'down' ? 'text-[#ea4335]' : 'text-[#9aa0a6]'}`}>
                    {k.leadsAssigned.trend.label} vs yesterday
                  </span>
                </div>
              )}
              {!k.leadsAssigned.trend && (
                <p className="text-[9px] text-[#dadce0] mt-2">Trend coming soon</p>
              )}
            </KpiCard>

            {/* Card 2 — Leads Contacted */}
            <KpiCard title="Leads Contacted" icon={PhoneCall}>
              <div className="flex items-end gap-2">
                <StatValue value={k.leadsContacted.count.toString()} color="#34a853" />
                <div className="pb-0.5">
                  <Badge className="text-[9px] bg-[#e6f4ea] text-[#34a853] hover:bg-[#e6f4ea]">
                    {k.leadsContacted.percentage}%
                  </Badge>
                </div>
              </div>
              <StatLabel>
                {k.leadsContacted.count} of {k.leadsContacted.total} assigned leads contacted
              </StatLabel>
              <div className="mt-2 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                <div className="h-full bg-[#34a853] rounded-full" style={{ width: `${k.leadsContacted.percentage}%` }} />
              </div>
            </KpiCard>

            {/* Card 3 — Admissions Closed */}
            <KpiCard title="Admissions Closed" icon={CheckCircle2}>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Today" value={k.admissionsClosed.today} color="#0d652d" />
                <MiniStat label="Month" value={k.admissionsClosed.month} color="#0d652d" />
                <MiniStat label="Conv. Rate" value={`${k.admissionsClosed.conversionRate}%`} color="#34a853" />
              </div>
              <StatLabel>{k.admissionsClosed.total} total admissions</StatLabel>
              {k.admissionsClosed.trend && (
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${k.admissionsClosed.trend.direction === 'up' ? 'text-[#34a853]' : k.admissionsClosed.trend.direction === 'down' ? 'text-[#ea4335]' : 'text-[#9aa0a6]'}`}>
                    {k.admissionsClosed.trend.label} vs yesterday
                  </span>
                </div>
              )}
            </KpiCard>

            {/* Card 4 — Revenue Generated */}
            <KpiCard title="Revenue Generated" icon={DollarSign}>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#5f6368]">Collected</span>
                  <span className="text-sm font-bold text-[#34a853]">{fmtINR(k.revenueGenerated.collected)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#5f6368]">Pending</span>
                  <span className="text-sm font-semibold text-[#e8710a]">{fmtINR(k.revenueGenerated.pending)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#5f6368]">Outstanding</span>
                  <span className="text-sm font-semibold text-[#ea4335]">{fmtINR(k.revenueGenerated.outstanding)}</span>
                </div>
              </div>
              {k.revenueGenerated.trend && (
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${k.revenueGenerated.trend.direction === 'up' ? 'text-[#34a853]' : k.revenueGenerated.trend.direction === 'down' ? 'text-[#ea4335]' : 'text-[#9aa0a6]'}`}>
                    {k.revenueGenerated.trend.label} vs last week
                  </span>
                </div>
              )}
            </KpiCard>

            {/* Card 5 — Collections */}
            <KpiCard title="Collections" icon={Banknote}>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Recovery" value={`${k.collections.recoveryPct}%`} color="#34a853" />
                <MiniStat label="Pending" value={fmtINR(k.collections.pendingCollections)} color="#e8710a" />
                <MiniStat label="Overdue" value={fmtINR(k.collections.overdue)} color="#ea4335" />
              </div>
              <div className="mt-2 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                <div className="h-full bg-[#34a853] rounded-full" style={{ width: `${k.collections.recoveryPct}%` }} />
              </div>
              <p className="text-[9px] text-[#dadce0] mt-1">Trend coming soon</p>
            </KpiCard>

            {/* Card 6 — Calls */}
            <KpiCard title="Calls" icon={Phone}>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Today" value={k.calls.today} color="#1a73e8" />
                <MiniStat label="Avg Dur." value={k.calls.avgDuration > 60 ? `${Math.floor(k.calls.avgDuration / 60)}m` : `${k.calls.avgDuration}s`} color="#5f6368" />
                <MiniStat label="Connected" value={`${k.calls.connectedPct}%`} color="#34a853" />
              </div>
              <StatLabel>{k.calls.total} total calls logged</StatLabel>
              {k.calls.trend && (
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${k.calls.trend.direction === 'up' ? 'text-[#34a853]' : k.calls.trend.direction === 'down' ? 'text-[#ea4335]' : 'text-[#9aa0a6]'}`}>
                    {k.calls.trend.label} vs yesterday
                  </span>
                </div>
              )}
            </KpiCard>

            {/* Card 7 — Follow-ups */}
            <KpiCard title="Follow-ups" icon={CalendarClock}>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Today" value={k.followups.today} color="#1a73e8" />
                <MiniStat label="Overdue" value={k.followups.overdue} color="#ea4335" />
                <MiniStat label="Upcoming" value={k.followups.upcoming} color="#e8710a" />
              </div>
              <StatLabel>{k.followups.completedToday} completed today</StatLabel>
              {k.followups.trend && (
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${k.followups.trend.direction === 'up' ? 'text-[#34a853]' : k.followups.trend.direction === 'down' ? 'text-[#ea4335]' : 'text-[#9aa0a6]'}`}>
                    {k.followups.trend.label} vs yesterday
                  </span>
                </div>
              )}
            </KpiCard>

            {/* Card 8 — Demo Pipeline */}
            <KpiCard title="Demo Pipeline" icon={Target}>
              <div className="grid grid-cols-4 gap-1">
                <MiniStat label="Scheduled" value={k.demoPipeline.scheduled} color="#1a73e8" />
                <MiniStat label="Attended" value={k.demoPipeline.attended} color="#34a853" />
                <MiniStat label="Missed" value={k.demoPipeline.missed} color="#ea4335" />
                <MiniStat label="Converted" value={k.demoPipeline.converted} color="#0d652d" />
              </div>
              <StatLabel>{k.demoPipeline.total} leads in demo stages</StatLabel>
              <p className="text-[9px] text-[#dadce0] mt-1">Trend coming soon</p>
            </KpiCard>
          </div>

          {/* ════════════════════════════════════════
              ENHANCEMENT 1: Management Alerts Panel
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {/* Overdue Follow-ups — RED */}
            <button onClick={() => navigate("/crm/sales/tasks")}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#fce8e6] hover:bg-[#f5d5d3] transition-all text-left group cursor-pointer border border-transparent hover:border-[#ea4335]/30">
              <div className="p-1.5 rounded-full bg-[#ea4335]/10 group-hover:bg-[#ea4335]/20 transition-colors">
                <AlertCircle className="h-4 w-4 text-[#ea4335]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#ea4335]">{k.followups.overdue}</p>
                <p className="text-[9px] text-[#5f6368] truncate">Overdue Follow-ups</p>
              </div>
            </button>
            {/* Payment Pending — ORANGE */}
            <button onClick={() => navigate("/crm/sales/collections")}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#fef7e0] hover:bg-[#fef0c0] transition-all text-left group cursor-pointer border border-transparent hover:border-[#e8710a]/30">
              <div className="p-1.5 rounded-full bg-[#e8710a]/10 group-hover:bg-[#e8710a]/20 transition-colors">
                <AlertTriangle className="h-4 w-4 text-[#e8710a]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#e8710a]">{k.revenueGenerated.pending > 0 ? Math.ceil(k.revenueGenerated.pending / 1000) : 0}K</p>
                <p className="text-[9px] text-[#5f6368] truncate">Pending Payments</p>
              </div>
            </button>
            {/* Overdue Installments — RED */}
            <button onClick={() => navigate("/crm/sales/collections")}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#fce8e6] hover:bg-[#f5d5d3] transition-all text-left group cursor-pointer border border-transparent hover:border-[#ea4335]/30">
              <div className="p-1.5 rounded-full bg-[#ea4335]/10 group-hover:bg-[#ea4335]/20 transition-colors">
                <Clock className="h-4 w-4 text-[#ea4335]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#ea4335]">{data.collectionSnapshot.pendingVerification}</p>
                <p className="text-[9px] text-[#5f6368] truncate">Pending Verifications</p>
              </div>
            </button>
            {/* Demos Missed — YELLOW */}
            <button onClick={() => navigate("/crm/leads")}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#fef7e0] hover:bg-[#fef0c0] transition-all text-left group cursor-pointer border border-transparent hover:border-[#fbbc04]/30">
              <div className="p-1.5 rounded-full bg-[#fbbc04]/10 group-hover:bg-[#fbbc04]/20 transition-colors">
                <Target className="h-4 w-4 text-[#fbbc04]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#e8710a]">{k.demoPipeline.missed}</p>
                <p className="text-[9px] text-[#5f6368] truncate">Demos Missed</p>
              </div>
            </button>
            {/* Admissions Today — GREEN */}
            <button onClick={() => navigate("/crm/leads")}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#e6f4ea] hover:bg-[#d5ecd9] transition-all text-left group cursor-pointer border border-transparent hover:border-[#34a853]/30">
              <div className="p-1.5 rounded-full bg-[#34a853]/10 group-hover:bg-[#34a853]/20 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-[#34a853]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#34a853]">{k.admissionsClosed.today}</p>
                <p className="text-[9px] text-[#5f6368] truncate">Admissions Today</p>
              </div>
            </button>
          </div>

          {/* ════════════════════════════════════════
              SECTION 2 — SALES FUNNEL + TIMELINE (2 cols)
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Funnel */}
            <Card className="border-[#e8eaed] shadow-sm bg-white lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Sales Funnel</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">
                  {data.funnel.total} active leads in pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.funnel.stages.length === 0 ? (
                  <p className="text-[11px] text-[#9aa0a6] text-center py-4">No leads in pipeline</p>
                ) : (
                  <div className="space-y-1">
                    {data.funnel.stages.map((stage: any, idx: number) => {
                      const prevCount = idx > 0 ? data.funnel.stages[idx - 1].count : stage.count;
                      const dropoff = Math.max(0, prevCount - stage.count);
                      const dropoffPct = prevCount > 0 ? Math.round((dropoff / prevCount) * 100) : 0;
                      const barWidth = data.funnel.stages[0].count > 0
                        ? Math.max(5, (stage.count / data.funnel.stages[0].count) * 100)
                        : 0;
                      return (
                        <div key={stage.stage} className="relative">
                          <div className="flex items-center gap-2 py-1">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${stageColors[stage.stage] || "bg-[#9aa0a6]"}`} />
                            <span className="text-[11px] text-[#5f6368] w-[100px] shrink-0">{stage.label}</span>
                            <div className="flex-1 h-5 bg-[#f1f3f4] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${stageColors[stage.stage] || "bg-[#9aa0a6]"}`}
                                style={{ width: `${barWidth}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-[#1a1a2e] w-12 text-right">{stage.count}</span>
                            <span className="text-[10px] text-[#9aa0a6] w-10 text-right">{stage.pct}%</span>
                            {idx > 0 && dropoff > 0 && (
                              <span className="text-[9px] text-[#ea4335] w-16 text-right">-{dropoffPct}%</span>
                            )}
                            {idx > 0 && dropoff === 0 && (
                              <span className="text-[9px] text-[#9aa0a6] w-16 text-right">—</span>
                            )}
                          </div>
                          {/* Drop-off arrow */}
                          {idx < data.funnel.stages.length - 1 && dropoff > 0 && (
                            <div className="absolute -bottom-0.5 left-[108px] right-0 flex items-center gap-1 opacity-40">
                              <div className="h-px flex-1 bg-[#ea4335]" />
                              <ArrowRight className="h-2.5 w-2.5 text-[#ea4335]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Activity Timeline — Section 5 */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Daily Activity</CardTitle>
                    <CardDescription className="text-[10px] text-[#9aa0a6]">Recent actions (48h)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.timeline.length === 0 ? (
                  <p className="text-[11px] text-[#9aa0a6] text-center py-4">No recent activity</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {data.timeline.slice(0, 20).map((item: any) => {
                      const time = new Date(item.time);
                      const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                      const dateStr = time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      const isToday = new Date().toDateString() === time.toDateString();
                      const actionColors: Record<string, string> = {
                        activity: "bg-[#9aa0a6]", payment: "bg-[#34a853]",
                        conversion: "bg-[#0d652d]", call: "bg-[#1a73e8]",
                      };
                      return (
                        <div key={item.id} className="flex items-start gap-2 p-1.5 rounded-md hover:bg-[#f8f9fa] transition-colors">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className={`w-2 h-2 rounded-full ${actionColors[item.type] || "bg-[#9aa0a6]"} shrink-0`} />
                            <div className="w-px h-full min-h-[24px] bg-[#e8eaed]" />
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-[#1a1a2e]">{item.userName}</span>
                              <span className="text-[10px] text-[#5f6368]">{item.action}</span>
                            </div>
                            <p className="text-[10px] text-[#9aa0a6] mt-0.5">
                              {item.leadName && <span>{item.leadName} · </span>}
                              {item.description}
                            </p>
                            <p className="text-[8px] text-[#dadce0]">
                              {isToday ? timeStr : `${dateStr} ${timeStr}`}
                            </p>
                          </div>
                          {item.amount && (
                            <span className="text-[11px] font-semibold text-[#34a853] shrink-0">
                              {fmtINR(item.amount)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ════════════════════════════════════════
              SECTION 3 — COUNSELOR PERFORMANCE TABLE
              ════════════════════════════════════════ */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Counselor Performance</CardTitle>
                  <CardDescription className="text-[10px] text-[#9aa0a6]">
                    Sorted by performance score
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#9aa0a6]">Score: Conversion×0.3 + Collection×0.2 + Calls×0.2 + Followups×0.15 + Admissions×0.15</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.counselorPerformance.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Users} title="No counselors found" description="Leads need to be assigned to counselors for performance tracking." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 900 }}>
                    <thead>
                      <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">#</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Counselor</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Assigned</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Calls</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Followups</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Demo</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Admissions</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Revenue</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Collection %</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Conversion %</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Score</th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.counselorPerformance.map((c: any) => {
                        const counselorUser = data.filters.users.find((u: any) => u._id === c.userId);
                        const isTop3 = c.rank <= 3;
                        return (
                          <tr key={c.userId} className={`border-b border-[#f1f3f4] hover:bg-[#f0f3f5] transition-colors cursor-pointer ${isTop3 ? "bg-[#fafbfc]" : ""}`}
                            onClick={() => navigate(`/crm/leads?owner=${c.userId}`)}>
                            <td className="px-3 py-2.5">
                              {c.rank === 1 ? <Trophy className="h-3.5 w-3.5 text-[#fbbc04]" /> : c.rank === 2 ? <Medal className="h-3.5 w-3.5 text-[#9aa0a6]" /> : c.rank === 3 ? <Medal className="h-3.5 w-3.5 text-[#e8710a]" /> : <span className="text-[11px] text-[#9aa0a6]">{c.rank}</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                                    {getInitials(counselorUser?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[12px] font-medium text-[#1a1a2e]">{counselorUser?.name || "Unknown"}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-[12px] text-right text-[#1a1a2e]">{c.assigned}</td>
                            <td className="px-3 py-2.5 text-[12px] text-right text-[#1a73e8]">{c.calls}</td>
                            <td className="px-3 py-2.5 text-[12px] text-right text-[#e8710a]">{c.followups}</td>
                            <td className="px-3 py-2.5 text-[12px] text-right text-[#a855f7]">{c.demo}</td>
                            <td className="px-3 py-2.5 text-[12px] text-right font-medium text-[#0d652d]">{c.admissions}</td>
                            <td className="px-3 py-2.5 text-[12px] text-right font-medium text-[#1a1a2e]">{fmtINR(c.revenue)}</td>
                            <td className="px-3 py-2.5 text-[12px] text-right">
                              <span className={`font-medium ${c.collectionPct >= 70 ? "text-[#34a853]" : c.collectionPct >= 40 ? "text-[#e8710a]" : "text-[#ea4335]"}`}>
                                {c.collectionPct}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-[12px] text-right">
                              <span className={`font-medium ${c.conversionPct >= 30 ? "text-[#34a853]" : c.conversionPct >= 15 ? "text-[#e8710a]" : "text-[#ea4335]"}`}>
                                {c.conversionPct}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <Badge className={`text-[10px] px-1.5 py-0 h-5 ${
                                c.score >= 80 ? "bg-[#34a853] text-white"
                                : c.score >= 50 ? "bg-[#fbbc04] text-[#1a1a2e]"
                                : "bg-[#f1f3f4] text-[#5f6368]"
                              }`}>
                                {c.score}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#5f6368]"
                                  onClick={() => navigate("/crm/sales")}>
                                  <BarChart3 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════
              ENHANCEMENT 5: Needs Attention Panel
              ════════════════════════════════════════ */}
          {data.needsAttention.length > 0 && (
            <Card className="border-[#e8eaed] shadow-sm bg-white border-l-4 border-l-[#ea4335]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#ea4335]" />
                    <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Needs Attention</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] text-[#9aa0a6]">{data.needsAttention.length} priority leads</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[320px] overflow-y-auto">
                  {data.needsAttention.map((lead: any) => {
                    const ownerUser = data.filters.users.find((u: any) => u._id === lead.ownerId);
                    const lastContactStr = lead.lastContact
                      ? `${Math.floor((Date.now() - lead.lastContact) / 86400000)}d ago`
                      : "Never";
                    const nextFollowupStr = lead.nextActionDate
                      ? new Date(lead.nextActionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "None";
                    return (
                      <div key={lead.leadId} className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                        onClick={() => navigate(`/crm/leads/${lead.leadId}`)}>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className={`text-[8px] ${lead.isOverdue ? 'bg-[#fce8e6] text-[#ea4335]' : 'bg-[#fef7e0] text-[#e8710a]'}`}>
                            {lead.firstName[0]}{lead.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{lead.firstName} {lead.lastName}</p>
                          <div className="flex items-center gap-2 text-[9px] text-[#9aa0a6]">
                            <span>Outstanding: <span className="font-medium text-[#ea4335]">{fmtINR(lead.outstanding)}</span></span>
                            <span>·</span>
                            <span>Contact: {lastContactStr}</span>
                            <span>·</span>
                            <span>Next: {nextFollowupStr}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className={`text-[8px] px-1 py-0 h-4 ${stageColors[lead.stage] || "bg-[#9aa0a6]"} text-white`}>
                            {stageLabels[lead.stage] || lead.stage}
                          </Badge>
                          <ExternalLink className="h-3 w-3 text-[#9aa0a6]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════
              SECTION 4 — LEADERBOARD + SECTION 7 — FOLLOW-UP HEALTH
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Leaderboard */}
            <Card className="border-[#e8eaed] shadow-sm bg-white lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Leaderboard</CardTitle>
                  <div className="flex items-center gap-1 bg-[#f1f3f4] rounded-lg p-0.5">
                    {(["daily", "weekly", "monthly"] as const).map((tab) => (
                      <button key={tab} onClick={() => setLeaderboardTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                          leaderboardTab === tab ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368] hover:text-[#1a1a2e]"
                        }`}>
                        {tab === "daily" ? "Daily" : tab === "weekly" ? "Weekly" : "Monthly"}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const entries = leaderboardTab === "daily" ? data.leaderboard.daily
                    : leaderboardTab === "weekly" ? data.leaderboard.weekly
                    : data.leaderboard.monthly;
                  if (entries.length === 0) {
                    return <p className="text-[11px] text-[#9aa0a6] text-center py-4">No data for this period</p>;
                  }
                  return (
                    <div className="space-y-1">
                      {entries.map((entry: any, idx: number) => {
                        const counselorUser = data.filters.users.find((u: any) => u._id === entry.userId);
                        return (
                          <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f8f9fa] transition-colors">
                            <div className="w-6 text-center">
                              {idx === 0 ? <Trophy className="h-4 w-4 text-[#fbbc04] mx-auto" /> : idx === 1 ? <Medal className="h-4 w-4 text-[#9aa0a6] mx-auto" /> : idx === 2 ? <Medal className="h-4 w-4 text-[#e8710a] mx-auto" /> : <span className="text-[11px] text-[#9aa0a6]">{idx + 1}</span>}
                            </div>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[8px] bg-[#f1f3f4] text-[#5f6368]">{getInitials(counselorUser?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{counselorUser?.name || "Unknown"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[9px] bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#e8f0fe]">
                                {entry.metric} {entry.label}
                              </Badge>
                              <span className="text-[11px] font-semibold text-[#1a1a2e]">{entry.score}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Follow-up Health — Section 7 */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Follow-up Health</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">Actionable follow-up metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Due Today", value: data.followupHealth.dueToday, color: "bg-[#1a73e8]", textColor: "text-[#1a73e8]", bgColor: "bg-[#e8f0fe]" },
                    { label: "Due Tomorrow", value: data.followupHealth.dueTomorrow, color: "bg-[#e8710a]", textColor: "text-[#e8710a]", bgColor: "bg-[#fef7e0]" },
                    { label: "Overdue", value: data.followupHealth.overdue, color: "bg-[#ea4335]", textColor: "text-[#ea4335]", bgColor: "bg-[#fce8e6]" },
                    { label: "Completed Today", value: data.followupHealth.completedToday, color: "bg-[#34a853]", textColor: "text-[#34a853]", bgColor: "bg-[#e6f4ea]" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`w-full p-3 rounded-lg ${item.bgColor} transition-all text-left`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#1a1a2e]">{item.label}</span>
                        <span className={`text-lg font-bold ${item.textColor}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ════════════════════════════════════════
              ENHANCEMENT 6: Daily Targets Widget
              ════════════════════════════════════════ */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#1a73e8]" />
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Daily Targets</CardTitle>
                </div>
                <CardDescription className="text-[10px] text-[#9aa0a6]">
                  {/* TEMPORARY: Hardcoded targets until KPI Settings Studio is built */}
                  Targets: 10 admissions · ₹5L revenue · 120 calls
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Admissions Target */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#1a1a2e]">Admissions</span>
                    <span className="text-[11px] font-semibold text-[#0d652d]">{Math.min(k.admissionsClosed.today, 10)} / 10</span>
                  </div>
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#34a853] transition-all duration-500"
                      style={{ width: `${Math.min((k.admissionsClosed.today / 10) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-[#9aa0a6] mt-1">
                    {10 - Math.min(k.admissionsClosed.today, 10)} remaining today
                  </p>
                </div>
                {/* Revenue Target — ₹5,00,000 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#1a1a2e]">Revenue</span>
                    <span className="text-[11px] font-semibold text-[#1a73e8]">
                      {fmtINR(Math.min(k.revenueGenerated.collected, 500000))} / {fmtINR(500000)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#1a73e8] transition-all duration-500"
                      style={{ width: `${Math.min((k.revenueGenerated.collected / 500000) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-[#9aa0a6] mt-1">
                    {fmtINR(Math.max(500000 - k.revenueGenerated.collected, 0))} remaining
                  </p>
                </div>
                {/* Calls Target — 120 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#1a1a2e]">Calls</span>
                    <span className="text-[11px] font-semibold text-[#e8710a]">{Math.min(k.calls.today, 120)} / 120</span>
                  </div>
                  <div className="h-2.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#fbbc04] transition-all duration-500"
                      style={{ width: `${Math.min((k.calls.today / 120) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-[#9aa0a6] mt-1">
                    {120 - Math.min(k.calls.today, 120)} remaining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════
              SECTION 6 — COLLECTION SNAPSHOT
              ════════════════════════════════════════ */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Collection Snapshot</CardTitle>
                  <CardDescription className="text-[10px] text-[#9aa0a6]">
                    Recovery {data.collectionSnapshot.recoveryPct}% · ₹{data.collectionSnapshot.totalNetPayable.toLocaleString()} net payable
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"
                  onClick={() => navigate("/crm/sales/collections")}>
                  <Landmark className="h-3 w-3 mr-1" /> Open Collection Center
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left — Summary Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-[#e6f4ea]">
                    <p className="text-[10px] text-[#34a853]">Collected</p>
                    <p className="text-lg font-bold text-[#34a853]">{fmtINR(data.collectionSnapshot.collected)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fce8e6]">
                    <p className="text-[10px] text-[#ea4335]">Outstanding</p>
                    <p className="text-lg font-bold text-[#ea4335]">{fmtINR(data.collectionSnapshot.outstanding)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#e8f0fe]">
                    <p className="text-[10px] text-[#1a73e8]">Pending Verification</p>
                    <p className="text-lg font-bold text-[#1a73e8]">{data.collectionSnapshot.pendingVerification}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#fef7e0]">
                    <p className="text-[10px] text-[#e8710a]">Recovery Rate</p>
                    <p className="text-lg font-bold text-[#e8710a]">{data.collectionSnapshot.recoveryPct}%</p>
                  </div>
                </div>

                {/* Right — Top Defaulters */}
                <div>
                  <p className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">Top Defaulters</p>
                  {data.collectionSnapshot.topDefaulters.length === 0 ? (
                    <p className="text-[11px] text-[#9aa0a6] text-center py-4">No defaulters</p>
                  ) : (
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {data.collectionSnapshot.topDefaulters.map((d: any) => {
                        const defUser = data.filters.users.find((u: any) => u._id === d.ownerId);
                        return (
                          <div key={d.leadId} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                            onClick={() => navigate(`/crm/leads/${d.leadId}`)}>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[7px] bg-[#fce8e6] text-[#ea4335]">{d.firstName[0]}{d.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{d.firstName} {d.lastName}</p>
                              <p className="text-[9px] text-[#9aa0a6]">{defUser?.name || "Unassigned"}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-[#ea4335]">{fmtINR(d.balance)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════
              SECTION 8 — BRANCH PERFORMANCE
              ════════════════════════════════════════ */}
          {data.multipleBranches && (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Branch Performance</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">
                  {data.branchPerformance.length} branches with data
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 600 }}>
                    <thead>
                      <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Branch</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Leads</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Admissions</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Revenue</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Collections</th>
                        <th className="text-[9px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.branchPerformance.map((b: any) => (
                        <tr key={b.branchId} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                          <td className="px-3 py-2.5">
                            <span className="text-[12px] font-medium text-[#1a1a2e]">{b.branchName}</span>
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-right text-[#1a1a2e]">{b.totalLeads}</td>
                          <td className="px-3 py-2.5 text-[12px] text-right text-[#0d652d] font-medium">{b.admissions}</td>
                          <td className="px-3 py-2.5 text-[12px] text-right font-medium text-[#1a1a2e]">{fmtINR(b.revenue)}</td>
                          <td className="px-3 py-2.5 text-[12px] text-right font-medium text-[#34a853]">{fmtINR(b.collections)}</td>
                          <td className="px-3 py-2.5 text-[12px] text-right">
                            <Badge className={`text-[9px] ${
                              b.conversion >= 30 ? "bg-[#34a853] text-white"
                              : b.conversion >= 15 ? "bg-[#fbbc04] text-[#1a1a2e]"
                              : "bg-[#f1f3f4] text-[#5f6368]"
                            }`}>
                              {b.conversion}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
