#!/usr/bin/env python3
"""
EEOS Schema Modularization — v3 (Fixed Parser)

Uses proper brace counting to extract the defineSchema body.
"""
import os, re, shutil

SCHEMA_PATH = "src/convex/schema.ts"
SCHEMA_DIR = "src/convex/schema"

INDEX_FIELDS = [
    "organizationId", "companyId", "branchId", "departmentId",
    "teamId", "userId", "ownerId", "leadId", "studentId",
    "employeeId", "personId", "courseId", "batchId",
    "status", "isActive", "createdAt", "updatedAt",
]

TABLE_DOMAINS = {}

# Build domain map automatically from all table name prefixes
DOMAIN_PREFIXES = {
    "org": "organization", "academic": "academic", "crm": "crm",
    "lead": "crm", "call": "crm", "comm": "communication",
    "hr": "hr", "employee": "hr", "lms": "lms",
    "fee": "finance", "finance": "finance", "payment": "finance",
    "expense": "finance", "refund": "finance", "credit": "finance",
    "cash": "finance", "journal": "finance", "tax": "finance",
    "receipt": "finance", "invoice": "finance", "vendor": "finance",
    "student": "student", "parent": "student", "guardian": "student",
    "exam": "examination", "marks": "examination", "grade": "examination",
    "result": "examination", "reportCard": "examination",
    "intake": "admissions", "recruit": "recruitment",
    "inventory": "procurement", "warehouse": "procurement",
    "purchase": "procurement", "requisition": "procurement",
    "goods": "procurement", "issueRegister": "procurement",
    "returns": "procurement", "asset": "procurement",
    "vendorMaster": "procurement", "procurement": "procurement",
    "person": "people", "global": "people",
    "quotation": "crm", "opportunity": "crm", "sales": "crm",
    "approval": "workflow", "verification": "workflow", "workflow": "workflow",
    "task": "tasks", "channel": "communication", "message": "communication",
    "directMessage": "communication",
    "dashboard": "shared", "report": "shared", "kpi": "shared",
    "saved": "shared", "user": "shared",
    "form": "forms", "document": "documents", "audit": "shared",
}


def classify(name):
    for prefix, domain in DOMAIN_PREFIXES.items():
        if name.startswith(prefix):
            return domain
    if name in ("organizations", "departments", "companies", "branches",
                "teams", "verticals", "subVerticals", "boards", "designations"):
        return "organization"
    if name in ("users", "sessions", "userScopes", "notifications"):
        return "shared"
    if name in ("courses",):
        return "academic"
    if name in ("employees", "attendance", "leaveRequests"):
        return "hr"
    return "shared"


def read_file(path):
    with open(path) as f:
        return f.read()


def extract_schema_body(content):
    """Extract the body of defineSchema({{...}}) using brace counting."""
    m = re.search(r'const schema = defineSchema\(\{', content)
    if not m:
        raise ValueError("Cannot find defineSchema")
    
    start = m.end() - 1  # position of the opening {
    depth = 1
    pos = start + 1
    
    while depth > 0 and pos < len(content):
        ch = content[pos]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        pos += 1
    
    body = content[start:pos-1]  # exclude closing }
    return body, start, pos


def parse_table_definitions(body):
    """Split body into individual table definitions."""
    tables = []
    lines = body.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines and comments
        stripped = line.strip()
        if not stripped or stripped.startswith('//') or stripped.startswith('*'):
            i += 1
            continue
        
        # Skip authTables spread
        if '...authTables' in stripped:
            i += 1
            continue
        
        # Look for table definition start: name: defineTable({
        m = re.match(r'\s*(\w+):\s*defineTable\(', stripped)
        if m:
            name = m.group(1)
            table_lines = [stripped]
            
            # Track braces to find the end
            # A table definition ends at the comma after all .index() chains
            # So we need to track both the braces within defineTable({...})
            # and the .index() chains
            brace_depth = stripped.count('{') - stripped.count('}')
            in_table = True
            i += 1
            
            while i < len(lines) and in_table:
                current = lines[i]
                table_lines.append(current.rstrip())
                brace_depth += current.count('{') - current.count('}')
                
                # If we've closed all braces and we see a line ending in ,
                # followed by either EOF or a line starting a new table or comment block
                if brace_depth <= 0:
                    ls = current.rstrip()
                    if ls.endswith(','):
                        # Check next line(s) to confirm table end
                        next_idx = i + 1
                        while next_idx < len(lines):
                            nxt = lines[next_idx].strip()
                            if not nxt or nxt.startswith('//') or nxt.startswith('*'):
                                next_idx += 1
                                continue
                            break
                        
                        if next_idx >= len(lines):
                            in_table = False
                        else:
                            nxt = lines[next_idx].strip()
                            # If next non-comment line starts a new table def, we're done
                            if re.match(r'\w+:\s*defineTable\(', nxt) or nxt.startswith('};'):
                                in_table = False
                            elif nxt.startswith('.index'):
                                # Still in index chain, keep going
                                pass
                            elif nxt.startswith(')'):
                                in_table = False
                            else:
                                # Check if next line is a comment block before new table
                                pass
                i += 1
            
            content = '\n'.join(table_lines)
            tables.append((name, content))
        else:
            i += 1
    
    return tables


