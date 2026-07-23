/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicBatchTypes from "../academicBatchTypes.js";
import type * as academicBatches from "../academicBatches.js";
import type * as academicBoards from "../academicBoards.js";
import type * as academicClassrooms from "../academicClassrooms.js";
import type * as academicLanguages from "../academicLanguages.js";
import type * as academicMediums from "../academicMediums.js";
import type * as academicPrograms from "../academicPrograms.js";
import type * as academicSections from "../academicSections.js";
import type * as academicSemesters from "../academicSemesters.js";
import type * as academicSessions from "../academicSessions.js";
import type * as academicStreams from "../academicStreams.js";
import type * as academicSubVerticals from "../academicSubVerticals.js";
import type * as academicSubjects from "../academicSubjects.js";
import type * as academicTerms from "../academicTerms.js";
import type * as academicVerticals from "../academicVerticals.js";
import type * as analyticsEngine from "../analyticsEngine.js";
import type * as approvals from "../approvals.js";
import type * as assignmentEngine from "../assignmentEngine.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as authHelpers from "../authHelpers.js";
import type * as billingEngine from "../billingEngine.js";
import type * as collectionEngine from "../collectionEngine.js";
import type * as commEmailTemplates from "../commEmailTemplates.js";
import type * as commNotificationTypes from "../commNotificationTypes.js";
import type * as commSmsTemplates from "../commSmsTemplates.js";
import type * as commWhatsAppTemplates from "../commWhatsAppTemplates.js";
import type * as crm from "../crm.js";
import type * as crmActivity from "../crmActivity.js";
import type * as crmApprovals from "../crmApprovals.js";
import type * as crmCalls from "../crmCalls.js";
import type * as crmCampaignChannels from "../crmCampaignChannels.js";
import type * as crmCampaignTypes from "../crmCampaignTypes.js";
import type * as crmCounsellingOutcomes from "../crmCounsellingOutcomes.js";
import type * as crmCounsellingTypes from "../crmCounsellingTypes.js";
import type * as crmCourses from "../crmCourses.js";
import type * as crmDashboard from "../crmDashboard.js";
import type * as crmDiscounts from "../crmDiscounts.js";
import type * as crmDocuments from "../crmDocuments.js";
import type * as crmEnquiryTypes from "../crmEnquiryTypes.js";
import type * as crmFollowUpOutcomes from "../crmFollowUpOutcomes.js";
import type * as crmFollowUpTypes from "../crmFollowUpTypes.js";
import type * as crmHelpers from "../crmHelpers.js";
import type * as crmIndustries from "../crmIndustries.js";
import type * as crmLeadCategories from "../crmLeadCategories.js";
import type * as crmLeadQualification from "../crmLeadQualification.js";
import type * as crmLeadScoringRules from "../crmLeadScoringRules.js";
import type * as crmLeads from "../crmLeads.js";
import type * as crmLostReasons from "../crmLostReasons.js";
import type * as crmMarketingChannels from "../crmMarketingChannels.js";
import type * as crmNotes from "../crmNotes.js";
import type * as crmPayments from "../crmPayments.js";
import type * as crmPriorities from "../crmPriorities.js";
import type * as crmReferralSources from "../crmReferralSources.js";
import type * as crmSales from "../crmSales.js";
import type * as crmSources from "../crmSources.js";
import type * as crmStages from "../crmStages.js";
import type * as crmTags from "../crmTags.js";
import type * as crmTasks from "../crmTasks.js";
import type * as crmUtmCampaigns from "../crmUtmCampaigns.js";
import type * as crmUtmMediums from "../crmUtmMediums.js";
import type * as crmUtmSources from "../crmUtmSources.js";
import type * as crmWhatsApp from "../crmWhatsApp.js";
import type * as dashboard from "../dashboard.js";
import type * as demo_auth from "../demo/auth.js";
import type * as demo_data from "../demo/data.js";
import type * as demo_queries from "../demo/queries.js";
import type * as demo_seed from "../demo/seed.js";
import type * as engines_accessControlEngine from "../engines/accessControlEngine.js";
import type * as engines_activityEngine from "../engines/activityEngine.js";
import type * as engines_attachmentEngine from "../engines/attachmentEngine.js";
import type * as engines_auditEngine from "../engines/auditEngine.js";
import type * as engines_commentEngine from "../engines/commentEngine.js";
import type * as engines_notificationEngine from "../engines/notificationEngine.js";
import type * as engines_seedEngine from "../engines/seedEngine.js";
import type * as engines_sequenceEngine from "../engines/sequenceEngine.js";
import type * as engines_timelineEngine from "../engines/timelineEngine.js";
import type * as enrollmentEngine from "../enrollmentEngine.js";
import type * as feeEngine from "../feeEngine.js";
import type * as financeBankAccounts from "../financeBankAccounts.js";
import type * as financeCurrencies from "../financeCurrencies.js";
import type * as financeDiscountCategories from "../financeDiscountCategories.js";
import type * as financeExpenseCategories from "../financeExpenseCategories.js";
import type * as financeFeeCategories from "../financeFeeCategories.js";
import type * as financeFinancialYears from "../financeFinancialYears.js";
import type * as financeGstRates from "../financeGstRates.js";
import type * as financeIncomeCategories from "../financeIncomeCategories.js";
import type * as financePaymentModes from "../financePaymentModes.js";
import type * as financeTaxTypes from "../financeTaxTypes.js";
import type * as formEngine from "../formEngine.js";
import type * as github from "../github.js";
import type * as hrDocumentTypes from "../hrDocumentTypes.js";
import type * as hrEmployeeCategories from "../hrEmployeeCategories.js";
import type * as hrEmployeeTypes from "../hrEmployeeTypes.js";
import type * as hrEmploymentStatuses from "../hrEmploymentStatuses.js";
import type * as hrExperienceLevels from "../hrExperienceLevels.js";
import type * as hrSkills from "../hrSkills.js";
import type * as hrWorkLocations from "../hrWorkLocations.js";
import type * as http from "../http.js";
import type * as intakeEngine from "../intakeEngine.js";
import type * as integrations_github from "../integrations/github.js";
import type * as invoiceEngine from "../invoiceEngine.js";
import type * as leadActivityEngine from "../leadActivityEngine.js";
import type * as leadCommunicationEngine from "../leadCommunicationEngine.js";
import type * as leadConversionEngine from "../leadConversionEngine.js";
import type * as leadHealthEngine from "../leadHealthEngine.js";
import type * as leadLifecycle from "../leadLifecycle.js";
import type * as leadMeetingEngine from "../leadMeetingEngine.js";
import type * as messenger from "../messenger.js";
import type * as notifications from "../notifications.js";
import type * as opportunities from "../opportunities.js";
import type * as organization from "../organization.js";
import type * as organization_branches from "../organization/branches.js";
import type * as organization_departments from "../organization/departments.js";
import type * as organization_organizations from "../organization/organizations.js";
import type * as organization_teams from "../organization/teams.js";
import type * as organizationBranches from "../organizationBranches.js";
import type * as organizationCompanies from "../organizationCompanies.js";
import type * as organizationDepartments from "../organizationDepartments.js";
import type * as organizationDesignations from "../organizationDesignations.js";
import type * as organizationTeams from "../organizationTeams.js";
import type * as paymentEngine from "../paymentEngine.js";
import type * as quotations from "../quotations.js";
import type * as salesInvoiceTypes from "../salesInvoiceTypes.js";
import type * as salesOpportunityStages from "../salesOpportunityStages.js";
import type * as salesOpportunityTypes from "../salesOpportunityTypes.js";
import type * as salesPaymentStatuses from "../salesPaymentStatuses.js";
import type * as salesPerformance from "../salesPerformance.js";
import type * as salesQuotationStatuses from "../salesQuotationStatuses.js";
import type * as salesTaxSlabs from "../salesTaxSlabs.js";
import type * as salesTerritories from "../salesTerritories.js";
import type * as seed from "../seed.js";
import type * as slaEngine from "../slaEngine.js";
import type * as studentLifecycle from "../studentLifecycle.js";
import type * as tasks from "../tasks.js";
import type * as userManagement from "../userManagement.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";
import type * as workflowEngine from "../workflowEngine.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academicBatchTypes: typeof academicBatchTypes;
  academicBatches: typeof academicBatches;
  academicBoards: typeof academicBoards;
  academicClassrooms: typeof academicClassrooms;
  academicLanguages: typeof academicLanguages;
  academicMediums: typeof academicMediums;
  academicPrograms: typeof academicPrograms;
  academicSections: typeof academicSections;
  academicSemesters: typeof academicSemesters;
  academicSessions: typeof academicSessions;
  academicStreams: typeof academicStreams;
  academicSubVerticals: typeof academicSubVerticals;
  academicSubjects: typeof academicSubjects;
  academicTerms: typeof academicTerms;
  academicVerticals: typeof academicVerticals;
  analyticsEngine: typeof analyticsEngine;
  approvals: typeof approvals;
  assignmentEngine: typeof assignmentEngine;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  authHelpers: typeof authHelpers;
  billingEngine: typeof billingEngine;
  collectionEngine: typeof collectionEngine;
  commEmailTemplates: typeof commEmailTemplates;
  commNotificationTypes: typeof commNotificationTypes;
  commSmsTemplates: typeof commSmsTemplates;
  commWhatsAppTemplates: typeof commWhatsAppTemplates;
  crm: typeof crm;
  crmActivity: typeof crmActivity;
  crmApprovals: typeof crmApprovals;
  crmCalls: typeof crmCalls;
  crmCampaignChannels: typeof crmCampaignChannels;
  crmCampaignTypes: typeof crmCampaignTypes;
  crmCounsellingOutcomes: typeof crmCounsellingOutcomes;
  crmCounsellingTypes: typeof crmCounsellingTypes;
  crmCourses: typeof crmCourses;
  crmDashboard: typeof crmDashboard;
  crmDiscounts: typeof crmDiscounts;
  crmDocuments: typeof crmDocuments;
  crmEnquiryTypes: typeof crmEnquiryTypes;
  crmFollowUpOutcomes: typeof crmFollowUpOutcomes;
  crmFollowUpTypes: typeof crmFollowUpTypes;
  crmHelpers: typeof crmHelpers;
  crmIndustries: typeof crmIndustries;
  crmLeadCategories: typeof crmLeadCategories;
  crmLeadQualification: typeof crmLeadQualification;
  crmLeadScoringRules: typeof crmLeadScoringRules;
  crmLeads: typeof crmLeads;
  crmLostReasons: typeof crmLostReasons;
  crmMarketingChannels: typeof crmMarketingChannels;
  crmNotes: typeof crmNotes;
  crmPayments: typeof crmPayments;
  crmPriorities: typeof crmPriorities;
  crmReferralSources: typeof crmReferralSources;
  crmSales: typeof crmSales;
  crmSources: typeof crmSources;
  crmStages: typeof crmStages;
  crmTags: typeof crmTags;
  crmTasks: typeof crmTasks;
  crmUtmCampaigns: typeof crmUtmCampaigns;
  crmUtmMediums: typeof crmUtmMediums;
  crmUtmSources: typeof crmUtmSources;
  crmWhatsApp: typeof crmWhatsApp;
  dashboard: typeof dashboard;
  "demo/auth": typeof demo_auth;
  "demo/data": typeof demo_data;
  "demo/queries": typeof demo_queries;
  "demo/seed": typeof demo_seed;
  "engines/accessControlEngine": typeof engines_accessControlEngine;
  "engines/activityEngine": typeof engines_activityEngine;
  "engines/attachmentEngine": typeof engines_attachmentEngine;
  "engines/auditEngine": typeof engines_auditEngine;
  "engines/commentEngine": typeof engines_commentEngine;
  "engines/notificationEngine": typeof engines_notificationEngine;
  "engines/seedEngine": typeof engines_seedEngine;
  "engines/sequenceEngine": typeof engines_sequenceEngine;
  "engines/timelineEngine": typeof engines_timelineEngine;
  enrollmentEngine: typeof enrollmentEngine;
  feeEngine: typeof feeEngine;
  financeBankAccounts: typeof financeBankAccounts;
  financeCurrencies: typeof financeCurrencies;
  financeDiscountCategories: typeof financeDiscountCategories;
  financeExpenseCategories: typeof financeExpenseCategories;
  financeFeeCategories: typeof financeFeeCategories;
  financeFinancialYears: typeof financeFinancialYears;
  financeGstRates: typeof financeGstRates;
  financeIncomeCategories: typeof financeIncomeCategories;
  financePaymentModes: typeof financePaymentModes;
  financeTaxTypes: typeof financeTaxTypes;
  formEngine: typeof formEngine;
  github: typeof github;
  hrDocumentTypes: typeof hrDocumentTypes;
  hrEmployeeCategories: typeof hrEmployeeCategories;
  hrEmployeeTypes: typeof hrEmployeeTypes;
  hrEmploymentStatuses: typeof hrEmploymentStatuses;
  hrExperienceLevels: typeof hrExperienceLevels;
  hrSkills: typeof hrSkills;
  hrWorkLocations: typeof hrWorkLocations;
  http: typeof http;
  intakeEngine: typeof intakeEngine;
  "integrations/github": typeof integrations_github;
  invoiceEngine: typeof invoiceEngine;
  leadActivityEngine: typeof leadActivityEngine;
  leadCommunicationEngine: typeof leadCommunicationEngine;
  leadConversionEngine: typeof leadConversionEngine;
  leadHealthEngine: typeof leadHealthEngine;
  leadLifecycle: typeof leadLifecycle;
  leadMeetingEngine: typeof leadMeetingEngine;
  messenger: typeof messenger;
  notifications: typeof notifications;
  opportunities: typeof opportunities;
  organization: typeof organization;
  "organization/branches": typeof organization_branches;
  "organization/departments": typeof organization_departments;
  "organization/organizations": typeof organization_organizations;
  "organization/teams": typeof organization_teams;
  organizationBranches: typeof organizationBranches;
  organizationCompanies: typeof organizationCompanies;
  organizationDepartments: typeof organizationDepartments;
  organizationDesignations: typeof organizationDesignations;
  organizationTeams: typeof organizationTeams;
  paymentEngine: typeof paymentEngine;
  quotations: typeof quotations;
  salesInvoiceTypes: typeof salesInvoiceTypes;
  salesOpportunityStages: typeof salesOpportunityStages;
  salesOpportunityTypes: typeof salesOpportunityTypes;
  salesPaymentStatuses: typeof salesPaymentStatuses;
  salesPerformance: typeof salesPerformance;
  salesQuotationStatuses: typeof salesQuotationStatuses;
  salesTaxSlabs: typeof salesTaxSlabs;
  salesTerritories: typeof salesTerritories;
  seed: typeof seed;
  slaEngine: typeof slaEngine;
  studentLifecycle: typeof studentLifecycle;
  tasks: typeof tasks;
  userManagement: typeof userManagement;
  users: typeof users;
  verification: typeof verification;
  workflowEngine: typeof workflowEngine;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
