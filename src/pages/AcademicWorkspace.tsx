import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  WorkspaceShell,
  WorkspaceHeader,
  WorkspaceTabConfig,
} from "@/components/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SchedulingPlanner } from "@/components/scheduling/SchedulingPlanner";
import {
  BookOpen,
  BookType,
  Users,
  GraduationCap,
  Calendar,
  ClipboardList,
  Monitor,
  FileText,
  Clock,
  Activity,
  ListChecks,
  StickyNote,
  Sparkles,
  Building2,
  School,
  Target,
  CalendarRange,
  ChevronRight,
  Filter,
} from "lucide-react";

// ─── Main AcademicWorkspace ────────────────────────────────────
export default function AcademicWorkspace() {
  const { entityId } = useParams();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId") as Id<"academicPrograms"> | null;
  const batchId = searchParams.get("batchId") as Id<"academicBatches"> | null;

  // Fetch entity data
  const program = useQuery(
    api.academicPrograms.getAcademicProgram,
    programId ? { programId } : "skip",
  );
  const batch = useQuery(
    api.academicBatches.getAcademicBatch,
    batchId ? { batchId } : "skip",
  );

  const entity = program || batch;
  const entityLabel = program ? "Program" : "Batch";
  const entityName = entity?.name ?? "Loading...";
  const entityCode = entity?.code ?? "";
  const entityColor = entity?.color ?? "#6366f1";

  // ─── Tabs ───────────────────────────────────────────────────
  const tabs: WorkspaceTabConfig[] = [
    {
      id: "overview",
      label: "Overview",
      icon: BookOpen,
      component: () => (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{program ? "—" : "—"}</span>
                  <BookType className="h-8 w-8 text-blue-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Assigned to this {entityLabel}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">—</span>
                  <Users className="h-8 w-8 text-emerald-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Assigned instructors</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">—</span>
                  <GraduationCap className="h-8 w-8 text-purple-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Enrolled students</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hours/Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">—</span>
                  <Clock className="h-8 w-8 text-amber-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total teaching hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Entity Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{entityLabel} Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Name</dt>
                  <dd className="font-medium">{entityName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Code</dt>
                  <dd className="font-medium">{entityCode}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Status</dt>
                  <dd>
                    <Badge
                      variant={entity?.isActive !== false ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {entity?.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </dd>
                </div>
                {program && (
                  <>
                    <div>
                      <dt className="text-muted-foreground text-xs">Duration</dt>
                      <dd className="font-medium capitalize">
                        {program.duration} {program.durationUnit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Delivery Mode</dt>
                      <dd className="font-medium">{program.deliveryMode}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Program Type</dt>
                      <dd className="font-medium">{program.programType}</dd>
                    </div>
                  </>
                )}
                {batch && (
                  <>
                    <div>
                      <dt className="text-muted-foreground text-xs">Capacity</dt>
                      <dd className="font-medium">{batch.capacity ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Min/Max Strength</dt>
                      <dd className="font-medium">
                        {batch.minStrength ?? "—"} / {batch.maxStrength ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Sequence</dt>
                      <dd className="font-medium">{batch.sequence}</dd>
                    </div>
                  </>
                )}
              </dl>
              {(entity as { description?: string })?.description && (
                <div className="mt-4">
                  <dt className="text-muted-foreground text-xs mb-1">Description</dt>
                  <dd className="text-sm text-muted-foreground">
                    {(entity as { description: string }).description}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "subjects",
      label: "Subjects",
      icon: BookType,
      component: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Subject mapping for this {entityLabel}. Assign subjects, configure credits,
            and manage faculty allocation.
          </p>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Subject management will be available in the next release.
            <br />
            <Button variant="outline" size="sm" className="mt-2" disabled>
              Manage Subjects
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "faculty",
      label: "Faculty",
      icon: Users,
      component: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Faculty assignments for this {entityLabel}. View teaching load, availability,
            and schedules.
          </p>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Faculty assignment module will be available in the next release.
            <br />
            <Button variant="outline" size="sm" className="mt-2" disabled>
              Assign Faculty
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "students",
      label: "Students",
      icon: GraduationCap,
      component: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Students enrolled in this {entityLabel}. Track enrollment strength and progress.
          </p>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Student enrollment integration will be available in the next release.
            <br />
            <Button variant="outline" size="sm" className="mt-2" disabled>
              View Students
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "timetable",
      label: "Timetable",
      icon: Calendar,
      component: () => {
        const [view, setView] = useState<"day" | "week" | "resource">("week");
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">{entityLabel} Timetable</h3>
              </div>
              <div className="flex items-center gap-2">
                <Select value={view} onValueChange={(v: any) => setView(v)}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <Filter className="h-3 w-3" /> Filter
                </Button>
              </div>
            </div>
            <SchedulingPlanner
              entityType={entityLabel.toLowerCase()}
              entityId={programId || batchId || ""}
              defaultView={view}
            />
          </div>
        );
      },
    },
    {
      id: "examinations",
      label: "Examinations",
      icon: ClipboardList,
      component: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exam schedule, results and performance analytics for this {entityLabel}.
          </p>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Examination integration will be available in the next release.
            <br />
            <Button variant="outline" size="sm" className="mt-2" disabled>
              View Exams
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "lms",
      label: "LMS",
      icon: Monitor,
      component: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Learning Management System content for this {entityLabel}. Lessons, assignments,
            quizzes and progress tracking.
          </p>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            LMS integration will be available in the next release.
            <br />
            <Button variant="outline" size="sm" className="mt-2" disabled>
              Open LMS
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      component: () => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Documents and resources for this {entityLabel}.
          </p>
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Document management will be available in the next release.
          </div>
        </div>
      ),
    },
  ];

  return (
    <WorkspaceShell
      tabs={tabs}
      defaultTab="overview"
      header={
        <WorkspaceHeader
          title={entityName}
          subtitle={`${entityLabel} • ${entityCode}`}
          color={entityColor}
        />
      }
    />
  );
}
