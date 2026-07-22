import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface FilterOption {
  key: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  children?: ReactNode;
}

export function FilterBar({
  options,
  onRemove,
  onClearAll,
  children,
}: FilterBarProps) {
  if (options.length === 0 && !children) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {options.length > 0 && (
        <>
          {options.map((opt) => (
            <span
              key={opt.key}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 bg-accent/50 px-2.5 py-1 text-xs text-foreground"
            >
              <span className="text-muted-foreground">{opt.label}:</span>
              <span className="font-medium">{opt.value}</span>
              <button
                onClick={() => onRemove(opt.key)}
                className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Remove ${opt.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Separator orientation="vertical" className="h-5" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </>
      )}
    </div>
  );
}
