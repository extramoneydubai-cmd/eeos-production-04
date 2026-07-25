# EEOS Finance & Accounting — API Reference

> **Total APIs**: 50+ queries and mutations across 8 files

---

## Platform-Aligned APIs (`financePlatform.ts`)

### Mutations (SDK-Integrated)

| Function | Description | Event Pipeline |
|----------|-------------|:--------------:|
| `createFeeAccountPlatform` | Create student fee account | ✅ `finance.fee_account.created` |
| `createInvoicePlatform` | Generate new invoice | ✅ `finance.invoice.created` |
| `receivePaymentPlatform` | Record payment transaction | ✅ `finance.payment.received` |
| `verifyPaymentPlatform` | Verify payment & update balances | ✅ `finance.payment.verified` |
| `createRefundPlatform` | Create refund request | ✅ `finance.refund.requested` |
| `createExpensePlatform` | Create expense record | ✅ `finance.expense.created` |
| `createVendorBillPlatform` | Create vendor bill | ✅ `finance.vendor_bill.created` |
| `createJournalEntryPlatform` | Create journal entry | ✅ `finance.journal_entry.created` |

### Workflow-Integrated Approvals

| Function | Description | Workflow |
|----------|-------------|:--------:|
| `approveExpenseWithWorkflow` | Approve/reject with audit + timeline | ✅ |
| `approveRefundWithWorkflow` | Approve/reject refund with audit + timeline | ✅ |

### Paginated Queries (Platform-Aligned)

| Function | Description | Pagination |
|----------|-------------|:----------:|
| `listInvoicesPaginated` | Invoice list with filters | ✅ |
| `listPaymentsPaginated` | Payment list with filters | ✅ |
| `listExpensesPaginated` | Expense list (enriched) | ✅ |
| `listRefundsPaginated` | Refund list with filters | ✅ |
| `listVendorBillsPaginated` | Vendor bill list with filters | ✅ |
| `listJournalEntriesPaginated` | Journal entries with filters | ✅ |

### Dashboard / Reports

| Function | Description |
|----------|-------------|
| `getFinanceDashboardKPIs` | 15+ KPIs (revenue, expenses, outstanding, collection rate) |
| `getRevenueReport` | Revenue summary with filters |
| `getCollectionReport` | Collection breakdown by method/period |
| `getExpenseReport` | Expense analysis by category |
| `getOutstandingReport` | Outstanding fee summary |

### People Integration

| Function | Description |
|----------|-------------|
| `resolvePersonFromStudent` | Get person from People Registry via studentId |
| `getPersonName` | Resolve student name via People Registry |

---

## Legacy APIs (Backward Compatible)

### Fee Engine (`feeEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `createFeeStructure` | mutation | Create fee item definition |
| `updateFeeStructure` | mutation | Update fee item |
| `listFeeStructures` | query | List fee items with filters |
| `getFeeStructure` | query | Get single fee item |
| `createFeeAccount` | mutation | Create student fee account |
| `getStudentFeeAccount` | query | Get fee account by student |
| `calculateOutstanding` | query | Calculate outstanding balance |
| `recalculateBalances` | mutation | Recalculate account balances |
| `generateInstallments` | mutation | Generate installment schedule |
| `listInstallments` | query | List installments for student |
| `createDiscount` | mutation | Create discount definition |
| `applyDiscount` | mutation | Apply discount to account |
| `listDiscounts` | query | List discounts |
| `createScholarship` | mutation | Create scholarship definition |
| `applyScholarship` | mutation | Apply scholarship to account |
| `listScholarships` | query | List scholarships |
| `createWaiver` | mutation | Create waiver request |
| `approveWaiver` | mutation | Approve/reject waiver |
| `listWaivers` | query | List waivers |
| `createLateFeeRule` | mutation | Create late fee rule |
| `calculateLateFees` | mutation | Calculate and apply late fees |
| `listLateFeeRules` | query | List late fee rules |
| `getFeeSummary` | query | Complete fee summary (account + installments + invoices + payments) |

### Invoice Engine (`invoiceEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `autoGenerateInvoiceFromInstallments` | mutation | Auto-generate invoice from unpaid installments |
| `generateBatchInvoices` | mutation | Batch generate invoices for multiple students |
| `generateInvoiceForInstallment` | mutation | Generate invoice for single installment |
| `getInvoiceData` | query | Full invoice data (student, line items, payments, receipts) |
| `getInvoiceDashboard` | query | Invoice dashboard with status summary |
| `getFinancialReport` | query | Revenue/expense financial report |

### Payment Engine (`paymentEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `createPaymentMethod` | mutation | Create payment method config |
| `listPaymentMethods` | query | List payment methods |
| `createTaxRule` | mutation | Create tax rule |
| `listTaxRules` | query | List tax rules |
| `receivePayment` | mutation | Record incoming payment |
| `verifyPayment` | mutation | Verify and apply payment |
| `reversePayment` | mutation | Reverse/refund payment |
| `listTransactions` | query | List payment transactions |

### Receipt Engine (`receiptEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `generateReceipt` | mutation | Generate payment receipt |
| `getReceipt` | query | Get receipt with student/transaction info |
| `listReceipts` | query | List receipts with enrichment |
| `markReceiptEmailed` | mutation | Mark receipt as emailed |
| `markReceiptWhatsApped` | mutation | Mark receipt as WhatsApp sent |

### Expense Engine (`expenseEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `createExpense` | mutation | Create expense record |
| `updateExpense` | mutation | Update expense |
| `submitForApproval` | mutation | Submit expense for approval |
| `approveExpense` | mutation | Approve/reject expense |
| `markExpensePaid` | mutation | Mark expense as paid |
| `listExpenses` | query | List expenses with filters |
| `getExpense` | query | Get single expense |
| `getExpenseSummary` | query | Expense summary (approved/pending/draft/paid) |

### Refund Engine (`refundEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `createRefundRequest` | mutation | Create refund request |
| `submitRefundForApproval` | mutation | Submit for approval |
| `approveRefund` | mutation | Approve/reject refund |
| `processRefund` | mutation | Process approved refund |
| `completeRefund` | mutation | Mark refund as completed |
| `listRefundRequests` | query | List refund requests |
| `getRefundRequest` | query | Get single refund request |
| `getRefundSummary` | query | Refund summary statistics |

### Finance Engine (`financeEngine.ts`)

| Function | Type | Description |
|----------|:----:|-------------|
| `createJournalEntry` | mutation | Create journal entry |
| `postJournalEntry` | mutation | Post draft journal entry |
| `reverseJournalEntry` | mutation | Reverse posted entry |
| `listJournalEntries` | query | List journal entries |
| `getJournalEntry` | query | Get single entry |
| `createCashBookEntry` | mutation | Create cash book entry |
| `listCashBookEntries` | query | List cash book entries |
| `getCashBookBalance` | query | Get current cash balance |
| `createVendorBill` | mutation | Create vendor bill |
| `payVendorBill` | mutation | Record vendor payment |
| `listVendorBills` | query | List vendor bills |
| `getVendorBill` | query | Get single vendor bill |
| `createCreditNote` | mutation | Create credit note |
| `issueCreditNote` | mutation | Issue draft credit note |
| `applyCreditNoteToInvoice` | mutation | Apply credit note to invoice |
| `listCreditNotes` | query | List credit notes |
