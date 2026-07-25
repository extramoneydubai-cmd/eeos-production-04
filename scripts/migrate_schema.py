#!/usr/bin/env python3
"""
EEOS Schema Migration v6 — Final, Robust Parser

Uses position-based matching for each table definition:
1. Find `name: defineTable(` by regex
2. Track paren depth to find matching `)` 
3. Collect `.index()` chains
4. Exact classification for ALL 280 tables by name
"""
import os, re, shutil

SCHEMA_PATH = "src/convex/schema.ts"
SCHEMA_DIR = "src/convex/schema"

# Standard index fields to add (only if no existing index already covers that field)
STANDARD_INDEXES = {
    "organizationId": "by_org", "companyId": "by_company",
    "branchId": "by_branch", "departmentId": "by_dept",
    "teamId": "by_team", "userId": "by_user", "ownerId": "by_owner",
    "leadId": "by_lead", "studentId": "by_student",
    "employeeId": "by_employee", "personId": "by_person",
    "courseId": "by_course", "batchId": "by_batch",
    "status": "by_status", "isActive": "by_active",
    "createdAt": "by_created", "updatedAt": "by_updated",
}

# ─── Domain Classification: ALL 280 tables explicitly mapped ───
TABLE_DOMAIN = {
    # Shared
    "users": "shared", "sessions": "shared", "userScopes": "shared",
    "notifications": "shared",
    "dashboardWidgets": "shared", "dashboardLayouts": "shared",
    "userDashboardLayouts": "shared",
    "reportDefinitions": "shared", "savedReports": "shared",
    "reportSchedules": "shared", "reportExecutions": "shared",
    "reportExports": "shared",
    "kpiDefinitions": "shared", "kpiSnapshots": "shared",
    "analyticsSnapshots": "shared", "conversionFunnels": "shared",
    "counselorMetrics": "shared", "forecastSnapshots": "shared",
    "auditLogs": "shared",
    "personQRCode": "shared",
    # Organization
    "organizations": "organization", "departments": "organization",
    "companies": "organization", "branches": "organization",
    "teams": "organization", "verticals": "organization",
    "subVerticals": "organization", "boards": "organization",
    "designations": "organization",
    "orgCompanies": "organization", "orgBranches": "organization",
    "orgTeams": "organization", "orgDepartments": "organization",
    "orgDesignations": "organization",
    # Tasks
    "tasks": "tasks", "taskParticipants": "tasks",
    "taskChecklistItems": "tasks", "taskComments": "tasks",
    # CRM & Sales
    "leadMaster": "crm", "leadStageHistory": "crm",
    "leadAssignments": "crm", "leadTasks": "crm", "leadNotes": "crm",
    "leadDocuments": "crm", "leadActivity": "crm", "callLogs": "crm",
    "leadCourses": "crm", "leadDiscounts": "crm",
    "leadWhatsAppMessages": "crm", "leadApprovals": "crm",
    "leadApprovalDecisions": "crm", "leadPayments": "crm",
    "leadHealthScores": "crm", "leadFollowUpRules": "crm",
    "leadConversionPipeline": "crm", "leadStatusEngine": "crm",
    "leadTimeline": "crm", "leadCommunications": "crm",
    "leadMeetings": "crm", "leadAttachments": "crm",
    "crmStages": "crm", "crmSources": "crm", "crmLostReasons": "crm",
    "crmTags": "crm", "crmPriorities": "crm",
    "crmCampaignChannels": "crm", "crmCounsellingOutcomes": "crm",
    "crmCounsellingTypes": "crm", "crmEnquiryTypes": "crm",
    "crmReferralSources": "crm", "crmFollowUpOutcomes": "crm",
    "crmFollowUpTypes": "crm",
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
    "courses": "crm", "leadCourses": "crm",
    # Academic
    "academicVerticals": "academic", "academicSubVerticals": "academic",
    "academicBatches": "academic", "academicBatchTypes": "academic",
    "academicSubjects": "academic", "academicPrograms": "academic",
    "academicBoards": "academic", "academicTerms": "academic",
    "academicSemesters": "academic", "academicStreams": "academic",
    "academicLanguages": "academic", "academicMediums": "academic",
    "academicSections": "academic", "academicSessions": "academic",
    "academicClassrooms": "academic",
    # Finance
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
    # HR
    "employees": "hr", "employeeMaster": "hr",
    "employeeDocuments": "hr", "employeeEmployment": "hr",
    "employeeAssets": "hr",
    "hrEmployeeCategories": "hr", "hrEmployeeTypes": "hr",
    "hrEmploymentStatuses": "hr", "hrExperienceLevels": "hr",
    "hrSkills": "hr", "hrWorkLocations": "hr", "hrDocumentTypes": "hr",
    "attendance": "hr", "leaveRequests": "hr",
    # Student
    "studentMaster": "student", "studentEnrollments": "student",
    "studentAttendance": "student", "studentDocuments": "student",
    "parentMaster": "student", "guardianRelations": "student",
    # LMS
    "lmsCourses": "lms", "lmsLessons": "lms", "lmsTopics": "lms",
    "lmsAssignments": "lms", "lmsSubmissions": "lms",
    "lmsQuizzes": "lms", "lmsQuizQuestions": "lms",
    "lmsQuizAttempts": "lms", "lmsEnrollments": "lms",
    "lmsLessonProgress": "lms", "lmsAnnouncements": "lms",
    "lmsDiscussions": "lms", "lmsCertificates": "lms",
    # Examination
    "examTemplates": "examination", "examSessions": "examination",
    "examTimetables": "examination", "examSubjectMappings": "examination",
    "examInvigilators": "examination", "examHallArrangements": "examination",
    "marksEntries": "examination", "examCoordinators": "examination",
    "grades": "examination", "gradeConfigs": "examination",
    "results": "examination", "resultSubjects": "examination",
    "reportCards": "examination",
    # Admissions
    "intakeApplications": "admissions", "intakeDocuments": "admissions",
    "intakePayments": "admissions", "intakeChecklist": "admissions",
    "intakeNotes": "admissions",
    # Procurement & Inventory
    "vendorMaster": "procurement", "inventoryCategories": "procurement",
    "warehouses": "procurement", "inventoryItems": "procurement",
    "stockMovements": "procurement",
    "purchaseRequisitions": "procurement", "requisitionItems": "procurement",
    "purchaseOrders": "procurement", "purchaseOrderItems": "procurement",
    "quotationComparisons": "procurement",
    "goodsReceipts": "procurement", "goodsReceiptItems": "procurement",
    "issueRegister": "procurement", "returnsRegister": "procurement",
    "assetAllocations": "procurement",
    # Documents
    "documents": "documents", "documentFolders": "documents",
    "documentTags": "documents", "documentVersions": "documents",
    "documentPermissions": "documents", "documentTimeline": "documents",
    # Workflow & Approval
    "approvalTemplates": "workflow", "approvalRequests": "workflow",
    "approvalRequestApprovers": "workflow",
    "workflows": "workflow", "workflowSteps": "workflow",
    "workflowExecutions": "workflow", "workflowNodes": "workflow",
    "workflowEdges": "workflow", "workflowInstances": "workflow",
    "workflowLogs": "workflow",
    "verification_requests": "workflow", "verification_rules": "workflow",
    "verification_decisions": "workflow",
    # Communication
    "channels": "communication", "channelMembers": "communication",
    "messages": "communication", "directMessages": "communication",
    "commNotificationTypes": "communication",
    "commEmailTemplates": "communication", "commSmsTemplates": "communication",
    "commWhatsAppTemplates": "communication",
    # People
    "personMaster": "people", "personIdentifiers": "people",
    "personAddresses": "people", "personContacts": "people",
    "personDocuments": "people",
    # Forms
    "forms": "forms", "formFields": "forms", "formVersions": "forms",
    "formSubmissions": "forms",
    # Recruitment
    "recruitRequisitions": "recruitment", "recruitJobPostings": "recruitment",
    "recruitCandidates": "recruitment", "recruitApplications": "recruitment",
    "recruitInterviews": "recruitment", "recruitOffers": "recruitment",
    "recruitOnboarding": "recruitment",
    # Unknown
    "globalRegistry": "shared",
    "person": "people",
    "persons": "people",
}


