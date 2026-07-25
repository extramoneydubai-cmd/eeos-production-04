#!/usr/bin/env python3
"""
EEOS Schema Modularization v4 — Simple, Reliable Parser

Reads schema.ts line by line, uses table-name detection to split
definitions, adds missing indexes, distributes to domain files.
"""
import os, re, shutil

SCHEMA_PATH = "src/convex/schema.ts"
SCHEMA_DIR = "src/convex/schema"

# Standard index fields to add
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

# Domain classification
DOMAIN_MAP = {}
# Build from prefixes
_PREFIX_DOMAIN = [
    ("org", "organization"), ("department", "organization"),
    ("company", "organization"), ("branch", "organization"),
    ("team", "organization"), ("vertical", "organization"),
    ("subVertical", "organization"), ("board", "organization"),
    ("designation", "organization"),
    ("user", "shared"), ("session", "shared"), ("notif", "shared"),
    ("dashboard", "shared"), ("report", "shared"), ("kpi", "shared"),
    ("audit", "shared"),
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
    ("goods", "procurement"), ("issue", "procurement"),
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
    for prefix, domain in _PREFIX_DOMAIN:
        if name.startswith(prefix):
            return domain
    return "shared"

def read_file(path):
    with open(path) as f:
        return f.read()

def extract_body(content):
    """Extract the defineSchema body using brace counting."""
    idx = content.find("const schema = defineSchema({")
    if idx < 0:
        raise ValueError("Cannot find defineSchema")
    
    start = idx + len("const schema = defineSchema({")
    depth = 1
    pos = start
    while depth > 0 and pos < len(content):
        if content[pos] == '{': depth += 1
        elif content[pos] == '}': depth -= 1
        pos += 1
    
    # Return body (without the closing })
    return content[start:pos-1]

def parse_tables(body):
    """Parse all table definitions from the schema body."""
    lines = body.split('\n')
    tables = []
    current_name = None
    current_lines = []
    brace_depth = 0
    in_table = False
    
    for line in lines:
        stripped = line.rstrip()
        
        # Detect table start
        m = re.match(r'\s*(\w+):\s*defineTable\(', stripped)
        if m and not in_table:
            if current_name and current_lines:
                tables.append((current_name, '\n'.join(current_lines)))
            current_name = m.group(1)
            current_lines = [stripped]
            brace_depth = stripped.count('{') - stripped.count('}')
            in_table = True
            continue
        
        if in_table:
            current_lines.append(stripped)
            brace_depth += stripped.count('{') - stripped.count('}')
            
            # End detection: braces closed AND we see a trailing comma
            # followed by either next table or end of container
            if brace_depth <= 0 and stripped.rstrip().endswith(','):
                # Check if the last non-empty line before the comma started with .index
                # to make sure we've included all index chains
                # The table ends when we hit a line that either:
                # 1. Has brace_depth < 0 (safety)
                # 2. Is followed by a new table definition
                pass
    
    if current_name and current_lines:
        tables.append((current_name, '\n'.join(current_lines)))
    
    return tables

def extract_fields_and_indexes(text):
    fields = set()
    idx_names = set()
    for line in text.split('\n'):
        fm = re.match(r'\s*(\w+):\s*v\.', line)
        if fm: fields.add(fm.group(1))
        im = re.search(r'\.index\("([^"]+)"', line)
        if im: idx_names.add(im.group(1))
    return fields, idx_names

def make_table_definition(name, text, missing):
    """Rebuild a clean table definition with added indexes."""
    # Parse the table structure
    # Extract: defineTable({...}) part
    dt_match = re.search(r'(\w+:\s*defineTable\(\{[\s\S]*?\}\))', text, re.DOTALL)
    if not dt_match:
        return text  # fallback
    
    def_part = dt_match.group(1)
    
    # Extract existing indexes
    existing_idxs = re.findall(r'(\.index\([^)]+\))', text)
    
    # Rebuild
    result = f"  {def_part}"
    for idx in existing_idxs:
        result += f"\n    {idx}"
    for idx_name, field in missing:
        result += f'\n    .index("{idx_name}", ["{field}"])'
    result += ","
    
    return result


def fix_table_end_detection(tables, body_lines):
    """Re-parse tables with proper end detection using next-line check."""
    result = []
    
    for i, (name, content) in enumerate(tables):
        # The content was captured until the closing }), but might not include
        # the full .index() chain. Scan forward in the original body to find
        # any trailing .index() calls.
        pass
    
    return tables


def write_domain_file(domain, tables, validators_text):
    lines = []
    if domain == "shared":
        lines.append(validators_text)
        lines.append('')
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append('export const sharedTables = {')
        for name, content in sorted(tables):
            lines.append(content)
        lines.append('};')
    else:
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append(f'export const {domain}Tables = {{')
        for name, content in sorted(tables):
            lines.append(content)
        lines.append('};')
    
    path = os.path.join(SCHEMA_DIR, f"{domain}.ts")
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
    print(" EEOS Schema Modularization v4")
    print("=" * 60)
    
    content = read_file(SCHEMA_PATH)
    
    # Backup
    if not os.path.exists(SCHEMA_PATH + ".orig"):
        shutil.copy2(SCHEMA_PATH, SCHEMA_PATH + ".orig")
        print("Created .orig backup")
    
    # Extract validators (everything before const schema = defineSchema)
    val_match = re.search(r'^(.*?)const schema = defineSchema', content, re.DOTALL)
    validators = val_match.group(1).strip() if val_match else ""
    print(f"Validators: {len(validators)} chars")
    
    # Extract body
    body = extract_body(content)
    print(f"Schema body: {len(body)} chars")
    
    # Parse tables with a better approach:
    # Use regex to find each table definition as a whole
    # Pattern: starts with `name: defineTable({`, includes nested braces, ends with .index chains and comma
    
    # Build pattern to match each complete table definition
    # We need to match: name: defineTable({...}).index(...).index(...),
    # This is tricky because of nested braces. Let's use iterative scanning.
    
    lines = body.split('\n')
    tables = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Skip empty, comments, authTables
        if not stripped or stripped.startswith('//') or stripped.startswith('*') or '...authTables' in stripped:
            i += 1
            continue
        
        # Check for table definition start
        m = re.match(r'(\w+):\s*defineTable\(', stripped)
        if not m:
            i += 1
            continue
        
        name = m.group(1)
        table_lines = [stripped]
        i += 1
        
        # Now scan until we find the complete table definition
        # Complete = closing brace(s) + comma, followed by next table or EOF
        brace_depth = stripped.count('{') - stripped.count('}')
        found_end = False
        
        while i < len(lines) and not found_end:
            current = lines[i].rstrip()
            table_lines.append(current)
            
            # Track brace depth
            brace_depth += current.count('{') - current.count('}')
            
            # A table definition ends when:
            # 1. We're at depth <= 0 (all braces closed)
            # 2. The current line ends with a comma
            # 3. The next non-empty, non-comment line starts a new table
            if brace_depth <= 0 and current.rstrip().endswith(','):
                # Peek ahead
                j = i + 1
                while j < len(lines):
                    peek = lines[j].strip()
                    if not peek or peek.startswith('//'):
                        j += 1
                        continue
                    # If peek is a new table, or end of container, we're done
                    if re.match(r'\w+:\s*defineTable\(', peek) or peek == '};':
                        found_end = True
                    break
                if not found_end:
                    # Still in .index() chain or similar
                    pass
            
            i += 1
        
        table_text = '\n'.join(table_lines)
        tables.append((name, table_text))
    
    print(f"\nParsed {len(tables)} tables")
    
    from collections import defaultdict
    by_domain = defaultdict(list)
    
    total_before = 0
    total_after = 0  
    count_before = 0
    count_after = 0
    
    for name, text in tables:
        fields, idx_names = extract_fields_and_indexes(text)
        
        missing = []
        for field, idx_name in STANDARD_INDEXES.items():
            if field in fields and idx_name not in idx_names:
                missing.append((idx_name, field))
        
        # Rebuild table with added indexes
        new_text = make_table_definition(name, text, missing)
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
    
    # Create dir
    os.makedirs(SCHEMA_DIR, exist_ok=True)
    
    # Write files
    print(f"\nWriting:")
    for d, tbls in sorted(by_domain.items()):
        write_domain_file(d, tbls, validators)
    
    # Write barrel
    barrel = write_barrel(list(by_domain.keys()))
    with open(SCHEMA_PATH, 'w') as f:
        f.write(barrel)
    print(f"  {SCHEMA_PATH}: barrel export")
    
    print(f"\nIndex summary:")
    print(f"  Tables with indexes BEFORE: {count_before}/{len(tables)}")
    print(f"  Tables with indexes AFTER:  {count_after}/{len(tables)}")
    print(f"  Total indexes BEFORE: {total_before}")
    print(f"  Total added: {total_after - total_before}")
    print(f"  Total AFTER:  {total_after}")
    print(f"\n✅ Done!")

if __name__ == "__main__":
    main()
