/**
 * FinanceReports — Enterprise Financial Reports Center
 *
 * Consumes registered financePlatform/financeReports report queries for live financial reports.
 * Supports PDF, Excel, CSV export (future-ready).
 * No standalone reporting engine — uses Report Studio patterns.
 */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, FileText, TrendingUp, TrendingDown, PiggyBank, DollarSign,
  Download, Printer, AlertCircle, CheckCircle2, Clock, RefreshCw,
  ArrowRight, Search, Filter, Calendar, Landmark, Wallet, Receipt,
  Banknote, BookOpen, FileSpreadsheet, Loader2, ExternalLink,
} from "lucide-react";

type ReportCardProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  stats?: { label: string; value: string; positive?: boolean }[];
  onClick?: () => void;
  loading?: boolean;
};

function ReportCard({ title, description, icon: Icon, color, stats, onClick, loading }: ReportCardProps) {
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
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${color} shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
              {loading ? (
                <div className="mt-2 space-y-1 animate-pulse">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              ) : stats && stats.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {stats.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{s.label}</span>
                      <span className={`text-[11px] font-semibold ${s.positive === true ? "text-emerald-600" : s.positive === false ? "text-red-600" : "text-foreground"}`}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FinanceReports() {
  const { navigate } = useAppNavigate();

  const revenueReport = useQuery(api.financePlatform.getRevenueReport, {});
  const collectionReport = useQuery(api.financePlatform.getCollectionReport, {});
  const expenseReport = useQuery(api.financePlatform.getExpenseReport, {});
  const outstandingReport = useQuery(api.financeReports.getOutstandingReport, {});
  const dashboard = useQuery(api.financeReports.getFinanceDashboard);

  const reports = [
    {
      id: "revenue",
      title: "Revenue Report",
      description: "Total revenue, invoiced amounts, pending & overdue revenue with collection rate",
      icon: TrendingUp,
      color: "bg-emerald-500",
      stats: revenueReport ? [
        { label: "Total Revenue", value: `₹${revenueReport.totalRevenue.toLocaleString()}`, positive: true },
        { label: "Collection Rate", value: `${revenueReport.collectionRate}%`, positive: revenueReport.collectionRate >= 70 },
      ] : undefined,
      onClick: () => {},
      loading: !revenueReport,
    },
    {
      id: "collection",
      title: "Collection Report",
      description: "Daily, weekly, monthly collections by payment method",
      icon: DollarSign,
      color: "bg-blue-500",
      stats: collectionReport ? [
        { label: "Total Collected", value: `₹${collectionReport.totalCollected.toLocaleString()}`, positive: true },
        { label: "Pending Collections", value: String(collectionReport.pendingCount), positive: collectionReport.pendingCount === 0 },
      ] : undefined,
      onClick: () => navigate("/collections"),
      loading: !collectionReport,
    },
    {
      id: "expense",
      title: "Expense Report",
      description: "Approved expenses by category, total by branch, monthly trends",
      icon: TrendingDown,
      color: "bg-red-500",
      stats: expenseReport ? [
        { label: "Total Approved", value: `₹${expenseReport.totalApproved.toLocaleString()}`, positive: false },
        { label: "Pending Draft", value: `₹${expenseReport.totalDraft.toLocaleString()}` },
      ] : undefined,
      onClick: () => {},
      loading: !expenseReport,
    },
    {
      id: "outstanding",
      title: "Outstanding Report",
      description: "Total outstanding fees, overdue accounts, collection status",
      icon: AlertCircle,
      color: "bg-amber-500",
      stats: outstandingReport ? [
        { label: "Total Outstanding", value: `₹${outstandingReport.totalOutstanding.toLocaleString()}`, positive: false },
        { label: "Active Accounts", value: String(outstandingReport.activeAccounts) },
      ] : undefined,
      onClick: () => navigate("/collections"),
      loading: !outstandingReport,
    },
    {
      id: "pl",
      title: "Profit & Loss",
      description: "Monthly revenue vs expenses, net profit/loss, profit margin",
      icon: BarChart3,
      color: "bg-purple-500",
      stats: dashboard ? [
        { label: "Revenue", value: `₹${(dashboard.monthlyRevenue || 0).toLocaleString()}`, positive: true },
        { label: "Net Profit", value: `₹${(dashboard.monthlyNet || 0).toLocaleString()}`, positive: (dashboard.monthlyNet || 0) >= 0 },
      ] : undefined,
      onClick: () => {},
      loading: !dashboard,
    },
    {
      id: "cashflow",
      title: "Cash Flow",
      description: "Cash inflows, outflows, net position, operating cash balance",
      icon: Wallet,
      color: "bg-teal-500",
      stats: dashboard ? [
        { label: "Cash In", value: `₹${(dashboard.totalCashIn || 0).toLocaleString()}`, positive: true },
        { label: "Cash Out", value: `₹${(dashboard.totalCashOut || 0).toLocaleString()}`, positive: false },
      ] : undefined,
      onClick: () => {},
      loading: !dashboard,
    },
    {
      id: "ledger",
      title: "General Ledger",
      description: "Complete ledger with all journal entries, debits, credits, and running balance",
      icon: BookOpen,
      color: "bg-indigo-500",
      onClick: () => navigate("/finance/ledger"),
    },
    {
      id: "journal",
      title: "Journal Entries",
      description: "All journal entries with posting, reversal, and audit trail",
      icon: FileSpreadsheet,
      color: "bg-violet-500",
      onClick: () => {},
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Assets, liabilities, equity with period comparisons",
      icon: Landmark,
      color: "bg-cyan-500",
      onClick: () => {},
    },
  ];

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
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Financial Reports</h1>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1 ml-9">
            Enterprise financial intelligence • Real-time reports • Export-ready
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-foreground hover:bg-foreground/90 text-background"
            onClick={() => navigate("/finance")}
          >
            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Dashboard
          </Button>
        </div>
      </motion.div>

      {/* ═══ Report Cards Grid ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            title={report.title}
            description={report.description}
            icon={report.icon}
            color={report.color}
            stats={report.stats as any}
            onClick={report.onClick}
            loading={report.loading}
          />
        ))}
      </div>

      {/* ═══ Quick KPIs ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            ₹{(revenueReport?.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {revenueReport?.invoiceCount || 0} invoices
          </p>
        </Card>
        <Card className="border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Collection Rate</p>
          <p className="text-lg font-bold text-blue-600 mt-1">
            {revenueReport?.collectionRate || 0}%
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {revenueReport?.paymentCount || 0} payments
          </p>
        </Card>
        <Card className="border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Pending Revenue</p>
          <p className="text-lg font-bold text-amber-600 mt-1">
            ₹{(revenueReport?.pendingRevenue || 0).toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Awaiting collection</p>
        </Card>
        <Card className="border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Overdue Revenue</p>
          <p className="text-lg font-bold text-red-600 mt-1">
            ₹{(revenueReport?.overdueRevenue || 0).toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Needs attention</p>
        </Card>
      </div>

      {/* ═══ Report Detail Section ═══ */}
      <Tabs defaultValue="revenue" className="mt-2">
        <TabsList className="bg-muted/50 p-0.5">
          <TabsTrigger value="revenue" className="text-xs data-[state=active]:bg-background">Revenue</TabsTrigger>
          <TabsTrigger value="collection" className="text-xs data-[state=active]:bg-background">Collection</TabsTrigger>
          <TabsTrigger value="expense" className="text-xs data-[state=active]:bg-background">Expenses</TabsTrigger>
          <TabsTrigger value="outstanding" className="text-xs data-[state=active]:bg-background">Outstanding</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue Report Details</CardTitle>
              <CardDescription className="text-[10px]">
                Total Invoiced: ₹{(revenueReport?.totalInvoiced || 0).toLocaleString()} |
                Collection Rate: {revenueReport?.collectionRate || 0}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                  <p className="text-xs font-semibold text-emerald-600">₹{(revenueReport?.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Revenue</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                  <p className="text-xs font-semibold text-blue-600">₹{(revenueReport?.totalInvoiced || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Invoiced</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
                  <p className="text-xs font-semibold text-amber-600">₹{(revenueReport?.pendingRevenue || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Pending Revenue</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                  <p className="text-xs font-semibold text-red-600">₹{(revenueReport?.overdueRevenue || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Overdue Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Collection Report</CardTitle>
              <CardDescription className="text-[10px]">
                Total: ₹{(collectionReport?.totalCollected || 0).toLocaleString()} across {collectionReport?.collectionCount || 0} payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectionReport?.byMethod && Object.keys(collectionReport.byMethod).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(collectionReport.byMethod as Record<string, number>).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-[12px] font-medium text-foreground capitalize">{method}</span>
                      <span className="text-[12px] font-semibold text-emerald-600">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No collection data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Expense Report</CardTitle>
              <CardDescription className="text-[10px]">
                Approved: ₹{(expenseReport?.totalApproved || 0).toLocaleString()} — {expenseReport?.approvedCount || 0} expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenseReport?.byCategory && Object.keys(expenseReport.byCategory).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(expenseReport.byCategory as Record<string, number>).map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-[12px] font-medium text-foreground">{cat === "uncategorized" ? "Uncategorized" : cat}</span>
                      <span className="text-[12px] font-semibold text-red-600">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No expense data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding" className="mt-4">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Outstanding Report</CardTitle>
              <CardDescription className="text-[10px]">
                {outstandingReport?.activeAccounts || 0} accounts with outstanding balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
                  <p className="text-xs font-semibold text-amber-600">₹{(outstandingReport?.totalOutstanding || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Outstanding</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                  <p className="text-xs font-semibold text-blue-600">{outstandingReport?.activeAccounts || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Active Accounts</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                  <p className="text-xs font-semibold text-emerald-600">₹{(outstandingReport?.totalPaid || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Paid</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                  <p className="text-xs font-semibold text-red-600">{outstandingReport?.accountsWithOverdue || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Accounts Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
