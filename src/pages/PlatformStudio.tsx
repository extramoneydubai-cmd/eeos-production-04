import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  PLATFORM_METADATA,
  searchPlatform,
  platformPages,
  platformTables,
  platformApis,
  platformEngines,
  platformAutomations,
  platformComponents,
  platformPermissions,
  routeTree,
  healthIssues,
} from "@/lib/platform-studio-data";
import type { PageSection, TableInfo, ApiInfo, EngineInfo, AutomationInfo, ComponentInfo, PermissionInfo, RouteNode, HealthIssue } from "@/lib/platform-studio-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpenText,
  Database,
  Route,
  Shield,
  Wrench,
  Cpu,
  Workflow,
  LayoutDashboard,
  Search,
  ChevronRight,
  ChevronDown,
  Box,
  FileJson,
  AlertTriangle,
  Layers,
  Hash,
  Cog,
  Bug,
} from "lucide-react";

// ─── Tabs ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "overview", label: "Project Overview", icon: LayoutDashboard },
  { id: "modules", label: "Module Explorer", icon: Layers },
  { id: "ui-explorer", label: "UI Explorer", icon: Box },
  { id: "components", label: "Component Registry", icon: Cog },
  { id: "database", label: "Database Explorer", icon: Database },
  { id: "apis", label: "API Explorer", icon: FileJson },
  { id: "engines", label: "Engine Explorer", icon: Cpu },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "permissions", label: "Permission Matrix", icon: Shield },
  { id: "routes", label: "Route Explorer", icon: Route },
  { id: "health", label: "Project Health", icon: AlertTriangle },
  { id: "dev-mode", label: "Developer Mode", icon: Bug },
];

// ─── Helpers ─────────────────────────────────────────────────────

