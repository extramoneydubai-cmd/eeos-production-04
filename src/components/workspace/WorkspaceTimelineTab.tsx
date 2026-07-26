/**
 * EEOS Workspace Timeline Tab
 *
 * Displays timeline events for an entity using the TimelineView component.
 * Integrates with timelineSdk for event data.
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineView } from "@/components/shared/TimelineView";
import { EmptyState } from "@/components/shared/EmptyState";
import { History } from "lucide-react";
import type { WorkspaceTabProps } from "./types";

interface TimelineTabProps extends WorkspaceTabProps {
  /** If true, show in compact mode */
  compact?: boolean;
}

/**
 * WorkspaceTimelineTab — renders the timeline for any entity.
 * Consumes timeline events via the shared TimelineView component.
 */
export function WorkspaceTimelineTab({
  entityType,
  entityId,
  entity,
  compact = false,
}: TimelineTabProps) {
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch timeline events via timelineSdk
  const timelineData = useQuery(
    api.platform.queries.getEntityTimeline,
    entityId ? { entityType, entityId } : "skip",
  );

  const events = (timelineData as any[]) || [];

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-foreground">
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Timeline events will appear here as actions are performed on this entity."
            icon={<History className="h-5 w-5" />}
          />
        ) : (
          <TimelineView
            events={events}
            activeSources={activeSources.length > 0 ? activeSources : undefined}
            onSourceFilterChange={setActiveSources}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            compact={compact}
          />
        )}
      </CardContent>
    </Card>
  );
}
