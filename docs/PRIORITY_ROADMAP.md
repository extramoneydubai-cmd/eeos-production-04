# EEOS Priority Roadmap

**Generated:** 2026-07-29  

---

## Week 1-2: Stabilization (P0)

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P0 | Fix duplicate "Tools" header in sidebar | 5 min | Platform |
| P0 | Remove leftover scripts and tmp directory | 5 min | Platform |
| P0 | Set package.json version to 1.0.0-beta | 1 min | Platform |
| P0 | Remove unused dependencies (next-themes) | 5 min | Platform |
| P0 | Persist SchedulingSLA to Convex | 4 hours | Scheduling |
| P0 | Persist SchedulingAutomation to Convex | 4 hours | Scheduling |
| P0 | Persist EscalationEngine to Convex | 2 hours | Support |
| P0 | Persist KnowledgeBaseEngine to Convex | 3 hours | Support |
| P0 | Persist SecurityEngine events to Convex | 4 hours | Security |

## Week 2-3: Quality Infrastructure (P1)

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P1 | Install vitest + React Testing Library | 30 min | Platform |
| P1 | Write smoke tests for all routes (130+ pages) | 4 hours | Platform |
| P1 | Write auth flow tests | 2 hours | Platform |
| P1 | Create GitHub Actions CI workflow | 2 hours | DevOps |
| P1 | Create GitHub Actions deploy workflow | 2 hours | DevOps |
| P1 | Extract mock data into single mock layer | 2 hours | Platform |
| P1 | Split main.tsx into modules | 3 hours | Platform |
| P1 | Add build version display in footer/settings | 1 hour | Platform |

## Week 3-4: Business Module Completion (P1)

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P1 | Complete Finance: GST Filing | 2 days | Finance |
| P1 | Complete Finance: Fee Receipts | 1 day | Finance |
| P1 | Complete Finance: Refund Workflow UI | 2 days | Finance |
| P1 | Complete Finance: PDC Management | 2 days | Finance |
| P1 | Complete CRM: Sales Quotation Automation | 1 day | CRM |
| P1 | Add Content Security Policy | 1 hour | Platform |
| P1 | Connect real Convex data to Security Center | 2 days | Security |

## Week 4-5: High-Value Features (P2)

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P2 | Marketing Automation (trigger-based campaigns) | 3 days | Marketing |
| P2 | Attendance & Leave Integration with Scheduling | 2 days | HR/Scheduling |
| P2 | Student Portal (self-service view) | 3 days | Student |
| P2 | Calendar Sync (ICS export) | 1 day | Platform |
| P2 | SMS Gateway Integration | 1 day | Communication |
| P2 | Email Service Integration | 1 day | Communication |

## Week 5-6: Enterprise Readiness (P2)

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P2 | Payroll Processing | 3 days | Finance/HR |
| P2 | Performance Review Workflow | 2 days | HR |
| P2 | Visitor Management | 2 days | Operations |
| P2 | Transport Management | 2 days | Operations |
| P2 | Multi-tenant data isolation hardening | 3 days | Platform |

## Week 6-8: Long-Term (P3)

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P3 | Hostel Management | 3 days | Operations |
| P3 | Library Management | 3 days | Operations |
| P3 | Certificate Generation | 2 days | Academic |
| P3 | Dark Mode | 2 days | Platform |
| P3 | Storybook Component Library | 5 days | Platform |
| P3 | Mobile App (PWA) | 5 days | Platform |
| P3 | i18n Internationalization | 5 days | Platform |

---

## Timeline Summary

```
Week 1-2:  ████████████████░░░░  Stabilization (P0)
Week 2-3:  ████████████████░░░░  Quality Infrastructure (P1)  
Week 3-4:  ████████████████░░░░  Module Completion (P1)
Week 4-5:  ██████████░░░░░░░░░░  High-Value Features (P2)
Week 5-6:  ██████████░░░░░░░░░░  Enterprise Readiness (P2)
Week 6-8:  ██████░░░░░░░░░░░░░░  Long-Term (P3)

Total: 8 weeks to complete P0 and P1 milestones
       12 weeks to reach production v1.0
```

---

## Key Dependencies

```
Fix Immediate Issues (Phase 1)
    ↓
Testing Infrastructure (Phase 2) ──→ CI/CD Pipeline (Phase 3)
    ↓                                        ↓
Engine Persistence (Phase 4)         Automated Deployments
    ↓
Module Completion (new features)
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Convex schema migration issues | Medium | High | Test migrations on staging first |
| Mock data → real data gaps | High | Medium | Phase mock removal slowly |
| Third-party integration delays | Medium | High | Start with SMTP/SMS, defer complex |
| Performance regression | Low | High | Add performance tests early |