def get_missing_indexes(field_names, existing_idx_names):
    missing = []
    for field in INDEX_FIELDS:
        if field in field_names:
            idx_name = f"by_{field}"
            if idx_name not in existing_idx_names:
                missing.append((idx_name, [field]))
    return missing


def append_indexes(content, missing):
    if not missing:
        return content
    c = content.rstrip()
    if c.endswith(','):
        c = c[:-1]
    for idx_name, fields in missing:
        fields_str = ', '.join(f'"{f}"' for f in fields)
        c += f'\n    .index("{idx_name}", [{fields_str}])'
    c += ','
    return c


def generate_domain_file(domain, tables, validators):
    """Write a domain schema file."""
    lines = []
    if domain == "shared":
        lines.append(validators.strip())
        lines.append('')
        lines.append('import { defineTable } from "convex/server";')
        lines.append('import { v } from "convex/values";')
        lines.append('')
        lines.append(f'// ─── {domain.upper()} TABLES ───')
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
    
    path = os.path.join(SCHEMA_DIR, f"{domain}.ts")
    with open(path, 'w') as f:
        f.write('\n'.join(lines))
    print(f"  {path}: {len(tables)} tables")


def generate_barrel(domains):
    lines = [
        'import { defineSchema } from "convex/server";',
        'import { authTables } from "@convex-dev/auth/server";',
        '',
        '// ─── Re-export shared validators ───',
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
    lines.append('')
    lines.append('export default schema;')
    return '\n'.join(lines)


def main():
    print("=" * 60)
    print(" EEOS Schema Modularization v3")
    print("=" * 60)
    
    content = read_file(SCHEMA_PATH)
    shutil.copy2(SCHEMA_PATH, SCHEMA_PATH + ".bak3")
    
    # Extract validators
    m = re.search(r'^(.*?)const schema = defineSchema', content, re.DOTALL)
    validators = m.group(1).strip() if m else ""
    
    # Extract body
    body, start, end = extract_schema_body(content)
    print(f"\nSchema body: {len(body)} chars")
    
    # Parse tables
    tables = parse_table_definitions(body)
    print(f"Parsed {len(tables)} tables")
    
    # Process each table
    from collections import defaultdict
    by_domain = defaultdict(list)
    
    total_idx_before = 0
    total_idx_after = 0
    tbl_idx_before = 0
    tbl_idx_after = 0
    
    for name, table_content in tables:
        fields = set()
        idx_names = set()
        
        for line in table_content.split('\n'):
            fm = re.match(r'\s*(\w+):\s*v\.', line)
            if fm: fields.add(fm.group(1))
            im = re.search(r'\.index\("([^"]+)"', line)
            if im: idx_names.add(im.group(1))
        
        missing = get_missing_indexes(fields, idx_names)
        new_content = append_indexes(table_content, missing)
        domain = classify(name)
        
        if len(idx_names) > 0: tbl_idx_before += 1
        if len(idx_names) + len(missing) > 0: tbl_idx_after += 1
        total_idx_before += len(idx_names)
        total_idx_after += len(idx_names) + len(missing)
        
        if missing:
            print(f"  +{len(missing)} idx -> {name}: {', '.join(m[0] for m in missing)}")
        
        by_domain[domain].append((name, new_content))
    
    print(f"\nDomain distribution:")
    for d, tbls in sorted(by_domain.items()):
        print(f"  {d}: {len(tbls)} tables")
    
    # Create schema dir
    os.makedirs(SCHEMA_DIR, exist_ok=True)
    
    # Write domain files
    print(f"\nWriting domain files:")
    for d, tbls in sorted(by_domain.items()):
        generate_domain_file(d, tbls, validators if d == "shared" else "")
    
    # Write barrel
    barrel = generate_barrel(list(by_domain.keys()))
    with open(SCHEMA_PATH, 'w') as f:
        f.write(barrel)
    
    print(f"\nIndex summary:")
    print(f"  Tables with indexes BEFORE: {tbl_idx_before}/{len(tables)}")
    print(f"  Tables with indexes AFTER:  {tbl_idx_after}/{len(tables)}")
    print(f"  Total indexes BEFORE: {total_idx_before}")
    print(f"  Total indexes added:  {total_idx_after - total_idx_before}")
    print(f"  Total indexes AFTER:  {total_idx_after}")
    
    print(f"\n✅ Done!")


if __name__ == "__main__":
    main()
