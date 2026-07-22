import fs from "node:fs";

const lines = fs.readFileSync("src/convex/schema.ts", "utf8").split("\n");

// Show lines 920-1100 to see the full corrupted area
for (let i = 920; i < Math.min(lines.length, 1100); i++) {
  console.log(`${i + 1}: ${lines[i] || "<EMPTY>"}`);
}
