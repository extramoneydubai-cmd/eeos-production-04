#!/usr/bin/env python3
"""
EEOS Schema Modularization v5 — Fixed Parenthesis & Brace Tracking

Handles v.object({...}) patterns properly by tracking both () and {} depth.
"""
import os, re, shutil

SCHEMA_PATH = "src/convex/schema.ts"
SCHEMA_DIR = "src/convex/schema"

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

DOMAIN_PREFIXES = [
    ("org", "organization"), ("department", "organization"),
    ("company", "organization"), ("branch", "organization"),
    ("team", "organization"), ("vertical", "organization"),
    ("subVertical", "organization"), ("board", "organization"),
    ("designation", "organization"),
    ("user", "shared"), ("session", "shared"), ("notif", "shared"),
    ("dashboard", "shared"), ("report", "shared"), ("kpi", "shared"),
    ("audit", "shared"), ("saved", "shared"),
    ("crm", "crm"), ("lead", "crm"), ("callLog", "crm"),
    ("opportunity", "crm"), ("quotation", "crm"),
    ("sales", "crm"),
    ("academic", "academic"), ("course", "academic"),
    ("student", "student"), ("parent", "student"), ("guardian", "student"),
    ("employee", "hr"), ("hr", "hr"), ("attendance", "hr"),
    ("leave", "hr"),
    ("fee", "finance"), ("finance", "finance"), ("payment", "finance"),
    ("expense", "finance"), ("refund", "finance"), ("credit", "finance"),
    ("cash", "finance"), ("journal", "finance"), ("tax", "finance"),
    ("receipt", "finance"), ("invoice", "finance"), ("vendor", "finance"),
    ("lms", "lms"),
    ("exam", "examination"), ("marks", "examination"),
    ("grade", "examination"), ("result", "examination"),
    ("reportCard", "examination"),
    ("intake", "admissions"), ("recruit", "recruitment"),
    ("inventory", "procurement"), ("warehouse", "procurement"),
    ("purchase", "procurement"), ("requisition", "procurement"),
    ("goods", "procurement"), ("issueRegister", "procurement"),
    ("return", "procurement"), ("asset", "procurement"),
    ("procurement", "procurement"), ("vendorMaster", "procurement"),
    ("person", "people"), ("globalRegistry", "people"),
    ("personQR", "people"),
    ("approval", "workflow"), ("verification", "workflow"),
    ("workflow", "workflow"),
    ("task", "tasks"), ("channel", "communication"),
    ("message", "communication"), ("comm", "communication"),
    ("directMessage", "communication"),
    ("form", "forms"), ("document", "documents"),
]

def classify(name):
    for p, d in DOMAIN_PREFIXES:
        if name.startswith(p):
            return d
    return "shared"

def read_file(path):
    with open(path) as f:
        return f.read()

def extract_schema_body(content):
    """Extract defineSchema body tracking both {} and () depth."""
    # Find the start
    marker = "const schema = defineSchema({"
    idx = content.find(marker)
    if idx < 0:
        raise ValueError("Cannot find defineSchema")
    
    start = idx + len(marker) - 1  # position of {
    depth = 0
    pos = start
    
    while pos < len(content):
        ch = content[pos]
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
        elif ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if depth == 0:
            break
        pos += 1
    
    return content[start+1:pos]  # body without the outer {}

def parse_tables(body):
    """Parse tables using combined () and {} depth tracking."""
    lines = body.split('\n')
    tables = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        if not stripped or stripped.startswith('//') or stripped.startswith('*') or '...authTables' in stripped:
            i += 1
            continue
        
        m = re.match(r'(\w+):\s*defineTable\(', stripped)
        if not m:
            i += 1
            continue
        
        name = m.group(1)
        table_lines = [stripped]
        i += 1
        
        # Track combined depth: count +1 for each (, { and -1 for each ), }
        depth = 0
        for ch in stripped:
            if ch == '(' or ch == '{': depth += 1
            elif ch == ')' or ch == '}': depth -= 1
        
        while i < len(lines) and depth > 0:
            cur = lines[i]
            table_lines.append(cur.rstrip())
            
            for ch in cur:
                if ch == '(' or ch == '{': depth += 1
                elif ch == ')' or ch == '}': depth -= 1
            
            i += 1
        
        # Also collect any .index() chains that follow
        while i < len(lines):
            peek = lines[i].strip()
            if peek.startswith('.index('):
                table_lines.append(lines[i].rstrip())
                i += 1
            else:
                break
        
        table_text = '\n'.join(table_lines)
        tables.append((name, table_text))
    
    return tables

