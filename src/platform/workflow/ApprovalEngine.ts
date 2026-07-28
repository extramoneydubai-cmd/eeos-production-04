/**
 * ApprovalEngine — Universal Enterprise Approval Engine
 *
 * Supports all approval modes:
 * - Single: One approver
 * - Sequential: Chain of approvers
 * - Parallel: All must approve
 * - Voting: Simple majority wins
 * - Percentage: Must reach X% approval
 * - CEO/COO Override: Bypass normal flow
 * - Emergency Approval: Accelerated path
 * - Delegate: Hand off to another
 * - Escalation: Auto-escalate after timeout
 * - Auto Approval: Auto-approve based on rules
 * - Auto Reject: Auto-reject based on rules
 *
 * Every module consumes this — no hardcoded approval logic.
 */

// ─── Types ────────────────────────────────────────────────────────

export type ApprovalMode =
  | "single"
  | "sequential"
  | "parallel"
  | "voting"
  | "majority"
  | "percentage"
  | "ceo_override"
  | "coo_override"
  | "emergency"
  | "delegate"
  | "auto_approve"
  | "auto_reject";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated" | "delegated" | "timed_out" | "skipped";

export interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  mode: ApprovalMode;
  status: ApprovalStatus;
  requestedBy: string;
  requestedByName: string;
  approvers: ApproverConfig[];
  currentApproverIndex: number;
  votes: ApprovalVote[];
  requiredVotes: number;
  requiredPercentage: number;
  deadline: number;
  escalationLevel: number;
  escalatedAt?: number;
  delegatedTo?: string;
  delegatedBy?: string;
  overrideBy?: string;
  overrideReason?: string;
  autoApprovalRule?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface ApproverConfig {
  userId: string;
  userName: string;
  role: string;
  order: number;
  status: ApprovalStatus;
}

export interface ApprovalVote {
  approverId: string;
  approverName: string;
  action: "approve" | "reject" | "abstain" | "delegate" | "escalate";
  comment?: string;
  timestamp: number;
}

export interface ApprovalResult {
  approved: boolean;
  status: ApprovalStatus;
  mode: ApprovalMode;
  votesReceived: number;
  totalRequired: number;
  percentage: number;
  escalated: boolean;
  nextApprover?: ApproverConfig;
  message: string;
}

// ─── Engine ───────────────────────────────────────────────────────

class ApprovalEngineImpl {
  private requests: Map<string, ApprovalRequest> = new Map();

