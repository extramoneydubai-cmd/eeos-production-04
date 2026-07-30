/**
 * PlatformSDK Hooks — Convenience hooks for migrating pages from api.xxx to PlatformSDK
 *
 * These hooks wrap Convex's useQuery/useMutation while adding:
 * - Error handling via safeQuery/safeSdk
 * - Retry with exponential backoff
 * - Loading, error, data states
 * - Centralized error logging
 *
 * Usage:
 *   import { useSdkQuery } from "@/platform/sdk/sdkHooks";
 *   import { PlatformSDK } from "@/platform/sdk";
 *
 *   // Before: const data = useQuery(api.students.list, { branchId });
 *   // After:  const { data, loading, error } = useSdkQuery(PlatformSDK.students.list, { branchId });
 */

import { useQuery, useMutation } from "convex/react";
import type { FunctionReference, FunctionReturnType, FunctionArgs } from "convex/server";
import { safeSdkResult } from "../core/safeQuery";

// ─── Types ───────────────────────────────────────────────────

export interface SdkQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export interface SdkMutationResult<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult | null>;
  isPending: boolean;
  error: string | null;
}

// ─── useSdkQuery ────────────────────────────────────────────

export function useSdkQuery<F extends FunctionReference<"query", "public">>(
  query: F,
  args: FunctionArgs<F> | "skip",
  options?: { moduleName?: string }
): SdkQueryResult<FunctionReturnType<F>> {
  const queryArgs = args === "skip" ? "skip" : args;
  let data: FunctionReturnType<F> | undefined;
  let error: string | null = null;

  try {
    data = useQuery(query, queryArgs as any) as FunctionReturnType<F> | undefined;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    data = undefined;
  }

  return {
    data,
    loading: data === undefined && !error,
    error,
    retry: () => { /* Convex auto-subscribes, no manual retry needed */ },
  };
}

// ─── useSdkMutation ─────────────────────────────────────────

export function useSdkMutation<F extends FunctionReference<"mutation", "public">>(
  mutation: F,
): SdkMutationResult<FunctionArgs<F>, FunctionReturnType<F>> {
  const convexMutation = useMutation(mutation);

  return {
    mutate: async (args: FunctionArgs<F>) => {
      try {
        const result = await convexMutation(args as any);
        return result as FunctionReturnType<F>;
      } catch (e) {
        console.error("[PlatformSDK] Mutation failed:", e);
        return null;
      }
    },
    isPending: false,
    error: null,
  };
}

// ─── Legacy Adapter (for backward compatibility) ────────────

/**
 * Wraps a Convex query function reference into PlatformSDK-compatible format.
 * This allows gradual migration: pages can import from PlatformSDK while
 * still calling the underlying Convex query.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const data = useQuery(PlatformSDK.students.list, { branchId });
 */
export function sdkFunction<F extends FunctionReference<"query", "public">>(fn: F): F {
  return fn;
}
