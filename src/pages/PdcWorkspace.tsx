import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Send,
  Wallet,
} from "lucide-react";

type ChequeStatus = "received" | "deposited" | "cleared" | "bounced";

const STATUS_COLORS: Record<ChequeStatus, string> = {
  received: "bg-slate-100 text-slate-700",
  deposited: "bg-blue-100 text-blue-700",
  cleared: "bg-emerald-100 text-emerald-700",
  bounced: "bg-rose-100 text-rose-700",
};

interface ChequeRow {
  _id: string;
  chequeRef?: string;
  chequeNumber: string;
  bankName: string;
  bankBranch?: string;
  amount: number;
  status: ChequeStatus;
  bounceCount?: number;
  bounceReason?: string;
  studentId?: string;
  invoiceId?: string;
  depositDate?: number;
  clearanceDate?: number;
  createdAt: number;
}

interface PenaltyRow {
  _id: string;
  amount: number;
  reason: string;
  status: "pending" | "waived" | "collected";
  createdAt: number;
}

interface ChequeDashboard {
  total: number;
  received: number;
  deposited: number;
  cleared: number;
  bounced: number;
  totalValue: number;
  bouncedValue: number;
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

export default function PdcWorkspace() {
  // ─── SDK-backed data (via financeSdk → chequeEngine) ─────────────
  const dashboard = useQuery(api.chequeEngine.getChequeDashboard) as
    | ChequeDashboard
    | undefined;
  const cheques = useQuery(api.chequeEngine.listCheques, {}) as ChequeRow[] | undefined;
  const penalties = useQuery(api.chequeEngine.listPenalties, {}) as PenaltyRow[] | undefined;

  const createCheque = useMutation(api.chequeEngine.createChequeEntry);
  const depositCheque = useMutation(api.chequeEngine.depositCheque);
  const clearCheque = useMutation(api.chequeEngine.clearCheque);
  const bounceCheque = useMutation(api.chequeEngine.bounceCheque);
  const rePresentCheque = useMutation(api.chequeEngine.rePresentCheque);
  const waivePenalty = useMutation(api.chequeEngine.waivePenalty);
  const collectPenalty = useMutation(api.chequeEngine.collectPenalty);

  // ─── UI state ────────────────────────────────────────────────────
  const [tab, setTab] = useState("cheques");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    chequeNumber: "",
    bankName: "",
    bankBranch: "",
    amount: "",
    chequeDate: new Date().toISOString().split("T")[0],
  });

  const filtered = useMemo(() => {
    if (!cheques) return [];
    let list = cheques;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.chequeNumber.toLowerCase().includes(q) ||
          c.bankName.toLowerCase().includes(q) ||
          (c.chequeRef || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [cheques, statusFilter, search]);

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
    if (!amount || amount <= 0 || !form.chequeNumber || !form.bankName) return;
    setBusy("create");
    try {
      await createCheque({
        chequeNumber: form.chequeNumber,
        bankName: form.bankName,
        bankBranch: form.bankBranch || undefined,
        amount,
        chequeDate: new Date(form.chequeDate).getTime(),
      });
      setForm({
        chequeNumber: "",
        bankName: "",
        bankBranch: "",
        amount: "",
        chequeDate: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const pendingPenalties = penalties?.filter((p) => p.status === "pending") || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PDC & Cheque Management</h1>
          <p className="text-sm text-muted-foreground">
            Post-dated cheque lifecycle — receive, deposit, clear, bounce, re-present & penalties
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Receive Cheque
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Receive PDC / Cheque</DialogTitle>
              <DialogDescription>
                Record a cheque received from a student or payer. It starts in "received" status.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cheque Number</Label>
                  <Input
                    placeholder="000123"
                    value={form.chequeNumber}
                    onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bank Name</Label>
                <Input
                  placeholder="HDFC Bank"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Branch (optional)</Label>
                  <Input
                    placeholder="MG Road"
                    value={form.bankBranch}
                    onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cheque Date</Label>
                  <Input
                    type="date"
                    value={form.chequeDate}
                    onChange={(e) => setForm({ ...form, chequeDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={busy === "create" || !form.chequeNumber || !form.bankName || !form.amount}>
                {busy === "create" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Record Cheque
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Cheques</p>
            <p className="text-2xl font-bold">{dashboard?.total ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">{fmt(dashboard?.totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Received</p>
            <p className="text-2xl font-bold">{dashboard?.received ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Deposited</p>
            <p className="text-2xl font-bold text-blue-600">{dashboard?.deposited ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cleared</p>
            <p className="text-2xl font-bold text-emerald-600">{dashboard?.cleared ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bounced</p>
            <p className="text-2xl font-bold text-rose-600">{dashboard?.bounced ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">{fmt(dashboard?.bouncedValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Penalties Due</p>
            <p className="text-2xl font-bold text-amber-600">{pendingPenalties.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="cheques">
            <Landmark className="mr-1 h-4 w-4" /> Cheques
          </TabsTrigger>
          <TabsTrigger value="penalties">
            <AlertTriangle className="mr-1 h-4 w-4" /> Penalties
            {pendingPenalties.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                {pendingPenalties.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cheques" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Cheque Register</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cheque no, bank, ref..."
                      className="w-[240px] pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="deposited">Deposited</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!cheques ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No cheques found"
                  description="Receive a cheque to begin the PDC lifecycle. Bounced cheques automatically create penalties."
                />
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2.5 text-left font-medium">Ref</th>
                        <th className="p-2.5 text-left font-medium">Cheque No</th>
                        <th className="p-2.5 text-left font-medium">Bank</th>
                        <th className="p-2.5 text-left font-medium">Amount</th>
                        <th className="p-2.5 text-left font-medium">Status</th>
                        <th className="p-2.5 text-left font-medium">Bounces</th>
                        <th className="p-2.5 text-left font-medium">Received</th>
                        <th className="p-2.5 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c._id} className="border-b last:border-0">
                          <td className="p-2.5 font-mono text-xs">{c.chequeRef || "—"}</td>
                          <td className="p-2.5 font-mono">{c.chequeNumber}</td>
                          <td className="p-2.5">
                            <div className="font-medium">{c.bankName}</div>
                            {c.bankBranch && <div className="text-[11px] text-muted-foreground">{c.bankBranch}</div>}
                          </td>
                          <td className="p-2.5 font-semibold">{fmt(c.amount)}</td>
                          <td className="p-2.5">
                            <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
                            {c.status === "bounced" && c.bounceReason && (
                              <p className="mt-1 max-w-[160px] truncate text-[11px] text-rose-600">{c.bounceReason}</p>
                            )}
                          </td>
                          <td className="p-2.5">
                            {c.bounceCount ? (
                              <Badge variant="outline" className="text-rose-600">
                                {c.bounceCount}x
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {c.status === "received" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy === c._id}
                                  onClick={() => run(c._id, () => depositCheque({ id: c._id as any, depositDate: Date.now() }))}
                                >
                                  <Send className="mr-1 h-3.5 w-3.5" /> Deposit
                                </Button>
                              )}
                              {c.status === "deposited" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={busy === c._id}
                                    onClick={() => run(c._id, () => clearCheque({ id: c._id as any }))}
                                  >
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Clear
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600"
                                    disabled={busy === c._id}
                                    onClick={() =>
                                      run(c._id, () =>
                                        bounceCheque({
                                          id: c._id as any,
                                          bounceReason: "Insufficient funds",
                                          penaltyAmount: Math.round(c.amount * 0.02),
                                        })
                                      )
                                    }
                                  >
                                    <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Bounce
                                  </Button>
                                </>
                              )}
                              {c.status === "bounced" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy === c._id}
                                  onClick={() => run(c._id, () => rePresentCheque({ id: c._id as any, newDepositDate: Date.now() + 7 * 86400000 }))}
                                >
                                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Re-present
                                </Button>
                              )}
                              {c.status === "cleared" && (
                                <span className="flex items-center text-xs text-emerald-600">
                                  <CircleDollarSign className="mr-1 h-3.5 w-3.5" /> Realized
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
        </TabsContent>

        <TabsContent value="penalties" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bounce Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              {!penalties ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : penalties.length === 0 ? (
                <EmptyState
                  title="No penalties"
                  description="Penalties are created automatically when a cheque bounces."
                />
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2.5 text-left font-medium">Amount</th>
                        <th className="p-2.5 text-left font-medium">Reason</th>
                        <th className="p-2.5 text-left font-medium">Status</th>
                        <th className="p-2.5 text-left font-medium">Date</th>
                        <th className="p-2.5 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {penalties.map((p) => (
                        <tr key={p._id} className="border-b last:border-0">
                          <td className="p-2.5 font-semibold">{fmt(p.amount)}</td>
                          <td className="p-2.5 max-w-[280px] truncate text-muted-foreground">{p.reason}</td>
                          <td className="p-2.5">
                            <Badge
                              variant={p.status === "collected" ? "default" : p.status === "waived" ? "outline" : "secondary"}
                              className={p.status === "pending" ? "bg-amber-100 text-amber-700" : undefined}
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="p-2.5">
                            {p.status === "pending" && (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={busy === p._id}
                                  onClick={() => run(p._id, () => collectPenalty({ id: p._id as any }))}
                                >
                                  <Wallet className="mr-1 h-3.5 w-3.5" /> Collect
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy === p._id}
                                  onClick={() => run(p._id, () => waivePenalty({ id: p._id as any }))}
                                >
                                  Waive
                                </Button>
                              </div>
                            )}
                            {p.status !== "pending" && (
                              <span className="flex items-center justify-end text-xs text-muted-foreground">
                                <Banknote className="mr-1 h-3.5 w-3.5" /> {p.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
