import re
from collections import Counter

# Re-read fresh since file may have been mid-write
with open("tmp/cg_full.log") as f:
    content = f.read()
lines = content.splitlines()

errs = [l for l in lines if "error TS" in l]
print("TOTAL ERROR LINES:", len(errs))

codes = Counter()
for l in errs:
    m = re.search(r"error (TS\d+)", l)
    if m:
        codes[m.group(1)] += 1
print("\n=== BY ERROR CODE ===")
for c, n in codes.most_common():
    print(f"{n:6d}  {c}")

msgs = Counter()
for l in errs:
    m = re.search(r"error TS\d+:\s*(.{0,80})", l)
    if m:
        msgs[m.group(1).strip()] += 1
print("\n=== UNIQUE MESSAGE PATTERNS (top 30) ===")
for m, n in msgs.most_common(30):
    print(f"{n:5d}  {m}")

# Per-file counts
byfile = Counter()
for l in errs:
    m = re.match(r"(src/convex/[a-zA-Z0-9_/.]+):", l)
    if m:
        byfile[m.group(1)] += 1
print("\n=== PER-FILE COUNTS ===")
for f, c in byfile.most_common(50):
    print(f"{c:5d}  {f}")

# Verify v.id targets in .bak defs exist in current schema
import subprocess
out = subprocess.run(["grep", "-rhoE", "[a-zA-Z_]+: defineTable", "src/convex/schema"], capture_output=True, text=True).stdout
defined = set(re.findall(r"([a-zA-Z_]+): defineTable", out))
# plus authTables + users/sessions
defined |= {"users", "sessions", "accounts", "verifications"}

bak_vids = set()
with open("src/convex/schema.ts.bak") as f:
    bak = f.read()
bak_vids = set(re.findall(r'v\.id\("([a-zA-Z_]+)"\)', bak))

print("\n=== v.id targets in .bak NOT in current schema (potential new errors) ===")
for t in sorted(bak_vids - defined):
    print("  ", t)
