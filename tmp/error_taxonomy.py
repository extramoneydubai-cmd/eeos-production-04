import re
from collections import Counter, defaultdict

with open("tmp/cg_full.log") as f:
    lines = f.readlines()

errs = [l for l in lines if "error TS" in l]
print("TOTAL ERROR LINES:", len(errs))

# Taxonomy by code
codes = Counter()
for l in errs:
    m = re.search(r"error (TS\d+)", l)
    if m:
        codes[m.group(1)] += 1
print("\n=== BY ERROR CODE ===")
for c, n in codes.most_common():
    print(f"{n:6d}  {c}")

# Unique messages (normalized)
msgs = Counter()
for l in errs:
    m = re.search(r"error TS\d+:\s*(.{0,90})", l)
    if m:
        msgs[m.group(1).strip()] += 1
print("\n=== UNIQUE MESSAGE PATTERNS (top 35) ===")
for m, n in msgs.most_common(35):
    print(f"{n:5d}  {m}")

# .handler call sites per file (from source, not log)
print("\n=== .handler(ctx call sites in source ===")
import subprocess
out = subprocess.run(["grep", "-rn", "\\.handler(ctx", "src/convex", "--include=*.ts"], capture_output=True, text=True).stdout
byfile = defaultdict(list)
for l in out.splitlines():
    if "_generated" in l:
        continue
    parts = l.split(":", 2)
    if len(parts) == 3:
        byfile[parts[0]].append((parts[1], parts[2].strip()[:100]))
for f in sorted(byfile):
    print(f"\n{f}")
    for ln, txt in byfile[f]:
        print(f"  :{ln}  {txt}")
