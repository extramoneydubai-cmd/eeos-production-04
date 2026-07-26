import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, GraduationCap, Video, Search, Filter,
  Clock, TrendingUp, PlusCircle, Users, FileText,
} from "lucide-react";

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

function StatCard({ title, value, icon: Icon, subtitle, color }: any) {
  return (
    <Card className="border-border/40 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
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

export default function CourseLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const dashboard = useQuery(api.lmsEngine.getLMSDashboard);
  const courses = useQuery(api.lmsEngine.listCourses, {});
  const analytics = useQuery(api.lmsPlatform.getLmsAnalytics);

  const isLoading = !dashboard || !courses;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter((c: any) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.title?.toLowerCase().includes(s) || c.code?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, create, and manage learning courses
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/lms")}>
          <BookOpen className="h-4 w-4 mr-1" /> LMS Dashboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={dashboard.totalCourses} icon={BookOpen} color="bg-blue-500" />
        <StatCard title="Published" value={dashboard.publishedCourses} icon={GraduationCap} color="bg-emerald-500" />
        <StatCard title="Draft" value={dashboard.draftCourses} icon={Clock} color="bg-amber-500" />
        <StatCard title="Total Lessons" value={dashboard.totalLessons} icon={Video} color="bg-purple-500" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-8 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="h-9">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="published" className="text-xs px-3">Published</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs px-3">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-3">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-xs"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-medium mb-1">No courses found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Create your first course to get started"}
            </p>
            {!search && (
              <Button onClick={() => navigate("/lms")}>
                <PlusCircle className="h-4 w-4 mr-1" /> Back to LMS Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course: any) => (
            <Card
              key={course._id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border/40"
              onClick={() => navigate(`/lms/courses/${course._id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{course.title}</CardTitle>
                      <CardDescription className="text-[10px]">{course.code}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${statusColors[course.status] || ""}`}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {course.description || "No description"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] ${difficultyColors[course.difficulty] || ""}`}>
                    {course.difficulty}
                  </Badge>
                  {course.tags?.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {course.lessonCount ?? 0} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.enrolledCount ?? 0} enrolled
                  </span>
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}h
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
