import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Phone, Mail, MapPin, Target, DollarSign, Calendar, User, Clock,
  MessageSquare, FileText, Activity, Plus, Send, Trash2, Loader2, AlertCircle,
  CheckCircle2, XCircle, Edit3, UserPlus, Paperclip, ChevronDown, Sparkles, BarChart3,
  ThumbsUp, ThumbsDown, MessageCircle, ExternalLink, Percent, Receipt, X,
  History, Search, ArrowRight, Layers, BookOpen, RotateCcw, Info, Lock,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import LeadConversionWizard from "@/components/crm/LeadConversionWizard";
import { Doc } from "@/convex/_generated/dataModel";

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

const ACTIVITY_TEMPLATES: Record<string, string> = {
  lead_created: "Lead created",
  stage_changed: "moved the lead to",
  assigned: "assigned the lead to",
  task_created: "created a task:",
  task_completed: "completed a task",
  note_added: "added a note",
  document_added: "uploaded a document",
  followup_scheduled: "scheduled a followup:",
  discount_requested: "requested a discount/waiver",
  discount_approved: "approved a discount/waiver",
  discount_rejected: "rejected a discount/waiver",
  approval_requested: "requested approval:",
  approval_decided: "made an approval decision",
  whatsapp_sent: "sent a WhatsApp message",
  call_made: "made a call to",
  lead_updated: "updated lead details",
};

const WHATSAPP_TEMPLATES = [
  { id: "greeting", label: "Greeting", text: (name: string) => `Hi ${name}! Thank you for your interest in our programs. We'd love to help you with your educational journey. Let us know if you have any questions.` },
  { id: "followup", label: "Followup", text: (name: string) => `Hi ${name}! Just checking in to see if you have any questions about our programs. We're here to help you make the best decision for your future.` },
  { id: "reminder", label: "Reminder", text: (name: string) => `Hi ${name}! This is a gentle reminder about your upcoming appointment with us. Please let us know if you need to reschedule.` },
  { id: "offer", label: "Offer", text: (name: string) => `Hi ${name}! We have a special offer just for you. Get exclusive discounts on our programs when you enrol this week. Contact us for more details!` },
  { id: "approval", label: "Approval", text: (name: string) => `Hi ${name}! Great news! Your discount/waiver request has been approved. Our team will reach out to you with the next steps.` },
  { id: "conversion", label: "Conversion", text: (name: string) => `Hi ${name}! We're excited to have you on board! Please complete your enrollment to secure your spot. Click here to get started.` },
];