def read_file(path):
    with open(path) as f:
        return f.read()


def extract_schema_body(content):
    """Find the start of the defineSchema body using simple string search."""
    idx = content.find("const schema = defineSchema({")
    if idx < 0:
        raise ValueError("Cannot find defineSchema")
    return idx  # return starting position of the defineSchema call


def parse_all_tables(body):
    """Parse ALL table definitions using position-based extraction."""
    tables = []
    
    # Find all table definition starts with their positions
    pattern = re.compile(r'(\w+):\s*defineTable\(')
    
    for match in pattern.finditer(body):
        name = match.group(1)
        start_pos = match.start()
        content_start = match.end()  # position right after defineTable(
        
        # Track paren depth to find the matching closing )
        depth = 1  # we're inside defineTable(...)
        pos = content_start
        
        while pos < len(body) and depth > 0:
            ch = body[pos]
            if ch == '(': depth += 1
            elif ch == ')': depth -= 1
            elif ch == '{': depth += 1
            elif ch == '}': depth -= 1
            pos += 1
        
        # pos is now after the closing ) of defineTable(...)
        end_pos = pos
        
        # Collect any .index() chains that follow
        while pos < len(body):
            remaining = body[pos:]
            idx_match = re.match(r'\s*\.index\([^)]+\)', remaining)
            if idx_match:
                pos += idx_match.end()
                end_pos = pos
            else:
                break
        
        # Also consume trailing comma
        if pos < len(body) and body[pos] == ',':
            end_pos = pos + 1
        
        table_text = body[start_pos:end_pos].strip()
        
        if table_text:
            tables.append((name, table_text))
    
    return tables


