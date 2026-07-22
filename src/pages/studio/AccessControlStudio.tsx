import { useState } from "react";
import { StudioLayout } from "@/components/layout/StudioLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Shield, Users, Key, FolderTree, UserCog,
  Flag, Monitor, Menu, Earth, UserCheck,
  Plus, Search, Check, X, Loader2, ArrowUpDown,
  Settings2, Building2, Database, Workflow, ListChecks,
  LineChart, GraduationCap, UserPlus, BookOpen,
  PiggyBank, UsersRound, Megaphone, MessageSquare,
  BarChart3, LayoutDashboard,
} from "lucide-react";

// ─── Tab definitions ───────────────────────────────────────────

interface TabDef {
  id: string;
  label: string;
  icon: typeof Shield;
}

const TABS: TabDef[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: Key },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "groups", label: "Groups", icon: FolderTree },
  { id: "designations", label: "Designations", icon: UserCog },
  { id: "assignments", label: "Assignments", icon: UserCheck },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "studios", label: "Studio Access", icon: Monitor },
  { id: "menus", label: "Menu Access", icon: Menu },
  { id: "scopes", label: "Scope Rules", icon: Earth },
];

// ─── Helpers ───────────────────────────────────────────────────

const SCOPE_COLORS: Record<string, string> = {
  own: "bg-slate-500/10 text-slate-600",
  team: "bg-blue-500/10 text-blue-600",
  department: "bg-indigo-500/10 text-indigo-600",
  branch: "bg-violet-500/10 text-violet-600",
  company: "bg-purple-500/10 text-purple-600",
  organization: "bg-amber-500/10 text-amber-600",
  global: "bg-emerald-500/10 text-emerald-600",
};

const FLAG_COLORS: Record<string, string> = {
  enabled: "bg-emerald-500/10 text-emerald-600",
  disabled: "bg-red-500/10 text-red-600",
  beta: "bg-amber-500/10 text-amber-600",
  hidden: "bg-slate-500/10 text-slate-600",
  coming_soon: "bg-blue-500/10 text-blue-600",
};

