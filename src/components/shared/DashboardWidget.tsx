import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Widget configuration — single source of truth for dashboard widgets */
export interface WidgetConfig {
  id: string;
  title: string;
  icon?: LucideIcon;
  size: "full" | "half" | "third" | "quarter";
  /** Where the widget should appear in the dashboard grid */
  section: "pinned" | "activity" | "analytics" | "tasks";
  /** Whether the widget is currently visible */
  visible: boolean;
  /** Any feature flag that gates this widget */
  requiredFeature?: string;
}

interface DashboardWidgetProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  size?: "full" | "half" | "third" | "quarter";
  /** Optional action shown in the header */
  action?: ReactNode;
  /** Empty state when no content */
  isEmpty?: boolean;
  emptyContent?: ReactNode;
}

const sizeClasses: Record<string, string> = {
  full: "col-span-full",
  half: "col-span-full sm:col-span-2 lg:col-span-6",
  third: "col-span-full sm:col-span-2 lg:col-span-4",
  quarter: "col-span-full sm:col-span-1 lg:col-span-3",
};

export function DashboardWidget({
  title,
  icon: Icon,
  children,
  className,
  size = "full",
  action,
  isEmpty,
  emptyContent,
}: DashboardWidgetProps) {
  return (
    <Card className={cn("rounded-sm border-border/50 shadow-none", sizeClasses[size], className)}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          <CardTitle className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">
            {title}
          </CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-4">
        {isEmpty && emptyContent ? emptyContent : children}
      </CardContent>
    </Card>
  );
}

/**
 * Default widget configurations for the dashboard.
 * These can be user-customized in the future.
 */
export const defaultWidgets: WidgetConfig[] = [
  { id: "quick-actions", title: "Quick Actions", size: "full", section: "pinned", visible: true },
  { id: "studios", title: "Studios", size: "full", section: "pinned", visible: true },
  { id: "pinned-modules", title: "Pinned Modules", size: "third", section: "pinned", visible: true },
  { id: "recent-activity", title: "Recent Activity", size: "third", section: "activity", visible: true },
  { id: "tasks", title: "Tasks", size: "third", section: "tasks", visible: true },
  { id: "analytics", title: "Analytics", size: "half", section: "analytics", visible: false, requiredFeature: "analytics" },
];