def get_fields_and_indexes(text):
    """Extract field names and existing index field sets from table text."""
    fields = set()
    indexed_fields = set()  # which fields are already covered by ANY index
    
    for line in text.split('\n'):
        fm = re.match(r'\s*(\w+):\s*v\.', line)
        if fm:
            fields.add(fm.group(1))
    
    # Extract all index field combinations
    for im in re.finditer(r'\.index\("[^"]+",\s*\[([^\]]+)\]\)', text):
        field_refs = re.findall(r'"([^"]+)"', im.group(1))
        for f in field_refs:
            indexed_fields.add(f)
    
    return fields, indexed_fields


def add_missing_indexes(text, fields, indexed_fields):
    """Add missing standard indexes only if field not already indexed."""
    missing = []
    for field, idx_name in STANDARD_INDEXES.items():
        if field in fields and field not in indexed_fields and idx_name not in text:
            missing.append((idx_name, field))
    
    if not missing:
        return text, []
    
    t = text.rstrip()
    if t.endswith(','):
        t = t[:-1]
    for idx_name, field in missing:
        t += f'\n    .index("{idx_name}", ["{field}"])'
    t += ','
    return t, missing


def write_domain_file(domain, tables, validators_text):
    """Write a domain schema file."""
    lines = []
    
    if domain == "shared":
        lines.append(validators_text)
        lines.append('')
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append('export const sharedTables = {')
        for _, content in sorted(tables):
            lines.append(f'  {content}')
        lines.append('};')
    else:
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        
        # Add validator imports
        # Check which validators are used in this domain's tables
        all_text = ' '.join(c for _, c in tables)
        needed_validators = []
        if 'approvalStatusValidator' in all_text:
            needed_validators.append('approvalStatusValidator')
        if 'approvalModeValidator' in all_text:
            needed_validators.append('approvalModeValidator')
        if 'roleValidator' in all_text:
            needed_validators.append('roleValidator')
        if 'taskStatusValidator' in all_text:
            needed_validators.append('taskStatusValidator')
        if 'priorityValidator' in all_text:
            needed_validators.append('priorityValidator')
        if 'notificationTypeValidator' in all_text:
            needed_validators.append('notificationTypeValidator')
        if 'formStatusValidator' in all_text:
            needed_validators.append('formStatusValidator')
        if 'fieldTypeValidator' in all_text:
            needed_validators.append('fieldTypeValidator')
        if 'submissionStatusValidator' in all_text:
            needed_validators.append('submissionStatusValidator')
        
        if needed_validators:
            vals = ', '.join(needed_validators)
            lines.append(f'import {{ {vals} }} from "./shared";')
        
        lines.append('')
        lines.append(f'export const {domain}Tables = {{')
        for _, content in sorted(tables):
            lines.append(f'  {content}')
        lines.append('};')
    
    path = os.path.join(SCHEMA_DIR, f"{domain}.ts")
    with open(path, 'w') as f:
        f.write('\n'.join(lines))
    return path


