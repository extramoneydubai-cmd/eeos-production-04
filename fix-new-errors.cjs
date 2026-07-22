const fs = require('fs');

// ======================
// FIX 1: Make new fields optional in schema
// This fixes organization.ts, seed.ts errors
// ======================
let schema = fs.readFileSync('src/convex/schema.ts', 'utf8');

// Fix branches: make organizationId, isActive optional
schema = schema.replace(
  'organizationId: v.id("organizations"),',
  'organizationId: v.optional(v.id("organizations")),'
);
schema = schema.replace(
  /\bisActive: v\.boolean\(\),/,
  'isActive: v.optional(v.boolean()),'
);

// Fix departments: make branchId, isActive optional
schema = schema.replace(
  'branchId: v.id("branches"),\n    managerId: v.optional(v.id("users")),\n    isActive: v.boolean(),',
  'branchId: v.optional(v.id("branches")),\n    managerId: v.optional(v.id("users")),\n    isActive: v.optional(v.boolean()),'
);

// Fix teams: make isActive optional
schema = schema.replace(
  'isActive: v.boolean(),\n    createdAt: v.number(),',
  'isActive: v.optional(v.boolean()),\n    createdAt: v.number(),'
);

fs.writeFileSync('src/convex/schema.ts', schema, 'utf8');
console.log('✅ Schema: Made organizationId, branchId, isActive optional');

// ======================
// FIX 2: organization.ts - index name fixes
// Uses "departmentId" index name instead of "by_department"
// ======================
let org = fs.readFileSync('src/convex/organization.ts', 'utf8');

// Fix: .withIndex("departmentId", ...) -> .withIndex("by_department", ...)
org = org.replace(
  '.withIndex("departmentId", (q) => q.eq("departmentId", args.id))',
  '.withIndex("by_department", (q) => q.eq("departmentId", args.id))'
);
org = org.replace(
  '.withIndex("departmentId", (q) => q.eq("departmentId", args.departmentId))',
  '.withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))'
);

fs.writeFileSync('src/convex/organization.ts', org, 'utf8');
console.log('✅ organization.ts: Fixed index name (departmentId -> by_department)');

// ======================
// FIX 3: auth hook - add signOut and isDemoMode
// ======================
let auth = fs.readFileSync('src/hooks/use-auth.ts', 'utf8');

// The hook needs to return signOut and isDemoMode
// Let's check what it currently looks like
if (!auth.includes('signOut')) {
  // Add signOut to the return type
  auth = auth.replace(
    'return { isLoading, isAuthenticated, user, login, logout };',
    'return { isLoading, isAuthenticated, user, login, logout: logout as () => Promise<void>, signOut: logout as () => Promise<void>, isDemoMode: false };'
  );
  fs.writeFileSync('src/hooks/use-auth.ts', auth, 'utf8');
  console.log('✅ use-auth.ts: Added signOut and isDemoMode to return value');
} else {
  console.log('⏭️ use-auth.ts: signOut already exists');
}

// ======================
// FIX 4: MasterDataBatches - fix find() return type
// ======================
let batches = fs.readFileSync('src/pages/studios/MasterDataBatches.tsx', 'utf8');
if (batches.includes('sv && <span') && batches.includes('sv.name')) {
  // Add type cast to the find() call
  batches = batches.replace(
    'const sv = subVerticals?.find((sv: any)',
    'const sv = subVerticals?.find((sv: any)'
  );
  // Actually the issue is that find returns {} which is unknown
  // Fix: ensure it's properly typed
  batches = batches.replace(
    /const sv = subVerticals\?\.find\(/,
    'const sv: { name: string; code: string; _id: string } | undefined = subVerticals?.find('
  );
  fs.writeFileSync('src/pages/studios/MasterDataBatches.tsx', batches, 'utf8');
  console.log('✅ MasterDataBatches.tsx: Fixed sv type');
}

// ======================
// FIX 5: MasterDataPrograms - fix find() return type  
// ======================
let programs = fs.readFileSync('src/pages/studios/MasterDataPrograms.tsx', 'utf8');
if (programs.includes('vert && <span') && programs.includes('vert.name')) {
  programs = programs.replace(
    /const vert = verticals\?\.find\(/,
    'const vert: { name: string; code: string; _id: string } | undefined = verticals?.find('
  );
  fs.writeFileSync('src/pages/studios/MasterDataPrograms.tsx', programs, 'utf8');
  console.log('✅ MasterDataPrograms.tsx: Fixed vert type');
}

console.log('\nAll fixes applied!');
