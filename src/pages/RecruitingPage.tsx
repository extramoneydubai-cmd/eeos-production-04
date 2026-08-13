import { useMemo, useState, type ElementType } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Megaphone,
  PlusCircle,
  Send,
  Ban,
  Banknote,
} from "lucide-react";

// ─── Pipeline stages (mirrors candidateEngine flow) ────────────
const FLOW = [
  "applied",
  "screening",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "assessment",
  "offer_pending",
  "offer_accepted",
  "hired",
];

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  assessment: "Assessment",
  offer_pending: "Offer Pending",
  offer_accepted: "Offer Accepted",
  hired: "Hired",
  rejected: "Rejected",
  archived: "Archived",
};

const STAGE_COLORS: Record<string, string> = {
  applied: "bg-blue-50 border-blue-200 text-blue-700",
  screening: "bg-purple-50 border-purple-200 text-purple-700",
  shortlisted: "bg-indigo-50 border-indigo-200 text-indigo-700",
  interview_scheduled: "bg-amber-50 border-amber-200 text-amber-700",
  interview_completed: "bg-orange-50 border-orange-200 text-orange-700",
  assessment: "bg-cyan-50 border-cyan-200 text-cyan-700",
  offer_pending: "bg-pink-50 border-pink-200 text-pink-700",
  offer_accepted: "bg-emerald-50 border-emerald-200 text-emerald-700",
  hired: "bg-green-50 border-green-200 text-green-700",
  rejected: "bg-red-50 border-red-200 text-red-700",
  archived: "bg-gray-50 border-gray-200 text-gray-500",
};

const REQUISITION_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600 border-gray-200",
  pending_approval: "bg-amber-500/10 text-amber-700 border-amber-200",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  rejected: "bg-red-500/10 text-red-700 border-red-200",
  filled: "bg-blue-500/10 text-blue-700 border-blue-200",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-200",
};

// Only stages the engine explicitly allows stepping back from
const CAN_GO_BACK: Record<string, string> = {
  interview_scheduled: "shortlisted",
  interview_completed: "shortlisted",
};

const OFFER_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  accepted: "bg-blue-500/10 text-blue-700 border-blue-200",
  declined: "bg-red-500/10 text-red-700 border-red-200",
  withdrawn: "bg-gray-500/10 text-gray-500 border-gray-200",
};

const SOURCES = ["Referral", "Job Portal", "Website", "Walk-in", "LinkedIn", "Campus", "Other"];
const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Part-time", "Intern", "Freelancer", "Consultant"];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  color: string;
}) {
  return (
    <Card className="p-4 border-border/40">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </div>
    </Card>
  );
}

