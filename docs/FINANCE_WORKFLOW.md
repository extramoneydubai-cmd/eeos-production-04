# EEOS Finance & Accounting — Workflow Reference

> **Rule**: All approval processes use `workflowSdk`. No custom approval engine.

---

## Fee Waiver Workflow

```
[Request] ──▶ [Manager Approve] ──▶ [Finance Approve] ──▶ [Applied]
                │                        │
                ▼                        ▼
            [Rejected]              [Rejected]
```

**SDK Integration**:
```
import { workflowSdk } from "@/platform/sdk/workflowSdk";
await workflowSdk.start(ctx, {
  workflowId,
  triggerSource: "fee_waiver",
  triggerEntityId: waiverId,
});
```

## Expense Approval Workflow

```
[Submit] ──▶ [Manager Review] ──▶ [Finance Review] ──▶ [CEO Approval]
               │                       │                    │
               ▼                       ▼                    ▼
           [Rejected]             [Rejected]           [Rejected]
                                                           │
                                                           ▼
                                                       [Paid]
```

**Implementation**: `financePlatform.ts` — `approveExpenseWithWorkflow()`
- Auto-records audit log via `auditSdk`
- Auto-records timeline via `timelineSdk`
- Status transitions: draft → pending_approval → approved/rejected → paid

## Refund Approval Workflow

```
[Request] ──▶ [Manager Review] ──▶ [Finance Approve] ──▶ [Process] ──▶ [Completed]
                │                       │                    │
                ▼                       ▼                    ▼
            [Rejected]             [Rejected]          [Failed]
```

**Implementation**: `financePlatform.ts` — `approveRefundWithWorkflow()`

**States**: draft → pending → approved/rejected → processing → completed

## Vendor Payment Workflow

```
[Bill Entered] ──▶ [Verified] ──▶ [Finance Approve] ──▶ [Payment Released]
                      │                │
                      ▼                ▼
                  [Rejected]      [Rejected]
```

## Scholarship Approval Workflow

```
[Recommend] ──▶ [Committee Review] ──▶ [Finance Approve] ──▶ [Applied]
                   │                        │
                   ▼                        ▼
               [Rejected]              [Rejected]
```

## Payment Verification Workflow

```
[Payment Received] ──▶ [Verification] ──▶ [Verified] ──▶ [Receipt Generated]
                         │                     │
                         ▼                     ▼
                     [Fraud Flag]          [Failed]
```

## Journal Entry Posting Workflow

```
[Draft] ──▶ [Review] ──▶ [Posted] ──▶ [Reversal if Needed]
             │
             ▼
         [Rejected]
```

## Event Types (for Timeline SDK)

| Event | Trigger | Payload |
|-------|---------|---------|
| `finance.invoice.created` | Invoice generated | invoiceId, invoiceNumber, amount |
| `finance.invoice.updated` | Invoice modified | invoiceId, changes |
| `finance.payment.received` | Payment received | transactionId, amount, method |
| `finance.payment.verified` | Payment verified | transactionId, verifiedBy |
| `finance.receipt.generated` | Receipt issued | receiptNumber, amount |
| `finance.expense.created` | Expense added | expenseId, amount, category |
| `finance.expense.approved` | Expense approved | expenseId, approvedBy |
| `finance.expense.rejected` | Expense rejected | expenseId, reason |
| `finance.refund.requested` | Refund initiated | refundId, amount, reason |
| `finance.refund.approved` | Refund approved | refundId, approvedBy |
| `finance.vendor_bill.created` | Vendor bill added | billId, vendor, amount |
| `finance.journal_entry.created` | Journal posted | entryNumber, accounts, amount |
| `finance.fee_account.created` | Fee account opened | accountId, studentId, totalFee |
| `finance.discount.applied` | Discount applied | discountId, amount |
| `finance.scholarship.applied` | Scholarship applied | scholarshipId, amount |
| `finance.waiver.approved` | Waiver approved | waiverId, amount |
| `finance.payment.reminder` | Payment reminder sent | studentId, dueDate, amount |
