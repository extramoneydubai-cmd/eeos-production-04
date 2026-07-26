import {
  WorkspaceShell, WorkspaceHeader, WorkspaceTabConfig,
} from "@/components/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench, Users, Calendar, FileText, Clock,
} from "lucide-react";

export default function AssetWorkspace() {
  const tabs: WorkspaceTabConfig[] = [
    {
      id: "overview", label: "Overview", icon: Wrench,
      component: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-sky-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Assets</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">—</p></CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Allocated</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">—</p></CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Available</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">—</p></CardContent>
            </Card>
          </div>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Asset allocation overview. Allocate, return, transfer and track assets across the organization.
          </div>
        </div>
      ),
    },
    {
      id: "allocation", label: "Allocations", icon: Users,
      component: () => <div className="text-sm text-muted-foreground p-4">Asset allocation list will appear here</div>,
    },
    {
      id: "maintenance", label: "Maintenance", icon: Calendar,
      component: () => <div className="text-sm text-muted-foreground p-4">Maintenance schedule and history</div>,
    },
    {
      id: "documents", label: "Documents", icon: FileText,
      component: () => <div className="text-sm text-muted-foreground p-4">Asset documents and manuals</div>,
    },
    {
      id: "timeline", label: "Timeline", icon: Clock,
      component: () => <div className="text-sm text-muted-foreground p-4">Activity timeline for this asset</div>,
    },
  ];

  return (
    <WorkspaceShell
      tabs={tabs}
      defaultTab="overview"
      header={
        <WorkspaceHeader
          title="Asset Management"
          subtitle="Track equipment, IT assets, furniture and more"
          color="#6366f1"
        />
      }
    />
  );
}
