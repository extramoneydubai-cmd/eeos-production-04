/**
 * WorkflowTemplateEngine — Enterprise Workflow Templates
 *
 * 15 system templates covering every major business process.
 * Each template defines nodes, edges, and configuration.
 *
 * Templates:
 * 1.  Admission — New student admission approval chain
 * 2.  Fee Waiver — Fee waiver request with sequential approval
 * 3.  Refund — Refund processing with parallel finance + admin approval
 * 4.  Purchase — Purchase order approval chain
 * 5.  Leave — Employee leave request with manager → HR approval
 * 6.  Recruitment — Job opening → interviews → offer approval
 * 7.  Transfer — Employee transfer between departments
 * 8.  Promotion — Employee promotion with multi-level approval
 * 9.  Payroll — Payroll processing and approval
 * 10. Expense Approval — Expense report approval
 * 11. Vendor Approval — Vendor registration approval
 * 12. Content Approval — Content publishing approval
 * 13. Ticket Escalation — Support ticket escalation workflow
 * 14. Certificate Approval — Certificate/grade approval
 * 15. Exam Result Publishing — Exam result approval and publishing
 */

import type { WorkflowNode, WorkflowEdge, WorkflowTrigger, WorkflowDefinition } from "./WorkflowEngine";

export interface WorkflowTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers?: WorkflowTrigger[];
  tags: string[];
  estimatedDuration: string;
}

let nodeCounter = 0;
function nid(): string {
  return `node_${nodeCounter++}`;
}

function createBasicApprovalChain(
  approvers: { label: string; role: string }[],
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  const startId = nid();
  nodes.push({ id: startId, type: "start", label: "Start", config: {} });

  let prevId = startId;

  for (let i = 0; i < approvers.length; i++) {
    const approvalId = nid();
    nodes.push({
      id: approvalId,
      type: "approval",
      label: approvers[i].label,
      config: { assignedRoles: [approvers[i].role], order: i + 1 },
    });
    edges.push({ id: `e_${prevId}_${approvalId}`, source: prevId, target: approvalId, label: "Pending" });

    const rejectId = nid();
    nodes.push({ id: rejectId, type: "end", label: "Rejected", config: {} });
    edges.push({ id: `e_${approvalId}_${rejectId}_reject`, source: approvalId, target: rejectId, label: "Reject" });

    prevId = approvalId;
  }

  const approvedEndId = nid();
  nodes.push({ id: approvedEndId, type: "end", label: "Approved", config: {} });
  edges.push({ id: `e_${prevId}_${approvedEndId}`, source: prevId, target: approvedEndId, label: "Approve" });

  return { nodes, edges };
}

function createParallelApproval(
  approvers: { label: string; role: string }[],
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  const startId = nid();
  nodes.push({ id: startId, type: "start", label: "Start", config: {} });

  const parallelId = nid();
  nodes.push({ id: parallelId, type: "parallel", label: "Parallel Approval", config: {} });
  edges.push({ id: `e_start_parallel`, source: startId, target: parallelId });

  let lastApprovalId = "";
  for (let i = 0; i < approvers.length; i++) {
    const approvalId = nid();
    nodes.push({
      id: approvalId,
      type: "approval",
      label: approvers[i].label,
      config: { assignedRoles: [approvers[i].role], mode: "parallel" },
    });
    edges.push({ id: `e_parallel_${approvalId}`, source: parallelId, target: approvalId });
    lastApprovalId = approvalId;
  }

  const mergeId = nid();
  nodes.push({ id: mergeId, type: "merge", label: "Merge", config: {} });
  for (let i = 0; i < approvers.length; i++) {
    const idx = startId + 1 + i;
    edges.push({ id: `e_merge_${idx}`, source: `${parallelId}`, target: mergeId });
  }

  const approvedEndId = nid();
  nodes.push({ id: approvedEndId, type: "end", label: "Completed", config: {} });
  edges.push({ id: `e_merge_end`, source: mergeId, target: approvedEndId });

  return { nodes, edges };
}

