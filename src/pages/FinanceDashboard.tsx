/**
 * Enterprise Finance Dashboard — Executive Financial Intelligence
 *
 * Consumes the Finance Platform backend (financePlatform, financeReports,
 * financeEngine, feeEngine). Uses SDK patterns for data access.
 * No duplicated finance logic.
 */
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, PiggyBank, FileText, Receipt,
  Banknote, CreditCard, Calendar, AlertCircle, CheckCircle2, Clock,
  ArrowRight, RefreshCw, Landmark, Target, Building2, Wallet, BarChart3,
  PlusCircle, ListChecks, ExternalLink, Database, Search, Download,
  Printer, Filter, ChevronRight, Loader2, BookOpen, FileSpreadsheet,
  PieChart, Activity, HandCoins, ReceiptText, ChartNoAxesCombined,
  ArrowUpRight, ArrowDownRight, Grip, Layers,
} from "lucide-react";

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({
  title, value, subtitle, icon: Icon, color, trend, onClick, loading,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string;
  trend?: { label: string; positive: boolean };
  onClick?: () => void; loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="border-border/50 bg-card hover:shadow-sm hover:border-border/80 transition-all duration-200 cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-28 bg-muted rounded" />
              <div className="h-2 w-16 bg-muted rounded" />
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
                <p className="text-xl font-semibold text-foreground tracking-tight">{value}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
                {trend && (
                  <p className={`text-[10px] flex items-center gap-0.5 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
                    {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.label}
                  </p>
                )}
              </div>
              <div className={`p-2.5 rounded-xl ${color} shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Quick Action Tile ──────────────────────────────────────────
function QuickAction({
  icon: Icon, label, desc, color, onClick,
}: {
  icon: React.ElementType; label: string; desc: string; color: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 flex-col items-start gap-1.5 text-left border-border/60 hover:bg-accent/50 hover:border-border transition-all"
      onClick={onClick}
    >
      <div className={`p-1.5 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-[11px] font-medium text-foreground">{label}</span>
      <span className="text-[9px] text-muted-foreground">{desc}</span>
    </Button>
  );
}

// ─── Mini Transaction Row ───────────────────────────────────────
function TransactionRow({
  refNum, student, amount, status, date, method,
}: {
  refNum: string; student: string; amount: string; status: string;
  date: string; method?: string;
}) {
  const statusColors: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400",
    overdue: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === "verified" || status === "completed" ? "bg-emerald-500" : status === "pending" ? "bg-amber-500" : "bg-red-500"}`} />
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-foreground truncate">{student}</p>
          <p className="text-[10px] text-muted-foreground">{refNum} • {method || "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[12px] font-semibold text-foreground">{amount}</span>
        <Badge className={`text-[9px] px-1.5 py-0 h-4 font-normal ${statusColors[status] || "bg-slate-100 text-slate-600"}`}>
          {status}
        </Badge>
      </div>
    </div>
  );
}

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();

  const dashboard = useQuery(api.financeReports.getFinanceDashboard);
  const dailyCollection = useQuery(api.financeReports.getDailyCollectionReport, {});
  const outstandingReport = useQuery(api.financeReports.getOutstandingReport, {});
  const profitSummary = useQuery(api.financeReports.getProfitSummary, {});
  const platformKPIs = useQuery(api.financePlatform.getFinanceDashboardKPIs);
  const recentPayments = useQuery(api.financePlatform.listPaymentsPaginated, { limit: 10 });
  const recentInvoices = useQuery(api.financePlatform.listInvoicesPaginated, { limit: 10 });
  const recentExpenses = useQuery(api.financePlatform.listExpensesPaginated, { limit: 10 });

  const isLoading = !dashboard;

  const kpis = dashboard ? {
    revenue: dashboard.monthlyRevenue || 0,
    collection: dashboard.todayCollection || 0,
    outstanding: dashboard.totalOutstanding || dashboard.overdueAmount || 0,
    expenses: dashboard.monthlyExpense || 0,
    cashBalance: dashboard.cashBalance || 0,
    pending: dashboard.todayPending || 0,
    netProfit: typeof dashboard.monthlyNet === "number" ? dashboard.monthlyNet : (dashboard.monthlyRevenue || 0) - (dashboard.monthlyExpense || 0),
    collectionRate: dashboard.monthlyRevenue > 0
      ? Math.round((dashboard.monthlyRevenue / ((dashboard.monthlyRevenue || 0) + (dashboard.pendingInvoiceAmount || 0))) * 100)
      : 0,
  } : null;

  const revenueData: { period: string; revenue: number; expense: number }[] = [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Finance & Accounting</h1>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1 ml-9">
            Enterprise financial intelligence • Revenue • Collections • Expenses • Reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => navigate("/collections")}
          >
            <Database className="h-3.5 w-3.5 mr-1" /> Collections
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => navigate("/finance/reports")}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Reports
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-foreground hover:bg-foreground/90 text-background"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* ═══ Executive KPI Cards ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard
          title="Today's Collection"
          value={`₹${kpis?.collection.toLocaleString() || 0}`}
          subtitle={`${dashboard?.todayCount || 0} transactions`}
          icon={DollarSign}
          color="bg-emerald-500"
          onClick={() => navigate("/collections")}
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${kpis?.revenue.toLocaleString() || 0}`}
          subtitle={`Net: ${kpis && kpis.netProfit >= 0 ? "+" : ""}₹${(kpis?.netProfit || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-blue-500"
          trend={kpis ? { label: kpis.netProfit >= 0 ? "Profitable" : "Loss", positive: kpis.netProfit >= 0 } : undefined}
        />
        <StatCard
          title="Total Outstanding"
          value={`₹${kpis?.outstanding.toLocaleString() || 0}`}
          subtitle={`${dashboard?.totalAccounts || 0} fee accounts`}
          icon={AlertCircle}
          color="bg-amber-500"
        />
        <StatCard
          title="Cash Balance"
          value={`₹${kpis?.cashBalance.toLocaleString() || 0}`}
          subtitle={`Collection rate: ${kpis?.collectionRate || 0}%`}
          icon={Wallet}
          color="bg-purple-500"
        />
      </motion.div>

      {/* ═══ Second Row KPIs ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard
          title="Pending Today"
          value={`₹${kpis?.pending.toLocaleString() || 0}`}
          subtitle="Awaiting verification"
          icon={Clock}
          color="bg-orange-500"
        />
        <StatCard
          title="Monthly Expenses"
          value={`₹${kpis?.expenses.toLocaleString() || 0}`}
          subtitle="Approved & paid"
          icon={TrendingDown}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Invoices"
          value={dashboard?.pendingInvoices || 0}
          subtitle={`₹${(dashboard?.pendingInvoiceAmount || 0).toLocaleString()}`}
          icon={FileText}
          color="bg-indigo-500"
        />
        <StatCard
          title="Overdue Amount"
          value={`₹${(dashboard?.overdueInvoiceAmount || dashboard?.overdueAmount || 0).toLocaleString()}`}
          subtitle={`${dashboard?.overdueInvoices || 0} invoices overdue`}
          icon={AlertCircle}
          color="bg-red-500"
          trend={{ label: "Needs attention", positive: false }}
        />
      </motion.div>

      {/* ═══ Quick Actions ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2"
      >
        <QuickAction
          icon={Banknote} label="Record Payment"
          desc="Receive & verify payments" color="bg-emerald-500"
          onClick={() => navigate("/collections")}
        />
        <QuickAction
          icon={Receipt} label="Generate Invoice"
          desc="Create fee invoices" color="bg-blue-500"
        />
        <QuickAction
          icon={PlusCircle} label="Add Expense"
          desc="Record new expense" color="bg-amber-500"
        />
        <QuickAction
          icon={BarChart3} label="Finance Reports"
          desc="P&L, Cash Flow, Balance Sheet" color="bg-purple-500"
          onClick={() => navigate("/finance/reports")}
        />
      </motion.div>

      {/* ═══ Main Content Tabs ═══ */}
      <Tabs defaultValue="overview" className="mt-2">
        <TabsList className="bg-muted/50 p-0.5">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs data-[state=active]:bg-background">Transactions</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs data-[state=active]:bg-background">Invoices</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs data-[state=active]:bg-background">Expenses</TabsTrigger>
          <TabsTrigger value="outstanding" className="text-xs data-[state=active]:bg-background">Outstanding</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue vs Expense */}
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Monthly Summary</CardTitle>
                    <CardDescription className="text-[10px]">Revenue vs Expenses</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" /> This Month
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] text-muted-foreground">Revenue</span>
                      </div>
                      <span className="text-[13px] font-semibold text-emerald-600">₹{kpis?.revenue.toLocaleString() || 0}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((kpis?.revenue || 0) / ((kpis?.revenue || 0) + (kpis?.expenses || 0) || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[11px] text-muted-foreground">Expenses</span>
                      </div>
                      <span className="text-[13px] font-semibold text-red-600">₹{kpis?.expenses.toLocaleString() || 0}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((kpis?.expenses || 0) / ((kpis?.revenue || 0) + (kpis?.expenses || 0) || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Net Profit / Loss</span>
                    <span className={`text-[15px] font-bold ${(kpis?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {(kpis?.netProfit || 0) >= 0 ? "+" : ""}₹{(kpis?.netProfit || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {kpis && kpis.revenue > 0
                      ? `Profit margin: ${Math.round(((kpis.netProfit) / kpis.revenue) * 100)}%`
                      : "No revenue recorded"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Breakdown */}
            <Card className="border-border/50 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Outstanding Breakdown</CardTitle>
                    <CardDescription className="text-[10px]">Fee collection status</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => navigate("/collections")}>
                    View All <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Current Outstanding", amount: dashboard?.totalOutstanding || dashboard?.overdueAmount || 0, color: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
                    { label: "Overdue Amount", amount: dashboard?.overdueAmount || 0, color: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
                    { label: "Pending Invoices", amount: dashboard?.pendingInvoiceAmount || 0, color: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
                    { label: "Overdue Invoices", amount: dashboard?.overdueInvoiceAmount || 0, color: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
                  ].map((item) => {
                    const total = (dashboard?.totalOutstanding || 0) + (dashboard?.pendingInvoiceAmount || 0);
                    const pct = total > 0 ? (item.amount / total) * 100 : 0;
                    return (
                      <div key={item.label} className={`p-2.5 rounded-lg ${item.bg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-foreground">₹{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform KPIs */}
          {platformKPIs && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-border/50 bg-card p-3">
                <p className="text-[10px] text-muted-foreground">Collection Rate</p>
                <p className="text-lg font-bold text-emerald-600">{platformKPIs.collectionRate}%</p>
              </Card>
              <Card className="border-border/50 bg-card p-3">
                <p className="text-[10px] text-muted-foreground">Active Accounts</p>
                <p className="text-lg font-bold text-blue-600">{platformKPIs.activeAccounts}</p>
              </Card>
              <Card className="border-border/50 bg-card p-3">
                <p className="text-[10px] text-muted-foreground">Pending Expenses</p>
                <p className="text-lg font-bold text-amber-600">{platformKPIs.pendingExpenses}</p>
              </Card>
              <Card className="border-border/50 bg-card p-3">
                <p className="text-[10px] text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-bold text-purple-600">₹{platformKPIs.totalInvoiced.toLocaleString()}</p>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── TRANSACTIONS ── */}
        <TabsContent value="transactions" className="space-y-4 mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
                  <CardDescription className="text-[10px]">Latest payment transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => navigate("/collections")}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {recentPayments?.items?.length ? (
                <div className="divide-y divide-border/30">
                  {recentPayments.items.slice(0, 8).map((txn: any, i: number) => (
                    <TransactionRow
                      key={txn._id || i}
                      refNum={txn.transactionNumber || `#${String(txn._id).slice(-6)}`}
                      student={txn.studentId || "Student"}
                      amount={`₹${(txn.amount || 0).toLocaleString()}`}
                      status={txn.status || "pending"}
                      date={txn.paymentDate ? new Date(txn.paymentDate).toLocaleDateString() : "—"}
                      method={txn.paymentMethod}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Banknote className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INVOICES ── */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
                  <CardDescription className="text-[10px]">Latest fee invoices</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px]">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {recentInvoices?.items?.length ? (
                <div className="divide-y divide-border/30">
                  {recentInvoices.items.slice(0, 8).map((inv: any, i: number) => (
                    <TransactionRow
                      key={inv._id || i}
                      refNum={inv.invoiceNumber || `#${String(inv._id).slice(-6)}`}
                      student={inv.studentId || "Student"}
                      amount={`₹${(inv.totalAmount || 0).toLocaleString()}`}
                      status={inv.status || "pending"}
                      date={inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—"}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No invoices yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXPENSES ── */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle>
                  <CardDescription className="text-[10px]">Latest expense records</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px]">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {recentExpenses?.items?.length ? (
                <div className="divide-y divide-border/30">
                  {recentExpenses.items.slice(0, 8).map((exp: any, i: number) => (
                    <TransactionRow
                      key={exp._id || i}
                      refNum={exp.description?.slice(0, 40) || `Expense #${i + 1}`}
                      student={exp.createdByName || "User"}
                      amount={`₹${(exp.amount || 0).toLocaleString()}`}
                      status={exp.status || "draft"}
                      date={exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : "—"}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No expense records yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── OUTSTANDING ── */}
        <TabsContent value="outstanding" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              title="Total Outstanding"
              value={`₹${(dashboard?.totalOutstanding || 0).toLocaleString()}`}
              subtitle={`${dashboard?.totalAccounts || 0} accounts`}
              icon={AlertCircle} color="bg-amber-500"
            />
            <StatCard
              title="Overdue Amount"
              value={`₹${(dashboard?.overdueAmount || 0).toLocaleString()}`}
              subtitle="Critical" icon={AlertCircle} color="bg-red-500"
            />
            <StatCard
              title="Pending Invoices"
              value={dashboard?.pendingInvoices || 0}
              subtitle={`₹${(dashboard?.pendingInvoiceAmount || 0).toLocaleString()}`}
              icon={FileText} color="bg-indigo-500"
            />
            <StatCard
              title="Overdue Invoices"
              value={dashboard?.overdueInvoices || 0}
              subtitle={`₹${(dashboard?.overdueInvoiceAmount || 0).toLocaleString()}`}
              icon={Clock} color="bg-orange-500"
            />
          </div>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Fee Collection Analysis</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Track fee collections, overdue accounts, and collection efficiency
              </p>
              <Button size="sm" className="h-8 text-[11px]" onClick={() => navigate("/collections")}>
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Collection Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ Finance Module Navigation ═══ */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Finance Modules</CardTitle>
          <CardDescription className="text-[10px]">Quick access to all finance workspaces</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {[
              { icon: Receipt, label: "Invoices", desc: "Fee invoices", color: "bg-blue-500", onClick: () => {} },
              { icon: Banknote, label: "Payments", desc: "Transactions", color: "bg-emerald-500", onClick: () => navigate("/collections") },
              { icon: ReceiptText, label: "Expenses", desc: "Record expenses", color: "bg-orange-500" },
              { icon: BookOpen, label: "Ledger", desc: "General ledger", color: "bg-purple-500", onClick: () => navigate("/finance/ledger") },
              { icon: FileSpreadsheet, label: "Journals", desc: "Journal entries", color: "bg-indigo-500" },
              { icon: Target, label: "Budgets", desc: "Budget management", color: "bg-cyan-500" },
              { icon: Landmark, label: "Assets", desc: "Fixed assets", color: "bg-rose-500" },
              { icon: BarChart3, label: "Reports", desc: "Financial reports", color: "bg-violet-500", onClick: () => navigate("/finance/reports") },
              { icon: Wallet, label: "Cash Book", desc: "Cash management", color: "bg-teal-500" },
              { icon: Activity, label: "Tax", desc: "Tax management", color: "bg-slate-500" },
            ].map((mod) => (
              <Button
                key={mod.label}
                variant="outline"
                className="h-auto py-2.5 flex-col items-center gap-1 text-center border-border/60 hover:bg-accent/50"
                onClick={mod.onClick}
              >
                <div className={`p-1.5 rounded-lg ${mod.color}`}>
                  <mod.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-medium text-foreground">{mod.label}</span>
                <span className="text-[8px] text-muted-foreground">{mod.desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Quick Summary Cards ═══ */}
      {outstandingReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-medium text-foreground">Collection Summary</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Total Collected</span>
                <span className="font-semibold">₹{outstandingReport.totalPaid?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold text-amber-600">₹{outstandingReport.totalOutstanding?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Total Fee</span>
                <span className="font-semibold">₹{outstandingReport.totalFee?.toLocaleString() || "0"}</span>
              </div>
            </div>
          </Card>

          <Card className="border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-[11px] font-medium text-foreground">Profit Summary</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-semibold text-emerald-600">₹{(profitSummary?.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-semibold text-red-600">₹{(profitSummary?.totalExpenses || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Net Profit</span>
                <span className={`font-semibold ${(profitSummary?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  ₹{(profitSummary?.netProfit || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-[11px] font-medium text-foreground">Daily Collection</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Today Collected</span>
                <span className="font-semibold text-emerald-600">₹{dailyCollection?.totalCollected?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-semibold">{dailyCollection?.count || 0}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-amber-600">{dailyCollection?.pendingCount || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
