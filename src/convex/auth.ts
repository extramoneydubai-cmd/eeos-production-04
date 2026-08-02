// ─────────────────────────────────────────────────────────────────────────────
// Local auth infrastructure (replaces @convex-dev/auth).
//
// EEOS authenticates with username/password via authHelpers.ts
// (SHA-256 hashes + sessions table), so the @convex-dev/auth runtime is not
// part of the backend. These exports preserve the previous `api.auth.*` API
// surface for any remaining references while keeping the Convex bundle free
// of external auth dependencies.
// ─────────────────────────────────────────────────────────────────────────────
import { v } from "convex/values";
import { action, query } from "./_generated/server";

export const auth = {
  addHttpRoutes(router: unknown) {
    // No OAuth providers are configured — nothing to register here.
    return router;
  },
};

// No OAuth providers are configured, so sign-in via `api.auth.signIn` is not
// supported. Use `api.authHelpers.login` instead.
export const signIn = action({
  args: v.any(),
  handler: async () => {
    throw new Error(
      "OAuth sign-in is not configured. Use authHelpers.login instead.",
    );
  },
});

export const signOut = action({
  args: v.any(),
  handler: async () => {},
});

export const store = action({
  args: v.any(),
  handler: async () => {},
});

export const isAuthenticated = query({
  args: {},
  handler: async () => false,
});
