import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { WorkspaceShell } from "@/components/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileCheck, CalendarRange, BookOpen, Users, Clock, Trophy,
  AlertCircle, ClipboardList, UserCheck, GraduationCap, BarChart3,
  FileText, CheckCircle2, XCircle, MapPin, ChevronRight, Percent,
  Award, TrendingUp, ListChecks,
} from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500" },
  scheduled: { label: "Scheduled", color: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-amber-500" },
  completed: { label: "Completed", color: "bg-emerald-500" },
  published: { label: "Published", color: "bg-purple-500" },
  archived: { label: "Archived", color: "bg-gray-400" },
};

const examTypeLabels: Record<string, string> = {
  unit_test: "Unit Test", weekly_test: "Weekly Test", monthly_test: "Monthly Test",
  mid_term: "Mid Term", final_exam: "Final Exam", practical: "Practical",
  viva: "Viva", mock_test: "Mock Test", custom: "Custom",
};

function StatCard({ title, value, icon: Icon, subtitle, color }: any) {
  return (
    <Card className="border-border/40 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value ?? "—"}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color || "bg-primary/10"}`}>
            <Icon className={`h-4 w-4 ${color ? "text-white" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExamSessionWorkspace() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const sessionDetail = useQuery(api.examEngine.getExamSessionDetail, { id: sessionId as Id<"examSessions"> });
  const sessionMarks = useQuery(api.marksEngine.listExamMarks, { examSessionId: sessionId as Id<"examSessions"> });
  const resultStats = useQuery(api.resultEngine.getResultStats, { examSessionId: sessionId as Id<"examSessions"> });
  const subjectAnalysis = useQuery(api.examEnterpriseAnalytics.getSubjectPerformanceAnalytics, { examSessionId: sessionId as Id<"examSessions"> });
  const gradeDist = useQuery(api.examEnterpriseAnalytics.getGradeDistribution, { examSessionId: sessionId as Id<"examSessions"> });
  const timeline = useQuery(api.examEngine.getExamTimeline, { examSessionId: sessionId as Id<"examSessions"> });

  const updateStatus = useMutation(api.examEngine.updateExamSessionStatus);
  const calculateResults = useMutation(api.resultEngine.calculateResults);
  const publishResults = useMutation(api.resultEngine.publishResults);

  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  if (!sessionDetail && !sessionId) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!sessionDetail) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium">Exam session not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/examinations")}>Back to Examinations</Button>
      </div>
    );
  }

  const { session, template, stats } = sessionDetail;
  const isLoading = !sessionDetail;

  const handleStatusChange = async (status: string) => {
    setStatusLoading(status);
    try {
      await updateStatus({ id: session._id, status: status as any });
    } finally {
      setStatusLoading(null);
    }
  };

  const overviewFields = [
    { label: "Template", value: template?.name || "—" },
    { label: "Type", value: template ? examTypeLabels[template.examType] || template.examType : "—" },
    { label: "Start Date", value: new Date(session.startDate).toLocaleDateString() },
    { label: "Duration", value: template?.duration ? `${template.duration} min` : "—" },
    { label: "Max Marks", value: template?.maxMarks ?? "—" },
    { label: "Pass %", value: template?.passPercentage ? `${template.passPercentage}%` : "—" },
    { label: "Total Students", value: session.totalStudents ?? "—" },
    { label: "Total Subjects", value: stats?.totalSubjects ?? "—" },
  ];

  const headerBadge = session ? statusConfig[session.status] || { label: session.status, color: "bg-gray-500" } : { label: "Unknown", color: "bg-gray-400" };

  const tabs = [
    {
      id: "overview", label: "Overview", icon: FileCheck,
      component: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="Subjects" value={stats?.totalSubjects ?? 0} icon={BookOpen} color="bg-blue-500" subtitle="Across session" />
            <StatCard title="Timetable Entries" value={stats?.totalTimetable ?? 0} icon={CalendarRange} color="bg-purple-500" subtitle="Scheduled" />
            <StatCard title="Marks Submitted" value={stats?.marksSubmitted ?? 0} icon={ClipboardList} color="bg-amber-500" subtitle={`${stats?.totalSubjects ?? 0} subjects`} />
            <StatCard title="Pass %" value={stats?.passPercent != null ? `${stats.passPercent}%` : "—"} icon={Percent} color="bg-emerald-500" subtitle={stats?.passed != null ? `${stats.passed} passed` : undefined} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {overviewFields.map((f) => (
                  <div key={f.label} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium">{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                {session.status === "draft" && (
                  <Button size="sm" onClick={() => handleStatusChange("scheduled")} disabled={statusLoading === "scheduled"}>
                    <CalendarRange className="h-3.5 w-3.5 mr-1" /> Schedule
                  </Button>
                )}
                {session.status === "scheduled" && (
                  <Button size="sm" onClick={() => handleStatusChange("in_progress")} disabled={statusLoading === "in_progress"}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Start Exam
                  </Button>
                )}
                {(session.status === "in_progress") && (
                  <Button size="sm" onClick={() => handleStatusChange("completed")} disabled={statusLoading === "completed"}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Complete
                  </Button>
                )}
                {session.status === "completed" && (
                  <Button size="sm" onClick={() => calculateResults({ examSessionId: session._id })}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1" /> Calculate Results
                  </Button>
                )}
                {session.status === "published" && (
                  <Badge variant="outline" className="text-xs">Results Published</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "subjects", label: "Subjects", icon: BookOpen,
      component: () => (
        <div className="space-y-4">
          {!sessionDetail?.subjects?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No subjects added yet</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {sessionDetail.subjects.map((subj) => (
                <Card key={subj._id} className="hover:shadow-sm transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{subj.subjectId}</p>
                        <p className="text-xs text-muted-foreground">Max: {subj.maxMarks} | Pass: {subj.passPercentage ?? 33}%</p>
                      </div>
                    </div>
                    <Badge variant="outline">{subj.isCompulsory ? "Compulsory" : "Optional"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "timetable", label: "Timetable", icon: CalendarRange,
      component: () => (
        <div className="space-y-4">
          {!sessionDetail?.timetable?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No timetable entries</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {sessionDetail.timetable.map((entry) => (
                <Card key={entry._id} className="hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="h-3.5 w-3.5 text-primary" />
                          <p className="text-sm font-medium">{new Date(entry.examDate).toLocaleDateString()}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {entry.duration && ` · ${entry.duration} min`}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Max: {entry.maxMarks}</p>
                        {entry.hallCapacity && <p>Capacity: {entry.hallCapacity}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "marks", label: "Marks Entry", icon: ClipboardList,
      component: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard title="Total Entries" value={sessionMarks?.length ?? 0} icon={ClipboardList} color="bg-blue-500" />
            <StatCard title="Present" value={sessionMarks?.filter(m => m.attendance === "present").length ?? 0} icon={UserCheck} color="bg-emerald-500" />
            <StatCard title="Absent" value={sessionMarks?.filter(m => m.attendance === "absent").length ?? 0} icon={XCircle} color="bg-red-500" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Marks Entries</CardTitle></CardHeader>
            <CardContent>
              {!sessionMarks?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">No marks entered yet</p>
              ) : (
                <div className="space-y-2">
                  {sessionMarks.slice(0, 20).map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={m.attendance === "present" ? "success" : m.attendance === "absent" ? "destructive" : "secondary"} className="text-[10px]">
                          {m.attendance}
                        </Badge>
                        <span className="text-muted-foreground">#{String(m.studentId).slice(-6)}</span>
                      </div>
                      <span>{m.marksObtained != null ? `${m.marksObtained}/${m.totalMarks}` : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "results", label: "Results", icon: Trophy,
      component: () => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="Total Results" value={resultStats?.total ?? 0} icon={GraduationCap} color="bg-blue-500" />
            <StatCard title="Passed" value={resultStats?.passed ?? 0} icon={CheckCircle2} color="bg-emerald-500" subtitle={`${resultStats?.passPercentage ?? 0}%`} />
            <StatCard title="Failed" value={resultStats?.failed ?? 0} icon={XCircle} color="bg-red-500" />
            <StatCard title="Supplementary" value={resultStats?.supplementary ?? 0} icon={AlertCircle} color="bg-amber-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Division Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Distinction", count: resultStats?.withDistinction ?? 0, color: "bg-purple-500" },
                  { label: "First Division", count: resultStats?.firstDivision ?? 0, color: "bg-emerald-500" },
                  { label: "Second Division", count: resultStats?.secondDivision ?? 0, color: "bg-blue-500" },
                  { label: "Third Division", count: resultStats?.thirdDivision ?? 0, color: "bg-amber-500" },
                  { label: "Fail", count: resultStats?.failed ?? 0, color: "bg-red-500" },
                ].filter((d) => d.count > 0).map((d) => (
                  <div key={d.label} className="flex items-center justify-between p-2 rounded-lg bg-accent/30 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${d.color}`} />
                      <span>{d.label}</span>
                    </div>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Subject-wise Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {!subjectAnalysis?.subjects?.length ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  subjectAnalysis.subjects.slice(0, 10).map((s: any) => (
                    <div key={s.subjectId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{s.subjectName}</span>
                        <span className="text-xs text-muted-foreground">{s.passPercentage}% pass</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.passPercentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {session.status === "completed" && (
              <Button onClick={() => calculateResults({ examSessionId: session._id })}>
                <BarChart3 className="h-3.5 w-3.5 mr-1" /> Calculate Results
              </Button>
            )}
            {session.status !== "published" && resultStats && resultStats.total > 0 && (
              <Button onClick={() => publishResults({ examSessionId: session._id })}>
                <Trophy className="h-3.5 w-3.5 mr-1" /> Publish Results
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "incidents", label: "Incidents", icon: AlertCircle,
      component: () => {
        const incidents = useQuery(api.examIncidentEngine.listIncidents, { examSessionId: sessionId as Id<"examSessions"> });
        const incidentStats = useQuery(api.examIncidentEngine.getIncidentStats, { examSessionId: sessionId as Id<"examSessions"> });

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Total" value={incidentStats?.total ?? 0} icon={AlertCircle} color="bg-red-500" />
              <StatCard title="Open" value={incidentStats?.open ?? 0} icon={AlertCircle} color="bg-amber-500" />
              <StatCard title="Resolved" value={incidentStats?.resolved ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title="Critical" value={incidentStats?.bySeverity?.critical ?? 0} icon={AlertCircle} color="bg-red-700" />
            </div>
            {!incidents?.length ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No incidents reported</CardContent></Card>
            ) : (
              incidents.map((inc: any) => (
                <Card key={inc._id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={inc.severity === "critical" || inc.severity === "high" ? "destructive" : "secondary"} className="text-[10px]">{inc.severity}</Badge>
                          <p className="text-sm font-medium capitalize">{inc.incidentType.replace(/_/g, " ")}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{inc.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
      },
    },
    {
      id: "timeline", label: "Timeline", icon: Clock,
      component: () => (
        <Card>
          <CardHeader><CardTitle className="text-sm">Session Timeline</CardTitle></CardHeader>
          <CardContent>
            {!timeline?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No timeline events</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((event: any) => (
                  <div key={event._id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{event.description || event.eventType.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/examinations")}>
          ← Examinations
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className={`h-3 w-3 rounded-full ${headerBadge.color}`} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{session?.name || "Exam Session"}</h1>
          <p className="text-sm text-muted-foreground">
            {template?.name} · {new Date(session?.startDate ?? Date.now()).toLocaleDateString()}
            {session?.totalStudents && ` · ${session.totalStudents} students`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard title="Subjects" value={stats?.totalSubjects ?? 0} icon={BookOpen} color="bg-blue-500/10" />
        <StatCard title="Timetable" value={stats?.totalTimetable ?? 0} icon={CalendarRange} color="bg-purple-500/10" />
        <StatCard title="Marks In" value={stats?.marksSubmitted ?? 0} icon={ClipboardList} color="bg-amber-500/10" />
        <StatCard title="Results" value={stats?.resultsCalculated ?? 0} icon={BarChart3} color="bg-emerald-500/10" />
        <StatCard title="Pass %" value={stats?.passPercent != null ? `${stats.passPercent}%` : "—"} icon={Percent} color="bg-green-500/10" subtitle={stats?.passed != null ? `${stats.passed} passed` : undefined} />
        <StatCard title="Status" value={statusConfig[session?.status]?.label || session?.status || "—"} icon={FileCheck} color="bg-gray-500/10" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-accent/50 p-0.5 overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="text-xs"><FileCheck className="h-3.5 w-3.5 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="subjects" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" /> Subjects</TabsTrigger>
          <TabsTrigger value="timetable" className="text-xs"><CalendarRange className="h-3.5 w-3.5 mr-1" /> Timetable</TabsTrigger>
          <TabsTrigger value="marks" className="text-xs"><ClipboardList className="h-3.5 w-3.5 mr-1" /> Marks</TabsTrigger>
          <TabsTrigger value="results" className="text-xs"><Trophy className="h-3.5 w-3.5 mr-1" /> Results</TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs"><AlertCircle className="h-3.5 w-3.5 mr-1" /> Incidents</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs"><Clock className="h-3.5 w-3.5 mr-1" /> Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {overviewFields.map((f) => (
                    <div key={f.label} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium">{f.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border/40">
                  {session.status === "draft" && (
                    <Button size="sm" onClick={() => handleStatusChange("scheduled")} disabled={statusLoading === "scheduled"}>
                      <CalendarRange className="h-3.5 w-3.5 mr-1" /> Schedule
                    </Button>
                  )}
                  {session.status === "scheduled" && (
                    <Button size="sm" onClick={() => handleStatusChange("in_progress")} disabled={statusLoading === "in_progress"}>
                      <Play className="h-3.5 w-3.5 mr-1" /> Start Exam
                    </Button>
                  )}
                  {session.status === "in_progress" && (
                    <Button size="sm" onClick={() => handleStatusChange("completed")} disabled={statusLoading === "completed"}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Complete
                    </Button>
                  )}
                  {session.status === "completed" && (
                    <Button size="sm" onClick={() => calculateResults({ examSessionId: session._id })}>
                      <BarChart3 className="h-3.5 w-3.5 mr-1" /> Calculate Results
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          {!sessionDetail?.subjects?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No subjects added yet</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sessionDetail.subjects.map((subj) => (
                <Card key={subj._id} className="hover:shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{subj.subjectId}</p>
                        <p className="text-xs text-muted-foreground">Max: {subj.maxMarks} | Pass: {subj.passPercentage ?? 33}%</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{subj.isCompulsory ? "Compulsory" : "Optional"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timetable">
          {!sessionDetail?.timetable?.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No timetable entries</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {sessionDetail.timetable.map((entry) => (
                <Card key={entry._id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="h-3.5 w-3.5 text-primary" />
                          <p className="text-sm font-medium">{new Date(entry.examDate).toLocaleDateString()}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {entry.duration && ` · ${entry.duration} min`}
                        </p>
                        {entry.facultyId && <p className="text-xs text-muted-foreground">Faculty assigned</p>}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Max: {entry.maxMarks}</p>
                        {entry.hallCapacity && <p>Capacity: {entry.hallCapacity}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marks">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard title="Total Entries" value={sessionMarks?.length ?? 0} icon={ClipboardList} color="bg-blue-500/10" />
            <StatCard title="Present" value={sessionMarks?.filter(m => m.attendance === "present").length ?? 0} icon={UserCheck} color="bg-emerald-500/10" />
            <StatCard title="Absent" value={sessionMarks?.filter(m => m.attendance === "absent").length ?? 0} icon={XCircle} color="bg-red-500/10" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Marks Entries</CardTitle></CardHeader>
            <CardContent>
              {!sessionMarks?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No marks entered yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sessionMarks.map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 text-sm hover:bg-accent/30">
                      <div className="flex items-center gap-2">
                        <Badge variant={m.attendance === "present" ? "success" : m.attendance === "absent" ? "destructive" : "secondary"} className="text-[10px]">
                          {m.attendance}
                        </Badge>
                        <span className="text-muted-foreground">ID: #{String(m.studentId).slice(-6)}</span>
                        {m.moderatedMarks != null && <Badge variant="outline" className="text-[10px]">Moderated</Badge>}
                      </div>
                      <span className="font-medium">{m.marksObtained != null ? `${m.marksObtained}/${m.totalMarks}` : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard title="Total Results" value={resultStats?.total ?? 0} icon={GraduationCap} color="bg-blue-500/10" />
            <StatCard title="Passed" value={resultStats?.passed ?? 0} icon={CheckCircle2} color="bg-emerald-500/10" subtitle={`${resultStats?.passPercentage ?? 0}%`} />
            <StatCard title="Failed" value={resultStats?.failed ?? 0} icon={XCircle} color="bg-red-500/10" />
            <StatCard title="Supplementary" value={resultStats?.supplementary ?? 0} icon={AlertCircle} color="bg-amber-500/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Division Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Distinction", count: resultStats?.withDistinction ?? 0, color: "bg-purple-500" },
                  { label: "First Division", count: resultStats?.firstDivision ?? 0, color: "bg-emerald-500" },
                  { label: "Second Division", count: resultStats?.secondDivision ?? 0, color: "bg-blue-500" },
                  { label: "Third Division", count: resultStats?.thirdDivision ?? 0, color: "bg-amber-500" },
                  { label: "Fail", count: resultStats?.failed ?? 0, color: "bg-red-500" },
                ].filter((d) => d.count > 0).map((d) => {
                  const pct = resultStats?.total ? Math.round((d.count / resultStats.total) * 100) : 0;
                  return (
                    <div key={d.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${d.color}`} />
                          <span>{d.label}</span>
                        </div>
                        <span className="font-medium">{d.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Subject-wise Pass %</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!subjectAnalysis?.subjects?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  subjectAnalysis.subjects.slice(0, 10).map((s: any) => (
                    <div key={s.subjectId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{typeof s.subjectName === 'string' ? s.subjectName : `Subject ${String(s.subjectId).slice(-4)}`}</span>
                        <span className="text-xs text-muted-foreground">{s.passPercentage}%</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${s.passPercentage}%`,
                            backgroundColor: s.passPercentage >= 60 ? '#22c55e' : s.passPercentage >= 33 ? '#eab308' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {session.status === "completed" && (
              <Button onClick={() => calculateResults({ examSessionId: session._id })}>
                <BarChart3 className="h-3.5 w-3.5 mr-1" /> Calculate Results
              </Button>
            )}
            {session.status !== "published" && resultStats && resultStats.total > 0 && (
              <Button onClick={() => publishResults({ examSessionId: session._id })}>
                <Trophy className="h-3.5 w-3.5 mr-1" /> Publish Results
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          {(() => {
            const incidents = null; // Already declared at top level via useQuery
            const incStats = sessionDetail?.stats; // Use available stats
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard title="Total Incidents" value="—" icon={AlertCircle} color="bg-red-500/10" />
                  <StatCard title="Reported" value="—" icon={AlertCircle} color="bg-amber-500/10" />
                  <StatCard title="Under Review" value="—" icon={AlertCircle} color="bg-blue-500/10" />
                  <StatCard title="Resolved" value="—" icon={CheckCircle2} color="bg-emerald-500/10" />
                </div>
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Incident reporting workspace</p>
                  <p className="text-xs mt-1">Use the exam incident engine to manage and track incidents</p>
                </CardContent></Card>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle className="text-sm">Session Timeline</CardTitle></CardHeader>
            <CardContent>
              {!timeline?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No timeline events recorded</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event: any, idx: number) => (
                    <div key={event._id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                        {idx < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <p className="text-sm font-medium capitalize">{event.description || event.eventType.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
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

function Play(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
