import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileCheck,
  CalendarRange,
  GraduationCap,
  Trophy,
  ClipboardList,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Users,
  BarChart3,
  ListChecks,
  Percent,
  Award,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

type ExamStatus = "draft" | "scheduled" | "in_progress" | "completed" | "published" | "archived";

const statusConfig: Record<ExamStatus, { label: string; variant: "outline" | "default" | "secondary" | "destructive" | "success" }> = {
  draft: { label: "Draft", variant: "outline" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "outline" },
};

const examTypeLabels: Record<string, string> = {
  unit_test: "Unit Test",
  weekly_test: "Weekly Test",
  monthly_test: "Monthly Test",
  mid_term: "Mid Term",
  final_exam: "Final Exam",
  practical: "Practical",
  viva: "Viva",
  mock_test: "Mock Test",
  custom: "Custom",
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="border border-border/40 hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <ArrowUpRight className={`h-3 w-3 ${trend.positive ? "text-emerald-500" : "text-red-500"}`} />
            <span className={trend.positive ? "text-emerald-500" : "text-red-500"}>
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExamDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = useQuery(api.examEngine.getExamDashboardStats);
  const examTemplates = useQuery(api.examEngine.listExamTemplates, { activeOnly: true });
  const examSessions = useQuery(api.examEngine.listExamSessions, {});

  const createTemplate = useMutation(api.examEngine.createExamTemplate);
  const createSession = useMutation(api.examEngine.createExamSession);

  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    code: "",
    examType: "unit_test" as const,
    maxMarks: 100,
    passPercentage: 33,
    duration: 180,
  });

  const [creatingSession, setCreatingSession] = useState(false);
  const [newSession, setNewSession] = useState({
    templateId: "" as any,
    academicSessionId: "" as any,
    branchId: "" as any,
    name: "",
    startDate: Date.now(),
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.code) return;
    setCreatingTemplate(true);
    try {
      await createTemplate({
        ...newTemplate,
        maxMarks: newTemplate.maxMarks,
        passPercentage: newTemplate.passPercentage,
        duration: newTemplate.duration,
      });
      setNewTemplate({ name: "", code: "", examType: "unit_test", maxMarks: 100, passPercentage: 33, duration: 180 });
    } finally {
      setCreatingTemplate(false);
    }
  };

  if (!stats || !examTemplates || !examSessions) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const upcomingSessions = examSessions.filter(
    (s) => s.status === "scheduled" || s.status === "in_progress",
  );
  const recentSessions = examSessions.slice(0, 5);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Examinations</h1>
          <p className="text-muted-foreground mt-1">
            Manage exam templates, sessions, and results
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={FileCheck}
          description="All exam sessions"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcoming}
          icon={CalendarRange}
          description="Scheduled or in progress"
          trend={{ value: `${stats.upcoming} active`, positive: stats.upcoming > 0 }}
        />
        <StatCard
          title="Published Results"
          value={stats.published}
          icon={Trophy}
          description="Results available"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          description="Marking completed"
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          description="Enrolled across sessions"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Upcoming Exams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Upcoming Exams
                </CardTitle>
                <CardDescription>
                  Scheduled and ongoing exam sessions
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarRange className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming exams</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusConfig[session.status as ExamStatus]?.variant || "outline"}>
                        {statusConfig[session.status as ExamStatus]?.label || session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Recent Sessions
              </CardTitle>
              <CardDescription>Latest exam activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No exam sessions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/40"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.startDate).toLocaleDateString()}
                            {session.totalStudents && ` · ${session.totalStudents} students`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusConfig[session.status as ExamStatus]?.variant || "outline"}>
                        {statusConfig[session.status as ExamStatus]?.label || session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exam Sessions</h2>
            <Button onClick={() => setCreatingSession(true)} disabled={examTemplates.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>

          {examSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarRange className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-1">No exam sessions</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create exam templates first, then schedule sessions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examSessions.map((session) => (
                <Card key={session._id} className="hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{session.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {new Date(session.startDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={statusConfig[session.status as ExamStatus]?.variant || "outline"}>
                        {statusConfig[session.status as ExamStatus]?.label || session.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {session.totalStudents && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {session.totalStudents}
                        </span>
                      )}
                      {session.coordinatorId && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Coordinator assigned
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exam Templates</h2>
            <Button onClick={() => setCreatingTemplate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {creatingTemplate && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Create Exam Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., Mid Term Exam 2025"
                      value={newTemplate.name}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Code</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g., MT-2025"
                      value={newTemplate.code}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, code: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exam Type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newTemplate.examType}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          examType: e.target.value as any,
                        })
                      }
                    >
                      {Object.entries(examTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Marks</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newTemplate.maxMarks}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          maxMarks: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pass Percentage</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newTemplate.passPercentage}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          passPercentage: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newTemplate.duration}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateTemplate} disabled={creatingTemplate}>
                    {creatingTemplate ? "Creating..." : "Create Template"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCreatingTemplate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examTemplates.map((template) => (
              <Card
                key={template._id}
                className="hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.code}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="secondary" className="text-xs">
                        {examTypeLabels[template.examType] || template.examType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Max Marks</span>
                      <span className="font-medium">{template.maxMarks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pass %</span>
                      <span className="font-medium">{template.passPercentage}%</span>
                    </div>
                    {template.duration && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{template.duration} min</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Published Results
              </CardTitle>
              <CardDescription>
                Sessions with published results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {examSessions.filter((s) => s.status === "published").length ===
              0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No published results yet</p>
                  <p className="text-xs mt-1">
                    Complete exam sessions and calculate results
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examSessions
                    .filter((s) => s.status === "published")
                    .map((session) => (
                      <div
                        key={session._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/40"
                      >
                        <div>
                          <p className="font-medium text-sm">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.totalStudents} students
                          </p>
                        </div>
                        <Badge variant="success">Published</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
