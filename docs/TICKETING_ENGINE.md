# EEOS Ticketing Engine

## Overview

The Ticketing Engine is the core of the Service Desk platform. It manages the complete ticket lifecycle from creation through resolution, with support for 32 ticket types, 8 statuses, 4 priority levels, auto-assignment, duplicate detection, merge/split, and bulk operations.

## Ticket Lifecycle

```
Created (new)
    │
    ▼
   open ──────────────────────────────────┐
    │                                      │
    ▼                                      │
in_progress ──── pending ──── open         │
    │                                      │
    ▼                                      │
 resolved                                 │
    │                                      │
    ├── closed                             │
    └── reopened ──── open ────────────────┘
    
    Any status → cancelled
    cancelled → reopened
```

## Status Transitions

| Current | Allowed Transitions |
|---------|-------------------|
| `new` | open, cancelled |
| `open` | in_progress, pending, cancelled |
| `in_progress` | resolved, pending, open, cancelled |
| `pending` | in_progress, open, resolved, cancelled |
| `resolved` | closed, reopened |
| `closed` | reopened |
| `reopened` | open, in_progress |
| `cancelled` | reopened |

## Ticket Types (32)

### Hardware & IT
| ID | Label | Color |
|----|-------|-------|
| `hardware` | Hardware | `#e8710a` |
| `software` | Software | `#a855f7` |
| `network` | Network | `#06b6d4` |
| `internet` | Internet | `#14b8a6` |
| `printer` | Printer | `#5f6368` |
| `laptop` | Laptop | `#4285f4` |
| `biometric` | Biometric | `#34a853` |
| `face_attendance` | Face Attendance | `#1a73e8` |

### People & Support
| ID | Label | Color |
|----|-------|-------|
| `support` | Support | `#4285f4` |
| `student` | Student | `#a855f7` |
| `parent` | Parent | `#ec4899` |
| `faculty` | Faculty | `#1557b0` |

### Finance
| ID | Label | Color |
|----|-------|-------|
| `finance` | Finance | `#34a853` |
| `gst` | GST | `#f59e0b` |
| `fee` | Fee | `#ea4335` |
| `refund` | Refund | `#e8710a` |
| `pdc_bounce` | PDC Bounce | `#dc2626` |

### Procurement & Vendor
| ID | Label | Color |
|----|-------|-------|
| `procurement` | Procurement | `#5f6368` |
| `vendor` | Vendor | `#9aa0a6` |

### Academic
| ID | Label | Color |
|----|-------|-------|
| `academic` | Academic | `#a855f7` |
| `examination` | Examination | `#ea4335` |
| `lms` | LMS | `#1a73e8` |

### Digital
| ID | Label | Color |
|----|-------|-------|
| `website` | Website | `#06b6d4` |
| `mobile_app` | Mobile App | `#14b8a6` |

### Security & Access
| ID | Label | Color |
|----|-------|-------|
| `security` | Security | `#dc2626` |
| `access` | Access | `#f59e0b` |

### Facility & Services
| ID | Label | Color |
|----|-------|-------|
| `facility` | Facility | `#e8710a` |
| `transport` | Transport | `#4285f4` |
| `hostel` | Hostel | `#a855f7` |
| `library` | Library | `#34a853` |
| `custom` | Custom | `#9aa0a6` |

## Priority Levels

| Level | Color | Response SLA | Resolution SLA |
|-------|-------|-------------|---------------|
| `critical` | `#dc2626` | 15 min | 2 hours |
| `high` | `#ea4335` | 30 min | 4 hours |
| `medium` | `#fbbc04` | 1 hour | 8 hours |
| `low` | `#34a853` | 2 hours | 24 hours |

## API Reference

### SupportEngine

