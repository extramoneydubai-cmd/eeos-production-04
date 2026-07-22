import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Home,
  Calendar,
  BookOpen,
  BookOpenCheck,
  GraduationCap,
  School,
  FileSpreadsheet,
  ClipboardList,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Target,
  CalendarDays,
  Landmark,
  Layers,
  GitBranch,
  Blocks,
  Atom,
  Clock,
  LayoutGrid,
  Languages,
  Globe,
  Mountain,
  BookCheck,
  Notebook,
} from "lucide-react";

/* ── Data ── */

const overviewCards = [
  {
    id: "sub-verticals",
    title: "Sub Verticals",
    description: "Sub-categories under each academic vertical",
    icon: GitBranch,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/sub-verticals",
    isPlaceholder: false,
  },
  {
    id: "boards",
    title: "Boards",
    description: "Academic governing boards and curricula",
    icon: Landmark,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 10,
    activeRecords: 10,
    href: "/studios/master-data/academic/boards",
    isPlaceholder: false,
  },
  {
    id: "verticals",
    title: "Academic Verticals",
    description: "Academic categories and education verticals",
    icon: Layers,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 8,
    activeRecords: 8,
    href: "/studios/master-data/academic/verticals",
    isPlaceholder: false,
  },
  {
    id: "sessions",
    title: "Academic Sessions",
    description: "Academic calendar sessions and timelines",
    icon: Calendar,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 4,
    activeRecords: 4,
    href: "/studios/master-data/academic/sessions",
    isPlaceholder: false,
  },
  {
    id: "courses",
    title: "Courses",
    description: "Course catalog and program definitions",
    icon: BookOpen,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 0,
    activeRecords: 0,
    href: "#",
    isPlaceholder: true,
  },
  {
    id: "programs",
    title: "Programs",
    description: "Academic programs and curriculum tracks",
    icon: Blocks,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/programs",
    isPlaceholder: false,
  },
  {
    id: "batch-types",
    title: "Batch Types",
    description: "Reusable batch type classifications",
    icon: Clock,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/batch-types",
    isPlaceholder: false,
  },
  {
    id: "batches",
    title: "Batches",
    description: "Batch master data — program-specific batches with capacity and schedule",
    icon: BookOpenCheck,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/batches",
    isPlaceholder: false,
  },
  {
    id: "subjects",
    title: "Subjects",
    description: "Reusable academic subjects catalog",
    icon: Atom,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/subjects",
    isPlaceholder: false,
  },
  {
    id: "sections",
    title: "Sections",
    description: "Classroom divisions — sections represent batch or classroom sub-divisions",
    icon: LayoutGrid,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/sections",
    isPlaceholder: false,
  },
  {
    id: "mediums",
    title: "Mediums",
    description: "Teaching mediums — languages of instruction used across programs and batches",
    icon: Languages,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/mediums",
    isPlaceholder: false,
  },
  {
    id: "languages",
    title: "Languages",
    description: "Languages offered as subjects or used for communication",
    icon: Globe,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/languages",
    isPlaceholder: false,
  },
  {
    id: "streams",
    title: "Streams",
    description: "Specialization paths — academic disciplines and career tracks",
    icon: Mountain,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/streams",
    isPlaceholder: false,
  },
  {
    id: "semesters",
    title: "Semesters",
    description: "Semester and trimester terms — linked to academic sessions",
    icon: BookCheck,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/semesters",
    isPlaceholder: false,
  },
  {
    id: "terms",
    title: "Terms",
    description: "Academic terms — subdivisions of semesters or school years linked to sessions",
    icon: Notebook,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/academic/terms",
    isPlaceholder: false,
  },
];

