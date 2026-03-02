import { isPlainObject } from "../guards/index.js";

const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Deep merge two values. Source `b` overrides `a`.
 * - Plain objects are merged recursively; arrays and other values are replaced by `b`.
 * - Primitives, dates, class instances: always use `b` when present (not merged).
 * - `__proto__`, `prototype`, and `constructor` keys are ignored for safety.
 *
 * @param a - Base object
 * @param b - Overrides (takes precedence)
 * @returns New object; inputs are not mutated
 *
 * @example
 * ```ts
 * import { deepMerge } from '@my-scope/utils';
 *
 * const merged = deepMerge({ a: 1, nested: { x: 1 } }, { nested: { y: 2 } });
 * // { a: 1, nested: { x: 1, y: 2 } }
 * ```
 *
 * @example
 * ```js
 * const { deepMerge } = require('@my-scope/utils');
 * const config = deepMerge(defaults, userConfig);
 * ```
 */
export function deepMerge<T extends object, U extends object>(a: T, b: U): T & U {
  const result = { ...a } as T & U;
  for (const key of Object.keys(b) as (keyof U)[]) {
    const keyStr = String(key);
    if (BLOCKED_KEYS.has(keyStr)) continue;
    const bVal = b[key];
    if (bVal === undefined) continue;
    const aVal = (result as U)[key];
    if (
      isPlainObject(aVal) &&
      isPlainObject(bVal) &&
      !Array.isArray(aVal) &&
      !Array.isArray(bVal)
    ) {
      (result as Record<string, unknown>)[keyStr] = deepMerge(
        aVal as Record<string, unknown>,
        bVal as Record<string, unknown>
      );
    } else {
      (result as Record<string, unknown>)[keyStr] = bVal;
    }
  }
  return result;
}
