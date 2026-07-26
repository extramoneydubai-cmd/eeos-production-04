/**
 * EEOS Workspace Overview Tab
 *
 * Renders a grid of section cards with entity fields.
 * Supports inline editing, badges, dates, currencies, links, etc.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { LayoutDashboard } from "lucide-react";
import type { WorkspaceTabProps, WorkspaceBodySection, WorkspaceBodyField } from "./types";

interface OverviewTabProps extends WorkspaceTabProps {
  /** Sections to render */
  sections?: WorkspaceBodySection[];
  /** Optional secondary widgets rendered in a second column */
  widgets?: Array<{
    id: string;
    title: string;
    icon?: React.ElementType;
    content: React.ReactNode;
  }>;
}

/** Render a single field value based on its type */
function FieldValue({ field }: { field: WorkspaceBodyField }) {
  if (field.value === null || field.value === undefined || field.value === "") {
    return <span className="text-muted-foreground/40 text-xs italic">Not set</span>;
  }

  switch (field.type) {
    case "badge":
      return (
        <Badge className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", field.badgeColor)}>
          {String(field.value)}
        </Badge>
      );
    case "date":
      return (
        <span className="text-xs text-foreground">
          {typeof field.value === "number"
            ? new Date(field.value).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })
            : String(field.value)}
        </span>
      );
    case "currency":
      return (
        <span className="text-xs font-semibold text-foreground">
          ₹{Number(field.value).toLocaleString()}
        </span>
      );
    case "link":
      return (
        <a
          href={field.href || "#"}
          className="text-xs text-primary hover:text-primary/80 transition-colors truncate block"
        >
          {String(field.value)}
        </a>
      );
    case "boolean":
      return (
        <span className={cn("text-xs font-medium", field.value ? "text-emerald-600" : "text-muted-foreground")}>
          {field.value ? "Yes" : "No"}
        </span>
      );
    case "phone":
      return (
        <a
          href={`tel:${String(field.value).replace(/[^0-9]/g, "")}`}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {String(field.value)}
        </a>
      );
    case "email":
      return (
        <a
          href={`mailto:${field.value}`}
          className="text-xs text-primary hover:text-primary/80 transition-colors truncate block"
        >
          {String(field.value)}
        </a>
      );
    case "select":
      return (
        <span className="text-xs font-medium text-foreground capitalize">
          {String(field.value).replace(/_/g, " ")}
        </span>
      );
    default:
      return (
        <span className={cn("text-xs text-foreground truncate block", field.className)}>
          {String(field.value)}
        </span>
      );
  }
}

/** A single section/card in the overview */
function SectionCard({ section }: { section: WorkspaceBodySection }) {
  const Icon = section.icon;
  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "grid gap-x-4 gap-y-2.5",
          section.columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {section.fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
            <span className="text-[11px] text-muted-foreground/70 shrink-0 mr-2">
              {field.label}
            </span>
            <div className="flex items-center gap-2 text-right">
              {field.editable && field.onChange ? (
                <Input
                  defaultValue={String(field.value ?? "")}
                  onChange={(e) => field.onChange?.(e.target.value)}
                  className="h-7 text-xs w-[160px] border-border/50"
                />
              ) : (
                <FieldValue field={field} />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * WorkspaceOverviewTab — renders entity facts as a grid of section cards.
 * If no sections are provided, shows an empty state.
 */
export function WorkspaceOverviewTab({
  entityType,
  entityId,
  entity,
  sections,
  widgets,
}: OverviewTabProps) {
  if ((!sections || sections.length === 0) && (!widgets || widgets.length === 0)) {
    return (
      <EmptyState
        title="No overview data"
        description="No sections defined for this entity type."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column — Sections */}
      <div className={cn(widgets && widgets.length > 0 ? "lg:col-span-1" : "lg:col-span-2")}>
        {sections && sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sections"
            description="No overview sections defined."
            icon={<LayoutDashboard className="h-5 w-5" />}
          />
        )}
      </div>

      {/* Right Column — Widgets */}
      {widgets && widgets.length > 0 && (
        <div className="space-y-4">
          {widgets.map((widget) => {
            const WidgetIcon = widget.icon;
            return (
              <Card key={widget.id} className="border-border/60 shadow-sm bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {WidgetIcon && <WidgetIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                    {widget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>{widget.content}</CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
