import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DistributionItem {
  label: string;
  value: number;
  color?: string;
  onClick?: () => void;
}

interface DistributionCardProps {
  title: string;
  items: DistributionItem[];
  maxItems?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
  "#e11d48", "#0ea5e9", "#84cc16", "#a855f7", "#22c55e",
];

export const DistributionCard = memo(function DistributionCard({
  title,
  items,
  maxItems = 10,
  className,
}: DistributionCardProps) {
  const displayItems = items.slice(0, maxItems);
  const maxValue = Math.max(...displayItems.map((i) => i.value), 1);
  const total = displayItems.reduce((s, i) => s + i.value, 0);

  return (
    <Card className={cn("border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <div className="text-center py-4 text-[12px] text-[#9aa0a6]">No data</div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item, idx) => {
              const widthPct = (item.value / maxValue) * 100;
              const pctOfTotal = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div
                  key={idx}
                  className={cn("flex items-center gap-2 group", item.onClick && "cursor-pointer")}
                  onClick={item.onClick}
                >
                  <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] w-24 truncate shrink-0">{item.label}</span>
                  <div className="flex-1 h-5 bg-[#f1f3f4] dark:bg-[#2d2d4a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0 w-16 justify-end">
                    <span className="text-[12px] font-medium text-[#1a1a2e] dark:text-white">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-[#9aa0a6]">({pctOfTotal}%)</span>
                  </div>
                </div>
              );
            })}
            {items.length > maxItems && (
              <p className="text-[10px] text-[#9aa0a6] text-center pt-1">
                +{items.length - maxItems} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
