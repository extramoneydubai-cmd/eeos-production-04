import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

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

import { sharedTables } from "./schema/shared";
import { academicTables } from "./schema/academic";
import { admissionsTables } from "./schema/admissions";
import { communicationTables } from "./schema/communication";
import { crmTables } from "./schema/crm";
import { financeTables } from "./schema/finance";
import { formsTables } from "./schema/forms";
import { hrTables } from "./schema/hr";
import { organizationTables } from "./schema/organization";
import { peopleTables } from "./schema/people";
import { studentTables } from "./schema/student";
import { tasksTables } from "./schema/tasks";
import { workflowTables } from "./schema/workflow";

const schema = defineSchema({
    ...authTables,
    ...academicTables,
    ...admissionsTables,
    ...communicationTables,
    ...crmTables,
    ...financeTables,
    ...formsTables,
    ...hrTables,
    ...organizationTables,
    ...peopleTables,
    ...sharedTables,
    ...studentTables,
    ...tasksTables,
    ...workflowTables,
});
export default schema;