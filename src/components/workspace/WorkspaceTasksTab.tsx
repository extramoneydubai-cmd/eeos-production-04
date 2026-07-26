/**
 * EEOS Workspace Tasks Tab
 *
 * Displays tasks associated with an entity.
 * Integrates with taskSdk for task CRUD.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ListChecks, Plus, CheckCircle2, Clock, AlertCircle,
  Trash2, Calendar,
} from "lucide-react";
import type { WorkspaceTabProps } from "./types";

const statusColors: Record<string, string> = {
  backlog: "text-muted-foreground bg-accent/50",
  todo: "text-blue-600 bg-blue-50",
  in_progress: "text-amber-600 bg-amber-50",
  review: "text-violet-600 bg-violet-50",
  done: "text-emerald-600 bg-emerald-50",
};

const priorityIcons: Record<string, typeof AlertCircle> = {
  low: Clock, medium: AlertCircle, high: AlertCircle, critical: AlertCircle,
};

/** Simple task row for the workspace */
function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: any;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === "done";
  const PriorityIcon = priorityIcons[task.priority] || Clock;

  return (
    <div className="flex items-start gap-2.5 py-2.5 px-3 rounded-sm border border-border/30 bg-card group hover:bg-accent/30 transition-colors">
      <button
        onClick={() => onToggle(task._id, !isDone)}
        className={cn(
          "mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
          isDone
            ? "bg-emerald-500 border-emerald-500"
            : "border-muted-foreground/30 hover:border-primary",
        )}
      >
        {isDone && <CheckCircle2 className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-xs font-medium", isDone && "line-through text-muted-foreground/50")}>
            {task.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {task.priority && (
              <PriorityIcon className={cn(
                "h-3 w-3",
                task.priority === "critical" ? "text-red-500" :
                task.priority === "high" ? "text-orange-500" :
                task.priority === "medium" ? "text-amber-500" : "text-blue-500",
              )} />
            )}
            <Badge className={cn("text-[9px] px-1 py-0 h-3.5 font-normal", statusColors[task.status] || statusColors.backlog)}>
              {task.status?.replace(/_/g, " ") || "todo"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {task.assignedToName && (
            <span className="text-[10px] text-muted-foreground/60">
              {task.assignedToName}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task._id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * WorkspaceTasksTab — entity-bound task management.
 */
export function WorkspaceTasksTab({ entityType, entityId, entity }: WorkspaceTabProps) {
  const [newTitle, setNewTitle] = useState("");

  const tasks = useQuery(
    api.tasks.listByEntity,
    entityId ? { entityType, entityId } : "skip",
  );
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.delete);

  const taskList = (tasks as any[]) || [];
  const pendingTasks = taskList.filter((t) => t.status !== "done");
  const doneTasks = taskList.filter((t) => t.status === "done");

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createTask({
      title: newTitle.trim(),
      entityType,
      entityId,
    });
    setNewTitle("");
  };

  const handleToggle = async (taskId: string, done: boolean) => {
    await updateTask({
      taskId,
      status: done ? "done" : "todo",
    });
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask({ taskId });
  };

  return (
    <Card className="border-border/60 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
            Tasks
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal ml-1">
              {taskList.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New Task Input */}
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task..."
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleCreate}
            disabled={!newTitle.trim()}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>

        {/* Pending Tasks */}
        {pendingTasks.length === 0 && doneTasks.length === 0 ? (
          <EmptyState
            title="No tasks"
            description="No tasks have been created for this entity yet."
            icon={<ListChecks className="h-5 w-5" />}
          />
        ) : (
          <div className="space-y-1.5">
            {pendingTasks.map((task: any) => (
              <TaskRow
                key={task._id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {doneTasks.length > 0 && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground/50 font-medium mb-1.5">
              Completed ({doneTasks.length})
            </p>
            <div className="space-y-1 opacity-60">
              {doneTasks.map((task: any) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper needed by TaskRow
import { cn } from "@/lib/utils";
