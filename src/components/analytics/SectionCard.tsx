import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const SectionCard = memo(function SectionCard({
  title,
  description,
  icon,
  defaultExpanded = true,
  collapsible = true,
  children,
  className,
  actions,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [fullscreen, setFullscreen] = useState(false);

  if (fullscreen) {
    return (
      <div className="fixed inset-4 z-50 bg-white dark:bg-[#1a1a2e] rounded-xl border border-[#e8eaed] dark:border-[#2d2d4a] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed] dark:border-[#2d2d4a] shrink-0">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{title}</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFullscreen(false)}>
            <Minimize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]", className)}>
      <CardHeader
        className={cn(
          "pb-2 flex flex-row items-start justify-between",
          collapsible && "cursor-pointer select-none",
        )}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2">
          {collapsible && (
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 -ml-1 mt-0.5">
              {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[#9aa0a6]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#9aa0a6]" />}
            </Button>
          )}
          {icon}
          <div>
            <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white">{title}</CardTitle>
            {description && (
              <CardDescription className="text-[11px] mt-0.5">{description}</CardDescription>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {actions}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-3 w-3 text-[#9aa0a6]" />
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
});
