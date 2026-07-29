# EEOS Pending Features

**Generated:** 2026-07-29  

---

This document lists every feature that is not yet implemented or is only partially implemented.

---

## Business Modules

| Module | Feature | Status | Priority |
|--------|---------|--------|----------|
| **Marketing** | Marketing Automation Engine | Not started | P1 |
| **Marketing** | Campaign Workflow (multi-step automated campaigns) | Not started | P1 |
| **Marketing** | Lead Scoring Automation (trigger-based) | Partial | P1 |
| **Production** | Production Management | Not started | P3 |
| **Production** | Manufacturing/Assembly Tracking | Not started | P3 |
| **Finance** | GST Filing Automation | Partial | P1 |
| **Finance** | Fee Receipt Generation (automatic) | Not started | P1 |
| **Finance** | Refund Workflow (full lifecycle) | Engine exists, UI partial | P1 |
| **Finance** | PDC Management / Cheque Bounce Workflow | Not started | P1 |
| **Finance** | Payroll Processing | Workflow template exists | P2 |
| **Finance** | Budget Management | Not started | P2 |
| **HR** | Payroll Automation | Workflow template exists | P2 |
| **HR** | Attendance & Leave Integration | Partial | P1 |
| **HR** | Performance Review Workflow | Not started | P2 |
| **Operations** | Visitor Management | Not started | P2 |
| **Operations** | Transport Management (bus routes, tracking) | Not started | P2 |
| **Operations** | Hostel Management | Not started | P2 |
| **Operations** | Library Management | Not started | P2 |
| **Operations** | Certificate Generation (digital) | Not started | P2 |
| **Compliance** | Compliance Reporting Dashboard | Partial (mock data) | P1 |
| **Student** | Student Portal (self-service) | Not started | P2 |
| **Student** | Parent Portal | Not started | P2 |
| **Student** | Mobile App | Not started | P3 |
| **Sales** | Sales Quotation Automation | Partial | P1 |
| **LMS** | Content Authoring & Versioning | Not started | P2 |
| **LMS** | Learning Paths & Curriculum Builder | Not started | P2 |
| **LMS** | SCORM/xAPI Support | Not started | P3 |
| **Academic** | Course Scheduling with Conflict Detection | ✅ Done via Scheduling | N/A |

---

## Platform Capabilities

| Feature | Status | Priority |
|---------|--------|----------|
| **CI/CD Pipeline** (GitHub Actions) | Not started | P1 |
| **Unit Test Suite** | Not started | P1 |
| **E2E Tests** | Not started | P2 |
| **Storybook / Component Library** | Not started | P3 |
| **Internationalization (i18n)** | Not started | P3 |
| **Dark Mode** | Disabled in config | P3 |
| **PWA / Offline Support** | Not started | P3 |
| **Multi-tenant data isolation** | Partial (org scoping exists) | P1 |
| **Rate Limiting** | Not implemented | P2 |
| **Content Security Policy** | Not configured | P1 |
| **Automatic Backups** | Not started | P1 |
| **Disaster Recovery Scripts** | Not started | P1 |
| **Preview/Staging Environments** | Not started | P2 |
| **Performance Monitoring** | In-browser metrics only | P2 |
| **Error Tracking Integration** (Sentry) | Not integrated | P2 |

---

## Integration/API Features

| Feature | Status | Priority |
|---------|--------|----------|
| **REST API** (for external apps) | Not started | P2 |
| **Webhook Subscriptions** | Not started | P2 |
| **Google Calendar Sync** | Architecture ready, not wired | P3 |
| **Outlook Calendar Sync** | Architecture ready, not wired | P3 |
| **Payment Gateway Integration** | Not started | P1 |
| **SMS Gateway** | WhatsApp engine exists, SMS partial | P1 |
| **Email Service** (Transactional) | Not started | P1 |
| **Slack / Teams Integration** | Not started | P3 |

---

## Documentation Gaps

| Document | Status |
|----------|--------|
| User Manual | Not started |
| Admin Guide | Not started |
| API Documentation | Partial (docs/ exists for core) |
| Deployment Guide | Partial (PATCH docs exist) |
| Developer Onboarding Guide | Not started |
| Architecture Decision Records | Not started |

---

## Estimated Effort

| Category | Features | Est. Effort |
|----------|----------|-------------|
| **P1 - Critical** | 15 features | 8-10 weeks |
| **P2 - High** | 18 features | 10-14 weeks |
| **P3 - Medium** | 8 features | 4-6 weeks |
| **Total** | **~41 features** | **22-30 weeks** |

---

## Recommendations

1. **Complete Finance workflows** (GST, Refund, PDC, Fee Receipts) — these are critical for client demos
2. **CI/CD + Test Suite** — essential for development velocity and quality
3. **Marketing Automation** — opens new client segments
4. **Student/Parent Portal** — high value for end-user experience
