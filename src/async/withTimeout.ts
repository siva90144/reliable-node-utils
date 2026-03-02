import { AbortError, TimeoutError } from "../errors.js";

/**
 * Options for {@link withTimeout}.
 * @public
 */
export interface WithTimeoutOptions {
  /** AbortSignal to respect; when aborted, the timeout is cancelled and AbortError is thrown. */
  signal?: AbortSignal;
}

/**
 * Run a promise or async function with a time limit.
 * If the time limit is exceeded, the returned promise rejects with TimeoutError.
 * Supports AbortSignal: aborting clears the timer and rejects with AbortError.
 *
 * @param promiseOrFn - A Promise or a function returning a Promise
 * @param ms - Time limit in milliseconds
 * @param options - Optional { signal }
 * @returns Promise resolving to the same value as the input promise
 * @throws {TypeError} When `ms` is negative or non-finite
 * @throws {TimeoutError} When the operation exceeds `ms`
 * @throws {AbortError} When `signal` is aborted
 *
 * @example
 * ```ts
 * import { withTimeout } from 'reliable-node-utils';
 *
 * const data = await withTimeout(fetch('/api/data').then(r => r.json()), 5000);
 * // or
 * const data = await withTimeout(() => fetch('/api/data').then(r => r.json()), 5000, {
 *   signal: controller.signal,
 * });
 * ```
 *
 * @example
 * ```js
 * const { withTimeout } = require('reliable-node-utils');
 * const result = await withTimeout(longRunningTask(), 3000);
 * ```
 */
export async function withTimeout<T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  ms: number,
  options: WithTimeoutOptions = {}
): Promise<T> {
  const { signal } = options;

  if (!Number.isFinite(ms) || ms < 0) {
    throw new TypeError("withTimeout: ms must be a finite number >= 0");
  }

  if (signal?.aborted) {
    throw new AbortError("Aborted");
  }
  const promise = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${ms}ms`));
    }, ms);
  });

  const abortHandler = () => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    reject(new AbortError("Aborted"));
  };
  let reject: (reason: unknown) => void;
  const abortPromise = new Promise<never>((_, rej) => {
    reject = rej;
  });
  signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    const result = await Promise.race([promise, timeoutPromise, abortPromise]);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortHandler);
    return result;
  } catch (err) {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortHandler);
    throw err;
  }
}
