import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, UserPlus, UserCheck, ClipboardList, Calendar,
  Building, FileText, Clock, ArrowRight, TrendingUp,
  Briefcase, Award, Shield, Bell, Settings, Truck,
  Hotel, Bus, BookOpen, Wrench, Key, Car,
} from "lucide-react";

function StatCard({ title, value, icon: Icon, subtitle, color, onClick }: any) {
  return (
    <Card
      className="border-border/40 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value ?? "—"}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${color || "bg-primary/10"}`}>
            <Icon className={`h-5 w-5 ${color ? "text-white" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleCard({ title, description, icon: Icon, color, href, status }: any) {
  const navigate = useNavigate();
  return (
    <Card
      className="border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color || "bg-primary/10"} shrink-0`}>
            <Icon className={`h-5 w-5 ${color ? "text-white" : "text-primary"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{title}</p>
              {status === "active" && <Badge variant="success" className="text-[8px] h-3.5 px-1">Live</Badge>}
              {status === "planned" && <Badge variant="outline" className="text-[8px] h-3.5 px-1">Planned</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdministrationDashboard() {
  const navigate = useNavigate();
  const empStats = useQuery(api.employeeEngine.getEmployeeStats);
  const recAnalytics = useQuery(api.recruitmentEngine.getRecruitmentAnalytics);
  const offerStats = useQuery(api.offerEngine.getOfferStats);

  const isLoading = !empStats;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const modules = [
    { title: "Leave Management", description: "Manage employee leave requests, balances, and calendars", icon: Calendar, color: "bg-blue-500", href: "/employees", status: "active" },
    { title: "Attendance", description: "Track daily attendance, late arrivals, and work hours", icon: Clock, color: "bg-emerald-500", href: "/employees", status: "active" },
    { title: "Payroll & Salary", description: "Salary structures, monthly payroll, salary slips and taxes", icon: Briefcase, color: "bg-purple-500", href: "/employees", status: "active" },
    { title: "Recruitment", description: "Job requisitions, postings, candidate pipeline, and hiring", icon: UserPlus, color: "bg-amber-500", href: "/recruiting", status: "active" },
    { title: "Onboarding", description: "Employee onboarding checklists, task tracking, and orientation", icon: UserCheck, color: "bg-cyan-500", href: "/employees", status: "active" },
    { title: "Employee Assets", description: "Assign and track IT equipment, furniture, and devices", icon: Truck, color: "bg-rose-500", href: "/procurement/assets", status: "active" },
    { title: "HR Calendar", description: "Company events, birthdays, anniversaries, and holidays", icon: Building, color: "bg-indigo-500", href: "/calendar", status: "active" },
    { title: "Organization Notices", description: "Publish announcements, circulars, and policy updates", icon: Bell, color: "bg-orange-500", href: "/employees", status: "active" },
    { title: "People Registry", description: "Central contact database for employees, vendors, and contacts", icon: Users, color: "bg-teal-500", href: "/people", status: "active" },
    { title: "Employee Database", description: "Full employee records, search, filters, and bulk operations", icon: ClipboardList, color: "bg-sky-500", href: "/employees", status: "active" },
    { title: "Visitor Management", description: "Track visitors, gate passes, and visitor history", icon: Shield, color: "bg-violet-500", href: "/studio/administration", status: "planned" },
    { title: "Facility Booking", description: "Book meeting rooms, training halls, and shared facilities", icon: Key, color: "bg-pink-500", href: "/calendar", status: "active" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Central hub for HR operations, facilities management, and organizational administration
        </p>
      </div>

      {/* HR KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={empStats.total}
          icon={Users}
          color="bg-blue-500"
          subtitle={`${empStats.active} active, ${empStats.onboarding} onboarding`}
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="Onboarding"
          value={empStats.onboarding}
          icon={UserPlus}
          color="bg-amber-500"
          subtitle={`${empStats.probation} on probation`}
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="Candidates in Pipeline"
          value={recAnalytics?.inPipeline ?? 0}
          icon={UserCheck}
          color="bg-purple-500"
          subtitle={`${recAnalytics?.totalCandidates ?? 0} total applicants`}
          onClick={() => navigate("/recruiting")}
        />
        <StatCard
          title="Open Positions"
          value={recAnalytics?.activePostings ?? 0}
          icon={Briefcase}
          color="bg-emerald-500"
          subtitle={`${recAnalytics?.approvedRequisitions ?? 0} approved reqs`}
          onClick={() => navigate("/recruiting")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Offers"
          value={offerStats?.pending ?? 0}
          icon={Award}
          color="bg-rose-500"
          subtitle={`${offerStats?.accepted ?? 0} accepted`}
          onClick={() => navigate("/recruiting")}
        />
        <StatCard
          title="Permanent Staff"
          value={empStats.permanent}
          icon={ClipboardList}
          color="bg-indigo-500"
          subtitle={`${empStats.contract} contract, ${empStats.intern} interns`}
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="Resigned/Terminated"
          value={empStats.resigned + empStats.terminated}
          icon={TrendingUp}
          color="bg-red-500"
          subtitle={`${empStats.resigned} resigned, ${empStats.terminated} terminated`}
        />
        <StatCard
          title="Part-time/Freelancer"
          value={empStats.partTime + empStats.freelancer + empStats.consultant}
          icon={Users}
          color="bg-cyan-500"
          subtitle={`${empStats.partTime} part-time, ${empStats.freelancer} freelancer`}
        />
      </div>

      {/* Module Navigation Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {modules.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </div>
      </div>

      {/* Quick Stats Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Employment Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Permanent", count: empStats.permanent, total: empStats.total, color: "bg-blue-500" },
                { label: "Contract", count: empStats.contract, total: empStats.total, color: "bg-emerald-500" },
                { label: "Part-time", count: empStats.partTime, total: empStats.total, color: "bg-amber-500" },
                { label: "Intern", count: empStats.intern, total: empStats.total, color: "bg-purple-500" },
                { label: "Freelancer", count: empStats.freelancer, total: empStats.total, color: "bg-cyan-500" },
                { label: "Consultant", count: empStats.consultant, total: empStats.total, color: "bg-rose-500" },
              ].filter(d => d.count > 0).map((d) => {
                const pct = d.total > 0 ? Math.round((d.count / d.total) * 100) : 0;
                return (
                  <div key={d.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${d.color}`} />
                        <span className="font-medium">{d.label}</span>
                      </div>
                      <span>{d.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Employee Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Active", count: empStats.active, total: empStats.total, color: "bg-emerald-500" },
                { label: "Onboarding", count: empStats.onboarding, total: empStats.total, color: "bg-blue-500" },
                { label: "Probation", count: empStats.probation, total: empStats.total, color: "bg-amber-500" },
                { label: "Suspended", count: empStats.suspended, total: empStats.total, color: "bg-orange-500" },
                { label: "Resigned", count: empStats.resigned, total: empStats.total, color: "bg-red-500" },
                { label: "Terminated", count: empStats.terminated, total: empStats.total, color: "bg-rose-600" },
                { label: "Retired", count: empStats.retired, total: empStats.total, color: "bg-gray-500" },
                { label: "Archived", count: empStats.archived, total: empStats.total, color: "bg-gray-400" },
              ].filter(d => d.count > 0).map((d) => {
                const pct = d.total > 0 ? Math.round((d.count / d.total) * 100) : 0;
                return (
                  <div key={d.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${d.color}`} />
                        <span className="font-medium">{d.label}</span>
                      </div>
                      <span>{d.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/employees")}>
              <Users className="h-3.5 w-3.5 mr-1" /> View All Employees
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/recruiting")}>
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Recruitment Dashboard
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/people")}>
              <Users className="h-3.5 w-3.5 mr-1" /> People Registry
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/procurement/assets")}>
              <Truck className="h-3.5 w-3.5 mr-1" /> Asset Management
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/calendar")}>
              <Calendar className="h-3.5 w-3.5 mr-1" /> HR Calendar
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/studio/master-data/hr")}>
              <Settings className="h-3.5 w-3.5 mr-1" /> HR Master Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
