#!/usr/bin/env node
/**
 * Fix all generated MasterData frontend pages
 * - Replaces broken ICON_OPTIONS with proper syntax
 * - Fixes template literal usage in renderFormFields
 */
import fs from 'fs';
import path from 'path';

const ROOT = '/home/daytona/codebase';

// All generated files to fix
const files = [
  'MasterDataEmployeeCategories', 'MasterDataWorkLocations', 'MasterDataSkills',
  'MasterDataExperienceLevels', 'MasterDataDocumentTypes',
  'MasterDataPaymentModes', 'MasterDataBankAccounts', 'MasterDataTaxTypes',
  'MasterDataGstRates', 'MasterDataExpenseCategories', 'MasterDataIncomeCategories',
  'MasterDataFeeCategories', 'MasterDataDiscountCategories', 'MasterDataCurrencies',
  'MasterDataFinancialYears',
  'MasterDataSalesOpportunityTypes', 'MasterDataSalesQuotationStatuses',
  'MasterDataPaymentStatuses', 'MasterDataInvoiceTypes', 'MasterDataTaxSlabs',
  'MasterDataClassrooms', 'MasterDataIndustries',
  'MasterDataNotificationTypes', 'MasterDataEmailTemplates', 'MasterDataSmsTemplates',
  'MasterDataWhatsAppTemplates',
];

const ICON_IMPORTS = `BadgeCheck, Briefcase, Building, Building2, CalendarCheck, Clock, Code, Coins, CreditCard, DollarSign, Download, FileText, Flag, Globe, GraduationCap, Handshake, Heart, Home, Landmark, Mail, MapPin, Megaphone, MessageCircle, MessageSquare, Monitor, Palette, Percent, Phone, RefreshCw, School, Shield, Star, Target, TrendingUp, UserCheck, Users, Wallet, Wifi, Award, BookOpen, BookMarked, FileSpreadsheet, Layers, Hash, Calendar, UserCog, Linkedin, Facebook, Youtube, Radio, Newspaper, Trees, Tv, Smartphone, Search, MonitorPlay, WifiOff, PhoneOff, Ban, Thermometer, Headphones, HelpCircle, UserPlus, ClipboardList, Zap, CheckCircle, HeartHandshake, XCircle, Tags, Link`;

const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Badge", icon: BadgeCheck },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "Building", label: "Building", icon: Building },
  { value: "Building2", label: "Building 2", icon: Building2 },
  { value: "CalendarCheck", label: "Calendar", icon: CalendarCheck },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Code", label: "Code", icon: Code },
  { value: "Coins", label: "Coins", icon: Coins },
  { value: "CreditCard", label: "Card", icon: CreditCard },
  { value: "DollarSign", label: "Dollar", icon: DollarSign },
  { value: "Download", label: "Download", icon: Download },
  { value: "FileText", label: "File", icon: FileText },
  { value: "Flag", label: "Flag", icon: Flag },
  { value: "Globe", label: "Globe", icon: Globe },
  { value: "GraduationCap", label: "Graduation", icon: GraduationCap },
  { value: "Handshake", label: "Handshake", icon: Handshake },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "Home", label: "Home", icon: Home },
  { value: "Landmark", label: "Landmark", icon: Landmark },
  { value: "Mail", label: "Mail", icon: Mail },
  { value: "MapPin", label: "Pin", icon: MapPin },
  { value: "Megaphone", label: "Megaphone", icon: Megaphone },
  { value: "MessageCircle", label: "Chat", icon: MessageCircle },
  { value: "MessageSquare", label: "Message", icon: MessageSquare },
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "Palette", label: "Palette", icon: Palette },
  { value: "Percent", label: "Percent", icon: Percent },
  { value: "Phone", label: "Phone", icon: Phone },
  { value: "RefreshCw", label: "Refresh", icon: RefreshCw },
  { value: "School", label: "School", icon: School },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Star", label: "Star", icon: Star },
  { value: "Target", label: "Target", icon: Target },
  { value: "TrendingUp", label: "Trending", icon: TrendingUp },
  { value: "UserCheck", label: "Verified", icon: UserCheck },
  { value: "Users", label: "Users", icon: Users },
  { value: "Wallet", label: "Wallet", icon: Wallet },
  { value: "Wifi", label: "Wifi", icon: Wifi },
  { value: "Award", label: "Award", icon: Award },
];

