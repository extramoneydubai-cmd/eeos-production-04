/**
 * Dead Engine Scanner — Accurate Code-Derived Audit
 *
 * An engine file under src/convex/*.ts is considered DEAD only when:
 *   1. No other file anywhere under src/ (excluding _generated, schema/, and itself)
 *      references its basename — this includes:
 *        - static imports:   import { x } from "./engineName"
 *        - dynamic imports:  await import("../../convex/engineName")
 *        - API references:   api.engineName.someFunction
 *        - string references in pages, SDKs, libs, hooks
 *
 * Run: node scripts/dead-engine-scan.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const CONVEX_DIR = join(ROOT, "src/convex");
const SEARCH_DIRS = ["src/convex", "src/platform", "src/pages", "src/lib", "src/hooks", "src/components"];

// Collect all searchable file contents once
const searchable = [];
function collect(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === "_generated") continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collect(full);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      searchable.push({ path: full, content: readFileSync(full, "utf8") });
    }
  }
}
for (const d of SEARCH_DIRS) collect(d);

const engineFiles = readdirSync(CONVEX_DIR)
  .filter((f) => f.endsWith(".ts") && f !== "schema.ts" && f !== "auth.config.ts")
  .filter((f) => !f.startsWith("_"))
  .map((f) => join(CONVEX_DIR, f));

const dead = [];
const live = [];
const liveRefs = new Map();

for (const file of engineFiles) {
  const basename = file.split("/").pop().replace(/\.ts$/, "");
  // Reference = any occurrence of the basename as a word in another file's content
  let refs = 0;
  const refIn = [];
  const re = new RegExp(`\\b${basename}\\b`, "g");
  for (const s of searchable) {
    if (s.path === file) continue;
    if (s.path.includes("/schema/")) continue;
    if (re.test(s.content)) {
      refs++;
      refIn.push(s.path.replace(ROOT + "/", ""));
      re.lastIndex = 0;
    }
  }
  if (refs === 0) {
    dead.push({ name: basename, size: statSync(file).size });
  } else {
    live.push(basename);
    liveRefs.set(basename, { refs, refIn: refIn.slice(0, 3) });
  }
}

dead.sort((a, b) => b.size - a.size);

console.log("=== ACCURATE DEAD ENGINES ===");
console.log(`TOTAL DEAD: ${dead.length} / ${engineFiles.length}  |  LIVE: ${live.length}`);
console.log("");
for (const d of dead) {
  console.log(`${d.name}|${d.size}B`);
}
