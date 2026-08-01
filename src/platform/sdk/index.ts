/**
 * PlatformSDK — Unified Enterprise Data Layer
 *
 * Single import for ALL page-consumable SDK methods.
 * Every page MUST import from here instead of calling api.xxx directly.
 *
 * NOTE: PlatformSDK handler files under src/platform/sdk/ are NOT registered
 * Convex modules (only src/convex/ is deployed). Pages must call the generated
 * api directly, e.g. api.studentEngine.listStudents or api.finance.*.
 *
 * Usage (pages):
 *   import { api } from "@/convex/_generated/api";
 *   const students = await api.studentEngine.listStudents({ branchId });
 */

import * as academic from "./academicSdk";
import * as attendance from "./attendanceSdk";
import * as audit from "./auditSdk";
import * as automation from "./automationSdk";
import * as calendar from "./calendarSdk";
import * as communication from "./communicationSdk";
import * as crm from "./crmSdk";
import * as dashboard from "./dashboardSdk";
import * as documents from "./documentSdk";
import * as events from "./eventSdk";
import * as finance from "./financeSdk";
import * as grid from "./gridSdk";
import * as health from "./healthSdk";
import * as hr from "./hrSdk";
import * as integration from "./integrationSdk";
import * as lms from "./lmsSdk";
import * as marketing from "./marketingSdk";
import * as notifications from "./notificationSdk";
import * as parent from "./parentSdk";
import * as people from "./peopleSdk";
import * as permissions from "./permissionSdk";
import * as procurement from "./procurementSdk";
import * as production from "./productionSdk";
import * as reports from "./reportSdk";
import * as scheduling from "./schedulingSdk";
import * as search from "./searchSdk";
import * as students from "./studentSdk";
import * as tasks from "./taskSdk";
import * as timeline from "./timelineSdk";
import * as visibility from "./visibilitySdk";
import * as whiteLabel from "./whiteLabelSdk";
import * as workflow from "./workflowSdk";
import * as ai from "./aiSdk";

export const PlatformSDK = {
  academic,
  attendance,
  audit,
  automation,
  calendar,
  communication,
  crm,
  dashboard,
  documents,
  events,
  finance,
  grid,
  health,
  hr,
  integration,
  lms,
  marketing,
  notifications,
  parent,
  people,
  permissions,
  procurement,
  production,
  reports,
  scheduling,
  search,
  students,
  tasks,
  timeline,
  visibility,
  whiteLabel,
  workflow,
  ai,
} as const;

export type PlatformSDKType = typeof PlatformSDK;
