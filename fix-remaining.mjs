import fs from "node:fs";

// ================================================================
// 1. Fix auth hook - add signOut and isDemoMode
// ================================================================
const authPath = "src/hooks/use-auth.ts";
let auth = fs.readFileSync(authPath, "utf8");

if (!auth.includes("signOut")) {
  auth = auth.replace(
    "return {\n    isLoading,\n    isAuthenticated,\n    user,\n    login,\n    logout,\n  };",
    "return {\n    isLoading,\n    isAuthenticated,\n    user,\n    login,\n    logout,\n    signOut: logout,\n    isDemoMode: false,\n  };"
  );
  fs.writeFileSync(authPath, auth);
  console.log("✅ Auth hook: added signOut + isDemoMode");
} else {
  console.log("⚠️ Auth hook: already has signOut");
}

// ================================================================
// 2. Fix AccessControlStudio - remove duplicate import
// ================================================================
const acsPath = "src/pages/studio/AccessControlStudio.tsx";
let acs = fs.readFileSync(acsPath, "utf8");

// Check for duplicate useAuth imports on consecutive lines
const lines = acs.split("\n");
let removed = 0;
for (let i = lines.length - 1; i > 0; i--) {
  if (lines[i].includes('import { useAuth }') && lines[i - 1].includes('import { useAuth }')) {
    lines.splice(i, 1);
    removed++;
  }
}
if (removed > 0) {
  acs = lines.join("\n");
  fs.writeFileSync(acsPath, acs);
  console.log(`✅ AccessControlStudio: removed ${removed} duplicate import(s)`);
} else {
  console.log("⚠️ AccessControlStudio: no duplicate import found");
}

// ================================================================
// 3. Fix MasterDataBatches - type the sv variable
// ================================================================
const batchesPath = "src/pages/studios/MasterDataBatches.tsx";
let batches = fs.readFileSync(batchesPath, "utf8");

if (batches.includes("const sv = academicSubVerticals?.find((sv) =>")) {
  batches = batches.replace(
    "const sv = academicSubVerticals?.find((sv) =>",
    "const sv = academicSubVerticals?.find((sv: any) =>"
  );
  fs.writeFileSync(batchesPath, batches);
  console.log("✅ MasterDataBatches: typed sv as any");
} else if (batches.includes("const sv = academicSubVerticals?.find((sv: any)")) {
  console.log("✅ MasterDataBatches: sv already typed");
} else {
  console.log("⚠️ MasterDataBatches: pattern not found");
}

// ================================================================
// 4. Fix MasterDataPrograms - type the vert variable
// ================================================================
const programsPath = "src/pages/studios/MasterDataPrograms.tsx";
let programs = fs.readFileSync(programsPath, "utf8");

if (programs.includes("const vert = academicVerticals?.find((vert) =>")) {
  programs = programs.replace(
    "const vert = academicVerticals?.find((vert) =>",
    "const vert = academicVerticals?.find((vert: any) =>"
  );
  fs.writeFileSync(programsPath, programs);
  console.log("✅ MasterDataPrograms: typed vert as any");
} else if (programs.includes("const vert = academicVerticals?.find((vert: any)")) {
  console.log("✅ MasterDataPrograms: vert already typed");
} else {
  console.log("⚠️ MasterDataPrograms: pattern not found");
}

// ================================================================
// 5. Fix Organization files - add missing tables + update schema
// ================================================================
const schemaPath = "src/convex/schema.ts";
let schema = fs.readFileSync(schemaPath, "utf8");

// Add organizations table to schema (for the organization module)
// Find where to insert - after companies, before verticals
const verticalsIdx = schema.indexOf("\n  verticals: defineTable({");
if (verticalsIdx !== -1) {
  const orgTable = `
  organizations: defineTable({
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    taxId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"]),
`;
  schema = schema.slice(0, verticalsIdx) + orgTable + schema.slice(verticalsIdx);
  fs.writeFileSync(schemaPath, schema);
  console.log("✅ Schema: added organizations table before verticals");
} else {
  console.log("⚠️ Schema: could not find insertion point (verticals)");
}

// ================================================================
// 6. Fix remaining TS7006 implicit any errors in common files
// ================================================================
// These are in UserSwitcher.tsx, OrganizationStudio.tsx, ProfilePage.tsx, etc.
// Let's add explicit any types to common patterns

const fixImplicitAny = [
  "src/components/UserSwitcher.tsx",
  "src/pages/OrganizationStudio.tsx",
  "src/pages/ProfilePage.tsx",
];

for (const filePath of fixImplicitAny) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${filePath}: not found, skipping`);
    continue;
  }
  let content = fs.readFileSync(filePath, "utf8");
  
  // Fix .filter((x) => patterns
  const filterMatches1 = content.match(/\.filter\(\((?!.*:.*)\)/g);
  if (filterMatches1) {
    // Add :any to filter callbacks that don't have explicit types
    content = content.replace(/\.filter\(\(([a-zA-Z])\)\s*=>/g, ".filter(($1: any) =>");
    console.log(`✅ ${filePath}: fixed filter callbacks`);
  }
  
  // Fix .map((x) => patterns  
  content = content.replace(/\.map\(\(([a-zA-Z])\)\s*=>/g, ".map(($1: any) =>");
  
  // Fix .find((x) => patterns
  content = content.replace(/\.find\(\(([a-zA-Z])\)\s*=>/g, ".find(($1: any) =>");
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${filePath}: fixed implicit any types`);
}

// ================================================================
// 7. Fix Sales page implicit any types (bulk fix)
// ================================================================
const salesPages = [
  "src/pages/SalesPaymentsDashboard.tsx",
  "src/pages/SalesTasksPage.tsx",
  "src/pages/SalesWorkspace.tsx",
  "src/pages/TaskDetail.tsx",
  "src/pages/TasksPage.tsx",
  "src/pages/UsersPage.tsx",
];

for (const filePath of salesPages) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${filePath}: not found`);
    continue;
  }
  let content = fs.readFileSync(filePath, "utf8");
  
  // Fix .filter((x) => patterns (without existing :any)
  content = content.replace(/\.filter\(\(([a-zA-Z])\)\s*=>/g, ".filter(($1: any) =>");
  content = content.replace(/\.find\(\(([a-zA-Z])\)\s*=>/g, ".find(($1: any) =>");
  content = content.replace(/\.map\(\(([a-zA-Z])\)\s*=>/g, ".map(($1: any) =>");
  
  // Fix array.some((x) => patterns
  content = content.replace(/\.some\(\(([a-zA-Z])\)\s*=>/g, ".some(($1: any) =>");
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${filePath}: fixed implicit any types`);
}

console.log("\n✅ ALL REMAINING FIXES COMPLETE");
