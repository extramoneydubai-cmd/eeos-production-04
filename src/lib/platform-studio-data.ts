/**
 * EEOS Platform Studio — Live Project Metadata
 *
 * This file contains the complete metadata inventory of the EEOS platform.
 * It is used by the Platform Studio UI to render the Developer Intelligence System.
 * Every entry uses permanent IDs that will never change.
 *
 * Update this file when adding new pages, tables, APIs, or components.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface PageSection {
  id: string;
  type: "card" | "chart" | "form" | "button" | "input" | "dialog" | "table" | "section";
  name: string;
}

export interface PageInfo {
  id: string;
  name: string;
  route: string;
  filePath: string;
  layout: string;
  sections: PageSection[];
  queries: string[];
  mutations: string[];
  tables: string[];
  permissions: string[];
  relatedPages: string[];
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
  id: string;
  description: string;
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
  id: string;
  type: "query" | "mutation" | "action";
  module: string;
  parameters: string;
  returnType: string;
  usedBy: string[];
  permission: string;
}

export interface EngineInfo {
  id: string;
  name: string;
  purpose: string;
  apis: string[];
  tables: string[];
  events: string[];
  consumers: string[];
}

export interface AutomationInfo {
  id: string;
  name: string;
  trigger: string;
  conditions: string[];
  actions: string[];
  notifications: string[];
  timeline: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  path: string;
  category: string;
  propsExample: string;
  dependencies: string[];
  usedByPages: string[];
}

export interface PermissionInfo {
  page: string;
  route: string;
  superAdmin: boolean;
  admin: boolean;
  manager: boolean;
  staff: boolean;
  description: string;
}

export interface RouteNode {
  path: string;
  name: string;
  filePath: string;
  layout: string;
  guards: string[];
  children?: RouteNode[];
}

export interface HealthIssue {
  type: "missing_doc" | "broken_ref" | "unused_component" | "unused_api" | "dead_page" | "todo";
  severity: "low" | "medium" | "high";
  message: string;
  location?: string;
}

export interface PlatformMetadata {
  version: string;
  buildDate: string;
  totalPages: number;
  totalComponents: number;
  totalTables: number;
  totalApis: number;
  totalEngines: number;
  totalAutomations: number;
  totalRoutes: number;
  pages: PageInfo[];
  tables: TableInfo[];
  apis: ApiInfo[];
  engines: EngineInfo[];
  automations: AutomationInfo[];
  components: ComponentInfo[];
  permissions: PermissionInfo[];
  routeTree: RouteNode[];
  health: HealthIssue[];
}

// ─── Page IDs ────────────────────────────────────────────────────

const PAGE_IDS = {
  DASHBOARD: "SYS-001",
  CRM_DASHBOARD: "CRM-001",
  LEAD_DATABASE: "CRM-002",
  LEAD_WORKSPACE: "CRM-003",
  SALES_WORKSPACE: "SALES-001",
  SALES_OPPORTUNITIES: "SALES-002",
  QUOTATION_DETAIL: "SALES-003",
  SALES_TASKS: "SALES-004",
  SALES_PERFORMANCE: "SALES-005",
  SALES_PAYMENTS: "SALES-006",
  COLLECTION_CENTER: "COLL-001",
  COLLECTION_DASHBOARD: "COLL-002",
  ORG_STUDIO: "ORG-001",
  USER_MANAGEMENT: "SYS-002",
  ACCESS_CONTROL: "SYS-003",
  TASK_MANAGEMENT: "TASK-001",
  TASK_DETAIL: "TASK-002",
  APPROVAL_CENTER: "APPROVAL-001",
  NOTIFICATIONS: "NOTIF-001",
  MESSENGER: "MSG-001",
  CONTROL_CENTER: "SYS-004",
  PROFILE: "SYS-005",
  COURSE_STUDIO: "COURSE-001",
  MASTER_DATA_STUDIO: "MD-001",
  LEAD_STAGE_STUDIO: "CRM-004",
  PLATFORM_STUDIO: "PLAT-001",
  FORM_STUDIO: "FORM-001",
  WORKFLOW_STUDIO: "WF-001",
  INTAKE_DASHBOARD: "INTAKE-001",
  PEOPLE_REGISTRY: "PEOPLE-001",
  STUDENT_DASHBOARD: "STUDENT-001",
  CEO_DASHBOARD: "CEO-001",
  ENGAGEMENT_CENTER: "ENGAGE-001",
} as const;

// ─── Pages ───────────────────────────────────────────────────────

export const platformPages: PageInfo[] = [
  {
    id: PAGE_IDS.DASHBOARD,
    name: "Dashboard",
    route: "/dashboard",
    filePath: "src/pages/Dashboard.tsx",
    layout: "AppLayout",
    sections: [
      { id: "SYS-001-SECTION-001", type: "section", name: "System Overview" },
      { id: "SYS-001-CARD-001", type: "card", name: "Stats Cards (Users/Tasks/Approvals)" },
      { id: "SYS-001-CHART-001", type: "chart", name: "Activity Timeline" },
      { id: "SYS-001-CARD-002", type: "card", name: "Quick Actions" },
    ],
    queries: ["dashboard:getDashboardStats", "tasks:listTasks", "approvals:listApprovals"],
    mutations: [],
    tables: ["users", "tasks", "approvalRequests", "notifications"],
    permissions: ["all"],
    relatedPages: ["/tasks", "/approvals", "/users"],
  },
  {
    id: PAGE_IDS.CRM_DASHBOARD,
    name: "CRM Dashboard",
    route: "/crm",
    filePath: "src/pages/CrmDashboard.tsx",
    layout: "AppLayout",
    sections: [
      { id: "CRM-001-SECTION-001", type: "section", name: "Pipeline Overview" },
      { id: "CRM-001-CHART-001", type: "chart", name: "Pipeline Health (Stage Counts)" },
      { id: "CRM-001-CHART-002", type: "chart", name: "Conversion Funnel" },
      { id: "CRM-001-CARD-001", type: "card", name: "Summary Stats Cards" },
      { id: "CRM-001-TABLE-001", type: "table", name: "Recent Leads" },
      { id: "CRM-001-TABLE-002", type: "table", name: "Pending Payments Detail" },
      { id: "CRM-001-TABLE-003", type: "table", name: "Conversion History" },
    ],
    queries: ["crmDashboard:getCrmDashboardData", "crmLeads:listLeads", "crmPayments:getAllLeadsPayments", "crmDashboard:getConversionHistory"],
    mutations: [],
    tables: ["leadMaster", "leadPayments", "leadStageHistory", "leadActivity"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/crm/leads", "/crm/sales"],
  },
  {
    id: PAGE_IDS.LEAD_DATABASE,
    name: "Lead Database",
    route: "/crm/leads",
    filePath: "src/pages/LeadDatabase.tsx",
    layout: "AppLayout",
    sections: [
      { id: "CRM-002-SECTION-001", type: "section", name: "Leads Table" },
      { id: "CRM-002-TABLE-001", type: "table", name: "Leads Data Table" },
      { id: "CRM-002-BTN-001", type: "button", name: "Create Lead" },
      { id: "CRM-002-FORM-001", type: "form", name: "Create Lead Dialog" },
      { id: "CRM-002-INPUT-001", type: "input", name: "Search Leads" },
    ],
    queries: ["crmLeads:listLeads", "crmLeads:getLeadCounts"],
    mutations: ["crmLeads:createLead", "crmLeads:updateLead", "crmLeads:deleteLead"],
    tables: ["leadMaster"],
    permissions: ["super_admin", "admin", "manager"],
    relatedPages: ["/crm", "/crm/leads/:leadId"],
  },
  {
    id: PAGE_IDS.LEAD_WORKSPACE,
    name: "Lead Workspace",
    route: "/crm/leads/:leadId",
    filePath: "src/pages/LeadWorkspace.tsx",
    layout: "AppLayout",
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
    queries: ["crmLeads:getLeadById", "crmPayments:getLeadPayments", "crmActivity:getLeadActivity", "crmTasks:listLeadTasks"],
    mutations: ["crmLeads:updateLead", "crmPayments:addPayment", "crmTasks:createLeadTask", "crmNotes:addLeadNote", "crmDocuments:addLeadDocument"],
    tables: ["leadMaster", "leadPayments", "leadTasks", "leadNotes", "leadDocuments", "leadActivity", "leadStageHistory"],
    permissions: ["super_admin", "admin", "manager", "staff"],
    relatedPages: ["/crm", "/crm/leads"],
  },
  {
    id: PAGE_IDS.SALES_WORKSPACE,
    name: "Sales Workspace",
    route: "/crm/sales",
    filePath: "src/pages/SalesWorkspace.tsx",
    layout: "AppLayout",
    sections: [
      { id: "SALES-001-SECTION-001", type: "section", name: "Sales Overview" },
      { id: "SALES-001-CARD-001", type: "card", name: "Sales Metrics" },
      { id: "SALES-001-TABLE-001", type: "table", name: "Opportunities Board" },
    ],
    queries: ["crmSales:listOpportunities", "salesPerformance:getSalesMetrics"],
    mutations: ["crmSales:createOpportunity", "crmSales:updateOpportunity"],
    tables: ["opportunities", "opportunityStageHistory"],
    permissions: ["super_admin", "admin", "manager"],
    relatedPages: ["/crm/sales/opportunities", "/crm/sales/performance"],
  },
  {
    id: PAGE_IDS.SALES_OPPORTUNITIES,
    name: "Sales Opportunities",
    route: "/crm/sales/opportunities",
    filePath: "src/pages/SalesOpportunitiesPage.tsx",
    layout: "AppLayout",
    sections: [
      { id: "SALES-002-SECTION-001", type: "section", name: "Opportunities List" },
      { id: "SALES-002-TABLE-001", type: "table", name: "Opportunities Table" },
    ],
    queries: ["crmSales:listOpportunities", "salesOpportunityStages:list"],
    mutations: ["crmSales:createOpportunity", "crmSales:updateOpportunityStage"],
    tables: ["opportunities", "salesOpportunityStages"],
    permissions: ["super_admin", "admin", "manager"],
    relatedPages: ["/crm/sales"],
  },
  {
    id: PAGE_IDS.QUOTATION_DETAIL,
    name: "Quotation Detail",
    route: "/crm/sales/quotations/:quoteId",
    filePath: "src/pages/QuotationDetail.tsx",
    layout: "AppLayout",
    sections: [
      { id: "SALES-003-SECTION-001", type: "section", name: "Quotation View" },
      { id: "SALES-003-CARD-001", type: "card", name: "Quote Summary" },
      { id: "SALES-003-TABLE-001", type: "table", name: "Line Items" },
    ],
    queries: ["quotations:getQuotation", "quotations:listQuotationLineItems"],
    mutations: ["quotations:updateQuotation"],
    tables: ["quotations", "quotationLineItems", "quotationVersions"],
    permissions: ["super_admin", "admin", "manager"],
    relatedPages: ["/crm/sales"],
  },
  {
    id: PAGE_IDS.ORG_STUDIO,
    name: "Organization Studio",
    route: "/org",
    filePath: "src/pages/OrganizationStudio.tsx",
    layout: "AppLayout",
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
    queries: ["organization:listDepartments", "organization:listTeams", "organization:listBranches", "organization:listVerticals", "organization:listSubVerticals", "organization:listBoards", "organization:listDesignations"],
    mutations: ["organization:createDepartment", "organization:createTeam", "organization:createBranch", "organization:createVertical", "organization:createSubVertical", "organization:createBoard", "organization:createDesignation"],
    tables: ["departments", "teams", "branches", "verticals", "subVerticals", "boards", "designations", "companies"],
    permissions: ["super_admin"],
    relatedPages: [],
  },
  {
    id: PAGE_IDS.USER_MANAGEMENT,
    name: "User Management",
    route: "/users",
    filePath: "src/pages/UsersPage.tsx",
    layout: "AppLayout",
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
    queries: ["users:listUsers", "users:getUser"],
    mutations: ["userManagement:createUser", "userManagement:updateUserRole", "userManagement:resetPassword", "userManagement:disableUser"],
    tables: ["users", "userScopes"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/access"],
  },
  {
    id: PAGE_IDS.ACCESS_CONTROL,
    name: "Access Control",
    route: "/access",
    filePath: "src/pages/AccessControl.tsx",
    layout: "AppLayout",
    sections: [
      { id: "SYS-003-SECTION-001", type: "section", name: "Effective Access" },
      { id: "SYS-003-SECTION-002", type: "section", name: "Role Visibility" },
    ],
    queries: ["users:listUsers", "accessControlEngine:getEffectiveAccess"],
    mutations: [],
    tables: ["users", "userScopes"],
    permissions: ["super_admin"],
    relatedPages: ["/users"],
  },
  {
    id: PAGE_IDS.TASK_MANAGEMENT,
    name: "Task Management",
    route: "/tasks",
    filePath: "src/pages/TasksPage.tsx",
    layout: "AppLayout",
    sections: [
      { id: "TASK-001-SECTION-001", type: "section", name: "Kanban Board" },
      { id: "TASK-001-TABLE-001", type: "table", name: "Task Cards" },
      { id: "TASK-001-FORM-001", type: "form", name: "Create Task Dialog" },
    ],
    queries: ["tasks:listTasks", "tasks:getTask"],
    mutations: ["tasks:createTask", "tasks:updateTaskStatus", "tasks:updateTask"],
    tables: ["tasks", "taskParticipants", "taskChecklistItems", "taskComments"],
    permissions: ["all"],
    relatedPages: ["/tasks/:taskId", "/approvals"],
  },
  {
    id: PAGE_IDS.APPROVAL_CENTER,
    name: "Approval Center",
    route: "/approvals",
    filePath: "src/pages/ApprovalsPage.tsx",
    layout: "AppLayout",
    sections: [
      { id: "APPROVAL-001-SECTION-001", type: "section", name: "Approval Requests" },
      { id: "APPROVAL-001-TABLE-001", type: "table", name: "Approvals List" },
      { id: "APPROVAL-001-DIALOG-001", type: "dialog", name: "Approval Decision Dialog" },
    ],
    queries: ["approvals:listApprovals", "approvals:getGlobalApprovalCounts"],
    mutations: ["approvals:decideApproval", "approvals:createApprovalRequest"],
    tables: ["approvalRequests", "approvalRequestApprovers", "approvalTemplates"],
    permissions: ["all"],
    relatedPages: ["/tasks", "/crm"],
  },
  {
    id: PAGE_IDS.NOTIFICATIONS,
    name: "Notifications",
    route: "/notifications",
    filePath: "src/pages/NotificationsPage.tsx",
    layout: "AppLayout",
    sections: [
      { id: "NOTIF-001-SECTION-001", type: "section", name: "Notifications List" },
      { id: "NOTIF-001-TABLE-001", type: "table", name: "Notifications Feed" },
    ],
    queries: ["notifications:listNotifications", "notifications:getUnreadCount"],
    mutations: ["notifications:markAsRead", "notifications:markAllAsRead"],
    tables: ["notifications"],
    permissions: ["all"],
    relatedPages: [],
  },
  {
    id: PAGE_IDS.MESSENGER,
    name: "Messenger",
    route: "/messenger",
    filePath: "src/pages/MessengerPage.tsx",
    layout: "AppLayout",
    sections: [
      { id: "MSG-001-SECTION-001", type: "section", name: "Chat Interface" },
      { id: "MSG-001-SECTION-002", type: "section", name: "Channel List" },
      { id: "MSG-001-FORM-001", type: "form", name: "Send Message" },
      { id: "MSG-001-DIALOG-001", type: "dialog", name: "Create Channel" },
    ],
    queries: ["messenger:listChannels", "messenger:getMessages", "messenger:getUnreadDirectMessageCount"],
    mutations: ["messenger:sendMessage", "messenger:createChannel", "messenger:sendDirectMessage"],
    tables: ["channels", "channelMembers", "messages", "directMessages"],
    permissions: ["all"],
    relatedPages: [],
  },
  {
    id: PAGE_IDS.CONTROL_CENTER,
    name: "Control Center",
    route: "/control",
    filePath: "src/pages/ControlCenter.tsx",
    layout: "AppLayout",
    sections: [
      { id: "SYS-004-SECTION-001", type: "section", name: "CEO Controls" },
      { id: "SYS-004-FORM-001", type: "form", name: "Create User" },
      { id: "SYS-004-FORM-002", type: "form", name: "Create Team" },
      { id: "SYS-004-FORM-003", type: "form", name: "Broadcast Message" },
      { id: "SYS-004-FORM-004", type: "form", name: "Reset Password" },
      { id: "SYS-004-FORM-005", type: "form", name: "Create Channel" },
    ],
    queries: ["users:listUsers", "messenger:listChannels"],
    mutations: ["userManagement:createUser", "userManagement:resetPassword", "organization:createTeam", "messenger:createChannel"],
    tables: ["users", "teams", "channels"],
    permissions: ["super_admin"],
    relatedPages: ["/users", "/org", "/messenger"],
  },
  {
    id: PAGE_IDS.COURSE_STUDIO,
    name: "Course Studio",
    route: "/courses",
    filePath: "src/pages/CourseStudio.tsx",
    layout: "AppLayout",
    sections: [
      { id: "COURSE-001-SECTION-001", type: "section", name: "Course Management" },
      { id: "COURSE-001-TABLE-001", type: "table", name: "Courses Table" },
      { id: "COURSE-001-FORM-001", type: "form", name: "Add Course Dialog" },
    ],
    queries: ["crmCourses:listCourses"],
    mutations: ["crmCourses:createCourse", "crmCourses:updateCourse"],
    tables: ["courses", "leadCourses"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/crm/leads/:leadId"],
  },
  {
    id: PAGE_IDS.PLATFORM_STUDIO,
    name: "Platform Studio",
    route: "/platform",
    filePath: "src/pages/PlatformStudio.tsx",
    layout: "AppLayout",
    sections: [
      { id: "PLAT-001-SECTION-001", type: "section", name: "Module Explorer" },
      { id: "PLAT-001-SECTION-002", type: "section", name: "Engine Overview" },
      { id: "PLAT-001-SECTION-003", type: "section", name: "Dependency Graph" },
      { id: "PLAT-001-SECTION-004", type: "section", name: "Search Everything" },
      { id: "PLAT-001-SECTION-005", type: "section", name: "Progress Dashboard" },
      { id: "PLAT-001-SECTION-006", type: "section", name: "Metadata Registry" },
      { id: "PLAT-001-SECTION-007", type: "section", name: "Module Inspector" },
      { id: "PLAT-001-SECTION-008", type: "section", name: "Roadmap Viewer" },
      { id: "PLAT-001-CARD-001", type: "card", name: "Feature Flags" },
    ],
    queries: ["platformStudioData:getPages", "platformStudioData:getEngines", "platformStudioData:getTables", "platformStudioData:getApis", "platformStudioData:search"],
    mutations: [],
    tables: ["all platform metadata from registry"],
    permissions: ["super_admin", "admin"],
    relatedPages: [],
  },
  {
    id: PAGE_IDS.FORM_STUDIO,
    name: "Form Studio",
    route: "/forms",
    filePath: "src/pages/FormStudio.tsx",
    layout: "AppLayout",
    sections: [
      { id: "FORM-001-SECTION-001", type: "section", name: "Form List Dashboard" },
      { id: "FORM-001-SECTION-002", type: "section", name: "Form Builder (Drag & Drop)" },
      { id: "FORM-001-SECTION-003", type: "section", name: "Form Settings" },
      { id: "FORM-001-SECTION-004", type: "section", name: "Version History" },
      { id: "FORM-001-SECTION-005", type: "section", name: "Publish Management" },
      { id: "FORM-001-FORM-001", type: "form", name: "Create Form Dialog" },
      { id: "FORM-001-FORM-002", type: "form", name: "Field Configuration Panel" },
      { id: "FORM-001-BTN-001", type: "button", name: "Publish Form" },
      { id: "FORM-001-BTN-002", type: "button", name: "Clone Form" },
      { id: "FORM-001-TABLE-001", type: "table", name: "Forms List Table" },
    ],
    queries: ["formEngine:listForms", "formEngine:getForm", "formEngine:getFormVersions", "formEngine:listSubmissions"],
    mutations: ["formEngine:createForm", "formEngine:updateForm", "formEngine:publishForm", "formEngine:archiveForm", "formEngine:cloneForm", "formEngine:addField", "formEngine:updateField", "formEngine:removeField"],
    tables: ["forms", "formVersions", "formFields", "formLayouts", "formSubmissions", "formTemplates"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/intake", "/platform"],
  },
  {
    id: PAGE_IDS.WORKFLOW_STUDIO,
    name: "Workflow Studio",
    route: "/workflows",
    filePath: "src/pages/WorkflowStudio.tsx",
    layout: "AppLayout",
    sections: [
      { id: "WF-001-SECTION-001", type: "section", name: "Workflow List" },
      { id: "WF-001-SECTION-002", type: "section", name: "Workflow Designer (Node Editor)" },
      { id: "WF-001-SECTION-003", type: "section", name: "Execution History" },
      { id: "WF-001-BTN-001", type: "button", name: "Create Workflow" },
      { id: "WF-001-BTN-002", type: "button", name: "Publish Workflow" },
      { id: "WF-001-TABLE-001", type: "table", name: "Workflow Executions Table" },
    ],
    queries: ["workflowEngine:list", "workflowEngine:get", "workflowEngine:listInstances", "workflowEngine:getInstance"],
    mutations: ["workflowEngine:create", "workflowEngine:update", "workflowEngine:publish", "workflowEngine:archive", "workflowEngine:trigger"],
    tables: ["workflows", "workflowEdges", "workflowNodes", "workflowInstances", "workflowStepHistory"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/forms", "/intake"],
  },
  {
    id: PAGE_IDS.INTAKE_DASHBOARD,
    name: "Intake Dashboard",
    route: "/intake",
    filePath: "src/pages/IntakeDashboard.tsx",
    layout: "AppLayout",
    sections: [
      { id: "INTAKE-001-SECTION-001", type: "section", name: "Submission Queue Overview" },
      { id: "INTAKE-001-CARD-001", type: "card", name: "Today's Submissions" },
      { id: "INTAKE-001-CARD-002", type: "card", name: "Status Distribution" },
      { id: "INTAKE-001-CHART-001", type: "chart", name: "Submission Trend" },
      { id: "INTAKE-001-TABLE-001", type: "table", name: "Recent Submissions" },
    ],
    queries: ["intakeEngine:getQueueStats", "intakeEngine:listSubmissions", "intakeEngine:getDashboardData"],
    mutations: ["intakeEngine:processSubmission", "intakeEngine:rerouteSubmission", "intakeEngine:verifySubmission"],
    tables: ["submissions", "submissionQueue", "submissionTimeline"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/forms", "/crm/leads"],
  },
  {
    id: PAGE_IDS.PEOPLE_REGISTRY,
    name: "People Registry",
    route: "/people",
    filePath: "src/pages/PeopleRegistry.tsx",
    layout: "AppLayout",
    sections: [
      { id: "PEOPLE-001-SECTION-001", type: "section", name: "Person Directory" },
      { id: "PEOPLE-001-SECTION-002", type: "section", name: "Person Profile" },
      { id: "PEOPLE-001-SECTION-003", type: "section", name: "Contact Methods" },
      { id: "PEOPLE-001-SECTION-004", type: "section", name: "Relationship Graph" },
      { id: "PEOPLE-001-SECTION-005", type: "section", name: "QR Code Card" },
      { id: "PEOPLE-001-SECTION-006", type: "section", name: "Addresses" },
      { id: "PEOPLE-001-SECTION-007", type: "section", name: "Timeline" },
      { id: "PEOPLE-001-TABLE-001", type: "table", name: "Person Search Results" },
      { id: "PEOPLE-001-INPUT-001", type: "input", name: "Global Search" },
    ],
    queries: ["personEngine:getPerson", "personEngine:listPersons", "personSearch:globalSearch", "personSearch:quickSearch", "contactEngine:getContactMethods", "relationshipEngine:getPersonRelationships", "profileEngine:listProfiles"],
    mutations: ["personEngine:createPerson", "personEngine:updatePerson", "personEngine:mergePersons", "personEngine:archivePerson", "contactEngine:addContactMethod", "contactEngine:verifyContactMethod", "relationshipEngine:linkPersons", "personQRCode:generateQRCode"],
    tables: ["personMaster", "personProfiles", "contactMethods", "addresses", "emergencyContacts", "relationships", "socialLinks", "personDocuments", "personQRCode"],
    permissions: ["super_admin", "admin", "manager"],
    relatedPages: ["/students", "/users"],
  },
  {
    id: PAGE_IDS.STUDENT_DASHBOARD,
    name: "Student Dashboard",
    route: "/students",
    filePath: "src/pages/DashboardStudent.tsx",
    layout: "AppLayout",
    sections: [
      { id: "STUDENT-001-SECTION-001", type: "section", name: "Student Overview" },
      { id: "STUDENT-001-SECTION-002", type: "section", name: "Academic Profile" },
      { id: "STUDENT-001-SECTION-003", type: "section", name: "Status History" },
      { id: "STUDENT-001-SECTION-004", type: "section", name: "Documents" },
      { id: "STUDENT-001-SECTION-005", type: "section", name: "Fees" },
      { id: "STUDENT-001-SECTION-006", type: "section", name: "Timeline" },
      { id: "STUDENT-001-TABLE-001", type: "table", name: "Students List" },
      { id: "STUDENT-001-INPUT-001", type: "input", name: "Search Students" },
    ],
    queries: ["studentEngine:getStudent", "studentEngine:listStudents", "studentSearch:searchStudents", "studentLifecycle:getStudentTimeline", "studentLifecycle:getStudentStatusHistory"],
    mutations: ["studentEngine:createStudent", "studentEngine:updateStudent", "studentEngine:archiveStudent", "studentLifecycle:admitStudent", "studentLifecycle:promoteStudent", "studentLifecycle:graduateStudent"],
    tables: ["studentMaster", "studentAdmissions", "studentAcademicProfile", "studentStatusHistory", "studentMedicalProfile", "studentAchievements", "studentDisciplinaryRecords", "studentTimeline"],
    permissions: ["super_admin", "admin", "manager"],
    relatedPages: ["/people", "/crm/leads"],
  },
  {
    id: PAGE_IDS.CEO_DASHBOARD,
    name: "CEO Dashboard",
    route: "/ceo",
    filePath: "src/pages/DashboardCEO.tsx",
    layout: "AppLayout",
    sections: [
      { id: "CEO-001-SECTION-001", type: "section", name: "Enterprise Overview" },
      { id: "CEO-001-CARD-001", type: "card", name: "KPI Scorecards" },
      { id: "CEO-001-CARD-002", type: "card", name: "CRM Widget" },
      { id: "CEO-001-CARD-003", type: "card", name: "Finance Widget" },
      { id: "CEO-001-CARD-004", type: "card", name: "Academic Widget" },
      { id: "CEO-001-CARD-005", type: "card", name: "HR Widget" },
      { id: "CEO-001-CARD-006", type: "card", name: "Operations Widget" },
      { id: "CEO-001-CARD-007", type: "card", name: "Communication Widget" },
      { id: "CEO-001-CHART-001", type: "chart", name: "Branch Comparison" },
      { id: "CEO-001-CHART-002", type: "chart", name: "Company Comparison" },
      { id: "CEO-001-BTN-001", type: "button", name: "Generate Executive Report" },
      { id: "CEO-001-BTN-002", type: "button", name: "Configure Dashboard" },
    ],
    queries: ["dashboardEngine:getEnterpriseOverview", "dashboardEngine:getCrmWidget", "dashboardEngine:getFinanceWidget", "dashboardEngine:getAcademicWidget", "dashboardEngine:getHrWidget", "dashboardEngine:getOperationsWidget", "dashboardEngine:getCommunicationWidget", "dashboardEngine:getBranchComparison", "dashboardEngine:getCompanyComparison", "kpiEngine:getKpiDashboard", "kpiEngine:getExecutiveScorecard", "executiveReports:listReports"],
    mutations: ["executiveReports:generateDailySummary", "executiveReports:generateWeeklyReview", "executiveReports:generateMonthlyReview", "dashboardEngine:saveWidgetLayout", "kpiEngine:recordKpiValue"],
    tables: ["dashboardWidgets", "dashboardLayouts", "kpiDefinitions", "analyticsSnapshots", "kpiValues", "kpiTrends"],
    permissions: ["super_admin"],
    relatedPages: ["/dashboard", "/org", "/intake"],
  },
  {
    id: PAGE_IDS.ENGAGEMENT_CENTER,
    name: "Engagement Center",
    route: "/engage",
    filePath: "src/pages/EngagementCenter.tsx",
    layout: "AppLayout",
    sections: [
      { id: "ENGAGE-001-SECTION-001", type: "section", name: "Communication Templates" },
      { id: "ENGAGE-001-SECTION-002", type: "section", name: "Message Campaigns" },
      { id: "ENGAGE-001-SECTION-003", type: "section", name: "Notification History" },
      { id: "ENGAGE-001-SECTION-004", type: "section", name: "Delivery Status" },
      { id: "ENGAGE-001-CARD-001", type: "card", name: "Channel Stats" },
      { id: "ENGAGE-001-TABLE-001", type: "table", name: "Campaign List" },
    ],
    queries: ["templateEngine:list", "templateEngine:get", "communicationHub:getQueueStats", "communicationHub:listNotifications", "messageCampaigns:list"],
    mutations: ["templateEngine:create", "templateEngine:update", "templateEngine:renderFromCode", "communicationHub:sendEmail", "communicationHub:sendWhatsApp", "communicationHub:sendSMS", "communicationHub:sendInApp", "messageCampaigns:create", "messageCampaigns:launch"],
    tables: ["communicationTemplates", "communicationQueue", "communicationLogs", "communicationPreferences", "notificationCenter", "deliveryStatus", "messageCampaigns"],
    permissions: ["super_admin", "admin"],
    relatedPages: ["/people", "/crm/leads"],
  },
];

// ─── Database Tables ─────────────────────────────────────────────

export const platformTables: TableInfo[] = [
  {
    name: "users",
    id: "DB-001",
    description: "Platform users with authentication and profile data",
    fields: [
      { name: "name", type: "string?", required: false },
      { name: "email", type: "string?", required: false },
      { name: "username", type: "string?", required: false },
      { name: "role", type: "super_admin|admin|manager|staff", required: false, description: "Platform role" },
      { name: "isDisabled", type: "boolean?", required: false },
      { name: "designationId", type: "Id(designations)", required: false },
      { name: "departmentId", type: "Id(departments)", required: false },
      { name: "companyId", type: "Id(companies)", required: false },
      { name: "branchId", type: "Id(branches)", required: false },
      { name: "verticalId", type: "Id(verticals)", required: false },
      { name: "teamIds", type: "Id(teams)[]", required: false },
      { name: "phone", type: "string?", required: false },
      { name: "employeeCode", type: "string?", required: false },
      { name: "lastLoginAt", type: "number?", required: false },
    ],
    indexes: [
      { name: "email", fields: ["email"] },
      { name: "username", fields: ["username"] },
      { name: "role", fields: ["role"] },
    ],
    relationships: [{ table: "designations", field: "designationId" }, { table: "departments", field: "departmentId" }, { table: "companies", field: "companyId" }, { table: "branches", field: "branchId" }, { table: "verticals", field: "verticalId" }, { table: "teams", field: "teamIds" }],
    queries: ["users:listUsers", "users:getUser"],
    mutations: ["userManagement:createUser", "userManagement:updateUserRole", "userManagement:resetPassword", "userManagement:disableUser"],
    permissions: ["super_admin", "admin"],
    usedByPages: [PAGE_IDS.DASHBOARD, PAGE_IDS.USER_MANAGEMENT, PAGE_IDS.ACCESS_CONTROL, PAGE_IDS.CONTROL_CENTER],
  },
  {
    name: "departments",
    id: "DB-002",
    description: "Organizational departments",
    fields: [
      { name: "name", type: "string", required: true },
      { name: "code", type: "string", required: true },
      { name: "branchId", type: "Id(branches)", required: true },
      { name: "managerId", type: "Id(users)?", required: false },
      { name: "isActive", type: "boolean?", required: false },
      { name: "description", type: "string?", required: false },
    ],
    indexes: [{ name: "by_code", fields: ["code"] }, { name: "by_branch", fields: ["branchId"] }],
    relationships: [{ table: "branches", field: "branchId" }, { table: "users", field: "managerId" }],
    queries: ["organization:listDepartments", "organization:getDepartment"],
    mutations: ["organization:createDepartment", "organization:updateDepartment", "organization:deleteDepartment"],
    permissions: ["super_admin"],
    usedByPages: [PAGE_IDS.ORG_STUDIO],
  },
  {
    name: "teams",
    id: "DB-003",
    description: "Teams within departments",
    fields: [
      { name: "name", type: "string", required: true },
      { name: "code", type: "string", required: true },
      { name: "departmentId", type: "Id(departments)", required: true },
      { name: "description", type: "string?", required: false },
      { name: "leadId", type: "Id(users)?", required: false },
      { name: "isActive", type: "boolean?", required: false },
    ],
    indexes: [{ name: "by_code", fields: ["code"] }, { name: "by_department", fields: ["departmentId"] }],
    relationships: [{ table: "departments", field: "departmentId" }],
    queries: ["organization:listTeams", "organization:getTeam"],
    mutations: ["organization:createTeam", "organization:updateTeam", "organization:deleteTeam"],
    permissions: ["super_admin"],
    usedByPages: [PAGE_IDS.ORG_STUDIO],
  },
  {
    name: "tasks",
    id: "DB-004",
    description: "Task management items",
    fields: [
      { name: "title", type: "string", required: true },
      { name: "status", type: "backlog|todo|in_progress|review|done", required: true },
      { name: "priority", type: "low|medium|high|critical", required: true },
      { name: "ownerId", type: "Id(users)", required: true },
      { name: "assignedTo", type: "Id(users)?", required: false },
      { name: "dueDate", type: "number?", required: false },
      { name: "approvalRequired", type: "boolean?", required: false },
      { name: "approvalStatus", type: "pending|approved|rejected|cancelled?", required: false },
    ],
    indexes: [{ name: "status", fields: ["status"] }, { name: "ownerId", fields: ["ownerId"] }, { name: "assignedTo", fields: ["assignedTo"] }, { name: "departmentId", fields: ["departmentId"] }, { name: "teamId", fields: ["teamId"] }],
    relationships: [{ table: "users", field: "ownerId" }, { table: "users", field: "assignedTo" }, { table: "departments", field: "departmentId" }, { table: "teams", field: "teamId" }],
    queries: ["tasks:listTasks", "tasks:getTask"],
    mutations: ["tasks:createTask", "tasks:updateTaskStatus", "tasks:updateTask"],
    permissions: ["all"],
    usedByPages: [PAGE_IDS.TASK_MANAGEMENT, PAGE_IDS.TASK_DETAIL, PAGE_IDS.DASHBOARD],
  },
  {
    name: "leadMaster",
    id: "DB-005",
    description: "CRM lead records",
    fields: [
      { name: "firstName", type: "string", required: true },
      { name: "lastName", type: "string", required: true },
      { name: "phone", type: "string", required: true },
      { name: "email", type: "string?", required: false },
      { name: "stage", type: "string", required: true },
      { name: "ownerId", type: "Id(users)?", required: false },
      { name: "priority", type: "low|medium|high|critical", required: true },
      { name: "status", type: "active|converted|lost|archived", required: true },
      { name: "standardAmount", type: "number?", required: false },
      { name: "discountAmount", type: "number?", required: false },
      { name: "waiverAmount", type: "number?", required: false },
      { name: "finalPayable", type: "number?", required: false },
    ],
    indexes: [{ name: "stage", fields: ["stage"] }, { name: "ownerId", fields: ["ownerId"] }, { name: "priority", fields: ["priority"] }, { name: "status", fields: ["status"] }, { name: "ownerId_stage", fields: ["ownerId", "stage"] }, { name: "createdAt", fields: ["createdAt"] }],
    relationships: [{ table: "users", field: "ownerId" }, { table: "users", field: "createdBy" }],
    queries: ["crmLeads:listLeads", "crmLeads:getLeadById"],
    mutations: ["crmLeads:createLead", "crmLeads:updateLead", "crmLeads:deleteLead"],
    permissions: ["super_admin", "admin", "manager", "staff"],
    usedByPages: [PAGE_IDS.LEAD_DATABASE, PAGE_IDS.LEAD_WORKSPACE, PAGE_IDS.CRM_DASHBOARD],
  },
  {
    name: "leadPayments",
    id: "DB-006",
    description: "Payments made against leads",
    fields: [
      { name: "leadId", type: "Id(leadMaster)", required: true },
      { name: "amount", type: "number", required: true },
      { name: "mode", type: "cash|upi|bank|card|cheque|online", required: true },
      { name: "reference", type: "string?", required: false },
      { name: "enteredBy", type: "Id(users)", required: true },
      { name: "verifiedBy", type: "Id(users)?", required: false },
      { name: "status", type: "pending|verified|rejected", required: true },
    ],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "status", fields: ["status"] }, { name: "leadId_status", fields: ["leadId", "status"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "enteredBy" }, { table: "users", field: "verifiedBy" }],
    queries: ["crmPayments:getLeadPayments", "crmPayments:getAllLeadsPayments"],
    mutations: ["crmPayments:addPayment", "crmPayments:updatePaymentStatus"],
    permissions: ["super_admin", "admin", "manager"],
    usedByPages: [PAGE_IDS.LEAD_WORKSPACE, PAGE_IDS.CRM_DASHBOARD],
  },
  {
    name: "approvalRequests",
    id: "DB-007",
    description: "Approval workflow requests",
    fields: [
      { name: "title", type: "string", required: true },
      { name: "requesterId", type: "Id(users)", required: true },
      { name: "status", type: "pending|approved|rejected|cancelled", required: true },
      { name: "mode", type: "manual|sequential|parallel|hierarchy", required: true },
      { name: "currentPhase", type: "number?", required: false },
      { name: "totalPhases", type: "number", required: true },
    ],
    indexes: [{ name: "requesterId", fields: ["requesterId"] }, { name: "status", fields: ["status"] }, { name: "taskId", fields: ["taskId"] }],
    relationships: [{ table: "users", field: "requesterId" }, { table: "tasks", field: "taskId" }],
    queries: ["approvals:listApprovals", "approvals:getGlobalApprovalCounts"],
    mutations: ["approvals:decideApproval", "approvals:createApprovalRequest"],
    permissions: ["all"],
    usedByPages: [PAGE_IDS.APPROVAL_CENTER, PAGE_IDS.DASHBOARD],
  },
  {
    name: "notifications",
    id: "DB-008",
    description: "User notification records",
    fields: [
      { name: "userId", type: "Id(users)", required: true },
      { name: "type", type: "task|approval|message|mention|announcement|payment|conversion|lead", required: true },
      { name: "title", type: "string", required: true },
      { name: "message", type: "string", required: true },
      { name: "isRead", type: "boolean", required: true },
    ],
    indexes: [{ name: "userId", fields: ["userId"] }, { name: "userId_isRead", fields: ["userId", "isRead"] }],
    relationships: [{ table: "users", field: "userId" }],
    queries: ["notifications:listNotifications", "notifications:getUnreadCount"],
    mutations: ["notifications:markAsRead", "notifications:markAllAsRead"],
    permissions: ["all"],
    usedByPages: [PAGE_IDS.NOTIFICATIONS, PAGE_IDS.DASHBOARD],
  },
  {
    name: "channels",
    id: "DB-009",
    description: "Messenger channels and announcement boards",
    fields: [
      { name: "name", type: "string", required: true },
      { name: "description", type: "string?", required: false },
      { name: "type", type: "channel|announcement", required: true },
      { name: "createdBy", type: "Id(users)", required: true },
    ],
    indexes: [{ name: "type", fields: ["type"] }, { name: "createdBy", fields: ["createdBy"] }],
    relationships: [{ table: "users", field: "createdBy" }],
    queries: ["messenger:listChannels"],
    mutations: ["messenger:createChannel"],
    permissions: ["all"],
    usedByPages: [PAGE_IDS.MESSENGER],
  },
  {
    name: "messages",
    id: "DB-010",
    description: "Channel messages",
    fields: [
      { name: "channelId", type: "Id(channels)", required: true },
      { name: "senderId", type: "Id(users)", required: true },
      { name: "content", type: "string", required: true },
      { name: "isPinned", type: "boolean?", required: false },
      { name: "mentions", type: "Id(users)[]?", required: false },
    ],
    indexes: [{ name: "channelId", fields: ["channelId"] }, { name: "senderId", fields: ["senderId"] }, { name: "channelId_createdAt", fields: ["channelId", "createdAt"] }],
    relationships: [{ table: "channels", field: "channelId" }, { table: "users", field: "senderId" }],
    queries: ["messenger:getMessages"],
    mutations: ["messenger:sendMessage"],
    permissions: ["all"],
    usedByPages: [PAGE_IDS.MESSENGER],
  },
  {
    name: "leadActivity",
    id: "DB-011",
    description: "Activity log for leads",
    fields: [
      { name: "leadId", type: "Id(leadMaster)", required: true },
      { name: "action", type: "string", required: true },
      { name: "description", type: "string", required: true },
      { name: "userId", type: "Id(users)", required: true },
    ],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "leadId_createdAt", fields: ["leadId", "createdAt"] }, { name: "userId", fields: ["userId"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "userId" }],
    queries: ["crmActivity:getLeadActivity", "crmActivity:getLeadStageHistory"],
    mutations: [],
    permissions: ["super_admin", "admin", "manager", "staff"],
    usedByPages: [PAGE_IDS.LEAD_WORKSPACE, PAGE_IDS.CRM_DASHBOARD],
  },
  {
    name: "leadStageHistory",
    id: "DB-012",
    description: "Stage change tracking for leads",
    fields: [
      { name: "leadId", type: "Id(leadMaster)", required: true },
      { name: "fromStage", type: "string?", required: false },
      { name: "toStage", type: "string", required: true },
      { name: "changedBy", type: "Id(users)", required: true },
      { name: "note", type: "string?", required: false },
    ],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "leadId_createdAt", fields: ["leadId", "createdAt"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "changedBy" }],
    queries: ["crmActivity:getLeadStageHistory"],
    mutations: [],
    permissions: ["super_admin", "admin", "manager"],
    usedByPages: [PAGE_IDS.LEAD_WORKSPACE, PAGE_IDS.CRM_DASHBOARD],
  },
  {
    name: "verification_requests",
    id: "DB-013",
    description: "Universal verification engine requests",
    fields: [
      { name: "entityType", type: "string", required: true },
      { name: "entityId", type: "string", required: true },
      { name: "requesterId", type: "Id(users)", required: true },
      { name: "assignedUserIds", type: "Id(users)[]", required: true },
      { name: "mode", type: "any_one|all_required|sequential|round_robin", required: true },
      { name: "status", type: "pending|verified|rejected|returned", required: true },
    ],
    indexes: [{ name: "entityType", fields: ["entityType"] }, { name: "entityId", fields: ["entityId"] }, { name: "status", fields: ["status"] }, { name: "assignedUserIds", fields: ["assignedUserIds"] }, { name: "entityType_status", fields: ["entityType", "status"] }],
    relationships: [{ table: "users", field: "requesterId" }],
    queries: ["verification:getVerificationRequests", "verification:getVerificationRequestById"],
    mutations: ["verification:decideOnVerification"],
    permissions: ["super_admin", "admin"],
    usedByPages: [],
  },
  {
    name: "courses",
    id: "DB-014",
    description: "Course catalog",
    fields: [
      { name: "courseCode", type: "string", required: true },
      { name: "courseName", type: "string", required: true },
      { name: "baseFee", type: "number", required: true },
      { name: "status", type: "active|archived|draft", required: true },
      { name: "verticalId", type: "Id(verticals)?", required: false },
    ],
    indexes: [{ name: "courseCode", fields: ["courseCode"] }, { name: "verticalId", fields: ["verticalId"] }, { name: "status", fields: ["status"] }],
    relationships: [{ table: "verticals", field: "verticalId" }],
    queries: ["crmCourses:listCourses"],
    mutations: ["crmCourses:createCourse", "crmCourses:updateCourse"],
    permissions: ["super_admin", "admin"],
    usedByPages: [PAGE_IDS.COURSE_STUDIO],
  },
  {
    name: "opportunities",
    id: "DB-015",
    description: "Sales opportunities",
    fields: [
      { name: "leadId", type: "Id(leadMaster)", required: true },
      { name: "ownerId", type: "Id(users)", required: true },
      { name: "title", type: "string", required: true },
      { name: "stageId", type: "Id(salesOpportunityStages)", required: true },
      { name: "probability", type: "number", required: true },
      { name: "expectedRevenue", type: "number?", required: false },
      { name: "isActive", type: "boolean", required: true },
    ],
    indexes: [{ name: "leadId", fields: ["leadId"] }, { name: "ownerId", fields: ["ownerId"] }, { name: "stageId", fields: ["stageId"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "ownerId" }, { table: "salesOpportunityStages", field: "stageId" }],
    queries: ["crmSales:listOpportunities"],
    mutations: ["crmSales:createOpportunity", "crmSales:updateOpportunity"],
    permissions: ["super_admin", "admin", "manager"],
    usedByPages: [PAGE_IDS.SALES_WORKSPACE, PAGE_IDS.SALES_OPPORTUNITIES],
  },
  {
    name: "quotations",
    id: "DB-016",
    description: "Sales quotations",
    fields: [
      { name: "opportunityId", type: "Id(opportunities)", required: true },
      { name: "leadId", type: "Id(leadMaster)", required: true },
      { name: "quoteNumber", type: "string", required: true },
      { name: "status", type: "draft|sent|accepted|rejected|expired|revised", required: true },
      { name: "subtotal", type: "number", required: true },
      { name: "total", type: "number", required: true },
    ],
    indexes: [{ name: "opportunityId", fields: ["opportunityId"] }, { name: "leadId", fields: ["leadId"] }, { name: "status", fields: ["status"] }],
    relationships: [{ table: "opportunities", field: "opportunityId" }, { table: "leadMaster", field: "leadId" }],
    queries: ["quotations:getQuotation", "quotations:listQuotationLineItems"],
    mutations: ["quotations:updateQuotation"],
    permissions: ["super_admin", "admin", "manager"],
    usedByPages: [PAGE_IDS.QUOTATION_DETAIL],
  },
  {
    name: "userScopes",
    id: "DB-017",
    description: "User access scopes (department/branch/team/vertical)",
    fields: [
      { name: "userId", type: "Id(users)", required: true },
      { name: "companyIds", type: "Id(companies)[]?", required: false },
      { name: "departmentIds", type: "Id(departments)[]?", required: false },
      { name: "branchIds", type: "Id(branches)[]?", required: false },
      { name: "teamIds", type: "Id(teams)[]?", required: false },
      { name: "verticalIds", type: "Id(verticals)[]?", required: false },
    ],
    indexes: [{ name: "userId", fields: ["userId"] }],
    relationships: [{ table: "users", field: "userId" }],
    queries: [],
    mutations: ["userManagement:updateUserScopes"],
    permissions: ["super_admin"],
    usedByPages: [PAGE_IDS.USER_MANAGEMENT],
  },
  {
    name: "directMessages",
    id: "DB-018",
    description: "Direct messages between users",
    fields: [
      { name: "senderId", type: "Id(users)", required: true },
      { name: "receiverId", type: "Id(users)", required: true },
      { name: "content", type: "string", required: true },
      { name: "isRead", type: "boolean", required: true },
    ],
    indexes: [{ name: "senderId", fields: ["senderId"] }, { name: "receiverId", fields: ["receiverId"] }, { name: "participants", fields: ["senderId", "receiverId"] }],
    relationships: [{ table: "users", field: "senderId" }, { table: "users", field: "receiverId" }],
    queries: ["messenger:getUnreadDirectMessageCount"],
    mutations: ["messenger:sendDirectMessage"],
    permissions: ["all"],
    usedByPages: [PAGE_IDS.MESSENGER],
  },
  {
    name: "callLogs",
    id: "DB-019",
    description: "Call logs for leads",
    fields: [
      { name: "leadId", type: "Id(leadMaster)", required: true },
      { name: "callType", type: "string", required: true },
      { name: "outcome", type: "string", required: true },
      { name: "callDate", type: "number", required: true },
      { name: "userId", type: "Id(users)", required: true },
    ],
    indexes: [{ name: "leadId", fields: ["leadId"] }],
    relationships: [{ table: "leadMaster", field: "leadId" }, { table: "users", field: "userId" }],
    queries: [],
    mutations: [],
    permissions: ["super_admin", "admin", "manager"],
    usedByPages: [PAGE_IDS.LEAD_WORKSPACE],
  },
  {
    name: "sessions",
    id: "DB-020",
    description: "User auth sessions",
    fields: [
      { name: "userId", type: "Id(users)", required: true },
      { name: "token", type: "string", required: true },
      { name: "expiresAt", type: "number", required: true },
      { name: "lastActiveAt", type: "number", required: true },
    ],
    indexes: [{ name: "userId", fields: ["userId"] }, { name: "token", fields: ["token"] }],
    relationships: [{ table: "users", field: "userId" }],
    queries: [],
    mutations: [],
    permissions: ["system"],
    usedByPages: [],
  },
];

// Master data tables (simplified - all follow the same pattern)
const masterDataTables = [
  "orgDepartments", "orgTeams", "orgCompanies", "orgBranches", "orgDesignations",
  "verticals", "subVerticals", "boards",
  "academicVerticals", "academicSubVerticals", "academicBoards", "academicPrograms",
  "academicBatches", "academicBatchTypes", "academicSessions", "academicSubjects",
  "academicSections", "academicMediums", "academicLanguages", "academicStreams",
  "academicSemesters", "academicTerms", "academicClassrooms",
  "crmStages", "crmSources", "crmLostReasons", "crmTags", "crmPriorities",
  "crmCampaignChannels", "crmCampaignTypes", "crmCounsellingTypes", "crmCounsellingOutcomes",
  "crmEnquiryTypes", "crmReferralSources", "crmFollowUpTypes", "crmFollowUpOutcomes",
  "crmUtmCampaigns", "crmUtmMediums", "crmUtmSources", "crmLeadQualification",
  "crmLeadScoringRules", "crmLeadCategories", "crmIndustries", "crmMarketingChannels",
  "salesOpportunityStages", "salesOpportunityTypes", "salesQuotationStatuses",
  "salesPaymentStatuses", "salesInvoiceTypes", "salesTaxSlabs", "salesTerritories",
  "commNotificationTypes", "commEmailTemplates", "commSmsTemplates", "commWhatsAppTemplates",
  "financePaymentModes", "financeBankAccounts", "financeTaxTypes", "financeGstRates",
  "financeExpenseCategories", "financeIncomeCategories", "financeFeeCategories",
  "financeDiscountCategories", "financeCurrencies", "financeFinancialYears",
  "hrEmploymentStatuses", "hrEmployeeTypes", "hrEmployeeCategories", "hrWorkLocations",
  "hrSkills", "hrExperienceLevels",   "hrDocumentTypes",
  "forms", "formVersions", "formFields", "formLayouts", "formSubmissions", "formTemplates",
  "submissions", "submissionQueue", "submissionTimeline",
  "workflows", "workflowNodes", "workflowEdges", "workflowInstances", "workflowStepHistory",
  "personMaster", "personProfiles", "contactMethods", "addresses",
  "emergencyContacts", "relationships", "socialLinks", "personDocuments", "personQRCode",
  "studentMaster", "studentAdmissions", "studentAcademicProfile", "studentStatusHistory",
  "studentMedicalProfile", "studentAchievements", "studentDisciplinaryRecords", "studentTimeline",
  "communicationTemplates", "communicationQueue", "communicationLogs",
  "communicationPreferences", "notificationCenter", "deliveryStatus", "messageCampaigns",
  "feeStructures", "feeStructureLines", "invoiceHeaders", "invoiceLines", "invoiceInstallments",
  "paymentTransactions", "receipts", "refundRequests", "scholarships", "waivers",
  "analyticsSnapshots", "kpiDefinitions", "kpiValues", "kpiTrends",
  "dashboardWidgets", "dashboardLayouts",
  "visibilityPolicies", "categoryPermissions", "fieldPermissions", "sectionPermissions",
  "actionPermissions", "recordPolicies", "accessAuditLogs",
  "leadLifecycleStages", "leadAssignmentRules", "slaPolicies", "slaTimers", "leadScores",
]

// ─── APIs ────────────────────────────────────────────────────────

export const platformApis: ApiInfo[] = [
  // CRM
  { name: "crmLeads:listLeads", id: "API-001", type: "query", module: "CRM", parameters: "{ ownerId?, stage?, status?, search? }", returnType: "LeadMaster[]", usedBy: ["/crm", "/crm/leads"], permission: "all" },
  { name: "crmLeads:getLeadById", id: "API-002", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "LeadMaster", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "crmLeads:createLead", id: "API-003", type: "mutation", module: "CRM", parameters: "{ firstName, lastName, phone, stage, priority, ... }", returnType: "Id", usedBy: ["/crm/leads"], permission: "admin,manager" },
  { name: "crmLeads:updateLead", id: "API-004", type: "mutation", module: "CRM", parameters: "{ leadId, ...fields }", returnType: "void", usedBy: ["/crm/leads/:leadId"], permission: "admin,manager" },
  { name: "crmPayments:addPayment", id: "API-005", type: "mutation", module: "CRM", parameters: "{ leadId, amount, mode, reference, enteredBy }", returnType: "Id", usedBy: ["/crm/leads/:leadId"], permission: "admin,manager" },
  { name: "crmPayments:getLeadPayments", id: "API-006", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "LeadPayment[]", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "crmPayments:getAllLeadsPayments", id: "API-007", type: "query", module: "CRM", parameters: "{}", returnType: "LeadPaymentSummary[]", usedBy: ["/crm"], permission: "admin" },
  { name: "crmDashboard:getCrmDashboardData", id: "API-008", type: "query", module: "CRM", parameters: "{ userId, dateFilter }", returnType: "DashboardData", usedBy: ["/crm"], permission: "admin" },
  { name: "crmDashboard:getConversionHistory", id: "API-009", type: "query", module: "CRM", parameters: "{}", returnType: "ConversionEntry[]", usedBy: ["/crm"], permission: "admin" },
  { name: "crmActivity:getLeadActivity", id: "API-010", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "ActivityEntry[]", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "crmActivity:getLeadStageHistory", id: "API-011", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "StageChange[]", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "crmTasks:listLeadTasks", id: "API-012", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "LeadTask[]", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "crmTasks:createLeadTask", id: "API-013", type: "mutation", module: "CRM", parameters: "{ leadId, title, ownerId, ... }", returnType: "Id", usedBy: ["/crm/leads/:leadId"], permission: "admin,manager" },
  { name: "crmCourses:listCourses", id: "API-014", type: "query", module: "CRM", parameters: "{}", returnType: "Course[]", usedBy: ["/courses", "/crm/leads/:leadId"], permission: "all" },
  { name: "crmCourses:createCourse", id: "API-015", type: "mutation", module: "CRM", parameters: "{ courseCode, courseName, baseFee, ... }", returnType: "Id", usedBy: ["/courses"], permission: "admin" },
  { name: "crmCourses:updateCourse", id: "API-016", type: "mutation", module: "CRM", parameters: "{ courseId, ...fields }", returnType: "void", usedBy: ["/courses"], permission: "admin" },
  // Organization
  { name: "organization:listDepartments", id: "API-017", type: "query", module: "Organization", parameters: "{}", returnType: "Department[]", usedBy: ["/org", "/users"], permission: "all" },
  { name: "organization:createDepartment", id: "API-018", type: "mutation", module: "Organization", parameters: "{ name, code, ... }", returnType: "Id", usedBy: ["/org"], permission: "super_admin" },
  { name: "organization:listTeams", id: "API-019", type: "query", module: "Organization", parameters: "{}", returnType: "Team[]", usedBy: ["/org", "/users"], permission: "all" },
  { name: "organization:createTeam", id: "API-020", type: "mutation", module: "Organization", parameters: "{ name, code, departmentId, ... }", returnType: "Id", usedBy: ["/org", "/control"], permission: "super_admin" },
  { name: "organization:listBranches", id: "API-021", type: "query", module: "Organization", parameters: "{}", returnType: "Branch[]", usedBy: ["/org", "/users"], permission: "all" },
  { name: "organization:createBranch", id: "API-022", type: "mutation", module: "Organization", parameters: "{ name, code, ... }", returnType: "Id", usedBy: ["/org"], permission: "super_admin" },
  { name: "organization:listVerticals", id: "API-023", type: "query", module: "Organization", parameters: "{}", returnType: "Vertical[]", usedBy: ["/org", "/users"], permission: "all" },
  { name: "organization:listDesignations", id: "API-024", type: "query", module: "Organization", parameters: "{}", returnType: "Designation[]", usedBy: ["/org"], permission: "all" },
  { name: "organization:listCompanies", id: "API-025", type: "query", module: "Organization", parameters: "{}", returnType: "Company[]", usedBy: ["/org"], permission: "all" },
  // Users
  { name: "users:listUsers", id: "API-026", type: "query", module: "Users", parameters: "{}", returnType: "User[]", usedBy: ["/users", "/access", "/control"], permission: "admin" },
  { name: "users:getUser", id: "API-027", type: "query", module: "Users", parameters: "{ userId }", returnType: "User", usedBy: ["/users"], permission: "all" },
  { name: "userManagement:createUser", id: "API-028", type: "mutation", module: "Users", parameters: "{ username, password, name, role, ... }", returnType: "Id", usedBy: ["/users", "/control"], permission: "super_admin" },
  { name: "userManagement:resetPassword", id: "API-029", type: "mutation", module: "Users", parameters: "{ userId, newPassword }", returnType: "void", usedBy: ["/users", "/control"], permission: "super_admin" },
  { name: "userManagement:disableUser", id: "API-030", type: "mutation", module: "Users", parameters: "{ userId }", returnType: "void", usedBy: ["/users"], permission: "super_admin" },
  { name: "userManagement:updateUserScopes", id: "API-031", type: "mutation", module: "Users", parameters: "{ userId, companyIds?, departmentIds?, ... }", returnType: "void", usedBy: ["/users"], permission: "super_admin" },
  // Tasks
  { name: "tasks:listTasks", id: "API-032", type: "query", module: "Tasks", parameters: "{ status?, ownerId?, assignedTo? }", returnType: "Task[]", usedBy: ["/tasks", "/dashboard"], permission: "all" },
  { name: "tasks:createTask", id: "API-033", type: "mutation", module: "Tasks", parameters: "{ title, ownerId, status, priority, ... }", returnType: "Id", usedBy: ["/tasks"], permission: "all" },
  { name: "tasks:updateTaskStatus", id: "API-034", type: "mutation", module: "Tasks", parameters: "{ taskId, status }", returnType: "void", usedBy: ["/tasks"], permission: "all" },
  { name: "tasks:getTask", id: "API-035", type: "query", module: "Tasks", parameters: "{ taskId }", returnType: "Task", usedBy: ["/tasks/:taskId"], permission: "all" },
  // Approvals
  { name: "approvals:listApprovals", id: "API-036", type: "query", module: "Approvals", parameters: "{ status?, userId? }", returnType: "ApprovalRequest[]", usedBy: ["/approvals"], permission: "all" },
  { name: "approvals:getGlobalApprovalCounts", id: "API-037", type: "query", module: "Approvals", parameters: "{ userId }", returnType: "{ requests, crm, verification, total }", usedBy: ["/approvals", "/dashboard"], permission: "all" },
  { name: "approvals:decideApproval", id: "API-038", type: "mutation", module: "Approvals", parameters: "{ requestId, userId, decision, comment? }", returnType: "void", usedBy: ["/approvals"], permission: "all" },
  // Notifications
  { name: "notifications:listNotifications", id: "API-039", type: "query", module: "Notifications", parameters: "{ userId }", returnType: "Notification[]", usedBy: ["/notifications"], permission: "all" },
  { name: "notifications:getUnreadCount", id: "API-040", type: "query", module: "Notifications", parameters: "{ userId }", returnType: "number", usedBy: ["/notifications", "sidebar"], permission: "all" },
  { name: "notifications:markAsRead", id: "API-041", type: "mutation", module: "Notifications", parameters: "{ notificationId }", returnType: "void", usedBy: ["/notifications"], permission: "all" },
  // Messenger
  { name: "messenger:listChannels", id: "API-042", type: "query", module: "Messenger", parameters: "{}", returnType: "Channel[]", usedBy: ["/messenger", "/control"], permission: "all" },
  { name: "messenger:getMessages", id: "API-043", type: "query", module: "Messenger", parameters: "{ channelId }", returnType: "Message[]", usedBy: ["/messenger"], permission: "all" },
  { name: "messenger:sendMessage", id: "API-044", type: "mutation", module: "Messenger", parameters: "{ channelId, content, senderId }", returnType: "Id", usedBy: ["/messenger"], permission: "all" },
  { name: "messenger:createChannel", id: "API-045", type: "mutation", module: "Messenger", parameters: "{ name, description?, type, createdBy }", returnType: "Id", usedBy: ["/messenger", "/control"], permission: "all" },
  { name: "messenger:sendDirectMessage", id: "API-046", type: "mutation", module: "Messenger", parameters: "{ senderId, receiverId, content }", returnType: "Id", usedBy: ["/messenger"], permission: "all" },
  { name: "messenger:getUnreadDirectMessageCount", id: "API-047", type: "query", module: "Messenger", parameters: "{ userId }", returnType: "number", usedBy: ["sidebar"], permission: "all" },
  // Verification
  { name: "verification:getVerificationRequests", id: "API-048", type: "query", module: "Verification", parameters: "{ entityType?, status?, userId? }", returnType: "VerificationRequest[]", usedBy: [], permission: "admin" },
  { name: "verification:decideOnVerification", id: "API-049", type: "mutation", module: "Verification", parameters: "{ requestId, userId, decision, comment? }", returnType: "void", usedBy: [], permission: "admin" },
  // Sales
  { name: "crmSales:listOpportunities", id: "API-050", type: "query", module: "Sales", parameters: "{ ownerId?, stageId? }", returnType: "Opportunity[]", usedBy: ["/crm/sales", "/crm/sales/opportunities"], permission: "all" },
  { name: "crmSales:createOpportunity", id: "API-051", type: "mutation", module: "Sales", parameters: "{ leadId, title, stageId, ownerId, ... }", returnType: "Id", usedBy: ["/crm/sales"], permission: "admin,manager" },
  { name: "quotations:getQuotation", id: "API-052", type: "query", module: "Sales", parameters: "{ quotationId }", returnType: "Quotation", usedBy: ["/crm/sales/quotations/:quoteId"], permission: "all" },
  { name: "quotations:listQuotationLineItems", id: "API-053", type: "query", module: "Sales", parameters: "{ quotationId }", returnType: "LineItem[]", usedBy: ["/crm/sales/quotations/:quoteId"], permission: "all" },
  { name: "salesPerformance:getSalesMetrics", id: "API-054", type: "query", module: "Sales", parameters: "{ userId?, dateFrom?, dateTo? }", returnType: "SalesMetrics", usedBy: ["/crm/sales/performance"], permission: "admin" },
  // Dashboard
  { name: "dashboard:getDashboardStats", id: "API-055", type: "query", module: "System", parameters: "{ userId }", returnType: "DashboardStats", usedBy: ["/dashboard"], permission: "all" },
  // Form Studio
  { name: "formEngine:listForms", id: "API-056", type: "query", module: "Forms", parameters: "{ status?, category? }", returnType: "Form[]", usedBy: ["/forms"], permission: "admin" },
  { name: "formEngine:getForm", id: "API-057", type: "query", module: "Forms", parameters: "{ formId }", returnType: "Form", usedBy: ["/forms"], permission: "admin" },
  { name: "formEngine:createForm", id: "API-058", type: "mutation", module: "Forms", parameters: "{ name, code, description?, category? }", returnType: "Id", usedBy: ["/forms"], permission: "admin" },
  { name: "formEngine:updateForm", id: "API-059", type: "mutation", module: "Forms", parameters: "{ formId, ...fields }", returnType: "void", usedBy: ["/forms"], permission: "admin" },
  { name: "formEngine:publishForm", id: "API-060", type: "mutation", module: "Forms", parameters: "{ formId }", returnType: "FormVersion", usedBy: ["/forms"], permission: "admin" },
  { name: "formEngine:addField", id: "API-061", type: "mutation", module: "Forms", parameters: "{ formId, fieldType, fieldCode, label, config }", returnType: "Id", usedBy: ["/forms"], permission: "admin" },
  { name: "formEngine:updateField", id: "API-062", type: "mutation", module: "Forms", parameters: "{ fieldId, ...fieldConfig }", returnType: "void", usedBy: ["/forms"], permission: "admin" },
  // Intake Engine
  { name: "intakeEngine:getQueueStats", id: "API-063", type: "query", module: "Intake", parameters: "{}", returnType: "QueueStats", usedBy: ["/intake"], permission: "admin" },
  { name: "intakeEngine:listSubmissions", id: "API-064", type: "query", module: "Intake", parameters: "{ status?, formId?, page? }", returnType: "Submission[]", usedBy: ["/intake"], permission: "admin" },
  { name: "intakeEngine:processSubmission", id: "API-065", type: "mutation", module: "Intake", parameters: "{ submissionId }", returnType: "void", usedBy: ["/intake"], permission: "admin" },
  { name: "intakeEngine:verifySubmission", id: "API-066", type: "mutation", module: "Intake", parameters: "{ submissionId, decision, remark? }", returnType: "void", usedBy: ["/intake"], permission: "admin" },
  // Workflow Engine
  { name: "workflowEngine:list", id: "API-067", type: "query", module: "Workflow", parameters: "{ status?, module? }", returnType: "Workflow[]", usedBy: ["/workflows"], permission: "admin" },
  { name: "workflowEngine:get", id: "API-068", type: "query", module: "Workflow", parameters: "{ workflowId }", returnType: "Workflow", usedBy: ["/workflows"], permission: "admin" },
  { name: "workflowEngine:create", id: "API-069", type: "mutation", module: "Workflow", parameters: "{ name, code, description?, module? }", returnType: "Id", usedBy: ["/workflows"], permission: "admin" },
  { name: "workflowEngine:trigger", id: "API-070", type: "mutation", module: "Workflow", parameters: "{ workflowId, payload, context? }", returnType: "Id", usedBy: ["/workflows", "/intake"], permission: "system" },
  // People Registry
  { name: "personEngine:createPerson", id: "API-071", type: "mutation", module: "People", parameters: "{ firstName, lastName, displayName?, gender?, dob? }", returnType: "Id", usedBy: ["/people"], permission: "admin" },
  { name: "personEngine:getPerson", id: "API-072", type: "query", module: "People", parameters: "{ personId }", returnType: "PersonFull", usedBy: ["/people"], permission: "all" },
  { name: "personEngine:updatePerson", id: "API-073", type: "mutation", module: "People", parameters: "{ personId, ...fields }", returnType: "void", usedBy: ["/people"], permission: "admin" },
  { name: "personEngine:mergePersons", id: "API-074", type: "mutation", module: "People", parameters: "{ sourcePersonId, targetPersonId }", returnType: "void", usedBy: ["/people"], permission: "super_admin" },
  { name: "personSearch:globalSearch", id: "API-075", type: "query", module: "People", parameters: "{ query, limit?, cursor? }", returnType: "SearchResult[]", usedBy: ["/people"], permission: "all" },
  { name: "personSearch:quickSearch", id: "API-076", type: "query", module: "People", parameters: "{ q }", returnType: "PersonBasic[]", usedBy: ["/people", "global"], permission: "all" },
  { name: "contactEngine:addContactMethod", id: "API-077", type: "mutation", module: "People", parameters: "{ personId, type, value, countryCode?, label? }", returnType: "Id", usedBy: ["/people"], permission: "admin" },
  { name: "contactEngine:getContactMethods", id: "API-078", type: "query", module: "People", parameters: "{ personId }", returnType: "ContactMethod[]", usedBy: ["/people"], permission: "all" },
  { name: "contactEngine:verifyContactMethod", id: "API-079", type: "mutation", module: "People", parameters: "{ contactId }", returnType: "void", usedBy: ["/people"], permission: "admin" },
  { name: "relationshipEngine:linkPersons", id: "API-080", type: "mutation", module: "People", parameters: "{ personA, personB, relationshipType }", returnType: "Id", usedBy: ["/people"], permission: "admin" },
  { name: "relationshipEngine:getPersonRelationships", id: "API-081", type: "query", module: "People", parameters: "{ personId }", returnType: "Relationship[]", usedBy: ["/people"], permission: "all" },
  { name: "profileEngine:listProfiles", id: "API-082", type: "query", module: "People", parameters: "{ personId }", returnType: "PersonProfile[]", usedBy: ["/people"], permission: "all" },
  { name: "personQRCode:generateQRCode", id: "API-083", type: "mutation", module: "People", parameters: "{ personId }", returnType: "PersonQR", usedBy: ["/people"], permission: "admin" },
  // Student Engine
  { name: "studentEngine:createStudent", id: "API-084", type: "mutation", module: "Student", parameters: "{ personId, admissionNumber, companyId, branchId? }", returnType: "Id", usedBy: ["/students"], permission: "admin" },
  { name: "studentEngine:getStudent", id: "API-085", type: "query", module: "Student", parameters: "{ studentId }", returnType: "StudentFull", usedBy: ["/students"], permission: "all" },
  { name: "studentEngine:listStudents", id: "API-086", type: "query", module: "Student", parameters: "{ status?, branchId?, courseId? }", returnType: "StudentSummary[]", usedBy: ["/students"], permission: "admin" },
  { name: "studentSearch:searchStudents", id: "API-087", type: "query", module: "Student", parameters: "{ query, limit?, cursor? }", returnType: "StudentSearchResult[]", usedBy: ["/students"], permission: "all" },
  { name: "studentLifecycle:admitStudent", id: "API-088", type: "mutation", module: "Student", parameters: "{ studentId, verticalId?, courseId? }", returnType: "void", usedBy: ["/students"], permission: "admin" },
  { name: "studentLifecycle:promoteStudent", id: "API-089", type: "mutation", module: "Student", parameters: "{ studentId, newBatchId?, newYear? }", returnType: "void", usedBy: ["/students"], permission: "admin" },
  { name: "studentLifecycle:graduateStudent", id: "API-090", type: "mutation", module: "Student", parameters: "{ studentId }", returnType: "void", usedBy: ["/students"], permission: "admin" },
  { name: "studentLifecycle:getStudentTimeline", id: "API-091", type: "query", module: "Student", parameters: "{ studentId }", returnType: "TimelineEvent[]", usedBy: ["/students"], permission: "all" },
  // Communication Hub
  { name: "templateEngine:list", id: "API-092", type: "query", module: "Communication", parameters: "{ channel?, category? }", returnType: "Template[]", usedBy: ["/engage"], permission: "admin" },
  { name: "templateEngine:create", id: "API-093", type: "mutation", module: "Communication", parameters: "{ name, code, channel, subject?, body, variables? }", returnType: "Id", usedBy: ["/engage"], permission: "admin" },
  { name: "templateEngine:renderFromCode", id: "API-094", type: "query", module: "Communication", parameters: "{ code, variables }", returnType: "{ subject, body }", usedBy: ["/engage", "system"], permission: "all" },
  { name: "communicationHub:sendEmail", id: "API-095", type: "mutation", module: "Communication", parameters: "{ to, templateCode?, subject?, body?, variables? }", returnType: "Id", usedBy: ["/engage", "system"], permission: "admin" },
  { name: "communicationHub:sendInApp", id: "API-096", type: "mutation", module: "Communication", parameters: "{ userId, title, message, category?, reference? }", returnType: "Id", usedBy: ["/engage", "system"], permission: "all" },
  { name: "communicationHub:getQueueStats", id: "API-097", type: "query", module: "Communication", parameters: "{}", returnType: "QueueStats", usedBy: ["/engage"], permission: "admin" },
  { name: "communicationHub:listNotifications", id: "API-098", type: "query", module: "Communication", parameters: "{ userId, unreadOnly? }", returnType: "Notification[]", usedBy: ["/engage", "/dashboard"], permission: "all" },
  // Dashboard & KPI
  { name: "dashboardEngine:getEnterpriseOverview", id: "API-099", type: "query", module: "Dashboard", parameters: "{ companyId?, branchId? }", returnType: "EnterpriseSummary", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getCrmWidget", id: "API-100", type: "query", module: "Dashboard", parameters: "{ companyId?, branchId? }", returnType: "CrmWidgetData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getFinanceWidget", id: "API-101", type: "query", module: "Dashboard", parameters: "{ companyId?, branchId? }", returnType: "FinanceWidgetData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getAcademicWidget", id: "API-102", type: "query", module: "Dashboard", parameters: "{ branchId? }", returnType: "AcademicWidgetData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getHrWidget", id: "API-103", type: "query", module: "Dashboard", parameters: "{ companyId? }", returnType: "HrWidgetData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getOperationsWidget", id: "API-104", type: "query", module: "Dashboard", parameters: "{}", returnType: "OpsWidgetData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getCommunicationWidget", id: "API-105", type: "query", module: "Dashboard", parameters: "{}", returnType: "CommWidgetData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "dashboardEngine:getBranchComparison", id: "API-106", type: "query", module: "Dashboard", parameters: "{}", returnType: "BranchComparison[]", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "kpiEngine:getKpiDashboard", id: "API-107", type: "query", module: "Dashboard", parameters: "{ category? }", returnType: "KpiDashboard", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "kpiEngine:getExecutiveScorecard", id: "API-108", type: "query", module: "Dashboard", parameters: "{}", returnType: "ScorecardEntry[]", usedBy: ["/ceo"], permission: "super_admin" },
  // Executive Reports
  { name: "executiveReports:generateDailySummary", id: "API-109", type: "mutation", module: "Dashboard", parameters: "{}", returnType: "ReportId", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "executiveReports:generateWeeklyReview", id: "API-110", type: "mutation", module: "Dashboard", parameters: "{}", returnType: "ReportId", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "executiveReports:generateMonthlyReview", id: "API-111", type: "mutation", module: "Dashboard", parameters: "{}", returnType: "ReportId", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "executiveReports:listReports", id: "API-112", type: "query", module: "Dashboard", parameters: "{ type?, dateFrom?, dateTo? }", returnType: "ReportSummary[]", usedBy: ["/ceo"], permission: "super_admin" },
  // Visibility & Access
  { name: "visibilityEngine:canDiscover", id: "API-113", type: "query", module: "Security", parameters: "{ userId, category }", returnType: "boolean", usedBy: ["system"], permission: "system" },
  { name: "visibilityEngine:evaluateVisibility", id: "API-114", type: "query", module: "Security", parameters: "{ userId, module, recordId }", returnType: "VisibilityResult", usedBy: ["system"], permission: "system" },
  { name: "visibilityEngine:getEffectivePermissions", id: "API-115", type: "query", module: "Security", parameters: "{ userId, module }", returnType: "EffectivePermissions", usedBy: ["/access"], permission: "super_admin" },
  { name: "actionPermissions:simulateUserPermissions", id: "API-116", type: "query", module: "Security", parameters: "{ userId, module, recordId? }", returnType: "SimulationResult", usedBy: ["/access"], permission: "super_admin" },
  { name: "securityPolicies:list", id: "API-117", type: "query", module: "Security", parameters: "{}", returnType: "Policy[]", usedBy: ["/access"], permission: "super_admin" },
  { name: "fieldSecurity:getFieldPermissions", id: "API-118", type: "query", module: "Security", parameters: "{ designationId, module }", returnType: "FieldPerm[]", usedBy: ["/access"], permission: "super_admin" },
  { name: "recordScope:getUserAccessibleRecords", id: "API-119", type: "query", module: "Security", parameters: "{ userId, module }", returnType: "Id[]", usedBy: ["system"], permission: "system" },
  // Lead Lifecycle
  { name: "leadLifecycle:getHealthScore", id: "API-120", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "HealthScore", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "leadLifecycle:recordActivity", id: "API-121", type: "mutation", module: "CRM", parameters: "{ leadId, action, description }", returnType: "Id", usedBy: ["/crm/leads/:leadId"], permission: "admin" },
  { name: "leadLifecycle:getFollowUps", id: "API-122", type: "query", module: "CRM", parameters: "{ leadId }", returnType: "FollowUp[]", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "leadLifecycle:recordFollowUp", id: "API-123", type: "mutation", module: "CRM", parameters: "{ leadId, type, outcome?, scheduledDate?, notes? }", returnType: "Id", usedBy: ["/crm/leads/:leadId"], permission: "admin" },
  // Enrollment
  { name: "enrollmentEngine:enroll", id: "API-124", type: "mutation", module: "Enrollment", parameters: "{ leadId, studentData }", returnType: "Id", usedBy: ["/crm/leads/:leadId"], permission: "admin" },
  { name: "enrollmentEngine:getEnrollmentStatus", id: "API-125", type: "query", module: "Enrollment", parameters: "{ studentId }", returnType: "EnrollmentStatus", usedBy: ["/students"], permission: "all" },
  // Analytics
  { name: "analyticsEngine:getSnapshot", id: "API-126", type: "query", module: "Analytics", parameters: "{ snapshotType, dateFrom, dateTo }", returnType: "SnapshotData", usedBy: ["/ceo"], permission: "super_admin" },
  { name: "analyticsEngine:takeSnapshot", id: "API-127", type: "action", module: "Analytics", parameters: "{ snapshotType }", returnType: "Id", usedBy: ["system"], permission: "system" },
  // SLA & Assignment
  { name: "slaEngine:getSLAStatus", id: "API-128", type: "query", module: "SLA", parameters: "{ leadId }", returnType: "SLAStatus", usedBy: ["/crm/leads/:leadId"], permission: "all" },
  { name: "assignmentEngine:assignLead", id: "API-129", type: "mutation", module: "Assignment", parameters: "{ leadId, userId? }", returnType: "Id", usedBy: ["/crm/leads"], permission: "admin" },
  { name: "assignmentEngine:getWorkload", id: "API-130", type: "query", module: "Assignment", parameters: "{ userId? }", returnType: "WorkloadStats", usedBy: ["/crm"], permission: "admin" },
  // Fee & Billing
  { name: "feeEngine:getFeeStructure", id: "API-131", type: "query", module: "Finance", parameters: "{ studentId? }", returnType: "FeeStructure", usedBy: ["/students"], permission: "admin" },
  { name: "feeEngine:generateInvoice", id: "API-132", type: "mutation", module: "Finance", parameters: "{ studentId, amount, dueDate }", returnType: "Id", usedBy: ["/students"], permission: "admin" },
  { name: "paymentEngine:recordPayment", id: "API-133", type: "mutation", module: "Finance", parameters: "{ invoiceId, amount, mode, reference? }", returnType: "Id", usedBy: ["/students", "/crm/leads/:leadId"], permission: "admin" },
  // Employee Information System
  { name: "employeeEngine:createEmployee", id: "API-134", type: "mutation", module: "HR", parameters: "{ firstName, lastName, mobile, employmentType, primaryRole, ... }", returnType: "{ employeeId, personId, employeeCode }", usedBy: ["/employees"], permission: "admin" },
  { name: "employeeEngine:getEmployee", id: "API-135", type: "query", module: "HR", parameters: "{ employeeId }", returnType: "EmployeeFull", usedBy: ["/employees/:empId"], permission: "all" },
  { name: "employeeEngine:listEmployees", id: "API-136", type: "query", module: "HR", parameters: "{ status?, departmentId?, branchId?, companyId? }", returnType: "EmployeeSummary[]", usedBy: ["/employees"], permission: "admin" },
  { name: "employeeEngine:archiveEmployee", id: "API-137", type: "mutation", module: "HR", parameters: "{ employeeId, changedBy, reason? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeSearch:searchEmployees", id: "API-138", type: "query", module: "HR", parameters: "{ query, status?, departmentId?, limit?, cursor? }", returnType: "SearchResult[]", usedBy: ["/employees", "/people"], permission: "all" },
  { name: "employeeSearch:quickEmployeeSearch", id: "API-139", type: "query", module: "HR", parameters: "{ q, limit? }", returnType: "QuickResult[]", usedBy: ["/employees"], permission: "all" },
  { name: "employeeLifecycle:onboardEmployee", id: "API-140", type: "mutation", module: "HR", parameters: "{ employeeId, joiningDate?, probationEndDate? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:confirmEmployee", id: "API-141", type: "mutation", module: "HR", parameters: "{ employeeId, confirmationDate? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:transferEmployee", id: "API-142", type: "mutation", module: "HR", parameters: "{ employeeId, newDepartmentId?, newBranchId?, effectiveDate? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:promoteEmployee", id: "API-143", type: "mutation", module: "HR", parameters: "{ employeeId, newDesignationId, newPrimaryRole? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:suspendEmployee", id: "API-144", type: "mutation", module: "HR", parameters: "{ employeeId, remarks }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:reinstateEmployee", id: "API-145", type: "mutation", module: "HR", parameters: "{ employeeId, remarks? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:resignEmployee", id: "API-146", type: "mutation", module: "HR", parameters: "{ employeeId, resignationDate }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:terminateEmployee", id: "API-147", type: "mutation", module: "HR", parameters: "{ employeeId, remarks }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:retireEmployee", id: "API-148", type: "mutation", module: "HR", parameters: "{ employeeId, retirementDate? }", returnType: "void", usedBy: ["/employees/:empId"], permission: "admin" },
  { name: "employeeLifecycle:getEmployeeTimeline", id: "API-149", type: "query", module: "HR", parameters: "{ employeeId }", returnType: "TimelineEvent[]", usedBy: ["/employees/:empId"], permission: "all" },
  { name: "employeeEngine:getEmployeeStats", id: "API-150", type: "query", module: "HR", parameters: "{}", returnType: "EmployeeStats", usedBy: ["/employees", "/ceo"], permission: "admin" },
], type: "mutation", module: "Finance", parameters: "{ invoiceId, amount, mode, reference? }", returnType: "Id", usedBy: ["/students", "/crm/leads/:leadId"], permission: "admin" },
]

// ─── Engines ─────────────────────────────────────────────────────

export const platformEngines: EngineInfo[] = [
  {
    id: "ENG-001",
    name: "Access Control Engine",
    purpose: "Manages user permissions, role-based access control, and scope-based visibility across the platform",
    apis: ["accessControlEngine:getEffectiveAccess"],
    tables: ["users", "userScopes"],
    events: ["user.role.changed", "user.scope.changed"],
    consumers: ["All pages", "Sidebar", "API layer"],
  },
  {
    id: "ENG-002",
    name: "Verification Engine",
    purpose: "Universal verification system supporting any_one, all_required, sequential, and round_robin verification modes",
    apis: ["verification:getVerificationRequests", "verification:decideOnVerification"],
    tables: ["verification_requests", "verification_rules", "verification_decisions"],
    events: ["verification.completed", "verification.rejected", "verification.requested"],
    consumers: ["Payment verification", "Lead discount approval"],
  },
  {
    id: "ENG-003",
    name: "Activity Engine",
    purpose: "Records and tracks all user actions and system events for audit trails and activity feeds",
    apis: ["crmActivity:getLeadActivity"],
    tables: ["leadActivity"],
    events: ["activity.created"],
    consumers: ["Lead Workspace", "Dashboard"],
  },
  {
    id: "ENG-004",
    name: "Notification Engine",
    purpose: "Delivers real-time notifications for tasks, approvals, messages, mentions, announcements, payments, and conversions",
    apis: ["notifications:listNotifications", "notifications:getUnreadCount", "notifications:markAsRead"],
    tables: ["notifications"],
    events: ["notification.sent", "notification.read"],
    consumers: ["Notifications page", "Sidebar badge", "Approval Center", "Messenger"],
  },
  {
    id: "ENG-005",
    name: "Approval Engine",
    purpose: "Multi-mode approval workflow engine supporting manual, sequential, parallel, and hierarchy approval modes",
    apis: ["approvals:listApprovals", "approvals:getGlobalApprovalCounts", "approvals:decideApproval"],
    tables: ["approvalRequests", "approvalRequestApprovers", "approvalTemplates"],
    events: ["approval.started", "approval.decided", "approval.completed"],
    consumers: ["Approval Center", "Task Management", "Lead Conversion"],
  },
  {
    id: "ENG-006",
    name: "Collection Engine",
    purpose: "Manages payment collection, fee tracking, and recovery workflows",
    apis: ["collectionEngine:getCollectionData"],
    tables: ["leadPayments", "leadMaster"],
    events: ["payment.recorded", "payment.verified", "payment.rejected"],
    consumers: ["Collection Center", "Collection Dashboard", "Lead Workspace"],
  },
  {
    id: "ENG-007",
    name: "Timeline Engine",
    purpose: "Provides chronological event timelines for tasks, leads, and approvals",
    apis: [],
    tables: ["leadStageHistory", "opportunityStageHistory", "leadActivity"],
    events: ["timeline.entry.created"],
    consumers: ["Lead Workspace", "Sales Opportunities"],
  },
  {
    id: "ENG-008",
    name: "Sequence Engine",
    purpose: "Manages display ordering and sequencing for all master data entities",
    apis: [],
    tables: ["orgDepartments", "orgTeams", "orgCompanies", "orgBranches", "orgDesignations", "crmStages"],
    events: ["sequence.changed"],
    consumers: ["Organization Studio", "Master Data Studio"],
  },
  {
    id: "ENG-009",
    name: "Audit Engine",
    purpose: "Provides audit trail views and change tracking for compliance",
    apis: [],
    tables: ["leadStageHistory", "opportunityStageHistory"],
    events: ["audit.entry.created"],
    consumers: ["Lead Workspace", "Sales Workspace"],
  },
  {
    id: "ENG-010",
    name: "Attachment Engine",
    purpose: "Manages file attachments and documents linked to leads and tasks",
    apis: ["crmDocuments:getLeadDocuments", "crmDocuments:addLeadDocument", "crmDocuments:deleteLeadDocument"],
    tables: ["leadDocuments"],
    events: ["document.uploaded", "document.deleted"],
    consumers: ["Lead Workspace"],
  },
  {
    id: "ENG-011",
    name: "Comment Engine",
    purpose: "Manages threaded comments on tasks and leads",
    apis: [],
    tables: ["taskComments", "leadNotes"],
    events: ["comment.created"],
    consumers: ["Task Detail", "Lead Workspace"],
  },
  {
    id: "ENG-012",
    name: "Seed Engine",
    purpose: "Handles initial data seeding for all master data entities on first deployment",
    apis: [],
    tables: ["orgDepartments", "orgTeams", "orgBranches", "orgCompanies", "orgDesignations"],
    events: ["seed.completed"],
    consumers: ["System"],
  },
  {
    id: "ENG-013",
    name: "Form Engine",
    purpose: "Dynamic form builder with drag-and-drop, field types (40+), versioning, publishing, and submission management",
    apis: ["formEngine:listForms", "formEngine:getForm", "formEngine:createForm", "formEngine:publishForm"],
    tables: ["forms", "formVersions", "formFields", "formLayouts", "formSubmissions", "formTemplates"],
    events: ["form.created", "form.published", "form.submission.received"],
    consumers: ["Intake Engine", "CRM", "Workflow Engine"],
  },
  {
    id: "ENG-014",
    name: "Universal Intake Engine",
    purpose: "Enterprise intake gateway that validates, deduplicates, verifies, transforms, and routes all submissions",
    apis: ["intakeEngine:getQueueStats", "intakeEngine:listSubmissions", "intakeEngine:processSubmission", "intakeEngine:verifySubmission"],
    tables: ["submissions", "submissionQueue", "submissionTimeline"],
    events: ["submission.created", "submission.validated", "submission.verified"],
    consumers: ["CRM", "Admissions", "HR", "Finance"],
  },
  {
    id: "ENG-015",
    name: "Workflow Automation Engine",
    purpose: "Node-based workflow designer with conditions, delays, assignments, approvals, and execution engine",
    apis: ["workflowEngine:list", "workflowEngine:get", "workflowEngine:create", "workflowEngine:publish", "workflowEngine:trigger"],
    tables: ["workflows", "workflowNodes", "workflowEdges", "workflowInstances", "workflowStepHistory"],
    events: ["workflow.created", "workflow.started", "workflow.completed"],
    consumers: ["All modules", "CRM", "HR", "Finance"],
  },
  {
    id: "ENG-016",
    name: "Lead Lifecycle Engine",
    purpose: "Lead lifecycle management with stage transitions, health scoring, follow-up automation, and conversion pipeline",
    apis: ["leadLifecycle:getHealthScore", "leadLifecycle:recordActivity", "leadLifecycle:getFollowUps"],
    tables: ["leadMaster", "leadActivity", "leadStageHistory", "leadScores"],
    events: ["lead.stage.changed", "lead.health.updated", "lead.converted"],
    consumers: ["CRM", "Assignment Engine", "Workflow Engine"],
  },
  {
    id: "ENG-017",
    name: "Activity & Communication Engine",
    purpose: "Centralized activity logging, timeline generation, and communication tracking for all entity interactions",
    apis: ["crmActivity:getLeadActivity", "crmActivity:getLeadStageHistory"],
    tables: ["leadActivity", "leadStageHistory", "crmNotes"],
    events: ["activity.recorded", "activity.updated"],
    consumers: ["CRM", "Student", "HR", "All modules"],
  },
  {
    id: "ENG-018",
    name: "Assignment & SLA Engine",
    purpose: "Lead/user assignment with workload balancing, SLA timers, reminders, escalations, and auto-reassignment",
    apis: ["slaEngine:getSLAStatus", "assignmentEngine:assignLead", "assignmentEngine:getWorkload"],
    tables: ["leadAssignmentRules", "slaPolicies", "slaTimers"],
    events: ["assignment.created", "sla.warning", "sla.breached"],
    consumers: ["CRM", "Intake Engine", "Workflow Engine"],
  },
  {
    id: "ENG-019",
    name: "Analytics & Forecasting Engine",
    purpose: "Operational dashboards, conversion funnels, counselor performance, branch KPIs, and executive reporting",
    apis: ["analyticsEngine:getSnapshot", "analyticsEngine:takeSnapshot"],
    tables: ["analyticsSnapshots"],
    events: ["snapshot.taken", "kpi.threshold.reached"],
    consumers: ["CEO Dashboard", "CRM Dashboard", "Executive Reports"],
  },
  {
    id: "ENG-020",
    name: "Student Enrollment Engine",
    purpose: "Converts qualified CRM leads into enrolled students with full lifecycle and academic allocation",
    apis: ["enrollmentEngine:enroll", "enrollmentEngine:getEnrollmentStatus"],
    tables: ["studentAdmissions", "enrollmentHistory"],
    events: ["student.enrolled", "student.admitted", "student.converted"],
    consumers: ["Student SIS", "Fee Engine", "CRM"],
  },
  {
    id: "ENG-021",
    name: "Fee & Billing Engine",
    purpose: "Centralized fee management with structures, invoices, installments, discounts, scholarships, waivers, payments, and refunds",
    apis: ["feeEngine:getFeeStructure", "feeEngine:generateInvoice", "paymentEngine:recordPayment"],
    tables: ["feeStructures", "invoiceHeaders", "invoiceLines", "paymentTransactions", "receipts"],
    events: ["invoice.generated", "payment.received", "refund.processed"],
    consumers: ["Student SIS", "CRM", "Finance", "Analytics"],
  },
  {
    id: "ENG-022",
    name: "Unified Communication Hub",
    purpose: "Omnichannel communication gateway with template engine, message queue, delivery tracking, notification center, and campaigns",
    apis: ["templateEngine:list", "templateEngine:create", "templateEngine:renderFromCode", "communicationHub:sendEmail", "communicationHub:sendInApp", "communicationHub:getQueueStats"],
    tables: ["communicationTemplates", "communicationQueue", "communicationLogs", "notificationCenter", "deliveryStatus", "messageCampaigns"],
    events: ["message.sent", "message.delivered", "message.failed"],
    consumers: ["All modules", "CRM", "Student", "HR"],
  },
  {
    id: "ENG-023",
    name: "Dashboard & KPI Engine",
    purpose: "Enterprise dashboard with cross-company/branch reporting, widget CRUD, KPI definitions, scorecards, and trend analysis",
    apis: ["dashboardEngine:getEnterpriseOverview", "dashboardEngine:getCrmWidget", "dashboardEngine:getFinanceWidget", "dashboardEngine:getBranchComparison", "kpiEngine:getKpiDashboard"],
    tables: ["dashboardWidgets", "dashboardLayouts", "kpiDefinitions", "kpiValues"],
    events: ["widget.configured", "kpi.calculated", "kpi.target.missed"],
    consumers: ["CEO Dashboard", "Executive Reports", "COO Dashboard"],
  },
  {
    id: "ENG-024",
    name: "Executive Reports Engine",
    purpose: "Generates Daily/Weekly/Monthly/Quarterly/Annual executive reports with snapshot-based analytics",
    apis: ["executiveReports:generateDailySummary", "executiveReports:generateWeeklyReview", "executiveReports:generateMonthlyReview"],
    tables: ["analyticsSnapshots"],
    events: ["report.generated", "report.scheduled"],
    consumers: ["CEO", "COO", "Board"],
  },
  {
    id: "ENG-025",
    name: "Global People Registry",
    purpose: "Canonical identity domain with person master, unlimited contacts, addresses, relationships, QR codes, profiles, and global search",
    apis: ["personEngine:createPerson", "personEngine:getPerson", "personEngine:mergePersons", "personSearch:globalSearch", "contactEngine:addContactMethod", "relationshipEngine:linkPersons", "profileEngine:listProfiles", "personQRCode:generateQRCode"],
    tables: ["personMaster", "personProfiles", "contactMethods", "addresses", "relationships", "socialLinks", "personDocuments", "personQRCode"],
    events: ["person.created", "contact.verified", "relationship.linked"],
    consumers: ["Student SIS", "CRM", "HR", "Vendor"],
  },
  {
    id: "ENG-026",
    name: "Student Information System",
    purpose: "Canonical student domain with academic profile, status lifecycle, search, timeline, documents, and achievements",
    apis: ["studentEngine:createStudent", "studentEngine:getStudent", "studentEngine:listStudents", "studentSearch:searchStudents", "studentLifecycle:admitStudent", "studentLifecycle:promoteStudent", "studentLifecycle:graduateStudent"],
    tables: ["studentMaster", "studentAdmissions", "studentAcademicProfile", "studentStatusHistory", "studentMedicalProfile", "studentAchievements", "studentTimeline"],
    events: ["student.created", "student.admitted", "student.promoted", "student.graduated"],
    consumers: ["People Registry", "Fee Engine", "CRM", "Academic"],
  },
  {
    id: "ENG-027",
    name: "Data Visibility & Access Engine",
    purpose: "Central authority for record filtering, field masking, section visibility, action permissions, and security policy enforcement",
    apis: ["visibilityEngine:canDiscover", "visibilityEngine:evaluateVisibility", "visibilityEngine:getEffectivePermissions", "actionPermissions:simulateUserPermissions", "fieldSecurity:getFieldPermissions", "recordScope:getUserAccessibleRecords"],
    tables: ["visibilityPolicies", "categoryPermissions", "fieldPermissions", "sectionPermissions", "actionPermissions", "recordPolicies", "accessAuditLogs"],
    events: ["access.denied", "permission.changed", "policy.created"],
    consumers: ["All modules", "API layer", "Search", "QR"],
  },
  {
    id: "ENG-028",
    name: "Employee Information System",
    purpose: "Canonical employee domain with complete lifecycle from onboarding to exit, People Registry integration, and organization-based access",
    apis: ["employeeEngine:createEmployee", "employeeEngine:getEmployee", "employeeEngine:listEmployees", "employeeSearch:searchEmployees", "employeeSearch:quickEmployeeSearch", "employeeLifecycle:onboardEmployee", "employeeLifecycle:confirmEmployee", "employeeLifecycle:transferEmployee", "employeeLifecycle:promoteEmployee", "employeeLifecycle:suspendEmployee", "employeeLifecycle:reinstateEmployee", "employeeLifecycle:resignEmployee", "employeeLifecycle:relieveEmployee", "employeeLifecycle:terminateEmployee"],
    tables: ["employeeMaster", "employeeEmployment", "employeeHistory", "employeeDocuments", "employeeSkills", "employeeQualifications", "employeeAssets"],
    events: ["employee.created", "employee.confirmed", "employee.transferred", "employee.promoted", "employee.suspended", "employee.resigned", "employee.terminated", "employee.retired"],
    consumers: ["People Registry", "HR Module", "Payroll Engine", "Workflow Engine", "Communication Hub", "Access Engine"],
  },
];

// ─── Automations ─────────────────────────────────────────────────

export const platformAutomations: AutomationInfo[] = [
  {
    id: "AUTO-001",
    name: "Lead Auto-Conversion",
    trigger: "Payment verification completed",
    conditions: ["Lead status is 'active'", "Total verified payments > 0", "Lead not already converted"],
    actions: ["Patch lead stage to 'converted'", "Set lead status to 'converted'", "Log stage change in leadStageHistory"],
    notifications: ["Notify lead owner: 'Lead auto-converted after payment verification'"],
    timeline: "checkAutoConversion → verifyPayment → convertLead → notifyOwner",
  },
  {
    id: "AUTO-002",
    name: "Approval Notification",
    trigger: "Approval request created or decided",
    conditions: ["Approval request exists", "Approver is set"],
    actions: ["Create notification for approver", "Update approval request status"],
    notifications: ["Notify approver: 'Approval request assigned'", "Notify requester: 'Decision made'"],
    timeline: "createApprovalRequest → notifyApprover → decideApproval → notifyRequester",
  },
  {
    id: "AUTO-003",
    name: "Task Assignment Notification",
    trigger: "Task created or updated with assigned user change",
    conditions: ["Task assignedTo is set", "Owner differs from assigned"],
    actions: ["Create notification for assigned user", "Log in task activity"],
    notifications: ["Notify assigned user: 'New task assigned'"],
    timeline: "createTask → notifyAssigned → activityLogged",
  },
  {
    id: "AUTO-004",
    name: "Messenger Unread Tracking",
    trigger: "New message in channel or DM",
    conditions: ["Message is not from the receiver"],
    actions: ["Update lastReadAt for channel members", "Increment unread count"],
    notifications: ["Badge update on sidebar (real-time)"],
    timeline: "sendMessage → updateUnread → badgeUpdate",
  },
  {
    id: "AUTO-005",
    name: "Payment Verification Workflow",
    trigger: "Payment recorded for a lead",
    conditions: ["Payment status is 'pending'", "Verification rules apply"],
    actions: ["Create verification request", "Assign to verifiers per rules"],
    notifications: ["Notify verifiers: 'Payment pending verification'"],
    timeline: "addPayment → createVerificationRequest → assignVerifiers → [await decision]",
  },
  {
    id: "AUTO-006",
    name: "Stage Change Tracking",
    trigger: "Lead or opportunity stage changes",
    conditions: ["Stage actually changed (from !== to)"],
    actions: ["Insert into leadStageHistory or opportunityStageHistory", "Log activity entry"],
    notifications: ["Dashboard count update"],
    timeline: "changeStage → logHistory → updateDashboard",
  },
];

// ─── Components ──────────────────────────────────────────────────

export const platformComponents: ComponentInfo[] = [
  { id: "COMP-001", name: "AppLayout", path: "src/components/AppLayout.tsx", category: "layout", propsExample: "{ children }", dependencies: ["react-router", "lucide-react", "shadcn/ui"], usedByPages: ["All pages"] },
  { id: "COMP-002", name: "DataTable", path: "src/components/data/DataTable.tsx", category: "data", propsExample: "{ columns, data, keyExtractor, onRowClick }", dependencies: ["@/components/ui/table"], usedByPages: ["/crm", "/users", "/crm/leads"] },
  { id: "COMP-003", name: "StudioLayout", path: "src/components/layout/StudioLayout.tsx", category: "layout", propsExample: "{ title, description, breadcrumbItems, children }", dependencies: [], usedByPages: ["Studio pages"] },
  { id: "COMP-004", name: "SearchBar", path: "src/components/data/SearchBar.tsx", category: "data", propsExample: "{ value, onChange, placeholder }", dependencies: ["@/components/ui/input"], usedByPages: ["/crm/leads", "/users"] },
  { id: "COMP-005", name: "CrudDialog", path: "src/components/shared/CrudDialog.tsx", category: "shared", propsExample: "{ open, title, fields, onSubmit }", dependencies: ["react-hook-form", "shadcn/ui dialog"], usedByPages: ["Studio pages"] },
  { id: "COMP-006", name: "EmptyState", path: "src/components/shared/EmptyState.tsx", category: "shared", propsExample: "{ title, description, action }", dependencies: ["lucide-react"], usedByPages: ["All pages"] },
  { id: "COMP-007", name: "LoadingState", path: "src/components/shared/LoadingState.tsx", category: "shared", propsExample: "{ variant: 'spinner'|'skeleton' }", dependencies: ["@/components/ui/skeleton"], usedByPages: ["All pages"] },
  { id: "COMP-008", name: "PermissionWrapper", path: "src/components/shared/PermissionWrapper.tsx", category: "shared", propsExample: "{ allowedRoles, currentRole, children }", dependencies: [], usedByPages: ["All pages"] },
  { id: "COMP-009", name: "CommandPalette", path: "src/components/shared/CommandPalette.tsx", category: "shared", propsExample: "{ open, onClose }", dependencies: ["cmdk"], usedByPages: ["Header"] },
  { id: "COMP-010", name: "NotificationCenter", path: "src/components/shared/NotificationCenter.tsx", category: "shared", propsExample: "{ notifications, onMarkRead }", dependencies: [], usedByPages: ["Header"] },
  { id: "COMP-011", name: "StatisticsCard", path: "src/components/shared/StatisticsCard.tsx", category: "shared", propsExample: "{ label, value, trend, icon }", dependencies: ["lucide-react"], usedByPages: ["/crm", "/dashboard", "/crm/sales"] },
  { id: "COMP-012", name: "GlobalSearch", path: "src/components/shared/GlobalSearch.tsx", category: "shared", propsExample: "{ open, onClose }", dependencies: [], usedByPages: ["Header"] },
  { id: "COMP-013", name: "GlobalToolbar", path: "src/components/shared/GlobalToolbar.tsx", category: "shared", propsExample: "{ onSearch, onRefresh, onExport }", dependencies: [], usedByPages: ["Studio pages"] },
  { id: "COMP-014", name: "DashboardWidget", path: "src/components/shared/DashboardWidget.tsx", category: "shared", propsExample: "{ config, data }", dependencies: [], usedByPages: ["/dashboard"] },
  { id: "COMP-015", name: "ActivityTimeline", path: "src/components/shared/ActivityTimeline.tsx", category: "shared", propsExample: "{ entries }", dependencies: [], usedByPages: ["Lead Workspace"] },
  { id: "COMP-016", name: "CommentPanel", path: "src/components/shared/CommentPanel.tsx", category: "shared", propsExample: "{ comments, onAdd }", dependencies: [], usedByPages: ["Lead Workspace", "Task Detail"] },
  { id: "COMP-017", name: "LeadConversionWizard", path: "src/components/crm/LeadConversionWizard.tsx", category: "shared", propsExample: "{ lead, onClose }", dependencies: [], usedByPages: ["/crm/leads/:leadId"] },
  { id: "COMP-018", name: "RecordPaymentDialog", path: "src/components/crm/RecordPaymentDialog.tsx", category: "shared", propsExample: "{ leadId, open, onClose }", dependencies: [], usedByPages: ["/crm/leads/:leadId"] },
  { id: "COMP-019", name: "OpportunityBoard", path: "src/components/crm/OpportunityBoard.tsx", category: "shared", propsExample: "{ opportunities, stages }", dependencies: [], usedByPages: ["/crm/sales"] },
  { id: "COMP-020", name: "AuditViewer", path: "src/components/shared/AuditViewer.tsx", category: "shared", propsExample: "{ entries }", dependencies: [], usedByPages: [] },
  { id: "COMP-021", name: "AttachmentPanel", path: "src/components/shared/AttachmentPanel.tsx", category: "shared", propsExample: "{ files, onUpload, onDelete }", dependencies: [], usedByPages: ["Lead Workspace"] },
  { id: "COMP-022", name: "TimelineView", path: "src/components/shared/TimelineView.tsx", category: "shared", propsExample: "{ events }", dependencies: [], usedByPages: [] },
  { id: "COMP-023", name: "DebugPanel", path: "src/components/debug/DebugPanel.tsx", category: "shared", propsExample: "{}", dependencies: ["@/lib/error-logger"], usedByPages: ["All pages (floating)"] },
  { id: "COMP-024", name: "RouteErrorBoundary", path: "src/components/ui/route-error-boundary.tsx", category: "ui", propsExample: "{ children }", dependencies: [], usedByPages: ["All routes"] },
  { id: "COMP-025", name: "FilterBar", path: "src/components/data/FilterBar.tsx", category: "data", propsExample: "{ options, onRemove, onClearAll }", dependencies: [], usedByPages: [] },
];

// ─── Permissions ─────────────────────────────────────────────────

export const platformPermissions: PermissionInfo[] = [
  { page: "Dashboard", route: "/dashboard", superAdmin: true, admin: true, manager: true, staff: true, description: "Personal dashboard with widgets" },
  { page: "CRM Dashboard", route: "/crm", superAdmin: true, admin: true, manager: true, staff: false, description: "CRM metrics and pipeline view" },
  { page: "Lead Database", route: "/crm/leads", superAdmin: true, admin: true, manager: true, staff: true, description: "List and manage leads" },
  { page: "Lead Workspace", route: "/crm/leads/:leadId", superAdmin: true, admin: true, manager: true, staff: true, description: "Individual lead details" },
  { page: "Sales Workspace", route: "/crm/sales", superAdmin: true, admin: true, manager: true, staff: false, description: "Sales pipeline and opportunities" },
  { page: "Sales Opportunities", route: "/crm/sales/opportunities", superAdmin: true, admin: true, manager: true, staff: false, description: "Opportunity management" },
  { page: "Organization Studio", route: "/org", superAdmin: true, admin: false, manager: false, staff: false, description: "Organizational structure management" },
  { page: "User Management", route: "/users", superAdmin: true, admin: true, manager: false, staff: false, description: "User CRUD and scope management" },
  { page: "Access Control", route: "/access", superAdmin: true, admin: false, manager: false, staff: false, description: "Effective access and role visibility" },
  { page: "Task Management", route: "/tasks", superAdmin: true, admin: true, manager: true, staff: true, description: "Kanban task board" },
  { page: "Approval Center", route: "/approvals", superAdmin: true, admin: true, manager: true, staff: true, description: "Approval requests and decisions" },
  { page: "Notifications", route: "/notifications", superAdmin: true, admin: true, manager: true, staff: true, description: "Notification history" },
  { page: "Messenger", route: "/messenger", superAdmin: true, admin: true, manager: true, staff: true, description: "Channels and direct messages" },
  { page: "Control Center", route: "/control", superAdmin: true, admin: false, manager: false, staff: false, description: "CEO-only administrative controls" },
  { page: "Profile", route: "/profile", superAdmin: true, admin: true, manager: true, staff: true, description: "User profile settings" },
  { page: "Course Studio", route: "/courses", superAdmin: true, admin: true, manager: false, staff: false, description: "Course catalog management" },
  { page: "Collection Center", route: "/crm/sales/collections", superAdmin: true, admin: true, manager: true, staff: false, description: "Payment collection dashboard" },
  { page: "Sales Performance", route: "/crm/sales/performance", superAdmin: true, admin: true, manager: false, staff: false, description: "Sales metrics and KPIs" },
];

// ─── Route Tree ──────────────────────────────────────────────────

export const routeTree: RouteNode[] = [
  { path: "/", name: "Login", filePath: "src/pages/Login.tsx", layout: "None", guards: [] },
  {
    path: "/dashboard", name: "Dashboard", filePath: "src/pages/Dashboard.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/org", name: "Organization Studio", filePath: "src/pages/OrganizationStudio.tsx", layout: "AppLayout", guards: ["auth", "super_admin"],
  },
  {
    path: "/users", name: "User Management", filePath: "src/pages/UsersPage.tsx", layout: "AppLayout", guards: ["auth", "admin"],
  },
  {
    path: "/access", name: "Access Control", filePath: "src/pages/AccessControl.tsx", layout: "AppLayout", guards: ["auth", "super_admin"],
  },
  {
    path: "/tasks", name: "Task Management", filePath: "src/pages/TasksPage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/tasks/:taskId", name: "Task Detail", filePath: "src/pages/TaskDetail.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/approvals", name: "Approval Center", filePath: "src/pages/ApprovalsPage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/notifications", name: "Notifications", filePath: "src/pages/NotificationsPage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/messenger", name: "Messenger", filePath: "src/pages/MessengerPage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/control", name: "Control Center", filePath: "src/pages/ControlCenter.tsx", layout: "AppLayout", guards: ["auth", "super_admin"],
  },
  {
    path: "/profile", name: "Profile", filePath: "src/pages/ProfilePage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm", name: "CRM Dashboard", filePath: "src/pages/CrmDashboard.tsx", layout: "AppLayout", guards: ["auth", "admin"],
  },
  {
    path: "/crm/leads", name: "Lead Database", filePath: "src/pages/LeadDatabase.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm/leads/:leadId", name: "Lead Workspace", filePath: "src/pages/LeadWorkspace.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/courses", name: "Course Studio", filePath: "src/pages/CourseStudio.tsx", layout: "AppLayout", guards: ["auth", "admin"],
  },
  {
    path: "/crm/sales", name: "Sales Workspace", filePath: "src/pages/SalesWorkspace.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm/sales/opportunities", name: "Sales Opportunities", filePath: "src/pages/SalesOpportunitiesPage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm/sales/quotations/:quoteId", name: "Quotation Detail", filePath: "src/pages/QuotationDetail.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm/sales/tasks", name: "Sales Tasks", filePath: "src/pages/SalesTasksPage.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm/sales/performance", name: "Sales Performance", filePath: "src/pages/SalesPerformanceDashboard.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/crm/sales/collections", name: "Collection Center", filePath: "src/pages/CollectionCenter.tsx", layout: "AppLayout", guards: ["auth"],
  },
  {
    path: "/studios/master-data", name: "Master Data Studio", filePath: "src/pages/MasterDataStudio.tsx", layout: "AppLayout", guards: ["auth", "super_admin"],
  },
];

// ─── Health Issues ───────────────────────────────────────────────

export const healthIssues: HealthIssue[] = [
  { type: "missing_doc", severity: "low", message: "Several master data tables lack field documentation in platform-studio-data.ts", location: "src/lib/platform-studio-data.ts" },
  { type: "todo", severity: "low", message: "TODO markers exist across codebase (search for TODO in src/)", location: "src/" },
  { type: "unused_component", severity: "medium", message: "FilterBar, AuditViewer, TimelineView have no known consumers", location: "src/components/" },
  { type: "missing_doc", severity: "low", message: "Engine explorer needs detail on sequence engine and seed engine triggers", location: "src/lib/platform-studio-data.ts" },
  { type: "missing_doc", severity: "medium", message: "API docs for opportunity stage history and quotation versions not listed", location: "src/lib/platform-studio-data.ts" },
];

// ─── Aggregated Export ───────────────────────────────────────────

export const PLATFORM_METADATA: PlatformMetadata = {
  version: "1.0.0",
  buildDate: new Date().toISOString(),
  totalPages: platformPages.length,
  totalComponents: platformComponents.length,
  totalTables: platformTables.length + masterDataTables.length,
  totalApis: platformApis.length,
  totalEngines: platformEngines.length,
  totalAutomations: platformAutomations.length,
  totalRoutes: routeTree.length,
  pages: platformPages,
  tables: platformTables,
  apis: platformApis,
  engines: platformEngines,
  automations: platformAutomations,
  components: platformComponents,
  permissions: platformPermissions,
  routeTree,
  health: healthIssues,
};

/** Search across all metadata */
export function searchPlatform(query: string) {
  const q = query.toLowerCase();
  const results: { type: string; id: string; name: string; match: string }[] = [];

  for (const p of platformPages) {
    if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.route.includes(q))
      results.push({ type: "Page", id: p.id, name: p.name, match: p.route });
  }
  for (const t of platformTables) {
    if (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      results.push({ type: "Table", id: t.id, name: t.name, match: `${t.fields.length} fields` });
  }
  for (const a of platformApis) {
    if (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.module.toLowerCase().includes(q))
      results.push({ type: "API", id: a.id, name: a.name, match: a.module });
  }
  for (const e of platformEngines) {
    if (e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
      results.push({ type: "Engine", id: e.id, name: e.name, match: e.purpose });
  }
  for (const c of platformComponents) {
    if (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      results.push({ type: "Component", id: c.id, name: c.name, match: c.path });
  }
  for (const au of platformAutomations) {
    if (au.name.toLowerCase().includes(q) || au.id.toLowerCase().includes(q))
      results.push({ type: "Automation", id: au.id, name: au.name, match: au.trigger });
  }

  return results;
}
