import fs from "node:fs";

const lines = fs.readFileSync("src/convex/schema.ts", "utf8").split("\n");

// Find the broken area by looking for the "st" fragment
for (let i = 900; i < Math.min(lines.length, 960); i++) {
  console.log(`${i + 1}: ${lines[i] || "<EMPTY>"}`);
}
