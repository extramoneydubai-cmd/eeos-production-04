/**
 * SchedulingAnalytics — Enterprise Scheduling Analytics Engine
 *
 * KPIs:
 * - Schedules Today / Upcoming / Completed / Cancelled / No Shows
 * - Attendance % / Utilization % / Faculty Load / Room Utilization
 * - Peak Hours / Average Duration / Monthly Trends
 *
 * Charts:
 * - Daily / Weekly / Monthly trends
 * - Resource heatmap
 * - Faculty load distribution
 * - Schedule type distribution
 */

// ─── Types ───────────────────────────────────────────────────────

export interface SchedulingKPI {
  label: string;
  value: number;
  previousValue?: number;
  trend?: "up" | "down" | "stable";
  changePercent?: number;
  format?: "number" | "percent" | "hours" | "currency";
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface ResourceHeatmapData {
  resource: string;
  hours: number[];
  days: string[];
  utilization: number[][];
}

export interface FacultyLoadData {
  facultyId: string;
  name: string;
  totalHours: number;
  teachingHours: number;
  otherHours: number;
  utilization: number;
}

export interface ScheduleAnalyticsData {
  kpis: SchedulingKPI[];
  dailyTrend: TrendDataPoint[];
  weeklyTrend: TrendDataPoint[];
  monthlyTrend: TrendDataPoint[];
  typeDistribution: { type: string; count: number; color: string }[];
  resourceUtilization: { resource: string; utilization: number; capacity: number }[];
  facultyLoad: FacultyLoadData[];
  peakHours: { hour: number; count: number }[];
  averageDuration: number;
  heatmap: ResourceHeatmapData | null;
}

// ─── SchedulingAnalytics Engine ──────────────────────────────────

export class SchedulingAnalytics {
  /**
   * Compute KPIs from a list of schedules
   */
  computeKPIs(schedules: any[]): SchedulingKPI[] {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const today = schedules.filter(
      (s) => s.start >= todayStart.getTime() && s.start <= todayEnd.getTime(),
    );
    const upcoming = schedules.filter((s) => s.start > now);
    const completed = schedules.filter((s) => s.status === "completed" || s.end < now);
    const cancelled = schedules.filter((s) => s.status === "cancelled");
    const noShows = schedules.filter((s) => s.status === "no_show");

    // Utilization
    const totalHours = schedules.reduce((sum, s) => sum + (s.end - s.start), 0) / 3600000;
    const scheduledHours = completed.reduce((sum, s) => sum + (s.end - s.start), 0) / 3600000;
    const utilizationPct = totalHours > 0
      ? Math.round((scheduledHours / totalHours) * 100)
      : 0;

    // Average duration
    const durations = schedules.map((s) => (s.end - s.start) / 60000);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return [
      { label: "Today", value: today.length, format: "number" },
      { label: "Upcoming", value: upcoming.length, format: "number" },
      { label: "Completed", value: completed.length, format: "number" },
      { label: "Cancelled", value: cancelled.length, format: "number" },
      { label: "No Shows", value: noShows.length, format: "number" },
      { label: "Attendance %", value: Math.round(100 - (noShows.length / (schedules.length || 1)) * 100), format: "percent" },
      { label: "Utilization", value: utilizationPct, format: "percent" },
      { label: "Avg Duration", value: avgDuration, format: "number" },
    ];
  }

  /**
   * Compute daily trend data
   */
  computeDailyTrend(schedules: any[], days: number = 30): TrendDataPoint[] {
    const points: TrendDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const count = schedules.filter(
        (s) => s.start >= start.getTime() && s.start <= end.getTime(),
      ).length;

      points.push({
        date: date.toISOString().split("T")[0],
        value: count,
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    }

    return points;
  }

  /**
   * Compute weekly trend data
   */
  computeWeeklyTrend(schedules: any[], weeks: number = 12): TrendDataPoint[] {
    const points: TrendDataPoint[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - end.getDay() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);

      const count = schedules.filter(
        (s) => s.start >= start.getTime() && s.start <= end.getTime(),
      ).length;

      points.push({
        date: `W${Math.ceil((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 604800000)}`,
        value: count,
        label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
    }

    return points;
  }

  /**
   * Compute monthly trend data
   */
  computeMonthlyTrend(schedules: any[], months: number = 12): TrendDataPoint[] {
    const points: TrendDataPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = schedules.filter(
        (s) => s.start >= start.getTime() && s.start <= end.getTime(),
      ).length;

      points.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        value: count,
        label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      });
    }

