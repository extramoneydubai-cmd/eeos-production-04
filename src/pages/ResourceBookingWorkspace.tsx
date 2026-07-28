/**
 * ResourceBookingWorkspace — Enterprise Resource Booking & Availability
 *
 * Route: /scheduling/resources/:resourceId
 *
 * Tabs: Overview, Availability, Bookings, Calendar, Timeline, Documents, Activity
 *
 * Consumes:
 * - WorkspaceShell
 * - schedulingSdk (via safe queries)
 * - ScheduleWidget, SchedulingPlanner
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CalendarRange, Clock, CheckCircle, XCircle,
  Users, MapPin, FileText, History, Activity,
  Calendar, Home, Loader2, ArrowLeft, AlertTriangle,
  QrCode, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceTimelineTab } from "@/components/workspace/WorkspaceTimelineTab";
import { WorkspaceDocumentsTab } from "@/components/workspace/WorkspaceDocumentsTab";
import { WorkspaceActivityTab } from "@/components/workspace/WorkspaceActivityTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScheduleWidget } from "@/components/scheduling/ScheduleWidget";
import { SchedulingPlanner } from "@/components/scheduling/SchedulingPlanner";
import type {
  WorkspaceTabProps, WorkspaceBodySection,
  WorkspaceAction, WorkspaceTabDefinition,
} from "@/components/workspace/types";

// ─── Resource Type Config ─────────────────────────────────────────
const RESOURCE_TYPES: Record<string, { label: string; color: string }> = {
  meeting_room: { label: "Meeting Room", color: "bg-blue-500" },
  classroom: { label: "Classroom", color: "bg-purple-500" },
  lab: { label: "Laboratory", color: "bg-emerald-500" },
  auditorium: { label: "Auditorium", color: "bg-amber-500" },
  vehicle: { label: "Vehicle", color: "bg-rose-500" },
  projector: { label: "Projector", color: "bg-cyan-500" },
  laptop: { label: "Laptop", color: "bg-indigo-500" },
  equipment: { label: "Equipment", color: "bg-slate-500" },
};

function getResourceConfig(type: string) {
  return RESOURCE_TYPES[type] || { label: type || "Resource", color: "bg-gray-500" };
}

// ─── Overview Tab ────────────────────────────────────────────────
function ResourceOverviewTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const resource = entity as any;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Capacity", value: resource?.capacity ?? "—", icon: Users, color: "bg-blue-500" },
          { label: "Bookings", value: resource?.currentBookings?.length ?? 0, icon: CalendarRange, color: "bg-purple-500" },
          { label: "Available", value: resource?.available ?? "—", icon: CheckCircle, color: "bg-emerald-500" },
          { label: "Status", value: resource?.status || "available", icon: Clock, color: resource?.status === "available" ? "bg-emerald-500" : "bg-amber-500" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-md ${s.color} flex items-center justify-center`}>
                <s.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold">{typeof s.value === "number" ? s.value : String(s.value)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />
            Resource Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Name", value: resource?.name || "—" },
              { label: "Type", value: getResourceConfig(resource?.resourceType).label },
              { label: "Location", value: resource?.location || "—" },
              { label: "Capacity", value: resource?.capacity ?? "—" },
              { label: "Status", value: resource?.status || "available" },
              { label: "Equipment", value: resource?.amenities?.join(", ") || "—" },
            ].map((f) => (
              <div key={f.label} className="flex justify-between py-1.5 border-b border-border/20">
                <span className="text-[11px] text-muted-foreground">{f.label}</span>
                <span className="text-xs font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Availability Tab ────────────────────────────────────────────
function ResourceAvailabilityTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const nav = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Availability Planner</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <QrCode className="h-3 w-3 mr-1" /> QR Check-in
          </Button>
        </div>
      </div>
      <SchedulingPlanner
        entityType={entityType}
        entityId={entityId || ""}
        defaultView="week"
        height="500px"
        onEventClick={(id) => nav(`/scheduler/${id}`)}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function ResourceBookingWorkspace() {
  const navigate = useNavigate();
  const { resourceId } = useParams<{ resourceId: string }>();

  const resourceData = useQuery(
    api.schedulingSdk.getResource as any,
    resourceId ? { resourceId } : "skip",
  );

  const resource = resourceData as any;

  const config = getResourceConfig(resource?.resourceType);

  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: Home, component: ResourceOverviewTab },
    { id: "availability", label: "Availability", icon: CalendarRange, component: ResourceAvailabilityTab },
    { id: "bookings", label: "Bookings", icon: Clock, component: ResourceAvailabilityTab },
    { id: "timeline", label: "Timeline", icon: History, component: WorkspaceTimelineTab },
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "activity", label: "Activity", icon: Activity, component: WorkspaceActivityTab },
  ];

  const actions: WorkspaceAction[] = [
    { id: "reserve", label: "Reserve", icon: CalendarRange, onClick: () => {}, variant: "default" as const, tooltip: "Book this resource" },
    { id: "release", label: "Release", icon: XCircle, onClick: () => {}, variant: "outline" as const, tooltip: "Release resource" },
  ];

  const title = resource?.name || "Loading...";
  const subtitle = `${config.label} • ${resource?.location || "—"}`;
  const badge = resource?.status === "available"
    ? { label: "Available", color: "bg-emerald-500" }
    : resource?.status === "booked"
    ? { label: "Booked", color: "bg-amber-500" }
    : { label: resource?.status || "Unknown", color: "bg-slate-400" };

  return (
    <WorkspaceShell
      entityType="schedulingResource"
      entityId={resourceId || ""}
      entity={(resourceData || {}) as unknown as Record<string, unknown>}
      isLoading={!resourceData && !!resourceId}
      title={title}
      subtitle={subtitle}
      badge={badge}
      headerFields={[
        { label: "Capacity", value: resource?.capacity?.toString() || "—" },
        { label: "Location", value: resource?.location || "—" },
      ]}
      backLink={{ label: "Back to Resources", onClick: () => navigate("/scheduling") }}
      tabs={tabs}
      actions={actions}
      module="scheduling"
    />
  );
}
