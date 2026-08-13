import { useMemo, useState, type ElementType } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  Hourglass,
  PlusCircle,
  XCircle,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  rejected: "bg-red-500/10 text-red-700 border-red-200",
  cancelled: "bg-gray-500/10 text-gray-600 border-gray-200",
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`p-4 border-border/40 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
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

export default function LeaveManagementPage() {
  const [tab, setTab] = useState("applications");
  const [statusFilter, setStatusFilter] = useState("all");

  const users = useQuery(api.users.listUsers);
  const leaveTypes = useQuery(api.leaveEngine.listLeaveTypes);
  const applications = useQuery(api.leaveEngine.listLeaveApplications, {
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
  });

  const applyLeave = useMutation(api.leaveEngine.applyLeave);
  const approveLeave = useMutation(api.leaveEngine.approveLeave);
  const createLeaveType = useMutation(api.leaveEngine.createLeaveType);

  // ── Apply form state ──
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Leave type form state ──
  const [ltName, setLtName] = useState("");
  const [ltCode, setLtCode] = useState("");
  const [ltAllowance, setLtAllowance] = useState("12");
  const [ltRequiresApproval, setLtRequiresApproval] = useState("true");

  // ── Balances state ──
  const [balanceEmployeeId, setBalanceEmployeeId] = useState("");
  const balances = useQuery(
    api.leaveEngine.getLeaveBalance,
    balanceEmployeeId ? { employeeId: balanceEmployeeId as any } : "skip"
  );

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    (users || []).forEach((u: any) => map.set(u._id, u));
    return map;
  }, [users]);

  const typeMap = useMemo(() => {
    const map = new Map<string, any>();
    (leaveTypes || []).forEach((t: any) => map.set(t._id, t));
    return map;
  }, [leaveTypes]);

  const pendingCount = (applications || []).filter((a: any) => a.status === "pending").length;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayEnd = new Date().setHours(23, 59, 59, 999);
  const onLeaveToday = (applications || []).filter(
    (a: any) =>
      a.status === "approved" && a.startDate <= todayEnd && a.endDate >= todayStart
  ).length;

  const handleApply = async () => {
    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      toast.error("Please fill employee, leave type, and dates");
      return;
    }
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) {
      toast.error("End date must be after start date");
      return;
    }
    setSubmitting(true);
    try {
      await applyLeave({
        employeeId: employeeId as any,
        leaveTypeId: leaveTypeId as any,
        startDate: start,
        endDate: end,
        reason: reason || "No reason provided",
      });
      toast.success("Leave application submitted");
      setEmployeeId("");
      setLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply for leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecide = async (id: string, approve: boolean) => {
    try {
      await approveLeave({ id: id as any, approve });
      toast.success(approve ? "Leave approved" : "Leave rejected");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update leave");
    }
  };

  const handleCreateLeaveType = async () => {
    if (!ltName || !ltCode || !ltAllowance) {
      toast.error("Name, code, and allowance are required");
      return;
    }
    try {
      await createLeaveType({
        name: ltName,
        code: ltCode,
        annualAllowance: Number(ltAllowance),
        requiresApproval: ltRequiresApproval === "true",
      });
      toast.success("Leave type created");
      setLtName("");
      setLtCode("");
      setLtAllowance("12");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create leave type");
    }
  };

  return (
    <WorkspaceShell
      title="Leave Management"
      subtitle="Leave applications, balances, and policies"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Applications"
          value={pendingCount}
          icon={Hourglass}
          color="bg-amber-500"
          onClick={() => {
            setTab("applications");
            setStatusFilter("pending");
          }}
        />
        <StatCard
          title="Approved This Period"
          value={(applications || []).filter((a: any) => a.status === "approved").length}
          icon={CheckCircle2}
          color="bg-emerald-500"
          onClick={() => {
            setTab("applications");
            setStatusFilter("approved");
          }}
        />
        <StatCard
          title="On Leave Today"
          value={onLeaveToday}
          icon={CalendarDays}
          color="bg-blue-500"
        />
        <StatCard
          title="Leave Types"
          value={(leaveTypes || []).length}
          icon={Coins}
          color="bg-purple-500"
          onClick={() => setTab("types")}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="applications">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Applications
          </TabsTrigger>
          <TabsTrigger value="apply">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Apply Leave
          </TabsTrigger>
          <TabsTrigger value="types">
            <Coins className="h-3.5 w-3.5 mr-1.5" /> Leave Types
          </TabsTrigger>
          <TabsTrigger value="balances">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Balances
          </TabsTrigger>
        </TabsList>

        {/* ── Applications ── */}
        <TabsContent value="applications">
          <Card className="border-border/40">
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold">Applications</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(applications || []).map((app: any) => {
                  const user = userMap.get(app.employeeId);
                  const type = typeMap.get(app.leaveTypeId);
                  return (
                    <TableRow key={app._id}>
                      <TableCell className="font-medium">{user?.name || "Unknown"}</TableCell>
                      <TableCell>{type?.name || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(app.startDate)} → {formatDate(app.endDate)}
                      </TableCell>
                      <TableCell>{app.days}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{app.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border ${STATUS_COLORS[app.status] || ""}`}
                        >
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {app.status === "pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={() => handleDecide(app._id, true)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] text-red-600"
                              onClick={() => handleDecide(app._id, false)}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {app.approvedAt ? formatDate(app.approvedAt) : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!applications || applications.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                      No leave applications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Apply Leave ── */}
        <TabsContent value="apply">
          <Card className="border-border/40 max-w-2xl">
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users || []).map((u: any) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name || u.email || u._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Leave Type</Label>
                  <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(leaveTypes || []).map((t: any) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name} ({t.annualAllowance} days/yr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for leave"
                />
              </div>
              <Button onClick={handleApply} disabled={submitting}>
                <PlusCircle className="h-4 w-4 mr-1.5" />
                {submitting ? "Submitting…" : "Submit Leave Application"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Leave Types ── */}
        <TabsContent value="types">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-border/40 lg:col-span-2">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Leave Types</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Annual Allowance</TableHead>
                    <TableHead>Requires Approval</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(leaveTypes || []).map((t: any) => (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.code}</TableCell>
                      <TableCell>{t.annualAllowance} days</TableCell>
                      <TableCell>{t.requiresApproval ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Badge variant={t.isActive ? "success" : "outline"} className="text-[10px]">
                          {t.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!leaveTypes || leaveTypes.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        No leave types configured — create one on the right
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="border-border/40 h-fit">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Create Leave Type</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input value={ltName} onChange={(e) => setLtName(e.target.value)} placeholder="e.g. Sick Leave" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Code</Label>
                  <Input value={ltCode} onChange={(e) => setLtCode(e.target.value)} placeholder="e.g. SL" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Annual Allowance (days)</Label>
                  <Input
                    type="number"
                    value={ltAllowance}
                    onChange={(e) => setLtAllowance(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Requires Approval</Label>
                  <Select value={ltRequiresApproval} onValueChange={setLtRequiresApproval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreateLeaveType}>
                  <PlusCircle className="h-4 w-4 mr-1.5" /> Create Leave Type
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Balances ── */}
        <TabsContent value="balances">
          <Card className="border-border/40">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-semibold">Leave Balances</p>
                <Select value={balanceEmployeeId} onValueChange={setBalanceEmployeeId}>
                  <SelectTrigger className="w-64 h-8 text-xs">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {(users || []).map((u: any) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name || u.email || u._id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(balances || []).map((b: any) => {
                  const type = typeMap.get(b.leaveTypeId);
                  return (
                    <TableRow key={b._id}>
                      <TableCell className="font-medium">{type?.name || b.leaveTypeId}</TableCell>
                      <TableCell className="text-emerald-600 font-semibold">{b.balance} days</TableCell>
                      <TableCell>{b.used} days</TableCell>
                      <TableCell>{b.year}</TableCell>
                    </TableRow>
                  );
                })}
                {balances !== undefined && balances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                      Select an employee to view balances
                    </TableCell>
                  </TableRow>
                )}
                {!balanceEmployeeId && balances === undefined && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                      Select an employee to view balances
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
