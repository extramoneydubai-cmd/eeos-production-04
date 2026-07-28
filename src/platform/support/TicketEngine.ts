/**
 * TicketEngine — Advanced Ticket Operations
 *
 * Search, bulk operations, comments, timeline events,
 * auto-assignment (round-robin, skill-based, keyword routing),
 * duplicate detection, merge/split tickets.
 */

import { supportEngine, type Ticket } from "./SupportEngine";

// ─── Comment ──────────────────────────────────────────────────────

export interface TicketComment {
  id: string;
  ticketId: string;
  body: string;
  type: "comment" | "note" | "internal_note" | "resolution" | "system";
  isInternal?: boolean;
  authorId?: string;
  authorName?: string;
  authorType?: "agent" | "requester" | "system";
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  ticketId: string;
  eventType: string;
  description: string;
  actorId?: string;
  actorName?: string;
  timestamp: number;
}

// ─── Engine ───────────────────────────────────────────────────────

class TicketEngineImpl {
  private comments: Map<string, TicketComment[]> = new Map();
  private timeline: Map<string, TimelineEvent[]> = new Map();
  private agentQueue: string[] = [];  // For round-robin assignment
  private agentIndex = 0;

  // ─── Comments ───────────────────────────────────────────────

  addComment(params: {
    ticketId: string;
    body: string;
    type?: TicketComment["type"];
    isInternal?: boolean;
    authorId?: string;
    authorName?: string;
    authorType?: TicketComment["authorType"];
  }): TicketComment {
    const comment: TicketComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ticketId: params.ticketId,
      body: params.body,
      type: params.type || "comment",
      isInternal: params.isInternal,
      authorId: params.authorId,
      authorName: params.authorName,
      authorType: params.authorType || "agent",
      createdAt: Date.now(),
    };

    const existing = this.comments.get(params.ticketId) || [];
    existing.push(comment);
    this.comments.set(params.ticketId, existing);

    return comment;
  }

  getComments(ticketId: string): TicketComment[] {
    return (this.comments.get(ticketId) || []).sort((a, b) => a.createdAt - b.createdAt);
  }

  // ─── Timeline ───────────────────────────────────────────────

  addTimelineEvent(params: {
    ticketId: string;
    eventType: string;
    description: string;
    actorId?: string;
    actorName?: string;
  }): TimelineEvent {
    const event: TimelineEvent = {
      id: `tl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ticketId: params.ticketId,
      eventType: params.eventType,
      description: params.description,
      actorId: params.actorId,
      actorName: params.actorName,
      timestamp: Date.now(),
    };

    const existing = this.timeline.get(params.ticketId) || [];
    existing.push(event);
    this.timeline.set(params.ticketId, existing);

    return event;
  }

  getTimeline(ticketId: string): TimelineEvent[] {
    return (this.timeline.get(ticketId) || []).sort((a, b) => b.timestamp - a.timestamp);
  }

  // ─── Auto-Assignment ────────────────────────────────────────

  /** Round-robin assignment from a pool of agent IDs */
  roundRobinAssign(agentIds: string[]): string {
    if (agentIds.length === 0) return "";
    this.agentQueue = agentIds;
    const agent = agentIds[this.agentIndex % agentIds.length];
    this.agentIndex++;
    return agent;
  }

  /** Keyword-based routing: match ticket title/description to agent skills */
  keywordRoute(title: string, description: string | undefined, agentSkills: Record<string, string[]>): string | null {
    const text = `${title} ${description || ""}`.toLowerCase();
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [agentId, keywords] of Object.entries(agentSkills)) {
      const score = keywords.reduce((s, kw) => s + (text.includes(kw.toLowerCase()) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = agentId;
      }
    }

    return bestMatch;
  }

  /** Department routing: map ticket type to department */
  departmentRoute(ticketType: string, departmentMap: Record<string, string>): string | null {
    return departmentMap[ticketType] || null;
  }

  // ─── Duplicate Detection ────────────────────────────────────

  findDuplicates(ticket: Partial<Ticket>, existingTickets: Ticket[]): Ticket[] {
    const title = ticket.title?.toLowerCase() || "";
    const requesterId = ticket.requesterId;

    return existingTickets.filter((t) => {
      if (t._id === (ticket as any)._id) return false;
      if (t.status === "closed" || t.status === "cancelled") return false;

      // Same requester + similar title
      if (requesterId && t.requesterId === requesterId) {
        const tTitle = t.title.toLowerCase();
        if (tTitle.includes(title) || title.includes(tTitle)) return true;
      }

      // Same type + same requester within 7 days
      if (t.type === ticket.type && t.requesterId === requesterId) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Math.abs(t.createdAt - Date.now()) < sevenDays) return true;
      }

      return false;
    });
  }

  /** Merge two tickets into the target ticket */
  mergeTickets(targetId: string, sourceId: string): boolean {
    const target = supportEngine.getTicket(targetId);
    const source = supportEngine.getTicket(sourceId);
    if (!target || !source) return false;

    // Merge comments
    const sourceComments = this.comments.get(sourceId) || [];
    const targetComments = this.comments.get(targetId) || [];
    this.comments.set(targetId, [...targetComments, ...sourceComments.map((c) => ({ ...c, ticketId: targetId }))]);

    // Merge timeline
    const sourceTimeline = this.timeline.get(sourceId) || [];
    const targetTimeline = this.timeline.get(targetId) || [];
    this.timeline.set(targetId, [...targetTimeline, ...sourceTimeline.map((e) => ({ ...e, ticketId: targetId }))]);

    // Mark source as merged
    supportEngine.updateTicket(sourceId, {
      status: "cancelled",
      isMerged: true,
      mergedInto: targetId,
    });

    this.addTimelineEvent({
      ticketId: targetId,
      eventType: "tickets_merged",
      description: `Merged ticket ${source.ticketNumber} into this ticket`,
    });

    return true;
  }

  // ─── Search ─────────────────────────────────────────────────

  searchTickets(query: string, tickets: Ticket[]): Ticket[] {
    const q = query.toLowerCase();
    return tickets.filter((t) =>
      t.ticketNumber.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.requesterName?.toLowerCase().includes(q) ||
      t.requesterEmail?.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
      t.description?.toLowerCase().includes(q)
    );
  }

  // ─── Bulk Operations ────────────────────────────────────────

  bulkUpdate(ticketIds: string[], updates: Partial<Ticket>): number {
    let count = 0;
    for (const id of ticketIds) {
      const updated = supportEngine.updateTicket(id, updates);
      if (updated) count++;
    }
    return count;
  }

  bulkAssign(ticketIds: string[], assignTo: string): number {
    return this.bulkUpdate(ticketIds, { assignedTo: assignTo });
  }

  bulkTransition(ticketIds: string[], newStatus: string): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    for (const id of ticketIds) {
      const result = supportEngine.transitionStatus(id, newStatus);
      if (result.success) success++;
      else failed++;
    }
    return { success, failed };
  }

  /** Reset (for testing) */
  reset(): void {
    this.comments.clear();
    this.timeline.clear();
    this.agentQueue = [];
    this.agentIndex = 0;
  }
}

export const ticketEngine = new TicketEngineImpl();
