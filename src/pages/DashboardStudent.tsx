import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Library,
  LucideIcon,
  MessageSquare,
  Smartphone,
  Trophy,
  UserCheck,
  CreditCard,
  Download,
  HelpCircle,
} from "lucide-react";

export default function DashboardStudent() {
  const { user } = useAuth();

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, Aarav! Here&apos;s your learning overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Class 10A • Roll #12
          </Badge>
          <Button size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WidgetCard
          icon={UserCheck}
          title="Attendance"
          value="94%"
          subtitle="This month"
          color="from-emerald-500 to-teal-600"
        />
        <WidgetCard
          icon={BookOpen}
          title="Homework"
          value="3"
          subtitle="Pending submissions"
          color="from-blue-500 to-indigo-600"
        />
        <WidgetCard
          icon={Trophy}
          title="Avg. Score"
          value="85%"
          subtitle="Across all subjects"
          color="from-amber-500 to-orange-600"
        />
        <WidgetCard
          icon={Clock}
          title="Upcoming Exams"
          value="2"
          subtitle="Maths & Science"
          color="from-rose-500 to-pink-600"
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 md:grid-cols-5">
        <Button variant="outline" className="h-24 flex-col gap-2 border-dashed">
          <CalendarDays className="h-5 w-5" />
          <span className="text-xs">Timetable</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2 border-dashed">
          <Library className="h-5 w-5" />
          <span className="text-xs">LMS</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2 border-dashed">
          <GraduationCap className="h-5 w-5" />
          <span className="text-xs">Certificates</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2 border-dashed">
          <Download className="h-5 w-5" />
          <span className="text-xs">Downloads</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2 border-dashed">
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs">Support</span>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList className="grid w-full md:grid-cols-5">
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: "08:00 - 08:45", subject: "Mathematics", teacher: "Mr. Sharma", room: "101" },
                  { time: "08:45 - 09:30", subject: "Science", teacher: "Mrs. Patel", room: "102" },
                  { time: "09:30 - 10:15", subject: "English", teacher: "Ms. Gupta", room: "103" },
                  { time: "10:15 - 10:45", subject: "Break", teacher: "-", room: "-" },
                  { time: "10:45 - 11:30", subject: "Hindi", teacher: "Mr. Verma", room: "104" },
                  { time: "11:30 - 12:15", subject: "Social Studies", teacher: "Mrs. Singh", room: "105" },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      slot.subject === "Break"
                        ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200"
                        : "bg-muted/30 border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{slot.subject}</p>
                        <p className="text-xs text-muted-foreground">{slot.teacher} • Room {slot.room}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{slot.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-600">92</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">4</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">2</p>
                  <p className="text-sm text-muted-foreground">Leave</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Homeworks & Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Mathematics — Chapter 8: Algebra</p>
                    <p className="text-xs text-muted-foreground">Due: 18 Jul 2026</p>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Science — Lab Report</p>
                    <p className="text-xs text-muted-foreground">Due: 20 Jul 2026</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">English — Essay Submission</p>
                    <p className="text-xs text-muted-foreground">Submitted • Score: 85/100</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Tuition Fee — Q2 2026</p>
                    <p className="text-xs text-muted-foreground">Due: 15 Jul 2026</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Pending ₹12,500
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Tuition Fee — Q1 2026</p>
                    <p className="text-xs text-muted-foreground">Paid: 15 Apr 2026 • Ref: INV-2026-001</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    Paid
                  </Badge>
                </div>
              </div>
              <Button size="sm" className="mt-3">
                <CreditCard className="h-4 w-4 mr-2" /> View Payment Options
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exam Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Mid-Term Exams 2026</p>
                    <p className="text-xs text-muted-foreground">Overall: 85% | Rank: 12/45</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Pass</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Unit Test 2</p>
                    <p className="text-xs text-muted-foreground">Overall: 78% | Rank: 18/45</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Pass</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                <FileText className="h-4 w-4 mr-2" /> Download Report Card
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* App Download CTA */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center pt-4 border-t">
        <Smartphone className="h-4 w-4" />
        <span>Access your learning on the go — EEOS Student App available for iOS & Android</span>
      </div>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return <svg className={className} />;
}
