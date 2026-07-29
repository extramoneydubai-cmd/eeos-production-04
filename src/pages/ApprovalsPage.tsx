import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent, ScrollableDialogBody } from "@/components/ui/scrollable-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Send,
  Target,
  ArrowUpRight,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Undo2,
  DollarSign,
  ShieldCheck,
  Receipt,
  ScrollText,
  Eye,
  Ban,
  RotateCcw,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";

const crmStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-[#fbbc04] text-[#1a1a2e]" },
  approved: { label: "Approved", color: "bg-[#34a853] text-white" },
  rejected: { label: "Rejected", color: "bg-[#ea4335] text-white" },
  returned: { label: "Returned", color: "bg-[#9aa0a6] text-white" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-[#fbbc04] text-[#1a1a2e]" },
  approved: { label: "Approved", color: "bg-[#34a853] text-white" },
  rejected: { label: "Rejected", color: "bg-[#ea4335] text-white" },
  cancelled: { label: "Cancelled", color: "bg-[#9aa0a6] text-white" },
};

export default function ApprovalsPage() {
  const { user, isDemoMode } = useAuth();

  const templates = useQuery(api.approvals.listApprovalTemplates);
  const requests = useQuery(api.approvals.listApprovalRequests, {});
  const users = useQuery(api.users.listUsers);
  const leadsResult = useQuery(api.crm.listLeads, {});
  const leads = leadsResult?.items as Record<string, unknown>[] | undefined;
  const skipDb = !user || isDemoMode;
  const crmApprovalsAll = useQuery(api.crm.getAllCrmApprovals, skipDb ? "skip" : { userId: user._id });
  const verificationRequests = useQuery(api.verification.getVerificationRequests, skipDb ? "skip" : { userId: user._id });
  const verificationCounts = useQuery(api.verification.getVerificationCounts, skipDb ? "skip" : { userId: user._id });

  const createTemplate = useMutation(api.approvals.createApprovalTemplate);
  const createRequest = useMutation(api.approvals.createApprovalRequest);
  const approveRequest = useMutation(api.approvals.approveRequest);
  const rejectRequest = useMutation(api.approvals.rejectRequest);
  const decideOnApproval = useMutation(api.crm.decideOnApproval);
  const decideOnVerification = useMutation(api.verification.decideOnVerification);

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [reqComment, setReqComment] = useState("");
  const [crmViewFilter, setCrmViewFilter] = useState("assigned");

  // Template form
  const [tmplName, setTmplName] = useState("");
  const [tmplMode, setTmplMode] = useState("sequential");
  const [tmplPhases, setTmplPhases] = useState([{ name: "", order: 0, requiredApprovers: 1 }]);

  // Request form
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqMode, setReqMode] = useState("sequential");
  const [reqPhases, setReqPhases] = useState(1);

  const handleCreateTemplate = async () => {
    if (!tmplName) return;
    const validPhases = tmplPhases.filter((p) => p.name.trim());
    if (validPhases.length === 0) return;
    await createTemplate({
      name: tmplName,
      mode: tmplMode,
      phases: validPhases.map((p, i) => ({
        name: p.name,
        order: i,
        requiredApprovers: p.requiredApprovers || 1,
      })),
    });
    setShowTemplateDialog(false);
    setTmplName("");
    setTmplPhases([{ name: "", order: 0, requiredApprovers: 1 }]);
  };

  const handleCreateRequest = async () => {
    if (!reqTitle || !user) return;
    await createRequest({
      requesterId: user._id,
      title: reqTitle,
      description: reqDesc || undefined,
      mode: reqMode,
      totalPhases: reqPhases,
    });
    setShowRequestDialog(false);
    setReqTitle("");
    setReqDesc("");
    setReqPhases(1);
  };

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    await approveRequest({
      requestId: requestId as Id<"approvalRequests">,
      userId: user._id,
      phaseIndex: 0,
      comment: reqComment || undefined,
    });
    setReqComment("");
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;
    await rejectRequest({
      requestId: requestId as Id<"approvalRequests">,
      userId: user._id,
      phaseIndex: 0,
      comment: reqComment || undefined,
    });
    setReqComment("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Approval Center</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Manage approvals and templates</p>
        </div>
        <div className="flex items-center gap-2">            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                <Plus className="h-3.5 w-3.5 mr-1" /> New Request
              </Button>
            </DialogTrigger>
            <ScrollableDialogContent>
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-base">Create Approval Request</DialogTitle>
              </DialogHeader>
              <ScrollableDialogBody className="space-y-3">
                <div>
                  <Label className="text-[12px]">Title</Label>
                  <Input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} className="h-9 text-[13px]" placeholder="Approval title" />
                </div>
                <div>
                  <Label className="text-[12px]">Description</Label>
                  <Textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} className="text-[13px]" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px]">Mode</Label>
                    <Select value={reqMode} onValueChange={setReqMode}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="sequential">Sequential</SelectItem>
                        <SelectItem value="parallel">Parallel</SelectItem>
                        <SelectItem value="hierarchy">Hierarchy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[12px]">Phases</Label>
                    <Input type="number" min={1} max={5} value={reqPhases} onChange={(e) => setReqPhases(parseInt(e.target.value) || 1)} className="h-9 text-[13px]" />
                  </div>
                </div>
                <Button onClick={handleCreateRequest} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create Request</Button>
              </ScrollableDialogBody>
            </ScrollableDialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="requests" className="text-[12px] data-[state=active]:bg-white">Requests</TabsTrigger>
          <TabsTrigger value="crm" className="text-[12px] data-[state=active]:bg-white">CRM Approvals</TabsTrigger>
          <TabsTrigger value="verification" className="text-[12px] data-[state=active]:bg-white relative">
            Verification
            {(() => {
              const vc = verificationCounts!;
              return vc && vc.pending > 0 ? (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#ea4335] text-[8px] font-bold text-white">
                  {vc.pending}
                </span>
              ) : null;
            })()}
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-[12px] data-[state=active]:bg-white">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3 mt-4">
          {!requests?.length ? (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="py-8 text-center">
                <p className="text-[13px] text-[#9aa0a6]">No approval requests</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => {
              const requester = users?.find((u) => u._id === req.requesterId);
              const statusStyle = statusConfig[req.status] || statusConfig.pending;
              return (
                <Card key={req._id} className="border-[#e8eaed] shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{req.title}</h3>
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 font-medium ${statusStyle.color}`}>
                            {statusStyle.label}
                          </Badge>
                        </div>
                        {req.description && (
                          <p className="text-[12px] text-[#5f6368] mt-0.5">{req.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#9aa0a6]">
                          <span>By: {requester?.name || "Unknown"}</span>
                          <span>Mode: <span className="capitalize">{req.mode}</span></span>
                          <span>Phase: {req.currentPhase !== undefined ? `${req.currentPhase + 1}/${req.totalPhases}` : "—"}</span>
                          <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {req.status === "pending" && user && (
                        <div className="flex items-center gap-1 ml-4">
                          <Input
                            placeholder="Comment..."
                            value={reqComment}
                            onChange={(e) => setReqComment(e.target.value)}
                            className="h-7 text-[11px] w-[160px]"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#34a853] hover:text-[#2d9249] hover:bg-[#e6f4ea]"
                            onClick={() => handleApprove(req._id)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#ea4335] hover:text-[#c5221f] hover:bg-[#fce8e6]"
                            onClick={() => handleReject(req._id)}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* CRM Lead Approvals Tab */}
        <TabsContent value="crm" className="space-y-4 mt-4">
          {/* Counter Cards */}
          {(() => {
            const all = crmApprovalsAll || [];
            const assignedToMe = all.filter((a) => user?._id && a.approverIds?.includes(user._id as any) && a.status === "pending").length;
            const pendingCount = all.filter((a) => a.status === "pending").length;
            const approvedCount = all.filter((a) => a.status === "approved").length;
            const rejectedCount = all.filter((a) => a.status === "rejected" || a.status === "returned").length;
            const myRequestsCount = all.filter((a) => a.requestedBy === user?._id).length;
            return (
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Assigned To Me", value: assignedToMe, color: "bg-[#a855f7] text-white", icon: AlertCircle, viewFilter: "assigned" },
                  { label: "Pending", value: pendingCount, color: "bg-[#fbbc04] text-[#1a1a2e]", icon: Clock, viewFilter: "pending" },
                  { label: "Approved", value: approvedCount, color: "bg-[#34a853] text-white", icon: CheckCircle, viewFilter: "approved" },
                  { label: "Rejected", value: rejectedCount, color: "bg-[#5f6368] text-white", icon: XCircle, viewFilter: "rejected" },
                  { label: "My Requests", value: myRequestsCount, color: "bg-[#1a73e8] text-white", icon: Send, viewFilter: "my_requests" },
                ].map((card) => (
                  <button key={card.label} onClick={() => setCrmViewFilter(card.viewFilter)}
                    className="text-left"
                  >
                    <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-2.5 flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${card.color}`}>
                          <card.icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-[#1a1a2e] leading-none">{card.value}</p>
                          <p className="text-[9px] text-[#5f6368] mt-0.5 truncate">{card.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* View filter tabs — controlled by counter clicks */}
          <Tabs value={crmViewFilter} onValueChange={setCrmViewFilter} className="space-y-3">
            <TabsList className="bg-[#f1f3f4] p-0.5">
              <TabsTrigger value="assigned" className="text-[11px] data-[state=active]:bg-white px-2.5">Assigned To Me</TabsTrigger>
              <TabsTrigger value="pending" className="text-[11px] data-[state=active]:bg-white px-2.5">Pending</TabsTrigger>
              <TabsTrigger value="approved" className="text-[11px] data-[state=active]:bg-white px-2.5">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="text-[11px] data-[state=active]:bg-white px-2.5">Rejected</TabsTrigger>
              <TabsTrigger value="my_requests" className="text-[11px] data-[state=active]:bg-white px-2.5">My Requests</TabsTrigger>
            </TabsList>

            {/* Assigned To Me — only pending approvals where user is an approver */}
            <TabsContent value="assigned" className="space-y-2 mt-3">
              <CrmApprovalList
                approvals={(crmApprovalsAll || []).filter((a) => user?._id && a.approverIds?.includes(user._id as any) && a.status === "pending")}
                leads={leads}
                users={users}
                user={user}
                decideOnApproval={decideOnApproval}
              />
            </TabsContent>

            {/* Pending — all pending approvals, WITH action buttons for assigned approvers */}
            <TabsContent value="pending" className="space-y-2 mt-3">
              <CrmApprovalList
                approvals={(crmApprovalsAll || []).filter((a) => a.status === "pending")}
                leads={leads}
                users={users}
                user={user}
                decideOnApproval={decideOnApproval}
              />
            </TabsContent>

            {/* Approved */}
            <TabsContent value="approved" className="space-y-2 mt-3">
              <CrmApprovalList
                approvals={(crmApprovalsAll || []).filter((a) => a.status === "approved")}
                leads={leads}
                users={users}
                user={user}
                decideOnApproval={decideOnApproval}
                showActions={false}
              />
            </TabsContent>

            {/* Rejected / Returned */}
            <TabsContent value="rejected" className="space-y-2 mt-3">
              <CrmApprovalList
                approvals={(crmApprovalsAll || []).filter((a) => a.status === "rejected" || a.status === "returned")}
                leads={leads}
                users={users}
                user={user}
                decideOnApproval={decideOnApproval}
                showActions={false}
              />
            </TabsContent>

            {/* My Requests */}
            <TabsContent value="my_requests" className="space-y-2 mt-3">
              <CrmApprovalList
                approvals={(crmApprovalsAll || []).filter((a) => a.requestedBy === user?._id)}
                leads={leads}
                users={users}
                user={user}
                decideOnApproval={decideOnApproval}
                showActions={true}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-3 mt-4">
          {(() => {
            const all = verificationRequests || [];
            const pendingV = all.filter((r) => r.status === "pending");
            const verifiedV = all.filter((r) => r.status === "verified");
            const rejectedV = all.filter((r) => r.status === "rejected" || r.status === "returned");

            return (
              <>
                {/* Counter cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Pending", value: pendingV.length, color: "bg-[#fbbc04] text-[#1a1a2e]", icon: Clock },
                    { label: "Verified", value: verifiedV.length, color: "bg-[#34a853] text-white", icon: ShieldCheck },
                    { label: "Rejected/Returned", value: rejectedV.length, color: "bg-[#5f6368] text-white", icon: Ban },
                  ].map((card) => (
                    <Card key={card.label} className="border-[#e8eaed] shadow-sm bg-white">
                      <CardContent className="p-3 flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${card.color}`}>
                          <card.icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#1a1a2e] leading-none">{card.value}</p>
                          <p className="text-[9px] text-[#5f6368] mt-0.5">{card.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* All verifications */}
                <div className="space-y-2">
                  {all.length === 0 ? (
                    <Card className="border-[#e8eaed] shadow-sm bg-white">
                      <CardContent className="py-8 text-center">
                        <ShieldCheck className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                        <p className="text-[13px] text-[#9aa0a6]">No verification requests</p>
                      </CardContent>
                    </Card>
                  ) : (
                    all.map((vr) => {
                      const requester = users?.find((u) => u._id === vr.requesterId);
                      const statusColor = {
                        pending: "bg-[#fbbc04] text-[#1a1a2e]",
                        verified: "bg-[#34a853] text-white",
                        rejected: "bg-[#ea4335] text-white",
                        returned: "bg-[#9aa0a6] text-white",
                      }[vr.status] || "bg-[#f1f3f4] text-[#5f6368]";
                      const isMyTask = user && vr.assignedUserIds.includes(user._id as any);
                      const isPending = vr.status === "pending";

                      let meta: any = {};
                      try { meta = vr.metadata ? JSON.parse(vr.metadata) : {}; } catch {}

                      return (
                        <Card key={vr._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="p-1 rounded-lg bg-[#f1f3f4]">
                                    {vr.entityType === "payment" ? (
                                      <Receipt className="h-3.5 w-3.5 text-[#e8710a]" />
                                    ) : (
                                      <ScrollText className="h-3.5 w-3.5 text-[#4285f4]" />
                                    )}
                                  </div>
                                  <span className="text-[13px] font-semibold text-[#1a1a2e] capitalize">
                                    {vr.entityType} Verification
                                  </span>
                                  <Badge className={`text-[8px] px-1 py-0 h-3.5 ${statusColor}`}>{vr.status}</Badge>
                                </div>

                                {meta.amount && (
                                  <p className="text-[12px] font-medium text-[#1a1a2e]">
                                    Amount: ₹{meta.amount.toLocaleString()} {meta.mode ? `via ${meta.mode}` : ""}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-[#5f6368]">
                                  <span>By: {requester?.name || "Unknown"}</span>
                                  <span className="border-l border-[#e8eaed] pl-2">
                                    {new Date(vr.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="border-l border-[#e8eaed] pl-2 capitalize">
                                    Mode: {vr.mode.replace("_", " ")}
                                  </span>
                                  {vr.remarks && (
                                    <span className="border-l border-[#e8eaed] pl-2 text-[#ea4335]">
                                      {vr.remarks}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons for assigned verifiers */}
                              {isPending && isMyTask && (
                                <div className="flex flex-col gap-1 shrink-0">
                                  <VerificationActions
                                    requestId={vr._id}
                                    userId={user!._id}
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-3 mt-4">
          <div className="flex justify-end">              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Template
                </Button>
              </DialogTrigger>
              <ScrollableDialogContent>
                <DialogHeader className="shrink-0">
                  <DialogTitle className="text-base">Create Approval Template</DialogTitle>
                </DialogHeader>
                <ScrollableDialogBody className="space-y-3">
                  <div>
                    <Label className="text-[12px]">Name</Label>
                    <Input value={tmplName} onChange={(e) => setTmplName(e.target.value)} className="h-9 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px]">Mode</Label>
                    <Select value={tmplMode} onValueChange={setTmplMode}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequential</SelectItem>
                        <SelectItem value="parallel">Parallel</SelectItem>
                        <SelectItem value="hierarchy">Hierarchy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px]">Phases</Label>
                    {tmplPhases.map((phase, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder={`Phase ${i + 1}`}
                          value={phase.name}
                          onChange={(e) => {
                            const updated = [...tmplPhases];
                            updated[i] = { ...updated[i], name: e.target.value };
                            setTmplPhases(updated);
                          }}
                          className="h-8 text-[12px] flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={phase.requiredApprovers}
                          onChange={(e) => {
                            const updated = [...tmplPhases];
                            updated[i] = { ...updated[i], requiredApprovers: parseInt(e.target.value) || 1 };
                            setTmplPhases(updated);
                          }}
                          className="h-8 text-[12px] w-16"
                          placeholder="#"
                        />
                        {i === tmplPhases.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setTmplPhases([...tmplPhases, { name: "", order: 0, requiredApprovers: 1 }])}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleCreateTemplate} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create Template</Button>
                </ScrollableDialogBody>
              </ScrollableDialogContent>
            </Dialog>
          </div>

          {!templates?.length ? (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="py-8 text-center">
                <p className="text-[13px] text-[#9aa0a6]">No templates yet</p>
              </CardContent>
            </Card>
          ) : (
            templates.map((tmpl) => (
              <Card key={tmpl._id} className="border-[#e8eaed] shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{tmpl.name}</h3>
                      <p className="text-[12px] text-[#5f6368] mt-0.5">{tmpl.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#9aa0a6] capitalize">{tmpl.mode} · {tmpl.phases.length} phases</span>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${tmpl.isActive ? "bg-[#34a853] text-white" : "bg-[#9aa0a6] text-white"}`}>
                          {tmpl.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#9aa0a6]">
                      {tmpl.phases.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-[#5f6368]">{i + 1}.</span> {p.name} ({p.requiredApprovers} req)
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================
// Verification Actions (inline)
// ============================

function VerificationActions({ requestId, userId }: { requestId: any; userId: any }) {
  const decideOnVerification = useMutation(api.verification.decideOnVerification);
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          className="h-6 text-[10px] text-[#34a853] hover:bg-[#e6f4ea] px-2"
          onClick={() => decideOnVerification({ requestId, userId, decision: "verified" })}
        >
          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Verify
        </Button>
        <Button
          variant="ghost" size="sm"
          className="h-6 text-[10px] text-[#ea4335] hover:bg-[#fce8e6] px-2"
          onClick={() => decideOnVerification({ requestId, userId, decision: "rejected" })}
        >
          <XCircle className="h-3 w-3 mr-0.5" /> Reject
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          className="h-6 text-[10px] text-[#fbbc04] hover:bg-[#fef7e0] px-2"
          onClick={() => decideOnVerification({ requestId, userId, decision: "returned" })}
        >
          <RotateCcw className="h-3 w-3 mr-0.5" /> Return
        </Button>
        <div className="relative">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="note..."
            className="h-6 text-[9px] w-[100px]"
          />
        </div>
      </div>
    </div>
  );
}

// ============================
// CRM Approval List Component
// ============================

function CrmApprovalList({ approvals, leads, users, user, decideOnApproval, showActions = true }: {
  approvals: any[];
  leads: any[] | undefined;
  users: any[] | undefined;
  user: any;
  decideOnApproval: any;
  showActions?: boolean;
}) {
  const [detailApproval, setDetailApproval] = useState<any>(null);
  const [decisionComment, setDecisionComment] = useState("");

  if (!approvals.length) {
    return (
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="py-8 text-center">
          <Target className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
          <p className="text-[13px] text-[#9aa0a6]">No CRM approvals found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Approval cards */}
      <div className="space-y-2">
        {approvals.map((app) => {
          const lead_ = (leads || []).find((l: any) => l?._id === app.leadId);
          const requestedBy = users?.find((u: any) => u._id === app.requestedBy);
          const assignedTo = users?.filter((u: any) => app.approverIds?.includes(u._id));
          const isMyApproval = user && app.approverIds?.includes(user._id);
          const statusStyle = crmStatusConfig[app.status as string] || { label: app.status, color: "bg-[#f1f3f4] text-[#5f6368]" };

          return (
            <Card key={app._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetailApproval(app)}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Lead info + details */}
                  <div className="flex-1 min-w-0">
                    {/* Lead row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[8px] bg-[#1a1a2e] text-white">
                          {lead_?.firstName?.[0] || "?"}{lead_?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-[#1a1a2e]">{app.title}</span>
                          <Badge className={`text-[8px] px-1 py-0 h-3.5 ${statusStyle.color}`}>{statusStyle.label}</Badge>
                        </div>
                        {lead_ && (
                          <p className="text-[10px] text-[#5f6368]">
                            {lead_.firstName} {lead_.lastName} · {lead_.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Detail row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-[#5f6368]">
                        <DollarSign className="h-3 w-3" />₹{app.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#9aa0a6] capitalize border-l border-[#e8eaed] pl-2">
                        {app.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-[#9aa0a6] border-l border-[#e8eaed] pl-2">
                        {requestedBy?.name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-[#9aa0a6] border-l border-[#e8eaed] pl-2">
                        ID: #{app._id.slice(-6)}
                      </span>
                      <span className="text-[10px] text-[#9aa0a6] border-l border-[#e8eaed] pl-2 capitalize">
                        {app.mode.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-[#9aa0a6] border-l border-[#e8eaed] pl-2">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Assigned approvers */}
                    {assignedTo && assignedTo.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] text-[#9aa0a6]">Assigned:</span>
                        <div className="flex items-center gap-0.5">
                          {assignedTo.map((a: any) => (
                            <span key={a._id} className="text-[9px] bg-[#f1f3f4] px-1.5 py-0.5 rounded text-[#5f6368]">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reason */}
                    {app.reason && (
                      <p className="text-[10px] text-[#5f6368] mt-0.5 line-clamp-1">{app.reason}</p>
                    )}
                  </div>

                  {/* Right: Action buttons */}
                  {showActions && app.status === "pending" && isMyApproval && (
                    <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-full justify-start text-[11px] text-[#34a853] hover:bg-[#e6f4ea]"
                        onClick={() => decideOnApproval({ approvalId: app._id, userId: user!._id, decision: "approved" })}>
                        <ThumbsUpIcon className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-full justify-start text-[11px] text-[#ea4335] hover:bg-[#fce8e6]"
                        onClick={() => decideOnApproval({ approvalId: app._id, userId: user!._id, decision: "rejected" })}>
                        <ThumbsDownIcon className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-full justify-start text-[11px] text-[#fbbc04] hover:bg-[#fef7e0]"
                        onClick={() => decideOnApproval({ approvalId: app._id, userId: user!._id, decision: "returned" })}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" /> Return
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Panel Dialog */}
      <Dialog open={!!detailApproval} onOpenChange={(o) => { if (!o) { setDetailApproval(null); setDecisionComment(""); } }}>
        {detailApproval && <CrmApprovalDetailPanel
          approval={detailApproval}
          leads={leads}
          users={users}
          user={user}
          decideOnApproval={decideOnApproval}
          decisionComment={decisionComment}
          setDecisionComment={setDecisionComment}
          onClose={() => { setDetailApproval(null); setDecisionComment(""); }}
        />}
      </Dialog>
    </>
  );
}

// ============================
// CRM Approval Detail Panel
// ============================

function CrmApprovalDetailPanel({ approval, leads, users, user, decideOnApproval, decisionComment, setDecisionComment, onClose }: {
  approval: any;
  leads: any[] | undefined;
  users: any[] | undefined;
  user: any;
  decideOnApproval: any;
  decisionComment: string;
  setDecisionComment: (v: string) => void;
  onClose: () => void;
}) {
  const lead_ = (leads || []).find((l: any) => l?._id === approval.leadId);
  const requestedBy = users?.find((u: any) => u._id === approval.requestedBy);
  const assignedTo = users?.filter((u: any) => approval.approverIds?.includes(u._id));
  const isMyApproval = user && approval.approverIds?.includes(user._id);
  const statusStyle = crmStatusConfig[approval.status as string] || { label: approval.status, color: "bg-[#f1f3f4] text-[#5f6368]" };

  const feeSummary = {
    baseFee: lead_?.standardAmount || lead_?.expectedRevenue || 0,
    approvedDiscount: lead_?.discountAmount || 0,
    approvedWaiver: lead_?.waiverAmount || 0,
    finalPayable: lead_?.finalPayable || lead_?.expectedRevenue || 0,
  };

  return (
    <ScrollableDialogContent className="max-w-[560px]">
      <DialogHeader className="shrink-0">
        <div className="flex items-center gap-2">
          <DialogTitle className="text-base">Approval Details</DialogTitle>
          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${statusStyle.color}`}>{approval.status}</Badge>
        </div>
      </DialogHeader>

      <ScrollableDialogBody className="space-y-4">
        {/* Lead Summary */}
        <div className="p-3 rounded-lg bg-[#f8f9fa] space-y-1.5">
          <h4 className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Lead Summary</h4>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-[10px] bg-[#1a1a2e] text-white">
                {lead_?.firstName?.[0] || "?"}{lead_?.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#1a1a2e]">{lead_?.firstName} {lead_?.lastName || "Unknown Lead"}</p>
              <p className="text-[10px] text-[#5f6368]">{lead_?.phone}{lead_?.email ? ` · ${lead_?.email}` : ""}</p>
            </div>
            {/* Deep-link to lead */}
            <a href={`/crm/leads/${approval.leadId}`}
              className="inline-flex items-center gap-1 text-[10px] text-[#1a73e8] hover:text-[#1557b0] shrink-0"
              onClick={(e) => { e.stopPropagation(); window.open(`/crm/leads/${approval.leadId}`, '_self'); }}>
              Open Lead <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Request Details</h4>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[#9aa0a6]">Type</span>
              <p className="font-medium text-[#1a1a2e] capitalize">{approval.type.replace("_", " ")}</p>
            </div>
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[#9aa0a6]">Amount</span>
              <p className="font-medium text-[#1a1a2e]">₹{approval.amount.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[#9aa0a6]">Requested By</span>
              <p className="font-medium text-[#1a1a2e]">{requestedBy?.name || "Unknown"}</p>
            </div>
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[#9aa0a6]">Created</span>
              <p className="font-medium text-[#1a1a2e]">{new Date(approval.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[#9aa0a6]">Mode</span>
              <p className="font-medium text-[#1a1a2e] capitalize">{approval.mode.replace("_", " ")}</p>
            </div>
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[#9aa0a6]">Priority</span>
              <p className="font-medium text-[#1a1a2e] capitalize">{approval.priority || "medium"}</p>
            </div>
          </div>
          {approval.reason && (
            <div className="p-2 rounded bg-[#f8f9fa]">
              <span className="text-[10px] text-[#9aa0a6]">Reason</span>
              <p className="text-[12px] text-[#1a1a2e] mt-0.5">{approval.reason}</p>
            </div>
          )}
        </div>

        {/* Fee Summary (for fee-affecting requests) */}
        {(approval.type === "discount" || approval.type === "waiver" || approval.type === "scholarship" || approval.type === "special_pricing") && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Fee Summary</h4>
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between py-1 px-2 rounded bg-[#f8f9fa]">
                <span className="text-[#5f6368]">Base Fee</span>
                <span className="font-medium text-[#1a1a2e]">₹{feeSummary.baseFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-[#fce8e6]">
                <span className="text-[#ea4335]">Approved Discount</span>
                <span className="font-medium text-[#ea4335]">- ₹{feeSummary.approvedDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 px-2 rounded bg-[#fef7e0]">
                <span className="text-[#e8710a]">Approved Waiver</span>
                <span className="font-medium text-[#e8710a]">- ₹{feeSummary.approvedWaiver.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2 rounded bg-[#e6f4ea] font-semibold">
                <span className="text-[#34a853]">Current Payable</span>
                <span className="text-[#34a853]">₹{feeSummary.finalPayable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Approvers */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Assigned Approvers</h4>
          {assignedTo && assignedTo.length > 0 ? assignedTo.map((a: any) => (
            <div key={a._id} className="flex items-center gap-2 p-1.5 rounded bg-[#f8f9fa]">
              <div className="w-5 h-5 rounded-full bg-[#e8eaed] flex items-center justify-center">
                <span className="text-[8px] font-medium text-[#5f6368]">{a.name?.[0] || "?"}</span>
              </div>
              <span className="text-[12px] text-[#1a1a2e]">{a.name}</span>
            </div>
          )) : (
            <p className="text-[11px] text-[#9aa0a6]">No approvers assigned</p>
          )}
        </div>

        {/* Deadline */}
        {approval.deadline && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#ea4335] bg-[#fce8e6] p-2 rounded">
            <Clock className="h-3.5 w-3.5" />
            <span>Deadline: {new Date(approval.deadline).toLocaleDateString()} ({Math.ceil((approval.deadline - Date.now()) / 86400000)} days remaining)</span>
          </div>
        )}

        {/* Actions */}
        {approval.status === "pending" && isMyApproval && (
          <div className="space-y-2 pt-2 border-t border-[#e8eaed]">
            <h4 className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Decision</h4>
            <Input
              placeholder="Add a comment (optional)..."
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              className="h-8 text-[12px]"
            />
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" className="h-8 text-[11px] bg-[#34a853] hover:bg-[#2d9249]"
                onClick={() => {
                  decideOnApproval({ approvalId: approval._id, userId: user!._id, decision: "approved", comment: decisionComment || undefined });
                  onClose();
                }}>
                <ThumbsUpIcon className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" className="h-8 text-[11px] bg-[#ea4335] hover:bg-[#c5221f]"
                onClick={() => {
                  decideOnApproval({ approvalId: approval._id, userId: user!._id, decision: "rejected", comment: decisionComment || undefined });
                  onClose();
                }}>
                <ThumbsDownIcon className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-[11px] border-[#fbbc04] text-[#e8710a] hover:bg-[#fef7e0]"
                onClick={() => {
                  decideOnApproval({ approvalId: approval._id, userId: user!._id, decision: "returned", comment: decisionComment || undefined });
                  onClose();
                }}>
                <Undo2 className="h-3.5 w-3.5 mr-1" /> Return
              </Button>
            </div>
          </div>
        )}

        {/* Already decided info */}
        {approval.status !== "pending" && (
          <div className="p-2.5 rounded bg-[#f8f9fa] text-center">
            <p className="text-[12px] text-[#5f6368]">
              This approval has been <strong>{statusStyle.label.toLowerCase()}</strong>.
            </p>
          </div>
        )}
      </ScrollableDialogBody>
    </ScrollableDialogContent>
  );
}
