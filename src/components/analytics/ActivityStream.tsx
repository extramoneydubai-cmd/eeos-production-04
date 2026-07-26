import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Activity,
  UserPlus, CreditCard, CheckSquare, FileText, ShoppingCart,
  GraduationCap, Calendar, MessageSquare, TrendingUp, AlertCircle,
  type LucideIcon,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: number;
  icon?: LucideIcon;
  color?: string;
  onClick?: () => void;
}

interface ActivityStreamProps {
  items: ActivityItem[];
  title?: string;
  maxItems?: number;
  className?: string;
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  admission: { icon: UserPlus, color: "bg-blue-50 text-blue-600", label: "Admission" },
  payment: { icon: CreditCard, color: "bg-green-50 text-green-600", label: "Payment" },
  approval: { icon: CheckSquare, color: "bg-orange-50 text-orange-600", label: "Approval" },
  invoice: { icon: FileText, color: "bg-purple-50 text-purple-600", label: "Invoice" },
  task: { icon: CheckSquare, color: "bg-teal-50 text-teal-600", label: "Task" },
  purchase: { icon: ShoppingCart, color: "bg-cyan-50 text-cyan-600", label: "Purchase" },
  student: { icon: GraduationCap, color: "bg-indigo-50 text-indigo-600", label: "Student" },
  calendar: { icon: Calendar, color: "bg-pink-50 text-pink-600", label: "Calendar" },
  communication: { icon: MessageSquare, color: "bg-emerald-50 text-emerald-600", label: "Comm" },
  lead: { icon: TrendingUp, color: "bg-rose-50 text-rose-600", label: "Lead" },
  alert: { icon: AlertCircle, color: "bg-red-50 text-red-600", label: "Alert" },
};

export const ActivityStream = memo(function ActivityStream({
  items,
  title = "Recent Activity",
  maxItems = 20,
  className,
}: ActivityStreamProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={cn("border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#5f6368]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {displayItems.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-6 w-6 text-[#dadce0] mx-auto mb-2" />
            <p className="text-[12px] text-[#9aa0a6]">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[#e8eaed] dark:bg-[#2d2d4a]" />

              <div className="divide-y divide-[#e8eaed] dark:divide-[#2d2d4a]">
                {displayItems.map((item) => {
                  const config = item.icon
                    ? { icon: item.icon, color: item.color || "bg-gray-50 text-gray-600" }
                    : typeConfig[item.type] || typeConfig.task;

                  const Icon = config.icon;
                  const timeAgo = getTimeAgo(item.timestamp);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2.5 transition-colors",
                        item.onClick && "cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#2d2d4a]",
                      )}
                      onClick={item.onClick}
                    >
                      <div className={cn("p-1 rounded-full shrink-0 relative z-10", config.color)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1a1a2e] dark:text-white truncate">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <Badge className="h-4 px-1 text-[8px] font-medium bg-[#f1f3f4] text-[#5f6368] dark:bg-[#2d2d4a] dark:text-[#9aa0a6] rounded-sm">
                          {config.label}
                        </Badge>
                        <span className="text-[9px] text-[#9aa0a6]">{timeAgo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
