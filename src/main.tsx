import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components
const LoginPage = lazy(() => import("./pages/Login.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const OrganizationStudio = lazy(() => import("./pages/OrganizationStudio.tsx"));
const UsersPage = lazy(() => import("./pages/UsersPage.tsx"));
const AccessControl = lazy(() => import("./pages/AccessControl.tsx"));
const TasksPage = lazy(() => import("./pages/TasksPage.tsx"));
const TaskDetail = lazy(() => import("./pages/TaskDetail.tsx"));
const ApprovalsPage = lazy(() => import("./pages/ApprovalsPage.tsx"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.tsx"));
const MessengerPage = lazy(() => import("./pages/MessengerPage.tsx"));
const ControlCenter = lazy(() => import("./pages/ControlCenter.tsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.tsx"));
const CrmDashboard = lazy(() => import("./pages/CrmDashboard.tsx"));
const LeadDatabase = lazy(() => import("./pages/LeadDatabase.tsx"));
const LeadWorkspace = lazy(() => import("./pages/LeadWorkspace.tsx"));
const SalesWorkspace = lazy(() => import("./pages/SalesWorkspace.tsx"));
const SalesTasksPage = lazy(() => import("./pages/SalesTasksPage.tsx"));
const SalesOpportunitiesPage = lazy(() => import("./pages/SalesOpportunitiesPage.tsx"));
const QuotationDetail = lazy(() => import("./pages/QuotationDetail.tsx"));
const SalesPaymentsDashboard = lazy(() => import("./pages/SalesPaymentsDashboard.tsx"));
const SalesPerformanceDashboard = lazy(() => import("./pages/SalesPerformanceDashboard.tsx"));
const CollectionCenter = lazy(() => import("./pages/CollectionCenter.tsx"));
const CourseStudio = lazy(() => import("./pages/CourseStudio.tsx"));
const CollectionDashboard = lazy(() => import("./pages/CollectionDashboard.tsx"));
const LeadStageStudio = lazy(() => import("./pages/LeadStageStudio.tsx"));
const MasterDataStudio = lazy(() => import("./pages/MasterDataStudio.tsx"));
const MasterDataCRM = lazy(() => import("./pages/studios/MasterDataCRM.tsx"));
const MasterDataLeadSources = lazy(() => import("./pages/studios/MasterDataLeadSources.tsx"));
const MasterDataLeadPriorities = lazy(() => import("./pages/studios/MasterDataLeadPriorities.tsx"));
const MasterDataCampaignChannels = lazy(() => import("./pages/studios/MasterDataCampaignChannels.tsx"));
const MasterDataCampaignTypes = lazy(() => import("./pages/studios/MasterDataCampaignTypes.tsx"));
const MasterDataCounsellingTypes = lazy(() => import("./pages/studios/MasterDataCounsellingTypes.tsx"));
const MasterDataCounsellingOutcomes = lazy(() => import("./pages/studios/MasterDataCounsellingOutcomes.tsx"));
const MasterDataMarketingChannels = lazy(() => import("./pages/studios/MasterDataMarketingChannels.tsx"));
const MasterDataLeadScoringRules = lazy(() => import("./pages/studios/MasterDataLeadScoringRules.tsx"));
const MasterDataLeadCategories = lazy(() => import("./pages/studios/MasterDataLeadCategories.tsx"));
const MasterDataLeadQualification = lazy(() => import("./pages/studios/MasterDataLeadQualification.tsx"));
const MasterDataUtmSources = lazy(() => import("./pages/studios/MasterDataUtmSources.tsx"));
const MasterDataUtmMediums = lazy(() => import("./pages/studios/MasterDataUtmMediums.tsx"));
const MasterDataUtmCampaigns = lazy(() => import("./pages/studios/MasterDataUtmCampaigns.tsx"));
const MasterDataFollowUpTypes = lazy(() => import("./pages/studios/MasterDataFollowUpTypes.tsx"));
const MasterDataFollowUpOutcomes = lazy(() => import("./pages/studios/MasterDataFollowUpOutcomes.tsx"));
const MasterDataEnquiryTypes = lazy(() => import("./pages/studios/MasterDataEnquiryTypes.tsx"));
const MasterDataReferralSources = lazy(() => import("./pages/studios/MasterDataReferralSources.tsx"));
const MasterDataLeadTags = lazy(() => import("./pages/studios/MasterDataLeadTags.tsx"));
const MasterDataLostReasons = lazy(() => import("./pages/studios/MasterDataLostReasons.tsx"));
const MasterDataAcademic = lazy(() => import("./pages/studios/MasterDataAcademic.tsx"));
const MasterDataAcademicSessions = lazy(() => import("./pages/studios/MasterDataAcademicSessions.tsx"));
const MasterDataBoards = lazy(() => import("./pages/studios/MasterDataBoards.tsx"));
const MasterDataVerticals = lazy(() => import("./pages/studios/MasterDataVerticals.tsx"));
const MasterDataSubVerticals = lazy(() => import("./pages/studios/MasterDataSubVerticals.tsx"));
const MasterDataPrograms = lazy(() => import("./pages/studios/MasterDataPrograms.tsx"));
const MasterDataSubjects = lazy(() => import("./pages/studios/MasterDataSubjects.tsx"));
const MasterDataBatchTypes = lazy(() => import("./pages/studios/MasterDataBatchTypes.tsx"));
const MasterDataBatches = lazy(() => import("./pages/studios/MasterDataBatches.tsx"));
const MasterDataSections = lazy(() => import("./pages/studios/MasterDataSections.tsx"));
const MasterDataMediums = lazy(() => import("./pages/studios/MasterDataMediums.tsx"));
const MasterDataLanguages = lazy(() => import("./pages/studios/MasterDataLanguages.tsx"));
const MasterDataStreams = lazy(() => import("./pages/studios/MasterDataStreams.tsx"));
const MasterDataSemesters = lazy(() => import("./pages/studios/MasterDataSemesters.tsx"));
const MasterDataTerms = lazy(() => import("./pages/studios/MasterDataTerms.tsx"));
const MasterDataFinance = lazy(() => import("./pages/studios/MasterDataFinance.tsx"));
const MasterDataCommunication = lazy(() => import("./pages/studios/MasterDataCommunication.tsx"));
const MasterDataOrganization = lazy(() => import("./pages/studios/MasterDataOrganization.tsx"));
const MasterDataDesignations = lazy(() => import("./pages/studios/MasterDataDesignations.tsx"));
const MasterDataDepartments = lazy(() => import("./pages/studios/MasterDataDepartments.tsx"));
const MasterDataTeams = lazy(() => import("./pages/studios/MasterDataTeams.tsx"));
const MasterDataBranches = lazy(() => import("./pages/studios/MasterDataBranches.tsx"));
const MasterDataCompanies = lazy(() => import("./pages/studios/MasterDataCompanies.tsx"));
const MasterDataHR = lazy(() => import("./pages/studios/MasterDataHR.tsx"));
const MasterDataEmployeeTypes = lazy(() => import("./pages/studios/MasterDataEmployeeTypes.tsx"));
const MasterDataEmploymentStatus = lazy(() => import("./pages/studios/MasterDataEmploymentStatus.tsx"));
const MasterDataOpportunityStages = lazy(() => import("./pages/studios/MasterDataOpportunityStages.tsx"));
const MasterDataSales = lazy(() => import("./pages/studios/MasterDataSales.tsx"));
const MasterDataSalesOpportunityTypes = lazy(() => import("./pages/studios/MasterDataSalesOpportunityTypes.tsx"));
const MasterDataSalesQuotationStatuses = lazy(() => import("./pages/studios/MasterDataSalesQuotationStatuses.tsx"));
const MasterDataPaymentStatuses = lazy(() => import("./pages/studios/MasterDataPaymentStatuses.tsx"));
const MasterDataInvoiceTypes = lazy(() => import("./pages/studios/MasterDataInvoiceTypes.tsx"));
const MasterDataTaxSlabs = lazy(() => import("./pages/studios/MasterDataTaxSlabs.tsx"));
const MasterDataSalesTerritories = lazy(() => import("./pages/studios/MasterDataSalesTerritories.tsx"));
const MasterDataEmployeeCategories = lazy(() => import("./pages/studios/MasterDataEmployeeCategories.tsx"));
const MasterDataWorkLocations = lazy(() => import("./pages/studios/MasterDataWorkLocations.tsx"));
const MasterDataSkills = lazy(() => import("./pages/studios/MasterDataSkills.tsx"));
const MasterDataExperienceLevels = lazy(() => import("./pages/studios/MasterDataExperienceLevels.tsx"));
const MasterDataDocumentTypes = lazy(() => import("./pages/studios/MasterDataDocumentTypes.tsx"));
const MasterDataPaymentModes = lazy(() => import("./pages/studios/MasterDataPaymentModes.tsx"));
const MasterDataBankAccounts = lazy(() => import("./pages/studios/MasterDataBankAccounts.tsx"));
const MasterDataTaxTypes = lazy(() => import("./pages/studios/MasterDataTaxTypes.tsx"));
const MasterDataGstRates = lazy(() => import("./pages/studios/MasterDataGstRates.tsx"));
const MasterDataExpenseCategories = lazy(() => import("./pages/studios/MasterDataExpenseCategories.tsx"));
const MasterDataIncomeCategories = lazy(() => import("./pages/studios/MasterDataIncomeCategories.tsx"));
const MasterDataFeeCategories = lazy(() => import("./pages/studios/MasterDataFeeCategories.tsx"));
const MasterDataDiscountCategories = lazy(() => import("./pages/studios/MasterDataDiscountCategories.tsx"));
const MasterDataCurrencies = lazy(() => import("./pages/studios/MasterDataCurrencies.tsx"));
const MasterDataFinancialYears = lazy(() => import("./pages/studios/MasterDataFinancialYears.tsx"));
const MasterDataIndustries = lazy(() => import("./pages/studios/MasterDataIndustries.tsx"));
const MasterDataClassrooms = lazy(() => import("./pages/studios/MasterDataClassrooms.tsx"));
const MasterDataNotificationTypes = lazy(() => import("./pages/studios/MasterDataNotificationTypes.tsx"));
const MasterDataEmailTemplates = lazy(() => import("./pages/studios/MasterDataEmailTemplates.tsx"));
const MasterDataSmsTemplates = lazy(() => import("./pages/studios/MasterDataSmsTemplates.tsx"));
const MasterDataWhatsAppTemplates = lazy(() => import("./pages/studios/MasterDataWhatsAppTemplates.tsx"));
const MasterDataSystem = lazy(() => import("./pages/studios/MasterDataSystem.tsx"));
const PlatformStudio = lazy(() => import("./pages/PlatformStudio.tsx"));
const RecruitingPage = lazy(() => import("./pages/RecruitingPage.tsx"));
const ExamDashboard = lazy(() => import("./pages/ExamDashboard.tsx"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard.tsx"));
const ProcurementDashboard = lazy(() => import("./pages/ProcurementDashboard.tsx"));
const LMSDashboard = lazy(() => import("./pages/LMSDashboard.tsx"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage.tsx"));
const DashboardStudio = lazy(() => import("./pages/DashboardStudio.tsx"));
const DocumentManagement = lazy(() => import("./pages/DocumentManagement.tsx"));
const IntakeDashboard = lazy(() => import("./pages/IntakeDashboard.tsx"));
const FormStudio = lazy(() => import("./pages/FormStudio.tsx"));
const WorkflowStudio = lazy(() => import("./pages/WorkflowStudio.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
import { RouteErrorBoundary } from "@/components/ui/route-error-boundary";
import { InstrumentationProvider } from "@/instrumentation";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { DeveloperModeProvider } from "@/contexts/DeveloperModeContext";

// Simple loading fallback
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

// Lazy-load AppLayout so it doesn't block the initial render
const AppLayout = lazy(() => import("./components/AppLayout.tsx").then(m => ({ default: m.AppLayout })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <Suspense fallback={<RouteLoading />}>
      <AppLayout>
        <RouteErrorBoundary key={location.pathname + location.search}>
          {children}
        </RouteErrorBoundary>
      </AppLayout>
    </Suspense>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <>
      <InstrumentationProvider>      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <DeveloperModeProvider>
            <RouteSyncer />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/org" element={<ProtectedRoute><OrganizationStudio /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
              <Route path="/access" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/messenger" element={<ProtectedRoute><MessengerPage /></ProtectedRoute>} />
              <Route path="/control" element={<ProtectedRoute><ControlCenter /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><CrmDashboard /></ProtectedRoute>} />
              <Route path="/crm/leads" element={<ProtectedRoute><LeadDatabase /></ProtectedRoute>} />
              <Route path="/crm/leads/:leadId" element={<ProtectedRoute><LeadWorkspace /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><CourseStudio /></ProtectedRoute>} />
              <Route path="/collections" element={<ProtectedRoute><CollectionDashboard /></ProtectedRoute>} />
              <Route path="/crm/sales" element={<ProtectedRoute><SalesWorkspace /></ProtectedRoute>} />
              <Route path="/crm/sales/opportunities" element={<ProtectedRoute><SalesOpportunitiesPage /></ProtectedRoute>} />
              <Route path="/crm/sales/quotations/:quoteId" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
              <Route path="/crm/sales/tasks" element={<ProtectedRoute><SalesTasksPage /></ProtectedRoute>} />
              <Route path="/crm/sales/performance" element={<ProtectedRoute><SalesPerformanceDashboard /></ProtectedRoute>} />
              <Route path="/crm/sales/payments" element={<ProtectedRoute><SalesPaymentsDashboard /></ProtectedRoute>} />
              <Route path="/crm/sales/collections" element={<ProtectedRoute><CollectionCenter /></ProtectedRoute>} />
              <Route path="/crm/settings/stages" element={<ProtectedRoute><LeadStageStudio /></ProtectedRoute>} />
              <Route path="/studios/master-data" element={<ProtectedRoute><MasterDataStudio /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm" element={<ProtectedRoute><MasterDataCRM /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lead-sources" element={<ProtectedRoute><MasterDataLeadSources /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lead-priorities" element={<ProtectedRoute><MasterDataLeadPriorities /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/campaign-channels" element={<ProtectedRoute><MasterDataCampaignChannels /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/campaign-types" element={<ProtectedRoute><MasterDataCampaignTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/counselling-types" element={<ProtectedRoute><MasterDataCounsellingTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/counselling-outcomes" element={<ProtectedRoute><MasterDataCounsellingOutcomes /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/marketing-channels" element={<ProtectedRoute><MasterDataMarketingChannels /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lead-scoring-rules" element={<ProtectedRoute><MasterDataLeadScoringRules /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lead-categories" element={<ProtectedRoute><MasterDataLeadCategories /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lead-qualification" element={<ProtectedRoute><MasterDataLeadQualification /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/utm-sources" element={<ProtectedRoute><MasterDataUtmSources /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/utm-mediums" element={<ProtectedRoute><MasterDataUtmMediums /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/utm-campaigns" element={<ProtectedRoute><MasterDataUtmCampaigns /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/follow-up-types" element={<ProtectedRoute><MasterDataFollowUpTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/follow-up-outcomes" element={<ProtectedRoute><MasterDataFollowUpOutcomes /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/enquiry-types" element={<ProtectedRoute><MasterDataEnquiryTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/referral-sources" element={<ProtectedRoute><MasterDataReferralSources /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lead-tags" element={<ProtectedRoute><MasterDataLeadTags /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/lost-reasons" element={<ProtectedRoute><MasterDataLostReasons /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic" element={<ProtectedRoute><MasterDataAcademic /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/sessions" element={<ProtectedRoute><MasterDataAcademicSessions /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/boards" element={<ProtectedRoute><MasterDataBoards /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/verticals" element={<ProtectedRoute><MasterDataVerticals /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/sub-verticals" element={<ProtectedRoute><MasterDataSubVerticals /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/programs" element={<ProtectedRoute><MasterDataPrograms /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/subjects" element={<ProtectedRoute><MasterDataSubjects /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/batch-types" element={<ProtectedRoute><MasterDataBatchTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/batches" element={<ProtectedRoute><MasterDataBatches /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/sections" element={<ProtectedRoute><MasterDataSections /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/mediums" element={<ProtectedRoute><MasterDataMediums /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/languages" element={<ProtectedRoute><MasterDataLanguages /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/streams" element={<ProtectedRoute><MasterDataStreams /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/semesters" element={<ProtectedRoute><MasterDataSemesters /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/terms" element={<ProtectedRoute><MasterDataTerms /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance" element={<ProtectedRoute><MasterDataFinance /></ProtectedRoute>} />
              <Route path="/studios/master-data/communication" element={<ProtectedRoute><MasterDataCommunication /></ProtectedRoute>} />
              <Route path="/studios/master-data/organization" element={<ProtectedRoute><MasterDataOrganization /></ProtectedRoute>} />
              <Route path="/studios/master-data/organization/designations" element={<ProtectedRoute><MasterDataDesignations /></ProtectedRoute>} />
              <Route path="/studios/master-data/organization/departments" element={<ProtectedRoute><MasterDataDepartments /></ProtectedRoute>} />
              <Route path="/studios/master-data/organization/teams" element={<ProtectedRoute><MasterDataTeams /></ProtectedRoute>} />
              <Route path="/studios/master-data/organization/branches" element={<ProtectedRoute><MasterDataBranches /></ProtectedRoute>} />
              <Route path="/studios/master-data/organization/companies" element={<ProtectedRoute><MasterDataCompanies /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr" element={<ProtectedRoute><MasterDataHR /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/employee-types" element={<ProtectedRoute><MasterDataEmployeeTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/employment-status" element={<ProtectedRoute><MasterDataEmploymentStatus /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales" element={<ProtectedRoute><MasterDataSales /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/opportunity-stages" element={<ProtectedRoute><MasterDataOpportunityStages /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/opportunity-types" element={<ProtectedRoute><MasterDataSalesOpportunityTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/quotation-statuses" element={<ProtectedRoute><MasterDataSalesQuotationStatuses /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/payment-statuses" element={<ProtectedRoute><MasterDataPaymentStatuses /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/invoice-types" element={<ProtectedRoute><MasterDataInvoiceTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/tax-slabs" element={<ProtectedRoute><MasterDataTaxSlabs /></ProtectedRoute>} />
              <Route path="/studios/master-data/sales/territories" element={<ProtectedRoute><MasterDataSalesTerritories /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/employee-categories" element={<ProtectedRoute><MasterDataEmployeeCategories /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/work-locations" element={<ProtectedRoute><MasterDataWorkLocations /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/skills" element={<ProtectedRoute><MasterDataSkills /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/experience-levels" element={<ProtectedRoute><MasterDataExperienceLevels /></ProtectedRoute>} />
              <Route path="/studios/master-data/hr/document-types" element={<ProtectedRoute><MasterDataDocumentTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/payment-modes" element={<ProtectedRoute><MasterDataPaymentModes /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/bank-accounts" element={<ProtectedRoute><MasterDataBankAccounts /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/tax-types" element={<ProtectedRoute><MasterDataTaxTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/gst-rates" element={<ProtectedRoute><MasterDataGstRates /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/expense-categories" element={<ProtectedRoute><MasterDataExpenseCategories /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/income-categories" element={<ProtectedRoute><MasterDataIncomeCategories /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/fee-categories" element={<ProtectedRoute><MasterDataFeeCategories /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/discount-categories" element={<ProtectedRoute><MasterDataDiscountCategories /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/currencies" element={<ProtectedRoute><MasterDataCurrencies /></ProtectedRoute>} />
              <Route path="/studios/master-data/finance/financial-years" element={<ProtectedRoute><MasterDataFinancialYears /></ProtectedRoute>} />
              <Route path="/studios/master-data/crm/industries" element={<ProtectedRoute><MasterDataIndustries /></ProtectedRoute>} />
              <Route path="/studios/master-data/academic/classrooms" element={<ProtectedRoute><MasterDataClassrooms /></ProtectedRoute>} />
              <Route path="/studios/master-data/communication/notification-types" element={<ProtectedRoute><MasterDataNotificationTypes /></ProtectedRoute>} />
              <Route path="/studios/master-data/communication/email-templates" element={<ProtectedRoute><MasterDataEmailTemplates /></ProtectedRoute>} />
              <Route path="/studios/master-data/communication/sms-templates" element={<ProtectedRoute><MasterDataSmsTemplates /></ProtectedRoute>} />
              <Route path="/studios/master-data/communication/whatsapp-templates" element={<ProtectedRoute><MasterDataWhatsAppTemplates /></ProtectedRoute>} />
              <Route path="/studios/master-data/system" element={<ProtectedRoute><MasterDataSystem /></ProtectedRoute>} />
              <Route path="/platform-studio" element={<ProtectedRoute><PlatformStudio /></ProtectedRoute>} />
              <Route path="/studios/forms" element={<ProtectedRoute><FormStudio /></ProtectedRoute>} />
              <Route path="/recruiting" element={<ProtectedRoute><RecruitingPage /></ProtectedRoute>} />
              <Route path="/examinations" element={<ProtectedRoute><ExamDashboard /></ProtectedRoute>} />
              <Route path="/studio/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
              <Route path="/studio/procurement" element={<ProtectedRoute><ProcurementDashboard /></ProtectedRoute>} />
              <Route path="/studio/lms" element={<ProtectedRoute><LMSDashboard /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/studio/dashboards" element={<ProtectedRoute><DashboardStudio /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><DocumentManagement /></ProtectedRoute>} />
              <Route path="/studios/intake" element={<ProtectedRoute><IntakeDashboard /></ProtectedRoute>} />
              <Route path="/studios/workflows" element={<ProtectedRoute><WorkflowStudio /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
          <DebugPanel />
          </DeveloperModeProvider>
        </BrowserRouter>
      </ConvexAuthProvider>
      </InstrumentationProvider>
    </>
  </StrictMode>,
);
