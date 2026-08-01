import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCheck,
  Trash2,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  Megaphone,
  AtSign,
  Loader2,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  UserPlus,
  CreditCard,
  CalendarCheck,
  GraduationCap,
  Target,
  Workflow,
  Settings,
  Sparkles,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { useMemo, useState } from "react";

const kindConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  task: { label: "Task", icon: ClipboardList, color: "text-[#4285f4] bg-[#e8f0fe]" },
  approval: { label: "Approval", icon: CheckSquare, color: "text-[#f29900] bg-[#fef7e0]" },
  message: { label: "Message", icon: MessageSquare, color: "text-[#34a853] bg-[#e6f4ea]" },
  mention: { label: "Mention", icon: AtSign, color: "text-[#a855f7] bg-[#f3e8ff]" },
  announcement: { label: "Announcement", icon: Megaphone, color: "text-[#ea4335] bg-[#fce8e6]" },
  info: { label: "Info", icon: Info, color: "text-[#4285f4] bg-[#e8f0fe]" },
  success: { label: "Success", icon: CheckCircle2, color: "text-[#188038] bg-[#e6f4ea]" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-[#f29900] bg-[#fef7e0]" },
  error: { label: "Error", icon: AlertCircle, color: "text-[#d93025] bg-[#fce8e6]" },
  reminder: { label: "Reminder", icon: Clock, color: "text-[#f29900] bg-[#fef7e0]" },
  assignment: { label: "Assignment", icon: UserPlus, color: "text-[#12b5cb] bg-[#e0f7fa]" },
  payment: { label: "Payment", icon: CreditCard, color: "text-[#188038] bg-[#e6f4ea]" },
  attendance: { label: "Attendance", icon: CalendarCheck, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  admission: { label: "Admission", icon: GraduationCap, color: "text-[#1a73e8] bg-[#e8f0fe]" },
  lead: { label: "Lead", icon: Target, color: "text-[#d93025] bg-[#fce8e6]" },
  workflow: { label: "Workflow", icon: Workflow, color: "text-[#7b1fa2] bg-[#f3e8ff]" },
  system: { label: "System", icon: Settings, color: "text-[#5f6368] bg-[#f1f3f4]" },
  custom: { label: "Custom", icon: Sparkles, color: "text-[#a855f7] bg-[#f3e8ff]" },
};

const FALLBACK_KIND = "task";

// ─── Date grouping helpers ─────────────────────────────────────────────

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Returns a group label: "Today", "Yesterday", or a date string. */
function dateBucket(ts: number): { key: string; label: string } {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  if (day === today) return { key: "today", label: "Today" };
  if (day === today - 86400000) return { key: "yesterday", label: "Yesterday" };
  return {
    key: String(day),
    label: new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface NotifRow {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

export default function NotificationsPage() {
  const { user } = useAuth();

  const notifications = useQuery(
    api.notifications.listNotifications,
    user ? { userId: user._id } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const clearAllNotifications = useMutation(api.notifications.clearAllNotifications);

  const [filter, setFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");

  // ─── Derived data ──────────────────────────────────────────────────
  const list = (notifications ?? []) as unknown as NotifRow[];

  const filtered = useMemo(
    () =>
      list.filter((n) => {
        if (filter === "unread" && n.isRead) return false;
        if (kindFilter !== "all" && n.type !== kindFilter) return false;
        return true;
      }),
    [list, filter, kindFilter]
  );

  const unreadCount = list.filter((n) => !n.isRead).length;

  const kindsPresent = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of list) {
      const kind = n.type || FALLBACK_KIND;
      map.set(kind, (map.get(kind) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([kind]) => kind);
  }, [list]);

  /** date → kind → items */
  const grouped = useMemo(() => {
    const dateMap = new Map<string, { key: string; label: string; kinds: Map<string, NotifRow[]> }>();
    for (const n of filtered) {
      const bucket = dateBucket(n.createdAt);
      let dateGroup = dateMap.get(bucket.key);
      if (!dateGroup) {
        dateGroup = { key: bucket.key, label: bucket.label, kinds: new Map() };
        dateMap.set(bucket.key, dateGroup);
      }
      const kind = n.type || FALLBACK_KIND;
      const arr = dateGroup.kinds.get(kind) || [];
      arr.push(n);
      dateGroup.kinds.set(kind, arr);
    }
    // Order: today, yesterday, then older dates desc
    return Array.from(dateMap.values()).sort((a, b) => {
      const rank = (g: { key: string }) => (g.key === "today" ? 0 : g.key === "yesterday" ? 1 : 2);
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return b.key.localeCompare(a.key);
    });
  }, [filtered]);

  // ─── Actions ────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead({ userId: user._id });
  };

  const handleClearAll = async () => {
    if (!user) return;
    await clearAllNotifications({ userId: user._id });
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification({ notificationId: notificationId as any });
  };

  const handleMarkRead = async (notificationId: string) => {
    await markAsRead({ notificationId: notificationId as any });
  };

  if (!notifications) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Notifications</h1>
            <p className="text-[13px] text-[#5f6368] mt-0.5">Grouped by day and type</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-[#ea4335] rounded-full">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-[12px] text-[#5f6368] hover:text-[#1a1a2e]"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
          {list.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[12px] text-[#d93025] hover:text-[#ea4335] hover:bg-[#fce8e6]"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes every notification from your list. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-[#d93025] hover:bg-[#ea4335]"
                  >
                    Clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="bg-[#f1f3f4] p-0.5">
            <TabsTrigger value="all" className="text-[12px] data-[state=active]:bg-white">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-[12px] data-[state=active]:bg-white">
              Unread
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {kindsPresent.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
            <button
              onClick={() => setKindFilter("all")}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                kindFilter === "all"
                  ? "bg-[#1a1a2e] text-white"
                  : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
              }`}
            >
              All kinds
            </button>
            {kindsPresent.map((kind) => {
              const cfg = kindConfig[kind] || kindConfig[FALLBACK_KIND];
              const Icon = cfg.icon;
              return (
                <button
                  key={kind}
                  onClick={() => setKindFilter(kindFilter === kind ? "all" : kind)}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    kindFilter === kind
                      ? "bg-[#1a1a2e] text-white"
                      : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Grouped list ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-0">
            <div className="text-center py-16">
              <Inbox className="h-8 w-8 text-[#dadce0] mx-auto mb-2" />
              <p className="text-[13px] text-[#9aa0a6]">
                {list.length === 0 ? "No notifications yet" : "Nothing matches this filter"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        grouped.map((dateGroup) => (
          <section key={dateGroup.key} className="space-y-2.5">
            {/* Date header */}
            <div className="flex items-center gap-2 px-0.5 pt-1">
              <CalendarDays className="h-3.5 w-3.5 text-[#9aa0a6]" />
              <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#5f6368]">
                {dateGroup.label}
              </h2>
              <div className="flex-1 border-t border-[#e8eaed] mx-2" />
              <span className="text-[11px] text-[#9aa0a6]">
                {Array.from(dateGroup.kinds.values()).reduce((s, arr) => s + arr.length, 0)}
              </span>
            </div>

            {/* Kind sections */}
            {Array.from(dateGroup.kinds.entries()).map(([kind, items]) => {
              const cfg = kindConfig[kind] || kindConfig[FALLBACK_KIND];
              const Icon = cfg.icon;
              return (
                <Card key={kind} className="border-[#e8eaed] shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-0">
                    {/* Kind sub-header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#fafbfc] border-b border-[#e8eaed]">
                      <span className={`p-1 rounded ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="text-[11px] font-semibold text-[#1a1a2e] uppercase tracking-wide">
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-[#9aa0a6]">{items.length}</span>
                      <div className="flex-1" />
                      <span className="text-[10px] text-[#9aa0a6]">
                        {items.filter((n) => !n.isRead).length > 0
                          ? `${items.filter((n) => !n.isRead).length} unread`
                          : "all read"}
                      </span>
                    </div>

                    <div className="divide-y divide-[#e8eaed]">
                      {items.map((notif) => (
                        <div
                          key={notif._id}
                          className={`group flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                            !notif.isRead ? "bg-[#f8f9fa]" : "hover:bg-[#f8f9fa]"
                          }`}
                          onClick={() => {
                            if (!notif.isRead) handleMarkRead(notif._id);
                          }}
                        >
                          <div className={`p-1.5 rounded-lg ${cfg.color} shrink-0 mt-0.5`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-[12px] ${!notif.isRead ? "font-semibold" : "font-medium"} text-[#1a1a2e]`}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] shrink-0" />
                              )}
                            </div>
                            <p className="text-[12px] text-[#5f6368] mt-0.5 line-clamp-1">{notif.message}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#9aa0a6]">{formatTime(notif.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#9aa0a6] hover:text-[#1a73e8]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkRead(notif._id);
                                }}
                                title="Mark as read"
                              >
                                <CheckCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notif._id);
                              }}
                              title="Delete notification"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        ))
      )}

      <Separator className="opacity-40" />
      <p className="text-center text-[11px] text-[#9aa0a6] pb-2">
        {list.length} notifications · {unreadCount} unread
      </p>
    </div>
  );
}
