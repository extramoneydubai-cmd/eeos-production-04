const fs = require('fs');

// Read schema
const schemaPath = 'src/convex/schema.ts';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Demo tables definition to add
const demoTables = `

  // ============================
  // Demo Environment Tables
  // ============================

  demoOrganizations: defineTable({
    name: v.string(),
    code: v.string(),
    type: v.optional(v.string()),
    parentId: v.optional(v.id("demoOrganizations")),
    address: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("type", ["type"]),

  demoDepartments: defineTable({
    name: v.string(),
    code: v.string(),
    organizationId: v.optional(v.id("demoOrganizations")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),

  demoTeams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.optional(v.id("demoDepartments")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),

  demoProfiles: defineTable({
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    designation: v.optional(v.string()),
    demoRole: v.optional(v.string()),
    departmentId: v.optional(v.id("demoDepartments")),
    teamIds: v.optional(v.array(v.id("demoTeams"))),
    branchId: v.optional(v.id("demoOrganizations")),
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["demoRole"])
    .index("by_order", ["displayOrder"]),

  demoLeads: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("demoProfiles")),
    assignedToRole: v.optional(v.string()),
    score: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assigned", ["assignedTo"]),

  demoStudents: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    parentId: v.optional(v.id("demoProfiles")),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    enrollmentDate: v.optional(v.number()),
    status: v.optional(v.string()),
    attendance: v.number(),
    performance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  demoAdmissions: defineTable({
    studentName: v.string(),
    studentEmail: v.optional(v.string()),
    program: v.optional(v.string()),
    grade: v.optional(v.string()),
    status: v.string(),
    assignedTo: v.optional(v.id("demoProfiles")),
    assignedToRole: v.optional(v.string()),
    feeQuoted: v.optional(v.number()),
    feePaid: v.optional(v.number()),
    source: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  demoTasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("demoProfiles")),
    assignedToRole: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role", ["assignedToRole"]),

  demoNotifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    userId: v.optional(v.id("demoProfiles")),
    role: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_role", ["role"]),

  demoActivities: defineTable({
    action: v.string(),
    entity: v.optional(v.string()),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"]),

  demoAttachments: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
    url: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"]),

  demoComments: defineTable({
    content: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"]),

  demoTimelineEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"]),

  demoAuditRecords: defineTable({
    action: v.string(),
    entity: v.string(),
    userId: v.optional(v.id("demoProfiles")),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("action", ["action"]),
`;

// Find the end of the last table definition (before ", { schemaValidation: false")
const lastTableEnd = schema.lastIndexOf('}, {\n  schemaValidation: false,');
if (lastTableEnd === -1) {
  console.error('Could not find schemaValidation closing in schema.ts');
  process.exit(1);
}

// Insert demo tables before the ", { schemaValidation: false," part
// The pattern is: lastTableDefinition,\n}, {\n  schemaValidation: false,
// We insert after the last comma and before the closing }, {
const insertPoint = schema.lastIndexOf(',\n}, {\n  schemaValidation: false,');
if (insertPoint === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

schema = schema.slice(0, insertPoint + 1) + demoTables + '\n' + schema.slice(insertPoint + 1);

fs.writeFileSync(schemaPath, schema);
console.log('Demo tables added successfully to schema.ts');
console.log('File size:', schema.length, 'chars');
