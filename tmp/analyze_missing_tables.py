import re
import subprocess
import os

# 1. Extract unique missing table names from codegen log
errs = {}
with open("tmp/cg_full.log") as f:
    for line in f:
        m = re.search(r"Argument of type '\"([a-zA-Z_]+)\"' is not assignable to parameter of type 'TableNamesInDataModel", line)
        if m:
            errs[m.group(1)] = errs.get(m.group(1), 0) + 1

print("=== UNIQUE MISSING TABLES (count = rejections in log) ===")
missing = sorted(errs, key=lambda t: -errs[t])
for t in missing:
    print(f"{errs[t]:5d}  {t}")
print(f"\nTOTAL MISSING: {len(missing)}")

# 2. For each missing table, find insert() call sites to derive field shapes
print("\n=== INSERT SHAPES PER MISSING TABLE ===")
for t in missing:
    print(f"\n----- {t} -----")
    try:
        out = subprocess.run(
            ["grep", "-rn", f'insert("{t}"', "src/convex"],
            capture_output=True, text=True, timeout=30,
        )
        lines = [l for l in out.stdout.splitlines() if "_generated" not in l]
        for l in lines[:3]:
            # print filename and the insert call plus a couple following lines
            parts = l.split(":", 2)
            if len(parts) == 3:
                fn, ln, _ = parts[0], parts[1], parts[2]
                with open(fn) as fh:
                    content = fh.readlines()
                start = max(0, int(ln) - 1)
                snippet = "".join(content[start:start + 14])
                print(f"  [{fn}:{ln}]")
                print("   " + snippet.replace("\n", "\n   ")[:900])
    except Exception as e:
        print("  err", e)
