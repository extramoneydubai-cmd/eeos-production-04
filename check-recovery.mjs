import fs from "node:fs";

const schema = fs.readFileSync("src/convex/schema.ts", "utf8");
const lines = schema.split("\n");

// Check around academicSessions
const asyncIdx = schema.indexOf("academicSessions:");
console.log("academicSessions found at approximate char:", asyncIdx);

// Show lines around 930-960
const startLine = Math.max(0, asyncIdx === -1 ? 930 : asyncIdx - 3);
const endLine = Math.min(lines.length, asyncIdx === -1 ? 1050 : asyncIdx + 80);

// Convert char index to line number
let lineNum = 1;
for (let i = 0; i < asyncIdx; i++) {
  if (schema[i] === "\n") lineNum++;
}

console.log(`\nacademicSessions starts around line ${lineNum}`);
const displayStart = Math.max(0, lineNum - 5);
const displayEnd = Math.min(lines.length, lineNum + 60);

for (let i = displayStart; i < displayEnd; i++) {
  console.log(`${i + 1}: ${lines[i] || "<EMPTY>"}`);
}

// Check for demo tables
console.log("\n\nDemo tables check:");
["demoOrganizations", "demoProfiles", "demoLeads", "organization"].forEach(t => {
  console.log(`  ${t}: ${schema.includes(t) ? "FOUND" : "MISSING"}`);
});
