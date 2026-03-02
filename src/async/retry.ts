import { AbortError, RetryExhaustedError } from "../errors.js";

/**
 * Options for {@link retry}.
 * @public
 */
export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3. */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Default: 1000. */
  baseDelayMs?: number;
  /** Maximum delay in ms. Default: 30000. */
  maxDelayMs?: number;
  /** If true, add random jitter to delays. Default: true. */
  jitter?: boolean;
  /** Called before each retry with attempt index (1-based) and error. */
  onRetry?: (attempt: number, error: unknown) => void | Promise<void>;
  /** When aborted, retry stops and rejects with AbortError. */
  signal?: AbortSignal;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry" | "signal">> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: true,
};

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new AbortError("Aborted"));
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(id);
      signal?.removeEventListener("abort", onAbort);
      reject(new AbortError("Aborted"));
    };
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function assertValidRetryOptions(
  fn: () => Promise<unknown>,
  options: Required<Omit<RetryOptions, "onRetry" | "signal">> &
    Pick<RetryOptions, "onRetry">
): void {
  if (typeof fn !== "function") {
    throw new TypeError("retry: fn must be a function returning a Promise");
  }
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new TypeError("retry: maxAttempts must be an integer >= 1");
  }
  if (!Number.isFinite(options.baseDelayMs) || options.baseDelayMs < 0) {
    throw new TypeError("retry: baseDelayMs must be a finite number >= 0");
  }
  if (!Number.isFinite(options.maxDelayMs) || options.maxDelayMs < 0) {
    throw new TypeError("retry: maxDelayMs must be a finite number >= 0");
  }
  if (options.maxDelayMs < options.baseDelayMs) {
    throw new TypeError("retry: maxDelayMs must be >= baseDelayMs");
  }
  if (typeof options.jitter !== "boolean") {
    throw new TypeError("retry: jitter must be a boolean");
  }
  if (options.onRetry !== undefined && typeof options.onRetry !== "function") {
    throw new TypeError("retry: onRetry must be a function");
  }
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Compute delay with optional jitter (full jitter: [0, computed]).
 * @internal
 */
function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt - 1);
  const capped = clamp(baseDelayMs, exponential, maxDelayMs);
  if (!jitter) return capped;
  return Math.random() * capped;
}

/**
 * Retry an async function with exponential backoff and optional jitter.
 * Supports AbortSignal; calls onRetry before each retry.
 *
 * @param fn - Async function to run (no arguments). Return value is passed through.
 * @param options - maxAttempts, baseDelayMs, maxDelayMs, jitter, onRetry, signal
 * @returns Promise resolving to the return value of `fn`
 * @throws {TypeError} When options are invalid
 * @throws {AbortError} When `signal` is aborted
 * @throws {RetryExhaustedError} When all attempts fail (last error as cause)
 *
 * @example
 * ```ts
 * import { retry } from 'reliable-node-utils';
 *
 * const data = await retry(() => fetchJSON('/api/data'), {
 *   maxAttempts: 5,
 *   baseDelayMs: 500,
 *   onRetry: (attempt, err) => console.warn(`Attempt ${attempt} failed`, err),
 *   signal: controller.signal,
 * });
 * ```
 *
 * @example
 * ```js
 * const { retry } = require('reliable-node-utils');
 * const result = await retry(async () => callExternalApi(), { maxAttempts: 3 });
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  assertValidRetryOptions(fn, opts);
  const { maxAttempts, baseDelayMs, maxDelayMs, jitter, onRetry, signal } = opts;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new AbortError("Aborted");
    }
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) {
        throw new RetryExhaustedError(
          `Retry exhausted after ${maxAttempts} attempt(s)`,
          attempt,
          lastError
        );
      }
      if (onRetry) {
        await Promise.resolve(onRetry(attempt, err));
      }
      if (signal?.aborted) {
        throw new AbortError("Aborted");
      }
      const waitMs = computeDelay(attempt, baseDelayMs, maxDelayMs, jitter);
      await delay(waitMs, signal);
    }
  }
  throw new RetryExhaustedError(
    `Retry exhausted after ${maxAttempts} attempt(s)`,
    maxAttempts,
    lastError!
  );
}
