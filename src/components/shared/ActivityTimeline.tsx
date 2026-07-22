/**
 * EEOS ActivityTimeline Component
 *
 * Reusable timeline display for the Activity Engine (P0).
 * Used by the dashboard, entity detail pages, user profiles, and more.
 *
 * DOC-22 reference: Activity Engine
 * DOC-23 reference: UI Standards
 */

import { type ReactNode } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Upload,
  Download,
  MessageSquare,
  AtSign,
  CheckCheck,
  Ban,
  CreditCard,
  Undo2,
  ArrowUp,
  CornerUpRight,
  Archive,
  RotateCcw,
  LogIn,
  LogOut,
  KeyRound,
  Shield,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export type ActivityAction =
  | "created" | "updated" | "deleted" | "assigned"
  | "approved" | "rejected" | "converted" | "uploaded"
  | "downloaded" | "commented" | "mentioned" | "completed"
  | "cancelled" | "paid" | "refunded" | "promoted"
  | "transferred" | "archived" | "restored" | "login"
  | "logout" | "password_changed" | "permission_changed"
  | "custom";

export type ActivitySeverity = "info" | "warning" | "error";

export interface ActivityEntry {
  _id: string;
  _creationTime: number;
  entityType: string;
  entityId: string;
  module: string;
  action: ActivityAction;
  title: string;
  description?: string;
  userId: string;
  organizationId?: string;
  branchId?: string;
  departmentId?: string;
  teamId?: string;
  metadata?: Record<string, unknown>;
  severity: ActivitySeverity;
  visibility: "public" | "internal" | "private";
  createdAt: number;
  userName?: string;
  userImage?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────

const actionIcons: Record<string, typeof Activity> = {
  created: Plus, updated: Pencil, deleted: Trash2, assigned: UserCheck,
  approved: CheckCircle2, rejected: XCircle, converted: ArrowLeftRight,
  uploaded: Upload, downloaded: Download, commented: MessageSquare,
  mentioned: AtSign, completed: CheckCheck, cancelled: Ban,
  paid: CreditCard, refunded: Undo2, promoted: ArrowUp,
  transferred: CornerUpRight, archived: Archive, restored: RotateCcw,
  login: LogIn, logout: LogOut, password_changed: KeyRound,
  permission_changed: Shield, custom: Activity,
};

const severityColors: Record<string, string> = {
  info: "text-foreground/70",
  warning: "text-amber-600/80",
  error: "text-destructive/80",
};

const severityBg: Record<string, string> = {
  info: "bg-accent/50",
  warning: "bg-amber-50 dark:bg-amber-950/20",
  error: "bg-destructive/10",
};

function getActionIcon(action: string) {
  return actionIcons[action] || Activity;
}

export function getActionLabel(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Props ────────────────────────────────────────────────────

interface ActivityTimelineProps {
  activities: ActivityEntry[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  maxItems?: number;
  compact?: boolean;
  onItemClick?: (activity: ActivityEntry) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────

export function ActivityTimeline(props: ActivityTimelineProps) {
  const {
    activities,
    isLoading = false,
    emptyTitle = "No activity yet",
    emptyDescription = "Activity from your modules will appear here.",
    emptyIcon,
    maxItems,
    compact = false,
    onItemClick,
    className,
  } = props;

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="flex items-start gap-3 animate-pulse">
            <div className="h-6 w-6 rounded-full bg-accent/50 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 rounded bg-accent/50" />
              <div className="h-2.5 w-1/2 rounded bg-accent/30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon || <Activity className="h-5 w-5" />}
      />
    );
  }

  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  return (
    <div className={cn("space-y-1", className)}>
      {displayActivities.map((activity, index) => {
        const Icon = getActionIcon(activity.action);
        const isLast = index === displayActivities.length - 1;

        return (
          <div
            key={activity._id}
            onClick={() => onItemClick?.(activity)}
            className={cn(
              "relative flex items-start gap-3 py-2.5 px-2 rounded-sm transition-colors",
              severityBg[activity.severity] || severityBg.info,
              onItemClick && "cursor-pointer hover:bg-accent/60",
            )}
          >
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  "border border-border/50",
                  severityColors[activity.severity] || severityColors.info,
                )}
              >
                <Icon className="h-3 w-3" />
              </div>
              {!isLast && !compact && (
                <div className="w-px flex-1 min-h-[8px] bg-border/30 mt-1" />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn(
                    "text-xs font-medium leading-snug",
                    activity.severity === "error" ? "text-destructive" : "text-foreground",
                  )}>
                    {activity.title}
                    {!compact && activity.module && (
                      <span className="text-muted-foreground/50 font-normal ml-1">
                        in {activity.module}
                      </span>
                    )}
                  </p>
                  {activity.description && !compact && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-relaxed line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] tabular-nums",
                    compact ? "text-muted-foreground/40" : "text-muted-foreground/50",
                  )}
                  title={format(activity.createdAt, "MMM d, yyyy HH:mm")}
                >
                  {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                </span>
              </div>

              {!compact && (
                <div className="flex items-center gap-2 mt-1">
                  {activity.userName && (
                    <span className="text-[10px] text-muted-foreground/60">
                      {activity.userName}
                    </span>
                  )}
                  {activity.severity !== "info" && (
                    <span className={cn("text-[9px] uppercase tracking-wider font-medium", severityColors[activity.severity])}>
                      {activity.severity}
                    </span>
                  )}
                  {activity.visibility !== "public" && (
                    <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
                      {activity.visibility}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
