import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  X, Phone, Mail, MapPin, Target, DollarSign, Calendar, User, Clock,
  MessageSquare, MessageCircle, FileText, Activity, Plus, Send, Trash2, Loader2,
  CheckCircle2, Edit3, UserPlus, Paperclip, Sparkles, ArrowUpRight, Lock,
  ExternalLink, Bell, BellOff,
} from "lucide-react";
import { useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-[#9aa0a6]" }, { id: "attempted", label: "Attempted", color: "bg-[#4285f4]" },
  { id: "connected", label: "Connected", color: "bg-[#34a853]" }, { id: "qualified", label: "Qualified", color: "bg-[#fbbc04]" },
  { id: "counselling", label: "Counselling", color: "bg-[#a855f7]" }, { id: "interested", label: "Interested", color: "bg-[#1a73e8]" },
  { id: "follow_up", label: "Follow Up", color: "bg-[#ea4335]" }, { id: "negotiation", label: "Negotiation", color: "bg-[#e8710a]" },
  { id: "converted", label: "Converted", color: "bg-[#0d652d]" }, { id: "lost", label: "Lost", color: "bg-[#5f6368]" },
];

const stageColors: Record<string, string> = {
  new: "bg-[#9aa0a6]", attempted: "bg-[#4285f4]", connected: "bg-[#34a853]", qualified: "bg-[#fbbc04]",
  counselling: "bg-[#a855f7]", interested: "bg-[#1a73e8]", follow_up: "bg-[#ea4335]", negotiation: "bg-[#e8710a]",
  converted: "bg-[#0d652d]", lost: "bg-[#5f6368]",
};

const priorityColors: Record<string, string> = {
  low: "text-[#9aa0a6] bg-[#f1f3f4]", medium: "text-[#4285f4] bg-[#e8f0fe]",
  high: "text-[#ea4335] bg-[#fce8e6]", critical: "text-white bg-[#ea4335]",
};

interface Props {
  leadId: string;
  onClose: () => void;
  onOpenFull: () => void;
}

export default function LeadWorkspaceDrawer({ leadId, onClose, onOpenFull }: Props) {
  const { user } = useAuth();
  const lead = useQuery(api.crm.getLeadById, { leadId: leadId as any });
  const users = useQuery(api.users.listUsers);
  const branches = useQuery(api.organization.listBranches);
  const verticals = useQuery(api.organization.listVerticals);
  const tasks = useQuery(api.crm.getLeadTasks, { leadId: leadId as any });
  const notes = useQuery(api.crm.getLeadNotes, { leadId: leadId as any });
  const activity = useQuery(api.crm.getLeadActivity, { leadId: leadId as any });
  const documents = useQuery(api.crm.getLeadDocuments, { leadId: leadId as any });

  const updateLead = useMutation(api.crm.updateLead);
  const updateStage = useMutation(api.crm.updateLeadStage);
  const assignLead = useMutation(api.crm.assignLead);
  const createLeadTask = useMutation(api.crm.createLeadTask);
  const updateLeadTask = useMutation(api.crm.updateLeadTask);
  const deleteLeadTask = useMutation(api.crm.deleteLeadTask);
  const addLeadNote = useMutation(api.crm.addLeadNote);
  const scheduleFollowup = useMutation(api.crm.scheduleFollowup);

  const [newNote, setNewNote] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupAction, setFollowupAction] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupType, setFollowupType] = useState("call");

  if (!lead) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />
        <div className="relative w-full max-w-[70%] bg-[#f8f9fa] border-l border-[#e8eaed] shadow-xl h-full overflow-hidden flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
        </div>
      </div>
    );
  }

  const owner = users?.find((u) => u._id === lead.ownerId);
  const branch = branches?.find((b) => b._id === lead.branchInterestId);
  const vertical = verticals?.find((v) => v._id === lead.verticalId);
  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.id === lead.stage);

  const handleUpdateField = async (field: string, value: any) => {
    if (!user) return;
    await updateLead({ leadId: lead._id, [field]: value, userId: user._id });
  };

  const handleStageChange = async (newStage: string) => {
    if (!user) return;
    await updateStage({ leadId: lead._id, stage: newStage, note: `Moved from ${lead.stage}`, userId: user._id });
  };

  const handleAssign = async () => {
    if (!assignUserId || !user) return;
    await assignLead({ leadId: lead._id, toUserId: assignUserId as any, userId: user._id });
    setShowAssign(false);
    setAssignUserId("");
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    await addLeadNote({ leadId: lead._id, content: newNote, userId: user._id });
    setNewNote("");
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !user) return;
    await createLeadTask({ leadId: lead._id, title: newTaskTitle, ownerId: user._id });
    setNewTaskTitle("");
  };

  const handleScheduleFollowup = async () => {
    if (!followupAction || !followupDate || !user) return;
    await scheduleFollowup({
      leadId: lead._id, action: followupAction, followupDate: new Date(followupDate).getTime(),
      followupType, userId: user._id, priority: lead.priority,
    });
    setShowFollowup(false);
    setFollowupAction("");
    setFollowupDate("");
  };

  const getInitials = (name?: string) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-[70%] bg-white border-l border-[#e8eaed] shadow-xl h-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="shrink-0 border-b border-[#e8eaed] bg-white px-5 py-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-[12px] bg-[#1a1a2e] text-white">{lead.firstName[0]}{lead.lastName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[#1a1a2e] truncate">{lead.firstName} {lead.lastName}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 ${stageColors[lead.stage]} text-white`}>
                    {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.label || lead.stage}
                  </Badge>
                  <Badge className={`text-[8px] px-1 py-0 h-3 ${priorityColors[lead.priority]}`}>{lead.priority}</Badge>
                  <span className="text-[10px] text-[#9aa0a6]">#{lead._id.slice(-6)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed] hidden md:flex" onClick={onOpenFull} title="Open full page">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Full Workspace
              </Button>
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[#5f6368]" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Select value={lead.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="h-7 text-[10px] w-[130px] border-[#e8eaed]"><SelectValue placeholder="Move stage" /></SelectTrigger>
              <SelectContent>{PIPELINE_STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => setShowAssign(!showAssign)}>
              <UserPlus className="h-3 w-3 mr-0.5" /> Assign
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => setShowFollowup(!showFollowup)}>
              <Bell className="h-3 w-3 mr-0.5" /> Followup
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={handleCreateTask}>
              <Plus className="h-3 w-3 mr-0.5" /> Task
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => handleStageChange("converted")}>
              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Convert
            </Button>
          </div>

          {/* Assign inline */}
          {showAssign && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-[#f8f9fa] rounded-md">
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger className="h-7 text-[11px] flex-1 border-[#e8eaed]"><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>{users?.filter((u) => !u.isDisabled).map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleAssign} disabled={!assignUserId}>Assign</Button>
            </div>
          )}

          {/* Followup inline */}
          {showFollowup && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-[#f8f9fa] rounded-md">
              <Input value={followupAction} onChange={(e) => setFollowupAction(e.target.value)} placeholder="Action" className="h-7 text-[11px] flex-1" />
              <Input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className="h-7 text-[11px] w-[140px]" />
              <Select value={followupType} onValueChange={setFollowupType}>
                <SelectTrigger className="h-7 text-[10px] w-[100px] border-[#e8eaed]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem><SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem><SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-7 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleScheduleFollowup} disabled={!followupAction || !followupDate}>Schedule</Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-[#f1f3f4] p-0.5 sticky top-0 z-10">
              <TabsTrigger value="overview" className="text-[11px] data-[state=active]:bg-white px-2.5">Overview</TabsTrigger>
              <TabsTrigger value="timeline" className="text-[11px] data-[state=active]:bg-white px-2.5">Timeline</TabsTrigger>
              <TabsTrigger value="tasks" className="text-[11px] data-[state=active]:bg-white px-2.5">Tasks</TabsTrigger>
              <TabsTrigger value="notes" className="text-[11px] data-[state=active]:bg-white px-2.5">Notes</TabsTrigger>
              <TabsTrigger value="documents" className="text-[11px] data-[state=active]:bg-white px-2.5">Docs</TabsTrigger>
              <TabsTrigger value="analytics" className="text-[11px] data-[state=active]:bg-white px-2.5">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase">Contact</h3>
                  <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><Phone className="h-3.5 w-3.5 text-[#9aa0a6]" /> {lead.phone}</div>
                  {lead.email && <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><Mail className="h-3.5 w-3.5 text-[#9aa0a6]" /> {lead.email}</div>}
                  {lead.location && <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><MapPin className="h-3.5 w-3.5 text-[#9aa0a6]" /> {lead.location}</div>}
                  {lead.whatsappUsername && <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><MessageCircle className="h-3.5 w-3.5 text-[#9aa0a6]" /> {lead.whatsappUsername}</div>}
                  {lead.whatsappPin && <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><Lock className="h-3.5 w-3.5 text-[#9aa0a6]" /> PIN: {lead.whatsappPin}</div>}
                </div>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase">Sales</h3>
                  <div className="flex items-center gap-2 text-[12px] text-[#5f6368]">
                    <User className="h-3.5 w-3.5 text-[#9aa0a6]" /> {owner?.name || "Unassigned"}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#5f6368]">
                    <Target className="h-3.5 w-3.5 text-[#9aa0a6]" /> Source: {lead.source || "—"}
                  </div>
                  {lead.expectedRevenue && (
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]">
                      <DollarSign className="h-3.5 w-3.5 text-[#9aa0a6]" /> ₹{lead.expectedRevenue.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase">Qualification</h3>
                  <div className="text-[12px] text-[#5f6368]">Vertical: {vertical?.name || "—"}</div>
                  <div className="text-[12px] text-[#5f6368]">Branch: {branch?.name || "—"}</div>
                  {lead.courseInterest && <div className="text-[12px] text-[#5f6368]">Course: {lead.courseInterest}</div>}
                </div>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase">Next Action</h3>
                  <div className="flex items-center gap-2 text-[12px] text-[#5f6368]">
                    <Clock className="h-3.5 w-3.5 text-[#9aa0a6]" />
                    {lead.nextAction || "No action set"}
                  </div>
                  {lead.nextActionDate && (
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]">
                      <Calendar className="h-3.5 w-3.5 text-[#9aa0a6]" />
                      Due: {new Date(lead.nextActionDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Pipeline progress */}
              <div className="mt-4">
                <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase mb-2">Pipeline</h3>
                <div className="flex items-center gap-0.5">
                  {PIPELINE_STAGES.map((stage, idx) => (
                    <div key={stage.id} className="flex-1 flex items-center">
                      <div className={`h-1.5 rounded-full flex-1 transition-all ${idx <= currentStageIndex ? stage.color : "bg-[#f1f3f4]"} ${idx === currentStageIndex ? "h-2.5" : ""}`} />
                      {idx < PIPELINE_STAGES.length - 1 && <div className={`w-0.5 h-1 ${idx < currentStageIndex ? stage.color : "bg-[#f1f3f4]"}`} />}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="space-y-0">
                {!activity?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-8">No activity yet</p>
                ) : (
                  activity.slice(0, 20).map((a, idx) => {
                    const actionUser = users?.find((u) => u._id === a.userId);
                    return (
                      <div key={a._id} className="flex gap-3 pb-3 relative">
                        {idx < Math.min(activity.length - 1, 19) && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#e8eaed]" />}
                        <div className="w-6 h-6 rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0">
                          <Activity className="h-3 w-3 text-[#5f6368]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-[#1a1a2e]">{actionUser?.name || "System"}</span>
                            <span className="text-[9px] text-[#9aa0a6]">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-[11px] text-[#5f6368] mt-0.5">{a.description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="flex items-center gap-2 mb-3">
                <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="New task..." className="h-8 text-[12px] flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }} />
                <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleCreateTask} disabled={!newTaskTitle}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-1">
                {!tasks?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-4">No tasks</p>
                ) : (
                  tasks.map((t) => (
                    <div key={t._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] group">
                      <button onClick={() => updateLeadTask({ taskId: t._id, status: t.status === "completed" ? "pending" : "completed" })}
                        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${t.status === "completed" ? "bg-[#34a853] border-[#34a853]" : "border-[#9aa0a6] hover:border-[#1a73e8]"}`}>
                        {t.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] ${t.status === "completed" ? "line-through text-[#9aa0a6]" : "text-[#1a1a2e]"}`}>{t.title}</p>
                        {t.dueDate && <span className="text-[10px] text-[#9aa0a6]">{new Date(t.dueDate).toLocaleDateString()}</span>}
                      </div>
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#9aa0a6] hover:text-[#ea4335] opacity-0 group-hover:opacity-100"
                        onClick={() => deleteLeadTask({ taskId: t._id })}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="flex gap-2 mb-3">
                <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." className="text-[12px] min-h-[50px] flex-1" />
                <Button size="icon" className="h-9 w-9 bg-[#1a1a2e] hover:bg-[#2d2d4a] shrink-0" onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {!notes?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-4">No notes</p>
                ) : (
                  notes.slice(0, 20).map((n) => {
                    const nu = users?.find((u) => u._id === n.createdBy);
                    return (
                      <div key={n._id} className="p-2.5 rounded-md bg-[#f8f9fa]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-medium text-[#1a1a2e]">{nu?.name || "Unknown"}</span>
                          <span className="text-[9px] text-[#9aa0a6]">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-[11px] text-[#5f6368] whitespace-pre-wrap">{n.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <p className="text-[12px] text-[#9aa0a6] text-center py-8">Documents coming soon — upload and manage lead documents here.</p>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
                  <p className="text-[10px] text-[#5f6368]">Stage Progress</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]">{currentStageIndex + 1}/{PIPELINE_STAGES.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
                  <p className="text-[10px] text-[#5f6368]">Expected Revenue</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]">₹{lead.expectedRevenue?.toLocaleString() || "0"}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
                  <p className="text-[10px] text-[#5f6368]">Tasks</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]">{tasks?.length || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
                  <p className="text-[10px] text-[#5f6368]">Days Active</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]">{Math.floor((Date.now() - lead.createdAt) / 86400000)}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
