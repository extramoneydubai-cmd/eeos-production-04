import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexProvider } from "convex/react";
import { createSecureConvexClient } from "@/lib/convex-client";
import { useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components
import LoginPage from "./pages/Login.tsx";
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const AttendancePage = lazy(() => import("./pages/AttendancePage.tsx"));
const OrganizationStudio = lazy(() => import("./pages/OrganizationStudio.tsx"));
const UsersPage = lazy(() => import("./pages/UsersPage.tsx"));
const AccessControl = lazy(() => import("./pages/AccessControl.tsx"));
const AccessControlList = lazy(() => import("./pages/AccessControlList.tsx"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const DashboardCEO = lazy(() => import("./pages/DashboardCEO.tsx"));
const DashboardCounselor = lazy(() => import("./pages/DashboardCounselor.tsx"));
const LandingPage = lazy(() => import("./pages/Landing.tsx"));
const LeadWorkspaceDrawer = lazy(() => import("./pages/LeadWorkspaceDrawer.tsx"));
const TechnologyWorkspace = lazy(() => import("./pages/TechnologyWorkspace.tsx"));
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
const ExamSessionWorkspace = lazy(() => import("./pages/ExamSessionWorkspace.tsx"));
const CourseLibrary = lazy(() => import("./pages/CourseLibrary.tsx"));
const CourseWorkspace = lazy(() => import("./pages/CourseWorkspace.tsx"));
const LessonWorkspace = lazy(() => import("./pages/LessonWorkspace.tsx"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard.tsx"));
const FinanceReports = lazy(() => import("./pages/FinanceReports.tsx"));
const InvoiceWorkspace = lazy(() => import("./pages/InvoiceWorkspace.tsx"));
const RefundCenter = lazy(() => import("./pages/RefundCenter.tsx"));
const PdcWorkspace = lazy(() => import("./pages/PdcWorkspace.tsx"));
const ExpenseWorkspace = lazy(() => import("./pages/ExpenseWorkspace.tsx"));
const ProcurementDashboard = lazy(() => import("./pages/ProcurementDashboard.tsx"));
const LMSDashboard = lazy(() => import("./pages/LMSDashboard.tsx"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard.tsx"));
const DashboardStudio = lazy(() => import("./pages/DashboardStudio.tsx"));
const DocumentManagement = lazy(() => import("./pages/DocumentManagement.tsx"));
const IntakeDashboard = lazy(() => import("./pages/IntakeDashboard.tsx"));
const FormStudio = lazy(() => import("./pages/FormStudio.tsx"));
const WorkflowStudio = lazy(() => import("./pages/WorkflowStudio.tsx"));
const PeopleDatabase = lazy(() => import("./pages/PeopleDatabase.tsx"));
const PersonWorkspace = lazy(() => import("./pages/PersonWorkspace.tsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.tsx"));
const StudentDatabase = lazy(() => import("./pages/StudentDatabase.tsx"));
const StudentWorkspace = lazy(() => import("./pages/StudentWorkspace.tsx"));
const EmployeeDatabase = lazy(() => import("./pages/EmployeeDatabase.tsx"));
const EmployeeWorkspace = lazy(() => import("./pages/EmployeeWorkspace.tsx"));
const VendorDatabase = lazy(() => import("./pages/VendorDatabase.tsx"));
const VendorWorkspace = lazy(() => import("./pages/VendorWorkspace.tsx"));
const InventoryDatabase = lazy(() => import("./pages/InventoryDatabase.tsx"));
const InventoryWorkspace = lazy(() => import("./pages/InventoryWorkspace.tsx"));
const AssetWorkspace = lazy(() => import("./pages/AssetWorkspace.tsx"));
const AcademicDatabase = lazy(() => import("./pages/AcademicDatabase.tsx"));
const AcademicWorkspace = lazy(() => import("./pages/AcademicWorkspace.tsx"));
const AdministrationDashboard = lazy(() => import("./pages/AdministrationDashboard.tsx"));
const CommunicationMarketingDashboard = lazy(() => import("./pages/CommunicationMarketingDashboard.tsx"));
const CEOExecutiveDashboard = lazy(() => import("./pages/executive/CEOExecutiveDashboard.tsx"));
const RoleDashboard = lazy(() => import("./pages/executive/RoleDashboard.tsx"));
const GovernanceDashboard = lazy(() => import("./pages/GovernanceDashboard.tsx"));
const ConfigurationStudio = lazy(() => import("./pages/ConfigurationStudio.tsx"));
const EnterpriseHealthCenter = lazy(() => import("./pages/EnterpriseHealthCenter.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
import { RouteErrorBoundary } from "@/components/ui/route-error-boundary";
import { InstrumentationProvider } from "@/instrumentation";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { DeveloperModeProvider } from "@/contexts/DeveloperModeContext";
import { PageLoadingFallback } from "@/components/system/PageLoadingFallback";
import { FullPageLoading } from "@/components/system/FullPageLoading";
import { HealthMonitor } from "@/components/system/HealthMonitor";
import { useOnlineStatus } from "@/platform/core/offlineDetector";

// Runtime supervisor imports
import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";
import { reactRenderWatcher } from "@/platform/runtime/ReactRenderWatcher";
import { navigationSupervisor } from "@/platform/runtime/NavigationSupervisor";
import { convexSupervisor } from "@/platform/runtime/ConvexSupervisor";
import { sdkPerformanceMonitor } from "@/platform/runtime/SdkPerformanceMonitor";
import { memoryLeakDetector } from "@/platform/runtime/MemoryLeakDetector";
import { slowQueryDetector } from "@/platform/runtime/SlowQueryDetector";
import { sessionRecovery } from "@/platform/runtime/SessionRecovery";
import { workspaceRecovery } from "@/platform/runtime/WorkspaceRecovery";
import { unsavedWorkProtector } from "@/platform/runtime/UnsavedWorkProtector";
import { eventPipelineWatchdog } from "@/platform/runtime/EventPipelineWatchdog";
import { runtimeMetrics } from "@/platform/runtime/RuntimeMetrics";
import { runtimeSelfTest } from "@/platform/runtime/RuntimeSelfTest";
import { healthScoreEngine } from "@/platform/runtime/HealthScoreEngine";
import { buildGuard } from "@/platform/runtime/BuildGuard";
import { RuntimeOverlay } from "@/components/system/RuntimeOverlay";
import { QuickSchedulerProvider } from "@/components/scheduling/QuickSchedulerDialog";

// Global error boundary — wraps the entire React root
import { GlobalErrorBoundary } from "@/components/system/GlobalErrorBoundary";

// Production readiness imports
import { productionReadinessManager } from "@/platform/release/ProductionReadinessManager";
import { featureFlagManager } from "@/platform/release/FeatureFlagManager";
import { cacheManager } from "@/platform/release/CacheManager";
import { schemaCompatibility } from "@/platform/release/SchemaCompatibility";

// Offline banner component
function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-yellow-500 text-white text-[11px] font-medium text-center py-1.5">
      You are offline. Some features may be unavailable.
    </div>
  );
}

const convex = createSecureConvexClient();

/**
 * AppBoot — Initializes all runtime supervisors on app startup.
 * Runs once before the main app renders.
 */
function AppBoot() {
  useEffect(() => {
    // Run build guard validation (non-blocking)
    try {
      buildGuard.validate();
    } catch {}

    // Start RuntimeSupervisor
    RuntimeSupervisor.start(30000);

    // Start all monitors
    reactRenderWatcher.start();
    navigationSupervisor.start();
    convexSupervisor.start();
    sdkPerformanceMonitor.start();
    memoryLeakDetector.start();
    slowQueryDetector.start();
    sessionRecovery.start();
    workspaceRecovery.start();
    unsavedWorkProtector.start();
    eventPipelineWatchdog.start();
    runtimeMetrics.start();
    runtimeSelfTest.start();
    healthScoreEngine.start();

    // Initialize production readiness
    featureFlagManager.init();

    // Run production readiness validation
    Promise.resolve().then(async () => {
      try {
        const report = await productionReadinessManager.validate();
        if (report.state === "failed") {
          RuntimeSupervisor.emit("failure", "ProductionReadiness", "Blocked by readiness checks");
        }
        // Cleanup stale cache
        const cleaned = cacheManager.cleanup(3600000);
        if (cleaned > 0) {
          RuntimeSupervisor.emit("info", "CacheManager", `Cleaned ${cleaned} expired cache entries`);
        }
      } catch (err) {
        RuntimeSupervisor.emit("failure", "ProductionReadiness", `Readiness validation threw: ${err}`);
      }
    });

    // Emit platform ready
    RuntimeSupervisor.emit("info", "Platform", "EEOS Runtime Self-Healing Platform initialized");

    // Run self-test asynchronously
    Promise.resolve().then(() => {
      const results = runtimeSelfTest.runAll();
      if (results.some((r) => r.status === "fail")) {
        RuntimeSupervisor.emit("warning", "SelfTest", `${results.filter((r) => r.status === "fail").length} self-tests failed`);
      }
    });

    return () => {
      RuntimeSupervisor.stop();
      reactRenderWatcher.stop();
      navigationSupervisor.stop();
      convexSupervisor.stop();
      sdkPerformanceMonitor.stop();
      memoryLeakDetector.stop();
      slowQueryDetector.stop();
      sessionRecovery.stop();
      workspaceRecovery.stop();
      unsavedWorkProtector.stop();
      eventPipelineWatchdog.stop();
      runtimeMetrics.stop();
      runtimeSelfTest.stop();
      healthScoreEngine.stop();
    };
  }, []);

  return null;
}

function RouteSyncer() {
  const location = useLocation();

  // Notify navigation supervisor of route transitions
  useEffect(() => {
    navigationSupervisor.onNavigationComplete(location.pathname);
  }, [location.pathname]);

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
const ReleaseHealthDashboard = lazy(() => import("./pages/ReleaseHealthDashboard.tsx"));
const OperationsCenter = lazy(() => import("./pages/OperationsCenter.tsx"));
const OperationsCommandCenter = lazy(() => import("./pages/OperationsCommandCenter.tsx"));
const SecurityCenter = lazy(() => import("./pages/SecurityCenter.tsx"));
const AuditCenter = lazy(() => import("./pages/AuditCenter.tsx"));
const DeploymentCenter = lazy(() => import("./pages/DeploymentCenter.tsx"));
const SchedulingDashboard = lazy(() => import("./pages/SchedulingDashboard.tsx"));
const ScheduleWorkspace = lazy(() => import("./pages/ScheduleWorkspace.tsx"));
const SchedulerDashboard = lazy(() => import("./pages/SchedulerDashboard.tsx"));
const SchedulerWorkspace = lazy(() => import("./pages/SchedulerWorkspace.tsx"));
const FacultyScheduleWorkspace = lazy(() => import("./pages/FacultyScheduleWorkspace.tsx"));
const ResourceBookingWorkspace = lazy(() => import("./pages/ResourceBookingWorkspace.tsx"));
const SchedulingReports = lazy(() => import("./pages/SchedulingReports.tsx"));
const OrganizationCalendar = lazy(() => import("./pages/OrganizationCalendar.tsx"));
const ScheduleApprovalCenter = lazy(() => import("./pages/ScheduleApprovalCenter.tsx"));
const WorkflowMonitor = lazy(() => import("./pages/WorkflowMonitor.tsx"));
const TicketDatabase = lazy(() => import("./pages/TicketDatabase.tsx"));
const TicketWorkspace = lazy(() => import("./pages/TicketWorkspace.tsx"));
const SupportDashboard = lazy(() => import("./pages/SupportDashboard.tsx"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard.tsx"));
const MarketingCampaigns = lazy(() => import("./pages/MarketingCampaigns.tsx"));
const MarketingAnalytics = lazy(() => import("./pages/MarketingAnalytics.tsx"));
const HRDashboard = lazy(() => import("./pages/HRDashboard.tsx"));
const ProductionDashboard = lazy(() => import("./pages/ProductionDashboard.tsx"));
const Customer360 = lazy(() => import("./pages/Customer360.tsx"));
const AdmissionsDashboard = lazy(() => import("./pages/AdmissionsDashboard.tsx"));
const CollectionsExecutiveDashboard = lazy(() => import("./pages/CollectionsExecutiveDashboard.tsx"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase.tsx"));
const AdminConsole = lazy(() => import("./pages/AdminConsole.tsx"));
const DashboardParent = lazy(() => import("./pages/DashboardParent.tsx"));
const DashboardStudent = lazy(() => import("./pages/DashboardStudent.tsx"));
const DashboardFaculty = lazy(() => import("./pages/DashboardFaculty.tsx"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoadingFallback moduleName="App Layout" />}>
      {/* 
        Outer error boundary catches AppLayout/sidebar crashes.
        Keyed by pathname so navigating to a new route remounts it.
      */}
      <RouteErrorBoundary key={location.pathname} moduleName="AppLayout" showFullCrash>
        <AppLayout>
          {/* 
            Inner error boundary catches only the page content.
            Keyed by pathname+search so navigation/filter changes remount it.
            This isolates page crashes so sidebar+layout remain functional.
          */}
          <RouteErrorBoundary key={location.pathname + location.search} moduleName="Page">
            {children}
          </RouteErrorBoundary>
        </AppLayout>
      </RouteErrorBoundary>
    </Suspense>
  );
}

/** Route wrapper for the LeadWorkspaceDrawer drawer component. */
function LeadWorkspaceDrawerRoute() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  if (!leadId) return null;
  return (
    <LeadWorkspaceDrawer
      leadId={leadId}
      onClose={() => navigate("/crm/leads")}
      onOpenFull={() => navigate(`/crm/leads/${leadId}`)}
    />
  );
}

createRoot(document.getElementById("root")!).render(
    <GlobalErrorBoundary>
      <VlyToolbar />
      <InstrumentationProvider>      <ConvexProvider client={convex}>
        <BrowserRouter>
          <DeveloperModeProvider>
            <QuickSchedulerProvider>
            <AppBoot />
            <RouteSyncer />
            <Suspense fallback={<PageLoadingFallback moduleName="EEOS" />}>
              <Routes>
                <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/ceo" element={<ProtectedRoute><DashboardCEO /></ProtectedRoute>} />
              <Route path="/dashboard/counselor" element={<ProtectedRoute><DashboardCounselor /></ProtectedRoute>} />
              <Route path="/org" element={<ProtectedRoute><OrganizationStudio /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
              <Route path="/access" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
              <Route path="/access/list" element={<ProtectedRoute><AccessControlList /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/tasks/:taskId" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/messenger" element={<ProtectedRoute><MessengerPage /></ProtectedRoute>} />
              <Route path="/control" element={<ProtectedRoute><CEOExecutiveDashboard /></ProtectedRoute>} />
              <Route path="/executive/ceo" element={<ProtectedRoute><CEOExecutiveDashboard /></ProtectedRoute>} />
              <Route path="/executive/coo" element={<ProtectedRoute><RoleDashboard roleId="coo" /></ProtectedRoute>} />
              <Route path="/executive/cfo" element={<ProtectedRoute><RoleDashboard roleId="cfo" /></ProtectedRoute>} />
              <Route path="/executive/cto" element={<ProtectedRoute><RoleDashboard roleId="cto" /></ProtectedRoute>} />
              <Route path="/executive/cmo" element={<ProtectedRoute><RoleDashboard roleId="cmo" /></ProtectedRoute>} />
              <Route path="/executive/chro" element={<ProtectedRoute><RoleDashboard roleId="chro" /></ProtectedRoute>} />
              <Route path="/executive/cko" element={<ProtectedRoute><RoleDashboard roleId="cko" /></ProtectedRoute>} />
              <Route path="/executive/cpo" element={<ProtectedRoute><RoleDashboard roleId="cpo" /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><CrmDashboard /></ProtectedRoute>} />
              <Route path="/crm/leads" element={<ProtectedRoute><LeadDatabase /></ProtectedRoute>} />
              <Route path="/crm/leads/:leadId" element={<ProtectedRoute><LeadWorkspace /></ProtectedRoute>} />
              <Route path="/crm/leads/:leadId/drawer" element={<ProtectedRoute><LeadWorkspaceDrawerRoute /></ProtectedRoute>} />
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
              <Route path="/examinations/:sessionId" element={<ProtectedRoute><ExamSessionWorkspace /></ProtectedRoute>} />
              <Route path="/lms" element={<ProtectedRoute><LMSDashboard /></ProtectedRoute>} />
              <Route path="/lms/courses" element={<ProtectedRoute><CourseLibrary /></ProtectedRoute>} />
              <Route path="/lms/courses/:courseId" element={<ProtectedRoute><CourseWorkspace /></ProtectedRoute>} />
              <Route path="/lms/lessons/:lessonId" element={<ProtectedRoute><LessonWorkspace /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
              <Route path="/finance/reports" element={<ProtectedRoute><FinanceReports /></ProtectedRoute>} />
              <Route path="/finance/refunds" element={<ProtectedRoute><RefundCenter /></ProtectedRoute>} />
              <Route path="/finance/pdc" element={<ProtectedRoute><PdcWorkspace /></ProtectedRoute>} />
              <Route path="/finance/invoices/:id" element={<ProtectedRoute><InvoiceWorkspace /></ProtectedRoute>} />
              <Route path="/finance/expenses/:id" element={<ProtectedRoute><ExpenseWorkspace /></ProtectedRoute>} />
              <Route path="/procurement" element={<ProtectedRoute><ProcurementDashboard /></ProtectedRoute>} />
              <Route path="/procurement/vendors" element={<ProtectedRoute><VendorDatabase /></ProtectedRoute>} />
              <Route path="/procurement/vendors/:vendorId" element={<ProtectedRoute><VendorWorkspace /></ProtectedRoute>} />
              <Route path="/procurement/inventory" element={<ProtectedRoute><InventoryDatabase /></ProtectedRoute>} />
              <Route path="/procurement/inventory/:itemId" element={<ProtectedRoute><InventoryWorkspace /></ProtectedRoute>} />
              <Route path="/procurement/assets" element={<ProtectedRoute><AssetWorkspace /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
              <Route path="/analytics/basic" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/studio/technology" element={<ProtectedRoute><TechnologyWorkspace /></ProtectedRoute>} />
              <Route path="/studio/dashboards" element={<ProtectedRoute><DashboardStudio /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><DocumentManagement /></ProtectedRoute>} />
              <Route path="/studios/intake" element={<ProtectedRoute><IntakeDashboard /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute><StudentDatabase /></ProtectedRoute>} />
              <Route path="/students/:studentId" element={<ProtectedRoute><StudentWorkspace /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute><EmployeeDatabase /></ProtectedRoute>} />
              <Route path="/employees/:employeeId" element={<ProtectedRoute><EmployeeWorkspace /></ProtectedRoute>} />
              <Route path="/people" element={<ProtectedRoute><PeopleDatabase /></ProtectedRoute>} />
              <Route path="/people/:personId" element={<ProtectedRoute><PersonWorkspace /></ProtectedRoute>} />
              <Route path="/communication-marketing" element={<ProtectedRoute><CommunicationMarketingDashboard /></ProtectedRoute>} />
              <Route path="/administration" element={<ProtectedRoute><AdministrationDashboard /></ProtectedRoute>} />
              <Route path="/academic" element={<ProtectedRoute><AcademicDatabase /></ProtectedRoute>} />
              <Route path="/academic/:entityId" element={<ProtectedRoute><AcademicWorkspace /></ProtectedRoute>} />
              <Route path="/studios/workflows" element={<ProtectedRoute><WorkflowStudio /></ProtectedRoute>} />
              <Route path="/release-health" element={<ProtectedRoute><ReleaseHealthDashboard /></ProtectedRoute>} />
              <Route path="/security" element={<ProtectedRoute><SecurityCenter /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><AuditCenter /></ProtectedRoute>} />
              <Route path="/operations" element={<ProtectedRoute><OperationsCenter /></ProtectedRoute>} />
              <Route path="/command-center" element={<ProtectedRoute><OperationsCommandCenter /></ProtectedRoute>} />
              <Route path="/deployment" element={<ProtectedRoute><DeploymentCenter /></ProtectedRoute>} />
              <Route path="/scheduling" element={<ProtectedRoute><SchedulingDashboard /></ProtectedRoute>} />
              <Route path="/scheduling/:scheduleId" element={<ProtectedRoute><ScheduleWorkspace /></ProtectedRoute>} />
              <Route path="/scheduler" element={<ProtectedRoute><SchedulerDashboard /></ProtectedRoute>} />
              <Route path="/scheduler/:scheduleId" element={<ProtectedRoute><SchedulerWorkspace /></ProtectedRoute>} />
              <Route path="/scheduling/faculty/:facultyId" element={<ProtectedRoute><FacultyScheduleWorkspace /></ProtectedRoute>} />
              <Route path="/scheduling/resources/:resourceId" element={<ProtectedRoute><ResourceBookingWorkspace /></ProtectedRoute>} />
              <Route path="/scheduling/reports" element={<ProtectedRoute><SchedulingReports /></ProtectedRoute>} />
              <Route path="/organization-calendar" element={<ProtectedRoute><OrganizationCalendar /></ProtectedRoute>} />
              <Route path="/scheduling/approvals" element={<ProtectedRoute><ScheduleApprovalCenter /></ProtectedRoute>} />
              <Route path="/workflow-monitor" element={<ProtectedRoute><WorkflowMonitor /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><TicketDatabase /></ProtectedRoute>} />
              <Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketWorkspace /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><SupportDashboard /></ProtectedRoute>} />
              <Route path="/support/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
              <Route path="/marketing/campaigns" element={<ProtectedRoute><MarketingCampaigns /></ProtectedRoute>} />
              <Route path="/marketing/analytics" element={<ProtectedRoute><MarketingAnalytics /></ProtectedRoute>} />
              <Route path="/hr" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
              <Route path="/production" element={<ProtectedRoute><ProductionDashboard /></ProtectedRoute>} />
              <Route path="/customer360" element={<ProtectedRoute><Customer360 /></ProtectedRoute>} />
              <Route path="/admissions" element={<ProtectedRoute><AdmissionsDashboard /></ProtectedRoute>} />
              <Route path="/collections-executive" element={<ProtectedRoute><CollectionsExecutiveDashboard /></ProtectedRoute>} />
              <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminConsole /></ProtectedRoute>} />
              <Route path="/governance" element={<ProtectedRoute><GovernanceDashboard /></ProtectedRoute>} />
              <Route path="/configuration" element={<ProtectedRoute><ConfigurationStudio /></ProtectedRoute>} />
              <Route path="/enterprise-health" element={<ProtectedRoute><EnterpriseHealthCenter /></ProtectedRoute>} />
              <Route path="/parent" element={<ProtectedRoute><DashboardParent /></ProtectedRoute>} />
              <Route path="/student" element={<ProtectedRoute><DashboardStudent /></ProtectedRoute>} />
              <Route path="/faculty" element={<ProtectedRoute><DashboardFaculty /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
          <DebugPanel />
          <HealthMonitor />
          <RuntimeOverlay />
          <OfflineBanner />
          </QuickSchedulerProvider>
          </DeveloperModeProvider>
        </BrowserRouter>
      </ConvexProvider>
      </InstrumentationProvider>
    </GlobalErrorBoundary>
);
