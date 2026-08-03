import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutDashboard,
  FileText,
  PieChart as PieChartIcon,
  Calendar,
  Clock,
  Download,
  PlusCircle,
  RefreshCw,
  Filter,
  Save,
  Target,
  AlertCircle,
  CheckCircle2,
  Database,
  Layers,
  Activity,
  Users,
  DollarSign,
  GraduationCap,
  BookOpen,
  Package,
  Building,
  FileCheck,
  Truck,
  UserCheck,
  ListTodo,
  Award,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  ArrowUp,
  ArrowDown,
  X,
  Trash2,
  Edit,
  Play,
  Printer,
  Mail,
  GripVertical,
  Table2,
} from "lucide-react";

// ─── Recharts Imports ───────────────────────────────────────────
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────

interface ModuleColors {
  [key: string]: { bg: string; text: string; light: string };
}

const MODULE_COLORS: ModuleColors = {
  crm: { bg: "bg-[#4285f4]", text: "text-[#4285f4]", light: "bg-[#e8f0fe]" },
  finance: { bg: "bg-[#34a853]", text: "text-[#34a853]", light: "bg-[#e6f4ea]" },
  students: { bg: "bg-[#a855f7]", text: "text-[#a855f7]", light: "bg-[#f3e8ff]" },
  hr: { bg: "bg-[#ec407a]", text: "text-[#ec407a]", light: "bg-[#fce4ec]" },
  exams: { bg: "bg-[#e8710a]", text: "text-[#e8710a]", light: "bg-[#fff3e0]" },
  lms: { bg: "bg-[#1a73e8]", text: "text-[#1a73e8]", light: "bg-[#e8f0fe]" },
  inventory: { bg: "bg-[#fbbc04]", text: "text-[#fbbc04]", light: "bg-[#fef7e0]" },
  procurement: { bg: "bg-[#5f6368]", text: "text-[#5f6368]", light: "bg-[#f1f3f4]" },
};

const MODULE_LABELS: Record<string, string> = {
  crm: "CRM", finance: "Finance", students: "Students", hr: "HR",
  exams: "Exams", lms: "LMS", inventory: "Inventory", procurement: "Procurement",
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  crm: Users, finance: DollarSign, students: GraduationCap, hr: Building,
  exams: FileCheck, lms: BookOpen, inventory: Package, procurement: Truck,
};

