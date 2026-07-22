import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowRight, CheckCircle2, Loader2, DollarSign, FileText, Target,
  CreditCard, GraduationCap, Sparkles, AlertCircle,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const STEPS = [
  { id: "opportunity", label: "Opportunity", icon: Target, color: "text-[#1a73e8]" },
  { id: "quotation", label: "Quotation", icon: FileText, color: "text-[#e8710a]" },
  { id: "payment", label: "Payment", icon: DollarSign, color: "text-[#34a853]" },
  { id: "admission", label: "Admission", icon: GraduationCap, color: "text-[#a855f7]" },
  { id: "complete", label: "Complete", icon: CheckCircle2, color: "text-[#34a853]" },
];

interface Props {
  leadId: Id<"leadMaster">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function LeadConversionWizard({ leadId, open, onOpenChange, onComplete }: Props) {
  const lead = useQuery(api.crm.getLeadById, { leadId });
  const opportunityStages = useQuery(api.salesOpportunityStages.listOpportunityStages, {});
  const users = useQuery(api.users.listUsers);

  const createOpportunity = useMutation(api.opportunities.create);
  const createQuotation = useMutation(api.quotations.create);
  const addPayment = useMutation(api.crm.addPayment);
  const updateStage = useMutation(api.crm.updateLeadStage);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Opportunity form
  const [oppTitle, setOppTitle] = useState("");
  const [oppStageId, setOppStageId] = useState("");
  const [oppProbability, setOppProbability] = useState(50);
  const [oppRevenue, setOppRevenue] = useState("");
  const [oppNotes, setOppNotes] = useState("");

  // Quotation form
  const [quoteLineItems, setQuoteLineItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteGst, setQuoteGst] = useState(18);
  const [quoteNotes, setQuoteNotes] = useState("");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [payReference, setPayReference] = useState("");

  // Results
  const [createdOppId, setCreatedOppId] = useState<string | null>(null);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);

  const user = users?.[0]; // Will use actual user in practice
  const activeStage = step >= STEPS.length ? STEPS.length - 1 : step;

