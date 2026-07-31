import re
import subprocess

missing = set()
with open("tmp/cg_full.log") as f:
    for line in f:
        m = re.search(r'Argument of type \'"([a-zA-Z_]+)"\' is not assignable to parameter of type \'TableNamesInDataModel', line)
        if m:
            missing.add(m.group(1))

print("TOTAL MISSING:", len(missing))

for bak in ["src/convex/schema.ts.bak", "src/convex/schema.ts.bak2", "src/convex/schema.ts.bak3", "src/convex/schema.ts.orig"]:
    try:
        out = subprocess.run(["grep", "-rhoE", "[a-zA-Z_]+: defineTable", "--", bak], capture_output=True, text=True).stdout
        defined = set(re.findall(r"([a-zA-Z_]+): defineTable", out))
        found = missing & defined
        print(f"{bak}: {len(defined)} tables total, {len(found)} of missing found")
        if found:
            print("   found:", sorted(found))
    except Exception as e:
        print(bak, "ERR", e)

# For each missing table: does any schema module define it with a DIFFERENT name? show insert sites count
print("\n=== INSERT SITES PER MISSING TABLE ===")
for t in sorted(missing):
    if t.startswith("_") or t in ("withScopeAndEvents", "scopeEngine", "notificationMatrix", "automationRules", "searchEngineV2"):
        continue
    try:
        out = subprocess.run(["grep", "-rlc", 'insert("' + t + '"', "src/convex"], capture_output=True, text=True).stdout
        n = len([l for l in out.splitlines() if "_generated" not in l])
        print(f"{t:34s} insert-sites: {n}")
    except Exception as e:
        print(t, "ERR", e)
