import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  UserPlus,
  Users,
  MessageSquare,
  KeyRound,
  Loader2,
  Megaphone,
  Plus,
  Settings,
  Sliders,
  Ban,
  CheckCircle,
  Send,
  Hash,
} from "lucide-react";
import { useState } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";

export default function ControlCenter() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const isCEO = user?.role === "super_admin";

  const users = useQuery(api.users.listUsers);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);

  const createUserMutation = useMutation(api.userManagement.createUser);
  const createTeamMutation = useMutation(api.organization.createTeam);
  const createChannelMutation = useMutation(api.messenger.createChannel);
  const createAnnouncementMutation = useMutation(api.messenger.createAnnouncement);
  const setPasswordMutation = useMutation(api.authHelpers.setPassword);

  // Create User
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPass, setNewPass] = useState("admin123");
  const [newRole, setNewRole] = useState("staff");
  const [newDept, setNewDept] = useState("");

  // Create Team
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamDept, setTeamDept] = useState("");

  // Create Channel
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");

  // Announcement
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");

  // Reset Password
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetPass, setResetPass] = useState("reset123");

  if (!isCEO) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Shield className="h-10 w-10 text-[#9aa0a6] mb-3" />
        <h2 className="text-base font-semibold text-[#1a1a2e]">Access Restricted</h2>
        <p className="text-[13px] text-[#5f6368] mt-1">Only the CEO can access the Control Center.</p>
      </div>
    );
  }

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newUsername) return;
    try {
      const uid = await createUserMutation({
        name: newName,
        email: newEmail,
        username: newUsername,
        role: newRole,
        departmentId: newDept as any || undefined,
      });
      if (uid && newPass) {
        await setPasswordMutation({ userId: uid, password: newPass });
      }
      setShowCreateUser(false);
      setNewName("");
      setNewEmail("");
      setNewUsername("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName || !teamCode || !teamDept) return;
    await createTeamMutation({ name: teamName, code: teamCode.toUpperCase(), departmentId: teamDept as any });
    setShowCreateTeam(false);
    setTeamName("");
    setTeamCode("");
  };

  const handleCreateChannel = async () => {
    if (!channelName || !user) return;
    await createChannelMutation({
      name: channelName,
      description: channelDesc || undefined,
      type: "channel",
      createdBy: user._id,
    });
    setShowCreateChannel(false);
    setChannelName("");
    setChannelDesc("");
  };

  const handleAnnounce = async () => {
    if (!announceTitle || !announceContent || !user) return;
    await createAnnouncementMutation({
      title: announceTitle,
      content: announceContent,
      senderId: user._id,
      recipientIds: (users || []).map((u) => u._id),
    });
    setShowAnnounce(false);
    setAnnounceTitle("");
    setAnnounceContent("");
  };

  const handleResetPass = async () => {
    if (!resetUserId || !resetPass) return;
    await setPasswordMutation({ userId: resetUserId as any, password: resetPass });
    setShowResetPass(false);
    setResetUserId("");
    setResetPass("reset123");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Control Center</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">CEO-only administrative actions</p>
        </div>
        <Badge variant="outline" className="text-[11px] border-[#1a1a2e] text-[#1a1a2e] font-medium">
          CEO Access
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create User */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#e8f0fe]">
                <UserPlus className="h-4 w-4 text-[#1a73e8]" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Create User</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-[#9aa0a6]">Add a new user to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-base">Create User</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px]">Full Name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-[13px]" placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Email</Label>
                      <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-9 text-[13px]" type="email" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Username</Label>
                      <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="h-9 text-[13px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[12px]">Department</Label>
                      <Select value={newDept} onValueChange={setNewDept}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
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
                    <Input value={newPass} onChange={(e) => setNewPass(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <Button onClick={handleCreateUser} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Create Team */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#e6f4ea]">
                <Users className="h-4 w-4 text-[#34a853]" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Create Team</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-[#9aa0a6]">Add a new team to a department</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-base">Create Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px]">Team Name</Label>
                    <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Code</Label>
                    <Input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Department</Label>
                    <Select value={teamDept} onValueChange={setTeamDept}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((d) => (
                          <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateTeam} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Create Channel */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#fef7e0]">
                <Hash className="h-4 w-4 text-[#fbbc04]" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Create Channel</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-[#9aa0a6]">Create a new messenger channel</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-base">Create Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px]">Channel Name</Label>
                    <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Description</Label>
                    <Input value={channelDesc} onChange={(e) => setChannelDesc(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <Button onClick={handleCreateChannel} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Broadcast Announcement */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#fce8e6]">
                <Megaphone className="h-4 w-4 text-[#ea4335]" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Broadcast</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-[#9aa0a6]">Send an announcement to all users</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showAnnounce} onOpenChange={setShowAnnounce}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <Megaphone className="h-3.5 w-3.5 mr-1" /> Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-base">Send Announcement</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px]">Title</Label>
                    <Input value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Message</Label>
                    <Textarea value={announceContent} onChange={(e) => setAnnounceContent(e.target.value)} className="text-[13px]" rows={4} />
                  </div>
                  <Button onClick={handleAnnounce} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                    <Send className="h-3.5 w-3.5 mr-1" /> Send
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Reset Password */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#f3e8ff]">
                <KeyRound className="h-4 w-4 text-[#a855f7]" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Reset Password</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-[#9aa0a6]">Reset any user's password</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showResetPass} onOpenChange={setShowResetPass}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-base">Reset Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px]">User</Label>
                    <Select value={resetUserId} onValueChange={setResetUserId}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter((u) => !u.isDisabled).map((u) => (
                          <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">New Password</Label>
                    <Input value={resetPass} onChange={(e) => setResetPass(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <Button onClick={handleResetPass} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Reset</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
                <Sliders className="h-4 w-4 text-[#5f6368]" />
              </div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">System Stats</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-[#5f6368]">Total Users</span>
                <span className="font-medium text-[#1a1a2e]">{users?.length || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#5f6368]">Departments</span>
                <span className="font-medium text-[#1a1a2e]">{departments?.length || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-[#5f6368]">Teams</span>
                <span className="font-medium text-[#1a1a2e]">{teams?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
