import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  Users,
  Target,
  TrendingUp,
  DollarSign,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Activity,
  BarChart3,
  Briefcase,
  Code2,
  Settings,
  Building2,
  Database,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  GraduationCap,
  PiggyBank,
  Megaphone,
  MessageSquare,
  FileCheck,
  ShoppingCart,
  BookOpen,
  ListChecks,
  Landmark,
  Shield,
  LineChart,
  UsersRound,
  Sparkles,
  ChevronRight,
  Award,
  Banknote,
  Receipt,
  ClipboardList,
  Crown,
  Layers,
  GitBranch,
  Ticket,
  Headphones,
} from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// ─── Design tokens ───────────────────────────────────────────────
const PIE_COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a855f7"];

// ─── Shared helpers ──────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
  trendUp,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: number;
  trendUp?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-[#e8eaed] p-4 shadow-sm hover:shadow-md hover:border-[#dadce0] hover:-translate-y-0.5 transition-all duration-200 text-left group"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#5f6368]">{label}</p>
          <p className="text-[22px] font-bold text-[#1a1a2e] mt-1 tracking-tight">{value}</p>
          <div className="flex items-center gap-2 mt-1">
            {sub && <p className="text-[10px] text-[#9aa0a6] truncate">{sub}</p>}
            {trend !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                  trendUp ? "text-[#34a853]" : "text-[#ea4335]"
                }`}
              >
                {trendUp ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trend}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color} group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  action,
  actionHref,
}: {
  icon: React.ElementType;
  title: string;
  action?: string;
  actionHref?: string;
}) {
  const { navigate } = useAppNavigate();
  return (
    <div className="px-4 py-3 border-b border-[#f1f3f4] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
          <Icon className="h-3.5 w-3.5 text-[#5f6368]" />
        </div>
        <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{title}</h3>
      </div>
      {action && actionHref && (
        <button
          onClick={() => navigate(actionHref)}
          className="text-[11px] font-medium text-[#1a73e8] hover:text-[#1557b0] flex items-center gap-0.5 transition-colors"
        >
          {action} <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Executive scorecard ring ─────────────────────────────────────
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(score, 0), 100) / 100) * c;
  const color = score >= 75 ? "#34a853" : score >= 50 ? "#fbbc04" : "#ea4335";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3f4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold text-[#1a1a2e] leading-none">{score}</span>
        <span className="text-[9px] text-[#9aa0a6] mt-0.5">Score</span>
      </div>
    </div>
  );
}

// ─── Module link card ─────────────────────────────────────────────
function ModuleLink({
  icon: Icon,
  label,
  desc,
  href,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
  accent: string;
}) {
  const { navigate } = useAppNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="group flex items-center gap-3 p-3 rounded-xl border border-[#e8eaed] bg-white hover:shadow-md hover:border-[#dadce0] hover:-translate-y-0.5 transition-all duration-200 text-left"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent} group-hover:scale-105 transition-transform`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1a1a2e]">{label}</p>
        <p className="text-[10px] text-[#9aa0a6] truncate">{desc}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[#dadce0] group-hover:text-[#1a73e8] group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-52 bg-[#f1f3f4] rounded-md animate-pulse" />
          <div className="h-4 w-72 bg-[#f1f3f4] rounded-md animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-[#f1f3f4] rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[104px] bg-[#f1f3f4] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-[#f1f3f4] rounded-xl animate-pulse" />
        <div className="h-64 bg-[#f1f3f4] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function DashboardCEO() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const userId = user?._id as string | undefined;

  // ── Data ──
  const overview = useQuery(api.dashboardEngine.getEnterpriseOverview, {});
  const financeKpis = useQuery(api.financePlatform.getFinanceDashboardKPIs);
  const scorecard = useQuery(api.kpiEngine.getExecutiveScorecard, {});
  const branchCmp = useQuery(api.dashboardEngine.getBranchComparison, {});
  const leaderboard = useQuery(api.dashboardEngine.getLeaderboardWidget, {
    metric: "revenue",
    limit: 5,
  });
  const quickActions = useQuery(api.dashboardEngine.getQuickActions, { role: "super_admin" });
  const tasks = useQuery(api.tasks.listTasks, {});
  const notifications = useQuery(
    api.notifications.listNotifications,
    userId ? { userId: userId as any, limit: 20 } : "skip"
  );
  const activities = useQuery(api.timelineEngine.getRecentTimeline, { limit: 10 });

  const isLoading = !overview || !financeKpis || !scorecard;

  // ── Derived metrics ──
  const derived = useMemo(() => {
    const revenue = financeKpis?.totalRevenue ?? overview?.totalRevenue ?? 0;
    const collected = financeKpis?.totalPaid ?? 0;
    const outstanding = financeKpis?.totalOutstanding ?? overview?.outstandingFees ?? 0;
    const collectionRate = overview?.collectionRate ?? 0;
    const overdue = financeKpis?.overdueAmount ?? 0;
    const expenses = financeKpis?.totalExpenses ?? 0;
    const refunds = financeKpis?.totalRefunded ?? 0;
    const hotLeads = 0; // computed below from raw list when available

    return { revenue, collected, outstanding, collectionRate, overdue, expenses, refunds };
  }, [financeKpis, overview]);

  // Lead source — raw query fallback not used to avoid extra load; use overview counts
  const totalStudents = overview?.totalStudents ?? 0;
  const activeStudents = overview?.activeStudents ?? 0;
  const totalLeads = overview?.totalLeads ?? 0;
  const activeUsers = overview?.activeUsers ?? 0;
  const branchesCount = overview?.branches ?? 0;
  const companiesCount = overview?.companies ?? 0;
  const pendingTasks =
    tasks?.filter(
      (t: any) => !["done", "completed", "cancelled", "archived"].includes(t.status)
    ).length ?? 0;
  const overdueTasks =
    tasks?.filter(
      (t: any) =>
        !["done", "completed", "cancelled", "archived"].includes(t.status) &&
        t.dueDate &&
        new Date(t.dueDate).getTime() < Date.now()
    ).length ?? 0;
  const unreadNotifs = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  // Scorecard categories
  const scorecardCategories = useMemo(() => {
    if (!scorecard?.scorecard) return [];
    return Object.entries(scorecard.scorecard as Record<string, any>).map(([cat, val]: any) => ({
      category: cat,
      score: val?.score ?? 0,
      metricCount: val?.metrics?.length ?? 0,
    }));
  }, [scorecard]);

  // Branch chart data
  const branchChart = useMemo(() => {
    const rows = branchCmp?.branches ?? [];
    return rows.map((b: any) => ({
      name: b.branchCode || b.branchName?.slice(0, 8) || "Branch",
      revenue: Math.round((b.metrics?.revenue ?? 0) / 1000), // in thousands
      students: b.metrics?.studentCount ?? 0,
    }));
  }, [branchCmp]);

  // Finance donut data
  const financeDonut = useMemo(() => {
    const data = [
      { name: "Collected", value: Math.round(derived.collected) },
      { name: "Outstanding", value: Math.round(derived.outstanding) },
      { name: "Expenses", value: Math.round(derived.expenses) },
      { name: "Refunds", value: Math.round(derived.refunds) },
    ];
    const hasData = data.some((d) => d.value > 0);
    return { data, hasData };
  }, [derived]);

  // Leaderboard medals
  const medalColors = ["bg-[#fbbc04]", "bg-[#9aa0a6]", "bg-[#e8710a]"];

  // Quick action icon map
  const actionIcons: Record<string, React.ElementType> = {
    UserPlus, Banknote, ListChecks, ClipboardList, BookOpen, BarChart3,
    Megaphone, Receipt, FileCheck, Users, Settings, PiggyBank,
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = [
    {
      icon: DollarSign,
      label: "Revenue (AED)",
      value: derived.revenue.toLocaleString(),
      sub: `${derived.collected.toLocaleString()} collected`,
      color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]",
      onClick: () => navigate("/finance"),
    },
    {
      icon: TrendingUp,
      label: "Collection Rate",
      value: `${derived.collectionRate}%`,
      sub: `${financeKpis?.invoiceCount ?? 0} invoices`,
      color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]",
      onClick: () => navigate("/collections"),
    },
    {
      icon: AlertCircle,
      label: "Outstanding (AED)",
      value: derived.outstanding.toLocaleString(),
      sub: `${derived.overdue.toLocaleString()} overdue`,
      color: "bg-gradient-to-br from-[#ea4335] to-[#d93025]",
      onClick: () => navigate("/finance"),
    },
    {
      icon: GraduationCap,
      label: "Students",
      value: totalStudents,
      sub: `${activeStudents} active`,
      color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]",
      onClick: () => navigate("/students"),
    },
    {
      icon: Target,
      label: "Leads",
      value: totalLeads,
      sub: `${activeUsers} active users`,
      color: "bg-gradient-to-br from-[#fbbc04] to-[#f29900]",
      onClick: () => navigate("/crm/leads"),
    },
    {
      icon: ListChecks,
      label: "Pending Tasks",
      value: pendingTasks,
      sub: `${overdueTasks} overdue`,
      color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]",
      onClick: () => navigate("/tasks"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1a1a2e] shadow-sm">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#1a1a2e]">
              Welcome, {user?.name?.split(" ")[0] || "CEO"}
            </h1>
            <p className="text-[12px] text-[#5f6368] mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")} · Enterprise Executive Overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/control")}
            className="h-8 px-3 rounded-lg bg-[#1a1a2e] text-white text-[11px] font-medium hover:bg-[#2d2d4a] transition-colors flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" /> Command Center
          </button>
          <button
            onClick={() => navigate("/analytics")}
            className="h-8 px-3 rounded-lg border border-[#e8eaed] bg-white text-[#1a1a2e] text-[11px] font-medium hover:bg-[#f8f9fa] transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#1a73e8]" /> Full Analytics
          </button>
        </div>
      </div>

      {/* ─── KPI Matrix ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <KpiCard key={i} {...stat} />
        ))}
      </div>

      {/* ─── Secondary strip ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Building2, label: "Companies", value: companiesCount, color: "bg-[#e8f0fe] text-[#1a73e8]" },
          { icon: GitBranch, label: "Branches", value: branchesCount, color: "bg-[#e6f4ea] text-[#34a853]" },
          { icon: UsersRound, label: "Departments", value: overview?.activeUsers ?? 0, color: "bg-[#f3e8ff] text-[#a855f7]" },
          { icon: CheckCircle2, label: "Unread Alerts", value: unreadNotifs, color: "bg-[#fce8e6] text-[#ea4335]" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-[#e8eaed] p-3 flex items-center gap-3 shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#1a1a2e] leading-none">{c.value}</p>
                <p className="text-[10px] text-[#5f6368] mt-0.5">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Scorecard + Charts ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Executive scorecard */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm">
          <PanelHeader
            icon={Award}
            title="Executive Scorecard"
            action="KPI Studio"
            actionHref="/studios/master-data"
          />
          <div className="p-4 flex items-center gap-5">
            <ScoreRing score={scorecard?.overallScore ?? 0} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#5f6368]">
                Period:{" "}
                <span className="font-medium text-[#1a1a2e]">
                  {scorecard?.period ? format(new Date(scorecard.period + "-01"), "MMM yyyy") : "—"}
                </span>
              </p>
              <p className="text-[10px] text-[#9aa0a6] mt-1">
                {scorecard?.gradedKpis ?? 0} active KPIs graded across{" "}
                {scorecardCategories.length} categories
              </p>
            </div>
          </div>
          <div className="px-4 pb-4 space-y-2.5">
            {scorecardCategories.slice(0, 4).map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-[#5f6368] capitalize">{c.category}</span>
                  <span className="text-[10px] font-semibold text-[#1a1a2e]">{c.score}</span>
                </div>
                <div className="h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      c.score >= 75 ? "bg-[#34a853]" : c.score >= 50 ? "bg-[#fbbc04]" : "bg-[#ea4335]"
                    }`}
                    style={{ width: `${Math.min(c.score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {scorecardCategories.length === 0 && (
              <p className="text-[10px] text-[#9aa0a6] text-center py-3">
                No KPI categories configured yet
              </p>
            )}
          </div>
        </div>

        {/* Branch comparison chart */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm">
          <PanelHeader
            icon={Landmark}
            title="Branch Performance (Revenue ₹k)"
            action="Compare"
            actionHref="/analytics"
          />
          <div className="p-4">
            {branchChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={branchChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9aa0a6" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#9aa0a6" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e8eaed" }}
                    formatter={(v: any) => [`${v}k`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#4285f4" maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[11px] text-[#9aa0a6]">
                No branch data available
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#f1f3f4]">
              <div>
                <p className="text-[10px] text-[#5f6368]">Branches</p>
                <p className="text-[14px] font-bold text-[#1a1a2e]">{branchCmp?.totalBranches ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#5f6368]">Avg Students</p>
                <p className="text-[14px] font-bold text-[#1a1a2e]">{branchCmp?.avgStudents ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#5f6368]">Avg Revenue</p>
                <p className="text-[14px] font-bold text-[#1a1a2e]">
                  {(branchCmp?.avgRevenue ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Finance distribution donut */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm">
          <PanelHeader icon={PiggyBank} title="Finance Position" action="Finance" actionHref="/finance" />
          <div className="p-4">
            {financeDonut.hasData ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={financeDonut.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {financeDonut.data.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e8eaed" }}
                    formatter={(v: any) => [`AED ${Number(v).toLocaleString()}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[11px] text-[#9aa0a6]">
                No finance data yet
              </div>
            )}
            <div className="space-y-1.5 mt-3 pt-3 border-t border-[#f1f3f4]">
              {financeDonut.data.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-[#5f6368]">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-[#1a1a2e]">
                    {d.value === 0 ? "—" : `AED ${d.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Leaderboard + Tasks + Activity ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm">
          <PanelHeader
            icon={Award}
            title="Top Revenue Performers"
            action="People"
            actionHref="/people"
          />
          <div className="divide-y divide-[#f1f3f4] max-h-[320px] overflow-y-auto">
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((p: any, i: number) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                      medalColors[i] || "bg-[#f1f3f4] text-[#5f6368]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{p.name}</p>
                    <p className="text-[9px] text-[#9aa0a6]">{p.label}</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#1a1a2e]">
                    {Math.round(p.score).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[11px] text-[#9aa0a6]">No leaderboard data</div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm">
          <PanelHeader icon={ListChecks} title="Open Tasks" action="All Tasks" actionHref="/tasks" />
          <div className="divide-y divide-[#f1f3f4] max-h-[320px] overflow-y-auto">
            {tasks && pendingTasks > 0 ? (
              (tasks as any[])
                .filter((t) => !["done", "completed", "cancelled", "archived"].includes(t.status))
                .slice(0, 7)
                .map((t, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/tasks/${t._id}`)}
                    className="w-full px-4 py-2.5 flex items-start gap-2.5 hover:bg-[#f8f9fa] transition-colors text-left"
                  >
                    <div
                      className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        ["in_progress", "open", "pending"].includes(t.status)
                          ? "bg-[#fbbc04]"
                          : t.priority === "high" || t.priority === "critical"
                          ? "bg-[#ea4335]"
                          : "bg-[#4285f4]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{t.title}</p>
                      <p className="text-[9px] text-[#9aa0a6] mt-0.5 capitalize">
                        {t.priority || "normal"}
                        {t.dueDate ? ` · due ${format(new Date(t.dueDate), "MMM d")}` : ""}
                      </p>
                    </div>
                    <span className="text-[9px] text-[#9aa0a6] capitalize shrink-0">
                      {t.status?.replace(/_/g, " ")}
                    </span>
                  </button>
                ))
            ) : (
              <div className="px-4 py-8 text-center text-[11px] text-[#9aa0a6]">No open tasks</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm">
          <PanelHeader
            icon={Activity}
            title="Recent Activity"
            action="Timeline"
            actionHref="/workflow-monitor"
          />
          <div className="divide-y divide-[#f1f3f4] max-h-[320px] overflow-y-auto">
            {activities && activities.length > 0 ? (
              activities.slice(0, 8).map((a: any, i: number) => (
                <div key={i} className="px-4 py-2.5 flex items-start gap-2.5">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0">
                    <Activity className="h-2.5 w-2.5 text-[#1a73e8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#1a1a2e] truncate">
                      {a.description || a.eventType || a.action || "Activity"}
                    </p>
                    <p className="text-[9px] text-[#9aa0a6] mt-0.5">
                      {a.createdAt
                        ? format(new Date(a.createdAt), "MMM d, h:mm a")
                        : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[11px] text-[#9aa0a6]">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Quick Actions ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
              <Sparkles className="h-3.5 w-3.5 text-[#5f6368]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Quick Actions</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {(quickActions ?? []).slice(0, 10).map((a: any) => {
            const Icon = actionIcons[a.icon] || ArrowRight;
            return (
              <button
                key={a.id}
                onClick={() => navigate(a.href)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e8eaed] bg-white hover:shadow-md hover:border-[#dadce0] hover:-translate-y-0.5 transition-all duration-200 text-left group"
              >
                <div className="p-1.5 rounded-lg bg-[#e8f0fe] group-hover:bg-[#d2e3fc] transition-colors shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#1a73e8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#1a1a2e] truncate">{a.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Module Links ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
              <Layers className="h-3.5 w-3.5 text-[#5f6368]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Module Navigator</h3>
          </div>
          <span className="text-[10px] text-[#9aa0a6]">{branchesCount} branches · {companiesCount} companies</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
          <ModuleLink icon={PiggyBank} label="Finance" desc="Invoices, PDC, refunds" href="/finance" accent="bg-[#34a853]" />
          <ModuleLink icon={Users} label="CRM & Leads" desc="Pipeline, follow-ups" href="/crm/leads" accent="bg-[#1a73e8]" />
          <ModuleLink icon={LineChart} label="Sales" desc="Opportunities, quotes" href="/crm/sales" accent="bg-[#fbbc04]" />
          <ModuleLink icon={GraduationCap} label="Students" desc="360° profiles" href="/students" accent="bg-[#a855f7]" />
          <ModuleLink icon={BookOpen} label="Academic" desc="Programs, batches" href="/academic" accent="bg-[#e8710a]" />
          <ModuleLink icon={UsersRound} label="People" desc="Registry & profiles" href="/people" accent="bg-[#4285f4]" />
          <ModuleLink icon={Briefcase} label="Employees" desc="HR lifecycle" href="/employees" accent="bg-[#ec407a]" />
          <ModuleLink icon={FileCheck} label="Examinations" desc="Sessions & results" href="/examinations" accent="bg-[#1a73e8]" />
          <ModuleLink icon={BookOpen} label="LMS" desc="Courses & lessons" href="/lms" accent="bg-[#7c3aed]" />
          <ModuleLink icon={ShoppingCart} label="Procurement" desc="Vendors, inventory" href="/procurement" accent="bg-[#0f9d58]" />
          <ModuleLink icon={Megaphone} label="Marketing" desc="Campaigns" href="/marketing/campaigns" accent="bg-[#f29900]" />
          <ModuleLink icon={MessageSquare} label="Messenger" desc="DM & channels" href="/messenger" accent="bg-[#4285f4]" />
          <ModuleLink icon={Calendar} label="Scheduling" desc="Timetables & rooms" href="/scheduling" accent="bg-[#5f6368]" />
          <ModuleLink icon={Ticket} label="Support" desc="Tickets & agents" href="/support" accent="bg-[#e8710a]" />
          <ModuleLink icon={Headphones} label="Knowledge" desc="Knowledge base" href="/knowledge" accent="bg-[#a855f7]" />
          <ModuleLink icon={Building2} label="Organization" desc="Hierarchy studio" href="/org" accent="bg-[#1a73e8]" />
          <ModuleLink icon={Database} label="Master Data" desc="All masters CRUD" href="/studios/master-data" accent="bg-[#34a853]" />
          <ModuleLink icon={Code2} label="Platform Studio" desc="Developer intelligence" href="/platform-studio" accent="bg-[#1a1a2e]" />
          <ModuleLink icon={Shield} label="Security" desc="Access & policies" href="/security" accent="bg-[#ea4335]" />
          <ModuleLink icon={LayoutDashboard} label="Governance" desc="Board & verticals" href="/governance" accent="bg-[#7c3aed]" />
        </div>
      </div>
    </div>
  );
}