```typescript
// Create a new ticket
supportEngine.createTicket({
  title: string,
  description?: string,
  type: string,         // One of 32 ticket types
  priority?: string,    // low | medium | high | critical
  requesterName?: string,
  requesterEmail?: string,
  assignedTo?: string,
  branchId?: string,
  tags?: string[],
}) => string           // Returns ticket ID

// Update ticket fields
supportEngine.updateTicket(id: string, updates: Partial<Ticket>) => Ticket | undefined

// Transition status with validation
supportEngine.transitionStatus(id: string, newStatus: string) => { success: boolean; message: string }

// Assign ticket
supportEngine.assignTicket(id: string, assignTo: string) => Ticket | undefined

// Get single ticket
supportEngine.getTicket(id: string) => Ticket | undefined

// List tickets with filters
supportEngine.listTickets(filters?: {
  status?: string, priority?: string, type?: string,
  assignedTo?: string, branchId?: string, search?: string,
  slaBreached?: boolean, isEscalated?: boolean,
}) => Ticket[]

// Stats
supportEngine.getStatusCounts() => Record<string, number>
supportEngine.getSLAStats() => { total, breached, withinSLA, complianceRate }
supportEngine.getEscalationStats() => { total, escalated, escalationRate }
```

### TicketEngine

```typescript
// Add comment
ticketEngine.addComment({
  ticketId: string,
  body: string,
  type?: "comment" | "note" | "internal_note" | "resolution",
  isInternal?: boolean,
  authorName?: string,
}) => TicketComment

// Get comments
ticketEngine.getComments(ticketId: string) => TicketComment[]

// Add timeline event
ticketEngine.addTimelineEvent({
  ticketId: string,
  eventType: string,
  description: string,
  actorName?: string,
}) => TimelineEvent

// Get timeline
ticketEngine.getTimeline(ticketId: string) => TimelineEvent[]

// Auto-assignment (round-robin)
ticketEngine.roundRobinAssign(agentIds: string[]) => string

// Keyword-based routing
ticketEngine.keywordRoute(title: string, description: string | undefined, agentSkills: Record<string, string[]>) => string | null

// Department routing
ticketEngine.departmentRoute(ticketType: string, departmentMap: Record<string, string>) => string | null

// Duplicate detection
ticketEngine.findDuplicates(ticket: Partial<Ticket>, existing: Ticket[]) => Ticket[]

// Merge tickets
ticketEngine.mergeTickets(targetId: string, sourceId: string) => boolean

// Search tickets
ticketEngine.searchTickets(query: string, tickets: Ticket[]) => Ticket[]

// Bulk operations
ticketEngine.bulkUpdate(ticketIds: string[], updates: Partial<Ticket>) => number
ticketEngine.bulkAssign(ticketIds: string[], assignTo: string) => number
ticketEngine.bulkTransition(ticketIds: string[], newStatus: string) => { success: number; failed: number }
```

## Ticket Numbering

Tickets are automatically numbered in the format:
```
SVC-{YEAR}-{SEQUENCE}
```
Example: `SVC-2026-0001`

## Auto-Assignment Strategies

### Round-Robin
Distributes tickets evenly across available agents:
```typescript
ticketEngine.roundRobinAssign(["agent_1", "agent_2", "agent_3"])
// Returns next agent in sequence
```

### Keyword Routing
Matches ticket title/description to agent skills:
```typescript
ticketEngine.keywordRoute("Printer not working", "HP LaserJet offline", {
  "agent_1": ["printer", "hardware", "network"],
  "agent_2": ["software", "email", "account"],
})
// Returns "agent_1" (score: 2)
```

### Department Routing
Maps ticket type to department:
```typescript
ticketEngine.departmentRoute("hardware", {
  "hardware": "it_support",
  "finance": "finance_team",
})
// Returns "it_support"
```

## Duplicate Detection

Detection logic:
1. Same requester + similar title (case-insensitive contains match)
2. Same type + same requester within 7 days
3. Excludes closed/cancelled tickets

## Merge / Split

- Merge: Combines comments and timeline from source into target ticket
- Source ticket is marked as merged and cancelled
- Timeline event recorded on target
