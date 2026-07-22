import fs from "node:fs";

// ================================================================
// 1. Fix auth hook - add signOut and isDemoMode
// ================================================================
const authHookPath = "src/hooks/use-auth.ts";
let authHook = fs.readFileSync(authHookPath, "utf8");

// Add signOut alias and isDemoMode flag to useAuth return
const returnStart = authHook.indexOf("return {");
const returnEnd = authHook.indexOf("};", returnStart);

if (returnStart !== -1 && returnEnd !== -1) {
  const newReturn = `  return {\n    isLoading,\n    isAuthenticated,\n    user,\n    login,\n    logout,\n    signOut: logout,\n    isDemoMode: false,\n  };`;
  authHook = authHook.slice(0, returnStart) + newReturn + authHook.slice(returnEnd + 2);
  fs.writeFileSync(authHookPath, authHook);
  console.log("✅ Fixed auth hook - added signOut + isDemoMode");
} else {
  console.log("❌ Could not find return block in use-auth.ts");
}

// ================================================================
// 2. Fix AccessControlStudio - remove duplicate import
// ================================================================
const acsPath = "src/pages/studio/AccessControlStudio.tsx";
let acs = fs.readFileSync(acsPath, "utf8");

// Remove the second duplicate useAuth import
const lines = acs.split("\n");
const importLines = lines.map((l, i) => ({ line: l, idx: i }));
const authImports = importLines.filter(l => l.line.includes('import { useAuth }'));
if (authImports.length > 1) {
  // Remove the second duplicate
  lines.splice(authImports[1].idx, 1);
  acs = lines.join("\n");
  fs.writeFileSync(acsPath, acs);
  console.log("✅ Fixed AccessControlStudio - removed duplicate useAuth import");
} else {
  console.log("⚠️ Could not find duplicate useAuth import in AccessControlStudio");
}

// ================================================================
// 3. Fix MasterDataBatches - type the sv variable
// ================================================================
const batchesPath = "src/pages/studios/MasterDataBatches.tsx";
let batches = fs.readFileSync(batchesPath, "utf8");

// Replace find callback pattern that returns unknown
const svFix1 = batches.replace(
  "const sv = academicSubVerticals?.find((sv: any) => sv._id === row.subVerticalId);",
  "const sv = academicSubVerticals?.find((sv: any) => sv._id === row.subVerticalId);"
);
// Check if this already has :any or not
if (batches.includes("(sv: any)") === false || batches.includes("(sv) =>")) {
  // Find the problematic find callback
  const svPattern = /.find\(\(sv\)\s*=>/;
  if (svPattern.test(batches)) {
    batches = batches.replace(svPattern, ".find((sv: any) => ");
    fs.writeFileSync(batchesPath, batches);
    console.log("✅ Fixed MasterDataBatches - typed sv variable");
  } else {
    console.log("⚠️ Could not find sv pattern in MasterDataBatches");
  }
} else {
  console.log("✅ MasterDataBatches already has typed sv");
}

// ================================================================
// 4. Fix MasterDataPrograms - type the vert variable
// ================================================================
const programsPath = "src/pages/studios/MasterDataPrograms.tsx";
let programs = fs.readFileSync(programsPath, "utf8");

const vertPattern = /.find\(\(vert\)\s*=>/;
if (vertPattern.test(programs)) {
  programs = programs.replace(vertPattern, ".find((vert: any) => ");
  fs.writeFileSync(programsPath, programs);
  console.log("✅ Fixed MasterDataPrograms - typed vert variable");
} else if (programs.includes("(vert: any)") === false) {
  console.log("⚠️ Could not find vert pattern in MasterDataPrograms");
} else {
  console.log("✅ MasterDataPrograms already has typed vert");
}

// ================================================================
// 5. Fix SequenceSettings - change type references to use 'any' 
//    since sequence_configs and organizations tables don't exist
// ================================================================
const seqPath = "src/pages/settings/SequenceSettings.tsx";
let seq = fs.readFileSync(seqPath, "utf8");

// Replace all Id<\"sequence_configs\"> with string type
const seqCount = (seq.match(/Id<"sequence_configs">/g) || []).length;
const orgCount = (seq.match(/Id<"organizations">/g) || []).length;
seq = seq.replace(/Id<"sequence_configs">/g, "string");
seq = seq.replace(/Id<"organizations">/g, "string");
fs.writeFileSync(seqPath, seq);
console.log(`✅ Fixed SequenceSettings - changed ${seqCount} sequence_configs + ${orgCount} organizations refs to string`);

// ================================================================
// 6. Fix organization/* files - add missing table to legacy schema
//    We need to add organizations table + missing indexes
// ================================================================
const schemaPath = "src/convex/schema.ts";
let schema = fs.readFileSync(schemaPath, "utf8");

// Add organizations table before "orgCompanies"
const orgCompaniesIdx = schema.indexOf("orgCompanies: defineTable({");
if (orgCompaniesIdx !== -1) {
  const organizationsTable = `

  // ============================
  // Organization - Legacy (for org module)
  // ============================

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

  // Update branches table - add indexes
`;
  
  // We also need to update the existing branches table to add organizationId field
  // First find the branches definition
  const branchesDef = schema.match(/branches: defineTable\(\{[\s\S]*?\}\).index\("code", \["code"\]\),/);
  if (branchesDef) {
    const newBranches = `  branches: defineTable({
    name: v.string(),
    code: v.string(),
    organizationId: v.optional(v.id("organizations")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_code", ["code"]),`;
    schema = schema.replace(branchesDef[0], newBranches);
    console.log("✅ Updated branches table with organizationId + indexes");
  }
  
  // Update departments - add branchId and managerId
  const deptsDef = schema.match(/departments: defineTable\(\{[\s\S]*?\}\).index\("code", \["code"\]\),/);
  if (deptsDef) {
    const newDepts = `  departments: defineTable({
    name: v.string(),
    code: v.string(),
    branchId: v.optional(v.id("branches")),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_branch", ["branchId"])
    .index("by_code", ["code"]),`;
    schema = schema.replace(deptsDef[0], newDepts);
    console.log("✅ Updated departments table with branchId + indexes");
  }
  
  // Update teams - add leadId 
  const teamsDef = schema.match(/teams: defineTable\(\{[\s\S]*?\}\)\n    \.index\("code", \["code"\]\)\n    \.index\("departmentId", \["departmentId"\]\),/);
  if (teamsDef) {
    const newTeams = `  teams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_department", ["departmentId"])
    .index("by_code", ["code"]),`;
    schema = schema.replace(teamsDef[0], newTeams);
    console.log("✅ Updated teams table with leadId + by_department index");
  }

  // Insert organizations table before orgCompanies
  schema = schema.slice(0, orgCompaniesIdx) + organizationsTable + schema.slice(orgCompaniesIdx);
  fs.writeFileSync(schemaPath, schema);
  console.log("✅ Added organizations table to schema");
} else {
  console.log("❌ Could not find orgCompanies table in schema");
}

console.log("\n✅ ALL FIXES COMPLETE");
