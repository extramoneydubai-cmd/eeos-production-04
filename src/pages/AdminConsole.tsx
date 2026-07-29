import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Key,
  LucideIcon,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Sliders,
  Webhook,
  Zap,
  Clock,
  HardDrive,
  Users,
  FileText,
  Download,
} from "lucide-react";

export default function AdminConsole() {
  const [healthFilter, setHealthFilter] = useState<string>("all");

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    status = "default",
  }: {
    icon: LucideIcon;
    title: string;
    value: string | number;
    subtitle?: string;
    status?: "default" | "success" | "warning" | "error";
  }) => {
    const statusColors = {
      default: "from-slate-500 to-slate-600",
      success: "from-emerald-500 to-teal-600",
      warning: "from-amber-500 to-orange-600",
      error: "from-rose-500 to-red-600",
    };

    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className={`h-1.5 bg-gradient-to-r ${statusColors[status]}`} />
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${statusColors[status]} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const healthChecks = [
    { name: "Convex Connection", status: "healthy", icon: Database },
    { name: "Authentication Service", status: "healthy", icon: Shield },
    { name: "Storage Service", status: "healthy", icon: HardDrive },
    { name: "Email Service", status: "warning", icon: Globe },
    { name: "SMS Service", status: "healthy", icon: Globe },
    { name: "WhatsApp Service", status: "unhealthy", icon: Globe },
    { name: "Webhook Service", status: "healthy", icon: Webhook },
    { name: "Cache Service", status: "healthy", icon: Cpu },
    { name: "Background Jobs", status: "healthy", icon: Clock },
    { name: "Runtime Supervisor", status: "healthy", icon: Activity },
  ];

  const filteredHealth = healthFilter === "all"
    ? healthChecks
    : healthChecks.filter((h) => h.status === healthFilter);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground text-sm mt-1">
            System administration, configuration, and monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Production
          </Badge>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm">Save Changes</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Server}
          title="System Health"
          value="92%"
          subtitle="10 services monitored"
          status="success"
        />
        <StatCard
          icon={Users}
          title="Active Users"
          value="1,247"
          subtitle="24 in last hour"
          status="default"
        />
        <StatCard
          icon={AlertTriangle}
          title="Active Alerts"
          value="3"
          subtitle="2 warnings, 1 error"
          status="warning"
        />
        <StatCard
          icon={Clock}
          title="Uptime"
          value="99.7%"
          subtitle="Last 30 days"
          status="success"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="grid w-full md:grid-cols-7">
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Health</span>
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="backups">
            <HardDrive className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Backups</span>
          </TabsTrigger>
          <TabsTrigger value="feature-flags">
            <Sliders className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Audit</span>
          </TabsTrigger>
        </TabsList>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Service Health</CardTitle>
              <div className="flex gap-2">
                {["all", "healthy", "warning", "unhealthy"].map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={healthFilter === f ? "default" : "outline"}
                    onClick={() => setHealthFilter(f)}
                    className="text-xs capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredHealth.map((check, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <check.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{check.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        check.status === "healthy"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : check.status === "warning"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {check.status === "healthy" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Application Name</label>
                  <Input defaultValue="EEOS Enterprise" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Support Email</label>
                  <Input defaultValue="support@eeos.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input type="number" defaultValue={60} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <Input type="number" defaultValue={5} className="mt-1" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Environment</span>
                  <Badge>Production</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Build Version</span>
                  <span className="text-sm font-mono">v0.96.0 (build #142)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Convex Deployment</span>
                  <span className="text-sm font-mono">prod-abc123</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Node Runtime</span>
                  <span className="text-sm font-mono">v20.11.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">API Keys</CardTitle>
              <Button size="sm">
                <Key className="h-4 w-4 mr-2" /> Generate New Key
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Production API Key", key: "eeos_live_••••••••••••", lastUsed: "2 min ago", status: "active" },
                  { name: "Development Key", key: "eeos_dev_••••••••••••", lastUsed: "1 hour ago", status: "active" },
                  { name: "Integration Testing", key: "eeos_test_••••••••••••", lastUsed: "3 days ago", status: "expired" },
                ].map((k, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{k.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{k.key}</p>
                      <p className="text-xs text-muted-foreground">Last used: {k.lastUsed}</p>
                    </div>
                    <Badge variant={k.status === "active" ? "default" : "secondary"}>
                      {k.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Webhook Endpoints</CardTitle>
              <Button size="sm">
                <Webhook className="h-4 w-4 mr-2" /> Add Endpoint
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Student Enrollment", url: "https://api.example.com/enroll", events: 1243, status: "active" },
                  { name: "Payment Notification", url: "https://api.example.com/payments", events: 5678, status: "active" },
                  { name: "Support Ticket Updates", url: "https://hooks.example.com/tickets", events: 892, status: "paused" },
                ].map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{w.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{w.url}</p>
                      <p className="text-xs text-muted-foreground">{w.events} events processed</p>
                    </div>
                    <Badge variant={w.status === "active" ? "default" : "secondary"}>{w.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Backup Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Last Backup</span>
                  <span className="text-sm">15 Jul 2026, 03:00 AM</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Backup Size</span>
                  <span className="text-sm">156 MB</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Schedule</span>
                  <Badge variant="outline">Daily at 03:00 AM</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Retention</span>
                  <span className="text-sm">30 days</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" /> Download Backup
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Zap className="h-4 w-4 mr-2" /> Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Backup History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { date: "15 Jul 2026", size: "156 MB", status: "success" },
                    { date: "14 Jul 2026", size: "154 MB", status: "success" },
                    { date: "13 Jul 2026", size: "152 MB", status: "success" },
                    { date: "12 Jul 2026", size: "0 B", status: "failed" },
                    { date: "11 Jul 2026", size: "151 MB", status: "success" },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
                      <span className="text-sm">{b.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{b.size}</span>
                        <Badge
                          variant="outline"
                          className={
                            b.status === "success"
                              ? "bg-emerald-50 text-emerald-700 text-xs"
                              : "bg-red-50 text-red-700 text-xs"
                          }
                        >
                          {b.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="feature-flags" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Feature Flags</CardTitle>
              <Button size="sm" variant="outline">
                <Sliders className="h-4 w-4 mr-2" /> Add Flag
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "marketing-automation", description: "Marketing automation module", scope: "global", enabled: true },
                  { name: "production-management", description: "Production & content studio", scope: "global", enabled: true },
                  { name: "knowledge-management", description: "Knowledge base & wiki", scope: "global", enabled: true },
                  { name: "parent-portal", description: "Parent self-service portal", scope: "global", enabled: true },
                  { name: "student-portal", description: "Student self-service portal", scope: "global", enabled: true },
                  { name: "faculty-portal", description: "Faculty teaching portal", scope: "global", enabled: true },
                  { name: "employee-portal", description: "Employee self-service portal", scope: "global", enabled: true },
                  { name: "ai-scheduling", description: "AI-assisted scheduling", scope: "beta", enabled: false },
                  { name: "biometric-attendance", description: "Face/biometric attendance", scope: "beta", enabled: false },
                  { name: "whatsapp-campaigns", description: "WhatsApp marketing campaigns", scope: "beta", enabled: false },
                ].map((flag, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{flag.name}</p>
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                      <Badge variant="outline" className="text-xs mt-1">{flag.scope}</Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        flag.enabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }
                    >
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Audit Log</CardTitle>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" /> Export Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: "14:23:05", user: "admin@eeos.com", action: "User created: priya.p@example.com", severity: "info" },
                  { time: "14:15:22", user: "admin@eeos.com", action: "Fee structure updated for Branch-BLR", severity: "info" },
                  { time: "13:58:12", user: "system", action: "Daily backup completed — 156 MB", severity: "info" },
                  { time: "13:45:00", user: "ceo@eeos.com", action: "Refund approved — INV-2026-042", severity: "warning" },
                  { time: "12:30:18", user: "system", action: "WhatsApp service disconnected — retrying", severity: "error" },
                  { time: "11:15:44", user: "admin@eeos.com", action: "API key revoked: dev-key-003", severity: "warning" },
                  { time: "10:00:00", user: "system", action: "WhatsApp service reconnected", severity: "info" },
                ].map((entry, i) => (
                  <div key={i} className="flex items-start justify-between p-2.5 border-b last:border-0">
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className={
                          entry.severity === "error"
                            ? "bg-red-50 text-red-700 border-red-200 text-xs mt-0.5"
                            : entry.severity === "warning"
                            ? "bg-amber-50 text-amber-700 border-amber-200 text-xs mt-0.5"
                            : "bg-blue-50 text-blue-700 border-blue-200 text-xs mt-0.5"
                        }
                      >
                        {entry.severity}
                      </Badge>
                      <div>
                        <p className="text-sm">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{entry.user}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
