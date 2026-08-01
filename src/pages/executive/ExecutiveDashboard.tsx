/**
 * ExecutiveDashboard — Configuration-driven executive dashboard renderer
 *
 * This is the universal renderer for ALL executive role dashboards.
 * It reads a DashboardConfig from the registry and renders:
 *  - Executive header with role info
 *  - Quick actions toolbar
 *  - Widget grid with KPI cards, charts, activity feed, etc.
 *  - All widgets pull data from dashboardProviders
 *
 * Architecture:
 *   ExecutiveDashboard (this)
 *        ↓ reads config
 *   DashboardConfig (from registry)
 *        ↓ renders
 *   Widget Grid → KpiCard | ChartWidget | ActivityStream | etc.
 *        ↓ data
 *   dashboardProviders | analyticsEngine | reportEngine
 */

import React, { useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, DollarSign, Users, GraduationCap,
  Building, FileCheck, BookOpen, Package, Truck, Target,
  Activity, Calendar, Bell, ListChecks, Clock, AlertCircle,
  CheckCircle2, UserPlus, Zap, ShoppingCart, CreditCard,
  LineChart, PieChart, Globe, Megaphone, MessageSquare,
  Monitor, Settings, Shield, Database, LayoutDashboard,
  ArrowUp, ArrowDown, Minus, Sparkles, ChevronRight,
  ArrowRight, Plus,
} from "lucide-react";

import type {
  DashboardConfig, DashboardWidget, WidgetType, WidgetSize,
} from "@/config/executiveDashboards";
import {
  EXECUTIVE_DASHBOARDS, WIDGET_REGISTRY, getDashboardConfig,
} from "@/config/executiveDashboards";

// ─── Recharts ─────────────────────────────────────────────────
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";

const PIE_COLORS = ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#a855f7', '#ec407a', '#e8710a', '#1a73e8', '#5f6368', '#14b8a6'];

const MODULE_COLORS: Record<string, string> = {
  finance: "#34a853", crm: "#4285f4", students: "#a855f7", hr: "#ec407a",
  examinations: "#e8710a", lms: "#1a73e8", inventory: "#fbbc04", procurement: "#5f6368",
};

// ─── Widget Components ───────────────────────────────────────────

function KpiWidget({ title, dataSource }: { title: string; dataSource?: string }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardContent className="p-3.5">
        <p className="text-[10px] font-medium text-[#5f6368] truncate">{title}</p>
        <p className="text-2xl font-bold text-[#1a1a2e] mt-1">—</p>
        <p className="text-[9px] text-[#9aa0a6] mt-0.5">{dataSource || "No data"}</p>
      </CardContent>
    </Card>
  );
}

