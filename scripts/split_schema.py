#!/usr/bin/env python3
"""
EEOS Schema Modularization Script
- Reads src/convex/schema.ts
- Parses all table definitions
- Classifies by domain
- Generates domain schema files in src/convex/schema/
- Creates barrel export in schema.ts
- Adds indexes to every table
"""

import os
import re
import shutil

SCHEMA_PATH = "src/convex/schema.ts"
SCHEMA_DIR = "src/convex/schema"

# ─── Domain classification ───
TABLE_DOMAINS = {
    # Organization
    "organizations": "organization",
    "departments": "organization",
    "companies": "organization",
    "branches": "organization",
    "teams": "organization",
    "verticals": "organization",
    "subVerticals": "organization",
    "boards": "organization",
    "orgCompanies": "organization",
    "orgBranches": "organization",
    "orgTeams": "organization",
    "orgDepartments": "organization",
    "orgDesignations": "organization",
    "designations": "organization",

    # Platform / Shared
    "users": "shared",
    "sessions": "shared",
    "userScopes": "shared",
    "tasks": "shared",
    "taskParticipants": "shared",
    "taskChecklistItems": "shared",
    "taskComments": "shared",
    "notifications": "shared",
    "forms": "shared",
    "formFields": "shared",
    "formVersions": "shared",
    "formSubmissions": "shared",
    "workflows": "shared",
    "workflowSteps": "shared",
    "workflowExecutions": "shared",
    "documents": "shared",
    "documentFolders": "shared",
    "documentTags": "shared",
    "documentVersions": "shared",
    "documentPermissions": "shared",
    "documentTimeline": "shared",
    "auditLogs": "shared",
    "reportDefinitions": "shared",
    "savedReports": "shared",
    "reportSchedules": "shared",
    "reportExecutions": "shared",
    "kpiDefinitions": "shared",
    "kpiSnapshots": "shared",
    "userDashboardLayouts": "shared",
    "reportExports": "shared",
    "dashboardWidgets": "shared",
    "dashboardLayouts": "shared",

    # Approval & Workflow
    "approvalTemplates": "workflow",
    "approvalRequests": "workflow",
    "approvalRequestApprovers": "workflow",
    "verification_requests": "workflow",
    "verification_rules": "workflow",
    "verification_decisions": "workflow",

    # Communication
    "channels": "communication",
    "channelMembers": "communication",
    "messages": "communication",
    "directMessages": "communication",
    "commNotificationTypes": "communication",
    "commEmailTemplates": "communication",
    "commSmsTemplates": "communication",
    "commWhatsAppTemplates": "communication",

    # CRM
    "leadMaster": "crm",
    "leadStageHistory": "crm",
    "leadAssignments": "crm",
    "leadTasks": "crm",
    "leadNotes": "crm",
    "leadDocuments": "crm",
    "leadActivity": "crm",
    "callLogs": "crm",
    "leadCourses": "crm",
    "leadDiscounts": "crm",
    "leadWhatsAppMessages": "crm",
    "leadApprovals": "crm",
    "leadApprovalDecisions": "crm",
    "leadPayments": "crm",
    "leadHealthScores": "crm",
    "leadFollowUpRules": "crm",
    "leadConversionPipeline": "crm",
    "leadStatusEngine": "crm",
    "crmStages": "crm",
    "crmSources": "crm",
    "crmLostReasons": "crm",
    "crmTags": "crm",
    "crmPriorities": "crm",
    "crmCampaignChannels": "crm",
    "crmCounsellingOutcomes": "crm",
    "crmCounsellingTypes": "crm",
    "crmEnquiryTypes": "crm",
    "crmReferralSources": "crm",
    "crmFollowUpOutcomes": "crm",
    "crmFollowUpTypes": "crm",
    "crmUtmCampaigns": "crm",
    "crmUtmMediums": "crm",
    "crmUtmSources": "crm",
    "crmLeadQualification": "crm",
    "crmLeadScoringRules": "crm",
    "crmLeadCategories": "crm",
    "crmIndustries": "crm",
    "crmMarketingChannels": "crm",
    "crmCampaignTypes": "crm",

    # Sales
    "opportunities": "crm",
    "opportunityStageHistory": "crm",
    "quotations": "crm",
    "quotationLineItems": "crm",
    "quotationVersions": "crm",
    "salesOpportunityStages": "crm",
    "salesOpportunityTypes": "crm",
    "salesQuotationStatuses": "crm",
    "salesTerritories": "crm",
    "salesPaymentStatuses": "crm",
    "salesInvoiceTypes": "crm",
    "salesTaxSlabs": "crm",

    # Courses
    "courses": "academic",
    "academicVerticals": "academic",
    "academicSubVerticals": "academic",
    "academicBatches": "academic",
    "academicBatchTypes": "academic",
    "academicSubjects": "academic",
    "academicPrograms": "academic",
    "academicBoards": "academic",
    "academicTerms": "academic",
    "academicSemesters": "academic",
    "academicStreams": "academic",
    "academicLanguages": "academic",
    "academicMediums": "academic",
    "academicSections": "academic",
    "academicSessions": "academic",
    "academicClassrooms": "academic",

    # Student
    "studentMaster": "student",
    "studentEnrollments": "student",
    "studentAttendance": "student",
    "studentDocuments": "student",
    "parentMaster": "student",
    "guardianRelations": "student",

    # Employee / HR
    "employeeMaster": "hr",
    "employees": "hr",
    "employeeDocuments": "hr",
    "hrEmployeeCategories": "hr",
    "hrEmployeeTypes": "hr",
    "hrEmploymentStatuses": "hr",
    "hrExperienceLevels": "hr",
    "hrSkills": "hr",
    "hrWorkLocations": "hr",
    "hrDocumentTypes": "hr",
    "attendance": "hr",
    "leaveRequests": "hr",

    # Admission / Intake
    "intakeApplications": "admissions",
    "intakeDocuments": "admissions",
    "intakePayments": "admissions",
    "intakeChecklist": "admissions",
    "intakeNotes": "admissions",

    # Recruiting / ATS
    "recruitRequisitions": "recruitment",
    "recruitJobPostings": "recruitment",
    "recruitCandidates": "recruitment",
    "recruitApplications": "recruitment",
    "recruitInterviews": "recruitment",
    "recruitOffers": "recruitment",
    "recruitOnboarding": "recruitment",

    # Finance
    "feeStructures": "finance",
    "studentFeeAccounts": "finance",
    "feeInstallments": "finance",
    "feeDiscounts": "finance",
    "feeScholarships": "finance",
    "feeWaivers": "finance",
    "lateFeeRules": "finance",
    "feeInvoices": "finance",
    "paymentMethods": "finance",
    "paymentTransactions": "finance",
    "taxRules": "finance",
    "receiptHistory": "finance",
    "expenseRecords": "finance",
    "vendorBills": "finance",
    "journalEntries": "finance",
    "cashBookEntries": "finance",
    "refundRequests": "finance",
    "creditNotes": "finance",
    "financeFeeCategories": "finance",
    "financeDiscountCategories": "finance",
    "financeExpenseCategories": "finance",
    "financeIncomeCategories": "finance",
    "financeBankAccounts": "finance",
    "financeCurrencies": "finance",
    "financeGstRates": "finance",
    "financePaymentModes": "finance",
    "financeTaxTypes": "finance",
    "financeFinancialYears": "finance",

    # Examination
    "examTemplates": "examination",
    "examSessions": "examination",
    "examTimetables": "examination",
    "examSubjectMappings": "examination",
    "examInvigilators": "examination",
    "examHallArrangements": "examination",
    "marksEntries": "examination",
    "grades": "examination",
    "gradeConfigs": "examination",
    "results": "examination",
    "resultSubjects": "examination",
    "reportCards": "examination",
    "examCoordinators": "examination",

    # LMS
    "lmsCourses": "lms",
    "lmsLessons": "lms",
    "lmsTopics": "lms",
    "lmsAssignments": "lms",
    "lmsSubmissions": "lms",
    "lmsQuizzes": "lms",
    "lmsQuizQuestions": "lms",
    "lmsQuizAttempts": "lms",
    "lmsEnrollments": "lms",
    "lmsLessonProgress": "lms",
    "lmsAnnouncements": "lms",
    "lmsDiscussions": "lms",
    "lmsCertificates": "lms",

    # Procurement
    "vendorMaster": "procurement",
    "inventoryCategories": "procurement",
    "warehouses": "procurement",
    "inventoryItems": "procurement",
    "stockMovements": "procurement",
    "purchaseRequisitions": "procurement",
    "requisitionItems": "procurement",
    "purchaseOrders": "procurement",
    "purchaseOrderItems": "procurement",
    "quotationComparisons": "procurement",
    "goodsReceipts": "procurement",
    "goodsReceiptItems": "procurement",
    "issueRegister": "procurement",
    "returnsRegister": "procurement",
    "assetAllocations": "procurement",
    "procurementCategories": "procurement",

    # Person / People
    "personMaster": "people",
    "personIdentifiers": "people",
    "personAddresses": "people",
    "personContacts": "people",
    "personDocuments": "people",
    "personQRCode": "people",
    "globalRegistry": "people",

    # Attendance
    "attendanceRecords": "attendance",
    "attendanceConfigs": "attendance",

    # Person
    "person": "people",
    "persons": "people",
}


