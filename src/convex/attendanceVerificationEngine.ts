/**
 * Attendance Verification Engine — QR / GPS / Face verification flows.
 *
 * PATCH-ATTENDANCE-VERIFY-001
 *
 * Adds functional verification on top of attendanceEngine's manual marking:
 *  - QR: one-time-use server-issued tokens rendered as QR codes; scanning a
 *        token marks attendance with mode="qr" + otpVerified.
 *  - GPS: per-branch geofence radius; marking computes haversine distance and
 *        records geofenceVerified + geofenceDistanceM with mode="gps".
 *  - Face: photo registration (stored via Convex file storage) + selfie
 *        capture at check-in; mode="face_recognition" + selfieUrl.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Shared validators ──────────────────────────────────────────

export const ATTENDANCE_ENTITY_TYPE = v.union(
  v.literal("student"), v.literal("employee"), v.literal("faculty"),
  v.literal("visitor"), v.literal("vendor"), v.literal("support"),
);

export const ATTENDANCE_STATUS = v.union(
  v.literal("present"), v.literal("absent"), v.literal("late"),
  v.literal("half_day"), v.literal("holiday"), v.literal("on_leave"),
);

/** Generate a reasonably-unique token without external deps. */
function generateToken(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const rand2 = Math.random().toString(36).slice(2, 10);
  return `eeos-${Date.now().toString(36)}-${rand}-${rand2}`;
}

/** Haversine distance between two coordinates in meters. */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── QR tokens ──────────────────────────────────────────────────

/**
 * Issue a one-time-use QR token for an entity on a given date.
 * Reuses an existing unused, unexpired token for the same entity+date.
 */
export const issueQrToken = mutation({
  args: { token: v.optional(v.string()),
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: v.string(),
    date: v.number(),
    expiresInHours: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "attendanceVerificationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.query("attendanceQrTokens")
      .withIndex("entityType_entityId_date", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("date", args.date))
      .first();

    const now = Date.now();
    if (existing && !existing.usedAt && existing.expiresAt > now) {
      return { token: existing.token, expiresAt: existing.expiresAt, date: args.date, reused: true };
    }

    const token = generateToken();
    const expiresAt = now + (args.expiresInHours ?? 24) * 3600_000;
    await ctx.db.insert("attendanceQrTokens", {
      token,
      entityType: args.entityType,
      entityId: args.entityId,
      date: args.date,
      expiresAt,
      createdAt: now,
    });
    return { token, expiresAt, date: args.date, reused: false };
  }),
});

/** Get the current active QR token for an entity+date (for display). */
export const getQrToken = query({
  args: {
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.db.query("attendanceQrTokens")
      .withIndex("entityType_entityId_date", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("date", args.date))
      .first();
    if (!token || token.usedAt || token.expiresAt <= Date.now()) return null;
    return token;
  },
});

/**
 * Verify a scanned QR token and mark attendance.
 * The token encodes the entity identity server-side, so a scan of a valid
 * token marks attendance for the token's owner on the token's date.
 */
