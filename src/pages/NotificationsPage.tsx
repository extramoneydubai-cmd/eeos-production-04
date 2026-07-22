import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  Megaphone,
  AtSign,
  Loader2,
} from "lucide-react";
import { useState } from "react";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  task: { label: "Task", icon: ClipboardList, color: "text-[#4285f4] bg-[#e8f0fe]" },
  approval: { label: "Approval", icon: CheckSquare, color: "text-[#fbbc04] bg-[#fef7e0]" },
  message: { label: "Message", icon: MessageSquare, color: "text-[#34a853] bg-[#e6f4ea]" },
  mention: { label: "Mention", icon: AtSign, color: "text-[#a855f7] bg-[#f3e8ff]" },
  announcement: { label: "Announcement", icon: Megaphone, color: "text-[#ea4335] bg-[#fce8e6]" },
};

export default function NotificationsPage() {
  const { user } = useAuth();

  const notifications = useQuery(
    api.notifications.listNotifications,
    user ? { userId: user._id } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const [filter, setFilter] = useState<string>("all");

  if (!notifications) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead({ userId: user._id });
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification({ notificationId: notificationId as any });
  };

  const handleMarkRead = async (notificationId: string) => {
    await markAsRead({ notificationId: notificationId as any });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Notifications</h1>
            <p className="text-[13px] text-[#5f6368] mt-0.5">Stay updated</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-[#ea4335] rounded-full">{unreadCount} unread</Badge>
          )}
        </div>
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
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="all" className="text-[12px] data-[state=active]:bg-white">All</TabsTrigger>
          <TabsTrigger value="unread" className="text-[12px] data-[state=active]:bg-white">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-8 w-8 text-[#dadce0] mx-auto mb-2" />
              <p className="text-[13px] text-[#9aa0a6]">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8eaed]">
              {filteredNotifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.task;
                const Icon = config.icon;
                return (
                  <div
                    key={notif._id}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      !notif.isRead ? "bg-[#f8f9fa]" : "hover:bg-[#f8f9fa]"
                    }`}
                    onClick={() => {
                      if (!notif.isRead) handleMarkRead(notif._id);
                    }}
                  >
                    <div className={`p-1.5 rounded-lg ${config.color} shrink-0`}>
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
                      <p className="text-[10px] text-[#9aa0a6] mt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335] opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif._id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
