import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Login - validates username + password, creates session
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const user = allUsers.find((u) => u.username === args.username);
    if (!user) return { success: false, error: "Invalid username or password" };
    if (user.isDisabled) return { success: false, error: "Account is disabled" };

    if (!user.passwordHash) return { success: false, error: "Password not set" };

    const hash = await sha256(args.password);
    if (user.passwordHash !== hash) return { success: false, error: "Invalid username or password" };

    // Create session
    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
      createdAt: now,
      lastActiveAt: now,
    });

    // Update last login
    await ctx.db.patch(user._id, { lastLoginAt: now });

    return {
      success: true,
      token,
      userId: user._id,
      expiresAt,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    };
  },
});

// Validate session token and return user
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query("sessions").collect();
    const session = allSessions.find((s) => s.token === args.token);
    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId as Id<"users">);
    if (!user || (user as any).isDisabled) return null;

    return {
      _id: user._id,
      name: (user as any).name,
      username: (user as any).username,
      email: (user as any).email,
      role: (user as any).role,
      image: (user as any).image,
      isDisabled: (user as any).isDisabled,
      designationId: (user as any).designationId,
      departmentId: (user as any).departmentId,
      companyId: (user as any).companyId,
      branchId: (user as any).branchId,
      verticalId: (user as any).verticalId,
      teamIds: (user as any).teamIds,
    };
  },
});

// Logout - destroy session
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query("sessions").collect();
    const session = allSessions.find((s) => s.token === args.token);
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Set user password (for admin operations or password reset)
export const setPassword = mutation({
  args: { userId: v.id("users"), password: v.string() },
  handler: async (ctx, args) => {
    const hash = await sha256(args.password);
    await ctx.db.patch(args.userId, { passwordHash: hash });
  },
});

// Seed auth accounts for seeded users
export const seedUserPasswords = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if passwords already seeded
    const allUsers = await ctx.db.query("users").collect();
    const ceo = allUsers.find((u) => u.username === "ceo");
    if (ceo?.passwordHash) return { seeded: false, message: "Passwords already set" };

    const users = await ctx.db.query("users").collect();
    const passwordMap: Record<string, string> = {
      ceo: "admin123",
      cto: "cto123",
      cfo: "cfo123",
      hrhead: "hr123",
      arun: "staff123",
      priya: "staff123",
      rajesh: "staff123",
      sneha: "sneha123",
    };

    for (const user of users) {
      const pw = passwordMap[user.username || ""];
      if (pw) {
        const hash = await sha256(pw);
        await ctx.db.patch(user._id, { passwordHash: hash });
      }
    }

    return { seeded: true, message: "All user passwords seeded" };
  },
});

// Check if any users exist (seeded)
export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db.query("users").collect();
    return count.length > 0;
  },
});

// Get the current user from session token helper (for use in other queries)
export const getUserFromToken = async (ctx: QueryCtx, token: string) => {
    const allSessionsForToken = await ctx.db.query("sessions").collect();
    const session = allSessionsForToken.find((s) => s.token === token);
    if (!session || session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId as Id<"users">);
    if (!user || (user as any).isDisabled) return null;
    return user;
};
