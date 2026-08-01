/**
 * EEOS Workspace Activity Tab
 *
 * Displays the activity log for an entity using the ActivityTimeline component.
 * Integrates with eventSdk for activity data.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { Activity } from "lucide-react";
import type { WorkspaceTabProps } from "./types";

/**
 * WorkspaceActivityTab — entity-bound activity log.
 */
export function WorkspaceActivityTab({
  entityType,
  entityId,
  entity,
}: WorkspaceTabProps) {
  const activities = useQuery(
    api.engines.activityEngine.getEntityTimeline,
    entityId ? { entityType, entityId, limit: 50 } : "skip",
  );

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTimeline
          activities={(activities || []) as any[]}
          emptyTitle="No activity recorded"
          emptyDescription="Actions performed on this entity will appear here."
          emptyIcon={<Activity className="h-5 w-5" />}
        />
      </CardContent>
    </Card>
  );
}
