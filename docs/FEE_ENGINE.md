# EEOS Enterprise Fee Engine

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Overview

The Fee Engine manages the complete fee lifecycle for coaching institutes: from fee structure configuration through installment generation, discount/scholarship application, invoice creation, payment processing, and outstanding tracking.

## Fee Structures

Configurable fee items that define what students are charged.

### Schema (`feeStructures`)

| Field | Type | Description |
|-------|------|-------------|
| name | string | Fee name (e.g., "Tuition Fee") |
| code | string | Unique code |
| amount | number | Fee amount |
| frequency | enum | one_time, monthly, quarterly, half_yearly, yearly |
| isRecurring | boolean | Whether fee repeats |
| isOptional | boolean | Whether fee can be skipped |
| isRefundable | boolean | Whether fee is refundable on withdrawal |
| feeCategoryId | ref | Category grouping |
| applicableToVerticals | string[] | Vertical filters |
| applicableToCourses | ref[] | Course filters |

### Fee Categories

Fee categories group related fees. Categories are configured via master data (`financeFeeCategories`).

Common institute fee categories:
- Tuition Fee
- Lab Fee
- Library Fee
- Examination Fee
- Activity Fee
- Development Fee
- Caution Deposit (refundable)
- Registration Fee (non-refundable)
- Uniform Fee
- Transport Fee

---

## Fee Plans

Multiple fee plan types supported:

| Plan Type | Description | Status |
|-----------|-------------|--------|
| One-time | Single payment for the full amount | ✅ |
| Down payment + installments | Partial upfront, rest in installments | ✅ |
| Monthly installments | Equal monthly payments | ✅ |
| Quarterly installments | Payments every 3 months | ✅ |
| Yearly installments | Annual billing | ✅ |
| Milestone-based | Payments at defined milestones | 🟡 Pending |
| PDC schedule | Post-dated cheque-based schedule | 🟡 Pending |

### Installment Generation

Installments are generated automatically based on:
1. Total fee amount
2. Number of installments
3. Frequency (monthly/quarterly/yearly)
4. Start date

```typescript
// Example: Generate 12 monthly installments of 8,333.33 each
const installments = await feeEngine.generateInstallments({
  feeAccountId: "student-fee-account-id",
  startDate: Date.now(),
});
```

Installments track:
- `amount` — installment amount
- `paidAmount` — how much has been paid
- `lateFee` — any late fees applied
- `dueDate` — when payment is due
- `status` — pending, paid, partial, overdue, cancelled

---

## Discounts

### Schema (`feeDiscounts`)

| Field | Description |
|-------|-------------|
| name | Discount name |
| code | Unique code for reference |
| discountType | percentage or fixed |
| value | Discount value (10 = 10% or 10,000 fixed) |
| maxAmount | Cap on percentage discounts |
| validFrom/Until | Validity period |
| maxApplications | Usage limit |
| applicableToVerticals | Vertical filter |

### Application

Discounts can be applied to individual student fee accounts via the `applyDiscount` mutation. The engine automatically:
1. Validates discount availability
2. Calculates the discount amount
3. Updates the fee account balance
4. Increments usage counter
5. Creates timeline event

---

## Scholarships

### Schema (`feeScholarships`)

| Field | Description |
|-------|-------------|
| name | Scholarship name |
| type | percentage or fixed |
| value | Scholarship amount/value |
| criteria | Eligibility criteria text |
| minGrade | Minimum grade requirement |
| minIncome | Income threshold |
| validFrom/Until | Validity period |

### Application

Similar to discounts, scholarships apply configurable reductions to student fee accounts.

---

## Waivers

### Schema (`feeWaivers`)

| Field | Description |
|-------|-------------|
| waiverType | full or partial |
| amount | Waiver amount (for partial) |
| reason | Waiver reason |
| status | pending, approved, rejected |
| approvedBy | Approver reference |

Waivers require workflow approval.

---

## Invoices

### Schema (`feeInvoices`)

| Field | Description |
|-------|-------------|
| invoiceNumber | Auto-generated number |
| studentId | Student reference |
| lineItems | JSON string of line items |
| subtotal | Pre-tax amount |
| discountAmount | Discount applied |
| taxAmount | GST amount |
| totalAmount | Total payable |
| paidAmount | Amount paid |
| balanceDue | Outstanding balance |
| status | draft, pending, paid, partial, overdue, cancelled, refunded |
| gstPercentage | GST rate applied |

### Invoice Numbering

Configurable per company/branch:
- Prefix (e.g., "INV", "FEE", "BR1-INV")
- Sequential number (padded)
- Financial year suffix (optional)

### Invoice Status Flow

```
Draft → Pending → Partial → Paid
  ↓                   ↓        ↓
Cancelled          Overdue   Refunded
```

---

## Late Fees

### Schema (`lateFeeRules`)

| Field | Description |
|-------|-------------|
| gracePeriod | Days before late fee applies |
| lateFeeType | percentage, fixed, or per_day |
| value | Fee value |
| maxLateFee | Cap on late fees |
| waiveFirstLateFee | Whether first late fee is waived |

---

## Student Fee Account

The `studentFeeAccounts` table is the central ledger for each student:

| Field | Description |
|-------|-------------|
| totalFee | Sum of all fees |
| totalPaid | Sum of all payments |
| outstandingBalance | Total - Paid |
| totalDiscount | Sum of discounts applied |
| totalScholarship | Sum of scholarships applied |
| totalWaiver | Sum of waivers applied |
| installmentsCount | Number of installments |
| nextDueDate | Next payment due date |
| lastPaymentDate | Last payment date |
| status | active, closed, defaulted |

---

## Key Operations (Backend)

| Mutation | Description |
|----------|-------------|
| `createFeeStructure` | Create a configurable fee item |
| `updateFeeStructure` | Update fee structure |
| `createFeeAccount` | Create student fee account |
| `generateInstallments` | Generate installment schedule |
| `createDiscount` | Create discount policy |
| `applyDiscount` | Apply discount to student |
| `createScholarship` | Create scholarship |
| `applyScholarship` | Apply scholarship to student |
| `createWaiver` | Create waiver request (needs approval) |
| `approveWaiver` | Approve waiver |
| `recalculateBalances` | Recalculate fee account balances |
| `calculateOutstanding` | Calculate outstanding summary |

| Query | Description |
|-------|-------------|
| `listFeeStructures` | List fee structures |
| `getFeeStructure` | Get fee structure by ID |
| `getStudentFeeAccount` | Get student fee account |
| `listInstallments` | List student installments |
| `listDiscounts` | List discount policies |
| `listScholarships` | List scholarships |
| `calculateOutstanding` | Get outstanding summary |