def get_fields_and_indexes(text):
    fields = set()
    idx_names = set()
    for line in text.split('\n'):
        fm = re.match(r'\s*(\w+):\s*v\.', line)
        if fm: fields.add(fm.group(1))
        for im in re.finditer(r'\.index\("([^"]+)"', line):
            idx_names.add(im.group(1))
    return fields, idx_names

def add_indexes_to_table(text, missing):
    if not missing:
        return text
    # Remove trailing comma if present
    t = text.rstrip()
    if t.endswith(','):
        t = t[:-1]
    for idx_name, field in missing:
        t += f'\n    .index("{idx_name}", ["{field}"])'
    t += ','
    return t

def write_domain(domain, tables, validators):
    path = os.path.join(SCHEMA_DIR, f"{domain}.ts")
    lines = []
    
    if domain == "shared":
        lines.append(validators)
        lines.append('')
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append('export const sharedTables = {')
        for _, c in sorted(tables):
            lines.append(f'  {c}')
        lines.append('};')
    else:
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        # domain-specific tables might need validators from shared
        if domain in ("workflow", "tasks"):
            lines.append('import { approvalStatusValidator, approvalModeValidator, roleValidator } from "./shared";')
            lines.append('')
        if domain in ("tasks",):
            lines.append('import { taskStatusValidator, priorityValidator } from "./shared";')
            lines.append('')
        lines.append(f'export const {domain}Tables = {{')
        for _, c in sorted(tables):
            lines.append(f'  {c}')
        lines.append('};')
    
    with open(path, 'w') as f:
        f.write('\n'.join(lines))
    print(f"  {path}: {len(tables)} tables")

def write_barrel(domains):
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
    for d in sorted(domains):
        if d != "shared":
            lines.append(f'import {{ {d}Tables }} from "./schema/{d}";')
    lines.append('')
    lines.append('const schema = defineSchema({')
    lines.append('    ...authTables,')
    for d in sorted(domains):
        lines.append(f'    ...{d}Tables,' if d != "shared" else '    ...sharedTables,')
    lines.append('});')
    lines.append('export default schema;')
    return '\n'.join(lines)

def main():
    print("=" * 60)
    print(" EEOS Schema Modularization v5 (Fixed Depth Tracking)")
    print("=" * 60)
    
    content = read_file(SCHEMA_PATH)
    
    # Backup
    if not os.path.exists(SCHEMA_PATH + ".orig"):
        shutil.copy2(SCHEMA_PATH, SCHEMA_PATH + ".orig")
    
    # Validators
    m = re.search(r'^(.*?)const schema = defineSchema', content, re.DOTALL)
    validators = m.group(1).strip() if m else ""
    print(f"Validators: {len(validators)} chars")
    
    # Body
    body = extract_schema_body(content)
    print(f"Schema body: {len(body)} chars")
    
    # Parse
    tables = parse_tables(body)
    print(f"Parsed {len(tables)} tables\n")
    
    from collections import defaultdict
    by_domain = defaultdict(list)
    
    total_before = 0
    total_after = 0
    count_before = 0
    count_after = 0
    
    for name, text in tables:
        fields, idx_names = get_fields_and_indexes(text)
        
        missing = []
        for field, idx_name in STANDARD_INDEXES.items():
            if field in fields and idx_name not in idx_names:
                missing.append((idx_name, field))
        
        new_text = add_indexes_to_table(text, missing)
        domain = classify(name)
        
        if idx_names: count_before += 1
        if idx_names or missing: count_after += 1
        total_before += len(idx_names)
        total_after += len(idx_names) + len(missing)
        
        if missing:
            print(f"  +{len(missing)} idx -> {name}: {', '.join(m[0] for m in missing)}")
        
        by_domain[domain].append((name, new_text))
    
    print(f"\nDomains:")
    for d, tbls in sorted(by_domain.items()):
        print(f"  {d}: {len(tbls)} tables")
    
    # Clean and write
    if os.path.exists(SCHEMA_DIR):
        shutil.rmtree(SCHEMA_DIR)
    os.makedirs(SCHEMA_DIR)
    
    print(f"\nWriting:")
    for d, tbls in sorted(by_domain.items()):
        write_domain(d, tbls, validators)
    
    barrel = write_barrel(list(by_domain.keys()))
    with open(SCHEMA_PATH, 'w') as f:
        f.write(barrel)
    print(f"  {SCHEMA_PATH}: barrel")
    
    print(f"\nIndex summary:")
    print(f"  Tables with indexes BEFORE: {count_before}/{len(tables)}")
    print(f"  Tables with indexes AFTER:  {count_after}/{len(tables)}")
    print(f"  Total indexes BEFORE: {total_before}")
    print(f"  Total added: {total_after - total_before}")
    print(f"  Total AFTER:  {total_after}")
    print(f"\n✅ Done!")

if __name__ == "__main__":
    main()