def read_schema():
    """Read full schema.ts content."""
    with open(SCHEMA_PATH, "r") as f:
        return f.read()


def extract_shared_exports(content):
    """Extract the shared validator constants from the top of schema.ts."""
    # Find everything before 'const schema = defineSchema'
    schema_start = content.find("const schema = defineSchema")
    if schema_start < 0:
        print("ERROR: Could not find 'const schema = defineSchema'")
        return "", ""
    
    shared_part = content[:schema_start]
    return shared_part


def extract_tables(content):
    """Parse all table definitions with their indexes using regex."""
    # Find the defineSchema call content
    schema_start = content.find("const schema = defineSchema({")
    if schema_start < 0:
        print("ERROR: Could not find defineSchema")
        return []
    
    # Find matching closing brace
    depth = 0
    start = schema_start + len("const schema = defineSchema({")
    tables_text = content[start:]
    
    # Now parse individual tables
    tables = []
    
    # Use regex to find table definitions
    # Pattern: tableName: defineTable({ ... }).index(...).index(...),
    table_pattern = re.compile(
        r'(\w+):\s*(defineTable\s*\([\s\S]*?(?=\n\s*\w+:\s*defineTable\s*\()|\n\s*\}\);)',
        re.MULTILINE
    )
    
    # Simpler approach: find each defineTable block
    pos = 0
    line_num = 0
    lines = tables_text.split('\n')
    
    current_table = None
    current_fields = []
    brace_depth = 0
    in_table = False
    
    for i, line in enumerate(lines):
        stripped = line.rstrip()
        
        # Check for table definition start
        table_match = re.match(r'\s*(\w+):\s*defineTable\(', stripped)
        if table_match:
            if current_table:
                tables.append(current_table)
            current_table = {
                'name': table_match.group(1),
                'fields': [],
                'indexes': [],
                'start_line': i
            }
            in_table = True
            brace_depth = 1
            # Find the opening brace
            open_idx = stripped.find('({')
            if open_idx >= 0:
                pass
            continue
        
        if in_table and current_table:
            # Track brace depth to find end of fields
            for char in stripped:
                if char == '{':
                    brace_depth += 1
                elif char == '}':
                    brace_depth -= 1
            
            # Check for index
            index_match = re.match(r'\s*\.index\([\s\S]*?\)', stripped)
            if index_match and brace_depth <= 0:
                current_table['indexes'].append(stripped.strip())
                continue
            
            # Check for end of table definition
            if brace_depth <= 0 and stripped.endswith(','):
                in_table = False
                continue
            
            if stripped:
                current_table['fields'].append(stripped)
    
    if current_table:
        tables.append(current_table)
    
    return tables


