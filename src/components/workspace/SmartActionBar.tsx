/**
 * EEOS SmartActionBar — Permission-Aware Action Buttons
 *
 * Renders a set of action buttons with permission gating.
 * Actions that declare a `permissionCheck` are evaluated against the
 * Convex AccessEngine (`api.accessEngine.checkModuleAccess`) and are
 * hidden when the current user lacks the required (module, action) grant.
 * Set `bypassPermissions` to skip all checks (CEO/super-admin override).
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { WorkspaceAction } from "./types";

/**
 * Actions accepted by AccessEngine.checkModuleAccess.
 * Mirrors ALL_ACTIONS in src/convex/accessEngine.ts.
 */
const VALID_ACTIONS = new Set([
  "create", "read", "update", "delete", "approve", "reject", "export",
  "print", "share", "assign", "transfer", "merge", "restore", "archive",
  "import", "sync", "duplicate", "lock", "unlock", "viewAnalytics",
  "viewFinancial", "viewReports", "viewAudit", "viewDocuments",
  "viewTimeline", "viewNotifications", "manage",
]);

interface SmartActionBarProps {
  actions: WorkspaceAction[];
  /** Module name for permission checks (fallback when an action has none) */
  module?: string;
  /** If true, skip permission checks */
  bypassPermissions?: boolean;
  /** Max visible buttons before overflow menu */
  maxVisible?: number;
  className?: string;
}

/** Evaluates an action's permissionCheck via the AccessEngine. */
function useActionPermission(
  action: WorkspaceAction,
  module: string | undefined,
  userId: string | undefined,
  bypassPermissions: boolean
): { loading: boolean; granted: boolean } {
  const check = action.permissionCheck;
  const shouldGate =
    !bypassPermissions &&
    !!check &&
    !!userId &&
    VALID_ACTIONS.has(check.action);

  // NOTE: "skip" must be in the ARGS position; a ref of "skip" would make the
  // client call a function named `skip:default` and fail.
  const result = useQuery(
    api.accessEngine.checkModuleAccess,
    shouldGate && check
      ? {
          userId: userId as never,
          module: check.module || module || "app",
          action: check.action as never,
        }
      : "skip"
  );

  if (!shouldGate) return { loading: false, granted: true };
  // While the grant is loading, keep the button rendered (disabled) to
  // avoid layout shift; hide only once access is definitively denied.
  if (result === undefined) return { loading: true, granted: true };
  return { loading: false, granted: result.granted };
}

function GatedActionButton({
  action,
  module,
  userId,
  bypassPermissions,
}: {
  action: WorkspaceAction;
  module: string | undefined;
  userId: string | undefined;
  bypassPermissions: boolean;
}) {
  const { loading, granted } = useActionPermission(action, module, userId, bypassPermissions);
  if (!granted) return null;

  const Icon = action.icon;
  const btn = (
    <Button
      variant={action.variant || "outline"}
      size="sm"
      className={cn(
        "h-8 text-xs gap-1.5",
        action.variant === "default" && "bg-foreground text-background hover:bg-foreground/90"
      )}
      disabled={action.disabled || loading}
      onClick={action.onClick}
    >
      <Icon className={cn("h-3.5 w-3.5", action.iconColor)} />
      {action.label}
    </Button>
  );

  if (action.tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          {action.tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }
  return btn;
}

function GatedMenuItem({
  action,
  module,
  userId,
  bypassPermissions,
}: {
  action: WorkspaceAction;
  module: string | undefined;
  userId: string | undefined;
  bypassPermissions: boolean;
}) {
  const { loading, granted } = useActionPermission(action, module, userId, bypassPermissions);
  if (!granted) return null;

  const Icon = action.icon;
  return (
    <DropdownMenuItem
      disabled={action.disabled || loading}
      onClick={action.onClick}
      className="text-xs gap-2"
    >
      <Icon className={cn("h-3.5 w-3.5", action.iconColor)} />
      {action.label}
    </DropdownMenuItem>
  );
}

/**
 * SmartActionBar — renders primary actions inline and secondary
 * actions in an overflow menu. Each action can optionally require
 * a permission check (evaluated via the AccessEngine).
 */
export function SmartActionBar({
  actions,
  module,
  bypassPermissions = false,
  maxVisible = 4,
  className,
}: SmartActionBarProps) {
  const { user, isDemoMode } = useAuth();
  // Demo/local fallback sessions carry non-Convex ids that cannot be
  // resolved by AccessEngine — skip gating for them.
  const userId =
    !isDemoMode && user?._id && !String(user._id).startsWith("local_")
      ? String(user._id)
      : undefined;

  const primaryActions = actions.slice(0, maxVisible);
  const overflowActions = actions.slice(maxVisible);

  if (actions.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5 shrink-0 flex-wrap", className)}>
      {/* Primary Visible Actions */}
      {primaryActions.map((action) => (
        <GatedActionButton
          key={action.id}
          action={action}
          module={module}
          userId={userId}
          bypassPermissions={bypassPermissions}
        />
      ))}

      {/* Overflow Menu */}
      {overflowActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {overflowActions.map((action) => (
              <GatedMenuItem
                key={action.id}
                action={action}
                module={module}
                userId={userId}
                bypassPermissions={bypassPermissions}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
