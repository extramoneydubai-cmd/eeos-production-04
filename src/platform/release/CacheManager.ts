/**
 * CacheManager — Manages browser caches with versioning, invalidation, and selective clearing.
 *
 * Manages:
 *  - Browser cache (Service Worker)
 *  - SDK cache (sessionStorage)
 *  - Workspace cache (sessionStorage)
 *  - Dashboard cache
 *  - Analytics cache
 *  - Offline queue (sessionStorage)
 *  - Timeline cache
 *
 * Supports:
 *  - Versioned cache
 *  - Invalidate
 *  - Purge
 *  - Refresh
 *  - Selective clear
 *  - Automatic cleanup
 */

const CACHE_VERSION_KEY = "eeos_cache_version";
const CURRENT_CACHE_VERSION = "1.0.0";

export type CacheNamespace = "sdk" | "workspace" | "dashboard" | "analytics" | "offline" | "timeline" | "settings";

class CacheManagerImpl {
  private cachePrefix = "eeos_cache_";

  /** Get cache version */
  getCacheVersion(): string {
    try {
      return localStorage.getItem(CACHE_VERSION_KEY) || CURRENT_CACHE_VERSION;
    } catch {
      return CURRENT_CACHE_VERSION;
    }
  }

  /** Check if cache is stale (version mismatch) */
  get isStale(): boolean {
    return this.getCacheVersion() !== CURRENT_CACHE_VERSION;
  }

  /** Store a value in cache */
  set<T>(namespace: CacheNamespace, key: string, value: T): void {
    try {
      const storageKey = `${this.cachePrefix}${namespace}_${key}`;
      const data = JSON.stringify({
        version: CURRENT_CACHE_VERSION,
        timestamp: Date.now(),
        value,
      });
      sessionStorage.setItem(storageKey, data);
    } catch {}
  }

  /** Retrieve a value from cache */
  get<T>(namespace: CacheNamespace, key: string, maxAge?: number): T | null {
    try {
      const storageKey = `${this.cachePrefix}${namespace}_${key}`;
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;

      const data = JSON.parse(raw);

      // Version check
      if (data.version !== CURRENT_CACHE_VERSION) {
        this.remove(namespace, key);
        return null;
      }

      // Age check
      if (maxAge && Date.now() - data.timestamp > maxAge) {
        this.remove(namespace, key);
        return null;
      }

      return data.value as T;
    } catch {
      return null;
    }
  }

  /** Remove a specific cache entry */
  remove(namespace: CacheNamespace, key: string): void {
    try {
      const storageKey = `${this.cachePrefix}${namespace}_${key}`;
      sessionStorage.removeItem(storageKey);
    } catch {}
  }

  /** Clear all entries in a namespace */
  clearNamespace(namespace: CacheNamespace): void {
    try {
      const prefix = `${this.cachePrefix}${namespace}_`;
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(prefix)) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}
  }

  /** Clear ALL caches */
  clearAll(): void {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.cachePrefix)) {
          sessionStorage.removeItem(key);
        }
      }
      // Clear localStorage cache
      const keysToRemove: string[] = [];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.cachePrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  /** Invalidate all caches (bump version) */
  invalidate(): void {
    try {
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
      this.clearAll();
    } catch {}
  }

  /** Refresh a cached value */
  refresh<T>(namespace: CacheNamespace, key: string, fetcher: () => Promise<T>): Promise<T> {
    return fetcher().then((value) => {
      this.set(namespace, key, value);
      return value;
    });
  }

  /** Get cache stats */
  getStats(): { namespaces: Record<string, number>; totalEntries: number; version: string } {
    const namespaces: Record<string, number> = {};
    let totalEntries = 0;

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.cachePrefix)) {
          totalEntries++;
          const parts = key.replace(this.cachePrefix, "").split("_");
          const ns = parts[0];
          namespaces[ns] = (namespaces[ns] || 0) + 1;
        }
      }
    } catch {}

    return {
      namespaces,
      totalEntries,
      version: this.getCacheVersion(),
    };
  }

  /** Run automatic cleanup of expired entries */
  cleanup(maxAge = 3600000): number {
    let cleaned = 0;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.cachePrefix)) {
          try {
            const raw = sessionStorage.getItem(key);
            if (raw) {
              const data = JSON.parse(raw);
              if (Date.now() - data.timestamp > maxAge) {
                sessionStorage.removeItem(key);
                cleaned++;
              }
            }
          } catch {}
        }
      }
    } catch {}
    return cleaned;
  }
}

export const cacheManager = new CacheManagerImpl();
