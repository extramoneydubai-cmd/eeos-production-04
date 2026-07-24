import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── EXPORT REPORT ─────────────────────────────

export const exportReport = mutation({
  args: {
    reportId: v.optional(v.id("reportDefinitions")),
    savedReportId: v.optional(v.id("savedReports")),
    format: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel"), v.literal("json")),
    filters: v.optional(v.string()),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const exportId = await ctx.db.insert("reportExports", {
      ...args,
      userId,
      status: "pending",
      createdAt: Date.now(),
    });

    try {
      // Process the export
      const resultData = args.data || "[]";
      const parsedData = JSON.parse(resultData);
      const recordCount = Array.isArray(parsedData) ? parsedData.length : 1;

      // Generate formatted output based on format
      let fileUrl: string | undefined;

      switch (args.format) {
        case "csv":
          fileUrl = generateCsvData(parsedData);
          break;
        case "json":
          fileUrl = resultData;
          break;
        case "pdf":
          // PDF placeholder - generate HTML table representation
          fileUrl = generateHtmlTable(parsedData);
          break;
        case "excel":
          // Excel placeholder - generate CSV as fallback
          fileUrl = generateCsvData(parsedData);
          break;
      }

      await ctx.db.patch(exportId, {
        status: "completed",
        fileUrl,
        fileSize: fileUrl ? fileUrl.length : 0,
        recordCount,
        completedAt: Date.now(),
      });

      return { exportId, fileUrl, recordCount, format: args.format };
    } catch (err: any) {
      await ctx.db.patch(exportId, {
        status: "failed",
        errorMessage: err.message,
        completedAt: Date.now(),
      });

      return { exportId, error: err.message, format: args.format };
    }
  },
});

function generateCsvData(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const escaped = String(val ?? "").replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

function generateHtmlTable(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return "<p>No data</p>";

  const headers = Object.keys(data[0]);
  let html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px;">';
  html += "<thead><tr>" + headers.map((h) => `<th style="background:#f1f3f4;text-align:left;font-weight:600;">${h}</th>`).join("") + "</tr></thead>";
  html += "<tbody>";
  for (const row of data) {
    html += "<tr>" + headers.map((h) => `<td style="border-top:1px solid #e8eaed;">${row[h] ?? ""}</td>`).join("") + "</tr>";
  }
  html += "</tbody></table>";

  return html;
}

// ─── GET EXPORT HISTORY ─────────────────────────

export const getExportHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query: any = ctx.db.query("reportExports")
      .withIndex("userId", (q: any) => q.eq("userId", userId));

    const exports = await query.order("desc").collect();
    return args.limit ? exports.slice(0, args.limit) : exports;
  },
});

export const getExport = query({
  args: { id: v.id("reportExports") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── FORMAT HELPERS (client-side) ──────────────

export const formatReportData = query({
  args: {
    data: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("html")),
  },
  handler: async (ctx, args) => {
    const parsed = JSON.parse(args.data);
    switch (args.format) {
      case "csv": return generateCsvData(parsed);
      case "html": return generateHtmlTable(parsed);
      case "json": return JSON.stringify(parsed, null, 2);
      default: return args.data;
    }
  },
});
