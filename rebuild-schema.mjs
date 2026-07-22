import https from "node:https";
import fs from "node:fs";
import AdmZip from "adm-zip";

const ZIP_URL = "https://github.com/extramoneydubai-cmd/eeos-lite-9july-01/archive/refs/heads/main.zip";
const ZIP_PATH = "/tmp/rebuild-zip.zip";
const EXTRACT_PATH = "/tmp/rebuild-extracted";

console.log("Downloading...");
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
const originalSchema = fs.readFileSync(`${sourceDir}/src/convex/schema.ts`, "utf8");
console.log("Original schema:", originalSchema.length, "chars");

// Detect the end marker for schema definition
const marker = "}, {\n  schemaValidation: false,";
const insertIdx = originalSchema.lastIndexOf(",\n}, {\n  schemaValidation: false,");
if (insertIdx === -1) throw new Error("Cannot find insertion point");

const demoSection = `

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

// Rebuild: take everything up to the insert point + demo tables + everything after
const rebuilt = originalSchema.slice(0, insertIdx + 1) + demoSection + "\n" + originalSchema.slice(insertIdx + 1);
fs.writeFileSync("src/convex/schema.ts", rebuilt);
console.log("Schema rebuilt successfully!", rebuilt.length, "chars");
console.log("Contains demoOrganizations:", rebuilt.includes("demoOrganizations"));
console.log("Original end intact:", rebuilt.includes("schemaValidation: false"));