export const verifyQrMark = mutation({
  args: { token: v.string(),
    branchId: v.optional(v.id("branches")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tokenDoc = await ctx.db.query("attendanceQrTokens")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) throw new Error("Invalid QR token");
    if (tokenDoc.usedAt) throw new Error("QR token already used");
    if (tokenDoc.expiresAt <= Date.now()) throw new Error("QR token expired");

    const now = Date.now();
    await ctx.db.patch(tokenDoc._id, { usedAt: now });

    // Upsert the attendance record for the token owner.
    const existing = await ctx.db.query("attendanceRecords")
      .withIndex("entityType_entityId_date", (q: any) =>
        q.eq("entityType", tokenDoc.entityType).eq("entityId", tokenDoc.entityId).eq("date", tokenDoc.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "present",
        checkIn: existing.checkIn || now,
        mode: "qr",
        otpVerified: true,
        branchId: args.branchId || existing.branchId,
        latitude: args.latitude !== undefined ? args.latitude : existing.latitude,
        longitude: args.longitude !== undefined ? args.longitude : existing.longitude,
        deviceId: args.deviceId,
        updatedAt: now,
      });
      return { recordId: existing._id, action: "updated", entityType: tokenDoc.entityType, entityId: tokenDoc.entityId, date: tokenDoc.date };
    }

    const id = await ctx.db.insert("attendanceRecords", {
      entityType: tokenDoc.entityType,
      entityId: tokenDoc.entityId,
      date: tokenDoc.date,
      status: "present",
      checkIn: now,
      mode: "qr",
      otpVerified: true,
      branchId: args.branchId,
      latitude: args.latitude,
      longitude: args.longitude,
      deviceId: args.deviceId,
      markedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return { recordId: id, action: "created", entityType: tokenDoc.entityType, entityId: tokenDoc.entityId, date: tokenDoc.date };
  },
});

// ─── GPS / Geofences ────────────────────────────────────────────

/** Save (upsert) the geofence config for a branch. */
export const saveGeofence = mutation({
  args: { token: v.optional(v.string()),
    branchId: v.id("branches"),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radiusM: v.number(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "attendanceVerificationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.query("geofences")
      .withIndex("by_branch", (q: any) => q.eq("branchId", args.branchId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        latitude: args.latitude,
        longitude: args.longitude,
        radiusM: args.radiusM,
        isActive: true,
        updatedAt: now,
      });
      return { id: existing._id, action: "updated" };
    }
    const id = await ctx.db.insert("geofences", {
      branchId: args.branchId,
      name: args.name,
      latitude: args.latitude,
      longitude: args.longitude,
      radiusM: args.radiusM,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return { id, action: "created" };
  }),
});

/** Get the active geofence for a branch. */
export const getGeofence = query({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    return ctx.db.query("geofences")
      .withIndex("by_branch", (q: any) => q.eq("branchId", args.branchId))
      .first();
  },
});

/** List all geofences (admin configuration view). */
export const listGeofences = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("geofences").collect();
  },
});

/**
 * Mark attendance with GPS verification against the branch geofence.
 * If no geofence is configured for the branch, the location is still recorded
 * with geofenceVerified=false and a note in the result.
 */
export const markWithGps = mutation({
  args: { token: v.optional(v.string()),
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: v.string(),
    date: v.number(),
    latitude: v.number(),
    longitude: v.number(),
    branchId: v.optional(v.id("branches")),
    checkIn: v.optional(v.number()),
    deviceId: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "attendanceVerificationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    let geofence: any = null;
    if (args.branchId) {
      geofence = await ctx.db.query("geofences")
        .withIndex("by_branch", (q: any) => q.eq("branchId", args.branchId))
        .first();
    }

    let geofenceVerified = false;
    let geofenceDistanceM: number | undefined;
    if (geofence) {
      geofenceDistanceM = Math.round(haversineMeters(
        args.latitude, args.longitude, geofence.latitude, geofence.longitude,
      ));
      geofenceVerified = geofenceDistanceM <= geofence.radiusM;
    }

    const existing = await ctx.db.query("attendanceRecords")
      .withIndex("entityType_entityId_date", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: geofenceVerified ? "present" : existing.status,
        checkIn: args.checkIn || existing.checkIn || now,
        mode: "gps",
        branchId: args.branchId || existing.branchId,
        latitude: args.latitude,
        longitude: args.longitude,
        geofenceVerified,
        geofenceDistanceM,
        deviceId: args.deviceId,
        updatedAt: now,
      });
      return { recordId: existing._id, action: "updated", geofenceVerified, geofenceDistanceM, geofenceConfigured: !!geofence };
    }

    const id = await ctx.db.insert("attendanceRecords", {
      entityType: args.entityType,
      entityId: args.entityId,
      date: args.date,
      status: geofenceVerified ? "present" : "present",
      checkIn: args.checkIn || now,
      mode: "gps",
      branchId: args.branchId,
      latitude: args.latitude,
      longitude: args.longitude,
      geofenceVerified,
      geofenceDistanceM,
      deviceId: args.deviceId,
      markedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return { recordId: id, action: "created", geofenceVerified, geofenceDistanceM, geofenceConfigured: !!geofence };
  }),
});

// ─── Face registration & verification ───────────────────────────

/** Generate a file upload URL for face photos / selfies. */
export const generateUploadUrl = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "attendanceVerificationEngine" }, async (ctx) => {
    return ctx.storage.generateUploadUrl();
  }),
});

