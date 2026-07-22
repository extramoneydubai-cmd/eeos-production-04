import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  ArrowUp,
  GripVertical,
  Clock,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { useAppNavigate } from "@/hooks/use-app-navigate";

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "bg-[#9aa0a6]" },
  { id: "todo", title: "To Do", color: "bg-[#4285f4]" },
  { id: "in_progress", title: "In Progress", color: "bg-[#fbbc04]" },
  { id: "review", title: "Review", color: "bg-[#a855f7]" },
  { id: "done", title: "Done", color: "bg-[#34a853]" },
];

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: "Low", color: "text-[#9aa0a6] bg-[#f1f3f4]", icon: ArrowUp },
  medium: { label: "Medium", color: "text-[#4285f4] bg-[#e8f0fe]", icon: ArrowUp },
  high: { label: "High", color: "text-[#ea4335] bg-[#fce8e6]", icon: ArrowUp },
  critical: { label: "Critical", color: "text-white bg-[#ea4335]", icon: AlertCircle },
};

function TaskCard({
  task,
  onClick,
}: {
  task: any;
  onClick: () => void;
}) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const PriorityIcon = priority.icon;
  const users = useQuery(api.users.listUsers);
  const participants = useQuery(api.tasks.getTaskParticipants, { taskId: task._id });
  const checklist = useQuery(api.tasks.getTaskChecklist, { taskId: task._id });

  const owner = users?.find((u: any) => u._id === task.ownerId);
  const assignee = task.assignedTo ? users?.find((u: any) => u._id === task.assignedTo) : null;
  const completedItems = checklist?.filter((c: any) => c.completed).length || 0;
  const totalItems = checklist?.length || 0;

  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-[#e8eaed] p-3 cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-150 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge className={`text-[10px] px-1.5 py-0 h-4 font-medium ${priority.color}`}>
          <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
          {priority.label}
        </Badge>
        {isOverdue && (
          <Badge variant="outline" className="text-[10px] text-[#ea4335] border-[#ea4335] h-4 px-1">
            Overdue
          </Badge>
        )}
      </div>

      <p className="text-[13px] font-medium text-[#1a1a2e] line-clamp-2 mb-2 leading-snug">
        {task.title}
      </p>

      {task.description && (
        <p className="text-[11px] text-[#5f6368] line-clamp-1 mb-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {owner && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px] bg-[#f1f3f4] text-[#5f6368]">
                    {owner.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">Owner: {owner.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {assignee && assignee._id !== task.ownerId && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5 border border-white -ml-1">
                  <AvatarFallback className="text-[8px] bg-[#e8f0fe] text-[#1a73e8]">
                    {assignee.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">Assigned to: {assignee.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-[10px] text-[#9aa0a6]">
        {totalItems > 0 && (
          <span className="flex items-center gap-0.5">
            <CheckSquare className="h-3 w-3" />
            {completedItems}/{totalItems}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const tasks = useQuery(api.tasks.listTasks, {});
  const users = useQuery(api.users.listUsers);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);

  const createTaskMutation = useMutation(api.tasks.createTask);
  const updateStatusMutation = useMutation(api.tasks.updateTaskStatus);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newStatus, setNewStatus] = useState("todo");
  const [creating, setCreating] = useState(false);

  const handleCreateTask = async () => {
    if (!newTitle || !user) return;
    setCreating(true);
    try {
      await createTaskMutation({
        title: newTitle,
        description: newDesc || undefined,
        status: newStatus,
        priority: newPriority,
        ownerId: user._id,
        assignedTo: newAssignee as any || undefined,
        departmentId: newDepartment as any || undefined,
      });
      setShowCreateDialog(false);
      setNewTitle("");
      setNewDesc("");
      setNewPriority("medium");
      setNewAssignee("");
      setNewDepartment("");
      setNewStatus("todo");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedTask) return;
    const tasksInColumn = tasks?.filter((t: any) => t.status === columnId) || [];
    updateStatusMutation({
      taskId: draggedTask as any,
      status: columnId,
      order: tasksInColumn.length,
    });
    setDraggedTask(null);
  };

  const getTasksForColumn = (status: string) => {
    return (tasks || []).filter((t: any) => t.status === status);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Task Management</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Kanban board</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base">Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px]">Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-9 text-[13px]" placeholder="Task title" />
              </div>
              <div>
                <Label className="text-[12px]">Description</Label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="text-[13px]" rows={3} placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[12px]">Priority</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[12px]">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((col) => (
                        <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[12px]">Assign To</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter((u: any) => !u.isDisabled).map((u: any) => (
                      <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTask} disabled={creating || !newTitle} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="w-full overflow-x-auto">
        <div className="flex gap-4 min-w-[900px] pb-2">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            return (
              <div
                key={column.id}
                className="flex-1 min-w-[200px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${column.color}`} />
                  <h3 className="text-[12px] font-semibold text-[#1a1a2e] uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-[#f1f3f4] text-[#5f6368] ml-auto">
                    {columnTasks.length}
                  </Badge>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => handleDragStart(task._id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard
                        task={task}
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      />
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="border-2 border-dashed border-[#e8eaed] rounded-lg p-4 text-center">
                      <p className="text-[11px] text-[#9aa0a6]">Drop tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
