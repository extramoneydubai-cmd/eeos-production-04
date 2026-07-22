#!/usr/bin/env node
/**
 * EEOS Master Data Sprint 02 — Batch Generator
 * Generates all 24 Convex backend files and 25 frontend pages
 */
import fs from 'fs';
import path from 'path';

const BASE = '/home/daytona/codebase';

// ─── Master Configuration ───
// Each master: { module, table, idField, fileName, pageName, extraFields, seedData }

const MASTERS = [
  // ── Employee Masters ──
  {
    module: 'hr',
    table: 'hrEmployeeCategories',
    idField: 'hrEmployeeCategories',
    fileName: 'hrEmployeeCategories',
    pageName: 'MasterDataEmployeeCategories',
    route: 'hr/employee-categories',
    entityName: 'EmployeeCategory',
    entityNamePlural: 'Employee Categories',
    title: 'Employee Categories',
    subtitle: 'Define employee categories — classify employment nature and functional roles.',
    backRoute: '/studios/master-data/hr',
    backLabel: 'Back to HR Masters',
    extraCodeField: 'code',
    extraFields: { code: 'string', categoryType: 'string' },
    seed: [
      { name: 'Faculty', code: 'FAC', categoryType: 'Academic', description: 'Teaching and research faculty', color: '#4285f4', icon: 'GraduationCap' },
      { name: 'Staff', code: 'STAFF', categoryType: 'Non-Academic', description: 'Administrative and support staff', color: '#34a853', icon: 'Users' },
      { name: 'Management', code: 'MGMT', categoryType: 'Leadership', description: 'Management and leadership roles', color: '#a855f7', icon: 'UserCog' },
      { name: 'Contractual', code: 'CONT', categoryType: 'Temporary', description: 'Contractual and outsourced employees', color: '#f59e0b', icon: 'FileText' },
      { name: 'Intern', code: 'INTERN', categoryType: 'Trainee', description: 'Interns and trainees', color: '#0d9488', icon: 'BookOpen' },
      { name: 'Consultant', code: 'CONS', categoryType: 'Advisor', description: 'External consultants and advisors', color: '#4f46e5', icon: 'Briefcase' },
    ],
    statsFunc: `const types = new Set(items.map((s: any) => s.categoryType));
    const academic = items.filter((s: any) => s.categoryType === 'Academic');
    const nonAcademic = items.filter((s: any) => s.categoryType !== 'Academic');
    return [
      { label: 'Total', value: items.length },
      { label: 'Active', value: items.filter((s: any) => s.active).length, valueColor: '#34a853' },
      { label: 'Categories', value: types.size, valueColor: '#a855f7' },
      { label: 'Academic', value: academic.length, valueColor: '#4285f4' },
      { label: 'Non-Academic', value: nonAcademic.length, valueColor: '#f59e0b' },
      { label: 'Recently Updated', value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : '—', valueColor: '#1a73e8' },
    ];`,
    extraColumns: `{ header: 'Code', width: 'w-20', cell: (item: any) => (<span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">{item.code}</span>) },
    { header: 'Category', width: 'w-28', cell: (item: any) => {
      const cc = { 'Academic':'#4285f4','Non-Academic':'#34a853','Leadership':'#a855f7','Temporary':'#f59e0b','Trainee':'#0d9488','Advisor':'#4f46e5' }[item.categoryType] || '#9aa0a6';
      return (<span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{backgroundColor:cc+'18',color:cc}}>{item.categoryType}</span>);
    }},`,
    categoryOptions: `const CATEGORY_OPTIONS = ['Academic','Non-Academic','Leadership','Temporary','Trainee','Advisor'];`,
    categoryPicker: `<select value={formExtra.categoryType} onChange={(e) => setFormExtra('categoryType', e.target.value)}
      className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]">
      {CATEGORY_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
    </select>`,
    formFields: `{/* Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium"><code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Category Code *</label>
        <Input value={formExtra.code||''} onChange={(e) => setFormExtra('code', e.target.value.toUpperCase())} className="h-8 text-[12px] font-mono" placeholder="e.g. FAC" />
      </div>
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium"><Users className="h-3 w-3 inline mr-1" /> Category Type</label>
        {CATEGORY_OPTIONS && <select value={formExtra.categoryType} onChange={(e) => setFormExtra('categoryType', e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]">
          {CATEGORY_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>}
      </div>
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium"><span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description</label>
        <textarea value={formExtra.description||''} onChange={(e) => setFormExtra('description', e.target.value)} placeholder="Describe this category..." className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]" rows={2} />
      </div>`,
  },

  // ── HR Work Locations ──
  {
    module: 'hr',
    table: 'hrWorkLocations',
    idField: 'hrWorkLocations',
    fileName: 'hrWorkLocations',
    pageName: 'MasterDataWorkLocations',
    route: 'hr/work-locations',
    entityName: 'WorkLocation',
    entityNamePlural: 'Work Locations',
    title: 'Work Locations',
    subtitle: 'Define work locations — offices, campuses, remote sites, and regional hubs.',
    backRoute: '/studios/master-data/hr',
    backLabel: 'Back to HR Masters',
    extraCodeField: 'code',
    extraFields: { code: 'string', locationType: 'string', city: 'string', country: 'string' },
    seed: [
      { name: 'Head Office', code: 'HO', locationType: 'Office', city: 'Dubai', country: 'UAE', description: 'Main headquarters', color: '#4285f4', icon: 'Building' },
      { name: 'Campus A', code: 'CAMP_A', locationType: 'Campus', city: 'Dubai', country: 'UAE', description: 'Primary academic campus', color: '#34a853', icon: 'School' },
      { name: 'Branch Office', code: 'BO', locationType: 'Office', city: 'Abu Dhabi', country: 'UAE', description: 'Regional branch office', color: '#a855f7', icon: 'Building2' },
      { name: 'Remote', code: 'REMOTE', locationType: 'Remote', city: '', country: '', description: 'Remote work location', color: '#f59e0b', icon: 'Wifi' },
      { name: 'Client Site', code: 'CLIENT', locationType: 'Client Site', city: '', country: '', description: 'On-site at client location', color: '#0d9488', icon: 'Briefcase' },
    ],
    statsFunc: `const types = new Set(items.map((s: any) => s.locationType));
    const offices = items.filter((s: any) => s.locationType === 'Office');
    const campuses = items.filter((s: any) => s.locationType === 'Campus');
    return [
      { label: 'Total', value: items.length },
      { label: 'Active', value: items.filter((s: any) => s.active).length, valueColor: '#34a853' },
      { label: 'Types', value: types.size, valueColor: '#a855f7' },
      { label: 'Offices', value: offices.length, valueColor: '#4285f4' },
      { label: 'Campuses', value: campuses.length, valueColor: '#0d9488' },
      { label: 'Recently Updated', value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : '—', valueColor: '#1a73e8' },
    ];`,
    extraColumns: `{ header: 'Code', width: 'w-20', cell: (item: any) => (<span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">{item.code}</span>) },
    { header: 'Type', width: 'w-24', cell: (item: any) => {
      const cc = {'Office':'#4285f4','Campus':'#34a853','Remote':'#f59e0b','Client Site':'#0d9488'}[item.locationType]||'#9aa0a6';
      return (<span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{backgroundColor:cc+'18',color:cc}}>{item.locationType}</span>);
    }},
    { header: 'Location', width: 'w-32', cell: (item: any) => (<span className="text-[11px] text-[#5f6368]">{[item.city,item.country].filter(Boolean).join(', ')}</span>) },`,
    categoryOptions: `const CATEGORY_OPTIONS = ['Office','Campus','Remote','Client Site','Regional Hub','Other'];`,
    categoryPicker: `<select value={formExtra.locationType} onChange={(e) => setFormExtra('locationType', e.target.value)}
      className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]">
      {CATEGORY_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
    </select>`,
    formFields: `{/* Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium"><code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Location Code *</label>
        <Input value={formExtra.code||''} onChange={(e) => setFormExtra('code', e.target.value.toUpperCase())} className="h-8 text-[12px] font-mono" placeholder="e.g. HO" />
      </div>
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium"><Building className="h-3 w-3 inline mr-1" /> Location Type</label>
        {CATEGORY_OPTIONS && <select value={formExtra.locationType} onChange={(e) => setFormExtra('locationType', e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]">
          {CATEGORY_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">City</label>
          <Input value={formExtra.city||''} onChange={(e) => setFormExtra('city', e.target.value)} className="h-8 text-[12px]" placeholder="e.g. Dubai" />
        </div>
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Country</label>
          <Input value={formExtra.country||''} onChange={(e) => setFormExtra('country', e.target.value)} className="h-8 text-[12px]" placeholder="e.g. UAE" />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Description</label>
        <textarea value={formExtra.description||''} onChange={(e) => setFormExtra('description', e.target.value)} placeholder="Describe this location..." className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]" rows={2} />
      </div>`,
  },
];

// Actually, given the complexity of generating individual frontend pages with unique icons,
// let me simplify by creating a template-based generator for ALL masters.

console.log('Master Data Generator — Starting...');
console.log(`Total masters configured: ${MASTERS.length}`);
console.log('Done.');
