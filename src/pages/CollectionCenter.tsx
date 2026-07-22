import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CallOutcomeDialog from "@/components/crm/CallOutcomeDialog";
import RecordPaymentDialog from "@/components/crm/RecordPaymentDialog";
import WhatsAppDialog from "@/components/crm/WhatsAppDialog";

import { useState, useMemo, Fragment } from "react";
import {
  ArrowLeft, RefreshCcw, Download, DollarSign, Receipt, Percent,
  Search, ChevronDown, ChevronUp, Loader2, Users, Banknote, FilterX, SearchSlash,
  Phone, MessageCircle, Plus, ExternalLink,
} from "lucide-react";

const healthColors: Record<string, string> = {
  healthy: "bg-[#34a853] text-white",
  good: "bg-[#4285f4] text-white",
  attention: "bg-[#fbbc04] text-[#1a1a2e]",
  critical: "bg-[#ea4335] text-white",
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-[#34a853] text-white",
  partial: "bg-[#fbbc04] text-[#1a1a2e]",
  unpaid: "bg-[#ea4335] text-white",
  no_fees: "bg-[#9aa0a6] text-white",
};

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-full bg-[#f1f3f4] mb-3">
        <Icon className="h-8 w-8 text-[#9aa0a6]" />
      </div>
      <p className="text-[13px] font-medium text-[#1a1a2e]">{title}</p>
      <p className="text-[11px] text-[#9aa0a6] mt-1 max-w-[320px]">{description}</p>
    </div>
  );
}

function fmt(n: number) {
  return n ? `₹${n.toLocaleString()}` : "₹0";
}

