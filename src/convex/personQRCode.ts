import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── QR Code Generation ──────────────────────────────────

async function generateQRToken(personId: string): Promise<string> {
  const raw = `${personId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join("").substring(0, 32);
}

export const generateQRCode = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    baseUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "people", entity: "personQRCode" }, async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person || person.status === "archived") {
      throw new Error("Person not found or archived");
    }

    // Deactivate any existing QR codes
    const existingQR = await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q: any) => q.eq("personId", args.personId))
      .collect();

    const now = Date.now();
    for (const qr of existingQR) {
      await ctx.db.patch(qr._id, { active: false, updatedAt: now });
    }

    // Generate new QR code
    const qrToken = await generateQRToken(args.personId);
    const baseUrl = args.baseUrl || "https://app.eeos.com";
    const deepLink = `${baseUrl}/p/${args.personId}`;

    const qrId = await ctx.db.insert("personQRCode", {
      personId: args.personId,
      qrToken,
      deepLink,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      qrId,
      qrToken,
      deepLink,
      deepLinkFallback: `eeos://person/${args.personId}`,
    };
  }),
});

export const regenerateQRCode = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    baseUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "personQRCode" }, async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person || person.status === "archived") {
      throw new Error("Person not found or archived");
    }

    // Deactivate any existing QR codes
    const existingQR = await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q: any) => q.eq("personId", args.personId))
      .collect();

    const now = Date.now();
    for (const qr of existingQR) {
      await ctx.db.patch(qr._id, { active: false, updatedAt: now });
    }

    // Generate new QR code
    const baseUrl = args.baseUrl || "https://app.eeos.com";
    const deepLink = `${baseUrl}/p/${args.personId}`;

    const qrToken = await generateQRToken(args.personId);

    const qrId = await ctx.db.insert("personQRCode", {
      personId: args.personId,
      qrToken,
      deepLink,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      qrId,
      qrToken,
      deepLink,
      deepLinkFallback: `eeos://person/${args.personId}`,
    };
  }),
});

export const deactivateQRCode = mutation({
  args: { token: v.optional(v.string()), qrId: v.id("personQRCode") },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "personQRCode" }, async (ctx, args) => {
    const qr = await ctx.db.get(args.qrId);
    if (!qr) throw new Error("QR code not found");
    await ctx.db.patch(args.qrId, { active: false, updatedAt: Date.now() });
    return args.qrId;
  }),
});

// ─── QR Code Lookup ──────────────────────────────────────

export const getPersonByQRToken = query({
  args: { qrToken: v.string() },
  handler: async (ctx, args) => {
    const qrCode = await ctx.db
      .query("personQRCode")
      .withIndex("qrToken", (q) => q.eq("qrToken", args.qrToken))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    if (!qrCode) return null;

    const person = await ctx.db.get(qrCode.personId);
    if (!person || (person as any).status === "archived") return null;

    const profiles = await ctx.db
      .query("personProfiles")
      .withIndex("personId", (q) => q.eq("personId", qrCode.personId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const contacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", qrCode.personId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      person,
      qrCode,
      profiles,
      contacts,
    };
  },
});

export const getPersonQRCode = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
  },
});

export const resolveQRCode = query({
  args: { deepLink: v.string() },
  handler: async (ctx, args) => {
    // Extract personId from deep link (supports both eeos://person/ID and https://app.eeos.com/p/ID)
    const match = args.deepLink.match(/\/p\/([^/]+)$/);
    if (!match) return null;

    const personId = match[1] as Id<"personMaster">;
    const person = await ctx.db.get(personId);
    if (!person || person.status === "archived") return null;

    const qrCode = await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q) => q.eq("personId", personId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    return {
      person,
      qrCode,
    };
  },
});
