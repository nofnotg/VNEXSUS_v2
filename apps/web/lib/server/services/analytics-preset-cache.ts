import { recordAnalyticsMetric } from "../analytics-observability";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type CacheStats = {
  hits: number;
  misses: number;
  size: number;
  ttlMs: number;
};

const CACHE_TTL_MS = Number(process.env.ANALYTICS_PRESET_CACHE_TTL_MS ?? 60_000);

const ownedPresetCache = new Map<string, CacheEntry<unknown>>();
const sharedPresetCache = new Map<string, CacheEntry<unknown>>();

const ownedStats: CacheStats = { hits: 0, misses: 0, size: 0, ttlMs: CACHE_TTL_MS };
const sharedStats: CacheStats = { hits: 0, misses: 0, size: 0, ttlMs: CACHE_TTL_MS };

function getValue<T>(
  store: Map<string, CacheEntry<unknown>>,
  stats: CacheStats,
  key: string,
  metricKey: "preset_cache_owned" | "preset_cache_shared"
): T | null {
  const entry = store.get(key);
  if (!entry) {
    stats.misses += 1;
    recordAnalyticsMetric(metricKey, { cache: "miss" });
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    stats.size = store.size;
    stats.misses += 1;
    recordAnalyticsMetric(metricKey, { cache: "miss" });
    return null;
  }

  stats.hits += 1;
  recordAnalyticsMetric(metricKey, { cache: "hit" });
  return entry.value as T;
}

function setValue<T>(store: Map<string, CacheEntry<unknown>>, stats: CacheStats, key: string, value: T) {
  store.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
  stats.size = store.size;
}

export function getOwnedPresetCache<T>(userId: string) {
  return getValue<T>(ownedPresetCache, ownedStats, userId, "preset_cache_owned");
}

export function setOwnedPresetCache<T>(userId: string, value: T) {
  setValue(ownedPresetCache, ownedStats, userId, value);
}

export function getSharedPresetCache<T>(email: string) {
  return getValue<T>(sharedPresetCache, sharedStats, email.toLowerCase(), "preset_cache_shared");
}

export function setSharedPresetCache<T>(email: string, value: T) {
  setValue(sharedPresetCache, sharedStats, email.toLowerCase(), value);
}

export function invalidatePresetCaches(args: { ownerUserId?: string; sharedEmails?: string[] }) {
  if (args.ownerUserId) {
    ownedPresetCache.delete(args.ownerUserId);
    ownedStats.size = ownedPresetCache.size;
  }

  for (const email of args.sharedEmails ?? []) {
    sharedPresetCache.delete(email.toLowerCase());
  }
  sharedStats.size = sharedPresetCache.size;
}

export function getPresetCacheStatsSnapshot() {
  return {
    owned: { ...ownedStats },
    shared: { ...sharedStats }
  };
}
