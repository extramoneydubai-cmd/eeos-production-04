import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { toast } from "sonner";
import {
  LayoutDashboard,
  PlusCircle,
  Save,
  Trash2,
  Settings,
  GripVertical,
  Maximize2,
  Minimize2,
  Copy,
  Eye,
  EyeOff,
  Grid,
  Columns,
  BarChart3,
  Table2,
  Activity,
  Bell,
  ListChecks,
  TrendingUp,
  Users,
  Star,
  Clock,
  Calendar,
  MessageSquare,
  Target,
  Zap,
  PanelRightOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
} from "lucide-react";

type WidgetInstance = {
  id: string;
  widgetType: string;
  title: string;
  size: "small" | "medium" | "large" | "full";
  config: Record<string, any>;
  dataSource?: string;
};

type Dashboard = {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: WidgetInstance[];
};

const WIDGET_TYPES = [
  { type: "kpi_card", label: "KPI Card", icon: Target, category: "Metrics", sizes: ["small", "medium"] },
  { type: "table", label: "Table", icon: Table2, category: "Data", sizes: ["medium", "large", "full"] },
  { type: "chart", label: "Chart", icon: BarChart3, category: "Visualization", sizes: ["medium", "large"] },
  { type: "calendar", label: "Calendar", icon: Calendar, category: "Schedule", sizes: ["medium", "large"] },
  { type: "timeline", label: "Timeline", icon: Clock, category: "Activity", sizes: ["medium", "large", "full"] },
  { type: "tasks", label: "Tasks", icon: ListChecks, category: "Productivity", sizes: ["small", "medium", "large"] },
  { type: "notifications", label: "Notifications", icon: Bell, category: "Communication", sizes: ["small", "medium"] },
  { type: "recent_activity", label: "Recent Activity", icon: Activity, category: "Activity", sizes: ["medium", "large", "full"] },
  { type: "leaderboard", label: "Leaderboard", icon: TrendingUp, category: "Metrics", sizes: ["small", "medium", "large"] },
  { type: "quick_actions", label: "Quick Actions", icon: Zap, category: "Productivity", sizes: ["small", "medium"] },
];

const WIDGET_COLORS: Record<string, string> = {
  kpi_card: "bg-[#4285f4]", table: "bg-[#34a853]", chart: "bg-[#a855f7]",
  calendar: "bg-[#fbbc04]", timeline: "bg-[#e8710a]", tasks: "bg-[#1a73e8]",
  notifications: "bg-[#ea4335]", recent_activity: "bg-[#a855f7]", leaderboard: "bg-[#34a853]",
  quick_actions: "bg-[#5f6368]",
};