    return points;
  }

  /**
   * Compute schedule type distribution
   */
  computeTypeDistribution(schedules: any[]): { type: string; count: number; color: string }[] {
    const typeColors: Record<string, string> = {
      lecture: "#a855f7",
      exam: "#ea4335",
      meeting: "#4285f4",
      counseling: "#ec4899",
      office_hours: "#06b6d4",
      invigilation: "#f59e0b",
      training: "#22c55e",
      maintenance: "#f97316",
    };

    const counts: Record<string, number> = {};
    schedules.forEach((s) => {
      const t = s.scheduleType || "other";
      counts[t] = (counts[t] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        color: typeColors[type] || "#9aa0a6",
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Compute resource utilization
   */
  computeResourceUtilization(schedules: any[], resourceCapacity: Record<string, number> = {}) {
    const resourceHours: Record<string, number> = {};

    schedules.forEach((s) => {
      if (s.resourceId) {
        resourceHours[s.resourceId] = (resourceHours[s.resourceId] || 0) + (s.end - s.start) / 3600000;
      }
    });

    return Object.entries(resourceHours).map(([resource, hours]) => ({
      resource,
      utilization: Math.round((hours / 40) * 100),
      capacity: resourceCapacity[resource] || 40,
    }));
  }

  /**
   * Compute faculty load
   */
  computeFacultyLoad(schedules: any[]): FacultyLoadData[] {
    const facultyData: Record<string, { total: number; teaching: number; other: number }> = {};

    schedules.forEach((s) => {
      if (s.facultyId) {
        const hours = (s.end - s.start) / 3600000;
        if (!facultyData[s.facultyId]) {
          facultyData[s.facultyId] = { total: 0, teaching: 0, other: 0 };
        }
        facultyData[s.facultyId].total += hours;
        if (s.scheduleType === "lecture") {
          facultyData[s.facultyId].teaching += hours;
        } else {
          facultyData[s.facultyId].other += hours;
        }
      }
    });

    return Object.entries(facultyData).map(([facultyId, data]) => ({
      facultyId,
      name: facultyId,
      totalHours: Math.round(data.total),
      teachingHours: Math.round(data.teaching),
      otherHours: Math.round(data.other),
      utilization: Math.round((data.total / 40) * 100),
    }));
  }

  /**
   * Compute peak hours
   */
  computePeakHours(schedules: any[]): { hour: number; count: number }[] {
    const hourCounts: Record<number, number> = {};

    schedules.forEach((s) => {
      const hour = new Date(s.start).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourCounts[i] || 0,
    }));
  }

  /**
   * Compute comprehensive analytics
   */
  computeAnalytics(schedules: any[]): ScheduleAnalyticsData {
    return {
      kpis: this.computeKPIs(schedules),
      dailyTrend: this.computeDailyTrend(schedules),
      weeklyTrend: this.computeWeeklyTrend(schedules),
      monthlyTrend: this.computeMonthlyTrend(schedules),
      typeDistribution: this.computeTypeDistribution(schedules),
      resourceUtilization: this.computeResourceUtilization(schedules),
      facultyLoad: this.computeFacultyLoad(schedules),
      peakHours: this.computePeakHours(schedules),
      averageDuration: schedules.length > 0
        ? Math.round(schedules.reduce((sum, s) => sum + (s.end - s.start), 0) / schedules.length / 60000)
        : 0,
      heatmap: null,
    };
  }
}

export const schedulingAnalytics = new SchedulingAnalytics();
