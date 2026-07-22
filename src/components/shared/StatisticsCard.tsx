import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatisticsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  className?: string;
}

export function StatisticsCard({
  label,
  value,
  icon,
  trend,
  className,
}: StatisticsCardProps) {
  return (
    <Card className={cn("rounded-sm border-border/50 shadow-none", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">
              {label}
            </p>
            <p className="text-xl font-normal tracking-tight text-foreground">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "text-[10px] flex items-center gap-1",
                  trend.direction === "up" && "text-foreground/70",
                  trend.direction === "down" && "text-destructive/70",
                )}
              >
                <span>{trend.direction === "up" ? "↑" : "↓"}</span>
                <span>{trend.value}</span>
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent/50">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
