/**
 * Production SDK — content production pipeline.
 *
 * Resolves the phantom `api.productionSdk.getProductionDashboard` reference
 * used by ProductionDashboard. Backed by the existing `productionTasks`
 * table (schema/metadata.ts). Task statuses (assigned/in_progress/review/
 * approved/published/rejected) map onto the dashboard's pipeline stages.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";

/** Production pipeline KPIs for the dashboard. */
export const getProductionDashboard = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("productionTasks").collect();
    const by = (st: string) => tasks.filter((t: any) => t.status === st).length;
    return {
      total: tasks.length,
      draft: by("assigned"),
      inProgress: by("in_progress"),
      review: by("review"),
      approved: by("approved"),
      published: by("published"),
      rejected: by("rejected"),
    };
  },
});
