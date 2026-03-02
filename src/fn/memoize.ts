/**
 * Options for {@link memoize}.
 * @public
 */
export interface MemoizeOptions<F extends (...args: unknown[]) => unknown> {
  /** TTL in milliseconds; entries expire after this long. Omit for no expiry. */
  ttlMs?: number;
  /** Maximum number of entries to keep (LRU eviction). Omit for unbounded. */
  maxSize?: number;
  /** Custom key function. Default: `(...args) => JSON.stringify(args)`. */
  keyFn?: (...args: Parameters<F>) => string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | undefined;
}

interface CacheLookupResult<T> {
  hit: boolean;
  value?: T;
}

/**
 * Memoize a function with optional TTL and size limit.
 * Cache key is computed via keyFn (default: JSON.stringify of arguments).
 * When maxSize is set, least-recently-used entries are evicted.
 *
 * @param fn - Function to memoize (any arity)
 * @param options - ttlMs, maxSize, keyFn
 * @returns Memoized function with the same signature
 *
 * @example
 * ```ts
 * import { memoize } from '@my-scope/utils';
 *
 * const getData = memoize(async (id: string) => fetch(`/api/${id}`).then(r => r.json()), {
 *   ttlMs: 60_000,
 *   maxSize: 100,
 *   keyFn: (id) => id,
 * });
 * ```
 *
 * @example
 * ```js
 * const { memoize } = require('@my-scope/utils');
 * const heavy = memoize(function (x, y) { return x + y; }, { maxSize: 50 });
 * ```
 */
export function memoize<F extends (...args: unknown[]) => unknown>(
  fn: F,
  options: MemoizeOptions<F> = {}
): F {
  const {
    ttlMs,
    maxSize,
    keyFn = (...args: Parameters<F>) => JSON.stringify(args),
  } = options;
  const cache = new Map<string, CacheEntry<ReturnType<F>>>();
  const accessOrder: string[] = [];

  function trimToMaxSize(): void {
    if (maxSize === undefined || accessOrder.length <= maxSize) return;
    while (accessOrder.length > maxSize) {
      const key = accessOrder.shift();
      if (key !== undefined) cache.delete(key);
    }
  }

  function getFresh(key: string): CacheLookupResult<ReturnType<F>> {
    const entry = cache.get(key);
    if (!entry) return { hit: false };
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      cache.delete(key);
      const i = accessOrder.indexOf(key);
      if (i !== -1) accessOrder.splice(i, 1);
      return { hit: false };
    }
    if (maxSize !== undefined) {
      const i = accessOrder.indexOf(key);
      if (i !== -1) accessOrder.splice(i, 1);
      accessOrder.push(key);
    }
    return { hit: true, value: entry.value };
  }

  const wrapped = function (this: unknown, ...args: Parameters<F>): ReturnType<F> {
    const key = keyFn(...args);
    const cached = getFresh(key);
    if (cached.hit) return cached.value as ReturnType<F>;
    const value = fn.apply(this, args) as ReturnType<F>;
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : undefined;
    if (maxSize !== undefined) {
      const existingIndex = accessOrder.indexOf(key);
      if (existingIndex !== -1) accessOrder.splice(existingIndex, 1);
    }
    cache.set(key, { value, expiresAt });
    if (maxSize !== undefined) {
      accessOrder.push(key);
      trimToMaxSize();
    }
    return value;
  } as F;
  return wrapped;
}