  /** Create an approval request */
  createRequest(params: {
    entityType: string;
    entityId: string;
    entityLabel: string;
    mode: ApprovalMode;
    requestedBy: string;
    requestedByName: string;
    approvers: ApproverConfig[];
    requiredVotes?: number;
    requiredPercentage?: number;
    deadlineMinutes?: number;
    metadata?: Record<string, any>;
  }): string {
    const now = Date.now();
    const id = `apr_${now}_${Math.random().toString(36).slice(2, 8)}`;

    let requiredVotes = params.requiredVotes || 1;
    let requiredPercentage = params.requiredPercentage || 100;

    switch (params.mode) {
      case "single":
        requiredVotes = 1;
        break;
      case "sequential":
        requiredVotes = params.approvers.length;
        break;
      case "parallel":
        requiredVotes = params.approvers.length;
        break;
      case "voting":
        requiredVotes = params.requiredVotes || Math.ceil(params.approvers.length / 2);
        break;
      case "majority":
        requiredVotes = Math.ceil(params.approvers.length / 2) + 1;
        break;
      case "percentage":
        requiredVotes = params.approvers.length;
        requiredPercentage = params.requiredPercentage || 51;
        break;
      case "auto_approve":
      case "ceo_override":
      case "coo_override":
      case "emergency":
        requiredVotes = 1;
        break;
    }

    const request: ApprovalRequest = {
      id,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      mode: params.mode,
      status: "pending",
      requestedBy: params.requestedBy,
      requestedByName: params.requestedByName,
      approvers: params.approvers.sort((a, b) => a.order - b.order),
      currentApproverIndex: 0,
      votes: [],
      requiredVotes,
      requiredPercentage,
      deadline: now + (params.deadlineMinutes || 1440) * 60 * 1000,
      escalationLevel: 0,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.requests.set(id, request);
    return id;
  }

  /** Submit a vote on an approval */
  vote(params: {
    requestId: string;
    approverId: string;
    approverName: string;
    action: "approve" | "reject" | "abstain" | "delegate" | "escalate";
    comment?: string;
  }): ApprovalResult {
    const request = this.requests.get(params.requestId);
    if (!request) {
      return { approved: false, status: "pending", mode: "single", votesReceived: 0, totalRequired: 1, percentage: 0, escalated: false, message: "Request not found" };
    }

    // Record the vote
    const vote: ApprovalVote = {
      approverId: params.approverId,
      approverName: params.approverName,
      action: params.action,
      comment: params.comment,
      timestamp: Date.now(),
    };

    request.votes.push(vote);
    request.updatedAt = Date.now();

    // Handle escalation
    if (params.action === "escalate") {
      request.status = "escalated";
      request.escalationLevel++;
      request.escalatedAt = Date.now();
      return {
        approved: false,
        status: "escalated",
        mode: request.mode,
        votesReceived: request.votes.length,
        totalRequired: request.requiredVotes,
        percentage: this.calculatePercentage(request),
        escalated: true,
        message: `Escalated to level ${request.escalationLevel}`,
      };
    }

    // Handle delegation
    if (params.action === "delegate") {
      request.status = "delegated";
      return {
        approved: false,
        status: "delegated",
        mode: request.mode,
        votesReceived: request.votes.length,
        totalRequired: request.requiredVotes,
        percentage: this.calculatePercentage(request),
        escalated: false,
        message: "Delegated to another approver",
      };
    }

    // Evaluate approval mode
    const result = this.evaluateRequest(request);
    request.status = result.status;
    return result;
  }

  /** Evaluate an approval request based on its mode */
  private evaluateRequest(request: ApprovalRequest): ApprovalResult {
    const approveVotes = request.votes.filter((v) => v.action === "approve").length;
    const rejectVotes = request.votes.filter((v) => v.action === "reject").length;
    const totalVotes = request.votes.filter((v) => v.action !== "abstain").length;
    const percentage = this.calculatePercentage(request);

    let approved = false;
    let status: ApprovalStatus = "pending";
    let message = "";

    switch (request.mode) {
      case "single": {
        if (rejectVotes > 0) { status = "rejected"; message = "Rejected"; break; }
        if (approveVotes >= 1) { approved = true; status = "approved"; message = "Approved"; }
        break;
      }

      case "sequential": {
        const currentApprover = request.approvers[request.currentApproverIndex];
        const currentVote = request.votes.find((v) => v.approverId === currentApprover?.userId);
        if (currentVote?.action === "reject") { status = "rejected"; message = "Rejected at step"; break; }
        if (currentVote?.action === "approve") {
          if (request.currentApproverIndex >= request.approvers.length - 1) {
            approved = true; status = "approved"; message = "All approvers approved";
          } else {
            request.currentApproverIndex++;
            message = `Waiting for ${request.approvers[request.currentApproverIndex].userName}`;
          }
        }
        break;
      }

      case "parallel": {
        if (rejectVotes > 0) { status = "rejected"; message = "Rejected by parallel vote"; break; }
        if (approveVotes >= request.approvers.length) {
          approved = true; status = "approved"; message = "All approvers approved";
        } else {
          message = `Waiting: ${approveVotes}/${request.approvers.length} approved`;
        }
        break;
      }

      case "voting": {
        if (approveVotes >= request.requiredVotes) {
          approved = true; status = "approved"; message = `Achieved ${approveVotes}/${request.requiredVotes} votes`;
        } else if (rejectVotes >= request.requiredVotes) {
          status = "rejected"; message = `Rejected with ${rejectVotes} votes`;
        } else {
          message = `Voting: ${approveVotes} approve, ${rejectVotes} reject (need ${request.requiredVotes})`;
        }
        break;
      }

      case "majority": {
        if (approveVotes >= request.requiredVotes) {
          approved = true; status = "approved"; message = "Majority approved";
        } else if (rejectVotes >= request.requiredVotes) {
          status = "rejected"; message = "Majority rejected";
        } else {
          message = `Need ${request.requiredVotes} votes for majority`;
        }
        break;
      }

      case "percentage": {
        if (percentage >= request.requiredPercentage) {
          approved = true; status = "approved"; message = `${percentage}% approved (threshold: ${request.requiredPercentage}%)`;
        } else {
          message = `${percentage}% approved (need ${request.requiredPercentage}%)`;
        }
        break;
      }

      // Override/emergency modes
      case "ceo_override":
      case "coo_override":
      case "emergency": {
        if (approveVotes >= 1) { approved = true; status = "approved"; message = "Override approved"; }
        break;
      }

      case "auto_approve": {
        approved = true; status = "approved"; message = "Auto-approved by rule";
        break;
      }

      case "auto_reject": {
        status = "rejected"; message = "Auto-rejected by rule";
        break;
      }
    }

    // Check deadline
    if (status === "pending" && Date.now() > request.deadline) {
      status = "timed_out";
      message = "Approval deadline exceeded";
    }

    return {
      approved,
      status,
      mode: request.mode,
      votesReceived: totalVotes,
      totalRequired: request.requiredVotes,
      percentage,
      escalated: request.status === "escalated",
      nextApprover: status === "pending" ? request.approvers[request.currentApproverIndex] : undefined,
      message,
    };
  }

  /** CEO Override — bypass all approvals */
  ceoOverride(requestId: string, reason: string): ApprovalResult | null {
    const request = this.requests.get(requestId);
    if (!request) return null;
    request.status = "approved";
    request.overrideBy = "ceo";
    request.overrideReason = reason;
    request.updatedAt = Date.now();
    return {
      approved: true, status: "approved", mode: "ceo_override",
      votesReceived: request.votes.length, totalRequired: request.requiredVotes,
      percentage: 100, escalated: false, message: `CEO override: ${reason}`,
    };
  }

  /** COO Override */
  cooOverride(requestId: string, reason: string): ApprovalResult | null {
    const request = this.requests.get(requestId);
    if (!request) return null;
    request.status = "approved";
    request.overrideBy = "coo";
    request.overrideReason = reason;
    request.updatedAt = Date.now();
    return {
      approved: true, status: "approved", mode: "coo_override",
      votesReceived: request.votes.length, totalRequired: request.requiredVotes,
      percentage: 100, escalated: false, message: `COO override: ${reason}`,
    };
  }

  /** Get an approval request */
  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  /** List approval requests */
  listRequests(filters?: {
    status?: ApprovalStatus;
    entityType?: string;
    entityId?: string;
    requestedBy?: string;
    approverId?: string;
  }): ApprovalRequest[] {
    let list = Array.from(this.requests.values());
    if (filters?.status) list = list.filter((r) => r.status === filters.status);
    if (filters?.entityType) list = list.filter((r) => r.entityType === filters.entityType);
    if (filters?.entityId) list = list.filter((r) => r.entityId === filters.entityId);
    if (filters?.requestedBy) list = list.filter((r) => r.requestedBy === filters.requestedBy);
    if (filters?.approverId) {
      list = list.filter((r) => r.approvers.some((a) => a.userId === filters.approverId));
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Get stats */
  getStats(): { pending: number; approved: number; rejected: number; escalated: number; timedOut: number; total: number } {
    const all = Array.from(this.requests.values());
    return {
      pending: all.filter((r) => r.status === "pending").length,
      approved: all.filter((r) => r.status === "approved").length,
      rejected: all.filter((r) => r.status === "rejected").length,
      escalated: all.filter((r) => r.status === "escalated").length,
      timedOut: all.filter((r) => r.status === "timed_out").length,
      total: all.length,
    };
  }

  private calculatePercentage(request: ApprovalRequest): number {
    const total = request.approvers.length;
    if (total === 0) return 0;
    const approveVotes = request.votes.filter((v) => v.action === "approve").length;
    return Math.round((approveVotes / total) * 100);
  }

  /** Reset (for testing) */
  reset(): void {
    this.requests.clear();
  }
}

export const approvalEngine = new ApprovalEngineImpl();
