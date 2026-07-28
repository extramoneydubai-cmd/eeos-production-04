# EEOS Service Level Agreement (SLA) Engine

## Overview

The SLA Engine enforces response and resolution time commitments across all support tickets. It supports priority-based SLA policies, business-hours-aware deadline calculations, weekend/holiday exclusion, auto-escalation chains, and compliance rate tracking.

## SLA Policies by Priority

| Priority | Policy ID | Response SLA | Resolution SLA | Escalation After | Working Hours | Weekends | Holidays |
|----------|-----------|-------------|---------------|------------------|---------------|----------|----------|
| **Critical** | `critical` | 15 min | 2 hours | 30 min | 24/7 | Included | Included |
| **High** | `high` | 30 min | 4 hours | 60 min | Business hrs | Included | Included |
| **Medium** | `medium` | 1 hour | 8 hours | 2 hours | Business hrs | Excluded | Excluded |
| **Low** | `low` | 2 hours | 24 hours | 6 hours | Business hrs | Excluded | Excluded |

## Deadline Calculation

### Business Hours
- Working hours: 8:00 AM — 6:00 PM (configurable)
- Minutes outside business hours are NOT counted toward SLA
- Business-hours-only policies: `high`, `medium`, `low`

### Weekend Exclusion
- `medium` and `low` priorities exclude Saturday and Sunday
- `high` includes weekends
- `critical` operates 24/7

### Holiday Exclusion
- Custom holiday calendar via `setSupportHolidays(dates: number[])`
- `medium` and `low` priorities exclude holidays
- Holidays are stored as date strings in a Set

### Algorithm
```typescript
function calculateBusinessDeadline(from: number, minutes: number, policy: SLAPolicy): number {
  let current = from;
  let remaining = minutes;
  while (remaining > 0) {
    current += 60000;  // Add 1 minute
    remaining--;
    if (policy.workingHoursOnly && !isBusinessHour(current)) remaining++;
    if (policy.excludeWeekends && isWeekend(current)) remaining++;
    if (policy.excludeHolidays && isHoliday(current)) remaining++;
  }
  return current;
}
```

## Escalation Chains

### Default Escalation
| Level | Name | Timeout | Actions | Notify Roles |
|-------|------|---------|---------|-------------|
| L1 | L1 → L2 Support | 60 min | notify, reassign | support_l2, support_manager |
| L2 | L2 → L3 Support | 120 min | notify, reassign | support_l3, department_head |
| L3 | L3 → Management | 240 min | notify, reassign, override | director, ceo |

### Critical Escalation
| Level | Name | Timeout | Actions | Notify Roles |
|-------|------|---------|---------|-------------|
| L1 | Critical → Manager | 15 min | notify, reassign | support_manager, it_manager |
| L2 | Manager → Director | 30 min | notify, reassign, override | director |
| L3 | Director → CEO | 60 min | notify, emergency | ceo |

## API Reference

### SLAEngine

```typescript
// Register a custom SLA policy
slaEngine.registerPolicy({
  id: string,
  name: string,
  priority: string,
  responseMinutes: number,
  resolutionMinutes: number,
  escalationMinutes: number,
  workingHoursOnly: boolean,
  excludeWeekends: boolean,
  excludeHolidays: boolean,
  autoEscalate: boolean,
  escalationLevels: { level: number; afterMinutes: number; notifyRoles: string[] }[],
});

// Calculate deadlines for a ticket
slaEngine.calculateDeadlines(priority: string, startTime: number)
  => { responseDueAt: number; resolutionDueAt: number }

// Check SLA status for a ticket
slaEngine.checkSLA(
  ticketId: string,
  priority: string,
  createdAt: number,
  firstResponseAt?: number,
  resolvedAt?: number,
) => SLAStatus

// Record first response
slaEngine.recordFirstResponse(ticketId: string, timestamp: number): void

// Record resolution
slaEngine.recordResolution(ticketId: string, timestamp: number): void

// Get SLA status
slaEngine.getSLAStatus(ticketId: string) => SLAStatus | undefined

// Get compliance stats
slaEngine.getComplianceStats() => { total: number; met: number; breached: number; complianceRate: number }

// Set holidays
setSupportHolidays(dates: number[]): void
```

### EscalationEngine

```typescript
// Register an escalation rule
escalationEngine.registerRule({
  id: string,
  name: string,
  conditions: { priorities?: string[]; types?: string[]; statuses?: string[]; minAgeMinutes?: number; },
  levels: EscalationLevel[],
  isActive: boolean,
});

// Manually escalate a ticket
escalationEngine.escalate(ticketId: string, reason: string, escalatedBy?: string) => EscalationState

// Resolve an escalation
escalationEngine.resolve(ticketId: string, resolvedBy?: string): void

// Get escalation state
escalationEngine.getState(ticketId: string) => EscalationState | undefined

// Auto-check all tickets
escalationEngine.autoCheck(tickets: Ticket[]) => string[]  // Returns escalated ticket IDs

// Get stats
escalationEngine.getStats() => { total: number; active: number; resolved: number; levels: Record<number, number> }
```

### SupportMetrics

```typescript
calculateMetrics() => {
  overview: {
    totalTickets: number,
    openTickets: number,
    resolvedToday: number,
    reopenedCount: number,
    reopenedRate: number,
    avgFirstReponseMinutes: number,
    avgResolutionHours: number,
    avgCsat: number,
  },
  sla: { total: number; met: number; breached: number; complianceRate: number },
  statusDistribution: Record<string, number>,
  agentWorkloads: AgentWorkload[],
  queueHealth: {
    waitingForResponse: number,
    overdue: number,
    slasAtRisk: number,
  },
}
```

## SLA Status Types

| Status | Description |
|--------|-------------|
| `within_sla` | Ticket is within SLA deadlines |
| `approaching` | Ticket is within 20% of SLA deadline |
| `breached` | SLA deadline has passed |
| `escalated` | Escalation chain has been triggered |
| `met` | SLA has been met (ticket resolved/responded) |

## SLA Compliance Scoring

Compliance rate is calculated as:
```
complianceRate = (total - breached) / total * 100
```

Where:
- `total` = tickets with SLA policies assigned
- `breached` = tickets where response or resolution exceeded deadline

## Dashboard Integration

SLA data is displayed in:
- **SupportDashboard** (`/support`): SLA gauge, compliance rate KPI, breach count
- **AgentDashboard** (`/support/agent`): Personal SLA gauge, at-risk ticket filter
- **TicketWorkspace** (`/tickets/:id`): Response SLA, Resolution SLA, breach count, escalation level
- **TicketDatabase** (`/tickets`): SLA breach badge on tickets, SLA risk filter
