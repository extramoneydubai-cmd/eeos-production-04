# Procurement & Inventory Engine — Enterprise Guide

## Overview

The Procurement & Inventory Engine manages the complete lifecycle of procurement operations and inventory management within EEOS. It is fully integrated with the Shared Platform SDK, Event Pipeline, Dashboard Studio, and Finance modules.

## Architecture

```
Procurement & Inventory
│
├── Procurement Management
│   ├── Vendor Master         → vendorMaster, createVendor()
│   ├── Purchase Requisitions → purchaseRequisitions, reqItems, createRequisition()
│   ├── Quotations            → quotationComparisons, createQuotationComparison()
│   ├── Purchase Orders       → purchaseOrders, poItems, createPurchaseOrder()
│   ├── Goods Receipts        → goodsReceipts, grnItems, createGoodsReceipt()
│   └── Vendor Bills          → vendorBills, createVendorBill()
│
├── Inventory Management
│   ├── Categories           → inventoryCategories, createCategory()
│   ├── Warehouses           → warehouses, createWarehouse()
│   ├── Items                → inventoryItems, createInventoryItem()
│   ├── Stock Movements      → stockMovements, recordStockMovement()
│   ├── Returns              → returnsRegister, recordReturn()
│   └── Low Stock Alerts     → getLowStockAlerts()
│
├── Asset Management
│   ├── Issue Register       → issueRegister, issueItem()
│   ├── Asset Allocations    → assetAllocations, allocateAsset()
│   └── Returns              → returnsRegister
│
└── Payment Management
    ├── Payment Requests     → paymentRequests, createPaymentRequest()
    └── Payment Approval     → submitPaymentRequest(), approvePaymentRequest()
```

## Database Tables (16)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `vendorMaster` | Vendor registry | vendorCode, vendorName, contactPerson, gstNumber, status |
| `purchaseRequisitions` | Purchase requests | requisitionNumber, departmentId, priority, status (draft→pending→approved→rejected→ordered→completed) |
| `requisitionItems` | Line items for requisitions | requisitionId, itemName, quantity, estimatedUnitPrice |
| `quotationComparisons` | Vendor quotation analysis | requisitionId, comparisonData, selectedVendorId, status |
| `purchaseOrders` | Purchase orders | poNumber, vendorId, subtotal, taxAmount, totalAmount, status (draft→pending→approved→rejected→received→cancelled) |
| `purchaseOrderItems` | PO line items | poId, itemName, quantity, unitPrice, receivedQuantity |
| `goodsReceipts` | Goods receipt notes | receiptNumber, poId, vendorId, status (pending/partial/complete) |
| `goodsReceiptItems` | GRN line items | receiptId, poItemId, acceptedQuantity, rejectedQuantity |
| `paymentRequests` | Vendor payment requests | requestNumber, poId, vendorId, amount, status (draft→pending→approved→paid→rejected) |
| `vendorBills` | Vendor invoices | billNumber, vendorId, amount, dueDate, status |
| `inventoryCategories` | Item categorization | name, code, parentId, isActive |
| `warehouses` | Storage locations | name, code, branchId, type (warehouse/branch_store/department_store) |
| `inventoryItems` | Inventory master | sku, name, categoryId, unitPrice, currentStock, minStock, maxStock, reorderLevel, warehouseId |
| `stockMovements` | Inventory transactions | itemId, warehouseId, movementType, balanceBefore, balanceAfter |
| `issueRegister` | Item issues to users/teams | itemId, issuedTo, quantity, purpose, status (issued/returned/lost/damaged) |
| `assetAllocations` | Tracked asset assignment | itemId, assetName, assetTag, allocatedTo, condition, status |
| `returnsRegister` | Item returns from various sources | itemId, warehouseId, returnType, disposition |

## Workflow States

### Purchase Requisition Flow
```
Draft → Pending Approval → Approved → Ordered → Completed
                         → Rejected      → Cancelled
```

### Purchase Order Flow
```
Draft → Pending Approval → Approved → Partially Received → Received
                         → Rejected      → Cancelled
```

### Payment Request Flow
```
Draft → Pending Approval → Approved → Paid
                         → Rejected → Cancelled
```

## Platform Integration

### Event Pipeline
All critical mutations in `procurementPlatform.ts` automatically fire:
- Audit Log
- Timeline Event
- Activity Record
- Event Bus Event

Event types:
- `procurement.vendor.create` / `update`
- `procurement.requisition.create` / `submit` / `approve` / `reject`
- `procurement.purchase_order.create` / `submit` / `approve` / `reject`
- `procurement.goods_receipt.create`
- `inventory.item.create` / `adjust_stock`
- `inventory.issue.create` / `return`
- `assets.asset.allocate` / `return`
- `procurement.payment_request.create` / `submit` / `approve` / `pay`

### Dashboard Provider
Registered as `inventory` (items/stock focus) and `procurement` (operations focus):
- KPIs: Total Items, Low Stock, Active Vendors, Pending Orders, Pending Approvals, POs, Requisitions, Goods Receipts, Payment Requests
- Charts: POs by Status, Items by Category, Requisitions by Priority, Vendors by Status

### Query Platform
Use securePaginatedQuery() for all list queries. See `procurementPlatform.ts` for platform-aligned mutations.

## API Reference

### Procurement Platform (`src/convex/procurementPlatform.ts`)

**Vendors:**
- `createVendor(args)` → id
- `updateVendor(args)` → id

**Requisitions:**
- `createRequisition(args)` → { id, requisitionNumber }
- `submitRequisitionForApproval({ id })` → id
- `approveRequisition({ id, approve })` → id

**Purchase Orders:**
- `createPurchaseOrder(args)` → { id, poNumber }
- `submitPOForApproval({ id })` → id
- `approvePurchaseOrder({ id, approve })` → id

**Goods Receipts:**
- `createGoodsReceipt(args)` → { id, receiptNumber }

**Inventory:**
- `createInventoryItem(args)` → id
- `adjustStock({ itemId, newStock, notes? })` → id

**Asset Management:**
- `issueItem(args)` → { id, balanceAfter }
- `returnIssuedItem({ issueId, notes? })` → id
- `allocateAsset(args)` → id
- `returnAsset({ assetId, condition?, notes? })` → id

**Payment Requests:**
- `createPaymentRequest(args)` → { id, requestNumber }
- `submitPaymentRequest({ id })` → id
- `approvePaymentRequest({ id, approve, paymentMode? })` → id
- `markPaymentPaid({ id })` → id

**Vendor Bills:**
- `createVendorBill(args)` → id

**Dashboards:**
- `getProcurementDashboard()` → dashboard stats
