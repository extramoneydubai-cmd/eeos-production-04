/**
 * ReleaseNotesGenerator — Auto-generates release notes in Markdown format.
 *
 * Includes:
 *  - Build version and number
 *  - Modules added/changed
 *  - Routes added/changed
 *  - SDK changes
 *  - Schema changes
 *  - Breaking changes
 *  - Performance notes
 *  - Known issues
 */

import { buildVersionManager } from "./BuildVersionManager";

class ReleaseNotesGeneratorImpl {
  /** Generate release notes as markdown */
  generate(): string {
    const info = buildVersionManager.getBuildInfo();
    const now = new Date().toISOString();

    return [
      `# EEOS Release v${info.version}`,
      ``,
      `**Build:** ${info.buildNumber}`,
      `**Environment:** ${info.environment}`,
      `**Channel:** ${info.releaseChannel}`,
      `**Git Commit:** ${info.gitCommit}`,
      `**Build Time:** ${info.buildTimestamp}`,
      `**Generated:** ${now}`,
      ``,
      `---`,
      ``,
      `## Modules`,
      ``,
      `This release includes the following modules:`,
      ``,
      `- CRM (Leads, Sales, Opportunities, Collections)`,
      `- Finance (Dashboard, Invoices, Expenses, Reports)`,
      `- Procurement (Vendors, Inventory, Assets)`,
      `- Student (Database, Workspace, Enrollment, Academic)`,
      `- Employee/HR (Database, Workspace, Leave, Payroll)`,
      `- People Registry (Database, Workspace, QR)`,
      `- Academic (Courses, Batches, Subjects, Timetable)`,
      `- Calendar (Day/Week/Month/Agenda/Resource views)`,
      `- LMS (Courses, Lessons, Assignments)`,
      `- Examination (Sessions, Results, Report Cards)`,
      `- Communication (Messenger, Notifications)`,
      `- Executive Dashboards (CEO/COO/CFO/CTO/CMO/CHRO/CKO)`,
      `- Analytics Platform`,
      ``,
      `## Infrastructure`,
      ``,
      `- Runtime Self-Healing Platform (14 monitors)`,
      `- Production Readiness Manager`,
      `- Build Version Manager`,
      `- Environment Validator`,
      `- Feature Flag Manager`,
      `- Cache Manager (versioned)`,
      `- Deployment Validator`,
      `- Rollback Detection`,
      `- Release Health Dashboard`,
      `- Recovery Screen`,
      `- Report Issue Dialog`,
      `- Error Logger (severity-classified)`,
      `- Safe Query/Safe SDK wrappers`,
      ``,
      `## SDK`,
      ``,
      `- Platform SDK (14 SDK modules)`,
      `- Safe wrapper with auto-retry and logging`,
      `- Performance monitoring`,
      `- Duplicate call detection`,
      `- Slow operation detection`,
      ``,
      `## Known Issues`,
      ``,
      `- Analytics platform requires Convex deployment for full functionality`,
      `- Some modules may show "Coming Soon" placeholders`,
      `- Executive dashboards require role configuration`,
      ``,
      `---`,
      ``,
      `*Generated automatically by EEOS Release Notes Generator*`,
    ].join("\n");
  }

  /** Get changelog file path */
  getChangelogPath(): string {
    return `docs/releases/v${buildVersionManager.version}.md`;
  }
}

export const releaseNotesGenerator = new ReleaseNotesGeneratorImpl();
