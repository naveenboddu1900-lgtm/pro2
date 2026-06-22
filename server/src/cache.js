const memoryStore = new Map();

function now() {
  return Date.now();
}

function isExpired(entry) {
  return entry.expiresAt !== null && entry.expiresAt <= now();
}

export const cacheStats = {
  hits: 0,
  misses: 0,
  writes: 0,
  deletes: 0
};

export async function getCache(key) {
  const entry = memoryStore.get(key);

  if (!entry || isExpired(entry)) {
    memoryStore.delete(key);
    cacheStats.misses += 1;
    return null;
  }

  cacheStats.hits += 1;
  return entry.value;
}

export async function setCache(key, value, ttlSeconds = 60) {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds ? now() + ttlSeconds * 1000 : null
  });
  cacheStats.writes += 1;
}

export async function deleteCacheByPrefix(prefix) {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
      cacheStats.deletes += 1;
    }
  }
}

export function getCacheStats() {
  return {
    ...cacheStats,
    keys: memoryStore.size,
    driver: process.env.CACHE_DRIVER || "memory"
  };
}
