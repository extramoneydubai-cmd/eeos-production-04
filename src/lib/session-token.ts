/**
 * Session Token access — single source of truth for the session credential.
 *
 * The token is issued by `authHelpers.login` and stored under this key.
 * `useAuth` (src/hooks/use-auth.ts) writes it on login and clears it on logout;
 * the secured Convex client (src/lib/convex-client.ts) reads it to attach to
 * every token-aware backend function so scope checks run against the REAL
 * performer resolved server-side from the `sessions` table.
 */

export const SESSION_TOKEN_KEY = "eeos_session_token";

/**
 * Returns the current session token, or null when signed out / demo mode.
 * Safe to call outside React (client wrapper, utils, SDK layer).
 */
export function getSessionToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}
