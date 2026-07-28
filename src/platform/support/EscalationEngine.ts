/**
 * EscalationEngine — Enterprise Ticket Escalation Engine
 *
 * Multi-level escalation chains, auto-escalation on SLA breach,
 * manual escalation by agents, escalation rules by priority/type.
 * Integrates with Notification Platform.
 */

export interface EscalationLevel {
  level: number;
  name: string;           // L1 Support, L2 Support, L3 Support, Management
  notifyRoles: string[];
  notifyUsers?: string[];
  maxWaitMinutes: number;
  actions: ("notify" | "reassign" | "override" | "emergency")[];
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    priorities?: string[];
    types?: string[];
    statuses?: string[];
    minAgeMinutes?: number;
    noResponse?: boolean;
    requesterVip?: boolean;
    requesterType?: string;
  };
  levels: EscalationLevel[];
  isActive: boolean;
}

export interface EscalationState {
  ticketId: string;
  currentLevel: number;
  escalatedAt: number;
  escalatedBy?: string;
  escalatedReason?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  history: { level: number; timestamp: number; action: string; actor?: string; note?: string }[];
}

const ESCALATION_RULES: EscalationRule[] = [
  {
    id: "default_escalation",
    name: "Default Escalation Chain",
    conditions: { statuses: ["new", "open", "in_progress"] },
    isActive: true,
    levels: [
      { level: 1, name: "L1 → L2 Support", notifyRoles: ["support_l2", "support_manager"], maxWaitMinutes: 60, actions: ["notify", "reassign"] },
      { level: 2, name: "L2 → L3 Support", notifyRoles: ["support_l3", "department_head"], maxWaitMinutes: 120, actions: ["notify", "reassign"] },
      { level: 3, name: "L3 → Management", notifyRoles: ["director", "ceo"], maxWaitMinutes: 240, actions: ["notify", "reassign", "override"] },
    ],
  },
  {
    id: "critical_escalation",
    name: "Critical Priority Escalation",
    conditions: { priorities: ["critical"], minAgeMinutes: 30 },
    isActive: true,
    levels: [
      { level: 1, name: "Critical → Manager", notifyRoles: ["support_manager", "it_manager"], maxWaitMinutes: 15, actions: ["notify", "reassign"] },
      { level: 2, name: "Manager → Director", notifyRoles: ["director"], maxWaitMinutes: 30, actions: ["notify", "reassign", "override"] },
      { level: 3, name: "Director → CEO", notifyRoles: ["ceo"], maxWaitMinutes: 60, actions: ["notify", "emergency"] },
    ],
  },
];

class EscalationEngineImpl {
  private rules: Map<string, EscalationRule> = new Map();
  private states: Map<string, EscalationState> = new Map();

  constructor() {
    ESCALATION_RULES.forEach((r) => this.rules.set(r.id, r));
  }

  registerRule(rule: EscalationRule): void {
    this.rules.set(rule.id, rule);
  }

  getApplicableRules(ticket: { priority?: string; type?: string; status?: string; createdAt: number }): EscalationRule[] {
    return Array.from(this.rules.values()).filter((rule) => {
      if (!rule.isActive) return false;
      const c = rule.conditions;
      if (c.priorities?.length && !c.priorities.includes(ticket.priority || "")) return false;
      if (c.types?.length && !c.types.includes(ticket.type || "")) return false;
      if (c.statuses?.length && !c.statuses.includes(ticket.status || "")) return false;
      if (c.minAgeMinutes && Date.now() - ticket.createdAt < c.minAgeMinutes * 60000) return false;
      return true;
    });
  }

  escalate(ticketId: string, reason: string, escalatedBy?: string): EscalationState {
    let state = this.states.get(ticketId);
    if (!state) {
      state = { ticketId, currentLevel: 0, escalatedAt: Date.now(), escalatedBy, escalatedReason: reason, history: [] };
    }

    state.currentLevel++;
    state.escalatedAt = Date.now();
    state.escalatedBy = escalatedBy;
    state.escalatedReason = reason;
    state.history.push({ level: state.currentLevel, timestamp: Date.now(), action: "escalated", actor: escalatedBy, note: reason });
    this.states.set(ticketId, state);
    return state;
  }

  resolve(ticketId: string, resolvedBy?: string): void {
    const state = this.states.get(ticketId);
    if (state) {
      state.resolvedAt = Date.now();
      state.resolvedBy = resolvedBy;
      state.history.push({ level: state.currentLevel, timestamp: Date.now(), action: "resolved", actor: resolvedBy });
    }
  }

  getState(ticketId: string): EscalationState | undefined {
    return this.states.get(ticketId);
  }

  /** Auto-check all tickets for escalation */
  autoCheck(tickets: { id: string; priority?: string; type?: string; status?: string; createdAt: number }[]): string[] {
    const escalated: string[] = [];
    for (const ticket of tickets) {
      const applicable = this.getApplicableRules(ticket);
      if (applicable.length > 0) {
        const state = this.states.get(ticket.id);
        const ageMinutes = (Date.now() - ticket.createdAt) / 60000;
        for (const rule of applicable) {
          for (const level of rule.levels) {
            if ((!state || level.level > state.currentLevel) && ageMinutes >= level.maxWaitMinutes) {
              escalated.push(ticket.id);
              this.escalate(ticket.id, `Auto-escalated: ${level.name}`, "system");
              break;
            }
          }
        }
      }
    }
    return escalated;
  }

  getStats(): { total: number; active: number; resolved: number; levels: Record<number, number> } {
    const all = Array.from(this.states.values());
    const levels: Record<number, number> = {};
    all.forEach((s) => { levels[s.currentLevel] = (levels[s.currentLevel] || 0) + 1; });
    return {
      total: all.length,
      active: all.filter((s) => !s.resolvedAt).length,
      resolved: all.filter((s) => s.resolvedAt).length,
      levels,
    };
  }

  reset(): void {
    this.states.clear();
  }
}

export const escalationEngine = new EscalationEngineImpl();
