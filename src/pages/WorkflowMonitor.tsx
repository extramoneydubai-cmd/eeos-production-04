/**
 * WorkflowMonitor — Enterprise Workflow Monitor Dashboard
 *
 * Route: /workflow-monitor
 *
 * Widgets:
 * - KPI cards (Running, Pending, Completed, Failed, Cancelled, SLA Breaches)
 * - Running workflows list with status
 * - Execution timeline (recent)
 * - Category breakdown
 * - Bottleneck detection
 * - Approval stats
 * - Activity heatmap
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Activity, Play, Pause, CheckCircle, XCircle, AlertTriangle,
  Clock, BarChart3, Layers, Search, ChevronRight, Filter,
  Loader2, StopCircle, RefreshCw, TrendingUp, Shield,
  Calendar, Users, FileText, Gauge, Zap, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { workflowEngine } from "@/platform/workflow/WorkflowEngine";
import { approvalEngine } from "@/platform/workflow/ApprovalEngine";
import { workflowMetrics } from "@/platform/workflow/WorkflowMetrics";
import { workflowTemplateEngine } from "@/platform/workflow/WorkflowTemplateEngine";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  running: "#4285f4", pending: "#fbbc04", completed: "#34a853",
  failed: "#ea4335", cancelled: "#5f6368", blocked: "#e8710a",
  paused: "#a855f7",
};

const PIE_COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#5f6368", "#a855f7"];

export default function WorkflowMonitor() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const kpis = workflowMetrics.getKPIs();
  const templates = workflowTemplateEngine.listTemplates();
  const categories = workflowTemplateEngine.getCategories();
  const [executions, setExecutions] = useState<Awaited<ReturnType<typeof workflowEngine.listExecutions>>>([]);
  useEffect(() => {
    workflowEngine
      .listExecutions({ search, limit: 50 })
      .then((res) => setExecutions(Array.isArray(res) ? res : []))
      .catch(() => setExecutions([]));
  }, [search]);
  const approvalStats = approvalEngine.getStats();

  const filteredExecs = useMemo(() => {
    let items = executions;
    if (statusFilter !== "all") items = items.filter((e) => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((e) => e.tags?.some((t) => t.toLowerCase().includes(q)) || e.entityType?.includes(q));
    }
    return items;
  }, [executions, statusFilter, search]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1a73e8]" />
            <div>
              <h1 className="text-lg font-semibold text-[#1a1a2e]">Workflow Monitor</h1>
              <p className="text-[11px] text-[#5f6368]">{templates.length} templates · {kpis.executions.total} total executions</p>
            </div>
          </div>
          <Button size="sm" className="h-8 text-[11px]" onClick={() => navigate("/studios/workflows")}>
            <Zap className="h-3 w-3 mr-1" /> Workflow Studio
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-6">
          {[
            { label: "Running", value: kpis.executions.running, color: "text-[#4285f4]" },
            { label: "Pending", value: kpis.executions.pending, color: "text-[#fbbc04]" },
            { label: "Completed", value: kpis.executions.completed, color: "text-[#34a853]" },
            { label: "Failed", value: kpis.executions.failed, color: "text-[#ea4335]" },
            { label: "Cancelled", value: kpis.executions.cancelled, color: "text-[#5f6368]" },
            { label: "Blocked", value: kpis.executions.blocked, color: "text-[#e8710a]" },
            { label: "SLA Breaches", value: kpis.sla.breached, color: kpis.sla.breached > 0 ? "text-red-600" : "text-[#34a853]" },
            { label: "SLA Rate", value: `${kpis.sla.complianceRate}%`, color: kpis.sla.complianceRate >= 90 ? "text-[#34a853]" : "text-[#fbbc04]" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border border-[#e8eaed] p-2.5 text-center">
              <p className="text-[9px] text-[#9aa0a6] font-medium">{kpi.label}</p>
              <p className={`text-[16px] font-bold ${kpi.color} mt-0.5`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Execution List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-[#e8eaed]">
              <div className="px-4 py-2.5 border-b border-[#e8eaed] flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#1a1a2e]">Executions</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9aa0a6]" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..." className="h-7 w-[150px] text-[11px] pl-7" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-7 text-[11px] px-2 border border-[#e8eaed] rounded-md bg-white">
                    <option value="all">All</option>
                    <option value="running">Running</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="divide-y divide-[#f1f3f4] max-h-[500px] overflow-y-auto">
                {filteredExecs.slice(0, 20).map((exec) => (
                  <div key={exec._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] cursor-pointer transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[exec.status] || "#9aa0a6" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1a1a2e] truncate">
                        {exec.definitionId?.slice(0, 20)}...
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#5f6368]">
                        <span className="capitalize">{exec.status}</span>
                        {exec.entityType && <span>· {exec.entityType}</span>}
                        <span>· {new Date(exec.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1 capitalize", {
                      "bg-[#e8f0fe] text-[#1a73e8] border-[#d1e4ff]": exec.status === "running",
                      "bg-[#fef7e0] text-[#f59e0b] border-[#fde68a]": exec.status === "pending",
                      "bg-[#e6f4ea] text-[#34a853] border-[#b7e1cd]": exec.status === "completed",
                    })}>{exec.status}</Badge>
                  </div>
                ))}
                {filteredExecs.length === 0 && (
                  <div className="text-center py-8 text-[12px] text-[#9aa0a6]">No executions found</div>
                )}
              </div>
            </Card>

            {/* Activity / Timeline */}
            <Card className="border-[#e8eaed] p-4">
              <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">Activity (24h)</h3>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={kpis.heatmap}>
                  <defs>
                    <linearGradient id="hmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4285f4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4285f4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="count" stroke="#4285f4" fill="url(#hmGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Right: Analytics */}
          <div className="space-y-4">
            {/* Category Breakdown */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Categories</h3>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-[10px] text-[#1a1a2e] capitalize">{cat.label}</span>
                    <span className="text-[10px] text-[#5f6368] font-mono">{cat.count} templates</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Approval Stats */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Approvals</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-[14px] font-bold text-amber-600">{approvalStats.pending}</p>
                  <p className="text-[8px] text-amber-600">Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-[14px] font-bold text-green-600">{approvalStats.approved}</p>
                  <p className="text-[8px] text-green-600">Approved</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-[14px] font-bold text-red-600">{approvalStats.rejected}</p>
                  <p className="text-[8px] text-red-600">Rejected</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-[14px] font-bold text-orange-600">{approvalStats.escalated}</p>
                  <p className="text-[8px] text-orange-600">Escalated</p>
                </div>
              </div>
            </Card>

            {/* Bottlenecks */}
            <Card className="border-[#e8eaed] p-3.5">
              <h3 className="text-[11px] font-semibold text-[#1a1a2e] mb-2">Bottlenecks</h3>
              {kpis.bottlenecks.map((b, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4] last:border-0">
                  <div>
                    <p className="text-[10px] font-medium text-[#1a1a2e] capitalize">{b.nodeType}</p>
                    <p className="text-[8px] text-[#5f6368]">{b.count} waiting</p>
                  </div>
                  <span className="text-[10px] text-red-600 font-medium">
                    {(b.avgWaitMs / 3600000).toFixed(1)}h
                  </span>
                </div>
              ))}
            </Card>

            {/* Templates */}
            <Card className="border-[#e8eaed] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a2e]">Templates</h3>
                <span className="text-[9px] text-[#9aa0a6]">{templates.length} total</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {templates.slice(0, 10).map((t) => (
                  <Badge key={t.id} variant="outline" className="text-[8px] h-4 px-1.5">{t.name}</Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