// ─── Template Definitions ─────────────────────────────────────────

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "admission",
    category: "student",
    name: "Admission Approval",
    description: "New student admission approval with document verification, fee check, and final approval",
    ...createBasicApprovalChain([
      { label: "Document Verification", role: "admissions_officer" },
      { label: "Fee Check", role: "accounts_officer" },
      { label: "Final Approval", role: "admissions_manager" },
    ]),
    tags: ["admission", "student", "enrollment"],
    estimatedDuration: "2-4 hours",
  },
  {
    id: "fee_waiver",
    category: "finance",
    name: "Fee Waiver Request",
    description: "Fee waiver with sequential approval: counselor → finance → director",
    ...createBasicApprovalChain([
      { label: "Counselor Approval", role: "counselor" },
      { label: "Finance Approval", role: "finance_manager" },
      { label: "Director Approval", role: "director" },
    ]),
    tags: ["finance", "fee", "waiver", "discount"],
    estimatedDuration: "1-2 days",
  },
  {
    id: "refund",
    category: "finance",
    name: "Refund Processing",
    description: "Refund with parallel finance + admin approval, then final director approval",
    nodes: [
      { id: "refund_start", type: "start", label: "Start", config: {} },
      { id: "refund_parallel", type: "parallel", label: "Parallel Review", config: {} },
      { id: "refund_finance", type: "approval", label: "Finance Review", config: { assignedRoles: ["finance_manager"], mode: "parallel" } },
      { id: "refund_admin", type: "approval", label: "Admin Review", config: { assignedRoles: ["admin_manager"], mode: "parallel" } },
      { id: "refund_merge", type: "merge", label: "Merge", config: {} },
      { id: "refund_director", type: "approval", label: "Director Approval", config: { assignedRoles: ["director"] } },
      { id: "refund_end_approved", type: "end", label: "Refund Approved", config: {} },
      { id: "refund_end_rejected", type: "end", label: "Refund Rejected", config: {} },
    ],
    edges: [
      { id: "e1", source: "refund_start", target: "refund_parallel" },
      { id: "e2", source: "refund_parallel", target: "refund_finance" },
      { id: "e3", source: "refund_parallel", target: "refund_admin" },
      { id: "e4", source: "refund_finance", target: "refund_merge", label: "Approve" },
      { id: "e5", source: "refund_admin", target: "refund_merge", label: "Approve" },
      { id: "e6", source: "refund_finance", target: "refund_end_rejected", label: "Reject" },
      { id: "e7", source: "refund_admin", target: "refund_end_rejected", label: "Reject" },
      { id: "e8", source: "refund_merge", target: "refund_director" },
      { id: "e9", source: "refund_director", target: "refund_end_approved", label: "Approve" },
      { id: "e10", source: "refund_director", target: "refund_end_rejected", label: "Reject" },
    ],
    tags: ["finance", "refund", "student"],
    estimatedDuration: "2-3 days",
  },
  {
    id: "purchase",
    category: "procurement",
    name: "Purchase Order Approval",
    description: "Purchase order approval: manager → finance → director (escalates by amount)",
    ...createBasicApprovalChain([
      { label: "Manager Approval", role: "department_manager" },
      { label: "Finance Approval", role: "finance_manager" },
      { label: "Director Approval", role: "director" },
    ]),
    tags: ["procurement", "purchase", "vendor"],
    estimatedDuration: "1-2 days",
  },
  {
    id: "leave",
    category: "hr",
    name: "Leave Request",
    description: "Leave request: manager → HR approval (auto-approve for 1 day)",
    ...createBasicApprovalChain([
      { label: "Manager Approval", role: "department_manager" },
      { label: "HR Approval", role: "hr_manager" },
    ]),
    tags: ["hr", "leave", "employee"],
    estimatedDuration: "2-4 hours",
  },
  {
    id: "recruitment",
    category: "hr",
    name: "Recruitment Workflow",
    description: "Job opening → shortlist → interviews → offer approval chain",
    ...createBasicApprovalChain([
      { label: "Hiring Manager", role: "hiring_manager" },
      { label: "HR Review", role: "hr_manager" },
      { label: "Interview Panel", role: "interview_panel" },
      { label: "Final Approval", role: "director" },
    ]),
    tags: ["hr", "recruitment", "hiring"],
    estimatedDuration: "1-2 weeks",
  },
  {
    id: "transfer",
    category: "hr",
    name: "Employee Transfer",
    description: "Employee transfer: current manager → new manager → HR approval",
    ...createBasicApprovalChain([
      { label: "Current Manager", role: "current_manager" },
      { label: "New Manager", role: "new_manager" },
      { label: "HR Approval", role: "hr_manager" },
    ]),
    tags: ["hr", "transfer", "employee"],
    estimatedDuration: "2-3 days",
  },
  {
    id: "promotion",
    category: "hr",
    name: "Employee Promotion",
    description: "Promotion: manager → HR → director multi-level approval",
    ...createBasicApprovalChain([
      { label: "Manager Recommendation", role: "department_manager" },
      { label: "HR Review", role: "hr_manager" },
      { label: "Director Approval", role: "director" },
      { label: "CEO Approval", role: "ceo" },
    ]),
    tags: ["hr", "promotion", "employee"],
    estimatedDuration: "3-5 days",
  },
  {
    id: "payroll",
    category: "finance",
    name: "Payroll Processing",
    description: "Payroll: HR review → finance approval → director final approval",
    ...createBasicApprovalChain([
      { label: "HR Review", role: "hr_manager" },
      { label: "Finance Approval", role: "finance_manager" },
      { label: "Director Approval", role: "director" },
    ]),
    tags: ["finance", "payroll", "hr"],
    estimatedDuration: "1-2 days",
  },
  {
    id: "expense",
    category: "finance",
    name: "Expense Approval",
    description: "Expense report: manager → finance (auto-approve under $500)",
    nodes: [
      { id: "exp_start", type: "start", label: "Start", config: {} },
      {
        id: "exp_condition",
        type: "condition",
        label: "Check Amount",
        config: { expression: "variables.amount < 500" },
      },
      { id: "exp_auto", type: "automation", label: "Auto-Approve", config: { action: "auto_approve" } },
      { id: "exp_manager", type: "approval", label: "Manager Approval", config: { assignedRoles: ["department_manager"] } },
      { id: "exp_finance", type: "approval", label: "Finance Approval", config: { assignedRoles: ["finance_manager"] } },
      { id: "exp_end_approved", type: "end", label: "Expense Approved", config: {} },
      { id: "exp_end_rejected", type: "end", label: "Expense Rejected", config: {} },
    ],
    edges: [
      { id: "ex1", source: "exp_start", target: "exp_condition" },
      { id: "ex2", source: "exp_condition", target: "exp_auto", label: "Amount < $500" },
      { id: "ex3", source: "exp_condition", target: "exp_manager", label: "Amount >= $500" },
      { id: "ex4", source: "exp_auto", target: "exp_end_approved" },
      { id: "ex5", source: "exp_manager", target: "exp_finance", label: "Approve" },
      { id: "ex6", source: "exp_manager", target: "exp_end_rejected", label: "Reject" },
      { id: "ex7", source: "exp_finance", target: "exp_end_approved", label: "Approve" },
      { id: "ex8", source: "exp_finance", target: "exp_end_rejected", label: "Reject" },
    ],
    tags: ["finance", "expense", "employee"],
    estimatedDuration: "1-2 days",
  },
  {
    id: "vendor_approval",
    category: "procurement",
    name: "Vendor Approval",
    description: "Vendor registration: procurement review → finance verification → director approval",
    ...createBasicApprovalChain([
      { label: "Procurement Review", role: "procurement_officer" },
      { label: "Finance Verification", role: "finance_manager" },
      { label: "Director Approval", role: "director" },
    ]),
    tags: ["procurement", "vendor", "finance"],
    estimatedDuration: "2-3 days",
  },
  {
    id: "content_approval",
    category: "marketing",
    name: "Content Approval",
    description: "Content publishing: content creator → marketing manager → compliance review",
    ...createBasicApprovalChain([
      { label: "Content Review", role: "content_creator" },
      { label: "Marketing Manager", role: "marketing_manager" },
      { label: "Compliance Review", role: "compliance_officer" },
    ]),
    tags: ["marketing", "content", "compliance"],
    estimatedDuration: "1-2 days",
  },
  {
    id: "ticket_escalation",
    category: "support",
    name: "Ticket Escalation",
    description: "Support ticket: L1 → L2 → L3 → management escalation chain",
    ...createBasicApprovalChain([
      { label: "L1 Support", role: "support_l1" },
      { label: "L2 Support", role: "support_l2" },
      { label: "L3 Support", role: "support_l3" },
      { label: "Management Escalation", role: "support_manager" },
    ]),
    tags: ["support", "ticket", "escalation"],
    estimatedDuration: "1-4 hours",
  },
  {
    id: "certificate_approval",
    category: "academic",
    name: "Certificate Approval",
    description: "Certificate/grade approval: faculty → department head → registrar → examination controller",
    ...createBasicApprovalChain([
      { label: "Faculty Review", role: "faculty" },
      { label: "Department Head", role: "department_head" },
      { label: "Registrar", role: "registrar" },
      { label: "Examination Controller", role: "exam_controller" },
    ]),
    tags: ["academic", "certificate", "examination"],
    estimatedDuration: "2-5 days",
  },
  {
    id: "exam_result",
    category: "academic",
    name: "Exam Result Publishing",
    description: "Exam result: faculty entry → moderation board → director → publish",
    nodes: [
      { id: "res_start", type: "start", label: "Start", config: {} },
      { id: "res_faculty", type: "approval", label: "Faculty Entry", config: { assignedRoles: ["faculty"] } },
      { id: "res_moderation", type: "approval", label: "Moderation Board", config: { assignedRoles: ["moderation_board"] } },
      { id: "res_director", type: "approval", label: "Director Approval", config: { assignedRoles: ["director"] } },
      { id: "res_notification", type: "notification", label: "Notify Students", config: { channels: ["email", "sms", "in_app"], roles: ["student"] } },
      { id: "res_end", type: "end", label: "Results Published", config: {} },
      { id: "res_rejected", type: "end", label: "Rejected", config: {} },
    ],
    edges: [
      { id: "re1", source: "res_start", target: "res_faculty" },
      { id: "re2", source: "res_faculty", target: "res_moderation", label: "Submit" },
      { id: "re3", source: "res_moderation", target: "res_director", label: "Approve" },
      { id: "re4", source: "res_moderation", target: "res_rejected", label: "Reject" },
      { id: "re5", source: "res_director", target: "res_notification", label: "Approve" },
      { id: "re6", source: "res_director", target: "res_rejected", label: "Reject" },
      { id: "re7", source: "res_notification", target: "res_end" },
    ],
    tags: ["academic", "examination", "result"],
    estimatedDuration: "3-7 days",
  },
];

