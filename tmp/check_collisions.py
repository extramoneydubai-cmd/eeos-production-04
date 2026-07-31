import re
import subprocess

missing = set()
with open("tmp/cg_full.log") as f:
    for line in f:
        m = re.search(r'Argument of type \'"([a-zA-Z_]+)"\' is not assignable to parameter of type \'TableNamesInDataModel', line)
        if m:
            missing.add(m.group(1))

# defined tables in current schema
out = subprocess.run(["grep", "-rhoE", "[a-zA-Z_]+: defineTable", "src/convex/schema"], capture_output=True, text=True).stdout
defined = set(re.findall(r"([a-zA-Z_]+): defineTable", out))

print("=== SIMILAR EXISTING TABLES (fuzzy match on missing) ===")
for t in sorted(missing):
    if t in defined:
        print(f"{t}: DEFINED (not actually missing!)")
        continue
    # fuzzy: prefix/suffix/infix matches
    cands = [d for d in defined if t in d or d in t or (len(t) > 4 and (t[:4] in d or d[:4] in t))]
    if cands:
        print(f"{t}: similar -> {sorted(cands)}")

# Extract .bak definitions by line slicing
print("\n=== .BAK DEFINITIONS BY LINE ===")
with open("src/convex/schema.ts.bak") as f:
    lines = f.readlines()

def find_block(tbl):
    for i, l in enumerate(lines):
        m = re.match(rf"\s*{re.escape(tbl)}:\s*defineTable", l)
        if m:
            # collect until "})," or "})," at same indent level
            out_lines = [l]
            depth = 0
            for j in range(i + 1, len(lines)):
                lj = lines[j]
                out_lines.append(lj)
                depth += lj.count("(") - lj.count(")")
                if depth <= 0 and re.match(r"\s*[a-zA-Z_]|\);|};", lj):
                    break
                if "defineTable" in lj or re.match(r"\s*[a-zA-Z_]+:\s*defineTable", lj):
                    break
                if j > i + 60:
                    break
            return "".join(out_lines)
    return None

for t in sorted(missing):
    if t in ("withScopeAndEvents", "scopeEngine", "notificationMatrix", "automationRules", "_tables"):
        continue
    blk = find_block(t)
    if blk:
        # check it actually closes with });
        print(f"\n// ---- {t} (from .bak) ----")
        print(blk.strip())
