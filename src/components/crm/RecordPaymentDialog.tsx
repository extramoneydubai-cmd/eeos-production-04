import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollableDialogContent, ScrollableDialogBody } from "@/components/ui/scrollable-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  userId: string;
  addPayment: (args: any) => Promise<any>;
}

export default function RecordPaymentDialog({
  open, onOpenChange, leadId, leadName, userId, addPayment,
}: RecordPaymentDialogProps) {
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "upi" | "bank" | "card" | "cheque" | "online">("cash");
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setPayAmount("");
    setPayMode("cash");
    setPayReference("");
    setPayNotes("");
  };

  const handleSave = async () => {
    if (!payAmount) return;
    setSaving(true);
    try {
      await addPayment({
        leadId: leadId as any,
        amount: parseInt(payAmount) || 0,
        mode: payMode,
        reference: payReference || undefined,
        notes: payNotes || undefined,
        enteredBy: userId as any,
      });
      onOpenChange(false);
      resetState();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); else onOpenChange(v); }}>
      <ScrollableDialogContent className="sm:max-w-sm">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm font-semibold">Record Payment</DialogTitle>
          <DialogDescription className="text-[11px]">
            Add payment for {leadName}
          </DialogDescription>
        </DialogHeader>
        <ScrollableDialogBody className="space-y-3 py-1">
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block">Amount (₹)</label>
            <Input
              type="number" min={0}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="h-8 text-[12px]"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block">Payment Mode</label>
            <select
              value={payMode}
              onChange={(e) => setPayMode(e.target.value as any)}
              className="w-full h-8 text-[12px] px-2 rounded-md border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block">Reference (optional)</label>
            <Input
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="h-8 text-[12px]"
              placeholder="Transaction ID, UTR, etc."
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block">Notes (optional)</label>
            <textarea
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Additional notes..."
              className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
              rows={2}
            />
          </div>
        </ScrollableDialogBody>
        <DialogFooter className="gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" className="h-8 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" disabled={!payAmount || saving} onClick={handleSave}>
            <Plus className="h-3 w-3 mr-1" /> {saving ? "Recording..." : "Record"}
          </Button>
        </DialogFooter>        </ScrollableDialogContent>
      </Dialog>
  );
}
