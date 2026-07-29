# EEOS Enterprise Finance Dashboards

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Dashboard Inventory

### 1. Main Finance Dashboard (`/finance`)

**Status:** ✅ Existing page

| Widget | Description |
|--------|-------------|
| Revenue | Total revenue (daily/weekly/monthly) |
| Collections | Collection totals with period comparison |
| Outstanding | Total outstanding balance |
| Pending Approvals | Approvals awaiting finance manager |
| Quick Actions | Create invoice, record payment, generate receipt |
| Recent Transactions | Last 20 financial transactions |
| Collection vs Target | Visual comparison |
| Payment Mode Breakdown | Pie/donut chart by payment mode |
| Monthly Trend | Bar/line chart of monthly collections |

### 2. Collection Dashboard (`/finance/collections`)

**Status:** 🟡 Needs enhancement

| Widget | Description |
|--------|-------------|
| Daily Collection | Today's collection amount |
| Monthly Collection | Current month collection |
| Collection Rate | Percentage of target achieved |
| Outstanding Balance | Total outstanding |
| Collection by Branch | Branch-wise comparison |
| Collection by Course | Course-wise breakdown |
| Collection by Counselor | Counselor performance |
| Overdue Alert | Students with highest overdue |
| Payment Mode Distribution | Pie chart |
| Collection Trend | 30-day trend line |
| Target vs Actual | Gauge chart |

### 3. Refund Dashboard (`/finance/refunds`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Pending Refunds | Count and total amount |
| Approved Refunds | Awaiting processing |
| Completed Refunds | Month-to-date completed |
| Refund by Reason | Category breakdown |
| Refund Approval Queue | Items awaiting action |
| Average Processing Time | Days to process refund |
| Monthly Refund Trend | 12-month trend |

### 4. PDC Dashboard (`/finance/pdc`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Active PDCs | Count and total value |
| Upcoming Deposits | Due within 7/30 days |
| Pending Clearance | Deposited but uncleared |
| Bounced Count | Month-to-date bounces |
| Deposit Calendar | Upcoming deposits timeline |
| Clearance Rate | % of PDCs clearing successfully |
| Bounce Rate Trend | Monthly bounce comparison |
| Bank-wise PDC Value | Distribution by bank |

### 5. GST Dashboard (`/finance/gst`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Total Tax Collected | Current period |
| Input Tax Credit | ITC claimed |
| Net Tax Payable | Tax collected minus ITC |
| Filing Due Date | Next return due date |
| Monthly GST Trend | 6-month comparison |
| CGST/SGST/IGST Breakdown | Stacked bar chart |
| Return Status | Filed/pending/overdue |

### 6. Outstanding Dashboard (`/finance/outstanding`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Total Outstanding | Current total |
| Overdue Amount | Past-due total |
| Ageing Buckets | 30/60/90/120+ days |
| Collection Forecast | Expected collections |
| Top Defaulters | Highest overdue students |
| Branch-wise Outstanding | Comparison chart |
| Course-wise Outstanding | Comparison chart |

### 7. Branch Dashboard (`/finance/branches`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Branch Collection Rank | Branches by collection |
| Branch Outstanding | Per-branch outstanding |
| Collection Efficiency | % of target achieved |
| Month-over-Month Growth | Branch comparison |
| Active Students with Dues | Per-branch count |

### 8. Company Dashboard (`/finance/company`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Company Financial Overview | Revenue, expenses, profit |
| Branch Comparison | Side-by-side branch metrics |
| Year-over-Year Growth | Annual comparison |
| Cash Flow | Monthly cash flow chart |
| Budget vs Actual | Budget consumption |

### 9. Counselor Dashboard (`/finance/counselor`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| My Students Outstanding | Assigned students' dues |
| Collection Target | Individual target tracking |
| Follow-ups Required | Students needing contact |
| Counselor Ranking | Peer comparison |

### 10. Cashier Dashboard (`/finance/cashier`)

**Status:** 🟡 Needs creation

| Widget | Description |
|--------|-------------|
| Today's Collections | Current shift total |
| Payment Count | Number of transactions |
| PDC Collected | PDCs collected today |
| Quick Actions | Record payment, print receipt, view PDCs |

---

## Shared Widget Components

All dashboards reuse shared components:

| Component | Description |
|-----------|-------------|
| KpiCard | Metric display with trend indicator |
| TrendChart | Line/bar chart with period selector |
| PieChart | Distribution visualization |
| GaugeChart | Target vs actual gauge |
| StatTable | Tabular data with sorting |
| QuickActionCard | Action buttons grid |
| AlertList | Notifications/warnings list |
| DateRangeFilter | Period selector |
| BranchFilter | Branch dropdown |
