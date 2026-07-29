# EEOS Enterprise Finance Reports

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Report Categories

### 1. Daily Collections

| Report | Description | Filters |
|--------|-------------|---------|
| Daily Collection Register | All collections for the day | Branch, payment mode, cashier |
| Cash Summary | Cash collections and disbursements | Date range, branch |
| Bank Summary | Bank deposits summary | Date range, bank account |
| Payment Mode Summary | Collections by payment mode | Date range, branch |
| Cashier Summary | Per-cashier collection totals | Date range, cashier |

### 2. Outstanding Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Outstanding Summary | Total outstanding by branch/course | Branch, course, batch |
| Ageing Analysis | Outstanding by ageing buckets (30/60/90/120+) | Branch, student |
| Student-wise Outstanding | Detailed outstanding per student | Student, branch |
| Overdue Installments | Past-due installment list | Branch, due date range |
| Collection Forecast | Expected collections forecast | Branch, period |

### 3. Fee Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Fee Register | All fee transactions | Date range, branch |
| Fee Structure Summary | Configured fee structures | Category, status |
| Discount Register | Discounts applied | Date range, branch |
| Scholarship Register | Scholarships awarded | Date range, branch |
| Waiver Register | Waivers approved | Date range, branch |

### 4. Collection Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Collection by Branch | Branch-wise collection totals | Period, company |
| Collection by Course | Course-wise collection totals | Period, branch |
| Collection by Counselor | Counselor-wise collection | Period, counselor |
| Collection by Payment Mode | Mode-wise collection breakdown | Period, branch |
| Monthly Collection Trend | Month-over-month comparison | Year, branch |

### 5. PDC Reports

| Report | Description | Filters |
|--------|-------------|---------|
| PDC Inventory | All PDCs by status | Branch, status |
| Deposit Calendar | Upcoming PDC deposits | Date range, branch |
| PDC Clearance | Cleared PDCs | Date range, bank |
| Bounce Register | Bounced cheque details | Date range, branch |
| PDC Ageing | Ageing analysis of pending PDCs | Branch |

### 6. Refund Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Refund Register | All refund transactions | Date range, branch |
| Refund by Reason | Refund categorization | Reason category |
| Refund by Student | Student-wise refund history | Student |
| Pending Refunds | Refunds awaiting processing | Branch |

### 7. GST Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Monthly GST Summary | Tax collected/paid summary | Month, company |
| GST Register | All GST transactions | Date range, branch |
| Input Tax Credit Register | ITC claimed | Period |
| Credit Note Register | Credit notes issued | Period |
| HSN/SAC Summary | Rate-wise tax summary | Period |
| GSTR-1 Export | Data for GSTR-1 filing | Period |
| GSTR-3B Export | Data for GSTR-3B filing | Period |

### 8. Receipt Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Receipt Register | All receipts generated | Date range, branch |
| Receipt Delivery Status | Delivery tracking | Date range, status |
| Cancelled Receipts | Voided/cancelled receipts | Date range, branch |

### 9. Accounting Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Cash Book | All cash entries with running balance | Date range, branch |
| Bank Book | Bank transactions | Date range, account |
| Journal Register | Journal entries | Date range, status |
| Ledger | Account-wise transactions | Account, period |
| Trial Balance | Debit/credit balances | Date, company |
| Profit & Loss | Income/expense summary | Period, branch |

### 10. Audit Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Transaction Audit Log | All financial mutations | Date range, user |
| Approval Register | Approved/rejected requests | Date range, approver |
| Exception Report | Unusual transactions | Date range |
| User Activity Report | Finance module activity | User, date range |

---

## Export Formats

| Format | Status |
|--------|--------|
| PDF | 🟡 |
| Excel (XLSX) | 🟡 |
| CSV | 🟡 |
| Markdown | 🟡 |

---

## Report Scheduling (Future)

| Feature | Description |
|---------|-------------|
| Daily auto-generation | End-of-day report emails |
| Monthly schedules | Month-end report packs |
| Email distribution | Automated delivery to stakeholders |
| Archive | Historical report storage |
