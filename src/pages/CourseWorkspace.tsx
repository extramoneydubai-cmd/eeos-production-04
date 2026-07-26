import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Video, FileText, PenTool, MessageSquare,
  GraduationCap, Clock, Users, ChevronRight, CheckCircle2,
  AlertCircle, PlayCircle, ClipboardList, HelpCircle,
  Megaphone, Award, ArrowLeft,
} from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-500",
};

function StatCard({ title, value, icon: Icon, subtitle, color }: any) {
  return (
    <Card className="border-border/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
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

export default function CourseWorkspace() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = useQuery(api.lmsEngine.getCourse, { id: courseId as Id<"lmsCourses"> });
  const announcements = useQuery(api.lmsEngine.listAnnouncements, { courseId: courseId as Id<"lmsCourses"> });
  const discussions = useQuery(api.lmsEngine.listDiscussions, { courseId: courseId as Id<"lmsCourses"> });
  const assignments = useQuery(api.lmsFacultyEngine.listAssignments, { courseId: courseId as Id<"lmsCourses"> });
  const quizzes = useQuery(api.lmsFacultyEngine.listQuizzes, { courseId: courseId as Id<"lmsCourses"> });
  const contentUploads = useQuery(api.lmsPlatform.listContentUploads, { courseId: courseId as Id<"lmsCourses"> });

  if (!course && !courseId) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium">Course not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/lms/courses")}>Back to Courses</Button>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const publishedLessons = lessons.filter((l: any) => l.isPublished);
  const totalEnrolled = course.enrolledCount || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/lms/courses")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Course Library
        </Button>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{course.title}</h1>
            <Badge className={`text-[10px] ${statusColors[course.status] || ""}`}>{course.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{course.code} · {course.difficulty}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Video className="h-3 w-3" /> {lessons.length} lessons
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {totalEnrolled} enrolled
            </span>
            {course.duration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {course.duration}h
              </span>
            )}
            {course.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Lessons" value={lessons.length} icon={Video} color="bg-blue-500" subtitle={`${publishedLessons.length} published`} />
        <StatCard title="Enrolled" value={totalEnrolled} icon={Users} color="bg-emerald-500" />
        <StatCard title="Assignments" value={assignments?.length ?? 0} icon={ClipboardList} color="bg-amber-500" />
        <StatCard title="Quizzes" value={quizzes?.length ?? 0} icon={HelpCircle} color="bg-purple-500" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList className="bg-accent/50 p-0.5 overflow-x-auto flex-nowrap">
          <TabsTrigger value="lessons" className="text-xs"><Video className="h-3.5 w-3.5 mr-1" /> Lessons</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs"><ClipboardList className="h-3.5 w-3.5 mr-1" /> Assignments</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs"><HelpCircle className="h-3.5 w-3.5 mr-1" /> Quizzes</TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs"><Megaphone className="h-3.5 w-3.5 mr-1" /> Announcements</TabsTrigger>
          <TabsTrigger value="discussions" className="text-xs"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Discussions</TabsTrigger>
          <TabsTrigger value="content" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" /> Content</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Course Lessons ({lessons.length})</h3>
          </div>
          {!lessons.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No lessons created yet</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson: any, idx: number) => (
                <Card
                  key={lesson._id}
                  className="hover:shadow-md transition-all cursor-pointer border-border/40"
                  onClick={() => navigate(`/lms/lessons/${lesson._id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{lesson.title}</p>
                        {lesson.isPublished ? (
                          <Badge variant="success" className="text-[9px] h-4">Published</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] h-4">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px]">{lesson.contentType}</Badge>
                        {lesson.duration && <span className="text-[10px] text-muted-foreground">{lesson.duration} min</span>}
                        {lesson.topics?.length > 0 && <span className="text-[10px] text-muted-foreground">{lesson.topics.length} topics</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <h3 className="text-sm font-semibold">Assignments</h3>
          {!assignments?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No assignments created</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {assignments.map((a: any) => (
                <Card key={a._id} className="border-border/40">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">Max: {a.maxScore} | Pass: {a.passingScore}</p>
                    </div>
                    <Badge variant={a.status === "published" ? "success" : "outline"} className="text-[10px]">{a.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <h3 className="text-sm font-semibold">Quizzes</h3>
          {!quizzes?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No quizzes created</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {quizzes.map((q: any) => (
                <Card key={q._id} className="border-border/40">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">Pass: {q.passingPercentage}% | Attempts: {q.maxAttempts ?? "Unlimited"}</p>
                    </div>
                    <Badge variant={q.status === "published" ? "success" : "outline"} className="text-[10px]">{q.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <h3 className="text-sm font-semibold">Announcements</h3>
          {!announcements?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No announcements</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <Card key={a._id} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={a.priority === "urgent" ? "destructive" : a.priority === "important" ? "default" : "secondary"} className="text-[9px]">{a.priority}</Badge>
                      <p className="text-sm font-medium">{a.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4">
          <h3 className="text-sm font-semibold">Discussions</h3>
          {!discussions?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No discussions yet</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {discussions.map((d: any) => (
                <Card key={d._id} className="border-border/40">
                  <CardContent className="p-4">
                    <p className="text-sm">{d.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(d.createdAt).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <h3 className="text-sm font-semibold">Content Uploads</h3>
          {!contentUploads?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No content uploaded</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {contentUploads.map((u: any) => (
                <Card key={u._id} className="border-border/40">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{u.fileName}</p>
                        <p className="text-xs text-muted-foreground">{u.fileType} · {(u.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{new Date(u.createdAt).toLocaleDateString()}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
