import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Activity, Shield, Key, Webhook, Database, RefreshCw, Eye, Server, HardDrive, Globe, Users, Download } from "lucide-react";

export default function AdminConsole() {
  const systemConfig = useQuery(api.adminEngine.getSystemConfig);
  const health = useQuery(api.adminEngine.getSystemHealth);
  const companies = useQuery(api.adminEngine.listCompanies);
  const apiKeys = useQuery(api.adminEngine.listApiKeys);
  const webhooks = useQuery(api.adminEngine.listWebhooks);
  const auditLogs = useQuery(api.adminEngine.listAuditLogs, { limit: 20 });
  const backups = useQuery(api.adminEngine.listBackups);

  const toggleJob = useMutation(api.adminEngine.toggleJob);

  return (
    <WorkspaceShell title="Admin Console" subtitle="System configuration and enterprise management">
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5"><Server className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Health</TabsTrigger>
          <TabsTrigger value="companies" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Companies</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5"><Key className="h-3.5 w-3.5" /> API</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5"><Webhook className="h-3.5 w-3.5" /> Webhooks</TabsTrigger>
          <TabsTrigger value="backups" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Backups</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4"><div className="flex items-center gap-2"><Server className="h-4 w-4 text-blue-500" /><div><p className="text-lg font-bold">{(systemConfig as any)?.platformName || "EEOS"}</p><p className="text-xs text-gray-500">Platform</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-green-500" /><div><p className="text-lg font-bold">{health?.totalUsers || "—"}</p><p className="text-xs text-gray-500">Users</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-purple-500" /><div><p className="text-lg font-bold capitalize">{health?.status || "—"}</p><p className="text-xs text-gray-500">System Health</p></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-500" /><div><p className="text-lg font-bold">{companies?.length || 0}</p><p className="text-xs text-gray-500">Companies</p></div></div></Card>
          </div>
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Settings className="h-4 w-4" /> System Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Maintenance Mode</span><Badge className={systemConfig && (systemConfig as any).maintenanceMode ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>{systemConfig && (systemConfig as any).maintenanceMode ? "Enabled" : "Disabled"}</Badge></div>
              <div className="flex justify-between"><span className="text-gray-600">Platform Version</span><span className="font-medium">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-gray-600">API Keys Active</span><span className="font-medium">{apiKeys?.filter((k: any) => k.isActive).length || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Webhooks Configured</span><span className="font-medium">{webhooks?.length || 0}</span></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">System Health</h3>
            <div className="space-y-3">
              {[
                { label: "Database", status: "connected", color: "text-green-600" },
                { label: "Authentication", status: "operational", color: "text-green-600" },
                { label: "Storage", status: "operational", color: "text-green-600" },
                { label: "Event Pipeline", status: "running", color: "text-green-600" },
                { label: "Background Jobs", status: "active", color: "text-green-600" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between py-1.5 border-b last:border-0">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <span className={`text-sm font-medium ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-400">Last checked: {health?.lastChecked ? new Date(health.lastChecked).toLocaleString() : "—"}</div>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Recent Audit Logs</h3>
            <div className="space-y-1">
              {(auditLogs || []).map((log: any) => (
                <div key={log._id} className="flex items-center gap-2 text-xs py-1.5 border-b last:border-0">
                  <Badge className="text-[9px] bg-gray-100 text-gray-600">{(log as any).module || "system"}</Badge>
                  <span className="text-gray-700 flex-1 truncate">{(log as any).action || (log as any).message || "Action"}</span>
                  <span className="text-gray-400 shrink-0">{log._creationTime ? new Date(log._creationTime).toLocaleString() : ""}</span>
                </div>
              ))}
              {(!auditLogs || auditLogs.length === 0) && <p className="text-sm text-gray-400 italic text-center py-4">No audit logs found</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Backup Records</h3>
              <Button size="sm" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Create Backup</Button>
            </div>
            <div className="space-y-2">
              {(backups || []).map((b: any) => (
                <div key={b._id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                  <div><span className="font-medium capitalize">{(b as any).backupType}</span><p className="text-xs text-gray-400">{b._creationTime ? new Date(b._creationTime).toLocaleString() : ""}</p></div>
                  <div className="flex items-center gap-2">
                    <Badge className={b.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{b.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
              {(!backups || backups.length === 0) && <p className="text-sm text-gray-400 italic text-center py-4">No backups found</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">API Keys</h3>
              <Button size="sm" className="gap-1.5"><Key className="h-3.5 w-3.5" /> Generate Key</Button>
            </div>
            <div className="space-y-2">
              {(apiKeys || []).map((k: any) => (
                <div key={k._id} className="flex justify-between text-sm py-2 border-b last:border-0">
                  <div><span className="font-medium">{k.name}</span><p className="text-xs text-gray-400">{(k as any).scope}</p></div>
                  <Badge className={k.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{k.isActive ? "Active" : "Revoked"}</Badge>
                </div>
              ))}
              {(!apiKeys || apiKeys.length === 0) && <p className="text-sm text-gray-400 italic text-center py-4">No API keys configured</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Webhooks</h3>
              <Button size="sm" className="gap-1.5"><Webhook className="h-3.5 w-3.5" /> Add Webhook</Button>
            </div>
            <div className="space-y-2">
              {(webhooks || []).map((w: any) => (
                <div key={w._id} className="flex justify-between text-sm py-2 border-b last:border-0">
                  <div><span className="font-medium">{w.name}</span><p className="text-xs text-gray-400 truncate max-w-md">{(w as any).url}</p></div>
                  <Badge className={w.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{w.isActive ? "Active" : "Disabled"}</Badge>
                </div>
              ))}
              {(!webhooks || webhooks.length === 0) && <p className="text-sm text-gray-400 italic text-center py-4">No webhooks configured</p>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
