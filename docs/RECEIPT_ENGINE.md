# EEOS Enterprise Receipt Engine

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Overview

The Receipt Engine generates, delivers, and manages all financial receipts for the institute. It supports dynamic branding, configurable numbering, multiple delivery channels, and QR verification.

## Receipt Types

| Type | Description | Status |
|------|-------------|--------|
| Fee Receipt | Standard fee payment receipt | ✅ |
| Advance Receipt | Advance payment acknowledgement | 🟡 |
| Installment Receipt | Per-installment payment receipt | ✅ |
| Donation Receipt | Donation acknowledgement | 🟡 |
| Security Deposit Receipt | Caution deposit receipt | 🟡 |
| Refund Receipt | Refund payment voucher | 🟡 |
| Credit Note | Credit adjustment document | ✅ |
| Debit Note | Debit adjustment document | 🟡 |
| Duplicate Receipt | Reprint with "DUPLICATE" watermark | 🟡 |
| Cancellation Receipt | Receipt cancellation voucher | 🟡 |

---

## Receipt Schema (`receiptHistory`)

| Field | Description |
|-------|-------------|
| receiptNumber | Auto-generated unique number |
| invoiceId | Invoice reference |
| studentId | Student reference |
| transactionId | Payment transaction reference |
| amount | Receipt amount |
| receiptDate | Generation date |
| receiptType | payment, refund, adjustment |
| receiptData | JSON receipt template data |
| pdfUrl | PDF document URL |
| emailedAt | Email delivery timestamp |
| whatsappSentAt | WhatsApp delivery timestamp |

---

## Receipt Numbering

Configurable per company/branch:

### Numbering Rules

| Rule | Example |
|------|---------|
| Prefix + sequence | "RCPT-00001" |
| Branch code + sequence | "DEL-00001" |
| Financial year prefix | "2324-00001" |
| Custom format | Configurable |

### Settings

| Setting | Description |
|---------|-------------|
| prefix | Receipt prefix |
| padding | Zero-padding length |
| startNumber | Starting sequence number |
| includeYear | Whether to include financial year |
| branchPrefix | Whether to include branch code |
| resetYearly | Whether to reset sequence yearly |

---

## Receipt Templates

### Template Fields

| Section | Fields |
|---------|--------|
| Header | Company logo, name, address, GSTIN, receipt number, date |
| Student Info | Name, ID, class, batch, branch |
| Fee Details | Fee head, amount, discount, total |
| Payment Info | Mode, reference number, amount, date |
| GST Breakdown | Taxable amount, CGST, SGST, IGST, total tax |
| Footer | Authorized signature, payment terms, thank you note |
| QR Code | Receipt verification QR |

### Company Branding

- Logo upload
- Company colors
- Font selection
- Header/footer text
- Signature image

### Branch Branding

- Branch-specific templates
- Branch logo (optional)
- Branch address
- Branch-specific footer

---

## Receipt Actions

| Action | Description |
|--------|-------------|
| Generate | Create receipt from payment |
| Reprint | Reprint existing receipt |
| Cancel | Cancel and reverse receipt |
| Email | Send receipt via email |
| WhatsApp | Send receipt via WhatsApp |
| SMS | Send payment acknowledgement via SMS |
| QR Verify | Verify receipt authenticity via QR |

---

## Receipt Delivery

### Email Receipt
- PDF attachment
- Branded email template
- Subject: "Payment Receipt from [Institute Name]"
- CC to parent/guardian

### WhatsApp Receipt
- PDF document
- Text: "Dear [Name], your payment of [amount] on [date] is confirmed. Receipt: [number]"
- Link to download

### SMS Acknowledgement
- Text: "Payment of [amount] received. Receipt: [number]. Thank you - [Institute]"
- No attachment (character limit)

---

## QR Verification

Each receipt includes a QR code that when scanned:
- Opens a verification URL
- Shows receipt details
- Confirms receipt is valid
- Shows if receipt has been cancelled

---

## Receipt History & Audit

Every receipt action is logged:
- Generated at / by
- Emailed at / to
- WhatsApp sent at / to
- Cancelled at / by / reason
- Downloaded at / by (future)

---

## Key Operations (Backend)

| Operation | Description |
|-----------|-------------|
| generateReceipt | Create receipt from transaction |
| generateReceiptPDF | Generate PDF document |
| reprintReceipt | Reprint with duplicate mark |
| cancelReceipt | Cancel and reverse |
| sendReceiptEmail | Deliver via email |
| sendReceiptWhatsApp | Deliver via WhatsApp |
| sendReceiptSMS | Send SMS acknowledgement |
| verifyReceiptQR | Validate receipt QR |
| listReceipts | Filter by student, date, type |
| getReceiptHistory | Complete receipt audit trail |