// ─── Sub-Components ─────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon: Icon, color, trend, onClick }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; trend?: { direction: "up" | "down" | "flat"; label: string };
  onClick?: () => void;
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group"
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#5f6368] truncate">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-0.5">
                {trend.direction === "up" ? (
                  <ArrowUp className="h-3 w-3 text-[#34a853]" />
                ) : trend.direction === "down" ? (
                  <ArrowDown className="h-3 w-3 text-[#ea4335]" />
                ) : (
                  <Minus className="h-3 w-3 text-[#9aa0a6]" />
                )}
                <span className={`text-[10px] ${
                  trend.direction === "up" ? "text-[#34a853]" :
                  trend.direction === "down" ? "text-[#ea4335]" : "text-[#9aa0a6]"
                }`}>{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color} shrink-0 ml-2`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleSection({ moduleId, title, icon: Icon, data, isLoading }: {
  moduleId: string; title: string; icon: React.ElementType;
  data?: { kpis?: any[]; charts?: any[]; timeline?: any[]; recentActivity?: any[]; quickStats?: Record<string, number> };
  isLoading: boolean;
}) {
  const colors = MODULE_COLORS[moduleId] || MODULE_COLORS.procurement;
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Skeleton className="h-3.5 w-3.5 rounded" /><Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!data || !data.kpis || data.kpis.length === 0) return null;

  return (
    <div>
      <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${colors.text}`} /> {title}
        <span className="text-[10px] font-normal text-[#9aa0a6] ml-1">({data.kpis.length} metrics)</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.kpis.map((kpi: any, i: number) => (
          <StatCard
            key={i}
            title={kpi.label}
            value={kpi.value ?? 0}
            subtitle={kpi.subtitle}
            icon={kpi.icon ? (kpi.icon === "Users" ? Users : kpi.icon === "UserCheck" ? UserCheck : kpi.icon === "Target" ? Target : kpi.icon === "ListTodo" ? ListTodo : kpi.icon === "FileText" ? FileText : kpi.icon === "Calendar" ? Calendar : kpi.icon === "Award" ? Award : kpi.icon === "AlertTriangle" ? AlertTriangle : kpi.icon === "Building" ? Building : kpi.icon === "ShoppingCart" ? ShoppingCart : kpi.icon === "CreditCard" ? CreditCard : kpi.icon === "Clock" ? Clock : kpi.icon === "Package" ? Package : kpi.icon === "BookOpen" ? BookOpen : kpi.icon === "GraduationCap" ? GraduationCap : Database) : Database}
            color={colors.bg}
            trend={
              kpi.trend === "up" ? { direction: "up", label: "+12% vs last month" } :
              kpi.trend === "down" ? { direction: "down", label: "-5% vs last month" } :
              kpi.trend === "flat" ? { direction: "flat", label: "unchanged" } : undefined
            }
          />
        ))}
      </div>
      {data.charts && data.charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {data.charts.map((chart: any, i: number) => (
            <SimpleBarChart key={i} title={chart.name} data={chart.data || []} color={chart.color || colors.bg.replace("bg-[", "#").replace("]", "")} isLoading={false} />
          ))}
        </div>
      )}
      {data.timeline && data.timeline.length > 0 && (
        <div className="mt-2 border border-[#e8eaed] rounded-lg p-2 bg-white">
          <p className="text-[10px] font-medium text-[#5f6368] mb-1">Recent Activity</p>
          {data.timeline.slice(0, 4).map((event: any, i: number) => (
            <div key={i} className="flex items-start gap-2 py-1 border-b border-[#f1f3f4] last:border-0">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colors.bg.replace("bg-", "") }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#1a1a2e] truncate">{event.action || event.description || "Activity"}</p>
                <p className="text-[9px] text-[#9aa0a6]">{event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recharts Chart Components ─────────────────────────────────

/** Bar chart using Recharts — vertical bars for comparison */
function RechartsBarChartCard({ title, data, color, isLoading }: {
  title: string; data: { label: string; value: number }[]; color: string; isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;
  if (!data || data.length === 0) return null;
  const chartData = data.map(d => ({ name: d.label, value: d.value }));

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <p className="text-[11px] font-medium text-[#5f6368] mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            labelStyle={{ fontWeight: 600, marginBottom: 2 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={color} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Pie chart using Recharts — distribution / proportions */
function RechartsPieChartCard({ title, data, color, isLoading }: {
  title: string; data: { label: string; value: number }[]; color: string; isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;
  if (!data || data.length === 0) return null;

  const chartData = data.map(d => ({ name: d.label, value: d.value }));
  const PIE_COLORS = ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#a855f7', '#ec407a', '#e8710a', '#1a73e8', '#5f6368', '#14b8a6'];

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <p className="text-[11px] font-medium text-[#5f6368] mb-1">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: '#5f6368' }}
            iconType="circle"
            iconSize={6}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Line/Area chart using Recharts — trends over time */
function RechartsLineChartCard({ title, data, color, isLoading }: {
  title: string; data: { label: string; value: number }[]; color: string; isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;
  if (!data || data.length === 0) return null;

  const chartData = data.map(d => ({ name: d.label, value: d.value }));

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <p className="text-[11px] font-medium text-[#5f6368] mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          />
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${title.replace(/\s+/g, '-')})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Legacy simple bar kept for inline use in ModuleSection */
function SimpleBarChart({ title, data, color, isLoading }: {
  title: string; data: { label: string; value: number }[]; color: string; isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-24 rounded-lg" />;
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="border border-[#e8eaed] rounded-lg p-2.5 bg-white">
      <p className="text-[10px] font-medium text-[#5f6368] mb-2">{title}</p>
      <div className="space-y-1.5">
        {data.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] text-[#5f6368] w-20 truncate text-right shrink-0">{item.label}</span>
            <div className="flex-1 h-4 bg-[#f1f3f4] rounded-sm overflow-hidden">
              <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="text-[9px] font-medium text-[#5f6368] w-10 text-right shrink-0">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description: string; action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <CardContent className="p-8 text-center">
        <Icon className="h-12 w-12 text-[#dadce0] mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#1a1a2e]">{title}</h3>
        <p className="text-[12px] text-[#9aa0a6] mt-1 max-w-md mx-auto">{description}</p>
        {action && (
          <Button size="sm" className="mt-4 h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={action.onClick}>
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { navigate } = useAppNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch dashboard provider data
  const providerData = useQuery(api.dashboardProviders.getDashboardData, {});

  // Fetch module-specific KPI data
  const crmData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "crm" });
  const financeData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "finance" });
  const studentData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "students" });
  const examData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "examinations" });
  const lmsData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "lms" });
  const inventoryData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "inventory" });
  const hrData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "hr" });
  const procurementData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "procurement" });

  // Fetch KPI definitions and cards
  const kpiCards = useQuery(api.analyticsEngine.getKpiDashboardCards, {});

  // Fetch report definitions
  const reportDefs = useQuery(api.reportEngine.listReportDefinitions, { isActive: true });
  const dataSources = useQuery(api.reportEngine.getAvailableDataSources);

  // Fetch schedules
  const schedules = useQuery(api.reportScheduleEngine.listSchedules);

  // Mutations
  // Mutations
  const executeReport = useMutation(api.reportEngine.executeReport);
  const exportReportMutation = useMutation(api.reportExportEngine.exportReport);
  const toggleFavoriteReport = useMutation(api.reportEngine.toggleFavoriteReport);
  const deleteSavedReport = useMutation(api.reportEngine.deleteSavedReport);

  // Export history
  const exportHistory = useQuery(api.reportExportEngine.getExportHistory);

  // Export state
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [showExportDropdown, setShowExportDropdown] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const isLoading = !crmData;

  const moduleDataMap = useMemo(() => ({
    crm: { kpis: providerData?.providers?.crm?.kpis, charts: providerData?.providers?.crm?.charts, timeline: providerData?.providers?.crm?.timeline, recentActivity: providerData?.providers?.crm?.recentActivity, quickStats: providerData?.providers?.crm?.quickStats, total: crmData?.total, active: crmData?.active, converted: crmData?.converted, lost: crmData?.lost, conversionRate: crmData?.conversionRate },
    finance: { kpis: providerData?.providers?.finance?.kpis, charts: providerData?.providers?.finance?.charts, timeline: providerData?.providers?.finance?.timeline, recentActivity: providerData?.providers?.finance?.recentActivity, quickStats: providerData?.providers?.finance?.quickStats, totalCollected: financeData?.totalCollected, outstanding: financeData?.totalOutstanding, totalInvoiced: financeData?.totalInvoiced, pendingInvoices: financeData?.pendingInvoices, overdueInvoices: financeData?.overdueInvoices },
    students: { kpis: providerData?.providers?.students?.kpis, charts: providerData?.providers?.students?.charts, recentActivity: providerData?.providers?.students?.recentActivity, quickStats: providerData?.providers?.students?.quickStats, total: studentData?.total, active: studentData?.active, inactive: studentData?.inactive },
    hr: { kpis: providerData?.providers?.hr?.kpis, charts: providerData?.providers?.hr?.charts, recentActivity: providerData?.providers?.hr?.recentActivity, quickStats: providerData?.providers?.hr?.quickStats, total: hrData?.total, active: hrData?.active, onProbation: hrData?.onProbation },
    exams: { kpis: providerData?.providers?.exams?.kpis, charts: providerData?.providers?.exams?.charts, totalSessions: examData?.totalSessions, inProgress: examData?.inProgress, completed: examData?.completed, totalResults: examData?.totalResults, passed: examData?.passed },
    lms: { kpis: providerData?.providers?.lms?.kpis, charts: providerData?.providers?.lms?.charts, timeline: providerData?.providers?.lms?.timeline, recentActivity: providerData?.providers?.lms?.recentActivity, quickStats: providerData?.providers?.lms?.quickStats, totalCourses: lmsData?.totalCourses, publishedCourses: lmsData?.publishedCourses, totalEnrollments: lmsData?.totalEnrollments, completed: lmsData?.completed },
    inventory: { kpis: providerData?.providers?.inventory?.kpis, charts: providerData?.providers?.inventory?.charts, timeline: providerData?.providers?.inventory?.timeline, recentActivity: providerData?.providers?.inventory?.recentActivity, quickStats: providerData?.providers?.inventory?.quickStats, totalItems: inventoryData?.totalItems, lowStock: inventoryData?.lowStock, totalValue: inventoryData?.totalValue },
    procurement: { kpis: providerData?.providers?.procurement?.kpis, charts: providerData?.providers?.procurement?.charts, recentActivity: providerData?.providers?.procurement?.recentActivity, quickStats: providerData?.providers?.procurement?.quickStats, totalPOs: procurementData?.totalPOs, pendingPOs: procurementData?.pendingPOs, totalValue: procurementData?.totalValue, activeVendors: procurementData?.activeVendors },
  }), [providerData, crmData, financeData, studentData, examData, lmsData, inventoryData, hrData, procurementData]);

  const filteredModules = selectedModule === "all"
    ? Object.entries(moduleDataMap)
    : Object.entries(moduleDataMap).filter(([id]) => id === selectedModule);

  const handleExecuteReport = async (reportDefId: string) => {
    try {
      await executeReport({ reportDefinitionId: reportDefId as Id<"reports"> });
    } catch (err) {
      console.error("Failed to execute report:", err);
    }
  };

  const handleExportReport = async (reportDefId: string, format: string) => {
    setExportingReportId(reportDefId);
    setShowExportDropdown(null);
    try {
      const result = await exportReportMutation({ reportId: reportDefId as Id<"reports">, format: format });
      if (result && 'error' in result && result.error) {
        setExportStatus({ id: reportDefId, success: false, message: result.error });
      } else {
        setExportStatus({
          id: reportDefId,
          success: true,
          message: `Exported to ${format.toUpperCase()} — ${(result as { recordCount?: number })?.recordCount || 0} records`,
        });
      }
    } catch (err: any) {
      setExportStatus({ id: reportDefId, success: false, message: err.message || "Export failed" });
    } finally {
      setExportingReportId(null);
      // Clear status after 4 seconds
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  const EXPORT_FORMATS = [
    { value: "csv", label: "CSV", icon: Download, desc: "Comma-separated values" },
    { value: "excel", label: "Excel", icon: Table2, desc: "XLSX spreadsheet" },
    { value: "pdf", label: "PDF", icon: FileText, desc: "Formatted document" },
    { value: "json", label: "JSON", icon: Database, desc: "Raw data export" },
  ];

  // Module sections config for Overview tab
  const moduleSections = [
    { id: "crm", label: "CRM", icon: Users, data: moduleDataMap.crm },
    { id: "finance", label: "Finance", icon: DollarSign, data: moduleDataMap.finance },
    { id: "students", label: "Students", icon: GraduationCap, data: moduleDataMap.students },
    { id: "exams", label: "Examinations", icon: FileCheck, data: moduleDataMap.exams },
    { id: "lms", label: "LMS", icon: BookOpen, data: moduleDataMap.lms },
    { id: "inventory", label: "Inventory", icon: Package, data: moduleDataMap.inventory },
    { id: "hr", label: "HR", icon: Building, data: moduleDataMap.hr },
    { id: "procurement", label: "Procurement", icon: Truck, data: moduleDataMap.procurement },
  ];

  const visibleSections = selectedModule === "all"
    ? moduleSections
    : moduleSections.filter(s => s.id === selectedModule);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64 mb-1" />
        <Skeleton className="h-4 w-96 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5">
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1a73e8]" /> Analytics & Reports
          </h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Enterprise reporting platform — cross-module insights, KPIs, and scheduled analytics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 text-[11px] border-[#e8eaed] ${showFilters ? 'bg-[#e8f0fe] border-[#1a73e8]' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5 mr-1" /> Global Filters{selectedModule !== "all" && ` (${MODULE_LABELS[selectedModule]})`}
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh All
          </Button>
        </div>
      </div>

      {/* ─── Global Filters ──────────────────────────────────── */}
      {showFilters && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#5f6368]">Module:</span>
                <select
                  className="h-8 text-[11px] rounded-md border border-[#e8eaed] bg-white px-2 text-[#1a1a2e] outline-none focus:border-[#1a73e8]"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="all">All Modules</option>
                  {Object.entries(MODULE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#5f6368]">Period:</span>
                <select className="h-8 text-[11px] rounded-md border border-[#e8eaed] bg-white px-2 text-[#1a1a2e] outline-none focus:border-[#1a73e8]">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                  <option>This Year</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#5f6368]">Company:</span>
                <select className="h-8 text-[11px] rounded-md border border-[#e8eaed] bg-white px-2 text-[#1a1a2e] outline-none focus:border-[#1a73e8]">
                  <option>All Companies</option>
                  <option>Veda EdTech</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#5f6368]">Branch:</span>
                <select className="h-8 text-[11px] rounded-md border border-[#e8eaed] bg-white px-2 text-[#1a1a2e] outline-none focus:border-[#1a73e8]">
                  <option>All Branches</option>
                  <option>NP</option>
                  <option>OP</option>
                  <option>KL</option>
                  <option>PL</option>
                </select>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#5f6368]" onClick={() => setShowFilters(false)}>
                <X className="h-3.5 w-3.5 mr-1" /> Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">
            <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-[12px] data-[state=active]:bg-white">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Charts
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-[12px] data-[state=active]:bg-white">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Reports
            {reportDefs && reportDefs.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#e8f0fe] text-[#1a73e8] px-1.5 py-0.5 rounded-full">{reportDefs.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="kpis" className="text-[12px] data-[state=active]:bg-white">
            <Target className="h-3.5 w-3.5 mr-1.5" /> KPIs
            {kpiCards && kpiCards.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#e6f4ea] text-[#34a853] px-1.5 py-0.5 rounded-full">{kpiCards.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="text-[12px] data-[state=active]:bg-white">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedules
            {schedules && schedules.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#fef7e0] text-[#f9a825] px-1.5 py-0.5 rounded-full">{schedules.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════
            OVERVIEW TAB — Cross-module KPI dashboard
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          {/* Summary Bar */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 text-[11px] text-[#5f6368]">
                <span className="font-medium text-[#1a1a2e]">Enterprise Summary</span>
                <span>8 modules active</span>
                <span>{(kpiCards?.length || 0)} KPIs tracked</span>
                <span>{reportDefs?.length || 0} reports</span>
                <span>{schedules?.length || 0} schedules</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-[#e6f4ea] text-[#34a853] border-0">
                <Activity className="h-3 w-3 mr-1" /> All systems operational
              </Badge>
            </CardContent>
          </Card>

          {/* Module Sections */}
          <div className="space-y-4">
            {visibleSections.map(({ id, label, icon, data }) => (
              <ModuleSection
                key={id}
                moduleId={id}
                title={label}
                icon={icon}
                data={data}
                isLoading={false}
              />
            ))}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            CHARTS TAB — Cross-module visual analytics
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="charts" className="space-y-5 mt-4">
          {/* Module chart selector */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Cross-Module Chart Analytics</h2>
              <p className="text-[11px] text-[#5f6368]">Rich Recharts visualizations — distribution, comparison, and trend charts for every module</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-8 text-[11px] rounded-md border border-[#e8eaed] bg-white px-2 text-[#1a1a2e] outline-none focus:border-[#1a73e8]"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="all">All Modules</option>
                {Object.entries(MODULE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart grid — each module's chart data rendered with Recharts */}
          {visibleSections.map(({ id, label, icon: ModIcon, data }) => {
            const colors = MODULE_COLORS[id] || MODULE_COLORS.procurement;
            const chartColor = colors.bg.replace('bg-[', '').replace(']', '');
            const charts = data?.charts || [];

            if (!charts || charts.filter((c: any) => c?.data?.length > 0).length === 0) return null;

            return (
              <div key={id}>
                <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
                  <ModIcon className={`h-3.5 w-3.5 ${colors.text}`} /> {label}
                  <span className="text-[10px] font-normal text-[#9aa0a6]">{charts.filter((c: any) => c?.data?.length > 0).length} charts</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {charts.map((chart: any, idx: number) => {
                    if (!chart?.data || chart.data.length === 0) return null;
                    // Alternate chart types for visual variety
                    if (idx % 3 === 0) {
                      return (
                        <RechartsBarChartCard
                          key={idx}
                          title={chart.name}
                          data={chart.data}
                          color={'#' + chartColor.replace('#', '')}
                          isLoading={false}
                        />
                      );
                    } else if (idx % 3 === 1) {
                      return (
                        <RechartsPieChartCard
                          key={idx}
                          title={chart.name}
                          data={chart.data}
                          color={'#' + chartColor.replace('#', '')}
                          isLoading={false}
                        />
                      );
                    } else {
                      return (
                        <RechartsLineChartCard
                          key={idx}
                          title={chart.name}
                          data={chart.data}
                          color={'#' + chartColor.replace('#', '')}
                          isLoading={false}
                        />
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}

          {/* If no chart data available */}
          {visibleSections.every(({ data }: any) => !data?.charts?.filter((c: any) => c?.data?.length > 0).length) && (
            <div className="text-center py-12">
              <PieChartIcon className="h-12 w-12 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Chart data loading</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1">Module dashboard providers will populate charts as data becomes available</p>
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            REPORTS TAB — Library with execution & export
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Report Library</h2>
              <p className="text-[11px] text-[#5f6368]">{dataSources?.length || 0} data sources available</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Report
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                <Save className="h-3.5 w-3.5 mr-1" /> Saved Reports
              </Button>
            </div>
          </div>

          {reportDefs && reportDefs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportDefs.map((def: any) => {
                const color = MODULE_COLORS[def.module] || MODULE_COLORS.procurement;
                return (
                  <Card
                    key={def._id}
                    className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group"
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${color.bg} shrink-0`}>
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-[#1a1a2e] truncate">{def.name}</p>
                              <p className="text-[10px] text-[#5f6368] mt-0.5 capitalize">
                                {MODULE_LABELS[def.module] || def.module} · {def.reportType}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Execute" onClick={() => handleExecuteReport(def._id)}>
                                <Play className="h-3 w-3 text-[#34a853]" />
                              </Button>
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  title="Export"
                                  onClick={() => setShowExportDropdown(showExportDropdown === def._id ? null : def._id)}
                                  disabled={exportingReportId === def._id}
                                >
                                  {exportingReportId === def._id ? (
                                    <RefreshCw className="h-3 w-3 text-[#1a73e8] animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 text-[#1a73e8]" />
                                  )}
                                </Button>
                                {/* Export format dropdown */}
                                {showExportDropdown === def._id && (
                                  <div className="absolute right-0 top-7 z-50 w-40 bg-white rounded-lg border border-[#e8eaed] shadow-lg overflow-hidden">
                                    <div className="p-1.5">
                                      <p className="text-[9px] font-medium text-[#5f6368] px-2 py-1 uppercase tracking-wider">Export as</p>
                                      {EXPORT_FORMATS.map((fmt) => (
                                        <button
                                          key={fmt.value}
                                          className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] text-[#1a1a2e] hover:bg-[#f1f3f4] rounded transition-colors"
                                          onClick={() => handleExportReport(def._id, fmt.value)}
                                        >
                                          <fmt.icon className="h-3 w-3 text-[#5f6368]" />
                                          <div className="text-left">
                                            <span className="font-medium">{fmt.label}</span>
                                            <span className="text-[9px] text-[#9aa0a6] ml-1">· {fmt.desc}</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                    <div className="border-t border-[#f1f3f4] px-2 py-1">
                                      <button
                                        className="text-[9px] text-[#5f6368] hover:text-[#1a1a2e] w-full text-left"
                                        onClick={() => setShowExportDropdown(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Schedule">
                                <Calendar className="h-3 w-3 text-[#f9a825]" />
                              </Button>
                            </div>
                          </div>
                          {def.description && (
                            <p className="text-[10px] text-[#9aa0a6] mt-1 line-clamp-1">{def.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize bg-[#f1f3f4] border-0 text-[#5f6368]">{def.reportType}</Badge>
                            {def.isSystem && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#e8f0fe] text-[#1a73e8] border-0">System</Badge>
                            )}
                            {def.config?.isSchedulable && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#fef7e0] text-[#f9a825] border-0">Schedulable</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No Reports Configured"
              description="Create report definitions to start building your analytics library. Reports aggregate data from all business modules into reusable, exportable insights."
              action={{ label: "Create First Report", onClick: () => {} }}
            />
          )}

          {/* Export status banner */}
          {exportStatus && (
            <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${
              exportStatus.success ? 'bg-[#e6f4ea] text-[#34a853] border border-[#ceead6]' : 'bg-[#fce8e6] text-[#ea4335] border border-[#f5c6c2]'
            }`}>
              {exportStatus.success ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{exportStatus.message}</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={() => setExportStatus(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Export History */}
          {exportHistory && exportHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[12px] font-semibold text-[#5f6368] mb-2">Recent Exports ({exportHistory.length})</h3>
              <div className="border border-[#e8eaed] rounded-lg overflow-hidden bg-white">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-[#f8f9fa] border-b border-[#e8eaed]">
                      <th className="text-left px-3 py-2 font-medium text-[#5f6368]">Format</th>
                      <th className="text-left px-3 py-2 font-medium text-[#5f6368]">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-[#5f6368]">Records</th>
                      <th className="text-left px-3 py-2 font-medium text-[#5f6368]">Date</th>
                      <th className="text-left px-3 py-2 font-medium text-[#5f6368]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportHistory.slice(0, 10).map((exp: any) => (
                      <tr key={exp._id} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa]">
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase bg-[#f1f3f4] border-0">
                            {exp.format || "csv"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                            exp.status === "completed" ? 'bg-[#e6f4ea] text-[#34a853]' :
                            exp.status === "failed" ? 'bg-[#fce8e6] text-[#ea4335]' :
                            'bg-[#fef7e0] text-[#f9a825]'
                          }`}>
                            {exp.status || "pending"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-[#5f6368]">{exp.recordCount ?? "—"}</td>
                        <td className="px-3 py-2 text-[#9aa0a6]">
                          {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {exp.fileUrl ? (
                            <a href={exp.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-6 text-[9px] text-[#1a73e8] hover:text-[#1557b0]">
                                <Download className="h-3 w-3 mr-1" /> Download
                              </Button>
                            </a>
                          ) : (
                            <span className="text-[#9aa0a6] text-[9px]">No file</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data Sources */}
          {dataSources && dataSources.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[12px] font-semibold text-[#5f6368] mb-2">Available Data Sources ({dataSources.length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {dataSources.map((ds: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 bg-white border-[#e8eaed] text-[#5f6368]">
                    <Database className="h-3 w-3 mr-1" /> {ds}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            KPIS TAB — KPI Definitions with snapshots
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="kpis" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Key Performance Indicators</h2>
              <p className="text-[11px] text-[#5f6368]">Track and monitor KPIs across all business modules</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recalculate All
              </Button>
              <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                <Target className="h-3.5 w-3.5 mr-1" /> Configure KPIs
              </Button>
            </div>
          </div>

          {kpiCards && kpiCards.length > 0 ? (
            <div className="space-y-4">
              {/* Group KPIs by module */}
              {["crm", "finance", "students", "examinations", "lms", "inventory", "hr", "procurement"].map(module => {
                const moduleKpis = kpiCards.filter((kpi: any) => kpi.module === module);
                if (moduleKpis.length === 0) return null;
                const ModuleIcon = MODULE_ICONS[module] || Database;
                const colors = MODULE_COLORS[module] || MODULE_COLORS.procurement;

                return (
                  <div key={module}>
                    <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                      <ModuleIcon className={`h-3.5 w-3.5 ${colors.text}`} />
                      {MODULE_LABELS[module] || module}
                      <span className="text-[10px] font-normal text-[#9aa0a6]">({moduleKpis.length} KPIs)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {moduleKpis.map((kpi: any) => (
                        <Card key={kpi._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md transition-all duration-200">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-[#5f6368] truncate">{kpi.name}</p>
                                <p className="text-xl font-semibold text-[#1a1a2e] mt-0.5 tracking-tight">
                                  {kpi.currentValue ?? "—"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] text-[#9aa0a6] capitalize">{kpi.aggregation}</span>
                                  {kpi.unit && <span className="text-[9px] text-[#9aa0a6]">· {kpi.unit}</span>}
                                  {kpi.targetValue && (
                                    <span className={`text-[9px] ${kpi.achievedTarget ? 'text-[#34a853]' : 'text-[#ea4335]'}`}>
                                      {kpi.achievedTarget ? '✓ Target met' : `✗ Target: ${kpi.targetValue}${kpi.unit || ''}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`p-1.5 rounded-lg ${kpi.color ? `bg-[${kpi.color}]` : colors.bg} shrink-0 ml-2`}>
                                <Target className="h-3.5 w-3.5 text-white" />
                              </div>
                            </div>
                            {kpi.lastUpdated && (
                              <p className="text-[9px] text-[#9aa0a6] mt-2 border-t border-[#f1f3f4] pt-1">
                                Last updated: {new Date(kpi.lastUpdated).toLocaleDateString()} {new Date(kpi.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No KPIs Configured"
              description="Create KPI definitions to track performance metrics. KPIs automatically capture snapshots and display trends over time."
              action={{ label: "Create KPI", onClick: () => {} }}
            />
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            SCHEDULES TAB — Report Schedule Management
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="schedules" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Scheduled Reports</h2>
              <p className="text-[11px] text-[#5f6368]">Automate report delivery — daily, weekly, or monthly via email</p>
            </div>
            <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              <Calendar className="h-3.5 w-3.5 mr-1" /> New Schedule
            </Button>
          </div>

          {schedules && schedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schedules.map((schedule: any) => {
                const color = MODULE_COLORS[schedule.module] || MODULE_COLORS.procurement;
                const isActive = schedule.isActive !== false;
                return (
                  <Card key={schedule._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md transition-all duration-200">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${color.bg} shrink-0`}>
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold text-[#1a1a2e] truncate">{schedule.name || "Unnamed Schedule"}</p>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${isActive ? 'bg-[#e6f4ea] text-[#34a853]' : 'bg-[#f1f3f4] text-[#9aa0a6]'}`}>
                                {isActive ? "Active" : "Paused"}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-[#5f6368] mt-0.5 capitalize">
                              {schedule.frequency || "daily"} · {MODULE_LABELS[schedule.module] || "system"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#9aa0a6]">
                              <Clock className="h-3 w-3" />
                              <span>Next: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleDateString() : "Not scheduled"}</span>
                              <span>·</span>
                              <span>Format: {(schedule.format || "pdf").toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 ml-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Run Now">
                            <Play className="h-3 w-3 text-[#34a853]" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit">
                            <Edit className="h-3 w-3 text-[#5f6368]" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Delete">
                            <Trash2 className="h-3 w-3 text-[#ea4335]" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Schedules Configured"
              description="Schedule automated report delivery to stay informed without manual effort. Choose daily, weekly, or monthly frequency."
              action={{ label: "Create Schedule", onClick: () => {} }}
            />
          )}

          {/* Schedule info card */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-[11px] text-[#5f6368]">
                <span className="font-medium text-[#1a1a2e]">Delivery Methods</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-[#1a73e8]" /> Email (PDF)</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3 text-[#34a853]" /> Download (CSV)</span>
                <span className="flex items-center gap-1"><Printer className="h-3 w-3 text-[#f9a825]" /> Print</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-[#e8f0fe] text-[#1a73e8] border-0">
                Future: WhatsApp delivery
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
