import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  MessageSquare,
  Smartphone,
  BookOpen,
  CreditCard,
  Download,
  HelpCircle,
  Bell,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  Send,
  UserCheck as UserCheckIcon,
} from "lucide-react";
import { useState } from "react";

export default function DashboardParent() {
  const { user } = useAuth();
  const rawUserId = user?._id as string | undefined;
  // Local fallback users ("local_*") are not valid Convex ids — skip queries for them.
  const parentId = rawUserId && !rawUserId.startsWith("local_") ? rawUserId : undefined;

  const dashboard = useQuery(
    api.parentEngine.getParentDashboard,
    parentId ? { parentId: parentId as any } : "skip"
  );
  const students = useQuery(
    api.parentEngine.getStudentByParentId,
    parentId ? { parentId: parentId as any } : "skip"
  );
  const createTicket = useMutation(api.parentEngine.createParentTicket);

  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const studentList = students || dashboard?.students || [];
  const activeStudentId = selectedStudentId || studentList[0]?.student?.id || studentList[0]?._id;

  const studentFees = useQuery(
    api.parentEngine.getStudentFees,
    activeStudentId ? { studentId: activeStudentId as any } : "skip"
  );
  const studentAttendance = useQuery(
    api.parentEngine.getStudentAttendance,
    activeStudentId ? { studentId: activeStudentId as any, limit: 30 } : "skip"
  );
  const studentHomework = useQuery(
    api.parentEngine.getStudentHomework,
    activeStudentId ? { studentId: activeStudentId as any } : "skip"
  );
  const studentResults = useQuery(
    api.parentEngine.getStudentResults,
    activeStudentId ? { studentId: activeStudentId as any } : "skip"
  );

  const isLoading = parentId !== undefined && !dashboard && !students;
  const hasStudents = (studentList || []).length > 0;

  const WidgetCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "from-blue-500 to-indigo-600",
  }: {
    icon: React.ElementType;
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
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleCreateTicket = async () => {
    if (!parentId || !ticketSubject.trim()) return;
    setTicketSending(true);
    try {
      await createTicket({
        subject: ticketSubject.trim(),
        description: ticketDesc.trim() || ticketSubject.trim(),
        category: "parent_portal",
        studentId: activeStudentId as any,
        createdBy: parentId as any,
      });
      setTicketSent(true);
      setTicketSubject("");
      setTicketDesc("");
      setTimeout(() => setTicketSent(false), 4000);
    } finally {
      setTicketSending(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parent Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stay connected with your child&apos;s academic journey
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            {dashboard?.unreadNotifications || 0} Notifications
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : !hasStudents ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-medium">No linked children</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No student records are linked to this parent account yet. Contact the
              admissions office to link your child.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Child Selector */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Viewing</p>
                  <p className="text-lg font-bold">
                    {(() => {
                      const s = studentList.find((x: any) => x.student?.id === activeStudentId || x._id === activeStudentId);
                      const n = s?.student?.name || (s?.firstName ? `${s.firstName} ${s.lastName || ""}`.trim() : "Student");
                      const a = s?.student?.admissionNumber || s?.admissionNumber;
                      return `${n || "Student"}${a ? ` — ${a}` : ""}`;
                    })()}
                  </p>
                </div>
              </div>
              {studentList.length > 1 && (
                <select
                  value={activeStudentId || ""}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {studentList.map((s: any) => {
                    const id = s.student?.id || s._id;
                    const n = s.student?.name || (s.firstName ? `${s.firstName} ${s.lastName || ""}`.trim() : "Student");
                    return <option key={id} value={id}>{n}</option>;
                  })}
                </select>
              )}
            </CardContent>
          </Card>

          {/* KPI Widgets */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <WidgetCard
              icon={UserCheckIcon}
              title="Attendance"
              value={studentAttendance ? `${studentAttendance.percentage}%` : "—"}
              subtitle={studentAttendance ? `${studentAttendance.present}/${studentAttendance.total} days present` : "This month"}
              color="from-emerald-500 to-teal-600"
            />
            <WidgetCard
              icon={FileText}
              title="Homework"
              value={studentHomework ? studentHomework.length : "—"}
              subtitle="Assignments on record"
              color="from-blue-500 to-indigo-600"
            />
            <WidgetCard
              icon={CreditCard}
              title="Fee Balance"
              value={studentFees ? `₹${(studentFees.totalDue || 0).toLocaleString()}` : "—"}
              subtitle={studentFees ? `${studentFees.pendingInvoices?.length || 0} pending invoice(s)` : "Ledger"}
              color="from-amber-500 to-orange-600"
            />
            <WidgetCard
              icon={TrendingUp}
              title="Results"
              value={studentResults ? studentResults.length : "—"}
              subtitle="Result records"
              color="from-rose-500 to-pink-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 border-dashed flex-col gap-1">
              <Download className="h-5 w-5" />
              <span>Download Receipts</span>
            </Button>
            <Button variant="outline" className="h-20 border-dashed flex-col gap-1">
              <CalendarDays className="h-5 w-5" />
              <span>View Calendar</span>
            </Button>
            <Button variant="outline" className="h-20 border-dashed flex-col gap-1">
              <HelpCircle className="h-5 w-5" />
              <span>Support Tickets</span>
            </Button>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="attendance" className="space-y-4">
            <TabsList className="grid w-full md:grid-cols-5">
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees & Receipts</TabsTrigger>
              <TabsTrigger value="homework">Homework</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {!studentAttendance ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : studentAttendance.total === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No attendance records yet
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-3xl font-bold text-emerald-600">{studentAttendance.present}</p>
                          <p className="text-sm text-muted-foreground">Present</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                          <p className="text-3xl font-bold text-red-600">{studentAttendance.absent}</p>
                          <p className="text-sm text-muted-foreground">Absent</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">{studentAttendance.percentage}%</p>
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        </div>
                      </div>
                      {studentAttendance.records?.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                          {studentAttendance.records.map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                              <div className="flex items-center gap-2">
                                {r.status === "present" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : r.status === "late" ? (
                                  <Clock className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm capitalize">{r.status}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(r.date || r.attendanceDate || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fee Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  {!studentFees ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : studentFees.invoices?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No invoices yet</p>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {studentFees.invoices.map((inv: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{inv.title || inv.invoiceNumber || `Invoice ${i + 1}`}</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{(inv.totalAmount || inv.amount || 0).toLocaleString()}
                                {inv.dueDate ? ` • Due ${new Date(inv.dueDate).toLocaleDateString()}` : ""}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={inv.status === "paid" ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-amber-300"}
                            >
                              {inv.status === "paid"
                                ? `Paid ₹${(inv.paidAmount || 0).toLocaleString()}`
                                : `Pending ₹${(inv.balanceDue || inv.totalAmount || 0).toLocaleString()}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <span className="text-sm font-medium">Total Due</span>
                        <span className="text-sm font-bold text-amber-600">₹{(studentFees.totalDue || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="homework" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Homework & Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {!studentHomework ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : studentHomework.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No homework assigned</p>
                  ) : (
                    <div className="space-y-3">
                      {studentHomework.map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{h.title || h.subject || `Homework ${i + 1}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {h.description?.slice(0, 80) || (h.dueDate ? `Due ${new Date(h.dueDate).toLocaleDateString()}` : "")}
                            </p>
                          </div>
                          <Badge variant={h.status === "submitted" ? "default" : "secondary"}>
                            {h.status === "submitted" ? "Submitted" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Exam Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {!studentResults ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : studentResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No results published yet</p>
                  ) : (
                    <div className="space-y-3">
                      {studentResults.map((m: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{m.subject || m.examName || `Result ${i + 1}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.score !== undefined && m.maxScore !== undefined
                                ? `${m.score}/${m.maxScore}`
                                : m.marksObtained !== undefined
                                ? `Marks: ${m.marksObtained}`
                                : ""}
                            </p>
                          </div>
                          {m.grade && <Badge>{m.grade}</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raise a Support Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject">Subject</Label>
                    <Input
                      id="ticket-subject"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-desc">Description</Label>
                    <textarea
                      id="ticket-desc"
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="Provide details so the school can help"
                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <Button onClick={handleCreateTicket} disabled={!ticketSubject.trim() || ticketSending}>
                    {ticketSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Ticket
                  </Button>
                  {ticketSent && (
                    <p className="text-sm text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Ticket submitted — the school will respond shortly.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Bottom */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center pt-4 border-t">
        <Smartphone className="h-4 w-4" />
        <span>Download the EEOS Parent App for push notifications</span>
      </div>
    </div>
  );
}

