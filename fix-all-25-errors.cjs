const fs = require('fs');

// ======================
// FIX 1: Schema - Update branches, departments, teams tables
// ======================
let schema = fs.readFileSync('src/convex/schema.ts', 'utf8');

// Fix branches table - add needed fields and indexes
const oldBranches = `  branches: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),`;

const newBranches = `  branches: defineTable({
    name: v.string(),
    code: v.string(),
    organizationId: v.id("organizations"),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.boolean(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_organization", ["organizationId"]),`;

schema = schema.replace(oldBranches, newBranches);

// Fix departments table
const oldDepts = `  departments: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),`;

const newDepts = `  departments: defineTable({
    name: v.string(),
    code: v.string(),
    branchId: v.id("branches"),
    managerId: v.optional(v.id("users")),
    isActive: v.boolean(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_branch", ["branchId"]),`;

schema = schema.replace(oldDepts, newDepts);

// Fix teams table - rename leadUserId to leadId, add indexes
const oldTeams = `  teams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    leadUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("departmentId", ["departmentId"]),`;

const newTeams = `  teams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_department", ["departmentId"]),`;

schema = schema.replace(oldTeams, newTeams);

// Fix organizations table - make createdAt/updatedAt optional
const oldOrgs = `  organizations: defineTable({
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
    .index("by_code", ["code"]),`;

const newOrgs = `  organizations: defineTable({
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    taxId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"]),`;

schema = schema.replace(oldOrgs, newOrgs);

fs.writeFileSync('src/convex/schema.ts', schema, 'utf8');
console.log('✅ Schema tables updated (branches, departments, teams, organizations)');

// ======================
// FIX 2: demo/auth.ts - Fix authorize callback
// ======================
let auth = fs.readFileSync('src/convex/demo/auth.ts', 'utf8');

// The issue: authorize callback gets GenericActionCtxWithAuthConfig which has no db
// Fix: use a type assertion since authorize actually receives a MutationCtx at runtime
const oldAuthorize = `  authorize: async (credentials, ctx) => {`;
const newAuthorize = `  authorize: async (credentials, ctx: any) => {`;

auth = auth.replace(oldAuthorize, newAuthorize);

// Also fix the 'any' types for filter callbacks
auth = auth.replace('.filter((q) => q.eq(q.field("email"), profile.email))',
  '.filter((q: any) => q.eq(q.field("email"), profile.email))');

auth = auth.replace('.filter((q) =>',
  '.filter((q: any) =>');

fs.writeFileSync('src/convex/demo/auth.ts', auth, 'utf8');
console.log('✅ demo/auth.ts authorize callback fixed');

// ======================
// VERIFY
// ======================
console.log('\nVerification:');
schema = fs.readFileSync('src/convex/schema.ts', 'utf8');
console.log('branches has organizationId:', schema.includes('organizationId: v.id("organizations")'));
console.log('branches has by_organization:', schema.includes('"by_organization", ["organizationId"]'));
console.log('departments has branchId:', schema.includes('branchId: v.id("branches")'));
console.log('departments has by_branch:', schema.includes('"by_branch", ["branchId"]'));
console.log('teams has leadId:', schema.includes('leadId: v.optional(v.id("users"))'));
console.log('teams has by_department:', schema.includes('"by_department", ["departmentId"]'));
console.log('organizations createdAt optional:', schema.includes('createdAt: v.optional(v.number())'));