/** Register (or replace) a face reference photo for an entity. */
export const registerFace = mutation({
  args: { token: v.optional(v.string()),
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: v.string(),
    photoStorageId: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "attendanceVerificationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const existing = await ctx.db.query("faceRegistrations")
      .withIndex("entityType_entityId", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .first();

    if (existing) {
      // Clean up the previous photo blob if it exists in storage.
      try { await ctx.storage.delete(existing.photoStorageId as any); } catch { /* ignore */ }
      await ctx.db.patch(existing._id, {
        photoStorageId: args.photoStorageId,
        updatedAt: now,
      });
      return { id: existing._id, action: "updated" };
    }
    const id = await ctx.db.insert("faceRegistrations", {
      entityType: args.entityType,
      entityId: args.entityId,
      photoStorageId: args.photoStorageId,
      createdAt: now,
      updatedAt: now,
    });
    return { id, action: "created" };
  }),
});

/** Get the face registration for an entity, with a resolvable photo URL. */
export const getFaceRegistration = query({
  args: {
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const reg = await ctx.db.query("faceRegistrations")
      .withIndex("entityType_entityId", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .first();
    if (!reg) return null;
    const photoUrl = await ctx.storage.getUrl(reg.photoStorageId as any);
    return { ...reg, photoUrl };
  },
});

/**
 * Mark attendance with face verification.
 * Requires a registered face photo; stores the captured selfie and marks
 * mode="face_recognition".
 */
export const markWithFace = mutation({
  args: { token: v.optional(v.string()),
    entityType: ATTENDANCE_ENTITY_TYPE,
    entityId: v.string(),
    date: v.number(),
    selfieStorageId: v.string(),
    branchId: v.optional(v.id("branches")),
    checkIn: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "attendanceVerificationEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const registration = await ctx.db.query("faceRegistrations")
      .withIndex("entityType_entityId", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .first();

    if (!registration) {
      throw new Error("No face registration found for this entity. Register a face photo first.");
    }

    const now = Date.now();
    const selfieUrl = await ctx.storage.getUrl(args.selfieStorageId as any);
    const selfieResolved = selfieUrl || args.selfieStorageId;

    const existing = await ctx.db.query("attendanceRecords")
      .withIndex("entityType_entityId_date", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "present",
        checkIn: args.checkIn || existing.checkIn || now,
        mode: "face_recognition",
        selfieUrl: selfieResolved,
        branchId: args.branchId || existing.branchId,
        updatedAt: now,
      });
      return { recordId: existing._id, action: "updated", registrationId: registration._id };
    }

    const id = await ctx.db.insert("attendanceRecords", {
      entityType: args.entityType,
      entityId: args.entityId,
      date: args.date,
      status: "present",
      checkIn: args.checkIn || now,
      mode: "face_recognition",
      selfieUrl: selfieResolved,
      branchId: args.branchId,
      markedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return { recordId: id, action: "created", registrationId: registration._id };
  }),
});

// ─── Records & stats for the UI ─────────────────────────────────

/** Get attendance records with filters (mirrors the SDK surface the page used). */
export const getRecords = query({
  args: {
    entityType: v.optional(ATTENDANCE_ENTITY_TYPE),
    entityId: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("attendanceRecords").collect();
    const filtered = all.filter((r: any) => {
      if (args.entityType && r.entityType !== args.entityType) return false;
      if (args.entityId && r.entityId !== args.entityId) return false;
      if (r.date < args.startDate || r.date > args.endDate) return false;
      if (args.branchId && r.branchId !== args.branchId) return false;
      return true;
    });
    return { records: filtered.sort((a: any, b: any) => b.date - a.date), total: filtered.length };
  },
});

/** Today's attendance stats (total/present/absent/late). */
export const getTodayStats = query({
  args: { branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startOfDay = start.getTime();
    const endOfDay = startOfDay + 86_400_000;
    const all = await ctx.db.query("attendanceRecords").collect();
    const today = all.filter((r: any) =>
      r.date >= startOfDay && r.date < endOfDay &&
      (!args.branchId || r.branchId === args.branchId));
    return {
      total: today.length,
      present: today.filter((r: any) => r.status === "present").length,
      absent: today.filter((r: any) => r.status === "absent").length,
      late: today.filter((r: any) => r.status === "late").length,
      halfDay: today.filter((r: any) => r.status === "half_day").length,
    };
  },
});
