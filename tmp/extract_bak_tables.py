import re
import subprocess

missing = set()
with open("tmp/cg_full.log") as f:
    for line in f:
        m = re.search(r'Argument of type \'"([a-zA-Z_]+)"\' is not assignable to parameter of type \'TableNamesInDataModel', line)
        if m:
            missing.add(m.group(1))

# 1. Extract defineTable blocks from schema.ts.bak
with open("src/convex/schema.ts.bak") as f:
    content = f.read()

blocks = {}
for m in re.finditer(r"\n(\s*)([a-zA-Z_]+):\s*defineTable\((.*?)\n\s*\),?\n(?=\s*[a-zA-Z_]+:\s*defineTable|\s*\};)", content, re.DOTALL):
    name = m.group(2)
    if name in missing:
        blocks[name] = m.group(0).strip("\n")

print("=== VERBATIM .BAK DEFINITIONS (28) ===")
for name in sorted(blocks):
    print(f"\n// ---- {name} ----")
    print(blocks[name])

# 2. Collect withIndex names per missing table from engines
print("\n\n=== INDEXES USED PER MISSING TABLE ===")
for t in sorted(missing):
    try:
        out = subprocess.run(
            ["grep", "-rn", 'query("' + t + '"', "src/convex"],
            capture_output=True, text=True, timeout=30,
        ).stdout
        idxs = set()
        for line in out.splitlines():
            for m in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"', line):
                idxs.add(m.group(1))
            # also subsequent lines in same file (index calls on following lines)
        # second pass: context lines
        for fpath in set(l.split(":")[0] for l in out.splitlines() if "_generated" not in l):
            with open(fpath) as fh:
                fl = fh.readlines()
            for i, line in enumerate(fl):
                if 'query("' + t + '"' in line:
                    for j in range(i, min(i + 6, len(fl))):
                        for m in re.finditer(r'\.withIndex\("([a-zA-Z_0-9]+)"', fl[j]):
                            idxs.add(m.group(1))
        if idxs:
            print(f"{t:34s} indexes: {sorted(idxs)}")
    except Exception as e:
        print(t, "ERR", e)
