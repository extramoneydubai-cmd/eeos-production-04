/**
 * TechnologyWorkspace — Enterprise Technology Workspace (PATCH-ERP-003 Phase 2)
 *
 * Route: /studio/technology
 *
 * Everything is runtime-driven — no mock widgets:
 *   - Overview       → runtimeObservability system health + queue + workflow health
 *   - Deployments    → deploymentHistory (record new deploys)
 *   - Scheduled Jobs → adminEngine scheduled jobs + create/toggle
 *   - Integrations   → integrationEngine dashboard + API keys + webhooks
 *   - AI & Usage     → techMetrics (AI usage / storage / licenses / latency)
 *   - Health & Errors→ event pipeline, SLA breaches, scope violations, workflow failures
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Server, Rocket, CalendarClock, Plug, Sparkles, Activity,
  AlertTriangle, CheckCircle2, Shield, Database, Clock, RefreshCw,
  KeyRound, Webhook, Workflow, HardDrive, Gauge,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────
function fmtTime(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function healthColor(status?: string): string {
  switch (status) {
    case "HEALTHY": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "WARNING": return "bg-amber-100 text-amber-700 border-amber-200";
    case "ERROR":
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function Kpi({ label, value, sub, icon: Icon, color }: any) {
  return (
    <Card className="border-[#e8eaed]">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[#9aa0a6] truncate">{label}</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5 truncate">{value ?? "—"}</p>
            {sub && <p className="text-[9px] text-[#5f6368] mt-0.5 truncate">{sub}</p>}
          </div>
          <div className={cn("p-2 rounded-lg shrink-0", color || "bg-[#e8f0fe]")}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══ TAB: Overview ═════════════════════════════════════════
function OverviewTab({ dash, adminHealth }: any) {
  const sh = dash?.systemHealth;
  const checks: Record<string, { status: string; message: string }> = sh?.checks || {};
  const queues: Record<string, number> = dash?.queues || {};
  const wf = dash?.workflowHealth || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <Kpi label="Runtime Health" value={sh?.overall || "—"} icon={Gauge}
          color={sh?.overall === "CRITICAL" ? "bg-red-500" : sh?.overall === "WARNING" ? "bg-amber-500" : "bg-emerald-500"} />
        <Kpi label="Checks" value={`${sh?.healthyCount ?? 0}/${sh?.totalChecks ?? 0}`} sub="healthy" icon={CheckCircle2} color="bg-emerald-500" />
        <Kpi label="Open Tickets" value={queues.openTickets ?? 0} icon={Activity} color="bg-blue-500" />
        <Kpi label="Workflow Running" value={queues.workflowRunning ?? 0} icon={Workflow} color="bg-violet-500" />
        <Kpi label="Doc Queue" value={queues.documentGeneration ?? 0} icon={HardDrive} color="bg-amber-500" />
        <Kpi label="Workflow Success" value={`${wf.successRate ?? 100}%`} icon={RefreshCw} color="bg-cyan-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-[#e8eaed] lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-[#1a73e8]" /> Runtime Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(checks).map(([name, c]) => (
                <div key={name} className="flex items-center gap-2 rounded-lg border border-[#f1f3f4] px-2.5 py-2">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", {
                    "bg-emerald-500": c.status === "HEALTHY",
                    "bg-amber-400": c.status === "WARNING",
                    "bg-red-500": c.status === "ERROR",
                  })} />
                  <span className="text-[11px] font-medium text-[#1a1a2e] capitalize flex-1">{name}</span>
                  <span className="text-[9px] text-[#5f6368] truncate max-w-[140px]">{c.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e8eaed]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#34a853]" /> API & Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-[#5f6368]">Convex Status</span><strong className="text-emerald-600">{adminHealth?.databaseStatus || "connected"}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Backend Status</span><strong className="text-emerald-600">{adminHealth?.status || "healthy"}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Uptime</span><strong>{adminHealth?.uptime ? `${Math.floor(adminHealth.uptime / 60)}m` : "—"}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Registered Users</span><strong>{adminHealth?.totalUsers ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Last Checked</span><strong className="text-[10px]">{fmtTime(adminHealth?.lastChecked)}</strong></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══ TAB: Deployments ══════════════════════════════════════
function DeploymentsTab({ dash, userId }: any) {
  const { toast } = useToast();
  const recordDeployment = useMutation(api.technologyEngine.recordDeployment);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [status, setStatus] = useState("success");
  const [trigger, setTrigger] = useState("manual");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const deployments = dash?.deployments || [];

  const submit = async () => {
    if (!version.trim()) return;
    setSubmitting(true);
    try {
      await recordDeployment({
        version: version.trim(),
        environment: environment as any,
        status: status as any,
        trigger: trigger.trim() || "manual",
        deployedBy: userId && !String(userId).startsWith("local_") ? (userId as Id<"users">) : undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: "Deployment recorded", description: `${version.trim()} → ${environment}` });
      setOpen(false); setVersion(""); setNotes("");
    } catch (err: any) {
      toast({ title: "Failed to record deployment", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-[#1a1a2e]">Deployment History</h3>
          <p className="text-[10px] text-[#5f6368]">{deployments.length} recorded deployments</p>
        </div>
        <Button size="sm" className="h-8 text-[11px] bg-[#1a73e8]" onClick={() => setOpen(true)}>
          <Rocket className="h-3 w-3 mr-1" /> Record Deployment
        </Button>
      </div>

      <Card className="border-[#e8eaed] overflow-hidden">
        <div className="divide-y divide-[#f1f3f4]">
          {deployments.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#9aa0a6]">
              <Rocket className="h-6 w-6 mx-auto mb-2 text-[#d1e4ff]" />
              No deployments recorded yet. Record your first release above.
            </div>
          ) : deployments.map((d: any) => (
            <div key={d._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa]">
              <span className={cn("h-2 w-2 rounded-full shrink-0", {
                "bg-emerald-500": d.status === "success",
                "bg-red-500": d.status === "failed" || d.status === "rolled_back",
                "bg-amber-400": d.status === "in_progress",
              })} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#1a1a2e]">{d.version}</span>
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-normal">{d.environment}</Badge>
                  <span className="text-[9px] text-[#5f6368]">{d.trigger}</span>
                </div>
                <p className="text-[10px] text-[#5f6368] mt-0.5 truncate">{d.notes || "—"} · {fmtTime(d.deployedAt)}</p>
              </div>
              <Badge className={cn("text-[8px] h-4 capitalize", healthColor(d.status === "rolled_back" ? "WARNING" : d.status === "success" ? "HEALTHY" : d.status === "in_progress" ? "WARNING" : "CRITICAL"))}>
                {d.status.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Record Deployment</DialogTitle>
            <DialogDescription className="text-xs">Log a release for the version history register.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Version</Label>
              <Input className="h-9 text-xs" placeholder="v1.4.2" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Environment</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production" className="text-xs">Production</SelectItem>
                    <SelectItem value="staging" className="text-xs">Staging</SelectItem>
                    <SelectItem value="development" className="text-xs">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success" className="text-xs">Success</SelectItem>
                    <SelectItem value="failed" className="text-xs">Failed</SelectItem>
                    <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="rolled_back" className="text-xs">Rolled Back</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Trigger</Label>
              <Input className="h-9 text-xs" placeholder="manual / CI / scheduled" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Notes</Label>
              <Input className="h-9 text-xs" placeholder="Release notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={submitting || !version.trim()}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══ TAB: Scheduled Jobs ═══════════════════════════════════
function JobsTab({ dash }: any) {
  const { toast } = useToast();
  const createJob = useMutation(api.adminEngine.createScheduledJob);
  const toggleJob = useMutation(api.adminEngine.toggleJob);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [jobType, setJobType] = useState("cron");
  const [schedule, setSchedule] = useState("0 0 * * *");

  const jobs = dash?.scheduledJobs || [];

  const submit = async () => {
    if (!name.trim()) return;
    try {
      await createJob({ name: name.trim(), jobType, schedule: schedule.trim() || "0 0 * * *" });
      toast({ title: "Job scheduled", description: name.trim() });
      setOpen(false); setName("");
    } catch (err: any) {
      toast({ title: "Failed to schedule job", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-[#1a1a2e]">Scheduled Jobs</h3>
          <p className="text-[10px] text-[#5f6368]">
            {jobs.length} jobs · <span className="text-red-600">{dash?.failedJobsCount ?? 0} failed</span>
          </p>
        </div>
        <Button size="sm" className="h-8 text-[11px] bg-[#1a73e8]" onClick={() => setOpen(true)}>
          <CalendarClock className="h-3 w-3 mr-1" /> New Job
        </Button>
      </div>

      <Card className="border-[#e8eaed] overflow-hidden">
        <div className="divide-y divide-[#f1f3f4]">
          {jobs.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#9aa0a6]">
              <CalendarClock className="h-6 w-6 mx-auto mb-2 text-[#d1e4ff]" />
              No scheduled jobs yet.
            </div>
          ) : jobs.map((j: any) => (
            <div key={j._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa]">
              <span className={cn("h-2 w-2 rounded-full shrink-0", j.isActive === false ? "bg-slate-300" : j.lastRunStatus === "failed" ? "bg-red-500" : "bg-emerald-500")} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#1a1a2e]">{j.name}</p>
                <p className="text-[10px] text-[#5f6368] mt-0.5">
                  {j.jobType} · <span className="font-mono">{j.schedule || "—"}</span>
                  {j.nextRun ? ` · next ${fmtTime(j.nextRun)}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px]"
                onClick={async () => { await toggleJob({ id: j._id, isActive: !j.isActive }); }}>
                {j.isActive === false ? "Enable" : "Disable"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Schedule Job</DialogTitle>
            <DialogDescription className="text-xs">Register a cron job for the queue runtime.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Name</Label>
              <Input className="h-9 text-xs" placeholder="Nightly report export" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Job Type</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cron" className="text-xs">Cron</SelectItem>
                    <SelectItem value="report" className="text-xs">Report</SelectItem>
                    <SelectItem value="sync" className="text-xs">Sync</SelectItem>
                    <SelectItem value="cleanup" className="text-xs">Cleanup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Schedule (cron)</Label>
                <Input className="h-9 text-xs font-mono" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!name.trim()}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══ TAB: Integrations ═════════════════════════════════════
function IntegrationsTab({ dash }: any) {
  const integ = dash?.integrations || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Kpi label="Connectors" value={integ.totalConnectors ?? 0} icon={Plug} color="bg-violet-500" />
        <Kpi label="Active" value={integ.activeConnectors ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
        <Kpi label="API Keys" value={dash?.apiKeys ?? 0} sub={`${dash?.activeApiKeys ?? 0} active`} icon={KeyRound} color="bg-blue-500" />
        <Kpi label="Webhooks" value={dash?.webhooks ?? 0} sub={`${dash?.activeWebhooks ?? 0} active`} icon={Webhook} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-[#e8eaed]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <Plug className="h-3.5 w-3.5 text-[#1a73e8]" /> Connector Types ({integ.availableTypes ?? 0} available)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(integ.byType || []).length === 0 ? (
              <p className="text-center py-6 text-xs text-[#9aa0a6]">No connector instances configured.</p>
            ) : (integ.byType as any[]).map((c: any) => (
              <div key={c.type} className="flex items-center gap-2.5 rounded-lg border border-[#f1f3f4] px-3 py-2">
                <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: `${c.color}1a` }}>
                  <span className="text-[11px] font-bold" style={{ color: c.color }}>{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#1a1a2e]">{c.name}</p>
                  <p className="text-[9px] text-[#5f6368]">{c.type}</p>
                </div>
                <span className="text-[10px] text-[#5f6368]">{c.active}/{c.total} active</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#e8eaed]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-[#34a853]" /> Integration Surface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-[#5f6368]">Registered API Keys</span><strong>{dash?.apiKeys ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Active API Keys</span><strong className="text-emerald-600">{dash?.activeApiKeys ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Webhook Endpoints</span><strong>{dash?.webhooks ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Active Webhooks</span><strong className="text-emerald-600">{dash?.activeWebhooks ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Available Connector Types</span><strong>{integ.availableTypes ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Backups Taken</span><strong>{dash?.backups?.length ?? 0}</strong></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══ TAB: AI & Usage ═══════════════════════════════════════
const METRIC_LABELS: Record<string, string> = {
  ai_usage: "AI Usage",
  storage_usage: "Storage Usage",
  license_usage: "License Usage",
  search_latency_p95: "Search Latency (p95)",
  workflow_failures: "Workflow Failures",
};

function UsageTab({ dash }: any) {
  const { toast } = useToast();
  const recordMetric = useMutation(api.technologyEngine.recordTechMetric);
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState("ai_usage");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("calls");

  const latest = dash?.metricLatest || {};
  const history = dash?.metricHistory || {};

  const submit = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    try {
      await recordMetric({ metric, value: num, unit: unit || undefined });
      toast({ title: "Metric recorded", description: `${METRIC_LABELS[metric] || metric}: ${num} ${unit}` });
      setOpen(false); setValue("");
    } catch (err: any) {
      toast({ title: "Failed to record metric", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-[#1a1a2e]">AI, Storage & License Usage</h3>
          <p className="text-[10px] text-[#5f6368]">Time-series usage metrics recorded by the platform.</p>
        </div>
        <Button size="sm" className="h-8 text-[11px] bg-[#1a73e8]" onClick={() => setOpen(true)}>
          <Sparkles className="h-3 w-3 mr-1" /> Record Metric
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {Object.entries(latest).map(([key, m]: any) => (
          <Card key={key} className="border-[#e8eaed]">
            <CardContent className="p-3.5">
              <p className="text-[10px] font-medium text-[#9aa0a6]">{METRIC_LABELS[key] || key}</p>
              <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">
                {m?.value?.toLocaleString?.() ?? m?.value ?? "—"}
                {m?.unit ? <span className="text-[10px] text-[#5f6368] font-normal"> {m.unit}</span> : null}
              </p>
              <p className="text-[9px] text-[#5f6368] mt-0.5">{fmtTime(m?.recordedAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#e8eaed] overflow-hidden">
        <div className="divide-y divide-[#f1f3f4]">
          {Object.entries(history).length === 0 ? (
            <div className="text-center py-10 text-xs text-[#9aa0a6]">
              <Sparkles className="h-6 w-6 mx-auto mb-2 text-[#d1e4ff]" />
              No usage metrics recorded yet.
            </div>
          ) : Object.entries(history).map(([key, points]: any) => (
            <div key={key} className="px-4 py-2.5">
              <p className="text-[11px] font-medium text-[#1a1a2e] mb-1.5">{METRIC_LABELS[key] || key}</p>
              <div className="flex items-end gap-1 h-10">
                {points.slice(-12).map((p: any, i: number) => (
                  <div key={i} className="flex-1 bg-[#e8f0fe] rounded-sm" style={{
                    height: `${Math.min(100, Math.max(8, (p.value / (Math.max(...points.map((x: any) => x.value), 1)))) * 100)}%`,
                  }} title={`${p.value} · ${fmtTime(p.recordedAt)}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Record Usage Metric</DialogTitle>
            <DialogDescription className="text-xs">Log a platform usage snapshot (AI calls, storage, licenses, latency).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Metric</Label>
              <Select value={metric} onValueChange={(v) => { setMetric(v); setUnit(v === "search_latency_p95" ? "ms" : v === "storage_usage" ? "GB" : v === "license_usage" ? "seats" : "calls"); }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METRIC_LABELS).map(([k, l]) => <SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Value</Label>
                <Input className="h-9 text-xs" type="number" placeholder="0" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Unit</Label>
                <Input className="h-9 text-xs" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={value === ""}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══ TAB: Health & Errors ══════════════════════════════════
function ErrorsTab({ dash }: any) {
  const ep = dash?.eventPipeline || {};
  const sla = dash?.slaBreaches || { totalBreaches: 0, byPriority: {}, recentBreaches: [] };
  const scope = dash?.scopeViolations || { totalViolations: 0, byModule: [], recentViolations: [] };
  const wf = dash?.workflowHealth || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Kpi label="Event Pipeline" value={ep.health || "UNKNOWN"} icon={Activity}
          color={ep.health === "CRITICAL" ? "bg-red-500" : ep.health === "WARNING" ? "bg-amber-500" : "bg-emerald-500"} />
        <Kpi label="Event Error Rate" value={`${ep.errorRate ?? 0}%`} icon={AlertTriangle} color="bg-orange-500" />
        <Kpi label="SLA Breaches" value={sla.totalBreaches} icon={Clock} color={sla.totalBreaches > 0 ? "bg-red-500" : "bg-emerald-500"} />
        <Kpi label="Scope Violations" value={scope.totalViolations} icon={Shield} color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-[#e8eaed]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <Workflow className="h-3.5 w-3.5 text-[#1a73e8]" /> Workflow Failures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-[#5f6368]">Total Instances</span><strong>{wf.total ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Running</span><strong className="text-blue-600">{wf.running ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Failed</span><strong className="text-red-600">{wf.failed ?? 0}</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Success Rate</span><strong className="text-emerald-600">{wf.successRate ?? 100}%</strong></div>
            <div className="flex justify-between"><span className="text-[#5f6368]">Pending</span><strong>{wf.pending ?? 0}</strong></div>
          </CardContent>
        </Card>

        <Card className="border-[#e8eaed]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#f59e0b]" /> SLA Breaches (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {(sla.recentBreaches || []).length === 0 ? (
                <p className="text-center py-4 text-xs text-[#9aa0a6]">No SLA breaches in the last 24h.</p>
              ) : (sla.recentBreaches as any[]).map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[#f1f3f4] px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[#1a1a2e] truncate">{b.subject}</p>
                    <p className="text-[9px] text-[#5f6368] capitalize">{b.priority} · overdue by {b.overdueBy}</p>
                  </div>
                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e8eaed]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#1a1a2e] flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#a855f7]" /> Scope Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {(scope.byModule || []).length === 0 ? (
                <p className="text-center py-4 text-xs text-[#9aa0a6]">No permission denials logged.</p>
              ) : (scope.byModule as any[]).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[#f1f3f4] px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-[#1a1a2e] capitalize">{m.module}</span>
                  <span className="text-[10px] text-[#5f6368]">{m.count} denied</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══ MAIN ══════════════════════════════════════════════════
export default function TechnologyWorkspace() {
  const { user } = useAuth();
  const dashboard = useQuery(api.technologyEngine.getTechnologyDashboard) as any;
  const adminHealth = useQuery(api.adminEngine.getSystemHealth) as any;

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#e8f0fe] flex items-center justify-center">
            <Server className="h-4.5 w-4.5 text-[#1a73e8]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a2e]">Technology Workspace</h1>
            <p className="text-[11px] text-[#5f6368]">
              Infrastructure · Deployments · Queues · Integrations · AI & Storage · Error Health
            </p>
          </div>
          <Badge variant="outline" className="ml-auto text-[9px] h-4.5 font-normal bg-white">
            <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", (dashboard.systemHealth?.overall || "HEALTHY") === "CRITICAL" ? "bg-red-500" : (dashboard.systemHealth?.overall || "HEALTHY") === "WARNING" ? "bg-amber-400" : "bg-emerald-500")} />
            Runtime {dashboard.systemHealth?.overall || "HEALTHY"}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-[#e8eaed] h-9">
            <TabsTrigger value="overview" className="text-[11px]"><Gauge className="h-3 w-3 mr-1" /> Overview</TabsTrigger>
            <TabsTrigger value="deployments" className="text-[11px]"><Rocket className="h-3 w-3 mr-1" /> Deployments</TabsTrigger>
            <TabsTrigger value="jobs" className="text-[11px]"><CalendarClock className="h-3 w-3 mr-1" /> Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="integrations" className="text-[11px]"><Plug className="h-3 w-3 mr-1" /> Integrations</TabsTrigger>
            <TabsTrigger value="usage" className="text-[11px]"><Sparkles className="h-3 w-3 mr-1" /> AI & Usage</TabsTrigger>
            <TabsTrigger value="errors" className="text-[11px]"><AlertTriangle className="h-3 w-3 mr-1" /> Health & Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab dash={dashboard} adminHealth={adminHealth} /></TabsContent>
          <TabsContent value="deployments"><DeploymentsTab dash={dashboard} userId={user?._id} /></TabsContent>
          <TabsContent value="jobs"><JobsTab dash={dashboard} /></TabsContent>
          <TabsContent value="integrations"><IntegrationsTab dash={dashboard} /></TabsContent>
          <TabsContent value="usage"><UsageTab dash={dashboard} /></TabsContent>
          <TabsContent value="errors"><ErrorsTab dash={dashboard} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
