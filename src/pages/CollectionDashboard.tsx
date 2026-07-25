import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { toast } from "sonner";
import { useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
  DollarSign,
  TrendingUp,
  FileText,
  Ban,
  RotateCcw,
  Landmark,
  Receipt,
  Target,
  Database,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { ENABLE_COLLECTIONS_PAGE } from "@/featureFlags";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { label: string; positive: boolean };
  onClick?: () => void;
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
            {trend && (
              <p className={`text-[10px] flex items-center gap-0.5 ${trend.positive ? "text-[#34a853]" : "text-[#ea4335]"}`}>
                <TrendingUp className={`h-3 w-3 ${trend.positive ? "" : "rotate-180"}`} />
                {trend.label}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PDC_STATUSES = [
  { key: "scheduled" as const, label: "Scheduled", icon: Clock, color: "bg-[#4285f4]", iconColor: "text-white" },
  { key: "deposited" as const, label: "Deposited", icon: Landmark, color: "bg-[#fbbc04]", iconColor: "text-white" },
  { key: "cleared" as const, label: "Cleared", icon: CheckCircle2, color: "bg-[#34a853]", iconColor: "text-white" },
  { key: "bounced" as const, label: "Bounced", icon: XCircle, color: "bg-[#ea4335]", iconColor: "text-white" },
  { key: "cancelled" as const, label: "Cancelled", icon: Ban, color: "bg-[#9aa0a6]", iconColor: "text-white" },
];

export default function CollectionDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [running, setRunning] = useState(false);
  const [selectedPDCStatus, setSelectedPDCStatus] = useState<string | null>(null);

  const pdcDetails = useQuery(
    api.collectionEngine.getPDCByStatus,
    selectedPDCStatus ? { status: selectedPDCStatus as any } : "skip"
  );

  // Safe mode — page disabled until Convex deployment
  if (!ENABLE_COLLECTIONS_PAGE) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-[#f1f3f4] flex items-center justify-center mx-auto mb-4">
          <Database className="h-6 w-6 text-[#5f6368]" />
        </div>
        <h1 className="text-xl font-semibold text-[#1a1a2e] mb-2">Collections Dashboard</h1>
        <p className="text-[13px] text-[#9aa0a6] mb-6">
          Collection analytics temporarily unavailable. Pending deployment.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
            onClick={() => navigate("/crm")}
          >
            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  const dashboard = useQuery(api.collectionEngine.getCollectionDashboard);
  const runAutomation = useMutation(api.collectionEngine.dailyCollectionAutomation);

  const handleRunAutomation = async () => {
    if (!user) return;
    setRunning(true);
    try {
      const result = await runAutomation();
      toast.success("Collection automation complete", {
        description: `${result.overdueInstallments} overdue, ${result.installmentsWarned} warned, ${result.pdcRemindersSent} PDC reminders sent`,
      });
    } catch (e) {
      toast.error("Automation failed", { description: String(e) });
    } finally {
      setRunning(false);
    }
  };

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Collection Dashboard</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Organization-wide collection intelligence & automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
            onClick={() => navigate("/crm/leads")}
          >
            <Target className="h-3.5 w-3.5 mr-1" /> Lead Database
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={handleRunAutomation}
            disabled={running}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            {running ? "Running..." : "Run Daily Automation"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="pdc" className="text-[12px] data-[state=active]:bg-white">PDC Management</TabsTrigger>
          <TabsTrigger value="installments" className="text-[12px] data-[state=active]:bg-white">Installments</TabsTrigger>
          <TabsTrigger value="payments" className="text-[12px] data-[state=active]:bg-white">Payments</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════
           OVERVIEW TAB
           ════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Top-level metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Collected"
              value={`₹${dashboard.totalCollected.toLocaleString()}`}
              subtitle={`${dashboard.verifiedPaymentCount} verified payments`}
              icon={DollarSign}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Pending Verification"
              value={dashboard.pendingPaymentCount}
              subtitle={`₹${dashboard.totalPending.toLocaleString()} unverified`}
              icon={Clock}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Overdue Installments"
              value={dashboard.installmentOverdue}
              subtitle={`₹${dashboard.installmentOverdueTotal.toLocaleString()}`}
              icon={AlertCircle}
              color="bg-[#ea4335]"
              trend={{ label: `${dashboard.installmentOverdue} overdue`, positive: false }}
            />
            <StatCard
              title="PDC Exposure"
              value={dashboard.pdcScheduled + dashboard.pdcDeposited}
              subtitle={`₹${(dashboard.pdcScheduledTotal + dashboard.pdcDepositedTotal).toLocaleString()}`}
              icon={Landmark}
              color="bg-[#1a73e8]"
            />
          </div>

          {/* PDC + Installment health row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PDC Pipeline Card */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-[#1a1a2e]">PDC Pipeline</CardTitle>
                    <CardDescription className="text-[10px] text-[#9aa0a6]">{dashboard.pdcTotal} total PDCs</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#e8eaed]" onClick={() => navigate("/collections?tab=pdc")}>
                    Details <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Scheduled", count: dashboard.pdcScheduled, total: dashboard.pdcScheduledTotal, color: "bg-[#4285f4]" },
                    { label: "Deposited", count: dashboard.pdcDeposited, total: dashboard.pdcDepositedTotal, color: "bg-[#fbbc04]" },
                    { label: "Cleared", count: dashboard.pdcCleared, total: dashboard.pdcClearedTotal, color: "bg-[#34a853]" },
                    { label: "Bounced", count: dashboard.pdcBounced, total: dashboard.pdcBouncedTotal, color: "bg-[#ea4335]" },
                  ].map((item) => {
                    const pct = dashboard.pdcTotal > 0 ? (item.count / dashboard.pdcTotal) * 100 : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                        <span className="text-[11px] text-[#5f6368] w-20">{item.label}</span>
                        <div className="flex-1 h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-[#1a1a2e] w-16 text-right">{item.count}</span>
                        <span className="text-[10px] text-[#9aa0a6] w-24 text-right">₹{item.total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Installment Health Card */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Installment Health</CardTitle>
                    <CardDescription className="text-[10px] text-[#9aa0a6]">Payment plan installment status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Planned", count: dashboard.installmentPlanned, total: dashboard.installmentPlannedTotal, color: "bg-[#4285f4]" },
                    { label: "Due Now", count: dashboard.installmentDue, total: dashboard.installmentDueTotal, color: "bg-[#fbbc04]" },
                    { label: "Overdue", count: dashboard.installmentOverdue, total: dashboard.installmentOverdueTotal, color: "bg-[#ea4335]" },
                    { label: "Paid", count: dashboard.installmentPaid, total: dashboard.installmentPaidTotal, color: "bg-[#34a853]" },
                  ].map((item) => {
                    const total = dashboard.installmentPlanned + dashboard.installmentDue + dashboard.installmentOverdue + dashboard.installmentPaid;
                    const pct = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                        <span className="text-[11px] text-[#5f6368] w-20">{item.label}</span>
                        <div className="flex-1 h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-[#1a1a2e] w-16 text-right">{item.count}</span>
                        <span className="text-[10px] text-[#9aa0a6] w-24 text-right">₹{item.total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Urgency row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              title="PDC Due Today"
              value={dashboard.pdcDueToday}
              subtitle={`₹${dashboard.pdcDueTodayTotal.toLocaleString()}`}
              icon={Calendar}
              color="bg-[#ea4335]"
            />
            <StatCard
              title="PDC Due This Week"
              value={dashboard.pdcDueThisWeek}
              subtitle={`₹${dashboard.pdcDueThisWeekTotal.toLocaleString()}`}
              icon={Clock}
              color="bg-[#e8710a]"
            />
            <StatCard
              title="PDC Overdue"
              value={dashboard.pdcOverdue}
              subtitle={`₹${dashboard.pdcOverdueTotal.toLocaleString()}`}
              icon={AlertCircle}
              color="bg-[#ea4335]"
            />
            <StatCard
              title="Bounce Rate"
              value={`${dashboard.pdcBounceRate}%`}
              subtitle={`${dashboard.pdcBounced} of ${dashboard.pdcCleared + dashboard.pdcBounced} cleared/bounced`}
              icon={Ban}
              color="bg-[#5f6368]"
            />
          </div>

          {/* Active plans and commitments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Active Payment Plans"
              value={dashboard.activePlanCount}
              icon={Receipt}
              color="bg-[#1a73e8]"
            />
            <StatCard
              title="Active Commitments"
              value={dashboard.activeCommitmentCount}
              subtitle={`₹${dashboard.activeCommitmentTotal.toLocaleString()}`}
              icon={FileText}
              color="bg-[#a855f7]"
            />
            <StatCard
              title="Total Collected (Verified)"
              value={`₹${dashboard.totalCollected.toLocaleString()}`}
              icon={DollarSign}
              color="bg-[#34a853]"
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/leads")}>
              <Target className="h-4 w-4 text-[#1a73e8]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Lead Database</span>
              <span className="text-[9px] text-[#9aa0a6]">View all leads</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={handleRunAutomation} disabled={running}>
              <RefreshCw className={`h-4 w-4 text-[#34a853] ${running ? "animate-spin" : ""}`} />
              <span className="text-[11px] font-medium text-[#1a1a2e]">{running ? "Running..." : "Run Automation"}</span>
              <span className="text-[9px] text-[#9aa0a6]">Process overdue & PDC reminders</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/sales")}>
              <TrendingUp className="h-4 w-4 text-[#fbbc04]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Sales Center</span>
              <span className="text-[9px] text-[#9aa0a6]">Pipeline & followups</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]" onClick={() => navigate("/crm/leads")}>
              <Banknote className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Record Payment</span>
              <span className="text-[9px] text-[#9aa0a6]">Add payment entry</span>
            </Button>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
           PDC MANAGEMENT TAB
           ════════════════════════════════════════ */}
        <TabsContent value="pdc" className="space-y-4 mt-4">
          {/* PDC Status Cards — clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {PDC_STATUSES.map((s) => {
              const count =
                s.key === "scheduled" ? dashboard.pdcScheduled :
                s.key === "deposited" ? dashboard.pdcDeposited :
                s.key === "cleared" ? dashboard.pdcCleared :
                s.key === "bounced" ? dashboard.pdcBounced :
                dashboard.pdcCancelled;
              const total =
                s.key === "scheduled" ? dashboard.pdcScheduledTotal :
                s.key === "deposited" ? dashboard.pdcDepositedTotal :
                s.key === "cleared" ? dashboard.pdcClearedTotal :
                s.key === "bounced" ? dashboard.pdcBouncedTotal :
                0;
              const isActive = selectedPDCStatus === s.key;
              return (
                <StatCard
                  key={s.key}
                  title={s.label}
                  value={count}
                  subtitle={total > 0 ? `₹${total.toLocaleString()}` : undefined}
                  icon={s.icon}
                  color={isActive ? s.color : s.color.replace("bg-", "bg-").replace(/\[.*?\]/, "[#dadce0]")}
                  onClick={() => setSelectedPDCStatus(selectedPDCStatus === s.key ? null : s.key)}
                />
              );
            })}
          </div>

          {/* PDC Details Table */}
          {selectedPDCStatus && (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                    {PDC_STATUSES.find((s) => s.key === selectedPDCStatus)?.label || selectedPDCStatus} PDC Details
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#9aa0a6]">
                    {pdcDetails?.length || 0} record{pdcDetails?.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-[#5f6368]"
                  onClick={() => setSelectedPDCStatus(null)}
                >
                  <ChevronDown className="h-3 w-3 mr-1" /> Close
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {!pdcDetails ? (
                  <div className="p-6 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6] mx-auto" />
                  </div>
                ) : pdcDetails.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-[12px] text-[#9aa0a6]">No PDCs in this status.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#f1f3f4]">
                          <th className="text-[11px] font-medium text-[#5f6368] px-4 py-2.5">Lead Name</th>
                          <th className="text-[11px] font-medium text-[#5f6368] px-4 py-2.5">Bank</th>
                          <th className="text-[11px] font-medium text-[#5f6368] px-4 py-2.5">Cheque #</th>
                          <th className="text-[11px] font-medium text-[#5f6368] px-4 py-2.5">Amount</th>
                          <th className="text-[11px] font-medium text-[#5f6368] px-4 py-2.5">Cheque Date</th>
                          <th className="text-[11px] font-medium text-[#5f6368] px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdcDetails.map((pdc) => (
                          <tr key={pdc.pdcId} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                            <td className="px-4 py-2.5">
                              <button
                                className="flex items-center gap-1 text-[12px] font-medium text-[#1a73e8] hover:text-[#1557b0] hover:underline transition-colors"
                                onClick={() => navigate(`/crm/leads/${pdc.leadId}`)}
                              >
                                {pdc.leadName}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </button>
                            </td>
                            <td className="px-4 py-2.5 text-[12px] text-[#1a1a2e]">{pdc.bank}</td>
                            <td className="px-4 py-2.5 text-[12px] text-[#1a1a2e] font-mono">#{pdc.chequeNumber}</td>
                            <td className="px-4 py-2.5 text-[12px] text-[#1a1a2e] font-medium">₹{pdc.amount.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-2.5 text-[12px] text-[#5f6368]">{new Date(pdc.chequeDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                pdc.status === "scheduled" ? "bg-[#e8f0fe] text-[#1a73e8]" :
                                pdc.status === "deposited" ? "bg-[#fef7e0] text-[#e8710a]" :
                                pdc.status === "cleared" ? "bg-[#e6f4ea] text-[#34a853]" :
                                pdc.status === "bounced" ? "bg-[#fce8e6] text-[#ea4335]" :
                                "bg-[#f1f3f4] text-[#5f6368]"
                              }`}>
                                {pdc.status.charAt(0).toUpperCase() + pdc.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PDC Urgency */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">PDC Urgency</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">Due dates & overdue tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#fce8e6]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-[#ea4335]" />
                    <span className="text-[13px] font-semibold text-[#ea4335]">Due Today</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">{dashboard.pdcDueToday}</p>
                  <p className="text-[11px] text-[#5f6368] mt-1">₹{dashboard.pdcDueTodayTotal.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#fef7e0]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#e8710a]" />
                    <span className="text-[13px] font-semibold text-[#e8710a]">Due This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">{dashboard.pdcDueThisWeek}</p>
                  <p className="text-[11px] text-[#5f6368] mt-1">₹{dashboard.pdcDueThisWeekTotal.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#fce8e6]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-[#ea4335]" />
                    <span className="text-[13px] font-semibold text-[#ea4335]">Overdue</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1a1a2e]">{dashboard.pdcOverdue}</p>
                  <p className="text-[11px] text-[#5f6368] mt-1">₹{dashboard.pdcOverdueTotal.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDC Performance */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">PDC Performance</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">Clearance & bounce metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <p className="text-[11px] text-[#5f6368]">Clearance Rate</p>
                  <p className="text-2xl font-bold text-[#34a853] mt-1">
                    {dashboard.pdcCleared + dashboard.pdcBounced > 0
                      ? `${Math.round((dashboard.pdcCleared / (dashboard.pdcCleared + dashboard.pdcBounced)) * 100)}%`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-[#9aa0a6] mt-1">
                    {dashboard.pdcCleared} cleared of {dashboard.pdcCleared + dashboard.pdcBounced} decided
                  </p>
                </div>
                <div className="text-center p-4">
                  <p className="text-[11px] text-[#5f6368]">Bounce Rate</p>
                  <p className="text-2xl font-bold text-[#ea4335] mt-1">{dashboard.pdcBounceRate}%</p>
                  <p className="text-[10px] text-[#9aa0a6] mt-1">
                    {dashboard.pdcBounced} bounced of {dashboard.pdcCleared + dashboard.pdcBounced} decided
                  </p>
                </div>
                <div className="text-center p-4">
                  <p className="text-[11px] text-[#5f6368]">Active Exposure</p>
                  <p className="text-2xl font-bold text-[#1a73e8] mt-1">
                    ₹{((dashboard.pdcScheduledTotal + dashboard.pdcDepositedTotal) / 100000).toFixed(1)}L
                  </p>
                  <p className="text-[10px] text-[#9aa0a6] mt-1">
                    Scheduled + Deposited
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           INSTALLMENTS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="installments" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard title="Planned" value={dashboard.installmentPlanned} subtitle={`₹${dashboard.installmentPlannedTotal.toLocaleString()}`} icon={Clock} color="bg-[#4285f4]" />
            <StatCard title="Due Now" value={dashboard.installmentDue} subtitle={`₹${dashboard.installmentDueTotal.toLocaleString()}`} icon={AlertCircle} color="bg-[#fbbc04]" />
            <StatCard title="Overdue" value={dashboard.installmentOverdue} subtitle={`₹${dashboard.installmentOverdueTotal.toLocaleString()}`} icon={XCircle} color="bg-[#ea4335]" />
            <StatCard title="Paid" value={dashboard.installmentPaid} subtitle={`₹${dashboard.installmentPaidTotal.toLocaleString()}`} icon={CheckCircle2} color="bg-[#34a853]" />
          </div>

          {/* Installment summary card */}
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Installment Summary</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">All payment plan installments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Planned (upcoming)", count: dashboard.installmentPlanned, total: dashboard.installmentPlannedTotal, color: "bg-[#4285f4]", bg: "bg-[#e8f0fe]" },
                  { label: "Due (actionable today)", count: dashboard.installmentDue, total: dashboard.installmentDueTotal, color: "bg-[#fbbc04]", bg: "bg-[#fef7e0]" },
                  { label: "Overdue (past due)", count: dashboard.installmentOverdue, total: dashboard.installmentOverdueTotal, color: "bg-[#ea4335]", bg: "bg-[#fce8e6]" },
                  { label: "Paid (completed)", count: dashboard.installmentPaid, total: dashboard.installmentPaidTotal, color: "bg-[#34a853]", bg: "bg-[#e6f4ea]" },
                ].map((item) => {
                  const total = dashboard.installmentPlanned + dashboard.installmentDue + dashboard.installmentOverdue + dashboard.installmentPaid;
                  const pct = total > 0 ? (item.count / total) * 100 : 0;
                  return (
                    <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-[12px] font-medium text-[#1a1a2e]">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-semibold text-[#1a1a2e]">{item.count}</span>
                          <span className="text-[11px] text-[#5f6368] ml-2">₹{item.total.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           PAYMENTS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Total Collected"
              value={`₹${dashboard.totalCollected.toLocaleString()}`}
              subtitle={`${dashboard.verifiedPaymentCount} verified payments`}
              icon={DollarSign}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Pending"
              value={`₹${dashboard.totalPending.toLocaleString()}`}
              subtitle={`${dashboard.pendingPaymentCount} pending verifications`}
              icon={Clock}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Collection Efficiency"
              value={dashboard.totalCollected + dashboard.totalPending > 0
                ? `${Math.round((dashboard.totalCollected / (dashboard.totalCollected + dashboard.totalPending)) * 100)}%`
                : "—"}
              subtitle="Verified / (Verified + Pending)"
              icon={TrendingUp}
              color="bg-[#1a73e8]"
            />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Banknote className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Payment Records</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                View and verify individual payment records in the Lead Workspace
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/leads")}>
                  <Target className="h-3.5 w-3.5 mr-1" /> Browse Leads
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  onClick={handleRunAutomation}
                  disabled={running}
                >
                  {running ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Refresh Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
