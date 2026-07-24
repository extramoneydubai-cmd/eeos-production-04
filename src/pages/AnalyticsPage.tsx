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
  BarChart3,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  FileText,
  PieChart,
  Calendar,
  Clock,
  Download,
  PlusCircle,
  RefreshCw,
  Filter,
  Save,
  Share2,
  Table2,
  LineChart,
  Target,
  AlertCircle,
  CheckCircle2,
  Database,
  Layers,
  Activity,
  Settings,
} from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, color, onClick }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200" onClick={onClick}>
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { navigate } = useAppNavigate();
  const activeTab = "overview";

  // Fetch module dashboard data
  const crmData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "crm" });
  const financeData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "finance" });
  const studentData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "students" });
  const examData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "examinations" });
  const lmsData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "lms" });
  const inventoryData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "inventory" });
  const hrData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "hr" });
  const procurementData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "procurement" });
  const reportDefs = useQuery(api.reportEngine.listReportDefinitions, { isActive: true });

  const isLoading = !crmData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" /><Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Analytics & Reports</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Centralized reporting platform — reusable by every module
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
            <Filter className="h-3.5 w-3.5 mr-1" /> Global Filters
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="reports" className="text-[12px] data-[state=active]:bg-white">Reports</TabsTrigger>
          <TabsTrigger value="kpis" className="text-[12px] data-[state=active]:bg-white">KPIs</TabsTrigger>
          <TabsTrigger value="schedules" className="text-[12px] data-[state=active]:bg-white">Schedules</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════
           OVERVIEW TAB — Cross-module KPI cards
           ════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* CRM */}
          <div>
            <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#1a73e8]" /> CRM
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard title="Total Leads" value={crmData?.total || 0} icon={Database} color="bg-[#4285f4]" />
              <StatCard title="Active" value={crmData?.active || 0} icon={Activity} color="bg-[#34a853]" />
              <StatCard title="Converted" value={crmData?.converted || 0} subtitle={`${crmData?.conversionRate || 0}% rate`} icon={TrendingUp} color="bg-[#1a73e8]" />
              <StatCard title="Lost" value={crmData?.lost || 0} icon={TrendingDown} color="bg-[#ea4335]" />
            </div>
          </div>

          {/* Finance */}
          <div>
            <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-[#34a853]" /> Finance
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard title="Total Collected" value={`₹${(financeData?.totalCollected || 0).toLocaleString()}`} icon={TrendingUp} color="bg-[#34a853]" />
              <StatCard title="Outstanding" value={`₹${(financeData?.totalOutstanding || 0).toLocaleString()}`} icon={AlertCircle} color="bg-[#fbbc04]" />
              <StatCard title="Pending Invoices" value={financeData?.pendingInvoices || 0} icon={FileText} color="bg-[#4285f4]" />
              <StatCard title="Overdue" value={financeData?.overdueInvoices || 0} icon={AlertCircle} color="bg-[#ea4335]" />
            </div>
          </div>

          {/* Students + Exams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#a855f7]" /> Students
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <StatCard title="Total" value={studentData?.total || 0} icon={Database} color="bg-[#a855f7]" />
                <StatCard title="Active" value={studentData?.active || 0} icon={CheckCircle2} color="bg-[#34a853]" />
                <StatCard title="Inactive" value={studentData?.inactive || 0} icon={AlertCircle} color="bg-[#ea4335]" />
              </div>
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#e8710a]" /> Examinations
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <StatCard title="Sessions" value={examData?.totalSessions || 0} icon={Database} color="bg-[#4285f4]" />
                <StatCard title="In Progress" value={examData?.inProgress || 0} icon={Activity} color="bg-[#fbbc04]" />
                <StatCard title="Passed" value={examData?.passed || 0} icon={CheckCircle2} color="bg-[#34a853]" />
              </div>
            </div>
          </div>

          {/* LMS + Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#1a73e8]" /> LMS
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <StatCard title="Courses" value={lmsData?.totalCourses || 0} icon={Database} color="bg-[#1a73e8]" />
                <StatCard title="Published" value={lmsData?.publishedCourses || 0} icon={CheckCircle2} color="bg-[#34a853]" />
                <StatCard title="Enrolled" value={lmsData?.totalEnrollments || 0} icon={Activity} color="bg-[#a855f7]" />
              </div>
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#e8710a]" /> Inventory
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <StatCard title="Items" value={inventoryData?.totalItems || 0} icon={Database} color="bg-[#4285f4]" />
                <StatCard title="Low Stock" value={inventoryData?.lowStock || 0} icon={AlertCircle} color="bg-[#ea4335]" />
                <StatCard title="Value" value={`₹${((inventoryData?.totalValue || 0) / 1000).toFixed(0)}K`} icon={TrendingUp} color="bg-[#34a853]" />
              </div>
            </div>
          </div>

          {/* HR + Procurement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#a855f7]" /> HR
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <StatCard title="Total" value={hrData?.total || 0} icon={Database} color="bg-[#a855f7]" />
                <StatCard title="Active" value={hrData?.active || 0} icon={CheckCircle2} color="bg-[#34a853]" />
                <StatCard title="Probation" value={hrData?.onProbation || 0} icon={Clock} color="bg-[#fbbc04]" />
              </div>
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#34a853]" /> Procurement
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <StatCard title="POs" value={procurementData?.totalPOs || 0} icon={FileText} color="bg-[#4285f4]" />
                <StatCard title="Pending" value={procurementData?.pendingPOs || 0} icon={Clock} color="bg-[#fbbc04]" />
                <StatCard title="Vendors" value={procurementData?.activeVendors || 0} icon={CheckCircle2} color="bg-[#34a853]" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
           REPORTS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Available Reports ({reportDefs?.length || 0})</h2>
            <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Report
            </Button>
          </div>

          {reportDefs && reportDefs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportDefs.map((def: any) => (
                <Card key={def._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 cursor-pointer">
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        def.module === "crm" ? "bg-[#4285f4]" :
                        def.module === "finance" ? "bg-[#34a853]" :
                        def.module === "students" ? "bg-[#a855f7]" :
                        def.module === "examinations" ? "bg-[#e8710a]" :
                        def.module === "lms" ? "bg-[#1a73e8]" :
                        def.module === "inventory" ? "bg-[#fbbc04]" : "bg-[#5f6368]"
                      }`}>
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1a1a2e] truncate">{def.name}</p>
                        <p className="text-[10px] text-[#5f6368] mt-0.5 capitalize">{def.module} · {def.reportType}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize bg-[#f1f3f4] border-0">{def.reportType}</Badge>
                          {def.isSystem && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#e8f0fe] text-[#1a73e8] border-0">System</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#1a1a2e]">No Reports Configured</h3>
                <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                  Create report definitions to start building your analytics library
                </p>
                <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Create First Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════
           KPIS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="kpis" className="space-y-4 mt-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Target className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">KPI Dashboard</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Configure and monitor key performance indicators across all modules
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <Target className="h-3.5 w-3.5 mr-1" /> Configure KPIs
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <BarChart3 className="h-3.5 w-3.5 mr-1" /> KPI Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           SCHEDULES TAB
           ════════════════════════════════════════ */}
        <TabsContent value="schedules" className="space-y-4 mt-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Calendar className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Scheduled Reports</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Schedule automated report delivery via email — daily, weekly, or monthly
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <Calendar className="h-3.5 w-3.5 mr-1" /> New Schedule
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <Clock className="h-3.5 w-3.5 mr-1" /> View Active
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
