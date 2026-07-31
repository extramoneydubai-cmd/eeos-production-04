import re
import subprocess

# Extract .bak definitions WITH indexes for the 28 authoritative tables
missing = {}
with open("tmp/cg_full.log") as f:
    for line in f:
        m = re.search(r'Argument of type \'"([a-zA-Z_]+)"\' is not assignable to parameter of type \'TableNamesInDataModel', line)
        if m:
            missing[m.group(1)] = True

non_tables = {"withScopeAndEvents", "scopeEngine", "notificationMatrix", "automationRules", "_tables", "searchEngineV2"}
tables = {t for t in missing if t not in non_tables and not t.startswith("_")}

with open("src/convex/schema.ts.bak") as f:
    bak = f.read()

def extract_block(tbl):
    pat = re.compile(r"(\s*)" + re.escape(tbl) + r":\s*defineTable\(")
    m = pat.search(bak)
    if not m:
        return None
    start = m.start()
    open_paren = bak.index("defineTable(", start) + len("defineTable(")
    depth = 1
    i = open_paren
    in_str = None
    while i < len(bak) and depth > 0:
        ch = bak[i]
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
    return bak[start:i + 1]

print("=== 28 AUTHORITATIVE .BAK DEFINITIONS (WITH INDEXES) ===")
found = []
for t in sorted(tables):
    b = extract_block(t)
    if b:
        found.append(t)
        print(f"\n// ---- {t} ----")
        print(b)
print("\nBAK COUNT:", len(found))

# For tables NOT in bak: extract withIndex name -> eq field names from engine usage
print("\n\n=== WITHINDEX FIELD USAGE FOR NON-BAK TABLES ===")
for t in sorted(tables):
    if t in found:
        continue
    try:
        out = subprocess.run(["grep", "-rn", 'query("' + t + '"', "src/convex", "--include=*.ts"], capture_output=True, text=True, timeout=30).stdout
        files = set()
        for l in out.splitlines():
            if "_generated" in l:
                continue
            parts = l.split(":", 2)
            if len(parts) == 3 and parts[0].endswith(".ts"):
                files.add(parts[0])
        results = {}
        for fp in files:
            try:
                with open(fp) as fh:
                    fl = fh.readlines()
                for i, ll in enumerate(fl):
                    if 'query("' + t + '"' in ll:
                        # scan up to 8 lines for withIndex + eq chains
                        chunk = "".join(fl[i:i + 10])
                        for mm in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"\s*,\s*\(?q\)?\s*=>\s*(.*?)\)\s*\)', chunk, re.DOTALL):
                            name = mm.group(1)
                            eqs = re.findall(r'\.eq\("([a-zA-Z_0-9]+)"', mm.group(2))
                            results[name] = eqs
                        # fallback: withIndex on its own line
                        for mm in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"', chunk):
                            results.setdefault(mm.group(1), [])
            except Exception:
                pass
        print(f"{t}: {results}")
    except Exception as e:
        print(t, "ERR", e)
