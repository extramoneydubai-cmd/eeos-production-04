import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface WhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  whatsappUsername?: string;
  phone?: string;
  userId: string;
  sendWhatsAppMessage: (args: any) => Promise<any>;
}

export default function WhatsAppDialog({
  open, onOpenChange, leadId, leadName, whatsappUsername, phone, userId, sendWhatsAppMessage,
}: WhatsAppDialogProps) {
  const [waMessage, setWaMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const getIdentifier = () => {
    // Priority 1: WhatsApp Username, Priority 2: Phone
    return whatsappUsername || (phone?.replace(/[^0-9]/g, "")) || "";
  };

  const resetState = () => {
    setWaMessage("");
  };

  const handleSend = async () => {
    if (!waMessage) return;
    const identifier = getIdentifier();
    if (!identifier) return;

    const isEmail = identifier.includes("@");
    const url = isEmail
      ? `https://wa.me/?text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/91${identifier}?text=${encodeURIComponent(waMessage)}`;

    setSaving(true);
    try {
      await sendWhatsAppMessage({
        leadId: leadId as any,
        message: waMessage,
        whatsappUrl: url,
        sentBy: userId as any,
      });
      window.open(url, "_blank");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Send WhatsApp</DialogTitle>
          <DialogDescription className="text-[11px]">
            Message to {leadName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <textarea
            value={waMessage}
            onChange={(e) => setWaMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full min-h-[80px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
            rows={4}
          />
          <p className="text-[10px] text-[#9aa0a6]">
            Will send to {leadName} via WhatsApp{whatsappUsername ? ` (${whatsappUsername})` : phone ? ` (${phone})` : ""}
          </p>
        </div>
        <DialogFooter className="gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]" onClick={handleCancel}>Cancel</Button>
          <Button
            size="sm" className="h-8 text-[10px] bg-[#25D366] hover:bg-[#20BD5A] text-white"
            disabled={!waMessage || !getIdentifier() || saving}
            onClick={handleSend}
          >
            <ExternalLink className="h-3 w-3 mr-1" /> {saving ? "Opening..." : "Open WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
