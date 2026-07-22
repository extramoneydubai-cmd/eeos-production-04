const fs = require("fs");
const path = require("path");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!p.includes("/convex") || p.includes("/convex/_generated")) {
        files.push(...walk(p));
      }
    } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
      files.push(p);
    }
  }
  return files;
}

const files = walk("src");
let fixedCount = 0;

for (const f of files) {
  // Skip files inside src/convex/ (they use @convex/ by convention)
  if (f.startsWith("src/convex/") && !f.includes("/convex/_generated")) continue;
  if (f.includes("/convex/_generated")) continue; // generated files are fine

  const content = fs.readFileSync(f, "utf8");
  const newContent = content.replace(
    /from\s+"@convex\/_generated\//g,
    'from "@/convex/_generated/'
  );
  if (newContent !== content) {
    fs.writeFileSync(f, newContent, "utf8");
    console.log(`FIXED: ${f}`);
    fixedCount++;
  }
}

console.log(`\nDone. Fixed ${fixedCount} files.`);
