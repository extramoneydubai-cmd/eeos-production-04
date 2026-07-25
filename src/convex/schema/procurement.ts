import { defineTable } from "convex/server";
import { v } from "convex/values";

export const procurementTables = {
  assetAllocations: defineTable({
    itemId: v.id("inventoryItems"),
    assetName: v.string(),
    assetTag: v.string(),
    allocatedTo: v.id("users"),
    allocatedBy: v.id("users"),
    departmentId: v.optional(v.id("departments")),
    allocatedDate: v.number(),
    expectedReturn: v.optional(v.number()),
    condition: v.union(v.literal("new"), v.literal("good"), v.literal("fair"), v.literal("damaged")),
    status: v.union(v.literal("allocated"), v.literal("returned"), v.literal("lost"), v.literal("written_off")),
    returnedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("itemId", ["itemId"])
    .index("allocatedTo", ["allocatedTo"])
    .index("assetTag", ["assetTag"])
    .index("status", ["status"])
    .index("by_dept", ["departmentId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  goodsReceiptItems: defineTable({
    receiptId: v.id("goodsReceipts"),
    poItemId: v.optional(v.id("purchaseOrderItems")),
    itemId: v.optional(v.id("inventoryItems")),
    itemName: v.string(),
    quantity: v.number(),
    acceptedQuantity: v.number(),
    rejectedQuantity: v.number(),
    rejectionReason: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("receiptId", ["receiptId"])
    .index("itemId", ["itemId"])
    .index("by_created", ["createdAt"]),
  goodsReceipts: defineTable({
    receiptNumber: v.string(),
    poId: v.id("purchaseOrders"),
    vendorId: v.id("vendorMaster"),
    receivedBy: v.id("users"),
    receiptDate: v.number(),
    deliveryNote: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("partial"), v.literal("complete")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("receiptNumber", ["receiptNumber"])
    .index("poId", ["poId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  inventoryCategories: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("inventoryCategories")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("parentId", ["parentId"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  inventoryItems: defineTable({
    sku: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("inventoryCategories")),
    unit: v.string(),
    unitPrice: v.number(),
    minStock: v.number(),
    maxStock: v.number(),
    reorderLevel: v.number(),
    currentStock: v.number(),
    warehouseId: v.id("warehouses"),
    barcode: v.optional(v.string()),
    qrCode: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sku", ["sku"])
    .index("categoryId", ["categoryId"])
    .index("warehouseId", ["warehouseId"])
    .index("barcode", ["barcode"])
    .index("currentStock", ["currentStock"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  issueRegister: defineTable({
    itemId: v.id("inventoryItems"),
    issuedTo: v.id("users"),
    issuedBy: v.id("users"),
    quantity: v.number(),
    purpose: v.string(),
    departmentId: v.optional(v.id("departments")),
    expectedReturn: v.optional(v.number()),
    status: v.union(v.literal("issued"), v.literal("returned"), v.literal("lost"), v.literal("damaged")),
    returnedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("itemId", ["itemId"])
    .index("issuedTo", ["issuedTo"])
    .index("status", ["status"])
    .index("by_dept", ["departmentId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  purchaseOrderItems: defineTable({
    poId: v.id("purchaseOrders"),
    itemName: v.string(),
    itemId: v.optional(v.id("inventoryItems")),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    receivedQuantity: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("poId", ["poId"])
    .index("itemId", ["itemId"])
    .index("by_created", ["createdAt"]),
  purchaseOrders: defineTable({
    poNumber: v.string(),
    requisitionId: v.optional(v.id("purchaseRequisitions")),
    vendorId: v.id("vendorMaster"),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    orderDate: v.number(),
    expectedDelivery: v.optional(v.number()),
    deliveryAddress: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    subtotal: v.number(),
    taxAmount: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("draft"), v.literal("pending_approval"),
      v.literal("approved"), v.literal("rejected"),
      v.literal("partially_received"), v.literal("received"),
      v.literal("cancelled"),
    ),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("poNumber", ["poNumber"])
    .index("requisitionId", ["requisitionId"])
    .index("vendorId", ["vendorId"])
    .index("status", ["status"])
    .index("by_branch", ["branchId"])
    .index("by_dept", ["departmentId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  purchaseRequisitions: defineTable({
    requisitionNumber: v.string(),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    requestedBy: v.id("users"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("draft"), v.literal("pending_approval"),
      v.literal("approved"), v.literal("rejected"),
      v.literal("ordered"), v.literal("completed"), v.literal("cancelled"),
    ),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    totalEstimated: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("requisitionNumber", ["requisitionNumber"])
    .index("requestedBy", ["requestedBy"])
    .index("status", ["status"])
    .index("departmentId", ["departmentId"])
    .index("by_branch", ["branchId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  quotationComparisons: defineTable({
    requisitionId: v.optional(v.id("purchaseRequisitions")),
    poId: v.optional(v.id("purchaseOrders")),
    preparedBy: v.id("users"),
    comparisonData: v.string(),
    selectedVendorId: v.optional(v.id("vendorMaster")),
    status: v.union(v.literal("draft"), v.literal("finalized")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("requisitionId", ["requisitionId"])
    .index("poId", ["poId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  requisitionItems: defineTable({
    requisitionId: v.id("purchaseRequisitions"),
    itemName: v.string(),
    categoryId: v.optional(v.id("inventoryCategories")),
    quantity: v.number(),
    estimatedUnitPrice: v.number(),
    totalEstimated: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("requisitionId", ["requisitionId"])
    .index("by_created", ["createdAt"]),
  returnsRegister: defineTable({
    itemId: v.id("inventoryItems"),
    warehouseId: v.id("warehouses"),
    returnedBy: v.id("users"),
    quantity: v.number(),
    returnType: v.union(v.literal("damaged"), v.literal("defective"), v.literal("excess"), v.literal("expired"), v.literal("other")),
    condition: v.optional(v.string()),
    disposition: v.union(v.literal("restock"), v.literal("write_off"), v.literal("return_to_vendor"), v.literal("scrap")),
    vendorId: v.optional(v.id("vendorMaster")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("itemId", ["itemId"])
    .index("warehouseId", ["warehouseId"])
    .index("returnType", ["returnType"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  stockMovements: defineTable({
    itemId: v.id("inventoryItems"),
    warehouseId: v.id("warehouses"),
    movementType: v.union(
      v.literal("purchase_receipt"), v.literal("stock_adjustment"),
      v.literal("issue"), v.literal("return"), v.literal("transfer"),
      v.literal("damaged"), v.literal("expired"),
    ),
    quantity: v.number(),
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    notes: v.optional(v.string()),
    performedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("itemId", ["itemId"])
    .index("warehouseId", ["warehouseId"])
    .index("movementType", ["movementType"])
    .index("createdAt", ["createdAt"]),
  vendorMaster: defineTable({
    vendorName: v.string(),
    vendorCode: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    leadTime: v.optional(v.number()),
    rating: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("blacklisted")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("vendorCode", ["vendorCode"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  warehouses: defineTable({
    name: v.string(),
    code: v.string(),
    branchId: v.optional(v.id("branches")),
    location: v.optional(v.string()),
    type: v.union(v.literal("warehouse"), v.literal("branch_store"), v.literal("department_store")),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("branchId", ["branchId"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};