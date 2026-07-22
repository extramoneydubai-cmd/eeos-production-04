// ════════════════════════════════════════════════════════════════
// CRON SCHEDULER — DISABLED
// ════════════════════════════════════════════════════════════════
// This file is disabled (renamed from crons.ts → crons.disabled.ts)
// because it depends on generated Convex API types for the
// collectionEngine module, which require `bun convex dev --once`
// to succeed first.
//
// To re-enable:
// 1. Run `bun convex dev --once` (generates API types)
// 2. Rename this file back to crons.ts
// 3. Uncomment the code below and remove this header
// ════════════════════════════════════════════════════════════════

// import { cronJobs } from "convex/server";
// import { internal } from "./_generated/api";
//
// const crons = cronJobs();
//
// // Run collection automation daily at 2:00 AM
// crons.cron(
//   "daily collection automation",
//   "0 2 * * *",
//   internal.collectionEngine.dailyCollectionAutomation,
// );
//
// export default crons;
