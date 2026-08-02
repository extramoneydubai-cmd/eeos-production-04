import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Shield,
  Search,
  User,
  Building2,
  Users,
  GitBranch,
  GraduationCap,
  Check,
  X,
  Eye,
  Sliders,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export default function AccessControl() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const users = useQuery(api.users.listUsers);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);
  const branches = useQuery(api.organization.listBranches);
  const verticals = useQuery(api.organization.listVerticals);

  const getUserScope = useQuery;
  const updateScope = useMutation(api.userManagement.updateUserScope);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingScope, setEditingScope] = useState(false);

  // Scope edit form
  const [scopeDepts, setScopeDepts] = useState<string[]>([]);
  const [scopeTeams, setScopeTeams] = useState<string[]>([]);
  const [scopeBranches, setScopeBranches] = useState<string[]>([]);
  const [scopeVerts, setScopeVerts] = useState<string[]>([]);
  const [scopeDashboard, setScopeDashboard] = useState(true);

  const filteredUsers = users?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const selectedUserData = selectedUser ? users?.find((u) => u._id === selectedUser) : null;
  const selectedScope = useQuery(
    api.userManagement.getUserScope,
    selectedUser ? { userId: selectedUser as Id<"users"> } : "skip"
  );

  const roleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-[#1a1a2e] text-white";
      case "admin": return "bg-[#1a73e8] text-white";
      case "manager": return "bg-[#fbbc04] text-[#1a1a2e]";
      default: return "bg-[#f1f3f4] text-[#5f6368]";
    }
  };

  const handleEditScope = () => {
    if (!selectedScope) return;
    setScopeDepts(selectedScope.departmentIds || []);
    setScopeTeams(selectedScope.teamIds || []);
    setScopeBranches(selectedScope.branchIds || []);
    setScopeVerts(selectedScope.verticalIds || []);
    setScopeDashboard(selectedScope.canAccessDashboard ?? true);
    setEditingScope(true);
  };

  const handleSaveScope = async () => {
    if (!selectedUser) return;
    await updateScope({
      userId: selectedUser as Id<"users">,
      departmentIds: scopeDepts.length > 0 ? scopeDepts as Id<"departments">[] : undefined,
      teamIds: scopeTeams.length > 0 ? scopeTeams as Id<"teams">[] : undefined,
      branchIds: scopeBranches.length > 0 ? scopeBranches as Id<"branches">[] : undefined,
      verticalIds: scopeVerts.length > 0 ? scopeVerts as Id<"verticals">[] : undefined,
      canAccessDashboard: scopeDashboard,
    });
    setEditingScope(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a2e]">Access Control</h1>
        <p className="text-[13px] text-[#5f6368] mt-0.5">Manage effective access and role visibility</p>
      </div>

      <Tabs defaultValue="effective">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="effective" className="text-[12px] data-[state=active]:bg-white">Effective Access</TabsTrigger>
          <TabsTrigger value="roles" className="text-[12px] data-[state=active]:bg-white">Role Visibility</TabsTrigger>
        </TabsList>

        <TabsContent value="effective" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* User List */}
            <Card className="border-[#e8eaed] shadow-sm bg-white lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Users</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-[12px]"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#e8eaed] max-h-[400px] overflow-y-auto">
                  {filteredUsers?.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => setSelectedUser(u._id)}
                      className={`w-full flex items-center gap-2 p-2.5 text-left transition-colors ${
                        selectedUser === u._id ? "bg-[#f1f3f4]" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                          {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{u.name}</p>
                        <p className="text-[10px] text-[#9aa0a6]">@{u.username}</p>
                      </div>
                      <Badge className={`text-[9px] px-1 py-0 h-3.5 ${roleColor(u.role || "")}`}>
                        {u.role?.replace("_", " ")}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Access Details */}
            <Card className="border-[#e8eaed] shadow-sm bg-white lg:col-span-2">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                    {selectedUserData ? selectedUserData.name : "Select a User"}
                  </CardTitle>
                  {selectedScope && (
                    <CardDescription className="text-[11px]">Effective Access & Permissions</CardDescription>
                  )}
                </div>
                {selectedUser && isAdmin && isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[12px]"
                    onClick={handleEditScope}
                  >
                    <Sliders className="h-3.5 w-3.5 mr-1" /> Edit Scope
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedUser ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Eye className="h-8 w-8 text-[#dadce0] mb-2" />
                    <p className="text-[13px] text-[#9aa0a6]">Select a user to view their access</p>
                  </div>
                ) : !selectedScope ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6] mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs bg-[#f1f3f4] text-[#5f6368]">
                          {selectedUserData?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1a1a2e]">{selectedUserData?.name}</p>
                        <p className="text-[11px] text-[#9aa0a6]">@{selectedUserData?.username} · {selectedUserData?.email}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Scope Sections */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Departments</p>
                        {selectedScope.departmentIds?.length ? (
                          selectedScope.departmentIds.map((did) => {
                            const dept = departments?.find((d) => d._id === did);
                            return (
                              <div key={did} className="flex items-center gap-1.5 text-[12px] text-[#1a1a2e]">
                                <Check className="h-3 w-3 text-[#34a853]" />
                                {dept?.name || "Unknown"}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11px] text-[#9aa0a6]">All departments</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Teams</p>
                        {selectedScope.teamIds?.length ? (
                          selectedScope.teamIds.map((tid) => {
                            const team = teams?.find((t) => t._id === tid);
                            return (
                              <div key={tid} className="flex items-center gap-1.5 text-[12px] text-[#1a1a2e]">
                                <Check className="h-3 w-3 text-[#a855f7]" />
                                {team?.name || "Unknown"}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11px] text-[#9aa0a6]">All teams</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Branches</p>
                        {selectedScope.branchIds?.length ? (
                          selectedScope.branchIds.map((bid) => {
                            const branch = branches?.find((b) => b._id === bid);
                            return (
                              <div key={bid} className="flex items-center gap-1.5 text-[12px] text-[#1a1a2e]">
                                <Check className="h-3 w-3 text-[#fbbc04]" />
                                {branch?.name || "Unknown"}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11px] text-[#9aa0a6]">All branches</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wider">Dashboard</p>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#1a1a2e]">
                          {selectedScope.canAccessDashboard ? (
                            <Check className="h-3 w-3 text-[#34a853]" />
                          ) : (
                            <X className="h-3 w-3 text-[#ea4335]" />
                          )}
                          {selectedScope.canAccessDashboard ? "Access granted" : "No access"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a2e]">Platform Roles</h3>
                  <p className="text-[12px] text-[#5f6368] mt-0.5">
                    Roles are separate from designations. They control platform access levels.
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { role: "super_admin", label: "Super Admin", desc: "Full system access. Can manage all modules, users, and settings.", color: "bg-[#1a1a2e]" },
                    { role: "admin", label: "Admin", desc: "Can manage users, create tasks, and access most modules.", color: "bg-[#1a73e8]" },
                    { role: "manager", label: "Manager", desc: "Can manage team tasks, approve requests, and view dashboards.", color: "bg-[#fbbc04]" },
                    { role: "staff", label: "Staff", desc: "Can view assigned tasks, participate in discussions, and update profile.", color: "bg-[#f1f3f4]" },
                  ].map((r) => (
                    <div key={r.role} className="p-3 border border-[#e8eaed] rounded-md">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${r.color}`} />
                        <span className="text-[13px] font-semibold text-[#1a1a2e] capitalize">{r.role.replace("_", " ")}</span>
                      </div>
                      <p className="text-[11px] text-[#5f6368] mt-1">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Scope Dialog */}
      <Dialog open={editingScope} onOpenChange={setEditingScope}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Access Scope</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[12px]">Dashboard Access</Label>
              <div className="flex items-center gap-2 mt-1">
                <Checkbox
                  checked={scopeDashboard}
                  onCheckedChange={(checked) => setScopeDashboard(!!checked)}
                />
                <span className="text-[13px] text-[#5f6368]">Can access dashboard</span>
              </div>
            </div>

            <div>
              <Label className="text-[12px]">Department Access</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {departments?.map((d) => (
                  <Badge
                    key={d._id}
                    variant={scopeDepts.includes(d._id) ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => {
                      setScopeDepts((prev) =>
                        prev.includes(d._id)
                          ? prev.filter((id) => id !== d._id)
                          : [...prev, d._id]
                      );
                    }}
                  >
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[12px]">Team Access</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-[200px] overflow-y-auto">
                {teams?.map((t) => (
                  <Badge
                    key={t._id}
                    variant={scopeTeams.includes(t._id) ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => {
                      setScopeTeams((prev) =>
                        prev.includes(t._id)
                          ? prev.filter((id) => id !== t._id)
                          : [...prev, t._id]
                      );
                    }}
                  >
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[12px]">Branch Access</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {branches?.map((b) => (
                  <Badge
                    key={b._id}
                    variant={scopeBranches.includes(b._id) ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => {
                      setScopeBranches((prev) =>
                        prev.includes(b._id)
                          ? prev.filter((id) => id !== b._id)
                          : [...prev, b._id]
                      );
                    }}
                  >
                    {b.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveScope} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
