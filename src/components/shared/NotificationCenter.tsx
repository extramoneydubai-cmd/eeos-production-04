import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Bell, X, Info, CheckCircle2, AlertTriangle, AlertCircle,
  ArrowRight, Archive, CheckCheck, Inbox,
} from "lucide-react";

/** Explicit notification shape to avoid unknown field issues from Doc<"notifications"> */
interface NotificationField {
  _id: Id<"notifications">;
  _creationTime: number;
  title: string;
  message: string;
  type: string;
  module?: string;
  userId: Id<"users">;
  read: boolean;
  archived: boolean;
  priority?: number;
  createdAt: number;
}

const iconMap: Record<string, typeof Bell> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  approval: Info,
  reminder: Bell,
  assignment: Bell,
  message: Info,
  announcement: Bell,
  payment: CheckCircle2,
  attendance: Info,
  admission: Info,
  lead: Info,
  task: Info,
  workflow: Info,
  system: Bell,
  custom: Info,
};

const colorMap: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
  approval: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  reminder: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  assignment: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  message: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  announcement: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  payment: "bg-green-500/10 text-green-600 dark:text-green-400",
  system: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { isDemoMode } = useAuth();
  const unreadCount: number | undefined = useQuery(
    api.engines.notificationEngine.unreadCount,
    isDemoMode ? "skip" : undefined,
  );
  const notifications: NotificationField[] | undefined = useQuery(
    api.engines.notificationEngine.list,
    isDemoMode ? "skip" : { limit: 50, includeArchived: false },
  );

  const markReadMut = useMutation(api.engines.notificationEngine.markRead);
  const markAllReadMut = useMutation(api.engines.notificationEngine.markAllRead);
  const archiveMut = useMutation(api.engines.notificationEngine.archive);
  const archiveAllReadMut = useMutation(api.engines.notificationEngine.archiveAllRead);

  const displayed = filter === "unread"
    ? (notifications ?? []).filter((n) => !n.read)
    : (notifications ?? []);

  const handleMarkRead = useCallback(
    async (id: Id<"notifications">) => {
      try { await markReadMut({ notificationId: id }); } catch { /* silent */ }
    },
    [markReadMut],
  );

  const handleMarkAllRead = useCallback(async () => {
    try { await markAllReadMut(); } catch { /* silent */ }
  }, [markAllReadMut]);

  const handleArchive = useCallback(
    async (id: Id<"notifications">) => {
      try { await archiveMut({ notificationId: id }); } catch { /* silent */ }
    },
    [archiveMut],
  );

  const handleArchiveAllRead = useCallback(async () => {
    try { await archiveAllReadMut(); } catch { /* silent */ }
  }, [archiveAllReadMut]);

  const count = typeof unreadCount === "number" ? unreadCount : 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-[8px] font-medium text-background">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm font-medium">Notifications</SheetTitle>
                {count > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    {count} new
                  </Badge>
                )}
              </div>
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                >
                  <CheckCheck className="h-2.5 w-2.5" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors",
                  filter === "all" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-colors",
                  filter === "unread" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Unread
              </button>
            </div>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto">
            {notifications === undefined ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
                <p className="text-sm text-muted-foreground mt-3">Loading...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">All clear</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {filter === "unread" ? "No unread notifications." : "No notifications yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {displayed.map((notification) => {
                  const nt = notification.type;
                  const Icon = iconMap[nt] || Info;
                  const colorClass = colorMap[nt] || colorMap.info;
                  return (
                    <div
                      key={notification._id}
                      className={cn(
                        "relative flex gap-3 px-4 py-3.5 transition-colors duration-150 group",
                        !notification.read && "bg-accent/30",
                      )}
                    >
                      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm", colorClass)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkRead(notification._id)}
                                className="p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
                                aria-label="Mark read"
                              >
                                <CheckCheck className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(notification._id)}
                              className="p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
                              aria-label="Archive"
                            >
                              <Archive className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] text-muted-foreground/50">{formatTime(notification.createdAt)}</p>
                          {notification.module && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-border/30 text-muted-foreground/40 font-normal uppercase tracking-wider">
                              {notification.module}
                            </Badge>
                          )}
                          {notification.priority != null && notification.priority > 0 && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-amber-500/30 text-amber-600/60 font-normal">
                              P{notification.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {count > 0 && (
            <>
              <Separator />
              <div className="px-4 py-3 flex items-center justify-between">
                <button
                  onClick={handleArchiveAllRead}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                >
                  <Archive className="h-2.5 w-2.5" />
                  Archive read
                </button>
                <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
                  View all
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
