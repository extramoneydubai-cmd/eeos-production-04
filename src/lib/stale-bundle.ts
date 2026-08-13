/**
 * Stale bundle recovery.
 *
 * After every VPS rebuild the hashed asset names change (e.g. TasksPage-8YP42mKO.js).
 * Tabs that were already open before the deploy keep the OLD index.html + entry bundle
 * in memory, so their lazy route imports point at chunk files that no longer exist →
 * "Failed to fetch dynamically imported module" / "Loading chunk ... failed".
 *
 * The correct recovery is a full page reload: the fresh index.html (nginx serves it
 * no-store) references the new chunk hashes and the app works again. We do that
 * automatically once, with a time guard so a genuinely broken deploy cannot loop.
 */

const RELOAD_GUARD_KEY = "__eeos_stale_reload_at";
const RELOAD_GUARD_MS = 20_000;

const STALE_CHUNK_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /loading chunk \d+ failed/i,
  /chunkloaderror/i,
  /unable to preload css/i,
  /error loading dynamically imported module/i,
  /dynamically imported module/i,
];

/** True when the error is a lazy-loaded chunk that no longer exists after a redeploy. */
export function isStaleChunkError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack || "" : "";
  const text = `${message} ${stack}`;
  return STALE_CHUNK_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Reload the page once to pick up the fresh bundle. Returns true when a reload
 * was triggered, false when one already happened recently (loop guard).
 */
export function recoverFromStaleBundle(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    const now = Date.now();
    if (now - last < RELOAD_GUARD_MS) {
      // A reload already fired very recently — don't loop on a broken deploy.
      return false;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  } catch {
    // sessionStorage unavailable (private mode etc.) — proceed anyway.
  }

  window.location.reload();
  return true;
}
