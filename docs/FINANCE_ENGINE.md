# EEOS Finance & Accounting Engine — Architecture Guide

> **Version**: 1.0.0  
> **Patch**: PATCH-EEOS-014  
> **Compliance**: EEOS_CONSTITUTION.md, EEOS_DOMAIN_MODEL.md, EEOS_PLATFORM_REFERENCE_ARCHITECTURE.md  
> **SDK Integration**: Shared SDK, Event Pipeline, Timeline SDK, Audit SDK, Notification SDK, Workflow SDK, Dashboard SDK, Visibility SDK, Permission SDK, People SDK, Document SDK

---

## Architecture Overview

The Finance & Accounting Engine is built as a **native EEOS Platform consumer**. It does NOT duplicate platform capabilities — it consumes them through the Shared SDK.

```
┌──────────────────────────────────────────────────────────────┐
│                   FINANCE & ACCOUNTING ENGINE                  │
├──────────────────────────────────────────────────────────────┤
│  Fee Management    │  Invoice Engine    │  Payment Engine      │
│  Scholarship Mgmt  │  Discount Mgmt     │  Waiver Mgmt         │
│  Expense Mgmt      │  Vendor Bills      │  Refund Mgmt         │
│  Journal Entries   │  Cash Book         │  Ledger              │
│  Bank Accounts     │  Tax Mgmt          │  Budget              │
├──────────────────────────────────────────────────────────────┤
│  Platform SDK Integration Layer                                │
├──────────────────────────────────────────────────────────────┤
│  peopleSdk │ timelineSdk │ auditSdk │ notificationSdk          │
│  workflowSdk │ documentSdk │ eventPipeline │ queryPlatform      │
│  visibilitySdk │ permissionSdk │ dashboardSdk │ reportSdk       │
└──────────────────────────────────────────────────────────────┘
```

## Key Design Principles

1. **No duplicated platform capabilities** — Every platform service is consumed through the SDK
2. **People Registry first** — All entity references go through `personMaster`
3. **Workflow for approvals** — No custom approval logic; all approvals use `workflowSdk`
4. **Timeline for events** — All financial events use `timelineSdk`
5. **Audit for changes** — All mutations use `auditSdk`
6. **Event Pipeline for wiring** — Every mutation uses `withEventPipeline()`
7. **Dashboard Providers** — No direct table queries in dashboards
8. **Document Management** — No finance-specific file storage

## Module Breakdown

| Module | File | Key Functions |
|--------|------|---------------|
| Fee Management | `feeEngine.ts` | Fee structures, accounts, installments, discounts, scholarships, waivers |
| Invoice Engine | `invoiceEngine.ts` | Invoice generation, batch invoicing, credit notes |
| Payment Engine | `paymentEngine.ts` | Payment methods, tax rules, transactions, verification, reversal |
| Receipt Engine | `receiptEngine.ts` | Receipt generation, email/WhatsApp delivery |
| Refund Engine | `refundEngine.ts` | Refund lifecycle (draft→pending→approved→processing→completed) |
| Expense Engine | `expenseEngine.ts` | Expense CRUD, approval workflow, categorization |
| Finance Engine | `financeEngine.ts` | Journal entries, cash book, vendor bills, credit notes |
| Finance Platform | `financePlatform.ts` | **Platform-aligned wrappers** with SDK integration |

## Platform Integration Status

| Component | Status | File |
|-----------|--------|------|
| People Registry | ✅ Integrated | `financePlatform.ts` — `resolvePersonFromStudent()` |
| Workflow SDK | ✅ Integrated | `financePlatform.ts` — `approveExpenseWithWorkflow()` |
| Timeline SDK | ✅ Integrated | `financePlatform.ts` — `withEventPipeline` |
| Audit SDK | ✅ Integrated | `financePlatform.ts` — `withEventPipeline` |
| Notification SDK | ✅ Ready | Via `withEventPipeline` notification config |
| Event Pipeline | ✅ Integrated | `financePlatform.ts` — all mutations wrapped |
| Dashboard Provider | ✅ Registered | `dashboardProviders.ts` — financeProvider |
| Query Platform | ✅ Paginated queries | `financePlatform.ts` — list*Paginated |
| Document Management | ✅ Ready | Expense attachments, invoice PDFs |
| Visibility SDK | ✅ Available | Via `visibilitySdk.canDiscover()` |
| Permission SDK | ✅ Available | Via `permissionSdk.canPerformAction()` |
