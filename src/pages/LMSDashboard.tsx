import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  BookOpen,
  GraduationCap,
  FileText,
  Video,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  PlayCircle,
  PlusCircle,
  RefreshCw,
  Library,
  PenTool,
  Award,
  MessageSquare,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LMSDashboard() {
  const { navigate } = useAppNavigate();
  const dashboard = useQuery(api.lmsEngine.getLMSDashboard);

  const isLoading = !dashboard;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Learning Management System</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Course library, lessons, assignments & student progress tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Course
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="courses" className="text-[12px] data-[state=active]:bg-white">Courses</TabsTrigger>
          <TabsTrigger value="faculty" className="text-[12px] data-[state=active]:bg-white">Faculty</TabsTrigger>
          <TabsTrigger value="students" className="text-[12px] data-[state=active]:bg-white">Students</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════
           OVERVIEW TAB
           ════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Courses"
              value={dashboard.totalCourses}
              subtitle={`${dashboard.publishedCourses} published, ${dashboard.draftCourses} draft`}
              icon={BookOpen}
              color="bg-[#1a73e8]"
            />
            <StatCard
              title="Total Lessons"
              value={dashboard.totalLessons}
              subtitle={`${dashboard.publishedLessons} published`}
              icon={Video}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Student Enrollments"
              value={dashboard.totalEnrolled}
              subtitle={`${dashboard.completedCourses} completed`}
              icon={Users}
              color="bg-[#a855f7]"
            />
            <StatCard
              title="Completion Rate"
              value={`${dashboard.completionRate}%`}
              subtitle={`${dashboard.inProgress} in progress`}
              icon={TrendingUp}
              color="bg-[#fbbc04]"
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <Library className="h-4 w-4 text-[#1a73e8]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Course Library</span>
              <span className="text-[9px] text-[#9aa0a6]">Browse all courses</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <PenTool className="h-4 w-4 text-[#34a853]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Create Lesson</span>
              <span className="text-[9px] text-[#9aa0a6]">Add new lesson content</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <ClipboardList className="h-4 w-4 text-[#fbbc04]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Assignments</span>
              <span className="text-[9px] text-[#9aa0a6]">Create & evaluate</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <GraduationCap className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Certificates</span>
              <span className="text-[9px] text-[#9aa0a6]">Issue & manage</span>
            </Button>
          </div>

          {/* Stats details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Course Status</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">Published vs draft breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Published", count: dashboard.publishedCourses, total: dashboard.totalCourses, color: "bg-[#34a853]", bg: "bg-[#e6f4ea]" },
                    { label: "Draft", count: dashboard.draftCourses, total: dashboard.totalCourses, color: "bg-[#fbbc04]", bg: "bg-[#fef7e0]" },
                  ].map((item) => {
                    const pct = item.total > 0 ? (item.count / item.total) * 100 : 0;
                    return (
                      <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-[11px] font-medium text-[#1a1a2e]">{item.label}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-[#1a1a2e]">{item.count}</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Enrollment Status</CardTitle>
                <CardDescription className="text-[10px] text-[#9aa0a6]">Student progress overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Completed", count: dashboard.completedCourses, total: dashboard.totalEnrolled, color: "bg-[#34a853]", bg: "bg-[#e6f4ea]" },
                    { label: "In Progress", count: dashboard.inProgress, total: dashboard.totalEnrolled, color: "bg-[#1a73e8]", bg: "bg-[#e8f0fe]" },
                  ].map((item) => {
                    const pct = item.total > 0 ? (item.count / item.total) * 100 : 0;
                    return (
                      <div key={item.label} className={`p-3 rounded-lg ${item.bg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-[11px] font-medium text-[#1a1a2e]">{item.label}</span>
                          </div>
                          <span className="text-[12px] font-semibold text-[#1a1a2e]">{item.count}</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
           COURSES TAB
           ════════════════════════════════════════ */}
        <TabsContent value="courses" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard title="Total Courses" value={dashboard.totalCourses} icon={BookOpen} color="bg-[#1a73e8]" />
            <StatCard title="Published" value={dashboard.publishedCourses} icon={CheckCircle2} color="bg-[#34a853]" />
            <StatCard title="Draft" value={dashboard.draftCourses} icon={Clock} color="bg-[#fbbc04]" />
            <StatCard title="Total Lessons" value={dashboard.totalLessons} icon={Video} color="bg-[#a855f7]" />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Library className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Course Library</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Manage your full course catalog — create, publish, and organize learning content
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Create Course
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <BarChart3 className="h-3.5 w-3.5 mr-1" /> Browse All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           FACULTY TAB
           ════════════════════════════════════════ */}
        <TabsContent value="faculty" className="space-y-4 mt-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Users className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Faculty Workspace</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Faculty dashboard — upload content, schedule lessons, create assignments, and evaluate submissions
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <PlayCircle className="h-3.5 w-3.5 mr-1" /> Upload Content
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <ClipboardList className="h-3.5 w-3.5 mr-1" /> Pending Evaluations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           STUDENTS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard title="Total Enrollments" value={dashboard.totalEnrolled} icon={Users} color="bg-[#1a73e8]" />
            <StatCard title="Completed" value={dashboard.completedCourses} subtitle={`${dashboard.completionRate}% completion rate`} icon={Award} color="bg-[#34a853]" />
            <StatCard title="In Progress" value={dashboard.inProgress} icon={TrendingUp} color="bg-[#a855f7]" />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <GraduationCap className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Student Portal</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Students can track progress, submit assignments, take quizzes, and view completion status
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <BarChart3 className="h-3.5 w-3.5 mr-1" /> View Progress
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> Discussions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
