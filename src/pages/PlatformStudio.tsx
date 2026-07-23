import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getAllPages, getPageById, getAllTables, getAllApis, getAllEngines,
  getAllAutomations, getAllWorkflows, getAllEvents, getAllComponents,
  getAllPermissions, getModules, getHealthIssues, getRouteTree,
  REGISTRY_SUMMARY, searchEverything, buildDependencyGraph,
} from "@/lib/platform-studio/registry";
import type { PageInfo, ModuleDef, SearchResult, ApiInfo, AutomationInfo, EngineInfo, WorkflowInfo, EventInfo, ComponentInfo, PermissionInfo, TableInfo, DevNoteType, FeatureFlag, RoadmapStatus } from "@/lib/platform-studio/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, Layers, Box, Cog, Database, FileJson, Cpu, Workflow,
  Shield, Route, AlertTriangle, Bug, Search, ChevronDown, ChevronRight,
  ArrowRight, ArrowDown, BarChart3, Flag, BookOpenText, GitBranch,
  ListChecks, Target, Plus, Edit3, Trash2, X, Circle,
} from "lucide-react";
import { useAppNavigate } from "@/hooks/use-app-navigate";

// ─── Tabs ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "overview", label: "Project Overview", icon: LayoutDashboard },
  { id: "architecture", label: "Architecture", icon: GitBranch },
  { id: "modules", label: "Module Explorer", icon: Layers },
  { id: "dependency", label: "Dependency Viewer", icon: GitBranch },
  { id: "progress", label: "Progress & Roadmap", icon: BarChart3 },
  { id: "database", label: "Database Explorer", icon: Database },
  { id: "apis", label: "API Explorer", icon: FileJson },
  { id: "engines", label: "Engines", icon: Cpu },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "components", label: "Components", icon: Cog },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "routes", label: "Routes", icon: Route },
  { id: "health", label: "Health", icon: AlertTriangle },
  { id: "dev-mode", label: "Dev Mode", icon: Bug },
];

// ─── Helpers ──────────────────────────────────────────────────────

function formatId(id: string) {
  return <span className="font-mono text-[9px] text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.5 rounded shrink-0">{id}</span>;
}

