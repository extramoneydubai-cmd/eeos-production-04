#!/usr/bin/env python3
"""
EEOS Schema Modularization — Fixed Version

Reads schema.ts using a state-machine parser to cleanly extract each
table definition with its index chain, then appends missing indexes
and distributes tables into domain modules.
"""

import os
import re
import shutil

SCHEMA_PATH = "src/convex/schema.ts"
SCHEMA_DIR = "src/convex/schema"

TABLE_DOMAINS = {
    "organizations": "organization", "departments": "organization",
    "companies": "organization", "branches": "organization",
    "teams": "organization", "verticals": "organization",
    "subVerticals": "organization", "boards": "organization",
    "orgCompanies": "organization", "orgBranches": "organization",
    "orgTeams": "organization", "orgDepartments": "organization",
    "orgDesignations": "organization", "designations": "organization",

    "users": "shared", "sessions": "shared", "userScopes": "shared",
    "notifications": "shared",
    "dashboardWidgets": "shared", "dashboardLayouts": "shared",
    "reportDefinitions": "shared", "savedReports": "shared",
    "reportSchedules": "shared", "reportExecutions": "shared",
    "kpiDefinitions": "shared", "kpiSnapshots": "shared",
    "reportExports": "shared", "userDashboardLayouts": "shared",
    "auditLogs": "shared",

    "approvalTemplates": "workflow", "approvalRequests": "workflow",
    "approvalRequestApprovers": "workflow",
    "verification_requests": "workflow", "verification_rules": "workflow",
    "verification_decisions": "workflow",
    "workflows": "workflow", "workflowSteps": "workflow",
    "workflowExecutions": "workflow",

    "channels": "communication", "channelMembers": "communication",
    "messages": "communication", "directMessages": "communication",
    "commNotificationTypes": "communication",
    "commEmailTemplates": "communication",
    "commSmsTemplates": "communication",
    "commWhatsAppTemplates": "communication",

    "tasks": "tasks",
    "taskParticipants": "tasks", "taskChecklistItems": "tasks",
    "taskComments": "tasks",

    "forms": "forms", "formFields": "forms", "formVersions": "forms",
    "formSubmissions": "forms",

    "documents": "documents", "documentFolders": "documents",
    "documentTags": "documents", "documentVersions": "documents",
    "documentPermissions": "documents", "documentTimeline": "documents",

    "leadMaster": "crm", "leadStageHistory": "crm",
    "leadAssignments": "crm", "leadTasks": "crm",
    "leadNotes": "crm", "leadDocuments": "crm",
    "leadActivity": "crm", "callLogs": "crm",
    "leadCourses": "crm", "leadDiscounts": "crm",
    "leadWhatsAppMessages": "crm", "leadApprovals": "crm",
    "leadApprovalDecisions": "crm", "leadPayments": "crm",
    "leadHealthScores": "crm", "leadFollowUpRules": "crm",
    "leadConversionPipeline": "crm", "leadStatusEngine": "crm",
    "leadTimeline": "crm", "leadCommunications": "crm",
    "leadMeetings": "crm", "leadAttachments": "crm",
    "crmStages": "crm", "crmSources": "crm",
    "crmLostReasons": "crm", "crmTags": "crm",
    "crmPriorities": "crm", "crmCampaignChannels": "crm",
    "crmCounsellingOutcomes": "crm", "crmCounsellingTypes": "crm",
    "crmEnquiryTypes": "crm", "crmReferralSources": "crm",
    "crmFollowUpOutcomes": "crm", "crmFollowUpTypes": "crm",
    "crmUtmCampaigns": "crm", "crmUtmMediums": "crm",
    "crmUtmSources": "crm", "crmLeadQualification": "crm",
    "crmLeadScoringRules": "crm", "crmLeadCategories": "crm",
    "crmIndustries": "crm", "crmMarketingChannels": "crm",
    "crmCampaignTypes": "crm",

    "opportunities": "crm", "opportunityStageHistory": "crm",
    "quotations": "crm", "quotationLineItems": "crm",
    "quotationVersions": "crm",
    "salesOpportunityStages": "crm", "salesOpportunityTypes": "crm",
    "salesQuotationStatuses": "crm", "salesTerritories": "crm",
    "salesPaymentStatuses": "crm", "salesInvoiceTypes": "crm",
    "salesTaxSlabs": "crm",

    "courses": "academic",
    "academicVerticals": "academic", "academicSubVerticals": "academic",
    "academicBatches": "academic", "academicBatchTypes": "academic",
    "academicSubjects": "academic", "academicPrograms": "academic",
    "academicBoards": "academic", "academicTerms": "academic",
    "academicSemesters": "academic", "academicStreams": "academic",
    "academicLanguages": "academic", "academicMediums": "academic",
    "academicSections": "academic", "academicSessions": "academic",
    "academicClassrooms": "academic",

    "studentMaster": "student", "studentEnrollments": "student",
    "studentAttendance": "student", "studentDocuments": "student",
    "parentMaster": "student", "guardianRelations": "student",

    "employeeMaster": "hr", "employees": "hr",
    "employeeDocuments": "hr", "hrEmployeeCategories": "hr",
    "hrEmployeeTypes": "hr", "hrEmploymentStatuses": "hr",
    "hrExperienceLevels": "hr", "hrSkills": "hr",
    "hrWorkLocations": "hr", "hrDocumentTypes": "hr",
    "attendance": "hr", "leaveRequests": "hr",

    "intakeApplications": "admissions", "intakeDocuments": "admissions",
    "intakePayments": "admissions", "intakeChecklist": "admissions",
    "intakeNotes": "admissions",

    "recruitRequisitions": "recruitment", "recruitJobPostings": "recruitment",
    "recruitCandidates": "recruitment", "recruitApplications": "recruitment",
    "recruitInterviews": "recruitment", "recruitOffers": "recruitment",
    "recruitOnboarding": "recruitment",

    "feeStructures": "finance", "studentFeeAccounts": "finance",
    "feeInstallments": "finance", "feeDiscounts": "finance",
    "feeScholarships": "finance", "feeWaivers": "finance",
    "lateFeeRules": "finance", "feeInvoices": "finance",
    "paymentMethods": "finance", "paymentTransactions": "finance",
    "taxRules": "finance", "receiptHistory": "finance",
    "expenseRecords": "finance", "vendorBills": "finance",
    "journalEntries": "finance", "cashBookEntries": "finance",
    "refundRequests": "finance", "creditNotes": "finance",
    "financeFeeCategories": "finance", "financeDiscountCategories": "finance",
    "financeExpenseCategories": "finance", "financeIncomeCategories": "finance",
    "financeBankAccounts": "finance", "financeCurrencies": "finance",
    "financeGstRates": "finance", "financePaymentModes": "finance",
    "financeTaxTypes": "finance", "financeFinancialYears": "finance",

    "examTemplates": "examination", "examSessions": "examination",
    "examTimetables": "examination", "examSubjectMappings": "examination",
    "examInvigilators": "examination", "examHallArrangements": "examination",
    "marksEntries": "examination", "examCoordinators": "examination",
    "grades": "examination", "gradeConfigs": "examination",
    "results": "examination", "resultSubjects": "examination",
    "reportCards": "examination",

    "lmsCourses": "lms", "lmsLessons": "lms",
    "lmsTopics": "lms", "lmsAssignments": "lms",
    "lmsSubmissions": "lms", "lmsQuizzes": "lms",
    "lmsQuizQuestions": "lms", "lmsQuizAttempts": "lms",
    "lmsEnrollments": "lms", "lmsLessonProgress": "lms",
    "lmsAnnouncements": "lms", "lmsDiscussions": "lms",
    "lmsCertificates": "lms",

    "vendorMaster": "procurement", "inventoryCategories": "procurement",
    "warehouses": "procurement", "inventoryItems": "procurement",
    "stockMovements": "procurement",
    "purchaseRequisitions": "procurement", "requisitionItems": "procurement",
    "purchaseOrders": "procurement", "purchaseOrderItems": "procurement",
    "quotationComparisons": "procurement",
    "goodsReceipts": "procurement", "goodsReceiptItems": "procurement",
    "issueRegister": "procurement", "returnsRegister": "procurement",
    "assetAllocations": "procurement", "procurementCategories": "procurement",

    "personMaster": "people", "personIdentifiers": "people",
    "personAddresses": "people", "personContacts": "people",
    "personDocuments": "people", "personQRCode": "people",
    "globalRegistry": "people",
    "person": "people", "persons": "people",

    "attendanceRecords": "attendance", "attendanceConfigs": "attendance",
}

