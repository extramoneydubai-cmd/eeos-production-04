import https from "node:https";
import fs from "node:fs";
import AdmZip from "adm-zip";

const ZIP_URL = "https://github.com/extramoneydubai-cmd/eeos-lite-9july-01/archive/refs/heads/main.zip";
const ZIP_PATH = "/tmp/repo-recovery.zip";
const EXTRACT_PATH = "/tmp/repo-extracted";

// Download
console.log("Downloading repo zip...");
await new Promise((resolve, reject) => {
  const file = fs.createWriteStream(ZIP_PATH);
  https.get(ZIP_URL, (res) => {
    res.pipe(file);
    file.on("finish", () => { file.close(); resolve(); });
  }).on("error", reject);
});

console.log("Extracting...");
const zip = new AdmZip(ZIP_PATH);
zip.extractAllTo(EXTRACT_PATH, true);

const entries = fs.readdirSync(EXTRACT_PATH);
const repoFolder = entries.find(e => e.startsWith("eeos-lite-9july-01"));
if (!repoFolder) throw new Error("Repo folder not found");

const sourceDir = `${EXTRACT_PATH}/${repoFolder}`;

// Read the original schema
const originalSchema = fs.readFileSync(`${sourceDir}/src/convex/schema.ts`, "utf8");
console.log("Original schema length:", originalSchema.length);

// Read the current (corrupted) schema
const currentSchema = fs.readFileSync("src/convex/schema.ts", "utf8");
console.log("Current schema length:", currentSchema.length);

// Check which version has our demo tables
if (currentSchema.length > originalSchema.length) {
  console.log("Current schema is larger - contains demo tables. Let's fix it.");
  
  // The fix-all-errors.mjs script corrupted the academicSessions table and added organizations
  // Let's undo those specific changes
  
  // Find the organizations table that was incorrectly added and remove it
  const orgTableStart = currentSchema.indexOf("  // ============================\n  // Organization - Legacy (for org module)\n");
  const orgTableEnd = currentSchema.indexOf("  orgCompanies:", orgTableStart);
  
  if (orgTableStart !== -1 && orgTableEnd !== -1) {
    // Remove the incorrectly inserted organizations table + comment block
    const fixed = currentSchema.slice(0, orgTableStart) + currentSchema.slice(orgTableEnd);
    fs.writeFileSync("src/convex/schema.ts", fixed);
    console.log("Removed corrupted section from schema");
  } else {
    console.log("Could not find insertion markers, trying alternate approach...");
  }
  
  // Now check if academicSessions is corrupted
  const newSchema = fs.readFileSync("src/convex/schema.ts", "utf8");
  const asyncIdx = newSchema.indexOf("academicSessions: defineTable({");
  if (asyncIdx !== -1) {
    const after = newSchema.substring(asyncIdx, asyncIdx + 300);
    console.log("After academicSessions:", after.substring(0, 200));
  }
} else {
  console.log("Current schema is same or smaller. Replacing with original + demo tables.");
  
  // Re-add demo tables to the original
  const demoMarker = "},\n  schemaValidation: false,";
  const insertIdx = originalSchema.lastIndexOf(demoMarker);
  if (insertIdx === -1) throw new Error("Schema marker not found");
  
  // Read the demo tables definition from the previous fix
  // We already have them from the current schema
  const currentDemoStart = currentSchema.indexOf("demoOrganizations:");
  if (currentDemoStart !== -1) {
    const demoSection = currentSchema.substring(
      currentSchema.lastIndexOf("// ============================\n  // Demo Environment Tables", currentDemoStart) - 2,
      currentSchema.indexOf("},\n  schemaValidation: false,")
    );
    
    const restored = originalSchema.slice(0, originalSchema.lastIndexOf(",\n}, {\n  schemaValidation: false,") + 1) + 
                     "\n" + demoSection + "\n" + 
                     originalSchema.slice(originalSchema.lastIndexOf(",\n}, {\n  schemaValidation: false,") + 1);
    
    fs.writeFileSync("src/convex/schema.ts", restored);
    console.log("Restored schema with demo tables. New length:", restored.length);
  } else {
    console.log("Could not find demo tables in current schema");
  }
}
