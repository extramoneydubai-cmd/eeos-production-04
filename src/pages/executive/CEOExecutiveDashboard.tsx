/**
 * CEO Executive Dashboard
 *
 * Combines the CEO ExecutiveDashboard with the Control Center admin actions.
 * This is the headquarters for the CEO — strategic insights + admin tools.
 */

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ExecutiveDashboard from "./ExecutiveDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, UserPlus, Users, KeyRound,
  Megaphone, Plus, Settings, Send, Hash,
  LayoutDashboard, BarChart3, Sparkles,
} from "lucide-react";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Id } from "@/convex/_generated/dataModel";

export default function CEOExecutiveDashboard() {
  const { user } = useAuth();
  useAppNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user || user.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Shield className="h-10 w-10 text-[#9aa0a6] mb-3" />
        <h2 className="text-base font-semibold text-[#1a1a2e]">Access Restricted</h2>
        <p className="text-[13px] text-[#5f6368] mt-1">Only the CEO can access the Command Center.</p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#1a1a2e]">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a2e]">CEO Command Center</h1>
            <p className="text-[12px] text-[#5f6368]">Enterprise-wide performance overview and administrative controls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#1a1a2e] text-[#1a1a2e] font-medium">
            CEO Access
          </Badge>
        </div>
      </div>

      <TabsList className="bg-[#f1f3f4] p-0.5 mb-4">
        <TabsTrigger value="dashboard" className="text-[12px] data-[state=active]:bg-white">
          <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> Executive Dashboard
        </TabsTrigger>
        <TabsTrigger value="admin" className="text-[12px] data-[state=active]:bg-white">
          <Settings className="h-3.5 w-3.5 mr-1.5" /> Admin Controls
        </TabsTrigger>
        <TabsTrigger value="analytics" className="text-[12px] data-[state=active]:bg-white">
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <ExecutiveDashboard dashboardId="ceo" />
      </TabsContent>

      <TabsContent value="admin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ControlCenterCard
            icon={UserPlus}
            title="Create User"
            description="Add a new user to the system"
            color="bg-[#e8f0fe]"
            iconColor="text-[#1a73e8]"
            dialogTitle="Create User"
          >
            <CreateUserForm />
          </ControlCenterCard>

          <ControlCenterCard
            icon={Users}
            title="Create Team"
            description="Add a new team to a department"
            color="bg-[#e6f4ea]"
            iconColor="text-[#34a853]"
            dialogTitle="Create Team"
          >
            <CreateTeamForm />
          </ControlCenterCard>

          <ControlCenterCard
            icon={Hash}
            title="Create Channel"
            description="Create a new messenger channel"
            color="bg-[#fef7e0]"
            iconColor="text-[#fbbc04]"
            dialogTitle="Create Channel"
          >
            <CreateChannelForm />
          </ControlCenterCard>

          <ControlCenterCard
            icon={Megaphone}
            title="Broadcast"
            description="Send an announcement to all users"
            color="bg-[#fce8e6]"
            iconColor="text-[#ea4335]"
            dialogTitle="Send Announcement"
          >
            <BroadcastForm />
          </ControlCenterCard>

          <ControlCenterCard
            icon={KeyRound}
            title="Reset Password"
            description="Reset any user's password"
            color="bg-[#f3e8ff]"
            iconColor="text-[#a855f7]"
            dialogTitle="Reset Password"
          >
            <ResetPasswordForm />
          </ControlCenterCard>

          <ControlCenterCard
            icon={Sparkles}
            title="Quick Stats"
            description="System-wide statistics"
            color="bg-[#f1f3f4]"
            iconColor="text-[#5f6368]"
            dialogTitle="System Statistics"
          >
            <QuickStats />
          </ControlCenterCard>
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        <ExecutiveDashboard dashboardId="ceo" />
      </TabsContent>
    </Tabs>
  );
}

// ─── Control Center Card Wrapper ─────────────────────────────────

