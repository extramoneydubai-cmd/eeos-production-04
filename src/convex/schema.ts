import { defineSchema } from "convex/server";
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
});
export default schema;