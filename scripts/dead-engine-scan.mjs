#!/usr/bin/env node
// Accurate dead-engine scan: an engine is DEAD only if neither
// (a) an import specifier referencing it, nor (b) an `api.<engine>.<fn>`
// call anywhere in src/pages + src/platform references it.
import fs from 'fs';
import path from 'path';

const ROOT = '/home/daytona/codebase/src';
const EXCLUDE = new Set(['_generated', 'crons', 'auth.config', 'index', 'schema', 'seed']);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '_generated' || ent.name === 'node_modules') continue;
      walk(p, out);
    } else if (ent.name.endsWith('.ts') || ent.name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

const allFiles = walk(ROOT);
const convexEngines = allFiles.filter(
  (f) => f.includes('/convex/') && !f.includes('/convex/schema/') && !f.includes('/convex/_generated/') && path.basename(f) !== 'schema.ts'
);

const fileIndex = new Map();
for (const f of allFiles) fileIndex.set(f, fs.readFileSync(f, 'utf8'));

// (a) direct import specifiers whose final segment == bname
const SPEC_RE = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|export\s*\{[^}]*\})\s*["']([^"']+)["']/g;
// (b) api.<engine>.<fn> / api.<engine>[ / useQuery(api.<engine>
const API_RE = /api\.([A-Za-z0-9_]+)[\s.,[)]/g;

function isReferenced(bname) {
  for (const [p, content] of fileIndex) {
    if (p.includes(`/convex/${bname}.ts`)) continue; // self
    // (a) import specifier
    SPEC_RE.lastIndex = 0;
    let m;
    while ((m = SPEC_RE.exec(content)) !== null) {
      const segs = m[1].split('/');
      if (segs[segs.length - 1] === bname) return true;
    }
    // (b) api.<engine>. reference (only from pages/platform/lib — frontend)
    if (!p.includes('/convex/')) {
      API_RE.lastIndex = 0;
      while ((m = API_RE.exec(content)) !== null) {
        if (m[1] === bname) return true;
      }
    }
  }
  return false;
}

const dead = [];
const live = [];
for (const f of convexEngines) {
  const bname = path.basename(f, '.ts');
  if (EXCLUDE.has(bname)) continue;
  if (isReferenced(bname)) live.push(bname);
  else dead.push({ bname, size: fs.statSync(f).size });
}

dead.sort((a, b) => b.size - a.size);
console.log('=== ACCURATE DEAD ENGINES ===');
console.log(`TOTAL DEAD: ${dead.length} / ${convexEngines.length}  |  LIVE: ${live.length}`);
console.log('');
for (const d of dead) console.log(`${d.bname}|${d.size}B`);