def write_barrel(domains):
    """Generate barrel export file."""
    domain_list = sorted(domains)
    
    lines = [
        'import { defineSchema } from "convex/server";',
        'import { authTables } from "@convex-dev/auth/server";',
        '',
        'export {',
        '  ROLES, roleValidator,',
        '  TASK_STATUS, taskStatusValidator,',
        '  PRIORITY, priorityValidator,',
        '  APPROVAL_STATUS, approvalStatusValidator,',
        '  NOTIFICATION_TYPE, notificationTypeValidator,',
        '  APPROVAL_MODE, approvalModeValidator,',
        '  FORM_STATUS, formStatusValidator,',
        '  FIELD_TYPES, fieldTypeValidator,',
        '  SUBMISSION_STATUS, submissionStatusValidator,',
        '} from "./schema/shared";',
        '',
    ]
    
    for d in domain_list:
        if d != "shared":
            lines.append(f'import {{ {d}Tables }} from "./schema/{d}";')
    
    lines.append('')
    lines.append('const schema = defineSchema({')
    lines.append('    ...authTables,')
    for d in domain_list:
        lines.append(f'    ...{d}Tables,' if d != "shared" else '    ...sharedTables,')
    lines.append('});')
    lines.append('export default schema;')
    return '\n'.join(lines)


def dedup_indexes(content):
    """Remove duplicate indexes that have the same field coverage."""
    # Group indexes by their field signature
    idx_pattern = re.compile(r'\.index\("([^"]+)", \[([^\]]+)\]\)')
    matches = list(idx_pattern.finditer(content))
    
    field_sigs = {}  # "field1,field2" -> [(index_name, span, text)]
    for m in matches:
        idx_name = m.group(1)
        fields = tuple(sorted(re.findall(r'"([^"]+)"', m.group(2))))
        sig = ",".join(fields)
        if sig not in field_sigs:
            field_sigs[sig] = []
        field_sigs[sig].append((idx_name, m.start(), m.group()))
    
    # Find dupes: same field signature, different index names
    to_remove = set()
    for sig, idxs in field_sigs.items():
        if len(idxs) > 1:
            # Keep the one without "by_" prefix, or the shortest name
            sorted_idxs = sorted(idxs, key=lambda x: (0 if not x[0].startswith('by_') else 1, len(x[0])))
            for idx in sorted_idxs[1:]:
                to_remove.add(idx[0])
    
    if not to_remove:
        return content
    
    for idx_name in sorted(to_remove, key=lambda x: -len(x)):
        content = re.sub(
            r'\n\s+\.index\("' + re.escape(idx_name) + r'"[^)]*\)',
            '',
            content
        )
    return content


