import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, ShieldCheck, ShieldOff, Users, Key, FolderTree, UserCog,
  UserCheck, Flag, Monitor, Menu as MenuIcon, Earth, Plus, Search, Check, X,
  Loader2, Sliders, Settings2, ChevronRight, Lock, Unlock,
  Eye, EyeOff, ChevronDown, LayoutDashboard, Building2,
  Database, Workflow, ListChecks, LineChart, GraduationCap,
  UserPlus, BookOpen, PiggyBank, UsersRound, Megaphone,
  MessageSquare, BarChart3, Crown, DollarSign, FileText,
  Activity, AlertTriangle, GitBranch, Globe, Layers,
  ChevronLeft, RefreshCw, UserX, UserMinus, Terminal, AlertCircle,
  HelpCircle, ToggleLeft, Copy, Download, Upload, Award,
  Target, Siren, ShieldAlert, ContactRound, FileCheck,
  ShoppingCart, Gauge,
} from "lucide-react";

// ─── Helper Icons ──────────────────────────────────────────────

function ShoppingCartIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
}
function CalendarIconSvg(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MonitorIconSvg(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}

// ─── Icon Map for Dynamic Menu Builder ─────────────────────────

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Database, Shield, Workflow, ListChecks,
  Calendar: CalendarIconSvg, Users, LineChart, GraduationCap, UserPlus,
  BookOpen, PiggyBank, UsersRound, Megaphone, MessageSquare, BarChart3,
  Crown, DollarSign, FileText, Activity, Settings, ShoppingCart: ShoppingCartIcon,
  ContactRound, FileCheck, Monitor: MonitorIconSvg, ShieldCheck, ShieldAlert,
  Users, Target, Siren, Gauge, Globe, Key, UserCog, Flag, ChevronRight,
  ToggleLeft, Eye, EyeOff, Copy, Sliders,
};

// ─── Constants ─────────────────────────────────────────────────

const ALL_MODULES = [
  "CRM", "Students", "Faculty", "Finance", "HR", "Academic",
  "Exams", "Admissions", "Marketing", "Support", "Procurement",
  "Inventory", "LMS", "Scheduling", "Analytics", "Reports",
  "Documents", "Settings", "Dashboard", "Communications", "Workflow",
];

const ALL_ACTIONS = [
  "create", "read", "update", "delete", "approve", "reject",
  "export", "print", "share", "assign", "transfer", "merge",
  "restore", "archive", "import", "sync", "duplicate",
  "lock", "unlock", "viewAnalytics", "viewReports",
  "viewDocuments", "manage",
];

const SCOPE_OPTIONS = [
  { value: "platform", label: "Platform" },
  { value: "company", label: "Company" },
  { value: "branch", label: "Branch" },
  { value: "department", label: "Department" },
  { value: "team", label: "Team" },
  { value: "user", label: "User" },
  { value: "vertical", label: "Vertical" },
  { value: "batch", label: "Batch" },
];

const SUBSCRIPTION_PLANS = [
  { name: "Starter", code: "STARTER", price: 0, users: 25, branches: 1, modules: 8, popular: false, features: ["Core CRM", "Student Management", "Basic Reports"] },
  { name: "Professional", code: "PRO", price: 299, users: 100, branches: 5, modules: 14, popular: true, features: ["All Starter Features", "Finance Suite", "HR Module", "Marketing", "Advanced Reports"] },
  { name: "Enterprise", code: "ENTERPRISE", price: 999, users: 500, branches: 50, modules: 20, popular: false, features: ["All Pro Features", "Unlimited Branches", "Custom Modules", "API Access", "Dedicated Support"] },
];

// ─── TREE NODE COMPONENT ──────────────────────────────────────

function TreeNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  const typeColors: Record<string, string> = {
    company: "text-blue-500", branch: "text-violet-500", department: "text-indigo-500",
    team: "text-emerald-500", vertical: "text-purple-500", program: "text-amber-500",
    batch: "text-rose-500",
  };
  const typeIcons: Record<string, any> = {
    company: Building2, branch: GitBranch, department: Layers,
    team: Users, vertical: GraduationCap, program: BookOpen, batch: CalendarIconSvg,
  };
  const Icon = typeIcons[node.type] || FolderTree;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-sm hover:bg-accent/30 transition-colors text-left ${depth > 0 ? "ml-3" : ""}`}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : <div className="w-3 shrink-0" />}
        <Icon className={`h-3.5 w-3.5 ${typeColors[node.type] || "text-muted-foreground"} shrink-0`} />
        <span className="truncate flex-1">{node.name}</span>
        {node.code && <span className="text-[8px] text-muted-foreground/40 uppercase">{node.code}</span>}
        {hasChildren && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-normal">{node.children.length}</Badge>}
      </button>
      {expanded && hasChildren && (
        <div className="border-l border-border/20 ml-2">
          {node.children.map((child: any, i: number) => (
            <TreeNode key={child.id || i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LOADING & EMPTY STATES ───────────────────────────────────

function Loading() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm font-medium text-muted-foreground/60">{title}</p>
      <p className="text-xs text-muted-foreground/40 mt-1">{description}</p>
    </div>
  );
}

// ─── ORGANIZATION TREE ────────────────────────────────────────

function OrgTreeView({ data }: { data: any[] | undefined }) {
  if (!data) return <Loading />;
  if (data.length === 0) return <EmptyState icon={Building2} title="No Organization Data" description="Create companies and branches in Organization Studio" />;

  return (
    <Card className="rounded-sm border-border/50 shadow-none">
      <CardContent className="p-2">
        {data.map((company, i) => (
          <TreeNode key={company.id || i} node={company} />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── ACADEMIC TREE ────────────────────────────────────────────

function AcademicTreeView({ data }: { data: any[] | undefined }) {
  if (!data) return <Loading />;
  if (data.length === 0) return <EmptyState icon={GraduationCap} title="No Academic Data" description="Create academic verticals and programs in Academic Studio" />;

  return (
    <Card className="rounded-sm border-border/50 shadow-none">
      <CardContent className="p-2">
        {data.map((vertical, i) => (
          <TreeNode key={vertical.id || i} node={vertical} />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── DYNAMIC PERMISSION MATRIX ────────────────────────────────

function PermissionMatrix() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedScope, setSelectedScope] = useState("company");
  const roles = useQuery(api.engines.accessControlEngine.listRoles, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select value={selectedRole || ""} onValueChange={setSelectedRole}>
          <SelectTrigger className="h-8 text-xs rounded-sm w-[200px]">
            <SelectValue placeholder="Select a role..." />
          </SelectTrigger>
          <SelectContent>
            {(roles || []).map((r: any) => (
              <SelectItem key={r._id} value={r._id} className="text-xs">{r.name} ({r.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedScope} onValueChange={setSelectedScope}>
          <SelectTrigger className="h-8 text-xs rounded-sm w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
          {ALL_MODULES.length} modules × {ALL_ACTIONS.length} actions
        </Badge>
      </div>

      <ScrollArea className="h-[500px] border border-border/30 rounded-sm">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="sticky top-0 z-10 grid grid-cols-[120px_repeat(23,minmax(60px,1fr))] bg-accent/50 border-b border-border/30">
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase">Module</div>
            {ALL_ACTIONS.map((action) => (
              <div key={action} className="px-1 py-1.5 text-[9px] font-medium text-muted-foreground uppercase text-center border-l border-border/20">
                {action.replace(/([A-Z])/g, " $1").trim()}
              </div>
            ))}
          </div>
          {/* Data Rows */}
          {ALL_MODULES.map((module, i) => (
            <div
              key={module}
              className={`grid grid-cols-[120px_repeat(23,minmax(60px,1fr))] items-center ${
                i % 2 === 0 ? "bg-background" : "bg-accent/10"
              } hover:bg-accent/20 transition-colors border-b border-border/10`}
            >
              <div className="px-2 py-1 text-[10px] font-medium truncate">{module}</div>
              {ALL_ACTIONS.map((action) => {
                const isGranted = ["create", "read", "update", "approve"].includes(action);
                return (
                  <div key={action} className="px-1 py-1 flex items-center justify-center border-l border-border/10">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-muted-foreground/30 accent-primary"
                      defaultChecked={isGranted}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── EFFECTIVE PERMISSION VIEWER ──────────────────────────────

function EffectivePermissionViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const users = useQuery(api.users.listUsers, {});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const effectivePerms = useQuery(
    selectedUser ? api.accessEngine.getEffectivePermissions : "skip",
    selectedUser ? { userId: selectedUser as any } : "skip",
  );

  const filtered = (users || []).filter((u: any) =>
    !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* User List */}
      <Card className="rounded-sm border-border/50 shadow-none lg:col-span-1">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">Select User</CardTitle>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-6 h-7 text-[10px] rounded-sm" />
          </div>
        </CardHeader>
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border/20">
            {filtered.map((u: any) => (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u._id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  selectedUser === u._id ? "bg-primary/5 text-primary" : "hover:bg-accent/20"
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/50 text-[9px] font-medium shrink-0">
                  {u.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="text-[9px] text-muted-foreground/60 truncate">{u.email}</p>
                </div>
                <Badge variant="outline" className="text-[7px] px-1 py-0 h-3">{u.role || "staff"}</Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Permission Details */}
      <Card className="rounded-sm border-border/50 shadow-none lg:col-span-2">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">
            {effectivePerms ? `Effective Permissions — ${effectivePerms.user?.name || selectedUser}` : "Effective Permissions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <EmptyState icon={Shield} title="No User Selected" description="Select a user to view their effective permissions" />
          ) : !effectivePerms ? (
            <Loading />
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-sm bg-accent/20 text-center">
                  <p className="text-lg font-bold">{effectivePerms.summary.totalGranted}</p>
                  <p className="text-[9px] text-muted-foreground">Granted</p>
                </div>
                <div className="p-2 rounded-sm bg-accent/20 text-center">
                  <p className="text-lg font-bold">{effectivePerms.summary.totalDenied}</p>
                  <p className="text-[9px] text-muted-foreground">Denied</p>
                </div>
                <div className="p-2 rounded-sm bg-accent/20 text-center">
                  <p className="text-lg font-bold">{effectivePerms.summary.modulesWithAccess}</p>
                  <p className="text-[9px] text-muted-foreground">Modules</p>
                </div>
                <div className="p-2 rounded-sm bg-accent/20 text-center">
                  <p className="text-lg font-bold capitalize">{effectivePerms.scopeLevel}</p>
                  <p className="text-[9px] text-muted-foreground">Scope</p>
                </div>
              </div>

              {/* Permission breakdown */}
              <ScrollArea className="h-[320px]">
                <div className="space-y-1">
                  {effectivePerms.permissions.map((perm: any, i: number) => {
                    const grantedCount = Object.values(perm.actions).filter(Boolean).length;
                    if (grantedCount === 0) return null;
                    return (
                      <div key={i} className="p-2 rounded-sm border border-border/30 hover:bg-accent/10 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{perm.module}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{grantedCount}/{ALL_ACTIONS.length}</Badge>
                            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-50 text-emerald-600 border-0">{perm.source}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-0.5">
                          {Object.entries(perm.actions).map(([action, granted]: [string, any]) => (
                            <span
                              key={action}
                              className={`inline-flex items-center gap-0.5 px-1 py-0.5 text-[8px] rounded-sm ${
                                granted ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-400"
                              }`}
                            >
                              {granted ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                              {action.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── LOGIN AS SIMULATOR ───────────────────────────────────────

function LoginAsSimulator() {
  const [searchQuery, setSearchQuery] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [simulating, setSimulating] = useState(false);
  const users = useQuery(api.users.listUsers, {});
  const simulateLogin = useMutation(api.accessEngine.simulateLogin);

  const filtered = (users || []).filter((u: any) =>
    !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSimulate = async () => {
    if (!targetUser) return;
    setSimulating(true);
    try {
      const result = await simulateLogin({
        adminUserId: users?.[0]?._id || "",
        targetUserId: targetUser._id,
        reason,
      });
      alert(`✅ ${result.message}`);
    } catch (e: any) {
      alert(`❌ ${e.message}`);
    }
    setSimulating(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* User Selector */}
      <Card className="rounded-sm border-border/50 shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">Impersonate User</CardTitle>
          <p className="text-[9px] text-muted-foreground/60">Simulate login without password. All actions are read-only and audited.</p>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
            <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-6 h-7 text-[10px] rounded-sm" />
          </div>
        </CardHeader>
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-border/20">
            {filtered.map((u: any) => (
              <button
                key={u._id}
                onClick={() => setTargetUser(u)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  targetUser?._id === u._id ? "bg-primary/5 text-primary" : "hover:bg-accent/20"
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/50 text-[9px] font-medium shrink-0">
                  {u.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="text-[9px] text-muted-foreground/60 truncate">{u.email}</p>
                </div>
                <Badge variant="outline" className="text-[7px] px-1 py-0 h-3">{u.role || "staff"}</Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Simulation Panel */}
      <Card className="rounded-sm border-border/50 shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">Simulation Session</CardTitle>
        </CardHeader>
        <CardContent>
          {!targetUser ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Terminal className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground/60">Select a user to simulate</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-sm border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700">Simulation Mode</span>
                </div>
                <p className="text-[10px] text-amber-600/80">All actions will be logged. No permanent changes will be made.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/50 text-xs font-medium shrink-0">
                  {targetUser.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{targetUser.name}</p>
                  <p className="text-[10px] text-muted-foreground">{targetUser.email} · {targetUser.role || "staff"}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Reason for simulation (optional)</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Troubleshooting permission issue" className="h-7 text-[10px] rounded-sm" />
              </div>

              <Button
                onClick={handleSimulate}
                disabled={simulating}
                className="w-full h-8 text-xs rounded-sm bg-amber-500 hover:bg-amber-600"
              >
                {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Terminal className="h-3.5 w-3.5 mr-1" />}
                Start Simulation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── CONFLICT RESOLVER ─────────────────────────────────────────

function ConflictResolver() {
  const conflicts = useQuery(api.accessEngine.detectConflicts, { userId: "" as any });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Permission Conflict Resolver</h3>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
          {conflicts ? `${conflicts.duplicates + conflicts.circularPermissions + conflicts.invalidScopes + conflicts.missingDependencies} issues` : "Analyzing..."}
        </Badge>
      </div>

      {!conflicts ? <Loading /> : (
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3 text-center">
              <AlertCircle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{conflicts.duplicates}</p>
              <p className="text-[9px] text-muted-foreground">Duplicate Permissions</p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3 text-center">
              <GitBranch className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{conflicts.circularPermissions}</p>
              <p className="text-[9px] text-muted-foreground">Circular Permissions</p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3 text-center">
              <X className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{conflicts.invalidScopes}</p>
              <p className="text-[9px] text-muted-foreground">Invalid Scopes</p>
            </CardContent>
          </Card>
          <Card className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3 text-center">
              <HelpCircle className="h-4 w-4 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{conflicts.missingDependencies}</p>
              <p className="text-[9px] text-muted-foreground">Missing Dependencies</p>
            </CardContent>
          </Card>
        </div>
      )}

      {conflicts && conflicts.details.length > 0 && (
        <Card className="rounded-sm border-border/50 shadow-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-semibold">Conflict Details</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1 px-4 pb-3">
              {conflicts.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground py-0.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {(!conflicts || conflicts.details.length === 0) && (
        <Card className="rounded-sm border-emerald-200 bg-emerald-50/30 shadow-none">
          <CardContent className="p-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-emerald-700">No permission conflicts detected. All scopes are valid.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── ACCESS ANALYTICS ─────────────────────────────────────────

function AccessAnalytics() {
  const analytics = useQuery(api.accessEngine.getAccessAnalytics, {});

  if (!analytics) return <Loading />;

  const statCards = [
    { label: "Total Roles", value: analytics.totalRoles, icon: Key, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Permissions", value: analytics.totalPermissions, icon: Shield, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Active Users", value: analytics.activeUsers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Inactive Users", value: analytics.inactiveUsers, icon: UserMinus, color: "text-red-500", bg: "bg-red-50" },
    { label: "User-Role Assignments", value: analytics.totalUserRoles, icon: UserCheck, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Feature Flags", value: analytics.totalFeatureFlags, icon: Flag, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Role-Permission Links", value: analytics.totalRolePerms, icon: GitBranch, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Total Users", value: analytics.totalUsers, icon: UsersRound, color: "text-sky-500", bg: "bg-sky-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3">
              <div className={`p-1.5 rounded-sm w-fit ${s.bg} mb-1`}>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Most Privileged Roles */}
      <Card className="rounded-sm border-border/50 shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">Most Privileged Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            <div className="grid grid-cols-3 gap-2 px-4 py-1.5 text-[9px] uppercase text-muted-foreground/40 font-medium">
              <span>Role</span>
              <span>Permissions</span>
              <span>Risk Level</span>
            </div>
            {analytics.mostPrivileged.map((role: any, i: number) => (
              <div key={i} className="grid grid-cols-3 gap-2 px-4 py-1.5 text-xs items-center hover:bg-accent/10 transition-colors">
                <span className="font-medium">{role.roleName}</span>
                <span>{role.permissionCount}</span>
                <Badge className={`w-fit text-[8px] px-1 py-0 h-3.5 ${
                  role.permissionCount > 50 ? "bg-red-50 text-red-600" : role.permissionCount > 20 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {role.permissionCount > 50 ? "High" : role.permissionCount > 20 ? "Medium" : "Low"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SUBSCRIPTION PLANS ────────────────────────────────────────

function SubscriptionPlans() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Subscription Plans</h3>
        <Button size="sm" className="h-7 text-[10px] rounded-sm"><Plus className="h-3 w-3 mr-1" /> Add Plan</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card key={plan.code} className={`rounded-sm border ${plan.popular ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border/50'} shadow-none`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold">{plan.name}</h4>
                {plan.popular && <Badge className="text-[8px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">Popular</Badge>}
              </div>
              <div className="text-2xl font-bold mb-2">${plan.price}<span className="text-xs font-normal text-muted-foreground">/{plan.price === 0 ? 'free' : 'mo'}</span></div>
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Users</span><span className="font-medium">{plan.users}</span></div>
                <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Branches</span><span className="font-medium">{plan.branches}</span></div>
                <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Modules</span><span className="font-medium">{plan.modules}</span></div>
              </div>
              <Separator className="my-1.5" />
              <div className="space-y-0.5 mb-2">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Button size="sm" variant={plan.popular ? "default" : "outline"} className="w-full h-7 text-[10px] rounded-sm">
                {plan.price === 0 ? "Current Plan" : "Select Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURE FLAGS ─────────────────────────────────────────────

function FeatureFlagsTab() {
  const flags: { key: string; name: string; status: string; description: string }[] = [
    { key: "AI_ASSISTANT", name: "AI Assistant", status: "enabled", description: "Enable AI-powered scheduling assistant" },
    { key: "BULK_EMAIL", name: "Bulk Email", status: "enabled", description: "Enable bulk email campaigns" },
    { key: "WHATSAPP", name: "WhatsApp Integration", status: "beta", description: "WhatsApp messaging integration" },
    { key: "FACE_RECOGNITION", name: "Face Recognition", status: "coming_soon", description: "Biometric face attendance" },
    { key: "PAYMENT_GATEWAY", name: "Payment Gateway", status: "enabled", description: "Online payment processing" },
    { key: "SMS", name: "SMS Notifications", status: "disabled", description: "SMS notification delivery" },
    { key: "GST", name: "GST Compliance", status: "enabled", description: "GST invoice generation" },
    { key: "BULK_SMS", name: "Bulk SMS", status: "beta", description: "Bulk SMS campaigns" },
  ];

  const statusColors: Record<string, string> = {
    enabled: "bg-emerald-50 text-emerald-600 border-emerald-200",
    disabled: "bg-slate-50 text-slate-400 border-slate-200",
    beta: "bg-amber-50 text-amber-600 border-amber-200",
    coming_soon: "bg-blue-50 text-blue-600 border-blue-200",
    deprecated: "bg-red-50 text-red-400 border-red-200",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Feature Flags</h3>
        <Button size="sm" className="h-7 text-[10px] rounded-sm"><Plus className="h-3 w-3 mr-1" /> Add Flag</Button>
      </div>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/20">
          {flags.map((flag) => (
            <div key={flag.key} className="flex items-center gap-3 px-4 py-2">
              <ToggleLeft className="h-4 w-4 text-muted-foreground/40" />
              <div className="flex-1">
                <p className="text-xs font-medium">{flag.name}</p>
                <p className="text-[9px] text-muted-foreground/60">{flag.key} — {flag.description}</p>
              </div>
              <Badge className={`text-[8px] px-1.5 py-0 h-4 border ${statusColors[flag.status] || "bg-slate-50 text-slate-500"}`}>
                {flag.status.replace("_", " ")}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Settings2 className="h-3 w-3 text-muted-foreground/60" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── DYNAMIC MENU BUILDER ──────────────────────────────────────

function DynamicMenuBuilder() {
  const allMenus = useQuery(api.menuEngine.getAllMenus, {});
  const seedDefault = useMutation(api.menuEngine.seedDefaultMenus);
  const createMenu = useMutation(api.menuEngine.createMenu);
  const updateMenu = useMutation(api.menuEngine.updateMenu);
  const deleteMenu = useMutation(api.menuEngine.deleteMenu);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => setExpandedGroups(p => ({ ...p, [group]: !p[group] }));

  const handleCreate = async () => {
    const name = prompt("Menu label:");
    if (!name) return;
    const href = prompt("Route href:", "/" + name.toLowerCase().replace(/\s+/g, "-"));
    if (!href) return;
    const group = prompt("Group (e.g., Overview, Studios, Business Modules):", "Business Modules");
    if (!group) return;
    await createMenu({
      label: name, href, icon: "LayoutDashboard", group,
      order: 99, visibility: "visible", isPlaceholder: false,
    });
  };

  const handleToggleVisibility = async (menu: any) => {
    await updateMenu({
      menuId: menu._id,
      visibility: menu.visibility === "visible" ? "hidden" : "visible",
    });
  };

  const handleDelete = async (menuId: any) => {
    if (confirm("Delete this menu? This will also delete any child menus.")) {
      await deleteMenu({ menuId });
    }
  };

  // Group menus
  const grouped = (allMenus || []).reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Dynamic Menu Builder</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-[10px] rounded-sm" onClick={() => seedDefault({})}>
            <RefreshCw className="h-3 w-3 mr-1" /> Seed Defaults
          </Button>
          <Button size="sm" className="h-7 text-[10px] rounded-sm" onClick={handleCreate}>
            <Plus className="h-3 w-3 mr-1" /> Add Menu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="rounded-sm border-border/50 shadow-none lg:col-span-1">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-semibold">Menu Groups</CardTitle></CardHeader>
          <ScrollArea className="h-[450px]">
            <div className="divide-y divide-border/20">
              {Object.entries(grouped).map(([group, items]: [string, any]) => (
                <div key={group}>
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups[group] ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-xs font-medium">{group}</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{items.length}</Badge>
                  </button>
                  {expandedGroups[group] && items.map((menu: any) => {
                    const MenuIconComp = iconMap[menu.icon] || Shield;
                    const isHidden = menu.visibility === "hidden";
                    return (
                      <div
                        key={menu._id}
                        className={`flex items-center gap-2 px-6 py-1.5 text-[10px] ${
                          isHidden ? "opacity-40" : ""
                        } hover:bg-accent/10 transition-colors`}
                      >
                        <MenuIconComp className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{menu.label}</span>
                        <span className="text-[7px] text-muted-foreground/50 truncate max-w-[80px]">{menu.href}</span>
                        {menu.isPlaceholder && <Badge className="text-[7px] px-1 py-0 h-3 bg-amber-50 text-amber-600">Soon</Badge>}
                        <button onClick={() => handleToggleVisibility(menu)} className="p-0.5 hover:text-primary">
                          {isHidden ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                        </button>
                        <button onClick={() => handleDelete(menu._id)} className="p-0.5 hover:text-red-500">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="rounded-sm border-border/50 shadow-none lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-semibold">Menu Editor</CardTitle>
            <p className="text-[9px] text-muted-foreground/60">Manage sidebar navigation entirely from the database. No hardcoded menus.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16">
              <MenuIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
              <p className="text-sm font-medium text-muted-foreground/40">Menus are fully dynamic — controlled from this panel</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1">Click any menu to edit visibility, roles, and ordering</p>
              <div className="mt-4 p-3 rounded-sm border border-border/20 bg-accent/5 max-w-sm">
                <p className="text-[10px] text-muted-foreground/60">
                  <strong className="font-medium">Inheritance:</strong> Platform → Company → Branch.
                  Menus respect feature flags, subscription plans, roles, and permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── MODULE ACTIVATION ────────────────────────────────────────

function ModuleActivationTab() {
  const companies = useQuery(api.organizationBranches.listCompanies, {} as any);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const activations = useQuery(
    selectedCompany ? api.moduleActivationEngine.getCompanyModuleActivations : "skip",
    selectedCompany ? { companyId: selectedCompany as any } : "skip",
  );
  const setActivation = useMutation(api.moduleActivationEngine.setModuleActivation);

  const modules: { name: string; icon: any; description: string }[] = [
    { name: "dashboard", icon: LayoutDashboard, description: "Main dashboard and analytics" },
    { name: "crm", icon: Users, description: "Lead and customer management" },
    { name: "students", icon: GraduationCap, description: "Student lifecycle management" },
    { name: "academic", icon: BookOpen, description: "Academic management" },
    { name: "finance", icon: PiggyBank, description: "Finance and accounting" },
    { name: "hr", icon: UsersRound, description: "HR and employee management" },
    { name: "marketing", icon: Megaphone, description: "Marketing campaigns" },
    { name: "support", icon: MessageSquare, description: "Support tickets" },
    { name: "procurement", icon: ShoppingCartIcon, description: "Procurement and purchasing" },
    { name: "inventory", icon: Database, description: "Inventory management" },
    { name: "lms", icon: BookOpen, description: "Learning management" },
    { name: "scheduling", icon: CalendarIconSvg, description: "Enterprise scheduling" },
    { name: "analytics", icon: BarChart3, description: "Analytics and reports" },
    { name: "examinations", icon: FileCheck, description: "Exam management" },
    { name: "payroll", icon: DollarSign, description: "Payroll processing" },
    { name: "attendance", icon: Activity, description: "Attendance tracking" },
  ];

  const toggleModule = async (module: string, currentEnabled: boolean) => {
    if (!selectedCompany) return;
    await setActivation({
      module,
      companyId: selectedCompany as any,
      enabled: !currentEnabled,
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold">Dynamic Module Activation</h3>
      <p className="text-[9px] text-muted-foreground/60">Enable or disable entire modules per company. No code deployment needed.</p>

      <Select value={selectedCompany || ""} onValueChange={setSelectedCompany}>
        <SelectTrigger className="h-8 text-xs rounded-sm w-[300px]">
          <SelectValue placeholder="Select a company..." />
        </SelectTrigger>
        <SelectContent>
          {(companies || []).map((c: any) => (
            <SelectItem key={c._id} value={c._id} className="text-xs">{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedCompany ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-10 w-10 text-muted-foreground/20 mb-2" />
          <p className="text-sm font-medium text-muted-foreground/40">Select a company to manage its module activation</p>
        </div>
      ) : !activations ? <Loading /> : (
        <div className="grid gap-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod) => {
            const activation = activations.find((a: any) => a.module === mod.name);
            const enabled = activation?.enabled ?? true;
            const ModIcon = mod.icon;

            return (
              <Card
                key={mod.name}
                className={`rounded-sm border shadow-none transition-all cursor-pointer ${
                  enabled ? "border-emerald-200 bg-emerald-50/20" : "border-border/30 opacity-60"
                } hover:shadow-sm`}
                onClick={() => toggleModule(mod.name, enabled)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <div className={`p-1.5 rounded-sm ${enabled ? "bg-emerald-100" : "bg-accent/30"}`}>
                    <ModIcon className={`h-3.5 w-3.5 ${enabled ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium capitalize">{mod.name}</p>
                    <p className="text-[9px] text-muted-foreground/60">{mod.description}</p>
                  </div>
                  <Badge className={`text-[8px] px-1.5 py-0 h-4 ${
                    enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                  }`}>
                    {enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CONFIGURATION MANAGER ─────────────────────────────────────

function ConfigurationTab() {
  const CONFIG_DOMAINS = [
    { id: "general", label: "General", icon: Settings, desc: "System-wide settings and defaults" },
    { id: "finance", label: "Finance", icon: PiggyBank, desc: "Currency, GST, receipt numbering" },
    { id: "academic", label: "Academic", icon: BookOpen, desc: "Attendance, classes, scheduling" },
    { id: "hr", label: "HR", icon: UsersRound, desc: "Probation, leave, notice period" },
    { id: "attendance", label: "Attendance", icon: Activity, desc: "Auto-mark, biometric, overrides" },
    { id: "pdc", label: "PDC", icon: DollarSign, desc: "Bounce count, penalties, restrictions" },
    { id: "scheduling", label: "Scheduling", icon: CalendarIconSvg, desc: "Slot duration, buffers, hours" },
    { id: "support", label: "Support", icon: MessageSquare, desc: "Response SLA, resolution SLA" },
    { id: "marketing", label: "Marketing", icon: Megaphone, desc: "WhatsApp, email, SMS settings" },
    { id: "inventory", label: "Inventory", icon: Database, desc: "Stock, warehouse, transfers" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="rounded-sm border-border/50 shadow-none">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">Configuration Domains</CardTitle>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">Enterprise configuration inheritance chain</p>
        </CardHeader>
        <ScrollArea className="h-[420px]">
          <div className="space-y-0.5 px-2 pb-3">
            {CONFIG_DOMAINS.map((domain) => {
              const DomIcon = domain.icon;
              return (
                <button
                  key={domain.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm hover:bg-accent/20 transition-colors text-left"
                >
                  <div className="p-1 rounded-sm bg-accent/30">
                    <DomIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{domain.label}</p>
                    <p className="text-[9px] text-muted-foreground/60 truncate">{domain.desc}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      <Card className="rounded-sm border-border/50 shadow-none lg:col-span-2">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-semibold">Configuration Editor</CardTitle>
          <p className="text-[9px] text-muted-foreground/60">Select a configuration domain to view and manage settings</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16">
            <Settings2 className="h-10 w-10 text-muted-foreground/20 mb-2" />
            <p className="text-sm font-medium text-muted-foreground/40">Select a domain from the left panel</p>
            <div className="mt-4 p-3 rounded-sm border border-border/20 bg-accent/5 max-w-md">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                <strong className="font-medium">Inheritance Chain:</strong><br />
                Platform defaults → Company overrides → Branch overrides → Dept overrides → User overrides.
                Each level only overrides specific keys defined at that scope.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────

export default function AccessControlList() {
  const [selectedNav, setSelectedNav] = useState("org-tree");
  const [showEditor, setShowEditor] = useState(true);

  const orgTree = useQuery(api.accessEngine.getOrganizationTree, {});
  const academicTree = useQuery(api.accessEngine.getAcademicTree, {});
  const stats = useQuery(api.engines.accessControlEngine.getStats, {});

  const NAV_ITEMS = [
    { id: "org-tree", label: "Organization Tree", icon: GitBranch },
    { id: "academic-tree", label: "Academic Tree", icon: GraduationCap },
    { id: "roles", label: "Roles", icon: Key },
    { id: "permissions", label: "Permission Matrix", icon: Shield },
    { id: "menus", label: "Menu Builder", icon: MenuIcon },
    { id: "modules", label: "Module Activation", icon: ToggleLeft },
    { id: "configuration", label: "Configuration", icon: Settings2 },
    { id: "effective", label: "Effective Permissions", icon: Eye },
    { id: "simulator", label: "Login As", icon: Terminal },
    { id: "conflicts", label: "Conflict Resolver", icon: AlertTriangle },
    { id: "analytics", label: "Access Analytics", icon: Activity },
    { id: "subscriptions", label: "Subscription Plans", icon: DollarSign },
    { id: "flags", label: "Feature Flags", icon: Flag },
    { id: "templates", label: "Permission Templates", icon: Copy },
    { id: "audit", label: "Audit Logs", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">
      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div className="w-56 border-r border-border/40 bg-accent/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-border/30">
          <h2 className="text-xs font-semibold flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Access Control
          </h2>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">Enterprise Governance Platform</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedNav(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm transition-all text-left ${
                  selectedNav === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{item.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── CENTER PANEL ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border/30 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold capitalize">
                {NAV_ITEMS.find(n => n.id === selectedNav)?.label || selectedNav}
              </h3>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                {selectedNav === "roles" ? `${stats?.totalRoles || 0} entries` : ""}
              </Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {selectedNav === "org-tree" && <OrgTreeView data={orgTree} />}
            {selectedNav === "academic-tree" && <AcademicTreeView data={academicTree} />}
            {selectedNav === "permissions" && <PermissionMatrix />}
            {selectedNav === "menus" && <DynamicMenuBuilder />}
            {selectedNav === "modules" && <ModuleActivationTab />}
            {selectedNav === "configuration" && <ConfigurationTab />}
            {selectedNav === "effective" && <EffectivePermissionViewer />}
            {selectedNav === "simulator" && <LoginAsSimulator />}
            {selectedNav === "conflicts" && <ConflictResolver />}
            {selectedNav === "analytics" && <AccessAnalytics />}
            {selectedNav === "subscriptions" && <SubscriptionPlans />}
            {selectedNav === "flags" && <FeatureFlagsTab />}

            {selectedNav === "roles" && (
              <div className="text-center py-12 text-muted-foreground/60">
                <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs">Role management is available in the Organization Studio</p>
              </div>
            )}

            {selectedNav === "templates" && (
              <div className="text-center py-12 text-muted-foreground/60">
                <Copy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs">Permission templates allow bulk cloning of role permissions</p>
              </div>
            )}

            {selectedNav === "audit" && (
              <div className="text-center py-12 text-muted-foreground/60">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs">Permission audit logs track every change made to the access system</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
