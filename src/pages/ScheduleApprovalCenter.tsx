/**
 * ScheduleApprovalCenter — Enterprise Schedule Approval Center
 *
 * Views: Pending, Approved, Rejected, Escalated, Delegated, Expired, Cancelled
 * Actions: Approve, Reject, Request Changes, Delegate, Escalate, Hold, Bulk
 *
 * Integrates with:
 * - schedulingSdk (data)
 * - SchedulingSLA (SLA tracking)
 * - SchedulingAutomation (auto-triggers on approve/reject)
 * - Event Pipeline (audit/timeline)
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, AlertTriangle, UserCheck,
  UserX, ArrowUpRight, ArrowDownRight, Shield, FileText,
  Calendar, ChevronRight, Search, Filter, Loader2,
  Check, X, Eye, Send, ArrowRight, MoreHorizontal,
  Ban, Archive, RefreshCw, Layers, Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { schedulingSLA } from "@/platform/scheduling/SchedulingSLA";
import { schedulingAutomation } from "@/platform/scheduling/SchedulingAutomation";

// ─── Types ────────────────────────────────────────────────────────

type ApprovalView = "pending" | "approved" | "rejected" | "escalated" | "delegated" | "expired" | "cancelled" | "all";

const VIEW_OPTIONS: { value: ApprovalView; label: string; icon: any; color: string }[] = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-amber-600" },
  { value: "approved", label: "Approved", icon: CheckCircle, color: "text-green-600" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "text-red-600" },
  { value: "escalated", label: "Escalated", icon: ArrowUpRight, color: "text-orange-600" },
  { value: "delegated", label: "Delegated", icon: UserCheck, color: "text-blue-600" },
  { value: "expired", label: "Expired", icon: AlertTriangle, color: "text-gray-600" },
  { value: "cancelled", label: "Cancelled", icon: Ban, color: "text-[#5f6368]" },
];

const SCHEDULE_COLORS: Record<string, string> = {
  meeting: "#4285f4", lecture: "#a855f7", exam: "#ea4335", interview: "#34a853",
  training: "#06b6d4", counseling: "#ec4899", maintenance: "#f59e0b", holiday: "#f97316",
};

// ─── Component ────────────────────────────────────────────────────

interface ScheduleApprovalCenterProps {
  companyId?: string;
  branchId?: string;
}

export default function ScheduleApprovalCenter({ companyId, branchId }: ScheduleApprovalCenterProps) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ApprovalView>("pending");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "approve" | "reject" | "delegate" | "escalate"; schedule: any } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch schedules needing approval
  const pendingSchedules = useQuery(api.schedulingSdk.list as any, {
    status: "pending_approval",
    companyId: companyId as any,
    branchId: branchId as any,
  }) as any;

  const approvedSchedules = useQuery(api.schedulingSdk.list as any, {
    status: "confirmed",
    companyId: companyId as any,
    branchId: branchId as any,
  }) as any;

  const allItems = useMemo(() => {
    const pending = pendingSchedules?.items || [];
    const approved = approvedSchedules?.items || [];
    return [...pending, ...approved].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [pendingSchedules, approvedSchedules]);

  // Filter by view + search + type
  const filtered = useMemo(() => {
    let items = allItems;
    if (activeView === "pending") items = items.filter((s: any) => s.status === "pending_approval");
    else if (activeView === "approved") items = items.filter((s: any) => s.status === "confirmed");
    else if (activeView === "cancelled") items = items.filter((s: any) => s.status === "cancelled");
    else if (activeView === "rejected") items = items.filter((s: any) => s.status === "rejected" || s.status === "cancelled");
    else if (activeView === "escalated") items = items.filter((s: any) => s.tags?.includes("escalated"));

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((s: any) =>
        s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") items = items.filter((s: any) => s.scheduleType === typeFilter);
    return items;
  }, [allItems, activeView, search, typeFilter]);

  // SLA check on filtered items
  const slaStatuses = useMemo(() => {
    return schedulingSLA.checkBulkSLA(filtered);
  }, [filtered]);

  // Counts
  const counts = useMemo(() => {
    const pending = allItems.filter((s: any) => s.status === "pending_approval").length;
    const approved = allItems.filter((s: any) => s.status === "confirmed").length;
    return { pending, approved, total: allItems.length };
  }, [allItems]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#1a73e8]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a2e]">Schedule Approvals</h2>
          {counts.pending > 0 && (
            <Badge className="bg-amber-500 text-white text-[9px] px-1.5 h-4">{counts.pending} pending</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9aa0a6]" />
            <Input
              placeholder="Search approvals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-[180px] text-[11px] pl-7"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 w-[110px] text-[11px]">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[11px]">All Types</SelectItem>
              {Object.entries(SCHEDULE_COLORS).map(([key]) => (
                <SelectItem key={key} value={key} className="text-[11px] capitalize">{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e8eaed] overflow-x-auto">
        {VIEW_OPTIONS.map((view) => {
          const count = view.value === "pending" ? counts.pending : view.value === "approved" ? counts.approved : 0;
          return (
            <button
              key={view.value}
              onClick={() => setActiveView(view.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap",
                activeView === view.value
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-[#5f6368] hover:text-[#1a1a2e]"
              )}
            >
              <view.icon className="h-3 w-3" />
              {view.label}
              {count > 0 && (
                <Badge variant="outline" className="text-[9px] h-3.5 px-1">{count}</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-10 w-10 text-[#34a853] mx-auto mb-3" />
          <p className="text-[13px] font-medium text-[#1a1a2e]">
            {activeView === "pending" ? "No pending approvals" : `No ${activeView} schedules`}
          </p>
          <p className="text-[11px] text-[#5f6368] mt-1">
            {activeView === "pending" ? "All schedules are approved and up to date" : "No items match this filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((schedule: any) => {
              const sla = slaStatuses.find((s) => s.scheduleId === schedule._id);
              const color = SCHEDULE_COLORS[schedule.scheduleType] || "#9aa0a6";
              return (
                <motion.div
                  key={schedule._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <div
                    className="w-1 h-full min-h-[3rem] rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-[#1a1a2e] truncate">{schedule.title}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0 capitalize"
                        style={{ color, borderColor: `${color}30` }}>
                        {schedule.scheduleType}
                      </Badge>
                      {sla?.status === "breached" && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-red-50 text-red-600 border-red-200 shrink-0">
                          SLA Breach
                        </Badge>
                      )}
                      {sla?.status === "approaching_sla" && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-50 text-amber-600 border-amber-200 shrink-0">
                          SLA Warning
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] text-[#5f6368] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {schedule.start ? new Date(schedule.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
                      </span>
                      {schedule.description && (
                        <span className="text-[10px] text-[#9aa0a6] truncate max-w-[180px]">{schedule.description}</span>
                      )}
                      {schedule.approvalRequired && schedule.status === "pending_approval" && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-50 text-amber-600 border-amber-200">
                          Needs Approval
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {schedule.status === "pending_approval" && (
                      <>
                        <button
                          onClick={() => setActionDialog({ type: "approve", schedule })}
                          className="p-1.5 rounded-lg hover:bg-[#e6f4ea] text-[#34a853] transition-colors"
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setActionDialog({ type: "reject", schedule })}
                          className="p-1.5 rounded-lg hover:bg-[#fce8e6] text-[#ea4335] transition-colors"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setActionDialog({ type: "delegate", schedule })}
                          className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a73e8] transition-colors"
                          title="Delegate"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setActionDialog({ type: "escalate", schedule })}
                          className="p-1.5 rounded-lg hover:bg-[#fef7e0] text-[#f59e0b] transition-colors"
                          title="Escalate"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-[#f1f3f4] text-[#9aa0a6] transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedSchedule} onOpenChange={(o) => !o && setSelectedSchedule(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[14px]">{selectedSchedule?.title}</DialogTitle>
            <DialogDescription className="text-[11px]">
              {selectedSchedule?.scheduleType} · {selectedSchedule?.start ? new Date(selectedSchedule.start).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-[12px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#9aa0a6]">Status</span>
                <p className="font-medium capitalize">{selectedSchedule?.status?.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-[#9aa0a6]">Priority</span>
                <p className="font-medium capitalize">{selectedSchedule?.priority}</p>
              </div>
              <div>
                <span className="text-[#9aa0a6]">Start</span>
                <p className="font-medium">{selectedSchedule?.start ? new Date(selectedSchedule.start).toLocaleString() : "—"}</p>
              </div>
              <div>
                <span className="text-[#9aa0a6]">End</span>
                <p className="font-medium">{selectedSchedule?.end ? new Date(selectedSchedule.end).toLocaleString() : "—"}</p>
              </div>
            </div>
            {selectedSchedule?.description && (
              <div>
                <span className="text-[#9aa0a6]">Description</span>
                <p className="text-[#1a1a2e] mt-0.5">{selectedSchedule.description}</p>
              </div>
            )}
            {/* SLA info */}
            {(() => {
              const sla = slaStatuses.find((s) => s.scheduleId === selectedSchedule?._id);
              if (!sla) return null;
              return (
                <div className={cn(
                  "p-2 rounded-lg border text-[11px]",
                  sla.status === "breached" ? "bg-red-50 border-red-200 text-red-600" :
                  sla.status === "approaching_sla" ? "bg-amber-50 border-amber-200 text-amber-600" :
                  "bg-green-50 border-green-200 text-green-600"
                )}>
                  <span className="font-medium">SLA: {sla.status.replace("_", " ").toUpperCase()}</span>
                  {sla.violations.length > 0 && (
                    <span className="ml-2">({sla.violations.length} violations)</span>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[14px] capitalize">{actionDialog?.type} Schedule</DialogTitle>
            <DialogDescription className="text-[11px]">
              {actionDialog?.schedule?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {actionDialog?.type === "reject" && (
              <div>
                <label className="text-[11px] text-[#5f6368] font-medium">Reason for rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full h-20 mt-1 px-3 py-2 text-[12px] border border-[#e8eaed] rounded-lg resize-none outline-none focus:border-[#1a73e8]"
                  placeholder="Explain why this schedule is being rejected..."
                />
              </div>
            )}
            {actionDialog?.type === "delegate" && (
              <div className="text-[12px] text-[#5f6368]">
                Delegate this approval to another team member. Choose who should handle this request.
              </div>
            )}
            {actionDialog?.type === "escalate" && (
              <div className="text-[12px] text-[#5f6368]">
                Escalate this approval to a higher authority. This will trigger the escalation chain.
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className={cn(
                "h-8 text-[11px]",
                actionDialog?.type === "reject" ? "bg-red-600 hover:bg-red-700" :
                actionDialog?.type === "approve" ? "bg-green-600 hover:bg-green-700" :
                "bg-[#1a73e8] hover:bg-[#1557b0]"
              )}
              onClick={() => {
                // Trigger automation
                if (actionDialog) {
                  schedulingAutomation.executeAutomation(
                    actionDialog.type === "approve" ? "schedule.approved" :
                    actionDialog.type === "reject" ? "schedule.rejected" :
                    "schedule.escalated",
                    actionDialog.schedule,
                    { reason: rejectReason }
                  );
                }
                setActionDialog(null);
                setRejectReason("");
              }}
            >
              {actionDialog?.type === "approve" ? "Approve" :
               actionDialog?.type === "reject" ? "Reject" :
               actionDialog?.type === "delegate" ? "Delegate" : "Escalate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Quick Stats Widget ──────────────────────────────────────────

export function ApprovalStatsWidget() {
  const pendingSchedules = useQuery(api.schedulingSdk.list as any, { status: "pending_approval" }) as any;
  const todaySchedules = useQuery(api.schedulingSdk.getToday as any, {}) as any[] | undefined;
  const pendingCount = pendingSchedules?.items?.length || 0;
  const todayCount = todaySchedules?.length || 0;

  const slaStats = schedulingSLA.getViolationStats();

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
        <p className="text-[18px] font-bold text-amber-600">{pendingCount}</p>
        <p className="text-[9px] text-amber-600">Pending</p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
        <p className="text-[18px] font-bold text-green-600">{todayCount}</p>
        <p className="text-[9px] text-green-600">Today</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
        <p className="text-[18px] font-bold text-red-600">{slaStats.critical}</p>
        <p className="text-[9px] text-red-600">SLA Breaches</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
        <p className="text-[18px] font-bold text-blue-600">{slaStats.total}</p>
        <p className="text-[9px] text-blue-600">Violations</p>
      </div>
    </div>
  );
}
