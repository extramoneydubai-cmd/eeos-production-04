import fs from "node:fs";

const lines = fs.readFileSync("src/convex/schema.ts", "utf8").split("\n");
const start = Math.max(0, 938);
const end = Math.min(lines.length, 958);

console.log(`Schema lines ${start + 1} to ${end}:`);
for (let i = start; i < end; i++) {
  console.log(`${i + 1}: ${lines[i] || "<EMPTY>"}`);
}
