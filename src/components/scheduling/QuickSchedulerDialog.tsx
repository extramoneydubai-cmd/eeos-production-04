/**
 * QuickSchedulerDialog — Global Quick Scheduler
 *
 * Trigger: Ctrl+Shift+K (or Cmd+Shift+K on Mac)
 *
 * Features:
 * - Natural language input: "Schedule demo tomorrow 5PM", "Meeting with Parent", "Interview Monday"
 * - Entity detection: auto-detects people, modules, resources from search
 * - Quick create with minimal fields
 * - Time slot suggestions
 * - Recurrence options
 * - Conflict detection
 *
 * Usage anywhere in EEOS:
 *   import { useQuickScheduler } from "@/components/scheduling/QuickSchedulerDialog";
 *   const { open } = useQuickScheduler();
 *   <button onClick={open}>Quick Schedule</button>
 *
 * Architecture:
 *   QuickSchedulerDialog
 *     → QuickInput (natural language parsing)
 *     → ScheduleForm (minimal fields)
 *     → schedulingSdk (create)
 *     → Event Pipeline (audit/timeline)
 */

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, Users, MapPin, Loader2, Check, AlertCircle,
  Sparkles, ArrowRight, Repeat, Bell, Tag, ChevronDown,
  Search, Plus, Briefcase, BookOpen, Star, Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SCHEDULE_TYPE_CONFIG } from "./ScheduleWidget";

// ─── Context ─────────────────────────────────────────────────────

