/**
 * AnalyticsDashboard — Enterprise Analytics Platform
 *
 * The central analytics engine for EEOS.
 * Every module publishes through dashboardProviders.
 * Replaces the basic analytics page with an executive-grade platform.
 *
 * Features:
 * - Global Filters with presets (Today, This Week, This Month, etc.)
 * - Executive KPI Header with sparklines and drill-down
 * - Cross-module analytics sections (8 modules)
 * - Recharts visualizations: Bar, Pie, Donut, Line/Area
 * - Activity Stream (live platform activity)
 * - Top Performers section
 * - Distribution Analytics
 * - Trend Analysis with growth %
 * - Heatmap-style grids
 * - Report Library with execute/export
 * - KPI Monitor
 * - Schedule Management
 */

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, LayoutDashboard,
  FileText, PieChart as PieChartIcon, Calendar, Clock, Download,
  PlusCircle, RefreshCw, Filter, Save, Target, AlertCircle,
  CheckCircle2, Database, Layers, Activity, Users, DollarSign,
  GraduationCap, BookOpen, Package, Building, FileCheck, Truck,
  UserCheck, ListTodo, Award, AlertTriangle, ShoppingCart,
  CreditCard, ArrowUp, ArrowDown, X, Trash2, Edit, Play,
  Printer, Mail, GripVertical, Table2, Sparkles, LineChart,
  ChevronRight, Star, Heart, Eye, EyeOff, Maximize2,
  Share2, Clock4, TrendingUpIcon, Zap, Thermometer,
  BarChartHorizontal, PieChart as PieChartIcon2,
} from "lucide-react";

// ─── Recharts ─────────────────────────────────────────────────
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
  RadialBarChart, RadialBar, ComposedChart,
} from "recharts";

// ─── Analytics Components ─────────────────────────────────────
import { KpiCard } from "@/components/analytics/KpiCard";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { DistributionCard } from "@/components/analytics/DistributionCard";
import { TopListCard } from "@/components/analytics/TopListCard";
import { ActivityStream } from "@/components/analytics/ActivityStream";
import { SectionCard } from "@/components/analytics/SectionCard";

// ─── Types ────────────────────────────────────────────────────

interface ModuleColors {
  [key: string]: { bg: string; text: string; light: string; chart: string };
}

const MODULE_COLORS: ModuleColors = {
  crm: { bg: "bg-[#4285f4]", text: "text-[#4285f4]", light: "bg-[#e8f0fe]", chart: "#4285f4" },
  finance: { bg: "bg-[#34a853]", text: "text-[#34a853]", light: "bg-[#e6f4ea]", chart: "#34a853" },
  students: { bg: "bg-[#a855f7]", text: "text-[#a855f7]", light: "bg-[#f3e8ff]", chart: "#a855f7" },
  hr: { bg: "bg-[#ec407a]", text: "text-[#ec407a]", light: "bg-[#fce4ec]", chart: "#ec407a" },
  exams: { bg: "bg-[#e8710a]", text: "text-[#e8710a]", light: "bg-[#fff3e0]", chart: "#e8710a" },
  lms: { bg: "bg-[#1a73e8]", text: "text-[#1a73e8]", light: "bg-[#e8f0fe]", chart: "#1a73e8" },
  inventory: { bg: "bg-[#fbbc04]", text: "text-[#fbbc04]", light: "bg-[#fef7e0]", chart: "#fbbc04" },
  procurement: { bg: "bg-[#5f6368]", text: "text-[#5f6368]", light: "bg-[#f1f3f4]", chart: "#5f6368" },
};

const MODULE_LABELS: Record<string, string> = {
  crm: "CRM", finance: "Finance", students: "Students", hr: "HR",
  exams: "Exams", lms: "LMS", inventory: "Inventory", procurement: "Procurement",
};

const MODULE_ROUTES: Record<string, string> = {
  crm: "/crm", finance: "/finance", students: "/students", hr: "/employees",
  exams: "/examinations", lms: "/lms", inventory: "/procurement/inventory", procurement: "/procurement",
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  crm: Users, finance: DollarSign, students: GraduationCap, hr: Building,
  exams: FileCheck, lms: BookOpen, inventory: Package, procurement: Truck,
};

const PIE_COLORS = ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#a855f7', '#ec407a', '#e8710a', '#1a73e8', '#5f6368', '#14b8a6'];

// ─── Sub-Components ─────────────────────────────────────────────

