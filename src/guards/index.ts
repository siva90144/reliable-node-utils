/**
 * Runtime type guards. Use with TypeScript for correct narrowing.
 * @module guards
 */

/**
 * Type predicate: narrows out `null` and `undefined`.
 *
 * @param value - Any value
 * @returns `true` if value is not `null` and not `undefined`
 *
 * @example
 * ```ts
 * const arr: (string | undefined)[] = ['a', undefined, 'b'];
 * const defined: string[] = arr.filter(isDefined);
 * ```
 *
 * @example
 * ```js
 * const { isDefined } = require('reliable-node-utils');
 * if (isDefined(maybe)) console.log(maybe.toUpperCase());
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type predicate: narrows to a non-empty string (length > 0).
 * Rejects `null`, `undefined`, non-strings, and `""`.
 *
 * @param value - Any value
 * @returns `true` if value is a string with at least one character
 *
 * @example
 * ```ts
 * function greet(name: unknown) {
 *   if (isNonEmptyString(name)) return `Hello, ${name}`;
 *   return 'Hello, stranger';
 * }
 * ```
 *
 * @example
 * ```js
 * const { isNonEmptyString } = require('reliable-node-utils');
 * if (isNonEmptyString(input)) validate(input);
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Type predicate: narrows to a plain object (object created by `{}` or `Object.create(null)`).
 * Rejects `null`, arrays, and class instances (e.g. Date, RegExp).
 *
 * @param value - Any value
 * @returns `true` if value is a plain object (record-like)
 *
 * @example
 * ```ts
 * function mergeConfig(config: unknown) {
 *   if (!isPlainObject(config)) throw new Error('Config must be an object');
 *   return deepMerge(defaults, config);
 * }
 * ```
 *
 * @example
 * ```js
 * const { isPlainObject } = require('reliable-node-utils');
 * if (isPlainObject(obj)) Object.keys(obj).forEach(k => process(k, obj[k]));
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}
