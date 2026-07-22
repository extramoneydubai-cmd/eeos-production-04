#!/usr/bin/env node
/**
 * Null-Reference Crash Point Auditor
 *
 * Scans all .tsx files in src/pages/, src/pages/studios/, and
 * src/components/ for patterns that commonly cause
 * runtime "Cannot read properties of null/undefined" crashes.
 *
 * Usage: node audit-null-crashes.mjs
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Scan targets
const DIRS = [
  "src/pages",
  "src/pages/studios",
  "src/components/crm",
  "src/components/shared",
  "src/components/layout",
];

// ─── Pattern Definitions ──────────────────────────────────────
// Each pattern:
//   name        – Human-readable label
//   test        – (line: string) => boolean  — does this line match?
//   extract     – (line: string) => string   — what to show in the report

const PATTERNS = [
  // ── Pattern A: Index access on a property chain (e.g. .firstName[0]) ──
  {
    name: "INDEX_ON_PROP",
    severity: "🔴",
    explain:
      "Accessing [0] on a property that could be null/undefined: use (prop || '')[0]",
    test: (line) => {
      // Matches something like: .firstName[0] or .lastName[0]
      // But NOT things like: arr[0], result[0], lines[0], etc.
      // Must have a property access before the index
      return /\.\w+\[\d+\]/.test(line);
    },
    extract: (line, idx) => {
      const m = line.match(/(\.\w+\[\d+\])/);
      return `[${idx + 1}] ${line.trim().slice(0, 120)}`;
    },
  },

  // ── Pattern B: .replace() without null guard ──
  {
    name: "REPLACE_NO_GUARD",
    severity: "🔴",
    explain:
      ".replace() will crash if the value is null/undefined. Add (val || '') guard",
    test: (line) => {
      // Match: .variable.replace( or .variable.method.replace(
      // But exclude: .replace( on a string literal, || guard, optional chain,
      //   if-guard, ternary guard, or inside a comment
      if (/^\s*\/\//.test(line)) return false; // comment
      if (/\|\|\s*["']/.test(line)) return false; // already has || ''
      if (/\?\./.test(line)) return false; // already optional chaining
      if (/if\s*\(!/.test(line)) return false; // guarded by if(!x)
      // Must have .replace( call
      const replaceMatch = line.match(/\.replace\s*\(/);
      if (!replaceMatch) return false;
      // The value before .replace must be a variable/member access
      // Check it's not on a string literal or object method
      const before = line.slice(0, replaceMatch.index);
      // Skip if preceded by ?. (optional chain) or || (guard)
      const preceding5 = before.slice(-5);
      if (preceding5.includes("||") || preceding5.includes("?.")) return false;
      // Check it's a property chain access, not a method
      const chain = before.match(/([a-zA-Z_$][\w.]*)\s*$/);
      if (!chain) return false;
      // Make sure it's not a safe expression
      const name = chain[1];
      if (/^(String|Array|Object|JSON|Date|Number|RegExp|Math|console|window|document|this)$/.test(name))
        return false;
      return true;
    },
    extract: (line, idx) => {
      const m = line.match(/([\w.]+)\.replace\s*\(/);
      return `[${idx + 1}] ${line.trim().slice(0, 120)}`;
    },
  },

  // ── Pattern C: .toLowerCase() / .toUpperCase() without null guard ──
  {
    name: "CASE_NO_GUARD",
    severity: "🟠",
    explain:
      ".toLowerCase()/.toUpperCase() crashes on null. Add (val || '') guard",
    test: (line) => {
      if (/^\s*\/\//.test(line)) return false;
      if (/\|\|\s*["']/.test(line)) return false;
      if (/\?\./.test(line)) return false;
      const match = line.match(/\.(toLowerCase|toUpperCase)\s*\(/);
      if (!match) return false;
      const before = line.slice(0, match.index);
      const preceding5 = before.slice(-5);
      if (preceding5.includes("||") || preceding5.includes("?.")) return false;
      const chain = before.match(/([a-zA-Z_$][\w.]*)\s*$/);
      if (!chain) return false;
      const name = chain[1];
      if (/^(String|Array|Object|JSON|Date|Number|RegExp|Math|console|window|document|this)$/.test(name))
        return false;
      return true;
    },
    extract: (line, idx) => {
      const m = line.match(/([\w.]+)\.(toLowerCase|toUpperCase)\s*\(/);
      return `[${idx + 1}] ${line.trim().slice(0, 120)}`;
    },
  },

  // ── Pattern D: .toLocaleString() without null guard ──
  {
    name: "LOCALE_NO_GUARD",
    severity: "🟠",
    explain:
      ".toLocaleString() crashes on null. Add (val || 0) guard for numbers",
    test: (line) => {
      if (/^\s*\/\//.test(line)) return false;
      if (/\|\|\s*[0"']/.test(line)) return false;
      if (/\?\./.test(line)) return false;
      const match = line.match(/\.toLocaleString\s*\(/);
      if (!match) return false;
      const before = line.slice(0, match.index);
      const preceding5 = before.slice(-5);
      if (preceding5.includes("||") || preceding5.includes("?.")) return false;
      return true;
    },
    extract: (line, idx) => {
      return `[${idx + 1}] ${line.trim().slice(0, 120)}`;
    },
  },

  // ── Pattern E: .split() without null guard ──
  {
    name: "SPLIT_NO_GUARD",
    severity: "🟠",
    explain:
      ".split() crashes on null. Add (val || '') guard for strings",
    test: (line) => {
      if (/^\s*\/\//.test(line)) return false;
      if (/\|\|\s*["']/.test(line)) return false;
      if (/\?\./.test(line)) return false;
      const match = line.match(/\.split\s*\(/);
      if (!match) return false;
      const before = line.slice(0, match.index);
      const preceding5 = before.slice(-5);
      if (preceding5.includes("||") || preceding5.includes("?.")) return false;
      const chain = before.match(/([a-zA-Z_$][\w.]*)\s*$/);
      if (!chain) return false;
      const name = chain[1];
      if (/^(String|Array|Object|JSON|Date|Number|RegExp|Math|console|window|document|this)$/.test(name))
        return false;
      // Skip if it's a known array .split() like topics.split
      if (name.includes("topics") || name.includes("items") || name.includes("list")) return false;
      return true;
    },
    extract: (line, idx) => {
      return `[${idx + 1}] ${line.trim().slice(0, 120)}`;
    },
  },

  // ── Pattern F: Direct property access on nullable chain without ?. or || ──
  {
    name: "TEMPLATE_LITERAL_PROP",
    severity: "🟠",
    explain:
      "Template literal with property access may crash if value is null: use ${val ?? ''}",
    test: (line) => {
      if (/\$\{[^}]*\}\s*/.test(line)) {
        // A template literal with property access inside
        const inside = line.match(/\$\{([^}]*)\}/g);
        if (!inside) return false;
        for (const expr of inside) {
          const inner = expr.slice(2, -1).trim(); // remove ${ and }
          // Has property access like .name but no null guard
          if (
            inner.includes(".") &&
            !inner.includes("||") &&
            !inner.includes("??") &&
            !inner.includes("?.") &&
            !inner.includes("toString") &&
            !inner.includes("toFixed") &&
            !inner.includes("trim")
          ) {
            return true;
          }
        }
      }
      return false;
    },
    extract: (line, idx) => {
      return `[${idx + 1}] ${line.trim().slice(0, 120)}`;
    },
  },
];