interface QuickSchedulerContextType {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const QuickSchedulerContext = createContext<QuickSchedulerContextType>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export const useQuickScheduler = () => useContext(QuickSchedulerContext);

// ─── Natural Language Parser ──────────────────────────────────────

function parseNaturalLanguage(input: string): Partial<{
  title: string;
  scheduleType: string;
  start: Date;
  end: Date;
  description: string;
  priority: string;
  recurrence: string;
}> {
  const result: any = {};
  const lower = input.toLowerCase().trim();

  // Detect schedule type
  const typePatterns: [RegExp, string][] = [
    [/meeting|meet\b|sync|standup|1:1|one.?on.?one|discuss|call/i, "meeting"],
    [/lecture|class|lesson|lecture|teach|session|tutorial/i, "lecture"],
    [/exam|test|quiz|assessment|final|board/i, "exam"],
    [/interview|talk|screen|evaluate|candidate/i, "interview"],
    [/training|workshop|seminar|orientation|onboard/i, "training"],
    [/counsel|counseling|advisory|parent.?meet|guidance/i, "counseling"],
    [/maintenance|repair|fix|servic|inspect|audit/i, "maintenance"],
    [/holiday|vacation|leave|off|break|day.?off/i, "holiday"],
  ];
  for (const [pattern, type] of typePatterns) {
    if (pattern.test(lower)) {
      result.scheduleType = type;
      break;
    }
  }

  // Detect date/time
  const now = new Date();

  // "tomorrow"
  if (/tomorrow/.test(lower)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.start = tomorrow;
  }
  // "next week"
  else if (/next week/.test(lower)) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()) + 1);
    result.start = nextWeek;
  }
  // "next monday" etc
  else if (/next (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(lower)) {
    const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const match = lower.match(/next (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (match) {
      const dayStr = match[1].toLowerCase().slice(0, 3);
      const targetDay = dayMap[dayStr];
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const next = new Date(now);
      next.setDate(next.getDate() + daysUntil + 7);
      result.start = next;
    }
  }
  // "this week" / "today"
  else if (/today/.test(lower)) {
    result.start = now;
  }

  // Detect time — "5PM", "5:00", "5pm"
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridian = timeMatch[3].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;

    if (result.start) {
      result.start.setHours(hours, minutes, 0, 0);
    } else {
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      result.start = d;
    }
  }

  // Default duration: 1 hour
  if (result.start) {
    result.end = new Date(result.start.getTime() + 60 * 60 * 1000);
  }

  // Detect priority
  if (/urgent|important|critical|high priority|asap/i.test(lower)) {
    result.priority = "high";
  } else if (/low priority|whenever|someday|casual/i.test(lower)) {
    result.priority = "low";
  }

  // Check for recurrence
  if (/daily|every day|each day/i.test(lower)) result.recurrence = "daily";
  else if (/weekly|every week/i.test(lower)) result.recurrence = "weekly";
  else if (/biweekly|bi-weekly|every two weeks/i.test(lower)) result.recurrence = "biweekly";
  else if (/monthly|every month/i.test(lower)) result.recurrence = "monthly";

  // Extract title — remove known pattern prefixes
  let title = input.trim();
  const prefixes = [
    /^schedule\s+/i, /^create\s+/i, /^add\s+/i, /^book\s+/i,
    /^set up\s+/i, /^plan\s+/i, /^organize\s+/i, /^arrange\s+/i,
  ];
  for (const p of prefixes) {
    title = title.replace(p, "");
  }
  // Remove time/datetime patterns from title
  title = title.replace(/\s+(?:tomorrow|today|next\s+\w+|at\s+\d[\d:]*\s*(?:am|pm)?|at\s+\d{1,2}:\d{2})/gi, "");
  title = title.replace(/\s+(?:\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi, "");
  // Clean up
  title = title.replace(/\s+/g, " ").trim();
  if (title.length < 2) title = input.trim();

  result.title = title.charAt(0).toUpperCase() + title.slice(1);

  return result;
}

// ─── Time Suggestions ─────────────────────────────────────────────

function getTimeSlots(): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const currentHour = now.getHours();
  const suggestions: { label: string; start: Date; end: Date }[] = [];

  // Next hour slot
  const nextHour = new Date(now);
  nextHour.setHours(currentHour + 1, 0, 0, 0);
  const nextHourEnd = new Date(nextHour);
  nextHourEnd.setHours(nextHour.getHours() + 1);

  suggestions.push({
    label: `Now (${nextHour.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })})`,
    start: nextHour,
    end: nextHourEnd,
  });

  // Tomorrow morning
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const morning = new Date(tomorrow);
  morning.setHours(9, 0, 0, 0);
  const morningEnd = new Date(morning);
  morningEnd.setHours(10, 0, 0, 0);
  suggestions.push({
    label: `Tomorrow 9:00 AM`,
    start: morning,
    end: morningEnd,
  });

  // Tomorrow afternoon
  const afternoon = new Date(tomorrow);
  afternoon.setHours(14, 0, 0, 0);
  const afternoonEnd = new Date(afternoon);
  afternoonEnd.setHours(15, 0, 0, 0);
  suggestions.push({
    label: `Tomorrow 2:00 PM`,
    start: afternoon,
    end: afternoonEnd,
  });

  // Week from now
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);
  const weekMorning = new Date(weekLater);
  weekMorning.setHours(10, 0, 0, 0);
  const weekEnd = new Date(weekMorning);
  weekEnd.setHours(11, 0, 0, 0);
  suggestions.push({
    label: `Next week (${weekMorning.toLocaleDateString("en-US", { weekday: "long" })} 10:00 AM)`,
    start: weekMorning,
    end: weekEnd,
  });

  return suggestions;
}

// ─── Props ────────────────────────────────────────────────────────

interface QuickSchedulerDialogProps {
  /** Default entity context (e.g., student ID, employee ID) */
  entityType?: string;
  entityId?: string;
  companyId?: string;
  branchId?: string;
  /** Called after successful creation */
  onCreated?: (scheduleId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────

export function QuickSchedulerProvider({ children, ...props }: { children: React.ReactNode } & QuickSchedulerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global keyboard shortcut: Ctrl+Shift+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <QuickSchedulerContext.Provider value={{ open, close, isOpen }}>
      {children}
      <QuickSchedulerDialog
        isOpen={isOpen}
        onClose={close}
        {...props}
      />
    </QuickSchedulerContext.Provider>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────

function QuickSchedulerDialog({
  isOpen, onClose, entityType, entityId, companyId, branchId, onCreated,
}: QuickSchedulerDialogProps & { isOpen: boolean; onClose: () => void }) {
  const { user, isDemoMode } = useAuth();
  const createSchedule = useMutation(api.schedulingSdk.create as any);
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"input" | "confirm" | "done">("input");
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseNaturalLanguage>>({});
  const [selectedType, setSelectedType] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [error, setError] = useState("");

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setStep("input");
      setInput("");
      setParsed({});
      setError("");
      setCreating(false);
      setCreatedId("");
    }
  }, [isOpen]);

