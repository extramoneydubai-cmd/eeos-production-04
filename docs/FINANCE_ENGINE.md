# EEOS Enterprise Finance Engine

**Version:** 0.95  
**Status:** Architecture Reference  
**Date:** 2026-07-29  

---

## Architecture Overview

The EEOS Finance Engine is a configurable, multi-company, multi-branch enterprise finance platform designed for coaching institutes. It follows a layered architecture:

| Layer | Components | Status |
|-------|-----------|--------|
| Dashboards | Finance, Collection, Refund, PDC, GST, Outstanding | 🟡 Partial |
| Reports | Daily, Outstanding, GST, PDC, Receipts, Audit | 🟡 Partial |
| SDK | financeSdk (get/list/search/create/update/delete) | ❌ Needs completion |
| Engines | Fee, Payment, Collection, Refund, PDC, GST, Receipt | ✅ Most exist |
| Schema | 43 tables covering complete finance domain | ✅ Complete |
| Convex Backend | Auth, validation, event pipeline, audit, timeline | ✅ |

---

## Multi-Company & Multi-Branch Architecture

Every financial entity is scoped by company, branch, department, and cost center. The schema enforces this with `companyId`, `branchId`, `departmentId`, and `costCenterId`.

### Configuration Hierarchy

```
Company
  ├── Financial Year (start/end, isCurrent, isClosed)
  ├── GST Settings (registered type, GSTIN, filing frequency)
  ├── Receipt Templates (logo, address, numbering rules)
  ├── Bank Accounts
  ├── Payment Modes
  └── Branches
        ├── Branch-specific receipt templates
        ├── Branch-specific numbering
        ├── Branch bank accounts
        ├── Branch fee structures
        └── Branch reporting
```

---

## Existing Schema — 43 Tables

| Table | Purpose | Status |
|-------|---------|--------|
| feeStructures | Configurable fee items | ✅ |
| studentFeeAccounts | Per-student fee ledger | ✅ |
| feeInstallments | Installment schedules | ✅ |
| feeInvoices | Invoice generation | ✅ |
| feeDiscounts | Discount policies | ✅ |
| feeScholarships | Scholarship definitions | ✅ |
| feeWaivers | Fee waiver requests | ✅ |
| paymentTransactions | All payment records | ✅ |
| paymentMethods | Configurable payment methods | ✅ |
| receiptHistory | Receipt generation tracking | ✅ |
| refundRequests | Refund processing | ✅ |
| creditNotes | Credit note lifecycle | ✅ |
| lateFeeRules | Late fee configuration | ✅ |
| cashBookEntries | Cash book with running balance | ✅ |
| journalEntries | Double-entry journal | ✅ |
| vendorBills | Vendor bill management | ✅ |
| expenseRecords | Expense tracking | ✅ |
| financeBankAccounts | Bank account master | ✅ |
| financeGstRates | GST rate configuration | ✅ |
| financePaymentModes | Payment mode master | ✅ |
| financeFinancialYears | Financial year management | ✅ |
| financeFeeCategories | Fee category master | ✅ |
| financeDiscountCategories | Discount category master | ✅ |
| financeExpenseCategories | Expense category master | ✅ |
| financeIncomeCategories | Income category master | ✅ |
| financeTaxTypes | Tax type master | ✅ |
| financeCurrencies | Currency master | ✅ |
| financialTransactions | Double-entry voucher | ✅ |
| chartOfAccounts | COA with account groups | ✅ |
| accountGroups | Account group categorization | ✅ |
| costCenters | Cost center management | ✅ |
| budgets | Budget planning | ✅ |
| budgetRevisions | Budget revision history | ✅ |
| budgetConsumptions | Budget consumption log | ✅ |
| taxGroups | Tax group configuration | ✅ |
| taxRules | Tax rule definitions | ✅ |
| financialClosings | Period closing management | ✅ |
| assetCategories | Fixed asset categories | ✅ |
| fixedAssets | Fixed asset register | ✅ |
| assetDepreciationEntries | Depreciation schedule | ✅ |
| bankTransactions | Bank transaction log | ✅ |
| hrSalaryComponents | Salary structure | ✅ |
| employeeAdvances | Employee advance tracking | ✅ |

---

## Existing Backend Engines

| Engine | File | Status |
|--------|------|--------|
| FinanceEngine | src/convex/financeEngine.ts | ✅ |
| FeeEngine | src/convex/feeEngine.ts | ✅ |
| PaymentEngine | src/convex/paymentEngine.ts | ✅ |
| CollectionEngine | src/convex/collectionEngine.ts | ✅ |
| BillingEngine | src/convex/billingEngine.ts | ✅ |
| InvoiceEngine | src/convex/invoiceEngine.ts | ✅ |
| ExpenseEngine | src/convex/expenseEngine.ts | ✅ |
| FinancialTransactionEngine | src/convex/financialTransactionEngine.ts | ✅ |
| ChartOfAccountsEngine | src/convex/chartOfAccountsEngine.ts | ✅ |
| CostCenterEngine | src/convex/costCenterEngine.ts | ✅ |
| BudgetEngine | src/convex/budgetEngine.ts | ✅ |

---

## Missing Gaps (To Build)

| Component | Priority | Notes |
|-----------|----------|-------|
| Finance SDK (financeSdk.ts) | P0 | SDK file needs completion |
| PDC Engine backend | P1 | PDC tables exist, engines pending |
| GST Engine (filing workflow) | P1 | Rates exist, filing workflow pending |
| Refund pro-rata calculator | P1 | Requests exist, calculation engine pending |
| Receipt dynamic templates | P1 | History exists, templates pending |
| Cheque Bounce Workflow | P1 | Needs configurable workflow |
| Collection Dashboards | P1 | Basic exists, collection-specific pending |
| Finance Reports generation | P1 | Page exists, report engine pending |

---

## Security & Audit

Every financial transaction supports:
- Role-based permissions (Cashier, Accounts, Finance Manager, Director, CEO)
- Maker-checker approval for all mutations
- Audit trail via Event Pipeline
- Timeline events in student enrollment history
- Soft-delete via status transitions (cancelled, reversed, voided)
