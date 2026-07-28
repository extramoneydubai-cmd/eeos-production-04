/**
 * SchedulingExporter — Export scheduling data to multiple formats
 *
 * Supports:
 * - JSON (full schedule data)
 * - CSV (flat table format)
 * - Markdown (readable report)
 * - iCalendar (.ics) format for calendar import
 */

export type ExportFormat = "json" | "csv" | "markdown" | "ics";

export interface ExportOptions {
  format: ExportFormat;
  includeBookings?: boolean;
  includeParticipants?: boolean;
  dateRange?: { start: number; end: number };
}

class SchedulingExporterImpl {
  /** Export schedules in the requested format */
  exportSchedules(schedules: any[], options: ExportOptions): string {
    switch (options.format) {
      case "json":
        return this.toJson(schedules, options);
      case "csv":
        return this.toCsv(schedules, options);
      case "markdown":
        return this.toMarkdown(schedules, options);
      case "ics":
        return this.toIcs(schedules);
      default:
        return this.toJson(schedules, options);
    }
  }

  private toJson(schedules: any[], options: ExportOptions): string {
    const data = schedules.map((s) => ({
      id: s._id,
      title: s.title,
      type: s.scheduleType,
      status: s.status,
      priority: s.priority,
      start: new Date(s.start).toISOString(),
      end: new Date(s.end).toISOString(),
      timezone: s.timezone,
      allDay: s.allDay,
      recurrence: s.recurrence,
      location: s.location,
      participants: options.includeParticipants ? s.participants : undefined,
      resourceId: s.resourceId,
      capacity: s.capacity,
      currentBookings: s.currentBookings,
      entityType: s.entityType,
      entityId: s.entityId,
      tags: s.tags,
    }));
    return JSON.stringify(data, null, 2);
  }

  private toCsv(schedules: any[], options: ExportOptions): string {
    const headers = [
      "ID", "Title", "Type", "Status", "Priority",
      "Start", "End", "Timezone", "All Day", "Recurrence",
      "Resource ID", "Capacity", "Current Bookings",
      "Entity Type", "Entity ID",
    ];
    const rows = schedules.map((s) => [
      s._id, s.title, s.scheduleType, s.status, s.priority,
      new Date(s.start).toISOString(), new Date(s.end).toISOString(),
      s.timezone || "", s.allDay ? "Yes" : "No", s.recurrence || "",
      s.resourceId || "", s.capacity || "", s.currentBookings || "",
      s.entityType || "", s.entityId || "",
    ]);
    return [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
  }

  private toMarkdown(schedules: any[], options: ExportOptions): string {
    const lines: string[] = [];

    lines.push("# Schedule Report");
    lines.push("");
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Schedules:** ${schedules.length}`);
    lines.push("");

    for (const s of schedules) {
      lines.push(`## ${s.title}`);
      lines.push("");
      lines.push(`| Field | Value |`);
      lines.push(`|-------|-------|`);
      lines.push(`| **Type** | ${s.scheduleType} |`);
      lines.push(`| **Status** | ${s.status} |`);
      lines.push(`| **Priority** | ${s.priority || "medium"} |`);
      lines.push(`| **Start** | ${new Date(s.start).toLocaleString()} |`);
      lines.push(`| **End** | ${new Date(s.end).toLocaleString()} |`);
      lines.push(`| **All Day** | ${s.allDay ? "Yes" : "No"} |`);
      lines.push(`| **Recurrence** | ${s.recurrence || "None"} |`);
      if (s.resourceId) lines.push(`| **Resource** | ${s.resourceId} |`);
      if (s.capacity) lines.push(`| **Capacity** | ${s.capacity} |`);
      if (s.currentBookings !== undefined) lines.push(`| **Bookings** | ${s.currentBookings} |`);
      if (s.entityType) lines.push(`| **Entity** | ${s.entityType}: ${s.entityId || ""} |`);
      if (s.tags?.length) lines.push(`| **Tags** | ${s.tags.join(", ")} |`);
      lines.push("");
    }

    return lines.join("\n");
  }

  private toIcs(schedules: any[]): string {
    const lines: string[] = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("PRODID:-//EEOS//Scheduling Engine//EN");
    lines.push("CALSCALE:GREGORIAN");

    for (const s of schedules) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${s._id}@eeos`);
      lines.push(`DTSTART:${this.formatIcsDate(s.start)}`);
      lines.push(`DTEND:${this.formatIcsDate(s.end)}`);
      lines.push(`SUMMARY:${s.title}`);
      if (s.description) lines.push(`DESCRIPTION:${s.description}`);
      if (s.location) lines.push(`LOCATION:${s.location}`);
      lines.push(`STATUS:${s.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  private formatIcsDate(timestamp: number): string {
    return new Date(timestamp).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
}

export const schedulingExporter = new SchedulingExporterImpl();