function ControlCenterCard({
  icon: Icon, title, description, color, iconColor, dialogTitle, children,
}: {
  icon: React.ElementType; title: string; description: string;
  color: string; iconColor: string; dialogTitle: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <CardTitle className="text-sm font-semibold text-[#1a1a2e]">{title}</CardTitle>
        </div>
        <CardDescription className="text-[11px] text-[#9aa0a6]">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              <Plus className="h-3.5 w-3.5 mr-1" /> Open
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-base">{dialogTitle}</DialogTitle>
            </DialogHeader>
            {children}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Admin Forms ─────────────────────────────────────────────────

function CreateUserForm() {
  const departments = useQuery(api.organization.listDepartments);
  const createUserMutation = useMutation(api.userManagement.createUser);
  const setPasswordMutation = useMutation(api.authHelpers.setPassword);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState("staff");
  const [dept, setDept] = useState("");

  const handleCreate = async () => {
    if (!name || !email || !username) return;
    try {
      const uid = await createUserMutation({ name, email, username, role, departmentId: dept ? (dept as Id<"departments">) : undefined });
      if (uid && password) await setPasswordMutation({ userId: uid, password });
      setName(""); setEmail(""); setUsername("");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-3 pt-2">
      <div>
        <Label className="text-[12px]">Full Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" placeholder="John Doe" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[12px]">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-[13px]" type="email" />
        </div>
        <div>
          <Label className="text-[12px]">Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="h-9 text-[13px]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[12px]">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[12px]">Department</Label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {departments?.map((d) => (
                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-[12px]">Initial Password</Label>
        <Input value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <Button onClick={handleCreate} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create User</Button>
    </div>
  );
}

function CreateTeamForm() {
  const departments = useQuery(api.organization.listDepartments);
  const createTeamMutation = useMutation(api.organization.createTeam);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [dept, setDept] = useState("");

  const handleCreate = async () => {
    if (!name || !code || !dept) return;
    await createTeamMutation({ name, code: code.toUpperCase(), departmentId: dept as Id<"departments"> });
    setName(""); setCode("");
  };

  return (
    <div className="space-y-3 pt-2">
      <div>
        <Label className="text-[12px]">Team Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <div>
        <Label className="text-[12px]">Code</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <div>
        <Label className="text-[12px]">Department</Label>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {departments?.map((d) => (
              <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleCreate} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create Team</Button>
    </div>
  );
}

function CreateChannelForm() {
  const { user } = useAuth();
  const createChannelMutation = useMutation(api.messenger.createChannel);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = async () => {
    if (!name || !user) return;
    await createChannelMutation({ name, description: desc || undefined, type: "channel", createdBy: user._id });
    setName(""); setDesc("");
  };

  return (
    <div className="space-y-3 pt-2">
      <div>
        <Label className="text-[12px]">Channel Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <div>
        <Label className="text-[12px]">Description</Label>
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <Button onClick={handleCreate} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create Channel</Button>
    </div>
  );
}

function BroadcastForm() {
  const { user } = useAuth();
  const users = useQuery(api.users.listUsers);
  const createAnnouncementMutation = useMutation(api.messenger.createAnnouncement);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSend = async () => {
    if (!title || !content || !user) return;
    await createAnnouncementMutation({
      title, content, senderId: user._id,
      recipientIds: (users || []).map((u) => u._id),
    });
    setTitle(""); setContent("");
  };

  return (
    <div className="space-y-3 pt-2">
      <div>
        <Label className="text-[12px]">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <div>
        <Label className="text-[12px]">Message</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="text-[13px]" rows={4} />
      </div>
      <Button onClick={handleSend} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
        <Send className="h-3.5 w-3.5 mr-1" /> Send Announcement
      </Button>
    </div>
  );
}

function ResetPasswordForm() {
  const users = useQuery(api.users.listUsers);
  const setPasswordMutation = useMutation(api.authHelpers.setPassword);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("reset123");

  const handleReset = async () => {
    if (!userId || !password) return;
    await setPasswordMutation({ userId: userId as Id<"users">, password });
    setUserId(""); setPassword("reset123");
  };

  return (
    <div className="space-y-3 pt-2">
      <div>
        <Label className="text-[12px]">User</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select user" /></SelectTrigger>
          <SelectContent>
            {users?.filter((u) => !u.isDisabled).map((u) => (
              <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[12px]">New Password</Label>
        <Input value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 text-[13px]" />
      </div>
      <Button onClick={handleReset} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Reset Password</Button>
    </div>
  );
}

function QuickStats() {
  const users = useQuery(api.users.listUsers);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);

  return (
    <div className="space-y-2 pt-2">
      <div className="flex justify-between text-[12px] py-1 border-b border-[#f1f3f4]">
        <span className="text-[#5f6368]">Total Users</span>
        <span className="font-medium text-[#1a1a2e]">{users?.length || 0}</span>
      </div>
      <div className="flex justify-between text-[12px] py-1 border-b border-[#f1f3f4]">
        <span className="text-[#5f6368]">Departments</span>
        <span className="font-medium text-[#1a1a2e]">{departments?.length || 0}</span>
      </div>
      <div className="flex justify-between text-[12px] py-1">
        <span className="text-[#5f6368]">Teams</span>
        <span className="font-medium text-[#1a1a2e]">{teams?.length || 0}</span>
      </div>
    </div>
  );
}
