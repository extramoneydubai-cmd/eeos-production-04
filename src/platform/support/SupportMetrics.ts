/**
 * SupportMetrics — Enterprise Support Performance Metrics
 *
 * KPIs: open tickets, avg first response, avg resolution time,
 * CSAT score, workload per agent, SLA compliance, queue health, reopened rate
 */

import { supportEngine } from "./SupportEngine";
import { slaEngine } from "./SLAEngine";
import { ticketEngine } from "./TicketEngine";

interface AgentWorkload {
  agentId: string;
  assignedCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedToday: number;
}

export function calculateMetrics() {
  const tickets = supportEngine.listTickets();
  const slaStats = slaEngine.getComplianceStats();
  const statusCounts = supportEngine.getStatusCounts();

  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const openTickets = tickets.filter((t) => ["new", "open", "in_progress", "pending"].includes(t.status));
  const resolvedToday = tickets.filter((t) => t.resolvedAt && t.resolvedAt >= todayStart.getTime());
  const reopened = tickets.filter((t) => (t.reopenedCount || 0) > 0);

  // Average first response time (for tickets that have one)
  const withResponse = tickets.filter((t) => t.firstResponseAt);
  const avgFirstResponseMs = withResponse.length > 0
    ? withResponse.reduce((s, t) => s + (t.firstResponseAt! - t.createdAt), 0) / withResponse.length
    : 0;

  // Average resolution time
  const resolved = tickets.filter((t) => t.resolvedAt && t.createdAt);
  const avgResolutionMs = resolved.length > 0
    ? resolved.reduce((s, t) => s + (t.resolvedAt! - t.createdAt), 0) / resolved.length
    : 0;

  // CSAT
  const rated = tickets.filter((t) => t.satisfactionRating);
  const avgCsat = rated.length > 0
    ? rated.reduce((s, t) => s + (t.satisfactionRating || 0), 0) / rated.length
    : 0;

  // Agent workload
  const agentWorkloads: Map<string, AgentWorkload> = new Map();
  tickets.forEach((t) => {
    if (t.assignedTo) {
      const w = agentWorkloads.get(t.assignedTo) || { agentId: t.assignedTo, assignedCount: 0, openCount: 0, inProgressCount: 0, resolvedToday: 0 };
      w.assignedCount++;
      if (t.status === "open" || t.status === "new") w.openCount++;
      if (t.status === "in_progress") w.inProgressCount++;
      if (t.resolvedAt && t.resolvedAt >= todayStart.getTime()) w.resolvedToday++;
      agentWorkloads.set(t.assignedTo, w);
    }
  });

  return {
    overview: {
      totalTickets: tickets.length,
      openTickets: openTickets.length,
      resolvedToday: resolvedToday.length,
      reopenedCount: reopened.length,
      reopenedRate: tickets.length > 0 ? Math.round((reopened.length / tickets.length) * 100) : 0,
      avgFirstReponseMinutes: Math.round(avgFirstResponseMs / 60000),
      avgResolutionHours: Math.round(avgResolutionMs / 3600000),
      avgCsat: Math.round(avgCsat * 10) / 10,
    },
    sla: slaStats,
    statusDistribution: statusCounts,
    agentWorkloads: Array.from(agentWorkloads.values()),
    queueHealth: {
      waitingForResponse: tickets.filter((t) => t.status === "pending").length,
      overdue: tickets.filter((t) => t.isOverdue).length,
      slasAtRisk: tickets.filter((t) => {
        if (t.resolutionDueAt && !t.resolvedAt) {
          return Date.now() > t.resolutionDueAt * 0.8;
        }
        return false;
      }).length,
    },
  };
}

export type SupportMetrics = ReturnType<typeof calculateMetrics>;
