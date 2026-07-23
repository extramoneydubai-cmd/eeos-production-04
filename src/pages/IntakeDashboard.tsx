import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Ban,
  Search,
  LayoutList,
  Activity,
  GitBranch,
  ShieldCheck,
  Route,
  Zap,
  FileText,
  BarChart3,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ListChecks,
  Eye,
  Send,
  Loader2,
  Copy,
} from "lucide-react";

// ─── Status Config ──────────────────────────────────────────────

const PROCESSING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-[#f1f3f4] text-[#5f6368]", icon: Clock },
  processing: { label: "Processing", color: "bg-[#e8f0fe] text-[#1a73e8]", icon: Loader2 },
  validated: { label: "Validated", color: "bg-[#e6f4ea] text-[#137333]", icon: CheckCircle2 },
  duplicate: { label: "Duplicate", color: "bg-[#fef7e0] text-[#e37400]", icon: Copy },
  needs_review: { label: "Needs Review", color: "bg-[#fef7e0] text-[#e37400]", icon: AlertCircle },
  verified: { label: "Verified", color: "bg-[#e6f4ea] text-[#137333]", icon: ShieldCheck },
  rejected: { label: "Rejected", color: "bg-[#fce8e6] text-[#c5221f]", icon: XCircle },
  routed: { label: "Routed", color: "bg-[#e8f0fe] text-[#1a73e8]", icon: Route },
  completed: { label: "Completed", color: "bg-[#e6f4ea] text-[#137333]", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-[#fce8e6] text-[#c5221f]", icon: XCircle },
  retry: { label: "Retry", color: "bg-[#fef7e0] text-[#e37400]", icon: RefreshCw },
  cancelled: { label: "Cancelled", color: "bg-[#f1f3f4] text-[#5f6368]", icon: Ban },
};

const TIMELINE_ACTIONS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  submission_created: { label: "Submitted", icon: Send, color: "text-[#1a73e8]" },
  validated: { label: "Validated", icon: CheckCircle2, color: "text-[#137333]" },
  duplicate_check: { label: "Dup Check", icon: Copy, color: "text-[#e37400]" },
  duplicate_detected: { label: "Duplicate", icon: Copy, color: "text-[#e37400]" },
  verified: { label: "Verified", icon: ShieldCheck, color: "text-[#137333]" },
  transformed: { label: "Transformed", icon: GitBranch, color: "text-[#a855f7]" },
  routed: { label: "Routed", icon: Route, color: "text-[#1a73e8]" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-[#137333]" },
  retried: { label: "Retried", icon: RefreshCw, color: "text-[#e37400]" },
  cancelled: { label: "Cancelled", icon: Ban, color: "text-[#5f6368]" },
  failed: { label: "Failed", icon: XCircle, color: "text-[#c5221f]" },
};

function StatusBadge({ status }: { status: string }) {
  const config = PROCESSING_STATUS_CONFIG[status];
  if (!config) return <Badge className="text-[9px]">{status}</Badge>;
  const Icon = config.icon;
  return (
    <Badge className={`text-[9px] font-medium ${config.color} flex items-center gap-1`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

function TimelineBadge({ action, status }: { action: string; status: string }) {
  const config = TIMELINE_ACTIONS[action];
  if (!config) return <span className="text-[10px] text-[#5f6368]">{action}</span>;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
      <span className="text-[9px] text-[#9aa0a6]">— {status}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  INTAKE DASHBOARD
// ═════════════════════════════════════════════════════════════════

export default function IntakeDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();

  // Queries
  const allSubmissions = useQuery(api.intakeEngine.listSubmissions, { limit: 200 }) || [];
  const pendingSubmissions = useQuery(api.intakeEngine.listSubmissions, { status: "pending", limit: 50 }) || [];
  const needsReviewSubmissions = useQuery(api.intakeEngine.listSubmissions, { status: "needs_review", limit: 50 }) || [];
  const failedSubmissions = useQuery(api.intakeEngine.listSubmissions, { status: "failed", limit: 20 }) || [];

  // Mutations
  const submitTest = useMutation(api.intakeEngine.submit);
  const processSubmission = useMutation(api.intakeEngine.processSubmission);
  const retrySubmission = useMutation(api.intakeEngine.retrySubmission);
  const cancelSubmission = useMutation(api.intakeEngine.cancelSubmission);

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [testPayload, setTestPayload] = useState(
    JSON.stringify({ name: "John Doe", email: "john@example.com", phone: "+971501234567" }, null, 2)
  );

  // Stats
  const total = allSubmissions.length;
  const pending = allSubmissions.filter(s => s.processingStatus === "pending").length;
  const processing = allSubmissions.filter(s => s.processingStatus === "processing").length;
  const validated = allSubmissions.filter(s => s.processingStatus === "validated").length;
  const duplicates = allSubmissions.filter(s => s.processingStatus === "duplicate").length;
  const needsReview = allSubmissions.filter(s => s.processingStatus === "needs_review").length;
  const completed = allSubmissions.filter(s => s.processingStatus === "completed").length;
  const failed = allSubmissions.filter(s => s.processingStatus === "failed").length;
  const rejected = allSubmissions.filter(s => s.processingStatus === "rejected").length;
  const cancelled = allSubmissions.filter(s => s.processingStatus === "cancelled").length;

  // Source distribution
  const sourceDist = allSubmissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.source] = (acc[s.source] || 0) + 1;
    return acc;
  }, {});

  // Module distribution
  const moduleDist = allSubmissions.reduce<Record<string, number>>((acc, s) => {
    if (s.targetModule) {
      acc[s.targetModule] = (acc[s.targetModule] || 0) + 1;
    }
    return acc;
  }, {});

  // Filtered list
  const filtered = allSubmissions.filter(
    (s) =>
      s.submissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.formCode && s.formCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ─── Handlers ──────────────────────────────────────────────

  const handleSubmitTest = async () => {
    try {
      let payload;
      try {
        payload = JSON.parse(testPayload);
      } catch {
        toast.error("Invalid JSON payload");
        return;
      }

      const result = await processSubmission({
        source: "manual_form",
        payload: JSON.stringify(payload),
        createdBy: user?._id as any,
        submittedBy: user?.name,
        autoRoute: false,
      });

      toast.success(`Submission created: ${result.submissionNumber}`);
      setShowCreateDialog(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create submission");
    }
  };

  const handleViewTimeline = async (submission: any) => {
    setSelectedSubmission(submission);
    try {
      const { getSubmissionTimeline } = await import("@/convex/_generated/api");
      // Use the query directly
      const timelineData = useQuery(api.intakeEngine.getSubmissionTimeline, {
        submissionId: submission._id,
      });
      setTimeline(timelineData || []);
      setShowTimeline(true);
    } catch {
      // Fallback: show empty timeline
      setTimeline([]);
      setShowTimeline(true);
    }
  };

  const handleRetry = async (submissionId: any) => {
    try {
      await retrySubmission({ submissionId, retriedBy: user?._id as any });
      toast.success("Submission queued for retry");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (submissionId: any) => {
    try {
      await cancelSubmission({ submissionId, cancelledBy: user?._id as any });
      toast.success("Submission cancelled");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e]">Intake Dashboard</h1>
          <p className="text-[12px] text-[#5f6368]">
            Universal Intake Engine — Track all incoming submissions
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
          onClick={() => setShowCreateDialog(true)}
        >
          <Send className="h-4 w-4 mr-1.5" />
          Test Submission
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-[#1a1a2e]">{total}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Pending</p>
            <p className="text-lg font-bold text-[#5f6368]">{pending}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Validated</p>
            <p className="text-lg font-bold text-[#137333]">{validated}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Duplicates</p>
            <p className="text-lg font-bold text-[#e37400]">{duplicates}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Needs Review</p>
            <p className="text-lg font-bold text-[#e37400]">{needsReview}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Failed</p>
            <p className="text-lg font-bold text-[#c5221f]">{failed}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Completed</p>
            <p className="text-lg font-bold text-[#137333]">{completed}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed]">
          <CardContent className="pt-3 pb-3">
            <p className="text-[9px] text-[#9aa0a6] uppercase tracking-wider">Rejected</p>
            <p className="text-lg font-bold text-[#c5221f]">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f1f3f4] h-9">
          <TabsTrigger value="overview" className="text-[11px] h-7">
            <LayoutList className="h-3.5 w-3.5 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-[11px] h-7">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="text-[11px] h-7">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Needs Review ({needsReviewSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-[11px] h-7">
            <ListChecks className="h-3.5 w-3.5 mr-1" />
            All Submissions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card className="border-[#e8eaed]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(PROCESSING_STATUS_CONFIG).map(([key, config]) => {
                    const count = allSubmissions.filter(s => s.processingStatus === key).length;
                    if (count === 0) return null;
                    const Icon = config.icon;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Icon className={`h-3 w-3 ${config.color.split(" ")[1]}`} />
                        <span className="text-[11px] text-[#5f6368] w-24">{config.label}</span>
                        <div className="flex-1 h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${config.color.split(" ")[0]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-[#5f6368] w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Source Distribution */}
            <Card className="border-[#e8eaed]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                  Source Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(sourceDist).map(([source, count]) => {
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={source} className="flex items-center gap-2">
                        <span className="text-[11px] text-[#5f6368] w-28 capitalize truncate">
                          {source.replace(/_/g, " ")}
                        </span>
                        <div className="flex-1 h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1a73e8]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-[#5f6368] w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                  {Object.keys(sourceDist).length === 0 && (
                    <p className="text-[11px] text-[#9aa0a6] italic">No submissions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Distribution */}
          {Object.keys(moduleDist).length > 0 && (
            <Card className="border-[#e8eaed]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                  Routed To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(moduleDist).map(([mod, count]) => (
                    <div key={mod} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f1f3f4]">
                      <span className="text-[11px] font-medium text-[#1a1a2e] capitalize">{mod}</span>
                      <Badge className="text-[9px] bg-[#e8f0fe] text-[#1a73e8]">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Queue */}
          <Card className="border-[#e8eaed]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                Submission Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="h-8 w-8 mx-auto mb-2 text-[#dadce0]" />
                  <p className="text-[12px] text-[#9aa0a6]">No submissions yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 text-[11px]"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Create Test Submission
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.slice(0, 15).map((s) => (
                    <SubmissionRow
                      key={s._id}
                      submission={s}
                      onViewTimeline={() => handleViewTimeline(s)}
                      onRetry={() => handleRetry(s._id)}
                      onCancel={() => handleCancel(s._id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              {pendingSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-[#dadce0]" />
                  <p className="text-[12px] text-[#9aa0a6]">No pending submissions</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {pendingSubmissions.map((s) => (
                    <SubmissionRow
                      key={s._id}
                      submission={s}
                      onViewTimeline={() => handleViewTimeline(s)}
                      onRetry={() => handleRetry(s._id)}
                      onCancel={() => handleCancel(s._id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Needs Review Tab */}
        <TabsContent value="review" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              {needsReviewSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[#dadce0]" />
                  <p className="text-[12px] text-[#9aa0a6]">No submissions needing review</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {needsReviewSubmissions.map((s) => (
                    <SubmissionRow
                      key={s._id}
                      submission={s}
                      onViewTimeline={() => handleViewTimeline(s)}
                      onRetry={() => handleRetry(s._id)}
                      onCancel={() => handleCancel(s._id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Submissions Tab */}
        <TabsContent value="all" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                <Input
                  placeholder="Search by number, source, form code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-[12px]"
                />
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-[#9aa0a6]">
                  No matching submissions
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((s) => (
                    <SubmissionRow
                      key={s._id}
                      submission={s}
                      onViewTimeline={() => handleViewTimeline(s)}
                      onRetry={() => handleRetry(s._id)}
                      onCancel={() => handleCancel(s._id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Submission Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Create Test Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Payload (JSON)</Label>
              <Textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="text-[11px] font-mono min-h-[150px]"
              />
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
              onClick={handleSubmitTest}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Submit to Intake Engine
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Dialog */}
      <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Submission Timeline
              {selectedSubmission && (
                <span className="text-[11px] text-[#9aa0a6] ml-2 font-mono">
                  #{selectedSubmission.submissionNumber}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-[#9aa0a6]">
                <StatusBadge status={selectedSubmission.processingStatus} />
                <span>•</span>
                <span className="capitalize">{selectedSubmission.source.replace(/_/g, " ")}</span>
                {selectedSubmission.targetModule && (
                  <>
                    <span>•</span>
                    <span className="capitalize">→ {selectedSubmission.targetModule}</span>
                  </>
                )}
              </div>

              <div className="relative pl-5 space-y-0">
                {timeline.map((entry: any, i: number) => (
                  <div key={entry._id} className="relative pb-3">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[-11px] top-3 bottom-0 w-px bg-[#e8eaed]" />
                    )}
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9aa0a6] mt-1.5 shrink-0" />
                      <div>
                        <TimelineBadge action={entry.action} status={entry.status} />
                        {entry.details && (
                          <p className="text-[9px] text-[#9aa0a6] mt-0.5">{entry.details}</p>
                        )}
                        <p className="text-[8px] text-[#dadce0] mt-0.5">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="py-3 text-[10px] text-[#9aa0a6] italic">
                    Timeline entries will appear here as processing progresses
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Submission Row Component ──────────────────────────────────

function SubmissionRow({
  submission,
  onViewTimeline,
  onRetry,
  onCancel,
}: {
  submission: any;
  onViewTimeline: () => void;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#e8eaed] rounded-lg hover:bg-[#fafafa] transition-colors">
      <div className="flex items-center gap-3 p-2.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-[10px] font-mono text-[#1a73e8]">{submission.submissionNumber}</code>
            <StatusBadge status={submission.processingStatus} />
            <Badge variant="outline" className="text-[8px] text-[#5f6368] uppercase">
              {submission.source.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[#9aa0a6]">
            <span>{new Date(submission.submissionDate).toLocaleString()}</span>
            {submission.targetModule && (
              <span>→ <span className="capitalize">{submission.targetModule}</span></span>
            )}
            {submission.duplicateStatus === "duplicate" && (
              <span className="text-[#e37400]">• Duplicate detected</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#9aa0a6] hover:text-[#1a73e8]"
            onClick={(e) => { e.stopPropagation(); onViewTimeline(); }}
            title="View Timeline"
          >
            <Activity className="h-3.5 w-3.5" />
          </Button>
          {(submission.processingStatus === "failed" || submission.processingStatus === "retry") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#9aa0a6] hover:text-[#137333]"
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              title="Retry"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {(submission.processingStatus === "pending" || submission.processingStatus === "needs_review") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#9aa0a6] hover:text-[#c5221f]"
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              title="Cancel"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#dadce0]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#dadce0]" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[#e8eaed]">
          <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap gap-2 text-[10px]">
              {submission.formCode && (
                <div><span className="text-[#9aa0a6]">Form:</span> <code className="text-[#e8710a]">{submission.formCode}</code></div>
              )}
              {submission.ipAddress && (
                <div><span className="text-[#9aa0a6]">IP:</span> {submission.ipAddress}</div>
              )}
              {submission.device && (
                <div><span className="text-[#9aa0a6]">Device:</span> {submission.device}</div>
              )}
              {submission.retryCount > 0 && (
                <div><span className="text-[#9aa0a6]">Retries:</span> {submission.retryCount}</div>
              )}
              {submission.processingTime && (
                <div><span className="text-[#9aa0a6]">Time:</span> {submission.processingTime}ms</div>
              )}
            </div>

            {submission.validationReport && (
              <div className="p-2 bg-[#fafafa] rounded border border-[#e8eaed]">
                <p className="text-[9px] font-medium text-[#5f6368] mb-1">Validation Report</p>
                <pre className="text-[9px] text-[#5f6368] whitespace-pre-wrap font-mono">
                  {JSON.stringify(JSON.parse(submission.validationReport), null, 2)}
                </pre>
              </div>
            )}

            {submission.duplicateStatus === "duplicate" && submission.duplicateReason && (
              <div className="p-2 bg-[#fef7e0] rounded border border-[#fde68a]">
                <p className="text-[9px] font-medium text-[#e37400]">Duplicate: {submission.duplicateReason}</p>
              </div>
            )}

            <div className="p-2 bg-[#fafafa] rounded border border-[#e8eaed]">
              <p className="text-[9px] font-medium text-[#5f6368] mb-1">Payload</p>
              <pre className="text-[9px] text-[#5f6368] whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto">
                {JSON.stringify(JSON.parse(submission.payload || "{}"), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