def extract_tables_regex(content):
    """Extract table definitions using a more robust approach."""
    # Find the schema definition content
    schema_match = re.search(r'const schema = defineSchema\(\{([\s\S]*?)\}\);', content)
    if not schema_match:
        print("ERROR: Could not find defineSchema body")
        return []
    
    body = schema_match.group(1)
    
    # Remove authTables spread
    body = re.sub(r'\.\.\.authTables,\s*', '', body)
    
    # Split by top-level table names
    tables_raw = re.split(r'\n\s*(?=\w+:\s*defineTable\()', body)
    
    tables = []
    for t in tables_raw:
        t = t.strip()
        if not t or t.startswith('//'):
            continue
        
        # Extract table name
        name_match = re.match(r'(\w+):\s*defineTable\(', t)
        if not name_match:
            continue
        
        name = name_match.group(1)
        
        # Extract indexes
        indexes = re.findall(r'\.index\(([^)]+)\)', t)
        
        # Determine domain
        domain = TABLE_DOMAINS.get(name,
            'shared' if any(x in name for x in ['config', 'setting', 'report', 'dashboard', 'log', 'audit', 'template'])
            else 'crm' if any(x in name for x in ['lead', 'crm', 'call'])
            else 'academic' if any(x in name for x in ['academic', 'course'])
            else 'finance' if any(x in name for x in ['fee', 'payment', 'gst', 'receipt', 'invoice', 'expense', 'refund', 'credit', 'cash', 'journal', 'finance', 'tax', 'bank', 'currency', 'financial'])
            else 'procurement' if any(x in name for x in ['vendor', 'inventory', 'warehouse', 'purchase', 'requisition', 'goods', 'issue', 'return', 'asset', 'quotation', 'procurement'])
            else 'workflow' if any(x in name for x in ['approval', 'verification', 'workflow'])
            else 'communication' if any(x in name for x in ['message', 'channel', 'comm'])
            else 'hr' if any(x in name for x in ['hr', 'employee'])
            else 'student' if any(x in name for x in ['student', 'parent', 'guardian'])
            else 'examination' if any(x in name for x in ['exam', 'marks', 'grade', 'result', 'reportCard'])
            else 'lms' if any(x in name for x in ['lms'])
            else 'recruitment' if any(x in name for x in ['recruit'])
            else 'admissions' if any(x in name for x in ['intake'])
            else 'people' if any(x in name for x in ['person'])
            else 'organization'
        )
        
        tables.append({
            'name': name,
            'content': t.strip(),
            'indexes': indexes if indexes else [],
            'domain': domain,
            'has_indexes': bool(indexes)
        })
    
    return tables


