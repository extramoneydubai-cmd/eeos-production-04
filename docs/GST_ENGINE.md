# EEOS Enterprise GST Engine

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Overview

The GST Engine manages all GST-related operations for coaching institutes, including rate configuration, invoice tax calculation, credit/debit notes, GST returns, and compliance reporting.

## GST Configuration

### Schema (`financeGstRates`)

| Field | Description |
|-------|-------------|
| name | Rate name (e.g., "GST 18%") |
| code | Unique code |
| gstType | Type classification |
| cgstRate | Central GST rate % |
| sgstRate | State GST rate % |
| igstRate | Integrated GST rate % (for inter-state) |
| totalRate | Total GST rate (CGST + SGST or IGST) |

### Supported GST Types

| Type | Description | Example |
|------|-------------|---------|
| CGST+SGST | Intra-state supply | 9% + 9% = 18% |
| IGST | Inter-state supply | 18% |
| Exempt | No GST | 0% |
| Nil-rated | 0% but registered | 0% |
| Reverse charge | Recipient pays GST | As applicable |
| CESS | Additional cess | As applicable |

### Tax Groups (`taxGroups`)

Extended configuration supporting:
- Multiple tax types (GST, VAT, service tax, sales tax, withholding)
- Compound tax calculation
- Vertical/course-specific applicability
- Effective date ranges

---

## Invoice GST Calculation

When an invoice is generated, GST is calculated as:

```
For intra-state supply:
  CGST = (Taxable Amount × CGST Rate) / 100
  SGST = (Taxable Amount × SGST Rate) / 100
  Total GST = CGST + SGST

For inter-state supply:
  IGST = (Taxable Amount × IGST Rate) / 100
  Total GST = IGST
```

### Invoice Fields

| Field | Description |
|-------|-------------|
| gstPercentage | GST rate applied |
| gstAmount | Total GST amount |
| subtotal | Pre-tax subtotal |
| totalAmount | Subtotal + GST |

---

## Credit Notes

### Schema (`creditNotes`)

| Field | Description |
|-------|-------------|
| creditNoteNumber | Auto-generated number |
| invoiceId | Original invoice reference |
| amount | Credit amount |
| reason | Credit reason |
| status | draft, issued, applied, cancelled |

### Credit Note Flow

```
Draft → Issued → Applied (to invoice)
  ↓
Cancelled
```

Credit notes can be:
- Issued against an invoice (reduce outstanding)
- Applied to future invoices
- GST-adjusted (credit note includes GST reversal)

### GST Adjustment

When a credit note involves GST:
1. Original GST is reversed proportionally
2. Credit note carries the same GST rate as the original invoice
3. GST credit is tracked for return filing

---

## GST Returns

### Monthly/Quarterly Summary

The GST return engine aggregates:

| Component | Source |
|-----------|--------|
| Outward supplies | All invoices for the period |
| Inward supplies | Vendor bills for the period |
| Tax collected | CGST + SGST/IGST from invoices |
| Tax paid | Input tax credit from vendor bills |
| Net tax payable | Tax collected - Input credit |
| Credit notes | Credits issued in the period |
| Debit notes | Additional liabilities |

### Return Types

| Return | Frequency | Description |
|--------|-----------|-------------|
| GSTR-1 | Monthly/Quarterly | Outward supply details |
| GSTR-3B | Monthly | Summary return |
| GSTR-9 | Annual | Annual return |
| GSTR-9C | Annual | Audit report (if applicable) |

---

## GST Reports

| Report | Description |
|--------|-------------|
| Monthly GST Summary | Tax collected, paid, net payable |
| GST Register | All GST transactions for a period |
| Input Tax Credit Register | ITC claimed from vendor bills |
| Credit Note Register | All credit notes with GST impact |
| Debit Note Register | All debit notes |
| HSN/SAC Summary | Rate-wise tax summary |
| GST Payment Challan | Tax payment details |
| Annual GST Summary | Yearly GST position |

---

## Configuration

All GST settings are configurable via master data:

1. **GST Registration** — GSTIN, registration type, state code
2. **GST Rates** — CGST/SGST/IGST rates by HSN/SAC
3. **Tax Groups** — Extended tax configuration
4. **Reverse Charge** — Applicable services and rates
5. **Exempt Supplies** — GST-exempt items
6. **Composite Scheme** — Optional for small institutes

---

## Key Operations (Backend)

| Operation | Description |
|-----------|-------------|
| Calculate GST | Calculate GST for invoice line items |
| Apply credit note | Apply credit note with GST reversal |
| Generate GST summary | Aggregate GST for a period |
| Generate GST return | Create return filing data |
| Export GSTR-1 | Export for GSTR-1 filing |
| Export GSTR-3B | Export for GSTR-3B filing |
| Reconcile ITC | Match input credit with vendor GSTR-2A |