export default function LeadWorkspace() {
  const { leadId } = useParams();
  const { navigate } = useAppNavigate();
  const { user } = useAuth();

  const lead = useQuery(api.crm.getLeadById, leadId ? { leadId: leadId as any } : "skip");
  const users = useQuery(api.users.listUsers);
  const branches = useQuery(api.organization.listBranches);
  const verticals = useQuery(api.organization.listVerticals);
  const tasks = useQuery(api.crm.getLeadTasks, leadId ? { leadId: leadId as any } : "skip");
  const notes = useQuery(api.crm.getLeadNotes, leadId ? { leadId: leadId as any } : "skip");
  const activity = useQuery(api.crm.getLeadActivity, leadId ? { leadId: leadId as any } : "skip");
  const callLogsData = useQuery(api.crm.getCallLogs, leadId ? { leadId: leadId as any } : "skip");
  const documents = useQuery(api.crm.getLeadDocuments, leadId ? { leadId: leadId as any } : "skip");
  const discounts = useQuery(api.crm.getLeadDiscounts, leadId ? { leadId: leadId as any } : "skip");
  const whatsAppMsgs = useQuery(api.crm.getLeadWhatsAppMessages, leadId ? { leadId: leadId as any } : "skip");
  const approvals = useQuery(api.crm.getLeadApprovals, leadId ? { leadId: leadId as any } : "skip");
  const leadCourses = useQuery(api.crm.getLeadCourses, leadId ? { leadId: leadId as any } : "skip");
  const allCourses = useQuery(api.crm.listCourses, {});

  const updateLead = useMutation(api.crm.updateLead);
  const updateStage = useMutation(api.crm.updateLeadStage);
  const assignLead = useMutation(api.crm.assignLead);
  const createLeadTask = useMutation(api.crm.createLeadTask);
  const updateLeadTaskStatus = useMutation(api.crm.updateLeadTaskStatus);
  const deleteLeadTask = useMutation(api.crm.deleteLeadTask);
  const addLeadNote = useMutation(api.crm.addLeadNote);
  const deleteLeadNote = useMutation(api.crm.deleteLeadNote);
  const addLeadDocument = useMutation(api.crm.addLeadDocument);
  const deleteLeadDocument = useMutation(api.crm.deleteLeadDocument);
  const createDiscount = useMutation(api.crm.createDiscount);
  const requestDiscountWithApproval = useMutation(api.crm.requestDiscountWithApproval);
  const approveDiscount = useMutation(api.crm.approveDiscount);
  const sendWhatsAppMessage = useMutation(api.crm.sendWhatsAppMessage);
  const logCallActivity = useMutation(api.crm.logCallActivity);
  const createLeadApproval = useMutation(api.crm.createLeadApproval);
  const decideOnApproval = useMutation(api.crm.decideOnApproval);
  const addCourseToLead = useMutation(api.crm.addCourseToLead);
  const removeCourseFromLead = useMutation(api.crm.removeCourseFromLead);
  // Payment mutations/queries
  const payments = useQuery(api.crm.getLeadPayments, leadId ? { leadId: leadId as any } : "skip");
  const addPayment = useMutation(api.crm.addPayment);
  const decideOnVerification = useMutation(api.verification.decideOnVerification);
  // Collection Engine
  const collectionSummary = useQuery(api.collectionEngine.getCollectionSummary, leadId ? { leadId: leadId as any } : "skip");
  const paymentPlans = useQuery(api.collectionEngine.getPaymentPlans, leadId ? { leadId: leadId as any } : "skip");
  const installments = useQuery(api.collectionEngine.getInstallments, leadId ? { leadId: leadId as any } : "skip");
  const leadPDCs = useQuery(api.collectionEngine.getLeadPDCs, leadId ? { leadId: leadId as any } : "skip");
  const leadCommitments = useQuery(api.collectionEngine.getLeadCommitments, leadId ? { leadId: leadId as any } : "skip");
  const createPaymentPlan = useMutation(api.collectionEngine.createPaymentPlan);
  const createPDC = useMutation(api.collectionEngine.createPDC);
  const updatePDCStatus = useMutation(api.collectionEngine.updatePDCStatus);
  const createCommitment = useMutation(api.collectionEngine.createCommitment);
  const updateCommitmentStatus = useMutation(api.collectionEngine.updateCommitmentStatus);
  const markInstallmentPaid = useMutation(api.collectionEngine.markInstallmentPaid);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newNote, setNewNote] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  // Unified Approval Request Modal state
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [armType, setArmType] = useState<"discount" | "waiver" | "scholarship" | "admission" | "special_pricing" | "manual">("discount");
  const [armAmount, setArmAmount] = useState("");
  const [armReason, setArmReason] = useState("");
  const [armMode, setArmMode] = useState<"any_one" | "all_required" | "sequential" | "parallel">("any_one");
  const [armApproverIds, setArmApproverIds] = useState<string[]>([]);
  const [armPriority, setArmPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [armDeadline, setArmDeadline] = useState("");
  const [armSearch, setArmSearch] = useState("");

  // WhatsApp state
  // Call state
  const [showCallOutcome, setShowCallOutcome] = useState(false);
  const [callType, setCallType] = useState("outgoing");
  const [callOutcome, setCallOutcome] = useState("");
  const [callDate, setCallDate] = useState(Date.now());
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [callNotes, setCallNotes] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState<number | undefined>(undefined);
  const [createFollowupTask, setCreateFollowupTask] = useState(false);

  // WhatsApp state
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waTemplate, setWaTemplate] = useState("manual");
  const [waMessage, setWaMessage] = useState("");

  // Payment state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showPDCDialog, setShowPDCDialog] = useState(false);
  const [showCommitmentDialog, setShowCommitmentDialog] = useState(false);
  const [paymentsTab, setPaymentsTab] = useState("overview");
  const [verificationDrawerId, setVerificationDrawerId] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState("overview");

  // Payment plan form
  const [planTotal, setPlanTotal] = useState("");
  const [planCount, setPlanCount] = useState("3");
  const [planFreq, setPlanFreq] = useState<"weekly" | "monthly" | "quarterly" | "custom">("monthly");
  const [planStart, setPlanStart] = useState("");
  const [planGrace, setPlanGrace] = useState("7");
  // PDC form
  const [pdcChequeNo, setPdcChequeNo] = useState("");
  const [pdcBank, setPdcBank] = useState("");
  const [pdcChequeDate, setPdcChequeDate] = useState("");
  const [pdcAmount, setPdcAmount] = useState("");
  const [pdcAttachment, setPdcAttachment] = useState("");
  // Commitment form
  const [cmtAmount, setCmtAmount] = useState("");
  const [cmtDate, setCmtDate] = useState("");
  const [cmtReason, setCmtReason] = useState("");
  const [cmtConfidence, setCmtConfidence] = useState<"low" | "medium" | "high">("medium");

  const verificationDetail = useQuery(
    api.verification.getVerificationWithDecisions,
    verificationDrawerId ? { requestId: verificationDrawerId as any } : "skip"
  );
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showWAPin, setShowWAPin] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "upi" | "bank" | "card" | "cheque" | "online">("cash");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [showConversionWizard, setShowConversionWizard] = useState(false);

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />



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

  const handleStageChange = async (newStageVal: string) => {
    if (!user || newStageVal === lead.stage) return;
    await updateStage({ leadId: lead._id, stage: newStageVal, userId: user._id });
  };

  const handleAssign = async () => {
    if (!assignUserId || !user) return;
    await assignLead({ leadId: lead._id, toUserId: assignUserId as any, userId: user._id });
    setShowAssignDialog(false);
    setAssignUserId("");
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !user) return;
    await createLeadTask({
      leadId: lead._id, title: newTaskTitle,
      assignedTo: newTaskAssignee as any || undefined,
      dueDate: newTaskDue ? new Date(newTaskDue).getTime() : undefined,
      priority: newTaskPriority as any, ownerId: user._id,
    });
    setNewTaskTitle(""); setNewTaskAssignee(""); setNewTaskDue(""); setNewTaskPriority("medium");
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    await addLeadNote({ leadId: lead._id, content: newNote, userId: user._id });
    setNewNote("");
  };

  const handleAddDocument = async () => {
    if (!newDocName || !newDocUrl || !user) return;
    await addLeadDocument({ leadId: lead._id, name: newDocName, url: newDocUrl, userId: user._id });
    setNewDocName(""); setNewDocUrl("");
  };



  const handleAddPayment = async () => {
    if (!payAmount || !user || !lead) return;
    await addPayment({
      leadId: lead._id, amount: parseInt(payAmount) || 0, mode: payMode,
      reference: payReference || undefined, notes: payNotes || undefined, enteredBy: user._id,
    });
    setShowPaymentDialog(false);
    setPayAmount(""); setPayMode("cash"); setPayReference(""); setPayNotes("");
  };

  // Payment state machine — verification actions moved to Approval Center
  // Payments can only be decided in the Verification tab of Approval Center

  // Smart suggestions based on request type + amount routing rules
  const getSmartSuggestions = (type: string, amount: number): string[] => {
    if (!users) return [];
    if (amount <= 0) return [];
    let suggestedRole = "";
    if (type === "waiver") {
      suggestedRole = amount <= 10000 ? "admin" : "super_admin";
    } else {
      // Discount, scholarship, etc.
      if (amount <= 5000) suggestedRole = "manager";
      else if (amount <= 20000) suggestedRole = "admin";
      else suggestedRole = "super_admin";
    }
    return users.filter((u) => u.role === suggestedRole && !u.isDisabled).map((u) => u._id).slice(0, 3);
  };

  const handleCreateApprovalWithModal = async () => {
    if (!armAmount || !armReason || armApproverIds.length === 0 || !user || !lead) return;
    const amount = parseInt(armAmount) || 0;
    
    // For discount/waiver types, use requestDiscountWithApproval (creates discount + approval)
    if (armType === "discount" || armType === "waiver" || armType === "scholarship") {
      await requestDiscountWithApproval({
        leadId: lead._id,
        category: armType as any,
        amount,
        reason: armReason,
        standardAmount: lead.standardAmount || lead.expectedRevenue || undefined,
        requestedBy: user._id,
      });
    } else {
      // For other types, create approval directly
      const title = `${armType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} Request — ${lead.firstName} ${lead.lastName}`;
      await createLeadApproval({
        leadId: lead._id,
        title,
        type: armType as any,
        amount,
        reason: armReason,
        approverIds: armApproverIds as any,
        mode: armMode,
        priority: armPriority,
        deadline: armDeadline ? new Date(armDeadline).getTime() : undefined,
        requestedBy: user._id,
      });
    }
    
    setShowApprovalRequestModal(false);
    setArmAmount("");
    setArmReason("");
    setArmApproverIds([]);
    setArmSearch("");
  };

  const handleSendWhatsApp = async () => {
    if (!waMessage || !user) return;
    // Priority 1: WhatsApp Username, Priority 2: Phone
    const identifier = lead.whatsappUsername || (lead.phone || "").replace(/[^0-9]/g, "");
    const isEmail = identifier.includes("@");
    const url = isEmail
      ? `https://wa.me/?text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/91${identifier}?text=${encodeURIComponent(waMessage)}`;
    await sendWhatsAppMessage({
      leadId: lead._id, message: waMessage, whatsappUrl: url,
      template: waTemplate === "manual" ? undefined : waTemplate as any,
      sentBy: user._id,
    });
    window.open(url, "_blank");
    setShowWhatsApp(false);
    setWaMessage("");
  };

  const handleWaTemplateChange = (tmplId: string) => {
    setWaTemplate(tmplId);
    const tmpl = WHATSAPP_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) setWaMessage(tmpl.text(lead.firstName));
    else setWaMessage("");
  };



  const handleOpenCallLog = () => {
    setCallType("outgoing");
    setCallOutcome("");
    setCallDate(Date.now());
    setDurationMinutes(0);
    setDurationSeconds(0);
    setCallNotes("");
    setNextFollowupDate(undefined);
    setCreateFollowupTask(false);
    setShowCallOutcome(true);
  };

  const handleInitiateCall = () => {
    if (!lead.phone || !user) return;
    window.open(`tel:${lead.phone.replace(/[^0-9]/g, "")}`, "_self");
    setTimeout(() => {
      setCallType("outgoing");
      setCallOutcome("");
      setCallDate(Date.now());
      setDurationMinutes(0);
      setDurationSeconds(0);
      setCallNotes("");
      setNextFollowupDate(undefined);
      setCreateFollowupTask(false);
      setShowCallOutcome(true);
    }, 500);
  };

  const handleSaveCallOutcome = async () => {
    if (!callOutcome || !user || !lead) return;
    await logCallActivity({
      leadId: lead._id,
      callType,
      outcome: callOutcome,
      callDate,
      durationMinutes: durationMinutes || undefined,
      durationSeconds: durationSeconds || undefined,
      notes: callNotes || undefined,
      followupDate: nextFollowupDate,
      createFollowupTask,
      userId: user._id,
    });
    setShowCallOutcome(false);
    setCallType("outgoing");
    setCallOutcome("");
    setCallDate(Date.now());
    setDurationMinutes(0);
    setDurationSeconds(0);
    setCallNotes("");
    setNextFollowupDate(undefined);
    setCreateFollowupTask(false);
  };

  const handleApprovalDecision = async (approvalId: string, decision: "approved" | "rejected" | "returned") => {
    if (!user) return;
    await decideOnApproval({ approvalId: approvalId as any, userId: user._id, decision });
  };

  const getInitials = (name?: string) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const renderActivityItem = (a: Doc<"leadActivity">, idx: number, total: number) => {
    const actionUser = users?.find((u) => u._id === a.userId);
    const template = ACTIVITY_TEMPLATES[a.action] || a.action.replace(/_/g, " ");
    let displayText = a.description;
    // Make timeline human-readable
    if (a.action === "stage_changed") {
      displayText = `${actionUser?.name || "User"} moved lead to ${a.description.replace("moved to ", "")}`;
    } else if (a.action === "assigned") {
      displayText = `${actionUser?.name || "User"} ${a.description}`;
    } else if (a.action === "task_created") {
      displayText = `${actionUser?.name || "User"} ${template}: ${a.description.replace("task created: ", "")}`;
    } else if (a.action === "note_added") {
      displayText = `${actionUser?.name || "User"} ${template}`;
    } else if (a.action === "lead_created") {
      displayText = `${a.description}`;
    } else {
      displayText = `${actionUser?.name || "User"} ${template}${a.description ? ` ${a.description}` : ""}`;
    }

    const iconMap: Record<string, React.ElementType> = {
      lead_created: Sparkles, stage_changed: ArrowLeft, assigned: UserPlus,
      task_created: CheckCircle2, task_completed: CheckCircle2, note_added: FileText,
      document_added: Paperclip, followup_scheduled: Clock, discount_requested: Percent,
      discount_approved: CheckCircle2, discount_rejected: XCircle,
      approval_requested: ThumbsUp, approval_decided: CheckCircle2,
      whatsapp_sent: MessageCircle, call_made: Phone, lead_updated: Edit3,
    };
    const Icon = iconMap[a.action] || Activity;

    return (
      <div key={a._id} className="flex gap-3 pb-3 relative">
        {idx < total - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#e8eaed]" />}
        <div className="w-6 h-6 rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0">
          <Icon className="h-3 w-3 text-[#5f6368]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#5f6368]">{displayText}</p>
          <p className="text-[9px] text-[#9aa0a6] mt-0.5">
            {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>


    </div>
  );
};

  return (
    <div className="space-y-0">
      {/* Back */}
      <button onClick={() => navigate("/crm/leads")}
        className="flex items-center gap-1 text-[12px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Lead Database
      </button>

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#e8eaed] -mx-6 px-6 pt-2 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-[12px] bg-[#1a1a2e] text-white">{(lead.firstName || lead.firstName || "?")[0]}{(lead.lastName || "")[0] || "?"}
</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-[#1a1a2e] truncate">{lead.firstName} {lead.lastName}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge className={`text-[10px] px-1.5 py-0 h-4 ${stageColors[lead.stage]} text-white`}>
                  {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.label || lead.stage}
                </Badge>
                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${priorityColors[lead.priority]}`}>{lead.priority}</Badge>
                <span className="text-[10px] text-[#9aa0a6]">{owner?.name || "Unassigned"}</span>
                <span className="text-[10px] text-[#9aa0a6]">· {branch?.name || "—"}</span>
                {lead.standardAmount ? <span className="text-[10px] font-medium text-[#1a1a2e]">₹{lead.standardAmount.toLocaleString()}</span> : null}
                <span className="text-[9px] text-[#9aa0a6]">ID: #{lead._id.slice(-6)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Select value={lead.stage} onValueChange={handleStageChange} disabled={lead.status === "converted"}>
              <SelectTrigger className="h-8 text-[10px] w-[130px] border-[#e8eaed]">
                <SelectValue placeholder="Move stage" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={s.id === "converted" && lead.status !== "converted"}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#34a853] text-[#34a853] hover:bg-[#e6f4ea]"
              onClick={handleInitiateCall}
              disabled={!lead.phone}
              title={lead.phone ? `Call ${lead.phone}` : "No phone number"}>
              <Phone className="h-3 w-3 mr-1" /> Call
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]"
              onClick={() => { setShowWhatsApp(true); handleWaTemplateChange("followup"); }}>
              <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]"
              onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="h-3 w-3 mr-1" /> Assign
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]"
              onClick={() => { setArmType("discount"); setArmAmount(""); setArmReason(""); setArmMode("any_one"); setArmApproverIds([]); setArmPriority("medium"); setArmDeadline(""); setShowApprovalRequestModal(true); }}>
              <Percent className="h-3 w-3 mr-1" /> Discount
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]"
              onClick={handleCreateTask}>
              <Plus className="h-3 w-3 mr-1" /> Task
            </Button>

          </div>
        </div>

        {/* Pipeline progress bar */}
        <div className="flex items-center gap-0.5">
          {PIPELINE_STAGES.slice(0, 8).map((stage, idx) => (
            <div key={stage.id} className="flex-1 flex items-center">
              <div className={`h-1.5 rounded-full flex-1 transition-all ${idx <= currentStageIndex ? stage.color : "bg-[#f1f3f4]"} ${idx === currentStageIndex ? "h-2" : ""}`} />
              {idx < 7 && <div className={`w-0.5 h-1 ${idx < currentStageIndex ? stage.color : "bg-[#f1f3f4]"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-4">
          <TabsList className="bg-[#f1f3f4] p-0.5 sticky top-[108px] z-10">
            <TabsTrigger value="overview" className="text-[11px] data-[state=active]:bg-white px-2.5">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[11px] data-[state=active]:bg-white px-2.5">Timeline</TabsTrigger>
            <TabsTrigger value="tasks" className="text-[11px] data-[state=active]:bg-white px-2.5">Tasks</TabsTrigger>
            <TabsTrigger value="communication" className="text-[11px] data-[state=active]:bg-white px-2.5">Communication</TabsTrigger>
            <TabsTrigger value="call_logs" className="text-[11px] data-[state=active]:bg-white px-2.5">Call Logs</TabsTrigger>
            <TabsTrigger value="courses" className="text-[11px] data-[state=active]:bg-white px-2.5">Courses</TabsTrigger>
            <TabsTrigger value="approvals" className="text-[11px] data-[state=active]:bg-white px-2.5">Approvals</TabsTrigger>
            <TabsTrigger value="fees" className="text-[11px] data-[state=active]:bg-white px-2.5">Fees</TabsTrigger>
            <TabsTrigger value="payments" className="text-[11px] data-[state=active]:bg-white px-2.5">Payments</TabsTrigger>
            <TabsTrigger value="documents" className="text-[11px] data-[state=active]:bg-white px-2.5">Documents</TabsTrigger>
            <TabsTrigger value="analytics" className="text-[11px] data-[state=active]:bg-white px-2.5">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Contact Info</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><Phone className="h-3.5 w-3.5" /> Phone</div>
                    <Input value={lead.phone} onChange={(e) => handleUpdateField("phone", e.target.value)} className="h-7 text-[12px] w-[200px] border-[#e8eaed]" />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><Mail className="h-3.5 w-3.5" /> Email</div>
                    <Input value={lead.email || ""} onChange={(e) => handleUpdateField("email", e.target.value)} className="h-7 text-[12px] w-[200px] border-[#e8eaed]" placeholder="No email" />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><MapPin className="h-3.5 w-3.5" /> Location</div>
                    <Input value={lead.location || ""} onChange={(e) => handleUpdateField("location", e.target.value)} className="h-7 text-[12px] w-[200px] border-[#e8eaed]" placeholder="Not set" />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</div>
                    <Input value={lead.whatsappUsername || ""} onChange={(e) => handleUpdateField("whatsappUsername", e.target.value)} className="h-7 text-[12px] w-[200px] border-[#e8eaed]" placeholder="No WhatsApp" />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <div className="flex items-center gap-2 text-[12px] text-[#5f6368]"><Lock className="h-3.5 w-3.5" /> WA PIN</div>
                    <div className="flex items-center gap-1">
                      <Input value={lead.whatsappPin || ""} onChange={(e) => handleUpdateField("whatsappPin", e.target.value)} className="h-7 text-[12px] w-[140px] border-[#e8eaed]" placeholder="No PIN" type={showWAPin ? "text" : "password"} />
                      <button onClick={() => setShowWAPin(!showWAPin)} className="text-[10px] text-[#5f6368] hover:text-[#1a1a2e] px-1.5 py-1 rounded border border-[#e8eaed] hover:bg-[#f8f9fa] transition-colors whitespace-nowrap">{showWAPin ? "Hide" : "Show"}</button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Qualification & Interest</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Vertical</span>
                    <Select value={lead.verticalId || ""} onValueChange={(v) => handleUpdateField("verticalId", v)}>
                      <SelectTrigger className="h-7 text-[11px] w-[160px] border-[#e8eaed]"><SelectValue placeholder="Not set" /></SelectTrigger>
                      <SelectContent>{verticals?.map((v) => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Branch Interest</span>
                    <Select value={lead.branchInterestId || ""} onValueChange={(v) => handleUpdateField("branchInterestId", v)}>
                      <SelectTrigger className="h-7 text-[11px] w-[160px] border-[#e8eaed]"><SelectValue placeholder="Not set" /></SelectTrigger>
                      <SelectContent>{branches?.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] text-[#5f6368]">Course Interest</span>
                    <Input value={lead.courseInterest || ""} onChange={(e) => handleUpdateField("courseInterest", e.target.value)} className="h-7 text-[12px] w-[160px] border-[#e8eaed]" placeholder="Not set" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Sales Info</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Owner</span>
                    <span className="text-[12px] font-medium text-[#1a1a2e]">{owner?.name || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Priority</span>
                    <Select value={lead.priority} onValueChange={(v) => handleUpdateField("priority", v)}>
                      <SelectTrigger className="h-7 text-[11px] w-[120px] border-[#e8eaed]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Probability</span>
                    <Input value={lead.probability || ""} onChange={(e) => handleUpdateField("probability", parseInt(e.target.value) || undefined)} className="h-7 text-[12px] w-[120px] border-[#e8eaed]" placeholder="%" type="number" />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] text-[#5f6368]">Source</span>
                    <span className="text-[12px] font-medium text-[#1a1a2e]">{lead.source || "Unknown"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Next Action</CardTitle></CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Action</span>
                    <Input value={lead.nextAction || ""} onChange={(e) => handleUpdateField("nextAction", e.target.value)} className="h-7 text-[12px] w-[200px] border-[#e8eaed]" placeholder="What's next?" />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] text-[#5f6368]">Due</span>
                    <Input type="date" value={lead.nextActionDate ? new Date(lead.nextActionDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => handleUpdateField("nextActionDate", e.target.value ? new Date(e.target.value).getTime() : undefined)}
                      className="h-7 text-[12px] w-[160px] border-[#e8eaed]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                {!activity?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-6">No activity recorded yet</p>
                ) : (
                  <div className="space-y-0">
                    {activity.map((a, idx) => renderActivityItem(a, idx, activity.length))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Lead Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="New task..." className="h-8 text-[12px] flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }} />
                  <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger className="h-8 text-[11px] w-[120px] border-[#e8eaed]"><SelectValue placeholder="Assignee" /></SelectTrigger>
                    <SelectContent>{users?.filter((u) => !u.isDisabled).map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="h-8 text-[11px] w-[140px]" />
                  <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleCreateTask} disabled={!newTaskTitle}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {!tasks?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-4">No tasks</p>
                ) : (
                  <div className="space-y-1">
                    {tasks.map((t) => {
                      const tAssignee = users?.find((u) => u._id === t.assignedTo);
                      const isOverdue = t.dueDate && t.dueDate < Date.now() && t.status !== "completed";
                      return (
                        <div key={t._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] group">
                          <button onClick={() => updateLeadTaskStatus({ taskId: t._id, status: t.status === "completed" ? "pending" : "completed", userId: user?._id })}
                            className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${t.status === "completed" ? "bg-[#34a853] border-[#34a853]" : "border-[#9aa0a6] hover:border-[#1a73e8]"}`}>
                            {t.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] ${t.status === "completed" ? "line-through text-[#9aa0a6]" : "text-[#1a1a2e]"}`}>{t.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {tAssignee && <span className="flex items-center gap-0.5 text-[10px] text-[#9aa0a6]"><User className="h-2.5 w-2.5" />{tAssignee.name}</span>}
                              {t.dueDate && <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? "text-[#ea4335]" : "text-[#9aa0a6]"}`}><Calendar className="h-2.5 w-2.5" />{new Date(t.dueDate).toLocaleDateString()}{isOverdue && " (Overdue)"}</span>}
                              <Badge className={`text-[8px] px-1 py-0 h-3 ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#9aa0a6] hover:text-[#ea4335] opacity-0 group-hover:opacity-100"
                            onClick={() => deleteLeadTask({ taskId: t._id })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication */}
          <TabsContent value="communication">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Communication Log</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"
                  onClick={() => { setWaTemplate("manual"); setWaMessage(`Hi ${lead.firstName}! `); setShowWhatsApp(true); }}>
                  <MessageCircle className="h-3 w-3 mr-1" /> Send WhatsApp
                </Button>
              </CardHeader>
              <CardContent>
                {/* WhatsApp section */}
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase mb-2">WhatsApp Templates</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {WHATSAPP_TEMPLATES.map((tmpl) => (
                      <button key={tmpl.id} onClick={() => handleWaTemplateChange(tmpl.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${waTemplate === tmpl.id ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"}`}>
                        {tmpl.label}
                      </button>
                    ))}
                    <button onClick={() => { setWaTemplate("manual"); setWaMessage(""); }}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${waTemplate === "manual" ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"}`}>
                      Manual
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
                      className="h-8 text-[12px] flex-1" placeholder="Type your message..." />
                    <Button size="sm" className="h-8 text-[11px] bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      onClick={handleSendWhatsApp} disabled={!waMessage}>
                      <ExternalLink className="h-3 w-3 mr-1" /> Open WhatsApp
                    </Button>
                  </div>
                </div>

                <Separator className="mb-3" />

                <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase mb-2">Message History</h3>
                {!whatsAppMsgs?.length && !activity?.filter((a) => ["whatsapp_sent", "note_added", "task_created"].includes(a.action))?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-4">No communication history</p>
                ) : (
                  <div className="space-y-0 max-h-[400px] overflow-y-auto">
                    {[...(whatsAppMsgs || []), ...(activity || []).filter((a) => ["whatsapp_sent", "note_added"].includes(a.action))]
                      .sort((a: any, b: any) => b.createdAt - a.createdAt)
                      .slice(0, 20)
                      .map((item: any) => {
                        const isWA = "whatsappUrl" in item;
                        const user_ = users?.find((u) => u._id === (isWA ? item.sentBy : item.userId));
                        return (
                          <div key={item._id} className="flex gap-2 pb-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isWA ? "bg-[#e8f5e9]" : "bg-[#f1f3f4]"}`}>
                              {isWA ? <MessageCircle className="h-2.5 w-2.5 text-[#25D366]" /> : <FileText className="h-2.5 w-2.5 text-[#5f6368]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-[#1a1a2e]">{user_?.name || "System"}</span>
                                <span className="text-[8px] text-[#9aa0a6]">{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}</span>
                              </div>
                              <p className="text-[11px] text-[#5f6368]">{isWA ? item.message : item.content || item.description}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Logs */}
          <TabsContent value="call_logs">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Call Logs</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#9aa0a6]">
                    <Phone className="h-3 w-3" />
                    <span>{(activity || []).filter((a: any) => a.action === "call_made").length} calls</span>
                  </div>
                  <Button size="sm" className="h-7 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                    onClick={handleOpenCallLog}>
                    <Phone className="h-3 w-3 mr-1" /> Log Call
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const callLogs = (activity || []).filter((a: any) => a.action === "call_made").sort((a: any, b: any) => b.createdAt - a.createdAt);
                  const outcomeLabels: Record<string, { label: string, emoji: string }> = {
                    connected: { label: "Connected", emoji: "✅" },
                    no_answer: { label: "No Answer", emoji: "📞" },
                    busy: { label: "Busy", emoji: "⏳" },
                    wrong_number: { label: "Wrong Number", emoji: "❌" },
                    callback_needed: { label: "Callback Needed", emoji: "🔄" },
                    converted: { label: "Converted", emoji: "🎉" },
                  };
                  if (!callLogs.length) {
                    return (
                      <div className="text-center py-8">
                        <Phone className="h-10 w-10 text-[#9aa0a6] mx-auto mb-2" />
                        <p className="text-[12px] text-[#9aa0a6]">No call logs yet. Click "Log Call" to record a call.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-[#e8eaed]">
                            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase px-2 py-2 whitespace-nowrap">Type</th>
                            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase px-2 py-2 whitespace-nowrap">Outcome</th>
                            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase px-2 py-2 whitespace-nowrap">Duration</th>
                            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase px-2 py-2 whitespace-nowrap">Notes</th>
                            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase px-2 py-2 whitespace-nowrap">By</th>
                            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase px-2 py-2 whitespace-nowrap">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const activityLogs = (activity || []).filter((a: any) => a.action === "call_made");
                            const richLogs = (callLogsData || []);
                            const mergedMap = new Map<string, any>();
                            for (const rl of richLogs) {
                              mergedMap.set(rl._id, rl);
                            }
                            const merged = activityLogs.map((al: any) => {
                              const rich = mergedMap.get(al._id);
                              return rich ? { ...al, callType: rich.callType, durationMinutes: rich.durationMinutes, durationSeconds: rich.durationSeconds } : al;
                            });
                            return merged.sort((a: any, b: any) => b.createdAt - a.createdAt).map((log: any) => {
                              const caller = users?.find((u) => u._id === log.userId);
                              const outcome = outcomeLabels[log.description] || { label: log.description, emoji: "📞" };
                              const callTypeLabels: Record<string, string> = { outgoing: "📤 Outgoing", incoming: "📥 Incoming", missed: "📵 Missed" };
                              const callTypeLabel = callTypeLabels[log.callType] || "📞";
                              const durStr = log.durationMinutes != null || log.durationSeconds != null
                                ? `${log.durationMinutes || 0}m ${log.durationSeconds || 0}s`
                                : "—";
                              return (
                                <tr key={log._id} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368]">{callTypeLabel}</td>
                                  <td className="px-2 py-2"><span className="text-[11px]">{outcome.emoji} {outcome.label}</span></td>
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368]">{durStr}</td>
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368] max-w-[160px] truncate">{log.content || log.notes || "—"}</td>
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368]">{caller?.name || "Unknown"}</td>
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368] whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

      {/* Call Outcome Dialog */}
      <Dialog open={showCallOutcome} onOpenChange={setShowCallOutcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Log Call</DialogTitle>
            <DialogDescription className="text-[11px]">
              Record conversation details and next action for {lead.firstName} {lead.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Section 1 — Call Details */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider">Call Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#5f6368] mb-1 block">Call Type</label>
                  <select
                    value={callType}
                    onChange={(e) => setCallType(e.target.value)}
                    className="w-full h-8 text-[12px] px-2 rounded-md border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
                  >
                    <option value="outgoing">Outgoing</option>
                    <option value="incoming">Incoming</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5f6368] mb-1 block">Outcome</label>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full h-8 text-[12px] px-2 rounded-md border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
                  >
                    <option value="">Select outcome</option>
                    <option value="connected">Connected</option>
                    <option value="busy">Busy</option>
                    <option value="no_answer">No Answer</option>
                    <option value="wrong_number">Wrong Number</option>
                    <option value="callback_needed">Callback Needed</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block">Call Date & Time</label>
                <Input
                  type="datetime-local"
                  value={(() => {
                    const d = new Date(callDate);
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  })()}
                  onChange={(e) => setCallDate(new Date(e.target.value).getTime())}
                  className="h-8 text-[12px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-[10px] text-[#5f6368] mb-1 block">Minutes</label>
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={durationMinutes || ""}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="h-8 text-[12px]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#5f6368] mb-1 block">Seconds</label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationSeconds || ""}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                    className="h-8 text-[12px]"
                    placeholder="0"
                  />
                </div>
                <div className="pb-1">
                  <p className="text-[10px] text-[#9aa0a6]">Total</p>
                  <p className="text-[12px] font-medium text-[#1a1a2e]">{durationMinutes || 0}m {durationSeconds || 0}s</p>
                </div>
              </div>
            </div>

            {/* Section 2 — Notes */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider">Notes</p>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Conversation summary, parent concerns, next action..."
                className="w-full min-h-[60px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
                rows={3}
              />
            </div>

            {/* Section 3 — Followup */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider">Follow-up</p>
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block">Follow-up Date (optional)</label>
                <Input
                  type="date"
                  value={nextFollowupDate ? new Date(nextFollowupDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => setNextFollowupDate(e.target.value ? new Date(e.target.value).getTime() : undefined)}
                  className="h-8 text-[12px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFollowupTask}
                    onChange={(e) => setCreateFollowupTask(e.target.checked)}
                    className="w-4 h-4 rounded border-[#e8eaed] accent-[#1a1a2e]"
                  />
                  <span className="text-[11px] text-[#5f6368]">Create follow-up task</span>
                </label>
              </div>
              {createFollowupTask && (
                <div className="p-2.5 rounded-lg bg-[#f8f9fa]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#1a1a2e]">Follow-up — {lead.firstName} {lead.lastName}</span>
                    <span className="text-[9px] text-[#9aa0a6]">High priority</span>
                  </div>
                  {nextFollowupDate && (
                    <p className="text-[10px] text-[#5f6368] mt-0.5">
                      Due: {new Date(nextFollowupDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] border-[#e8eaed]"
              onClick={() => {
                setShowCallOutcome(false);
                setCallType("outgoing");
                setCallOutcome("");
                setCallDate(Date.now());
                setDurationMinutes(0);
                setDurationSeconds(0);
                setCallNotes("");
                setNextFollowupDate(undefined);
                setCreateFollowupTask(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
              disabled={!callOutcome}
              onClick={handleSaveCallOutcome}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses */}
          <TabsContent value="courses">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Enrolled Courses</CardTitle>
                <Button size="sm" className="h-7 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  onClick={() => setShowCourseDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Course
                </Button>
              </CardHeader>
              <CardContent>
                {!leadCourses?.length ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                    <p className="text-[12px] text-[#9aa0a6]">No courses enrolled. Click "Add Course" to link courses.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leadCourses.map((course: any) => (
                      <div key={course._id} className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9fa] group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#1a1a2e]/10 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-[#1a1a2e]" />
                          </div>
                          <div>
                            <p className="text-[12px] font-medium text-[#1a1a2e]">{course.courseName}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#9aa0a6]">{course.courseCode}</span>
                              <span className="text-[10px] font-medium text-[#34a853]">₹{course.baseFee.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335] opacity-0 group-hover:opacity-100"
                          onClick={async () => {
                            if (!user) return;
                            await removeCourseFromLead({ leadId: lead._id, courseId: course._id, removedBy: user._id });
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {/* Total */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#e6f4ea] mt-2">
                      <span className="text-[12px] font-semibold text-[#34a853]">Combined Fee</span>
                      <span className="text-base font-semibold text-[#34a853]">
                        ₹{(leadCourses || []).reduce((s: number, c: any) => s + (c.baseFee || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals */}
          <TabsContent value="approvals">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Approvals</CardTitle>
                <Button size="sm" className="h-7 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  onClick={() => { setArmType("discount"); setArmAmount(""); setArmReason(""); setArmMode("sequential"); setArmApproverIds([]); setArmPriority("medium"); setArmDeadline(""); setShowApprovalRequestModal(true); }}>
                  <Plus className="h-3 w-3 mr-1" /> New Request
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {!approvals?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-4">No approvals requested</p>
                ) : (
                  approvals.map((app) => {
                    const requester = users?.find((u) => u._id === app.requestedBy);
                    const statusColor = { pending: "bg-[#fbbc04] text-[#1a1a2e]", approved: "bg-[#34a853] text-white", rejected: "bg-[#ea4335] text-white", returned: "bg-[#9aa0a6] text-white" }[app.status] || "bg-[#f1f3f4] text-[#5f6368]";
                    const isPending = app.status === "pending";
                    const canDecide = user && app.approverIds.includes(user._id as any);
                    return (
                      <div key={app._id} className="p-3 rounded-lg bg-[#f8f9fa]">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-semibold text-[#1a1a2e]">{app.title}</span>
                              <Badge className={`text-[8px] px-1 py-0 h-3.5 ${statusColor}`}>{app.status}</Badge>
                            </div>
                            <p className="text-[11px] text-[#5f6368] capitalize">{app.type.replace("_", " ")} · ₹{app.amount.toLocaleString()}</p>
                            <p className="text-[11px] text-[#5f6368]">{app.reason}</p>
                            <div className="flex items-center gap-2 mt-1 text-[9px] text-[#9aa0a6]">
                              <span>{requester?.name || "Unknown"}</span>
                              <span>· {app.mode.replace("_", " ")}</span>
                              <span>· {new Date(app.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {isPending && canDecide && (
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#34a853] hover:bg-[#e6f4ea]"
                                onClick={() => handleApprovalDecision(app._id, "approved")}>
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#ea4335] hover:bg-[#fce8e6]"
                                onClick={() => handleApprovalDecision(app._id, "rejected")}>
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#fbbc04] hover:bg-[#fef7e0]"
                                onClick={() => handleApprovalDecision(app._id, "returned")}>
                                <AlertCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {app.deadline && (
                          <div className="mt-1 text-[9px] text-[#ea4335]">Deadline: {new Date(app.deadline).toLocaleDateString()}</div>      )}



    </div>
  );
}
)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees — Pure Calculator */}
          <TabsContent value="fees">
            <div className="space-y-4">
              {/* Fee Calculator Card */}
              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Fee Calculator</CardTitle>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"
                      onClick={() => { setArmType("discount"); setArmAmount(""); setArmReason(""); setArmMode("any_one"); setArmApproverIds([]); setArmPriority("medium"); setArmDeadline(""); setShowApprovalRequestModal(true); }}>
                      <Percent className="h-3 w-3 mr-1" /> Request Discount
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"
                      onClick={() => { setArmType("waiver"); setArmAmount(""); setArmReason(""); setArmMode("any_one"); setArmApproverIds([]); setArmPriority("medium"); setArmDeadline(""); setShowApprovalRequestModal(true); }}>
                      <Receipt className="h-3 w-3 mr-1" /> Request Waiver
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]"
                      onClick={() => setActiveMainTab("approvals")}>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {(approvals || []).filter((a) => a.status === "pending").length > 0 ? `${(approvals || []).filter((a) => a.status === "pending").length} Pending` : "View Requests"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Formula Display */}
                  <div className="flex items-center gap-2 text-[10px] text-[#5f6368] bg-[#f8f9fa] p-2.5 rounded-md">
                    <span className="font-semibold text-[#1a1a2e]">Net Payable</span>
                    <span>=</span>
                    <span>Base Fee</span>
                    <span className="text-[#ea4335]">− Approved Discount</span>
                    <span className="text-[#e8710a]">− Approved Waiver</span>
                  </div>

                  {/* Calculator-style rows */}
                  <div className="space-y-2">
                    {/* Course Breakdown */}
                    {(leadCourses || []).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-[#f8f9fa]">
                        <p className="text-[9px] font-semibold text-[#9aa0a6] uppercase mb-1.5">Enrolled Courses</p>
                        <div className="space-y-1">
                          {(leadCourses || []).map((course: any) => (
                            <div key={course._id} className="flex items-center justify-between text-[11px]">
                              <span className="text-[#5f6368]">{course.courseName}</span>
                              <span className="font-medium text-[#1a1a2e]">₹{course.baseFee.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#e8eaed]">
                            <span className="font-semibold text-[#1a1a2e]">Total</span>
                            <span className="font-semibold text-[#34a853]">₹{(leadCourses || []).reduce((s: number, c: any) => s + (c.baseFee || 0), 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Base Fee — editable (only if no courses enrolled) */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#f8f9fa]">
                      <span className="text-[12px] font-medium text-[#1a1a2e]">
                        {(leadCourses || []).length > 0 ? "Total Course Fee" : "Base Fee"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#9aa0a6]">₹</span>
                        {(leadCourses || []).length > 0 ? (
                          <span className="text-[13px] font-semibold text-right w-[140px] block">
                            {(leadCourses || []).reduce((s: number, c: any) => s + (c.baseFee || 0), 0).toLocaleString()}
                          </span>
                        ) : (
                          <Input
                            value={lead.standardAmount || ""}
                            onChange={(e) => handleUpdateField("standardAmount", parseInt(e.target.value) || undefined)}
                            className="h-8 text-[13px] font-semibold w-[140px] text-right border-[#e8eaed]"
                            type="number"
                            placeholder="0"
                          />
                        )}
                      </div>
                    </div>

                    {/* Approved Discount — readonly */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#fce8e6]">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[#ea4335]">Approved Discount</span>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const pendingDiscounts = (discounts || []).filter((d) => d.category !== "waiver" && d.status === "pending");
                            const pendingAmount = pendingDiscounts.reduce((s, d) => s + d.amount, 0);
                            return pendingAmount > 0 ? (
                              <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#fbbc04] text-[#1a1a2e]">
                                {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString()} pending` : ""}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#ea4335] line-through">
                          {(() => {
                            const pendingDisc = (discounts || []).filter((d) => d.category !== "waiver" && d.status === "pending").reduce((s, d) => s + d.amount, 0);
                            return pendingDisc > 0 ? `₹${pendingDisc.toLocaleString()}` : "";
                          })()}
                        </span>
                        <span className="text-lg font-semibold text-[#ea4335]">- ₹{(lead.discountAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Approved Waiver — readonly */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#fef7e0]">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[#e8710a]">Approved Waiver</span>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const pendingWaivers = (discounts || []).filter((d) => d.category === "waiver" && d.status === "pending");
                            const pendingAmount = pendingWaivers.reduce((s, d) => s + d.amount, 0);
                            return pendingAmount > 0 ? (
                              <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#fbbc04] text-[#1a1a2e]">
                                ₹{pendingAmount.toLocaleString()} pending
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#e8710a] line-through">
                          {(() => {
                            const pendingWaiv = (discounts || []).filter((d) => d.category === "waiver" && d.status === "pending").reduce((s, d) => s + d.amount, 0);
                            return pendingWaiv > 0 ? `₹${pendingWaiv.toLocaleString()}` : "";
                          })()}
                        </span>
                        <span className="text-lg font-semibold text-[#e8710a]">- ₹{(lead.waiverAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Net Payable — calculated */}
                    <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-[#e6f4ea] border-2 border-[#34a853]/20">
                      <span className="text-[13px] font-bold text-[#34a853]">Net Payable</span>
                      <span className="text-xl font-bold text-[#34a853]">₹{(lead.finalPayable || lead.standardAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Fee Summary Card */}
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#f8f9fa]">
                    {(() => {
                      const verifiedTotal = (payments || []).filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
                      const pendingTotal = (payments || []).filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
                      const netPayable = lead.finalPayable || lead.standardAmount || 0;
                      const balance = Math.max(0, netPayable - verifiedTotal);
                      return (
                        <>
                          <div className="text-center">
                            <p className="text-[10px] text-[#34a853]">Paid</p>
                            <p className="text-base font-semibold text-[#34a853] mt-1">₹{verifiedTotal.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-[#e8710a]">Pending</p>
                            <p className="text-base font-semibold text-[#e8710a] mt-1">₹{pendingTotal.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-[#5f6368]">Balance</p>
                            <p className="text-base font-semibold text-[#1a1a2e] mt-1">₹{balance.toLocaleString()}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Discount & Waiver History */}
                  <div>
                    <h3 className="text-[11px] font-semibold text-[#9aa0a6] uppercase mb-2">Discount & Waiver History</h3>
                    {!discounts?.length ? (
                      <p className="text-[12px] text-[#9aa0a6] text-center py-3">No discounts or waivers applied</p>
                    ) : (
                      <div className="space-y-1">
                        {discounts.map((d) => (
                          <div key={d._id} className="flex items-center justify-between p-2 rounded-md bg-[#f8f9fa]">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${d.status === "approved" ? "bg-[#34a853]" : d.status === "pending" ? "bg-[#fbbc04]" : "bg-[#9aa0a6]"}`} />
                              <div>
                                <p className="text-[12px] font-medium text-[#1a1a2e] capitalize">{d.category} — ₹{d.amount.toLocaleString()}{d.percentage ? ` (${d.percentage}%)` : ""}</p>
                                <p className="text-[10px] text-[#5f6368]">{d.reason}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`text-[8px] px-1 py-0 h-3.5 ${d.status === "approved" ? "bg-[#34a853] text-white" : d.status === "pending" ? "bg-[#fbbc04] text-[#1a1a2e]" : "bg-[#9aa0a6] text-white"}`}>
                                {d.status === "approved" ? "Applied" : d.status === "pending" ? "Pending" : d.status}
                              </Badge>
                              <p className="text-[9px] text-[#9aa0a6] mt-0.5">{new Date(d.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments — Collection Engine */}
          <TabsContent value="payments">
            <Tabs value={paymentsTab} onValueChange={setPaymentsTab} className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="bg-[#f1f3f4] p-0.5">
                  <TabsTrigger value="overview" className="text-[10px] data-[state=active]:bg-white px-2">Overview</TabsTrigger>
                  <TabsTrigger value="payments" className="text-[10px] data-[state=active]:bg-white px-2">Payments</TabsTrigger>
                  <TabsTrigger value="installments" className="text-[10px] data-[state=active]:bg-white px-2">Installments</TabsTrigger>
                  <TabsTrigger value="pdc" className="text-[10px] data-[state=active]:bg-white px-2">PDC</TabsTrigger>
                  <TabsTrigger value="commitments" className="text-[10px] data-[state=active]:bg-white px-2">Commitments</TabsTrigger>
                  <TabsTrigger value="verification" className="text-[10px] data-[state=active]:bg-white px-2">Verification</TabsTrigger>
                  <TabsTrigger value="history" className="text-[10px] data-[state=active]:bg-white px-2">History</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" className="h-7 text-[9px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => setShowPlanDialog(true)}>
                    <Calendar className="h-3 w-3 mr-1" /> Plan
                  </Button>
                  <Button size="sm" className="h-7 text-[9px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => setShowPDCDialog(true)}>
                    <Receipt className="h-3 w-3 mr-1" /> PDC
                  </Button>
                  <Button size="sm" className="h-7 text-[9px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => setShowCommitmentDialog(true)}>
                    <Send className="h-3 w-3 mr-1" /> Commitment
                  </Button>
                  <Button size="sm" className="h-7 text-[9px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => setShowPaymentDialog(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Payment
                  </Button>
                </div>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-3 mt-0">
                <div className="grid grid-cols-4 gap-2">
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-[#34a853]">Collected</p>
                      <p className="text-lg font-bold text-[#34a853]">₹{(collectionSummary?.collected || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      {(() => {
                        const grossFees = lead.standardAmount || 0;
                        const discountAmt = lead.discountAmount || 0;
                        const waiverAmt = lead.waiverAmount || 0;
                        const effectiveFees = Math.max(0, grossFees - discountAmt - waiverAmt);
                        const verifiedCollected = (payments || []).filter((p) => p.status === "verified").reduce((s: number, p) => s + p.amount, 0);
                        const outstanding = Math.max(0, effectiveFees - verifiedCollected);
                        const isExcess = effectiveFees > 0 && verifiedCollected > effectiveFees;
                        const statusText = isExcess ? "Excess Collection" : outstanding > 0 ? "Pending Collection" : "Fully Collected";
                        return (
                          <>
                            <p className="text-[10px] text-[#e8710a]">
                              Outstanding
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 inline-block ml-1 text-[#9aa0a6] cursor-help align-text-bottom" />
                                </TooltipTrigger>
                                <TooltipContent className="text-left" side="top">
                                  <div className="space-y-0.5 text-[11px] min-w-[180px]">
                                    <div className="flex justify-between"><span>Gross Fees:</span><span>₹{grossFees.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Discount:</span><span className="text-[#ea4335]">−₹{discountAmt.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Waiver:</span><span className="text-[#e8710a]">−₹{waiverAmt.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Collected:</span><span className="text-[#34a853]">−₹{verifiedCollected.toLocaleString()}</span></div>
                                    <div className="border-t border-white/20 pt-0.5 mt-0.5 flex justify-between font-semibold"><span>Outstanding:</span><span>₹{outstanding.toLocaleString()}</span></div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </p>
                            <p className="text-lg font-bold text-[#e8710a]">₹{outstanding.toLocaleString()}</p>
                            <p className="text-[8px] text-[#9aa0a6]">{statusText}</p>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-[#1a73e8]">Upcoming</p>
                      <p className="text-lg font-bold text-[#1a73e8]">₹{(collectionSummary?.upcomingInstallments || 0).toLocaleString()}</p>
                      <p className="text-[8px] text-[#9aa0a6]">{collectionSummary?.upcomingCount || 0} installments</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-[#ea4335]">Overdue</p>
                      <p className="text-lg font-bold text-[#ea4335]">₹{(collectionSummary?.overdueInstallments || 0).toLocaleString()}</p>
                      <p className="text-[8px] text-[#9aa0a6]">{collectionSummary?.overdueCount || 0} overdue</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-[#5f6368]">PDC Exposure</p>
                      <p className="text-base font-semibold text-[#1a1a2e]">₹{(collectionSummary?.pdcExposure || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-[#5f6368]">Commitments</p>
                      <p className="text-base font-semibold text-[#1a1a2e]">₹{(collectionSummary?.commitmentTotal || 0).toLocaleString()}</p>
                      <p className="text-[8px] text-[#9aa0a6]">{collectionSummary?.activeCommitments || 0} active</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-[#5f6368]">Active Plans</p>
                      <p className="text-base font-semibold text-[#1a1a2e]">{collectionSummary?.activePlans || 0}</p>
                      <p className="text-[8px] text-[#9aa0a6]">installment plans</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Fee computation */}
                <Card className="border-[#e8eaed] shadow-sm bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#5f6368]">Gross − Discount − Waiver = Payable − Verified = Outstanding</span>
                      <span className="text-[11px] font-medium text-[#1a1a2e]">
                        ₹{(lead.standardAmount || 0).toLocaleString()} − ₹{(lead.discountAmount || 0).toLocaleString()} − ₹{(lead.waiverAmount || 0).toLocaleString()}
                        = ₹{(lead.finalPayable || 0).toLocaleString()} − ₹{(collectionSummary?.collected || 0).toLocaleString()}
                        = <span className="text-[#ea4335]">₹{Math.max(0, (lead.finalPayable || 0) - (collectionSummary?.collected || 0)).toLocaleString()}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Ledger */}
              <TabsContent value="payments" className="mt-0">
                <Card className="border-[#e8eaed] shadow-sm bg-white">
                  <CardContent className="p-0">
                    {!payments?.length ? (
                      <p className="text-[12px] text-[#9aa0a6] text-center py-6">No payments recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left" style={{ minWidth: 700 }}>
                          <thead>
                            <tr className="border-b border-[#e8eaed]">
                              <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Date</th>
                              <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Amount</th>
                              <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Mode</th>
                              <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Reference</th>
                              <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Verification</th>
                              <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p) => {
                              const enteredBy = users?.find((u) => u._id === p.enteredBy);
                              return (
                                <tr key={p._id} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368]">{new Date(p.createdAt).toLocaleDateString()}</td>
                                  <td className="px-2 py-2 text-[12px] font-medium text-[#1a1a2e]">₹{p.amount.toLocaleString()}</td>
                                  <td className="px-2 py-2">
                                    <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#f1f3f4] text-[#5f6368] uppercase">{p.mode}</Badge>
                                  </td>
                                  <td className="px-2 py-2 text-[11px] text-[#5f6368]">{p.reference || "—"}</td>
                                  <td className="px-2 py-2">
                                    {p.status === "verified" && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#34a853] text-white">Verified</Badge>}
                                    {p.status === "rejected" && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#ea4335] text-white">Rejected</Badge>}
                                    {p.status === "pending" && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#fbbc04] text-[#1a1a2e]">Awaiting</Badge>}
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex items-center gap-1">
                                      {p.verificationRequestId ? (
                                        <Button variant="link" size="sm" className="h-5 text-[9px] text-[#1a73e8] p-0"
                                          onClick={() => setVerificationDrawerId(p.verificationRequestId as unknown as string)}>
                                          View Status
                                        </Button>
                                      ) : <span className="text-[9px] text-[#9aa0a6]">—</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Installments Tab */}
              <TabsContent value="installments" className="space-y-2 mt-0">
                {!paymentPlans?.length ? (
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="py-6 text-center">
                      <Calendar className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                      <p className="text-[12px] text-[#9aa0a6]">No installment plans created. Click "Plan" to create one.</p>
                    </CardContent>
                  </Card>
                ) : (
                  paymentPlans.map((plan) => {
                    const planInsts = (installments || []).filter((i) => i.planId === plan._id);
                    const paidInsts = planInsts.filter((i) => i.status === "paid");
                    return (
                      <Card key={plan._id} className="border-[#e8eaed] shadow-sm bg-white">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#1a73e8]" />
                              <span className="text-[12px] font-semibold text-[#1a1a2e]">{plan.installmentCount} × ₹{plan.installmentAmount.toLocaleString()} ({plan.frequency})</span>
                              <Badge className={`text-[8px] px-1 py-0 h-3.5 ${plan.status === "active" ? "bg-[#34a853] text-white" : "bg-[#9aa0a6] text-white"}`}>{plan.status}</Badge>
                            </div>
                            <span className="text-[11px] text-[#5f6368]">₹{plan.totalAmount.toLocaleString()} total</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-[#f1f3f4] rounded-full h-1.5 mb-2">
                            <div className="bg-[#34a853] h-1.5 rounded-full" style={{ width: `${planInsts.length > 0 ? (paidInsts.length / planInsts.length) * 100 : 0}%` }} />
                          </div>
                          <div className="space-y-1">
                            {planInsts.map((inst) => {
                              const isOverdue = inst.status === "overdue";
                              const isDue = inst.status === "due";
                              return (
                                <div key={inst._id} className={`flex items-center justify-between p-1.5 rounded text-[11px] ${isOverdue ? "bg-[#fce8e6]" : isDue ? "bg-[#fef7e0]" : inst.status === "paid" ? "bg-[#e6f4ea]" : ""}`}>
                                  <span className="text-[#5f6368]">#{inst.installmentNumber} — ₹{inst.amount.toLocaleString()}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] ${isOverdue ? "text-[#ea4335]" : isDue ? "text-[#e8710a]" : inst.status === "paid" ? "text-[#34a853]" : "text-[#9aa0a6]"}`}>{inst.status}</span>
                                    <span className="text-[9px] text-[#9aa0a6]">{new Date(inst.dueDate).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* PDC Tab */}
              <TabsContent value="pdc" className="space-y-2 mt-0">
                {!leadPDCs?.length ? (
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="py-6 text-center">
                      <Receipt className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                      <p className="text-[12px] text-[#9aa0a6]">No PDC cheques recorded. Click "PDC" to add one.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: 600 }}>
                      <thead>
                        <tr className="border-b border-[#e8eaed]">
                          <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Cheque</th>
                          <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Bank</th>
                          <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Date</th>
                          <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Amount</th>
                          <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Status</th>
                          <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leadPDCs.map((pdc) => {
                          const statusColors: Record<string, string> = {
                            scheduled: "bg-[#f1f3f4] text-[#5f6368]", deposited: "bg-[#4285f4] text-white",
                            cleared: "bg-[#34a853] text-white", bounced: "bg-[#ea4335] text-white", cancelled: "bg-[#9aa0a6] text-white",
                          };
                          return (
                            <tr key={pdc._id} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa]">
                              <td className="px-2 py-2 text-[11px] font-medium text-[#1a1a2e]">#{pdc.chequeNumber}</td>
                              <td className="px-2 py-2 text-[11px] text-[#5f6368]">{pdc.bank}</td>
                              <td className="px-2 py-2 text-[11px] text-[#5f6368]">{new Date(pdc.chequeDate).toLocaleDateString()}</td>
                              <td className="px-2 py-2 text-[12px] font-medium text-[#1a1a2e]">₹{pdc.amount.toLocaleString()}</td>
                              <td className="px-2 py-2">
                                <Badge className={`text-[8px] px-1 py-0 h-3.5 ${statusColors[pdc.status] || ""}`}>{pdc.status}</Badge>
                              </td>
                              <td className="px-2 py-2">
                                {pdc.status === "scheduled" && (
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#4285f4]"
                                      onClick={() => updatePDCStatus({ pdcId: pdc._id, status: "deposited", userId: user!._id })}>
                                      <CheckCircle2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#ea4335]"
                                      onClick={() => { const r = prompt("Bounce reason:"); if (r) updatePDCStatus({ pdcId: pdc._id, status: "bounced", userId: user!._id, bounceReason: r }); }}>
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                {pdc.status === "deposited" && (
                                  <Button variant="ghost" size="sm" className="h-6 text-[9px] text-[#34a853] px-1"
                                    onClick={() => updatePDCStatus({ pdcId: pdc._id, status: "cleared", userId: user!._id })}>
                                    Mark Cleared
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Commitments Tab */}
              <TabsContent value="commitments" className="space-y-2 mt-0">
                {!leadCommitments?.length ? (
                  <Card className="border-[#e8eaed] shadow-sm bg-white">
                    <CardContent className="py-6 text-center">
                      <Send className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                      <p className="text-[12px] text-[#9aa0a6]">No payment commitments. Click "Commitment" to add one.</p>
                    </CardContent>
                  </Card>
                ) : (
                  leadCommitments.map((cmt) => {
                    const confidenceColors: Record<string, string> = {
                      high: "bg-[#34a853] text-white", medium: "bg-[#fbbc04] text-[#1a1a2e]", low: "bg-[#9aa0a6] text-white",
                    };
                    return (
                      <Card key={cmt._id} className="border-[#e8eaed] shadow-sm bg-white">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${cmt.confidence === "high" ? "bg-[#e6f4ea]" : cmt.confidence === "medium" ? "bg-[#fef7e0]" : "bg-[#f1f3f4]"}`}>
                              <Send className={`h-3.5 w-3.5 ${cmt.confidence === "high" ? "text-[#34a853]" : cmt.confidence === "medium" ? "text-[#e8710a]" : "text-[#9aa0a6]"}`} />
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-[#1a1a2e]">₹{cmt.amount.toLocaleString()}</p>
                              <p className="text-[10px] text-[#5f6368]">By {new Date(cmt.commitDate).toLocaleDateString()}{cmt.reason ? ` · ${cmt.reason}` : ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[8px] px-1 py-0 h-3.5 ${confidenceColors[cmt.confidence]}`}>{cmt.confidence}</Badge>
                            <Badge className={`text-[8px] px-1 py-0 h-3.5 ${cmt.status === "active" ? "bg-[#fbbc04] text-[#1a1a2e]" : "bg-[#9aa0a6] text-white"}`}>{cmt.status}</Badge>
                            {cmt.status === "active" && (
                              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#34a853]"
                                onClick={() => updateCommitmentStatus({ commitmentId: cmt._id, status: "completed", userId: user!._id })}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Verification Tab (reuses detail drawer) */}
              <TabsContent value="verification" className="space-y-2 mt-0">
                <Card className="border-[#e8eaed] shadow-sm bg-white">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-[#5f6368] mb-2">Verification requests for this lead's payments</p>
                    {!payments?.length ? (
                      <p className="text-[12px] text-[#9aa0a6] text-center py-3">No payments with verification</p>
                    ) : (
                      <div className="space-y-1">
                        {payments.filter((p) => p.verificationRequestId).map((p) => (
                          <div key={p._id} className="flex items-center justify-between p-2 rounded bg-[#f8f9fa]">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-3.5 w-3.5 text-[#e8710a]" />
                              <div>
                                <p className="text-[11px] font-medium text-[#1a1a2e]">₹{p.amount.toLocaleString()} via {p.mode}</p>
                                <p className="text-[9px] text-[#5f6368]">{new Date(p.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.status === "verified" && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#34a853] text-white">Verified</Badge>}
                              {p.status === "rejected" && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#ea4335] text-white">Rejected</Badge>}
                              {p.status === "pending" && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#fbbc04] text-[#1a1a2e]">Pending</Badge>}
                              <Button variant="link" size="sm" className="h-5 text-[9px] text-[#1a73e8] p-0"
                                onClick={() => setVerificationDrawerId(p.verificationRequestId as unknown as string)}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                        {payments.filter((p) => p.verificationRequestId).length === 0 && (
                          <p className="text-[11px] text-[#9aa0a6] text-center">No verification requests for this lead</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-1 mt-0">
                <Card className="border-[#e8eaed] shadow-sm bg-white">
                  <CardContent className="p-3">
                    {!activity?.length ? (
                      <p className="text-[12px] text-[#9aa0a6] text-center py-4">No activity recorded</p>
                    ) : (
                      <div className="space-y-0">
                        {activity.filter((a) =>
                          ["payment_added", "payment_verified", "payment_rejected", "payment_plan_created",
                            "installment_paid", "pdc_created", "pdc_updated", "commitment_created", "commitment_updated"]
                            .includes(a.action)
                        ).slice(0, 15).map((a, idx, arr) => (
                          <div key={a._id} className="flex gap-2 pb-2 relative">
                            {idx < arr.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#e8eaed]" />}
                            <div className="w-3.5 h-3.5 rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0 mt-0.5">
                              {a.action.includes("payment") ? <span className="text-[6px]">💰</span>
                                : a.action.includes("installment") ? <span className="text-[6px]">📅</span>
                                : a.action.includes("pdc") ? <span className="text-[6px]">📝</span>
                                : <span className="text-[6px]">🤝</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-[#5f6368]">{a.description}</p>
                              <p className="text-[8px] text-[#9aa0a6]">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })}</p>
                            </div>
                          </div>
                        ))}
                        {activity.filter((a) => ["payment_added", "payment_verified", "payment_rejected", "payment_plan_created",
                          "installment_paid", "pdc_created", "pdc_updated", "commitment_created", "commitment_updated"]
                          .includes(a.action)).length === 0 && (
                          <p className="text-[11px] text-[#9aa0a6] text-center">No collection history</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Documents</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Document name" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} className="h-9 text-[13px] flex-1" />
                  <Input placeholder="URL" value={newDocUrl} onChange={(e) => setNewDocUrl(e.target.value)} className="h-9 text-[13px] flex-1" />
                  <Button size="sm" className="h-9 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleAddDocument} disabled={!newDocName || !newDocUrl}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {!documents?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-4">No documents</p>
                ) : (
                  <div className="space-y-1">
                    {documents.map((d) => (
                      <div key={d._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] group">
                        <FileText className="h-4 w-4 text-[#4285f4] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{d.name}</p>
                          <p className="text-[10px] text-[#9aa0a6] truncate">{d.url}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#9aa0a6] hover:text-[#ea4335] opacity-0 group-hover:opacity-100"
                          onClick={() => deleteLeadDocument({ documentId: d._id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Lead Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-[#f8f9fa] text-center">
                      <p className="text-[11px] text-[#5f6368]">Stage Progress</p>
                      <p className="text-xl font-semibold text-[#1a1a2e] mt-1">{currentStageIndex + 1}/{PIPELINE_STAGES.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8f9fa] text-center">
                      <p className="text-[11px] text-[#5f6368]">Gross Revenue</p>
                      <p className="text-xl font-semibold text-[#1a1a2e] mt-1">₹{(lead.standardAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8f9fa] text-center">
                      <p className="text-[11px] text-[#5f6368]">Total Tasks</p>
                      <p className="text-xl font-semibold text-[#1a1a2e] mt-1">{tasks?.length || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8f9fa] text-center">
                      <p className="text-[11px] text-[#5f6368]">Days Active</p>
                      <p className="text-xl font-semibold text-[#1a1a2e] mt-1">{Math.floor((Date.now() - lead.createdAt) / 86400000)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8f9fa] text-center">
                      <p className="text-[11px] text-[#5f6368]">Discount Given</p>
                      <p className="text-xl font-semibold text-[#ea4335] mt-1">₹{(lead.discountAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8f9fa] text-center">
                      <p className="text-[11px] text-[#5f6368]">Final Payable</p>
                      <p className="text-xl font-semibold text-[#34a853] mt-1">₹{(lead.finalPayable || lead.standardAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#e8eaed] shadow-sm bg-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#1a1a2e]">Activity Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "Total Activities", value: activity?.length || 0 },
                      { label: "Tasks Created", value: tasks?.length || 0 },
                      { label: "Notes Added", value: notes?.length || 0 },
                      { label: "Documents Uploaded", value: documents?.length || 0 },
                      { label: "WhatsApp Messages", value: whatsAppMsgs?.length || 0 },
                      { label: "Approvals", value: approvals?.length || 0 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4] last:border-0">
                        <span className="text-[12px] text-[#5f6368]">{item.label}</span>
                        <span className="text-[12px] font-semibold text-[#1a1a2e]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowAssignDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[320px]" onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Assign Lead</p>
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>{users?.filter((u) => !u.isDisabled).map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleAssign} disabled={!assignUserId}>Assign</Button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Approval Request Modal */}
      {showApprovalRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowApprovalRequestModal(false)}>
          <div className="bg-white rounded-xl border border-[#e8eaed] shadow-xl w-full max-w-[680px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#e8eaed] px-5 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${armType === "waiver" ? "bg-[#fef7e0]" : "bg-[#fce8e6]"}`}>
                  {armType === "waiver" ? <Receipt className="h-4 w-4 text-[#e8710a]" /> : <Percent className="h-4 w-4 text-[#ea4335]" />}
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a2e]">Approval Request</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowApprovalRequestModal(false)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="p-5 space-y-4">
              {/* Row 1: Two columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Type + Amount + Reason */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Request Type</label>
                    <Select value={armType} onValueChange={(v: any) => { setArmType(v); setArmApproverIds(getSmartSuggestions(v, parseInt(armAmount) || 0)); }}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="waiver">Waiver</SelectItem>
                        <SelectItem value="scholarship">Scholarship</SelectItem>
                        <SelectItem value="special_pricing">Special Pricing</SelectItem>
                        <SelectItem value="admission">Admission</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                    <Input type="number" value={armAmount} onChange={(e) => {
                      setArmAmount(e.target.value);
                      const amt = parseInt(e.target.value) || 0;
                      setArmApproverIds(getSmartSuggestions(armType, amt));
                    }} placeholder="0" className="h-9 text-[13px] font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Reason</label>
                    <Textarea value={armReason} onChange={(e) => setArmReason(e.target.value)} placeholder="Why is this requested?" className="text-[13px] min-h-[70px]" />
                  </div>
                </div>

                {/* Right: Mode + Priority + Deadline */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Approval Mode</label>
                    <Select value={armMode} onValueChange={(v: any) => setArmMode(v)}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_one">Anyone</SelectItem>
                        <SelectItem value="all_required">All Required</SelectItem>
                        <SelectItem value="sequential">Sequential</SelectItem>
                        <SelectItem value="parallel">Parallel</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-[#9aa0a6] mt-1">
                      {armMode === "any_one" && "First approver to act completes the decision"}
                      {armMode === "all_required" && "Every approver must approve"}
                      {armMode === "sequential" && "Approvers decide one after another in order"}
                      {armMode === "parallel" && "All approvers decide simultaneously"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Priority</label>
                    <Select value={armPriority} onValueChange={(v: any) => setArmPriority(v)}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Deadline (optional)</label>
                    <Input type="date" value={armDeadline} onChange={(e) => setArmDeadline(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                </div>
              </div>

              {/* Approver Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">
                    Approvers <span className="text-[#9aa0a6] normal-case">({armApproverIds.length} selected)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-[#9aa0a6]">Min: {armMode === "any_one" || armMode === "sequential" ? 1 : 2}</span>
                    <button onClick={() => setArmApproverIds(getSmartSuggestions(armType, parseInt(armAmount) || 0))}
                      className="text-[10px] text-[#1a73e8] hover:text-[#1557b0] font-medium">
                      Suggest
                    </button>
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
                  <Input value={armSearch} onChange={(e) => setArmSearch(e.target.value)}
                    placeholder="Search users..." className="h-8 text-[12px] pl-8" />
                </div>
                <div className="max-h-[140px] overflow-y-auto border border-[#e8eaed] rounded-md p-1 space-y-0.5">
                  {(function() {
                    const filteredUsers = (users || []).filter((u) => !u.isDisabled && (u.name || "").toLowerCase().includes(armSearch.toLowerCase()) || (u.role || "").toLowerCase().includes(armSearch.toLowerCase()));
                    if (filteredUsers.length === 0) {
                      return <p className="text-[11px] text-[#9aa0a6] text-center py-3">No users found</p>;
                    }
                    return filteredUsers.map((u) => {
                      const isSelected = armApproverIds.includes(u._id);
                      const isSuggested = getSmartSuggestions(armType, parseInt(armAmount) || 0).includes(u._id) && !isSelected;
                      const rowClass = isSelected ? "bg-[#e8f0fe]" : "hover:bg-[#f8f9fa]";
                      const checkClass = isSelected ? "bg-[#1a73e8] border-[#1a73e8]" : "border-[#9aa0a6]";
                      return (
                        <div key={u._id}
                          className={"flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors " + rowClass}
                          onClick={() => {
                            setArmApproverIds((prev) =>
                              isSelected ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                            );
                          }}>
                          <div className={"w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 " + checkClass}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-[7px] bg-[#e8eaed] text-[#5f6368]">{u.name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{u.name}</p>
                            <p className="text-[8px] text-[#9aa0a6]">{u.role || ""}{isSuggested ? "* Suggested" : ""}</p>
                          </div>
                          {isSuggested && !isSelected && (
                            <Badge className="text-[7px] px-1 py-0 h-3 bg-[#e8f0fe] text-[#1a73e8]">Suggested</Badge>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Approval Preview */}
              {armApproverIds.length > 0 && (
                <div className="p-3 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers className="h-3 w-3 text-[#5f6368]" />
                    <span className="text-[10px] font-semibold text-[#5f6368] uppercase">Approval Flow</span>
                    <Badge className="text-[7px] px-1 py-0 h-3 bg-[#e8eaed] text-[#5f6368]">{armMode.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#e8f0fe] text-[10px] text-[#1a73e8] font-medium">
                      <Send className="h-2.5 w-2.5" /> Request
                    </div>
                    {armApproverIds.map((id, idx) => {
                      const approver = users?.find((u) => u._id === id);
                      return (
                        <div key={id} className="flex items-center gap-0.5">
                          <ArrowRight className="h-3 w-3 text-[#9aa0a6]" />
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#e8eaed] text-[10px] text-[#5f6368]">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#e8eaed] flex items-center justify-center">
                              <span className="text-[6px] font-medium text-[#5f6368]">{approver?.name?.[0] || "?"}</span>
                            </div>
                            <span className="truncate max-w-[80px]">{approver?.name || "User"}</span>
                          </div>
                        </div>
                      );
                    })}
                    <ArrowRight className="h-3 w-3 text-[#9aa0a6]" />
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#e6f4ea] text-[10px] text-[#34a853] font-medium">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Decision
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#e8eaed] px-5 py-3 flex items-center justify-between">
              <p className="text-[9px] text-[#9aa0a6]">
                {armApproverIds.length === 0 ? "Select at least one approver" : `Ready to submit with ${armApproverIds.length} approver(s)`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"
                  onClick={() => setShowApprovalRequestModal(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  onClick={handleCreateApprovalWithModal}
                  disabled={!armAmount || !armReason || armApproverIds.length === 0 || armMode === "all_required" && armApproverIds.length < 2 || armMode === "parallel" && armApproverIds.length < 2}>
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Dialog */}
      {showWhatsApp && (
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
              {WHATSAPP_TEMPLATES.map((tmpl) => (
                <button key={tmpl.id} onClick={() => handleWaTemplateChange(tmpl.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium ${waTemplate === tmpl.id ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                  {tmpl.label}
                </button>
              ))}
              <button onClick={() => { setWaTemplate("manual"); setWaMessage(""); }}
                className={`px-2 py-1 rounded-md text-[10px] font-medium ${waTemplate === "manual" ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                Manual
              </button>
            </div>
            <Textarea value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
              className="text-[13px] min-h-[80px]" placeholder="Type your message..." />
            <p className="text-[9px] text-[#9aa0a6] mt-1">Will open WhatsApp with pre-filled message for {lead.firstName} {lead.lastName} ({lead.phone})</p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowWhatsApp(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#25D366] hover:bg-[#20BD5A] text-white" onClick={handleSendWhatsApp} disabled={!waMessage}>
                <ExternalLink className="h-3 w-3 mr-1" /> Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Course Enrollment Dialog */}
      {showCourseDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4" onClick={() => setShowCourseDialog(false)}>
          <div className="bg-white rounded-xl border border-[#e8eaed] shadow-xl w-full max-w-[640px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#e8eaed] px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1a1a2e]">Select Courses</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowCourseDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-1">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
                <Input placeholder="Search courses..." className="h-8 text-[12px] pl-8" />
              </div>
              {(allCourses || []).filter((c: any) => c.status === "active").map((course: any) => {
                const isEnrolled = (leadCourses || []).some((lc: any) => lc._id === course._id);
                return (
                  <div key={course._id}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${isEnrolled ? "bg-[#e6f4ea]" : "hover:bg-[#f8f9fa]"}`}
                    onClick={async () => {
                      if (!user) return;
                      if (isEnrolled) {
                        await removeCourseFromLead({ leadId: lead._id, courseId: course._id, removedBy: user._id });
                      } else {
                        await addCourseToLead({ leadId: lead._id, courseId: course._id, addedBy: user._id });
                      }
                    }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isEnrolled ? "bg-[#34a853] border-[#34a853]" : "border-[#9aa0a6]"}`}>
                        {isEnrolled && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-[#1a1a2e]">{course.courseName}</p>
                        <p className="text-[10px] text-[#9aa0a6]">{course.courseCode} · ₹{course.baseFee.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-[#34a853] shrink-0">₹{course.baseFee.toLocaleString()}</span>
                  </div>
                );
              })}
              {(allCourses || []).filter((c: any) => c.status === "active").length === 0 && (
                <p className="text-[12px] text-[#9aa0a6] text-center py-6">No active courses available. Create courses in Course Studio first.</p>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#e8eaed] px-5 py-3 flex justify-between items-center">
              <span className="text-[11px] text-[#5f6368]">
                {(leadCourses || []).length} course(s) selected · Total: ₹{(leadCourses || []).reduce((s: number, c: any) => s + (c.baseFee || 0), 0).toLocaleString()}
              </span>
              <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => setShowCourseDialog(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowPaymentDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#1a1a2e]">Add Payment</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowPaymentDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (₹)" className="h-9 text-[13px]" />
              <Select value={payMode} onValueChange={(v: any) => setPayMode(v)}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem><SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
              <Input value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder="Reference (optional)" className="h-9 text-[13px]" />
              <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Notes (optional)" className="h-9 text-[13px]" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleAddPayment} disabled={!payAmount}>Add Payment</Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Plan Dialog */}
      {showPlanDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowPlanDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#1a1a2e]">Create Installment Plan</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowPlanDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              <Input type="number" value={planTotal} onChange={(e) => setPlanTotal(e.target.value)} placeholder="Total Amount (₹)" className="h-9 text-[13px]" />
              <Input type="number" value={planCount} onChange={(e) => setPlanCount(e.target.value)} placeholder="Number of Installments" className="h-9 text-[13px]" />
              <Select value={planFreq} onValueChange={(v: any) => setPlanFreq(v)}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} placeholder="Start Date" className="h-9 text-[13px]" />
              <Input type="number" value={planGrace} onChange={(e) => setPlanGrace(e.target.value)} placeholder="Grace Days" className="h-9 text-[13px]" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                onClick={async () => {
                  if (!planTotal || !planStart || !user || !lead) return;
                  await createPaymentPlan({
                    leadId: lead._id,
                    totalAmount: parseInt(planTotal) || 0,
                    installmentCount: parseInt(planCount) || 3,
                    frequency: planFreq,
                    startDate: new Date(planStart).getTime(),
                    graceDays: parseInt(planGrace) || 7,
                    createdBy: user._id,
                  });
                  setShowPlanDialog(false);
                  setPlanTotal(""); setPlanCount("3"); setPlanFreq("monthly"); setPlanStart(""); setPlanGrace("7");
                }}
                disabled={!planTotal || !planStart}>Create Plan</Button>
            </div>
          </div>
        </div>
      )}

      {/* PDC Dialog */}
      {showPDCDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowPDCDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#1a1a2e]">Add PDC Cheque</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowPDCDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              <Input value={pdcChequeNo} onChange={(e) => setPdcChequeNo(e.target.value)} placeholder="Cheque Number" className="h-9 text-[13px]" />
              <Input value={pdcBank} onChange={(e) => setPdcBank(e.target.value)} placeholder="Bank Name" className="h-9 text-[13px]" />
              <Input type="date" value={pdcChequeDate} onChange={(e) => setPdcChequeDate(e.target.value)} placeholder="Cheque Date" className="h-9 text-[13px]" />
              <Input type="number" value={pdcAmount} onChange={(e) => setPdcAmount(e.target.value)} placeholder="Amount (₹)" className="h-9 text-[13px]" />
              <Input value={pdcAttachment} onChange={(e) => setPdcAttachment(e.target.value)} placeholder="Attachment URL (optional)" className="h-9 text-[13px]" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowPDCDialog(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                onClick={async () => {
                  if (!pdcChequeNo || !pdcBank || !pdcChequeDate || !pdcAmount || !user || !lead) return;
                  await createPDC({
                    leadId: lead._id,
                    chequeNumber: pdcChequeNo,
                    bank: pdcBank,
                    chequeDate: new Date(pdcChequeDate).getTime(),
                    amount: parseInt(pdcAmount) || 0,
                    attachment: pdcAttachment || undefined,
                    createdBy: user._id,
                  });
                  setShowPDCDialog(false);
                  setPdcChequeNo(""); setPdcBank(""); setPdcChequeDate(""); setPdcAmount(""); setPdcAttachment("");
                }}
                disabled={!pdcChequeNo || !pdcBank || !pdcChequeDate || !pdcAmount}>Add PDC</Button>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Dialog */}
      {showCommitmentDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowCommitmentDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#1a1a2e]">Add Payment Commitment</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowCommitmentDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              <Input type="number" value={cmtAmount} onChange={(e) => setCmtAmount(e.target.value)} placeholder="Commitment Amount (₹)" className="h-9 text-[13px]" />
              <Input type="date" value={cmtDate} onChange={(e) => setCmtDate(e.target.value)} placeholder="Commitment Date" className="h-9 text-[13px]" />
              <Input value={cmtReason} onChange={(e) => setCmtReason(e.target.value)} placeholder="Reason (optional)" className="h-9 text-[13px]" />
              <Select value={cmtConfidence} onValueChange={(v: any) => setCmtConfidence(v)}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Confidence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowCommitmentDialog(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                onClick={async () => {
                  if (!cmtAmount || !cmtDate || !user || !lead) return;
                  await createCommitment({
                    leadId: lead._id,
                    amount: parseInt(cmtAmount) || 0,
                    commitDate: new Date(cmtDate).getTime(),
                    reason: cmtReason || undefined,
                    confidence: cmtConfidence,
                    ownerId: user._id,
                  });
                  setShowCommitmentDialog(false);
                  setCmtAmount(""); setCmtDate(""); setCmtReason(""); setCmtConfidence("medium");
                }}
                disabled={!cmtAmount || !cmtDate}>Add Commitment</Button>
            </div>
          </div>
        </div>
      )}
      {/* Verification Detail Drawer */}
      {!!verificationDrawerId && verificationDetail && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setVerificationDrawerId(null)}>
          <div className="bg-white rounded-xl border border-[#e8eaed] shadow-xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#e8eaed] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#e8710a]" />
                <h2 className="text-sm font-semibold text-[#1a1a2e]">Verification Details</h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setVerificationDrawerId(null)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment Summary */}
              {verificationDetail.payment && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div className="p-2 rounded bg-[#f8f9fa]">
                      <span className="text-[#9aa0a6]">Amount</span>
                      <p className="font-semibold text-[#1a1a2e]">₹{verificationDetail.payment.amount.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded bg-[#f8f9fa]">
                      <span className="text-[#9aa0a6]">Mode</span>
                      <p className="font-semibold text-[#1a1a2e] uppercase">{verificationDetail.payment.mode}</p>
                    </div>
                    <div className="p-2 rounded bg-[#f8f9fa]">
                      <span className="text-[#9aa0a6]">Reference</span>
                      <p className="font-medium text-[#1a1a2e]">{verificationDetail.payment.reference || "—"}</p>
                    </div>
                    <div className="p-2 rounded bg-[#f8f9fa]">
                      <span className="text-[#9aa0a6]">Date</span>
                      <p className="font-medium text-[#1a1a2e]">{new Date(verificationDetail.payment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Info */}
              {verificationDetail.lead && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Lead</h4>
                  <div className="flex items-center gap-2 p-2 rounded bg-[#f8f9fa]">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[8px] bg-[#1a1a2e] text-white">
                        {verificationDetail.lead.firstName?.[0]}{verificationDetail.lead.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[12px] font-medium text-[#1a1a2e]">
                        {verificationDetail.lead.firstName} {verificationDetail.lead.lastName}
                      </p>
                      <p className="text-[10px] text-[#5f6368]">{verificationDetail.lead.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submitted By */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Submitted By</h4>
                <p className="text-[12px] text-[#1a1a2e] p-2 rounded bg-[#f8f9fa]">
                  {users?.find((u) => u._id === verificationDetail.request.requesterId)?.name || "Unknown"}
                </p>
              </div>

              {/* Assigned Verifiers */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Assigned Verifiers</h4>
                <div className="flex flex-wrap gap-1">
                  {verificationDetail.request.assignedUserIds.map((uid: any) => {
                    const verifier = users?.find((u) => u._id === uid);
                    return (
                      <span key={uid} className="text-[10px] bg-[#f1f3f4] px-1.5 py-0.5 rounded text-[#5f6368]">
                        {verifier?.name || uid.slice(-6)}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Status</h4>
                <div className="flex items-center gap-2">
                  {(() => {
                    const s = verificationDetail.request.status;
                    const sc = s === "verified" ? "bg-[#34a853] text-white"
                      : s === "rejected" ? "bg-[#ea4335] text-white"
                      : s === "returned" ? "bg-[#9aa0a6] text-white"
                      : "bg-[#fbbc04] text-[#1a1a2e]";
                    return <Badge className={`text-[10px] px-1.5 py-0 h-4 ${sc} capitalize`}>{s}</Badge>;
                  })()}
                  {verificationDetail.request.remarks && (
                    <span className="text-[10px] text-[#5f6368]">Note: {verificationDetail.request.remarks}</span>
                  )}
                </div>
              </div>

              {/* Decision Timeline */}
              {verificationDetail.decisions.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Decision Timeline</h4>
                  <div className="space-y-0">
                    {verificationDetail.decisions.map((d: any, idx: number) => {
                      const actor = users?.find((u) => u._id === d.userId);
                      const statusLabel = d.status === "verified" ? "Approved"
                        : d.status === "rejected" ? "Rejected"
                        : d.status === "returned" ? "Returned"
                        : d.status === "request_proof" ? "Requested Proof"
                        : d.status;
                      const statusIcon = d.status === "verified" ? "✅"
                        : d.status === "rejected" ? "❌"
                        : "↩️";
                      return (
                        <div key={d._id} className="flex items-start gap-2 pb-2 relative">
                          {idx < verificationDetail.decisions.length - 1 && (
                            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#e8eaed]" />
                          )}
                          <div className="w-3.5 h-3.5 rounded-full bg-[#f1f3f4] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[7px]">{statusIcon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#1a1a2e]">{actor?.name || "Unknown"} — {statusLabel}</p>
                            {d.comment && <p className="text-[10px] text-[#5f6368]">{d.comment}</p>}
                            <p className="text-[9px] text-[#9aa0a6] mt-0.5">
                              {new Date(d.decidedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions for pending verification assigned to current user */}
              {verificationDetail.request.status === "pending" && user && verificationDetail.request.assignedUserIds.includes(user._id as any) && (
                <div className="pt-3 border-t border-[#e8eaed] space-y-2">
                  <h4 className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider">Actions</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm" className="h-7 text-[10px] bg-[#34a853] hover:bg-[#2d9249] text-white"
                      onClick={async () => {
                        await decideOnVerification({ requestId: verificationDetail.request._id, userId: user!._id, decision: "verified" });
                        setVerificationDrawerId(null);
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Approve
                    </Button>
                    <Button
                      size="sm" className="h-7 text-[10px] bg-[#ea4335] hover:bg-[#c5221f] text-white"
                      onClick={async () => {
                        const reason = prompt("Rejection reason (required):");
                        if (reason) {
                          await decideOnVerification({ requestId: verificationDetail.request._id, userId: user!._id, decision: "rejected", comment: reason });
                          setVerificationDrawerId(null);
                        }
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-0.5" /> Reject
                    </Button>
                    <Button
                      size="sm" variant="outline" className="h-7 text-[10px] border-[#fbbc04] text-[#e8710a] hover:bg-[#fef7e0]"
                      onClick={async () => {
                        const reason = prompt("Return reason:");
                        if (reason) {
                          await decideOnVerification({ requestId: verificationDetail.request._id, userId: user!._id, decision: "returned", comment: reason });
                          setVerificationDrawerId(null);
                        }
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-0.5" /> Return
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer */}
              {verificationDetail.request.status !== "pending" && (
                <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
                  <p className="text-[11px] text-[#5f6368]">
                    This verification has been <strong>{verificationDetail.request.status}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    {/* Lead Conversion Wizard */}
      {leadId && (
        <LeadConversionWizard
          leadId={leadId as any}
          open={showConversionWizard}
          onOpenChange={setShowConversionWizard}
          onComplete={() => setShowConversionWizard(false)}
        />
      )}

    </div>
  );
}