def add_missing_indexes(table):
    """Add standard indexes to a table based on its field names."""
    existing_idx_names = set()
    for idx in table['indexes']:
        m = re.match(r'"([^"]+)"', idx)
        if m:
            existing_idx_names.add(m.group(1))
    
    new_indexes = []
    content = table['content']
    
    # Extract field names
    field_names = re.findall(r'(\w+):\s*v\.', content)
    
    # Common index patterns
    index_fields = {
        'organizationId': 'by_org',
        'companyId': 'by_company',
        'branchId': 'by_branch',
        'departmentId': 'by_department',
        'teamId': 'by_team',
        'userId': 'by_user',
        'ownerId': 'by_owner',
        'leadId': 'by_lead',
        'studentId': 'by_student',
        'employeeId': 'by_employee',
        'personId': 'by_person',
        'courseId': 'by_course',
        'batchId': 'by_batch',
        'status': 'by_status',
        'isActive': 'by_active',
        'createdAt': 'by_created',
        'updatedAt': 'by_updated',
    }
    
    # Map field names in the table
    for field, idx_name in index_fields.items():
        if field in field_names and idx_name not in existing_idx_names:
            new_indexes.append(f'.index("{idx_name}", ["{field}"])')
            existing_idx_names.add(idx_name)
    
    # Add composite indexes for common parent lookups
    if 'parentType' in field_names and 'parentId' in field_names:
        composite = 'by_parent'
        if composite not in existing_idx_names:
            new_indexes.append(f'.index("{composite}", ["parentType", "parentId"])')
            existing_idx_names.add(composite)
    
    return new_indexes


