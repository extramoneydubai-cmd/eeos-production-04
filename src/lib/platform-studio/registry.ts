/**
 * EEOS Platform Studio v2 — Central Metadata Registry
 *
 * This is THE source of truth for the Developer Intelligence System.
 * Every module, page, component, API, table, engine, automation,
 * workflow, event, and permission has a permanent ID.
 *
 * Zero hardcoding in the UI — everything is data-driven from this registry.
 *
 * To add a new module, just add an entry to MODULE_REGISTRY.
 * The Platform Studio automatically picks it up.
 */

// ═════════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════════

export type FeatureFlag = "production_ready" | "mvp" | "beta" | "experimental" | "deprecated" | "hidden";
export type RoadmapStatus = "completed" | "current_sprint" | "next_sprint" | "future";
export type DevNoteType = "note" | "bug" | "tech_debt" | "todo" | "idea";

export interface ModuleDef {
  id: string;
  name: string;
  progress: number; // 0–100
  featureFlag: FeatureFlag;
  description: string;
  roadmap: { status: RoadmapStatus; items: string[] }[];
  devNotes: { type: DevNoteType; text: string; author?: string }[];
  pages: string[]; // page IDs
}

export interface PageSection {
  id: string;
  type: "card" | "chart" | "form" | "button" | "input" | "dialog" | "table" | "section";
  name: string;
}

export interface PageInfo {
  id: string; // PAGE-CRM-001
  name: string;
  route: string;
  filePath: string;
  layout: string;
  module: string;
  sections: PageSection[];
  queries: string[];
  mutations: string[];
  tables: string[];
  permissions: string[];
  relatedPages: string[];
  // Developer Notes
  devNotes: { type: DevNoteType; text: string }[];
  // Feature flag overrides
  featureFlag?: FeatureFlag;
  // Architecture
  architecture?: { flow: string; description: string };
}

export interface TableField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface TableIndex {
  name: string;
  fields: string[];
}

export interface TableInfo {
  name: string;
  id: string; // DB-LEADS
  description: string;
  module: string;
  fields: TableField[];
  indexes: TableIndex[];
  relationships: { table: string; field: string }[];
  queries: string[];
  mutations: string[];
  permissions: string[];
  usedByPages: string[];
}

export interface ApiInfo {
  name: string;
  id: string; // QRY-LEADS-LIST
  type: "query" | "mutation" | "action";
  module: string;
  parameters: string;
  returnType: string;
  usedBy: string[];
  permission: string;
}

export interface EngineInfo {
  id: string; // ENG-NOTIFICATION
  name: string;
  purpose: string;
  module: string;
  apis: string[];
  tables: string[];
  events: string[];
  consumers: string[];
  workflows: string[];
}

export interface AutomationInfo {
  id: string; // AUTO-LEAD-001
  name: string;
  module: string;
  trigger: string;
  conditions: string[];
  actions: string[];
  notifications: string[];
  timeline: string;
  workflowId?: string;
}

export interface WorkflowInfo {
  id: string; // WF-ADMISSION
  name: string;
  module: string;
  description: string;
  steps: string[];
  automations: string[];
  engines: string[];
}

export interface EventInfo {
  id: string; // EVT-LEAD-CONVERTED
  name: string;
  module: string;
  description: string;
  producers: string[];
  consumers: string[];
}

export interface ComponentInfo {
  id: string; // COMP-CRM-001
  name: string;
  path: string;
  category: string;
  module: string;
  propsExample: string;
  dependencies: string[];
  usedByPages: string[];
}

export interface PermissionInfo {
  id: string; // PERM-LEADS-EDIT
  page: string;
  route: string;
  superAdmin: boolean;
  admin: boolean;
  manager: boolean;
  staff: boolean;
  description: string;
}

export interface HealthIssue {
  type: "missing_doc" | "broken_ref" | "unused_component" | "unused_api" | "dead_page" | "todo";
  severity: "low" | "medium" | "high";
  message: string;
  location?: string;
}

export interface SearchResult {
  type: "Page" | "Component" | "Table" | "API" | "Engine" | "Automation" | "Workflow" | "Event" | "Permission" | "Module" | "File";
  id: string;
  name: string;
  match: string;
  module: string;
}

export interface DependencyGraph {
  pages: { id: string; name: string; route: string; module: string; dependencies: string[]; dependents: string[] }[];
}

// ═════════════════════════════════════════════════════════════════
//  MODULE REGISTRY
// ═════════════════════════════════════════════════════════════════

export const MODULE_REGISTRY: ModuleDef[] = [
  {
    id: "MOD-ORG",
    name: "Organization",
    progress: 100,
    featureFlag: "production_ready",
    description: "Organizational structure management — departments, teams, branches, designations, verticals",
    roadmap: [
      { status: "completed", items: ["Department CRUD", "Team management", "Branch management", "Designation management", "Vertical, Sub-Vertical, Board hierarchy", "Organization tree view"] },
      { status: "current_sprint", items: ["Role-based org chart"] },
      { status: "next_sprint", items: ["Org unit hierarchy visualization"] },
      { status: "future", items: ["Org audit log", "Org unit analytics"] },
    ],
    devNotes: [
      { type: "note", text: "Uses separate Master Data Studio tables (orgDepartments, orgTeams, etc.) for CRUD" },
      { type: "note", text: "Tree view uses recursive TreeItem component" },
    ],
    pages: ["PAGE-ORG-001"],
  },
  {
    id: "MOD-CRM",
    name: "CRM",
    progress: 82,
    featureFlag: "production_ready",
    description: "Lead management, pipeline tracking, activity logging, and conversion",
    roadmap: [
      { status: "completed", items: ["Lead CRUD", "Lead workspace with tabs", "Payment recording", "Payment verification workflow", "Lead activity timeline", "Call logging", "WhatsApp integration", "Conversion history", "Pipeline health chart", "Conversion funnel chart", "Lead auto-conversion", "Lead stage management"] },
      { status: "current_sprint", items: ["Advanced lead scoring", "Bulk lead operations"] },
      { status: "next_sprint", items: ["Lead duplication detection", "Automated lead assignment"] },
      { status: "future", items: ["AI lead scoring", "Predictive conversion analytics"] },
    ],
    devNotes: [
      { type: "note", text: "Lead workspace uses tabbed interface: Overview, Discussion, Payments, Tasks, Documents, Activity" },
      { type: "bug", text: "Auto-conversion needs manual refresh on dashboard after payment verification" },
      { type: "tech_debt", text: "Lead workflow uses hardcoded stages instead of dynamic stage config" },
      { type: "todo", text: "Add lead tag filtering to database view" },
    ],
    pages: ["PAGE-CRM-001", "PAGE-CRM-002", "PAGE-CRM-003", "PAGE-CRM-004"],
  },
  {
    id: "MOD-SALES",
    name: "Sales",
    progress: 74,
    featureFlag: "production_ready",
    description: "Sales pipeline, opportunities, quotations, and collections",
    roadmap: [
      { status: "completed", items: ["Opportunity management", "Opportunity stage tracking", "Quotation creation", "Quotation line items", "Collection dashboard", "Payment collection center", "Sales performance metrics"] },
      { status: "current_sprint", items: ["Invoice generation"] },
      { status: "next_sprint", items: ["Sales target tracking", "Commission calculation"] },
      { status: "future", items: ["Sales forecasting", "Territory management"] },
    ],
    devNotes: [
      { type: "note", text: "Opportunity board uses drag-and-drop via @dnd-kit" },
      { type: "tech_debt", text: "Quotation version history stored as JSON strings" },
    ],
    pages: ["PAGE-SALES-001", "PAGE-SALES-002", "PAGE-SALES-003", "PAGE-SALES-004", "PAGE-SALES-005", "PAGE-SALES-006", "PAGE-COLL-001", "PAGE-COLL-002"],
  },
  {
    id: "MOD-FINANCE",
    name: "Finance",
    progress: 32,
    featureFlag: "beta",
    description: "Payment modes, bank accounts, tax rates, fee categories, and financial years",
    roadmap: [
      { status: "completed", items: ["Payment mode master data", "Bank account master data", "Tax type master data", "GST rate master data", "Fee category master data", "Discount category master data", "Currency master data", "Financial year master data"] },
      { status: "current_sprint", items: [] },
      { status: "next_sprint", items: ["Invoice management", "Expense tracking"] },
      { status: "future", items: ["Budget management", "Financial reporting", "Reconciliation"] },
    ],
    devNotes: [
      { type: "note", text: "All finance modules are currently master data only" },
      { type: "todo", text: "Build transaction ledger module" },
    ],
    pages: [],
  },
  {
    id: "MOD-HR",
    name: "HR",
    progress: 18,
    featureFlag: "beta",
    description: "Employee management, skills, and HR master data",
    roadmap: [
      { status: "completed", items: ["Employee type master data", "Employment status master data", "Employee category master data", "Work location master data", "Skills master data", "Experience level master data", "Document type master data"] },
      { status: "current_sprint", items: ["Employee profile management"] },
      { status: "next_sprint", items: ["Leave management"] },
      { status: "future", items: ["Payroll integration", "Performance reviews", "Recruitment pipeline"] },
    ],
    devNotes: [
      { type: "note", text: "HR module is in early stage — only master data exists" },
      { type: "todo", text: "Build employee CRUD with department/designation binding" },
    ],
    pages: [],
  },
  {
    id: "MOD-PRODUCTION",
    name: "Production",
    progress: 12,
    featureFlag: "experimental",
    description: "Content production and material management",
    roadmap: [
      { status: "completed", items: ["Course catalog (shared with CRM)"] },
      { status: "current_sprint", items: [] },
      { status: "next_sprint", items: ["Content calendar"] },
      { status: "future", items: ["Material production pipeline", "Quality assurance workflow"] },
    ],
    devNotes: [
      { type: "note", text: "Production depends on Course Studio module" },
    ],
    pages: ["PAGE-COURSE-001"],
  },
  {
    id: "MOD-ACADEMIC",
    name: "Academic",
    progress: 5,
    featureFlag: "experimental",
    description: "Academic program management, batches, sessions, and classrooms",
    roadmap: [
      { status: "completed", items: ["Academic verticals master data", "Academic programs master data", "Academic sessions master data", "Batch types master data", "Classrooms master data"] },
      { status: "current_sprint", items: [] },
      { status: "next_sprint", items: ["Student enrollment", "Academic calendar"] },
      { status: "future", items: ["Timetable management", "Grade tracking", "Attendance management"] },
    ],
    devNotes: [
      { type: "note", text: "All academic modules are master data only — no operational features yet" },
      { type: "idea", text: "Academic module will eventually drive the entire student lifecycle" },
    ],
    pages: [],
  },
  {
    id: "MOD-COMMUNICATION",
    name: "Communication",
    progress: 40,
    featureFlag: "mvp",
    description: "Email, SMS, WhatsApp templates, and notification types",
    roadmap: [
      { status: "completed", items: ["Notification type master data", "Email template master data", "SMS template master data", "WhatsApp template master data", "Real-time notifications", "Messenger channels & DMs"] },
      { status: "current_sprint", items: ["Email sending integration"] },
      { status: "next_sprint", items: ["SMS gateway integration"] },
      { status: "future", items: ["Automated notification rules", "Notification analytics"] },
    ],
    devNotes: [
      { type: "note", text: "Messenger module is fully functional with channels, DMs, announcements" },
      { type: "tech_debt", text: "Email/SMS sending requires third-party gateway integration" },
    ],
    pages: ["PAGE-NOTIF-001", "PAGE-MSG-001"],
  },
  {
    id: "MOD-SYSTEM",
    name: "System",
    progress: 61,
    featureFlag: "production_ready",
    description: "Core platform — users, auth, access control, tasks, approvals, settings",
    roadmap: [
      { status: "completed", items: ["User authentication", "Role-based access control", "User management (create/edit/disable)", "Scope-based permissions", "Task management with Kanban", "Approval workflow engine", "Multi-mode approvals", "Notification engine", "Control Center for CEO", "Dashboard with widgets"] },
      { status: "current_sprint", items: ["Audit logging", "Session management"] },
      { status: "next_sprint", items: ["Two-factor authentication", "API key management"] },
      { status: "future", items: ["SSO integration", "Advanced analytics dashboard"] },
    ],
    devNotes: [
      { type: "note", text: "System module is the most mature — covers all core platform features" },
      { type: "bug", text: "Error boundary sometimes catches non-critical renders and shows error dialog" },
      { type: "todo", text: "Add task recurring/reminder functionality" },
    ],
    pages: ["PAGE-SYS-001", "PAGE-SYS-002", "PAGE-SYS-003", "PAGE-SYS-004", "PAGE-SYS-005", "PAGE-TASK-001", "PAGE-TASK-002", "PAGE-APPROVAL-001", "PAGE-MD-001"],
  },
  {
    id: "MOD-INTAKE",
    name: "Intake Engine",
    progress: 40,
    featureFlag: "beta",
    description: "Universal Intake Engine — submission processing, validation, deduplication, verification, transformation, routing, and event generation",
    roadmap: [
      { status: "completed", items: ["Universal submission engine", "Submission queue with 12 statuses", "Validation engine against Form Studio schema", "Duplicate detection with configurable rules", "Verification engine with history", "Transformation engine with field mappings", "Routing engine with dynamic rules", "Automation event generation", "Submission timeline", "Intake dashboard with stats"] },
      { status: "current_sprint", items: ["CSV import support", "REST API endpoint"] },
      { status: "next_sprint", items: ["Webhook receiver", "Bulk operations"] },
      { status: "future", items: ["Module connectors (CRM, HR, Finance)", "Workflow engine integration"] },
    ],
    devNotes: [
      { type: "note", text: "Every incoming submission follows ONE common lifecycle through the intake engine" },
      { type: "note", text: "No business module should receive raw data directly — all goes through intake" },
      { type: "todo", text: "Connect intake to CRM lead creation pipeline" },
    ],
    pages: ["PAGE-INTAKE-001"],
  }, {
    id: "MOD-FORMS",
    name: "Forms",
    progress: 15,
    featureFlag: "beta",
    description: "Universal Intake Engine — dynamic form builder, field configuration, versioning, and submission management",
    roadmap: [
      { status: "completed", items: ["Form CRUD", "Form versioning", "Field type support (25+ types)", "Field editor with configuration", "Form publishing workflow", "Submission engine foundation"] },
      { status: "current_sprint", items: ["Public form submission endpoint", "Form analytics"] },
      { status: "next_sprint", items: ["Conditional field logic", "Lookup field types"] },
      { status: "future", items: ["Form templates", "Drag-and-drop form builder", "Webhook integration", "Routing engine"] },
    ],
    devNotes: [
      { type: "note", text: "Form Studio is a standalone engine — no business logic dependencies" },
      { type: "tech_debt", text: "Form builder uses static field list — future should use drag-and-drop" },
    ],
    pages: ["PAGE-FORM-001"],
  },
  {
    id: "MOD-PLATFORM",
    name: "Platform",
    progress: 61,
    featureFlag: "beta",
    description: "Platform Studio, Developer Intelligence System, and developer tools",
    roadmap: [
      { status: "completed", items: ["Project overview dashboard", "Module explorer", "UI explorer with permanent IDs", "Component registry", "Database explorer", "API explorer", "Engine explorer", "Automation explorer", "Permission matrix", "Route explorer", "Project health", "Developer Mode (Ctrl+Shift+D)"] },
      { status: "current_sprint", items: ["Dependency viewer (forward & reverse)", "Visual architecture explorer", "Search everything", "Click-to-inspect page drawer", "Progress dashboard", "Feature flag system", "Roadmap viewer", "Development notes per module"] },
      { status: "next_sprint", items: ["Live data counts from Convex"] },
      { status: "future", items: ["Automated code generation from registry", "AI-powered module suggestions"] },
    ],
    devNotes: [
      { type: "note", text: "Platform Studio is self-referential — it documents itself" },
      { type: "idea", text: "Add ability to generate new module scaffolding from Platform Studio" },
    ],
    pages: ["PAGE-PLATFORM-001"],
  },
];

