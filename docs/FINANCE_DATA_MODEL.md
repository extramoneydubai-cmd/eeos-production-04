# EEOS Finance & Accounting — Data Model

> **Total Tables**: 21  
> **Schema File**: `src/convex/schema/finance.ts`

---

## Core Revenue Tables

### `feeStructures`
Configurable fee item definitions.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Fee name |
| code | string? | Unique code |
| feeCategoryId | id? | Category reference |
| amount | number | Fee amount |
| isRecurring | boolean | Whether recurring |
| frequency | enum | one_time/monthly/quarterly/half_yearly/yearly |
| isOptional | boolean | Optional or mandatory |
| isRefundable | boolean | Whether refundable |

### `studentFeeAccounts`
Per-student fee ledger.

| Field | Type | Description |
|-------|------|-------------|
| studentId | id(studentMaster) | Student reference |
| totalFee | number | Total fee amount |
| totalPaid | number | Total amount paid |
| outstandingBalance | number | Remaining balance |
| totalDiscount | number | Discounts applied |
| totalScholarship | number | Scholarships applied |
| totalWaiver | number | Waivers applied |
| installmentsCount | number | Number of installments |
| status | enum | active/closed/defaulted |

### `feeInstallments`
Installment schedule for fee accounts.

| Field | Type | Description |
|-------|------|-------------|
| studentId | id(studentMaster) | Student reference |
| feeAccountId | id(studentFeeAccounts) | Account reference |
| invoiceId | id(feeInvoices)? | Linked invoice |
| amount | number | Installment amount |
| paidAmount | number | Amount paid |
| lateFee | number | Late fee applied |
| dueDate | number | Due timestamp |
| status | enum | pending/paid/partial/overdue/cancelled |

### `feeInvoices`
Generated invoices.

| Field | Type | Description |
|-------|------|-------------|
| invoiceNumber | string | Generated number |
| studentId | id(studentMaster) | Student reference |
| feeAccountId | id(studentFeeAccounts) | Account reference |
| lineItems | string | JSON line items |
| subtotal | number | Subtotal amount |
| totalAmount | number | Total with fees |
| paidAmount | number | Amount paid |
| balanceDue | number | Remaining balance |
| status | enum | draft/pending/paid/partial/overdue/cancelled/refunded |
| gstPercentage | number? | GST rate |

### `paymentTransactions`
Payment records.

| Field | Type | Description |
|-------|------|-------------|
| transactionNumber | string | Unique number |
| studentId | id(studentMaster) | Student reference |
| feeAccountId | id(studentFeeAccounts) | Account reference |
| invoiceId | id(feeInvoices)? | Invoice reference |
| paymentMethod | string | Method (cash, bank, UPI, etc.) |
| amount | number | Payment amount |
| status | enum | pending/verified/completed/failed/reversed/refunded |

### `receiptHistory`
Generated receipts.

| Field | Type | Description |
|-------|------|-------------|
| receiptNumber | string | Unique number |
| studentId | id(studentMaster) | Student reference |
| transactionId | id(paymentTransactions)? | Payment reference |
| amount | number | Receipt amount |
| receiptType | enum | payment/refund/adjustment |
| emailedAt | number? | Email sent timestamp |

---

## Discounts, Scholarships & Waivers

### `feeDiscounts`
| Field | Type | Description |
|-------|------|-------------|
| discountType | enum | percentage/fixed |
| value | number | Discount value |
| maxAmount | number? | Maximum discount |
| maxApplications | number? | Usage limit |

### `feeScholarships`
| Field | Type | Description |
|-------|------|-------------|
| scholarshipType | enum | percentage/fixed |
| criteria | string | Eligibility criteria |
| minGrade | string? | Minimum grade requirement |

### `feeWaivers`
| Field | Type | Description |
|-------|------|-------------|
| studentId | id(studentMaster) | Student reference |
| waiverType | enum | full/partial |
| amount | number | Waiver amount |
| status | enum | pending/approved/rejected |

---

## Expenses & Vendor Bills

### `expenseRecords`
| Field | Type | Description |
|-------|------|-------------|
| branchId | id(branches)? | Branch scope |
| departmentId | id(departments)? | Department scope |
| expenseCategoryId | id(financeExpenseCategories)? | Category |
| amount | number | Expense amount |
| isRecurring | boolean | Recurring flag |
| status | enum | draft/pending_approval/approved/rejected/paid |

### `vendorBills`
| Field | Type | Description |
|-------|------|-------------|
| vendorName | string | Vendor name |
| billNumber | string | Vendor bill number |
| amount | number | Bill amount |
| balanceDue | number | Outstanding |
| status | enum | pending/partial/paid/cancelled/overdue |

---

## Accounting Tables

### `journalEntries`
| Field | Type | Description |
|-------|------|-------------|
| entryNumber | string | Generated number |
| debitAccount | string | Debit account code |
| creditAccount | string | Credit account code |
| amount | number | Entry amount |
| status | enum | draft/posted/reversed |

### `cashBookEntries`
| Field | Type | Description |
|-------|------|-------------|
| entryType | enum | debit/credit |
| amount | number | Entry amount |
| category | enum | fee_collection/expense/refund/transfer/miscellaneous |
| balanceAfter | number | Running balance |

### `creditNotes`
| Field | Type | Description |
|-------|------|-------------|
| studentId | id(studentMaster) | Student reference |
| amount | number | Credit amount |
| status | enum | draft/issued/applied/cancelled |

---

## Configuration Tables

| Table | Purpose |
|-------|---------|
| `financeBankAccounts` | Bank account configurations |
| `financeCurrencies` | Currency configurations |
| `financeDiscountCategories` | Discount category master |
| `financeExpenseCategories` | Expense category master |
| `financeFeeCategories` | Fee category master |
| `financeFinancialYears` | Accounting period definitions |
| `financeGstRates` | GST rate configurations |
| `financeIncomeCategories` | Income category master |
| `financePaymentModes` | Payment mode configurations |
| `financeTaxTypes` | Tax type configurations |
| `lateFeeRules` | Late fee calculation rules |
| `paymentMethods` | Payment method configurations |
| `taxRules` | Tax rule configurations |
| `refundRequests` | Refund request lifecycle |

---

## Key Indexes

| Field | Indexed Tables |
|-------|---------------|
| `studentId` | feeInstallments, feeInvoices, paymentTransactions, receiptHistory, refundRequests, studentFeeAccounts, feeWaivers, creditNotes |
| `status` | feeInstallments, feeInvoices, paymentTransactions, refundRequests, expenseRecords, vendorBills, creditNotes, feeWaivers |
| `invoiceId` | creditNotes, paymentTransactions, receiptHistory, refundRequests |
| `branchId` | cashBookEntries, expenseRecords |

## Relationship Diagram

```
studentMaster (People Registry via personId)
  ├── studentFeeAccounts (per-student fee ledger)
  │   ├── feeInstallments (installment schedule)
  │   ├── feeInvoices (generated invoices)
  │   │   ├── paymentTransactions (payment records)
  │   │   │   └── receiptHistory (receipts)
  │   │   └── creditNotes (credit adjustments)
  │   └── feeWaivers (waiver approvals)
  ├── feeDiscounts (discount master)
  └── feeScholarships (scholarship master)

expenseRecords ──┬── financeExpenseCategories
                 └── branches

vendorBills ──┬── financeExpenseCategories
              └── branches

journalEntries ──┬── referenceType (poly)
                 └── referenceId (poly)
```
