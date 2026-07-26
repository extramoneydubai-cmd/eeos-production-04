/**
 * ExpenseWorkspace — Enterprise Expense Detail Workspace
 *
 * Uses WorkspaceShell from PATCH-UI-001.
 * Consumes financePlatform mutations for approval workflow.
 * No duplicated finance logic.
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  WorkspaceShell, WorkspaceTimelineTab, WorkspaceDocumentsTab,
  WorkspaceActivityTab, WorkspaceNotesTab,
} from "@/components/workspace";
import {
  Receipt, CheckCircle2, XCircle, Clock, DollarSign, Calendar,
  User, FileText, ArrowLeft, Printer, Download, AlertCircle,
  RefreshCw, Building2, Hash, Tag,
} from "lucide-react";
import type { WorkspaceTabDefinition, WorkspaceAction, WorkspaceHeaderField } from "@/components/workspace";

function ExpenseOverviewTab({ entity }: { entity: any }) {
  if (!entity) return null;
  const exp = entity as any;

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400",
    pending_approval: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold">Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Description</span>
              <span className="text-[11px] font-medium text-foreground text-right max-w-[60%]">{exp.description || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Amount</span>
              <span className="text-[11px] font-semibold text-red-600">₹{(exp.amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Expense Date</span>
              <span className="text-[11px] font-medium">{exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Status</span>
              <Badge className={`text-[9px] px-1.5 py-0 h-4 font-normal ${statusColors[exp.status]}`}>{exp.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Recurring</span>
              <span className="text-[11px] font-medium">{exp.isRecurring ? `Yes (${exp.recurringFrequency || "—"})` : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Vendor</span>
              <span className="text-[11px] font-medium">{exp.vendorName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Bill Reference</span>
              <span className="text-[11px] font-medium">{exp.billReference || "—"}</span>
            </div>
            {exp.approvedBy && (
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">Approved By</span>
                <span className="text-[11px] font-medium">{exp.approvedBy}</span>
              </div>
            )}
            {exp.approvedAt && (
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">Approved At</span>
                <span className="text-[11px] font-medium">{new Date(exp.approvedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold">Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Branch</span>
              <span className="text-[11px] font-medium">{exp.branchId || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Department</span>
              <span className="text-[11px] font-medium">{exp.departmentId || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Category</span>
              <span className="text-[11px] font-medium">{exp.expenseCategoryId || "Uncategorized"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Created By</span>
              <span className="text-[11px] font-medium">{exp.createdByName || exp.createdBy || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Created At</span>
              <span className="text-[11px] font-medium">{exp.createdAt ? new Date(exp.createdAt).toLocaleString() : "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {exp.attachmentUrl && (
        <Card className="border-border/50 bg-card md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Attachment</CardTitle>
          </CardHeader>
          <CardContent>
            <a href={exp.attachmentUrl} target="_blank" rel="noopener noreferrer"
               className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> View Attachment
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ExpenseWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [approvalNotes, setApprovalNotes] = useState("");

  const expenses = useQuery(api.financePlatform.listExpensesPaginated, { limit: 1 });
  const expenseData = expenses?.items?.find((e: any) => e._id === id);

  const approveExpense = useMutation(api.financePlatform.approveExpenseWithWorkflow);

  const handleApprove = async (approved: boolean) => {
    if (!id) return;
    try {
      await approveExpense({ id: id as any, approved, notes: approvalNotes || undefined });
      toast.success(approved ? "Expense approved" : "Expense rejected");
    } catch (e) {
      toast.error("Failed to process approval");
    }
  };

  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: Receipt, component: () => <ExpenseOverviewTab entity={expenseData} /> },
    { id: "approval", label: "Approval", icon: CheckCircle2, component: () => (
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold">Expense Approval</CardTitle>
          <CardDescription className="text-[10px]">Approve or reject this expense</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Approval notes (optional)"
            className="text-xs min-h-[80px]"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleApprove(true)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" className="h-8 text-xs"
              onClick={() => handleApprove(false)}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    )},
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "timeline", label: "Timeline", icon: Calendar, component: WorkspaceTimelineTab },
    { id: "activity", label: "Activity", icon: RefreshCw, component: WorkspaceActivityTab },
    { id: "notes", label: "Notes", icon: FileText, component: WorkspaceNotesTab },
  ];

  const actions: WorkspaceAction[] = [];

  const headerFields: WorkspaceHeaderField[] = expenseData ? [
    { label: "Amount", value: `₹${(expenseData.amount || 0).toLocaleString()}`, icon: DollarSign, color: "bg-red-100 dark:bg-red-900/30" },
    { label: "Date", value: expenseData.expenseDate ? new Date(expenseData.expenseDate).toLocaleDateString() : "—", icon: Calendar, color: "bg-blue-100 dark:bg-blue-900/30" },
    { label: "Vendor", value: expenseData.vendorName || "—", icon: Building2, color: "bg-purple-100 dark:bg-purple-900/30" },
  ] : [];

  return (
    <WorkspaceShell
      entityType="invoice"
      entityId={id || ""}
      entity={expenseData}
      isLoading={!expenseData && !expenses}
      title={expenseData?.description?.slice(0, 60) || "Expense"}
      subtitle="Expense Detail"
      badge={expenseData ? {
        label: expenseData.status || "draft",
        color: expenseData.status === "approved" || expenseData.status === "paid" ? "bg-emerald-500" :
               expenseData.status === "rejected" ? "bg-red-500" :
               expenseData.status === "pending_approval" ? "bg-amber-500" : "bg-slate-500",
      } : undefined}
      headerFields={headerFields}
      avatarInitials="E"
      tabs={tabs}
      actions={actions}
      module="finance"
      backLink={{ label: "Back to Finance", onClick: () => navigate("/finance") }}
    />
  );
}