// ═════════════════════════════════════════════════════════════════
//  PAGE REGISTRY
// ═════════════════════════════════════════════════════════════════

const PAGES: PageInfo[] = [
  {
    id: "PAGE-SYS-001", name: "Dashboard", route: "/dashboard", filePath: "src/pages/Dashboard.tsx", layout: "AppLayout", module: "System",
    sections: [
      { id: "SYS-001-SECTION-001", type: "section", name: "System Overview" },
      { id: "SYS-001-CARD-001", type: "card", name: "Stats Cards (Users/Tasks/Approvals)" },
      { id: "SYS-001-CHART-001", type: "chart", name: "Activity Timeline" },
      { id: "SYS-001-CARD-002", type: "card", name: "Quick Actions" },
    ],
    queries: ["QRY-SYS-DASHBOARD-STATS", "QRY-TASK-LIST", "QRY-APPROVAL-LIST"],
    mutations: [],
    tables: ["DB-USERS", "DB-TASKS", "DB-APPROVAL-REQUESTS", "DB-NOTIFICATIONS"],
    permissions: ["PERM-SYS-ALL"],
    relatedPages: ["/tasks", "/approvals", "/users"],
    devNotes: [{ type: "note", text: "Dashboard uses Convex queries for real-time data" }],
    architecture: { flow: "Dashboard → Queries → Convex DB", description: "Real-time dashboard widgets" },
  },
  {
    id: "PAGE-CRM-001", name: "CRM Dashboard", route: "/crm", filePath: "src/pages/CrmDashboard.tsx", layout: "AppLayout", module: "CRM",
    sections: [
      { id: "CRM-001-SECTION-001", type: "section", name: "Pipeline Overview" },
      { id: "CRM-001-CHART-001", type: "chart", name: "Pipeline Health" },
      { id: "CRM-001-CHART-002", type: "chart", name: "Conversion Funnel" },
      { id: "CRM-001-CARD-001", type: "card", name: "Summary Stats Cards" },
      { id: "CRM-001-TABLE-001", type: "table", name: "Recent Leads" },
      { id: "CRM-001-TABLE-002", type: "table", name: "Pending Payments" },
      { id: "CRM-001-TABLE-003", type: "table", name: "Conversion History" },
    ],
    queries: ["QRY-CRM-DASHBOARD", "QRY-LEADS-LIST", "QRY-PAYMENTS-ALL", "QRY-CRM-CONVERSION-HISTORY"],
    mutations: [],
    tables: ["DB-LEADS", "DB-PAYMENTS", "DB-LEAD-STAGE-HISTORY", "DB-ACTIVITY"],
    permissions: ["PERM-CRM-ADMIN"],
    relatedPages: ["/crm/leads", "/crm/sales"],
    devNotes: [{ type: "note", text: "Pipeline health and funnel chart built with Recharts" }],
    architecture: { flow: "CRM Dashboard → Dashboard Data Query → Lead/Payment Tables", description: "Real-time CRM metrics" },
  },
  {
    id: "PAGE-CRM-002", name: "Lead Database", route: "/crm/leads", filePath: "src/pages/LeadDatabase.tsx", layout: "AppLayout", module: "CRM",
    sections: [
      { id: "CRM-002-SECTION-001", type: "section", name: "Leads Table" },
      { id: "CRM-002-TABLE-001", type: "table", name: "Leads Data Table" },
      { id: "CRM-002-BTN-001", type: "button", name: "Create Lead" },
      { id: "CRM-002-FORM-001", type: "form", name: "Create Lead Dialog" },
      { id: "CRM-002-INPUT-001", type: "input", name: "Search Leads" },
    ],
    queries: ["QRY-LEADS-LIST", "QRY-LEADS-COUNTS"],
    mutations: ["MUT-LEADS-CREATE", "MUT-LEADS-UPDATE", "MUT-LEADS-DELETE"],
    tables: ["DB-LEADS"],
    permissions: ["PERM-LEADS-READ", "PERM-LEADS-WRITE"],
    relatedPages: ["/crm", "/crm/leads/:leadId"],
    devNotes: [{ type: "todo", text: "Add bulk lead operations" }],
  },
  {
    id: "PAGE-CRM-003", name: "Lead Workspace", route: "/crm/leads/:leadId", filePath: "src/pages/LeadWorkspace.tsx", layout: "AppLayout", module: "CRM",
    sections: [
      { id: "CRM-003-SECTION-001", type: "section", name: "Lead Details" },
      { id: "CRM-003-CARD-001", type: "card", name: "Lead Profile Card" },
      { id: "CRM-003-CARD-002", type: "card", name: "Payment Summary" },
      { id: "CRM-003-TABLE-001", type: "table", name: "Payments Table" },
      { id: "CRM-003-TABLE-002", type: "table", name: "Tasks Table" },
      { id: "CRM-003-FORM-001", type: "form", name: "Record Payment Dialog" },
      { id: "CRM-003-FORM-002", type: "form", name: "Add Task Dialog" },
      { id: "CRM-003-FORM-003", type: "form", name: "Lead Edit Form" },
      { id: "CRM-003-BTN-001", type: "button", name: "Convert Lead" },
      { id: "CRM-003-DIALOG-001", type: "dialog", name: "Conversion Wizard" },
    ],
    queries: ["QRY-LEADS-GET", "QRY-PAYMENTS-GET", "QRY-LEAD-ACTIVITY", "QRY-LEAD-TASKS"],
    mutations: ["MUT-LEADS-UPDATE", "MUT-PAYMENTS-ADD", "MUT-LEAD-TASKS-CREATE", "MUT-NOTES-ADD", "MUT-DOCUMENTS-ADD"],
    tables: ["DB-LEADS", "DB-PAYMENTS", "DB-LEAD-TASKS", "DB-NOTES", "DB-DOCUMENTS", "DB-ACTIVITY", "DB-LEAD-STAGE-HISTORY"],
    permissions: ["PERM-LEADS-READ", "PERM-LEADS-WRITE", "PERM-PAYMENTS-WRITE"],
    relatedPages: ["/crm", "/crm/leads"],
    devNotes: [{ type: "note", text: "Lead workspace uses tabbed interface with 6 tabs" }],
    architecture: { flow: "Lead Workspace → Lead Query → Lead/Payment/Task Tables", description: "Full lead lifecycle management" },
  },
  { id: "PAGE-CRM-004", name: "Lead Stage Studio", route: "/crm/settings/stages", filePath: "src/pages/LeadStageStudio.tsx", layout: "AppLayout", module: "CRM",
    sections: [{ id: "CRM-004-SECTION-001", type: "section", name: "Stage Management" }],
    queries: ["crmStages:list"], mutations: ["crmStages:create", "crmStages:update"], tables: ["crmStages"],
    permissions: ["PERM-CRM-ADMIN"], relatedPages: ["/crm"],
    devNotes: [],
  },
  // Sales pages
  { id: "PAGE-SALES-001", name: "Sales Workspace", route: "/crm/sales", filePath: "src/pages/SalesWorkspace.tsx", layout: "AppLayout", module: "Sales",
    sections: [
      { id: "SALES-001-SECTION-001", type: "section", name: "Sales Overview" },
      { id: "SALES-001-CARD-001", type: "card", name: "Sales Metrics" },
      { id: "SALES-001-TABLE-001", type: "table", name: "Opportunities Board" },
    ],
    queries: ["QRY-SALES-OPPORTUNITIES", "QRY-SALES-METRICS"], mutations: ["MUT-OPPORTUNITY-CREATE", "MUT-OPPORTUNITY-UPDATE"],
    tables: ["DB-OPPORTUNITIES", "DB-OPPORTUNITY-HISTORY"], permissions: ["PERM-SALES-READ", "PERM-SALES-WRITE"],
    relatedPages: ["/crm/sales/opportunities", "/crm/sales/performance"],
    devNotes: [{ type: "note", text: "Opportunity board uses drag-and-drop" }],
  },
  { id: "PAGE-SALES-002", name: "Sales Opportunities", route: "/crm/sales/opportunities", filePath: "src/pages/SalesOpportunitiesPage.tsx", layout: "AppLayout", module: "Sales",
    sections: [{ id: "SALES-002-SECTION-001", type: "section", name: "Opportunities List" }, { id: "SALES-002-TABLE-001", type: "table", name: "Opportunities Table" }],
    queries: ["QRY-SALES-OPPORTUNITIES", "salesOpportunityStages:list"], mutations: ["MUT-OPPORTUNITY-CREATE", "MUT-OPPORTUNITY-UPDATE-STAGE"],
    tables: ["DB-OPPORTUNITIES", "salesOpportunityStages"], permissions: ["PERM-SALES-READ", "PERM-SALES-WRITE"],
    relatedPages: ["/crm/sales"],
    devNotes: [],
  },
  { id: "PAGE-SALES-003", name: "Quotation Detail", route: "/crm/sales/quotations/:quoteId", filePath: "src/pages/QuotationDetail.tsx", layout: "AppLayout", module: "Sales",
    sections: [{ id: "SALES-003-SECTION-001", type: "section", name: "Quotation View" }],
    queries: ["QRY-QUOTATION-GET", "QRY-QUOTATION-LINE-ITEMS"], mutations: ["MUT-QUOTATION-UPDATE"],
    tables: ["DB-QUOTATIONS", "DB-QUOTATION-LINE-ITEMS", "DB-QUOTATION-VERSIONS"],
    permissions: ["PERM-SALES-READ", "PERM-SALES-WRITE"],
    relatedPages: ["/crm/sales"],
    devNotes: [{ type: "tech_debt", text: "Version history stored as JSON strings" }],
  },
  { id: "PAGE-SALES-004", name: "Sales Tasks", route: "/crm/sales/tasks", filePath: "src/pages/SalesTasksPage.tsx", layout: "AppLayout", module: "Sales", sections: [], queries: [], mutations: [], tables: [], permissions: ["PERM-SALES-READ"], relatedPages: [], devNotes: [] },
  { id: "PAGE-SALES-005", name: "Sales Performance", route: "/crm/sales/performance", filePath: "src/pages/SalesPerformanceDashboard.tsx", layout: "AppLayout", module: "Sales",
    sections: [], queries: ["QRY-SALES-METRICS"], mutations: [],
    tables: ["DB-OPPORTUNITIES", "DB-PAYMENTS"], permissions: ["PERM-SALES-ADMIN"],
    relatedPages: ["/crm/sales"],
    devNotes: [],
  },
  { id: "PAGE-SALES-006", name: "Sales Payments", route: "/crm/sales/payments", filePath: "src/pages/SalesPaymentsDashboard.tsx", layout: "AppLayout", module: "Sales", sections: [], queries: [], mutations: [], tables: ["DB-PAYMENTS"], permissions: ["PERM-SALES-READ"], relatedPages: [], devNotes: [] },
  { id: "PAGE-COLL-001", name: "Collection Center", route: "/crm/sales/collections", filePath: "src/pages/CollectionCenter.tsx", layout: "AppLayout", module: "Sales", sections: [], queries: ["collectionEngine:getCollectionData"], mutations: [], tables: ["DB-PAYMENTS", "DB-LEADS"], permissions: ["PERM-SALES-READ"], relatedPages: [], devNotes: [] },
  { id: "PAGE-COLL-002", name: "Collection Dashboard", route: "/collections", filePath: "src/pages/CollectionDashboard.tsx", layout: "AppLayout", module: "Sales", sections: [], queries: [], mutations: [], tables: ["DB-PAYMENTS"], permissions: ["PERM-SALES-READ"], relatedPages: ["/crm/sales/collections"], devNotes: [] },
  // Organization
  { id: "PAGE-ORG-001", name: "Organization Studio", route: "/org", filePath: "src/pages/OrganizationStudio.tsx", layout: "AppLayout", module: "Organization",
    sections: [
      { id: "ORG-001-SECTION-001", type: "section", name: "Organization Tree" },
      { id: "ORG-001-SECTION-002", type: "section", name: "Departments Tab" },
      { id: "ORG-001-SECTION-003", type: "section", name: "Teams Tab" },
      { id: "ORG-001-SECTION-004", type: "section", name: "Branches Tab" },
      { id: "ORG-001-SECTION-005", type: "section", name: "Verticals Tab" },
      { id: "ORG-001-SECTION-006", type: "section", name: "Sub Verticals Tab" },
      { id: "ORG-001-SECTION-007", type: "section", name: "Boards Tab" },
      { id: "ORG-001-SECTION-008", type: "section", name: "Designations Tab" },
      { id: "ORG-001-FORM-001", type: "form", name: "Create Department" },
      { id: "ORG-001-FORM-002", type: "form", name: "Create Team" },
      { id: "ORG-001-FORM-003", type: "form", name: "Create Branch" },
      { id: "ORG-001-FORM-004", type: "form", name: "Create Vertical" },
      { id: "ORG-001-FORM-005", type: "form", name: "Create Sub Vertical" },
      { id: "ORG-001-FORM-006", type: "form", name: "Create Board" },
      { id: "ORG-001-FORM-007", type: "form", name: "Create Designation" },
    ],
    queries: ["QRY-ORG-DEPARTMENTS", "QRY-ORG-TEAMS", "QRY-ORG-BRANCHES", "QRY-ORG-VERTICALS", "QRY-ORG-SUB-VERTICALS", "QRY-ORG-BOARDS", "QRY-ORG-DESIGNATIONS"],
    mutations: ["MUT-ORG-DEPARTMENT-CREATE", "MUT-ORG-TEAM-CREATE", "MUT-ORG-BRANCH-CREATE", "MUT-ORG-VERTICAL-CREATE", "MUT-ORG-SUB-VERTICAL-CREATE", "MUT-ORG-BOARD-CREATE", "MUT-ORG-DESIGNATION-CREATE"],
    tables: ["DB-DEPARTMENTS", "DB-TEAMS", "DB-BRANCHES", "DB-VERTICALS", "DB-SUB-VERTICALS", "DB-BOARDS", "DB-DESIGNATIONS", "DB-COMPANIES"],
    permissions: ["PERM-ORG-ADMIN"],
    relatedPages: [],
    devNotes: [{ type: "note", text: "Uses TreeItem recursive component for org tree" }],
    architecture: { flow: "Organization Studio → Org Queries → Org Tables", description: "Full organization hierarchy management" },
  },
  // System pages
  { id: "PAGE-SYS-002", name: "User Management", route: "/users", filePath: "src/pages/UsersPage.tsx", layout: "AppLayout", module: "System",
    sections: [
      { id: "SYS-002-SECTION-001", type: "section", name: "Users List" },
      { id: "SYS-002-TABLE-001", type: "table", name: "Users Data Table" },
      { id: "SYS-002-FORM-001", type: "form", name: "Create User Dialog" },
      { id: "SYS-002-FORM-002", type: "form", name: "Edit Scopes Dialog" },
      { id: "SYS-002-BTN-001", type: "button", name: "Create User" },
      { id: "SYS-002-BTN-002", type: "button", name: "Reset Password" },
      { id: "SYS-002-BTN-003", type: "button", name: "Clone Access" },
      { id: "SYS-002-BTN-004", type: "button", name: "Transfer Access" },
      { id: "SYS-002-BTN-005", type: "button", name: "Disable User" },
    ],
    queries: ["QRY-USERS-LIST", "QRY-USERS-GET"],
    mutations: ["MUT-USERS-CREATE", "MUT-USERS-UPDATE-ROLE", "MUT-USERS-RESET-PASSWORD", "MUT-USERS-DISABLE", "MUT-USERS-UPDATE-SCOPES"],
    tables: ["DB-USERS", "DB-USER-SCOPES"],
    permissions: ["PERM-USERS-ADMIN"],
    relatedPages: ["/access"],
    devNotes: [{ type: "note", text: "User scopes control department/branch/team/vertical access" }],
  },
  { id: "PAGE-SYS-003", name: "Access Control", route: "/access", filePath: "src/pages/AccessControl.tsx", layout: "AppLayout", module: "System",
    sections: [{ id: "SYS-003-SECTION-001", type: "section", name: "Effective Access" }, { id: "SYS-003-SECTION-002", type: "section", name: "Role Visibility" }],
    queries: ["QRY-USERS-LIST", "QRY-ACCESS-EFFECTIVE"], mutations: [], tables: ["DB-USERS", "DB-USER-SCOPES"],
    permissions: ["PERM-SYS-ADMIN"],
    relatedPages: ["/users"],
    devNotes: [],
  },
  { id: "PAGE-TASK-001", name: "Task Management", route: "/tasks", filePath: "src/pages/TasksPage.tsx", layout: "AppLayout", module: "System",
    sections: [
      { id: "TASK-001-SECTION-001", type: "section", name: "Kanban Board" },
      { id: "TASK-001-TABLE-001", type: "table", name: "Task Cards" },
      { id: "TASK-001-FORM-001", type: "form", name: "Create Task Dialog" },
    ],
    queries: ["QRY-TASK-LIST", "QRY-TASK-GET"], mutations: ["MUT-TASK-CREATE", "MUT-TASK-UPDATE-STATUS", "MUT-TASK-UPDATE"],
    tables: ["DB-TASKS", "DB-TASK-PARTICIPANTS", "DB-TASK-CHECKLIST", "DB-TASK-COMMENTS"],
    permissions: ["PERM-SYS-ALL"],
    relatedPages: ["/tasks/:taskId", "/approvals"],
    devNotes: [{ type: "note", text: "Kanban board uses drag-and-drop via @dnd-kit" }],
    architecture: { flow: "Task Management → Task Queries → Task Tables", description: "Kanban-based task management" },
  },
  { id: "PAGE-TASK-002", name: "Task Detail", route: "/tasks/:taskId", filePath: "src/pages/TaskDetail.tsx", layout: "AppLayout", module: "System",
    sections: [], queries: ["QRY-TASK-GET"], mutations: ["MUT-TASK-UPDATE"], tables: ["DB-TASKS"], permissions: ["PERM-SYS-ALL"],
    relatedPages: ["/tasks"],
    devNotes: [],
  },
  { id: "PAGE-APPROVAL-001", name: "Approval Center", route: "/approvals", filePath: "src/pages/ApprovalsPage.tsx", layout: "AppLayout", module: "System",
    sections: [{ id: "APPROVAL-001-SECTION-001", type: "section", name: "Approval Requests" }, { id: "APPROVAL-001-TABLE-001", type: "table", name: "Approvals List" }],
    queries: ["QRY-APPROVAL-LIST", "QRY-APPROVAL-COUNTS"], mutations: ["MUT-APPROVAL-DECIDE", "MUT-APPROVAL-CREATE"],
    tables: ["DB-APPROVAL-REQUESTS", "DB-APPROVAL-APPROVERS", "DB-APPROVAL-TEMPLATES"],
    permissions: ["PERM-SYS-ALL"],
    relatedPages: ["/tasks", "/crm"],
    devNotes: [{ type: "note", text: "Supports manual, sequential, parallel, hierarchy modes" }],
  },
  { id: "PAGE-NOTIF-001", name: "Notifications", route: "/notifications", filePath: "src/pages/NotificationsPage.tsx", layout: "AppLayout", module: "Communication",
    sections: [], queries: ["QRY-NOTIFICATIONS-LIST", "QRY-NOTIFICATIONS-UNREAD"], mutations: ["MUT-NOTIFICATIONS-READ", "MUT-NOTIFICATIONS-READ-ALL"],
    tables: ["DB-NOTIFICATIONS"], permissions: ["PERM-SYS-ALL"],
    relatedPages: [],
    devNotes: [],
  },
  { id: "PAGE-MSG-001", name: "Messenger", route: "/messenger", filePath: "src/pages/MessengerPage.tsx", layout: "AppLayout", module: "Communication",
    sections: [{ id: "MSG-001-SECTION-001", type: "section", name: "Chat Interface" }, { id: "MSG-001-FORM-001", type: "form", name: "Send Message" }],
    queries: ["QRY-MSG-CHANNELS", "QRY-MSG-MESSAGES", "QRY-MSG-DM-UNREAD"], mutations: ["MUT-MSG-SEND", "MUT-MSG-CREATE-CHANNEL", "MUT-MSG-SEND-DM"],
    tables: ["DB-CHANNELS", "DB-CHANNEL-MEMBERS", "DB-MESSAGES", "DB-DIRECT-MESSAGES"],
    permissions: ["PERM-SYS-ALL"],
    relatedPages: [],
    devNotes: [{ type: "note", text: "Supports channels, announcements, and DMs" }],
  },
  { id: "PAGE-SYS-004", name: "Control Center", route: "/control", filePath: "src/pages/ControlCenter.tsx", layout: "AppLayout", module: "System",
    sections: [
      { id: "SYS-004-FORM-001", type: "form", name: "Create User" },
      { id: "SYS-004-FORM-002", type: "form", name: "Create Team" },
      { id: "SYS-004-FORM-003", type: "form", name: "Broadcast Message" },
      { id: "SYS-004-FORM-004", type: "form", name: "Reset Password" },
      { id: "SYS-004-FORM-005", type: "form", name: "Create Channel" },
    ],
    queries: ["QRY-USERS-LIST", "QRY-MSG-CHANNELS"], mutations: ["MUT-USERS-CREATE", "MUT-USERS-RESET-PASSWORD", "MUT-ORG-TEAM-CREATE", "MUT-MSG-CREATE-CHANNEL"],
    tables: ["DB-USERS", "DB-TEAMS", "DB-CHANNELS"], permissions: ["PERM-SYS-ADMIN"],
    relatedPages: ["/users", "/org", "/messenger"],
    devNotes: [{ type: "note", text: "CEO-only administrative panel" }],
  },
  { id: "PAGE-SYS-005", name: "Profile", route: "/profile", filePath: "src/pages/ProfilePage.tsx", layout: "AppLayout", module: "System", sections: [], queries: [], mutations: [], tables: ["DB-USERS"], permissions: ["PERM-SYS-ALL"], relatedPages: [], devNotes: [] },
  { id: "PAGE-COURSE-001", name: "Course Studio", route: "/courses", filePath: "src/pages/CourseStudio.tsx", layout: "AppLayout", module: "Production",
    sections: [], queries: ["QRY-COURSES-LIST"], mutations: ["MUT-COURSES-CREATE", "MUT-COURSES-UPDATE"],
    tables: ["DB-COURSES", "DB-LEAD-COURSES"], permissions: ["PERM-COURSE-ADMIN"],
    relatedPages: ["/crm/leads/:leadId"],
    devNotes: [],
  },
  { id: "PAGE-MD-001", name: "Master Data Studio", route: "/studios/master-data", filePath: "src/pages/MasterDataStudio.tsx", layout: "AppLayout", module: "System",
    sections: [], queries: [], mutations: [], tables: ["All master data tables"], permissions: ["PERM-SYS-ADMIN"],
    relatedPages: [],
    devNotes: [{ type: "note", text: "Master Data Studio manages ~50+ master data tables" }],
  },
  {
    id: "PAGE-INTAKE-001", name: "Intake Dashboard", route: "/studios/intake", filePath: "src/pages/IntakeDashboard.tsx", layout: "AppLayout", module: "Intake Engine",
    sections: [
      { id: "INTAKE-001-SECTION-001", type: "section", name: "Stats Cards" },
      { id: "INTAKE-001-SECTION-002", type: "section", name: "Status Distribution Chart" },
      { id: "INTAKE-001-SECTION-003", type: "section", name: "Source Distribution Chart" },
      { id: "INTAKE-001-SECTION-004", type: "section", name: "Submission Queue" },
      { id: "INTAKE-001-SECTION-005", type: "section", name: "Submission Detail (Expandable)" },
      { id: "INTAKE-001-SECTION-006", type: "section", name: "Timeline Dialog" },
      { id: "INTAKE-001-SECTION-007", type: "section", name: "Test Submission Dialog" },
      { id: "INTAKE-001-BTN-001", type: "button", name: "Test Submission" },
      { id: "INTAKE-001-BTN-002", type: "button", name: "View Timeline" },
      { id: "INTAKE-001-BTN-003", type: "button", name: "Retry" },
      { id: "INTAKE-001-BTN-004", type: "button", name: "Cancel" },
    ],
    queries: ["QRY-INTAKE-LIST", "QRY-INTAKE-GET", "QRY-INTAKE-TIMELINE", "QRY-INTAKE-SEARCH", "QRY-INTAKE-DUP-RULES", "QRY-INTAKE-TRANSFORM", "QRY-INTAKE-ROUTING"],
    mutations: ["MUT-INTAKE-SUBMIT", "MUT-INTAKE-VALIDATE", "MUT-INTAKE-DEDUP", "MUT-INTAKE-VERIFY", "MUT-INTAKE-TRANSFORM", "MUT-INTAKE-ROUTE", "MUT-INTAKE-PROCESS", "MUT-INTAKE-RETRY", "MUT-INTAKE-CANCEL"],
    tables: ["DB-INTAKE-SUBMISSIONS", "DB-INTAKE-TIMELINE", "DB-INTAKE-DUP-RULES", "DB-INTAKE-TRANSFORM", "DB-INTAKE-ROUTING", "DB-INTAKE-EVENTS"],
    permissions: ["PERM-SYS-ADMIN"],
    relatedPages: ["/studios/forms"],
    devNotes: [{ type: "note", text: "Universal Intake Engine — every submission follows one common lifecycle" }],
    architecture: { flow: "Source → Submit → Validate → Deduplicate → Verify → Transform → Route → Complete", description: "Universal intake pipeline for all incoming data" },
  }, {
    id: "PAGE-FORM-001", name: "Form Studio", route: "/studios/forms", filePath: "src/pages/FormStudio.tsx", layout: "AppLayout", module: "Forms",
    sections: [
      { id: "FORM-001-SECTION-001", type: "section", name: "Form Dashboard" },
      { id: "FORM-001-SECTION-002", type: "section", name: "Form Builder" },
      { id: "FORM-001-SECTION-003", type: "section", name: "Form Settings" },
      { id: "FORM-001-SECTION-004", type: "section", name: "Submissions Viewer" },
      { id: "FORM-001-SECTION-005", type: "section", name: "Share & Publish" },
      { id: "FORM-001-BTN-001", type: "button", name: "Create Form" },
      { id: "FORM-001-BTN-002", type: "button", name: "Publish Form" },
      { id: "FORM-001-FORM-001", type: "form", name: "Form Settings Editor" },
      { id: "FORM-001-FORM-002", type: "form", name: "Field Editor Dialog" },
      { id: "FORM-001-DIALOG-001", type: "dialog", name: "Field Type Picker" },
    ],
    queries: ["QRY-FORM-LIST", "QRY-FORM-GET", "QRY-FORM-FIELDS", "QRY-FORM-STATS", "QRY-FORM-SUBMISSIONS"],
    mutations: ["MUT-FORM-CREATE", "MUT-FORM-UPDATE", "MUT-FORM-PUBLISH", "MUT-FORM-ARCHIVE", "MUT-FORM-DELETE", "MUT-FIELD-CREATE", "MUT-FIELD-UPDATE", "MUT-FIELD-DELETE", "MUT-SUBMISSION-CREATE"],
    tables: ["DB-FORMS", "DB-FORM-FIELDS", "DB-FORM-VERSIONS", "DB-FORM-SUBMISSIONS"],
    permissions: ["PERM-SYS-ADMIN"],
    relatedPages: [],
    devNotes: [{ type: "note", text: "Universal Intake Engine — reusable by CRM, HR, Admissions, and all future modules" }],
    architecture: { flow: "Form Studio → Form Engine (Convex) → Form Tables", description: "Dynamic form builder with versioned schemas" },
  },
  {
    id: "PAGE-PLATFORM-001", name: "Platform Studio", route: "/platform-studio", filePath: "src/pages/PlatformStudio.tsx", layout: "AppLayout", module: "Platform",
    sections: [], queries: [], mutations: [], tables: [],
    permissions: ["PERM-SYS-ADMIN"], relatedPages: [],
    devNotes: [{ type: "note", text: "Platform Studio is self-referential — it documents itself" }],
  },
];