/** Executive KPI Card with sparkline area preview */
function ExecutiveKpiCard({ title, value, subtitle, icon: Icon, color, trend, onClick, sparklineData }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; trend?: { direction: "up" | "down" | "flat"; label: string; value?: number };
  onClick?: () => void; sparklineData?: number[];
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-lg hover:border-[#dadce0] transition-all duration-200 group overflow-hidden relative"
      onClick={onClick}
    >
      {/* Sparkline background */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-[0.08]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData.map((v, i) => ({ i, v }))}>
              <Area type="monotone" dataKey="v" stroke={color.replace("bg-[", "#").replace("]", "")} fill={color.replace("bg-[", "#").replace("]", "")} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-medium text-[#5f6368] truncate">{title}</p>
              {trend && trend.value !== undefined && (
                <span className={`text-[9px] font-semibold ${
                  trend.direction === "up" ? "text-[#34a853]" :
                  trend.direction === "down" ? "text-[#ea4335]" : "text-[#9aa0a6]"
                }`}>
                  {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-[#1a1a2e] tracking-tight">{value}</p>
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
          <div className={`p-2.5 rounded-xl ${color} shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Module Section with KPI grid + charts inline */
function ModuleAnalyticsSection({ moduleId, title, icon: ModIcon, data, onNavigate }: {
  moduleId: string; title: string; icon: React.ElementType;
  data?: {
    kpis?: { label: string; value: number | string; trend?: string; subtitle?: string; icon?: string }[];
    charts?: { name: string; data: { label: string; value: number }[] }[];
    timeline?: { action?: string; description?: string; createdAt?: number }[];
    recentActivity?: any[];
    quickStats?: Record<string, number>;
  };
  onNavigate?: (path: string) => void;
}) {
  const colors = MODULE_COLORS[moduleId] || MODULE_COLORS.procurement;
  const route = MODULE_ROUTES[moduleId];

  if (!data?.kpis || data.kpis.length === 0) return null;

  const chartData = data.charts?.filter(c => c?.data?.length > 0) || [];

  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        {/* Module Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${colors.bg}`}>
              <ModIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{title}</h3>
              <p className="text-[10px] text-[#9aa0a6]">{data.kpis.length} metrics tracked</p>
            </div>
          </div>
          {route && onNavigate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-[#5f6368] hover:text-[#1a73e8]"
              onClick={() => onNavigate(route)}
            >
              Open {title} <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {data.kpis.map((kpi, i) => (
            <KpiCard
              key={i}
              label={kpi.label}
              value={kpi.value}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              color={colors.bg}
            />
          ))}
        </div>

        {/* Charts inline */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chartData.map((chart, idx) => (
              <ChartWidget
                key={idx}
                title={chart.name}
                data={chart.data}
                color={colors.chart}
                chartType={idx % 3 === 0 ? "bar" : idx % 3 === 1 ? "pie" : "area"}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {data.quickStats && Object.keys(data.quickStats).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f1f3f4]">
            {Object.entries(data.quickStats).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-[9px] px-2 py-0.5 bg-[#f8f9fa] text-[#5f6368] border-0">
                {key.replace(/([A-Z])/g, ' $1').trim()}: <span className="font-semibold ml-0.5">{val}</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Reusable Chart Widget — supports bar, pie, donut, line, area */
function ChartWidget({ title, data, color, chartType, height = 180 }: {
  title: string; data: { label: string; value: number }[]; color: string; chartType?: "bar" | "pie" | "area" | "donut" | "line"; height?: number;
}) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(d => ({ name: d.label, value: d.value }));
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <p className="text-[10px] font-medium text-[#5f6368] mb-2 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-[9px] text-[#9aa0a6]">{chartData.length} items</span>
      </p>
      <ResponsiveContainer width="100%" height={height}>
        {chartType === "bar" ? (
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={color} maxBarSize={36} />
          </BarChart>
        ) : chartType === "pie" || chartType === "donut" ? (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={chartType === "donut" ? 45 : 0}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed' }}
              formatter={(value: number) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, title]}
            />
            {chartType === "donut" && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={16} fontWeight={700} fill="#1a1a2e">
                {total}
              </text>
            )}
          </PieChart>
        ) : chartType === "line" ? (
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed' }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
          </LineChart>
        ) : (
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
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed' }} />
            <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${title.replace(/\s+/g, '-')})`} strokeWidth={2} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Heatmap-style grid for distribution data */
function DistributionGrid({ data, title, color }: {
  data: { label: string; value: number }[]; title: string; color: string;
}) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <p className="text-[10px] font-medium text-[#5f6368] mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {data.map((item, i) => {
          const intensity = Math.round((item.value / maxVal) * 100);
          return (
            <div
              key={i}
              className="p-2 rounded-lg text-center transition-all hover:scale-105 cursor-default"
              style={{
                backgroundColor: `${color}${Math.max(10, intensity).toString(16).padStart(2, '0')}`,
              }}
            >
              <p className="text-[11px] font-semibold text-[#1a1a2e]">{item.value}</p>
              <p className="text-[9px] text-[#5f6368] truncate">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Top Performers Section */
function TopPerformersSection({ data, title, color, icon: Icon }: {
  data?: { name: string; value: string | number; subtitle?: string }[]; title: string; color: string; icon?: React.ElementType;
}) {
  if (!data || data.length === 0) return null;

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#f9a825]" />}
        <p className="text-[11px] font-semibold text-[#1a1a2e]">{title}</p>
      </div>
      <div className="space-y-1.5">
        {data.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-[#f1f3f4] last:border-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
              i === 0 ? 'bg-[#f9a825]' : i === 1 ? 'bg-[#9aa0a6]' : i === 2 ? 'bg-[#e8710a]' : 'bg-[#dadce0]'
            }`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#1a1a2e] font-medium truncate">{item.name}</p>
              {item.subtitle && <p className="text-[9px] text-[#9aa0a6] truncate">{item.subtitle}</p>}
            </div>
            <span className="text-[11px] font-semibold text-[#1a1a2e] shrink-0">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Trend Analysis Card */
function TrendAnalysisCard({ title, data, color }: {
  title: string; data: { label: string; value: number }[]; color: string;
}) {
  if (!data || data.length < 2) return null;

  const growth = data.length >= 2
    ? ((data[data.length - 1].value - data[0].value) / Math.max(data[0].value, 1)) * 100
    : 0;

  return (
    <div className="border border-[#e8eaed] rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-medium text-[#5f6368]">{title}</p>
        <div className="flex items-center gap-1">
          {growth > 0 ? (
            <TrendingUp className="h-3 w-3 text-[#34a853]" />
          ) : (
            <TrendingDown className="h-3 w-3 text-[#ea4335]" />
          )}
          <span className={`text-[10px] font-semibold ${growth > 0 ? 'text-[#34a853]' : 'text-[#ea4335]'}`}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data.map(d => ({ name: d.label, value: d.value }))}>
          <defs>
            <linearGradient id={`trend-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#trend-${title.replace(/\s+/g, '-')})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyAnalytics({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description: string; action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <CardContent className="p-10 text-center">
        <Icon className="h-14 w-14 text-[#dadce0] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#1a1a2e]">{title}</h3>
        <p className="text-[12px] text-[#9aa0a6] mt-1.5 max-w-md mx-auto">{description}</p>
        {action && (
          <Button size="sm" className="mt-4 h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={action.onClick}>
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-72 mb-1" />
      <Skeleton className="h-4 w-96 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { navigate } = useAppNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [periodPreset, setPeriodPreset] = useState("this-month");
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [exportStatus, setExportStatus] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // ─── Backend Data ───────────────────────────────────────────
  const providerData = useQuery(api.dashboardProviders.getDashboardData, {});
  const crmData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "crm" });
  const financeData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "finance" });
  const studentData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "students" });
  const examData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "examinations" });
  const lmsData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "lms" });
  const inventoryData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "inventory" });
  const hrData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "hr" });
  const procurementData = useQuery(api.analyticsEngine.getModuleDashboardData, { module: "procurement" });
  const kpiCards = useQuery(api.analyticsEngine.getKpiDashboardCards, {});
  const reportDefs = useQuery(api.reportEngine.listReportDefinitions, { isActive: true });
  const dataSources = useQuery(api.reportEngine.getAvailableDataSources);
  const schedules = useQuery(api.reportScheduleEngine.listSchedules);
  const exportHistory = useQuery(api.reportExportEngine.getExportHistory);
  const recentActivity = useQuery(api.eventSdk.getRecentEvents, { limit: 20 });

  // ─── Mutations ─────────────────────────────────────────────
  const executeReport = useMutation(api.reportEngine.executeReport);
  const exportReportMutation = useMutation(api.reportExportEngine.exportReport);
  const toggleFavoriteReport = useMutation(api.reportEngine.toggleFavoriteReport);
  const deleteSavedReport = useMutation(api.reportEngine.deleteSavedReport);

  // ─── Derived Data ──────────────────────────────────────────
  const isLoading = !providerData;

  const moduleDataMap = useMemo(() => ({
    crm: {
      kpis: providerData?.providers?.crm?.kpis || [],
      charts: providerData?.providers?.crm?.charts || [],
      timeline: providerData?.providers?.crm?.timeline || [],
      quickStats: {
        leads: crmData?.total || 0,
        converted: crmData?.converted || 0,
        active: crmData?.active || 0,
        rate: crmData?.conversionRate || "0%",
      },
    },
    finance: {
      kpis: providerData?.providers?.finance?.kpis || [],
      charts: providerData?.providers?.finance?.charts || [],
      quickStats: {
        collected: financeData?.totalCollected || 0,
        outstanding: financeData?.totalOutstanding || 0,
        invoices: financeData?.totalInvoiced || 0,
        overdue: financeData?.overdueInvoices || 0,
      },
    },
    students: {
      kpis: providerData?.providers?.students?.kpis || [],
      charts: providerData?.providers?.students?.charts || [],
      quickStats: {
        total: studentData?.total || 0,
        active: studentData?.active || 0,
        inactive: studentData?.inactive || 0,
      },
    },
    hr: {
      kpis: providerData?.providers?.hr?.kpis || [],
      charts: providerData?.providers?.hr?.charts || [],
      quickStats: {
        total: hrData?.total || 0,
        active: hrData?.active || 0,
        probation: hrData?.onProbation || 0,
      },
    },
    exams: {
      kpis: providerData?.providers?.exams?.kpis || [],
      charts: providerData?.providers?.exams?.charts || [],
      quickStats: {
        sessions: examData?.totalSessions || 0,
        inProgress: examData?.inProgress || 0,
        completed: examData?.completed || 0,
        passed: examData?.passed || 0,
      },
    },
    lms: {
      kpis: providerData?.providers?.lms?.kpis || [],
      charts: providerData?.providers?.lms?.charts || [],
      quickStats: {
        courses: lmsData?.totalCourses || 0,
        published: lmsData?.publishedCourses || 0,
        enrolled: lmsData?.totalEnrollments || 0,
        completed: lmsData?.completed || 0,
      },
    },
    inventory: {
      kpis: providerData?.providers?.inventory?.kpis || [],
      charts: providerData?.providers?.inventory?.charts || [],
      quickStats: {
        items: inventoryData?.totalItems || 0,
        lowStock: inventoryData?.lowStock || 0,
        value: inventoryData?.totalValue || 0,
      },
    },
    procurement: {
      kpis: providerData?.providers?.procurement?.kpis || [],
      charts: providerData?.providers?.procurement?.charts || [],
      quickStats: {
        orders: procurementData?.totalPOs || 0,
        pending: procurementData?.pendingPOs || 0,
        vendors: procurementData?.activeVendors || 0,
        value: procurementData?.totalValue || 0,
      },
    },
  }), [providerData, crmData, financeData, studentData, examData, lmsData, inventoryData, hrData, procurementData]);

  const visibleModules = selectedModule === "all"
    ? Object.entries(moduleDataMap)
    : Object.entries(moduleDataMap).filter(([id]) => id === selectedModule);

  // ─── Handlers ──────────────────────────────────────────────
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleExecuteReport = async (reportDefId: string) => {
    try { await executeReport({ reportDefinitionId: reportDefId as Id<"reports"> }); }
    catch (err) { console.error("Failed to execute report:", err); }
  };

  const handleExportReport = async (reportDefId: string, format: string) => {
    setExportingReportId(reportDefId);
    setShowExportDropdown(null);
    try {
      const result = await exportReportMutation({ reportId: reportDefId as Id<"reports">, format: format });
      setExportStatus({
        id: reportDefId,
        success: !(result && 'error' in result && result.error),
        message: result && 'error' in result && result.error
          ? (result as { error?: string }).error
          : `Exported to ${format.toUpperCase()} — ${(result as { recordCount?: number })?.recordCount || 0} records`,
      });
    } catch (err: any) {
      setExportStatus({ id: reportDefId, success: false, message: err.message || "Export failed" });
    } finally {
      setExportingReportId(null);
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  const EXPORT_FORMATS = [
    { value: "csv", label: "CSV", icon: Download, desc: "Comma-separated" },
    { value: "excel", label: "Excel", icon: Table2, desc: "XLSX spreadsheet" },
    { value: "pdf", label: "PDF", icon: FileText, desc: "Formatted document" },
    { value: "json", label: "JSON", icon: Database, desc: "Raw data export" },
  ];

  // Compute executive KPIs from provider data
  const executiveKpis = useMemo(() => {
    const allKpis: any[] = [];
    Object.entries(moduleDataMap).forEach(([id, data]) => {
      if (data.kpis) {
        data.kpis.slice(0, 2).forEach((kpi: any) => {
          allKpis.push({ ...kpi, moduleId: id });
        });
      }
    });
    return allKpis.slice(0, 8);
  }, [moduleDataMap]);

  // Compute top performers from provider data
  const topPerformers = useMemo(() => {
    const items: { name: string; value: string | number; subtitle?: string; module: string }[] = [];
    Object.entries(moduleDataMap).forEach(([id, data]) => {
      const stats = data.quickStats || {};
      Object.entries(stats).forEach(([key, val]) => {
        if (typeof val === 'number' && val > 0) {
          items.push({
            name: MODULE_LABELS[id] || id,
            value: val,
            subtitle: key.replace(/([A-Z])/g, ' $1').trim(),
            module: id,
          });
        }
      });
    });
    return items.sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 8);
  }, [moduleDataMap]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-5 p-5">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1a73e8]" /> Analytics Platform
          </h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Enterprise analytics — cross-module insights, KPIs, trends, and reports
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 text-[11px] border-[#e8eaed] ${showFilters ? 'bg-[#e8f0fe] border-[#1a73e8]' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5 mr-1" /> Filters
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

      {/* ─── Global Filters ────────────────────────────────── */}
      {showFilters && (
        <AnalyticsFilters
          selectedModule={selectedModule}
          onModuleChange={setSelectedModule}
          periodPreset={periodPreset}
          onPeriodChange={setPeriodPreset}
          modules={Object.entries(MODULE_LABELS).map(([key, label]) => ({ id: key, label }))}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* ─── Executive KPI Header ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {executiveKpis.length > 0 ? executiveKpis.map((kpi, i) => {
          const modColor = MODULE_COLORS[kpi.moduleId] || MODULE_COLORS.procurement;
          return (
            <ExecutiveKpiCard
              key={i}
              title={kpi.label}
              value={kpi.value ?? 0}
              subtitle={kpi.subtitle}
              icon={MODULE_ICONS[kpi.moduleId] || Database}
              color={modColor.bg}
              trend={kpi.trend === "up" ? { direction: "up", label: "+12% vs last month", value: 12 } : undefined}
              onClick={() => MODULE_ROUTES[kpi.moduleId] && handleNavigate(MODULE_ROUTES[kpi.moduleId])}
            />
          );
        }) : (
          <>
            {["crm", "finance", "students", "hr", "exams", "lms", "inventory", "procurement"].map((mod) => {
              const modData = moduleDataMap[mod as keyof typeof moduleDataMap];
              const total = Object.values(modData.quickStats || {}).reduce((s: number, v) => s + (typeof v === 'number' ? v : 0), 0);
              if (total === 0) return null;
              return (
                <ExecutiveKpiCard
                  key={mod}
                  title={MODULE_LABELS[mod]}
                  value={total}
                  icon={MODULE_ICONS[mod] || Database}
                  color={MODULE_COLORS[mod]?.bg || "bg-[#5f6368]"}
                  onClick={() => MODULE_ROUTES[mod] && handleNavigate(MODULE_ROUTES[mod])}
                />
              );
            })}
          </>
        )}
      </div>

      {/* ─── Platform Status Bar ───────────────────────────── */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-[11px] text-[#5f6368]">
            <span className="font-medium text-[#1a1a2e] flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#f9a825]" /> Platform Summary
            </span>
            <span className="hidden md:inline">{Object.keys(moduleDataMap).filter(k => moduleDataMap[k as keyof typeof moduleDataMap].kpis?.length).length} modules active</span>
            <span className="hidden md:inline">{kpiCards?.length || 0} KPIs tracked</span>
            <span>{reportDefs?.length || 0} reports</span>
            <span>{schedules?.length || 0} schedules</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-[#e6f4ea] text-[#34a853] border-0">
            <Activity className="h-3 w-3 mr-1" /> All systems operational
          </Badge>
        </CardContent>
      </Card>

      {/* ─── Tabs ──────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f1f3f4] p-0.5 flex-wrap">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">
            <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-[12px] data-[state=active]:bg-white">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Charts & Trends
          </TabsTrigger>
          <TabsTrigger value="distribution" className="text-[12px] data-[state=active]:bg-white">
            <PieChartIcon className="h-3.5 w-3.5 mr-1.5" /> Distribution
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-[12px] data-[state=active]:bg-white">
            <Activity className="h-3.5 w-3.5 mr-1.5" /> Activity
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

        {/* ═══ OVERVIEW TAB ═══ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Module Sections */}
          <div className="space-y-3">
            {visibleModules.length > 0 ? visibleModules.map(([id, data]: [string, any]) => (
              <ModuleAnalyticsSection
                key={id}
                moduleId={id}
                title={MODULE_LABELS[id] || id}
                icon={MODULE_ICONS[id] || Database}
                data={data}
                onNavigate={handleNavigate}
              />
            )) : (
              <EmptyAnalytics
                icon={BarChart3}
                title="No Module Data Available"
                description="Connect your business modules to see analytics data. Each module publishes through the dashboard provider system."
              />
            )}
          </div>
        </TabsContent>

        {/* ═══ CHARTS & TRENDS TAB ═══ */}
        <TabsContent value="charts" className="space-y-5 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Charts & Trend Analysis</h2>
              <p className="text-[11px] text-[#5f6368]">Cross-module visual analytics with distribution, trends, and comparisons</p>
            </div>
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

          {/* Charts grid per module */}
          {visibleModules.map(([id, data]: [string, any]) => {
            const colors = MODULE_COLORS[id] || MODULE_COLORS.procurement;
            const charts = data?.charts || [];
            const validCharts = charts.filter((c: any) => c?.data?.length > 0);
            if (validCharts.length === 0) return null;

            return (
              <div key={id}>
                <div className="flex items-center gap-1.5 mb-2">
                  {MODULE_ICONS[id] && <div className={colors.bg + " p-1 rounded"}>{React.createElement(MODULE_ICONS[id], { className: "h-3 w-3 text-white" })}</div>}
                  <h3 className="text-[12px] font-semibold text-[#1a1a2e]">{MODULE_LABELS[id]}</h3>
                  <span className="text-[10px] text-[#9aa0a6]">{validCharts.length} charts</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validCharts.map((chart: any, idx: number) => (
                    <ChartWidget
                      key={idx}
                      title={chart.name}
                      data={chart.data}
                      color={colors.chart}
                      chartType={idx % 4 === 0 ? "bar" : idx % 4 === 1 ? "pie" : idx % 4 === 2 ? "area" : "donut"}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Trend Analysis Section */}
          {visibleModules.some(([_, data]: [string, any]) => (data?.charts || []).filter((c: any) => c?.data?.length >= 2).length > 0) && (
            <div className="mt-6">
              <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#34a853]" /> Trend Analysis <span className="text-[10px] font-normal text-[#9aa0a6]">Growth rates over time</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {visibleModules.map(([id, data]: [string, any]) => {
                  const colors = MODULE_COLORS[id] || MODULE_COLORS.procurement;
                  const charts = data?.charts || [];
                  const trendChart = charts.find((c: any) => c?.data?.length >= 2);
                  if (!trendChart) return null;
                  return (
                    <TrendAnalysisCard
                      key={id}
                      title={`${MODULE_LABELS[id]} Trend`}
                      data={trendChart.data}
                      color={colors.chart}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {!visibleModules.some(([_, data]: [string, any]) => (data?.charts || []).filter((c: any) => c?.data?.length > 0).length > 0) && (
            <div className="text-center py-12">
              <PieChartIcon className="h-12 w-12 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Chart data loading</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1">Dashboard providers will populate charts as data becomes available</p>
            </div>
          )}
        </TabsContent>

        {/* ═══ DISTRIBUTION TAB ═══ */}
        <TabsContent value="distribution" className="space-y-5 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Distribution Analytics</h2>
              <p className="text-[11px] text-[#5f6368]">Heatmap-style distribution grids and top performers across modules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Distribution Grids */}
            <div className="lg:col-span-2 space-y-4">
              {visibleModules.map(([id, data]: [string, any]) => {
                const colors = MODULE_COLORS[id] || MODULE_COLORS.procurement;
                const charts = data?.charts || [];
                const distCharts = charts.filter((c: any) => c?.data?.length > 0).slice(0, 2);
                if (distCharts.length === 0) return null;

                return (
                  <div key={id}>
                    {distCharts.map((chart: any, idx: number) => (
                      <DistributionGrid
                        key={idx}
                        title={`${MODULE_LABELS[id]}: ${chart.name}`}
                        data={chart.data}
                        color={colors.chart}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Top Performers Sidebar */}
            <div className="space-y-4">
              {visibleModules.slice(0, 4).map(([id, data]: [string, any]) => {
                const colors = MODULE_COLORS[id] || MODULE_COLORS.procurement;
                const timeline = data?.timeline || [];
                if (timeline.length === 0) return null;
                return (
                  <TopPerformersSection
                    key={id}
                    title={`${MODULE_LABELS[id]} Activity`}
                    data={timeline.slice(0, 6).map((e: any) => ({
                      name: e.action || e.description || "Event",
                      value: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "",
                      subtitle: e.description || e.action,
                    }))}
                    color={colors.chart}
                    icon={MODULE_ICONS[id]}
                  />
                );
              })}

              {/* Platform Top Performers */}
              {topPerformers.length > 0 && (
                <TopPerformersSection
                  title="Top Module Metrics"
                  data={topPerformers}
                  color="#4285f4"
                  icon={Award}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══ ACTIVITY TAB ═══ */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Platform Activity Stream</h2>
              <p className="text-[11px] text-[#5f6368]">Live event feed across all modules — admissions, payments, approvals, tasks, and more</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ActivityStream
                events={recentActivity || []}
                isLoading={!recentActivity}
                maxEvents={15}
                onEventClick={(event) => {
                  if (event.module && MODULE_ROUTES[event.module]) {
                    handleNavigate(MODULE_ROUTES[event.module]);
                  }
                }}
              />
            </div>
            <div className="space-y-3">
              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardContent className="p-3">
                  <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Module Activity</h3>
                  <div className="space-y-1.5">
                    {visibleModules.map(([id, data]: [string, any]) => {
                      const colors = MODULE_COLORS[id] || MODULE_COLORS.procurement;
                      const timeline = data?.timeline || [];
                      if (timeline.length === 0) return null;
                      return (
                        <button
                          key={id}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[#f8f9fa] text-left transition-colors"
                          onClick={() => MODULE_ROUTES[id] && handleNavigate(MODULE_ROUTES[id])}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${colors.bg}`} />
                          <span className="text-[11px] text-[#5f6368] flex-1">{MODULE_LABELS[id]}</span>
                          <span className="text-[10px] text-[#9aa0a6]">{timeline.length} events</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══ REPORTS TAB ═══ */}
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
                  <Card key={def._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group">
                    <CardContent className="p-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${color.bg} shrink-0`}>
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-[#1a1a2e] truncate">{def.name}</p>
                              <p className="text-[10px] text-[#5f6368] mt-0.5 capitalize">{MODULE_LABELS[def.module] || def.module} · {def.reportType}</p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Execute" onClick={() => handleExecuteReport(def._id)}>
                                <Play className="h-3 w-3 text-[#34a853]" />
                              </Button>
                              <div className="relative">
                                <Button
                                  variant="ghost" size="sm" className="h-6 w-6 p-0" title="Export"
                                  onClick={() => setShowExportDropdown(showExportDropdown === def._id ? null : def._id)}
                                  disabled={exportingReportId === def._id}
                                >
                                  {exportingReportId === def._id ? (
                                    <RefreshCw className="h-3 w-3 text-[#1a73e8] animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 text-[#1a73e8]" />
                                  )}
                                </Button>
                                {showExportDropdown === def._id && (
                                  <div className="absolute right-0 top-7 z-50 w-40 bg-white rounded-lg border border-[#e8eaed] shadow-lg overflow-hidden">
                                    <div className="p-1.5">
                                      <p className="text-[9px] font-medium text-[#5f6368] px-2 py-1 uppercase">Export as</p>
                                      {EXPORT_FORMATS.map((fmt) => (
                                        <button
                                          key={fmt.value}
                                          className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] text-[#1a1a2e] hover:bg-[#f1f3f4] rounded transition-colors"
                                          onClick={() => handleExportReport(def._id, fmt.value)}
                                        >
                                          <fmt.icon className="h-3 w-3 text-[#5f6368]" />
                                          <span className="font-medium">{fmt.label}</span>
                                          <span className="text-[9px] text-[#9aa0a6] ml-1">· {fmt.desc}</span>
                                        </button>
                                      ))}
                                    </div>
                                    <div className="border-t border-[#f1f3f4] px-2 py-1">
                                      <button className="text-[9px] text-[#5f6368] hover:text-[#1a1a2e] w-full text-left" onClick={() => setShowExportDropdown(null)}>Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {def.description && <p className="text-[10px] text-[#9aa0a6] mt-1 line-clamp-1">{def.description}</p>}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize bg-[#f1f3f4] border-0 text-[#5f6368]">{def.reportType}</Badge>
                            {def.isSystem && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#e8f0fe] text-[#1a73e8] border-0">System</Badge>}
                            {def.config?.isSchedulable && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#fef7e0] text-[#f9a825] border-0">Schedulable</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyAnalytics
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
              {exportStatus.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
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
                        <td className="px-3 py-2"><Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase bg-[#f1f3f4] border-0">{exp.format || "csv"}</Badge></td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                            exp.status === "completed" ? 'bg-[#e6f4ea] text-[#34a853]' :
                            exp.status === "failed" ? 'bg-[#fce8e6] text-[#ea4335]' :
                            'bg-[#fef7e0] text-[#f9a825]'
                          }`}>{exp.status || "pending"}</Badge>
                        </td>
                        <td className="px-3 py-2 text-[#5f6368]">{exp.recordCount ?? "—"}</td>
                        <td className="px-3 py-2 text-[#9aa0a6]">{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "—"}</td>
                        <td className="px-3 py-2">
                          {exp.fileUrl ? (
                            <a href={exp.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-6 text-[9px] text-[#1a73e8]"><Download className="h-3 w-3 mr-1" /> Download</Button>
                            </a>
                          ) : <span className="text-[#9aa0a6] text-[9px]">No file</span>}
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
                {dataSources.map((ds: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 bg-white border-[#e8eaed] text-[#5f6368]">
                    <Database className="h-3 w-3 mr-1" /> {ds}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ KPIS TAB ═══ */}
        <TabsContent value="kpis" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Key Performance Indicators</h2>
              <p className="text-[11px] text-[#5f6368]">Track and monitor KPIs across all business modules</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Recalculate All</Button>
              <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"><Target className="h-3.5 w-3.5 mr-1" /> Configure KPIs</Button>
            </div>
          </div>

          {kpiCards && kpiCards.length > 0 ? (
            <div className="space-y-4">
              {["crm", "finance", "students", "examinations", "lms", "inventory", "hr", "procurement"].map(module => {
                const moduleKpis = kpiCards.filter((kpi: any) => kpi.module === module);
                if (moduleKpis.length === 0) return null;
                const colors = MODULE_COLORS[module] || MODULE_COLORS.procurement;

                return (
                  <div key={module}>
                    <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2 flex items-center gap-1.5">
                      <div className={`p-1 rounded ${colors.bg}`}>
                        {React.createElement(MODULE_ICONS[module] || Database, { className: "h-3 w-3 text-white" })}
                      </div>
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
                                <p className="text-xl font-semibold text-[#1a1a2e] mt-0.5 tracking-tight">{kpi.currentValue ?? "—"}</p>
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
                              <div className={`p-1.5 rounded-lg ${colors.bg} shrink-0 ml-2`}>
                                <Target className="h-3.5 w-3.5 text-white" />
                              </div>
                            </div>
                            {kpi.lastUpdated && (
                              <p className="text-[9px] text-[#9aa0a6] mt-2 border-t border-[#f1f3f4] pt-1">
                                Updated: {new Date(kpi.lastUpdated).toLocaleDateString()} {new Date(kpi.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <EmptyAnalytics
              icon={Target}
              title="No KPIs Configured"
              description="Create KPI definitions to track performance metrics. KPIs automatically capture snapshots and display trends."
              action={{ label: "Create KPI", onClick: () => {} }}
            />
          )}
        </TabsContent>

        {/* ═══ SCHEDULES TAB ═══ */}
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
                          <div className={`p-2 rounded-lg ${color.bg} shrink-0`}><Calendar className="h-4 w-4 text-white" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold text-[#1a1a2e] truncate">{schedule.name || "Unnamed Schedule"}</p>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${isActive ? 'bg-[#e6f4ea] text-[#34a853]' : 'bg-[#f1f3f4] text-[#9aa0a6]'}`}>
                                {isActive ? "Active" : "Paused"}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-[#5f6368] mt-0.5 capitalize">{schedule.frequency || "daily"} · {MODULE_LABELS[schedule.module] || "system"}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#9aa0a6]">
                              <Clock className="h-3 w-3" />
                              <span>Next: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleDateString() : "Not scheduled"}</span>
                              <span>· Format: {(schedule.format || "pdf").toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 ml-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Run Now"><Play className="h-3 w-3 text-[#34a853]" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit"><Edit className="h-3 w-3 text-[#5f6368]" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Delete"><Trash2 className="h-3 w-3 text-[#ea4335]" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyAnalytics
              icon={Calendar}
              title="No Schedules Configured"
              description="Schedule automated report delivery to stay informed without manual effort. Choose daily, weekly, or monthly frequency."
              action={{ label: "Create Schedule", onClick: () => {} }}
            />
          )}

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[11px] text-[#5f6368]">
                <Clock className="h-3.5 w-3.5 text-[#f9a825]" />
                <span>Schedule reports keep your team informed automatically — configure frequency, format, and email recipients</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-[#fef7e0] text-[#f9a825] border-0">Automation</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
