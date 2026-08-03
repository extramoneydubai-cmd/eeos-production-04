/**
 * CalendarPage — Enterprise Calendar & Scheduling
 *
 * PATCH-UI-003: Full-featured calendar with Day, Week, Month, Agenda views.
 * Uses calendarSdk for all backend operations.
 * Supports tasks, meetings, follow-ups, lectures, examinations, leaves, birthdays.
 * Recurring events, conflict detection, participant management, reminders.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Repeat,
  Bell,
  Trash2,
  Edit3,
  X,
  Loader2,
  Check,
  CalendarDays,
  List,
  Grid3X3,
  CalendarRange,
  Filter,
  MoreHorizontal,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MessageSquare,
  Video,
  Presentation,
  Coffee,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Cake,
  Star,
  BookOpen,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────

type ViewType = "day" | "week" | "month" | "agenda";
type EventType =
  | "meeting"
  | "task"
  | "follow_up"
  | "lecture"
  | "examination"
  | "leave"
  | "birthday"
  | "appointment"
  | "interview"
  | "booking"
  | "company_event"
  | "other";

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; icon: any }> = {
  meeting: { label: "Meeting", color: "#4285f4", icon: Video },
  task: { label: "Task", color: "#34a853", icon: Check },
  follow_up: { label: "Follow-up", color: "#fbbc04", icon: MessageSquare },
  lecture: { label: "Lecture", color: "#a855f7", icon: BookOpen },
  examination: { label: "Examination", color: "#ea4335", icon: FileCheck },
  leave: { label: "Leave", color: "#f59e0b", icon: Coffee },
  birthday: { label: "Birthday", color: "#ec4899", icon: Cake },
  appointment: { label: "Appointment", color: "#06b6d4", icon: Stethoscope },
  interview: { label: "Interview", color: "#8b5cf6", icon: Users },
  booking: { label: "Booking", color: "#0d9488", icon: CalendarRange },
  company_event: { label: "Company Event", color: "#6366f1", icon: Star },
  other: { label: "Other", color: "#9aa0a6", icon: CalendarIcon },
};

const HOUR_HEIGHT = 48;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function getEventTypeConfig(type: string): typeof EVENT_TYPE_CONFIG.meeting {
  return EVENT_TYPE_CONFIG[type as EventType] || EVENT_TYPE_CONFIG.other;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return startOfDay(d);
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return endOfDay(d);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
}

function dateOnlyEqual(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Event Form Dialog ────────────────────────────────────────────────

function EventFormDialog({
  open,
  onClose,
  editEvent,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  editEvent?: Record<string, any>;
  defaultDate?: Date;
}) {
  const createEvent = useMutation(api.calendarSdk.createEvent as any);
  const updateEvent = useMutation(api.calendarSdk.updateEvent as any);
  const removeEvent = useMutation(api.calendarSdk.removeEvent as any);

  const isEdit = !!editEvent;
  const defaultStart = defaultDate ? new Date(defaultDate) : new Date();
  defaultStart.setHours(9, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(10, 0, 0, 0);

  const [form, setForm] = useState({
    title: editEvent?.title || "",
    description: editEvent?.description || "",
    eventType: editEvent?.eventType || "meeting",
    startDate: editEvent ? new Date(editEvent.startTime).toISOString().split("T")[0] : defaultStart.toISOString().split("T")[0],
    startTime: editEvent ? formatTime(editEvent.startTime) : "09:00",
    endDate: editEvent?.endTime ? new Date(editEvent.endTime).toISOString().split("T")[0] : defaultEnd.toISOString().split("T")[0],
    endTime: editEvent?.endTime ? formatTime(editEvent.endTime) : "10:00",
    allDay: editEvent?.allDay || false,
    location: editEvent?.location || "",
    color: editEvent?.color || "#4285f4",
    recurrence: editEvent?.recurrence || "",
    reminderMinutes: editEvent?.reminderMinutes || 15,
  });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`).getTime();
      const endDateTime = form.allDay
        ? new Date(`${form.startDate}T23:59:59`).getTime()
        : new Date(`${form.endDate}T${form.endTime}:00`).getTime();

      if (isEdit && editEvent) {
        await updateEvent({
          eventId: editEvent._id,
          title: form.title,
          description: form.description || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          allDay: form.allDay,
          location: form.location || undefined,
        });
        toast.success("Event updated");
      } else {
        await createEvent({
          title: form.title,
          description: form.description || undefined,
          eventType: form.eventType,
          startTime: startDateTime,
          endTime: endDateTime,
          allDay: form.allDay,
          location: form.location || undefined,
          color: form.color,
          status: "scheduled",
          reminderMinutes: form.reminderMinutes,
        });
        toast.success("Event created");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editEvent) return;
    try {
      await removeEvent({ eventId: editEvent._id });
      toast.success("Event deleted");
      onClose();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {isEdit ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEdit ? "Edit Event" : "Create Event"}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? "Update event details" : "Schedule a new calendar event"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="h-8 text-[12px]"
                placeholder="Event title..."
              />
            </div>

            {/* Event Type + Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Type</label>
                <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className="text-[12px]">
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Color</label>
                <div className="flex gap-1.5 mt-1">
                  {["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a855f7", "#ec4899", "#06b6d4", "#0d9488", "#6366f1", "#9aa0a6"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={cn("w-6 h-6 rounded-full border-2 transition-all", form.color === c ? "border-[#1a1a2e] scale-110" : "border-transparent")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-[#1a1a2e]">All Day Event</label>
              <Switch
                checked={form.allDay}
                onCheckedChange={(v) => setForm((f) => ({ ...f, allDay: v }))}
              />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="h-8 text-[12px]"
                />
              </div>
              {!form.allDay && (
                <div>
                  <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Start Time</label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="h-8 text-[12px]"
                  />
                </div>
              )}
              {!form.allDay && (
                <>
                  <div>
                    <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="h-8 text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">End Time</label>
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="h-8 text-[12px]"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
                <MapPin className="h-3 w-3 inline mr-1" /> Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="h-8 text-[12px]"
                placeholder="Room, link, or address..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[60px] text-[12px] resize-none"
                rows={2}
                placeholder="Event description..."
              />
            </div>

            {/* Recurrence */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
                  <Repeat className="h-3 w-3 inline mr-1" /> Recurrence
                </label>
                <Select value={form.recurrence} onValueChange={(v) => setForm((f) => ({ ...f, recurrence: v }))}>
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-[12px]">None</SelectItem>
                    <SelectItem value="daily" className="text-[12px]">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-[12px]">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-[12px]">Monthly</SelectItem>
                    <SelectItem value="weekdays" className="text-[12px]">Weekdays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
                  <Bell className="h-3 w-3 inline mr-1" /> Reminder
                </label>
                <Select
                  value={String(form.reminderMinutes)}
                  onValueChange={(v) => setForm((f) => ({ ...f, reminderMinutes: Number(v) }))}
                >
                  <SelectTrigger className="h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="text-[12px]">None</SelectItem>
                    <SelectItem value="5" className="text-[12px]">5 minutes before</SelectItem>
                    <SelectItem value="15" className="text-[12px]">15 minutes before</SelectItem>
                    <SelectItem value="30" className="text-[12px]">30 minutes before</SelectItem>
                    <SelectItem value="60" className="text-[12px]">1 hour before</SelectItem>
                    <SelectItem value="1440" className="text-[12px]">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {isEdit && (
                <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)} className="text-red-500 text-[12px] h-8">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-[12px] h-8">Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-[12px] h-8">
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {isEdit ? "Update" : "Create Event"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDelete} onOpenChange={(v) => !v && setShowDelete(false)}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Delete Event</DialogTitle>
            <DialogDescription>Are you sure you want to delete this event? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDelete(false)} className="text-[12px] h-8">Cancel</Button>
            <Button size="sm" onClick={handleDelete} className="text-[12px] h-8 bg-red-500 hover:bg-red-600">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Event Card ────────────────────────────────────────────────────────