// ═════════════════════════════════════════════════════════════════
//  DATABASE TABLES
// ═════════════════════════════════════════════════════════════════

const DATABASE_TABLES: TableInfo[] = [
  {
    name: "users", id: "DB-USERS", module: "System", description: "Platform users with authentication and profile data",
    fields: [
      { name: "name", type: "string?", required: false }, { name: "email", type: "string?", required: false },
      { name: "username", type: "string?", required: false }, { name: "role", type: "super_admin|admin|manager|staff", required: false },
      { name: "isDisabled", type: "boolean?", required: false }, { name: "designationId", type: "Id(designations)", required: false },
      { name: "departmentId", type: "Id(departments)", required: false }, { name: "companyId", type: "Id(companies)", required: false },
      { name: "branchId", type: "Id(branches)", required: false }, { name: "verticalId", type: "Id(verticals)", required: false },
      { name: "teamIds", type: "Id(teams)[]", required: false }, { name: "phone", type: "string?", required: false },
    ],
    indexes: [{ name: "email", fields: ["email"] }, { name: "username", fields: ["username"] }, { name: "role", fields: ["role"] }],
    relationships: [{ table: "designations", field: "designationId" }, { table: "departments", field: "departmentId" }],
    queries: ["QRY-USERS-LIST", "QRY-USERS-GET"], mutations: ["MUT-USERS-CREATE", "MUT-USERS-UPDATE-ROLE", "MUT-USERS-RESET-PASSWORD", "MUT-USERS-DISABLE"],
    permissions: ["PERM-USERS-ADMIN"], usedByPages: ["PAGE-SYS-001", "PAGE-SYS-002", "PAGE-SYS-003", "PAGE-SYS-004"],
  },
  {
    name: "leadMaster", id: "DB-LEADS", module: "CRM", description: "CRM lead records with stage, priority, and financial fields",
    fields: [
      { name: "firstName", type: "string", required: true }, { name: "lastName", type: "string", required: true },
      { name: "phone", type: "string", required: true }, { name: "email", type: "string?", required: false },
      { name: "stage", type: "string", required: true }, { name: "ownerId", type: "Id(users)?", required: false },
      { name: "priority", type: "low|medium|high|critical", required: true },
      { name: "status", type: "active|converted|lost|archived", required: true },
      { name: "standardAmount", type: "number?", required: false }, { name: "discountAmount", type: "number?", required: false },
      { name: "finalPayable", type: "number?", required: false },
    ],
    indexes: [{ name: "stage", fields: ["stage"] }, { name: "ownerId", fields: ["ownerId"] }, { name: "priority", fields: ["priority"] }, { name: "status", fields: ["status"] }, { name: "ownerId_stage", fields: ["ownerId", "stage"] }],
    relationships: [{ table: "users", field: "ownerId" }],
    queries: ["QRY-LEADS-LIST", "QRY-LEADS-GET", "QRY-LEADS-COUNTS"], mutations: ["MUT-LEADS-CREATE", "MUT-LEADS-UPDATE", "MUT-LEADS-DELETE"],
    permissions: ["PERM-LEADS-READ", "PERM-LEADS-WRITE"], usedByPages: ["PAGE-CRM-001", "PAGE-CRM-002", "PAGE-CRM-003"],
  },
  {
    name: "leadPayments", id: "DB-PAYMENTS", module: "CRM", description: "Payments made against leads with verification status",
    fields: [
      { name: "leadId", type: "Id(leadMaster)", required: true }, { name: "amount", type: "number", required: true },
      { name: "mode", type: "cash|upi|bank|card|cheque|online", required: true },
      { name: "reference", type: "string?", required: false }, { name: "enteredBy", type: "Id(users)", required: true },
      { name: "verifiedBy", type: "Id(users)?", required: false }, { name: "status", type: "pending|verified|rejected", required: true },
    ],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "status", fields: ["status"] }, { name: "leadId_status", fields: ["leadId", "status"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "enteredBy" }],
    queries: ["QRY-PAYMENTS-GET", "QRY-PAYMENTS-ALL"], mutations: ["MUT-PAYMENTS-ADD", "MUT-PAYMENTS-UPDATE-STATUS"],
    permissions: ["PERM-PAYMENTS-READ", "PERM-PAYMENTS-WRITE"], usedByPages: ["PAGE-CRM-001", "PAGE-CRM-003"],
  },
  {
    name: "tasks", id: "DB-TASKS", module: "System", description: "Task management items with Kanban status",
    fields: [
      { name: "title", type: "string", required: true }, { name: "status", type: "backlog|todo|in_progress|review|done", required: true },
      { name: "priority", type: "low|medium|high|critical", required: true }, { name: "ownerId", type: "Id(users)", required: true },
      { name: "assignedTo", type: "Id(users)?", required: false }, { name: "dueDate", type: "number?", required: false },
      { name: "approvalRequired", type: "boolean?", required: false },
    ],
    indexes: [{ name: "status", fields: ["status"] }, { name: "ownerId", fields: ["ownerId"] }, { name: "assignedTo", fields: ["assignedTo"] }],
    relationships: [{ table: "users", field: "ownerId" }, { table: "users", field: "assignedTo" }],
    queries: ["QRY-TASK-LIST", "QRY-TASK-GET"], mutations: ["MUT-TASK-CREATE", "MUT-TASK-UPDATE-STATUS", "MUT-TASK-UPDATE"],
    permissions: ["PERM-SYS-ALL"], usedByPages: ["PAGE-TASK-001", "PAGE-TASK-002", "PAGE-SYS-001"],
  },
  {
    name: "approvalRequests", id: "DB-APPROVAL-REQUESTS", module: "System", description: "Approval workflow requests",
    fields: [
      { name: "title", type: "string", required: true }, { name: "requesterId", type: "Id(users)", required: true },
      { name: "status", type: "pending|approved|rejected|cancelled", required: true },
      { name: "mode", type: "manual|sequential|parallel|hierarchy", required: true },
      { name: "totalPhases", type: "number", required: true },
    ],
    indexes: [{ name: "requesterId", fields: ["requesterId"] }, { name: "status", fields: ["status"] }],
    relationships: [{ table: "users", field: "requesterId" }, { table: "tasks", field: "taskId" }],
    queries: ["QRY-APPROVAL-LIST", "QRY-APPROVAL-COUNTS"], mutations: ["MUT-APPROVAL-DECIDE", "MUT-APPROVAL-CREATE"],
    permissions: ["PERM-SYS-ALL"], usedByPages: ["PAGE-APPROVAL-001", "PAGE-SYS-001"],
  },
  {
    name: "notifications", id: "DB-NOTIFICATIONS", module: "Communication", description: "User notification records",
    fields: [
      { name: "userId", type: "Id(users)", required: true }, { name: "type", type: "task|approval|message|mention|announcement|payment|conversion|lead", required: true },
      { name: "title", type: "string", required: true }, { name: "message", type: "string", required: true }, { name: "isRead", type: "boolean", required: true },
    ],
    indexes: [{ name: "userId", fields: ["userId"] }, { name: "userId_isRead", fields: ["userId", "isRead"] }],
    relationships: [{ table: "users", field: "userId" }],
    queries: ["QRY-NOTIFICATIONS-LIST", "QRY-NOTIFICATIONS-UNREAD"], mutations: ["MUT-NOTIFICATIONS-READ", "MUT-NOTIFICATIONS-READ-ALL"],
    permissions: ["PERM-SYS-ALL"], usedByPages: ["PAGE-NOTIF-001", "PAGE-SYS-001"],
  },
  { name: "opportunities", id: "DB-OPPORTUNITIES", module: "Sales", description: "Sales opportunities",
    fields: [{ name: "leadId", type: "Id(leadMaster)", required: true }, { name: "ownerId", type: "Id(users)", required: true }, { name: "title", type: "string", required: true }, { name: "stageId", type: "Id(salesOpportunityStages)", required: true }, { name: "probability", type: "number", required: true }, { name: "isActive", type: "boolean", required: true }],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "ownerId", fields: ["ownerId"] }, { name: "stageId", fields: ["stageId"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "ownerId" }],
    queries: ["QRY-SALES-OPPORTUNITIES"], mutations: ["MUT-OPPORTUNITY-CREATE", "MUT-OPPORTUNITY-UPDATE"],
    permissions: ["PERM-SALES-READ", "PERM-SALES-WRITE"], usedByPages: ["PAGE-SALES-001", "PAGE-SALES-002"],
  },
  { name: "quotations", id: "DB-QUOTATIONS", module: "Sales", description: "Sales quotations",
    fields: [{ name: "opportunityId", type: "Id(opportunities)", required: true }, { name: "leadId", type: "Id(leadMaster)", required: true }, { name: "quoteNumber", type: "string", required: true }, { name: "status", type: "draft|sent|accepted|rejected|expired|revised", required: true }, { name: "total", type: "number", required: true }],
    indexes: [{ name: "opportunityId", fields: ["opportunityId"] }, { name: "leadId", fields: ["leadId"] }, { name: "status", fields: ["status"] }],
    relationships: [{ table: "opportunities", field: "opportunityId" }, { table: "leadMaster", field: "leadId" }],
    queries: ["QRY-QUOTATION-GET", "QRY-QUOTATION-LINE-ITEMS"], mutations: ["MUT-QUOTATION-UPDATE"],
    permissions: ["PERM-SALES-READ", "PERM-SALES-WRITE"], usedByPages: ["PAGE-SALES-003"],
  },
  { name: "verification_requests", id: "DB-VERIFICATION", module: "System", description: "Universal verification engine requests",
    fields: [{ name: "entityType", type: "string", required: true }, { name: "entityId", type: "string", required: true }, { name: "requesterId", type: "Id(users)", required: true }, { name: "assignedUserIds", type: "Id(users)[]", required: true }, { name: "mode", type: "any_one|all_required|sequential|round_robin", required: true }, { name: "status", type: "pending|verified|rejected|returned", required: true }],
    indexes: [{ name: "entityType", fields: ["entityType"] }, { name: "entityId", fields: ["entityId"] }, { name: "status", fields: ["status"] }],
    relationships: [{ table: "users", field: "requesterId" }],
    queries: ["QRY-VERIFICATION-LIST", "QRY-VERIFICATION-GET"], mutations: ["MUT-VERIFICATION-DECIDE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: [],
  },
  {
    name: "leadActivity", id: "DB-ACTIVITY", module: "CRM", description: "Activity log for leads",
    fields: [{ name: "leadId", type: "Id(leadMaster)", required: true }, { name: "action", type: "string", required: true }, { name: "description", type: "string", required: true }, { name: "userId", type: "Id(users)", required: true }],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "leadId_createdAt", fields: ["leadId", "createdAt"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }],
    queries: ["QRY-LEAD-ACTIVITY"], mutations: [],
    permissions: ["PERM-LEADS-READ"], usedByPages: ["PAGE-CRM-003", "PAGE-CRM-001"],
  },
  {
    name: "leadStageHistory", id: "DB-LEAD-STAGE-HISTORY", module: "CRM", description: "Stage change tracking for leads",
    fields: [{ name: "leadId", type: "Id(leadMaster)", required: true }, { name: "fromStage", type: "string?", required: false }, { name: "toStage", type: "string", required: true }, { name: "changedBy", type: "Id(users)", required: true }],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "leadId_createdAt", fields: ["leadId", "createdAt"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }],
    queries: ["QRY-LEAD-STAGE-HISTORY"], mutations: [],
    permissions: ["PERM-LEADS-READ"], usedByPages: ["PAGE-CRM-003", "PAGE-CRM-001"],
  },
  { name: "intakeSubmissions", id: "DB-INTAKE-SUBMISSIONS", module: "Intake Engine", description: "Universal submission records with full processing lifecycle",
    fields: [
      { name: "submissionNumber", type: "string", required: true }, { name: "source", type: "manual_form|public_form|csv_import|rest_api|webhook", required: true },
      { name: "payload", type: "string", required: true }, { name: "processingStatus", type: "string", required: true },
      { name: "validationStatus", type: "string?", required: false }, { name: "verificationStatus", type: "string?", required: false },
      { name: "duplicateStatus", type: "string?", required: false }, { name: "routingStatus", type: "string?", required: false },
      { name: "targetModule", type: "string?", required: false }, { name: "retryCount", type: "number?", required: false },
      { name: "submissionDate", type: "number", required: true },
    ],
    indexes: [{ name: "submissionNumber", fields: ["submissionNumber"] }, { name: "processingStatus", fields: ["processingStatus"] }, { name: "source", fields: ["source"] }, { name: "targetModule", fields: ["targetModule"] }, { name: "createdAt", fields: ["createdAt"] }],
    relationships: [{ table: "forms", field: "formId" }],
    queries: ["QRY-INTAKE-LIST", "QRY-INTAKE-GET", "QRY-INTAKE-SEARCH"], mutations: ["MUT-INTAKE-SUBMIT", "MUT-INTAKE-PROCESS", "MUT-INTAKE-RETRY", "MUT-INTAKE-CANCEL"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: ["PAGE-INTAKE-001"],
  },
  { name: "intakeTimeline", id: "DB-INTAKE-TIMELINE", module: "Intake Engine", description: "Time-ordered log of every processing step per submission",
    fields: [{ name: "submissionId", type: "Id(intakeSubmissions)", required: true }, { name: "action", type: "string", required: true }, { name: "status", type: "string", required: true }, { name: "details", type: "string?", required: false }],
    indexes: [{ name: "submissionId", fields: ["submissionId"] }, { name: "submissionId_createdAt", fields: ["submissionId", "createdAt"] }],
    relationships: [{ table: "intakeSubmissions", field: "submissionId" }],
    queries: ["QRY-INTAKE-TIMELINE"], mutations: [], permissions: ["PERM-SYS-ADMIN"], usedByPages: ["PAGE-INTAKE-001"],
  },
  { name: "intakeDuplicateRules", id: "DB-INTAKE-DUP-RULES", module: "Intake Engine", description: "Configurable duplicate detection rules",
    fields: [{ name: "name", type: "string", required: true }, { name: "matchFields", type: "string[]", required: true }, { name: "matchType", type: "any|all|custom", required: true }, { name: "action", type: "ignore|merge|keep_both|review", required: true }],
    indexes: [{ name: "isActive", fields: ["isActive"] }],
    relationships: [],
    queries: ["QRY-INTAKE-DUP-RULES"], mutations: ["MUT-INTAKE-DUP-CREATE", "MUT-INTAKE-DUP-UPDATE", "MUT-INTAKE-DUP-DELETE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: [],
  },
  { name: "intakeTransformMappings", id: "DB-INTAKE-TRANSFORM", module: "Intake Engine", description: "Field-level transformation mappings for each target module",
    fields: [{ name: "sourceField", type: "string", required: true }, { name: "targetField", type: "string", required: true }, { name: "targetModule", type: "string", required: true }, { name: "transformation", type: "string?", required: false }, { name: "isRequired", type: "boolean", required: true }],
    indexes: [{ name: "targetModule", fields: ["targetModule"] }, { name: "isActive", fields: ["isActive"] }],
    relationships: [],
    queries: ["QRY-INTAKE-TRANSFORM"], mutations: ["MUT-INTAKE-TRANSFORM-CREATE", "MUT-INTAKE-TRANSFORM-UPDATE", "MUT-INTAKE-TRANSFORM-DELETE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: [],
  },
  { name: "intakeRoutingRules", id: "DB-INTAKE-ROUTING", module: "Intake Engine", description: "Dynamic routing rules to determine target module",
    fields: [{ name: "name", type: "string", required: true }, { name: "targetModule", type: "string", required: true }, { name: "conditionField", type: "string?", required: false }, { name: "defaultRoute", type: "boolean" }, { name: "priority", type: "number" }],
    indexes: [{ name: "targetModule", fields: ["targetModule"] }, { name: "isActive", fields: ["isActive"] }, { name: "priority", fields: ["priority"] }],
    relationships: [],
    queries: ["QRY-INTAKE-ROUTING"], mutations: ["MUT-INTAKE-ROUTING-CREATE", "MUT-INTAKE-ROUTING-UPDATE", "MUT-INTAKE-ROUTING-DELETE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: [],
  },
  { name: "forms", id: "DB-FORMS", module: "Forms", description: "Form definitions with metadata and status",
    fields: [
      { name: "name", type: "string", required: true }, { name: "code", type: "string", required: true },
      { name: "status", type: "draft|published|archived|deactivated", required: true },
      { name: "version", type: "number", required: true }, { name: "isPublic", type: "boolean", required: true },
      { name: "requiresAuth", type: "boolean", required: true }, { name: "category", type: "string?", required: false },
    ],
    indexes: [{ name: "code", fields: ["code"] }, { name: "status", fields: ["status"] }, { name: "category", fields: ["category"] }],
    relationships: [{ table: "users", field: "ownerId" }],
    queries: ["QRY-FORM-LIST", "QRY-FORM-GET"], mutations: ["MUT-FORM-CREATE", "MUT-FORM-UPDATE", "MUT-FORM-PUBLISH", "MUT-FORM-ARCHIVE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: ["PAGE-FORM-001"],
  },
  { name: "formFields", id: "DB-FORM-FIELDS", module: "Forms", description: "Individual field definitions per form version",
    fields: [
      { name: "formId", type: "Id(forms)", required: true }, { name: "fieldCode", type: "string", required: true },
      { name: "fieldType", type: "string", required: true }, { name: "label", type: "string", required: true },
      { name: "required", type: "boolean", required: true }, { name: "displayOrder", type: "number", required: true },
    ],
    indexes: [{ name: "formId", fields: ["formId"] }, { name: "formId_fieldCode", fields: ["formId", "fieldCode"] }],
    relationships: [{ table: "forms", field: "formId" }],
    queries: ["QRY-FORM-FIELDS"], mutations: ["MUT-FIELD-CREATE", "MUT-FIELD-UPDATE", "MUT-FIELD-DELETE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: ["PAGE-FORM-001"],
  },
  { name: "formVersions", id: "DB-FORM-VERSIONS", module: "Forms", description: "Version history for forms with schema snapshots",
    fields: [
      { name: "formId", type: "Id(forms)", required: true }, { name: "version", type: "number", required: true },
      { name: "status", type: "draft|published|archived", required: true }, { name: "schemaData", type: "string", required: true },
    ],
    indexes: [{ name: "formId", fields: ["formId"] }, { name: "formId_version", fields: ["formId", "version"] }],
    relationships: [{ table: "forms", field: "formId" }],
    queries: [], mutations: [], permissions: ["PERM-SYS-ADMIN"], usedByPages: [],
  },
  { name: "formSubmissions", id: "DB-FORM-SUBMISSIONS", module: "Forms", description: "Form submissions with version-linked payloads",
    fields: [
      { name: "formId", type: "Id(forms)", required: true }, { name: "formVersion", type: "number", required: true },
      { name: "payload", type: "string", required: true }, { name: "status", type: "string", required: true },
    ],
    indexes: [{ name: "formId", fields: ["formId"] }, { name: "status", fields: ["status"] }, { name: "formId_status", fields: ["formId", "status"] }],
    relationships: [{ table: "forms", field: "formId" }],
    queries: ["QRY-FORM-SUBMISSIONS"], mutations: ["MUT-SUBMISSION-CREATE"],
    permissions: ["PERM-SYS-ADMIN"], usedByPages: ["PAGE-FORM-001"],
  },
  { name: "courses", id: "DB-COURSES", module: "Production", description: "Course catalog",
    fields: [{ name: "courseCode", type: "string", required: true }, { name: "courseName", type: "string", required: true }, { name: "baseFee", type: "number", required: true }, { name: "status", type: "active|archived|draft", required: true }],
    indexes: [{ name: "courseCode", fields: ["courseCode"] }, { name: "status", fields: ["status"] }],
    relationships: [],
    queries: ["QRY-COURSES-LIST"], mutations: ["MUT-COURSES-CREATE", "MUT-COURSES-UPDATE"],
    permissions: ["PERM-COURSE-ADMIN"], usedByPages: ["PAGE-COURSE-001"],
  },
];

// ═════════════════════════════════════════════════════════════════
//  APIs (Queries & Mutations)
// ═════════════════════════════════════════════════════════════════

const APIS: ApiInfo[] = [
  // CRM Queries
  { name: "crmLeads:listLeads", id: "QRY-LEADS-LIST", type: "query", module: "CRM", parameters: "{ ownerId?, stage?, status?, search? }", returnType: "LeadMaster[]", usedBy: ["PAGE-CRM-001", "PAGE-CRM-002"], permission: "PERM-LEADS-READ" },
  { name: "crmLeads:getLeadById", id: "QRY-LEADS-GET", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "LeadMaster", usedBy: ["PAGE-CRM-003"], permission: "PERM-LEADS-READ" },
  { name: "crmLeads:getLeadCounts", id: "QRY-LEADS-COUNTS", type: "query", module: "CRM", parameters: "{}", returnType: "LeadCounts", usedBy: ["PAGE-CRM-002"], permission: "PERM-LEADS-READ" },
  { name: "crmPayments:getLeadPayments", id: "QRY-PAYMENTS-GET", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "LeadPayment[]", usedBy: ["PAGE-CRM-003"], permission: "PERM-PAYMENTS-READ" },
  { name: "crmPayments:getAllLeadsPayments", id: "QRY-PAYMENTS-ALL", type: "query", module: "CRM", parameters: "{}", returnType: "LeadPaymentSummary[]", usedBy: ["PAGE-CRM-001"], permission: "PERM-PAYMENTS-READ" },
  { name: "crmDashboard:getCrmDashboardData", id: "QRY-CRM-DASHBOARD", type: "query", module: "CRM", parameters: "{ userId, dateFilter }", returnType: "DashboardData", usedBy: ["PAGE-CRM-001"], permission: "PERM-CRM-ADMIN" },
  { name: "crmDashboard:getConversionHistory", id: "QRY-CRM-CONVERSION-HISTORY", type: "query", module: "CRM", parameters: "{}", returnType: "ConversionEntry[]", usedBy: ["PAGE-CRM-001"], permission: "PERM-CRM-ADMIN" },
  { name: "crmActivity:getLeadActivity", id: "QRY-LEAD-ACTIVITY", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "ActivityEntry[]", usedBy: ["PAGE-CRM-003"], permission: "PERM-LEADS-READ" },
  { name: "crmActivity:getLeadStageHistory", id: "QRY-LEAD-STAGE-HISTORY", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "StageChange[]", usedBy: ["PAGE-CRM-003"], permission: "PERM-LEADS-READ" },
  { name: "crmTasks:listLeadTasks", id: "QRY-LEAD-TASKS", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "LeadTask[]", usedBy: ["PAGE-CRM-003"], permission: "PERM-LEADS-READ" },
  { name: "intakeEngine:listSubmissions", id: "QRY-INTAKE-LIST", type: "query", module: "Intake Engine", parameters: "{ status?, source?, targetModule?, limit? }", returnType: "IntakeSubmission[]", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:getSubmission", id: "QRY-INTAKE-GET", type: "query", module: "Intake Engine", parameters: "{ submissionId }", returnType: "IntakeSubmission", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:getSubmissionTimeline", id: "QRY-INTAKE-TIMELINE", type: "query", module: "Intake Engine", parameters: "{ submissionId }", returnType: "TimelineEntry[]", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:searchSubmissions", id: "QRY-INTAKE-SEARCH", type: "query", module: "Intake Engine", parameters: "{ query, limit? }", returnType: "IntakeSubmission[]", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:listDuplicateRules", id: "QRY-INTAKE-DUP-RULES", type: "query", module: "Intake Engine", parameters: "{}", returnType: "DuplicateRule[]", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:listTransformMappings", id: "QRY-INTAKE-TRANSFORM", type: "query", module: "Intake Engine", parameters: "{ targetModule? }", returnType: "TransformMapping[]", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:listRoutingRules", id: "QRY-INTAKE-ROUTING", type: "query", module: "Intake Engine", parameters: "{ targetModule? }", returnType: "RoutingRule[]", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:submit", id: "MUT-INTAKE-SUBMIT", type: "mutation", module: "Intake Engine", parameters: "{ source, payload, ... }", returnType: "{ submissionId, submissionNumber }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:validate", id: "MUT-INTAKE-VALIDATE", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, validatedBy? }", returnType: "{ valid, errors, warnings }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:deduplicate", id: "MUT-INTAKE-DEDUP", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, checkedBy? }", returnType: "{ isDuplicate, reason, action? }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:verify", id: "MUT-INTAKE-VERIFY", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, status, verifiedBy, remarks? }", returnType: "{ status }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:transform", id: "MUT-INTAKE-TRANSFORM", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, targetModule, mappedBy? }", returnType: "{ transformed, missingRequired, appliedCount }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:route", id: "MUT-INTAKE-ROUTE", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, targetModule?, routedBy? }", returnType: "{ targetModule }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:processSubmission", id: "MUT-INTAKE-PROCESS", type: "mutation", module: "Intake Engine", parameters: "{ source, payload, ... }", returnType: "{ submissionId, submissionNumber, status }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:retrySubmission", id: "MUT-INTAKE-RETRY", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, retriedBy? }", returnType: "{ retryCount }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:cancelSubmission", id: "MUT-INTAKE-CANCEL", type: "mutation", module: "Intake Engine", parameters: "{ submissionId, reason?, cancelledBy? }", returnType: "{ status }", usedBy: ["PAGE-INTAKE-001"], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:createDuplicateRule", id: "MUT-INTAKE-DUP-CREATE", type: "mutation", module: "Intake Engine", parameters: "{ name, matchFields, matchType, action, targetFormIds? }", returnType: "Id", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:updateDuplicateRule", id: "MUT-INTAKE-DUP-UPDATE", type: "mutation", module: "Intake Engine", parameters: "{ ruleId, ... }", returnType: "void", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:deleteDuplicateRule", id: "MUT-INTAKE-DUP-DELETE", type: "mutation", module: "Intake Engine", parameters: "{ ruleId }", returnType: "void", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:createTransformMapping", id: "MUT-INTAKE-TRANSFORM-CREATE", type: "mutation", module: "Intake Engine", parameters: "{ name, sourceField, targetField, targetModule, ... }", returnType: "Id", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:updateTransformMapping", id: "MUT-INTAKE-TRANSFORM-UPDATE", type: "mutation", module: "Intake Engine", parameters: "{ mappingId, ... }", returnType: "void", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:deleteTransformMapping", id: "MUT-INTAKE-TRANSFORM-DELETE", type: "mutation", module: "Intake Engine", parameters: "{ mappingId }", returnType: "void", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:createRoutingRule", id: "MUT-INTAKE-ROUTING-CREATE", type: "mutation", module: "Intake Engine", parameters: "{ name, targetModule, conditionField?, ... }", returnType: "Id", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:updateRoutingRule", id: "MUT-INTAKE-ROUTING-UPDATE", type: "mutation", module: "Intake Engine", parameters: "{ ruleId, ... }", returnType: "void", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "intakeEngine:deleteRoutingRule", id: "MUT-INTAKE-ROUTING-DELETE", type: "mutation", module: "Intake Engine", parameters: "{ ruleId }", returnType: "void", usedBy: [], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:listForms", id: "QRY-FORM-LIST", type: "query", module: "Forms", parameters: "{ category?, status? }", returnType: "Form[]", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:getForm", id: "QRY-FORM-GET", type: "query", module: "Forms", parameters: "{ formId }", returnType: "Form", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:listFormFields", id: "QRY-FORM-FIELDS", type: "query", module: "Forms", parameters: "{ formId }", returnType: "FormField[]", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:getFormStats", id: "QRY-FORM-STATS", type: "query", module: "Forms", parameters: "{}", returnType: "FormStats", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:listSubmissions", id: "QRY-FORM-SUBMISSIONS", type: "query", module: "Forms", parameters: "{ formId, status? }", returnType: "FormSubmission[]", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:createForm", id: "MUT-FORM-CREATE", type: "mutation", module: "Forms", parameters: "{ name, code?, description?, category? }", returnType: "Id", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:updateForm", id: "MUT-FORM-UPDATE", type: "mutation", module: "Forms", parameters: "{ formId, ...fields }", returnType: "void", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:publishForm", id: "MUT-FORM-PUBLISH", type: "mutation", module: "Forms", parameters: "{ formId, publishedBy? }", returnType: "{ version }", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:archiveForm", id: "MUT-FORM-ARCHIVE", type: "mutation", module: "Forms", parameters: "{ formId }", returnType: "void", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:deleteForm", id: "MUT-FORM-DELETE", type: "mutation", module: "Forms", parameters: "{ formId }", returnType: "void", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:createFormField", id: "MUT-FIELD-CREATE", type: "mutation", module: "Forms", parameters: "{ formId, fieldCode, fieldType, label, ... }", returnType: "Id", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:updateFormField", id: "MUT-FIELD-UPDATE", type: "mutation", module: "Forms", parameters: "{ fieldId, ...fields }", returnType: "void", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:deleteFormField", id: "MUT-FIELD-DELETE", type: "mutation", module: "Forms", parameters: "{ fieldId }", returnType: "void", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "formEngine:createSubmission", id: "MUT-SUBMISSION-CREATE", type: "mutation", module: "Forms", parameters: "{ formId, payload, ... }", returnType: "Id", usedBy: ["PAGE-FORM-001"], permission: "PERM-SYS-ADMIN" },
  { name: "crmCourses:listCourses", id: "QRY-COURSES-LIST", type: "query", module: "Production", parameters: "{}", returnType: "Course[]", usedBy: ["PAGE-COURSE-001"], permission: "PERM-COURSE-ADMIN" },
  // CRM Mutations
  { name: "crmLeads:createLead", id: "MUT-LEADS-CREATE", type: "mutation", module: "CRM", parameters: "{ firstName, lastName, phone, stage, priority, ... }", returnType: "Id", usedBy: ["PAGE-CRM-002"], permission: "PERM-LEADS-WRITE" },
  { name: "crmLeads:updateLead", id: "MUT-LEADS-UPDATE", type: "mutation", module: "CRM", parameters: "{ leadId, ...fields }", returnType: "void", usedBy: ["PAGE-CRM-003"], permission: "PERM-LEADS-WRITE" },
  { name: "crmLeads:deleteLead", id: "MUT-LEADS-DELETE", type: "mutation", module: "CRM", parameters: "{ leadId }", returnType: "void", usedBy: ["PAGE-CRM-002"], permission: "PERM-LEADS-WRITE" },
  { name: "crmPayments:addPayment", id: "MUT-PAYMENTS-ADD", type: "mutation", module: "CRM", parameters: "{ leadId, amount, mode, reference, enteredBy }", returnType: "Id", usedBy: ["PAGE-CRM-003"], permission: "PERM-PAYMENTS-WRITE" },
  { name: "crmPayments:updatePaymentStatus", id: "MUT-PAYMENTS-UPDATE-STATUS", type: "mutation", module: "CRM", parameters: "{ paymentId, status, verifiedBy? }", returnType: "void", usedBy: [], permission: "PERM-PAYMENTS-WRITE" },
  { name: "crmTasks:createLeadTask", id: "MUT-LEAD-TASKS-CREATE", type: "mutation", module: "CRM", parameters: "{ leadId, title, ownerId, ... }", returnType: "Id", usedBy: ["PAGE-CRM-003"], permission: "PERM-LEADS-WRITE" },
  // Organization
  { name: "organization:listDepartments", id: "QRY-ORG-DEPARTMENTS", type: "query", module: "Organization", parameters: "{}", returnType: "Department[]", usedBy: ["PAGE-ORG-001"], permission: "PERM-ORG-READ" },
  { name: "organization:listTeams", id: "QRY-ORG-TEAMS", type: "query", module: "Organization", parameters: "{}", returnType: "Team[]", usedBy: ["PAGE-ORG-001"], permission: "PERM-ORG-READ" },
  { name: "organization:listBranches", id: "QRY-ORG-BRANCHES", type: "query", module: "Organization", parameters: "{}", returnType: "Branch[]", usedBy: ["PAGE-ORG-001"], permission: "PERM-ORG-READ" },
  { name: "organization:listVerticals", id: "QRY-ORG-VERTICALS", type: "query", module: "Organization", parameters: "{}", returnType: "Vertical[]", usedBy: ["PAGE-ORG-001"], permission: "PERM-ORG-READ" },
  // Users
  { name: "users:listUsers", id: "QRY-USERS-LIST", type: "query", module: "System", parameters: "{}", returnType: "User[]", usedBy: ["PAGE-SYS-002", "PAGE-SYS-003", "PAGE-SYS-004"], permission: "PERM-USERS-ADMIN" },
  { name: "users:getUser", id: "QRY-USERS-GET", type: "query", module: "System", parameters: "{ userId }", returnType: "User", usedBy: ["PAGE-SYS-002"], permission: "PERM-USERS-ADMIN" },
  { name: "userManagement:createUser", id: "MUT-USERS-CREATE", type: "mutation", module: "System", parameters: "{ username, password, name, role, ... }", returnType: "Id", usedBy: ["PAGE-SYS-002", "PAGE-SYS-004"], permission: "PERM-USERS-ADMIN" },
  { name: "userManagement:resetPassword", id: "MUT-USERS-RESET-PASSWORD", type: "mutation", module: "System", parameters: "{ userId, newPassword }", returnType: "void", usedBy: ["PAGE-SYS-002", "PAGE-SYS-004"], permission: "PERM-USERS-ADMIN" },
  // Tasks
  { name: "tasks:listTasks", id: "QRY-TASK-LIST", type: "query", module: "System", parameters: "{ status?, ownerId?, assignedTo? }", returnType: "Task[]", usedBy: ["PAGE-TASK-001", "PAGE-SYS-001"], permission: "PERM-SYS-ALL" },
  { name: "tasks:createTask", id: "MUT-TASK-CREATE", type: "mutation", module: "System", parameters: "{ title, ownerId, status, priority, ... }", returnType: "Id", usedBy: ["PAGE-TASK-001"], permission: "PERM-SYS-ALL" },
  { name: "tasks:updateTaskStatus", id: "MUT-TASK-UPDATE-STATUS", type: "mutation", module: "System", parameters: "{ taskId, status }", returnType: "void", usedBy: ["PAGE-TASK-001"], permission: "PERM-SYS-ALL" },
  { name: "tasks:getTask", id: "QRY-TASK-GET", type: "query", module: "System", parameters: "{ taskId }", returnType: "Task", usedBy: ["PAGE-TASK-001", "PAGE-TASK-002"], permission: "PERM-SYS-ALL" },
  // Approvals
  { name: "approvals:listApprovals", id: "QRY-APPROVAL-LIST", type: "query", module: "System", parameters: "{ status?, userId? }", returnType: "ApprovalRequest[]", usedBy: ["PAGE-APPROVAL-001"], permission: "PERM-SYS-ALL" },
  { name: "approvals:getGlobalApprovalCounts", id: "QRY-APPROVAL-COUNTS", type: "query", module: "System", parameters: "{ userId }", returnType: "Counts", usedBy: ["PAGE-APPROVAL-001", "PAGE-SYS-001"], permission: "PERM-SYS-ALL" },
  { name: "approvals:decideApproval", id: "MUT-APPROVAL-DECIDE", type: "mutation", module: "System", parameters: "{ requestId, userId, decision, comment? }", returnType: "void", usedBy: ["PAGE-APPROVAL-001"], permission: "PERM-SYS-ALL" },
  // Notifications
  { name: "notifications:listNotifications", id: "QRY-NOTIFICATIONS-LIST", type: "query", module: "Communication", parameters: "{ userId }", returnType: "Notification[]", usedBy: ["PAGE-NOTIF-001"], permission: "PERM-SYS-ALL" },
  { name: "notifications:getUnreadCount", id: "QRY-NOTIFICATIONS-UNREAD", type: "query", module: "Communication", parameters: "{ userId }", returnType: "number", usedBy: ["PAGE-NOTIF-001"], permission: "PERM-SYS-ALL" },
  { name: "notifications:markAsRead", id: "MUT-NOTIFICATIONS-READ", type: "mutation", module: "Communication", parameters: "{ notificationId }", returnType: "void", usedBy: ["PAGE-NOTIF-001"], permission: "PERM-SYS-ALL" },
];

// ═════════════════════════════════════════════════════════════════
//  ENGINES
// ═════════════════════════════════════════════════════════════════

const ENGINES: EngineInfo[] = [
  { id: "ENG-ACCESS-CONTROL", name: "Access Control Engine", module: "System", purpose: "Role-based access control and scope-based visibility", apis: ["QRY-ACCESS-EFFECTIVE"], tables: ["DB-USERS", "DB-USER-SCOPES"], events: ["EVT-USER-ROLE-CHANGED", "EVT-USER-SCOPE-CHANGED"], consumers: ["All pages", "Sidebar", "API layer"], workflows: [] },
  { id: "ENG-VERIFICATION", name: "Verification Engine", module: "System", purpose: "Universal verification supporting any_one, all_required, sequential, round_robin", apis: ["QRY-VERIFICATION-LIST", "MUT-VERIFICATION-DECIDE"], tables: ["DB-VERIFICATION"], events: ["EVT-VERIFICATION-COMPLETED", "EVT-VERIFICATION-REJECTED", "EVT-VERIFICATION-REQUESTED"], consumers: ["Payment verification", "Discount approval"], workflows: ["WF-PAYMENT-VERIFICATION"] },
  { id: "ENG-NOTIFICATION", name: "Notification Engine", module: "Communication", purpose: "Real-time notifications for tasks, approvals, messages, and system events", apis: ["QRY-NOTIFICATIONS-LIST", "QRY-NOTIFICATIONS-UNREAD", "MUT-NOTIFICATIONS-READ"], tables: ["DB-NOTIFICATIONS"], events: ["EVT-NOTIFICATION-SENT", "EVT-NOTIFICATION-READ"], consumers: ["Notifications page", "Sidebar badge", "Approval Center"], workflows: [] },
  { id: "ENG-APPROVAL", name: "Approval Engine", module: "System", purpose: "Multi-mode approval workflows (manual, sequential, parallel, hierarchy)", apis: ["QRY-APPROVAL-LIST", "QRY-APPROVAL-COUNTS", "MUT-APPROVAL-DECIDE"], tables: ["DB-APPROVAL-REQUESTS"], events: ["EVT-APPROVAL-STARTED", "EVT-APPROVAL-DECIDED", "EVT-APPROVAL-COMPLETED"], consumers: ["Approval Center", "Task Management", "Lead Conversion"], workflows: ["WF-APPROVAL"] },
  { id: "ENG-COLLECTION", name: "Collection Engine", module: "Sales", purpose: "Payment collection, fee tracking, and recovery workflows", apis: [], tables: ["DB-PAYMENTS", "DB-LEADS"], events: ["EVT-PAYMENT-RECORDED", "EVT-PAYMENT-VERIFIED", "EVT-PAYMENT-REJECTED"], consumers: ["Collection Center", "Lead Workspace"], workflows: ["WF-PAYMENT-VERIFICATION"] },
  { id: "ENG-TIMELINE", name: "Timeline Engine", module: "System", purpose: "Chronological event timelines for tasks, leads, and approvals", apis: [], tables: ["DB-LEAD-STAGE-HISTORY", "DB-ACTIVITY"], events: ["EVT-TIMELINE-ENTRY-CREATED"], consumers: ["Lead Workspace", "Sales Opportunities"], workflows: [] },
  { id: "ENG-SEQUENCE", name: "Sequence Engine", module: "System", purpose: "Display ordering and sequencing for all master data entities", apis: [], tables: [], events: ["EVT-SEQUENCE-CHANGED"], consumers: ["Organization Studio", "Master Data Studio"], workflows: [] },
  { id: "ENG-AUDIT", name: "Audit Engine", module: "System", purpose: "Audit trail views and change tracking for compliance", apis: [], tables: ["DB-LEAD-STAGE-HISTORY"], events: ["EVT-AUDIT-ENTRY-CREATED"], consumers: ["Lead Workspace", "Sales Workspace"], workflows: [] },
  { id: "ENG-ATTACHMENT", name: "Attachment Engine", module: "CRM", purpose: "File attachments and documents linked to leads and tasks", apis: [], tables: ["DB-DOCUMENTS"], events: ["EVT-DOCUMENT-UPLOADED", "EVT-DOCUMENT-DELETED"], consumers: ["Lead Workspace"], workflows: [] },
  { id: "ENG-COMMENT", name: "Comment Engine", module: "System", purpose: "Threaded comments on tasks and leads", apis: [], tables: ["DB-TASK-COMMENTS", "DB-NOTES"], events: ["EVT-COMMENT-CREATED"], consumers: ["Task Detail", "Lead Workspace"], workflows: [] },
  { id: "ENG-AUTO-CONVERT", name: "Auto-Conversion Engine", module: "CRM", purpose: "Automatically converts leads when payment is verified", apis: [], tables: ["DB-LEADS", "DB-PAYMENTS", "DB-LEAD-STAGE-HISTORY"], events: ["EVT-LEAD-CONVERTED"], consumers: ["Lead Workspace", "CRM Dashboard"], workflows: ["WF-LEAD-CONVERSION"] },
];

// ═════════════════════════════════════════════════════════════════
//  AUTOMATIONS
// ═════════════════════════════════════════════════════════════════

const AUTOMATIONS: AutomationInfo[] = [
  { id: "AUTO-LEAD-001", name: "Lead Auto-Conversion", module: "CRM", trigger: "Payment verification completed", conditions: ["Lead status is 'active'", "Total verified payments > 0", "Lead not already converted"], actions: ["Patch lead stage to 'converted'", "Set lead status to 'converted'", "Log stage change in history"], notifications: ["Notify lead owner: 'Lead auto-converted after payment verification'"], timeline: "checkAutoConversion → verifyPayment → convertLead → notifyOwner", workflowId: "WF-LEAD-CONVERSION" },
  { id: "AUTO-APPROVAL-001", name: "Approval Notification", module: "System", trigger: "Approval request created or decided", conditions: ["Approval request exists", "Approver is set"], actions: ["Create notification for approver", "Update approval request status"], notifications: ["Notify approver: 'Approval request assigned'", "Notify requester: 'Decision made'"], timeline: "createApprovalRequest → notifyApprover → decideApproval → notifyRequester", workflowId: "WF-APPROVAL" },
  { id: "AUTO-TASK-001", name: "Task Assignment Notification", module: "System", trigger: "Task created or updated with assigned user change", conditions: ["Task assignedTo is set", "Owner differs from assigned"], actions: ["Create notification for assigned user", "Log in task activity"], notifications: ["Notify assigned user: 'New task assigned'"], timeline: "createTask → notifyAssigned → activityLogged" },
  { id: "AUTO-MSG-001", name: "Messenger Unread Tracking", module: "Communication", trigger: "New message in channel or DM", conditions: ["Message is not from the receiver"], actions: ["Update lastReadAt", "Increment unread count"], notifications: ["Badge update on sidebar (real-time)"], timeline: "sendMessage → updateUnread → badgeUpdate" },
  { id: "AUTO-PAYMENT-001", name: "Payment Verification Workflow", module: "Sales", trigger: "Payment recorded for a lead", conditions: ["Payment status is 'pending'", "Verification rules apply"], actions: ["Create verification request", "Assign to verifiers per rules"], notifications: ["Notify verifiers: 'Payment pending verification'"], timeline: "addPayment → createVerificationRequest → assignVerifiers → [await decision]", workflowId: "WF-PAYMENT-VERIFICATION" },
  { id: "AUTO-STAGE-001", name: "Stage Change Tracking", module: "CRM", trigger: "Lead or opportunity stage changes", conditions: ["Stage actually changed (from !== to)"], actions: ["Insert into stage history", "Log activity entry"], notifications: ["Dashboard count update"], timeline: "changeStage → logHistory → updateDashboard" },
];

// ═════════════════════════════════════════════════════════════════
//  WORKFLOWS
// ═════════════════════════════════════════════════════════════════

const WORKFLOWS: WorkflowInfo[] = [
  { id: "WF-LEAD-CONVERSION", name: "Lead Conversion", module: "CRM", description: "Converts a lead from active to converted status after payment verification", steps: ["Lead created → Payment recorded → Payment verified → Auto-convert → Notify owner"], automations: ["AUTO-LEAD-001"], engines: ["ENG-AUTO-CONVERT", "ENG-VERIFICATION", "ENG-NOTIFICATION"] },
  { id: "WF-PAYMENT-VERIFICATION", name: "Payment Verification", module: "Sales", description: "Verifies payments through the universal verification engine", steps: ["Payment recorded → Create verification request → Assign verifiers → [Action: verify/reject] → Update payment status"], automations: ["AUTO-PAYMENT-001"], engines: ["ENG-VERIFICATION", "ENG-COLLECTION"] },
  { id: "WF-APPROVAL", name: "Approval Workflow", module: "System", description: "Multi-mode approval process for tasks and actions", steps: ["Request created → Assign approvers → Approve/reject → Notify requester"], automations: ["AUTO-APPROVAL-001"], engines: ["ENG-APPROVAL", "ENG-NOTIFICATION"] },
  { id: "WF-ADMISSION", name: "Admission Workflow", module: "CRM", description: "End-to-end student admission pipeline", steps: ["Lead created → Counselling → Enrolled → Payment → Verified → Converted → Student created"], automations: ["AUTO-LEAD-001", "AUTO-PAYMENT-001"], engines: ["ENG-AUTO-CONVERT", "ENG-VERIFICATION", "ENG-COLLECTION"] },
];

// ═════════════════════════════════════════════════════════════════
//  EVENTS
// ═════════════════════════════════════════════════════════════════

const EVENTS: EventInfo[] = [
  { id: "EVT-LEAD-CONVERTED", name: "Lead Converted", module: "CRM", description: "Fired when a lead transitions to 'converted' status", producers: ["ENG-AUTO-CONVERT"], consumers: ["ENG-NOTIFICATION", "CRM Dashboard"] },
  { id: "EVT-PAYMENT-VERIFIED", name: "Payment Verified", module: "Sales", description: "Fired when a payment is verified through the verification engine", producers: ["ENG-VERIFICATION"], consumers: ["ENG-AUTO-CONVERT", "ENG-NOTIFICATION"] },
  { id: "EVT-PAYMENT-RECORDED", name: "Payment Recorded", module: "Sales", description: "Fired when a new payment is added to a lead", producers: ["Lead Workspace"], consumers: ["ENG-VERIFICATION", "ENG-COLLECTION"] },
  { id: "EVT-USER-ROLE-CHANGED", name: "User Role Changed", module: "System", description: "Fired when a user's platform role is updated", producers: ["User Management"], consumers: ["ENG-ACCESS-CONTROL"] },
  { id: "EVT-APPROVAL-COMPLETED", name: "Approval Completed", module: "System", description: "Fired when an approval request reaches a final decision", producers: ["ENG-APPROVAL"], consumers: ["ENG-NOTIFICATION", "Task Management"] },
  { id: "EVT-NOTIFICATION-SENT", name: "Notification Sent", module: "Communication", description: "Fired when a notification is created and delivered", producers: ["ENG-NOTIFICATION"], consumers: ["Notifications page", "Sidebar"] },
];

// ═════════════════════════════════════════════════════════════════
//  COMPONENTS
// ═════════════════════════════════════════════════════════════════

const COMPONENTS: ComponentInfo[] = [
  { id: "COMP-SYS-001", name: "AppLayout", path: "src/components/AppLayout.tsx", category: "layout", module: "System", propsExample: "{ children }", dependencies: ["react-router", "lucide-react", "shadcn/ui"], usedByPages: ["All pages"] },
  { id: "COMP-CRM-001", name: "DataTable", path: "src/components/data/DataTable.tsx", category: "data", module: "System", propsExample: "{ columns, data, keyExtractor, onRowClick }", dependencies: ["@/components/ui/table"], usedByPages: ["PAGE-CRM-001", "PAGE-CRM-002", "PAGE-SYS-002"] },
  { id: "COMP-SYS-002", name: "StudioLayout", path: "src/components/layout/StudioLayout.tsx", category: "layout", module: "System", propsExample: "{ title, description, breadcrumbItems, children }", dependencies: [], usedByPages: ["Studio pages"] },
  { id: "COMP-CRM-002", name: "SearchBar", path: "src/components/data/SearchBar.tsx", category: "data", module: "System", propsExample: "{ value, onChange, placeholder }", dependencies: ["@/components/ui/input"], usedByPages: ["PAGE-CRM-002", "PAGE-SYS-002"] },
  { id: "COMP-SYS-003", name: "CrudDialog", path: "src/components/shared/CrudDialog.tsx", category: "shared", module: "System", propsExample: "{ open, title, fields, onSubmit }", dependencies: ["react-hook-form", "shadcn/ui dialog"], usedByPages: ["Studio pages"] },
  { id: "COMP-SYS-004", name: "EmptyState", path: "src/components/shared/EmptyState.tsx", category: "shared", module: "System", propsExample: "{ title, description, action }", dependencies: ["lucide-react"], usedByPages: ["All pages"] },
  { id: "COMP-SYS-005", name: "LoadingState", path: "src/components/shared/LoadingState.tsx", category: "shared", module: "System", propsExample: "{ variant: 'spinner'|'skeleton' }", dependencies: [], usedByPages: ["All pages"] },
  { id: "COMP-SYS-006", name: "PermissionWrapper", path: "src/components/shared/PermissionWrapper.tsx", category: "shared", module: "System", propsExample: "{ allowedRoles, currentRole, children }", dependencies: [], usedByPages: ["All pages"] },
  { id: "COMP-CRM-003", name: "LeadConversionWizard", path: "src/components/crm/LeadConversionWizard.tsx", category: "shared", module: "CRM", propsExample: "{ lead, onClose }", dependencies: [], usedByPages: ["PAGE-CRM-003"] },
  { id: "COMP-CRM-004", name: "RecordPaymentDialog", path: "src/components/crm/RecordPaymentDialog.tsx", category: "shared", module: "CRM", propsExample: "{ leadId, open, onClose }", dependencies: [], usedByPages: ["PAGE-CRM-003"] },
  { id: "COMP-CRM-005", name: "OpportunityBoard", path: "src/components/crm/OpportunityBoard.tsx", category: "shared", module: "Sales", propsExample: "{ opportunities, stages }", dependencies: [], usedByPages: ["PAGE-SALES-001"] },
  { id: "COMP-SYS-007", name: "ActivityTimeline", path: "src/components/shared/ActivityTimeline.tsx", category: "shared", module: "System", propsExample: "{ entries }", dependencies: [], usedByPages: ["PAGE-CRM-003"] },
  { id: "COMP-SYS-008", name: "CommentPanel", path: "src/components/shared/CommentPanel.tsx", category: "shared", module: "System", propsExample: "{ comments, onAdd }", dependencies: [], usedByPages: ["PAGE-CRM-003", "PAGE-TASK-002"] },
  { id: "COMP-SYS-009", name: "AuditViewer", path: "src/components/shared/AuditViewer.tsx", category: "shared", module: "System", propsExample: "{ entries }", dependencies: [], usedByPages: [] },
  { id: "COMP-SYS-010", name: "AttachmentPanel", path: "src/components/shared/AttachmentPanel.tsx", category: "shared", module: "System", propsExample: "{ files, onUpload, onDelete }", dependencies: [], usedByPages: ["PAGE-CRM-003"] },
  { id: "COMP-SYS-011", name: "DebugPanel", path: "src/components/debug/DebugPanel.tsx", category: "shared", module: "System", propsExample: "{}", dependencies: ["@/lib/error-logger"], usedByPages: ["All pages (floating)"] },
  { id: "COMP-SYS-012", name: "RouteErrorBoundary", path: "src/components/ui/route-error-boundary.tsx", category: "ui", module: "System", propsExample: "{ children }", dependencies: [], usedByPages: ["All routes"] },
  { id: "COMP-CRM-006", name: "StatisticsCard", path: "src/components/shared/StatisticsCard.tsx", category: "shared", module: "System", propsExample: "{ label, value, trend, icon }", dependencies: ["lucide-react"], usedByPages: ["PAGE-CRM-001", "PAGE-SYS-001", "PAGE-SALES-001"] },
  { id: "COMP-SYS-013", name: "CommandPalette", path: "src/components/shared/CommandPalette.tsx", category: "shared", module: "System", propsExample: "{ open, onClose }", dependencies: ["cmdk"], usedByPages: ["Header"] },
  { id: "COMP-SYS-014", name: "GlobalSearch", path: "src/components/shared/GlobalSearch.tsx", category: "shared", module: "System", propsExample: "{ open, onClose }", dependencies: [], usedByPages: ["Header"] },
  { id: "COMP-SYS-015", name: "TimelineView", path: "src/components/shared/TimelineView.tsx", category: "shared", module: "System", propsExample: "{ events }", dependencies: [], usedByPages: [] },
  { id: "COMP-SYS-016", name: "FilterBar", path: "src/components/data/FilterBar.tsx", category: "data", module: "System", propsExample: "{ options, onRemove, onClearAll }", dependencies: [], usedByPages: [] },
];

// ═════════════════════════════════════════════════════════════════
//  PERMISSIONS
// ═════════════════════════════════════════════════════════════════

const PERMISSIONS: PermissionInfo[] = [
  { id: "PERM-SYS-ALL", page: "All System Pages", route: "/*", superAdmin: true, admin: true, manager: true, staff: true, description: "Full system access for all roles" },
  { id: "PERM-SYS-ADMIN", page: "System Admin", route: "/*", superAdmin: true, admin: true, manager: false, staff: false, description: "Admin-level system access" },
  { id: "PERM-CRM-ADMIN", page: "CRM Admin", route: "/crm/*", superAdmin: true, admin: true, manager: false, staff: false, description: "Full CRM access" },
  { id: "PERM-LEADS-READ", page: "Lead Read", route: "/crm/leads/*", superAdmin: true, admin: true, manager: true, staff: true, description: "View leads" },
  { id: "PERM-LEADS-WRITE", page: "Lead Write", route: "/crm/leads/*", superAdmin: true, admin: true, manager: true, staff: false, description: "Create and edit leads" },
  { id: "PERM-PAYMENTS-READ", page: "Payment Read", route: "/crm/leads/*", superAdmin: true, admin: true, manager: true, staff: false, description: "View payments" },
  { id: "PERM-PAYMENTS-WRITE", page: "Payment Write", route: "/crm/leads/*", superAdmin: true, admin: true, manager: true, staff: false, description: "Record payments" },
  { id: "PERM-SALES-READ", page: "Sales Read", route: "/crm/sales/*", superAdmin: true, admin: true, manager: true, staff: false, description: "View sales data" },
  { id: "PERM-SALES-WRITE", page: "Sales Write", route: "/crm/sales/*", superAdmin: true, admin: true, manager: true, staff: false, description: "Edit sales data" },
  { id: "PERM-SALES-ADMIN", page: "Sales Admin", route: "/crm/sales/*", superAdmin: true, admin: true, manager: false, staff: false, description: "Full sales administration" },
  { id: "PERM-USERS-ADMIN", page: "User Admin", route: "/users/*", superAdmin: true, admin: true, manager: false, staff: false, description: "User management access" },
  { id: "PERM-ORG-ADMIN", page: "Org Admin", route: "/org/*", superAdmin: true, admin: false, manager: false, staff: false, description: "Organization management" },
  { id: "PERM-ORG-READ", page: "Org Read", route: "/org/*", superAdmin: true, admin: true, manager: true, staff: true, description: "View organization data" },
  { id: "PERM-COURSE-ADMIN", page: "Course Admin", route: "/courses/*", superAdmin: true, admin: true, manager: false, staff: false, description: "Course management" },
];

// ═════════════════════════════════════════════════════════════════
//  HEALTH ISSUES
// ═════════════════════════════════════════════════════════════════

const HEALTH_ISSUES: HealthIssue[] = [
  { type: "missing_doc", severity: "low", message: "Several master data tables lack field documentation", location: "src/lib/platform-studio/registry.ts" },
  { type: "todo", severity: "low", message: "TODO markers exist across codebase (search for TODO in src/)", location: "src/" },
  { type: "unused_component", severity: "medium", message: "FilterBar, AuditViewer, TimelineView have no known consumers", location: "src/components/" },
  { type: "broken_ref", severity: "high", message: "Convex type errors: missing icon/color in 17+ master data files", location: "src/convex/*.ts (multiple files)" },
  { type: "todo", severity: "medium", message: "Finance, HR, Academic modules need operational features beyond master data", location: "All finance/hr/academic convex files" },
];

// ═════════════════════════════════════════════════════════════════
//  ROUTE TREE
// ═════════════════════════════════════════════════════════════════

export interface RouteNode {
  path: string; name: string; filePath: string; layout: string; guards: string[]; children?: RouteNode[];
}

export const ROUTE_TREE: RouteNode[] = [
  { path: "/", name: "Login", filePath: "src/pages/Login.tsx", layout: "None", guards: [] },
  { path: "/dashboard", name: "Dashboard", filePath: "src/pages/Dashboard.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/org", name: "Organization Studio", filePath: "src/pages/OrganizationStudio.tsx", layout: "AppLayout", guards: ["auth", "super_admin"] },
  { path: "/users", name: "User Management", filePath: "src/pages/UsersPage.tsx", layout: "AppLayout", guards: ["auth", "admin"] },
  { path: "/access", name: "Access Control", filePath: "src/pages/AccessControl.tsx", layout: "AppLayout", guards: ["auth", "super_admin"] },
  { path: "/tasks", name: "Task Management", filePath: "src/pages/TasksPage.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/tasks/:taskId", name: "Task Detail", filePath: "src/pages/TaskDetail.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/approvals", name: "Approval Center", filePath: "src/pages/ApprovalsPage.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/notifications", name: "Notifications", filePath: "src/pages/NotificationsPage.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/messenger", name: "Messenger", filePath: "src/pages/MessengerPage.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/control", name: "Control Center", filePath: "src/pages/ControlCenter.tsx", layout: "AppLayout", guards: ["auth", "super_admin"] },
  { path: "/profile", name: "Profile", filePath: "src/pages/ProfilePage.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/crm", name: "CRM Dashboard", filePath: "src/pages/CrmDashboard.tsx", layout: "AppLayout", guards: ["auth", "admin"] },
  { path: "/crm/leads", name: "Lead Database", filePath: "src/pages/LeadDatabase.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/crm/leads/:leadId", name: "Lead Workspace", filePath: "src/pages/LeadWorkspace.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/courses", name: "Course Studio", filePath: "src/pages/CourseStudio.tsx", layout: "AppLayout", guards: ["auth", "admin"] },
  { path: "/crm/sales", name: "Sales Workspace", filePath: "src/pages/SalesWorkspace.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/crm/sales/opportunities", name: "Sales Opportunities", filePath: "src/pages/SalesOpportunitiesPage.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/crm/sales/quotations/:quoteId", name: "Quotation Detail", filePath: "src/pages/QuotationDetail.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/crm/sales/performance", name: "Sales Performance", filePath: "src/pages/SalesPerformanceDashboard.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/crm/sales/collections", name: "Collection Center", filePath: "src/pages/CollectionCenter.tsx", layout: "AppLayout", guards: ["auth"] },
  { path: "/studios/master-data", name: "Master Data Studio", filePath: "src/pages/MasterDataStudio.tsx", layout: "AppLayout", guards: ["auth", "super_admin"] },
  { path: "/platform-studio", name: "Platform Studio", filePath: "src/pages/PlatformStudio.tsx", layout: "AppLayout", guards: ["auth", "super_admin"] },
];

// ═════════════════════════════════════════════════════════════════
//  EXPORTED ACCESSORS
// ═════════════════════════════════════════════════════════════════

export function getAllPages(): PageInfo[] { return PAGES; }
export function getPageById(id: string): PageInfo | undefined { return PAGES.find(p => p.id === id); }
export function getPagesByModule(moduleId: string): PageInfo[] { return PAGES.filter(p => p.module === moduleId); }

export function getAllTables(): TableInfo[] { return DATABASE_TABLES; }
export function getTableById(id: string): TableInfo | undefined { return DATABASE_TABLES.find(t => t.id === id); }

export function getAllApis(): ApiInfo[] { return APIS; }
export function getApiById(id: string): ApiInfo | undefined { return APIS.find(a => a.id === id); }

export function getAllEngines(): EngineInfo[] { return ENGINES; }
export function getEngineById(id: string): EngineInfo | undefined { return ENGINES.find(e => e.id === id); }

export function getAllAutomations(): AutomationInfo[] { return AUTOMATIONS; }
export function getAutomationById(id: string): AutomationInfo | undefined { return AUTOMATIONS.find(a => a.id === id); }

export function getAllWorkflows(): WorkflowInfo[] { return WORKFLOWS; }
export function getWorkflowById(id: string): WorkflowInfo | undefined { return WORKFLOWS.find(w => w.id === id); }

export function getAllEvents(): EventInfo[] { return EVENTS; }
export function getEventById(id: string): EventInfo | undefined { return EVENTS.find(e => e.id === id); }

export function getAllComponents(): ComponentInfo[] { return COMPONENTS; }
export function getComponentById(id: string): ComponentInfo | undefined { return COMPONENTS.find(c => c.id === id); }

export function getAllPermissions(): PermissionInfo[] { return PERMISSIONS; }

export function getModules(): ModuleDef[] { return MODULE_REGISTRY; }
export function getModuleById(id: string): ModuleDef | undefined { return MODULE_REGISTRY.find(m => m.id === id); }

export function getHealthIssues(): HealthIssue[] { return HEALTH_ISSUES; }
export function getRouteTree(): RouteNode[] { return ROUTE_TREE; }

// ═════════════════════════════════════════════════════════════════
//  DEPENDENCY GRAPH
// ═════════════════════════════════════════════════════════════════

export function buildDependencyGraph(): DependencyGraph {
  return {
    pages: PAGES.map(page => {
      // Who uses this page? (reverse lookup from relatedPages)
      const dependents = PAGES
        .filter(p => p.relatedPages.includes(page.route))
        .map(p => p.id);

      return {
        id: page.id,
        name: page.name,
        route: page.route,
        module: page.module,
        dependencies: [...page.queries, ...page.mutations, ...page.tables, ...page.sections.map(s => s.id)],
        dependents,
      };
    }),
  };
}

// ═════════════════════════════════════════════════════════════════
//  SEARCH ENGINE
// ═════════════════════════════════════════════════════════════════

export function searchEverything(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  const add = (r: SearchResult) => {
    const key = `${r.type}:${r.id}`;
    if (!seen.has(key)) { seen.add(key); results.push(r); }
  };

  // Pages
  for (const p of PAGES) {
    if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.route.includes(q) || p.filePath.toLowerCase().includes(q)) {
      add({ type: "Page", id: p.id, name: p.name, match: p.route, module: p.module });
    }
  }
  // Modules
  for (const m of MODULE_REGISTRY) {
    if (m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) {
      add({ type: "Module", id: m.id, name: m.name, match: `${m.progress}% complete`, module: m.name });
    }
  }
  // Tables
  for (const t of DATABASE_TABLES) {
    if (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
      add({ type: "Table", id: t.id, name: t.name, match: `${t.fields.length} fields`, module: t.module });
    }
  }
  // APIs
  for (const a of APIS) {
    if (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.module.toLowerCase().includes(q)) {
      add({ type: "API", id: a.id, name: a.name, match: a.module, module: a.module });
    }
  }
  // Engines
  for (const e of ENGINES) {
    if (e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.purpose.toLowerCase().includes(q)) {
      add({ type: "Engine", id: e.id, name: e.name, match: e.purpose, module: e.module });
    }
  }
  // Automations
  for (const a of AUTOMATIONS) {
    if (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)) {
      add({ type: "Automation", id: a.id, name: a.name, match: a.trigger, module: a.module });
    }
  }
  // Workflows
  for (const w of WORKFLOWS) {
    if (w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)) {
      add({ type: "Workflow", id: w.id, name: w.name, match: w.description, module: w.module });
    }
  }
  // Events
  for (const ev of EVENTS) {
    if (ev.name.toLowerCase().includes(q) || ev.id.toLowerCase().includes(q)) {
      add({ type: "Event", id: ev.id, name: ev.name, match: ev.description, module: ev.module });
    }
  }
  // Components
  for (const c of COMPONENTS) {
    if (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.path.toLowerCase().includes(q)) {
      add({ type: "Component", id: c.id, name: c.name, match: c.path, module: c.module });
    }
  }
  // Permissions
  for (const p of PERMISSIONS) {
    if (p.id.toLowerCase().includes(q) || p.page.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
      add({ type: "Permission", id: p.id, name: p.page, match: p.description, module: "System" });
    }
  }
  // Health issues
  for (const h of HEALTH_ISSUES) {
    if (h.message.toLowerCase().includes(q)) {
      add({ type: "File", id: "", name: h.message, match: h.location || "", module: "System" });
    }
  }

  return results.slice(0, 50);
}

// ═════════════════════════════════════════════════════════════════
//  AGGREGATED EXPORT
// ═════════════════════════════════════════════════════════════════

export interface RegistrySummary {
  version: string;
  totalPages: number;
  totalComponents: number;
  totalTables: number;
  totalApis: number;
  totalEngines: number;
  totalAutomations: number;
  totalWorkflows: number;
  totalEvents: number;
  totalPermissions: number;
}

export const REGISTRY_SUMMARY: RegistrySummary = {
  version: "2.0.0",
  totalPages: PAGES.length,
  totalComponents: COMPONENTS.length,
  totalTables: DATABASE_TABLES.length,
  totalApis: APIS.length,
  totalEngines: ENGINES.length,
  totalAutomations: AUTOMATIONS.length,
  totalWorkflows: WORKFLOWS.length,
  totalEvents: EVENTS.length,
  totalPermissions: PERMISSIONS.length,
};
