# EEOS Enterprise Refund Engine

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Overview

The Refund Engine manages all student refund scenarios for coaching institutes, supporting pro-rata calculations, configurable refund policies, approval workflows, GST adjustments, and full audit trails.

## Refund Policies

Refunds are governed by configurable policies that define:

| Policy Element | Description |
|----------------|-------------|
| Pro-rata calculation | Formula for partial refund based on time/course completed |
| Non-refundable items | Fee types that cannot be refunded (registration, etc.) |
| Refundable percentage | % of fee refundable at different stages |
| Approval thresholds | Amount limits for each approval level |
| Processing timeline | Expected processing time in days |
| Deductions | Admin fees, processing fees, etc. |

### Default Policy (Configurable)

```
Course Duration: 12 months
Registration Fee: Non-refundable (₹5,000)
Caution Deposit: 100% refundable

Pro-rata Table:
  Withdrawal within 15 days: 90% refund
  Withdrawal within 30 days: 75% refund  
  Withdrawal within 60 days: 50% refund
  Withdrawal after 60 days: No refund (except deposit)

Approval Matrix:
  Up to ₹10,000: Accounts Manager
  ₹10,000 - ₹50,000: Finance Manager
  ₹50,000 - ₹2,00,000: Director
  Above ₹2,00,000: CEO Approval
  Emergency refund: CEO Override
```

## Refund Request Lifecycle

### Schema (`refundRequests`)

| Field | Description |
|-------|-------------|
| studentId | Student reference |
| transactionId | Original payment reference |
| invoiceId | Invoice reference |
| amount | Refund amount |
| reason | Refund reason text |
| reasonCategory | academic, administrative, financial, withdrawal, other |
| status | draft, pending, approved, rejected, processing, completed |
| approvedBy | Approver reference |
| approvedAt | Approval timestamp |
| processedAt | Processing timestamp |
| refundMethod | Bank transfer, cheque, cash, UPI |
| refundReference | Transaction reference for the refund |

### Workflow

```
Draft → Pending → Approved → Processing → Completed
                    ↓
                 Rejected
```

### Approval Chain

1. **Accounts/Finance** — Initial review
2. **Finance Manager** — For amounts above threshold
3. **Director** — For large refunds
4. **CEO** — For critical/emergency override

Each approval records:
- Who approved
- When approved
- Notes/comments
- Supporting documents

---

## Pro-rata Calculation

### Standard Pro-rata Formula

```
Refund Amount = (Total Fee - Non-refundable Items) × Refund Percentage - Deductions
```

### Custom Scenarios

| Scenario | Calculation |
|----------|-------------|
| Full withdrawal (early) | (Total fee × refund %) - admin fee |
| Partial withdrawal | Per-session/term refund |
| Course cancellation | Full refund (institute-initiated) |
| Medical withdrawal | Partial refund with documentation |
| Transfer to another institute | Pro-rata based on attended sessions |

### Calculation Sheet

Every refund stores its calculation:
- Base amount
- Policy used
- Refund percentage applied
- Non-refundable deductions
- Admin/processing fees
- GST adjustment (if applicable)
- Net refund amount
- Formula breakdown

---

## GST on Refunds

### GST Reversal

When a refund is processed on a GST invoice:
1. Original GST is calculated proportionally
2. GST amount is reversed
3. Credit note is generated for the GST portion
4. GST ledger is updated

### Credit Note Generation

For GST refunds, a credit note is automatically generated:
- Credit note number (auto-generated)
- Original invoice reference
- GST rate applied
- Amount (GST portion)
- Reason: "Refund against invoice [number]"

---

## Refund Methods

| Method | Description | Processing Time |
|--------|-------------|-----------------|
| Bank Transfer | NEFT/RTGS to student's account | 2-3 business days |
| Cheque | Physical cheque issued | 3-5 business days |
| Cash | Cash payment (for small amounts) | Same day |
| UPI | Instant transfer to UPI ID | Same day |
| Adjustment | Adjusted against future fees | Immediate |

---

## Audit Trail

Every refund stores:
1. **Calculation** — Policy used, formula, deductions
2. **Approval history** — Who approved at each level
3. **Policy reference** — Which policy was used
4. **Invoice reference** — Original invoice details
5. **Payment reference** — Original payment method
6. **Documents** — Supporting evidence
7. **Timeline** — Complete event history

No manual editing is permitted without approval. All changes are logged.

---

## Key Operations (Backend)

| Operation | Description |
|-----------|-------------|
| Create refund request | Submit refund for processing |
| Calculate pro-rata | Compute refund amount based on policy |
| Approve refund | Approve at appropriate level |
| Reject refund | Reject with reason |
| Process refund | Execute the refund payment |
| Generate credit note | Create GST credit note |
| Get refund status | Track refund progress |
| List refund requests | Filter by status, student, date |
| Export refund register | Download refund report |
