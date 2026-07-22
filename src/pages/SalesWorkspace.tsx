import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, User, DollarSign, Calendar, Clock, CheckCircle2, XCircle,
  AlertCircle, Target, TrendingUp, Users, Loader2, UserPlus, Plus,
  FileText, Bell, LayoutGrid, ListChecks, X, MessageCircle, Percent,
  ThumbsUp, ThumbsDown, ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Doc } from "@/convex/_generated/dataModel";
import LeadWorkspaceDrawer from "./LeadWorkspaceDrawer";

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-[#9aa0a6]" },
  { id: "attempted", label: "Attempted", color: "bg-[#4285f4]" },
  { id: "connected", label: "Connected", color: "bg-[#34a853]" },
  { id: "qualified", label: "Qualified", color: "bg-[#fbbc04]" },
  { id: "counselling", label: "Counselling", color: "bg-[#a855f7]" },
  { id: "interested", label: "Interested", color: "bg-[#1a73e8]" },
  { id: "follow_up", label: "Follow Up", color: "bg-[#ea4335]" },
  { id: "negotiation", label: "Negotiation", color: "bg-[#e8710a]" },
  { id: "converted", label: "Converted", color: "bg-[#0d652d]" },
  { id: "lost", label: "Lost", color: "bg-[#5f6368]" },
];

const stageColors: Record<string, string> = {
  new: "bg-[#9aa0a6]", attempted: "bg-[#4285f4]", connected: "bg-[#34a853]",
  qualified: "bg-[#fbbc04]", counselling: "bg-[#a855f7]", interested: "bg-[#1a73e8]",
  follow_up: "bg-[#ea4335]", negotiation: "bg-[#e8710a]", converted: "bg-[#0d652d]", lost: "bg-[#5f6368]",
};

const priorityColors: Record<string, string> = {
  low: "text-[#9aa0a6] bg-[#f1f3f4]", medium: "text-[#4285f4] bg-[#e8f0fe]",
  high: "text-[#ea4335] bg-[#fce8e6]", critical: "text-white bg-[#ea4335]",
};

const PIPELINE_KEYS = ["new", "attempted", "connected", "qualified", "counselling", "interested", "follow_up", "negotiation", "converted", "lost"];

const WHATSAPP_TEMPLATES = [
  { id: "greeting", label: "Greeting", text: (name: string) => `Hi ${name}! Thank you for your interest in our programs. We'd love to help you with your educational journey.` },
  { id: "followup", label: "Followup", text: (name: string) => `Hi ${name}! Just checking in to see if you have any questions about our programs.` },
  { id: "reminder", label: "Reminder", text: (name: string) => `Hi ${name}! This is a gentle reminder about your upcoming appointment with us.` },
  { id: "offer", label: "Offer", text: (name: string) => `Hi ${name}! We have a special offer just for you. Get exclusive discounts when you enrol this week!` },
  { id: "approval", label: "Approval", text: (name: string) => `Hi ${name}! Great news! Your request has been approved. Our team will reach out with next steps.` },
  { id: "conversion", label: "Conversion", text: (name: string) => `Hi ${name}! We're excited to have you on board! Please complete your enrollment to secure your spot.` },
];

