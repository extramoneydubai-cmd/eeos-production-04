/**
 * Token-aware backend functions.
 *
 * Every function listed here declares an optional `token: v.optional(v.string())`
 * argument. The secured Convex client (src/lib/convex-client.ts) injects the
 * current session token into these calls so `withScopeAndEvents` / the engine
 * handlers can resolve the REAL performer server-side from the `sessions`
 * table — making scope checks, audit, timeline and events authoritative.
 *
 * Functions NOT listed here never receive a `token`, so Convex argument
 * validation is never broken by the injection.
 *
 * REGENERATE when new engines adopt the token pattern:
 *   for each file with `token: v.optional(v.string())`, list every
 *   `export const NAME = mutation|query|action({ ... token: v.optional ... }`
 *   as `"<fileBasename>:<NAME>"`.
 */

export const TOKEN_AWARE_FUNCTIONS = new Set<string>([
  // fixedAssetEngine
  "fixedAssetEngine:createAssetCategory",
  "fixedAssetEngine:createFixedAsset",
  "fixedAssetEngine:updateFixedAsset",
  "fixedAssetEngine:calculateDepreciation",
  "fixedAssetEngine:transferAsset",
  "fixedAssetEngine:writeOffAsset",
  "fixedAssetEngine:disposeAsset",
  // inventoryBranchEngine
  "inventoryBranchEngine:adjustStock",
  "inventoryBranchEngine:setStockLocation",
  "inventoryBranchEngine:setStockLimits",
  "inventoryBranchEngine:createTransferRequest",
  "inventoryBranchEngine:approveTransfer",
  "inventoryBranchEngine:reserveStock",
  "inventoryBranchEngine:releaseReservedStock",
  // reportScheduleEngine
  "reportScheduleEngine:createSchedule",
  "reportScheduleEngine:updateSchedule",
  "reportScheduleEngine:toggleSchedule",
  "reportScheduleEngine:deleteSchedule",
  "reportScheduleEngine:saveDashboardLayout",
  "reportScheduleEngine:getUserDashboardLayouts",
  "reportScheduleEngine:getDefaultDashboardLayout",
  // teacherSchedulingEngine
  "teacherSchedulingEngine:assignTeacherSchedule",
  "teacherSchedulingEngine:autoScheduleSubstitute",
  "teacherSchedulingEngine:updateTeacherSettings",
  // crmLeads (lead engine — api.crm.* re-exports these)
  "crmLeads:createLead",
  "crmLeads:updateLead",
  "crmLeads:updateLeadStage",
  "crmLeads:assignLead",
  "crmLeads:deleteLead",
  "crmLeads:bulkAssign",
  "crmLeads:bulkMoveStage",
  "crmLeads:bulkTag",
  "crmLeads:bulkDelete",
  "crmLeads:bulkCreateTasks",
  "crmLeads:importLeads",
  "crmLeads:scheduleFollowup",
  // studentEngine
  "studentEngine:createStudent",
  "studentEngine:updateStudent",
  "studentEngine:setParentUser",
  "studentEngine:archiveStudent",
  "studentEngine:restoreStudent",
  // feeEngine
  "feeEngine:createFeeStructure",
  "feeEngine:updateFeeStructure",
  "feeEngine:createFeeAccount",
  "feeEngine:recalculateBalances",
  "feeEngine:generateInstallments",
  "feeEngine:createDiscount",
  "feeEngine:applyDiscount",
  "feeEngine:createScholarship",
  "feeEngine:applyScholarship",
  "feeEngine:createWaiver",
  "feeEngine:approveWaiver",
  "feeEngine:createLateFeeRule",
  "feeEngine:calculateLateFees",
]);
