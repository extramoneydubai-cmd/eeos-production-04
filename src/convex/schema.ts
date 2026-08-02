import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

import { sharedTables } from "./schema/shared";

export {
  ROLES, roleValidator,
  TASK_STATUS, taskStatusValidator,
  PRIORITY, priorityValidator,
  APPROVAL_STATUS, approvalStatusValidator,
  NOTIFICATION_TYPE, notificationTypeValidator,
  APPROVAL_MODE, approvalModeValidator,
  FORM_STATUS, formStatusValidator,
  FIELD_TYPES, fieldTypeValidator,
  SUBMISSION_STATUS, submissionStatusValidator,
} from "./schema/shared";

import { academicTables } from "./schema/academic";
import { communicationTables } from "./schema/communication";
import { crmTables } from "./schema/crm";
import { documentsTables } from "./schema/documents";
import { examinationTables } from "./schema/examination";
import { financeTables } from "./schema/finance";
import { formsTables } from "./schema/forms";
import { hrTables } from "./schema/hr";
import { lmsTables } from "./schema/lms";
import { organizationTables } from "./schema/organization";
import { peopleTables } from "./schema/people";
import { procurementTables } from "./schema/procurement";
import { studentTables } from "./schema/student";
import { tasksTables } from "./schema/tasks";
import { workflowTables } from "./schema/workflow";
import { analyticsTables } from "./schema/analytics";
import { calendarTables } from "./schema/calendar";
import { schedulingTables } from "./schema/scheduling";
import { supportTables } from "./schema/support";
import { technologyTables } from "./schema/technology";
import { adminOpsTables } from "./schema/adminOps";
import { accessControlTables } from "./schema/accessControl";
import { dynamicMenusTables } from "./schema/dynamicMenus";
import { metadataTables } from "./schema/metadata";
import { enterpriseTables } from "./schema/enterprise";

// Extended users table — accept any fields since our app adds dynamic
// fields via patches across multiple modules
const extendedUsersTable = defineTable(v.any())
  .index("by_createdAt", ["createdAt"])
  .index("by_email", ["email"])
  .index("by_department", ["departmentId"])
  .index("username", ["username"]);

// Extended sessions table — explicitly add token index for session validation
const extendedSessionsTable = defineTable(v.any()).index("token", ["token"]);

const schema = defineSchema({
    ...authTables,
    ...academicTables,
    ...communicationTables,
    ...crmTables,
    ...documentsTables,
    ...examinationTables,
    ...financeTables,
    ...formsTables,
    ...hrTables,
    ...lmsTables,
    ...organizationTables,
    ...peopleTables,
    ...procurementTables,
    ...sharedTables,
    ...studentTables,
    ...tasksTables,
    ...workflowTables,
    ...analyticsTables,
    ...calendarTables,
    ...schedulingTables,
    ...accessControlTables,
    ...dynamicMenusTables,
    ...metadataTables,
    ...supportTables,
    ...technologyTables,
    ...adminOpsTables,
    ...enterpriseTables,
    // Override authTables tables with our extended definitions
    users: extendedUsersTable,
    sessions: extendedSessionsTable,
});
export default schema;
