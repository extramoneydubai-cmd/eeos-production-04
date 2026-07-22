import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, FileText, Download, Printer, User, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, History, DollarSign, Percent,
  Loader2, Send, RotateCcw, Plus, Trash2, Edit3,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Id } from "@/convex/_generated/dataModel";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f1f3f4] text-[#5f6368]",
  sent: "bg-[#e8f0fe] text-[#1a73e8]",
  accepted: "bg-[#e6f4ea] text-[#34a853]",
  rejected: "bg-[#fce8e6] text-[#ea4335]",
  expired: "bg-[#f1f3f4] text-[#9aa0a6]",
  revised: "bg-[#fef7e0] text-[#e8710a]",
};

function QuotationPrintView({ quote, lineItems, users, lead }: {
  quote: any; lineItems: any[]; users: any[]; lead: any;
}) {
  const createdBy = users?.find((u: any) => u._id === quote.createdBy);
  const gstAmount = quote.gstAmount || 0;
  const discountAmount = quote.discountAmount || 0;

  return (
    <div className="p-8 max-w-[800px] mx-auto bg-white" id="quotation-print">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">QUOTATION</h1>
          <p className="text-[11px] text-[#5f6368] mt-1">#{quote.quoteNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#5f6368]">Date: {new Date(quote.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          <p className="text-[11px] text-[#5f6368]">Valid Until: {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "N/A"}</p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Bill To */}
      <div className="mb-6">
        <h3 className="text-[10px] font-semibold text-[#9aa0a6] uppercase mb-1">Bill To</h3>
        <p className="text-[13px] font-medium text-[#1a1a2e]">{lead?.firstName} {lead?.lastName}</p>
        <p className="text-[11px] text-[#5f6368]">{lead?.phone}</p>
        {lead?.email && <p className="text-[11px] text-[#5f6368]">{lead.email}</p>}
      </div>

      {/* Line Items */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-[#e8eaed]">
            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-left pb-2">#</th>
            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-left pb-2">Description</th>
            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Qty</th>
            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Unit Price</th>
            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Discount</th>
            <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => (
            <tr key={item._id || idx} className="border-b border-[#f1f3f4]">
              <td className="py-2 text-[12px] text-[#5f6368]">{idx + 1}</td>
              <td className="py-2 text-[12px] text-[#1a1a2e]">{item.description}</td>
              <td className="py-2 text-[12px] text-right text-[#5f6368]">{item.quantity}</td>
              <td className="py-2 text-[12px] text-right text-[#5f6368]">₹{item.unitPrice.toLocaleString()}</td>
              <td className="py-2 text-[12px] text-right text-[#ea4335]">{item.discountPercent ? `${item.discountPercent}%` : "—"}</td>
              <td className="py-2 text-[12px] text-right font-medium">₹{item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-[250px] space-y-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-[#5f6368]">Subtotal</span>
            <span>₹{quote.subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-[#5f6368]">Discount ({quote.discountPercent || 0}%)</span>
              <span className="text-[#ea4335]">-₹{discountAmount.toLocaleString()}</span>
            </div>
          )}
          {gstAmount > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-[#5f6368]">GST ({quote.gstPercent || 0}%)</span>
              <span>₹{gstAmount.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-[14px] font-bold">
            <span>Total</span>
            <span>₹{quote.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {quote.notes && (
        <div className="mb-4">
          <h3 className="text-[10px] font-semibold text-[#9aa0a6] uppercase mb-1">Notes</h3>
          <p className="text-[11px] text-[#5f6368]">{quote.notes}</p>
        </div>
      )}
      {quote.terms && (
        <div className="mb-4">
          <h3 className="text-[10px] font-semibold text-[#9aa0a6] uppercase mb-1">Terms & Conditions</h3>
          <p className="text-[11px] text-[#5f6368]">{quote.terms}</p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-[#e8eaed] text-center text-[10px] text-[#9aa0a6]">
        <p>Generated by EEOS | Veda EdTech</p>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          #quotation-print { max-width: 100%; padding: 40px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function QuotationDetail() {
  const { quoteId } = useParams();
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const quote = useQuery(api.quotations.get, quoteId ? { id: quoteId as any } : "skip");
  const lineItems = useQuery(api.quotations.getLineItems, quoteId ? { quotationId: quoteId as any } : "skip");
  const versions = useQuery(api.quotations.getVersions, quoteId ? { quotationId: quoteId as any } : "skip");
  const users = useQuery(api.users.listUsers);
  const lead = useQuery(api.crm.getLeadById, quote?.leadId ? { leadId: quote.leadId } : "skip");

  const updateStatus = useMutation(api.quotations.updateStatus);

  const [activeTab, setActiveTab] = useState("preview");
  const [statusLoading, setStatusLoading] = useState(false);
  const [showVersionDetail, setShowVersionDetail] = useState<any>(null);

  const createdBy = users?.find((u) => u._id === quote?.createdBy);
  const approvedBy = users?.find((u) => u._id === quote?.approvedBy);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !quote || !lineItems || !users || !lead) return;
    const div = document.createElement("div");
    // We use a simpler approach — just open the QuotationPrintView inline
    window.print();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !quote) return;
    setStatusLoading(true);
    try {
      await updateStatus({
        id: quote._id,
        status: newStatus as any,
        userId: user._id as any,
      });
    } finally {
      setStatusLoading(false);
    }
  };

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={() => navigate("/crm/sales")}
        className="flex items-center gap-1 text-[12px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors mb-0">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Sales Center
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fef7e0] flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#e8710a]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a2e]">Quotation #{quote.quoteNumber}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge className={`text-[10px] px-1.5 py-0 h-4 ${STATUS_COLORS[quote.status] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
              </Badge>
              <span className="text-[10px] text-[#5f6368]">v{quote.version}</span>
              <span className="text-[10px] text-[#5f6368]">· ₹{quote.total.toLocaleString()}</span>
              <span className="text-[10px] text-[#5f6368]">· {createdBy?.name || "Unknown"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 no-print print:hidden">
          <Select value={quote.status} onValueChange={handleStatusChange} disabled={statusLoading}>
            <SelectTrigger className="h-8 text-[10px] w-[120px] border-[#e8eaed]">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revised">Revised</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]"
            onClick={handlePrint}>
            <Printer className="h-3 w-3 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#34a853] text-[#34a853]"
            onClick={() => handleStatusChange("sent")}>
            <Send className="h-3 w-3 mr-1" /> Mark Sent
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="preview" className="text-[11px] data-[state=active]:bg-white px-3">Preview</TabsTrigger>
          <TabsTrigger value="versions" className="text-[11px] data-[state=active]:bg-white px-3">Versions ({versions?.length || 0})</TabsTrigger>
          <TabsTrigger value="details" className="text-[11px] data-[state=active]:bg-white px-3">Details</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-0" ref={printRef}>
              <div className="p-6 md:p-8">
                {/* Quotation Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">QUOTATION</h2>
                    <p className="text-[11px] text-[#5f6368] mt-1">#{quote.quoteNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#5f6368]">
                      Issued: {new Date(quote.issuedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {quote.expiryDate && (
                      <p className="text-[11px] text-[#5f6368]">
                        Expires: {new Date(quote.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* Bill To */}
                <div className="mb-6">
                  <h3 className="text-[10px] font-semibold text-[#9aa0a6] uppercase mb-1">Bill To</h3>
                  <p className="text-[13px] font-medium text-[#1a1a2e]">{lead?.firstName} {lead?.lastName}</p>
                  <p className="text-[11px] text-[#5f6368]">{lead?.phone}</p>
                  {lead?.email && <p className="text-[11px] text-[#5f6368]">{lead.email}</p>}
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e8eaed]">
                        <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-left pb-2">#</th>
                        <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-left pb-2">Description</th>
                        <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Qty</th>
                        <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Unit Price</th>
                        <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Disc %</th>
                        <th className="text-[10px] font-semibold text-[#9aa0a6] uppercase text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!lineItems || lineItems.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-[11px] text-[#9aa0a6]">No line items</td>
                        </tr>
                      ) : (
                        lineItems.map((item: any, idx: number) => (
                          <tr key={item._id || idx} className="border-b border-[#f1f3f4]">
                            <td className="py-2.5 text-[12px] text-[#5f6368]">{idx + 1}</td>
                            <td className="py-2.5 text-[12px] text-[#1a1a2e]">{item.description}</td>
                            <td className="py-2.5 text-[12px] text-right text-[#5f6368]">{item.quantity}</td>
                            <td className="py-2.5 text-[12px] text-right text-[#5f6368]">₹{item.unitPrice.toLocaleString()}</td>
                            <td className="py-2.5 text-[12px] text-right text-[#ea4335]">{item.discountPercent ? `${item.discountPercent}%` : "—"}</td>
                            <td className="py-2.5 text-[12px] text-right font-medium">₹{Math.round(item.total).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-[250px] space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#5f6368]">Subtotal</span>
                      <span>₹{Math.round(quote.subtotal).toLocaleString()}</span>
                    </div>
                    {(quote.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#5f6368]">Discount ({quote.discountPercent || 0}%)</span>
                        <span className="text-[#ea4335]">-₹{Math.round(quote.discountAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {(quote.gstAmount || 0) > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#5f6368]">GST ({quote.gstPercent || 0}%)</span>
                        <span>₹{Math.round(quote.gstAmount).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-[16px] font-bold">
                      <span>Grand Total</span>
                      <span className="text-[#1a73e8]">₹{Math.round(quote.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div className="mb-4 p-3 bg-[#f8f9fa] rounded-md">
                    <h3 className="text-[10px] font-semibold text-[#9aa0a6] uppercase mb-1">Notes</h3>
                    <p className="text-[11px] text-[#5f6368]">{quote.notes}</p>
                  </div>
                )}
                {quote.terms && (
                  <div className="mb-4 p-3 bg-[#f8f9fa] rounded-md">
                    <h3 className="text-[10px] font-semibold text-[#9aa0a6] uppercase mb-1">Terms</h3>
                    <p className="text-[11px] text-[#5f6368]">{quote.terms}</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-[#e8eaed] text-center text-[10px] text-[#9aa0a6]">
                  <p>Generated by EEOS | Veda EdTech | v{quote.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-[#5f6368]" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!versions || versions.length === 0 ? (
                <p className="text-[12px] text-[#9aa0a6] text-center py-4">No version history</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v: any) => {
                    const changer = users?.find((u: any) => u._id === v.changedBy);
                    return (
                      <div key={v._id} className="flex items-center justify-between p-3 rounded-md hover:bg-[#f8f9fa] border border-[#e8eaed]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f1f3f4] flex items-center justify-center">
                            <span className="text-[11px] font-bold text-[#5f6368]">v{v.version}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-medium text-[#1a1a2e]">{v.changeNotes || `Version ${v.version}`}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#5f6368]">{changer?.name || "Unknown"}</span>
                              <span className="text-[9px] text-[#9aa0a6]">·</span>
                              <span className="text-[10px] text-[#9aa0a6]">
                                {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]"
                          onClick={() => setShowVersionDetail(v)}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Quotation Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Quote #</span>
                  <span className="text-[12px] font-medium">{quote.quoteNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Status</span>
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 ${STATUS_COLORS[quote.status]}`}>
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Version</span>
                  <span className="text-[12px] font-medium">v{quote.version}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Created By</span>
                  <span className="text-[12px] font-medium">{createdBy?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[12px] text-[#5f6368]">Created</span>
                  <span className="text-[12px] font-medium">
                    {new Date(quote.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Lead Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Name</span>
                  <span className="text-[12px] font-medium">{lead?.firstName} {lead?.lastName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Phone</span>
                  <span className="text-[12px] font-medium">{lead?.phone || "—"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Subtotal</span>
                  <span className="text-[12px] font-medium">₹{Math.round(quote.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Discount</span>
                  <span className="text-[12px] font-medium text-[#ea4335]">
                    {quote.discountPercent ? `${quote.discountPercent}% (-₹${Math.round(quote.discountAmount || 0).toLocaleString()})` : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">GST</span>
                  <span className="text-[12px] font-medium">
                    {quote.gstPercent ? `${quote.gstPercent}% (₹${Math.round(quote.gstAmount || 0).toLocaleString()})` : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[12px] text-[#5f6368] font-semibold">Grand Total</span>
                  <span className="text-[12px] font-bold text-[#1a73e8]">₹{Math.round(quote.total).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Version Detail Dialog */}
      <Dialog open={!!showVersionDetail} onOpenChange={() => setShowVersionDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Version Details
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Snapshot of the quotation at this version
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {showVersionDetail && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#5f6368]">Version</span>
                  <span className="text-[11px] font-medium">v{showVersionDetail.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#5f6368]">Changed By</span>
                  <span className="text-[11px] font-medium">
                    {users?.find((u: any) => u._id === showVersionDetail.changedBy)?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#5f6368]">Date</span>
                  <span className="text-[11px] font-medium">
                    {new Date(showVersionDetail.createdAt).toLocaleString()}
                  </span>
                </div>
                {showVersionDetail.changeNotes && (
                  <div>
                    <span className="text-[11px] text-[#5f6368] block mb-1">Notes</span>
                    <p className="text-[11px] text-[#1a1a2e] bg-[#f8f9fa] p-2 rounded-md">{showVersionDetail.changeNotes}</p>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-[#e8eaed]">
                  <p className="text-[10px] text-[#9aa0a6]">Raw version data is stored for full restoration capability.</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
