/**
 * SupportEngine — Core Enterprise Support Operations
 *
 * Manages ticket lifecycle, status transitions, assignment, and operational logic.
 * Integrates with Workflow Engine, Approval Engine, and Event Pipeline.
 */

// ─── Ticket Types ─────────────────────────────────────────────────

export const TICKET_TYPES = [
  { id: "support", label: "Support", color: "#4285f4", icon: "Headphones" },
  { id: "hardware", label: "Hardware", color: "#e8710a", icon: "Monitor" },
  { id: "software", label: "Software", color: "#a855f7", icon: "Terminal" },
  { id: "network", label: "Network", color: "#06b6d4", icon: "Wifi" },
  { id: "internet", label: "Internet", color: "#14b8a6", icon: "Globe" },
  { id: "printer", label: "Printer", color: "#5f6368", icon: "Printer" },
  { id: "laptop", label: "Laptop", color: "#4285f4", icon: "Monitor" },
  { id: "biometric", label: "Biometric", color: "#34a853", icon: "Fingerprint" },
  { id: "face_attendance", label: "Face Attendance", color: "#1a73e8", icon: "Camera" },
  { id: "student", label: "Student", color: "#a855f7", icon: "GraduationCap" },
  { id: "parent", label: "Parent", color: "#ec4899", icon: "Users" },
  { id: "faculty", label: "Faculty", color: "#1557b0", icon: "BookOpen" },
  { id: "finance", label: "Finance", color: "#34a853", icon: "DollarSign" },
  { id: "gst", label: "GST", color: "#f59e0b", icon: "FileText" },
  { id: "fee", label: "Fee", color: "#ea4335", icon: "CreditCard" },
  { id: "refund", label: "Refund", color: "#e8710a", icon: "ArrowLeft" },
  { id: "pdc_bounce", label: "PDC Bounce", color: "#dc2626", icon: "XCircle" },
  { id: "procurement", label: "Procurement", color: "#5f6368", icon: "ShoppingCart" },
  { id: "vendor", label: "Vendor", color: "#9aa0a6", icon: "Truck" },
  { id: "academic", label: "Academic", color: "#a855f7", icon: "Book" },
  { id: "examination", label: "Examination", color: "#ea4335", icon: "FileCheck" },
  { id: "lms", label: "LMS", color: "#1a73e8", icon: "Monitor" },
  { id: "website", label: "Website", color: "#06b6d4", icon: "Globe" },
  { id: "mobile_app", label: "Mobile App", color: "#14b8a6", icon: "Smartphone" },
  { id: "security", label: "Security", color: "#dc2626", icon: "Shield" },
  { id: "access", label: "Access", color: "#f59e0b", icon: "Key" },
  { id: "facility", label: "Facility", color: "#e8710a", icon: "Building" },
  { id: "transport", label: "Transport", color: "#4285f4", icon: "Bus" },
  { id: "hostel", label: "Hostel", color: "#a855f7", icon: "Home" },
  { id: "library", label: "Library", color: "#34a853", icon: "BookOpen" },
  { id: "custom", label: "Custom", color: "#9aa0a6", icon: "Settings" },
];

export const TICKET_STATUSES = [
  { id: "new", label: "New", color: "#4285f4" },
  { id: "open", label: "Open", color: "#1a73e8" },
  { id: "in_progress", label: "In Progress", color: "#fbbc04" },
  { id: "pending", label: "Pending", color: "#f59e0b" },
  { id: "resolved", label: "Resolved", color: "#34a853" },
  { id: "closed", label: "Closed", color: "#5f6368" },
  { id: "reopened", label: "Reopened", color: "#ea4335" },
  { id: "cancelled", label: "Cancelled", color: "#9aa0a6" },
];

export const TICKET_PRIORITIES = [
  { id: "low", label: "Low", color: "#34a853" },
  { id: "medium", label: "Medium", color: "#fbbc04" },
  { id: "high", label: "High", color: "#ea4335" },
  { id: "critical", label: "Critical", color: "#dc2626" },
];

// ─── Ticket Model ─────────────────────────────────────────────────

export interface Ticket {
  _id?: string;
  ticketNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  severity?: string;
  type: string;
  category?: string;
  subCategory?: string;
  source?: string;
  channel?: string;
  requesterId?: string;
  requesterType?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  assignedTo?: string;
  assignedTeam?: string;
  assignedGroup?: string;
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedAssetId?: string;
  firstResponseAt?: number;
  firstResponseBy?: string;
  resolvedAt?: number;
  closedAt?: number;
  reopenedCount?: number;
  responseDueAt?: number;
  resolutionDueAt?: number;
  slaBreached?: boolean;
  isEscalated?: boolean;
  escalatedAt?: number;
  escalatedBy?: string;
  isMerged?: boolean;
  mergedInto?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  isOverdue?: boolean;
  satisfactionRating?: number;
  tags?: string[];
  customFields?: Record<string, any>;
  resolutionSummary?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
}

let nextTicketNumber = 1000;
let tickets: Map<string, Ticket> = new Map();

// ─── Ticket Number Generation ─────────────────────────────────────

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const num = ++nextTicketNumber;
  return `SVC-${year}-${String(num).padStart(4, "0")}`;
}

// ─── Engine ───────────────────────────────────────────────────────

