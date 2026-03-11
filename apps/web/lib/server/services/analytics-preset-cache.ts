type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_TTL_MS = 60_000;

const ownedPresetCache = new Map<string, CacheEntry<unknown>>();
const sharedPresetCache = new Map<string, CacheEntry<unknown>>();

function getValue<T>(store: Map<string, CacheEntry<unknown>>, key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return entry.value as T;
}

function setValue<T>(store: Map<string, CacheEntry<unknown>>, key: string, value: T) {
  store.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

export function getOwnedPresetCache<T>(userId: string) {
  return getValue<T>(ownedPresetCache, userId);
}

export function setOwnedPresetCache<T>(userId: string, value: T) {
  setValue(ownedPresetCache, userId, value);
}

export function getSharedPresetCache<T>(email: string) {
  return getValue<T>(sharedPresetCache, email.toLowerCase());
}

export function setSharedPresetCache<T>(email: string, value: T) {
  setValue(sharedPresetCache, email.toLowerCase(), value);
}

export function invalidatePresetCaches(args: { ownerUserId?: string; sharedEmails?: string[] }) {
  if (args.ownerUserId) {
    ownedPresetCache.delete(args.ownerUserId);
  }

  for (const email of args.sharedEmails ?? []) {
    sharedPresetCache.delete(email.toLowerCase());
  }
}
