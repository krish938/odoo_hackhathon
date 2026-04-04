/**
 * Simple in-memory cache with TTL.
 * Suitable for single-server deployments (products, categories, attributes etc.)
 */
const cache = new Map();

const get = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const set = (key, value, ttlMs = 60000) => {
  cache.set(key, { value, expires: Date.now() + ttlMs });
};

const invalidate = (key) => {
  // Support wildcard prefix: invalidate('products_list') matches 'products_list_*'
  if (key.endsWith('*')) {
    const prefix = key.slice(0, -1);
    for (const k of cache.keys()) {
      if (k.startsWith(prefix)) cache.delete(k);
    }
  } else {
    // Invalidate all keys that start with the given key (covers all filter variations)
    for (const k of cache.keys()) {
      if (k.startsWith(key)) cache.delete(k);
    }
  }
};

const clear = () => cache.clear();

const size = () => cache.size;

module.exports = { get, set, invalidate, clear, size };
