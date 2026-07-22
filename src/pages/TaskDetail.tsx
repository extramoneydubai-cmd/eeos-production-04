import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  User,
  MessageSquare,
  CheckSquare,
  Paperclip,
  Activity,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Send,
  ArrowUp,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Doc } from "@/convex/_generated/dataModel";

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: "Low", color: "text-[#9aa0a6] bg-[#f1f3f4]", icon: ArrowUp },
  medium: { label: "Medium", color: "text-[#4285f4] bg-[#e8f0fe]", icon: ArrowUp },
  high: { label: "High", color: "text-[#ea4335] bg-[#fce8e6]", icon: ArrowUp },
  critical: { label: "Critical", color: "text-white bg-[#ea4335]", icon: AlertCircle },
};

export default function TaskDetail() {
  const { taskId } = useParams();
  const { navigate } = useAppNavigate();
  const { user } = useAuth();

  const task = useQuery(api.tasks.getTaskById, taskId ? { taskId: taskId as any } : "skip");
  const users = useQuery(api.users.listUsers);
  const participants = useQuery(api.tasks.getTaskParticipants, taskId ? { taskId: taskId as any } : "skip");
  const checklist = useQuery(api.tasks.getTaskChecklist, taskId ? { taskId: taskId as any } : "skip");
  const comments = useQuery(api.tasks.getTaskComments, taskId ? { taskId: taskId as any } : "skip");

  const updateTask = useMutation(api.tasks.updateTask);
  const addComment = useMutation(api.tasks.addComment);
  const addChecklistItem = useMutation(api.tasks.addChecklistItem);
  const toggleChecklistItem = useMutation(api.tasks.toggleChecklistItem);
  const deleteChecklistItem = useMutation(api.tasks.deleteChecklistItem);

  const [newComment, setNewComment] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  const owner = users?.find((u: any) => u._id === task.ownerId);
  const assignee = task.assignedTo ? users?.find((u: any) => u._id === task.assignedTo) : null;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const PriorityIcon = priority.icon;

  const statusConfig: Record<string, { label: string; color: string }> = {
    backlog: { label: "Backlog", color: "bg-[#9aa0a6]" },
    todo: { label: "To Do", color: "bg-[#4285f4]" },
    in_progress: { label: "In Progress", color: "bg-[#fbbc04]" },
    review: { label: "Review", color: "bg-[#a855f7]" },
    done: { label: "Done", color: "bg-[#34a853]" },
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    await addComment({
      taskId: task._id,
      userId: user._id,
      content: newComment,
    });
    setNewComment("");
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    await addChecklistItem({
      taskId: task._id,
      text: newChecklistItem,
    });
    setNewChecklistItem("");
  };

  const handleToggleChecklist = async (itemId: string, completed: boolean) => {
    await toggleChecklistItem({ itemId: itemId as any, completed });
  };

  const handleDeleteChecklist = async (itemId: string) => {
    await deleteChecklistItem({ itemId: itemId as any });
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n: any) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate("/tasks")}
        className="flex items-center gap-1 text-[12px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tasks
      </button>

      {/* Task Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[#1a1a2e]">{task.title}</h1>
          {task.description && (
            <p className="text-[13px] text-[#5f6368] mt-1">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={task.priority}
            onValueChange={(v) => updateTask({ taskId: task._id, priority: v as any })}
          >
            <SelectTrigger className="h-7 text-[11px] w-[110px] border-[#e8eaed]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={task.status}
            onValueChange={(v) => updateTask({ taskId: task._id, status: v as any })}
          >
            <SelectTrigger className="h-7 text-[11px] w-[120px] border-[#e8eaed]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-[12px] text-[#5f6368]">
        <div className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          Owner: <span className="font-medium text-[#1a1a2e]">{owner?.name || "Unknown"}</span>
        </div>
        {assignee && (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            Assigned: <span className="font-medium text-[#1a1a2e]">{assignee.name}</span>
          </div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Due: <span className="font-medium text-[#1a1a2e]">{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Created: {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="discussion" className="text-[12px] data-[state=active]:bg-white">Discussion</TabsTrigger>
          <TabsTrigger value="checklist" className="text-[12px] data-[state=active]:bg-white">Checklist</TabsTrigger>
          <TabsTrigger value="activity" className="text-[12px] data-[state=active]:bg-white">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Status</span>
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 ${statusConfig[task.status]?.color} text-white`}>
                    {statusConfig[task.status]?.label || task.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Priority</span>
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 ${priority.color}`}>
                    <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                    {priority.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                  <span className="text-[12px] text-[#5f6368]">Owner</span>
                  <span className="text-[12px] font-medium text-[#1a1a2e]">{owner?.name || "Unknown"}</span>
                </div>
                {assignee && (
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f1f3f4]">
                    <span className="text-[12px] text-[#5f6368]">Assignee</span>
                    <span className="text-[12px] font-medium text-[#1a1a2e]">{assignee.name}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[12px] text-[#5f6368]">Due Date</span>
                    <span className="text-[12px] font-medium text-[#1a1a2e]">
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {!participants?.length ? (
                  <p className="text-[12px] text-[#9aa0a6]">No participants</p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p: any) => {
                      const pu = users?.find((u: any) => u._id === p.userId);
                      return (
                        <div key={p._id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                              {getInitials(pu?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[12px] font-medium text-[#1a1a2e]">{pu?.name || "Unknown"}</p>
                            <p className="text-[10px] text-[#9aa0a6] capitalize">{p.role}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discussion */}
        <TabsContent value="discussion">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {!comments?.length ? (
                  <p className="text-[12px] text-[#9aa0a6] text-center py-6">No comments yet</p>
                ) : (
                  comments.map((comment) => {
                    const cu = users?.find((u: any) => u._id === comment.userId);
                    return (
                      <div key={comment._id} className="flex gap-2">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                            {getInitials(cu?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-[#1a1a2e]">{cu?.name || "Unknown"}</span>
                            <span className="text-[10px] text-[#9aa0a6]">
                              {new Date(comment.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#5f6368] mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="h-9 text-[13px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist */}
        <TabsContent value="checklist">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!checklist?.length ? (
                <p className="text-[12px] text-[#9aa0a6] text-center py-4">No checklist items</p>
              ) : (
                <div className="space-y-1">
                  {checklist.map((item) => (
                    <div key={item._id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#f8f9fa] group">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) =>
                          handleToggleChecklist(item._id, !!checked)
                        }
                        className="h-4 w-4"
                      />
                      <span className={`text-[13px] flex-1 ${item.completed ? "line-through text-[#9aa0a6]" : "text-[#1a1a2e]"}`}>
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[#9aa0a6] hover:text-[#ea4335] opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteChecklist(item._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Add checklist item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="h-9 text-[13px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  onClick={handleAddChecklistItem}
                  disabled={!newChecklistItem.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[12px] text-[#9aa0a6] text-center py-6">Activity tracking coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