  const handleCreateOpportunity = async () => {
    if (!oppStageId || !user || !lead) return;
    setLoading(true);
    try {
      const id = await createOpportunity({
        leadId,
        ownerId: user._id,
        title: oppTitle || `Opportunity - ${lead.firstName} ${lead.lastName}`,
        stageId: oppStageId as any,
        probability: oppProbability,
        expectedRevenue: oppRevenue ? parseInt(oppRevenue) : undefined,
        notes: oppNotes || undefined,
      });
      setCreatedOppId(id);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = async () => {
    if (!createdOppId || !user) return;
    setLoading(true);
    try {
      const validItems = quoteLineItems.filter((li) => li.description && li.unitPrice > 0);
      if (validItems.length === 0) return;
      const id = await createQuotation({
        opportunityId: createdOppId as any,
        leadId,
        createdBy: user._id,
        issuedDate: Date.now(),
        lineItems: validItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
        discountPercent: quoteDiscount > 0 ? quoteDiscount : undefined,
        gstPercent: quoteGst > 0 ? quoteGst : undefined,
        notes: quoteNotes || undefined,
      });
      setCreatedQuoteId(id);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!payAmount || !user) return;
    setLoading(true);
    try {
      await addPayment({
        leadId,
        amount: parseInt(payAmount),
        mode: payMode as any,
        reference: payReference || undefined,
        enteredBy: user._id,
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateStage({ leadId, stage: "converted", userId: user!._id });
      setStep(4);
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setQuoteLineItems([...quoteLineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const updateLineItem = (idx: number, field: string, value: any) => {
    const items = [...quoteLineItems];
    (items[idx] as any)[field] = value;
    setQuoteLineItems(items);
  };

  const removeLineItem = (idx: number) => {
    setQuoteLineItems(quoteLineItems.filter((_, i) => i !== idx));
  };

  const calcSubtotal = () => {
    return quoteLineItems.reduce((s, li) => s + (li.quantity * li.unitPrice), 0);
  };

  const calcTotal = () => {
    const sub = calcSubtotal();
    const disc = sub * (quoteDiscount / 100);
    const afterDisc = sub - disc;
    const gst = afterDisc * (quoteGst / 100);
    return afterDisc + gst;
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Opportunity
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Opportunity Title</label>
              <Input value={oppTitle} onChange={(e) => setOppTitle(e.target.value)}
                className="h-8 text-[12px]" placeholder={`Opportunity for ${lead?.firstName || ""} ${lead?.lastName || ""}`} />
            </div>
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Stage *</label>
              <Select value={oppStageId} onValueChange={setOppStageId}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {opportunityStages?.filter((s: any) => !s.isClosed).map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>{s.name} ({s.probability}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Probability %</label>
                <Input type="number" min={0} max={100} value={oppProbability}
                  onChange={(e) => setOppProbability(parseInt(e.target.value) || 0)} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Expected Revenue (₹)</label>
                <Input type="number" value={oppRevenue} onChange={(e) => setOppRevenue(e.target.value)}
                  className="h-8 text-[12px]" placeholder={lead?.expectedRevenue?.toLocaleString() || "0"} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Notes</label>
              <Textarea value={oppNotes} onChange={(e) => setOppNotes(e.target.value)}
                className="text-[12px] min-h-[60px]" placeholder="Add any notes..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={handleCreateOpportunity} disabled={!oppStageId || loading}
                className="h-8 text-[11px] bg-[#1a73e8] hover:bg-[#1557b0]">
                {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Target className="h-3 w-3 mr-1" />}
                Create Opportunity
              </Button>
            </div>
          </div>
        );

      case 1: // Quotation
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {quoteLineItems.map((li, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-[#f8f9fa]">
                  <div className="flex-1 space-y-1">
                    <Input value={li.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                      className="h-7 text-[11px]" placeholder="Description" />
                    <div className="flex gap-2">
                      <Input type="number" min={1} value={li.quantity}
                        onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="h-7 text-[11px] w-20" placeholder="Qty" />
                      <Input type="number" min={0} value={li.unitPrice}
                        onChange={(e) => updateLineItem(idx, "unitPrice", parseInt(e.target.value) || 0)}
                        className="h-7 text-[11px] w-28" placeholder="Price" />
                      <span className="text-[11px] text-[#5f6368] self-center font-medium w-20 text-right">
                        ₹{(li.quantity * li.unitPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeLineItem(idx)} className="text-[#ea4335] hover:text-[#d93025] mt-1">
                    <AlertCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLineItem}
                className="h-7 text-[10px] border-[#e8eaed] w-full">
                + Add Line Item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Discount %</label>
                <Input type="number" min={0} max={100} value={quoteDiscount}
                  onChange={(e) => setQuoteDiscount(parseInt(e.target.value) || 0)} className="h-8 text-[12px]" />
              </div>
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">GST %</label>
                <Input type="number" min={0} max={100} value={quoteGst}
                  onChange={(e) => setQuoteGst(parseInt(e.target.value) || 0)} className="h-8 text-[12px]" />
              </div>
            </div>

            <div className="bg-[#f8f9fa] rounded-md p-3 space-y-1">
              <div className="flex justify-between text-[11px]"><span className="text-[#5f6368]">Subtotal</span><span>₹{calcSubtotal().toLocaleString()}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-[#5f6368]">Discount</span><span>-₹{(calcSubtotal() * quoteDiscount / 100).toLocaleString()}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-[#5f6368]">GST</span><span>₹{((calcSubtotal() - (calcSubtotal() * quoteDiscount / 100)) * quoteGst / 100).toLocaleString()}</span></div>
              <div className="flex justify-between text-[13px] font-bold border-t border-[#e8eaed] pt-1 mt-1">
                <span>Total</span><span>₹{calcTotal().toLocaleString()}</span>
              </div>
            </div>

            <Textarea value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)}
              className="text-[12px] min-h-[50px]" placeholder="Additional notes..." />

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(0)}
                className="h-8 text-[11px] border-[#e8eaed]">Back</Button>
              <Button size="sm" onClick={handleCreateQuotation} disabled={loading}
                className="h-8 text-[11px] bg-[#e8710a] hover:bg-[#d06200]">
                {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
                Create Quotation
              </Button>
            </div>
          </div>
        );

      case 2: // Payment
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Amount (₹) *</label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="h-8 text-[12px]" placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Payment Mode</label>
              <Select value={payMode} onValueChange={setPayMode}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Reference (optional)</label>
              <Input value={payReference} onChange={(e) => setPayReference(e.target.value)}
                className="h-8 text-[12px]" placeholder="Transaction ID, cheque no, etc." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}
                className="h-8 text-[11px] border-[#e8eaed]">Back</Button>
              <Button size="sm" onClick={handleRecordPayment} disabled={!payAmount || loading}
                className="h-8 text-[11px] bg-[#34a853] hover:bg-[#2d9249]">
                {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <DollarSign className="h-3 w-3 mr-1" />}
                Record Payment
              </Button>
            </div>
          </div>
        );

      case 3: // Admission placeholder
        return (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mx-auto">
              <GraduationCap className="h-8 w-8 text-[#a855f7]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Admission Engine</h3>
              <p className="text-[12px] text-[#5f6368] mt-1">Admission processing will be available in the next release.</p>
              <Badge className="mt-2 text-[10px] bg-[#f1f3f4] text-[#9aa0a6]">Coming Soon</Badge>
            </div>
            <Button size="sm" onClick={handleComplete} disabled={loading}
              className="h-8 text-[11px] bg-[#34a853] hover:bg-[#2d9249] mt-4">
              {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Complete Conversion
            </Button>
          </div>
        );

      case 4: // Complete
        return (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#e6f4ea] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-[#34a853]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1a1a2e]">Conversion Complete</h3>
            <p className="text-[12px] text-[#5f6368]">Lead has been converted successfully.</p>
            {createdQuoteId && (
              <p className="text-[11px] text-[#1a73e8]">Quotation #{createdQuoteId.slice(-6)} created</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#e8710a]" />
            Lead Conversion Wizard
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Convert {lead?.firstName} {lead?.lastName} from lead to customer
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-1 py-2">
          {STEPS.map((s, idx) => {
            const isComplete = idx < activeStage;
            const isCurrent = idx === activeStage;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? "bg-[#34a853]" : isCurrent ? "bg-[#1a73e8]" : "bg-[#f1f3f4]"
                  }`}>
                    {isComplete ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                      <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-white" : "text-[#9aa0a6]"}`} />}
                  </div>
                  <span className={`text-[8px] mt-1 ${isCurrent ? "text-[#1a73e8] font-semibold" : "text-[#9aa0a6]"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-px w-6 mx-1 mt-[-16px] ${idx < activeStage ? "bg-[#34a853]" : "bg-[#e8eaed]"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#e8eaed] pt-4">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
