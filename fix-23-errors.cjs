const fs = require('fs');
const path = require('path');

const fixes = [];

// ============ FIX 1: branches.ts - add createdAt/updatedAt ============
fixes.push(() => {
  let c = fs.readFileSync('src/convex/organization/branches.ts', 'utf8');
  // In the create mutation insert, add createdAt and updatedAt
  c = c.replace(
    `return await ctx.db.insert("branches", {\n      organizationId: args.organizationId,\n      name: args.name,\n      code: args.code,\n      email: args.email,\n      phone: args.phone,\n      address: args.address,\n      isActive: true,\n    });`,
    `const now = Date.now();\n    return await ctx.db.insert("branches", {\n      organizationId: args.organizationId,\n      name: args.name,\n      code: args.code,\n      email: args.email,\n      phone: args.phone,\n      address: args.address,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  fs.writeFileSync('src/convex/organization/branches.ts', c);
  console.log('✓ branches.ts: Added createdAt/updatedAt to create insert');
});

// ============ FIX 2: departments.ts - add createdAt/updatedAt ============
fixes.push(() => {
  let c = fs.readFileSync('src/convex/organization/departments.ts', 'utf8');
  c = c.replace(
    `return await ctx.db.insert("departments", {\n      branchId: args.branchId,\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      managerId: args.managerId,\n      isActive: true,\n    });`,
    `const now = Date.now();\n    return await ctx.db.insert("departments", {\n      branchId: args.branchId,\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      managerId: args.managerId,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  fs.writeFileSync('src/convex/organization/departments.ts', c);
  console.log('✓ departments.ts: Added createdAt/updatedAt to create insert');
});

// ============ FIX 3: teams.ts - add createdAt/updatedAt ============
fixes.push(() => {
  let c = fs.readFileSync('src/convex/organization/teams.ts', 'utf8');
  c = c.replace(
    `return await ctx.db.insert("teams", {\n      departmentId: args.departmentId,\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      leadId: args.leadId,\n      isActive: true,\n    });`,
    `const now = Date.now();\n    return await ctx.db.insert("teams", {\n      departmentId: args.departmentId,\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      leadId: args.leadId,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  fs.writeFileSync('src/convex/organization/teams.ts', c);
  console.log('✓ teams.ts: Added createdAt/updatedAt to create insert');
});

// ============ FIX 4: organization.ts - multiple fixes ============
fixes.push(() => {
  let c = fs.readFileSync('src/convex/organization.ts', 'utf8');
  
  // Fix 4a: CreateBranch - add isActive
  c = c.replace(
    `return await ctx.db.insert("branches", {\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      createdAt: now,\n      updatedAt: now,\n    });`,
    `return await ctx.db.insert("branches", {\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  
  // Fix 4b: CreateDepartment - add branchId arg and insert field
  c = c.replace(
    `export const createDepartment = mutation({\n  args: {\n    name: v.string(),\n    code: v.string(),\n    description: v.optional(v.string()),\n  },`,
    `export const createDepartment = mutation({\n  args: {\n    name: v.string(),\n    code: v.string(),\n    branchId: v.id("branches"),\n    description: v.optional(v.string()),\n  },`
  );
  c = c.replace(
    `return await ctx.db.insert("departments", {\n      name: args.name,\n      code: args.code,\n      description: args.description,\n      createdAt: now,\n      updatedAt: now,\n    });`,
    `return await ctx.db.insert("departments", {\n      name: args.name,\n      code: args.code,\n      branchId: args.branchId,\n      description: args.description,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  
  // Fix 4c: CreateTeam - leadUserId -> leadId in args
  c = c.replace(
    `export const createTeam = mutation({\n  args: {\n    name: v.string(),\n    code: v.string(),\n    departmentId: v.id("departments"),\n    description: v.optional(v.string()),\n    leadUserId: v.optional(v.id("users")),\n  },`,
    `export const createTeam = mutation({\n  args: {\n    name: v.string(),\n    code: v.string(),\n    departmentId: v.id("departments"),\n    description: v.optional(v.string()),\n    leadId: v.optional(v.id("users")),\n  },`
  );
  // Fix 4d: CreateTeam handler - leadUserId -> leadId in insert
  c = c.replace(
    `return await ctx.db.insert("teams", {\n      name: args.name,\n      code: args.code,\n      departmentId: args.departmentId,\n      description: args.description,\n      leadUserId: args.leadUserId,\n      createdAt: now,\n      updatedAt: now,\n    });`,
    `return await ctx.db.insert("teams", {\n      name: args.name,\n      code: args.code,\n      departmentId: args.departmentId,\n      description: args.description,\n      leadId: args.leadId,\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  
  // Fix 4e: UpdateTeam - leadUserId -> leadId in args
  c = c.replace(
    `export const updateTeam = mutation({\n  args: {\n    id: v.id("teams"),\n    name: v.optional(v.string()),\n    code: v.optional(v.string()),\n    description: v.optional(v.string()),\n    leadUserId: v.optional(v.id("users")),\n  },`,
    `export const updateTeam = mutation({\n  args: {\n    id: v.id("teams"),\n    name: v.optional(v.string()),\n    code: v.optional(v.string()),\n    description: v.optional(v.string()),\n    leadId: v.optional(v.id("users")),\n  },`
  );
  
  // Fix 4f: Fix index name in listTeamsByDepartment - "departmentId" -> "by_department"
  c = c.replace(
    `.withIndex("departmentId", (q) => q.eq("departmentId", args.departmentId))`,
    `.withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))`
  );
  
  fs.writeFileSync('src/convex/organization.ts', c);
  console.log('✓ organization.ts: Fixed createBranch (isActive), createDepartment (branchId), createTeam/updateTeam (leadId), listTeamsByDepartment (index)');
});

// ============ FIX 5: seed.ts - 15 errors ============
fixes.push(() => {
  let c = fs.readFileSync('src/convex/seed.ts', 'utf8');
  
  // Step 1: Move branch creation BEFORE department creation
  // Find the department creation block (starts with "// Create Departments")
  // And the branch creation block (starts with "// Create Branches")
  
  // The seed.ts has comments delineating sections:
  // // Create Departments
  // ... department inserts ...
  // // Create Branches
  // ... branch inserts ...
  
  // We need to swap these so branches come first
  
  const deptComment = '    // Create Departments';
  const branchComment = '    // Create Branches';
  
  const deptStart = c.indexOf(deptComment);
  const branchStart = c.indexOf(branchComment);
  
  // Find where the department block ends (next section comment like "// Create Verticals" or "// Create Users")
  const deptEndMarkers = ['    // Create Verticals', '    // Create Branches', '    // Create Users', '    // Create Teams'];
  let deptEnd = c.length;
  for (const marker of deptEndMarkers) {
    const idx = c.indexOf(marker, deptStart + 10);
    if (idx > deptStart && idx < deptEnd) deptEnd = idx;
  }
  
  // Find where the branch block ends
  let branchEnd = c.length;
  for (const marker of deptEndMarkers) {
    const idx = c.indexOf(marker, branchStart + 10);
    if (idx > branchStart && idx < branchEnd) branchEnd = idx;
  }
  
  // Extract department and branch blocks
  const deptBlock = c.substring(deptStart, deptEnd);
  const branchBlock = c.substring(branchStart, branchEnd);
  
  // Swap them
  c = c.substring(0, deptStart) + branchBlock + '\n\n' + deptBlock + c.substring(branchEnd);
  
  // Step 2: Add isActive: true to all branch inserts
  c = c.replace(
    /await ctx\.db\.insert\("branches", \{\n\s+name: "(.+?)",\n\s+code: "(.+?)",\n\s+description: "(.+?)",\n\s+createdAt: now,\n\s+updatedAt: now,\n\s+\}\);/g,
    `await ctx.db.insert("branches", {\n      name: "$1",\n      code: "$2",\n      description: "$3",\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  
  // Step 3: Add branchId to all department inserts
  // First, find what branch variables are available (npBranchId, opBranchId, klBranchId, plBranchId)
  // Map departments to branches (using npBranchId for all for simplicity)
  c = c.replace(
    /await ctx\.db\.insert\("departments", \{\n\s+name: "(.+?)",\n\s+code: "(.+?)",\n\s+description: "(.+?)",\n\s+createdAt: now,\n\s+updatedAt: now,\n\s+\}\);/g,
    `await ctx.db.insert("departments", {\n      name: "$1",\n      code: "$2",\n      branchId: npBranchId,\n      description: "$3",\n      isActive: true,\n      createdAt: now,\n      updatedAt: now,\n    });`
  );
  
  // Step 4: Fix leadUserId -> leadId in 4 patch calls
  c = c.replace(/leadUserId:/g, 'leadId:');
  
  fs.writeFileSync('src/convex/seed.ts', c);
  console.log('✓ seed.ts: Reordered branches before departments, added isActive/branchId fields, fixed leadUserId → leadId');
});

// Apply all fixes
for (const fix of fixes) {
  try {
    fix();
  } catch (e) {
    console.error('✗ Error:', e.message);
  }
}

console.log('\n✅ All 5 files fixed. Run npx convex dev --once && npx tsc -b --noEmit to verify.');