// ─── Scan ─────────────────────────────────────────────────────
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of PATTERNS) {
      if (pattern.test(line, i, lines)) {
        issues.push({
          pattern: pattern.name,
          severity: pattern.severity,
          explain: pattern.explain,
          line: pattern.extract(line, i),
        });
      }
    }
  }
  return issues;
}

function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

// ─── Report ───────────────────────────────────────────────────
console.log("═".repeat(72));
console.log("  🔍 Null-Reference Crash Point Auditor");
console.log("═".repeat(72));
console.log();

const allFiles = [];
for (const dir of DIRS) {
  allFiles.push(...collectFiles(path.join(ROOT, dir)));
}

const allIssues = [];
let totalFilesWithIssues = 0;

for (const file of allFiles.sort()) {
  const relative = path.relative(ROOT, file);
  const issues = scanFile(file);

  if (issues.length > 0) {
    totalFilesWithIssues++;
    console.log(`\n📄 ${relative}  (${issues.length} issue${issues.length > 1 ? "s" : ""})`);
    console.log("─".repeat(relative.length + 10));

    // Group by pattern
    const byPattern = {};
    for (const issue of issues) {
      if (!byPattern[issue.pattern]) byPattern[issue.pattern] = [];
      byPattern[issue.pattern].push(issue);
    }

    for (const [pattern, items] of Object.entries(byPattern)) {
      const sev = items[0].severity;
      const exp = items[0].explain;
      console.log(`  ${sev} ${pattern}: ${exp}`);
      for (const item of items.slice(0, 5)) {
        console.log(`      ${item.line}`);
      }
      if (items.length > 5) {
        console.log(`      ... and ${items.length - 5} more`);
      }
    }

    allIssues.push(...issues.map((i) => ({ file: relative, ...i })));
  }
}

// ─── Summary ──────────────────────────────────────────────────
console.log();
console.log("═".repeat(72));
console.log("  📊 SUMMARY");
console.log("═".repeat(72));
console.log();
console.log(`  Files scanned:     ${allFiles.length}`);
console.log(`  Files with issues: ${totalFilesWithIssues}`);
console.log(`  Total issues:      ${allIssues.length}`);
console.log();

const byPattern = {};
for (const i of allIssues) {
  if (!byPattern[i.pattern]) byPattern[i.pattern] = { count: 0, sev: i.severity, explain: i.explain };
  byPattern[i.pattern].count++;
}
for (const [pattern, info] of Object.entries(byPattern).sort((a, b) => b[1].count - a[1].count)) {
  console.log(`  ${info.sev} ${pattern}: ${info.count} occurrences`);
}
console.log();
console.log("  Top 10 riskiest files:");
const fileCounts = {};
for (const i of allIssues) {
  if (!fileCounts[i.file]) fileCounts[i.file] = 0;
  fileCounts[i.file]++;
}
Object.entries(fileCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([file, count]) => {
    const severity = allIssues.find((i) => i.file === file)?.severity || "🟠";
    console.log(`    ${severity} ${count} issues  ${file}`);
  });

console.log();
console.log(`  🛡️  ${allFiles.length} files audited, ${allIssues.length} potential crash points found`);
console.log("═".repeat(72));