function TreeItem({ label, type, children, defaultOpen = false, badge }: {
  label: string; type: string; children?: React.ReactNode; defaultOpen?: boolean; badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#f1f3f4] rounded-md text-[13px] text-[#1a1a2e] group">
        {hasChildren ? (open ? <ChevronDown className="h-3 w-3 text-[#9aa0a6] shrink-0" /> : <ChevronRight className="h-3 w-3 text-[#9aa0a6] shrink-0" />) : <span className="w-3 shrink-0" />}
        <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider shrink-0">{type}</span>
        <span className="text-[13px] font-medium truncate">{label}</span>
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

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-8 text-[13px] text-[#9aa0a6]">{message}</div>;
}

function MetaBadge({ label, value, color = "bg-[#f1f3f4] text-[#5f6368]" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#fafafa] border border-[#e8eaed]">
      <span className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">{label}</span>
      <span className={`text-[13px] font-semibold px-1.5 py-0.5 rounded ${color}`}>{value}</span>
    </div>
  );
}

function formatId(id: string) {
  return (
    <span className="font-mono text-[10px] text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.5 rounded shrink-0">
      {id}
    </span>
  );
}

// ─── Section Components ──────────────────────────────────────────

function OverviewSection() {
  const m = PLATFORM_METADATA;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaBadge label="Version" value={m.version} color="bg-[#e8f0fe] text-[#1a73e8]" />
        <MetaBadge label="Pages" value={m.totalPages} color="bg-[#e6f4ea] text-[#137333]" />
        <MetaBadge label="Components" value={m.totalComponents} color="bg-[#fce8e6] text-[#c5221f]" />
        <MetaBadge label="Tables" value={m.totalTables} color="bg-[#fef7e0] text-[#e37400]" />
        <MetaBadge label="APIs" value={m.totalApis} color="bg-[#e8f0fe] text-[#1a73e8]" />
        <MetaBadge label="Engines" value={m.totalEngines} color="bg-[#f3e8fd] text-[#7c3aed]" />
        <MetaBadge label="Automations" value={m.totalAutomations} color="bg-[#fce8e6] text-[#c5221f]" />
        <MetaBadge label="Routes" value={m.totalRoutes} color="bg-[#e6f4ea] text-[#137333]" />
      </div>

      <SectionCard title="Health Summary" description="Current platform health status">
        <div className="space-y-2">
          {healthIssues.length === 0 ? (
            <p className="text-[13px] text-[#137333]">✓ No issues detected</p>
          ) : (
            healthIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]">
                <span className={`w-1.5 h-1.5 rounded-full ${issue.severity === "high" ? "bg-[#ea4335]" : issue.severity === "medium" ? "bg-[#fbbc04]" : "bg-[#9aa0a6]"}`} />
                <span className="text-[#5f6368]">{issue.message}</span>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="Quick Stats">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[13px]">
          <div className="p-2"><span className="text-[#9aa0a6]">Pages with queries:</span> <span className="font-medium">{platformPages.filter(p => p.queries.length > 0).length}</span></div>
          <div className="p-2"><span className="text-[#9aa0a6]">Pages with mutations:</span> <span className="font-medium">{platformPages.filter(p => p.mutations.length > 0).length}</span></div>
          <div className="p-2"><span className="text-[#9aa0a6]">Documented tables:</span> <span className="font-medium">{platformTables.length}</span></div>
          <div className="p-2"><span className="text-[#9aa0a6]">Master data tables:</span> <span className="font-medium">{m.totalTables - platformTables.length}</span></div>
          <div className="p-2"><span className="text-[#9aa0a6]">Engine APIs:</span> <span className="font-medium">{platformEngines.reduce((s, e) => s + e.apis.length, 0)}</span></div>
          <div className="p-2"><span className="text-[#9aa0a6]">Engine consumers:</span> <span className="font-medium">{new Set(platformEngines.flatMap(e => e.consumers)).size}</span></div>
        </div>
      </SectionCard>
    </div>
  );
}

function ModuleExplorerSection() {
  const modules = [
    { name: "Organization", pages: platformPages.filter(p => p.id.startsWith("ORG")), color: "text-[#1a73e8]" },
    { name: "CRM", pages: platformPages.filter(p => p.id.startsWith("CRM")), color: "text-[#ea4335]" },
    { name: "Sales", pages: platformPages.filter(p => p.id.startsWith("SALES") || p.id.startsWith("COLL")), color: "text-[#34a853]" },
    { name: "Finance", pages: platformPages.filter(p => p.tables.some(t => t.startsWith("finance") || t.startsWith("leadPayments"))), color: "text-[#fbbc04]" },
    { name: "HR", pages: platformPages.filter(p => p.tables.some(t => t.startsWith("hr"))), color: "text-[#a855f7]" },
    { name: "Production", pages: platformPages.filter(p => p.id.startsWith("COURSE")), color: "text-[#e8710a]" },
    { name: "Academic", pages: platformPages.filter(p => p.tables.some(t => t.startsWith("academic"))), color: "text-[#06b6d4]" },
    { name: "Communication", pages: platformPages.filter(p => p.id.startsWith("MSG") || p.id.startsWith("NOTIF")), color: "text-[#0d9488]" },
    { name: "System", pages: platformPages.filter(p => p.id.startsWith("SYS") || p.id.startsWith("TASK") || p.id.startsWith("APPROVAL")), color: "text-[#5f6368]" },
  ];

  return (
    <div className="space-y-4">
      {modules.map((mod) => (
        <SectionCard key={mod.name} title={mod.name}>
          {mod.pages.length === 0 ? (
            <p className="text-[12px] text-[#9aa0a6] italic">No pages documented yet</p>
          ) : (
            <div className="space-y-2">
              {mod.pages.map((page) => (
                <div key={page.id} className="border border-[#e8eaed] rounded-lg p-3 hover:bg-[#fafafa] transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {formatId(page.id)}
                      <span className="text-[13px] font-medium text-[#1a1a2e]">{page.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] text-[#5f6368]">{page.permissions.join(", ")}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#5f6368]">
                    <span>Route: <code className="text-[#1a73e8]">{page.route}</code></span>
                    <span>File: <code className="text-[#e8710a]">{page.filePath.split("/").pop()}</code></span>
                    <span>Sections: {page.sections.length}</span>
                    <span>Tables: {page.tables.length}</span>
                    <span>Queries: {page.queries.length}</span>
                    <span>Mutations: {page.mutations.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}

function UiExplorerSection() {
  return (
    <div className="space-y-4">
      {platformPages.map((page) => (
        <SectionCard key={page.id} title={`${page.name} — ${page.route}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              {formatId(page.id)}
              <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{page.sections.length} elements</Badge>
            </div>
            <div className="space-y-0.5 ml-2">
              {page.sections.map((section) => (
                <UiElementRow key={section.id} section={section} />
              ))}
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function UiElementRow({ section }: { section: PageSection }) {
  const typeColors: Record<string, string> = {
    section: "bg-[#e8f0fe] text-[#1a73e8]",
    card: "bg-[#e6f4ea] text-[#137333]",
    chart: "bg-[#fce8e6] text-[#c5221f]",
    form: "bg-[#fef7e0] text-[#e37400]",
    button: "bg-[#f3e8fd] text-[#7c3aed]",
    input: "bg-[#e0f2fe] text-[#0284c7]",
    dialog: "bg-[#fce7f3] text-[#be185d]",
    table: "bg-[#ecfdf5] text-[#047857]",
  };
  const typeLabels: Record<string, string> = {
    section: "SEC", card: "CARD", chart: "CHART", form: "FORM",
    button: "BTN", input: "INPUT", dialog: "DIALOG", table: "TABLE",
  };
  const label = typeLabels[section.type] || section.type.toUpperCase();

  return (
    <div className="flex items-center gap-2 py-1 text-[12px]">
      <span className={`text-[9px] font-medium px-1 py-0.5 rounded shrink-0 ${typeColors[section.type] || "bg-gray-100 text-gray-700"}`}>{label}</span>
      {formatId(section.id)}
      <span className="text-[#5f6368] truncate">{section.name}</span>
    </div>
  );
}

function ComponentsSection() {
  const categories = ["layout", "data", "shared", "ui"] as const;
  const categoryLabels: Record<string, string> = { layout: "Layout", data: "Data", shared: "Shared", ui: "UI Primitives", config: "Config" };

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const items = platformComponents.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <SectionCard key={cat} title={categoryLabels[cat] || cat}>
            <div className="space-y-1">
              {items.map((comp) => (
                <ComponentRow key={comp.id} comp={comp} />
              ))}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

function ComponentRow({ comp }: { comp: ComponentInfo }) {
  return (
    <div className="border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {formatId(comp.id)}
            <span className="text-[13px] font-medium text-[#1a1a2e]">{comp.name}</span>
            <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{comp.category}</Badge>
          </div>
          <div className="text-[11px] text-[#5f6368] space-x-4">
            <span>Path: <code className="text-[#e8710a]">{comp.path}</code></span>
            <span>Deps: {comp.dependencies.length}</span>
          </div>
          <div className="text-[11px] text-[#5f6368] mt-0.5">
            <span className="text-[#9aa0a6]">Used by:</span> {comp.usedByPages.length > 0 ? comp.usedByPages.join(", ") : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DatabaseExplorerSection() {
  return (
    <div className="space-y-4">
      {platformTables.map((table) => (
        <SectionCard key={table.id} title={table.name} description={table.description}>
          <div className="flex items-center gap-2 mb-3">{formatId(table.id)}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1">Fields ({table.fields.length})</h4>
              <div className="space-y-0.5">
                {table.fields.slice(0, 8).map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-[11px]">
                    <code className="text-[#1a73e8] font-mono">{f.name}</code>
                    <span className="text-[#9aa0a6]">{f.type}</span>
                    {f.required && <span className="text-[#ea4335]">*</span>}
                  </div>
                ))}
                {table.fields.length > 8 && <p className="text-[10px] text-[#9aa0a6] italic">+{table.fields.length - 8} more</p>}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1">Indexes ({table.indexes.length})</h4>
              <div className="space-y-0.5">
                {table.indexes.map((idx) => (
                  <div key={idx.name} className="text-[11px]">
                    <code className="text-[#137333]">{idx.name}</code>
                    <span className="text-[#9aa0a6]"> ({idx.fields.join(", ")})</span>
                  </div>
                ))}
              </div>
              {table.relationships.length > 0 && (
                <>
                  <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1 mt-3">Relationships</h4>
                  <div className="space-y-0.5">
                    {table.relationships.map((r, i) => (
                      <div key={i} className="text-[11px]">
                        <code className="text-[#7c3aed]">{r.table}</code>
                        <span className="text-[#9aa0a6]"> via </span>
                        <code className="text-[#e8710a]">{r.field}</code>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1 mt-3">Used By Pages</h4>
              <div className="flex flex-wrap gap-1">
                {table.usedByPages.map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{p}</Badge>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function ApisSection() {
  const modules = [...new Set(platformApis.map((a) => a.module))];
  return (
    <div className="space-y-4">
      {modules.map((mod) => (
        <SectionCard key={mod} title={mod}>
          <div className="space-y-1">
            {platformApis.filter((a) => a.module === mod).map((api) => (
              <ApiRow key={api.id} api={api} />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function ApiRow({ api }: { api: ApiInfo }) {
  return (
    <div className="border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa] transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {formatId(api.id)}
          <Badge className={`text-[9px] ${api.type === "query" ? "bg-[#e6f4ea] text-[#137333]" : api.type === "mutation" ? "bg-[#fce8e6] text-[#c5221f]" : "bg-[#fef7e0] text-[#e37400]"}`}>
            {api.type}
          </Badge>
          <code className="text-[12px] font-mono text-[#1a1a2e]">{api.name}</code>
        </div>
        <Badge variant="outline" className="text-[9px] text-[#5f6368]">{api.permission}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-[#5f6368]">
        <div>
          <span className="text-[#9aa0a6]">Params:</span> <code className="text-[#e8710a]">{api.parameters}</code>
        </div>
        <div>
          <span className="text-[#9aa0a6]">Returns:</span> <code className="text-[#137333]">{api.returnType}</code>
        </div>
        <div>
          <span className="text-[#9aa0a6]">Used by:</span> {api.usedBy.join(", ")}
        </div>
      </div>
    </div>
  );
}

function EnginesSection() {
  return (
    <div className="space-y-4">
      {platformEngines.map((engine) => (
        <SectionCard key={engine.id} title={engine.name} description={engine.purpose}>
          <div className="flex items-center gap-2 mb-3">{formatId(engine.id)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1">APIs</h4>
              <div className="space-y-0.5">
                {engine.apis.map((api, i) => <div key={i} className="text-[11px] font-mono text-[#1a73e8]">{api}</div>)}
                {engine.apis.length === 0 && <p className="text-[11px] text-[#9aa0a6] italic">None</p>}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1">Tables</h4>
              <div className="flex flex-wrap gap-1">
                {engine.tables.map((t, i) => <Badge key={i} variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{t}</Badge>)}
              </div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1 mt-2">Events</h4>
              <div className="space-y-0.5">
                {engine.events.map((ev, i) => <div key={i} className="text-[11px] text-[#e8710a]">{ev}</div>)}
              </div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1 mt-2">Consumers</h4>
              <div className="flex flex-wrap gap-1">
                {engine.consumers.map((c, i) => <Badge key={i} variant="outline" className="text-[9px] text-[#5f6368]">{c}</Badge>)}
              </div>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function AutomationsSection() {
  return (
    <div className="space-y-4">
      {platformAutomations.map((auto) => (
        <SectionCard key={auto.id} title={auto.name} description={`Trigger: ${auto.trigger}`}>
          <div className="flex items-center gap-2 mb-3">{formatId(auto.id)}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1">Conditions</h4>
              <ul className="space-y-0.5">
                {auto.conditions.map((c, i) => (
                  <li key={i} className="text-[11px] text-[#5f6368] flex items-start gap-1.5">
                    <span className="text-[#fbbc04] mt-0.5">◆</span> {c}
                  </li>
                ))}
              </ul>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1 mt-2">Actions</h4>
              <ul className="space-y-0.5">
                {auto.actions.map((a, i) => (
                  <li key={i} className="text-[11px] text-[#5f6368] flex items-start gap-1.5">
                    <span className="text-[#34a853] mt-0.5">▶</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1">Notifications</h4>
              <ul className="space-y-0.5">
                {auto.notifications.map((n, i) => (
                  <li key={i} className="text-[11px] text-[#5f6368] flex items-start gap-1.5">
                    <span className="text-[#1a73e8] mt-0.5">🔔</span> {n}
                  </li>
                ))}
              </ul>
              <h4 className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider mb-1 mt-2">Timeline</h4>
              <div className="flex items-center gap-1 text-[11px] text-[#5f6368] flex-wrap">
                {auto.timeline.split(" → ").map((step, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="px-1 py-0.5 bg-[#f1f3f4] rounded text-[10px]">{step}</span>
                    {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-[#9aa0a6]" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function PermissionsSection() {
  return (
    <SectionCard title="Page-Level Permissions by Role" description="
Indicates which roles have access to each page">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] text-[#9aa0a6] uppercase tracking-wider border-b border-[#e8eaed]">
              <th className="text-left py-2 px-2">Page</th>
              <th className="text-center py-2 px-2">Route</th>
              <th className="text-center py-2 px-2">Super Admin</th>
              <th className="text-center py-2 px-2">Admin</th>
              <th className="text-center py-2 px-2">Manager</th>
              <th className="text-center py-2 px-2">Staff</th>
            </tr>
          </thead>
          <tbody>
            {platformPermissions.map((perm) => (
              <tr key={perm.page} className="border-b border-[#f1f3f4] hover:bg-[#fafafa]">
                <td className="py-2 px-2 font-medium text-[#1a1a2e]">{perm.page}</td>
                <td className="py-2 px-2 font-mono text-[#1a73e8] text-[11px]">{perm.route}</td>
                <td className="py-2 px-2 text-center">{perm.superAdmin ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
                <td className="py-2 px-2 text-center">{perm.admin ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
                <td className="py-2 px-2 text-center">{perm.manager ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
                <td className="py-2 px-2 text-center">{perm.staff ? <span className="text-[#34a853] text-[14px]">✓</span> : <span className="text-[#dadce0]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {platformPermissions.length === 0 && <EmptyState message="No permissions documented" />}
    </SectionCard>
  );
}

function RoutesSection() {
  return (
    <SectionCard title="Route Hierarchy" description="Complete route tree with layouts and guards">
      <div className="space-y-0.5">
        {routeTree.map((route) => (
          <RouteRow key={route.path} route={route} depth={0} />
        ))}
      </div>
    </SectionCard>
  );
}

function RouteRow({ route, depth }: { route: RouteNode; depth: number }) {
  return (
    <div className="border border-[#e8eaed] rounded-lg p-2.5 hover:bg-[#fafafa] transition-colors" style={{ marginLeft: depth * 16 }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <code className="text-[12px] font-mono text-[#1a73e8]">{route.path}</code>
          <span className="text-[12px] font-medium text-[#1a1a2e]">{route.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{route.layout}</Badge>
          {route.guards.map((g, i) => (
            <Badge key={i} className={`text-[9px] ${g === "auth" ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#fce8e6] text-[#c5221f]"}`}>{g}</Badge>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[#9aa0a6]">File: <code className="text-[#e8710a]">{route.filePath}</code></p>
      {route.children?.map((child) => <RouteRow key={child.path} route={child} depth={depth + 1} />)}
    </div>
  );
}

function HealthSection() {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? healthIssues : healthIssues.slice(0, 5);
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Project Health</CardTitle>
        <p className="text-[11px] text-[#9aa0a6] mt-0.5">{healthIssues.length} issues found</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayed.map((issue, i) => <HealthRow key={i} issue={issue} />)}
          {healthIssues.length > 5 && (
            <Button variant="ghost" size="sm" className="w-full text-[12px] text-[#5f6368] hover:text-[#1a1a2e]" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show less" : `Show all ${healthIssues.length} issues`}
            </Button>
          )}
          {healthIssues.length === 0 && <EmptyState message="No health issues detected" />}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthRow({ issue }: { issue: HealthIssue }) {
  const severityColors = { high: "bg-[#ea4335]", medium: "bg-[#fbbc04]", low: "bg-[#9aa0a6]" };
  const typeLabels: Record<string, string> = {
    missing_doc: "Missing Doc",
    broken_ref: "Broken Ref",
    unused_component: "Unused Component",
    unused_api: "Unused API",
    dead_page: "Dead Page",
    todo: "TODO",
  };
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-[#fafafa] border border-[#e8eaed]">
      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${severityColors[issue.severity]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge className={`text-[9px] ${issue.severity === "high" ? "bg-[#fce8e6] text-[#c5221f]" : issue.severity === "medium" ? "bg-[#fef7e0] text-[#e37400]" : "bg-[#f1f3f4] text-[#5f6368]"}`}>
            {typeLabels[issue.type] || issue.type}
          </Badge>
          <span className="text-[10px] text-[#9aa0a6] capitalize">{issue.severity}</span>
        </div>
        <p className="text-[12px] text-[#1a1a2e]">{issue.message}</p>
        {issue.location && <p className="text-[10px] text-[#9aa0a6] mt-0.5">Location: {issue.location}</p>}
      </div>
    </div>
  );
}

function DevModeSection() {
  return (
    <SectionCard title="Developer Mode" description="Ctrl+Shift+D to toggle overlay on any page">
      <div className="space-y-4">
        <div className="p-4 bg-[#fafafa] border border-[#e8eaed] rounded-lg">
          <h3 className="text-[13px] font-medium text-[#1a1a2e] mb-2">How to Use</h3>
          <ol className="space-y-2 text-[12px] text-[#5f6368]">
            <li className="flex items-start gap-2">
              <Badge className="text-[9px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">1</Badge>
              <span>Press <kbd className="px-1.5 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[10px] font-mono">Ctrl+Shift+D</kbd> to enable Developer Mode</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="text-[9px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">2</Badge>
              <span>A red banner appears at the top of the screen indicating Dev Mode is active</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="text-[9px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">3</Badge>
              <span>Navigate to any page — a floating panel in the bottom-right shows: Page ID, Route, File, Component IDs, API names, Database tables, and Permission scope</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge className="text-[9px] bg-[#1a1a2e] text-white shrink-0 mt-0.5">4</Badge>
              <span>Press <kbd className="px-1.5 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[10px] font-mono">Ctrl+Shift+D</kbd> again to toggle off</span>
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#e8eaed] rounded-lg p-3">
            <h4 className="text-[12px] font-medium text-[#1a1a2e] mb-2">Page ID Format</h4>
            <div className="space-y-1 text-[11px] text-[#5f6368]">
              <p><code className="text-[#1a73e8]">CRM-001</code> — CRM Dashboard</p>
              <p><code className="text-[#1a73e8]">CRM-002</code> — Lead Database</p>
              <p><code className="text-[#1a73e8]">CRM-003</code> — Lead Workspace</p>
              <p><code className="text-[#1a73e8]">SYS-001</code> — System Dashboard</p>
              <p><code className="text-[#1a73e8]">ORG-001</code> — Organization Studio</p>
            </div>
          </div>
          <div className="border border-[#e8eaed] rounded-lg p-3">
            <h4 className="text-[12px] font-medium text-[#1a1a2e] mb-2">Element ID Format</h4>
            <div className="space-y-1 text-[11px] text-[#5f6368]">
              <p><code className="text-[#1a73e8]">CRM-001-CHART-001</code> — Pipeline Chart</p>
              <p><code className="text-[#1a73e8]">CRM-001-BTN-003</code> — Action Button</p>
              <p><code className="text-[#1a73e8]">CRM-001-FORM-002</code> — Create Form</p>
              <p><code className="text-[#1a73e8]">CRM-002-BTN-001</code> — Create Lead</p>
              <p><code className="text-[#1a73e8]">TASK-001-FORM-001</code> — Create Task</p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function PlatformStudio() {
  const { user } = useAuth();
  const isAllowed = user?.role === "super_admin";
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = searchQuery.trim() ? searchPlatform(searchQuery) : [];

  const renderSection = () => {
    if (searchResults.length > 0) {
      return (
        <SectionCard title={`Search Results (${searchResults.length})`} description={`Matches for "${searchQuery}"`}>
          <div className="space-y-1">
            {searchResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border border-[#e8eaed] rounded-md hover:bg-[#fafafa] text-[12px]">
                <Badge variant="secondary" className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{r.type}</Badge>
                <span className="font-mono text-[10px] text-[#1a73e8]">{r.id}</span>
                <span className="font-medium text-[#1a1a2e]">{r.name}</span>
                <span className="text-[#9aa0a6] truncate ml-auto">{r.match}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      );
    }

    switch (activeTab) {
      case "overview": return <OverviewSection />;
      case "modules": return <ModuleExplorerSection />;
      case "ui-explorer": return <UiExplorerSection />;
      case "components": return <ComponentsSection />;
      case "database": return <DatabaseExplorerSection />;
      case "apis": return <ApisSection />;
      case "engines": return <EnginesSection />;
      case "automations": return <AutomationsSection />;
      case "permissions": return <PermissionsSection />;
      case "routes": return <RoutesSection />;
      case "health": return <HealthSection />;
      case "dev-mode": return <DevModeSection />;
      default: return <EmptyState message="Select a section from the sidebar" />;
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
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-[200px] shrink-0">
        <div className="sticky top-20 space-y-1">
          <div className="text-[10px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pb-2">
            Platform Studio
          </div>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveTab(section.id); setSearchQuery(""); }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${
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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
          <Input
            placeholder="Search pages, tables, APIs, components, engines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-[13px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#5f6368] text-[11px]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Active section */}
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="pr-2">
            {renderSection()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
