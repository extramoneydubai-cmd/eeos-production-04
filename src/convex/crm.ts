// ───── Barrel re-export ─────
// CRM has been split into domain-specific modules for build performance.
// All public API surfaces are re-exported from here so existing imports
// (e.g., import { listLeads } from "@/convex/crm") continue to work.

export { LEAD_STAGES } from "./crmHelpers";

// Lead CRUD, Bulk Ops, Import, Followup Engine
export {
  listLeads, getLeadById, createLead, updateLead, updateLeadStage,
  assignLead, deleteLead,
  bulkAssign, bulkMoveStage, bulkTag, bulkDelete, bulkCreateTasks,
  checkDuplicateLeads, importLeads,
  scheduleFollowup, getFollowups,
} from "./crmLeads";

// Lead Tasks
export {
  getSalesPendingTasks, getLeadTasks, createLeadTask,
  updateLeadTaskStatus, updateLeadTask, deleteLeadTask,
} from "./crmTasks";

// Lead Notes
export { getLeadNotes, addLeadNote, deleteLeadNote } from "./crmNotes";

// Lead Documents
export { getLeadDocuments, addLeadDocument, deleteLeadDocument } from "./crmDocuments";

// Activity / Timeline
export { getLeadActivity, getLeadStageHistory } from "./crmActivity";

// Discount / Waiver Engine
export { getLeadDiscounts, createDiscount, approveDiscount, rejectDiscount } from "./crmDiscounts";

// Approval Routing Engine
export {
  requestDiscountWithApproval,
  getLeadApprovals, getLeadApprovalDecisions,
  getAllPendingApprovals, getAllCrmApprovals,
  createLeadApproval, decideOnApproval,
} from "./crmApprovals";

// WhatsApp Engine
export { getLeadWhatsAppMessages, sendWhatsAppMessage } from "./crmWhatsApp";

// Payment Engine
export { getLeadPayments, getAllLeadsPayments, addPayment, verifyPayment } from "./crmPayments";

// CRM Dashboard
export { getCrmDashboardData, getConversionHistory } from "./crmDashboard";

// Sales Performance Dashboard (imports helpers from ./salesPerformance)
export { getSalesPerformanceDashboard } from "./crmSales";

// Course Studio & Lead Courses
export {
  listCourses, getCourse, createCourse, updateCourse,
  archiveCourse, duplicateCourse,
  getLeadCourses, addCourseToLead, removeCourseFromLead,
} from "./crmCourses";

// Call Activity
export { logCallActivity, getCallLogs } from "./crmCalls";

// Sources
export { listSources as listLeadSources, getSource, createSource, updateSource, deleteSource, duplicateSource, reorderSources, seedDefaultSources } from "./crmSources";