class SupportEngineImpl {
  /** Create a new ticket */
  createTicket(params: {
    title: string;
    description?: string;
    type: string;
    priority?: string;
    severity?: string;
    category?: string;
    source?: string;
    requesterId?: string;
    requesterType?: string;
    requesterName?: string;
    requesterEmail?: string;
    requesterPhone?: string;
    assignedTo?: string;
    organizationId?: string;
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    relatedAssetId?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    createdBy?: string;
  }): string {
    const now = Date.now();
    const id = `ticket_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const ticket: Ticket = {
      _id: id,
      ticketNumber: generateTicketNumber(),
      title: params.title,
      description: params.description,
      status: "new",
      priority: params.priority || "medium",
      severity: params.severity,
      type: params.type,
      category: params.category,
      source: params.source || "portal",
      requesterId: params.requesterId,
      requesterType: params.requesterType,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      requesterPhone: params.requesterPhone,
      assignedTo: params.assignedTo,
      organizationId: params.organizationId,
      companyId: params.companyId,
      branchId: params.branchId,
      departmentId: params.departmentId,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      relatedAssetId: params.relatedAssetId,
      tags: params.tags,
      customFields: params.customFields,
      createdBy: params.createdBy,
      updatedBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    tickets.set(id, ticket);
    return id;
  }

  /** Update a ticket */
  updateTicket(id: string, updates: Partial<Ticket>): Ticket | undefined {
    const ticket = tickets.get(id);
    if (!ticket) return undefined;
    const updated = { ...ticket, ...updates, updatedAt: Date.now(), _id: id };
    tickets.set(id, updated);
    return updated;
  }

  /** Transition ticket status with validation */
  transitionStatus(id: string, newStatus: string, userId?: string): { success: boolean; message: string } {
    const ticket = tickets.get(id);
    if (!ticket) return { success: false, message: "Ticket not found" };

    const validTransitions: Record<string, string[]> = {
      new: ["open", "cancelled"],
      open: ["in_progress", "pending", "cancelled"],
      in_progress: ["resolved", "pending", "open", "cancelled"],
      pending: ["in_progress", "open", "resolved", "cancelled"],
      resolved: ["closed", "reopened"],
      closed: ["reopened"],
      reopened: ["open", "in_progress"],
      cancelled: ["reopened"],
    };

    const allowed = validTransitions[ticket.status] || [];
    if (!allowed.includes(newStatus)) {
      return { success: false, message: `Cannot transition from ${ticket.status} to ${newStatus}` };
    }

    const now = Date.now();
    const updates: Partial<Ticket> = { status: newStatus, updatedAt: now };

    if (newStatus === "resolved") {
      updates.resolvedAt = now;
    }
    if (newStatus === "closed") {
      updates.closedAt = now;
    }
    if (newStatus === "reopened") {
      updates.reopenedCount = (ticket.reopenedCount || 0) + 1;
    }

    tickets.set(id, { ...ticket, ...updates, _id: id });
    return { success: true, message: `Ticket transitioned to ${newStatus}` };
  }

  /** Assign ticket to an agent */
  assignTicket(id: string, assignTo: string): Ticket | undefined {
    return this.updateTicket(id, { assignedTo: assignTo });
  }

  /** Get a ticket by ID */
  getTicket(id: string): Ticket | undefined {
    return tickets.get(id);
  }

  /** List tickets with filters */
  listTickets(filters?: {
    status?: string;
    priority?: string;
    type?: string;
    assignedTo?: string;
    requesterId?: string;
    branchId?: string;
    departmentId?: string;
    search?: string;
    slaBreached?: boolean;
    isEscalated?: boolean;
    isOverdue?: boolean;
    limit?: number;
  }): Ticket[] {
    let list = Array.from(tickets.values());
    if (filters?.status) list = list.filter((t) => t.status === filters.status);
    if (filters?.priority) list = list.filter((t) => t.priority === filters.priority);
    if (filters?.type) list = list.filter((t) => t.type === filters.type);
    if (filters?.assignedTo) list = list.filter((t) => t.assignedTo === filters.assignedTo);
    if (filters?.requesterId) list = list.filter((t) => t.requesterId === filters.requesterId);
    if (filters?.branchId) list = list.filter((t) => t.branchId === filters.branchId);
    if (filters?.departmentId) list = list.filter((t) => t.departmentId === filters.departmentId);
    if (filters?.slaBreached !== undefined) list = list.filter((t) => t.slaBreached === filters.slaBreached);
    if (filters?.isEscalated !== undefined) list = list.filter((t) => t.isEscalated === filters.isEscalated);
    if (filters?.isOverdue !== undefined) list = list.filter((t) => t.isOverdue === filters.isOverdue);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.requesterName?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt).slice(0, filters?.limit || 100);
  }

  /** Get counts by status */
  getStatusCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }

  /** Get SLA stats */
  getSLAStats(): { total: number; breached: number; withinSLA: number; complianceRate: number } {
    const all = Array.from(tickets.values());
    const total = all.length;
    const breached = all.filter((t) => t.slaBreached).length;
    return {
      total,
      breached,
      withinSLA: total - breached,
      complianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
    };
  }

  /** Get escalation stats */
  getEscalationStats(): { total: number; escalated: number; escalationRate: string } {
    const all = Array.from(tickets.values());
    const escalated = all.filter((t) => t.isEscalated).length;
    return {
      total: all.length,
      escalated,
      escalationRate: all.length > 0 ? `${Math.round((escalated / all.length) * 100)}%` : "0%",
    };
  }

  /** Reset (for testing) */
  reset(): void {
    tickets.clear();
    nextTicketNumber = 1000;
  }
}

export const supportEngine = new SupportEngineImpl();
