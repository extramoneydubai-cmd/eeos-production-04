const https = require('https');
const fs = require('fs');
const path = 'src/convex/schema.ts';

const rawUrl = 'https://raw.githubusercontent.com/vly-agency/eeos-client/refs/heads/main/src/convex/schema.ts';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading original schema from GitHub...');
  let s = await httpGet(rawUrl);
  console.log('Downloaded:', s.length, 'chars');

  // Backup current
  if (fs.existsSync(path)) {
    fs.writeFileSync(path + '.bak', fs.readFileSync(path, 'utf8'));
    console.log('Backed up current schema to schema.ts.bak');
  }

  // Step 1: Add demo tables BEFORE the closing of the first argument
  // Find the closing pattern: the last table before }, { schemaValidation or just });
  let insertPoint;
  
  // Check if schema ends with "}, { schemaValidation: false" or just "});"
  if (s.includes('}, {\n  schemaValidation')) {
    // Has a second arg, insert before it
    insertPoint = s.lastIndexOf('}, {\n  schemaValidation');
  } else {
    // Find the closing of defineSchema
    const endMarker = s.lastIndexOf('});');
    // Find the last line starting with whitespace then }), 
    if (endMarker > 0) {
      // Go back to find the start of the closing sequence
      const beforeEnd = s.lastIndexOf('\n', endMarker - 2);
      insertPoint = beforeEnd > 0 ? beforeEnd : endMarker;
    }
  }

  if (!insertPoint || insertPoint < 0) {
    console.error('Could not find insertion point');
    return;
  }

  console.log('Inserting at position:', insertPoint);

  // Demo tables to add
  const demoTables = `
  // ─── Demo: Organizations (Demo Studio) ───
  demoOrganizations: defineTable({
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    type: v.optional(v.string()),
    logo: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ─── Demo: Profiles (Demo Studio) ───
  demoProfiles: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.string(),
    avatar: v.optional(v.string()),
    department: v.optional(v.string()),
    title: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ─── Demo: Leads (Demo Studio) ───
  demoLeads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.string(),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    value: v.optional(v.number()),
    probability: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ─── Demo: Students (Demo Studio) ───
  demoStudents: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    course: v.optional(v.string()),
    semester: v.optional(v.number()),
    gpa: v.optional(v.number()),
    status: v.string(),
    enrollmentDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ─── Demo: Admissions (Demo Studio) ───
  demoAdmissions: defineTable({
    studentName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    program: v.string(),
    status: v.string(),
    applicationDate: v.number(),
    decisionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ─── Demo: Tasks (Demo Studio) ───
  demoTasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ─── Demo: Notifications (Demo Studio) ───
  demoNotifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    read: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // ─── Demo: Activities (Demo Studio) ───
  demoActivities: defineTable({
    userId: v.id("users"),
    action: v.string(),
    entity: v.string(),
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // ─── Demo Attachments ───
  demoAttachments: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
    url: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    createdAt: v.number(),
  }).index("entityType", ["entityType"]),

  // ─── Demo Comments ───
  demoComments: defineTable({
    content: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  }).index("entityType", ["entityType"]),

  // ─── Demo Timeline Events ───
  demoTimelineEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
  }).index("entityType", ["entityType"]),

  // ─── Demo Audit Records ───
  demoAuditRecords: defineTable({
    action: v.string(),
    entity: v.string(),
    userId: v.optional(v.id("demoProfiles")),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  }).index("action", ["action"]),

  // ─── Sales: Opportunity Types ───
  salesOpportunityTypes: defineTable({
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
  }).index("sequence", ["sequence"]),

  // ─── Sales: Quotation Statuses ───
  salesQuotationStatuses: defineTable({
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
  }).index("sequence", ["sequence"]),

  // ─── Sales: Territories ───
  salesTerritories: defineTable({
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
  }).index("sequence", ["sequence"]),
`;

  s = s.slice(0, insertPoint) + demoTables + s.slice(insertPoint);
  fs.writeFileSync(path, s, 'utf8');
  console.log('Schema written. Checking structure...');

  // Verify
  s = fs.readFileSync(path, 'utf8');
  const checks = [
    'demoOrganizations', 'demoProfiles', 'demoLeads', 'demoStudents',
    'demoAdmissions', 'demoTasks', 'demoNotifications', 'demoActivities',
    'demoAttachments', 'demoComments', 'demoTimelineEvents', 'demoAuditRecords',
    'salesOpportunityTypes', 'salesQuotationStatuses', 'salesTerritories'
  ];
  let allOk = true;
  for (const c of checks) {
    const ok = s.includes(c + ':');
    console.log('  ' + c + ': ' + (ok ? 'OK' : 'MISSING'));
    if (!ok) allOk = false;
  }

  // Check the final closing is intact
  const hasSchemaClose = s.includes('},\n  schemaValidation:') || s.includes('});\n\nexport default schema');
  console.log('\nSchema close intact:', hasSchemaClose);
  console.log('File length:', s.length);
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
