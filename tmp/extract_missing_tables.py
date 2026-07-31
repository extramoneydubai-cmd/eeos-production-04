import re

errs = {}
with open("/tmp/cg7.log") as f:
    for line in f:
        if "TableNamesInDataModel" in line and "error TS2345" in line:
            m = re.search(r"Argument of type '\"([a-zA-Z_]+)\"'", line)
            if m:
                errs[m.group(1)] = errs.get(m.group(1), 0) + 1

print("=== UNIQUE TABLES REJECTED AS NOT IN DATA MODEL ===")
for t, c in sorted(errs.items(), key=lambda x: -x[1]):
    print(f"{c:5d}  {t}")

# Also: other TS2345 errors (index mismatches etc.) — the file/line to find cascade sources
print("\n=== ERROR LINE COUNT ===")
with open("/tmp/cg7.log") as f:
    total = sum(1 for l in f if "error TS" in l)
print(total)
