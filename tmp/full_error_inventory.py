import re
from collections import Counter, defaultdict

lines = []
with open("tmp/cg_full.log") as f:
    lines = f.readlines()

errs = [l for l in lines if "error TS" in l]
print("TOTAL ERROR LINES:", len(errs))

# distinct error messages (code + short text)
msgs = Counter()
for l in errs:
    m = re.search(r"error (TS\d+): (.{0,110})", l)
    if m:
        msgs[(m.group(1), m.group(2).strip())] += 1

print("\n=== DISTINCT ERROR MESSAGES ===")
for (code, txt), c in msgs.most_common(40):
    print(f"{c:5d}  {code} {txt}")

# suspicious: module names as table names
print("\n=== SUSPICIOUS ENTRIES (module names as tables) ===")
for pat in ["withScopeAndEvents", "scopeEngine", "notificationMatrix", "automationRules", "_tables"]:
    for l in errs:
        if pat in l and "TableNamesInDataModel" in l:
            fn = l.split(":")[0].split("/")[-1]
            print(f"  {pat}: {fn} {l.strip()[:120]}")
            break

# per-file error counts
print("\n=== PER-FILE ERROR COUNTS ===")
byfile = Counter()
for l in errs:
    m = re.match(r"(src/convex/[a-zA-Z0-9_./]+):", l)
    if m:
        byfile[m.group(1)] += 1
for f, c in byfile.most_common(60):
    print(f"{c:5d}  {f}")