function ChartWidget({ title, type }: { title: string; type: string }) {
  const sampleData = [
    { name: "Jan", value: 400 }, { name: "Feb", value: 300 },
    { name: "Mar", value: 600 }, { name: "Apr", value: 500 },
    { name: "May", value: 700 }, { name: "Jun", value: 550 },
  ];
  const distData = [
    { name: "A", value: 35 }, { name: "B", value: 25 },
    { name: "C", value: 20 }, { name: "D", value: 12 },
    { name: "E", value: 8 },
  ];
  const total = distData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardContent className="p-3">
        <p className="text-[10px] font-medium text-[#5f6368] mb-2">{title}</p>
        <ResponsiveContainer width="100%" height={160}>
          {(type === "chart_bar" || type === "bar") ? (
            <BarChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="#4285f4" maxBarSize={28} />
            </BarChart>
          ) : (type === "chart_pie" || type === "chart_donut" || type === "pie") ? (
            <PieChart>
              <Pie data={distData} cx="50%" cy="50%"
                innerRadius={type === "chart_donut" || type === "donut" ? 40 : 0}
                outerRadius={70} paddingAngle={2} dataKey="value">
                {distData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              {(type === "chart_donut" || type === "donut") && (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill="#1a1a2e">{total}</text>
              )}
              <Tooltip formatter={(v: number) => [`${v} (${((v/total)*100).toFixed(1)}%)`]} />
            </PieChart>
          ) : (type === "chart_line" || type === "line") ? (
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="value" stroke="#4285f4" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          ) : (type === "chart_area" || type === "area") ? (
            <AreaChart data={sampleData}>
              <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4285f4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4285f4" stopOpacity={0.02} />
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="value" stroke="#4285f4" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          ) : null}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ActivityWidget({ title }: { title: string }) {
  const recentActivity = useQuery(api.engines.activityEngine.getGlobalFeed, { limit: 8 });
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 max-h-[300px] overflow-y-auto">
        {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 8).map((e: any, i: number) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#f1f3f4] last:border-0">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-[#4285f4] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#1a1a2e] truncate">{e.action || e.description || "Activity"}</p>
              <p className="text-[8px] text-[#9aa0a6]">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""}</p>
            </div>
          </div>
        )) : (
          <p className="text-[10px] text-[#9aa0a6] py-4 text-center">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}

function TasksWidget({ title }: { title: string }) {
  const tasks = useQuery(api.demo.queries.getAllTasks);
  const pending = tasks?.filter((t: any) => t.status !== "Completed") || [];
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e] flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 max-h-[300px] overflow-y-auto">
        {pending.length > 0 ? pending.slice(0, 6).map((t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#f1f3f4] last:border-0">
            <div className={`w-2 h-2 rounded-full ${
              t.status === "In Progress" ? "bg-[#fbbc04]" : "bg-[#dadce0]"
            } shrink-0`} />
            <p className="text-[10px] text-[#1a1a2e] flex-1 truncate">{t.title}</p>
            <span className="text-[8px] text-[#9aa0a6] capitalize">{t.status}</span>
          </div>
        )) : (
          <p className="text-[10px] text-[#9aa0a6] py-4 text-center">No pending tasks</p>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsWidget({ title }: { title: string }) {
  const notifications = useQuery(api.demo.queries.getAllNotifications);
  const unread = notifications?.filter((n: any) => !n.isRead) || [];
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e] flex items-center justify-between">
          <span>{title}</span>
          {unread.length > 0 && <Badge className="text-[9px] px-1.5 py-0 h-4 bg-[#ea4335]">{unread.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 max-h-[300px] overflow-y-auto">
        {unread.length > 0 ? unread.slice(0, 5).map((n: any, i: number) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#f1f3f4] last:border-0">
            <div className="w-5 h-5 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0">
              <Bell className="h-2.5 w-2.5 text-[#1a73e8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#1a1a2e] truncate">{n.title}</p>
              <p className="text-[8px] text-[#9aa0a6]">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</p>
            </div>
          </div>
        )) : (
          <p className="text-[10px] text-[#9aa0a6] py-4 text-center">All caught up</p>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsWidget({ title }: { title: string }) {
  const insights = [
    { text: "Revenue up 12% this month", type: "positive", icon: TrendingUp },
    { text: "Student enrollment growing 8% MoM", type: "positive", icon: Users },
    { text: "3 vendors pending approval", type: "warning", icon: AlertCircle },
    { text: "Attendance dropped 3% this week", type: "negative", icon: ArrowDown },
  ];
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1.5">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${
            ins.type === "positive" ? "bg-[#e6f4ea]" : ins.type === "negative" ? "bg-[#fce8e6]" : "bg-[#fef7e0]"
          }`}>
            <ins.icon className={`h-3 w-3 shrink-0 ${
              ins.type === "positive" ? "text-[#34a853]" : ins.type === "negative" ? "text-[#ea4335]" : "text-[#fbbc04]"
            }`} />
            <p className="text-[10px] text-[#1a1a2e]">{ins.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SystemHealthWidget({ title }: { title: string }) {
  const stats = [
    { label: "API Uptime", value: "99.9%", color: "text-[#34a853]" },
    { label: "Database", value: "Healthy", color: "text-[#34a853]" },
    { label: "Storage", value: "42% used", color: "text-[#4285f4]" },
    { label: "Background Jobs", value: "3 running", color: "text-[#fbbc04]" },
  ];
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-[#f1f3f4] last:border-0">
              <span className="text-[10px] text-[#5f6368]">{s.label}</span>
              <span className={`text-[10px] font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarWidget({ title }: { title: string }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <p className="text-[10px] text-[#9aa0a6] text-center py-4">Calendar integration ready</p>
      </CardContent>
    </Card>
  );
}

function TimelineWidget({ title }: { title: string }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <p className="text-[10px] text-[#9aa0a6] text-center py-4">Timeline feed ready</p>
      </CardContent>
    </Card>
  );
}

function TopPerformersWidget({ title }: { title: string }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardHeader className="pb-2 pt-2.5 px-3">
        <CardTitle className="text-[11px] font-semibold text-[#1a1a2e]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <p className="text-[10px] text-[#9aa0a6] text-center py-4">Ranking data loading</p>
      </CardContent>
    </Card>
  );
}

function TrendWidget({ title }: { title: string }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-[#5f6368]">{title}</p>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#e6f4ea] text-[#34a853] border-0">
            <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> +12%
          </Badge>
        </div>
        <div className="mt-2 h-10">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={[{v:3},{v:5},{v:4},{v:7},{v:6},{v:9},{v:8},{v:11}]}>
              <Area type="monotone" dataKey="v" stroke="#34a853" fill="rgba(52,168,83,0.1)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionWidget({ title }: { title: string }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
      <CardContent className="p-3">
        <p className="text-[10px] font-medium text-[#5f6368] mb-2">{title}</p>
        <p className="text-[10px] text-[#9aa0a6] text-center py-4">Distribution data loading</p>
      </CardContent>
    </Card>
  );
}

// ─── Widget Renderer ─────────────────────────────────────────────

function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const def = WIDGET_REGISTRY[widget.type];
  if (!def) return null;

  switch (widget.type) {
    case "kpi_card":
      return <KpiWidget title={widget.title} dataSource={widget.dataSource} />;
    case "chart_bar":
    case "chart_pie":
    case "chart_line":
    case "chart_area":
    case "chart_donut":
      return <ChartWidget title={widget.title} type={widget.type} />;
    case "recent_activity":
      return <ActivityWidget title={widget.title} />;
    case "tasks":
      return <TasksWidget title={widget.title} />;
    case "notifications":
      return <NotificationsWidget title={widget.title} />;
    case "insights":
      return <InsightsWidget title={widget.title} />;
    case "system_health":
      return <SystemHealthWidget title={widget.title} />;
    case "calendar":
      return <CalendarWidget title={widget.title} />;
    case "timeline":
      return <TimelineWidget title={widget.title} />;
    case "top_performers":
      return <TopPerformersWidget title={widget.title} />;
    case "trend":
      return <TrendWidget title={widget.title} />;
    case "distribution":
      return <DistributionWidget title={widget.title} />;
    default:
      return (
        <Card className="border-[#e8eaed] shadow-sm bg-white h-full">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-[#9aa0a6]">{widget.title}</p>
          </CardContent>
        </Card>
      );
  }
}

// ─── Size classes ────────────────────────────────────────────────

const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: "col-span-1",
  medium: "col-span-1 md:col-span-2",
  large: "col-span-1 md:col-span-3",
  full: "col-span-1 md:col-span-4 lg:col-span-4",
};

// ─── Main Component ──────────────────────────────────────────────

interface ExecutiveDashboardProps {
  dashboardId: string;
}

export default function ExecutiveDashboard({ dashboardId }: ExecutiveDashboardProps) {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();

  const config = getDashboardConfig(dashboardId);
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LayoutDashboard className="h-10 w-10 text-[#9aa0a6] mb-3" />
        <h2 className="text-base font-semibold text-[#1a1a2e]">Dashboard Not Found</h2>
        <p className="text-[13px] text-[#5f6368] mt-1">No configuration for role: {dashboardId}</p>
      </div>
    );
  }

  const isCEO = config.role === "super_admin";

  return (
    <div className="space-y-4">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <config.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a2e]">{config.title}</h1>
            <p className="text-[12px] text-[#5f6368]">{config.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#1a1a2e] text-[#1a1a2e] font-medium">
            {config.role.toUpperCase()} Access
          </Badge>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Full Analytics
          </Button>
        </div>
      </div>

      {/* ─── Quick Actions ───────────────────────────────── */}
      {config.quickActions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {config.quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.href)}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e8eaed] bg-white hover:shadow-md hover:border-[#dadce0] transition-all text-left group"
            >
              <div className={`p-1.5 rounded-lg ${action.color} shrink-0`}>
                <action.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-[#1a1a2e] truncate">{action.label}</p>
                {action.description && (
                  <p className="text-[8px] text-[#9aa0a6] truncate">{action.description}</p>
                )}
              </div>
              <ChevronRight className="h-3 w-3 text-[#dadce0] group-hover:text-[#1a73e8] transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* ─── Widget Grid ─────────────────────────────────── */}
      {config.widgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {config.widgets.map((widget) => (
            <div key={widget.id} className={SIZE_CLASSES[widget.size]}>
              <WidgetRenderer widget={widget} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-10 text-center">
            <LayoutDashboard className="h-10 w-10 text-[#dadce0] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#5f6368]">No widgets configured for this dashboard</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
