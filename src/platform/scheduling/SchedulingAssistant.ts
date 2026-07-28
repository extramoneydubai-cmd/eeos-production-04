/**
 * SchedulingAssistant — AI-Powered Scheduling Suggestions
 *
 * Provides:
 * - Best slot suggestions (avoids conflicts, considers working hours, lunch, travel buffer)
 * - Resource recommendations (best room, faculty, equipment for a given schedule type)
 * - Conflict detection with resolution suggestions
 * - Faculty load balancing suggestions
 * - Schedule optimization scoring
 *
 * Usage:
 *   import { schedulingAssistant } from "@/platform/scheduling/SchedulingAssistant";
 *   const suggestions = await schedulingAssistant.suggestBestSlots(schedules, { duration: 60 });
 *   const resources = schedulingAssistant.recommendResource("lecture", availableResources);
 *
 * This is a rule-based engine architected for future AI integration.
 */

import { SchedulingConflictEngine } from "./SchedulingConflictEngine";
import { AvailabilityEngine } from "./AvailabilityEngine";

// ─── Types ────────────────────────────────────────────────────────

export interface SlotSuggestion {
  start: number;
  end: number;
  score: number;
  label: string;
  conflicts: number;
  isOptimal: boolean;
}

export interface ResourceRecommendation {
  resourceId: string;
  name: string;
  resourceType: string;
  score: number;
  capacity: number;
  utilization: number;
  reason: string;
}

export interface OptimizationScore {
  overall: number;
  facultyUtilization: number;
  resourceUtilization: number;
  conflictScore: number;
  balanceScore: number;
  preferenceScore: number;
  recommendations: string[];
}

export interface ConflictResolution {
  conflictId: string;
  type: string;
  severity: string;
  suggestions: string[];
  recommendedAction: string;
}

// ─── Working Hours Config ─────────────────────────────────────────

const WORKING_HOURS = {
  start: 8,     // 8:00 AM
  end: 18,      // 6:00 PM
  lunchStart: 12,
  lunchEnd: 13,
  bufferMinutes: 15,
  maxHoursPerDay: 8,
  minSlotDuration: 15,
  maxSlotDuration: 480,
};

// ─── Scheduling Assistant ─────────────────────────────────────────