export default function SalesWorkspace() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [viewMode, setViewMode] = useState<"table" | "pipeline" | "calendar">("table");
  const [activeTab, setActiveTab] = useState("queue");
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);

  const leads = useQuery(api.crm.listLeads, user ? {} : "skip");
  const users = useQuery(api.users.listUsers);
  const dashboard = useQuery(api.crm.getCrmDashboardData, user ? { userId: user._id } : "skip");
  const pendingApprovals = useQuery(api.crm.getAllPendingApprovals, user ? { userId: user._id } : "skip");

  const updateStage = useMutation(api.crm.updateLeadStage);
  const assignLead = useMutation(api.crm.assignLead);
  const scheduleFollowup = useMutation(api.crm.scheduleFollowup);
  const sendWhatsApp = useMutation(api.crm.sendWhatsAppMessage);
  const createLeadTask = useMutation(api.crm.createLeadTask);
  const decideOnApproval = useMutation(api.crm.decideOnApproval);

  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupLeadId, setFollowupLeadId] = useState<string | null>(null);
  const [followupAction, setFollowupAction] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupType, setFollowupType] = useState("call");
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waLeadId, setWaLeadId] = useState<string | null>(null);
  const [waMessage, setWaMessage] = useState("");
  const [waTemplate, setWaTemplate] = useState("manual");

  const leadsArray = (leads || []) as Doc<"leadMaster">[];
  const myLeads = leadsArray.filter((l: any) => l.ownerId === user?._id && l.status === "active");
  const todayFollowups = leadsArray.filter((l: any) => {
    if (!l.nextActionDate || l.status !== "active") return false;
    const now = Date.now(), d = 86400000;
    return l.nextActionDate >= now && l.nextActionDate <= now + d;
  });
  const overdue = leadsArray.filter((l: any) => l.nextActionDate && l.nextActionDate < Date.now() && l.status === "active");
  const newLeads = leadsArray.filter((l: any) => l.stage === "new" && l.status === "active");
  const converted = leadsArray.filter((l: any) => l.status === "converted");
  const lost = leadsArray.filter((l: any) => l.status === "lost");
  const myTasks = (dashboard ? dashboard.myPendingTasks : 0);

  const getLeadsForStage = (stage: string) => leadsArray.filter((l: any) => l.stage === stage && l.status === "active");

  const handleMoveStage = async (leadId: string, stage: string) => {
    if (!user) return;
    await updateStage({ leadId: leadId as any, stage, userId: user._id });
  };

  const handleAssign = async () => {
    if (!assignUserId || !assignLeadId || !user) return;
    await assignLead({ leadId: assignLeadId as any, toUserId: assignUserId as any, userId: user._id });
    setAssignLeadId(null); setAssignUserId("");
  };

  const handleScheduleFollowup = async () => {
    if (!followupAction || !followupDate || !followupLeadId || !user) return;
    await scheduleFollowup({ leadId: followupLeadId as any, action: followupAction, followupDate: new Date(followupDate).getTime(), followupType, userId: user._id });
    setShowFollowup(false); setFollowupLeadId(null); setFollowupAction(""); setFollowupDate("");
  };

  const handleSendWhatsApp = async () => {
    if (!waMessage || !user || !waLeadId) return;
    const lead = leadsArray.find((l: any) => l._id === waLeadId);
    if (!lead) return;
    const phone = lead.phone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(waMessage)}`;
    await sendWhatsApp({ leadId: waLeadId as any, message: waMessage, whatsappUrl: url, template: waTemplate === "manual" ? undefined : waTemplate as any, sentBy: user._id });
    window.open(url, "_blank");
    setShowWhatsApp(false); setWaLeadId(null); setWaMessage("");
  };

  const handleWaTemplateChange = (tmpl: string, leadName: string) => {
    setWaTemplate(tmpl);
    const found = WHATSAPP_TEMPLATES.find((t: any) => t.id === tmpl);
    setWaMessage(found ? found.text(leadName) : "");
  };

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (draggedLead) { handleMoveStage(draggedLead, stage); setDraggedLead(null); }
  };

  const handleCreateTaskForLead = async (leadId: string) => {
    if (!user) return;
    const title = prompt("Task title:");
    if (title) await createLeadTask({ leadId: leadId as any, title, ownerId: user._id });
  };

  const handleApprovalDecision = async (approvalId: string, decision: "approved" | "rejected" | "returned") => {
    if (!user) return;
    await decideOnApproval({ approvalId: approvalId as any, userId: user._id, decision });
  };

  const renderLeadRow = (lead: Doc<"leadMaster">) => {
    const owner = users?.find((u: any) => u._id === lead.ownerId);
    const isOverdue = lead.nextActionDate && lead.nextActionDate < Date.now() && lead.status === "active";
    return (
      <div key={lead._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f8f9fa] transition-colors group border-b border-[#f1f3f4] last:border-0 cursor-pointer"
        onClick={() => navigate(`/crm/leads/${lead._id}`)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[8px] bg-[#f1f3f4] text-[#5f6368]">{lead.firstName[0]}{lead.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#1a1a2e] truncate max-w-[140px]">{lead.firstName} {lead.lastName}</p>
            <p className="text-[10px] text-[#5f6368]">{lead.phone}</p>
          </div>
        </div>
        <div className="hidden md:block w-[90px]">
          <Badge className={`text-[8px] px-1.5 py-0 h-4 ${stageColors[lead.stage]} text-white`}>{PIPELINE_STAGES.find((s: any) => s.id === lead.stage)?.label}</Badge>
        </div>
        <div className="hidden lg:flex items-center gap-1 w-[80px]">
          {owner && <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-[#f1f3f4] text-[#5f6368]">{owner.name?.[0]}</AvatarFallback></Avatar>}
          <span className="text-[10px] text-[#5f6368]">{owner?.name?.split(" ")[0]}</span>
        </div>
        <div className="hidden xl:block w-[80px] text-right">
          {lead.expectedRevenue ? <span className="text-[11px] font-medium text-[#1a1a2e]">₹{lead.expectedRevenue.toLocaleString()}</span> : <span className="text-[10px] text-[#9aa0a6]">—</span>}
        </div>
        <div className="w-[60px] text-right">
          {lead.nextActionDate && <span className={`text-[10px] ${isOverdue ? "text-[#ea4335]" : "text-[#9aa0a6]"}`}>{new Date(lead.nextActionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#25D366]"
            onClick={() => { setWaLeadId(lead._id); handleWaTemplateChange("followup", lead.firstName); setShowWhatsApp(true); }}>
            <MessageCircle className="h-3 w-3" />
          </Button>
          <Select onValueChange={(v) => handleMoveStage(lead._id, v)}>
            <SelectTrigger className="h-6 text-[9px] w-[80px] border-[#e8eaed]"><SelectValue placeholder="Move" /></SelectTrigger>
            <SelectContent>{PIPELINE_KEYS.map((k: any) => <SelectItem key={k} value={k}>{PIPELINE_STAGES.find((s: any) => s.id === k)?.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#5f6368]" onClick={() => { setAssignLeadId(lead._id); setAssignUserId(lead.ownerId || ""); }}>
            <UserPlus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#5f6368]" onClick={() => { setFollowupLeadId(lead._id); setShowFollowup(true); }}>
            <Bell className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#5f6368]" onClick={() => handleCreateTaskForLead(lead._id)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const renderLeadList = (list: Doc<"leadMaster">[]) => (
    <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-1">
      {list.length === 0 ? (
        <div className="text-center py-8"><Target className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" /><p className="text-[12px] text-[#5f6368]">No leads in this view</p></div>
      ) : list.map(renderLeadRow)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Sales Action Center</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Pipeline, approvals, tasks & followups</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f1f3f4] rounded-lg p-0.5">
            <Button variant="ghost" size="icon-sm" className={`h-7 w-7 ${viewMode === "table" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("table")}><ListChecks className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon-sm" className={`h-7 w-7 ${viewMode === "pipeline" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("pipeline")}><LayoutGrid className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon-sm" className={`h-7 w-7 ${viewMode === "calendar" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("calendar")}><Calendar className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm")}><TrendingUp className="h-3.5 w-3.5 mr-1" /> Dashboard</Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/leads")}><Users className="h-3.5 w-3.5 mr-1" /> Database</Button>
        </div>
      </div>

      {/* Quick Action Bar */}
      {dashboard && (
        <div className="grid grid-cols-5 gap-2">
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/crm/leads")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">My Leads</p><p className="text-lg font-semibold text-[#1a1a2e] mt-0.5">{dashboard.myLeads}</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("queue")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Today</p><p className="text-lg font-semibold text-[#4285f4] mt-0.5">{todayFollowups.length}</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("queue")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Overdue</p><p className="text-lg font-semibold text-[#ea4335] mt-0.5">{overdue.length}</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/crm/sales/tasks")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Pending Tasks</p><p className="text-lg font-semibold text-[#34a853] mt-0.5">{myTasks}</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/crm/sales/payments")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Payments</p><p className="text-lg font-semibold text-[#1a73e8] mt-0.5">View All</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/crm/sales/collections")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Collection Center</p><p className="text-lg font-semibold text-[#e8710a] mt-0.5">Installments & PDC</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/crm/sales/performance")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Performance</p><p className="text-lg font-semibold text-[#a855f7] mt-0.5">Dashboard</p></CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("approvals")}>
            <CardContent className="p-3 text-center"><p className="text-[10px] text-[#5f6368]">Approvals</p><p className="text-lg font-semibold text-[#fbbc04] mt-0.5">{pendingApprovals?.length || 0}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-[#9aa0a6] font-medium uppercase">Quick:</span>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/crm/leads")}><Phone className="h-3 w-3 mr-1" /> Call</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"><UserPlus className="h-3 w-3 mr-1" /> Assign</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"><FileText className="h-3 w-3 mr-1" /> Note</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"><Percent className="h-3 w-3 mr-1" /> Discount</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"><DollarSign className="h-3 w-3 mr-1" /> Payment</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"><Plus className="h-3 w-3 mr-1" /> Add Lead</Button>
      </div>

      {/* Pipeline View */}
      {viewMode === "pipeline" ? (
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ minHeight: 400 }}>
          {["new", "connected", "qualified", "counselling", "interested", "negotiation", "converted", "lost"].map((stageKey) => {
            const stage = PIPELINE_STAGES.find((s: any) => s.id === stageKey)!;
            const stageLeads = getLeadsForStage(stageKey);
            return (
              <div key={stageKey} className="flex-1 min-w-[180px] bg-[#f8f9fa] rounded-lg p-2"
                onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stageKey)}>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-[10px] font-semibold text-[#1a1a2e] uppercase">{stage.label}</span>
                  <span className="text-[10px] text-[#9aa0a6] ml-auto">{stageLeads.length}</span>
                </div>
                <div className="space-y-1.5 min-h-[200px]">
                  {stageLeads.map((lead) => {
                    const owner = users?.find((u: any) => u._id === lead.ownerId);
                    return (
                      <div key={lead._id} draggable onDragStart={() => handleDragStart(lead._id)}
                        className="bg-white rounded-md border border-[#e8eaed] p-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
                        onClick={() => navigate(`/crm/leads/${lead._id}`)}>
                        <p className="text-[11px] font-medium text-[#1a1a2e]">{lead.firstName} {lead.lastName}</p>
                        <p className="text-[9px] text-[#5f6368]">{lead.phone}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {lead.priority && <span className={`text-[8px] px-1 py-0 rounded ${priorityColors[lead.priority]}`}>{lead.priority}</span>}
                          {lead.expectedRevenue && <span className="text-[9px] text-[#5f6368]">₹{lead.expectedRevenue.toLocaleString()}</span>}
                        </div>
                        {owner && <div className="flex items-center gap-1 mt-1"><Avatar className="h-4 w-4"><AvatarFallback className="text-[6px] bg-[#f1f3f4] text-[#5f6368]">{owner.name?.[0]}</AvatarFallback></Avatar><span className="text-[8px] text-[#9aa0a6]">{owner.name?.split(" ")[0]}</span></div>}
                      </div>
                    );
                  })}
                  {stageLeads.length === 0 && <div className="border-2 border-dashed border-[#e8eaed] rounded-md p-3 text-center"><p className="text-[10px] text-[#9aa0a6]">Drop leads here</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "calendar" ? (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d: any) => (
                <div key={d} className="text-[10px] font-medium text-[#9aa0a6] py-1">{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 2;
                const date = new Date();
                date.setDate(date.getDate() + day);
                const isToday = day === 0;
                const dayStr = date.toDateString();
                const dayLeads = leadsArray.filter((l: any) => l.nextActionDate && new Date(l.nextActionDate).toDateString() === dayStr);
                return (
                  <div key={i} className={`p-1 rounded-md min-h-[60px] text-left ${isToday ? "bg-[#f0f4ff] border border-[#4285f4]/30" : "hover:bg-[#f8f9fa]"}`}>
                    <span className={`text-[10px] font-medium ${isToday ? "text-[#1a73e8]" : "text-[#5f6368]"}`}>{date.getDate()}</span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayLeads.slice(0, 2).map((l: any) => (
                        <div key={l._id} className="text-[8px] bg-[#f1f3f4] rounded px-1 truncate text-[#5f6368] cursor-pointer" onClick={() => navigate(`/crm/leads/${l._id}`)}>
                          {l.firstName}
                        </div>
                      ))}
                      {dayLeads.length > 2 && <div className="text-[7px] text-[#9aa0a6]">+{dayLeads.length - 2} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* TABLE VIEW with tabs */
        <div>
          {/* View Tabs */}
          <div className="flex items-center gap-1 mb-3 overflow-x-auto">
            {[
              { id: "queue", label: "Queue", count: myLeads.length, color: "text-[#1a73e8]" },
              { id: "today", label: "Followups", count: todayFollowups.length, color: "text-[#fbbc04]" },
              { id: "overdue", label: "Overdue", count: overdue.length, color: "text-[#ea4335]" },
              { id: "new", label: "New Leads", count: newLeads.length, color: "text-[#9aa0a6]" },
              { id: "approvals", label: "Approvals", count: pendingApprovals?.length || 0, color: "text-[#a855f7]" },
              { id: "converted", label: "Converted", count: converted.length, color: "text-[#34a853]" },
              { id: "lost", label: "Lost", count: lost.length, color: "text-[#5f6368]" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
                }`}>
                <span>{tab.label}</span>
                <span className={`text-[9px] ${activeTab === tab.id ? "text-white/70" : "text-[#9aa0a6]"}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "queue" && <div><h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">My Active Queue</h3>{renderLeadList(myLeads)}</div>}
          {activeTab === "today" && <div><h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Today's Followups</h3>{renderLeadList(todayFollowups)}</div>}
          {activeTab === "overdue" && <div><h3 className="text-[12px] font-semibold text-[#ea4335] mb-2">Overdue Actions</h3>{renderLeadList(overdue)}</div>}
          {activeTab === "new" && <div><h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">New Leads</h3>{renderLeadList(newLeads)}</div>}
          {activeTab === "converted" && <div><h3 className="text-[12px] font-semibold text-[#34a853] mb-2">Converted Leads</h3>{renderLeadList(converted)}</div>}
          {activeTab === "lost" && <div><h3 className="text-[12px] font-semibold text-[#5f6368] mb-2">Lost Leads</h3>{renderLeadList(lost)}</div>}

          {/* Approvals Tab */}
          {activeTab === "approvals" && (
            <div>
              <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2">Pending Approvals</h3>
              <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-2">
                {!pendingApprovals?.length ? (
                  <div className="text-center py-8"><CheckCircle2 className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" /><p className="text-[12px] text-[#5f6368]">No pending approvals</p></div>
                ) : (
                  pendingApprovals.map((app) => {
                    const lead_ = leadsArray.find((l: any) => l._id === app.leadId);
                    return (
                      <div key={app._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] border-b border-[#f1f3f4] last:border-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-[8px] bg-[#f1f3f4] text-[#5f6368]">{lead_?.firstName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#1a1a2e]">{app.title}</p>
                          <p className="text-[10px] text-[#5f6368]">{app.reason} · ₹{app.amount.toLocaleString()} · {app.type.replace("_", " ")}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#34a853] hover:bg-[#e6f4ea]" onClick={() => handleApprovalDecision(app._id, "approved")}>
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#ea4335] hover:bg-[#fce8e6]" onClick={() => handleApprovalDecision(app._id, "rejected")}>
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]" onClick={() => navigate(`/crm/leads/${app.leadId}`)}>
                            <Target className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Dialog */}
      {assignLeadId && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setAssignLeadId(null)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[300px]" onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Reassign Lead</p>
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>{users?.filter((u: any) => !u.isDisabled).map((u: any) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setAssignLeadId(null)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleAssign} disabled={!assignUserId}>Reassign</Button>
            </div>
          </div>
        </div>
      )}

      {/* Followup Dialog */}
      {showFollowup && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowFollowup(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#1a1a2e]">Schedule Followup</p>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#5f6368]" onClick={() => setShowFollowup(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="space-y-2">
              <Input value={followupAction} onChange={(e) => setFollowupAction(e.target.value)} placeholder="Action (e.g. Call back)" className="h-9 text-[13px]" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className="h-9 text-[13px]" />
                <Select value={followupType} onValueChange={setFollowupType}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem><SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem><SelectItem value="visit">Visit</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowFollowup(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleScheduleFollowup} disabled={!followupAction || !followupDate}>Schedule</Button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Dialog */}
      {showWhatsApp && waLeadId && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowWhatsApp(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <p className="text-[13px] font-semibold text-[#1a1a2e]">Send WhatsApp</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowWhatsApp(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {WHATSAPP_TEMPLATES.map((tmpl) => {
                const lead_ = leadsArray.find((l: any) => l._id === waLeadId);
                return (
                  <button key={tmpl.id} onClick={() => handleWaTemplateChange(tmpl.id, lead_?.firstName || "")}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium ${waTemplate === tmpl.id ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                    {tmpl.label}
                  </button>
                );
              })}
              <button onClick={() => { setWaTemplate("manual"); setWaMessage(""); }}
                className={`px-2 py-1 rounded-md text-[10px] font-medium ${waTemplate === "manual" ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                Manual
              </button>
            </div>
            <textarea
              value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
              className="w-full text-[13px] p-2 border border-[#e8eaed] rounded-md min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]" />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowWhatsApp(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#25D366] hover:bg-[#20BD5A] text-white" onClick={handleSendWhatsApp} disabled={!waMessage}>
                <ExternalLink className="h-3 w-3 mr-1" /> Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerLeadId && (
        <LeadWorkspaceDrawer leadId={drawerLeadId} onClose={() => setDrawerLeadId(null)} onOpenFull={() => { setDrawerLeadId(null); navigate(`/crm/leads/${drawerLeadId}`); }} />
      )}
    </div>
  );
}