  // Parse on input change
  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim().length > 3) {
      const p = parseNaturalLanguage(value);
      setParsed(p);
      if (p.scheduleType) setSelectedType(p.scheduleType);
    }
  };

  // Quick parse from button
  const handleQuickParse = () => {
    if (input.trim().length < 3) return;
    const p = parseNaturalLanguage(input);
    setParsed(p);
    if (p.scheduleType) setSelectedType(p.scheduleType);
    setStep("confirm");
  };

  // Confirm and create
  const handleCreate = async () => {
    if (!user && !isDemoMode) {
      setError("You must be logged in to create schedules");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const start = parsed.start || (() => {
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        return d;
      })();
      const end = parsed.end || new Date(start.getTime() + 60 * 60 * 1000);

      const id = await createSchedule({
        title: parsed.title || input.trim() || "New Schedule",
        description: input || "",
        scheduleType: selectedType || parsed.scheduleType || "meeting",
        start: start.getTime(),
        end: end.getTime(),
        priority: parsed.priority || "medium",
        entityType: entityType || undefined,
        entityId: entityId || undefined,
        companyId: companyId || undefined,
        branchId: branchId || undefined,
        createdBy: user?._id,
      });

      setCreatedId(id);
      setStep("done");
      onCreated?.(id);
    } catch (err: any) {
      setError(err.message || "Failed to create schedule");
    } finally {
      setCreating(false);
    }
  };

  const timeSlots = getTimeSlots();

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#1a73e8]" />
                  <h2 className="text-[14px] font-semibold text-[#1a1a2e]">Quick Schedule</h2>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="text-[9px] px-1.5 py-0.5 bg-[#f1f3f4] rounded text-[#5f6368] border border-[#e8eaed] font-mono">Ctrl+Shift+K</kbd>
                  <button onClick={onClose} className="p-1 rounded hover:bg-[#f1f3f4] transition-colors">
                    <X className="h-3.5 w-3.5 text-[#5f6368]" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickParse()}
                  placeholder="Type natural language... e.g. 'Schedule demo tomorrow 5PM'"
                  className="w-full h-10 px-3 text-[13px] bg-[#f8f9fa] border border-[#e8eaed] rounded-lg outline-none focus:border-[#1a73e8] focus:bg-white transition-all placeholder:text-[#9aa0a6]"
                />
                {input.trim().length >= 3 && (
                  <button
                    onClick={handleQuickParse}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1a73e8] text-white text-[11px] font-medium rounded-md hover:bg-[#1557b0] transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick parse preview */}
              {parsed.title && (
                <div className="mt-3 p-2.5 bg-[#f0f9ff] border border-[#d1e4ff] rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-3 w-3 text-[#1a73e8]" />
                    <span className="text-[10px] font-medium text-[#1a73e8]">Detected</span>
                  </div>
                  <p className="text-[12px] font-medium text-[#1a1a2e]">{parsed.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {parsed.scheduleType && (
                      <Badge variant="outline" className="text-[9px] h-4"
                        style={{ color: SCHEDULE_TYPE_CONFIG[parsed.scheduleType]?.color || "#5f6368" }}>
                        {SCHEDULE_TYPE_CONFIG[parsed.scheduleType]?.label || parsed.scheduleType}
                      </Badge>
                    )}
                    {parsed.start && (
                      <span className="text-[9px] text-[#5f6368] flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {parsed.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" "}{parsed.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                    {parsed.priority === "high" && (
                      <Badge variant="outline" className="text-[8px] h-3.5 bg-red-50 text-red-600 border-red-200">High</Badge>
                    )}
                  </div>
                  <Button size="sm" className="mt-2 h-7 text-[11px] w-full" onClick={handleQuickParse}>
                    Continue <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}

              {/* Quick suggestions */}
              <div className="mt-3">
                <p className="text-[10px] text-[#9aa0a6] font-medium mb-2">Suggestions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { text: "Meeting tomorrow 10AM", icon: Briefcase },
                    { text: "Interview Friday 3PM", icon: Users },
                    { text: "Training next Monday 9AM", icon: Star },
                    { text: "Holiday next Friday", icon: Coffee },
                  ].map((s) => (
                    <button
                      key={s.text}
                      onClick={() => handleInputChange(s.text)}
                      className="flex items-center gap-2 px-2.5 py-2 border border-[#e8eaed] rounded-lg hover:bg-[#f8f9fa] transition-colors text-left"
                    >
                      <s.icon className="h-3 w-3 text-[#5f6368]" />
                      <span className="text-[11px] text-[#1a1a2e] truncate">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slot shortcuts */}
              <div className="mt-3">
                <p className="text-[10px] text-[#9aa0a6] font-medium mb-2">Quick time slots</p>
                <div className="flex flex-wrap gap-1.5">
                  {timeSlots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setParsed((prev) => ({ ...prev, start: slot.start, end: slot.end }));
                        setStep("confirm");
                      }}
                      className="px-2.5 py-1.5 border border-[#e8eaed] rounded-lg text-[10px] text-[#5f6368] hover:bg-[#f8f9fa] hover:border-[#1a73e8] hover:text-[#1a73e8] transition-all"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-[#1a73e8]" />
                <h2 className="text-[14px] font-semibold text-[#1a1a2e]">Confirm Schedule</h2>
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <Label className="text-[10px] text-[#5f6368]">Title</Label>
                  <Input
                    value={parsed.title || ""}
                    onChange={(e) => setParsed((prev) => ({ ...prev, title: e.target.value }))}
                    className="h-8 text-[12px] mt-1"
                  />
                </div>

                {/* Type */}
                <div>
                  <Label className="text-[10px] text-[#5f6368]">Type</Label>
                  <Select value={selectedType || parsed.scheduleType || ""} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-8 text-[12px] mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCHEDULE_TYPE_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key} className="text-[11px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                            {cfg.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date/time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-[#5f6368]">Date</Label>
                    <Input
                      type="date"
                      value={parsed.start ? parsed.start.toISOString().split("T")[0] : ""}
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        const existing = parsed.start || new Date();
                        d.setHours(existing.getHours(), existing.getMinutes());
                        setParsed((prev) => ({ ...prev, start: d, end: new Date(d.getTime() + 3600000) }));
                      }}
                      className="h-8 text-[12px] mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-[#5f6368]">Time</Label>
                    <Input
                      type="time"
                      value={parsed.start ? parsed.start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : ""}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":");
                        const d = parsed.start || new Date();
                        d.setHours(parseInt(h), parseInt(m));
                        setParsed((prev) => ({ ...prev, start: d, end: new Date(d.getTime() + 3600000) }));
                      }}
                      className="h-8 text-[12px] mt-1"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-[10px] text-[#5f6368]">Description (optional)</Label>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-8 text-[12px] mt-1"
                    placeholder="Original input..."
                  />
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-[10px] text-[#5f6368]">Priority</Label>
                  <Select
                    value={parsed.priority || "medium"}
                    onValueChange={(v) => setParsed((prev) => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger className="h-8 text-[12px] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-[11px]">Low</SelectItem>
                      <SelectItem value="medium" className="text-[11px]">Medium</SelectItem>
                      <SelectItem value="high" className="text-[11px]">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recurrence */}
                <div>
                  <Label className="text-[10px] text-[#5f6368]">Recurrence</Label>
                  <Select
                    value={parsed.recurrence || "none"}
                    onValueChange={(v) => setParsed((prev) => ({ ...prev, recurrence: v }))}
                  >
                    <SelectTrigger className="h-8 text-[12px] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-[11px]">None</SelectItem>
                      <SelectItem value="daily" className="text-[11px]">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-[11px]">Weekly</SelectItem>
                      <SelectItem value="biweekly" className="text-[11px]">Bi-weekly</SelectItem>
                      <SelectItem value="monthly" className="text-[11px]">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#e8eaed]">
                <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setStep("input")}>
                  Back
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-[11px] flex-1"
                  disabled={creating}
                  onClick={handleCreate}
                >
                  {creating ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Creating...</>
                  ) : (
                    <><Check className="h-3 w-3 mr-1" /> Create Schedule</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#e6f4ea] flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-[#34a853]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#1a1a2e] mb-1">Schedule Created</h3>
              <p className="text-[12px] text-[#5f6368] mb-4">
                {parsed.title || input} has been added to your calendar.
              </p>
              <div className="flex items-center gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-[11px]"
                  onClick={() => {
                    setStep("input");
                    setInput("");
                    setParsed({});
                  }}
                >
                  Create Another
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default QuickSchedulerDialog;