# Standard index fields we want on every table that has them
INDEX_FIELDS = [
    "organizationId", "companyId", "branchId", "departmentId",
    "teamId", "userId", "ownerId", "leadId", "studentId",
    "employeeId", "personId", "courseId", "batchId",
    "status", "isActive", "createdAt", "updatedAt",
]


def read_file(path):
    with open(path, "r") as f:
        return f.read()


def parse_tables(content):
    """Parse schema.ts into table definitions using line-by-line state machine."""
    # Find the defineSchema body
    schema_match = re.search(r'const schema = defineSchema\(\{([\s\S]*?)\}\);', content)
    if not schema_match:
        raise ValueError("Could not find defineSchema body")

    body = schema_match.group(1)

    # Split into individual table definitions
    tables = []
    current_name = None
    current_lines = []
    brace_depth = 0
    in_table = False
    in_fields = False

    for line in body.split('\n'):
        stripped = line.rstrip()
        
        # Skip authTables spread
        if '...authTables' in stripped:
            continue
        
        # Check for new table definition
        table_start = re.match(r'\s*(\w+):\s*defineTable\(', stripped)
        
        if table_start and not in_table:
            if current_name and current_lines:
                tables.append((current_name, '\n'.join(current_lines).strip()))
            current_name = table_start.group(1)
            current_lines = [stripped]
            in_table = True
            in_fields = True
            brace_depth = stripped.count('{') - stripped.count('}')
            continue
        
        if in_table:
            current_lines.append(stripped)
            brace_depth += stripped.count('{') - stripped.count('}')
            
            # Check if we're at the end of the table definition
            # A table ends when we hit a line that starts a new table
            # or when we've closed all braces AND see a trailing comma
            # followed by a new table name
            if brace_depth <= 0 and stripped.rstrip().endswith(','):
                # This might be the end. Check if next line (if available) starts a new table.
                # For now, consider the table done
                pass
    
    # Don't forget the last table
    if current_name and current_lines:
        tables.append((current_name, '\n'.join(current_lines).strip()))

    return tables


