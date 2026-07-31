import re, collections

def strip_ansi(s):
    return re.sub(r'\x1b\[[0-9;]*m', '', s)

errors = []  # (file, line, code, msg)
seen_lines = set()
with open('/tmp/tc.log') as f:
    for line in f:
        clean = strip_ansi(line.rstrip('\n'))
        m = re.match(r'^(\S+?):(\d+):(\d+)\s+-\s+error\s+(TS\d+):\s*(.*)$', clean)
        if m:
            key = (m.group(1), int(m.group(2)))
            if key in seen_lines:
                continue
            seen_lines.add(key)
            errors.append((m.group(1), int(m.group(2)), m.group(4), m.group(5).strip()))

errors.sort()
print('TOTAL ERRORS:', len(errors))
print('=== BY FILE ===')
for fl, n in collections.Counter(e[0] for e in errors).most_common():
    print('%4d  %s' % (n, fl))
print('=== BY CODE ===')
for c, n in collections.Counter(e[2] for e in errors).most_common():
    print('%4d  %s' % (n, c))

with open('tmp/errors_full.txt', 'w') as out:
    for e in errors:
        out.write('%s:%d [%s] %s\n' % (e[0], e[1], e[2], e[3]))
print('=== wrote tmp/errors_full.txt (%d lines) ===' % len(errors))