def generate_domain_file(domain, tables, shared_content):
    """Generate a domain schema file."""
    lines = []
    
    if domain == "shared":
        lines.append(shared_content.strip())
        lines.append("")
    
    # Add imports
    if not lines:
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
    
    # Helper to check if a table has indexes
    def table_has_indexes(t):
        has = t['has_indexes']
        extra = add_missing_indexes(t)
        return has or extra
    
    # For shared domain, wrap in defineSchema
    if domain != "shared":
        lines.append(f'// ─── {domain.upper()} TABLES ───')
        lines.append('')
    
    # Add table content
    for t in tables:
        content = t['content']
        
        # Add missing indexes
        extra_indexes = add_missing_indexes(t)
        if extra_indexes:
            # Remove trailing comma
            if content.endswith(','):
                content = content[:-1]
            for idx in extra_indexes:
                content += f'\n    {idx}'
            content += ','
        
        lines.append(f'  {content}')
    
    lines.append('')
    return '\n'.join(lines)


def generate_barrel_exports(tables_by_domain):
    """Generate the schema.ts barrel file that aggregates all domain modules."""
    lines = [
        'import { defineSchema } from "convex/server";',
        'import { authTables } from "@convex-dev/auth/server";',
        '',
    ]
    
    # Collect all shared validators to re-export
    lines.append('// ─── Re-export shared validators ───')
    lines.append('export {')
    lines.append('  ROLES,')
    lines.append('  roleValidator,')
    lines.append('  TASK_STATUS,')
    lines.append('  taskStatusValidator,')
    lines.append('  PRIORITY,')
    lines.append('  priorityValidator,')
    lines.append('  APPROVAL_STATUS,')
    lines.append('  approvalStatusValidator,')
    lines.append('  NOTIFICATION_TYPE,')
    lines.append('  notificationTypeValidator,')
    lines.append('  APPROVAL_MODE,')
    lines.append('  approvalModeValidator,')
    lines.append('  FORM_STATUS,')
    lines.append('  formStatusValidator,')
    lines.append('  FIELD_TYPES,')
    lines.append('  fieldTypeValidator,')
    lines.append('  SUBMISSION_STATUS,')
    lines.append('  submissionStatusValidator,')
    lines.append('} from "./schema/shared";')
    lines.append('')
    
    # Import domain table definitions
    domain_imports = []
    for domain in sorted(tables_by_domain.keys()):
        if domain == "shared":
            continue
        domain_imports.append(f'import {{ {domain}Tables }} from "./schema/{domain}";')
    
    lines.extend(domain_imports)
    lines.append('')
    
    # Build the schema object
    schema_entries = ['    ...authTables,']
    for domain in sorted(tables_by_domain.keys()):
        if domain == "shared":
            schema_entries.append('    ...sharedTables,')
        else:
            schema_entries.append(f'    ...{domain}Tables,')
    
    lines.append('const schema = defineSchema({')
    lines.append('\n'.join(schema_entries))
    lines.append('});')
    lines.append('')
    lines.append('export default schema;')
    lines.append('')
    
    return '\n'.join(lines)


