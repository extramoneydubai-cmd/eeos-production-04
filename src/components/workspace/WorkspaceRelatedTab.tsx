/**
 * EEOS Workspace Related Records Tab
 *
 * Displays other entities linked to this one (e.g. courses for lead,
 * students for batch, payments for invoice, etc.)
 * Modules register their related-record providers.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Link2, ArrowRight, Users, GraduationCap, DollarSign,
  FileText, ShoppingCart, Building2, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceTabProps } from "./types";

interface RelatedEntityGroup {
  label: string;
  icon: React.ElementType;
  records: Array<{
    _id: string;
    _creationTime: number;
    title: string;
    subtitle?: string;
    status?: string;
    badge?: string;
    badgeColor?: string;
  }>;
  onClick?: (id: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  student: GraduationCap, lead: Users, course: BookOpen,
  invoice: DollarSign, document: FileText, vendor: ShoppingCart,
  company: Building2, branch: Building2,
};

interface RelatedTabProps extends WorkspaceTabProps {
  /** Pre-defined related entity groups (or fetched from registry) */
  groups?: RelatedEntityGroup[];
}

/**
 * WorkspaceRelatedTab — shows related records for an entity.
 */
export function WorkspaceRelatedTab({
  entityType,
  entityId,
  entity,
  groups,
}: RelatedTabProps) {
  // In production, this would fetch related records from the relationship engine
  // For now, render provided groups or empty state
  const allGroups = groups || [];

  if (allGroups.length === 0) {
    return (
      <EmptyState
        title="No related records"
        description="No related entities are linked to this record."
        icon={<Link2 className="h-5 w-5" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {allGroups.map((group) => {
        const Icon = group.icon;
        return (
          <Card key={group.label} className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {group.label}
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal ml-1">
                  {group.records.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.records.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-3">
                  No {group.label.toLowerCase()} linked
                </p>
              ) : (
                <div className="space-y-1">
                  {group.records.slice(0, 5).map((record) => (
                    <div
                      key={record._id}
                      onClick={() => group.onClick?.(record._id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent/50 transition-colors cursor-pointer group/row"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {record.title}
                        </p>
                        {record.subtitle && (
                          <p className="text-[10px] text-muted-foreground/60 truncate">
                            {record.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {record.badge && (
                          <Badge className={cn("text-[8px] px-1 py-0 h-3 font-normal", record.badgeColor || "bg-accent/50")}>
                            {record.badge}
                          </Badge>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover/row:text-muted-foreground/60 transition-colors" />
                      </div>
                    </div>
                  ))}
                  {group.records.length > 5 && (
                    <p className="text-[10px] text-muted-foreground/40 text-center pt-1">
                      +{group.records.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
