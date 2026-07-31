import re
import subprocess
from collections import defaultdict

missing = {}
with open("tmp/cg_full.log") as f:
    for line in f:
        m = re.search(r"Argument of type '\"([a-zA-Z_]+)\"' is not assignable to parameter of type 'TableNamesInDataModel", line)
        if m:
            missing[m.group(1)] = missing.get(m.group(1), 0) + 1

# module names mistakenly used as table names in audit scripts (files slated for deletion)
non_tables = {"withScopeAndEvents", "scopeEngine", "notificationMatrix", "automationRules", "_tables", "searchEngineV2", "relationships"}

tables = {t: c for t, c in missing.items() if t not in non_tables and not t.startswith("_")}
print("MISSING_TABLES:", len(tables))
for t in sorted(tables):
    print(" ", t)

# index requirements per table from source .withIndex usage
print("\n=== INDEX REQUIREMENTS ===")
for t in sorted(tables):
    idxs = set()
    try:
        out = subprocess.run(["grep", "-rn", 'query("' + t + '"', "src/convex", "--include=*.ts"], capture_output=True, text=True, timeout=30).stdout
        files = set()
        for l in out.splitlines():
            if "_generated" in l:
                continue
            parts = l.split(":", 2)
            if len(parts) == 3 and parts[0].endswith(".ts"):
                files.add(parts[0])
        for fp in files:
            try:
                with open(fp) as fh:
                    fl = fh.readlines()
                for i, ll in enumerate(fl):
                    if 'query("' + t + '"' in ll:
                        for j in range(i, min(i + 6, len(fl))):
                            for mm in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"', fl[j]):
                                idxs.add(mm.group(1))
            except Exception:
                pass
    except Exception:
        pass
    print(f"{t}|{','.join(sorted(idxs))}")