function TreeItem({ label, type, children, defaultOpen = false, badge, onClick }: {
  label: string; type: string; children?: React.ReactNode; defaultOpen?: boolean; badge?: string | number; onClick?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;
  return (
    <div>
      <button onClick={onClick || (() => setOpen(!open))} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#f1f3f4] rounded-md text-[13px] text-[#1a1a2e] group">
        {hasChildren ? (open ? <ChevronDown className="h-3 w-3 text-[#9aa0a6] shrink-0" /> : <ChevronRight className="h-3 w-3 text-[#9aa0a6] shrink-0" />) : <span className="w-3 shrink-0" />}
        <span className="text-[9px] font-medium text-[#5f6368] uppercase tracking-wider shrink-0">{type}</span>
        <span className="text-[12px] font-medium truncate">{label}</span>
        {badge !== undefined && <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-[#f1f3f4] text-[#5f6368]">{badge}</Badge>}
      </button>
      {open && hasChildren && <div className="ml-4 border-l border-[#e8eaed]">{children}</div>}
    </div>
  );
}

function SectionCard({ title, description, children, className = "" }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-[#e8eaed] shadow-sm bg-white ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#1a1a2e]">{title}</CardTitle>
        {description && <p className="text-[11px] text-[#9aa0a6] mt-0.5">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MetaBadge({ label, value, color = "bg-[#f1f3f4] text-[#5f6368]" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#fafafa] border border-[#e8eaed]">
      <span className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">{label}</span>
      <span className={`text-[13px] font-semibold px-1.5 py-0.5 rounded ${color}`}>{value}</span>
    </div>
  );
}

function FeatureFlagBadge({ flag }: { flag: FeatureFlag }) {
  const colors: Record<FeatureFlag, string> = {
    production_ready: "bg-[#e6f4ea] text-[#137333]",
    mvp: "bg-[#e8f0fe] text-[#1a73e8]",
    beta: "bg-[#fef7e0] text-[#e37400]",
    experimental: "bg-[#fce8e6] text-[#c5221f]",
    deprecated: "bg-[#f1f3f4] text-[#5f6368]",
    hidden: "bg-[#e8eaed] text-[#9aa0a6]",
  };
  const labels: Record<FeatureFlag, string> = {
    production_ready: "Production Ready", mvp: "MVP", beta: "Beta",
    experimental: "Experimental", deprecated: "Deprecated", hidden: "Hidden",
  };
  return <Badge className={`text-[9px] ${colors[flag]}`}>{labels[flag]}</Badge>;
}

function RoadmapBadge({ status }: { status: RoadmapStatus }) {
  const colors: Record<RoadmapStatus, string> = {
    completed: "bg-[#e6f4ea] text-[#137333]",
    current_sprint: "bg-[#e8f0fe] text-[#1a73e8]",
    next_sprint: "bg-[#fef7e0] text-[#e37400]",
    future: "bg-[#f1f3f4] text-[#5f6368]",
  };
  const labels: Record<RoadmapStatus, string> = {
    completed: "✓ Completed", current_sprint: "► Current Sprint", next_sprint: "○ Next Sprint", future: "◇ Future",
  };
  return <Badge className={`text-[9px] ${colors[status]}`}>{labels[status]}</Badge>;
}

function DevNoteBadge({ type }: { type: DevNoteType }) {
  const colors: Record<DevNoteType, string> = {
    note: "bg-[#e8f0fe] text-[#1a73e8]",
    bug: "bg-[#fce8e6] text-[#c5221f]",
    tech_debt: "bg-[#fef7e0] text-[#e37400]",
    todo: "bg-[#f3e8fd] text-[#7c3aed]",
    idea: "bg-[#e6f4ea] text-[#137333]",
  };
  return <Badge className={`text-[9px] ${colors[type]}`}>{type.replace("_", " ")}</Badge>
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-[#34a853]" : pct >= 50 ? "bg-[#fbbc04]" : pct >= 20 ? "bg-[#e8710a]" : "bg-[#ea4335]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-medium text-[#5f6368] w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Architecture Flow ────────────────────────────────────────────

function ArchitectureSection() {
  const flows = [
    { from: "Organization", to: "Departments → Teams → Users", icon: "🏢", color: "#1a1a2e" },
    { from: "CRM", to: "Leads → Pipeline → Conversion", icon: "👥", color: "#ea4335" },
    { from: "Lead Lifecycle", to: "Lead Created → Counselling → Enrolled → Payment → Verified → Converted", icon: "🔄", color: "#34a853" },
    { from: "Sales", to: "Opportunities → Quotations → Payments → Collection", icon: "📈", color: "#fbbc04" },
    { from: "Payments", to: "Recorded → Verification Request → Verified/Rejected → Auto-Conversion", icon: "💳", color: "#a855f7" },
    { from: "Student", to: "Lead → Enrolled → Academic → Graduation (future)", icon: "🎓", color: "#06b6d4" },
    { from: "Academic", to: "Verticals → Programs → Batches → Sessions → Classrooms", icon: "📚", color: "#0d9488" },
    { from: "Finance", to: "Fee Categories → Payments → Invoices → Reports (future)", icon: "💰", color: "#e8710a" },
  ];

  const engines = getAllEngines();

  return (
    <div className="space-y-6">
      <SectionCard title="System Architecture Flow" description="Data flow across EEOS modules">
        <div className="space-y-3">
          {flows.map((flow, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[#e8eaed] hover:bg-[#fafafa] transition-colors">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: flow.color + "15" }}>
                <span>{flow.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[#1a1a2e]">{flow.from}</span>
                  <ArrowRight className="h-3 w-3 text-[#9aa0a6]" />
                </div>
                <p className="text-[11px] text-[#5f6368]">{flow.to}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Engine Architecture" description="How engines connect modules">
        <div className="space-y-2">
          {engines.map((eng) => (
            <div key={eng.id} className="border border-[#e8eaed] rounded-lg p-3 hover:bg-[#fafafa] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                {formatId(eng.id)}
                <span className="text-[13px] font-medium text-[#1a1a2e]">{eng.name}</span>
                <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{eng.module}</Badge>
              </div>
              <p className="text-[11px] text-[#5f6368] mb-2">{eng.purpose}</p>
              <div className="flex flex-wrap gap-1.5">
                {eng.tables.map(t => <Badge key={t} variant="outline" className="text-[9px] text-[#5f6368]">{t}</Badge>)}
                {eng.events.map(e => <Badge key={e} className="text-[9px] bg-[#e8f0fe] text-[#1a73e8]">{e}</Badge>)}
                {eng.consumers.map(c => <span key={c} className="text-[9px] text-[#9aa0a6] bg-[#f1f3f4] px-1.5 py-0.5 rounded">→ {c}</span>)}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Dependency Viewer ────────────────────────────────────────────

function DependencySection() {
  const graph = buildDependencyGraph();
  const pages = getAllPages();

  return (
    <SectionCard title="Page Dependency Graph" description="Forward dependencies (what each page uses) and reverse dependents (who depends on this page)">
      <div className="space-y-2">
        {graph.pages.map((node) => {
          const pageInfo = pages.find(p => p.id === node.id);
          return (
            <div key={node.id} className="border border-[#e8eaed] rounded-lg p-3 hover:bg-[#fafafa] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                {formatId(node.id)}
                <span className="text-[13px] font-medium text-[#1a1a2e]">{node.name}</span>
                <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{pageInfo?.module}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[#9aa0a6] font-medium">Uses:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pageInfo?.queries.map(q => <Badge key={q} className="text-[9px] bg-[#e8f0fe] text-[#1a73e8]">{q}</Badge>)}
                    {pageInfo?.mutations.map(m => <Badge key={m} className="text-[9px] bg-[#fce8e6] text-[#c5221f]">{m}</Badge>)}
                    {pageInfo?.tables.map(t => <Badge key={t} className="text-[9px] bg-[#e6f4ea] text-[#137333]">{t}</Badge>)}
                  </div>
                </div>
                <div>
                  <span className="text-[#9aa0a6] font-medium">Depended by:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {node.dependents.length > 0 ? node.dependents.map(d => {
                      const dp = pages.find(p => p.id === d);
                      return <Badge key={d} variant="outline" className="text-[9px] text-[#5f6368]">{dp?.name || d}</Badge>;
                    }) : <span className="text-[#dadce0] text-[10px]">None</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Progress & Roadmap ───────────────────────────────────────────

function ProgressSection() {
  const modules = getModules();

  return (
    <div className="space-y-6">
      <SectionCard title="Platform Progress" description="Completion percentage per module">
        <div className="space-y-3">
          {modules.map((mod) => (
            <div key={mod.id} className="p-3 border border-[#e8eaed] rounded-lg hover:bg-[#fafafa] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#1a1a2e]">{mod.name}</span>
                  <FeatureFlagBadge flag={mod.featureFlag} />
                </div>
                <span className="text-[11px] text-[#5f6368]">{mod.pages.length} pages</span>
              </div>
              <ProgressBar pct={mod.progress} />
              <p className="text-[11px] text-[#5f6368] mt-1.5">{mod.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Module Roadmap" description="Completed, current, and planned work per module">
        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="border border-[#e8eaed] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-semibold text-[#1a1a2e]">{mod.name}</span>
                <ProgressBar pct={mod.progress} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {mod.roadmap.map((phase) => (
                  <div key={phase.status} className="p-2 rounded-md bg-[#fafafa] border border-[#e8eaed]">
                    <RoadmapBadge status={phase.status} />
                    <ul className="mt-1 space-y-0.5">
                      {phase.items.map((item, i) => (
                        <li key={i} className="text-[10px] text-[#5f6368] flex items-start gap-1">
                          <span className="text-[#9aa0a6] mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Page Inspector Drawer ────────────────────────────────────────

function PageInspector({ page, open, onClose }: { page: PageInfo | null; open: boolean; onClose: () => void }) {
  if (!page) return null;
  const depGraph = buildDependencyGraph();
  const node = depGraph.pages.find(n => n.id === page.id);
  const mod = getModules().find(m => m.id === `MOD-${page.module.toUpperCase()}`);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2">
            {formatId(page.id)}
            <SheetTitle className="text-base">{page.name}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* Overview */}
          <SectionCard title="Overview">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-[#9aa0a6]">Route:</span> <code className="text-[#1a73e8]">{page.route}</code></div>
              <div><span className="text-[#9aa0a6]">File:</span> <code className="text-[#e8710a]">{page.filePath}</code></div>
              <div><span className="text-[#9aa0a6]">Layout:</span> <code>{page.layout}</code></div>
              <div><span className="text-[#9aa0a6]">Module:</span> <code>{page.module}</code></div>
            </div>
          </SectionCard>

          {/* Components/Sections */}
          <SectionCard title={`UI Elements (${page.sections.length})`}>
            <div className="flex flex-wrap gap-1">
              {page.sections.map(s => formatId(s.id))}
            </div>
          </SectionCard>

          {/* APIs */}
          <SectionCard title={`Queries (${page.queries.length})`}>
            <div className="flex flex-wrap gap-1">
              {page.queries.map(q => <Badge key={q} className="text-[9px] bg-[#e8f0fe] text-[#1a73e8]">{q}</Badge>)}
              {page.queries.length === 0 && <span className="text-[10px] text-[#9aa0a6]">None</span>}
            </div>
          </SectionCard>

          <SectionCard title={`Mutations (${page.mutations.length})`}>
            <div className="flex flex-wrap gap-1">
              {page.mutations.map(m => <Badge key={m} className="text-[9px] bg-[#fce8e6] text-[#c5221f]">{m}</Badge>)}
              {page.mutations.length === 0 && <span className="text-[10px] text-[#9aa0a6]">None</span>}
            </div>
          </SectionCard>

          {/* Tables */}
          <SectionCard title={`Collections (${page.tables.length})`}>
            <div className="flex flex-wrap gap-1">
              {page.tables.map(t => <Badge key={t} className="text-[9px] bg-[#e6f4ea] text-[#137333]">{t}</Badge>)}
            </div>
          </SectionCard>

          {/* Permissions */}
          <SectionCard title="Permissions">
            <div className="flex flex-wrap gap-1">
              {page.permissions.map(p => <Badge key={p} className="text-[9px] bg-[#f3e8fd] text-[#7c3aed]">{p}</Badge>)}
            </div>
          </SectionCard>

          {/* Events */}
          <SectionCard title="Events">
            <div className="flex flex-wrap gap-1">
              {getAllEvents().filter(ev => ev.consumers.some(c => c.includes(page.name)) || ev.producers.includes(page.module)).map(ev =>
                <Badge key={ev.id} className="text-[9px] bg-[#fef7e0] text-[#e37400]">{ev.id}</Badge>
              )}
              <span className="text-[10px] text-[#9aa0a6] ml-1">(matching producers/consumers)</span>
            </div>
          </SectionCard>

          {/* Automations */}
          <SectionCard title="Automations">
            <div className="space-y-1">
              {getAllAutomations().filter(a => a.module === page.module).map(a =>
                <div key={a.id} className="text-[11px] flex items-center gap-1"><span className="text-[#5f6368]">{formatId(a.id)}</span><span>{a.name}</span></div>
              )}
              {getAllAutomations().filter(a => a.module === page.module).length === 0 && <span className="text-[10px] text-[#9aa0a6]">None for this module</span>}
            </div>
          </SectionCard>

          {/* Reverse Dependencies */}
          <SectionCard title="Who Uses This Page">
            <div className="flex flex-wrap gap-1">
              {node?.dependents.map(d => {
                const dp = getAllPages().find(p => p.id === d);
                return <Badge key={d} variant="outline" className="text-[9px] text-[#5f6368]">{dp?.name || d}</Badge>;
              }) || <span className="text-[10px] text-[#9aa0a6]">No reverse dependencies</span>}
            </div>
          </SectionCard>

          {/* Dev Notes */}
          <SectionCard title="Development Notes">
            <div className="space-y-1.5">
              {page.devNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-1.5 p-1.5 bg-[#fafafa] rounded">
                  <DevNoteBadge type={note.type} />
                  <span className="text-[11px] text-[#5f6368]">{note.text}</span>
                </div>
              ))}
              {page.devNotes.length === 0 && <span className="text-[10px] text-[#9aa0a6]">No notes</span>}
            </div>
          </SectionCard>

          {/* Module-level notes */}
          {mod && mod.devNotes.length > 0 && (
            <SectionCard title={`Module Notes (${mod.name})`}>
              <div className="space-y-1.5">
                {mod.devNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-1.5 p-1.5 bg-[#fafafa] rounded">
                    <DevNoteBadge type={note.type} />
                    <span className="text-[11px] text-[#5f6368]">{note.text}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Architecture */}
          {page.architecture && (
            <SectionCard title="Architecture">
              <div className="p-2 bg-[#fafafa] rounded border border-[#e8eaed]">
                <p className="text-[12px] font-medium text-[#1a1a2e]">{page.architecture.flow}</p>
                <p className="text-[11px] text-[#5f6368] mt-1">{page.architecture.description}</p>
              </div>
            </SectionCard>
          )}

          {/* Feature Flag */}
          {page.featureFlag && (
            <SectionCard title="Feature Flag">
              <FeatureFlagBadge flag={page.featureFlag} />
            </SectionCard>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Overview ─────────────────────────────────────────────────────

function OverviewSection({ onInspect }: { onInspect: (page: PageInfo) => void }) {
  const m = REGISTRY_SUMMARY;
  const pages = getAllPages();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaBadge label="Version" value={m.version} color="bg-[#e8f0fe] text-[#1a73e8]" />
        <MetaBadge label="Pages" value={m.totalPages} color="bg-[#e6f4ea] text-[#137333]" />
        <MetaBadge label="Components" value={m.totalComponents} color="bg-[#fce8e6] text-[#c5221f]" />
        <MetaBadge label="Tables" value={m.totalTables} color="bg-[#fef7e0] text-[#e37400]" />
        <MetaBadge label="APIs" value={m.totalApis} color="bg-[#e8f0fe] text-[#1a73e8]" />
        <MetaBadge label="Engines" value={m.totalEngines} color="bg-[#f3e8fd] text-[#7c3aed]" />
        <MetaBadge label="Workflows" value={m.totalWorkflows} color="bg-[#e6f4ea] text-[#137333]" />
        <MetaBadge label="Events" value={m.totalEvents} color="bg-[#fce8e6] text-[#c5221f]" />
        <MetaBadge label="Automations" value={m.totalAutomations} color="bg-[#fef7e0] text-[#e37400]" />
        <MetaBadge label="Permissions" value={m.totalPermissions} color="bg-[#f3e8fd] text-[#7c3aed]" />
      </div>

      <SectionCard title="Quick Module Overview" description="Click any page to inspect details">
        <div className="space-y-1">
          {getModules().map(mod => (
            <div key={mod.id} className="p-2 border border-[#e8eaed] rounded-lg hover:bg-[#fafafa]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#1a1a2e]">{mod.name}</span>
                  <FeatureFlagBadge flag={mod.featureFlag} />
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar pct={mod.progress} />
                  <span className="text-[11px] text-[#5f6368]">{mod.pages.length} pages</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {mod.pages.map(pid => {
                  const p = pages.find(pp => pp.id === pid);
                  return p ? (
                    <button key={pid} onClick={() => onInspect(p)}
                      className="text-[10px] text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.5 rounded hover:bg-[#d2e3fc] transition-colors cursor-pointer">
                      {p.name}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Module Explorer (with click-to-inspect) ──────────────────────

function ModuleExplorerSection({ onInspect }: { onInspect: (page: PageInfo) => void }) {
  const pages = getAllPages();
  const modules = getModules();

  return (
    <div className="space-y-4">
      {modules.map(mod => {
        const modPages = pages.filter(p => mod.pages.includes(p.id));
        return (
          <SectionCard key={mod.id} title={mod.name} description={mod.description}>
            <div className="flex items-center gap-2 mb-2">
              <FeatureFlagBadge flag={mod.featureFlag} />
              <ProgressBar pct={mod.progress} />
              <span className="text-[10px] text-[#9aa0a6]">{mod.pages.length} pages</span>
            </div>
            {modPages.length === 0 ? (
              <p className="text-[11px] text-[#9aa0a6] italic">Master data only — no operational pages yet</p>
            ) : (
              <div className="space-y-1">
                {modPages.map(page => (
                  <button key={page.id} onClick={() => onInspect(page)}
                    className="w-full text-left border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa] transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {formatId(page.id)}
                        <span className="text-[12px] font-medium text-[#1a1a2e]">{page.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[8px] text-[#5f6368]">{page.route}</Badge>
                        <ChevronRight className="h-3 w-3 text-[#9aa0a6]" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1 text-[10px] text-[#5f6368]">
                      <span>{page.sections.length} elements</span>
                      <span>{page.queries.length} queries</span>
                      <span>{page.mutations.length} mutations</span>
                      <span>{page.tables.length} tables</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}

// ─── Database Explorer ────────────────────────────────────────────

function DatabaseSection() {
  const tables = getAllTables();
  return (
    <div className="space-y-4">
      {getModules().map(mod => {
        const modTables = tables.filter(t => t.module === mod.name);
        if (modTables.length === 0) return null;
        return (
          <SectionCard key={mod.id} title={`${mod.name} (${modTables.length} tables)`}>
            <div className="space-y-2">
              {modTables.map(table => (
                <div key={table.id} className="border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {formatId(table.id)}
                    <code className="text-[12px] font-medium text-[#1a1a2e]">{table.name}</code>
                  </div>
                  <p className="text-[10px] text-[#5f6368] mb-1">{table.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span className="text-[#9aa0a6]">Fields:</span> {table.fields.length}</div>
                    <div><span className="text-[#9aa0a6]">Indexes:</span> {table.indexes.length}</div>
                    <div><span className="text-[#9aa0a6]">Queries:</span> {table.queries.length}</div>
                    <div><span className="text-[#9aa0a6]">Mutations:</span> {table.mutations.length}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {table.fields.slice(0, 5).map(f => <Badge key={f.name} variant="outline" className="text-[8px] text-[#9aa0a6]">{f.name}</Badge>)}
                    {table.fields.length > 5 && <span className="text-[9px] text-[#9aa0a6]">+{table.fields.length - 5} more</span>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

// ─── Components Section ───────────────────────────────────────────

function ComponentsSection() {
  const comps = getAllComponents();
  const categories = ["layout", "data", "shared", "ui"];

  return (
    <div className="space-y-4">
      {categories.map(cat => {
        const items = comps.filter(c => c.category === cat);
        if (items.length === 0) return null;
        return (
          <SectionCard key={cat} title={cat.charAt(0).toUpperCase() + cat.slice(1)}>
            <div className="space-y-1">
              {items.map(comp => (
                <div key={comp.id} className="border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa]">
                  <div className="flex items-center gap-2 mb-1">
                    {formatId(comp.id)}
                    <span className="text-[12px] font-medium text-[#1a1a2e]">{comp.name}</span>
                    <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{comp.module}</Badge>
                  </div>
                  <p className="text-[10px] text-[#5f6368]"><code className="text-[#e8710a]">{comp.path}</code></p>
                  <div className="text-[10px] text-[#5f6368] flex gap-1 mt-0.5">
                    <span className="text-[#9aa0a6]">Deps:</span>
                    {comp.dependencies.map((d, i) => <Badge key={i} variant="outline" className="text-[8px] text-[#9aa0a6]">{d}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

// ─── Workflows Section ────────────────────────────────────────────

function WorkflowsSection() {
  const workflows = getAllWorkflows();

  return (
    <SectionCard title="Workflow Diagrams" description="End-to-end business processes">
      <div className="space-y-4">
        {workflows.map(wf => (
          <div key={wf.id} className="border border-[#e8eaed] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {formatId(wf.id)}
              <span className="text-[13px] font-medium text-[#1a1a2e]">{wf.name}</span>
              <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{wf.module}</Badge>
            </div>
            <p className="text-[11px] text-[#5f6368] mb-2">{wf.description}</p>
            <div className="flex items-center gap-1 mb-2 text-[11px] flex-wrap">
              {wf.steps.map((step, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-[#f1f3f4] rounded text-[10px] text-[#5f6368]">{step}</span>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-[#9aa0a6]" />}
                </span>
              ))}
            </div>
            <div className="flex gap-2 text-[10px]">
              <div><span className="text-[#9aa0a6]">Automations:</span> {wf.automations.map(a => formatId(a))}</div>
              <div><span className="text-[#9aa0a6]">Engines:</span> {wf.engines.map(e => formatId(e))}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── API Explorer ─────────────────────────────────────────────────

function ApisSection() {
  const apis = getAllApis();
  const modules = [...new Set(apis.map(a => a.module))];

  return (
    <div className="space-y-4">
      {modules.map(mod => (
        <SectionCard key={mod} title={mod}>
          <div className="space-y-1">
            {apis.filter(a => a.module === mod).map(api => (
              <div key={api.id} className="border border-[#e8eaed] rounded-lg p-2 hover:bg-[#fafafa]">
                <div className="flex items-center gap-2 mb-1">
                  {formatId(api.id)}
                  <Badge className={`text-[8px] ${api.type === "query" ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#fce8e6] text-[#c5221f]"}`}>{api.type}</Badge>
                  <code className="text-[11px] font-mono text-[#1a1a2e]">{api.name}</code>
                  <Badge variant="outline" className="text-[8px] text-[#5f6368]">{api.permission}</Badge>
                </div>
                <div className="text-[10px] text-[#5f6368] flex gap-3">
                  <span><span className="text-[#9aa0a6]">Params:</span> <code className="text-[#e8710a]">{api.parameters}</code></span>
                  <span><span className="text-[#9aa0a6]">Returns:</span> <code className="text-[#137333]">{api.returnType}</code></span>
                  <span><span className="text-[#9aa0a6]">Used by:</span> {api.usedBy.map(p => formatId(p))}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

// ─── Engines Section ──────────────────────────────────────────────

function EnginesSection() {
  const engines = getAllEngines();
  return (
    <SectionCard title="Engine Registry">
      <div className="space-y-2">
        {engines.map(eng => (
          <div key={eng.id} className="border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa]">
            <div className="flex items-center gap-2 mb-1">
              {formatId(eng.id)}
              <span className="text-[12px] font-medium text-[#1a1a2e]">{eng.name}</span>
              <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{eng.module}</Badge>
            </div>
            <p className="text-[10px] text-[#5f6368] mb-1">{eng.purpose}</p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {eng.tables.map(t => <Badge key={t} className="text-[8px] bg-[#e6f4ea] text-[#137333]">{t}</Badge>)}
              {eng.events.map(e => <Badge key={e} className="text-[8px] bg-[#fef7e0] text-[#e37400]">{e}</Badge>)}
              {eng.consumers.map(c => <span key={c} className="text-[8px] text-[#9aa0a6]">→{c}</span>)}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Permissions Section ──────────────────────────────────────────

function PermissionsSection() {
  const permissions = getAllPermissions();
  return (
    <SectionCard title="Permission Matrix">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[9px] text-[#9aa0a6] uppercase tracking-wider border-b border-[#e8eaed]">
              <th className="text-left py-2 px-2">ID</th>
              <th className="text-left py-2 px-2">Scope</th>
              <th className="text-center py-2 px-2">Super Admin</th>
              <th className="text-center py-2 px-2">Admin</th>
              <th className="text-center py-2 px-2">Manager</th>
              <th className="text-center py-2 px-2">Staff</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(perm => (
              <tr key={perm.id} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                <td className="py-2 px-2">{formatId(perm.id)}</td>
                <td className="py-2 px-2 font-medium text-[#1a1a2e]">{perm.page}</td>
                <td className="py-2 px-2 text-center">{perm.superAdmin ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
                <td className="py-2 px-2 text-center">{perm.admin ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
                <td className="py-2 px-2 text-center">{perm.manager ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
                <td className="py-2 px-2 text-center">{perm.staff ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ─── Routes Section ───────────────────────────────────────────────

function RoutesSection() {
  const routes = getRouteTree();
  return (
    <SectionCard title="Route Hierarchy" description="Complete route tree with layouts and guards">
      <div className="space-y-1">
        {routes.map(route => (
          <div key={route.path} className="border border-[#e8eaed] rounded-lg p-2 hover:bg-[#fafafa]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-[#1a73e8]">{route.path}</code>
                <span className="text-[12px] font-medium text-[#1a1a2e]">{route.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[8px] bg-[#f1f3f4] text-[#5f6368]">{route.layout}</Badge>
                {route.guards.map(g => <Badge key={g} className={`text-[8px] ${g === "auth" ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#fce8e6] text-[#c5221f]"}`}>{g}</Badge>)}
              </div>
            </div>
            <p className="text-[10px] text-[#9aa0a6]">File: <code className="text-[#e8710a]">{route.filePath}</code></p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Health Section ───────────────────────────────────────────────

function HealthSection() {
  const issues = getHealthIssues();
  const typeLabels: Record<string, string> = {
    missing_doc: "Missing Doc", broken_ref: "Broken Ref", unused_component: "Unused Component",
    unused_api: "Unused API", dead_page: "Dead Page", todo: "TODO",
  };
  return (
    <SectionCard title="Project Health" description={`${issues.length} issues found`}>
      <div className="space-y-1.5">
        {issues.map((issue, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-md hover:bg-[#fafafa] border border-[#e8eaed]">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${issue.severity === "high" ? "bg-[#ea4335]" : issue.severity === "medium" ? "bg-[#fbbc04]" : "bg-[#9aa0a6]"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Badge className={`text-[8px] ${issue.severity === "high" ? "bg-[#fce8e6] text-[#c5221f]" : issue.severity === "medium" ? "bg-[#fef7e0] text-[#e37400]" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
                  {typeLabels[issue.type] || issue.type}
                </Badge>
                <span className="text-[9px] text-[#9aa0a6] capitalize">{issue.severity}</span>
              </div>
              <p className="text-[11px] text-[#1a1a2e]">{issue.message}</p>
              {issue.location && <p className="text-[9px] text-[#9aa0a6] mt-0.5">{issue.location}</p>}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Dev Mode Section ─────────────────────────────────────────────

function DevModeSection() {
  return (
    <SectionCard title="Developer Mode" description="Ctrl+Shift+D to toggle overlay on any page">
      <div className="p-4 bg-[#fafafa] border border-[#e8eaed] rounded-lg mb-4">
        <h3 className="text-[13px] font-medium text-[#1a1a2e] mb-2">How to Use</h3>
        <ol className="space-y-2 text-[12px] text-[#5f6368]">
          <li className="flex items-start gap-2">
            <Badge className="text-[8px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">1</Badge>
            <span>Press <kbd className="px-1.5 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[10px] font-mono">Ctrl+Shift+D</kbd> to enable</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge className="text-[8px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">2</Badge>
            <span>A red banner and floating info panel appear showing Page ID, Route, APIs, Tables, and Permissions</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge className="text-[8px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">3</Badge>
            <span>Navigate between pages — the panel updates automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge className="text-[8px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">4</Badge>
            <span>Press <kbd className="px-1.5 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[10px] font-mono">Ctrl+Shift+D</kbd> again to toggle off</span>
          </li>
        </ol>
      </div>
    </SectionCard>
  );
}

// ═════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════════

export default function PlatformStudio() {
  const { user } = useAuth();
  const isAllowed = user?.role === "super_admin";
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectPage, setInspectPage] = useState<PageInfo | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);

  const searchResults = searchQuery.trim() ? searchEverything(searchQuery) : [];
  const pages = getAllPages();

  const handleInspect = (page: PageInfo) => {
    setInspectPage(page);
    setInspectOpen(true);
  };

  const renderSection = () => {
    if (searchResults.length > 0) {
      return (
        <SectionCard title={`Search Results (${searchResults.length})`} description={`Matches for "${searchQuery}"`}>
          <div className="space-y-1">
            {searchResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 border border-[#e8eaed] rounded-md hover:bg-[#fafafa] text-[11px]">
                <Badge variant="secondary" className="text-[8px] bg-[#f1f3f4] text-[#5f6368] shrink-0">{r.type}</Badge>
                {r.id && <span className="text-[9px] text-[#1a73e8] font-mono shrink-0">{r.id}</span>}
                <span className="font-medium text-[#1a1a2e] truncate">{r.name}</span>
                <span className="text-[#9aa0a6] text-[10px] truncate ml-auto">{r.match}</span>
                {r.type === "Page" && (
                  <button onClick={() => { const p = pages.find(pp => pp.id === r.id); if (p) handleInspect(p); }}
                    className="text-[9px] text-[#1a73e8] hover:underline shrink-0">Inspect</button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      );
    }

    switch (activeTab) {
      case "overview": return <OverviewSection onInspect={handleInspect} />;
      case "architecture": return <ArchitectureSection />;
      case "modules": return <ModuleExplorerSection onInspect={handleInspect} />;
      case "dependency": return <DependencySection />;
      case "progress": return <ProgressSection />;
      case "database": return <DatabaseSection />;
      case "apis": return <ApisSection />;
      case "engines": return <EnginesSection />;
      case "workflows": return <WorkflowsSection />;
      case "components": return <ComponentsSection />;
      case "permissions": return <PermissionsSection />;
      case "routes": return <RoutesSection />;
      case "health": return <HealthSection />;
      case "dev-mode": return <DevModeSection />;
      default: return <div className="text-center py-8 text-[13px] text-[#9aa0a6]">Select a section</div>;
    }
  };

  if (!isAllowed) {
    return (
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="py-12">
          <div className="text-center">
            <Shield className="h-12 w-12 text-[#9aa0a6] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1a1a2e] mb-1">Access Restricted</h2>
            <p className="text-[13px] text-[#5f6368]">Platform Studio is only available to Super Admin and CEO roles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-[180px] shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-0.5">
            <div className="text-[9px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pb-2">
              Platform Studio v2
            </div>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => { setActiveTab(section.id); setSearchQuery(""); }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                    activeTab === section.id && !searchQuery
                      ? "bg-[#f1f3f4] text-[#1a1a2e]"
                      : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Mobile tabs */}
          <div className="lg:hidden flex gap-1 overflow-x-auto pb-2">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => { setActiveTab(s.id); setSearchQuery(""); }}
                className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap ${
                  activeTab === s.id ? "bg-[#f1f3f4] text-[#1a1a2e]" : "text-[#5f6368]"
                }`}>{s.label}</button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
            <Input
              placeholder="Search pages, tables, APIs, components, engines, workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[12px]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#5f6368] text-[10px]">
                Clear
              </button>
            )}
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="pr-2">{renderSection()}</div>
          </ScrollArea>
        </div>
      </div>

      {/* Page Inspector Drawer */}
      <PageInspector page={inspectPage} open={inspectOpen} onClose={() => setInspectOpen(false)} />
    </>
  );
}