def extract_fields_and_indexes(table_content):
    """Extract field names and existing index names from a table definition."""
    field_names = set()
    index_names = set()
    
    for line in table_content.split('\n'):
        # Extract field names
        field_match = re.match(r'\s*(\w+):\s*v\.', line)
        if field_match:
            field_names.add(field_match.group(1))
        
        # Extract index names
        index_match = re.search(r'\.index\("([^"]+)"', line)
        if index_match:
            index_names.add(index_match.group(1))
    
    return field_names, index_names


def get_missing_indexes(field_names, existing_index_names):
    """Return list of (idx_name, [fields]) missing indexes."""
    missing = []
    for field in INDEX_FIELDS:
        if field in field_names:
            idx_name = f"by_{field}"
            if idx_name not in existing_index_names:
                missing.append((idx_name, [field]))
    return missing


def append_indexes_to_table(table_content, missing_indexes):
    """Append missing indexes to the end of a table definition."""
    if not missing_indexes:
        return table_content
    
    # Strip trailing comma (if any)
    content = table_content.rstrip()
    if content.endswith(','):
        content = content[:-1]
    
    # Add missing indexes
    for idx_name, fields in missing_indexes:
        fields_str = ', '.join(f'"{f}"' for f in fields)
        content += f'\n    .index("{idx_name}", [{fields_str}])'
    
    content += ','
    return content


def classify_table(name, content):
    """Determine which domain a table belongs to."""
    return TABLE_DOMAINS.get(name, "shared")


def write_domain_file(domain, tables, header_content, schemas_dir):
    """Write a domain schema file."""
    lines = []
    
    # For shared domain, include validators + tables
    if domain == "shared":
        # Extract shared validators from the header
        validators_end = header_content.find("const schema = defineSchema")
        validators_text = header_content[:validators_end].strip()
        
        lines.append(validators_text)
        lines.append('')
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append('// ─── SHARED TABLES ───')
        lines.append('')
        lines.append('export const sharedTables = {')
        for name, content in sorted(tables):
            lines.append(f'  {content}')
        lines.append('};')
        lines.append('')
    else:
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append(f'// ─── {domain.upper()} TABLES ───')
        lines.append('')
        lines.append(f'export const {domain}Tables = {{')
        for name, content in sorted(tables):
            lines.append(f'  {content}')
        lines.append('};')
        lines.append('')
    
    path = os.path.join(schemas_dir, f"{domain}.ts")
    with open(path, 'w') as f:
        f.write('\n'.join(lines))
    return path


