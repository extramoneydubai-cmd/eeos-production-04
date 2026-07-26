# EEOS Finance Workspace — Enterprise Financial Intelligence

## Overview

The Finance Workspace provides enterprise-wide financial management across revenue, collections, expenses, invoices, budgets, assets, and reporting — all consuming the existing Finance Platform backend.

## Architecture

```
FinanceDashboard (/)          → Executive KPIs, charts, quick actions
├── FinanceReports (/reports) → Revenue, Collection, Expense, Outstanding reports
├── InvoiceWorkspace (/invoices/:id) → Invoice detail via WorkspaceShell
├── ExpenseWorkspace (/expenses/:id) → Expense detail via WorkspaceShell
├── Ledger (/ledger)          → General ledger view (placeholder)
├── BudgetWorkspace           → Budget management (placeholder)
├── AssetWorkspace            → Fixed asset tracking (placeholder)
└── Collections (/collections)→ Payment collection dashboard
```

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/finance` | `FinanceDashboard` | Executive dashboard with KPIs, charts, recent transactions |
| `/finance/reports` | `FinanceReports` | Financial reports center |
| `/finance/invoices/:id` | `InvoiceWorkspace` | Invoice detail workspace |
| `/finance/expenses/:id` | `ExpenseWorkspace` | Expense detail workspace |

### Platform Integration

Every finance page consumes:
- **Finance Platform** (`financePlatform.ts`) — event-pipeline-wrapped mutations, secure queries, dashboard KPIs
- **Finance Engine** (`financeEngine.ts`) — journal entries, cash book, vendor bills, credit notes
- **Fee Engine** (`feeEngine.ts`) — fee structures, accounts, installments, discounts, scholarships
- **Finance Reports** (`financeReports.ts`) — dashboard aggregations, daily collection, outstanding, profit

## Executive Dashboard

The `FinanceDashboard.tsx` provides:

### KPIs
- Today's Collection
- Monthly Revenue
- Total Outstanding
- Cash Balance
- Pending Today
- Monthly Expenses
- Pending Invoices
- Overdue Amount

### Widgets
- Revenue vs Expense bar chart
- Outstanding breakdown with progress bars
- Recent payments, invoices, expenses lists
- Quick action tiles
- Finance module navigation grid

## Reports Center

The `FinanceReports.tsx` provides live financial reports:

| Report | Backend Query | Metrics |
|--------|--------------|---------|
| Revenue Report | `getRevenueReport` | Total revenue, invoiced, pending, overdue, collection rate |
| Collection Report | `getCollectionReport` | Total collected, by method, pending count |
| Expense Report | `getExpenseReport` | Total approved, by category, draft pending |
| Outstanding Report | `getOutstandingReport` | Total outstanding, active accounts, total fee |
| Profit & Loss | `getFinanceDashboard` | Revenue vs expenses, net profit, margin |
| Cash Flow | `getFinanceDashboard` | Cash in/out, net position |

## Workspace Pages

### InvoiceWorkspace

Uses `WorkspaceShell` with tabs:
- **Overview** — Invoice details, amount summary, line items
- **Payments** — Payment history (placeholder)
- **Timeline** — Shared timeline plugin
- **Documents** — Shared documents plugin
- **Activity** — Shared activity plugin
- **Notes** — Shared notes plugin

### ExpenseWorkspace

Uses `WorkspaceShell` with tabs:
- **Overview** — Expense details, organization info, attachments
- **Approval** — Approve/reject with notes via `approveExpenseWithWorkflow`
- **Documents** — Shared documents plugin
- **Timeline** — Shared timeline plugin
- **Activity** — Shared activity plugin
- **Notes** — Shared notes plugin

## Extension Guide

### Adding a new finance report

1. Add query in `src/convex/financePlatform.ts` (or `financeReports.ts`)
2. Add a `ReportCard` in `FinanceReports.tsx`
3. Add a tab in the reports detail `Tabs` component

### Adding a new finance workspace

1. Create page in `src/pages/` using `WorkspaceShell`
2. Add tab definitions and actions
3. Register route in `src/main.tsx`
4. Add sidebar link in `src/lib/routes.ts` (optional)