class SchedulingAssistantImpl {
  /**
   * Suggest the best available time slots for a given duration (in minutes).
   * Considers existing schedules, working hours, lunch buffer, and travel buffer.
   */
  suggestBestSlots(
    existingSchedules: any[],
    options: {
      duration: number;
      startDate?: number;
      endDate?: number;
      maxSuggestions?: number;
      preferMorning?: boolean;
      preferAfternoon?: boolean;
      avoidDays?: number[];
    } = { duration: 60 },
  ): SlotSuggestion[] {
    const {
      duration,
      startDate = Date.now(),
      endDate = startDate + 7 * 24 * 60 * 60 * 1000,
      maxSuggestions = 5,
      preferMorning,
      preferAfternoon,
      avoidDays = [],
    } = options;

    const suggestions: SlotSuggestion[] = [];
    const now = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = duration * 60 * 1000;

    // Generate candidate slots for each day
    const current = new Date(now);

    while (current.getTime() < end.getTime()) {
      const dayOfWeek = current.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      // Skip avoided days
      if (avoidDays.includes(dayOfWeek)) {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      // Check if today (only suggest future slots)
      const isToday = current.toDateString() === new Date().toDateString();
      const startHour = isToday
        ? Math.max(WORKING_HOURS.start, new Date().getHours() + 1)
        : WORKING_HOURS.start;

      // Generate hourly slots
      for (let hour = startHour; hour < WORKING_HOURS.end - duration / 60; hour++) {
        const slotStart = new Date(current);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + durationMs);

        // Skip lunch hours
        if (hour >= WORKING_HOURS.lunchStart - 1 && hour < WORKING_HOURS.lunchEnd) {
          continue;
        }

        // Skip if beyond working hours
        if (slotEnd.getHours() >= WORKING_HOURS.end) {
          continue;
        }

        // Skip past slots
        if (slotStart.getTime() < Date.now()) {
          continue;
        }

        // Check conflicts with existing schedules
        const conflicts = existingSchedules.filter((s) => {
          if (!s || !s.start || !s.end) return false;
          return s.start < slotEnd.getTime() && s.end > slotStart.getTime();
        });

        // Score the slot
        let score = 100;
        let label = "";

        // Penalize conflicts
        score -= conflicts.length * 25;

        // Prefer morning slots (higher score)
        if (hour >= 8 && hour <= 10) {
          score += 10;
          if (preferAfternoon) score -= 5;
          label = "Morning";
        } else if (hour >= 10 && hour <= 12) {
          score += 5;
          if (preferAfternoon) score -= 3;
          label = "Late Morning";
        } else if (hour >= 14 && hour <= 16) {
          score += 8;
          if (preferMorning) score -= 5;
          label = "Afternoon";
        } else if (hour >= 16 && hour <= 17) {
          score += 3;
          label = "Late Afternoon";
        }

        // Penalize late slots
        if (hour >= 17) score -= 5;

        // Prefer specific preferences
        if (preferMorning && hour < 12) score += 15;
        if (preferAfternoon && hour >= 13) score += 15;

        // Day-based adjustments
        if (dayOfWeek === 1 || dayOfWeek === 2) score += 5; // Mon/Tue are high-productivity
        if (dayOfWeek === 5) score -= 3; // Friday slightly lower

        const dayLabel = current.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const timeLabel = slotStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

        suggestions.push({
          start: slotStart.getTime(),
          end: slotEnd.getTime(),
          score: Math.max(0, score),
          label: `${dayLabel} — ${timeLabel} (${label})`,
          conflicts: conflicts.length,
          isOptimal: conflicts.length === 0 && score >= 85,
        });
      }

      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    // Sort by score descending, then return top N
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  /**
   * Recommend the best resource for a given schedule type.
   */
  recommendResource(
    scheduleType: string,
    availableResources: any[],
    options: {
      minCapacity?: number;
      preferLocation?: string;
    } = {},
  ): ResourceRecommendation[] {
    if (!availableResources?.length) return [];

    const { minCapacity, preferLocation } = options;

    const resourceTypeMap: Record<string, string[]> = {
      meeting: ["meeting_room", "conference_room", "studio"],
      lecture: ["classroom", "lab", "auditorium"],
      exam: ["exam_hall", "classroom", "auditorium"],
      interview: ["meeting_room", "conference_room"],
      training: ["classroom", "lab", "studio"],
      counseling: ["meeting_room", "office"],
      maintenance: ["workshop", "storage"],
    };

    const preferredTypes = resourceTypeMap[scheduleType] || ["meeting_room"];

    const scored = availableResources
      .filter((r) => preferredTypes.includes(r.resourceType) && r.status !== "maintenance")
      .filter((r) => !minCapacity || (r.capacity || 0) >= minCapacity)
      .map((r) => {
        let score = 50;

        // Capacity match
        if (r.capacity) {
          if (minCapacity && r.capacity >= minCapacity && r.capacity <= minCapacity * 2) {
            score += 20;
          } else if (r.capacity >= 20) {
            score += 10;
          }
        }

        // Location match
        if (preferLocation && r.location?.toLowerCase().includes(preferLocation.toLowerCase())) {
          score += 15;
        }

        // Utilization: prefer less utilized resources
        const utilization = r.currentUtilization || 0;
        if (utilization < 30) score += 15;
        else if (utilization < 60) score += 10;
        else if (utilization < 80) score += 5;

        // Active status
        if (r.status === "active") score += 10;

        return {
          resourceId: r._id,
          name: r.name || r.title || "Resource",
          resourceType: r.resourceType,
          score: Math.min(100, score),
          capacity: r.capacity || 0,
          utilization,
          reason: score >= 80 ? "Excellent match" : score >= 60 ? "Good match" : "Available",
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5);
  }

  /**
   * Suggest conflict resolutions.
   */
  suggestConflictResolution(
    schedule: any,
    conflictingSchedules: any[],
    availableResources: any[],
  ): ConflictResolution[] {
    if (!conflictingSchedules?.length) return [];

    return conflictingSchedules.map((conflict) => {
      const suggestions: string[] = [];

      // Suggestion 1: Reschedule to a different time
      const laterSlots = this.suggestBestSlots(
        conflictingSchedules.filter((s: any) => s._id !== schedule?._id),
        { duration: ((schedule?.end || 3600000) - (schedule?.start || 0)) / 60000 },
      );
      if (laterSlots.length > 0) {
        suggestions.push(`Reschedule to ${laterSlots[0].label}`);
      }

      // Suggestion 2: Use a different resource
      if (availableResources?.length > 0) {
        const resources = this.recommendResource(
          schedule?.scheduleType || "meeting",
          availableResources.filter((r) => r._id !== conflict.resourceId),
        );
        if (resources.length > 0) {
          suggestions.push(`Use "${resources[0].name}" instead`);
        }
      }

      // Suggestion 3: Swap times with conflicting schedule
      if (conflict.start && conflict.end && schedule) {
        const conflictDuration = (conflict.end - conflict.start) / 60000;
        const scheduleDuration = ((schedule.end || 3600000) - (schedule.start || 0)) / 60000;
        if (Math.abs(conflictDuration - scheduleDuration) < 30) {
          suggestions.push("Swap time slots with the conflicting schedule");
        }
      }

      // Determine severity
      let severity = "low";
      if (conflict.start && schedule?.start) {
        const diff = Math.abs(conflict.start - schedule.start);
        if (diff < 1800000) severity = "critical"; // Under 30 min
        else if (diff < 3600000) severity = "high"; // Under 1 hour
        else if (diff < 7200000) severity = "medium"; // Under 2 hours
      }

      return {
        conflictId: conflict._id,
        type: conflict.scheduleType || "unknown",
        severity,
        suggestions,
        recommendedAction: suggestions[0] || "Review manually",
      };
    });
  }

  /**
   * Calculate optimization score for a set of schedules.
   */
  calculateOptimizationScore(
    schedules: any[],
    resources: any[],
    faculty: any[],
  ): OptimizationScore {
    if (!schedules?.length) {
      return {
        overall: 100,
        facultyUtilization: 100,
        resourceUtilization: 100,
        conflictScore: 100,
        balanceScore: 100,
        preferenceScore: 100,
        recommendations: ["No schedules to evaluate"],
      };
    }

    const recommendations: string[] = [];

    // Conflict score
    const conflicting = (s: any) =>
      schedules.filter((o) => o._id !== s._id && s.start < o.end && s.end > o.start);
    const totalConflicts = schedules.reduce((sum, s) => sum + conflicting(s).length, 0);
    const conflictScore = Math.max(0, 100 - totalConflicts * 20);

    if (totalConflicts > 0) {
      recommendations.push(`Resolve ${totalConflicts} scheduling conflicts`);
    }

    // Resource utilization
    let resourceUtilization = 100;
    if (resources?.length > 0) {
      const usedResources = new Set(schedules.map((s) => s.resourceId).filter(Boolean));
      resourceUtilization = Math.round((usedResources.size / resources.length) * 100);
      if (resourceUtilization < 30) {
        recommendations.push("Increase resource utilization — many resources are idle");
      }
    }

    // Faculty load balance
    let facultyUtilization = 100;
    if (faculty?.length > 0) {
      const facultyLoads: Record<string, number> = {};
      schedules.forEach((s) => {
        if (s.owner) facultyLoads[s.owner] = (facultyLoads[s.owner] || 0) + 1;
      });
      const loads = Object.values(facultyLoads);
      if (loads.length > 0) {
        const maxLoad = Math.max(...loads);
        const minLoad = Math.min(...loads);
        const variance = maxLoad - minLoad;
        facultyUtilization = Math.max(0, 100 - variance * 10);
        if (variance > 3) {
          recommendations.push("Balance faculty workload — some faculty have too many sessions");
        }
      }
    }

    // Balance score (spread across week)
    let balanceScore = 100;
    const dayDistribution: Record<number, number> = {};
    schedules.forEach((s) => {
      if (s.start) {
        const day = new Date(s.start).getDay();
        dayDistribution[day] = (dayDistribution[day] || 0) + 1;
      }
    });
    const dayValues = Object.values(dayDistribution);
    if (dayValues.length > 1) {
      const avg = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
      const maxDeviation = Math.max(...dayValues.map((v) => Math.abs(v - avg)));
      balanceScore = Math.max(0, 100 - maxDeviation * 15);
      if (maxDeviation > avg) {
        recommendations.push("Distribute schedules more evenly across the week");
      }
    }

    // Preference score (morning vs afternoon balance)
    let preferenceScore = 100;
    const morningCount = schedules.filter((s) => {
      if (!s.start) return false;
      const h = new Date(s.start).getHours();
      return h >= 8 && h < 12;
    }).length;
    const afternoonCount = schedules.filter((s) => {
      if (!s.start) return false;
      const h = new Date(s.start).getHours();
      return h >= 12 && h < 18;
    }).length;
    const total = morningCount + afternoonCount;
    if (total > 0) {
      const morningRatio = morningCount / total;
      // Ideal: 40-60% morning
      if (morningRatio < 0.3 || morningRatio > 0.7) {
        preferenceScore = 60;
        recommendations.push("Consider balancing morning and afternoon sessions");
      } else if (morningRatio < 0.4 || morningRatio > 0.6) {
        preferenceScore = 80;
      }
    }

    // Overall score
    const overall = Math.round(
      (conflictScore * 0.35 +
        resourceUtilization * 0.2 +
        facultyUtilization * 0.2 +
        balanceScore * 0.15 +
        preferenceScore * 0.1)
    );

    return {
      overall,
      facultyUtilization,
      resourceUtilization,
      conflictScore,
      balanceScore,
      preferenceScore,
      recommendations,
    };
  }

  /**
   * Check if a proposed time slot would create conflicts.
   */
  checkAvailability(
    start: number,
    end: number,
    existingSchedules: any[],
    excludeId?: string,
  ): { available: boolean; conflicts: any[] } {
    const conflicts = existingSchedules.filter((s) => {
      if (!s || !s.start || !s.end) return false;
      if (excludeId && s._id === excludeId) return false;
      return s.start < end && s.end > start;
    });
    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Get working hours info for a given date.
   */
  getWorkingHours(date?: Date): { start: number; end: number; lunchStart: number; lunchEnd: number; totalMinutes: number } {
    return {
      start: WORKING_HOURS.start,
      end: WORKING_HOURS.end,
      lunchStart: WORKING_HOURS.lunchStart,
      lunchEnd: WORKING_HOURS.lunchEnd,
      totalMinutes: (WORKING_HOURS.end - WORKING_HOURS.start) * 60 - (WORKING_HOURS.lunchEnd - WORKING_HOURS.lunchStart) * 60,
    };
  }
}

export const schedulingAssistant = new SchedulingAssistantImpl();
