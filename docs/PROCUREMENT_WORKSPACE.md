# Procurement & Inventory Workspace — EEOS Release 1.1

## Overview

The Procurement & Inventory Workspace manages the complete procurement lifecycle: vendor management, purchase requisitions, purchase orders, goods receipt, inventory tracking, asset allocation, warehouse management, and vendor payments.

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/procurement` | `ProcurementDashboard` | Executive dashboard with KPIs, low stock alerts, quick actions |
| `/procurement/vendors` | `VendorDatabase` | Vendor master listing with search, status filters, stats |
| `/procurement/vendors/:id` | `VendorWorkspace` | Vendor detail with WorkspaceShell tabs |
| `/procurement/inventory` | `InventoryDatabase` | Inventory listing with stock levels, search, filter |
| `/procurement/inventory/:id` | `InventoryWorkspace` | Inventory item detail with WorkspaceShell tabs |
| `/procurement/assets` | `AssetWorkspace` | Asset allocation management |

## Backend Dependencies

| Engine | API Prefix | Tables |
|--------|-----------|--------|
| `procurementEngine` | `api.procurementEngine.*` | vendorMaster, purchaseRequisitions, purchaseOrders, goodsReceipts |
| `procurementPlatform` | `api.procurementPlatform.*` | Event-pipeline-wrapped mutations |
| `inventoryEngine` | `api.inventoryEngine.*` | inventoryItems, inventoryCategories, warehouses, stockMovements |
| `assetEngine` | `api.assetEngine.*` | assetAllocations |

## Dashboard Features

- **Executive KPIs** — Total POs, pending, received, active vendors, pending approvals
- **Inventory KPIs** — Total items, inventory value, low stock, out of stock, warehouse count
- **Quick Action Tiles** — One-click navigation to Vendors, Inventory, POs, Assets, Receipts, Payments, Warehouses
- **Low Stock Alerts** — Items below reorder level with current stock display
- **Recent Activity** — Recent POs and goods receipts

## Workspace Shell

All detail pages use `WorkspaceShell` from PATCH-UI-001 with consistent header, tabs, and navigation patterns.

## Extension Guide

To add new procurement pages:
1. Create the page in `src/pages/`
2. Add lazy import + route in `src/main.tsx`
3. Add route entry in `src/lib/routes.ts`
4. Add quick action tile in `ProcurementDashboard.tsx`
5. Update this document
