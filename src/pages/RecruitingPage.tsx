import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus,
  Ban,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Search,
  Building2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// ─── Status Colors ─────────────────────────────────────────

const CANDIDATE_COLORS: Record<string, string> = {
  applied: "bg-blue-50 border-blue-200 text-blue-700",
  screening: "bg-purple-50 border-purple-200 text-purple-700",
  shortlisted: "bg-indigo-50 border-indigo-200 text-indigo-700",
  interview_scheduled: "bg-amber-50 border-amber-200 text-amber-700",
  interview_completed: "bg-orange-50 border-orange-200 text-orange-700",
  assessment: "bg-cyan-50 border-cyan-200 text-cyan-700",
  offer_pending: "bg-pink-50 border-pink-200 text-pink-700",
  offer_accepted: "bg-emerald-50 border-emerald-200 text-emerald-700",
  hired: "bg-green-50 border-green-200 text-green-700",
  employee_created: "bg-green-100 border-green-300 text-green-800",
  rejected: "bg-red-50 border-red-200 text-red-700",
  archived: "bg-gray-50 border-gray-200 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  assessment: "Assessment",
  offer_pending: "Offer Pending",
  offer_accepted: "Offer Accepted",
  hired: "Hired",
  employee_created: "Employee Created",
  rejected: "Rejected",
  archived: "Archived",
};

const PIPELINE_STAGES = [
  "applied", "screening", "shortlisted", "interview_scheduled",
  "interview_completed", "assessment", "offer_pending",
  "offer_accepted", "hired"
];

// ─── Candidate Card ────────────────────────────────────────

