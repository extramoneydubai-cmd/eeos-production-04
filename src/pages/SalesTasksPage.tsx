import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  Search, Loader2, Users, Calendar,
  CheckCircle2, Flag, User, ArrowRight, X, Plus,
  ExternalLink, MessageCircle, TrendingUp, Bell,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";

const stageColors: Record<string, string> = {
  new: "bg-[#9aa0a6]", attempted: "bg-[#4285f4]", connected: "bg-[#34a853]",
  qualified: "bg-[#fbbc04]", counselling: "bg-[#a855f7]", interested: "bg-[#1a73e8]",
  follow_up: "bg-[#ea4335]", negotiation: "bg-[#e8710a]", converted: "bg-[#0d652d]", lost: "bg-[#5f6368]",
};

const PIPELINE_STAGES = [
  { id: "new", label: "New" }, { id: "attempted", label: "Attempted" },
  { id: "connected", label: "Connected" }, { id: "qualified", label: "Qualified" },
  { id: "counselling", label: "Counselling" }, { id: "interested", label: "Interested" },
  { id: "follow_up", label: "Follow Up" }, { id: "negotiation", label: "Negotiation" },
  { id: "converted", label: "Converted" }, { id: "lost", label: "Lost" },
];

const priorityBadge: Record<string, string> = {
  low: "text-[#9aa0a6] bg-[#f1f3f4]", medium: "text-[#4285f4] bg-[#e8f0fe]",
  high: "text-[#ea4335] bg-[#fce8e6]", critical: "text-white bg-[#ea4335]",
};

const statusBadge: Record<string, string> = {
  pending: "text-[#9aa0a6] bg-[#f1f3f4]",
  in_progress: "text-[#4285f4] bg-[#e8f0fe]",
  completed: "text-[#34a853] bg-[#e6f4ea]",
  cancelled: "text-[#5f6368] bg-[#f1f3f4]",
};

