import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  Users,
  ClipboardList,
  CheckSquare,
  Bell,
  AlertCircle,
  TrendingUp,
  Building2,
  Layers,
  GitBranch,
  LayoutDashboard,
  UserPlus,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "bg-[#9aa0a6]" },
  todo: { label: "To Do", color: "bg-[#4285f4]" },
  in_progress: { label: "In Progress", color: "bg-[#fbbc04]" },
  review: { label: "Review", color: "bg-[#a855f7]" },
  done: { label: "Done", color: "bg-[#34a853]" },
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {description && (
              <p className="text-[11px] text-[#9aa0a6]">{description}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color || "bg-[#f1f3f4]"}`}>
            <Icon className={`h-4 w-4 ${color ? "text-white" : "text-[#5f6368]"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const dashboardData = useQuery(api.dashboard.getDashboardData, user ? { userId: user._id } : "skip");

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    backlog: "bg-[#9aa0a6]",
    todo: "bg-[#4285f4]",
    in_progress: "bg-[#fbbc04]",
    review: "bg-[#a855f7]",
    done: "bg-[#34a853]",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">
            Welcome back, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Here's what's happening across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-medium text-[#5f6368] border-[#e8eaed] capitalize">
            {user?.role?.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Active Users"
          value={dashboardData.activeUsers}
          icon={Users}
          color="bg-[#1a73e8]"
          description={`${dashboardData.disabledUsers} disabled`}
          onClick={() => navigate("/users")}
        />
        <StatCard
          title="Total Tasks"
          value={dashboardData.totalTasks}
          icon={ClipboardList}
          color="bg-[#34a853]"
          description={`${dashboardData.overdueTasks} overdue`}
          onClick={() => navigate("/tasks")}
        />
        <StatCard
          title="Pending Approvals"
          value={dashboardData.pendingApprovals}
          icon={CheckSquare}
          color="bg-[#fbbc04]"
          description={`${dashboardData.myPendingApprovals} mine`}
          onClick={() => navigate("/approvals")}
        />
        <StatCard
          title="Notifications"
          value={dashboardData.notificationCount}
          icon={Bell}
          color="bg-[#ea4335]"
          onClick={() => navigate("/notifications")}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Departments"
          value={dashboardData.departmentsCount}
          icon={Building2}
          color="bg-[#5f6368]"
          onClick={() => navigate("/org")}
        />
        <StatCard
          title="Teams"
          value={dashboardData.teamsCount}
          icon={Layers}
          color="bg-[#ab47bc]"
          onClick={() => navigate("/org")}
        />
        <StatCard
          title="Branches"
          value={dashboardData.branchesCount}
          icon={GitBranch}
          color="bg-[#00acc1]"
          onClick={() => navigate("/org")}
        />
        <StatCard
          title="My Tasks"
          value={dashboardData.myAssignedTasks + dashboardData.myOwnedTasks}
          icon={TrendingUp}
          color="bg-[#6d4c41]"
          onClick={() => navigate("/tasks")}
        />
      </div>

      {/* Task Status Distribution */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 h-2.5 rounded-full overflow-hidden bg-[#f1f3f4]">
            {Object.entries(dashboardData.tasksByStatus as Record<string, number>).map(([status, count]) => {
              const total = dashboardData.totalTasks || 1;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={status}
                  className={`h-full transition-all duration-500 ${statusColors[status] || "bg-[#9aa0a6]"}`}
                  style={{ width: `${pct}%` }}
                  title={`${statusConfig[status]?.label || status}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(dashboardData.tasksByStatus as Record<string, number>).map(([status, count]) => {
              const config = statusConfig[status] || { label: status, color: "bg-[#9aa0a6]" };
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${statusColors[status] || "bg-[#9aa0a6]"}`} />
                  <span className="text-[11px] text-[#5f6368]">
                    {config.label} <span className="font-medium text-[#1a1a2e]">({count})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Recent Activity</CardTitle>
              <CardDescription className="text-[11px] text-[#9aa0a6]">Latest task comments</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-[13px] text-[#9aa0a6] text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {dashboardData.recentActivity.slice(0, 5).map((comment) => (
                  <div key={comment._id} className="flex items-start gap-2 p-2 rounded-md hover:bg-[#f8f9fa] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9aa0a6] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#5f6368] line-clamp-1">{comment.content}</p>
                      <p className="text-[10px] text-[#9aa0a6]">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Quick Actions</CardTitle>
            <CardDescription className="text-[11px] text-[#9aa0a6]">Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
                onClick={() => navigate("/tasks")}
              >
                <PlusCircle className="h-4 w-4 text-[#1a73e8]" />
                <span className="text-[12px] font-medium text-[#1a1a2e]">New Task</span>
                <span className="text-[10px] text-[#9aa0a6]">Create a task</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
                onClick={() => navigate("/users")}
              >
                <UserPlus className="h-4 w-4 text-[#34a853]" />
                <span className="text-[12px] font-medium text-[#1a1a2e]">New User</span>
                <span className="text-[10px] text-[#9aa0a6]">Add team member</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
                onClick={() => navigate("/messenger")}
              >
                <MessageSquare className="h-4 w-4 text-[#fbbc04]" />
                <span className="text-[12px] font-medium text-[#1a1a2e]">Message</span>
                <span className="text-[10px] text-[#9aa0a6]">Send a message</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]"
                onClick={() => navigate("/org")}
              >
                <Building2 className="h-4 w-4 text-[#a855f7]" />
                <span className="text-[12px] font-medium text-[#1a1a2e]">Org Structure</span>
                <span className="text-[10px] text-[#9aa0a6]">Manage teams</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Also accessible footer */}
      <div className="text-center py-4">
        <p className="text-[11px] text-[#9aa0a6]">
          EEOS Lite — Executive Enterprise Operating System
        </p>
      </div>
    </div>
  );
}
