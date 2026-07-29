import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CalendarDays,
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
} from "lucide-react";

export default function DashboardFaculty() {
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
          <h1 className="text-2xl font-bold tracking-tight">Faculty Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome, Mr. Sharma! Here&apos;s your teaching overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Mathematics • Class 10A, 10B
          </Badge>
          <Button size="sm" variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" /> Messages
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WidgetCard
          icon={BookOpen}
          title="Today's Classes"
          value="4"
          subtitle="5.5 hours total"
          color="from-blue-500 to-indigo-600"
        />
        <WidgetCard
          icon={Users}
          title="Students"
          value="82"
          subtitle="Across 2 sections"
          color="from-emerald-500 to-teal-600"
        />
        <WidgetCard
          icon={ClipboardList}
          title="Homework to Review"
          value="23"
          subtitle="3 submissions pending"
          color="from-amber-500 to-orange-600"
        />
        <WidgetCard
          icon={Clock}
          title="Weekly Load"
          value="24h"
          subtitle="Max: 30h"
          color="from-rose-500 to-pink-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-4">
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed">
          <UserCheck className="h-5 w-5" />
          <span className="text-xs">Mark Attendance</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed">
          <ClipboardList className="h-5 w-5" />
          <span className="text-xs">Create Homework</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed">
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs">Question Bank</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2 border-dashed">
          <GraduationCap className="h-5 w-5" />
          <span className="text-xs">Create Exam</span>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full md:grid-cols-6">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: "08:00 - 08:45", subject: "Maths 10A", room: "101", count: 42 },
                  { time: "08:45 - 09:30", subject: "Maths 10A", room: "101", count: 42 },
                  { time: "09:30 - 10:15", subject: "Maths 10B", room: "102", count: 40 },
                  { time: "10:15 - 10:45", subject: "Break", room: "-", count: 0 },
                  { time: "10:45 - 11:30", subject: "Maths 10B", room: "102", count: 40 },
                  { time: "13:00 - 14:00", subject: "Office Hours", room: "Staff Room", count: 0 },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      slot.subject === "Break" ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{slot.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          Room {slot.room}{slot.count > 0 ? ` • ${slot.count} students` : ""}
                        </p>
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
              <CardTitle className="text-lg">Attendance — Class 10A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: "Aarav Sharma", status: "present" },
                  { name: "Priya Patel", status: "present" },
                  { name: "Rahul Verma", status: "absent" },
                  { name: "Ananya Singh", status: "present" },
                  { name: "Vikram Gupta", status: "leave" },
                ].map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
                    <span className="text-sm">{student.name}</span>
                    <Badge
                      variant={student.status === "present" ? "default" : "secondary"}
                      className={
                        student.status === "present"
                          ? "bg-emerald-100 text-emerald-700"
                          : student.status === "absent"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {student.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button size="sm" className="mt-3 w-full">
                <UserCheck className="h-4 w-4 mr-2" /> Mark Full Attendance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Homework</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Algebra — Chapter 8 Exercise</p>
                    <p className="text-xs text-muted-foreground">Class 10A • Due: 18 Jul • 32/42 submitted</p>
                  </div>
                  <Badge variant="secondary">32 Submitted</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Geometry — Practice Problems</p>
                    <p className="text-xs text-muted-foreground">Class 10B • Due: 19 Jul • 18/40 submitted</p>
                  </div>
                  <Badge variant="outline">18 Submitted</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3">
                <ClipboardList className="h-4 w-4 mr-2" /> Create New Homework
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exam Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Unit Test 3 — Mathematics</p>
                    <p className="text-xs text-muted-foreground">Scheduled: 25 Jul 2026 • Duration: 3h</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" /> Create Question Paper
                </Button>
                <Button size="sm" variant="outline">
                  <BookMarked className="h-4 w-4 mr-2" /> Question Bank
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Performance analytics available after exam results are published.</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Generate Performance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Teaching Schedule</p>
                    <p className="text-xs text-muted-foreground">PDF</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Lesson Plan — Algebra</p>
                    <p className="text-xs text-muted-foreground">PDF</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave & Training CTA */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium">Plan your leave</p>
            <p className="text-xs text-muted-foreground">You have 12 leave days remaining this year</p>
          </div>
        </div>
        <Button size="sm" variant="outline">Apply for Leave</Button>
      </div>
    </div>
  );
}

function Bell({ className }: { className?: string }) {
  return <svg className={className} />;
}
