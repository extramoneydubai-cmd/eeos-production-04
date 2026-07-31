import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  SearchX,
  Undo2,
  XCircle,
} from "lucide-react";

type RefundStatus = "draft" | "pending" | "approved" | "rejected" | "processing" | "completed";

const STATUS_COLORS: Record<RefundStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  administrative: "Administrative",
  financial: "Financial",
  withdrawal: "Withdrawal",
  other: "Other",
};

interface RefundRow {
  _id: string;
  amount: number;
  reason: string;
  reasonCategory?: string;
  status: RefundStatus;
  refundMethod?: string;
  refundReference?: string;
  notes?: string;
  studentId?: string;
  createdAt: number;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="p-3 rounded-full bg-[#f1f3f4] mb-3">
        <SearchX className="h-8 w-8 text-[#9aa0a6]" />
      </div>
      <p className="text-[13px] font-medium text-[#1a1a2e]">{title}</p>
      <p className="text-[11px] text-[#9aa0a6] mt-1 max-w-[340px]">{description}</p>
    </div>
  );
}

function fmt(n?: number) {
  return n ? `₹${n.toLocaleString()}` : "₹0";
}

export default function RefundCenter() {
  // ─── SDK-backed data (via financeSdk) ────────────────────────────
  const summary = useQuery(api.platform.sdk.financeSdk.getRefundSummary) as
    | Record<string, number>
    | undefined;
  const refunds = useQuery(api.platform.sdk.financeSdk.listRefunds, {}) as RefundRow[] | undefined;

  const createRefund = useMutation(api.platform.sdk.financeSdk.createRefundRequest);
  const submitRefund = useMutation(api.platform.sdk.financeSdk.submitRefundForApproval);
  const decideRefund = useMutation(api.platform.sdk.financeSdk.approveRefund);
  const processRefund = useMutation(api.platform.sdk.financeSdk.processRefund);
  const completeRefund = useMutation(api.platform.sdk.financeSdk.completeRefund);

  // ─── UI state ────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // New-refund form state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    reason: "",
    reasonCategory: "withdrawal",
    notes: "",
  });

  const filtered = useMemo(() => {
    if (!refunds) return [];
    let list = refunds;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          (r.refundReference || "").toLowerCase().includes(q) ||
          (r.studentId || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [refunds, statusFilter, search]);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    setBusy("create");
    try {
      await createRefund({
        amount,
        reason: form.reason,
        reasonCategory: form.reasonCategory as "academic" | "administrative" | "financial" | "withdrawal" | "other",
        notes: form.notes || undefined,
      });
      setForm({ amount: "", reason: "", reasonCategory: "withdrawal", notes: "" });
      setOpen(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refund Center</h1>
          <p className="text-sm text-muted-foreground">
            Manage the full refund lifecycle — request → approval → processing → completion
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Refund Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create Refund Request</DialogTitle>
              <DialogDescription>
                Submit a refund request. It enters the approval workflow after submission.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="25000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.reasonCategory} onValueChange={(v) => setForm({ ...form, reasonCategory: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input
                  placeholder="Course withdrawal, duplicate payment..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Optional supporting notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={busy === "create" || !form.amount || !form.reason}>
                {busy === "create" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{summary?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{summary?.pending ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{summary?.processing ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{summary?.approved ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-700">{summary?.completed ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-rose-600">{summary?.rejected ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Refund Requests</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reason, ref, student..."
                  className="w-[240px] pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!refunds ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No refund requests"
              description="Create a refund request to start the approval and processing workflow."
            />
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2.5 text-left font-medium">Amount</th>
                    <th className="p-2.5 text-left font-medium">Category</th>
                    <th className="p-2.5 text-left font-medium">Reason</th>
                    <th className="p-2.5 text-left font-medium">Status</th>
                    <th className="p-2.5 text-left font-medium">Method</th>
                    <th className="p-2.5 text-left font-medium">Created</th>
                    <th className="p-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r._id} className="border-b last:border-0">
                      <td className="p-2.5 font-semibold">{fmt(r.amount)}</td>
                      <td className="p-2.5">
                        <Badge variant="outline">{CATEGORY_LABELS[r.reasonCategory || "other"]}</Badge>
                      </td>
                      <td className="p-2.5 max-w-[220px] truncate text-muted-foreground">{r.reason}</td>
                      <td className="p-2.5">
                        <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                      </td>
                      <td className="p-2.5 text-muted-foreground">{r.refundMethod || "—"}</td>
                      <td className="p-2.5 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === r._id}
                              onClick={() => run(r._id, () => submitRefund({ id: r._id as any }))}
                            >
                              <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Submit
                            </Button>
                          )}
                          {r.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                disabled={busy === r._id}
                                onClick={() => run(r._id, () => decideRefund({ id: r._id as any, approve: true }))}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600"
                                disabled={busy === r._id}
                                onClick={() => run(r._id, () => decideRefund({ id: r._id as any, approve: false }))}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === r._id}
                              onClick={() => run(r._id, () => processRefund({ id: r._id as any, refundMethod: "bank_transfer" }))}
                            >
                              <Banknote className="mr-1 h-3.5 w-3.5" /> Process
                            </Button>
                          )}
                          {r.status === "processing" && (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={busy === r._id}
                              onClick={() => run(r._id, () => completeRefund({ id: r._id as any }))}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
                            </Button>
                          )}
                          {r.status === "rejected" && (
                            <span className="flex items-center text-xs text-muted-foreground">
                              <Undo2 className="mr-1 h-3.5 w-3.5" /> Closed
                            </span>
                          )}
                          {r.status === "completed" && (
                            <span className="flex items-center text-xs text-green-600">
                              <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline helper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Refund Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground">
            <Badge variant="secondary">Draft</Badge>
            <ArrowUpRight className="h-3.5 w-3.5" />
            <Badge variant="secondary">Pending Approval</Badge>
            <ArrowUpRight className="h-3.5 w-3.5" />
            <Badge variant="secondary">Approved</Badge>
            <ArrowUpRight className="h-3.5 w-3.5" />
            <Badge variant="secondary">Processing</Badge>
            <ArrowUpRight className="h-3.5 w-3.5" />
            <Badge variant="secondary">Completed</Badge>
            <span className="ml-3 inline-flex items-center gap-1 text-muted-foreground/70">
              <Clock className="h-3.5 w-3.5" /> Eligibility & rules evaluated via RuleRuntime on submission
            </span>
            <RefreshCcw className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
