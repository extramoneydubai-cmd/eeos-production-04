/**
 * Secured Convex client factory.
 *
 * Wraps the single ConvexReactClient instance so every dispatch path —
 * `useQuery`, `useQueries`, `useMutation`, `useAction`, `client.query` —
 * automatically attaches the current session token to token-aware functions
 * (see src/lib/token-aware.ts).
 *
 * Rules:
 *  - Injection happens ONLY for functions that declare `token: v.optional(...)`.
 *  - An explicitly-passed `token` in args is never overwritten.
 *  - Signed-out / demo sessions (no token in storage) pass through unchanged,
 *    so legacy claimed-identity flows keep working.
 *
 * The backend (withScopeAndEvents) resolves the REAL performer from the token
 * via the `sessions` table and rejects invalid tokens, so scope checks, audit,
 * timeline and events are enforced end-to-end.
 */

import { ConvexReactClient } from "convex/react";
import { getSessionToken } from "./session-token";
import { TOKEN_AWARE_FUNCTIONS } from "./token-aware";

/** Wraps one client method, injecting `token` into token-aware calls. */
function withToken<T extends (...args: any[]) => any>(original: T): T {
  return ((...args: any[]) => {
    const ref = args[0];
    // FunctionReference objects expose `.name` (e.g. "fixedAssetEngine:adjustStock")
    if (
      ref &&
      typeof ref === "object" &&
      typeof (ref as { name?: unknown }).name === "string" &&
      TOKEN_AWARE_FUNCTIONS.has((ref as { name: string }).name)
    ) {
      const rawArgs = args[1];
      if (rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)) {
        const existing = rawArgs as Record<string, unknown>;
        if (existing.token === undefined) {
          const token = getSessionToken();
          if (token) {
            args = [ref, { ...existing, token }, ...args.slice(2)];
          }
        }
      }
    }
    return original(...args);
  }) as T;
}

/**
 * Creates the app's ConvexReactClient with the secured method wrappers applied.
 * Use this instead of `new ConvexReactClient(...)` in main.tsx.
 */
export function createSecureConvexClient(): ConvexReactClient {
  const client = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

  // Bind the originals BEFORE overriding so `this.sync` keeps working.
  const origMutation = client.mutation.bind(client);
  const origAction = client.action.bind(client);
  const origQuery = client.query.bind(client);
  const origWatchQuery = client.watchQuery.bind(client);

  // useMutation → client.mutation(ref, args, options)
  client.mutation = withToken(origMutation) as ConvexReactClient["mutation"];
  // useAction → client.action(ref, args)
  client.action = withToken(origAction) as ConvexReactClient["action"];
  // client.query(ref, args, ...) — one-shot fetch
  client.query = withToken(origQuery) as ConvexReactClient["query"];
  // useQuery / useQueries / usePaginatedQuery → client.watchQuery(ref, args)
  client.watchQuery = withToken(origWatchQuery) as ConvexReactClient["watchQuery"];

  return client;
}