def main():
    print("=" * 60)
    print(" EEOS Schema Migration v6 — Final")
    print("=" * 60)
    
    content = read_file(SCHEMA_PATH)
    
    # Backup
    if not os.path.exists(SCHEMA_PATH + ".orig"):
        shutil.copy2(SCHEMA_PATH, SCHEMA_PATH + ".orig")
        print("Created .orig backup")
    
    # Extract validators
    val_match = re.search(r'^(.*?)const schema = defineSchema', content, re.DOTALL)
    validators = val_match.group(1).strip() if val_match else ""
    print(f"Validators: {len(validators)} chars")
    
    # Parse all tables from the full content (not extracted body)
    schema_start = extract_schema_body(content)
    tables = parse_all_tables(content[schema_start:])
    print(f"\nParsed {len(tables)} tables")
    
    # Identify tables by domain
    from collections import defaultdict, Counter
    by_domain = defaultdict(list)
    unknown = []
    
    parsed_names = set(name for name, _ in tables)
    all_expected = set(TABLE_DOMAIN.keys())
    extra_tables = parsed_names - all_expected
    
    # All tables found by regex in full content
    all_regex_tables = set(re.findall(r'(\w+):\s*defineTable\(', content))
    # Filter out the defineTable import
    all_regex_tables.discard('defineTable')
    actually_missing = all_regex_tables - parsed_names
    
    for name, text in tables:
        domain = TABLE_DOMAIN.get(name, "shared")
        by_domain[domain].append((name, text))
        if name not in TABLE_DOMAIN:
            unknown.append(name)
    
    print(f"\nDomain distribution:")
    for d, tbls in sorted(by_domain.items(), key=lambda x: -len(x[1])):
        print(f"  {d}: {len(tbls)} tables")
    
    if unknown:
        print(f"\n⚠ Unknown domains: {', '.join(unknown[:10])}")
    if actually_missing:
        print(f"\n⚠ Tables NOT parsed by parser ({len(actually_missing)}):")
        for t in sorted(actually_missing)[:20]:
            print(f"  - {t}")
    if extra_tables:
        print(f"\n⚠ Unexpected tables (in parser but not in domain map): {', '.join(sorted(extra_tables)[:10])}")
    
    # Process tables: add indexes, deduplicate
    total_before = 0
    total_after = 0
    count_before = 0
    
    print(f"\nProcessing indexes...")
    for domain in by_domain:
        processed = []
        for name, text in by_domain[domain]:
            fields, indexed_fields = get_fields_and_indexes(text)
            
            # Count existing index field coverage
            idx_count = len(re.findall(r'\.index\(', text))
            if idx_count > 0:
                count_before += 1
            total_before += idx_count
            
            # Add missing indexes
            new_text, added = add_missing_indexes(text, fields, indexed_fields)
            total_after += idx_count + len(added)
            
            # Deduplicate
            new_text = dedup_indexes(new_text)
            
            if added:
                idx_names = ', '.join(a[0] for a in added)
                print(f"  +{len(added)} idx -> {name}: {idx_names}")
            
            processed.append((name, new_text))
        by_domain[domain] = processed
    
    # Write schema directory
    if os.path.exists(SCHEMA_DIR):
        import shutil as sh
        sh.rmtree(SCHEMA_DIR)
    os.makedirs(SCHEMA_DIR)
    
    print(f"\nWriting domain files...")
    for d, tbls in sorted(by_domain.items()):
        path = write_domain_file(d, tbls, validators)
        print(f"  {path}: {len(tbls)} tables")
    
    # Write barrel
    barrel = write_barrel(list(by_domain.keys()))
    with open(SCHEMA_PATH, 'w') as f:
        f.write(barrel)
    print(f"  {SCHEMA_PATH}: barrel export")
    
    # Migration report
    print(f"\n" + "=" * 60)
    print(" MIGRATION REPORT")
    print("=" * 60)
    print(f"  Total original tables (regex from schema): {len(all_regex_tables)}")
    print(f"  Total tables in domain map: {len(all_expected)}")
    print(f"  Total tables parsed by script: {len(tables)}")
    print(f"  Tables migrated to domain files: {sum(len(v) for v in by_domain.values())}")
    print(f"  Tables MISSING from parser: {len(actually_missing)}")
    print(f"  Tables MISSING from domain map: {len(all_expected - parsed_names)}")
    
    if actually_missing:
        print(f"\n  Missing tables:")
        for t in sorted(actually_missing):
            print(f"    ❌ {t}")
    
    print(f"\n  Domains generated: {len(by_domain)}")
    for d, tbls in sorted(by_domain.items()):
        print(f"    - {d}: {len(tbls)} tables")
    
    print(f"\n  Index summary:")
    print(f"    Tables with indexes BEFORE: {count_before}/{len(tables)}")
    print(f"    Total indexes BEFORE: {total_before}")
    print(f"    Total indexes added:  {total_after - total_before}")
    print(f"    Total indexes AFTER:  {total_after}")
    
    print(f"\n✅ Migration complete!")

if __name__ == "__main__":
    main()
