import re, collections

errors = []  # (file, line, code, msg)
with open('tmp/cgGate.log') as f:
    for line in f:
        m = re.match(r'^([\w./-]+):(\d+):(\d+) - error (TS\d+): (.*)', line)
        if m:
            errors.append((m.group(1), int(m.group(2)), m.group(4), m.group(5).strip()))

print('TOTAL ERRORS:', len(errors))
print()
print('=== BY ERROR CODE ===')
codes = collections.Counter(e[2] for e in errors)
for c, n in codes.most_common():
    print(f'{c}: {n}')

print()
print('=== BY FILE ===')
files = collections.Counter(e[0] for e in errors)
for fl, n in files.most_common():
    print(f'{n:4d}  {fl}')

print()
print('=== MISSING TABLE (TableNamesInDataModel) REMAINING ===')
for e in errors:
    if 'TableNamesInDataModel' in e[3] or 'not assignable to parameter of type' in e[3]:
        print(f'{e[0]}:{e[1]} - {e[3][:160]}')

print()
print('=== SAMPLE: first 3 errors per file ===')
seen = set()
for e in errors:
    if e[0] not in seen:
        seen.add(e[0])
        for e2 in [x for x in errors if x[0] == e[0]][:3]:
            print(f'{e2[0]}:{e2[1]} [{e2[2]}] {e2[3][:200]}')
        print()
