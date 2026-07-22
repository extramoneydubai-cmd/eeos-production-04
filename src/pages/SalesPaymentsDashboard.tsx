import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useMemo } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  ArrowLeft, DollarSign, Receipt, Percent, RotateCcw, Search, ChevronDown, ChevronUp,
  Phone, User, Calendar, Loader2,
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "text-[#9aa0a6] bg-[#f1f3f4]", medium: "text-[#4285f4] bg-[#e8f0fe]",
  high: "text-[#ea4335] bg-[#fce8e6]", critical: "text-white bg-[#ea4335]",
};

const stageColors: Record<string, string> = {
  new: "bg-[#9aa0a6]", attempted: "bg-[#4285f4]", connected: "bg-[#34a853]",
  qualified: "bg-[#fbbc04]", counselling: "bg-[#a855f7]", interested: "bg-[#1a73e8]",
  follow_up: "bg-[#ea4335]", negotiation: "bg-[#e8710a]", converted: "bg-[#0d652d]", lost: "bg-[#5f6368]",
};

const PIPELINE_STAGES = [
  { id: "new", label: "New" }, { id: "attempted", label: "Attempted" }, { id: "connected", label: "Connected" },
  { id: "qualified", label: "Qualified" }, { id: "counselling", label: "Counselling" }, { id: "interested", label: "Interested" },
  { id: "follow_up", label: "Follow Up" }, { id: "negotiation", label: "Negotiation" }, { id: "converted", label: "Converted" }, { id: "lost", label: "Lost" },
];

