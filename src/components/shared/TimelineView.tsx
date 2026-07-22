import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity, MessageSquare, Paperclip, Bell,
  Search, X, ChevronRight,
  Plus, Pencil, Trash2, UserCheck, CheckCircle2,
  XCircle, ArrowLeftRight, Upload, Download,
  AtSign, CheckCheck, Ban, CreditCard, Undo2,
  ArrowUp, CornerUpRight, Archive, RotateCcw,
  LogIn, LogOut, KeyRound, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** A timeline event returned from the backend */
interface TimelineEvent {
  id: string;
  source: "activity" | "comment" | "attachment" | "notification";
  action: string;
  title: string;
  description?: string;
  userId: string;
  userName?: string;
  userImage?: string | null;
  severity?: string;
  module?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface TimelineViewProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  /** Active source filters */
  activeSources?: string[];
  /** Called when source filter changes */
  onSourceFilterChange?: (sources: string[]) => void;
  /** Search query */
  searchQuery?: string;
  /** Called when search query changes */
  onSearchChange?: (query: string) => void;
  /** Compact mode */
  compact?: boolean;
  className?: string;
}

const SOURCE_CONFIG: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  activity: { icon: Activity, label: "Activity", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  comment: { icon: MessageSquare, label: "Comments", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  attachment: { icon: Paperclip, label: "Files", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  notification: { icon: Bell, label: "Notifs", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const ACTION_ICONS: Record<string, typeof Activity> = {
  created: Plus, updated: Pencil, deleted: Trash2, assigned: UserCheck,
  approved: CheckCircle2, rejected: XCircle, converted: ArrowLeftRight,
  uploaded: Upload, downloaded: Download, commented: MessageSquare,
  replied: CornerUpRight, mentioned: AtSign, completed: CheckCheck,
  cancelled: Ban, paid: CreditCard, refunded: Undo2, promoted: ArrowUp,
  transferred: CornerUpRight, archived: Archive, restored: RotateCcw,
  login: LogIn, logout: LogOut, password_changed: KeyRound,
  permission_changed: Shield,
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

function formatTimestamp(timestamp: number): { date: string; time: string } {
  const d = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const eventDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  let date: string;
  if (eventDate.getTime() === today.getTime()) {
    date = "Today";
  } else if (eventDate.getTime() === yesterday.getTime()) {
    date = "Yesterday";
  } else {
    date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function getDateGroups(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const { date } = formatTimestamp(event.timestamp);
    const existing = groups.get(date) || [];
    existing.push(event);
    groups.set(date, existing);
  }
  return groups;
}

export function TimelineView({
  events,
  isLoading = false,
  activeSources,
  onSourceFilterChange,
  searchQuery = "",
  onSearchChange,
  compact = false,
  className,
}: TimelineViewProps) {
  const dateGroups = useMemo(() => getDateGroups(events), [events]);
  const sourceList = ["activity", "comment", "attachment", "notification"];

  const toggleSource = (source: string) => {
    if (!onSourceFilterChange) return;
    const current = activeSources || sourceList;
    const next = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    onSourceFilterChange(next.length === 0 ? sourceList : next);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* ── Toolbar: Search + Source Filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search timeline..."
            className="w-full h-7 pl-7 pr-2 text-[11px] rounded-sm border border-border/50 bg-transparent focus:outline-none focus:border-border text-muted-foreground placeholder:text-muted-foreground/30"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        {sourceList.map((source) => {
          const cfg = SOURCE_CONFIG[source];
          const isActive = !activeSources || activeSources.includes(source);
          return (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-sm border transition-colors",
                isActive
                  ? cn(cfg.color, "border-transparent")
                  : "border-border/30 text-muted-foreground/40 hover:text-muted-foreground",
              )}
            >
              <cfg.icon className="h-2.5 w-2.5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <Separator />

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-3 w-24 rounded bg-accent/50" />
              <div className="flex gap-3 pl-2">
                <div className="h-6 w-6 rounded-full bg-accent/30" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-accent/30" />
                  <div className="h-2.5 w-1/2 rounded bg-accent/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Activity className="h-6 w-6 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No timeline events</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {searchQuery ? "Try a different search term." : "Activity, comments, and file changes will appear here."}
          </p>
        </div>
      )}

      {/* ── Timeline by Date Groups ── */}
      {!isLoading && events.length > 0 && (
        <div className="space-y-5">
          {Array.from(dateGroups.entries()).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              {/* Sticky Date Header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 -mx-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/30" />
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-border/30" />
                </div>
              </div>

              {/* Events for this date */}
              <div className="space-y-0.5">
                {dateEvents.map((event) => {
                  const ActionIcon = ACTION_ICONS[event.action] || Activity;
                  const sourceCfg = SOURCE_CONFIG[event.source];
                  const { time } = formatTimestamp(event.timestamp);
                  const initials = event.userName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?";

                  return (
                    <div
                      key={event.id}
                      className="group relative flex gap-3 py-2 px-2 rounded-sm transition-colors hover:bg-accent/20"
                    >
                      {/* Timeline connector line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border",
                            sourceCfg?.color || "bg-accent/50",
                            "border-border/40",
                          )}
                        >
                          <ActionIcon className="h-3 w-3" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium">{event.title}</span>
                              {event.severity && event.severity !== "info" && (
                                <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[event.severity])} />
                              )}
                            </div>
                            {event.description && !compact && (
                              <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-relaxed line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-muted-foreground/40 tabular-nums">{time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {!compact && event.userName && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-3.5 w-3.5">
                                <AvatarFallback className="text-[5px] bg-accent/50 text-muted-foreground/60">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[9px] text-muted-foreground/50">{event.userName}</span>
                            </div>
                          )}
                          {event.module && (
                            <Badge
                              variant="outline"
                              className="text-[7px] px-1 py-0 h-3 border-border/20 text-muted-foreground/40 font-normal uppercase tracking-wider"
                            >
                              {event.module}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[7px] px-1 py-0 h-3 font-normal uppercase tracking-wider border-border/20",
                              sourceCfg?.color,
                            )}
                          >
                            {sourceCfg?.label || event.source}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