function formatDate(ts: number | undefined | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecruitingPage() {
  const [tab, setTab] = useState("pipeline");

  // ── Data ──
  const pipelineData = useQuery(api.candidateEngine.getCandidatePipeline, {});
  const candidates = useQuery(api.candidateEngine.listCandidates, {});
  const analytics = useQuery(api.recruitmentEngine.getRecruitmentAnalytics);
  const requisitions = useQuery(api.recruitmentEngine.listRequisitions, {});
  const postings = useQuery(api.recruitmentEngine.listJobPostings, {});
  const interviews = useQuery(api.interviewEngine.listInterviews, {});
  const offers = useQuery(api.offerEngine.listOffers, {});
  const departments = useQuery(api.organizationDepartments.listDepartments);
  const designations = useQuery(api.organizationDesignations.listDesignations);
  const users = useQuery(api.users.listUsers, {});
  const persons = useQuery(api.personEngine.listPersons, {});

  // ── Mutations ──
  const createPerson = useMutation(api.personEngine.createPerson);
  const createCandidate = useMutation(api.candidateEngine.createCandidate);
  const transitionStatus = useMutation(api.candidateEngine.transitionCandidateStatus);
  const rejectCandidate = useMutation(api.candidateEngine.rejectCandidate);
  const createRequisition = useMutation(api.recruitmentEngine.createJobRequisition);
  const submitRequisition = useMutation(api.recruitmentEngine.submitForApproval);
  const approveRequisition = useMutation(api.recruitmentEngine.approveRequisition);
  const cancelRequisition = useMutation(api.recruitmentEngine.cancelRequisition);
  const publishJob = useMutation(api.recruitmentEngine.publishJob);
  const scheduleInterview = useMutation(api.interviewEngine.scheduleInterview);
  const recordInterview = useMutation(api.interviewEngine.recordInterview);
  const createOffer = useMutation(api.offerEngine.createOffer);
  const approveOffer = useMutation(api.offerEngine.approveOffer);
  const acceptOffer = useMutation(api.offerEngine.acceptOffer);
  const declineOffer = useMutation(api.offerEngine.declineOffer);

  // ── Lookups ──
  const personMap = useMemo(() => {
    const map = new Map<string, any>();
    (persons?.items || []).forEach((p: any) => map.set(p._id, p));
    return map;
  }, [persons]);

  const candidateName = useMemo(() => {
    const map = new Map<string, string>();
    (candidates || []).forEach((c: any) => {
      const person = personMap.get(c.personId);
      map.set(c._id, person?.displayName || person?.firstName || "Unknown");
    });
    return map;
  }, [candidates, personMap]);

  const deptMap = useMemo(() => {
    const map = new Map<string, any>();
    (departments || []).forEach((d: any) => map.set(d._id, d));
    return map;
  }, [departments]);

  const allCandidates = useMemo(() => {
    const all = new Map<string, any>();
    (candidates || []).forEach((c: any) => all.set(c._id, c));
    Object.values(pipelineData || {}).forEach((list: any) =>
      (list || []).forEach((c: any) => all.set(c._id, c))
    );
    return [...all.values()];
  }, [candidates, pipelineData]);

  // ── Candidate form ──
  const [cFirstName, setCFirstName] = useState("");
  const [cLastName, setCLastName] = useState("");
  const [cPosition, setCPosition] = useState("");
  const [cSource, setCSource] = useState("Referral");
  const [cExperience, setCExperience] = useState("");
  const [cExpected, setCExpected] = useState("");
  const [addingCandidate, setAddingCandidate] = useState(false);

  const handleAddCandidate = async () => {
    if (!cFirstName || !cLastName || !cPosition) {
      toast.error("First name, last name, and position are required");
      return;
    }
    setAddingCandidate(true);
    try {
      const personId = await createPerson({
        firstName: cFirstName,
        lastName: cLastName,
      } as any);
      await createCandidate({
        personId: personId as any,
        source: cSource,
        appliedPosition: cPosition,
        experience: cExperience ? Number(cExperience) : undefined,
        expectedSalary: cExpected ? Number(cExpected) : undefined,
      });
      toast.success("Candidate added to pipeline");
      setCFirstName("");
      setCLastName("");
      setCPosition("");
      setCExperience("");
      setCExpected("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add candidate");
    } finally {
      setAddingCandidate(false);
    }
  };

  const handleMove = async (candidate: any, direction: "next" | "back") => {
    if (direction === "back") {
      const target = CAN_GO_BACK[candidate.status];
      if (!target) return;
      try {
        await transitionStatus({ candidateId: candidate._id, newStatus: target });
        toast.success(`Moved back to ${STAGE_LABELS[target] || target}`);
      } catch (err: any) {
        toast.error(err?.message || "Transition not allowed");
      }
      return;
    }
    const idx = FLOW.indexOf(candidate.status);
    if (idx === -1) return;
    const target = FLOW[idx + 1];
    if (!target) return;
    try {
      await transitionStatus({ candidateId: candidate._id, newStatus: target });
      toast.success(`Moved to ${STAGE_LABELS[target] || target}`);
    } catch (err: any) {
      toast.error(err?.message || "Transition not allowed");
    }
  };

  const handleReject = async (candidate: any) => {
    const reason = window.prompt(`Reject ${candidateName.get(candidate._id) || "candidate"}? Reason (optional):`);
    if (reason === null) return;
    try {
      await rejectCandidate({ candidateId: candidate._id, reason: reason || undefined } as any);
      toast.success("Candidate rejected");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject candidate");
    }
  };

  // ── Requisition form ──
  const [reqDept, setReqDept] = useState("");
  const [reqDesignation, setReqDesignation] = useState("");
  const [reqVacancies, setReqVacancies] = useState("1");
  const [reqType, setReqType] = useState("Permanent");
  const [reqSalary, setReqSalary] = useState("");
  const [reqDescription, setReqDescription] = useState("");

  const handleCreateRequisition = async () => {
    if (!reqDept || !reqVacancies) {
      toast.error("Department and vacancies are required");
      return;
    }
    try {
      await createRequisition({
        departmentId: reqDept as any,
        designationId: reqDesignation ? (reqDesignation as any) : undefined,
        vacancies: Number(reqVacancies),
        employmentType: reqType,
        salaryRange: reqSalary || undefined,
        description: reqDescription || undefined,
      });
      toast.success("Requisition created (draft)");
      setReqDept("");
      setReqDesignation("");
      setReqVacancies("1");
      setReqSalary("");
      setReqDescription("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create requisition");
    }
  };

  const handleRequisitionAction = async (action: string, req: any) => {
    try {
      if (action === "submit") {
        await submitRequisition({ id: req._id });
        toast.success("Submitted for approval");
      } else if (action === "approve") {
        await approveRequisition({ id: req._id, approved: true });
        toast.success("Requisition approved");
      } else if (action === "reject") {
        await approveRequisition({ id: req._id, approved: false });
        toast.success("Requisition rejected");
      } else if (action === "cancel") {
        await cancelRequisition({ id: req._id });
        toast.success("Requisition cancelled");
      } else if (action === "publish") {
        const title = window.prompt("Job posting title:", req.title || `${deptMap.get(req.departmentId)?.name || ""} ${req.employmentType}`);
        if (!title) return;
        const skillsRaw = window.prompt("Skills (comma separated):", "") || "";
        const locationsRaw = window.prompt("Locations (comma separated):", "") || "";
        await publishJob({
          requisitionId: req._id,
          title,
          skills: skillsRaw.split(",").map((s) => s.trim()).filter(Boolean),
          locations: locationsRaw.split(",").map((s) => s.trim()).filter(Boolean),
        });
        toast.success("Job published");
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action}`);
    }
  };

  // ── Interview form ──
  const [intCandidate, setIntCandidate] = useState("");
  const [intRound, setIntRound] = useState("Round 1");
  const [intMode, setIntMode] = useState("online");
  const [intSchedule, setIntSchedule] = useState("");
  const [intDuration, setIntDuration] = useState("45");
  const [intInterviewer, setIntInterviewer] = useState("");

  const handleScheduleInterview = async () => {
    if (!intCandidate || !intSchedule) {
      toast.error("Candidate and schedule are required");
      return;
    }
    try {
      await scheduleInterview({
        candidateId: intCandidate as any,
        roundName: intRound,
        interviewerIds: intInterviewer ? [intInterviewer as any] : [],
        schedule: new Date(intSchedule).getTime(),
        mode: intMode as any,
        duration: intDuration ? Number(intDuration) : undefined,
      });
      toast.success("Interview scheduled");
      setIntCandidate("");
      setIntSchedule("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule interview");
    }
  };

  const handleRecordInterview = async (interview: any, result: "passed" | "failed") => {
    const score = result === "passed" ? window.prompt("Score (0-100, optional):") : "";
    const remarks = window.prompt("Remarks (optional):") || "";
    try {
      await recordInterview({
        interviewId: interview._id,
        result,
        score: score ? Number(score) : undefined,
        remarks: remarks || undefined,
      });
      toast.success(`Interview marked ${result}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record interview");
    }
  };

  // ── Offer form ──
  const [ofCandidate, setOfCandidate] = useState("");
  const [ofSalary, setOfSalary] = useState("");
  const [ofJoining, setOfJoining] = useState("");
  const [ofNotes, setOfNotes] = useState("");

  const offerableCandidates = allCandidates.filter(
    (c: any) => c.status === "assessment" || c.status === "interview_completed"
  );

  const handleCreateOffer = async () => {
    if (!ofCandidate || !ofSalary || !ofJoining) {
      toast.error("Candidate, salary, and joining date are required");
      return;
    }
    try {
      await createOffer({
        candidateId: ofCandidate as any,
        offeredSalary: Number(ofSalary),
        joiningDate: new Date(ofJoining).getTime(),
        notes: ofNotes || undefined,
      });
      toast.success("Offer created — pending approval");
      setOfCandidate("");
      setOfSalary("");
      setOfJoining("");
      setOfNotes("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create offer");
    }
  };

  const handleOfferAction = async (offer: any, action: "approve" | "reject" | "accept" | "decline") => {
    try {
      if (action === "approve") {
        await approveOffer({ offerId: offer._id, approved: true });
        toast.success("Offer approved");
      } else if (action === "reject") {
        await approveOffer({ offerId: offer._id, approved: false, notes: "Rejected by approver" });
        toast.success("Offer rejected");
      } else if (action === "accept") {
        await acceptOffer({ offerId: offer._id });
        toast.success("Offer accepted — candidate ready to hire");
      } else if (action === "decline") {
        const reason = window.prompt("Decline reason (optional):") || undefined;
        await declineOffer({ offerId: offer._id, reason });
        toast.success("Offer declined");
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action} offer`);
    }
  };

  return (
    <WorkspaceShell
      title="Recruiting"
      subtitle="Talent acquisition — requisitions, pipeline, interviews, and offers"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Candidates" value={analytics?.totalCandidates || 0} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Requisitions" value={analytics?.approvedRequisitions || 0} icon={Briefcase} color="bg-purple-500" />
        <StatCard title="Scheduled Interviews" value={analytics?.scheduledInterviews || 0} icon={Calendar} color="bg-amber-500" />
        <StatCard title="Hired" value={analytics?.hired || 0} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pipeline">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="requisitions">
            <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Requisitions ({requisitions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="interviews">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Interviews ({interviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="offers">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Offers ({offers?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* ── Pipeline ── */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card className="border-border/40">
            <div className="p-4 border-b">
              <p className="text-sm font-semibold mb-3">Add Candidate</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input value={cFirstName} onChange={(e) => setCFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input value={cLastName} onChange={(e) => setCLastName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Applied Position</Label>
                  <Input value={cPosition} onChange={(e) => setCPosition(e.target.value)} placeholder="e.g. Sales Executive" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Source</Label>
                  <Select value={cSource} onValueChange={setCSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Experience (yrs)</Label>
                  <Input type="number" value={cExperience} onChange={(e) => setCExperience(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected Salary</Label>
                  <Input type="number" value={cExpected} onChange={(e) => setCExpected(e.target.value)} />
                </div>
              </div>
              <Button className="mt-3" onClick={handleAddCandidate} disabled={addingCandidate}>
                <UserPlus className="h-4 w-4 mr-1.5" />
                {addingCandidate ? "Adding…" : "Add Candidate to Pipeline"}
              </Button>
            </div>

            <div className="flex gap-3 overflow-x-auto p-4">
              {FLOW.map((stage) => {
                const stageCandidates = pipelineData?.[stage] || [];
                return (
                  <div key={stage} className="flex-shrink-0 w-60">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {STAGE_LABELS[stage] || stage}
                      </h3>
                      <Badge variant="secondary" className="text-[8px] h-4 px-1.5">
                        {stageCandidates.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 min-h-[140px] bg-muted/40 rounded-lg p-2">
                      {stageCandidates.map((c: any) => (
                        <div key={c._id} className="p-2.5 rounded-lg border bg-background cursor-default">
                          <p className="text-[11px] font-medium truncate">{c.personName || "Unknown"}</p>
                          <p className="text-[9px] text-muted-foreground truncate mt-0.5">{c.appliedPosition}</p>
                          {c.experience && (
                            <p className="text-[8px] text-muted-foreground mt-0.5">{c.experience} yrs exp</p>
                          )}
                          <div className="flex gap-1 mt-2">
                            {CAN_GO_BACK[c.status] && (
                              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => handleMove(c, "back")}>
                                <ArrowLeft className="h-3 w-3" />
                              </Button>
                            )}
                            {FLOW.indexOf(c.status) < FLOW.length - 1 && (
                              <Button size="sm" variant="outline" className="h-6 px-1.5 text-[10px]" onClick={() => handleMove(c, "next")}>
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] text-red-600" onClick={() => handleReject(c)}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {stageCandidates.length === 0 && (
                        <p className="text-[9px] text-muted-foreground text-center py-4 italic">No candidates</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ── Requisitions ── */}
        <TabsContent value="requisitions" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-border/40 lg:col-span-2">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Job Requisitions</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vacancies</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(requisitions || []).map((r: any) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{deptMap.get(r.departmentId)?.name || "—"}</TableCell>
                      <TableCell>{r.employmentType}</TableCell>
                      <TableCell>{r.vacancies}</TableCell>
                      <TableCell>{r.salaryRange || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border ${REQUISITION_COLORS[r.status] || ""}`}>
                          {STAGE_LABELS[r.status] || r.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          {r.status === "draft" && (
                            <Button size="sm" className="h-7 text-[11px]" onClick={() => handleRequisitionAction("submit", r)}>
                              <Send className="h-3 w-3 mr-1" /> Submit
                            </Button>
                          )}
                          {r.status === "pending_approval" && (
                            <>
                              <Button size="sm" className="h-7 text-[11px]" onClick={() => handleRequisitionAction("approve", r)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[11px] text-red-600" onClick={() => handleRequisitionAction("reject", r)}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button size="sm" className="h-7 text-[11px]" onClick={() => handleRequisitionAction("publish", r)}>
                              <Megaphone className="h-3 w-3 mr-1" /> Publish Job
                            </Button>
                          )}
                          {(r.status === "draft" || r.status === "pending_approval") && (
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-gray-500" onClick={() => handleRequisitionAction("cancel", r)}>
                              <Ban className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!requisitions || requisitions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                        No requisitions yet — create one on the right
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="p-4 border-t">
                <p className="text-sm font-semibold mb-3">Job Postings</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(postings || []).map((p: any) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{(p.skills || []).join(", ")}</TableCell>
                        <TableCell>{(p.locations || []).join(", ")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`border ${p.status === "published" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : ""}`}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!postings || postings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                          No postings — publish an approved requisition
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="border-border/40 h-fit">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Create Requisition</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Select value={reqDept} onValueChange={setReqDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments || []).map((d: any) => (
                        <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Designation (optional)</Label>
                  <Select value={reqDesignation} onValueChange={setReqDesignation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {(designations || []).map((d: any) => (
                        <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vacancies</Label>
                    <Input type="number" value={reqVacancies} onChange={(e) => setReqVacancies(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employment Type</Label>
                    <Select value={reqType} onValueChange={setReqType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Salary Range (optional)</Label>
                  <Input value={reqSalary} onChange={(e) => setReqSalary(e.target.value)} placeholder="e.g. 3-5 LPA" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (optional)</Label>
                  <Textarea rows={2} value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreateRequisition}>
                  <PlusCircle className="h-4 w-4 mr-1.5" /> Create Requisition
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Interviews ── */}
        <TabsContent value="interviews" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-border/40 lg:col-span-2">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Interview Rounds</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(interviews || []).map((i: any) => (
                    <TableRow key={i._id}>
                      <TableCell className="font-medium">{candidateName.get(i.candidateId) || "Unknown"}</TableCell>
                      <TableCell>{i.roundName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(i.schedule)} {new Date(i.schedule).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>{i.mode}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border ${
                            i.result === "passed" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                            : i.result === "failed" ? "bg-red-500/10 text-red-700 border-red-200"
                            : i.result === "pending" ? "bg-amber-500/10 text-amber-700 border-amber-200"
                            : "bg-gray-500/10 text-gray-600 border-gray-200"
                          }`}
                        >
                          {i.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {i.result === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" className="h-7 text-[11px]" onClick={() => handleRecordInterview(i, "passed")}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Pass
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-red-600" onClick={() => handleRecordInterview(i, "failed")}>
                              <XCircle className="h-3 w-3 mr-1" /> Fail
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!interviews || interviews.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                        No interviews scheduled yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="border-border/40 h-fit">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Schedule Interview</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Candidate</Label>
                  <Select value={intCandidate} onValueChange={setIntCandidate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCandidates.map((c: any) => (
                        <SelectItem key={c._id} value={c._id}>
                          {candidateName.get(c._id) || "Unknown"} — {c.appliedPosition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Round</Label>
                    <Input value={intRound} onChange={(e) => setIntRound(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mode</Label>
                    <Select value={intMode} onValueChange={setIntMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Schedule</Label>
                  <Input type="datetime-local" value={intSchedule} onChange={(e) => setIntSchedule(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Interviewer (optional)</Label>
                  <Select value={intInterviewer} onValueChange={setIntInterviewer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users || []).map((u: any) => (
                        <SelectItem key={u._id} value={u._id}>{u.name || u.email || u._id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (minutes, optional)</Label>
                  <Input type="number" value={intDuration} onChange={(e) => setIntDuration(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleScheduleInterview}>
                  <Calendar className="h-4 w-4 mr-1.5" /> Schedule Interview
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Offers ── */}
        <TabsContent value="offers" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-border/40 lg:col-span-2">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Offers</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Offered Salary</TableHead>
                    <TableHead>Joining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(offers || []).map((o: any) => (
                    <TableRow key={o._id}>
                      <TableCell className="font-medium">{candidateName.get(o.candidateId) || "Unknown"}</TableCell>
                      <TableCell>{o.offeredSalary?.toLocaleString?.() || o.offeredSalary}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(o.joiningDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border ${OFFER_COLORS[o.status] || ""}`}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          {o.status === "pending" && (
                            <>
                              <Button size="sm" className="h-7 text-[11px]" onClick={() => handleOfferAction(o, "approve")}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[11px] text-red-600" onClick={() => handleOfferAction(o, "reject")}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {o.status === "approved" && (
                            <>
                              <Button size="sm" className="h-7 text-[11px]" onClick={() => handleOfferAction(o, "accept")}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[11px] text-red-600" onClick={() => handleOfferAction(o, "decline")}>
                                <XCircle className="h-3 w-3 mr-1" /> Decline
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!offers || offers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        No offers yet — create one for a candidate who completed assessment/interview
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="border-border/40 h-fit">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Create Offer</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Candidate (completed interview/assessment)</Label>
                  <Select value={ofCandidate} onValueChange={setOfCandidate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {offerableCandidates.map((c: any) => (
                        <SelectItem key={c._id} value={c._id}>
                          {candidateName.get(c._id) || "Unknown"} — {c.appliedPosition}
                        </SelectItem>
                      ))}
                      {offerableCandidates.length === 0 && (
                        <SelectItem value="__none__" disabled>No eligible candidates yet</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Offered Salary</Label>
                  <Input type="number" value={ofSalary} onChange={(e) => setOfSalary(e.target.value)} placeholder="e.g. 400000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Joining Date</Label>
                  <Input type="date" value={ofJoining} onChange={(e) => setOfJoining(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea rows={2} value={ofNotes} onChange={(e) => setOfNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreateOffer}>
                  <Banknote className="h-4 w-4 mr-1.5" /> Create Offer
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