def main():
    print("=" * 60)
    print(" EEOS Schema Modularization")
    print("=" * 60)
    
    # Read schema
    print("\n1. Reading schema.ts...")
    content = read_schema()
    print(f"   Read {len(content)} characters")
    
    # Extract shared validators
    print("\n2. Extracting shared validators...")
    shared_content = extract_shared_exports(content)
    print(f"   Extracted {len(shared_content)} chars of shared content")
    
    # Extract tables
    print("\n3. Extracting table definitions...")
    tables = extract_tables_regex(content)
    print(f"   Found {len(tables)} tables")
    
    # Group by domain
    from collections import defaultdict
    tables_by_domain = defaultdict(list)
    for t in tables:
        tables_by_domain[t['domain']].append(t)
    
    print("\n   Table distribution by domain:")
    for domain, tlist in sorted(tables_by_domain.items()):
        print(f"     {domain}: {len(tlist)} tables")
    
    # Create schema directory
    print(f"\n4. Creating {SCHEMA_DIR}/ directory...")
    os.makedirs(SCHEMA_DIR, exist_ok=True)
    
    # Generate domain files
    print("\n5. Generating domain schema files...")
    # First, handle shared domain separately
    shared_tables = tables_by_domain.pop("shared", [])
    
    # All domains that have tables
    all_domains = sorted(tables_by_domain.keys())
    
    for domain in all_domains:
        tlist = tables_by_domain[domain]
        filepath = os.path.join(SCHEMA_DIR, f"{domain}.ts")
        
        lines = []
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append(f'// ============================')
        lines.append(f'// {domain.upper()} TABLES')
        lines.append(f'// ============================')
        lines.append('')
        
        # Export all tables as a named object
        export_entries = {}
        for t in tlist:
            content = t['content']
            # Remove trailing comma after table def
            extra_indexes = add_missing_indexes(t)
            if extra_indexes:
                if content.endswith(','):
                    content = content[:-1]
                for idx in extra_indexes:
                    content += f'\n  {idx}'
                content += ','
            export_entries[t['name']] = content
        
        # Generate export declaration
        lines.append(f'export const {domain}Tables = {{')
        for name, entry in export_entries.items():
            lines.append(f'  {entry}')
        lines.append('};')
        lines.append('')
        
        # Also export table names as type references
        lines.append('// ─── Table name constants ───')
        for name in export_entries:
            lines.append(f'export const TABLE_{name.upper()} = "{name}" as const;')
        lines.append('')
        
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))
        print(f"   Created {filepath}")
    
    # Generate shared domain file (includes validators + shared tables)
    print(f"\n   Generating shared schema file...")
    # Add shared tables back
    tables_by_domain["shared"] = shared_tables
    
    if shared_tables:
        # Extract the validator exports from the original content
        shared_validators_end = content.find("const schema = defineSchema")
        validators_text = content[:shared_validators_end]
        
        filepath = os.path.join(SCHEMA_DIR, "shared.ts")
        lines = []
        # Add the validators
        lines.append(validators_text.strip())
        lines.append('')
        lines.append('')
        
        # Add shared tables as named export
        lines.append('export const sharedTables = {')
        for t in shared_tables:
            content = t['content']
            extra_indexes = add_missing_indexes(t)
            if extra_indexes:
                if content.endswith(','):
                    content = content[:-1]
                for idx in extra_indexes:
                    content += f'\n  {idx}'
                content += ','
            lines.append(f'  {content}')
        lines.append('};')
        lines.append('')
        
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))
        print(f"   Created {filepath}")
    
    # Generate barrel file (schema.ts)
    print(f"\n6. Generating barrel export (schema.ts)...")
    barrel = generate_barrel_exports(tables_by_domain)
    
    # Backup original
    shutil.copy2(SCHEMA_PATH, SCHEMA_PATH + ".bak")
    print(f"   Backed up original to {SCHEMA_PATH}.bak")
    
    with open(SCHEMA_PATH, 'w') as f:
        f.write(barrel)
    print(f"   Wrote new {SCHEMA_PATH}")
    
    # Generate index report
    print(f"\n7. Index report:")
    total_tables = len(tables)
    total_with_indexes_before = sum(1 for t in tables if t['has_indexes'])
    total_with_indexes_after = sum(1 for t in tables if t['has_indexes'] or add_missing_indexes(t))
    
    print(f"   Tables with indexes BEFORE: {total_with_indexes_before}/{total_tables}")
    print(f"   Tables with indexes AFTER:  {total_with_indexes_after}/{total_tables}")
    
    total_indexes_before = sum(len(t['indexes']) for t in tables)
    total_added = sum(len(add_missing_indexes(t)) for t in tables)
    print(f"   Total indexes BEFORE: {total_indexes_before}")
    print(f"   Total indexes added:  {total_added}")
    print(f"   Total indexes AFTER:  {total_indexes_before + total_added}")
    
    print(f"\n✅ Schema modularization complete!")
    print(f"   {total_tables} tables distributed across {len(tables_by_domain)} domain modules")
    print(f"   Stored in {SCHEMA_DIR}/")

if __name__ == "__main__":
    main()
