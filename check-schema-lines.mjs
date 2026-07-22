import { readFileSync } from 'fs';
const lines = readFileSync('src/convex/schema.ts', 'utf8').split('\n');
for (let i = 1395; i < Math.min(lines.length, 1430); i++) {
  const trimmed = (lines[i] || '').substring(0, 120);
  console.log((i+1) + '|' + trimmed);
}
