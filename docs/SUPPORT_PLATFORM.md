# EEOS Enterprise Service Desk Platform

## Overview

The EEOS Support Platform is a complete Enterprise Service Management (ESM) system comparable to Jira Service Management, ServiceNow, Freshservice, or ManageEngine ServiceDesk. It provides ticket management, SLA enforcement, escalation management, knowledge base, hardware asset tracking, automation, and deep integration with the rest of the EEOS ecosystem.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│  SupportDashboard  AgentDashboard  TicketDatabase       │
│  TicketWorkspace  TicketDatabase (Kanban/Table/Card)     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 Platform Engines                         │
│  SupportEngine  TicketEngine  SLAEngine                  │
│  EscalationEngine  KnowledgeBaseEngine  SupportMetrics   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 Convex Backend                           │
│  15 tables — ticketMaster, ticketComments, ticketSLA,    │
│  knowledgeArticles, ticketAssets, etc.                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              EEOS Platform Integration                   │
│  Workflow Engine  Approval Engine  Event Pipeline       │
│  People Registry  Asset Management  Calendar            │
│  Scheduling  Finance  HR  Operations Center             │
│  Security Audit  Notifications  Communication           │
└─────────────────────────────────────────────────────────┘
```

## Integration Matrix

| EEOS Module | Integration Point | Status |
|-------------|------------------|--------|
| People Registry | Requester lookup, employee/student linking | ✅ Architecture |
| Asset Management | Hardware asset linking (laptop, printer, etc.) | ✅ Architecture |
| Workflow Engine | Ticket approval workflows, auto-assignment | ✅ Architecture |
| Approval Engine | Ticket approval chains (purchase, refund) | ✅ Architecture |
| Scheduling Engine | Maintenance scheduling, field service | ✅ Architecture |
| Calendar | Service calendar, maintenance windows | ✅ Architecture |
| Event Pipeline | Ticket events → timeline, audit, notifications | ✅ Architecture |
| Operations Center | Live queue, ticket KPIs, SLA monitoring | ✅ Architecture |
| Security Audit | Ticket audit trail, permission checks | ✅ Architecture |
| Notifications | Email, SMS, WhatsApp, push on ticket updates | ✅ Architecture |
| Communication | Automated responses, public replies | ✅ Architecture |

## Component Architecture

### Platform Engines (`src/platform/support/`)

| File | Purpose |
|------|---------|
| `SupportEngine.ts` | Core ticket lifecycle — CRUD, status transitions, search, filters, stats |
| `TicketEngine.ts` | Comments, timeline, auto-assignment (round-robin, keyword, department), duplicate detection, merge/split, bulk ops |
| `SLAEngine.ts` | Response/resolution SLA, priority-based policies, business-hours-aware deadlines, escalation chains |
| `EscalationEngine.ts` | Multi-level escalation rules, auto-escalation on SLA breach, escalation history |
| `KnowledgeBaseEngine.ts` | Article CRUD, categories, search, helpful/not-helpful rating, versioning, related ticket suggestions |
| `SupportMetrics.ts` | KPI calculations — FRT, resolution time, CSAT, workload, SLA compliance, queue health |
| `SupportExporter.ts` | CSV/JSON/Markdown export generators |

### UI Pages

| Page | Route | Description |
|------|-------|-------------|
| SupportDashboard | `/support` | Manager view — 8 KPIs, live queue, SLA gauge, workload, escalation stats |
| AgentDashboard | `/support/agent` | Agent view — my tickets, SLA gauge, performance, quick actions |
| TicketDatabase | `/tickets` | 3 views (Table, Kanban, Card), search + filters, bulk ops |
| TicketWorkspace | `/tickets/:ticketId` | 12 tabs (Overview, Conversation, Timeline, SLA, Assets, Knowledge, etc.) |

### Database Schema (`src/convex/schema/support.ts`)

15 tables: ticketMaster, ticketComments, ticketTimeline, ticketAttachments, ticketSLA, ticketAssignments, ticketWatchers, ticketCategories, ticketTemplates, knowledgeArticles, knowledgeCategories, ticketAutomation, ticketApprovals, ticketRatings, ticketAssets

## File Map

```
src/
  convex/schema/support.ts           — Database schema (15 tables)
  platform/support/
    SupportEngine.ts                  — Core engine
    TicketEngine.ts                   — Ticket operations
    SLAEngine.ts                      — SLA management
    EscalationEngine.ts               — Escalation management
    KnowledgeBaseEngine.ts            — Knowledge base
    SupportMetrics.ts                 — KPI calculations
    SupportExporter.ts                — Export utilities
  pages/
    SupportDashboard.tsx              — /support
    AgentDashboard.tsx                — /support/agent
    TicketDatabase.tsx                — /tickets
    TicketWorkspace.tsx               — /tickets/:ticketId
```

## Route Map

| Route | Component | Type | Description |
|-------|-----------|------|-------------|
| `/support` | SupportDashboard | Protected | Manager/team support dashboard |
| `/support/agent` | AgentDashboard | Protected | Agent performance dashboard |
| `/tickets` | TicketDatabase | Protected | Ticket list with 3 views |
| `/tickets/:ticketId` | TicketWorkspace | Protected | Ticket detail workspace |

## Future Roadmap

| Feature | Priority | Status |
|---------|----------|--------|
| Support Dashboard | P1 | ✅ Complete |
| Agent Dashboard | P1 | ✅ Complete |
| Ticket Database (Table/Kanban/Card) | P1 | ✅ Complete |
| Ticket Workspace (12 tabs) | P1 | ✅ Complete |
| SLA Engine | P1 | ✅ Complete |
| Escalation Engine | P1 | ✅ Complete |
| Knowledge Base Engine | P1 | ✅ Complete |
| Support Metrics | P1 | ✅ Complete |
| Hardware Asset Tracking | P2 | ✅ Architecture ready |
| Remote Support Session | P2 | Architecture ready |
| Customer Portal | P2 | Architecture ready |
| Field Service Management | P3 | Architecture ready |
| AI Ticket Suggestions | P3 | Architecture ready |
| Mobile App Support | P3 | Architecture ready |
