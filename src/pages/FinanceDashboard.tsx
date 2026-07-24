import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  FileText,
  Receipt,
  Banknote,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Landmark,
  Target,
  Building2,
  Wallet,
  BarChart3,
  PlusCircle,
  ListChecks,
  ExternalLink,
  Database,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { label: string; positive: boolean };
  onClick?: () => void;
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
            {trend && (
              <p className={`text-[10px] flex items-center gap-0.5 ${trend.positive ? "text-[#34a853]" : "text-[#ea4335]"}`}>
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.label}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();

  const dashboard = useQuery(api.financeReports.getFinanceDashboard);
  const dailyCollection = useQuery(api.financeReports.getDailyCollectionReport, {});
  const outstandingReport = useQuery(api.financeReports.getOutstandingReport, {});
  const profitSummary = useQuery(api.financeReports.getProfitSummary, {});

  const isLoading = !dashboard;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Finance & Accounting</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Organization-wide financial intelligence & operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
            onClick={() => navigate("/collections")}
          >
            <Database className="h-3.5 w-3.5 mr-1" /> Collections
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="text-[12px] data-[state=active]:bg-white">Revenue</TabsTrigger>
          <TabsTrigger value="expenses" className="text-[12px] data-[state=active]:bg-white">Expenses</TabsTrigger>
          <TabsTrigger value="outstanding" className="text-[12px] data-[state=active]:bg-white">Outstanding</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════
           OVERVIEW TAB
           ════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Top-level metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Today's Collection"
              value={`₹${dashboard.todayCollection.toLocaleString()}`}
              subtitle={`${dashboard.todayCount} transactions`}
              icon={DollarSign}
              color="bg-[#34a853]"
              onClick={() => navigate("/collections")}
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${dashboard.monthlyRevenue.toLocaleString()}`}
              subtitle={`₹${dashboard.monthlyNet >= 0 ? "+" : ""}${dashboard.monthlyNet.toLocaleString()} net`}
              icon={TrendingUp}
              color="bg-[#1a73e8]"
              trend={{
                label: dashboard.monthlyNet >= 0 ? "Profitable" : "Loss",
                positive: dashboard.monthlyNet >= 0,
              }}
            />
            <StatCard
              title="Total Outstanding"
              value={`₹${dashboard.totalOutstanding.toLocaleString()}`}
              subtitle={`${dashboard.totalAccounts} fee accounts`}
              icon={AlertCircle}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Cash Balance"
              value={`₹${dashboard.cashBalance.toLocaleString()}`}
              subtitle={`In: ₹${dashboard.totalCashIn.toLocaleString()} / Out: ₹${dashboard.totalCashOut.toLocaleString()}`}
              icon={Wallet}
              color="bg-[#a855f7]"
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Pending Collection Today"
              value={`₹${dashboard.todayPending.toLocaleString()}`}
              subtitle="Awaiting verification"
              icon={Clock}
              color="bg-[#e8710a]"
            />
            <StatCard
              title="Monthly Expenses"
              value={`₹${dashboard.monthlyExpense.toLocaleString()}`}
              subtitle="Approved & paid"
              icon={TrendingDown}
              color="bg-[#ea4335]"
            />
            <StatCard
              title="Pending Invoices"
              value={dashboard.pendingInvoices}
              subtitle={`₹${dashboard.pendingInvoiceAmount.toLocaleString()}`}
              icon={FileText}
              color="bg-[#4285f4]"
            />
            <StatCard
              title="Overdue Amount"
              value={`₹${dashboard.overdueInvoiceAmount.toLocaleString()}`}
              subtitle={`${dashboard.overdueInvoices} invoices overdue`}
              icon={AlertCircle}
              color="bg-[#ea4335]"
              trend={{ label: "Needs attention", positive: false }}
            />
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
              onClick={() => navigate("/collections")}
            >
              <Banknote className="h-4 w-4 text-[#34a853]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Record Payment</span>
              <span className="text-[9px] text-[#9aa0a6]">Receive & verify payments</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
            >
              <Receipt className="h-4 w-4 text-[#1a73e8]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Generate Invoice</span>
              <span className="text-[9px] text-[#9aa0a6]">Create fee invoices</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
            >
              <PlusCircle className="h-4 w-4 text-[#fbbc04]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Add Expense</span>
              <span className="text-[9px] text-[#9aa0a6]">Record new expense</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
            >
              <BarChart3 className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Full Report</span>
              <span className="text-[9px] text-[#9aa0a6]">Profit & collection reports</span>
            </Button>
          </div>

          {/* Detailed overview panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue vs Expense */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Monthly Summary</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">Revenue vs Expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#5f6368]">Revenue</span>
                      <span className="text-[13px] font-semibold text-[#34a853]">₹{dashboard.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-[#f1f3f4] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#34a853] transition-all duration-500"
                        style={{ width: `${Math.min(100, (dashboard.monthlyRevenue / (dashboard.monthlyRevenue + dashboard.monthlyExpense || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#5f6368]">Expenses</span>
                      <span className="text-[13px] font-semibold text-[#ea4335]">₹{dashboard.monthlyExpense.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-[#f1f3f4] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ea4335] transition-all duration-500"
                        style={{ width: `${Math.min(100, (dashboard.monthlyExpense / (dashboard.monthlyRevenue + dashboard.monthlyExpense || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#f1f3f4]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#1a1a2e]">Net Profit / Loss</span>
                    <span className={`text-[15px] font-bold ${dashboard.monthlyNet >= 0 ? "text-[#34a853]" : "text-[#ea4335]"}`}>
                      {dashboard.monthlyNet >= 0 ? "+" : ""}₹{dashboard.monthlyNet.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9aa0a6] mt-0.5">
                    {dashboard.monthlyRevenue > 0
                      ? `Profit margin: ${Math.round((dashboard.monthlyNet / dashboard.monthlyRevenue) * 100)}%`
                      : "No revenue recorded"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Breakdown */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Outstanding Breakdown</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">Fee collection status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      label: "Current Outstanding",
                      amount: dashboard.totalOutstanding,
                      color: "bg-[#4285f4]",
                      bg: "bg-[#e8f0fe]",
                    },
                    {
                      label: "Overdue Amount",
                      amount: dashboard.overdueAmount,
                      color: "bg-[#ea4335]",
                      bg: "bg-[#fce8e6]",
                    },
                    {
                      label: "Pending Invoices",
                      amount: dashboard.pendingInvoiceAmount,
                      color: "bg-[#fbbc04]",
                      bg: "bg-[#fef7e0]",
                    },
                    {
                      label: "Overdue Invoices",
                      amount: dashboard.overdueInvoiceAmount,
                      color: "bg-[#e8710a]",
                      bg: "bg-[#fef7e0]",
                    },
                  ].map((item) => {
                    const total = dashboard.totalOutstanding + dashboard.pendingInvoiceAmount;
                    const pct = total > 0 ? (item.amount / total) * 100 : 0;
                    return (
                      <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-[11px] font-medium text-[#1a1a2e]">{item.label}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-[#1a1a2e]">₹{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
           REVENUE TAB
           ════════════════════════════════════════ */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Today's Collection"
              value={`₹${dashboard.todayCollection.toLocaleString()}`}
              subtitle={`${dashboard.todayCount} transactions`}
              icon={DollarSign}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${dashboard.monthlyRevenue.toLocaleString()}`}
              subtitle="Current month"
              icon={TrendingUp}
              color="bg-[#1a73e8]"
            />
            <StatCard
              title="Pending Today"
              value={`₹${dashboard.todayPending.toLocaleString()}`}
              subtitle="Awaiting verification"
              icon={Clock}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Collection Rate"
              value={
                dashboard.monthlyRevenue + dashboard.pendingInvoiceAmount > 0
                  ? `${Math.round((dashboard.monthlyRevenue / (dashboard.monthlyRevenue + dashboard.pendingInvoiceAmount)) * 100)}%`
                  : "—"
              }
              subtitle="Revenue vs invoiced"
              icon={Target}
              color="bg-[#4285f4]"
            />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Revenue Trend</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Detailed revenue reports with daily, monthly, and yearly breakdowns
              </p>
              <Button
                size="sm"
                className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                onClick={() => navigate("/collections")}
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1" /> View Collection Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           EXPENSES TAB
           ════════════════════════════════════════ */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              title="Monthly Expenses"
              value={`₹${dashboard.monthlyExpense.toLocaleString()}`}
              subtitle="Approved & paid"
              icon={TrendingDown}
              color="bg-[#ea4335]"
            />
            <StatCard
              title="Total Cash Out"
              value={`₹${dashboard.totalCashOut.toLocaleString()}`}
              subtitle="All time"
              icon={CreditCard}
              color="bg-[#e8710a]"
            />
            <StatCard
              title="Cash Balance"
              value={`₹${dashboard.cashBalance.toLocaleString()}`}
              subtitle="Current balance"
              icon={Wallet}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Expense Ratio"
              value={
                dashboard.monthlyRevenue > 0
                  ? `${Math.round((dashboard.monthlyExpense / dashboard.monthlyRevenue) * 100)}%`
                  : "—"
              }
              subtitle="% of revenue"
              icon={Target}
              color="bg-[#a855f7]"
            />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Receipt className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Expense Management</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Create, approve, and track expenses with category breakdowns
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Expense
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <ListChecks className="h-3.5 w-3.5 mr-1" /> View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           OUTSTANDING TAB
           ════════════════════════════════════════ */}
        <TabsContent value="outstanding" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              title="Total Outstanding"
              value={`₹${dashboard.totalOutstanding.toLocaleString()}`}
              subtitle={`${dashboard.totalAccounts} accounts`}
              icon={AlertCircle}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Overdue Amount"
              value={`₹${dashboard.overdueAmount.toLocaleString()}`}
              subtitle="Critical"
              icon={AlertCircle}
              color="bg-[#ea4335]"
            />
            <StatCard
              title="Pending Invoices"
              value={dashboard.pendingInvoices}
              subtitle={`₹${dashboard.pendingInvoiceAmount.toLocaleString()}`}
              icon={FileText}
              color="bg-[#4285f4]"
            />
            <StatCard
              title="Overdue Invoices"
              value={dashboard.overdueInvoices}
              subtitle={`₹${dashboard.overdueInvoiceAmount.toLocaleString()}`}
              icon={Clock}
              color="bg-[#e8710a]"
            />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Fee Collection Analysis</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Track fee collections, overdue accounts, and collection efficiency
              </p>
              <Button
                size="sm"
                className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                onClick={() => navigate("/collections")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Collection Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
