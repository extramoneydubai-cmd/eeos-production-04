const fs = require('fs');
const path = 'src/convex/schema.ts';
let s = fs.readFileSync(path, 'utf8');

// Fix salesOpportunityTypes: replace displayOrder with sequence, isActive with active
s = s.replace(
  /salesOpportunityTypes: defineTable\(\{\n    name: v\.string\(\),\n    code: v\.string\(\),\n    opportunityCategory: v\.optional\(v\.string\(\)\),\n    displayOrder: v\.number\(\),\n    color: v\.string\(\),\n    icon: v\.string\(\),\n    description: v\.optional\(v\.string\(\)\),\n    isActive: v\.boolean\(\),\n    createdAt: v\.number\(\),\n    updatedAt: v\.number\(\),\n  }\)\.index\("sequence", \["sequence"\]\)/,
  `salesOpportunityTypes: defineTable({
    name: v.string(),
    code: v.string(),
    opportunityCategory: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])`
);

// Fix salesQuotationStatuses
s = s.replace(
  /salesQuotationStatuses: defineTable\(\{\n    name: v\.string\(\),\n    code: v\.string\(\),\n    statusCategory: v\.optional\(v\.string\(\)\),\n    displayOrder: v\.number\(\),\n    color: v\.string\(\),\n    icon: v\.string\(\),\n    description: v\.optional\(v\.string\(\)\),\n    isActive: v\.boolean\(\),\n    createdAt: v\.number\(\),\n    updatedAt: v\.number\(\),\n  }\)\.index\("sequence", \["sequence"\]\)/,
  `salesQuotationStatuses: defineTable({
    name: v.string(),
    code: v.string(),
    statusCategory: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])`
);

// Fix salesTerritories
s = s.replace(
  /salesTerritories: defineTable\(\{\n    name: v\.string\(\),\n    code: v\.string\(\),\n    territoryType: v\.optional\(v\.string\(\)\),\n    displayOrder: v\.number\(\),\n    color: v\.string\(\),\n    icon: v\.string\(\),\n    description: v\.optional\(v\.string\(\)\),\n    isActive: v\.boolean\(\),\n    createdAt: v\.number\(\),\n    updatedAt: v\.number\(\),\n  }\)\.index\("sequence", \["sequence"\]\)/,
  `salesTerritories: defineTable({
    name: v.string(),
    code: v.string(),
    territoryType: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])`
);

fs.writeFileSync(path, s, 'utf8');
console.log('Sales table field names fixed (displayOrder->sequence, isActive->active)');

// Verify the tables are present and have correct field names
s = fs.readFileSync(path, 'utf8');
const hasSalesOptyTypes = s.includes('salesOpportunityTypes:');
const hasSalesQuotStatus = s.includes('salesQuotationStatuses:');
const hasSalesTerritories = s.includes('salesTerritories:');
const hasSequenceField = s.match(/salesOpportunityTypes[\s\S]*?sequence: v\.number\(\)/);
const hasActiveField = s.match(/salesOpportunityTypes[\s\S]*?active: v\.boolean\(\)/);

console.log('Tables present:', hasSalesOptyTypes, hasSalesQuotStatus, hasSalesTerritories);
console.log('Has sequence field:', !!hasSequenceField);
console.log('Has active field:', !!hasActiveField);
console.log('File length:', s.length);