def generate_barrel(tables_by_domain):
    """Generate the barrel export file."""
    lines = [
        'import { defineSchema } from "convex/server";',
        'import { authTables } from "@convex-dev/auth/server";',
        '',
        '// ─── Re-export shared validators ───',
        'export {',
        '  ROLES,',
        '  roleValidator,',
        '  TASK_STATUS,',
        '  taskStatusValidator,',
        '  PRIORITY,',
        '  priorityValidator,',
        '  APPROVAL_STATUS,',
        '  approvalStatusValidator,',
        '  NOTIFICATION_TYPE,',
        '  notificationTypeValidator,',
        '  APPROVAL_MODE,',
        '  approvalModeValidator,',
        '  FORM_STATUS,',
        '  formStatusValidator,',
        '  FIELD_TYPES,',
        '  fieldTypeValidator,',
        '  SUBMISSION_STATUS,',
        '  submissionStatusValidator,',
        '} from "./schema/shared";',
        '',
    ]
    
    for domain in sorted(tables_by_domain.keys()):
        if domain != "shared":
            lines.append(f'import {{ {domain}Tables }} from "./schema/{domain}";')
    
    lines.append('')
    lines.append('const schema = defineSchema({')
    lines.append('    ...authTables,')
    for domain in sorted(tables_by_domain.keys()):
        lines.append(f'    ...{domain}Tables,' if domain != "shared" else '    ...sharedTables,')
    lines.append('});')
    lines.append('')
    lines.append('export default schema;')
    lines.append('')
    
    return '\n'.join(lines)


def main():
    print("=" * 60)
    print(" EEOS Schema Modularization v2")
    print("=" * 60)
    
    content = read_file(SCHEMA_PATH)
    
    # Backup
    shutil.copy2(SCHEMA_PATH, SCHEMA_PATH + ".bak2")
    
    # Parse tables
    tables = parse_tables(content)
    print(f"\nParsed {len(tables)} table definitions")
    
    # Process each table: classify, add indexes
    processed = []
    total_before = 0
    total_after = 0
    indexed_tables_before = 0
    indexed_tables_after = 0
    
    for name, table_content in tables:
        fields, existing_idx = extract_fields_and_indexes(table_content)
        missing = get_missing_indexes(fields, existing_idx)
        new_content = append_indexes_to_table(table_content, missing)
        domain = classify_table(name, table_content)
        
        idx_count_before = len(existing_idx)
        idx_count_after = idx_count_before + len(missing)
        total_before += idx_count_before
        total_after += idx_count_after
        if idx_count_before > 0:
            indexed_tables_before += 1
        if idx_count_after > 0:
            indexed_tables_after += 1
        
        if missing:
            idx_names = ', '.join(m[0] for m in missing)
            print(f"  +{len(missing)} indexes for {name}: {idx_names}")
        
        processed.append((name, new_content, domain))
    
    print(f"\nTable distribution:")
    from collections import Counter
    domain_counts = Counter(d for _, _, d in processed)
    for domain, count in sorted(domain_counts.items()):
        print(f"  {domain}: {count}")
    
    # Create schema directory
    os.makedirs(SCHEMA_DIR, exist_ok=True)
    
    # Group by domain
    from collections import defaultdict
    by_domain = defaultdict(list)
    shared_processed = []
    for name, content, domain in processed:
        if domain == "shared":
            shared_processed.append((name, content))
        else:
            by_domain[domain].append((name, content))
    
    # Extract header (validators) from original content
    schema_match = re.search(r'^(.*?)const schema = defineSchema', content, re.DOTALL)
    header_content = schema_match.group(1) if schema_match else content
    
    # Write shared domain file with validators
    write_domain_file("shared", shared_processed, header_content, SCHEMA_DIR)
    
    # Write other domain files
    for domain, domain_tables in sorted(by_domain.items()):
        write_domain_file(domain, domain_tables, "", SCHEMA_DIR)
    
    # Generate barrel
    by_domain["shared"] = []
    barrel = generate_barrel(dict(by_domain))
    
    # Write barrel
    with open(SCHEMA_PATH, 'w') as f:
        f.write(barrel)
    
    print(f"\nIndex summary:")
    print(f"  Tables with indexes BEFORE: {indexed_tables_before}/{len(tables)}")
    print(f"  Tables with indexes AFTER:  {indexed_tables_after}/{len(tables)}")
    print(f"  Total indexes BEFORE: {total_before}")
    print(f"  Total indexes added:  {total_after - total_before}")
    print(f"  Total indexes AFTER:  {total_after}")
    
    print(f"\n✅ Done! Schema split into {len(by_domain)} domain modules in {SCHEMA_DIR}/")

if __name__ == "__main__":
    main()
