import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  UserX,
  UserCheck,
  Shield,
  KeyRound,
  Copy,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Building2,
  Users,
} from "lucide-react";
import { useState } from "react";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-[13px] text-[#9aa0a6]">{message}</p>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const users = useQuery(api.users.listUsers);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);
  const branches = useQuery(api.organization.listBranches);
  const designations = useQuery(api.organization.listDesignations);

  const createUser = useMutation(api.userManagement.createUser);
  const disableUser = useMutation(api.userManagement.disableUser);
  const enableUser = useMutation(api.userManagement.enableUser);
  const setPassword = useMutation(api.authHelpers.setPassword);

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Create user form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState("staff");
  const [formDept, setFormDept] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formDesig, setFormDesig] = useState("");
  const [formTeams, setFormTeams] = useState<string[]>([]);
  const [formPassword, setFormPassword] = useState("staff123");
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async () => {
    if (!formName || !formEmail || !formUsername) return;
    setCreating(true);
    try {
      const userId = await createUser({
        name: formName,
        email: formEmail,
        username: formUsername,
        role: formRole,
        departmentId: formDept as any || undefined,
        branchId: formBranch as any || undefined,
        designationId: formDesig as any || undefined,
        teamIds: formTeams as any || [],
      });
      if (userId && formPassword) {
        await setPassword({ userId, password: formPassword });
      }
      setShowCreateDialog(false);
      setFormName("");
      setFormEmail("");
      setFormUsername("");
      setFormRole("staff");
      setFormDept("");
      setFormBranch("");
      setFormDesig("");
      setFormPassword("staff123");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (userId: string, currentlyDisabled: boolean) => {
    if (currentlyDisabled) {
      await enableUser({ userId: userId as any });
    } else {
      await disableUser({ userId: userId as any });
    }
  };

  const handleResetPassword = async (userId: string) => {
    await setPassword({ userId: userId as any, password: "reset123" });
  };

  const filteredUsers = users?.filter((u: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const statusColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-[#1a1a2e] text-white";
      case "admin": return "bg-[#1a73e8] text-white";
      case "manager": return "bg-[#fbbc04] text-[#1a1a2e]";
      default: return "bg-[#f1f3f4] text-[#5f6368]";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n: any) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">User Management</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Manage users and their access</p>
        </div>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">Create User</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Full Name</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="h-9 text-[13px]" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Username</Label>
                    <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="h-9 text-[13px]" placeholder="johndoe" />
                  </div>
                </div>
                <div>
                  <Label className="text-[12px]">Email</Label>
                  <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="h-9 text-[13px]" placeholder="john@company.com" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Platform Role</Label>
                    <Select value={formRole} onValueChange={setFormRole}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Designation</Label>
                    <Select value={formDesig} onValueChange={setFormDesig}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations?.map((d: any) => (
                          <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Department</Label>
                    <Select value={formDept} onValueChange={setFormDept}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((d: any) => (
                          <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Branch</Label>
                    <Select value={formBranch} onValueChange={setFormBranch}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.map((b: any) => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[12px]">Default Password</Label>
                  <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="h-9 text-[13px]" />
                </div>
                <Button onClick={handleCreateUser} disabled={creating} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-[13px] border-[#e8eaed] max-w-sm"
        />
      </div>

      {/* Users List */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {!filteredUsers?.length ? (
            <EmptyState message={searchQuery ? "No users match your search" : "No users yet"} />
          ) : (
            <div className="divide-y divide-[#e8eaed]">
              {filteredUsers.map((user) => {
                const dept = departments?.find((d: any) => d._id === user.departmentId);
                const branch = branches?.find((b: any) => b._id === user.branchId);
                return (
                  <div key={user._id} className="flex items-center gap-3 p-3 hover:bg-[#f8f9fa] transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-[11px] bg-[#f1f3f4] text-[#5f6368]">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-[#1a1a2e] truncate">{user.name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 font-medium ${statusColor(user.role || "")}`}>
                          {user.role?.replace("_", " ")}
                        </Badge>
                        {user.isDisabled && (
                          <Badge variant="outline" className="text-[10px] text-[#ea4335] border-[#ea4335]">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#9aa0a6]">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email || user.username}
                        </span>
                        {dept && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {dept.name}
                          </span>
                        )}
                        {branch && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {branch.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#9aa0a6] hover:text-[#5f6368]"
                          onClick={() => handleResetPassword(user._id)}
                          title="Reset password to 'reset123'"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${user.isDisabled ? "text-[#34a853]" : "text-[#ea4335]"}`}
                          onClick={() => handleDisable(user._id, !!user.isDisabled)}
                          title={user.isDisabled ? "Enable user" : "Disable user"}
                        >
                          {user.isDisabled ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
