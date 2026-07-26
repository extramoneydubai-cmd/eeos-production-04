import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: number | string;
  previousValue?: number;
  trend?: "up" | "down" | "stable";
  trendPercent?: number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  sparkline?: number[];
  target?: number;
  onClick?: () => void;
  className?: string;
}

export const KpiCard = memo(function KpiCard({
  label,
  value,
  previousValue,
  trend,
  trendPercent,
  unit,
  icon,
  color = "blue",
  target,
  onClick,
  className,
}: KpiCardProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    red: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    yellow: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
    teal: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800",
  };

  const iconColorMap: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    purple: "text-purple-600 dark:text-purple-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    teal: "text-teal-600 dark:text-teal-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-gray-400";
  };

  const targetProgress = target && typeof value === "number" ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <Card
      className={cn(
        "border shadow-sm bg-white dark:bg-[#1a1a2e] hover:shadow-md transition-all cursor-pointer group",
        colorMap[color] || colorMap.blue,
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] truncate">{label}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-[#1a1a2e] dark:text-white">
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              {unit && <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">{unit}</span>}
            </div>
            {(trend || trendPercent !== undefined) && (
              <div className="flex items-center gap-1 mt-0.5">
                {getTrendIcon()}
                {trendPercent !== undefined && (
                  <span className={cn("text-[10px] font-medium", getTrendColor())}>
                    {trendPercent > 0 ? "+" : ""}{trendPercent}%
                  </span>
                )}
                {previousValue !== undefined && (
                  <span className="text-[9px] text-[#9aa0a6]">
                    vs {previousValue.toLocaleString()}
                  </span>
                )}
              </div>
            )}
            {target && targetProgress > 0 && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between text-[9px] text-[#9aa0a6] mb-0.5">
                  <span>Target: {target.toLocaleString()}</span>
                  <span>{targetProgress}%</span>
                </div>
                <div className="w-full h-1 bg-[#e8eaed] dark:bg-[#2d2d4a] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      targetProgress >= 100 ? "bg-green-500" : targetProgress >= 75 ? "bg-blue-500" : targetProgress >= 50 ? "bg-yellow-500" : "bg-red-500",
                    )}
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {icon && (
              <div className={cn("p-1.5 rounded-lg", iconColorMap[color])}>
                {icon}
              </div>
            )}
            {onClick && (
              <ArrowRight className="h-3 w-3 text-[#9aa0a6] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
