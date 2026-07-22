import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollableDialogContent, ScrollableDialogBody } from "@/components/ui/scrollable-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CallOutcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  userId: string;
  logCallActivity: (args: any) => Promise<any>;
}

export default function CallOutcomeDialog({
  open, onOpenChange, leadId, leadName, userId, logCallActivity,
}: CallOutcomeDialogProps) {
  const [callType, setCallType] = useState("outgoing");
  const [callOutcome, setCallOutcome] = useState("");
  const [callDate, setCallDate] = useState(Date.now());
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [callNotes, setCallNotes] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState<number | undefined>(undefined);
  const [createFollowupTask, setCreateFollowupTask] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setCallType("outgoing");
    setCallOutcome("");
    setCallDate(Date.now());
    setDurationMinutes(0);
    setDurationSeconds(0);
    setCallNotes("");
    setNextFollowupDate(undefined);
    setCreateFollowupTask(false);
  };

  const handleSave = async () => {
    if (!callOutcome) return;
    setSaving(true);
    try {
      await logCallActivity({
        leadId: leadId as any,
        callType,
        outcome: callOutcome,
        callDate,
        durationMinutes: durationMinutes || undefined,
        durationSeconds: durationSeconds || undefined,
        notes: callNotes || undefined,
        followupDate: nextFollowupDate,
        createFollowupTask,
        userId: userId as any,
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
      <ScrollableDialogContent className="sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm font-semibold">Log Call</DialogTitle>
          <DialogDescription className="text-[11px]">
            Record conversation details for {leadName}
          </DialogDescription>
        </DialogHeader>
        <ScrollableDialogBody className="space-y-4 py-1">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider">Call Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block">Call Type</label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value)}
                  className="w-full h-8 text-[12px] px-2 rounded-md border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
                >
                  <option value="outgoing">Outgoing</option>
                  <option value="incoming">Incoming</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block">Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full h-8 text-[12px] px-2 rounded-md border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
                >
                  <option value="">Select outcome</option>
                  <option value="connected">Connected</option>
                  <option value="busy">Busy</option>
                  <option value="no_answer">No Answer</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="callback_needed">Callback Needed</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block">Call Date & Time</label>
              <Input
                type="datetime-local"
                value={(() => {
                  const d = new Date(callDate);
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                })()}
                onChange={(e) => setCallDate(new Date(e.target.value).getTime())}
                className="h-8 text-[12px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block">Minutes</label>
                <Input
                  type="number" min={0} max={999}
                  value={durationMinutes || ""}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="h-8 text-[12px]" placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#5f6368] mb-1 block">Seconds</label>
                <Input
                  type="number" min={0} max={59}
                  value={durationSeconds || ""}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                  className="h-8 text-[12px]" placeholder="0"
                />
              </div>
              <div className="pb-1">
                <p className="text-[10px] text-[#9aa0a6]">Total</p>
                <p className="text-[12px] font-medium text-[#1a1a2e]">{durationMinutes || 0}m {durationSeconds || 0}s</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider">Notes</p>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Conversation summary, concerns, next action..."
              className="w-full min-h-[60px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider">Follow-up</p>
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block">Follow-up Date (optional)</label>
              <Input
                type="date"
                value={nextFollowupDate ? new Date(nextFollowupDate).toISOString().split("T")[0] : ""}
                onChange={(e) => setNextFollowupDate(e.target.value ? new Date(e.target.value).getTime() : undefined)}
                className="h-8 text-[12px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFollowupTask}
                  onChange={(e) => setCreateFollowupTask(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e8eaed] accent-[#1a1a2e]"
                />
                <span className="text-[11px] text-[#5f6368]">Create follow-up task</span>
              </label>
            </div>
            {createFollowupTask && (
              <div className="p-2.5 rounded-lg bg-[#f8f9fa]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#1a1a2e]">Follow-up — {leadName}</span>
                  <span className="text-[9px] text-[#9aa0a6]">High priority</span>
                </div>
                {nextFollowupDate && (
                  <p className="text-[10px] text-[#5f6368] mt-0.5">Due: {new Date(nextFollowupDate).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>
        </ScrollableDialogBody>
        <DialogFooter className="gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" className="h-8 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" disabled={!callOutcome || saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>        </ScrollableDialogContent>
      </Dialog>
  );
}
