import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  GraduationCap,
  School,
  BookType,
  Layers,
  DoorOpen,
  CalendarDays,
  Search,
  Plus,
  Users,
  Clock,
  Building2,
  Monitor,
  Cpu,
  Sparkles,
  Briefcase,
  BookCheck,
} from "lucide-react";

// ─── Icon map for entity types ───────────────────────────────────
const ENTITY_ICONS: Record<string, React.ElementType> = {
  Programs: BookOpen,
  "Batch Types": Layers,
  Batches: GraduationCap,
  Subjects: BookType,
  Sections: DoorOpen,
  Classrooms: Building2,
  Sessions: CalendarDays,
};

// ─── AcademicDatabase ─────────────────────────────────────────────
export default function AcademicDatabase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("programs");
  const [search, setSearch] = useState("");

  // Fetch all academic data
  const programs = useQuery(api.academicPrograms.listAcademicPrograms);
  const batchTypes = useQuery(api.academicBatchTypes.listAcademicBatchTypes);
  const batches = useQuery(api.academicBatches.listAcademicBatches);
  const subjects = useQuery(api.academicSubjects.listAcademicSubjects);
  const sections = useQuery(api.academicSections.listAcademicSections);
  const classrooms = useQuery(api.academicClassrooms.list);
  const sessions = useQuery(api.academicSessions.listAcademicSessions);

  // Filter helpers
  const filterItems = <T extends { name?: string; code?: string }>(
    items: T[] | undefined,
  ) =>
    (items || []).filter(
      (i) =>
        !search ||
        (i.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.code || "").toLowerCase().includes(search.toLowerCase()),
    );

  // Stats counts
  const activePrograms =
    programs?.filter((p) => p.isActive !== false).length ?? 0;
  const activeBatches = batches?.filter((b) => b.active !== false).length ?? 0;
  const activeSubjects =
    subjects?.filter((s) => s.isActive !== false).length ?? 0;
  const totalSections = sections?.length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage programs, batches, subjects, sections, classrooms & sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search academic data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{activePrograms}</span>
              <BookOpen className="h-8 w-8 text-blue-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {programs ? programs.length - activePrograms : 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{activeBatches}</span>
              <GraduationCap className="h-8 w-8 text-emerald-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {batches ? batches.length - activeBatches : 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{activeSubjects}</span>
              <BookType className="h-8 w-8 text-purple-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subjects ? subjects.length - activeSubjects : 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{totalSections}</span>
              <Layers className="h-8 w-8 text-amber-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sessions?.length ?? 0} academic sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Entity Tabs ──────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="programs" className="gap-2">
            <BookOpen className="h-4 w-4" /> Programs
          </TabsTrigger>
          <TabsTrigger value="batchTypes" className="gap-2">
            <Layers className="h-4 w-4" /> Batch Types
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2">
            <GraduationCap className="h-4 w-4" /> Batches
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2">
            <BookType className="h-4 w-4" /> Subjects
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <DoorOpen className="h-4 w-4" /> Sections
          </TabsTrigger>
          <TabsTrigger value="classrooms" className="gap-2">
            <Building2 className="h-4 w-4" /> Classrooms
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Sessions
          </TabsTrigger>
        </TabsList>

        {/* ── Programs Tab ──────────────────────────────────── */}
        <TabsContent value="programs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(programs).map((p) => (
              <Card key={p._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/academic?programId=${p._id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md" style={{ backgroundColor: p.color + "20" }}>
                        <BookOpen className="h-4 w-4" style={{ color: p.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{p.name}</CardTitle>
                        <CardDescription className="text-xs">{p.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={p.isActive ? "default" : "secondary"} className="text-[10px]">
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.duration} {p.durationUnit}</span>
                    <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {p.deliveryMode}</span>
                    <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {p.programType}</span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {programs && filterItems(programs).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                No programs found{search ? ` matching "${search}"` : ""}
              </p>
            )}
            {!programs && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                Loading programs...
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Batch Types Tab ───────────────────────────────── */}
        <TabsContent value="batchTypes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(batchTypes).map((bt) => (
              <Card key={bt._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md" style={{ backgroundColor: bt.color + "20" }}>
                        <Layers className="h-4 w-4" style={{ color: bt.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{bt.name}</CardTitle>
                        <CardDescription className="text-xs">{bt.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={bt.isActive ? "default" : "secondary"} className="text-[10px]">
                      {bt.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {bt.deliveryMode}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {bt.timingCategory}</span>
                  </div>
                  {bt.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{bt.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Batches Tab ───────────────────────────────────── */}
        <TabsContent value="batches" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(batches).map((b) => (
              <Card key={b._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/academic?batchId=${b._id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md" style={{ backgroundColor: b.color + "20" }}>
                        <GraduationCap className="h-4 w-4" style={{ color: b.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{b.name}</CardTitle>
                        <CardDescription className="text-xs">{b.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={b.active ? "default" : "secondary"} className="text-[10px]">
                      {b.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Cap: {b.capacity ?? "—"}</span>
                    <span className="flex items-center gap-1"><BookCheck className="h-3 w-3" /> Seq: {b.sequence}</span>
                  </div>
                  {b.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Subjects Tab ──────────────────────────────────── */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(subjects).map((s) => (
              <Card key={s._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md" style={{ backgroundColor: s.color + "20" }}>
                        <BookType className="h-4 w-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{s.name}</CardTitle>
                        <CardDescription className="text-xs">{s.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={s.isActive ? "default" : "secondary"} className="text-[10px]">
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {s.category}</span>
                    <span className="flex items-center gap-1"><BookCheck className="h-3 w-3" /> {s.subjectType}</span>
                    {s.isTheory && <Badge variant="outline" className="text-[9px] px-1">Theory</Badge>}
                    {s.isPractical && <Badge variant="outline" className="text-[9px] px-1">Practical</Badge>}
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Sections Tab ──────────────────────────────────── */}
        <TabsContent value="sections" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filterItems(sections).map((s) => (
              <Card key={s._id} className="hover:shadow-md transition-shadow text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-2 p-2 rounded-full w-fit" style={{ backgroundColor: s.color + "20" }}>
                    <DoorOpen className="h-6 w-6" style={{ color: s.color }} />
                  </div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.code}</p>
                  <Badge variant={s.active ? "default" : "secondary"} className="mt-2 text-[9px]">
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Classrooms Tab ────────────────────────────────── */}
        <TabsContent value="classrooms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterItems(classrooms).map((c) => (
              <Card key={c._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md" style={{ backgroundColor: c.color + "20" }}>
                      <Building2 className="h-4 w-4" style={{ color: c.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{c.name}</CardTitle>
                      <CardDescription className="text-xs">{c.code}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{c.building} • Floor {c.floor} • Room {c.roomNumber}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.capacity}</span>
                    {c.hasMultimedia && <Badge variant="outline" className="text-[9px]">AV</Badge>}
                    {c.hasAirConditioning && <Badge variant="outline" className="text-[9px]">AC</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Sessions Tab ──────────────────────────────────── */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filterItems(sessions).map((s) => (
              <Card key={s._id} className={`hover:shadow-md transition-shadow ${s.isCurrent ? "ring-2 ring-primary/20" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md" style={{ backgroundColor: s.color + "20" }}>
                        <CalendarDays className="h-4 w-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{s.name}</CardTitle>
                        <CardDescription className="text-xs">{s.code}</CardDescription>
                      </div>
                    </div>
                    {s.isCurrent && (
                      <Badge className="text-[9px] bg-emerald-500">Current</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{s.academicYear}</p>
                    <p className="text-[10px]">
                      {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const __checkCopy: number = "should fail";
