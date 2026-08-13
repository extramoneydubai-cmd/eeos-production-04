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
import { Checkbox } from "@/components/ui/checkbox";
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
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  PlusCircle,
  Wallet,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PAYSLIP_STATUS_COLORS: Record<string, string> = {
  processing: "bg-amber-500/10 text-amber-700 border-amber-200",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  paid: "bg-blue-500/10 text-blue-700 border-blue-200",
};

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

function formatMoney(value: number | undefined | null) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthYear(month: number, year: number) {
  return `${MONTHS[(month || 1) - 1]} ${year}`;
}

export default function PayrollPage() {
  const [tab, setTab] = useState("payslips");
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [payrunMonth, setPayrunMonth] = useState(String(now.getMonth() + 1));
  const [payrunYear, setPayrunYear] = useState(String(now.getFullYear()));

  const users = useQuery(api.users.listUsers);
  const payslips = useQuery(api.payrollEngine.listPayslips, {
    month: Number(filterMonth),
    year: Number(filterYear),
  });
  const salaryStructures = useQuery(api.payrollEngine.listSalaryStructures, {
    isActive: true,
  });

  const processPayRun = useMutation(api.payrollEngine.processPayRun);
  const approvePayRun = useMutation(api.payrollEngine.approvePayRun);
  const createSalaryStructure = useMutation(api.payrollEngine.createSalaryStructure);

  // ── Pay run selection ──
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [runningPayrun, setRunningPayrun] = useState(false);

  // ── Salary structure form ──
  const [ssEmployeeId, setSsEmployeeId] = useState("");
  const [ssBasic, setSsBasic] = useState("");
  const [ssHra, setSsHra] = useState("");
  const [ssAllowances, setSsAllowances] = useState("");
  const [ssDeductions, setSsDeductions] = useState("");
  const [ssEffectiveFrom, setSsEffectiveFrom] = useState(now.toISOString().split("T")[0]);
  const [creatingStructure, setCreatingStructure] = useState(false);

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    (users || []).forEach((u: any) => map.set(u._id, u));
    return map;
  }, [users]);

  const structureEmployeeIds = useMemo(
    () => new Set((salaryStructures || []).map((s: any) => s.employeeId)),
    [salaryStructures]
  );

  const currentPayslips = payslips || [];
  const grossTotal = currentPayslips.reduce((s: number, p: any) => s + (p.grossSalary || 0), 0);
  const netTotal = currentPayslips.reduce((s: number, p: any) => s + (p.netPayable || 0), 0);
  const processingCount = currentPayslips.filter((p: any) => p.status === "processing").length;
  const approvedCount = currentPayslips.filter((p: any) => p.status === "approved").length;

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!users) return;
    const allIds = (users as any[]).map((u) => u._id);
    setSelectedEmployeeIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const handleRunPayroll = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error("Select at least one employee");
      return;
    }
    setRunningPayrun(true);
    try {
      const created = await processPayRun({
        month: Number(payrunMonth),
        year: Number(payrunYear),
        employeeIds: selectedEmployeeIds as any,
      });
      toast.success(`Pay run processed — ${created.length} payslips generated`);
      setSelectedEmployeeIds([]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to process pay run");
    } finally {
      setRunningPayrun(false);
    }
  };

  const handleApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await approvePayRun({ payslipIds: ids as any });
      toast.success(`${ids.length} payslips approved`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve payslips");
    }
  };

  const handleCreateStructure = async () => {
    if (!ssEmployeeId || !ssBasic) {
      toast.error("Employee and basic salary are required");
      return;
    }
    const parseEntries = (raw: string) =>
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const [name, amount] = s.split(":");
          return { name: (name || "Other").trim(), amount: Number(amount) || 0 };
        });

    setCreatingStructure(true);
    try {
      await createSalaryStructure({
        employeeId: ssEmployeeId as any,
        basicSalary: Number(ssBasic),
        hra: ssHra ? Number(ssHra) : undefined,
        allowances: parseEntries(ssAllowances),
        deductions: parseEntries(ssDeductions),
        effectiveFrom: new Date(ssEffectiveFrom).getTime(),
      });
      toast.success("Salary structure created");
      setSsEmployeeId("");
      setSsBasic("");
      setSsHra("");
      setSsAllowances("");
      setSsDeductions("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create salary structure");
    } finally {
      setCreatingStructure(false);
    }
  };

  return (
    <WorkspaceShell
      title="Payroll & Salary"
      subtitle="Salary structures, monthly pay runs, and payslips"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={`Gross Payroll · ${formatMonthYear(Number(filterMonth), Number(filterYear))}`}
          value={formatMoney(grossTotal)}
          icon={Wallet}
          color="bg-purple-500"
        />
        <StatCard
          title="Net Payable"
          value={formatMoney(netTotal)}
          icon={Banknote}
          color="bg-emerald-500"
        />
        <StatCard
          title="Processing"
          value={processingCount}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Approved Payslips"
          value={approvedCount}
          icon={CheckCircle2}
          color="bg-blue-500"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="payslips">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Payslips
          </TabsTrigger>
          <TabsTrigger value="run">
            <PlayCircle className="h-3.5 w-3.5 mr-1.5" /> Run Payroll
          </TabsTrigger>
          <TabsTrigger value="structures">
            <Banknote className="h-3.5 w-3.5 mr-1.5" /> Salary Structures
          </TabsTrigger>
        </TabsList>

        {/* ── Payslips ── */}
        <TabsContent value="payslips">
          <Card className="border-border/40">
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold">Payslips</p>
              <div className="flex items-center gap-2">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-24 h-8 text-xs"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                />
                {processingCount > 0 && (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      handleApprove(
                        currentPayslips
                          .filter((p: any) => p.status === "processing")
                          .map((p: any) => p._id)
                      )
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve All ({processingCount})
                  </Button>
                )}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Payable</TableHead>
                  <TableHead>Absences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPayslips.map((p: any) => {
                  const user = userMap.get(p.employeeId);
                  return (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{user?.name || "Unknown"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatMonthYear(p.month, p.year)}
                      </TableCell>
                      <TableCell>{formatMoney(p.grossSalary)}</TableCell>
                      <TableCell>{formatMoney(p.totalDeductions)}</TableCell>
                      <TableCell className="font-semibold">{formatMoney(p.netPayable)}</TableCell>
                      <TableCell>{p.absenceDays ?? 0}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border ${PAYSLIP_STATUS_COLORS[p.status] || ""}`}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "processing" && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => handleApprove([p._id])}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!payslips && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                      Loading payslips…
                    </TableCell>
                  </TableRow>
                )}
                {payslips && currentPayslips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                      No payslips for this period — run payroll to generate them
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Run Payroll ── */}
        <TabsContent value="run">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-border/40">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Pay Run Configuration</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Month</Label>
                    <Select value={payrunMonth} onValueChange={setPayrunMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Year</Label>
                    <Input
                      type="number"
                      value={payrunYear}
                      onChange={(e) => setPayrunYear(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Employees without a structure are skipped automatically</Label>
                  <Button
                    className="w-full"
                    onClick={handleRunPayroll}
                    disabled={runningPayrun || selectedEmployeeIds.length === 0}
                  >
                    <PlayCircle className="h-4 w-4 mr-1.5" />
                    {runningPayrun ? "Processing…" : `Run Payroll (${selectedEmployeeIds.length})`}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-border/40 lg:col-span-2">
              <div className="p-4 border-b flex items-center justify-between">
                <p className="text-sm font-semibold">Select Employees</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={toggleAll}>
                  {selectedEmployeeIds.length === (users || []).length ? "Clear All" : "Select All"}
                </Button>
              </div>
              <div className="max-h-[420px] overflow-y-auto divide-y">
                {(users || []).map((u: any) => {
                  const hasStructure = structureEmployeeIds.has(u._id);
                  return (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedEmployeeIds.includes(u._id)}
                        onCheckedChange={() => toggleEmployee(u._id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name || u.email || u._id}</p>
                        <p className="text-xs text-muted-foreground">{u.email || "No email"}</p>
                      </div>
                      <Badge
                        variant={hasStructure ? "success" : "outline"}
                        className="text-[10px]"
                      >
                        {hasStructure ? "Has structure" : "No structure"}
                      </Badge>
                    </label>
                  );
                })}
                {!users && (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading employees…</p>
                )}
                {users && users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No employees found — create users first
                  </p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Salary Structures ── */}
        <TabsContent value="structures">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="border-border/40 lg:col-span-2">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Active Salary Structures</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>HRA</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Effective From</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(salaryStructures || []).map((s: any) => {
                    const user = userMap.get(s.employeeId);
                    return (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">{user?.name || "Unknown"}</TableCell>
                        <TableCell>{formatMoney(s.basicSalary)}</TableCell>
                        <TableCell>{formatMoney(s.hra)}</TableCell>
                        <TableCell>{formatMoney(s.grossSalary)}</TableCell>
                        <TableCell>{formatMoney(s.totalDeductions)}</TableCell>
                        <TableCell className="font-semibold">{formatMoney(s.netSalary)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(s.effectiveFrom).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!salaryStructures && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                  {salaryStructures && salaryStructures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                        No salary structures yet — create one on the right
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="border-border/40 h-fit">
              <div className="p-4 border-b">
                <p className="text-sm font-semibold">Create Salary Structure</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee</Label>
                  <Select value={ssEmployeeId} onValueChange={setSsEmployeeId}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Basic Salary</Label>
                    <Input
                      type="number"
                      value={ssBasic}
                      onChange={(e) => setSsBasic(e.target.value)}
                      placeholder="e.g. 25000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">HRA</Label>
                    <Input
                      type="number"
                      value={ssHra}
                      onChange={(e) => setSsHra(e.target.value)}
                      placeholder="e.g. 10000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Allowances (Name:Amount, comma separated)</Label>
                  <Input
                    value={ssAllowances}
                    onChange={(e) => setSsAllowances(e.target.value)}
                    placeholder="e.g. Travel:2000, Food:1500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Deductions (Name:Amount, comma separated)</Label>
                  <Input
                    value={ssDeductions}
                    onChange={(e) => setSsDeductions(e.target.value)}
                    placeholder="e.g. PF:1800, Tax:500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Effective From</Label>
                  <Input
                    type="date"
                    value={ssEffectiveFrom}
                    onChange={(e) => setSsEffectiveFrom(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateStructure}
                  disabled={creatingStructure}
                >
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  {creatingStructure ? "Creating…" : "Create Structure"}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