function CandidateCard({ candidate, onSelect }: { candidate: any; onSelect: (c: any) => void }) {
  const colorClass = CANDIDATE_COLORS[candidate.status] || "bg-gray-50 border-gray-200";
  return (
    <div
      className={`p-2.5 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${colorClass}`}
      onClick={() => onSelect(candidate)}
    >
      <p className="text-[11px] font-medium truncate">{candidate.personName || "Unknown"}</p>
      <p className="text-[9px] text-gray-500 truncate mt-0.5">{candidate.appliedPosition}</p>
      {candidate.experience && (
        <p className="text-[8px] text-gray-400 mt-0.5">{candidate.experience} yrs exp</p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  RECRUITING PAGE
// ════════════════════════════════════════════════════════════

export default function RecruitingPage() {
  const [activeTab, setActiveTab] = useState("pipeline");

  // Queries
  const pipelineData = useQuery(api.candidateEngine.getCandidatePipeline, {});
  const analytics = useQuery(api.recruitmentEngine.getRecruitmentAnalytics);
  const requisitions = useQuery(api.recruitmentEngine.listRequisitions, {});
  const postings = useQuery(api.recruitmentEngine.listJobPostings, {});
  const interviews = useQuery(api.interviewEngine.getUpcomingInterviews, { limit: 20 });
  const offerStats = useQuery(api.offerEngine.getOfferStats);

  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // Stats cards
  const stats = [
    { label: "Total Candidates", value: analytics?.totalCandidates || 0, icon: Users, color: "text-blue-600" },
    { label: "Active Requisitions", value: analytics?.approvedRequisitions || 0, icon: Briefcase, color: "text-purple-600" },
    { label: "Active Postings", value: analytics?.activePostings || 0, icon: Building2, color: "text-indigo-600" },
    { label: "In Pipeline", value: analytics?.inPipeline || 0, icon: Clock, color: "text-amber-600" },
    { label: "Scheduled Interviews", value: analytics?.scheduledInterviews || 0, icon: Calendar, color: "text-cyan-600" },
    { label: "Pending Offers", value: analytics?.pendingOffers || 0, icon: FileText, color: "text-pink-600" },
    { label: "Hired", value: analytics?.hired || 0, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Rejected", value: analytics?.rejected || 0, icon: XCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e]">Recruiting</h1>
          <p className="text-[12px] text-[#5f6368]">
            Talent Acquisition System — Manage your recruitment pipeline
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-[#e8eaed]">
              <CardContent className="pt-3 pb-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold text-[#1a1a2e]">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f1f3f4] h-9">
          <TabsTrigger value="pipeline" className="text-[11px] h-7">
            <Users className="h-3.5 w-3.5 mr-1" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="requisitions" className="text-[11px] h-7">
            <Briefcase className="h-3.5 w-3.5 mr-1" />
            Requisitions ({requisitions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="interviews" className="text-[11px] h-7">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Interviews ({interviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="offers" className="text-[11px] h-7">
            <FileText className="h-3.5 w-3.5 mr-1" />
            Offers
          </TabsTrigger>
        </TabsList>

        {/* ── Pipeline Tab ── */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const candidates = pipelineData?.[stage] || [];
              return (
                <div key={stage} className="flex-shrink-0 w-56">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#5f6368]">
                      {STATUS_LABELS[stage] || stage}
                    </h3>
                    <Badge variant="secondary" className="text-[8px] h-4 px-1.5">
                      {candidates.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 min-h-[200px] bg-[#f8f9fa] rounded-lg p-2">
                    {candidates.map((c: any) => (
                      <CandidateCard
                        key={c._id}
                        candidate={c}
                        onSelect={setSelectedCandidate}
                      />
                    ))}
                    {candidates.length === 0 && (
                      <p className="text-[9px] text-[#9aa0a6] text-center py-4 italic">
                        No candidates
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Candidate Detail */}
          {selectedCandidate && (
            <Card className="border-[#e8eaed] mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {selectedCandidate.personName || "Candidate"}
                  <Badge className={`text-[8px] ${CANDIDATE_COLORS[selectedCandidate.status] || ""}`}>
                    {STATUS_LABELS[selectedCandidate.status] || selectedCandidate.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-[11px] space-y-1 text-[#5f6368]">
                  <p><span className="font-medium">Position:</span> {selectedCandidate.appliedPosition}</p>
                  {selectedCandidate.experience && <p><span className="font-medium">Experience:</span> {selectedCandidate.experience} yrs</p>}
                  {selectedCandidate.expectedSalary && <p><span className="font-medium">Expected:</span> ${selectedCandidate.expectedSalary.toLocaleString()}</p>}
                  {selectedCandidate.noticePeriod && <p><span className="font-medium">Notice Period:</span> {selectedCandidate.noticePeriod} days</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Requisitions Tab ── */}
        <TabsContent value="requisitions" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Job Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              {(!requisitions || requisitions.length === 0) ? (
                <div className="text-center py-8 text-[12px] text-[#9aa0a6]">
                  No requisitions yet
                </div>
              ) : (
                <div className="space-y-1">
                  {requisitions.map((r: any) => (
                    <div key={r._id} className="flex items-center justify-between p-2.5 border border-[#e8eaed] rounded-lg">
                      <div>
                        <p className="text-[11px] font-medium">{r.employmentType}</p>
                        <p className="text-[9px] text-[#9aa0a6]">{r.vacancies} vacancies</p>
                      </div>
                      <Badge className="text-[8px]">{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Interviews Tab ── */}
        <TabsContent value="interviews" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              {(!interviews || interviews.length === 0) ? (
                <div className="text-center py-8 text-[12px] text-[#9aa0a6]">
                  No upcoming interviews
                </div>
              ) : (
                <div className="space-y-1">
                  {interviews.map((i: any) => (
                    <div key={i._id} className="flex items-center justify-between p-2.5 border border-[#e8eaed] rounded-lg">
                      <div>
                        <p className="text-[11px] font-medium">{i.candidateName || "Unknown"}</p>
                        <p className="text-[9px] text-[#9aa0a6]">{i.roundName} — {i.mode}</p>
                        <p className="text-[8px] text-[#dadce0]">
                          {new Date(i.schedule).toLocaleDateString()} {new Date(i.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[8px]">{i.mode}</Badge>
                        <p className="text-[8px] text-[#9aa0a6] mt-0.5">{i.interviewerIds?.length} interviewer(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Offers Tab ── */}
        <TabsContent value="offers" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {offerStats && Object.entries(offerStats).filter(([k]) => k !== "total").map(([status, count]: [string, any]) => (
              <Card key={status} className="border-[#e8eaed]">
                <CardContent className="pt-3 pb-3">
                  <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">{status}</p>
                  <p className="text-lg font-bold text-[#1a1a2e]">{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
