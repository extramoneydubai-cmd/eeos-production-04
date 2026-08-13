import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

function formatDate(ts: number | undefined | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OnboardingPage() {
  const [candidateId, setCandidateId] = useState("");

  const candidates = useQuery(api.candidateEngine.listCandidates, {});
  const persons = useQuery(api.personEngine.listPersons, {});
  const users = useQuery(api.users.listUsers);

  const progress = useQuery(
    api.onboardingEngine.getOnboardingProgress,
    candidateId ? { candidateId: candidateId as any } : "skip"
  );

  const generateDefault = useMutation(api.onboardingEngine.generateDefaultOnboarding);
  const createTask = useMutation(api.onboardingEngine.createOnboardingTask);
  const completeTask = useMutation(api.onboardingEngine.completeOnboardingTask);
  const uncompleteTask = useMutation(api.onboardingEngine.uncompleteOnboardingTask);
  const deleteTask = useMutation(api.onboardingEngine.deleteOnboardingTask);

  const [item, setItem] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState("");

  const personMap = useMemo(() => {
    const map = new Map<string, any>();
    (persons?.items || []).forEach((p: any) => map.set(p._id, p));
    return map;
  }, [persons]);

  const candidateName = useMemo(() => {
    const map = new Map<string, string>();
    (candidates || []).forEach((c: any) => {
      const person = personMap.get(c.personId);
      map.set(c._id, person?.displayName || person?.firstName || "Unknown");
    });
    return map;
  }, [candidates, personMap]);

  const handleGenerate = async () => {
    if (!candidateId) {
      toast.error("Select a candidate first");
      return;
    }
    setBusy("generate");
    try {
      const ids = await generateDefault({ candidateId: candidateId as any });
      toast.success(`Onboarding started — ${ids.length} tasks created`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate onboarding");
    } finally {
      setBusy("");
    }
  };

  const handleAddTask = async () => {
    if (!candidateId || !item) {
      toast.error("Candidate and checklist item are required");
      return;
    }
    setBusy("add");
    try {
      await createTask({
        candidateId: candidateId as any,
        checklistItem: item,
        assignedTo: assignedTo ? (assignedTo as any) : undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        notes: notes || undefined,
      });
      toast.success("Task added");
      setItem("");
      setDueDate("");
      setNotes("");
      setAssignedTo("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add task");
    } finally {
      setBusy("");
    }
  };

  const handleToggle = async (task: any) => {
    try {
      if (task.completed) {
        await uncompleteTask({ taskId: task._id });
        toast.success("Task reopened");
      } else {
        await completeTask({ taskId: task._id });
        toast.success("Task completed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update task");
    }
  };

  const handleDelete = async (task: any) => {
    try {
      await deleteTask({ taskId: task._id });
      toast.success("Task deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete task");
    }
  };

  const tasks = progress?.tasks || [];
  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>();
    (users || []).forEach((u: any) => map.set(u._id, u.name || u.email || ""));
    return map;
  }, [users]);

  return (
    <WorkspaceShell
      title="Onboarding"
      subtitle="Employee onboarding checklists, task tracking, and orientation"
    >
      {/* Candidate picker + actions */}
      <Card className="border-border/40 mb-6">
        <div className="p-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5 min-w-[260px]">
            <Label className="text-xs">Candidate</Label>
            <Select value={candidateId} onValueChange={setCandidateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select hired/offered candidate" />
              </SelectTrigger>
              <SelectContent>
                {(candidates || []).map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>
                    {candidateName.get(c._id) || "Unknown"} — {c.appliedPosition} ({c.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!candidateId || busy === "generate"}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {busy === "generate" ? "Generating…" : "Generate Default Checklist"}
          </Button>
        </div>
      </Card>

      {candidateId && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Progress */}
            <Card className="border-border/40">
              <div className="p-4 border-b flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Checklist Progress
                </p>
                <Badge variant="success" className="text-[11px]">
                  {progress?.progress ?? 0}%
                </Badge>
              </div>
              <div className="p-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${progress?.progress ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress?.completed ?? 0} of {progress?.total ?? 0} tasks completed ·{" "}
                  {progress?.pending ?? 0} pending
                </p>

                <div className="space-y-2 mt-4">
                  {tasks.map((t: any) => (
                    <div
                      key={t._id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        t.completed ? "bg-emerald-50/40 border-emerald-100" : "bg-background border-border/40"
                      }`}
                    >
                      <button onClick={() => handleToggle(t)} className="mt-0.5 shrink-0">
                        {t.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>
                          {t.checklistItem}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                          {t.assignedTo && <span>Assigned: {assigneeMap.get(t.assignedTo) || "—"}</span>}
                          {t.dueDate && <span>Due: {formatDate(t.dueDate)}</span>}
                          {t.notes && <span className="truncate max-w-[200px]">{t.notes}</span>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 shrink-0"
                        onClick={() => handleDelete(t)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No onboarding tasks yet — generate the default checklist or add tasks
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Add task */}
          <Card className="border-border/40 h-fit">
            <div className="p-4 border-b">
              <p className="text-sm font-semibold">Add Checklist Item</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Item</Label>
                <Input
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="e.g. Collect PAN card copy"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned To (optional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {(users || []).map((u: any) => (
                      <SelectItem key={u._id} value={u._id}>{u.name || u.email || u._id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due Date (optional)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAddTask} disabled={busy === "add"}>
                <PlusCircle className="h-4 w-4 mr-1.5" />
                {busy === "add" ? "Adding…" : "Add Task"}
              </Button>
              {tasks.length > 0 && (
                <Button variant="outline" className="w-full" onClick={handleGenerate} disabled={busy === "generate"}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Regenerate Default Checklist
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {!candidateId && (
        <Card className="border-border/40">
          <div className="p-10 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Select a candidate above to manage their onboarding checklist
            </p>
          </div>
        </Card>
      )}
    </WorkspaceShell>
  );
}
