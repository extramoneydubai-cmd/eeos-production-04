/**
 * EEOS WorkspaceShell — Universal Entity Workspace
 *
 * Every entity workspace in EEOS renders through this shell.
 * Modules register TabPlugin components to extend the workspace.
 *
 * Usage:
 *   <WorkspaceShell
 *     entityType="student"
 *     entityId={studentId}
 *     entity={student}
 *     title={`${student.firstName} ${student.lastName}`}
 *     subtitle="Student • Grade 12"
 *     badge={{ label: "Active", color: "bg-emerald-500" }}
 *     tabs={STUDENT_WORKSPACE_TABS}
 *     actions={STUDENT_ACTIONS}
 *     module="student"
 *   />
 */

import { useState, useCallback, type ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkspaceShellProps } from "./types";
import { SmartActionBar } from "./SmartActionBar";

/**
 * WorkspaceShell — the universal workspace container (PATCH-UI-002).
 *
 * Two modes:
 *  - Entity mode (default): renders a sticky header + SmartActionBar + tab system.
 *    Used by entity workspaces (Student, Employee, Ticket, …).
 *  - Container mode: when `children` is provided, renders the universal enterprise
 *    layout — Header → Action Bar → Filter Bar → KPI Strip → Main (+ Right Context
 *    Panel) → Bottom Timeline — around arbitrary page content.
 *
 * Handles loading, empty, and error states in entity mode.
 */
export function WorkspaceShell({
  entityType,
  entityId,
  entity,
  isLoading = false,
  error = null,
  header,
  title,
  subtitle,
  badge,
  badgeSecondary,
  headerFields,
  avatar,
  avatarInitials,
  backLink,
  progressBar,
  tabs,
  defaultTab,
  onTabChange,
  actions,
  actionBar,
  kpiStrip,
  filterBar,
  contextPanel,
  bottomTimeline,
  children,
  module,
  bypassPermissions = false,
  className,
}: WorkspaceShellProps) {
  const isContainerMode = children !== undefined;
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs?.[0]?.id ?? "overview"));

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      onTabChange?.(value);
    },
    [onTabChange],
  );

  const visibleTabs = tabs ?? []; // Permission filtering can be added here

  // ── Loading State (entity mode only) ──────────────────────────
  if (isLoading && !isContainerMode) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State (entity mode only) ────────────────────────────
  if ((error || (!isLoading && !entity)) && !isContainerMode) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Card className="p-6 max-w-md text-center border-destructive/20">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {error ? "Error Loading Workspace" : "Entity Not Found"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {error || "The requested entity could not be found. It may have been deleted or you may not have permission to view it."}
          </p>
          {backLink && (
            <button
              onClick={backLink.onClick}
              className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              ← {backLink.label}
            </button>
          )}
        </Card>
      </div>
    );
  }

  // Show loading tabs if entity data is missing but we're not in error state
  const showTabsLoading = !entity && !isContainerMode;

  return (
    <div className={cn("space-y-0", className)}>
      {/* ── Back Link ── */}
      {backLink && (
        <button
          onClick={backLink.onClick}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {backLink.label}
        </button>
      )}

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/60 -mx-6 px-6 pt-2 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-4">
          {header ? (
            <div className="min-w-0 flex-1">{header}</div>
          ) : (
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            {avatar || (
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-xs bg-[#1a1a2e] text-white">
                  {avatarInitials || "?"}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Title & Metadata */}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {badge && (
                  <Badge className={cn("text-[10px] px-1.5 py-0 h-4 text-white", badge.color)}>
                    {badge.label}
                  </Badge>
                )}
                {badgeSecondary && (
                  <Badge
                    variant="outline"
                    className={cn("text-[9px] px-1.5 py-0 h-4 font-normal", badgeSecondary.color)}
                  >
                    {badgeSecondary.label}
                  </Badge>
                )}
                {subtitle && (
                  <span className="text-xs text-muted-foreground/70">{subtitle}</span>
                )}
                {entity?._id ? (
                  <span className="text-[10px] text-muted-foreground/40 font-mono">
                    ID: #{String(entity._id).slice(-6)}
                  </span>
                ) : null}
              </div>

              {/* Header Fields */}
              {headerFields && headerFields.length > 0 && (
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {headerFields.map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.label} className="flex items-center gap-1">
                        {Icon && (
                          <div className={cn("p-1 rounded", field.color || "bg-accent/50")}>
                            <Icon className="h-3 w-3" />
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {field.label}:
                        </span>
                        <span className="text-[11px] font-medium text-foreground">
                          {field.value ?? "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          )}

      {/* ── Smart Action Bar (entity mode) ── */}
          {!isContainerMode && actions && actions.length > 0 && (
            <SmartActionBar
              actions={actions}
              module={module}
              bypassPermissions={bypassPermissions}
            />
          )}

          {/* ── Action Bar (container mode) ── */}
          {isContainerMode && actionBar && (
            <div className="flex items-center gap-2 shrink-0">{actionBar}</div>
          )}
        </div>

        {/* Progress Bar */}
        {progressBar && (
          <div className="flex items-center gap-0.5">
            {(progressBar.stages.slice(0, progressBar.maxStages || progressBar.stages.length)).map((stage, idx) => (
              <div key={stage.id} className="flex-1 flex items-center">
                <div
                  className={cn(
                    "h-1.5 rounded-full flex-1 transition-all",
                    idx <= progressBar.currentStageIndex ? stage.color : "bg-border/50",
                    idx === progressBar.currentStageIndex && "h-2",
                  )}
                />
                {idx < (progressBar.maxStages || progressBar.stages.length) - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-1",
                      idx < progressBar.currentStageIndex ? stage.color : "bg-border/50",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Container Mode: Header → Filter → KPI → Main + Context → Timeline ── */}
      {isContainerMode ? (
        <div className="mt-4 space-y-4">
          {filterBar && <div>{filterBar}</div>}
          {kpiStrip && <div>{kpiStrip}</div>}
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">{children}</div>
            {contextPanel && (
              <aside className="hidden xl:block w-80 shrink-0 space-y-4">{contextPanel}</aside>
            )}
          </div>
          {bottomTimeline && <div className="pt-2">{bottomTimeline}</div>}
        </div>
      ) : (
        /* ── Entity Mode: Tabs ── */
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="bg-accent/50 p-0.5 sticky top-[112px] z-10 overflow-x-auto flex-nowrap">
              {visibleTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-xs data-[state=active]:bg-background px-2.5 whitespace-nowrap"
                >
                  <tab.icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleTabs.map((tab) => {
              const TabComponent = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-2">
                  {showTabsLoading && !tab.showOnLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <TabComponent
                      entityType={entityType ?? "custom"}
                      entityId={entityId ?? ""}
                      entity={entity as Record<string, unknown>}
                      userId={String((entity as any)?.ownerId || "")}
                      userRole={String((entity as any)?.__userRole || "")}
                    />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </div>
  );
}