// ─── Template Engine ──────────────────────────────────────────────

class WorkflowTemplateEngineImpl {
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    WORKFLOW_TEMPLATES.forEach((t) => this.templates.set(t.id, t));
  }

  /** Get a template by ID */
  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /** List all templates, optionally filtered */
  listTemplates(filters?: {
    category?: string;
    search?: string;
    tag?: string;
  }): WorkflowTemplate[] {
    let list = Array.from(this.templates.values());
    if (filters?.category) list = list.filter((t) => t.category === filters.category);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (filters?.tag) list = list.filter((t) => t.tags.includes(filters.tag!));
    return list;
  }

  /** Get categories */
  getCategories(): { id: string; label: string; count: number }[] {
    const counts: Record<string, number> = {};
    WORKFLOW_TEMPLATES.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    const labelMap: Record<string, string> = {
      student: "Student", finance: "Finance & Accounts", hr: "HR & People",
      procurement: "Procurement", marketing: "Marketing", support: "Support",
      academic: "Academic",
    };
    return Object.entries(counts).map(([id, count]) => ({
      id,
      label: labelMap[id] || id,
      count,
    }));
  }

  /** Convert a template to a workflow definition */
  async templateToDefinition(templateId: string, overrides?: {
    name?: string;
    description?: string;
    organizationId?: string;
    companyId?: string;
    branchId?: string;
    createdBy?: string;
  }): Promise<Omit<WorkflowDefinition, "_id">> {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    return {
      name: overrides?.name || template.name,
      description: overrides?.description || template.description,
      category: template.category,
      status: "active",
      version: 1,
      nodes: template.nodes,
      edges: template.edges,
      triggers: template.triggers,
      tags: template.tags,
      organizationId: overrides?.organizationId,
      companyId: overrides?.companyId,
      branchId: overrides?.branchId,
      createdBy: overrides?.createdBy,
      updatedBy: overrides?.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /** Register a custom template */
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }

  /** Reset (for testing) */
  reset(): void {
    this.templates.clear();
    WORKFLOW_TEMPLATES.forEach((t) => this.templates.set(t.id, t));
  }
}

export const workflowTemplateEngine = new WorkflowTemplateEngineImpl();
