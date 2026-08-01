import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BookOpen,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  LucideIcon,
  MessageSquare,
  UserCheck,
  ClipboardList,
  HelpCircle,
  BookMarked,
  Users,
  Loader2,
  Plus,
} from "lucide-react";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function DashboardFaculty() {
  const { user } = useAuth();
  const facultyId = (user?._id as Id<"users">) ?? undefined;

  const dashboard = useQuery(
    api.facultyEngine.getFacultyDashboard,
    facultyId ? { facultyId } : "skip",
  );
  const schedules = useQuery(
    api.facultyEngine.getFacultySchedule,
    facultyId
      ? { facultyId, startDate: Date.now() - 86400000, endDate: Date.now() + 7 * 86400000 }
      : "skip",
  );
  const homework = useQuery(
    api.facultyEngine.listHomework,
    facultyId ? { facultyId } : "skip",
  );
  const exams = useQuery(
    api.facultyEngine.listExams,
    facultyId ? { facultyId } : "skip",
  );
  const batches = useQuery(api.academicBatches.listAcademicBatches);
  const subjects = useQuery(api.academicSubjects.listAcademicSubjects);

  const createHomeworkMut = useMutation(api.facultyEngine.createHomework);
  const publishExamMut = useMutation(api.facultyEngine.publishExam);

  const [homeworkOpen, setHomeworkOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", batchId: "", subjectId: "", dueDate: "",
  });

  const todaySchedules = (schedules ?? []).filter((s: any) => {
    const d = new Date(s.start);
    return d.toDateString() === new Date().toDateString();
  });
  const todayHours = todaySchedules.reduce((sum: number, s: any) => sum + (s.end - s.start), 0) / 3600000;

  const WidgetCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "from-blue-500 to-indigo-600",
  }: {
    icon: LucideIcon;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleCreateHomework = async () => {
    if (!form.title || !form.batchId || !form.subjectId || !form.dueDate) {
      toast.error("Title, batch, subject and due date are required");
      return;
    }
    if (!facultyId) {
      toast.error("Faculty identity not resolved");
      return;
    }
    setBusy(true);
    try {
      await createHomeworkMut({
        title: form.title,
        description: form.description || "—",
        batchId: form.batchId as Id<"academicBatches">,
        subjectId: form.subjectId as Id<"academicSubjects">,
        dueDate: new Date(form.dueDate).getTime(),
        createdBy: facultyId,
      });
      toast.success("Homework assigned");
      setHomeworkOpen(false);
      setForm({ title: "", description: "", batchId: "", subjectId: "", dueDate: "" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create homework");
    } finally {
      setBusy(false);
    }
  };

  const handlePublishExam = async (exam: any) => {
    try {
      await publishExamMut({ id: exam._id });
      toast.success(`"${exam.title}" published`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to publish exam");
    }
  };

  const batchName = (id: any) => batches?.find((b: any) => b._id === id)?.name ?? "—";
  const subjectName = (id: any) => subjects?.find((s: any) => s._id === id)?.name ?? "—";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.name ? `${user.name}'s teaching overview.` : "Your teaching overview."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {dashboard ? `${dashboard.totalClasses} scheduled classes` : "Faculty"}
          </Badge>
          <Button size="sm" variant="outline" asChild>
            <a href="/messenger">
              <MessageSquare className="h-4 w-4 mr-2" /> Messages
            </a>
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WidgetCard
          icon={BookOpen}
          title="Today's Classes"
          value={dashboard ? dashboard.todayClasses : "—"}
          subtitle={`${todayHours.toFixed(1)}h today`}
          color="from-blue-500 to-indigo-600"
        />
        <WidgetCard
          icon={Users}
          title="Total Classes"
          value={dashboard ? dashboard.totalClasses : "—"}
          subtitle="Scheduled this cycle"
          color="from-emerald-500 to-teal-600"
        />
        <WidgetCard
          icon={ClipboardList}
          title="Homework Assigned"
          value={dashboard ? dashboard.pendingHomework : "—"}
          subtitle="Awaiting submission"
          color="from-amber-500 to-orange-600"
        />
        <WidgetCard
          icon={FileText}
          title="Draft Exams"
          value={dashboard ? dashboard.upcomingExams : "—"}
          subtitle={`${dashboard ? dashboard.publishedExams : 0} published`}
          color="from-rose-500 to-pink-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-4">
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed" asChild>
          <a href="/attendance">
            <UserCheck className="h-5 w-5" />
            <span className="text-xs">Mark Attendance</span>
          </a>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed" onClick={() => setHomeworkOpen(true)}>
          <ClipboardList className="h-5 w-5" />
          <span className="text-xs">Create Homework</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed" asChild>
          <a href="/examinations">
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs">Question Bank</span>
          </a>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed" asChild>
          <a href="/examinations">
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs">Create Exam</span>
          </a>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full md:grid-cols-4">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="homework">Homework ({homework?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="exams">Exams ({exams?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {!schedules ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : todaySchedules.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No classes scheduled for today.
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedules.map((s: any) => (
                    <div key={s._id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{s.title || "Class"}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.scheduleType ? `${s.scheduleType} • ` : ""}
                            Room {s.roomId ? String(s.roomId).slice(-4) : "—"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(s.start)} – {formatTime(s.end)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Homework</CardTitle>
              <Button size="sm" onClick={() => setHomeworkOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Assign Homework
              </Button>
            </CardHeader>
            <CardContent>
              {!homework ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : homework.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No homework assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {homework.map((h: any) => (
                    <div key={h._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{h.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {batchName(h.batchId)} • {subjectName(h.subjectId)} • Due {new Date(h.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={h.status === "assigned" ? "secondary" : "default"} className="text-[10px]">{h.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Exams</CardTitle>
              <Button size="sm" variant="outline" asChild>
                <a href="/examinations">
                  <BookMarked className="h-4 w-4 mr-2" /> Open Exam Center
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {!exams ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : exams.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No exams created yet. Create exams from the Exam Center.
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map((e: any) => (
                    <div key={e._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {batchName(e.batchId)} • {subjectName(e.subjectId)} • {new Date(e.examDate).toLocaleDateString()} • {e.totalMarks} marks
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={e.status === "published" ? "default" : "secondary"} className="text-[10px]">{e.status}</Badge>
                        {e.status === "draft" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePublishExam(e)}>
                            <CheckSquare className="h-3 w-3 mr-1" /> Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                Mark class attendance from the <a href="/attendance" className="text-primary underline">Attendance Center</a>.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Homework Dialog */}
      <Dialog open={homeworkOpen} onOpenChange={setHomeworkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Homework</DialogTitle>
            <DialogDescription>Create and assign homework to a batch.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Algebra — Chapter 8 Exercise" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Batch *</Label>
              <Select value={form.batchId} onValueChange={(v) => setForm({ ...form, batchId: v })}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {(batches ?? []).map((b: any) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Subject *</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {(subjects ?? []).map((s: any) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHomeworkOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateHomework} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Assign Homework
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