// Proper ICON_OPTIONS as a JS string
const ICON_OPTIONS_JS = `const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Badge", icon: BadgeCheck },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "Building", label: "Building", icon: Building },
  { value: "Building2", label: "Building 2", icon: Building2 },
  { value: "CalendarCheck", label: "Calendar", icon: CalendarCheck },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Coins", label: "Coins", icon: Coins },
  { value: "CreditCard", label: "Card", icon: CreditCard },
  { value: "DollarSign", label: "Dollar", icon: DollarSign },
  { value: "Download", label: "Download", icon: Download },
  { value: "FileText", label: "File", icon: FileText },
  { value: "Flag", label: "Flag", icon: Flag },
  { value: "Globe", label: "Globe", icon: Globe },
  { value: "GraduationCap", label: "Graduation", icon: GraduationCap },
  { value: "Handshake", label: "Handshake", icon: Handshake },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "Home", label: "Home", icon: Home },
  { value: "Landmark", label: "Landmark", icon: Landmark },
  { value: "Mail", label: "Mail", icon: Mail },
  { value: "MapPin", label: "Pin", icon: MapPin },
  { value: "Megaphone", label: "Megaphone", icon: Megaphone },
  { value: "MessageCircle", label: "Chat", icon: MessageCircle },
  { value: "MessageSquare", label: "Message", icon: MessageSquare },
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "Palette", label: "Palette", icon: Palette },
  { value: "Percent", label: "Percent", icon: Percent },
  { value: "Phone", label: "Phone", icon: Phone },
  { value: "RefreshCw", label: "Refresh", icon: RefreshCw },
  { value: "School", label: "School", icon: School },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Star", label: "Star", icon: Star },
  { value: "Target", label: "Target", icon: Target },
  { value: "TrendingUp", label: "Trending", icon: TrendingUp },
  { value: "UserCheck", label: "Verified", icon: UserCheck },
  { value: "Users", label: "Users", icon: Users },
  { value: "Wallet", label: "Wallet", icon: Wallet },
  { value: "Wifi", label: "Wifi", icon: Wifi },
  { value: "Award", label: "Award", icon: Award },
];`;

// Fix COLOR_PRESETS
const COLOR_PRESETS = `const COLOR_PRESETS = [
  "#1a73e8", "#34a853", "#0d9488", "#e8710a", "#4285f4",
  "#4f46e5", "#a855f7", "#06b6d4", "#5f6368", "#22c55e",
  "#f59e0b", "#d4a017", "#ea4335", "#e91e63", "#f97316",
  "#f43f5e", "#14b8a6", "#8b5cf6", "#9aa0a6", "#1877F2",
];`;

let fixedCount = 0;
for (const name of files) {
  const filePath = path.join(ROOT, 'src/pages/studios', `${name}.tsx`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ ${name}.tsx not found, skipping`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix 1: Replace broken ICON_OPTIONS (with :: syntax)
  if (content.includes('value::')) {
    const startIdx = content.indexOf('const ICON_OPTIONS');
    const endIdx = content.indexOf('];', startIdx) + 2;
    if (startIdx >= 0 && endIdx > startIdx) {
      content = content.substring(0, startIdx) + ICON_OPTIONS_JS + '\n\n' + content.substring(endIdx);
      changed = true;
    }
  }
  
  // Fix 2: Replace broken COLOR_PRESETS
  if (content.includes('const COLOR_PRESETS = [')) {
    const startIdx = content.indexOf('const COLOR_PRESETS = [');
    const endIdx = content.indexOf('];', startIdx) + 2;
    if (startIdx >= 0 && endIdx > startIdx) {
      content = content.substring(0, startIdx) + COLOR_PRESETS + '\n\n' + content.substring(endIdx);
      changed = true;
    }
  }
  
  // Fix 3: Fix getIconComponent - remove .icon (which won't work with string icons)
  content = content.replace(
    'const found = ICON_OPTIONS.find((o: any) => o.value === iconName);',
    'const found = ICON_OPTIONS.find((o: any) => o.value === iconName);\n  '
  );
  
  // Fix 4: Fix className template literal escaping
  content = content.replace(/className=\\{\\`\\\$\\{/g, 'className={`${');
  
  // Fix 5: Remove the stray defaultIcon variable if present
  content = content.replace(/const defaultIcon = .*?;/g, '');
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
    console.log(`  ✓ Fixed ${name}.tsx`);
  }
}

console.log(`\n✅ Fixed ${fixedCount}/${files.length} generated files`);
