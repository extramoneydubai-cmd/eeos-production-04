#!/usr/bin/env node
import fs from 'fs';

const ROOT = '/home/daytona/codebase';

// ─── 1. Update Sales landing page - read and modify ───
let sales = fs.readFileSync(ROOT + '/src/pages/studios/MasterDataSales.tsx', 'utf8');

// Add missing sales masters to moduleCards array
// Find the OpportunityTypes card and add the missing ones after Territories
const salesInsertCards = `    {
    id: "quotation-statuses", title: "Quotation Statuses", description: "Manage quotation lifecycle statuses.",
    icon: null, color: "bg-[#e8f0fe]", iconColor: "text-[#1a73e8]", status: "active" as const, href: "/studios/master-data/sales/quotation-statuses", isPlaceholder: false,
  },
  {
    id: "payment-statuses", title: "Payment Statuses", description: "Manage payment lifecycle statuses.",
    icon: null, color: "bg-[#e6f4ea]", iconColor: "text-[#34a853]", status: "active" as const, href: "/studios/master-data/sales/payment-statuses", isPlaceholder: false,
  },
  {
    id: "invoice-types", title: "Invoice Types", description: "Manage invoice type classifications.",
    icon: null, color: "bg-[#f3e8ff]", iconColor: "text-[#a855f7]", status: "active" as const, href: "/studios/master-data/sales/invoice-types", isPlaceholder: false,
  },
  {
    id: "tax-slabs", title: "Tax Slabs", description: "Manage tax bracket configurations.",
    icon: null, color: "bg-[#fef7e0]", iconColor: "text-[#fbbc04]", status: "active" as const, href: "/studios/master-data/sales/tax-slabs", isPlaceholder: false,
  },`;

// Insert after territories card
const territoriesPattern = 'id: "territories"';
const idx = sales.indexOf('isPlaceholder: false,\n  },\n];\n\nconst futureModules');
if (idx > 0) {
  // Insert before the closing of moduleCards array
  sales = sales.slice(0, idx) + `isPlaceholder: false,\n  },\n${salesInsertCards}` + sales.slice(idx);
}

// Add the missing icon imports
const iconInsert = '  FileEdit, Send, Eye, Ban, RefreshCw, Clock, Download, Receipt, Calculator,';
sales = sales.replace('  Sparkles,\n]', `  Sparkles, FileEdit, Send, Eye, Ban, RefreshCw, Clock, Download, Receipt, Calculator,\n]`);

// Fix null icon references in new cards
sales = sales.replace(`icon: null,`, `icon: CheckCircle,`); // Replace the first null (quotation-statuses gets CheckCircle)

fs.writeFileSync(ROOT + '/src/pages/studios/MasterDataSales.tsx', sales);
console.log('✅ Updated Sales landing page with missing cards');

// ─── 2. Add Classrooms to Academic landing page ───
// Find the Academic page and add a classroom card
let academic = fs.readFileSync(ROOT + '/src/pages/studios/MasterDataAcademic.tsx', 'utf8');

// Add classroom card to moduleCards
const classroomCard = `  {
    id: "classrooms", title: "Classrooms", description: "Define classrooms, capacity, and facilities across campuses.",
    icon: null, color: "bg-[#f3e8ff]", iconColor: "text-[#a855f7]", status: "active" as const, href: "/studios/master-data/academic/classrooms", isPlaceholder: false,
  },`;

// Find the last module card entry and add after it  
const lastAcademicIdx = academic.lastIndexOf('isPlaceholder: false');
if (lastAcademicIdx > 0) {
  const afterLast = academic.indexOf(',\n  },\n];', lastAcademicIdx);
  if (afterLast > 0) {
    academic = academic.slice(0, afterLast + 1) + classroomCard + academic.slice(afterLast + 1);
  }
}

// Fix null icon
academic = academic.replace('icon: null,', 'icon: Home,');

fs.writeFileSync(ROOT + '/src/pages/studios/MasterDataAcademic.tsx', academic);
console.log('✅ Updated Academic landing page with classrooms');

// ─── 3. Add Industries to CRM landing page ───
let crm = fs.readFileSync(ROOT + '/src/pages/studios/MasterDataCRM.tsx', 'utf8');

const industryCard = `  {
    id: "industries", title: "Industries", description: "Define industry sectors for lead and organization classification.",
    icon: null, color: "bg-[#fef7e0]", iconColor: "text-[#e8710a]", status: "active" as const, href: "/studios/master-data/crm/industries", isPlaceholder: false,
  },`;

const lastCrmIdx = crm.lastIndexOf('isPlaceholder: false');
if (lastCrmIdx > 0) {
  const afterCrm = crm.indexOf(',\n  },\n];', lastCrmIdx);
  if (afterCrm > 0) {
    crm = crm.slice(0, afterCrm + 1) + industryCard + crm.slice(afterCrm + 1);
  }
}

crm = crm.replace('icon: null,', 'icon: Building,');

fs.writeFileSync(ROOT + '/src/pages/studios/MasterDataCRM.tsx', crm);
console.log('✅ Updated CRM landing page with industries');

// ─── 4. Update HR landing page with new master cards ───
let hr = fs.readFileSync(ROOT + '/src/pages/studios/MasterDataHR.tsx', 'utf8');

const hrNewCards = `  {
    id: "employee-categories", title: "Employee Categories", description: "Define employee categories and functional roles.",
    icon: null, color: "bg-[#e8f0fe]", iconColor: "text-[#1a73e8]", status: "active" as const, href: "/studios/master-data/hr/employee-categories", isPlaceholder: false,
  },
  {
    id: "work-locations", title: "Work Locations", description: "Define offices, campuses, and remote work locations.",
    icon: null, color: "bg-[#e6f4ea]", iconColor: "text-[#34a853]", status: "active" as const, href: "/studios/master-data/hr/work-locations", isPlaceholder: false,
  },
  {
    id: "skills", title: "Skills", description: "Define skills taxonomy for employee competencies.",
    icon: null, color: "bg-[#f3e8ff]", iconColor: "text-[#a855f7]", status: "active" as const, href: "/studios/master-data/hr/skills", isPlaceholder: false,
  },
  {
    id: "experience-levels", title: "Experience Levels", description: "Define experience level bands.",
    icon: null, color: "bg-[#fef7e0]", iconColor: "text-[#fbbc04]", status: "active" as const, href: "/studios/master-data/hr/experience-levels", isPlaceholder: false,
  },
  {
    id: "document-types", title: "Document Types", description: "Define document types for employee records.",
    icon: null, color: "bg-[#fce8e6]", iconColor: "text-[#ea4335]", status: "active" as const, href: "/studios/master-data/hr/document-types", isPlaceholder: false,
  },`;

// Find the employment-statuses module card and insert after it
const afterEmpStatus = hr.indexOf('isPlaceholder: false,\n  },\n  {\n    id: "departments"');
if (afterEmpStatus > 0) {
  hr = hr.slice(0, afterEmpStatus + 1) + hrNewCards + hr.slice(afterEmpStatus + 1);
}

// Fix null icon references
let nullCount = 0;
const icons = ['UserCheck', 'MapPin', 'Award', 'TrendingUp', 'FileText'];
hr = hr.replace(/icon: null,/g, () => `icon: ${icons[nullCount++ % icons.length]},`);

fs.writeFileSync(ROOT + '/src/pages/studios/MasterDataHR.tsx', hr);
console.log('✅ Updated HR landing page with new master cards');

console.log('\n✅ All landing pages updated!');