export default function CollectionCenter() {
  const { navigate } = useAppNavigate();
  const data = useQuery(api.collectionEngine.getCollectionCenter);
  const leads = data || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const expandedPayments = useQuery(
    api.crm.getLeadPayments,
    expandedLeadId ? { leadId: expandedLeadId as any } : "skip"
  );
  const expandedInstallments = useQuery(
    api.collectionEngine.getInstallments,
    expandedLeadId ? { leadId: expandedLeadId as any } : "skip"
  );
  const expandedPDCs = useQuery(
    api.collectionEngine.getLeadPDCs,
    expandedLeadId ? { leadId: expandedLeadId as any } : "skip"
  );
  const expandedCommitments = useQuery(
    api.collectionEngine.getLeadCommitments,
    expandedLeadId ? { leadId: expandedLeadId as any } : "skip"
  );

  const [expandedTab, setExpandedTab] = useState<string>("payments");

  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { user } = useAuth();

  const logCallActivity = useMutation(api.crm.logCallActivity);
  const sendWhatsAppMessage = useMutation(api.crm.sendWhatsAppMessage);
  const addPayment = useMutation(api.crm.addPayment);

  const toggleExpand = (leadId: string) => {
    setExpandedLeadId((prev) => (prev === leadId ? null : leadId));
    setExpandedTab("payments");
  };

  const summary = useMemo(() => {
    let outstanding = 0, collected = 0, netPayable = 0, grossFees = 0;
    let fullyPaid = 0, partial = 0, unpaid = 0, noFees = 0;
    let pendingVerification = 0;

    for (const l of leads) {
      outstanding += l.balanceDue;
      collected += l.totalCollected;
      netPayable += l.netPayable;
      grossFees += l.grossFees;
      if (l.paymentStatus === "paid") fullyPaid++;
      else if (l.paymentStatus === "partial") partial++;
      else if (l.paymentStatus === "unpaid") unpaid++;
      else if (l.paymentStatus === "no_fees") noFees++;
      if (l.verificationStatus === "pending") pendingVerification++;
    }

    const collectionPct = netPayable > 0 ? Math.round((collected / netPayable) * 100) : 0;

    return { outstanding, collected, netPayable, grossFees, fullyPaid, partial, unpaid, noFees, pendingVerification, collectionPct, totalLeads: leads.length, hasDues: leads.filter((l) => l.balanceDue > 0).length };
  }, [leads]);

  const filtered = useMemo(() => {
    let list = [...leads];

    // Apply status filter
    if (filterStatus === "paid") list = list.filter((l) => l.paymentStatus === "paid");
    else if (filterStatus === "partial") list = list.filter((l) => l.paymentStatus === "partial");
    else if (filterStatus === "unpaid") list = list.filter((l) => l.paymentStatus === "unpaid");
    else if (filterStatus === "no_fees") list = list.filter((l) => l.paymentStatus === "no_fees");

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) => l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q) || l.phone.includes(q)
      );
    }

    // Hierarchical sort: highest outstanding → highest gross fees → lead name
    list.sort((a, b) => {
      if (b.balanceDue !== a.balanceDue) return b.balanceDue - a.balanceDue;
      if (b.grossFees !== a.grossFees) return b.grossFees - a.grossFees;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

    return list;
  }, [leads, filterStatus, searchQuery]);

  const allNoFees = leads.length > 0 && leads.every((l) => l.paymentStatus === "no_fees");

  const getInitials = (name?: string) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const expandedLead = expandedLeadId ? filtered.find((l) => l.leadId === expandedLeadId) : null;

  const handleInitiateCall = (leadPhone: string) => {
    window.open(`tel:${(leadPhone || "").replace(/[^0-9]/g, "")}`, "_self");
    setTimeout(() => setShowCallDialog(true), 500);
  };

  // Determine which empty state to show
  const showLoading = !data;
  const showNoLeads = data && leads.length === 0;
  const showAllNoFees = !showLoading && !showNoLeads && allNoFees && !searchQuery && filterStatus === "all";
  const showNoSearch = searchQuery && filtered.length === 0 && !showAllNoFees;
  const showNoFilter = filterStatus !== "all" && !searchQuery && filtered.length === 0 && !showAllNoFees;
  const showNoResults = searchQuery && filterStatus !== "all" && filtered.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Collection Center</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Collection Operations Workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => {}}>
            <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => {}}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
        </div>
      </div>

      {/* Summary Cards — only when data exists */}
      {data && leads.length > 0 && (
        <>
          {/* Row 1 — Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#fce8e6]"><DollarSign className="h-4 w-4 text-[#ea4335]" /></div>
                  <div>
                    <p className="text-[10px] text-[#ea4335]">Outstanding Balance</p>
                    <p className="text-lg font-bold text-[#ea4335]">{fmt(summary.outstanding)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#e6f4ea]"><DollarSign className="h-4 w-4 text-[#34a853]" /></div>
                  <div>
                    <p className="text-[10px] text-[#34a853]">Verified Collections</p>
                    <p className="text-lg font-bold text-[#34a853]">{fmt(summary.collected)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#e8f0fe]"><Receipt className="h-4 w-4 text-[#1a73e8]" /></div>
                  <div>
                    <p className="text-[10px] text-[#1a73e8]">Net Payable</p>
                    <p className="text-lg font-bold text-[#1a73e8]">{fmt(summary.netPayable)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#f3e8ff]"><Percent className="h-4 w-4 text-[#a855f7]" /></div>
                  <div>
                    <p className="text-[10px] text-[#a855f7]">Recovery Rate</p>
                    <p className="text-lg font-bold text-[#a855f7]">{summary.collectionPct}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2 — Quick Stats */}
          <div className="grid grid-cols-6 gap-2">
            <div className="p-2.5 rounded-lg bg-[#f8f9fa] text-center">
              <p className="text-[10px] text-[#5f6368]">Total Leads</p>
              <p className="text-base font-semibold text-[#1a1a2e]">{summary.totalLeads}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#e6f4ea] text-center">
              <p className="text-[10px] text-[#34a853]">Fully Paid</p>
              <p className="text-base font-semibold text-[#34a853]">{summary.fullyPaid}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#fef7e0] text-center">
              <p className="text-[10px] text-[#e8710a]">Partial</p>
              <p className="text-base font-semibold text-[#e8710a]">{summary.partial}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#fce8e6] text-center">
              <p className="text-[10px] text-[#ea4335]">Unpaid</p>
              <p className="text-base font-semibold text-[#ea4335]">{summary.unpaid}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#e8f0fe] text-center">
              <p className="text-[10px] text-[#1a73e8]">Pending Verification</p>
              <p className="text-base font-semibold text-[#1a73e8]">{summary.pendingVerification}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#f1f3f4] text-center">
              <p className="text-[10px] text-[#9aa0a6]">No Fees</p>
              <p className="text-base font-semibold text-[#9aa0a6]">{summary.noFees}</p>
            </div>
          </div>

          {/* Filters — only when there are leads to filter */}
          {(leads.length > 0 && !allNoFees) && (
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                <Input placeholder="Search by name or phone..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-[13px] border-[#e8eaed]" />
              </div>
              <div className="flex gap-1">
                {["all", "paid", "partial", "unpaid", "no_fees"].map((s) => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${filterStatus === s
                      ? "bg-[#1a1a2e] text-white"
                      : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"}`}>
                    {s === "all" ? "All" : s === "paid" ? "Paid" : s === "partial" ? "Partial" : s === "unpaid" ? "Unpaid" : "No Fees"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Table */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {showLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" />
            </div>
          ) : showNoLeads ? (
            <EmptyState icon={Users} title="No leads yet" description="Leads will appear here once they are created and assigned for collection." />
          ) : showAllNoFees ? (
            <EmptyState icon={Banknote} title="No fees recorded" description="All leads have no fee data. Add courses and set amounts to enable collection tracking." />
          ) : showNoSearch ? (
            <EmptyState icon={SearchSlash} title="No leads match your search" description={`No leads found for "${searchQuery}". Try a different name or phone number.`} />
          ) : showNoFilter || showNoResults ? (
            <EmptyState icon={FilterX} title="No leads match this filter" description={`No leads with "${filterStatus === "paid" ? "Paid" : filterStatus === "partial" ? "Partial" : filterStatus === "unpaid" ? "Unpaid" : "No Fees"}" payment status. Try a different filter.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 1000 }}>
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Lead</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Courses</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Gross Fees</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Net Payable</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Collected</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Outstanding</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Status</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Health</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, idx) => {
                    const balanceColor = lead.balanceDue === 0 ? "#34a853" : lead.balanceDue <= lead.netPayable * 0.3 ? "#e8710a" : "#ea4335";
                    const altBg = idx % 2 === 1 ? "bg-[#fafbfc]" : "";
                    const isExpanded = expandedLeadId === lead.leadId;
                    return (
                      <Fragment key={lead.leadId}>
                      <tr className={`border-b border-[#f1f3f4] hover:bg-[#f0f3f5] transition-colors ${altBg}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{getInitials(`${lead.firstName} ${lead.lastName}`)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[12px] font-medium text-[#1a1a2e]">{lead.firstName} {lead.lastName}</p>
                              <p className="text-[10px] text-[#9aa0a6]">{lead.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[11px] text-[#5f6368] max-w-[140px] truncate">{lead.courses?.join(", ") || "—"}</td>
                        <td className="px-3 py-2 text-[12px] font-medium text-[#1a1a2e]">{fmt(lead.grossFees)}</td>
                        <td className="px-3 py-2 text-[12px] font-medium text-[#1a73e8]">{fmt(lead.netPayable)}</td>
                        <td className="px-3 py-2 text-[12px] font-medium text-[#34a853]">{fmt(lead.totalCollected)}</td>
                        <td className="px-3 py-2 text-[12px] font-semibold" style={{ color: balanceColor }}>
                          {fmt(lead.balanceDue)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${paymentStatusColors[lead.paymentStatus] || "bg-[#9aa0a6] text-white"}`}>
                            {lead.paymentStatus === "paid" ? "Paid" : lead.paymentStatus === "partial" ? "Partial" : lead.paymentStatus === "unpaid" ? "Unpaid" : "No Fees"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 ${healthColors[lead.collectionHealth] || "bg-[#9aa0a6] text-white"}`}>
                            {lead.collectionHealth?.charAt(0).toUpperCase() + lead.collectionHealth?.slice(1) || "—"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => toggleExpand(lead.leadId)}
                            className={`text-[#9aa0a6] hover:text-[#1a1a2e] transition-colors ${expandedLeadId === lead.leadId ? "text-[#1a1a2e]" : ""}`}>
                            {expandedLeadId === lead.leadId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded row — payment/installment/PDC/commitment details */}
                      {isExpanded && (
                        <tr key={`${lead.leadId}-details`}>
                          <td colSpan={9} className="p-0 bg-[#f8f9fa] border-b border-[#e8eaed]">
                            <div className="px-4 py-3">
                              {/* Mini tab bar */}
                              <div className="flex items-center gap-1 mb-3">
                                {["payments", "installments", "pdc", "commitments"].map((tab) => (
                                  <button key={tab} onClick={() => setExpandedTab(tab)}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${expandedTab === tab
                                      ? "bg-[#1a1a2e] text-white"
                                      : "bg-white text-[#5f6368] hover:bg-[#e8eaed] border border-[#e8eaed]"}`}>
                                    {tab === "payments" ? "Payments" : tab === "installments" ? "Installments" : tab === "pdc" ? "PDC Cheques" : "Commitments"}
                                  </button>
                                ))}
                              </div>

                              {/* Payments Tab */}
                              {(() => {
                                if (expandedTab !== "payments") return null;
                                const modeLabels: Record<string, string> = {
                                  cash: "Cash", upi: "UPI", bank: "Bank Transfer",
                                  card: "Card", cheque: "Cheque", online: "Online",
                                };
                                const pStatusColors: Record<string, string> = {
                                  verified: "bg-[#34a853] text-white",
                                  pending: "bg-[#fbbc04] text-[#1a1a2e]",
                                  rejected: "bg-[#ea4335] text-white",
                                };
                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left" style={{ minWidth: 500 }}>
                                      <thead>
                                        <tr className="border-b border-[#e8eaed]">
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Date</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Amount</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Mode</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Reference</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {!expandedPayments ? (
                                          <tr><td colSpan={5} className="py-3 text-center"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#9aa0a6] mx-auto" /></td></tr>
                                        ) : expandedPayments.length === 0 ? (
                                          <tr><td colSpan={5} className="py-3 text-[11px] text-[#9aa0a6] text-center">No payments recorded</td></tr>
                                        ) : (
                                          expandedPayments.map((p: any) => (
                                            <tr key={p._id} className="border-b border-[#f1f3f4]">
                                              <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">{new Date(p.createdAt).toLocaleDateString()}</td>
                                              <td className="px-2 py-1.5 text-[11px] font-medium text-[#1a1a2e]">₹{p.amount.toLocaleString()}</td>
                                              <td className="px-2 py-1.5">
                                                <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#f1f3f4] text-[#5f6368] uppercase">{modeLabels[p.mode] || p.mode}</Badge>
                                              </td>
                                              <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">{p.reference || "—"}</td>
                                              <td className="px-2 py-1.5">
                                                <Badge className={`text-[8px] px-1 py-0 h-3.5 ${pStatusColors[p.status] || "bg-[#9aa0a6] text-white"}`}>
                                                  {p.status === "verified" ? "Verified" : p.status === "pending" ? "Awaiting" : p.status === "rejected" ? "Rejected" : p.status}
                                                </Badge>
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}

                              {/* Installments Tab */}
                              {(() => {
                                if (expandedTab !== "installments") return null;
                                const iStatusColors: Record<string, string> = {
                                  paid: "bg-[#34a853] text-white",
                                  overdue: "bg-[#ea4335] text-white",
                                  due: "bg-[#fbbc04] text-[#1a1a2e]",
                                  planned: "bg-[#e8f0fe] text-[#1a73e8]",
                                  cancelled: "bg-[#9aa0a6] text-white",
                                };
                                return (
                                  <div>
                                    {!expandedInstallments ? (
                                      <div className="py-3 text-center"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#9aa0a6] mx-auto" /></div>
                                    ) : expandedInstallments.length === 0 ? (
                                      <p className="py-3 text-[11px] text-[#9aa0a6] text-center">No installment plans</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {(() => {
                                          const paidCount = expandedInstallments.filter((i: any) => i.status === "paid").length;
                                          const totalCount = expandedInstallments.length;
                                          const pct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
                                          return (
                                            <div className="mb-2">
                                              <div className="flex items-center justify-between text-[10px] text-[#5f6368] mb-1">
                                                <span>{paidCount} of {totalCount} installments paid</span>
                                                <span className="font-medium text-[#1a1a2e]">{pct}%</span>
                                              </div>
                                              <div className="w-full bg-[#e8eaed] rounded-full h-1.5">
                                                <div className="bg-[#34a853] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                              </div>
                                            </div>
                                          );
                                        })()}
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left" style={{ minWidth: 400 }}>
                                            <thead>
                                              <tr className="border-b border-[#e8eaed]">
                                                <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">#</th>
                                                <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Amount</th>
                                                <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Due Date</th>
                                                <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {expandedInstallments.map((inst: any) => (
                                                <tr key={inst._id} className="border-b border-[#f1f3f4]">
                                                  <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">#{inst.installmentNumber}</td>
                                                  <td className="px-2 py-1.5 text-[11px] font-medium text-[#1a1a2e]">₹{inst.amount.toLocaleString()}</td>
                                                  <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">{new Date(inst.dueDate).toLocaleDateString()}</td>
                                                  <td className="px-2 py-1.5">
                                                    <Badge className={`text-[8px] px-1 py-0 h-3.5 ${iStatusColors[inst.status] || "bg-[#9aa0a6] text-white"}`}>{inst.status}</Badge>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* PDC Tab */}
                              {(() => {
                                if (expandedTab !== "pdc") return null;
                                const pdcStatusColors: Record<string, string> = {
                                  scheduled: "bg-[#e8f0fe] text-[#1a73e8]",
                                  deposited: "bg-[#fbbc04] text-[#1a1a2e]",
                                  cleared: "bg-[#34a853] text-white",
                                  bounced: "bg-[#ea4335] text-white",
                                  cancelled: "bg-[#9aa0a6] text-white",
                                };
                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left" style={{ minWidth: 500 }}>
                                      <thead>
                                        <tr className="border-b border-[#e8eaed]">
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Cheque No.</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Bank</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Cheque Date</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Amount</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {!expandedPDCs ? (
                                          <tr><td colSpan={5} className="py-3 text-center"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#9aa0a6] mx-auto" /></td></tr>
                                        ) : expandedPDCs.length === 0 ? (
                                          <tr><td colSpan={5} className="py-3 text-[11px] text-[#9aa0a6] text-center">No PDC cheques</td></tr>
                                        ) : (
                                          expandedPDCs.map((pdc: any) => (
                                            <tr key={pdc._id} className="border-b border-[#f1f3f4]">
                                              <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">#{pdc.chequeNumber}</td>
                                              <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">{pdc.bank}</td>
                                              <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">{new Date(pdc.chequeDate).toLocaleDateString()}</td>
                                              <td className="px-2 py-1.5 text-[11px] font-medium text-[#1a1a2e]">₹{pdc.amount.toLocaleString()}</td>
                                              <td className="px-2 py-1.5">
                                                <Badge className={`text-[8px] px-1 py-0 h-3.5 ${pdcStatusColors[pdc.status] || "bg-[#9aa0a6] text-white"}`}>{pdc.status}</Badge>
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}

                              {/* Commitments Tab */}
                              {(() => {
                                if (expandedTab !== "commitments") return null;
                                const cmtStatusColors: Record<string, string> = {
                                  active: "bg-[#e8f0fe] text-[#1a73e8]",
                                  completed: "bg-[#34a853] text-white",
                                  expired: "bg-[#9aa0a6] text-white",
                                  cancelled: "bg-[#9aa0a6] text-white",
                                };
                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left" style={{ minWidth: 450 }}>
                                      <thead>
                                        <tr className="border-b border-[#e8eaed]">
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Amount</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Commit Date</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Confidence</th>
                                          <th className="text-[9px] font-semibold text-[#9aa0a6] uppercase px-2 py-1.5">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {!expandedCommitments ? (
                                          <tr><td colSpan={4} className="py-3 text-center"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#9aa0a6] mx-auto" /></td></tr>
                                        ) : expandedCommitments.length === 0 ? (
                                          <tr><td colSpan={4} className="py-3 text-[11px] text-[#9aa0a6] text-center">No commitments</td></tr>
                                        ) : (
                                          expandedCommitments.map((cmt: any) => (
                                            <tr key={cmt._id} className="border-b border-[#f1f3f4]">
                                              <td className="px-2 py-1.5 text-[11px] font-medium text-[#1a1a2e]">₹{cmt.amount.toLocaleString()}</td>
                                              <td className="px-2 py-1.5 text-[11px] text-[#5f6368]">{new Date(cmt.commitDate).toLocaleDateString()}</td>
                                              <td className="px-2 py-1.5">
                                                <Badge className={`text-[8px] px-1 py-0 h-3.5 ${cmt.confidence === "high" ? "bg-[#34a853] text-white" : cmt.confidence === "medium" ? "bg-[#fbbc04] text-[#1a1a2e]" : "bg-[#9aa0a6] text-white"}`}>
                                                  {cmt.confidence}
                                                </Badge>
                                              </td>
                                              <td className="px-2 py-1.5">
                                                <Badge className={`text-[8px] px-1 py-0 h-3.5 ${cmtStatusColors[cmt.status] || "bg-[#9aa0a6] text-white"}`}>{cmt.status}</Badge>
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}

                              {/* Quick Actions Bar */}
                              <div className="mt-3 pt-3 border-t border-[#e8eaed]">
                                <p className="text-[9px] font-semibold text-[#9aa0a6] uppercase mb-2">Quick Actions</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleInitiateCall(lead.phone)}
                                    disabled={!lead.phone}
                                    title={lead.phone ? `Call ${lead.phone}` : "No phone number"}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-[#e8eaed] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#1a1a2e] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    Call
                                  </button>
                                  <button
                                    onClick={() => setShowWhatsApp(true)}
                                    disabled={!lead.phone}
                                    title={!lead.phone ? "No phone number" : "Open WhatsApp"}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-[#e8eaed] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#1a1a2e] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    WhatsApp
                                  </button>
                                  <button
                                    onClick={() => setShowPaymentDialog(true)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-[#e8eaed] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#1a1a2e] transition-all"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Record Payment
                                  </button>
                                  <button
                                    onClick={() => navigate(`/crm/leads/${lead.leadId}`)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-[#e8eaed] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#1a1a2e] transition-all"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open Lead
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Dialogs */}
      {user && expandedLead && (
        <>
          <CallOutcomeDialog
            open={showCallDialog}
            onOpenChange={setShowCallDialog}
            leadId={expandedLead.leadId}
            leadName={`${expandedLead.firstName} ${expandedLead.lastName}`}
            userId={user._id}
            logCallActivity={logCallActivity}
          />
          <WhatsAppDialog
            open={showWhatsApp}
            onOpenChange={setShowWhatsApp}
            leadId={expandedLead.leadId}
            leadName={`${expandedLead.firstName} ${expandedLead.lastName}`}
            whatsappUsername={expandedLead.whatsappUsername}
            phone={expandedLead.phone}
            userId={user._id}
            sendWhatsAppMessage={sendWhatsAppMessage}
          />
          <RecordPaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            leadId={expandedLead.leadId}
            leadName={`${expandedLead.firstName} ${expandedLead.lastName}`}
            userId={user._id}
            addPayment={addPayment}
          />
        </>
      )}
    </div>
  );
}
