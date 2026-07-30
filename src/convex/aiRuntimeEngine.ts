/**
 * Enterprise AI Runtime — Natural Language Enterprise AI Layer
 *
 * Phase 12 — One AI that knows the entire platform metadata.
 * Capabilities:
 *   - Natural language search across all entity types
 *   - Business analytics & insights
 *   - Workflow generation from natural language
 *   - Rule generation from natural language
 *   - Dashboard generation from natural language
 *   - Report generation from natural language
 *   - Document generation from natural language
 *   - Timetable generation
 *   - Notice generation
 *   - Email generation
 *   - Risk prediction & anomaly detection
 *   - Resource optimization suggestions
 *   - Voice command processing (future)
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ENTITY_REGISTRY } from "./entityEngine";
import { RULE_DEFINITIONS } from "./ruleRuntimeEngine";

// ─── AI Intent Types ─────────────────────────────────────────

export type AIIntent =
  | "search"          // "Find students with pending fees"
  | "analytics"       // "Show admission trends this quarter"
  | "insight"         // "Which branches are underperforming?"
  | "generate"        // "Generate a refund report"
  | "predict"         // "Predict fee defaults next quarter"
  | "recommend"       // "Suggest optimal faculty schedule"
  | "summarize"       // "Summarize today's operations"
  | "anomaly"         // "Detect unusual patterns in collections"
  | "workflow"        // "Create admission approval workflow"
  | "rule"            // "Set refund policy for this branch"
  | "document"        // "Generate bonafide certificate"
  | "dashboard"       // "Create CEO dashboard"
  | "report"          // "Generate attendance report"
  | "schedule"        // "Suggest optimal timetable"
  | "notice"          // "Generate holiday notice"
  | "email_draft"     // "Draft fee reminder email"
  | "help";           // "How do I process a refund?"

// ─── Knowledge Base — Entity-aware descriptions ───────────────

const ENTITY_DESCRIPTIONS: Record<string, string> = {
  student: "Student records including personal info, enrollment, fees, attendance, and academic history",
  lead: "Prospective student leads with source tracking, counseling history, and conversion status",
  employee: "Employee records including HR details, payroll, attendance, leave, and performance",
  faculty: "Teaching faculty with specialization, schedule, workload, and student assignments",
  invoice: "Fee invoices with amounts, due dates, payment status, and GST details",
  receipt: "Payment receipts with mode, amount, date, and verification status",
  refund: "Fee refund transactions with approval workflow, calculation, and payment tracking",
  cheque: "Post-dated cheques with deposit schedule, clearance status, and bounce tracking",
  ticket: "Support tickets with priority, SLA tracking, assignment, and resolution workflow",
  course: "Academic courses with duration, fee structure, subjects, and batch associations",
  batch: "Student batches with schedule, faculty, capacity, and enrollment tracking",
  exam: "Examinations with schedule, room allocation, invigilators, and result publishing",
  campaign: "Marketing campaigns with channels, budget, leads generated, and ROI tracking",
  knowledge: "Knowledge base articles with categories, tags, and helpfulness ratings",
  schedule: "Class schedules with faculty, subject, room, time, and conflict detection",
  attendance: "Student attendance records with daily tracking and percentage calculations",
  asset: "Physical assets with assignment, maintenance status, and depreciation tracking",
  inventory: "Inventory items with stock levels, transfers, and reorder thresholds",
  purchaseOrder: "Purchase orders with vendor details, items, amounts, and receipt status",
  vendor: "Vendor/supplier records with GST, payment terms, and performance tracking",
  production: "Content production tasks with assignment, review workflow, and publishing",
  certificate: "Certificates issued with verification, templates, and digital signatures",
  company: "Organization companies with branding, GST, banking, and branch structure",
  branch: "Operational branches with location, contact, and company association",
  department: "Organizational departments with head, teams, and scope definitions",
  payroll: "Employee payroll with earnings, deductions, taxes, and payment status",
  leave: "Employee leave applications with type, duration, approval, and balance tracking",
};

// ─── Intent Classification ────────────────────────────────────

const SEARCH_PATTERNS = [
  { pattern: /find|search|show|list|get|display|where|who/i, intent: "search" as AIIntent },
  { pattern: /analy|trend|month|quarter|year|growth|decline|increase|decrease|compare|overview|dashboard|kpi|metric/i, intent: "analytics" as AIIntent },
  { pattern: /insight|identify|pattern|notice|observe/i, intent: "insight" as AIIntent },
  { pattern: /predict|forecast|expect|likely|probability|risk|default|churn/i, intent: "predict" as AIIntent },
  { pattern: /recommend|suggest|optimize|improve|best|optimal/i, intent: "recommend" as AIIntent },
  { pattern: /summarize|summary|brief|overview/i, intent: "summarize" as AIIntent },
  { pattern: /anomal|unusual|abnormal|outlier|exception|flag/i, intent: "anomaly" as AIIntent },
  { pattern: /workflow|approval|process|sequence/i, intent: "workflow" as AIIntent },
  { pattern: /rule|policy|config|setting/i, intent: "rule" as AIIntent },
  { pattern: /generate|create.*doc|create.*cert|create.*letter|create.*report|create.*email|draft|write/i, intent: "generate" as AIIntent },
  { pattern: /dashboard|analytics.*page|kpi.*board/i, intent: "dashboard" as AIIntent },
  { pattern: /report|export|print/i, intent: "report" as AIIntent },
  { pattern: /schedule|timetable|calendar|class.*plan|faculty.*plan/i, intent: "schedule" as AIIntent },
  { pattern: /notice|circular|announcement|notification.*send/i, intent: "notice" as AIIntent },
  { pattern: /email|draft|compose/i, intent: "email_draft" as AIIntent },
  { pattern: /help|how to|guide|what is|explain/i, intent: "help" as AIIntent },
];

function classifyIntent(text: string): AIIntent {
  for (const { pattern, intent } of SEARCH_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return "search";
}

// ─── Entity Extraction ────────────────────────────────────────

function extractEntities(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const [key, desc] of Object.entries(ENTITY_DESCRIPTIONS)) {
    const name = ENTITY_REGISTRY[key]?.displayName?.toLowerCase() || key;
    const plural = ENTITY_REGISTRY[key]?.pluralName?.toLowerCase() || name + "s";
    if (lower.includes(name) || lower.includes(plural)) {
      found.push(key);
    }
  }
  // Check for keywords
  const keywordMap: Record<string, string> = {
    "student": "student", "students": "student",
    "lead": "lead", "leads": "lead",
    "employee": "employee", "employees": "employee",
    "faculty": "faculty", "teacher": "faculty", "teachers": "faculty",
    "invoice": "invoice", "invoices": "invoice", "fee": "invoice",
    "receipt": "receipt", "receipts": "receipt", "payment": "receipt",
    "refund": "refund", "refunds": "refund",
    "cheque": "cheque", "cheques": "cheque", "pdc": "cheque", "check": "cheque",
    "ticket": "ticket", "tickets": "ticket", "support": "ticket",
    "course": "course", "courses": "course",
    "batch": "batch", "batches": "batch",
    "exam": "exam", "exams": "exam", "examination": "exam",
    "campaign": "campaign", "campaigns": "campaign", "marketing": "campaign",
    "attendance": "attendance",
    "asset": "asset", "assets": "asset",
    "vendor": "vendor", "vendors": "vendor",
    "schedule": "schedule", "schedules": "schedule", "class": "schedule",
    "certificate": "certificate", "certificates": "certificate",
    "inventory": "inventory",
    "production": "production",
    "payroll": "payroll", "salary": "payroll",
    "leave": "leave", "leaves": "leave",
    "company": "company", "companies": "company",
    "branch": "branch", "branches": "branch",
    "department": "department", "departments": "department",
    "purchase": "purchaseOrder", "purchase order": "purchaseOrder", "po": "purchaseOrder",
  };
  for (const [word, entity] of Object.entries(keywordMap)) {
    if (lower.includes(word) && !found.includes(entity)) {
      found.push(entity);
    }
  }
  return found;
}

// ─── Main AI Query ────────────────────────────────────────────

export const processQuery = query({
  args: { query: v.string(), companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const text = args.query;
    const intent = classifyIntent(text);
    const entities = extractEntities(text);
    const lower = text.toLowerCase();

    // ── SEARCH ──
    if (intent === "search") {
      // Try to match filter conditions
      const conditions: string[] = [];
      const statusMatch = text.match(/(pending|active|inactive|overdue|paid|bounced|open|closed|verified|completed|approved|failed|cancelled)\s+/i);
      if (statusMatch) conditions.push(`status: ${statusMatch[1].toLowerCase()}`);

      const entityResults = entities.map(e => ({
        entityType: e,
        displayName: ENTITY_REGISTRY[e]?.displayName || e,
        description: ENTITY_DESCRIPTIONS[e] || "",
        quickFilters: ENTITY_REGISTRY[e]?.quickFilters || [],
        searchFields: ENTITY_REGISTRY[e]?.searchFields || [],
      }));

      return {
        intent: "search",
        query: text,
        entities: entityResults,
        conditions,
        suggestions: entityResults.map(e =>
          `Search ${ENTITY_REGISTRY[e.entityType]?.pluralName || e.entityType}`
        ),
        sql_like: entityResults.length > 0
          ? `SELECT * FROM "${ENTITY_REGISTRY[entityResults[0].entityType]?.tableName || entityResults[0].entityType}" WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "1=1"}`
          : undefined,
        timestamp: Date.now(),
      };
    }

    // ── ANALYTICS ──
    if (intent === "analytics") {
      return {
        intent: "analytics",
        query: text,
        entities,
        availableDashboards: entities.map(e => ({
          entityType: e,
          displayName: ENTITY_REGISTRY[e]?.displayName || e,
          widgets: ENTITY_REGISTRY[e]?.dashboardWidgets || [],
        })),
        metrics: ["Total Count", "Growth Rate", "Conversion Rate", "Trend Direction", "Period Comparison"],
        suggestions: [
          `Show ${entities[0] || "student"} trends by month`,
          `Compare ${entities[0] || "branch"} performance`,
          entities.length > 1 ? `Cross-reference ${entities[0]} and ${entities[1]}` : undefined,
        ].filter(Boolean),
        timestamp: Date.now(),
      };
    }

    // ── PREDICT ──
    if (intent === "predict") {
      const predictions = [];
      if (lower.includes("fee") || lower.includes("default") || lower.includes("payment")) {
        predictions.push({
          type: "Fee Default Prediction",
          description: "Identify students at risk of payment default based on payment history, PDC bounce rate, and communication engagement",
          factors: ["Payment history", "PDC bounce count", "Days overdue", "Communication response rate"],
          confidence: "Medium-High (requires sufficient historical data)",
        });
      }
      if (lower.includes("admission") || lower.includes("enrollment")) {
        predictions.push({
          type: "Admission Forecast",
          description: "Predict admission volumes for upcoming intake based on lead pipeline, historical conversion, and campaign effectiveness",
          factors: ["Lead pipeline velocity", "Seasonal patterns", "Campaign ROI", "Branch capacity"],
          confidence: "Medium (seasonal patterns are reliable)",
        });
      }
      if (lower.includes("attendance") || lower.includes("absent")) {
        predictions.push({
          type: "Attendance Risk",
          description: "Identify students at risk of dropping below minimum attendance threshold",
          factors: ["Current attendance %", "Absence pattern", "Course type", "Historical trends"],
          confidence: "High (clear threshold-based prediction)",
        });
      }
      return {
        intent: "predict",
        query: text,
        predictions: predictions.length > 0 ? predictions : [
          { type: "General Risk Assessment", description: "Analyze patterns across all entity types to identify emerging risks", factors: ["Entity trends", "Anomaly detection", "Historical baselines"], confidence: "Variable" },
        ],
        timestamp: Date.now(),
      };
    }

    // ── HELP ──
    if (intent === "help") {
      const helpTopics = [];
      if (entities.length > 0) {
        for (const e of entities) {
          helpTopics.push({
            entity: ENTITY_REGISTRY[e]?.displayName || e,
            description: ENTITY_DESCRIPTIONS[e] || "",
            actions: ENTITY_REGISTRY[e]?.allowedActions || [],
            searchFields: ENTITY_REGISTRY[e]?.searchFields || [],
            related: ENTITY_REGISTRY[e]?.relationships.map(r => r.entityType) || [],
          });
        }
      } else {
        helpTopics.push({
          entity: "General",
          description: "EEOS Enterprise Education Operating System",
          capabilities: [
            "Search any entity: 'Find students with pending fees'",
            "Analytics: 'Show admission trends this quarter'",
            "Generate: 'Generate a fee receipt for student ABC'",
            "Workflow: 'Create admission approval workflow'",
            "Rules: 'Set refund policy for this branch'",
            "Predict: 'Predict fee defaults next quarter'",
            "Recommend: 'Suggest optimal faculty schedule'",
            "Documents: 'Generate bonafide certificate'",
          ],
        });
      }
      return { intent: "help", query: text, topics: helpTopics, timestamp: Date.now() };
    }

    // ── RECOMMEND ──
    if (intent === "recommend") {
      const recommendations = [];
      if (lower.includes("faculty") || lower.includes("schedule") || lower.includes("timetable")) {
        recommendations.push({
          type: "Faculty Schedule Optimization",
          description: "Distribute faculty workload evenly, minimize gaps, respect max teaching hours, and reduce conflicts",
          approach: "Constraint-based scheduling with faculty preferences and branch rules",
        });
      }
      if (lower.includes("resource") || lower.includes("room")) {
        recommendations.push({
          type: "Resource Utilization",
          description: "Optimize classroom and lab allocation to maximize utilization and reduce idle time",
          approach: "Analyze usage patterns and suggest consolidation",
        });
      }
      if (lower.includes("counsellor") || lower.includes("workload")) {
        recommendations.push({
          type: "Counselor Workload Balancing",
          description: "Distribute leads evenly across counselors based on capacity and expertise",
          approach: "Round-robin with skill-based matching and lead score weighting",
        });
      }
      return {
        intent: "recommend",
        query: text,
        recommendations: recommendations.length > 0 ? recommendations : [
          { type: "General Optimization", description: "Analyze current operations and suggest improvements", approach: "Pattern analysis across all modules" },
        ],
        timestamp: Date.now(),
      };
    }

    // ── GENERATE / DOCUMENT ──
    if (intent === "generate" || intent === "document") {
      const docTypes = [];
      if (lower.includes("certificate") || lower.includes("bonafide")) {
        docTypes.push({ type: "Bonafide Certificate", description: "Generate bonafide certificate for a student", templateEntity: "student" });
      }
      if (lower.includes("receipt")) {
        docTypes.push({ type: "Fee Receipt", description: "Generate fee payment receipt", templateEntity: "receipt" });
      }
      if (lower.includes("invoice") || lower.includes("gst")) {
        docTypes.push({ type: "GST Invoice", description: "Generate GST-compliant invoice", templateEntity: "invoice" });
      }
      if (lower.includes("offer") || lower.includes("appointment")) {
        docTypes.push({ type: "Offer/Appointment Letter", description: "Generate employee offer or appointment letter", templateEntity: "employee" });
      }
      return {
        intent: "generate",
        query: text,
        documentTypes: docTypes.length > 0 ? docTypes : [
          { type: "Custom Document", description: "Specify document type and parameters", templateEntity: "unknown" },
        ],
        documentTemplates: entities.flatMap(e => ENTITY_REGISTRY[e]?.documentTemplates || []),
        timestamp: Date.now(),
      };
    }

    // ── WORKFLOW ──
    if (intent === "workflow") {
      return {
        intent: "workflow",
        query: text,
        suggestedWorkflows: entities.flatMap(e => ENTITY_REGISTRY[e]?.workflowTemplates || []),
        approvalTemplates: entities.flatMap(e => ENTITY_REGISTRY[e]?.approvalTemplates || []),
        description: entities.length > 0
          ? `Create a workflow for ${entities.map(e => ENTITY_REGISTRY[e]?.displayName || e).join(", ")}`
          : "Create a custom workflow",
        timestamp: Date.now(),
      };
    }

    // ── RULE ──
    if (intent === "rule") {
      let domainRules: any[] = [];
      if (lower.includes("refund")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "refund");
      } else if (lower.includes("late") || lower.includes("fee")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "late_fee");
      } else if (lower.includes("gst")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "gst");
      } else if (lower.includes("attendance")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "attendance");
      } else if (lower.includes("leave")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "leave");
      } else if (lower.includes("exam")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "exam");
      } else if (lower.includes("discount")) {
        domainRules = Object.values(RULE_DEFINITIONS).filter(r => r.domain === "discount");
      }
      return {
        intent: "rule",
        query: text,
        configurableRules: domainRules.length > 0 ? domainRules : Object.values(RULE_DEFINITIONS).slice(0, 10),
        description: "These rules are configurable per company, branch, or global scope through the Rule Studio",
        timestamp: Date.now(),
      };
    }

    // Default fallback
    return {
      intent: "search",
      query: text,
      entities: entities.map(e => ({
        entityType: e,
        displayName: ENTITY_REGISTRY[e]?.displayName || e,
        description: ENTITY_DESCRIPTIONS[e] || "",
      })),
      suggestions: ["Try: 'Find students with pending fees'", "Try: 'Show admission trends'", "Try: 'Generate a bonafide certificate'", "Try: 'Help me process a refund'"],
      timestamp: Date.now(),
    };
  },
});

// ─── AI Capabilities ──────────────────────────────────────────

export const getAICapabilities = query({
  handler: async () => {
    return {
      supportedIntents: [
        { intent: "search", label: "Natural Language Search", description: "Search across all entities using natural language" },
        { intent: "analytics", label: "Business Analytics", description: "Analyze trends, patterns, and performance metrics" },
        { intent: "insight", label: "Insights & Intelligence", description: "Discover hidden patterns and actionable insights" },
        { intent: "predict", label: "Predictions & Forecasting", description: "Predict future outcomes like defaults, admissions, risks" },
        { intent: "recommend", label: "Recommendations", description: "Get optimization suggestions for resources, schedules, workloads" },
        { intent: "summarize", label: "Summarization", description: "Get concise summaries of operations, dashboards, or entities" },
        { intent: "anomaly", label: "Anomaly Detection", description: "Detect unusual patterns in business data" },
        { intent: "workflow", label: "Workflow Generation", description: "Create business workflows from natural language" },
        { intent: "rule", label: "Rule Configuration", description: "Configure business rules and policies" },
        { intent: "document", label: "Document Generation", description: "Generate certificates, receipts, invoices, letters" },
        { intent: "dashboard", label: "Dashboard Creation", description: "Create dashboards with relevant KPIs and widgets" },
        { intent: "report", label: "Report Generation", description: "Generate business reports with export options" },
        { intent: "schedule", label: "Schedule Optimization", description: "Optimize timetables, faculty schedules, room allocation" },
        { intent: "email_draft", label: "Email Drafting", description: "Draft emails for various business contexts" },
        { intent: "help", label: "Platform Help", description: "Get guidance on using EEOS platform features" },
      ],
      knownEntities: Object.keys(ENTITY_DESCRIPTIONS).length,
      configurableRules: Object.keys(RULE_DEFINITIONS).length,
      entityCount: Object.keys(ENTITY_REGISTRY).length,
      timestamp: Date.now(),
    };
  },
});

// ─── Quick Examples ───────────────────────────────────────────

export const getQuickExamples = query({
  handler: async () => {
    return {
      search: [
        { query: "Find students with bounced cheques", description: "Search across students, cheques, and finance data" },
        { query: "Show pending refunds above 10000", description: "Find high-value pending refunds" },
        { query: "List faculty with overloaded schedule", description: "Identify faculty exceeding teaching hours" },
      ],
      analytics: [
        { query: "Show admission trends this quarter", description: "Analyze admission patterns across branches" },
        { query: "Compare branch performance", description: "Cross-branch comparison of KPIs" },
        { query: "What is our collection rate?", description: "Overall fee collection efficiency" },
      ],
      actions: [
        { query: "Generate a bonafide certificate", description: "Create student bonafide certificate" },
        { query: "Create admission approval workflow", description: "Build multi-level admission approval" },
        { query: "Set refund policy for this branch", description: "Configure branch-specific refund rules" },
      ],
    };
  },
});