const STUDIO_ICONS: Record<string, any> = {
  org: Building2, "master-data": Database, "access-control": Shield,
  workflow: Workflow, tasks: ListChecks, crm: Users,
  sales: LineChart, admissions: UserPlus, student: GraduationCap,
  academic: BookOpen, finance: PiggyBank, hr: UsersRound,
  marketing: Megaphone, communication: MessageSquare,
  analytics: BarChart3, settings: Settings2, administration: Building2,
  technology: Monitor, dashboard: LayoutDashboard,
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getName(n: any): string {
  return n?.name || n?.label || "—";
}

// ─── Tabs ──────────────────────────────────────────────────────

function UsersTab() {
  const { isDemoMode } = useAuth();
  const allUsers = useQuery(
    api.users.listAll,
    isDemoMode ? "skip" : {},
  ) || [];
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );
  const [search, setSearch] = useState("");

  if (!allUsers || !roles) return <Loading />;

  const filtered = allUsers.filter((u: any) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm rounded-sm" />
        </div>
        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">{filtered.length} users</Badge>
      </div>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Designation</div>
            <div className="col-span-2">Status</div>
          </div>
          {filtered.map((u: any) => (
            <div key={u._id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors items-center">
              <div className="col-span-3 font-medium truncate">{u.name || "—"}</div>
              <div className="col-span-3 text-muted-foreground truncate">{u.email || "—"}</div>
              <div className="col-span-2 text-muted-foreground truncate">{u.department || "—"}</div>
              <div className="col-span-2 text-muted-foreground truncate">{u.designation || "—"}</div>
              <div className="col-span-2">
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-emerald-300/50 text-emerald-500">
                  Active
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RolesTab() {
  const { isDemoMode } = useAuth();
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );
  const createRole = useMutation(api.engines.accessControlEngine.createRole);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName || !newCode) return;
    setCreating(true);
    try { await createRole({ name: newName, code: newCode }); setNewName(""); setNewCode(""); }
    catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  if (!roles) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Role name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-sm rounded-sm max-w-[200px]" />
        <Input placeholder="Code (e.g. CEO)" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="h-9 text-sm rounded-sm max-w-[120px]" />
        <Button size="sm" onClick={handleCreate} disabled={creating || !newName || !newCode} className="rounded-sm h-9">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add Role
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {roles.map((role: any) => (
          <Card key={role._id} className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent/50">
                    <Key className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{role.name}</p>
                    <p className="text-[10px] text-muted-foreground/60">{role.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {role.isSystem && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-blue-300/50 text-blue-500">System</Badge>}
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${role.isActive ? "border-emerald-300/50 text-emerald-500" : "border-red-300/50 text-red-500"}`}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {role.description && <p className="text-[10px] text-muted-foreground/60 mt-1.5 truncate">{role.description}</p>}
              <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground/40">
                <span>Priority: {role.priority}</span>
                {role.createdAt && <span>Created: {formatTime(role.createdAt)}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PermissionsTab() {
  const { isDemoMode } = useAuth();
  const perms = useQuery(
    api.engines.accessControlEngine.listPermissions,
    isDemoMode ? "skip" : {},
  );
  const groups = useQuery(
    api.engines.accessControlEngine.listPermissionGroups,
    isDemoMode ? "skip" : {},
  );
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  if (!perms || !groups) return <Loading />;

  const filtered = perms.filter((p: any) => {
    if (groupFilter && p.groupId !== groupFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.module.toLowerCase().includes(q) || p.entity.toLowerCase().includes(q) || p.action.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm rounded-sm" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setGroupFilter(null)} className={`px-2 py-1 text-[10px] rounded-sm transition-colors ${!groupFilter ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>All</button>
          {groups.map((g: any) => (
            <button key={g._id} onClick={() => setGroupFilter(g._id)} className={`px-2 py-1 text-[10px] rounded-sm transition-colors ${groupFilter === g._id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>{g.name}</button>
          ))}
        </div>
      </div>
      <div className="border border-border/50 rounded-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium bg-accent/20">
          <div className="col-span-4">Permission</div>
          <div className="col-span-2">Module</div>
          <div className="col-span-2">Entity</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-2">Group</div>
        </div>
        <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
          {filtered.map((p: any) => {
            const grp = groups.find((g: any) => g._id === p.groupId);
            return (
              <div key={p._id} className="grid grid-cols-12 gap-2 px-4 py-2 text-xs hover:bg-accent/20 transition-colors items-center">
                <div className="col-span-4 font-medium truncate">{p.name}</div>
                <div className="col-span-2 text-muted-foreground truncate">{p.module}</div>
                <div className="col-span-2 text-muted-foreground truncate">{p.entity}</div>
                <div className="col-span-2">
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-border/40 text-muted-foreground/50">{p.action}</Badge>
                </div>
                <div className="col-span-2 text-muted-foreground truncate text-[10px]">{grp?.name || "—"}</div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No permissions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupsTab() {
  const { isDemoMode } = useAuth();
  const groups = useQuery(
    api.engines.accessControlEngine.listPermissionGroups,
    isDemoMode ? "skip" : {},
  );

  if (!groups) return <Loading />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Permission groups organize permissions into logical categories.</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g: any) => (
          <Card key={g._id} className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent/50">
                  <FolderTree className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground/60">Order: {g.order}</p>
                </div>
              </div>
              {g.description && <p className="text-[10px] text-muted-foreground/60 mt-1.5">{g.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DesignationsTab() {
  const { isDemoMode } = useAuth();
  const designations = useQuery(
    api.engines.accessControlEngine.listDesignationRoles,
    isDemoMode ? "skip" : {},
  );
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );

  if (!designations || !roles) return <Loading />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Map designations (job titles) to roles for automatic assignment.</p>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <div className="col-span-4">Designation</div>
            <div className="col-span-4">Mapped Role</div>
            <div className="col-span-2">Default</div>
            <div className="col-span-2">Created</div>
          </div>
          {designations.map((d: any) => {
            const role = roles.find((r: any) => r._id === d.roleId);
            return (
              <div key={d._id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors items-center">
                <div className="col-span-4 font-medium">{d.designation}</div>
                <div className="col-span-4 text-muted-foreground">{role?.name || "—"}</div>
                <div className="col-span-2">
                  {d.isDefault ? <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-emerald-300/50 text-emerald-500">Yes</Badge> : "—"}
                </div>
                <div className="col-span-2 text-[10px] text-muted-foreground/60">{formatTime(d.createdAt)}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function AssignmentsTab() {
  const { isDemoMode } = useAuth();
  const userRoles = useQuery(
    api.engines.accessControlEngine.listUserRoles,
    isDemoMode ? "skip" : {},
  );
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );

  if (!userRoles || !roles) return <Loading />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">View all role assignments across users.</p>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Scope</div>
            <div className="col-span-3">Assigned</div>
          </div>
          {userRoles.map((ur: any) => (
            <div key={ur._id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors items-center">
              <div className="col-span-3 font-medium truncate">{ur.userName || "—"}</div>
              <div className="col-span-2 text-muted-foreground truncate">{ur.userEmail || "—"}</div>
              <div className="col-span-2">
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-border/40 text-muted-foreground/50">{ur.role?.name || "—"}</Badge>
              </div>
              <div className="col-span-2">
                {ur.organizationId ? <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-amber-300/50 text-amber-500">Org</Badge> : "—"}
              </div>
              <div className="col-span-3 text-[10px] text-muted-foreground/60">{formatTime(ur.createdAt)}</div>
            </div>
          ))}
          {userRoles.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No assignments yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function FlagsTab() {
  const { isDemoMode } = useAuth();
  const flags = useQuery(
    api.engines.accessControlEngine.listFeatureFlags,
    isDemoMode ? "skip" : {},
  );
  const [search, setSearch] = useState("");

  if (!flags) return <Loading />;

  const filtered = flags.filter((f: any) =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.key?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search flags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm rounded-sm" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f: any) => (
          <Card key={f._id} className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-accent/50">
                    <Flag className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground/60">{f.key}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${FLAG_COLORS[f.status] || ""}`}>{f.status}</Badge>
              </div>
              {f.description && <p className="text-[10px] text-muted-foreground/60 mt-1.5">{f.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudiosTab() {
  const { isDemoMode } = useAuth();
  const studioPerms = useQuery(
    api.engines.accessControlEngine.listStudioPermissions,
    isDemoMode ? "skip" : {},
  );
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );
  const [filterRole, setFilterRole] = useState<string | null>(null);

  if (!studioPerms || !roles) return <Loading />;

  const filtered = filterRole ? studioPerms.filter((sp: any) => sp.roleId === filterRole) : studioPerms;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Filter by role:</span>
        <button onClick={() => setFilterRole(null)} className={`px-2 py-1 text-[10px] rounded-sm transition-colors ${!filterRole ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>All</button>
        {roles.slice(0, 10).map((r: any) => (
          <button key={r._id} onClick={() => setFilterRole(r._id)} className={`px-2 py-1 text-[10px] rounded-sm transition-colors ${filterRole === r._id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r.code}</button>
        ))}
      </div>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <div className="col-span-3">Studio</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Access</div>
            <div className="col-span-3">Configure</div>
          </div>
          {filtered.map((sp: any) => {
            const role = roles.find((r: any) => r._id === sp.roleId);
            const Icon = STUDIO_ICONS[sp.studioId] || Shield;
            return (
              <div key={sp._id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{sp.studioId}</span>
                </div>
                <div className="col-span-3 text-muted-foreground">{role?.name || "—"}</div>
                <div className="col-span-3">
                  {sp.canAccess ? (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-emerald-300/50 text-emerald-500">
                      <Check className="h-2 w-2 mr-0.5" /> Allowed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-red-300/50 text-red-500">
                      <X className="h-2 w-2 mr-0.5" /> Denied
                    </Badge>
                  )}
                </div>
                <div className="col-span-3 text-muted-foreground">{sp.canConfigure ? "Yes" : "No"}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function MenusTab() {
  const { isDemoMode } = useAuth();
  const menuPerms = useQuery(
    api.engines.accessControlEngine.listMenuPermissions,
    isDemoMode ? "skip" : {},
  );
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );

  if (!menuPerms || !roles) return <Loading />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Control menu visibility and behavior per role.</p>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <div className="col-span-4">Menu</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-5">Visibility</div>
          </div>
          {menuPerms.map((mp: any) => {
            const role = roles.find((r: any) => r._id === mp.roleId);
            const visColors: Record<string, string> = { visible: "border-emerald-300/50 text-emerald-500", hidden: "border-red-300/50 text-red-500", disabled: "border-amber-300/50 text-amber-500", readonly: "border-blue-300/50 text-blue-500" };
            return (
              <div key={mp._id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors items-center">
                <div className="col-span-4 font-medium truncate">{mp.menuKey}</div>
                <div className="col-span-3 text-muted-foreground">{role?.name || "—"}</div>
                <div className="col-span-5">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${visColors[mp.visibility] || ""}`}>{mp.visibility}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ScopesTab() {
  const { isDemoMode } = useAuth();
  const scopes = useQuery(
    api.engines.accessControlEngine.listScopeRules,
    isDemoMode ? "skip" : {},
  );
  const roles = useQuery(
    api.engines.accessControlEngine.listRoles,
    isDemoMode ? "skip" : {},
  );

  if (!scopes || !roles) return <Loading />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Define data access scopes per role and entity type. Hierarchy: own → team → department → branch → company → organization → global.</p>
      <Card className="rounded-sm border-border/50 shadow-none">
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Entity Type</div>
            <div className="col-span-3">Default Scope</div>
            <div className="col-span-3">Max Scope</div>
          </div>
          {scopes.map((s: any) => {
            const role = roles.find((r: any) => r._id === s.roleId);
            return (
              <div key={s._id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors items-center">
                <div className="col-span-3 font-medium">{role?.name || "—"}</div>
                <div className="col-span-3 text-muted-foreground">{s.entityType}</div>
                <div className="col-span-3">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${SCOPE_COLORS[s.defaultScope] || ""}`}>{s.defaultScope}</Badge>
                </div>
                <div className="col-span-3">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${SCOPE_COLORS[s.maxScope] || ""}`}>{s.maxScope}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatsCards() {
  const { isDemoMode } = useAuth();
  const stats = useQuery(
    api.engines.accessControlEngine.getStats,
    isDemoMode ? "skip" : {},
  );

  if (!stats) return null;

  const cards = [
    { label: "Active Roles", value: stats.totalRoles, icon: Key, color: "bg-blue-500/10 text-blue-600" },
    { label: "Permissions", value: stats.totalPermissions, icon: Shield, color: "bg-violet-500/10 text-violet-600" },
    { label: "Assignments", value: stats.totalAssignments, icon: UserCheck, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Feature Flags", value: stats.totalFeatureFlags, icon: Flag, color: "bg-amber-500/10 text-amber-600" },
    { label: "Groups", value: stats.totalGroups, icon: FolderTree, color: "bg-indigo-500/10 text-indigo-600" },
    { label: "System Roles", value: stats.systemRoles, icon: Settings2, color: "bg-slate-500/10 text-slate-600" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {cards.map((c) => (
        <Card key={c.label} className="rounded-sm border-border/50 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">{c.label}</p>
                <p className="text-lg font-semibold mt-0.5">{c.value}</p>
              </div>
              <div className={`flex h-7 w-7 items-center justify-center rounded-sm ${c.color}`}>
                <c.icon className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function AccessControlStudio() {
  const [activeTab, setActiveTab] = useState("users");

  const renderTab = () => {
    switch (activeTab) {
      case "users": return <UsersTab />;
      case "roles": return <RolesTab />;
      case "permissions": return <PermissionsTab />;
      case "groups": return <GroupsTab />;
      case "designations": return <DesignationsTab />;
      case "assignments": return <AssignmentsTab />;
      case "flags": return <FlagsTab />;
      case "studios": return <StudiosTab />;
      case "menus": return <MenusTab />;
      case "scopes": return <ScopesTab />;
      default: return <UsersTab />;
    }
  };

  return (
    <StudioLayout
      title="Access Control Studio"
      description="Manage roles, permissions, feature flags, and security policies across the platform."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Access Control" },
      ]}
    >
      {/* Stats */}
      <StatsCards />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap border-b border-border/50 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-sm transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </StudioLayout>
  );
}