export default function SalesPaymentsDashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const users = useQuery(api.users.listUsers);
  const allLeadsPayments = useQuery(api.crm.getAllLeadsPayments);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const leads = allLeadsPayments || [];

  // Summary calculations
  const summary = useMemo(() => {
    let totalGross = 0, totalDiscount = 0, totalWaiver = 0, totalCollected = 0;
    let totalPendingPayments = 0, totalOutstanding = 0;
    let paidCount = 0, hasDueCount = 0, overdueCount = 0;

    for (const l of leads) {
      totalGross += l.grossFees;
      totalDiscount += l.discountAmount;
      totalWaiver += l.waiverAmount;
      totalCollected += l.totalPaid;
      totalPendingPayments += l.totalPending;
      totalOutstanding += l.balanceDue;
      if (l.totalPaid >= l.netPayable && l.netPayable > 0) paidCount++;
      if (l.balanceDue > 0) hasDueCount++;
    }

    return { totalGross, totalDiscount, totalWaiver, totalCollected, totalPendingPayments, totalOutstanding, paidCount, hasDueCount };
  }, [leads]);

  // Filter + Search
  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (filterStatus === "paid") list = list.filter((l: any) => l.netPayable > 0 && l.totalPaid >= l.netPayable);
    else if (filterStatus === "pending") list = list.filter((l: any) => l.netPayable > 0 && l.totalPaid < l.netPayable && l.totalPaid > 0);
    else if (filterStatus === "overdue") list = list.filter((l: any) => l.balanceDue > 0);
    else if (filterStatus === "no_dues") list = list.filter((l: any) => l.netPayable === 0);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((l: any) => l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q) || l.phone.includes(q));
    }
    return list.sort((a, b) => b.balanceDue - a.balanceDue);
  }, [leads, filterStatus, searchQuery]);

  const getInitials = (name?: string) => name?.split(" ").map((n: any) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Payment Dashboard</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Track all lead payments, dues, and financials</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"
          onClick={() => navigate("/crm/sales")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Sales
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#e6f4ea]"><DollarSign className="h-4 w-4 text-[#34a853]" /></div>
              <div>
                <p className="text-[10px] text-[#34a853]">Collected</p>
                <p className="text-lg font-bold text-[#34a853]">₹{summary.totalCollected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#fce8e6]"><Receipt className="h-4 w-4 text-[#ea4335]" /></div>
              <div>
                <p className="text-[10px] text-[#ea4335]">Outstanding</p>
                <p className="text-lg font-bold text-[#ea4335]">₹{summary.totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#fef7e0]"><Percent className="h-4 w-4 text-[#e8710a]" /></div>
              <div>
                <p className="text-[10px] text-[#e8710a]">Discount</p>
                <p className="text-lg font-bold text-[#e8710a]">₹{summary.totalDiscount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#e8f0fe]"><RotateCcw className="h-4 w-4 text-[#1a73e8]" /></div>
              <div>
                <p className="text-[10px] text-[#1a73e8]">Waiver</p>
                <p className="text-lg font-bold text-[#1a73e8]">₹{summary.totalWaiver.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#f8f9fa] text-center">
          <p className="text-[10px] text-[#5f6368]">Total Leads</p>
          <p className="text-base font-semibold text-[#1a1a2e]">{leads.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#e6f4ea] text-center">
          <p className="text-[10px] text-[#34a853]">Fully Paid</p>
          <p className="text-base font-semibold text-[#34a853]">{summary.paidCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#fce8e6] text-center">
          <p className="text-[10px] text-[#ea4335]">Has Dues</p>
          <p className="text-base font-semibold text-[#ea4335]">{summary.hasDueCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#fef7e0] text-center">
          <p className="text-[10px] text-[#e8710a]">Net Payable</p>
          <p className="text-base font-semibold text-[#e8710a]">₹{(summary.totalGross - summary.totalDiscount - summary.totalWaiver).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
          <Input placeholder="Search by name or phone..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-[13px] border-[#e8eaed]" />
        </div>
        <div className="flex gap-1">
          {["all", "paid", "pending", "overdue", "no_dues"].map((s: any) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${filterStatus === s
                ? "bg-[#1a1a2e] text-white"
                : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"}`}>
              {s === "all" ? "All" : s === "paid" ? "Paid" : s === "pending" ? "Partial" : s === "overdue" ? "Overdue" : "No Fees"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {!allLeadsPayments ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" /></div>
          ) : filteredLeads.length === 0 ? (
            <p className="text-[13px] text-[#9aa0a6] text-center py-8">No leads match your filters</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Lead</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Gross Fees</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Discount</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Waiver</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Net Payable</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Collected</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Balance</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Status</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const owner = users?.find((u: any) => u._id === lead.ownerId);
                    const isExpanded = expandedLeadId === lead.leadId;
                    const paymentStatus = lead.netPayable === 0 ? "no_fees"
                      : lead.totalPaid >= lead.netPayable ? "paid"
                        : lead.totalPaid > 0 ? "partial" : "unpaid";
                    const statusColors: Record<string, string> = {
                      paid: "bg-[#34a853] text-white", partial: "bg-[#fbbc04] text-[#1a1a2e]",
                      unpaid: "bg-[#ea4335] text-white", no_fees: "bg-[#9aa0a6] text-white",
                    };
                    const statusLabels: Record<string, string> = {
                      paid: "Paid", partial: "Partial", unpaid: "Unpaid", no_fees: "No Fees",
                    };

                    return (
                      <tr key={lead.leadId} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                                {getInitials(`${lead.firstName} ${lead.lastName}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[12px] font-medium text-[#1a1a2e]">{lead.firstName} {lead.lastName}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-[#9aa0a6]">{lead.phone}</span>
                                {owner && <span className="text-[10px] text-[#9aa0a6]">· {owner.name?.split(" ")[0]}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[12px] font-medium text-[#1a1a2e]">₹{lead.grossFees.toLocaleString()}</td>
                        <td className="px-3 py-2 text-[12px] text-[#ea4335]">{lead.discountAmount > 0 ? `-₹${lead.discountAmount.toLocaleString()}` : "—"}</td>
                        <td className="px-3 py-2 text-[12px] text-[#e8710a]">{lead.waiverAmount > 0 ? `-₹${lead.waiverAmount.toLocaleString()}` : "—"}</td>
                        <td className="px-3 py-2 text-[12px] font-medium text-[#1a1a2e]">₹{lead.netPayable.toLocaleString()}</td>
                        <td className="px-3 py-2 text-[12px] font-medium text-[#34a853]">₹{lead.totalPaid.toLocaleString()}</td>
                        <td className="px-3 py-2 text-[12px] font-semibold" style={{ color: lead.balanceDue > 0 ? "#ea4335" : "#34a853" }}>
                          {lead.balanceDue > 0 ? `₹${lead.balanceDue.toLocaleString()}` : "₹0"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${statusColors[paymentStatus]}`}>
                            {statusLabels[paymentStatus]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => setExpandedLeadId(isExpanded ? null : lead.leadId)}
                            className="text-[#9aa0a6] hover:text-[#1a1a2e] transition-colors">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
