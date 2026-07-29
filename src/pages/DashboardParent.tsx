import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  LucideIcon,
  MessageSquare,
  Smartphone,
  UserCheck,
  BookOpen,
  CreditCard,
  Download,
  HelpCircle,
  Bell,
} from "lucide-react";

export default function DashboardParent() {
  const { user } = useAuth();

  const students = useQuery(api.users.listUsers, {});

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
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </Button>
          <Button size="sm">
            <MessageSquare className="h-4 w-4 mr-2" /> Contact School
          </Button>
        </div>
      </div>

      {/* Child Selector */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Viewing</p>
              <p className="text-lg font-bold">Aarav Sharma — Class 10A</p>
            </div>
          </div>
          <Button variant="outline">Switch Child</Button>
        </CardContent>
      </Card>

      {/* KPI Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WidgetCard
          icon={BookOpen}
          title="Attendance"
          value="94%"
          subtitle="This month"
          color="from-emerald-500 to-teal-600"
        />
        <WidgetCard
          icon={FileText}
          title="Homework"
          value="3"
          subtitle="Pending submissions"
          color="from-blue-500 to-indigo-600"
        />
        <WidgetCard
          icon={CreditCard}
          title="Fee Balance"
          value="₹12,500"
          subtitle="Due: 15 Aug 2026"
          color="from-amber-500 to-orange-600"
        />
        <WidgetCard
          icon={Clock}
          title="Upcoming Exams"
          value="2"
          subtitle="Next: Maths (20 Jul)"
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
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
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

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Tuition Fee (Q2 2026)</p>
                    <p className="text-sm text-muted-foreground">Due: 15 Jul 2026</p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Pending ₹12,500
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Tuition Fee (Q1 2026)</p>
                    <p className="text-sm text-muted-foreground">Paid: 15 Apr 2026</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    Paid ₹12,500
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">
                  <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                </Button>
                <Button size="sm" variant="outline">
                  Download Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Homework & Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Mathematics — Chapter 8: Algebra</p>
                    <p className="text-xs text-muted-foreground">Due: 18 Jul 2026 • Submitted: 5/10 questions</p>
                  </div>
                  <Badge>In Progress</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Science — Lab Report</p>
                    <p className="text-xs text-muted-foreground">Due: 20 Jul 2026 • Not yet submitted</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">English — Essay</p>
                    <p className="text-xs text-muted-foreground">Submitted: 12 Jul 2026 • 85/100</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                </div>
              </div>
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
                    <p className="font-medium">Mid-Term Exams 2026</p>
                    <p className="text-xs text-muted-foreground">Overall: 85% — Rank: 12/45</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Pass</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Unit Test 2</p>
                    <p className="text-xs text-muted-foreground">Overall: 78% — Rank: 18/45</p>
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

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents & Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Admission Confirmation</p>
                    <p className="text-xs text-muted-foreground">PDF • 2.3 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Fee Receipt — Q1 2026</p>
                    <p className="text-xs text-muted-foreground">PDF • 1.1 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <FileText className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="font-medium text-sm">Report Card — Mid-Term 2026</p>
                    <p className="text-xs text-muted-foreground">PDF • 0.8 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">PDC Agreement</p>
                    <p className="text-xs text-muted-foreground">PDF • 0.5 MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Quick Actions */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center pt-4 border-t">
        <Smartphone className="h-4 w-4" />
        <span>Download the EEOS Parent App for push notifications</span>
      </div>
    </div>
  );
}
