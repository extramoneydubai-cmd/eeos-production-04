import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Video, FileText, BookOpen, ArrowLeft, PlayCircle,
  HelpCircle, ClipboardList, MessageSquare, ChevronRight,
  Clock, CheckCircle2, AlertCircle, Download, FileType,
  ImageIcon, Code2, Globe,
} from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";

const contentTypeIcons: Record<string, any> = {
  video: Video, pdf: FileText, slides: BookOpen, text: FileText,
  quiz: HelpCircle, assignment: ClipboardList,
};

const topicTypeIcons: Record<string, any> = {
  text: FileText, video: Video, pdf: FileText, image: ImageIcon,
  embed: Globe, code: Code2,
};

const topicTypeColors: Record<string, string> = {
  text: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  video: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  pdf: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  image: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  embed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  code: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function ContentViewer({ contentType, contentUrl, contentData }: { contentType: string; contentUrl?: string; contentData?: string }) {
  if (contentType === "video" && contentUrl) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video className="w-full h-full" controls src={contentUrl}>
          Your browser does not support video playback
        </video>
      </div>
    );
  }

  if (contentType === "pdf" && contentUrl) {
    return (
      <div className="aspect-[4/3] rounded-lg border border-border/40 overflow-hidden bg-accent/20">
        <iframe src={contentUrl} className="w-full h-full" title="PDF Viewer" />
      </div>
    );
  }

  if (contentType === "text" && contentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {contentData}
          </div>
        </CardContent>
      </Card>
    );
  }

  if ((contentType === "slides" || contentType === "quiz" || contentType === "assignment") && contentUrl) {
    return (
      <div className="aspect-video rounded-lg border border-border/40 overflow-hidden bg-accent/20">
        <iframe src={contentUrl} className="w-full h-full" title={contentType} />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        {contentUrl ? (
          <div className="space-y-3">
            <FileText className="h-12 w-12 mx-auto opacity-50" />
            <p>Content available at external URL</p>
            <Button variant="outline" size="sm" onClick={() => window.open(contentUrl, "_blank")}>
              <Download className="h-3.5 w-3.5 mr-1" /> Open Content
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <BookOpen className="h-12 w-12 mx-auto opacity-50" />
            <p>No content data available for this lesson type</p>
            <p className="text-xs">Content type: {contentType}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LessonWorkspace() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const lesson = useQuery(api.lmsEngine.getLesson, { id: lessonId as Id<"lmsLessons"> });

  if (!lesson && !lessonId) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium">Lesson not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/lms/courses")}>Back to Courses</Button>
      </div>
    );
  }

  const contentIcon = contentTypeIcons[lesson.contentType] || FileText;
  const topics = lesson.topics || [];
  const assignments = lesson.assignments || [];
  const quizzes = lesson.quizzes || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/lms/courses/${lesson.courseId}`)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Course
        </Button>
      </div>

      {/* Lesson Header */}
      <Card className="border-border/40 mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {contentIcon && <contentIcon className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{lesson.title}</h1>
                {lesson.isPublished ? (
                  <Badge variant="success" className="text-[10px]">Published</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Draft</Badge>
                )}
              </div>
              {lesson.description && (
                <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-[10px] capitalize">{lesson.contentType}</Badge>
                {lesson.duration && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {lesson.duration} min
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Order: {lesson.orderIndex + 1}
                </span>
                <span className="text-xs text-muted-foreground">
                  {topics.length} topics · {assignments.length} assignments · {quizzes.length} quizzes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="bg-accent/50 p-0.5">
          <TabsTrigger value="content" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" /> Content</TabsTrigger>
          <TabsTrigger value="topics" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" /> Topics ({topics.length})</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs"><ClipboardList className="h-3.5 w-3.5 mr-1" /> Assignments</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs"><HelpCircle className="h-3.5 w-3.5 mr-1" /> Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <ContentViewer
            contentType={lesson.contentType}
            contentUrl={lesson.contentUrl}
            contentData={lesson.contentData}
          />
        </TabsContent>

        <TabsContent value="topics" className="space-y-3">
          <h3 className="text-sm font-semibold">Lesson Topics</h3>
          {!topics.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No topics defined for this lesson</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {topics.map((topic: any, idx: number) => {
                const TopicIcon = topicTypeIcons[topic.contentType] || FileText;
                const topicColor = topicTypeColors[topic.contentType] || "bg-gray-100 text-gray-600";
                return (
                  <Card key={topic._id} className="hover:shadow-sm transition-all border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                        {idx + 1}
                      </div>
                      <div className={`p-1.5 rounded-lg ${topicColor}`}>
                        <TopicIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{topic.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{topic.contentType}{topic.duration ? ` · ${topic.duration} min` : ""}</p>
                      </div>
                      {topic.contentUrl && (
                        <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" onClick={() => window.open(topic.contentUrl!, "_blank")}>
                          <PlayCircle className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-3">
          <h3 className="text-sm font-semibold">Assignments ({assignments.length})</h3>
          {!assignments.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No assignments for this lesson</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {assignments.map((a: any) => (
                <Card key={a._id} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">Max Score: {a.maxScore}</span>
                          <span className="text-xs text-muted-foreground">Pass: {a.passingScore}</span>
                          {a.dueDate && <span className="text-xs text-muted-foreground">Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <Badge variant={a.status === "published" ? "success" : "outline"} className="text-[10px]">{a.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-3">
          <h3 className="text-sm font-semibold">Quizzes ({quizzes.length})</h3>
          {!quizzes.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No quizzes for this lesson</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {quizzes.map((q: any) => (
                <Card key={q._id} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{q.title}</p>
                        {q.description && <p className="text-xs text-muted-foreground mt-1">{q.description}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">Pass: {q.passingPercentage}%</span>
                          {q.timeLimit && <span className="text-xs text-muted-foreground">Time: {q.timeLimit} min</span>}
                          <span className="text-xs text-muted-foreground">Max attempts: {q.maxAttempts ?? "∞"}</span>
                        </div>
                      </div>
                      <Badge variant={q.status === "published" ? "success" : "outline"} className="text-[10px]">{q.status}</Badge>
                    </div>
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
