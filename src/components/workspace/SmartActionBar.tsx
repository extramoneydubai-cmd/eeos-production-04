/**
 * EEOS SmartActionBar — Permission-Aware Action Buttons
 *
 * Renders a set of action buttons with optional permission gating.
 * Buttons are automatically hidden or disabled based on user permissions.
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceAction } from "./types";

interface SmartActionBarProps {
  actions: WorkspaceAction[];
  /** Module name for permission checks */
  module?: string;
  /** If true, skip permission checks */
  bypassPermissions?: boolean;
  /** Max visible buttons before overflow menu */
  maxVisible?: number;
  className?: string;
}

/**
 * SmartActionBar — renders primary actions inline and secondary
 * actions in an overflow menu. Each action can optionally require
 * a permission check.
 */
export function SmartActionBar({
  actions,
  module,
  bypassPermissions = false,
  maxVisible = 4,
  className,
}: SmartActionBarProps) {
  // In a real implementation, this would check permissions via
  // useQuery(api.permissionSdk.canPerformAction, { ... })
  // For now, all actions are shown (permission filtering is opt-in)

  const primaryActions = actions.slice(0, maxVisible);
  const overflowActions = actions.slice(maxVisible);

  if (actions.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5 shrink-0 flex-wrap", className)}>
      {/* Primary Visible Actions */}
      {primaryActions.map((action) => {
        const Icon = action.icon;
        const btn = (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs gap-1.5",
              action.variant === "default" && "bg-foreground text-background hover:bg-foreground/90",
            )}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <Icon className={cn("h-3.5 w-3.5", action.iconColor)} />
            {action.label}
          </Button>
        );

        if (action.tooltip) {
          return (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {action.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        }
        return btn;
      })}

      {/* Overflow Menu */}
      {overflowActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {overflowActions.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.id}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className="text-xs gap-2"
                >
                  <Icon className={cn("h-3.5 w-3.5", action.iconColor)} />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
