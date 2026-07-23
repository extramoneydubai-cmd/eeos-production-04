import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Settings,
  Copy,
  Archive,
  Trash2,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  Workflow,
  Layers,
  UserPlus,
  Bell,
  Code,
  ClipboardList,
  CheckSquare,
  Timer,
  StopCircle,
  ListChecks,
  Activity,
  BarChart3,
  PanelRightOpen,
} from "lucide-react";

type TabKey = "dashboard" | "workflows" | "designer" | "executions";

const NODE_ICONS: Record<string, React.ElementType> = {
  start: Play,
  end: StopCircle,
  condition: GitBranch,
  approval: CheckSquare,
  task: ClipboardList,
  notification: Bell,
  delay: Timer,
  decision: GitBranch,
  assignment: UserPlus,
  webhook_placeholder: Code,
  function_placeholder: Code,
  subworkflow: Layers,
};

const NODE_COLORS: Record<string, string> = {
  start: "border-l-[#34a853] bg-[#e6f4ea]",
  end: "border-l-[#ea4335] bg-[#fce8e6]",
  condition: "border-l-[#fbbc04] bg-[#fef7e0]",
  approval: "border-l-[#1a73e8] bg-[#e8f0fe]",
  task: "border-l-[#9c27b0] bg-[#f3e5f5]",
  notification: "border-l-[#0097a7] bg-[#e0f7fa]",
  delay: "border-l-[#795548] bg-[#efebe9]",
  decision: "border-l-[#e8710a] bg-[#fbe9e7]",
  assignment: "border-l-[#607d8b] bg-[#eceff1]",
  webhook_placeholder: "border-l-[#7b1fa2] bg-[#f3e5f5]",
  function_placeholder: "border-l-[#1565c0] bg-[#e3f2fd]",
  subworkflow: "border-l-[#2e7d32] bg-[#e8f5e9]",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f1f3f4] text-[#5f6368]",
  published: "bg-[#e6f4ea] text-[#1e7e34]",
  archived: "bg-[#fce8e6] text-[#c5221f]",
  started: "bg-[#e8f0fe] text-[#1a73e8]",
  in_progress: "bg-[#fef7e0] text-[#e8710a]",
  completed: "bg-[#e6f4ea] text-[#1e7e34]",
  failed: "bg-[#fce8e6] text-[#c5221f]",
  paused: "bg-[#f3e5f5] text-[#9c27b0]",
  cancelled: "bg-[#f1f3f4] text-[#5f6368]",
  pending: "bg-[#f1f3f4] text-[#5f6368]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`text-[11px] font-medium ${STATUS_COLORS[status] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

/* ─────────────
   NODE EDITOR
   ───────────── */

function NodeConfigDialog({
  open,
  onOpenChange,
  node,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: { nodeId: Id<"workflowNodes">; label: string; nodeType: string; config?: string };
  onSave: (nodeId: Id<"workflowNodes">, config: Record<string, unknown>) => void;
}) {
  const [configText, setConfigText] = useState(node.config || "{}");

  const config = (() => {
    try {
      return JSON.parse(configText);
    } catch {
      return {};
    }
  })();

  const handleSave = () => {
    try {
      JSON.parse(configText);
      onSave(node.nodeId, JSON.parse(configText));
      onOpenChange(false);
    } catch {
      toast.error("Invalid JSON configuration");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] text-[#1a1a2e] flex items-center gap-2">
            {node.label}
            <Badge className="text-[10px] bg-[#f1f3f4] text-[#5f6368]">{node.nodeType.replace("_", " ")}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-[12px] text-[#5f6368]">Configuration (JSON)</Label>
            <Textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              className="mt-1 font-mono text-[12px] h-[200px]"
              placeholder='{"key": "value"}'
            />
          </div>
          {node.nodeType === "delay" && (
            <div className="p-3 bg-[#f1f3f4] rounded-md text-[12px] text-[#5f6368]">
              <p className="font-medium text-[#1a1a2e] mb-1">Delay Configuration</p>
              <p>Use <code className="text-[#1a73e8] bg-white px-1 rounded">delayMs</code> or <code className="text-[#1a73e8] bg-white px-1 rounded">delayMinutes</code></p>
            </div>
          )}
          {node.nodeType === "condition" && (
            <div className="p-3 bg-[#f1f3f4] rounded-md text-[12px] text-[#5f6368]">
              <p className="font-medium text-[#1a1a2e] mb-1">Condition Configuration</p>
              <p>Use <code className="text-[#1a73e8] bg-white px-1 rounded">conditionField</code>, <code className="text-[#1a73e8] bg-white px-1 rounded">conditionOperator</code>, <code className="text-[#1a73e8] bg-white px-1 rounded">conditionValue</code></p>
            </div>
          )}
          {node.nodeType === "approval" && (
            <div className="p-3 bg-[#f1f3f4] rounded-md text-[12px] text-[#5f6368]">
              <p className="font-medium text-[#1a1a2e] mb-1">Approval Configuration</p>
              <p>Use <code className="text-[#1a73e8] bg-white px-1 rounded">assignTo</code> (user ID)</p>
            </div>
          )}
          {node.nodeType === "assignment" && (
            <div className="p-3 bg-[#f1f3f4] rounded-md text-[12px] text-[#5f6368]">
              <p className="font-medium text-[#1a1a2e] mb-1">Assignment Configuration</p>
              <p>Use <code className="text-[#1a73e8] bg-white px-1 rounded">assignmentType</code>: user, team, department, manager, round_robin, least_loaded, manual</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-[12px]">Cancel</Button>
          <Button onClick={handleSave} className="text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4e]">Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────
   INSTANCE LOGS
   ───────────── */

function InstanceLogsDialog({
  instanceId,
  open,
  onOpenChange,
}: {
  instanceId: Id<"workflowInstances"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const logs = useQuery(
    api.workflowEngine.getInstanceLogs,
    instanceId ? { instanceId } : "skip",
  );

  if (!instanceId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] text-[#1a1a2e]">Execution Logs</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {logs?.length === 0 && (
            <p className="text-[13px] text-[#9aa0a6] text-center py-8">No logs recorded yet.</p>
          )}
          <div className="space-y-1">
            {logs?.map((log) => (
              <div key={log._id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[#f8f9fa]">
                <div className="w-2 h-2 mt-1.5 rounded-full shrink-0 bg-[#1a73e8]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#1a1a2e]">{log.action.replace(/_/g, " ")}</span>
                    <StatusBadge status={log.status} />
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-[#5f6368] mt-0.5">{log.details}</p>
                  )}
                  <p className="text-[10px] text-[#9aa0a6] mt-0.5">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────
   MAIN PAGE
   ───────────── */

export default function WorkflowStudio() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Id<"workflows"> | null>(null);
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{
    nodeId: Id<"workflowNodes">; label: string; nodeType: string; config?: string;
  } | null>(null);
  const [showInstanceLogs, setShowInstanceLogs] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Id<"workflowInstances"> | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({ name: "", code: "", description: "", module: "general", tag: "" });

  // New node form
  const [showNewNode, setShowNewNode] = useState(false);
  const [newNode, setNewNode] = useState({ nodeType: "task", label: "", description: "" });

  // Queries
  const workflows = useQuery(api.workflowEngine.list, {});
  const dashboardStats = useQuery(api.workflowEngine.getDashboardStats);
  const nodeTypes = useQuery(api.workflowEngine.getNodeTypes);
  const workflowNodes = useQuery(
    api.workflowEngine.listNodes,
    selectedWorkflow ? { workflowId: selectedWorkflow } : "skip",
  );
  const workflowEdges = useQuery(
    api.workflowEngine.listEdges,
    selectedWorkflow ? { workflowId: selectedWorkflow } : "skip",
  );
  const selectedWorkflowData = useQuery(
    api.workflowEngine.getById,
    selectedWorkflow ? { workflowId: selectedWorkflow } : "skip",
  );
  const instances = useQuery(api.workflowEngine.listInstances, {
    workflowId: selectedWorkflow || undefined,
    limit: 20,
  });

  // Mutations
  const createWorkflow = useMutation(api.workflowEngine.create);
  const updateWorkflowMeta = useMutation(api.workflowEngine.update);
  const publishWorkflow = useMutation(api.workflowEngine.publish);
  const archiveWorkflow = useMutation(api.workflowEngine.archive);
  const removeWorkflow = useMutation(api.workflowEngine.remove);
  const cloneWorkflow = useMutation(api.workflowEngine.clone);
  const addNode = useMutation(api.workflowEngine.addNode);
  const updateNode = useMutation(api.workflowEngine.updateNode);
  const removeNode = useMutation(api.workflowEngine.removeNode);
  const addEdge = useMutation(api.workflowEngine.addEdge);
  const removeEdge = useMutation(api.workflowEngine.removeEdge);
  const startWorkflow = useMutation(api.workflowEngine.startWorkflow);
  const cancelInstance = useMutation(api.workflowEngine.cancelInstance);
  const retryInstance = useMutation(api.workflowEngine.retryInstance);

  const filteredWorkflows = (workflows || []).filter((w) =>
    !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name || !newWorkflow.code) {
      toast.error("Name and Code are required");
      return;
    }
    try {
      const result = await createWorkflow({
        name: newWorkflow.name,
        code: newWorkflow.code,
        description: newWorkflow.description || undefined,
        module: newWorkflow.module,
        tag: newWorkflow.tag || undefined,
      });
      toast.success("Workflow created");
      setShowNewWorkflow(false);
      setSelectedWorkflow(result.workflowId);
      setActiveTab("designer");
      setNewWorkflow({ name: "", code: "", description: "", module: "general", tag: "" });
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleAddNode = async () => {
    if (!selectedWorkflow || !newNode.label) {
      toast.error("Label is required");
      return;
    }
    try {
      // Calculate position based on existing nodes
      const existingNodes = workflowNodes || [];
      const posX = 50 + existingNodes.length * 120;
      const posY = 150 + (existingNodes.length % 3) * 80;

      await addNode({
        workflowId: selectedWorkflow,
        nodeType: newNode.nodeType as any,
        label: newNode.label,
        positionX: posX,
        positionY: posY,
        description: newNode.description || undefined,
      });
      toast.success("Node added");
      setShowNewNode(false);
      setNewNode({ nodeType: "task", label: "", description: "" });
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleRemoveNode = async (nodeId: Id<"workflowNodes">) => {
    try {
      await removeNode({ nodeId });
      toast.success("Node removed");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handlePublish = async () => {
    if (!selectedWorkflow) return;
    try {
      await publishWorkflow({ workflowId: selectedWorkflow });
      toast.success("Workflow published!");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleArchive = async () => {
    if (!selectedWorkflow) return;
    try {
      await archiveWorkflow({ workflowId: selectedWorkflow });
      toast.success("Workflow archived");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleClone = async () => {
    if (!selectedWorkflow || !selectedWorkflowData) return;
    try {
      const result = await cloneWorkflow({
        workflowId: selectedWorkflow,
        newName: `${selectedWorkflowData.name} (Copy)`,
        newCode: `${selectedWorkflowData.code}_copy`,
      });
      toast.success("Workflow cloned");
      setSelectedWorkflow(result.workflowId);
      setActiveTab("designer");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;
    try {
      await removeWorkflow({ workflowId: selectedWorkflow });
      toast.success("Workflow deleted");
      setSelectedWorkflow(null);
      setActiveTab("workflows");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleRunTest = async () => {
    if (!selectedWorkflow) return;
    try {
      const result = await startWorkflow({
        workflowId: selectedWorkflow,
        triggerSource: "manual_test",
        triggerPayload: JSON.stringify({ test: true, timestamp: Date.now() }),
      });
      toast.success("Workflow execution started!");
      setActiveTab("executions");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleCancelInstance = async (instanceId: Id<"workflowInstances">) => {
    try {
      await cancelInstance({ instanceId, reason: "Manually cancelled" });
      toast.success("Instance cancelled");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleRetryInstance = async (instanceId: Id<"workflowInstances">) => {
    try {
      await retryInstance({ instanceId });
      toast.success("Retrying instance");
    } catch (err) {
      toast.error(String(err));
    }
  };

  const handleSaveNodeConfig = async (nodeId: Id<"workflowNodes">, config: Record<string, unknown>) => {
    try {
      await updateNode({
        nodeId,
        config: JSON.stringify(config),
      });
      toast.success("Node configuration saved");
    } catch (err) {
      toast.error(String(err));
    }
  };

  /* ─────────────
     RENDER
     ───────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1a1a2e] tracking-tight">Workflow Studio</h1>
          <p className="text-[13px] text-[#5f6368] mt-1">
            Design, execute, and monitor automated workflows across all EEOS modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("dashboard")}
            className={`text-[12px] ${activeTab === "dashboard" ? "bg-[#f1f3f4] border-[#1a73e8] text-[#1a73e8]" : ""}`}
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("workflows")}
            className={`text-[12px] ${activeTab === "workflows" ? "bg-[#f1f3f4] border-[#1a73e8] text-[#1a73e8]" : ""}`}
          >
            <ListChecks className="h-3.5 w-3.5 mr-1.5" />
            Workflows
          </Button>
          {selectedWorkflow && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("designer")}
              className={`text-[12px] ${activeTab === "designer" ? "bg-[#f1f3f4] border-[#1a73e8] text-[#1a73e8]" : ""}`}
            >
              <GitBranch className="h-3.5 w-3.5 mr-1.5" />
              Designer
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("executions")}
            className={`text-[12px] ${activeTab === "executions" ? "bg-[#f1f3f4] border-[#1a73e8] text-[#1a73e8]" : ""}`}
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Executions
          </Button>
        </div>
      </div>

      {/* ────── DASHBOARD ────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Total</p>
                <p className="text-[24px] font-semibold text-[#1a1a2e] mt-1">{dashboardStats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Active</p>
                <p className="text-[24px] font-semibold text-[#1a73e8] mt-1">{dashboardStats?.active || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Completed</p>
                <p className="text-[24px] font-semibold text-[#1e7e34] mt-1">{dashboardStats?.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Failed</p>
                <p className="text-[24px] font-semibold text-[#c5221f] mt-1">{dashboardStats?.failed || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Paused</p>
                <p className="text-[24px] font-semibold text-[#9c27b0] mt-1">{dashboardStats?.paused || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Cancelled</p>
                <p className="text-[24px] font-semibold text-[#5f6368] mt-1">{dashboardStats?.cancelled || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wider">Avg Time</p>
                <p className="text-[18px] font-semibold text-[#1a1a2e] mt-1">
                  {dashboardStats?.avgTime ? formatDuration(dashboardStats.avgTime) : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-[#e8eaed] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] text-[#1a1a2e]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { setShowNewWorkflow(true); setActiveTab("workflows"); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Workflow
              </Button>
              {workflows?.filter((w) => w.status === "published").slice(0, 3).map((w) => (
                <Button
                  key={w._id}
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedWorkflow(w._id); setActiveTab("designer"); }}
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {w.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Workflow list on Dashboard */}
          <Card className="border-[#e8eaed] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] text-[#1a1a2e]">All Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {(workflows || []).slice(0, 10).map((w) => (
                  <div
                    key={w._id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                    onClick={() => { setSelectedWorkflow(w._id); setActiveTab("designer"); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-[#f1f3f4] flex items-center justify-center">
                        <Workflow className="h-4 w-4 text-[#5f6368]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1a1a2e]">{w.name}</p>
                        <p className="text-[11px] text-[#9aa0a6]">{w.code} · v{w.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={w.status} />
                      <Badge className="text-[10px] bg-[#f1f3f4] text-[#5f6368]">{w.module}</Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-[#9aa0a6]" />
                    </div>
                  </div>
                ))}
                {(workflows || []).length === 0 && (
                  <p className="text-[13px] text-[#9aa0a6] text-center py-6">
                    No workflows yet. Create your first workflow to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────── WORKFLOWS LIST ────── */}
      {activeTab === "workflows" && (
        <div className="space-y-4">
          {/* Search + Create */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-[13px] h-9"
              />
            </div>
            <Button size="sm" onClick={() => setShowNewWorkflow(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Workflow
            </Button>
          </div>

          {/* Workflow cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWorkflows.map((w) => (
              <Card key={w._id} className="border-[#e8eaed] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedWorkflow(w._id); setActiveTab("designer"); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-[#f1f3f4] flex items-center justify-center">
                        <Workflow className="h-4 w-4 text-[#5f6368]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1a1a2e]">{w.name}</p>
                        <p className="text-[10px] text-[#9aa0a6]">{w.code}</p>
                      </div>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                  {w.description && (
                    <p className="text-[12px] text-[#5f6368] mt-2 line-clamp-2">{w.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-[#9aa0a6]">
                    <Badge className="text-[10px] bg-[#f1f3f4] text-[#5f6368]">{w.module}</Badge>
                    <span>v{w.version}</span>
                    {w.tag && <Badge className="text-[10px] bg-[#fef7e0] text-[#e8710a]">{w.tag}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredWorkflows.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Workflow className="h-12 w-12 mx-auto text-[#dadce0]" />
                <p className="text-[14px] text-[#9aa0a6] mt-3">
                  {searchQuery ? "No matching workflows" : "No workflows yet"}
                </p>
                {!searchQuery && (
                  <Button size="sm" className="mt-3" onClick={() => setShowNewWorkflow(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create your first workflow
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── DESIGNER ────── */}
      {activeTab === "designer" && selectedWorkflow && (
        <div className="space-y-4">
          {/* Designer toolbar */}
          <div className="flex items-center justify-between p-3 bg-white border border-[#e8eaed] rounded-md">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[14px] font-medium text-[#1a1a2e]">{selectedWorkflowData?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[#9aa0a6]">{selectedWorkflowData?.code}</span>
                  <StatusBadge status={selectedWorkflowData?.status || "draft"} />
                  <span className="text-[11px] text-[#9aa0a6]">v{selectedWorkflowData?.version}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handlePublish}
                      disabled={selectedWorkflowData?.status === "published"}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Publish
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[11px]">Publish workflow to make it executable</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleRunTest}
                      disabled={selectedWorkflowData?.status !== "published"}>
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Run Test
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[11px]">Execute workflow with test payload</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Separator orientation="vertical" className="h-5" />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleClone}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[11px]">Clone workflow</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleArchive}
                      disabled={selectedWorkflowData?.status === "archived"}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[11px]">Archive workflow</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[#c5221f] hover:text-[#c5221f] hover:bg-[#fce8e6]" onClick={handleDelete}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[11px]">Delete workflow</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Canvas area */}
          <div className="grid grid-cols-[240px_1fr] gap-4">
            {/* Node palette */}
            <Card className="border-[#e8eaed] shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] text-[#1a1a2e]">Node Types</CardTitle>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]"
                    onClick={() => setShowNewNode(true)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Node
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    {nodeTypes?.map((nt) => {
                      const Icon = NODE_ICONS[nt.type] || Workflow;
                      return (
                        <div
                          key={nt.type}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all
                            border-l-2 ${NODE_COLORS[nt.type] || "border-l-[#5f6368] bg-[#f1f3f4]"}
                            hover:shadow-sm`}
                          onClick={() => setShowNewNode(true)}
                        >
                          <Icon className="h-3.5 w-3.5 text-[#5f6368] shrink-0" />
                          <div>
                            <p className="text-[11px] font-medium text-[#1a1a2e]">{nt.label}</p>
                            <p className="text-[9px] text-[#9aa0a6]">{nt.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Canvas */}
            <Card className="border-[#e8eaed] shadow-sm">
              <CardContent className="p-4">
                <div className="min-h-[500px] bg-[#f8f9fa] rounded-md border border-[#e8eaed] p-4">
                  {(workflowNodes || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[500px]">
                      <GitBranch className="h-12 w-12 text-[#dadce0]" />
                      <p className="text-[14px] text-[#9aa0a6] mt-3">No nodes in this workflow</p>
                      <p className="text-[12px] text-[#9aa0a6]">Add nodes to build your workflow</p>
                      <Button size="sm" className="mt-3" onClick={() => setShowNewNode(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add first node
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Flow indicator */}
                      <div className="flex items-center gap-1 text-[10px] text-[#9aa0a6] mb-4">
                        <Workflow className="h-3 w-3" />
                        <span>{workflowNodes?.length} nodes · {workflowEdges?.length} connections</span>
                      </div>

                      {/* Nodes as cards connected by arrows */}
                      <div className="space-y-0 relative">
                        {workflowNodes?.sort((a, b) => a.createdAt - b.createdAt).map((node, idx) => {
                          const Icon = NODE_ICONS[node.nodeType] || Workflow;
                          const colorClass = NODE_COLORS[node.nodeType] || "border-l-[#5f6368] bg-[#f1f3f4]";
                          const config = node.config ? (() => { try { return JSON.parse(node.config); } catch { return {}; } })() : {};

                          return (
                            <div key={node._id}>
                              {/* Arrow between nodes */}
                              {idx > 0 && (
                                <div className="flex justify-center py-1">
                                  <div className="w-0.5 h-6 bg-[#dadce0]" />
                                </div>
                              )}

                              <div
                                className={`flex items-center gap-3 p-3 rounded-md border-l-2 ${colorClass}
                                  cursor-pointer hover:shadow-sm transition-shadow group`}
                                onClick={() => {
                                  setSelectedNode({
                                    nodeId: node._id,
                                    label: node.label,
                                    nodeType: node.nodeType,
                                    config: node.config || undefined,
                                  });
                                  setShowNodeConfig(true);
                                }}
                              >
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                  <Icon className="h-4 w-4 text-[#5f6368]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-medium text-[#1a1a2e]">{node.label}</p>
                                    <Badge className="text-[9px] bg-white/80 text-[#5f6368]">
                                      {node.nodeType.replace(/_/g, " ")}
                                    </Badge>
                                  </div>
                                  {Object.keys(config).length > 0 && (
                                    <p className="text-[10px] text-[#5f6368] mt-0.5 truncate">
                                      {JSON.stringify(config).substring(0, 60)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#c5221f]"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveNode(node._id); }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add node at bottom */}
                      <div className="flex justify-center pt-2">
                        <Button variant="outline" size="sm" className="text-[11px]" onClick={() => setShowNewNode(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Node
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ────── EXECUTIONS ────── */}
      {activeTab === "executions" && (
        <div className="space-y-4">
          <Card className="border-[#e8eaed] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] text-[#1a1a2e]">Execution History</CardTitle>
              <CardDescription className="text-[12px] text-[#9aa0a6]">
                {selectedWorkflow ? `Workflow: ${selectedWorkflowData?.name}` : "All workflows"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(instances || []).length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-[#dadce0]" />
                  <p className="text-[14px] text-[#9aa0a6] mt-3">No executions yet</p>
                  <p className="text-[12px] text-[#9aa0a6]">Publish and run a workflow to see executions here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {instances?.map((inst) => (
                    <div key={inst._id} className="flex items-center justify-between p-3 rounded-md hover:bg-[#f8f9fa]">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          inst.status === "completed" ? "bg-[#34a853]" :
                          inst.status === "failed" ? "bg-[#ea4335]" :
                          inst.status === "started" || inst.status === "in_progress" ? "bg-[#1a73e8]" :
                          inst.status === "cancelled" ? "bg-[#5f6368]" :
                          inst.status === "paused" ? "bg-[#9c27b0]" : "bg-[#fbbc04]"
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-[#1a1a2e]">
                              {inst.triggerSource.replace(/_/g, " ")}
                            </p>
                            <StatusBadge status={inst.status} />
                          </div>
                          <p className="text-[11px] text-[#9aa0a6]">
                            Started: {formatDate(inst.startedAt)}
                            {inst.completedAt && ` · Completed: ${formatDuration(inst.completedAt - inst.startedAt)}`}
                            {inst.error && ` · Error: ${inst.error.substring(0, 40)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => { setSelectedInstance(inst._id); setShowInstanceLogs(true); }}>
                                <PanelRightOpen className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[11px]">View logs</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {inst.status === "started" || inst.status === "in_progress" || inst.status === "paused" ? (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#c5221f]"
                                  onClick={() => handleCancelInstance(inst._id)}>
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-[11px]">Cancel execution</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : inst.status === "failed" ? (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#1a73e8]"
                                  onClick={() => handleRetryInstance(inst._id)}>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="text-[11px]">Retry execution</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────── DIALOGS ────── */}

      {/* New Workflow */}
      <Dialog open={showNewWorkflow} onOpenChange={setShowNewWorkflow}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[#1a1a2e]">Create New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[12px] text-[#5f6368]">Workflow Name *</Label>
              <Input
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                className="mt-1 text-[13px]"
                placeholder="e.g., Lead Assignment"
              />
            </div>
            <div>
              <Label className="text-[12px] text-[#5f6368]">Workflow Code *</Label>
              <Input
                value={newWorkflow.code}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                className="mt-1 text-[13px] font-mono"
                placeholder="e.g., LEAD_ASSIGNMENT"
              />
            </div>
            <div>
              <Label className="text-[12px] text-[#5f6368]">Module</Label>
              <Select value={newWorkflow.module} onValueChange={(v) => setNewWorkflow({ ...newWorkflow, module: v })}>
                <SelectTrigger className="mt-1 text-[13px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["general", "crm", "admissions", "hr", "finance", "production", "support", "procurement", "vendor", "inventory", "asset", "knowledge"].map((m) => (
                    <SelectItem key={m} value={m} className="text-[13px]">{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] text-[#5f6368]">Tag (Optional)</Label>
              <Input
                value={newWorkflow.tag}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, tag: e.target.value })}
                className="mt-1 text-[13px]"
                placeholder="e.g., MVP, Beta"
              />
            </div>
            <div>
              <Label className="text-[12px] text-[#5f6368]">Description</Label>
              <Textarea
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                className="mt-1 text-[13px]"
                placeholder="Describe what this workflow does"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewWorkflow(false)} className="text-[12px]">Cancel</Button>
            <Button onClick={handleCreateWorkflow} className="text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4e]">Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Node */}
      <Dialog open={showNewNode} onOpenChange={setShowNewNode}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[#1a1a2e]">Add Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[12px] text-[#5f6368]">Node Type</Label>
              <Select value={newNode.nodeType} onValueChange={(v) => setNewNode({ ...newNode, nodeType: v })}>
                <SelectTrigger className="mt-1 text-[13px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes?.filter((nt) => nt.type !== "start" && nt.type !== "end").map((nt) => (
                    <SelectItem key={nt.type} value={nt.type} className="text-[13px]">{nt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] text-[#5f6368]">Label *</Label>
              <Input
                value={newNode.label}
                onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                className="mt-1 text-[13px]"
                placeholder="e.g., Check Lead Status"
              />
            </div>
            <div>
              <Label className="text-[12px] text-[#5f6368]">Description</Label>
              <Textarea
                value={newNode.description}
                onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                className="mt-1 text-[13px]"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNode(false)} className="text-[12px]">Cancel</Button>
            <Button onClick={handleAddNode} className="text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4e]">Add Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Config */}
      {selectedNode && (
        <NodeConfigDialog
          open={showNodeConfig}
          onOpenChange={setShowNodeConfig}
          node={selectedNode}
          onSave={handleSaveNodeConfig}
        />
      )}

      {/* Instance Logs */}
      <InstanceLogsDialog
        instanceId={selectedInstance}
        open={showInstanceLogs}
        onOpenChange={setShowInstanceLogs}
      />
    </div>
  );
}