const moduleCards = [
  {
    id: "sub-verticals",
    title: "Sub Verticals",
    description: "Define sub-categories under each academic vertical for fine-grained classification.",
    icon: GitBranch,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/academic/sub-verticals",
    isPlaceholder: false,
  },
  {
    id: "boards",
    title: "Boards",
    description: "Configure academic governing boards and curriculum frameworks.",
    icon: Landmark,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/academic/boards",
    isPlaceholder: false,
  },
  {
    id: "verticals",
    title: "Academic Verticals",
    description: "Define the highest-level academic categories offered by the institute.",
    icon: Layers,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/academic/verticals",
    isPlaceholder: false,
  },
  {
    id: "sessions",
    title: "Academic Sessions",
    description: "Configure academic calendar sessions, timelines, and admission windows.",
    icon: Calendar,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/academic/sessions",
    isPlaceholder: false,
  },
  {
    id: "courses",
    title: "Courses",
    description: "Define course catalog and program offerings.",
    icon: BookOpen,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "coming-soon" as const,
    href: "#",
    isPlaceholder: true,
  },
  {
    id: "programs",
    title: "Programs",
    description: "Define programs and course offerings available under each sub-vertical.",
    icon: Blocks,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/academic/programs",
    isPlaceholder: false,
  },
  {
    id: "batch-types",
    title: "Batch Types",
    description: "Define reusable batch type classifications — actual batches will use these later.",
    icon: Clock,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/academic/batch-types",
    isPlaceholder: false,
  },
  {
    id: "batches",
    title: "Batches",
    description: "Define batch master data — program-specific batches with capacity, schedule and classification.",
    icon: BookOpenCheck,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/academic/batches",
    isPlaceholder: false,
  },
  {
    id: "subjects",
    title: "Subjects",
    description: "Define reusable academic subjects for programs, courses, batches and timetable.",
    icon: Atom,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/academic/subjects",
    isPlaceholder: false,
  },
  {
    id: "sections",
    title: "Sections",
    description: "Define classroom divisions — sections represent batch or classroom sub-divisions.",
    icon: LayoutGrid,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/academic/sections",
    isPlaceholder: false,
  },
  {
    id: "mediums",
    title: "Mediums",
    description: "Define teaching mediums — languages of instruction used across programs and batches.",
    icon: Languages,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/academic/mediums",
    isPlaceholder: false,
  },
  {
    id: "languages",
    title: "Languages",
    description: "Define languages offered as subjects or used for communication — distinct from mediums of instruction.",
    icon: Globe,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/academic/languages",
    isPlaceholder: false,
  },
  {
    id: "streams",
    title: "Streams",
    description: "Define specialization paths — academic disciplines and career tracks.",
    icon: Mountain,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/academic/streams",
    isPlaceholder: false,
  },
  {
    id: "semesters",
    title: "Semesters",
    description: "Define semester and trimester terms — semesters belong to academic sessions.",
    icon: BookCheck,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/academic/semesters",
    isPlaceholder: false,
  },
  {
    id: "terms",
    title: "Terms",
    description: "Define academic terms — terms are subdivisions of semesters or school years linked to sessions.",
    icon: Notebook,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/academic/terms",
    isPlaceholder: false,
  },
  {
    id: "classrooms", title: "Classrooms", description: "Define classrooms, capacity, and facilities across campuses.",
    icon: Home, color: "bg-[#f3e8ff]", iconColor: "text-[#a855f7]", status: "active" as const, href: "/studios/master-data/academic/classrooms",    isPlaceholder: false,
  },
];

const futureModules = [
  "Class Timetable",
  "Exam Schedule",
  "Holiday Calendar",
  "Curriculum Mapping",
  "Study Materials",
  "Result Configuration",
];

/* ── Page ── */

export default function MasterDataAcademic() {
  const [futureOpen, setFutureOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/studios/master-data">Master Data Studio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Academic Masters</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a1a2e] flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Academic Masters</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">
            Configure academic structure — sessions, courses, programs, and curricula.
          </p>
        </div>
      </div>

      {/* ── Section 1: Overview Cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {overviewCards.map((card) => (
            <OverviewStatCard key={card.id} {...card} />
          ))}
        </div>
      </div>

      {/* ── Section 2: Academic Masters Grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Academic Masters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.status === "active";
            return (
              <Card
                key={mod.id}
                className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${mod.color} shrink-0`}>
                      <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1a1a2e]">{mod.title}</h3>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] px-1.5 py-0 h-4 font-medium ${
                            isActive
                              ? "bg-[#e6f4ea] text-[#34a853] hover:bg-[#e6f4ea]"
                              : "bg-[#f1f3f4] text-[#9aa0a6] hover:bg-[#f1f3f4]"
                          }`}
                        >
                          {isActive ? "Active" : "Coming Soon"}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-[#5f6368] mt-1.5 leading-relaxed">
                        {mod.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`mt-3 h-7 text-[11px] font-medium px-0 ${
                          isActive
                            ? "text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
                            : "text-[#9aa0a6] cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (!mod.isPlaceholder) {
                            window.location.href = mod.href;
                          }
                        }}
                        disabled={mod.isPlaceholder}
                      >
                        Open
                        <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Future Modules ── */}
      <Collapsible open={futureOpen} onOpenChange={setFutureOpen}>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#9aa0a6]" />
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                    Upcoming Academic Masters
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-medium bg-[#f1f3f4] text-[#9aa0a6]"
                  >
                    {futureModules.length}
                  </Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#9aa0a6] transition-transform duration-200 ${
                    futureOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <CardDescription className="text-[11px] text-[#9aa0a6]">
                Future academic master data modules in development
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-5">
              <div className="flex flex-wrap gap-2">
                {futureModules.map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="text-[11px] px-3 py-1 font-normal text-[#5f6368] bg-[#f1f3f4] border border-[#e8eaed] opacity-60 cursor-not-allowed"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

/* ── Helpers ── */

function OverviewStatCard({
  title, description, icon: Icon, color, iconColor, totalRecords, activeRecords, href, isPlaceholder,
}: {
  title: string; description: string; icon: React.ElementType; color: string; iconColor: string;
  totalRecords: number; activeRecords: number; href: string; isPlaceholder: boolean;
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[12px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-[11px] text-[#9aa0a6] leading-snug">{description}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-[#5f6368]">
                Total: <span className="font-semibold text-[#1a1a2e]">{totalRecords}</span>
              </span>
              <span className="text-[11px] text-[#5f6368]">
                Active: <span className="font-semibold text-[#34a853]">{activeRecords}</span>
              </span>
            </div>
            <Button
              variant="ghost" size="sm"
              className={`mt-2 h-6 text-[10px] font-medium px-0 ${
                isPlaceholder
                  ? "text-[#9aa0a6] cursor-not-allowed"
                  : "text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
              }`}
              onClick={() => { if (!isPlaceholder) window.location.href = href; }}
              disabled={isPlaceholder}
            >
              Open
              <ArrowRight className="h-2.5 w-2.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          <div className={`p-2 rounded-lg ${color} shrink-0 ml-3`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