const statusLabel: Record<string, string> = {
  pending: "Pending", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

function getOverdueBadge(count: number): { label: string; color: string; bg: string } {
  if (count === 0) return { label: "0 overdue", color: "text-[#34a853]", bg: "bg-[#e6f4ea]" };
  if (count <= 5) return { label: `${count} overdue`, color: "text-[#f9a825]", bg: "bg-[#fff8e1]" };
  return { label: `${count} overdue`, color: "text-white", bg: "bg-[#ea4335]" };
}

export default function SalesTasksPage() {
  const { user, isDemoMode } = useAuth();
  const { navigate } = useAppNavigate();
  const skipDb = !user || isDemoMode;

  const data = useQuery(api.crm.getSalesPendingTasks, skipDb ? "skip" : { userId: user._id });
  const updateTaskStatus = useMutation(api.crm.updateLeadTaskStatus);
  const updateTask = useMutation(api.crm.updateLeadTask);
  const createLeadTask = useMutation(api.crm.createLeadTask);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToMe, setAssignedToMe] = useState(false);

  // Create task dialog
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createLeadId, setCreateLeadId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  // Accordion state for collapse/expand all
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAll = useCallback(() => {
    if (allExpanded || accordionValue.length > 0) {
      setAccordionValue([]);
      setAllExpanded(false);
    } else {
      const all = (data?.leads || []).map((_, i) => `lead-${i}`);
      setAccordionValue(all);
      setAllExpanded(true);
    }
  }, [allExpanded, accordionValue, data?.leads]);

  // Filtered leads
  const filteredData = useMemo(() => {
    if (!data) return null;
    let leads = data.leads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      leads = leads.filter((g: any) =>
        g.lead.firstName.toLowerCase().includes(q) ||
        g.lead.lastName.toLowerCase().includes(q) ||
        g.lead.phone.includes(q) ||
        g.tasks.some((t: any) => t.title.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      leads = leads.filter((g: any) => g.tasks.some((t: any) => t.status === statusFilter));
    }

    if (priorityFilter !== "all") {
      leads = leads.filter((g: any) => g.tasks.some((t: any) => t.priority === priorityFilter));
    }

    return { ...data, leads };
  }, [data, searchQuery, statusFilter, priorityFilter]);

  // Handle task completion toggle
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateTaskStatus({ taskId: taskId as any, status: newStatus, userId: user?._id });
  };

  // Handle create task for lead
  const handleCreateTask = async () => {
    if (!user || !createLeadId || !newTaskTitle) return;
    setCreating(true);
    try {
      await createLeadTask({
        leadId: createLeadId as any,
        title: newTaskTitle,
        ownerId: user._id,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).getTime() : undefined,
        priority: newTaskPriority as any,
      });
      setShowCreateTask(false);
      setCreateLeadId(null);
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  const { summary, leads, users: userList } = filteredData || data;

  // Smart badge for overdue count
  const overdueBadge = getOverdueBadge(summary.overdue);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Pending Tasks</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Grouped by lead — manage all pending work</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm")}>
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Dashboard
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/leads")}>
            <Users className="h-3.5 w-3.5 mr-1" /> Database
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Sales Center
          </Button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-3 text-center">
          <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">Pending</p>
          <p className="text-lg font-semibold text-[#1a1a2e] mt-0.5">{summary.totalPending}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-3 text-center">
          <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">In Progress</p>
          <p className="text-lg font-semibold text-[#4285f4] mt-0.5">{summary.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-3 text-center">
          <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">Overdue</p>
          <p className={`text-lg font-semibold mt-0.5 ${summary.overdue > 0 ? "text-[#ea4335]" : "text-[#34a853]"}`}>{summary.overdue}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-3 text-center">
          <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">Completed Today</p>
          <p className="text-lg font-semibold text-[#34a853] mt-0.5">{summary.completedToday}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
          <Input
            placeholder="Search lead or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9 text-[12px] bg-white border-[#e8eaed]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-[11px] w-[110px] border-[#e8eaed]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 text-[11px] w-[100px] border-[#e8eaed]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setAssignedToMe(!assignedToMe)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all ${
            assignedToMe ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
          }`}
        >
          <User className="h-3 w-3" />
          Assigned to Me
        </button>
        <div className="w-px h-5 bg-[#e8eaed]" />
        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#5f6368]" onClick={toggleAll}>
          {allExpanded || accordionValue.length > 0 ? "Collapse All" : "Expand All"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] border-[#e8eaed] ml-auto"
          onClick={() => { setShowCreateTask(true); setCreateLeadId(null); }}
        >
          <Plus className="h-3 w-3 mr-1" /> Create Task
        </Button>
        {/* Reset filters */}
        {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || assignedToMe) && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-[#5f6368]"
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); setPriorityFilter("all"); setAssignedToMe(false); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Empty State */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-[#34a853] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">No Tasks</h3>
          <p className="text-[13px] text-[#5f6368] mb-4">Great work. All actions completed.</p>
          <Button
            size="sm"
            className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={() => navigate("/crm/sales")}
          >
            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Back to Sales Center
          </Button>
        </div>
      ) : (
        /* Accordion List */
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={(val) => { setAccordionValue(val); setAllExpanded(val.length === leads.length); }}
          className="bg-white rounded-lg border border-[#e8eaed] shadow-sm divide-y divide-[#f1f3f4]"
        >
          {leads.map((group, idx) => {
            const lead = group.lead;
            const owner = userList?.find((u: any) => u._id === lead.ownerId);
            const stageLabel = PIPELINE_STAGES.find((s: any) => s.id === lead.stage)?.label || lead.stage;
            const overdueB = getOverdueBadge(group.overdueCount);

            return (
              <AccordionItem key={`lead-${idx}`} value={`lead-${idx}`} className="border-0">
                {/* Lead Header (always visible) */}
                <AccordionTrigger className="px-4 py-3 hover:bg-[#f8f9fa] hover:no-underline [&>svg]:text-[#9aa0a6]">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">
                        {(lead.firstName || "?")[0]}{(lead.lastName || "")[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#1a1a2e] truncate max-w-[200px]">
                          {lead.firstName} {lead.lastName}
                        </span>
                        <Badge className={`text-[8px] px-1.5 py-0 h-4 ${stageColors[lead.stage] || "bg-[#9aa0a6]"} text-white shrink-0`}>
                          {stageLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {group.courses.length > 0 && (
                          <span className="text-[10px] text-[#5f6368] truncate max-w-[180px]">
                            {group.courses.join(", ")}
                          </span>
                        )}
                        {owner && (
                          <span className="text-[10px] text-[#9aa0a6] shrink-0">
                            · {owner.name?.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Task count badge */}
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${overdueB.bg} ${overdueB.color}`}>
                        {group.taskCount} tasks
                      </div>
                      {/* Overdue badge */}
                      {group.overdueCount > 0 && (
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${overdueB.color === "text-white" ? "bg-[#ea4335] text-white" : "bg-[#fce8e6] text-[#ea4335]"}`}>
                          {group.overdueCount} overdue
                        </div>
                      )}
                      {/* Priority indicator */}
                      {group.tasks.some((t: any) => t.priority === "critical") && (
                        <Flag className="h-3.5 w-3.5 text-[#ea4335]" />
                      )}
                      {/* Open Lead button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] text-[#1a73e8] hover:bg-[#e8f0fe]"
                        onClick={(e) => { e.stopPropagation(); navigate(`/crm/leads/${lead._id}`); }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Open Lead
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>

                {/* Tasks (expandable) */}
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-1">
                    {/* Sort group headers */}
                    {(() => {
                      const now = Date.now();
                      const day = 86400000;
                      const buckets: { label: string; tasks: typeof group.tasks; color: string }[] = [
                        { label: "Overdue", tasks: [], color: "text-[#ea4335]" },
                        { label: "Due Today", tasks: [], color: "text-[#fbbc04]" },
                        { label: "Due This Week", tasks: [], color: "text-[#4285f4]" },
                        { label: "No Deadline", tasks: [], color: "text-[#9aa0a6]" },
                      ];
                      for (const t of group.tasks) {
                        if (t.dueDate != null && t.dueDate < now) buckets[0].tasks.push(t);
                        else if (t.dueDate != null && t.dueDate >= now && t.dueDate <= now + day) buckets[1].tasks.push(t);
                        else if (t.dueDate != null && t.dueDate > now + day && t.dueDate <= now + 7 * day) buckets[2].tasks.push(t);
                        else buckets[3].tasks.push(t);
                      }
                      return buckets.map((bucket) =>
                        bucket.tasks.length === 0 ? null : (
                          <div key={bucket.label}>
                            <div className="flex items-center gap-1.5 py-1.5 px-1">
                              <div className={`text-[9px] font-semibold uppercase tracking-wider ${bucket.color}`}>
                                {bucket.label}
                              </div>
                              <div className="text-[9px] text-[#9aa0a6]">({bucket.tasks.length})</div>
                            </div>
                            {bucket.tasks.map((task) => {
                              const assignee = userList?.find((u: any) => u._id === task.assignedTo);
                              const owner_ = userList?.find((u: any) => u._id === task.ownerId);
                              return (
                                <div
                                  key={task._id}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa] transition-colors group border border-transparent hover:border-[#e8eaed]"
                                >
                                  <Checkbox
                                    checked={task.status === "completed"}
                                    onCheckedChange={() => handleToggleTask(task._id, task.status)}
                                    className="h-4 w-4"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[12px] font-medium ${
                                        task.status === "completed" ? "line-through text-[#9aa0a6]" : "text-[#1a1a2e]"
                                      }`}>
                                        {task.title}
                                      </span>
                                      <Badge className={`text-[8px] px-1 py-0 h-3.5 ${priorityBadge[task.priority] || priorityBadge.medium}`}>
                                        {task.priority}
                                      </Badge>
                                      <Badge className={`text-[8px] px-1 py-0 h-3.5 ${statusBadge[task.status] || statusBadge.pending}`}>
                                        {statusLabel[task.status] || task.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {assignee && (
                                        <div className="flex items-center gap-1">
                                          <Avatar className="h-4 w-4">
                                            <AvatarFallback className="text-[6px] bg-[#f1f3f4] text-[#5f6368]">
                                              {assignee.name?.[0] || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-[10px] text-[#5f6368]">
                                            {assignee.name?.split(" ")[0]}
                                          </span>
                                        </div>
                                      )}
                                      {owner_ && !assignee && (
                                        <div className="flex items-center gap-1">
                                          <Avatar className="h-4 w-4">
                                            <AvatarFallback className="text-[6px] bg-[#f1f3f4] text-[#5f6368]">
                                              {owner_.name?.[0] || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-[10px] text-[#5f6368]">
                                            {owner_.name?.split(" ")[0]}
                                          </span>
                                        </div>
                                      )}
                                      {task.dueDate && (
                                        <span className={`text-[10px] ${
                                          task.dueDate < Date.now() ? "text-[#ea4335]" : "text-[#9aa0a6]"
                                        }`}>
                                          <Calendar className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Quick actions */}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="h-6 w-6 text-[#5f6368]"
                                      onClick={() => navigate(`/crm/leads/${lead._id}`)}
                                      title="Open Lead"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="h-6 w-6 text-[#25D366]"
                                      title="Send WhatsApp"
                                      onClick={() => {
                                        const phone = (lead.phone || "").replace(/[^0-9]/g, "");
                                        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent("Hi! Following up on your pending task: " + task.title)}`, "_blank");
                                      }}
                                    >
                                      <MessageCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="h-6 w-6 text-[#5f6368]"
                                      title="Schedule Followup"
                                      onClick={() => {
                                        navigate(`/crm/leads/${lead._id}`);
                                      }}
                                    >
                                      <Bell className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="h-6 w-6 text-[#5f6368]"
                                      title="Add Task"
                                      onClick={() => { setCreateLeadId(lead._id); setShowCreateTask(true); }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      );
                    })()}
                  </div>

                  {/* Bottom actions for this lead group */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#f1f3f4]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-[#1a73e8] hover:bg-[#e8f0fe]"
                      onClick={() => navigate(`/crm/leads/${lead._id}`)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Open Lead
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-[#5f6368] hover:bg-[#f1f3f4]"
                      onClick={() => { setCreateLeadId(lead._id); setShowCreateTask(true); }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Create Task
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Create Task Dialog */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowCreateTask(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#1a1a2e]">
                {createLeadId ? "Create Task for Lead" : "Create New Task"}
              </p>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-[#5f6368]" onClick={() => setShowCreateTask(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-[#5f6368] font-medium">Task Title *</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="h-8 text-[12px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#5f6368] font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="h-8 text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#5f6368] font-medium">Priority</label>
                  <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                    <SelectTrigger className="h-8 text-[12px]">
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
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                onClick={handleCreateTask}
                disabled={creating || !newTaskTitle}
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Create Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
