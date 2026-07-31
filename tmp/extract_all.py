import re
import subprocess
import json

# ---------- 1. Missing tables from a FRESH codegen run embedded here ----------
# (read from the file; if stale, caller re-runs codegen first)
missing = set()
try:
    with open("tmp/cg_full.log") as f:
        for line in f:
            m = re.search(r'Argument of type \'"([a-zA-Z_]+)"\' is not assignable to parameter of type \'TableNamesInDataModel', line)
            if m:
                missing.add(m.group(1))
except FileNotFoundError:
    pass

print("MISSING_COUNT:", len(missing))

# ---------- 2. Extract .bak definitions with proper brace matching ----------
with open("src/convex/schema.ts.bak") as f:
    content = f.read()

def extract_block(tbl):
    # find "tbl: defineTable("
    pat = re.compile(r"(\s*)" + re.escape(tbl) + r":\s*defineTable\(")
    m = pat.search(content)
    if not m:
        return None
    start = m.start()
    # walk to find balanced parens starting from the defineTable(
    open_paren = content.index("defineTable(", start) + len("defineTable(")
    depth = 1
    i = open_paren
    in_str = None
    while i < len(content) and depth > 0:
        ch = content[i]
        if in_str:
            if ch == "\\":
                i += 2
                continue
            if ch == in_str:
                in_str = None
        else:
            if ch in ('"', "'", "`"):
                in_str = ch
            elif ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    break
        i += 1
    block = content[start:i + 1]
    return block

bak_defs = {}
for t in missing:
    b = extract_block(t)
    if b:
        bak_defs[t] = b

print("BAK_FOUND:", len(bak_defs))
for t in sorted(bak_defs):
    print(f"\n// ---- {t} ----")
    print(bak_defs[t])

# ---------- 3. Index requirements for all missing tables ----------
print("\n\n=== INDEXES PER TABLE ===")
for t in sorted(missing):
    if t in ("withScopeAndEvents", "scopeEngine", "notificationMatrix", "automationRules", "_tables"):
        continue
    try:
        out = subprocess.run(
            ["grep", "-rn", 'query("' + t + '"', "src/convex"],
            capture_output=True, text=True, timeout=30,
        ).stdout
        idxs = set()
        files = set()
        for line in out.splitlines():
            if "_generated" in line:
                continue
            parts = line.split(":", 2)
            if len(parts) == 3:
                files.add(parts[0])
            for mm in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"', line):
                idxs.add(mm.group(1))
        for fp in files:
            try:
                with open(fp) as fh:
                    fl = fh.readlines()
                for li, ll in enumerate(fl):
                    if 'query("' + t + '"' in ll:
                        for j in range(li, min(li + 5, len(fl))):
                            for mm in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"', fl[j]):
                                idxs.add(mm.group(1))
            except Exception:
                pass
        if idxs:
            print(f"{t:34s} -> {sorted(idxs)}")
    except Exception as e:
        print(t, "ERR", e)
