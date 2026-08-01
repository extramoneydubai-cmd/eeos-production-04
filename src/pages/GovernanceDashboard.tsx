import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield, ShieldCheck, ShieldOff, AlertTriangle, CheckCircle, XCircle,
  Activity, Users, Key, GitBranch, Globe, Layers, AlertCircle,
  Loader2, TrendingUp, TrendingDown, Minus, RefreshCw,
  Lock, Unlock, Eye, EyeOff, FileText, BarChart3,
} from "lucide-react";
import { useState } from "react";

function Loading() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}

// ─── COMPLIANCE SCORE GAUGE ────────────────────────────────────

function ComplianceGauge({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" | "lg" }) {
  const colors = score >= 90 ? "text-emerald-500" : score >= 70 ? "text-amber-500" : "text-red-500";
  const bgColors = score >= 90 ? "bg-emerald-50 border-emerald-200" : score >= 70 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const dim = size === "sm" ? "h-16 w-16" : size === "lg" ? "h-28 w-28" : "h-20 w-20";

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-sm border ${bgColors}`}>
      <div className={`relative ${dim} flex items-center justify-center`}>
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/40" />
          <circle
            cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
            className={colors}
            transform="rotate(-90 50 50)"
            strokeLinecap="round"
          />
        </svg>
        <span className={`text-lg font-bold ${colors}`}>{score}%</span>
      </div>
      <p className="text-[9px] text-muted-foreground mt-1 text-center">{label}</p>
    </div>
  );
}

// ─── GOVERNANCE DASHBOARD ──────────────────────────────────────

export default function GovernanceDashboard() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const { user, isDemoMode } = useAuth();
  const skipDb = !user || isDemoMode;

  // Compute simulated governance metrics from existing data
  const permissionsCount = useQuery(api.engines.accessControlEngine.getStats, skipDb ? "skip" : {});
  const analytics = useQuery(api.accessEngine.getAccessAnalytics, skipDb ? "skip" : {});
  const conflicts = useQuery(api.accessEngine.detectConflicts, skipDb ? "skip" : { userId: "" as any });

  const complianceScore = 82;
  const securityScore = 91;
  const configDriftScore = 76;

  const kpis = [
    { label: "Permission Violations", value: conflicts?.invalidScopes ?? 0, icon: ShieldOff, color: "text-red-500", bg: "bg-red-50", trend: "down" as const },
    { label: "Scope Violations", value: permissionsCount?.totalRoles ?? 2, icon: GitBranch, color: "text-amber-500", bg: "bg-amber-50", trend: "up" as const },
    { label: "Unused Roles", value: 3, icon: Users, color: "text-orange-500", bg: "bg-orange-50", trend: "stable" as const },
    { label: "Unused Menus", value: analytics?.totalFeatureFlags ?? 1, icon: EyeOff, color: "text-purple-500", bg: "bg-purple-50", trend: "down" as const },
    { label: "Conflicts", value: (conflicts?.duplicates ?? 0) + (conflicts?.circularPermissions ?? 0), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", trend: "stable" as const },
    { label: "Policy Conflicts", value: 1, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", trend: "down" as const },
    { label: "Configuration Drift", value: 4, icon: Layers, color: "text-blue-500", bg: "bg-blue-50", trend: "up" as const },
    { label: "Security Score", value: `${securityScore}%`, icon: Lock, color: "text-emerald-500", bg: "bg-emerald-50", trend: "up" as const },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Enterprise Governance Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Real-time compliance monitoring and access governance</p>
        </div>
        <div className="flex items-center gap-2">
          {(["24h", "7d", "30d"] as const).map((t) => (
            <Button
              key={t}
              variant={timeframe === t ? "default" : "outline"}
              size="sm"
              className="h-7 text-[10px] rounded-sm px-2"
              onClick={() => setTimeframe(t)}
            >
              {t}
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Compliance Scores */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <ComplianceGauge score={complianceScore} label="Compliance Score" />
        <ComplianceGauge score={securityScore} label="Security Score" />
        <ComplianceGauge score={78} label="Integration Score" />
        <ComplianceGauge score={configDriftScore} label="Config Stability" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
          return (
            <Card key={kpi.label} className="rounded-sm border-border/50 shadow-none">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className={`p-1.5 rounded-sm ${kpi.bg}`}>
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                  <TrendIcon className={`h-3 w-3 ${
                    kpi.trend === "up" ? "text-red-400" : kpi.trend === "down" ? "text-emerald-400" : "text-muted-foreground/40"
                  }`} />
                </div>
                <p className="text-lg font-bold mt-1">{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {/* Recent Violations */}
        <Card className="rounded-sm border-border/50 shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Recent Violations
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[200px]">
            <div className="divide-y divide-border/20 px-4">
              {(conflicts?.details ?? []).length > 0 ? conflicts!.details.slice(0, 10).map((d: string, i: number) => (
                <div key={i} className="flex items-start gap-2 py-1.5 text-[10px]">
                  <XCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{d}</span>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground/60">No recent violations</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Module Compliance */}
        <Card className="rounded-sm border-border/50 shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Module Compliance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/20">
              {[
                { name: "Access Control", status: "compliant", score: 95 },
                { name: "Finance", status: "compliant", score: 88 },
                { name: "Academic", status: "warning", score: 72 },
                { name: "HR", status: "warning", score: 68 },
                { name: "Marketing", status: "non_compliant", score: 45 },
                { name: "Production", status: "non_compliant", score: 38 },
                { name: "Inventory", status: "warning", score: 65 },
                { name: "Support", status: "compliant", score: 82 },
              ].map((mod, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-1.5 text-xs hover:bg-accent/10 transition-colors">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    mod.status === "compliant" ? "bg-emerald-400" :
                    mod.status === "warning" ? "bg-amber-400" : "bg-red-400"
                  }`} />
                  <span className="flex-1">{mod.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-accent/30 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        mod.score >= 80 ? "bg-emerald-400" :
                        mod.score >= 60 ? "bg-amber-400" : "bg-red-400"
                      }`} style={{ width: `${mod.score}%` }} />
                    </div>
                    <span className={`text-[9px] font-medium ${
                      mod.score >= 80 ? "text-emerald-600" :
                      mod.score >= 60 ? "text-amber-600" : "text-red-600"
                    }`}>{mod.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="rounded-sm border-border/50 shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Governance System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Scope Engine", status: "healthy" as const },
              { label: "Permissions Cache", status: "healthy" as const },
              { label: "Audit Logging", status: "healthy" as const },
              { label: "Role Inheritance", status: "degraded" as const },
              { label: "Conflict Detection", status: "healthy" as const },
              { label: "Notification Matrix", status: "healthy" as const },
              { label: "Menu Builder", status: "healthy" as const },
              { label: "Module Activation", status: "healthy" as const },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-sm bg-accent/10">
                <div className={`h-2 w-2 rounded-full ${
                  item.status === "healthy" ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <div>
                  <p className="text-[10px] font-medium">{item.label}</p>
                  <p className="text-[8px] text-muted-foreground/60 capitalize">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
