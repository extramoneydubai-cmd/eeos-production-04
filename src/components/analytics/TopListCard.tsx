import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";

export interface TopListItem {
  rank: number;
  name: string;
  value: number;
  unit?: string;
  avatar?: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  onClick?: () => void;
}

interface TopListCardProps {
  title: string;
  items: TopListItem[];
  maxItems?: number;
  className?: string;
}

const rankIcons = [
  <Trophy className="h-3.5 w-3.5 text-yellow-500" />,
  <Medal className="h-3.5 w-3.5 text-gray-400" />,
  <Award className="h-3.5 w-3.5 text-orange-500" />,
];

export const TopListCard = memo(function TopListCard({
  title,
  items,
  maxItems = 5,
  className,
}: TopListCardProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={cn("border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white">🏆 {title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <div className="text-center py-4 text-[12px] text-[#9aa0a6]">No data</div>
        ) : (
          <div className="space-y-1.5">
            {displayItems.map((item) => (
              <div
                key={item.rank}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-colors",
                  item.onClick && "cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#2d2d4a]",
                )}
                onClick={item.onClick}
              >
                {/* Rank */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {item.rank <= 3 ? (
                    rankIcons[item.rank - 1]
                  ) : (
                    <span className="text-[11px] font-bold text-[#9aa0a6]">#{item.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                    {item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#1a1a2e] dark:text-white truncate">{item.name}</p>
                  {item.subtitle && (
                    <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] truncate">{item.subtitle}</p>
                  )}
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-[#1a1a2e] dark:text-white">
                    {item.value.toLocaleString()}
                  </p>
                  {item.unit && (
                    <p className="text-[9px] text-[#9aa0a6]">{item.unit}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