function EventCard({
  event,
  compact = false,
  onClick,
}: {
  event: Record<string, any>;
  compact?: boolean;
  onClick?: () => void;
}) {
  const config = getEventTypeConfig(event.eventType);
  const Icon = config.icon;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate text-white mb-0.5 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: event.color || config.color }}
      >
        {event.title}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "p-2.5 rounded-lg border-l-[3px] cursor-pointer hover:shadow-sm transition-all bg-white",
        "border-[#e8eaed]"
      )}
      style={{ borderLeftColor: event.color || config.color }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div className="p-1 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: `${event.color || config.color}18` }}>
          <Icon className="h-3 w-3" style={{ color: event.color || config.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{event.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-[#5f6368] flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {event.allDay ? "All day" : formatTime(event.startTime)}
              {event.endTime && !event.allDay && ` - ${formatTime(event.endTime)}`}
            </span>
            {event.location && (
              <span className="text-[10px] text-[#5f6368] flex items-center gap-0.5">
                <MapPin className="h-3 w-3" /> {event.location}
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1 mt-0.5 font-normal"
            style={{ color: event.color || config.color, borderColor: `${event.color || config.color}40` }}
          >
            {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Page ─────────────────────────────────────────────────────

export default function CalendarPage() {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<Record<string, any> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    const start = view === "day" ? startOfDay(currentDate) :
      view === "week" ? startOfWeek(currentDate) :
      view === "agenda" ? startOfDay(new Date()) :
      startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    const end = view === "day" ? endOfDay(currentDate) :
      view === "week" ? endOfWeek(currentDate) :
      view === "agenda" ? endOfDay(new Date(Date.now() + 90 * 86400000)) :
      endOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    return { start: start.getTime(), end: end.getTime() };
  }, [view, currentDate]);

  // Fetch events
  const eventsResult = useQuery(api.calendarSdk.getEventsInRange as any, {
    startTime: dateRange.start,
    endTime: dateRange.end,
    limit: 500,
  });
  const allEvents = (eventsResult || []) as Record<string, any>[];

  // Filter events
  const events = useMemo(() => {
    let filtered = allEvents;
    if (filterType !== "all") {
      filtered = filtered.filter((e) => e.eventType === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) => e.title?.toLowerCase().includes(q));
    }
    return filtered;
  }, [allEvents, filterType, search]);

  // Navigation
  const navigateDate = useCallback((direction: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === "day") d.setDate(d.getDate() + direction);
      else if (view === "week") d.setDate(d.getDate() + direction * 7);
      else if (view === "month") d.setMonth(d.getMonth() + direction);
      else d.setDate(d.getDate() + direction * 7);
      return d;
    });
  }, [view]);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  // View header
  const viewTitle = useMemo(() => {
    if (view === "day") return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} - ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (view === "month") return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    return "Upcoming Events";
  }, [view, currentDate]);

  // Events grouped by day
  const getEventsForDay = useCallback((date: Date) => {
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();
    return events.filter((e) => e.startTime >= dayStart && e.startTime <= dayEnd);
  }, [events]);

  const todayEvents = useMemo(() => getEventsForDay(new Date()), [getEventsForDay]);

  // ── Day View ──────────────────────────────────────────────
  const renderDayView = () => (
    <div className="flex flex-col h-[calc(100vh-220px)] overflow-y-auto border border-[#e8eaed] rounded-lg bg-white">
      {/* Day header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#e8eaed] px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1a1a2e]">
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
          <Badge variant="outline" className={cn("text-[10px]", isToday(currentDate) ? "bg-[#1a73e8] text-white" : "")}>
            {getEventsForDay(currentDate).length} events
          </Badge>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1">
        {getHours().map((hour) => {
          const hourEvents = events.filter((e) => {
            const eh = new Date(e.startTime).getHours();
            return eh === hour && dateOnlyEqual(new Date(e.startTime), currentDate);
          });

          return (
            <div
              key={hour}
              className="flex border-b border-[#e8eaed]/60 hover:bg-[#f8f9fa] cursor-pointer"
              style={{ minHeight: HOUR_HEIGHT }}
              onClick={() => {
                const d = new Date(currentDate);
                d.setHours(hour, 0, 0, 0);
                setSelectedDate(d);
                setShowCreate(true);
              }}
            >
              <div className="w-16 shrink-0 text-right pr-3 pt-1">
                <span className="text-[10px] text-[#9aa0a6] font-mono">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </span>
              </div>
              <div className="flex-1 min-h-[48px] py-0.5">
                {hourEvents.map((evt) => {
                  const cfg = getEventTypeConfig(evt.eventType);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={evt._id}
                      className="mx-1 mb-0.5 px-2 py-1 rounded text-[11px] text-white truncate cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: evt.color || cfg.color }}
                      onClick={(e) => { e.stopPropagation(); setEditEvent(evt); }}
                    >
                      <div className="flex items-center gap-1">
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate font-medium">{evt.title}</span>
                        <span className="text-[9px] opacity-70 ml-auto shrink-0">{formatTime(evt.startTime)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Week View ─────────────────────────────────────────────
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex flex-col h-[calc(100vh-220px)] overflow-y-auto border border-[#e8eaed] rounded-lg bg-white">
        {/* Week header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e8eaed] flex">
          <div className="w-16 shrink-0" />
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={idx} className="flex-1 text-center py-2 border-l border-[#e8eaed]/60">
                <p className="text-[10px] text-[#5f6368]">{DAY_NAMES[idx]}</p>
                <p className={cn(
                  "text-sm font-semibold",
                  isToday(day) ? "text-[#1a73e8]" : "text-[#1a1a2e]"
                )}>
                  {day.getDate()}
                </p>
                <p className="text-[9px] text-[#9aa0a6]">{dayEvents.length} events</p>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="flex-1">
          {getHours().map((hour) => (
            <div key={hour} className="flex border-b border-[#e8eaed]/60" style={{ minHeight: 40 }}>
              <div className="w-16 shrink-0 text-right pr-3 pt-0.5">
                <span className="text-[9px] text-[#9aa0a6] font-mono">{hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`}</span>
              </div>
              {weekDays.map((day, dayIdx) => {
                const hourEvents = events.filter((e) =>
                  new Date(e.startTime).getHours() === hour && dateOnlyEqual(new Date(e.startTime), day)
                );
                return (
                  <div
                    key={dayIdx}
                    className="flex-1 border-l border-[#e8eaed]/60 min-h-[40px] p-0.5 cursor-pointer hover:bg-[#f8f9fa]"
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(hour, 0, 0, 0);
                      setSelectedDate(d);
                      setShowCreate(true);
                    }}
                  >
                    {hourEvents.map((evt) => {
                      const cfg = getEventTypeConfig(evt.eventType);
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={evt._id}
                          className="px-1 py-0.5 rounded text-[9px] text-white truncate mb-0.5 cursor-pointer hover:opacity-90"
                          style={{ backgroundColor: evt.color || cfg.color }}
                          onClick={(e) => { e.stopPropagation(); setEditEvent(evt); }}
                        >
                          <span className="font-medium">{evt.title}</span>
                          <span className="ml-1 opacity-70">{formatTime(evt.startTime)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Month View ────────────────────────────────────────────
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const prevYear = month - 1 >= 0 ? year : year - 1;
    const prevMonth = month - 1 >= 0 ? month - 1 : 11;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      week.push(new Date(year, month - 1, daysInPrevMonth - i));
    }

    // Current month's days
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(new Date(year, month, d));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Next month's days
    if (week.length > 0) {
      let nextDay = 1;
      while (week.length < 7) {
        week.push(new Date(year, month + 1, nextDay++));
      }
      weeks.push(week);
    }

    return (
      <div className="border border-[#e8eaed] rounded-lg bg-white overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-[#f8f9fa] border-b border-[#e8eaed]">
          {DAY_NAMES.map((name) => (
            <div key={name} className="py-2 text-center text-[10px] font-medium text-[#5f6368] uppercase tracking-wider">
              {name}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {weeks.flat().map((day, idx) => {
            if (!day) return <div key={idx} />;
            const isCurrentMonth = day.getMonth() === month;
            const dayEvents = getEventsForDay(day);
            const showToday = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[90px] border-b border-r border-[#e8eaed]/60 p-1 cursor-pointer hover:bg-[#f8f9fa] transition-colors",
                  !isCurrentMonth && "bg-[#fafafa]"
                )}
                onClick={() => {
                  setSelectedDate(day);
                  setShowCreate(true);
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={cn(
                      "text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full",
                      showToday ? "bg-[#1a73e8] text-white" : isCurrentMonth ? "text-[#1a1a2e]" : "text-[#9aa0a6]"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[9px] text-[#9aa0a6]">{dayEvents.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <EventCard key={evt._id} event={evt} compact onClick={() => setEditEvent(evt)} />
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[9px] text-[#5f6368] pl-1">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Agenda View ───────────────────────────────────────────
  const renderAgendaView = () => {
    const sortedEvents = [...events].sort((a, b) => a.startTime - b.startTime);
    const grouped: Record<string, Record<string, any>[]> = {};

    sortedEvents.forEach((evt) => {
      const key = formatDate(evt.startTime);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(evt);
    });

    return (
      <div className="space-y-4">
        {Object.entries(grouped).length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <CalendarIcon className="h-8 w-8 text-[#9aa0a6] mx-auto mb-3" />
            <h3 className="text-sm font-medium text-[#5f6368]">No upcoming events</h3>
            <p className="text-[11px] text-[#9aa0a6] mt-1">Create an event to get started</p>
            <Button size="sm" className="mt-4 h-8 text-[12px]" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Event
            </Button>
          </Card>
        ) : (
          Object.entries(grouped).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-2 sticky top-0 bg-white py-1 z-10">
                {dateLabel}
              </h3>
              <div className="space-y-1.5">
                {dateEvents.map((evt) => (
                  <EventCard key={evt._id} event={evt} onClick={() => setEditEvent(evt)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ── Side Mini Calendar ────────────────────────────────────
  const renderSideCalendar = () => (
    <Card className="border-[#e8eaed] p-3">
      <Calendar
        mode="single"
        selected={currentDate}
        onSelect={(date) => date && setCurrentDate(date)}
        className="mx-auto"
      />
    </Card>
  );

  // ── Today's events sidebar ─────────────────────────────────
  const renderTodaySidebar = () => (
    <Card className="border-[#e8eaed] p-3">
      <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        Today
      </h3>
      {todayEvents.length === 0 ? (
        <p className="text-[11px] text-[#9aa0a6]">No events today</p>
      ) : (
        <div className="space-y-1.5">
          {todayEvents.slice(0, 5).map((evt) => {
            const cfg = getEventTypeConfig(evt.eventType);
            const Icon = cfg.icon;
            return (
              <div
                key={evt._id}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#f8f9fa] cursor-pointer"
                onClick={() => setEditEvent(evt)}
              >
                <div className="p-1 rounded-full shrink-0" style={{ backgroundColor: `${evt.color || cfg.color}18` }}>
                  <Icon className="h-3 w-3" style={{ color: evt.color || cfg.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{evt.title}</p>
                  <p className="text-[9px] text-[#5f6368]">
                    {evt.allDay ? "All day" : formatTime(evt.startTime)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e] flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </h1>
          <p className="text-[12px] text-[#5f6368] mt-0.5">
            Enterprise scheduling platform — manage events, meetings, and schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={goToToday} className="h-8 text-[12px]">
            Today
          </Button>
          <Button size="sm" className="h-8 text-[12px]" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Event
          </Button>
        </div>
      </div>

      {/* ── View Switcher & Nav ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold text-[#1a1a2e] min-w-[200px] text-center">
            {viewTitle}
          </h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-[#f1f3f4] rounded-lg p-0.5">
          {([
            { id: "day", icon: Sun, label: "Day" },
            { id: "week", icon: CalendarDays, label: "Week" },
            { id: "month", icon: Grid3X3, label: "Month" },
            { id: "agenda", icon: List, label: "Agenda" },
          ] as const).map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
                  view === v.id ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#5f6368] hover:text-[#1a1a2e]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="h-8 text-[12px] max-w-[200px]"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 w-[140px] text-[12px]">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[12px]">All Events</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key} className="text-[12px]">
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex gap-4">
        {/* Calendar Content */}
        <div className="flex-1 min-w-0">
          {view === "day" && renderDayView()}
          {view === "week" && renderWeekView()}
          {view === "month" && renderMonthView()}
          {view === "agenda" && renderAgendaView()}
        </div>

        {/* Sidebar */}
        <div className="w-[240px] hidden lg:block space-y-3 shrink-0">
          {renderSideCalendar()}
          {renderTodaySidebar()}
        </div>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <EventFormDialog
        open={showCreate}
        onClose={() => { setShowCreate(false); setSelectedDate(undefined); }}
        defaultDate={selectedDate}
      />
      <EventFormDialog
        open={!!editEvent}
        onClose={() => setEditEvent(null)}
        editEvent={editEvent || undefined}
      />
    </div>
  );
}
