import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Video, FileText, Image, CheckCircle, Clock, AlertCircle,
  Plus, Loader2, ArrowRight, XCircle,
} from "lucide-react";

const TASK_TYPES: { value: string; label: string }[] = [
  { value: "content_writing", label: "Content Writing" },
  { value: "video_production", label: "Video Production" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "question_bank", label: "Question Bank" },
  { value: "review", label: "Review" },
  { value: "publishing", label: "Publishing" },
  { value: "recording", label: "Recording" },
  { value: "editing", label: "Editing" },
];

const STAGES: { value: string; label: string; color: string }[] = [
  { value: "assigned", label: "Draft", color: "bg-gray-400" },
  { value: "in_progress", label: "In Progress", color: "bg-amber-400" },
  { value: "review", label: "Review", color: "bg-purple-400" },
  { value: "approved", label: "Approved", color: "bg-blue-400" },
  { value: "published", label: "Published", color: "bg-green-400" },
  { value: "rejected", label: "Rejected", color: "bg-red-400" },
];

const NEXT_STAGE: Record<string, string> = {
  assigned: "in_progress",
  in_progress: "review",
  review: "approved",
  approved: "published",
};

const TYPE_BADGE: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  content_writing: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  video_production: { icon: Video, color: "text-purple-600", bg: "bg-purple-50" },
  graphic_design: { icon: Image, color: "text-pink-600", bg: "bg-pink-50" },
  question_bank: { icon: FileText, color: "text-teal-600", bg: "bg-teal-50" },
  review: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  publishing: { icon: Video, color: "text-emerald-600", bg: "bg-emerald-50" },
  recording: { icon: Video, color: "text-red-600", bg: "bg-red-50" },
  editing: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
};

export default function ProductionDashboard() {
  const dashboard = useQuery(api.productionSdk.getProductionDashboard);
  const tasks = useQuery(api.productionSdk.listProductionTasks, {});
  const users = useQuery(api.users.listActiveUsers, {});

  const createTask = useMutation(api.productionSdk.createProductionTask);
  const updateStatus = useMutation(api.productionSdk.updateProductionTaskStatus);

  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    title: "", taskType: "content_writing", assignedTo: "", dueDate: "", priority: "medium", description: "",
  });

  const data = dashboard || { total: 0, draft: 0, inProgress: 0, review: 0, approved: 0, published: 0, rejected: 0 };

  const metrics = [
    { label: "Total Tasks", value: data.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "In Progress", value: data.inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Under Review", value: data.review, icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Approved", value: data.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Published", value: data.published, icon: Video, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", value: data.rejected, icon: Image, color: "text-red-600", bg: "bg-red-50" },
  ];

  const filtered = (tasks ?? []).filter((t: any) => statusFilter === "all" || t.status === statusFilter);

  const handleCreate = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    setBusy("create");
    try {
      await createTask({
        title: form.title,
        taskType: form.taskType as any,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
        priority: form.priority as any,
        description: form.description || undefined,
      });
      toast.success("Production task created");
      setCreateOpen(false);
      setForm({ title: "", taskType: "content_writing", assignedTo: "", dueDate: "", priority: "medium", description: "" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create task");
    } finally {
      setBusy(null);
    }
  };

  const handleAdvance = async (task: any) => {
    const next = NEXT_STAGE[task.status];
    if (!next) return;
    setBusy(`adv-${task._id}`);
    try {
      await updateStatus({ taskId: task._id, status: next as any });
      toast.success(`Moved to ${STAGES.find((s) => s.value === next)?.label}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (task: any) => {
    setBusy(`rej-${task._id}`);
    try {
      await updateStatus({ taskId: task._id, status: "rejected" });
      toast.success("Task rejected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject task");
    } finally {
      setBusy(null);
    }
  };

  return (
    <WorkspaceShell title="Production Dashboard" subtitle="Content production pipeline — recording, editing, QA, publishing">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mb-8">
        <h3 className="font-semibold mb-4">Production Pipeline</h3>
        <div className="space-y-3">
          {STAGES.map((stage) => {
            const value =
              stage.value === "assigned" ? data.draft :
              stage.value === "in_progress" ? data.inProgress :
              stage.value === "review" ? data.review :
              stage.value === "approved" ? data.approved :
              stage.value === "published" ? data.published : data.rejected;
            const pct = data.total > 0 ? (value / data.total) * 100 : 0;
            return (
              <div key={stage.value}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{stage.label}</span>
                  <span className="font-medium">{value} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${stage.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Task list */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Production Tasks ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Production Task</DialogTitle>
                  <DialogDescription>Create a task in the content production pipeline.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Record Chapter 5 video" /></div>
                  <div className="col-span-2"><Label>Task Type</Label>
                    <Select value={form.taskType} onValueChange={(v) => setForm({ ...form, taskType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assign To</Label>
                    <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        {(users ?? []).map((u: any) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={busy === "create"}>
                    {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!tasks ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
            No production tasks yet. Create your first task to start the pipeline.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t: any) => {
              const type = TYPE_BADGE[t.taskType] ?? TYPE_BADGE.content_writing;
              const stage = STAGES.find((s) => s.value === t.status);
              const assignee = (users ?? []).find((u: any) => u._id === t.assignedTo);
              return (
                <div key={t._id} className="flex items-center gap-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <div className={`p-2 rounded-lg ${type.bg}`}>
                    <type.icon className={`h-4 w-4 ${type.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {TASK_TYPES.find((x) => x.value === t.taskType)?.label ?? t.taskType}
                      {assignee ? ` • ${assignee.name}` : ""}
                      {t.dueDate ? ` • Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "secondary" : "outline"} className="text-[10px] hidden sm:inline-flex">{t.priority}</Badge>
                  <Badge variant="outline" className="text-[10px]">{stage?.label ?? t.status}</Badge>
                  <div className="flex gap-1.5">
                    {NEXT_STAGE[t.status] && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy === `adv-${t._id}`} onClick={() => handleAdvance(t)}>
                        {busy === `adv-${t._id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                        {NEXT_STAGE[t.status] === "in_progress" ? "Start" : NEXT_STAGE[t.status] === "review" ? "Send to Review" : NEXT_STAGE[t.status] === "approved" ? "Approve" : "Publish"}
                      </Button>
                    )}
                    {t.status !== "rejected" && t.status !== "published" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" disabled={busy === `rej-${t._id}`} onClick={() => handleReject(t)}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </WorkspaceShell>
  );
}