function WidgetCard({ widget, onRemove, onResize }: {
  widget: WidgetInstance; onRemove: () => void; onResize: (size: string) => void;
}) {
  const sizeClasses: Record<string, string> = {
    small: "col-span-1 md:col-span-1 lg:col-span-1",
    medium: "col-span-1 md:col-span-2 lg:col-span-2",
    large: "col-span-1 md:col-span-2 lg:col-span-3",
    full: "col-span-1 md:col-span-4 lg:col-span-4",
  };

  return (
    <div className={`${sizeClasses[widget.size] || "col-span-1"} group`}>
      <Card className="border-[#e8eaed] shadow-sm bg-white h-full hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-2 pt-2.5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3.5 w-3.5 text-[#9aa0a6]" />
              </div>
              <div className={`w-2 h-2 rounded-full ${WIDGET_COLORS[widget.widgetType] || "bg-[#5f6368]"}`} />
              <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{widget.title}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-0.5">
                {["small", "medium", "large", "full"].filter(s => WIDGET_TYPES.find(wt => wt.type === widget.widgetType)?.sizes.includes(s)).map((size) => (
                  <button
                    key={size}
                    onClick={() => onResize(size)}
                    className={`p-0.5 rounded ${widget.size === size ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#9aa0a6] hover:text-[#5f6368]"}`}
                    title={`${size} size`}
                  >
                    {size === "small" ? <Minimize2 className="h-3 w-3" /> : size === "full" ? <Maximize2 className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
                  </button>
                ))}
              </div>
              <button onClick={onRemove} className="p-0.5 rounded text-[#9aa0a6] hover:text-[#ea4335] hover:bg-[#fce8e6]">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="h-24 rounded-lg bg-[#f8f9fa] flex items-center justify-center">
            <div className="text-center">
              {React.createElement(WIDGET_TYPES.find(wt => wt.type === widget.widgetType)?.icon || LayoutDashboard, { className: "h-6 w-6 text-[#dadce0] mx-auto mb-1" })}
              <p className="text-[10px] text-[#9aa0a6]">{widget.widgetType.replace(/_/g, " ")} widget</p>
              {widget.dataSource && <p className="text-[9px] text-[#dadce0] mt-0.5">{widget.dataSource}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardStudio() {
  const { user, isDemoMode } = useAuth();
  const { navigate } = useAppNavigate();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [showWidgetPalette, setShowWidgetPalette] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [dashboardName, setDashboardName] = useState("My Dashboard");
  const skipDb = !user || isDemoMode;

  // Load existing layout
  const myLayout = useQuery(api.dashboardEngine.getMyLayout, skipDb ? "skip" : { userId: user._id });
  const availableWidgets = useQuery(api.dashboardEngine.listWidgets, { isActive: true });

  useEffect(() => {
    if (myLayout) {
      try {
        const parsedWidgets = JSON.parse((myLayout as any).widgets || "[]");
        setDashboards([{
          id: (myLayout as any)._id,
          name: (myLayout as any).name || "My Dashboard",
          isDefault: (myLayout as any).isDefault || false,
          widgets: parsedWidgets,
        }]);
        setCurrentDashboardId((myLayout as any)._id);
        setDashboardName((myLayout as any).name || "My Dashboard");
      } catch { /* use defaults */ }
    }
  }, [myLayout]);

  const saveLayout = useMutation(api.dashboardEngine.saveLayout);

  const currentDashboard = dashboards.find((d) => d.id === currentDashboardId) || dashboards[0];

  const addWidget = (widgetType: string) => {
    if (!currentDashboard) return;
    const wt = WIDGET_TYPES.find((w) => w.type === widgetType);
    const newWidget: WidgetInstance = {
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      widgetType,
      title: wt?.label || widgetType,
      size: (wt?.sizes[0] || "medium") as "small" | "medium" | "full" | "large",
      config: {},
      dataSource: widgetType,
    };

    setDashboards((prev) =>
      prev.map((d) =>
        d.id === currentDashboard.id
          ? { ...d, widgets: [...d.widgets, newWidget] }
          : d
      )
    );
  };

  const removeWidget = (widgetId: string) => {
    if (!currentDashboard) return;
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === currentDashboard.id
          ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) }
          : d
      )
    );
  };

  const resizeWidget = (widgetId: string, size: string) => {
    if (!currentDashboard) return;
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === currentDashboard.id
          ? {
              ...d,
              widgets: d.widgets.map((w) =>
                w.id === widgetId ? { ...w, size: size as any } : w
              ),
            }
          : d
      )
    );
  };

  const handleSave = async () => {
    if (!user || !currentDashboard) return;
    try {
      await saveLayout({
        name: dashboardName,
        userId: user._id,
        isDefault: currentDashboard.isDefault,
        widgets: JSON.stringify(currentDashboard.widgets),
      });
      toast.success("Dashboard saved successfully");
    } catch (err: any) {
      toast.error("Failed to save dashboard", { description: err.message });
    }
  };

  const createNewDashboard = () => {
    const newId = `dash-${Date.now()}`;
    setDashboards((prev) => [
      ...prev,
      { id: newId, name: "New Dashboard", isDefault: false, widgets: [] },
    ]);
    setCurrentDashboardId(newId);
    setDashboardName("New Dashboard");
  };

  // Group widgets by category
  const widgetCategories = WIDGET_TYPES.reduce((acc: Record<string, typeof WIDGET_TYPES>, w) => {
    if (!acc[w.category]) acc[w.category] = [];
    acc[w.category].push(w);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-[#1a73e8]" />
          <div>
            {editingName ? (
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                className="h-7 text-sm font-semibold w-48"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-semibold text-[#1a1a2e] cursor-pointer hover:text-[#1a73e8]"
                onClick={() => setEditingName(true)}
              >
                {dashboardName}
              </h1>
            )}
            <p className="text-[11px] text-[#5f6368]">Dashboard Studio — drag & drop builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
            onClick={() => setShowWidgetPalette(!showWidgetPalette)}
          >
            <PanelRightOpen className="h-3.5 w-3.5 mr-1" />
            {showWidgetPalette ? "Hide Widgets" : "Show Widgets"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
            onClick={createNewDashboard}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> New
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5 mr-1" /> Save Layout
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Widget Palette Sidebar */}
        {showWidgetPalette && (
          <div className="w-56 flex-shrink-0 space-y-3">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-[11px] font-semibold text-[#1a1a2e] uppercase tracking-wider">
                  Widget Palette
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {Object.entries(widgetCategories).map(([category, widgets]) => (
                  <div key={category} className="mb-3 last:mb-0">
                    <p className="text-[9px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1.5">{category}</p>
                    <div className="space-y-1">
                      {widgets.map((w) => (
                        <button
                          key={w.type}
                          onClick={() => addWidget(w.type)}
                          className="flex items-center gap-2 w-full p-1.5 rounded-md text-left hover:bg-[#f1f3f4] transition-colors text-[11px] text-[#1a1a2e] group"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${WIDGET_COLORS[w.type] || "bg-[#5f6368]"}`} />
                          <w.icon className="h-3 w-3 text-[#5f6368]" />
                          <span className="flex-1">{w.label}</span>
                          <PlusCircle className="h-3 w-3 text-[#dadce0] group-hover:text-[#1a73e8] transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Dashboard list */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-[11px] font-semibold text-[#1a1a2e] uppercase tracking-wider">
                  Dashboards
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1">
                {dashboards.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { setCurrentDashboardId(d.id); setDashboardName(d.name); }}
                    className={`flex items-center gap-2 w-full p-1.5 rounded-md text-left transition-colors text-[11px] ${
                      d.id === currentDashboardId
                        ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                        : "text-[#1a1a2e] hover:bg-[#f1f3f4]"
                    }`}
                  >
                    <LayoutDashboard className="h-3 w-3" />
                    <span className="flex-1 truncate">{d.name}</span>
                    {d.isDefault && <Star className="h-3 w-3 text-[#fbbc04]" />}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 min-w-0">
          {currentDashboard && currentDashboard.widgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {currentDashboard.widgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  onRemove={() => removeWidget(widget.id)}
                  onResize={(size) => resizeWidget(widget.id, size)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-12 text-center">
                <LayoutDashboard className="h-12 w-12 text-[#dadce0] mx-auto mb-4" />
                <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">Empty Dashboard</h3>
                <p className="text-[13px] text-[#9aa0a6] mb-6 max-w-sm mx-auto">
                  Start building your dashboard by adding widgets from the palette. Drag, resize, and configure each widget to your needs.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                    onClick={() => {
                      // Add a few starter widgets
                      addWidget("kpi_card");
                      setTimeout(() => addWidget("recent_activity"), 100);
                      setTimeout(() => addWidget("tasks"), 200);
                    }}
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Starter Widgets
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Widget count footer */}
          {currentDashboard && currentDashboard.widgets.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-[10px] text-[#9aa0a6]">
                {currentDashboard.widgets.length} widget{currentDashboard.widgets.length !== 1 ? "s" : ""} on this dashboard
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#f1f3f4] border-0">
                  {currentDashboard.isDefault ? "Default" : "Custom"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
